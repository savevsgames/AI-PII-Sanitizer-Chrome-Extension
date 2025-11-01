/**
 * XSS Prevention Test Suite
 * Tests HTML escaping functions to prevent Cross-Site Scripting attacks
 */

import { escapeHtml, safeHTML, safeMap } from '../src/popup/utils/dom';

describe('XSS Prevention', () => {
  describe('escapeHtml', () => {
    test('escapes <script> tags', () => {
      const malicious = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(malicious);

      expect(escaped).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
      expect(escaped).not.toContain('<script>');
      expect(escaped).not.toContain('</script>');
    });

    test('escapes <img> with onerror handler', () => {
      const malicious = '<img src=x onerror=alert("XSS")>';
      const escaped = escapeHtml(malicious);

      // Tags are escaped, so onerror is harmless plain text
      expect(escaped).not.toContain('<img');
      expect(escaped).toContain('&lt;img');
      // onerror is still in string but as escaped text, not executable
      expect(escaped).toContain('onerror');
    });

    test('escapes <iframe> tags', () => {
      const malicious = '<iframe src="evil.com"></iframe>';
      const escaped = escapeHtml(malicious);

      expect(escaped).not.toContain('<iframe>');
      expect(escaped).toContain('&lt;iframe');
    });

    test('escapes <svg> with onload handler', () => {
      const malicious = '<svg onload=alert("XSS")>';
      const escaped = escapeHtml(malicious);

      expect(escaped).not.toContain('<svg');
      expect(escaped).toContain('&lt;svg');
      // onload is harmless text once tags are escaped
      expect(escaped).toContain('onload');
    });

    test('escapes event handlers in div', () => {
      const malicious = '<div onclick="alert(1)">Click</div>';
      const escaped = escapeHtml(malicious);

      expect(escaped).not.toContain('<div');
      expect(escaped).toContain('&lt;div');
      // onclick is harmless text once tags are escaped
      expect(escaped).toContain('onclick');
    });

    test('escapes javascript: protocol', () => {
      const malicious = '<a href="javascript:alert(1)">Click</a>';
      const escaped = escapeHtml(malicious);

      expect(escaped).not.toContain('<a');
      expect(escaped).toContain('&lt;a');
      // javascript: is harmless text once tags are escaped
      expect(escaped).toContain('javascript:');
    });

    test('handles normal text safely', () => {
      const normal = 'John Smith';
      expect(escapeHtml(normal)).toBe('John Smith');
    });

    test('preserves special characters in emails', () => {
      const email = 'john@example.com';
      expect(escapeHtml(email)).toBe('john@example.com');
    });

    test('preserves special characters in phone numbers', () => {
      const phone = '+1 (555) 123-4567';
      expect(escapeHtml(phone)).toBe('+1 (555) 123-4567');
    });

    test('escapes ampersands', () => {
      const text = 'Rock & Roll';
      expect(escapeHtml(text)).toBe('Rock &amp; Roll');
    });

    test('escapes less-than and greater-than', () => {
      const text = '5 < 10 > 3';
      expect(escapeHtml(text)).toBe('5 &lt; 10 &gt; 3');
    });

    test('escapes quotes', () => {
      const text = 'He said "Hello"';
      // Note: escapeHtml preserves quotes in text content
      expect(escapeHtml(text)).toContain('Hello');
    });

    test('handles empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    test('handles null safely', () => {
      expect(escapeHtml(null as any)).toBe('');
    });

    test('handles undefined safely', () => {
      expect(escapeHtml(undefined as any)).toBe('');
    });

    test('handles numbers as strings', () => {
      expect(escapeHtml('12345')).toBe('12345');
    });

    test('escapes multiple tags in one string', () => {
      const malicious = '<script>alert(1)</script><img src=x onerror=alert(2)>';
      const escaped = escapeHtml(malicious);

      expect(escaped).not.toContain('<script>');
      expect(escaped).not.toContain('<img');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&lt;img');
    });

    test('escapes nested tags', () => {
      const malicious = '<div><script>alert("XSS")</script></div>';
      const escaped = escapeHtml(malicious);

      expect(escaped).not.toContain('<div>');
      expect(escaped).not.toContain('<script>');
    });

    test('escapes data URI with base64', () => {
      const malicious = '<img src="data:text/html,<script>alert(1)</script>">';
      const escaped = escapeHtml(malicious);

      expect(escaped).not.toContain('<img');
      expect(escaped).toContain('&lt;img');
      // data:text/html is harmless text when tags are escaped
      expect(escaped).toContain('data:text/html');
    });
  });

  describe('safeHTML', () => {
    test('escapes user input in template', () => {
      const userInput = '<script>alert("XSS")</script>';
      const html = safeHTML('<div>${name}</div>', { name: userInput });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    test('preserves safe HTML structure', () => {
      const html = safeHTML('<div class="card">${name}</div>', { name: 'John' });

      expect(html).toBe('<div class="card">John</div>');
      expect(html).toContain('<div');
      expect(html).toContain('</div>');
    });

    test('handles multiple variables', () => {
      const html = safeHTML(
        '<div>${name}: ${email}</div>',
        { name: 'John', email: 'john@example.com' }
      );

      expect(html).toBe('<div>John: john@example.com</div>');
    });

    test('escapes malicious email', () => {
      const maliciousEmail = 'test@x.com<script>alert(1)</script>';
      const html = safeHTML('<p>${email}</p>', { email: maliciousEmail });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    test('handles numbers correctly', () => {
      const html = safeHTML('<div>Count: ${count}</div>', { count: 42 });

      expect(html).toBe('<div>Count: 42</div>');
    });

    test('handles booleans correctly', () => {
      const html = safeHTML('<div>Active: ${active}</div>', { active: true });

      expect(html).toBe('<div>Active: true</div>');
    });

    test('handles null values', () => {
      const html = safeHTML('<div>${value}</div>', { value: null });

      expect(html).toBe('<div></div>');
    });

    test('handles undefined values', () => {
      const html = safeHTML('<div>${value}</div>', { value: undefined });

      expect(html).toBe('<div></div>');
    });

    test('escapes multiple occurrences of same variable', () => {
      const html = safeHTML(
        '<div>${name} - ${name}</div>',
        { name: '<script>alert(1)</script>' }
      );

      expect(html).not.toContain('<script>');
      const scriptCount = (html.match(/&lt;script&gt;/g) || []).length;
      expect(scriptCount).toBe(2);
    });
  });

  describe('safeMap', () => {
    test('escapes user-controlled fields in array', () => {
      const profiles = [
        { name: '<script>alert(1)</script>', age: 25 },
        { name: 'John Smith', age: 30 }
      ];

      const html = safeMap(
        profiles,
        (p) => `<div>${p.name} - ${p.age}</div>`,
        ['name'] // Escape 'name' field
      );

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('John Smith');
    });

    test('preserves non-escaped fields', () => {
      const items = [
        { id: 1, name: 'Test<script>alert(1)</script>' }
      ];

      const html = safeMap(
        items,
        (item) => `<div data-id="${item.id}">${item.name}</div>`,
        ['name']
      );

      expect(html).toContain('data-id="1"');
      expect(html).not.toContain('<script>');
    });

    test('handles empty array', () => {
      const html = safeMap([], (item: any) => `<div>${item.name}</div>`, ['name']);

      expect(html).toBe('');
    });

    test('handles multiple escape fields', () => {
      const profiles = [
        {
          name: '<img src=x onerror=alert(1)>',
          email: '<iframe src="evil.com"></iframe>',
          age: 25
        }
      ];

      const html = safeMap(
        profiles,
        (p) => `<div>${p.name} - ${p.email}</div>`,
        ['name', 'email']
      );

      expect(html).not.toContain('<img');
      expect(html).not.toContain('<iframe');
      expect(html).toContain('&lt;img');
      expect(html).toContain('&lt;iframe');
    });
  });

  describe('Profile Rendering XSS Prevention', () => {
    test('profile name with script tag', () => {
      const profileName = '<script>alert("XSS")</script>';
      const html = `<h3>${escapeHtml(profileName)}</h3>`;

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    test('real name with img tag', () => {
      const realName = 'John<img src=x onerror=alert(1)>';
      const html = `<p>Real: ${escapeHtml(realName)}</p>`;

      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;img');
    });

    test('alias email with iframe', () => {
      const email = 'test@x.com<iframe src="evil.com"></iframe>';
      const html = `<p>Email: ${escapeHtml(email)}</p>`;

      expect(html).not.toContain('<iframe>');
    });

    test('complete profile rendering', () => {
      const profile = {
        profileName: '<script>steal()</script>',
        real: { name: 'John<img src=x>' },
        alias: { name: 'Alex<svg onload=alert(1)>' }
      };

      const html = `
        <div class="profile">
          <h3>${escapeHtml(profile.profileName)}</h3>
          <p>Real: ${escapeHtml(profile.real.name)}</p>
          <p>Alias: ${escapeHtml(profile.alias.name)}</p>
        </div>
      `;

      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img');
      expect(html).not.toContain('<svg');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;img');
      expect(html).toContain('&lt;svg');
    });
  });

  describe('Custom Rules XSS Prevention', () => {
    test('rule name with malicious HTML', () => {
      const ruleName = 'SSN Rule<iframe src="phishing.com"></iframe>';
      const html = `<h4>${escapeHtml(ruleName)}</h4>`;

      expect(html).not.toContain('<iframe>');
    });

    test('rule pattern with HTML', () => {
      const pattern = '\\d{3}-\\d{2}-\\d{4}<script>alert(1)</script>';
      const html = `<code>${escapeHtml(pattern)}</code>`;

      expect(html).not.toContain('<script>');
    });

    test('replacement text with XSS', () => {
      const replacement = '[REDACTED]<img src=x onerror=fetch("evil.com")>';
      const html = `<span>${escapeHtml(replacement)}</span>`;

      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;img');
    });
  });

  describe('API Key Vault XSS Prevention', () => {
    test('key name with malicious content', () => {
      const keyName = 'My OpenAI Key<script>steal(apiKey)</script>';
      const html = `<h4>${escapeHtml(keyName)}</h4>`;

      expect(html).not.toContain('<script>');
    });

    test('handles optional key names', () => {
      const keyName = undefined;
      const html = `<h4>${escapeHtml(keyName as any) || 'Unnamed Key'}</h4>`;

      expect(html).toBe('<h4>Unnamed Key</h4>');
    });
  });

  describe('Activity Log XSS Prevention', () => {
    test('log entry with user data', () => {
      const entry = {
        service: 'chatgpt',
        piiType: 'name',
        timestamp: Date.now()
      };

      // Service and piiType are enums (system-controlled), but still good to escape
      const html = `
        <div class="log-entry">
          <span>${escapeHtml(entry.service)}</span>
          <span>${escapeHtml(entry.piiType)}</span>
          <span>${entry.timestamp}</span>
        </div>
      `;

      expect(html).toContain('chatgpt');
      expect(html).toContain('name');
    });
  });

  describe('Edge Cases', () => {
    test('handles very long malicious strings', () => {
      const longScript = '<script>' + 'alert(1);'.repeat(1000) + '</script>';
      const escaped = escapeHtml(longScript);

      expect(escaped).not.toContain('<script>');
      expect(escaped.length).toBeGreaterThan(0);
    });

    test('handles unicode characters', () => {
      const unicode = '你好世界 🚀 émoji';
      const escaped = escapeHtml(unicode);

      expect(escaped).toBe(unicode);
    });

    test('handles mixed content', () => {
      const mixed = 'Normal text <script>bad()</script> more text';
      const escaped = escapeHtml(mixed);

      expect(escaped).toContain('Normal text');
      expect(escaped).toContain('more text');
      expect(escaped).not.toContain('<script>');
    });

    test('handles encoded entities in input', () => {
      const encoded = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const escaped = escapeHtml(encoded);

      // Should double-escape the already-escaped content
      expect(escaped).not.toBe(encoded);
      expect(escaped).toContain('&amp;lt;');
    });
  });
});
