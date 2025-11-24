"""
Base Page Object class for all page objects.

This provides common functionality that all page objects inherit:
- Element finding with waits
- Clicking, typing, getting text
- Screenshot capture
- JavaScript execution
"""

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from typing import Tuple, Optional
import time


class BasePage:
    """
    Base class for all Page Objects.

    All page classes should inherit from this to get common functionality.

    Example:
        ```python
        class PopupPage(BasePage):
            SIGN_IN_BTN = (By.ID, 'headerSignInBtn')

            def click_sign_in(self):
                self.click(self.SIGN_IN_BTN)
        ```
    """

    def __init__(self, driver: WebDriver, timeout: int = 10):
        """
        Initialize the base page.

        Args:
            driver: Selenium WebDriver instance
            timeout: Default timeout for waits in seconds
        """
        self.driver = driver
        self.timeout = timeout
        self.wait = WebDriverWait(driver, timeout)

    # ========================================
    # Element Finding
    # ========================================

    def find_element(self, locator: Tuple[By, str]) -> WebElement:
        """
        Find a single element with wait.

        Args:
            locator: Tuple of (By, selector)

        Returns:
            WebElement: Found element

        Example:
            element = self.find_element((By.ID, 'myButton'))
        """
        return self.wait.until(
            EC.presence_of_element_located(locator),
            message=f"Element not found: {locator}"
        )

    def find_elements(self, locator: Tuple[By, str]) -> list[WebElement]:
        """
        Find multiple elements.

        Args:
            locator: Tuple of (By, selector)

        Returns:
            list: List of WebElements (may be empty)
        """
        return self.driver.find_elements(*locator)

    def find_visible_element(self, locator: Tuple[By, str]) -> WebElement:
        """
        Find an element and wait until it's visible.

        Args:
            locator: Tuple of (By, selector)

        Returns:
            WebElement: Visible element
        """
        return self.wait.until(
            EC.visibility_of_element_located(locator),
            message=f"Element not visible: {locator}"
        )

    def find_clickable_element(self, locator: Tuple[By, str]) -> WebElement:
        """
        Find an element and wait until it's clickable.

        Args:
            locator: Tuple of (By, selector)

        Returns:
            WebElement: Clickable element
        """
        return self.wait.until(
            EC.element_to_be_clickable(locator),
            message=f"Element not clickable: {locator}"
        )

    # ========================================
    # Element Interactions
    # ========================================

    def click(self, locator: Tuple[By, str], wait_after: float = 0.5):
        """
        Click an element after waiting for it to be clickable.

        Args:
            locator: Tuple of (By, selector)
            wait_after: Seconds to wait after clicking
        """
        element = self.find_clickable_element(locator)
        element.click()
        if wait_after:
            time.sleep(wait_after)

    def type(self, locator: Tuple[By, str], text: str, clear_first: bool = True):
        """
        Type text into an input field.

        Args:
            locator: Tuple of (By, selector)
            text: Text to type
            clear_first: Whether to clear existing text first
        """
        element = self.find_visible_element(locator)
        if clear_first:
            element.clear()
        element.send_keys(text)

    def get_text(self, locator: Tuple[By, str]) -> str:
        """
        Get text content of an element.

        Args:
            locator: Tuple of (By, selector)

        Returns:
            str: Element text
        """
        element = self.find_visible_element(locator)
        return element.text

    def get_attribute(self, locator: Tuple[By, str], attribute: str) -> str:
        """
        Get an attribute value from an element.

        Args:
            locator: Tuple of (By, selector)
            attribute: Attribute name

        Returns:
            str: Attribute value
        """
        element = self.find_element(locator)
        return element.get_attribute(attribute)

    # ========================================
    # Element State Checks
    # ========================================

    def is_element_present(self, locator: Tuple[By, str]) -> bool:
        """
        Check if element exists in DOM (may not be visible).

        Args:
            locator: Tuple of (By, selector)

        Returns:
            bool: True if element exists
        """
        try:
            self.driver.find_element(*locator)
            return True
        except:
            return False

    def is_element_visible(self, locator: Tuple[By, str], timeout: Optional[int] = None) -> bool:
        """
        Check if element is visible.

        Args:
            locator: Tuple of (By, selector)
            timeout: Override default timeout

        Returns:
            bool: True if element is visible
        """
        try:
            wait = WebDriverWait(self.driver, timeout or self.timeout)
            wait.until(EC.visibility_of_element_located(locator))
            return True
        except:
            return False

    def is_element_clickable(self, locator: Tuple[By, str]) -> bool:
        """
        Check if element is clickable.

        Args:
            locator: Tuple of (By, selector)

        Returns:
            bool: True if element is clickable
        """
        try:
            self.wait.until(EC.element_to_be_clickable(locator))
            return True
        except:
            return False

    def wait_for_element_to_disappear(self, locator: Tuple[By, str], timeout: Optional[int] = None):
        """
        Wait for an element to disappear (become invisible or removed from DOM).

        Args:
            locator: Tuple of (By, selector)
            timeout: Override default timeout
        """
        wait = WebDriverWait(self.driver, timeout or self.timeout)
        wait.until(
            EC.invisibility_of_element_located(locator),
            message=f"Element did not disappear: {locator}"
        )

    # ========================================
    # JavaScript Execution
    # ========================================

    def execute_script(self, script: str, *args):
        """
        Execute JavaScript code.

        Args:
            script: JavaScript code to execute
            *args: Arguments to pass to script

        Returns:
            Result of script execution

        Example:
            result = self.execute_script("return document.title")
        """
        return self.driver.execute_script(script, *args)

    def scroll_to_element(self, locator: Tuple[By, str]):
        """
        Scroll element into view.

        Args:
            locator: Tuple of (By, selector)
        """
        element = self.find_element(locator)
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
        time.sleep(0.3)  # Wait for scroll animation

    # ========================================
    # Page Navigation
    # ========================================

    def navigate_to(self, url: str):
        """
        Navigate to a URL.

        Args:
            url: URL to navigate to
        """
        self.driver.get(url)

    def refresh_page(self):
        """Refresh the current page."""
        self.driver.refresh()

    def get_current_url(self) -> str:
        """
        Get current page URL.

        Returns:
            str: Current URL
        """
        return self.driver.current_url

    def get_page_title(self) -> str:
        """
        Get page title.

        Returns:
            str: Page title
        """
        return self.driver.title

    # ========================================
    # Utility Methods
    # ========================================

    def wait(self, seconds: float):
        """
        Simple sleep/wait.

        Args:
            seconds: Time to wait
        """
        time.sleep(seconds)

    def take_screenshot(self, filename: str):
        """
        Take a screenshot and save to file.

        Args:
            filename: Path to save screenshot
        """
        self.driver.save_screenshot(filename)

    def switch_to_window(self, window_index: int = -1):
        """
        Switch to a different browser window/tab.

        Args:
            window_index: Index of window to switch to (-1 for latest)
        """
        windows = self.driver.window_handles
        self.driver.switch_to.window(windows[window_index])

    def close_current_window(self):
        """Close the current window/tab."""
        self.driver.close()

    # ========================================
    # Wait Conditions
    # ========================================

    def wait_for_page_load(self, timeout: Optional[int] = None):
        """
        Wait for page to finish loading.

        Args:
            timeout: Override default timeout
        """
        wait = WebDriverWait(self.driver, timeout or self.timeout)
        wait.until(
            lambda driver: driver.execute_script("return document.readyState") == "complete"
        )

    def wait_for_url_to_contain(self, text: str, timeout: Optional[int] = None):
        """
        Wait for URL to contain specific text.

        Args:
            text: Text to wait for in URL
            timeout: Override default timeout
        """
        wait = WebDriverWait(self.driver, timeout or self.timeout)
        wait.until(EC.url_contains(text))

    def wait_for_title_to_contain(self, text: str, timeout: Optional[int] = None):
        """
        Wait for page title to contain specific text.

        Args:
            text: Text to wait for in title
            timeout: Override default timeout
        """
        wait = WebDriverWait(self.driver, timeout or self.timeout)
        wait.until(EC.title_contains(text))
