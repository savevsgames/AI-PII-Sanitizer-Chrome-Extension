"""
Helpers package for Selenium E2E tests.

This package provides reusable utilities for:
- Selenium WebDriver management
- Extension icon clicking (PyAutoGUI)
- Common test operations
"""

from .selenium_driver import ChromeDriverManager
from .extension_helper import ExtensionHelper

__all__ = ['ChromeDriverManager', 'ExtensionHelper']
