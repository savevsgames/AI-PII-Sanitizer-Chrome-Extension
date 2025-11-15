"""
Calibration script to capture Developer mode toggle coordinates.

This script will:
1. Open Chrome with extension loaded
2. Navigate to chrome://extensions
3. Wait for you to click the Developer mode toggle
4. Capture and save the coordinates
"""
import time
import pyautogui
from pathlib import Path
from helpers.selenium_driver import ChromeDriverManager

# Get extension path
extension_path = str(Path(__file__).parent.parent.parent / 'dist')

print("=" * 60)
print("Developer Mode Toggle Calibration")
print("=" * 60)

print("\nCreating Chrome driver...")
driver = ChromeDriverManager.get_driver(extension_path)

try:
    # Navigate to chrome://extensions
    print("\nNavigating to chrome://extensions...")
    driver.get('chrome://extensions')
    time.sleep(2)

    # Inject JavaScript to log clicks in browser console
    script = """
    window.clickCoords = [];
    document.addEventListener('click', function(e) {
        const x = e.clientX;
        const y = e.clientY;
        const screenWidth = window.innerWidth;
        const xPercent = (x / screenWidth * 100).toFixed(1);

        window.clickCoords.push({x: x, y: y});
        console.log(`Click #${window.clickCoords.length}: x=${x}, y=${y} (${xPercent}% from left)`);
    });
    console.log('='.repeat(60));
    console.log('CLICK LOGGER ACTIVE');
    console.log('='.repeat(60));
    console.log('Click the Developer mode toggle several times.');
    console.log('I will log all your clicks here.');
    console.log('='.repeat(60));
    """
    driver.execute_script(script)

    print("\n" + "=" * 60)
    print("INSTRUCTIONS:")
    print("=" * 60)
    print("1. Open browser DevTools (F12)")
    print("2. Look at the Console tab")
    print("3. Click anywhere to dismiss popups")
    print("4. Click the 'Developer mode' toggle MULTIPLE TIMES")
    print("5. The coordinates will appear in the browser console")
    print("6. You have 30 seconds to click")
    print("=" * 60)

    print("\nWaiting 30 seconds for you to click...")
    time.sleep(30)

    # Retrieve all clicks from browser
    clicks_data = driver.execute_script("return window.clickCoords;")

    print("\n" + "=" * 60)
    print("CLICKS DETECTED:")
    print("=" * 60)

    if clicks_data:
        for i, click in enumerate(clicks_data, 1):
            x, y = click['x'], click['y']
            screen_width = driver.execute_script("return window.innerWidth;")
            x_percent = (x / screen_width) * 100
            print(f"Click #{i}: x={x}, y={y} ({x_percent:.1f}% from left)")

        if len(clicks_data) >= 2:
            # Average last 5 clicks
            recent = clicks_data[-5:]
            avg_x = sum(c['x'] for c in recent) / len(recent)
            avg_y = sum(c['y'] for c in recent) / len(recent)
            screen_width = driver.execute_script("return window.innerWidth;")
            avg_x_percent = (avg_x / screen_width) * 100

            print("\n" + "=" * 60)
            print(f"AVERAGE OF LAST {len(recent)} CLICKS:")
            print("=" * 60)
            print(f"x = {int(avg_x)}, y = {int(avg_y)}")
            print(f"Percentage from left: {avg_x_percent:.1f}%")
            print("\nUse these in test_harness.py:")
            print(f"  toggle_x = int(screen_width * {avg_x_percent/100:.4f})")
            print(f"  toggle_y = {int(avg_y)}")
            print("=" * 60)
    else:
        print("No clicks detected!")

except Exception as e:
    print(f"\nError: {e}")
    import traceback
    traceback.print_exc()

finally:
    print("\nClosing browser in 3 seconds...")
    time.sleep(3)
    driver.quit()
    print("Done!")
