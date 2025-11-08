# Firebase UID-Based Encryption - Security Enhancement

**Date:** 2025-11-06
**Status:** 🚨 **CRITICAL SECURITY ISSUE** - Must implement before launch
**Priority:** P0 - BLOCKER
**Estimated Time:** 2-3 days

---

## 🚨 Critical Security Vulnerability

### Current Implementation (VULNERABLE ❌)

**Problem:** Encryption key material and encrypted data are stored in the same location (chrome.storage.local)

```typescript
// CURRENT (INSECURE):
// 1. Key material stored in chrome.storage.local
await chrome.storage.local.set({ '_encryptionKeyMaterial': randomKey });

// 2. Encrypted profiles ALSO stored in chrome.storage.local
await chrome.storage.local.set({ 'profiles': encryptedProfiles });

// 3. Attacker with chrome.storage access has BOTH:
//    - The encrypted data
//    - The key to decrypt it
```

**Attack Scenario:**
1. Malicious extension with broad permissions reads chrome.storage.local
2. Attacker extracts `_encryptionKeyMaterial` and `_encryptionSalt`
3. Attacker derives same AES-256 key using PBKDF2
4. Attacker decrypts all user profiles, API keys, custom rules

**Comparison:**
- 🔓 Current: "Locking your house and leaving the key under the doormat"
- 🔐 Needed: "Locking your house and keeping the key in your pocket"

---

## ✅ Solution: Firebase UID-Based Encryption

### Architecture

**Key Material Source:** Firebase User ID (UID)
**Storage Location:** NOT stored - derived from Firebase auth session
**Availability:** Only when user is authenticated

```typescript
// NEW (SECURE):
// 1. Key material = Firebase UID (never stored locally!)
const keyMaterial = auth.currentUser?.uid; // e.g. "xK7pQ9vR2mN4wL8h"

// 2. Derive encryption key from Firebase UID
const key = await deriveKey(firebaseUid, salt);

// 3. Encrypt/decrypt data with derived key
const encrypted = await encrypt(profiles, key);

// 4. If user logs out → key unavailable → data locked ✅
```

### Security Properties

✅ **Key Separation:**
- Key material (Firebase UID) never stored in chrome.storage
- Only available when user is authenticated
- Attacker needs BOTH chrome.storage access AND active Firebase session

✅ **Auto-Locking:**
- User logs out → Firebase UID unavailable
- Cannot decrypt data without Firebase session
- Forces authentication to access sensitive data

✅ **Per-User Isolation:**
- Each Firebase user has unique UID
- UIDs are unpredictable (not sequential)
- Cannot derive one user's key from another

✅ **Revocable:**
- User can revoke Firebase session remotely
- Immediately locks all encrypted data
- No need to purge local storage

---

## 🔐 Implementation Plan

### Phase 1: Firebase UID Encryption (CRITICAL - Before Launch)

**Estimated Time:** 2-3 days
**Files Modified:**
- `src/lib/storage.ts` (encryption key derivation)
- `src/lib/firebase.ts` (auth state management)
- `src/popup/popup-v2.ts` (handle signed-out state)

#### Step 1: Update Key Derivation (4-6 hours)

**File:** `src/lib/storage.ts`

```typescript
/**
 * Get encryption key using Firebase UID as key material
 * SECURITY: Key material is NOT stored - derived from auth session
 */
private async getEncryptionKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  // Get Firebase UID (throws if not authenticated)
  const keyMaterial = await this.getFirebaseKeyMaterial();

  // Import Firebase UID as PBKDF2 key
  const importedKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyMaterial),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Get or generate salt (salt can be public - stored in chrome.storage)
  const salt = await this.getOrGenerateSalt();

  // Derive AES-256-GCM key with 210k iterations
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 210000, // OWASP 2023 recommendation
      hash: 'SHA-256',
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get Firebase UID as key material
 * SECURITY: Never stored - only available when authenticated
 */
private async getFirebaseKeyMaterial(): Promise<string> {
  const { auth } = await import('./firebase');

  // Check if user is authenticated
  if (!auth.currentUser) {
    throw new Error(
      'ENCRYPTION_KEY_UNAVAILABLE: Please sign in to access encrypted data. ' +
      'Your data is locked and requires authentication.'
    );
  }

  const uid = auth.currentUser.uid;

  if (!uid) {
    throw new Error('ENCRYPTION_KEY_INVALID: Firebase UID is missing.');
  }

  return uid;
}

/**
 * DEPRECATED: Old method using random key material
 * Kept for migration only - will be removed in v2.0
 */
private async getOrGenerateKeyMaterial(): Promise<string> {
  console.warn('[StorageManager] getOrGenerateKeyMaterial() is DEPRECATED - use Firebase UID');

  const STORAGE_KEY = '_encryptionKeyMaterial';
  const data = await chrome.storage.local.get(STORAGE_KEY);

  if (data[STORAGE_KEY]) {
    return data[STORAGE_KEY];
  }

  // For backward compatibility only
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const keyMaterial = this.arrayBufferToBase64(randomBytes);
  await chrome.storage.local.set({ [STORAGE_KEY]: keyMaterial });

  return keyMaterial;
}
```

#### Step 2: Handle Signed-Out State (2-3 hours)

**File:** `src/popup/popup-v2.ts`

```typescript
// Add auth state listener
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    // User signed out - show locked state
    showLockedState();
  } else {
    // User signed in - unlock data
    await unlockAndLoadData();
  }
});

function showLockedState() {
  const lockedOverlay = document.createElement('div');
  lockedOverlay.className = 'locked-overlay';
  lockedOverlay.innerHTML = `
    <div class="locked-container">
      <div class="locked-icon">🔒</div>
      <h2>Data Locked</h2>
      <p>Your profiles and settings are encrypted and require authentication.</p>
      <button class="btn btn-primary" id="signInBtn">
        <span>🔑</span>
        <span>Sign In to Unlock</span>
      </button>
      <p class="locked-hint">
        Your data is secure with AES-256 encryption using your Firebase account.
      </p>
    </div>
  `;

  document.body.appendChild(lockedOverlay);

  document.getElementById('signInBtn')?.addEventListener('click', () => {
    handleGoogleLogin();
  });
}

async function unlockAndLoadData() {
  try {
    // Try to load profiles (will fail if Firebase UID unavailable)
    const store = useAppStore.getState();
    await store.initialize();

    // Success - remove locked overlay if present
    document.querySelector('.locked-overlay')?.remove();

  } catch (error) {
    if (error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
      showLockedState();
    } else {
      console.error('[Popup] Failed to unlock data:', error);
      showError('Failed to load encrypted data. Please try signing in again.');
    }
  }
}
```

#### Step 3: Migration Strategy (3-4 hours)

**Challenge:** Existing users have data encrypted with random key material, not Firebase UID.

**Solution:** Dual-key decryption with automatic migration

```typescript
/**
 * Try to decrypt with Firebase UID first, fall back to old key material
 * Automatically re-encrypts with Firebase UID on success
 */
async loadProfiles(): Promise<AliasProfile[]> {
  const data = await chrome.storage.local.get(StorageManager.KEYS.PROFILES);
  if (!data[StorageManager.KEYS.PROFILES]) {
    return [];
  }

  const encryptedData = data[StorageManager.KEYS.PROFILES];

  try {
    // Try Firebase UID key (new method)
    console.log('[StorageManager] Attempting decryption with Firebase UID key...');
    const decrypted = await this.decrypt(encryptedData);
    return JSON.parse(decrypted);

  } catch (error) {
    console.warn('[StorageManager] Firebase UID decryption failed, trying legacy key...');

    try {
      // Fall back to old random key material
      const legacyKey = await this.getLegacyEncryptionKey();
      const decrypted = await this.decryptWithKey(encryptedData, legacyKey);
      const profiles = JSON.parse(decrypted);

      console.log('[StorageManager] ✅ Legacy decryption successful - migrating to Firebase UID...');

      // Re-encrypt with Firebase UID key
      await this.saveProfiles(profiles); // Uses Firebase UID automatically

      // Clean up old key material (no longer needed)
      await chrome.storage.local.remove('_encryptionKeyMaterial');

      console.log('[StorageManager] ✅ Migration complete - data now encrypted with Firebase UID');

      return profiles;

    } catch (legacyError) {
      console.error('[StorageManager] Both decryption methods failed:', legacyError);
      throw new Error('DECRYPTION_FAILED: Cannot decrypt profiles. Data may be corrupted.');
    }
  }
}

/**
 * Get legacy encryption key (random key material)
 * Used only for migration
 */
private async getLegacyEncryptionKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  const keyMaterial = await this.getOrGenerateKeyMaterial(); // Old method
  const importedKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyMaterial),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const salt = await this.getOrGenerateSalt();

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 210000,
      hash: 'SHA-256',
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

#### Step 4: Testing (2-3 hours)

**Test Cases:**

1. **New User (No Existing Data)**
   - Sign in with Google
   - Create profile
   - Verify encrypted with Firebase UID
   - Sign out
   - Verify data locked
   - Sign in again
   - Verify data accessible

2. **Existing User (Legacy Encryption)**
   - User with old random key material
   - Sign in with Google
   - Load profiles (should auto-migrate)
   - Verify data accessible
   - Check `_encryptionKeyMaterial` removed

3. **Signed-Out State**
   - Sign out
   - Try to access profiles
   - Verify error thrown
   - Verify locked state UI shown

4. **No Firebase Account**
   - New user doesn't sign in
   - Cannot create profiles
   - Locked state shown
   - Can still browse features tab

---

### Phase 2: Passphrase Option (PRO Feature - Post-Launch)

**Estimated Time:** 4-5 days
**Target:** v1.1.0 (post-launch)

#### User Experience

**PRO users can choose encryption mode:**

1. **Firebase Account** (Default - FREE + PRO)
   - Key material: Firebase UID
   - Auto-locks when signed out
   - Zero friction

2. **Passphrase** (PRO only)
   - Key material: User-provided passphrase
   - Works without Firebase account
   - Prompt on popup open
   - Maximum security

3. **Both (Paranoid Mode)** (PRO only)
   - Key material: Firebase UID + Passphrase
   - Requires both to decrypt
   - Ultimate security

#### Implementation

**File:** `src/lib/storage.ts`

```typescript
// Add encryption mode to config
interface UserConfig {
  security?: {
    encryptionMode: 'firebase-uid' | 'passphrase' | 'firebase-and-passphrase';
    passphraseTimeout: number; // Minutes to cache passphrase (5-30)
    requirePassphraseOnOpen: boolean;
  };
}

private async getEncryptionKey(): Promise<CryptoKey> {
  const config = await this.loadConfigRaw(); // Don't decrypt yet
  const mode = config?.security?.encryptionMode || 'firebase-uid';

  let keyMaterial: string;

  switch (mode) {
    case 'firebase-uid':
      keyMaterial = await this.getFirebaseKeyMaterial();
      break;

    case 'passphrase':
      keyMaterial = await this.getPassphraseKeyMaterial();
      break;

    case 'firebase-and-passphrase':
      const uid = await this.getFirebaseKeyMaterial();
      const pass = await this.getPassphraseKeyMaterial();
      keyMaterial = uid + pass; // Combined strength
      break;
  }

  // Rest of derivation...
}

/**
 * Get user passphrase (prompts if not cached)
 * SECURITY: Cached in memory only, never stored
 */
private cachedPassphrase: string | null = null;
private passphraseTimeout: NodeJS.Timeout | null = null;

private async getPassphraseKeyMaterial(): Promise<string> {
  // Check memory cache
  if (this.cachedPassphrase) {
    return this.cachedPassphrase;
  }

  // Prompt user
  const passphrase = await this.promptForPassphrase();

  if (!passphrase) {
    throw new Error('PASSPHRASE_REQUIRED: Please enter your passphrase to access encrypted data.');
  }

  // Cache for configured timeout (default 15 minutes)
  this.cachedPassphrase = passphrase;
  this.schedulePassphraseCacheClear();

  return passphrase;
}

private schedulePassphraseCacheClear() {
  if (this.passphraseTimeout) {
    clearTimeout(this.passphraseTimeout);
  }

  const config = await this.loadConfigRaw();
  const timeoutMinutes = config?.security?.passphraseTimeout || 15;

  this.passphraseTimeout = setTimeout(() => {
    this.cachedPassphrase = null;
    console.log('[StorageManager] Passphrase cache cleared after', timeoutMinutes, 'minutes');
  }, timeoutMinutes * 60 * 1000);
}

private async promptForPassphrase(): Promise<string | null> {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'passphrase-modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <h3>🔐 Enter Passphrase</h3>
        <p>Your data is encrypted with a passphrase.</p>
        <input type="password" id="passphraseInput" placeholder="Enter passphrase" autofocus>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
          <button class="btn btn-primary" id="unlockBtn">Unlock</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = modal.querySelector('#passphraseInput') as HTMLInputElement;
    const unlockBtn = modal.querySelector('#unlockBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');

    unlockBtn?.addEventListener('click', () => {
      resolve(input.value);
      modal.remove();
    });

    cancelBtn?.addEventListener('click', () => {
      resolve(null);
      modal.remove();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        unlockBtn?.click();
      }
    });
  });
}
```

#### Settings UI

**File:** `src/popup/popup-v2.html` (Settings Tab)

```html
<div class="settings-section pro-feature">
  <h3>🔐 Encryption Mode <span class="pro-badge">PRO</span></h3>

  <div class="encryption-modes">
    <label class="radio-label">
      <input type="radio" name="encryptionMode" value="firebase-uid" checked>
      <div class="mode-card">
        <div class="mode-header">
          <span class="mode-icon">🔑</span>
          <span class="mode-title">Firebase Account</span>
        </div>
        <ul class="mode-features">
          <li>✓ Auto-locks when signed out</li>
          <li>✓ Seamless access while signed in</li>
          <li>✓ Good for most users</li>
        </ul>
      </div>
    </label>

    <label class="radio-label pro-only">
      <input type="radio" name="encryptionMode" value="passphrase">
      <div class="mode-card">
        <div class="mode-header">
          <span class="mode-icon">🔒</span>
          <span class="mode-title">Passphrase Protection</span>
          <span class="pro-badge-sm">PRO</span>
        </div>
        <ul class="mode-features">
          <li>✓ Works without Firebase account</li>
          <li>✓ Maximum security</li>
          <li>⚠️ Must enter passphrase each time</li>
        </ul>
      </div>
    </label>

    <label class="radio-label pro-only">
      <input type="radio" name="encryptionMode" value="firebase-and-passphrase">
      <div class="mode-card">
        <div class="mode-header">
          <span class="mode-icon">🛡️</span>
          <span class="mode-title">Both (Paranoid Mode)</span>
          <span class="pro-badge-sm">PRO</span>
        </div>
        <ul class="mode-features">
          <li>✓ Requires BOTH Firebase + passphrase</li>
          <li>✓ Ultimate security</li>
          <li>⚠️ Highest friction</li>
        </ul>
      </div>
    </label>
  </div>

  <button class="btn btn-primary" id="changeEncryptionModeBtn">
    Change Encryption Mode
  </button>

  <div class="warning-box" id="passphraseWarning" style="display: none;">
    <strong>⚠️ WARNING: Passphrase Cannot Be Reset</strong>
    <p>If you forget your passphrase, your data is <strong>permanently lost</strong>. There is no recovery mechanism. Make sure to store your passphrase securely.</p>
  </div>
</div>
```

---

## 🚀 Implementation Timeline

### Week 1: Firebase UID Encryption (CRITICAL)

**Day 1-2:**
- [ ] Update key derivation to use Firebase UID
- [ ] Add signed-out state handling
- [ ] Create locked state UI

**Day 2-3:**
- [ ] Implement migration from random key material
- [ ] Add dual-key decryption
- [ ] Test migration path

**Day 3:**
- [ ] Write comprehensive tests
- [ ] Test new user flow
- [ ] Test existing user migration
- [ ] Test signed-out state

### Post-Launch: Passphrase Option (PRO Feature)

**v1.1.0 Release:**
- [ ] Add passphrase prompt UI
- [ ] Implement mode switching
- [ ] Add settings UI for encryption modes
- [ ] Gate behind PRO tier
- [ ] Document passphrase security implications

---

## 📊 Security Comparison

| Aspect | Current (Random Key) | Phase 1 (Firebase UID) | Phase 2 (Passphrase) |
|--------|---------------------|----------------------|---------------------|
| **Key Material** | Random 256-bit | Firebase UID | User passphrase |
| **Storage Location** | chrome.storage.local ❌ | Not stored ✅ | Not stored ✅ |
| **Attack Surface** | Local storage only | Firebase + Local | Memory only |
| **Auto-Lock** | No | Yes (on sign out) | Yes (on timeout) |
| **Offline Access** | Yes | No (needs auth) | Yes |
| **User Friction** | None | Low | Medium |
| **Security Level** | Low | High | Very High |

---

## ⚠️ Important Notes

### Passphrase Security Warnings

1. **No Password Reset:**
   - Forgotten passphrase = permanent data loss
   - No recovery mechanism possible
   - User must be warned clearly

2. **Weak Passphrases:**
   - Users may choose weak passphrases ("password123")
   - Should enforce minimum strength (12+ chars, mixed case, numbers)
   - Consider zxcvbn strength meter

3. **Shoulder Surfing:**
   - Passphrase entered in visible UI
   - Could be observed by others
   - Recommend privacy shield

### Firebase UID Security

1. **Firebase Session Hijacking:**
   - If attacker steals Firebase ID token, they can decrypt data
   - Mitigated by Firebase security rules and token expiration
   - Short-lived tokens (1 hour default)

2. **Revocation:**
   - User can revoke Firebase sessions remotely
   - Immediately locks all encrypted data
   - Good for lost/stolen devices

---

## 📚 References

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST SP 800-132: Key Derivation](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf)
- [Firebase Authentication Security](https://firebase.google.com/docs/auth/web/start)
- [Web Crypto API - SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)

---

**Last Updated:** 2025-11-06
**Status:** 📋 Ready for implementation
**Next:** Begin Phase 1 implementation (Firebase UID encryption)
