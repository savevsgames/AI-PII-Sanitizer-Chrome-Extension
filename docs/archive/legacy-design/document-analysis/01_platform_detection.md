# Platform Detection & Context Management Analysis

**Date:** November 7, 2025
**Feature:** Document Analysis (Document Upload Sanitization)
**Purpose:** Understanding how Prompt Blocker detects platforms and manages context

---

## Executive Summary

Prompt Blocker operates across **5 supported AI platforms** with a sophisticated **3-context architecture** that ensures privacy protection works reliably despite Chrome extension security restrictions.

**Supported Platforms:**
1. ChatGPT (chat.openai.com, chatgpt.com)
2. Claude (claude.ai)
3. Gemini (gemini.google.com)
4. Perplexity (perplexity.ai)
5. Copilot (copilot.microsoft.com)

**Key Discovery:** The system uses a **3-layer context model** with message passing between isolated contexts to bypass CSP restrictions.

---

## Architecture: 3-Context Model

### Context 1: Page Context (`inject.js`)
- **Runs in:** Actual page's JavaScript context
- **Access to:** Native `fetch()` and `XMLHttpRequest` objects
- **Can bypass:** Content Security Policy (CSP)
- **Cannot do:** Access `chrome.*` APIs
- **Injected via:** `<script src="chrome-extension://...inject.js"></script>`

### Context 2: Isolated World (`content.ts`)
- **Runs in:** Chrome extension's isolated world
- **Access to:** DOM, `window`, but NOT page's native fetch
- **Can bypass:** Nothing (isolated from page)
- **Can do:** Access `chrome.runtime.*` APIs
- **Acts as:** Relay/messenger between page and background

### Context 3: Service Worker (`serviceWorker.ts`)
- **Runs in:** Background service worker (no DOM)
- **Access to:** `chrome.*` APIs, encrypted storage
- **Cannot access:** DOM, window, current page URL
- **Does:** PII substitution, encryption, API key detection

**Communication Flow:**
```
inject.js (page context)
  ↓ window.postMessage()
content.ts (isolated world)
  ↓ chrome.runtime.sendMessage()
serviceWorker.ts (background)
  ↓ (process + substitute PII)
serviceWorker.ts (background)
  ↑ return via Promise
content.ts (isolated world)
  ↑ window.postMessage()
inject.js (page context)
```

---

## Platform Detection

### Method 1: URL-Based Detection (Primary)

**Location:** `src/content/inject.js` lines 174-200

```javascript
const aiDomains = [
  // ChatGPT
  'api.openai.com',
  'backend-api/conversation',
  'backend-api/f/conversation',

  // Claude
  'claude.ai/api/organizations',

  // Gemini (uses BardChatUi endpoint, not /api/)
  'gemini.google.com/_/BardChatUi',

  // Perplexity
  'perplexity.ai/socket.io',
  'perplexity.ai/api',
  'perplexity.ai/rest',  // Main REST API endpoint

  // Poe
  'poe.com/api',

  // Copilot
  'copilot.microsoft.com/api',
  'sydney.bing.com/sydney',

  // You.com
  'you.com/api'
];

function isAIRequest(url) {
  return aiDomains.some(domain => url.includes(domain));
}
```

**Key Points:**
- Detection happens at the **URL level**, not hostname level
- Each platform has multiple endpoint patterns
- Gemini uses `BardChatUi` (not `/api/`)
- Perplexity uses `socket.io` + REST API
- Copilot uses Microsoft's `sydney.bing.com` backend

### Method 2: Hostname-Based Textarea Selection

**Location:** `src/content/content.ts` lines 186-204

When injecting templates (like document upload prompts), the system uses hostname-specific selectors:

```javascript
// Platform-specific selectors
if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
  textarea = document.querySelector('#prompt-textarea') as HTMLTextAreaElement;
} else if (hostname.includes('claude.ai')) {
  textarea = document.querySelector('div[contenteditable="true"]') as any;
} else if (hostname.includes('gemini.google.com')) {
  textarea = document.querySelector('.ql-editor[contenteditable="true"]') as any;
} else if (hostname.includes('perplexity.ai')) {
  textarea = document.querySelector('textarea[placeholder*="Ask"]') as HTMLTextAreaElement;
} else if (hostname.includes('copilot.microsoft.com')) {
  textarea = document.querySelector('textarea.textarea') as HTMLTextAreaElement;
}
```

**Critical for Document Analysis:**
- ChatGPT uses contenteditable div with ProseMirror (`#prompt-textarea`)
- Claude uses generic contenteditable div
- Gemini uses Quill editor (`.ql-editor`)
- Perplexity/Copilot use traditional `<textarea>`

**Implication:** Auto-paste mechanism will need platform-specific handling.

---

## Protected Domains Configuration

**Location:** `src/lib/types.ts` (UserConfig interface)

```typescript
settings: {
  enabled: boolean;
  protectedDomains: string[];  // List of domains to protect
  excludedDomains: string[];   // Blacklist for disabling
  // ...
}
```

**Current Implementation:**
- User can toggle protection per-domain
- When domain is not in `protectedDomains`, extension remains inactive
- Health check verifies domain protection status

**For Document Analysis:**
- Document upload feature should respect `protectedDomains` setting
- If user has ChatGPT enabled, document upload to ChatGPT should work
- If disabled, document upload modal should show upgrade/enable prompt

---

## Service Detection in Background

**Location:** `src/background/serviceWorker.ts` (inferred from message passing)

The background worker receives the URL with each request:

```javascript
// From inject.js line 264
window.postMessage({
  source: 'ai-pii-inject',
  messageId: messageId,
  type: 'SUBSTITUTE_REQUEST',
  payload: {
    body: requestBody,
    url: urlStr  // ← Service detection happens here
  }
}, '*');
```

**Service Worker Logic:**
1. Receives request with URL
2. Determines service type (ChatGPT, Claude, Gemini, etc.)
3. Applies service-specific substitution rules
4. Tracks stats per-service (`byService.chatgpt`, `byService.claude`, etc.)

---

## Special Case: Gemini XHR Interception

**Location:** `src/content/inject.js` lines 466-500

**Problem:** Gemini doesn't use `fetch()` - they use `XMLHttpRequest` for their `BardChatUi` API.

**Solution:** Separate XHR interceptor ONLY for Gemini:

```javascript
// ONLY runs on gemini.google.com
if (window.location.hostname.includes('gemini.google.com')) {
  const nativeXHROpen = XMLHttpRequest.prototype.open;
  const nativeXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    // Track request for interception
    this._interceptor = {
      url: url,
      method: method.toUpperCase(),
      shouldIntercept: url.includes('BardChatUi') || url.includes('batchexecute')
    };
    return nativeXHROpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.send = function(body) {
    // If shouldIntercept, substitute body before sending
    // ...
  };
}
```

**Implication for Document Upload:**
- Gemini might handle file uploads differently (XHR instead of fetch)
- Need to verify if Gemini's document upload uses `BardChatUi` or a separate endpoint
- May need XHR-based upload handling for Gemini

---

## Health Check System

**Location:** `src/content/inject.js` lines 24-110

The extension continuously monitors its connection health to prevent data leaks:

**Health States:**
- `isProtected = true` → Extension is connected and protecting
- `isProtected = false` → Extension disconnected, block all requests

**Fail-Safe Behavior:**
```javascript
if (!substituteRequest || !substituteRequest.success) {
  // SECURITY: Block the request instead of passing through
  throw new Error(
    `AI PII Sanitizer: Protection failed. Request blocked for your safety.`
  );
}
```

**Key Safety Feature:**
- If extension loses connection, ALL AI requests are **blocked** (not passed through)
- User sees modal: "Protection Lost - Reload Page or Disable Extension"
- Prevents accidental PII exposure during extension reload/crash

**For Document Upload:**
- Document upload should also verify health check before processing
- If connection lost during upload, block and show error
- Don't allow partial uploads (could leak real data)

---

## Activation Toast

**Location:** `src/content/content.ts` lines 46-131

When user visits a protected page, a toast appears:

```javascript
async function showActivationToast() {
  // Check if extension is enabled
  const response = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });

  if (!response?.success || !response.data?.settings?.enabled) {
    return; // Extension disabled
  }

  // Check if current domain is protected
  const protectedDomains = response.data?.settings?.protectedDomains || [];
  const currentDomain = window.location.hostname;
  const isDomainProtected = protectedDomains.some(domain =>
    currentDomain.includes(domain) || domain.includes(currentDomain)
  );

  if (!isDomainProtected) {
    return; // Not protected
  }

  // Show "You are protected" toast
  // ...
}
```

**For Document Upload:**
- Could show similar toast when document upload feature activates
- "Document protection enabled" or "Your files are protected"

---

## Platform-Specific Quirks

### ChatGPT
- Uses ProseMirror editor (contenteditable with structured DOM)
- Requires `<p>` tags for paragraphs, `<br>` for line breaks
- Endpoint: `/backend-api/conversation`
- File upload: Uses Azure Blob Storage (see `upload-endpoint-analysis.md`)

### Claude
- Uses simple contenteditable div
- Supports HTML with `<br>` tags
- Endpoint: `/api/organizations/.../chat_conversations`
- File upload: **TBD - needs research**

### Gemini
- Uses Quill rich text editor
- XHR-based API (not fetch)
- Endpoint: `/_/BardChatUi` + `data/batchexecute`
- File upload: **TBD - needs research**

### Perplexity
- Uses traditional `<textarea>`
- Socket.IO for real-time streaming
- Endpoint: `/socket.io` + `/rest`
- File upload: **TBD - needs research**

### Copilot
- Uses traditional `<textarea>`
- Backend: sydney.bing.com
- Endpoint: `/sydney/...`
- File upload: **TBD - needs research**

---

## Implications for Document Analysis Feature

### 1. **Multi-Platform Support Required**
- Document upload modal must work across all 5 platforms
- Each platform may have different upload mechanisms
- Need platform-specific upload handlers (ChatGPT uses Azure, others TBD)

### 2. **Context Constraints**
- File parsing must happen in **popup context** (where File API is available)
- Cannot parse files in service worker (no File API, no crypto.subtle for some operations)
- Cannot parse files in content script (no direct access to file inputs)

### 3. **Auto-Paste Mechanism**
- Must use platform-specific textarea selectors
- ChatGPT/Claude/Gemini: Insert HTML into contenteditable divs
- Perplexity/Copilot: Set `.value` on `<textarea>`
- Need to trigger proper input events for each platform

### 4. **Health Check Integration**
- Document upload must verify `isProtected` before processing
- Block upload if extension connection lost
- Show error modal if health check fails during upload

### 5. **Domain Protection Check**
- Only enable document upload if current platform is in `protectedDomains`
- Show upgrade/enable prompt if domain not protected

---

## Recommended Approach

### Phase 1: Modal Trigger (In Popup)
- Add "Document Analysis" feature card in Features tab
- Opens a file picker modal
- User selects file(s) to analyze

### Phase 2: File Processing (In Popup Context)
- Parse file (PDF.js for PDF, mammoth.js for DOCX, native for TXT)
- Extract text content
- Run through AliasEngine to detect PII
- Show preview modal with diff view (original ← → sanitized)

### Phase 3: Delivery Options (User Choice)
**Option A: Copy to Clipboard**
- Copy sanitized text to clipboard
- Show instructions: "Paste into ChatGPT/Claude/etc."

**Option B: Auto-Inject**
- Detect current platform (via `window.location.hostname`)
- Find platform-specific textarea
- Inject sanitized text directly
- Trigger input events

**Option C: Upload via API**
- Use platform's file upload endpoint (if available)
- Upload sanitized file directly
- More complex, requires reverse-engineering each platform

**Recommendation:** Start with Option A (copy/paste), then add Option B (auto-inject) once working.

---

## Next Steps

1. ✅ Platform detection documented
2. 🔜 Research file upload mechanisms for Claude, Gemini, Perplexity, Copilot
3. 🔜 Design modal UI for document analysis
4. 🔜 Implement file parser integration
5. 🔜 Build preview diff viewer
6. 🔜 Implement auto-inject for each platform

---

**Status:** ✅ Analysis Complete
**Confidence:** High - Real codebase analyzed
**Ready for Implementation:** Yes (with platform-specific research)
