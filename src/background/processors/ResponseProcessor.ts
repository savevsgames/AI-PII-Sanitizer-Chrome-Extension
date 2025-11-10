/**
 * Response Processor
 * Handles response text substitution (alias → real)
 */

import { StorageManager } from '../../lib/storage';
import { AliasEngine } from '../../lib/aliasEngine';

export class ResponseProcessor {
  constructor(
    private storage: StorageManager,
    private aliasEngine: AliasEngine
  ) {}

  /**
   * Process response text - substitute aliases back to real data
   */
  async processResponse(
    responseText: string,
    _url?: string
  ): Promise<{
    success: boolean;
    modifiedText: string;
    substitutions: number;
    error?: string;
  }> {
    try {
      if (!responseText) {
        return {
          success: true,
          modifiedText: responseText,
          substitutions: 0,
        };
      }

      // Check if response decoding is enabled
      const config = await this.storage.loadConfig();

      if (!config?.settings?.decodeResponses) {
        // Decoding disabled - return original text with aliases
        console.log('[ResponseProcessor] ℹ️ Response decoding disabled - keeping aliases in response');
        return {
          success: true,
          modifiedText: responseText,
          substitutions: 0,
        };
      }

      // Apply reverse substitution (alias → real)
      const decoded = this.aliasEngine.substitute(responseText, 'decode');

      if (decoded.substitutions.length > 0) {
        console.log('[ResponseProcessor] ✅ Decoded:', decoded.substitutions.length, 'replacements');
        console.log('[ResponseProcessor] Replacements made:', decoded.substitutions);
      }

      return {
        success: true,
        modifiedText: decoded.text,
        substitutions: decoded.substitutions.length,
      };
    } catch (error: any) {
      console.error('[ResponseProcessor] ❌ Response substitution error:', error);
      return {
        success: false,
        modifiedText: responseText,
        substitutions: 0,
        error: error.message,
      };
    }
  }
}
