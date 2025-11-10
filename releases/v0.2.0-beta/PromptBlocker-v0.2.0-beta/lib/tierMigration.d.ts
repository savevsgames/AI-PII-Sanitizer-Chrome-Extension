/**
 * Tier Migration System
 *
 * Handles data migration when users change subscription tiers:
 * - PRO → FREE: Archive data and reset to clean FREE state
 * - FREE → PRO: Check for archived data and offer restoration
 */
/**
 * Handle downgrade from PRO to FREE tier
 *
 * Strategy:
 * 1. Archive ALL PRO data (encrypted, 90-day expiration)
 * 2. Wipe user to clean FREE state (no profiles, only starter templates)
 * 3. User starts fresh with 1 profile allowed
 */
export declare function handleDowngrade(userId: string): Promise<void>;
/**
 * Handle upgrade from FREE to PRO tier (database tier change)
 *
 * Check if user has archived data and return info for restoration prompt
 */
export declare function handleDatabaseUpgrade(userId: string): Promise<{
    hasArchive: boolean;
    archiveInfo?: {
        archivedAt: string;
        profileCount: number;
        templateCount: number;
        ruleCount: number;
    };
}>;
/**
 * Show downgrade notification to user
 * Returns HTML for modal content
 */
export declare function getDowngradeNotificationHTML(): string;
/**
 * Show restoration prompt for re-subscription
 * Returns HTML for modal content
 */
export declare function getRestorationPromptHTML(archiveInfo: {
    archivedAt: string;
    profileCount: number;
    templateCount: number;
    ruleCount: number;
}): string;
//# sourceMappingURL=tierMigration.d.ts.map