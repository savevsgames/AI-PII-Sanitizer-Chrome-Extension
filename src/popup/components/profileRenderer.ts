/**
 * Profile Renderer Component
 * Renders profile list and handles profile actions
 */

import { useAppStore } from '../../lib/store';
import { AliasProfile } from '../../lib/types';
import { escapeHtml } from './utils';
import { openProfileModal, showDeleteConfirmation } from './profileModal';

/**
 * Render profiles from store
 */
export function renderProfiles(profiles: AliasProfile[]) {
  const profileList = document.getElementById('profileList');
  const emptyState = document.getElementById('profilesEmptyState');

  if (!profileList || !emptyState) return;

  if (profiles.length === 0) {
    emptyState.classList.remove('hidden');
    profileList.innerHTML = '';
    return;
  }

  // Get decodeResponses setting from config
  const store = useAppStore.getState();
  const decodeEnabled = store.config?.settings?.decodeResponses || false;

  emptyState.classList.add('hidden');
  profileList.innerHTML = profiles
    .map((profile) => {
      const mappings: string[] = [];

      if (profile.real.name && profile.alias.name) {
        mappings.push(`
          <div class="mapping-row">
            <span class="mapping-real">${escapeHtml(profile.real.name)}</span>
            <span class="mapping-arrow">→</span>
            <span class="mapping-alias">${escapeHtml(profile.alias.name)}</span>
          </div>
        `);
      }

      if (profile.real.email && profile.alias.email) {
        mappings.push(`
          <div class="mapping-row">
            <span class="mapping-real">${escapeHtml(profile.real.email)}</span>
            <span class="mapping-arrow">→</span>
            <span class="mapping-alias">${escapeHtml(profile.alias.email)}</span>
          </div>
        `);
      }

      if (profile.real.phone && profile.alias.phone) {
        mappings.push(`
          <div class="mapping-row">
            <span class="mapping-real">${escapeHtml(profile.real.phone)}</span>
            <span class="mapping-arrow">→</span>
            <span class="mapping-alias">${escapeHtml(profile.alias.phone)}</span>
          </div>
        `);
      }

      if (profile.real.address && profile.alias.address) {
        mappings.push(`
          <div class="mapping-row">
            <span class="mapping-real">${escapeHtml(profile.real.address)}</span>
            <span class="mapping-arrow">→</span>
            <span class="mapping-alias">${escapeHtml(profile.alias.address)}</span>
          </div>
        `);
      }

      // Calculate total enabled variations
      let totalVariations = 0;
      if (profile.variations?.real) {
        Object.keys(profile.variations.real).forEach((field) => {
          const autoVariations = profile.variations?.real[field] || [];
          const disabledVariations = profile.disabledVariations?.real?.[field] || [];
          totalVariations += autoVariations.filter(v => !disabledVariations.includes(v)).length;
        });
      }
      if (profile.customVariations?.real) {
        Object.keys(profile.customVariations.real).forEach((field) => {
          const customVars = profile.customVariations?.real[field] || [];
          totalVariations += customVars.filter(v => v.enabled).length;
        });
      }

      const variationsText = profile.settings?.enableVariations
        ? `🔄 ${totalVariations} variation${totalVariations !== 1 ? 's' : ''} active`
        : '🔄 Variations disabled';

      return `
        <div class="profile-card ${!profile.enabled ? 'disabled' : ''}">
          <div class="profile-header">
            <div class="profile-title">👤 ${escapeHtml(profile.profileName)}</div>
            <div class="profile-actions">
              <span class="profile-status ${profile.enabled ? 'status-enabled' : 'status-disabled'}">
                ${profile.enabled ? 'Alias Enabled' : 'Alias Disabled'}
              </span>
              <button class="btn-sm ${profile.enabled ? 'btn-danger' : 'btn-success'}"
                      data-action="toggle"
                      data-id="${profile.id}">
                ${profile.enabled ? 'Disable' : 'Enable'}
              </button>
              <button class="icon-btn" title="Edit" data-action="edit" data-id="${profile.id}">✏️</button>
              <button class="icon-btn" title="Delete" data-action="delete" data-id="${profile.id}">🗑️</button>
            </div>
          </div>
          <div class="profile-mappings">
            ${mappings.join('')}
          </div>
          <div class="profile-meta">
            <div class="profile-meta-row">
              <span>${variationsText}</span>
            </div>
            <div class="profile-meta-row decode-toggle-row">
              <span class="decode-status ${decodeEnabled ? 'decode-enabled' : 'decode-disabled'}">
                ${decodeEnabled ? '🔄 Decode ON' : '🔒 Decode OFF'}
              </span>
              <button class="btn-xs btn-secondary decode-toggle-btn"
                      data-action="toggle-decode"
                      title="${decodeEnabled ? 'Turn off response decoding (aliases stay in responses)' : 'Turn on response decoding (aliases converted back to real names)'}">
                ${decodeEnabled ? 'Turn OFF' : 'Turn ON'}
              </button>
            </div>
            <div class="decode-help-text">
              ${decodeEnabled
                ? '↩️ AI responses with aliases will be converted back to your real info'
                : '🔐 AI responses will keep aliases (more private)'}
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  // Attach event listeners to profile action buttons
  profileList.querySelectorAll('.icon-btn, .btn-sm').forEach((btn) => {
    btn.addEventListener('click', handleProfileAction);
  });

  // Attach event listeners to decode toggle buttons
  profileList.querySelectorAll('.decode-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', handleDecodeToggle);
  });
}

/**
 * Handle profile action buttons (toggle, edit, delete)
 */
async function handleProfileAction(event: Event) {
  const btn = event.currentTarget as HTMLButtonElement;
  const action = btn.getAttribute('data-action');
  const profileId = btn.getAttribute('data-id');

  if (!profileId) return;

  const store = useAppStore.getState();
  const profile = store.profiles.find((p) => p.id === profileId);

  if (!profile) return;

  switch (action) {
    case 'toggle':
      await store.toggleProfile(profileId);
      break;

    case 'edit':
      openProfileModal('edit', profile);
      break;

    case 'delete':
      // Pass profileId to showDeleteConfirmation (updated API)
      showDeleteConfirmation(profileId);
      break;
  }
}

/**
 * Handle decode toggle button
 * Toggles the global decodeResponses setting
 */
async function handleDecodeToggle(event: Event) {
  event.stopPropagation();

  const store = useAppStore.getState();
  const config = store.config;

  if (!config) {
    console.error('[Profile Renderer] No config found');
    return;
  }

  // Toggle the decodeResponses setting
  const newDecodeState = !config.settings.decodeResponses;

  console.log(`[Profile Renderer] Toggling decode responses: ${config.settings.decodeResponses} → ${newDecodeState}`);

  // Update settings using store method
  await store.updateSettings({
    decodeResponses: newDecodeState,
  });

  // Re-render profiles to update UI
  renderProfiles(store.profiles);

  // Show feedback
  console.log(`✅ Response decoding ${newDecodeState ? 'enabled' : 'disabled'}`);
}
