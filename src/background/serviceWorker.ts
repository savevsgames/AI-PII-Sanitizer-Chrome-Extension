/**
 * Service Worker (Background Script)
 * Handles request/response interception and message passing
 */

import { AliasEngine } from '../lib/aliasEngine';
import { StorageManager } from '../lib/storage';
import { Message } from '../lib/types';
import { APIKeyDetector } from '../lib/apiKeyDetector';
import { extractAllText, replaceAllText } from '../lib/textProcessor';
import { redactionEngine } from '../lib/redactionEngine';


// ========== BADGE MANAGEMENT ==========

/**
 * Protection state for badge display
 */
type ProtectionState = 'protected' | 'unprotected' | 'disabled';

/**
 * AI service URL patterns for protection detection
 */
const AI_SERVICE_URLS = [
  'chatgpt.com',
  'openai.com',
  'claude.ai',
  'gemini.google.com',
  'perplexity.ai',
  'poe.com',
  'copilot.microsoft.com',
  'you.com',
];

/**
 * Check if URL is an AI service
 */
function isAIServiceURL(url: string | undefined): boolean {
  if (!url) return false;
  return AI_SERVICE_URLS.some(domain => url.includes(domain));
}

/**
 * Update extension badge based on protection state
 */
async function updateBadge(tabId: number, state: ProtectionState): Promise<void> {
  try {
    switch (state) {
      case 'protected':
        await chrome.action.setBadgeText({ tabId, text: '✓' });
        await chrome.action.setBadgeBackgroundColor({ tabId, color: '#10B981' }); // Green
        await chrome.action.setTitle({ tabId, title: 'AI PII Sanitizer - Protected ✓' });
        console.log(`[Badge] Tab ${tabId}: PROTECTED (Green)`);
        break;

      case 'unprotected':
        await chrome.action.setBadgeText({ tabId, text: '!' });
        await chrome.action.setBadgeBackgroundColor({ tabId, color: '#EF4444' }); // Red
        await chrome.action.setTitle({ tabId, title: 'AI PII Sanitizer - NOT PROTECTED! Click to reload page' });
        console.log(`[Badge] Tab ${tabId}: UNPROTECTED (Red)`);
        break;

      case 'disabled':
        await chrome.action.setBadgeText({ tabId, text: '' });
        await chrome.action.setBadgeBackgroundColor({ tabId, color: '#6B7280' }); // Grey
        await chrome.action.setTitle({ tabId, title: 'AI PII Sanitizer - Disabled' });
        console.log(`[Badge] Tab ${tabId}: DISABLED (No badge)`);
        break;
    }
  } catch (error) {
    console.error(`[Badge] Failed to update badge for tab ${tabId}:`, error);
  }
}

/**
 * Check tab protection status and update badge
 */
async function checkAndUpdateBadge(tabId: number, url?: string): Promise<void> {
  try {
    // Clear badge for non-AI service pages
    if (!isAIServiceURL(url)) {
      await chrome.action.setBadgeText({ tabId, text: '' });
      console.log(`[Badge] Tab ${tabId}: Not an AI service, badge cleared`);
      return;
    }

    // Check if extension is enabled
    const storage = StorageManager.getInstance();
    const config = await storage.loadConfig();

    if (!config?.settings?.enabled) {
      await updateBadge(tabId, 'disabled');
      return;
    }

    // Check if content script is injected and responding
    const isInjected = await isContentScriptInjected(tabId);

    if (isInjected) {
      await updateBadge(tabId, 'protected');
    } else {
      await updateBadge(tabId, 'unprotected');
    }
  } catch (error) {
    console.error(`[Badge] Error checking protection for tab ${tabId}:`, error);
  }
}

// ========== EVENT LISTENERS ==========

// Initialize storage on install
// Inject content scripts into existing tabs on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('AI PII Sanitizer startup');
  await injectIntoExistingTabs();
// Update badges for all tabs  const tabs = await chrome.tabs.query({});  for (const tab of tabs) {    if (tab.id) {      await checkAndUpdateBadge(tab.id, tab.url);    }  }
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('AI PII Sanitizer installed');
  const storage = StorageManager.getInstance();
  await storage.initialize();
  // Inject content scripts into existing tabs
  await injectIntoExistingTabs();
// Update badges for all tabs  const tabs = await chrome.tabs.query({});  for (const tab of tabs) {    if (tab.id) {      await checkAndUpdateBadge(tab.id, tab.url);    }  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate async response
    return true;
  }
);

/**
 * Route messages to appropriate handlers
 */
async function handleMessage(message: Message): Promise<any> {
  switch (message.type) {
    case 'HEALTH_CHECK':
      // Simple health check for page status detection
      return { success: true, status: 'ok' };

    case 'PROTECTION_LOST':
      const tabId = message.tabId;
      if (tabId) {
        console.log(`[Badge] Protection lost for tab ${tabId}`);
        await updateBadge(tabId, 'unprotected');
      }
      return { success: true };

    case 'DISABLE_EXTENSION':
      console.log('[Background] User requested extension disable');

      // Update config to disable extension
      const storage = StorageManager.getInstance();
      const currentConfig = await storage.loadConfig();

      if (currentConfig) {
        await storage.saveConfig({
          ...currentConfig,
          settings: {
            ...currentConfig.settings,
            enabled: false
          }
        });

        console.log('[Background] ✅ Extension disabled');

        // Update all badges to show disabled state
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.id) {
            await checkAndUpdateBadge(tab.id, tab.url);
          }
        }
      }

      return { success: true };

    case 'SUBSTITUTE_REQUEST':
      return handleSubstituteRequest(message.payload);

    case 'SUBSTITUTE_RESPONSE':
      return handleSubstituteResponse(message.payload);

    case 'RELOAD_PROFILES':
      return handleReloadProfiles();

    case 'GET_ALIASES':
      return handleGetAliases();

    case 'ADD_ALIAS':
      return handleAddAlias(message.payload);

    case 'REMOVE_ALIAS':
      return handleRemoveAlias(message.payload);

    case 'UPDATE_CONFIG':
      return handleUpdateConfig(message.payload);

    case 'GET_CONFIG':
      return handleGetConfig();

    case 'REINJECT_CONTENT_SCRIPTS':
      return handleReinjectContentScripts();

    case 'ADD_API_KEY':
      return handleAddAPIKey(message.payload);

    case 'REMOVE_API_KEY':
      return handleRemoveAPIKey(message.payload);

    case 'UPDATE_API_KEY':
      return handleUpdateAPIKey(message.payload);

    case 'GET_API_KEYS':
      return handleGetAPIKeys();

    case 'UPDATE_API_KEY_VAULT_SETTINGS':
      return handleUpdateAPIKeyVaultSettings(message.payload);

    case 'ADD_CUSTOM_RULE':
      return handleAddCustomRule(message.payload);

    case 'REMOVE_CUSTOM_RULE':
      return handleRemoveCustomRule(message.payload);

    case 'UPDATE_CUSTOM_RULE':
      return handleUpdateCustomRule(message.payload);

    case 'TOGGLE_CUSTOM_RULE':
      return handleToggleCustomRule(message.payload);

    case 'UPDATE_CUSTOM_RULES_SETTINGS':
      return handleUpdateCustomRulesSettings(message.payload);

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

/**
 * Detect AI service from URL
 */
function detectService(url: string): import('../lib/types').AIService {
  if (url.includes('openai.com') || url.includes('chatgpt.com')) {
    return 'chatgpt';
  }
  if (url.includes('claude.ai')) {
    return 'claude';
  }
  if (url.includes('gemini.google.com')) {
    return 'gemini';
  }
  if (url.includes('perplexity.ai')) {
    return 'perplexity';
  }
  if (url.includes('poe.com')) {
    return 'poe';
  }
  if (url.includes('copilot.microsoft.com') || url.includes('bing.com/sydney')) {
    return 'copilot';
  }
  if (url.includes('you.com')) {
    return 'you';
  }
  return 'unknown';
}

/**
 * Handle request substitution (real → alias)
 * NO FETCHING HERE - just text substitution!
 */
async function handleSubstituteRequest(payload: { body: string; url?: string }): Promise<any> {
  try {
    const { body, url } = payload;
    const service = url ? detectService(url) : 'unknown';

    console.log('🔄 Substituting request body');

    // Handle empty or non-JSON bodies (streaming, multipart, etc.)
    if (!body || body.trim() === '') {
      console.log('⚠️ Empty request body, skipping substitution');
      return {
        success: true,
        modifiedBody: body,
        substitutions: 0,
      };
    }

    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (e) {
      // Not JSON - might be streaming, form data, or other format
      console.log('⚠️ Non-JSON request body, attempting plain text substitution');

      // Try plain text substitution for non-JSON bodies
      const aliasEngine = await AliasEngine.getInstance();
      const substituted = aliasEngine.substitute(body, 'encode');

      if (substituted.substitutions.length > 0) {
        console.log('✅ Plain text substituted:', substituted.substitutions.length, 'replacements');
      }

      return {
        success: true,
        modifiedBody: substituted.text,
        substitutions: substituted.substitutions.length,
      };
    }

    // Extract all text content from messages/prompt
    const textContent = extractAllText(requestData);

    console.log('📝 Extracted text:', textContent.substring(0, 300));

    if (!textContent) {
      console.log('⚠️ No text extracted from request');
      return {
        success: true,
        modifiedBody: body,
        substitutions: 0,
      };
    }

    // Apply substitution (real → alias)
    const aliasEngine = await AliasEngine.getInstance();
    const profiles = aliasEngine.getProfiles();
    console.log('📋 Active profiles:', profiles.length, '-', profiles.map((p: any) => p.profileName).join(', '));

    const substituted = aliasEngine.substitute(textContent, 'encode');

    console.log('✅ Request substituted:', substituted.substitutions.length, 'replacements');
    if (substituted.substitutions.length > 0) {
      console.log('🔀 Changes:', substituted.substitutions);

      // Log activity for debug console
      const serviceName = service === 'chatgpt' ? 'ChatGPT' :
                         service === 'claude' ? 'Claude' :
                         service === 'gemini' ? 'Gemini' :
                         service === 'perplexity' ? 'Perplexity' :
                         service === 'poe' ? 'Poe' :
                         service === 'copilot' ? 'Copilot' :
                         service === 'you' ? 'You.com' : 'Unknown';

      logActivity({
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
    const storage = StorageManager.getInstance();
    const config = await storage.loadConfig();

    if (config?.customRules?.enabled && config.customRules.rules.length > 0) {
      console.log('🎯 Custom rules enabled, applying redaction rules...');
      console.log('📝 Text before custom rules:', modifiedText.substring(0, 200));

      // Apply custom redaction rules
      const rulesResult = redactionEngine.applyRules(modifiedText, config.customRules.rules);

      console.log(`🎯 Rules result: ${rulesResult.matches.length} matches, ${rulesResult.rulesApplied.length} rules applied`);
      if (rulesResult.matches.length > 0) {
        console.log('🔍 Matches:', rulesResult.matches);
        console.log('📝 Text after custom rules:', rulesResult.modifiedText.substring(0, 200));
        modifiedText = rulesResult.modifiedText;

        // Update match counts for rules
        for (const ruleId of rulesResult.rulesApplied) {
          await storage.incrementRuleMatchCount(ruleId);
        }
      } else {
        console.log('⚠️ No matches found for custom rules');
      }
    }

    // ========== API KEY DETECTION ==========

    // Service name mapping for activity log
    const serviceName = service === 'chatgpt' ? 'ChatGPT' :
                        service === 'claude' ? 'Claude' :
                        service === 'gemini' ? 'Gemini' :
                        service === 'perplexity' ? 'Perplexity' :
                        service === 'poe' ? 'Poe' :
                        service === 'copilot' ? 'Copilot' :
                        service === 'you' ? 'You.com' : 'Unknown';

    if (config?.apiKeyVault?.enabled) {
      console.log('🔐 API Key Vault enabled, scanning for keys...');

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
        ? detectedKeys.filter((k) => k.format === 'openai')
        : detectedKeys;

      if (allowedDetections.length > 0) {
        console.log(`🔐 Detected ${allowedDetections.length} API keys (mode: ${config.apiKeyVault.mode})`);

        // Handle based on mode
        if (config.apiKeyVault.mode === 'auto-redact') {
          // Auto-redact keys
          modifiedText = APIKeyDetector.redact(modifiedText, allowedDetections, 'placeholder');

          // Update stats for each detected key
          for (const detected of allowedDetections) {
            const stored = config.apiKeyVault.keys.find((k) => k.keyValue === detected.value);
            if (stored) {
              await storage.incrementAPIKeyProtection(stored.id);
            }
          }

          // Log activity
          logActivity({
            type: 'substitution',
            service: service,
            details: {
              url: serviceName,
              apiKeysProtected: allowedDetections.length,
              keyTypes: allowedDetections.map((k) => k.format),
              substitutionCount: allowedDetections.length,
            },
            message: `API Keys: ${allowedDetections.length} keys redacted`,
          });

          console.log('✅ API keys auto-redacted:', allowedDetections.map(k => k.format));
        } else if (config.apiKeyVault.mode === 'warn-first') {
          // Return to inject.js with warning - let user decide
          console.log('⚠️  Warn-first mode: Returning warning to user');
          return {
            success: true,
            needsWarning: true,
            keysDetected: allowedDetections.length,
            keyTypes: allowedDetections.map((k) => k.format),
            originalBody: body, // Send original back for user choice
            modifiedBody: body,
            substitutions: substituted.substitutions.length,
          };
        } else if (config.apiKeyVault.mode === 'log-only') {
          // Just log, don't redact
          console.log('📋 Log-only mode: Keys detected but not redacted');
          logActivity({
            type: 'warning',
            service: service,
            details: {
              url: serviceName,
              apiKeysFound: allowedDetections.length,
              keyTypes: allowedDetections.map((k) => k.format),
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
    console.error('❌ Request substitution error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle response substitution (alias → real)
 */
async function handleSubstituteResponse(payload: { text: string }): Promise<any> {
  try {
    const { text } = payload;

    if (!text) {
      return {
        success: true,
        modifiedText: text,
        substitutions: 0,
      };
    }

    // Check if response decoding is enabled
    const storage = StorageManager.getInstance();
    const config = await storage.loadConfig();

    if (!config?.settings?.decodeResponses) {
      // Decoding disabled - return original text with aliases
      console.log('ℹ️ Response decoding disabled - keeping aliases in response');
      return {
        success: true,
        modifiedText: text,
        substitutions: 0,
      };
    }

    // Apply reverse substitution (alias → real)
    const aliasEngine = await AliasEngine.getInstance();
    const decoded = aliasEngine.substitute(text, 'decode');

    console.log('✅ Response decoded:', decoded.substitutions.length, 'replacements');

    return {
      success: true,
      modifiedText: decoded.text,
      substitutions: decoded.substitutions.length,
    };
  } catch (error: any) {
    console.error('❌ Response substitution error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Extract all text content from request data
 * Handles ChatGPT, Claude, and Gemini message formats
/**
 * Get all aliases
 */
async function handleGetAliases() {
  const storage = StorageManager.getInstance();
  const aliases = await storage.loadAliases();
  return { success: true, data: aliases };
}

/**
 * Add new alias
 */
async function handleAddAlias(payload: any) {
  const storage = StorageManager.getInstance();
  const newAlias = await storage.addAlias(payload);

  // Reload alias engine
  const aliasEngine = await AliasEngine.getInstance();
  await aliasEngine.reload();

  return { success: true, data: newAlias };
}

/**
 * Remove alias
 */
async function handleRemoveAlias(payload: { id: string }) {
  const storage = StorageManager.getInstance();
  await storage.removeAlias(payload.id);

  // Reload alias engine
  const aliasEngine = await AliasEngine.getInstance();
  await aliasEngine.reload();

  return { success: true };
}

/**
 * Update configuration
 */
async function handleUpdateConfig(payload: any) {
  const storage = StorageManager.getInstance();
  await storage.saveConfig(payload);
  return { success: true };
}

/**
 * Get configuration
 */
async function handleGetConfig() {
  const storage = StorageManager.getInstance();
  const config = await storage.loadConfig();
  return { success: true, data: config };
}

/**
 * Reload profiles in AliasEngine
 * Called when profiles are added/updated/deleted from popup
 */
async function handleReloadProfiles() {
  console.log('[Background] Reloading profiles...');
  const aliasEngine = await AliasEngine.getInstance();
  await aliasEngine.reload();
  const profiles = aliasEngine.getProfiles();
  console.log('[Background] ✅ Profiles reloaded:', profiles.length, 'active profiles');
  return { success: true, profileCount: profiles.length };
}

/**
 * Check if content script is already injected in a tab
 */
async function isContentScriptInjected(tabId: number): Promise<boolean> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    return response === 'PONG';
  } catch (error) {
    return false;
  }
}

/**
 * Inject content scripts into all existing AI service tabs
 */
async function injectIntoExistingTabs(): Promise<void> {
  console.log('[Background] Injecting content scripts into existing tabs...');

  const AI_SERVICE_PATTERNS = [
    '*://chatgpt.com/*',
    '*://*.openai.com/*',
    '*://claude.ai/*',
    '*://gemini.google.com/*',
    '*://perplexity.ai/*',
    '*://poe.com/*',
    '*://copilot.microsoft.com/*',
    '*://you.com/*',
  ];

  try {
    // Query all tabs matching AI service URLs
    for (const pattern of AI_SERVICE_PATTERNS) {
      const tabs = await chrome.tabs.query({ url: pattern });

      for (const tab of tabs) {
        if (!tab.id) continue;

        // Check if content script is already injected
        const isInjected = await isContentScriptInjected(tab.id);

        if (!isInjected) {
          console.log(`[Background] Injecting into tab ${tab.id}: ${tab.url}`);

          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js'],
            });
            console.log(`[Background] ✅ Injected into tab ${tab.id}`);
            // Update badge after successful injection
            await checkAndUpdateBadge(tab.id, tab.url);
          } catch (error) {
            console.warn(`[Background] Failed to inject into tab ${tab.id}:`, error);
          }
          // Update badge for already-injected tabs
          await checkAndUpdateBadge(tab.id, tab.url);
        } else {
          console.log(`[Background] Already injected in tab ${tab.id}`);
        }
      }
    }

    console.log('[Background] ✅ Content script injection complete');
  } catch (error) {
    console.error('[Background] Error injecting into existing tabs:', error);
  }
}

/**
 * Handle REINJECT_CONTENT_SCRIPTS message from popup
 */
async function handleReinjectContentScripts() {
  await injectIntoExistingTabs();
  return { success: true, message: 'Content scripts reinjected' };
}

/**
 * Handle ADD_API_KEY message from popup
 */
async function handleAddAPIKey(payload: { name?: string; keyValue: string; format?: import('../lib/types').APIKeyFormat }) {
  try {
    const storage = StorageManager.getInstance();
    const newKey = await storage.addAPIKey(payload);
    return { success: true, data: newKey };
  } catch (error: any) {
    console.error('[Background] Failed to add API key:', error);

    // Check for FREE tier limits
    if (error.message.startsWith('FREE_TIER_LIMIT')) {
      return {
        success: false,
        error: 'FREE_TIER_LIMIT',
        message: 'You have reached the FREE tier limit of 10 API keys. Upgrade to PRO for unlimited keys.',
      };
    }

    if (error.message.startsWith('FREE_TIER_PATTERN')) {
      return {
        success: false,
        error: 'FREE_TIER_PATTERN',
        message: 'FREE tier only supports OpenAI key detection. Upgrade to PRO for GitHub, AWS, Stripe, and other patterns.',
      };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Handle REMOVE_API_KEY message from popup
 */
async function handleRemoveAPIKey(payload: { id: string }) {
  try {
    const storage = StorageManager.getInstance();
    await storage.removeAPIKey(payload.id);
    return { success: true };
  } catch (error: any) {
    console.error('[Background] Failed to remove API key:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle UPDATE_API_KEY message from popup
 */
async function handleUpdateAPIKey(payload: { id: string; updates: Partial<import('../lib/types').APIKey> }) {
  try {
    const storage = StorageManager.getInstance();
    await storage.updateAPIKey(payload.id, payload.updates);
    return { success: true };
  } catch (error: any) {
    console.error('[Background] Failed to update API key:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle GET_API_KEYS message from popup
 */
async function handleGetAPIKeys() {
  try {
    const storage = StorageManager.getInstance();
    const keys = await storage.getAllAPIKeys();
    return { success: true, data: keys };
  } catch (error: any) {
    console.error('[Background] Failed to get API keys:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle UPDATE_API_KEY_VAULT_SETTINGS message from popup
 */
async function handleUpdateAPIKeyVaultSettings(payload: Partial<import('../lib/types').APIKeyVaultConfig>) {
  try {
    const storage = StorageManager.getInstance();
    await storage.updateAPIKeyVaultSettings(payload);
    return { success: true };
  } catch (error: any) {
    console.error('[Background] Failed to update API Key Vault settings:', error);
    return { success: false, error: error.message };
  }
}

// ========== CUSTOM REDACTION RULES HANDLERS ==========

/**
 * Add custom redaction rule
 */
async function handleAddCustomRule(payload: any) {
  try {
    const storage = StorageManager.getInstance();
    const ruleId = await storage.addCustomRule(payload);
    return { success: true, data: { ruleId } };
  } catch (error: any) {
    console.error('[Background] Failed to add custom rule:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove custom redaction rule
 */
async function handleRemoveCustomRule(payload: { ruleId: string }) {
  try {
    const storage = StorageManager.getInstance();
    await storage.removeCustomRule(payload.ruleId);
    return { success: true };
  } catch (error: any) {
    console.error('[Background] Failed to remove custom rule:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update custom redaction rule
 */
async function handleUpdateCustomRule(payload: { ruleId: string; updates: any }) {
  try {
    const storage = StorageManager.getInstance();
    await storage.updateCustomRule(payload.ruleId, payload.updates);
    return { success: true };
  } catch (error: any) {
    console.error('[Background] Failed to update custom rule:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle custom rule enabled state
 */
async function handleToggleCustomRule(payload: { ruleId: string }) {
  try {
    const storage = StorageManager.getInstance();
    await storage.toggleCustomRule(payload.ruleId);
    return { success: true };
  } catch (error: any) {
    console.error('[Background] Failed to toggle custom rule:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update custom rules settings
 */
async function handleUpdateCustomRulesSettings(payload: Partial<import('../lib/types').CustomRulesConfig>) {
  try {
    const storage = StorageManager.getInstance();
    await storage.updateCustomRulesSettings(payload);
    return { success: true };
  } catch (error: any) {
    console.error('[Background] Failed to update custom rules settings:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Log activity to storage for debug console
 */
async function logActivity(entry: {
  type: 'interception' | 'substitution' | 'warning' | 'error';
  service: import('../lib/types').AIService;
  details: {
    url: string;
    profilesUsed?: string[];
    piiTypesFound?: string[];
    substitutionCount: number;
    error?: string;
    // Optional API Key Vault fields
    apiKeysProtected?: number;
    apiKeysFound?: number;
    keyTypes?: string[];
  };
  message: string;
}) {
  try {
    const storage = StorageManager.getInstance();
    const config = await storage.loadConfig();

    if (!config) return;

    const activityEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...entry,
      details: {
        ...entry.details,
        profilesUsed: entry.details.profilesUsed || [],
        piiTypesFound: entry.details.piiTypesFound || [],
      },
    };

    // Add to activity log (keep last 100)
    config.stats.activityLog = [activityEntry, ...config.stats.activityLog].slice(0, 100);

    // Update stats
    config.stats.totalInterceptions++;
    if (entry.type === 'substitution' && entry.service !== 'unknown') {
      config.stats.totalSubstitutions += entry.details.substitutionCount;
      config.stats.byService[entry.service].requests++;
      config.stats.byService[entry.service].substitutions += entry.details.substitutionCount;
    }

    await storage.saveConfig(config);
  } catch (error) {
    console.error('[Background] Failed to log activity:', error);
  }
}

// ========== TAB EVENT LISTENERS FOR BADGE UPDATES ==========

/**
 * Update badge when tab becomes active
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await checkAndUpdateBadge(activeInfo.tabId, tab.url);
  } catch (error) {
    console.error('[Badge] Error on tab activation:', error);
  }
});

/**
 * Update badge when tab URL changes (navigation)
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only check when URL changes or page finishes loading
  if (changeInfo.url || changeInfo.status === 'complete') {
    await checkAndUpdateBadge(tabId, tab.url);
  }
});

/**
 * Update badges for all tabs when storage changes (config enable/disable)
 */
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local' && changes.userConfig) {
    const oldConfig = changes.userConfig.oldValue;
    const newConfig = changes.userConfig.newValue;

    // Check if enabled state changed
    if (oldConfig?.settings?.enabled !== newConfig?.settings?.enabled) {
      console.log('[Badge] Extension enabled state changed, updating all badges');

      // Update badges for all tabs
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          await checkAndUpdateBadge(tab.id, tab.url);
        }
      }
    }
  }
});
