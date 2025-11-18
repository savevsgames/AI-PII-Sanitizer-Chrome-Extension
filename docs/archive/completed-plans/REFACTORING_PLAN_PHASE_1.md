# Code Refactoring Plan - Phase 1
**Date Created:** 2025-01-09
**Date Completed:** 2025-01-10
**Status:** ✅ COMPLETED
**Complexity:** ⚠️ HIGH - Breaking apart 3,500+ lines into focused modules
**Actual Time:** 1 week
**Context:** Pre-migration refactor to simplify Firebase Web Extension Migration (Phases 2-7)

---

## 🎉 COMPLETION SUMMARY

**Phase 1 Refactoring Successfully Completed!**

### Achievements:
- ✅ **Storage System Modularized:** Broke down 2,270-line `storage.ts` into 10 focused modules
  - Main orchestrator: `storage/index.ts` (~300 lines)
  - 9 specialized managers in `src/lib/storage/` directory
  - Clean separation of concerns with dependency injection

- ✅ **Service Worker Modularized:** Broke down 1,259-line `serviceWorker.ts` into 13 focused modules
  - Main orchestrator: `serviceWorker.ts` (~150 lines)
  - 12 specialized modules across 4 subdirectories:
    - `handlers/` - Message routing and CRUD operations (5 files)
    - `processors/` - Request/response processing (2 files)
    - `managers/` - Badge, content script, and activity logging (3 files)
    - `utils/` - Service detection utilities (1 file)

- ✅ **All Tests Passing:** No regressions introduced
- ✅ **Build Successful:** TypeScript compilation with no errors
- ✅ **Ready for Firebase Migration:** Codebase now prepared for Phases 2-7

### File Count Changes:
- **Before:** 2 monolithic files (3,529 total lines)
- **After:** 25 modular files (~3,700 lines with improved organization)
- **Average file size:** ~150 lines (down from 1,765 lines)

### Benefits Realized:
- 🔧 **Maintainability:** Each module has a single, clear responsibility
- 🧪 **Testability:** Modules can be tested in isolation
- 📚 **Readability:** Descriptive naming convention makes code self-documenting
- 🚀 **Scalability:** Easy to extend features without touching core orchestration
- 🔄 **Firebase Migration Ready:** Modular structure simplifies upcoming auth migration

---

---

## Executive Summary

**Problem:** Two monolithic files are becoming unmaintainable:
- `storage.ts` - 2,270 lines with 10 distinct functional areas
- `serviceWorker.ts` - 1,259 lines with 13 functional areas

**Solution:** Extract focused modules with descriptive names following your naming convention:
- **Storage-specific code:** `Storage[Function]Manager.ts` (e.g., `StorageEncryptionManager.ts`)
- **General-purpose code:** `[Function]Manager.ts` (e.g., `BadgeManager.ts`)

**Why Now:**
1. ✅ Firebase auth migration Phase 1 complete - we have a working baseline
2. ✅ Clear understanding of auth flow, encryption flow, and context boundaries
3. ✅ Migration Phases 2-7 will be much easier with modular code
4. ✅ Tests will catch any regressions during refactoring

---

## Part 1: Storage.ts Refactoring (2,270 lines → ~10 modules)

### File Structure (Descriptive Names)

```
src/lib/storage/
├── index.ts                                    # Public API exports
├── StorageManager.ts                           # Main orchestrator (~300 lines)
├── StorageEncryptionManager.ts                 # Encryption core (~420 lines)
├── StorageConfigManager.ts                     # Config operations (~220 lines)
├── StorageProfileManager.ts                    # Profile CRUD (~290 lines)
├── StorageAPIKeyVaultManager.ts                # API key management (~175 lines)
├── StorageCustomRulesManager.ts                # Custom redaction rules (~155 lines)
├── StoragePromptTemplatesManager.ts            # Prompt templates (~150 lines)
├── StorageDocumentAliasManager.ts              # Document analysis (~115 lines)
├── StorageMigrationManager.ts                  # V1→V2 migrations (~280 lines)
└── storage-utils.ts                            # Shared utilities (~50 lines)
```

### Extraction Priority Order

#### **Priority 1: StorageEncryptionManager (HIGH VALUE)**
**Why First:**
- Fully general-purpose, zero storage-specific logic
- Used by ALL other managers
- High test value - crypto in isolation
- Clean interface

**Lines to Extract:** 1697-2111 (414 lines)

**Methods:**
```typescript
class StorageEncryptionManager {
  // Core encryption
  async encrypt(data: any): Promise<string>
  async decrypt(encryptedData: string): Promise<any>

  // Key derivation
  private async getEncryptionKey(): Promise<CryptoKey>
  private async getFirebaseKeyMaterial(): Promise<string>
  private async getLegacyEncryptionKey(): Promise<CryptoKey>

  // Specialized encryption (for different data types)
  async encryptAPIKeyVault(vault: APIKeyVault): Promise<string>
  async decryptAPIKeyVault(encrypted: string): Promise<APIKeyVault>
  async encryptCustomRules(rules: CustomRule[]): Promise<string>
  async decryptCustomRules(encrypted: string): Promise<CustomRule[]>
  async encryptActivityLogs(logs: ActivityLog[]): Promise<string>
  async decryptActivityLogs(encrypted: string): Promise<ActivityLog[]>
  async encryptAccountData(data: AccountData): Promise<string>
  async decryptAccountData(encrypted: string): Promise<AccountData>

  // Utilities
  private arrayBufferToBase64(buffer: ArrayBuffer): string
  private base64ToArrayBuffer(base64: string): ArrayBuffer

  // Test injection (for integration tests)
  setCustomAuth(auth: Auth): void
  clearCustomAuth(): void
}
```

**Dependencies:**
- Firebase auth (for UID-based key derivation)
- Web Crypto API (browser native)
- Chrome storage (for salt only)

**Test Points:**
- Encrypt/decrypt round-trip
- Firebase UID key derivation (210k PBKDF2 iterations)
- Legacy key migration support
- Different data type encryption

---

#### **Priority 2: StorageConfigManager**
**Why Second:**
- Central config operations used by all feature managers
- Manages caching (5-second TTL - critical for performance)
- Coordinates encrypted field orchestration

**Lines to Extract:** 587-799, 1279-1412 (345 lines)

**Methods:**
```typescript
class StorageConfigManager {
  constructor(private encryptionManager: StorageEncryptionManager) {}

  // Config operations
  async saveConfig(config: UserConfig): Promise<void>
  async loadConfig(): Promise<UserConfig>
  getDefaultConfig(): UserConfig

  // Cache management
  clearCache(): void
  private configCache: UserConfig | null
  private configCacheTimestamp: number

  // Starter data
  getStarterTemplates(): PromptTemplate[]
}
```

**Dependencies:**
- StorageEncryptionManager (for selective field encryption)
- Chrome storage API
- Other managers (for orchestrating saves)

---

#### **Priority 3: StorageProfileManager**
**Why Third:**
- V2 architecture - clean domain boundary
- Used heavily in migration phases
- Tier enforcement logic

**Lines to Extract:** 297-584 (287 lines)

**Methods:**
```typescript
class StorageProfileManager {
  constructor(
    private encryptionManager: StorageEncryptionManager,
    private configManager: StorageConfigManager
  ) {}

  // Profile CRUD
  async saveProfiles(profiles: AliasProfile[]): Promise<void>
  async loadProfiles(): Promise<AliasProfile[]>
  async createProfile(profile: Partial<AliasProfile>): Promise<AliasProfile>
  async updateProfile(id: string, updates: Partial<AliasProfile>): Promise<void>
  async deleteProfile(id: string): Promise<void>
  async toggleProfile(id: string, enabled: boolean): Promise<void>

  // Query
  getProfile(id: string): AliasProfile | undefined

  // Statistics
  async incrementProfileUsage(id: string): Promise<void>
}
```

**Dependencies:**
- StorageEncryptionManager
- StorageConfigManager (for tier checking)
- `generateIdentityVariations` (external library)

---

#### **Priority 4: Feature Managers (Medium Priority)**

##### **StorageAPIKeyVaultManager**
**Lines:** 801-973 (172 lines)

```typescript
class StorageAPIKeyVaultManager {
  constructor(private configManager: StorageConfigManager) {}

  // Vault setup
  private async ensureAPIKeyVaultConfig(): Promise<void>

  // Key CRUD
  async addAPIKey(key: Partial<APIKey>): Promise<APIKey>
  async removeAPIKey(id: string): Promise<void>
  async updateAPIKey(id: string, updates: Partial<APIKey>): Promise<void>
  getAPIKey(id: string): APIKey | undefined
  getAllAPIKeys(): APIKey[]

  // Statistics
  async incrementAPIKeyProtection(id: string): Promise<void>

  // Settings
  async updateAPIKeyVaultSettings(settings: Partial<APIKeyVaultSettings>): Promise<void>

  // Utilities
  private detectKeyFormat(key: string): string
}
```

**Tier Enforcement:**
- FREE: Max 10 keys, OpenAI only
- PRO: Unlimited keys, 7 providers (OpenAI, Anthropic, Google, AWS, GitHub, Stripe, Generic)

---

##### **StorageCustomRulesManager**
**Lines:** 975-1125 (150 lines)

```typescript
class StorageCustomRulesManager {
  constructor(private configManager: StorageConfigManager) {}

  // Rules setup
  private async ensureCustomRulesConfig(): Promise<void>

  // Rule CRUD (PRO only)
  async addCustomRule(rule: Partial<CustomRule>): Promise<CustomRule>
  async removeCustomRule(id: string): Promise<void>
  async updateCustomRule(id: string, updates: Partial<CustomRule>): Promise<void>
  async toggleCustomRule(id: string, enabled: boolean): Promise<void>

  // Statistics
  async incrementRuleMatchCount(id: string): Promise<void>

  // Settings
  async updateCustomRulesSettings(settings: Partial<CustomRulesSettings>): Promise<void>
}
```

**Categories:** PII, Financial, Medical, Custom

---

##### **StoragePromptTemplatesManager**
**Lines:** 1127-1274 (147 lines)

```typescript
class StoragePromptTemplatesManager {
  constructor(private configManager: StorageConfigManager) {}

  // Templates setup
  private async ensurePromptTemplatesConfig(): Promise<void>

  // Template CRUD
  async addPromptTemplate(template: Partial<PromptTemplate>): Promise<PromptTemplate>
  async removePromptTemplate(id: string): Promise<void>
  async updatePromptTemplate(id: string, updates: Partial<PromptTemplate>): Promise<void>
  getPromptTemplate(id: string): PromptTemplate | undefined
  getAllPromptTemplates(): PromptTemplate[]

  // Statistics
  async incrementTemplateUsage(id: string): Promise<void>

  // Settings
  async updatePromptTemplatesSettings(settings: Partial<PromptTemplatesSettings>): Promise<void>
}
```

**Variable Substitution:** `{{name}}`, `{{email}}`, `{{phone}}`, etc.

---

##### **StorageDocumentAliasManager**
**Lines:** 2130-2242 (112 lines)

```typescript
class StorageDocumentAliasManager {
  constructor(private encryptionManager: StorageEncryptionManager) {}

  // Document CRUD
  async loadDocumentAliases(): Promise<DocumentAlias[]>
  async saveDocumentAlias(doc: DocumentAlias): Promise<void>
  async deleteDocumentAlias(id: string): Promise<void>
  async updateDocumentAlias(id: string, updates: Partial<DocumentAlias>): Promise<void>
}
```

**Auto-cleanup:** Max 50 documents (oldest deleted)

---

#### **Priority 5: StorageMigrationManager**
**Why Later:** Needs all managers instantiated first

**Lines:** 109-168, 1414-1690 (280 lines)

```typescript
class StorageMigrationManager {
  constructor(
    private profileManager: StorageProfileManager,
    private configManager: StorageConfigManager,
    private encryptionManager: StorageEncryptionManager
  ) {}

  // Main migration orchestrator
  async initialize(): Promise<void>

  // V1 → V2 (aliases → profiles)
  async migrateV1ToV2IfNeeded(): Promise<void>

  // Plaintext → Encrypted
  async migrateAPIKeysToEncryptedIfNeeded(): Promise<void>

  // Version tracking
  private async getDataVersion(): Promise<number>
  private async setDataVersion(version: number): Promise<void>
}
```

---

#### **Priority 6: StorageManager (Main Orchestrator)**
**What Stays:**

**Lines:** 19-107, 173-295 (legacy), utilities

```typescript
export class StorageManager {
  private static instance: StorageManager;

  // Sub-managers (dependency injection)
  private encryptionManager: StorageEncryptionManager;
  private configManager: StorageConfigManager;
  private profileManager: StorageProfileManager;
  private apiKeyVaultManager: StorageAPIKeyVaultManager;
  private customRulesManager: StorageCustomRulesManager;
  private promptTemplatesManager: StoragePromptTemplatesManager;
  private documentAliasManager: StorageDocumentAliasManager;
  private migrationManager: StorageMigrationManager;

  // Singleton
  private constructor() {
    // Initialize all managers
    this.encryptionManager = new StorageEncryptionManager();
    this.configManager = new StorageConfigManager(this.encryptionManager);
    this.profileManager = new StorageProfileManager(this.encryptionManager, this.configManager);
    // ... etc

    // Setup listeners
    this.setupAuthListener();
    this.setupStorageChangeListener();
  }

  static getInstance(): StorageManager

  // Delegate to sub-managers (public API)
  async initialize(): Promise<void> {
    return this.migrationManager.initialize();
  }

  // Config
  async saveConfig(config: UserConfig): Promise<void> {
    return this.configManager.saveConfig(config);
  }

  // Profiles
  async loadProfiles(): Promise<AliasProfile[]> {
    return this.profileManager.loadProfiles();
  }

  // ... delegate all other methods

  // Legacy V1 methods (deprecated - keep for backward compatibility)
  async saveAliases(aliases: AliasEntry[]): Promise<void>
  async loadAliases(): Promise<AliasEntry[]>
  async addAlias(entry: AliasEntry): Promise<void>
  async removeAlias(realValue: string): Promise<void>
  async updateAlias(realValue: string, aliasValue: string): Promise<void>

  // Utilities
  generateId(): string
  async getStorageQuota(): Promise<{ used: number; total: number }>
  clearCache(): void

  // Test injection
  setCustomAuth(auth: Auth): void
  clearCustomAuth(): void
}
```

**Final Size:** ~300 lines

---

### Storage Utilities
**Lines:** 2114-2269 (50 lines)

```typescript
// storage-utils.ts
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function getStorageQuota(): Promise<{ used: number; total: number }> {
  // ... existing implementation
}
```

---

### Public API (index.ts)

```typescript
// Re-export main class
export { StorageManager } from './StorageManager';

// Re-export types
export * from '../types'; // Or create storage-specific types file
```

---

## Part 2: ServiceWorker.ts Refactoring (1,259 lines → ~8 modules)

### File Structure (Descriptive Names)

```
src/background/
├── serviceWorker.ts                 # Main orchestrator (~150 lines)
├── managers/
│   ├── BadgeManager.ts              # Badge state & visual updates
│   ├── ContentScriptManager.ts      # Script injection logic
│   └── ActivityLogger.ts            # Queue-based activity logging
├── processors/
│   ├── RequestProcessor.ts          # PII/API key substitution
│   └── ResponseProcessor.ts         # Alias decoding
├── handlers/
│   ├── MessageRouter.ts             # Central message routing
│   ├── AliasHandlers.ts             # Alias CRUD operations
│   ├── ConfigHandlers.ts            # Config get/set
│   ├── APIKeyHandlers.ts            # API key CRUD
│   └── CustomRulesHandlers.ts       # Custom rules CRUD
└── utils/
    └── ServiceDetector.ts           # AI service URL detection
```

---

### Extraction Priority Order

#### **Priority 1: RequestProcessor & ResponseProcessor (Core Logic)**

##### **RequestProcessor.ts**
**Lines:** 432-701 (269 lines)

```typescript
export class RequestProcessor {
  constructor(
    private storage: StorageManager,
    private aliasEngine: AliasEngine,
    private apiKeyDetector: APIKeyDetector,
    private redactionEngine: RedactionEngine,
    private activityLogger: ActivityLogger
  ) {}

  async processRequest(
    requestBody: any,
    tabId: number,
    url: string
  ): Promise<{
    modifiedBody: any;
    replacements: number;
    changes: any[]
  }> {
    // Extract text
    const text = extractAllText(requestBody);

    // Apply alias substitutions
    const aliasResult = this.aliasEngine.substituteAliases(text);

    // Apply custom redaction rules
    const rulesResult = this.redactionEngine.applyRules(aliasResult.text);

    // Detect & redact API keys
    const keyResult = await this.detectAndRedactAPIKeys(rulesResult.text, tabId);

    // Reconstruct request
    const modifiedBody = replaceAllText(requestBody, keyResult.text);

    // Log activity
    if (aliasResult.replacements > 0) {
      await this.activityLogger.logActivity({
        service: detectService(url),
        itemsReplaced: aliasResult.replacements,
        timestamp: Date.now()
      });
    }

    return {
      modifiedBody,
      replacements: aliasResult.replacements + rulesResult.replacements + keyResult.replacements,
      changes: [...aliasResult.changes, ...rulesResult.changes, ...keyResult.changes]
    };
  }

  private async detectAndRedactAPIKeys(text: string, tabId: number): Promise<any> {
    // ... existing API key detection logic
  }
}
```

**Dependencies:**
- StorageManager (config access)
- AliasEngine (alias substitution)
- APIKeyDetector (key pattern matching)
- redactionEngine (custom rules)
- textProcessor (extract/replace)
- ServiceDetector (service type)
- ActivityLogger (stats tracking)

---

##### **ResponseProcessor.ts**
**Lines:** 703-755 (52 lines)

```typescript
export class ResponseProcessor {
  constructor(
    private storage: StorageManager,
    private aliasEngine: AliasEngine
  ) {}

  async processResponse(
    responseBody: any,
    url: string
  ): Promise<{ modifiedBody: any; decoded: boolean }> {
    const config = await this.storage.loadConfig();

    if (!config.enableResponseDecoding) {
      return { modifiedBody: responseBody, decoded: false };
    }

    const text = extractAllText(responseBody);
    const decoded = this.aliasEngine.decodeAliases(text);
    const modifiedBody = replaceAllText(responseBody, decoded);

    return { modifiedBody, decoded: true };
  }
}
```

---

#### **Priority 2: Managers**

##### **BadgeManager.ts**
**Lines:** 28-175 (147 lines)

```typescript
export class BadgeManager {
  private AI_SERVICE_URLS = [
    'chatgpt.com',
    'gemini.google.com',
    'claude.ai',
    'chat.mistral.ai',
    'poe.com'
  ];

  constructor(
    private storage: StorageManager,
    private contentScriptManager: ContentScriptManager
  ) {}

  isAIServiceURL(url: string): boolean {
    return this.AI_SERVICE_URLS.some(pattern => url.includes(pattern));
  }

  async updateBadge(tabId: number, state: ProtectionState): Promise<void> {
    const colors = {
      protected: '#22c55e',
      unprotected: '#ef4444',
      disabled: '#6b7280'
    };

    await chrome.action.setBadgeBackgroundColor({
      color: colors[state],
      tabId
    });

    // ... existing badge update logic
  }

  async checkAndUpdateBadge(tabId: number, url: string): Promise<void> {
    if (!this.isAIServiceURL(url)) {
      await this.updateBadge(tabId, 'disabled');
      return;
    }

    const isInjected = await this.contentScriptManager.isContentScriptInjected(tabId);
    const config = await this.storage.loadConfig();
    const profiles = await this.storage.loadProfiles();

    const hasActiveProfiles = profiles.some(p => p.enabled);
    const isProtected = isInjected && config.enabled && hasActiveProfiles;

    await this.updateBadge(tabId, isProtected ? 'protected' : 'unprotected');
  }
}
```

---

##### **ContentScriptManager.ts**
**Lines:** 868-940 (72 lines)

```typescript
export class ContentScriptManager {
  private AI_SERVICE_PATTERNS = [
    '*://chatgpt.com/*',
    '*://gemini.google.com/*',
    '*://claude.ai/*',
    '*://chat.mistral.ai/*',
    '*://poe.com/*'
  ];

  constructor(private badgeManager: BadgeManager) {}

  async isContentScriptInjected(tabId: number): Promise<boolean> {
    try {
      const result = await chrome.tabs.sendMessage(tabId, { type: 'HEALTH_CHECK' });
      return result?.status === 'ok';
    } catch {
      return false;
    }
  }

  async injectIntoExistingTabs(): Promise<void> {
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;

      const shouldInject = this.AI_SERVICE_PATTERNS.some(pattern =>
        new RegExp(pattern.replace(/\*/g, '.*')).test(tab.url!)
      );

      if (shouldInject) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });

          await this.badgeManager.checkAndUpdateBadge(tab.id, tab.url);
        } catch (error) {
          console.error('[ContentScriptManager] Injection failed:', error);
        }
      }
    }
  }

  async handleReinject(tabId?: number): Promise<void> {
    if (tabId) {
      const tab = await chrome.tabs.get(tabId);
      if (tab.url && this.badgeManager.isAIServiceURL(tab.url)) {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        });
      }
    } else {
      await this.injectIntoExistingTabs();
    }
  }
}
```

---

##### **ActivityLogger.ts**
**Lines:** 1102-1203 (101 lines)

```typescript
export class ActivityLogger {
  private activityLogQueue: ActivityLog[] = [];

  async logActivity(entry: ActivityLog): Promise<void> {
    this.activityLogQueue.push(entry);

    try {
      await chrome.runtime.sendMessage({
        type: 'ADD_ACTIVITY_LOG',
        payload: entry
      });
    } catch (error) {
      console.log('[ActivityLogger] Popup not available - activity queued');
    }
  }

  async flushQueueToPopup(): Promise<void> {
    if (this.activityLogQueue.length === 0) return;

    console.log('[ActivityLogger] Flushing', this.activityLogQueue.length, 'queued logs...');

    try {
      await chrome.runtime.sendMessage({
        type: 'FLUSH_ACTIVITY_LOGS',
        payload: this.activityLogQueue
      });

      console.log('[ActivityLogger] ✅ Flushed', this.activityLogQueue.length, 'logs');
      this.activityLogQueue = [];
    } catch (error) {
      console.error('[ActivityLogger] Failed to flush queue:', error);
    }
  }

  getQueueSize(): number {
    return this.activityLogQueue.length;
  }
}
```

**Note:** This will be removed in Migration Phase 2 (service worker will encrypt logs directly)

---

#### **Priority 3: Message Handlers**

##### **MessageRouter.ts**
**Lines:** 269-408 (139 lines)

```typescript
export class MessageRouter {
  constructor(
    private aliasHandlers: AliasHandlers,
    private configHandlers: ConfigHandlers,
    private apiKeyHandlers: APIKeyHandlers,
    private customRulesHandlers: CustomRulesHandlers,
    private requestProcessor: RequestProcessor,
    private responseProcessor: ResponseProcessor,
    private contentScriptManager: ContentScriptManager,
    private activityLogger: ActivityLogger
  ) {}

  async handleMessage(
    message: Message,
    sender: chrome.runtime.MessageSender
  ): Promise<any> {
    console.log('[MessageRouter] Received:', message.type);

    switch (message.type) {
      // Health
      case 'HEALTH_CHECK':
        return { status: 'ok' };

      // Substitution
      case 'SUBSTITUTE_REQUEST':
        return this.requestProcessor.processRequest(
          message.payload.body,
          sender.tab?.id || 0,
          sender.tab?.url || ''
        );

      case 'SUBSTITUTE_RESPONSE':
        return this.responseProcessor.processResponse(
          message.payload.body,
          sender.tab?.url || ''
        );

      // Aliases
      case 'GET_ALIASES':
        return this.aliasHandlers.handleGetAliases();
      case 'ADD_ALIAS':
        return this.aliasHandlers.handleAddAlias(message.payload);
      case 'REMOVE_ALIAS':
        return this.aliasHandlers.handleRemoveAlias(message.payload);

      // Profiles
      case 'GET_PROFILES':
        return this.aliasHandlers.handleGetProfiles();
      case 'SET_PROFILES':
        return this.aliasHandlers.handleSetProfiles(message.payload);
      case 'RELOAD_PROFILES':
        return this.aliasHandlers.handleReloadProfiles();

      // Config
      case 'UPDATE_CONFIG':
        return this.configHandlers.handleUpdateConfig(message.payload);
      case 'GET_CONFIG':
        return this.configHandlers.handleGetConfig();

      // API Keys
      case 'ADD_API_KEY':
        return this.apiKeyHandlers.handleAddAPIKey(message.payload);
      case 'REMOVE_API_KEY':
        return this.apiKeyHandlers.handleRemoveAPIKey(message.payload);
      case 'UPDATE_API_KEY':
        return this.apiKeyHandlers.handleUpdateAPIKey(message.payload);
      case 'GET_API_KEYS':
        return this.apiKeyHandlers.handleGetAPIKeys();
      case 'UPDATE_API_KEY_VAULT_SETTINGS':
        return this.apiKeyHandlers.handleUpdateSettings(message.payload);

      // Custom Rules
      case 'ADD_CUSTOM_RULE':
        return this.customRulesHandlers.handleAddRule(message.payload);
      case 'REMOVE_CUSTOM_RULE':
        return this.customRulesHandlers.handleRemoveRule(message.payload);
      case 'UPDATE_CUSTOM_RULE':
        return this.customRulesHandlers.handleUpdateRule(message.payload);
      case 'TOGGLE_CUSTOM_RULE':
        return this.customRulesHandlers.handleToggleRule(message.payload);
      case 'UPDATE_CUSTOM_RULES_SETTINGS':
        return this.customRulesHandlers.handleUpdateSettings(message.payload);

      // Other
      case 'REINJECT_CONTENT_SCRIPTS':
        return this.contentScriptManager.handleReinject(message.payload?.tabId);

      case 'FLUSH_ACTIVITY_LOGS':
        return this.activityLogger.flushQueueToPopup();

      default:
        console.warn('[MessageRouter] Unknown message type:', message.type);
        return { error: 'Unknown message type' };
    }
  }
}
```

---

##### **Handler Classes**

**AliasHandlers.ts** (Lines 757-866, ~109 lines)
```typescript
export class AliasHandlers {
  constructor(
    private storage: StorageManager,
    private aliasEngine: AliasEngine
  ) {}

  async handleGetAliases(): Promise<AliasEntry[]>
  async handleGetProfiles(): Promise<AliasProfile[]>
  async handleAddAlias(entry: AliasEntry): Promise<void>
  async handleRemoveAlias(realValue: string): Promise<void>
  async handleSetProfiles(profiles: AliasProfile[]): Promise<void>
  async handleReloadProfiles(): Promise<void>
}
```

**ConfigHandlers.ts** (Lines 807-841, ~34 lines)
```typescript
export class ConfigHandlers {
  constructor(private storage: StorageManager) {}

  async handleUpdateConfig(updates: Partial<UserConfig>): Promise<void>
  async handleGetConfig(): Promise<UserConfig>
}
```

**APIKeyHandlers.ts** (Lines 942-1028, ~86 lines)
```typescript
export class APIKeyHandlers {
  constructor(private storage: StorageManager) {}

  async handleAddAPIKey(key: Partial<APIKey>): Promise<APIKey>
  async handleRemoveAPIKey(id: string): Promise<void>
  async handleUpdateAPIKey(payload: { id: string; updates: Partial<APIKey> }): Promise<void>
  async handleGetAPIKeys(): Promise<APIKey[]>
  async handleUpdateSettings(settings: Partial<APIKeyVaultSettings>): Promise<void>
}
```

**CustomRulesHandlers.ts** (Lines 1030-1100, ~70 lines)
```typescript
export class CustomRulesHandlers {
  constructor(private storage: StorageManager) {}

  async handleAddRule(rule: Partial<CustomRule>): Promise<CustomRule>
  async handleRemoveRule(id: string): Promise<void>
  async handleUpdateRule(payload: { id: string; updates: Partial<CustomRule> }): Promise<void>
  async handleToggleRule(payload: { id: string; enabled: boolean }): Promise<void>
  async handleUpdateSettings(settings: Partial<CustomRulesSettings>): Promise<void>
}
```

---

#### **Priority 4: Utilities**

##### **ServiceDetector.ts**
**Lines:** 410-430 (20 lines)

```typescript
export function detectService(url: string): string {
  if (url.includes('chatgpt.com')) return 'ChatGPT';
  if (url.includes('gemini.google.com')) return 'Gemini';
  if (url.includes('claude.ai')) return 'Claude';
  if (url.includes('chat.mistral.ai')) return 'Mistral';
  if (url.includes('poe.com')) return 'Poe';
  return 'Unknown';
}
```

---

#### **Priority 5: Main Service Worker (Orchestrator)**

##### **serviceWorker.ts (Final)**
**Lines:** ~150 lines

```typescript
import { waitForAuth } from '../lib/firebase';
import { StorageManager } from '../lib/storage';
import { AliasEngine } from '../lib/aliasEngine';
import { APIKeyDetector } from '../lib/apiKeyDetector';
import { redactionEngine } from '../lib/redactionEngine';

import { BadgeManager } from './managers/BadgeManager';
import { ContentScriptManager } from './managers/ContentScriptManager';
import { ActivityLogger } from './managers/ActivityLogger';
import { RequestProcessor } from './processors/RequestProcessor';
import { ResponseProcessor } from './processors/ResponseProcessor';
import { MessageRouter } from './handlers/MessageRouter';
import { AliasHandlers } from './handlers/AliasHandlers';
import { ConfigHandlers } from './handlers/ConfigHandlers';
import { APIKeyHandlers } from './handlers/APIKeyHandlers';
import { CustomRulesHandlers } from './handlers/CustomRulesHandlers';

// Initialize Firebase
console.log('[Background] Initializing Firebase auth...');
waitForAuth().then(() => {
  console.log('[Background] ✅ Firebase auth initialized');
}).catch(error => {
  console.error('[Background] ❌ Firebase auth failed:', error);
});

// Initialize storage
const storage = StorageManager.getInstance();
const aliasEngine = AliasEngine.getInstance();

// Initialize managers
const activityLogger = new ActivityLogger();
const badgeManager = new BadgeManager(storage, contentScriptManager);
const contentScriptManager = new ContentScriptManager(badgeManager);

// Initialize processors
const requestProcessor = new RequestProcessor(
  storage,
  aliasEngine,
  new APIKeyDetector(),
  redactionEngine,
  activityLogger
);
const responseProcessor = new ResponseProcessor(storage, aliasEngine);

// Initialize handlers
const aliasHandlers = new AliasHandlers(storage, aliasEngine);
const configHandlers = new ConfigHandlers(storage);
const apiKeyHandlers = new APIKeyHandlers(storage);
const customRulesHandlers = new CustomRulesHandlers(storage);

// Initialize router
const messageRouter = new MessageRouter(
  aliasHandlers,
  configHandlers,
  apiKeyHandlers,
  customRulesHandlers,
  requestProcessor,
  responseProcessor,
  contentScriptManager,
  activityLogger
);

// Event Listeners
chrome.runtime.onStartup.addListener(() => {
  console.log('[Background] Extension startup');
  storage.initialize();
});

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Background] Extension installed/updated:', details.reason);

  await storage.initialize();

  if (details.reason === 'install' || details.reason === 'update') {
    await contentScriptManager.injectIntoExistingTabs();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  messageRouter.handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('[Background] Message handling error:', error);
      sendResponse({ error: error.message });
    });

  return true; // Async response
});

// Tab event listeners (badge updates)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    await badgeManager.checkAndUpdateBadge(activeInfo.tabId, tab.url);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await badgeManager.checkAndUpdateBadge(tabId, tab.url);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.config) {
    console.log('[Background] Config changed - reloading profiles');
    storage.loadProfiles().then(() => aliasEngine.setProfiles(profiles));
  }
});
```

---

## Testing Strategy

### Pre-Refactoring
1. ✅ Document current test coverage
2. ✅ Run all existing tests (baseline)
3. ✅ Snapshot test output for comparison

### During Refactoring (Per Module)
1. Extract module code
2. Update imports in dependent files
3. Run tests - must match baseline
4. Build and manual smoke test

### Post-Refactoring
1. Full integration test suite
2. Manual testing of all features
3. Performance comparison (ensure no regressions)

---

## Refactoring Checklist

### Storage.ts Refactoring

- [ ] **Phase 1: Extract StorageEncryptionManager**
  - [ ] Create `src/lib/storage/StorageEncryptionManager.ts`
  - [ ] Extract encryption methods (lines 1697-2111)
  - [ ] Update imports in storage.ts
  - [ ] Run tests
  - [ ] Commit: "refactor: extract StorageEncryptionManager"

- [ ] **Phase 2: Extract StorageConfigManager**
  - [ ] Create `src/lib/storage/StorageConfigManager.ts`
  - [ ] Extract config methods (lines 587-799, 1279-1412)
  - [ ] Inject StorageEncryptionManager dependency
  - [ ] Update imports
  - [ ] Run tests
  - [ ] Commit: "refactor: extract StorageConfigManager"

- [ ] **Phase 3: Extract StorageProfileManager**
  - [ ] Create `src/lib/storage/StorageProfileManager.ts`
  - [ ] Extract profile methods (lines 297-584)
  - [ ] Inject dependencies (encryption, config)
  - [ ] Update imports
  - [ ] Run tests
  - [ ] Commit: "refactor: extract StorageProfileManager"

- [ ] **Phase 4: Extract Feature Managers**
  - [ ] Create `StorageAPIKeyVaultManager.ts` (lines 801-973)
  - [ ] Create `StorageCustomRulesManager.ts` (lines 975-1125)
  - [ ] Create `StoragePromptTemplatesManager.ts` (lines 1127-1274)
  - [ ] Create `StorageDocumentAliasManager.ts` (lines 2130-2242)
  - [ ] Update imports
  - [ ] Run tests
  - [ ] Commit: "refactor: extract feature managers"

- [ ] **Phase 5: Extract StorageMigrationManager**
  - [ ] Create `src/lib/storage/StorageMigrationManager.ts`
  - [ ] Extract migration logic (lines 109-168, 1414-1690)
  - [ ] Inject all manager dependencies
  - [ ] Update imports
  - [ ] Run tests
  - [ ] Commit: "refactor: extract StorageMigrationManager"

- [ ] **Phase 6: Refactor Main StorageManager**
  - [ ] Add manager instances as private properties
  - [ ] Update constructor to instantiate managers
  - [ ] Delegate all methods to appropriate managers
  - [ ] Keep singleton pattern
  - [ ] Keep legacy V1 methods for backward compatibility
  - [ ] Run tests
  - [ ] Commit: "refactor: update StorageManager to use sub-managers"

- [ ] **Phase 7: Create storage/index.ts**
  - [ ] Export StorageManager
  - [ ] Export types
  - [ ] Update all imports across codebase to use `from '../lib/storage'`
  - [ ] Run tests
  - [ ] Commit: "refactor: create storage module public API"

### ServiceWorker.ts Refactoring

- [ ] **Phase 1: Extract Processors**
  - [ ] Create `src/background/processors/RequestProcessor.ts` (lines 432-701)
  - [ ] Create `src/background/processors/ResponseProcessor.ts` (lines 703-755)
  - [ ] Update imports
  - [ ] Run tests
  - [ ] Commit: "refactor: extract request/response processors"

- [ ] **Phase 2: Extract Managers**
  - [ ] Create `src/background/managers/BadgeManager.ts` (lines 28-175)
  - [ ] Create `src/background/managers/ContentScriptManager.ts` (lines 868-940)
  - [ ] Create `src/background/managers/ActivityLogger.ts` (lines 1102-1203)
  - [ ] Update imports
  - [ ] Run tests
  - [ ] Commit: "refactor: extract manager classes"

- [ ] **Phase 3: Extract Handlers**
  - [ ] Create `src/background/handlers/AliasHandlers.ts` (lines 757-866)
  - [ ] Create `src/background/handlers/ConfigHandlers.ts` (lines 807-841)
  - [ ] Create `src/background/handlers/APIKeyHandlers.ts` (lines 942-1028)
  - [ ] Create `src/background/handlers/CustomRulesHandlers.ts` (lines 1030-1100)
  - [ ] Update imports
  - [ ] Run tests
  - [ ] Commit: "refactor: extract message handlers"

- [ ] **Phase 4: Extract MessageRouter**
  - [ ] Create `src/background/handlers/MessageRouter.ts` (lines 269-408)
  - [ ] Inject all handler dependencies
  - [ ] Update imports
  - [ ] Run tests
  - [ ] Commit: "refactor: extract MessageRouter"

- [ ] **Phase 5: Extract Utilities**
  - [ ] Create `src/background/utils/ServiceDetector.ts` (lines 410-430)
  - [ ] Update imports
  - [ ] Run tests
  - [ ] Commit: "refactor: extract service detector utility"

- [ ] **Phase 6: Refactor Main ServiceWorker**
  - [ ] Instantiate all managers/processors/handlers
  - [ ] Wire up dependencies
  - [ ] Keep only event listeners and initialization
  - [ ] Run tests
  - [ ] Commit: "refactor: slim down serviceWorker.ts to orchestration layer"

### Final Validation

- [ ] **Build & Test**
  - [ ] `npm run build` - no errors
  - [ ] All tests pass
  - [ ] Manual smoke test: sign in, create profile, make substitution, check logs
  - [ ] Bundle size check (should be similar or smaller)

- [ ] **Code Review**
  - [ ] Check all imports are correct
  - [ ] Verify no circular dependencies
  - [ ] Ensure TypeScript strict mode compliance
  - [ ] Review naming consistency

- [ ] **Documentation**
  - [ ] Update README if module structure changed
  - [ ] Document new folder structure
  - [ ] Update migration plan to reference new files

---

## Success Criteria

- ✅ All existing tests pass
- ✅ No regressions in manual testing
- ✅ File sizes reduced to <400 lines each
- ✅ Clear separation of concerns
- ✅ Improved testability (can test modules in isolation)
- ✅ Ready to proceed with Migration Phases 2-7

---

## Next Steps After Refactoring

Once refactoring is complete, resume **Firebase Web Extension Migration**:
- Phase 2: Remove `SET_PROFILES` and `FLUSH_ACTIVITY_LOGS` messages
- Phase 3: Service worker cleanup (will be much easier with modular code!)
- Phase 4: Popup cleanup
- Phase 5: Message type removals
- Phase 6: Badge & UX improvements
- Phase 7: Integration testing

---

## Notes

- **Backward Compatibility:** Keep legacy V1 alias methods in StorageManager for now
- **Performance:** Config caching (5s TTL) is critical - don't break during refactor
- **Context Awareness:** Service worker vs popup detection must be preserved
- **Testing:** Snapshot test output before starting to catch regressions
- **Commits:** Small, atomic commits per module extraction for easy rollback
