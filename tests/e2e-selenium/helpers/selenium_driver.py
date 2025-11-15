"""
Selenium WebDriver Manager for Chrome Extension Testing.

This module provides a centralized way to create and configure
Chrome WebDriver instances with the PromptBlocker extension loaded.
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager as WDM
import os
from pathlib import Path


class ChromeDriverManager:
    """
    Manager class for creating Selenium WebDriver instances
    configured for Chrome extension testing.
    """

    @staticmethod
    def get_driver(extension_path: str, headless: bool = False, user_data_dir: str = None):
        """
        Create and configure a Chrome WebDriver with extension loaded.

        Args:
            extension_path: Absolute path to the unpacked extension directory
            headless: Whether to run in headless mode (NOT recommended for extensions)
            user_data_dir: Custom user data directory for Chrome profile persistence

        Returns:
            WebDriver: Configured Chrome driver instance

        Example:
            ```python
            driver = ChromeDriverManager.get_driver('/path/to/dist')
            driver.get('https://chatgpt.com')
            # ... do testing ...
            driver.quit()
            ```
        """
        options = Options()

        # ========================================
        # Extension Configuration
        # ========================================

        # Load unpacked extension
        options.add_argument(f'--load-extension={extension_path}')
        print(f"[Driver] Loading extension from: {extension_path}")

        # ========================================
        # Browser Configuration
        # ========================================

        # Headless mode (WARNING: Extensions don't work well in headless)
        if headless:
            print("[Driver] WARNING: Extensions may not work properly in headless mode!")
            options.add_argument('--headless=new')  # Use new headless mode

        # Window size
        options.add_argument('--start-maximized')
        # OR set specific size:
        # options.add_argument('--window-size=1920,1080')

        # Disable automation flags (helps avoid detection)
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)

        # Disable password save prompts
        prefs = {
            "credentials_enable_service": False,
            "profile.password_manager_enabled": False
        }
        options.add_experimental_option("prefs", prefs)

        # ========================================
        # User Data Directory (Session Persistence)
        # ========================================

        if user_data_dir:
            options.add_argument(f'--user-data-dir={user_data_dir}')
            print(f"[Driver] Using user data dir: {user_data_dir}")
        else:
            # Use default temporary profile
            temp_profile = Path(__file__).parent.parent / 'chrome_profile'
            temp_profile.mkdir(exist_ok=True)
            options.add_argument(f'--user-data-dir={temp_profile}')
            print(f"[Driver] Using temporary profile: {temp_profile}")

        # ========================================
        # Performance & Stability
        # ========================================

        # Disable GPU (can help with stability)
        # options.add_argument('--disable-gpu')

        # Disable shared memory (useful for Docker/CI)
        # options.add_argument('--disable-dev-shm-usage')

        # No sandbox (useful for Docker/CI, less secure)
        # options.add_argument('--no-sandbox')

        # ========================================
        # Logging
        # ========================================

        # Reduce Chrome logs
        options.add_argument('--log-level=3')  # Only show fatal errors

        # Or enable verbose logging for debugging:
        # options.add_argument('--enable-logging')
        # options.add_argument('--v=1')

        # ========================================
        # Create Driver
        # ========================================

        try:
            # Use webdriver-manager to automatically download/manage ChromeDriver
            service = Service(WDM().install())

            driver = webdriver.Chrome(service=service, options=options)

            print("[Driver] Chrome driver created successfully")

            # Set implicit wait (default timeout for element finding)
            driver.implicitly_wait(10)

            # Set page load timeout
            driver.set_page_load_timeout(60)

            return driver

        except Exception as e:
            print(f"[Driver] Failed to create driver: {e}")
            raise

    @staticmethod
    def get_extension_id(driver):
        """
        Get the extension ID from the loaded extension.

        This is useful for navigating directly to extension pages.

        Args:
            driver: Active WebDriver instance

        Returns:
            str: Extension ID (e.g., 'abcd1234...')

        Example:
            ```python
            ext_id = ChromeDriverManager.get_extension_id(driver)
            driver.get(f'chrome-extension://{ext_id}/popup-v2.html')
            ```
        """
        # Navigate to chrome://extensions
        driver.get('chrome://extensions')

        # Enable developer mode to see extension IDs
        # Note: This requires using execute_script to interact with shadow DOM

        # For now, return None - extension ID can be found manually
        # or via browser console: chrome.runtime.id
        print("[Driver] Extension ID detection not implemented yet")
        print("[Driver] You can get it from chrome://extensions or browser console")
        return None


# Example usage
if __name__ == '__main__':
    """
    Quick test to verify driver setup works.

    Run this file directly to test:
    python helpers/selenium_driver.py
    """
    import time

    print("=" * 50)
    print("Testing Selenium Driver Setup")
    print("=" * 50)

    # Get extension path (adjust as needed)
    extension_path = str(Path(__file__).parent.parent.parent.parent / 'dist')

    if not Path(extension_path).exists():
        print(f"Extension not found at: {extension_path}")
        print("   Please build the extension first: npm run build")
        exit(1)

    print(f"Extension found at: {extension_path}")

    # Create driver
    driver = ChromeDriverManager.get_driver(extension_path)

    try:
        # Navigate to a test page
        print("\nNavigating to ChatGPT...")
        driver.get('https://chatgpt.com')

        print("Page loaded!")
        print(f"   Title: {driver.title}")

        # Wait a bit to see the browser
        print("\nWaiting 5 seconds (you should see Chrome with extension)...")
        time.sleep(5)

        print("\nTest completed successfully!")

    finally:
        print("\nClosing browser...")
        driver.quit()
        print("Done!")
