/**
 * HTML Sanitizer Utility
 * Uses DOMPurify to prevent XSS attacks
 *
 * Use this EVERYWHERE you set innerHTML or insert user/AI-generated content
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS attacks
 *
 * @param dirty - Untrusted HTML string (user input, AI responses, etc.)
 * @param options - Optional DOMPurify configuration
 * @returns Safe HTML string with malicious code removed
 *
 * @example
 * // Basic usage
 * element.innerHTML = sanitizeHtml(userInput);
 *
 * // With custom options
 * element.innerHTML = sanitizeHtml(content, {
 *   ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
 *   ALLOWED_ATTR: ['class']
 * });
 */
export function sanitizeHtml(
  dirty: string,
  options?: DOMPurify.Config
): string {
  // Default configuration: Allow common formatting tags, no scripts/events
  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
      // Text formatting
      'b', 'i', 'em', 'strong', 'u', 's', 'mark',
      // Structure
      'p', 'br', 'div', 'span', 'pre', 'code',
      // Lists
      'ul', 'ol', 'li',
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Links (href is sanitized by DOMPurify)
      'a',
      // Tables
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: [
      'class',
      'style', // DOMPurify sanitizes inline styles
      'href',  // DOMPurify sanitizes URLs (blocks javascript:)
      'target',
      'rel',
      'title',
      'id',
    ],
    // Block all script-like content
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    // Return clean HTML or empty string (never return dirty HTML)
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    SAFE_FOR_TEMPLATES: true,
  };

  // Merge custom options with defaults
  const config = { ...defaultConfig, ...options };

  // Sanitize and return
  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize text content (strips ALL HTML tags)
 * Use for plain text contexts where no HTML is allowed
 *
 * @param dirty - Untrusted string
 * @returns Plain text with all HTML removed
 *
 * @example
 * element.textContent = sanitizeText(userInput);
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],     // No HTML tags allowed
    ALLOWED_ATTR: [],     // No attributes allowed
    KEEP_CONTENT: true,   // Keep text content, strip tags
  });
}

/**
 * Sanitize URLs to prevent javascript: and data: URIs
 *
 * @param url - Untrusted URL string
 * @returns Safe URL or empty string if malicious
 *
 * @example
 * anchor.href = sanitizeUrl(userProvidedUrl);
 */
export function sanitizeUrl(url: string): string {
  const sanitized = DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // Additional check for dangerous protocols
  const lowerUrl = sanitized.toLowerCase().trim();
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:')
  ) {
    console.warn('[Sanitizer] Blocked dangerous URL:', url);
    return '';
  }

  return sanitized;
}

/**
 * Escape HTML special characters
 * Alternative to sanitizeHtml when you want to show HTML as text
 *
 * @param text - Text containing HTML characters
 * @returns HTML-escaped string
 *
 * @example
 * element.textContent = escapeHtml('<script>alert("xss")</script>');
 * // Displays: &lt;script&gt;alert("xss")&lt;/script&gt;
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize HTML for AI chat messages
 * Stricter config for user/AI-generated content
 *
 * @param dirty - AI response or user message
 * @returns Safe HTML suitable for chat display
 */
export function sanitizeChatMessage(dirty: string): string {
  return sanitizeHtml(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'code', 'pre', 'a'],
    ALLOWED_ATTR: ['href', 'class'],
    // Extra strict for chat
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link', 'img', 'video'],
  });
}
