# Selenium + PyAutoGUI E2E Test Suite

**Status:** ✅ Phase 1 Setup Complete
**Last Updated:** 2025-01-15

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd tests/e2e-selenium
pip install -r requirements.txt
```

### 2. Build Extension

```bash
# From project root
npm run build
```

### 3. Setup Test Credentials

Create `.env.test.local` in project root:

```env
TEST_USER_EMAIL=your-test-email@gmail.com
TEST_USER_PASSWORD=your-test-password
```

### 4. Run Tests

```bash
# Run all tests
pytest

# Run only smoke tests
pytest -m smoke

# Run with detailed output
pytest -v -s

# Generate Allure report
pytest --alluredir=./reports/allure-results
allure serve ./reports/allure-results
```

---

## 📁 Project Structure

```
e2e-selenium/
├── config/           # Configuration files
├── helpers/          # Test helpers
│   ├── selenium_driver.py      # WebDriver management
│   └── extension_helper.py     # PyAutoGUI extension clicking
├── pages/            # Page Object Model
│   └── base_page.py           # Base page class
├── tests/            # Test files
│   ├── 01_smoke/              # Smoke tests
│   ├── 02_auth/               # Auth tests
│   ├── 03_profiles/           # Profile tests
│   ├── 04_substitution/       # Substitution tests (CORE)
│   └── ...
├── reports/          # Generated reports
├── fixtures/         # Test data
├── conftest.py       # pytest configuration
├── pytest.ini        # pytest settings
└── requirements.txt  # Python dependencies
```

---

## 🔧 Setup Tools

### Calibrate Extension Icon Coordinates

The extension icon needs to be clicked using PyAutoGUI. First, find the coordinates:

```bash
python helpers/extension_helper.py
# Choose option 1: Calibrate extension icon coordinates
```

Follow the prompts to record your extension icon's position.

### Create Extension Icon Screenshot (Recommended)

For more reliable clicking, use image recognition:

```bash
python helpers/extension_helper.py
# Choose option 2: Take extension icon screenshot
```

This creates a screenshot of the icon that PyAutoGUI can find automatically.

---

## ✅ Running Your First Test

### Smoke Test

```bash
pytest tests/01_smoke/test_extension_loads.py -v -s
```

**Expected output:**
```
tests/01_smoke/test_extension_loads.py::TestExtensionLoads::test_extension_loads_successfully PASSED
tests/01_smoke/test_extension_loads.py::TestContentScriptInjection::test_content_script_injected PASSED

✅ 2 passed in 15.23s
```

---

## 📊 Viewing Reports

### HTML Report (Simple)

```bash
pytest --html=./reports/report.html --self-contained-html
open ./reports/report.html  # Mac
start ./reports/report.html # Windows
```

### Allure Report (Recommended)

```bash
# Install Allure (one-time)
# Mac: brew install allure
# Windows: scoop install allure

# Run tests and generate report
pytest --alluredir=./reports/allure-results
allure serve ./reports/allure-results
```

---

## 🏷️ Test Markers

Run specific test categories:

```bash
# Smoke tests (quick validation)
pytest -m smoke

# Critical path tests
pytest -m critical

# Substitution tests
pytest -m substitution

# All auth tests
pytest -m auth
```

---

## 🐛 Troubleshooting

### Extension not loading

**Error:** `Extension not found at H:\AI_Interceptor\dist`

**Solution:**
```bash
npm run build
```

### ChromeDriver issues

**Error:** `ChromeDriver version mismatch`

**Solution:**
```bash
pip install --upgrade webdriver-manager
```

The `webdriver-manager` package automatically downloads the correct ChromeDriver.

### Extension icon not clicking

**Error:** PyAutoGUI clicks wrong location

**Solution:**
1. Run calibration tool: `python helpers/extension_helper.py`
2. Choose option 1 to record correct coordinates
3. Update `DEFAULT_ICON_COORDS` in `helpers/extension_helper.py`

**OR use image recognition:**
1. Run: `python helpers/extension_helper.py`
2. Choose option 2 to create icon screenshot
3. Use `click_extension_icon_by_image()` in tests

### Tests running too slow

**Solution:** Enable parallel execution

In `pytest.ini`, uncomment:
```ini
addopts =
    -n auto  # Run tests in parallel
```

---

## 📝 Writing New Tests

### 1. Use Page Object Model

```python
# pages/popup_page.py
from pages.base_page import BasePage
from selenium.webdriver.common.by import By

class PopupPage(BasePage):
    # Locators
    SIGN_IN_BTN = (By.ID, 'headerSignInBtn')

    # Actions
    def click_sign_in(self):
        self.click(self.SIGN_IN_BTN)
```

### 2. Write Test

```python
# tests/02_auth/test_sign_in.py
import pytest
import allure

@allure.feature('Authentication')
@pytest.mark.auth
@pytest.mark.critical
def test_sign_in(driver):
    with allure.step('Navigate to ChatGPT'):
        driver.get('https://chatgpt.com')

    with allure.step('Click extension icon'):
        from helpers.extension_helper import ExtensionHelper
        ExtensionHelper.click_extension_icon_by_coordinates()

    # ... rest of test
```

---

## 🎯 Next Steps

Now that Phase 1 setup is complete:

1. ✅ Infrastructure is ready
2. ⏩ **Next:** Migrate auth tests from Puppeteer
3. ⏩ **Then:** Implement substitution tests
4. ⏩ **Finally:** Add remaining feature tests

See `docs/testing/SELENIUM_MIGRATION_PLAN.md` for the complete migration roadmap.

---

## 📚 Resources

- [Selenium Documentation](https://www.selenium.dev/documentation/)
- [pytest Documentation](https://docs.pytest.org/)
- [Allure Documentation](https://docs.qameta.io/allure/)
- [PyAutoGUI Documentation](https://pyautogui.readthedocs.io/)
- [Migration Plan](../../docs/testing/SELENIUM_MIGRATION_PLAN.md)

---

## 🆘 Getting Help

If you encounter issues:

1. Check this README's troubleshooting section
2. Review the migration plan: `docs/testing/SELENIUM_MIGRATION_PLAN.md`
3. Check existing test examples in `tests/01_smoke/`
4. Run the setup tools: `python helpers/extension_helper.py`

---

**Happy Testing! 🧪**
