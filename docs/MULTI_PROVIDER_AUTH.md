# Multi-Provider Authentication System

**Enterprise-grade authentication with email-based account linking**

## Overview

PromptBlocker supports multiple sign-in providers (Google, GitHub, Email/Password) with intelligent account linking to preserve encrypted user data across different authentication methods.

## The Challenge

All user data (profiles, API keys, custom rules) is encrypted using the **Firebase UID** as the encryption key material. This creates a problem:

- User signs in with **Google** → UID: `google:123456` → encrypts data
- User signs in with **GitHub** → UID: `github:789` → **CANNOT decrypt data** (wrong key)

## The Solution: Email-Based Account Linking

### How It Works

When a user signs in with **any provider**, the Cloud Function checks if an existing Firebase user has the same email address:

```typescript
// In functions/src/githubAuth.ts (and similar for other providers)

const githubEmail = githubUser.email;

// Try to find existing user by email
let firebaseUser;
try {
  firebaseUser = await auth.getUserByEmail(githubEmail);
  console.log('Found existing user - linking accounts');
  // Return existing UID (preserves encrypted data)
} catch (error) {
  // No existing user - create new one
  firebaseUser = await auth.createUser({
    uid: `github:${githubUser.id}`,
    email: githubEmail,
    // ...
  });
}

// Return custom token with the (existing or new) UID
return auth.createCustomToken(firebaseUser.uid);
```

### User Flow

#### Scenario 1: Same Email (Seamless)

1. **Day 1**: User signs in with **Google** (`john@gmail.com`)
   - Creates Firebase user: `google:123456`
   - Encrypts all data with this UID

2. **Day 2**: User signs in with **GitHub** (`john@gmail.com`)
   - Cloud Function finds existing user by email
   - Returns **same UID**: `google:123456`
   - Data decrypts successfully ✅

#### Scenario 2: Different Email (Guided Recovery)

1. **Day 1**: User signs in with **Google** (`john@gmail.com`)
   - Creates Firebase user: `google:123456`
   - Encrypts all data with this UID

2. **Day 2**: User signs in with **GitHub** (`john@work.com`)
   - Cloud Function doesn't find matching email
   - Creates **new UID**: `github:789`
   - Decryption fails (wrong key)
   - **Auth Issue Banner appears** 🔐

## Auth Issue Banner

When decryption fails due to UID mismatch, the app shows a helpful banner:

```
🔐 Can't Access Encrypted Data

Your data was encrypted with Google sign-in (john@gmail.com).
Please use that provider to unlock your data.

[Reset & Try Again]
```

### "Reset & Try Again" Flow

1. Signs out current (wrong) session
2. Clears broken auth state
3. Opens auth modal
4. Shows tip: "💡 Tip: Use Google sign-in to access your encrypted data"
5. User signs in with correct provider
6. Data decrypts ✅

## Encryption Provider Tracking

The system tracks which provider was used to encrypt the data:

```typescript
// In UserConfig (src/lib/types.ts)
account?: {
  // ...
  encryptionProvider?: 'google' | 'github' | 'microsoft' | 'email';
  encryptionEmail?: string;  // For troubleshooting
}
```

This information is:
- Set on **first sign-in** (when data is first encrypted)
- **Never changed** (even if user links multiple providers)
- Used to show helpful error messages

## Implementation Details

### Files Changed

1. **Cloud Function** (`functions/src/githubAuth.ts`)
   - Email-based user lookup
   - Account linking logic

2. **Types** (`src/lib/types.ts`)
   - Added `encryptionProvider` and `encryptionEmail` fields

3. **Auth Modal** (`src/popup/components/authModal.ts`)
   - Provider detection from UID format
   - Tracking on first sign-in

4. **Storage** (`src/lib/storage.ts`)
   - Graceful decryption failure handling
   - Fires `auth-decryption-failed` event

5. **Popup** (`src/popup/popup-v2.ts`)
   - Auth issue banner component
   - Reset & retry flow

6. **HTML** (`src/popup/popup-v2.html`)
   - Banner UI

### Provider Detection

The system detects providers from Firebase UID format:

| Provider | UID Format | Example |
|----------|------------|---------|
| Google | `google:{id}` | `google:123456789` |
| GitHub | `github:{id}` | `github:987654321` |
| Microsoft | `microsoft:{id}` | `microsoft:555666777` |
| Email/Password | Random string | `vK7fJ2pQ9xR...` |

## Security Considerations

### Why Email-Based Linking is Safe

1. **Email verification**: Firebase requires verified emails for OAuth providers
2. **No password exposure**: Cloud Function uses Admin SDK server-side
3. **Single source of truth**: Firebase Auth manages user identity
4. **Audit trail**: All auth events logged in Cloud Functions

### What About Email Spoofing?

**Not possible** because:
- GitHub/Google OAuth verifies email ownership
- Firebase validates OAuth tokens server-side
- No direct email input that could be spoofed

### Privacy Considerations

- Email is stored encrypted in config
- Only used for account matching
- Not exposed in logs or client-side code

## Edge Cases

### Case 1: User Changes Email on Provider

**Scenario**: User signs in with Google (`old@gmail.com`), then changes email to `new@gmail.com` in Google Account

**Result**:
- Firebase UID stays the same (`google:123456`)
- Decryption still works ✅
- Account email updates automatically

### Case 2: User Has Multiple Emails

**Scenario**: User has `personal@gmail.com` and `work@company.com`

**Result**:
- Creates two separate Firebase accounts
- Each has independent encrypted data
- User can switch between them

### Case 3: User Deletes and Recreates Account

**Scenario**: User deletes Firebase account, then signs in again

**Result**:
- New UID created (even with same email)
- Cannot decrypt old data (lost encryption key)
- Fresh start with new account

## Testing Guide

### Test 1: Same Email Linking

```bash
1. Sign in with Google (your@gmail.com)
2. Create a profile
3. Sign out
4. Sign in with GitHub (your@gmail.com)
5. ✅ Profile should still be there (account linked)
```

### Test 2: Different Email Recovery

```bash
1. Sign in with Google (google@email.com)
2. Create a profile
3. Sign out
4. Sign in with GitHub (github@email.com)
5. ✅ Banner appears: "Can't access encrypted data"
6. Click "Reset & Try Again"
7. ✅ Auth modal opens with tip
8. Sign in with Google
9. ✅ Profile restored
```

### Test 3: Provider Tracking

```bash
1. Sign in with GitHub (first time)
2. Open console
3. Check config.account.encryptionProvider
4. ✅ Should be 'github'
```

## Troubleshooting

### "Can't access encrypted data" banner won't go away

**Cause**: Still signed in with wrong provider

**Solution**:
```javascript
// In browser console:
debugSignOut()
// Then sign in with correct provider
```

### Account linking not working

**Check**:
1. Are the emails **exactly the same**? (case-sensitive)
2. Is the email verified on both providers?
3. Check Cloud Function logs: `firebase functions:log --only githubAuth`

### Lost access to encrypted data

**If you forgot which provider you used**:
1. Try each provider with the same email
2. Check browser console for `encryptionProvider` value
3. Contact support with your email (we can check Firebase)

## Future Enhancements

### Planned

- [ ] Apple Sign-In support
- [ ] Microsoft OAuth support
- [ ] Manual account linking UI (link multiple providers to one account)
- [ ] Data migration wizard (re-encrypt with new UID)
- [ ] Account recovery via email verification

### Under Consideration

- [ ] Multi-device sync (same UID across devices)
- [ ] Backup encryption keys (encrypted with passphrase)
- [ ] Provider preference hints (remember last used)

## References

- [Firebase Auth - Link Multiple Providers](https://firebase.google.com/docs/auth/web/account-linking)
- [Firebase Admin SDK - User Management](https://firebase.google.com/docs/auth/admin/manage-users)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)

---

**Last Updated**: 2025-11-09
**Status**: ✅ Deployed and Working
