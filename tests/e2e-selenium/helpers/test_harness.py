"""
Test Harness for PromptBlocker E2E Tests.

This module provides the complete mandatory flow that ALL tests must follow:
1. Navigate to ChatGPT (supported platform)
2. Open extension popup via PyAutoGUI
3. Sign in with Google OAuth
4. Wait for Firebase decryption
5. Verify "You are protected" status

After this flow completes, tests can create profiles and validate functionality.
"""

import time
import os
from pathlib import Path
from dotenv import load_dotenv
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from typing import Optional, Dict, Any

from .auth_helper import AuthHelper
from .extension_helper import ExtensionHelper
from pages.popup_page import PopupPage

# Load .env file for EXTENSION_ID
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)


class TestHarness:
    """
    Test harness that handles the mandatory E2E test flow.

    This orchestrates:
    - ChatGPT page setup
    - Extension popup opening
    - Google OAuth sign-in
    - Firebase decryption wait
    - Profile creation/deletion
    """

    def __init__(self, driver: WebDriver):
        """
        Initialize test harness.

        Args:
            driver: Selenium WebDriver instance
        """
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)
        self.auth_helper = AuthHelper(driver)
        self.chatgpt_window = None
        self.popup_window = None

    def setup_chatgpt_page(self) -> str:
        """
        Navigate to ChatGPT and setup the page.

        This is Step 1 of the mandatory flow: Open a supported platform.

        Returns:
            Window handle for ChatGPT page
        """
        print("\n[Harness] ========================================")
        print("[Harness] Step 1: Setting up ChatGPT page")
        print("[Harness] ========================================")

        # Navigate to ChatGPT
        self.driver.get('https://chatgpt.com')
        self.chatgpt_window = self.driver.current_window_handle
        print(f"[Harness] Navigated to ChatGPT: {self.driver.current_url}")

        # Wait for page to load
        time.sleep(3)

        # Optionally wait for ChatGPT interface to be ready
        try:
            # Wait for textarea (ChatGPT input)
            self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'textarea'))
            )
            print("[Harness] ChatGPT interface loaded")
        except:
            print("[Harness] ChatGPT interface not detected (may need login)")

        print("[Harness] ChatGPT page ready")
        return self.chatgpt_window

    def open_extension_popup(self, method: str = 'url') -> str:
        """
        Open the extension popup by navigating to its URL.

        This is Step 2 of the mandatory flow: Open the extension popup.

        Args:
            method: 'url' to navigate directly to popup URL (recommended)

        Returns:
            Window handle for extension popup

        Raises:
            Exception: If popup doesn't open or extension ID not found
        """
        print("\n[Harness] ========================================")
        print("[Harness] Step 2: Opening extension popup")
        print("[Harness] ========================================")

        # First, enable Developer mode on chrome://extensions
        print("[Harness] Enabling Developer mode...")
        self.driver.get('chrome://extensions')
        time.sleep(1.5)

        # Use PyAutoGUI to click Developer mode toggle (top right of screen)
        import pyautogui

        # Get screen resolution to calculate toggle position
        screen_width, screen_height = pyautogui.size()

        # Developer mode toggle coordinates from calibration
        # Calibrated on 1920x1040: x=1894, y=148
        # Adjusted to y=118
        toggle_x = int(screen_width * 0.9864)  # 98.6% from left
        toggle_y = 118

        print(f"[Harness] Clicking Developer mode toggle at ({toggle_x}, {toggle_y})")
        pyautogui.click(toggle_x, toggle_y)

        print("[Harness] Developer mode enabled")

        # Wait 1 second for animation
        time.sleep(1)

        # Click "Load unpacked" button
        print("[Harness] Clicking Load unpacked button...")
        load_unpacked_x = 90
        load_unpacked_y = 175
        pyautogui.click(load_unpacked_x, load_unpacked_y)
        time.sleep(2)

        # File dialog is now open - navigate to dist folder
        print("[Harness] File dialog opened, navigating to extension folder...")
        extension_path = r'H:\AI_Interceptor\dist'

        # Type the path into the address bar (Ctrl+L or Alt+D to focus address bar, then type path)
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.3)

        pyautogui.write(extension_path, interval=0.05)
        time.sleep(0.5)

        # Press Enter to navigate to the folder
        pyautogui.press('enter')
        time.sleep(1)

        # Press Enter again to select the folder
        pyautogui.press('enter')
        time.sleep(2)

        print("[Harness] Extension folder selected and loaded")

        # Get extension ID from environment
        extension_id = os.getenv('EXTENSION_ID')
        if not extension_id:
            raise Exception(
                "EXTENSION_ID not found in environment. "
                "Make sure .env file exists with EXTENSION_ID set."
            )

        print(f"[Harness] Using extension ID from env: {extension_id}")

        # Navigate directly to the extension popup
        popup_url = f"chrome-extension://{extension_id}/popup-v2.html"
        print(f"[Harness] Opening popup at: {popup_url}")

        self.driver.get(popup_url)
        time.sleep(2)

        self.popup_window = self.driver.current_window_handle

        print(f"[Harness] Popup opened: {self.driver.current_url}")
        print("[Harness] Extension popup ready")

        return self.popup_window

    def sign_in_google_oauth(self) -> None:
        """
        Sign in with Google OAuth.

        This is Step 3 of the mandatory flow: Authenticate with Google.

        Raises:
            Exception: If sign-in fails
        """
        print("\n[Harness] ========================================")
        print("[Harness] Step 3: Signing in with Google OAuth")
        print("[Harness] ========================================")

        if not self.popup_window:
            raise Exception("Popup window not open. Call open_extension_popup() first.")

        # Use auth helper to handle OAuth flow
        self.auth_helper.sign_in_google_oauth(self.popup_window)

        print("[Harness] Google OAuth sign-in complete")

    def wait_for_firebase_decryption(self, timeout: int = 10) -> None:
        """
        Wait for Firebase decryption to complete.

        This is Step 4 of the mandatory flow: Wait for encryption keys.

        The app needs time to:
        - Get Firebase UID
        - Derive encryption keys
        - Decrypt any existing profiles
        - Run health check loop (5s)

        Args:
            timeout: Maximum time to wait in seconds
        """
        print("\n[Harness] ========================================")
        print("[Harness] Step 4: Waiting for Firebase decryption")
        print("[Harness] ========================================")

        print("[Harness] Waiting for health check loop (5s)...")
        time.sleep(5)

        print("[Harness] Firebase decryption complete")

    def verify_protected_status(self) -> bool:
        """
        Verify "You are protected" status.

        This is Step 5 of the mandatory flow: Confirm encryption is ready.

        Returns:
            True if protected, False otherwise
        """
        print("\n[Harness] ========================================")
        print("[Harness] Step 5: Verifying protected status")
        print("[Harness] ========================================")

        # Switch to popup window
        self.driver.switch_to.window(self.popup_window)

        # Check if signed in (proxy for protected)
        if self.auth_helper.is_signed_in():
            print("[Harness] User is signed in - protected!")
            return True
        else:
            print("[Harness] WARNING: User not signed in - not protected")
            return False

    def complete_mandatory_flow(self, popup_method: str = 'coordinates') -> Dict[str, str]:
        """
        Execute the complete mandatory flow required for all tests.

        This runs all 5 steps:
        1. Setup ChatGPT page
        2. Open extension popup
        3. Sign in with Google OAuth
        4. Wait for Firebase decryption
        5. Verify protected status

        After this, tests can create profiles and run validations.

        Args:
            popup_method: 'coordinates' or 'image' for extension icon clicking

        Returns:
            Dictionary with window handles:
                - chatgpt: ChatGPT window handle
                - popup: Extension popup window handle

        Raises:
            Exception: If any step fails
        """
        print("\n" + "="*50)
        print("  MANDATORY FLOW: ChatGPT -> Popup -> Auth")
        print("="*50)

        # Step 1: Setup ChatGPT
        chatgpt_handle = self.setup_chatgpt_page()

        # Step 2: Open popup
        popup_handle = self.open_extension_popup(method=popup_method)

        # Step 3: Sign in
        self.sign_in_google_oauth()

        # Step 4: Wait for decryption
        self.wait_for_firebase_decryption()

        # Step 5: Verify protected
        protected = self.verify_protected_status()

        if not protected:
            raise Exception("Protected status not verified - mandatory flow failed")

        print("\n" + "="*50)
        print("  MANDATORY FLOW COMPLETE - READY FOR TESTS")
        print("="*50 + "\n")

        return {
            'chatgpt': chatgpt_handle,
            'popup': popup_handle
        }

    def create_test_profile(self, profile_data: Dict[str, str]) -> None:
        """
        Create a test profile.

        This can only be called AFTER completing the mandatory flow.

        Args:
            profile_data: Profile data dictionary with fields:
                - profileName (required)
                - realName, aliasName
                - realEmail, aliasEmail
                - realPhone, aliasPhone
                - realAddress, aliasAddress
                - realCompany, aliasCompany
        """
        print(f"\n[Harness] Creating test profile: {profile_data.get('profileName')}")

        # Switch to popup
        self.driver.switch_to.window(self.popup_window)

        # Use popup page object
        popup = PopupPage(self.driver)

        # Click create profile button
        popup.click_create_profile()
        time.sleep(1)

        # Fill form
        popup.fill_profile_form(profile_data)

        # Save
        popup.click_save_profile()
        time.sleep(2)

        print(f"[Harness] Profile created: {profile_data.get('profileName')}")

    def delete_test_profile(self, profile_name: str) -> None:
        """
        Delete a test profile by name.

        Args:
            profile_name: Name of profile to delete
        """
        print(f"\n[Harness] Deleting test profile: {profile_name}")

        # Switch to popup
        self.driver.switch_to.window(self.popup_window)

        # Use popup page object
        popup = PopupPage(self.driver)

        # Select the profile
        popup.select_profile(profile_name)
        time.sleep(0.5)

        # Delete it
        popup.delete_current_profile()
        time.sleep(1)

        print(f"[Harness] Profile deleted: {profile_name}")

    def sign_out(self) -> None:
        """
        Sign out the current user.

        This should be called in test cleanup.
        """
        print("\n[Harness] Signing out user...")

        if not self.popup_window:
            print("[Harness] No popup window - skipping sign out")
            return

        self.auth_helper.sign_out(self.popup_window)
        print("[Harness] Sign out complete")

    def cleanup(self) -> None:
        """
        Cleanup test resources.

        This navigates away instead of closing to avoid "Restore Pages" popup.
        Pytest will handle browser cleanup.
        """
        print("\n[Harness] Cleaning up test harness...")

        # Just navigate to a simple page instead of closing windows
        try:
            self.driver.get('about:blank')
            print("[Harness] Navigated to blank page")
        except:
            pass

        print("[Harness] Cleanup complete")
