/**
 * Core data types for the AI PII Sanitizer extension
 * Version 2.0 - Profile-based architecture
 */

// ========== V2 PROFILE TYPES ==========

// ========== PROMPT TEMPLATE TYPES ==========

/**
 * Prompt template with placeholders for profile data
 */
export interface PromptTemplate {
  id: string;                    // UUID
  name: string;                  // "Professional Email Template"
  description?: string;          // Optional description
  content: string;               // Template text with {{placeholders}}
  category?: string;             // "Email", "Code Review", "Research", etc.
  tags?: string[];               // ["work", "formal", "intro"]
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
  usageCount: number;            // How many times used
  lastUsed?: number;             // Last usage timestamp
  profileId?: string;            // Which profile to use (optional, can select at use)
  isStarter?: boolean;           // True if this is a starter template (provided by us)
  readonly?: boolean;            // True if template cannot be edited (for FREE users on starter templates)
}

/**
 * Prompt templates configuration
 */
export interface PromptTemplatesConfig {
  templates: PromptTemplate[];
  maxTemplates: number;          // 3 for FREE, unlimited for PRO
  defaultProfile?: string;       // Default profile ID to use for placeholders
  enableKeyboardShortcuts: boolean;
}

/**
 * Identity data container for real PII values
 */
export interface IdentityData {
  name?: string;
  email?: string;
  phone?: string;
  cellPhone?: string;
  address?: string;
  company?: string;
  jobTitle?: string;
  custom?: Record<string, string>; // Extensible for future fields
}

/**
 * Main profile entity - contains complete real/alias identity mapping
 */
export interface AliasProfile {
  id: string;
  profileName: string;          // e.g., "Greg - Work"
  description?: string;          // Optional user notes
  enabled: boolean;

  // Real identity
  real: IdentityData;

  // Alias identity
  alias: IdentityData;

  // Auto-generated variations for fuzzy matching
  variations?: {
    real: Record<string, string[]>;  // e.g., { name: ["Greg Barker", "GregBarker", "gregbarker", ...] }
    alias: Record<string, string[]>; // e.g., { name: ["John Doe", "JohnDoe", "johndoe", ...] }
  };

  // User-added custom variations (not auto-generated)
  // Each variation can be enabled/disabled individually
  customVariations?: {
    real: Record<string, Array<{ value: string; enabled: boolean }>>;
    alias: Record<string, Array<{ value: string; enabled: boolean }>>;
  };

  // Track which auto-generated variations are disabled
  disabledVariations?: {
    real: Record<string, string[]>;  // List of disabled auto-generated variations for real identity
    alias: Record<string, string[]>; // List of disabled auto-generated variations for alias identity
  };

  // Metadata
  metadata: {
    createdAt: number;
    updatedAt: number;
    usageStats: {
      totalSubstitutions: number;
      lastUsed: number;
      byService: {
        chatgpt: number;
        claude: number;
        gemini: number;
        perplexity: number;
        copilot: number;
      };
      byPIIType: {
        name: number;
        email: number;
        phone: number;
        cellPhone: number;
        address: number;
        company: number;
        custom: number;
      };
    };
    confidence: number;           // 0-1 for auto-detected profiles
  };

  // Per-profile settings
  settings: {
    autoReplace: boolean;         // Auto-replace or warn first
    highlightInUI: boolean;       // Show visual highlights
    activeServices: string[];     // Which AI services to protect
    enableVariations: boolean;    // Use fuzzy matching with variations
  };
}

/**
 * Activity log entry for debug console
 */
/**
 * Supported AI services (5 platforms - production ready)
 */
export type AIService =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'perplexity'
  | 'copilot'
  | 'unknown';

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  type: 'interception' | 'substitution' | 'warning' | 'error';
  service: AIService;
  details: {
    url: string;
    profilesUsed?: string[];      // Profile IDs
    piiTypesFound?: string[];     // ['name', 'email']
    substitutionCount: number;
    error?: string;
    // API Key Vault fields
    apiKeysProtected?: number;
    apiKeysFound?: number;
    keyTypes?: string[];         // ['openai', 'github']
  };
  message: string;
}

/**
 * User configuration (v2)
 */
export interface UserConfig {
  version: number;

  // Account info (optional - for email updates & future Pro tier)
  account?: {
    email?: string;              // Optional email for community updates
    emailOptIn: boolean;         // User consented to emails
    licenseKey?: string;         // For future Pro tier (v3.0)
    tier: 'free' | 'pro' | 'enterprise';
    syncEnabled: boolean;        // Cloud sync (Pro feature, v3.0)
    discordId?: string;          // Optional Discord link for community
    // Firebase Auth fields
    firebaseUid?: string;        // Firebase user ID
    displayName?: string;        // User's display name from Firebase
    photoURL?: string;           // User's photo URL from Firebase/Google
    // Encryption tracking (for multi-provider support)
    encryptionProvider?: 'google' | 'github' | 'microsoft' | 'email';  // Which provider's UID encrypted the data
    encryptionEmail?: string;    // Email used when data was first encrypted (for troubleshooting)
  };

  // Global settings
  settings: {
    enabled: boolean;
    defaultMode: 'auto-replace' | 'warn-first';
    showNotifications: boolean;
    decodeResponses: boolean;    // If true, converts aliases back to real names in responses (default: false)
    theme:
      // Dynamic theme
      | 'chrome-theme'
      // Light mode themes (light backgrounds + white cards + black text)
      | 'classic-light' | 'lavender' | 'sky' | 'fire' | 'leaf' | 'sunlight'
      // Dark mode themes (dark backgrounds + dark cards + white text)
      | 'classic-dark' | 'midnight-purple' | 'deep-ocean' | 'embers' | 'forest' | 'sundown';
    protectedDomains: string[];
    excludedDomains: string[];
    strictMode: boolean;
    debugMode: boolean;
    cloudSync: boolean;          // v3.0 Pro feature
  };

  // Profiles (v2 - replaces flat aliases array)
  profiles: AliasProfile[];

  // Enhanced global stats
  stats: {
    totalSubstitutions: number;
    totalInterceptions: number;  // Requests analyzed
    totalWarnings: number;        // Warnings shown
    successRate: number;
    lastSyncTimestamp: number;
    byService: {
      chatgpt: { requests: number; substitutions: number };
      claude: { requests: number; substitutions: number };
      gemini: { requests: number; substitutions: number };
      perplexity: { requests: number; substitutions: number };
      copilot: { requests: number; substitutions: number };
    };
    activityLog: ActivityLogEntry[];
  };

  // API Key Vault (PRO feature)
  apiKeyVault?: APIKeyVaultConfig;

  // Custom Redaction Rules (PRO feature)
  customRules?: CustomRulesConfig;

  // Prompt Templates (FREE + PRO feature)
  promptTemplates?: PromptTemplatesConfig;
}

// ========== V1 LEGACY TYPES (for migration) ==========

/**
 * @deprecated Use AliasProfile instead
 * Legacy v1 alias entry - kept for backward compatibility
 */
export interface AliasEntry {
  id: string;
  realValue: string;
  aliasValue: string;
  type: 'name' | 'email' | 'phone' | 'address';
  category?: string;
  metadata: {
    createdAt: number;
    usageCount: number;
    lastUsed: number;
    confidence: number;
  };
  enabled: boolean;
}

/**
 * @deprecated Use UserConfig (v2) instead
 * Legacy v1 config - kept for migration
 */
export interface UserConfigV1 {
  version: number;
  settings: {
    enabled: boolean;
    autoHighlight: boolean;
    showNotifications: boolean;
    protectedDomains: string[];
    excludedDomains: string[];
    strictMode: boolean;
  };
  aliases: AliasEntry[];
  stats: {
    totalSubstitutions: number;
    successRate: number;
    lastSyncTimestamp: number;
  };
}

// ========== SUBSTITUTION TYPES ==========

/**
 * Result of a text substitution operation
 */
export interface SubstitutionResult {
  text: string;
  substitutions: Array<{
    from: string;
    to: string;
    position: number;
    profileId?: string;          // Which profile matched
    piiType?: string;            // Which PII field matched
  }>;
  confidence: number;
  profilesMatched?: Array<{      // NEW: Which profiles were used
    profileId: string;
    profileName: string;
    piiTypes: string[];
    matches: Array<{
      type: string;
      value: string;
      position: number;
    }>;
  }>;
}

/**
 * Options for substitution engine
 */
export interface SubstitutionOptions {
  mode?: 'auto' | 'detect-only'; // Detect without replacing
  profileIds?: string[];          // Limit to specific profiles
}

// ========== CONVERSATION CONTEXT ==========

/**
 * Tracks conversation state for context-aware substitution
 */
export interface ConversationContext {
  conversationId: string;
  aliases: Set<string>;
  entities: Map<string, {
    alias: string;
    firstMention: number;
    confidence: 'known' | 'inferred' | 'unknown';
  }>;
  history: Array<{
    timestamp: number;
    direction: 'request' | 'response';
    substitutions: Array<{ from: string; to: string }>;
  }>;
}

// ========== MESSAGE PASSING TYPES ==========

/**
 * Message types for extension communication
 */
export type MessageType =
  // Substitution
  | 'SUBSTITUTE_REQUEST'
  | 'SUBSTITUTE_RESPONSE'

  // Profile management (v2)
  | 'GET_PROFILES'
  | 'ADD_PROFILE'
  | 'UPDATE_PROFILE'
  | 'REMOVE_PROFILE'
  | 'TOGGLE_PROFILE'
  | 'RELOAD_PROFILES'
  | 'SET_PROFILES'

  // Legacy alias management (v1 - deprecated)
  | 'GET_ALIASES'
  | 'ADD_ALIAS'
  | 'REMOVE_ALIAS'

  // Config
  | 'GET_CONFIG'
  | 'UPDATE_CONFIG'
  | 'UPDATE_SETTINGS'

  // Stats & logging
  | 'UPDATE_STATS'
  | 'GET_ACTIVITY_LOG'
  | 'CLEAR_ACTIVITY_LOG'
  | 'ADD_ACTIVITY_LOG'

  // API Key Vault
  | 'ADD_API_KEY'
  | 'REMOVE_API_KEY'
  | 'UPDATE_API_KEY'
  | 'GET_API_KEYS'
  | 'UPDATE_API_KEY_VAULT_SETTINGS'

  // Custom Redaction Rules
  | 'ADD_CUSTOM_RULE'
  | 'REMOVE_CUSTOM_RULE'
  | 'UPDATE_CUSTOM_RULE'
  | 'TOGGLE_CUSTOM_RULE'
  | 'UPDATE_CUSTOM_RULES_SETTINGS'

  // Health & Status
  | 'PING'
  | 'HEALTH_CHECK'
  | 'PROTECTION_LOST'
  | 'DISABLE_EXTENSION'
  | 'REINJECT_CONTENT_SCRIPTS';

/**
 * Generic message structure
 */
export interface Message {
  type: MessageType;
  payload?: any;
  tabId?: number; // For PROTECTION_LOST message
}

/**
 * Message response structure
 */
export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ========== REQUEST/RESPONSE INTERCEPTION ==========

/**
 * Request interception payload
 */
export interface InterceptRequestPayload {
  url: string;
  method: string;
  body: string;
  headers: Record<string, string>;
}

/**
 * Response from interception
 */
export interface InterceptResponse {
  success: boolean;
  modifiedResponse?: any;
  error?: string;
}

// ========== UTILITY TYPES ==========

/**
 * PII field type
 */
export type PIIType = 'name' | 'email' | 'phone' | 'cellPhone' | 'address' | 'company' | 'custom';

/**
 * Account tier
 */
export type AccountTier = 'free' | 'pro' | 'enterprise';

/**
 * Substitution mode
 */
export type SubstitutionMode = 'auto-replace' | 'warn-first';

// ========== API KEY VAULT TYPES (PRO) ==========

/**
 * API key formats that can be detected
 */
export type APIKeyFormat =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'aws'
  | 'github'
  | 'stripe'
  | 'generic'
  | 'custom'; // User-defined regex

/**
 * Stored API key with metadata
 */
export interface APIKey {
  id: string;
  name?: string; // User-provided label
  project?: string; // Project/directory name (e.g., "Work", "Personal", "Client A")
  keyValue: string; // The actual key (encrypted in storage)
  format: APIKeyFormat; // Detected format
  createdAt: number;
  lastUsed: number;
  protectionCount: number; // How many times redacted
  enabled: boolean;
}

/**
 * API Key Vault configuration (PRO feature)
 */
export interface APIKeyVaultConfig {
  enabled: boolean;
  mode: 'auto-redact' | 'warn-first' | 'log-only';
  autoDetectPatterns: boolean; // Scan for known formats
  keys: APIKey[]; // User's stored keys
  customPatterns: string[]; // User-defined detection rules (stored as strings)
}

/**
 * Custom Redaction Rule
 */
export interface CustomRule {
  id: string;
  name: string; // User-friendly name
  pattern: string; // Regex pattern (stored as string)
  replacement: string; // Replacement text (supports $1, $2, etc.)
  enabled: boolean;
  priority: number; // Higher = runs first (0-100)
  category: 'pii' | 'financial' | 'medical' | 'custom';
  description?: string;
  createdAt: number;
  lastUsed?: number;
  matchCount: number; // How many times this rule has matched
  testCases?: { input: string; expected: string }[]; // For validation
}

/**
 * Custom Redaction Rules configuration (PRO feature)
 */
export interface CustomRulesConfig {
  enabled: boolean;
  rules: CustomRule[];
}

// ========== DOCUMENT ANALYSIS TYPES ==========

/**
 * Document Alias - Tracks a sanitized document upload
 */
export interface DocumentAlias {
  id: string;                    // "doc_1699394400000_abc123"
  documentName: string;          // "Contract_2024.pdf"
  createdAt: number;
  updatedAt: number;
  fileSize: number;              // Bytes
  fileType: string;              // MIME type
  platform?: AIService;          // Where it was used (optional)

  // PII detection results
  piiMap: Array<{
    profileId: string;           // Which profile matched
    profileName: string;         // "Greg - Work"
    piiType: PIIType;            // "name", "email", etc.
    realValue: string;           // "Greg Barker"
    aliasValue: string;          // "John Doe"
    occurrences: number;         // How many times found
    positions: number[];         // Character positions in text
  }>;

  // Text content
  originalText?: string;         // Optional: full original (encrypted)
  sanitizedText: string;         // Sanitized version (ready to use)

  // Metadata
  confidence: number;            // 0-1 from AliasEngine
  substitutionCount: number;
  profilesUsed: string[];        // Profile IDs

  // Usage tracking
  usageCount: number;
  lastUsed?: number;

  // Preview snippet (first 200 chars)
  preview: string;
}

/**
 * Queued File - Represents a file in the upload queue (before processing)
 */
export interface QueuedFile {
  id: string;                    // Unique identifier (timestamp + random)
  file: File;                    // Original File object
  fileName: string;              // Display name
  fileSize: number;              // Size in bytes
  fileType: string;              // MIME type
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;         // If status is error
  extractedText?: string;        // Cached after parsing (if completed)
  sanitizedText?: string;        // Cached after sanitizing (if completed)
  documentAlias?: Omit<DocumentAlias, 'id' | 'createdAt' | 'updatedAt'>; // Result data
}
