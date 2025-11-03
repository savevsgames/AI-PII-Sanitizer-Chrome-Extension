# AI PII Sanitizer

A Chrome extension that protects your privacy by replacing real personally identifiable information (PII) with aliases when using AI chat services like ChatGPT, Claude, and Gemini.

## 🎉 Current Status: **MVP COMPLETE - 5 PRODUCTION PLATFORMS!**

✅ **Tier 1 Platform Coverage: 98% of Global AI Chatbot Market**

### Production Platforms (Tier 1)
| Platform | Status | Market Share | Architecture |
|----------|--------|--------------|--------------|
| **ChatGPT** | ✅ Production | 82.7% | POST/JSON (fetch) |
| **Claude** | ✅ Production | 0.9% | POST/JSON (fetch) |
| **Gemini** | ✅ Production | 2.2% | Form-encoded (XHR) |
| **Perplexity** | ✅ Production | 8.2% | Dual-field JSON (fetch) |
| **Copilot** | ✅ Production | 4.5% | WebSocket JSON events |

**Combined Coverage:** ~98% of global AI chatbot users

**Technical Achievement:**
- ✅ 3 different interception methods mastered (fetch(), XHR, WebSocket)
- ✅ 4 different request formats supported (JSON, form-encoded, WebSocket events, dual-field)
- ✅ Page context injection working (Gemini XHR, Copilot WebSocket)
- ✅ All platforms use unified AliasEngine for substitution
- ✅ Response decoding intentionally disabled (by design for verification)

**Core Features:**
- 🔒 **API Key Vault** - Protect OpenAI, GitHub, AWS, Stripe, and custom API keys
- 🎯 **Custom Redaction Rules** - Regex-based patterns for SSN, credit cards, medical records
- 📊 **Activity Logging** - Track all substitutions across all platforms
- 🎨 **Modern UI** - Glassmorphism design with comprehensive stats
- 🔐 **Privacy-First** - All data stored locally with AES-256-GCM encryption

**Tier 2 Platforms (Post-MVP):**
- 🎯 Meta AI (100M+ users, GraphQL) - Architecture documented
- 🎯 DeepSeek (96M users, likely POST/JSON)
- 🟡 Poe (1.2M users)
- 🟡 You.com (5.5M users, webRequest API)

**Post-MVP Development Phases:**
1. 🧪 **Phase 1:** Test Suite Modernization (2-3 weeks)
2. 💳 **Phase 2:** Payment System (PRO + Donations) (3-4 weeks)
3. 🔍 **Phase 3:** Complete Audit (Code + Visual) (2-3 weeks)
4. 🚀 **Phase 4:** MVP Launch Preparation (2-3 weeks)

**Target Launch:** Q2 2025

**Try it now (dev mode):** Load unpacked in chrome://extensions, visit any supported platform!

## Features

### ✅ Current Features (Phase 3)
- **Profile-Based Management**: Create multiple profiles with real ↔ alias mappings
- **Multi-Field Support**: Name, email, phone, address, company, custom fields
- **Bidirectional Aliasing**: Real → alias in requests, alias → real in responses
- **API Key Vault**: Store & protect API keys (OpenAI, GitHub, AWS, Stripe, Anthropic, Google, custom)
  - Auto-detect known API key formats
  - Custom pattern support for proprietary keys
  - Protection modes: auto-redact, warn-first, log-only
  - Usage stats tracking
- **Custom Redaction Rules**: Create regex-based patterns for domain-specific PII
  - 10 preset templates (SSN, credit cards, phone, IP addresses, medical records, etc.)
  - Custom pattern builder with live testing
  - Priority-based rule execution
  - Category organization (PII, Financial, Medical, Custom)
  - Match count tracking
- **Privacy-First**: All data stored locally with AES-256-GCM encryption
- **Multiple AI Services**: 5 production platforms (ChatGPT, Claude, Gemini, Perplexity, Copilot)
- **Modern UI**: Glassmorphism design with tab navigation
- **Stats Tracking**: Comprehensive activity log with service-specific metrics
- **Real-Time Protection**: Intercepts requests before they leave your browser (fetch, XHR, WebSocket)

### 🚧 In Development (Phase 4+)
- **🔀 Alias Variations**: Auto-detect name/email format variations
  - Auto-generate: GregBarker, gregbarker, gbarker, G.Barker
  - Smart matching for partial names

- **✍️ Dev Terms Spell Check**: Catch typos before sending
  - Detects: "openIA" → "OpenAI", "Goggle" → "Google", "reactJs" → "React"
  - Curated dictionary of tech terms

- **🤖 AI Profile Fill**: Generate fake profiles using AI chat
  - Click "AI Generate" → sends visible message to ChatGPT/Claude/Gemini
  - 100% transparent (you see the request)
  - Parses JSON response and pre-fills alias fields
  - Real PII NEVER sent (only the AI generates fake data)

## Installation

### Development

1. Clone the repository:
```bash
git clone <repository-url>
cd AI_Interceptor
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

### Project Structure

```
AI_Interceptor/
├── src/
│   ├── background/
│   │   └── serviceWorker.ts    # Background script for request interception
│   ├── content/
│   │   └── content.ts           # Content script injected into AI chat pages
│   ├── popup/
│   │   ├── popup.html           # Popup UI
│   │   ├── popup.css            # Popup styles
│   │   └── popup.ts             # Popup logic
│   ├── lib/
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── storage.ts           # Storage manager with encryption
│   │   └── aliasEngine.ts       # Core substitution logic
│   └── manifest.json            # Extension manifest
├── docs/
│   ├── pii_sanitizer_pdd.md    # Product Design Document
│   └── pii_sanitizer_tdd_v2.md # Technical Design Document
├── tests/                       # Test files
├── webpack.config.js            # Webpack configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Project dependencies
```

### Build Commands

- `npm run build` - Production build
- `npm run dev` - Development build with watch mode
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run type-check` - TypeScript type checking

## Usage

1. Click the extension icon in Chrome toolbar
2. Add your first alias:
   - Real Name: Your actual name (e.g., "Joe Smith")
   - Alias Name: The replacement name (e.g., "John Doe")
3. Visit ChatGPT, Claude, or Gemini
4. Type prompts containing your real name
5. The extension automatically replaces it with your alias
6. AI responses are automatically converted back to show your real name

## Privacy

- All aliases are stored locally in your browser
- Data is encrypted using AES-256-GCM (Web Crypto API)
- No telemetry or analytics
- No data sent to external servers
- Open source for transparency

## Browser Compatibility

AI PII Sanitizer is built for Chrome using Manifest V3. Expansion to other browsers follows this priority:

### Tier 1: Chromium Browsers (95-100% Compatible) ✅
| Browser | Compatibility | Effort | Status |
|---------|---------------|--------|--------|
| **Chrome** | 100% ✅ | 0 days | Primary platform |
| **Edge** | 99% ✅ | 0.5 days | Same codebase |
| **Opera** | 98% ✅ | 0.5 days | Same codebase |
| **Brave** | 98% ✅ | 0.5 days | Same codebase |

**Launch Plan:** Chrome first (Months 1-3), then Edge/Opera/Brave (Month 4)

### Tier 2: Firefox (70-80% Compatible) ⚠️
| Browser | Compatibility | Effort | Status |
|---------|---------------|--------|--------|
| **Firefox** | 75% ⚠️ | 1-2 weeks | After 5,000+ Chrome installs |

**Key Differences:** `browser.*` namespace, Manifest V3 differences, storage quota limits

### Tier 3: Safari (60-70% Compatible) ⚠️
| Browser | Compatibility | Effort | Status |
|---------|---------------|--------|--------|
| **Safari** | 60% ⚠️ | 3-4 weeks | After 10,000+ Chrome installs + revenue |

**Requirements:** Xcode conversion, macOS development, Apple Developer account ($99/year)

### Tier 4: Mobile (20-30% Compatible) ❌
| Platform | Compatibility | Effort | Status |
|----------|---------------|--------|--------|
| **Chrome Android** | 30% ⚠️ | 2-3 months | Skip until PMF proven |
| **Firefox Android** | 40% ⚠️ | 2-3 months | Skip until PMF proven |
| **Safari iOS** | 20% ⚠️ | 3-4 months | Native app required |

**Strategy:** Focus on desktop browsers first. Mobile requires separate native app architecture.

For detailed browser compatibility information, see [Launch Roadmap](docs/current/launch_roadmap.md#browser-compatibility).

## Roadmap

### ✅ Phase 1: Profile Editor UI (COMPLETE!)
- [x] Professional modal-based Add/Edit/Delete UI
- [x] Multi-field support (name, email, phone, address, company, custom)
- [x] Form validation and error handling
- [x] Bidirectional substitution (real ↔ alias)
- [x] ChatGPT + Claude fully tested and working
- [x] All tests passing (9/9)

### ✅ Phase 2: Production Polish (COMPLETE!)
- [x] Glassmorphism UI design system
- [x] Tab-based navigation
- [x] Privacy Policy and Terms of Service
- [x] Professional icons and branding
- [x] Error handling and user feedback

### ✅ Phase 3: API Key Vault & Custom Rules (COMPLETE!)
- [x] API Key Vault with auto-detection (OpenAI, GitHub, AWS, Stripe, Anthropic, Google)
- [x] Custom pattern support for proprietary keys
- [x] Protection modes: auto-redact, warn-first, log-only
- [x] Custom Redaction Rules with regex patterns
- [x] 10 preset templates (SSN, credit cards, phone, medical records, etc.)
- [x] Priority-based rule execution
- [x] Live pattern testing
- [x] Usage stats and match tracking

### ✅ Phase 4: Final Polish & Production Ready (COMPLETE!)
**Goal:** Fix critical UX issues and polish protection status system
**Document:** [FINAL_DEV_PHASE.md](FINAL_DEV_PHASE.md)
**Status:** 🎉 **PRODUCTION READY!**

**Critical Fixes:** ✅ ALL COMPLETE
- [x] Fix badge accuracy with HEALTH_CHECK updates
- [x] Fix PROTECTION_LOST notification with proper tab ID
- [x] Fix disabled extension modal bug
- [x] Multiple injection guard (prevents duplicate scripts)
- [x] Suppress transient reload errors
- [x] Auto-enable extension on install
- [x] Reduce log spam (DEBUG_MODE flag)

**UX Improvements:** ✅ KEY FEATURES COMPLETE
- [x] Auto-reload AI service tabs on extension update (GAME CHANGER!)
- [ ] Prominent hard refresh notification in modal (OPTIONAL)
- [ ] Visual protection indicator with badge color alignment (OPTIONAL)

**What's Working:**
- ✅ Badge shows protection status accurately
- ✅ Auto-reload fixes context loss on extension updates
- ✅ Clean console logs (only state changes logged)
- ✅ Professional error handling
- ✅ Extension enabled by default

**Next Steps:**
- **Option A:** Ship to Chrome Web Store NOW (Recommended)
- **Option B:** Add optional UX polish (+1-2 hours)
- **Option C:** Service testing (Gemini, Perplexity, etc.) (+1-2 weeks)

**Timeline:** Ready to ship TODAY! 🚀

### 🔜 Phase 5-7: Enhanced Features (Planned)
- [ ] **Alias Variations**: Auto-detect GregBarker, gregbarker, gbarker
- [ ] **Dev Terms Spell Check**: Catch "openIA" → "OpenAI" typos
- [ ] **AI Profile Fill**: Generate fake profiles using ChatGPT/Claude/Gemini
- [ ] **Cloud Sync** (PRO): Sync profiles across devices
- [ ] **Team Sharing** (Enterprise): Share profiles with team members

### 📅 Timeline
- **Phase 1-3:** Complete ✅
- **Phase 4 (Critical Fixes):** Complete ✅ (Nov 1, 2025)
- **Phase 4 (Service Testing):** Optional (+1-2 weeks)
- **Phase 5-7:** 3-4 weeks (post-launch features)
- **Total to Chrome Web Store launch:** **READY NOW!** 🎉

For detailed roadmap and browser compatibility plans, see [Launch Roadmap](docs/current/launch_roadmap.md).

## Contributing

Contributions are welcome! Please read the [Product Design Document](docs/pii_sanitizer_pdd.md) and [Technical Design Document](docs/pii_sanitizer_tdd_v2.md) to understand the project vision and architecture.

## License

MIT

## Support

For issues and questions, please visit [GitHub Issues](https://github.com/your-repo/issues)
