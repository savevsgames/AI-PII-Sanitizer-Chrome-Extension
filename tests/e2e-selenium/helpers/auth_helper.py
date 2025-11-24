"""
Authentication Helper for PromptBlocker E2E Tests.

This module handles the mandatory authentication flow required for all tests:
1. Navigate to ChatGPT (supported platform)
2. Open extension popup
3. Sign in with Google OAuth
4. Wait for Firebase decryption
5. Verify "You are protected" status
6. Now ready to create profiles and test

CRITICAL: All tests MUST follow this pattern because the app requires Firebase
authentication to get the UID for encryption key material. Without auth, profile
creation will fail.

Test Pattern:
    - ChatGPT → Popup → Sign in → Wait decrypt → Create profile
    - Run your tests
    - Delete profile → Sign out

Alternate Pattern (for persistence tests):
    - Create profile → Delete → Sign out
    - Restart → Sign in → Verify profile persists from local Chrome storage
"""

import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchWindowException
from typing import Optional


class AuthHelper:
    """
    Helper class for handling Google OAuth authentication flow.

    This handles the complex window switching and Google OAuth interaction
    required to authenticate with Firebase.
    """

    def __init__(self, driver):
        """
        Initialize AuthHelper.

        Args:
            driver: Selenium WebDriver instance
        """
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def sign_in_google_oauth(self, popup_window_handle: str) -> None:
        """
        Complete Google OAuth sign-in flow.

        This method handles:
        1. Clicking Google sign-in button in popup
        2. Switching to Google OAuth popup window
        3. Entering email and password
        4. Waiting for OAuth completion
        5. Switching back to extension popup
        6. Verifying sign-in success

        Args:
            popup_window_handle: Window handle of the extension popup

        Raises:
            ValueError: If TEST_USER_EMAIL or TEST_USER_PASSWORD not set
            TimeoutException: If OAuth flow times out
        """
        test_email = os.getenv('TEST_USER_EMAIL')
        test_password = os.getenv('TEST_USER_PASSWORD')

        if not test_email or not test_password:
            raise ValueError(
                "Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in .env.test.local\n"
                "E2E authentication tests require real Google OAuth credentials."
            )

        print(f"[Auth] Signing in test user: {test_email}")

        try:
            # Step 1: Switch to popup window
            self.driver.switch_to.window(popup_window_handle)
            print("[Auth] Switched to popup window")

            # Step 2: Click sign-in button
            sign_in_btn = self.wait.until(
                EC.element_to_be_clickable((By.ID, 'headerSignInBtn'))
            )
            sign_in_btn.click()
            print("[Auth] Clicked sign-in button")
            time.sleep(1)

            # Step 3: Wait for auth modal
            self.wait.until(
                EC.visibility_of_element_located((By.ID, 'authModal'))
            )
            print("[Auth] Auth modal opened")

            # Step 4: Click Google sign-in button
            google_btn = self.wait.until(
                EC.element_to_be_clickable((By.ID, 'googleSignInBtn'))
            )
            google_btn.click()
            print("[Auth] Clicked Google sign-in button")
            time.sleep(2)  # Wait for OAuth popup to open

            # Step 5: Switch to Google OAuth popup window
            # The OAuth popup will be the newest window
            original_windows = [popup_window_handle]
            new_window = None

            # Wait for new window to open
            for i in range(10):  # Try for 10 seconds
                all_windows = self.driver.window_handles
                for window in all_windows:
                    if window not in original_windows:
                        new_window = window
                        break
                if new_window:
                    break
                time.sleep(1)

            if not new_window:
                raise TimeoutException("Google OAuth popup did not open")

            self.driver.switch_to.window(new_window)
            print(f"[Auth] Switched to Google OAuth popup: {self.driver.current_url}")

            # Step 6: Enter email
            try:
                email_input = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="email"]'))
                )
                email_input.clear()
                email_input.send_keys(test_email)
                print("[Auth] Email entered")

                # Click "Next" button
                next_btn = self.driver.find_element(By.ID, 'identifierNext')
                next_btn.click()
                time.sleep(2)
                print("[Auth] Clicked 'Next' after email")

            except Exception as e:
                print(f"[Auth] Failed to enter email: {e}")
                self.driver.save_screenshot('reports/screenshots/oauth-email-failed.png')
                raise

            # Step 7: Enter password
            try:
                password_input = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="password"]'))
                )
                password_input.clear()
                password_input.send_keys(test_password)
                print("[Auth] Password entered")

                # Click "Next" button
                next_btn = self.driver.find_element(By.ID, 'passwordNext')
                next_btn.click()
                print("[Auth] Clicked 'Next' after password")

            except Exception as e:
                print(f"[Auth] Failed to enter password: {e}")
                self.driver.save_screenshot('reports/screenshots/oauth-password-failed.png')
                raise

            # Step 8: Wait for OAuth to complete (popup will close)
            time.sleep(3)

            # Step 9: Switch back to popup window
            try:
                self.driver.switch_to.window(popup_window_handle)
                print("[Auth] Switched back to popup window")
            except NoSuchWindowException:
                # OAuth popup might still be open, wait and try again
                time.sleep(2)
                self.driver.switch_to.window(popup_window_handle)

            # Step 10: Verify sign-in success
            try:
                user_profile = WebDriverWait(self.driver, 10).until(
                    EC.visibility_of_element_located((By.ID, 'headerUserProfileContainer'))
                )
                print("[Auth] User profile container visible - signed in!")

            except TimeoutException:
                self.driver.save_screenshot('reports/screenshots/signin-verification-failed.png')
                raise TimeoutException(
                    "Sign-in verification failed: User profile container did not appear"
                )

            # Step 11: Wait for Firebase decryption (CRITICAL)
            # The app needs time to decrypt existing profiles from Firebase
            print("[Auth] Waiting for Firebase decryption...")
            time.sleep(5)  # 5-second health check loop

            print("[Auth] Test user signed in successfully!")

        except Exception as e:
            print(f"[Auth] Sign-in failed: {e}")
            raise

    def wait_for_protected_status(self, timeout: int = 10) -> bool:
        """
        Wait for "You are protected" status indicator.

        After successful sign-in and Firebase decryption, the extension
        should show a "You are protected" status.

        Args:
            timeout: Maximum time to wait in seconds

        Returns:
            True if protected status appears, False otherwise
        """
        try:
            # Look for status indicator element
            # Adjust selector based on actual implementation
            status = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="protected-status"]'))
            )
            print("[Auth] 'You are protected' status confirmed")
            return True
        except TimeoutException:
            print("[Auth] WARNING: Protected status not found")
            return False

    def sign_out(self, popup_window_handle: str) -> None:
        """
        Sign out the current user.

        Args:
            popup_window_handle: Window handle of the extension popup
        """
        print("[Auth] Signing out...")

        try:
            # Switch to popup window
            self.driver.switch_to.window(popup_window_handle)

            # Click sign-out button
            sign_out_btn = self.wait.until(
                EC.element_to_be_clickable((By.ID, 'headerSignOutBtn'))
            )
            sign_out_btn.click()
            print("[Auth] Clicked sign-out button")

            # Wait for sign-out to complete
            time.sleep(2)

            # Verify sign-in button reappears
            self.wait.until(
                EC.visibility_of_element_located((By.ID, 'headerSignInBtn'))
            )
            print("[Auth] Sign-out successful")

        except Exception as e:
            print(f"[Auth] Sign-out failed: {e}")
            raise

    def is_signed_in(self) -> bool:
        """
        Check if user is currently signed in.

        Returns:
            True if signed in, False otherwise
        """
        try:
            self.driver.find_element(By.ID, 'headerUserProfileContainer')
            return True
        except:
            return False

    def is_signed_out(self) -> bool:
        """
        Check if user is currently signed out.

        Returns:
            True if signed out, False otherwise
        """
        try:
            self.driver.find_element(By.ID, 'headerSignInBtn')
            return True
        except:
            return False
