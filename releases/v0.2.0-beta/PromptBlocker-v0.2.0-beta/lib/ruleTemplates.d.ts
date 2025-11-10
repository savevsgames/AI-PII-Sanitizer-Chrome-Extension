/**
 * Rule Templates
 * Preset redaction rules for common patterns
 */
import { CustomRule } from './types';
export interface RuleTemplate {
    name: string;
    description: string;
    category: 'pii' | 'financial' | 'medical' | 'custom';
    pattern: string;
    replacement: string;
    priority: number;
    testCases: {
        input: string;
        expected: string;
    }[];
}
export declare const RULE_TEMPLATES: RuleTemplate[];
/**
 * Convert a template to a CustomRule
 */
export declare function templateToRule(template: RuleTemplate): Omit<CustomRule, 'id' | 'createdAt'>;
//# sourceMappingURL=ruleTemplates.d.ts.map