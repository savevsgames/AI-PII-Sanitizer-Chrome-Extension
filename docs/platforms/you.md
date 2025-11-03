# Platform Support: You.com

> **Template Version:** 1.0
> **Last Updated:** 2025-11-03
> **Status:** 🟡 Tier 2 Platform (Post-MVP - Deferred)

---

## Platform: You.com

**URL Pattern:** `*.you.com`
**Status:** 🟡 Tier 2 (Architecture Analyzed, Implementation Deferred to Post-MVP)
**Testing Date:** 2025-11-03
**Last Updated:** 2025-11-03
**Maintained By:** Core Team
**Market Share:** 0.40% (5.5M monthly visits)

---

## 1. Platform Overview

### Description
You.com is an AI-powered search engine that combines conversational AI with real-time web search, similar to Perplexity. It offers "YouChat" for conversational interactions and integrates search results, citations, and AI-generated summaries. You.com emphasizes privacy and personalized search experiences.

### User Base & Priority
- **Monthly Visits:** 5.5M (0.40% market share)
- **Priority Level:** ⚠️ Low (Tier 2 - Post-MVP)
- **Business Impact:** Small niche platform; low ROI compared to DeepSeek (96M users) and Meta AI (100M+ users)
- **Tier Status:** Deferred to Post-MVP in favor of higher-priority platforms

### Key Characteristics
- **API Type:** ❌ **GET Requests with URL Parameters** (NOT POST/JSON!)
- **Request Format:** URL query parameter (`?q=...`) - **FUNDAMENTALLY DIFFERENT from all other platforms**
- **Response Format:** Server-side rendered (Next.js) with JSON data endpoints
- **Authentication:** Cookie-based session (you.com account optional)
- **Special Features:** Search aggregation, AI modes (Smart, Genius, Create), app integration

### ⚠️ **CRITICAL DISCOVERY (2025-11-03):**
You.com sends user queries via **GET request URL parameters**, NOT POST request bodies like ChatGPT, Claude, Gemini, Perplexity, and Copilot. Our current fetch() body interception strategy **CANNOT intercept URL parameters**. Requires webRequest API implementation (different architecture).

**Test Evidence:**
```
URL: https://you.com/search?q=is%20gregcbarker%20a%20palidrome%3F&fromSearchBar=true&chatMode=default
Method: GET
PII Location: URL query parameter (?q=...)
Extension Status: ⚠️ Empty request body, skipping substitution
```

**See:** `YOU_COM_ANALYSIS.md` for complete technical analysis and implementation plan.

---

## 2. Technical Implementation

### 2.1 Detection & Initialization

**Hostname Detection:**
```javascript
// Pattern used in serviceWorker.ts
if (url.includes('you.com')) return 'you';

// Pattern configured in manifest.json
"host_permissions": ["*://you.com/*"]
```

**URL Patterns Supported:**
- `https://you.com/` - Main search interface
- `https://you.com/search?q=...` - Search results
- `https://you.com/chat` - YouChat interface
- `https://you.com/api/*` - API endpoints (presumed)

**Initialization Sequence:**
1. Content script detects `you.com` hostname
2. Fetch interceptor initializes (inject.js)
3. Profiles/aliases loaded from background
4. Observer may need implementation for DOM-based responses
5. Extension ready to intercept requests

### 2.2 Request Interception Method

**Primary Method:** fetch() interception (standard)

**Why This Method:**
You.com likely uses modern fetch() API for YouChat requests, similar to ChatGPT and Claude.

**Implementation Location:**
- **File:** `src/content/inject.js`
- **Function:** Anonymous IIFE wrapping fetch()
- **Lines:** 172-197 (aiDomains array includes 'you.com')

**Interception Pattern:**
```javascript
// From inject.js aiDomains array
const aiDomains = [
  // ...
  'you.com',
  // ...
];

// Existing fetch interceptor will catch API calls
```

### 2.3 Request/Response Format

**Request Structure (Assumed - Needs Verification):**
```json
{
  "query": "What is my email address gregcbarker@gmail.com?",
  "mode": "smart",
  "search_context": true,
  "history": []
}
```

**Alternative Request Structure (Messages Array - Like ChatGPT):**
```json
{
  "messages": [
    {"role": "user", "content": "What is gregcbarker@gmail.com?"}
  ],
  "mode": "chat",
  "search": true
}
```

**Request Endpoint Pattern (Presumed):**
```
POST /api/chat
POST /api/youchat
POST /api/search
```

**Response Structure (Assumed):**
```json
{
  "answer": "Your email address is gregcbarker@gmail.com",
  "sources": [
    {"title": "...", "url": "...", "snippet": "..."}
  ],
  "search_results": [...],
  "related_queries": ["..."]
}
```

**Streaming Support:** Likely Yes - Server-Sent Events or chunked transfer encoding

### 2.4 PII Substitution Strategy

**Request Substitution (Planned):**
- **Location in Request:**
  - If simple query: Inside `query` field
  - If messages array: Inside `messages[].content` field
- **Encoding/Decoding Required:** No - standard JSON
- **Special Handling:**
  - Search context: May include previous search queries with PII
  - Mode parameter: Different modes (Smart, Genius, Create) may behave differently
  - History array: May contain previous messages with PII

**Response Substitution (Planned):**
- **Location in Response:** Inside `answer` field and `sources` array
- **DOM Observation:** Likely needed - You.com renders markdown responses with citations
- **Special Handling:**
  - Search results: Web results may include PII in URLs/snippets
  - Related queries: Suggested follow-ups may echo PII
  - App integrations: Results from apps (GitHub, Twitter, etc.) may contain PII

**Example Flow (Planned):**
```
User Input (Real PII: gregcbarker@gmail.com)
  → inject.js captures via fetch()
  → chrome.runtime.sendMessage → serviceWorker.ts
  → Substitute: gregcbarker@gmail.com → blocked-email@promptblocker.com
  → API Request sent (Aliases)
  ↓
  → You.com processes with alias
  → Web search may be triggered (searches with alias)
  → AI generates response with alias
  ↓
  → API Response received (Aliases in answer + sources)
  → You.com renders response in DOM (markdown + citations + search results)
  ↓
  → You.com Observer detects mutations (TODO: implement)
  → Decodes: blocked-email@ → gregcbarker@gmail.com
  → User Display (Real PII)
```

---

## 3. Code Architecture

### 3.1 Key Files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `src/manifest.json` | Permissions configuration | N/A | ✅ Complete |
| `src/content/inject.js` | Fetch interceptor | 172-197 | ✅ Complete |
| `src/background/serviceWorker.ts` | Service detection & substitution | detectService() | ✅ Complete |
| `src/lib/types.ts` | TypeScript type definitions | AIService type | ✅ Complete |
| `src/popup/components/statsRenderer.ts` | UI stats display | SERVICE_ICONS | ✅ Complete (🌐 icon) |
| `src/observers/you-observer.ts` | DOM observation (future) | N/A | ⏳ Not Implemented |

### 3.2 Message Passing Flow

```
[You.com Page - you.com]
     ↓
inject.js (page context) - fetch() intercepted
     ↓ chrome.runtime.sendMessage (via content.ts relay)
serviceWorker.ts (background)
     ↓ detectService() → 'you'
     ↓ JSON.parse(body)
     ↓ Substitute PII → Aliases (in query or messages array)
     ↓ JSON.stringify(modifiedBody)
     ↓ Return { success: true, modifiedBody, substitutions }
inject.js (page context)
     ↓ native fetch() with modified data
[Modified Request Sent to You.com]
     ↓
[You.com processes, triggers web search with aliases]
     ↓
[Response Received]
     ↓ You.com renders in DOM (markdown + citations + search results)
You.com Observer (content.ts - FUTURE)
     ↓ MutationObserver detects changes
     ↓ Decodes aliases → real PII
     ↓ Updates DOM for user
[User Sees Real PII]
```

### 3.3 Observer Implementation

**Observer Type:** MutationObserver (PLANNED - Not Yet Implemented)

**Target Selectors (Needs Research):**
- **Chat Input:** `[data-testid="chat-input"]` or `.search-input` (TBD)
- **Response Container:** `.chat-response` or `.ai-answer` (TBD)
- **Search Results:** `.search-result` or `.web-result` (TBD)
- **Citations:** `.source-citation` or similar (TBD)

**Observer Configuration (Planned):**
```javascript
{
  childList: true,
  subtree: true,
  characterData: true
}
```

**⚠️ TODO:** Research actual DOM selectors on you.com

---

## 4. Testing & Validation

### 4.1 Test Scenarios

**Basic Functionality:**
- [ ] Platform detection works on you.com
- [ ] Fetch interceptor captures API calls
- [ ] PII substitution works in requests (query format)
- [ ] PII substitution works in requests (messages array format if applicable)
- [ ] Response decoding works (DOM observer)
- [ ] User sees real PII in UI
- [ ] You.com backend sees only aliases
- [ ] Stats increment correctly (🌐 icon)

**AI Modes:**
- [ ] Test with Smart mode (balanced)
- [ ] Test with Genius mode (deep research)
- [ ] Test with Create mode (content generation)
- [ ] Test with Research mode (academic)

**Edge Cases:**
- [ ] Search results containing PII in URLs
- [ ] Related queries echoing PII
- [ ] App integrations (GitHub, Twitter, Reddit, etc.)
- [ ] Image search with PII in query
- [ ] Multiple rapid searches
- [ ] History/context propagation

**Performance:**
- [ ] No noticeable latency added
- [ ] Search results not affected
- [ ] Streaming responses not disrupted

### 4.2 Known Issues

| Issue | Severity | Status | Workaround |
|-------|----------|--------|------------|
| DOM observer not implemented | High | Open | No response decoding yet |
| Request format unknown (query vs messages) | Medium | Open | Research needed |
| App integration handling unknown | Medium | Open | Test with apps |

### 4.3 Test Results

**Last Tested:** Not yet tested
**Tester:** N/A
**Environment:** N/A

**Results:**
- ⏳ Pending manual testing (Phase 2B target: Nov 9-15)

**Test Plan from ROADMAP:**
1. Load extension with You.com permissions
2. Navigate to you.com
3. Open DevTools console + Network tab
4. Send message/search with PII
5. Check Network tab for API calls
6. Inspect request format (query vs messages)
7. Verify stats increment (🌐 icon)
8. Test with different AI modes

---

## 5. Platform-Specific Challenges

### 5.1 Technical Challenges

**Challenge 1: Dual Interface (Search + Chat)**
- **Problem:** You.com has both a traditional search interface and a chat interface (YouChat). Need to ensure interception works for both.
- **Solution:** Test both interfaces; verify API endpoints are the same or handle separately.
- **Trade-offs:** May need dual interception strategies if endpoints differ.

**Challenge 2: Search Result Integration**
- **Problem:** You.com blends AI responses with web search results. PII may appear in search snippets, URLs, or AI summaries.
- **Solution:** Scan search results for PII; substitute in both AI answer and search snippets.
- **Trade-offs:** Complex parsing; may break links if PII in URLs.

**Challenge 3: AI Mode Variations**
- **Problem:** You.com has multiple AI modes (Smart, Genius, Create, Research). Each may use different endpoints or formats.
- **Solution:** Test each mode separately; verify interception works across all.
- **Trade-offs:** Maintenance burden for multiple modes.

**Challenge 4: App Integrations**
- **Problem:** You.com integrates with external apps (GitHub, Twitter, Reddit, Stack Overflow, etc.). These may return PII in app-specific formats.
- **Solution:** Handle app results separately; scan for PII in app responses.
- **Trade-offs:** Complex parsing; each app has different response format.

### 5.2 Platform Limitations

- **No Public API:** You.com API is undocumented; requires reverse engineering
- **Search Quality:** Results quality varies; may affect user experience if substitution affects search
- **App Dependencies:** App integrations depend on external services (GitHub API, Twitter API, etc.)

### 5.3 Future Risks

- **Risk 1: API Endpoint Changes** - You.com could change API structure
  - **Likelihood:** Medium (growing startup, rapid iteration)
  - **Impact:** High (would break interception)
  - **Mitigation:** Monitor for errors; maintain version history

- **Risk 2: App Integration Format Changes** - External apps could change response format
  - **Likelihood:** Medium
  - **Impact:** Medium (would affect app-specific PII handling)
  - **Mitigation:** Handle app results generically; focus on AI answer first

- **Risk 3: Monetization/Paywalling** - Core features moved behind paywall
  - **Likelihood:** Medium (monetization strategy)
  - **Impact:** Medium (limits free user support)
  - **Mitigation:** Support paid accounts; test with subscription

---

## 6. Maintenance & Updates

### 6.1 Monitoring

**What to Monitor:**
- **Console Errors:** Look for fetch interception failures
- **API Endpoint Changes:** Monitor for new /api/* patterns
- **Stats Tracking:** Verify stats.byService.you increments
- **User Reports:** Track "You.com not working" issues

**How to Monitor:**
- **Development:** Console logs with `[You.com]` prefix
- **Production:** Error tracking (future)
- **User Feedback:** Beta tester reports

**Key Log Messages:**
```
✅ Normal Operation:
🌐 [DEBUG] All AI fetch: https://you.com/api/...
🌐 [DEBUG] isAIRequest? true
✅ Request substituted: X replacements

🔴 Errors:
❌ Substitution failed for you
⚠️ Unknown endpoint: you.com/new-api
⚠️ App integration error: GitHub
```

### 6.2 Update Checklist

When You.com updates break integration:
1. [ ] Check DevTools Network tab for endpoint changes
2. [ ] Verify fetch() still used
3. [ ] Check request format (query vs messages array)
4. [ ] Test AI modes (Smart, Genius, Create, Research)
5. [ ] Verify DOM selectors for observer (when implemented)
6. [ ] Test app integrations
7. [ ] Run full test suite
8. [ ] Update documentation

### 6.3 Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-02 | 0.1.0 | Infrastructure setup (permissions, detection, stats) | Core Team |
| TBD | 1.0.0 | Manual testing + observer implementation | TBD |

---

## 7. Security Considerations

### 7.1 Data Handling

- **Request Data:** Captured via fetch, substituted in-memory, not stored
- **Response Data:** DOM observer decodes in-memory, no persistence
- **Storage:** Only aliases stored (encrypted in chrome.storage.local)
- **Transmission:** Message passing within extension context only

### 7.2 Privacy Impact

- **PII Exposure Risk:** Low (network-level substitution before transmission)
- **Mitigation:** Substitute before API call, decode after response
- **User Control:** Users can disable per-profile
- **Privacy Focus:** You.com emphasizes privacy; extension aligns with platform values

### 7.3 Security Audit Results

**Last Audit:** Not yet audited (pending testing)

---

## 8. User Experience

### 8.1 Performance Impact

- **Latency Added:** Expected <50ms (same as ChatGPT/Claude)
- **Memory Usage:** Negligible
- **CPU Usage:** Negligible

### 8.2 Visual Indicators

- **Protection Status:** Extension icon shows active state
- **Substitution Feedback:** Stats in popup (🌐 icon for You.com)
- **Error States:** Console errors (development only)

### 8.3 Known UX Issues

| Issue | Impact | Priority | Status |
|-------|--------|----------|--------|
| No observer implemented | High | P1 | Open |
| AI mode behavior unknown | Medium | P2 | Open |
| App integration unknown | Medium | P2 | Open |

---

## 9. Dependencies

### 9.1 External Dependencies

- **Chrome Extension APIs:**
  - chrome.runtime.sendMessage
  - chrome.storage.local

- **Browser APIs:**
  - fetch() API
  - MutationObserver (future)

### 9.2 Internal Dependencies

- AliasEngine (core substitution)
- Service detection logic
- Stats tracking system

### 9.3 Breaking Change Risk

**Risk Level:** Medium (search integration + app dependencies)

---

## 10. References & Resources

### 10.1 Platform Documentation

- **Official Site:** https://you.com
- **No public API docs available** - requires reverse engineering
- **Blog:** https://about.you.com/blog/

### 10.2 Related Internal Docs

- `docs/platforms/PLATFORM_TEMPLATE.md` - Documentation template
- `docs/current/adding_ai_services.md` - Generic integration guide
- `PLATFORM_TESTING_PLAN.md` - Phase 2B testing plan
- `ROADMAP.md` - Timeline and status

### 10.3 External References

- **Server-Sent Events MDN:** https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

---

## 11. Quick Reference

### Command Cheat Sheet

```bash
# Build extension
npm run build

# Test on You.com
# 1. Load unpacked extension
# 2. Navigate to https://you.com
# 3. Open DevTools console + Network tab
# 4. Try both interfaces:
#    - Search bar (you.com/search?q=...)
#    - YouChat (you.com/chat)
# 5. Send message/search with PII
# 6. Check Network tab for API calls
# 7. Inspect request format
# 8. Verify stats increment in popup (🌐)

# Test AI modes
# Switch between:
# - Smart mode (balanced)
# - Genius mode (deep research)
# - Create mode (content generation)
# - Research mode (academic)
```

### Key Log Messages

```
✅ SUCCESS (Expected):
🌐 [DEBUG] All AI fetch: https://you.com/api/...
✅ Request substituted: X replacements

🔴 ERRORS (If Any):
❌ Substitution failed
⚠️ Unknown AI mode: [mode]
⚠️ App integration failed: [app]
```

### Troubleshooting Quick Fixes

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| No interception on search | Different endpoint for search vs chat | Research actual API endpoints in DevTools |
| AI mode failure | Mode-specific endpoint | Test each mode separately |
| Stats not incrementing | Service detection failed | Check URL pattern in detectService() |
| App results broken | App-specific parsing needed | Handle app results separately |

---

## 12. Implementation Roadmap

### Phase 1: Manual Testing (Current)
- [ ] Test fetch() interception on you.com
- [ ] Verify request substitution works (search interface)
- [ ] Verify request substitution works (chat interface)
- [ ] Research JSON request format in DevTools
- [ ] Research DOM structure for observer

### Phase 2: AI Mode Testing
- [ ] Test Smart mode
- [ ] Test Genius mode
- [ ] Test Create mode
- [ ] Test Research mode
- [ ] Verify interception works across all modes

### Phase 3: Observer Implementation
- [ ] Create YouObserver class
- [ ] Research DOM selectors
- [ ] Implement response decoding
- [ ] Handle search result citations

### Phase 4: App Integration (If Needed)
- [ ] Research app integration formats
- [ ] Handle GitHub results
- [ ] Handle Twitter/Reddit results
- [ ] Handle Stack Overflow results
- [ ] Generic fallback for unknown apps

### Phase 5: Production Release
- [ ] Full test suite passing
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] User acceptance testing

---

**Status Summary:**
- ✅ Infrastructure: Complete
- 🚧 Testing: Pending (Phase 2B target: Nov 9-15)
- ⏳ Observer: Not Implemented
- ⏳ AI Modes: Not Tested
- ⏳ App Integrations: Not Tested
- 📝 Documentation: Complete (this file)

**Next Steps:**
1. Manual testing on you.com (both search and chat interfaces)
2. Research actual API endpoints in DevTools
3. Determine request format (query vs messages array)
4. Implement YouObserver if needed
5. Test with different AI modes
6. Update this documentation with findings
