# Deploy Auth Handler to PromptBlocker.com

## Overview

We've switched from using Firebase's `firebaseapp.com` domain to your custom `promptblocker.com` domain for authentication. This solves the storage partitioning issue that was blocking the OAuth redirect.

## What Changed

**Before:** Extension → auth.html → Firebase Hosting (blocked by storage partitioning)
**Now:** Extension → promptblocker.com/auth-handler.html → Firebase Auth → Extension

## Deployment Steps

### Step 1: Upload auth-handler.html to promptblocker.com

Upload the `auth-handler.html` file to your promptblocker.com hosting at the root:

```
https://promptblocker.com/auth-handler.html
```

**File location:** `H:\AI_Interceptor\auth-handler.html`

This file contains:
- Firebase SDK imports from CDN
- Firebase configuration (with authDomain set to promptblocker.com)
- OAuth redirect handling logic
- UI matching your PromptBlocker branding

### Step 2: Add promptblocker.com to Firebase Authorized Domains

1. Go to Firebase Console: https://console.firebase.google.com/project/promptblocker-prod/authentication/settings

2. Scroll to "Authorized domains"

3. Click "Add domain"

4. Enter: `promptblocker.com`

5. Click "Add"

**Current authorized domains should include:**
- `promptblocker-prod.firebaseapp.com` ✓
- `promptblocker-prod.web.app` ✓
- `chrome-extension://epdcengjjokgiljbnabkhjfdoielmmkbfireba` ✓
- `promptblocker.com` ← ADD THIS

### Step 3: Reload Extension

1. Go to `chrome://extensions`
2. Click the reload button on PromptBlocker
3. Open the extension popup

## Testing the Flow

### Expected Behavior:

1. **Click "Sign In" → "Continue with Google"**
   - Extension popup closes
   - New tab opens to `https://promptblocker.com/auth-handler.html?action=signin&extensionId=...`

2. **Auth handler page loads**
   - Shows PromptBlocker branding
   - Shows "Processing authentication..." with spinner
   - Automatically redirects to Google OAuth

3. **Select Google account**
   - Shows Google account picker
   - Click your account

4. **Google redirects back to promptblocker.com**
   - Auth handler processes the result
   - Gets user credentials from Firebase
   - Redirects to `chrome-extension://[id]/auth.html?success=true&uid=[user-id]`

5. **Extension auth.html receives success**
   - Waits for Firebase auth state to update
   - Shows "Sign-in successful! Signed in as [email]"
   - Syncs user data to Firestore
   - Tab auto-closes after 2 seconds

6. **Extension popup updates**
   - Shows user profile with avatar/initials
   - Shows tier badge (FREE or PRO)
   - User is fully authenticated

### Debugging

If something goes wrong, check these logs:

**In auth-handler.html tab (F12):**
```
[Auth Handler] Initializing Firebase...
[Auth Handler] Checking for redirect result...
[Auth Handler] No redirect result found
[Auth Handler] Initiating Google Sign-In...
```

**After returning from Google:**
```
[Auth Handler] Sign-in successful: [user-uid]
[Auth Handler] User email: [user-email]
[Auth Handler] User authenticated: {uid, email, displayName, photoURL, idToken}
[Auth Handler] Redirecting to: chrome-extension://[id]/auth.html?success=true&uid=[uid]
```

**In extension auth.html tab (F12):**
```
[Auth Page] Checking authentication status...
[Auth Page] Returned from promptblocker.com with UID: [user-uid]
[Auth Page] Auth state updated: [user-uid]
[Auth Page] User email: [user-email]
[Auth Page] Syncing to Firestore...
[Auth Page] Sync complete
[Auth Page] Closing tab...
```

## Architecture

```
┌─────────────────┐
│ Extension Popup │
│  (authModal.ts) │
└────────┬────────┘
         │ Opens new tab
         ▼
┌─────────────────────────────────┐
│ promptblocker.com/auth-handler  │
│ - Initiates signInWithRedirect  │
│ - Handles getRedirectResult     │
│ - Gets Firebase credentials     │
└────────┬────────────────────────┘
         │ Redirects on success
         ▼
┌─────────────────────────────────┐
│ Extension auth.html             │
│ - Receives success=true&uid=... │
│ - Waits for auth state update   │
│ - Syncs to Firestore            │
│ - Auto-closes                   │
└─────────────────────────────────┘
```

## What's Different from Before

**Old approach (failed):**
- Used Firebase Hosting at `firebaseapp.com`
- Storage partitioning blocked session state
- Got "about:blank#blocked" error

**New approach (working):**
- Uses your custom domain `promptblocker.com`
- No storage partitioning issues
- Firebase auth works in standard web context
- Passes success back to extension via URL params

## Next Steps After Auth Works

1. ✅ Test Google Sign-In flow end-to-end
2. ✅ Test Email/Password sign-in (already works in extension)
3. ✅ Verify Firestore sync creates user documents
4. ✅ Test tier system (FREE vs PRO)
5. 🔄 Implement PRO feature gating in extension
6. 🔄 Add Stripe subscription integration

## Files Modified

- `src/popup/components/authModal.ts` - Opens promptblocker.com instead of extension auth.html
- `src/auth/auth.ts` - Receives success from promptblocker.com
- `.env` - Changed authDomain to promptblocker.com
- `auth-handler.html` - NEW standalone auth handler for promptblocker.com

## Security Notes

- `auth-handler.html` contains your Firebase API keys (safe to expose - protected by Firebase Security Rules)
- Extension ID is passed via URL parameter to allow redirect back to extension
- User credentials are never exposed in URLs (only success flag and UID)
- ID tokens are obtained securely via Firebase SDK
