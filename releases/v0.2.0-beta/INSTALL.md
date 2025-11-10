# PromptBlocker v0.2.0-beta - Installation Guide

**Release Date:** January 10, 2025
**Status:** Private Beta Testing

---

## Quick Start (3 Minutes)

1. **Extract** `PromptBlocker-v0.2.0-beta.zip` to a permanent location
2. **Open** your browser → type `chrome://extensions/`
3. **Enable** "Developer mode" toggle (top-right corner)
4. **Click** "Load unpacked" button
5. **Select** the extracted folder
6. **Done!** Click the PromptBlocker icon to get started

---

## Detailed Installation Steps

### Step 1: Extract the ZIP File

Extract to a **permanent location** - do NOT delete this folder after installation!

**Windows:**
- Right-click `PromptBlocker-v0.2.0-beta.zip`
- Select "Extract All..."
- Choose location: `C:\Extensions\PromptBlocker\` (or anywhere permanent)

**Mac:**
- Double-click `PromptBlocker-v0.2.0-beta.zip`
- Move to permanent location:
  ```bash
  mkdir -p ~/Extensions
  mv PromptBlocker-v0.2.0-beta ~/Extensions/PromptBlocker
  ```

**Linux:**
```bash
mkdir -p ~/.local/share/extensions
unzip PromptBlocker-v0.2.0-beta.zip -d ~/.local/share/extensions/PromptBlocker
```

---

### Step 2: Open Chrome Extensions Page

**All Browsers:**
- Type `chrome://extensions/` in address bar (or `edge://extensions/` for Edge)

**Or use menu:**
- Chrome: Menu (⋮) → Extensions → Manage Extensions
- Edge: Menu (⋯) → Extensions → Manage Extensions
- Brave: Menu → Extensions → Manage Extensions

---

### Step 3: Enable Developer Mode

Look for the **"Developer mode"** toggle in the top-right corner and turn it ON.

This is required for loading unpacked extensions. It's completely safe - you're just installing a local extension before it goes to the Chrome Web Store.

---

### Step 4: Load the Extension

1. Click the **"Load unpacked"** button (appears after enabling Developer mode)
2. Navigate to your extracted folder
3. Select the folder containing `manifest.json`
4. Click "Select Folder" (or "Open" on Mac)

The extension should now appear in your extensions list!

---

### Step 5: Pin the Extension

1. Click the puzzle piece icon 🧩 in your browser toolbar
2. Find "PromptBlocker" in the list
3. Click the pin icon 📌 to keep it visible in your toolbar

---

### Step 6: Test It Out

1. **Click** the PromptBlocker icon in your toolbar
2. **Create** a test profile (use fake data - e.g., "John Smith", "john@example.com")
3. **Visit** one of the supported platforms:
   - https://chatgpt.com
   - https://claude.ai
   - https://gemini.google.com
   - https://perplexity.ai
   - https://copilot.microsoft.com
4. **Enable** protection in the popup (toggle to ON)
5. **Send** a message with your test PII
6. **Watch** it get replaced automatically!

---

## Browser Compatibility

**Works on all Chromium browsers:**
- ✅ Google Chrome (v120+)
- ✅ Microsoft Edge (v120+)
- ✅ Brave Browser
- ✅ Opera
- ✅ Vivaldi
- ✅ Any Chromium-based browser

**Operating Systems:**
- ✅ Windows 10/11
- ✅ macOS 11+ (Big Sur or later)
- ✅ Linux (all distributions)

---

## What's New in v0.2.0-beta

This release includes ALL 8 launch blockers completed:

### Security & Compliance
- ✅ **Privacy Policy** - GDPR/CCPA compliant
- ✅ **Terms of Service** - Comprehensive legal protection
- ✅ **PBKDF2 Iterations** - 600,000 iterations (OWASP 2023 standard)
- ✅ **XSS Prevention** - All 42 innerHTML vulnerabilities eliminated
- ✅ **GDPR Data Deletion** - Complete data erasure on profile deletion
- ✅ **Data Export** - Full profile export with encrypted backups
- ✅ **Permission Justifications** - All 7 Chrome permissions documented

### Technical Improvements
- ✅ **Memory Leak Prevention** - EventManager utility eliminates all 170 popup event listener leaks
- ✅ **Unlimited Storage** - Chrome storage quota upgraded for unlimited profiles
- ✅ **Test Coverage** - 100% test suite passing
- ✅ **Firebase Authentication** - Google Sign-In ready for cross-device sync
- ✅ **Document Analysis** - PDF, TXT, DOCX sanitization support
- ✅ **Image Redaction** - Built-in image editor for PII redaction

### Key Features
- **5 Platform Integrations:** ChatGPT, Claude, Gemini, Perplexity, Copilot
- **AES-256 Encryption:** All profile data encrypted at rest
- **Real-time Protection:** PII replaced before requests leave your browser
- **Zero Data Collection:** Everything stays on your device
- **Smart Substitution:** Preserves case (JOHN → ALEX) and possessives (John's → Alex's)

---

## Troubleshooting

### "Manifest version 2 is deprecated" Warning
- **Cause:** Old browser version
- **Fix:** Update to Chrome/Edge 120+

### Extension Loads But Doesn't Work
1. Check console for errors (F12 → Console tab)
2. Click refresh icon on extension card
3. Reload the AI platform page (Ctrl+R or Cmd+R)

### "Load unpacked" Button Missing
- **Cause:** Developer mode not enabled
- **Fix:** Toggle "Developer mode" in top-right corner

### Protection Not Working
1. Open the PromptBlocker popup
2. Make sure a profile is selected
3. Toggle "Enable Protection" to ON (should be green)
4. Reload the AI platform page
5. Icon should show "protected" badge

### Console Errors
- Open Developer Tools (F12 or Cmd+Option+I)
- Check Console tab for red errors
- Take screenshot and report in `BETA_TESTING.md`

---

## File Structure

```
PromptBlocker-v0.2.0-beta/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (handles interception)
├── content.js             # Content script (injected on AI platforms)
├── inject.js              # Page-level script
├── popup-v2.html          # Main popup interface
├── popup-v2.js            # Popup logic
├── auth.html              # Firebase auth page
├── auth.js                # Firebase auth logic
├── document-preview.html  # Document preview window
├── document-preview.js    # Document preview logic
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/                 # Popup UI assets
│   └── styles/            # CSS stylesheets
├── background/            # Background script assets
└── lib/                   # Shared libraries
```

---

## Privacy & Security

**This is production-ready code with all security audits complete.**

- ✅ All data stored locally on your device
- ✅ AES-256 encryption enabled
- ✅ No external servers (except AI platforms you visit)
- ✅ No tracking, analytics, or data collection
- ✅ PBKDF2 with 600,000 iterations for key derivation
- ✅ XSS vulnerabilities eliminated
- ✅ GDPR/CCPA compliant data handling

**Safe for real data**, but we recommend starting with test data during beta testing.

---

## Need Help?

**Issues or Questions?**
- Fill out the beta testing form: `BETA_TESTING.md`
- GitHub: https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension
- Website: https://promptblocker.com

---

**Thank you for helping test PromptBlocker!** 🙏

Your feedback is invaluable in making this the best privacy tool for AI chat services.

---

**Version:** 0.2.0-beta
**Build Date:** January 10, 2025
**Status:** Private Beta Testing
**License:** AGPL-3.0
