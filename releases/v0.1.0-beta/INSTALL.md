# PromptBlocker v0.1.0-beta - Installation Instructions

**Release Date:** 2025-11-03
**Status:** Beta Testing Release

---

## 📥 Downloads

**For End Users (Recommended):**
- **`PromptBlocker-v0.1.0-beta-chromium.zip`** (7.2MB)
- Works on: Windows, Mac, Linux
- Compatible with: Chrome, Edge, Brave (any Chromium-based browser)
- Just extract and load - no nested folders!

**For Developers:**
- **`promptblocker-v0.1.0-beta.zip`** (7.2MB)
- Same build, includes nested folder structure

> **Note:** Both Windows and Mac use the SAME build. Chrome extensions are cross-platform!

---

## 📦 What's Included

This release contains the production build of PromptBlocker with:
- ✅ 5 platform integrations (ChatGPT, Claude, Gemini, Perplexity, Copilot)
- ✅ AES-256 encryption for profile storage
- ✅ Firebase authentication (Google Sign-In)
- ✅ 289/289 unit tests passing
- ✅ Refactored modular architecture

---

## 🖥️ Windows Installation

### Prerequisites
- Chrome 120+ or Edge 120+ (Chromium-based browser)
- Windows 10/11

### Installation Steps

1. **Extract the ZIP file**
   - Right-click `PromptBlocker-v0.1.0-beta-chromium.zip`
   - Select "Extract All..."
   - Choose a permanent location (e.g., `C:\Extensions\PromptBlocker\`)
   - ⚠️ **Important:** Do NOT delete this folder after installation!

2. **Open Chrome Extensions**
   - Open Chrome/Edge
   - Navigate to: `chrome://extensions/` (or `edge://extensions/`)
   - Or: Menu → Extensions → Manage Extensions

3. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to the extracted folder
   - Select the folder containing `manifest.json`
   - Click "Select Folder"

5. **Verify Installation**
   - Extension should appear in your extensions list
   - Click the puzzle piece icon in toolbar
   - Pin PromptBlocker for easy access
   - Click the PromptBlocker icon to open popup

6. **Test the Extension**
   - Open popup and create a test profile
   - Visit one of the supported platforms:
     - https://chatgpt.com
     - https://claude.ai
     - https://gemini.google.com
     - https://perplexity.ai
     - https://copilot.microsoft.com
   - Enable protection in the popup
   - Try sending a message with your test PII

---

## 🍎 Mac Installation

### Prerequisites
- Chrome 120+ or Brave (Chromium-based browser)
- macOS 11 (Big Sur) or later

### Installation Steps

1. **Extract the ZIP file**
   - Double-click `PromptBlocker-v0.1.0-beta-chromium.zip`
   - Move the extracted folder to a permanent location:
     ```bash
     mkdir -p ~/Extensions
     mv PromptBlocker-v0.1.0-beta-chromium ~/Extensions/PromptBlocker
     ```
   - ⚠️ **Important:** Do NOT delete this folder after installation!

2. **Open Chrome Extensions**
   - Open Chrome/Brave
   - Navigate to: `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

3. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to: `~/Extensions/PromptBlocker/`
   - Select the folder containing `manifest.json`
   - Click "Open"

5. **Verify Installation**
   - Extension should appear in your extensions list
   - Click the puzzle piece icon in toolbar (or Extensions icon)
   - Pin PromptBlocker for easy access
   - Click the PromptBlocker icon to open popup

6. **Test the Extension**
   - Open popup and create a test profile
   - Visit one of the supported platforms:
     - https://chatgpt.com
     - https://claude.ai
     - https://gemini.google.com
     - https://perplexity.ai
     - https://copilot.microsoft.com
   - Enable protection in the popup
   - Try sending a message with your test PII

---

## 🧪 Testing Checklist

Use this checklist to verify the extension works correctly:

### Basic Functionality
- [ ] Extension loads without errors
- [ ] Popup opens and displays correctly
- [ ] Can create a new profile
- [ ] Can edit an existing profile
- [ ] Can delete a profile
- [ ] Can switch between profiles
- [ ] Protection toggle works (on/off)

### Platform Testing
Test on each supported platform:

**ChatGPT (chat.openai.com or chatgpt.com)**
- [ ] Extension icon shows "active" state
- [ ] PII is replaced in outgoing prompts
- [ ] Real data is visible in AI responses
- [ ] Stats are tracked correctly

**Claude (claude.ai)**
- [ ] Extension icon shows "active" state
- [ ] PII is replaced in outgoing prompts
- [ ] Real data is visible in AI responses
- [ ] Stats are tracked correctly

**Google Gemini (gemini.google.com)**
- [ ] Extension icon shows "active" state
- [ ] PII is replaced in outgoing prompts
- [ ] Real data is visible in AI responses
- [ ] Stats are tracked correctly

**Perplexity AI (perplexity.ai)**
- [ ] Extension icon shows "active" state
- [ ] PII is replaced in outgoing prompts
- [ ] Real data is visible in AI responses
- [ ] Stats are tracked correctly

**Microsoft Copilot (copilot.microsoft.com)**
- [ ] Extension icon shows "active" state
- [ ] PII is replaced in outgoing prompts
- [ ] Real data is visible in AI responses
- [ ] Stats are tracked correctly

### Advanced Features
- [ ] Firebase Google Sign-In works
- [ ] Activity log displays substitutions
- [ ] Export profiles works
- [ ] Import profiles works
- [ ] Settings persist after browser restart

### Edge Cases
- [ ] Handles multiple profiles correctly
- [ ] Case preservation works (JOHN → ALEX, John → Alex)
- [ ] Possessive handling works (John's → Alex's)
- [ ] No data leaks when protection is disabled
- [ ] Console has no errors (F12 → Console tab)

---

## 🐛 Known Issues (Beta)

1. **Large Bundle Sizes**
   - popup-v2.js is 3.72 MB (includes Firebase)
   - auth.js is 3.15 MB (includes Firebase)
   - This is expected and will be optimized in production

2. **Security Hardening Pending**
   - Some XSS vulnerabilities exist (innerHTML usage)
   - localStorage used instead of chrome.storage in some places
   - Will be fixed in Phase 1 security hardening

3. **Icon Placeholders**
   - Current icons are placeholder designs
   - New brand-consistent icons will be added before store launch

---

## 📊 Reporting Issues

If you encounter any issues during testing:

1. **Check Console for Errors**
   - Open Developer Tools (F12 or Cmd+Option+I)
   - Go to Console tab
   - Look for red error messages
   - Take screenshots

2. **Reproduce the Issue**
   - Note exact steps to reproduce
   - Which platform were you using?
   - What profile data was involved?
   - What was the expected vs actual behavior?

3. **Report on GitHub**
   - Create a new issue: https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues
   - Include:
     - Your OS and browser version
     - Steps to reproduce
     - Console errors (if any)
     - Screenshots (redact any real PII!)
     - Extension version (v0.1.0-beta)

---

## 🔒 Privacy & Security Notes

**This is a BETA release. Use test data only.**

- ✅ All data is stored locally on your device
- ✅ AES-256 encryption is enabled
- ✅ No data is sent to external servers (except AI platforms you visit)
- ⚠️ Some security hardening is still pending (see Known Issues)
- ⚠️ Do NOT use real sensitive PII until Phase 1 security audit is complete

---

## 🆘 Troubleshooting

### Extension Won't Load
- **Cause:** manifest.json not found
- **Solution:** Make sure you selected the folder that contains all the files, not a parent folder

### "Manifest version 2 is deprecated"
- **Cause:** Wrong browser version
- **Solution:** Update Chrome/Edge to version 120+

### Extension Loads But Doesn't Work
- **Cause:** Content scripts not injecting
- **Solution:**
  1. Check console for errors
  2. Reload the extension (click refresh icon)
  3. Reload the AI platform page (Ctrl+R or Cmd+R)

### "Failed to fetch" Errors
- **Cause:** Network issues or CORS
- **Solution:** Check your internet connection, try reloading

### Firebase Sign-In Fails
- **Cause:** Firebase config missing or invalid
- **Solution:** This is expected if Firebase isn't configured yet. Feature can be skipped for basic testing.

### Stats Not Tracking
- **Cause:** Protection not enabled or profile not selected
- **Solution:**
  1. Open popup
  2. Select a profile
  3. Toggle "Enable Protection" to ON (green)
  4. Verify icon shows "active" state

---

## 📁 File Structure

```
promptblocker-v0.1.0-beta/
├── manifest.json         # Extension configuration
├── background.js         # Service worker
├── content.js            # Content script (injected on AI platforms)
├── inject.js             # Page-level script
├── popup-v2.html         # Popup interface
├── popup-v2.js           # Popup logic (3.72 MB - includes Firebase)
├── auth.html             # Firebase auth page
├── auth.js               # Firebase auth logic (3.15 MB)
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/                # Popup UI assets
├── styles/               # CSS files
└── lib/                  # Shared libraries
```

---

## 🚀 Next Steps After Testing

Once testing is complete and issues are resolved:

1. **Phase 1 - Security Hardening** (5-7 days)
   - Fix XSS vulnerabilities
   - Replace localStorage with chrome.storage
   - Improve encryption key generation

2. **Generate Production Assets**
   - Create brand-consistent icons
   - Capture screenshots with annotations
   - Generate promotional materials

3. **Update Documentation**
   - Finalize Privacy Policy
   - Complete Chrome Web Store listing

4. **Chrome Web Store Submission**
   - Create developer account ($5)
   - Upload extension with assets
   - Submit for review (1-3 days)

---

## 📞 Support

- **GitHub:** https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension
- **Website:** https://promptblocker.com
- **Email:** [Your contact email]

---

**Thank you for testing PromptBlocker!** 🙏

Your feedback helps make this extension better for everyone who values their digital privacy.

---

**Version:** 0.1.0-beta
**Build Date:** 2025-11-03
**Status:** Beta Testing
**License:** AGPL-3.0
