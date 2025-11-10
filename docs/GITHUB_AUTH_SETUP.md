# GitHub Authentication Setup Guide

## ✅ Current Status: LIVE and Working!

**GitHub Sign-In is now fully functional!** It uses a Firebase Cloud Function to securely handle the OAuth token exchange.

**How it works**:
1. User clicks "Continue with GitHub" ✅
2. Chrome Identity API launches GitHub OAuth popup ✅
3. User authorizes app → receives authorization code ✅
4. Extension calls Cloud Function with code ✅
5. Cloud Function exchanges code for access token (server-side, secure) ✅
6. Cloud Function creates Firebase custom token ✅
7. Extension signs in with custom token ✅
8. User is authenticated! ✅

**Backend**: Firebase Cloud Function (`functions/src/githubAuth.ts`) deployed to `us-central1`

---

## Overview

GitHub Sign-In is fully implemented and ready to use. This guide covers the setup that has already been completed.

## Prerequisites

- GitHub account
- Firebase Console access for your project
- Chrome extension already built and loaded

## Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** in the left sidebar
3. Click **New OAuth App**
4. Fill in the form:
   - **Application name**: `Prompt Blocker` (or your preferred name)
   - **Homepage URL**: `https://promptblocker.com`
   - **Application description**: `Privacy-first extension for managing AI conversations`
   - **Authorization callback URL**: `https://__/auth/handler` (Firebase will provide the exact URL)
5. Click **Register application**
6. On the next page, you'll see:
   - **Client ID** (save this)
   - Click **Generate a new client secret** and save the secret

**IMPORTANT**: Keep the GitHub page open - you'll need to update the callback URL in Step 2.

## Step 2: Configure Cloud Function Environment Variables

GitHub credentials are stored in `functions/.env` (already configured):

```bash
GITHUB_CLIENT_ID=Ov23li8pSP8uzrl6DN7A
GITHUB_CLIENT_SECRET=f45259e247861ceea34e483417ecb2339269c1f4
```

These are automatically loaded when the Cloud Function is deployed.

## Step 3: Grant IAM Permissions (CRITICAL)

The Cloud Function needs permission to create Firebase custom tokens. This requires the `Service Account Token Creator` role:

1. Go to [Google Cloud IAM](https://console.cloud.google.com/iam-admin/iam?project=promptblocker-prod)
2. Find the **Compute Engine default service account**: `861822607891-compute@developer.gserviceaccount.com`
3. Click the pencil/edit icon on that row
4. Click "ADD ANOTHER ROLE"
5. Search for and select: `Service Account Token Creator`
6. Click "SAVE"

**Why this is needed**: Firebase Functions v2 runs under the Compute Engine service account, and it needs explicit permission to generate Firebase auth tokens.

## Step 4: Update GitHub OAuth App Callback URL

1. Go back to your GitHub OAuth App settings at https://github.com/settings/developers
2. Update the **Authorization callback URL** field to:
   ```
   https://gpmmdongkfeimmejkbcnilmacgngnjgi.chromiumapp.org/
   ```
   (This is the Chrome extension callback URL using the extension ID)
3. Click **Update application**

## Step 5: Deploy Cloud Function

```bash
cd functions
npm run build
firebase deploy --only functions:githubAuth
```

The function will be deployed to: `https://us-central1-promptblocker-prod.cloudfunctions.net/githubAuth`

## Step 6: Test GitHub Sign-In

1. Load your Chrome extension (already built with `npm run build`)
2. Click the Prompt Blocker icon
3. Click **Sign In** if not already signed in
4. You should now see THREE auth buttons:
   - **Continue with Google** (existing)
   - **Continue with GitHub** (new!)
   - Sign in with Email/Password
5. Click **Continue with GitHub**
6. You should see:
   - Info message: "A popup window will open. Please select your GitHub account."
   - Auth modal closes
   - GitHub OAuth popup opens
   - Authorize the app
   - Popup closes
   - You're signed in!

## Troubleshooting

### Issue: "Permission 'iam.serviceAccounts.signBlob' denied"

**Cause**: Cloud Function doesn't have permission to create custom tokens

**Solution**:
1. Go to [Google Cloud IAM](https://console.cloud.google.com/iam-admin/iam?project=promptblocker-prod)
2. Find `861822607891-compute@developer.gserviceaccount.com` (Compute Engine default service account)
3. Add role: `Service Account Token Creator`
4. Redeploy function: `firebase deploy --only functions:githubAuth`

### Issue: "redirect_uri_mismatch" error

**Cause**: Callback URL in GitHub OAuth App doesn't match extension callback URL

**Solution**:
1. Get extension ID from chrome://extensions (should be `gpmmdongkfeimmejkbcnilmacgngnjgi`)
2. Go to https://github.com/settings/developers
3. Update Authorization callback URL to: `https://EXTENSION_ID.chromiumapp.org/`
4. Example: `https://gpmmdongkfeimmejkbcnilmacgngnjgi.chromiumapp.org/`

### Issue: "Popup blocked" error

**Cause**: Browser is blocking the OAuth popup

**Solution**: The error modal should automatically appear with:
- Title: "GitHub Sign-In Blocked"
- Message: "Your browser blocked the GitHub sign-in popup. To fix this: 1. Allow popups for this extension in your browser settings, 2. Or use Email/Password sign-in instead (100% reliable)"
- Button: "Use Email/Password Instead" (auto-switches to email form)

### Issue: GitHub sign-in works but no user data

**Cause**: OAuth scopes might be incorrect

**Solution**: Already configured in code:
```typescript
oauth: {
  scopes: ['user:email', 'read:user'],
}
```

If issues persist, check browser console for detailed error messages.

## What Was Implemented

The following code changes enable GitHub Sign-In:

### 1. Provider Registry (`src/lib/authProviders.ts:83`)
```typescript
github: {
  id: 'github',
  name: 'GitHub',
  icon: '💻',
  enabled: true, // ✅ Enabled
  platformSupport: {
    windows: 'good',
    mac: 'poor', // Same popup issues as Google
    linux: 'good',
  },
  display: {
    buttonText: 'Continue with GitHub',
    buttonClass: 'btn-github',
    order: 3,
  },
  oauth: {
    scopes: ['user:email', 'read:user'],
  },
},
```

### 2. Sign-In Handler (`src/popup/components/authModal.ts:290`)
- `handleGitHubSignIn()` function
- Uses `chrome.identity.launchWebAuthFlow()` for OAuth
- Firebase `GithubAuthProvider` for authentication
- Error handling with `getProviderErrorGuidance()`
- Email/password fallback on failure

### 3. UI Components (`src/popup/popup-v2.html`)
- GitHub button in Sign-In view (line 862-867)
- GitHub button in Sign-Up view (line 907-912)
- Info message display area

### 4. Styles (`src/popup/styles/auth.css:83`)
```css
.btn-github {
  background: #24292e;
  color: white;
  border: 1px solid #1b1f23;
  font-weight: 500;
}

.btn-github:hover {
  background: #2f363d;
  border-color: #444d56;
}
```

## Platform Support

| Platform | Support Level | Notes |
|----------|---------------|-------|
| **Windows** | ⭐⭐ Good | Works reliably |
| **Mac** | ⭐ Poor | Popup blocking issues (same as Google) |
| **Linux** | ⭐⭐ Good | Works reliably |

**Mac Users**: GitHub Sign-In may experience popup blocking. Email/Password is recommended for Mac users. The error modal will automatically guide them to the fallback option.

**Future**: Apple Sign-In will be the recommended option for Mac users (excellent support, no popup issues).

## Next Steps

Once GitHub Sign-In is working:

1. **Test on all platforms**:
   - Windows: Should work well
   - Mac: Test popup blocking, verify error modal guides users
   - Linux: Should work well

2. **Monitor analytics**: Track which auth methods users prefer
   - Google vs GitHub vs Email
   - Platform breakdown (Windows/Mac/Linux)

3. **Phase 3 - Apple Sign-In** (for Mac users):
   - Set `enabled: true` in `src/lib/authProviders.ts:68`
   - Follow similar setup process
   - Apple Sign-In has excellent Mac support (no popup issues)

## Questions?

If you encounter issues:
1. Check browser console for detailed errors
2. Verify Firebase Console shows "GitHub" as enabled
3. Test with a different GitHub account
4. Try Email/Password as fallback
5. Refer to `docs/development/AUTH_PROVIDER_GUIDE.md` for detailed implementation docs

---

**Implementation Date**: 2025-11-09
**Deployment Date**: 2025-11-09
**Status**: ✅ LIVE and Working
**Phase**: 2 (Multi-Provider Auth) - Complete

**Cloud Function**: `githubAuth` deployed to `us-central1`
**GitHub OAuth App**: Configured with extension callback URL
**IAM Permissions**: Service Account Token Creator granted to Compute Engine service account
