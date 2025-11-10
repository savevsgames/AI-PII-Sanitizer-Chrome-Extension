# PromptBlocker - System Architecture

**Version:** 1.0.0
**Last Updated:** 2025-11-01

This document provides a comprehensive technical overview of PromptBlocker's architecture, component design, and data flow.

---

## 📊 High-Level Overview

PromptBlocker is a Chrome Extension (Manifest V3) that protects user privacy by automatically replacing personally identifiable information (PII) with aliases when interacting with AI chat services.

### Core Value Proposition
**Problem:** Users share sensitive personal information (names, emails, phone numbers) with AI services, creating privacy risks and potential data exposure.

**Solution:** Real-time PII substitution - users see their alias information in the AI chat, but their real information is never sent to AI servers.

### Key Features
- **Identity Aliasing:** Replace name, email, phone, address with aliases
- **API Key Vault:** Detect and redact API keys before sending (PRO)
- **Custom Redaction:** User-defined patterns (SSN, credit cards, etc.) (PRO)
- **Multi-Service Support:** ChatGPT, Claude, Gemini, Perplexity, Poe, Copilot, You.com
- **Local Encryption:** AES-256-GCM encryption for all stored data
- **Bidirectional Substitution:** Real → Alias (outgoing), Alias → Real (incoming responses)

---

## 🏗️ Technology Stack

### Core Technologies
- **TypeScript:** Type-safe development, compile-time error checking
- **Chrome Extension Manifest V3:** Modern extension platform (required by Chrome Web Store)
- **Web Crypto API:** Browser-native encryption (AES-256-GCM)
- **Chrome Storage API:** Local data persistence

### Build Tools
- **TypeScript Compiler (tsc):** Transpile TS → JS
- **npm scripts:** Build automation
- **Jest:** Unit testing framework
- **Playwright:** E2E testing framework

### Development Tools
- **ESLint:** Code linting
- **Prettier:** Code formatting
- **Git:** Version control

---

## 🎯 Chrome Extension Architecture (Manifest V3)

### Three-Context Model

PromptBlocker uses Chrome's three-context architecture for security isolation:

```
┌─────────────────────────────────────────────────────────────┐
│                         WEB PAGE                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Page Context (inject.js)                             │  │
│  │  - Direct DOM access                                  │  │
│  │  - Event listeners on page elements                   │  │
│  │  - NO Chrome API access (security isolation)          │  │
│  │  - Intercepts fetch/XMLHttpRequest                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ⬇️ window.postMessage             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Isolated World (content.ts)                          │  │
│  │  - Chrome API access (chrome.runtime, chrome.storage) │  │
│  │  - Isolated from page scripts (security)              │  │
│  │  - Message relay to background                        │  │
│  │  - Health check responder                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ⬇️ chrome.runtime.sendMessage
┌─────────────────────────────────────────────────────────────┐
│  Background Service Worker (serviceWorker.ts)              │
│  - Message routing and orchestration                       │
│  - Storage management (profiles, config)                   │
│  - Health check coordination                               │
│  - Badge management (protection status)                    │
│  - Tab tracking and lifecycle management                   │
└─────────────────────────────────────────────────────────────┘
```

### Why Three Contexts?

**Security Isolation:**
- Page scripts cannot access Chrome APIs (prevents malicious code from accessing extension)
- Content scripts run in isolated world (separate JavaScript execution context)
- Background service worker has full Chrome API access but no DOM access

**Communication Flow:**
1. Page context (inject.js) intercepts requests via `window.postMessage`
2. Isolated world (content.ts) receives message, forwards to background via `chrome.runtime.sendMessage`
3. Background (serviceWorker.ts) processes message, returns response
4. Response flows back through content.ts → inject.js → page

---

## 📦 Component Architecture

### 1. Background Service Worker (`src/background/serviceWorker.ts`)

**Responsibilities:**
- Message routing (central message handler)
- Storage operations (profiles, config, API keys)
- Health check coordination
- Badge management (protection status indicator)
- Tab lifecycle tracking
- Extension install/update handling

**Key Functions:**

```typescript
// Message routing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SUBSTITUTE_PII': // Alias substitution
    case 'HEALTH_CHECK':   // Connection verification
    case 'PROTECTION_LOST': // Notify user of protection failure
    case 'CREATE_PROFILE': // Profile management
    case 'DETECT_API_KEYS': // API key detection (PRO)
    // ... 20+ message types
  }
});

// Badge management
async function updateBadge(tabId: number, status: 'protected' | 'unprotected') {
  const color = status === 'protected' ? '#00FF00' : '#FF0000';
  await chrome.action.setBadgeBackgroundColor({ color, tabId });
  await chrome.action.setBadgeText({ text: status === 'protected' ? '✓' : '✗', tabId });
}

// Health check system
setInterval(async () => {
  // Check all AI service tabs
  const tabs = await chrome.tabs.query({ url: AI_SERVICE_PATTERNS });
  for (const tab of tabs) {
    await checkTabHealth(tab.id);
  }
}, 5000); // Every 5 seconds
```

**Storage Manager Integration:**
```typescript
const storage = StorageManager.getInstance();
const profiles = await storage.loadProfiles();
const config = await storage.loadConfig();
```

---

### 2. Content Script (`src/content/content.ts`)

**Responsibilities:**
- Message relay between page and background
- Health check responder
- Inject page script (inject.js) into page context
- DOM injection coordination

**Injection Strategy:**
```typescript
// Inject inject.js into page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// Listen for messages from page
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data.source !== 'promptblocker-page') return;

  // Forward to background
  chrome.runtime.sendMessage(event.data, (response) => {
    // Send response back to page
    window.postMessage({
      source: 'promptblocker-content',
      type: event.data.type + '_RESPONSE',
      data: response
    }, '*');
  });
});
```

**Health Check Handler:**
```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'HEALTH_CHECK') {
    // Respond immediately to confirm content script is alive
    sendResponse({ success: true, status: 'ok' });
    return true;
  }
});
```

---

### 3. Page Script (`src/content/inject.js`)

**Responsibilities:**
- Request interception (fetch, XMLHttpRequest)
- Response transformation
- PII substitution coordination
- Service-specific integration (ChatGPT, Claude, Gemini)

**Request Interception:**
```typescript
// Intercept fetch requests
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const [url, options] = args;

  // Only intercept AI service requests
  if (!isAIServiceRequest(url)) {
    return originalFetch.apply(this, args);
  }

  // Extract request body
  const body = options?.body;

  // Send to background for PII substitution
  const substituted = await sendMessageToBackground({
    type: 'SUBSTITUTE_PII',
    text: body,
    direction: 'encode' // Real → Alias
  });

  // Modify request with substituted text
  const modifiedOptions = {
    ...options,
    body: substituted.text
  };

  // Send modified request
  const response = await originalFetch.call(this, url, modifiedOptions);

  // Transform response (decode aliases back to real)
  const transformedResponse = await transformResponse(response);

  return transformedResponse;
};
```

**Response Transformation:**
```typescript
async function transformResponse(response) {
  const clone = response.clone();
  const text = await clone.text();

  // Decode aliases back to real values
  const decoded = await sendMessageToBackground({
    type: 'SUBSTITUTE_PII',
    text,
    direction: 'decode' // Alias → Real
  });

  // Return modified response
  return new Response(decoded.text, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}
```

---

### 4. Popup UI (`src/popup/popup-v2.ts`, `popup-v2.html`)

**Responsibilities:**
- Profile management (CRUD operations)
- Statistics display
- Settings configuration
- Debug information
- User onboarding

**Tab Structure:**
```typescript
const tabs = [
  'aliases',   // Profile management
  'stats',     // Usage statistics
  'features',  // Feature overview
  'settings',  // Extension settings
  'debug'      // Debug information
];
```

**Profile Management:**
```html
<div class="profile-list" id="profileList">
  <!-- Profile cards rendered here -->
</div>

<button id="addProfileBtn">+ New Profile</button>

<!-- Profile modal -->
<div id="profileModal" class="modal">
  <form id="profileForm">
    <input name="profileName" placeholder="Profile Name">
    <input name="realName" placeholder="Your Real Name">
    <input name="aliasName" placeholder="Alias Name">
    <!-- ... more fields ... -->
  </form>
</div>
```

**State Management:**
```typescript
class PopupState {
  profiles: AliasProfile[] = [];
  config: UserConfig | null = null;
  activeTab: string = 'aliases';

  async loadProfiles() {
    this.profiles = await storage.loadProfiles();
    this.render();
  }

  async createProfile(data: Partial<AliasProfile>) {
    const profile = await storage.createProfile(data);
    this.profiles.push(profile);
    this.render();
  }
}
```

---

## 🔐 Data Storage & Encryption

### Storage Architecture

**Chrome Storage API:**
- Uses `chrome.storage.local` (not `localStorage` - more secure)
- No size limits for extensions
- Persists across browser sessions
- Encrypted at rest by Chrome

**Encryption Layer (AES-256-GCM):**
```typescript
class StorageManager {
  private encryptionKey: CryptoKey;

  async initialize() {
    // Derive encryption key from runtime ID
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(chrome.runtime.id),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    this.encryptionKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptData(data: any): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encoded
    );

    return JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    });
  }

  async decryptData(encrypted: string): Promise<any> {
    const { iv, data } = JSON.parse(encrypted);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      this.encryptionKey,
      new Uint8Array(data)
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  }
}
```

### Data Models

**AliasProfile:**
```typescript
interface AliasProfile {
  id: string;                    // Unique identifier
  profileName: string;           // User-friendly name
  enabled: boolean;              // Active/inactive
  real: PIIMapping;              // Real PII
  alias: PIIMapping;             // Alias PII
  variations?: PIIMapping[];     // Auto-generated variations (PRO)
  settings: ProfileSettings;     // Per-profile settings
  metadata: ProfileMetadata;     // Usage stats, timestamps
}

interface PIIMapping {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  ssn?: string;
  // ... extensible
}
```

**UserConfig:**
```typescript
interface UserConfig {
  version: number;
  account: {
    emailOptIn: boolean;
    tier: 'free' | 'pro';
    syncEnabled: boolean;
  };
  settings: {
    enabled: boolean;
    defaultMode: 'auto' | 'manual';
    showNotifications: boolean;
    protectedDomains: string[];
    excludedDomains: string[];
  };
  profiles: AliasProfile[];
  stats: GlobalStats;
}
```

---

## 🔄 Data Flow

### Outgoing Request Flow (Real → Alias)

```
1. User types in ChatGPT: "My name is John Smith"
   ⬇️
2. inject.js intercepts fetch() call
   ⬇️
3. Extract request body: { messages: [{ content: "My name is John Smith" }] }
   ⬇️
4. Send to background via content.ts:
   { type: 'SUBSTITUTE_PII', text: "My name is John Smith", direction: 'encode' }
   ⬇️
5. Background loads active profiles, applies AliasEngine
   ⬇️
6. AliasEngine.substitute("My name is John Smith", profiles)
   → "My name is Alex Johnson"
   ⬇️
7. Return substituted text to inject.js
   ⬇️
8. inject.js modifies request body:
   { messages: [{ content: "My name is Alex Johnson" }] }
   ⬇️
9. Send modified request to ChatGPT API
   ✅ ChatGPT receives "Alex Johnson", not "John Smith"
```

### Incoming Response Flow (Alias → Real)

```
1. ChatGPT responds: "Hello Alex Johnson! How can I help you?"
   ⬇️
2. inject.js intercepts response
   ⬇️
3. Send to background:
   { type: 'SUBSTITUTE_PII', text: "Hello Alex Johnson!", direction: 'decode' }
   ⬇️
4. Background applies reverse substitution
   ⬇️
5. AliasEngine.substitute("Hello Alex Johnson!", profiles, 'decode')
   → "Hello John Smith!"
   ⬇️
6. Return decoded text to inject.js
   ⬇️
7. inject.js modifies response:
   "Hello John Smith! How can I help you?"
   ⬇️
8. User sees their real name in the response
   ✅ User experience: sees real name, but AI never saw it
```

---

## 🎯 Service-Specific Integration

### Supported Services (7 total)

Each service requires custom integration logic:

**1. ChatGPT (chat.openai.com)**
- API Endpoint: `/backend-api/conversation`
- Request Format: JSON with `messages` array
- Response Format: Server-Sent Events (SSE)
- Special Handling: Streaming responses require chunk-by-chunk transformation

**2. Claude (claude.ai)**
- API Endpoint: `/api/organizations/{org}/chat_conversations/{id}/completion`
- Request Format: JSON with `prompt` field
- Response Format: JSON chunks (newline-delimited)

**3. Gemini (gemini.google.com)**
- API Endpoint: `/_/BardChatUi/data/batchexecute`
- Request Format: Google's proprietary format (encoded array)
- Response Format: Complex nested array structure

**4. Perplexity (perplexity.ai)**
- API Endpoint: `/socket.io/` (WebSocket)
- Protocol: Socket.IO
- Special Handling: WebSocket message interception

**5. Poe (poe.com)**
- API Endpoint: `/api/gql_POST`
- Request Format: GraphQL
- Special Handling: Multiple query types

**6. GitHub Copilot (copilot.github.com)**
- API Endpoint: `/conversation`
- Request Format: JSON
- Context: Code-focused chat

**7. You.com (you.com)**
- API Endpoint: `/api/chats`
- Request Format: JSON
- Response Format: SSE

---

## 🧪 Testing Architecture

### Unit Tests (105 tests, 98-100% coverage)

**Test Framework:** Jest with ts-jest

**Test Structure:**
```
tests/
├── utils.test.ts           # 39 tests - Utility functions
├── aliasEngine.test.ts     # 9 tests - Alias substitution
├── apiKeyDetector.test.ts  # 37 tests - API key detection
├── redactionEngine.test.ts # 35 tests - Custom redaction
├── storage.test.ts         # 6 tests - Storage operations
└── setup.js                # Global mocks (Chrome APIs)
```

**Mock Strategy:**
```javascript
// tests/setup.js
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    }
  },
  runtime: {
    id: 'test-extension-id'
  }
};
```

### E2E Tests (Playwright)

**Test Framework:** Playwright with Chrome extension support

**Custom Fixtures:**
```typescript
// tests/e2e/fixtures.ts
export const test = base.extend({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../../dist');
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
      ]
    });
    await use(context);
  }
});
```

**Test Coverage:**
- Profile CRUD operations
- ChatGPT integration workflow
- Protection status system
- Multiple profile scenarios

---

## 🔒 Security Considerations

### Threat Model

**Protected Against:**
- ✅ PII leakage to AI services
- ✅ API key exposure in requests
- ✅ Plaintext storage of sensitive data
- ✅ Malicious page scripts accessing extension data

**Not Protected Against:**
- ❌ Screen scraping / screenshots
- ❌ Clipboard monitoring by page scripts
- ❌ Shoulder surfing / physical access
- ❌ Browser/OS level keyloggers

### Security Best Practices

**1. Content Security Policy (CSP):**
```json
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

**2. Isolated Worlds:**
- Content scripts run in isolated JavaScript context
- Page scripts cannot access `chrome` APIs
- Communication only via `window.postMessage`

**3. Encryption:**
- AES-256-GCM for all stored profiles
- Unique key per browser (derived from `chrome.runtime.id`)
- IV randomized for each encryption operation

**4. Fail-Safe Defaults:**
- Badge defaults to "unprotected" until health check passes
- Extension disabled = no protection (clear user communication)
- Missing profile = no substitution (don't guess)

---

## 📈 Performance Considerations

### Optimization Strategies

**1. Event-Driven Updates:**
- Use `chrome.storage.onChanged` instead of polling
- Prevents memory leaks and reduces CPU usage

**2. Exponential Backoff (Health Checks):**
- Start at 1s, max at 32s
- Reduces network traffic for stable connections

**3. Lazy Loading:**
- Popup components load on-demand
- Profile data loaded only when needed

**4. Singleton Pattern:**
- StorageManager single instance prevents duplicate operations
- Reduces encryption/decryption overhead

**5. String Caching:**
- Cache compiled regex patterns
- Reuse alias mappings across requests

### Performance Metrics

**Measured Performance:**
- Request interception: < 5ms overhead
- PII substitution: < 10ms for typical message
- Storage encryption: < 50ms for full profile
- Health check: < 100ms round-trip
- Memory usage: ~10-20 MB (stable)

---

## 🚀 Build & Deployment

### Build Process

```bash
# Development build
npm run build:dev

# Production build
npm run build:prod

# Watch mode (auto-rebuild)
npm run build:watch
```

**Build Output:**
```
dist/
├── background.js         # Service worker (transpiled TS)
├── content.js            # Content script (transpiled TS)
├── inject.js             # Page script (transpiled TS)
├── popup-v2.html         # Popup UI
├── popup-v2.js           # Popup logic (transpiled TS)
├── popup-v2.css          # Popup styles
├── manifest.json         # Extension manifest
├── icons/                # Extension icons
└── lib/                  # Shared libraries
```

### Extension Structure

```
PromptBlocker/
├── src/                  # Source code
│   ├── background/       # Service worker (modular architecture)
│   │   ├── serviceWorker.ts         # Main orchestrator (~150 lines)
│   │   ├── handlers/                # Message handlers
│   │   │   ├── MessageRouter.ts     # Central routing
│   │   │   ├── AliasHandlers.ts     # Alias CRUD
│   │   │   ├── ConfigHandlers.ts    # Config operations
│   │   │   ├── APIKeyHandlers.ts    # API key management
│   │   │   └── CustomRulesHandlers.ts # Custom rules
│   │   ├── processors/              # Request/response processing
│   │   │   ├── RequestProcessor.ts  # PII substitution
│   │   │   └── ResponseProcessor.ts # Alias decoding
│   │   ├── managers/                # Feature managers
│   │   │   ├── BadgeManager.ts      # Badge state
│   │   │   ├── ContentScriptManager.ts # Script injection
│   │   │   └── ActivityLogger.ts    # Logging
│   │   └── utils/                   # Utilities
│   │       └── ServiceDetector.ts   # AI service detection
│   ├── content/          # Content scripts
│   ├── popup/            # Popup UI
│   └── lib/              # Shared libraries
│       ├── storage/      # Modular storage system
│       │   ├── index.ts                        # Public API
│       │   ├── StorageEncryptionManager.ts     # Encryption
│       │   ├── StorageConfigManager.ts         # Config
│       │   ├── StorageProfileManager.ts        # Profiles
│       │   ├── StorageAPIKeyVaultManager.ts    # API keys
│       │   ├── StorageCustomRulesManager.ts    # Custom rules
│       │   ├── StoragePromptTemplatesManager.ts # Templates
│       │   ├── StorageDocumentAliasManager.ts  # Documents
│       │   ├── StorageMigrationManager.ts      # Migrations
│       │   └── storage-utils.ts                # Utilities
│       ├── aliasEngine.ts    # Substitution logic
│       ├── store.ts          # State management
│       └── types.ts          # TypeScript definitions
├── dist/                 # Build output (gitignored)
├── tests/                # Test suite
├── docs/                 # Documentation
└── manifest.json         # Extension manifest
```

---

## 🔧 Extension Lifecycle

### Install Flow

```
1. User installs extension
   ⬇️
2. chrome.runtime.onInstalled fires (reason: 'install')
   ⬇️
3. Background initializes storage
   ⬇️
4. Create default config with enabled: true
   ⬇️
5. Show welcome page (optional)
   ⬇️
6. Badge initialized to "unprotected" (no profiles yet)
```

### Update Flow

```
1. Extension updates (new version released)
   ⬇️
2. chrome.runtime.onInstalled fires (reason: 'update')
   ⬇️
3. Background migrates data if needed (version check)
   ⬇️
4. Reload all AI service tabs (force content script re-injection)
   ⬇️
5. Show "update successful" notification (optional)
```

### Uninstall Flow

```
1. User uninstalls extension
   ⬇️
2. chrome.storage.local automatically cleared by Chrome
   ⬇️
3. Content scripts stop running (no cleanup needed)
   ⬇️
4. Service worker terminated
```

---

## 📚 Further Reading

- [Chrome Extension Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Content Script Isolated Worlds](https://developer.chrome.com/docs/extensions/mv3/content_scripts/#isolated_world)
- [Web Crypto API Specification](https://www.w3.org/TR/WebCryptoAPI/)
- [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)

---

**This architecture enables PromptBlocker to provide robust, transparent PII protection across multiple AI services while maintaining security, performance, and user experience.**

**Last Updated:** 2025-11-01
