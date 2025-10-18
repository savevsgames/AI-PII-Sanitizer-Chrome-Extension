/**
 * Stats Renderer Component
 * Renders statistics from config
 */

import { UserConfig, AliasProfile } from '../../lib/types';

/**
 * Render stats from config
 */
export function renderStats(config: UserConfig | null) {
  if (!config) return;

  const stats = config.stats;

  // Update main stat cards
  const statProtectedEl = document.getElementById('statProtected');
  const statInterceptedEl = document.getElementById('statIntercepted');
  const statSuccessRateEl = document.getElementById('statSuccessRate');

  if (statProtectedEl) {
    statProtectedEl.textContent = formatNumber(stats.totalSubstitutions);
  }
  if (statInterceptedEl) {
    statInterceptedEl.textContent = formatNumber(stats.totalInterceptions);
  }
  if (statSuccessRateEl) {
    const rate = stats.totalInterceptions > 0 ? stats.successRate * 100 : 100;
    statSuccessRateEl.textContent = `${rate.toFixed(1)}%`;
  }

  // Render service breakdown
  renderServiceChart(stats.byService);

  // Render PII type breakdown
  renderPIITypeChart(config.profiles);

  // Render most active profile
  renderMostActiveProfile(config.profiles);

  // Add API Key Vault stats if available
  renderAPIKeyStats(config);

  console.log('[Stats] Stats rendered successfully');
}

/**
 * Format numbers with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Render service breakdown chart
 */
function renderServiceChart(serviceStats: UserConfig['stats']['byService']) {
  const container = document.getElementById('serviceChart');
  if (!container) {
    console.error('[Stats] serviceChart container not found');
    return;
  }

  const services = [
    { name: 'ChatGPT', key: 'chatgpt' as const, color: '#10a37f' },
    { name: 'Claude', key: 'claude' as const, color: '#D97757' },
    { name: 'Gemini', key: 'gemini' as const, color: '#4285f4' },
    { name: 'Perplexity', key: 'perplexity' as const, color: '#20808d' },
    { name: 'Poe', key: 'poe' as const, color: '#ff6b6b' },
    { name: 'Copilot', key: 'copilot' as const, color: '#0078d4' },
    { name: 'You', key: 'you' as const, color: '#4cc2ff' },
  ];

  const totalSubs = services.reduce((sum, s) => sum + serviceStats[s.key].substitutions, 0);

  console.log('[Stats] Service chart - totalSubs:', totalSubs);

  if (totalSubs === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 24px;">No activity yet</p>';
    console.log('[Stats] Service chart - showing empty state');
    return;
  }

  const activeServices = services.filter(s => serviceStats[s.key].substitutions > 0);

  container.innerHTML = `
    <div class="service-bars">
      ${activeServices.map(service => {
        const subs = serviceStats[service.key].substitutions;
        const percentage = (subs / totalSubs) * 100;
        return `
          <div class="service-bar-item">
            <div class="service-bar-header">
              <span class="service-name">${service.name}</span>
              <span class="service-count">${formatNumber(subs)} (${percentage.toFixed(1)}%)</span>
            </div>
            <div class="service-bar-track">
              <div class="service-bar-fill" style="width: ${percentage}%; background: ${service.color};"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render PII type breakdown
 */
function renderPIITypeChart(profiles: AliasProfile[]) {
  const container = document.getElementById('piiTypeChart');
  if (!container) return;

  // Aggregate PII type usage across all profiles
  const piiTypes = {
    name: 0,
    email: 0,
    phone: 0,
    cellPhone: 0,
    address: 0,
    company: 0,
    custom: 0
  };

  profiles.forEach(profile => {
    Object.entries(profile.metadata.usageStats.byPIIType).forEach(([type, count]) => {
      if (type in piiTypes) {
        piiTypes[type as keyof typeof piiTypes] += count;
      }
    });
  });

  const totalPII = Object.values(piiTypes).reduce((sum, count) => sum + count, 0);

  if (totalPII === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 24px;">No PII substitutions yet</p>';
    return;
  }

  const piiLabels = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    cellPhone: 'Cell Phone',
    address: 'Address',
    company: 'Company',
    custom: 'Custom'
  };

  const piiColors = {
    name: '#667eea',
    email: '#764ba2',
    phone: '#f093fb',
    cellPhone: '#f5576c',
    address: '#4facfe',
    company: '#00f2fe',
    custom: '#43e97b'
  };

  container.innerHTML = `
    <div class="pii-grid">
      ${Object.entries(piiTypes)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => {
          const percentage = (count / totalPII) * 100;
          return `
            <div class="pii-card">
              <div class="pii-card-header">
                <span class="pii-dot" style="background: ${piiColors[type as keyof typeof piiColors]};"></span>
                <span class="pii-label">${piiLabels[type as keyof typeof piiLabels]}</span>
              </div>
              <div class="pii-value">${formatNumber(count)}</div>
              <div class="pii-percentage">${percentage.toFixed(1)}%</div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

/**
 * Render most active profile
 */
function renderMostActiveProfile(profiles: AliasProfile[]) {
  const container = document.getElementById('mostActiveProfile');
  if (!container) return;

  if (profiles.length === 0) {
    container.innerHTML = '<span class="text-muted">No profiles yet</span>';
    return;
  }

  // Find profile with highest total substitutions
  const mostActive = profiles.reduce((max, profile) => {
    const totalSubs = profile.metadata.usageStats.totalSubstitutions;
    return totalSubs > max.totalSubs ? { profile, totalSubs } : max;
  }, { profile: profiles[0], totalSubs: profiles[0].metadata.usageStats.totalSubstitutions });

  if (mostActive.totalSubs === 0) {
    container.innerHTML = '<span class="text-muted">No activity yet</span>';
    return;
  }

  const profile = mostActive.profile;
  const lastUsed = new Date(profile.metadata.usageStats.lastUsed);
  const timeAgo = formatTimeAgo(lastUsed);

  container.innerHTML = `
    <div class="active-profile-card">
      <div class="active-profile-header">
        <div class="active-profile-icon">👤</div>
        <div class="active-profile-info">
          <h4 class="active-profile-name">${escapeHtml(profile.profileName)}</h4>
          <p class="active-profile-desc">${profile.description ? escapeHtml(profile.description) : 'No description'}</p>
        </div>
      </div>
      <div class="active-profile-stats">
        <div class="active-profile-stat">
          <span class="active-profile-stat-value">${formatNumber(mostActive.totalSubs)}</span>
          <span class="active-profile-stat-label">Total Substitutions</span>
        </div>
        <div class="active-profile-stat">
          <span class="active-profile-stat-value">${timeAgo}</span>
          <span class="active-profile-stat-label">Last Used</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render API Key Vault stats (if available)
 */
function renderAPIKeyStats(config: UserConfig) {
  // Check if there's a container for API key stats (we can add this to HTML later)
  const container = document.getElementById('apiKeyStats');
  if (!container || !config.apiKeyVault) return;

  const keys = config.apiKeyVault.keys || [];
  const totalProtections = keys.reduce((sum, key) => sum + key.protectionCount, 0);

  container.innerHTML = `
    <div class="api-key-stats-card">
      <h4>API Key Protection</h4>
      <div class="api-key-stats-grid">
        <div class="api-key-stat">
          <span class="api-key-stat-value">${keys.length}</span>
          <span class="api-key-stat-label">Protected Keys</span>
        </div>
        <div class="api-key-stat">
          <span class="api-key-stat-value">${formatNumber(totalProtections)}</span>
          <span class="api-key-stat-label">Total Blocks</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Format timestamp to relative time
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
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
