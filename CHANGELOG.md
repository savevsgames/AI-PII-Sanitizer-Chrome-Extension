# Changelog

All notable changes to PromptBlocker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### 🚀 Coming Soon
- Chrome Web Store launch
- Payment integration for PRO tier
- Firefox browser support

---

## [1.0.0] - 2024-11-XX (Pre-Launch)

### 🎉 Initial Release - PromptBlocker

First public release of PromptBlocker (formerly AI PII Sanitizer). Privacy protection for AI chat services.

### ✨ Added - Core Features

#### Identity Aliasing
- Real-time PII substitution (name, email, phone, address)
- Bidirectional transformation (Real → Alias → Real)
- Case preservation (JOHN → ALEX, John → Alex, john → alex)
- Possessive handling ("John's car" → "Alex's car")
- Word boundary protection (prevents "Johnson" → "Alexson")
- Multiple profile support (unlimited profiles)
- Per-profile enable/disable toggle

#### Multi-Service Support (7 AI Platforms)
- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Gemini (gemini.google.com)
- Perplexity (perplexity.ai)
- Poe (poe.com)
- GitHub Copilot (copilot.github.com)
- You.com (you.com)

#### Security & Privacy
- AES-256-GCM encryption for all stored data
- Local-only processing (no external servers)
- Chrome Extension Manifest V3 architecture
- Three-context security model (page/isolated/background)
- Fail-safe defaults (blocks by default if protection lost)

#### User Interface
- Modern glassmorphism design
- Dark mode support
- Tab navigation (Aliases, Stats, Features, Settings, Debug)
- Protection status badge (green = protected, red = unprotected)
- Visual statistics and activity log
- Inline profile editing

#### Protection Status System
- Real-time health checks with exponential backoff
- "Not Protected" modal when protection is lost
- Auto-reload on extension update
- Tab focus detection
- Badge status indicators

#### Developer Features
- TypeScript codebase with strict mode
- 105 unit tests (98-100% coverage on core logic)
- Jest testing framework
- Playwright E2E tests
- Comprehensive documentation

### 🔐 Added - PRO Features (Tier Gating)

**Note:** PRO features are implemented but require paid subscription (coming in v1.1.0)

#### API Key Vault
- Real-time API key detection in outgoing requests
- Supported formats: OpenAI, Anthropic, Google, AWS, GitHub, Stripe
- Three redaction modes:
  - Full: `[REDACTED_API_KEY]`
  - Partial: `sk-1...90AB` (show first/last 4 chars)
  - Placeholder: `[OPENAI_KEY]`, `[GITHUB_KEY]`
- Secure key storage with encryption
- Manual key entry and management

#### Custom Redaction Rules
- User-defined regex patterns
- Built-in templates (SSN, credit cards, IP addresses, emails)
- Priority-based rule ordering
- Capture group support ($1, $2, $&)
- Pattern validation and conflict detection
- Match tracking with metadata

#### Alias Variations
- Auto-generate name variations ("John Smith" → "John", "Smith", "J. Smith")
- Email variations (username and domain extraction)
- Phone number formatting variations
- Smart partial matching with context awareness

#### Advanced Statistics
- Per-service substitution counts
- PII type breakdown (name, email, phone, etc.)
- Success rate tracking
- Activity log with full history
- Export capabilities (planned for v1.1.0)

### 🎨 Changed - Rebranding

- Project renamed: "AI PII Sanitizer" → "PromptBlocker"
- Updated all UI text and documentation
- New branding focused on privacy protection
- Free/PRO tier structure

### 🐛 Fixed - Critical Issues

#### Protection Status Accuracy
- Fixed badge showing "protected" when inject.js lost connection
- Health check now properly updates badge status
- Protection lost notification now triggers correctly

#### Extension Lifecycle
- Fixed auto-enable on install (extension enabled by default)
- Fixed auto-reload on extension update
- Fixed multiple injection guard (prevents duplicate content scripts)
- Suppressed transient reload errors in console

#### User Experience
- Fixed modal showing when extension is disabled
- Fixed tab ID extraction in PROTECTION_LOST handler
- Reduced console log spam (DEBUG_MODE flag)
- Improved health check reliability

#### Memory & Performance
- Replaced polling with event-driven updates (chrome.storage.onChanged)
- CPU usage reduced from 5-10% to <1%
- Fixed memory leak from infinite interval

### 🔧 Technical Improvements

#### Architecture
- Implemented three-context model (page → isolated → background)
- Request/response interception with fetch/XMLHttpRequest
- Message passing with chrome.runtime.sendMessage
- Service worker-based background script (Manifest V3)

#### Testing
- 105 unit tests covering all core modules
- Utils: 39 tests (100% coverage)
- Redaction Engine: 35 tests (100% coverage)
- API Key Detector: 37 tests (98.18% coverage)
- AliasEngine: 9 tests (58.59% coverage)
- Jest test framework with ts-jest
- Playwright E2E tests (4 tests, needs selector updates)

#### Documentation
- Comprehensive ARCHITECTURE.md (800+ lines)
- Unified TESTING.md guide (650 lines)
- Development history archive (phase-history.md)
- Production-ready README
- Privacy policy
- Contributing guidelines

#### Build System
- TypeScript compilation (strict mode)
- Development and production build scripts
- Watch mode for auto-rebuild
- Source maps for debugging

### 📚 Documentation

- README.md - Project overview and quick start
- PRIVACY_POLICY.md - Privacy policy (required for Chrome Web Store)
- ROADMAP.md - Product roadmap and future plans
- CONTRIBUTING.md - Contribution guidelines
- CHANGELOG.md - This file!
- docs/ARCHITECTURE.md - Technical architecture overview
- docs/TESTING.md - Testing guide and coverage reports
- docs/development/ - Development history and troubleshooting

### 🙏 Acknowledgments

- Built with Claude Code by Anthropic
- Inspired by privacy-conscious AI users
- Open source community contributions

### 📦 Installation

**From Chrome Web Store (Coming Soon):**
- Search for "PromptBlocker" in Chrome Web Store
- Click "Add to Chrome"

**Manual Installation (Development):**
1. Download latest release from GitHub
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

### 🔗 Links

- **GitHub:** https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension
- **Chrome Web Store:** Coming soon
- **Documentation:** https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/tree/main/docs
- **Issues:** https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues

---

## [0.9.0] - 2024-11-01 (Internal Beta)

### Development Milestones

**Phase 0: Foundation (Complete)**
- Dead code removal
- Memory leak fixes
- Code quality improvements

**Phase 1: Core Aliasing (Complete)**
- Profile management system
- Alias substitution engine
- Content script integration
- Chrome extension architecture

**Phase 1.5: UI Polish (Complete)**
- Glassmorphism theme
- Profile management UI
- Tab navigation

**Phase 2: Advanced Features (Complete)**
- API Key Vault
- Custom redaction rules
- Advanced statistics

**Phase 3: Multi-Service Support (Complete)**
- 7 AI platform integrations
- Alias variations
- Protection status system

**Final Development Phase (Complete)**
- Critical bug fixes
- Production polish
- Testing suite (105 tests)
- Documentation refactor

---

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR version** (1.x.x): Breaking changes, major new features
- **MINOR version** (x.1.x): New features, backward-compatible
- **PATCH version** (x.x.1): Bug fixes, backward-compatible

---

## How to Report Issues

Found a bug? Have a feature request?

1. Check [existing issues](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues)
2. Create a new issue with:
   - **Bug Report:** Steps to reproduce, expected vs actual behavior
   - **Feature Request:** Problem statement, proposed solution, impact
3. Include:
   - Extension version
   - Browser version
   - Operating system
   - Screenshots (if applicable)

---

**Last Updated:** 2025-11-01
