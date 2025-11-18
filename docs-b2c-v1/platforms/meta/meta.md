# Meta AI Platform Integration

**Status:** 🟡 **Tier 2 (Post-MVP - High Priority)**
**Market Share:** Not measured separately (embedded in Meta platforms)
**Users:** 100M+ (estimated - built into Facebook, Instagram, WhatsApp)
**Last Updated:** 2025-11-03
**Architecture:** GraphQL (confirmed)
**Implementation Status:** Discovery phase complete, implementation pending

---

## Overview

Meta AI is Meta's (formerly Facebook) conversational AI assistant, integrated across Facebook, Instagram, WhatsApp, and accessible via standalone web interface at meta.ai. With 100M+ estimated users through Meta's social platforms, it represents the second-highest priority Tier 2 platform.

### Why Tier 2?

**Strategic Value:**
- 100M+ user reach through Meta ecosystem
- Social media platform integration (Facebook, Instagram, WhatsApp)
- Global presence via Meta's worldwide user base
- High ROI: 100M+ users vs 5-7 hours estimated effort

**Market Position:**
- Embedded in Meta platforms (not measured separately in market share)
- Strategic integration point for social media users
- Complements Tier 1 coverage by adding social platform context

**Priority Ranking:** ⭐⭐⭐⭐ (23/25 - Second highest Tier 2 priority after DeepSeek)

---

## Technical Discovery (2025-11-03)

### ✅ Architecture Confirmed: GraphQL

**Evidence from Network Tab Analysis:**
- **Primary Domain:** `meta.ai`
- **API Endpoint:** `graph.meta.ai`
- **Request Format:** GraphQL queries
- **Protocol:** HTTPS POST to GraphQL endpoint

**Sample URL Structure:**
```
https://www.meta.ai/prompt/a04adc0d-44b8-4832-977f-a9ad94f2b549
```

**Observable GraphQL Response Structure:**
```json
{
  "data": {
    "xab_viewer": {
      "__typename": "XABUser",
      "is_xab_abr_viewer": true,
      "is_temporary": true,
      "is_too_accepted": false
    }
  }
}
```

### GraphQL Characteristics

**What is GraphQL?**
- Modern API query language developed by Facebook/Meta
- Client specifies exactly what data it needs
- Single endpoint for all queries (typically `/graphql`)
- Strongly typed schema
- Nested queries and mutations

**Differences from REST/JSON:**
```javascript
// Standard REST/JSON (ChatGPT, Claude, DeepSeek)
POST /v1/chat/completions
Content-Type: application/json
{
  "messages": [{"role": "user", "content": "Hello"}]
}

// GraphQL (Meta AI)
POST /graphql
Content-Type: application/json
{
  "query": "mutation SendMessage($input: MessageInput!) { sendMessage(input: $input) { id text } }",
  "variables": {
    "input": {
      "text": "Hello",
      "conversationId": "..."
    }
  }
}
```

---

## Implementation Plan

### Phase 1: GraphQL Request Discovery (1-2 hours)

**Objective:** Capture actual GraphQL request structure

**Steps:**
1. Add `meta.ai` to manifest `host_permissions`
2. Visit meta.ai with extension loaded
3. Open DevTools Network tab, filter for GraphQL
4. Send test message with PII
5. Capture GraphQL query structure:
   - Query/mutation name
   - Variables structure
   - Message text location
   - Conversation context fields

**Expected Request Format:**
```json
{
  "query": "mutation SendMessage(...) { ... }",
  "variables": {
    "input": {
      "text": "USER MESSAGE WITH PII HERE",
      "conversationId": "uuid",
      "additionalContext": {...}
    }
  }
}
```

### Phase 2: textProcessor GraphQL Support (2-3 hours)

**Objective:** Add GraphQL parsing to text extraction/replacement

**Files to Modify:**
- `src/utils/textProcessor.ts`

**New Format Handler:**
```typescript
// Add to extractAllText()
case 'meta': {
  // GraphQL query parsing
  if (body.query && body.variables) {
    const variables = body.variables;

    // Find text in variables.input.text or similar
    if (variables.input?.text) {
      texts.push({ text: variables.input.text, path: 'variables.input.text' });
    }

    // May need to check other variable paths
    // e.g., variables.message?.content, variables.prompt?.text
  }
  break;
}

// Add to replaceAllText()
case 'meta': {
  if (bodyObj.query && bodyObj.variables) {
    const variables = bodyObj.variables;

    replacements.forEach(({ originalPath, newText }) => {
      if (originalPath === 'variables.input.text' && variables.input) {
        variables.input.text = newText;
      }
      // Handle other paths as discovered
    });

    return JSON.stringify(bodyObj);
  }
  break;
}

// Add to detectFormat()
if (body.query && body.variables) {
  return 'meta'; // GraphQL format
}
```

**Complexity Considerations:**
- GraphQL queries can be deeply nested
- Variable structure may vary by mutation type
- May need to parse `query` string to understand structure
- Response parsing (if implemented) requires GraphQL schema knowledge

### Phase 3: Service Detection (30 minutes)

**Files to Modify:**
1. `public/inject.js` - Add meta.ai to domain detection
2. `src/serviceWorker.ts` - Add 'meta' service type

**inject.js Update:**
```javascript
const aiDomains = [
  'chatgpt.com',
  'claude.ai',
  'gemini.google.com',
  'perplexity.ai',
  'copilot.microsoft.com',
  'meta.ai' // ADD THIS
];
```

**serviceWorker.ts Update:**
```typescript
function detectService(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes('chatgpt.com')) return 'chatgpt';
  if (hostname.includes('claude.ai')) return 'claude';
  if (hostname.includes('gemini.google.com')) return 'gemini';
  if (hostname.includes('perplexity.ai')) return 'perplexity';
  if (hostname.includes('copilot.microsoft.com')) return 'copilot';
  if (hostname.includes('meta.ai')) return 'meta'; // ADD THIS

  return 'unknown';
}
```

### Phase 4: Testing & Verification (1-2 hours)

**Test Cases:**
1. **GraphQL Request Interception:**
   - Send message with PII (name, email, etc.)
   - Verify extension logs show "Substitutions: 1"
   - Check service logs for proper format detection

2. **GraphQL Variable Substitution:**
   - Verify text is replaced in `variables.input.text` or equivalent
   - Check that GraphQL query structure is preserved
   - Validate JSON remains valid after substitution

3. **Activity Logging:**
   - Verify activity log shows Meta AI entries
   - Check stats tracking increments
   - Validate popup displays Meta AI service

4. **Edge Cases:**
   - Empty messages
   - Messages without PII
   - Multi-turn conversations
   - File attachments (if supported)

### Phase 5: Documentation (1 hour)

**Deliverables:**
1. Update this document with actual GraphQL structure
2. Create `META_COMPLETE.md` completion report
3. Update `docs/platforms/README.md`
4. Update main README.md
5. Add Meta AI examples to textProcessor tests

---

## Estimated Complexity: Medium

**Factors:**
- ⚠️ **GraphQL Complexity:** Requires understanding query structure and variables
- ✅ **Standard HTTP:** Still uses fetch() POST (our existing interception works)
- ⚠️ **Variable Nesting:** Text may be nested in complex variable structures
- ✅ **JSON Format:** Variables are JSON (existing JSON handling applies)
- ⚠️ **Multiple Entry Points:** Facebook, Instagram, WhatsApp, meta.ai

**Estimated Total Effort:** 5-7 hours

**Risk Level:** Medium
- GraphQL parsing complexity
- May require multiple variable path checks
- Need to understand Meta's specific GraphQL schema

---

## Technical Requirements

### Manifest Changes Needed

**Add to host_permissions:**
```json
{
  "host_permissions": [
    "*://chatgpt.com/*",
    "*://claude.ai/*",
    "*://gemini.google.com/*",
    "*://perplexity.ai/*",
    "*://copilot.microsoft.com/*",
    "*://meta.ai/*",           // ADD THIS
    "*://graph.meta.ai/*"       // API endpoint
  ]
}
```

**May Need Additional Permissions:**
- Facebook/Instagram/WhatsApp domains if Meta AI is embedded
- `*://*.facebook.com/*`
- `*://*.instagram.com/*`
- `*://web.whatsapp.com/*`

### Dependencies

**No new dependencies required:**
- ✅ fetch() interception (existing)
- ✅ JSON parsing (existing)
- ✅ AliasEngine (existing)
- ✅ Activity logging (existing)

**New Capability Needed:**
- GraphQL query/variable parsing in textProcessor

---

## Known Challenges

### 1. GraphQL Variable Structure

**Challenge:** Text location in variables may vary by mutation type

**Examples of Possible Structures:**
```javascript
// Option A: variables.input.text
{ variables: { input: { text: "USER MESSAGE" } } }

// Option B: variables.message.content
{ variables: { message: { content: "USER MESSAGE" } } }

// Option C: variables.prompt
{ variables: { prompt: "USER MESSAGE" } }

// Option D: Multiple text fields
{ variables: { input: { text: "USER MESSAGE", context: "CONTEXT TEXT" } } }
```

**Solution:** Test actual request structure, implement flexible path checking

### 2. Multiple Entry Points

**Challenge:** Meta AI accessible from multiple platforms

**Entry Points:**
- meta.ai (standalone)
- Facebook Messenger
- Instagram Direct
- WhatsApp Web

**Solution:** Start with meta.ai, expand to social platforms if needed

### 3. GraphQL Response Decoding

**Challenge:** Response structure follows GraphQL data nesting

**Example Response:**
```json
{
  "data": {
    "sendMessage": {
      "__typename": "Message",
      "id": "msg_123",
      "text": "ASSISTANT RESPONSE WITH ALIAS",
      "timestamp": "2025-11-03T..."
    }
  }
}
```

**Solution:** If response decoding implemented, parse `data.{mutation}.text` path

---

## Comparison with Other Platforms

### Similarity to Other Platforms

| Aspect | Meta AI | Similar To | Difference |
|--------|---------|------------|------------|
| **Protocol** | HTTPS POST | ChatGPT, Claude | GraphQL vs REST |
| **Data Format** | JSON | All platforms | GraphQL structure |
| **Interception** | fetch() | ChatGPT, Claude, Perplexity | Same approach |
| **Text Location** | variables.input.* | ChatGPT: messages[].content | Nested in variables |
| **Complexity** | Medium | Gemini (form-encoded) | GraphQL vs form data |

### Unique Characteristics

- ✅ **GraphQL Protocol:** First platform using GraphQL
- ✅ **Meta Ecosystem:** Integrated across multiple social platforms
- ✅ **Graph API:** Uses Meta's Graph API infrastructure
- ⚠️ **Variable Nesting:** Text nested in GraphQL variables (not direct body)

---

## Testing Requirements

### Pre-Implementation Testing (Before Manifest Change)

**Status:** ⚠️ Cannot currently test (meta.ai not in manifest)

**Blocked Until:**
1. Add meta.ai to host_permissions
2. Reload extension
3. Visit meta.ai

### Post-Implementation Testing

**Test Scenarios:**
1. **Single message with PII**
   - Expected: 1 substitution, alias used

2. **Multiple PII items in one message**
   - Expected: Multiple substitutions, all aliases used

3. **Conversation context**
   - Expected: Each message substituted independently

4. **Special characters in GraphQL**
   - Expected: JSON escaping preserved

5. **Cross-platform testing** (if applicable)
   - Test on meta.ai
   - Test on Facebook (if embedded)
   - Test on Instagram (if embedded)

---

## ROI Analysis

### User Base
- **Estimated Users:** 100M+ (embedded in Meta platforms)
- **Growth:** Stable (tied to Meta platform growth)
- **Geography:** Global (Meta's worldwide reach)

### Implementation Effort
- **Discovery:** 1-2 hours
- **Implementation:** 3-4 hours
- **Testing:** 1-2 hours
- **Documentation:** 1 hour
- **Total:** 5-7 hours

### Return on Investment
- **Users per Hour:** ~14-20M users per development hour
- **Strategic Value:** High (social media integration)
- **Tier 2 Priority:** #2 (after DeepSeek 96M users)

**ROI Rating:** ⭐⭐⭐⭐ (23/25 - Very Good)

---

## Implementation Status

### Current State (2025-11-03)

- ✅ **Architecture Discovery:** GraphQL confirmed via Network tab
- ✅ **Domain Identified:** meta.ai (primary), graph.meta.ai (API)
- ✅ **Request Format:** GraphQL POST with query + variables
- ⏳ **Manifest Permission:** Not yet added (blocked)
- ⏳ **textProcessor Support:** Not yet implemented
- ⏳ **Service Detection:** Not yet implemented
- ⏳ **Testing:** Cannot test until manifest updated

### Next Actions

**Immediate (Tier 2 Implementation):**
1. Add meta.ai to manifest host_permissions
2. Test actual GraphQL request structure
3. Implement GraphQL parsing in textProcessor
4. Add service detection
5. Complete testing and verification

**Deferred (MVP Launch Priority):**
- Waiting until after MVP launch (5 platforms)
- DeepSeek will be attempted first (Tier 2 #1 priority)
- Meta AI second (Tier 2 #2 priority)

---

## Success Criteria

### Tier 2 Implementation Complete When:

- [ ] Meta.ai domain added to manifest
- [ ] GraphQL request structure fully documented
- [ ] textProcessor extracts text from GraphQL variables
- [ ] textProcessor replaces text in GraphQL variables
- [ ] Service detection identifies 'meta' correctly
- [ ] Extension logs show "Substitutions: 1" for test messages
- [ ] Activity log tracks Meta AI usage
- [ ] Stats increment for Meta AI
- [ ] Popup v2 displays Meta AI entries
- [ ] Production documentation complete
- [ ] META_COMPLETE.md created

### Quality Standards

**Must Match Tier 1 Platforms:**
- ✅ Request interception working
- ✅ PII substitution accurate
- ✅ Activity logging complete
- ✅ Stats tracking functional
- ✅ Production-quality documentation
- 🟡 Response decoding (intentionally disabled by design in Tier 1)

---

## References

### GraphQL Resources
- [GraphQL Official Docs](https://graphql.org/)
- [GraphQL vs REST](https://www.apollographql.com/blog/graphql-vs-rest)
- [Meta Graph API](https://developers.facebook.com/docs/graph-api)

### Related Documentation
- `docs/platforms/README.md` - Platform comparison
- `PLATFORM_ROADMAP.md` - Implementation roadmap
- `textProcessor.ts` - Format detection and substitution logic

---

## Appendix: Network Tab Evidence

### Screenshot Analysis (meta-02.png)

**Observable Elements:**
- ✅ URL: `https://www.meta.ai/prompt/a04adc0d-44b8-4832-977f-a9ad94f2b549`
- ✅ Domain: `meta.ai`
- ✅ Multiple GraphQL endpoints visible in Network tab
- ✅ API domain: `graph.meta.ai`
- ✅ Response structure shows GraphQL typing (`__typename`)

**GraphQL Indicators:**
- `/graphql` endpoints in Network tab
- `__typename` field in responses (GraphQL convention)
- `data` wrapper object (GraphQL standard)
- Query-based architecture

**Conclusion:** Meta AI definitely uses GraphQL protocol, confirming implementation approach.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-03
**Status:** Discovery complete, ready for Tier 2 implementation
**Next Review:** After DeepSeek implementation (Tier 2 priority #1)
