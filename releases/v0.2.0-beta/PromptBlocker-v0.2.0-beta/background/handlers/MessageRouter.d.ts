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
export declare class MessageRouter {
    private storage;
    private aliasHandlers;
    private configHandlers;
    private apiKeyHandlers;
    private customRulesHandlers;
    private requestProcessor;
    private responseProcessor;
    private badgeManager;
    private contentScriptManager;
    constructor(storage: StorageManager, aliasHandlers: AliasHandlers, configHandlers: ConfigHandlers, apiKeyHandlers: APIKeyHandlers, customRulesHandlers: CustomRulesHandlers, requestProcessor: RequestProcessor, responseProcessor: ResponseProcessor, badgeManager: BadgeManager, contentScriptManager: ContentScriptManager);
    /**
     * Route messages to appropriate handlers
     */
    handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<any>;
}
//# sourceMappingURL=MessageRouter.d.ts.map