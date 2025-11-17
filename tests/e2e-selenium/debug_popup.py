"""
Quick debug script to open popup and take screenshot.
"""
import time
import os
from pathlib import Path
from dotenv import load_dotenv
from helpers.selenium_driver import ChromeDriverManager

# Load .env
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Get extension path
extension_path = str(Path(__file__).parent.parent.parent / 'dist')

print("Creating driver...")
driver = ChromeDriverManager.get_driver(extension_path)

try:
    # Get extension ID
    extension_id = os.getenv('EXTENSION_ID')
    print(f"Extension ID: {extension_id}")

    # Open popup
    popup_url = f"chrome-extension://{extension_id}/popup-v2.html"
    print(f"Opening: {popup_url}")
    driver.get(popup_url)
    time.sleep(3)

    # Take screenshot
    screenshot_path = Path(__file__).parent / 'temp' / 'popup_debug.png'
    screenshot_path.parent.mkdir(exist_ok=True)
    driver.save_screenshot(str(screenshot_path))
    print(f"Screenshot saved: {screenshot_path}")

    # Get page source
    source_path = Path(__file__).parent / 'temp' / 'popup_debug.html'
    with open(source_path, 'w', encoding='utf-8') as f:
        f.write(driver.page_source)
    print(f"Page source saved: {source_path}")

    # Wait
    print("Waiting 10 seconds (check the browser)...")
    time.sleep(10)

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    driver.quit()
    print("Done!")
