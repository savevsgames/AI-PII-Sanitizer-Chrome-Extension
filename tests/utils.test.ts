/**
 * Unit tests for utility functions
 */

import {
  isValidEmail,
  escapeHtml,
  formatRelativeTime,
  getElementById,
  querySelector,
  querySelectorAll,
} from '../src/popup/components/utils';

describe('Utility Functions', () => {
  describe('isValidEmail', () => {
    test('validates correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('firstname+lastname@company.org')).toBe(true);
      expect(isValidEmail('123@test.io')).toBe(true);
    });

    test('rejects invalid email addresses', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('user@example')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
    });

    test('handles edge cases', () => {
      expect(isValidEmail('a@b.c')).toBe(true); // Minimal valid email
      expect(isValidEmail('user@subdomain.example.com')).toBe(true);
    });
  });

  describe('escapeHtml', () => {
    test('escapes HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert("xss")&lt;/script&gt;'
      );
      expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
        '&lt;img src=x onerror=alert(1)&gt;'
      );
    });

    test('escapes quotes and ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(escapeHtml('"quoted text"')).toBe('"quoted text"');
      expect(escapeHtml("'single quotes'")).toBe("'single quotes'");
    });

    test('handles already escaped content', () => {
      expect(escapeHtml('&lt;div&gt;')).toBe('&amp;lt;div&amp;gt;');
    });

    test('leaves safe text unchanged', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
      expect(escapeHtml('123')).toBe('123');
      expect(escapeHtml('user@example.com')).toBe('user@example.com');
    });

    test('handles empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    test('prevents XSS attack vectors', () => {
      const xssVectors = [
        '<script>alert(document.cookie)</script>',
        '<img src="javascript:alert(1)">',
        '<svg onload=alert(1)>',
        '<iframe src="evil.com">',
        '<body onload=alert(1)>',
        '<a href="javascript:alert(1)">click</a>',
      ];

      xssVectors.forEach((vector) => {
        const escaped = escapeHtml(vector);
        expect(escaped).not.toContain('<script');
        expect(escaped).not.toContain('<img');
        expect(escaped).not.toContain('<svg');
        expect(escaped).not.toContain('<iframe');
        expect(escaped).not.toContain('<body');
        expect(escaped).not.toContain('<a ');
        // The escaped version should contain &lt; and &gt;
        expect(escaped).toContain('&lt;');
      });

      // Test plain text injection (no HTML tags)
      const plainTextInjection = 'javascript:alert(1)';
      const escaped = escapeHtml(plainTextInjection);
      // Plain text without tags is unchanged
      expect(escaped).toBe(plainTextInjection);
    });
  });

  describe('formatRelativeTime', () => {
    test('formats "Just now" for recent timestamps', () => {
      const now = Date.now();
      expect(formatRelativeTime(now)).toBe('Just now');
      expect(formatRelativeTime(now - 30 * 1000)).toBe('Just now'); // 30 seconds ago
      expect(formatRelativeTime(now - 59 * 1000)).toBe('Just now'); // 59 seconds ago
    });

    test('formats minutes ago', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 60 * 1000)).toBe('1 minutes ago');
      expect(formatRelativeTime(now - 5 * 60 * 1000)).toBe('5 minutes ago');
      expect(formatRelativeTime(now - 59 * 60 * 1000)).toBe('59 minutes ago');
    });

    test('formats hours ago', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 60 * 60 * 1000)).toBe('1 hours ago');
      expect(formatRelativeTime(now - 5 * 60 * 60 * 1000)).toBe('5 hours ago');
      expect(formatRelativeTime(now - 23 * 60 * 60 * 1000)).toBe('23 hours ago');
    });

    test('formats days ago', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 24 * 60 * 60 * 1000)).toBe('1 days ago');
      expect(formatRelativeTime(now - 7 * 24 * 60 * 60 * 1000)).toBe(
        '7 days ago'
      );
      expect(formatRelativeTime(now - 29 * 24 * 60 * 60 * 1000)).toBe(
        '29 days ago'
      );
    });

    test('formats as date for old timestamps', () => {
      const now = Date.now();
      const oneMonthAgo = now - 31 * 24 * 60 * 60 * 1000;
      const result = formatRelativeTime(oneMonthAgo);

      // Should return a formatted date string (format varies by locale)
      // Could be MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.
      expect(result).toMatch(/\d/);  // Just verify it contains numbers
      expect(result.length).toBeGreaterThan(5);  // Date strings are longer than 5 chars
      expect(result).not.toBe('Just now');
      expect(result).not.toContain('ago');
    });

    test('handles future timestamps gracefully', () => {
      const future = Date.now() + 1000 * 60 * 60; // 1 hour in future
      const result = formatRelativeTime(future);

      // Should not crash, might return "Just now" or a date
      expect(typeof result).toBe('string');
    });
  });

  describe('DOM Helper Functions', () => {
    beforeEach(() => {
      // Set up DOM elements for testing
      document.body.innerHTML = `
        <div id="test-div">Test Content</div>
        <button id="test-button">Click Me</button>
        <input id="test-input" type="text" value="test" />
        <ul class="test-list">
          <li class="item">Item 1</li>
          <li class="item">Item 2</li>
          <li class="item">Item 3</li>
        </ul>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    describe('getElementById', () => {
      test('retrieves element by ID', () => {
        const div = getElementById<HTMLDivElement>('test-div');
        expect(div).not.toBeNull();
        expect(div?.tagName).toBe('DIV');
        expect(div?.textContent).toBe('Test Content');
      });

      test('returns null for non-existent ID', () => {
        const element = getElementById('non-existent');
        expect(element).toBeNull();
      });

      test('type assertion works correctly', () => {
        const button = getElementById<HTMLButtonElement>('test-button');
        expect(button?.tagName).toBe('BUTTON');

        const input = getElementById<HTMLInputElement>('test-input');
        expect(input?.value).toBe('test');
      });
    });

    describe('querySelector', () => {
      test('retrieves element by selector', () => {
        const div = querySelector<HTMLDivElement>('#test-div');
        expect(div).not.toBeNull();
        expect(div?.textContent).toBe('Test Content');
      });

      test('retrieves element by class', () => {
        const item = querySelector<HTMLLIElement>('.item');
        expect(item).not.toBeNull();
        expect(item?.textContent).toBe('Item 1');
      });

      test('returns null for non-existent selector', () => {
        const element = querySelector('.non-existent');
        expect(element).toBeNull();
      });
    });

    describe('querySelectorAll', () => {
      test('retrieves all matching elements', () => {
        const items = querySelectorAll<HTMLLIElement>('.item');
        expect(items.length).toBe(3);
        expect(items[0].textContent).toBe('Item 1');
        expect(items[1].textContent).toBe('Item 2');
        expect(items[2].textContent).toBe('Item 3');
      });

      test('returns empty NodeList for non-existent selector', () => {
        const elements = querySelectorAll('.non-existent');
        expect(elements.length).toBe(0);
      });

      test('works with complex selectors', () => {
        const listItems = querySelectorAll<HTMLLIElement>('ul.test-list li');
        expect(listItems.length).toBe(3);
      });
    });
  });
});
