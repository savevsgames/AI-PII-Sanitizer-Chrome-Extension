# Platform Support: Perplexity

> **Template Version:** 1.0
> **Last Updated:** 2025-11-02
> **Status:** 🚧 In Development (Infrastructure Ready, Testing Pending)

---

## Platform: Perplexity

**URL Pattern:** `*.perplexity.ai`
**Status:** 🚧 Infrastructure Complete, Manual Testing Pending
**Implementation Date:** 2025-11-02 (infrastructure)
**Last Updated:** 2025-11-02
**Maintained By:** Core Team

---

## 1. Platform Overview

### Description
Perplexity AI is an AI-powered answer engine that combines conversational AI with real-time web search. Unlike traditional chatbots, Perplexity provides cited answers with source attribution, making it popular for research and fact-checking.

### User Base & Priority
- **Estimated Users:** 10M+ monthly active users (as of 2024)
- **Priority Level:** Medium-High
- **Business Impact:** Growing platform with unique search-focused approach; important for academic/research users

### Key Characteristics
- **API Type:** Hybrid (WebSocket via Socket.IO + REST API)
- **Request Format:** JSON (presumed, needs verification)
- **Response Format:** JSON with citations/sources (presumed)
- **Authentication:** Cookie-based session (perplexity.ai account)
- **Special Feature:** Real-time web search integration with source citations

---

## 2. Technical Implementation

### 2.1 Detection & Initialization

**Hostname Detection:**
```javascript
// Pattern used in serviceWorker.ts
if (url.includes('perplexity.ai')) return 'perplexity';

// Pattern configured in manifest.json
"host_permissions": ["*://perplexity.ai/*"]
```

**URL Patterns Supported:**
- `https://perplexity.ai/` - Main chat interface
- `https://www.perplexity.ai/` - Alternative main domain
- `https://perplexity.ai/search/*` - Search-based conversations
- `https://perplexity.ai/socket.io/*` - WebSocket connections (Socket.IO)

**Initialization Sequence:**
1. Content script detects `perplexity.ai` hostname
2. Fetch interceptor initializes (inject.js)
3. WebSocket monitoring required (Socket.IO)
4. Observer may need implementation for DOM-based responses
5. Profiles/aliases loaded from background

### 2.2 Request Interception Method

**Primary Method:** fetch() + WebSocket (Socket.IO) interception

**Why This Method:**
Perplexity uses a **hybrid approach**:
- REST API via fetch() for initial requests
- Socket.IO (WebSocket) for real-time streaming responses
- May require dual interception strategy

**⚠️ CRITICAL CHALLENGE:** Socket.IO WebSocket messages may bypass fetch() interceptor. Need to verify if:
1. Chat messages are sent via REST POST (interceptable)
2. OR sent via WebSocket emit() (requires different interception)

**Implementation Location:**
- **File:** `src/content/inject.js` (fetch interceptor already configured)
- **Function:** Anonymous IIFE wrapping fetch()
- **Lines:** 172-197 (aiDomains array includes 'perplexity.ai')
- **WebSocket Handling:** NOT YET IMPLEMENTED - requires additional code

**Interception Pattern (Current - REST Only):**
```javascript
// From inject.js aiDomains array
const aiDomains = [
  // ...
  'perplexity.ai',
  // ...
];

// Existing fetch interceptor will catch REST API calls
// BUT: Socket.IO WebSocket messages need separate handling
```

**⚠️ TODO: WebSocket Interception** (if needed)
```javascript
// May need to add Socket.IO interception:
const io = window.io; // Socket.IO client library
if (io) {
  const originalEmit = io.Socket.prototype.emit;
  io.Socket.prototype.emit = function(event, data, ...args) {
    if (event === 'message' || event === 'chat') {
      // Intercept and substitute PII
      // ... substitution logic
    }
    return originalEmit.apply(this, [event, data, ...args]);
  };
}
```

### 2.3 Request/Response Format

**Request Structure (Assumed - Needs Verification):**
```json
{
  "query": "What is my email address gregcbarker@gmail.com?",
  "mode": "concise",
  "search_focus": "web",
  "context": []
}
```

**Request Endpoint Pattern (Presumed):**
```
POST /api/chat
POST /api/query
WebSocket: wss://perplexity.ai/socket.io/?transport=websocket
```

**Response Structure (Assumed - Needs Verification):**
```json
{
  "answer": "Your email address is gregcbarker@gmail.com",
  "sources": [
    {"title": "...", "url": "...", "snippet": "..."}
  ],
  "follow_up_questions": ["..."]
}
```

**Streaming Support:** Yes - likely via Socket.IO WebSocket or Server-Sent Events

### 2.4 PII Substitution Strategy

**Request Substitution (Planned):**
- **Location in Request:** Inside `query` field (if REST) or WebSocket event data
- **Encoding/Decoding Required:** No - standard JSON
- **Special Handling:**
  - May need to handle `context` array for follow-up questions
  - Search queries may include URLs/sources that contain PII

**Response Substitution (Planned):**
- **Location in Response:** Inside `answer` field and `sources` array
- **DOM Observation:** Likely needed - Perplexity renders markdown responses with citations
- **Special Handling:**
  - Source citations may include PII in URLs
  - Follow-up questions may echo PII

**Example Flow (Planned):**
```
User Input (Real PII: gregcbarker@gmail.com)
  → inject.js captures via fetch() or Socket.IO
  → chrome.runtime.sendMessage → serviceWorker.ts
  → Substitute: gregcbarker@gmail.com → blocked-email@promptblocker.com
  → API Request sent (Aliases)
  ↓
  → API Response received (Aliases in answer + sources)
  → Perplexity renders response in DOM (markdown + citations)
  ↓
  → Perplexity Observer detects mutations (TODO: implement)
  → Decodes: blocked-email@ → gregcbarker@gmail.com
  → User Display (Real PII)
```

---

## 3. Code Architecture

### 3.1 Key Files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `src/manifest.json` | Permissions configuration | N/A | ✅ Complete |
| `src/content/inject.js` | Fetch interceptor (REST API) | 172-197 | ✅ Complete |
| `src/background/serviceWorker.ts` | Service detection & substitution | detectService() | ✅ Complete |
| `src/lib/types.ts` | TypeScript type definitions | AIService type | ✅ Complete |
| `src/popup/components/statsRenderer.ts` | UI stats display | SERVICE_ICONS | ✅ Complete |
| `src/observers/perplexity-observer.ts` | DOM observation (future) | N/A | ⏳ Not Implemented |
| `src/content/inject.js` | Socket.IO interception (future) | N/A | ⏳ Not Implemented |

### 3.2 Message Passing Flow

```
[Perplexity Page - perplexity.ai]
     ↓
inject.js (page context) - fetch() or Socket.IO intercepted
     ↓ chrome.runtime.sendMessage (via content.ts relay)
serviceWorker.ts (background)
     ↓ detectService() → 'perplexity'
     ↓ JSON.parse(body)
     ↓ Substitute PII → Aliases
     ↓ JSON.stringify(modifiedBody)
     ↓ Return { success: true, modifiedBody, substitutions }
inject.js (page context)
     ↓ native fetch() or socket.emit() with modified data
[Modified Request Sent to Perplexity]
     ↓
[Response Received]
     ↓ Perplexity renders in DOM
Perplexity Observer (content.ts - FUTURE)
     ↓ MutationObserver detects changes
     ↓ Decodes aliases → real PII
     ↓ Updates DOM for user
[User Sees Real PII]
```

### 3.3 Observer Implementation

**Observer Type:** MutationObserver (PLANNED - Not Yet Implemented)

**Target Selectors (Needs Research):**
- **Chat Input:** `[data-testid="search-box"]` or similar (TBD)
- **Response Container:** `[data-testid="answer"]` or `.answer-container` (TBD)
- **Source Citations:** `.source-citation` or similar (TBD)

**Observer Configuration (Planned):**
```javascript
{
  childList: true,
  subtree: true,
  characterData: true
}
```

**⚠️ TODO:** Research actual DOM selectors on perplexity.ai

---

## 4. Testing & Validation

### 4.1 Test Scenarios

**Basic Functionality:**
- [ ] Platform detection works on perplexity.ai
- [ ] Fetch interceptor captures REST API calls
- [ ] Socket.IO messages captured (if applicable)
- [ ] PII substitution works in requests
- [ ] Response decoding works (DOM observer)
- [ ] User sees real PII in UI
- [ ] Perplexity sees only aliases
- [ ] Source citations handled correctly

**Edge Cases:**
- [ ] Follow-up questions (context propagation)
- [ ] Source URLs containing PII
- [ ] Search focus modes (web, academic, writing, etc.)
- [ ] Pro features (Pro account vs free)
- [ ] Multiple rapid searches

**Performance:**
- [ ] No noticeable latency added
- [ ] WebSocket streaming not disrupted
- [ ] Source citation loading not affected

### 4.2 Known Issues

| Issue | Severity | Status | Workaround |
|-------|----------|--------|------------|
| WebSocket interception not implemented | High | Open | REST API only for now |
| DOM observer not implemented | High | Open | No response decoding yet |
| Source citation handling unknown | Medium | Open | Research needed |

### 4.3 Test Results

**Last Tested:** Not yet tested
**Tester:** N/A
**Environment:** N/A

**Results:**
- ⏳ Pending manual testing (Phase 2B target: Nov 9-15)

**Test Plan from ROADMAP:**
1. Load extension with Perplexity permissions
2. Navigate to perplexity.ai
3. Send message with PII (e.g., email address)
4. Check Network tab for substitution
5. Verify stats increment in extension popup
6. Check DOM for response rendering

---

## 5. Platform-Specific Challenges

### 5.1 Technical Challenges

**Challenge 1: Hybrid REST + WebSocket Architecture**
- **Problem:** Perplexity uses both REST API and Socket.IO WebSocket for different operations. Fetch interceptor may only catch REST calls.
- **Solution:** Research actual API calls in DevTools; implement Socket.IO interception if needed.
- **Trade-offs:** WebSocket interception is more complex than REST; may need dual strategy.

**Challenge 2: Source Citation Handling**
- **Problem:** Perplexity includes source URLs in responses. If user shares a URL containing PII, it may appear in citations.
- **Solution:** Scan source URLs for PII; substitute in citation text/links.
- **Trade-offs:** May break links if PII is part of URL path.

**Challenge 3: Search Focus Modes**
- **Problem:** Perplexity has multiple search modes (web, academic, writing, Wolfram Alpha, YouTube, Reddit). Each may use different endpoints.
- **Solution:** Test each mode separately; verify interception works across all.
- **Trade-offs:** Maintenance burden for multiple endpoints.

### 5.2 Platform Limitations

- **Unknown API Structure:** No public API documentation; requires reverse engineering
- **Socket.IO Complexity:** Real-time WebSocket may bypass standard interceptors
- **Search Metadata:** Responses include search results which may contain unpredictable PII formats

### 5.3 Future Risks

- **Risk 1: API Endpoint Changes** - Perplexity could change API structure
  - **Likelihood:** Medium (growing startup, rapid iteration)
  - **Impact:** High (would break interception)
  - **Mitigation:** Monitor for errors; maintain version history

- **Risk 2: Socket.IO Protocol Changes** - WebSocket protocol could change
  - **Likelihood:** Low (Socket.IO is stable)
  - **Impact:** High (would break real-time features)
  - **Mitigation:** Use Socket.IO client library for compatibility

- **Risk 3: Pro Features Paywalled** - Core functionality moved behind Pro paywall
  - **Likelihood:** Medium (monetization strategy)
  - **Impact:** Medium (limits free user support)
  - **Mitigation:** Support Pro accounts; test with Pro subscription

---

## 6. Maintenance & Updates

### 6.1 Monitoring

**What to Monitor:**
- **Console Errors:** Look for fetch interception failures
- **WebSocket Status:** Monitor Socket.IO connection errors
- **Stats Tracking:** Verify stats.byService.perplexity increments
- **User Reports:** Track "Perplexity not working" issues

**How to Monitor:**
- **Development:** Console logs with `[Perplexity]` prefix
- **Production:** Error tracking (future)
- **User Feedback:** Beta tester reports

**Key Log Messages:**
```
✅ Normal Operation:
🌐 [DEBUG] All AI fetch: https://perplexity.ai/api/...
🌐 [DEBUG] isAIRequest? true
✅ Request substituted: X replacements

🔴 Errors:
❌ Substitution failed for perplexity
⚠️ Unknown endpoint: perplexity.ai/new-api
```

### 6.2 Update Checklist

When Perplexity updates break integration:
1. [ ] Check DevTools Network tab for new endpoints
2. [ ] Verify fetch() still used (not migrated to WebSocket-only)
3. [ ] Check request/response JSON structure
4. [ ] Test Socket.IO connection (if applicable)
5. [ ] Verify DOM selectors for observer (when implemented)
6. [ ] Run full test suite
7. [ ] Update documentation

### 6.3 Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-02 | 0.1.0 | Infrastructure setup (permissions, detection, stats) | Core Team |
| TBD | 1.0.0 | Manual testing + observer implementation | TBD |

---

## 7. Security Considerations

### 7.1 Data Handling

- **Request Data:** Captured via fetch/WebSocket, substituted in-memory, not stored
- **Response Data:** DOM observer decodes in-memory, no persistence
- **Storage:** Only aliases stored (encrypted in chrome.storage.local)
- **Transmission:** Message passing within extension context only

### 7.2 Privacy Impact

- **PII Exposure Risk:** Low (network-level substitution before transmission)
- **Mitigation:** Substitute before API call, decode after response
- **User Control:** Users can disable per-profile

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
- **Substitution Feedback:** Stats in popup (🔍 icon for Perplexity)
- **Error States:** Console errors (development only)

### 8.3 Known UX Issues

| Issue | Impact | Priority | Status |
|-------|--------|----------|--------|
| No observer implemented | High | P1 | Open |
| No WebSocket support | High | P1 | Open |

---

## 9. Dependencies

### 9.1 External Dependencies

- **Chrome Extension APIs:**
  - chrome.runtime.sendMessage
  - chrome.storage.local

- **Browser APIs:**
  - fetch() API
  - Socket.IO client library (if available on page)
  - MutationObserver (future)

### 9.2 Internal Dependencies

- AliasEngine (core substitution)
- Service detection logic
- Stats tracking system

### 9.3 Breaking Change Risk

**Risk Level:** Medium-High (untested platform with unique architecture)

---

## 10. References & Resources

### 10.1 Platform Documentation

- **Official Site:** https://perplexity.ai
- **No public API docs available** - requires reverse engineering
- **Blog:** https://blog.perplexity.ai

### 10.2 Related Internal Docs

- `docs/platforms/PLATFORM_TEMPLATE.md` - Documentation template
- `docs/current/adding_ai_services.md` - Generic integration guide
- `PLATFORM_TESTING_PLAN.md` - Phase 2B testing plan
- `ROADMAP.md` - Timeline and status

### 10.3 External References

- **Socket.IO Docs:** https://socket.io/docs/v4/
- **WebSocket API MDN:** https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API

---

## 11. Quick Reference

### Command Cheat Sheet

```bash
# Build extension
npm run build

# Test on Perplexity
# 1. Load unpacked extension
# 2. Navigate to https://perplexity.ai
# 3. Open DevTools console + Network tab
# 4. Send message with PII
# 5. Check Network tab for API calls
# 6. Verify stats increment in popup (🔍)
```

### Key Log Messages

```
✅ SUCCESS (Expected):
🌐 [DEBUG] All AI fetch: https://perplexity.ai/api/...
✅ Request substituted: X replacements

🔴 ERRORS (If Any):
❌ Substitution failed
⚠️ WebSocket not intercepted
```

### Troubleshooting Quick Fixes

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| No interception | WebSocket-only mode | Implement Socket.IO interception |
| Stats not incrementing | Service detection failed | Check URL pattern in detectService() |
| No DOM decoding | Observer not implemented | Implement Perplexity observer |

---

## 12. Implementation Roadmap

### Phase 1: Manual Testing (Current)
- [ ] Test fetch() interception on perplexity.ai
- [ ] Verify request substitution works
- [ ] Check if WebSocket interception needed
- [ ] Research DOM structure for observer

### Phase 2: Observer Implementation
- [ ] Create PerplexityObserver class
- [ ] Research DOM selectors
- [ ] Implement response decoding
- [ ] Handle source citations

### Phase 3: WebSocket Support (If Needed)
- [ ] Implement Socket.IO interception
- [ ] Test real-time streaming
- [ ] Verify substitution in WebSocket messages

### Phase 4: Production Release
- [ ] Full test suite passing
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] User acceptance testing

---

**Status Summary:**
- ✅ Infrastructure: Complete
- 🚧 Testing: Pending (Phase 2B target: Nov 9-15)
- ⏳ Observer: Not Implemented
- ⏳ WebSocket: Not Implemented
- 📝 Documentation: Complete (this file)

**Next Steps:**
1. Manual testing on perplexity.ai
2. Research actual API endpoints in DevTools
3. Implement PerplexityObserver if needed
4. Implement Socket.IO interception if needed
5. Update this documentation with findings
