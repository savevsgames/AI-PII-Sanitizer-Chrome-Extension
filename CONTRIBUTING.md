# Contributing to PromptBlocker

Thank you for your interest in contributing to PromptBlocker! We welcome contributions from developers of all skill levels.

---

## 🎯 Quick Links

- **Code of Conduct:** Be respectful and constructive
- **Bug Reports:** [GitHub Issues](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues)
- **Feature Requests:** [GitHub Discussions](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/discussions)
- **Development Docs:** [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## 🚀 Getting Started

### Prerequisites

**Required:**
- Node.js 18+ and npm
- Git
- Chrome browser (for testing)
- Code editor (VS Code recommended)

**Optional:**
- Playwright (for E2E tests)
- TypeScript knowledge (helpful but not required)

### Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/AI-PII-Sanitizer-Chrome-Extension.git
cd AI-PII-Sanitizer-Chrome-Extension

# 2. Install dependencies
npm install

# 3. Build the extension
npm run build:dev

# 4. Load extension in Chrome
# - Open chrome://extensions
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select the `dist` folder

# 5. Make changes and rebuild
npm run build:watch  # Auto-rebuild on file changes

# 6. Run tests
npm test
```

---

## 📁 Project Structure

```
PromptBlocker/
├── src/                    # Source code
│   ├── background/         # Service worker (message routing, storage)
│   ├── content/            # Content scripts (ChatGPT, Claude, etc.)
│   ├── popup/              # Popup UI (profile management)
│   └── lib/                # Shared libraries (AliasEngine, etc.)
├── tests/                  # Test suite (Jest + Playwright)
├── docs/                   # Documentation
├── dist/                   # Build output (gitignored)
└── manifest.json           # Extension manifest
```

**Key Files:**
- `src/background/serviceWorker.ts` - Background service worker
- `src/content/content.ts` - Content script (isolated world)
- `src/content/inject.js` - Page script (direct DOM access)
- `src/popup/popup-v2.ts` - Popup logic
- `src/lib/aliasEngine.ts` - Alias substitution engine
- `src/lib/apiKeyDetector.ts` - API key detection
- `src/lib/redactionEngine.ts` - Custom redaction rules
- `src/lib/storage.ts` - Encrypted storage manager

---

## 🎨 Development Workflow

### 1. Pick an Issue

**Good First Issues:**
- Look for issues labeled `good first issue`
- Check [GitHub Issues](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

**Feature Requests:**
- Browse [GitHub Discussions](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/discussions)
- Comment on issues you're interested in

**Bug Fixes:**
- Check `bug` labeled issues
- Reproduce the bug locally first

### 2. Create a Branch

```bash
# Feature branch
git checkout -b feature/add-new-service

# Bug fix branch
git checkout -b fix/badge-color-issue

# Documentation branch
git checkout -b docs/improve-readme
```

**Branch Naming Convention:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `test/` - Test improvements
- `refactor/` - Code refactoring

### 3. Make Changes

**Code Style:**
- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public functions
- Use meaningful variable names

**Example:**
```typescript
/**
 * Substitutes PII with aliases in the given text
 * @param text - Text to process
 * @param profiles - Active alias profiles
 * @param direction - 'encode' (real→alias) or 'decode' (alias→real)
 * @returns Substituted text
 */
export function substitute(
  text: string,
  profiles: AliasProfile[],
  direction: 'encode' | 'decode' = 'encode'
): string {
  // Implementation
}
```

**Testing:**
- Write unit tests for new features
- Run `npm test` before committing
- Ensure 70%+ coverage for new code
- Manual testing in Chrome

### 4. Commit Changes

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test improvements
- `refactor`: Code refactoring
- `style`: Code style changes (formatting)
- `chore`: Build/tool changes

**Examples:**
```bash
# Good commit messages
git commit -m "feat(aliasEngine): add support for alias variations"
git commit -m "fix(badge): correct color when protection lost"
git commit -m "docs(readme): add installation instructions"

# Bad commit messages
git commit -m "update stuff"
git commit -m "fix bug"
git commit -m "changes"
```

### 5. Push and Create PR

```bash
# Push your branch
git push origin feature/add-new-service

# Create PR on GitHub
# - Use descriptive title
# - Fill out PR template
# - Link related issues
# - Request review
```

**PR Checklist:**
- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] All tests passing (`npm test`)
- [ ] Documentation updated (if needed)
- [ ] No console errors in browser
- [ ] Manual testing completed
- [ ] Commit messages follow convention

---

## 🧪 Testing Guidelines

### Unit Tests (Required for PRs)

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/aliasEngine.test.ts

# Run with coverage
npm run test:coverage

# Watch mode (auto-rerun)
npm run test:watch
```

**Writing Good Tests:**
```typescript
describe('AliasEngine.substitute', () => {
  // Test happy path
  test('replaces real name with alias', () => {
    const mapping = {
      real: { name: 'John Smith' },
      alias: { name: 'Alex Johnson' }
    };
    expect(substitute('Hello John Smith', [mapping]))
      .toBe('Hello Alex Johnson');
  });

  // Test edge cases
  test('handles empty text', () => {
    expect(substitute('', [])).toBe('');
  });

  test('handles no matches', () => {
    const mapping = {
      real: { name: 'John Smith' },
      alias: { name: 'Alex Johnson' }
    };
    expect(substitute('Hello World', [mapping]))
      .toBe('Hello World');
  });

  // Test error cases
  test('handles invalid input gracefully', () => {
    expect(() => substitute(null as any, [])).not.toThrow();
  });
});
```

### E2E Tests (Optional but Appreciated)

```bash
# Run E2E tests
npm run test:e2e
```

**When to Write E2E Tests:**
- New service integration (ChatGPT, Claude, etc.)
- User workflow changes
- Complex UI interactions

### Manual Testing Checklist

Before submitting PR, test:
- [ ] Extension loads without errors
- [ ] Popup opens and displays correctly
- [ ] Profile creation works
- [ ] PII substitution works on ChatGPT
- [ ] Badge shows correct status
- [ ] No console errors
- [ ] Settings persist after reload

---

## 📝 Code Review Process

### What We Look For

**Code Quality:**
- ✅ Follows TypeScript best practices
- ✅ No `any` types (use proper types)
- ✅ Error handling for edge cases
- ✅ No console.log statements (use DEBUG_MODE flag)

**Testing:**
- ✅ Unit tests cover new code
- ✅ All tests passing
- ✅ No reduction in coverage

**Documentation:**
- ✅ JSDoc comments for public APIs
- ✅ README updated if needed
- ✅ CHANGELOG.md updated for user-facing changes

**Security:**
- ✅ No hardcoded secrets or API keys
- ✅ Input sanitization (prevent XSS)
- ✅ Proper error handling (don't leak PII in errors)

### Review Timeline

- **Initial Review:** Within 48 hours
- **Follow-up:** Within 24 hours after updates
- **Merge:** After 1-2 approvals (depending on PR size)

### Addressing Feedback

```bash
# Make requested changes
git add .
git commit -m "refactor: address review feedback"

# Update PR
git push origin feature/add-new-service
```

**Tips:**
- Respond to all comments (even if just "Done")
- Ask questions if feedback is unclear
- Be open to suggestions
- Don't take feedback personally

---

## 🐛 Reporting Bugs

### Before Reporting

1. **Search existing issues:** Someone may have already reported it
2. **Reproduce the bug:** Ensure it's consistent
3. **Check browser version:** Use latest Chrome
4. **Test in clean environment:** Disable other extensions

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Extension version: [e.g., 1.0.0]
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11, macOS 14]

**Additional context**
Any other relevant information.
```

---

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Problem**
What problem does this feature solve?

**Proposed Solution**
How would you implement this?

**Alternatives Considered**
What other solutions did you think about?

**Impact**
- Who benefits?
- How many users would use this?
- Required effort (if known)

**Additional Context**
Screenshots, mockups, examples from other tools.
```

### Feature Prioritization

We prioritize features based on:
1. **User demand** (number of requests)
2. **Impact** (how many users benefit)
3. **Effort** (development time)
4. **Alignment** (fits privacy-first mission)

---

## 🏗️ Adding New Service Support

Want to add support for a new AI service? Here's how:

### 1. Research the Service

**Questions to Answer:**
- What's the API endpoint? (use Network tab in DevTools)
- What's the request format? (JSON, GraphQL, etc.)
- What's the response format? (JSON, SSE, WebSocket)
- Where is the chat UI? (textarea selector, submit button)

### 2. Create Service Config

```typescript
// In src/lib/serviceConfigs.ts
export const NEW_SERVICE_CONFIG = {
  domain: 'newservice.com',
  endpoints: ['/api/chat'],
  requestFormat: 'json',
  responseFormat: 'sse',
  selectors: {
    textarea: '#chat-input',
    submit: 'button[type="submit"]'
  }
};
```

### 3. Add Content Script Logic

```typescript
// In src/content/inject.js
if (window.location.hostname.includes('newservice.com')) {
  // Intercept requests
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;

    if (url.includes('/api/chat')) {
      // Apply PII substitution
      const modified = await substitutePII(options.body);
      return originalFetch.call(this, url, { ...options, body: modified });
    }

    return originalFetch.apply(this, args);
  };
}
```

### 4. Test Thoroughly

- [ ] Request interception works
- [ ] Response transformation works
- [ ] Chat UI displays correctly
- [ ] Health checks pass
- [ ] Badge shows correct status

### 5. Update Documentation

- Add service to README.md supported services list
- Update CHANGELOG.md
- Add service-specific notes to ARCHITECTURE.md

---

## 📦 Release Process (Maintainers Only)

### Version Bump

```bash
# Patch release (1.0.x)
npm version patch

# Minor release (1.x.0)
npm version minor

# Major release (x.0.0)
npm version major
```

### Build for Production

```bash
# Create production build
npm run build:prod

# Test production build
# Load dist/ folder in Chrome
# Verify all features work
```

### Create Release

1. Update CHANGELOG.md with release notes
2. Create Git tag: `git tag v1.0.0`
3. Push tag: `git push --tags`
4. Create GitHub release
5. Upload to Chrome Web Store
6. Announce on social media / GitHub Discussions

---

## 🎓 Learning Resources

### Chrome Extension Development
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Testing
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)

### Code Style
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

---

## ❓ Questions?

- **GitHub Discussions:** https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/discussions
- **GitHub Issues:** https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues
- **Email:** (Coming soon)

---

## 🙏 Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Added to CONTRIBUTORS.md (if significant contribution)

**Thank you for making PromptBlocker better!** 🎉

---

**Last Updated:** 2025-11-01
