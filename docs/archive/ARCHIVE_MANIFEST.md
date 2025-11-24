# Archive Manifest
**Date**: 2025-11-17
**Reason**: Documentation consolidation - separating validated truth from outdated/completed docs

---

## Files to Archive (Manual Move Required)

### From `/docs/legacy/` → `/docs/archive/legacy-design/`
- [x] `pii_sanitizer_pdd.md` - v1 Product Design
- [x] `pii_sanitizer_tdd_v2.md` - v2 Technical Design
- [x] `refactor_v2.md` - v2 migration notes
- [x] `PDD_ AI PII Sanitizer Extension.pdf`
- [x] `TDD_ AI PII Sanitizer - Technical Spec.pdf`
- [x] `documentation-refactor-plan.md`
- [x] `phase_1_testing_archive.md`

### From `/docs/testing/` → `/docs/archive/completed-plans/`
- [ ] `FIXING_FAILING_TESTS_PLAN.md` - All tests passing now
- [ ] `test-modernization-plan.md` - Modernization complete
- [ ] `code-cleanup-plan.md` - Cleanup complete
- [ ] `platform-testing-plan.md` - Superseded by TESTING.md

### From `/docs/development/` → `/docs/archive/completed-plans/`
- [ ] `REFACTORING_PLAN_PHASE_1.md` - Refactor complete
- [ ] `ROOT_FOLDER_REORGANIZATION.md` - Reorganization complete
- [ ] `css-refactor-completed.md` - CSS refactor done

### From `/docs/current/` → `/docs/archive/point-in-time-snapshots/`
- [ ] `SESSION_SUMMARY_2025-01-10.md`
- [ ] `COMPREHENSIVE_CODE_AUDIT_2025-01-10.md`

### From `/docs/development/` → `/docs/archive/point-in-time-snapshots/`
- [ ] `DOCUMENTATION_AUDIT_2025.md`
- [ ] `DOCUMENTATION_UPDATE_SUMMARY.md`
- [ ] `DOCUMENTATION_OVERHAUL_COMPLETE.md`

### From `/docs/development/` → `/docs/archive/contradictory/`
- [ ] `README_PHASE_VERIFICATION.md` - Overlaps with PHASE_0_AND_1_COMBINED_LAUNCH.md
- [ ] `README_UPDATE_COMPLETE.md` - Superseded by new README

### From `/docs/current/` → `/docs/archive/contradictory/`
- [ ] `FINAL_BOSS_LIST.md` - Merged into PRE_LAUNCH_CHECKLIST.md
- [ ] `launch_roadmap.md` - Superseded by PHASE_0_AND_1_COMBINED_LAUNCH.md

---

## Files to Keep in Place (Current Truth)

### `/docs/` (Root - Will be replaced by `/docs-b2c-v1/`)
- ✅ `README.md` - UPDATE with new structure
- ✅ `ROADMAP.md` - UPDATE to reflect 90% completion
- ✅ `PRODUCT_ROADMAP_V1_TO_ENTERPRISE.md` - MOVE to `/docs-enterprise-future/phase-1-teams/`

### `/docs/current/` (Active Docs)
- ✅ `PRE_LAUNCH_CHECKLIST.md` - Current launch requirements
- ✅ `building_a_trusted_extension.md` - Chrome Web Store compliance
- ✅ `technical_architecture.md` - SUPERSEDED by `/docs-b2c-v1/architecture/SYSTEM_ARCHITECTURE.md`
- ✅ `adding_ai_services.md` - Still relevant
- ✅ `marketing.md` - Still relevant (future marketing strategy)

### `/docs/testing/` (Active Docs)
- ✅ `TESTING.md` - Current test suite documentation
- ✅ `MVP_TEST_SIGN_OFF.md` - Official test approval
- ✅ `test-suite-status.md` - SUPERSEDED by TESTING.md (can archive)
- ✅ `TEST_SUITE_PROGRESS.md` - SUPERSEDED by TESTING.md (can archive)

### `/docs/security/` (Active Docs - All Current)
- ✅ `ENCRYPTION_SECURITY_AUDIT.md` - Production encryption audit
- ✅ `ENCRYPTION_OVERVIEW.md` - Current encryption implementation
- ✅ `XSS_PREVENTION.md` - Current security patterns

### `/docs/stripe/` (Active Docs - All Current)
- ✅ `STRIPE_INTEGRATION.md` - Live Stripe integration
- ✅ `STRIPE_NEXT_STEPS.md` - Pending webhook signature fix
- ✅ `TESTING.md` - Stripe testing strategy

### `/docs/features/` (Active Docs - All Current)
- ✅ `feature_alias_variations.md` - IMPLEMENTED Nov 2024
- ✅ `feature_quick_alias_generator.md` - IMPLEMENTED Nov 2024
- ✅ `feature_document_analysis_queue.md` - IMPLEMENTED Jan 2025
- ✅ `feature_image_editor.md` - IMPLEMENTED Nov 2024
- ✅ `feature_prompt_templates.md` - IMPLEMENTED Nov 2024
- ✅ `feature_api_key_vault.md` - IMPLEMENTED
- ✅ `feature_image_scanning.md` - FUTURE (not built)

### `/docs/development/` (Mixed - Need Review)
- ✅ `FOLDER_ORGANIZATION_COMPLETE.md` - Current structure
- ✅ `ARCHITECTURE.md` - SUPERSEDED by `/docs-b2c-v1/architecture/SYSTEM_ARCHITECTURE.md`
- ⏳ `MIGRATION_ANALYSIS_B2C_TO_TEAMS.md` - SOURCE for `/docs-b2c-v1/implementation/ORG_ARCHITECTURE_IMPLEMENTATION.md`
- ⏳ `ENTERPRISE_GRADE_ROADMAP.md` - MOVE to `/docs-enterprise-future/`
- ⏳ `TEAMS_TIER_IMPLEMENTATION.md` - MOVE to `/docs-b2c-v1/implementation/`
- ⏳ `API_GATEWAY_AND_INTEGRATIONS.md` - MOVE to `/docs-enterprise-future/phase-2-api/`

---

## Migration Commands (Execute After Review)

```bash
# Legacy Design Docs
mv docs/legacy/*.md docs/archive/legacy-design/
mv docs/legacy/*.pdf docs/archive/legacy-design/

# Completed Plans
mv docs/testing/FIXING_FAILING_TESTS_PLAN.md docs/archive/completed-plans/
mv docs/testing/test-modernization-plan.md docs/archive/completed-plans/
mv docs/testing/code-cleanup-plan.md docs/archive/completed-plans/
mv docs/testing/platform-testing-plan.md docs/archive/completed-plans/
mv docs/development/REFACTORING_PLAN_PHASE_1.md docs/archive/completed-plans/
mv docs/development/ROOT_FOLDER_REORGANIZATION.md docs/archive/completed-plans/
mv docs/development/css-refactor-completed.md docs/archive/completed-plans/

# Point-in-Time Snapshots
mv docs/current/SESSION_SUMMARY_2025-01-10.md docs/archive/point-in-time-snapshots/
mv docs/current/COMPREHENSIVE_CODE_AUDIT_2025-01-10.md docs/archive/point-in-time-snapshots/
mv docs/development/DOCUMENTATION_AUDIT_2025.md docs/archive/point-in-time-snapshots/
mv docs/development/DOCUMENTATION_UPDATE_SUMMARY.md docs/archive/point-in-time-snapshots/
mv docs/development/DOCUMENTATION_OVERHAUL_COMPLETE.md docs/archive/point-in-time-snapshots/

# Contradictory Docs
mv docs/development/README_PHASE_VERIFICATION.md docs/archive/contradictory/
mv docs/development/README_UPDATE_COMPLETE.md docs/archive/contradictory/
mv docs/current/FINAL_BOSS_LIST.md docs/archive/contradictory/
mv docs/current/launch_roadmap.md docs/archive/contradictory/

# Also archive superseded test docs
mv docs/testing/test-suite-status.md docs/archive/completed-plans/
mv docs/testing/TEST_SUITE_PROGRESS.md docs/archive/completed-plans/
```

---

## Post-Archive Cleanup

**After moving files, delete empty folders**:
```bash
rmdir docs/legacy
# Keep docs/current, docs/testing, docs/development (have active files)
```

**Verify archive is complete**:
```bash
ls -la docs/archive/legacy-design/
ls -la docs/archive/completed-plans/
ls -la docs/archive/point-in-time-snapshots/
ls -la docs/archive/contradictory/
```

---

## Validation Checklist

After archiving, verify:
- [ ] All archived docs have README.md explaining why archived
- [ ] New `/docs-b2c-v1/` structure is complete and validated
- [ ] Root README.md points to new structure
- [ ] No broken links in active documentation
- [ ] `docs/current/`, `docs/testing/`, `docs/security/`, `docs/stripe/`, `docs/features/` contain only active docs

---

**Status**: Manifest created, manual execution required (review before moving files)
