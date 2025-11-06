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

// Debug mode - set to false for production to reduce log spam
const DEBUG_MODE = false;

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
  'copilot.microsoft.com',
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
// Track last badge state per tab to avoid log spam
const badgeStateCache = new Map<number, ProtectionState>();

async function updateBadge(tabId: number, state: ProtectionState): Promise<void> {
  try {
    // Check if state changed (only log changes, not every health check)
    const lastState = badgeStateCache.get(tabId);
    const stateChanged = lastState !== state;

    if (stateChanged) {
      badgeStateCache.set(tabId, state);
    }

    switch (state) {
      case 'protected':
        await chrome.action.setBadgeText({ tabId, text: '✓' });
        await chrome.action.setBadgeBackgroundColor({ tabId, color: '#10B981' }); // Green
        await chrome.action.setTitle({ tabId, title: 'AI PII Sanitizer - Protected ✓' });
        if (DEBUG_MODE || stateChanged) {
          console.log(`[Badge] Tab ${tabId}: PROTECTED (Green)`);
        }
        break;

      case 'unprotected':
        await chrome.action.setBadgeText({ tabId, text: '!' });
        await chrome.action.setBadgeBackgroundColor({ tabId, color: '#EF4444' }); // Red
        await chrome.action.setTitle({ tabId, title: 'AI PII Sanitizer - NOT PROTECTED! Click to reload page' });
        if (DEBUG_MODE || stateChanged) {
          console.log(`[Badge] Tab ${tabId}: UNPROTECTED (Red)`);
        }
        break;

      case 'disabled':
        await chrome.action.setBadgeText({ tabId, text: '' });
        await chrome.action.setBadgeBackgroundColor({ tabId, color: '#6B7280' }); // Grey
        await chrome.action.setTitle({ tabId, title: 'AI PII Sanitizer - Disabled' });
        if (DEBUG_MODE || stateChanged) {
          console.log(`[Badge] Tab ${tabId}: DISABLED (No badge)`);
        }
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
      if (DEBUG_MODE) {
        console.log(`[Badge] Tab ${tabId}: Not an AI service, badge cleared`);
      }
      return;
    }

    // Check if extension is enabled
    const storage = StorageManager.getInstance();
    let config: Awaited<ReturnType<typeof storage.loadConfig>> = null;

    try {
      config = await storage.loadConfig();
    } catch (error) {
      // If config loading fails due to auth, assume extension is disabled
      // This prevents errors from spamming when user isn't signed in
      if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
        console.log(`[Badge] Tab ${tabId}: Data locked (user not authenticated)`);
        await updateBadge(tabId, 'disabled');
        return;
      }
      throw error; // Re-throw other errors
    }

    if (DEBUG_MODE) {
      console.log(`[Badge] Config check for tab ${tabId}:`, {
        hasConfig: !!config,
        hasSettings: !!config?.settings,
        enabled: config?.settings?.enabled
      });
    }

    if (!config?.settings?.enabled) {
      await updateBadge(tabId, 'disabled');
      return;
    }

    // Check if this specific domain is in protectedDomains
    const protectedDomains = config?.settings?.protectedDomains || [];
    const currentDomain = url ? new URL(url).hostname : '';
    const isDomainProtected = protectedDomains.some(domain =>
      currentDomain.includes(domain) || domain.includes(currentDomain)
    );

    if (!isDomainProtected) {
      // Service is disabled for this domain
      await updateBadge(tabId, 'disabled');
      if (DEBUG_MODE) {
        console.log(`[Badge] Tab ${tabId}: Domain ${currentDomain} not in protectedDomains`, protectedDomains);
      }
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

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('AI PII Sanitizer installed:', details.reason);
  const storage = StorageManager.getInstance();

  try {
    await storage.initialize();

    // Ensure extension is enabled on install/update
    const config = await storage.loadConfig();
    if (config && !config.settings.enabled) {
      console.log('[Background] Extension was disabled - enabling it now');
      config.settings.enabled = true;
      await storage.saveConfig(config);
    }
  } catch (error) {
    // If user not authenticated, skip initialization
    // Data will be initialized when user signs in through popup
    if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
      console.log('[Background] User not authenticated - skipping data initialization');
      console.log('[Background] Extension will initialize when user signs in');
    } else {
      // Re-throw other errors
      console.error('[Background] Failed to initialize on install:', error);
    }
  }

  // Auto-reload AI service tabs on extension update/reload (dev mode)
  if (details.reason === 'update' || details.reason === 'install') {
    console.log('[Background] Extension updated/installed - auto-reloading AI service tabs');

    const tabs = await chrome.tabs.query({});
    let reloadedCount = 0;

    for (const tab of tabs) {
      if (tab.id && isAIServiceURL(tab.url)) {
        try {
          console.log(`[Background] Auto-reloading tab ${tab.id}: ${tab.url}`);
          await chrome.tabs.reload(tab.id);
          reloadedCount++;
        } catch (error) {
          console.warn(`[Background] Failed to reload tab ${tab.id}:`, error);
        }
      }
    }

    console.log(`[Background] ✅ Auto-reloaded ${reloadedCount} AI service tabs`);
  }

  // Inject content scripts into existing tabs that weren't reloaded
  await injectIntoExistingTabs();

  // Update badges for all tabs
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      await checkAndUpdateBadge(tab.id, tab.url);
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    // Validate message has a type field
    if (!message || !message.type) {
      console.warn('[Background] Received message without type field:', message);
      sendResponse({ success: false, error: 'Invalid message format' });
      return false;
    }

    handleMessage(message, sender)
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
async function handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<any> {
  switch (message.type) {
    case 'HEALTH_CHECK': {
      // Health check also reports protection status back to tab
      const senderTabId = message.tabId || sender?.tab?.id;

      if (senderTabId) {
        if (DEBUG_MODE) {
          console.log(`[Badge] Health check passed for tab ${senderTabId}`);
        }

        // Update badge to protected (health checks are passing)
        const storage = StorageManager.getInstance();
        const config = await storage.loadConfig();

        if (config?.settings?.enabled) {
          await updateBadge(senderTabId, 'protected');
        }
      }

      return { success: true, status: 'ok' };
    }

    case 'PROTECTION_LOST': {
      // Get tabId from message sender (content.ts doesn't have access to chrome.tabs.getCurrent)
      const tabId = message.tabId || sender?.tab?.id;
      if (tabId) {
        console.log(`[Badge] Protection lost for tab ${tabId}`);
        await updateBadge(tabId, 'unprotected');
      } else {
        console.warn('[Badge] PROTECTION_LOST received but no tabId available');
      }
      return { success: true };
    }

    case 'DISABLE_EXTENSION': {
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
    }

    case 'SUBSTITUTE_REQUEST':
      return handleSubstituteRequest(message.payload);

    case 'SUBSTITUTE_RESPONSE':
      return handleSubstituteResponse(message.payload);

    case 'RELOAD_PROFILES':
      return handleReloadProfiles();

    case 'GET_ALIASES':
      return handleGetAliases();

    case 'GET_PROFILES':
      return handleGetProfiles();

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
  if (url.includes('copilot.microsoft.com') || url.includes('bing.com/sydney')) {
    return 'copilot';
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
      // Not JSON - might be streaming, form data, or other format (e.g., Gemini's URL-encoded batchexecute)
      console.log('⚠️ Non-JSON request body, attempting plain text substitution');

      // Check if body is URL-encoded (Gemini batchexecute format)
      let bodyToSubstitute = body;
      let isUrlEncoded = false;

      if (typeof body === 'string' && body.includes('f.req=')) {
        console.log('[Gemini] Detected URL-encoded batchexecute format');
        try {
          // Parse URL parameters
          const params = new URLSearchParams(body);
          const freqValue = params.get('f.req');
          
          if (freqValue) {
            // Decode only the f.req value for substitution
            bodyToSubstitute = freqValue;
            isUrlEncoded = true;
            console.log('[Gemini] Decoded f.req value length:', bodyToSubstitute.length);
          }
        } catch (decodeError) {
          console.warn('[Gemini] Failed to parse URL parameters, using original');
          bodyToSubstitute = body;
        }
      }

      // Try plain text substitution
      const aliasEngine = await AliasEngine.getInstance();
      const substituted = aliasEngine.substitute(bodyToSubstitute, 'encode');

      if (substituted.substitutions.length > 0) {
        console.log('✅ Plain text substituted:', substituted.substitutions.length, 'replacements');
      }

      // Re-encode if we decoded it
      let finalBody = substituted.text;
      if (isUrlEncoded) {
        try {
          // Reconstruct the form body with substituted f.req value
          const params = new URLSearchParams(body);
          params.set('f.req', substituted.text);
          finalBody = params.toString();
          console.log('[Gemini] Reconstructed body length:', finalBody.length);
        } catch (encodeError) {
          console.error('[Gemini] Failed to reconstruct body:', encodeError);
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
                         service === 'copilot' ? 'Copilot' : 'Unknown';

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
                        service === 'copilot' ? 'Copilot' : 'Unknown';

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

    console.log('[Response Decode] Starting decode with text:', text.substring(0, 200));
    const decoded = aliasEngine.substitute(text, 'decode');

    console.log('[Response Decode] ✅ Decoded:', decoded.substitutions.length, 'replacements');
    if (decoded.substitutions.length > 0) {
      console.log('[Response Decode] Replacements made:', decoded.substitutions);
    } else {
      console.log('[Response Decode] ⚠️ No substitutions made - aliasToRealMap may be empty or text didnt match');
    }

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
 * Get all profiles (V2) - for Gemini observer
 */
async function handleGetProfiles() {
  const storage = StorageManager.getInstance();
  const profiles = await storage.loadProfiles();
  return { success: true, data: profiles };
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
  try {
    const storage = StorageManager.getInstance();
    const config = await storage.loadConfig();
    return { success: true, data: config };
  } catch (error) {
    // If config loading fails due to auth, return a default disabled config
    if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
      console.log('[Background] Config requested but user not authenticated - returning default config');
      // Return a safe default config
      return {
        success: true,
        data: {
          settings: { enabled: false },
          features: {},
          stats: { totalSubstitutions: 0, totalInterceptions: 0, byService: {} },
          account: { tier: 'free' }
        }
      };
    }
    console.error('[Background] Error loading config:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
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
    '*://copilot.microsoft.com/*',
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
 * Update badges for all tabs when storage changes (config enable/disable or protectedDomains)
 */
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local' && changes.config) {
    const oldConfig = changes.config.oldValue;
    const newConfig = changes.config.newValue;

    // Check if enabled state or protectedDomains changed
    const enabledChanged = oldConfig?.settings?.enabled !== newConfig?.settings?.enabled;
    const domainsChanged = JSON.stringify(oldConfig?.settings?.protectedDomains) !==
                           JSON.stringify(newConfig?.settings?.protectedDomains);

    if (enabledChanged || domainsChanged) {
      console.log('[Badge] Protection settings changed, updating all badges', {
        enabledChanged,
        domainsChanged,
        oldDomains: oldConfig?.settings?.protectedDomains,
        newDomains: newConfig?.settings?.protectedDomains
      });

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
