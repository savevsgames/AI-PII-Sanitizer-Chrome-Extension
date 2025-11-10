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

import { PromptTemplate, PromptTemplatesConfig, UserConfig } from '../types';
import { StorageConfigManager } from './StorageConfigManager';

export class StoragePromptTemplatesManager {
  private configManager: StorageConfigManager;

  constructor(configManager: StorageConfigManager) {
    this.configManager = configManager;
  }

  /**
   * Ensure config has prompt templates structure
   */
  private async ensurePromptTemplatesConfig(config: UserConfig): Promise<void> {
    if (!config.promptTemplates) {
      const userTier = config.account?.tier || 'free';
      config.promptTemplates = {
        templates: [],
        maxTemplates: userTier === 'pro' || userTier === 'enterprise' ? -1 : 3, // -1 = unlimited
        enableKeyboardShortcuts: true,
      };
    }
  }

  /**
   * Add a new prompt template
   */
  async addPromptTemplate(templateData: {
    name: string;
    content: string;
    description?: string;
    category?: string;
    tags?: string[];
    profileId?: string;
  }): Promise<PromptTemplate> {
    const config = await this.configManager.loadConfig();
    if (!config) throw new Error('Config not initialized');

    await this.ensurePromptTemplatesConfig(config);

    // FREE users cannot create custom templates (starter templates are always free)
    const isFree = config.account?.tier === 'free';
    if (isFree) {
      throw new Error('PRO_FEATURE: Creating custom templates requires PRO tier. Upgrade to unlock unlimited templates.');
    }

    const newTemplate: PromptTemplate = {
      id: this.generateId(),
      name: templateData.name,
      content: templateData.content,
      description: templateData.description,
      category: templateData.category,
      tags: templateData.tags,
      profileId: templateData.profileId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      lastUsed: undefined,
    };

    config.promptTemplates!.templates.push(newTemplate);
    await this.configManager.saveConfig(config);
    console.log('[StoragePromptTemplatesManager] Added prompt template:', newTemplate.name);

    return newTemplate;
  }

  /**
   * Remove a prompt template by ID
   */
  async removePromptTemplate(templateId: string): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config || !config.promptTemplates) return;

    config.promptTemplates.templates = config.promptTemplates.templates.filter(t => t.id !== templateId);
    await this.configManager.saveConfig(config);
    console.log('[StoragePromptTemplatesManager] Removed prompt template:', templateId);
  }

  /**
   * Update a prompt template
   */
  async updatePromptTemplate(templateId: string, updates: Partial<PromptTemplate>): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config || !config.promptTemplates) return;

    const template = config.promptTemplates.templates.find(t => t.id === templateId);
    if (!template) {
      console.error('[StoragePromptTemplatesManager] Template not found:', templateId);
      return;
    }

    // FREE users cannot edit starter templates
    const isFree = config.account?.tier === 'free';
    if (isFree && template.isStarter) {
      throw new Error('PRO_FEATURE: Editing templates requires PRO tier. Upgrade to unlock.');
    }

    Object.assign(template, updates, { updatedAt: Date.now() });
    await this.configManager.saveConfig(config);
    console.log('[StoragePromptTemplatesManager] Updated prompt template:', templateId);
  }

  /**
   * Get a single prompt template by ID
   */
  async getPromptTemplate(templateId: string): Promise<PromptTemplate | null> {
    const config = await this.configManager.loadConfig();
    if (!config || !config.promptTemplates) return null;

    return config.promptTemplates.templates.find(t => t.id === templateId) || null;
  }

  /**
   * Get all prompt templates
   */
  async getAllPromptTemplates(): Promise<PromptTemplate[]> {
    const config = await this.configManager.loadConfig();
    if (!config || !config.promptTemplates) return [];

    return config.promptTemplates.templates;
  }

  /**
   * Increment template usage counter
   */
  async incrementTemplateUsage(templateId: string): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config || !config.promptTemplates) return;

    const template = config.promptTemplates.templates.find(t => t.id === templateId);
    if (template) {
      template.usageCount++;
      template.lastUsed = Date.now();
      await this.configManager.saveConfig(config);
      console.log('[StoragePromptTemplatesManager] Incremented template usage:', templateId);
    }
  }

  /**
   * Update prompt templates settings
   */
  async updatePromptTemplatesSettings(settings: Partial<PromptTemplatesConfig>): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config) return;

    await this.ensurePromptTemplatesConfig(config);

    config.promptTemplates = {
      ...config.promptTemplates!,
      ...settings
    };

    await this.configManager.saveConfig(config);
    console.log('[StoragePromptTemplatesManager] Updated prompt templates settings');
  }

  /**
   * Generate unique ID for templates
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
