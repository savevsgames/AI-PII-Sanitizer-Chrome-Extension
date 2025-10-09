/**
 * Stats Renderer Component
 * Renders statistics from config
 */

import { UserConfig } from '../../lib/types';

/**
 * Render stats from config
 */
export function renderStats(config: UserConfig | null) {
  if (!config) return;

  const stats = config.stats;

  // Update total stats
  const totalSubsEl = document.getElementById('totalSubstitutions');
  const totalInterceptionsEl = document.getElementById('totalInterceptions');
  const successRateEl = document.getElementById('successRate');

  if (totalSubsEl) totalSubsEl.textContent = stats.totalSubstitutions.toString();
  if (totalInterceptionsEl) totalInterceptionsEl.textContent = stats.totalInterceptions.toString();
  if (successRateEl) successRateEl.textContent = `${(stats.successRate * 100).toFixed(1)}%`;

  // Update service stats
  const chatgptEl = document.getElementById('chatgptSubs');
  const claudeEl = document.getElementById('claudeSubs');
  const geminiEl = document.getElementById('geminiSubs');

  if (chatgptEl) chatgptEl.textContent = stats.byService.chatgpt.substitutions.toString();
  if (claudeEl) claudeEl.textContent = stats.byService.claude.substitutions.toString();
  if (geminiEl) geminiEl.textContent = stats.byService.gemini.substitutions.toString();
}
