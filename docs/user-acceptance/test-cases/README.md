# Test Cases Index

**Last Updated:** 2025-11-11

---

## Test Suites

### 🔥 Critical (Must Pass Before Launch)

| Suite | File | Test Count | Priority | Status |
|-------|------|-----------|----------|--------|
| Badge Status | [badge-status-flows.md](./badge-status-flows.md) | 8 tests | 🔥 P0 | ⬜ Not Run |
| Authentication | [authentication-flows.md](./authentication-flows.md) | 6 tests | 🔥 P0 | ⬜ Not Run |
| Protection | [protection-flows.md](./protection-flows.md) | 5 tests | 🔥 P0 | ⬜ Not Run |

### ⚠️ Important (Should Pass)

| Suite | File | Test Count | Priority | Status |
|-------|------|-----------|----------|--------|
| Profile Management | [profile-management.md](./profile-management.md) | 7 tests | ⚠️ P1 | ⬜ Not Run |
| Custom Rules | [custom-rules.md](./custom-rules.md) | 5 tests | ⚠️ P1 | ⬜ Not Run |
| Templates | [prompt-templates.md](./prompt-templates.md) | 4 tests | ⚠️ P1 | ⬜ Not Run |

### 🟡 Edge Cases (Nice to Have)

| Suite | File | Test Count | Priority | Status |
|-------|------|-----------|----------|--------|
| Edge Cases | [edge-cases.md](./edge-cases.md) | 8 tests | 🟡 P2 | ⬜ Not Run |
| Performance | [performance.md](./performance.md) | 4 tests | 🟡 P2 | ⬜ Not Run |

---

## Quick Start

1. **Critical Path (Launch Blockers):**
   - Run [badge-status-flows.md](./badge-status-flows.md) TC1, TC2, TC3, TC5
   - Run [authentication-flows.md](./authentication-flows.md) all tests
   - Run [protection-flows.md](./protection-flows.md) all tests

2. **Full Regression:**
   - Run all tests in order (top to bottom)
   - Document results in each file
   - Report failures in `/bugs`

3. **Smoke Test (Quick Check):**
   - Badge TC1 (first-time install)
   - Auth TC1 (sign up flow)
   - Protection TC1 (substitution works)

---

## Test Status Legend

| Symbol | Status | Meaning |
|--------|--------|---------|
| ⬜ | Not Run | Test not executed yet |
| 🟢 | Pass | Test passed all criteria |
| 🔴 | Fail | Test failed, bug found |
| 🟡 | Warn | Test passed with warnings |
| ⏭️ | Skipped | Test skipped (blocked/not applicable) |

---

## Test Execution Order

```
Phase 1: Critical Path (Day 1)
├─ badge-status-flows.md (TC1, TC2, TC3, TC5) - 2 hours
├─ authentication-flows.md (all) - 1.5 hours
└─ protection-flows.md (all) - 1.5 hours
TOTAL: 5 hours

Phase 2: Full Regression (Day 2-3)
├─ profile-management.md - 2 hours
├─ custom-rules.md - 1.5 hours
├─ prompt-templates.md - 1 hour
├─ edge-cases.md - 2 hours
└─ performance.md - 1 hour
TOTAL: 7.5 hours

Phase 3: Re-test Failures (Day 4)
└─ Re-run any failed tests after fixes
```

---

## Test Environment Setup

### Required
- Chrome browser (latest stable)
- Fresh Chrome profile (no existing data)
- Test accounts:
  - Google account (for OAuth)
  - GitHub account (for OAuth)
  - Temp email account

### Recommended
- Screen recording software (for bug reports)
- Chrome DevTools open (console logs)
- Extension loaded in developer mode

---

## Reporting Issues

1. Run test case
2. Document failure
3. Create bug report in `/bugs/[SEVERITY]-[ID]-[slug].md`
4. Link bug in test case results
5. Update `/bugs/README.md` tracking table
