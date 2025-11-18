# Encryption Overview - Prompt Blocker

**Last Updated:** November 7, 2025
**Audience:** Developers, Security Researchers
**Related:** [Full Security Audit](./ENCRYPTION_SECURITY_AUDIT.md)

---

## Quick Overview

Prompt Blocker uses **authentication-based encryption** to protect your profile data:

- **What's Encrypted:** Profiles, aliases, API keys, custom redaction rules
- **Algorithm:** AES-256-GCM (industry standard)
- **Key Derivation:** PBKDF2 with 210,000 iterations
- **Key Material:** Derived from Firebase authentication session (never stored locally)

---

## How It Works

### Simple Explanation

```
You Sign In
    ↓
Firebase Creates Secure Session
    ↓
Extension Uses Session Info to Create Encryption Key
    ↓
Key Used to Encrypt/Decrypt Your Data
    ↓
Key Destroyed When You Sign Out
```

**Key Point:** Your encryption key is created from your authentication session, not stored anywhere on your device.

---

## Technical Details

### Encryption Flow

```typescript
// 1. User authenticates with Firebase
const user = auth.currentUser;

// 2. Get Firebase UID (unique user identifier)
const keyMaterial = user.uid;  // Never stored locally

// 3. Derive encryption key using PBKDF2
const key = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: randomSalt,           // Stored in chrome.storage (salt is OK to be public)
    iterations: 210000,          // OWASP 2023 recommendation
    hash: 'SHA-256',
  },
  keyMaterial,
  { name: 'AES-GCM', length: 256 },  // 256-bit AES key
  false,
  ['encrypt', 'decrypt']
);

// 4. Encrypt data with AES-256-GCM
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv: randomIV },
  key,
  data
);

// 5. Store encrypted data in chrome.storage.local
await chrome.storage.local.set({ profiles: encrypted });
```

---

## Why This is Secure

### Traditional Approach (Insecure)
```
chrome.storage.local {
  encryptionKey: "secret-key-12345"   // ❌ KEY
  profiles: "encrypted-data-67890"    // ❌ DATA
}

Problem: Both key and data in same place
```

### Our Approach (Secure)
```
chrome.storage.local {
  profiles: "encrypted-data-67890"    // ✅ DATA ONLY
}

Firebase Session (separate) {
  user.uid: "unique-user-id"          // 🔐 KEY MATERIAL
}

Key Separation: ✅ Data and key material stored separately
```

---

## Security Properties

### What This Protects Against

✅ **Malicious Extensions**
- Other extensions with storage permission can read encrypted data
- But they cannot access your Firebase authentication session
- Result: They get encrypted gibberish, no way to decrypt

✅ **Data Theft**
- Even if someone steals your chrome.storage data
- They cannot decrypt it without your Firebase authentication
- Result: Your data remains protected

✅ **Browser DevTools**
- Developers can inspect chrome.storage in DevTools
- They see encrypted data but cannot access authentication session
- Result: Data remains encrypted

### What This Does NOT Protect Against

⚠️ **Root/Admin Access**
- If attacker has root access to your OS/browser
- They can intercept authentication session or read decrypted memory
- **Mitigation:** Use OS-level encryption (FileVault, BitLocker)
- **Note:** This is a limitation of ALL client-side encryption

⚠️ **Active Browser Session**
- While you're signed in and using the extension
- Data is temporarily decrypted in memory for processing
- **Mitigation:** Sign out when not in use
- **Note:** This is expected behavior for encrypted applications

---

## Migration from Legacy Encryption

### Automatic Upgrade

If you were using Prompt Blocker before November 7, 2025, your data was encrypted with the old system (random key material stored in chrome.storage).

**Migration happens automatically:**
1. First time you sign in after update
2. System detects legacy encryption
3. Decrypts data with old key
4. Re-encrypts with new Firebase UID-based key
5. Deletes old key material
6. Complete! Your data is now more secure

**No action required from you.**

---

## Implementation Details

### File Locations
- **Primary Implementation:** `src/lib/storage.ts`
- **Key Derivation:** Lines 1714-1749
- **Firebase UID Retrieval:** Lines 1751-1824
- **Migration Logic:** Lines 269-336 (profiles), Lines 140-202 (aliases)

### Encryption Algorithms

| Component | Algorithm | Parameters |
|-----------|-----------|------------|
| Symmetric Encryption | AES-GCM | 256-bit key, 96-bit IV |
| Key Derivation | PBKDF2 | 210,000 iterations, SHA-256 |
| Salt | CSPRNG | 128-bit random |
| IV (Initialization Vector) | CSPRNG | 96-bit random (unique per encryption) |

### Standards Compliance

- ✅ **OWASP 2023:** PBKDF2 iterations ≥ 210,000
- ✅ **NIST FIPS 197:** AES-256
- ✅ **NIST SP 800-132:** Salt ≥ 128 bits
- ✅ **RFC 5116:** AES-GCM mode

---

## Context Isolation

### Popup Context (Where Decryption Happens)
```typescript
// Has access to Firebase auth
const { auth } = await import('./firebase');
const uid = auth.currentUser.uid;  // ✅ Can get UID
const key = await deriveKey(uid);   // ✅ Can derive key
const data = await decrypt(key);    // ✅ Can decrypt
```

### Service Worker Context (No Decryption)
```typescript
// No Firebase auth access (no DOM)
typeof document === 'undefined'  // true

// Attempting to decrypt throws error
await decrypt(...)  // ❌ Throws: ENCRYPTION_KEY_UNAVAILABLE
```

**Why:** Service workers run in background constantly. By isolating decryption to the popup (user-initiated), we minimize the attack surface.

---

## FAQ

### Q: What if I forget my Firebase password?
**A:** Your data is encrypted with your Firebase UID. If you lose access to your Firebase account:
- Firebase supports password reset via email
- Once you regain access, your data can be decrypted
- **Important:** Enable 2FA on your Firebase account for extra security

### Q: Can I use the extension without signing in?
**A:** No. Signing in is required to access encrypted data. This is a security feature, not a bug.

### Q: What happens when I sign out?
**A:**
1. Encrypted data remains in chrome.storage (safe, still encrypted)
2. Firebase session ends (authentication state cleared)
3. Extension cannot decrypt data until you sign in again
4. This is expected behavior - signing out "locks" your data

### Q: Is my data sent to Firebase servers?
**A:** **NO.** Only your authentication session is managed by Firebase. Your profiles, aliases, and PII are:
- ✅ Encrypted locally on your device
- ✅ Stored in chrome.storage.local (on your device)
- ✅ Never sent to Firebase or any external server

### Q: Can I export my data?
**A:** Yes! Use the Import/Export feature (PRO):
- Export creates an encrypted JSON file
- Import restores profiles from backup
- Useful for backup or moving to another device

---

## Security Best Practices

### For Users

1. ✅ **Enable 2FA on Firebase Account**
   - Adds extra protection against account compromise
   - Recommended for all users storing sensitive data

2. ✅ **Use Strong Password**
   - Firebase password protects access to encryption key
   - Consider using a password manager

3. ✅ **Sign Out When Not Using**
   - Signing out locks your data
   - Prevents decryption even if device is compromised while unlocked

4. ✅ **Enable OS-Level Encryption**
   - FileVault (macOS), BitLocker (Windows)
   - Protects against physical device theft

### For Developers

1. ✅ **Never Store Firebase UID**
   - Keep UID retrieval dynamic (auth.currentUser.uid)
   - Never cache UID in chrome.storage

2. ✅ **Use Unique IV Per Encryption**
   - Each encryption operation must have unique IV
   - Never reuse IV with same key

3. ✅ **Validate Decryption Errors**
   - GCM mode provides authentication
   - Failed decryption = tampered data or wrong key

4. ✅ **Clear Sensitive Data from Memory**
   - After use, overwrite variables containing decrypted data
   - Minimize time sensitive data exists in plaintext

---

## Threat Model Summary

| Threat | Protected? | Notes |
|--------|-----------|-------|
| Malicious Extension | ✅ Yes | Cannot access Firebase session |
| Data Theft (chrome.storage) | ✅ Yes | Data encrypted, no key available |
| Browser DevTools | ✅ Yes | Can see encrypted data, cannot decrypt |
| Physical Device Access (locked) | ✅ Yes | Data encrypted, cannot decrypt while locked |
| Physical Device Access (unlocked) | ⚠️ Partial | If signed in, data can be accessed |
| Root/Admin Malware | ❌ No | Can intercept auth session (all client-side encryption has this limit) |

---

## Additional Resources

- **Full Security Audit:** [ENCRYPTION_SECURITY_AUDIT.md](./ENCRYPTION_SECURITY_AUDIT.md)
- **Implementation Code:** `src/lib/storage.ts` (lines 1714-1824)
- **Migration Guide:** See Security Audit, "Migration Strategy" section
- **OWASP Guidelines:** https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

---

**Document Version:** 1.0
**Last Updated:** November 7, 2025
