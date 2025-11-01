/**
 * Unit tests for APIKeyDetector
 * Tests detection of various API key formats and redaction
 */

import { APIKeyDetector, DetectedKey } from '../src/lib/apiKeyDetector';

describe('APIKeyDetector', () => {
  describe('detect', () => {
    describe('OpenAI Keys', () => {
      test('detects standard OpenAI API keys', () => {
        const text = 'My key is sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB';
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(1);
        expect(detected[0].format).toBe('openai');
        expect(detected[0].value).toContain('sk-');
      });

      test('detects OpenAI project keys', () => {
        const text = 'My key is sk-proj-1234567890abcdefghijklmnopqrstuvwxyz1234567890ABCD';
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(1);
        expect(detected[0].format).toBe('openai');
        expect(detected[0].value).toContain('sk-proj-');
      });

      test('does not detect incomplete OpenAI keys', () => {
        const text = 'My key is sk-tooshort';
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(0);
      });
    });

    describe('Anthropic Keys', () => {
      test('detects Anthropic API keys', () => {
        const text = 'My key is sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrs';
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(1);
        expect(detected[0].format).toBe('anthropic');
        expect(detected[0].value).toContain('sk-ant-');
      });
    });

    describe('Google Keys', () => {
      test('detects Google API keys', () => {
        const text = 'My key is AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe';
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(1);
        expect(detected[0].format).toBe('google');
        expect(detected[0].value).toContain('AIza');
      });
    });

    describe('AWS Keys', () => {
      test('detects AWS access keys (AKIA)', () => {
        const text = 'My key is AKIAIOSFODNN7EXAMPLE';
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(1);
        expect(detected[0].format).toBe('aws');
        expect(detected[0].value).toContain('AKIA');
      });

      test('detects AWS session keys (ASIA)', () => {
        const text = 'My key is ASIAIOSFODNN7EXAMPLE';
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(1);
        expect(detected[0].format).toBe('aws');
        expect(detected[0].value).toContain('ASIA');
      });
    });

    describe('GitHub Keys', () => {
      test('detects GitHub personal access tokens', () => {
        const text = 'My token is ghp_1234567890abcdefghijklmnopqrstuvwxyz';
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(1);
        expect(detected[0].format).toBe('github');
        expect(detected[0].value).toContain('ghp_');
      });

      test('detects GitHub OAuth tokens', () => {
        const text = 'My token is ghs_1234567890abcdefghijklmnopqrstuvwxyz';
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(1);
        expect(detected[0].format).toBe('github');
        expect(detected[0].value).toContain('ghs_');
      });
    });

    describe('Stripe Keys', () => {
      test('detects Stripe secret keys (live)', () => {
        // Use template to avoid GitHub secret scanning
        const text = `My key is ${'sk_live_'}${'FAKETESTKEY1234567890ABCD'}`;
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(1);
        expect(detected[0].format).toBe('stripe');
        expect(detected[0].value).toContain('sk_live_');
      });

      test('detects Stripe secret keys (test)', () => {
        // Use template to avoid GitHub secret scanning
        const text = `My key is ${'sk_test_'}${'FAKETESTKEY1234567890ABCD'}`;
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(1);
        expect(detected[0].format).toBe('stripe');
        expect(detected[0].value).toContain('sk_test_');
      });

      test('detects Stripe publishable keys', () => {
        // Use template to avoid GitHub secret scanning
        const text = `My key is ${'pk_live_'}${'FAKETESTKEY1234567890ABCD'}`;
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(1);
        expect(detected[0].format).toBe('stripe');
        expect(detected[0].value).toContain('pk_live_');
      });
    });

    describe('Multiple Keys', () => {
      test('detects multiple keys in one text', () => {
        const text = `
          OpenAI: sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB
          GitHub: ghp_1234567890abcdefghijklmnopqrstuvwxyz
          Stripe: ${'sk_live_'}${'FAKETESTKEY1234567890ABCD'}
        `;
        const detected = APIKeyDetector.detect(text);

        expect(detected.length).toBe(3);
        expect(detected.map(d => d.format)).toContain('openai');
        expect(detected.map(d => d.format)).toContain('github');
        expect(detected.map(d => d.format)).toContain('stripe');
      });

      test('deduplicates keys at the same position', () => {
        const text = `${'sk_live_'}${'FAKETESTKEY1234567890ABCD'}`;
        const detected = APIKeyDetector.detect(text);

        // Should only detect once even if pattern matches multiple formats
        const uniquePositions = new Set(detected.map(d => `${d.startIndex}-${d.endIndex}`));
        expect(uniquePositions.size).toBeLessThanOrEqual(detected.length);
      });
    });

    describe('Options', () => {
      test('excludes generic patterns by default', () => {
        const text = 'Random hex: 1234567890abcdef1234567890abcdef';
        const detected = APIKeyDetector.detect(text);

        // Should not detect generic hex without includeGeneric flag
        expect(detected.length).toBe(0);
      });

      test('includes generic patterns when requested', () => {
        const text = 'Random hex: 1234567890abcdef1234567890abcdef';
        const detected = APIKeyDetector.detect(text, { includeGeneric: true });

        expect(detected.length).toBeGreaterThan(0);
        expect(detected[0].format).toBe('generic');
      });

      test('detects custom patterns', () => {
        const text = 'My custom key: MYAPP-SECRET-12345';
        const customPattern = /MYAPP-SECRET-\d+/;
        const detected = APIKeyDetector.detect(text, {
          customPatterns: [customPattern],
        });

        expect(detected.length).toBe(1);
        expect(detected[0].format).toBe('custom');
        expect(detected[0].value).toBe('MYAPP-SECRET-12345');
      });

      test('detects stored keys from vault', () => {
        const text = 'Using my stored key: my-secret-api-key-12345';
        const detected = APIKeyDetector.detect(text, {
          storedKeys: ['my-secret-api-key-12345'],
        });

        expect(detected.length).toBe(1);
        expect(detected[0].value).toBe('my-secret-api-key-12345');
      });
    });

    describe('Context', () => {
      test('includes surrounding context', () => {
        const text = 'Here is my API key: sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB for testing';
        const detected = APIKeyDetector.detect(text);

        expect(detected[0].context).toBeDefined();
        expect(detected[0].context).toContain('Here is my API key');
        expect(detected[0].context).toContain('for testing');
      });

      test('handles keys at the start of text', () => {
        const text = 'sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB is my key';
        const detected = APIKeyDetector.detect(text);

        expect(detected[0].context).toBeDefined();
        expect(detected[0].startIndex).toBe(0);
      });

      test('handles keys at the end of text', () => {
        const text = 'My key is sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB';
        const detected = APIKeyDetector.detect(text);

        expect(detected[0].context).toBeDefined();
      });
    });

    describe('Indices', () => {
      test('returns correct start and end indices', () => {
        const text = 'Prefix sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB suffix';
        const detected = APIKeyDetector.detect(text);

        expect(detected[0].startIndex).toBe(7); // After "Prefix "
        expect(detected[0].endIndex).toBe(detected[0].startIndex + detected[0].value.length);
        expect(text.substring(detected[0].startIndex, detected[0].endIndex)).toBe(detected[0].value);
      });
    });
  });

  describe('redact', () => {
    describe('Full Redaction', () => {
      test('fully redacts keys', () => {
        const text = 'My key is sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB';
        const detected = APIKeyDetector.detect(text);
        const redacted = APIKeyDetector.redact(text, detected, 'full');

        expect(redacted).toBe('My key is [REDACTED_API_KEY]');
        expect(redacted).not.toContain('sk-');
      });

      test('redacts multiple keys', () => {
        const text = 'OpenAI: sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB, GitHub: ghp_1234567890abcdefghijklmnopqrstuvwxyz';
        const detected = APIKeyDetector.detect(text);
        const redacted = APIKeyDetector.redact(text, detected, 'full');

        expect(redacted).toContain('[REDACTED_API_KEY]');
        expect(redacted).not.toContain('sk-');
        expect(redacted).not.toContain('ghp_');
      });
    });

    describe('Partial Redaction', () => {
      test('shows first and last 4 characters', () => {
        const key = 'sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB';
        const text = `My key is ${key}`;
        const detected = APIKeyDetector.detect(text);
        const redacted = APIKeyDetector.redact(text, detected, 'partial');

        expect(redacted).toContain('sk-1');
        expect(redacted).toContain('90AB');
        expect(redacted).toContain('•');
      });

      test('handles short keys', () => {
        const detectedKeys: DetectedKey[] = [{
          value: 'SHORTKEY',
          format: 'generic',
          startIndex: 10,
          endIndex: 18,
        }];
        const text = 'My key is SHORTKEY here';
        const redacted = APIKeyDetector.redact(text, detectedKeys, 'partial');

        expect(redacted).toContain('SHOR');
        expect(redacted).toContain('TKEY');
      });
    });

    describe('Placeholder Redaction', () => {
      test('uses format-specific placeholders', () => {
        const text = 'OpenAI: sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB';
        const detected = APIKeyDetector.detect(text);
        const redacted = APIKeyDetector.redact(text, detected, 'placeholder');

        expect(redacted).toBe('OpenAI: [OPENAI_KEY]');
      });

      test('handles multiple formats', () => {
        const text = 'OpenAI: sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB, GitHub: ghp_1234567890abcdefghijklmnopqrstuvwxyz';
        const detected = APIKeyDetector.detect(text);
        const redacted = APIKeyDetector.redact(text, detected, 'placeholder');

        expect(redacted).toContain('[OPENAI_KEY]');
        expect(redacted).toContain('[GITHUB_KEY]');
      });
    });

    describe('Edge Cases', () => {
      test('handles empty detection array', () => {
        const text = 'No keys here';
        const redacted = APIKeyDetector.redact(text, [], 'full');

        expect(redacted).toBe(text);
      });

      test('preserves text order with multiple keys', () => {
        const text = `First: sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB, Second: ghp_1234567890abcdefghijklmnopqrstuvwxyz, Third: ${'sk_live_'}${'FAKETESTKEY1234567890ABCD'}`;
        const detected = APIKeyDetector.detect(text);
        const redacted = APIKeyDetector.redact(text, detected, 'full');

        expect(redacted).toBe('First: [REDACTED_API_KEY], Second: [REDACTED_API_KEY], Third: [REDACTED_API_KEY]');
      });
    });
  });

  describe('detectFormat', () => {
    test('detects OpenAI format', () => {
      const format = APIKeyDetector.detectFormat('sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB');
      expect(format).toBe('openai');
    });

    test('detects Anthropic format', () => {
      const format = APIKeyDetector.detectFormat('sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrs');
      expect(format).toBe('anthropic');
    });

    test('detects Google format', () => {
      const format = APIKeyDetector.detectFormat('AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe');
      expect(format).toBe('google');
    });

    test('detects GitHub format', () => {
      const format = APIKeyDetector.detectFormat('ghp_1234567890abcdefghijklmnopqrstuvwxyz');
      expect(format).toBe('github');
    });

    test('returns generic for unknown format', () => {
      const format = APIKeyDetector.detectFormat('unknown-key-format');
      expect(format).toBe('generic');
    });
  });

  describe('Integration', () => {
    test('detect and redact workflow', () => {
      const text = 'Please use this API key: sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB in your requests';

      // Detect
      const detected = APIKeyDetector.detect(text);
      expect(detected.length).toBe(1);
      expect(detected[0].format).toBe('openai');

      // Redact
      const redacted = APIKeyDetector.redact(text, detected, 'full');
      expect(redacted).toBe('Please use this API key: [REDACTED_API_KEY] in your requests');
    });

    test('handles real-world scenario with mixed content', () => {
      const text = `
        Here's my config:
        OPENAI_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB
        GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz
        STRIPE_KEY=${'sk_live_'}${'FAKETESTKEY1234567890ABCD'}

        Please keep these secure!
      `;

      const detected = APIKeyDetector.detect(text);
      expect(detected.length).toBe(3);

      const redacted = APIKeyDetector.redact(text, detected, 'placeholder');
      expect(redacted).toContain('[OPENAI_KEY]');
      expect(redacted).toContain('[GITHUB_KEY]');
      expect(redacted).toContain('[STRIPE_KEY]');
      expect(redacted).toContain('Please keep these secure!');
    });
  });
});
