/**
 * Content Script Manager
 * Handles content script injection into AI service tabs
 */

import { BadgeManager } from './BadgeManager';

export class ContentScriptManager {
  /**
   * AI service URL patterns for content script injection
   */
  static readonly AI_SERVICE_PATTERNS = [
    '*://chatgpt.com/*',
    '*://*.openai.com/*',
    '*://claude.ai/*',
    '*://gemini.google.com/*',
    '*://perplexity.ai/*',
    '*://copilot.microsoft.com/*',
  ];

  constructor(private badgeManager: BadgeManager) {}

  /**
   * Check if content script is already injected in a tab
   */
  async isContentScriptInjected(tabId: number): Promise<boolean> {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
      return response === 'PONG';
    } catch (error) {
      return false;
    }
  }

  /**
   * Inject content scripts into all existing AI service tabs
   */
  async injectIntoExistingTabs(): Promise<void> {
    console.log('[ContentScriptManager] Injecting content scripts into existing tabs...');

    try {
      // Query all tabs matching AI service URLs
      for (const pattern of ContentScriptManager.AI_SERVICE_PATTERNS) {
        const tabs = await chrome.tabs.query({ url: pattern });

        for (const tab of tabs) {
          if (!tab.id) continue;

          // Check if content script is already injected
          const isInjected = await this.isContentScriptInjected(tab.id);

          if (!isInjected) {
            console.log(`[ContentScriptManager] Injecting into tab ${tab.id}: ${tab.url}`);

            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js'],
              });
              console.log(`[ContentScriptManager] ✅ Injected into tab ${tab.id}`);
              // Update badge after successful injection
              await this.badgeManager.checkAndUpdateBadge(tab.id, tab.url);
            } catch (error) {
              console.warn(`[ContentScriptManager] Failed to inject into tab ${tab.id}:`, error);
            }
            // Update badge for already-injected tabs
            await this.badgeManager.checkAndUpdateBadge(tab.id, tab.url);
          } else {
            console.log(`[ContentScriptManager] Already injected in tab ${tab.id}`);
          }
        }
      }

      console.log('[ContentScriptManager] ✅ Content script injection complete');
    } catch (error) {
      console.error('[ContentScriptManager] Error injecting into existing tabs:', error);
    }
  }

  /**
   * Handle REINJECT_CONTENT_SCRIPTS message from popup
   */
  async handleReinject(): Promise<{ success: boolean; message: string }> {
    await this.injectIntoExistingTabs();
    return { success: true, message: 'Content scripts reinjected' };
  }

  /**
   * Reload all AI service tabs (for extension updates/dev mode)
   * Returns the number of tabs reloaded
   */
  async reloadAIServiceTabs(): Promise<number> {
    console.log('[ContentScriptManager] Reloading all AI service tabs...');
    let reloadedCount = 0;

    try {
      // Query all tabs matching AI service URLs
      for (const pattern of ContentScriptManager.AI_SERVICE_PATTERNS) {
        const tabs = await chrome.tabs.query({ url: pattern });

        for (const tab of tabs) {
          if (!tab.id) continue;

          try {
            console.log(`[ContentScriptManager] Reloading tab ${tab.id}: ${tab.url}`);
            await chrome.tabs.reload(tab.id);
            reloadedCount++;
          } catch (error) {
            console.warn(`[ContentScriptManager] Failed to reload tab ${tab.id}:`, error);
          }
        }
      }

      console.log(`[ContentScriptManager] ✅ Reloaded ${reloadedCount} AI service tabs`);
    } catch (error) {
      console.error('[ContentScriptManager] Error reloading AI service tabs:', error);
    }

    return reloadedCount;
  }
}
