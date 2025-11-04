# PromptBlocker - Product Roadmap

**Last Updated:** 2025-11-04
**Current Version:** 1.0.0-beta (Production Ready - Testing Phase)
**Status:** 🔧 **STORAGE AUDIT COMPLETE - FIXING CRITICAL ISSUES**

**Recent Updates:**
- ✅ Comprehensive storage audit complete (2025-11-04)
- ✅ localStorage→chrome.storage migration verified (100% complete)
- ⚠️ Critical storage issues identified (theme persistence, API key encryption)
- 🚧 Phase 1.5: Storage Hardening in progress
- ✅ Testing documentation refactored (289/289 tests passing)
- ✅ 5 production platforms fully operational
- ✅ Professional project organization

---

## 🎯 Vision & Mission

**Vision:** Make privacy protection effortless for everyone using AI chat services.

**Mission:** Provide robust, transparent PII protection that requires zero technical knowledge while offering advanced features for power users.

**Core Values:**
- 🔒 **Security First:** No launch until vulnerabilities are fixed
- 🎯 **User-Centric:** Intuitive design, fail-safe defaults
- 🚀 **Open Source:** Transparent code, community-driven
- 💎 **Quality:** 98-100% test coverage on core logic

---

## 🎯 Current Status

**Platform Support:**
- ✅ **5 Production Platforms** (98% market coverage)
  - ChatGPT, Claude, Gemini, Perplexity, Copilot
  - All fully tested and working
  - Comprehensive platform documentation: [docs/platforms/](./docs/platforms/)

**Testing:**
- ✅ **289/289 Unit Tests Passing** (100% runnable)
- ✅ **306 Total Tests** (17 skipped by design - crypto-dependent)
- ✅ **Platform Coverage:** Equal coverage across all 5 platforms
- ✅ **Documentation:** [docs/TESTING.md](./docs/TESTING.md)

**Code Quality:**
- ✅ **TypeScript Strict Mode** - Type-safe codebase
- ✅ **ESLint Security Rules** - XSS/localStorage protection
- ✅ **Modular Architecture** - 14+ UI components (popup-v2.ts: 901 → 123 lines)
- ✅ **Professional Organization** - Clean root, organized docs

**Authentication:**
- ✅ **Firebase Auth** - Google Sign-In working
- ✅ **User Profiles** - Firestore sync complete
- ✅ **Tier System** - Free/PRO gating ready (payment pending)

**Next Priority:** Storage hardening (theme persistence + API key encryption) → Security hardening → Chrome Web Store preparation

**Launch Readiness:** See [PRE_LAUNCH_CHECKLIST.md](./PRE_LAUNCH_CHECKLIST.md) for detailed Chrome Web Store submission plan.

---

## 📅 Release Timeline

### ✅ Phase 0: Development Phase (Complete)
**Timeline:** October - November 2024
**Status:** ✅ Complete

**Achievements:**
- [x] Chrome Extension Manifest 
- [x] Three-context security model (page/isolated/background)
- [x] Identity aliasing with bidirectional substitution
- [x] AES-256-GCM encryption for local storage
- [x] Multi-service support (7 AI platforms)
- [x] API Key Vault (PRO feature)
- [x] Custom redaction rules (PRO feature)
- [x] Glassmorphism UI design
- [x] 105 unit tests (98-100% coverage)
- [x] Production-ready documentation

---

### 🗄️ Phase 1.5: Storage Hardening (NEW - Week 1)
**Target Date:** November 4-6, 2024
**Status:** 🚧 **CURRENT PRIORITY**
**Estimated Time:** 1-2 days
**Branch:** `storage/hardening`

**Critical Storage Issues Found:**
Based on comprehensive storage audit (2025-11-04), we identified critical issues that must be fixed before security hardening and launch.

**Storage Audit Results:**
- ✅ **localStorage Migration: COMPLETE** - No localStorage usage in codebase
- ✅ **Architecture: EXCELLENT** - Centralized StorageManager, no hybrid storage
- ✅ **Encryption (Profiles): PERFECT** - AES-256-GCM with PBKDF2 key derivation
- ❌ **Encryption (API Keys): CRITICAL** - API keys stored in plaintext
- ⚠️ **Theme Persistence: BUG** - Theme resets when popup reopens
- ⚠️ **Storage Monitoring: MISSING** - No quota tracking (10MB limit)

**Implementation Tasks:**

- [ ] **Fix Theme Persistence Bug** (P0 - 1-2 hours)
  - Debug config loading sequence in popup-v2.ts
  - Verify `store.initialize()` completes before `updateThemeUI()`
  - Add console logging to track theme load/save lifecycle
  - Test theme persistence across popup close/reopen cycles
  - Verify theme saves to `config.settings.theme` correctly
  - **Success Criteria:** Theme persists after closing/reopening popup
  - **Files:** src/popup/popup-v2.ts (lines 28-34), src/popup/components/settingsHandlers.ts (lines 221-300)

- [x] **Encrypt API Keys in Storage** (P0 - 2-4 hours) ✅ **COMPLETE**
  - ✅ Created `encryptAPIKeyVault()` and `decryptAPIKeyVault()` methods
  - ✅ Updated `saveConfig()` to encrypt API keys before storage
  - ✅ Updated `loadConfig()` to decrypt API keys after retrieval
  - ✅ Uses same AES-256-GCM encryption as profiles (PBKDF2 + 210k iterations)
  - ✅ Added automatic migration for existing plaintext API keys
  - ✅ Encrypted vault stored as `_encryptedApiKeyVault` field
  - ✅ Plaintext keys cleared from storage after encryption
  - **Success Criteria:** ✅ API keys now stored encrypted in chrome.storage.local
  - **Files:** src/lib/storage.ts (lines 964-986, 325-355, 361-400, 930-975)

- [ ] **Add Storage Quota Monitoring** (P1 - 1 hour)
  - Implement `getStorageUsage()` method
  - Display storage usage in Settings tab
  - Warn users at 80% capacity (8MB of 10MB)
  - Add cleanup suggestions when approaching limit
  - **Success Criteria:** Users can see storage usage and get warnings
  - **Files:** src/lib/storage.ts, src/popup/components/settingsHandlers.ts

- [ ] **Add Storage Tests** (P1 - 1 hour)
  - Test theme persistence across load cycles
  - Test API key encryption/decryption
  - Test storage quota monitoring
  - Test migration from plaintext to encrypted API keys
  - **Success Criteria:** 100% coverage on storage operations
  - **Files:** tests/storage.test.ts

**Audit Findings Summary:**

**Storage Architecture (Score: 8.5/10)**
- ✅ **Migration Complete:** 0 instances of localStorage/sessionStorage
- ✅ **Centralized Manager:** All storage via StorageManager singleton
- ✅ **Three-Layer System:** chrome.storage.local + Firebase + Zustand
- ✅ **Type Safety:** Full TypeScript types throughout

**Data Storage Locations:**
1. **chrome.storage.local (Primary)**
   - Profiles: ✅ Encrypted (AES-256-GCM)
   - Aliases (v1): ✅ Encrypted (AES-256-GCM)
   - API Keys: ❌ **PLAINTEXT (CRITICAL SECURITY ISSUE)**
   - User Config: Mixed (account data unencrypted)
   - UI Preferences: Unencrypted (acceptable)

2. **Firebase Firestore (Auth Only)**
   - User authentication data
   - Subscription tier (free/pro)
   - Stripe subscription metadata
   - ✅ **NO aliases stored** (privacy claim verified)
   - ✅ **NO API keys stored** (privacy claim verified)

3. **Zustand Store (In-Memory)**
   - Temporary state only, syncs with chrome.storage

**Deliverable:** 100% reliable storage with encrypted sensitive data

**Success Criteria:**
- ✅ Theme persists across popup sessions (COMPLETE 2025-11-04)
- ✅ API keys encrypted in chrome.storage.local (COMPLETE 2025-11-04)
- [ ] Storage usage visible to users
- ✅ No data loss or corruption (verified)
- [ ] All storage tests passing

**Why This is P0 (Blocking Launch):**
- API keys in plaintext = security vulnerability (could leak to malware)
- Theme bug = poor user experience (unprofessional)
- Storage monitoring = prevent data loss when quota exceeded

---

### 🔒 Phase 1: Security Hardening (Week 2)
**Target Date:** November 8-15, 2024
**Status:** 📋 **NEXT PRIORITY** (after Phase 1.5)
**Estimated Time:** 5-7 days

**Critical Security Fixes:**
- [ ] **Fix XSS Vulnerabilities** (P0 - 1-2 days)
  - Audit all 52 innerHTML assignments
  - Apply escapeHtml() consistently
  - Add XSS prevention tests
  - Create ESLint rule to prevent raw innerHTML

- [x] **Replace localStorage** (P0 - 2 hours) ✅ **COMPLETE**
  - ✅ Verified: 0 instances of localStorage in codebase
  - ✅ All storage uses chrome.storage.local
  - ✅ ESLint rule already bans localStorage usage
  - **Audit Date:** 2025-11-04

- [x] **Improve Encryption** (P1 - 4 hours) ✅ **COMPLETE**
  - ✅ Per-user random encryption keys implemented
  - ✅ Keys stored in chrome.storage.local (_encryptionKeyMaterial)
  - ✅ PBKDF2 with 210,000 iterations
  - ✅ AES-256-GCM for profiles and aliases
  - ❌ **NOTE:** API keys NOT encrypted (moved to Phase 1.5)

- [ ] **Add Input Validation** (P2 - 4 hours)
  - Validate email, phone, address formats
  - Prevent ReDoS attacks in custom patterns
  - Add max length limits

- [ ] **Sanitize Debug Logs** (P3 - 2 hours)
  - Remove PII from console.log statements
  - Use DEBUG_MODE flag consistently

**Deliverable:** Security-hardened codebase ready for beta testing

**Success Criteria:**
- [ ] No XSS vulnerabilities in audit
- ✅ No localStorage usage in codebase (VERIFIED 2025-11-04)
- [ ] All security tests passing
- [ ] External security review (optional but recommended)

---

### 🔐 Phase 2: Authentication & User Management (NEW - Week 2-3)
**Target Date:** November 15-30, 2024
**Status:** 🚧 **IN PROGRESS**
**Estimated Time:** 7-10 days
**Branch:** `Authentication/UserManagement`

**Infrastructure Decision:** Firebase Authentication (Recommended)

**Why Firebase:**
- Fast implementation (5-7 days vs 10-14 days self-hosted)
- Scales automatically
- $0 infrastructure cost initially (free tier: 50k MAU)
- Built-in OAuth (Google, GitHub, Email)
- Secure by default

**Implementation Tasks:**
- [x] **Set Up Firebase Project** (Day 1) ✅ **COMPLETE**
  - [x] Created Firebase project: `promptblocker-prod`
  - [x] Configured environment variables in `.env`
  - [x] Set up Firestore database
  - [x] Configured security rules (deployed)
  - [x] Installed Firebase SDK (v11.0.2)
  - [x] Created `src/lib/firebase.ts` initialization
  - [x] Integrated dotenv-webpack for config
  - [x] Deployed Firestore security rules via Firebase CLI
  - [x] Tested Firebase connection (all tests passed)

- [ ] **Implement Auth Flow** (Day 2-4)
  - [ ] Add login/signup UI in popup
  - [ ] Integrate Firebase Auth SDK
  - [ ] Handle OAuth flows (Google sign-in)
  - [ ] Store auth state in chrome.storage.local
  - [ ] Add logout functionality

- [ ] **Tier Verification** (Day 5-6)
  - [ ] Create users collection in Firestore
  - [ ] Store tier info (free/pro) per user
  - [ ] Implement checkPROFeature() function
  - [ ] Add upgrade prompts for PRO features

- [ ] **User Profile Management** (Day 7)
  - [ ] Display user email/name in popup
  - [ ] Show current tier (free/pro)
  - [ ] Add account settings page

- [ ] **Testing** (Day 8-9)
  - [ ] Test login/logout flows
  - [ ] Test tier verification
  - [ ] Test offline behavior
  - [ ] Handle auth errors gracefully

**Firebase Setup Documentation:**
- 📄 [Firebase Setup Guide](./docs/setup/FIREBASE_SETUP_GUIDE.md) (9,000+ words)
- 📄 [Deployment Quick Reference](./FIREBASE_DEPLOY.md)
- 📄 [Firebase Test Instructions](./TEST_FIREBASE_INSTRUCTIONS.md)

**Firebase Configuration:**
- **Project ID:** `promptblocker-prod`
- **Auth Domain:** `promptblocker-prod.firebaseapp.com`
- **Storage Bucket:** `promptblocker-prod.firebasestorage.app`
- **Security Rules:** Deployed (users can only access their own data)
- **Anonymous Auth:** Enabled (for testing)

**Progress Update (2025-11-02):**
✅ **Authentication Complete:**
- [x] Firebase backend configured and deployed
- [x] Google Sign-In (Chrome Identity API) working
- [x] User profile UI with dropdown menu
- [x] Sign-in button with loading spinner
- [x] Custom sign-out confirmation modal
- [x] Firestore user sync on authentication
- [x] Tier info stored and retrieved from Firestore
- [x] Auth state persists across browser restarts

✅ **UI/UX Enhancements:**
- [x] Redesigned reload modal (smaller, branded, less alarming)
- [x] Fixed dropdown z-index (moved outside header)
- [x] Updated reload banner to use theme CSS
- [x] Auto-close dropdown on menu item clicks

**Current Status:** ✅ **COMPLETE - Ready for Phase 2A**

**Deliverable:** Working authentication system with free/PRO tier enforcement

**Success Criteria:**
- ✅ Users can sign up and log in with Google
- ✅ Tier info synced from Firestore
- ✅ PRO features properly gated
- ✅ Auth persists across browser restarts
- ✅ Professional UI with no browser dialogs

**Cost:** $0/month (free tier sufficient for first 1,000 users)

---

### 🎯 Phase 2A: User Onboarding & First Profile (NEW - Week 3)
**Target Date:** November 2-8, 2024
**Status:** ✅ **COMPLETE**
**Completed:** November 2, 2024

**Goal:** Guide users to successfully create their first alias profile

**Why This Matters:**
- Users have authentication but don't know what to do next
- Creating first alias = activated user (conversion critical)
- Need to demonstrate core value proposition immediately

**Implementation Complete:**
- [x] **Simplified Onboarding** (Completed)
  - ✅ Removed complex onboarding modal (caused timing issues)
  - ✅ Replaced with clean two-button approach in regular UI
  - ✅ "New Profile" button for manual creation
  - ✅ "Quick Start" button for Google auto-fill (only visible when signed in)

- [x] **Google Quick Start Feature** (Completed)
  - ✅ Auto-fills profile with Google account info (real data)
  - ✅ Auto-fills branded PromptBlocker placeholders (alias data)
  - ✅ Button hidden until user signs in (no confusing auth modals)
  - ✅ Seamless experience for first-time users

- [x] **Empty State Improvements** (Completed)
  - ✅ Clear "Create Profile" button in empty state
  - ✅ "Quick Start with Google" button in empty state
  - ✅ Both buttons available in header and empty state
  - ✅ Professional, intuitive UI

- [x] **Bug Fixes** (Completed)
  - ✅ Fixed inconsistent CSS for email/phone input fields
  - ✅ All form inputs now have consistent white backgrounds
  - ✅ Added `input[type="email"]` and `input[type="tel"]` to CSS selectors

**Deliverable:** ✅ Smooth onboarding that gets users to create first alias within 2 minutes

**Success Criteria:**
- ✅ Users can create profiles manually or with Google Quick Start
- ✅ Clear UI with no confusion about next steps
- ✅ Quick Start only appears when user is authenticated
- ✅ Professional, polished first impression

---

### 🧪 Phase 2B: Multi-Platform Testing (Week 3-4)
**Target Date:** November 9-15, 2024
**Status:** 📋 Planned
**Estimated Time:** 2-3 days

**Goal:** Verify all 7 AI platforms work correctly

**Current Status:**
- ✅ ChatGPT - Fully tested and working
- ⏳ Claude - Ready to test
- 🔄 Gemini - In Progress (DOM observer implemented, testing needed)
- ⏳ Perplexity - Ready to test
- ⏳ Poe - Ready to test
- ⏳ Copilot - Ready to test
- ⏳ You.com - Ready to test

**Testing Protocol (for each service):**
1. Visit service and create new conversation
2. Send test message: "My name is Greg Barker and email is greg@test.com"
3. Open Network tab → Verify request contains aliases ("John Smith", "john@example.com")
4. Verify response decoded correctly (shows original "Greg Barker")
5. Check Debug Console → Service name logged correctly
6. Check Stats tab → Service counter incremented
7. Test streaming responses (if applicable)
8. Document any issues or platform-specific quirks

**Implementation Tasks:**
- [x] **Gemini - Observer Infrastructure** (Completed 2025-11-02)
  - [x] Created DOM observer system
  - [x] Implemented MutationObserver for response text
  - [x] Updated endpoint detection: `/_/BardChatUi`
  - [x] Verified observer starts correctly
  - [ ] Debug alias fetching
  - [ ] Test end-to-end replacement
- [ ] Test Claude
- [ ] Test Perplexity
- [ ] Test Poe
- [ ] Test Copilot
- [ ] Test You.com
- [ ] Fix any service-specific issues found
- [ ] Update service detection patterns if needed
- [ ] Document compatibility matrix

**Deliverable:** Verified support for 7 AI platforms

**Success Criteria:**
- ✅ At least 5/7 services fully working
- ✅ Known issues documented for remaining platforms
- ✅ No critical bugs blocking core functionality
- ✅ Service detection accurate

---

### 🎨 Phase 2C: Prompt Templates (NEW - Week 4-5)
**Target Date:** November 16-22, 2024
**Status:** 📋 Planned
**Estimated Time:** 5-7 days

**Goal:** Add prompt template system for power users (PRO feature)

**Feature Overview:**
Save commonly used prompts with placeholders that auto-fill with alias data when sending to AI chats.

**Example Use Cases:**
- "Write a professional email from {{name}} at {{email}} about..."
- "Review this code as if you're {{job_title}} at {{company}}..."
- "Analyze this data for {{name}}'s research on..."

**Tier Structure:**
- **FREE:** 3 saved templates
- **PRO:** Unlimited templates + shared template library

**Implementation Tasks:**
- [ ] **Data Model** (Day 1)
  - Create `PromptTemplate` type
  - Template storage in chrome.storage.local
  - Placeholder syntax parser (`{{fieldName}}`)
  - Validation and sanitization

- [ ] **Template Manager UI** (Day 2-3)
  - Templates section in Settings or Features tab
  - Add/Edit/Delete templates modal
  - Template preview with filled placeholders
  - Organize templates (categories/tags optional)
  - Search/filter templates
  - Import/Export templates (JSON)

- [ ] **Chat Integration** (Day 3-4)
  - Inject template dropdown into AI chat input
  - Auto-fill placeholders when template selected
  - Support multiple profiles (choose which profile's data to use)
  - Keyboard shortcuts (optional)

- [ ] **PRO Feature Gating** (Day 5)
  - FREE tier: Show "3/3 templates" counter
  - Upgrade prompt when limit reached
  - PRO tier: No limits

- [ ] **Testing** (Day 6-7)
  - Test placeholder replacement
  - Test with all 7 AI platforms
  - Test template CRUD operations
  - Test FREE tier limits
  - Performance testing (large templates)

**Placeholder Fields Supported:**
- `{{name}}` - Real name
- `{{alias_name}}` - Alias name
- `{{email}}` - Real email
- `{{alias_email}}` - Alias email
- `{{phone}}` - Real phone
- `{{alias_phone}}` - Alias phone
- `{{address}}` - Real address
- `{{alias_address}}` - Alias address
- `{{company}}` - Company name
- `{{job_title}}` - Job title
- Custom fields (PRO)

**Deliverable:** Working prompt template system with FREE/PRO tiers

**Success Criteria:**
- ✅ Users can create and save templates
- ✅ Placeholders auto-fill correctly
- ✅ Works on all tested AI platforms
- ✅ FREE tier limited to 3 templates
- ✅ PRO tier offers unlimited templates
- ✅ Smooth UX (fast, intuitive)

---

### 💳 Phase 3: Payment Integration (MOVED - Week 6-7)
**Target Date:** November 23-30, 2024
**Status:** 📋 Planned - **LAST PRIORITY**
**Estimated Time:** 5-7 days

**Why Last:**
- Want everything perfect before asking for money
- Need to validate PRO features are actually valuable to users
- Better to have 100+ happy free users than rush monetization
- Payment adds complexity (support, refunds, billing issues)
- Can gate PRO features in UI now, enable payments when ready

**Payment Provider:** Stripe

**Pricing:**
- PRO: $4.99/month or $49/year (save 17%)
- Free trial: 7 days
- Cancel anytime

**Implementation Tasks:**
- [ ] **Set Up Stripe** (Day 1)
  - Create Stripe account
  - Create products and prices
  - Configure test mode
  - Get API keys

- [ ] **Checkout Flow** (Day 2-3)
  - Add "Upgrade to PRO" button in popup
  - Implement Stripe Checkout integration
  - Open checkout in new tab
  - Handle success/cancel redirects

- [ ] **Webhook Handler** (Day 4)
  - Create Firebase Cloud Function for webhook
  - Handle checkout.session.completed event
  - Update user tier in Firestore
  - Send confirmation email (optional)

- [ ] **Subscription Management** (Day 5)
  - Add "Manage Subscription" link
  - Open Stripe Customer Portal
  - Allow users to cancel/update payment

- [ ] **Testing** (Day 6-7)
  - Test checkout flow (test mode)
  - Test webhook handler
  - Test tier updates
  - Test subscription cancellation

**Deliverable:** Complete payment system with subscription management

**Success Criteria:**
- ✅ Users can purchase PRO subscription
- ✅ Tier updates automatically after payment
- ✅ Users can manage subscriptions
- ✅ Stripe webhooks processed correctly

**Cost:**
- Stripe fees: 2.9% + $0.30 per transaction
- Firebase Cloud Functions: $0 (free tier: 2M invocations/month)

---

### 🧪 Phase 4: Beta Testing (NEW - Week 4-5)
**Target Date:** December 7-21, 2024
**Status:** 📋 Planned
**Estimated Time:** 7-14 days

**Beta Program Setup:**
- [ ] **Community Infrastructure** (Day 1-2)
  - Create Discord server (channels: #announcements, #support, #bugs, #features)
  - Configure GitHub Issues with templates
  - Enable GitHub Discussions
  - Set up support email (support@promptblocker.com)

- [ ] **Recruit Beta Testers** (Day 3-4)
  - Post on Reddit (r/privacy, r/ChatGPT, r/chrome_extensions)
  - Post on Twitter/X
  - Post on Indie Hackers
  - Target: 10-20 beta testers

- [ ] **Beta Testing Period** (Day 5-14)
  - Distribute extension (private Chrome Web Store link)
  - Monitor Discord for bug reports
  - Track issues in GitHub
  - Fix critical bugs within 24 hours
  - Weekly check-ins with testers

- [ ] **Feedback Collection**
  - Create feedback form (Google Forms or Typeform)
  - Add in-app feedback button
  - Conduct user interviews (optional)

- [ ] **Compatibility Testing**
  - Test on Windows 10, 11
  - Test on macOS (Intel and Apple Silicon)
  - Test on Linux (Ubuntu)
  - Test on Chrome 120, 121, 122

**Deliverable:** Beta-tested extension with real-world validation

**Success Criteria:**
- ✅ 10+ beta testers actively using extension
- ✅ <5 critical bugs reported
- ✅ Works on all major OS (Windows, macOS, Linux)
- ✅ 80%+ positive feedback

---

### 🚀 Phase 5: CI/CD & Automation (NEW - Week 5-6)
**Target Date:** December 14-21, 2024
**Status:** 📋 Planned
**Estimated Time:** 3-5 days

**Automation Tasks:**
- [ ] **GitHub Actions Workflow** (Day 1-2)
  - Create test.yml workflow (run tests on push/PR)
  - Create build.yml workflow (build on tag)
  - Create deploy.yml workflow (upload to Chrome Web Store)
  - Add test coverage reporting (Codecov)

- [ ] **Chrome Web Store Automation** (Day 3)
  - Install chrome-webstore-upload package
  - Get Chrome Web Store API credentials
  - Configure automatic upload on tagged releases
  - Test deployment to test channel

- [ ] **Version Management** (Day 4)
  - Set up semantic versioning
  - Create CHANGELOG.md automation
  - Tag releases properly (v1.0.0, v1.1.0, etc.)

- [ ] **Documentation** (Day 5)
  - Document deployment process
  - Create release checklist
  - Update CONTRIBUTING.md with CI/CD info

**Deliverable:** Fully automated deployment pipeline

**Success Criteria:**
- ✅ Tests run automatically on every commit
- ✅ Builds deploy automatically on tagged releases
- ✅ No manual steps in deployment process

---

### 🎉 Phase 6: Chrome Web Store Launch (REVISED - Week 6-7)
**Target Date:** December 21-31, 2024
**Status:** 📋 Planned
**Estimated Time:** 5-7 days (includes review wait time)

**Pre-Launch Checklist:**
- [ ] **Chrome Web Store Developer Account** ($5 one-time fee)

- [ ] **Prepare Listing Assets** (Day 1-2)
  - Take 5 screenshots (1280x800 or 640x400)
    - Screenshot 1: Main popup with profile
    - Screenshot 2: Protection status badge (green)
    - Screenshot 3: Stats tab showing substitutions
    - Screenshot 4: Features hub (PRO features)
    - Screenshot 5: Settings tab
  - Create 3 promotional images:
    - Small: 440x280
    - Medium: 920x680
    - Large: 1400x560
  - Write compelling description (132 char summary + full description)
  - Add privacy policy link
  - Add support email

- [ ] **Final Testing** (Day 3)
  - Run full test suite
  - Manual testing on all supported services
  - Check for console errors
  - Verify PRO features properly gated

- [ ] **Submit for Review** (Day 4)
  - Upload extension package
  - Fill out store listing
  - Submit for review
  - Estimated review time: 1-5 days

- [ ] **Address Feedback** (Day 5-7)
  - Respond to any rejection feedback
  - Fix issues and resubmit if needed
  - Monitor review status

**Deliverable:** Live extension on Chrome Web Store 🎉

**Success Criteria:**
- ✅ Extension approved and published
- ✅ No critical bugs in first 48 hours
- ✅ 10+ installs in first week

---

## 🎁 v1.1.0 - Feature Expansion (REVISED)
**Target Date:** January 2025
**Status:** 📋 Planned

**Focus:** Unlock PRO tier features for paying users

**New Features:**
- [ ] **API Key Vault** (unlock for PRO users)
  - Real-time API key detection (OpenAI, Anthropic, Google, AWS, GitHub, Stripe)
  - Three redaction modes (full, partial, placeholder)
  - Automatic key storage and management

- [ ] **Custom Redaction Rules** (unlock for PRO users)
  - User-defined regex patterns
  - Built-in templates (SSN, credit cards, IPs, emails)
  - Priority-based rule ordering
  - Match highlighting and statistics

- [ ] **Alias Variations** (unlock for PRO users)
  - Auto-generate name variations ("John Smith" → "John", "Smith", "J. Smith")
  - Smart partial matching
  - Context-aware substitution

- [ ] **Payment Integration**
  - Stripe integration for subscription management
  - $4.99/month or $49/year pricing
  - 7-day free trial

- [ ] **Advanced Statistics**
  - Export activity logs (CSV, JSON)
  - Custom date ranges
  - Service-specific analytics
  - PII type breakdown

**Success Metrics:**
- 5% conversion rate (free → pro)
- $500 MRR by end of Q1 2025
- <2% churn rate

---

### 🔧 v1.2.0 - Platform Expansion
**Target Date:** January 2025
**Status:** 📋 Planned

**Focus:** Browser compatibility and feature refinement

**New Features:**
- [ ] **Firefox Support**
  - WebExtension API compatibility
  - Firefox Add-ons marketplace submission
  - Cross-browser testing suite

- [ ] **Edge Support** (optional)
  - Microsoft Edge compatibility
  - Edge Add-ons marketplace submission

- [ ] **Import/Export Profiles**
  - Backup profiles to encrypted file
  - Restore profiles from backup
  - Share profiles across devices (no cloud required)

- [ ] **Keyboard Shortcuts**
  - Quick enable/disable (Ctrl+Shift+P)
  - Toggle profiles (Ctrl+Shift+1-9)
  - Open popup (Ctrl+Shift+O)

- [ ] **UI Improvements**
  - Profile search/filter
  - Bulk profile operations
  - Compact mode for small screens

**Success Metrics:**
- 500+ total installs (Chrome + Firefox)
- 10% conversion rate
- 4.5+ star rating across platforms

---

### 🧠 v2.0.0 - Intelligent PII Detection
**Target Date:** Q2 2025
**Status:** 💡 Concept

**Focus:** AI-powered PII detection and learning

**Experimental Features:**
- [ ] **Pattern Learning**
  - Machine learning model for PII detection
  - Learn from user corrections
  - Suggest new alias variations automatically

- [ ] **Smart Context Detection**
  - Detect PII based on context, not just patterns
  - Reduce false positives
  - Handle ambiguous cases (e.g., "John" as name vs. common word)

- [ ] **Multi-Language Support**
  - Internationalization (i18n)
  - Support for non-English names and addresses
  - Locale-aware formatting

- [ ] **Team/Family Accounts**
  - Shared profile management
  - Organization-wide policies
  - Usage reporting for admins

**Research Questions:**
- Can we run ML models in a service worker?
- How to balance accuracy vs. privacy (local-only ML)?
- What's the user demand for team features?

---

## 🎨 Feature Backlog (Future Considerations)

### High Priority (User-Requested)
- [ ] **Whitelist/Blacklist Domains**
  - Allow users to exclude specific sites
  - "Safe mode" for banking/healthcare sites

- [ ] **Profile Templates**
  - Pre-made profiles for common use cases
  - One-click profile creation

- [ ] **Notification Preferences**
  - Granular control over notifications
  - Silent mode option

### Medium Priority (Nice-to-Have)
- [ ] **Sync Across Devices** (opt-in, encrypted)
  - Cloud storage for profiles (user-controlled key)
  - Automatic sync when signed in

- [ ] **Browser Integration**
  - Context menu shortcuts
  - Omnibox commands (type "pb" in address bar)

- [ ] **Advanced Redaction**
  - Image redaction (blur faces, text in images)
  - Voice/audio masking (for voice chat AI)

### Low Priority (Experimental)
- [ ] **Mobile Support**
  - iOS Safari extension (when iOS allows)
  - Android Chrome extension (future)

- [ ] **API for Developers**
  - Programmatic access to substitution engine
  - Integration with other privacy tools

---

## 🚫 What We Won't Do

**Privacy-Invasive Features:**
- ❌ Cloud sync without user-controlled encryption
- ❌ Analytics or usage tracking
- ❌ Selling user data (ever)

**Scope Creep:**
- ❌ Full VPN or proxy functionality (use dedicated VPN services)
- ❌ Password management (use dedicated password managers)
- ❌ General ad blocking (use uBlock Origin)

**Technical Limitations:**
- ❌ Support for Manifest V2 (deprecated by Chrome)
- ❌ Support for non-Chromium browsers (until WebExtension APIs stabilize)

---

## 📊 Growth Strategy

### Organic Growth (Primary)
1. **SEO-Optimized Listing**
   - Chrome Web Store optimization
   - Keyword targeting: "AI privacy", "ChatGPT privacy", "PII protection"

2. **Content Marketing**
   - Blog posts about AI privacy risks
   - Video tutorials on YouTube
   - Reddit posts in r/ChatGPT, r/privacy

3. **Word of Mouth**
   - Encourage users to share
   - Referral program (future)

### Paid Growth (Optional)
1. **Sponsored Content**
   - Tech YouTubers (privacy-focused)
   - Privacy blogs and newsletters

2. **Social Media Ads**
   - Target AI enthusiasts
   - Privacy-conscious users

### Partnership Opportunities
- Privacy advocacy organizations
- AI safety communities
- Open source projects

---

## 🎯 Success Metrics (12-Month Goals)

### User Acquisition
- **Installs:** 10,000+ (Chrome)
- **Active Users:** 5,000+ (DAU)
- **Retention:** 60%+ (30-day)

### Revenue (PRO Tier)
- **Conversion Rate:** 5-10% (free → pro)
- **MRR:** $2,000+ by month 12
- **ARR:** $24,000+ by end of year 1

### Quality
- **Rating:** 4.5+ stars (Chrome Web Store)
- **Reviews:** 100+ reviews
- **Support Response Time:** <24 hours

### Community
- **GitHub Stars:** 500+
- **Contributors:** 10+
- **Active Issues/PRs:** 20+

---

## 🤝 Contributing to the Roadmap

**Have ideas?** We'd love to hear from you!

**How to Suggest Features:**
1. Check existing [GitHub Issues](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues)
2. Search [GitHub Discussions](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/discussions)
3. Create a new feature request with:
   - **Problem:** What problem does this solve?
   - **Solution:** How would it work?
   - **Impact:** Who benefits and how much?

**Feature Prioritization:**
We prioritize based on:
1. **User demand** (number of requests)
2. **Impact** (how many users benefit)
3. **Effort** (development time required)
4. **Alignment** (fits our privacy-first mission)

---

## 📚 Resources

- **GitHub Repository:** https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension
- **Documentation:** See [docs/](./docs) folder
- **Privacy Policy:** [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)
- **Contributing Guide:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Architecture:** [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## 📅 Version History

| Version | Release Date | Status | Highlights |
|---------|-------------|--------|------------|
| 1.0.0 | Nov 2024 | 🔄 In Progress | Initial launch (free tier) |
| 1.1.0 | Dec 2024 | 📋 Planned | PRO features, payment integration |
| 1.2.0 | Jan 2025 | 📋 Planned | Firefox support, import/export |
| 2.0.0 | Q2 2025 | 💡 Concept | AI-powered detection, learning |

---

**This roadmap is a living document. We update it monthly based on user feedback, technical discoveries, and market changes.**

**Last Updated:** 2025-11-04
**Next Review:** 2025-12-01
