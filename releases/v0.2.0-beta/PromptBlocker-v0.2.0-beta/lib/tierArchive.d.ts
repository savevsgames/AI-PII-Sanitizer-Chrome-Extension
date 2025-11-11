/**
 * Tier Archive System
 *
 * Handles archiving PRO data when users downgrade to FREE tier
 * and restoration when they re-subscribe within 90 days.
 */
interface ArchivedProData {
    userId: string;
    archivedAt: number;
    expiresAt: number;
    encryptedData: string;
}
/**
 * Archive all PRO data for a user (profiles, templates, rules, settings)
 * Data is encrypted and stored for 90 days
 */
export declare function archiveProData(userId: string): Promise<void>;
/**
 * Get archived data for a user (if exists and not expired)
 */
export declare function getArchivedData(userId: string): Promise<ArchivedProData | null>;
/**
 * Restore archived PRO data when user re-subscribes
 * Returns true if restoration succeeded, false if no archive found
 */
export declare function restoreProData(userId: string): Promise<boolean>;
/**
 * Clear archived data for a user
 */
export declare function clearArchivedData(_userId: string): Promise<void>;
/**
 * Format archive date for display
 */
export declare function formatArchiveDate(timestamp: number): string;
/**
 * Get archive stats for UI display
 */
export declare function getArchiveStats(userId: string): Promise<{
    hasArchive: boolean;
    archivedAt?: string;
    expiresAt?: string;
    profileCount?: number;
    templateCount?: number;
    ruleCount?: number;
} | null>;
export {};
//# sourceMappingURL=tierArchive.d.ts.map