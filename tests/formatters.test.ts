/**
 * Tests for Formatting Utilities
 * Date, number, file size, and text formatters
 */

import {
  formatRelativeTime,
  formatDate,
  formatNumber,
  formatCount,
  formatFileSize,
  formatDuration,
  formatPercentage,
  truncateText,
  maskAPIKey,
} from '../src/popup/utils/formatters';

describe('Formatting Utilities', () => {
  describe('formatRelativeTime', () => {
    it('should return "Just now" for recent timestamps', () => {
      const now = Date.now();
      const result = formatRelativeTime(now);

      expect(result).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const result = formatRelativeTime(fiveMinutesAgo);

      expect(result).toBe('5 minutes ago');
    });

    it('should format hours ago', () => {
      const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
      const result = formatRelativeTime(threeHoursAgo);

      expect(result).toBe('3 hours ago');
    });

    it('should format days ago', () => {
      const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(twoDaysAgo);

      expect(result).toBe('2 days ago');
    });

    it('should format old dates as full date', () => {
      const longAgo = Date.now() - (40 * 24 * 60 * 60 * 1000); // 40 days
      const result = formatRelativeTime(longAgo);

      // Should be a formatted date string (not relative time)
      expect(result).not.toContain('ago');
      expect(result).not.toBe('Just now');
    });

    it('should handle timestamps in the future gracefully', () => {
      const future = Date.now() + 1000;
      const result = formatRelativeTime(future);

      // Should handle gracefully (likely "Just now" or date)
      expect(result).toBeDefined();
    });

    it('should handle edge case at 59 seconds', () => {
      const fiftyNineSecondsAgo = Date.now() - 59000;
      const result = formatRelativeTime(fiftyNineSecondsAgo);

      expect(result).toBe('Just now');
    });

    it('should handle edge case at 60 seconds', () => {
      const sixtySecondsAgo = Date.now() - 60000;
      const result = formatRelativeTime(sixtySecondsAgo);

      expect(result).toBe('1 minutes ago');
    });
  });

  describe('formatDate', () => {
    it('should format today as time only', () => {
      const now = Date.now();
      const result = formatDate(now);

      // Should contain time format (e.g., "3:45 PM")
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should format yesterday as "Yesterday"', () => {
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      const result = formatDate(yesterday);

      expect(result).toBe('Yesterday');
    });

    it('should format older dates as short date', () => {
      const lastWeek = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const result = formatDate(lastWeek);

      // Should be in format like "Nov 1"
      expect(result).toMatch(/[A-Z][a-z]{2} \d{1,2}/);
    });

    it('should handle timestamps at midnight', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = formatDate(today.getTime());

      // Should still recognize as today
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('formatNumber', () => {
    it('should format small numbers without separators', () => {
      expect(formatNumber(42)).toBe('42');
      expect(formatNumber(999)).toBe('999');
    });

    it('should format thousands with comma separator', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(5432)).toBe('5,432');
    });

    it('should format millions with comma separators', () => {
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000');
    });

    it('should handle decimal numbers', () => {
      const result = formatNumber(1234.56);

      // Should include comma and decimal
      expect(result).toContain(',');
      expect(result).toContain('.');
    });
  });

  describe('formatCount', () => {
    it('should return raw count for small numbers', () => {
      expect(formatCount(0)).toBe('0');
      expect(formatCount(42)).toBe('42');
      expect(formatCount(999)).toBe('999');
    });

    it('should abbreviate thousands as K', () => {
      expect(formatCount(1000)).toBe('1.0K');
      expect(formatCount(5432)).toBe('5.4K');
      expect(formatCount(15000)).toBe('15.0K');
    });

    it('should abbreviate millions as M', () => {
      expect(formatCount(1000000)).toBe('1.0M');
      expect(formatCount(2500000)).toBe('2.5M');
      expect(formatCount(12345678)).toBe('12.3M');
    });

    it('should round to one decimal place', () => {
      expect(formatCount(1234)).toBe('1.2K');
      expect(formatCount(1567)).toBe('1.6K');
    });

    it('should handle edge case at 999', () => {
      expect(formatCount(999)).toBe('999');
    });

    it('should handle edge case at 1000', () => {
      expect(formatCount(1000)).toBe('1.0K');
    });

    it('should handle edge case at 999999', () => {
      expect(formatCount(999999)).toBe('1000.0K');
    });

    it('should handle edge case at 1000000', () => {
      expect(formatCount(1000000)).toBe('1.0M');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 bytes');
      expect(formatFileSize(500)).toBe('500 bytes');
      expect(formatFileSize(1023)).toBe('1023 bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(5120)).toBe('5.00 KB');
      expect(formatFileSize(1536)).toBe('1.50 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5.00 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.50 MB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.50 KB');
      expect(formatFileSize(1234567)).toBe('1.18 MB');
    });

    it('should handle edge case at 1KB', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
    });

    it('should handle edge case at 1MB', () => {
      expect(formatFileSize(1048576)).toBe('1.00 MB');
    });

    it('should handle large files', () => {
      const result = formatFileSize(10 * 1024 * 1024);

      expect(result).toBe('10.00 MB');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(0)).toBe('0ms');
      expect(formatDuration(250)).toBe('250ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.00s');
      expect(formatDuration(5000)).toBe('5.00s');
      expect(formatDuration(1500)).toBe('1.50s');
    });

    it('should round to 2 decimal places for seconds', () => {
      expect(formatDuration(1234)).toBe('1.23s');
      expect(formatDuration(5678)).toBe('5.68s');
    });

    it('should handle edge case at 999ms', () => {
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should handle edge case at 1000ms', () => {
      expect(formatDuration(1000)).toBe('1.00s');
    });

    it('should handle very small durations', () => {
      expect(formatDuration(1)).toBe('1ms');
    });

    it('should handle large durations', () => {
      expect(formatDuration(60000)).toBe('60.00s');
    });
  });

  describe('formatPercentage', () => {
    it('should format basic percentages', () => {
      expect(formatPercentage(50, 100)).toBe('50.0%');
      expect(formatPercentage(25, 100)).toBe('25.0%');
    });

    it('should handle zero total as 0%', () => {
      expect(formatPercentage(10, 0)).toBe('0%');
      expect(formatPercentage(0, 0)).toBe('0%');
    });

    it('should handle zero value', () => {
      expect(formatPercentage(0, 100)).toBe('0.0%');
    });

    it('should handle decimal percentages', () => {
      expect(formatPercentage(1, 3)).toBe('33.3%');
      expect(formatPercentage(2, 3)).toBe('66.7%');
    });

    it('should round to 1 decimal place', () => {
      expect(formatPercentage(1, 6)).toBe('16.7%');
      expect(formatPercentage(5, 6)).toBe('83.3%');
    });

    it('should handle values greater than total', () => {
      expect(formatPercentage(150, 100)).toBe('150.0%');
    });

    it('should handle very small percentages', () => {
      expect(formatPercentage(1, 1000)).toBe('0.1%');
    });

    it('should handle 100%', () => {
      expect(formatPercentage(100, 100)).toBe('100.0%');
    });
  });

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
      expect(truncateText('Short', 20)).toBe('Short');
    });

    it('should truncate long text with ellipsis', () => {
      expect(truncateText('Hello World', 8)).toBe('Hello...');
      expect(truncateText('This is a long text', 10)).toBe('This is...');
    });

    it('should handle text exactly at maxLength', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });

    it('should handle text one character over maxLength', () => {
      expect(truncateText('Hello!', 5)).toBe('He...');
    });

    it('should handle empty strings', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('should handle very short maxLength', () => {
      expect(truncateText('Hello World', 3)).toBe('...');
    });

    it('should preserve unicode characters', () => {
      const emoji = 'Hello 🌍 World';
      const result = truncateText(emoji, 10);

      expect(result).toContain('...');
    });

    it('should handle maxLength of 3 (minimum for ellipsis)', () => {
      expect(truncateText('Hello', 3)).toBe('...');
    });
  });

  describe('maskAPIKey', () => {
    it('should mask short keys (10 chars or less)', () => {
      expect(maskAPIKey('abcd1234')).toBe('***1234');
      expect(maskAPIKey('test12')).toBe('***st12');
    });

    it('should mask long keys showing first 8 and last 6', () => {
      expect(maskAPIKey('sk_live_1234567890abcdefghij')).toBe('sk_live_...efghij');
    });

    it('should handle medium length keys', () => {
      expect(maskAPIKey('1234567890123456')).toBe('12345678...123456');
    });

    it('should handle very short keys', () => {
      expect(maskAPIKey('1234')).toBe('***1234');
    });

    it('should handle exactly 10 character keys', () => {
      expect(maskAPIKey('1234567890')).toBe('***7890');
    });

    it('should handle exactly 11 character keys', () => {
      expect(maskAPIKey('12345678901')).toBe('12345678...678901');
    });

    it('should preserve key prefixes for identification', () => {
      const masked = maskAPIKey('sk_test_1234567890abcdefghij');

      expect(masked.startsWith('sk_test_')).toBe(true);
    });

    it('should handle OpenAI-style keys', () => {
      const masked = maskAPIKey('sk-abc123def456ghi789jkl012mno345');

      expect(masked.startsWith('sk-abc12')).toBe(true);
      expect(masked.endsWith('no345')).toBe(true);
      expect(masked).toContain('...');
    });

    it('should handle Anthropic-style keys', () => {
      const masked = maskAPIKey('sk-ant-api03-randomstringhere1234567890');

      expect(masked.startsWith('sk-ant-a')).toBe(true);
      expect(masked).toContain('...');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should throw TypeError for null/undefined inputs', () => {
      // TypeScript prevents this at compile time, but testing runtime behavior
      expect(() => formatNumber(null as any)).toThrow(TypeError);
      expect(() => formatCount(undefined as any)).toThrow();
    });

    it('should format file sizes consistently across units', () => {
      const sizes = [
        512,           // bytes
        2048,          // KB
        3145728,       // MB
      ];

      sizes.forEach(size => {
        const result = formatFileSize(size);
        expect(result).toBeDefined();
        expect(result).toMatch(/(\d+\.?\d*)\s+(bytes|KB|MB)/);
      });
    });

    it('should format counts consistently across ranges', () => {
      const counts = [100, 1500, 2500000];

      counts.forEach(count => {
        const result = formatCount(count);
        expect(result).toBeDefined();
      });
    });

    it('should handle very large numbers', () => {
      expect(formatNumber(999999999)).toContain(',');
      expect(formatCount(999999999)).toContain('M');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1024.00 MB');
    });
  });
});
