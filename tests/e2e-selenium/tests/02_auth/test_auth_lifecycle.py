"""
E2E Test: Complete Authentication Lifecycle

This is the foundational enterprise-grade test that validates the MANDATORY flow:
1. Platform page setup (ChatGPT)
2. Popup opening via PyAutoGUI
3. Google OAuth sign-in automation
4. Firebase decryption wait (5s health check loop)
5. Profile creation with real Firebase encryption
6. Profile deletion
7. Sign out

This test proves the entire auth flow works end-to-end.
All other tests will reuse this pattern.

Requirements:
- TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test.local
- Test user must be a valid Google account registered in Firebase
- Extension must be built (dist/ folder exists)
- Extension icon coordinates calibrated OR screenshot available for PyAutoGUI

@group auth
@priority P0 (foundational)
"""

import pytest
import allure
import time
from helpers.test_harness import TestHarness


# Test profile data
TEST_PROFILE = {
    'profileName': 'E2E Test Profile',
    'realName': 'John Smith',
    'aliasName': 'Alex Johnson',
    'realEmail': 'john.smith@example.com',
    'aliasEmail': 'alex.johnson@example.com',
    'realPhone': '+1 555-0100',
    'aliasPhone': '+1 555-0999',
    'realAddress': '123 Real Street, Real City, CA 90210',
    'aliasAddress': '456 Alias Avenue, Alias Town, NY 10001',
    'realCompany': 'RealCorp Inc',
    'aliasCompany': 'AliasCorp LLC'
}


@allure.feature('Authentication')
@allure.story('Complete Auth Lifecycle')
@allure.severity(allure.severity_level.BLOCKER)
@pytest.mark.auth
@pytest.mark.critical
class TestAuthLifecycle:
    """
    Test the complete authentication lifecycle from sign-in to sign-out.

    This validates that the mandatory flow works correctly and that
    profiles can be created, used, and deleted while authenticated.
    """

    @allure.title('Complete auth lifecycle: sign in → create → delete → sign out')
    @allure.description(
        'This test validates the complete authentication lifecycle:\n'
        '1. Navigate to ChatGPT\n'
        '2. Open extension popup\n'
        '3. Sign in with Google OAuth\n'
        '4. Wait for Firebase decryption\n'
        '5. Create a test profile\n'
        '6. Verify profile exists\n'
        '7. Delete the profile\n'
        '8. Sign out\n'
        '\n'
        'This is the foundational test - all other tests depend on this flow working.'
    )
    def test_complete_auth_lifecycle(self, driver):
        """
        Test the complete authentication lifecycle.

        This runs through the entire flow from initial load to cleanup.

        Args:
            driver: Selenium WebDriver fixture
        """
        harness = TestHarness(driver)

        try:
            # ========================================
            # MANDATORY FLOW (Steps 1-5)
            # ========================================
            with allure.step('Execute mandatory flow (ChatGPT → Popup → OAuth → Decrypt)'):
                windows = harness.complete_mandatory_flow(popup_method='coordinates')

                # Attach screenshot after successful flow
                screenshot = driver.get_screenshot_as_png()
                allure.attach(
                    screenshot,
                    name='after_mandatory_flow',
                    attachment_type=allure.attachment_type.PNG
                )

            # ========================================
            # CREATE PROFILE (Now that we're authenticated)
            # ========================================
            with allure.step(f'Create test profile: {TEST_PROFILE["profileName"]}'):
                harness.create_test_profile(TEST_PROFILE)

                # Screenshot after profile creation
                screenshot = driver.get_screenshot_as_png()
                allure.attach(
                    screenshot,
                    name='after_profile_creation',
                    attachment_type=allure.attachment_type.PNG
                )

            # ========================================
            # VERIFY PROFILE EXISTS
            # ========================================
            with allure.step('Verify profile was created'):
                # Switch to popup
                driver.switch_to.window(windows['popup'])

                from pages.popup_page import PopupPage
                popup = PopupPage(driver)

                # Get selected profile
                selected_profile = popup.get_selected_profile()

                assert selected_profile == TEST_PROFILE['profileName'], \
                    f"Expected profile '{TEST_PROFILE['profileName']}', got '{selected_profile}'"

                print(f"[OK] Profile verified: {selected_profile}")

            # ========================================
            # DELETE PROFILE
            # ========================================
            with allure.step('Delete test profile'):
                harness.delete_test_profile(TEST_PROFILE['profileName'])

                # Screenshot after deletion
                screenshot = driver.get_screenshot_as_png()
                allure.attach(
                    screenshot,
                    name='after_profile_deletion',
                    attachment_type=allure.attachment_type.PNG
                )

            # ========================================
            # SIGN OUT
            # ========================================
            with allure.step('Sign out'):
                harness.sign_out()

                # Verify signed out
                from helpers.auth_helper import AuthHelper
                auth = AuthHelper(driver)

                driver.switch_to.window(windows['popup'])
                assert auth.is_signed_out(), "User should be signed out"

                print("[OK] User signed out successfully")

                # Final screenshot
                screenshot = driver.get_screenshot_as_png()
                allure.attach(
                    screenshot,
                    name='after_sign_out',
                    attachment_type=allure.attachment_type.PNG
                )

            print("\n[OK] Complete auth lifecycle test PASSED")

        except Exception as e:
            # Capture screenshot on failure
            screenshot = driver.get_screenshot_as_png()
            allure.attach(
                screenshot,
                name='test_failure',
                attachment_type=allure.attachment_type.PNG
            )
            raise

        finally:
            # Cleanup
            harness.cleanup()


@allure.feature('Authentication')
@allure.story('Profile Persistence')
@allure.severity(allure.severity_level.CRITICAL)
@pytest.mark.auth
@pytest.mark.critical
class TestProfilePersistence:
    """
    Test that profiles persist across popup close/reopen.

    This validates the alternate test pattern where profiles are stored
    in Chrome local storage with Firebase UID encryption and can be
    retrieved after popup refresh.
    """

    @allure.title('Profile persists across popup reopen')
    @allure.description(
        'This test validates profile persistence:\n'
        '1. Complete mandatory flow\n'
        '2. Create a test profile\n'
        '3. Close popup\n'
        '4. Reopen popup\n'
        '5. Verify profile still exists\n'
        '6. Cleanup: Delete profile and sign out'
    )
    def test_profile_persists_across_popup_reopen(self, driver):
        """
        Test that a profile persists when popup is closed and reopened.

        Args:
            driver: Selenium WebDriver fixture
        """
        harness = TestHarness(driver)

        try:
            # ========================================
            # SETUP: Mandatory flow + create profile
            # ========================================
            with allure.step('Setup: Complete mandatory flow and create profile'):
                windows = harness.complete_mandatory_flow(popup_method='coordinates')
                harness.create_test_profile(TEST_PROFILE)

                print(f"[OK] Setup complete: Profile '{TEST_PROFILE['profileName']}' created")

            # ========================================
            # CLOSE POPUP
            # ========================================
            with allure.step('Close extension popup'):
                driver.switch_to.window(windows['popup'])
                driver.close()
                print("[OK] Popup closed")
                time.sleep(1)

            # ========================================
            # REOPEN POPUP
            # ========================================
            with allure.step('Reopen extension popup'):
                # Switch back to ChatGPT
                driver.switch_to.window(windows['chatgpt'])

                # Click extension icon again
                from helpers.extension_helper import ExtensionHelper
                ExtensionHelper.click_extension_icon_by_coordinates()
                time.sleep(2)

                # Find new popup window
                new_windows = set(driver.window_handles) - {windows['chatgpt']}
                new_popup = new_windows.pop()

                driver.switch_to.window(new_popup)
                harness.popup_window = new_popup

                print("[OK] Popup reopened")

                # Wait for load + health check
                time.sleep(3)

            # ========================================
            # VERIFY PROFILE PERSISTS
            # ========================================
            with allure.step('Verify profile still exists'):
                from pages.popup_page import PopupPage
                popup = PopupPage(driver)

                # Get selected profile
                selected_profile = popup.get_selected_profile()

                assert selected_profile == TEST_PROFILE['profileName'], \
                    f"Profile did not persist! Expected '{TEST_PROFILE['profileName']}', got '{selected_profile}'"

                print(f"[OK] Profile persisted: {selected_profile}")

                # Screenshot proof
                screenshot = driver.get_screenshot_as_png()
                allure.attach(
                    screenshot,
                    name='profile_persisted',
                    attachment_type=allure.attachment_type.PNG
                )

            # ========================================
            # CLEANUP
            # ========================================
            with allure.step('Cleanup: Delete profile and sign out'):
                harness.delete_test_profile(TEST_PROFILE['profileName'])
                harness.sign_out()

                print("[OK] Cleanup complete")

            print("\n[OK] Profile persistence test PASSED")

        except Exception as e:
            # Capture screenshot on failure
            screenshot = driver.get_screenshot_as_png()
            allure.attach(
                screenshot,
                name='test_failure',
                attachment_type=allure.attachment_type.PNG
            )
            raise

        finally:
            # Cleanup
            harness.cleanup()
