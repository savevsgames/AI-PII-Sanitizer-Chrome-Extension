/**
 * Core data types for the AI PII Sanitizer extension
 * Version 2.0 - Profile-based architecture
 */
/**
 * Prompt template with placeholders for profile data
 */
export interface PromptTemplate {
    id: string;
    name: string;
    description?: string;
    content: string;
    category?: string;
    tags?: string[];
    createdAt: number;
    updatedAt: number;
    usageCount: number;
    lastUsed?: number;
    profileId?: string;
    isStarter?: boolean;
    readonly?: boolean;
}
/**
 * Prompt templates configuration
 */
export interface PromptTemplatesConfig {
    templates: PromptTemplate[];
    maxTemplates: number;
    defaultProfile?: string;
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
    custom?: Record<string, string>;
}
/**
 * Main profile entity - contains complete real/alias identity mapping
 */
export interface AliasProfile {
    id: string;
    profileName: string;
    description?: string;
    enabled: boolean;
    real: IdentityData;
    alias: IdentityData;
    variations?: {
        real: Record<string, string[]>;
        alias: Record<string, string[]>;
    };
    customVariations?: {
        real: Record<string, Array<{
            value: string;
            enabled: boolean;
        }>>;
        alias: Record<string, Array<{
            value: string;
            enabled: boolean;
        }>>;
    };
    disabledVariations?: {
        real: Record<string, string[]>;
        alias: Record<string, string[]>;
    };
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
        confidence: number;
    };
    settings: {
        autoReplace: boolean;
        highlightInUI: boolean;
        activeServices: string[];
        enableVariations: boolean;
    };
}
/**
 * Activity log entry for debug console
 */
/**
 * Supported AI services (5 platforms - production ready)
 */
export type AIService = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'copilot' | 'unknown';
export interface ActivityLogEntry {
    id: string;
    timestamp: number;
    type: 'interception' | 'substitution' | 'warning' | 'error';
    service: AIService;
    details: {
        url: string;
        profilesUsed?: string[];
        piiTypesFound?: string[];
        substitutionCount: number;
        error?: string;
        apiKeysProtected?: number;
        apiKeysFound?: number;
        keyTypes?: string[];
    };
    message: string;
}
/**
 * User configuration (v2)
 */
export interface UserConfig {
    version: number;
    account?: {
        email?: string;
        emailOptIn: boolean;
        licenseKey?: string;
        tier: 'free' | 'pro' | 'enterprise';
        syncEnabled: boolean;
        discordId?: string;
        firebaseUid?: string;
        displayName?: string;
        photoURL?: string;
        encryptionProvider?: 'google' | 'github' | 'microsoft' | 'email';
        encryptionEmail?: string;
    };
    settings: {
        enabled: boolean;
        defaultMode: 'auto-replace' | 'warn-first';
        showNotifications: boolean;
        decodeResponses: boolean;
        theme: 'chrome-theme' | 'classic-light' | 'lavender' | 'sky' | 'fire' | 'leaf' | 'sunlight' | 'classic-dark' | 'midnight-purple' | 'deep-ocean' | 'embers' | 'forest' | 'sundown';
        protectedDomains: string[];
        excludedDomains: string[];
        strictMode: boolean;
        debugMode: boolean;
        cloudSync: boolean;
    };
    profiles: AliasProfile[];
    stats: {
        totalSubstitutions: number;
        totalInterceptions: number;
        totalWarnings: number;
        successRate: number;
        lastSyncTimestamp: number;
        byService: {
            chatgpt: {
                requests: number;
                substitutions: number;
            };
            claude: {
                requests: number;
                substitutions: number;
            };
            gemini: {
                requests: number;
                substitutions: number;
            };
            perplexity: {
                requests: number;
                substitutions: number;
            };
            copilot: {
                requests: number;
                substitutions: number;
            };
        };
        activityLog: ActivityLogEntry[];
    };
    apiKeyVault?: APIKeyVaultConfig;
    customRules?: CustomRulesConfig;
    promptTemplates?: PromptTemplatesConfig;
}
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
/**
 * Result of a text substitution operation
 */
export interface SubstitutionResult {
    text: string;
    substitutions: Array<{
        from: string;
        to: string;
        position: number;
        profileId?: string;
        piiType?: string;
    }>;
    confidence: number;
    profilesMatched?: Array<{
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
    mode?: 'auto' | 'detect-only';
    profileIds?: string[];
}
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
        substitutions: Array<{
            from: string;
            to: string;
        }>;
    }>;
}
/**
 * Message types for extension communication
 */
export type MessageType = 'SUBSTITUTE_REQUEST' | 'SUBSTITUTE_RESPONSE' | 'GET_PROFILES' | 'ADD_PROFILE' | 'UPDATE_PROFILE' | 'REMOVE_PROFILE' | 'TOGGLE_PROFILE' | 'RELOAD_PROFILES' | 'GET_ALIASES' | 'ADD_ALIAS' | 'REMOVE_ALIAS' | 'GET_CONFIG' | 'UPDATE_CONFIG' | 'UPDATE_SETTINGS' | 'UPDATE_STATS' | 'GET_ACTIVITY_LOG' | 'CLEAR_ACTIVITY_LOG' | 'ADD_API_KEY' | 'REMOVE_API_KEY' | 'UPDATE_API_KEY' | 'GET_API_KEYS' | 'UPDATE_API_KEY_VAULT_SETTINGS' | 'ADD_CUSTOM_RULE' | 'REMOVE_CUSTOM_RULE' | 'UPDATE_CUSTOM_RULE' | 'TOGGLE_CUSTOM_RULE' | 'UPDATE_CUSTOM_RULES_SETTINGS' | 'PING' | 'HEALTH_CHECK' | 'PROTECTION_LOST' | 'DISABLE_EXTENSION' | 'REINJECT_CONTENT_SCRIPTS';
/**
 * Generic message structure
 */
export interface Message {
    type: MessageType;
    payload?: any;
    tabId?: number;
}
/**
 * Message response structure
 */
export interface MessageResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}
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
/**
 * API key formats that can be detected
 */
export type APIKeyFormat = 'openai' | 'anthropic' | 'google' | 'aws' | 'github' | 'stripe' | 'generic' | 'custom';
/**
 * Stored API key with metadata
 */
export interface APIKey {
    id: string;
    name?: string;
    project?: string;
    keyValue: string;
    format: APIKeyFormat;
    createdAt: number;
    lastUsed: number;
    protectionCount: number;
    enabled: boolean;
}
/**
 * API Key Vault configuration (PRO feature)
 */
export interface APIKeyVaultConfig {
    enabled: boolean;
    mode: 'auto-redact' | 'warn-first' | 'log-only';
    autoDetectPatterns: boolean;
    keys: APIKey[];
    customPatterns: string[];
}
/**
 * Custom Redaction Rule
 */
export interface CustomRule {
    id: string;
    name: string;
    pattern: string;
    replacement: string;
    enabled: boolean;
    priority: number;
    category: 'pii' | 'financial' | 'medical' | 'custom';
    description?: string;
    createdAt: number;
    lastUsed?: number;
    matchCount: number;
    testCases?: {
        input: string;
        expected: string;
    }[];
}
/**
 * Custom Redaction Rules configuration (PRO feature)
 */
export interface CustomRulesConfig {
    enabled: boolean;
    rules: CustomRule[];
}
/**
 * Document Alias - Tracks a sanitized document upload
 */
export interface DocumentAlias {
    id: string;
    documentName: string;
    createdAt: number;
    updatedAt: number;
    fileSize: number;
    fileType: string;
    platform?: AIService;
    piiMap: Array<{
        profileId: string;
        profileName: string;
        piiType: PIIType;
        realValue: string;
        aliasValue: string;
        occurrences: number;
        positions: number[];
    }>;
    originalText?: string;
    sanitizedText: string;
    confidence: number;
    substitutionCount: number;
    profilesUsed: string[];
    usageCount: number;
    lastUsed?: number;
    preview: string;
}
/**
 * Queued File - Represents a file in the upload queue (before processing)
 */
export interface QueuedFile {
    id: string;
    file: File;
    fileName: string;
    fileSize: number;
    fileType: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    errorMessage?: string;
    extractedText?: string;
    sanitizedText?: string;
    documentAlias?: Omit<DocumentAlias, 'id' | 'createdAt' | 'updatedAt'>;
}
//# sourceMappingURL=types.d.ts.map