/**
 * Tests for Quick Alias Generator
 */

import {
  generateProfile,
  generateBulkProfiles,
  getAvailableTemplates,
  canAccessTemplate,
  getMaxBulkCount,
  getPoolStatistics,
  previewPattern,
  BUILTIN_TEMPLATES,
  type GeneratedProfile,
  type TierLevel,
} from './aliasGenerator';

describe('aliasGenerator', () => {
  describe('generateProfile', () => {
    it('should generate a profile with standard template', () => {
      const profile = generateProfile('standard');

      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('email');
      expect(profile).toHaveProperty('phone');
      expect(profile).toHaveProperty('company');
      expect(profile.template).toBe('standard');
      expect(profile.timestamp).toBeGreaterThan(0);

      // Validate name format (First Last)
      expect(profile.name).toMatch(/^[A-Za-z]+ [A-Za-z]+$/);

      // Validate email format
      expect(profile.email).toMatch(/^[a-z0-9.]+@[a-z0-9.-]+$/);

      // Validate phone format
      expect(profile.phone).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);

      // Validate company exists
      expect(profile.company).toBeTruthy();
    });

    it('should generate a profile with middle initial template', () => {
      const profile = generateProfile('with-middle');

      // Validate name format (First M. Last)
      expect(profile.name).toMatch(/^[A-Za-z]+ [A-Z]\. [A-Za-z]+$/);

      // Validate email format (first.m.last@domain)
      expect(profile.email).toMatch(/^[a-z0-9]+\.[a-z]\.[a-z0-9]+@[a-z0-9.-]+$/);
    });

    it('should generate a profile with casual template', () => {
      const profile = generateProfile('casual');

      // Validate email format (firstL@domain)
      expect(profile.email).toMatch(/^[a-z0-9]+[a-z]@[a-z0-9.-]+$/);
    });

    it('should generate fantasy profile (PRO)', () => {
      const profile = generateProfile('fantasy-hero');

      expect(profile.name).toBeTruthy();
      expect(profile.email).toBeTruthy();
      expect(profile.company).toBeTruthy();
      expect(profile.template).toBe('fantasy-hero');

      // Fantasy emails should use fantasy domains
      expect(profile.email).toMatch(/\.realm|\.order|\.keep|\.magic|\.guild/);
    });

    it('should generate coder profile (PRO)', () => {
      const profile = generateProfile('coder-dev');

      expect(profile.name).toBeTruthy();
      expect(profile.email).toBeTruthy();
      expect(profile.company).toBeTruthy();
      expect(profile.template).toBe('coder-dev');

      // Coder emails should use dev/tech domains
      expect(profile.email).toMatch(/\.dev|\.io|\.app|\.tech/);
    });

    it('should generate vintage profile (PRO)', () => {
      const profile = generateProfile('vintage-aristocrat');

      expect(profile.name).toBeTruthy();
      expect(profile.email).toBeTruthy();
      expect(profile.company).toBeTruthy();
      expect(profile.template).toBe('vintage-aristocrat');

      // Vintage emails should use estate/trust domains
      expect(profile.email).toMatch(/\.estate|\.trust|\.society|\.firm/);
    });

    it('should throw error for invalid template', () => {
      expect(() => generateProfile('invalid-template')).toThrow('Template not found');
    });

    it('should generate unique profiles on multiple calls', () => {
      const profiles = Array.from({ length: 10 }, () => generateProfile('standard'));

      // Check that we got some variety (unlikely all identical)
      const uniqueNames = new Set(profiles.map((p) => p.name));
      expect(uniqueNames.size).toBeGreaterThan(1);

      const uniqueEmails = new Set(profiles.map((p) => p.email));
      expect(uniqueEmails.size).toBeGreaterThan(1);
    });

    it('should sanitize names properly for emails', () => {
      // Generate many profiles to test sanitization
      const profiles = Array.from({ length: 50 }, () => generateProfile('standard'));

      profiles.forEach((profile) => {
        // Email should only contain lowercase letters, numbers, dots, @
        expect(profile.email).toMatch(/^[a-z0-9.@]+$/);

        // Should not have consecutive dots
        expect(profile.email).not.toMatch(/\.\./);

        // Should not start or end with dots (before @)
        const [localPart] = profile.email.split('@');
        expect(localPart).not.toMatch(/^\./);
        expect(localPart).not.toMatch(/\.$/);
      });
    });

    it('should generate valid phone numbers', () => {
      const profiles = Array.from({ length: 20 }, () => generateProfile('standard'));

      profiles.forEach((profile) => {
        if (profile.phone) {
          // Format: (XXX) XXX-XXXX
          expect(profile.phone).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);

          // Area code should be real (from our list)
          const areaCode = profile.phone.match(/\((\d{3})\)/)?.[1];
          expect(areaCode).toBeTruthy();
        }
      });
    });
  });

  describe('generateBulkProfiles', () => {
    it('should generate multiple profiles', () => {
      const profiles = generateBulkProfiles({
        templateId: 'standard',
        count: 5,
      });

      expect(profiles).toHaveLength(5);
      profiles.forEach((profile) => {
        expect(profile.template).toBe('standard');
        expect(profile.name).toBeTruthy();
        expect(profile.email).toBeTruthy();
      });
    });

    it('should ensure unique names when requested', () => {
      const profiles = generateBulkProfiles({
        templateId: 'standard',
        count: 10,
        ensureUnique: true,
      });

      const names = profiles.map((p) => p.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(profiles.length);
    });

    it('should allow duplicate names when ensureUnique is false', () => {
      const profiles = generateBulkProfiles({
        templateId: 'standard',
        count: 10,
        ensureUnique: false,
      });

      expect(profiles).toHaveLength(10);
      // We can't guarantee duplicates, but at least verify it doesn't throw
    });

    it('should throw error for invalid count', () => {
      expect(() =>
        generateBulkProfiles({
          templateId: 'standard',
          count: 0,
        })
      ).toThrow('count must be between 1 and 10');

      expect(() =>
        generateBulkProfiles({
          templateId: 'standard',
          count: 11,
        })
      ).toThrow('count must be between 1 and 10');
    });

    it('should throw error for invalid template', () => {
      expect(() =>
        generateBulkProfiles({
          templateId: 'invalid',
          count: 5,
        })
      ).toThrow('Template not found');
    });

    it('should generate fantasy profiles in bulk', () => {
      const profiles = generateBulkProfiles({
        templateId: 'fantasy-hero',
        count: 5,
        ensureUnique: true,
      });

      expect(profiles).toHaveLength(5);
      profiles.forEach((profile) => {
        expect(profile.email).toMatch(/\.realm|\.order|\.keep|\.magic|\.guild/);
      });
    });

    it('should generate coder profiles in bulk', () => {
      const profiles = generateBulkProfiles({
        templateId: 'coder-dev',
        count: 5,
        ensureUnique: true,
      });

      expect(profiles).toHaveLength(5);
      profiles.forEach((profile) => {
        expect(profile.email).toMatch(/\.dev|\.io|\.app|\.tech/);
      });
    });

    it('should handle timestamp uniqueness', () => {
      const profiles = generateBulkProfiles({
        templateId: 'standard',
        count: 3,
      });

      // Timestamps should all be recent
      const now = Date.now();
      profiles.forEach((profile) => {
        expect(profile.timestamp).toBeGreaterThan(now - 1000); // Within last second
        expect(profile.timestamp).toBeLessThanOrEqual(now);
      });
    });
  });

  describe('getAvailableTemplates', () => {
    it('should return only FREE templates for free tier', () => {
      const templates = getAvailableTemplates('free');

      expect(templates.length).toBe(4);
      templates.forEach((template) => {
        expect(template.tier).toBe('free');
      });

      const templateIds = templates.map((t) => t.id);
      expect(templateIds).toContain('standard');
      expect(templateIds).toContain('with-middle');
      expect(templateIds).toContain('casual');
      expect(templateIds).toContain('professional');
    });

    it('should return all templates for PRO tier', () => {
      const templates = getAvailableTemplates('pro');

      expect(templates.length).toBe(BUILTIN_TEMPLATES.length);
      expect(templates.length).toBe(10); // 4 FREE + 6 PRO

      const proTemplates = templates.filter((t) => t.tier === 'pro');
      expect(proTemplates.length).toBe(6);

      const proIds = proTemplates.map((t) => t.id);
      expect(proIds).toContain('fantasy-hero');
      expect(proIds).toContain('coder-dev');
      expect(proIds).toContain('vintage-aristocrat');
    });

    it('should include template descriptions', () => {
      const templates = getAvailableTemplates('pro');

      templates.forEach((template) => {
        expect(template.description).toBeTruthy();
        expect(template.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('canAccessTemplate', () => {
    it('should allow FREE tier to access FREE templates', () => {
      expect(canAccessTemplate('standard', 'free')).toBe(true);
      expect(canAccessTemplate('with-middle', 'free')).toBe(true);
      expect(canAccessTemplate('casual', 'free')).toBe(true);
      expect(canAccessTemplate('professional', 'free')).toBe(true);
    });

    it('should block FREE tier from PRO templates', () => {
      expect(canAccessTemplate('fantasy-hero', 'free')).toBe(false);
      expect(canAccessTemplate('coder-dev', 'free')).toBe(false);
      expect(canAccessTemplate('vintage-aristocrat', 'free')).toBe(false);
      expect(canAccessTemplate('fantasy-casual', 'free')).toBe(false);
      expect(canAccessTemplate('coder-ninja', 'free')).toBe(false);
      expect(canAccessTemplate('vintage-formal', 'free')).toBe(false);
    });

    it('should allow PRO tier to access all templates', () => {
      const allTemplateIds = BUILTIN_TEMPLATES.map((t) => t.id);

      allTemplateIds.forEach((templateId) => {
        expect(canAccessTemplate(templateId, 'pro')).toBe(true);
      });
    });

    it('should return false for invalid template IDs', () => {
      expect(canAccessTemplate('invalid-template', 'free')).toBe(false);
      expect(canAccessTemplate('invalid-template', 'pro')).toBe(false);
    });
  });

  describe('getMaxBulkCount', () => {
    it('should return 1 for FREE tier (single generation only)', () => {
      expect(getMaxBulkCount('free')).toBe(1);
    });

    it('should return 10 for PRO tier (bulk 5-10)', () => {
      expect(getMaxBulkCount('pro')).toBe(10);
    });
  });

  describe('getPoolStatistics', () => {
    it('should return correct pool sizes', () => {
      const stats = getPoolStatistics();

      expect(stats.standard.firstNames).toBe(500);
      expect(stats.standard.lastNames).toBe(500);
      expect(stats.standard.companies).toBe(100);
      expect(stats.standard.domains).toBe(50);

      expect(stats.fantasy.firstNames).toBe(500);
      expect(stats.fantasy.lastNames).toBe(500);
      expect(stats.fantasy.organizations).toBe(100);
      expect(stats.fantasy.domains).toBe(50);

      expect(stats.coder.firstNames).toBe(500);
      expect(stats.coder.lastNames).toBe(500);
      expect(stats.coder.companies).toBe(100);
      expect(stats.coder.domains).toBe(50);

      expect(stats.vintage.firstNames).toBe(500);
      expect(stats.vintage.lastNames).toBe(500);
      expect(stats.vintage.establishments).toBe(100);
      expect(stats.vintage.domains).toBe(50);
    });

    it('should calculate combinations correctly', () => {
      const stats = getPoolStatistics();

      expect(stats.standard.combinations).toBe(500 * 500);
      expect(stats.fantasy.combinations).toBe(500 * 500);
      expect(stats.coder.combinations).toBe(500 * 500);
      expect(stats.vintage.combinations).toBe(500 * 500);

      expect(stats.totalCombinations).toBe(4 * 500 * 500); // 1,000,000
    });
  });

  describe('previewPattern', () => {
    it('should preview name patterns', () => {
      const preview = previewPattern('{{first}} {{last}}');

      expect(preview).toMatch(/^[A-Za-z]+ [A-Za-z]+$/);
    });

    it('should preview email patterns', () => {
      const preview = previewPattern('{{first}}.{{last}}@{{domain}}');

      expect(preview).toMatch(/^[a-z]+(\.)?[a-z]+@[a-z0-9.-]+$/);
    });

    it('should preview phone patterns', () => {
      const preview = previewPattern('({{areaCode}}) {{exchange}}-{{lineNumber}}');

      expect(preview).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
    });

    it('should preview fantasy patterns', () => {
      const preview = previewPattern('{{fantasyFirst}} {{fantasyLast}}');

      expect(preview).toBeTruthy();
      expect(preview).toMatch(/^[A-Za-z]+ [A-Za-z]+$/);
    });

    it('should preview coder patterns', () => {
      const preview = previewPattern('{{coderFirst}} {{coderLast}}');

      expect(preview).toBeTruthy();
    });

    it('should preview vintage patterns', () => {
      const preview = previewPattern('{{vintageFirst}} {{vintageLast}}');

      expect(preview).toBeTruthy();
    });

    it('should handle unknown placeholders gracefully', () => {
      const preview = previewPattern('{{unknown}} {{placeholder}}');

      expect(preview).toBe('{{unknown}} {{placeholder}}'); // Keep originals
    });

    it('should handle mixed patterns', () => {
      const preview = previewPattern('{{first}} "{{coderLast}}" {{last}}');

      expect(preview).toMatch(/^[A-Za-z]+ ".+" [A-Za-z]+$/);
    });
  });

  describe('BUILTIN_TEMPLATES structure', () => {
    it('should have 10 total templates (4 FREE + 6 PRO)', () => {
      expect(BUILTIN_TEMPLATES).toHaveLength(10);
    });

    it('should have 4 FREE templates', () => {
      const freeTemplates = BUILTIN_TEMPLATES.filter((t) => t.tier === 'free');
      expect(freeTemplates).toHaveLength(4);
    });

    it('should have 6 PRO templates', () => {
      const proTemplates = BUILTIN_TEMPLATES.filter((t) => t.tier === 'pro');
      expect(proTemplates).toHaveLength(6);
    });

    it('should have unique IDs', () => {
      const ids = BUILTIN_TEMPLATES.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(BUILTIN_TEMPLATES.length);
    });

    it('should have all required fields', () => {
      BUILTIN_TEMPLATES.forEach((template) => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.tier).toMatch(/^(free|pro)$/);
        expect(template.description).toBeTruthy();
        expect(template.namePattern).toBeTruthy();
        expect(template.emailPattern).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('should generate single profile quickly (<100ms)', () => {
      const start = performance.now();
      generateProfile('standard');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should generate bulk profiles quickly (<500ms for 10)', () => {
      const start = performance.now();
      generateBulkProfiles({
        templateId: 'standard',
        count: 10,
        ensureUnique: true,
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('Email Sanitization Edge Cases', () => {
    it('should handle names with special characters in fantasy pool', () => {
      // Fantasy names may have apostrophes, hyphens, etc.
      const profiles = Array.from({ length: 20 }, () => generateProfile('fantasy-hero'));

      profiles.forEach((profile) => {
        // Email should be clean
        expect(profile.email).toMatch(/^[a-z0-9.@]+$/);
      });
    });

    it('should handle double-barreled vintage surnames', () => {
      // Vintage has names like "Cholmondeley-Warner"
      const profiles = Array.from({ length: 20 }, () => generateProfile('vintage-aristocrat'));

      profiles.forEach((profile) => {
        // Email should handle hyphens properly
        expect(profile.email).toMatch(/^[a-z0-9.@]+$/);
        expect(profile.email).not.toContain('-');
      });
    });

    it('should handle coder names with special chars', () => {
      // Coder names like "NullPointer", "C++", etc.
      const profiles = Array.from({ length: 20 }, () => generateProfile('coder-dev'));

      profiles.forEach((profile) => {
        // Email should be sanitized
        expect(profile.email).toMatch(/^[a-z0-9.@]+$/);
        expect(profile.email).not.toContain('+');
      });
    });
  });
});
