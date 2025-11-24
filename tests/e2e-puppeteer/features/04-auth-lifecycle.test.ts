/**
 * E2E Test: Complete Authentication Lifecycle
 *
 * This is the foundational enterprise-grade test that validates:
 * 1. Platform page setup (ChatGPT with active message chain)
 * 2. Popup opening
 * 3. Google OAuth sign-in automation
 * 4. Profile creation with real Firebase encryption
 * 5. Profile deletion
 * 6. Sign out
 *
 * This test proves the entire auth flow works end-to-end.
 * All other tests will reuse these helpers in the pattern:
 *   Sign in → Create profile → TEST → Delete profile → Sign out
 *
 * Requirements:
 * - TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test.local
 * - Test user must be a valid Google account registered in Firebase
 * - Extension must be built (dist/ folder exists)
 *
 * @group features
 * @priority P0 (foundational)
 */

import { ExtensionTestHarness, ProfileData } from '../setup/ExtensionTestHarness';
import { Page } from 'puppeteer';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.test.local') });

// Test profile data
const TEST_PROFILE: ProfileData = {
  profileName: 'E2E Test Profile',
  realName: 'John Smith',
  aliasName: 'Alex Johnson',
  realEmail: 'john.smith@example.com',
  aliasEmail: 'alex.johnson@example.com',
  realPhone: '+1 555-0100',
  aliasPhone: '+1 555-0999',
  realAddress: '123 Real Street, Real City, CA 90210',
  aliasAddress: '456 Alias Avenue, Alias Town, NY 10001',
  realCompany: 'RealCorp Inc',
  aliasCompany: 'AliasCorp LLC'
};

describe('E2E: Complete Authentication Lifecycle', () => {
  let harness: ExtensionTestHarness;
  let chatPage: Page;
  let popupPage: Page;

  /**
   * Setup: Launch browser and platform page
   * This runs once before all tests
   */
  beforeAll(async () => {
    console.log('\n========================================');
    console.log('🔐 Starting Authentication Lifecycle Tests');
    console.log('========================================\n');

    // Verify test credentials exist
    if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
      throw new Error(
        'Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in .env.test.local\n' +
        'Auth lifecycle tests require real Google OAuth credentials.'
      );
    }

    // Initialize harness
    harness = new ExtensionTestHarness({
      headless: false, // Must be false for extensions
      devtools: false,
      slowMo: 100, // Slight slowdown to see auth flow
      captureConsole: true
    });

    // Setup extension
    await harness.setup();

    // Setup platform page (ChatGPT with active message chain)
    console.log('📋 Setting up platform page...');
    chatPage = await harness.setupPlatformPage();
    console.log('✅ Platform page ready with active message chain\n');

    console.log('✅ Setup complete\n');
  }, 90000); // 90 second timeout for auth flow

  /**
   * Cleanup: Close browser
   */
  afterAll(async () => {
    console.log('\n========================================');
    console.log('🧹 Cleaning up Authentication Lifecycle Tests');
    console.log('========================================\n');

    // Close popup if still open
    if (popupPage && !popupPage.isClosed()) {
      await popupPage.close();
    }

    await harness.cleanup();
    console.log('✅ Cleanup complete\n');
  });

  /**
   * Test 1: Complete auth lifecycle
   *
   * This is the enterprise-grade pattern:
   * 1. Open popup
   * 2. Sign in with Google OAuth
   * 3. Create test profile
   * 4. Verify profile exists
   * 5. Delete test profile
   * 6. Verify profile removed
   * 7. Sign out
   * 8. Verify signed out state
   */
  test('complete auth lifecycle: sign in → create → delete → sign out', async () => {
    console.log('🔄 Test: Complete authentication lifecycle');
    console.log('='.repeat(50));

    // Step 1: Open popup
    console.log('\n📋 Step 1/7: Opening popup...');
    popupPage = await harness.openPopup();
    console.log('✅ Popup opened\n');

    // Step 2: Sign in with Google OAuth
    console.log('📋 Step 2/7: Signing in with Google OAuth...');
    await harness.signInTestUser(popupPage);
    console.log('✅ Signed in successfully\n');

    // Wait a moment for auth state to settle
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Create test profile
    console.log('📋 Step 3/7: Creating test profile...');
    await harness.createTestProfile(popupPage, TEST_PROFILE);
    console.log('✅ Profile created\n');

    // Step 4: Verify profile exists
    console.log('📋 Step 4/7: Verifying profile exists...');
    const profileCards = await popupPage.$$('.profile-card');
    expect(profileCards.length).toBeGreaterThan(0);
    console.log(`✅ Found ${profileCards.length} profile(s)\n`);

    // Verify profile content
    const profileText = await profileCards[0].evaluate(el => el.textContent || '');
    expect(profileText).toContain(TEST_PROFILE.profileName);
    console.log(`✅ Profile contains "${TEST_PROFILE.profileName}"\n`);

    // Step 5: Delete test profile
    console.log('📋 Step 5/7: Deleting test profile...');
    await harness.deleteTestProfile(popupPage, TEST_PROFILE.profileName);
    console.log('✅ Profile deleted\n');

    // Step 6: Verify profile removed
    console.log('📋 Step 6/7: Verifying profile removed...');
    const remainingCards = await popupPage.$$('.profile-card');
    expect(remainingCards.length).toBe(0);
    console.log('✅ No profiles remaining (empty state)\n');

    // Step 7: Sign out
    console.log('📋 Step 7/7: Signing out...');
    await harness.signOutTestUser(popupPage);
    console.log('✅ Signed out successfully\n');

    // Step 8: Verify signed out state
    console.log('📋 Step 8/7 (bonus): Verifying signed out state...');
    const signInBtnVisible = await popupPage.$('#headerSignInBtn');
    expect(signInBtnVisible).toBeTruthy();
    console.log('✅ Sign-in button visible\n');

    console.log('='.repeat(50));
    console.log('✅ Complete auth lifecycle test PASSED!');
    console.log('='.repeat(50));
  }, 120000); // 120 second timeout for full flow

  /**
   * Test 2: Profile persists across popup reopen (while signed in)
   *
   * Pattern:
   * 1. Open popup
   * 2. Sign in
   * 3. Create profile
   * 4. Close popup
   * 5. Reopen popup
   * 6. Verify profile still exists (Firebase persistence)
   * 7. Delete profile
   * 8. Sign out
   */
  test('profile persists across popup reopen', async () => {
    console.log('💾 Test: Profile persistence across popup reopen');
    console.log('='.repeat(50));

    // Step 1: Open popup
    console.log('\n📋 Step 1/8: Opening popup...');
    popupPage = await harness.openPopup();
    console.log('✅ Popup opened\n');

    // Step 2: Sign in
    console.log('📋 Step 2/8: Signing in...');
    await harness.signInTestUser(popupPage);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Signed in\n');

    // Step 3: Create profile
    console.log('📋 Step 3/8: Creating profile...');
    await harness.createTestProfile(popupPage, {
      ...TEST_PROFILE,
      profileName: 'Persistence Test Profile'
    });
    console.log('✅ Profile created\n');

    // Step 4: Close popup
    console.log('📋 Step 4/8: Closing popup...');
    await popupPage.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Popup closed\n');

    // Step 5: Reopen popup
    console.log('📋 Step 5/8: Reopening popup...');
    popupPage = await harness.openPopup();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for profile load
    console.log('✅ Popup reopened\n');

    // Step 6: Verify profile still exists
    console.log('📋 Step 6/8: Verifying profile persisted...');
    const profileCards = await popupPage.$$('.profile-card');
    expect(profileCards.length).toBe(1);

    const profileText = await profileCards[0].evaluate(el => el.textContent || '');
    expect(profileText).toContain('Persistence Test Profile');
    console.log('✅ Profile persisted across reopen!\n');

    // Step 7: Delete profile
    console.log('📋 Step 7/8: Cleaning up - deleting profile...');
    await harness.deleteTestProfile(popupPage, 'Persistence Test Profile');
    console.log('✅ Profile deleted\n');

    // Step 8: Sign out
    console.log('📋 Step 8/8: Signing out...');
    await harness.signOutTestUser(popupPage);
    console.log('✅ Signed out\n');

    console.log('='.repeat(50));
    console.log('✅ Profile persistence test PASSED!');
    console.log('='.repeat(50));
  }, 120000);
});
