/**
 * Request Processor
 * Handles request body substitution (real → alias)
 */
import { StorageManager } from '../../lib/storage';
import { AliasEngine } from '../../lib/aliasEngine';
import { APIKeyDetector } from '../../lib/apiKeyDetector';
import { redactionEngine } from '../../lib/redactionEngine';
import { ActivityLogger } from '../managers/ActivityLogger';
export declare class RequestProcessor {
    private storage;
    private aliasEngine;
    private redactionEngineInstance;
    private activityLogger;
    constructor(storage: StorageManager, aliasEngine: AliasEngine, _apiKeyDetector: APIKeyDetector, // Unused - using static methods directly
    redactionEngineInstance: typeof redactionEngine, activityLogger: ActivityLogger);
    /**
     * Process request body - substitute real data with aliases
     */
    processRequest(requestBody: string, _tabId?: number, url?: string): Promise<{
        success: boolean;
        modifiedBody: string;
        substitutions: number;
        needsWarning?: boolean;
        keysDetected?: number;
        keyTypes?: string[];
        originalBody?: string;
        error?: string;
    }>;
    /**
     * Get service display name
     */
    private getServiceName;
}
//# sourceMappingURL=RequestProcessor.d.ts.map