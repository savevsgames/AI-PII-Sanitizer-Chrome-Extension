/**
 * Service Worker (Background Script)
 * Handles request/response interception and message passing
 */

import { AliasEngine } from '../lib/aliasEngine';
import { StorageManager } from '../lib/storage';
import {
  Message,
  InterceptRequestPayload,
  InterceptResponse,
} from '../lib/types';

// Initialize storage on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('AI PII Sanitizer installed');
  const storage = StorageManager.getInstance();
  await storage.initialize();
});

// Handle messages from content script
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
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
    case 'INTERCEPT_REQUEST':
      return handleRequestIntercept(message.payload);

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
 * Intercept and process AI API requests
 */
async function handleRequestIntercept(
  payload: InterceptRequestPayload
): Promise<InterceptResponse> {
  try {
    const { url, method, body, headers } = payload;

    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (e) {
      return { success: false, error: 'Cannot parse request body' };
    }

    // Extract text content based on AI service
    const textContent = extractTextFromRequest(requestData, url);

    // Apply substitution (real → alias)
    const aliasEngine = await AliasEngine.getInstance();
    const substituted = aliasEngine.substitute(textContent, 'encode');

    console.log('Substituted:', substituted.substitutions.length, 'items');

    // Reconstruct request body with substituted text
    const modifiedRequestData = injectTextIntoRequest(
      requestData,
      substituted.text,
      url
    );

    // Forward modified request to AI service
    const response = await fetch(url, {
      method,
      headers: headers as HeadersInit,
      body: JSON.stringify(modifiedRequestData),
    });

    // Parse response
    const responseData = await response.json();

    // Extract response text
    const responseText = extractTextFromResponse(responseData, url);

    // Apply reverse substitution (alias → real)
    const decoded = aliasEngine.substitute(responseText, 'decode');

    console.log('Decoded:', decoded.substitutions.length, 'items');

    // Inject decoded text back into response
    const modifiedResponse = injectTextIntoResponse(
      responseData,
      decoded.text,
      url
    );

    return {
      success: true,
      modifiedResponse,
    };
  } catch (error: any) {
    console.error('Request intercept error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Extract text from request based on AI service
 */
function extractTextFromRequest(data: any, url: string): string {
  if (url.includes('api.openai.com')) {
    // ChatGPT: messages array
    return data.messages?.map((m: any) => m.content).join('\n') || '';
  } else if (url.includes('claude.ai')) {
    // Claude: prompt field or messages
    return data.prompt || data.messages?.map((m: any) => m.content).join('\n') || '';
  } else if (url.includes('gemini.google.com')) {
    // Gemini: contents array
    return (
      data.contents
        ?.map((c: any) => c.parts?.map((p: any) => p.text).join(''))
        .join('\n') || ''
    );
  }
  return '';
}

/**
 * Inject substituted text back into request
 */
function injectTextIntoRequest(data: any, text: string, url: string): any {
  const modified = { ...data };

  if (url.includes('api.openai.com')) {
    // ChatGPT: replace message content
    if (modified.messages && modified.messages.length > 0) {
      const lines = text.split('\n');
      modified.messages = modified.messages.map((m: any, i: number) => ({
        ...m,
        content: lines[i] || m.content,
      }));
    }
  } else if (url.includes('claude.ai')) {
    // Claude: replace prompt or messages
    if (modified.prompt) {
      modified.prompt = text;
    } else if (modified.messages && modified.messages.length > 0) {
      const lines = text.split('\n');
      modified.messages = modified.messages.map((m: any, i: number) => ({
        ...m,
        content: lines[i] || m.content,
      }));
    }
  } else if (url.includes('gemini.google.com')) {
    // Gemini: replace contents
    if (modified.contents && modified.contents.length > 0) {
      const lines = text.split('\n');
      modified.contents = modified.contents.map((c: any, i: number) => ({
        ...c,
        parts: c.parts?.map((p: any) => ({
          ...p,
          text: lines[i] || p.text,
        })),
      }));
    }
  }

  return modified;
}

/**
 * Extract text from response
 */
function extractTextFromResponse(data: any, url: string): string {
  if (url.includes('api.openai.com')) {
    return (
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      ''
    );
  } else if (url.includes('claude.ai')) {
    return data.completion || data.content?.[0]?.text || '';
  } else if (url.includes('gemini.google.com')) {
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    );
  }
  return '';
}

/**
 * Inject decoded text back into response
 */
function injectTextIntoResponse(data: any, text: string, url: string): any {
  const modified = { ...data };

  if (url.includes('api.openai.com')) {
    if (modified.choices?.[0]?.message) {
      modified.choices[0].message.content = text;
    } else if (modified.choices?.[0]?.text) {
      modified.choices[0].text = text;
    }
  } else if (url.includes('claude.ai')) {
    if (modified.completion) {
      modified.completion = text;
    } else if (modified.content?.[0]) {
      modified.content[0].text = text;
    }
  } else if (url.includes('gemini.google.com')) {
    if (modified.candidates?.[0]?.content?.parts?.[0]) {
      modified.candidates[0].content.parts[0].text = text;
    }
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
