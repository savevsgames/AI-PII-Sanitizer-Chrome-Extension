/**
 * Shared types for content observers
 */
export interface AliasMapping {
    real: string;
    alias: string;
}
export interface ObserverConfig {
    debounceMs: number;
    maxMutationsPerBatch: number;
    enabled: boolean;
}
export interface TextReplacementResult {
    replacements: number;
    processingTimeMs: number;
}
export interface Observer {
    start(): void;
    stop(): void;
    isRunning(): boolean;
    updateAliases(aliases: AliasMapping[]): void;
}
//# sourceMappingURL=types.d.ts.map