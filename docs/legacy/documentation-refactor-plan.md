# Documentation Refactor Plan - Production Ready

**Created:** 2025-11-01
**Status:** 🚧 Planning Phase
**Goal:** Create production-ready documentation aligned with PromptBlocker branding and free/pro tier structure

---

## 📊 Current State Analysis

### Documentation Inventory (22 files, 8,166 lines)

**Development Phase Docs (6 files, 2,256 lines):**
- `PHASE_0_COMPLETE.md` (180 lines) - Initial setup
- `PHASE_1_PROGRESS.md` (166 lines) - Phase 1 progress
- `PHASE_1_COMPLETE.md` (130 lines) - Phase 1 completion
- `PHASE_1.5_COMPLETE.md` (261 lines) - Interim phase
- `PHASE_2_PLAN.md` (346 lines) - Phase 2 planning
- `PHASE_2_COMPLETE.md` (267 lines) - Phase 2 completion
- `PHASE_3_PLAN.md` (586 lines) - Phase 3 planning
- `PHASE_3_COMPLETE.md` (308 lines) - Phase 3 completion
- `FINAL_DEV_PHASE.md` (1,064 lines) - **LARGEST FILE** - Comprehensive dev summary

**Technical Implementation Docs (7 files, 3,121 lines):**
- `FEATURE_UPGRADES.md` (733 lines) - Feature enhancement plans
- `IMPLEMENTATION_SUMMARY.md` (147 lines) - Implementation overview
- `css_refactor_plan.md` (503 lines) - CSS refactoring strategy
- `PROTECTION_STATUS_REFACTOR.md` (839 lines) - Protection status overhaul
- `VAULT_TROUBLESHOOTING.md` (269 lines) - Vault debugging guide
- `VAULT_UI_IMPROVEMENTS.md` (648 lines) - Vault UI enhancements
- `DISABLE_EXTENSION_FIX.md` (341 lines) - Extension disable/enable fix

**Testing Docs (3 files, 1,465 lines):**
- `TESTING_PLAN.md` (746 lines) - Testing strategy ✅ Recently updated
- `TESTING_SUMMARY.md` (441 lines) - Testing achievements ✅ Recently updated
- `E2E_TEST_STATUS.md` (278 lines) - E2E test status ✅ Recently updated

**User-Facing Docs (3 files, 713 lines):**
- `README.md` (279 lines) - Project overview (NEEDS UPDATE)
- `PRIVACY_POLICY.md` (200 lines) - Privacy policy ✅ Production-ready
- `DEBUG_GUIDE.md` (234 lines) - User debugging guide

**Additional Docs in /docs (3 files from earlier scan):**
- `docs/COMPREHENSIVE_REFACTOR_PLAN.md` - Previous refactor plan
- `docs/REFACTOR_VS_RESTART_ANALYSIS.md` - Architecture decision doc
- `docs/README.md` - Docs folder readme

---

## 🎯 Problems Identified

### 1. **Scattered Information**
- Development history spread across 9 phase files
- Redundant information between files
- No clear "source of truth" for current state

### 2. **Development-Focused vs Production-Ready**
- Most docs are internal development logs
- Missing user-facing documentation
- No clear deployment/launch guide

### 3. **Branding Inconsistency**
- Still uses "AI PII Sanitizer" in many places
- Should be "PromptBlocker" everywhere
- Free/Pro tier structure not documented

### 4. **No Clear Information Architecture**
- 22 files at root level is overwhelming
- No logical grouping or hierarchy
- Hard to find specific information

### 5. **Missing Production Documentation**
- No Chrome Web Store listing guide
- No user onboarding documentation
- No changelog/release notes
- No contributor guide
- No architecture overview for new devs

---

## 🏗️ Proposed New Structure

### Root Level (User & Contributor Facing)
```
README.md                    # Main project overview (PromptBlocker)
CHANGELOG.md                 # Version history and release notes (NEW)
CONTRIBUTING.md              # How to contribute (NEW)
PRIVACY_POLICY.md            # Privacy policy ✅ Keep as-is
LICENSE                      # Apache 2.0 or MIT (NEEDS DECISION)
```

### /docs (Technical Documentation)
```
docs/
├── README.md                # Documentation index
├── ARCHITECTURE.md          # System architecture overview (NEW)
├── ROADMAP.md              # Product roadmap with launch steps (NEW)
├── TESTING.md              # Testing guide (consolidate 3 testing docs)
└── development/            # Development history (archive)
    ├── phase-history.md    # Consolidated phase summary (NEW)
    ├── implementation-notes.md  # Technical decisions archive
    └── troubleshooting/    # Technical troubleshooting guides
        ├── vault.md
        ├── protection-status.md
        └── extension-toggle.md
```

### /docs/user-guide (End User Documentation) - NEW
```
docs/user-guide/
├── getting-started.md      # Quick start guide
├── features.md             # Feature overview (Free vs Pro)
├── faq.md                  # Frequently asked questions
└── debugging.md            # User-facing debug guide
```

### /docs/chrome-store (Store Listing Materials) - NEW
```
docs/chrome-store/
├── listing.md              # Store listing copy
├── screenshots/            # Store screenshots
├── promotional/            # Promotional images
└── submission-checklist.md # Pre-launch checklist
```

---

## 📋 Refactor Execution Plan

### Phase 1: Archive Development History ✅
**Goal:** Consolidate and archive development phase documentation

**Actions:**
1. Create `docs/development/phase-history.md` - Consolidate all PHASE_*.md files
2. Extract key technical decisions into `docs/development/implementation-notes.md`
3. Move troubleshooting docs to `docs/development/troubleshooting/`
4. **DELETE** redundant phase files from root:
   - `PHASE_0_COMPLETE.md`
   - `PHASE_1_PROGRESS.md`
   - `PHASE_1_COMPLETE.md`
   - `PHASE_1.5_COMPLETE.md`
   - `PHASE_2_PLAN.md`
   - `PHASE_2_COMPLETE.md`
   - `PHASE_3_PLAN.md`
   - `PHASE_3_COMPLETE.md`

**Estimated Time:** 2-3 hours

---

### Phase 2: Consolidate Technical Docs ✅
**Goal:** Reduce root clutter, organize technical documentation

**Actions:**
1. Create `docs/ARCHITECTURE.md` - System design overview
   - Extract from IMPLEMENTATION_SUMMARY.md
   - Add component diagrams
   - Document data flow

2. Create `docs/TESTING.md` - Unified testing guide
   - Consolidate TESTING_PLAN.md, TESTING_SUMMARY.md, E2E_TEST_STATUS.md
   - Add "How to run tests" section
   - Include coverage goals

3. Move technical troubleshooting:
   - `VAULT_TROUBLESHOOTING.md` → `docs/development/troubleshooting/vault.md`
   - `PROTECTION_STATUS_REFACTOR.md` → `docs/development/troubleshooting/protection-status.md`
   - `DISABLE_EXTENSION_FIX.md` → `docs/development/troubleshooting/extension-toggle.md`

4. Archive completed refactor plans:
   - `css_refactor_plan.md` → `docs/development/css-refactor-completed.md`
   - `VAULT_UI_IMPROVEMENTS.md` → `docs/development/vault-ui-completed.md`
   - `FEATURE_UPGRADES.md` → Extract to ROADMAP.md, archive rest

**Estimated Time:** 2-3 hours

---

### Phase 3: Create Production Documentation 🆕
**Goal:** Build user-facing and launch-ready documentation

**Actions:**
1. **ROADMAP.md** - Product roadmap
   - Current state (v1.0 features)
   - Free vs Pro tier breakdown
   - Launch checklist
   - Post-launch growth plan
   - Future feature ideas

2. **CHANGELOG.md** - Version history
   - v1.0.0 - Initial release (list all features)
   - Follow Keep a Changelog format

3. **CONTRIBUTING.md** - Contributor guide
   - How to set up dev environment
   - Code style guidelines
   - Testing requirements
   - PR process

4. **docs/ARCHITECTURE.md** - Technical overview
   - Chrome extension architecture (Manifest V3)
   - Component breakdown (background, content, popup)
   - Data flow diagrams
   - Storage encryption system
   - API key detection system

5. **docs/user-guide/** - User documentation
   - `getting-started.md` - Installation and first profile setup
   - `features.md` - Feature overview (aliasing, API key vault, custom redaction)
   - `faq.md` - Common questions
   - `debugging.md` - User-facing troubleshooting

**Estimated Time:** 4-5 hours

---

### Phase 4: Chrome Web Store Preparation 🆕
**Goal:** Create all materials needed for store submission

**Actions:**
1. **docs/chrome-store/listing.md** - Store listing copy
   - Title: "PromptBlocker - Privacy Protection for AI Chats"
   - Short description (132 chars max)
   - Detailed description (focus on benefits)
   - Category selection
   - Tags/keywords

2. **docs/chrome-store/submission-checklist.md**
   - Pre-submission checklist
   - Required screenshots (1280x800 or 640x400)
   - Promotional images (440x280, 920x680, 1400x560)
   - Privacy policy URL
   - Permissions justification
   - Test accounts (if needed)

3. **Collect screenshots** (5 required, 1-3 recommended)
   - Extension popup (main view)
   - Profile creation modal
   - API key vault
   - Custom redaction rules
   - Stats/activity view

4. **Create promotional images**
   - Small tile (440x280)
   - Large tile (920x680)
   - Marquee (1400x560)

**Estimated Time:** 3-4 hours

---

### Phase 5: Update README.md (FINAL) 🎯
**Goal:** Create production-ready main README

**New Structure:**
```markdown
# PromptBlocker - Privacy Protection for AI Chats

> 🛡️ Protect your personal information when using AI chat services like ChatGPT, Claude, and Gemini

[Installation] [Features] [Privacy] [Contributing]

## 🚀 Features

### Free Tier
- ✅ Identity aliasing (name, email, phone)
- ✅ Real-time PII substitution
- ✅ Support for ChatGPT, Claude, Gemini, Perplexity, Poe, Copilot
- ✅ Multiple profiles
- ✅ Local encryption (AES-256-GCM)

### Pro Tier (Coming Soon)
- 🔐 API Key Vault (detect & redact API keys)
- 🎯 Custom redaction rules (SSN, credit cards, etc.)
- 📊 Advanced usage statistics
- ☁️ Cloud sync (optional)

## 📦 Installation

[Chrome Web Store link - coming soon]

Or install manually:
1. Download latest release
2. Open chrome://extensions
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## 🎯 Quick Start

1. Click the PromptBlocker icon
2. Create your first profile
3. Enter your real information and preferred aliases
4. Visit ChatGPT and start chatting!

Your personal information is automatically replaced with aliases.

## 🔒 Privacy

- ✅ All data stored locally (encrypted)
- ✅ No external servers
- ✅ No analytics or tracking
- ✅ Open source code

[Read full Privacy Policy](./PRIVACY_POLICY.md)

## 🏗️ Architecture

Built with TypeScript, Chrome Extension Manifest V3:
- Background service worker (message routing, API key detection)
- Content scripts (ChatGPT/Claude/Gemini integration)
- Popup UI (profile management)
- Local storage with AES-256-GCM encryption

[See Architecture Docs](./docs/ARCHITECTURE.md)

## 🧪 Testing

- ✅ 105 unit tests (98-100% coverage on core logic)
- ✅ E2E tests with Playwright
- ✅ Manual testing across all supported AI services

[See Testing Guide](./docs/TESTING.md)

## 🗺️ Roadmap

- [ ] v1.0 - Chrome Web Store launch (Free tier)
- [ ] v1.1 - Pro tier features (API vault, custom rules)
- [ ] v1.2 - Firefox support
- [ ] v2.0 - Alias variations, pattern learning

[Full Roadmap](./docs/ROADMAP.md)

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

[Apache 2.0 / MIT - NEEDS DECISION]

## 🙏 Acknowledgments

Built with Claude Code by Anthropic.
```

**Estimated Time:** 1-2 hours

---

## 🎯 Success Criteria

### Documentation Quality
- [ ] All files use "PromptBlocker" branding consistently
- [ ] Free/Pro tiers clearly documented
- [ ] No development-only docs at root level
- [ ] Clear information architecture (easy to find things)
- [ ] User-facing docs written for non-technical users
- [ ] Technical docs complete enough for new contributors

### Launch Readiness
- [ ] Chrome Web Store listing materials ready
- [ ] Screenshot suite prepared (5 minimum)
- [ ] Promotional images created
- [ ] Privacy policy reviewed and finalized
- [ ] CHANGELOG ready for v1.0.0
- [ ] README compelling and professional

### Maintainability
- [ ] Clear folder structure
- [ ] No redundant information
- [ ] Single source of truth for each topic
- [ ] Easy to update for future releases

---

## 📅 Timeline

**Total Estimated Time:** 13-18 hours

**Recommended Schedule:**
- **Session 1 (3-4 hours):** Phase 1 + Phase 2 (archive and consolidate)
- **Session 2 (4-5 hours):** Phase 3 (create production docs)
- **Session 3 (3-4 hours):** Phase 4 (Chrome Store prep)
- **Session 4 (1-2 hours):** Phase 5 (README polish)
- **Session 5 (2-3 hours):** Final review, screenshots, submission

---

## 🚀 Next Actions

1. **Review this plan** - Approve or request changes
2. **Start Phase 1** - Archive development history
3. **Make branding decisions:**
   - Confirm "PromptBlocker" as final name
   - Decide on license (Apache 2.0 vs MIT)
   - Decide on Pro tier pricing/timeline
4. **Proceed systematically** through phases

---

**This plan turns 22 scattered development docs (8,166 lines) into a clean, production-ready documentation structure that supports both users and contributors.**
