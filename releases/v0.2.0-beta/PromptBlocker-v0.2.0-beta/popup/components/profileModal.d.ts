/**
 * Profile Modal Component
 * Handles profile creation, editing, and deletion
 */
import { AliasProfile } from '../../lib/types';
/**
 * Initialize profile modal event listeners
 */
export declare function initProfileModal(): void;
/**
 * Open profile editor modal
 */
export declare function openProfileModal(mode: 'create' | 'edit', profile?: AliasProfile): void;
/**
 * Close profile editor modal
 */
export declare function closeProfileModal(): void;
/**
 * Show delete confirmation modal
 * Can be called with profileId or uses currentEditingProfileId
 */
export declare function showDeleteConfirmation(profileId?: string): void;
//# sourceMappingURL=profileModal.d.ts.map