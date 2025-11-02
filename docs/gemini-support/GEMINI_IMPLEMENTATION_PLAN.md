# Gemini Support Implementation Plan

**Created:** 2025-11-02
**Status:** Planning Phase
**Approach:** DOM-based text replacement (Phase 1)

---

## Executive Summary

Gemini uses a proprietary Google RPC format (batchexecute) that differs significantly from ChatGPT/Claude's JSON-based APIs. Instead of trying to parse this complex format, we'll implement DOM-level text replacement using MutationObserver to watch for response text and decode aliases back to real names.

---

## Problem Analysis

### Current State
- ✅ Manifest permissions for `gemini.google.com` exist
- ✅ Service detection identifies Gemini correctly
- ✅ Badge shows "PROTECTED" on Gemini pages
- ✅ Content script injected successfully
- ⚠️ **Request interception not working** - Gemini uses form-encoded batchexecute format
- ❌ **Response decoding not working** - Responses show real names instead of aliases

### Root Cause
**Gemini's API Format:**
- Endpoint: `https://gemini.google.com/_/BardChatUi/data/batchexecute`
- Method: POST
- Content-Type: `application/x-www-form-urlencoded` (not JSON!)
- Payload: Google's proprietary RPC format with encoded parameters
- Response: Binary/encoded data, not standard JSON

**Current Code Assumptions:**
```javascript
// inject.js expects JSON request bodies
const requestBody = JSON.parse(body);

// textProcessor.ts expects JSON response bodies
const data = JSON.parse(responseText);
```

These assumptions break for Gemini's format.

---

## Solution: Two-Phase Approach

### Phase 1: DOM-Based Text Replacement (This Plan)
**Goal:** Get Gemini working quickly with minimal risk to existing services

**How it works:**
1. ✅ Requests still get intercepted by fetch wrapper
2. ✅ Request body substitution attempts (may fail gracefully)
3. ❌ Skip response body parsing (too complex)
4. ✅ Watch DOM for response text appearing on page
5. ✅ Replace aliases → real names in displayed text

**Pros:**
- Fast to implement (1-2 days)
- Low risk - doesn't touch ChatGPT/Claude code
- Works regardless of API format changes
- Easier to debug (visible in UI)

**Cons:**
- Slight delay before text replacement shows
- Doesn't work if responses are in iframes/shadow DOM
- May miss text in dynamically loaded elements

### Phase 2: Full API Format Support (Future)
**Goal:** Native request/response interception like ChatGPT/Claude

**Deferred because:**
- Requires reverse-engineering Google's RPC format
- Format may change without notice
- High complexity, high maintenance burden
- Phase 1 provides 90% of functionality

---

## Architecture Design

### File Structure
```
src/
├── content/
│   ├── content.ts              (existing - no changes)
│   ├── inject.js               (existing - updated endpoint)
│   └── observers/              (NEW)
│       ├── gemini-observer.ts  (NEW - Gemini DOM watcher)
│       ├── index.ts            (NEW - observer registry)
│       └── types.ts            (NEW - shared types)
```

### Component Responsibilities

#### 1. `gemini-observer.ts` (NEW)
**Purpose:** Watch Gemini's DOM for response text and replace aliases

**Key Features:**
- MutationObserver watching for new text nodes
- Service-specific selectors (only activate on Gemini pages)
- Debounced text replacement to avoid performance issues
- Safe failure (doesn't break page if something goes wrong)

**Pseudo-code:**
```typescript
class GeminiObserver {
  private observer: MutationObserver;
  private aliasMap: Map<string, string>; // alias → real

  start() {
    // Only run on gemini.google.com
    if (!window.location.hostname.includes('gemini.google.com')) return;

    // Watch for response containers being added/modified
    this.observer = new MutationObserver(this.handleMutations);
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  handleMutations(mutations) {
    // Find text nodes in Gemini response containers
    // Replace aliases with real names
    // Use debounce to avoid excessive processing
  }

  stop() {
    this.observer?.disconnect();
  }
}
```

#### 2. `index.ts` (Observer Registry)
**Purpose:** Coordinate multiple service-specific observers

```typescript
// Start appropriate observer based on current page
export function initObservers() {
  const hostname = window.location.hostname;

  if (hostname.includes('gemini.google.com')) {
    startGeminiObserver();
  }
  // Future: Claude, Perplexity observers if needed
}
```

#### 3. Updated `content.ts`
**Changes:**
```typescript
// Import observer system
import { initObservers } from './observers';

// Start observers after page load
document.addEventListener('DOMContentLoaded', () => {
  initObservers();
});
```

---

## DOM Selectors Research

### Gemini Response Container
From analyzing the screenshots, Gemini responses appear in:
- Main chat area with dynamic content
- Text wrapped in markdown-style elements
- Need to identify specific selectors through browser inspection

**TODO:** Inspect Gemini page HTML to find:
1. Response container class/ID
2. User message container class/ID (to avoid replacing those)
3. Any shadow DOM elements
4. Streaming text containers (if different)

**Example selectors (to be verified):**
```css
/* Hypothesis - needs verification */
.model-response-container
.assistant-message
.message-content
[data-message-author-role="assistant"]
```

---

## Implementation Checklist

### Phase 1A: DOM Observer Setup (Day 1)
- [ ] Create `src/content/observers/` directory
- [ ] Create `types.ts` with shared interfaces
- [ ] Create `index.ts` with observer registry
- [ ] Update `content.ts` to initialize observers
- [ ] Add service detection utility function

### Phase 1B: Gemini Observer Implementation (Day 1-2)
- [ ] **Inspect Gemini DOM** (30 min)
  - Open Gemini in browser
  - Use DevTools to find response container selectors
  - Identify text node structure
  - Check for shadow DOM

- [ ] **Create `gemini-observer.ts`** (2-3 hours)
  - MutationObserver setup
  - Text node detection
  - Alias replacement logic
  - Debouncing for performance

- [ ] **Get alias mappings from background** (1 hour)
  - Message passing to fetch aliases
  - Cache aliases locally
  - Listen for profile updates

### Phase 1C: Text Replacement Logic (Day 2)
- [ ] **Implement safe text replacement** (2 hours)
  - Regex-based alias detection
  - Handle case variations (GREG vs Greg vs greg)
  - Preserve formatting (bold, italic, etc.)
  - Don't replace in user messages (only AI responses)

- [ ] **Add performance optimizations** (1 hour)
  - Debounce mutations (300ms delay)
  - Process only new nodes (not entire DOM)
  - Early exit if no aliases found
  - Limit observer scope to chat area

### Phase 1D: Testing & Debugging (Day 2-3)
- [ ] **Manual testing**
  - Send messages with real name
  - Verify AI response shows alias first
  - Verify alias gets replaced with real name
  - Test with multiple aliases
  - Test with streaming responses

- [ ] **Cross-service testing**
  - Verify ChatGPT still works (no regression)
  - Verify Claude still works (no regression)
  - Verify Gemini observer only runs on Gemini

- [ ] **Edge cases**
  - Shadow DOM elements
  - Code blocks (should NOT replace)
  - URLs (should NOT replace)
  - Very long responses

### Phase 1E: Documentation & Cleanup (Day 3)
- [ ] Add code comments
- [ ] Update ROADMAP.md
- [ ] Document Gemini-specific quirks
- [ ] Add console logging for debugging

---

## Risk Mitigation

### Risk 1: Performance Impact
**Risk:** MutationObserver could slow down Gemini page

**Mitigation:**
- Debounce mutations (only process after 300ms of no changes)
- Limit observer scope to chat container (not entire page)
- Use `requestIdleCallback` for non-critical replacements
- Add kill switch if too many mutations detected

### Risk 2: Breaking ChatGPT/Claude
**Risk:** New observer code interferes with existing services

**Mitigation:**
- Service-specific observers (isolated code paths)
- Hostname-based activation (only run on Gemini)
- Separate file structure (no shared code)
- Comprehensive testing before merge

### Risk 3: Gemini DOM Changes
**Risk:** Google changes Gemini's HTML structure

**Mitigation:**
- Use multiple fallback selectors
- Graceful degradation (fail silently)
- Easy to update selectors in one place
- User-visible logging in console

### Risk 4: Incomplete Text Replacement
**Risk:** Some aliases don't get replaced

**Mitigation:**
- Process all text nodes (thorough search)
- Handle case variations
- Re-check on new mutations
- Allow manual refresh if needed

---

## Testing Protocol

### Test Case 1: Basic Replacement
1. Create alias: "Greg Barker" → "John Smith"
2. Ask Gemini: "Can you write a poem about Greg Barker?"
3. **Expected:** Response initially shows "Greg Barker"
4. **Expected:** Text quickly replaces to show "John Smith"
5. **Expected:** Console shows replacement log

### Test Case 2: Multiple Aliases
1. Create aliases for name, email, phone
2. Ask: "My name is Greg, email is greg@test.com, phone is 555-1234"
3. **Expected:** All three get replaced in response

### Test Case 3: Streaming Responses
1. Ask a long question to trigger streaming
2. **Expected:** Text replaces as chunks arrive
3. **Expected:** No flickering or double-replacement

### Test Case 4: Code Blocks
1. Ask: "Write code with variable name gregBarker"
2. **Expected:** Code blocks NOT modified
3. **Expected:** Narrative text IS modified

### Test Case 5: ChatGPT No Regression
1. Switch to ChatGPT tab
2. Send same test message
3. **Expected:** Works exactly as before
4. **Expected:** No Gemini observer running

---

## Performance Targets

- **Observer overhead:** < 5ms per mutation batch
- **Text replacement:** < 50ms for 1000-word response
- **Memory:** < 5MB for observer + aliases
- **No visible lag** in Gemini UI

---

## Success Criteria

### Must Have (Phase 1)
- ✅ Gemini responses show real names (not aliases)
- ✅ ChatGPT and Claude unaffected
- ✅ No performance degradation
- ✅ Works with streaming responses

### Nice to Have
- ✅ Handles code blocks correctly
- ✅ Handles URLs correctly
- ✅ Console logs for debugging
- ✅ Graceful error handling

### Out of Scope (Phase 2)
- ❌ Full API format parsing
- ❌ Request body substitution
- ❌ Response body interception
- ❌ Network-level modifications

---

## Future Considerations

### Phase 2: Native API Support
If Google documents the batchexecute format or we find reliable parsing:
- Parse request form data
- Substitute text in encoded payload
- Intercept response at network level
- Remove DOM observer (cleaner solution)

### Other Services
This DOM observer pattern could work for:
- **Perplexity** (if API format is complex)
- **Poe** (if API format is complex)
- **You.com** (if needed)

---

## Open Questions

1. **DOM Selectors:** What are Gemini's exact response container selectors?
   - Action: Inspect live Gemini page

2. **Shadow DOM:** Does Gemini use shadow DOM for responses?
   - Action: Check devtools for `#shadow-root`

3. **Streaming:** How does Gemini stream responses (SSE, WebSocket)?
   - Action: Watch Network tab during streaming

4. **Code Blocks:** How are code blocks marked in DOM?
   - Action: Send code example, inspect HTML

---

## Timeline

**Total Estimated Time:** 2-3 days

| Phase | Task | Time | Completed |
|-------|------|------|-----------|
| 1A | DOM Observer Setup | 2 hours | ⬜ |
| 1B | Gemini Observer Implementation | 4 hours | ⬜ |
| 1C | Text Replacement Logic | 3 hours | ⬜ |
| 1D | Testing & Debugging | 6 hours | ⬜ |
| 1E | Documentation & Cleanup | 1 hour | ⬜ |
| **Total** | | **16 hours** | |

---

## Approval Checklist

Before implementation begins:
- [ ] User approves DOM observer approach
- [ ] User confirms ChatGPT/Claude must not be affected
- [ ] Timeline acceptable (2-3 days)
- [ ] Success criteria agreed upon
- [ ] Performance targets reasonable

---

## Related Documents

- [ROADMAP.md](../../ROADMAP.md) - Phase 2B: Multi-Platform Testing
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Extension architecture
- [serviceWorker.ts](../../src/background/serviceWorker.ts) - Service detection
- [inject.js](../../src/content/inject.js) - Fetch interception

---

**Next Steps:**
1. ✅ Get user approval for this plan
2. ⬜ Inspect Gemini DOM to find selectors
3. ⬜ Implement `gemini-observer.ts`
4. ⬜ Test thoroughly
5. ⬜ Update ROADMAP.md with results
