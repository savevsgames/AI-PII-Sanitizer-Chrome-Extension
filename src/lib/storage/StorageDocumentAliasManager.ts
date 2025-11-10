/**
 * Storage Document Alias Manager
 * Handles document analysis alias storage
 *
 * Features:
 * - Document alias CRUD operations
 * - Encrypted storage for document analysis results
 * - Automatic document limit management (50 max)
 * - Usage tracking
 */

import { DocumentAlias } from '../types';
import { StorageEncryptionManager } from './StorageEncryptionManager';

type StoredDocumentItem = {
  id: string;
  documentName: string;
  createdAt: number;
  encryptedData: string;
};

export class StorageDocumentAliasManager {
  private encryptionManager: StorageEncryptionManager;

  private static readonly DOCUMENT_ALIASES_KEY = 'documentAliases';
  private static readonly MAX_DOCUMENTS = 50;

  constructor(encryptionManager: StorageEncryptionManager) {
    this.encryptionManager = encryptionManager;
  }

  /**
   * Load document aliases (decrypted)
   */
  async loadDocumentAliases(): Promise<DocumentAlias[]> {
    const data = await chrome.storage.local.get(StorageDocumentAliasManager.DOCUMENT_ALIASES_KEY);

    if (!data[StorageDocumentAliasManager.DOCUMENT_ALIASES_KEY]) {
      return [];
    }

    const aliases: DocumentAlias[] = [];

    for (const item of data[StorageDocumentAliasManager.DOCUMENT_ALIASES_KEY]) {
      try {
        const decrypted = await this.encryptionManager.decrypt(item.encryptedData);
        aliases.push(JSON.parse(decrypted));
      } catch (error) {
        console.error('[StorageDocumentAliasManager] Failed to decrypt document:', item.id, error);
        // Skip corrupted documents
      }
    }

    // Sort by creation date (newest first)
    return aliases.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Save document alias (encrypted)
   */
  async saveDocumentAlias(documentAlias: DocumentAlias): Promise<void> {
    const encrypted = await this.encryptionManager.encrypt(JSON.stringify(documentAlias));

    const data = await chrome.storage.local.get(StorageDocumentAliasManager.DOCUMENT_ALIASES_KEY);
    const existing: StoredDocumentItem[] = data[StorageDocumentAliasManager.DOCUMENT_ALIASES_KEY] || [];

    existing.push({
      id: documentAlias.id,
      documentName: documentAlias.documentName,
      createdAt: documentAlias.createdAt,
      encryptedData: encrypted
    });

    // Limit to MAX_DOCUMENTS (configurable)
    if (existing.length > StorageDocumentAliasManager.MAX_DOCUMENTS) {
      // Remove oldest documents
      existing.sort((a, b) => b.createdAt - a.createdAt);
      existing.splice(StorageDocumentAliasManager.MAX_DOCUMENTS);
      console.log(`[StorageDocumentAliasManager] Trimmed to ${StorageDocumentAliasManager.MAX_DOCUMENTS} documents`);
    }

    await chrome.storage.local.set({
      [StorageDocumentAliasManager.DOCUMENT_ALIASES_KEY]: existing
    });
    console.log('[StorageDocumentAliasManager] Saved document alias:', documentAlias.id);
  }

  /**
   * Delete document alias
   */
  async deleteDocumentAlias(id: string): Promise<void> {
    const data = await chrome.storage.local.get(StorageDocumentAliasManager.DOCUMENT_ALIASES_KEY);
    const existing: StoredDocumentItem[] = data[StorageDocumentAliasManager.DOCUMENT_ALIASES_KEY] || [];

    const filtered = existing.filter((item: StoredDocumentItem) => item.id !== id);

    await chrome.storage.local.set({
      [StorageDocumentAliasManager.DOCUMENT_ALIASES_KEY]: filtered
    });
    console.log('[StorageDocumentAliasManager] Deleted document alias:', id);
  }

  /**
   * Update document alias (for incrementing usage)
   */
  async updateDocumentAlias(documentAlias: DocumentAlias): Promise<void> {
    const data = await chrome.storage.local.get(StorageDocumentAliasManager.DOCUMENT_ALIASES_KEY);
    const existing: StoredDocumentItem[] = data[StorageDocumentAliasManager.DOCUMENT_ALIASES_KEY] || [];

    const index = existing.findIndex((item: StoredDocumentItem) => item.id === documentAlias.id);

    if (index !== -1) {
      const encrypted = await this.encryptionManager.encrypt(JSON.stringify(documentAlias));
      existing[index] = {
        id: documentAlias.id,
        documentName: documentAlias.documentName,
        createdAt: documentAlias.createdAt,
        encryptedData: encrypted
      };

      await chrome.storage.local.set({
        [StorageDocumentAliasManager.DOCUMENT_ALIASES_KEY]: existing
      });
      console.log('[StorageDocumentAliasManager] Updated document alias:', documentAlias.id);
    }
  }
}
