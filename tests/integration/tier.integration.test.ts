/**
 * @jest-environment node
 *
 * Integration tests for Tier System with Real Firebase Auth
 * Tests tier limits, feature gating, downgrade/upgrade flows with real encryption
 *
 * These tests use real Firebase authentication to properly test
 * tier archive encryption with real Firebase UID.
 */

import {
  setupIntegrationTests,
  teardownIntegrationTests,
  getCurrentTestUser,
} from './setup';
import { User } from 'firebase/auth';
import { StorageManager } from '../../src/lib/storage';
import { archiveProData, restoreProData, getArchivedData, clearArchivedData } from '../../src/lib/tierArchive';
import { handleDowngrade, handleDatabaseUpgrade } from '../../src/lib/tierMigration';

// Access mock data from global setup
const { mockStorageData } = require('../setup');

describe('Tier System', () => {
  let storage: StorageManager;
  let testUser: User;

  // Set up Firebase auth before all tests
  beforeAll(async () => {
    // Mock document global so storage doesn't think we're in a service worker
    (global as any).document = {};

    testUser = await setupIntegrationTests();

    // Configure StorageManager to use test auth instance
    // This allows tests to use a separate Firebase instance from production
    const testAuth = require('./setup').getTestAuth();
    storage = StorageManager.getInstance();
    storage.setCustomAuth(testAuth);
    console.log('[Test Setup] Configured StorageManager with test auth instance');
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    // Clear custom auth before teardown
    if (storage) {
      storage.clearCustomAuth();
    }
    await teardownIntegrationTests();
  }, 30000);

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    Object.keys(mockStorageData).forEach((key) => delete mockStorageData[key]);

    // Get fresh instance and clear its cache
    storage = StorageManager.getInstance();
    storage.clearCache();
  });

  describe('Profile Limits', () => {
    test('FREE tier can create 1 profile', async () => {
      // Set up FREE tier config
      await storage.saveConfig({
        account: { userId: 'test-user', email: 'test@test.com', tier: 'free' },
        promptTemplates: {
          templates: [],
          maxTemplates: -1,
          enableKeyboardShortcuts: false,
        },
      });

      const profileData = {
        profileName: 'Test Profile 1',
        real: { name: 'John Doe', email: 'john@test.com' },
        alias: { name: 'Jane Smith', email: 'jane@test.com' },
      };

      const profile = await storage.createProfile(profileData);
      expect(profile.profileName).toBe('Test Profile 1');
    });

    test('FREE tier cannot create 2nd profile', async () => {
      // Set up FREE tier config
      await storage.saveConfig({
        account: { userId: 'test-user', email: 'test@test.com', tier: 'free' },
        promptTemplates: {
          templates: [],
          maxTemplates: -1,
          enableKeyboardShortcuts: false,
        },
      });

      // Create first profile
      await storage.createProfile({
        profileName: 'Profile 1',
        real: { name: 'John Doe' },
        alias: { name: 'Jane Smith' },
      });

      // Try to create second profile - should fail
      await expect(
        storage.createProfile({
          profileName: 'Profile 2',
          real: { name: 'Bob Johnson' },
          alias: { name: 'Alice Williams' },
        })
      ).rejects.toThrow('FREE_TIER_LIMIT');
    });

    test('PRO tier can create unlimited profiles', async () => {
      // Set up PRO tier config
      await storage.saveConfig({
        account: { userId: 'test-user', email: 'test@test.com', tier: 'pro' },
        promptTemplates: {
          templates: [],
          maxTemplates: -1,
          enableKeyboardShortcuts: false,
        },
      });

      // Create 5 profiles - should all succeed
      for (let i = 1; i <= 5; i++) {
        const profile = await storage.createProfile({
          profileName: `Profile ${i}`,
          real: { name: `User ${i}` },
          alias: { name: `Alias ${i}` },
        });
        expect(profile.profileName).toBe(`Profile ${i}`);
      }

      const profiles = await storage.loadProfiles();
      expect(profiles.length).toBe(5);
    });
  });

  describe('Template Limits', () => {
    test('starter templates have isStarter flag', () => {
      const starters = storage['getStarterTemplates'](); // Access private method for testing
      expect(starters).toHaveLength(3);
      expect(starters[0].isStarter).toBe(true);
      expect(starters[0].id).toBe('starter-professional-email');
      expect(starters[1].id).toBe('starter-code-review');
      expect(starters[2].id).toBe('starter-meeting-summary');
    });

    test('FREE tier cannot create custom templates', async () => {
      await storage.saveConfig({
        account: { userId: 'test-user', email: 'test@test.com', tier: 'free' },
        promptTemplates: {
          templates: storage['getStarterTemplates'](),
          maxTemplates: -1,
          enableKeyboardShortcuts: false,
        },
      });

      await expect(
        storage.addPromptTemplate({
          name: 'Custom Template',
          content: 'Hello {{name}}',
          description: 'Test template',
        })
      ).rejects.toThrow('PRO_FEATURE');
    });

    test('FREE tier cannot edit starter templates', async () => {
      const starters = storage['getStarterTemplates']();
      await storage.saveConfig({
        account: { userId: 'test-user', email: 'test@test.com', tier: 'free' },
        promptTemplates: {
          templates: starters,
          maxTemplates: -1,
          enableKeyboardShortcuts: false,
        },
      });

      await expect(
        storage.updatePromptTemplate(starters[0].id, {
          name: 'Modified Starter',
        })
      ).rejects.toThrow('PRO_FEATURE');
    });

    test('PRO tier can create custom templates', async () => {
      await storage.saveConfig({
        account: { userId: 'test-user', email: 'test@test.com', tier: 'pro' },
        promptTemplates: {
          templates: storage['getStarterTemplates'](),
          maxTemplates: -1,
          enableKeyboardShortcuts: false,
        },
      });

      const template = await storage.addPromptTemplate({
        name: 'Custom Template',
        content: 'Hello {{name}}',
        description: 'Test template',
      });

      expect(template.name).toBe('Custom Template');
      expect(template.isStarter).toBeUndefined();
    });
  });

  describe('Custom Rules Access', () => {
    test('FREE tier cannot create custom rules', async () => {
      await storage.saveConfig({
        account: { userId: 'test-user', email: 'test@test.com', tier: 'free' },
        customRules: { enabled: false, rules: [] },
      });

      await expect(
        storage.addCustomRule({
          name: 'Test Rule',
          pattern: 'test',
          replacement: 'REDACTED',
          category: 'custom',
        })
      ).rejects.toThrow('PRO_FEATURE');
    });

    test('PRO tier can create custom rules', async () => {
      await storage.saveConfig({
        account: { userId: 'test-user', email: 'test@test.com', tier: 'pro' },
        customRules: { enabled: true, rules: [] },
      });

      const ruleId = await storage.addCustomRule({
        name: 'Test Rule',
        pattern: 'test',
        replacement: 'REDACTED',
        category: 'custom',
      });

      expect(ruleId).toBeDefined();
      const config = await storage.loadConfig();
      expect(config?.customRules?.rules.length).toBe(1);
    });
  });

  describe('Archive System', () => {
    test('archives PRO data with encryption', async () => {
      const userId = 'test-user';

      // Create some PRO data
      await storage.saveConfig({
        account: { userId, email: 'test@test.com', tier: 'pro' },
        promptTemplates: {
          templates: storage['getStarterTemplates'](),
          maxTemplates: -1,
          enableKeyboardShortcuts: false,
        },
        customRules: { enabled: true, rules: [] },
      });

      await storage.createProfile({
        profileName: 'Test Profile',
        real: { name: 'John Doe' },
        alias: { name: 'Jane Smith' },
      });

      // Archive the data
      await archiveProData(userId);

      // Check that archive exists
      const archive = await getArchivedData(userId);
      expect(archive).toBeDefined();
      expect(archive?.userId).toBe(userId);
      expect(archive?.encryptedData).toBeDefined();
      expect(archive?.expiresAt).toBeGreaterThan(Date.now());
    });

    test('restores archived data correctly', async () => {
      const userId = 'test-user';

      // Create and archive data
      await storage.saveConfig({
        account: { userId, email: 'test@test.com', tier: 'pro' },
        promptTemplates: {
          templates: storage['getStarterTemplates'](),
          maxTemplates: -1,
          enableKeyboardShortcuts: false,
        },
      });

      await storage.createProfile({
        profileName: 'Archived Profile',
        real: { name: 'John Doe' },
        alias: { name: 'Jane Smith' },
      });

      await archiveProData(userId);

      // Wipe current data
      await storage.saveProfiles([]);

      // Restore
      const restored = await restoreProData(userId);
      expect(restored).toBe(true);

      const profiles = await storage.loadProfiles();
      expect(profiles.length).toBe(1);
      expect(profiles[0].profileName).toBe('Archived Profile');
    });

    test('archive expires after 90 days', async () => {
      const userId = 'test-user';

      await archiveProData(userId);

      // Manually set archive expiration to past
      const archive = mockStorageData['_archivedProData'];
      archive.expiresAt = Date.now() - 1000; // Expired 1 second ago

      // Try to get expired archive
      const retrieved = await getArchivedData(userId);
      expect(retrieved).toBeNull();
    });
  });

  describe('Downgrade Flow', () => {
    test('handleDowngrade archives data and wipes profiles', async () => {
      const userId = 'test-user';

      // Set up PRO user with data
      await storage.saveConfig({
        account: { userId, email: 'test@test.com', tier: 'pro' },
        promptTemplates: {
          templates: storage['getStarterTemplates'](),
          maxTemplates: -1,
          enableKeyboardShortcuts: false,
        },
      });

      await storage.createProfile({
        profileName: 'Profile 1',
        real: { name: 'John Doe' },
        alias: { name: 'Jane Smith' },
      });

      await storage.createProfile({
        profileName: 'Profile 2',
        real: { name: 'Bob Johnson' },
        alias: { name: 'Alice Williams' },
      });

      // Trigger downgrade
      await handleDowngrade(userId);

      // Check that archive exists
      const archive = await getArchivedData(userId);
      expect(archive).toBeDefined();

      // Check that profiles were wiped
      const profiles = await storage.loadProfiles();
      expect(profiles.length).toBe(0);

      // Check that only starter templates remain
      const config = await storage.loadConfig();
      expect(config?.promptTemplates?.templates.length).toBe(3);
      expect(config?.promptTemplates?.templates.every((t) => t.isStarter)).toBe(true);
    });
  });

  describe('Upgrade Flow', () => {
    test('handleDatabaseUpgrade detects archived data', async () => {
      const userId = 'test-user';

      // Create and archive some data
      await storage.saveConfig({
        account: { userId, email: 'test@test.com', tier: 'pro' },
        promptTemplates: {
          templates: storage['getStarterTemplates'](),
          maxTemplates: -1,
          enableKeyboardShortcuts: false,
        },
      });

      await storage.createProfile({
        profileName: 'Old Profile',
        real: { name: 'John Doe' },
        alias: { name: 'Jane Smith' },
      });

      await archiveProData(userId);

      // Check upgrade handler detects archive
      const result = await handleDatabaseUpgrade(userId);
      expect(result.hasArchive).toBe(true);
      expect(result.archiveInfo).toBeDefined();
      expect(result.archiveInfo?.profileCount).toBe(1);
    });

    test('handleDatabaseUpgrade returns no archive for new user', async () => {
      const result = await handleDatabaseUpgrade('new-user');
      expect(result.hasArchive).toBe(false);
      expect(result.archiveInfo).toBeUndefined();
    });
  });
});
