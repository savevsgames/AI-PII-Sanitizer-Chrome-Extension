/**
 * Storage Utilities
 * Shared utility functions for storage operations
 */

/**
 * Generate unique ID for storage entities
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get storage quota information
 * With unlimitedStorage permission, quota is essentially disk space
 */
export async function getStorageQuota(): Promise<{
  used: number;
  quota: number;
  percentage: number;
  hasUnlimitedStorage: boolean;
}> {
  const estimate = await navigator.storage.estimate();

  const used = estimate.usage || 0;
  const quota = estimate.quota || 10485760; // 10 MB fallback
  const percentage = (used / quota) * 100;

  // Check if we have unlimited storage
  // With unlimitedStorage permission, quota is huge (disk space)
  const hasUnlimitedStorage = quota > 100000000; // > 100 MB = unlimited

  return {
    used,
    quota,
    percentage,
    hasUnlimitedStorage
  };
}
