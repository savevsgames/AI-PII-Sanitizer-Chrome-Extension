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
export declare class StorageEncryptionManager {
    private customAuthInstance;
    /**
     * Encrypt data using AES-256-GCM
     */
    encrypt(data: string): Promise<string>;
    /**
     * Decrypt data
     */
    decrypt(encryptedData: string): Promise<string>;
    /**
     * Get encryption key using Firebase UID as key material
     * SECURITY: Key material is NOT stored locally - derived from Firebase auth session
     * This provides true key separation: encrypted data in chrome.storage, key material in Firebase
     */
    private getEncryptionKey;
    /**
     * Get Firebase UID as encryption key material
     * SECURITY: Never stored locally - only available when user is authenticated
     * @throws Error if user is not authenticated
     */
    private getFirebaseKeyMaterial;
    /**
     * Get legacy encryption key (uses random key material from chrome.storage)
     * DEPRECATED: Only used for migration from old encryption method
     * Will be removed in v2.0
     */
    getLegacyEncryptionKey(): Promise<CryptoKey>;
    /**
     * Decrypt data with a specific key (used for migration)
     */
    decryptWithKey(encryptedData: string, key: CryptoKey): Promise<string>;
    /**
     * Encrypt API key vault
     * Encrypts the entire apiKeyVault object including all key values
     */
    encryptAPIKeyVault(vault: any): Promise<string>;
    /**
     * Decrypt API key vault
     * Decrypts the encrypted vault string back to the original object
     */
    decryptAPIKeyVault(encryptedVault: string): Promise<any>;
    /**
     * Encrypt custom rules
     * Encrypts the custom rules array including patterns and replacements
     */
    encryptCustomRules(rules: any): Promise<string>;
    /**
     * Decrypt custom rules
     */
    decryptCustomRules(encryptedRules: string): Promise<any>;
    /**
     * Encrypt activity logs
     * Encrypts activity log array to protect usage history
     */
    encryptActivityLogs(logs: any): Promise<string>;
    /**
     * Decrypt activity logs
     */
    decryptActivityLogs(encryptedLogs: string): Promise<any>;
    /**
     * Encrypt account data
     * Encrypts email, displayName, photoURL
     */
    encryptAccountData(account: any): Promise<string>;
    /**
     * Decrypt account data
     */
    decryptAccountData(encryptedAccount: string): Promise<any>;
    /**
     * Get or generate random key material unique to this user
     * Stored in chrome.storage (not encrypted, as it's used for encryption)
     * DEPRECATED: Only used for legacy encryption
     */
    private getOrGenerateKeyMaterial;
    /**
     * Get or generate random salt unique to this user
     */
    private getOrGenerateSalt;
    /**
     * Convert ArrayBuffer to Base64
     */
    private arrayBufferToBase64;
    /**
     * Convert Base64 to ArrayBuffer
     */
    private base64ToArrayBuffer;
    /**
     * Set custom auth instance for testing
     */
    setCustomAuth(auth: Auth): void;
    /**
     * Clear custom auth instance
     */
    clearCustomAuth(): void;
}
//# sourceMappingURL=StorageEncryptionManager.d.ts.map