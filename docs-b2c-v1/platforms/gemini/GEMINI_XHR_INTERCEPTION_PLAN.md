# Gemini XHR Interception Implementation Plan

**Created:** 2025-11-02
**Status:** Planning
**Approach:** Network-Level XHR Interception (Option 1)
**Priority:** High - Core Privacy Feature

---

## Executive Summary

Gemini uses **XMLHttpRequest** instead of `fetch()`, and Google's proprietary **batchexecute RPC format** instead of JSON. This document outlines our plan to implement full network-level interception for Gemini, consistent with our ChatGPT/Claude architecture.

**Goal:** Achieve true privacy protection by intercepting and substituting PII at the network level, before data reaches Google's servers.

---

## Why Full XHR Interception (Not DOM-Only)

### Core Value Proposition
- **True Privacy:** Google never sees real PII, only aliases
- **Architectural Consistency:** All services use network-level interception
- **User Trust:** "Network-level protection" is a stronger security claim
- **Future-Proof:** Builds reusable XHR interception for other services

### Why Not DOM-Only?
- ❌ Not true network-level protection
- ❌ Race conditions (user types fast, clicks before substitution)
- ❌ Inconsistent with ChatGPT/Claude architecture
- ❌ Weaker security claim for marketing

---

## Current State Analysis

### ✅ What's Working
- DOM Observer successfully loads 6 aliases from V2 profiles
- Service detection identifies Gemini correctly
- Badge shows "PROTECTED" status
- Content script injection works

### ❌ What's Not Working
- **Gemini uses XHR, not fetch** - our fetch wrapper never intercepts requests
- **Real PII sent to Google** - no request substitution happening
- **Real PII shown in responses** - no response decoding happening

### 🔍 Discovery Findings
From console logs, Gemini makes XHR POST requests to:
```
/_/BardChatUi/data/batchexecute?rpcids=L5adhe&source-path=%2Fapp&...
```

Request body format: Google's proprietary batchexecute RPC format (form-encoded, ~900 bytes for messages)

---

## Technical Architecture

### Overview
```
User Input → XHR Interceptor → Background (Substitution) → Google (Aliases)
                                      ↓
Google Response → XHR Interceptor → Background (Decoding) → User (Real PII)
```

### Component Design

#### 1. Generic XHR Interceptor (`src/content/xhr-interceptor.ts`)

**Purpose:** Reusable XHR interception framework for any service

**Key Features:**
- Intercept `XMLHttpRequest.prototype.open()` and `.send()`
- Convert synchronous XHR to async promise-based flow
- Support for request body modification
- Support for response interception and modification
- Non-breaking - preserve XHR API contract
- Error handling and fallback to native XHR

**API Design:**
```typescript
interface XHRInterceptorConfig {
  shouldIntercept: (url: string, method: string) => boolean;
  onRequest: (body: any, url: string) => Promise<{ modifiedBody: any; metadata: any }>;
  onResponse: (responseText: string, metadata: any) => Promise<string>;
  onError: (error: Error) => void;
}

class XHRInterceptor {
  constructor(config: XHRInterceptorConfig);
  enable(): void;
  disable(): void;
}
```

**Implementation Strategy:**
```typescript
// Intercept open() to capture URL and method
XMLHttpRequest.prototype.open = function(method, url, async, ...args) {
  this._interceptorUrl = url;
  this._interceptorMethod = method;
  this._interceptorAsync = async !== false; // default true
  return nativeOpen.apply(this, [method, url, async, ...args]);
};

// Intercept send() for request/response handling
XMLHttpRequest.prototype.send = function(body) {
  // Check if this request should be intercepted
  if (!config.shouldIntercept(this._interceptorUrl, this._interceptorMethod)) {
    return nativeSend.apply(this, [body]);
  }

  // For async XHR, we can intercept properly
  if (this._interceptorAsync) {
    return handleAsyncXHR(this, body);
  } else {
    // Synchronous XHR - cannot intercept (deprecated anyway)
    console.warn('[XHR Interceptor] Sync XHR not supported, passing through');
    return nativeSend.apply(this, [body]);
  }
};

async function handleAsyncXHR(xhr, originalBody) {
  // Step 1: Substitute request body (real → alias)
  const { modifiedBody, metadata } = await config.onRequest(originalBody, xhr._interceptorUrl);

  // Step 2: Set up response interceptor
  const nativeOnReadyStateChange = xhr.onreadystatechange;
  xhr.onreadystatechange = async function() {
    if (this.readyState === XMLHttpRequest.DONE) {
      // Step 3: Intercept response and decode (alias → real)
      const decodedResponse = await config.onResponse(this.responseText, metadata);

      // Step 4: Replace response text
      Object.defineProperty(this, 'responseText', {
        value: decodedResponse,
        writable: false,
        configurable: true
      });
    }

    // Call original handler
    if (nativeOnReadyStateChange) {
      nativeOnReadyStateChange.apply(this, arguments);
    }
  };

  // Step 5: Send modified request
  return nativeSend.call(xhr, modifiedBody);
}
```

#### 2. Gemini-Specific Handler (`src/content/gemini-xhr-handler.ts`)

**Purpose:** Gemini-specific batchexecute format handling

**Responsibilities:**
- Parse batchexecute request format
- Extract text content from RPC payload
- Reconstruct batchexecute format after substitution
- Parse batchexecute response format
- Decode response text

**batchexecute Format Analysis:**

**Request Format (form-encoded):**
```
f.req=[[[<rpcid>], [<params array>], null, <context>]]
at=<token>
```

Where `<params array>` contains the actual message text nested in a complex structure.

**Example payload structure (decoded):**
```
[
  [["L5adhe"], [
    [
      ["can you make a short poem with my email in it? gregcbarker@gmail.com"],
      null,
      ["conversation_id_here"],
      ...metadata
    ]
  ], null, "generic"]
]
```

**Response Format:**
```javascript
// Response is wrapped in )]}'  prefix (XSSI protection)
// Then contains multiple lines of JSON arrays
)]}'
[
  [null, null, null, null, null, [1]]
]
[
  ["wrb.fr", "L5adhe", [[["response text here..."]], null, null, ...], 42]
]
```

**Implementation:**
```typescript
export class GeminiBatchExecuteHandler {
  // Parse request body and extract text content
  parseRequest(formBody: string): { text: string; structure: any } {
    // 1. Parse form-encoded body
    const params = new URLSearchParams(formBody);
    const freqParam = params.get('f.req');

    // 2. Parse JSON structure
    const rpcData = JSON.parse(freqParam);

    // 3. Navigate to message text (structure varies by rpcid)
    // Pattern: rpcData[0][0][1][0][0] or similar
    const messageText = this.extractTextFromStructure(rpcData);

    return { text: messageText, structure: rpcData };
  }

  // Reconstruct request with substituted text
  reconstructRequest(originalBody: string, substitutedText: string, structure: any): string {
    // 1. Clone structure
    const modifiedStructure = JSON.parse(JSON.stringify(structure));

    // 2. Replace text in structure
    this.injectTextIntoStructure(modifiedStructure, substitutedText);

    // 3. Rebuild form-encoded body
    const params = new URLSearchParams(originalBody);
    params.set('f.req', JSON.stringify(modifiedStructure));

    return params.toString();
  }

  // Parse response and extract text
  parseResponse(responseText: string): { text: string; structure: any } {
    // 1. Remove XSSI prefix
    const cleaned = responseText.replace(/^\)\]\}'\n/, '');

    // 2. Split into JSON chunks (one per line)
    const chunks = cleaned.split('\n').filter(line => line.trim());

    // 3. Find response chunk (usually has rpcid in it)
    const responseChunk = chunks.find(chunk => chunk.includes('"wrb.fr"'));

    if (!responseChunk) return { text: '', structure: null };

    const data = JSON.parse(responseChunk);

    // 4. Extract response text (structure: data[1][2][0][0] or similar)
    const responseText = this.extractResponseText(data);

    return { text: responseText, structure: data };
  }

  // Reconstruct response with decoded text
  reconstructResponse(originalResponse: string, decodedText: string, structure: any): string {
    // Similar to reconstructRequest but for response format
    // ...
  }
}
```

#### 3. Integration with inject.js

**Update `inject.js` to initialize XHR interceptor:**

```javascript
// Initialize XHR interceptor for Gemini
if (window.location.hostname.includes('gemini.google.com')) {
  const geminiHandler = new GeminiBatchExecuteHandler();

  const interceptor = new XHRInterceptor({
    shouldIntercept: (url, method) => {
      return method === 'POST' &&
             (url.includes('BardChatUi') || url.includes('batchexecute'));
    },

    onRequest: async (body, url) => {
      console.log('🔒 [Gemini XHR] Intercepting request');

      // Parse batchexecute format
      const { text, structure } = geminiHandler.parseRequest(body);

      // Send to background for substitution (real → alias)
      const substituted = await sendToBackground({
        type: 'SUBSTITUTE_REQUEST',
        payload: { body: text, url }
      });

      if (!substituted.success) {
        throw new Error('Substitution failed');
      }

      // Reconstruct with substituted text
      const modifiedBody = geminiHandler.reconstructRequest(
        body,
        substituted.modifiedBody,
        structure
      );

      return {
        modifiedBody,
        metadata: { originalStructure: structure }
      };
    },

    onResponse: async (responseText, metadata) => {
      console.log('🔓 [Gemini XHR] Intercepting response');

      // Parse batchexecute response
      const { text, structure } = geminiHandler.parseResponse(responseText);

      // Send to background for decoding (alias → real)
      const decoded = await sendToBackground({
        type: 'SUBSTITUTE_RESPONSE',
        payload: { body: text }
      });

      if (!decoded.success) {
        return responseText; // Fallback to original
      }

      // Reconstruct with decoded text
      const modifiedResponse = geminiHandler.reconstructResponse(
        responseText,
        decoded.modifiedBody,
        structure
      );

      return modifiedResponse;
    },

    onError: (error) => {
      console.error('[Gemini XHR] Interception error:', error);
    }
  });

  interceptor.enable();
  console.log('✅ [Gemini XHR] Interceptor enabled');
}
```

---

## Implementation Phases

### Phase 1: Generic XHR Interceptor (Week 1, Days 1-3)

**Tasks:**
1. Create `src/content/xhr-interceptor.ts`
2. Implement XHR.prototype.open/send interception
3. Handle async XHR properly (promises, state management)
4. Preserve XHR API contract (events, properties, methods)
5. Add comprehensive error handling
6. Write unit tests for interceptor

**Deliverables:**
- ✅ Generic XHR interceptor that works with any service
- ✅ Non-breaking - preserves normal XHR functionality
- ✅ Promise-based async API for request/response handling

**Success Criteria:**
- Can intercept XHR requests without breaking Gemini
- Can modify request body before sending
- Can modify response text before delivery to page

### Phase 2: batchexecute Format Analysis (Week 1, Days 4-5)

**Tasks:**
1. Capture real batchexecute requests/responses
2. Reverse engineer the structure
3. Document the format variations (different rpcids)
4. Build parser for request format
5. Build parser for response format
6. Test with various message types (text, multiline, special chars)

**Deliverables:**
- ✅ Documentation of batchexecute format
- ✅ Parser that can extract text from requests
- ✅ Parser that can extract text from responses

**Tools:**
- Chrome DevTools Network tab (Copy as cURL, fetch)
- Console logging of intercepted XHR bodies
- JSON parsing and pretty-printing

### Phase 3: Gemini Handler Implementation (Week 2, Days 1-3)

**Tasks:**
1. Create `src/content/gemini-xhr-handler.ts`
2. Implement `parseRequest()` - extract text from batchexecute
3. Implement `reconstructRequest()` - rebuild with substituted text
4. Implement `parseResponse()` - extract text from response
5. Implement `reconstructResponse()` - rebuild with decoded text
6. Handle edge cases (empty messages, special characters, multiline)

**Deliverables:**
- ✅ GeminiBatchExecuteHandler class
- ✅ Can parse and reconstruct batchexecute format
- ✅ Handles various message types

### Phase 4: Integration & Testing (Week 2, Days 4-5)

**Tasks:**
1. Integrate XHR interceptor into `inject.js`
2. Wire up Gemini handler
3. Test request substitution (real → alias)
4. Test response decoding (alias → real)
5. Test with various profiles (name, email, phone, etc.)
6. Verify no regressions in ChatGPT/Claude

**Deliverables:**
- ✅ Full end-to-end flow working
- ✅ Gemini shows real PII in responses
- ✅ Google's servers receive only aliases
- ✅ No breaking changes to other services

### Phase 5: Fallback & Polish (Week 3)

**Tasks:**
1. Keep DOM observer as fallback (if XHR fails)
2. Add detailed logging for debugging
3. Add error recovery mechanisms
4. Performance testing
5. Documentation updates

**Deliverables:**
- ✅ Robust solution with fallback
- ✅ Production-ready code
- ✅ Updated documentation

---

## Testing Strategy

### Unit Tests
- XHR interceptor state management
- batchexecute parser with various payloads
- Request reconstruction accuracy
- Response reconstruction accuracy

### Integration Tests
- Full request/response cycle
- Multiple profiles
- Various PII types (name, email, phone)
- Special characters and encoding

### Manual Testing
- Send messages with real PII
- Verify aliases in Network tab (Chrome DevTools)
- Verify real PII in displayed response
- Test with long messages, multiline, code blocks
- Test conversation history loading

### Regression Testing
- ChatGPT still works
- Claude still works
- Popup UI still works
- Profile management still works

---

## Risk Mitigation

### Risk 1: batchexecute Format Changes
**Risk:** Google changes format without notice
**Mitigation:**
- Keep DOM observer as fallback
- Version detection (check response structure)
- Graceful degradation (log error, use fallback)
- Monitor for format changes in production

### Risk 2: XHR Interception Breaks Gemini
**Risk:** Our interception causes Gemini to malfunction
**Mitigation:**
- Extensive testing before release
- Preserve exact XHR API contract
- Add kill switch (disable interception on error)
- Use try-catch everywhere

### Risk 3: Performance Impact
**Risk:** XHR interception slows down Gemini
**Mitigation:**
- Benchmark interception overhead
- Optimize batchexecute parsing
- Use caching where possible
- Profile with Chrome DevTools

### Risk 4: Response Parsing Failures
**Risk:** Can't parse some response types
**Mitigation:**
- Start with text-only messages
- Add support for other content types incrementally
- Fallback to original response on parse error
- DOM observer catches anything we miss

---

## Success Criteria

### Must Have
- ✅ Google receives only aliases (verified in Network tab)
- ✅ Users see real PII in responses
- ✅ No regression in ChatGPT/Claude
- ✅ No breaking of Gemini functionality
- ✅ Works with multiple profile types

### Nice to Have
- ✅ Handles all message types (text, multiline, code)
- ✅ < 50ms overhead per request
- ✅ Detailed debug logging
- ✅ Graceful error recovery

### Out of Scope (Future)
- Image/file uploads
- Gemini Advanced features
- Gemini extensions/plugins
- Voice input

---

## Timeline

**Total Estimated Time:** 2-3 weeks

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: XHR Interceptor | 3 days | Week 1 Day 1 | Week 1 Day 3 |
| Phase 2: Format Analysis | 2 days | Week 1 Day 4 | Week 1 Day 5 |
| Phase 3: Gemini Handler | 3 days | Week 2 Day 1 | Week 2 Day 3 |
| Phase 4: Integration | 2 days | Week 2 Day 4 | Week 2 Day 5 |
| Phase 5: Polish | 5 days | Week 3 | Week 3 |

---

## Next Steps

1. ✅ Get user approval on this plan
2. ⬜ Start Phase 1: Build generic XHR interceptor
3. ⬜ Capture and analyze real batchexecute payloads
4. ⬜ Implement Gemini handler
5. ⬜ Test and validate end-to-end

---

## Related Documents

- [Old DOM Observer Plan](./GEMINI_IMPLEMENTATION_PLAN.md) - Phase 1 approach (deprecated)
- [Architecture Overview](../ARCHITECTURE.md)
- [ChatGPT/Claude Implementation](../../src/content/inject.js) - fetch interception reference

---

**Status:** Ready to implement
**Approved:** [Pending user approval]
**Next Action:** Build XHR interceptor framework
