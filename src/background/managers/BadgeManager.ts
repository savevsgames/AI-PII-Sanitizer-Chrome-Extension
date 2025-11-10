/**
 * Badge Manager
 * Handles extension badge updates based on protection state
 */

import { StorageManager } from '../../lib/storage';
import { ContentScriptManager } from './ContentScriptManager';

/**
 * Protection state for badge display
 */
export type ProtectionState = 'protected' | 'unprotected' | 'disabled';

/**
 * Debug mode - set to false for production to reduce log spam
 */
const DEBUG_MODE = false;

export class BadgeManager {
  /**
   * AI service URL patterns for protection detection
   */
  static readonly AI_SERVICE_URLS = [
    'chatgpt.com',
    'openai.com',
    'claude.ai',
    'gemini.google.com',
    'perplexity.ai',
    'copilot.microsoft.com',
  ];

  /**
   * Track last badge state per tab to avoid log spam
   */
  private badgeStateCache = new Map<number, ProtectionState>();

  constructor(
    private storage: StorageManager,
    private contentScriptManager: ContentScriptManager
  ) {}

  /**
   * Check if URL is an AI service
   */
  isAIServiceURL(url: string | undefined): boolean {
    if (!url) return false;
    return BadgeManager.AI_SERVICE_URLS.some(domain => url.includes(domain));
  }

  /**
   * Update extension badge based on protection state
   */
  async updateBadge(tabId: number, state: ProtectionState): Promise<void> {
    try {
      // Check if state changed (only log changes, not every health check)
      const lastState = this.badgeStateCache.get(tabId);
      const stateChanged = lastState !== state;

      if (stateChanged) {
        this.badgeStateCache.set(tabId, state);
      }

      switch (state) {
        case 'protected':
          await chrome.action.setBadgeText({ tabId, text: '✓' });
          await chrome.action.setBadgeBackgroundColor({ tabId, color: '#10B981' }); // Green
          await chrome.action.setTitle({ tabId, title: 'AI PII Sanitizer - Protected ✓' });
          if (DEBUG_MODE || stateChanged) {
            console.log(`[BadgeManager] Tab ${tabId}: PROTECTED (Green)`);
          }
          break;

        case 'unprotected':
          await chrome.action.setBadgeText({ tabId, text: '!' });
          await chrome.action.setBadgeBackgroundColor({ tabId, color: '#EF4444' }); // Red
          await chrome.action.setTitle({ tabId, title: 'AI PII Sanitizer - NOT PROTECTED! Click to reload page' });
          if (DEBUG_MODE || stateChanged) {
            console.log(`[BadgeManager] Tab ${tabId}: UNPROTECTED (Red)`);
          }
          break;

        case 'disabled':
          await chrome.action.setBadgeText({ tabId, text: '' });
          await chrome.action.setBadgeBackgroundColor({ tabId, color: '#6B7280' }); // Grey
          await chrome.action.setTitle({ tabId, title: 'AI PII Sanitizer - Disabled' });
          if (DEBUG_MODE || stateChanged) {
            console.log(`[BadgeManager] Tab ${tabId}: DISABLED (No badge)`);
          }
          break;
      }
    } catch (error) {
      console.error(`[BadgeManager] Failed to update badge for tab ${tabId}:`, error);
    }
  }

  /**
   * Check tab protection status and update badge
   */
  async checkAndUpdateBadge(tabId: number, url?: string): Promise<void> {
    try {
      // Clear badge for non-AI service pages
      if (!this.isAIServiceURL(url)) {
        await chrome.action.setBadgeText({ tabId, text: '' });
        if (DEBUG_MODE) {
          console.log(`[BadgeManager] Tab ${tabId}: Not an AI service, badge cleared`);
        }
        return;
      }

      // Check if extension is enabled
      let config: Awaited<ReturnType<typeof this.storage.loadConfig>> = null;

      try {
        config = await this.storage.loadConfig();
      } catch (error) {
        // If config loading fails due to auth, assume extension is disabled
        // This prevents errors from spamming when user isn't signed in
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          console.log(`[BadgeManager] Tab ${tabId}: Data locked (user not authenticated)`);
          await this.updateBadge(tabId, 'disabled');
          return;
        }
        throw error; // Re-throw other errors
      }

      if (DEBUG_MODE) {
        console.log(`[BadgeManager] Config check for tab ${tabId}:`, {
          hasConfig: !!config,
          hasSettings: !!config?.settings,
          enabled: config?.settings?.enabled
        });
      }

      if (!config?.settings?.enabled) {
        await this.updateBadge(tabId, 'disabled');
        return;
      }

      // Check if this specific domain is in protectedDomains
      const protectedDomains = config?.settings?.protectedDomains || [];
      const currentDomain = url ? new URL(url).hostname : '';
      const isDomainProtected = protectedDomains.some(domain =>
        currentDomain.includes(domain) || domain.includes(currentDomain)
      );

      if (!isDomainProtected) {
        // Service is disabled for this domain
        await this.updateBadge(tabId, 'disabled');
        if (DEBUG_MODE) {
          console.log(`[BadgeManager] Tab ${tabId}: Domain ${currentDomain} not in protectedDomains`, protectedDomains);
        }
        return;
      }

      // Check if content script is injected and responding
      const isInjected = await this.contentScriptManager.isContentScriptInjected(tabId);

      if (isInjected) {
        await this.updateBadge(tabId, 'protected');
      } else {
        await this.updateBadge(tabId, 'unprotected');
      }
    } catch (error) {
      console.error(`[BadgeManager] Error checking protection for tab ${tabId}:`, error);
    }
  }
}
