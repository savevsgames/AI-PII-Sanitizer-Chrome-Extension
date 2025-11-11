# PromptBlocker - Releases

Official release packages for PromptBlocker - Privacy protection for AI chat services.

---

## 📦 Latest Release

### v0.2.0-beta (2025-01-10) ⭐ **NEW!**

**Status:** Private Beta Testing - **All 8 Launch Blockers Complete!** 🎉

**Download:** `v0.2.0-beta/PromptBlocker-v0.2.0-beta.zip` (13MB)

**What's New:**
- ✅ All 8 security launch blockers complete (Privacy Policy, Terms, PBKDF2, XSS fixes, GDPR deletion, Data export, Permissions, Memory leaks)
- ✅ Production-ready security and compliance
- ✅ EventManager eliminates all 170 popup memory leaks
- ✅ Unlimited storage quota enabled
- ✅ Complete test coverage passing

**Installation:**
See `v0.2.0-beta/INSTALL.md` for step-by-step instructions.

**Beta Testing:**
Please use `v0.2.0-beta/BETA_TESTING.md` to report feedback!

---

## 🚀 Quick Install (All Versions)

**Same build works on Windows, Mac & Linux - Chrome extensions are cross-platform!**

1. Download the ZIP file from your desired version folder
2. Extract to a permanent location
3. Open Chrome/Edge/Brave → `chrome://extensions/`
4. Enable "Developer mode" (toggle in top-right)
5. Click "Load unpacked" → Select extracted folder
6. Done! Click the extension icon to get started

---

## 📋 Version History

| Version | Date | Size | Status | Notes |
|---------|------|------|--------|-------|
| **0.2.0-beta** | 2025-01-10 | 13MB | **Private Beta** | **All 8 launch blockers complete** - Security audited |
| 0.1.0-beta | 2025-11-03 | 7.2MB | Superseded | Initial testing release |

---

## 🔥 v0.2.0-beta Highlights

This release represents **100% completion of Phase 1 launch blockers**:

### Security & Compliance (All Complete)
- **Boss #1:** Privacy Policy ✅ (GDPR/CCPA compliant)
- **Boss #2:** Terms of Service ✅ (comprehensive legal protection)
- **Boss #3:** PBKDF2 Iterations ✅ (600,000 - OWASP 2023)
- **Boss #4:** XSS Vulnerabilities ✅ (42 innerHTML fixes)
- **Boss #5:** GDPR Data Deletion ✅ (complete erasure)
- **Boss #6:** Data Export ✅ (encrypted backups)
- **Boss #7:** Permission Justifications ✅ (all 7 documented)
- **Boss #8:** Memory Leaks ✅ (170 listeners fixed)

### Core Features
- **5 Platform Integrations:** ChatGPT, Claude, Gemini, Perplexity, Copilot
- **AES-256 Encryption:** All profile data encrypted at rest
- **Real-time Protection:** PII replaced before leaving browser
- **Document Sanitization:** PDF, TXT, DOCX support
- **Image Redaction:** Built-in PII redaction editor
- **Smart Substitution:** Preserves case (JOHN → ALEX) and possessives (John's → Alex's)
- **Zero Data Collection:** Everything stays on your device
- **Firebase Authentication:** Optional Google Sign-In for cross-device sync

---

## 🌐 Platform Support

**Compatible Browsers:**
- ✅ Google Chrome 120+
- ✅ Microsoft Edge 120+
- ✅ Brave Browser
- ✅ Opera
- ✅ Vivaldi
- ✅ Any Chromium-based browser

**Operating Systems:**
- ✅ Windows 10/11
- ✅ macOS 11+ (Big Sur or later)
- ✅ Linux (all distributions)

**AI Platforms Protected:**
- ✅ ChatGPT (chat.openai.com, chatgpt.com)
- ✅ Claude (claude.ai)
- ✅ Google Gemini (gemini.google.com)
- ✅ Perplexity AI (perplexity.ai)
- ✅ Microsoft Copilot (copilot.microsoft.com)

---

## 🧪 Beta Testing

We're currently in **private beta testing** for v0.2.0-beta.

**Want to help test?**
1. Download `v0.2.0-beta/PromptBlocker-v0.2.0-beta.zip`
2. Follow install instructions in `v0.2.0-beta/INSTALL.md`
3. Use the extension normally
4. Report feedback using `v0.2.0-beta/BETA_TESTING.md`

**Testing Focus Areas:**
- Cross-platform compatibility (Windows/Mac/Linux)
- All 5 AI platforms working correctly
- Memory usage during long sessions
- Data persistence after browser restart
- Real-world PII substitution accuracy

---

## 📥 Release Process

To create a new release:

1. **Update version** in `dist/manifest.json`
2. **Build production version:**
   ```bash
   npm run build
   ```
3. **Run full test suite:**
   ```bash
   npm run test
   ```
4. **Create release folder:**
   ```bash
   mkdir -p releases/vX.X.X
   ```
5. **Package extension:**
   ```bash
   cd releases/vX.X.X
   powershell -Command "Compress-Archive -Path '../../dist/*' -DestinationPath 'PromptBlocker-vX.X.X.zip' -Force"
   ```
6. **Create documentation:**
   - `README.md` - Release overview
   - `INSTALL.md` - Installation instructions
   - `BETA_TESTING.md` - Testing checklist (for beta releases)
7. **Update this README** with new version
8. **Tag release in git:**
   ```bash
   git tag -a vX.X.X -m "Release vX.X.X"
   git push origin vX.X.X
   ```

---

## 🗂️ Folder Structure

```
releases/
├── README.md                                    # This file
├── v0.2.0-beta/                                # Latest release
│   ├── PromptBlocker-v0.2.0-beta.zip          # Extension package (13MB)
│   ├── README.md                               # Release overview
│   ├── INSTALL.md                              # Installation instructions
│   └── BETA_TESTING.md                         # Beta testing feedback form
├── v0.1.0-beta/                                # Previous release (superseded)
│   ├── promptblocker-v0.1.0-beta.zip
│   ├── INSTALL.md
│   └── DOWNLOAD.md
└── [future releases]/
```

---

## 🔒 Security Notes

**v0.2.0-beta is production-ready from a security standpoint:**

- ✅ All 8 security launch blockers complete
- ✅ XSS vulnerabilities eliminated (42 innerHTML fixes)
- ✅ PBKDF2 with 600,000 iterations (OWASP 2023 standard)
- ✅ AES-256 encryption for all stored data
- ✅ Memory leak prevention (EventManager utility)
- ✅ GDPR/CCPA compliant data handling
- ✅ Complete data deletion on profile removal
- ✅ No external servers or data collection

**Safe for real data**, but we recommend starting with test data during beta testing.

---

## 🎯 Roadmap

### Phase 1: Launch Blockers (Complete) ✅
- All 8 security and compliance requirements complete
- Production-ready code quality

### Phase 2: Beta Testing (Current)
- Private beta with friends (January 10-24, 2025)
- Collect feedback and fix any issues
- Cross-platform validation

### Phase 3: Polish & Optimization
- Bundle size optimization
- Final UI/UX improvements
- Create store assets (screenshots, promotional images)

### Phase 4: Chrome Web Store Launch (Target: February 2025)
- Submit to Chrome Web Store
- Public release
- Monitor reviews and feedback

---

## 📞 Support

- **GitHub:** https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension
- **Issues:** https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues
- **Website:** https://promptblocker.com
- **Beta Feedback:** Use `v0.2.0-beta/BETA_TESTING.md`

---

## 🙏 Beta Testers

Thank you to our beta testers who are helping make PromptBlocker better!

(List will be updated as testers provide feedback)

---

## 📄 License

**AGPL-3.0** - See LICENSE file in root directory

---

**Last Updated:** 2025-01-10
**Current Version:** v0.2.0-beta (Private Beta)
**Next Release:** Public launch (February 2025)
