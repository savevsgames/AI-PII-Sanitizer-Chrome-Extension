/**
 * Unit tests for textProcessor
 * Tests all 5 production platform formats: ChatGPT, Claude, Gemini, Perplexity, Copilot
 */

import {
  extractAllText,
  replaceAllText,
  detectFormat,
  hasTextContent,
  analyzeText,
} from '../src/lib/textProcessor';

describe('textProcessor - Platform Format Detection', () => {
  test('detects ChatGPT format (messages array)', () => {
    const data = {
      messages: [{ role: 'user', content: 'Hello' }],
    };
    expect(detectFormat(data)).toBe('chatgpt');
  });

  test('detects Claude format (prompt string)', () => {
    const data = {
      prompt: 'Hello',
    };
    expect(detectFormat(data)).toBe('claude');
  });

  test('detects Gemini format (contents array)', () => {
    const data = {
      contents: [{ parts: [{ text: 'Hello' }] }],
    };
    expect(detectFormat(data)).toBe('gemini');
  });

  test('detects Perplexity format 1 (query_str)', () => {
    const data = {
      query_str: 'Hello',
    };
    expect(detectFormat(data)).toBe('perplexity');
  });

  test('detects Perplexity format 2 (query)', () => {
    const data = {
      query: 'Hello',
    };
    expect(detectFormat(data)).toBe('perplexity');
  });

  test('detects Copilot format (WebSocket event)', () => {
    const data = {
      event: 'send',
      content: [{ type: 'text', text: 'Hello' }],
    };
    expect(detectFormat(data)).toBe('copilot');
  });

  test('returns unknown for unrecognized format', () => {
    const data = {
      someField: 'Hello',
    };
    expect(detectFormat(data)).toBe('unknown');
  });
});

describe('textProcessor - ChatGPT Format', () => {
  describe('extractAllText', () => {
    test('extracts from simple string content', () => {
      const data = {
        messages: [
          { role: 'user', content: 'Hello GPT' },
          { role: 'assistant', content: 'Hello user' },
        ],
      };
      const text = extractAllText(data);
      expect(text).toBe('Hello GPT\n\nHello user');
    });

    test('extracts from nested parts format', () => {
      const data = {
        messages: [
          {
            role: 'user',
            content: {
              content_type: 'text',
              parts: ['Hello GPT'],
            },
          },
        ],
      };
      const text = extractAllText(data);
      expect(text).toBe('Hello GPT');
    });

    test('extracts from array content blocks', () => {
      const data = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Part 1' },
              { type: 'text', text: 'Part 2' },
            ],
          },
        ],
      };
      const text = extractAllText(data);
      expect(text).toBe('Part 1\nPart 2');
    });

    test('handles mixed content types', () => {
      const data = {
        messages: [
          { role: 'system', content: 'System message' },
          { role: 'user', content: 'User message' },
        ],
      };
      const text = extractAllText(data);
      expect(text).toContain('System message');
      expect(text).toContain('User message');
    });

    test('filters out empty messages', () => {
      const data = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: '' },
          { role: 'user', content: 'World' },
        ],
      };
      const text = extractAllText(data);
      expect(text).toBe('Hello\n\nWorld');
    });
  });

  describe('replaceAllText', () => {
    test('replaces simple string content', () => {
      const data = {
        messages: [
          { role: 'user', content: 'Hello GPT' },
        ],
      };
      const result = replaceAllText(data, 'Goodbye GPT');
      expect(result.messages[0].content).toBe('Goodbye GPT');
    });

    test('replaces nested parts format', () => {
      const data = {
        messages: [
          {
            role: 'user',
            content: {
              content_type: 'text',
              parts: ['Hello GPT'],
            },
          },
        ],
      };
      const result = replaceAllText(data, 'Goodbye GPT');
      expect(result.messages[0].content.parts[0]).toBe('Goodbye GPT');
    });

    test('replaces multiple messages', () => {
      const data = {
        messages: [
          { role: 'user', content: 'Message 1' },
          { role: 'assistant', content: 'Message 2' },
        ],
      };
      const result = replaceAllText(data, 'New 1\n\nNew 2');
      expect(result.messages[0].content).toBe('New 1');
      expect(result.messages[1].content).toBe('New 2');
    });

    test('preserves message structure', () => {
      const data = {
        messages: [
          { role: 'user', content: 'Hello', metadata: { id: 123 } },
        ],
      };
      const result = replaceAllText(data, 'Goodbye');
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].metadata.id).toBe(123);
    });
  });
});

describe('textProcessor - Claude Format', () => {
  describe('extractAllText', () => {
    test('extracts from prompt string', () => {
      const data = {
        prompt: 'Hello Claude',
      };
      const text = extractAllText(data);
      expect(text).toBe('Hello Claude');
    });

    test('handles empty prompt', () => {
      const data = {
        prompt: '',
      };
      const text = extractAllText(data);
      expect(text).toBe('');
    });
  });

  describe('replaceAllText', () => {
    test('replaces prompt string', () => {
      const data = {
        prompt: 'Hello Claude',
      };
      const result = replaceAllText(data, 'Goodbye Claude');
      expect(result.prompt).toBe('Goodbye Claude');
    });

    test('preserves other fields', () => {
      const data = {
        prompt: 'Hello',
        model: 'claude-3-opus',
        max_tokens: 1000,
      };
      const result = replaceAllText(data, 'Goodbye');
      expect(result.model).toBe('claude-3-opus');
      expect(result.max_tokens).toBe(1000);
    });
  });
});

describe('textProcessor - Gemini Format', () => {
  describe('extractAllText', () => {
    test('extracts from contents array', () => {
      const data = {
        contents: [
          {
            parts: [
              { text: 'Hello Gemini' },
            ],
          },
        ],
      };
      const text = extractAllText(data);
      expect(text).toBe('Hello Gemini');
    });

    test('extracts from multiple contents', () => {
      const data = {
        contents: [
          { parts: [{ text: 'Part 1' }] },
          { parts: [{ text: 'Part 2' }] },
        ],
      };
      const text = extractAllText(data);
      expect(text).toBe('Part 1\n\nPart 2');
    });

    test('extracts from multiple parts', () => {
      const data = {
        contents: [
          {
            parts: [
              { text: 'Sentence 1' },
              { text: 'Sentence 2' },
            ],
          },
        ],
      };
      const text = extractAllText(data);
      expect(text).toBe('Sentence 1\n\nSentence 2');
    });

    test('handles missing parts', () => {
      const data = {
        contents: [
          { parts: null },
          { parts: [{ text: 'Valid text' }] },
        ],
      };
      const text = extractAllText(data);
      expect(text).toBe('Valid text');
    });
  });

  describe('replaceAllText', () => {
    test('replaces content in parts', () => {
      const data = {
        contents: [
          {
            parts: [
              { text: 'Hello Gemini' },
            ],
          },
        ],
      };
      const result = replaceAllText(data, 'Goodbye Gemini');
      expect(result.contents[0].parts[0].text).toBe('Goodbye Gemini');
    });

    test('replaces multiple parts', () => {
      const data = {
        contents: [
          {
            parts: [
              { text: 'Part 1' },
              { text: 'Part 2' },
            ],
          },
        ],
      };
      const result = replaceAllText(data, 'New 1\n\nNew 2');
      expect(result.contents[0].parts[0].text).toBe('New 1');
      expect(result.contents[0].parts[1].text).toBe('New 2');
    });

    test('preserves part structure', () => {
      const data = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Hello', metadata: { timestamp: 123 } },
            ],
          },
        ],
      };
      const result = replaceAllText(data, 'Goodbye');
      expect(result.contents[0].role).toBe('user');
      expect(result.contents[0].parts[0].metadata.timestamp).toBe(123);
    });
  });
});

describe('textProcessor - Perplexity Format', () => {
  describe('extractAllText', () => {
    test('extracts from query_str only', () => {
      const data = {
        query_str: 'Hello Perplexity',
      };
      const text = extractAllText(data);
      expect(text).toBe('Hello Perplexity');
    });

    test('extracts from query_str AND dsl_query (dual-field)', () => {
      const data = {
        query_str: 'Main query',
        params: {
          dsl_query: 'DSL query',
        },
      };
      const text = extractAllText(data);
      expect(text).toBe('Main query\n\nDSL query');
    });

    test('extracts from simple query format', () => {
      const data = {
        query: 'Simple query',
      };
      const text = extractAllText(data);
      expect(text).toBe('Simple query');
    });

    test('prioritizes query_str over query', () => {
      const data = {
        query_str: 'Query string',
        query: 'Simple query',
      };
      const text = extractAllText(data);
      expect(text).toContain('Query string');
    });
  });

  describe('replaceAllText', () => {
    test('replaces query_str only', () => {
      const data = {
        query_str: 'Hello Perplexity',
      };
      const result = replaceAllText(data, 'Goodbye Perplexity');
      expect(result.query_str).toBe('Goodbye Perplexity');
    });

    test('replaces BOTH query_str AND dsl_query (dual-field)', () => {
      const data = {
        query_str: 'Main query',
        params: {
          dsl_query: 'DSL query',
        },
      };
      const result = replaceAllText(data, 'New main\n\nNew DSL');
      expect(result.query_str).toBe('New main');
      expect(result.params.dsl_query).toBe('New DSL');
    });

    test('replaces simple query format', () => {
      const data = {
        query: 'Simple query',
      };
      const result = replaceAllText(data, 'New query');
      expect(result.query).toBe('New query');
    });

    test('preserves other params fields', () => {
      const data = {
        query_str: 'Query',
        params: {
          dsl_query: 'DSL',
          mode: 'search',
          limit: 10,
        },
      };
      const result = replaceAllText(data, 'New\n\nNew DSL');
      expect(result.params.mode).toBe('search');
      expect(result.params.limit).toBe(10);
    });
  });
});

describe('textProcessor - Copilot Format', () => {
  describe('extractAllText', () => {
    test('extracts from WebSocket send event', () => {
      const data = {
        event: 'send',
        content: [
          { type: 'text', text: 'Hello Copilot' },
        ],
      };
      const text = extractAllText(data);
      expect(text).toBe('Hello Copilot');
    });

    test('extracts from multiple content items', () => {
      const data = {
        event: 'send',
        content: [
          { type: 'text', text: 'Part 1' },
          { type: 'text', text: 'Part 2' },
        ],
      };
      const text = extractAllText(data);
      expect(text).toBe('Part 1\n\nPart 2');
    });

    test('filters non-text content types', () => {
      const data = {
        event: 'send',
        content: [
          { type: 'text', text: 'Text content' },
          { type: 'image', url: 'http://example.com/img.png' },
          { type: 'text', text: 'More text' },
        ],
      };
      const text = extractAllText(data);
      expect(text).toBe('Text content\n\nMore text');
    });

    test('returns empty for non-send events', () => {
      const data = {
        event: 'appendText',
        content: [
          { type: 'text', text: 'Should not extract' },
        ],
      };
      const text = extractAllText(data);
      expect(text).toBe('');
    });
  });

  describe('replaceAllText', () => {
    test('replaces text in content array', () => {
      const data = {
        event: 'send',
        content: [
          { type: 'text', text: 'Hello Copilot' },
        ],
      };
      const result = replaceAllText(data, 'Goodbye Copilot');
      expect(result.content[0].text).toBe('Goodbye Copilot');
    });

    test('replaces multiple content items', () => {
      const data = {
        event: 'send',
        content: [
          { type: 'text', text: 'Part 1' },
          { type: 'text', text: 'Part 2' },
        ],
      };
      const result = replaceAllText(data, 'New 1\n\nNew 2');
      expect(result.content[0].text).toBe('New 1');
      expect(result.content[1].text).toBe('New 2');
    });

    test('preserves non-text content types', () => {
      const data = {
        event: 'send',
        content: [
          { type: 'text', text: 'Text' },
          { type: 'image', url: 'http://example.com/img.png' },
        ],
      };
      const result = replaceAllText(data, 'New text');
      expect(result.content[0].text).toBe('New text');
      expect(result.content[1].url).toBe('http://example.com/img.png');
    });

    test('preserves event and other fields', () => {
      const data = {
        event: 'send',
        content: [
          { type: 'text', text: 'Hello' },
        ],
        metadata: { id: 456 },
      };
      const result = replaceAllText(data, 'Goodbye');
      expect(result.event).toBe('send');
      expect(result.metadata.id).toBe(456);
    });
  });
});

describe('textProcessor - Utility Functions', () => {
  describe('hasTextContent', () => {
    test('returns true for ChatGPT with content', () => {
      const data = {
        messages: [{ role: 'user', content: 'Hello' }],
      };
      expect(hasTextContent(data)).toBe(true);
    });

    test('returns false for ChatGPT with empty content', () => {
      const data = {
        messages: [{ role: 'user', content: '' }],
      };
      expect(hasTextContent(data)).toBe(false);
    });

    test('returns false for unknown format', () => {
      const data = {
        randomField: 'value',
      };
      expect(hasTextContent(data)).toBe(false);
    });

    test('returns true for all platform formats with content', () => {
      const formats = [
        { messages: [{ role: 'user', content: 'ChatGPT' }] },
        { prompt: 'Claude' },
        { contents: [{ parts: [{ text: 'Gemini' }] }] },
        { query_str: 'Perplexity' },
        { event: 'send', content: [{ type: 'text', text: 'Copilot' }] },
      ];

      formats.forEach((data) => {
        expect(hasTextContent(data)).toBe(true);
      });
    });
  });

  describe('analyzeText', () => {
    test('counts words correctly', () => {
      const result = analyzeText('Hello world from AI');
      expect(result.wordCount).toBe(4);
    });

    test('counts characters correctly', () => {
      const result = analyzeText('Hello');
      expect(result.characterCount).toBe(5);
    });

    test('counts lines correctly', () => {
      const result = analyzeText('Line 1\nLine 2\nLine 3');
      expect(result.lineCount).toBe(3);
    });

    test('handles empty string', () => {
      const result = analyzeText('');
      expect(result.wordCount).toBe(0);
      expect(result.characterCount).toBe(0);
      expect(result.lineCount).toBe(1);
    });

    test('handles multiple spaces', () => {
      const result = analyzeText('Hello    world');
      expect(result.wordCount).toBe(2);
    });
  });
});

describe('textProcessor - Edge Cases', () => {
  test('handles null data gracefully', () => {
    expect(extractAllText(null)).toBe('');
    expect(detectFormat(null)).toBe('unknown');
    expect(hasTextContent(null)).toBe(false);
  });

  test('handles undefined data gracefully', () => {
    expect(extractAllText(undefined)).toBe('');
    expect(detectFormat(undefined)).toBe('unknown');
    expect(hasTextContent(undefined)).toBe(false);
  });

  test('handles empty object', () => {
    expect(extractAllText({})).toBe('');
    expect(detectFormat({})).toBe('unknown');
    expect(hasTextContent({})).toBe(false);
  });

  test('deep clones data in replaceAllText', () => {
    const original = {
      messages: [{ role: 'user', content: 'Original' }],
    };
    const result = replaceAllText(original, 'Modified');

    expect(result.messages[0].content).toBe('Modified');
    expect(original.messages[0].content).toBe('Original'); // Original unchanged
  });

  test('handles malformed ChatGPT messages', () => {
    const data = {
      messages: [
        null,
        { role: 'user' }, // Missing content
        { role: 'user', content: 'Valid' },
        undefined,
      ],
    };
    const text = extractAllText(data);
    expect(text).toContain('Valid');
  });

  test('handles malformed Gemini contents', () => {
    const data = {
      contents: [
        null,
        { parts: null },
        { parts: [null, { text: 'Valid' }] },
      ],
    };
    const text = extractAllText(data);
    expect(text).toContain('Valid');
  });
});
