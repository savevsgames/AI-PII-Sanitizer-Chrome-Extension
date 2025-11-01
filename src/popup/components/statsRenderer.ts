/**
 * Stats Renderer Component
 * Renders statistics from config with glassmorphism design
 */

import { UserConfig, AliasProfile } from '../../lib/types';
import { escapeHtml } from './utils';

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
 * Render stats from config and profiles
 */
export function renderStats(config: UserConfig | null, profiles?: AliasProfile[]) {
  if (!config) {
    showEmptyState();
    return;
  }

  const stats = config.stats;

  // Update overview cards
  updateOverviewCards(stats);

  // Render currently active profiles (use passed profiles or fall back to config.profiles)
  const profilesToRender = profiles || config.profiles || [];
  renderMostActiveProfile(profilesToRender);

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

  // Count from activity log for accuracy
  const serviceCounts: Record<string, number> = {
    chatgpt: 0,
    claude: 0,
    gemini: 0,
    perplexity: 0,
    poe: 0,
    copilot: 0,
    you: 0,
  };

  // Count unique interceptions per service from activity log
  stats.activityLog.forEach((entry) => {
    if (entry.service && entry.service !== 'unknown' && serviceCounts[entry.service] !== undefined) {
      serviceCounts[entry.service]++;
    }
  });

  const servicesData = [
    { key: 'chatgpt', label: 'ChatGPT', count: serviceCounts.chatgpt },
    { key: 'claude', label: 'Claude', count: serviceCounts.claude },
    { key: 'gemini', label: 'Gemini', count: serviceCounts.gemini },
    { key: 'perplexity', label: 'Perplexity', count: serviceCounts.perplexity },
    { key: 'poe', label: 'Poe', count: serviceCounts.poe },
    { key: 'copilot', label: 'Copilot', count: serviceCounts.copilot },
    { key: 'you', label: 'You.com', count: serviceCounts.you },
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

  // Count PII types from activity log
  const piiCounts: Record<string, number> = {
    name: 0,
    email: 0,
    phone: 0,
    cellPhone: 0,
    address: 0,
    company: 0,
    custom: 0,
  };

  // Count from activity log - check both piiTypesFound and profilesUsed
  stats.activityLog.forEach((entry) => {
    // If we have explicit PII types found, use those
    if (entry.details.piiTypesFound && entry.details.piiTypesFound.length > 0) {
      entry.details.piiTypesFound.forEach((type) => {
        if (piiCounts[type] !== undefined) {
          piiCounts[type] += entry.details.substitutionCount || 1;
        }
      });
    } else if (entry.type === 'substitution' && entry.details.substitutionCount > 0) {
      // Fallback: if we know substitutions happened but don't have specific types,
      // count as "name" (most common)
      piiCounts.name += entry.details.substitutionCount;
    }
  });

  const piiData = [
    { key: 'name', label: 'Name', count: piiCounts.name },
    { key: 'email', label: 'Email', count: piiCounts.email },
    { key: 'phone', label: 'Phone', count: piiCounts.phone },
    { key: 'cellPhone', label: 'Cell Phone', count: piiCounts.cellPhone },
    { key: 'address', label: 'Address', count: piiCounts.address },
    { key: 'company', label: 'Company', count: piiCounts.company },
    { key: 'custom', label: 'Custom', count: piiCounts.custom },
  ];

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

// escapeHtml now imported from './utils'
