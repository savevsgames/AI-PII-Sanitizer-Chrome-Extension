/**
 * Custom Rules UI Component
 * Handles rendering and managing custom redaction rules
 */

import { CustomRule, UserConfig } from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { chromeApi } from '../api/chromeApi';
import { RULE_TEMPLATES } from '../../lib/ruleTemplates';
import { RedactionEngine } from '../../lib/redactionEngine';

/**
 * Render custom rules list
 */
export function renderCustomRules(config: UserConfig) {
  const rulesList = document.getElementById('customRulesList');
  const emptyState = document.getElementById('customRulesEmptyState');

  if (!rulesList || !emptyState) return;

  const rules = config.customRules?.rules || [];
  const enabled = config.customRules?.enabled ?? true;
  const userTier = config.account?.tier || 'free';

  // Show tier warning for free users
  if (userTier === 'free') {
    rulesList.style.display = 'none';
    emptyState.style.display = 'none';
    const upgradeWarning = document.getElementById('customRulesUpgradeWarning');
    if (upgradeWarning) {
      upgradeWarning.style.display = 'block';
    }
    return;
  }

  if (rules.length === 0) {
    rulesList.style.display = 'none';
    emptyState.style.display = 'flex';
  } else {
    rulesList.style.display = 'block';
    emptyState.style.display = 'none';

    // Group rules by category
    const rulesByCategory = groupRulesByCategory(rules);

    // Render grouped rules
    rulesList.innerHTML = renderRuleStats(rules, enabled) +
                          renderCategoryGroups(rulesByCategory);

    // Add event listeners
    attachRuleEventListeners(rules);
  }

  // Update enabled toggle
  updateEnabledToggle(enabled);

  console.log(`[Custom Rules UI] Rendered ${rules.length} rules`);
}

/**
 * Group rules by category
 */
function groupRulesByCategory(rules: CustomRule[]): Record<string, CustomRule[]> {
  const groups: Record<string, CustomRule[]> = {
    pii: [],
    financial: [],
    medical: [],
    custom: []
  };

  rules.forEach(rule => {
    groups[rule.category].push(rule);
  });

  return groups;
}

/**
 * Render rule statistics
 */
function renderRuleStats(rules: CustomRule[], enabled: boolean): string {
  const activeRules = rules.filter(r => r.enabled).length;
  const totalMatches = rules.reduce((sum, r) => sum + r.matchCount, 0);

  return `
    <div class="custom-rules-stats">
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <div class="stat-value">${activeRules} / ${rules.length}</div>
          <div class="stat-label">Active Rules</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">${totalMatches.toLocaleString()}</div>
          <div class="stat-label">Total Matches</div>
        </div>
      </div>
      <div class="stat-card ${enabled ? 'enabled' : 'disabled'}">
        <div class="stat-icon">${enabled ? '🟢' : '⭕'}</div>
        <div class="stat-content">
          <div class="stat-value">${enabled ? 'Enabled' : 'Disabled'}</div>
          <div class="stat-label">Global Status</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render category groups
 */
function renderCategoryGroups(rulesByCategory: Record<string, CustomRule[]>): string {
  const categoryNames = {
    pii: 'Personal Information',
    financial: 'Financial Data',
    medical: 'Medical Records',
    custom: 'Custom Patterns'
  };

  const categoryIcons = {
    pii: '👤',
    financial: '💳',
    medical: '🏥',
    custom: '⚙️'
  };

  return Object.entries(rulesByCategory)
    .filter(([_, rules]) => rules.length > 0)
    .map(([category, rules]) => `
      <div class="rule-category-group">
        <div class="category-header">
          <span class="category-icon">${categoryIcons[category as keyof typeof categoryIcons]}</span>
          <h4 class="category-name">${categoryNames[category as keyof typeof categoryNames]}</h4>
          <span class="category-count">${rules.length} ${rules.length === 1 ? 'rule' : 'rules'}</span>
        </div>
        <div class="category-rules">
          ${rules.map(rule => renderRuleCard(rule)).join('')}
        </div>
      </div>
    `).join('');
}

/**
 * Render a single rule card
 */
function renderRuleCard(rule: CustomRule): string {
  const lastUsedText = rule.lastUsed ? formatDate(rule.lastUsed) : 'Never';

  return `
    <div class="custom-rule-card ${rule.enabled ? '' : 'disabled'}" data-rule-id="${rule.id}">
      <div class="rule-header">
        <div class="rule-title-row">
          <span class="rule-priority-badge" style="background: ${getPriorityColor(rule.priority)}">${rule.priority}</span>
          <h5 class="rule-name">${escapeHtml(rule.name)}</h5>
        </div>
        <div class="rule-actions">
          <label class="rule-toggle-label">
            <input type="checkbox" class="rule-toggle" ${rule.enabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
          <button class="rule-edit icon-button" title="Edit rule">✏️</button>
          <button class="rule-test icon-button" title="Test rule">🧪</button>
          <button class="rule-delete icon-button" title="Delete rule">🗑️</button>
        </div>
      </div>
      ${rule.description ? `<p class="rule-description">${escapeHtml(rule.description)}</p>` : ''}
      <div class="rule-pattern">
        <code class="pattern-code">${escapeHtml(rule.pattern)}</code>
        <span class="pattern-arrow">→</span>
        <code class="replacement-code">${escapeHtml(rule.replacement)}</code>
      </div>
      <div class="rule-stats">
        <div class="rule-stat">
          <span class="rule-stat-icon">✅</span>
          <span class="rule-stat-value">${rule.matchCount}</span>
          <span class="rule-stat-label">matches</span>
        </div>
        <div class="rule-stat">
          <span class="rule-stat-icon">🕐</span>
          <span class="rule-stat-value">${lastUsedText}</span>
          <span class="rule-stat-label">last used</span>
        </div>
        <div class="rule-stat">
          <span class="rule-stat-icon">📅</span>
          <span class="rule-stat-value">${formatDate(rule.createdAt)}</span>
          <span class="rule-stat-label">created</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Get color for priority badge
 */
function getPriorityColor(priority: number): string {
  if (priority >= 80) return '#ef4444'; // Red - high priority
  if (priority >= 60) return '#f59e0b'; // Orange - medium-high
  if (priority >= 40) return '#3b82f6'; // Blue - medium
  return '#6b7280'; // Gray - low priority
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60 * 1000) return 'Just now';
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}m ago`;
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}h ago`;
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
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
 * Attach event listeners to rule cards
 */
function attachRuleEventListeners(rules: CustomRule[]) {
  rules.forEach(rule => {
    const card = document.querySelector(`[data-rule-id="${rule.id}"]`);
    if (!card) return;

    // Toggle enable/disable
    const toggleBtn = card.querySelector('.rule-toggle');
    toggleBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await toggleRule(rule.id);
    });

    // Edit rule
    const editBtn = card.querySelector('.rule-edit');
    editBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      showEditRuleModal(rule);
    });

    // Test rule
    const testBtn = card.querySelector('.rule-test');
    testBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      showTestRuleModal(rule);
    });

    // Delete rule
    const deleteBtn = card.querySelector('.rule-delete');
    deleteBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteRule(rule.id, rule.name);
    });
  });
}

/**
 * Toggle rule enabled state
 */
async function toggleRule(ruleId: string) {
  try {
    await chromeApi.toggleCustomRule(ruleId);
    const store = useAppStore.getState();
    await store.loadConfig();
    console.log(`[Custom Rules UI] Toggled rule ${ruleId}`);
  } catch (error) {
    console.error('[Custom Rules UI] Error toggling rule:', error);
    alert('Failed to toggle rule. Please try again.');
  }
}

/**
 * Delete a rule
 */
async function deleteRule(ruleId: string, ruleName: string) {
  const confirmed = confirm(`Are you sure you want to delete "${ruleName}"?\n\nThis action cannot be undone.`);
  if (!confirmed) return;

  try {
    await chromeApi.removeCustomRule(ruleId);
    const store = useAppStore.getState();
    await store.loadConfig();
    console.log(`[Custom Rules UI] Deleted rule ${ruleId}`);
  } catch (error) {
    console.error('[Custom Rules UI] Error deleting rule:', error);
    alert('Failed to delete rule. Please try again.');
  }
}

/**
 * Show edit rule modal
 */
function showEditRuleModal(rule: CustomRule) {
  // TODO: Implement edit modal (similar to add modal)
  console.log('[Custom Rules UI] Edit rule:', rule);
  alert('Edit functionality coming soon!');
}

/**
 * Show test rule modal
 */
function showTestRuleModal(rule: CustomRule) {
  const testText = prompt('Enter text to test this rule against:');
  if (!testText) return;

  const result = RedactionEngine.testRule(rule, testText);

  if (result.error) {
    alert(`Test failed: ${result.error}`);
    return;
  }

  if (result.matches.length === 0) {
    alert('No matches found.');
    return;
  }

  const matchInfo = result.matches.map((match, i) =>
    `Match ${i + 1}: "${match}" → "${result.replacements[i]}"`
  ).join('\n');

  alert(`Found ${result.matches.length} match(es):\n\n${matchInfo}`);
}

/**
 * Update enabled toggle
 */
function updateEnabledToggle(enabled: boolean) {
  const toggle = document.getElementById('customRulesEnabledToggle') as HTMLInputElement;
  if (toggle) {
    toggle.checked = enabled;
    toggle.addEventListener('change', async () => {
      await updateGlobalEnabled(toggle.checked);
    });
  }
}

/**
 * Update global enabled setting
 */
async function updateGlobalEnabled(enabled: boolean) {
  try {
    await chromeApi.updateCustomRulesSettings({ enabled });
    const store = useAppStore.getState();
    await store.loadConfig();
    console.log(`[Custom Rules UI] Updated global enabled to ${enabled}`);
  } catch (error) {
    console.error('[Custom Rules UI] Error updating enabled:', error);
    alert('Failed to update settings. Please try again.');
  }
}

/**
 * Show add rule modal with templates
 */
export function showAddRuleModal() {
  const modal = document.createElement('div');
  modal.id = 'addRuleModal';
  modal.className = 'modal-overlay';

  modal.innerHTML = `
    <div class="modal-content modal-large">
      <div class="modal-header">
        <h3>Add Custom Rule</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-tabs">
          <button class="modal-tab-btn active" data-tab="custom">
            <span class="tab-icon">✏️</span>
            <span>Custom</span>
          </button>
          <button class="modal-tab-btn" data-tab="templates">
            <span class="tab-icon">📚</span>
            <span>Templates</span>
          </button>
        </div>

        <div class="tab-content active" data-tab-content="custom">
          <form id="addRuleForm" class="form-vertical">
            <div class="form-group">
              <label>Rule Name <span class="required-label">*</span></label>
              <input type="text" id="ruleName" placeholder="e.g., Employee ID" required>
            </div>

            <div class="form-group">
              <label>Pattern (Regex) <span class="required-label">*</span></label>
              <input type="text" id="rulePattern" placeholder="e.g., \\bEMP-\\d{5}\\b" required>
              <div class="form-hint">Use JavaScript regex syntax. Test your pattern below.</div>
            </div>

            <div class="form-group">
              <label>Replacement <span class="required-label">*</span></label>
              <input type="text" id="ruleReplacement" placeholder="e.g., [EMPLOYEE-ID]" required>
              <div class="form-hint">Use $1, $2 for capture groups, $& for full match</div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                <select id="ruleCategory">
                  <option value="pii">Personal Information</option>
                  <option value="financial">Financial Data</option>
                  <option value="medical">Medical Records</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div class="form-group">
                <label>Priority (0-100)</label>
                <input type="number" id="rulePriority" value="50" min="0" max="100">
              </div>
            </div>

            <div class="form-group">
              <label>Description <span class="optional-label">(optional)</span></label>
              <textarea id="ruleDescription" rows="2" placeholder="Describe what this rule does..."></textarea>
            </div>

            <div class="form-group">
              <label>Test Pattern</label>
              <textarea id="testInput" rows="2" placeholder="Enter sample text to test your pattern..."></textarea>
              <button type="button" class="btn btn-secondary" id="testPatternBtn">Test Pattern</button>
              <div id="testResult" class="test-result"></div>
            </div>
          </form>
        </div>

        <div class="tab-content" data-tab-content="templates">
          <div class="templates-grid">
            ${RULE_TEMPLATES.map((template, index) => `
              <div class="template-card" data-template-index="${index}">
                <h5>${template.name}</h5>
                <p>${template.description}</p>
                <code>${escapeHtml(template.pattern)}</code>
                <button class="btn btn-primary btn-sm use-template-btn">Use Template</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="saveRuleBtn">Add Rule</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Tab switching
  const tabBtns = modal.querySelectorAll('.modal-tab-btn');
  const tabContents = modal.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      modal.querySelector(`[data-tab-content="${tab}"]`)?.classList.add('active');
    });
  });

  // Template selection
  modal.querySelectorAll('.use-template-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const template = RULE_TEMPLATES[index];
      (modal.querySelector('#ruleName') as HTMLInputElement).value = template.name;
      (modal.querySelector('#rulePattern') as HTMLInputElement).value = template.pattern;
      (modal.querySelector('#ruleReplacement') as HTMLInputElement).value = template.replacement;
      (modal.querySelector('#ruleCategory') as HTMLSelectElement).value = template.category;
      (modal.querySelector('#rulePriority') as HTMLInputElement).value = template.priority.toString();
      (modal.querySelector('#ruleDescription') as HTMLTextAreaElement).value = template.description;

      // Switch to custom tab
      (modal.querySelector('[data-tab="custom"]') as HTMLButtonElement).click();
    });
  });

  // Test pattern
  modal.querySelector('#testPatternBtn')?.addEventListener('click', () => {
    const pattern = (modal.querySelector('#rulePattern') as HTMLInputElement).value;
    const testInput = (modal.querySelector('#testInput') as HTMLTextAreaElement).value;
    const replacement = (modal.querySelector('#ruleReplacement') as HTMLInputElement).value;
    const resultDiv = modal.querySelector('#testResult') as HTMLElement;

    if (!pattern || !testInput) {
      resultDiv.innerHTML = '<div class="test-error">Please enter both pattern and test text</div>';
      return;
    }

    const validation = RedactionEngine.validatePattern(pattern);
    if (!validation.valid) {
      resultDiv.innerHTML = `<div class="test-error">Invalid pattern: ${validation.error}</div>`;
      return;
    }

    const testRule: CustomRule = {
      id: 'test',
      name: 'Test',
      pattern,
      replacement,
      enabled: true,
      priority: 50,
      category: 'custom',
      createdAt: Date.now(),
      matchCount: 0
    };

    const result = RedactionEngine.testRule(testRule, testInput);

    if (result.error) {
      resultDiv.innerHTML = `<div class="test-error">Test failed: ${result.error}</div>`;
      return;
    }

    if (result.matches.length === 0) {
      resultDiv.innerHTML = '<div class="test-warning">No matches found</div>';
      return;
    }

    resultDiv.innerHTML = `
      <div class="test-success">
        <strong>Found ${result.matches.length} match(es):</strong>
        ${result.matches.map((match, i) => `
          <div class="match-item">
            "${escapeHtml(match)}" → "${escapeHtml(result.replacements[i])}"
          </div>
        `).join('')}
      </div>
    `;
  });

  // Save rule
  modal.querySelector('#saveRuleBtn')?.addEventListener('click', async () => {
    const name = (modal.querySelector('#ruleName') as HTMLInputElement).value;
    const pattern = (modal.querySelector('#rulePattern') as HTMLInputElement).value;
    const replacement = (modal.querySelector('#ruleReplacement') as HTMLInputElement).value;
    const category = (modal.querySelector('#ruleCategory') as HTMLSelectElement).value as any;
    const priority = parseInt((modal.querySelector('#rulePriority') as HTMLInputElement).value);
    const description = (modal.querySelector('#ruleDescription') as HTMLTextAreaElement).value;

    if (!name || !pattern || !replacement) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate pattern
    const validation = RedactionEngine.validatePattern(pattern);
    if (!validation.valid) {
      alert(`Invalid pattern: ${validation.error}`);
      return;
    }

    try {
      await chromeApi.addCustomRule({
        name,
        pattern,
        replacement,
        category,
        priority,
        description: description || undefined
      });

      const store = useAppStore.getState();
      await store.loadConfig();

      modal.remove();
      console.log('[Custom Rules UI] Added new rule');
    } catch (error) {
      console.error('[Custom Rules UI] Error adding rule:', error);
      alert('Failed to add rule. Please try again.');
    }
  });

  // Close handlers
  modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
  modal.querySelector('.modal-cancel')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

/**
 * Initialize custom rules UI handlers
 */
export function initCustomRulesUI() {
  const addRuleBtn = document.getElementById('addCustomRuleBtn');
  const addRuleBtnEmpty = document.getElementById('addCustomRuleBtnEmpty');

  addRuleBtn?.addEventListener('click', () => {
    showAddRuleModal();
  });

  addRuleBtnEmpty?.addEventListener('click', () => {
    showAddRuleModal();
  });

  console.log('[Custom Rules UI] UI handlers initialized');
}
