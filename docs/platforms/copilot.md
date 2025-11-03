# Platform Support: GitHub Copilot / Microsoft Copilot

> **Template Version:** 1.0
> **Last Updated:** 2025-11-03
> **Status:** 🚧 In Development (WebSocket Interception Required)

---

## Platform: Microsoft Copilot (Bing Chat)

**URL Pattern:** `*.copilot.microsoft.com`, `*.bing.com/sydney*`
**Status:** 🚧 WebSocket Interception Required (Testing Revealed Architecture)
**Implementation Date:** 2025-11-03 (discovery)
**Last Updated:** 2025-11-03
**Maintained By:** Core Team
**Complexity:** HIGH (WebSocket-based, not REST)

---

## 1. Platform Overview

### Description
Microsoft Copilot (formerly Bing Chat) is Microsoft's AI-powered conversational assistant built on OpenAI's GPT-4 and Microsoft's proprietary "Sydney" technology. It integrates with Bing search, Microsoft 365, and Windows, offering web-grounded responses with citations.

**Note:** This document covers the **web-based Copilot chat** (copilot.microsoft.com), NOT the GitHub Copilot code assistant in VS Code.

### User Base & Priority
- **Estimated Users:** 100M+ (integrated into Windows 11, Bing, Edge)
- **Priority Level:** High
- **Business Impact:** Major platform with Microsoft backing and Windows OS integration; critical for enterprise/Microsoft ecosystem users

### Key Characteristics
- **API Type:** **WebSocket** (real-time persistent connection) ⚠️ NOT REST!
- **WebSocket URL:** `wss://copilot.microsoft.com/c/api/chat?api-version=2`
- **Request Format:** JSON messages over WebSocket
- **Response Format:** Streaming JSON events (`appendText`, `partCompleted`, `done`)
- **Authentication:** Microsoft account OAuth
- **Special Features:** Web search integration, citations, image generation (DALL-E 3), multimodal input

**⚠️ CRITICAL DISCOVERY (2025-11-03):**
Copilot uses **WebSocket**, NOT fetch(). Requires WebSocket.send() interception (similar complexity to Gemini's XHR interception).

---

## 2. Technical Implementation

### 2.1 Detection & Initialization

**Hostname Detection:**
```javascript
// Pattern used in serviceWorker.ts
if (url.includes('copilot.microsoft.com')) return 'copilot';
// Note: Also configured for bing.com/sydney (legacy endpoint)

// Pattern configured in manifest.json
"host_permissions": [
  "*://copilot.microsoft.com/*",
  "*://*.bing.com/*"
]
```

**URL Patterns Supported:**
- `https://copilot.microsoft.com/` - Main Copilot interface
- `https://www.bing.com/chat` - Alternative Bing Chat interface
- `https://sydney.bing.com/sydney/*` - Backend API (legacy)
- `https://www.bing.com/turing/conversation/*` - Alternative API endpoint

**Initialization Sequence:**
1. Content script detects copilot.microsoft.com or bing.com hostname
2. Fetch interceptor initializes (inject.js)
3. Profiles/aliases loaded from background
4. Observer may need implementation for DOM-based responses
5. Extension ready to intercept requests

### 2.2 Request Interception Method

**Primary Method:** **WebSocket interception** (REQUIRED - fetch() won't work!)

**Why This Method:**
Microsoft Copilot uses **WebSocket** for real-time chat, NOT fetch(). Messages are sent via `WebSocket.send()` over a persistent connection to `wss://copilot.microsoft.com/c/api/chat`.

**Implementation Location:**
- **File:** `src/content/inject.js` (page context - NEW CODE REQUIRED)
- **Function:** WebSocket.prototype.send() wrapper (to be implemented)
- **Pattern:** Similar to Gemini XHR interception (lines 508-697)

**Interception Pattern (To Be Implemented):**
```javascript
// Intercept WebSocket creation
if (window.location.hostname.includes('copilot.microsoft.com')) {
  const nativeWebSocket = window.WebSocket;
  const nativeSend = WebSocket.prototype.send;

  window.WebSocket = function(url, protocols) {
    const ws = new nativeWebSocket(url, protocols);

    // Only intercept Copilot chat WebSocket
    if (url.includes('/c/api/chat')) {
      console.log('[Copilot WS] Intercepting WebSocket:', url);

      ws.send = async function(data) {
        // Send to background for substitution
        const substituted = await substituteMessage(data);
        return nativeSend.call(this, substituted);
      };
    }

    return ws;
  };
}
```

**See:** `docs/platforms/COPILOT_WEBSOCKET_PLAN.md` for complete implementation plan

### 2.3 Request/Response Format

**Request Structure (Assumed - Needs Verification):**
```json
{
  "arguments": [{
    "source": "cib",
    "optionsSets": ["nlu_direct_response_filter", "deepleo", "enable_debug_commands", "..."],
    "allowedMessageTypes": ["Chat", "InternalSearchQuery", "InternalSearchResult", "..."],
    "sliceIds": ["..."],
    "traceId": "...",
    "isStartOfSession": true,
    "message": {
      "author": "user",
      "inputMethod": "Keyboard",
      "text": "What is my email address gregcbarker@gmail.com?",
      "messageType": "Chat"
    },
    "conversationSignature": "...",
    "participant": {
      "id": "..."
    },
    "conversationId": "..."
  }],
  "invocationId": "0",
  "target": "chat",
  "type": 4
}
```

**Request Endpoint Pattern (Known):**
```
POST /sydney/ChatHub
POST /turing/conversation/create
POST /sydney/create
WebSocket: wss://sydney.bing.com/sydney/ChatHub (streaming)
```

**Response Structure (Assumed):**
```json
{
  "type": 2,
  "invocationId": "0",
  "item": {
    "messages": [{
      "author": "bot",
      "text": "Your email address is gregcbarker@gmail.com",
      "messageType": "Chat",
      "adaptiveCards": [...],
      "sourceAttributions": [...],
      "suggestedResponses": [...]
    }],
    "result": {
      "value": "Success",
      "serviceVersion": "..."
    }
  }
}
```

**Streaming Support:** Yes - Server-Sent Events (SSE) or WebSocket for streaming responses

### 2.4 PII Substitution Strategy

**Request Substitution (Planned):**
- **Location in Request:** Inside `arguments[0].message.text` field (nested structure)
- **Encoding/Decoding Required:** No - standard JSON
- **Special Handling:**
  - Deep nesting: must navigate `arguments[0].message.text`
  - ConversationId/Signature: May need to preserve for session continuity
  - OptionsSets: Microsoft-specific configuration flags

**Response Substitution (Planned):**
- **Location in Response:** Inside `item.messages[].text` field
- **DOM Observation:** Likely needed - Copilot renders markdown responses with citations
- **Special Handling:**
  - Adaptive Cards: Visual response cards may contain PII
  - Source Attributions: Web search citations may include PII in URLs
  - Suggested Responses: Follow-up questions may echo PII

**Example Flow (Planned):**
```
User Input (Real PII: gregcbarker@gmail.com)
  → inject.js captures via fetch()
  → chrome.runtime.sendMessage → serviceWorker.ts
  → Parse nested JSON: arguments[0].message.text
  → Substitute: gregcbarker@gmail.com → blocked-email@promptblocker.com
  → Reconstruct nested JSON
  → API Request sent to Sydney (Aliases)
  ↓
  → Sydney backend processes with alias
  → Web search may be triggered (searches with alias)
  → GPT-4 generates response with alias
  ↓
  → API Response received (Aliases)
  → Copilot renders response in DOM (markdown + citations)
  ↓
  → Copilot Observer detects mutations (TODO: implement)
  → Decodes: blocked-email@ → gregcbarker@gmail.com
  → User Display (Real PII)
```

---

## 3. Code Architecture

### 3.1 Key Files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `src/manifest.json` | Permissions configuration | N/A | ✅ Complete |
| `src/content/inject.js` | Fetch interceptor | 172-197 | ⚠️ Needs endpoint filtering |
| `src/background/serviceWorker.ts` | Service detection & substitution | detectService() | ✅ Complete |
| `src/lib/types.ts` | TypeScript type definitions | AIService type | ✅ Complete |
| `src/popup/components/statsRenderer.ts` | UI stats display | SERVICE_ICONS | ✅ Complete (🧑‍💻 icon) |
| `src/observers/copilot-observer.ts` | DOM observation (future) | N/A | ⏳ Not Implemented |

**⚠️ TODO:** Add endpoint filtering in inject.js to avoid intercepting all bing.com requests:
```javascript
// Current (too broad):
'bing.com',

// Should be (more specific):
if (url.includes('bing.com/sydney') ||
    url.includes('bing.com/turing') ||
    url.includes('bing.com/chat')) {
  // Intercept
}
```

### 3.2 Message Passing Flow

```
[Copilot Page - copilot.microsoft.com]
     ↓
inject.js (page context) - fetch() intercepted
     ↓ chrome.runtime.sendMessage (via content.ts relay)
serviceWorker.ts (background)
     ↓ detectService() → 'copilot'
     ↓ JSON.parse(body)
     ↓ Navigate: arguments[0].message.text
     ↓ Substitute PII → Aliases
     ↓ Reconstruct nested JSON
     ↓ JSON.stringify(modifiedBody)
     ↓ Return { success: true, modifiedBody, substitutions }
inject.js (page context)
     ↓ native fetch() with modified data
[Modified Request Sent to Sydney Backend]
     ↓
[Sydney processes with aliases, triggers web search with aliases]
     ↓
[Response Received]
     ↓ Copilot renders in DOM (markdown + adaptive cards + citations)
Copilot Observer (content.ts - FUTURE)
     ↓ MutationObserver detects changes
     ↓ Decodes aliases → real PII
     ↓ Updates DOM for user
[User Sees Real PII]
```

### 3.3 Observer Implementation

**Observer Type:** MutationObserver (PLANNED - Not Yet Implemented)

**Target Selectors (Needs Research):**
- **Chat Input:** `[data-testid="message-input"]` or `.cib-serp-main` (TBD)
- **Response Container:** `.ac-textBlock` (Adaptive Card) or `.cib-message-group` (TBD)
- **Citations:** `.cib-source-attribution` or similar (TBD)

**Observer Configuration (Planned):**
```javascript
{
  childList: true,
  subtree: true,
  characterData: true
}
```

**⚠️ TODO:** Research actual DOM selectors on copilot.microsoft.com

---

## 4. Testing & Validation

### 4.1 Test Scenarios

**Basic Functionality:**
- [ ] Platform detection works on copilot.microsoft.com
- [ ] Platform detection works on bing.com/chat
- [ ] Fetch interceptor captures Sydney API calls
- [ ] Endpoint filtering works (no non-Copilot Bing requests intercepted)
- [ ] PII substitution works in nested JSON structure
- [ ] Response decoding works (DOM observer)
- [ ] User sees real PII in UI
- [ ] Sydney backend sees only aliases
- [ ] Stats increment correctly (🧑‍💻 icon)

**Edge Cases:**
- [ ] Web search integration (citations with PII in URLs)
- [ ] Adaptive Cards (visual response cards)
- [ ] Suggested responses (follow-up questions)
- [ ] Image generation (DALL-E 3 prompts with PII)
- [ ] Multimodal input (image upload with text containing PII)
- [ ] Conversation history (context propagation)

**Performance:**
- [ ] No noticeable latency added
- [ ] Streaming responses not disrupted
- [ ] Web search not affected

### 4.2 Known Issues

| Issue | Severity | Status | Workaround |
|-------|----------|--------|------------|
| Broad bing.com pattern | Medium | Open | Add endpoint filtering |
| DOM observer not implemented | High | Open | No response decoding yet |
| Nested JSON structure unknown | Medium | Open | Needs research |
| Sydney endpoint accuracy unknown | Medium | Open | Verify in DevTools |

### 4.3 Test Results

**Last Tested:** Not yet tested
**Tester:** N/A
**Environment:** N/A

**Results:**
- ⏳ Pending manual testing (Phase 2B target: Nov 9-15)

**Test Plan from ROADMAP:**
1. Load extension with Copilot permissions
2. Navigate to copilot.microsoft.com
3. Open DevTools console + Network tab
4. Send message with PII
5. Check Network tab for Sydney API calls
6. Inspect request JSON structure (verify nesting)
7. Verify stats increment (🧑‍💻 icon)
8. Test web search with PII (check citations)

---

## 5. Platform-Specific Challenges

### 5.1 Technical Challenges

**Challenge 1: Dual Endpoints (copilot.microsoft.com vs bing.com)**
- **Problem:** Microsoft uses multiple domains for Copilot (copilot.microsoft.com, bing.com/chat, sydney.bing.com). Need to ensure interception works across all.
- **Solution:** Broad hostname detection in manifest + endpoint filtering in inject.js to avoid non-Copilot Bing requests.
- **Trade-offs:** Complexity in filtering; risk of missing new endpoints.

**Challenge 2: Deeply Nested JSON Structure**
- **Problem:** Copilot uses deeply nested request format (`arguments[0].message.text`). Simple string search won't work.
- **Solution:** Navigate JSON tree to correct field; substitute; reconstruct.
- **Trade-offs:** More complex parsing logic; higher risk of breaking on structure changes.

**Challenge 3: Web Search Integration**
- **Problem:** Copilot triggers web searches based on user query. If user includes URL with PII, search citations may include it.
- **Solution:** Scan source attributions and suggested responses for PII; substitute in citations.
- **Trade-offs:** May break citation links if PII is in URL path.

**Challenge 4: Adaptive Cards**
- **Problem:** Copilot renders responses using Microsoft's Adaptive Cards (JSON-based visual cards). PII may appear in card content, not just plain text.
- **Solution:** Parse Adaptive Card JSON; scan text blocks for PII; decode.
- **Trade-offs:** Complex parsing; risk of breaking card rendering.

### 5.2 Platform Limitations

- **No Public API:** Sydney backend is undocumented; requires reverse engineering
- **Microsoft Account Required:** Authentication tied to Microsoft ecosystem
- **Rate Limits:** Free users have message limits per day
- **Feature Gating:** Some features (GPT-4 Turbo, image gen) require Microsoft account

### 5.3 Future Risks

- **Risk 1: API Endpoint Migration** - Microsoft could migrate from sydney.bing.com to new endpoint
  - **Likelihood:** Medium (Microsoft consolidating under copilot.microsoft.com)
  - **Impact:** High (would break interception if we don't update)
  - **Mitigation:** Monitor for 404 errors; maintain multiple endpoint patterns

- **Risk 2: JSON Structure Changes** - Deeply nested structure could evolve
  - **Likelihood:** Medium
  - **Impact:** High (substitution would fail)
  - **Mitigation:** Flexible parsing; handle unknown fields gracefully

- **Risk 3: Adaptive Card Format Changes** - Microsoft could update Adaptive Card spec
  - **Likelihood:** Low (Adaptive Cards are standardized)
  - **Impact:** Medium (would break card parsing)
  - **Mitigation:** Follow Adaptive Card spec; maintain compatibility

---

## 6. Maintenance & Updates

### 6.1 Monitoring

**What to Monitor:**
- **Console Errors:** Look for fetch interception failures
- **Endpoint Errors:** Monitor for 404 on sydney.bing.com
- **Stats Tracking:** Verify stats.byService.copilot increments
- **User Reports:** Track "Copilot not working" issues

**How to Monitor:**
- **Development:** Console logs with `[Copilot]` prefix
- **Production:** Error tracking (future)
- **User Feedback:** Beta tester reports

**Key Log Messages:**
```
✅ Normal Operation:
🌐 [DEBUG] All AI fetch: https://sydney.bing.com/sydney/...
🌐 [DEBUG] isAIRequest? true
✅ Request substituted: X replacements

🔴 Errors:
❌ Substitution failed for copilot
⚠️ Unknown endpoint: copilot.microsoft.com/new-api
⚠️ Nested JSON structure changed
```

### 6.2 Update Checklist

When Copilot updates break integration:
1. [ ] Check DevTools Network tab for endpoint changes
2. [ ] Verify fetch() still used
3. [ ] Check JSON request structure (verify nesting path)
4. [ ] Test endpoint filtering (ensure no false positives)
5. [ ] Verify DOM selectors for observer (when implemented)
6. [ ] Test Adaptive Card rendering
7. [ ] Run full test suite
8. [ ] Update documentation

### 6.3 Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-02 | 0.1.0 | Infrastructure setup (permissions, detection, stats) | Core Team |
| TBD | 0.2.0 | Add endpoint filtering for bing.com | TBD |
| TBD | 1.0.0 | Manual testing + observer implementation | TBD |

---

## 7. Security Considerations

### 7.1 Data Handling

- **Request Data:** Captured via fetch, substituted in-memory, not stored
- **Response Data:** DOM observer decodes in-memory, no persistence
- **Storage:** Only aliases stored (encrypted in chrome.storage.local)
- **Transmission:** Message passing within extension context only

### 7.2 Privacy Impact

- **PII Exposure Risk:** Low (network-level substitution before transmission to Microsoft)
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
- **Substitution Feedback:** Stats in popup (🧑‍💻 icon for Copilot)
- **Error States:** Console errors (development only)

### 8.3 Known UX Issues

| Issue | Impact | Priority | Status |
|-------|--------|----------|--------|
| No observer implemented | High | P1 | Open |
| Endpoint filtering missing | Medium | P1 | Open |
| Adaptive Card handling unknown | Medium | P2 | Open |

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

**Risk Level:** Medium-High (complex nested structure + dual endpoints)

---

## 10. References & Resources

### 10.1 Platform Documentation

- **Official Site:** https://copilot.microsoft.com
- **No public API docs available** - requires reverse engineering
- **Adaptive Cards Docs:** https://adaptivecards.io
- **Microsoft Blog:** https://blogs.microsoft.com/blog/category/ai/

### 10.2 Related Internal Docs

- `docs/platforms/PLATFORM_TEMPLATE.md` - Documentation template
- `docs/current/adding_ai_services.md` - Generic integration guide
- `PLATFORM_TESTING_PLAN.md` - Phase 2B testing plan
- `ROADMAP.md` - Timeline and status

### 10.3 External References

- **Adaptive Cards SDK:** https://docs.microsoft.com/en-us/adaptive-cards/
- **Server-Sent Events MDN:** https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

---

## 11. Quick Reference

### Command Cheat Sheet

```bash
# Build extension
npm run build

# Test on Copilot
# 1. Load unpacked extension
# 2. Navigate to https://copilot.microsoft.com
# 3. Log in with Microsoft account
# 4. Open DevTools console + Network tab
# 5. Send message with PII
# 6. Check Network tab for sydney API calls
# 7. Inspect JSON structure (arguments[0].message.text)
# 8. Verify stats increment in popup (🧑‍💻)
```

### Key Log Messages

```
✅ SUCCESS (Expected):
🌐 [DEBUG] All AI fetch: https://sydney.bing.com/sydney/ChatHub
✅ Request substituted: X replacements

🔴 ERRORS (If Any):
❌ Substitution failed
⚠️ Nested JSON path changed
⚠️ Bing.com false positive (non-Copilot request intercepted)
```

### Troubleshooting Quick Fixes

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Non-Copilot Bing requests intercepted | Broad 'bing.com' pattern | Add endpoint filtering in inject.js |
| Substitution returns 0 replacements | Wrong nested path | Research actual JSON structure in DevTools |
| Stats not incrementing | Service detection failed | Check URL pattern in detectService() |
| Adaptive Cards broken | Card parsing error | Implement Adaptive Card-aware observer |

---

## 12. Implementation Roadmap

### Phase 1: Endpoint Filtering (High Priority)
- [ ] Add endpoint filtering in inject.js
- [ ] Test with copilot.microsoft.com
- [ ] Test with bing.com/chat
- [ ] Verify no false positives (regular Bing searches not intercepted)

### Phase 2: Manual Testing
- [ ] Test fetch() interception
- [ ] Research JSON request structure in DevTools
- [ ] Verify nested path: arguments[0].message.text
- [ ] Research DOM structure for observer

### Phase 3: Nested JSON Handling
- [ ] Implement nested JSON substitution in serviceWorker.ts
- [ ] Handle arguments array
- [ ] Handle message object
- [ ] Test with complex nested structures

### Phase 4: Observer Implementation
- [ ] Create CopilotObserver class
- [ ] Research DOM selectors
- [ ] Implement response decoding
- [ ] Handle Adaptive Cards (if needed)

### Phase 5: Advanced Features
- [ ] Handle web search citations
- [ ] Handle suggested responses
- [ ] Handle image generation prompts
- [ ] Test multimodal inputs

### Phase 6: Production Release
- [ ] Full test suite passing
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] User acceptance testing

---

**Status Summary:**
- ✅ Infrastructure: Complete
- ⚠️ Endpoint Filtering: Needed (P1)
- 🚧 Testing: Pending (Phase 2B target: Nov 9-15)
- ⏳ Observer: Not Implemented
- ⏳ Nested JSON: Needs Research
- 📝 Documentation: Complete (this file)

**Next Steps:**
1. Add endpoint filtering for bing.com
2. Manual testing on copilot.microsoft.com
3. Research JSON structure in DevTools
4. Implement nested JSON substitution in serviceWorker.ts
5. Implement CopilotObserver if needed
6. Update this documentation with findings
