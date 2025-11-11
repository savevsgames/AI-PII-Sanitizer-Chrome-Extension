/**
 * Storage Encryption Manager
 * Handles all encryption/decryption operations using Web Crypto API
 *
 * Security Features:
 * - AES-256-GCM encryption
 * - Firebase UID as key material (true key separation)
 * - PBKDF2 with 210k iterations (OWASP 2023 recommendation)
 * - Random IV per encryption
 * - Legacy key support for migration
 */

import { Auth } from 'firebase/auth';

export class StorageEncryptionManager {
  private customAuthInstance: Auth | null = null;

  // ========== CORE ENCRYPTION ==========

  /**
   * Encrypt data using AES-256-GCM
   */
  async encrypt(data: string): Promise<string> {
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
  async decrypt(encryptedData: string): Promise<string> {
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

  // ========== KEY DERIVATION ==========

  /**
   * Get encryption key using Firebase UID as key material
   * SECURITY: Key material is NOT stored locally - derived from Firebase auth session
   * This provides true key separation: encrypted data in chrome.storage, key material in Firebase
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();

    // Get Firebase UID as key material (throws if not authenticated)
    const keyMaterial = await this.getFirebaseKeyMaterial();

    // Import Firebase UID as PBKDF2 key
    const importedKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(keyMaterial),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Get or generate unique salt (salt can be public - stored in chrome.storage is OK)
    const salt = await this.getOrGenerateSalt();

    // Derive AES-256-GCM key with 600k iterations (OWASP 2023 compliant)
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 600000, // OWASP 2023 recommendation: minimum 600,000 iterations
        hash: 'SHA-256',
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Get Firebase UID as encryption key material
   * SECURITY: Never stored locally - only available when user is authenticated
   * @throws Error if user is not authenticated
   */
  private async getFirebaseKeyMaterial(): Promise<string> {
    try {
      // Use custom auth instance if provided (for integration tests)
      // Otherwise, import default production auth (works in both popup and service worker)
      let auth;
      if (this.customAuthInstance) {
        auth = this.customAuthInstance;
        console.log('[StorageEncryptionManager] Using custom auth instance (test mode)');
      } else {
        // Import firebase.ts which auto-detects context and loads correct auth module
        const firebaseModule = await import(
          /* webpackMode: "eager" */
          /* webpackChunkName: "firebase-context" */
          '../firebase'
        );
        auth = firebaseModule.auth;
      }

      // Wait for Firebase to initialize if needed (max 300ms, instant if already loaded)
      // This handles cases where auth is still initializing in popup
      if (!auth.currentUser) {
        const maxWaitTime = 300; // 300ms max wait
        const startTime = Date.now();

        await new Promise<void>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged(() => {
            unsubscribe();
            resolve();
          });

          // Timeout fallback - resolve immediately if auth doesn't fire
          setTimeout(() => {
            resolve();
          }, maxWaitTime);
        });

        const waitTime = Date.now() - startTime;
        if (auth.currentUser) {
          console.log(`[StorageEncryptionManager] Firebase auth initialized after ${waitTime}ms wait`);
        }
      }

      // Check if user is authenticated after waiting
      if (!auth.currentUser) {
        throw new Error(
          'ENCRYPTION_KEY_UNAVAILABLE: Please sign in to access encrypted data. ' +
          'Your data is locked and requires authentication.'
        );
      }

      const uid = auth.currentUser.uid;

      if (!uid || uid.trim() === '') {
        throw new Error('ENCRYPTION_KEY_INVALID: Firebase UID is missing or empty.');
      }

      console.log('[StorageEncryptionManager] Using Firebase UID for encryption key derivation');
      return uid;

    } catch (error) {
      if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
        throw error; // Re-throw our custom errors (don't log, already descriptive)
      }
      // Unexpected error during Firebase import/access (e.g., document not defined)
      if (error instanceof Error && error.message.includes('document is not defined')) {
        throw new Error('ENCRYPTION_KEY_UNAVAILABLE: Cannot access encrypted data in service worker context.');
      }
      console.error('[StorageEncryptionManager] Unexpected error accessing Firebase auth:', error);
      throw new Error('ENCRYPTION_KEY_UNAVAILABLE: Authentication required to access encrypted data.');
    }
  }

  /**
   * Get legacy encryption key (uses random key material from chrome.storage)
   * DEPRECATED: Only used for migration from old encryption method
   * Will be removed in v2.0
   */
  async getLegacyEncryptionKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();

    // Get old random key material
    const keyMaterial = await this.getOrGenerateKeyMaterial();

    const importedKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(keyMaterial),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const salt = await this.getOrGenerateSalt();

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 210000,
        hash: 'SHA-256',
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Decrypt data with a specific key (used for migration)
   */
  async decryptWithKey(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = this.base64ToArrayBuffer(encryptedData);
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  // ========== SPECIALIZED ENCRYPTION ==========

  /**
   * Encrypt API key vault
   * Encrypts the entire apiKeyVault object including all key values
   */
  async encryptAPIKeyVault(vault: any): Promise<string> {
    try {
      const json = JSON.stringify(vault);
      return await this.encrypt(json);
    } catch (error) {
      console.error('[StorageEncryptionManager] Failed to encrypt API key vault:', error);
      throw error;
    }
  }

  /**
   * Decrypt API key vault
   * Decrypts the encrypted vault string back to the original object
   */
  async decryptAPIKeyVault(encryptedVault: string): Promise<any> {
    try {
      const json = await this.decrypt(encryptedVault);
      return JSON.parse(json);
    } catch (error) {
      // Don't log ENCRYPTION_KEY_UNAVAILABLE as error (expected when not authenticated)
      if (!(error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE'))) {
        console.error('[StorageEncryptionManager] Failed to decrypt API key vault:', error);
      }
      throw error;
    }
  }

  /**
   * Encrypt custom rules
   * Encrypts the custom rules array including patterns and replacements
   */
  async encryptCustomRules(rules: any): Promise<string> {
    try {
      const json = JSON.stringify(rules);
      return await this.encrypt(json);
    } catch (error) {
      console.error('[StorageEncryptionManager] Failed to encrypt custom rules:', error);
      throw error;
    }
  }

  /**
   * Decrypt custom rules
   */
  async decryptCustomRules(encryptedRules: string): Promise<any> {
    try {
      const json = await this.decrypt(encryptedRules);
      return JSON.parse(json);
    } catch (error) {
      // Don't log ENCRYPTION_KEY_UNAVAILABLE as error (expected when not authenticated)
      if (!(error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE'))) {
        console.error('[StorageEncryptionManager] Failed to decrypt custom rules:', error);
      }
      throw error;
    }
  }

  /**
   * Encrypt activity logs
   * Encrypts activity log array to protect usage history
   */
  async encryptActivityLogs(logs: any): Promise<string> {
    try {
      const json = JSON.stringify(logs);
      return await this.encrypt(json);
    } catch (error) {
      console.error('[StorageEncryptionManager] Failed to encrypt activity logs:', error);
      throw error;
    }
  }

  /**
   * Decrypt activity logs
   */
  async decryptActivityLogs(encryptedLogs: string): Promise<any> {
    try {
      const json = await this.decrypt(encryptedLogs);
      return JSON.parse(json);
    } catch (error) {
      // Don't log ENCRYPTION_KEY_UNAVAILABLE as error (expected when not authenticated)
      if (!(error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE'))) {
        console.error('[StorageEncryptionManager] Failed to decrypt activity logs:', error);
      }
      throw error;
    }
  }

  /**
   * Encrypt account data
   * Encrypts email, displayName, photoURL
   */
  async encryptAccountData(account: any): Promise<string> {
    try {
      const json = JSON.stringify(account);
      return await this.encrypt(json);
    } catch (error) {
      console.error('[StorageEncryptionManager] Failed to encrypt account data:', error);
      throw error;
    }
  }

  /**
   * Decrypt account data
   */
  async decryptAccountData(encryptedAccount: string): Promise<any> {
    try {
      const json = await this.decrypt(encryptedAccount);
      return JSON.parse(json);
    } catch (error) {
      // Don't log ENCRYPTION_KEY_UNAVAILABLE as error (expected when not authenticated)
      if (!(error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE'))) {
        console.error('[StorageEncryptionManager] Failed to decrypt account data:', error);
      }
      throw error;
    }
  }

  // ========== KEY MATERIAL & SALT MANAGEMENT ==========

  /**
   * Get or generate random key material unique to this user
   * Stored in chrome.storage (not encrypted, as it's used for encryption)
   * DEPRECATED: Only used for legacy encryption
   */
  private async getOrGenerateKeyMaterial(): Promise<string> {
    const STORAGE_KEY = '_encryptionKeyMaterial';

    // Try to load existing key material
    const data = await chrome.storage.local.get(STORAGE_KEY);

    if (data[STORAGE_KEY]) {
      return data[STORAGE_KEY];
    }

    // Generate new random key material (256 bits = 32 bytes)
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const keyMaterial = this.arrayBufferToBase64(randomBytes);

    // Store for future use
    await chrome.storage.local.set({ [STORAGE_KEY]: keyMaterial });

    console.log('[StorageEncryptionManager] Generated new encryption key material');
    return keyMaterial;
  }

  /**
   * Get or generate random salt unique to this user
   */
  private async getOrGenerateSalt(): Promise<string> {
    const STORAGE_KEY = '_encryptionSalt';

    // Try to load existing salt
    const data = await chrome.storage.local.get(STORAGE_KEY);

    if (data[STORAGE_KEY]) {
      return data[STORAGE_KEY];
    }

    // Generate new random salt (128 bits = 16 bytes)
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = this.arrayBufferToBase64(randomBytes);

    // Store for future use
    await chrome.storage.local.set({ [STORAGE_KEY]: salt });

    console.log('[StorageEncryptionManager] Generated new encryption salt');
    return salt;
  }

  // ========== UTILITIES ==========

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

  // ========== TEST INJECTION ==========

  /**
   * Set custom auth instance for testing
   */
  setCustomAuth(auth: Auth): void {
    this.customAuthInstance = auth;
  }

  /**
   * Clear custom auth instance
   */
  clearCustomAuth(): void {
    this.customAuthInstance = null;
  }
}
