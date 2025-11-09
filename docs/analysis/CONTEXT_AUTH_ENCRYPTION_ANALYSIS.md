# Context, Auth, and Encryption Analysis
**Date:** 2025-01-09
**Issue:** Multiple protection indicators broken after Firebase encryption migration

## Problem Statement

After migrating to Firebase UID-based encryption, several features show "protected" status even when no profiles are loaded:
1. ✅ **Badge** - Shows green "PROTECTED" even with 0 profiles
2. ✅ **Toast** - ~~"You Are Protected" appears without profiles~~ (FIXED)
3. ❌ **Stats** - Not tracking because activity logs can't be encrypted in service worker

**Root Cause:** Service worker cannot access Firebase auth, but tries to decrypt profiles anyway.

---

## Chrome Extension Contexts

### 1. Service Worker (Background)
**File:** `src/background/serviceWorker.ts`

**Capabilities:**
- ✅ Intercepts network requests
- ✅ Reads chrome.storage.local (encrypted data)
- ❌ **Cannot access Firebase auth** (no window/document)
- ❌ **Cannot decrypt profiles** (needs Firebase UID for key)

**Current State:**
```typescript
// Line 127-128
console.log('[StorageManager] Service worker context - skipping profile initialization');
console.log('[StorageManager] Profiles will be sent from popup via SET_PROFILES message');
```

**What Happens:**
1. Service worker starts
2. Tries to load profiles → gets encrypted blob
3. Tries to decrypt → needs Firebase auth → **FAILS**
4. Waits for popup to send decrypted profiles

---

### 2. Popup (Extension UI)
**File:** `src/popup/popup-v2.ts`

**Capabilities:**
- ✅ Access to DOM/document
- ✅ Firebase auth available
- ✅ Can decrypt profiles
- ✅ Can encrypt activity logs

**Current Flow:**
```typescript
// Line 214-280
1. waitForAuthInit() - Firebase session restore
2. store.initialize() - Decrypt profiles with Firebase UID
3. Send profiles to service worker via SET_PROFILES message
4. Request FLUSH_ACTIVITY_LOGS from service worker
```

**Issue:** Popup must be opened at least once after each reload for profiles to be available.

---

### 3. Content Script
**File:** `src/content/content.ts`

**Capabilities:**
- ✅ Access to page DOM
- ✅ Can show toasts/modals
- ❌ Cannot access Firebase auth directly
- ✅ Can query service worker for profiles

**Fixed:**
```typescript
// Line 66-73 - Added profile check before showing toast
const profilesResponse = await chrome.runtime.sendMessage({ type: 'GET_PROFILES' });
const hasProfiles = profilesResponse?.success && profilesResponse.data?.length > 0;
if (!hasProfiles) {
  return; // Don't show toast if no profiles loaded
}
```

---

## Firebase Auth in Manifest V3

### Official Firebase Guidance

**Two Auth Approaches:**

1. **Direct Methods** (`firebase/auth/web-extension`):
   - Email/password
   - Anonymous
   - Custom tokens
   - Works in service worker ✅

2. **Popup Methods** (requires offscreen document):
   - signInWithPopup
   - signInWithRedirect
   - Google/GitHub/Microsoft OAuth
   - **Cannot work in service worker** ❌

### Our Current Implementation

**We use:** `firebase/auth` (NOT `firebase/auth/web-extension`)

**Where it's imported:**
- `src/lib/firebase.ts` - Initializes auth
- `src/popup/popup-v2.ts` - Uses auth for session
- `src/popup/components/authModal.ts` - Handles sign-in

**Problem:** We're using the standard `firebase/auth` module which requires DOM/window context. This is why:
- ✅ Works in popup
- ❌ Fails in service worker

---

## Current Architecture Issues

### Issue 1: Badge Shows Protected Before Profiles Load

**File:** `src/background/serviceWorker.ts:12-65`

```typescript
// Badge logic only checks:
1. Is extension enabled?
2. Is domain in protectedDomains?

// Missing check:
3. Are profiles actually loaded?
```

**Impact:** User sees green badge but protection isn't active.

---

### Issue 2: Service Worker Can't Decrypt Profiles

**File:** `src/lib/storage.ts:1787`

```typescript
throw new Error(
  'ENCRYPTION_KEY_UNAVAILABLE: Firebase auth not available in service worker context.'
);
```

**Why:** `getFirebaseKeyMaterial()` imports `firebase/auth` which needs window/document.

**Current Workaround:** Popup sends decrypted profiles via `SET_PROFILES` message.

---

### Issue 3: Activity Logs Can't Be Encrypted in Service Worker

**File:** `src/background/serviceWorker.ts:1126-1150`

```typescript
// Service worker queues activity logs
activityLogQueue.push(entry);

// Popup flushes queue and encrypts logs
chrome.runtime.sendMessage({ type: 'ADD_ACTIVITY_LOG', payload: entry });
```

**Problem:** If user never opens popup, stats are never saved.

---

## Solution Options

### Option A: Use firebase/auth/web-extension in Service Worker ⭐ RECOMMENDED

**Approach:**
1. Use `firebase/auth/web-extension` in service worker
2. Service worker can maintain auth session
3. Service worker can decrypt profiles directly
4. No dependency on popup being opened

**Changes Required:**
- Modify `src/lib/firebase.ts` to detect context and use correct module
- Update service worker to initialize Firebase auth
- Service worker can now call `getFirebaseKeyMaterial()` successfully

**Benefits:**
- ✅ Protection works immediately after auth
- ✅ No need to open popup first
- ✅ Badge/toast/stats all accurate
- ✅ Activity logs encrypted immediately

**Challenges:**
- Need to handle auth persistence across contexts
- May need separate Firebase auth instances for popup vs service worker

---

### Option B: Keep Current Architecture + Fix Indicators

**Approach:**
1. Keep popup-sends-profiles pattern
2. Fix badge to check for loaded profiles
3. Toast already fixed
4. Accept that popup must be opened once per session

**Changes Required:**
- Update badge logic to check `GET_PROFILES` response
- Add persistent flag in chrome.storage.local: "profilesLoadedThisSession"
- Clear flag on extension reload

**Benefits:**
- ✅ Minimal code changes
- ✅ Current architecture stays intact
- ✅ Clear separation of concerns

**Challenges:**
- ❌ User must open popup after each reload
- ❌ Confusing UX if user forgets
- ❌ Stats still delayed until popup opens

---

### Option C: Offscreen Document for Auth

**Approach:**
1. Create offscreen.html with Firebase auth
2. Service worker manages offscreen document lifecycle
3. Proxy auth state between offscreen → service worker
4. Service worker can decrypt with auth from offscreen doc

**Changes Required:**
- New `src/offscreen/offscreen.html`
- New `src/offscreen/offscreen.ts`
- Service worker creates/manages offscreen document
- Message passing for auth state

**Benefits:**
- ✅ Follows official Firebase Manifest V3 pattern
- ✅ Service worker can access auth
- ✅ Best practice architecture

**Challenges:**
- ⚠️ Significant refactoring required
- ⚠️ Only one offscreen document allowed at a time
- ⚠️ Complex message passing logic

---

## Recommendation

**Use Option A: firebase/auth/web-extension**

This is the cleanest solution that:
1. Fixes all current issues
2. Follows Firebase's official guidance
3. Minimal architectural changes
4. Service worker becomes self-sufficient

**Implementation Plan:**

1. **Create context-aware Firebase module:**
   ```typescript
   // src/lib/firebase.ts
   const isServiceWorker = typeof document === 'undefined';

   if (isServiceWorker) {
     const { getAuth } = await import('firebase/auth/web-extension');
     auth = getAuth(app);
   } else {
     const { getAuth } = await import('firebase/auth');
     auth = getAuth(app);
   }
   ```

2. **Service worker initializes Firebase auth on startup:**
   ```typescript
   // src/background/serviceWorker.ts
   const { auth } = await import('../lib/firebase');
   // auth.currentUser now available in service worker!
   ```

3. **StorageManager works in all contexts:**
   ```typescript
   // src/lib/storage.ts
   // getFirebaseKeyMaterial() now works in service worker
   // Can decrypt profiles directly
   ```

4. **Update badge logic:**
   ```typescript
   // Check profiles.length > 0 before showing green
   ```

**Expected Results:**
- ✅ Extension reload → service worker has auth → can decrypt profiles
- ✅ Badge shows accurate status immediately
- ✅ Toast only shows when actually protected
- ✅ Stats track immediately (no queue needed)
- ✅ No popup dependency for core functionality

---

## Questions for User

1. Should we implement Option A (firebase/auth/web-extension)?
2. Is it acceptable that service worker can access Firebase auth?
3. Any concerns about auth session persistence across contexts?
4. Should we maintain backward compatibility with current architecture?
