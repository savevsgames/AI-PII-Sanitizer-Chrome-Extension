# PromptBlocker - Releases

This folder contains packaged releases of PromptBlocker for testing and distribution.

---

## 📦 Available Releases

### v0.1.0-beta (2025-11-03)
**Status:** Beta Testing Release

**Packages:**
- **`PromptBlocker-v0.1.0-beta-chromium.zip`** (7.2MB) - **← Download this one!**
  - For end users (Windows, Mac, Linux)
  - Clean extraction, no nested folders
- **`promptblocker-v0.1.0-beta.zip`** (7.2MB)
  - For developers
  - Same build, nested folder structure

**Features:**
- ✅ 5 platform integrations (ChatGPT, Claude, Gemini, Perplexity, Copilot)
- ✅ AES-256 encryption for profile storage
- ✅ Firebase authentication (Google Sign-In)
- ✅ 289/289 unit tests passing
- ✅ Refactored modular architecture

**Installation:**
See `v0.1.0-beta/INSTALL.md` for detailed instructions for Windows and Mac.

**Known Issues:**
- Large bundle sizes (includes Firebase)
- Security hardening pending (Phase 1)
- Placeholder icons

**Testing Focus:**
- Cross-platform compatibility (Windows/Mac)
- All 5 AI platforms working correctly
- Profile creation/editing/deletion
- PII substitution accuracy
- Stats tracking

---

## 🚀 Quick Install (Works on Windows, Mac & Linux)

**Same build works everywhere - Chrome extensions are cross-platform!**

1. Download `PromptBlocker-v0.1.0-beta-chromium.zip`
2. Extract to a permanent location
3. Open Chrome/Edge/Brave → `chrome://extensions/`
4. Enable "Developer mode" (toggle in top-right)
5. Click "Load unpacked" → Select extracted folder
6. Done! Click the extension icon to get started

**Detailed instructions:** See `v0.1.0-beta/INSTALL.md`

---

## 📋 Release Process

To create a new release:

1. **Update version** in `dist/manifest.json`
2. **Build production version:**
   ```bash
   npm run build
   ```
3. **Create release folder:**
   ```bash
   mkdir -p releases/vX.X.X
   ```
4. **Package extension:**
   ```bash
   cd releases/vX.X.X
   powershell -Command "Compress-Archive -Path '../../dist/*' -DestinationPath 'promptblocker-vX.X.X.zip' -Force"
   ```
5. **Create/update INSTALL.md** with release notes
6. **Test on Windows and Mac**
7. **Tag release in git:**
   ```bash
   git tag -a vX.X.X -m "Release vX.X.X"
   git push origin vX.X.X
   ```

---

## 🗂️ Folder Structure

```
releases/
├── README.md                              # This file
├── v0.1.0-beta/
│   ├── promptblocker-v0.1.0-beta.zip     # Packaged extension (7.2MB)
│   └── INSTALL.md                         # Installation instructions
└── [future releases]/
```

---

## 📊 Version History

| Version | Date | Size | Status | Notes |
|---------|------|------|--------|-------|
| 0.1.0-beta | 2025-11-03 | 7.2MB | Beta Testing | Initial testing release |

---

## 🔒 Security Notes

**Beta releases are for testing only.**

- Use test data, not real sensitive PII
- Security hardening is pending (Phase 1)
- Report any security issues privately to: [security email]

---

## 📞 Support

- **GitHub:** https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension
- **Issues:** https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues
- **Website:** https://promptblocker.com

---

**Last Updated:** 2025-11-03
