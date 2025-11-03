# Platform Support: Poe

> **Template Version:** 1.0
> **Last Updated:** 2025-11-02
> **Status:** 🚧 In Development (Infrastructure Ready, Testing Pending)

---

## Platform: Poe

**URL Pattern:** `*.poe.com`
**Status:** 🚧 Infrastructure Complete, Manual Testing Pending
**Implementation Date:** 2025-11-02 (infrastructure)
**Last Updated:** 2025-11-02
**Maintained By:** Core Team

---

## 1. Platform Overview

### Description
Poe (Platform for Open Exploration) is Quora's AI chatbot aggregation platform that provides access to multiple AI models through a single interface, including ChatGPT, Claude, GPT-4, Google PaLM, and custom community bots. Users can switch between different AI models in the same conversation.

### User Base & Priority
- **Estimated Users:** 5M+ monthly active users (estimated)
- **Priority Level:** Medium
- **Business Impact:** Unique multi-model aggregator; important for users who want access to multiple AIs without separate subscriptions

### Key Characteristics
- **API Type:** REST API (possibly GraphQL)
- **Request Format:** JSON or GraphQL query (needs verification)
- **Response Format:** JSON (likely streaming via SSE)
- **Authentication:** Cookie-based session (poe.com account or Quora account)
- **Special Feature:** **Multi-model routing** - Same interface routes to ChatGPT, Claude, GPT-4, etc.

---

## 2. Technical Implementation

### 2.1 Detection & Initialization

**Hostname Detection:**
```javascript
// Pattern used in serviceWorker.ts
if (url.includes('poe.com')) return 'poe';

// Pattern configured in manifest.json
"host_permissions": ["*://poe.com/*"]
```

**URL Patterns Supported:**
- `https://poe.com/` - Main chat interface
- `https://www.poe.com/` - Alternative main domain
- `https://poe.com/api/*` - API endpoints (presumed)
- `https://poe.com/[bot-name]` - Individual bot chats (e.g., /ChatGPT, /Claude-instant)

**Initialization Sequence:**
1. Content script detects `poe.com` hostname
2. Fetch interceptor initializes (inject.js)
3. Profiles/aliases loaded from background
4. Observer may need implementation for DOM-based responses
5. Extension ready to intercept requests

### 2.2 Request Interception Method

**Primary Method:** fetch() interception (standard)

**Why This Method:**
Poe likely uses modern fetch() API for requests, similar to ChatGPT and Claude. However, Poe may use **GraphQL** instead of REST, which requires slightly different request/response handling.

**Implementation Location:**
- **File:** `src/content/inject.js`
- **Function:** Anonymous IIFE wrapping fetch()
- **Lines:** 172-197 (aiDomains array includes 'poe.com')

**Interception Pattern:**
```javascript
// From inject.js aiDomains array
const aiDomains = [
  // ...
  'poe.com',
  // ...
];

// Existing fetch interceptor will catch API calls
// Works for both REST and GraphQL (both use fetch + JSON)
```

**GraphQL Handling (If Applicable):**
```javascript
// GraphQL requests have this structure:
{
  "query": "mutation SendMessage($input: MessageInput!) { ... }",
  "variables": {
    "input": {
      "message": "What is gregcbarker@gmail.com?",
      "bot": "ChatGPT"
    }
  }
}

// Substitution must search inside variables object
```

### 2.3 Request/Response Format

**Request Structure (REST - Assumed):**
```json
{
  "message": "What is my email address gregcbarker@gmail.com?",
  "bot": "ChatGPT",
  "conversation_id": "abc123",
  "context": []
}
```

**Request Structure (GraphQL - Possible Alternative):**
```json
{
  "query": "mutation SendMessage($input: MessageInput!) { sendMessage(input: $input) { id text bot } }",
  "variables": {
    "input": {
      "message": "What is gregcbarker@gmail.com?",
      "bot": "Claude-instant",
      "conversationId": "abc123"
    }
  }
}
```

**Request Endpoint Pattern (Presumed):**
```
POST /api/send_message
POST /api/graphql (if GraphQL)
POST /api/gql_POST (Quora's GraphQL endpoint pattern)
```

**Response Structure (Assumed):**
```json
{
  "id": "msg_123",
  "text": "Your email address is gregcbarker@gmail.com",
  "bot": "ChatGPT",
  "model": "gpt-4",
  "streaming": false
}
```

**Streaming Support:** Yes - likely Server-Sent Events (SSE) similar to ChatGPT

### 2.4 PII Substitution Strategy

**Request Substitution (Planned):**
- **Location in Request:**
  - REST: Inside `message` field
  - GraphQL: Inside `variables.input.message` field
- **Encoding/Decoding Required:** No - standard JSON
- **Special Handling:**
  - GraphQL: Must search nested variables object
  - Bot parameter: Different bots may handle PII differently (untested)
  - Context array: May contain previous messages with PII

**Response Substitution (Planned):**
- **Location in Response:** Inside `text` field (or GraphQL response path)
- **DOM Observation:** Likely needed - Poe renders markdown responses
- **Special Handling:**
  - Bot attribution: Responses include which bot answered (ChatGPT vs Claude vs GPT-4)
  - Streaming: May receive partial responses via SSE

**Example Flow (Planned):**
```
User Input (Real PII: gregcbarker@gmail.com)
  → User selects bot (e.g., "Claude-instant")
  → inject.js captures via fetch()
  → chrome.runtime.sendMessage → serviceWorker.ts
  → Detect REST vs GraphQL format
  → Substitute: gregcbarker@gmail.com → blocked-email@promptblocker.com
  → API Request sent to Poe (Aliases)
  ↓
  → Poe routes to selected bot backend (Claude API, OpenAI API, etc.)
  → Bot sees only alias
  → Response returned to Poe
  ↓
  → API Response received (Aliases)
  → Poe renders response in DOM
  ↓
  → Poe Observer detects mutations (TODO: implement)
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
| `src/popup/components/statsRenderer.ts` | UI stats display | SERVICE_ICONS | ✅ Complete (🎭 icon) |
| `src/observers/poe-observer.ts` | DOM observation (future) | N/A | ⏳ Not Implemented |

**Note:** Poe uses same icon (🎭) as Claude in stats renderer.

### 3.2 Message Passing Flow

```
[Poe Page - poe.com]
     ↓
inject.js (page context) - fetch() intercepted
     ↓ chrome.runtime.sendMessage (via content.ts relay)
serviceWorker.ts (background)
     ↓ detectService() → 'poe'
     ↓ JSON.parse(body)
     ↓ Check if GraphQL or REST
     ↓ Substitute PII in message (or variables.input.message)
     ↓ JSON.stringify(modifiedBody)
     ↓ Return { success: true, modifiedBody, substitutions }
inject.js (page context)
     ↓ native fetch() with modified data
[Modified Request Sent to Poe]
     ↓
[Poe Routes to Backend Bot (ChatGPT/Claude/GPT-4)]
     ↓
[Backend Sees Only Aliases]
     ↓
[Response Received from Backend]
     ↓ Poe renders in DOM
Poe Observer (content.ts - FUTURE)
     ↓ MutationObserver detects changes
     ↓ Decodes aliases → real PII
     ↓ Updates DOM for user
[User Sees Real PII]
```

### 3.3 Observer Implementation

**Observer Type:** MutationObserver (PLANNED - Not Yet Implemented)

**Target Selectors (Needs Research):**
- **Chat Input:** `[data-testid="message-input"]` or `.ChatMessageInputContainer` (TBD)
- **Response Container:** `.Message_botMessageBubble` or `[data-message-id]` (TBD)
- **Bot Attribution:** `.BotHeader` or similar (TBD)

**Observer Configuration (Planned):**
```javascript
{
  childList: true,
  subtree: true,
  characterData: true
}
```

**⚠️ TODO:** Research actual DOM selectors on poe.com

---

## 4. Testing & Validation

### 4.1 Test Scenarios

**Basic Functionality:**
- [ ] Platform detection works on poe.com
- [ ] Fetch interceptor captures API calls
- [ ] PII substitution works in requests (REST)
- [ ] PII substitution works in requests (GraphQL if applicable)
- [ ] Response decoding works (DOM observer)
- [ ] User sees real PII in UI
- [ ] Backend bot sees only aliases
- [ ] Stats increment correctly (🎭 icon)

**Multi-Model Edge Cases:**
- [ ] Test with ChatGPT bot
- [ ] Test with Claude-instant bot
- [ ] Test with GPT-4 bot
- [ ] Test with community custom bots
- [ ] Switch bots mid-conversation
- [ ] Test bot-specific features (image upload, code execution, etc.)

**Performance:**
- [ ] No noticeable latency added
- [ ] Streaming responses not disrupted
- [ ] Bot switching not affected

### 4.2 Known Issues

| Issue | Severity | Status | Workaround |
|-------|----------|--------|------------|
| DOM observer not implemented | High | Open | No response decoding yet |
| GraphQL support unknown | Medium | Open | May need special handling |
| Multi-model behavior untested | Medium | Open | Each bot may behave differently |

### 4.3 Test Results

**Last Tested:** Not yet tested
**Tester:** N/A
**Environment:** N/A

**Results:**
- ⏳ Pending manual testing (Phase 2B target: Nov 9-15)

**Test Plan from ROADMAP:**
1. Load extension with Poe permissions
2. Navigate to poe.com
3. Test with multiple bots:
   - ChatGPT
   - Claude-instant
   - GPT-4
   - Custom bot
4. Send message with PII
5. Check Network tab for substitution
6. Verify stats increment (🎭 icon)
7. Switch bots and repeat

---

## 5. Platform-Specific Challenges

### 5.1 Technical Challenges

**Challenge 1: Multi-Model Routing**
- **Problem:** Poe aggregates multiple AI backends. Each backend (ChatGPT vs Claude vs GPT-4) may have different API formats, even though Poe normalizes the interface.
- **Solution:** Test with each major bot backend to ensure substitution works across all. Poe's normalization layer should make this transparent to us.
- **Trade-offs:** Need to test with multiple bot subscriptions (some bots require Poe Premium).

**Challenge 2: GraphQL vs REST**
- **Problem:** Poe may use GraphQL instead of REST. GraphQL requests have nested variables structure that requires different substitution logic.
- **Solution:** Detect GraphQL requests (look for `query` and `variables` fields) and search nested `variables` object.
- **Trade-offs:** More complex parsing logic; need to handle both formats.

**Challenge 3: Bot-Specific Features**
- **Problem:** Some Poe bots have special features (image upload to GPT-4-Vision, code execution, web search). These may use different endpoints or formats.
- **Solution:** Test each feature separately; ensure substitution works for all input types.
- **Trade-offs:** Higher testing complexity; maintenance burden.

### 5.2 Platform Limitations

- **No Public API:** Poe API is undocumented; requires reverse engineering
- **Premium Features:** Some bots (GPT-4, Claude-2) require Poe Premium subscription
- **Rate Limits:** Free users have message limits per day
- **Bot Availability:** Bots may go offline or change over time

### 5.3 Future Risks

- **Risk 1: API Format Changes** - Poe could change API structure
  - **Likelihood:** Medium (Poe is actively developed)
  - **Impact:** High (would break interception)
  - **Mitigation:** Monitor for errors; maintain version history

- **Risk 2: Bot Backend Changes** - Individual bots could change behavior
  - **Likelihood:** High (bots updated by providers)
  - **Impact:** Low-Medium (Poe's normalization layer should handle)
  - **Mitigation:** Test with multiple bots regularly

- **Risk 3: GraphQL Schema Changes** - If using GraphQL, schema could evolve
  - **Likelihood:** Medium
  - **Impact:** Medium (would require updating substitution logic)
  - **Mitigation:** Flexible parsing; handle unknown fields gracefully

---

## 6. Maintenance & Updates

### 6.1 Monitoring

**What to Monitor:**
- **Console Errors:** Look for fetch interception failures
- **GraphQL Errors:** Monitor for GraphQL-specific errors
- **Stats Tracking:** Verify stats.byService.poe increments
- **Bot-Specific Issues:** Track per-bot failures

**How to Monitor:**
- **Development:** Console logs with `[Poe]` prefix
- **Production:** Error tracking (future)
- **User Feedback:** Beta tester reports

**Key Log Messages:**
```
✅ Normal Operation:
🌐 [DEBUG] All AI fetch: https://poe.com/api/...
🌐 [DEBUG] isAIRequest? true
✅ Request substituted: X replacements

🔴 Errors:
❌ Substitution failed for poe
⚠️ GraphQL query detected but not handled
⚠️ Unknown bot: [bot-name]
```

### 6.2 Update Checklist

When Poe updates break integration:
1. [ ] Check DevTools Network tab for endpoint changes
2. [ ] Verify fetch() still used
3. [ ] Check if GraphQL schema changed
4. [ ] Test with major bots (ChatGPT, Claude, GPT-4)
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

- **Request Data:** Captured via fetch, substituted in-memory, not stored
- **Response Data:** DOM observer decodes in-memory, no persistence
- **Storage:** Only aliases stored (encrypted in chrome.storage.local)
- **Transmission:** Message passing within extension context only

### 7.2 Privacy Impact

- **PII Exposure Risk:** Low (network-level substitution before transmission to Poe)
- **Backend Exposure:** Backend bots (ChatGPT API, Claude API) see only aliases
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
- **Substitution Feedback:** Stats in popup (🎭 icon for Poe)
- **Error States:** Console errors (development only)

### 8.3 Known UX Issues

| Issue | Impact | Priority | Status |
|-------|--------|----------|--------|
| No observer implemented | High | P1 | Open |
| GraphQL handling unknown | Medium | P2 | Open |
| Multi-bot testing incomplete | Medium | P2 | Open |

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

**Risk Level:** Medium (multi-model complexity)

**Potential Breaking Changes:**
1. Poe changes API format (REST → GraphQL or vice versa)
2. Bot routing logic changes
3. Premium features paywall critical functionality

---

## 10. References & Resources

### 10.1 Platform Documentation

- **Official Site:** https://poe.com
- **No public API docs available** - requires reverse engineering
- **Quora Blog:** https://quorablog.quora.com (Poe announcements)

### 10.2 Related Internal Docs

- `docs/platforms/PLATFORM_TEMPLATE.md` - Documentation template
- `docs/current/adding_ai_services.md` - Generic integration guide
- `PLATFORM_TESTING_PLAN.md` - Phase 2B testing plan
- `ROADMAP.md` - Timeline and status

### 10.3 External References

- **GraphQL Spec:** https://graphql.org/learn/
- **Server-Sent Events MDN:** https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

---

## 11. Quick Reference

### Command Cheat Sheet

```bash
# Build extension
npm run build

# Test on Poe
# 1. Load unpacked extension
# 2. Navigate to https://poe.com
# 3. Create account or log in
# 4. Select a bot (e.g., ChatGPT)
# 5. Open DevTools console + Network tab
# 6. Send message with PII
# 7. Check Network tab for API calls
# 8. Verify stats increment in popup (🎭)

# Test with multiple bots
# Repeat above with:
# - ChatGPT
# - Claude-instant
# - GPT-4 (requires Premium)
# - Custom community bot
```

### Key Log Messages

```
✅ SUCCESS (Expected):
🌐 [DEBUG] All AI fetch: https://poe.com/api/...
✅ Request substituted: X replacements

🔴 ERRORS (If Any):
❌ Substitution failed
⚠️ GraphQL query not handled
⚠️ Bot-specific error
```

### Troubleshooting Quick Fixes

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| No interception | Wrong endpoint pattern | Research actual API endpoint in DevTools |
| GraphQL parsing error | Nested variables not handled | Implement GraphQL-specific substitution |
| Bot-specific failure | Different bot API format | Test with each bot backend separately |
| Stats not incrementing | Service detection failed | Check URL pattern in detectService() |

---

## 12. Implementation Roadmap

### Phase 1: Manual Testing (Current)
- [ ] Test fetch() interception on poe.com
- [ ] Verify request substitution works (REST)
- [ ] Check if GraphQL used (look for `query` field in Network tab)
- [ ] Research DOM structure for observer
- [ ] Test with at least 2 different bots

### Phase 2: GraphQL Support (If Needed)
- [ ] Detect GraphQL requests
- [ ] Implement nested variables substitution
- [ ] Test with GraphQL endpoint

### Phase 3: Observer Implementation
- [ ] Create PoeObserver class
- [ ] Research DOM selectors
- [ ] Implement response decoding
- [ ] Handle bot-specific rendering

### Phase 4: Multi-Bot Testing
- [ ] Test with ChatGPT bot
- [ ] Test with Claude-instant bot
- [ ] Test with GPT-4 bot (Premium)
- [ ] Test with custom community bot
- [ ] Verify all work correctly

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
- ⏳ GraphQL: Unknown (needs research)
- 📝 Documentation: Complete (this file)

**Next Steps:**
1. Manual testing on poe.com
2. Research actual API endpoints in DevTools
3. Determine if GraphQL or REST
4. Implement PoeObserver if needed
5. Test with multiple bot backends
6. Update this documentation with findings
