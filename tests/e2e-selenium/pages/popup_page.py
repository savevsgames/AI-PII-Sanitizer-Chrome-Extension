"""
Popup Page Object for PromptBlocker extension.

This Page Object encapsulates all interactions with the extension popup,
including authentication, profile management, and settings.
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webelement import WebElement
from typing import Optional
import time
from .base_page import BasePage


class PopupPage(BasePage):
    """
    Page Object for the PromptBlocker extension popup.

    Usage:
        popup = PopupPage(driver)
        popup.wait_for_popup_load()
        popup.click_sign_in()
    """

    # ========================================
    # Locators
    # ========================================

    # Header elements
    HEADER_SIGN_IN_BTN = (By.ID, 'headerSignInBtn')
    HEADER_SIGN_OUT_BTN = (By.ID, 'headerSignOutBtn')
    HEADER_USER_EMAIL = (By.CSS_SELECTOR, '[data-testid="user-email"]')

    # Profile section
    PROFILE_SELECT = (By.ID, 'profileSelect')
    CREATE_PROFILE_BTN = (By.ID, 'createProfileBtn')
    EDIT_PROFILE_BTN = (By.CSS_SELECTOR, '[data-action="edit-profile"]')
    DELETE_PROFILE_BTN = (By.CSS_SELECTOR, '[data-action="delete-profile"]')

    # Profile form (when creating/editing)
    PROFILE_NAME_INPUT = (By.ID, 'profileName')
    REAL_NAME_INPUT = (By.ID, 'realName')
    ALIAS_NAME_INPUT = (By.ID, 'aliasName')
    REAL_EMAIL_INPUT = (By.ID, 'realEmail')
    ALIAS_EMAIL_INPUT = (By.ID, 'aliasEmail')
    REAL_PHONE_INPUT = (By.ID, 'realPhone')
    ALIAS_PHONE_INPUT = (By.ID, 'aliasPhone')
    REAL_ADDRESS_INPUT = (By.ID, 'realAddress')
    ALIAS_ADDRESS_INPUT = (By.ID, 'aliasAddress')
    REAL_COMPANY_INPUT = (By.ID, 'realCompany')
    ALIAS_COMPANY_INPUT = (By.ID, 'aliasCompany')
    SAVE_PROFILE_BTN = (By.ID, 'saveProfileBtn')
    CANCEL_PROFILE_BTN = (By.ID, 'cancelProfileBtn')

    # Toggle switch
    MASTER_TOGGLE = (By.ID, 'masterToggle')

    # Status indicators
    STATUS_INDICATOR = (By.CSS_SELECTOR, '[data-testid="status-indicator"]')
    LOADING_SPINNER = (By.CSS_SELECTOR, '.loading-spinner')

    # ========================================
    # Page Actions
    # ========================================

    def wait_for_popup_load(self, timeout: int = 10) -> None:
        """
        Wait for the popup to fully load.

        Args:
            timeout: Maximum wait time in seconds
        """
        # Wait for the sign-in button or user email to appear
        try:
            self.wait.until(
                lambda d: self.is_element_present(self.HEADER_SIGN_IN_BTN) or
                         self.is_element_present(self.HEADER_USER_EMAIL)
            )
            # Wait for any loading spinners to disappear
            time.sleep(0.5)
        except:
            pass

    # ========================================
    # Authentication Actions
    # ========================================

    def is_signed_in(self) -> bool:
        """
        Check if user is currently signed in.

        Returns:
            True if signed in, False otherwise
        """
        return self.is_element_present(self.HEADER_SIGN_OUT_BTN)

    def is_signed_out(self) -> bool:
        """
        Check if user is currently signed out.

        Returns:
            True if signed out, False otherwise
        """
        return self.is_element_present(self.HEADER_SIGN_IN_BTN)

    def click_sign_in(self) -> None:
        """Click the sign-in button to initiate Google OAuth."""
        self.click(self.HEADER_SIGN_IN_BTN)

    def click_sign_out(self) -> None:
        """Click the sign-out button."""
        self.click(self.HEADER_SIGN_OUT_BTN)

    def get_user_email(self) -> Optional[str]:
        """
        Get the displayed user email (if signed in).

        Returns:
            User email string or None if not signed in
        """
        try:
            element = self.find_visible_element(self.HEADER_USER_EMAIL)
            return element.text
        except:
            return None

    # ========================================
    # Profile Actions
    # ========================================

    def click_create_profile(self) -> None:
        """Click the create profile button."""
        self.click(self.CREATE_PROFILE_BTN)

    def fill_profile_form(self, profile_data: dict) -> None:
        """
        Fill out the profile form with given data.

        Args:
            profile_data: Dictionary with profile fields:
                - profileName
                - realName, aliasName
                - realEmail, aliasEmail
                - realPhone, aliasPhone
                - realAddress, aliasAddress
                - realCompany, aliasCompany
        """
        # Profile name (required)
        self.type(self.PROFILE_NAME_INPUT, profile_data.get('profileName', ''))

        # Name fields
        if 'realName' in profile_data:
            self.type(self.REAL_NAME_INPUT, profile_data['realName'])
        if 'aliasName' in profile_data:
            self.type(self.ALIAS_NAME_INPUT, profile_data['aliasName'])

        # Email fields
        if 'realEmail' in profile_data:
            self.type(self.REAL_EMAIL_INPUT, profile_data['realEmail'])
        if 'aliasEmail' in profile_data:
            self.type(self.ALIAS_EMAIL_INPUT, profile_data['aliasEmail'])

        # Phone fields
        if 'realPhone' in profile_data:
            self.type(self.REAL_PHONE_INPUT, profile_data['realPhone'])
        if 'aliasPhone' in profile_data:
            self.type(self.ALIAS_PHONE_INPUT, profile_data['aliasPhone'])

        # Address fields
        if 'realAddress' in profile_data:
            self.type(self.REAL_ADDRESS_INPUT, profile_data['realAddress'])
        if 'aliasAddress' in profile_data:
            self.type(self.ALIAS_ADDRESS_INPUT, profile_data['aliasAddress'])

        # Company fields
        if 'realCompany' in profile_data:
            self.type(self.REAL_COMPANY_INPUT, profile_data['realCompany'])
        if 'aliasCompany' in profile_data:
            self.type(self.ALIAS_COMPANY_INPUT, profile_data['aliasCompany'])

    def click_save_profile(self) -> None:
        """Click the save profile button."""
        self.click(self.SAVE_PROFILE_BTN)
        # Wait for save to complete
        time.sleep(1)

    def click_cancel_profile(self) -> None:
        """Click the cancel button in profile form."""
        self.click(self.CANCEL_PROFILE_BTN)

    def select_profile(self, profile_name: str) -> None:
        """
        Select a profile from the dropdown.

        Args:
            profile_name: Name of the profile to select
        """
        select_element = self.find_element(self.PROFILE_SELECT)
        from selenium.webdriver.support.ui import Select
        select = Select(select_element)
        select.select_by_visible_text(profile_name)
        time.sleep(0.5)

    def get_selected_profile(self) -> Optional[str]:
        """
        Get the currently selected profile name.

        Returns:
            Profile name or None
        """
        try:
            select_element = self.find_element(self.PROFILE_SELECT)
            from selenium.webdriver.support.ui import Select
            select = Select(select_element)
            return select.first_selected_option.text
        except:
            return None

    def delete_current_profile(self) -> None:
        """Delete the currently selected profile."""
        self.click(self.DELETE_PROFILE_BTN)
        # Confirm deletion if there's a confirmation dialog
        time.sleep(0.5)
        # Handle confirmation (if any)
        # TODO: Add confirmation dialog handling if needed

    # ========================================
    # Toggle Actions
    # ========================================

    def is_enabled(self) -> bool:
        """
        Check if the master toggle is enabled.

        Returns:
            True if enabled, False otherwise
        """
        toggle = self.find_element(self.MASTER_TOGGLE)
        return toggle.is_selected() or 'checked' in toggle.get_attribute('class')

    def click_master_toggle(self) -> None:
        """Click the master enable/disable toggle."""
        self.click(self.MASTER_TOGGLE)
        time.sleep(0.5)

    # ========================================
    # Helper Methods
    # ========================================

    def take_screenshot(self, filename: str) -> None:
        """
        Take a screenshot of the popup.

        Args:
            filename: Name for the screenshot file
        """
        from pathlib import Path
        screenshot_dir = Path(__file__).parent.parent / 'reports' / 'screenshots'
        screenshot_dir.mkdir(parents=True, exist_ok=True)

        filepath = screenshot_dir / f'{filename}.png'
        self.driver.save_screenshot(str(filepath))
