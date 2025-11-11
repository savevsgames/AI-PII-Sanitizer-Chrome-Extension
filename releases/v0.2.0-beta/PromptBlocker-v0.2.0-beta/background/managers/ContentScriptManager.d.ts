/**
 * Content Script Manager
 * Handles content script injection into AI service tabs
 */
import { BadgeManager } from './BadgeManager';
export declare class ContentScriptManager {
    private badgeManager;
    /**
     * AI service URL patterns for content script injection
     */
    static readonly AI_SERVICE_PATTERNS: string[];
    constructor(badgeManager: BadgeManager);
    /**
     * Check if content script is already injected in a tab
     */
    isContentScriptInjected(tabId: number): Promise<boolean>;
    /**
     * Inject content scripts into all existing AI service tabs
     */
    injectIntoExistingTabs(): Promise<void>;
    /**
     * Handle REINJECT_CONTENT_SCRIPTS message from popup
     */
    handleReinject(): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Reload all AI service tabs (for extension updates/dev mode)
     * Returns the number of tabs reloaded
     */
    reloadAIServiceTabs(): Promise<number>;
}
//# sourceMappingURL=ContentScriptManager.d.ts.map