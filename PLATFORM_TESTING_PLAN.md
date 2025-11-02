# Platform Testing Plan - PromptBlocker Extension

**Testing Lead:** Greg
**Test Phase:** Pre-Launch Platform Verification
**Goal:** Verify all 7 claimed platforms work correctly with PII protection

---

## Testing Order (Priority)

1. ✅ **ChatGPT** - Confirmed Working
2. ✅ **Claude** - Confirmed Working
3. 🔄 **Gemini** - Next to test
4. ⏳ **Perplexity** - Queued
5. ⏳ **Poe** - Queued
6. ⏳ **Copilot** - Queued
7. ⏳ **You.com** - Queued

---

## Test Environment Setup

**Before Each Test:**
- [ ] Extension loaded and enabled
- [ ] Account created/logged in for platform
- [ ] DevTools open (Console + Network tabs)
- [ ] Test profile with PII aliases configured
- [ ] Screenshot tool ready for documentation

**Test PII Data:**
```
Name: John Doe
Email: john.doe@example.com
Phone: (555) 123-4567
Address: 123 Main Street, Springfield
SSN: 123-45-6789
Credit Card: 4532-1234-5678-9010
API Key: sk-proj-1234567890abcdefghijklmnop
```

---

## Platform 1: ChatGPT ✅

**Status:** ✅ CONFIRMED WORKING
**Last Tested:** [Previous testing sessions]
**Tester:** Greg

### Platform Details
- **URL:** https://chatgpt.com (primary), https://chat.openai.com (legacy)
- **API Endpoint:** `api.openai.com`, `backend-api/conversation`
- **Request Type:** REST (fetch)

### Test Results
- ✅ Extension loads
- ✅ "You are protected" toast appears
- ✅ API requests intercepted
- ✅ PII replaced with aliases in requests
- ✅ Aliases reversed in responses
- ✅ Statistics tracked correctly
- ✅ API key detection works

**Notes:** Production-ready, extensively tested.

---

## Platform 2: Claude ✅

**Status:** ✅ CONFIRMED WORKING
**Last Tested:** [Previous testing sessions]
**Tester:** Greg

### Platform Details
- **URL:** https://claude.ai
- **API Endpoint:** `claude.ai/api/organizations`
- **Request Type:** REST (fetch)

### Test Results
- ✅ Extension loads
- ✅ "You are protected" toast appears
- ✅ API requests intercepted
- ✅ PII replaced with aliases in requests
- ✅ Aliases reversed in responses
- ✅ Statistics tracked correctly
- ✅ API key detection works

**Notes:** Production-ready, extensively tested.

---

## Platform 3: Gemini 🔄

**Status:** 🔄 TESTING IN PROGRESS
**Testing Date:** _____________
**Tester:** Greg

### Platform Details
- **URL:** https://gemini.google.com
- **API Endpoint:** `gemini.google.com/api` (unverified)
- **Alternative Endpoint:** `generativelanguage.googleapis.com` (possible)
- **Request Type:** REST (fetch) - assumed

### Pre-Test Checklist
- [ ] Gemini account created/accessible
- [ ] Extension loaded and active
- [ ] DevTools console open
- [ ] DevTools Network tab recording

### Test Steps

**1. Extension Injection**
- [ ] Visit https://gemini.google.com
- [ ] Check console for: `🛡️ AI PII Sanitizer: Loading...`
- [ ] Verify toast: "You are protected" appears
- [ ] Screenshot: `gemini_01_injection.png`

**2. API Endpoint Verification**
- [ ] Send test message: "Hello, my name is John Doe"
- [ ] Check console for: `🔒 AI PII Sanitizer: Intercepting [URL]`
- [ ] Note actual API endpoint in Network tab: ___________________________
- [ ] Screenshot: `gemini_02_network.png`

**3. Request Interception**
- [ ] Find intercepted request in Network tab
- [ ] Click request → Payload tab
- [ ] Verify payload contains alias (e.g., "my name is [ALIAS]")
- [ ] Screenshot: `gemini_03_request_payload.png`

**4. Response Processing**
- [ ] Check Gemini's response in chat
- [ ] Verify real name appears (not alias)
- [ ] Check console for response processing logs
- [ ] Screenshot: `gemini_04_response.png`

**5. Statistics Tracking**
- [ ] Open extension popup
- [ ] Navigate to Activity Log / Stats
- [ ] Verify "Gemini" shows 1+ request
- [ ] Verify substitutions counted
- [ ] Screenshot: `gemini_05_stats.png`

**6. API Key Detection (if applicable)**
- [ ] Send message with API key: "My API key is sk-proj-test123"
- [ ] Verify warning modal appears
- [ ] Test all three options (Block, Key Only, Allow All)
- [ ] Screenshot: `gemini_06_api_key.png`

**7. Complex PII Test**
- [ ] Send comprehensive PII message:
  ```
  My name is John Doe, email john.doe@example.com,
  phone (555) 123-4567, living at 123 Main Street.
  SSN: 123-45-6789, card 4532-1234-5678-9010
  ```
- [ ] Verify all PII replaced in request
- [ ] Verify all PII restored in response
- [ ] Screenshot: `gemini_07_complex_pii.png`

### Issues Encountered

**Issue 1:** _______________________________________________
- **Severity:** [ ] Critical [ ] Major [ ] Minor
- **Description:**
- **Workaround:**
- **Fix Required:**

**Issue 2:** _______________________________________________
- **Severity:** [ ] Critical [ ] Major [ ] Minor
- **Description:**
- **Workaround:**
- **Fix Required:**

### Test Results Summary

**Overall Status:** [ ] ✅ PASS [ ] ⚠️ PARTIAL [ ] ❌ FAIL

**Working Features:**
- [ ] Extension injection
- [ ] Toast notification
- [ ] API interception
- [ ] Request PII substitution
- [ ] Response PII restoration
- [ ] Statistics tracking
- [ ] API key detection

**Broken/Missing:**
- [ ] _______________________________________________
- [ ] _______________________________________________

**Notes:** _________________________________________________

---

## Platform 4: Perplexity ⏳

**Status:** ⏳ NOT STARTED
**Testing Date:** _____________
**Tester:** Greg

### Platform Details
- **URL:** https://perplexity.ai
- **API Endpoint:** `perplexity.ai/socket.io`, `perplexity.ai/api`
- **Request Type:** ⚠️ **Socket.IO + REST** (WebSocket component)

### ⚠️ Special Considerations
- **WebSocket Usage:** Perplexity may use Socket.IO for real-time communication
- **Fetch Interceptor Limitation:** Our current implementation only intercepts `fetch()` calls
- **Potential Issue:** Socket.IO messages might bypass our interception
- **Fix Required:** May need WebSocket interception layer

### Pre-Test Checklist
- [ ] Perplexity account created
- [ ] Extension loaded
- [ ] DevTools console open
- [ ] DevTools Network + WS tabs open

### Test Steps
(Same as Gemini test steps, plus:)

**Additional: WebSocket Check**
- [ ] Open DevTools → Network → WS (WebSocket) tab
- [ ] Send message and observe WebSocket traffic
- [ ] Check if messages go through Socket.IO
- [ ] Verify if fetch interceptor catches them
- [ ] Screenshot: `perplexity_websocket.png`

### Issues Encountered

**Issue 1:** _______________________________________________

### Test Results Summary

**Overall Status:** [ ] ✅ PASS [ ] ⚠️ PARTIAL [ ] ❌ FAIL

**Notes:** _________________________________________________

---

## Platform 5: Poe ⏳

**Status:** ⏳ NOT STARTED
**Testing Date:** _____________
**Tester:** Greg

### Platform Details
- **URL:** https://poe.com
- **API Endpoint:** `poe.com/api` (unverified)
- **Request Type:** REST or GraphQL (unverified)

### ⚠️ Special Considerations
- **Multi-Model Platform:** Poe aggregates ChatGPT, Claude, GPT-4, etc.
- **Potential Issue:** May use GraphQL instead of REST
- **Test Required:** Verify interception works across different bot types

### Pre-Test Checklist
- [ ] Poe account created
- [ ] Multiple bots available (ChatGPT, Claude)
- [ ] Extension loaded
- [ ] DevTools open

### Test Steps
(Same as Gemini, plus:)

**Additional: Multi-Bot Test**
- [ ] Test with ChatGPT bot
- [ ] Test with Claude bot
- [ ] Test with GPT-4 bot
- [ ] Verify interception works for all

### Issues Encountered

**Issue 1:** _______________________________________________

### Test Results Summary

**Overall Status:** [ ] ✅ PASS [ ] ⚠️ PARTIAL [ ] ❌ FAIL

**Notes:** _________________________________________________

---

## Platform 6: Copilot ⏳

**Status:** ⏳ NOT STARTED
**Testing Date:** _____________
**Tester:** Greg

### Platform Details
- **URL:** https://copilot.microsoft.com
- **API Endpoint:** `copilot.microsoft.com/api`, `sydney.bing.com/sydney`
- **Request Type:** REST (fetch) - assumed

### ⚠️ Special Considerations
- **Microsoft Auth:** Uses Microsoft account authentication
- **Bing Integration:** Backend at `sydney.bing.com/sydney`
- **Potential Issue:** Microsoft auth might interfere

### Pre-Test Checklist
- [ ] Microsoft account signed in
- [ ] Copilot accessible
- [ ] Extension loaded
- [ ] DevTools open

### Test Steps
(Same as Gemini)

### Issues Encountered

**Issue 1:** _______________________________________________

### Test Results Summary

**Overall Status:** [ ] ✅ PASS [ ] ⚠️ PARTIAL [ ] ❌ FAIL

**Notes:** _________________________________________________

---

## Platform 7: You.com ⏳

**Status:** ⏳ NOT STARTED
**Testing Date:** _____________
**Tester:** Greg

### Platform Details
- **URL:** https://you.com
- **API Endpoint:** `you.com/api` (unverified)
- **Request Type:** REST (fetch) - assumed

### ⚠️ Special Considerations
- **Search Integration:** You.com combines search + AI chat
- **Potential Issue:** Search metadata might leak PII
- **Test Required:** Verify both search and chat modes

### Pre-Test Checklist
- [ ] You.com account created (if required)
- [ ] YouChat feature accessible
- [ ] Extension loaded
- [ ] DevTools open

### Test Steps
(Same as Gemini, plus:)

**Additional: Search Mode Test**
- [ ] Test search queries with PII
- [ ] Test chat responses
- [ ] Verify both are protected

### Issues Encountered

**Issue 1:** _______________________________________________

### Test Results Summary

**Overall Status:** [ ] ✅ PASS [ ] ⚠️ PARTIAL [ ] ❌ FAIL

**Notes:** _________________________________________________

---

## Final Summary

**Testing Completion:** _____ / 7 platforms tested

**Results:**
- ✅ Fully Working: 2/7 (ChatGPT, Claude)
- ⚠️ Partial Support: ___/7
- ❌ Not Working: ___/7
- ⏳ Not Tested: 5/7

**Issues Requiring Code Changes:**
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

**Recommended Marketing Claims:**

**If 7/7 pass:**
> "Supports 7 Major AI Platforms: ChatGPT, Claude, Gemini, Perplexity, Poe, Copilot, and You.com"

**If 5-6/7 pass:**
> "Supports 5+ Major AI Platforms including ChatGPT, Claude, Gemini, [others]"

**If 3-4/7 pass:**
> "Supports ChatGPT, Claude, and [2 others], with beta support for additional platforms"

---

## Next Steps After Testing

1. [ ] Update `PLATFORM_SUPPORT_AUDIT.md` with final results
2. [ ] Fix any critical issues found
3. [ ] Update manifest if platforms don't work (remove them)
4. [ ] Update landing page with accurate platform count
5. [ ] Create platform compatibility matrix for docs
6. [ ] Add tested platforms to Chrome Web Store listing

---

## Screenshot Naming Convention

```
[platform]_[step]_[description].png

Examples:
- gemini_01_injection.png
- gemini_02_network.png
- gemini_03_request_payload.png
- perplexity_websocket.png
```

Store in: `docs/testing/screenshots/` or `temp/testing/`

---

**Happy Testing! 🚀**
