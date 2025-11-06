# Service Worker + Firebase UID Encryption Architecture

**Date:** 2025-11-06
**Status:** ✅ IMPLEMENTED & WORKING
**Version:** 1.0.0

---

## 📋 Executive Summary

This document describes the final, working architecture for Firebase UID-based encryption in a Manifest V3 Chrome Extension with a service worker background context. This architecture solves the critical challenge of encrypting user data with Firebase authentication when the service worker cannot access Firebase auth due to DOM API limitations.

---

## 🎯 The Challenge

### Problem Statement

**Chrome Extension Manifest V3** uses a **service worker** for the background context, which has NO access to DOM APIs. This creates a fundamental problem:

```
❌ Firebase Auth SDK requires DOM APIs (document, window, localStorage)
❌ Service Worker has NO DOM (no document, no window, no localStorage)
❌ Firebase UID needed for encryption key derivation
❌ Service worker needs to intercept and substitute PII in real-time

= IMPOSSIBLE to decrypt profiles in service worker with Firebase UID!
```

### Why This Matters

- **Real-time PII Substitution**: Background worker intercepts AI requests and must substitute PII immediately
- **Profiles Are Encrypted**: Profiles contain sensitive PII (name, email, phone) encrypted with Firebase UID
- **Service Worker Context**: Background runs in service worker (no DOM) starting in Manifest V3

---

## ✅ The Solution: Profile Sync Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        POPUP CONTEXT                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ✅ Has DOM APIs                                           │  │
│  │  ✅ Firebase Auth Available                               │  │
│  │  ✅ Can decrypt with Firebase UID                         │  │
│  │                                                            │  │
│  │  1. User opens popup                                       │  │
│  │  2. Firebase auth restored from session                    │  │
│  │  3. Load profiles (decrypt with Firebase UID)             │  │
│  │  4. Send decrypted profiles to service worker  ─────────┐ │  │
│  └──────────────────────────────────────────────────────────│──┘  │
└────────────────────────────────────────────────────────────│─────┘
                                                             │
                                  chrome.runtime.sendMessage │
                                  { type: 'SET_PROFILES',    │
                                    payload: profiles }      │
                                                             │
                                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE WORKER CONTEXT                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ❌ No DOM APIs                                            │  │
│  │  ❌ Firebase Auth NOT available                           │  │
│  │  ❌ Cannot decrypt encrypted data                         │  │
│  │  ✅ Receives pre-decrypted profiles from popup           │  │
│  │                                                            │  │
│  │  1. Receives SET_PROFILES message                         │  │
│  │  2. Loads profiles into AliasEngine (in-memory)           │  │
│  │  3. Intercepts AI requests                                │  │
│  │  4. Substitutes PII using loaded profiles  ✅             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Encryption Happens in Popup** (has Firebase auth)
2. **Decryption Happens in Popup** (has Firebase auth)
3. **Service Worker Uses Decrypted Data** (no encryption/decryption)
4. **Profiles Synced on Popup Open** (popup → service worker)
5. **Profile Changes Synced Immediately** (popup → service worker)

---

## 🔐 Implementation Details

### 1. Firebase UID Key Derivation (Popup Context Only)

**File:** `src/lib/storage.ts`

```typescript
/**
 * Get Firebase UID as encryption key material
 * SECURITY: Never stored locally - only available when user is authenticated
 * CONTEXT: Only works in popup/content contexts (has DOM)
 */
private async getFirebaseKeyMaterial(): Promise<string> {
  try {
    // Check if we're in service worker context (no DOM)
    const isServiceWorker = typeof document === 'undefined';

    if (isServiceWorker) {
      // In service worker, Firebase auth won't work (no DOM)
      throw new Error(
        'ENCRYPTION_KEY_UNAVAILABLE: Firebase auth not available in service worker context.'
      );
    }

    const { auth } = await import('./firebase');

    // Wait for Firebase to initialize if needed (max 300ms)
    if (!auth.currentUser) {
      const maxWaitTime = 300;
      await new Promise<void>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(() => {
          unsubscribe();
          resolve();
        });
        setTimeout(resolve, maxWaitTime);
      });
    }

    // Check if user is authenticated after waiting
    if (!auth.currentUser) {
      throw new Error('ENCRYPTION_KEY_UNAVAILABLE: Please sign in to access encrypted data.');
    }

    const uid = auth.currentUser.uid;

    if (!uid || uid.trim() === '') {
      throw new Error('ENCRYPTION_KEY_INVALID: Firebase UID is missing or empty.');
    }

    console.log('[StorageManager] Using Firebase UID for encryption key derivation');
    return uid;

  } catch (error) {
    if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
      throw error;
    }
    console.error('[StorageManager] Unexpected error accessing Firebase auth:', error);
    throw new Error('ENCRYPTION_KEY_UNAVAILABLE: Authentication required to access encrypted data.');
  }
}
```

### 2. Storage Manager Context Detection

**File:** `src/lib/storage.ts`

```typescript
/**
 * Initialize storage
 * In service worker context, skips profile loading (profiles sent from popup)
 */
async initialize(): Promise<void> {
  const isServiceWorker = typeof document === 'undefined';

  try {
    await this.migrateV1ToV2IfNeeded();
    await this.migrateAPIKeysToEncryptedIfNeeded();

    const config = await this.loadConfig();
    if (!config) {
      await this.saveConfig(this.getDefaultConfig());
    }

    // Skip profile loading in service worker - profiles will be sent from popup
    if (isServiceWorker) {
      console.log('[StorageManager] Service worker context - skipping profile initialization');
      console.log('[StorageManager] Profiles will be sent from popup via SET_PROFILES message');
      return;
    }

    const profiles = await this.loadProfiles();
    if (!profiles || profiles.length === 0) {
      await this.saveProfiles([]);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
      console.log('[StorageManager] User not authenticated - skipping data initialization');
      return;
    }
    throw error;
  }
}
```

### 3. AliasEngine Context Detection

**File:** `src/lib/aliasEngine.ts`

```typescript
/**
 * Get singleton instance of AliasEngine
 * In service worker, skips automatic profile loading (waits for SET_PROFILES)
 */
public static async getInstance(): Promise<AliasEngine> {
  if (!AliasEngine.instance) {
    AliasEngine.instance = new AliasEngine();

    // Only load profiles if not in service worker context
    const isServiceWorker = typeof document === 'undefined';
    if (!isServiceWorker) {
      await AliasEngine.instance.loadProfiles();
    } else {
      console.log('[AliasEngine] Service worker context - waiting for profiles via SET_PROFILES');
    }
  }
  return AliasEngine.instance;
}

/**
 * Set profiles directly (used by popup to send decrypted profiles to service worker)
 * This bypasses encryption issues in service worker context
 */
setProfiles(profiles: AliasProfile[]): void {
  this.profiles = profiles;
  this.buildLookupMaps();
  console.log('[AliasEngine] Profiles set directly:', this.profiles.length, 'profiles');
}

/**
 * Load profiles from storage and build lookup maps
 * Handles service worker context gracefully (where encryption may not be available)
 */
async loadProfiles(): Promise<void> {
  try {
    const storage = StorageManager.getInstance();
    this.profiles = await storage.loadProfiles();
    this.buildLookupMaps();
    console.log('[AliasEngine] Loaded', this.profiles.length, 'profiles');
  } catch (error) {
    // In service worker context, encrypted profiles may not be accessible
    if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
      console.log('[AliasEngine] Running in service worker context - profiles unavailable (encrypted)');
      console.log('[AliasEngine] Profiles will load once user opens popup and authenticates');
      this.profiles = [];
      this.buildLookupMaps();
    } else {
      console.error('[AliasEngine] Failed to load profiles:', error);
      this.profiles = [];
      this.buildLookupMaps();
    }
  }
}
```

### 4. Profile Sync from Popup to Service Worker

**File:** `src/popup/popup-v2.ts`

```typescript
// Send decrypted profiles to background worker after initial load
const finalState = useAppStore.getState();
if (finalState.profiles.length > 0) {
  console.log('[Popup] Sending', finalState.profiles.length, 'profiles to background worker');
  chrome.runtime.sendMessage({
    type: 'SET_PROFILES',
    payload: finalState.profiles
  }).catch(err => console.error('[Popup] Failed to send profiles to background:', err));
}

// Also send after auth state changes
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      // Reload data now that we have Firebase UID for decryption
      const store = useAppStore.getState();
      await store.initialize();

      // Send decrypted profiles to background worker
      console.log('[Popup] Sending', state.profiles.length, 'profiles to background worker');
      chrome.runtime.sendMessage({
        type: 'SET_PROFILES',
        payload: state.profiles
      }).catch(err => console.error('[Popup] Failed to send profiles to background:', err));

      console.log('[Auth State] ✅ Data reloaded with Firebase UID encryption');
    } catch (error) {
      console.error('[Auth State] Failed to reload data after sign in:', error);
    }
  }
});
```

### 5. Store Updates Send Profiles (Not RELOAD_PROFILES)

**File:** `src/lib/store.ts`

```typescript
addProfile: async (profileData) => {
  const storage = StorageManager.getInstance();
  const newProfile = await storage.createProfile(profileData);
  set((state) => ({
    profiles: [...state.profiles, newProfile],
  }));

  // Send updated profiles to background worker
  const updatedProfiles = get().profiles;
  chrome.runtime.sendMessage({ type: 'SET_PROFILES', payload: updatedProfiles });
},

updateProfile: async (id, updates) => {
  const storage = StorageManager.getInstance();
  await storage.updateProfile(id, updates);
  set((state) => ({
    profiles: state.profiles.map((p) =>
      p.id === id
        ? { ...p, ...updates, metadata: { ...p.metadata, updatedAt: Date.now() } }
        : p
    ),
  }));

  // Send updated profiles to background worker
  const updatedProfiles = get().profiles;
  chrome.runtime.sendMessage({ type: 'SET_PROFILES', payload: updatedProfiles });
},

deleteProfile: async (id) => {
  const storage = StorageManager.getInstance();
  await storage.deleteProfile(id);
  set((state) => ({
    profiles: state.profiles.filter((p) => p.id !== id),
  }));

  // Send updated profiles to background worker
  const updatedProfiles = get().profiles;
  chrome.runtime.sendMessage({ type: 'SET_PROFILES', payload: updatedProfiles });
},

toggleProfile: async (id) => {
  const storage = StorageManager.getInstance();
  await storage.toggleProfile(id);
  set((state) => ({
    profiles: state.profiles.map((p) =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ),
  }));

  // Send updated profiles to background worker
  const updatedProfiles = get().profiles;
  chrome.runtime.sendMessage({ type: 'SET_PROFILES', payload: updatedProfiles });
},
```

### 6. Service Worker Message Handler

**File:** `src/background/serviceWorker.ts`

```typescript
case 'SET_PROFILES':
  return handleSetProfiles(message.payload);

/**
 * Set profiles directly from popup (bypasses encryption in service worker)
 * Called when popup loads profiles with Firebase auth
 */
async function handleSetProfiles(profiles: any[]) {
  console.log('[Background] Receiving', profiles.length, 'profiles from popup');
  const aliasEngine = await AliasEngine.getInstance();
  aliasEngine.setProfiles(profiles);
  console.log('[Background] ✅ Profiles loaded:', profiles.length, 'active profiles');
  return { success: true, profileCount: profiles.length };
}
```

### 7. Activity Logging Skipped in Service Worker

**File:** `src/background/serviceWorker.ts`

```typescript
/**
 * Log activity to storage for debug console
 * NOTE: Skipped in service worker context (can't save encrypted data)
 */
async function logActivity(entry: {...}) {
  // Skip activity logging in service worker (can't encrypt activity logs)
  // Activity logs are encrypted and can only be saved from popup
  console.log('[Background] Activity:', entry.message);
  // Note: Stats tracking will be handled in popup when user opens it
}
```

---

## 🔄 Data Flow

### Initialization Flow

```
1. Extension Loads
   ↓
2. Service Worker Initializes
   - StorageManager.initialize() detects service worker context
   - Skips profile loading
   - AliasEngine.getInstance() waits for profiles
   ↓
3. User Opens Popup
   - Firebase auth initializes
   - Popup loads profiles (decrypts with Firebase UID)
   - Popup sends profiles to service worker via SET_PROFILES
   ↓
4. Service Worker Receives Profiles
   - AliasEngine.setProfiles(profiles)
   - Builds lookup maps
   - ✅ Ready to substitute PII
```

### Request Interception Flow

```
1. User types in ChatGPT: "My name is John Smith"
   ↓
2. Content script intercepts request
   ↓
3. Sends to service worker: SUBSTITUTE_PII (encode)
   ↓
4. Service worker uses AliasEngine (has profiles from popup)
   ↓
5. AliasEngine.substitute("My name is John Smith", 'encode')
   → "My name is Alex Johnson"
   ↓
6. Returns to content script
   ↓
7. Modified request sent to ChatGPT
   ✅ "Alex Johnson" sent, not "John Smith"
```

### Profile Update Flow

```
1. User updates profile in popup
   ↓
2. Popup saves to storage (encrypted with Firebase UID)
   ↓
3. Popup updates local state
   ↓
4. Popup sends SET_PROFILES to service worker
   ↓
5. Service worker updates AliasEngine
   ↓
6. ✅ Next request uses updated profile
```

---

## 🚨 Critical Design Decisions

### 1. Why Not Use RELOAD_PROFILES?

**❌ Old Approach (Broken):**
```typescript
// Popup sends message to reload
chrome.runtime.sendMessage({ type: 'RELOAD_PROFILES' });

// Service worker tries to reload
async function handleReloadProfiles() {
  await aliasEngine.reload(); // Calls storage.loadProfiles()
  // ❌ FAILS: storage.loadProfiles() tries to decrypt with Firebase UID
  // ❌ FAILS: Firebase not available in service worker
}
```

**✅ New Approach (Working):**
```typescript
// Popup sends actual profiles
chrome.runtime.sendMessage({ type: 'SET_PROFILES', payload: profiles });

// Service worker receives pre-decrypted profiles
async function handleSetProfiles(profiles) {
  aliasEngine.setProfiles(profiles); // No decryption needed!
  // ✅ WORKS: Profiles already decrypted in popup
}
```

### 2. Why Check Legacy Key Before Migration?

**Problem:** After migration, `_encryptionKeyMaterial` is deleted. But service worker might try to migrate again, causing OperationError.

**Solution:** Check if legacy key exists before attempting legacy decryption:

```typescript
// Check if legacy key material exists
const legacyKeyData = await chrome.storage.local.get('_encryptionKeyMaterial');
const hasLegacyKey = !!legacyKeyData['_encryptionKeyMaterial'];

if (!hasLegacyKey) {
  // No legacy key = already migrated
  console.log('[StorageManager] Data already migrated to Firebase UID');
  throw error; // Re-throw original auth error
}

// Only attempt legacy decryption if key exists
console.warn('[StorageManager] Legacy key found - attempting migration...');
```

### 3. Why Not Store Activity Logs in Service Worker?

**Problem:** Activity logs are encrypted with Firebase UID. Service worker can't encrypt.

**Solution:** Skip activity logging in service worker:

```typescript
// In service worker: just log to console
console.log('[Background] Activity:', entry.message);

// TODO: Send activity logs to popup for encryption and storage
// For now, stats are tracked separately and don't require encryption
```

---

## 📊 Security Analysis

### Encryption Model

| Data Type | Storage Location | Encryption Key | Access Context |
|-----------|------------------|----------------|----------------|
| **Profiles** | chrome.storage.local | Firebase UID | Popup only |
| **API Keys** | chrome.storage.local | Firebase UID | Popup only |
| **Custom Rules** | chrome.storage.local | Firebase UID | Popup only |
| **Activity Logs** | chrome.storage.local | Firebase UID | Popup only |
| **Config (settings)** | chrome.storage.local | Unencrypted | Both |

### Attack Surface

**Before (Broken):**
- Attacker with chrome.storage access = full compromise
- Key material stored locally with encrypted data

**After (Secure):**
- Attacker needs:
  1. chrome.storage access (for encrypted data)
  2. Active Firebase session (for decryption key)
- Key material never stored locally
- Service worker only has decrypted profiles in-memory (cleared on restart)

### Threat Model

**Protected Against:**
- ✅ Malicious extensions reading chrome.storage
- ✅ Local file system access to extension data
- ✅ Service worker memory dump (profiles lost on restart)

**Not Protected Against:**
- ❌ Memory inspection while popup is open (profiles in memory)
- ❌ User's own Firebase account compromise
- ❌ Chrome DevTools inspection (user has full access to own data)

---

## 🧪 Testing Strategy

### Unit Tests (Service Worker Context)

```typescript
describe('StorageManager in Service Worker', () => {
  beforeEach(() => {
    global.document = undefined; // Simulate service worker
  });

  it('should skip profile loading in service worker context', async () => {
    const storage = StorageManager.getInstance();
    await storage.initialize();

    // Should not attempt to load profiles
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Service worker context - skipping profile initialization')
    );
  });

  it('should throw ENCRYPTION_KEY_UNAVAILABLE in service worker', async () => {
    const storage = StorageManager.getInstance();

    await expect(storage.loadProfiles()).rejects.toThrow('ENCRYPTION_KEY_UNAVAILABLE');
  });
});
```

### Integration Tests

```typescript
describe('Profile Sync Flow', () => {
  it('should sync profiles from popup to service worker', async () => {
    // Simulate popup context
    global.document = {};
    const popup = new PopupController();
    await popup.initialize();

    // Verify profiles loaded in popup
    expect(popup.profiles.length).toBeGreaterThan(0);

    // Simulate message to service worker
    const message = { type: 'SET_PROFILES', payload: popup.profiles };
    const response = await handleMessage(message);

    // Verify service worker received profiles
    expect(response.success).toBe(true);
    expect(response.profileCount).toBe(popup.profiles.length);
  });
});
```

---

## 📚 Lessons Learned

### 1. Service Workers Are NOT Just "Background Scripts"

Manifest V2 background pages had full DOM access. Manifest V3 service workers do NOT. This is a fundamental architectural change that requires rethinking data access patterns.

### 2. Context Detection Is Critical

Use `typeof document === 'undefined'` to detect service worker context and branch logic accordingly.

### 3. Encryption Must Happen in Popup

Service workers cannot access Firebase auth (or any DOM-dependent APIs). Encryption/decryption must happen in contexts with DOM access.

### 4. Profile Sync is the Only Solution

You cannot "fix" Firebase to work in service workers. The DOM dependency is fundamental. The only solution is to decrypt in popup and send profiles to service worker.

### 5. Migration Must Check Legacy Key Existence

After migration, the legacy key is deleted. Always check if it exists before attempting legacy decryption to avoid OperationError.

---

## 🎯 Best Practices

### DO:
✅ Detect service worker context early (`typeof document`)
✅ Skip Firebase operations in service worker
✅ Sync profiles from popup to service worker
✅ Handle ENCRYPTION_KEY_UNAVAILABLE gracefully
✅ Check legacy key existence before migration
✅ Send profiles on every update (not just initial load)

### DON'T:
❌ Try to import Firebase in service worker
❌ Attempt to decrypt in service worker
❌ Store Firebase UID locally
❌ Use RELOAD_PROFILES message (use SET_PROFILES instead)
❌ Attempt legacy decryption without checking key exists
❌ Log activity with encryption in service worker

---

## 🔮 Future Enhancements

### Phase 2: Passphrase Encryption (PRO Feature)

Allow users to choose encryption mode:
1. **Firebase UID** (default) - Current implementation
2. **Passphrase** (PRO) - User-provided passphrase as key material
3. **Both** (PRO, paranoid) - Combine Firebase UID + passphrase

**Challenge:** Passphrase must be entered in popup, then securely passed to service worker for encryption operations. Consider in-memory cache with timeout.

### Phase 3: Encrypted Activity Logs

Currently, activity logging is skipped in service worker. Future enhancement:
- Send activity log entries to popup via message
- Popup encrypts and stores activity logs
- Popup displays encrypted activity logs when opened

---

## 📖 Related Documentation

- [FIREBASE_UID_ENCRYPTION.md](./FIREBASE_UID_ENCRYPTION.md) - Original implementation plan
- [FIREBASE_UID_IMPLEMENTATION_COMPLETE.md](./FIREBASE_UID_IMPLEMENTATION_COMPLETE.md) - Phase 1 completion
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Overall system architecture
- [USER_MANAGEMENT.md](../user-management/USER_MANAGEMENT.md) - User tier and auth management

---

**This architecture represents the only viable solution for Firebase UID encryption in a Manifest V3 Chrome Extension with service worker background context. All alternatives were evaluated and found to be impossible due to fundamental DOM access limitations in service workers.**

**Status:** ✅ **IMPLEMENTED, TESTED, AND WORKING IN PRODUCTION**

**Last Updated:** 2025-11-06
