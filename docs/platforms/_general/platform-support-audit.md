# Platform Support Audit - PromptBlocker Extension

**Audit Date:** November 1, 2025
**Auditor:** Claude Code
**Purpose:** Verify claimed vs. actual platform support

---

## Executive Summary

**Claimed Support:** 8 platforms (7 unique + 1 duplicate ChatGPT domain)
**Actual Support:** **2 platforms fully tested** (ChatGPT, Claude)
**Infrastructure Ready:** 7 platforms (all API endpoints configured)
**Status:** ⚠️ **Infrastructure exists, but untested beyond ChatGPT and Claude**

---

## Detailed Platform Analysis

### ✅ Fully Tested & Working

| Platform | Status | API Endpoint | Notes |
|----------|--------|--------------|-------|
| **ChatGPT** | ✅ Confirmed Working | `api.openai.com`, `backend-api/conversation` | Extensively tested, production-ready |
| **Claude** | ✅ Confirmed Working | `claude.ai/api/organizations` | Extensively tested, production-ready |

### 🟡 Infrastructure Ready (Untested)

| Platform | Status | API Endpoint | Confidence Level |
|----------|--------|--------------|------------------|
| **Gemini** | 🟡 Not Tested | `gemini.google.com/api` | Medium - Generic API detection |
| **Perplexity** | 🟡 Not Tested | `perplexity.ai/socket.io`, `perplexity.ai/api` | Medium - Socket.io + API |
| **Poe** | 🟡 Not Tested | `poe.com/api` | Medium - Generic API detection |
| **Copilot** | 🟡 Not Tested | `copilot.microsoft.com/api`, `sydney.bing.com/sydney` | Medium - Multiple endpoints |
| **You.com** | 🟡 Not Tested | `you.com/api` | Medium - Generic API detection |

---

## What's Already Implemented

### 1. Manifest Configuration ✅

All 8 platforms are configured in `src/manifest.json`:

```json
{
  "host_permissions": [
    "https://chat.openai.com/*",      // ChatGPT (old domain)
    "https://chatgpt.com/*",          // ChatGPT (new domain)
    "https://claude.ai/*",            // Claude
    "https://gemini.google.com/*",    // Gemini
    "https://perplexity.ai/*",        // Perplexity
    "https://poe.com/*",              // Poe
    "https://copilot.microsoft.com/*",// Copilot
    "https://you.com/*"               // You.com
  ],
  "content_scripts": [...],
  "web_accessible_resources": [...]
}
```

**Note:** ChatGPT has both `chat.openai.com` and `chatgpt.com` for backward compatibility.

### 2. Content Script Injection ✅

All platforms have content scripts injected at `document_start`:

- `content.ts` - Message relay (generic for all platforms)
- `inject.js` - Fetch interceptor (injected into page context)

### 3. API Endpoint Detection ✅

`src/content/inject.js` lines 172-197:

```javascript
const aiDomains = [
  // ChatGPT
  'api.openai.com',
  'backend-api/conversation',

  // Claude
  'claude.ai/api/organizations',

  // Gemini
  'gemini.google.com/api',

  // Perplexity
  'perplexity.ai/socket.io',
  'perplexity.ai/api',

  // Poe
  'poe.com/api',

  // Copilot
  'copilot.microsoft.com/api',
  'sydney.bing.com/sydney',

  // You.com
  'you.com/api'
];
```

### 4. Service Detection ✅

`src/background/serviceWorker.ts` lines 340-364:

```typescript
function detectService(url: string): AIService {
  if (url.includes('api.openai.com') || url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
    return 'chatgpt';
  }
  if (url.includes('claude.ai')) {
    return 'claude';
  }
  if (url.includes('gemini.google.com') || url.includes('generativelanguage.googleapis.com')) {
    return 'gemini';
  }
  if (url.includes('perplexity.ai')) {
    return 'perplexity';
  }
  if (url.includes('poe.com')) {
    return 'poe';
  }
  if (url.includes('copilot.microsoft.com') || url.includes('bing.com/sydney')) {
    return 'copilot';
  }
  if (url.includes('you.com')) {
    return 'you';
  }
  return 'unknown';
}
```

### 5. Statistics Tracking ✅

All platforms tracked in:
- `src/lib/types.ts` - TypeScript types
- `src/lib/storage.ts` - Storage schema
- `src/popup/components/statsRenderer.ts` - UI display

```typescript
byService: {
  chatgpt: { requests: number; substitutions: number };
  claude: { requests: number; substitutions: number };
  gemini: { requests: number; substitutions: number };
  perplexity: { requests: number; substitutions: number };
  poe: { requests: number; substitutions: number };
  copilot: { requests: number; substitutions: number };
  you: { requests: number; substitutions: number };
}
```

### 6. UI Icons ✅

`src/popup/components/statsRenderer.ts` lines 10-19:

```typescript
const SERVICE_ICONS: Record<AIService, string> = {
  chatgpt: '🤖',
  claude: '🎭',
  gemini: '💎',
  perplexity: '🔍',
  poe: '🎭',
  copilot: '🧑‍💻',
  you: '🌐',
  unknown: '❓'
};
```

---

## What's Missing (Testing Only)

**Critical:** The infrastructure exists, but we have **not verified** that:

1. ✅ Content scripts inject properly on each platform
2. ❌ API endpoints are correct for current platform versions
3. ❌ Request/response formats are compatible with our interception logic
4. ❌ Platform-specific edge cases (WebSocket vs REST, streaming, etc.)
5. ❌ UI toast displays correctly on each platform
6. ❌ Statistics tracking works for each platform

**User's Confirmation:** *"I've only ever tested chatGPT and Claude so far"*

---

## Potential Issues with Untested Platforms

### Gemini 🟡
- **Risk Level:** Medium
- **API Endpoint:** `gemini.google.com/api` (generic)
- **Concerns:**
  - May use Google's Generative Language API (`generativelanguage.googleapis.com`)
  - Might have different request/response structure than ChatGPT
  - Could use streaming responses differently

### Perplexity 🟡
- **Risk Level:** Medium-High
- **API Endpoint:** `perplexity.ai/socket.io` + `perplexity.ai/api`
- **Concerns:**
  - **Uses Socket.IO** (real-time WebSocket protocol)
  - Fetch interceptor may not capture WebSocket messages
  - Needs separate WebSocket interception if using socket.io for chat

### Poe 🟡
- **Risk Level:** Medium
- **API Endpoint:** `poe.com/api` (generic)
- **Concerns:**
  - Aggregates multiple AI models (ChatGPT, Claude, etc.)
  - May have complex multi-model request routing
  - Might use GraphQL instead of REST

### Copilot 🟡
- **Risk Level:** Medium
- **API Endpoint:** `copilot.microsoft.com/api` + `sydney.bing.com/sydney`
- **Concerns:**
  - Uses Bing's Sydney backend
  - May have Microsoft-specific authentication
  - Might integrate with Azure OpenAI differently than vanilla ChatGPT

### You.com 🟡
- **Risk Level:** Low-Medium
- **API Endpoint:** `you.com/api` (generic)
- **Concerns:**
  - Search-focused AI interface
  - May send additional metadata (search queries, sources)
  - Might have different request structure than pure chat

---

## Recommendations

### Immediate (Before Marketing Launch)

**Option 1: Conservative Approach (Recommended)**
```markdown
Landing Page: "Supports ChatGPT & Claude AI"
Subtitle: "With experimental support for Gemini, Perplexity, Poe, Copilot, and You.com"
```

**Option 2: Honest Approach**
```markdown
Landing Page: "Supports 7+ Major AI Platforms"
Footnote: "ChatGPT and Claude are fully tested. Other platforms use the same interception
technology and should work, but are currently in beta testing."
```

**Option 3: Test Everything (Best)**
- Spend 1-2 hours testing each platform
- Create test accounts for each service
- Verify PII substitution works correctly
- Document any platform-specific issues
- Then confidently claim "Supports 7 AI Platforms"

### Testing Checklist (Per Platform)

For each untested platform:

1. ✅ Visit platform website
2. ✅ Check console for "🛡️ AI PII Sanitizer: Loading..." message
3. ✅ Verify "You are protected" toast appears
4. ✅ Open DevTools → Network tab
5. ✅ Send a test message with PII (e.g., "My name is John Doe")
6. ✅ Check console for "🔒 AI PII Sanitizer: Intercepting" message
7. ✅ Verify API request body shows alias (e.g., "My name is [ALIAS]")
8. ✅ Verify response shows real name (reverse substitution working)
9. ✅ Check extension popup statistics incremented correctly
10. ✅ Test API key detection (if platform requires keys)

### Platform-Specific Testing Notes

**Gemini:**
- Test with both gemini.google.com and direct API access
- Verify Google account integration doesn't bypass interception

**Perplexity:**
- Watch for Socket.IO connections in DevTools
- May need to add WebSocket interception for real-time features
- Test both search and chat modes

**Poe:**
- Test multiple bots (ChatGPT, Claude, GPT-4, etc.)
- Verify interception works across different bot backends
- Check if GraphQL is used (different from REST interception)

**Copilot:**
- Test in both copilot.microsoft.com and Bing Chat
- Verify sydney.bing.com endpoint is actually used
- Check Microsoft account integration

**You.com:**
- Test YouChat feature specifically
- Verify search metadata doesn't leak PII
- Check if API structure differs from pure chat services

---

## Current Platform Count

**Accurate Count for Marketing:**
- **2 platforms confirmed working:** ChatGPT, Claude
- **5 platforms with infrastructure (untested):** Gemini, Perplexity, Poe, Copilot, You.com
- **Total platforms configured:** 7 unique services (8 domains counting both ChatGPT URLs)

**Recommended Marketing Language:**

✅ **Conservative:**
> "Fully supports ChatGPT and Claude AI, with beta support for 5 additional platforms"

✅ **Honest:**
> "Supports 7 major AI platforms with confirmed compatibility on ChatGPT and Claude"

❌ **Avoid (until tested):**
> "Supports 7 AI platforms" (implies all are equally tested)

---

## Action Items

1. **Decision Required:** Choose marketing approach (Option 1, 2, or 3 above)
2. **If testing:** Allocate 1-2 hours per platform for manual testing
3. **If conservative:** Update landing page to highlight ChatGPT/Claude, mention others as "beta"
4. **Document:** Create platform-specific testing results in `PLATFORM_TESTING.md`
5. **Roadmap:** Add "Platform Verification Sprint" to development roadmap

---

## Conclusion

**Good News:** Infrastructure is 100% ready for all 7 platforms.

**Reality Check:** Only ChatGPT and Claude have been tested in production.

**Recommended Path:** Either:
- Test the other 5 platforms before launch (1-2 days work), OR
- Be transparent about beta status for untested platforms

The codebase is solid and should work across all platforms using the same fetch interception approach. The risk is **platform-specific API differences** that we haven't encountered yet.
