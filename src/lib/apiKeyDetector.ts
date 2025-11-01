/**
 * API Key Detection Engine
 * Detects common API key formats in text
 */

import { APIKeyFormat } from './types';

export interface DetectedKey {
  value: string; // The actual key found
  format: APIKeyFormat;
  startIndex: number;
  endIndex: number;
  lineNumber?: number;
  context?: string; // Surrounding text for preview
}

export class APIKeyDetector {
  // Known patterns (always active)
  private static patterns: Record<APIKeyFormat, RegExp> = {
    openai: /sk-(proj-)?[A-Za-z0-9]{48,}/g,
    anthropic: /sk-ant-[A-Za-z0-9-]{95}/g,
    google: /AIza[A-Za-z0-9_-]{35}/g,
    aws: /(AKIA|ASIA)[A-Z0-9]{16}/g,
    github: /gh[ps]_[A-Za-z0-9]{36}/g,
    stripe: /(sk|pk)_(live|test)_[A-Za-z0-9]{24,}/g,
    generic: /\b[A-Fa-f0-9]{32,}\b|\b[A-Za-z0-9+/]{40,}={0,2}\b/g, // Hex or base64
    custom: /.*/, // Placeholder
  };

  /**
   * Scan text for API keys
   */
  static detect(
    text: string,
    options: {
      includeGeneric?: boolean; // Include generic hex/base64 (noisy)
      customPatterns?: RegExp[]; // User-defined patterns
      storedKeys?: string[]; // User's vault keys (exact match)
    } = {}
  ): DetectedKey[] {
    const detected: DetectedKey[] = [];

    // Check known patterns
    for (const [format, pattern] of Object.entries(this.patterns)) {
      if (format === 'generic' && !options.includeGeneric) continue;
      if (format === 'custom') continue;

      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        detected.push({
          value: match[0],
          format: format as APIKeyFormat,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          context: this.getContext(text, match.index, match[0].length),
        });
      }
    }

    // Check custom patterns
    if (options.customPatterns) {
      for (const pattern of options.customPatterns) {
        const regex = new RegExp(pattern, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
          detected.push({
            value: match[0],
            format: 'custom',
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            context: this.getContext(text, match.index, match[0].length),
          });
        }
      }
    }

    // Check exact matches from vault
    if (options.storedKeys) {
      for (const key of options.storedKeys) {
        const index = text.indexOf(key);
        if (index !== -1) {
          detected.push({
            value: key,
            format: this.detectFormat(key),
            startIndex: index,
            endIndex: index + key.length,
            context: this.getContext(text, index, key.length),
          });
        }
      }
    }

    // Remove duplicates (same position)
    return this.deduplicateKeys(detected);
  }

  /**
   * Redact detected keys
   */
  static redact(
    text: string,
    detectedKeys: DetectedKey[],
    mode: 'full' | 'partial' | 'placeholder' = 'full'
  ): string {
    // Sort by startIndex descending (redact from end to avoid offset issues)
    const sorted = [...detectedKeys].sort((a, b) => b.startIndex - a.startIndex);

    let result = text;
    for (const key of sorted) {
      let replacement: string;

      switch (mode) {
        case 'full':
          replacement = '[REDACTED_API_KEY]';
          break;
        case 'partial': {
          // Show first 4 and last 4 chars
          const visible = 4;
          const start = key.value.substring(0, visible);
          const end = key.value.substring(key.value.length - visible);
          replacement = `${start}${'•'.repeat(Math.max(0, key.value.length - visible * 2))}${end}`;
          break;
        }
        case 'placeholder':
          replacement = `[${key.format.toUpperCase()}_KEY]`;
          break;
      }

      result = result.substring(0, key.startIndex) + replacement + result.substring(key.endIndex);
    }

    return result;
  }

  /**
   * Detect format from key value
   */
  static detectFormat(key: string): APIKeyFormat {
    for (const [format, pattern] of Object.entries(this.patterns)) {
      if (format === 'custom') continue;
      const regex = new RegExp(pattern.source);
      if (regex.test(key)) {
        return format as APIKeyFormat;
      }
    }
    return 'generic';
  }

  /**
   * Get surrounding context for preview
   */
  private static getContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + length + 30);
    return text.substring(start, end);
  }

  /**
   * Remove duplicate detections (same key at same position)
   */
  private static deduplicateKeys(keys: DetectedKey[]): DetectedKey[] {
    const seen = new Set<string>();
    return keys.filter((key) => {
      const id = `${key.startIndex}-${key.endIndex}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }
}
