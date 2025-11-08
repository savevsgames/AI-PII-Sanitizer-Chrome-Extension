# Microsoft Copilot - WebSocket Implementation Plan

**Date:** 2025-11-03
**Status:** 🚧 Research & Planning
**Priority:** HIGH
**Complexity:** HIGH (WebSocket interception required)

---

## Discovery Summary

**CRITICAL FINDING:** Microsoft Copilot uses **WebSocket** for real-time chat, NOT standard fetch() API.

### Evidence

**Network Analysis (2025-11-03):**
- **WebSocket Connection:** `wss://copilot.microsoft.com/c/api/chat?api-version=2`
- **Status:** `101 Switching Protocols`
- **Protocol:** WebSocket with Server-Sent Events format
- **Message Format:** JSON events with streaming

**Captured Events:**
```json
{"event":"appendText","messageId":"ic1ekKWy3E2ZctSTqCLHT","partId":"6o7UoG1JxydVSRuF8ks5T","text":". Want to try checking"}
{"event":"appendText","messageId":"ic1ekKWy3E2ZctSTqCLHT","partId":"6o7UoG1JxydVSRuF8ks5T","text":" another one?"}
{"event":"partCompleted","messageId":"ic1ekKWy3E2ZctSTqCLHT","partId":"6o7UoG1JxydVSRuF8ks5T"}
{"event":"done","messageId":"ic1ekKWy3E2ZctSTqCLHT"}
{"event":"titleUpdate","conversationId":"H9b72gf9njaycWArRm1ts","title":"Checking for Palindromes..."}
{"event":"ping"}
{"event":"pong"}
```

**What This Means:**
- ❌ **fetch() interception won't work** - messages sent via WebSocket
- ✅ **Need WebSocket.send() interception**
- ✅ **Response interception via onmessage handler**
- ⚠️ **More complex than ChatGPT/Claude/Perplexity**

---

## Architecture Comparison

### Standard Platforms (ChatGPT, Claude, Perplexity)
```
User Input
  → fetch() API call (HTTP POST)
  → JSON request body
  → Intercept via fetch() wrapper
  → Substitute PII
  → Send to API
  → JSON response
  → Display
```

### Copilot (WebSocket-based)
```
User Input
  → WebSocket.send() call
  → JSON message over persistent connection
  → Need WebSocket.send() interception
  → Substitute PII in message
  → Send via native WebSocket
  → WebSocket.onmessage events (streaming)
  → Need onmessage interception
  → Parse streaming events
  → Display
```

---

## Technical Challenges

### Challenge 1: WebSocket Interception in Page Context
**Problem:** WebSocket connections are established in page context, not isolated world. Need to inject WebSocket interception code similar to Gemini's XHR approach.

**Solution:**
- Intercept `WebSocket.prototype.send()` in inject.js (page context)
- Intercept `WebSocket.prototype.addEventListener('message')` for responses
- Message passing: page context → content script → background → back

**Complexity:** HIGH (similar to Gemini XHR)

### Challenge 2: Persistent Connection
**Problem:** Unlike fetch() (one request = one response), WebSocket maintains persistent connection with multiple messages.

**Solution:**
- Track WebSocket instance
- Intercept all `.send()` calls on that instance
- Match requests to responses via messageId

**Complexity:** MEDIUM

### Challenge 3: Streaming Event Format
**Problem:** Responses come as streaming JSON events (`appendText`, `partCompleted`, `done`), not single response.

**Solution:**
- Buffer streaming events
- Only decode when `done` event received
- Or decode each `appendText` event individually

**Complexity:** MEDIUM

### Challenge 4: Unknown Request Format
**Problem:** We haven't captured the actual request message format yet (what user sends).

**Solution:**
- Implement WebSocket.send() logging first
- Capture outgoing message structure
- Identify where user's query is located
- Update textProcessor.ts with Copilot format

**Complexity:** LOW (once we capture it)

---

## Implementation Plan

### Phase 1: WebSocket Interception Infrastructure (Est: 2-3 hours)

**Goal:** Intercept and log WebSocket messages (requests + responses)

**Tasks:**
1. ✅ Research WebSocket API and interception patterns
2. ⬜ Add WebSocket interception to inject.js (page context)
   - Wrap `WebSocket.prototype.send()`
   - Wrap `WebSocket.prototype.addEventListener('message')`
3. ⬜ Add message passing for WebSocket data
   - Page context → content script → background
4. ⬜ Add logging to capture raw messages
5. ⬜ Test on copilot.microsoft.com with PII
6. ⬜ Analyze captured request/response format

**Deliverable:** Console logs showing full WebSocket request/response format

### Phase 2: Request Format Analysis (Est: 30 min)

**Goal:** Understand Copilot's message structure

**Tasks:**
1. ⬜ Send test message with PII on Copilot
2. ⬜ Capture outgoing WebSocket message
3. ⬜ Document message structure
4. ⬜ Identify where user query is stored (likely nested JSON)
5. ⬜ Add to textProcessor.ts format detection

**Deliverable:** Documented Copilot request format, textProcessor.ts updated

### Phase 3: PII Substitution (Est: 1 hour)

**Goal:** Substitute PII in outgoing WebSocket messages

**Tasks:**
1. ⬜ Send WebSocket message to background for substitution
2. ⬜ Extract text via textProcessor.ts
3. ⬜ Substitute PII → aliases
4. ⬜ Reconstruct WebSocket message
5. ⬜ Send modified message via native WebSocket.send()
6. ⬜ Test with real PII

**Deliverable:** Outgoing messages contain aliases only

### Phase 4: Response Decoding (Est: 2 hours)

**Goal:** Decode aliases → real PII in streaming responses

**Tasks:**
1. ⬜ Intercept WebSocket onmessage events
2. ⬜ Parse streaming JSON events
3. ⬜ Buffer `appendText` events until `done`
4. ⬜ Decode all aliases → real PII
5. ⬜ Emit modified onmessage events to page
6. ⬜ Test full round-trip

**Deliverable:** User sees real PII in Copilot responses

### Phase 5: Testing & Edge Cases (Est: 1-2 hours)

**Goal:** Ensure robust WebSocket handling

**Tasks:**
1. ⬜ Test multiple rapid messages
2. ⬜ Test WebSocket reconnection
3. ⬜ Test message with multiple PII items
4. ⬜ Test citations/sources containing PII
5. ⬜ Test Adaptive Cards (if applicable)
6. ⬜ Performance testing (no lag/blocking)

**Deliverable:** Production-ready Copilot integration

### Phase 6: Documentation (Est: 1 hour)

**Goal:** Complete documentation like Gemini/Perplexity

**Tasks:**
1. ⬜ Update docs/platforms/copilot.md with findings
2. ⬜ Document WebSocket interception pattern
3. ⬜ Add code snippets and examples
4. ⬜ Create troubleshooting guide
5. ⬜ Update platform comparison matrix

**Deliverable:** Complete platform documentation

---

## Estimated Timeline

**Total Estimated Time:** 7-9 hours

| Phase | Time | Priority |
|-------|------|----------|
| Phase 1: WebSocket Infrastructure | 2-3 hours | P0 (Blocker) |
| Phase 2: Request Format Analysis | 0.5 hours | P0 (Blocker) |
| Phase 3: PII Substitution | 1 hour | P0 (Critical) |
| Phase 4: Response Decoding | 2 hours | P1 (High) |
| Phase 5: Testing & Edge Cases | 1-2 hours | P1 (High) |
| Phase 6: Documentation | 1 hour | P2 (Medium) |

**Phases 1-3 (Security):** 3.5-4.5 hours - **Must complete** (protects outgoing PII)
**Phases 4-6 (UX + Docs):** 4-5 hours - **Should complete** (full feature parity)

---

## Code Implementation Examples

### WebSocket.send() Interception Pattern

```javascript
// In inject.js (page context)
if (window.location.hostname.includes('copilot.microsoft.com')) {
  console.log('[Copilot WS] Initializing WebSocket interception');

  const nativeWebSocket = window.WebSocket;
  const nativeSend = WebSocket.prototype.send;

  // Track active WebSocket connections
  const copilotWebSockets = new WeakMap();

  window.WebSocket = function(url, protocols) {
    const ws = new nativeWebSocket(url, protocols);

    // Only intercept Copilot chat WebSocket
    if (url.includes('copilot.microsoft.com/c/api/chat')) {
      console.log('[Copilot WS] Copilot chat WebSocket detected:', url);
      copilotWebSockets.set(ws, { url, shouldIntercept: true });

      // Intercept send()
      ws.send = async function(data) {
        if (!copilotWebSockets.get(this)?.shouldIntercept) {
          return nativeSend.call(this, data);
        }

        console.log('[Copilot WS] Intercepting outgoing message');

        // Send to background for substitution
        const substituteRequest = await new Promise((resolve) => {
          const messageId = Date.now();

          window.postMessage({
            source: 'ai-pii-inject',
            type: 'SUBSTITUTE_REQUEST',
            messageId: messageId,
            payload: {
              service: 'copilot',
              url: url,
              body: data,
              method: 'WEBSOCKET'
            }
          }, '*');

          const listener = (event) => {
            if (event.data?.source === 'ai-pii-content' &&
                event.data?.messageId === messageId) {
              window.removeEventListener('message', listener);
              resolve(event.data.response);
            }
          };
          window.addEventListener('message', listener);

          setTimeout(() => {
            window.removeEventListener('message', listener);
            resolve({ success: false, error: 'Timeout' });
          }, 5000);
        });

        if (substituteRequest?.success) {
          console.log('[Copilot WS] ✅ Sending modified message');
          return nativeSend.call(this, substituteRequest.modifiedBody);
        } else {
          console.error('[Copilot WS] ❌ Substitution failed, sending original');
          return nativeSend.call(this, data);
        }
      };
    }

    return ws;
  };

  // Preserve WebSocket prototype
  window.WebSocket.prototype = nativeWebSocket.prototype;
}
```

### WebSocket.onmessage Interception Pattern

```javascript
// Intercept responses
const nativeAddEventListener = WebSocket.prototype.addEventListener;
WebSocket.prototype.addEventListener = function(type, listener, options) {
  if (type === 'message' && copilotWebSockets.get(this)?.shouldIntercept) {
    console.log('[Copilot WS] Intercepting onmessage handler');

    // Wrap the original listener
    const wrappedListener = async function(event) {
      try {
        // Parse streaming event
        const data = JSON.parse(event.data);

        if (data.event === 'appendText') {
          // Decode aliases in text
          const decodedText = await decodeAliases(data.text);
          data.text = decodedText;

          // Create modified event
          const modifiedEvent = new MessageEvent('message', {
            data: JSON.stringify(data),
            origin: event.origin,
            // ... other properties
          });

          return listener.call(this, modifiedEvent);
        }

        // Pass through other events unchanged
        return listener.call(this, event);
      } catch (err) {
        console.error('[Copilot WS] Error intercepting message:', err);
        return listener.call(this, event);
      }
    };

    return nativeAddEventListener.call(this, type, wrappedListener, options);
  }

  return nativeAddEventListener.call(this, type, listener, options);
};
```

---

## Request Format (To Be Determined)

**Expected Structure (needs verification):**
```json
{
  "type": "chat",
  "invocationId": "...",
  "target": "...",
  "arguments": [
    {
      "source": "cib",
      "optionsSets": [...],
      "allowedMessageTypes": [...],
      "sliceIds": [...],
      "conversationId": "...",
      "participant": {
        "id": "..."
      },
      "message": {
        "text": "Is gregcbarker@gmail.com a palindrome?",  // ⚠️ USER QUERY HERE
        "messageType": "Chat",
        "author": "user",
        "timestamp": "..."
      },
      // ... other fields
    }
  ]
}
```

**To be confirmed after Phase 1 implementation.**

---

## Response Format (Confirmed)

**Streaming Events:**
```json
// Text streaming
{"event":"appendText","messageId":"...","partId":"...","text":"..."}

// Part complete
{"event":"partCompleted","messageId":"...","partId":"..."}

// Message complete
{"event":"done","messageId":"..."}

// Conversation title update
{"event":"titleUpdate","conversationId":"...","title":"..."}

// Keepalive
{"event":"ping"}
{"event":"pong"}
```

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| WebSocket interception breaks Copilot | Medium | High | Thorough testing; fallback to native send() on error |
| Message format changes frequently | Medium | High | Monitor for errors; flexible parsing |
| Performance impact from async interception | Low | Medium | Optimize message passing; async doesn't block |
| Browser security restrictions | Low | High | Use page context injection (proven with Gemini) |

---

## Success Criteria

**Minimum (Security Goal):**
- ✅ Outgoing WebSocket messages contain aliases only
- ✅ Real PII never sent to Microsoft servers
- ✅ No errors or crashes

**Complete (UX Goal):**
- ✅ User sees real PII in responses (decoded)
- ✅ Performance acceptable (<50ms overhead)
- ✅ All edge cases handled
- ✅ Full documentation

---

## Related Implementations

**Similar Complexity:**
- **Gemini XHR Interception** - Intercepts XMLHttpRequest in page context
  - File: `src/content/inject.js` lines 508-697
  - Pattern: Wrap prototype methods, async message passing
  - **Lessons learned:** Page context injection works; careful with async

**Simpler Implementations:**
- **ChatGPT/Claude/Perplexity** - Standard fetch() interception
  - WebSocket is more complex but follows similar pattern

---

## Next Steps

1. **Start with Phase 1** - Get WebSocket interception working with logging
2. **Capture real request format** - Phase 2
3. **Implement substitution** - Phase 3
4. **Decide on response decoding priority** - Phase 4 (can be deferred if time-constrained)

**Recommendation:** Focus on Phases 1-3 first (security), then evaluate time for Phases 4-6 (UX).

---

**Last Updated:** 2025-11-03
**Next Review:** After Phase 1 completion
**Owner:** Core Team
