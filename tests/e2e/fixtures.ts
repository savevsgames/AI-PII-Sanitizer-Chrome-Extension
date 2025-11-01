/**
 * Playwright fixtures for Chrome extension testing
 * Provides utilities to load and test the extension in a real browser
 */

import { test as base, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Type definition for our custom fixtures
type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
  page: any; // Override default page fixture
};

/**
 * Custom test fixture that loads the Chrome extension
 * Usage: import { test, expect } from './fixtures';
 */
export const test = base.extend<ExtensionFixtures>({
  // Override context to load extension
  context: async ({}, use) => {
    // Path to the built extension (dist folder)
    const pathToExtension = path.join(__dirname, '../../dist');

    // Create a temporary directory for user data
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-'));

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    await use(context);
    await context.close();

    // Clean up temporary directory
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  },

  // Provide a page from our custom context
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },

  // Extract extension ID from background page
  extensionId: async ({ context }, use) => {
    // Wait for extension to load
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
