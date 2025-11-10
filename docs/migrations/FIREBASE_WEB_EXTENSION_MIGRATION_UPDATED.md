# Firebase Web Extension Migration Plan (Updated for Modular Architecture)
**Date Created:** 2025-01-09
**Date Updated:** 2025-01-10 (Post-Refactoring)
**Status:** 🟢 READY TO START (Phase 1 Complete, Refactoring Complete)
**Complexity:** ⚠️ CRITICAL - App-wide architectural change
**Estimated Time:** 2-3 days (simplified by modular architecture)

---

## Executive Summary

**Problem:** Service worker cannot access Firebase auth, causing:
- ❌ Badge shows "protected" when profiles not loaded
- ❌ Stats don't track until popup opens
- ❌ User must open popup after every reload for protection to work
- ❌ Activity logs queue indefinitely if popup never opened

**Solution:** Migrate from `firebase/auth` to `firebase/auth/web-extension` in service worker context.

**Impact:** With the new modular architecture, this migration is now much cleaner:
- ✅ Phase 1 (Firebase auth) - **COMPLETED**
- ✅ Phase 0 (Refactoring) - **COMPLETED**
- 🟡 Phases 2-7 remain, but simplified by modular structure

---

## Phase 0 Prerequisite: ✅ COMPLETED (2025-01-10)

**Modular Refactoring** broke down monolithic files into focused modules:
- `storage.ts` (2,270 lines) → 10 modules in `src/lib/storage/`
- `serviceWorker.ts` (1,259 lines) → 13 modules in `src/background/`

**Benefits for Migration:**
- Clear separation of concerns makes changes easier to locate
- Encryption logic isolated in `StorageEncryptionManager.ts`
- Activity logging isolated in `ActivityLogger.ts` (can be deprecated)
- Message handling isolated in `MessageRouter.ts` and handler classes
- Badge logic isolated in `BadgeManager.ts`

---

## Updated File Structure (Post-Refactoring)

### Storage Module
```
src/lib/
├── storage.ts (501 lines) - Main orchestrator
└── storage/
    ├── StorageEncryptionManager.ts      - Encryption/decryption
    ├── StorageConfigManager.ts          - Config operations
    ├── StorageProfileManager.ts         - Profile CRUD
    ├── StorageAPIKeyVaultManager.ts     - API key management
    ├── StorageCustomRulesManager.ts     - Custom rules
    ├── StoragePromptTemplatesManager.ts - Templates
    ├── StorageDocumentAliasManager.ts   - Document analysis
    ├── StorageMigrationManager.ts       - V1→V2 migrations
    ├── storage-utils.ts                 - Utilities
    └── index.ts                         - Public API
```

### Service Worker Module
```
src/background/
├── serviceWorker.ts (213 lines) - Main orchestrator
├── processors/
│   ├── RequestProcessor.ts   - PII substitution logic
│   └── ResponseProcessor.ts  - Alias decoding logic
├── managers/
│   ├── BadgeManager.ts           - Badge state & updates
│   ├── ContentScriptManager.ts   - Script injection
│   └── ActivityLogger.ts         - Activity logging (TO BE DEPRECATED)
├── handlers/
│   ├── MessageRouter.ts          - Central message routing
│   ├── AliasHandlers.ts          - Alias CRUD
│   ├── ConfigHandlers.ts         - Config operations
│   ├── APIKeyHandlers.ts         - API key operations
│   └── CustomRulesHandlers.ts    - Custom rules operations
└── utils/
    └── ServiceDetector.ts        - AI service detection
```

---

## Phase 1: Core Firebase Auth - ✅ COMPLETED

**What was done:**
- ✅ Updated `src/lib/firebase.ts` with context detection
- ✅ Static imports for both `firebase/auth` and `firebase/auth/web-extension`
- ✅ Created `src/background/polyfills.ts` for service worker DOM stubs
- ✅ Updated `StorageEncryptionManager.ts` to use context-aware Firebase
- ✅ Tested auth in both popup and service worker contexts
- ✅ Verified `auth.currentUser` works in both contexts

**Result:** Firebase auth now works in service worker! Profiles can decrypt.

---

## Phase 2: Storage & Encryption Changes

### 2.1 Update StorageMigrationManager.ts

**File:** `src/lib/storage/StorageMigrationManager.ts`

**Current State (lines 31-47):**
```typescript
// Skip profile loading in service worker - profiles will be sent from popup
if (isServiceWorker) {
  console.log('[StorageMigrationManager] Service worker context - skipping profile initialization');
  console.log('[StorageMigrationManager] Profiles will be sent from popup via SET_PROFILES message');
  return;
}

const profiles = await this.profileManager.loadProfiles();
```

**Required Changes:**
```typescript
// REMOVE lines 31-36 - Service worker CAN load profiles now

// Load profiles in ALL contexts (service worker and popup)
const profiles = await this.profileManager.loadProfiles();
if (!profiles || profiles.length === 0) {
  await this.profileManager.saveProfiles([]);
}

console.log(`[StorageMigrationManager] ✅ Loaded ${profiles.length} profiles in ${isServiceWorker ? 'SERVICE WORKER' : 'POPUP'} context`);
```

**Complexity:** 🟢 LOW
**Risk:** Low - simple deletion
**Test:** Verify profiles load in service worker after extension reload

---

### 2.2 Update StorageEncryptionManager.ts (Minor cleanup)

**File:** `src/lib/storage/StorageEncryptionManager.ts`

**Current State (lines 122-133):**
```typescript
if (isServiceWorker && !this.customAuthInstance) {
  // In service worker, Firebase auth won't work (no DOM)
  // Immediately throw auth unavailable error (unless custom auth provided for tests)
  throw new Error(
    'ENCRYPTION_KEY_UNAVAILABLE: Firebase auth not available in service worker context. ' +
    'Encrypted data can only be accessed from popup/content contexts.'
  );
}
```

**Required Changes:**
```typescript
// REMOVE this entire block (lines 122-133)
// Auth now works in service worker via firebase/auth/web-extension

// The code will fall through to the normal auth import logic
```

**Complexity:** 🟢 LOW
**Risk:** None - this error check is now obsolete
**Test:** Encryption works in service worker

---

## Phase 3: Service Worker Cleanup

### 3.1 Remove SET_PROFILES Handler

**File:** `src/background/handlers/AliasHandlers.ts`

**Current State (lines 70-84):**
```typescript
async handleSetProfiles(profiles: AliasProfile[]): Promise<void> {
  console.log(`[AliasHandlers] Receiving ${profiles.length} profiles from popup`);
  this.aliasEngine.setProfiles(profiles);
  console.log(`[AliasHandlers] ✅ Profiles loaded: ${profiles.filter(p => p.enabled).length} active profiles`);
}
```

**Required Changes:**
```typescript
// DELETE entire handleSetProfiles method (lines 70-84)
// No longer needed - service worker loads profiles directly
```

**Complexity:** 🟢 LOW
**Risk:** None
**Test:** Profiles still load in service worker

---

### 3.2 Remove SET_PROFILES from MessageRouter

**File:** `src/background/handlers/MessageRouter.ts`

**Current State (lines 58-60):**
```typescript
case 'SET_PROFILES':
  return this.aliasHandlers.handleSetProfiles(message.payload);
```

**Required Changes:**
```typescript
// DELETE lines 58-60
// Remove SET_PROFILES case from switch statement
```

**Complexity:** 🟢 LOW
**Risk:** None
**Test:** TypeScript compiles without errors

---

### 3.3 Deprecate ActivityLogger (or update for direct encryption)

**File:** `src/background/managers/ActivityLogger.ts`

**Option A: Update to encrypt directly (RECOMMENDED)**

**Current State (lines 27-56):**
```typescript
async logActivity(entry: ActivityLogEntry): Promise<void> {
  this.activityLogQueue.push(entry);

  try {
    await chrome.runtime.sendMessage({
      type: 'ADD_ACTIVITY_LOG',
      payload: entry
    });
    // ... success handling
  } catch (error) {
    console.log('[ActivityLogger] Popup not available - activity queued');
  }
}
```

**Required Changes:**
```typescript
async logActivity(entry: ActivityLogEntry): Promise<void> {
  // Service worker can now encrypt directly - no queue needed
  try {
    const storage = StorageManager.getInstance();
    const config = await storage.loadConfig();

    // Add log to config's activity log array
    config.stats.activityLog = config.stats.activityLog || [];
    config.stats.activityLog.push(entry);

    // Keep only last 100 entries
    if (config.stats.activityLog.length > 100) {
      config.stats.activityLog = config.stats.activityLog.slice(-100);
    }

    // Save config (StorageConfigManager will encrypt activity logs)
    await storage.saveConfig(config);

    console.log('[ActivityLogger] ✅ Activity log encrypted and saved directly');
  } catch (error) {
    console.error('[ActivityLogger] Failed to save activity log:', error);
  }
}

// DELETE flushQueueToPopup() method - no longer needed
// DELETE activityLogQueue property - no longer needed
// DELETE getQueueSize() method - no longer needed
```

**Option B: Remove ActivityLogger entirely**
- Move `logActivity()` logic directly into `RequestProcessor.ts`
- Remove `ActivityLogger.ts` file
- Update `serviceWorker.ts` to not instantiate ActivityLogger

**Complexity:** 🟡 MEDIUM (Option A) / 🟢 LOW (Option B)
**Risk:** Medium - affects stats tracking
**Test:** Verify stats track immediately without popup

**Recommendation:** Start with Option A (safer), then consider Option B in future cleanup

---

### 3.4 Remove FLUSH_ACTIVITY_LOGS Handler

**File:** `src/background/handlers/MessageRouter.ts`

**Current State:**
```typescript
case 'FLUSH_ACTIVITY_LOGS':
  return this.activityLogger.flushQueueToPopup();
```

**Required Changes:**
```typescript
// DELETE FLUSH_ACTIVITY_LOGS case
// No longer needed with direct encryption
```

**Complexity:** 🟢 LOW
**Risk:** None
**Test:** Popup doesn't request flush

---

## Phase 4: Popup Cleanup

### 4.1 Remove Profile Sending Logic

**File:** `src/popup/popup-v2.ts`

**Current State (lines 263-268):**
```typescript
console.log(`[Popup] Sending ${finalState.profiles.length} profiles to background worker`);
chrome.runtime.sendMessage({
  type: 'SET_PROFILES',
  payload: finalState.profiles
});
```

**Required Changes:**
```typescript
// DELETE lines 263-268
// Service worker loads profiles directly now
console.log(`[Popup] Profiles loaded: ${finalState.profiles.length}`);
```

**Complexity:** 🟢 LOW
**Risk:** None
**Test:** Popup still loads correctly

---

### 4.2 Remove Activity Log Flush Request

**File:** `src/popup/popup-v2.ts`

**Current State (lines 271-278):**
```typescript
console.log('[Popup] Requesting queued activity logs from background...');
const flushResponse = await chrome.runtime.sendMessage({
  type: 'FLUSH_ACTIVITY_LOGS'
});
```

**Required Changes:**
```typescript
// DELETE lines 271-278
// No queue to flush - logs save directly
```

**Complexity:** 🟢 LOW
**Risk:** None
**Test:** Popup still displays stats

---

### 4.3 Remove Activity Log Receiver

**File:** `src/popup/popup-v2.ts`

**Current State (lines 380-397):**
```typescript
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'ADD_ACTIVITY_LOG') {
    // Handle activity log from background
    console.log('[Popup] Received activity log from background:', message.payload);
    // ... encryption and saving logic
  }
});
```

**Required Changes:**
```typescript
// DELETE entire ADD_ACTIVITY_LOG listener (lines 380-397)
// Logs are saved directly in service worker now
```

**Complexity:** 🟢 LOW
**Risk:** None
**Test:** Stats still display correctly (loaded from storage)

---

## Phase 5: Message Type Cleanup

### 5.1 Remove Obsolete Message Types

**File:** `src/lib/types.ts`

**Current State:**
```typescript
export type MessageType =
  | 'SET_PROFILES'           // ← DELETE
  | 'FLUSH_ACTIVITY_LOGS'    // ← DELETE
  | 'ADD_ACTIVITY_LOG'       // ← DELETE
  | 'GET_PROFILES'
  | 'GET_CONFIG'
  // ... other types
```

**Required Changes:**
```typescript
export type MessageType =
  | 'GET_PROFILES'           // ← KEEP (content script still uses)
  | 'GET_CONFIG'             // ← KEEP
  | 'RELOAD_PROFILES'        // ← KEEP
  | 'SUBSTITUTE_REQUEST'     // ← KEEP
  | 'SUBSTITUTE_RESPONSE'    // ← KEEP
  // ... other types

// DELETE:
// - 'SET_PROFILES'
// - 'FLUSH_ACTIVITY_LOGS'
// - 'ADD_ACTIVITY_LOG'
```

**Complexity:** 🟢 LOW
**Risk:** TypeScript will catch any missed references
**Test:** Build succeeds with no errors

---

## Phase 6: Badge & UX Improvements

### 6.1 Update Badge Logic to Check Profiles

**File:** `src/background/managers/BadgeManager.ts`

**Current State (lines 55-95):**
```typescript
async checkAndUpdateBadge(tabId: number, url?: string): Promise<void> {
  if (!url || !this.isAIServiceURL(url)) {
    await this.updateBadge(tabId, 'disabled');
    return;
  }

  // Check if content script injected
  const isInjected = await this.contentScriptManager.isContentScriptInjected(tabId);
  const config = await this.storage.loadConfig();

  // Missing: Check if profiles are loaded
  const isProtected = isInjected && config.settings.enabled;
  await this.updateBadge(tabId, isProtected ? 'protected' : 'unprotected');
}
```

**Required Changes:**
```typescript
async checkAndUpdateBadge(tabId: number, url?: string): Promise<void> {
  if (!url || !this.isAIServiceURL(url)) {
    await this.updateBadge(tabId, 'disabled');
    return;
  }

  // Check all protection requirements
  const isInjected = await this.contentScriptManager.isContentScriptInjected(tabId);
  const config = await this.storage.loadConfig();

  // NEW: Check if profiles are loaded and active
  const profiles = await this.storage.loadProfiles();
  const hasActiveProfiles = profiles.some(p => p.enabled);

  // All three conditions must be true for protection
  const isProtected = isInjected && config.settings.enabled && hasActiveProfiles;

  if (!isProtected && isInjected && config.settings.enabled) {
    // Extension enabled but no profiles - show warning
    console.log(`[BadgeManager] Tab ${tabId}: NO ACTIVE PROFILES (Warning)`);
  }

  await this.updateBadge(tabId, isProtected ? 'protected' : 'unprotected');
}
```

**Complexity:** 🟢 LOW
**Risk:** None
**Test:** Badge colors update correctly based on profiles

---

### 6.2 Remove Toast on Protected Pages (Optional Enhancement)

**Context:** Currently toast shows "YOU ARE PROTECTED" when visiting AI services, even before profiles load.

**File:** `src/content/content.ts`

**Optional Changes:**
```typescript
// Add check before showing toast:
const response = await chrome.runtime.sendMessage({ type: 'GET_PROFILES' });
if (!response.profiles || response.profiles.length === 0) {
  // Don't show toast - not actually protected yet
  return;
}
```

**Complexity:** 🟡 MEDIUM
**Risk:** Low - UX improvement
**Test:** Toast only shows when profiles actually loaded

---

## Phase 7: Integration Testing

### Test Scenarios

#### 7.1 Fresh Install
- [ ] Install extension
- [ ] Do NOT open popup
- [ ] Visit ChatGPT
- [ ] Badge should show "unprotected" (no profiles)
- [ ] No toast should appear
- [ ] Sign in via auth button
- [ ] Service worker loads profiles automatically
- [ ] Badge turns green
- [ ] Toast appears
- [ ] Send message → verify substitution works

#### 7.2 Extension Reload
- [ ] Reload extension while signed in
- [ ] Do NOT open popup
- [ ] Service worker loads profiles from storage
- [ ] Visit ChatGPT → badge green immediately
- [ ] Send message → substitution works without popup

#### 7.3 Sign Out Flow
- [ ] Sign out
- [ ] Service worker detects auth state change
- [ ] Profiles cleared/inaccessible
- [ ] Badge turns red/gray
- [ ] No substitution occurs

#### 7.4 Multi-Tab Consistency
- [ ] Open 3 tabs with different AI services
- [ ] All badges show consistent state
- [ ] Substitution works in all tabs
- [ ] Stats track from all tabs

#### 7.5 Stats Tracking
- [ ] Send message in ChatGPT (popup closed)
- [ ] Activity logs immediately
- [ ] Open popup → stats display correctly
- [ ] No queue flush needed

---

## Migration Execution Plan

### Day 1: Storage & Core Changes
**Morning:**
1. Update `StorageMigrationManager.ts` - remove service worker skip logic
2. Update `StorageEncryptionManager.ts` - remove obsolete error check
3. Test profile loading in service worker

**Afternoon:**
4. Remove `SET_PROFILES` handler from `AliasHandlers.ts`
5. Remove `SET_PROFILES` case from `MessageRouter.ts`
6. Test service worker still loads profiles

**Evening:**
7. Run integration tests
8. Commit: "Phase 2: Enable profile loading in service worker"

---

### Day 2: Activity Logging & Popup Cleanup
**Morning:**
1. Update `ActivityLogger.ts` to encrypt directly
2. Remove `FLUSH_ACTIVITY_LOGS` handler
3. Test activity logging without popup

**Afternoon:**
4. Remove profile sending logic from `popup-v2.ts`
5. Remove activity log receiver from `popup-v2.ts`
6. Remove flush request from `popup-v2.ts`
7. Test popup still works independently

**Evening:**
8. Run integration tests
9. Commit: "Phase 3-4: Direct activity encryption & popup cleanup"

---

### Day 3: Message Types, Badge, & Final Testing
**Morning:**
1. Remove obsolete message types from `types.ts`
2. Update badge logic in `BadgeManager.ts`
3. Fix any TypeScript compilation errors

**Afternoon:**
4. Full integration testing suite
5. Multi-tab testing
6. Fresh install testing
7. Sign in/out flow testing

**Evening:**
8. Final code review
9. Update documentation
10. Commit: "Phase 5-7: Complete Firebase Web Extension migration"

---

## Rollback Plan

If issues arise:
1. **Revert storage changes** - Restore skip logic in `StorageMigrationManager.ts`
2. **Restore message handlers** - Re-add `SET_PROFILES` and activity log handlers
3. **Restore popup logic** - Re-add profile sending and activity log receiver
4. **Restore message types** - Re-add deleted message types
5. **Test rollback** - Verify old flow works

**Rollback Commits:**
- Each phase should be a separate commit
- Use `git revert <commit>` to undo specific phases
- Test after each revert

---

## Success Criteria

- ✅ Service worker loads profiles on startup (no popup needed)
- ✅ Service worker encrypts activity logs directly
- ✅ Badge shows correct status based on profiles
- ✅ Stats track immediately without popup
- ✅ No profile/activity queue messages needed
- ✅ All existing tests pass
- ✅ No regressions in functionality
- ✅ Build succeeds with no errors
- ✅ Extension works on fresh install
- ✅ Extension works after reload

---

## Post-Migration Cleanup (Future)

**Potential Further Simplifications:**
1. **Deprecate ActivityLogger entirely** - Move logic to RequestProcessor
2. **Remove AliasHandlers.handleReloadProfiles** - May be unnecessary
3. **Simplify auth state sync** - Service worker can listen to auth changes directly
4. **Remove legacy V1 alias code** - After confirming all users migrated

---

## Notes

- **Modular architecture makes migration easier:** Each phase targets specific modules
- **Clear separation of concerns:** Changes are localized to specific files
- **Testing is simpler:** Each module can be tested independently
- **Rollback is safer:** Each phase is isolated and reversible

---

**Next Step:** Begin Phase 2 implementation following this updated plan.
