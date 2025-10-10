# Launch Roadmap: Free → Users → PRO

## Philosophy

**Ship → Validate → Scale**

Don't build features no one uses. Get free tier perfect, share with devs, build trust, then add PRO features based on real user feedback.

---

## Phase 1: Profile Editor UI ✅ COMPLETED
**Goal:** Fix the UX gap - no more alert() dialogs

### Tasks
- [x] Create modal component for Add/Edit profile
- [x] Form with all PII fields (name, email, phone, address, etc.)
- [x] Real-time validation (email format, phone format)
- [x] Save/Cancel buttons
- [x] Delete confirmation dialog
- [x] Edit profile (click on existing profile)
- [x] Empty states with helpful hints

### Success Criteria
- ✅ No more alert() boxes
- ✅ Professional-looking form
- ✅ Easy to add/edit profiles
- ✅ Obvious how to use it

**Time: Completed January 2025**

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
- [x] **Privacy Policy** (REQUIRED) ✅ COMPLETED
  - What data we collect (profiles, stats)
  - How we use it (local substitution only)
  - Where it's stored (chrome.storage.local, encrypted)
  - User rights (access, export, delete)
  - Contact: GitHub Issues
  - Created: `PRIVACY_POLICY.md` and `privacy-policy.html`
  - **TODO:** Host on GitHub Pages and update manifest.json

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

## Phase 3: API Key Vault (Week 3-4) 🚧 IN PROGRESS
**Goal:** Build FREE + PRO tier feature (10 keys FREE, unlimited PRO)

### Tiers
- **FREE:** 10 stored keys max, OpenAI detection only
- **PRO:** Unlimited keys, all detection patterns (GitHub, AWS, Stripe, etc.)

### Tasks (from feature_api_key_vault.md)
- [x] Build APIKeyDetector class ✅ Created
- [x] Add types to types.ts ✅ Completed
- [ ] Integrate with serviceWorker (auto-redact mode)
- [ ] Auto-detect common key formats (OpenAI, GitHub, AWS, Stripe)
- [ ] Vault UI in Settings tab with FREE tier counter (e.g., "3/10 FREE")
- [ ] Add/delete keys
- [ ] Stats tracking ("47 keys protected this month")
- [ ] Warn-first mode (dialog before sending)
- [ ] Upgrade prompt when FREE limit reached

### Completed
- Created `src/lib/apiKeyDetector.ts` with:
  - Pattern matching for OpenAI, Anthropic, Google, AWS, GitHub, Stripe
  - Generic hex/base64 detection (opt-in)
  - Custom pattern support
  - Redaction modes: full, partial, placeholder
- Added types: `APIKey`, `APIKeyFormat`, `APIKeyVaultConfig`
- Updated `UserConfig` to include optional `apiKeyVault` field

### UI plan & next steps (proposal)

- Surface API Key Vault under Settings → Features → "API Keys" (recommended). This avoids crowding top-level tabs while keeping features discoverable via a features submenu.
- Add a compact card in the main popup summarizing vault state (ON/OFF, X/10 FREE) with a link to the full Settings page.
- Implement Add/Edit/Delete modals for keys with format auto-detection and preview (masking in UI by default).
- Implement warn-first dialog flow: content script displays modal when keys are detected and sends user decision back to background (accept/redact/send anyway). This requires message plumbing between content script and service worker and a small modal UI component in the page context (or content script overlay).
- Add unit tests for detection and redact behavior and an integration e2e test for the warn-first flow (Playwright) before enabling warn-first by default.

### Impact considerations

- Stats & storage: Each key must track protectionCount and lastUsed; the Stats dashboard must be extended to show keys-protected by type.
- UX scalability: If we add many feature pages, use a single "Features" menu with feature pages as submenu items instead of adding top-level tabs for each feature. This keeps the popup compact and allows grouping (Security, Productivity, Integrations).
- Permissions & privacy: Keep all key data encrypted at rest and never transmitted. Warn users clearly when enabling auto-detection for "generic" patterns (may cause false positives).


### Success Criteria
- ⏳ Detects OpenAI keys in error logs
- ⏳ Shows warning before sending
- ⏳ User can proceed or cancel
- ⏳ Stats show protection count
- ⏳ FREE tier shows "X/10" counter
- ⏳ Upgrade prompt appears at limit

**Time: 1 week (foundation complete, integration pending)**

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

## Phase 5: Alias Variations (Week 6)
**Goal:** Automatically detect and replace name/email/phone format variations

### Tasks (from feature_alias_variations.md)
- [ ] Build AliasVariationGenerator class
- [ ] Auto-generate variations for names (GregBarker, gregbarker, gbarker, G.Barker)
- [ ] Auto-generate email variations (greg@test.com, greg.barker@test.com)
- [ ] Auto-generate phone format variations ((555) 123-4567, 555-123-4567, 5551234567)
- [ ] UI for showing generated variations
- [ ] Allow users to add custom variations
- [ ] Integrate with aliasEngine.ts buildLookupMaps()
- [ ] FREE tier: Auto-generated + 10 custom variations total
- [ ] PRO tier: Auto-generated + 100+ custom variations

### Success Criteria
- ✅ Detects "Greg Barker" and "GregBarker" and "gbarker"
- ✅ Detects email variations automatically
- ✅ Users can add custom variations (nicknames, abbreviations)
- ✅ FREE tier shows "5/10 custom variations" counter
- ✅ PRO tier offers AI-powered variation suggestions

**Time: 3-4 days**

---

## Phase 6: Dev Terms Spell Check (Week 7)
**Goal:** Catch typos in company names and tech terms before sending

### Tasks (from feature_dev_terms_spellcheck.md)
- [ ] Build DevTermsSpellChecker class
- [ ] Create curated dictionary (OpenAI, ChatGPT, Anthropic, Claude, Google, etc.)
- [ ] FREE tier: 50 curated terms + 10 custom terms
- [ ] PRO tier: 500+ curated terms + 100 custom terms, editable lists
- [ ] Build modal UI for showing suggestions (diff-style)
- [ ] Integrate with inject.js (intercept before fetch)
- [ ] Accept/Ignore buttons
- [ ] Performance: in-memory Map, <200ms check time
- [ ] Option to disable per-chat or globally

### Success Criteria
- ✅ Detects "openIA" and suggests "OpenAI"
- ✅ Shows diff modal before sending
- ✅ User can accept or ignore suggestions
- ✅ Performance: <200ms for typical message
- ✅ FREE tier shows "using 50 curated terms" message
- ✅ PRO tier allows editing the dictionary

**Time: 4-5 days**

---

## Phase 7: AI Profile Fill (Week 8-9)
**Goal:** Let users generate fake profiles using the current AI chat (ChatGPT/Claude/Gemini)

### Tasks (from feature_ai_profile_fill.md)
- [ ] Build AIProfileGenerator class
- [ ] Create service-specific prompts (ChatGPT, Claude, Gemini)
- [ ] Build consent modal UI ("We'll send a message to generate a profile - OK?")
- [ ] Implement ChatGPTInjector, ClaudeInjector, GeminiInjector
- [ ] Parse JSON response with fallback extraction
- [ ] Pre-fill alias form fields with generated data
- [ ] Optional: Delete the generation message after
- [ ] Add "AI Generate" button to Add/Edit Profile modal
- [ ] 100% transparent approach (user sees the message in chat)

### Success Criteria
- ✅ User clicks "AI Generate Alias" in ChatGPT
- ✅ Extension shows consent modal
- ✅ Message appears in chat: "Generate a fake identity..."
- ✅ Response parsed and fields pre-filled
- ✅ User can edit before saving
- ✅ Works on ChatGPT, Claude, and Gemini
- ✅ Optional message deletion works

**Time: 1-2 weeks (most complex feature)**

---

## Phase 8: Image Scanning (Future/PRO)
**Goal:** Add PRO killer feature (but only after users validate core product)

**SKIP FOR INITIAL LAUNCH**

Build this only if:
- We have 100+ users requesting it
- We have revenue to justify 1-week dev time
- Core product is stable and trusted

---

## Browser Compatibility

### Overview
AI PII Sanitizer is built for Chrome using Manifest V3. Expansion to other browsers follows this priority:

### Tier 1: Chromium Browsers (95-100% Compatible)
| Browser | Compatibility | Effort | Notes |
|---------|---------------|--------|-------|
| **Chrome** | 100% ✅ | 0 days | Primary development platform |
| **Edge** | 99% ✅ | 0.5 days | Microsoft's Chromium fork, nearly identical API |
| **Opera** | 98% ✅ | 0.5 days | Built on Chromium, minor UI differences |
| **Brave** | 98% ✅ | 0.5 days | Privacy-focused Chromium, perfect audience fit |

**Strategy:** Minimal testing, submit to each store with same codebase.

### Tier 2: Firefox (70-80% Compatible)
| Browser | Compatibility | Effort | Notes |
|---------|---------------|--------|-------|
| **Firefox** | 75% ⚠️ | 1-2 weeks | Uses WebExtensions API (similar but different) |

**Key Differences:**
- `chrome.*` → `browser.*` namespace
- Manifest V3 support (added in Firefox 109+)
- Content script injection timing differences
- Storage API mostly compatible but quota limits differ

**Strategy:** Create Firefox-specific build with polyfills, test on 3-4 sites initially.

### Tier 3: Safari (60-70% Compatible)
| Browser | Compatibility | Effort | Notes |
|---------|---------------|--------|-------|
| **Safari** | 60% ⚠️ | 3-4 weeks | Requires Xcode conversion + Apple Developer account ($99/year) |

**Key Challenges:**
- Must convert to Safari Web Extension format using Xcode
- Requires macOS for development and testing
- App Store submission process (1-2 weeks review)
- Some APIs limited or unavailable (e.g., declarativeNetRequest)
- Different security model (more restrictive CSP)

**Strategy:** Build only after 10,000+ Chrome installs and proven revenue.

### Tier 4: Mobile Browsers (20-30% Compatible)
| Platform | Compatibility | Effort | Notes |
|----------|---------------|--------|-------|
| **Chrome Android** | 30% ⚠️ | 2-3 months | Very limited extension support, would need separate app |
| **Firefox Android** | 40% ⚠️ | 2-3 months | Better extension support than Chrome, but still limited |
| **Safari iOS** | 20% ⚠️ | 3-4 months | Requires native iOS app wrapper, different architecture |

**Strategy:** Skip mobile until product-market fit proven on desktop. Consider native apps (React Native) if there's strong demand.

### Launch Priority
1. **Phase 1 (Months 1-3):** Chrome only
2. **Phase 2 (Month 4):** Edge, Opera, Brave (easy wins, same codebase)
3. **Phase 3 (Month 6+):** Firefox (if 5,000+ Chrome installs)
4. **Phase 4 (Month 12+):** Safari (if 10,000+ installs + $99/year justified)
5. **Phase 5 (Year 2+):** Mobile (if 50,000+ desktop installs)

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
| **1. Profile Editor** ✅ | 3-4 days | Professional modal UI, no more alerts |
| **2. Production Polish** | 5-7 days | Icons, privacy policy, Chrome Web Store ready |
| **3. API Key Vault** 🚧 | 1 week | FREE (10 keys) + PRO (unlimited) tiers |
| **4. Service Testing** | 2-3 days | Verify 7 services work |
| **5. Alias Variations** | 3-4 days | Auto-generate name/email/phone variations |
| **6. Dev Terms Spell Check** | 4-5 days | Catch company name typos before sending |
| **7. AI Profile Fill** | 1-2 weeks | Generate fake profiles using AI chat |
| **8. Image Scanning** | SKIP | Build later based on user feedback |

**Core Launch (Phases 1-4): ~3 weeks**
**Enhanced Features (Phases 5-7): +3-4 weeks**
**Total to full feature set: ~6-7 weeks**

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
- [ ] Other: PromptBlocker.com

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
