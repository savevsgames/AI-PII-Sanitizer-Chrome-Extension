# Launch Roadmap: Free → Users → PRO

## Philosophy

**Ship → Validate → Scale**

Don't build features no one uses. Get free tier perfect, share with devs, build trust, then add PRO features based on real user feedback.

---

## Phase 1: Profile Editor UI (Week 1)
**Goal:** Fix the UX gap - no more alert() dialogs

### Tasks
- [ ] Create modal component for Add/Edit profile
- [ ] Form with all PII fields (name, email, phone, address, etc.)
- [ ] Real-time validation (email format, phone format)
- [ ] Save/Cancel buttons
- [ ] Delete confirmation dialog
- [ ] Edit profile (click on existing profile)
- [ ] Empty states with helpful hints

### Success Criteria
- ✅ No more alert() boxes
- ✅ Professional-looking form
- ✅ Easy to add/edit profiles
- ✅ Obvious how to use it

**Time: 3-4 days**

---

## Phase 2: Production Polish (Week 2)
**Goal:** Chrome Web Store ready, trustworthy appearance

### 2A. Visual Assets
- [ ] **Professional icons** (16, 48, 128, 512px)
  - Shield + lock motif
  - Clean, recognizable at 16px
  - Consistent with privacy/security theme
  - Tools: Figma (free) or AI generator

- [ ] **Screenshots for store** (1280x800 or 640x400)
  - Screenshot 1: Popup showing profile management
  - Screenshot 2: ChatGPT with substitution in action (network tab)
  - Screenshot 3: Stats showing "5 items protected"
  - Screenshot 4: Minimal mode
  - Screenshot 5: Debug console with activity log
  - Add annotations with arrows/text

- [ ] **Promotional tile** (440x280 - optional but recommended)
  - Eye-catching graphic
  - Tagline: "Protect Your Privacy in AI Chats"

### 2B. Legal Documents
- [ ] **Privacy Policy** (REQUIRED)
  - What data we collect (profiles, stats)
  - How we use it (local substitution only)
  - Where it's stored (chrome.storage.local, encrypted)
  - User rights (access, export, delete)
  - Contact: privacy@yourextension.com
  - Host on GitHub Pages or yourextension.com/privacy

- [ ] **Terms of Service** (recommended)
  - Acceptance of terms
  - User responsibilities
  - Limitation of liability
  - Governing law

### 2C. Code Cleanup
- [ ] Remove debug console.logs (or make conditional on debugMode)
- [ ] Add production error handling (graceful failures)
- [ ] Add user-facing error messages (not just console errors)
- [ ] Test error states (network failure, storage full, etc.)
- [ ] Final security audit (no hardcoded keys, proper CSP)

### 2D. Store Listing
- [ ] **Extension name:** Pick one (see naming section below)
- [ ] **Short description** (132 chars max)
  - "Protect your personal information when using ChatGPT, Claude, and other AI tools with automatic PII substitution."

- [ ] **Detailed description**
  - What it does
  - How it works
  - Privacy promise (local-only, no servers)
  - Why you need it (examples of PII leaks)
  - How to use (3 simple steps)

- [ ] **Category:** Productivity / Privacy
- [ ] **Permissions justification** (already documented)

### Success Criteria
- ✅ Looks professional in Chrome Web Store
- ✅ Users trust it (privacy policy visible)
- ✅ No crashes or errors in production
- ✅ All legal boxes checked

**Time: 5-7 days**

---

## Phase 3: API Key Vault (Week 3-4)
**Goal:** Build PRO tier revenue engine (even if free for now)

### Tasks (from feature_api_key_vault.md)
- [ ] Build APIKeyDetector class
- [ ] Integrate with serviceWorker
- [ ] Auto-detect common key formats (OpenAI, GitHub, AWS, Stripe)
- [ ] Vault UI in Settings tab
- [ ] Add/delete keys
- [ ] Stats tracking ("47 keys protected this month")
- [ ] Warn-first mode (dialog before sending)

### Success Criteria
- ✅ Detects OpenAI keys in error logs
- ✅ Shows warning before sending
- ✅ User can proceed or cancel
- ✅ Stats show protection count

**Time: 1 week**

**Note:** Launch as FREE initially, use as proof-of-concept for PRO tier later

---

## Phase 4: Service Testing (Week 5)
**Goal:** Verify all 7 AI services work correctly

### Test Matrix

| Service | Domain | Test | Status |
|---------|--------|------|--------|
| ChatGPT | chatgpt.com | Send PII, verify substitution | ✅ Tested |
| Claude | claude.ai | Send PII, verify substitution | ⏳ Ready |
| Gemini | gemini.google.com | Send PII, verify substitution | ⏳ Ready |
| Perplexity | perplexity.ai | Send PII, verify substitution | ⏳ Ready |
| Poe | poe.com | Send PII, verify substitution | ⏳ Ready |
| Copilot | copilot.microsoft.com | Send PII, verify substitution | ⏳ Ready |
| You.com | you.com | Send PII, verify substitution | ⏳ Ready |

### For Each Service
1. Visit service
2. Create new conversation
3. Send: "My name is Greg Barker and email is greg@test.com"
4. Open Network tab → Check request has "John Smith" and "john@example.com"
5. Verify response decoded correctly (shows "Greg Barker")
6. Check Debug Console → Service name logged correctly
7. Check Stats → Service counter incremented

### Known Issues to Fix
- [ ] Service detection might fail on some (URL pattern wrong)
- [ ] Request format might differ (need new extractAllText handler)
- [ ] Streaming responses might not work on all

### Success Criteria
- ✅ At least 3 services fully working (ChatGPT + 2 others)
- ✅ Known issues documented for rest
- ✅ No blocking bugs

**Time: 2-3 days of manual testing**

---

## Phase 5: Image Scanning (Week 6+)
**Goal:** Add PRO killer feature (but only after users validate core product)

**SKIP FOR INITIAL LAUNCH**

Build this only if:
- We have 100+ users requesting it
- We have revenue to justify 1-week dev time
- Core product is stable and trusted

---

## Launch Strategy

### Pre-Launch (Week 1-2)
**While building profile editor + production polish:**

1. **Pick a name** (see naming section)
2. **Create landing page** (simple GitHub Pages)
3. **Set up social accounts**
   - Twitter: @YourExtensionName
   - Discord server (optional)
4. **Create demo video** (2-3 minutes)
   - Loom screen recording
   - Show ChatGPT substitution in action
   - Show stats updating

### Launch Week (Week 3)
**After production polish complete:**

1. **Submit to Chrome Web Store** (takes 1-7 days for review)
2. **While waiting for approval:**
   - Post on Hacker News "Show HN: I built a Chrome extension to protect PII in ChatGPT"
   - Share on Reddit r/ChatGPT, r/privacy, r/programming
   - Tweet with demo video
3. **After approval:**
   - Update all posts with Chrome Web Store link
   - Post on Product Hunt
   - Email dev friends for reviews

### Week 1 Goals
- 100 installs
- 10 Chrome Web Store reviews
- 1 tech blog mention

### Month 1 Goals
- 1,000 installs
- 50 reviews (4.5+ stars)
- Identify top 3 feature requests
- Validate PRO tier pricing ($4.99/mo)

---

## Naming Options

**Criteria:**
- Easy to spell
- Memorable
- Privacy/security connotation
- Not trademarked
- .com domain available

**Current:** AI PII Sanitizer ❓
- Pro: Descriptive, SEO-friendly
- Con: Boring, hard to say, "sanitizer" feels clinical

**Alternatives:**

1. **PrivacyShield** 🛡️
   - Clean, professional
   - Easy to remember
   - Shield = protection metaphor

2. **Alias Guard**
   - Explains the mechanism (aliases)
   - Guard = protection

3. **Incognito AI**
   - Familiar term (Chrome incognito)
   - Short and catchy

4. **ShadowChat** 🌙
   - Cool name
   - Implies hidden identity
   - Con: Sounds sketchy?

5. **IdentityVeil**
   - Sophisticated
   - Veil = covering real identity

6. **Keep It Private** (KIP)
   - Friendly, approachable
   - Acronym: KIP

7. **BlurID**
   - Simple, modern
   - ID = identity

8. **SafePrompt**
   - What you do (make prompts safe)
   - Easy to understand

**My recommendation:** **PrivacyShield** or **SafePrompt**
- Both available as .com domains (last I checked)
- Professional sounding
- Easy to explain to non-technical users
- Good for SEO

---

## Production Checklist

### Code Quality
- [ ] No console.log in production (unless debugMode)
- [ ] All errors caught and handled gracefully
- [ ] User-facing error messages (not "undefined is not a function")
- [ ] No TODO comments left in code
- [ ] All TypeScript errors fixed
- [ ] Code formatted consistently (Prettier)

### Security
- [ ] No hardcoded API keys or secrets
- [ ] Encryption keys derived securely
- [ ] CSP (Content Security Policy) configured
- [ ] No eval() or unsafe-inline scripts
- [ ] Permissions minimal (only what's needed)

### Privacy
- [ ] Privacy Policy published and linked
- [ ] No data sent to external servers
- [ ] No analytics/tracking (or opt-in only)
- [ ] Clear data on uninstall
- [ ] Export functionality works

### UX
- [ ] No alert() dialogs (use modals)
- [ ] Loading states for async operations
- [ ] Empty states with helpful hints
- [ ] Error states with recovery actions
- [ ] Consistent styling
- [ ] Responsive to different screen sizes

### Testing
- [ ] Works on ChatGPT ✅
- [ ] Works on Claude
- [ ] Works on Gemini
- [ ] Edge cases tested (no profiles, network errors, etc.)
- [ ] Profile CRUD all works
- [ ] Stats accurate
- [ ] Export/import works

### Legal
- [ ] Privacy Policy written and hosted
- [ ] Terms of Service written
- [ ] Permissions justified in store listing
- [ ] No trademark violations
- [ ] Compliant with Chrome Web Store policies

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **1. Profile Editor** | 3-4 days | Professional modal UI, no more alerts |
| **2. Production Polish** | 5-7 days | Icons, privacy policy, Chrome Web Store ready |
| **3. API Key Vault** | 1 week | PRO feature built (free initially) |
| **4. Service Testing** | 2-3 days | Verify 7 services work |
| **5. Image Scanning** | SKIP | Build later based on user feedback |

**Total: ~3 weeks to launch-ready**

---

## Success Metrics

### Week 1
- ✅ Chrome Web Store approved
- ✅ 100 installs
- ✅ 10 reviews
- ✅ 0 crash reports

### Month 1
- ✅ 1,000 installs
- ✅ 50 reviews (4.5+ stars)
- ✅ Featured on 1 tech blog
- ✅ 3 user feature requests identified

### Month 3
- ✅ 10,000 installs
- ✅ 100+ reviews (4.5+ stars)
- ✅ Chrome Web Store Featured badge
- ✅ Launch PRO tier ($4.99/mo)
- ✅ 100 PRO signups (1% conversion)

### Month 6
- ✅ 50,000 installs
- ✅ 500 PRO users ($2,500 MRR)
- ✅ 3 enterprise customers ($10k ARR)
- ✅ Break even on costs

---

## Key Decisions Needed

### 1. Name
Pick one and commit. Changing later is painful.

**Vote:**
- [ ] Keep "AI PII Sanitizer"
- [ ] PrivacyShield
- [ ] SafePrompt
- [ ] Other: __________

### 2. Domain
Register yourname.com for landing page

### 3. Support Email
Set up support@yourname.com (or use Gmail alias)

### 4. Pricing (decide now, launch later)
- Free: Basic PII protection (name, email, phone)
- PRO: API key vault + advanced PII + analytics ($4.99/mo)
- Enterprise: Team management + SSO (custom pricing)

**Alternative:** Launch 100% free, add PRO tier after 1,000 users validate the product.

---

## What Happens Next?

**I'll start with Phase 1: Profile Editor UI**

This is the quickest win - 3-4 days to build:
1. Modal component
2. Form with validation
3. Edit/delete functionality
4. Empty states

Then we move to production polish (icons, privacy policy, etc.)

Sound good? Want me to start building the profile editor modal now?
