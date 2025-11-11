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
export declare class StorageDocumentAliasManager {
    private encryptionManager;
    private static readonly DOCUMENT_ALIASES_KEY;
    private static readonly MAX_DOCUMENTS;
    constructor(encryptionManager: StorageEncryptionManager);
    /**
     * Load document aliases (decrypted)
     */
    loadDocumentAliases(): Promise<DocumentAlias[]>;
    /**
     * Save document alias (encrypted)
     */
    saveDocumentAlias(documentAlias: DocumentAlias): Promise<void>;
    /**
     * Delete document alias
     */
    deleteDocumentAlias(id: string): Promise<void>;
    /**
     * Update document alias (for incrementing usage)
     */
    updateDocumentAlias(documentAlias: DocumentAlias): Promise<void>;
}
//# sourceMappingURL=StorageDocumentAliasManager.d.ts.map