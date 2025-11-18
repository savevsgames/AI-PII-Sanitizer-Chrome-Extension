# Feature Spec: Developer Terms Spell Check

## Overview

**Problem:** Developers frequently make typos when typing tech company names, frameworks, and tools in AI chats. "OpenIA" instead of "OpenAI", "Goggle" instead of "Google", "reactJs" instead of "React", etc. These typos look unprofessional and can confuse AI responses.

**Solution:** Intercept messages before sending, detect common developer term typos using a curated dictionary, and offer corrections in a clean diff-style UI.

**Target Users:** Developers (FREE tier with limits, PRO with full features)

**Value Prop:** "Never send a message with 'OpenIA' or 'Goggle' again"

---

## User Stories

1. **As a developer**, I want to see spell check suggestions before sending messages to ChatGPT, so I can fix typos in tech terms.

2. **As a developer**, I want a curated list of common tech typos (OpenAI, Google, React, etc.), so I don't have to manually add every term.

3. **As a PRO user**, I want to edit the curated list and add 100+ custom terms (company names, project codenames), so I can customize it for my workflow.

4. **As a FREE user**, I want to add 10 custom terms, so I can protect my most common typos without upgrading.

5. **As a developer**, I want the spell check to be fast (<500ms), so it doesn't slow down my chat flow.

---

## UI/UX Design

### Settings Tab - New Section: "Dev Terms Spell Check"

```
┌─────────────────────────────────────────────┐
│ 🔍 Developer Terms Spell Check              │
├─────────────────────────────────────────────┤
│ Never send typos in tech terms again        │
│                                             │
│ [✓] Enable spell check                     │
│                                             │
│ Check for:                                  │
│ [✓] Company names (OpenAI, Google, etc.)   │
│ [✓] Tech stacks (React, TypeScript, Node)  │
│ [✓] Tools & Libraries (GitHub, npm, VSCode)│
│ [ ] Custom terms only                       │
│                                             │
│ Mode:                                       │
│ (•) Show suggestions (recommended)          │
│ ( ) Auto-correct silently                  │
│ ( ) Detect only (highlight, no change)     │
│                                             │
│ Curated Dictionary:                         │
│ • 50 terms (FREE) / 500+ terms (PRO) ⭐     │
│ • [View All Terms]  [Edit Terms] (PRO) ⭐   │
│                                             │
│ Custom Terms (5/10 - FREE tier)             │
│ • Acme Corp → ACME Corporation              │
│ • reactnative → React Native                │
│ • openIA → OpenAI                           │
│ [+ Add Custom Term]                         │
│ [Upgrade to PRO for 100+ custom terms] ⭐   │
└─────────────────────────────────────────────┘
```

### Spell Check Modal (Triggered Before Send)

**Trigger:** User types in ChatGPT/Claude and clicks "Send"

**Flow:**
1. Extension intercepts message
2. Scans for typos using in-memory dictionary
3. If typos found, shows modal (pauses send)
4. User accepts/rejects suggestions
5. Message sent with corrections

```
User types: "I'm using openIA's API with Goggle Cloud and reactJs"
         ↓
Clicks "Send" in ChatGPT
         ↓
Extension intercepts & detects 3 typos
         ↓
┌──────────────────────────────────────────────────┐
│ 🔍 Developer Terms Spell Check                   │
├──────────────────────────────────────────────────┤
│ Found 3 suggestions in your message:             │
│                                                  │
│ 1. openIA  →  OpenAI                             │
│    Context: "I'm using openIA's API..."         │
│    [✓ Accept]  [✗ Ignore]  [📝 Add to Dict]     │
│                                                  │
│ 2. Goggle  →  Google                             │
│    Context: "...with Goggle Cloud and..."       │
│    [✓ Accept]  [✗ Ignore]  [📝 Add to Dict]     │
│                                                  │
│ 3. reactJs  →  React                             │
│    Context: "...Cloud and reactJs"              │
│    [✓ Accept]  [✗ Ignore]  [📝 Add to Dict]     │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ Preview (after corrections):                │  │
│ │ "I'm using OpenAI's API with Google Cloud  │  │
│ │  and React"                                 │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ [Accept All]  [Ignore All]  [Send Original]     │
└──────────────────────────────────────────────────┘
         ↓
User clicks "Accept All"
         ↓
Message sent: "I'm using OpenAI's API with Google Cloud and React"
```

### Add Custom Term Modal

```
┌────────────────────────────────────┐
│ Add Custom Term                    │
├────────────────────────────────────┤
│ Typo / Incorrect Term              │
│ [reactnative                     ] │
│                                    │
│ Correction                         │
│ [React Native                    ] │
│                                    │
│ [x] Case-sensitive matching        │
│                                    │
│ FREE tier: 5/10 custom terms used  │
│                                    │
│       [Cancel]  [Add Term]         │
└────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Data Model

**New file: `src/lib/types.ts`** (add to existing):

```typescript
/**
 * Developer Terms Spell Check Configuration
 */
export interface DevTermsConfig {
  enabled: boolean;
  mode: 'show-suggestions' | 'auto-correct' | 'detect-only';

  // What categories to check
  checkCategories: {
    companyNames: boolean;
    techStacks: boolean;
    toolsAndLibraries: boolean;
    customOnly: boolean;
  };

  // Custom user terms (FREE: 10, PRO: 100+)
  customTerms: DevTerm[];

  // Stats
  stats: {
    correctionsAccepted: number;
    correctionsIgnored: number;
    lastUsed: number;
  };
}

export interface DevTerm {
  id: string;
  incorrect: string;      // "openIA"
  correct: string;        // "OpenAI"
  caseSensitive: boolean;
  category: 'custom' | 'company' | 'tech' | 'tool';
  usageCount: number;     // How many times corrected
  createdAt: number;
}

// Add to UserConfig
export interface UserConfig {
  // ... existing fields
  devTermsSpellCheck?: DevTermsConfig;
}
```

### 2. Default Curated Dictionary

**New file: `src/lib/devTermsDictionary.ts`**

```typescript
/**
 * Curated developer terms dictionary
 * FREE tier: 50 most common terms
 * PRO tier: 500+ comprehensive terms
 */

export interface DictionaryEntry {
  incorrect: string;
  correct: string;
  category: 'company' | 'tech' | 'tool';
  caseSensitive: boolean;
}

// FREE tier dictionary (50 most common typos)
export const FREE_TIER_DICTIONARY: DictionaryEntry[] = [
  // Company names (15 terms)
  { incorrect: 'openIA', correct: 'OpenAI', category: 'company', caseSensitive: false },
  { incorrect: 'openai', correct: 'OpenAI', category: 'company', caseSensitive: true },
  { incorrect: 'anthropic', correct: 'Anthropic', category: 'company', caseSensitive: true },
  { incorrect: 'goggle', correct: 'Google', category: 'company', caseSensitive: false },
  { incorrect: 'gogle', correct: 'Google', category: 'company', caseSensitive: false },
  { incorrect: 'microsoft', correct: 'Microsoft', category: 'company', caseSensitive: true },
  { incorrect: 'github', correct: 'GitHub', category: 'company', caseSensitive: true },
  { incorrect: 'gitlab', correct: 'GitLab', category: 'company', caseSensitive: true },
  { incorrect: 'meta', correct: 'Meta', category: 'company', caseSensitive: true },
  { incorrect: 'facebook', correct: 'Facebook', category: 'company', caseSensitive: true },
  { incorrect: 'amazon', correct: 'Amazon', category: 'company', caseSensitive: true },
  { incorrect: 'AWS', correct: 'AWS', category: 'company', caseSensitive: true },
  { incorrect: 'vercel', correct: 'Vercel', category: 'company', caseSensitive: true },
  { incorrect: 'netlify', correct: 'Netlify', category: 'company', caseSensitive: true },
  { incorrect: 'cloudflare', correct: 'Cloudflare', category: 'company', caseSensitive: true },

  // Tech stacks (20 terms)
  { incorrect: 'javascript', correct: 'JavaScript', category: 'tech', caseSensitive: true },
  { incorrect: 'typescript', correct: 'TypeScript', category: 'tech', caseSensitive: true },
  { incorrect: 'nodejs', correct: 'Node.js', category: 'tech', caseSensitive: false },
  { incorrect: 'node.js', correct: 'Node.js', category: 'tech', caseSensitive: true },
  { incorrect: 'react', correct: 'React', category: 'tech', caseSensitive: true },
  { incorrect: 'reactjs', correct: 'React', category: 'tech', caseSensitive: false },
  { incorrect: 'vue', correct: 'Vue', category: 'tech', caseSensitive: true },
  { incorrect: 'vuejs', correct: 'Vue.js', category: 'tech', caseSensitive: false },
  { incorrect: 'angular', correct: 'Angular', category: 'tech', caseSensitive: true },
  { incorrect: 'next.js', correct: 'Next.js', category: 'tech', caseSensitive: true },
  { incorrect: 'nextjs', correct: 'Next.js', category: 'tech', caseSensitive: false },
  { incorrect: 'svelte', correct: 'Svelte', category: 'tech', caseSensitive: true },
  { incorrect: 'python', correct: 'Python', category: 'tech', caseSensitive: true },
  { incorrect: 'java', correct: 'Java', category: 'tech', caseSensitive: true },
  { incorrect: 'c++', correct: 'C++', category: 'tech', caseSensitive: true },
  { incorrect: 'rust', correct: 'Rust', category: 'tech', caseSensitive: true },
  { incorrect: 'go', correct: 'Go', category: 'tech', caseSensitive: true },
  { incorrect: 'golang', correct: 'Go', category: 'tech', caseSensitive: false },
  { incorrect: 'php', correct: 'PHP', category: 'tech', caseSensitive: true },
  { incorrect: 'ruby', correct: 'Ruby', category: 'tech', caseSensitive: true },

  // Tools (15 terms)
  { incorrect: 'vscode', correct: 'VS Code', category: 'tool', caseSensitive: false },
  { incorrect: 'visual studio code', correct: 'VS Code', category: 'tool', caseSensitive: false },
  { incorrect: 'npm', correct: 'npm', category: 'tool', caseSensitive: true },
  { incorrect: 'yarn', correct: 'Yarn', category: 'tool', caseSensitive: true },
  { incorrect: 'pnpm', correct: 'pnpm', category: 'tool', caseSensitive: true },
  { incorrect: 'webpack', correct: 'Webpack', category: 'tool', caseSensitive: true },
  { incorrect: 'vite', correct: 'Vite', category: 'tool', caseSensitive: true },
  { incorrect: 'docker', correct: 'Docker', category: 'tool', caseSensitive: true },
  { incorrect: 'kubernetes', correct: 'Kubernetes', category: 'tool', caseSensitive: true },
  { incorrect: 'k8s', correct: 'Kubernetes', category: 'tool', caseSensitive: true },
  { incorrect: 'postgres', correct: 'PostgreSQL', category: 'tool', caseSensitive: false },
  { incorrect: 'postgresql', correct: 'PostgreSQL', category: 'tool', caseSensitive: true },
  { incorrect: 'mongodb', correct: 'MongoDB', category: 'tool', caseSensitive: true },
  { incorrect: 'redis', correct: 'Redis', category: 'tool', caseSensitive: true },
  { incorrect: 'git', correct: 'Git', category: 'tool', caseSensitive: true },
];

// PRO tier gets additional 450+ terms
export const PRO_TIER_DICTIONARY: DictionaryEntry[] = [
  ...FREE_TIER_DICTIONARY,

  // Additional companies (100+ more)
  { incorrect: 'stripe', correct: 'Stripe', category: 'company', caseSensitive: true },
  { incorrect: 'twillio', correct: 'Twilio', category: 'company', caseSensitive: false },
  { incorrect: 'twilio', correct: 'Twilio', category: 'company', caseSensitive: true },
  { incorrect: 'sendgrid', correct: 'SendGrid', category: 'company', caseSensitive: true },
  { incorrect: 'heroku', correct: 'Heroku', category: 'company', caseSensitive: true },
  { incorrect: 'digitalocean', correct: 'DigitalOcean', category: 'company', caseSensitive: true },
  { incorrect: 'linode', correct: 'Linode', category: 'company', caseSensitive: true },
  { incorrect: 'supabase', correct: 'Supabase', category: 'company', caseSensitive: true },
  { incorrect: 'firebase', correct: 'Firebase', category: 'company', caseSensitive: true },
  { incorrect: 'planetscale', correct: 'PlanetScale', category: 'company', caseSensitive: true },
  // ... 90+ more companies

  // Additional tech stacks (150+ more)
  { incorrect: 'tailwind', correct: 'Tailwind CSS', category: 'tech', caseSensitive: false },
  { incorrect: 'tailwindcss', correct: 'Tailwind CSS', category: 'tech', caseSensitive: false },
  { incorrect: 'bootstrap', correct: 'Bootstrap', category: 'tech', caseSensitive: true },
  { incorrect: 'material-ui', correct: 'Material-UI', category: 'tech', caseSensitive: false },
  { incorrect: 'mui', correct: 'Material-UI', category: 'tech', caseSensitive: true },
  { incorrect: 'chakra-ui', correct: 'Chakra UI', category: 'tech', caseSensitive: false },
  { incorrect: 'sass', correct: 'Sass', category: 'tech', caseSensitive: true },
  { incorrect: 'scss', correct: 'SCSS', category: 'tech', caseSensitive: true },
  { incorrect: 'less', correct: 'Less', category: 'tech', caseSensitive: true },
  { incorrect: 'graphql', correct: 'GraphQL', category: 'tech', caseSensitive: true },
  // ... 140+ more frameworks/libraries

  // Additional tools (200+ more)
  { incorrect: 'postman', correct: 'Postman', category: 'tool', caseSensitive: true },
  { incorrect: 'insomnia', correct: 'Insomnia', category: 'tool', caseSensitive: true },
  { incorrect: 'figma', correct: 'Figma', category: 'tool', caseSensitive: true },
  { incorrect: 'sketch', correct: 'Sketch', category: 'tool', caseSensitive: true },
  { incorrect: 'adobe xd', correct: 'Adobe XD', category: 'tool', caseSensitive: false },
  { incorrect: 'jira', correct: 'Jira', category: 'tool', caseSensitive: true },
  { incorrect: 'confluence', correct: 'Confluence', category: 'tool', caseSensitive: true },
  { incorrect: 'slack', correct: 'Slack', category: 'tool', caseSensitive: true },
  { incorrect: 'discord', correct: 'Discord', category: 'tool', caseSensitive: true },
  { incorrect: 'notion', correct: 'Notion', category: 'tool', caseSensitive: true },
  // ... 190+ more tools
];

/**
 * Get dictionary based on user tier
 */
export function getDictionary(tier: 'free' | 'pro'): DictionaryEntry[] {
  return tier === 'pro' ? PRO_TIER_DICTIONARY : FREE_TIER_DICTIONARY;
}
```

### 3. Spell Check Engine

**New file: `src/lib/devTermsSpellChecker.ts`**

```typescript
import { DevTerm, DevTermsConfig } from './types';
import { getDictionary, DictionaryEntry } from './devTermsDictionary';

export interface SpellCheckResult {
  hasTypos: boolean;
  suggestions: Suggestion[];
  correctedText: string;
}

export interface Suggestion {
  incorrect: string;
  correct: string;
  position: { start: number; end: number };
  context: string; // Surrounding text
  category: string;
}

export class DevTermsSpellChecker {
  private dictionary: Map<string, string> = new Map();
  private caseSensitiveTerms: Set<string> = new Set();

  constructor(
    tier: 'free' | 'pro',
    customTerms: DevTerm[] = [],
    config: DevTermsConfig
  ) {
    this.loadDictionary(tier, customTerms, config);
  }

  /**
   * Load dictionary into memory for fast lookups
   */
  private loadDictionary(
    tier: 'free' | 'pro',
    customTerms: DevTerm[],
    config: DevTermsConfig
  ): void {
    // Load curated dictionary
    const curatedDict = getDictionary(tier);

    for (const entry of curatedDict) {
      // Filter by enabled categories
      if (config.checkCategories.customOnly) {
        continue; // Skip curated if custom-only mode
      }

      if (entry.category === 'company' && !config.checkCategories.companyNames) {
        continue;
      }
      if (entry.category === 'tech' && !config.checkCategories.techStacks) {
        continue;
      }
      if (entry.category === 'tool' && !config.checkCategories.toolsAndLibraries) {
        continue;
      }

      const key = entry.caseSensitive ? entry.incorrect : entry.incorrect.toLowerCase();
      this.dictionary.set(key, entry.correct);

      if (entry.caseSensitive) {
        this.caseSensitiveTerms.add(key);
      }
    }

    // Load custom terms
    for (const term of customTerms) {
      if (!term.caseSensitive) {
        this.dictionary.set(term.incorrect.toLowerCase(), term.correct);
      } else {
        this.dictionary.set(term.incorrect, term.correct);
        this.caseSensitiveTerms.add(term.incorrect);
      }
    }

    console.log('[DevTermsSpellChecker] Loaded', this.dictionary.size, 'terms into memory');
  }

  /**
   * Check text for typos and return suggestions
   */
  check(text: string): SpellCheckResult {
    const suggestions: Suggestion[] = [];
    let correctedText = text;

    // Split text into words (preserve positions)
    const words = this.tokenize(text);

    for (const word of words) {
      const correction = this.findCorrection(word.text);

      if (correction && correction !== word.text) {
        suggestions.push({
          incorrect: word.text,
          correct: correction,
          position: { start: word.start, end: word.end },
          context: this.getContext(text, word.start, word.end),
          category: 'tech', // Could be enhanced to track category
        });
      }
    }

    // Apply corrections to generate preview
    for (let i = suggestions.length - 1; i >= 0; i--) {
      const suggestion = suggestions[i];
      correctedText =
        correctedText.substring(0, suggestion.position.start) +
        suggestion.correct +
        correctedText.substring(suggestion.position.end);
    }

    return {
      hasTypos: suggestions.length > 0,
      suggestions,
      correctedText,
    };
  }

  /**
   * Find correction for a single word
   */
  private findCorrection(word: string): string | null {
    // Case-sensitive lookup first
    if (this.caseSensitiveTerms.has(word) && this.dictionary.has(word)) {
      return this.dictionary.get(word)!;
    }

    // Case-insensitive lookup
    const lowerWord = word.toLowerCase();
    if (this.dictionary.has(lowerWord)) {
      return this.dictionary.get(lowerWord)!;
    }

    return null;
  }

  /**
   * Tokenize text into words with positions
   */
  private tokenize(text: string): Array<{ text: string; start: number; end: number }> {
    const words: Array<{ text: string; start: number; end: number }> = [];
    const regex = /\b[\w.+-]+\b/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      words.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    return words;
  }

  /**
   * Get surrounding context for preview
   */
  private getContext(text: string, start: number, end: number): string {
    const contextLength = 40;
    const contextStart = Math.max(0, start - contextLength);
    const contextEnd = Math.min(text.length, end + contextLength);

    let context = text.substring(contextStart, contextEnd);

    // Add ellipsis if truncated
    if (contextStart > 0) context = '...' + context;
    if (contextEnd < text.length) context = context + '...';

    return context;
  }
}
```

### 4. Integration with Service Worker

**Modify: `src/background/serviceWorker.ts`**

```typescript
import { DevTermsSpellChecker } from '../lib/devTermsSpellChecker';

/**
 * NEW MESSAGE TYPE: Check spelling before sending
 */
async function handleSpellCheck(payload: { text: string }): Promise<any> {
  try {
    const storage = StorageManager.getInstance();
    const config = await storage.loadConfig();

    // Check if feature is enabled
    if (!config.devTermsSpellCheck?.enabled) {
      return {
        success: true,
        hasTypos: false,
        suggestions: [],
        correctedText: payload.text,
      };
    }

    // Initialize spell checker
    const tier = config.account?.tier || 'free';
    const spellChecker = new DevTermsSpellChecker(
      tier,
      config.devTermsSpellCheck.customTerms || [],
      config.devTermsSpellCheck
    );

    // Check text
    const result = spellChecker.check(payload.text);

    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    console.error('[SpellCheck] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Add to message router
async function handleMessage(message: Message): Promise<any> {
  switch (message.type) {
    // ... existing cases

    case 'SPELL_CHECK':
      return handleSpellCheck(message.payload);

    case 'ACCEPT_SPELL_CORRECTIONS':
      return handleAcceptSpellCorrections(message.payload);

    // ...
  }
}
```

### 5. Content Script Integration

**Modify: `src/content/inject.js`**

```javascript
// Intercept ChatGPT send button
const originalFetch = window.fetch;

window.fetch = async function(...args) {
  const [url, options] = args;

  // Only intercept AI chat messages
  if (shouldIntercept(url)) {
    const requestBody = options?.body;

    if (requestBody) {
      // Extract text from request
      const text = extractText(JSON.parse(requestBody));

      // Send to background for spell check
      const spellCheckResult = await sendToBackground({
        type: 'SPELL_CHECK',
        payload: { text },
      });

      if (spellCheckResult.success && spellCheckResult.hasTypos) {
        // Show spell check modal to user
        const userDecision = await showSpellCheckModal(spellCheckResult);

        if (userDecision.accepted) {
          // Replace text in request body with corrected version
          const modifiedBody = replaceText(
            JSON.parse(requestBody),
            userDecision.correctedText
          );
          options.body = JSON.stringify(modifiedBody);
        } else if (userDecision.cancelled) {
          // User cancelled - don't send message
          throw new Error('Message send cancelled by user');
        }
        // If user clicked "Send Original", continue with original text
      }
    }
  }

  // Continue with (possibly modified) request
  return originalFetch.apply(this, args);
};

/**
 * Show spell check modal in page context
 */
async function showSpellCheckModal(spellCheckResult) {
  return new Promise((resolve) => {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'pii-sanitizer-spell-check-modal';
    modal.innerHTML = `
      <div class="spell-check-overlay">
        <div class="spell-check-modal">
          <h3>🔍 Developer Terms Spell Check</h3>
          <p>Found ${spellCheckResult.suggestions.length} suggestion(s):</p>

          <div class="suggestions-list">
            ${spellCheckResult.suggestions.map((s, i) => `
              <div class="suggestion-item" data-index="${i}">
                <div class="suggestion-header">
                  <span class="incorrect">${s.incorrect}</span>
                  <span class="arrow">→</span>
                  <span class="correct">${s.correct}</span>
                </div>
                <div class="suggestion-context">${s.context}</div>
                <div class="suggestion-actions">
                  <button class="accept-btn" data-index="${i}">✓ Accept</button>
                  <button class="ignore-btn" data-index="${i}">✗ Ignore</button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="preview-box">
            <strong>Preview:</strong>
            <p>${escapeHtml(spellCheckResult.correctedText)}</p>
          </div>

          <div class="modal-actions">
            <button class="accept-all-btn">Accept All</button>
            <button class="ignore-all-btn">Ignore All</button>
            <button class="send-original-btn">Send Original</button>
          </div>
        </div>
      </div>
    `;

    // Inject modal styles
    injectSpellCheckStyles();

    // Append to page
    document.body.appendChild(modal);

    // Handle button clicks
    modal.querySelector('.accept-all-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve({ accepted: true, correctedText: spellCheckResult.correctedText });
    });

    modal.querySelector('.ignore-all-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve({ accepted: false, cancelled: false });
    });

    modal.querySelector('.send-original-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve({ accepted: false, cancelled: false });
    });
  });
}

function injectSpellCheckStyles() {
  if (document.getElementById('pii-sanitizer-spell-check-styles')) return;

  const style = document.createElement('style');
  style.id = 'pii-sanitizer-spell-check-styles';
  style.textContent = `
    .spell-check-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spell-check-modal {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }

    .spell-check-modal h3 {
      margin: 0 0 16px 0;
      font-size: 20px;
      color: #1a1a1a;
    }

    .suggestion-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .suggestion-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .incorrect {
      color: #e53e3e;
      font-weight: 600;
      text-decoration: line-through;
    }

    .correct {
      color: #38a169;
      font-weight: 600;
    }

    .suggestion-context {
      font-size: 14px;
      color: #666;
      background: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .suggestion-actions button {
      padding: 4px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 8px;
    }

    .accept-btn {
      background: #38a169;
      color: white;
      border: none !important;
    }

    .ignore-btn {
      background: #e53e3e;
      color: white;
      border: none !important;
    }

    .preview-box {
      background: #f7fafc;
      border: 1px solid #cbd5e0;
      border-radius: 8px;
      padding: 12px;
      margin: 16px 0;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .modal-actions button {
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }

    .accept-all-btn {
      background: #667eea;
      color: white;
      border: none;
    }

    .ignore-all-btn, .send-original-btn {
      background: #e2e8f0;
      color: #2d3748;
      border: 1px solid #cbd5e0;
    }
  `;

  document.head.appendChild(style);
}
```

---

## Performance Considerations

### 1. In-Memory Dictionary
- Load dictionary once when extension starts
- Store in memory for O(1) lookups
- 500 terms = ~50KB in memory (negligible)

### 2. Fast Tokenization
- Use regex to split text into words
- Only check words that exist in dictionary
- Worst case: 1000 words × 500 dictionary entries = 500K comparisons
- With Map lookup: ~1ms

### 3. Lazy Modal Rendering
- Only create modal DOM when typos detected
- Reuse modal element if user sends multiple messages
- Clean up after modal closes

### 4. Async Spell Check
- Run spell check in background (doesn't block UI)
- Show modal only if typos found
- User can cancel and send original if they're in a hurry

---

## FREE vs PRO Comparison

| Feature | FREE | PRO |
|---------|------|-----|
| **Curated Dictionary** | 50 common terms | 500+ comprehensive terms |
| **Custom Terms** | 10 terms | 100+ terms |
| **Edit Curated List** | ❌ No | ✅ Yes |
| **Categories** | All 3 categories | All 3 categories + custom |
| **Auto-correct Mode** | ❌ No (suggestions only) | ✅ Yes |
| **Stats Tracking** | Basic | Advanced (per-term stats) |
| **Export/Import** | ❌ No | ✅ Yes (JSON export) |

---

## Implementation Phases

### Phase 1: Core Detection (MVP)
**Time:** 1 week

- [ ] Create `devTermsDictionary.ts` with 50 FREE tier terms
- [ ] Build `DevTermsSpellChecker` class
- [ ] Add spell check to `serviceWorker.ts`
- [ ] Basic modal UI in `inject.js`
- [ ] Test on ChatGPT

**Deliverable:** Working spell check with suggestions modal

### Phase 2: Custom Terms Management
**Time:** 3-4 days

- [ ] Add "Dev Terms" section to popup settings
- [ ] Add/edit/delete custom terms
- [ ] Enforce FREE tier limit (10 terms)
- [ ] Test with user-added terms

**Deliverable:** Users can add custom terms in settings

### Phase 3: PRO Features
**Time:** 1 week

- [ ] Expand curated dictionary to 500+ terms
- [ ] Allow PRO users to edit curated list
- [ ] Add 100+ custom terms for PRO
- [ ] Export/import functionality
- [ ] Per-term usage stats

**Deliverable:** Full PRO tier features

### Phase 4: Polish
**Time:** 2-3 days

- [ ] Auto-correct mode (skip modal, apply corrections automatically)
- [ ] Highlight mode (show typos in chat input, don't modify)
- [ ] Performance optimization (lazy loading)
- [ ] A/B test modal UI for best conversion

**Deliverable:** Production-ready feature

---

## Success Metrics

### Adoption
- 70%+ of users enable spell check
- Average 5 custom terms added per FREE user
- 30% of PRO users cite spell check as upgrade reason

### Usage
- Average 3-5 corrections per user per week
- 80%+ correction acceptance rate
- <5% false positives (incorrect suggestions)

### Performance
- Spell check completes in <200ms
- Modal render in <100ms
- No noticeable delay in chat flow

---

## Marketing Messaging

### Landing Page Copy

**Headline:** "Stop Embarrassing Typos in Your ChatGPT Conversations"

**Subheadline:** "Never type 'OpenIA', 'Goggle', or 'reactJs' again. Built-in spell check for developers."

**Features:**
- ✅ 50+ common tech term corrections (FREE)
- ✅ Add 10 custom terms (your company name, project codenames)
- ✅ See corrections before sending (transparent, not automatic)
- ✅ PRO: 500+ terms + unlimited custom terms

**CTA:** "Install Free Extension"

### Hacker News Post

**Title:** "Show HN: Dev Terms Spell Check for ChatGPT (never type 'OpenIA' again)"

**Body:**
```
I kept typing "OpenIA" instead of "OpenAI" in ChatGPT and got tired of fixing it.

Built a Chrome extension that checks for common dev typos before sending:
- OpenIA → OpenAI
- Goggle → Google
- reactJs → React
- 50+ more terms

Shows a diff modal before sending (not automatic). FREE tier includes 50 terms + 10 custom.

Chrome Web Store: [link]

What typos do you make most often? I'll add them to the dictionary.
```

---

## Open Questions

1. **Should we add acronym expansion?**
   - Example: "AI" → "AI" (no change) vs "ai" → "AI" (capitalize)
   - Might be too aggressive?

2. **Should we detect "ChatGPT" vs "chatgpt"?**
   - Many companies have stylized names
   - Could be useful but also annoying

3. **Should FREE users see PRO dictionary size?**
   - "You're using 50/500 terms (upgrade for 450 more)"
   - Or hide PRO size to avoid FOMO?

4. **Should we track which terms are most commonly corrected?**
   - Analytics to improve curated list
   - Privacy-preserving (aggregate stats only)

---

## Future Enhancements

1. **AI-Powered Suggestions (v2.0)**
   - Use ChatGPT API to suggest corrections beyond dictionary
   - "Did you mean: [AI suggestion]"

2. **Context-Aware Corrections (v2.0)**
   - "react" in "react to this" → don't suggest "React"
   - NLP to understand intent

3. **Team Dictionaries (Enterprise)**
   - Share custom terms across team
   - Company-specific terminology

4. **Multi-Language Support (v3.0)**
   - Spanish dev terms, Chinese dev terms, etc.

---

## Conclusion

**Dev Terms Spell Check is a high-value, low-effort feature:**
- ✅ Solves real developer pain point (typos look unprofessional)
- ✅ Easy to implement (dictionary lookup + modal UI)
- ✅ Fast (<200ms, no UI lag)
- ✅ Great FREE tier hook (50 terms is useful, 500 is compelling upgrade)
- ✅ Complements core PII protection (both improve message quality)

**Estimated Impact:**
- +15% FREE tier adoption (developers love this)
- +10% PRO conversion (curated list + custom terms)
- #2 most mentioned feature in reviews (after PII protection)

**Next Steps:**
1. Build Phase 1 MVP (1 week)
2. Test with 20 beta users
3. Iterate based on feedback
4. Launch with blog post + HN post
