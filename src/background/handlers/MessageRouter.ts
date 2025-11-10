/**
 * Message Router
 * Routes messages to appropriate handlers
 */

import { StorageManager } from '../../lib/storage';
import { Message } from '../../lib/types';
import { AliasHandlers } from './AliasHandlers';
import { ConfigHandlers } from './ConfigHandlers';
import { APIKeyHandlers } from './APIKeyHandlers';
import { CustomRulesHandlers } from './CustomRulesHandlers';
import { RequestProcessor } from '../processors/RequestProcessor';
import { ResponseProcessor } from '../processors/ResponseProcessor';
import { BadgeManager } from '../managers/BadgeManager';
import { ContentScriptManager } from '../managers/ContentScriptManager';
import { ActivityLogger } from '../managers/ActivityLogger';

/**
 * Debug mode - set to false for production to reduce log spam
 */
const DEBUG_MODE = false;

export class MessageRouter {
  constructor(
    private storage: StorageManager,
    private aliasHandlers: AliasHandlers,
    private configHandlers: ConfigHandlers,
    private apiKeyHandlers: APIKeyHandlers,
    private customRulesHandlers: CustomRulesHandlers,
    private requestProcessor: RequestProcessor,
    private responseProcessor: ResponseProcessor,
    private badgeManager: BadgeManager,
    private contentScriptManager: ContentScriptManager,
    private activityLogger: ActivityLogger
  ) {}

  /**
   * Route messages to appropriate handlers
   */
  async handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<any> {
    switch (message.type) {
      case 'HEALTH_CHECK': {
        // Health check also reports protection status back to tab
        const senderTabId = message.tabId || sender?.tab?.id;

        if (senderTabId) {
          if (DEBUG_MODE) {
            console.log(`[MessageRouter] Health check passed for tab ${senderTabId}`);
          }

          // Update badge to protected (health checks are passing)
          const config = await this.storage.loadConfig();

          if (config?.settings?.enabled) {
            await this.badgeManager.updateBadge(senderTabId, 'protected');
          }
        }

        return { success: true, status: 'ok' };
      }

      case 'PROTECTION_LOST': {
        // Get tabId from message sender (content.ts doesn't have access to chrome.tabs.getCurrent)
        const tabId = message.tabId || sender?.tab?.id;
        if (tabId) {
          console.log(`[MessageRouter] Protection lost for tab ${tabId}`);
          await this.badgeManager.updateBadge(tabId, 'unprotected');
        } else {
          console.warn('[MessageRouter] PROTECTION_LOST received but no tabId available');
        }
        return { success: true };
      }

      case 'DISABLE_EXTENSION': {
        console.log('[MessageRouter] User requested extension disable');

        // Update config to disable extension
        const currentConfig = await this.storage.loadConfig();

        if (currentConfig) {
          await this.storage.saveConfig({
            ...currentConfig,
            settings: {
              ...currentConfig.settings,
              enabled: false
            }
          });

          console.log('[MessageRouter] ✅ Extension disabled');

          // Update all badges to show disabled state
          const tabs = await chrome.tabs.query({});
          for (const tab of tabs) {
            if (tab.id) {
              await this.badgeManager.checkAndUpdateBadge(tab.id, tab.url);
            }
          }
        }

        return { success: true };
      }

      case 'SUBSTITUTE_REQUEST':
        return this.requestProcessor.processRequest(
          message.payload.body,
          message.tabId,
          message.payload.url
        );

      case 'SUBSTITUTE_RESPONSE':
        return this.responseProcessor.processResponse(
          message.payload.text,
          message.payload.url
        );

      case 'RELOAD_PROFILES':
        return this.aliasHandlers.handleReloadProfiles();

      case 'SET_PROFILES':
        return this.aliasHandlers.handleSetProfiles(message.payload);

      case 'FLUSH_ACTIVITY_LOGS':
        // Popup opened - flush queued activity logs
        const flushed = await this.activityLogger.flushQueueToPopup();
        return { success: true, flushed };

      case 'GET_ALIASES':
        return this.aliasHandlers.handleGetAliases();

      case 'GET_PROFILES':
        return this.aliasHandlers.handleGetProfiles();

      case 'ADD_ALIAS':
        return this.aliasHandlers.handleAddAlias(message.payload);

      case 'REMOVE_ALIAS':
        return this.aliasHandlers.handleRemoveAlias(message.payload);

      case 'UPDATE_CONFIG':
        return this.configHandlers.handleUpdateConfig(message.payload);

      case 'GET_CONFIG':
        return this.configHandlers.handleGetConfig();

      case 'REINJECT_CONTENT_SCRIPTS':
        return this.contentScriptManager.handleReinject();

      case 'ADD_API_KEY':
        return this.apiKeyHandlers.handleAddAPIKey(message.payload);

      case 'REMOVE_API_KEY':
        return this.apiKeyHandlers.handleRemoveAPIKey(message.payload);

      case 'UPDATE_API_KEY':
        return this.apiKeyHandlers.handleUpdateAPIKey(message.payload);

      case 'GET_API_KEYS':
        return this.apiKeyHandlers.handleGetAPIKeys();

      case 'UPDATE_API_KEY_VAULT_SETTINGS':
        return this.apiKeyHandlers.handleUpdateAPIKeyVaultSettings(message.payload);

      case 'ADD_CUSTOM_RULE':
        return this.customRulesHandlers.handleAddCustomRule(message.payload);

      case 'REMOVE_CUSTOM_RULE':
        return this.customRulesHandlers.handleRemoveCustomRule(message.payload);

      case 'UPDATE_CUSTOM_RULE':
        return this.customRulesHandlers.handleUpdateCustomRule(message.payload);

      case 'TOGGLE_CUSTOM_RULE':
        return this.customRulesHandlers.handleToggleCustomRule(message.payload);

      case 'UPDATE_CUSTOM_RULES_SETTINGS':
        return this.customRulesHandlers.handleUpdateCustomRulesSettings(message.payload);

      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }
}
