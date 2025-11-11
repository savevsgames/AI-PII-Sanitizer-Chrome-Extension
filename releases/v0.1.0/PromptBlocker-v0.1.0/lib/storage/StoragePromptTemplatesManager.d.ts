/**
 * Storage Prompt Templates Manager
 * Handles all prompt template operations
 *
 * Features:
 * - Template CRUD operations
 * - PRO tier requirement for custom templates
 * - Starter templates (always available)
 * - Usage tracking
 * - Storage via ConfigManager
 */
import { PromptTemplate, PromptTemplatesConfig } from '../types';
import { StorageConfigManager } from './StorageConfigManager';
export declare class StoragePromptTemplatesManager {
    private configManager;
    constructor(configManager: StorageConfigManager);
    /**
     * Ensure config has prompt templates structure
     */
    private ensurePromptTemplatesConfig;
    /**
     * Add a new prompt template
     */
    addPromptTemplate(templateData: {
        name: string;
        content: string;
        description?: string;
        category?: string;
        tags?: string[];
        profileId?: string;
    }): Promise<PromptTemplate>;
    /**
     * Remove a prompt template by ID
     */
    removePromptTemplate(templateId: string): Promise<void>;
    /**
     * Update a prompt template
     */
    updatePromptTemplate(templateId: string, updates: Partial<PromptTemplate>): Promise<void>;
    /**
     * Get a single prompt template by ID
     */
    getPromptTemplate(templateId: string): Promise<PromptTemplate | null>;
    /**
     * Get all prompt templates
     */
    getAllPromptTemplates(): Promise<PromptTemplate[]>;
    /**
     * Increment template usage counter
     */
    incrementTemplateUsage(templateId: string): Promise<void>;
    /**
     * Update prompt templates settings
     */
    updatePromptTemplatesSettings(settings: Partial<PromptTemplatesConfig>): Promise<void>;
    /**
     * Generate unique ID for templates
     */
    private generateId;
}
//# sourceMappingURL=StoragePromptTemplatesManager.d.ts.map