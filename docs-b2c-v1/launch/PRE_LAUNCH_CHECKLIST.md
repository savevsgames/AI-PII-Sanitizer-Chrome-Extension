# Pre-Launch Checklist - Chrome Web Store

**Branch:** `features/launch_readiness`
**Last Updated:** 2025-11-03
**Target:** Chrome Web Store Submission

---

## 🎯 Launch Strategy Decision

### Option A: FREE-ONLY Launch (RECOMMENDED)
**Timeline:** 2-3 weeks to launch
**Complexity:** Low
**Risk:** Low

Launch with **FREE tier only**, no payments, no PRO features yet:
- ✅ Simpler legal requirements (just Privacy Policy)
- ✅ Faster to market
- ✅ Get user feedback before monetizing
- ✅ Validate product-market fit
- ✅ Build user base organically
- ⏸️ Add payments later (v1.1.0) after validation

### Option B: FREE + PRO Launch
**Timeline:** 5-7 weeks to launch
**Complexity:** High
**Risk:** Medium

Launch with full FREE/PRO tiers and payment system:
- ⚠️ Requires Stripe integration (5-7 days)
- ⚠️ Requires Terms of Service
- ⚠️ Requires customer support infrastructure
- ⚠️ More complex testing
- ⚠️ Refund policy needed

---

## ✅ CURRENT STATUS

### What You Have (Already Done)
- ✅ **Privacy Policy** - Exists (PRIVACY_POLICY.md) - needs review/updates
- ✅ **Icons** - Exist (16, 48, 128) in `src/assets/icons/` - old, need redesign
- ✅ **5 Working Platforms** - ChatGPT, Claude, Gemini, Perplexity, Copilot
- ✅ **289/289 Tests Passing** - Comprehensive test coverage
- ✅ **Firebase Auth** - Google Sign-In working
- ✅ **User Profiles** - Firestore integration complete
- ✅ **Clean Codebase** - Professional organization

### What You Need (Before Launch)
- ✅ **Terms of Service** ✅ COMPLETED (January 10, 2025)
- ✅ **Privacy Policy** ✅ UPDATED (corrected false information)
- ✅ **GDPR Compliance** ✅ COMPLETED (data export + account deletion)
- ✅ **Permission Justifications** ✅ DOCUMENTED
- ✅ **Security Hardening - XSS** ✅ COMPLETED (DOMPurify + full audit)
- ✅ **Security Hardening - Encryption** ✅ COMPLETED (PBKDF2 600k iterations)
- ❌ **New Icons** - 16, 48, 128, 512 (current ones are old)
- ❌ **Chrome Web Store Screenshots** - 3-5 high-quality images (1280x800 or 640x400)
- ❌ **Store Listing Copy** - Title, short description, full description
- ❌ **Promotional Tile** - 440x280 (required) + optional 920x680, 1400x560
- ❌ **Developer Account** - $5 one-time fee
- ❌ **Cross-Browser Testing** - Chrome, Edge, Brave
- ❌ **Website Copy** - For promptblocker.com
- ❌ **Stripe Integration** - Only if Option B
- ⏳ **Memory Leak Fixes** - 147 event listeners (1 of 8 launch blockers remaining)

---

## 📋 RECOMMENDED PATH: Option A (FREE Launch)

### Phase 1: Documentation & Legal (Week 1)
**Estimated Time:** 2-3 days

#### 1.1 Privacy Policy Review ✏️
**Status:** Exists, needs updates
**File:** `PRIVACY_POLICY.md`
**Tasks:**
- [ ] Review current content for accuracy
- [ ] Update "Last Updated" date
- [ ] Add Chrome Web Store specific language
- [ ] Verify GDPR/CCPA compliance
- [ ] Add contact information
- [ ] Remove any PRO tier mentions (for FREE-only launch)
- [ ] Host on promptblocker.com/privacy

**Current Issues to Fix:**
- Says "AI PII Sanitizer" - should say "PromptBlocker"
- Has placeholder contact info (`[YOUR_SUPPORT_EMAIL]`)
- May reference features not in FREE tier

#### 1.2 Terms of Service (SKIP for FREE Launch)
**Status:** ❌ Not needed for FREE-only launch
**Reason:** Only required if collecting payments

---

### Phase 2: Visual Assets (Week 1-2)
**Estimated Time:** 3-5 days

#### 2.1 Extension Icons (REQUIRED) 🎨
**Status:** Old icons exist, need redesign
**Current:** `src/assets/icons/` (icon16.png, icon48.png, icon128.png)
**Required Sizes:**
- ✅ 16x16 (toolbar, favicon)
- ✅ 48x48 (extension management page)
- ✅ 128x128 (Chrome Web Store, installation)
- ❌ 512x512 (Chrome Web Store marketing tile base - NEW)

**Design Requirements:**
- Simple, recognizable at small sizes
- Represents "privacy/protection" concept
- Matches PromptBlocker brand
- Professional quality
- Transparent background (PNG)

**Suggestions:**
- Shield icon with lock
- Mask/anonymity symbol
- Privacy-focused design
- Consider: 🛡️ 🔒 🎭 concepts

#### 2.2 Chrome Web Store Screenshots (REQUIRED) 📸
**Status:** ❌ Not created yet
**Required:** 3-5 screenshots (1280x800 or 640x400 recommended)
**Format:** PNG or JPEG

**Screenshot Ideas:**
1. **Main popup with profile** - Show profile management UI
2. **Protection status** - Green badge showing "Protected"
3. **Stats dashboard** - Show activity log and statistics
4. **Profile creation** - Show add/edit profile modal
5. **Features hub** - Show API Key Vault or Custom Rules

**Tips:**
- Use clean test data (no real PII!)
- Show extension working on popular platform (ChatGPT)
- Highlight key features visually
- Use annotations/callouts for clarity
- Professional, polished appearance

#### 2.3 Promotional Images (REQUIRED) 🖼️
**Status:** ❌ Not created yet
**Required Sizes:**
- ✅ Small: 440x280 (REQUIRED)
- ⏸️ Marquee: 1400x560 (optional)
- ⏸️ Tile: 920x680 (optional)

**Content Ideas for 440x280:**
- Extension logo/icon
- Tagline: "Protect Your Privacy in AI Chats"
- Key benefit: "5 Platforms. 0 PII Shared."
- Call to action: "Free & Open Source"

#### 2.4 Promotional Video (OPTIONAL) 🎥
**Status:** ❌ Not created
**Recommendation:** Skip for initial launch, add later
**Reason:** Nice-to-have, not required, time-consuming

---

### Phase 3: Store Listing Copy (Week 2)
**Estimated Time:** 1-2 days

#### 3.1 Extension Name
**Current:** "AI PII Sanitizer"
**Recommended:** "PromptBlocker - AI Privacy Protection"
**Character Limit:** 45 characters
**Requirements:**
- Unique (check Chrome Web Store for conflicts)
- Descriptive
- SEO-friendly keywords

#### 3.2 Short Description (REQUIRED)
**Character Limit:** 132 characters
**Purpose:** Appears in search results

**Draft:**
```
Protect your privacy: Replace real names, emails, and PII with aliases when chatting with ChatGPT, Claude, Gemini, and more.
```
(131 characters)

#### 3.3 Full Description (REQUIRED)
**Character Limit:** 16,384 characters
**Purpose:** Main store page

**Structure:**
```markdown
# What is PromptBlocker?

PromptBlocker protects your personal information when using AI chat services. Replace your real name, email, phone, and address with aliases before sending prompts to ChatGPT, Claude, Gemini, Perplexity, and Copilot.

## Key Features

✅ **5 Supported Platforms**
- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Gemini (gemini.google.com)
- Perplexity (perplexity.ai)
- Microsoft Copilot (copilot.microsoft.com)

🔒 **Privacy-First Design**
- All data stored locally (never sent to servers)
- AES-256-GCM encryption
- No analytics or tracking
- Open source & transparent

🎯 **Smart Substitution**
- Create unlimited profiles
- Automatic bidirectional replacement
- Real PII shown in responses
- Activity logging and stats

## How It Works

1. Create a profile with your real info and fake aliases
2. Visit any supported AI chat platform
3. Type prompts normally - your PII is automatically replaced
4. AI sees aliases, you see real information

## Perfect For

- Privacy-conscious users
- Developers testing prompts
- Researchers sharing examples
- Anyone who values their data

## 100% Free & Open Source

No hidden costs, no data collection, no subscriptions.

---

**Support:** github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension
**Privacy Policy:** promptblocker.com/privacy
```

#### 3.4 Permission Justifications
**Required:** Explain why each permission is needed

**Permissions Used:**
- `storage` - Store encrypted profiles locally
- `activeTab` - Inject protection scripts on AI platforms
- `scripting` - Run content scripts for request interception
- Host permissions (chatgpt.com, claude.ai, etc.) - Access supported platforms

**Justification Text:**
```
PromptBlocker requires the following permissions to protect your privacy:

• Storage: Save encrypted identity profiles on your device (never sent to servers)
• Active Tab: Detect when you're on supported AI platforms
• Scripting: Inject privacy protection scripts on AI chat pages
• Host Permissions: Access ChatGPT, Claude, Gemini, Perplexity, and Copilot to replace PII before requests are sent

All data stays on your device. We never collect, transmit, or access your personal information.
```

---

### Phase 4: Testing & Quality Assurance (Week 2-3)
**Estimated Time:** 3-5 days

#### 4.1 Security Hardening (FROM ROADMAP PHASE 1)
**Status:** ⚠️ Required before launch
**Reference:** ROADMAP.md Phase 1

**Critical Fixes:**
- [ ] Fix XSS vulnerabilities (audit 52 innerHTML assignments)
- [ ] Replace localStorage with chrome.storage.local
- [ ] Improve encryption key generation
- [ ] Add input validation
- [ ] Sanitize debug logs

**Estimated Time:** 5-7 days (per roadmap)
**Priority:** P0 (blocking launch)

#### 4.2 Cross-Browser Testing
**Browsers to Test:**
- [ ] Chrome (primary - latest stable)
- [ ] Microsoft Edge (Chromium-based, ~99% compatible)
- [ ] Brave (Chromium-based, ~98% compatible)

**Test Checklist (per browser):**
- [ ] Extension loads without errors
- [ ] All 5 platforms work correctly
- [ ] Profile creation/editing works
- [ ] PII substitution verified (network tab)
- [ ] Stats tracking works
- [ ] UI renders correctly
- [ ] No console errors

#### 4.3 Final QA Checklist
- [ ] All 289 tests passing
- [ ] No console errors on any platform
- [ ] Privacy Policy reviewed and accurate
- [ ] All placeholder text replaced
- [ ] Icons display correctly at all sizes
- [ ] Screenshots show real functionality
- [ ] Store listing copy proofread
- [ ] Contact information added everywhere
- [ ] GitHub repository public and up-to-date

---

### Phase 5: Chrome Web Store Submission (Week 3)
**Estimated Time:** 1-2 days (+ review time)

#### 5.1 Developer Account Setup
**Cost:** $5 one-time fee
**URL:** https://chrome.google.com/webstore/devconsole

**Steps:**
- [ ] Create Google account (if needed)
- [ ] Pay $5 developer registration fee
- [ ] Verify identity

#### 5.2 Upload Extension
**Required Files:**
- [ ] Extension package (.zip of dist/ folder)
- [ ] Icons (16, 48, 128, 512)
- [ ] Screenshots (3-5 images)
- [ ] Promotional tile (440x280)
- [ ] Privacy Policy URL

**Steps:**
- [ ] Build production version: `npm run build`
- [ ] Zip dist/ folder
- [ ] Upload to Chrome Web Store
- [ ] Fill in all listing details
- [ ] Add screenshots and promotional images
- [ ] Submit for review

#### 5.3 Review Process
**Timeline:** 1-3 days (typically)
**Possible Outcomes:**
- ✅ Approved - Extension goes live!
- ⚠️ Rejected - Fix issues and resubmit

**Common Rejection Reasons:**
- Missing permission justifications
- Unclear privacy policy
- Low-quality screenshots
- Functionality doesn't match description

---

## 🌐 Website Requirements (promptblocker.com)

### Minimum Viable Website
**Required Pages:**
- `/` - Landing page with extension overview
- `/privacy` - Privacy Policy (host PRIVACY_POLICY.md)
- `/support` - Contact/support information

### Landing Page Copy Structure
```markdown
# PromptBlocker
## Protect Your Privacy in AI Chats

**Headline:** Stop sharing your personal information with AI chatbots

**Subheadline:** PromptBlocker automatically replaces your real name, email, phone, and address with aliases when using ChatGPT, Claude, Gemini, and more.

**CTA:** [Download Free] (links to Chrome Web Store)

---

### Features
- 🔒 Privacy-First (local storage, encrypted, no tracking)
- 🎯 5 Supported Platforms (ChatGPT, Claude, Gemini, Perplexity, Copilot)
- 📊 Smart Substitution (bidirectional, automatic, transparent)
- 🆓 100% Free & Open Source

### How It Works
[3-step visual guide]

### Supported Platforms
[Logos/icons of 5 platforms]

### Testimonials
[Future: User reviews from Chrome Web Store]

### FAQ
- Is it really free? Yes!
- Does it work on mobile? Not yet (desktop only)
- Is my data safe? Yes (local only, encrypted, open source)

---

**Footer:**
- Privacy Policy
- GitHub
- Support
- Chrome Web Store
```

---

## 📊 Timeline Summary

### Option A: FREE-Only Launch (RECOMMENDED)

| Phase | Tasks | Time | Dependencies |
|-------|-------|------|--------------|
| **Phase 1: Security Hardening** | XSS fixes, localStorage removal | 5-7 days | ROADMAP Phase 1 (blocking!) |
| **Phase 2: Documentation** | Privacy Policy review | 1 day | None |
| **Phase 3: Visual Assets** | Icons, screenshots, promo tile | 3-5 days | None (can parallel) |
| **Phase 4: Store Listing** | Copy, descriptions, justifications | 1-2 days | Phase 2, 3 |
| **Phase 5: Testing** | Cross-browser, QA | 2-3 days | Phase 1 complete |
| **Phase 6: Submission** | Developer account, upload | 1 day | All above complete |
| **Phase 7: Review** | Chrome Web Store review | 1-3 days | Submitted |

**Total Timeline:** 14-23 days (2-3 weeks)

**Critical Path:**
1. Security hardening (must finish first)
2. Visual assets (can work in parallel)
3. Everything else (sequential after 1 & 2)

---

## 🚨 Blocking Issues (Must Fix Before Launch)

### From ROADMAP Phase 1 (Security Hardening)
1. **XSS Vulnerabilities** - 52 innerHTML assignments need escapeHtml()
2. **localStorage Usage** - Replace with chrome.storage.local
3. **Weak Encryption** - Improve key generation

**Status:** ⚠️ NOT DONE - this blocks launch!
**Priority:** P0 (highest)
**Estimated Time:** 5-7 days

---

## ✅ Next Actions (In Order)

1. **Decide Launch Strategy**
   - [ ] Option A (FREE-only) or Option B (FREE+PRO)?
   - Recommendation: Option A for faster launch

2. **Complete Security Hardening** (ROADMAP Phase 1)
   - [ ] Fix XSS vulnerabilities
   - [ ] Remove localStorage
   - [ ] Improve encryption
   - **This must be done first!**

3. **Create Visual Assets** (parallel with security)
   - [ ] Design new icons (16, 48, 128, 512)
   - [ ] Create 3-5 screenshots
   - [ ] Design promotional tile (440x280)

4. **Review Privacy Policy**
   - [ ] Update branding to PromptBlocker
   - [ ] Add contact information
   - [ ] Remove PRO tier references (if FREE-only)
   - [ ] Host on promptblocker.com/privacy

5. **Write Store Listing Copy**
   - [ ] Short description (132 chars)
   - [ ] Full description
   - [ ] Permission justifications

6. **Cross-Browser Testing**
   - [ ] Chrome
   - [ ] Edge
   - [ ] Brave

7. **Create Developer Account**
   - [ ] Pay $5 fee
   - [ ] Verify identity

8. **Submit to Chrome Web Store**
   - [ ] Upload extension + assets
   - [ ] Fill in listing details
   - [ ] Submit for review

---

## 💰 Costs

| Item | Cost | When |
|------|------|------|
| Chrome Web Store Developer | $5 one-time | Before submission |
| Domain (promptblocker.com) | ~$12/year | If not owned |
| Hosting (static site) | $0 (GitHub Pages/Netlify) | Free tier |
| **Total (minimum)** | **$5-17** | One-time + annual |

---

## 📚 Resources

**Chrome Web Store:**
- Developer Dashboard: https://chrome.google.com/webstore/devconsole
- Developer Program Policies: https://developer.chrome.com/docs/webstore/program-policies/
- Best Practices: https://developer.chrome.com/docs/webstore/best-practices/

**Design Resources:**
- Icon Generator: https://www.favicon-generator.org/
- Screenshot Tools: Built-in (Windows: Win+Shift+S, Mac: Cmd+Shift+4)
- Image Resizing: https://www.iloveimg.com/resize-image

**Legal Templates:**
- Privacy Policy Generator: https://www.privacypolicygenerator.info/
- Terms of Service Generator: https://www.termsofservicegenerator.net/

---

**Last Updated:** 2025-11-03
**Status:** Planning Phase
**Target Launch:** Q1 2025 (after security hardening)
