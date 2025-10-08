# Adding AI Services: Architecture Guide

## Overview

AI PII Sanitizer uses a **shared architecture** where all AI services are handled by the same code, separated by:

1. **URL patterns** - Identify which service is being called
2. **JSON format handlers** - Parse service-specific request/response formats
3. **Service detection** - Track stats per service

**All services share the same files** - no separate modules needed!

---

## Currently Supported Services

| Service | Domain | API Pattern | Status |
|---------|--------|-------------|--------|
| **ChatGPT** | openai.com, chatgpt.com | backend-api/conversation | ✅ Tested |
| **Claude** | claude.ai | api/organizations | ✅ Ready |
| **Gemini** | gemini.google.com | api | ⏳ Untested |
| **Perplexity** | perplexity.ai | socket.io, api | ⏳ Untested |
| **Poe** | poe.com | api | ⏳ Untested |
| **Copilot** | copilot.microsoft.com | api, sydney.bing.com/sydney | ⏳ Untested |
| **You.com** | you.com | api | ⏳ Untested |

---

## Architecture: How It Works

### 1. **inject.js** (Page Context)
Intercepts all `fetch()` calls and checks if URL matches AI service patterns.

```javascript
const aiDomains = [
  // ChatGPT
  'api.openai.com',
  'backend-api/conversation',

  // Claude
  'claude.ai/api/organizations',

  // Perplexity
  'perplexity.ai/api',

  // ... add more here
];

function isAIRequest(url) {
  return aiDomains.some(domain => url.includes(domain));
}
```

**Flow:**
1. User types in ChatGPT → `fetch()` to `backend-api/conversation`
2. `isAIRequest()` returns true
3. Send request body to background script for PII substitution
4. Make actual fetch with modified body
5. Decode response before returning to page

### 2. **serviceWorker.ts** (Background)
Handles PII substitution and service detection.

```typescript
function detectService(url: string): AIService {
  if (url.includes('openai.com')) return 'chatgpt';
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('perplexity.ai')) return 'perplexity';
  // ... add more here
  return 'unknown';
}
```

**Text Extraction (Format-Specific):**
```typescript
function extractAllText(data: any): string {
  // ChatGPT: { messages: [{ role, content }] }
  if (data.messages && Array.isArray(data.messages)) {
    return data.messages.map(m => m.content).join('\n\n');
  }

  // Claude: { prompt: "..." }
  if (data.prompt && typeof data.prompt === 'string') {
    return data.prompt;
  }

  // Gemini: { contents: [{ parts: [{ text }] }] }
  if (data.contents && Array.isArray(data.contents)) {
    return data.contents.flatMap(c => c.parts?.map(p => p.text)).join('\n\n');
  }

  // Add more formats as needed
  return '';
}
```

### 3. **manifest.json** (Permissions)
Declares which domains the extension can access.

```json
{
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://perplexity.ai/*"
    // ... add more here
  ],
  "content_scripts": [{
    "matches": [
      "https://chat.openai.com/*",
      "https://claude.ai/*",
      "https://perplexity.ai/*"
      // ... add more here
    ],
    "js": ["content.js"]
  }]
}
```

### 4. **types.ts** (TypeScript)
Defines service types for stats tracking.

```typescript
export type AIService =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'perplexity'
  | 'poe'
  | 'copilot'
  | 'you'
  | 'unknown';
```

### 5. **storage.ts** (Stats)
Tracks usage per service.

```typescript
byService: {
  chatgpt: { requests: 0, substitutions: 0 },
  claude: { requests: 0, substitutions: 0 },
  // ... add more here
}
```

---

## Adding a New AI Service (Step-by-Step)

**Example: Adding Mistral Chat (chat.mistral.ai)**

### Step 1: Find the API Endpoint
1. Visit https://chat.mistral.ai
2. Open DevTools → Network tab
3. Start a conversation
4. Find the API request (look for POST to `/api/...`)
5. Note the URL pattern (e.g., `chat.mistral.ai/api/chat`)

### Step 2: Find the Request Format
1. Click on the network request
2. Go to Payload tab
3. Copy the JSON structure

Example Mistral format:
```json
{
  "model": "mistral-large",
  "messages": [
    { "role": "user", "content": "Hello" }
  ]
}
```

### Step 3: Update Code

#### A. Add to `types.ts`
```typescript
export type AIService =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'perplexity'
  | 'poe'
  | 'copilot'
  | 'you'
  | 'mistral'  // ADD THIS
  | 'unknown';
```

```typescript
byService: {
  chatgpt: { requests: 0, substitutions: 0 },
  claude: { requests: 0, substitutions: 0 },
  gemini: { requests: 0, substitutions: 0 },
  perplexity: { requests: 0, substitutions: 0 },
  poe: { requests: 0, substitutions: 0 },
  copilot: { requests: 0, substitutions: 0 },
  you: { requests: 0, substitutions: 0 },
  mistral: { requests: 0, substitutions: 0 },  // ADD THIS
}
```

#### B. Add to `inject.js`
```javascript
const aiDomains = [
  // ... existing services

  // Mistral
  'chat.mistral.ai/api',  // ADD THIS
];
```

#### C. Add to `manifest.json`
```json
{
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://chat.mistral.ai/*"  // ADD THIS
  ],
  "content_scripts": [{
    "matches": [
      "https://chat.openai.com/*",
      "https://claude.ai/*",
      "https://chat.mistral.ai/*"  // ADD THIS
    ],
    "js": ["content.js"]
  }],
  "web_accessible_resources": [{
    "resources": ["inject.js"],
    "matches": [
      "https://chat.openai.com/*",
      "https://claude.ai/*",
      "https://chat.mistral.ai/*"  // ADD THIS
    ]
  }]
}
```

#### D. Add to `serviceWorker.ts`
```typescript
function detectService(url: string): AIService {
  if (url.includes('openai.com') || url.includes('chatgpt.com')) {
    return 'chatgpt';
  }
  if (url.includes('claude.ai')) {
    return 'claude';
  }
  if (url.includes('mistral.ai')) {  // ADD THIS
    return 'mistral';
  }
  // ... rest
  return 'unknown';
}
```

```typescript
const serviceName = service === 'chatgpt' ? 'ChatGPT' :
                   service === 'claude' ? 'Claude' :
                   service === 'gemini' ? 'Gemini' :
                   service === 'perplexity' ? 'Perplexity' :
                   service === 'poe' ? 'Poe' :
                   service === 'copilot' ? 'Copilot' :
                   service === 'you' ? 'You.com' :
                   service === 'mistral' ? 'Mistral' :  // ADD THIS
                   'Unknown';
```

#### E. Add Format Handler (if needed)
If Mistral uses the same `{ messages: [...] }` format as ChatGPT, no change needed!

If it's different, add to `extractAllText()`:
```typescript
function extractAllText(data: any): string {
  // ... existing handlers

  // Mistral format (if different from ChatGPT)
  if (data.model && data.model.includes('mistral')) {
    // Handle Mistral-specific format
    return data.messages.map(m => m.content).join('\n\n');
  }

  return '';
}
```

#### F. Update `storage.ts`
Add to default config:
```typescript
protectedDomains: [
  'chat.openai.com',
  'chatgpt.com',
  'claude.ai',
  'gemini.google.com',
  'perplexity.ai',
  'poe.com',
  'copilot.microsoft.com',
  'you.com',
  'chat.mistral.ai',  // ADD THIS
],

byService: {
  chatgpt: { requests: 0, substitutions: 0 },
  claude: { requests: 0, substitutions: 0 },
  gemini: { requests: 0, substitutions: 0 },
  perplexity: { requests: 0, substitutions: 0 },
  poe: { requests: 0, substitutions: 0 },
  copilot: { requests: 0, substitutions: 0 },
  you: { requests: 0, substitutions: 0 },
  mistral: { requests: 0, substitutions: 0 },  // ADD THIS
},
```

Add to `createProfile()`:
```typescript
usageStats: {
  totalSubstitutions: 0,
  lastUsed: 0,
  byService: {
    chatgpt: 0,
    claude: 0,
    gemini: 0,
    perplexity: 0,
    poe: 0,
    copilot: 0,
    you: 0,
    mistral: 0,  // ADD THIS
  },
  // ...
}
```

Add to migration code (2 places):
```typescript
byService: {
  chatgpt: 0,
  claude: 0,
  gemini: 0,
  perplexity: 0,
  poe: 0,
  copilot: 0,
  you: 0,
  mistral: 0,  // ADD THIS
}
```

AND
```typescript
byService: {
  chatgpt: { requests: 0, substitutions: 0 },
  claude: { requests: 0, substitutions: 0 },
  gemini: { requests: 0, substitutions: 0 },
  perplexity: { requests: 0, substitutions: 0 },
  poe: { requests: 0, substitutions: 0 },
  copilot: { requests: 0, substitutions: 0 },
  you: { requests: 0, substitutions: 0 },
  mistral: { requests: 0, substitutions: 0 },  // ADD THIS
},
```

#### G. Update `popup-v2.ts`
Add to clear stats:
```typescript
byService: {
  chatgpt: { requests: 0, substitutions: 0 },
  claude: { requests: 0, substitutions: 0 },
  gemini: { requests: 0, substitutions: 0 },
  perplexity: { requests: 0, substitutions: 0 },
  poe: { requests: 0, substitutions: 0 },
  copilot: { requests: 0, substitutions: 0 },
  you: { requests: 0, substitutions: 0 },
  mistral: { requests: 0, substitutions: 0 },  // ADD THIS
},
```

### Step 4: Build and Test
```bash
npm run build
```

Then:
1. Reload extension
2. Visit Mistral chat
3. Send message with PII
4. Check Network tab → request should have aliases
5. Check Debug Console → should show "Mistral: X items replaced"

---

## Common Request Formats

### Format 1: Messages Array (ChatGPT, Mistral, etc.)
```json
{
  "messages": [
    { "role": "user", "content": "Hello, my name is Greg" }
  ]
}
```

**Handler:** Already works! Uses `extractAllText()` for messages array.

### Format 2: Simple Prompt (Claude)
```json
{
  "prompt": "Hello, my name is Greg"
}
```

**Handler:** Already works! Uses `extractAllText()` for prompt field.

### Format 3: Nested Parts (Gemini)
```json
{
  "contents": [
    {
      "parts": [
        { "text": "Hello, my name is Greg" }
      ]
    }
  ]
}
```

**Handler:** Already works! Uses `extractAllText()` for contents/parts.

### Format 4: Custom (need new handler)
If service uses a totally different format, add to `extractAllText()`:

```typescript
function extractAllText(data: any): string {
  // ... existing handlers

  // Custom service format
  if (data.someUniqueField) {
    // Extract text from custom structure
    return data.someUniqueField.text;
  }

  return '';
}
```

---

## Testing Checklist

For each new service:

- [ ] URL pattern matches API endpoint
- [ ] Extension activates on service domain
- [ ] Request intercepted (see inject.js console log)
- [ ] PII replaced in request (check Network tab)
- [ ] Service detected correctly (check background console)
- [ ] Response decoded correctly (see real PII in UI)
- [ ] Stats increment for service (check popup)
- [ ] Activity log shows service name (check Debug Console)
- [ ] No errors in any console

---

## Troubleshooting

### Issue: Extension doesn't activate
**Solution:** Check manifest.json permissions match exact domain

### Issue: No substitution happening
**Solution:**
1. Check API pattern in inject.js matches actual URL
2. Check request format in Network tab
3. Add handler to extractAllText() if needed

### Issue: Service detected as "unknown"
**Solution:** Add URL check to detectService() function

### Issue: Stats not incrementing
**Solution:**
1. Check service name in types.ts matches detectService() return value
2. Ensure byService has entry for this service
3. Check logActivity() is being called

---

## Files to Update (Checklist)

When adding a new service, update these 6 files:

1. ✅ `src/lib/types.ts` - Add to AIService type and byService stats
2. ✅ `src/content/inject.js` - Add URL pattern to aiDomains array
3. ✅ `src/manifest.json` - Add to host_permissions, content_scripts, web_accessible_resources
4. ✅ `src/background/serviceWorker.ts` - Add to detectService() and serviceName mapping
5. ✅ `src/lib/storage.ts` - Add to default config, createProfile(), and migration (3 places)
6. ✅ `src/popup/popup-v2.ts` - Add to clear stats

**Optional:**
7. `src/background/serviceWorker.ts` - Add format handler to extractAllText() if needed

---

## Why This Architecture?

**Pros:**
✅ Easy to add new services (just add URL patterns)
✅ Shared substitution logic (no duplication)
✅ Automatic format detection
✅ Centralized stats tracking
✅ Easier to maintain

**Cons:**
❌ All services share same file (harder to debug service-specific issues)
❌ Large manifest permissions list
❌ If one service breaks, need to check shared code

**Alternative:** Could use separate modules per service, but adds complexity for minimal benefit.

---

## Future Enhancements

**Auto-detection:**
Could automatically detect new AI services by looking for common patterns:
- POST requests with `messages` or `prompt` fields
- URLs containing `/api/chat` or `/api/completions`
- JSON responses with streaming data

**Plugin System:**
Could allow users to add custom services via popup:
```javascript
{
  "serviceName": "MyAI",
  "urlPattern": "myai.com/api",
  "requestFormat": "messages", // or "prompt" or "custom"
  "enabled": true
}
```

This would eliminate need to update code for every service!
