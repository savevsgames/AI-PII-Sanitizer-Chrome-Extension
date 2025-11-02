# Chrome Identity API Setup for Google Sign-In

## Why Chrome Identity API?

Chrome extensions can't use Firebase's `signInWithPopup` or `signInWithRedirect` due to:
- **Storage partitioning** - Prevents session cookies from persisting
- **CSP restrictions** - Blocks external OAuth scripts
- **about:blank#blocked** - Chrome blocks redirect attempts

**Chrome Identity API** is the proper, official way to do OAuth in Chrome extensions.

## Setup Steps

### Step 1: Get OAuth Client ID from Firebase/Google Cloud

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/apis/credentials?project=promptblocker-prod

2. **Create OAuth 2.0 Client ID** (if not already created):
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Name: "PromptBlocker Chrome Extension"

3. **Add Authorized Redirect URIs:**
   - Get your extension ID from `chrome://extensions`
   - Add this redirect URI:
     ```
     https://epdcengjjokgilhjfdoielmmkbjbnabk.chromiumapp.org/
     ```
   - **IMPORTANT:** Replace `epdcengjjokgilhjfdoielmmkbjbnabk` with YOUR actual extension ID

4. **Copy the Client ID:**
   - It will look like: `861822607891-abc123def456.apps.googleusercontent.com`
   - Save this - you'll need it next

### Step 2: Update Extension Code

Open: `src/popup/components/authModal.ts`

Find this line (around line 167):
```typescript
const clientId = '861822607891-YOUR_CLIENT_ID_SUFFIX.apps.googleusercontent.com';
```

Replace with your actual Client ID:
```typescript
const clientId = '861822607891-abc123def456.apps.googleusercontent.com'; // YOUR ACTUAL CLIENT ID
```

### Step 3: Rebuild Extension

```bash
npm run build
```

### Step 4: Reload Extension

1. Go to `chrome://extensions`
2. Click reload button on PromptBlocker
3. **IMPORTANT:** Note your extension ID (it should match what you used in Step 1)

### Step 5: Test Sign-In

1. Open extension popup
2. Click "Sign In" → "Continue with Google"
3. **Chrome will open a popup** (not a new tab)
4. Select your Google account
5. Authorize the extension
6. **Popup closes automatically**
7. **Your profile should appear!** ✓

## How It Works

```
Extension Popup
    ↓
chrome.identity.launchWebAuthFlow()
    ↓
Google OAuth popup (managed by Chrome)
    ↓
User selects account
    ↓
Google redirects to: https://[extension-id].chromiumapp.org/
    ↓
Chrome captures the ID token
    ↓
Extension creates Firebase credential
    ↓
signInWithCredential(auth, credential)
    ↓
User signed in! ✓
```

## Benefits Over Firebase Redirect

✅ **No storage partitioning issues** - Chrome manages the OAuth flow
✅ **No CSP violations** - No external scripts needed
✅ **Proper Chrome extension flow** - Uses official Chrome Identity API
✅ **Works in Manifest V3** - Fully compatible
✅ **Popup instead of new tab** - Better UX
✅ **Auto-closes after auth** - Clean experience

## Troubleshooting

### Error: "Authorization page could not be loaded"

**Cause:** Client ID not configured correctly in Google Cloud Console

**Fix:**
1. Verify Client ID in `authModal.ts` matches Google Cloud Console
2. Ensure redirect URI in Google Cloud Console matches: `https://[YOUR-EXTENSION-ID].chromiumapp.org/`

### Error: "redirect_uri_mismatch"

**Cause:** Redirect URI in Google Cloud Console doesn't match extension ID

**Fix:**
1. Go to `chrome://extensions` and copy your EXACT extension ID
2. Update Google Cloud Console redirect URI to: `https://[EXACT-EXTENSION-ID].chromiumapp.org/`
3. Note: Extension ID changes if you reload unpacked extension

### Error: "Invalid ID token"

**Cause:** Token format incorrect or expired

**Fix:**
1. Check console logs - should show "ID token received"
2. Verify `response_type=id_token` in authUrl
3. Try signing in again (token might have expired)

### Extension ID Keeps Changing

**Cause:** Unpacked extensions get new IDs when reloaded

**Fix (for development):**
1. Create a `key` in manifest.json to get stable ID
2. OR use same extension ID each time by not removing/re-adding

**Fix (for production):**
- Published extensions have stable IDs automatically

## Security Notes

- ✅ Client ID is safe to expose (it's public in web apps too)
- ✅ ID tokens are short-lived and validated by Firebase
- ✅ Chrome Identity API handles secure OAuth flow
- ✅ Firestore security rules still protect user data

## Next Steps After Authentication Works

1. ✅ Test sign-out flow
2. ✅ Test session persistence (close/reopen popup)
3. ✅ Verify Firestore sync
4. ✅ Test tier system (FREE vs PRO)
5. 🔄 Implement PRO feature gating
6. 🔄 Add Stripe subscription integration
