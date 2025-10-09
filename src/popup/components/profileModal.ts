/**
 * Profile Modal Component
 * Handles profile creation, editing, and deletion
 */

import { useAppStore } from '../../lib/store';
import { AliasProfile } from '../../lib/types';
import { isValidEmail } from './utils';

// Track currently editing profile ID
let currentEditingProfileId: string | null = null;

/**
 * Initialize profile modal event listeners
 */
export function initProfileModal() {
  // Open modal buttons
  const addProfileBtn = document.getElementById('addProfileBtn');
  const addProfileBtnEmpty = document.getElementById('addProfileBtnEmpty');

  addProfileBtn?.addEventListener('click', () => openProfileModal('create'));
  addProfileBtnEmpty?.addEventListener('click', () => openProfileModal('create'));

  // Profile Editor Modal handlers
  const modalClose = document.getElementById('modalClose');
  const modalCancel = document.getElementById('modalCancel');
  const modalSave = document.getElementById('modalSave');
  const modalDelete = document.getElementById('modalDelete');

  modalClose?.addEventListener('click', closeProfileModal);
  modalCancel?.addEventListener('click', closeProfileModal);
  modalSave?.addEventListener('click', saveProfile);
  modalDelete?.addEventListener('click', () => showDeleteConfirmation());

  // Close modal on overlay click
  const modalOverlay = document.querySelector('#profileModal .modal-overlay');
  modalOverlay?.addEventListener('click', closeProfileModal);

  // Delete Confirmation Modal handlers
  const deleteModalClose = document.getElementById('deleteModalClose');
  const deleteCancel = document.getElementById('deleteCancel');
  const deleteConfirm = document.getElementById('deleteConfirm');

  deleteModalClose?.addEventListener('click', closeDeleteModal);
  deleteCancel?.addEventListener('click', closeDeleteModal);
  deleteConfirm?.addEventListener('click', confirmDeleteProfile);

  // Close delete modal on overlay click
  const deleteModalOverlay = document.querySelector('#deleteModal .modal-overlay');
  deleteModalOverlay?.addEventListener('click', closeDeleteModal);

  // Email validation on blur
  const realEmailInput = document.getElementById('realEmail') as HTMLInputElement;
  const aliasEmailInput = document.getElementById('aliasEmail') as HTMLInputElement;

  realEmailInput?.addEventListener('blur', () => validateEmailField(realEmailInput));
  aliasEmailInput?.addEventListener('blur', () => validateEmailField(aliasEmailInput));

  console.log('[Profile Modal] Initialized');
}

/**
 * Open profile editor modal
 */
export function openProfileModal(mode: 'create' | 'edit', profile?: AliasProfile) {
  const modal = document.getElementById('profileModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDelete = document.getElementById('modalDelete');
  const form = document.getElementById('profileForm') as HTMLFormElement;

  if (!modal || !modalTitle || !modalDelete || !form) return;

  // Set editing mode
  currentEditingProfileId = profile?.id || null;

  // Update modal UI based on mode
  if (mode === 'create') {
    modalTitle.textContent = 'Create Profile';
    modalDelete.classList.add('hidden');
    form.reset();
    // Default enable toggle to checked
    (document.getElementById('profileEnabled') as HTMLInputElement).checked = true;
  } else {
    modalTitle.textContent = 'Edit Profile';
    modalDelete.classList.remove('hidden');
    if (profile) {
      populateForm(profile);
    }
  }

  // Clear any validation errors
  clearFormErrors();

  // Show modal
  modal.classList.remove('hidden');
  console.log(`[Profile Modal] Opened in ${mode} mode`);
}

/**
 * Close profile editor modal
 */
export function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (!modal) return;

  modal.classList.add('hidden');
  currentEditingProfileId = null;
  clearFormErrors();
  console.log('[Profile Modal] Closed');
}

/**
 * Populate form with profile data for editing
 */
function populateForm(profile: AliasProfile) {
  // Profile info
  (document.getElementById('profileName') as HTMLInputElement).value = profile.profileName || '';
  (document.getElementById('profileDescription') as HTMLInputElement).value = profile.description || '';

  // Real information
  (document.getElementById('realName') as HTMLInputElement).value = profile.real.name || '';
  (document.getElementById('realEmail') as HTMLInputElement).value = profile.real.email || '';
  (document.getElementById('realPhone') as HTMLInputElement).value = profile.real.phone || '';
  (document.getElementById('realCellPhone') as HTMLInputElement).value = profile.real.cellPhone || '';
  (document.getElementById('realAddress') as HTMLInputElement).value = profile.real.address || '';
  (document.getElementById('realCompany') as HTMLInputElement).value = profile.real.company || '';

  // Alias information
  (document.getElementById('aliasName') as HTMLInputElement).value = profile.alias.name || '';
  (document.getElementById('aliasEmail') as HTMLInputElement).value = profile.alias.email || '';
  (document.getElementById('aliasPhone') as HTMLInputElement).value = profile.alias.phone || '';
  (document.getElementById('aliasCellPhone') as HTMLInputElement).value = profile.alias.cellPhone || '';
  (document.getElementById('aliasAddress') as HTMLInputElement).value = profile.alias.address || '';
  (document.getElementById('aliasCompany') as HTMLInputElement).value = profile.alias.company || '';

  // Enable toggle
  (document.getElementById('profileEnabled') as HTMLInputElement).checked = profile.enabled;
}

/**
 * Get form data
 */
function getFormData() {
  return {
    profileName: (document.getElementById('profileName') as HTMLInputElement).value.trim(),
    description: (document.getElementById('profileDescription') as HTMLInputElement).value.trim(),
    real: {
      name: (document.getElementById('realName') as HTMLInputElement).value.trim(),
      email: (document.getElementById('realEmail') as HTMLInputElement).value.trim(),
      phone: (document.getElementById('realPhone') as HTMLInputElement).value.trim(),
      cellPhone: (document.getElementById('realCellPhone') as HTMLInputElement).value.trim(),
      address: (document.getElementById('realAddress') as HTMLInputElement).value.trim(),
      company: (document.getElementById('realCompany') as HTMLInputElement).value.trim(),
      custom: {},
    },
    alias: {
      name: (document.getElementById('aliasName') as HTMLInputElement).value.trim(),
      email: (document.getElementById('aliasEmail') as HTMLInputElement).value.trim(),
      phone: (document.getElementById('aliasPhone') as HTMLInputElement).value.trim(),
      cellPhone: (document.getElementById('aliasCellPhone') as HTMLInputElement).value.trim(),
      address: (document.getElementById('aliasAddress') as HTMLInputElement).value.trim(),
      company: (document.getElementById('aliasCompany') as HTMLInputElement).value.trim(),
      custom: {},
    },
    enabled: (document.getElementById('profileEnabled') as HTMLInputElement).checked,
  };
}

/**
 * Validate form
 */
function validateForm(): boolean {
  let isValid = true;

  // Check required field: profileName
  const profileNameInput = document.getElementById('profileName') as HTMLInputElement;
  if (!profileNameInput.value.trim()) {
    profileNameInput.classList.add('error');
    isValid = false;
  } else {
    profileNameInput.classList.remove('error');
  }

  // Validate email fields if they have values
  const realEmailInput = document.getElementById('realEmail') as HTMLInputElement;
  const aliasEmailInput = document.getElementById('aliasEmail') as HTMLInputElement;

  if (realEmailInput.value.trim() && !isValidEmail(realEmailInput.value.trim())) {
    isValid = false;
  }

  if (aliasEmailInput.value.trim() && !isValidEmail(aliasEmailInput.value.trim())) {
    isValid = false;
  }

  return isValid;
}

/**
 * Validate individual email field
 */
function validateEmailField(input: HTMLInputElement): boolean {
  const errorSpan = document.getElementById(`${input.id}Error`);
  const value = input.value.trim();

  if (value && !isValidEmail(value)) {
    input.classList.add('error');
    errorSpan?.classList.remove('hidden');
    return false;
  } else {
    input.classList.remove('error');
    errorSpan?.classList.add('hidden');
    return true;
  }
}

/**
 * Clear all form validation errors
 */
function clearFormErrors() {
  const inputs = document.querySelectorAll('.form-group input');
  const errors = document.querySelectorAll('.form-error');

  inputs.forEach((input) => input.classList.remove('error'));
  errors.forEach((error) => error.classList.add('hidden'));
}

/**
 * Save profile (create or update)
 */
async function saveProfile() {
  console.log('[Profile Modal] Saving profile...');

  // Validate form
  if (!validateForm()) {
    console.log('[Profile Modal] Form validation failed');
    alert('Please fix the errors before saving');
    return;
  }

  // Get form data
  const formData = getFormData();

  // Validate at least one real/alias pair exists
  const hasData =
    (formData.real?.name && formData.alias?.name) ||
    (formData.real?.email && formData.alias?.email) ||
    (formData.real?.phone && formData.alias?.phone) ||
    (formData.real?.cellPhone && formData.alias?.cellPhone) ||
    (formData.real?.address && formData.alias?.address) ||
    (formData.real?.company && formData.alias?.company);

  if (!hasData) {
    alert('Please add at least one real and alias pair (e.g., real name and alias name)');
    return;
  }

  try {
    const store = useAppStore.getState();

    if (currentEditingProfileId) {
      // Update existing profile
      await store.updateProfile(currentEditingProfileId, formData);
      console.log('[Profile Modal] Profile updated:', currentEditingProfileId);
    } else {
      // Create new profile
      await store.addProfile(formData);
      console.log('[Profile Modal] New profile created');
    }

    // Close modal
    closeProfileModal();
  } catch (error) {
    console.error('[Profile Modal] Error saving profile:', error);
    alert('Error saving profile. Please try again.');
  }
}

/**
 * Show delete confirmation modal
 * Can be called with profileId or uses currentEditingProfileId
 */
export function showDeleteConfirmation(profileId?: string) {
  // Use provided profileId or fall back to current editing ID
  const targetProfileId = profileId || currentEditingProfileId;

  if (!targetProfileId) return;

  const store = useAppStore.getState();
  const profile = store.profiles.find((p) => p.id === targetProfileId);

  if (!profile) return;

  // Close profile modal first (if open) - this resets currentEditingProfileId
  closeProfileModal();

  // NOW store the profile ID for deletion (after closeProfileModal)
  currentEditingProfileId = targetProfileId;

  // Show delete confirmation modal
  const deleteModal = document.getElementById('deleteModal');
  const deleteProfileName = document.getElementById('deleteProfileName');

  if (deleteModal && deleteProfileName) {
    deleteProfileName.textContent = profile.profileName;
    deleteModal.classList.remove('hidden');
    console.log('[Profile Modal] Showing delete confirmation for:', profile.profileName);
  }
}

/**
 * Close delete confirmation modal
 */
function closeDeleteModal() {
  const deleteModal = document.getElementById('deleteModal');
  if (!deleteModal) return;

  deleteModal.classList.add('hidden');
  currentEditingProfileId = null;
  console.log('[Profile Modal] Closed delete confirmation');
}

/**
 * Confirm and delete profile
 */
async function confirmDeleteProfile() {
  if (!currentEditingProfileId) return;

  try {
    const store = useAppStore.getState();
    await store.deleteProfile(currentEditingProfileId);
    console.log('[Profile Modal] Profile deleted:', currentEditingProfileId);

    closeDeleteModal();
  } catch (error) {
    console.error('[Profile Modal] Error deleting profile:', error);
    alert('Error deleting profile. Please try again.');
  }
}
