"""
Extension Helper for clicking extension icon using PyAutoGUI.

This module provides utilities for interacting with Chrome extension UI
elements that are outside the page DOM (like the extension toolbar icon).
"""

import pyautogui
import time
from pathlib import Path
from typing import Optional, Tuple


class ExtensionHelper:
    """
    Helper class for Chrome extension interactions using PyAutoGUI.
    """

    # Default Chrome menu (three-dot/hamburger) coordinates for common screen resolutions
    # These are rough estimates - should be calibrated per machine
    CHROME_MENU_COORDS = {
        '1920x1080': (1481, 49),    # Full HD - based on screenshot
        '2560x1440': (2520, 65),    # 2K
        '3840x2160': (3800, 100),   # 4K
    }

    # Default extensions menu item coordinates (after opening Chrome menu)
    # These are rough estimates - should be calibrated per machine
    EXTENSIONS_MENU_ITEM_COORDS = {
        '1920x1080': (1350, 200),   # Full HD - approximate location in menu dropdown
        '2560x1440': (1800, 260),   # 2K
        '3840x2160': (2700, 400),   # 4K
    }

    # Default extension icon coordinates for common screen resolutions
    # These coords are for clicking the extension AFTER the menu is open
    DEFAULT_ICON_COORDS = {
        '1920x1080': (1850, 100),   # Full HD
        '2560x1440': (2460, 130),   # 2K
        '3840x2160': (3740, 200),   # 4K
    }

    @staticmethod
    def get_screen_resolution() -> str:
        """
        Get current screen resolution as string.

        Returns:
            str: Resolution in format "WIDTHxHEIGHT" (e.g., "1920x1080")
        """
        size = pyautogui.size()
        return f"{size.width}x{size.height}"

    @staticmethod
    def click_extensions_menu(coords: Optional[Tuple[int, int]] = None, duration: float = 0.5):
        """
        Open Chrome extensions using keyboard shortcut.

        This uses Ctrl+Shift+E (or the Chrome menu shortcut) to open extensions.

        Args:
            coords: Not used when using keyboard shortcut
            duration: Not used when using keyboard shortcut
        """
        print(f"[ExtHelper] Opening Chrome extensions using keyboard shortcut...")

        # Try Chrome extensions page shortcut
        # Navigate to chrome://extensions using Ctrl+L (address bar) + typing
        print(f"[ExtHelper] Opening address bar with Ctrl+L...")
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.3)

        print(f"[ExtHelper] Typing chrome://extensions...")
        pyautogui.typewrite('chrome://extensions', interval=0.05)
        time.sleep(0.3)

        print(f"[ExtHelper] Pressing Enter...")
        pyautogui.press('enter')
        time.sleep(1.5)  # Wait for extensions page to load

        print(f"[ExtHelper] Extensions page opened")

    @staticmethod
    def click_extension_icon_by_coordinates(coords: Optional[Tuple[int, int]] = None, duration: float = 0.5):
        """
        Click extension icon at specific screen coordinates.

        Args:
            coords: (x, y) coordinates. If None, uses default based on screen resolution
            duration: Duration of mouse movement in seconds

        Example:
            ```python
            # Click at specific coordinates
            ExtensionHelper.click_extension_icon_by_coordinates((1850, 100))

            # Click at default coordinates for current resolution
            ExtensionHelper.click_extension_icon_by_coordinates()
            ```
        """
        # Get coordinates
        if coords is None:
            resolution = ExtensionHelper.get_screen_resolution()
            coords = ExtensionHelper.DEFAULT_ICON_COORDS.get(
                resolution,
                ExtensionHelper.DEFAULT_ICON_COORDS['1920x1080']  # Fallback
            )
            print(f"[ExtHelper] Using default coords for {resolution}: {coords}")
        else:
            print(f"[ExtHelper] Using provided coords: {coords}")

        x, y = coords

        # Safety check - ensure coordinates are within screen bounds
        screen_width, screen_height = pyautogui.size()
        if not (0 <= x <= screen_width and 0 <= y <= screen_height):
            raise ValueError(
                f"Coordinates ({x}, {y}) are outside screen bounds "
                f"({screen_width}x{screen_height})"
            )

        # Move to icon
        print(f"[ExtHelper] Moving to ({x}, {y})...")
        pyautogui.moveTo(x, y, duration=duration)
        time.sleep(0.2)

        # Click
        print(f"[ExtHelper] Clicking...")
        pyautogui.click()
        time.sleep(1)  # Wait for popup to open

        print(f"[ExtHelper] Extension icon clicked")

    @staticmethod
    def click_extension_icon_by_image(icon_image_path: str, confidence: float = 0.8) -> bool:
        """
        Click extension icon by finding it via image recognition.

        This is more reliable than coordinates as it adapts to different
        screen resolutions and toolbar configurations.

        Args:
            icon_image_path: Path to screenshot of extension icon
            confidence: Match confidence (0.0 to 1.0)

        Returns:
            bool: True if icon found and clicked, False otherwise

        Example:
            ```python
            success = ExtensionHelper.click_extension_icon_by_image(
                'fixtures/extension_icon.png'
            )
            if not success:
                pytest.fail("Could not find extension icon on screen")
            ```

        Note:
            You need to create a screenshot of the extension icon first:
            1. Open Chrome with extension
            2. Take screenshot of just the icon
            3. Save as PNG in fixtures/
        """
        print(f"[ExtHelper] Searching for extension icon...")
        print(f"[ExtHelper] Image: {icon_image_path}")

        try:
            # Locate icon on screen
            location = pyautogui.locateOnScreen(icon_image_path, confidence=confidence)

            if location:
                # Get center point of found image
                center = pyautogui.center(location)
                print(f"[ExtHelper] Found icon at: {center}")

                # Click it
                pyautogui.click(center)
                time.sleep(1)

                print(f"[ExtHelper] Extension icon clicked (image recognition)")
                return True
            else:
                print(f"[ExtHelper] Icon not found on screen")
                return False

        except Exception as e:
            print(f"[ExtHelper] Error during image recognition: {e}")
            return False

    @staticmethod
    def calibrate_extension_icon_coordinates():
        """
        Interactive helper to find extension icon coordinates.

        Run this function to move your mouse to the extension icon,
        then press Enter to record the coordinates.

        Usage:
            ```python
            from helpers.extension_helper import ExtensionHelper
            ExtensionHelper.calibrate_extension_icon_coordinates()
            ```
        """
        print("=" * 60)
        print("Extension Icon Coordinate Calibration")
        print("=" * 60)
        print("\nInstructions:")
        print("1. Position your mouse over the extension icon")
        print("2. Press Enter to record coordinates")
        print("3. Copy the coordinates to DEFAULT_ICON_COORDS")
        print("\nMove mouse to extension icon and press Enter...")

        input()  # Wait for Enter

        # Get current mouse position
        x, y = pyautogui.position()
        resolution = ExtensionHelper.get_screen_resolution()

        print(f"\nCoordinates recorded:")
        print(f"   Resolution: {resolution}")
        print(f"   X: {x}")
        print(f"   Y: {y}")
        print(f"\nAdd this to DEFAULT_ICON_COORDS:")
        print(f"   '{resolution}': ({x}, {y}),")
        print("\n" + "=" * 60)

        return (x, y)

    @staticmethod
    def take_extension_icon_screenshot(output_path: str = 'fixtures/extension_icon.png'):
        """
        Helper to take a screenshot of the extension icon for image recognition.

        Usage:
            1. Open Chrome with extension visible
            2. Run this function
            3. Move mouse to top-left corner of icon
            4. Press Enter
            5. Move mouse to bottom-right corner of icon
            6. Press Enter
            7. Screenshot saved!

        Args:
            output_path: Where to save the icon screenshot
        """
        print("=" * 60)
        print("Extension Icon Screenshot Tool")
        print("=" * 60)
        print("\nInstructions:")
        print("1. Move mouse to TOP-LEFT corner of icon, press Enter")
        print("2. Move mouse to BOTTOM-RIGHT corner of icon, press Enter")
        print("3. Screenshot will be saved\n")

        print("Move to TOP-LEFT corner and press Enter...")
        input()
        x1, y1 = pyautogui.position()
        print(f"   Recorded: ({x1}, {y1})")

        print("Move to BOTTOM-RIGHT corner and press Enter...")
        input()
        x2, y2 = pyautogui.position()
        print(f"   Recorded: ({x2}, {y2})")

        # Calculate region
        region = (x1, y1, x2 - x1, y2 - y1)

        # Take screenshot
        screenshot = pyautogui.screenshot(region=region)

        # Save
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        screenshot.save(output_file)

        print(f"\nScreenshot saved to: {output_file}")
        print(f"   Size: {x2 - x1}x{y2 - y1} pixels")
        print("\nUse this in your tests:")
        print(f"   ExtensionHelper.click_extension_icon_by_image('{output_path}')")
        print("\n" + "=" * 60)


# Example usage and testing
if __name__ == '__main__':
    """
    Interactive tools for setting up PyAutoGUI extension clicking.

    Run this file directly to:
    1. Calibrate coordinates
    2. Take icon screenshot
    3. Test clicking

    Usage: python helpers/extension_helper.py
    """
    import sys

    print("\n" + "=" * 60)
    print("Extension Helper - Setup Tools")
    print("=" * 60)
    print("\nChoose an option:")
    print("1. Calibrate extension icon coordinates")
    print("2. Take extension icon screenshot")
    print("3. Test clicking (coordinates)")
    print("4. Test clicking (image recognition)")
    print("5. Show current screen resolution")
    print("\nEnter choice (1-5): ", end='')

    choice = input().strip()

    if choice == '1':
        ExtensionHelper.calibrate_extension_icon_coordinates()

    elif choice == '2':
        ExtensionHelper.take_extension_icon_screenshot()

    elif choice == '3':
        print("\nTesting coordinate-based clicking in 3 seconds...")
        print("   (Make sure Chrome with extension is open!)")
        time.sleep(3)
        ExtensionHelper.click_extension_icon_by_coordinates()
        print("Done! Did the popup open?")

    elif choice == '4':
        icon_path = input("\nEnter path to icon image (or press Enter for default): ").strip()
        if not icon_path:
            icon_path = 'fixtures/extension_icon.png'

        if not Path(icon_path).exists():
            print(f"Image not found: {icon_path}")
            print("   Run option 2 first to create the screenshot!")
        else:
            print("\nTesting image recognition in 3 seconds...")
            print("   (Make sure Chrome with extension is open!)")
            time.sleep(3)
            success = ExtensionHelper.click_extension_icon_by_image(icon_path)
            if success:
                print("Done! Did the popup open?")
            else:
                print("Could not find icon on screen")

    elif choice == '5':
        resolution = ExtensionHelper.get_screen_resolution()
        print(f"\nCurrent resolution: {resolution}")
        if resolution in ExtensionHelper.DEFAULT_ICON_COORDS:
            coords = ExtensionHelper.DEFAULT_ICON_COORDS[resolution]
            print(f"   Default icon coords: {coords}")
        else:
            print(f"   No default coords for this resolution")
            print(f"   Run option 1 to calibrate!")

    else:
        print("Invalid choice")
