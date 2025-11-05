/**
 * Quick Alias Generator UI Component
 *
 * Provides instant alias profile generation using pre-built name pools.
 * Integrates with profile modal for auto-fill functionality.
 */

import {
  generateProfile,
  generateBulkProfiles,
  canAccessTemplate,
  BUILTIN_TEMPLATES,
  type GeneratedProfile,
  type TierLevel,
} from '../../lib/aliasGenerator';
import { openProfileModal } from './profileModal';
import { useAppStore } from '../../lib/store';

let currentGeneratedProfile: GeneratedProfile | null = null;
let currentTemplateId: string | null = null;
let bulkProfiles: GeneratedProfile[] = [];

/**
 * Initialize Quick Alias Generator UI
 */
export function initQuickAliasGeneratorUI() {
  setupGeneratorControls();
  console.log('[Quick Alias Generator] UI Initialized');
}

/**
 * Render Quick Alias Generator feature
 */
export function renderQuickAliasGenerator() {
  const container = document.getElementById('featureDetailContent');
  if (!container) return;

  const state = useAppStore.getState();
  const userTier: TierLevel = (state.config?.account?.tier as TierLevel) || 'free';

  container.innerHTML = `
    <div class="quick-alias-generator">
      <!-- Header Section -->
      <div class="generator-header">
        <p class="feature-description">
          Generate instant alias profiles for privacy protection. Choose from multiple templates
          and themes to create unique identities in seconds.
        </p>
        <div class="generator-stats">
          <div class="stat-pill">
            <span class="stat-icon">⚡</span>
            <span class="stat-text">Instant Generation</span>
          </div>
          <div class="stat-pill">
            <span class="stat-icon">🎭</span>
            <span class="stat-text">1.25M+ Combinations</span>
          </div>
        </div>
      </div>

      <!-- Template Selector Section -->
      <div class="generator-section">
        <h3 class="section-title">
          <span class="section-icon">🎨</span>
          Choose Template
        </h3>
        <div class="template-selector">
          ${renderTemplateOptions(userTier)}
        </div>
      </div>

      <!-- Live Preview Section -->
      <div class="generator-section">
        <h3 class="section-title">
          <span class="section-icon">👁️</span>
          Live Preview
        </h3>
        <div class="preview-container" id="generatorPreview">
          <div class="preview-empty">
            <span class="preview-empty-icon">🎲</span>
            <p>Select a template above to generate an alias profile</p>
          </div>
        </div>
      </div>

      <!-- Bulk Generation Section (PRO) -->
      ${userTier === 'pro' ? `
        <div class="generator-section generator-section-pro">
          <h3 class="section-title">
            <span class="section-icon">📦</span>
            Bulk Generation
            <span class="tier-badge pro">PRO</span>
          </h3>
          <p class="section-description">Generate multiple profiles at once (up to 10)</p>
          <div class="bulk-controls">
            <div class="input-group">
              <label for="bulkCount">Number of profiles:</label>
              <input type="number" id="bulkCount" min="2" max="10" value="5" class="input-number">
            </div>
            <button class="btn btn-primary" id="generateBulkBtn" disabled>
              <span class="btn-icon">📦</span>
              <span>Generate Bulk</span>
            </button>
          </div>
          <div class="bulk-results hidden" id="bulkResults">
            <!-- Bulk profiles will be rendered here -->
          </div>
        </div>
      ` : `
        <div class="generator-section generator-section-locked">
          <h3 class="section-title">
            <span class="section-icon">📦</span>
            Bulk Generation
            <span class="tier-badge pro">PRO</span>
          </h3>
          <p class="section-description">
            Generate multiple profiles at once (up to 10)
          </p>
          <div class="locked-feature">
            <span class="locked-icon">🔒</span>
            <p>Upgrade to PRO to unlock bulk generation</p>
            <button class="btn btn-primary btn-sm" id="upgradeBtn">Upgrade to PRO</button>
          </div>
        </div>
      `}
    </div>
  `;

  setupGeneratorControls();
  console.log('[Quick Alias Generator] Rendered');
}

/**
 * Render template selector options
 */
function renderTemplateOptions(userTier: TierLevel): string {
  const freeTemplates = BUILTIN_TEMPLATES.filter(t => t.tier === 'free');
  const proTemplates = BUILTIN_TEMPLATES.filter(t => t.tier === 'pro');

  return `
    <div class="template-options">
      <!-- FREE Templates -->
      <div class="template-group">
        <div class="template-group-header">
          <span class="template-group-title">FREE Templates</span>
          <span class="template-group-count">${freeTemplates.length}</span>
        </div>
        <div class="template-list">
          ${freeTemplates.map(template => `
            <label class="template-option">
              <input
                type="radio"
                name="template"
                value="${template.id}"
                class="template-radio"
              >
              <div class="template-card">
                <div class="template-header">
                  <span class="template-name">${template.name}</span>
                </div>
                <p class="template-description">${template.description}</p>
              </div>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- PRO Templates -->
      <div class="template-group">
        <div class="template-group-header">
          <span class="template-group-title">PRO Templates</span>
          <span class="tier-badge pro">PRO</span>
          <span class="template-group-count">${proTemplates.length}</span>
        </div>
        <div class="template-list">
          ${proTemplates.map(template => {
            const isLocked = userTier !== 'pro';
            return `
              <label class="template-option ${isLocked ? 'template-option-locked' : ''}">
                <input
                  type="radio"
                  name="template"
                  value="${template.id}"
                  class="template-radio"
                  ${isLocked ? 'disabled' : ''}
                >
                <div class="template-card ${isLocked ? 'template-card-locked' : ''}">
                  <div class="template-header">
                    <span class="template-name">${template.name} ${isLocked ? '(PRO)' : ''}</span>
                    ${isLocked ? '<span class="lock-icon">🔒</span>' : ''}
                  </div>
                  <p class="template-description">${template.description}</p>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Setup event listeners for generator controls
 */
function setupGeneratorControls() {
  // Template selection - auto-generate on selection
  const templateRadios = document.querySelectorAll('.template-radio:not([disabled])');
  templateRadios.forEach(radio => {
    radio.addEventListener('change', handleTemplateChange);
  });

  // Bulk generation (PRO only)
  const generateBulkBtn = document.getElementById('generateBulkBtn');
  generateBulkBtn?.addEventListener('click', handleBulkGenerate);

  // Upgrade button
  const upgradeBtn = document.getElementById('upgradeBtn');
  upgradeBtn?.addEventListener('click', () => {
    console.log('[Quick Alias Generator] Upgrade button clicked');
    alert('Upgrade functionality coming soon!');
  });
}

/**
 * Handle template selection change - auto-generate
 */
function handleTemplateChange(event: Event) {
  const radio = event.target as HTMLInputElement;
  const templateId = radio.value;
  currentTemplateId = templateId;

  const state = useAppStore.getState();
  const userTier: TierLevel = (state.config?.account?.tier as TierLevel) || 'free';

  // Check tier access
  if (!canAccessTemplate(templateId, userTier)) {
    alert('This template requires PRO tier. Please upgrade to access.');
    radio.checked = false;
    return;
  }

  // Auto-generate profile
  handleGenerate(templateId);

  // Enable bulk button if PRO
  const generateBulkBtn = document.getElementById('generateBulkBtn') as HTMLButtonElement;
  if (generateBulkBtn) {
    generateBulkBtn.disabled = false;
  }

  console.log('[Quick Alias Generator] Template selected:', templateId);
}

/**
 * Handle generate profile
 */
function handleGenerate(templateId: string) {
  try {
    // Generate profile
    currentGeneratedProfile = generateProfile(templateId);
    renderPreview(currentGeneratedProfile, templateId);

    console.log('[Quick Alias Generator] Profile generated:', currentGeneratedProfile);
  } catch (error) {
    console.error('[Quick Alias Generator] Generation error:', error);
    alert('Failed to generate profile. Please try again.');
  }
}

/**
 * Handle bulk generation (PRO)
 */
function handleBulkGenerate() {
  if (!currentTemplateId) {
    alert('Please select a template first');
    return;
  }

  const bulkCountInput = document.getElementById('bulkCount') as HTMLInputElement;
  const count = parseInt(bulkCountInput.value, 10);

  if (count < 2 || count > 10) {
    alert('Bulk count must be between 2 and 10');
    return;
  }

  try {
    // Generate bulk profiles
    bulkProfiles = generateBulkProfiles({
      templateId: currentTemplateId,
      count,
      ensureUnique: true,
    });

    renderBulkResults(bulkProfiles);
    console.log('[Quick Alias Generator] Bulk profiles generated:', bulkProfiles.length);
  } catch (error) {
    console.error('[Quick Alias Generator] Bulk generation error:', error);
    alert('Failed to generate bulk profiles. Please try again.');
  }
}

/**
 * Render profile preview with actions
 */
function renderPreview(profile: GeneratedProfile, templateId: string) {
  const previewContainer = document.getElementById('generatorPreview');
  if (!previewContainer) return;

  const template = BUILTIN_TEMPLATES.find(t => t.id === templateId);
  const templateName = template?.name || 'Unknown';

  previewContainer.innerHTML = `
    <div class="preview-header">
      <div class="preview-template-info">
        <span class="preview-label">Template:</span>
        <span class="preview-template-name">${escapeHtml(templateName)}</span>
      </div>
      <div class="preview-actions">
        <button class="btn btn-sm btn-secondary" id="regenerateBtn">
          <span>🔄</span>
          <span>Regenerate</span>
        </button>
        <button class="btn btn-sm btn-success" id="useProfileBtn">
          <span>✅</span>
          <span>Use This Alias</span>
        </button>
      </div>
    </div>
    <div class="preview-content">
      <div class="preview-field">
        <span class="preview-label">Name</span>
        <span class="preview-value">${escapeHtml(profile.name)}</span>
      </div>
      <div class="preview-field">
        <span class="preview-label">Email</span>
        <span class="preview-value">${escapeHtml(profile.email)}</span>
      </div>
      ${profile.phone ? `
        <div class="preview-field">
          <span class="preview-label">Phone</span>
          <span class="preview-value">${escapeHtml(profile.phone)}</span>
        </div>
      ` : ''}
      ${profile.cellPhone ? `
        <div class="preview-field">
          <span class="preview-label">Cell Phone</span>
          <span class="preview-value">${escapeHtml(profile.cellPhone)}</span>
        </div>
      ` : ''}
      ${profile.address ? `
        <div class="preview-field">
          <span class="preview-label">Address</span>
          <span class="preview-value">${escapeHtml(profile.address)}</span>
        </div>
      ` : ''}
      ${profile.company ? `
        <div class="preview-field">
          <span class="preview-label">Company</span>
          <span class="preview-value">${escapeHtml(profile.company)}</span>
        </div>
      ` : ''}
    </div>
  `;

  // Setup action buttons
  const regenerateBtn = document.getElementById('regenerateBtn');
  const useProfileBtn = document.getElementById('useProfileBtn');

  regenerateBtn?.addEventListener('click', () => {
    if (currentTemplateId) {
      handleGenerate(currentTemplateId);
    }
  });

  useProfileBtn?.addEventListener('click', handleUseProfile);
}

/**
 * Render bulk generation results
 */
function renderBulkResults(profiles: GeneratedProfile[]) {
  const bulkResults = document.getElementById('bulkResults');
  if (!bulkResults) return;

  bulkResults.classList.remove('hidden');
  bulkResults.innerHTML = `
    <div class="bulk-results-header">
      <h4>Generated ${profiles.length} Profiles</h4>
      <button class="btn btn-sm btn-secondary" id="exportBulkBtn">
        <span>📥</span>
        <span>Export All</span>
      </button>
    </div>
    <div class="bulk-results-list">
      ${profiles.map((profile, index) => `
        <div class="bulk-result-card">
          <div class="bulk-result-header">
            <span class="bulk-result-number">#${index + 1}</span>
            <button class="btn btn-sm btn-primary bulk-use-btn" data-index="${index}">
              <span>✅</span>
              <span>Use</span>
            </button>
          </div>
          <div class="bulk-result-content">
            <div class="bulk-result-field">
              <strong>Name:</strong> ${escapeHtml(profile.name)}
            </div>
            <div class="bulk-result-field">
              <strong>Email:</strong> ${escapeHtml(profile.email)}
            </div>
            ${profile.company ? `
              <div class="bulk-result-field">
                <strong>Company:</strong> ${escapeHtml(profile.company)}
              </div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Setup bulk result buttons
  const useButtons = bulkResults.querySelectorAll('.bulk-use-btn');
  useButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt((e.currentTarget as HTMLElement).dataset.index || '0', 10);
      handleUseBulkProfile(index);
    });
  });

  // Setup export button
  const exportBtn = document.getElementById('exportBulkBtn');
  exportBtn?.addEventListener('click', handleExportBulk);
}

/**
 * Handle use generated profile
 */
function handleUseProfile() {
  if (!currentGeneratedProfile) {
    alert('No profile generated yet');
    return;
  }

  // Open profile modal with generated data
  openProfileModalWithData(currentGeneratedProfile);
}

/**
 * Handle use bulk profile
 */
function handleUseBulkProfile(index: number) {
  const profile = bulkProfiles[index];
  if (!profile) {
    alert('Profile not found');
    return;
  }

  openProfileModalWithData(profile);
}

/**
 * Open profile modal with generated data
 */
function openProfileModalWithData(profile: GeneratedProfile) {
  // Open profile modal in create mode
  openProfileModal('create');

  // Wait for modal to be open, then fill in fields
  setTimeout(() => {
    // Get alias field inputs
    const aliasNameInput = document.getElementById('aliasName') as HTMLInputElement;
    const aliasEmailInput = document.getElementById('aliasEmail') as HTMLInputElement;
    const aliasPhoneInput = document.getElementById('aliasPhone') as HTMLInputElement;
    const aliasCellPhoneInput = document.getElementById('aliasCellPhone') as HTMLInputElement;
    const aliasAddressInput = document.getElementById('aliasAddress') as HTMLInputElement;
    const aliasCompanyInput = document.getElementById('aliasCompany') as HTMLInputElement;

    // Get profile metadata inputs
    const profileNameInput = document.getElementById('profileName') as HTMLInputElement;
    const profileDescriptionInput = document.getElementById('profileDescription') as HTMLInputElement;

    // Fill in alias fields
    if (aliasNameInput) aliasNameInput.value = profile.name;
    if (aliasEmailInput) aliasEmailInput.value = profile.email;
    if (aliasPhoneInput && profile.phone) aliasPhoneInput.value = profile.phone;
    if (aliasCellPhoneInput && profile.cellPhone) aliasCellPhoneInput.value = profile.cellPhone;
    if (aliasAddressInput && profile.address) aliasAddressInput.value = profile.address;
    if (aliasCompanyInput && profile.company) aliasCompanyInput.value = profile.company;

    // Auto-fill profile metadata
    if (profileNameInput) {
      profileNameInput.value = profile.name; // Use alias name as profile name
    }
    if (profileDescriptionInput) {
      const template = BUILTIN_TEMPLATES.find(t => t.id === profile.template);
      profileDescriptionInput.value = template
        ? `Generated from ${template.name} template`
        : 'Auto-generated alias';
    }

    console.log('[Quick Alias Generator] Profile data filled into modal');
  }, 100);
}

/**
 * Handle export bulk profiles
 */
function handleExportBulk() {
  if (bulkProfiles.length === 0) {
    alert('No profiles to export');
    return;
  }

  // Convert to JSON
  const data = JSON.stringify(bulkProfiles, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Download
  const a = document.createElement('a');
  a.href = url;
  a.download = `alias-profiles-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
  console.log('[Quick Alias Generator] Bulk profiles exported');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
