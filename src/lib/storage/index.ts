/**
 * Storage Module - Public API
 * Re-exports the main StorageManager class for external use
 *
 * Usage:
 *   import { StorageManager } from './lib/storage';
 *   const storage = StorageManager.getInstance();
 */

export { StorageManager } from '../storage';
export * from './storage-utils';
