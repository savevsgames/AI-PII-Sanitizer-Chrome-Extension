# PromptBlocker - Product Roadmap

**Last Updated:** 2025-11-01
**Current Version:** 1.0.0 (Pre-Launch)

This roadmap outlines PromptBlocker's development journey, launch plan, and future vision.

---

## 🎯 Vision & Mission

**Vision:** Make privacy protection effortless for everyone using AI chat services.

**Mission:** Provide robust, transparent PII protection that requires zero technical knowledge while offering advanced features for power users.

**Core Values:**
- 🔒 **Privacy First:** Local-only processing, no data collection
- 🎯 **User-Centric:** Intuitive design, fail-safe defaults
- 🚀 **Open Source:** Transparent code, community-driven
- 💎 **Quality:** 98-100% test coverage on core logic

---

## 📅 Release Timeline

### ✅ Development Phase (Complete)
**Timeline:** October - November 2024
**Status:** ✅ Complete

**Major Milestones:**
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

### 🚀 v1.0.0 - Initial Launch (Current Focus)
**Target Date:** November 2024
**Status:** 🔄 In Progress

**Launch Checklist:**

#### Pre-Launch (Week 1)
- [x] Core features complete and tested
- [x] Documentation refactored (production-ready)
- [ ] Chrome Web Store listing prepared
- [ ] Screenshots taken (5 minimum)
- [ ] Promotional images created (3 sizes)
- [ ] Privacy policy finalized
- [ ] README polished

#### Launch (Week 2)
- [ ] Submit to Chrome Web Store
- [ ] Create launch announcement
- [ ] Set up GitHub Discussions
- [ ] Create product page (optional)
- [ ] Social media presence (optional)

#### Post-Launch (Week 3-4)
- [ ] Monitor initial user feedback
- [ ] Fix critical bugs (if any)
- [ ] Respond to reviews
- [ ] Create FAQ based on user questions
- [ ] Plan v1.1 features

**Free Tier Features (v1.0.0):**
- ✅ Identity aliasing (name, email, phone, address)
- ✅ Multiple profiles (unlimited)
- ✅ Multi-service support (ChatGPT, Claude, Gemini, Perplexity, Poe, Copilot, You.com)
- ✅ Local AES-256-GCM encryption
- ✅ Usage statistics and activity log
- ✅ Protection status badge
- ✅ Dark mode UI

**Success Metrics:**
- 100+ installs in first month
- 4+ star average rating
- <1% crash rate
- <5% uninstall rate

---

### 🎁 v1.1.0 - Pro Features Launch
**Target Date:** December 2024
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
