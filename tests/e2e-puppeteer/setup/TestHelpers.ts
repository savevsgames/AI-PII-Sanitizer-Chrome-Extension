/**
 * Test Helper Functions
 *
 * Utility functions for common test operations:
 * - Waiting strategies
 * - Form filling
 * - Request verification
 * - Data generation
 * - Assertions
 *
 * @version 1.0.0
 * @author PromptBlocker Team
 */

import { Page, ElementHandle } from 'puppeteer';
import { ProfileData } from './ExtensionTestHarness';

/**
 * Wait for an element to be visible with custom timeout
 *
 * @param page The page to wait on
 * @param selector CSS selector
 * @param timeout Timeout in milliseconds (default: 5000)
 * @returns Promise<ElementHandle> The element
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<ElementHandle> {
  await page.waitForSelector(selector, {
    visible: true,
    timeout
  });

  const element = await page.$(selector);
  if (!element) {
    throw new Error(`Element found but not accessible: ${selector}`);
  }

  return element;
}

/**
 * Wait for an element to disappear
 *
 * @param page The page to wait on
 * @param selector CSS selector
 * @param timeout Timeout in milliseconds (default: 5000)
 */
export async function waitForElementToDisappear(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForSelector(selector, {
    hidden: true,
    timeout
  });
}

/**
 * Wait for text content to appear in an element
 *
 * @param page The page to wait on
 * @param selector CSS selector
 * @param text Text to wait for
 * @param timeout Timeout in milliseconds (default: 5000)
 */
export async function waitForText(
  page: Page,
  selector: string,
  text: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForFunction(
    (sel, txt) => {
      const element = document.querySelector(sel);
      return element?.textContent?.includes(txt) || false;
    },
    { timeout },
    selector,
    text
  );
}

/**
 * Wait for network idle
 *
 * Useful after triggering actions that cause network requests.
 *
 * @param page The page to wait on
 * @param timeout Timeout in milliseconds (default: 5000)
 * @param maxInflightRequests Maximum in-flight requests to consider idle (default: 0)
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number = 5000,
  maxInflightRequests: number = 0
): Promise<void> {
  await page.waitForNetworkIdle({
    idleTime: 500,
    timeout
  });
}

/**
 * Fill a form field, clearing it first
 *
 * @param page The page
 * @param selector Field selector
 * @param value Value to type
 */
export async function fillField(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  await page.waitForSelector(selector, { visible: true });

  // Clear field first
  await page.click(selector, { clickCount: 3 }); // Select all
  await page.keyboard.press('Backspace');

  // Type new value
  await page.type(selector, value);
}

/**
 * Fill multiple form fields from an object
 *
 * @param page The page
 * @param fields Map of selector -> value
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string>
): Promise<void> {
  for (const [selector, value] of Object.entries(fields)) {
    if (value) { // Skip empty values
      await fillField(page, selector, value);
    }
  }
}

/**
 * Click element with retry logic
 *
 * Retries click if it fails (element might be temporarily obscured).
 *
 * @param page The page
 * @param selector Element selector
 * @param retries Number of retries (default: 3)
 * @param retryDelay Delay between retries in ms (default: 500)
 */
export async function clickWithRetry(
  page: Page,
  selector: string,
  retries: number = 3,
  retryDelay: number = 500
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { visible: true, timeout: 5000 });
      await page.click(selector);
      return; // Success
    } catch (error) {
      if (i === retries - 1) {
        throw new Error(
          `Failed to click ${selector} after ${retries} attempts: ${error}`
        );
      }
      await page.waitForTimeout(retryDelay);
    }
  }
}

/**
 * Get text content of an element
 *
 * @param page The page
 * @param selector Element selector
 * @returns Promise<string> Text content
 */
export async function getText(
  page: Page,
  selector: string
): Promise<string> {
  await page.waitForSelector(selector, { visible: true });
  return await page.$eval(selector, el => el.textContent || '');
}

/**
 * Get all text contents of elements matching selector
 *
 * @param page The page
 * @param selector Element selector
 * @returns Promise<string[]> Array of text contents
 */
export async function getAllText(
  page: Page,
  selector: string
): Promise<string[]> {
  const elements = await page.$$(selector);
  const texts: string[] = [];

  for (const element of elements) {
    const text = await element.evaluate(el => el.textContent || '');
    texts.push(text);
  }

  return texts;
}

/**
 * Check if element exists (does not wait)
 *
 * @param page The page
 * @param selector Element selector
 * @returns Promise<boolean> True if exists
 */
export async function elementExists(
  page: Page,
  selector: string
): Promise<boolean> {
  const element = await page.$(selector);
  return element !== null;
}

/**
 * Check if element is visible
 *
 * @param page The page
 * @param selector Element selector
 * @returns Promise<boolean> True if visible
 */
export async function isVisible(
  page: Page,
  selector: string
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { visible: true, timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Capture network request matching URL pattern
 *
 * Sets up request interception and returns a promise that resolves
 * when a matching request is captured.
 *
 * @param page The page
 * @param urlPattern Pattern to match (string or regex)
 * @returns Promise<any> Captured request data
 */
export async function captureRequest(
  page: Page,
  urlPattern: string | RegExp
): Promise<{ url: string; method: string; postData?: string; body?: any }> {
  await page.setRequestInterception(true);

  return new Promise((resolve) => {
    const handler = (request: any) => {
      const url = request.url();
      const matches = typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);

      if (matches) {
        const postData = request.postData();
        let body = null;

        if (postData) {
          try {
            body = JSON.parse(postData);
          } catch {
            // Not JSON, keep as string
          }
        }

        resolve({
          url,
          method: request.method(),
          postData,
          body
        });

        // Remove handler after capturing
        page.off('request', handler);
      }

      request.continue();
    };

    page.on('request', handler);
  });
}

/**
 * Verify PII substitution in request body
 *
 * Checks that alias values are present and real values are not.
 *
 * @param requestBody The request body (object or string)
 * @param profile The profile used for substitution
 * @returns Object with verification results
 */
export function verifySubstitution(
  requestBody: any,
  profile: ProfileData
): {
  success: boolean;
  errors: string[];
  aliasPresent: string[];
  realPresent: string[];
} {
  const bodyStr = typeof requestBody === 'string'
    ? requestBody
    : JSON.stringify(requestBody);

  const errors: string[] = [];
  const aliasPresent: string[] = [];
  const realPresent: string[] = [];

  // Check alias values are present
  if (profile.aliasName && bodyStr.includes(profile.aliasName)) {
    aliasPresent.push(`alias name: "${profile.aliasName}"`);
  } else if (profile.aliasName) {
    errors.push(`❌ Alias name "${profile.aliasName}" not found in request`);
  }

  if (profile.aliasEmail && bodyStr.includes(profile.aliasEmail)) {
    aliasPresent.push(`alias email: "${profile.aliasEmail}"`);
  } else if (profile.aliasEmail) {
    errors.push(`❌ Alias email "${profile.aliasEmail}" not found in request`);
  }

  if (profile.aliasPhone && bodyStr.includes(profile.aliasPhone)) {
    aliasPresent.push(`alias phone: "${profile.aliasPhone}"`);
  }

  // Check real values are NOT present
  if (profile.realName && bodyStr.includes(profile.realName)) {
    realPresent.push(`real name: "${profile.realName}"`);
    errors.push(`❌ Real name "${profile.realName}" found in request (should be substituted)`);
  }

  if (profile.realEmail && bodyStr.includes(profile.realEmail)) {
    realPresent.push(`real email: "${profile.realEmail}"`);
    errors.push(`❌ Real email "${profile.realEmail}" found in request (should be substituted)`);
  }

  if (profile.realPhone && bodyStr.includes(profile.realPhone)) {
    realPresent.push(`real phone: "${profile.realPhone}"`);
    errors.push(`❌ Real phone "${profile.realPhone}" found in request (should be substituted)`);
  }

  return {
    success: errors.length === 0,
    errors,
    aliasPresent,
    realPresent
  };
}

/**
 * Generate random test profile data
 *
 * Useful for tests that need unique profiles.
 *
 * @param baseName Optional base name (default: "Test Profile")
 * @returns ProfileData
 */
export function generateTestProfile(baseName: string = 'Test Profile'): ProfileData {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return {
    profileName: `${baseName} ${timestamp}`,
    realName: `Real Name ${random}`,
    aliasName: `Alias Name ${random}`,
    realEmail: `real.${random}@test.com`,
    aliasEmail: `alias.${random}@test.com`,
    realPhone: `555-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10000)}`,
    aliasPhone: `555-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10000)}`
  };
}

/**
 * Sleep/delay for a specified time
 *
 * Use sparingly - prefer explicit waits when possible.
 *
 * @param ms Milliseconds to sleep
 */
export async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function until it succeeds or max attempts reached
 *
 * @param fn Function to retry
 * @param maxAttempts Maximum attempts (default: 3)
 * @param delay Delay between attempts in ms (default: 1000)
 * @returns Promise<T> Result of function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(`[Retry] Attempt ${attempt}/${maxAttempts} failed: ${error}`);

      if (attempt < maxAttempts) {
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`
  );
}

/**
 * Take screenshot with timestamp
 *
 * @param page The page
 * @param name Screenshot name
 * @param dir Directory to save to (default: screenshots/)
 * @returns Promise<string> Path to screenshot
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  dir: string = 'screenshots'
): Promise<string> {
  const timestamp = Date.now();
  const filename = `${timestamp}-${name}.png`;
  const filepath = `${dir}/${filename}`;

  await page.screenshot({
    path: filepath,
    fullPage: true
  });

  console.log(`📸 Screenshot saved: ${filepath}`);
  return filepath;
}

/**
 * Assert element has text
 *
 * @param page The page
 * @param selector Element selector
 * @param expectedText Expected text
 */
export async function assertElementHasText(
  page: Page,
  selector: string,
  expectedText: string
): Promise<void> {
  const text = await getText(page, selector);
  if (!text.includes(expectedText)) {
    throw new Error(
      `Expected element ${selector} to contain "${expectedText}", ` +
      `but got: "${text}"`
    );
  }
}

/**
 * Assert element exists
 *
 * @param page The page
 * @param selector Element selector
 */
export async function assertElementExists(
  page: Page,
  selector: string
): Promise<void> {
  const exists = await elementExists(page, selector);
  if (!exists) {
    throw new Error(`Expected element ${selector} to exist, but it doesn't`);
  }
}

/**
 * Assert element is visible
 *
 * @param page The page
 * @param selector Element selector
 */
export async function assertElementVisible(
  page: Page,
  selector: string
): Promise<void> {
  const visible = await isVisible(page, selector);
  if (!visible) {
    throw new Error(`Expected element ${selector} to be visible, but it's not`);
  }
}

/**
 * Assert element does not exist
 *
 * @param page The page
 * @param selector Element selector
 */
export async function assertElementNotExists(
  page: Page,
  selector: string
): Promise<void> {
  const exists = await elementExists(page, selector);
  if (exists) {
    throw new Error(`Expected element ${selector} to not exist, but it does`);
  }
}
