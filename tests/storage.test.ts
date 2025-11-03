/**
 * Unit tests for StorageManager
 * Tests encryption, profile CRUD, migration, and config management
 *
 * NOTE: Tests involving Web Crypto API (crypto.subtle) are currently skipped
 * because Jest's jsdom environment doesn't provide a full Web Crypto implementation.
 * These tests will be covered by E2E tests which run in a real browser environment.
 *
 * TODO: Consider adding @peculiar/webcrypto polyfill if comprehensive crypto
 * unit testing becomes critical.
 */

import { StorageManager } from '../src/lib/storage';
import { AliasProfile, UserConfig } from '../src/lib/types';

// Access mock data from global setup
const { mockStorageData } = require('./setup');

describe('StorageManager', () => {
  let storage: StorageManager;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    Object.keys(mockStorageData).forEach((key) => delete mockStorageData[key]);

    // Get fresh instance
    storage = StorageManager.getInstance();
  });

  describe('Singleton Pattern', () => {
    test('returns same instance', () => {
      const instance1 = StorageManager.getInstance();
      const instance2 = StorageManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe.skip('Profile CRUD Operations', () => {
    test('creates a new profile', async () => {
      const profileData = {
        profileName: 'Test Profile',
        description: 'Test description',
        real: {
          name: 'John Smith',
          email: 'john@example.com',
        },
        alias: {
          name: 'Alex Johnson',
          email: 'alex@example.com',
        },
      };

      const profile = await storage.createProfile(profileData);

      expect(profile.id).toBeDefined();
      expect(profile.profileName).toBe('Test Profile');
      expect(profile.real.name).toBe('John Smith');
      expect(profile.alias.name).toBe('Alex Johnson');
      expect(profile.enabled).toBe(true);
      expect(profile.metadata.createdAt).toBeDefined();
      expect(profile.metadata.usageStats.totalSubstitutions).toBe(0);
    });

    test('loads saved profiles', async () => {
      const profileData = {
        profileName: 'Load Test',
        real: { name: 'Jane Doe' },
        alias: { name: 'Sarah Williams' },
      };

      await storage.createProfile(profileData);
      const profiles = await storage.loadProfiles();

      expect(profiles.length).toBe(1);
      expect(profiles[0].profileName).toBe('Load Test');
    });

    test('updates existing profile', async () => {
      const profile = await storage.createProfile({
        profileName: 'Update Test',
        real: { name: 'Original Name' },
        alias: { name: 'Original Alias' },
      });

      await storage.updateProfile(profile.id, {
        real: { name: 'Updated Name' },
      });

      const profiles = await storage.loadProfiles();
      expect(profiles[0].real.name).toBe('Updated Name');
      expect(profiles[0].metadata.updatedAt).toBeGreaterThan(profile.metadata.createdAt);
    });

    test('deletes profile by ID', async () => {
      const profile1 = await storage.createProfile({
        profileName: 'Profile 1',
        real: { name: 'User 1' },
        alias: { name: 'Alias 1' },
      });

      const profile2 = await storage.createProfile({
        profileName: 'Profile 2',
        real: { name: 'User 2' },
        alias: { name: 'Alias 2' },
      });

      await storage.deleteProfile(profile1.id);
      const profiles = await storage.loadProfiles();

      expect(profiles.length).toBe(1);
      expect(profiles[0].id).toBe(profile2.id);
    });

    test('toggles profile enabled state', async () => {
      const profile = await storage.createProfile({
        profileName: 'Toggle Test',
        real: { name: 'Test' },
        alias: { name: 'Test Alias' },
      });

      expect(profile.enabled).toBe(true);

      await storage.toggleProfile(profile.id);
      let profiles = await storage.loadProfiles();
      expect(profiles[0].enabled).toBe(false);

      await storage.toggleProfile(profile.id);
      profiles = await storage.loadProfiles();
      expect(profiles[0].enabled).toBe(true);
    });

    test('gets single profile by ID', async () => {
      const created = await storage.createProfile({
        profileName: 'Get Test',
        real: { name: 'Test User' },
        alias: { name: 'Test Alias' },
      });

      const retrieved = await storage.getProfile(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.profileName).toBe('Get Test');
    });

    test('returns null for non-existent profile', async () => {
      const profile = await storage.getProfile('non-existent-id');
      expect(profile).toBeNull();
    });
  });

  describe.skip('Profile Usage Stats', () => {
    test('increments usage stats correctly', async () => {
      const profile = await storage.createProfile({
        profileName: 'Stats Test',
        real: { name: 'User' },
        alias: { name: 'Alias' },
      });

      await storage.incrementProfileUsage(profile.id, 'chatgpt', 'name');

      const profiles = await storage.loadProfiles();
      const updated = profiles[0];

      expect(updated.metadata.usageStats.totalSubstitutions).toBe(1);
      expect(updated.metadata.usageStats.byService.chatgpt).toBe(1);
      expect(updated.metadata.usageStats.byPIIType.name).toBe(1);
      expect(updated.metadata.usageStats.lastUsed).toBeGreaterThan(0);
    });

    test('tracks multiple services correctly', async () => {
      const profile = await storage.createProfile({
        profileName: 'Multi-Service Test',
        real: { name: 'User', email: 'user@test.com' },
        alias: { name: 'Alias', email: 'alias@test.com' },
      });

      await storage.incrementProfileUsage(profile.id, 'chatgpt', 'name');
      await storage.incrementProfileUsage(profile.id, 'claude', 'email');
      await storage.incrementProfileUsage(profile.id, 'chatgpt', 'name');

      const profiles = await storage.loadProfiles();
      const stats = profiles[0].metadata.usageStats;

      expect(stats.totalSubstitutions).toBe(3);
      expect(stats.byService.chatgpt).toBe(2);
      expect(stats.byService.claude).toBe(1);
      expect(stats.byPIIType.name).toBe(2);
      expect(stats.byPIIType.email).toBe(1);
    });
  });

  describe('Configuration Management', () => {
    test.skip('initializes with default config', async () => {
      await storage.initialize();
      const config = await storage.loadConfig();

      expect(config).not.toBeNull();
      expect(config?.version).toBe(2);
      expect(config?.settings.enabled).toBe(true);
      expect(config?.stats.totalSubstitutions).toBe(0);
      expect(config?.settings.protectedDomains).toContain('chat.openai.com');
    });

    test('saves and loads config', async () => {
      const testConfig: UserConfig = {
        version: 2,
        account: {
          emailOptIn: true,
          tier: 'pro',
          syncEnabled: true,
        },
        settings: {
          enabled: false,
          defaultMode: 'manual',
          showNotifications: false,
          protectedDomains: ['custom.domain.com'],
          excludedDomains: [],
          strictMode: true,
          debugMode: true,
          cloudSync: true,
        },
        profiles: [],
        stats: {
          totalSubstitutions: 100,
          totalInterceptions: 50,
          totalWarnings: 5,
          successRate: 0.95,
          lastSyncTimestamp: Date.now(),
          byService: {
            chatgpt: { requests: 10, substitutions: 20 },
            claude: { requests: 5, substitutions: 10 },
            gemini: { requests: 3, substitutions: 6 },
            perplexity: { requests: 0, substitutions: 0 },
            poe: { requests: 0, substitutions: 0 },
            copilot: { requests: 0, substitutions: 0 },
            you: { requests: 0, substitutions: 0 },
          },
          activityLog: [],
        },
      };

      await storage.saveConfig(testConfig);
      const loaded = await storage.loadConfig();

      expect(loaded?.account.tier).toBe('pro');
      expect(loaded?.settings.strictMode).toBe(true);
      expect(loaded?.stats.totalSubstitutions).toBe(100);
    });
  });

  describe.skip('Encryption', () => {
    test('encrypts and decrypts profiles correctly', async () => {
      const profile = await storage.createProfile({
        profileName: 'Encryption Test',
        real: {
          name: 'Sensitive Name',
          email: 'sensitive@email.com',
          phone: '+1234567890',
        },
        alias: {
          name: 'Public Name',
          email: 'public@email.com',
          phone: '+0987654321',
        },
      });

      // Reload profiles from storage (forces decrypt)
      const profiles = await storage.loadProfiles();

      expect(profiles[0].real.name).toBe('Sensitive Name');
      expect(profiles[0].real.email).toBe('sensitive@email.com');
      expect(profiles[0].alias.phone).toBe('+0987654321');
    });

    test('handles decryption errors gracefully', async () => {
      // Manually corrupt the encrypted data
      mockStorageData.profiles = 'corrupted-encrypted-data-that-cannot-be-decrypted';

      const profiles = await storage.loadProfiles();

      // Should return empty array instead of throwing
      expect(profiles).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty profiles array', async () => {
      const profiles = await storage.loadProfiles();
      expect(profiles).toEqual([]);
    });

    test('handles missing config gracefully', async () => {
      const config = await storage.loadConfig();
      expect(config).toBeNull();
    });

    test.skip('creates profile with minimal data', async () => {
      const profile = await storage.createProfile({
        profileName: 'Minimal',
        real: {},
        alias: {},
      });

      expect(profile.id).toBeDefined();
      expect(profile.profileName).toBe('Minimal');
      expect(profile.real).toEqual({});
      expect(profile.alias).toEqual({});
    });

    test.skip('handles concurrent profile operations', async () => {
      // Create multiple profiles concurrently
      const promises = [
        storage.createProfile({
          profileName: 'Concurrent 1',
          real: { name: 'User 1' },
          alias: { name: 'Alias 1' },
        }),
        storage.createProfile({
          profileName: 'Concurrent 2',
          real: { name: 'User 2' },
          alias: { name: 'Alias 2' },
        }),
        storage.createProfile({
          profileName: 'Concurrent 3',
          real: { name: 'User 3' },
          alias: { name: 'Alias 3' },
        }),
      ];

      const profiles = await Promise.all(promises);

      expect(profiles.length).toBe(3);
      expect(profiles[0].profileName).toBe('Concurrent 1');
      expect(profiles[1].profileName).toBe('Concurrent 2');
      expect(profiles[2].profileName).toBe('Concurrent 3');

      // Verify all were saved
      const loaded = await storage.loadProfiles();
      expect(loaded.length).toBe(3);
    });
  });

  describe.skip('Data Validation', () => {
    test('generates unique IDs for profiles', async () => {
      const profile1 = await storage.createProfile({
        profileName: 'Profile 1',
        real: { name: 'User 1' },
        alias: { name: 'Alias 1' },
      });

      const profile2 = await storage.createProfile({
        profileName: 'Profile 2',
        real: { name: 'User 2' },
        alias: { name: 'Alias 2' },
      });

      expect(profile1.id).not.toBe(profile2.id);
    });

    test('preserves profile metadata on update', async () => {
      const profile = await storage.createProfile({
        profileName: 'Metadata Test',
        real: { name: 'Original' },
        alias: { name: 'Alias' },
      });

      const originalCreatedAt = profile.metadata.createdAt;

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 10));

      await storage.updateProfile(profile.id, {
        real: { name: 'Updated' },
      });

      const profiles = await storage.loadProfiles();
      const updated = profiles[0];

      // createdAt should be unchanged
      expect(updated.metadata.createdAt).toBe(originalCreatedAt);

      // updatedAt should be newer
      expect(updated.metadata.updatedAt).toBeGreaterThan(originalCreatedAt);
    });

    test('default profile settings are applied correctly', async () => {
      const profile = await storage.createProfile({
        profileName: 'Defaults Test',
        real: { name: 'User' },
        alias: { name: 'Alias' },
      });

      expect(profile.enabled).toBe(true);
      expect(profile.settings.autoReplace).toBe(true);
      expect(profile.settings.highlightInUI).toBe(true);
      expect(profile.settings.activeServices).toContain('chatgpt');
      expect(profile.settings.activeServices).toContain('claude');
      expect(profile.settings.activeServices).toContain('gemini');
      expect(profile.metadata.confidence).toBe(1);
    });
  });
});
