/**
 * Prompt Templates UI Component
 * Manages template creation, editing, and usage
 */

import { UserConfig, PromptTemplate } from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { validateTemplate, previewTemplate, getUsedPlaceholders, SUPPORTED_PLACEHOLDERS } from '../../lib/templateEngine';
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
        showTemplateModal();
      });
    }

    if (addBtnEmpty) {
      console.log('[Prompt Templates UI] Attaching click handler to addBtnEmpty');
      addBtnEmpty.addEventListener('click', (e) => {
        console.log('[Prompt Templates UI] Add button (empty) CLICKED!', e);
        showTemplateModal();
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
  currentEditingTemplate = template || null;

  // Create modal HTML
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'promptTemplateModal';

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

  // Add event listeners
  document.getElementById('closeTemplateModal')?.addEventListener('click', () => {
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
 * This will be called when user clicks "Use" button
 * For now, we'll copy to clipboard
 */
async function handleUseTemplate(templateId: string) {
  const store = useAppStore.getState();
  const config = store.config;
  if (!config || !config.promptTemplates) return;

  const template = config.promptTemplates.templates.find(t => t.id === templateId);
  if (!template) return;

  // For now, just copy to clipboard
  // In Phase 4, this will inject into the active chat
  try {
    await navigator.clipboard.writeText(template.content);

    // Increment usage
    await store.incrementTemplateUsage(templateId);

    // Show feedback
    showToast(`Template "${template.name}" copied to clipboard!`);

    // Refresh UI to show updated usage count
    const updatedConfig = store.config;
    if (updatedConfig) {
      renderPromptTemplates(updatedConfig);
    }
  } catch (error) {
    console.error('Failed to copy template:', error);
    alert('Failed to copy template to clipboard');
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
