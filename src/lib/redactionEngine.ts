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
  rulesApplied: string[]; // Rule IDs that matched
}

/**
 * Redaction Engine Class
 * Handles pattern matching and text replacement based on custom rules
 */
export class RedactionEngine {
  private compiledRules: Map<string, RegExp> = new Map();

  /**
   * Compile rules into regex patterns
   */
  compileRules(rules: CustomRule[]): void {
    this.compiledRules.clear();

    // Sort rules by priority (highest first)
    const sortedRules = rules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      try {
        // Compile pattern with global flag for multiple matches
        const regex = new RegExp(rule.pattern, 'g');
        this.compiledRules.set(rule.id, regex);
      } catch (error) {
        console.error(`[Redaction Engine] Failed to compile rule "${rule.name}":`, error);
      }
    }

    console.log(`[Redaction Engine] Compiled ${this.compiledRules.size} rules`);
  }

  /**
   * Apply redaction rules to text
   */
  applyRules(text: string, rules: CustomRule[]): RedactionResult {
    if (!text || rules.length === 0) {
      return {
        modifiedText: text,
        matches: [],
        rulesApplied: []
      };
    }

    // Recompile if needed
    if (this.compiledRules.size === 0) {
      this.compileRules(rules);
    }

    const matches: RedactionMatch[] = [];
    const rulesApplied: Set<string> = new Set();
    let modifiedText = text;

    // Sort rules by priority (highest first)
    const sortedRules = rules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    // Apply each rule sequentially
    for (const rule of sortedRules) {
      const regex = this.compiledRules.get(rule.id);
      if (!regex) continue;

      // Reset regex lastIndex
      regex.lastIndex = 0;

      let match: RegExpExecArray | null;
      const ruleMatches: RedactionMatch[] = [];

      // Find all matches for this rule
      while ((match = regex.exec(modifiedText)) !== null) {
        const originalMatch = match[0];
        const replacement = this.processReplacement(rule.replacement, match);

        ruleMatches.push({
          ruleId: rule.id,
          ruleName: rule.name,
          match: originalMatch,
          replacement,
          startIndex: match.index,
          endIndex: match.index + originalMatch.length
        });

        rulesApplied.add(rule.id);
      }

      // Apply replacements for this rule (in reverse order to preserve indices)
      for (let i = ruleMatches.length - 1; i >= 0; i--) {
        const ruleMatch = ruleMatches[i];
        modifiedText =
          modifiedText.slice(0, ruleMatch.startIndex) +
          ruleMatch.replacement +
          modifiedText.slice(ruleMatch.endIndex);
      }

      matches.push(...ruleMatches);
    }

    return {
      modifiedText,
      matches,
      rulesApplied: Array.from(rulesApplied)
    };
  }

  /**
   * Process replacement string (supports $1, $2, etc. for capture groups)
   */
  private processReplacement(replacement: string, match: RegExpExecArray): string {
    let result = replacement;

    // Replace $1, $2, etc. with captured groups
    for (let i = 1; i < match.length; i++) {
      const captureGroup = match[i] || '';
      result = result.replace(new RegExp(`\\$${i}`, 'g'), captureGroup);
    }

    // Replace $& with full match
    result = result.replace(/\$&/g, match[0]);

    return result;
  }

  /**
   * Validate a regex pattern
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
   * Test a rule against sample text
   */
  static testRule(
    rule: CustomRule,
    testText: string
  ): { matches: string[]; replacements: string[]; error?: string } {
    try {
      const regex = new RegExp(rule.pattern, 'g');
      const matches: string[] = [];
      const replacements: string[] = [];

      let match: RegExpExecArray | null;
      while ((match = regex.exec(testText)) !== null) {
        matches.push(match[0]);

        // Process replacement
        let replacement = rule.replacement;
        for (let i = 1; i < match.length; i++) {
          replacement = replacement.replace(new RegExp(`\\$${i}`, 'g'), match[i] || '');
        }
        replacement = replacement.replace(/\$&/g, match[0]);
        replacements.push(replacement);
      }

      return { matches, replacements };
    } catch (error) {
      return {
        matches: [],
        replacements: [],
        error: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }

  /**
   * Detect potential conflicts between rules
   */
  static detectConflicts(rules: CustomRule[]): { rule1: string; rule2: string; reason: string }[] {
    const conflicts: { rule1: string; rule2: string; reason: string }[] = [];

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];

        // Check if patterns might overlap
        if (this.patternsOverlap(rule1.pattern, rule2.pattern)) {
          conflicts.push({
            rule1: rule1.name,
            rule2: rule2.name,
            reason: 'Patterns may overlap - consider adjusting priorities'
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if two patterns might overlap (basic heuristic)
   */
  private static patternsOverlap(pattern1: string, pattern2: string): boolean {
    // Very basic check - could be enhanced
    // For now, just check if patterns are identical
    return pattern1 === pattern2;
  }
}

// Export singleton instance
export const redactionEngine = new RedactionEngine();
