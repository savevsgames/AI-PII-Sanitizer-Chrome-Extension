/**
 * Core data types for the AI PII Sanitizer extension
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

export interface UserConfig {
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

export interface SubstitutionResult {
  text: string;
  substitutions: Array<{
    from: string;
    to: string;
    position: number;
  }>;
  confidence: number;
}

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

export type MessageType =
  | 'SUBSTITUTE_REQUEST'
  | 'SUBSTITUTE_RESPONSE'
  | 'GET_ALIASES'
  | 'ADD_ALIAS'
  | 'REMOVE_ALIAS'
  | 'UPDATE_CONFIG'
  | 'GET_CONFIG';

export interface Message {
  type: MessageType;
  payload: any;
}

export interface InterceptRequestPayload {
  url: string;
  method: string;
  body: string;
  headers: Record<string, string>;
}

export interface InterceptResponse {
  success: boolean;
  modifiedResponse?: any;
  error?: string;
}
