/**
 * E2E Test: Google Quick Start Feature
 *
 * Tests the Google Quick Start feature that auto-generates a profile
 * using the authenticated user's Google account information combined
 * with AI-generated alias data.
 *
 * Flow:
 * 1. User signs in with Google account
 * 2. "Quick Start" buttons become visible in Aliases tab
 * 3. Click button opens profile modal with:
 *    - Real info from Google account (name, email)
 *    - AI-generated alias data (fake name, email, phone, address)
 * 4. User reviews and creates profile
 *
 * Requirements:
 * - TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test.local
 * - Test user must be a valid Google account
 *
 * Implementation files:
 * - src/popup/components/userProfile.ts (handleGoogleQuickStart)
 * - src/popup/components/profileModal.ts (modal handling)
 *
 * @group features
 * @priority P1 (high value feature)
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
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.test.local') });

describe('E2E: Google Quick Start', () => {
  let harness: ExtensionTestHarness;
  let chatPage: Page;
  let popupPage: Page;
  let popup: PopupPage;

  /**
   * Setup: Launch browser, setup platform page, then open popup
   */
  beforeAll(async () => {
    console.log('\n========================================');
    console.log('⚡ Starting Google Quick Start Tests');
    console.log('========================================\n');

    // Verify test credentials exist
    if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
      throw new Error(
        'Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in .env.test.local\n' +
        'Google Quick Start tests require a real Google account for authentication.'
      );
    }

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
  }, 60000);

  /**
   * Before each test: Open fresh popup
   */
  beforeEach(async () => {
    console.log('📋 Opening fresh popup...');
    popupPage = await harness.openPopup();
    popup = new PopupPage(popupPage);
    console.log('✅ Popup ready\n');
  }, 30000);

  /**
   * After each test: Close popup
   */
  afterEach(async () => {
    if (popupPage && !popupPage.isClosed()) {
      await popupPage.close();
    }
  });

  /**
   * Cleanup: Close browser
   */
  afterAll(async () => {
    console.log('\n========================================');
    console.log('🧹 Cleaning up Google Quick Start Tests');
    console.log('========================================\n');

    await harness.cleanup();
    console.log('✅ Cleanup complete\n');
  });

  /**
   * Test 1: Quick Start buttons are hidden when not signed in
   *
   * Verifies that Quick Start buttons are not visible in the unauthenticated state.
   */
  test('Quick Start buttons are hidden when not signed in', async () => {
    console.log('🔒 Test: Quick Start buttons hidden when not signed in');

    // Navigate to Aliases tab (default tab, but make sure)
    await popup.navigateToTab('aliases');
    await wait(300);
    console.log('   ✓ On Aliases tab');

    // Verify empty state is visible (no profiles yet)
    const emptyStateVisible = await isVisible(popupPage, '#profilesEmptyState');
    expect(emptyStateVisible).toBe(true);
    console.log('   ✓ Empty state visible');

    // Verify Quick Start buttons exist but are hidden
    await assertElementExists(popupPage, '#googleQuickStartBtn');
    console.log('   ✓ Header Quick Start button exists');

    await assertElementExists(popupPage, '#googleQuickStartBtnEmpty');
    console.log('   ✓ Empty state Quick Start button exists');

    // Verify buttons are hidden
    const headerBtnHidden = await popupPage.$eval(
      '#googleQuickStartBtn',
      el => el.classList.contains('hidden')
    );
    expect(headerBtnHidden).toBe(true);
    console.log('   ✓ Header button is hidden');

    const emptyBtnHidden = await popupPage.$eval(
      '#googleQuickStartBtnEmpty',
      el => el.classList.contains('hidden')
    );
    expect(emptyBtnHidden).toBe(true);
    console.log('   ✓ Empty state button is hidden');

    console.log('✅ Quick Start buttons are hidden when not signed in\n');
  });

  /**
   * Test 2: Sign-in button is visible
   *
   * Verifies that the sign-in UI is present for authentication.
   */
  test('sign-in button is visible', async () => {
    console.log('🔑 Test: Sign-in button is visible');

    // Verify sign-in button exists
    await assertElementExists(popupPage, '#headerSignInBtn');
    console.log('   ✓ Sign-in button exists');

    // Verify it's visible
    await assertElementVisible(popupPage, '#headerSignInBtn');
    console.log('   ✓ Sign-in button is visible');

    // Get button text
    const buttonText = await getText(popupPage, '#headerSignInBtn');
    console.log(`   ✓ Button text: "${buttonText}"`);

    console.log('✅ Sign-in button is visible\n');
  });

  /**
   * Test 3: Sign-in flow (manual step)
   *
   * This test documents the sign-in flow but requires manual intervention
   * for Google OAuth in the browser. Automated Google OAuth is complex
   * and requires special setup.
   *
   * TODO: Automate Google OAuth flow using test credentials
   */
  test.skip('sign-in with Google and verify Quick Start buttons appear', async () => {
    console.log('🔐 Test: Sign-in with Google');
    console.log('⚠️  This test requires manual sign-in interaction\n');

    // Click sign-in button
    console.log('   → Clicking sign-in button...');
    await popupPage.click('#headerSignInBtn');
    await wait(1000);

    // Auth modal should open
    const authModalVisible = await isVisible(popupPage, '#authModal');
    expect(authModalVisible).toBe(true);
    console.log('   ✓ Auth modal opened');

    // Click Google sign-in button
    console.log('   → Clicking Google sign-in button...');
    const googleSignInBtn = await popupPage.$('#googleSignInBtn');
    expect(googleSignInBtn).toBeTruthy();
    await googleSignInBtn!.click();
    await wait(2000);

    // TODO: Automate Google OAuth flow
    // For now, this would require manual intervention in the test browser

    console.log('   ⏸️  Manual Google sign-in required');
    console.log('   ⏸️  After signing in, Quick Start buttons should appear');

    console.log('⏭️  Test skipped (requires automation)\n');
  });

  /**
   * Test 4: Verify profile modal structure
   *
   * Verifies that the profile modal exists and has the correct fields
   * that Quick Start will populate.
   */
  test('profile modal has correct structure for Quick Start', async () => {
    console.log('📋 Test: Profile modal structure');

    // Open profile modal manually (simulating Quick Start)
    await popupPage.click('#addProfileBtn');
    await wait(500);
    console.log('   ✓ Opened profile modal');

    // Verify modal is open
    const modalOpen = await popup.isProfileModalOpen();
    expect(modalOpen).toBe(true);
    console.log('   ✓ Profile modal is open');

    // Verify all fields that Quick Start populates exist
    const fieldsToCheck = [
      { id: '#profileName', label: 'Profile Name' },
      { id: '#profileDescription', label: 'Profile Description' },
      { id: '#realName', label: 'Real Name' },
      { id: '#realEmail', label: 'Real Email' },
      { id: '#aliasName', label: 'Alias Name' },
      { id: '#aliasEmail', label: 'Alias Email' },
      { id: '#aliasPhone', label: 'Alias Phone' },
      { id: '#aliasAddress', label: 'Alias Address' }
    ];

    for (const field of fieldsToCheck) {
      await assertElementExists(popupPage, field.id);
      console.log(`   ✓ ${field.label} field exists`);
    }

    // Cancel modal
    await popup.cancelProfile();
    await wait(300);
    console.log('   ✓ Cancelled modal');

    console.log('✅ Profile modal has correct structure\n');
  });
});
