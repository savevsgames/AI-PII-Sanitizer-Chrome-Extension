/**
 * Playwright fixtures for Chrome extension testing
 * Provides utilities to load and test the extension in a real browser
 */

import { test as base, chromium, BrowserContext } from '@playwright/test';
import path from 'path';

// Type definition for our custom fixtures
type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
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

    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
      ],
    });

    await use(context);
    await context.close();
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
