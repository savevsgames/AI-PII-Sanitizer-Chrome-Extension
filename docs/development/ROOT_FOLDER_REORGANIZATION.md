# Root Folder Reorganization Plan

**Date:** 2025-01-08

---

## Current State - Root Folder

**Should Stay in Root:**
- ✅ README.md
- ✅ ROADMAP.md
- ✅ PRIVACY_POLICY.md
- ✅ CONTRIBUTING.md
- ✅ CHANGELOG.md
- ✅ CLAUDE.md
- ✅ LICENSE (if exists)

**Should Move to /docs:**

None currently! Root is clean.

---

## Current State - /docs Folder (Root Level)

**Files Currently in docs/ root:**

1. `ARCHITECTURE.md` → Move to `docs/development/`
2. `CRITICAL_SECURITY_SUMMARY.md` → Move to `docs/security/`
3. `DOCUMENTATION_UPDATE_SUMMARY.md` → Move to `docs/development/`
4. `FEATURES_AUDIT.md` → Move to `docs/development/`
5. `PRO_FEATURE_GATING_AUDIT.md` → Move to `docs/development/`
6. `PROMPT_TEMPLATES_ARCHITECTURE.md` → Move to `docs/features/` (or merge with feature doc)
7. `README.md` → Keep (index for docs folder)
8. `SECURITY_AUDIT.md` → Move to `docs/security/`
9. `TESTING.md` → Move to `docs/testing/`
10. `TIER_LIMITS_UPDATED.md` → Move to `docs/development/`

---

## Reorganization Actions

### Architecture
- **Move:** `docs/ARCHITECTURE.md` → `docs/development/ARCHITECTURE.md`
- **Reason:** System architecture documentation belongs in development folder

### Security
- **Move:** `docs/CRITICAL_SECURITY_SUMMARY.md` → `docs/security/CRITICAL_SECURITY_SUMMARY.md`
- **Move:** `docs/SECURITY_AUDIT.md` → `docs/security/SECURITY_AUDIT.md`
- **Reason:** Security docs belong in security folder

### Testing
- **Move:** `docs/TESTING.md` → `docs/testing/TESTING.md`
- **Reason:** Main test documentation belongs in testing folder
- **Note:** Check if redundant with `docs/testing/README.md`

### Development/Audit Docs
- **Move:** `docs/DOCUMENTATION_UPDATE_SUMMARY.md` → `docs/development/DOCUMENTATION_UPDATE_SUMMARY.md`
- **Move:** `docs/FEATURES_AUDIT.md` → `docs/development/FEATURES_AUDIT.md`
- **Move:** `docs/PRO_FEATURE_GATING_AUDIT.md` → `docs/development/PRO_FEATURE_GATING_AUDIT.md`
- **Move:** `docs/TIER_LIMITS_UPDATED.md` → `docs/development/TIER_LIMITS_UPDATED.md`
- **Reason:** Audit and development tracking docs belong in development folder

### Features
- **Action:** Check if `docs/PROMPT_TEMPLATES_ARCHITECTURE.md` can merge with `docs/features/feature_prompt_templates.md`
- **If redundant:** Merge into feature doc
- **If unique:** Move to `docs/features/PROMPT_TEMPLATES_ARCHITECTURE.md`

---

## Final Structure

```
/ (root)
├── README.md ✅
├── ROADMAP.md ✅
├── PRIVACY_POLICY.md ✅
├── CONTRIBUTING.md ✅
├── CHANGELOG.md ✅
├── CLAUDE.md ✅
└── LICENSE ✅

docs/
├── README.md (index for docs folder) ✅
├── development/
│   ├── ARCHITECTURE.md (moved from docs/)
│   ├── DOCUMENTATION_UPDATE_SUMMARY.md (moved from docs/)
│   ├── FEATURES_AUDIT.md (moved from docs/)
│   ├── PRO_FEATURE_GATING_AUDIT.md (moved from docs/)
│   ├── TIER_LIMITS_UPDATED.md (moved from docs/)
│   └── ... (existing files)
├── security/
│   ├── CRITICAL_SECURITY_SUMMARY.md (moved from docs/)
│   ├── SECURITY_AUDIT.md (moved from docs/)
│   └── ... (existing files)
├── testing/
│   ├── TESTING.md (moved from docs/)
│   └── ... (existing files)
├── features/
│   ├── PROMPT_TEMPLATES_ARCHITECTURE.md (moved/merged)
│   └── ... (existing files)
└── ... (other subfolders)
```

---

## Execution Order

1. ✅ Move architecture doc
2. ✅ Move security docs (2 files)
3. ✅ Move testing doc
4. ✅ Move development/audit docs (4 files)
5. ✅ Handle prompt templates architecture (merge or move)
6. ✅ Verify no broken links
7. ✅ Update any references

---

**Status:** Ready to execute
