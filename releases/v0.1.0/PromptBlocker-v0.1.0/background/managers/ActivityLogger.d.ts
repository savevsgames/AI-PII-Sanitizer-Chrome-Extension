/**
 * Activity Logger
 * Logs activity directly to encrypted storage
 * Service worker can now encrypt with Firebase auth/web-extension support
 */
import type { AIService } from '../../lib/types';
import { StorageManager } from '../../lib/storage';
/**
 * Activity log entry (without id/timestamp - added when saving)
 */
export interface ActivityLogEntryInput {
    type: 'interception' | 'substitution' | 'warning' | 'error';
    service: AIService;
    details: {
        url: string;
        profilesUsed?: string[];
        piiTypesFound?: string[];
        substitutionCount: number;
        error?: string;
        apiKeysProtected?: number;
        apiKeysFound?: number;
        keyTypes?: string[];
    };
    message: string;
}
export declare class ActivityLogger {
    private storage;
    constructor(storage: StorageManager);
    /**
     * Log activity directly to encrypted storage
     */
    logActivity(entry: ActivityLogEntryInput): Promise<void>;
}
//# sourceMappingURL=ActivityLogger.d.ts.map