/**
 * Request Processor
 * Handles request body substitution (real → alias)
 */

import { StorageManager } from '../../lib/storage';
import { AliasEngine } from '../../lib/aliasEngine';
import { APIKeyDetector } from '../../lib/apiKeyDetector';
import { redactionEngine } from '../../lib/redactionEngine';
import { ActivityLogger } from '../managers/ActivityLogger';
import { extractAllText, replaceAllText } from '../../lib/textProcessor';
import { detectService } from '../utils/ServiceDetector';
import type { AIService } from '../../lib/types';

export class RequestProcessor {
  constructor(
    private storage: StorageManager,
    private aliasEngine: AliasEngine,
    _apiKeyDetector: APIKeyDetector, // Unused - using static methods directly
    private redactionEngineInstance: typeof redactionEngine,
    private activityLogger: ActivityLogger
  ) {}

  /**
   * Process request body - substitute real data with aliases
   */
  async processRequest(
    requestBody: string,
    _tabId?: number,
    url?: string
  ): Promise<{
    success: boolean;
    modifiedBody: string;
    substitutions: number;
    needsWarning?: boolean;
    keysDetected?: number;
    keyTypes?: string[];
    originalBody?: string;
    error?: string;
  }> {
    try {
      const service = url ? detectService(url) : 'unknown';

      console.log('[RequestProcessor] 🔄 Substituting request body');

      // Handle empty or non-JSON bodies (streaming, multipart, etc.)
      if (!requestBody || requestBody.trim() === '') {
        console.log('[RequestProcessor] ⚠️ Empty request body, skipping substitution');
        return {
          success: true,
          modifiedBody: requestBody,
          substitutions: 0,
        };
      }

      // Parse request body
      let requestData;
      try {
        requestData = JSON.parse(requestBody);
      } catch (e) {
        // Not JSON - might be streaming, form data, or other format (e.g., Gemini's URL-encoded batchexecute)
        console.log('[RequestProcessor] ⚠️ Non-JSON request body, attempting plain text substitution');

        // Check if body is URL-encoded (Gemini batchexecute format)
        let bodyToSubstitute = requestBody;
        let isUrlEncoded = false;

        if (typeof requestBody === 'string' && requestBody.includes('f.req=')) {
          console.log('[RequestProcessor] [Gemini] Detected URL-encoded batchexecute format');
          try {
            // Parse URL parameters
            const params = new URLSearchParams(requestBody);
            const freqValue = params.get('f.req');

            if (freqValue) {
              // Decode only the f.req value for substitution
              bodyToSubstitute = freqValue;
              isUrlEncoded = true;
              console.log('[RequestProcessor] [Gemini] Decoded f.req value length:', bodyToSubstitute.length);
            }
          } catch (decodeError) {
            console.warn('[RequestProcessor] [Gemini] Failed to parse URL parameters, using original');
            bodyToSubstitute = requestBody;
          }
        }

        // Try plain text substitution
        const substituted = this.aliasEngine.substitute(bodyToSubstitute, 'encode');

        if (substituted.substitutions.length > 0) {
          console.log('[RequestProcessor] ✅ Plain text substituted:', substituted.substitutions.length, 'replacements');
        }

        // Re-encode if we decoded it
        let finalBody = substituted.text;
        if (isUrlEncoded) {
          try {
            // Reconstruct the form body with substituted f.req value
            const params = new URLSearchParams(requestBody);
            params.set('f.req', substituted.text);
            finalBody = params.toString();
            console.log('[RequestProcessor] [Gemini] Reconstructed body length:', finalBody.length);
          } catch (encodeError) {
            console.error('[RequestProcessor] [Gemini] Failed to reconstruct body:', encodeError);
            finalBody = substituted.text;
          }
        }

        return {
          success: true,
          modifiedBody: finalBody,
          substitutions: substituted.substitutions.length,
        };
      }

      // Extract all text content from messages/prompt
      const textContent = extractAllText(requestData);

      console.log('[RequestProcessor] 📝 Extracted text:', textContent.substring(0, 300));

      if (!textContent) {
        console.log('[RequestProcessor] ⚠️ No text extracted from request');
        return {
          success: true,
          modifiedBody: requestBody,
          substitutions: 0,
        };
      }

      // Apply substitution (real → alias)
      const profiles = this.aliasEngine.getProfiles();
      console.log('[RequestProcessor] 📋 Active profiles:', profiles.length, '-', profiles.map((p: any) => p.profileName).join(', '));

      const substituted = this.aliasEngine.substitute(textContent, 'encode');

      console.log('[RequestProcessor] ✅ Request substituted:', substituted.substitutions.length, 'replacements');
      if (substituted.substitutions.length > 0) {
        console.log('[RequestProcessor] 🔀 Changes:', substituted.substitutions);

        // Log activity for debug console
        const serviceName = this.getServiceName(service);

        this.activityLogger.logActivity({
          type: 'substitution',
          service: service,
          details: {
            url: serviceName,
            profilesUsed: substituted.profilesMatched?.map(p => p.profileName) || [],
            piiTypesFound: substituted.profilesMatched?.flatMap(p => p.piiTypes) || [],
            substitutionCount: substituted.substitutions.length,
          },
          message: `${serviceName}: ${substituted.substitutions.length} items replaced`,
        });
      }

      // Reconstruct request body with substituted text
      let modifiedText = substituted.text;

      // ========== CUSTOM REDACTION RULES ==========
      const config = await this.storage.loadConfig();

      if (config?.customRules?.enabled && config.customRules.rules.length > 0) {
        console.log('[RequestProcessor] 🎯 Custom rules enabled, applying redaction rules...');
        console.log('[RequestProcessor] 📝 Text before custom rules:', modifiedText.substring(0, 200));

        // Apply custom redaction rules
        const rulesResult = this.redactionEngineInstance.applyRules(modifiedText, config.customRules.rules);

        console.log(`[RequestProcessor] 🎯 Rules result: ${rulesResult.matches.length} matches, ${rulesResult.rulesApplied.length} rules applied`);
        if (rulesResult.matches.length > 0) {
          console.log('[RequestProcessor] 🔍 Matches:', rulesResult.matches);
          console.log('[RequestProcessor] 📝 Text after custom rules:', rulesResult.modifiedText.substring(0, 200));
          modifiedText = rulesResult.modifiedText;

          // Update match counts for rules
          for (const ruleId of rulesResult.rulesApplied) {
            await this.storage.incrementRuleMatchCount(ruleId);
          }
        } else {
          console.log('[RequestProcessor] ⚠️ No matches found for custom rules');
        }
      }

      // ========== API KEY DETECTION ==========

      // Service name mapping for activity log
      const serviceName = this.getServiceName(service);

      if (config?.apiKeyVault?.enabled) {
        console.log('[RequestProcessor] 🔐 API Key Vault enabled, scanning for keys...');

        // Get user's stored keys
        const storedKeys = config.apiKeyVault.keys
          .filter((k) => k.enabled)
          .map((k) => k.keyValue);

        // Determine which patterns to check based on tier
        const isFree = config.account?.tier === 'free';
        const includeGeneric = !isFree; // PRO only

        // Convert custom patterns from strings to RegExp
        const customPatterns = (config.apiKeyVault.customPatterns || []).map(
          (pattern: string) => new RegExp(pattern, 'g')
        );

        // Detect API keys
        const detectedKeys = APIKeyDetector.detect(modifiedText, {
          includeGeneric,
          customPatterns,
          storedKeys,
        });

        // Filter detections based on FREE tier restrictions
        const allowedDetections = isFree
          ? detectedKeys.filter((k: any) => k.format === 'openai')
          : detectedKeys;

        if (allowedDetections.length > 0) {
          console.log(`[RequestProcessor] 🔐 Detected ${allowedDetections.length} API keys (mode: ${config.apiKeyVault.mode})`);

          // Handle based on mode
          if (config.apiKeyVault.mode === 'auto-redact') {
            // Auto-redact keys
            modifiedText = APIKeyDetector.redact(modifiedText, allowedDetections, 'placeholder');

            // Update stats for each detected key
            for (const detected of allowedDetections) {
              const stored = config.apiKeyVault.keys.find((k) => k.keyValue === detected.value);
              if (stored) {
                await this.storage.incrementAPIKeyProtection(stored.id);
              }
            }

            // Log activity
            this.activityLogger.logActivity({
              type: 'substitution',
              service: service,
              details: {
                url: serviceName,
                apiKeysProtected: allowedDetections.length,
                keyTypes: allowedDetections.map((k: any) => k.format),
                substitutionCount: allowedDetections.length,
              },
              message: `API Keys: ${allowedDetections.length} keys redacted`,
            });

            console.log('[RequestProcessor] ✅ API keys auto-redacted:', allowedDetections.map((k: any) => k.format));
          } else if (config.apiKeyVault.mode === 'warn-first') {
            // Return to inject.js with warning - let user decide
            console.log('[RequestProcessor] ⚠️  Warn-first mode: Returning warning to user');
            return {
              success: true,
              needsWarning: true,
              keysDetected: allowedDetections.length,
              keyTypes: allowedDetections.map((k) => k.format),
              originalBody: requestBody, // Send original back for user choice
              modifiedBody: requestBody,
              substitutions: substituted.substitutions.length,
            };
          } else if (config.apiKeyVault.mode === 'log-only') {
            // Just log, don't redact
            console.log('[RequestProcessor] 📋 Log-only mode: Keys detected but not redacted');
            this.activityLogger.logActivity({
              type: 'warning',
              service: service,
              details: {
                url: serviceName,
                apiKeysFound: allowedDetections.length,
                keyTypes: allowedDetections.map((k: any) => k.format),
                substitutionCount: 0,
              },
              message: `Warning: ${allowedDetections.length} API keys found but not redacted (log-only mode)`,
            });
          }
        }
      }

      // Reconstruct request body with modified text (PII + API keys substituted)
      const modifiedRequestData = replaceAllText(requestData, modifiedText);

      return {
        success: true,
        modifiedBody: JSON.stringify(modifiedRequestData),
        substitutions: substituted.substitutions.length,
      };
    } catch (error: any) {
      console.error('[RequestProcessor] ❌ Request substitution error:', error);
      return {
        success: false,
        modifiedBody: requestBody,
        substitutions: 0,
        error: error.message,
      };
    }
  }

  /**
   * Get service display name
   */
  private getServiceName(service: AIService): string {
    switch (service) {
      case 'chatgpt': return 'ChatGPT';
      case 'claude': return 'Claude';
      case 'gemini': return 'Gemini';
      case 'perplexity': return 'Perplexity';
      case 'copilot': return 'Copilot';
      default: return 'Unknown';
    }
  }
}
