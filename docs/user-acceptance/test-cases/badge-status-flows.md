# Test Cases: Badge Status Flows

**Test Suite:** Badge State Management
**Priority:** 🔥 **P0 CRITICAL** - Must pass before launch
**Related Bug:** [CRITICAL-001](../bugs/CRITICAL-001-badge-false-positive.md)

---

## Overview

These test cases verify the extension badge displays the correct color and status for all possible states. The badge is the **primary indicator** users rely on to know if their PII is protected.

**Badge States:**
- 🟢 GREEN ✓ = Protected (PII substitution active)
- 🔴 RED ! = Not Protected (something is broken/missing)
- ⚪ GREY (empty) = Disabled (extension/service turned off)
- 🟡 YELLOW ? = Warning (P1 feature - no profiles configured)

---

## Test Case 1: First-Time Install (No Account)

**Priority:** 🔥 CRITICAL (Launch Blocker)
**Affected Users:** 100% of new installs
**Bug:** [CRITICAL-001](../bugs/CRITICAL-001-badge-false-positive.md)

### Preconditions
- Fresh Chrome profile (no extension data)
- Never signed up for Prompt Blocker
- Never created any profiles

### Test Steps
1. Install Prompt Blocker extension
2. Open non-AI page (e.g., google.com)
3. **VERIFY:** Badge is empty (no text)
4. Navigate to https://chatgpt.com
5. Wait for page to fully load
6. **VERIFY:** Badge shows RED ! or YELLOW ? (NOT green ✓)
7. Click extension icon → Open popup
8. **VERIFY:** Aliases tab shows "No profiles yet"
9. **VERIFY:** Status indicator shows "Not Protected" or "No Profiles"
10. Type real PII in ChatGPT input box
11. **VERIFY:** No substitution occurs (text stays same)

### Expected Results
| Step | Expected Badge | Expected Popup | Pass/Fail |
|------|---------------|----------------|-----------|
| 2 | Empty | N/A | ⬜ |
| 4-6 | RED ! or YELLOW ? | "No profiles" message | ⬜ |
| 9 | RED ! or YELLOW ? | Red status dot | ⬜ |
| 11 | RED ! or YELLOW ? | No substitution | ⬜ |

### Current (Buggy) Results
| Step | Actual Badge | Actual Popup | Status |
|------|-------------|--------------|--------|
| 6 | GREEN ✓ (WRONG) | "No profiles" | 🔴 **FAIL** |

### Pass Criteria
- ✅ Badge NEVER shows GREEN when profiles = 0
- ✅ Popup clearly indicates "not protected" state
- ✅ No substitution occurs (correct behavior)

---

## Test Case 2: Sign Up and Create First Profile

**Priority:** 🔥 CRITICAL
**Affected Users:** All users (onboarding flow)

### Preconditions
- Completed Test Case 1 (extension installed, no account)
- Currently on chatgpt.com with RED/YELLOW badge

### Test Steps
1. **VERIFY:** Starting state - Badge is RED ! or YELLOW ?
2. Click extension icon → Open popup
3. Click "Sign In" button
4. Choose Google Sign-In
5. Complete OAuth flow
6. Return to popup
7. **VERIFY:** Signed in (user email visible)
8. Click "Create Profile" button
9. Fill in form:
   - Real Name: "John Smith"
   - Alias: "Phoenix Thunder"
   - Email: "john@example.com" → "phantom@temp.mail"
10. Toggle "Enable this profile" ON (if not already)
11. Click "Save Profile"
12. **VERIFY:** Profile appears in Aliases tab with green "Enabled" badge
13. Switch to ChatGPT tab
14. **VERIFY:** Badge changes to GREEN ✓ "Protected"
15. **VERIFY:** Extension icon shows green badge
16. Type "John Smith" in ChatGPT input
17. **VERIFY:** Text changes to "Phoenix Thunder" (red highlight)
18. Type "john@example.com"
19. **VERIFY:** Text changes to "phantom@temp.mail" (red highlight)

### Expected Results
| Step | Expected State | Pass/Fail |
|------|---------------|-----------|
| 1 | Badge RED/YELLOW (no profiles yet) | ⬜ |
| 14 | Badge GREEN (protection now active) | ⬜ |
| 17 | "John Smith" → "Phoenix Thunder" | ⬜ |
| 19 | "john@example.com" → "phantom@temp.mail" | ⬜ |

### Pass Criteria
- ✅ Badge changes from RED/YELLOW → GREEN after profile created
- ✅ Substitution works immediately (no page reload required)
- ✅ Badge reflects actual protection state

---

## Test Case 3: Sign Out While On AI Service

**Priority:** 🔥 CRITICAL
**Affected Users:** Users who sign out
**Bug Risk:** Race condition may leave badge green

### Preconditions
- User signed in with active profiles
- Currently on chatgpt.com with GREEN badge
- Profiles loaded and substitution working

### Test Steps
1. **VERIFY:** Starting state - Badge is GREEN ✓
2. Type "John Smith" in ChatGPT
3. **VERIFY:** Substitution works ("Phoenix Thunder")
4. Click extension icon → Open popup
5. Click user profile picture/menu
6. Click "Sign Out"
7. **VERIFY:** Popup shows signed-out state
8. Switch to ChatGPT tab
9. **VERIFY:** Badge changes to RED ! or GREY (NOT green)
10. Type "John Smith" in ChatGPT
11. **VERIFY:** NO substitution occurs (stays "John Smith")
12. Refresh page
13. **VERIFY:** Badge still RED ! or GREY
14. Try typing PII again
15. **VERIFY:** Still no substitution

### Expected Results
| Step | Expected Badge | Expected Substitution | Pass/Fail |
|------|---------------|----------------------|-----------|
| 1 | GREEN ✓ | Yes (working) | ⬜ |
| 9 | RED ! or GREY | N/A | ⬜ |
| 11 | RED ! or GREY | No (profiles locked) | ⬜ |
| 13 | RED ! or GREY | No | ⬜ |

### Current (Buggy) Results
| Step | Actual Badge | Notes | Status |
|------|-------------|-------|--------|
| 9 | May stay GREEN briefly | Race condition | 🟡 **WARN** |

### Pass Criteria
- ✅ Badge changes to RED/GREY within 1 second of sign out
- ✅ Badge NEVER shows GREEN when signed out
- ✅ No substitution occurs after sign out

---

## Test Case 4: Decryption Failed (Wrong Provider)

**Priority:** ⚠️ HIGH
**Affected Users:** Users who switch auth providers

### Preconditions
- Data encrypted with Google OAuth
- User currently signed out

### Test Steps
1. Navigate to chatgpt.com
2. **VERIFY:** Badge is RED/GREY (signed out)
3. Open popup → Click "Sign In"
4. Choose GitHub Sign-In (WRONG provider)
5. Complete GitHub OAuth
6. Return to popup
7. **VERIFY:** Auth issue banner visible
8. **VERIFY:** Banner says "encrypted with Google" or similar
9. Switch to ChatGPT tab
10. **VERIFY:** Badge is RED ! (decryption failed)
11. Return to popup
12. Click "Reset & Try Again" in banner
13. Sign in with Google (CORRECT provider)
14. Return to ChatGPT tab
15. **VERIFY:** Badge changes to GREEN ✓
16. Type PII
17. **VERIFY:** Substitution works

### Expected Results
| Step | Expected Badge | Expected Behavior | Pass/Fail |
|------|---------------|-------------------|-----------|
| 10 | RED ! | Profiles locked (wrong UID) | ⬜ |
| 15 | GREEN ✓ | Profiles unlocked | ⬜ |
| 17 | GREEN ✓ | Substitution works | ⬜ |

### Pass Criteria
- ✅ Badge RED when decryption fails
- ✅ Banner explains issue clearly
- ✅ Badge GREEN after signing in with correct provider

---

## Test Case 5: Disable All Profiles

**Priority:** 🔥 CRITICAL (Launch Blocker)
**Affected Users:** Users experimenting with settings
**Bug:** [CRITICAL-001](../bugs/CRITICAL-001-badge-false-positive.md)

### Preconditions
- User signed in with 3 active profiles
- Currently on chatgpt.com with GREEN badge
- All profiles enabled (toggle ON)

### Test Steps
1. **VERIFY:** Starting state - Badge is GREEN ✓
2. Type "John Smith" in ChatGPT
3. **VERIFY:** Substitution works
4. Open popup → Aliases tab
5. Toggle OFF profile 1 ("John Smith")
6. **VERIFY:** Badge still GREEN (2 profiles remain)
7. Toggle OFF profile 2 ("Jane Doe")
8. **VERIFY:** Badge still GREEN (1 profile remains)
9. Toggle OFF profile 3 ("Bob Jones")
10. **VERIFY:** Badge changes to RED ! or YELLOW ? (no active profiles)
11. Type "John Smith" in ChatGPT
12. **VERIFY:** NO substitution (profile disabled)

### Expected Results
| Step | Profiles Active | Expected Badge | Pass/Fail |
|------|----------------|---------------|-----------|
| 1-6 | 3 → 2 | GREEN ✓ | ⬜ |
| 7-8 | 2 → 1 | GREEN ✓ | ⬜ |
| 9-10 | 1 → 0 | RED ! or YELLOW ? | ⬜ |
| 12 | 0 | RED ! or YELLOW ? | ⬜ |

### Current (Buggy) Results
| Step | Actual Badge | Notes | Status |
|------|-------------|-------|--------|
| 10 | GREEN ✓ (WRONG) | HEALTH_CHECK shortcut | 🔴 **FAIL** |

### Pass Criteria
- ✅ Badge changes to RED/YELLOW when last profile disabled
- ✅ Badge NEVER green when active profiles = 0
- ✅ No substitution when all profiles disabled

---

## Test Case 6: Toggle Service Protection

**Priority:** ⚠️ HIGH
**Affected Users:** Users managing service settings

### Preconditions
- User signed in with active profiles
- All 5 services enabled in Settings

### Test Steps
1. Open chatgpt.com
2. **VERIFY:** Badge is GREEN ✓
3. Open popup → Settings tab
4. Scroll to "Protected Services" section
5. Toggle OFF "ChatGPT" checkbox
6. Switch to ChatGPT tab
7. **VERIFY:** Badge is GREY (empty) or different color (service disabled)
8. Type PII in ChatGPT
9. **VERIFY:** NO substitution (service disabled)
10. Open new tab → claude.ai
11. **VERIFY:** Badge is GREEN ✓ (Claude still enabled)
12. Type PII in Claude
13. **VERIFY:** Substitution works
14. Return to Settings
15. Toggle ON "ChatGPT" checkbox
16. Switch to ChatGPT tab
17. **VERIFY:** Badge changes to GREEN ✓
18. Type PII
19. **VERIFY:** Substitution works again

### Expected Results
| Step | Service State | Expected Badge | Expected Substitution | Pass/Fail |
|------|--------------|---------------|----------------------|-----------|
| 2 | Enabled | GREEN ✓ | Yes | ⬜ |
| 7 | Disabled | GREY | No | ⬜ |
| 11 | Enabled | GREEN ✓ | Yes | ⬜ |
| 17 | Re-enabled | GREEN ✓ | Yes | ⬜ |

### Pass Criteria
- ✅ Badge reflects per-service settings correctly
- ✅ Disabling service stops substitution
- ✅ Re-enabling service restores substitution

---

## Test Case 7: Extension Reload (Dev Mode)

**Priority:** 🟡 MEDIUM
**Affected Users:** Developers, beta testers

### Preconditions
- Extension loaded in developer mode
- User signed in with active profiles
- ChatGPT page open with GREEN badge

### Test Steps
1. **VERIFY:** Starting state - Badge is GREEN ✓
2. Navigate to chrome://extensions
3. Click "Reload" button for Prompt Blocker
4. Wait 2 seconds
5. Switch to ChatGPT tab
6. **OBSERVE:** Modal appears OR page auto-reloads
7. After reload completes
8. **VERIFY:** Badge is GREEN ✓ again
9. Type PII
10. **VERIFY:** Substitution works

### Expected Results
| Step | Expected State | Pass/Fail |
|------|---------------|-----------|
| 6 | Modal OR auto-reload | ⬜ |
| 8 | Badge GREEN (restored) | ⬜ |
| 10 | Substitution works | ⬜ |

### Pass Criteria
- ✅ Protection restored after extension reload
- ✅ User notified if action required (modal)
- ✅ Badge shows correct state after reload

---

## Test Case 8: Global Enable/Disable Toggle

**Priority:** ⚠️ HIGH
**Affected Users:** All users (main toggle)

### Preconditions
- User signed in with active profiles
- ChatGPT page open with GREEN badge

### Test Steps
1. **VERIFY:** Starting state - Badge is GREEN ✓
2. Open popup → Settings tab
3. **VERIFY:** "Protection Enabled" toggle is ON
4. Type PII in ChatGPT
5. **VERIFY:** Substitution works
6. Return to Settings
7. Toggle OFF "Protection Enabled"
8. **VERIFY:** Popup shows disabled state (grey UI?)
9. Switch to ChatGPT tab
10. **VERIFY:** Badge is GREY (empty) or shows disabled icon
11. Type PII in ChatGPT
12. **VERIFY:** NO substitution
13. Open other AI service (claude.ai)
14. **VERIFY:** Badge also GREY (global disable)
15. Return to Settings
16. Toggle ON "Protection Enabled"
17. Switch to ChatGPT tab
18. **VERIFY:** Badge is GREEN ✓
19. Type PII
20. **VERIFY:** Substitution works

### Expected Results
| Step | Toggle State | Expected Badge | Expected Substitution | Pass/Fail |
|------|-------------|---------------|----------------------|-----------|
| 1 | ON | GREEN ✓ | Yes | ⬜ |
| 10 | OFF | GREY | No | ⬜ |
| 14 | OFF | GREY | No | ⬜ |
| 18 | ON | GREEN ✓ | Yes | ⬜ |

### Pass Criteria
- ✅ Global toggle affects ALL services
- ✅ Badge updates immediately on toggle change
- ✅ Substitution follows toggle state

---

## Badge State Truth Table

### Complete Test Matrix

| Enabled | Profiles | Profile Active | Domain Protected | Injected | Expected Badge | Test Case | Pass |
|---------|----------|---------------|------------------|----------|---------------|-----------|------|
| ❌ | any | any | any | any | GREY | TC8 | ⬜ |
| ✅ | 0 | N/A | ✅ | ✅ | RED/YELLOW | **TC1** | ⬜ |
| ✅ | >0 | ❌ | ✅ | ✅ | RED/YELLOW | **TC5** | ⬜ |
| ✅ | >0 | ✅ | ❌ | any | GREY | TC6 | ⬜ |
| ✅ | >0 | ✅ | ✅ | ❌ | RED ! | - | ⬜ |
| ✅ | >0 | ✅ | ✅ | ✅ | GREEN ✓ | TC2 | ⬜ |

**Bold** = Critical test cases (MUST PASS for launch)

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Build extension with badge bug fix
- [ ] Create fresh Chrome profile for testing
- [ ] Prepare test accounts (Google, GitHub)
- [ ] Document Chrome version, OS version

### Critical Tests (P0 - Must Pass)
- [ ] **TC1: First-time install** - Badge RED/YELLOW, not green
- [ ] **TC2: Create first profile** - Badge changes RED → GREEN
- [ ] **TC3: Sign out** - Badge changes GREEN → RED
- [ ] **TC5: Disable all profiles** - Badge changes GREEN → RED/YELLOW

### Important Tests (P1 - Should Pass)
- [ ] TC4: Wrong auth provider - Badge RED, banner shows
- [ ] TC6: Toggle service - Badge reflects service state
- [ ] TC8: Global enable/disable - Badge follows toggle

### Optional Tests (P2 - Nice to Have)
- [ ] TC7: Extension reload - Protection restored

---

## Test Results Summary

**Test Date:** ___________
**Tested By:** ___________
**Extension Version:** ___________
**Chrome Version:** ___________
**OS:** ___________

| Test Case | Priority | Status | Notes |
|-----------|----------|--------|-------|
| TC1: First-time install | 🔥 P0 | ⬜ | |
| TC2: Create first profile | 🔥 P0 | ⬜ | |
| TC3: Sign out | 🔥 P0 | ⬜ | |
| TC4: Wrong provider | ⚠️ P1 | ⬜ | |
| TC5: Disable all profiles | 🔥 P0 | ⬜ | |
| TC6: Toggle service | ⚠️ P1 | ⬜ | |
| TC7: Extension reload | 🟡 P2 | ⬜ | |
| TC8: Global toggle | ⚠️ P1 | ⬜ | |

**Overall Status:** ⬜ PASS / ⬜ FAIL

**Launch Decision:** ⬜ GO / ⬜ NO-GO

---

## Sign-Off

**QA Lead:** _________________ Date: _______

**Engineering Lead:** _________________ Date: _______

**Product Manager:** _________________ Date: _______

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-11 | v1.0 | Initial test cases | Claude Code |
