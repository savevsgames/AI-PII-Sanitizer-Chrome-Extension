/**
 * Storage Manager for persisting aliases and configuration
 * Uses Chrome Storage API with encryption for sensitive data
 */

import { AliasEntry, UserConfig } from './types';

export class StorageManager {
  private static instance: StorageManager;
  private static readonly KEYS = {
    ALIASES: 'aliases',
    CONFIG: 'config',
    STATS: 'stats',
  };

  private constructor() {}

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Initialize storage with default values
   */
  async initialize(): Promise<void> {
    const config = await this.loadConfig();
    if (!config) {
      await this.saveConfig(this.getDefaultConfig());
    }

    const aliases = await this.loadAliases();
    if (!aliases) {
      await this.saveAliases([]);
    }
  }

  /**
   * Save alias dictionary
   */
  async saveAliases(aliases: AliasEntry[]): Promise<void> {
    const encrypted = await this.encrypt(JSON.stringify(aliases));
    await chrome.storage.local.set({
      [StorageManager.KEYS.ALIASES]: encrypted,
    });
  }

  /**
   * Load and decrypt aliases
   */
  async loadAliases(): Promise<AliasEntry[]> {
    const data = await chrome.storage.local.get(StorageManager.KEYS.ALIASES);
    if (!data[StorageManager.KEYS.ALIASES]) {
      return [];
    }

    try {
      const decrypted = await this.decrypt(data[StorageManager.KEYS.ALIASES]);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt aliases:', error);
      return [];
    }
  }

  /**
   * Add a new alias
   */
  async addAlias(alias: Omit<AliasEntry, 'id' | 'metadata'>): Promise<AliasEntry> {
    const aliases = await this.loadAliases();

    const newAlias: AliasEntry = {
      ...alias,
      id: this.generateId(),
      metadata: {
        createdAt: Date.now(),
        usageCount: 0,
        lastUsed: 0,
        confidence: 1,
      },
    };

    aliases.push(newAlias);
    await this.saveAliases(aliases);
    return newAlias;
  }

  /**
   * Remove an alias by ID
   */
  async removeAlias(id: string): Promise<void> {
    const aliases = await this.loadAliases();
    const filtered = aliases.filter(a => a.id !== id);
    await this.saveAliases(filtered);
  }

  /**
   * Update an existing alias
   */
  async updateAlias(id: string, updates: Partial<AliasEntry>): Promise<void> {
    const aliases = await this.loadAliases();
    const index = aliases.findIndex(a => a.id === id);

    if (index !== -1) {
      aliases[index] = { ...aliases[index], ...updates };
      await this.saveAliases(aliases);
    }
  }

  /**
   * Save configuration
   */
  async saveConfig(config: UserConfig): Promise<void> {
    await chrome.storage.local.set({
      [StorageManager.KEYS.CONFIG]: config,
    });
  }

  /**
   * Load configuration
   */
  async loadConfig(): Promise<UserConfig | null> {
    const data = await chrome.storage.local.get(StorageManager.KEYS.CONFIG);
    return data[StorageManager.KEYS.CONFIG] || null;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): UserConfig {
    return {
      version: 1,
      settings: {
        enabled: true,
        autoHighlight: true,
        showNotifications: true,
        protectedDomains: [
          'chat.openai.com',
          'claude.ai',
          'gemini.google.com',
        ],
        excludedDomains: [],
        strictMode: false,
      },
      aliases: [],
      stats: {
        totalSubstitutions: 0,
        successRate: 1.0,
        lastSyncTimestamp: Date.now(),
      },
    };
  }

  /**
   * Simple encryption using Web Crypto API
   */
  private async encrypt(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return this.arrayBufferToBase64(combined);
  }

  /**
   * Decrypt data
   */
  private async decrypt(encryptedData: string): Promise<string> {
    const combined = this.base64ToArrayBuffer(encryptedData);
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const key = await this.getEncryptionKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Get or generate encryption key
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    // Use extension ID as key material
    const keyMaterial = chrome.runtime.id;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);

    // Import raw key material
    const importedKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive AES key
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('ai-pii-sanitizer-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  /**
   * Generate unique ID for aliases
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
