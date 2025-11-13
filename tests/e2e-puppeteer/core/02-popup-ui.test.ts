/**
 * E2E Test: Popup UI Display
 *
 * Tests that the extension popup opens and displays correctly:
 * 1. Platform page (ChatGPT) is opened FIRST (required for message chain)
 * 2. Content script injection is verified
 * 3. Health checks pass (message chain active)
 * 4. Popup opens via direct URL navigation
 * 5. Main UI elements are rendered
 * 6. Tab navigation is functional
 * 7. Empty state is shown (no profiles yet)
 * 8. All critical buttons and sections exist
 * 9. Status indicator is functional
 *
 * CRITICAL ARCHITECTURE REQUIREMENT:
 * The popup CANNOT function without an AI platform page (ChatGPT, Claude, etc.)
 * being open first. This is because the extension uses a three-context architecture:
 * inject.js (page) → content.ts (isolated world) → background (service worker)
 *
 * The popup relies on this message chain to function properly.
 *
 * @group core
 * @priority P0 (blocking)
 */

import { ExtensionTestHarness } from '../setup/ExtensionTestHarness';
import { PopupPage } from '../setup/PageObjectModels';
import { Page } from 'puppeteer';
import {
  waitForElement,
  isVisible,
  getText,
  assertElementExists,
  assertElementVisible,
  wait
} from '../setup/TestHelpers';

describe('E2E: Popup UI Display', () => {
  let harness: ExtensionTestHarness;
  let chatPage: Page;
  let popupPage: Page;
  let popup: PopupPage;
  let hasFailedTests = false;

  /**
   * Setup: Launch browser, setup platform page, then open popup
   *
   * CRITICAL: Platform page (ChatGPT) must be opened FIRST to establish
   * the message chain (inject → content → background) that the popup needs.
   */
  beforeAll(async () => {
    console.log('\n========================================');
    console.log('🪟 Starting Popup UI Tests');
    console.log('========================================\n');

    harness = new ExtensionTestHarness({
      headless: false,
      devtools: false,
      slowMo: 0,
      captureConsole: true
    });

    await harness.setup();

    console.log('📋 Step 1/2: Opening ChatGPT platform page...');
    chatPage = await harness.setupPlatformPage();
    console.log('✅ Platform page ready with active message chain\n');

    console.log('✅ Setup complete\n');
  }, 60000); // Increased timeout for platform page + popup

  /**
   * Before each test: Open a fresh popup
   *
   * This ensures each test gets a clean popup state and prevents
   * state pollution between tests.
   */
  beforeEach(async () => {
    // If previous tests failed and this is Test 9, skip it
    if (hasFailedTests && expect.getState().currentTestName?.includes('minimal mode toggle')) {
      return;
    }

    console.log('📋 Opening fresh popup for test...');
    popupPage = await harness.openPopup();
    popup = new PopupPage(popupPage);
    console.log('✅ Popup ready\n');
  }, 30000);

  /**
   * After each test: Track failures and close popup
   */
  afterEach(async function() {
    // Track if this test failed
    if (this.currentTest?.state === 'failed') {
      hasFailedTests = true;
    }

    // Close the popup page to clean up
    if (popupPage && !popupPage.isClosed()) {
      await popupPage.close();
    }
  });

  /**
   * Cleanup: Close browser
   */
  afterAll(async () => {
    console.log('\n========================================');
    console.log('🧹 Cleaning up Popup UI Tests');
    console.log('========================================\n');

    await harness.cleanup();
    console.log('✅ Cleanup complete\n');
  });

  /**
   * Test 1: Popup opens successfully
   *
   * Verifies that the popup window opened and the main views
   * (full or minimal mode) are present.
   */
  test('popup opens successfully', async () => {
    console.log('🪟 Test: Popup opens successfully');

    // Verify popup page exists
    expect(popupPage).toBeTruthy();
    console.log('   ✓ Popup page object exists');

    // Verify page URL
    const url = popupPage.url();
    expect(url).toContain('popup-v2.html');
    console.log(`   ✓ Popup URL correct: ${url}`);

    // Verify main view containers exist
    await assertElementExists(popupPage, '#fullView');
    console.log('   ✓ #fullView element exists');

    await assertElementExists(popupPage, '#minimalView');
    console.log('   ✓ #minimalView element exists');

    // One should be visible (full mode by default)
    const fullViewVisible = await isVisible(popupPage, '#fullView');
    expect(fullViewVisible).toBe(true);
    console.log('   ✓ #fullView is visible (full mode)');

    console.log('✅ Popup opens successfully\n');
  });

  /**
   * Test 2: Header is rendered correctly
   *
   * Verifies that the header section displays with all
   * expected elements.
   */
  test('header is rendered correctly', async () => {
    console.log('📋 Test: Header is rendered correctly');

    // Verify header exists
    await assertElementExists(popupPage, '.header');
    console.log('   ✓ Header element exists');

    // Verify title
    const titleExists = await isVisible(popupPage, '.header h1');
    expect(titleExists).toBe(true);
    console.log('   ✓ Header title exists');

    // Get title text
    const titleText = await getText(popupPage, '.header h1');
    expect(titleText).toContain('PromptBlocker');
    console.log(`   ✓ Header title text: "${titleText}"`);

    // Verify status indicator
    await assertElementExists(popupPage, '#statusIndicator');
    console.log('   ✓ Status indicator exists');

    // Get status text
    const statusText = await getText(popupPage, '#statusIndicator .status-text');
    console.log(`   ✓ Status text: "${statusText}"`);

    // Status should be one of: Active, Partial, Inactive
    expect(['Active', 'Partial', 'Inactive'].some(s => statusText.includes(s))).toBe(true);
    console.log('   ✓ Status text is valid');

    // Verify minimize button exists
    await assertElementExists(popupPage, '#minimizeBtn');
    console.log('   ✓ Minimize button exists');

    console.log('✅ Header is rendered correctly\n');
  });

  /**
   * Test 3: Tab navigation is rendered
   *
   * Verifies that all 5 tabs are present and the Aliases tab
   * is active by default.
   */
  test('tab navigation is rendered', async () => {
    console.log('📑 Test: Tab navigation is rendered');

    // Verify tab navigation container
    await assertElementExists(popupPage, '.tab-nav');
    console.log('   ✓ Tab navigation container exists');

    // Verify all 5 tabs exist
    const tabs = [
      { selector: '[data-tab="aliases"]', name: 'Aliases' },
      { selector: '[data-tab="stats"]', name: 'Stats' },
      { selector: '[data-tab="features"]', name: 'Features' },
      { selector: '[data-tab="settings"]', name: 'Settings' },
      { selector: '[data-tab="debug"]', name: 'Debug' }
    ];

    for (const tab of tabs) {
      await assertElementExists(popupPage, tab.selector);
      console.log(`   ✓ ${tab.name} tab exists`);
    }

    // Verify Aliases tab is active by default
    const aliasesTabClass = await popupPage.$eval(
      '[data-tab="aliases"]',
      el => el.className
    );
    expect(aliasesTabClass).toContain('active');
    console.log('   ✓ Aliases tab is active by default');

    console.log('✅ Tab navigation is rendered\n');
  });

  /**
   * Test 4: Empty state is shown (no profiles)
   *
   * Since this is a fresh extension with no profiles,
   * the empty state message should be visible.
   */
  test('empty state is shown (no profiles)', async () => {
    console.log('📭 Test: Empty state is shown');

    // Verify empty state is visible
    const emptyStateVisible = await isVisible(popupPage, '#profilesEmptyState');
    expect(emptyStateVisible).toBe(true);
    console.log('   ✓ Empty state element is visible');

    // Verify no profile cards exist
    const profileCards = await popupPage.$$('.profile-card');
    expect(profileCards).toHaveLength(0);
    console.log('   ✓ No profile cards exist (expected for empty state)');

    // Using Page Object Model to check
    const isEmpty = await popup.isEmptyState();
    expect(isEmpty).toBe(true);
    console.log('   ✓ POM confirms empty state');

    const profileCount = await popup.getProfileCount();
    expect(profileCount).toBe(0);
    console.log(`   ✓ Profile count: ${profileCount} (expected 0)`);

    console.log('✅ Empty state is shown\n');
  });

  /**
   * Test 5: "New Profile" button is visible
   *
   * Verifies that the primary action button for creating
   * profiles is accessible.
   */
  test('"New Profile" button is visible', async () => {
    console.log('➕ Test: "New Profile" button is visible');

    // Verify button exists
    await assertElementExists(popupPage, '#addProfileBtn');
    console.log('   ✓ Add profile button exists');

    // Verify button is visible
    await assertElementVisible(popupPage, '#addProfileBtn');
    console.log('   ✓ Add profile button is visible');

    // Verify button is clickable (not disabled)
    const isDisabled = await popupPage.$eval(
      '#addProfileBtn',
      el => (el as HTMLButtonElement).disabled
    );
    expect(isDisabled).toBe(false);
    console.log('   ✓ Add profile button is enabled');

    // Get button text
    const buttonText = await getText(popupPage, '#addProfileBtn');
    console.log(`   ✓ Button text: "${buttonText}"`);

    console.log('✅ "New Profile" button is visible\n');
  });

  /**
   * Test 6: Tab navigation works
   *
   * Clicks through all tabs and verifies they become active.
   */
  test('tab navigation works', async () => {
    console.log('🔄 Test: Tab navigation works');

    const tabs = [
      { tab: 'stats' as const, name: 'Stats' },
      { tab: 'features' as const, name: 'Features' },
      { tab: 'settings' as const, name: 'Settings' },
      { tab: 'debug' as const, name: 'Debug' },
      { tab: 'aliases' as const, name: 'Aliases' } // Back to first
    ];

    for (const { tab, name } of tabs) {
      console.log(`   → Navigating to ${name} tab...`);

      // Click tab using Page Object Model
      await popup.navigateToTab(tab);

      // Wait a moment for UI to update
      await wait(200);

      // Verify tab is active
      const isActive = await popupPage.$eval(
        `[data-tab="${tab}"]`,
        el => el.classList.contains('active')
      );
      expect(isActive).toBe(true);
      console.log(`   ✓ ${name} tab is now active`);
    }

    console.log('✅ Tab navigation works\n');
  });

  /**
   * Test 7: All tab content sections exist
   *
   * Verifies that each tab has its corresponding content section.
   */
  test('all tab content sections exist', async () => {
    console.log('📄 Test: All tab content sections exist');

    // Navigate to each tab and verify its content exists
    const tabContents = [
      { tab: 'aliases' as const, selector: '#aliases-tab', name: 'Aliases content' },
      { tab: 'stats' as const, selector: '#stats-tab', name: 'Stats content' },
      { tab: 'features' as const, selector: '#features-tab', name: 'Features content' },
      { tab: 'settings' as const, selector: '#settings-tab', name: 'Settings content' },
      { tab: 'debug' as const, selector: '#debug-tab', name: 'Debug content' }
    ];

    for (const { tab, selector, name } of tabContents) {
      // Navigate to tab
      await popup.navigateToTab(tab);
      await wait(200);

      // Check if tab content exists
      const exists = await popupPage.$(selector);

      if (exists) {
        console.log(`   ✓ ${name} exists (selector: ${selector})`);
      } else {
        console.log(`   ✗ ${name} NOT FOUND on ${tab} tab`);
        console.log(`   Tried selector: ${selector}`);

        // Get actual page content for debugging
        const actualContent = await popupPage.evaluate(() => {
          const tabContent = document.querySelector('.tab-content.active');
          return tabContent ? tabContent.id : 'No active tab content found';
        });
        console.log(`   Actual active tab: ${actualContent}`);
      }

      expect(exists).toBeTruthy();
    }

    console.log('✅ All tab content sections exist\n');
  });

  /**
   * Test 8: No JavaScript errors during UI interaction
   *
   * Verifies that navigating through the UI doesn't cause errors.
   */
  test('no JavaScript errors during UI interaction', async () => {
    console.log('🔍 Test: No JavaScript errors during UI interaction');

    // Get initial error count
    const initialErrors = harness.getErrorLogs().length;
    console.log(`   ✓ Initial errors: ${initialErrors}`);

    // Interact with UI
    await popup.navigateToTab('stats');
    await wait(300);

    await popup.navigateToTab('features');
    await wait(300);

    await popup.navigateToTab('aliases');
    await wait(300);

    // Get final error count
    const finalErrors = harness.getErrorLogs().length;
    console.log(`   ✓ Final errors: ${finalErrors}`);

    // Calculate new errors
    const newErrors = finalErrors - initialErrors;
    console.log(`   ✓ New errors during interaction: ${newErrors}`);

    // Log any new errors
    if (newErrors > 0) {
      const errors = harness.getErrorLogs().slice(initialErrors);
      console.log('\n   ⚠️  Errors found:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.text}`);
      });
      console.log('');
    }

    // Assert no new errors
    expect(newErrors).toBe(0);

    console.log('✅ No JavaScript errors during UI interaction\n');
  });

  /**
   * Test 9: Minimal mode toggle works
   *
   * Tests the minimize/expand functionality.
   *
   * NOTE: This test only runs if all previous tests passed.
   * This prevents the minimize action from affecting other tests.
   */
  test('minimal mode toggle works', async () => {
    // Skip if any previous tests failed
    if (hasFailedTests) {
      console.log('⏭️  Skipping minimal mode test - earlier tests failed');
      return;
    }

    console.log('🔽 Test: Minimal mode toggle works');

    // Start in full mode
    const inFullMode = await popupPage.$eval(
      '#fullView',
      el => !el.classList.contains('hidden')
    );
    expect(inFullMode).toBe(true);
    console.log('   ✓ Started in full mode');

    // Minimize
    console.log('   → Minimizing popup...');
    await popup.minimizePopup();
    await wait(300);

    // Verify in minimal mode
    const isMinimal = await popup.isMinimalMode();
    expect(isMinimal).toBe(true);
    console.log('   ✓ Popup is now in minimal mode');

    // Verify minimal view is visible
    const minimalVisible = await isVisible(popupPage, '#minimalView');
    expect(minimalVisible).toBe(true);
    console.log('   ✓ Minimal view is visible');

    // Verify full view is hidden
    const fullHidden = await popupPage.$eval(
      '#fullView',
      el => el.classList.contains('hidden')
    );
    expect(fullHidden).toBe(true);
    console.log('   ✓ Full view is hidden');

    // Expand back
    console.log('   → Expanding popup...');
    await popup.expandPopup();
    await wait(300);

    // Verify back in full mode
    const backToFull = await popup.isMinimalMode();
    expect(backToFull).toBe(false);
    console.log('   ✓ Popup is back in full mode');

    console.log('✅ Minimal mode toggle works\n');
  });

  /**
   * Test 10: Status indicator displays correctly
   *
   * Verifies that the status indicator shows valid states.
   */
  test('status indicator displays correctly', async () => {
    console.log('🟢 Test: Status indicator displays correctly');

    // Navigate back to aliases tab to see status clearly
    await popup.navigateToTab('aliases');

    // Get status using POM
    const status = await popup.getStatus();
    console.log(`   ✓ Status text: "${status}"`);

    // Verify status is one of the valid states
    const validStates = ['Active', 'Partial', 'Inactive'];
    const isValid = validStates.some(state => status.includes(state));
    expect(isValid).toBe(true);
    console.log('   ✓ Status is a valid state');

    // Verify status indicator has the status dot
    const hasDot = await isVisible(popupPage, '#statusIndicator .status-dot');
    expect(hasDot).toBe(true);
    console.log('   ✓ Status dot is visible');

    // With no profiles, status should likely be Inactive or Partial
    // (depends on extension state)
    console.log(`   ℹ️  Current status: ${status}`);

    console.log('✅ Status indicator displays correctly\n');
  });
});
