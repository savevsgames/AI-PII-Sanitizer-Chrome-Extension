/**
 * Service Worker (Background Script)
 * Clean orchestrator that delegates to specialized modules
 */

// CRITICAL: Import polyfills FIRST before anything else
import './polyfills';

import { waitForAuth } from '../lib/firebase';
import { StorageManager } from '../lib/storage';
import { AliasEngine } from '../lib/aliasEngine';
import { APIKeyDetector } from '../lib/apiKeyDetector';
import { redactionEngine } from '../lib/redactionEngine';
import { BadgeManager } from './managers/BadgeManager';
import { ContentScriptManager } from './managers/ContentScriptManager';
import { ActivityLogger } from './managers/ActivityLogger';
import { RequestProcessor } from './processors/RequestProcessor';
import { ResponseProcessor } from './processors/ResponseProcessor';
import { MessageRouter } from './handlers/MessageRouter';
import { AliasHandlers } from './handlers/AliasHandlers';
import { ConfigHandlers } from './handlers/ConfigHandlers';
import { APIKeyHandlers } from './handlers/APIKeyHandlers';
import { CustomRulesHandlers } from './handlers/CustomRulesHandlers';
import { Message } from '../lib/types';

// ========== FIREBASE INITIALIZATION ==========

console.log('[Background] Initializing Firebase auth for service worker...');
waitForAuth().then(() => {
  console.log('[Background] ✅ Firebase auth initialized in service worker');
}).catch(error => {
  console.error('[Background] ❌ Firebase auth initialization failed:', error);
});

// ========== INITIALIZE CORE SERVICES ==========

// Wrap initialization in async IIFE to properly await AliasEngine
(async () => {
  const storage = StorageManager.getInstance();
  const aliasEngine = await AliasEngine.getInstance();
  const apiKeyDetector = new APIKeyDetector();

  // ========== INITIALIZE MANAGERS ==========

  const activityLogger = new ActivityLogger(storage);
  const badgeManager = new BadgeManager(storage, null as any); // Will set contentScriptManager next
  const contentScriptManager = new ContentScriptManager(badgeManager);
  // Set circular reference
  (badgeManager as any).contentScriptManager = contentScriptManager;

  // ========== INITIALIZE PROCESSORS ==========

  const requestProcessor = new RequestProcessor(storage, aliasEngine, apiKeyDetector, redactionEngine, activityLogger);
  const responseProcessor = new ResponseProcessor(storage, aliasEngine);

  // ========== INITIALIZE HANDLERS ==========

  const aliasHandlers = new AliasHandlers(storage, aliasEngine);
  const configHandlers = new ConfigHandlers(storage);
  const apiKeyHandlers = new APIKeyHandlers(storage);
  const customRulesHandlers = new CustomRulesHandlers(storage);

  // ========== INITIALIZE ROUTER ==========

  const messageRouter = new MessageRouter(
    storage,
    aliasHandlers,
    configHandlers,
    apiKeyHandlers,
    customRulesHandlers,
    requestProcessor,
    responseProcessor,
    badgeManager,
    contentScriptManager
  );

  // ========== EVENT LISTENERS ==========

  /**
   * Startup: Inject content scripts and update badges
   */
  chrome.runtime.onStartup.addListener(async () => {
    console.log('AI PII Sanitizer startup');
    await contentScriptManager.injectIntoExistingTabs();

    // Update badges for all tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        await badgeManager.checkAndUpdateBadge(tab.id, tab.url);
      }
    }
  });

  /**
   * Install/Update: Initialize storage, reload tabs, inject scripts
   */
  chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('AI PII Sanitizer installed:', details.reason);

    try {
      await storage.initialize();

      // Ensure extension is enabled on install/update
      const config = await storage.loadConfig();
      if (config && !config.settings.enabled) {
        console.log('[Background] Extension was disabled - enabling it now');
        config.settings.enabled = true;
        await storage.saveConfig(config);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
        console.log('[Background] User not authenticated - skipping data initialization');
        console.log('[Background] Extension will initialize when user signs in');
      } else {
        console.error('[Background] Failed to initialize on install:', error);
      }
    }

    // Auto-reload AI service tabs on extension update/reload (dev mode)
    if (details.reason === 'update' || details.reason === 'install') {
      console.log('[Background] Extension updated/installed - auto-reloading AI service tabs');
      const reloadedCount = await contentScriptManager.reloadAIServiceTabs();
      console.log(`[Background] ✅ Auto-reloaded ${reloadedCount} AI service tabs`);
    }

    // Inject content scripts into existing tabs that weren't reloaded
    await contentScriptManager.injectIntoExistingTabs();

    // Update badges for all tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        await badgeManager.checkAndUpdateBadge(tab.id, tab.url);
      }
    }
  });

  /**
   * Messages: Delegate to MessageRouter
   */
  chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
      if (!message || !message.type) {
        console.warn('[Background] Received message without type field:', message);
        sendResponse({ success: false, error: 'Invalid message format' });
        return false;
      }

      messageRouter.handleMessage(message, sender)
        .then(sendResponse)
        .catch((error: Error) => {
          console.error('Error handling message:', error);
          sendResponse({ success: false, error: error.message });
        });

      return true; // Async response
    }
  );

  /**
   * Tab activation: Update badge when tab becomes active
   */
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      await badgeManager.checkAndUpdateBadge(activeInfo.tabId, tab.url);
    } catch (error) {
      console.error('[Badge] Error on tab activation:', error);
    }
  });

  /**
   * Tab update: Update badge when tab URL changes
   */
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only check when URL changes or page finishes loading
    if (changeInfo.url || changeInfo.status === 'complete') {
      await badgeManager.checkAndUpdateBadge(tabId, tab.url);
    }
  });

  /**
   * Storage changes: Reload profiles when config changes
   */
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'local' && changes.config) {
      const oldConfig = changes.config.oldValue;
      const newConfig = changes.config.newValue;

      // Check if enabled state or protectedDomains changed
      const enabledChanged = oldConfig?.settings?.enabled !== newConfig?.settings?.enabled;
      const domainsChanged = JSON.stringify(oldConfig?.settings?.protectedDomains) !==
                             JSON.stringify(newConfig?.settings?.protectedDomains);

      if (enabledChanged || domainsChanged) {
        console.log('[Badge] Protection settings changed, updating all badges', {
          enabledChanged,
          domainsChanged,
          oldDomains: oldConfig?.settings?.protectedDomains,
          newDomains: newConfig?.settings?.protectedDomains
        });

        // Update badges for all tabs
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.id) {
            await badgeManager.checkAndUpdateBadge(tab.id, tab.url);
          }
        }
      }
    }
  });
})();
