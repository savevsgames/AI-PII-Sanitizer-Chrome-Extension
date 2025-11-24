# Documentation Archive
**Purpose**: Historical documentation (no longer accurate or superseded)
**Status**: REFERENCE ONLY - Do not use for current development

---

## Why These Were Archived

This folder contains documentation that is **outdated**, **contradictory**, or **completed**. These docs are kept for historical reference only (compliance audits, understanding project evolution).

**DO NOT** use these for current development. See `/docs-b2c-v1/` for validated current truth.

---

## Archive Categories

### 1. Legacy Design Docs (`/legacy-design/`)
**Status**: Superseded by current architecture

- `pii_sanitizer_pdd.md` - v1 Product Design (superseded by SYSTEM_ARCHITECTURE.md)
- `pii_sanitizer_tdd_v2.md` - v2 Technical Design (superseded by SYSTEM_ARCHITECTURE.md)
- `refactor_v2.md` - v2 migration notes (migration complete Nov 2024)
- PDF exports - Archived versions of above

**Why Archived**: Architecture has evolved to v3.0 modular design. These describe v1/v2 which no longer exist in codebase.

---

### 2. Completed Plans (`/completed-plans/`)
**Status**: Work finished, plans no longer relevant

- `REFACTORING_PLAN_PHASE_1.md` - Refactor complete (Nov 2024)
- `test-modernization-plan.md` - Test suite modernization complete (750/750 passing)
- `code-cleanup-plan.md` - Code cleanup complete (all critical bugs fixed)
- `FIXING_FAILING_TESTS_PLAN.md` - All tests now passing
- `ROOT_FOLDER_REORGANIZATION.md` - Root folder already organized

**Why Archived**: These were action plans that have been executed. Keeping for historical record of how we got to current state.

---

### 3. Point-in-Time Snapshots (`/point-in-time-snapshots/`)
**Status**: Accurate on specific date, but outdated now

- `SESSION_SUMMARY_2025-01-10.md` - Snapshot from Jan 10 (progress has continued)
- `COMPREHENSIVE_CODE_AUDIT_2025-01-10.md` - Audit from Jan 10 (findings addressed)
- `DOCUMENTATION_AUDIT_2025.md` - Audit that led to this consolidation
- `DOCUMENTATION_UPDATE_SUMMARY.md` - Summary of old doc structure
- `DOCUMENTATION_OVERHAUL_COMPLETE.md` - Point-in-time completion marker

**Why Archived**: These are snapshots showing state at a specific date. Useful for understanding timeline, but current state has progressed.

---

### 4. Contradictory/Confusing Docs (`/contradictory/`)
**Status**: Mixed truth/fiction or overlapping with better sources

- `README_PHASE_VERIFICATION.md` - Overlaps with PHASE_0_AND_1_COMBINED_LAUNCH.md
- `README_UPDATE_COMPLETE.md` - Superseded by new root README
- `FINAL_BOSS_LIST.md` - Merged into PRE_LAUNCH_CHECKLIST.md
- `launch_roadmap.md` - Superseded by PHASE_0_AND_1_COMBINED_LAUNCH.md

**Why Archived**: Caused confusion due to overlapping/contradictory information with newer docs.

---

## When to Reference Archive

### Valid Use Cases
✅ **Compliance Audits** - Show documentation trail (e.g., "How did architecture evolve?")
✅ **Onboarding New Contributors** - Learn project history (e.g., "Why did we choose modular architecture?")
✅ **Historical Context** - Understand past decisions (e.g., "Why Firebase over self-hosted auth?")
✅ **Debugging Legacy Code** - If old code snippets reference old docs

### Invalid Use Cases
❌ **Current Development** - Use `/docs-b2c-v1/` instead
❌ **New Features** - Use `/docs-b2c-v1/implementation/` instead
❌ **Reference Material** - Use validated docs, not archives
❌ **Copy-Paste Code** - Old docs may have outdated patterns

---

## Archive Organization

```
docs/archive/
  ├── README.md (this file)
  ├── legacy-design/
  │   ├── pii_sanitizer_pdd.md
  │   ├── pii_sanitizer_tdd_v2.md
  │   ├── refactor_v2.md
  │   └── *.pdf
  ├── completed-plans/
  │   ├── REFACTORING_PLAN_PHASE_1.md
  │   ├── test-modernization-plan.md
  │   ├── code-cleanup-plan.md
  │   └── FIXING_FAILING_TESTS_PLAN.md
  ├── point-in-time-snapshots/
  │   ├── SESSION_SUMMARY_2025-01-10.md
  │   ├── COMPREHENSIVE_CODE_AUDIT_2025-01-10.md
  │   └── DOCUMENTATION_AUDIT_2025.md
  └── contradictory/
      ├── README_PHASE_VERIFICATION.md
      ├── FINAL_BOSS_LIST.md
      └── launch_roadmap.md
```

---

## Archive Date

**Archived**: 2025-11-17
**Reason**: Documentation consolidation (validation against codebase, separation of truth vs vision)
**Replaced By**: `/docs-b2c-v1/` (validated current truth)

---

## Questions?

**If you're reading archived docs and get confused**:
1. Check `/docs-b2c-v1/` for current truth
2. Ask: "Is this still relevant to the codebase?"
3. If unsure, grep the codebase for referenced files/functions

**If archived doc contradicts current docs**:
- Current docs (`/docs-b2c-v1/`) are source of truth
- Archive is historical reference only

---

**Next**: See `/docs-b2c-v1/README.md` for current documentation structure
