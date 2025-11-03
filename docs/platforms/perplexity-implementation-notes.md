# Perplexity Implementation Notes - Session 2025-11-03

## Current Status: 🟡 Partially Working

### What's Working ✅
1. **Page loads successfully** - No more GET/HEAD body errors
2. **Extension initializes** - Green icon shows "You are Protected"
3. **Fetch interception active** - Console shows intercepting requests
4. **Request/response flow** - Messages being passed between inject.js and background

### What's NOT Working ❌
1. **Text extraction returns 0 replacements** - PII substitution not happening
2. **Service worker logs show:** `⚠️ No text extracted from request`

---

## Root Cause Analysis

### The Problem
The background service worker (`serviceWorker.ts:463`) calls `extractAllText(requestData)` which returns empty string for Perplexity requests.

**Evidence from servicelogs.txt (line 48-50):**
```
serviceWorker.ts:387 🔄 Substituting request body
serviceWorker.ts:463 📝 Extracted text:
serviceWorker.ts:466 ⚠️ No text extracted from request
```

### Why It's Failing

**Perplexity Request Format** (discovered from Network tab):

The request body is a **multipart format**:
```
{"params":{...},"query_str":"hi"}\
\
message    {"backend_uuid": "...", ...}
```

Breaking this down:
- **Part 1:** JSON object with `params` and `query_str` (THIS is what we need!)
- **Separator:** Literal backslash followed by newlines
- **Part 2:** `message` followed by SSE response metadata

**The user's message is in `query_str` field!**

Example:
```json
{
  "params": {
    "last_backend_uuid": "...",
    "read_write_token": "...",
    "attachments": [],
    "language": "en-US",
    ...
  },
  "query_str": "hi"  // <-- USER'S MESSAGE HERE
}
```

### Current Code Doesn't Handle This

**File:** `src/lib/textProcessor.ts`
**Function:** `extractAllText(data: any)`

Currently checks for:
- `data.messages` (ChatGPT)
- `data.prompt` (Claude)
- `data.contents` (Gemini)

**Missing:** Check for `data.query_str` (Perplexity)

---

## Required Fixes

### Fix 1: Update textProcessor.ts

**File:** `src/lib/textProcessor.ts`

**Location 1:** `extractAllText()` function (line ~10)

Add AT THE BEGINNING (before ChatGPT check):
```typescript
  // Perplexity format: { query_str: "..." }
  if (data.query_str && typeof data.query_str === 'string') {
    return data.query_str;
  }
```

**Location 2:** `replaceAllText()` function (line ~57)

Add AT THE BEGINNING (after the clone, before textParts):
```typescript
  // Perplexity format
  if (modified.query_str && typeof modified.query_str === 'string') {
    modified.query_str = substitutedText;
    return modified;
  }
```

**Location 3:** `detectFormat()` function (line ~159)

Change return type:
```typescript
// OLD:
export function detectFormat(data: any): 'chatgpt' | 'claude' | 'gemini' | 'unknown'

// NEW:
export function detectFormat(data: any): 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'unknown'
```

Add check at beginning:
```typescript
  if (data.query_str && typeof data.query_str === 'string') {
    return 'perplexity';
  }
```

### Fix 2: Update serviceWorker.ts

**File:** `src/background/serviceWorker.ts`

**Location:** Around line 399-403 (JSON.parse section)

Replace:
```typescript
    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (e) {
```

With:
```typescript
    // Parse request body
    let requestData;
    let isPerplexityMultipart = false;
    let perplexityOriginalBody = '';

    try {
      // Perplexity sends multipart data: JSON\n\nmessage    {...}
      // Extract just the first JSON part
      let bodyToParse = body;
      if (service === 'perplexity' && body.includes('\\')) {
        const parts = body.split('\\');
        bodyToParse = parts[0]; // First part is the JSON with query_str
        isPerplexityMultipart = true;
        perplexityOriginalBody = body;
        console.log('[Perplexity] Extracted JSON from multipart body');
      }

      requestData = JSON.parse(bodyToParse);
    } catch (e) {
```

**Location 2:** After text substitution (around line 507-530, where JSON.stringify is called)

Need to reconstruct the multipart format when returning modified body. Search for where the modified request data is converted back to JSON and add:

```typescript
    // Reconstruct the request body with substituted text
    let modifiedBodyString;
    if (isPerplexityMultipart) {
      // Reconstruct multipart format: JSON\n\nmessage    {...}
      const modifiedJson = JSON.stringify(modified);
      const parts = perplexityOriginalBody.split('\\');
      modifiedBodyString = modifiedJson + '\\' + parts.slice(1).join('\\');
      console.log('[Perplexity] Reconstructed multipart body');
    } else {
      modifiedBodyString = JSON.stringify(modified);
    }

    return {
      success: true,
      modifiedBody: modifiedBodyString,
      substitutions: substituted.substitutions.length,
    };
```

---

## Testing Plan

After applying fixes:

1. **Reload extension** in chrome://extensions
2. **Navigate to** https://www.perplexity.ai
3. **Send test message** with PII (e.g., "What is a good career for Greg Barker?")
4. **Check console logs:**
   - Should see: `📝 Extracted text: What is a good career for Greg Barker?`
   - Should see: `✅ Request substituted: 1 replacements` (if alias exists)
5. **Check Network tab:**
   - Request payload should show alias instead of real name
6. **Check Perplexity response:**
   - Should see alias in the answer
   - Observer will eventually decode back to real name (future task)

---

## Next Steps

1. ✅ **Document findings** (this file)
2. ⏳ **Apply textProcessor.ts fixes**
3. ⏳ **Apply serviceWorker.ts fixes**
4. ⏳ **Test with real PII message**
5. ⏳ **Implement PerplexityObserver for DOM decoding** (if needed)

---

## Known Issues & Decisions

### Issue 1: File Edit Conflicts
During implementation, encountered repeated "File has been unexpectedly modified" errors when trying to edit `textProcessor.ts` and `serviceWorker.ts`. This prevented direct code changes.

**Resolution:** Document all findings and fixes in this file, then restart session for clean implementation.

### Issue 2: GET/HEAD Body Error (RESOLVED ✅)
**Problem:** `TypeError: Failed to execute 'fetch' on 'Window': Request with GET/HEAD method cannot have body.`

**Fix Applied:** Modified `inject.js` lines 331-342 to only add body for POST/PUT/PATCH methods:
```typescript
const method = (options?.method || 'GET').toUpperCase();
const modifiedOptions = { ...options };

// Only add body for methods that support it (not GET/HEAD)
if (method !== 'GET' && method !== 'HEAD') {
  modifiedOptions.body = substituteRequest.modifiedBody;
}
```

### Issue 3: isProtected Blocking (RESOLVED ✅)
**Problem:** Extension was blocking all requests with modal dialog on page load.

**Fix Applied:** Removed aggressive `isProtected` check from `inject.js` (lines 234-283), following same pattern as Gemini implementation.

---

## API Endpoint Details

### Chat Request
- **URL:** `https://www.perplexity.ai/rest/sse/perplexity_ask`
- **Method:** POST
- **Content-Type:** text/event-stream (response)
- **Request Body Format:** Multipart (JSON + SSE metadata)

### Request Structure
```json
{
  "params": {
    "last_backend_uuid": "uuid",
    "read_write_token": "token",
    "attachments": [],
    "language": "en-US",
    "timezone": "America/Edmonton",
    "search_focus": "internet",
    "sources": ["web"],
    "frontend_uuid": "uuid",
    "mode": "concise",
    "model_preference": "turbo",
    "query_source": "followup",
    "is_incognito": false,
    ...
  },
  "query_str": "USER MESSAGE HERE"
}
```

### Response Structure
Server-Sent Events format:
```
event: message
data: {"backend_uuid": "...", "blocks": [...], "message_mode": "STREAMING", ...}

event: message
data: {"backend_uuid": "...", "blocks": [...], ...}
```

---

## References

- **Console logs:** `temp/consolelogs.txt`
- **Service worker logs:** `temp/servicelogs.txt`
- **Network screenshots:** `temp/perplexity-06.png` through `temp/perplexity-10.png`
- **Payload example:** User message from 2025-11-03 session
