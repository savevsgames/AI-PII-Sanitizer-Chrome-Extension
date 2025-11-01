/**
 * Features Tab Component
 * Handles feature hub view, detail views, and navigation
 */

import { UserConfig } from '../../lib/types';
import { initAPIKeyVaultUI, renderAPIKeys } from './apiKeyVault';
import { initCustomRulesUI, renderCustomRules } from './customRulesUI';
import { useAppStore } from '../../lib/store';

// Feature definition
interface Feature {
  id: string;
  name: string;
  icon: string;
  description: string;
  tier: 'free' | 'pro';
  status: 'active' | 'locked' | 'coming-soon';
  stats?: {
    label: string;
    value: string | number;
  }[];
}

// Available features
const FEATURES: Feature[] = [
  {
    id: 'api-key-vault',
    name: 'API Key Vault',
    icon: '🔑',
    description: 'Protect your API keys from being accidentally sent to AI services',
    tier: 'free', // FREE with limits, PRO for unlimited
    status: 'active',
    stats: []
  },
  {
    id: 'custom-rules',
    name: 'Custom Redaction Rules',
    icon: '🎯',
    description: 'Create custom patterns to detect and replace domain-specific PII',
    tier: 'free', // TODO: Change back to 'pro' after testing
    status: 'active',
  },
  {
    id: 'prompt-templates',
    name: 'Prompt Templates',
    icon: '📋',
    description: 'Save and reuse common prompt templates with privacy built-in',
    tier: 'free',
    status: 'coming-soon',
  },
];

let currentFeature: string | null = null;

/**
 * Initialize features tab
 */
export function initFeaturesTab() {
  setupBackButton();
  console.log('[Features Tab] Initialized');
}

/**
 * Render features hub view
 */
export function renderFeaturesHub(config: UserConfig) {
  const hubView = document.getElementById('featuresHubView');
  const featuresGrid = document.getElementById('featuresGrid');
  const tierBadge = document.getElementById('currentTierBadge');

  if (!hubView || !featuresGrid || !tierBadge) return;

  // Update tier badge
  const userTier = config.account?.tier || 'free';
  tierBadge.textContent = userTier.toUpperCase();
  tierBadge.className = `tier-badge ${userTier}`;

  // Render feature cards
  featuresGrid.innerHTML = '';
  FEATURES.forEach(feature => {
    const card = createFeatureCard(feature, userTier, config);
    featuresGrid.appendChild(card);
  });

  console.log('[Features Tab] Hub rendered');
}

/**
 * Create a feature card element
 */
function createFeatureCard(feature: Feature, userTier: string, config: UserConfig): HTMLElement {
  const card = document.createElement('div');
  card.className = `feature-card ${feature.status === 'locked' ? 'locked' : ''} ${feature.status === 'coming-soon' ? 'coming-soon' : ''}`;
  card.setAttribute('data-feature-id', feature.id);

  // Determine if feature is accessible
  const isAccessible = feature.tier === 'free' || userTier === 'pro' || userTier === 'enterprise';
  const isLocked = feature.status === 'locked' || (!isAccessible && feature.status === 'active');
  const isComingSoon = feature.status === 'coming-soon';

  // Get feature stats if available
  const stats = getFeatureStats(feature.id, config);

  card.innerHTML = `
    <div class="feature-card-header">
      <div class="feature-card-icon">${feature.icon}</div>
      <span class="tier-badge ${isLocked ? 'locked' : feature.tier}">${feature.tier.toUpperCase()}</span>
    </div>
    <h3 class="feature-card-title">${feature.name}</h3>
    <p class="feature-card-description">${feature.description}</p>
    ${stats.length > 0 ? `
      <div class="feature-card-stats">
        ${stats.map(stat => `
          <div class="feature-card-stat">
            <span class="feature-card-stat-icon">${stat.icon}</span>
            <span>${stat.value} ${stat.label}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}
    <div class="feature-card-footer">
      ${renderFeatureAction(isLocked, isComingSoon, isAccessible)}
    </div>
  `;

  // Add click handler for accessible features
  if (!isLocked && !isComingSoon) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      showFeatureDetail(feature.id);
    });
  } else if (isLocked && !isAccessible) {
    // Add upgrade CTA handler
    const upgradeBtn = card.querySelector('.feature-card-action.locked');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleUpgradeCTA();
      });
    }
  }

  return card;
}

/**
 * Render action button based on feature status
 */
function renderFeatureAction(isLocked: boolean, isComingSoon: boolean, isAccessible: boolean): string {
  if (isComingSoon) {
    return `<button class="feature-card-action secondary" disabled>Coming Soon</button>`;
  }

  if (isLocked || !isAccessible) {
    return `<button class="feature-card-action locked">🔒 Upgrade to PRO</button>`;
  }

  return `<button class="feature-card-action">Configure →</button>`;
}

/**
 * Get feature-specific stats
 */
function getFeatureStats(featureId: string, config: UserConfig): Array<{ icon: string; value: string | number; label: string }> {
  switch (featureId) {
    case 'api-key-vault': {
      const keyCount = config.apiKeyVault?.keys?.length || 0;
      const protectionCount = config.apiKeyVault?.keys?.reduce((sum, key) => sum + key.protectionCount, 0) || 0;
      return keyCount > 0 ? [
        { icon: '🔑', value: keyCount, label: keyCount === 1 ? 'key' : 'keys' },
        { icon: '🛡️', value: protectionCount, label: 'blocks' }
      ] : [];
    }
    case 'custom-rules': {
      const ruleCount = config.customRules?.rules?.length || 0;
      const totalMatches = config.customRules?.rules?.reduce((sum, rule) => sum + rule.matchCount, 0) || 0;
      return ruleCount > 0 ? [
        { icon: '🎯', value: ruleCount, label: ruleCount === 1 ? 'rule' : 'rules' },
        { icon: '✅', value: totalMatches, label: 'matches' }
      ] : [];
    }
    default:
      return [];
  }
}

/**
 * Show feature detail view
 */
function showFeatureDetail(featureId: string) {
  currentFeature = featureId;
  const feature = FEATURES.find(f => f.id === featureId);
  if (!feature) return;

  const hubView = document.getElementById('featuresHubView');
  const detailView = document.getElementById('featureDetailView');
  const detailName = document.getElementById('featureDetailName');
  const detailTier = document.getElementById('featureDetailTier');
  const detailContent = document.getElementById('featureDetailContent');

  if (!hubView || !detailView || !detailName || !detailTier || !detailContent) return;

  // Update detail header
  detailName.textContent = feature.name;
  detailTier.textContent = feature.tier.toUpperCase();
  detailTier.className = `tier-badge ${feature.tier}`;

  // Render feature-specific content
  detailContent.innerHTML = renderFeatureContent(featureId);

  // Hide hub view and show detail view
  hubView.style.display = 'none';
  detailView.classList.remove('hidden');

  // Trigger slide-in animation
  setTimeout(() => {
    detailView.classList.add('active');
  }, 10);

  // Initialize feature-specific handlers
  initFeatureHandlers(featureId);

  console.log(`[Features Tab] Showing detail for ${featureId}`);
}

/**
 * Hide feature detail view
 */
function hideFeatureDetail() {
  const hubView = document.getElementById('featuresHubView');
  const detailView = document.getElementById('featureDetailView');
  if (!detailView) return;

  detailView.classList.remove('active');
  setTimeout(() => {
    detailView.classList.add('hidden');
    if (hubView) hubView.style.display = 'block';
    currentFeature = null;
  }, 300); // Match transition duration

  console.log('[Features Tab] Hiding detail view');
}

/**
 * Setup back button handler
 */
function setupBackButton() {
  const backBtn = document.getElementById('featureBackBtn');
  if (!backBtn) return;

  backBtn.addEventListener('click', () => {
    hideFeatureDetail();
  });
}

/**
 * Render feature-specific content
 */
function renderFeatureContent(featureId: string): string {
  switch (featureId) {
    case 'api-key-vault':
      return `
        <div class="api-key-vault-detail">
          <div class="tab-header">
            <h3>Your Protected Keys</h3>
            <button class="btn btn-primary" id="addAPIKeyBtn">+ Add API Key</button>
          </div>

          <div class="api-keys-list" id="apiKeysList">
            <!-- Keys will be rendered here -->
          </div>

          <div class="empty-state" id="apiKeysEmptyState">
            <div class="empty-state-icon">🔑</div>
            <p class="empty-state-title">No API keys protected yet</p>
            <p class="empty-state-hint">Add your API keys to prevent them from being accidentally sent to AI services</p>
            <button class="btn btn-primary" id="addAPIKeyBtnEmpty">Add Your First Key</button>
          </div>

          <div class="settings-section">
            <h3>Protection Mode</h3>
            <div class="radio-group" id="apiKeyProtectionMode">
              <label class="radio-label">
                <input type="radio" name="apiKeyMode" value="auto-redact" checked>
                <span class="radio-text">
                  <strong>Auto-Redact</strong>
                  <br>
                  <small>Automatically block API keys from being sent</small>
                </span>
              </label>
              <label class="radio-label">
                <input type="radio" name="apiKeyMode" value="warn-first">
                <span class="radio-text">
                  <strong>Warn First</strong>
                  <br>
                  <small>Show a warning before blocking</small>
                </span>
              </label>
              <label class="radio-label">
                <input type="radio" name="apiKeyMode" value="log-only">
                <span class="radio-text">
                  <strong>Log Only</strong>
                  <br>
                  <small>Only log detections, don't block</small>
                </span>
              </label>
            </div>
          </div>
        </div>
      `;
    case 'custom-rules':
      return `
        <div class="custom-rules-detail">
          <div id="customRulesUpgradeWarning" style="display: none;">
            <h3>🚀 PRO Feature</h3>
            <p>Custom Redaction Rules are available on the PRO plan. Create unlimited patterns to protect domain-specific data.</p>
            <button class="btn" id="customRulesUpgradeBtn">Upgrade to PRO</button>
          </div>

          <!-- Add Rule Dropdown Header -->
          <div class="add-rule-header" id="addRuleHeader">
            <div class="add-rule-header-content">
              <span class="add-rule-icon">✏️</span>
              <h3>Add New Rule</h3>
              <button class="add-rule-toggle" id="addRuleToggle">
                <span class="toggle-icon">▼</span>
              </button>
            </div>
          </div>

          <!-- Add Rule Form (Initially Hidden) -->
          <div class="add-rule-form" id="addRuleForm" style="display: none;">
            <div class="form-tabs">
              <button class="form-tab active" data-tab="custom">✏️ Custom</button>
              <button class="form-tab" data-tab="templates">📋 Templates</button>
            </div>

            <!-- Custom Tab -->
            <div class="form-tab-content active" id="customTab">
              <div class="form-group">
                <label for="ruleName">Rule Name <span class="required">*</span></label>
                <input type="text" id="ruleName" placeholder="e.g., Social Security Number" />
              </div>

              <div class="form-group">
                <label for="rulePattern">Pattern (Regex) <span class="required">*</span></label>
                <input type="text" id="rulePattern" placeholder="e.g., \\b\\d{3}-\\d{2}-\\d{4}\\b" />
              </div>

              <div class="form-group">
                <label for="ruleReplacement">Replacement <span class="required">*</span></label>
                <input type="text" id="ruleReplacement" placeholder="e.g., [SSN-REDACTED]" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="ruleCategory">Category</label>
                  <select id="ruleCategory">
                    <option value="pii">PII</option>
                    <option value="financial">Financial</option>
                    <option value="medical">Medical</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="rulePriority">Priority (0-100)</label>
                  <input type="number" id="rulePriority" min="0" max="100" value="50" />
                </div>
              </div>

              <div class="form-group">
                <label for="ruleDescription">Description (Optional)</label>
                <textarea id="ruleDescription" rows="2" placeholder="Describe what this rule does..."></textarea>
              </div>

              <div class="form-group">
                <label for="ruleTestInput">Test Pattern</label>
                <input type="text" id="ruleTestInput" placeholder="Enter text to test pattern..." />
                <button class="btn btn-secondary" id="testPatternBtn" style="margin-top: 8px;">🧪 Test Pattern</button>
                <div id="testPatternResult" style="margin-top: 8px;"></div>
              </div>

              <div class="form-actions">
                <button class="btn btn-secondary" id="cancelAddRule">Cancel</button>
                <button class="btn btn-primary" id="saveCustomRule">Save Rule</button>
              </div>
            </div>

            <!-- Templates Tab -->
            <div class="form-tab-content" id="templatesTab" style="display: none;">
              <div class="templates-grid" id="templatesGrid">
                <!-- Templates will be rendered here -->
              </div>
            </div>
          </div>

          <div class="settings-section" style="margin-bottom: 20px;">
            <label class="toggle-label">
              <span class="setting-label-text">Enable Custom Rules</span>
              <input type="checkbox" id="customRulesEnabledToggle">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="custom-rules-list" id="customRulesList">
            <!-- Rules will be rendered here -->
          </div>

          <div class="empty-state" id="customRulesEmptyState">
            <div class="empty-state-icon">🎯</div>
            <p class="empty-state-title">No custom rules yet</p>
            <p class="empty-state-hint">Create custom redaction patterns to protect domain-specific sensitive data</p>
            <button class="btn btn-primary" id="addCustomRuleBtnEmpty">Create Your First Rule</button>
          </div>
        </div>
      `;
    default:
      return `<p>Feature content coming soon...</p>`;
  }
}

/**
 * Initialize feature-specific event handlers
 */
function initFeatureHandlers(featureId: string) {
  switch (featureId) {
    case 'api-key-vault': {
      initAPIKeyVaultUI();
      // Render keys from current config
      const state = useAppStore.getState();
      if (state.config) {
        renderAPIKeys(state.config);
      }
      console.log('[Features Tab] API Key Vault handlers ready');
      break;
    }
    case 'custom-rules': {
      initCustomRulesUI();
      // Render rules from current config
      const customRulesState = useAppStore.getState();
      if (customRulesState.config) {
        renderCustomRules(customRulesState.config);
      }
      console.log('[Features Tab] Custom Rules handlers ready');
      break;
    }
    default:
      break;
  }
}

/**
 * Handle upgrade CTA click
 */
function handleUpgradeCTA() {
  // TODO: Show upgrade modal or redirect to upgrade page
  alert('PRO upgrade coming soon! This will unlock all advanced features.');
  console.log('[Features Tab] Upgrade CTA clicked');
}

/**
 * Get current feature ID
 */
export function getCurrentFeature(): string | null {
  return currentFeature;
}
