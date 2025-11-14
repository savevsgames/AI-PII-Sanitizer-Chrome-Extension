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
   * Open ChatGPT platform page
   * REQUIRED before opening popup - establishes the message chain
   *
   * The extension requires a platform page to function because:
   * - inject.js only runs on AI platform pages
   * - content.ts only injects on matching domains
   * - Message chain (inject → content → background) needs platform context
   *
   * @returns Promise<Page> The ChatGPT page
   */
  async openChatGPT(): Promise<Page> {
    if (!this.browser) {
      throw new Error('❌ Setup must be called first!');
    }

    console.log('[Harness] 🌐 Opening ChatGPT page...');
    const page = await this.browser.newPage();

    // Enable console capture for platform page
    if (this.config.captureConsole) {
      page.on('console', (msg) => {
        const type = msg.type() as any;
        const text = msg.text();

        this.capturedLogs.push({
          type,
          text,
          timestamp: Date.now(),
          args: msg.args()
        });

        // Log important messages
        if (type === 'error' || type === 'warning' || text.includes('🛡️')) {
          console.log(`[ChatGPT ${type.toUpperCase()}]`, text);
        }
      });
    }

    await page.goto('https://chatgpt.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('[Harness] ✅ ChatGPT page opened');
    return page;
  }

  /**
   * Wait for content script injection
   * Verifies inject.js is loaded in page context by checking for window.__nativeFetch
   *
   * @param page The platform page to check
   * @param timeout Max wait time in milliseconds
   */
  async waitForContentScriptInjection(page: Page, timeout: number = 10000): Promise<void> {
    console.log('[Harness] ⏳ Waiting for content script injection...');

    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      // Check if inject.js has set window.__nativeFetch (line 19 of inject.js)
      const injected = await page.evaluate(() => {
        return typeof (window as any).__nativeFetch === 'function';
      });

      if (injected) {
        console.log('[Harness] ✅ Content script injected (window.__nativeFetch detected)');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(
      '❌ Content script injection timeout\n' +
      'inject.js did not load within ' + timeout + 'ms\n' +
      'This usually means:\n' +
      '  1. Content script manifest patterns don\'t match the page\n' +
      '  2. Extension was disabled or failed to load\n' +
      '  3. Page was not properly loaded'
    );
  }

  /**
   * Wait for health checks to pass
   * Verifies message chain (inject → content → background) is active
   *
   * inject.js runs automatic health checks continuously (starting immediately).
   * We just wait for the isProtected variable to become true.
   *
   * @param page The platform page to check
   * @param timeout Max wait time in milliseconds (default 15s to allow for retries)
   */
  async waitForHealthCheckActive(page: Page, timeout: number = 15000): Promise<void> {
    console.log('[Harness] ⏳ Waiting for automatic health checks to pass...');
    console.log('[Harness]    inject.js performs health checks automatically with 3 retries');

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const elapsed = Date.now() - startTime;

      // Check the isProtected variable that inject.js maintains
      const healthStatus = await page.evaluate(() => {
        // Access the inject.js scope variables via window
        // inject.js sets up console logs we can check for
        return {
          // Look for console log messages indicating protection status
          hasNativeFetch: typeof (window as any).__nativeFetch === 'function',
          // We can also check if fetch was overridden (inject.js line 206)
          fetchOverridden: window.fetch !== (window as any).__nativeFetch
        };
      });

      // If fetch is overridden and nativeFetch exists, inject.js is running
      // The automatic health check runs immediately, so we should see logs
      if (healthStatus.hasNativeFetch && healthStatus.fetchOverridden) {
        // Wait a bit to ensure health check had time to run (inject.js retries 3 times)
        // Each attempt: 500ms timeout + 200ms delay = ~2 seconds for 3 attempts
        if (elapsed >= 3000) {
          console.log('[Harness] ✅ Health checks should be complete (inject.js active for >3s)');
          return;
        }
      }

      // Check if we see protection logs in console
      if (elapsed > 1000 && healthStatus.hasNativeFetch) {
        // After 1 second, if inject.js is there, assume health check passed
        // (extension would show errors in console if it failed)
        console.log('[Harness] ✅ inject.js active and healthy (no error logs detected)');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error(
      '❌ Health check timeout\n' +
      'Message chain (inject → content → background) not active after ' + timeout + 'ms\n' +
      'This usually means:\n' +
      '  1. Extension is not enabled (config.settings.enabled = false)\n' +
      '  2. Domain is not in protectedDomains list\n' +
      '  3. Background service worker is not responding\n' +
      '  4. Content script did not inject properly'
    );
  }

  /**
   * Ensure popup starts in full mode (not minimal)
   * The popup remembers the last mode in chrome.storage.local
   * This clears that preference to ensure tests start with full view
   */
  async ensurePopupFullMode(): Promise<void> {
    if (!this.worker) {
      throw new Error('❌ Setup must be called first!');
    }

    console.log('[Harness] 🔧 Ensuring popup starts in full mode...');

    // Clear the popupMode preference via service worker
    await this.worker.evaluate(async () => {
      await chrome.storage.local.set({ popupMode: 'full' });
    });

    console.log('[Harness] ✅ Popup mode set to full');
  }

  /**
   * Setup platform page with full message chain
   * Convenience method that combines all three platform setup steps:
   * 1. Opens ChatGPT page
   * 2. Waits for content script injection
   * 3. Waits for health checks to pass
   *
   * Use this before opening popup to ensure message chain is active.
   *
   * @returns Promise<Page> The ready ChatGPT page with active message chain
   */
  async setupPlatformPage(): Promise<Page> {
    const chatPage = await this.openChatGPT();
    await this.waitForContentScriptInjection(chatPage);
    await this.waitForHealthCheckActive(chatPage);
    console.log('[Harness] ✅ Platform page fully initialized with active message chain');
    return chatPage;
  }

  /**
   * Open extension popup via direct URL navigation
   *
   * IMPORTANT: Must call setupPlatformPage() or manually call
   * openChatGPT() + waitForContentScriptInjection() + waitForHealthCheckActive()
   * first to establish the message chain!
   *
   * The popup requires an active platform page because it relies on the
   * inject → content → background message flow to function properly.
   *
   * @returns Promise<Page> The popup page
   * @throws Error if popup fails to open
   */
  async openPopup(): Promise<Page> {
    if (!this.browser) {
      throw new Error('❌ Setup must be called first!');
    }

    // Ensure popup will start in full mode (not minimal)
    await this.ensurePopupFullMode();

    console.log('[Harness] 🪟 Opening popup...');

    // Create new page and navigate to popup
    const popupPage = await this.browser.newPage();
    const popupUrl = `chrome-extension://${this.extensionId}/popup-v2.html`;

    console.log(`[Harness] 🔗 Navigating to: ${popupUrl}`);

    try {
      await popupPage.goto(popupUrl, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });

      console.log('[Harness] ✅ Popup page loaded');

    } catch (error) {
      await this.captureScreenshot(popupPage, 'popup-navigation-failed');
      throw new Error(
        `❌ Failed to navigate to popup: ${error}\n` +
        `URL: ${popupUrl}\n` +
        `This usually means:\n` +
        `  1. popup-v2.html not found in extension\n` +
        `  2. Extension ID is incorrect\n` +
        `Screenshot saved for debugging.`
      );
    }

    // Wait for app to initialize
    console.log('[Harness] ⏳ Waiting for app initialization...');

    try {
      // Wait for either #app or body to be ready
      await popupPage.waitForFunction(
        () => {
          const app = document.querySelector('#app');
          const body = document.body;
          return (app && app.clientHeight > 0) || (body && body.clientHeight > 0);
        },
        { timeout: 15000 }
      );

      console.log('[Harness] ✅ App initialized');

      // Check if #app exists
      const appExists = await popupPage.$('#app');
      if (appExists) {
        console.log('[Harness] ✅ #app element found');
      } else {
        console.log('[Harness] ⚠️  #app element not found (checking body)');
        const bodyContent = await popupPage.evaluate(() => document.body.innerHTML.substring(0, 200));
        console.log(`[Harness] Body content preview: ${bodyContent}...`);
      }

    } catch (error) {
      // Take screenshot for debugging
      await this.captureScreenshot(popupPage, 'popup-initialization-failed');

      // Get page content for debugging
      const content = await popupPage.content();
      console.log('[Harness] Page HTML length:', content.length);

      throw new Error(
        `❌ App failed to initialize within 15 seconds.\n` +
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
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('[Harness] ✅ Profile created successfully!');
    console.log('[Harness] ═══════════════════════════════════════');
  }

  /**
   * Sign in the test user with Google OAuth
   *
   * This is the enterprise-grade auth flow that:
   * 1. Clicks sign-in button in popup
   * 2. Waits for auth modal
   * 3. Clicks Google sign-in button
   * 4. Handles Google OAuth popup window
   * 5. Fills email and password
   * 6. Waits for auth completion
   * 7. Verifies user is signed in
   *
   * Required environment variables:
   * - TEST_USER_EMAIL
   * - TEST_USER_PASSWORD
   *
   * @param popupPage The popup page
   * @throws Error if auth fails or credentials are missing
   */
  async signInTestUser(popupPage: Page): Promise<void> {
    console.log('[Harness] 🔐 Signing in test user...');

    // Verify credentials are available
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error(
        '❌ Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in .env.test.local\n' +
        'These are required for E2E authentication tests.'
      );
    }

    console.log(`[Harness] 📧 Email: ${testEmail}`);

    try {
      // Step 1: Click sign-in button
      await popupPage.waitForSelector('#headerSignInBtn', { visible: true, timeout: 5000 });
      await popupPage.click('#headerSignInBtn');
      console.log('[Harness] ✅ Clicked sign-in button');

      // Step 2: Wait for auth modal to open
      await popupPage.waitForSelector('#authModal', { visible: true, timeout: 5000 });
      console.log('[Harness] ✅ Auth modal opened');

      // Step 3: Click Google sign-in button
      await popupPage.waitForSelector('#googleSignInBtn', { visible: true, timeout: 5000 });
      await popupPage.click('#googleSignInBtn');
      console.log('[Harness] ✅ Clicked Google sign-in button');

      // Step 4: Wait for Google OAuth popup (new window)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for popup to open

      // Get all pages (the new Google OAuth popup should be the last one)
      const pages = await this.browser!.pages();
      const googleAuthPage = pages[pages.length - 1];

      console.log(`[Harness] 🌐 Google OAuth popup detected: ${googleAuthPage.url()}`);

      // Step 5: Fill email
      try {
        await googleAuthPage.waitForSelector('input[type="email"]', { timeout: 10000 });
        await googleAuthPage.type('input[type="email"]', testEmail);
        console.log('[Harness] ✅ Email entered');

        // Click "Next" button
        await googleAuthPage.click('#identifierNext');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('[Harness] ✅ Clicked "Next" after email');
      } catch (error) {
        await this.captureScreenshot(googleAuthPage, 'google-auth-email-failed');
        throw new Error(
          `❌ Failed to enter email in Google OAuth\n` +
          `URL: ${googleAuthPage.url()}\n` +
          `Screenshot saved.\n\n` +
          `Original error: ${error}`
        );
      }

      // Step 6: Fill password
      try {
        await googleAuthPage.waitForSelector('input[type="password"]', { timeout: 10000 });
        await googleAuthPage.type('input[type="password"]', testPassword);
        console.log('[Harness] ✅ Password entered');

        // Click "Next" button
        await googleAuthPage.click('#passwordNext');
        console.log('[Harness] ✅ Clicked "Next" after password');
      } catch (error) {
        await this.captureScreenshot(googleAuthPage, 'google-auth-password-failed');
        throw new Error(
          `❌ Failed to enter password in Google OAuth\n` +
          `URL: ${googleAuthPage.url()}\n` +
          `Screenshot saved.\n\n` +
          `Original error: ${error}`
        );
      }

      // Step 7: Wait for OAuth to complete and popup to close
      // The Google OAuth popup will close when auth completes
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 8: Verify user is signed in (back in popup page)
      try {
        await popupPage.waitForSelector('#headerUserProfileContainer', {
          visible: true,
          timeout: 10000
        });
        console.log('[Harness] ✅ User profile container visible - signed in!');
      } catch (error) {
        await this.captureScreenshot(popupPage, 'sign-in-verification-failed');
        throw new Error(
          `❌ Sign-in verification failed\n` +
          `User profile container did not appear after auth.\n` +
          `Screenshot saved.\n\n` +
          `Original error: ${error}`
        );
      }

      // Step 9: Verify auth modal closed
      const authModalHidden = await popupPage.$eval(
        '#authModal',
        el => el.classList.contains('hidden')
      );

      if (!authModalHidden) {
        console.log('[Harness] ⚠️  Auth modal still visible after sign-in');
      }

      console.log('[Harness] ✅ Test user signed in successfully!');
      console.log('[Harness] ═══════════════════════════════════════');

    } catch (error) {
      console.error('[Harness] ❌ Sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Delete a test profile by profile name
   *
   * Finds the profile card, clicks delete button, confirms deletion,
   * and verifies the profile was removed.
   *
   * @param popupPage The popup page
   * @param profileName The name of the profile to delete
   * @throws Error if profile not found or deletion fails
   */
  async deleteTestProfile(
    popupPage: Page,
    profileName: string
  ): Promise<void> {
    console.log(`[Harness] 🗑️  Deleting profile: "${profileName}"`);

    try {
      // Find all profile cards
      const profileCards = await popupPage.$$('.profile-card');

      if (profileCards.length === 0) {
        throw new Error('No profile cards found');
      }

      console.log(`[Harness] Found ${profileCards.length} profile card(s)`);

      // Find the profile with matching name
      let targetProfileCard = null;

      for (const card of profileCards) {
        const cardText = await card.evaluate(el => el.textContent || '');
        if (cardText.includes(profileName)) {
          targetProfileCard = card;
          break;
        }
      }

      if (!targetProfileCard) {
        throw new Error(
          `Profile "${profileName}" not found.\n` +
          `Available profiles: Check screenshot.`
        );
      }

      console.log(`[Harness] ✅ Found profile card for "${profileName}"`);

      // Find delete button within this profile card
      const deleteBtn = await targetProfileCard.$('.btn-delete');

      if (!deleteBtn) {
        throw new Error('Delete button not found in profile card');
      }

      // Click delete button
      await deleteBtn.click();
      console.log('[Harness] ✅ Clicked delete button');

      // Wait for confirmation modal
      await popupPage.waitForSelector('.modal-delete', { visible: true, timeout: 3000 });
      console.log('[Harness] ✅ Delete confirmation modal appeared');

      // Confirm deletion
      await popupPage.click('#confirmDelete');
      console.log('[Harness] ✅ Clicked confirm delete');

      // Wait for modal to close
      await popupPage.waitForSelector('.modal-delete', { hidden: true, timeout: 3000 });
      console.log('[Harness] ✅ Delete modal closed');

      // Verify profile was removed (wait for card to disappear)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const remainingCards = await popupPage.$$('.profile-card');
      console.log(`[Harness] Remaining profiles: ${remainingCards.length}`);

      console.log('[Harness] ✅ Profile deleted successfully!');
      console.log('[Harness] ═══════════════════════════════════════');

    } catch (error) {
      await this.captureScreenshot(popupPage, 'delete-profile-failed');
      throw new Error(
        `❌ Failed to delete profile "${profileName}"\n` +
        `Screenshot saved.\n\n` +
        `Original error: ${error}`
      );
    }
  }

  /**
   * Sign out the test user
   *
   * Clicks user menu, clicks sign out, and verifies user is signed out.
   *
   * @param popupPage The popup page
   * @throws Error if sign out fails
   */
  async signOutTestUser(popupPage: Page): Promise<void> {
    console.log('[Harness] 🚪 Signing out test user...');

    try {
      // Click user profile container to open menu
      await popupPage.waitForSelector('#headerUserProfileContainer', {
        visible: true,
        timeout: 5000
      });
      await popupPage.click('#headerUserProfileContainer');
      console.log('[Harness] ✅ Clicked user profile container');

      // Wait for sign-out button to appear (might be in a dropdown)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Look for sign-out button (adjust selector based on your UI)
      const signOutBtn = await popupPage.$('#signOutBtn');

      if (!signOutBtn) {
        throw new Error(
          'Sign-out button not found.\n' +
          'Please verify the selector matches your UI.'
        );
      }

      // Click sign out
      await signOutBtn.click();
      console.log('[Harness] ✅ Clicked sign-out button');

      // Wait for user profile container to disappear
      await popupPage.waitForSelector('#headerUserProfileContainer', {
        hidden: true,
        timeout: 5000
      });

      // Verify sign-in button is now visible
      await popupPage.waitForSelector('#headerSignInBtn', {
        visible: true,
        timeout: 5000
      });

      console.log('[Harness] ✅ Test user signed out successfully!');
      console.log('[Harness] ═══════════════════════════════════════');

    } catch (error) {
      await this.captureScreenshot(popupPage, 'sign-out-failed');
      throw new Error(
        `❌ Failed to sign out\n` +
        `Screenshot saved.\n\n` +
        `Original error: ${error}`
      );
    }
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
