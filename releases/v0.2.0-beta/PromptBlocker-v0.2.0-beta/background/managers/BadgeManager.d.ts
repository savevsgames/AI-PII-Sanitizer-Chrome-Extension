/**
 * Badge Manager
 * Handles extension badge updates based on protection state
 */
import { StorageManager } from '../../lib/storage';
import { ContentScriptManager } from './ContentScriptManager';
/**
 * Protection state for badge display
 */
export type ProtectionState = 'protected' | 'unprotected' | 'disabled';
export declare class BadgeManager {
    private storage;
    private contentScriptManager;
    /**
     * AI service URL patterns for protection detection
     */
    static readonly AI_SERVICE_URLS: string[];
    /**
     * Track last badge state per tab to avoid log spam
     */
    private badgeStateCache;
    constructor(storage: StorageManager, contentScriptManager: ContentScriptManager);
    /**
     * Check if URL is an AI service
     */
    isAIServiceURL(url: string | undefined): boolean;
    /**
     * Update extension badge based on protection state
     */
    updateBadge(tabId: number, state: ProtectionState): Promise<void>;
    /**
     * Check tab protection status and update badge
     */
    checkAndUpdateBadge(tabId: number, url?: string): Promise<void>;
}
//# sourceMappingURL=BadgeManager.d.ts.map