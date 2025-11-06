/**
 * Tier Archive System
 *
 * Handles archiving PRO data when users downgrade to FREE tier
 * and restoration when they re-subscribe within 90 days.
 */

import { StorageManager } from './storage';

interface ArchivedProData {
  userId: string;
  archivedAt: number;
  expiresAt: number;
  encryptedData: string;
}

const ARCHIVE_KEY = '_archivedProData';
const ARCHIVE_DURATION_DAYS = 90;

/**
 * Archive all PRO data for a user (profiles, templates, rules, settings)
 * Data is encrypted and stored for 90 days
 */
export async function archiveProData(userId: string): Promise<void> {
  console.log('[Archive] 📦 Archiving PRO data for user:', userId);

  const storage = StorageManager.getInstance();

  // Collect all PRO data
  const profiles = await storage.loadProfiles();
  const config = await storage.loadConfig();

  const proData = {
    profiles: profiles, // All profiles
    customTemplates: config?.promptTemplates?.templates.filter(t => !t.isStarter) || [],
    customRules: config?.customRules?.rules || [],
    settings: config?.settings || {},
    stats: config?.stats || {},
  };

  // Encrypt the data
  const encrypted = await storage.encrypt(JSON.stringify(proData));

  const archive: ArchivedProData = {
    userId,
    archivedAt: Date.now(),
    expiresAt: Date.now() + (ARCHIVE_DURATION_DAYS * 24 * 60 * 60 * 1000),
    encryptedData: encrypted,
  };

  // Save to Chrome storage
  await chrome.storage.local.set({ [ARCHIVE_KEY]: archive });

  console.log('[Archive] ✅ PRO data archived, expires in 90 days');
}

/**
 * Get archived data for a user (if exists and not expired)
 */
export async function getArchivedData(userId: string): Promise<ArchivedProData | null> {
  const result = await chrome.storage.local.get(ARCHIVE_KEY);
  const archive = result[ARCHIVE_KEY] as ArchivedProData | undefined;

  if (!archive || archive.userId !== userId) {
    return null;
  }

  // Check if expired
  if (Date.now() > archive.expiresAt) {
    await clearArchivedData(userId);
    return null;
  }

  return archive;
}

/**
 * Restore archived PRO data when user re-subscribes
 * Returns true if restoration succeeded, false if no archive found
 */
export async function restoreProData(userId: string): Promise<boolean> {
  console.log('[Archive] 📂 Restoring PRO data for user:', userId);

  const archive = await getArchivedData(userId);
  if (!archive) {
    console.warn('[Archive] No archived data found');
    return false;
  }

  const storage = StorageManager.getInstance();

  // Decrypt the data
  const decrypted = await storage.decrypt(archive.encryptedData);
  const proData = JSON.parse(decrypted);

  // Restore profiles
  await storage.saveProfiles(proData.profiles);

  // Restore templates, rules, settings
  const config = await storage.loadConfig();
  if (config) {
    config.promptTemplates!.templates = [
      ...storage['getStarterTemplates'](), // Keep starters (using bracket notation to access private method)
      ...proData.customTemplates,          // Add custom
    ];
    config.customRules = { enabled: true, rules: proData.customRules };
    config.settings = { ...config.settings, ...proData.settings };
    config.stats = { ...config.stats, ...proData.stats };

    await storage.saveConfig(config);
  }

  // Clear the archive (no longer needed)
  await clearArchivedData(userId);

  console.log('[Archive] ✅ PRO data restored successfully');
  return true;
}

/**
 * Clear archived data for a user
 */
export async function clearArchivedData(_userId: string): Promise<void> {
  await chrome.storage.local.remove(ARCHIVE_KEY);
  console.log('[Archive] 🗑️  Archived data cleared');
}

/**
 * Format archive date for display
 */
export function formatArchiveDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get archive stats for UI display
 */
export async function getArchiveStats(userId: string): Promise<{
  hasArchive: boolean;
  archivedAt?: string;
  expiresAt?: string;
  profileCount?: number;
  templateCount?: number;
  ruleCount?: number;
} | null> {
  const archive = await getArchivedData(userId);
  if (!archive) {
    return null;
  }

  const storage = StorageManager.getInstance();
  const decrypted = await storage.decrypt(archive.encryptedData);
  const proData = JSON.parse(decrypted);

  return {
    hasArchive: true,
    archivedAt: formatArchiveDate(archive.archivedAt),
    expiresAt: formatArchiveDate(archive.expiresAt),
    profileCount: proData.profiles?.length || 0,
    templateCount: proData.customTemplates?.length || 0,
    ruleCount: proData.customRules?.length || 0,
  };
}
