/**
 * Service Detector
 * Detects AI service from URL
 */

import type { AIService } from '../../lib/types';

/**
 * Detect AI service from URL
 */
export function detectService(url: string): AIService {
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
