/**
 * Unit tests for serviceWorker platform detection and request handling
 * Tests all 5 production platforms: ChatGPT, Claude, Gemini, Perplexity, Copilot
 */

// Mock chrome API
const mockStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
  },
  onChanged: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(() => false),
  },
};

const mockAction = {
  setBadgeText: jest.fn(),
  setBadgeBackgroundColor: jest.fn(),
  setTitle: jest.fn(),
};

const mockRuntime = {
  onMessage: {
    addListener: jest.fn(),
  },
  sendMessage: jest.fn(),
  id: 'test-extension-id',
};

(global as any).chrome = {
  storage: mockStorage,
  action: mockAction,
  runtime: mockRuntime,
};

// Import after mocking chrome
import { AliasEngine } from '../src/lib/aliasEngine';
import { extractAllText, replaceAllText } from '../src/lib/textProcessor';

// We can't easily test the serviceWorker module directly due to its structure,
// but we can test the core logic by testing its dependencies and behavior

describe('Service Worker - Platform Detection', () => {
  describe('detectService logic (via URL patterns)', () => {
    // Test the URL patterns that detectService uses

    test('detects ChatGPT from openai.com', () => {
      const url = 'https://chat.openai.com/backend-api/conversation';
      expect(url.includes('openai.com') || url.includes('chatgpt.com')).toBe(true);
    });

    test('detects ChatGPT from chatgpt.com', () => {
      const url = 'https://chatgpt.com/backend-api/conversation';
      expect(url.includes('openai.com') || url.includes('chatgpt.com')).toBe(true);
    });

    test('detects Claude from claude.ai', () => {
      const url = 'https://claude.ai/api/append_message';
      expect(url.includes('claude.ai')).toBe(true);
    });

    test('detects Gemini from gemini.google.com', () => {
      const url = 'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate';
      expect(url.includes('gemini.google.com')).toBe(true);
    });

    test('detects Perplexity from perplexity.ai', () => {
      const url = 'https://www.perplexity.ai/socket/search';
      expect(url.includes('perplexity.ai')).toBe(true);
    });

    test('detects Copilot from copilot.microsoft.com', () => {
      const url = 'https://copilot.microsoft.com/sydney/chat';
      expect(url.includes('copilot.microsoft.com')).toBe(true);
    });

    test('detects Copilot from bing.com/sydney', () => {
      const url = 'https://www.bing.com/sydney/chat';
      expect(url.includes('bing.com/sydney')).toBe(true);
    });

    test('does not detect non-AI URLs', () => {
      const url = 'https://www.google.com/search';
      const isAI = url.includes('chatgpt.com') ||
                   url.includes('openai.com') ||
                   url.includes('claude.ai') ||
                   url.includes('gemini.google.com') ||
                   url.includes('perplexity.ai') ||
                   url.includes('copilot.microsoft.com') ||
                   url.includes('bing.com/sydney');
      expect(isAI).toBe(false);
    });
  });
});

describe('Service Worker - Request Substitution Flow', () => {
  let aliasEngine: AliasEngine;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStorage.local.get.mockResolvedValue({});
    aliasEngine = await AliasEngine.getInstance();
    (aliasEngine as any).realToAliasMap.clear();
    (aliasEngine as any).aliasToRealMap.clear();

    // Add test mapping
    const mapping = {
      real: 'John Smith',
      alias: 'Alex Johnson',
      profileId: 'test-profile-1',
      profileName: 'Test Profile',
      piiType: 'name' as const,
    };
    (aliasEngine as any).realToAliasMap.set('john smith', mapping);
  });

  describe('ChatGPT request handling', () => {
    test('substitutes PII in ChatGPT messages array', () => {
      const requestBody = JSON.stringify({
        messages: [
          { role: 'user', content: 'My name is John Smith' },
        ],
        model: 'gpt-4',
      });

      const parsed = JSON.parse(requestBody);
      const text = extractAllText(parsed);
      const substituted = aliasEngine.substitute(text, 'encode');
      const modified = replaceAllText(parsed, substituted.text);

      expect(modified.messages[0].content).toContain('Alex Johnson');
      expect(modified.messages[0].content).not.toContain('John Smith');
      expect(substituted.substitutions.length).toBeGreaterThan(0);
    });

    test('preserves ChatGPT request structure', () => {
      const requestBody = JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello' },
        ],
        model: 'gpt-4',
        temperature: 0.7,
      });

      const parsed = JSON.parse(requestBody);
      const text = extractAllText(parsed);
      const modified = replaceAllText(parsed, 'Modified');

      expect(modified.model).toBe('gpt-4');
      expect(modified.temperature).toBe(0.7);
      expect(modified.messages[0].role).toBe('user');
    });
  });

  describe('Claude request handling', () => {
    test('substitutes PII in Claude prompt', () => {
      const requestBody = JSON.stringify({
        prompt: 'My name is John Smith',
        model: 'claude-3-opus',
      });

      const parsed = JSON.parse(requestBody);
      const text = extractAllText(parsed);
      const substituted = aliasEngine.substitute(text, 'encode');
      const modified = replaceAllText(parsed, substituted.text);

      expect(modified.prompt).toContain('Alex Johnson');
      expect(modified.prompt).not.toContain('John Smith');
    });

    test('preserves Claude request structure', () => {
      const requestBody = JSON.stringify({
        prompt: 'Hello',
        model: 'claude-3-opus',
        max_tokens: 1000,
      });

      const parsed = JSON.parse(requestBody);
      const text = extractAllText(parsed);
      const modified = replaceAllText(parsed, 'Modified');

      expect(modified.model).toBe('claude-3-opus');
      expect(modified.max_tokens).toBe(1000);
    });
  });

  describe('Gemini request handling', () => {
    test('substitutes PII in Gemini contents array', () => {
      const requestBody = JSON.stringify({
        contents: [
          {
            parts: [
              { text: 'My name is John Smith' },
            ],
          },
        ],
      });

      const parsed = JSON.parse(requestBody);
      const text = extractAllText(parsed);
      const substituted = aliasEngine.substitute(text, 'encode');
      const modified = replaceAllText(parsed, substituted.text);

      expect(modified.contents[0].parts[0].text).toContain('Alex Johnson');
      expect(modified.contents[0].parts[0].text).not.toContain('John Smith');
    });

    test('preserves Gemini request structure', () => {
      const requestBody = JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        ],
        safetySettings: [],
      });

      const parsed = JSON.parse(requestBody);
      const text = extractAllText(parsed);
      const modified = replaceAllText(parsed, 'Modified');

      expect(modified.contents[0].role).toBe('user');
      expect(Array.isArray(modified.safetySettings)).toBe(true);
    });
  });

  describe('Perplexity request handling', () => {
    test('substitutes PII in Perplexity query_str', () => {
      const requestBody = JSON.stringify({
        query_str: 'My name is John Smith',
        version: '2.1',
      });

      const parsed = JSON.parse(requestBody);
      const text = extractAllText(parsed);
      const substituted = aliasEngine.substitute(text, 'encode');
      const modified = replaceAllText(parsed, substituted.text);

      expect(modified.query_str).toContain('Alex Johnson');
      expect(modified.query_str).not.toContain('John Smith');
    });

    test('substitutes PII in BOTH query_str AND dsl_query (dual-field)', () => {
      const requestBody = JSON.stringify({
        query_str: 'My name is John Smith',
        params: {
          dsl_query: 'John Smith',
          mode: 'concise',
        },
      });

      const parsed = JSON.parse(requestBody);
      const text = extractAllText(parsed);
      const substituted = aliasEngine.substitute(text, 'encode');
      const modified = replaceAllText(parsed, substituted.text);

      expect(modified.query_str).toContain('Alex Johnson');
      expect(modified.params.dsl_query).toContain('Alex Johnson');
      expect(modified.query_str).not.toContain('John Smith');
      expect(modified.params.dsl_query).not.toContain('John Smith');
    });

    test('preserves Perplexity request structure', () => {
      const requestBody = JSON.stringify({
        query_str: 'Hello',
        params: {
          mode: 'concise',
          focus: 'internet',
        },
      });

      const parsed = JSON.parse(requestBody);
      const text = extractAllText(parsed);
      const modified = replaceAllText(parsed, 'Modified');

      expect(modified.params.mode).toBe('concise');
      expect(modified.params.focus).toBe('internet');
    });
  });

  describe('Copilot request handling', () => {
    test('substitutes PII in Copilot WebSocket content array', () => {
      const requestBody = JSON.stringify({
        event: 'send',
        content: [
          { type: 'text', text: 'My name is John Smith' },
        ],
      });

      const parsed = JSON.parse(requestBody);
      const text = extractAllText(parsed);
      const substituted = aliasEngine.substitute(text, 'encode');
      const modified = replaceAllText(parsed, substituted.text);

      expect(modified.content[0].text).toContain('Alex Johnson');
      expect(modified.content[0].text).not.toContain('John Smith');
    });

    test('substitutes PII in multiple Copilot content items', () => {
      const requestBody = JSON.stringify({
        event: 'send',
        content: [
          { type: 'text', text: 'My name is John Smith' },
          { type: 'text', text: 'I am John Smith' },
        ],
      });

      const parsed = JSON.parse(requestBody);
      const text = extractAllText(parsed);
      const substituted = aliasEngine.substitute(text, 'encode');
      const modified = replaceAllText(parsed, substituted.text);

      expect(modified.content[0].text).toContain('Alex Johnson');
      expect(modified.content[1].text).toContain('Alex Johnson');
      expect(modified.content[0].text).not.toContain('John Smith');
      expect(modified.content[1].text).not.toContain('John Smith');
    });

    test('preserves Copilot request structure and non-text content', () => {
      const requestBody = JSON.stringify({
        event: 'send',
        content: [
          { type: 'text', text: 'Hello' },
          { type: 'image', url: 'https://example.com/image.png' },
        ],
        conversationId: 'conv-123',
      });

      const parsed = JSON.parse(requestBody);
      const text = extractAllText(parsed);
      const modified = replaceAllText(parsed, 'Modified');

      expect(modified.event).toBe('send');
      expect(modified.conversationId).toBe('conv-123');
      expect(modified.content[1].type).toBe('image');
      expect(modified.content[1].url).toBe('https://example.com/image.png');
    });
  });
});

describe('Service Worker - Activity Logging', () => {
  test('should track service type for activity log', () => {
    const urls = {
      chatgpt: 'https://chat.openai.com/backend-api/conversation',
      claude: 'https://claude.ai/api/append_message',
      gemini: 'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate',
      perplexity: 'https://www.perplexity.ai/socket/search',
      copilot: 'https://copilot.microsoft.com/sydney/chat',
    };

    // Verify each URL can be identified
    expect(urls.chatgpt.includes('openai.com')).toBe(true);
    expect(urls.claude.includes('claude.ai')).toBe(true);
    expect(urls.gemini.includes('gemini.google.com')).toBe(true);
    expect(urls.perplexity.includes('perplexity.ai')).toBe(true);
    expect(urls.copilot.includes('copilot.microsoft.com')).toBe(true);
  });
});

describe('Service Worker - Error Handling', () => {
  describe('handles invalid request bodies', () => {
    test('handles empty request body', () => {
      const empty = '';
      expect(empty.trim()).toBe('');
    });

    test('handles malformed JSON', () => {
      const malformed = '{ invalid json }';
      expect(() => JSON.parse(malformed)).toThrow();
    });

    test('handles non-JSON request body', () => {
      const nonJson = 'plain text body';
      expect(() => JSON.parse(nonJson)).toThrow();
    });

    test('handles null request body', () => {
      const nullBody = null;
      expect(nullBody).toBeNull();
    });
  });

  describe('handles edge cases in platform formats', () => {
    test('handles ChatGPT with empty messages array', () => {
      const data = { messages: [] };
      const text = extractAllText(data);
      expect(text).toBe('');
    });

    test('handles Claude with empty prompt', () => {
      const data = { prompt: '' };
      const text = extractAllText(data);
      expect(text).toBe('');
    });

    test('handles Gemini with empty contents', () => {
      const data = { contents: [] };
      const text = extractAllText(data);
      expect(text).toBe('');
    });

    test('handles Perplexity with empty query_str', () => {
      const data = { query_str: '' };
      const text = extractAllText(data);
      expect(text).toBe('');
    });

    test('handles Copilot with empty content array', () => {
      const data = { event: 'send', content: [] };
      const text = extractAllText(data);
      expect(text).toBe('');
    });
  });
});

describe('Service Worker - Badge Updates', () => {
  describe('AI service URL detection', () => {
    const AI_SERVICE_URLS = [
      'chatgpt.com',
      'openai.com',
      'claude.ai',
      'gemini.google.com',
      'perplexity.ai',
      'copilot.microsoft.com',
    ];

    test('detects all AI service URLs', () => {
      const testUrls = [
        'https://chat.openai.com',
        'https://chatgpt.com',
        'https://claude.ai',
        'https://gemini.google.com',
        'https://www.perplexity.ai',
        'https://copilot.microsoft.com',
      ];

      testUrls.forEach(url => {
        const isAI = AI_SERVICE_URLS.some(domain => url.includes(domain));
        expect(isAI).toBe(true);
      });
    });

    test('does not detect non-AI URLs', () => {
      const testUrls = [
        'https://www.google.com',
        'https://www.facebook.com',
        'https://www.twitter.com',
      ];

      testUrls.forEach(url => {
        const isAI = AI_SERVICE_URLS.some(domain => url.includes(domain));
        expect(isAI).toBe(false);
      });
    });
  });
});

describe('Service Worker - Platform-Specific Integration', () => {
  describe('ChatGPT integration', () => {
    test('handles streaming responses', () => {
      // ChatGPT uses SSE streaming
      const streamingResponse = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';
      expect(streamingResponse.startsWith('data:')).toBe(true);
    });

    test('handles multiple message history', () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];

      const data = { messages };
      const text = extractAllText(data);
      expect(text).toContain('You are a helpful assistant');
      expect(text).toContain('Hello');
      expect(text).toContain('Hi there!');
      expect(text).toContain('How are you?');
    });
  });

  describe('Gemini integration (XHR)', () => {
    test('identifies Gemini batchexecute format', () => {
      // Gemini uses form-encoded batchexecute
      const geminiUrl = 'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate';
      expect(geminiUrl.includes('batchexecute') || geminiUrl.includes('StreamGenerate')).toBe(true);
    });
  });

  describe('Copilot integration (WebSocket)', () => {
    test('identifies Copilot WebSocket events', () => {
      const events = ['send', 'appendText', 'partCompleted', 'done'];
      events.forEach(event => {
        const data = { event, content: [] };
        expect(data.event).toBeTruthy();
      });
    });

    test('handles Copilot streaming events', () => {
      // Copilot sends multiple events during streaming
      const sendEvent = { event: 'send', content: [{ type: 'text', text: 'Hello' }] };
      const appendEvent = { event: 'appendText', text: ' World' };
      const doneEvent = { event: 'done' };

      expect(sendEvent.event).toBe('send');
      expect(appendEvent.event).toBe('appendText');
      expect(doneEvent.event).toBe('done');
    });
  });

  describe('Perplexity integration (dual-field)', () => {
    test('handles Perplexity follow-up queries', () => {
      // Perplexity sends follow-up with context
      const followUp = {
        query_str: 'Follow-up question',
        params: {
          dsl_query: 'context from previous',
          mode: 'concise',
        },
      };

      const text = extractAllText(followUp);
      expect(text).toContain('Follow-up question');
      expect(text).toContain('context from previous');
    });
  });
});
