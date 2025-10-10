/**
 * Core data types for the AI PII Sanitizer extension
 * Version 2.0 - Profile-based architecture
 */

// ========== V2 PROFILE TYPES ==========

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
        poe: number;
        copilot: number;
        you: number;
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
  };
}

/**
 * Activity log entry for debug console
 */
/**
 * Supported AI services
 */
export type AIService =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'perplexity'
  | 'poe'
  | 'copilot'
  | 'you'
  | 'unknown';

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  type: 'interception' | 'substitution' | 'warning' | 'error';
  service: AIService;
  details: {
    url: string;
    profilesUsed: string[];      // Profile IDs
    piiTypesFound: string[];     // ['name', 'email']
    substitutionCount: number;
    error?: string;
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
  };

  // Global settings
  settings: {
    enabled: boolean;
    defaultMode: 'auto-replace' | 'warn-first';
    showNotifications: boolean;
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
      poe: { requests: number; substitutions: number };
      copilot: { requests: number; substitutions: number };
      you: { requests: number; substitutions: number };
    };
    activityLog: ActivityLogEntry[];
  };

  // API Key Vault (PRO feature)
  apiKeyVault?: APIKeyVaultConfig;
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
  // Health & Status
  | 'PING'
  | 'HEALTH_CHECK'
  | 'REINJECT_CONTENT_SCRIPTS';

/**
 * Generic message structure
 */
export interface Message {
  type: MessageType;
  payload: any;
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
