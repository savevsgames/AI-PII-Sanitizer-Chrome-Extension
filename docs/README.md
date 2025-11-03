# Documentation Directory

## Structure

```
docs/
├── current/              # Active, up-to-date documentation
│   ├── launch_roadmap.md              # Launch strategy & timeline
│   ├── marketing.md                   # Monetization & growth strategy
│   ├── building_a_trusted_extension.md # Production checklist
│   ├── technical_architecture.md      # System architecture & data flow
│   └── adding_ai_services.md          # Guide to adding new AI services
│
├── features/             # Future feature specifications
│   ├── feature_api_key_vault.md       # API key vault (PRO tier)
│   └── feature_image_scanning.md      # Image PII scanner (PRO tier)
│
├── legacy/               # Historical/outdated documentation
│   ├── pii_sanitizer_pdd.md           # v1 Product Design Doc
│   ├── pii_sanitizer_tdd_v2.md        # v2 Technical Design Doc
│   ├── refactor_v2.md                 # v2 migration notes
│   ├── PDD_ AI PII Sanitizer Extension.pdf
│   └── TDD_ AI PII Sanitizer - Technical Spec.pdf
│
└── testing/              # Test documentation & results
    ├── MVP_TEST_SIGN_OFF.md        # Official approval document
    └── README.md                    # Testing folder index
```

---

## Current Documentation

### [launch_roadmap.md](current/launch_roadmap.md)
**Purpose:** Step-by-step launch plan
**Audience:** Founders, developers
**Key Sections:**
- Phase 1: Profile Editor UI (3-4 days)
- Phase 2: Production Polish (5-7 days)
- Phase 3: API Key Vault (1 week)
- Phase 4: Service Testing (2-3 days)
- Timeline: 3 weeks to launch

**Status:** ✅ Active - follow this for launch

---

### [marketing.md](current/marketing.md)
**Purpose:** Monetization and growth strategy
**Audience:** Business, marketing
**Key Sections:**
- Free vs PRO feature matrix
- Pricing tiers ($4.99/mo PRO, custom Enterprise)
- Growth strategy (developer-first approach)
- Chrome Web Store optimization
- Launch timeline and success metrics

**Status:** ✅ Active - reference for positioning

---

### [building_a_trusted_extension.md](current/building_a_trusted_extension.md)
**Purpose:** Production checklist
**Audience:** Developers
**Key Sections:**
- Chrome Web Store requirements
- Privacy & legal requirements (Privacy Policy, GDPR/CCPA)
- Security best practices
- Pre-launch checklist
- Common rejection reasons

**Status:** ✅ Active - use before Chrome Web Store submission

---

### [technical_architecture.md](current/technical_architecture.md)
**Purpose:** System architecture guide
**Audience:** Developers, contributors
**Key Sections:**
- Component overview (service worker, content script, inject script)
- Data flow diagrams
- Security model (encryption, local-only storage)
- Request/response substitution flow
- Profile-based architecture (v2)

**Status:** ✅ Active - reference for understanding codebase

---

### [adding_ai_services.md](current/adding_ai_services.md)
**Purpose:** How to add new AI service support
**Audience:** Developers, contributors
**Key Sections:**
- Architecture overview (shared vs separate modules)
- Step-by-step guide (using Mistral as example)
- Common request formats (messages, prompt, parts)
- Testing checklist
- Troubleshooting tips

**Status:** ✅ Active - use when adding services

---

## Feature Specifications

### [feature_api_key_vault.md](features/feature_api_key_vault.md)
**Purpose:** API key detection & protection (PRO tier)
**Status:** 📋 Planned - Phase 3 of launch roadmap
**Key Features:**
- Auto-detect API keys in error logs (OpenAI, GitHub, AWS, etc.)
- Encrypted vault storage
- Warn-before-send mode
- Stats: "47 keys protected this month"

**Implementation:** 4 phases, MVP in 1 week

---

### [feature_image_scanning.md](features/feature_image_scanning.md)
**Purpose:** Image PII scanner with OCR (PRO tier)
**Status:** 🔮 Future - Only build if users request it
**Key Features:**
- Toggle ON/OFF in settings (user controls performance)
- Tesseract.js OCR (runs in browser, no server)
- Detect text-based PII in screenshots
- Warning dialog if PII found

**Implementation:** 3 phases, MVP in 1 week
**Decision:** Skip for initial launch, add based on user feedback

---

## Legacy Documentation

**Purpose:** Historical reference only - DO NOT use for current development

### pii_sanitizer_pdd.md
Original v1 product design document (superseded by current docs)

### pii_sanitizer_tdd_v2.md
v2 technical design document (superseded by technical_architecture.md)

### refactor_v2.md
Migration notes from v1 → v2 (migration complete, no longer needed)

### PDFs
Exported versions of PDD and TDD for archival purposes

---

## Quick Reference

### Starting Development?
1. Read **technical_architecture.md** - understand the system
2. Read **adding_ai_services.md** - learn how to extend it
3. Review **TESTING.md** - testing guidelines and best practices

### Preparing for Launch?
1. Follow **launch_roadmap.md** - step-by-step plan
2. Use **building_a_trusted_extension.md** - production checklist
3. Reference **marketing.md** - positioning and messaging
4. Review **testing/MVP_TEST_SIGN_OFF.md** - official test approval

### Running Tests?
1. See **TESTING.md** - comprehensive testing guide
2. Commands: `npm test`, `npm run test:all`, `npm run test:coverage`
3. Review **TEST_SUITE_STATUS.md** - current test status

### Building PRO Features?
1. Review **feature_api_key_vault.md** - first PRO feature
2. Consider **feature_image_scanning.md** - only if users want it

---

## Maintenance

### When to Update
- **current/**: Update whenever architecture or process changes
- **features/**: Add new specs as features are proposed
- **legacy/**: Never update, archive only

### Naming Conventions
- Current docs: Descriptive names (e.g., `marketing.md`)
- Feature specs: Prefix with `feature_` (e.g., `feature_api_key_vault.md`)
- Legacy docs: Keep original names for reference

---

## Contributing

When adding new documentation:

1. **Active documentation** → `current/`
   - Architecture guides
   - Process documentation
   - How-to guides

2. **Feature specifications** → `features/`
   - Prefix with `feature_`
   - Include implementation plan
   - Mark status (Planned, In Progress, Completed)

3. **Outdated documentation** → `legacy/`
   - Move here when superseded
   - Don't delete (historical reference)

4. **Test results** → `testing/`
   - Test reports
   - Bug tracking
   - QA documentation

---

## Testing Documentation

### [TESTING.md](TESTING.md) ✅
**Purpose:** Comprehensive testing guide for AI PII Sanitizer
**Audience:** Developers, QA, contributors
**Key Sections:**
- Quick start & test commands
- Complete test suite breakdown (306 tests)
- Platform coverage matrix (5 platforms)
- Detailed coverage by module
- E2E test status (deferred)
- Troubleshooting guide
- Testing best practices

**Status:** ✅ **Active** - Primary testing reference

**Test Results:**
- **306 total unit tests**
- **289 passing (100% of runnable tests)**
- **17 properly skipped (crypto-dependent)**
- **0 failing tests**
- **All 5 platforms comprehensively tested**

### [testing/MVP_TEST_SIGN_OFF.md](testing/MVP_TEST_SIGN_OFF.md) ✅
**Purpose:** Official MVP testing approval document
**Audience:** Stakeholders, management
**Key Sections:**
- Executive summary
- Test results summary
- Platform validation matrix
- Feature coverage validation
- Security validation
- Risk assessment
- Official sign-off

**Status:** ✅ **APPROVED FOR MVP LAUNCH**

---

## Additional Testing Documents

### [testing/test-suite-status.md](testing/test-suite-status.md)
**Purpose:** Current snapshot of test suite status
**Last Updated:** 2025-11-03
**Status:** 100% passing (289/289 runnable tests)

### [testing/test-modernization-plan.md](testing/test-modernization-plan.md)
**Purpose:** Testing roadmap and modernization plan
**Last Updated:** 2025-11-03
**Status:** All phases complete ✅

### [testing/code-cleanup-plan.md](testing/code-cleanup-plan.md)
**Purpose:** Issues found during testing
**Last Updated:** 2025-11-03
**Status:** All critical bugs fixed ✅

### [testing/platform-testing-plan.md](testing/platform-testing-plan.md)
**Purpose:** Platform-specific testing strategy
**Last Updated:** 2025-11-02
**Status:** Archived (covered in TESTING.md)

---
