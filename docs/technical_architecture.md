# Technical Architecture: AI PII Sanitizer

**A Deep Dive into How This Extension Actually Works**

This document explains the technical implementation of the AI PII Sanitizer Chrome extension, from basic Chrome extension concepts to the specific architectural decisions we made to solve real-world problems.

---

## Table of Contents

1. [Chrome Extension Basics](#chrome-extension-basics)
2. [The Core Challenge](#the-core-challenge)
3. [Our Architecture](#our-architecture)
4. [Message Passing Architecture](#message-passing-architecture)
5. [Text Substitution Engine](#text-substitution-engine)
6. [Request/Response Interception](#requestresponse-interception)
7. [Storage & Encryption](#storage--encryption)
8. [Debugging & Development](#debugging--development)
9. [Known Issues & Limitations](#known-issues--limitations)
10. [Future Improvements](#future-improvements)

---

## Chrome Extension Basics

### Manifest V3 Overview

Chrome extensions consist of several isolated contexts:

| Context | Access | Purpose | Our Use |
|---------|--------|---------|---------|
| **Background (Service Worker)** | Full Chrome APIs | Long-lived logic | Message routing, storage |
| **Content Script** | DOM + limited APIs | Interact with pages | Message relay |
| **Injected Script** | Full page context | Override native APIs | Fetch interception |
| **Popup** | Full Chrome APIs | UI for user | Alias management |

**Key Constraint:** These contexts CANNOT directly talk to each other using JavaScript. They must use Chrome's message passing APIs or `window.postMessage`.

### Why This Matters for PII Sanitization

To intercept AI requests, we need to:
1. Override `window.fetch` (requires page context)
2. Access Chrome storage (requires extension context)
3. Modify request/response bodies (requires both)

**Problem:** No single context has access to everything we need!

---

## The Core Challenge

### What We're Trying to Do

```
User types: "Tell me about Greg Barker"
           ↓ (intercept)
ChatGPT receives: "Tell me about Parker Craig"
           ↓ (AI processes)
ChatGPT returns: "Parker Craig is..."
           ↓ (decode)
User sees: "Greg Barker is..."
```

### Why It's Hard

1. **Fetch Override Location Problem**
   - Must override `window.fetch` in **page context** (where ChatGPT's code runs)
   - Content scripts run in **isolated context** (can't override page's fetch)
   - Solution: Inject a script tag that runs in page context

2. **Storage Access Problem**
   - Injected scripts have **no access** to Chrome storage APIs
   - Must relay messages through content script → background
   - Solution: Multi-hop message passing

3. **CSP (Content Security Policy) Problem**
   - Inline scripts are blocked by ChatGPT's CSP
   - Solution: Load script from extension's own origin using `web_accessible_resources`

4. **Manifest V3 Restrictions**
   - `webRequest` API (which could intercept fetch) removed in MV3
   - `declarativeNetRequest` can't modify request bodies
   - Solution: Fetch override in page context

---

## Our Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         ChatGPT Page                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  inject.js (PAGE CONTEXT)                                 │   │
│  │  - Overrides window.fetch                                 │   │
│  │  - Detects AI API calls                                   │   │
│  │  - Sends to content script via window.postMessage        │   │
│  └────────────┬─────────────────────────────────────────────┘   │
│               │ window.postMessage                               │
│               ↓                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  content.ts (ISOLATED CONTEXT)                            │   │
│  │  - Listens for window messages from inject.js            │   │
│  │  - Relays to background via chrome.runtime.sendMessage   │   │
│  └────────────┬─────────────────────────────────────────────┘   │
└───────────────┼──────────────────────────────────────────────────┘
                │ chrome.runtime.sendMessage
                ↓
┌─────────────────────────────────────────────────────────────────┐
│               background.ts (SERVICE WORKER)                     │
│  - Loads aliases from encrypted storage                         │
│  - Performs text substitution (real ↔ alias)                    │
│  - Returns modified text                                         │
└──────────────┬──────────────────────────────────────────────────┘
               │ chrome.storage.local
               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Chrome Storage (Encrypted)                    │
│  - User's alias mappings                                         │
│  - Configuration & stats                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Design Decision #1: Fetch Override vs declarativeNetRequest**
- ❌ `declarativeNetRequest`: Can't modify request bodies (only headers/redirects)
- ✅ **Fetch override**: Full control over request/response bodies

**Design Decision #2: Page Context Injection**
- ❌ Content script: Can't override page's `window.fetch`
- ✅ **Injected script**: Runs in same context as ChatGPT's code

**Design Decision #3: Message Relay Pattern**
- ❌ Direct communication: Not possible between page context and extension
- ✅ **Relay chain**: page → content script → background

---

## Message Passing Architecture

### Three-Layer Message Passing

#### Layer 1: Page Context → Content Script (window.postMessage)

**inject.js:**
```javascript
// Send message from page context
window.postMessage({
  source: 'ai-pii-inject',
  messageId: 'unique-id-123',
  type: 'SUBSTITUTE_REQUEST',
  payload: { body: requestBody }
}, '*');

// Listen for response
window.addEventListener('message', (event) => {
  if (event.data?.source === 'ai-pii-content' &&
      event.data?.messageId === messageId) {
    // Got response from content script
    const result = event.data.response;
  }
});
```

**Why window.postMessage?**
- Only way for page context to communicate with content script
- Not secure on its own (any page script can listen)
- We use `source` field to identify our messages

#### Layer 2: Content Script → Background (chrome.runtime.sendMessage)

**content.ts:**
```javascript
window.addEventListener('message', async (event) => {
  // Only process messages from our inject script
  if (event.data?.source !== 'ai-pii-inject') return;

  // Forward to background
  const response = await chrome.runtime.sendMessage({
    type: event.data.type,
    payload: event.data.payload
  });

  // Send response back to inject.js
  window.postMessage({
    source: 'ai-pii-content',
    messageId: event.data.messageId,
    response
  }, '*');
});
```

**Why the relay?**
- Injected scripts can't call `chrome.runtime.sendMessage`
- Content scripts act as a "bridge" between contexts

#### Layer 3: Background Handles Request

**background/serviceWorker.ts:**
```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch(error => sendResponse({ success: false, error }));
  return true; // Required for async response
});

async function handleMessage(message) {
  switch (message.type) {
    case 'SUBSTITUTE_REQUEST':
      return await substituteText(message.payload);
    // ... other handlers
  }
}
```

### Message Flow Example

```
1. User types "Greg Barker" in ChatGPT
2. ChatGPT calls fetch('/api/conversation', { body: "Greg Barker" })
3. inject.js intercepts fetch
4. inject.js → window.postMessage → content.ts
5. content.ts → chrome.runtime.sendMessage → background.ts
6. background.ts loads aliases, substitutes "Greg Barker" → "Parker Craig"
7. background.ts → response → content.ts
8. content.ts → window.postMessage → inject.js
9. inject.js calls real fetch with "Parker Craig"
10. ChatGPT receives modified request
```

---

## Text Substitution Engine

### Core Algorithm (aliasEngine.ts)

**Challenge:** Replace "Greg Barker" with "Parker Craig" while preserving:
- Case (GREG BARKER → PARKER CRAIG)
- Word boundaries (don't match "Gregory")
- Possessives (Greg's → Parker's)
- Multiple occurrences

**Solution: Multi-Pass Regex with Reverse Replacement**

```typescript
substitute(text: string, direction: 'encode' | 'decode'): SubstitutionResult {
  const map = direction === 'encode' ? this.realToAliasMap : this.aliasToRealMap;
  let result = text;

  // Sort by length (longest first) to handle overlapping matches
  const sortedKeys = Array.from(map.keys()).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    const replacement = map.get(key);
    const regex = new RegExp(`\\b${escapeRegex(key)}\\b`, 'gi');

    // Find all matches first
    const matches = [];
    let match;
    while ((match = regex.exec(result)) !== null) {
      matches.push({ match: match[0], index: match.index });
    }

    // Replace in REVERSE order (preserves earlier indices)
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      const preserved = preserveCase(m.match, replacement);
      result = result.substring(0, m.index) +
               preserved +
               result.substring(m.index + m.match.length);
    }
  }

  return { text: result, substitutions };
}
```

**Why Reverse Order?**
```
Text: "Greg Barker and Greg Barker"
Indices: [0, 16]

If we replace forward:
1. Replace at 0: "Parker Craig and Greg Barker"
   (index 16 is now WRONG - should be 20)
2. Replace at 16: FAILS (string changed)

If we replace backward:
1. Replace at 16: "Greg Barker and Parker Craig"
   (index 0 still valid)
2. Replace at 0: "Parker Craig and Parker Craig" ✅
```

### Case Preservation

```typescript
preserveCase(original: string, replacement: string): string {
  // All uppercase
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }

  // All lowercase
  if (original === original.toLowerCase()) {
    return replacement.toLowerCase();
  }

  // Title case (capitalize each word)
  const originalWords = original.split(' ');
  const replacementWords = replacement.split(' ');

  return replacementWords.map((word, i) => {
    const originalWord = originalWords[i];
    if (originalWord[0] === originalWord[0].toUpperCase()) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
  }).join(' ');
}
```

### Bidirectional Mapping

```typescript
// Build lookup maps
for (const alias of aliases) {
  // Forward: real → alias
  realToAliasMap.set(alias.realValue.toLowerCase(), alias.aliasValue);

  // Reverse: alias → real
  aliasToRealMap.set(alias.aliasValue.toLowerCase(), alias.realValue);
}

// Encoding (hide real name)
substitute(text, 'encode') // Uses realToAliasMap

// Decoding (reveal real name)
substitute(text, 'decode') // Uses aliasToRealMap
```

---

## Request/Response Interception

### Fetch Override Pattern

**inject.js:**
```javascript
// Save original fetch
const nativeFetch = window.fetch;

// Override with our version
window.fetch = async function(...args) {
  const [url, options] = args;

  // Only intercept AI API calls
  if (!isAIRequest(url)) {
    return nativeFetch.apply(this, args);
  }

  // 1. Extract request body
  const requestBody = options?.body || '';

  // 2. Send to background for substitution
  const { modifiedBody } = await sendToBackground('SUBSTITUTE_REQUEST', {
    body: requestBody
  });

  // 3. Call REAL fetch with modified body (NOT in background!)
  const response = await nativeFetch(url, {
    ...options,
    body: modifiedBody
  });

  // 4. Get response text
  const responseText = await response.text();

  // 5. Send to background for reverse substitution
  const { modifiedText } = await sendToBackground('SUBSTITUTE_RESPONSE', {
    text: responseText
  });

  // 6. Return modified response
  return new Response(modifiedText, {
    status: response.status,
    headers: response.headers
  });
};
```

### Why We DON'T Re-Fetch in Background

**Wrong approach (causes CORS errors):**
```javascript
// ❌ BAD: Background script tries to fetch
async function handleIntercept(url, body) {
  const modified = substituteText(body);

  // This fails with CORS!
  const response = await fetch(url, { body: modified });

  return response;
}
```

**Correct approach:**
```javascript
// ✅ GOOD: Background only substitutes text
async function handleSubstituteRequest({ body }) {
  const modified = substituteText(body);
  return { modifiedBody: modified };
}

// inject.js makes the actual fetch
const response = await nativeFetch(url, modifiedOptions);
```

**Why?**
- Background service workers have different CORS policies
- ChatGPT's cookies/auth only exist in page context
- Fetch in page = authenticated; Fetch in background = 401 Unauthorized

### Handling Streaming Responses (SSE)

ChatGPT uses Server-Sent Events (text/event-stream) for streaming responses:

```javascript
if (response.headers.get('content-type').includes('text/event-stream')) {
  // Stream handler
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true });

        // Substitute in chunk
        const { modifiedText } = await sendToBackground('SUBSTITUTE_RESPONSE', {
          text: chunk
        });

        // Pass through
        controller.enqueue(new TextEncoder().encode(modifiedText));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: response.headers
  });
}
```

### Parsing ChatGPT Request Format

ChatGPT uses nested message structures:

```javascript
// Simple format (sometimes)
{
  messages: [
    { role: "user", content: "Hello" }
  ]
}

// Complex format (most common)
{
  messages: [
    {
      role: "user",
      content: {
        content_type: "text",
        parts: ["Hello", "world"]
      }
    }
  ]
}
```

**Our parser handles both:**
```typescript
function extractAllText(data: any): string {
  if (data.messages && Array.isArray(data.messages)) {
    return data.messages.map(m => {
      // String content
      if (typeof m.content === 'string') return m.content;

      // Nested object with parts array
      if (m.content?.parts && Array.isArray(m.content.parts)) {
        return m.content.parts.join('\n');
      }

      return '';
    }).filter(Boolean).join('\n\n');
  }
  return '';
}
```

---

## Storage & Encryption

### Storage Architecture

**Chrome Storage API:**
```typescript
// Save
await chrome.storage.local.set({
  aliases: encryptedAliasData
});

// Load
const data = await chrome.storage.local.get('aliases');
```

**Why Encrypt?**
- Aliases contain real PII (names, emails, etc.)
- Chrome storage is accessible to other extensions (with permission)
- Local file system access possible
- Defense in depth

### Encryption Implementation

**Using Web Crypto API (AES-GCM):**
```typescript
async encrypt(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Generate random IV (initialization vector)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const key = await this.getEncryptionKey();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(combined);
}
```

**Key Derivation (PBKDF2):**
```typescript
async getEncryptionKey(): Promise<CryptoKey> {
  // Use extension ID as key material
  const keyMaterial = chrome.runtime.id;

  const importedKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(keyMaterial),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('ai-pii-sanitizer-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

**Security Considerations:**
- ✅ AES-256-GCM (authenticated encryption)
- ✅ Random IV per encryption
- ⚠️ Key derived from extension ID (changes per install)
- ⚠️ No password protection (extension context is trusted boundary)

---

## Debugging & Development

### Common Development Issues

#### 1. "Extension context invalidated"

**What:** Old content script trying to reach reloaded background script

**Solution:**
1. Reload extension
2. Hard refresh page (Ctrl+Shift+R) OR close and reopen tab
3. Fresh content script gets injected

**Why it happens:**
```
Old content script (still running)
  → tries chrome.runtime.sendMessage
  → background script doesn't exist anymore
  → Error: Extension context invalidated
```

#### 2. "Could not establish connection"

**What:** Message sent but no listener

**Causes:**
- Background script crashed
- Message type handler missing
- `return true` forgotten in onMessage listener

**Debug:**
```javascript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('📨 Received:', msg.type);

  handleMessage(msg)
    .then(response => {
      console.log('📤 Sending:', response);
      sendResponse(response);
    })
    .catch(error => {
      console.error('❌ Handler error:', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // CRITICAL: Keeps channel open for async response
});
```

#### 3. Substitutions not happening

**Debug checklist:**
```javascript
// In background console:
const engine = await AliasEngine.getInstance();
console.log('Aliases:', engine.getAliases());
// Should show your aliases

const result = engine.substitute('Greg Barker', 'encode');
console.log('Result:', result);
// Should show substitution
```

**Common causes:**
- Aliases not loaded (check storage)
- Case mismatch (we normalize to lowercase)
- Word boundary issues (regex `\b`)
- Alias disabled (`enabled: false`)

### Development Console Logs

**What to expect in ChatGPT page console:**
```
🛡️ AI PII Sanitizer: Loading...
🛡️ AI PII Sanitizer: Active and monitoring
🔒 AI PII Sanitizer: Intercepting https://chatgpt.com/backend-api/...
✅ Request substituted: 1 replacements
⚡ Streaming response detected
✅ Response decoded: 1 replacements
```

**What to expect in background service worker console:**
```
AI PII Sanitizer installed
🔄 Substituting request body
📝 Extracted text: Tell me about Greg Barker
📋 Active aliases: 1 - "Greg Barker" → "Parker Craig"
✅ Request substituted: 1 replacements
🔀 Changes: [{from: "Greg Barker", to: "Parker Craig", position: 15}]
```

### Inspecting Extension Components

1. **Background service worker:**
   - chrome://extensions → "service worker" link
   - Shows background console logs

2. **Content script:**
   - F12 on ChatGPT page → Console tab
   - Filter by filename: `content.js`

3. **Popup:**
   - Right-click extension icon → "Inspect popup"
   - Opens DevTools for popup

4. **Storage:**
   ```javascript
   // In any extension context
   chrome.storage.local.get(null, (data) => console.log(data));
   ```

---

## Known Issues & Limitations

### Current Limitations

1. **Dev Mode Only**
   - Not tested as packed extension
   - Debug logs still active
   - No production build

2. **ChatGPT Only**
   - Claude.ai parser ready but untested
   - Gemini parser ready but untested

3. **Request-Only Substitution**
   - Currently only encodes requests (user → AI)
   - Response decoding (AI → user) partially implemented
   - Streaming responses work but not all message formats tested

4. **No Error Recovery UI**
   - Errors only show in console
   - No user-facing notifications
   - Silent failures possible

5. **Extension ID Dependency**
   - Encryption key derived from extension ID
   - Reinstalling extension = new key = can't decrypt old data
   - Need persistent key storage solution

6. **Performance**
   - No request throttling
   - Every substitution iterates all aliases
   - No caching of compiled regexes

### Edge Cases Not Handled

1. **Multi-word Names with Punctuation**
   ```
   "O'Brien" → might not match correctly
   "Mary-Jane" → word boundary issues
   ```

2. **Names in Code Blocks**
   ```markdown
   # Greg Barker
   Currently substituted (maybe shouldn't be?)
   ```

3. **Partial Name Matches**
   ```
   Alias: "Greg" → "John"
   Text: "Gregory"
   Result: Not substituted (correct)
   Text: "Greg's friend Gregory"
   Result: Only "Greg" substituted
   ```

4. **Unicode/Emoji**
   - Not tested with non-ASCII names
   - Regex `\b` word boundaries might fail

### Browser Compatibility

- ✅ Chrome/Chromium (tested)
- ❓ Edge (should work, untested)
- ❌ Firefox (Manifest V3 implementation differs)
- ❌ Safari (different extension system)

---

## Future Improvements

### Phase 2: Production Readiness

1. **Remove Debug Logs**
   ```typescript
   const DEBUG = false; // or process.env.NODE_ENV !== 'production'

   function log(...args: any[]) {
     if (DEBUG) console.log(...args);
   }
   ```

2. **Error Handling UI**
   ```typescript
   // Show notification to user
   chrome.notifications.create({
     type: 'basic',
     title: 'AI PII Sanitizer',
     message: 'Failed to substitute text',
     iconUrl: 'icons/icon48.png'
   });
   ```

3. **Stats Tracking**
   ```typescript
   // Increment counter on each substitution
   async function updateStats(count: number) {
     const config = await storage.loadConfig();
     config.stats.totalSubstitutions += count;
     await storage.saveConfig(config);
   }
   ```

4. **Response Decoding**
   - Currently request substitution works
   - Need to ensure all AI response formats decoded
   - Test with code generation, markdown, etc.

### Phase 3: Enhanced Features

1. **Regex-Based Aliases**
   ```typescript
   {
     realValue: /\d{3}-\d{2}-\d{4}/, // SSN pattern
     aliasValue: '123-45-6789',
     type: 'regex'
   }
   ```

2. **Context-Aware Substitution**
   ```typescript
   // Don't substitute in code blocks
   if (isInsideCodeBlock(text, position)) {
     return; // Skip substitution
   }
   ```

3. **Performance Optimization**
   ```typescript
   // Cache compiled regexes
   private regexCache = new Map<string, RegExp>();

   getRegex(pattern: string): RegExp {
     if (!this.regexCache.has(pattern)) {
       this.regexCache.set(pattern, new RegExp(pattern, 'gi'));
     }
     return this.regexCache.get(pattern)!;
   }
   ```

4. **Batch Substitution**
   ```typescript
   // Process multiple patterns in single pass
   substituteAll(text: string, aliases: Alias[]): string {
     // Build single regex: (pattern1|pattern2|pattern3)
     const combined = aliases.map(a => escapeRegex(a.realValue)).join('|');
     const regex = new RegExp(`\\b(${combined})\\b`, 'gi');

     return text.replace(regex, (match) => {
       const alias = aliases.find(a =>
         a.realValue.toLowerCase() === match.toLowerCase()
       );
       return alias ? preserveCase(match, alias.aliasValue) : match;
     });
   }
   ```

### Phase 4: Advanced Architecture

1. **Background Service Worker Persistence**
   ```json
   // Currently: service worker terminates after 30s idle
   // Future: Keep alive with periodic alarms
   {
     "permissions": ["alarms"],
     "background": {
       "service_worker": "background.js",
       "type": "module"
     }
   }
   ```

2. **WebAssembly for Performance**
   ```typescript
   // Compile substitution engine to WASM
   import { substitute } from './substitution.wasm';

   // 10-100x faster than JavaScript regex
   const result = substitute(text, aliases);
   ```

3. **Shared Worker for Multi-Tab Coordination**
   ```typescript
   // Share AliasEngine instance across tabs
   const worker = new SharedWorker('worker.js');
   worker.port.postMessage({ type: 'substitute', text });
   ```

---

## Contributing

### Setting Up Development Environment

```bash
# Clone repo
git clone <repo-url>
cd AI_Interceptor

# Install dependencies
npm install

# Run tests
npm test

# Build for development (with watch)
npm run dev

# Build for production
npm run build
```

### Testing Changes

1. Make code changes
2. Run `npm run build`
3. Go to chrome://extensions
4. Click "Reload" on extension
5. Close and reopen ChatGPT tabs
6. Test your changes

### Architecture Principles

1. **Separation of Concerns**
   - inject.js: Only fetch interception
   - content.ts: Only message relay
   - background.ts: Only business logic
   - aliasEngine.ts: Only text substitution

2. **Defensive Programming**
   - Always check for null/undefined
   - Wrap Chrome API calls in try-catch
   - Provide fallbacks for failures
   - Log errors verbosely in development

3. **Testability**
   - Pure functions where possible
   - Avoid side effects in core logic
   - Mock Chrome APIs in tests
   - Unit test substitution engine thoroughly

### Code Style

```typescript
// Prefer async/await over promises
async function loadData() {
  const data = await chrome.storage.local.get('key');
  return data;
}

// Use optional chaining
const value = data?.nested?.property;

// Type everything
function substitute(text: string, direction: 'encode' | 'decode'): SubstitutionResult {
  // ...
}

// Document complex logic
/**
 * Replaces matches in reverse order to preserve string indices.
 *
 * Example: "Greg Barker and Greg Barker"
 * - Forward: indices shift after first replacement ❌
 * - Reverse: indices remain valid ✅
 */
```

---

## Additional Resources

### Chrome Extension Documentation
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Message Passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)
- [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

### Web APIs Used
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
- [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

### Related Projects
- [uBlock Origin](https://github.com/gorhill/uBlock) - Advanced request blocking
- [Privacy Badger](https://github.com/EFForg/privacybadger) - Tracker blocking
- [Greasemonkey](https://www.greasespot.net/) - Userscript injection

---

## Glossary

**AES-GCM**: Advanced Encryption Standard - Galois/Counter Mode (authenticated encryption)

**Chrome Storage**: Persistent key-value storage provided by Chrome extensions API

**Content Script**: JavaScript that runs in isolated context alongside web pages

**CSP**: Content Security Policy (restricts what scripts can run on a page)

**CORS**: Cross-Origin Resource Sharing (browser security policy)

**Injected Script**: JavaScript injected into page context (full DOM access)

**Manifest V3**: Latest Chrome extension platform (replaces V2)

**Page Context**: JavaScript execution environment of the actual web page

**Service Worker**: Background script that handles events and runs independently of pages

**SSE**: Server-Sent Events (streaming response format)

**Web Accessible Resources**: Extension files that can be loaded by web pages

---

## Document Version

- **Version**: 1.0.0
- **Last Updated**: 2025-10-07
- **Status**: Dev Mode Prototype Complete
- **Next Update**: After Phase 2 (Production Readiness)

---

**Questions or suggestions?** Open an issue on GitHub or submit a PR with improvements to this document!
