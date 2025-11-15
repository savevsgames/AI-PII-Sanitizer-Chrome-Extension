# Selenium + PyAutoGUI E2E Testing Migration Plan

**Created:** 2025-01-15
**Last Updated:** 2025-01-15
**Status:** Phase 1 Complete ✅
**Target:** Replace Puppeteer with Selenium + PyAutoGUI for true Chrome extension E2E testing
**Future:** Enable Claude Computer Use (CCU) for AI-powered testing

---

## 🎯 **Current Test Status**

### **Full Test Suite Results (npm run test:all)**
- ✅ **Unit Tests**: 18 suites, 697 tests - ALL PASSING
- ❌ **Integration Tests**: 5 suites, 53 tests - ALL FAILING (known issue)
- ✅ **Selenium E2E**: 2 smoke tests - ALL PASSING
- ⏩ **Next**: Fix integration tests, then migrate core E2E tests

### **Phase 1 Complete ✅**
- ✅ Selenium + PyAutoGUI setup complete
- ✅ pytest framework configured
- ✅ First smoke tests passing
- ✅ npm scripts added
- ✅ Documentation complete

---

## 📋 **Table of Contents**
1. [Why Migrate?](#why-migrate)
2. [Technology Stack](#technology-stack)
3. [Test Organization Strategy](#test-organization-strategy)
4. [Test Reporting & Dashboards](#test-reporting--dashboards)
5. [Migration Phases](#migration-phases)
6. [Complete Test Suite](#complete-test-suite)
7. [Implementation Details](#implementation-details)
8. [Future: Claude Computer Use Integration](#future-claude-computer-use-integration)

---

## 🎯 **Why Migrate?**

### **Current Issues with Puppeteer:**
- ❌ Opens extension popup in **separate tab** (not as overlay)
- ❌ Extension context doesn't properly connect to ChatGPT page
- ❌ Profile changes don't propagate from popup to content script
- ❌ Cannot click extension icon in toolbar
- ❌ Requires page refresh after profile creation (hacky)
- ❌ No substitution messages captured (extension not functioning correctly in test environment)

### **Benefits of Selenium + PyAutoGUI:**
- ✅ **Real Chrome browser** (not Chromium) with full extension support
- ✅ **PyAutoGUI clicks extension icon** via screen coordinates
- ✅ Extension popup opens as **proper overlay** on ChatGPT
- ✅ True end-user behavior and extension context
- ✅ Proven solution for Chrome extension testing
- ✅ Easier to debug (can watch browser in real-time)

---

## 🛠️ **Technology Stack**

### **Core Framework:**
- **Selenium WebDriver** (Python or JavaScript)
  - Industry standard (39% market share)
  - Real Chrome browser support
  - Mature ecosystem

### **UI Automation:**
- **PyAutoGUI** (Python)
  - OS-level mouse/keyboard control
  - Click extension icon via coordinates
  - Cross-platform (Windows, Mac, Linux)

### **Test Framework:**
- **pytest** (Python) or **Jest** (JavaScript)
  - pytest recommended for Python-based approach
  - Better integration with PyAutoGUI
  - Rich plugin ecosystem

### **Reporting:**
- **Allure Framework** (recommended)
  - Beautiful HTML reports
  - Screenshots on failure
  - Historical trends
  - Integration with CI/CD

- **pytest-html** (simple alternative)
  - Single HTML file reports
  - Embedded screenshots
  - No server needed

### **CI/CD:**
- **GitHub Actions** (primary)
  - Free for public repos
  - Windows/Mac/Linux runners
  - Artifact storage for reports

---

## 📁 **Test Organization Strategy**

### **New Directory Structure:**

```
tests/
├── e2e-selenium/                    # NEW: Selenium-based E2E tests
│   ├── config/
│   │   ├── selenium_config.py       # WebDriver setup, browser options
│   │   ├── extension_config.py      # Extension path, IDs
│   │   └── test_data.py             # Test profiles, messages, API keys
│   │
│   ├── helpers/
│   │   ├── selenium_driver.py       # WebDriver initialization
│   │   ├── extension_helper.py      # Extension icon clicking (PyAutoGUI)
│   │   ├── auth_helper.py           # Google OAuth automation
│   │   ├── profile_helper.py        # Profile CRUD operations
│   │   └── verification_helper.py   # Substitution verification
│   │
│   ├── pages/                       # Page Object Model (POM)
│   │   ├── base_page.py             # Base page class
│   │   ├── chatgpt_page.py          # ChatGPT interactions
│   │   ├── popup_page.py            # Extension popup
│   │   ├── auth_modal_page.py       # Google OAuth modals
│   │   └── profile_modal_page.py    # Profile creation modal
│   │
│   ├── tests/
│   │   ├── 01_smoke/                # Quick smoke tests (2-5 min)
│   │   │   ├── test_extension_loads.py
│   │   │   ├── test_popup_opens.py
│   │   │   └── test_chatgpt_injection.py
│   │   │
│   │   ├── 02_auth/                 # Authentication flow (5-10 min)
│   │   │   ├── test_sign_in.py
│   │   │   ├── test_sign_out.py
│   │   │   └── test_session_persistence.py
│   │   │
│   │   ├── 03_profiles/             # Profile management (10-15 min)
│   │   │   ├── test_create_profile.py
│   │   │   ├── test_edit_profile.py
│   │   │   ├── test_delete_profile.py
│   │   │   ├── test_toggle_profile.py
│   │   │   └── test_profile_persistence.py
│   │   │
│   │   ├── 04_substitution/         # CORE: PII substitution (15-20 min)
│   │   │   ├── test_name_substitution.py
│   │   │   ├── test_email_substitution.py
│   │   │   ├── test_phone_substitution.py
│   │   │   ├── test_address_substitution.py
│   │   │   ├── test_multi_field_substitution.py
│   │   │   └── test_no_substitution_when_disabled.py
│   │   │
│   │   ├── 05_api_key_vault/        # API key protection (10-15 min)
│   │   │   ├── test_add_api_key.py
│   │   │   ├── test_delete_api_key.py
│   │   │   ├── test_key_detection_warn.py
│   │   │   ├── test_key_detection_auto_redact.py
│   │   │   └── test_key_redaction_verification.py
│   │   │
│   │   ├── 06_custom_rules/         # Custom regex rules (10 min)
│   │   │   ├── test_create_rule.py
│   │   │   ├── test_edit_rule.py
│   │   │   ├── test_delete_rule.py
│   │   │   ├── test_rule_substitution.py
│   │   │   └── test_toggle_rule.py
│   │   │
│   │   ├── 07_prompt_templates/     # Prompt templates (10 min)
│   │   │   ├── test_create_template.py
│   │   │   ├── test_use_template.py
│   │   │   ├── test_placeholder_replacement.py
│   │   │   └── test_delete_template.py
│   │   │
│   │   ├── 08_themes/               # Visual customization (5-10 min)
│   │   │   ├── test_switch_themes.py
│   │   │   ├── test_custom_background.py
│   │   │   ├── test_transparency_slider.py
│   │   │   └── test_blur_effect.py
│   │   │
│   │   ├── 09_google_quick_start/   # Quick Start feature (5 min)
│   │   │   ├── test_quick_start_button.py
│   │   │   ├── test_profile_prefill.py
│   │   │   └── test_quick_start_flow.py
│   │   │
│   │   └── 10_advanced/             # Advanced features (5 min)
│   │       ├── test_minimal_mode.py
│   │       ├── test_keyboard_shortcuts.py
│   │       └── test_stats_tracking.py
│   │
│   ├── reports/                     # Generated test reports
│   │   ├── allure-results/          # Allure raw data
│   │   ├── allure-report/           # Allure HTML report
│   │   ├── screenshots/             # Failure screenshots
│   │   └── videos/                  # Test execution recordings (optional)
│   │
│   ├── fixtures/                    # Test fixtures and test data
│   │   ├── profiles.json            # Sample profiles
│   │   ├── api_keys.json            # Sample API keys (fake)
│   │   └── test_messages.json       # Test messages with PII
│   │
│   ├── conftest.py                  # pytest configuration & fixtures
│   ├── pytest.ini                   # pytest settings
│   └── requirements.txt             # Python dependencies
│
├── e2e-puppeteer/                   # OLD: Keep for reference
│   └── ... (archive after migration)
│
└── integration/                     # Keep existing integration tests
    └── ...
```

---

## 📊 **Test Reporting & Dashboards**

### **Option 1: Allure Framework** ⭐ **RECOMMENDED**

**Features:**
- Beautiful HTML reports with charts
- Step-by-step test execution details
- Screenshots attached to failed tests
- Historical trend graphs
- Filter by status, severity, feature
- Export to PDF

**Setup:**
```bash
pip install allure-pytest
pytest --alluredir=./reports/allure-results
allure serve ./reports/allure-results  # Opens report in browser
```

**Sample Report Structure:**
```
📊 PromptBlocker E2E Test Report
├── Overview
│   ├── Total Tests: 47
│   ├── Passed: 45 (95.7%)
│   ├── Failed: 2 (4.3%)
│   └── Duration: 1h 23m
├── Suites
│   ├── Smoke Tests (3/3 ✅)
│   ├── Auth Tests (3/3 ✅)
│   ├── Profile Tests (5/5 ✅)
│   ├── Substitution Tests (5/6 ⚠️) <- 1 failure
│   ├── API Key Vault (4/5 ⚠️) <- 1 failure
│   └── ...
├── Graphs
│   ├── Test execution trend (last 30 days)
│   ├── Duration by suite
│   └── Flaky tests chart
└── Failed Tests
    ├── test_email_substitution.py
    │   ├── Error: AssertionError: Expected alias email, found real email
    │   ├── Screenshot: failure_1642531234.png
    │   └── Stack trace
    └── test_key_detection_warn.py
        ├── Error: TimeoutError: Warning modal did not appear
        └── Screenshot: failure_1642531456.png
```

**GitHub Actions Integration:**
```yaml
- name: Generate Allure Report
  run: |
    allure generate ./reports/allure-results -o ./reports/allure-report

- name: Upload Report
  uses: actions/upload-artifact@v3
  with:
    name: allure-report
    path: ./reports/allure-report
```

### **Option 2: pytest-html** (Simpler)

**Features:**
- Single HTML file
- Embedded screenshots
- No server required
- Good for quick reviews

**Setup:**
```bash
pip install pytest-html
pytest --html=./reports/report.html --self-contained-html
```

### **Report Access Options:**

1. **Local Development:**
   ```bash
   # Run tests
   pytest tests/e2e-selenium/

   # View report
   allure serve ./reports/allure-results
   # OR
   open ./reports/report.html
   ```

2. **CI/CD (GitHub Actions):**
   - Reports uploaded as artifacts
   - Download from Actions tab
   - Host on GitHub Pages (public)
   - Or upload to S3/Azure Blob

3. **Scheduled Reports:**
   - Daily test runs (cron)
   - Email summary of failures
   - Slack/Discord notifications

---

## 🚀 **Migration Phases**

### **Phase 1: Setup & Infrastructure (Week 1)** ✅ **COMPLETE**

**Tasks:**
1. ✅ Install dependencies (selenium, pyautogui, pytest, allure-pytest, etc.)
2. ✅ Create directory structure (`tests/e2e-selenium/`)
3. ✅ Setup Selenium WebDriver for Chrome (helpers/selenium_driver.py)
4. ✅ Configure ChromeOptions to load extension
5. ✅ Implement PyAutoGUI extension icon clicking (helpers/extension_helper.py)
6. ✅ Create base Page Object classes (pages/base_page.py)
7. ✅ Setup pytest configuration (pytest.ini, conftest.py)
8. ✅ Configure Allure reporting
9. ✅ Add npm scripts for easy test execution
10. ✅ Create documentation (README.md, SETUP_COMPLETE.md)

**Deliverables:**
- ✅ Selenium launches Chrome with extension
- ✅ PyAutoGUI tools for extension icon clicking (coordinates + image recognition)
- ✅ Extension popup opens as overlay (verified in smoke tests)
- ✅ Basic tests run and generate reports (2 smoke tests passing)
- ✅ Fixed Windows emoji encoding issues
- ✅ Fixed import naming conflicts

**Test Results:**
- ✅ 2 smoke tests passing in ~21 seconds
- ✅ Extension loads successfully
- ✅ Content script injection verified

---

### **Phase 2: Core Tests Migration (Week 2-3)**

**Priority Order:**

1. **Smoke Tests** (Day 1-2)
   - Extension loads
   - Popup opens
   - ChatGPT injection works

2. **Auth Tests** (Day 3-4)
   - Sign in flow
   - Sign out flow
   - Session persistence

3. **Profile Tests** (Day 5-7)
   - Create, edit, delete, toggle
   - Persistence across sessions

4. **Substitution Tests** (Day 8-12) ← **CRITICAL**
   - Name, email, phone, address
   - Multi-field
   - Disabled state

**Success Criteria:**
- ✅ All core tests passing
- ✅ Substitution verified via ChatGPT response content
- ✅ Reports show 100% pass rate

---

### **Phase 3: Feature Tests (Week 4-5)**

**Implementation order:**

1. **API Key Vault** (Day 1-3)
2. **Custom Rules** (Day 4-5)
3. **Prompt Templates** (Day 6-7)
4. **Themes & Customization** (Day 8-9)
5. **Google Quick Start** (Day 10)
6. **Advanced Features** (Day 11-12)

---

### **Phase 4: CI/CD Integration (Week 6)**

**Tasks:**
1. Create GitHub Actions workflow
2. Configure test matrix (Windows, Mac, Linux)
3. Setup Allure report hosting
4. Configure failure notifications
5. Implement retry logic for flaky tests
6. Add test coverage reporting

**Deliverables:**
- ✅ Tests run on every PR
- ✅ Reports accessible via GitHub Pages
- ✅ Team gets notified of failures

---

### **Phase 5: Documentation & Maintenance (Week 7)**

**Tasks:**
1. Write developer guide for adding new tests
2. Document Page Object pattern usage
3. Create troubleshooting guide
4. Setup test data management
5. Archive old Puppeteer tests

---

## 🧪 **Complete Test Suite**

### **Smoke Tests (3 tests, ~2-5 min)**

| Test | Description | Priority |
|------|-------------|----------|
| `test_extension_loads` | Extension service worker loads, no errors | P0 |
| `test_popup_opens` | Click extension icon → popup appears | P0 |
| `test_chatgpt_injection` | Content script + inject.js loaded on ChatGPT | P0 |

---

### **Auth Tests (3 tests, ~5-10 min)**

| Test | Description | Priority |
|------|-------------|----------|
| `test_sign_in` | Google OAuth sign-in completes successfully | P0 |
| `test_sign_out` | Sign out + confirm → user signed out | P0 |
| `test_session_persistence` | Close/reopen popup → still signed in | P1 |

---

### **Profile Tests (5 tests, ~10-15 min)**

| Test | Description | Priority |
|------|-------------|----------|
| `test_create_profile` | Fill form → save → profile appears in list | P0 |
| `test_edit_profile` | Click edit → modify → save → changes persist | P1 |
| `test_delete_profile` | Click delete → confirm → profile removed | P0 |
| `test_toggle_profile` | Toggle switch → profile enabled/disabled | P1 |
| `test_profile_persistence` | Create profile → reload popup → profile still exists | P0 |

---

### **Substitution Tests (6 tests, ~15-20 min)** ⭐ **CORE**

| Test | Description | Priority |
|------|-------------|----------|
| `test_name_substitution` | Send "My name is [Real Name]" → ChatGPT shows [Alias Name] | P0 |
| `test_email_substitution` | Send real email → ChatGPT shows alias email | P0 |
| `test_phone_substitution` | Send real phone → ChatGPT shows alias phone | P0 |
| `test_address_substitution` | Send real address → ChatGPT shows alias address | P1 |
| `test_multi_field_substitution` | Send name + email + phone → all substituted | P0 |
| `test_no_substitution_when_disabled` | Disable profile → send PII → NO substitution occurs | P0 |

**Verification Strategy:**
- Check ChatGPT response contains alias values
- Check response does NOT contain real values
- Use network tab to verify request body (if accessible)

---

### **API Key Vault Tests (5 tests, ~10-15 min)**

| Test | Description | Priority |
|------|-------------|----------|
| `test_add_api_key` | Add OpenAI key → appears in vault (masked) | P0 |
| `test_delete_api_key` | Delete key → removed from vault | P0 |
| `test_key_detection_warn` | Send message with key → warning modal appears | P0 |
| `test_key_detection_auto_redact` | Auto-redact mode → key silently removed | P0 |
| `test_key_redaction_verification` | Verify request contains `[OPENAI_API_KEY]` placeholder | P0 |

---

### **Custom Rules Tests (5 tests, ~10 min)**

| Test | Description | Priority |
|------|-------------|----------|
| `test_create_rule` | Create regex rule (e.g., employee ID) → appears in list | P1 |
| `test_edit_rule` | Edit pattern/replacement → changes saved | P1 |
| `test_delete_rule` | Delete rule → removed from list | P1 |
| `test_rule_substitution` | Send text matching pattern → substituted | P1 |
| `test_toggle_rule` | Disable rule → no substitution → re-enable → works | P1 |

---

### **Prompt Templates Tests (4 tests, ~10 min)**

| Test | Description | Priority |
|------|-------------|----------|
| `test_create_template` | Create template with `{{name}}`, `{{email}}` | P1 |
| `test_use_template` | Click "Use" → ChatGPT textarea filled with alias data | P1 |
| `test_placeholder_replacement` | All placeholders replaced correctly | P1 |
| `test_delete_template` | Delete template → removed from list | P1 |

---

### **Theme Tests (4 tests, ~5-10 min)**

| Test | Description | Priority |
|------|-------------|----------|
| `test_switch_themes` | Switch light/dark → background color changes | P2 |
| `test_custom_background` | Upload image → background appears | P2 |
| `test_transparency_slider` | Drag slider → opacity changes | P2 |
| `test_blur_effect` | Toggle blur → visual effect applied | P2 |

---

### **Google Quick Start Tests (3 tests, ~5 min)**

| Test | Description | Priority |
|------|-------------|----------|
| `test_quick_start_button` | Button appears after sign-in | P1 |
| `test_profile_prefill` | Click button → modal pre-filled with Google account data | P1 |
| `test_quick_start_flow` | Quick Start → profile created with auto-generated alias | P1 |

---

### **Advanced Features Tests (3 tests, ~5 min)**

| Test | Description | Priority |
|------|-------------|----------|
| `test_minimal_mode` | Click minimize → compact UI shown | P2 |
| `test_keyboard_shortcuts` | Press shortcut → popup opens | P2 |
| `test_stats_tracking` | Send message → substitution count increases | P2 |

---

## **Total Test Count: 41 tests**

**Estimated Total Runtime:**
- **Sequential:** ~80-110 minutes (1.5-2 hours)
- **Parallel (4 workers):** ~20-30 minutes

---

## 💻 **Implementation Details**

### **1. Selenium Driver Setup**

```python
# helpers/selenium_driver.py
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import os

class ChromeDriverManager:
    @staticmethod
    def get_driver(extension_path: str, headless: bool = False):
        options = Options()

        # Load extension
        options.add_argument(f'--load-extension={extension_path}')

        # Extension requires non-headless mode
        if headless:
            print("⚠️  Warning: Extensions don't work well in headless mode")

        # Additional options
        options.add_argument('--start-maximized')
        options.add_argument('--disable-blink-features=AutomationControlled')

        # User data dir (for session persistence)
        options.add_argument(f'--user-data-dir={os.path.join(os.getcwd(), "chrome_profile")}')

        driver = webdriver.Chrome(options=options)
        return driver
```

### **2. Extension Icon Clicking (PyAutoGUI)**

```python
# helpers/extension_helper.py
import pyautogui
import time

class ExtensionHelper:
    # Extension icon coordinates (update based on screen resolution)
    EXTENSION_ICON_COORDS = {
        '1920x1080': (1850, 100),  # Top-right corner
        '2560x1440': (2460, 130),
    }

    @staticmethod
    def click_extension_icon(resolution: str = '1920x1080'):
        """
        Click extension icon using PyAutoGUI.

        Note: Requires finding icon coordinates first via:
        - pyautogui.displayMousePosition() to get coords
        - Or use image recognition: pyautogui.locateOnScreen('icon.png')
        """
        x, y = ExtensionHelper.EXTENSION_ICON_COORDS.get(resolution, (1850, 100))

        # Move to icon
        pyautogui.moveTo(x, y, duration=0.5)
        time.sleep(0.2)

        # Click
        pyautogui.click()
        time.sleep(1)  # Wait for popup to open

    @staticmethod
    def find_extension_icon_by_image(icon_image_path: str):
        """
        Alternative: Find icon using image recognition (more reliable).
        """
        location = pyautogui.locateOnScreen(icon_image_path, confidence=0.8)
        if location:
            center = pyautogui.center(location)
            pyautogui.click(center)
            return True
        return False
```

### **3. Page Object Model (POM) Example**

```python
# pages/popup_page.py
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage

class PopupPage(BasePage):
    # Locators
    SIGN_IN_BTN = (By.ID, 'headerSignInBtn')
    USER_PROFILE_CONTAINER = (By.ID, 'headerUserProfileContainer')
    NEW_PROFILE_BTN = (By.ID, 'newProfileBtn')
    PROFILE_CARDS = (By.CSS_SELECTOR, '.profile-card')

    def __init__(self, driver):
        super().__init__(driver)

    def click_sign_in(self):
        self.click(self.SIGN_IN_BTN)

    def is_signed_in(self):
        return self.is_element_visible(self.USER_PROFILE_CONTAINER)

    def click_new_profile(self):
        self.click(self.NEW_PROFILE_BTN)

    def get_profile_count(self):
        cards = self.driver.find_elements(*self.PROFILE_CARDS)
        return len(cards)
```

### **4. Test Example**

```python
# tests/02_auth/test_sign_in.py
import pytest
import allure
from helpers.selenium_driver import ChromeDriverManager
from helpers.extension_helper import ExtensionHelper
from pages.popup_page import PopupPage
from pages.auth_modal_page import AuthModalPage

@allure.feature('Authentication')
@allure.story('Sign In')
@allure.severity(allure.severity_level.BLOCKER)
class TestSignIn:

    @pytest.fixture(scope='function')
    def driver(self):
        driver = ChromeDriverManager.get_driver(
            extension_path='H:/AI_Interceptor/dist'
        )
        yield driver
        driver.quit()

    @allure.title('User can sign in with Google OAuth')
    def test_sign_in_success(self, driver):
        with allure.step('Navigate to ChatGPT'):
            driver.get('https://chatgpt.com')

        with allure.step('Click extension icon'):
            ExtensionHelper.click_extension_icon()

        with allure.step('Click sign-in button'):
            popup_page = PopupPage(driver)
            popup_page.click_sign_in()

        with allure.step('Complete Google OAuth'):
            auth_modal = AuthModalPage(driver)
            auth_modal.sign_in_with_google(
                email=os.getenv('TEST_USER_EMAIL'),
                password=os.getenv('TEST_USER_PASSWORD')
            )

        with allure.step('Verify signed in'):
            assert popup_page.is_signed_in(), "User should be signed in"
            allure.attach(
                driver.get_screenshot_as_png(),
                name='signed_in_state',
                attachment_type=allure.attachment_type.PNG
            )
```

### **5. pytest Configuration**

```ini
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

markers =
    smoke: Smoke tests (quick validation)
    auth: Authentication tests
    profiles: Profile management tests
    substitution: PII substitution tests
    critical: Critical path tests (must pass)

addopts =
    --alluredir=./reports/allure-results
    --html=./reports/report.html
    --self-contained-html
    -v
    -s
    --tb=short
    --strict-markers
```

### **6. conftest.py (Fixtures)**

```python
# conftest.py
import pytest
from helpers.selenium_driver import ChromeDriverManager

@pytest.fixture(scope='session')
def extension_path():
    return 'H:/AI_Interceptor/dist'

@pytest.fixture(scope='function')
def driver(extension_path):
    """Provide Chrome driver with extension loaded."""
    driver = ChromeDriverManager.get_driver(extension_path)
    yield driver
    driver.quit()

@pytest.fixture(scope='function')
def test_profile_data():
    """Standard test profile data."""
    return {
        'profileName': 'E2E Test Profile',
        'realName': 'John Smith',
        'aliasName': 'Alex Johnson',
        'realEmail': 'john.smith@test.com',
        'aliasEmail': 'alex.johnson@test.com',
        'realPhone': '+1 555-0100',
        'aliasPhone': '+1 555-0999'
    }

def pytest_configure(config):
    """Setup custom markers."""
    config.addinivalue_line("markers", "smoke: Quick smoke tests")
    config.addinivalue_line("markers", "critical: Critical path tests")
```

---

## 🤖 **Future: Claude Computer Use Integration**

### **Phase: AI-Powered Testing (Post-Migration)**

**When to implement:**
- After Selenium tests are stable
- When budget allows ($50-200/month for API credits)
- For complex visual verification scenarios

**Use cases for CCU:**
1. **Visual regression testing:** "Does the popup look correct?"
2. **Complex user flows:** Natural language test definitions
3. **Exploratory testing:** "Try to break the extension"
4. **Accessibility testing:** "Can you navigate using only keyboard?"

### **Implementation Example:**

```python
# tests/ccu/test_visual_regression.py
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

def test_popup_visual_appearance():
    """
    Use Claude Computer Use to verify popup appearance.
    """
    instructions = """
    1. Open Chrome
    2. Navigate to https://chatgpt.com
    3. Click the PromptBlocker extension icon (top-right)
    4. Take a screenshot of the popup
    5. Describe what you see - does it match the expected design?
    6. Check if all buttons are visible and clickable
    7. Verify color scheme matches brand colors
    """

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        tools=[{"type": "computer_20241022", "display_width_px": 1920, "display_height_px": 1080}],
        messages=[{"role": "user", "content": instructions}]
    )

    # Parse response and assert
    # CCU will describe what it sees
    assert "sign in" in response.content[0].text.lower()
```

---

## 📅 **Timeline Summary**

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Setup** | Week 1 | Infrastructure ready, basic test runs |
| **Phase 2: Core Tests** | Week 2-3 | Auth, profiles, substitution tests passing |
| **Phase 3: Feature Tests** | Week 4-5 | All feature tests implemented |
| **Phase 4: CI/CD** | Week 6 | Automated testing in GitHub Actions |
| **Phase 5: Docs** | Week 7 | Developer guide, maintenance docs |
| **Total** | **7 weeks** | **Production-ready E2E test suite** |

---

## ✅ **Success Criteria**

- ✅ All 41 tests passing consistently (>95% pass rate)
- ✅ Substitution verified in real ChatGPT conversations
- ✅ Extension popup opens as proper overlay (not separate tab)
- ✅ Tests run in CI/CD (GitHub Actions)
- ✅ Allure reports accessible to team
- ✅ Test execution time <30 minutes (parallel)
- ✅ Flaky test rate <5%
- ✅ Documentation complete

---

## 🚦 **Getting Started**

1. **Read this plan** ✅ (you're here!)
2. **Week 1:** Implement Phase 1 (setup)
3. **Week 2-3:** Migrate core tests
4. **Week 4+:** Expand feature coverage
5. **Future:** Add Claude Computer Use for advanced scenarios

---

**Next Steps:**
- ✅ ~~Review and approve this plan~~
- ✅ ~~Setup development environment~~
- ✅ ~~Begin Phase 1: Infrastructure setup~~
- ⏩ **IMMEDIATE**: Fix integration test failures (53 tests failing)
- ⏩ **NEXT**: Begin Phase 2 - Core test migration (auth, profiles, substitution)
- 🔮 **FUTURE**: CI/CD integration and Claude Computer Use

---

## 📝 **Implementation Notes**

### **Completed (2025-01-15)**
- Created complete Selenium + PyAutoGUI framework
- All Phase 1 tasks completed successfully
- Fixed Windows-specific issues (emoji encoding, import conflicts)
- npm scripts added for easy test execution
- Full documentation created

### **Known Issues**
- Integration tests failing (53/53) - needs investigation
- Content script markers timing may need adjustment
- Extension icon coordinates need to be calibrated per machine (or use image recognition)

### **Available Commands**
```bash
# Run tests
npm run test:e2e:selenium              # All Selenium tests
npm run test:e2e:selenium:smoke        # Quick smoke tests
npm run test:e2e:selenium:critical     # Critical path only
npm run test:e2e:selenium:verbose      # Verbose output
npm run test:e2e:selenium:report       # Generate Allure report

# Full suite
npm run test:all                       # Unit + Integration + Coverage + Build
npm run test:all:selenium              # Includes Selenium E2E tests
```

---

**Document Version:** 1.1
**Last Updated:** 2025-01-15 (Phase 1 Complete)
**Owner:** PromptBlocker Team
