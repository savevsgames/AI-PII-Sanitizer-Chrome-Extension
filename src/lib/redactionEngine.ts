/**
 * Redaction Engine
 * Handles custom regex-based redaction rules for domain-specific PII
 */

import { CustomRedactionRule, RedactionRuleMatch, RuleTestResult } from './types';

/**
 * Options for redaction
 */
export interface RedactionOptions {
  mode?: 'auto-redact' | 'detect-only';
  ruleIds?: string[]; // Limit to specific rules
}

/**
 * Result of redacting text
 */
export interface RedactionResult {
  text: string;
  matches: RedactionRuleMatch[];
  rulesApplied: number;
}

/**
 * RedactionEngine - Applies custom regex rules to text
 */
export class RedactionEngine {
  private rules: CustomRedactionRule[];
  private compiledPatterns: Map<string, RegExp>;

  constructor(rules: CustomRedactionRule[]) {
    this.rules = rules;
    this.compiledPatterns = new Map();
    this.compilePatterns();
  }

  /**
   * Compile all rule patterns into RegExp objects
   */
  private compilePatterns(): void {
    this.compiledPatterns.clear();

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      try {
        const flags = this.buildRegexFlags(rule);
        const regex = new RegExp(rule.pattern, flags);
        this.compiledPatterns.set(rule.id, regex);
      } catch (error) {
        console.error(`[RedactionEngine] Failed to compile rule ${rule.id}:`, error);
      }
    }

    console.log(`[RedactionEngine] Compiled ${this.compiledPatterns.size} patterns`);
  }

  /**
   * Build regex flags from rule settings
   */
  private buildRegexFlags(rule: CustomRedactionRule): string {
    let flags = '';
    if (!rule.caseSensitive) flags += 'i';
    if (rule.global) flags += 'g';
    return flags;
  }

  /**
   * Apply all enabled rules to text
   */
  redact(text: string, options: RedactionOptions = {}): RedactionResult {
    const mode = options.mode || 'auto-redact';
    let modifiedText = text;
    const matches: RedactionRuleMatch[] = [];

    // Sort rules by priority (higher first)
    const sortedRules = this.getSortedRules(options.ruleIds);

    for (const rule of sortedRules) {
      const regex = this.compiledPatterns.get(rule.id);
      if (!regex) continue;

      // Find all matches
      const ruleMatches = this.findMatches(modifiedText, regex, rule);

      if (ruleMatches.length > 0) {
        matches.push(...ruleMatches);

        // Apply redaction if not in detect-only mode
        if (mode === 'auto-redact') {
          modifiedText = this.applyRedaction(modifiedText, regex, rule);
        }
      }
    }

    return {
      text: mode === 'auto-redact' ? modifiedText : text,
      matches,
      rulesApplied: matches.length > 0 ? new Set(matches.map(m => m.ruleId)).size : 0
    };
  }

  /**
   * Get sorted rules (by priority, then creation date)
   */
  private getSortedRules(ruleIds?: string[]): CustomRedactionRule[] {
    let rules = this.rules.filter(r => r.enabled);

    // Filter by specific rule IDs if provided
    if (ruleIds && ruleIds.length > 0) {
      rules = rules.filter(r => ruleIds.includes(r.id));
    }

    // Sort by priority (descending), then by createdAt (ascending)
    return rules.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * Find all matches of a rule in text
   */
  private findMatches(text: string, regex: RegExp, rule: CustomRedactionRule): RedactionRuleMatch[] {
    const matches: RedactionRuleMatch[] = [];

    // Reset regex to ensure we start from beginning
    regex.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const originalText = match[0];
      const replacement = this.buildReplacement(rule.replacement, match);

      matches.push({
        ruleId: rule.id,
        ruleName: rule.name,
        originalText,
        redactedText: replacement,
        position: match.index,
        length: originalText.length
      });

      // Prevent infinite loop for zero-width matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      // If not global, break after first match
      if (!rule.global) {
        break;
      }
    }

    return matches;
  }

  /**
   * Apply redaction to text
   */
  private applyRedaction(text: string, regex: RegExp, rule: CustomRedactionRule): string {
    // Reset regex
    regex.lastIndex = 0;

    return text.replace(regex, (match, ...args) => {
      const groups = args.slice(0, -2); // Exclude offset and string
      return this.buildReplacement(rule.replacement, [match, ...groups]);
    });
  }

  /**
   * Build replacement text with variable substitution
   * Supports $1, $2, etc. and $& for full match
   */
  private buildReplacement(template: string, match: RegExpExecArray | string[]): string {
    let replacement = template;

    // Replace $& with full match
    replacement = replacement.replace(/\$&/g, match[0]);

    // Replace $1, $2, etc. with capture groups
    for (let i = 1; i < match.length; i++) {
      const value = match[i] || '';
      replacement = replacement.replace(new RegExp(`\\$${i}`, 'g'), value);
    }

    return replacement;
  }

  /**
   * Test a rule pattern against sample text
   */
  static testRule(pattern: string, testText: string, options: { caseSensitive?: boolean; global?: boolean } = {}): RuleTestResult {
    try {
      let flags = '';
      if (!options.caseSensitive) flags += 'i';
      if (options.global) flags += 'g';

      const regex = new RegExp(pattern, flags);
      const matches: RuleTestResult['matches'] = [];

      let match: RegExpExecArray | null;
      regex.lastIndex = 0;

      while ((match = regex.exec(testText)) !== null) {
        matches.push({
          text: match[0],
          position: match.index,
          replacement: '[REDACTED]' // Default replacement for testing
        });

        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }

        if (!options.global) {
          break;
        }
      }

      return {
        matches,
        success: true
      };
    } catch (error) {
      return {
        matches: [],
        success: false,
        error: error instanceof Error ? error.message : 'Invalid regex pattern'
      };
    }
  }

  /**
   * Validate a rule pattern
   */
  static validatePattern(pattern: string): { valid: boolean; error?: string } {
    try {
      new RegExp(pattern);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid regex pattern'
      };
    }
  }

  /**
   * Detect potential conflicts between rules
   */
  static detectConflicts(rules: CustomRedactionRule[]): Array<{ rule1: string; rule2: string; reason: string }> {
    const conflicts: Array<{ rule1: string; rule2: string; reason: string }> = [];
    const enabledRules = rules.filter(r => r.enabled);

    for (let i = 0; i < enabledRules.length; i++) {
      for (let j = i + 1; j < enabledRules.length; j++) {
        const rule1 = enabledRules[i];
        const rule2 = enabledRules[j];

        // Check if patterns are identical
        if (rule1.pattern === rule2.pattern) {
          conflicts.push({
            rule1: rule1.name,
            rule2: rule2.name,
            reason: 'Identical patterns'
          });
        }

        // Check if rules have same priority (may cause unpredictable ordering)
        if (rule1.priority === rule2.priority) {
          conflicts.push({
            rule1: rule1.name,
            rule2: rule2.name,
            reason: `Same priority (${rule1.priority})`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Update rules and recompile
   */
  updateRules(rules: CustomRedactionRule[]): void {
    this.rules = rules;
    this.compilePatterns();
  }

  /**
   * Get current rules
   */
  getRules(): CustomRedactionRule[] {
    return this.rules;
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): CustomRedactionRule | undefined {
    return this.rules.find(r => r.id === ruleId);
  }
}
