"""
pytest configuration and global fixtures for Selenium E2E tests.

This file provides shared fixtures that are available to all tests:
- driver: Selenium WebDriver with extension loaded
- extension_path: Path to the built extension
- test_profile_data: Standard test profile data
- test_credentials: Test user credentials
"""

import pytest
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import allure

# Add helpers to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables
load_dotenv(Path(__file__).parent.parent.parent / '.env.test.local')

# Import helpers
from helpers.selenium_driver import ChromeDriverManager
# from helpers.extension_helper import ExtensionHelper


@pytest.fixture(scope='session')
def extension_path():
    """
    Path to the built extension directory.

    Returns:
        str: Absolute path to dist/ folder
    """
    project_root = Path(__file__).parent.parent.parent
    ext_path = project_root / 'dist'

    if not ext_path.exists():
        pytest.fail(
            f"Extension not found at {ext_path}\n"
            "Please build the extension first: npm run build"
        )

    return str(ext_path.absolute())


@pytest.fixture(scope='session')
def test_credentials():
    """
    Test user credentials from environment variables.

    Returns:
        dict: Email and password for test user
    """
    email = os.getenv('TEST_USER_EMAIL')
    password = os.getenv('TEST_USER_PASSWORD')

    if not email or not password:
        pytest.fail(
            "Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in .env.test.local\n"
            "E2E tests require real Google OAuth credentials."
        )

    return {
        'email': email,
        'password': password
    }


@pytest.fixture(scope='function')
def test_profile_data():
    """
    Standard test profile data.

    Returns:
        dict: Profile data for testing
    """
    return {
        'profileName': 'E2E Test Profile',
        'realName': 'John Smith',
        'aliasName': 'Alex Johnson',
        'realEmail': 'john.smith@testmail.com',
        'aliasEmail': 'alex.johnson@testmail.com',
        'realPhone': '+1 555-0100',
        'aliasPhone': '+1 555-0999',
        'realAddress': '123 Main Street, Anytown, CA 90210',
        'aliasAddress': '456 Oak Avenue, Somewhere, NY 10001',
        'realCompany': 'TestCorp Inc',
        'aliasCompany': 'SampleCorp LLC'
    }


@pytest.fixture(scope='function')
def test_messages():
    """
    Test messages with PII for substitution testing.

    Returns:
        dict: Various test messages
    """
    return {
        'nameOnly': 'My name is John Smith',
        'emailOnly': 'Contact me at john.smith@testmail.com',
        'phoneOnly': 'Call me at +1 555-0100',
        'multiField': 'I am John Smith, email john.smith@testmail.com, phone +1 555-0100',
        'allFields': (
            'Hi, I\'m John Smith from TestCorp Inc. '
            'Reach me at john.smith@testmail.com or +1 555-0100. '
            'Address: 123 Main Street, Anytown, CA 90210.'
        )
    }


@pytest.fixture(scope='function')
def driver(extension_path):
    """
    Selenium WebDriver with extension loaded.

    This fixture:
    1. Creates a Chrome driver
    2. Loads the extension
    3. Yields the driver to the test
    4. Quits the driver after the test

    Args:
        extension_path: Path to extension (from session fixture)

    Yields:
        WebDriver: Configured Chrome driver
    """
    # Import here to avoid circular imports
    from helpers.selenium_driver import ChromeDriverManager

    driver = ChromeDriverManager.get_driver(extension_path)

    yield driver

    # Cleanup
    try:
        driver.quit()
    except Exception as e:
        print(f"Warning: Error quitting driver: {e}")


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    Hook to attach screenshots to Allure reports on test failure.

    This automatically captures a screenshot when a test fails
    and attaches it to the Allure report.
    """
    outcome = yield
    report = outcome.get_result()

    if report.when == 'call' and report.failed:
        # Get the driver from the test
        if 'driver' in item.funcargs:
            driver = item.funcargs['driver']
            try:
                # Take screenshot
                screenshot = driver.get_screenshot_as_png()

                # Attach to Allure
                allure.attach(
                    screenshot,
                    name=f'failure_{item.name}',
                    attachment_type=allure.attachment_type.PNG
                )

                # Also save to file
                screenshot_path = Path(__file__).parent / 'reports' / 'screenshots' / f'{item.name}_failure.png'
                screenshot_path.parent.mkdir(parents=True, exist_ok=True)
                driver.save_screenshot(str(screenshot_path))

            except Exception as e:
                print(f"Warning: Could not capture screenshot: {e}")


def pytest_configure(config):
    """
    Setup custom markers and pytest configuration.
    """
    # Register custom markers (also defined in pytest.ini for documentation)
    markers = {
        "smoke": "Quick smoke tests (2-5 minutes)",
        "auth": "Authentication flow tests",
        "profiles": "Profile management tests",
        "substitution": "PII substitution tests (CORE)",
        "critical": "Critical path tests (P0 - must pass)",
        "important": "Important tests (P1)",
        "nice_to_have": "Nice to have tests (P2)"
    }

    for marker, description in markers.items():
        config.addinivalue_line("markers", f"{marker}: {description}")


def pytest_collection_modifyitems(config, items):
    """
    Modify test items after collection.

    This allows us to:
    - Skip tests based on conditions
    - Add markers dynamically
    - Reorder tests
    """
    # Example: Run smoke tests first
    smoke_tests = [item for item in items if 'smoke' in item.keywords]
    other_tests = [item for item in items if 'smoke' not in item.keywords]
    items[:] = smoke_tests + other_tests
