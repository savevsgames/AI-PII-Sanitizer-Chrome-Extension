/**
 * Prompt Templates UI Component
 * Manages template creation, editing, and usage
 */

import { UserConfig, PromptTemplate } from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { validateTemplate, getUsedPlaceholders, SUPPORTED_PLACEHOLDERS } from '../../lib/templateEngine';
import { escapeHtml } from './utils';

let currentEditingTemplate: PromptTemplate | null = null;

/**
 * Initialize prompt templates UI handlers
 * This should be called AFTER renderPromptTemplates() so the buttons exist in the DOM
 */
export function initPromptTemplatesUI() {
  console.log('[Prompt Templates UI] initPromptTemplatesUI called');

  // Use setTimeout to ensure DOM is fully updated
  setTimeout(() => {
    console.log('[Prompt Templates UI] setTimeout fired, looking for buttons...');

    // Add Template button (in header when templates exist)
    const addBtn = document.getElementById('addPromptTemplateBtn');
    // Add Template button (in empty state)
    const addBtnEmpty = document.getElementById('addPromptTemplateBtnEmpty');

    console.log('[Prompt Templates UI] Buttons found:', {
      addBtn: addBtn ? 'FOUND' : 'NOT FOUND',
      addBtnEmpty: addBtnEmpty ? 'FOUND' : 'NOT FOUND'
    });

    if (addBtn) {
      console.log('[Prompt Templates UI] Attaching click handler to addBtn');
      addBtn.addEventListener('click', (e) => {
        console.log('[Prompt Templates UI] Add button CLICKED!', e);
        try {
          console.log('[Prompt Templates UI] About to call showTemplateModal...');
          showTemplateModal();
          console.log('[Prompt Templates UI] showTemplateModal call completed');
        } catch (error) {
          console.error('[Prompt Templates UI] ERROR calling showTemplateModal:', error);
        }
      });
    }

    if (addBtnEmpty) {
      console.log('[Prompt Templates UI] Attaching click handler to addBtnEmpty');
      addBtnEmpty.addEventListener('click', (e) => {
        console.log('[Prompt Templates UI] Add button (empty) CLICKED!', e);
        try {
          console.log('[Prompt Templates UI] About to call showTemplateModal...');
          showTemplateModal();
          console.log('[Prompt Templates UI] showTemplateModal call completed');
        } catch (error) {
          console.error('[Prompt Templates UI] ERROR calling showTemplateModal:', error);
        }
      });
    }

    console.log('[Prompt Templates UI] Event handlers attachment complete');
  }, 100); // Increased timeout to 100ms
}

/**
 * Render prompt templates list
 */
export function renderPromptTemplates(config: UserConfig) {
  const templates = config.promptTemplates?.templates || [];
  const templatesList = document.getElementById('promptTemplatesList');
  const emptyState = document.getElementById('promptTemplatesEmptyState');

  if (!templatesList || !emptyState) return;

  // Show/hide empty state
  if (templates.length === 0) {
    templatesList.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  templatesList.style.display = 'block';
  emptyState.style.display = 'none';

  // Render templates
  templatesList.innerHTML = templates.map(template => renderTemplateCard(template, config)).join('');

  // Attach event listeners
  attachTemplateEventListeners(templates);

  console.log('[Prompt Templates] Rendered', templates.length, 'templates');
}

/**
 * Render a single template card
 */
function renderTemplateCard(template: PromptTemplate, config: UserConfig): string {
  const placeholders = getUsedPlaceholders(template.content);
  const profileName = template.profileId
    ? config.profiles.find(p => p.id === template.profileId)?.profileName || 'Unknown Profile'
    : 'Any Profile';

  const categoryBadge = template.category
    ? `<span class="template-category">${escapeHtml(template.category)}</span>`
    : '';

  const lastUsedText = template.lastUsed
    ? new Date(template.lastUsed).toLocaleDateString()
    : 'Never';

  return `
    <div class="template-card" data-template-id="${template.id}">
      <div class="template-card-header">
        <div class="template-card-title-row">
          <h4 class="template-card-title">${escapeHtml(template.name)}</h4>
          ${categoryBadge}
        </div>
        <div class="template-card-actions">
          <button class="btn-icon template-use-btn" data-template-id="${template.id}" title="Use template">
            ▶️
          </button>
          <button class="btn-icon template-edit-btn" data-template-id="${template.id}" title="Edit">
            ✏️
          </button>
          <button class="btn-icon template-delete-btn" data-template-id="${template.id}" title="Delete">
            🗑️
          </button>
        </div>
      </div>

      ${template.description ? `
        <p class="template-card-description">${escapeHtml(template.description)}</p>
      ` : ''}

      <div class="template-card-preview">
        ${escapeHtml(template.content.substring(0, 150))}${template.content.length > 150 ? '...' : ''}
      </div>

      <div class="template-card-meta">
        <div class="template-meta-item">
          <span class="template-meta-icon">📋</span>
          <span class="template-meta-text">${placeholders.length} placeholder${placeholders.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="template-meta-item">
          <span class="template-meta-icon">👤</span>
          <span class="template-meta-text">${escapeHtml(profileName)}</span>
        </div>
        <div class="template-meta-item">
          <span class="template-meta-icon">📊</span>
          <span class="template-meta-text">Used ${template.usageCount} time${template.usageCount !== 1 ? 's' : ''}</span>
        </div>
        <div class="template-meta-item">
          <span class="template-meta-icon">🕐</span>
          <span class="template-meta-text">Last: ${lastUsedText}</span>
        </div>
      </div>

      ${placeholders.length > 0 ? `
        <div class="template-card-placeholders">
          ${placeholders.map(ph => `<span class="placeholder-badge">${escapeHtml(ph)}</span>`).join(' ')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Attach event listeners to template cards
 */
function attachTemplateEventListeners(templates: PromptTemplate[]) {
  // Use buttons
  document.querySelectorAll('.template-use-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const templateId = (btn as HTMLElement).dataset.templateId;
      if (templateId) {
        await handleUseTemplate(templateId);
      }
    });
  });

  // Edit buttons
  document.querySelectorAll('.template-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const templateId = (btn as HTMLElement).dataset.templateId;
      const template = templates.find(t => t.id === templateId);
      if (template) {
        showTemplateModal(template);
      }
    });
  });

  // Delete buttons
  document.querySelectorAll('.template-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const templateId = (btn as HTMLElement).dataset.templateId;
      if (templateId && confirm('Delete this template? This cannot be undone.')) {
        await handleDeleteTemplate(templateId);
      }
    });
  });
}

/**
 * Show template creation/editing modal
 */
function showTemplateModal(template?: PromptTemplate) {
  console.log('[Prompt Templates] 🎬 showTemplateModal called', {
    isEditing: !!template,
    templateId: template?.id
  });

  currentEditingTemplate = template || null;

  // Create modal HTML
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'promptTemplateModal';

  console.log('[Prompt Templates] 📝 Modal element created');

  const isEditing = !!template;
  const store = useAppStore.getState();
  const profiles = store.profiles;

  modal.innerHTML = `
    <div class="modal-content template-modal">
      <div class="modal-header">
        <h2>${isEditing ? 'Edit Template' : 'New Prompt Template'}</h2>
        <button class="modal-close" id="closeTemplateModal">×</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="templateName">Template Name <span class="required">*</span></label>
          <input
            type="text"
            id="templateName"
            placeholder="e.g., Professional Email"
            value="${template ? escapeHtml(template.name) : ''}"
          />
        </div>

        <div class="form-group">
          <label for="templateContent">Template Content <span class="required">*</span></label>
          <textarea
            id="templateContent"
            rows="8"
            placeholder="Write your prompt here. Use {{name}}, {{email}}, etc. for placeholders..."
          >${template ? escapeHtml(template.content) : ''}</textarea>
          <div class="form-hint">
            Use double braces for placeholders: {{name}}, {{email}}, {{phone}}, etc.
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="templateCategory">Category</label>
            <select id="templateCategory">
              <option value="">No Category</option>
              <option value="Email" ${template?.category === 'Email' ? 'selected' : ''}>Email</option>
              <option value="Code Review" ${template?.category === 'Code Review' ? 'selected' : ''}>Code Review</option>
              <option value="Research" ${template?.category === 'Research' ? 'selected' : ''}>Research</option>
              <option value="Writing" ${template?.category === 'Writing' ? 'selected' : ''}>Writing</option>
              <option value="Analysis" ${template?.category === 'Analysis' ? 'selected' : ''}>Analysis</option>
              <option value="Other" ${template?.category === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="templateProfile">Default Profile</label>
            <select id="templateProfile">
              <option value="">Choose at use time</option>
              ${profiles.map(p => `
                <option value="${p.id}" ${template?.profileId === p.id ? 'selected' : ''}>
                  ${escapeHtml(p.profileName)}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="templateDescription">Description (Optional)</label>
          <textarea
            id="templateDescription"
            rows="2"
            placeholder="Describe what this template is for..."
          >${template ? escapeHtml(template.description || '') : ''}</textarea>
        </div>

        <div class="template-validation" id="templateValidation"></div>

        <div class="template-placeholders-help">
          <h4>Available Placeholders:</h4>
          <div class="placeholders-grid">
            ${SUPPORTED_PLACEHOLDERS.slice(0, 7).map(ph => `
              <span class="placeholder-help-item">{{${ph}}}</span>
            `).join('')}
          </div>
          <div class="placeholders-grid">
            ${SUPPORTED_PLACEHOLDERS.slice(7).map(ph => `
              <span class="placeholder-help-item">{{${ph}}}</span>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancelTemplateModal">Cancel</button>
        <button class="btn btn-primary" id="saveTemplateModal">
          ${isEditing ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  console.log('[Prompt Templates] ✅ Modal added to DOM');

  // Add event listeners
  document.getElementById('closeTemplateModal')?.addEventListener('click', () => {
    console.log('[Prompt Templates] ❌ Close button clicked');
    closeTemplateModal();
  });

  document.getElementById('cancelTemplateModal')?.addEventListener('click', () => {
    closeTemplateModal();
  });

  document.getElementById('saveTemplateModal')?.addEventListener('click', async () => {
    await handleSaveTemplate();
  });

  // Real-time validation
  const contentInput = document.getElementById('templateContent') as HTMLTextAreaElement;
  if (contentInput) {
    contentInput.addEventListener('input', () => {
      validateTemplateContent();
    });
  }

  // Initial validation if editing
  if (template) {
    validateTemplateContent();
  }

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeTemplateModal();
    }
  });
}

/**
 * Close template modal
 */
function closeTemplateModal() {
  const modal = document.getElementById('promptTemplateModal');
  if (modal) {
    modal.remove();
  }
  currentEditingTemplate = null;
}

/**
 * Validate template content in real-time
 */
function validateTemplateContent() {
  const contentInput = document.getElementById('templateContent') as HTMLTextAreaElement;
  const validationDiv = document.getElementById('templateValidation');

  if (!contentInput || !validationDiv) return;

  const content = contentInput.value.trim();

  if (content.length === 0) {
    validationDiv.innerHTML = '';
    return;
  }

  const validation = validateTemplate(content);

  if (!validation.valid) {
    validationDiv.innerHTML = `
      <div class="validation-error">
        <strong>❌ Validation Errors:</strong>
        <ul>
          ${validation.errors.map(err => `<li>${escapeHtml(err)}</li>`).join('')}
        </ul>
      </div>
    `;
    return;
  }

  if (validation.warnings.length > 0) {
    validationDiv.innerHTML = `
      <div class="validation-warning">
        <strong>⚠️ Warnings:</strong>
        <ul>
          ${validation.warnings.map(warn => `<li>${escapeHtml(warn)}</li>`).join('')}
        </ul>
      </div>
    `;
    return;
  }

  const placeholders = getUsedPlaceholders(content);
  validationDiv.innerHTML = `
    <div class="validation-success">
      <strong>✅ Template looks good!</strong>
      ${placeholders.length > 0 ? `
        <div style="margin-top: 8px;">
          Found ${placeholders.length} placeholder${placeholders.length !== 1 ? 's' : ''}:
          ${placeholders.map(ph => `<span class="placeholder-badge">${escapeHtml(ph)}</span>`).join(' ')}
        </div>
      ` : '<div style="margin-top: 8px;">No placeholders found. Template will be used as-is.</div>'}
    </div>
  `;
}

/**
 * Handle saving template (create or update)
 */
async function handleSaveTemplate() {
  const nameInput = document.getElementById('templateName') as HTMLInputElement;
  const contentInput = document.getElementById('templateContent') as HTMLTextAreaElement;
  const categorySelect = document.getElementById('templateCategory') as HTMLSelectElement;
  const profileSelect = document.getElementById('templateProfile') as HTMLSelectElement;
  const descriptionInput = document.getElementById('templateDescription') as HTMLTextAreaElement;

  if (!nameInput || !contentInput) return;

  const name = nameInput.value.trim();
  const content = contentInput.value.trim();
  const category = categorySelect.value || undefined;
  const profileId = profileSelect.value || undefined;
  const description = descriptionInput.value.trim() || undefined;

  // Validation
  if (!name) {
    alert('Please enter a template name');
    return;
  }

  if (!content) {
    alert('Please enter template content');
    return;
  }

  const validation = validateTemplate(content);
  if (!validation.valid) {
    alert(`Template validation failed:\n${validation.errors.join('\n')}`);
    return;
  }

  const store = useAppStore.getState();

  try {
    if (currentEditingTemplate) {
      // Update existing template
      await store.updatePromptTemplate(currentEditingTemplate.id, {
        name,
        content,
        category,
        profileId,
        description,
      });
    } else {
      // Create new template
      await store.addPromptTemplate({
        name,
        content,
        category,
        profileId,
        description,
      });
    }

    // Refresh UI
    const config = store.config;
    if (config) {
      renderPromptTemplates(config);
    }

    closeTemplateModal();
  } catch (error: any) {
    if (error.message.includes('Template limit reached')) {
      // Show upgrade prompt
      alert(error.message);
    } else {
      alert('Failed to save template: ' + error.message);
    }
  }
}

/**
 * Handle using a template
 * Shows preview modal with profile selection
 */
async function handleUseTemplate(templateId: string) {
  const store = useAppStore.getState();
  const config = store.config;
  if (!config || !config.promptTemplates) return;

  const template = config.promptTemplates.templates.find(t => t.id === templateId);
  if (!template) return;

  // Check if we have profiles
  if (store.profiles.length === 0) {
    alert('Please create an alias profile first before using templates.\n\nGo to the Aliases tab to create a profile.');
    return;
  }

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }

    // Check if we're on a supported AI chat platform
    const url = tab.url || '';
    const isSupportedPlatform = config.settings.protectedDomains.some(domain => url.includes(domain));

    if (!isSupportedPlatform) {
      alert('Please navigate to a supported AI chat platform (ChatGPT, Claude, Gemini, Perplexity, or Copilot) to use this template.');
      return;
    }

    // Show preview modal (handles everything now)
    await showTemplatePreviewModal(template, tab);

    // Refresh UI to show updated usage count
    const updatedConfig = store.config;
    if (updatedConfig) {
      renderPromptTemplates(updatedConfig);
    }

    // Close the popup (optional - user can manually close)
    // window.close();
  } catch (error) {
    console.error('Failed to use template:', error);
    alert('Failed to insert template. Make sure you are on a supported AI chat platform.');
  }
}

/**
 * Handle deleting a template
 */
async function handleDeleteTemplate(templateId: string) {
  const store = useAppStore.getState();
  await store.deletePromptTemplate(templateId);

  // Refresh UI
  const config = store.config;
  if (config) {
    renderPromptTemplates(config);
  }

  console.log('[Prompt Templates] Deleted template:', templateId);
}

/**
 * Show template preview modal with profile selection
 */
async function showTemplatePreviewModal(template: PromptTemplate, tab: chrome.tabs.Tab): Promise<void> {
  return new Promise((resolve, reject) => {
    const store = useAppStore.getState();
    const profiles = store.profiles;

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal';

    // Create modal content
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.maxWidth = '600px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <div>
        <h3 class="modal-title">Preview Template: ${escapeHtml(template.name)}</h3>
        <p class="form-help" style="margin: 4px 0 0 0;">
          Select a profile and preview how your template will appear with alias data
        </p>
      </div>
      <button class="modal-close">&times;</button>
    `;

    // Profile selector
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'form-group';
    selectorContainer.style.borderBottom = '1px solid var(--border-neutral)';
    selectorContainer.style.paddingBottom = 'var(--space-md)';
    selectorContainer.style.marginBottom = '0';

    const selectorLabel = document.createElement('label');
    selectorLabel.className = 'form-label';
    selectorLabel.textContent = 'Select Alias Profile:';

    const selector = document.createElement('select');
    selector.id = 'template-profile-selector';
    selector.className = 'form-input';
    selector.style.cursor = 'pointer';

    profiles.forEach(profile => {
      const option = document.createElement('option');
      option.value = profile.id;
      option.textContent = profile.profileName;
      selector.appendChild(option);
    });

    selectorContainer.appendChild(selectorLabel);
    selectorContainer.appendChild(selector);

    // Preview area
    const previewContainer = document.createElement('div');
    previewContainer.className = 'modal-body';
    previewContainer.style.flex = '1';
    previewContainer.style.overflowY = 'auto';

    const previewGroup = document.createElement('div');
    previewGroup.className = 'form-group';

    const previewLabel = document.createElement('label');
    previewLabel.className = 'form-label';
    previewLabel.textContent = 'Preview with Alias Data:';

    const previewBox = document.createElement('pre');
    previewBox.id = 'template-preview-box';
    previewBox.className = 'form-textarea';
    previewBox.style.cssText = `
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 300px;
      overflow-y: auto;
      min-height: 200px;
    `;

    previewGroup.appendChild(previewLabel);
    previewGroup.appendChild(previewBox);
    previewContainer.appendChild(previewGroup);

    // Footer with buttons
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';

    const injectBtn = document.createElement('button');
    injectBtn.className = 'btn btn-primary';
    injectBtn.textContent = 'Use This Template';

    footer.appendChild(cancelBtn);
    footer.appendChild(injectBtn);

    // Assemble modal
    content.appendChild(header);
    content.appendChild(selectorContainer);
    content.appendChild(previewContainer);
    content.appendChild(footer);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Function to update preview
    const updatePreview = () => {
      const selectedProfileId = selector.value;
      const profile = profiles.find(p => p.id === selectedProfileId);

      if (!profile || !profile.alias) {
        previewBox.textContent = 'Error: Profile not found or has no alias data';
        return;
      }

      // Fill placeholders with alias data
      let filledContent = template.content
        .replace(/\{\{name\}\}/gi, profile.alias.name || '{{name}}')
        .replace(/\{\{email\}\}/gi, profile.alias.email || '{{email}}')
        .replace(/\{\{phone\}\}/gi, profile.alias.phone || '{{phone}}')
        .replace(/\{\{cellPhone\}\}/gi, profile.alias.cellPhone || '{{cellPhone}}')
        .replace(/\{\{address\}\}/gi, profile.alias.address || '{{address}}')
        .replace(/\{\{company\}\}/gi, profile.alias.company || '{{company}}')
        .replace(/\{\{jobTitle\}\}/gi, profile.alias.jobTitle || '{{jobTitle}}');

      previewBox.textContent = filledContent;
    };

    // Initial preview
    updatePreview();

    // Update preview when profile changes
    selector.addEventListener('change', updatePreview);

    // Handle close button in header
    const closeBtn = header.querySelector('.modal-close');
    closeBtn?.addEventListener('click', () => {
      modal.remove();
      resolve();
    });

    // Handle cancel
    cancelBtn.addEventListener('click', () => {
      modal.remove();
      resolve();
    });

    // Handle inject
    injectBtn.addEventListener('click', async () => {
      try {
        const selectedProfileId = selector.value;
        const profile = profiles.find(p => p.id === selectedProfileId);

        if (!profile || !profile.alias) {
          alert('Error: Selected profile not found');
          return;
        }

        // Fill template with selected profile
        let filledTemplate = template.content
          .replace(/\{\{name\}\}/gi, profile.alias.name || '{{name}}')
          .replace(/\{\{email\}\}/gi, profile.alias.email || '{{email}}')
          .replace(/\{\{phone\}\}/gi, profile.alias.phone || '{{phone}}')
          .replace(/\{\{cellPhone\}\}/gi, profile.alias.cellPhone || '{{cellPhone}}')
          .replace(/\{\{address\}\}/gi, profile.alias.address || '{{address}}')
          .replace(/\{\{company\}\}/gi, profile.alias.company || '{{company}}')
          .replace(/\{\{jobTitle\}\}/gi, profile.alias.jobTitle || '{{jobTitle}}');

        console.log('[Prompt Templates] 📤 Injecting template with profile:', profile.profileName);
        console.log('[Prompt Templates] 📤 Filled content length:', filledTemplate.length);
        console.log('[Prompt Templates] 📤 Has \\n?', filledTemplate.includes('\n'));

        // Send to content script
        if (!tab.id) {
          throw new Error('Tab ID not found');
        }

        await chrome.tabs.sendMessage(tab.id, {
          type: 'INJECT_TEMPLATE',
          payload: {
            content: filledTemplate,
          },
        });

        // Increment usage
        await store.incrementTemplateUsage(template.id);

        // Close modal
        modal.remove();
        showToast('✅ Template injected!');
        resolve();
      } catch (error) {
        console.error('[Prompt Templates] Error injecting template:', error);
        alert('Failed to inject template. Please try again.');
        reject(error);
      }
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        resolve();
      }
    });
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show toast notification
 */
function showToast(message: string) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
