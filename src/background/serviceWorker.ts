/**
 * Service Worker (Background Script)
 * Handles request/response interception and message passing
 */

import { AliasEngine } from '../lib/aliasEngine';
import { StorageManager } from '../lib/storage';
import { Message } from '../lib/types';

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
    const modifiedRequestData = replaceAllText(requestData, substituted.text);

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
 */
function extractAllText(data: any): string {
  // ChatGPT format: { messages: [{ role, content }] }
  // content can be:
  //   - string: "hello world"
  //   - object: { content_type: "text", parts: ["hello world"] }
  if (data.messages && Array.isArray(data.messages)) {
    return data.messages
      .map((m: any) => {
        if (typeof m.content === 'string') {
          return m.content;
        }
        // Handle nested ChatGPT format
        if (m.content?.parts && Array.isArray(m.content.parts)) {
          return m.content.parts.join('\n');
        }
        // Handle array of content blocks
        if (Array.isArray(m.content)) {
          return m.content
            .map((c: any) => (typeof c === 'string' ? c : c.text || ''))
            .join('\n');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }

  // Claude format: { prompt: "..." } or { messages: [...] }
  if (data.prompt && typeof data.prompt === 'string') {
    return data.prompt;
  }

  // Gemini format: { contents: [{ parts: [{ text }] }] }
  if (data.contents && Array.isArray(data.contents)) {
    return data.contents
      .flatMap((c: any) => c.parts?.map((p: any) => p.text) || [])
      .filter(Boolean)
      .join('\n\n');
  }

  return '';
}

/**
 * Replace all text content in request data with substituted text
 */
function replaceAllText(data: any, substitutedText: string): any {
  const modified = JSON.parse(JSON.stringify(data)); // Deep clone

  // Split substituted text back into messages
  const textParts = substitutedText.split('\n\n').filter(Boolean);
  let partIndex = 0;

  // ChatGPT format
  if (modified.messages && Array.isArray(modified.messages)) {
    modified.messages = modified.messages.map((m: any) => {
      if (!m.content) return m;

      // String content
      if (typeof m.content === 'string' && m.content) {
        return { ...m, content: textParts[partIndex++] || m.content };
      }

      // Nested object: { content_type: "text", parts: [...] }
      if (m.content.parts && Array.isArray(m.content.parts)) {
        const substituted = textParts[partIndex++];
        if (substituted) {
          return {
            ...m,
            content: {
              ...m.content,
              parts: [substituted]
            }
          };
        }
      }

      // Array of content blocks
      if (Array.isArray(m.content)) {
        return {
          ...m,
          content: m.content.map((c: any) => {
            if (typeof c === 'string') {
              return textParts[partIndex++] || c;
            }
            if (c.text) {
              return { ...c, text: textParts[partIndex++] || c.text };
            }
            return c;
          })
        };
      }

      return m;
    });
  }

  // Claude prompt format
  if (modified.prompt && typeof modified.prompt === 'string') {
    modified.prompt = substitutedText;
  }

  // Gemini format
  if (modified.contents && Array.isArray(modified.contents)) {
    modified.contents = modified.contents.map((c: any) => {
      if (c.parts && Array.isArray(c.parts)) {
        return {
          ...c,
          parts: c.parts.map((p: any) => {
            if (p.text) {
              return { ...p, text: textParts[partIndex++] || p.text };
            }
            return p;
          }),
        };
      }
      return c;
    });
  }

  return modified;
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
