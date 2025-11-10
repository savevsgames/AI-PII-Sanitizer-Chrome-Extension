/**
 * Storage Utilities
 * Shared utility functions for storage operations
 */
/**
 * Generate unique ID for storage entities
 */
export declare function generateId(): string;
/**
 * Get storage quota information
 * With unlimitedStorage permission, quota is essentially disk space
 */
export declare function getStorageQuota(): Promise<{
    used: number;
    quota: number;
    percentage: number;
    hasUnlimitedStorage: boolean;
}>;
//# sourceMappingURL=storage-utils.d.ts.map