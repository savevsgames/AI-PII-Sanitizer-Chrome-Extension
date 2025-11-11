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
export declare function sanitizeHtml(dirty: string, options?: DOMPurify.Config): string;
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
export declare function sanitizeText(dirty: string): string;
/**
 * Sanitize URLs to prevent javascript: and data: URIs
 *
 * @param url - Untrusted URL string
 * @returns Safe URL or empty string if malicious
 *
 * @example
 * anchor.href = sanitizeUrl(userProvidedUrl);
 */
export declare function sanitizeUrl(url: string): string;
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
export declare function escapeHtml(text: string): string;
/**
 * Sanitize HTML for AI chat messages
 * Stricter config for user/AI-generated content
 *
 * @param dirty - AI response or user message
 * @returns Safe HTML suitable for chat display
 */
export declare function sanitizeChatMessage(dirty: string): string;
//# sourceMappingURL=sanitizer.d.ts.map