# CRITICAL-001: Badge Shows Green When No Protection Active

**Severity:** 🔥 **CRITICAL** (Launch Blocker)
**Status:** 🔴 **OPEN**
**Discovered:** 2025-11-11
**Reporter:** User + Claude Code Analysis
**Assigned:** TBD

---

## Summary

Extension badge displays GREEN ✓ "Protected" status when:
- User has NO profiles configured
- User is NOT authenticated
- Protection is enabled in settings BUT cannot function

This creates a **false sense of security** where users believe their PII is protected when it's not.

---

## Impact Assessment

| Category | Rating | Details |
|----------|--------|---------|
| **Severity** | 🔥 CRITICAL | Security false positive |
| **Affected Users** | 100% | All first-time installs |
| **Business Risk** | CATASTROPHIC | Reputational damage, false advertising |
| **Data Risk** | HIGH | Users share real PII thinking it's protected |
| **Launch Blocker** | ✅ YES | Cannot launch with this bug |

---

## Reproduction Steps

### Scenario 1: First-Time Install
1. Install Prompt Blocker extension (fresh, no account)
2. Navigate to https://chatgpt.com
3. **OBSERVE:** Badge shows GREEN ✓ "Protected"
4. Open extension popup
5. **OBSERVE:** User has ZERO profiles
6. Type real PII (name, email) into ChatGPT
7. **OBSERVE:** No substitution occurs (no profiles exist)
8. **RESULT:** User believes protected, but PII leaked

**Expected Badge:** RED ! "Not Protected" or YELLOW ? "No Profiles"
**Actual Badge:** GREEN ✓ "Protected"

---

### Scenario 2: Disable All Profiles
1. User has signed up and created 3 profiles
2. User disables all 3 profiles (toggle off)
3. Navigate to https://chatgpt.com
4. **OBSERVE:** Badge shows GREEN ✓ "Protected"
5. **RESULT:** No active profiles, but badge claims protection

**Expected Badge:** RED ! "Not Protected" or YELLOW ? "No Active Profiles"
**Actual Badge:** GREEN ✓ "Protected"

---

### Scenario 3: Sign Out While On AI Service
1. User signed in with active profiles (GREEN badge)
2. User opens popup → Signs out
3. **OBSERVE:** Badge MAY stay GREEN (race condition)
4. Profiles now encrypted and unavailable
5. **RESULT:** Badge doesn't reflect actual state

**Expected Badge:** RED ! "Not Protected" (profiles locked)
**Actual Badge:** GREEN ✓ "Protected" (stale state)

---

## Root Cause Analysis

### Bug Location
**File:** `src/background/handlers/MessageRouter.ts`
**Lines:** 40-57
**Function:** `handleMessage()` → `case 'HEALTH_CHECK'`

### Vulnerable Code
```typescript
case 'HEALTH_CHECK': {
  const senderTabId = message.tabId || sender?.tab?.id;

  if (senderTabId) {
    // Update badge to protected (health checks are passing)
    const config = await this.storage.loadConfig();

    // 🐛 BUG: Only checks if enabled, NOT if profiles exist!
    if (config?.settings?.enabled) {
      await this.badgeManager.updateBadge(senderTabId, 'protected');
    }
  }

  return { success: true, status: 'ok' };
}
```

### What's Wrong?

The HEALTH_CHECK handler **bypasses** the proper badge logic in `BadgeManager.checkAndUpdateBadge()`.

**It only checks:**
- ✅ Is extension enabled? (`config.settings.enabled`)

**It does NOT check:**
- ❌ Are there any profiles? (`profiles.length > 0`)
- ❌ Are any profiles enabled? (`profiles.some(p => p.enabled)`)
- ❌ Is user authenticated? (Firebase auth state)
- ❌ Can profiles be loaded? (decryption works)
- ❌ Is content script injected? (protection actually active)

### Why This Happens

1. Content script loads on AI service page (chatgpt.com)
2. `inject.js` sends periodic HEALTH_CHECK messages
3. MessageRouter receives HEALTH_CHECK
4. Takes shortcut: only checks `enabled` flag
5. Sets badge to GREEN without verifying protection exists
6. User sees GREEN badge, believes they're protected

### Correct Logic (BadgeManager.checkAndUpdateBadge)

The **proper** badge update logic at `BadgeManager.ts:99-186` checks ALL requirements:

```typescript
// 1. Load config
const config = await this.storage.loadConfig();

// 2. Check if enabled
if (!config?.settings?.enabled) {
  return await this.updateBadge(tabId, 'disabled');
}

// 3. Check if domain is protected
if (!isProtectedDomain(url, config.settings.protectedDomains)) {
  return await this.updateBadge(tabId, 'disabled');
}

// 4. Check if content script injected
const isInjected = await this.contentScriptManager.isContentScriptInjected(tabId);

// 5. Load profiles (may fail if not authenticated)
let profiles: Profile[] = [];
try {
  profiles = await this.storage.loadProfiles();
} catch (error) {
  // User not authenticated or decryption failed
  return await this.updateBadge(tabId, 'disabled');
}

// 6. Check if any profiles are enabled
const hasActiveProfiles = profiles.some(p => p.enabled);

// 7. Determine final state
const isProtected = isInjected && hasActiveProfiles;
const state = isProtected ? 'protected' : 'unprotected';
await this.updateBadge(tabId, state);
```

**HEALTH_CHECK skips steps 4-7** and just assumes everything is fine! 🐛

---

## Technical Analysis

### Race Condition

Two code paths can update the badge simultaneously:

```
Path A: Badge Update Listener (CORRECT)
chrome.tabs.onActivated
  ↓
badgeManager.checkAndUpdateBadge(tabId, url)
  ↓
Full validation (takes ~100ms to load profiles)
  ↓
Sets correct badge state

Path B: Health Check (BUGGY)
content script sends HEALTH_CHECK
  ↓
MessageRouter.handleMessage()
  ↓
Shortcut: only checks enabled flag (~10ms)
  ↓
Sets badge to GREEN (wrong!)
```

**Path B is faster** and often "wins", setting the wrong badge.

---

### Why Shortcut Was Taken

The HEALTH_CHECK handler was likely optimized for speed:
- Loading profiles requires async decryption (~50-100ms)
- Checking content script injection requires message passing (~20ms)
- Shortcut: "If health check succeeds, assume protection is working"

**Problem:** Health check only proves content script is alive, NOT that protection is configured.

---

## Fix Requirements

### Option 1: Use Proper Badge Logic (RECOMMENDED)

Replace shortcut with full badge update:

```typescript
case 'HEALTH_CHECK': {
  const senderTabId = message.tabId || sender?.tab?.id;

  if (senderTabId) {
    // Use the SAME logic as other badge updates (no shortcuts!)
    const tab = await chrome.tabs.get(senderTabId);
    await this.badgeManager.checkAndUpdateBadge(senderTabId, tab.url);
  }

  return { success: true, status: 'ok' };
}
```

**Pros:**
- ✅ One source of truth for badge logic
- ✅ All checks performed correctly
- ✅ No duplicate code
- ✅ Race condition eliminated

**Cons:**
- ⚠️ Slightly slower (~100ms instead of ~10ms)
- ⚠️ May cause badge flicker if health checks are frequent

---

### Option 2: Check Profiles in Shortcut

Keep shortcut but add profile check:

```typescript
case 'HEALTH_CHECK': {
  const senderTabId = message.tabId || sender?.tab?.id;

  if (senderTabId) {
    const config = await this.storage.loadConfig();

    // NEW: Also check profiles exist and are enabled
    let hasActiveProfiles = false;
    try {
      const profiles = await this.storage.loadProfiles();
      hasActiveProfiles = profiles.some(p => p.enabled);
    } catch (error) {
      // User not authenticated or decryption failed
      hasActiveProfiles = false;
    }

    // Only set green if BOTH enabled AND profiles exist
    if (config?.settings?.enabled && hasActiveProfiles) {
      await this.badgeManager.updateBadge(senderTabId, 'protected');
    } else {
      // Use full badge logic for non-protected cases
      const tab = await chrome.tabs.get(senderTabId);
      await this.badgeManager.checkAndUpdateBadge(senderTabId, tab.url);
    }
  }

  return { success: true, status: 'ok' };
}
```

**Pros:**
- ✅ Fast path for common case (authenticated user with profiles)
- ✅ Correct badge for all cases

**Cons:**
- ⚠️ Duplicate logic (profile check in two places)
- ⚠️ More complex code
- ⚠️ Still has race condition risk

---

### Option 3: Remove HEALTH_CHECK Badge Update

Stop updating badge on HEALTH_CHECK entirely:

```typescript
case 'HEALTH_CHECK': {
  // Just acknowledge the health check, don't update badge
  // Badge updates handled by proper listeners only
  return { success: true, status: 'ok' };
}
```

**Pros:**
- ✅ Simple
- ✅ No duplicate logic
- ✅ Badge always correct (single source of truth)

**Cons:**
- ⚠️ Badge may be slightly less responsive
- ⚠️ Relies entirely on tab activation listeners

---

## Recommended Fix: Option 1

**Use full badge logic in HEALTH_CHECK handler**

**Why:**
- Single source of truth (DRY principle)
- All checks performed correctly
- No duplicate logic to maintain
- Eliminates race condition

**Implementation:**
```typescript
// File: src/background/handlers/MessageRouter.ts
// Lines: 40-57

case 'HEALTH_CHECK': {
  const senderTabId = message.tabId || sender?.tab?.id;

  if (senderTabId) {
    // Use the full badge update logic (no shortcuts!)
    const tab = await chrome.tabs.get(senderTabId);
    await this.badgeManager.checkAndUpdateBadge(senderTabId, tab.url);
  }

  return { success: true, status: 'ok' };
}
```

**Testing:**
- ✅ Test Case 1: First-time install → Badge should be RED/YELLOW, not GREEN
- ✅ Test Case 2: Disable all profiles → Badge should turn RED
- ✅ Test Case 3: Sign out → Badge should turn RED
- ✅ Test Case 5: Create first profile → Badge should turn GREEN

---

## Estimated Effort

| Task | Effort | Details |
|------|--------|---------|
| Code fix | 30 min | 3-line change in MessageRouter.ts |
| Unit tests | 1 hour | Test badge state for all scenarios |
| Integration tests | 2 hours | Test on real extension with all flows |
| Manual QA | 1 hour | Run through all test cases |
| **TOTAL** | **4-5 hours** | Including testing and verification |

---

## Verification Plan

### Before Fix
1. Install fresh extension (no account)
2. Visit chatgpt.com
3. **Verify bug:** Badge is GREEN ✓ (wrong)

### After Fix
1. Install fixed extension (no account)
2. Visit chatgpt.com
3. **Verify fix:** Badge is RED ! or YELLOW ? (correct)
4. Create profile → Badge turns GREEN ✓
5. Disable profile → Badge turns RED !
6. Sign out → Badge stays RED !

### Test Matrix

| Enabled | Profiles | Active | Domain | Injected | Expected Badge | Must Test |
|---------|----------|--------|--------|----------|----------------|-----------|
| false | any | any | any | any | GREY | ✅ |
| true | 0 | N/A | true | true | RED/YELLOW | ✅ CRITICAL |
| true | >0 | false | true | true | RED/YELLOW | ✅ CRITICAL |
| true | >0 | true | false | any | GREY | ✅ |
| true | >0 | true | true | false | RED | ✅ |
| true | >0 | true | true | true | GREEN | ✅ |

All 6 test cases must pass before closing this bug.

---

## Business Impact

### If We Launch With This Bug

**Week 1:**
- 100 users install from Chrome Web Store
- All see GREEN badge on first visit
- All believe they're protected
- None create profiles immediately (think it's working)
- All share real PII with AI services

**Week 2:**
- Users discover extension didn't work
- 1-star reviews start appearing
- "This extension is fake! False advertising!"
- Chrome Web Store rating: 2.1/5.0

**Week 3:**
- Reputation destroyed
- Can't recover from bad reviews
- Support overwhelmed
- Development paralyzed by bug fixes

**Result:** Business failure

---

### If We Fix Before Launch

**Week 1:**
- 100 users install from Chrome Web Store
- See RED/YELLOW badge (no profiles yet)
- Realize they need to create profiles
- Follow onboarding flow
- Badge turns GREEN after setup

**Week 2:**
- Users report extension works correctly
- 4-5 star reviews
- "Easy to set up, works great!"
- Chrome Web Store rating: 4.5/5.0

**Week 3:**
- Positive momentum
- Word of mouth growth
- Feature requests (good sign)
- Sustainable growth

**Result:** Successful launch

---

## Related Issues

- **Test Case:** [test-cases/badge-status-flows.md](../test-cases/badge-status-flows.md)
- **User Flow:** [user-flows/first-time-user.md](../user-flows/first-time-user.md)
- **Architecture:** [architecture/badge-state-management.md](../architecture/badge-state-management.md)

---

## Sign-Off

**Fix Implemented By:** _________________ Date: _______

**Tested By:** _________________ Date: _______

**Verified By:** _________________ Date: _______

**Status:** 🔴 OPEN → 🟢 CLOSED

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-11 | v1.0 | Initial bug report | Claude Code |
| _______ | v1.1 | Fix implemented | _______ |
| _______ | v1.2 | Fix verified, closed | _______ |
