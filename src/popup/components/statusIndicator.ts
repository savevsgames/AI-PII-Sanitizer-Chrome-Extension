/**
 * Status Indicator Component
 * Updates the header status indicator based on protection state
 */

import { UserConfig } from '../../lib/types';

/**
 * Service definitions with their domains
 * 5 services total, some have multiple domains
 */
const SERVICES = [
  { name: 'chatgpt', domains: ['chat.openai.com', 'chatgpt.com'] },
  { name: 'claude', domains: ['claude.ai'] },
  { name: 'gemini', domains: ['gemini.google.com'] },
  { name: 'perplexity', domains: ['perplexity.ai'] },
  { name: 'copilot', domains: ['copilot.microsoft.com'] },
];

const TOTAL_SERVICES = SERVICES.length; // 5

/**
 * Update status indicator in header
 * - Green: Protection enabled AND all services protected
 * - Red: Protection disabled OR any services disabled
 */
export function updateStatusIndicator(config: UserConfig | null) {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');

  if (!statusDot || !statusText || !config) return;

  const isEnabled = config.settings.enabled;
  const protectedDomains = config.settings.protectedDomains || [];

  // Check which services are protected (all domains for a service must be present)
  const protectedServices = SERVICES.filter(service =>
    service.domains.every(domain => protectedDomains.includes(domain))
  );

  const protectedCount = protectedServices.length;
  const allServicesProtected = protectedCount === TOTAL_SERVICES;

  // Status is "active" only if enabled AND all services are protected
  const isFullyActive = isEnabled && allServicesProtected;

  if (isFullyActive) {
    // Green - fully protected
    statusDot.classList.add('active');
    statusText.textContent = 'Active';
  } else {
    // Red - not fully protected
    statusDot.classList.remove('active');
    if (!isEnabled) {
      statusText.textContent = 'Disabled';
    } else {
      // Protection enabled but some services disabled
      statusText.textContent = `Partial (${protectedCount}/${TOTAL_SERVICES})`;
    }
  }
}
