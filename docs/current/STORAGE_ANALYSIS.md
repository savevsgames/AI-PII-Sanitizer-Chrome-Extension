# Storage Analysis: Chrome Storage Usage & Quota Management

**Date**: 2025-11-09
**Status**: INCONSISTENT - Documentation says 10MB limit, App has unlimited storage
**Impact**: HIGH - UI shows misleading information to users

---

## Executive Summary

### The Problem

Our app has **inconsistent storage quota messaging**:
- ✅ **Manifest**: Requests `unlimitedStorage` permission (line 8)
- ❌ **UI**: Shows "10MB limit" warnings to users
- ❌ **Docs**: Reference non-existent 10MB limits
- ❌ **Tests**: Mock 10MB quota that doesn't exist in production

### The Reality

**We actually have UNLIMITED storage** via the `unlimitedStorage` permission, but:
1. Users see "10MB limit" warnings in the UI
2. Storage quota monitoring tracks against 10MB
3. Documentation incorrectly states 10MB limits
4. Tests incorrectly mock 10MB quotas

---

## Current Storage Implementation

### 1. Manifest Permission (src/manifest.json:8)

```json
"permissions": [
  "storage",
  "unlimitedStorage",  // ← WE HAVE UNLIMITED STORAGE
  "activeTab",
  "scripting",
  "tabs",
  "identity"
]
```

**Status**: ✅ CORRECT - We request and receive unlimited storage

---

### 2. What's Stored in chrome.storage.local

#### Encrypted Data (Requires Firebase Auth UID):
1. **`__aliases_v2`** - User's alias entries (encrypted)
2. **`__profiles_v2`** - User's alias profiles (encrypted)
3. **`documentAliases`** - Document analysis aliases (encrypted)
4. **`__config`** - User configuration including:
   - Account info (tier, email, Firebase UID)
   - Prompt templates
   - Custom rules
   - API keys (OpenRouter, etc.) - encrypted
   - Keyboard shortcuts
   - Background images (base64 encoded)

#### Unencrypted Metadata:
5. **`__salt`** - Encryption salt (public, safe to store unencrypted)
6. **`_keyMaterial`** - Non-sensitive key derivation material
7. **`__dataVersion`** - Schema version for migrations

---

### 3. Storage Quota Detection (src/lib/storage.ts:2215-2237)

```typescript
async getStorageQuota(): Promise<{
  used: number;
  quota: number;
  percentage: number;
  hasUnlimitedStorage: boolean;
}> {
  const estimate = await navigator.storage.estimate();

  const used = estimate.usage || 0;
  const quota = estimate.quota || 10485760; // 10 MB fallback
  const percentage = (used / quota) * 100;

  // Check if we have unlimited storage
  // With unlimitedStorage permission, quota is huge (disk space)
  const hasUnlimitedStorage = quota > 100000000; // > 100 MB = unlimited

  return {
    used,
    quota,
    percentage,
    hasUnlimitedStorage
  };
}
```

**Status**: ✅ CORRECT - Properly detects unlimited storage when quota > 100MB

---

### 4. UI Display (INCONSISTENT)

#### Settings Tab (src/popup/popup-v2.html:473-476)

```html
<span class="storage-quota" id="storageQuota">of 10 MB</span>

<span class="storage-hint" id="storageHint">
  ℹ️ Chrome extensions have a 10MB storage limit
</span>
```

**Status**: ❌ **MISLEADING** - Shows "10MB limit" even though we have unlimited

#### Settings Handler (src/popup/components/settingsHandlers.ts:539-572)

```typescript
const usage = await storage.getStorageUsage();

if (quotaEl) {
  quotaEl.textContent = `of ${usage.formattedQuota}`;
}

// Warning thresholds (assumes 10MB limit)
if (usage.percentUsed >= 90) {
  hintEl.textContent = '⚠️ Storage almost full! Delete profiles to free space.';
} else if (usage.percentUsed >= 80) {
  hintEl.textContent = '⚠️ Storage usage is high...';
} else {
  hintEl.textContent = 'ℹ️ Chrome extensions have a 10MB storage limit';
}
```

**Status**: ❌ **INCORRECT** - Shows warnings based on 10MB that don't apply

#### Document Analysis (src/document-preview.ts:597-612)

```typescript
async function updateStorageQuota() {
  const quota = await state.getStorageQuota();

  if (quota.hasUnlimitedStorage) {
    storageTextEl.textContent = `${formatBytes(quota.used)} used (Unlimited)`;
  } else {
    storageTextEl.textContent = `${formatBytes(quota.used)} / ${formatBytes(quota.quota)}`;
  }
}
```

**Status**: ✅ CORRECT - Shows "(Unlimited)" when detected

#### Background Manager (src/popup/components/backgroundManager.ts:478-494)

```typescript
async function updateStorageQuotaDisplay(): Promise<void> {
  const usage = await storage.getStorageUsage();

  // Always uses getStorageUsage() which returns chrome.storage.local.QUOTA_BYTES (10MB)
  // Does NOT check for unlimited storage
}
```

**Status**: ❌ **INCORRECT** - Uses old API that returns 10MB

---

## Size Analysis: What Takes Up Space?

### Small Data (< 100 KB each):
- ✅ Aliases (JSON, encrypted) - ~1-5 KB per 100 aliases
- ✅ Profiles (JSON, encrypted) - ~1-2 KB per profile
- ✅ Config (JSON, encrypted) - ~5-10 KB
- ✅ Document aliases (JSON, encrypted) - ~2-5 KB per document

### Large Data (> 100 KB each):
- ⚠️ **Custom background images** (base64 encoded) - **UP TO 2-3 MB PER IMAGE**
  - User can upload custom images for backgrounds
  - Stored as base64 strings in config
  - **THIS is why we added unlimited storage!**

### Example Storage Breakdown:
```
Typical user (no custom images):
- Aliases: 5 KB
- Profiles: 10 KB
- Config: 8 KB
- Document aliases: 20 KB
= ~43 KB total (0.4% of 10MB)

Power user (with custom images):
- Aliases: 20 KB
- Profiles: 50 KB
- Config: 100 KB
- Document aliases: 100 KB
- Custom background images: 5-10 MB
= ~5-10 MB total (50-100% of would-be 10MB limit)
```

**Without `unlimitedStorage`, power users would hit the limit immediately!**

---

## Issues Found

### Critical Issues:

1. **❌ UI shows "10MB limit" even though we have unlimited**
   - Location: `src/popup/popup-v2.html:476`
   - Impact: Confuses users, makes them think they have limits
   - Fix: Update HTML to detect and show unlimited status

2. **❌ Settings handler uses wrong API**
   - Location: `src/popup/components/settingsHandlers.ts:539`
   - Problem: Uses `getStorageUsage()` instead of `getStorageQuota()`
   - Impact: Always shows 10MB limit, never detects unlimited
   - Fix: Use `getStorageQuota()` and check `hasUnlimitedStorage`

3. **❌ Background manager uses wrong API**
   - Location: `src/popup/components/backgroundManager.ts:478`
   - Problem: Uses `getStorageUsage()` which returns `chrome.storage.local.QUOTA_BYTES`
   - Impact: Shows 10MB limit warnings that don't apply
   - Fix: Use `getStorageQuota()` instead

### Documentation Issues:

4. **❌ Docs reference non-existent 10MB limits**
   - Locations:
     - `ROADMAP.md:207` - "Storage Monitoring: MISSING - No quota tracking (10MB limit)"
     - `docs/testing/test-suite-status.md` - Multiple references to 10MB
     - `docs/development/TIER_LIMITS_UPDATED.md:550` - "~10MB limit"
   - Fix: Update all docs to reflect unlimited storage reality

5. **❌ Tests mock 10MB quota**
   - Location: `tests/setup.js:46`
   - Problem: `QUOTA_BYTES: 10485760, // 10MB`
   - Impact: Tests don't reflect production behavior
   - Fix: Mock unlimited storage in tests

---

## Recommendations

### Immediate Fixes (P0 - Launch Blockers):

1. **Update Settings UI to show unlimited storage**
   ```typescript
   // src/popup/components/settingsHandlers.ts
   const quota = await storage.getStorageQuota(); // Use correct API

   if (quota.hasUnlimitedStorage) {
     quotaEl.textContent = '(Unlimited)';
     hintEl.textContent = '✓ Unlimited storage enabled';
   } else {
     quotaEl.textContent = `of ${formatBytes(quota.quota)}`;
     // Show warnings based on actual quota
   }
   ```

2. **Update static HTML**
   ```html
   <!-- src/popup/popup-v2.html -->
   <span class="storage-hint" id="storageHint">
     ℹ️ Storage capacity is based on available disk space
   </span>
   ```

3. **Fix Background Manager**
   - Change from `getStorageUsage()` to `getStorageQuota()`
   - Detect and display unlimited status

### Medium Priority (P1 - Post-Launch):

4. **Update Documentation**
   - Remove all references to "10MB limit"
   - Document that we have unlimited storage
   - Explain why we need it (custom images)

5. **Update Tests**
   - Mock unlimited storage scenario
   - Test unlimited storage detection
   - Remove 10MB quota from mock chrome storage

### Low Priority (P2 - Nice to Have):

6. **Add Storage Analytics**
   - Track what types of data use the most space
   - Warn users if custom images are huge (> 5MB each)
   - Suggest image compression for large uploads

7. **Implement Storage Cleanup**
   - Button to clear cached data
   - Button to remove old document analyses
   - Button to compress/optimize custom images

---

## Storage API Comparison

### Two Different APIs:

#### ❌ OLD API: `chrome.storage.local.getBytesInUse()` + `QUOTA_BYTES`
```typescript
// src/lib/storage.ts:1647-1663
async getStorageUsage(): Promise<{...}> {
  const bytesInUse = await chrome.storage.local.getBytesInUse();
  const quota = chrome.storage.local.QUOTA_BYTES || 10485760; // Always 10MB!
  // ...
}
```
**Problem**: `QUOTA_BYTES` is hardcoded to 10MB, doesn't reflect unlimitedStorage

#### ✅ CORRECT API: `navigator.storage.estimate()`
```typescript
// src/lib/storage.ts:2215-2237
async getStorageQuota(): Promise<{...}> {
  const estimate = await navigator.storage.estimate();
  const quota = estimate.quota || 10485760; // Actual quota (disk space if unlimited)
  const hasUnlimitedStorage = quota > 100000000; // Detect unlimited
  // ...
}
```
**Solution**: Use `navigator.storage.estimate()` which returns actual quota

---

## Usage Across Codebase

### Files Using Storage (52 total):

#### Core Storage Implementation:
- ✅ `src/lib/storage.ts` - Main storage manager (CORRECT - has both APIs)
- ✅ `src/lib/store.ts` - State management (CORRECT - uses getStorageQuota)

#### UI Components (INCONSISTENT):
- ❌ `src/popup/components/settingsHandlers.ts` - Uses OLD API
- ❌ `src/popup/components/backgroundManager.ts` - Uses OLD API
- ✅ `src/popup/components/documentAnalysis.ts` - Uses CORRECT API
- ✅ `src/document-preview.ts` - Uses CORRECT API (shows "Unlimited")

#### HTML/CSS:
- ❌ `src/popup/popup-v2.html` - Hardcoded "10 MB" text
- ✅ `src/popup/styles/settings.css` - Just styling
- ✅ `src/popup/styles/document-analysis.css` - Just styling

#### Tests:
- ❌ `tests/setup.js` - Mocks 10MB quota
- ⏸️ `tests/storage.test.ts` - Moved to integration (needs update)
- ⏸️ `tests/tierSystem.test.ts` - Moved to integration (needs update)

#### Documentation (43 files):
- ❌ Most reference "10MB limit" incorrectly
- Need comprehensive update

---

## Action Plan

### Phase 1: Fix Production UI (1-2 hours)
1. Update `settingsHandlers.ts` to use `getStorageQuota()`
2. Update `backgroundManager.ts` to use `getStorageQuota()`
3. Update `popup-v2.html` to remove hardcoded "10 MB"
4. Test storage display in all three locations

### Phase 2: Update Documentation (30 minutes)
1. Update ROADMAP.md
2. Update testing docs
3. Update development docs
4. Add note to ARCHITECTURE.md about unlimited storage

### Phase 3: Fix Tests (30 minutes)
1. Update `tests/setup.js` to mock unlimited storage
2. Update storage/tier integration tests
3. Add tests for unlimited storage detection

### Phase 4: Polish (1 hour)
1. Add storage analytics
2. Add image size warnings
3. Update user-facing messages

**Total Estimated Time: 4-5 hours**

---

## Conclusion

**The Good News**:
- ✅ We correctly request `unlimitedStorage` in manifest
- ✅ We correctly detect unlimited storage in `getStorageQuota()`
- ✅ Document analysis UI correctly shows "Unlimited"

**The Bad News**:
- ❌ Settings UI shows misleading "10MB limit" warnings
- ❌ Background manager shows incorrect quota
- ❌ Documentation references non-existent limits
- ❌ Tests mock behavior that doesn't match production

**The Fix**:
- Use `getStorageQuota()` everywhere (not `getStorageUsage()`)
- Update UI to show "Unlimited" when detected
- Update docs to reflect unlimited storage reality
- Update tests to match production behavior

**Why It Matters**:
- Custom background images can easily exceed 10MB
- Without unlimited storage, power users would be stuck
- Current UI misleads users about available space
- This is a **launch blocker** - must fix before v1.0
