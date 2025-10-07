/**
 * Alias Engine - Core substitution logic
 * Handles bidirectional text substitution with case preservation
 */

import { AliasEntry, SubstitutionResult } from './types';
import { StorageManager } from './storage';

export class AliasEngine {
  private static instance: AliasEngine;
  private aliases: AliasEntry[] = [];
  private realToAliasMap: Map<string, string> = new Map();
  private aliasToRealMap: Map<string, string> = new Map();

  private constructor() {}

  public static async getInstance(): Promise<AliasEngine> {
    if (!AliasEngine.instance) {
      AliasEngine.instance = new AliasEngine();
      await AliasEngine.instance.loadAliases();
    }
    return AliasEngine.instance;
  }

  /**
   * Load aliases from storage and build lookup maps
   */
  async loadAliases(): Promise<void> {
    const storage = StorageManager.getInstance();
    this.aliases = await storage.loadAliases();
    this.buildLookupMaps();
  }

  /**
   * Build efficient lookup maps from aliases
   */
  private buildLookupMaps(): void {
    this.realToAliasMap.clear();
    this.aliasToRealMap.clear();

    for (const alias of this.aliases) {
      if (alias.enabled) {
        this.realToAliasMap.set(alias.realValue.toLowerCase(), alias.aliasValue);
        this.aliasToRealMap.set(alias.aliasValue.toLowerCase(), alias.realValue);
      }
    }
  }

  /**
   * Main substitution function
   * @param text - Text to process
   * @param direction - 'encode' (real→alias) or 'decode' (alias→real)
   */
  substitute(text: string, direction: 'encode' | 'decode'): SubstitutionResult {
    const map = direction === 'encode' ? this.realToAliasMap : this.aliasToRealMap;
    const substitutions: Array<{ from: string; to: string; position: number }> = [];

    let result = text;

    // Sort keys by length (longest first) to handle overlapping matches
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      const replacement = map.get(key);
      if (!replacement) continue;

      // Create regex with word boundaries
      const regex = new RegExp(`\\b${this.escapeRegex(key)}\\b`, 'gi');
      let match;

      // Track all matches before replacing
      const matches: Array<{ match: string; index: number }> = [];
      while ((match = regex.exec(result)) !== null) {
        matches.push({ match: match[0], index: match.index });
      }

      // Replace all matches with case preservation
      for (const m of matches) {
        const preserved = this.preserveCase(m.match, replacement);
        result = result.substring(0, m.index) + preserved + result.substring(m.index + m.match.length);

        substitutions.push({
          from: m.match,
          to: preserved,
          position: m.index,
        });
      }
    }

    // Handle possessives (e.g., "Joe's" → "John's")
    result = this.handlePossessives(result, map);

    return {
      text: result,
      substitutions,
      confidence: this.calculateConfidence(substitutions.length),
    };
  }

  /**
   * Find PII in text without substituting
   * Used for highlighting in content script
   */
  findPII(text: string): Array<{ text: string; start: number; end: number; alias: string }> {
    const matches: Array<{ text: string; start: number; end: number; alias: string }> = [];

    for (const [realValue, aliasValue] of this.realToAliasMap) {
      const regex = new RegExp(`\\b${this.escapeRegex(realValue)}\\b`, 'gi');
      let match;

      while ((match = regex.exec(text)) !== null) {
        matches.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          alias: aliasValue,
        });
      }
    }

    return matches;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Preserve case pattern from original to replacement
   * Examples:
   *   "JOE SMITH" → "JOHN DOE"
   *   "Joe Smith" → "John Doe"
   *   "joe smith" → "john doe"
   */
  private preserveCase(original: string, replacement: string): string {
    // All uppercase
    if (original === original.toUpperCase()) {
      return replacement.toUpperCase();
    }

    // All lowercase
    if (original === original.toLowerCase()) {
      return replacement.toLowerCase();
    }

    // Title case or mixed case
    const originalWords = original.split(' ');
    const replacementWords = replacement.split(' ');

    return replacementWords
      .map((word, i) => {
        if (i >= originalWords.length) return word;

        const originalWord = originalWords[i];
        const firstChar = originalWord[0];

        if (firstChar === firstChar.toUpperCase()) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word.toLowerCase();
      })
      .join(' ');
  }

  /**
   * Handle possessive forms: "Joe's car" → "John's car"
   */
  private handlePossessives(text: string, map: Map<string, string>): string {
    let result = text;

    for (const [key, value] of map) {
      const possessivePattern = new RegExp(`\\b${this.escapeRegex(key)}'s\\b`, 'gi');
      result = result.replace(possessivePattern, (match) => {
        const preserved = this.preserveCase(match.replace(/'s$/i, ''), value);
        return `${preserved}'s`;
      });
    }

    return result;
  }

  /**
   * Calculate confidence score based on substitutions
   */
  private calculateConfidence(substitutionCount: number): number {
    // Simple confidence calculation
    // In production, this would be more sophisticated
    return substitutionCount > 0 ? 0.9 : 1.0;
  }

  /**
   * Update alias usage statistics
   */
  async updateAliasUsage(aliasId: string): Promise<void> {
    const storage = StorageManager.getInstance();
    const alias = this.aliases.find(a => a.id === aliasId);

    if (alias) {
      alias.metadata.usageCount++;
      alias.metadata.lastUsed = Date.now();
      await storage.updateAlias(aliasId, alias);
    }
  }

  /**
   * Get all enabled aliases
   */
  getAliases(): AliasEntry[] {
    return this.aliases.filter(a => a.enabled);
  }

  /**
   * Reload aliases from storage
   */
  async reload(): Promise<void> {
    await this.loadAliases();
  }
}
