/**
 * Stats Renderer Component
 * Renders statistics from config with glassmorphism design
 */

import { UserConfig, AliasProfile } from '../../lib/types';

/**
 * Service icon mapping
 */
const SERVICE_ICONS: Record<string, string> = {
  chatgpt: '💬',
  claude: '🤖',
  gemini: '✨',
  perplexity: '🔍',
  poe: '🎭',
  copilot: '🧑‍💻',
  you: '🌐',
};

/**
 * PII type icon mapping
 */
const PII_TYPE_ICONS: Record<string, string> = {
  name: '👤',
  email: '📧',
  phone: '📱',
  cellPhone: '📞',
  address: '🏠',
  company: '🏢',
  custom: '🔧',
};

/**
 * Render stats from config
 */
export function renderStats(config: UserConfig | null) {
  if (!config) {
    showEmptyState();
    return;
  }

  const stats = config.stats;

  // Update overview cards
  updateOverviewCards(stats);

  // Render most active profile
  renderMostActiveProfile(config.profiles);

  // Render service breakdown
  renderServiceBreakdown(stats);

  // Render PII type breakdown
  renderPIITypeBreakdown(stats);
}

/**
 * Update overview cards (Total Protected, Requests Analyzed, Success Rate)
 */
function updateOverviewCards(stats: UserConfig['stats']) {
  const totalSubsEl = document.getElementById('totalSubstitutions');
  const totalInterceptionsEl = document.getElementById('totalInterceptions');
  const successRateEl = document.getElementById('successRate');

  if (totalSubsEl) {
    totalSubsEl.textContent = formatNumber(stats.totalSubstitutions);
  }
  if (totalInterceptionsEl) {
    totalInterceptionsEl.textContent = formatNumber(stats.totalInterceptions);
  }
  if (successRateEl) {
    successRateEl.textContent = `${(stats.successRate * 100).toFixed(1)}%`;
  }
}

/**
 * Render currently active profile(s)
 */
function renderMostActiveProfile(profiles: AliasProfile[]) {
  const container = document.getElementById('mostActiveProfileCard');
  if (!container) return;

  const enabledProfiles = profiles.filter((p) => p.enabled);
  if (enabledProfiles.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📊</span>
        <p>No active profiles</p>
      </div>
    `;
    return;
  }

  // Show all enabled profiles
  container.innerHTML = enabledProfiles
    .map((profile) => {
      const createdDate = new Date(profile.metadata.createdAt).toLocaleDateString();
      return `
        <div class="profile-highlight">
          <div>
            <div class="profile-name">${escapeHtml(profile.profileName)}</div>
            <div class="profile-stats">
              ${profile.description ? escapeHtml(profile.description) + ' • ' : ''}Created ${createdDate}
            </div>
          </div>
          <div class="item-value">✅ Active</div>
        </div>
      `;
    })
    .join('');
}

/**
 * Render service breakdown with horizontal bars
 */
function renderServiceBreakdown(stats: UserConfig['stats']) {
  const container = document.getElementById('serviceBreakdownList');
  if (!container) return;

  // Count by requests (interceptions) per service
  const servicesData = [
    { key: 'chatgpt', label: 'ChatGPT', count: stats.byService.chatgpt.requests },
    { key: 'claude', label: 'Claude', count: stats.byService.claude.requests },
    { key: 'gemini', label: 'Gemini', count: stats.byService.gemini.requests },
    { key: 'perplexity', label: 'Perplexity', count: stats.byService.perplexity.requests },
    { key: 'poe', label: 'Poe', count: stats.byService.poe.requests },
    { key: 'copilot', label: 'Copilot', count: stats.byService.copilot.requests },
    { key: 'you', label: 'You.com', count: stats.byService.you.requests },
  ];

  const totalCount = servicesData.reduce((sum, service) => sum + service.count, 0);

  if (totalCount === 0) {
    container.innerHTML = '<div class="stats-empty">No service data yet</div>';
    return;
  }

  // Sort by count descending
  servicesData.sort((a, b) => b.count - a.count);

  container.innerHTML = servicesData
    .map((service) => {
      const percentage = totalCount > 0 ? (service.count / totalCount) * 100 : 0;
      const icon = SERVICE_ICONS[service.key] || '🌐';

      return `
        <div class="breakdown-item">
          <span class="item-icon">${icon}</span>
          <span class="item-label">${service.label}</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
          <span class="item-value">${formatNumber(service.count)}</span>
        </div>
      `;
    })
    .join('');
}

/**
 * Render PII type breakdown with horizontal bars
 */
function renderPIITypeBreakdown(stats: UserConfig['stats']) {
  const container = document.getElementById('piiBreakdownList');
  if (!container) return;

  // Get PII type data from activity log
  const piiData = [
    { key: 'name', label: 'Name', count: 0 },
    { key: 'email', label: 'Email', count: 0 },
    { key: 'phone', label: 'Phone', count: 0 },
    { key: 'cellPhone', label: 'Cell Phone', count: 0 },
    { key: 'address', label: 'Address', count: 0 },
    { key: 'company', label: 'Company', count: 0 },
    { key: 'custom', label: 'Custom', count: 0 },
  ];

  // Count PII types from activity log
  stats.activityLog.forEach((entry) => {
    if (entry.details.piiTypesFound) {
      entry.details.piiTypesFound.forEach((type) => {
        const piiType = piiData.find((p) => p.key === type);
        if (piiType) {
          piiType.count += entry.details.substitutionCount || 0;
        }
      });
    }
  });

  const totalCount = piiData.reduce((sum, pii) => sum + pii.count, 0);

  if (totalCount === 0) {
    container.innerHTML = '<div class="stats-empty">No PII type data yet</div>';
    return;
  }

  // Sort by count descending and filter out zeros
  const filteredPiiData = piiData.filter((p) => p.count > 0).sort((a, b) => b.count - a.count);

  container.innerHTML = filteredPiiData
    .map((pii) => {
      const percentage = totalCount > 0 ? (pii.count / totalCount) * 100 : 0;
      const icon = PII_TYPE_ICONS[pii.key] || '🔒';

      return `
        <div class="breakdown-item">
          <span class="item-icon">${icon}</span>
          <span class="item-label">${pii.label}</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
          <span class="item-value">${formatNumber(pii.count)}</span>
        </div>
      `;
    })
    .join('');
}

/**
 * Show empty state when no config
 */
function showEmptyState() {
  const statsTab = document.getElementById('stats-tab');
  if (!statsTab) return;

  statsTab.innerHTML = `
    <div class="stats-empty">
      <div class="stats-empty-icon">📊</div>
      <p><strong>No statistics available</strong></p>
      <p>Start using the extension to see your protection stats!</p>
    </div>
  `;
}

/**
 * Format large numbers with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
