/**
 * Page Object Models (POM) for E2E Testing
 *
 * Encapsulates page interactions into reusable, maintainable classes.
 * Follows the Page Object Model pattern for clean, DRY test code.
 *
 * Benefits:
 * - Reduces code duplication
 * - Centralizes selector management
 * - Improves test readability
 * - Makes tests resilient to UI changes
 *
 * @version 1.0.0
 * @author PromptBlocker Team
 */

import { Page } from 'puppeteer';
import { ProfileData } from './ExtensionTestHarness';

/**
 * PopupPage - Represents the extension popup UI
 *
 * Provides high-level methods for interacting with the popup:
 * - Navigation between tabs
 * - Profile management
 * - Settings configuration
 * - Stats viewing
 */
export class PopupPage {
  constructor(private page: Page) {}

  // ========== SELECTORS ==========

  private selectors = {
    // Main elements
    app: '#app',
    header: '.header',
    statusIndicator: '#statusIndicator',

    // Tab navigation
    tabNav: '.tab-nav',
    aliasesTab: '[data-tab="aliases"]',
    statsTab: '[data-tab="stats"]',
    featuresTab: '[data-tab="features"]',
    settingsTab: '[data-tab="settings"]',
    debugTab: '[data-tab="debug"]',

    // Profile list
    profileList: '#profileList',
    profileCard: '.profile-card',
    profilesEmptyState: '#profilesEmptyState',
    addProfileBtn: '#addProfileBtn',

    // Profile modal
    profileModal: '#profileModal',
    profileForm: '#profileForm',
    profileName: '#profileName',
    realName: '#realName',
    aliasName: '#aliasName',
    realEmail: '#realEmail',
    aliasEmail: '#aliasEmail',
    realPhone: '#realPhone',
    aliasPhone: '#aliasPhone',
    realAddress: '#realAddress',
    aliasAddress: '#aliasAddress',
    modalSave: '#modalSave',
    modalCancel: '#modalCancel',

    // Delete confirmation modal
    deleteModal: '.modal-delete',
    confirmDelete: '#confirmDelete',
    cancelDelete: '#cancelDelete',

    // Minimal mode
    minimizeBtn: '#minimizeBtn',
    expandBtn: '#expandBtn',
    minimalView: '#minimalView',
    fullView: '#fullView'
  };

  // ========== NAVIGATION ==========

  /**
   * Wait for popup to be fully loaded
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForSelector(this.selectors.app, {
      visible: true,
      timeout: 10000
    });
  }

  /**
   * Navigate to a specific tab
   */
  async navigateToTab(tab: 'aliases' | 'stats' | 'features' | 'settings' | 'debug'): Promise<void> {
    const selector = this.selectors[`${tab}Tab` as keyof typeof this.selectors] as string;
    await this.page.waitForSelector(selector, { visible: true });
    await this.page.click(selector);

    // Wait for tab to be active
    await this.page.waitForFunction(
      (sel) => document.querySelector(sel)?.classList.contains('active'),
      {},
      selector
    );
  }

  // ========== PROFILE MANAGEMENT ==========

  /**
   * Check if profiles empty state is shown
   */
  async isEmptyState(): Promise<boolean> {
    try {
      await this.page.waitForSelector(this.selectors.profilesEmptyState, {
        visible: true,
        timeout: 1000
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get count of profile cards
   */
  async getProfileCount(): Promise<number> {
    const cards = await this.page.$$(this.selectors.profileCard);
    return cards.length;
  }

  /**
   * Get all profile names
   */
  async getProfileNames(): Promise<string[]> {
    const cards = await this.page.$$(this.selectors.profileCard);
    const names: string[] = [];

    for (const card of cards) {
      const text = await card.evaluate(el => el.textContent || '');
      // Extract profile name (first line of card text)
      const match = text.match(/^([^\n]+)/);
      if (match) {
        names.push(match[1].trim());
      }
    }

    return names;
  }

  /**
   * Check if a profile exists by name
   */
  async hasProfile(profileName: string): Promise<boolean> {
    const names = await this.getProfileNames();
    return names.some(name => name.includes(profileName));
  }

  /**
   * Get profile card element by index (0-based)
   */
  async getProfileCard(index: number) {
    const cards = await this.page.$$(this.selectors.profileCard);
    if (index >= cards.length) {
      throw new Error(`Profile card ${index} not found (total: ${cards.length})`);
    }
    return cards[index];
  }

  /**
   * Get profile card text content
   */
  async getProfileCardText(index: number): Promise<string> {
    const card = await this.getProfileCard(index);
    return await card.evaluate(el => el.textContent || '');
  }

  /**
   * Check if profile is enabled by index
   */
  async isProfileEnabled(index: number): Promise<boolean> {
    const text = await this.getProfileCardText(index);
    return text.includes('Alias Enabled');
  }

  /**
   * Click "New Profile" button
   */
  async clickNewProfile(): Promise<void> {
    await this.page.waitForSelector(this.selectors.addProfileBtn, { visible: true });
    await this.page.click(this.selectors.addProfileBtn);

    // Wait for modal to open
    await this.page.waitForSelector(this.selectors.profileModal, { visible: true });
  }

  /**
   * Click "Edit" button on profile card
   */
  async clickEditProfile(index: number): Promise<void> {
    const card = await this.getProfileCard(index);
    const editBtn = await card.$('.btn-edit');

    if (!editBtn) {
      throw new Error(`Edit button not found on profile card ${index}`);
    }

    await editBtn.click();

    // Wait for modal to open
    await this.page.waitForSelector(this.selectors.profileModal, { visible: true });
  }

  /**
   * Click "Delete" button on profile card
   */
  async clickDeleteProfile(index: number): Promise<void> {
    const card = await this.getProfileCard(index);
    const deleteBtn = await card.$('.btn-delete');

    if (!deleteBtn) {
      throw new Error(`Delete button not found on profile card ${index}`);
    }

    await deleteBtn.click();

    // Wait for delete confirmation modal
    await this.page.waitForSelector(this.selectors.deleteModal, { visible: true });
  }

  /**
   * Click "Enable/Disable" toggle on profile card
   */
  async clickToggleProfile(index: number): Promise<void> {
    const card = await this.getProfileCard(index);

    // Find the toggle button (text changes between "Enable" and "Disable")
    const toggleBtn = await card.$('button.btn-danger, button.btn-success');

    if (!toggleBtn) {
      throw new Error(`Toggle button not found on profile card ${index}`);
    }

    await toggleBtn.click();

    // Wait for state to update
    await this.page.waitForTimeout(500);
  }

  // ========== PROFILE MODAL ==========

  /**
   * Check if profile modal is open
   */
  async isProfileModalOpen(): Promise<boolean> {
    try {
      await this.page.waitForSelector(this.selectors.profileModal, {
        visible: true,
        timeout: 1000
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fill profile form with data
   */
  async fillProfileForm(data: Partial<ProfileData>): Promise<void> {
    if (data.profileName) {
      await this.page.type(this.selectors.profileName, data.profileName);
    }
    if (data.realName) {
      await this.page.type(this.selectors.realName, data.realName);
    }
    if (data.aliasName) {
      await this.page.type(this.selectors.aliasName, data.aliasName);
    }
    if (data.realEmail) {
      await this.page.type(this.selectors.realEmail, data.realEmail);
    }
    if (data.aliasEmail) {
      await this.page.type(this.selectors.aliasEmail, data.aliasEmail);
    }
    if (data.realPhone) {
      await this.page.type(this.selectors.realPhone, data.realPhone);
    }
    if (data.aliasPhone) {
      await this.page.type(this.selectors.aliasPhone, data.aliasPhone);
    }
    if (data.realAddress) {
      await this.page.type(this.selectors.realAddress, data.realAddress);
    }
    if (data.aliasAddress) {
      await this.page.type(this.selectors.aliasAddress, data.aliasAddress);
    }
  }

  /**
   * Clear a form field
   */
  async clearField(selector: string): Promise<void> {
    const input = await this.page.$(selector);
    if (!input) {
      throw new Error(`Field not found: ${selector}`);
    }

    // Select all and delete
    await input.click({ clickCount: 3 });
    await this.page.keyboard.press('Backspace');
  }

  /**
   * Get form field value
   */
  async getFieldValue(selector: string): Promise<string> {
    return await this.page.$eval(selector, el => (el as HTMLInputElement).value);
  }

  /**
   * Save profile (click Save button)
   */
  async saveProfile(): Promise<void> {
    await this.page.click(this.selectors.modalSave);

    // Wait for modal to close
    await this.page.waitForSelector(this.selectors.profileModal, { hidden: true });
  }

  /**
   * Cancel profile modal
   */
  async cancelProfile(): Promise<void> {
    await this.page.click(this.selectors.modalCancel);

    // Wait for modal to close
    await this.page.waitForSelector(this.selectors.profileModal, { hidden: true });
  }

  // ========== DELETE CONFIRMATION ==========

  /**
   * Confirm profile deletion
   */
  async confirmDelete(): Promise<void> {
    await this.page.waitForSelector(this.selectors.confirmDelete, { visible: true });
    await this.page.click(this.selectors.confirmDelete);

    // Wait for modal to close
    await this.page.waitForSelector(this.selectors.deleteModal, { hidden: true });
  }

  /**
   * Cancel profile deletion
   */
  async cancelDelete(): Promise<void> {
    await this.page.click(this.selectors.cancelDelete);

    // Wait for modal to close
    await this.page.waitForSelector(this.selectors.deleteModal, { hidden: true });
  }

  // ========== MINIMAL MODE ==========

  /**
   * Switch to minimal mode
   */
  async minimizePopup(): Promise<void> {
    await this.page.click(this.selectors.minimizeBtn);

    // Wait for minimal view to appear
    await this.page.waitForSelector(this.selectors.minimalView, { visible: true });
    await this.page.waitForSelector(this.selectors.fullView, { hidden: true });
  }

  /**
   * Expand to full mode
   */
  async expandPopup(): Promise<void> {
    await this.page.click(this.selectors.expandBtn);

    // Wait for full view to appear
    await this.page.waitForSelector(this.selectors.fullView, { visible: true });
    await this.page.waitForSelector(this.selectors.minimalView, { hidden: true });
  }

  /**
   * Check if in minimal mode
   */
  async isMinimalMode(): Promise<boolean> {
    const minimalHidden = await this.page.$eval(
      this.selectors.minimalView,
      el => el.classList.contains('hidden')
    );
    return !minimalHidden;
  }

  // ========== STATUS ==========

  /**
   * Get status indicator text
   */
  async getStatus(): Promise<string> {
    return await this.page.$eval(
      `${this.selectors.statusIndicator} .status-text`,
      el => el.textContent || ''
    );
  }

  /**
   * Check if status is active
   */
  async isActive(): Promise<boolean> {
    const status = await this.getStatus();
    return status.toLowerCase().includes('active');
  }
}

/**
 * ChatGPTPage - Represents the ChatGPT interface
 *
 * Provides methods for interacting with ChatGPT:
 * - Message input
 * - Send button
 * - Request interception
 */
export class ChatGPTPage {
  constructor(private page: Page) {}

  private selectors = {
    textarea: 'textarea[data-id="root"]',
    sendButton: 'button[data-testid="send-button"]',
    messageInput: '#prompt-textarea',
    conversationEndpoint: '/backend-api/conversation'
  };

  /**
   * Wait for ChatGPT to load
   */
  async waitForLoad(): Promise<void> {
    try {
      await this.page.waitForSelector(this.selectors.textarea, {
        visible: true,
        timeout: 15000
      });
    } catch (error) {
      // If textarea not found, might need login
      const bodyText = await this.page.evaluate(() => document.body.textContent);
      if (bodyText?.includes('Sign in') || bodyText?.includes('Log in')) {
        throw new Error('ChatGPT login required - please sign in manually first');
      }
      throw error;
    }
  }

  /**
   * Type a message in the input
   */
  async typeMessage(message: string): Promise<void> {
    await this.page.waitForSelector(this.selectors.textarea, { visible: true });
    await this.page.type(this.selectors.textarea, message);
  }

  /**
   * Click the send button
   */
  async clickSend(): Promise<void> {
    await this.page.waitForSelector(this.selectors.sendButton, { visible: true });
    await this.page.click(this.selectors.sendButton);
  }

  /**
   * Send a message (type + click send)
   */
  async sendMessage(message: string): Promise<void> {
    await this.typeMessage(message);
    await this.clickSend();
  }

  /**
   * Set up request interception to capture conversation requests
   *
   * @returns Promise that resolves with captured request body
   */
  async interceptConversationRequest(): Promise<Promise<any>> {
    await this.page.setRequestInterception(true);

    return new Promise((resolve) => {
      this.page.on('request', (request) => {
        const url = request.url();

        if (url.includes(this.selectors.conversationEndpoint)) {
          try {
            const postData = request.postData();
            if (postData) {
              const body = JSON.parse(postData);
              resolve(body);
            }
          } catch (error) {
            console.error('Failed to parse request body:', error);
          }
        }

        request.continue();
      });
    });
  }
}

/**
 * ClaudePage - Represents the Claude AI interface
 */
export class ClaudePage {
  constructor(private page: Page) {}

  private selectors = {
    messageInput: '[contenteditable="true"]',
    sendButton: 'button[aria-label="Send Message"]',
    conversationEndpoint: '/api/organizations'
  };

  /**
   * Wait for Claude to load
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForSelector(this.selectors.messageInput, {
      visible: true,
      timeout: 15000
    });
  }

  /**
   * Type a message
   */
  async typeMessage(message: string): Promise<void> {
    await this.page.waitForSelector(this.selectors.messageInput, { visible: true });
    await this.page.type(this.selectors.messageInput, message);
  }

  /**
   * Click send
   */
  async clickSend(): Promise<void> {
    await this.page.click(this.selectors.sendButton);
  }

  /**
   * Send a message
   */
  async sendMessage(message: string): Promise<void> {
    await this.typeMessage(message);
    await this.clickSend();
  }
}
