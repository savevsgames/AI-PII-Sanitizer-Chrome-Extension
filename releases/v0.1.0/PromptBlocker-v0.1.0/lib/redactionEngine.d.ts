/**
 * Redaction Engine
 * Applies custom redaction rules to text based on user-defined patterns
 */
import { CustomRule } from './types';
export interface RedactionMatch {
    ruleId: string;
    ruleName: string;
    match: string;
    replacement: string;
    startIndex: number;
    endIndex: number;
}
export interface RedactionResult {
    modifiedText: string;
    matches: RedactionMatch[];
    rulesApplied: string[];
}
/**
 * Redaction Engine Class
 * Handles pattern matching and text replacement based on custom rules
 */
export declare class RedactionEngine {
    private compiledRules;
    /**
     * Compile rules into regex patterns
     */
    compileRules(rules: CustomRule[]): void;
    /**
     * Apply redaction rules to text
     */
    applyRules(text: string, rules: CustomRule[]): RedactionResult;
    /**
     * Process replacement string (supports $1, $2, etc. for capture groups)
     */
    private processReplacement;
    /**
     * Validate a regex pattern
     */
    static validatePattern(pattern: string): {
        valid: boolean;
        error?: string;
    };
    /**
     * Test a rule against sample text
     */
    static testRule(rule: CustomRule, testText: string): {
        matches: string[];
        replacements: string[];
        error?: string;
    };
    /**
     * Detect potential conflicts between rules
     */
    static detectConflicts(rules: CustomRule[]): {
        rule1: string;
        rule2: string;
        reason: string;
    }[];
    /**
     * Check if two patterns might overlap (basic heuristic)
     */
    private static patternsOverlap;
}
export declare const redactionEngine: RedactionEngine;
//# sourceMappingURL=redactionEngine.d.ts.map