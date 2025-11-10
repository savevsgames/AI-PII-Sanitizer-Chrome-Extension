/**
 * Response Processor
 * Handles response text substitution (alias → real)
 */
import { StorageManager } from '../../lib/storage';
import { AliasEngine } from '../../lib/aliasEngine';
export declare class ResponseProcessor {
    private storage;
    private aliasEngine;
    constructor(storage: StorageManager, aliasEngine: AliasEngine);
    /**
     * Process response text - substitute aliases back to real data
     */
    processResponse(responseText: string, _url?: string): Promise<{
        success: boolean;
        modifiedText: string;
        substitutions: number;
        error?: string;
    }>;
}
//# sourceMappingURL=ResponseProcessor.d.ts.map