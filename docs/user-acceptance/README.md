# User Acceptance Testing (UAT) Framework

**Version:** v0.2.0-beta
**Last Updated:** 2025-11-11
**Status:** 🔴 **LAUNCH BLOCKER IDENTIFIED** - Badge status bug

---

## Overview

This UAT framework provides comprehensive testing scenarios to ensure Prompt Blocker is ready for public release. It covers authentication flows, protection states, badge management, and cross-context communication.

## Critical Findings Summary

### 🔥 P0 - Launch Blocker
- **Badge Status Bug**: Green badge shows when protection is OFF (no profiles)
- **Location**: `src/background/handlers/MessageRouter.ts` lines 40-57
- **Impact**: Users believe they're protected when they're not (false security)
- **Status**: 🔴 **MUST FIX BEFORE LAUNCH**

### ⚠️ P0 - Technical Debt (Launch Blockers)
- **documentAnalysis.ts**: 1,072 lines - God object needs splitting
- **content.ts**: 979 lines - Platform logic scattered

### 🟡 P1 - Quality Issues (Post-Launch)
- 4 files over 850 lines need refactoring
- Circular dependency in service worker
- Global state in some components

---

## Document Structure

### 1. Bug Reports
- **[CRITICAL-001-badge-false-positive.md](./bugs/CRITICAL-001-badge-false-positive.md)** - Badge shows green with no protection
- **[bugs/README.md](./bugs/README.md)** - Bug tracking index

### 2. Test Cases
- **[test-cases/authentication-flows.md](./test-cases/authentication-flows.md)** - Sign up, sign in, sign out scenarios
- **[test-cases/badge-status-flows.md](./test-cases/badge-status-flows.md)** - Badge color logic for all states
- **[test-cases/protection-flows.md](./test-cases/protection-flows.md)** - Enable/disable, service toggles
- **[test-cases/profile-management.md](./test-cases/profile-management.md)** - Create, edit, delete profiles
- **[test-cases/edge-cases.md](./test-cases/edge-cases.md)** - Race conditions, errors, network failures

### 3. User Flows
- **[user-flows/first-time-user.md](./user-flows/first-time-user.md)** - Fresh install to first protection
- **[user-flows/returning-user.md](./user-flows/returning-user.md)** - Signed-out user returns
- **[user-flows/power-user.md](./user-flows/power-user.md)** - Advanced features (custom rules, templates, documents)

### 4. Architecture Analysis
- **[architecture/badge-state-management.md](./architecture/badge-state-management.md)** - Complete badge logic mapping
- **[architecture/authentication-state.md](./architecture/authentication-state.md)** - Firebase auth integration
- **[architecture/message-passing.md](./architecture/message-passing.md)** - Cross-context communication
- **[architecture/data-flow.md](./architecture/data-flow.md)** - How data moves through the system

### 5. Refactoring Plan
- **[refactoring/priority-0-launch-blockers.md](./refactoring/priority-0-launch-blockers.md)** - Must fix before launch (3.5-4.5 days)
- **[refactoring/priority-1-quality.md](./refactoring/priority-1-quality.md)** - Post-launch improvements (5-6 days)
- **[refactoring/priority-2-polish.md](./refactoring/priority-2-polish.md)** - Future enhancements (3-4 days)
- **[refactoring/timeline.md](./refactoring/timeline.md)** - Week-by-week execution plan

---

## How to Use This Framework

### For QA Testing
1. Start with **[test-cases/badge-status-flows.md](./test-cases/badge-status-flows.md)** - Verify critical bug is fixed
2. Follow **[user-flows/first-time-user.md](./user-flows/first-time-user.md)** - Most common path
3. Run through all test cases in `test-cases/` directory
4. Document failures in `bugs/` directory

### For Development
1. Review **[bugs/CRITICAL-001-badge-false-positive.md](./bugs/CRITICAL-001-badge-false-positive.md)** for fix requirements
2. Check **[architecture/](./architecture/)** to understand system design
3. Follow **[refactoring/priority-0-launch-blockers.md](./refactoring/priority-0-launch-blockers.md)** for P0 fixes

### For Product Management
1. Read **[LAUNCH-READINESS.md](./LAUNCH-READINESS.md)** for go/no-go decision
2. Review **[refactoring/timeline.md](./refactoring/timeline.md)** for development estimates
3. Check **[bugs/README.md](./bugs/README.md)** for outstanding issues

---

## Launch Readiness Criteria

### ✅ **MUST PASS** (Launch Blockers)
- [ ] Badge shows RED/YELLOW when no active profiles (not green)
- [ ] First-time user sees correct onboarding flow
- [ ] Signed-out user cannot see green badge
- [ ] All 8 test cases in `badge-status-flows.md` pass
- [ ] documentAnalysis.ts refactored (no queue corruption)
- [ ] content.ts platform adapters split (all platforms work)

### 🟡 **SHOULD PASS** (Quality Gates)
- [ ] No 900+ line files remain
- [ ] Circular dependency removed from service worker
- [ ] Toast notification system implemented

### ⚪ **NICE TO HAVE** (Post-Launch)
- [ ] All P2 refactoring complete
- [ ] Code review from external developer

---

## Quick Links

- **Critical Bug**: [bugs/CRITICAL-001-badge-false-positive.md](./bugs/CRITICAL-001-badge-false-positive.md)
- **Launch Decision**: [LAUNCH-READINESS.md](./LAUNCH-READINESS.md)
- **Test All Flows**: [test-cases/](./test-cases/)
- **Refactoring Plan**: [refactoring/](./refactoring/)

---

## Document History

| Date | Author | Change |
|------|--------|--------|
| 2025-11-11 | Claude Code | Initial UAT framework creation |
| 2025-11-11 | Claude Code | Badge status bug analysis (CRITICAL-001) |
| 2025-11-11 | Claude Code | Technical debt analysis (P0/P1/P2) |

---

**Next Steps:**
1. Fix CRITICAL-001 badge bug (4-6 hours)
2. Run all badge test cases
3. Fix P0 refactoring blockers (3.5-4.5 days)
4. Make launch decision
