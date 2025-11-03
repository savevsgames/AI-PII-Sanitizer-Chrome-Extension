/**
 * Text Processing Utilities
 * Extracts and replaces text content in various AI service request/response formats
 */

/**
 * Extract all text content from request data
 * Supports ChatGPT, Claude, Gemini, and other AI service formats
 */
export function extractAllText(data: any): string {
  // Perplexity format 1: { query_str: "...", params: { dsl_query: "..." } }
  // Extract all query-related fields and combine them
  if (data.query_str && typeof data.query_str === 'string') {
    const queries = [data.query_str];

    // Also check for dsl_query in params
    if (data.params?.dsl_query && typeof data.params.dsl_query === 'string') {
      queries.push(data.params.dsl_query);
    }

    return queries.join('\n\n');
  }

  // Perplexity format 2: { query: "..." }
  if (data.query && typeof data.query === 'string') {
    return data.query;
  }

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
 * Maintains original data structure while replacing text content
 */
export function replaceAllText(data: any, substitutedText: string): any {
  const modified = JSON.parse(JSON.stringify(data)); // Deep clone

  // Perplexity format 1: query_str + dsl_query
  if (modified.query_str && typeof modified.query_str === 'string') {
    // Split substituted text back into parts (if we combined multiple fields)
    const textParts = substitutedText.split('\n\n');

    modified.query_str = textParts[0] || substitutedText;

    // Also update dsl_query if it exists
    if (modified.params?.dsl_query && typeof modified.params.dsl_query === 'string') {
      modified.params.dsl_query = textParts[1] || textParts[0] || substitutedText;
    }

    return modified;
  }

  // Perplexity format 2: query
  if (modified.query && typeof modified.query === 'string') {
    modified.query = substitutedText;
    return modified;
  }

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
 * Analyze text content for statistics
 */
export function analyzeText(text: string): {
  wordCount: number;
  characterCount: number;
  lineCount: number;
} {
  return {
    wordCount: text.split(/\s+/).filter(Boolean).length,
    characterCount: text.length,
    lineCount: text.split('\n').length,
  };
}

/**
 * Detect if data contains text content that can be processed
 */
export function hasTextContent(data: any): boolean {
  return extractAllText(data).trim().length > 0;
}

/**
 * Extract metadata about the request format
 */
export function detectFormat(data: any): 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'unknown' {
  if (data.query_str && typeof data.query_str === 'string') {
    return 'perplexity';
  }
  if (data.query && typeof data.query === 'string') {
    return 'perplexity';
  }
  if (data.messages && Array.isArray(data.messages)) {
    return 'chatgpt';
  }
  if (data.prompt && typeof data.prompt === 'string') {
    return 'claude';
  }
  if (data.contents && Array.isArray(data.contents)) {
    return 'gemini';
  }
  return 'unknown';
}
