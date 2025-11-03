# Enable Authentication Providers in Firebase

Before testing the authentication UI, you need to enable authentication providers in Firebase Console.

## Step 1: Enable Google Sign-In

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: **promptblocker-prod**
3. Click **"Authentication"** in left sidebar
4. Click **"Sign-in method"** tab
5. Click **"Google"** provider
6. Toggle **"Enable"** switch to ON
7. **Important:** Set support email (required for Google Sign-In)
   - Select your email from dropdown
8. Click **"Save"**

✅ Google Sign-In is now enabled!

## Step 2: Enable Email/Password Authentication

1. Still on the **"Sign-in method"** tab
2. Click **"Email/Password"** provider
3. Toggle **"Enable"** switch to ON
   - Leave "Email link (passwordless sign-in)" OFF for now
4. Click **"Save"**

✅ Email/Password authentication is now enabled!

## Step 3: Configure Authorized Domains

Firebase automatically authorizes:
- localhost
- your-project.firebaseapp.com
- your-project.web.app

For Chrome extension, you need to add the extension ID as an authorized domain:

1. Still in Authentication → **"Settings"** tab
2. Scroll to **"Authorized domains"**
3. Click **"Add domain"**
4. Enter your extension ID (you can find this in `chrome://extensions/`)
   - Format: `chrome-extension://YOUR_EXTENSION_ID`
   - Example: `chrome-extension://abcdefghijklmnop`
5. Click **"Add"**

**Note:** For development, localhost should already be authorized. You only need to add the extension ID if you get CORS errors.

## Verification

Once enabled, you should see on the **Sign-in method** tab:

| Provider | Status |
|----------|--------|
| Google | ✅ Enabled |
| Email/Password | ✅ Enabled |
| Anonymous | ✅ Enabled (from testing) |

## What's Next?

After enabling authentication providers:

1. Build the extension: `npm run build`
2. Reload extension in Chrome
3. Open extension popup
4. Click **"Sign In"** button in header
5. Test Google Sign-In flow
6. Test Email/Password sign-up flow
7. Test Email/Password sign-in flow
8. Verify user info appears in header after sign-in

## Troubleshooting

### Error: "auth/operation-not-allowed"
**Fix:** Make sure Google Sign-In is enabled (Step 1 above)

### Error: "auth/unauthorized-domain"
**Fix:** Add your extension ID to authorized domains (Step 3 above)

### Error: "auth/invalid-email"
**Fix:** Check email format when signing up

### Error: "auth/weak-password"
**Fix:** Password must be at least 6 characters

### Google Sign-In popup closes immediately
**Possible causes:**
1. Support email not set in Firebase Console
2. Browser blocking popups (check popup blocker)
3. Extension ID not in authorized domains

## Firebase Console Links

- **Project Overview:** https://console.firebase.google.com/project/promptblocker-prod
- **Authentication:** https://console.firebase.google.com/project/promptblocker-prod/authentication
- **Users Tab:** https://console.firebase.google.com/project/promptblocker-prod/authentication/users
- **Sign-in methods:** https://console.firebase.google.com/project/promptblocker-prod/authentication/providers

---

**Ready to test authentication?** Follow the steps above, then build and reload your extension!
