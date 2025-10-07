/**
 * Service Worker (Background Script)
 * Handles request/response interception and message passing
 */

import { AliasEngine } from '../lib/aliasEngine';
import { StorageManager } from '../lib/storage';
import { Message } from '../lib/types';

// Initialize storage on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('AI PII Sanitizer installed');
  const storage = StorageManager.getInstance();
  await storage.initialize();
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
    case 'SUBSTITUTE_REQUEST':
      return handleSubstituteRequest(message.payload);

    case 'SUBSTITUTE_RESPONSE':
      return handleSubstituteResponse(message.payload);

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

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

/**
 * Handle request substitution (real → alias)
 * NO FETCHING HERE - just text substitution!
 */
async function handleSubstituteRequest(payload: { body: string }): Promise<any> {
  try {
    const { body } = payload;

    console.log('🔄 Substituting request body');

    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (e) {
      console.error('❌ Cannot parse request body:', e);
      return { success: false, error: 'Cannot parse request body' };
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
    const aliases = aliasEngine.getAliases();
    console.log('📋 Active aliases:', aliases.length, '-', aliases.map(a => `"${a.realValue}" → "${a.aliasValue}"`).join(', '));

    const substituted = aliasEngine.substitute(textContent, 'encode');

    console.log('✅ Request substituted:', substituted.substitutions.length, 'replacements');
    if (substituted.substitutions.length > 0) {
      console.log('🔀 Changes:', substituted.substitutions);
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
