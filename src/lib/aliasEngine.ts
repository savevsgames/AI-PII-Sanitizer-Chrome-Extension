/**
 * Alias Engine - Core substitution logic
 * Handles bidirectional text substitution with case preservation
 * Version 2.0 - Profile-based multi-PII matching
 * Version 2.1 - Added alias variations support
 */

import { AliasProfile, SubstitutionResult, SubstitutionOptions, PIIType } from './types';
import { StorageManager } from './storage';

interface PIIMapping {
  real: string;
  alias: string;
  profileId: string;
  profileName: string;
  piiType: PIIType;
}

export class AliasEngine {
  private static instance: AliasEngine;
  private profiles: AliasProfile[] = [];
  private realToAliasMap: Map<string, PIIMapping> = new Map();
  private aliasToRealMap: Map<string, PIIMapping> = new Map();

  private constructor() {}

  public static async getInstance(): Promise<AliasEngine> {
    if (!AliasEngine.instance) {
      AliasEngine.instance = new AliasEngine();
      await AliasEngine.instance.loadProfiles();
    }
    return AliasEngine.instance;
  }

  /**
   * Load profiles from storage and build lookup maps
   */
  async loadProfiles(): Promise<void> {
    const storage = StorageManager.getInstance();
    this.profiles = await storage.loadProfiles();
    this.buildLookupMaps();
    console.log('[AliasEngine] Loaded', this.profiles.length, 'profiles');
  }

  /**
   * Build efficient lookup maps from all PII fields in profiles
   * Includes variations if enabled
   */
  private buildLookupMaps(): void {
    this.realToAliasMap.clear();
    this.aliasToRealMap.clear();

    const piiFields: PIIType[] = ['name', 'email', 'phone', 'cellPhone', 'address', 'company'];

    for (const profile of this.profiles) {
      if (!profile.enabled) continue;

      const useVariations = profile.settings?.enableVariations ?? true; // Default to enabled

      // Build mappings for each PII field
      for (const piiType of piiFields) {
        const realValue = profile.real[piiType] as string | undefined;
        const aliasValue = profile.alias[piiType] as string | undefined;

        if (realValue && aliasValue && typeof realValue === 'string' && typeof aliasValue === 'string') {
          const mapping: PIIMapping = {
            real: realValue,
            alias: aliasValue,
            profileId: profile.id,
            profileName: profile.profileName,
            piiType,
          };

          // Add primary values
          this.realToAliasMap.set(realValue.toLowerCase(), mapping);
          this.aliasToRealMap.set(aliasValue.toLowerCase(), mapping);

          // Add variations if enabled
          if (useVariations && profile.variations) {
            // Get disabled variations list
            const disabledRealVariations = profile.disabledVariations?.real[piiType] || [];
            const disabledAliasVariations = profile.disabledVariations?.alias[piiType] || [];

            // Add real variations (auto-generated) - skip disabled ones
            const realVariations = profile.variations.real[piiType] || [];
            for (const variation of realVariations) {
              if (variation &&
                  variation.toLowerCase() !== realValue.toLowerCase() &&
                  !disabledRealVariations.includes(variation)) {
                this.realToAliasMap.set(variation.toLowerCase(), mapping);
              }
            }

            // Add alias variations (auto-generated) - skip disabled ones
            const aliasVariations = profile.variations.alias[piiType] || [];
            for (const variation of aliasVariations) {
              if (variation &&
                  variation.toLowerCase() !== aliasValue.toLowerCase() &&
                  !disabledAliasVariations.includes(variation)) {
                this.aliasToRealMap.set(variation.toLowerCase(), mapping);
              }
            }
          }

          // Add custom variations (only if enabled flag is true)
          if (useVariations && profile.customVariations) {
            // Add custom real variations (only if enabled)
            const customRealVariations = profile.customVariations.real[piiType] || [];
            for (const varObj of customRealVariations) {
              if (varObj && varObj.enabled &&
                  varObj.value &&
                  varObj.value.toLowerCase() !== realValue.toLowerCase()) {
                this.realToAliasMap.set(varObj.value.toLowerCase(), mapping);
              }
            }

            // Add custom alias variations (only if enabled)
            const customAliasVariations = profile.customVariations.alias[piiType] || [];
            for (const varObj of customAliasVariations) {
              if (varObj && varObj.enabled &&
                  varObj.value &&
                  varObj.value.toLowerCase() !== aliasValue.toLowerCase()) {
                this.aliasToRealMap.set(varObj.value.toLowerCase(), mapping);
              }
            }
          }
        }
      }

      // Handle custom fields
      if (profile.real.custom && profile.alias.custom) {
        for (const [key, realValue] of Object.entries(profile.real.custom)) {
          const aliasValue = profile.alias.custom[key];
          if (realValue && aliasValue) {
            const mapping: PIIMapping = {
              real: realValue,
              alias: aliasValue,
              profileId: profile.id,
              profileName: profile.profileName,
              piiType: 'custom',
            };

            this.realToAliasMap.set(realValue.toLowerCase(), mapping);
            this.aliasToRealMap.set(aliasValue.toLowerCase(), mapping);
          }
        }
      }
    }

    console.log('[AliasEngine] Built maps:', this.realToAliasMap.size, 'real→alias mappings (with variations)');
  }

  /**
   * Main substitution function
   * @param text - Text to process
   * @param direction - 'encode' (real→alias) or 'decode' (alias→real)
   * @param options - Optional substitution options
   */
  substitute(
    text: string,
    direction: 'encode' | 'decode',
    options?: SubstitutionOptions
  ): SubstitutionResult {
    const map = direction === 'encode' ? this.realToAliasMap : this.aliasToRealMap;
    const substitutions: Array<{
      from: string;
      to: string;
      position: number;
      profileId?: string;
      piiType?: string;
    }> = [];

    // Track which profiles were matched
    const profileMatches = new Map<string, {
      profileId: string;
      profileName: string;
      piiTypes: Set<string>;
      matches: Array<{ type: string; value: string; position: number }>;
    }>();

    let result = text;

    // Sort keys by length (longest first) to handle overlapping matches
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      const mapping = map.get(key);
      if (!mapping) continue;

      // Filter by profile IDs if specified
      if (options?.profileIds && !options.profileIds.includes(mapping.profileId)) {
        continue;
      }

      const replacement = direction === 'encode' ? mapping.alias : mapping.real;

      // Create regex with word boundaries
      const regex = new RegExp(`\\b${this.escapeRegex(key)}\\b`, 'gi');
      let match;

      // Track all matches before replacing
      const matches: Array<{ match: string; index: number }> = [];
      while ((match = regex.exec(result)) !== null) {
        matches.push({ match: match[0], index: match.index });
      }

      // Replace all matches with case preservation (reverse order to preserve indices)
      for (let i = matches.length - 1; i >= 0; i--) {
        const m = matches[i];
        const preserved = this.preserveCase(m.match, replacement);

        // Only replace if mode is 'auto', otherwise just detect
        if (options?.mode !== 'detect-only') {
          result = result.substring(0, m.index) + preserved + result.substring(m.index + m.match.length);
        }

        substitutions.push({
          from: m.match,
          to: preserved,
          position: m.index,
          profileId: mapping.profileId,
          piiType: mapping.piiType,
        });

        // Track profile usage
        if (!profileMatches.has(mapping.profileId)) {
          profileMatches.set(mapping.profileId, {
            profileId: mapping.profileId,
            profileName: mapping.profileName,
            piiTypes: new Set(),
            matches: [],
          });
        }

        const profileMatch = profileMatches.get(mapping.profileId)!;
        profileMatch.piiTypes.add(mapping.piiType);
        profileMatch.matches.push({
          type: mapping.piiType,
          value: m.match,
          position: m.index,
        });
      }
    }

    // Handle possessives (e.g., "Joe's" → "John's")
    if (options?.mode !== 'detect-only') {
      result = this.handlePossessives(result, map, direction);
    }

    return {
      text: result,
      substitutions,
      confidence: this.calculateConfidence(substitutions.length),
      profilesMatched: Array.from(profileMatches.values()).map(pm => ({
        profileId: pm.profileId,
        profileName: pm.profileName,
        piiTypes: Array.from(pm.piiTypes),
        matches: pm.matches,
      })),
    };
  }

  /**
   * Find PII in text without substituting
   * Used for highlighting in content script
   */
  findPII(text: string): Array<{
    text: string;
    start: number;
    end: number;
    alias: string;
    profileId: string;
    profileName: string;
    piiType: string;
  }> {
    const matches: Array<{
      text: string;
      start: number;
      end: number;
      alias: string;
      profileId: string;
      profileName: string;
      piiType: string;
    }> = [];

    for (const [realValue, mapping] of this.realToAliasMap) {
      const regex = new RegExp(`\\b${this.escapeRegex(realValue)}\\b`, 'gi');
      let match;

      while ((match = regex.exec(text)) !== null) {
        matches.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          alias: mapping.alias,
          profileId: mapping.profileId,
          profileName: mapping.profileName,
          piiType: mapping.piiType,
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
  private handlePossessives(
    text: string,
    map: Map<string, PIIMapping>,
    direction: 'encode' | 'decode'
  ): string {
    let result = text;

    for (const [key, mapping] of map) {
      const value = direction === 'encode' ? mapping.alias : mapping.real;
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
   * Update profile usage statistics
   */
  async updateProfileUsage(
    profileId: string,
    service: 'chatgpt' | 'claude' | 'gemini',
    piiType: PIIType
  ): Promise<void> {
    const storage = StorageManager.getInstance();
    await storage.incrementProfileUsage(profileId, service, piiType);
    console.log('[AliasEngine] Updated usage for profile:', profileId, 'service:', service, 'type:', piiType);
  }

  /**
   * Get all enabled profiles
   */
  getProfiles(): AliasProfile[] {
    return this.profiles.filter(p => p.enabled);
  }

  /**
   * Get a single profile by ID
   */
  getProfile(id: string): AliasProfile | undefined {
    return this.profiles.find(p => p.id === id);
  }

  /**
   * Reload profiles from storage
   */
  async reload(): Promise<void> {
    await this.loadProfiles();
  }

  /**
   * Check if engine has any profiles loaded
   */
  hasProfiles(): boolean {
    return this.profiles.filter(p => p.enabled).length > 0;
  }
}
