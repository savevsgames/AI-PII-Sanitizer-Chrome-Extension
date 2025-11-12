# Chrome Web Store Submission Guide

**Extension Name:** Prompt Blocker
**Version:** 0.1.0
**Developer:** Greg Barker / savevsgames
**Website:** https://promptblocker.com

---

## Single Purpose Description

**Single Purpose:** Protect users' personally identifiable information (PII) by automatically substituting real data with aliases when using AI chat services, and converting responses back to real information.

**How It Works:**
1. User creates identity profiles with real PII and corresponding aliases
2. Extension intercepts requests to AI services (ChatGPT, Claude, Gemini, etc.)
3. Real PII is replaced with aliases before sending to AI
4. AI responses are decoded (aliases → real PII) for user's understanding
5. All data encrypted locally using AES-256-GCM with Firebase UID as key material

---

## Permission Justifications

Chrome Web Store requires detailed justification for all requested permissions. Below are the justifications for each permission in our `manifest.json`:

### 1. `storage`
**Purpose:** Store encrypted identity profiles and configuration settings locally on the user's device.

**Justification:**
- Core functionality requires saving user-created profiles (real PII + aliases)
- Settings (enabled/disabled state, protected domains, theme preferences) must persist
- Activity logs for debugging and statistics
- All data is encrypted using AES-256-GCM before storage
- Without `storage`, users would lose all profiles when browser closes

**Data Stored:**
- Encrypted identity profiles (names, emails, phone numbers, addresses, company names, aliases)
- Configuration settings (extension enabled state, notification preferences, protected domains)
- Activity logs (timestamps, URLs, substitution counts)

**Privacy:** All data remains local and encrypted. Never transmitted to external servers.

---

### 2. `unlimitedStorage`
**Purpose:** Allow users to create large profile databases without hitting Chrome's 10MB storage quota.

**Justification:**
- Users may create dozens of profiles with extensive PII fields
- Activity logs can grow over time (capped at 100 entries, but entries include detailed metadata)
- Profile statistics and usage data accumulate
- Enterprise users may need 50+ profiles for different contexts
- Without `unlimitedStorage`, users would hit quota and lose ability to create new profiles

**Privacy:** All data remains encrypted and local. No cloud transmission.

---

### 3. `activeTab`
**Purpose:** Inject content scripts into AI service pages to enable PII substitution and show protection status.

**Justification:**
- Content script must run on AI service pages (chatgpt.com, claude.ai, etc.) to intercept requests
- Shows "You Are Protected" toast notification when user visits protected AI service
- Provides visual feedback (badge) indicating protection status
- Only activates on AI service domains (see `host_permissions`)
- Without `activeTab`, extension cannot provide protection or feedback

**Privacy:** Content script only runs on AI service domains. Does not access other tabs.

---

### 4. `scripting`
**Purpose:** Programmatically inject JavaScript into AI service pages to intercept and modify network requests.

**Justification:**
- Core functionality requires intercepting AI chat requests before they're sent
- Must inject code to replace real PII with aliases in request payloads
- Required to inject scripts into tabs that were open before extension was installed
- Used during extension updates to re-inject scripts without requiring page reload
- Without `scripting`, extension cannot perform substitutions

**How Used:**
- `chrome.scripting.executeScript()` to inject content scripts into existing tabs
- Only targets AI service domains (chatgpt.com, claude.ai, gemini.google.com, etc.)
- Scripts are sandboxed and limited to DOM manipulation + network interception

**Privacy:** Scripts only run on AI service pages. Do not access unrelated websites.

---

### 5. `tabs`
**Purpose:** Monitor tab navigation to AI services and update protection status badge.

**Justification:**
- Extension needs to know when user navigates to an AI service to update badge ("Protected" / "Unprotected")
- Detects when user switches tabs to update badge for current tab
- Detects when AI service pages finish loading to inject content scripts
- Required to reload AI service tabs after extension updates (better UX than manual refresh)
- Without `tabs`, badge would show incorrect status and users wouldn't know if protected

**Data Accessed:**
- Tab URL (only to check if it's an AI service domain)
- Tab ID (to update correct badge)
- Tab loading status (to inject scripts at correct time)

**Privacy:** Only reads URLs to check domain. Does not access page content or track browsing history.

---

### 6. `identity`
**Purpose:** Enable Google/Microsoft OAuth sign-in for user authentication.

**Justification:**
- Extension encrypts all data using user's Firebase UID as key material
- Users must authenticate to derive encryption key (true key separation)
- Provides secure sign-in without storing passwords locally
- Required for `chrome.identity.launchWebAuthFlow()` (OAuth redirect flow)
- Without `identity`, users cannot sign in and data remains locked/inaccessible

**How Used:**
- Launches OAuth flow when user clicks "Sign in with Google" or "Sign in with Microsoft"
- Retrieves authentication token from provider (Google/Microsoft)
- Exchanges token with Firebase for user credentials
- Does NOT access user's Google account data beyond email/name

**Privacy:** Only authenticates user. Does not access Gmail, Drive, or other Google services.

---

### 7. `host_permissions`
**Purpose:** Access AI service domains to intercept requests and perform PII substitutions.

**Justification:**
Without host permissions for these specific domains, the extension cannot function. Each domain is necessary:

#### `https://chat.openai.com/*` & `https://chatgpt.com/*`
- **Reason:** ChatGPT interface (OpenAI uses both domains)
- **Access:** Intercept chat API requests to `/backend-api/conversation`
- **Required for:** PII substitution in ChatGPT prompts

#### `https://claude.ai/*`
- **Reason:** Claude AI chat interface (Anthropic)
- **Access:** Intercept chat API requests to `/api/organizations/.../chat_conversations`
- **Required for:** PII substitution in Claude prompts

#### `https://gemini.google.com/*`
- **Reason:** Google Gemini chat interface
- **Access:** Intercept chat API requests to Gemini backend
- **Required for:** PII substitution in Gemini prompts

#### `https://perplexity.ai/*` & `https://*.perplexity.ai/*`
- **Reason:** Perplexity AI search/chat interface
- **Access:** Intercept API requests to Perplexity backend
- **Required for:** PII substitution in Perplexity prompts
- **Wildcard (`*`)**: Perplexity uses subdomains (www, labs, etc.)

#### `https://copilot.microsoft.com/*`
- **Reason:** Microsoft Copilot chat interface
- **Access:** Intercept API requests to Copilot backend
- **Required for:** PII substitution in Copilot prompts

#### `https://*.bing.com/*`
- **Reason:** Copilot backend infrastructure (uses Bing domain)
- **Access:** Intercept API requests from Copilot (routed through Bing)
- **Required for:** Complete Copilot support
- **Wildcard (`*`)**: Bing uses subdomains (www, chat, edgeservices, etc.)

**Privacy:**
- Extension ONLY intercepts API requests (chat prompts/responses)
- Does NOT access user's browsing history on these domains
- Does NOT read page content beyond chat interfaces
- Does NOT track user activity outside these domains

**Data Handling:**
- Reads outgoing chat requests to find PII matches
- Modifies request body to replace PII with aliases
- Reads incoming chat responses to decode aliases back to real PII
- Does NOT store or transmit chat conversations

---

## Limited Use Disclosure

**Chrome's "Limited Use" Policy requires that extensions:**
1. Only request permissions necessary for core functionality
2. Clearly disclose how user data is used
3. Not collect data beyond stated purpose
4. Not sell or share user data

**Our Compliance:**

### ✅ Minimal Permissions
We only request permissions absolutely necessary for PII protection:
- `storage` + `unlimitedStorage`: Store encrypted profiles
- `activeTab` + `scripting` + `tabs`: Inject substitution code
- `identity`: Authenticate users for encryption
- `host_permissions`: Access AI services for interception

**No excessive permissions requested:**
- ❌ No `<all_urls>` (only specific AI domains)
- ❌ No `webRequest` / `webRequestBlocking` (uses content script interception instead)
- ❌ No `cookies`, `history`, `bookmarks`, `downloads`
- ❌ No `clipboardRead`, `geolocation`, `notifications`

### ✅ Clear Data Disclosure
- Privacy Policy clearly states data collection (authentication, encrypted profiles)
- Terms of Service detail acceptable use and user rights
- Popup UI shows exactly what data is stored (profiles list)
- Users can export all data as JSON

### ✅ Purpose Limitation
- Data is ONLY used for PII substitution (core purpose)
- No analytics, telemetry, or tracking
- No advertising or monetization of user data
- Premium features (optional) are subscription-based, not data-based

### ✅ No Selling/Sharing
- User data is NEVER sold to third parties
- User data is NEVER shared with advertisers
- Only third-party data sharing:
  - Firebase (encrypted profiles, authentication) - infrastructure provider
  - Stripe (payment info) - payment processor only
- Both Firebase and Stripe have strict privacy policies

---

## Data Handling and Privacy

### What Data We Collect
1. **Authentication Data** (Firebase)
   - Email address (from OAuth provider)
   - Firebase User ID (UID)
   - Authentication provider (Google, GitHub, Microsoft)

2. **User-Created Data** (Local, Encrypted)
   - Identity profiles (real PII + aliases)
   - Configuration settings
   - Activity logs (timestamps, URLs, substitution counts)

3. **Payment Data** (Stripe - Premium Only)
   - Billing information
   - Payment method
   - Purchase history

### What We Do NOT Collect
- ❌ Browsing history
- ❌ AI chat conversations
- ❌ Analytics or telemetry
- ❌ Device information
- ❌ Location data
- ❌ Contacts or social connections

### How Data Is Stored
- **Local Storage:** Encrypted with AES-256-GCM using Firebase UID as key material
- **Cloud Storage:** Firebase Authentication (auth state), optional Firestore backups (premium)
- **True Key Separation:** Encrypted data local, key material (UID) remote

### User Controls
- **Access:** View all profiles and settings in extension popup
- **Modify:** Edit profiles anytime
- **Delete:** Remove individual profiles or delete entire account
- **Export:** Download all data as JSON
- **Disable:** Turn off protection temporarily or permanently

---

## Chrome Web Store Policy Compliance Checklist

### ✅ Single Purpose
- [ ] Extension has ONE clear purpose: Protect PII in AI chats
- [ ] All features directly support this purpose
- [ ] No unrelated features (no games, shopping, toolbars, etc.)

### ✅ User Disclosure
- [ ] Privacy Policy clearly explains data collection
- [ ] Terms of Service explain user rights and limitations
- [ ] Permission justifications documented (this file)
- [ ] Popup UI clearly shows protection status

### ✅ Limited Use
- [ ] Minimal permissions requested
- [ ] No excessive host permissions
- [ ] No selling/sharing user data
- [ ] Data only used for stated purpose

### ✅ Data Handling
- [ ] User data encrypted before storage
- [ ] No tracking or analytics
- [ ] Users can export/delete data
- [ ] GDPR and CCPA compliant

### ✅ Content Security
- [ ] Manifest V3 (latest security standards)
- [ ] No remote code execution
- [ ] No inline scripts in HTML
- [ ] Content Security Policy enforced

### ✅ Branding
- [ ] Clear extension name ("Prompt Blocker")
- [ ] Professional icons (16px, 48px, 128px)
- [ ] Accurate description
- [ ] Screenshots showing functionality

---

## Store Listing Details

### Short Description (132 char max)
```
Protect your privacy in AI chats by automatically replacing real info with aliases. Works with ChatGPT, Claude, Gemini & more.
```

### Full Description
```
🔒 Protect Your Privacy in AI Chats

Prompt Blocker automatically replaces your real personally identifiable information (PII) with aliases when using AI chat services, ensuring your privacy while getting the personalized responses you need.

✨ HOW IT WORKS
1. Create identity profiles with your real info and corresponding aliases
2. Chat normally with AI services (ChatGPT, Claude, Gemini, etc.)
3. Extension automatically substitutes real PII with aliases before sending
4. Responses are decoded back to real info for your understanding
5. All data encrypted locally using military-grade AES-256-GCM encryption

🛡️ FEATURES
✓ Real-time PII substitution (names, emails, phone numbers, addresses, company names)
✓ Support for multiple identity profiles
✓ Works with ChatGPT, Claude, Gemini, Perplexity, Copilot, Poe, You.com
✓ End-to-end encryption with Firebase authentication
✓ Activity logs show what was protected and when
✓ Dark mode support
✓ Export/import profiles as JSON
✓ Open source (AGPL-3.0) - audit the code yourself!

🔐 PRIVACY & SECURITY
• All data encrypted using AES-256-GCM
• True key separation (encrypted data local, key material remote)
• No analytics or tracking
• Never sell or share your data
• GDPR and CCPA compliant

🎯 SUPPORTED AI SERVICES
• ChatGPT (OpenAI)
• Claude (Anthropic)
• Gemini (Google)
• Perplexity AI
• Microsoft Copilot
• Poe
• You.com

📖 OPEN SOURCE
Review the source code, report issues, or contribute:
https://github.com/savevsgames/prompt-blocker

📄 PRIVACY & TERMS
• Privacy Policy: [included in extension]
• Terms of Service: [included in extension]

💼 PREMIUM FEATURES (Coming Soon)
• Cloud sync across devices
• Unlimited profiles
• Advanced custom rules
• Priority support

🆓 FREE FOREVER
Core protection features are 100% free, no trial period, no credit card required.

---

Need help? Visit https://promptblocker.com or email support@promptblocker.com
```

### Category
**Productivity** (Primary)

### Language
English (United States)

### Icons
- 16x16: `icons/icon16.png`
- 48x48: `icons/icon48.png`
- 128x128: `icons/icon128.png`

### Screenshots (5 required)
1. **Main popup** - Showing profile list and protection status
2. **Profile editor** - Creating/editing identity profile with PII fields
3. **Settings tab** - Configuration options and theme selector
4. **Activity log** - Showing substitution history
5. **Features hub** - Overview of available features

### Promo Images (Optional but Recommended)
- Small tile: 440x280
- Marquee: 1400x560

---

## Pre-Submission Checklist

Before uploading to Chrome Web Store:

### Code Quality
- [ ] All tests passing (run `npm test`)
- [ ] No console errors in production build
- [ ] Source maps disabled in production (`NODE_ENV=production`)
- [ ] Bundle size optimized (<10MB target)
- [ ] No hardcoded secrets or API keys

### Security
- [ ] XSS vulnerabilities fixed (escapeHtml used everywhere)
- [ ] PBKDF2 iterations increased to 600,000
- [ ] Memory leaks fixed (all event listeners cleaned up)
- [ ] Content Security Policy configured
- [ ] Firebase security rules configured

### Compliance
- [ ] Privacy Policy accurate and complete
- [ ] Terms of Service complete
- [ ] Permission justifications documented (this file)
- [ ] GDPR data deletion implemented
- [ ] CCPA compliance verified

### Documentation
- [ ] README.md updated with accurate info
- [ ] CHANGELOG.md includes version history
- [ ] License file present (AGPL-3.0)
- [ ] Third-party licenses documented

### Testing
- [ ] Manual testing on Chrome (latest version)
- [ ] Test all AI services (ChatGPT, Claude, Gemini, etc.)
- [ ] Test authentication flow (Google, Microsoft)
- [ ] Test profile creation, editing, deletion
- [ ] Test export/import functionality
- [ ] Test dark mode / light mode
- [ ] Test with no profiles (edge case)
- [ ] Test with 50+ profiles (performance)

### Store Listing
- [ ] Screenshots captured (5 images)
- [ ] Icons validated (16, 48, 128px)
- [ ] Description written (short + full)
- [ ] Category selected (Productivity)
- [ ] Privacy Policy URL provided
- [ ] Support URL provided (https://promptblocker.com)

---

## Post-Submission Monitoring

After submission, monitor for:

### Review Feedback
- Chrome Web Store team may request changes
- Common issues:
  - Permission justifications unclear
  - Privacy Policy incomplete
  - Single Purpose violation
  - Excessive permissions

### User Feedback
- Monitor reviews and ratings
- Respond to support emails
- Track GitHub issues
- Update documentation based on common questions

### Performance Metrics
- Daily active users (DAU)
- Install/uninstall rates
- Crash reports (if any)
- User retention

---

**Prepared by:** Greg Barker / Save Vs Games
**Date:** January 10, 2025
**Version:** 1.0
