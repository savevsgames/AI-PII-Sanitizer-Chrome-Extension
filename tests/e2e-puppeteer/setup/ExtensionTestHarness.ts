/**
 * ExtensionTestHarness - Core test infrastructure for Puppeteer E2E tests
 *
 * Provides stable, production-ready utilities for testing Chrome extensions:
 * - Extension loading with proper service worker detection
 * - Popup opening via chrome.action.openPopup() (not direct navigation)
 * - Profile management helpers
 * - Screenshot capture for debugging
 * - Console log capture
 * - Network request interception helpers
 *
 * @version 1.0.0
 * @author PromptBlocker Team
 */

import puppeteer, { Browser, Page, Target, Worker } from 'puppeteer';
import path from 'path';
import fs from 'fs';

/**
 * Profile data structure for test profiles
 */
export interface ProfileData {
  profileName: string;
  realName: string;
  aliasName: string;
  realEmail: string;
  aliasEmail: string;
  realPhone?: string;
  aliasPhone?: string;
  realAddress?: string;
  aliasAddress?: string;
  realCompany?: string;
  aliasCompany?: string;
}

/**
 * Test harness configuration options
 */
export interface HarnessConfig {
  headless?: boolean;
  devtools?: boolean;
  slowMo?: number;
  captureConsole?: boolean;
  captureNetwork?: boolean;
}

/**
 * Network request capture data
 */
export interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  timestamp: number;
}

/**
 * Console log capture data
 */
export interface CapturedLog {
  type: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text: string;
  timestamp: number;
  args: any[];
}

/**
 * ExtensionTestHarness - Main test harness class
 *
 * Usage:
 * ```typescript
 * const harness = new ExtensionTestHarness();
 * await harness.setup();
 * const popupPage = await harness.openPopup();
 * // ... run tests ...
 * await harness.cleanup();
 * ```
 */
export class ExtensionTestHarness {
  // Core properties
  browser: Browser | null = null;
  extensionId: string = '';
  worker: Worker | null = null;

  // Configuration
  private config: HarnessConfig;

  // Captured data for debugging
  private capturedRequests: CapturedRequest[] = [];
  private capturedLogs: CapturedLog[] = [];
  private screenshotCounter: number = 0;

  // Paths
  private readonly extensionPath: string;
  private readonly screenshotDir: string;

  /**
   * Constructor
   * @param config Optional configuration
   */
  constructor(config: HarnessConfig = {}) {
    this.config = {
      headless: false, // Extensions require non-headless mode
      devtools: false,
      slowMo: 0,
      captureConsole: true,
      captureNetwork: true,
      ...config
    };

    this.extensionPath = path.join(__dirname, '../../../dist');
    this.screenshotDir = path.join(__dirname, '../screenshots');

    // Ensure screenshot directory exists
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  /**
   * Setup: Launch browser with extension loaded
   *
   * This is the critical first step:
   * 1. Verify extension is built (dist/ folder exists)
   * 2. Launch browser with extension loading flags
   * 3. Wait for service worker to initialize
   * 4. Extract and validate extension ID
   *
   * @throws Error if extension not built or service worker fails to load
   */
  async setup(): Promise<void> {
    console.log('[Harness] 🚀 Starting setup...');

    // Verify extension is built
    if (!fs.existsSync(this.extensionPath)) {
      throw new Error(
        `❌ Extension not built! Run 'npm run build' first.\n` +
        `Looking for: ${this.extensionPath}\n` +
        `Current directory: ${process.cwd()}`
      );
    }

    // Verify manifest.json exists
    const manifestPath = path.join(this.extensionPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(
        `❌ manifest.json not found in dist folder!\n` +
        `Expected: ${manifestPath}`
      );
    }

    console.log(`[Harness] ✅ Extension found at: ${this.extensionPath}`);

    // Launch browser with extension
    console.log('[Harness] 🌐 Launching browser with extension...');

    try {
      this.browser = await puppeteer.launch({
        headless: this.config.headless, // false for extensions
        devtools: this.config.devtools,
        slowMo: this.config.slowMo,
        args: [
          // Extension loading flags (CRITICAL)
          `--disable-extensions-except=${this.extensionPath}`,
          `--load-extension=${this.extensionPath}`,

          // Security flags
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',

          // Anti-detection
          '--disable-blink-features=AutomationControlled',

          // Window size
          '--window-size=1280,720',

          // Performance
          '--disable-gpu',
          '--disable-software-rasterizer'
        ],
        defaultViewport: null,
        ignoreDefaultArgs: ['--disable-extensions']
      });

      console.log('[Harness] ✅ Browser launched successfully');

    } catch (error) {
      throw new Error(
        `❌ Failed to launch browser: ${error}\n` +
        `Make sure Chrome/Chromium is installed.`
      );
    }

    // Wait for service worker to load (CRITICAL)
    console.log('[Harness] ⏳ Waiting for service worker...');

    try {
      const serviceWorkerTarget = await this.browser.waitForTarget(
        (target: Target) => {
          const isServiceWorker = target.type() === 'service_worker';
          const isOurExtension = target.url().endsWith('background.js');

          if (isServiceWorker && isOurExtension) {
            console.log(`[Harness] 📍 Found service worker: ${target.url()}`);
            return true;
          }
          return false;
        },
        { timeout: 15000 } // 15 seconds max
      );

      // Get worker from service worker target
      this.worker = (await serviceWorkerTarget.worker()) as Worker;
      this.extensionId = serviceWorkerTarget.url().split('/')[2];

      console.log(`[Harness] ✅ Service worker loaded`);
      console.log(`[Harness] 🆔 Extension ID: ${this.extensionId}`);

    } catch (error) {
      // Provide helpful debugging information
      const targets = await this.browser.targets();
      const targetInfo = targets.map(t =>
        `  - ${t.type()}: ${t.url()}`
      ).join('\n');

      throw new Error(
        `❌ Service worker failed to load within 15 seconds.\n` +
        `This usually means:\n` +
        `  1. Extension has errors (check manifest.json)\n` +
        `  2. Background script failed to initialize\n` +
        `  3. Extension was not loaded properly\n\n` +
        `Available targets:\n${targetInfo}\n\n` +
        `Original error: ${error}`
      );
    }

    // Validate extension ID format (should be 32 lowercase letters)
    if (!/^[a-z]{32}$/.test(this.extensionId)) {
      throw new Error(
        `❌ Invalid extension ID format: "${this.extensionId}"\n` +
        `Expected: 32 lowercase letters (e.g., "abcdefghijklmnopqrstuvwxyzabcdef")`
      );
    }

    console.log('[Harness] ✅ Setup complete!');
    console.log('[Harness] ═══════════════════════════════════════');
  }

  /**
   * Open extension popup programmatically
   *
   * This is the CORRECT way to open popups in Puppeteer:
   * - Use chrome.action.openPopup() via service worker
   * - Wait for popup page target to appear
   * - Return the popup page for testing
   *
   * Do NOT navigate directly to chrome-extension://id/popup.html
   * as this causes the popup to close immediately.
   *
   * @returns Promise<Page> The popup page
   * @throws Error if popup fails to open
   */
  async openPopup(): Promise<Page> {
    if (!this.browser || !this.worker) {
      throw new Error('❌ Setup must be called first!');
    }

    console.log('[Harness] 🪟 Opening popup...');

    try {
      // Trigger popup via service worker (CRITICAL METHOD)
      await this.worker.evaluate('chrome.action.openPopup();');

      console.log('[Harness] ✅ Popup trigger sent');

    } catch (error) {
      throw new Error(
        `❌ Failed to trigger popup: ${error}\n` +
        `This might indicate a service worker issue.`
      );
    }

    // Wait for popup page to appear
    console.log('[Harness] ⏳ Waiting for popup page...');

    try {
      const popupTarget = await this.browser.waitForTarget(
        (target: Target) => {
          const isPage = target.type() === 'page';
          const isPopup = target.url().includes('popup-v2.html');

          if (isPage && isPopup) {
            console.log(`[Harness] 📍 Found popup page: ${target.url()}`);
            return true;
          }
          return false;
        },
        { timeout: 10000 } // 10 seconds max
      );

      const popupPage = await popupTarget.page();
      if (!popupPage) {
        throw new Error('❌ Failed to get popup page instance');
      }

      console.log('[Harness] ✅ Popup page acquired');

    } catch (error) {
      throw new Error(
        `❌ Popup page failed to appear within 10 seconds.\n` +
        `This usually means:\n` +
        `  1. popup-v2.html not found in extension\n` +
        `  2. Popup has JavaScript errors\n` +
        `  3. Popup was blocked by browser\n\n` +
        `Original error: ${error}`
      );
    }

    // Wait for app to initialize
    console.log('[Harness] ⏳ Waiting for app initialization...');

    try {
      await popupPage.waitForSelector('#app', {
        visible: true,
        timeout: 10000
      });

      console.log('[Harness] ✅ App initialized (#app element visible)');

    } catch (error) {
      // Take screenshot for debugging
      await this.captureScreenshot(popupPage, 'popup-initialization-failed');

      throw new Error(
        `❌ App failed to initialize within 10 seconds.\n` +
        `#app element not found or not visible.\n` +
        `Screenshot saved to: screenshots/\n\n` +
        `Original error: ${error}`
      );
    }

    // Set up console logging if enabled
    if (this.config.captureConsole) {
      popupPage.on('console', (msg) => {
        const type = msg.type() as any;
        const text = msg.text();

        this.capturedLogs.push({
          type,
          text,
          timestamp: Date.now(),
          args: msg.args()
        });

        // Log errors and warnings to console for visibility
        if (type === 'error' || type === 'warning') {
          console.log(`[Popup ${type.toUpperCase()}]`, text);
        }
      });

      // Capture page errors
      popupPage.on('pageerror', (error) => {
        console.error('[Popup PAGE ERROR]', error.message);
        this.capturedLogs.push({
          type: 'error',
          text: `PAGE ERROR: ${error.message}`,
          timestamp: Date.now(),
          args: []
        });
      });
    }

    console.log('[Harness] ✅ Popup ready for testing!');
    console.log('[Harness] ═══════════════════════════════════════');

    return popupPage;
  }

  /**
   * Create a test profile via popup UI
   *
   * This is a high-level helper that:
   * 1. Clicks "New Profile" button
   * 2. Waits for modal to open
   * 3. Fills form fields
   * 4. Saves profile
   * 5. Verifies profile was created
   *
   * @param popupPage The popup page
   * @param data Profile data to create
   * @throws Error if profile creation fails
   */
  async createTestProfile(
    popupPage: Page,
    data: ProfileData
  ): Promise<void> {
    console.log(`[Harness] 👤 Creating profile: "${data.profileName}"`);

    // Click "New Profile" button
    try {
      await popupPage.waitForSelector('#addProfileBtn', {
        visible: true,
        timeout: 5000
      });
      await popupPage.click('#addProfileBtn');
      console.log('[Harness] ✅ Clicked "New Profile" button');
    } catch (error) {
      await this.captureScreenshot(popupPage, 'add-profile-btn-not-found');
      throw new Error(
        `❌ Failed to find or click "New Profile" button.\n` +
        `Selector: #addProfileBtn\n` +
        `Screenshot saved.\n\n` +
        `Original error: ${error}`
      );
    }

    // Wait for modal to open
    try {
      await popupPage.waitForSelector('#profileModal', {
        visible: true,
        timeout: 5000
      });
      console.log('[Harness] ✅ Profile modal opened');
    } catch (error) {
      await this.captureScreenshot(popupPage, 'profile-modal-not-visible');
      throw new Error(
        `❌ Profile modal failed to open.\n` +
        `Selector: #profileModal\n` +
        `Screenshot saved.\n\n` +
        `Original error: ${error}`
      );
    }

    // Fill form fields (REQUIRED FIELDS)
    console.log('[Harness] ✍️  Filling form fields...');

    try {
      // Profile name (required)
      await popupPage.type('#profileName', data.profileName);

      // Real name (required)
      await popupPage.type('#realName', data.realName);

      // Alias name (required)
      await popupPage.type('#aliasName', data.aliasName);

      // Real email (required)
      await popupPage.type('#realEmail', data.realEmail);

      // Alias email (required)
      await popupPage.type('#aliasEmail', data.aliasEmail);

      // Optional fields
      if (data.realPhone) {
        await popupPage.type('#realPhone', data.realPhone);
      }
      if (data.aliasPhone) {
        await popupPage.type('#aliasPhone', data.aliasPhone);
      }
      if (data.realAddress) {
        await popupPage.type('#realAddress', data.realAddress);
      }
      if (data.aliasAddress) {
        await popupPage.type('#aliasAddress', data.aliasAddress);
      }
      if (data.realCompany) {
        await popupPage.type('#realCompany', data.realCompany);
      }
      if (data.aliasCompany) {
        await popupPage.type('#aliasCompany', data.aliasCompany);
      }

      console.log('[Harness] ✅ Form fields filled');

    } catch (error) {
      await this.captureScreenshot(popupPage, 'form-fill-failed');
      throw new Error(
        `❌ Failed to fill form fields.\n` +
        `Make sure all field selectors are correct.\n` +
        `Screenshot saved.\n\n` +
        `Original error: ${error}`
      );
    }

    // Save profile
    try {
      await popupPage.click('#modalSave');
      console.log('[Harness] ✅ Clicked "Save" button');
    } catch (error) {
      await this.captureScreenshot(popupPage, 'save-button-not-found');
      throw new Error(
        `❌ Failed to click "Save" button.\n` +
        `Selector: #modalSave\n` +
        `Screenshot saved.\n\n` +
        `Original error: ${error}`
      );
    }

    // Wait for modal to close
    try {
      await popupPage.waitForSelector('#profileModal', {
        hidden: true,
        timeout: 5000
      });
      console.log('[Harness] ✅ Profile modal closed');
    } catch (error) {
      await this.captureScreenshot(popupPage, 'modal-did-not-close');
      throw new Error(
        `❌ Profile modal did not close after save.\n` +
        `This might indicate a validation error.\n` +
        `Screenshot saved.\n\n` +
        `Original error: ${error}`
      );
    }

    // Verify profile card appears
    try {
      await popupPage.waitForSelector('.profile-card', {
        visible: true,
        timeout: 5000
      });
      console.log('[Harness] ✅ Profile card appeared');
    } catch (error) {
      await this.captureScreenshot(popupPage, 'profile-card-not-found');
      throw new Error(
        `❌ Profile card did not appear after save.\n` +
        `Selector: .profile-card\n` +
        `Screenshot saved.\n\n` +
        `Original error: ${error}`
      );
    }

    // Wait a moment for state to settle
    await popupPage.waitForTimeout(500);

    console.log('[Harness] ✅ Profile created successfully!');
    console.log('[Harness] ═══════════════════════════════════════');
  }

  /**
   * Navigate to ChatGPT with extension active
   *
   * @returns Promise<Page> The ChatGPT page
   */
  async openChatGPT(): Promise<Page> {
    if (!this.browser) {
      throw new Error('❌ Setup must be called first!');
    }

    console.log('[Harness] 🤖 Opening ChatGPT...');
    const page = await this.browser.newPage();

    // Set up console logging if enabled
    if (this.config.captureConsole) {
      page.on('console', (msg) => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
          console.log(`[ChatGPT ${type.toUpperCase()}]`, msg.text());
        }
      });
    }

    try {
      await page.goto('https://chat.openai.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      console.log('[Harness] ✅ ChatGPT loaded');
    } catch (error) {
      await this.captureScreenshot(page, 'chatgpt-load-failed');
      throw new Error(
        `❌ Failed to load ChatGPT: ${error}\n` +
        `Screenshot saved.`
      );
    }

    return page;
  }

  /**
   * Capture screenshot for debugging
   *
   * Saves screenshot to screenshots/ directory with timestamp and name.
   *
   * @param page The page to capture
   * @param name Descriptive name for the screenshot
   * @returns Promise<string> Path to saved screenshot
   */
  async captureScreenshot(
    page: Page,
    name: string
  ): Promise<string> {
    const timestamp = Date.now();
    const filename = `${timestamp}-${name}.png`;
    const filepath = path.join(this.screenshotDir, filename);

    try {
      await page.screenshot({
        path: filepath,
        fullPage: true
      });

      console.log(`[Harness] 📸 Screenshot saved: ${filename}`);
      return filepath;
    } catch (error) {
      console.error(`[Harness] ❌ Failed to capture screenshot: ${error}`);
      return '';
    }
  }

  /**
   * Get all captured console logs
   *
   * Useful for debugging test failures.
   *
   * @returns CapturedLog[] Array of captured logs
   */
  getCapturedLogs(): CapturedLog[] {
    return [...this.capturedLogs];
  }

  /**
   * Get captured logs filtered by type
   *
   * @param type Log type to filter by
   * @returns CapturedLog[] Filtered logs
   */
  getLogsByType(type: CapturedLog['type']): CapturedLog[] {
    return this.capturedLogs.filter(log => log.type === type);
  }

  /**
   * Get all error logs
   *
   * @returns CapturedLog[] Error logs
   */
  getErrorLogs(): CapturedLog[] {
    return this.getLogsByType('error');
  }

  /**
   * Check if any errors were logged
   *
   * @returns boolean True if errors exist
   */
  hasErrors(): boolean {
    return this.getErrorLogs().length > 0;
  }

  /**
   * Get all open pages (for debugging)
   *
   * @returns Promise<Page[]> Array of all pages
   */
  async getAllPages(): Promise<Page[]> {
    if (!this.browser) return [];
    return this.browser.pages();
  }

  /**
   * Get all browser targets (for debugging)
   *
   * @returns Promise<Target[]> Array of all targets
   */
  async getAllTargets(): Promise<Target[]> {
    if (!this.browser) return [];
    return this.browser.targets();
  }

  /**
   * Clean up: Close browser and release resources
   *
   * IMPORTANT: Always call this in afterAll() to prevent resource leaks.
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      console.log('[Harness] 🧹 Cleaning up...');

      try {
        await this.browser.close();
        this.browser = null;
        this.worker = null;
        this.extensionId = '';

        console.log('[Harness] ✅ Browser closed');
        console.log('[Harness] ═══════════════════════════════════════');
      } catch (error) {
        console.error('[Harness] ⚠️  Failed to close browser:', error);
      }
    }
  }
}
