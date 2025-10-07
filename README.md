# AI PII Sanitizer

A Chrome extension that protects your privacy by replacing real personally identifiable information (PII) with aliases when using AI chat services like ChatGPT, Claude, and Gemini.

## Features

- **Bidirectional Aliasing**: Automatically replace real names with aliases in outgoing requests and reverse them in AI responses
- **Privacy-First**: All data stored locally with encryption, no data sent to external servers
- **Multiple AI Services**: Supports ChatGPT, Claude, and Gemini
- **Easy Management**: Simple popup interface to manage your aliases
- **Real-Time Protection**: Intercepts requests before they leave your browser

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
- Data is encrypted using Web Crypto API
- No telemetry or analytics
- No data sent to external servers
- Open source for transparency

## Roadmap

### MVP (Current Phase)
- [x] Basic project structure
- [x] Core substitution engine
- [x] Request/response interception
- [x] Simple popup UI
- [ ] Support for ChatGPT, Claude, Gemini
- [ ] End-to-end testing

### Phase 2
- [ ] Input field highlighting
- [ ] Visual feedback notifications
- [ ] Improved onboarding flow
- [ ] Export/import aliases

### Phase 3
- [ ] Additional PII types (email, phone, addresses)
- [ ] Team shared dictionaries
- [ ] Audit logs
- [ ] Compliance reports

## Contributing

Contributions are welcome! Please read the [Product Design Document](docs/pii_sanitizer_pdd.md) and [Technical Design Document](docs/pii_sanitizer_tdd_v2.md) to understand the project vision and architecture.

## License

MIT

## Support

For issues and questions, please visit [GitHub Issues](https://github.com/your-repo/issues)
