# Deploying GitHub Authentication

## ✅ Status: DEPLOYED AND WORKING

GitHub authentication is now live with **email-based account linking**!

**Deployment completed**: 2025-11-09
**Account Linking Added**: 2025-11-09

## What Was Done

1. ✅ Created GitHub OAuth App
2. ✅ Set environment variables in `functions/.env`
3. ✅ Deployed Cloud Function to `us-central1`
4. ✅ Granted IAM permissions to Compute Engine service account
5. ✅ Updated GitHub OAuth App callback URL
6. ✅ **Implemented email-based account linking**
7. ✅ **Added encryption provider tracking**
8. ✅ **Created auth issue banner for UX**

## For Reference: Deployment Steps Completed

## Step 1: Set Environment Variables ✅ DONE

Environment variables are configured in `functions/.env`:

```bash
GITHUB_CLIENT_ID=Ov23li8pSP8uzrl6DN7A
GITHUB_CLIENT_SECRET=f45259e247861ceea34e483417ecb2339269c1f4
```

**Note**: Firebase Functions v2 uses `.env` files instead of the deprecated `functions.config()` API.

## Step 2: Grant IAM Permissions ✅ DONE

**CRITICAL**: The Cloud Function needs `Service Account Token Creator` role to create Firebase custom tokens.

Granted to: `861822607891-compute@developer.gserviceaccount.com` (Compute Engine default service account)

**Why**: Firebase Functions v2 runs under the Compute Engine service account, not the Firebase Admin SDK account.

## Step 3: Build and Deploy ✅ DONE

```bash
cd functions
npm run build
firebase deploy --only functions:githubAuth
```

**Deployed to**: `https://us-central1-promptblocker-prod.cloudfunctions.net/githubAuth`

## Step 4: Update GitHub OAuth App Callback URL ✅ DONE

Updated callback URL to:
```
https://epdcengjjokgilhjfdoielmmkbjbnabk.chromiumapp.org/
```

Extension ID: `epdcengjjokgilhjfdoielmmkbjbnabk`

## Step 5: Test GitHub Sign-In

1. Rebuild extension: `npm run build` (from root directory)
2. Reload extension in Chrome
3. Click "Sign In"
4. You should now see **3 buttons**:
   - Continue with Google
   - Continue with GitHub ✅
   - Sign in with Email

5. Click "Continue with GitHub"
6. Authorize with GitHub
7. You should be signed in!

## Troubleshooting

### Error: "Firebase Functions not configured"

**Cause**: Environment variables not set

**Solution**:
```bash
firebase functions:config:get
```

Should show:
```json
{
  "github": {
    "client_id": "Ov23li8pSP8uzrl6DN7A",
    "client_secret": "YOUR_SECRET"
  }
}
```

### Error: "redirect_uri_mismatch"

**Cause**: GitHub OAuth App callback URL doesn't match extension ID

**Solution**:
1. Get extension ID from chrome://extensions
2. Update GitHub OAuth App with: `https://EXTENSION_ID.chromiumapp.org/`

### Error: "auth/internal-error"

**Cause**: Cloud Function not deployed or callable

**Solution**:
```bash
firebase deploy --only functions:githubAuth
```

Verify deployment:
```bash
firebase functions:log --only githubAuth
```

### Cloud Function Logs

View logs to debug issues:

```bash
# Real-time logs
firebase functions:log --only githubAuth

# Or in Firebase Console
# https://console.firebase.google.com/project/YOUR_PROJECT/functions/logs
```

## How It Works (With Account Linking)

```
1. User clicks "Continue with GitHub"
   ↓
2. Chrome opens GitHub OAuth popup
   ↓
3. User authorizes app
   ↓
4. GitHub redirects with authorization code
   ↓
5. Extension calls Cloud Function with code
   ↓
6. Cloud Function:
   - Exchanges code for access token (with client secret)
   - Gets user info from GitHub API
   - **CHECKS: Does email match existing user?**
     - YES → Return existing Google/Email UID (preserves encrypted data) ✅
     - NO → Create new GitHub UID
   - Returns Firebase custom token
   ↓
7. Extension signs in with custom token
   ↓
8. User is authenticated with correct UID! ✅
```

### Account Linking Logic

**Scenario 1: Same Email (Account Linking Works)**
```
1. User signs in with Google (email: john@gmail.com)
   → Creates Firebase user with UID: google:123456
   → Data encrypted with this UID

2. User signs out, then signs in with GitHub (email: john@gmail.com)
   → Cloud Function finds existing user by email
   → Returns UID: google:123456 (NOT creating new GitHub UID)
   → Data decrypts successfully! ✅
```

**Scenario 2: Different Email (Shows Helpful Banner)**
```
1. User signs in with Google (email: john@gmail.com)
   → Data encrypted with UID: google:123456

2. User signs out, then signs in with GitHub (email: john@github.com)
   → Cloud Function doesn't find matching email
   → Creates new UID: github:789
   → Decryption fails (wrong UID)
   → Shows banner: "Your data was encrypted with Google (john@gmail.com)"
   → User clicks "Reset & Try Again" → guided to use Google ✅
```

## Cost

Firebase Cloud Functions pricing:
- **Free tier**: 2M invocations/month
- GitHub auth uses **1 invocation per sign-in**
- Unless you have millions of users, this will be free

## Security

- ✅ Client secret never exposed to extension
- ✅ Access token only handled server-side
- ✅ Firebase custom tokens are short-lived
- ✅ GitHub scopes limited to `user:email` and `read:user`

## Next Steps

Once GitHub auth is working:
1. Consider adding Apple Sign-In for better Mac support
2. Monitor Cloud Function usage in Firebase Console
3. Set up alerts for function errors

---

**Deployment Checklist**:
- [x] Set environment variables in `functions/.env`
- [x] Grant IAM permissions to Compute Engine service account
- [x] Deploy Cloud Function to us-central1
- [x] Update GitHub OAuth callback URL with extension ID
- [x] Test sign-in flow
- [x] Verify no errors in logs

**Deployment Date**: 2025-11-09
**Status**: ✅ LIVE and Working
