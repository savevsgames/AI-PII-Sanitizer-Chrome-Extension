# PromptBlocker - Product Roadmap (REVISED)

**Last Updated:** 2025-11-01
**Current Version:** 0.9.0 (Pre-Alpha - Not Production Ready)
**Status:** 🚨 **SECURITY AUDIT COMPLETE - CRITICAL ISSUES IDENTIFIED**

⚠️ **IMPORTANT:** This roadmap has been revised based on comprehensive security audit findings. See [SECURITY_AUDIT.md](./docs/SECURITY_AUDIT.md) for full details.

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

## 🚨 Critical Security Findings

**Security Audit Date:** 2025-11-01
**Risk Level:** 🔴 HIGH - Not production-ready

### Blocking Issues (Must Fix Before Launch):
1. ❌ **XSS Vulnerabilities** - 52 innerHTML assignments without consistent escaping
2. ❌ **localStorage Usage** - Should use chrome.storage.local exclusively
3. ❌ **No Authentication** - Users can fake PRO tier locally
4. ❌ **No Payment System** - Cannot monetize or enforce PRO features
5. ❌ **Weak Encryption Key** - Uses predictable extension ID
6. ❌ **No External Testing** - Only tested on developer's machine
7. ❌ **No Community Infrastructure** - No Discord, support, or feedback system
8. ❌ **No CI/CD Pipeline** - Manual deployments, no automation

**Full Report:** See [docs/SECURITY_AUDIT.md](./docs/SECURITY_AUDIT.md)

---

## 📅 REVISED Release Timeline

### ✅ Phase 0: Development Phase (Complete)
**Timeline:** October - November 2024
**Status:** ✅ Complete

**Achievements:**
- [x] Chrome Extension Manifest V3 architecture
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

### 🔒 Phase 1: Security Hardening (NEW - Week 1)
**Target Date:** November 8-15, 2024
**Status:** 🚧 **CURRENT PRIORITY**
**Estimated Time:** 5-7 days

**Critical Security Fixes:**
- [ ] **Fix XSS Vulnerabilities** (P0 - 1-2 days)
  - Audit all 52 innerHTML assignments
  - Apply escapeHtml() consistently
  - Add XSS prevention tests
  - Create ESLint rule to prevent raw innerHTML

- [ ] **Replace localStorage** (P0 - 2 hours)
  - Replace all localStorage with chrome.storage.local
  - Add ESLint rule to ban localStorage usage

- [ ] **Improve Encryption** (P1 - 4 hours)
  - Generate per-user random encryption keys
  - Store keys in chrome.storage.local
  - Update key derivation to use user-specific data

- [ ] **Add Input Validation** (P2 - 4 hours)
  - Validate email, phone, address formats
  - Prevent ReDoS attacks in custom patterns
  - Add max length limits

- [ ] **Sanitize Debug Logs** (P3 - 2 hours)
  - Remove PII from console.log statements
  - Use DEBUG_MODE flag consistently

**Deliverable:** Security-hardened codebase ready for beta testing

**Success Criteria:**
- ✅ No XSS vulnerabilities in audit
- ✅ No localStorage usage in codebase
- ✅ All security tests passing
- ✅ External security review (optional but recommended)

---

### 🔐 Phase 2: Authentication & User Management (NEW - Week 2-3)
**Target Date:** November 15-30, 2024
**Status:** 📋 Planned
**Estimated Time:** 7-10 days

**Infrastructure Decision:** Firebase Authentication (Recommended)

**Why Firebase:**
- Fast implementation (5-7 days vs 10-14 days self-hosted)
- Scales automatically
- $0 infrastructure cost initially (free tier: 50k MAU)
- Built-in OAuth (Google, GitHub, Email)
- Secure by default

**Implementation Tasks:**
- [ ] **Set Up Firebase Project** (Day 1)
  - Create Firebase project
  - Configure authentication providers (Google, Email)
  - Set up Firestore database
  - Configure security rules

- [ ] **Implement Auth Flow** (Day 2-4)
  - Add login/signup UI in popup
  - Integrate Firebase Auth SDK
  - Handle OAuth flows (Google sign-in)
  - Store auth state in chrome.storage.local
  - Add logout functionality

- [ ] **Tier Verification** (Day 5-6)
  - Create users collection in Firestore
  - Store tier info (free/pro) per user
  - Implement checkPROFeature() function
  - Add upgrade prompts for PRO features

- [ ] **User Profile Management** (Day 7)
  - Display user email/name in popup
  - Show current tier (free/pro)
  - Add account settings page

- [ ] **Testing** (Day 8-9)
  - Test login/logout flows
  - Test tier verification
  - Test offline behavior
  - Handle auth errors gracefully

**Deliverable:** Working authentication system with free/PRO tier enforcement

**Success Criteria:**
- ✅ Users can sign up and log in
- ✅ Tier info synced from Firestore
- ✅ PRO features properly gated
- ✅ Auth persists across browser restarts

**Cost:** $0/month (free tier sufficient for first 1,000 users)

---

### 💳 Phase 3: Payment Integration (NEW - Week 3-4)
**Target Date:** November 30 - December 7, 2024
**Status:** 📋 Planned
**Estimated Time:** 5-7 days

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

**Last Updated:** 2025-11-01
**Next Review:** 2025-12-01
