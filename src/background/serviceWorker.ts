/**
 * Service Worker (Background Script)
 * Handles request/response interception and message passing
 */

import { AliasEngine } from '../lib/aliasEngine';
import { StorageManager } from '../lib/storage';
import { Message } from '../lib/types';
import { APIKeyDetector } from '../lib/apiKeyDetector';

// Initialize storage on install
// Inject content scripts into existing tabs on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('AI PII Sanitizer startup');
  await injectIntoExistingTabs();
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('AI PII Sanitizer installed');
  const storage = StorageManager.getInstance();
  await storage.initialize();
  // Inject content scripts into existing tabs
  await injectIntoExistingTabs();
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

    // Apply substitution IN-PLACE (real → alias)
    const aliasEngine = await AliasEngine.getInstance();
    const profiles = aliasEngine.getProfiles();
    console.log('📋 Active profiles:', profiles.length, '-', profiles.map((p: any) => p.profileName).join(', '));

    const inPlace = await substituteInPlace(requestData, aliasEngine);

    console.log('✅ Request substituted:', inPlace.substitutionCount, 'replacements');
    if (inPlace.substitutionCount > 0) {
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
          profilesUsed: inPlace.profilesMatched?.map(p => p.profileName) || [],
          piiTypesFound: inPlace.profilesMatched?.flatMap(p => p.piiTypes) || [],
          substitutionCount: inPlace.substitutionCount,
        },
        message: `${serviceName}: ${inPlace.substitutionCount} items replaced`,
      });
    }

    // ========== API KEY DETECTION ==========
    const storage = StorageManager.getInstance();
    const config = await storage.loadConfig();

  // Service name mapping for activity log
  const serviceName = service === 'chatgpt' ? 'ChatGPT' :
            service === 'claude' ? 'Claude' :
            service === 'gemini' ? 'Gemini' :
            service === 'perplexity' ? 'Perplexity' :
            service === 'poe' ? 'Poe' :
            service === 'copilot' ? 'Copilot' :
            service === 'you' ? 'You.com' : 'Unknown';

    let modifiedRequestData = inPlace.data;

    if (config?.apiKeyVault?.enabled) {
      const apiRedaction = await redactApiKeysInPlace(modifiedRequestData, config);


      if (apiRedaction.redactedCount > 0) {
        // Update per-key stats
        for (const detected of apiRedaction.detectedAllowed) {
          const stored = config.apiKeyVault.keys.find((k: any) => k.keyValue === detected.value);
          if (stored) {
            await storage.incrementAPIKeyProtection(stored.id);
          }
        }

        logActivity({
          type: 'substitution',
          service: service,
          details: {
            url: serviceName,
            apiKeysProtected: apiRedaction.redactedCount,
            keyTypes: apiRedaction.detectedAllowed.map((k: any) => k.format),
            substitutionCount: apiRedaction.redactedCount,
          },
          message: `API Keys: ${apiRedaction.redactedCount} keys redacted`,
        });
      }
    }

    return {
      success: true,
      modifiedBody: JSON.stringify(modifiedRequestData),
      substitutions: inPlace.substitutionCount,
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

// (legacy extractAllText/replaceAllText removed after in-place refactor)

/**
 * In-place text substitution for request payloads
 * Preserves structure across ChatGPT, Claude, and Gemini formats
 */
async function substituteInPlace(data: any, aliasEngine: AliasEngine): Promise<{
  data: any;
  substitutionCount: number;
  profilesMatched: Array<{ profileName: string; piiTypes: string[] }>;
}> {
  const modified = JSON.parse(JSON.stringify(data));
  let totalSubstitutions = 0;
  const profileMatchesMap = new Map<string, Set<string>>();

  const trackMatches = (substituted: any) => {
    totalSubstitutions += substituted.substitutions?.length || 0;
    if (substituted.profilesMatched) {
      for (const match of substituted.profilesMatched) {
        if (!profileMatchesMap.has(match.profileName)) {
          profileMatchesMap.set(match.profileName, new Set());
        }
        for (const piiType of match.piiTypes) {
          profileMatchesMap.get(match.profileName)!.add(piiType);
        }
      }
    }
  };

  // ChatGPT format: { messages: [{ role, content }] }
  if (modified.messages && Array.isArray(modified.messages)) {
    for (let i = 0; i < modified.messages.length; i++) {
      const msg = modified.messages[i];
      if (!msg.content) continue;

      if (typeof msg.content === 'string') {
        const substituted = aliasEngine.substitute(msg.content, 'encode');
        modified.messages[i].content = substituted.text;
        trackMatches(substituted);
      } else if (msg.content.parts && Array.isArray(msg.content.parts)) {
        for (let j = 0; j < msg.content.parts.length; j++) {
          const substituted = aliasEngine.substitute(msg.content.parts[j], 'encode');
          modified.messages[i].content.parts[j] = substituted.text;
          trackMatches(substituted);
        }
      } else if (Array.isArray(msg.content)) {
        for (let j = 0; j < msg.content.length; j++) {
          const block = msg.content[j];
          if (typeof block === 'string') {
            const substituted = aliasEngine.substitute(block, 'encode');
            modified.messages[i].content[j] = substituted.text;
            trackMatches(substituted);
          } else if (block && typeof block === 'object' && 'text' in block) {
            const substituted = aliasEngine.substitute(block.text, 'encode');
            modified.messages[i].content[j].text = substituted.text;
            trackMatches(substituted);
          }
        }
      }
    }
  }

  // Claude prompt format
  else if (modified.prompt && typeof modified.prompt === 'string') {
    const substituted = aliasEngine.substitute(modified.prompt, 'encode');
    modified.prompt = substituted.text;
    trackMatches(substituted);
  }

  // Gemini format
  else if (modified.contents && Array.isArray(modified.contents)) {
    for (let i = 0; i < modified.contents.length; i++) {
      const content = modified.contents[i];
      if (content.parts && Array.isArray(content.parts)) {
        for (let j = 0; j < content.parts.length; j++) {
          const part = content.parts[j];
          if (part && 'text' in part) {
            const substituted = aliasEngine.substitute(part.text, 'encode');
            modified.contents[i].parts[j].text = substituted.text;
            trackMatches(substituted);
          }
        }
      }
    }
  }

  const profilesMatched = Array.from(profileMatchesMap.entries()).map(([profileName, piiTypes]) => ({
    profileName,
    piiTypes: Array.from(piiTypes)
  }));

  return { data: modified, substitutionCount: totalSubstitutions, profilesMatched };
}

/**
 * In-place API key detection and redaction across supported payload shapes
 */
async function redactApiKeysInPlace(data: any, config: any): Promise<{
  data: any;
  redactedCount: number;
  detectedAllowed: any[];
}> {
  const modified = JSON.parse(JSON.stringify(data));
  let redactedCount = 0;
  const detectedAllowed: any[] = [];

  const storedKeys = config.apiKeyVault.keys
    .filter((k: any) => k.enabled)
    .map((k: any) => k.keyValue);
  const isFree = config.account?.tier === 'free';
  const includeGeneric = !isFree; // PRO only
  const customPatterns = (config.apiKeyVault.customPatterns || []).map((pattern: string) => new RegExp(pattern, 'g'));

  const detectAndMaybeRedact = (text: string): string => {
    const detections = APIKeyDetector.detect(text, { includeGeneric, customPatterns, storedKeys });
    const allowed = isFree ? detections.filter((k: any) => k.format === 'openai') : detections;

    if (allowed.length > 0) {
      detectedAllowed.push(...allowed);
      if (config.apiKeyVault.mode === 'auto-redact' || config.apiKeyVault.mode === 'warn-first') {
        // warn-first not yet implemented → fallback to redact
        redactedCount += allowed.length;
        return APIKeyDetector.redact(text, allowed, 'placeholder');
      }
    }
    return text;
  };

  // ChatGPT format
  if (modified.messages && Array.isArray(modified.messages)) {
    for (let i = 0; i < modified.messages.length; i++) {
      const msg = modified.messages[i];
      if (!msg.content) continue;

      if (typeof msg.content === 'string') {
        modified.messages[i].content = detectAndMaybeRedact(msg.content);
      } else if (msg.content.parts && Array.isArray(msg.content.parts)) {
        for (let j = 0; j < msg.content.parts.length; j++) {
          modified.messages[i].content.parts[j] = detectAndMaybeRedact(msg.content.parts[j]);
        }
      } else if (Array.isArray(msg.content)) {
        for (let j = 0; j < msg.content.length; j++) {
          const block = msg.content[j];
          if (typeof block === 'string') {
            modified.messages[i].content[j] = detectAndMaybeRedact(block);
          } else if (block && typeof block === 'object' && 'text' in block) {
            modified.messages[i].content[j].text = detectAndMaybeRedact(block.text);
          }
        }
      }
    }
  } else if (modified.prompt && typeof modified.prompt === 'string') {
    modified.prompt = detectAndMaybeRedact(modified.prompt);
  } else if (modified.contents && Array.isArray(modified.contents)) {
    for (let i = 0; i < modified.contents.length; i++) {
      const content = modified.contents[i];
      if (content.parts && Array.isArray(content.parts)) {
        for (let j = 0; j < content.parts.length; j++) {
          const part = content.parts[j];
          if (part && 'text' in part) {
            modified.contents[i].parts[j].text = detectAndMaybeRedact(part.text);
          }
        }
      }
    }
  }

  return { data: modified, redactedCount, detectedAllowed };
}

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
          } catch (error) {
            console.warn(`[Background] Failed to inject into tab ${tab.id}:`, error);
          }
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
