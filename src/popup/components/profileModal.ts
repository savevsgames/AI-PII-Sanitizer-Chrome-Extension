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

  // Variations list toggle
  const toggleVariationsBtn = document.getElementById('toggleVariationsList');
  toggleVariationsBtn?.addEventListener('click', toggleVariationsList);

  // Enable variations toggle - show/hide management section
  const enableVariationsCheckbox = document.getElementById('enableVariations') as HTMLInputElement;
  enableVariationsCheckbox?.addEventListener('change', (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    const managementSection = document.getElementById('variationsManagementSection');
    if (enabled && currentEditingProfileId) {
      managementSection?.classList.remove('hidden');
    } else {
      managementSection?.classList.add('hidden');
    }
  });

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
  const variationsManagementSection = document.getElementById('variationsManagementSection');

  if (!modal || !modalTitle || !modalDelete || !form) return;

  // Set editing mode
  currentEditingProfileId = profile?.id || null;

  // Update modal UI based on mode
  if (mode === 'create') {
    modalTitle.textContent = 'Create Profile';
    modalDelete.classList.add('hidden');
    form.reset();
    // Default enable toggles to checked
    (document.getElementById('profileEnabled') as HTMLInputElement).checked = true;
    (document.getElementById('enableVariations') as HTMLInputElement).checked = true;
    // Hide variations management section in create mode
    variationsManagementSection?.classList.add('hidden');
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

  // Enable toggles
  (document.getElementById('profileEnabled') as HTMLInputElement).checked = profile.enabled;
  (document.getElementById('enableVariations') as HTMLInputElement).checked =
    profile.settings?.enableVariations ?? true;

  // Show variations management section if variations enabled
  const variationsManagementSection = document.getElementById('variationsManagementSection');
  if (profile.settings?.enableVariations ?? true) {
    variationsManagementSection?.classList.remove('hidden');
    // Populate variations list
    if (profile.variations || profile.customVariations) {
      renderVariationsManagement(profile);
    }
    // Update hint text with actual variations examples
    updateVariationsHintText(profile);
  } else {
    variationsManagementSection?.classList.add('hidden');
  }
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
    settings: {
      enableVariations: (document.getElementById('enableVariations') as HTMLInputElement).checked,
    },
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
      // Update existing profile - cast to any to allow partial settings
      await store.updateProfile(currentEditingProfileId, formData as any);
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

/**
 * Toggle variations list visibility
 */
function toggleVariationsList() {
  const listContainer = document.getElementById('variationsListContainer');
  const toggleIcon = document.getElementById('variationsToggleIcon');
  const toggleText = document.getElementById('variationsToggleText');

  if (!listContainer || !toggleIcon || !toggleText) return;

  if (listContainer.classList.contains('hidden')) {
    listContainer.classList.remove('hidden');
    toggleIcon.classList.add('expanded');
    toggleText.textContent = 'Hide variations';
  } else {
    listContainer.classList.add('hidden');
    toggleIcon.classList.remove('expanded');
    toggleText.textContent = 'Show variations';
  }
}

/**
 * Render variations management UI
 */
function renderVariationsManagement(profile: AliasProfile) {
  const container = document.getElementById('variationsByField');
  if (!container) return;

  // Clear existing content
  container.innerHTML = '';

  // Map of field names to display labels
  const fieldLabels: Record<string, string> = {
    name: '👤 Name',
    email: '📧 Email',
    phone: '📞 Phone',
    cellPhone: '📱 Cell Phone',
    address: '🏠 Address',
    company: '🏢 Company',
  };

  // Combine auto-generated and custom variations
  const allFields = new Set([
    ...Object.keys(profile.variations?.real || {}),
    ...Object.keys(profile.customVariations?.real || {}),
  ]);

  allFields.forEach((field) => {
    const autoVariations = profile.variations?.real[field] || [];
    const customVariations = profile.customVariations?.real[field] || [];
    const disabledVariations = profile.disabledVariations?.real[field] || [];

    if (autoVariations.length === 0 && customVariations.length === 0) return;

    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'variation-field-group';

    // Header
    const header = document.createElement('div');
    header.className = 'variation-field-header';
    const totalEnabled = autoVariations.filter(v => !disabledVariations.includes(v)).length +
                         customVariations.filter(v => v.enabled).length;
    const totalCount = autoVariations.length + customVariations.length;

    header.innerHTML = `
      <div class="variation-field-title">
        ${fieldLabels[field] || field}
        <span class="badge">${totalEnabled}/${totalCount}</span>
      </div>
    `;
    fieldGroup.appendChild(header);

    // Items container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'variation-items';

    // Render auto-generated variations
    autoVariations.forEach((variation) => {
      const enabled = !disabledVariations.includes(variation);
      const item = createVariationItem(variation, 'auto', field, enabled);
      itemsContainer.appendChild(item);
    });

    // Render custom variations (editable)
    customVariations.forEach((varObj) => {
      const item = createVariationItem(varObj.value, 'custom', field, varObj.enabled);
      itemsContainer.appendChild(item);
    });

    fieldGroup.appendChild(itemsContainer);

    // Add variation form
    const addForm = createAddVariationForm(field);
    fieldGroup.appendChild(addForm);

    container.appendChild(fieldGroup);
  });
}

/**
 * Create a single variation item element
 */
function createVariationItem(text: string, type: 'auto' | 'custom', field: string, enabled: boolean = true): HTMLElement {
  const item = document.createElement('div');
  item.className = `variation-item ${!enabled ? 'disabled' : ''}`;

  // Toggle switch
  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'variation-toggle';

  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.checked = enabled;
  toggleInput.addEventListener('change', (e) => {
    const isEnabled = (e.target as HTMLInputElement).checked;
    toggleVariation(field, text, type, isEnabled);
  });

  const toggleSlider = document.createElement('span');
  toggleSlider.className = 'variation-toggle-slider';

  toggleLabel.appendChild(toggleInput);
  toggleLabel.appendChild(toggleSlider);
  item.appendChild(toggleLabel);

  // Text content
  const textContainer = document.createElement('div');
  textContainer.style.display = 'flex';
  textContainer.style.alignItems = 'center';
  textContainer.style.flex = '1';

  const textSpan = document.createElement('span');
  textSpan.className = 'variation-item-text';
  textSpan.textContent = text;
  textContainer.appendChild(textSpan);

  if (type === 'auto') {
    const label = document.createElement('span');
    label.className = 'variation-item-label';
    label.textContent = 'auto';
    textContainer.appendChild(label);
  }

  item.appendChild(textContainer);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'variation-item-actions';

  if (type === 'custom') {
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon edit';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edit variation';
    editBtn.addEventListener('click', () => editCustomVariation(field, text));
    actions.appendChild(editBtn);
  }

  // Delete button (available for both auto and custom, but auto just disables)
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-icon delete';
  deleteBtn.innerHTML = type === 'custom' ? '🗑️' : '✖️';
  deleteBtn.title = type === 'custom' ? 'Delete variation' : 'Remove variation';
  deleteBtn.addEventListener('click', () => {
    if (type === 'custom') {
      deleteCustomVariation(field, text);
    } else {
      // For auto-generated, just disable it
      toggleVariation(field, text, type, false);
    }
  });
  actions.appendChild(deleteBtn);

  item.appendChild(actions);

  return item;
}

/**
 * Create add variation form
 */
function createAddVariationForm(field: string): HTMLElement {
  const form = document.createElement('div');
  form.className = 'add-variation-form';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'add-variation-input';
  input.placeholder = `Add custom ${field} variation...`;
  input.dataset.field = field;

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn-add-variation';
  addBtn.textContent = '+ Add';
  addBtn.addEventListener('click', () => {
    const value = input.value.trim();
    if (value) {
      addCustomVariation(field, value);
      input.value = '';
    }
  });

  // Allow Enter key to add
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBtn.click();
    }
  });

  form.appendChild(input);
  form.appendChild(addBtn);

  return form;
}

/**
 * Toggle a variation on/off
 */
function toggleVariation(field: string, value: string, type: 'auto' | 'custom', enabled: boolean) {
  if (!currentEditingProfileId) return;

  const store = useAppStore.getState();
  const profile = store.profiles.find((p) => p.id === currentEditingProfileId);
  if (!profile) return;

  if (type === 'auto') {
    // For auto-generated, add/remove from disabledVariations
    if (!profile.disabledVariations) {
      profile.disabledVariations = { real: {}, alias: {} };
    }
    if (!profile.disabledVariations.real[field]) {
      profile.disabledVariations.real[field] = [];
    }

    if (enabled) {
      // Remove from disabled list
      profile.disabledVariations.real[field] = profile.disabledVariations.real[field].filter(v => v !== value);
    } else {
      // Add to disabled list
      if (!profile.disabledVariations.real[field].includes(value)) {
        profile.disabledVariations.real[field].push(value);
      }
    }

    store.updateProfile(currentEditingProfileId, {
      disabledVariations: profile.disabledVariations,
    } as any);
  } else {
    // For custom, update the enabled flag
    if (profile.customVariations?.real[field]) {
      const varObj = profile.customVariations.real[field].find(v => v.value === value);
      if (varObj) {
        varObj.enabled = enabled;
        store.updateProfile(currentEditingProfileId, {
          customVariations: profile.customVariations,
        } as any);
      }
    }
  }

  // Re-render
  renderVariationsManagement(profile);
  console.log('[Profile Modal] Toggled variation:', field, value, enabled);
}

/**
 * Edit a custom variation
 */
function editCustomVariation(field: string, oldValue: string) {
  const newValue = prompt('Edit variation:', oldValue);
  if (!newValue || newValue.trim() === '') return;
  if (newValue === oldValue) return;

  if (!currentEditingProfileId) return;

  const store = useAppStore.getState();
  const profile = store.profiles.find((p) => p.id === currentEditingProfileId);
  if (!profile || !profile.customVariations) return;

  // Check for duplicates
  const allVariations = [
    ...(profile.variations?.real[field] || []),
    ...(profile.customVariations.real[field]?.map(v => v.value) || []),
  ];

  if (allVariations.some((v) => v.toLowerCase() === newValue.toLowerCase() && v !== oldValue)) {
    alert('This variation already exists!');
    return;
  }

  // Update the variation
  const varObj = profile.customVariations.real[field]?.find(v => v.value === oldValue);
  if (varObj) {
    varObj.value = newValue;
    store.updateProfile(currentEditingProfileId, {
      customVariations: profile.customVariations,
    } as any);

    // Re-render
    renderVariationsManagement(profile);
    console.log('[Profile Modal] Edited custom variation:', field, oldValue, '->', newValue);
  }
}

/**
 * Add a custom variation
 */
function addCustomVariation(field: string, value: string) {
  if (!currentEditingProfileId) return;

  const store = useAppStore.getState();
  const profile = store.profiles.find((p) => p.id === currentEditingProfileId);
  if (!profile) return;

  // Initialize customVariations if not exists
  if (!profile.customVariations) {
    profile.customVariations = { real: {}, alias: {} };
  }

  // Initialize field array if not exists
  if (!profile.customVariations.real[field]) {
    profile.customVariations.real[field] = [];
  }

  // Check for duplicates
  const allVariations = [
    ...(profile.variations?.real[field] || []),
    ...(profile.customVariations.real[field]?.map(v => v.value) || []),
  ];

  if (allVariations.some((v) => v.toLowerCase() === value.toLowerCase())) {
    alert('This variation already exists!');
    return;
  }

  // Add the variation (enabled by default)
  profile.customVariations.real[field].push({ value, enabled: true });

  // Update profile in store
  store.updateProfile(currentEditingProfileId, {
    customVariations: profile.customVariations,
  } as any);

  // Re-render
  renderVariationsManagement(profile);
  console.log('[Profile Modal] Added custom variation:', field, value);
}

/**
 * Delete a custom variation
 */
function deleteCustomVariation(field: string, value: string) {
  if (!currentEditingProfileId) return;

  const store = useAppStore.getState();
  const profile = store.profiles.find((p) => p.id === currentEditingProfileId);
  if (!profile || !profile.customVariations) return;

  // Remove the variation
  const variations = profile.customVariations.real[field] || [];
  const index = variations.findIndex((v) => v.value === value);
  if (index !== -1) {
    variations.splice(index, 1);

    // Update profile in store
    store.updateProfile(currentEditingProfileId, {
      customVariations: profile.customVariations,
    } as any);

    // Re-render
    renderVariationsManagement(profile);
    console.log('[Profile Modal] Deleted custom variation:', field, value);
  }
}

/**
 * Update the variations hint text with actual examples from the profile
 */
function updateVariationsHintText(profile: AliasProfile) {
  const hintElement = document.getElementById('variationsHintText');
  if (!hintElement) return;

  // Get name variations if they exist
  const nameVariations = profile.variations?.real['name'];

  if (nameVariations && nameVariations.length > 3) {
    // Show first 3 variations as examples
    const examples = nameVariations.slice(0, 3).map(v => `"${v}"`).join(', ');
    hintElement.textContent = `Match different formats like ${examples}, etc.`;
  } else {
    // Fallback to generic text
    hintElement.textContent = 'Automatically detect different name formats and variations';
  }
}
