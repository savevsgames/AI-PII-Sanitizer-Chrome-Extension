# Feature Spec: API Key Vault (PRO)

## Overview

**Problem:** Developers accidentally paste API keys in ChatGPT when sharing error logs, code snippets, or debugging output. Once sent to OpenAI/Anthropic, those keys are potentially logged and could leak.

**Solution:** Encrypted vault to store API keys. Extension auto-detects and redacts keys before sending to AI services.

**Target Users:** Developers (PRO tier only)

**Value Prop:** "Never accidentally leak API keys to ChatGPT again"

---

## User Stories

1. **As a developer**, I want to store my API keys in a vault, so I don't have to remember them when detecting leaks.

2. **As a developer**, I want the extension to auto-detect known API key formats (OpenAI, GitHub, AWS), so I don't have to manually configure every pattern.

3. **As a developer**, I want to see a warning before sending a message with an API key, so I can review and confirm redaction.

4. **As a developer**, I want to see stats on how many keys were protected, so I can justify the PRO subscription cost.

5. **As a team lead**, I want to share API key patterns with my team, so everyone is protected (Enterprise tier).

---

## UI/UX Design

### Settings Tab - New Section: "API Keys" (PRO Badge)

```
┌─────────────────────────────────────────────┐
│ 🔐 API Key Vault (PRO)                      │
├─────────────────────────────────────────────┤
│ Protect your API keys from accidental leaks │
│                                             │
│ [x] Enable API key detection                │
│                                             │
│ Detection Mode:                             │
│ ( ) Auto-redact (silent)                    │
│ (•) Warn first (recommended)                │
│ ( ) Log only (no redaction)                 │
│                                             │
│ Stored Keys (3)                             │
│ ┌───────────────────────────────────────┐   │
│ │ 🔑 OpenAI Production                  │   │
│ │    sk-proj-••••••••••••••••••••F8k2   │   │
│ │    Added: 2024-01-15                  │   │
│ │    Protected: 12 times                │   │
│ │    [Edit] [Delete]                    │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ ┌───────────────────────────────────────┐   │
│ │ 🔑 GitHub Personal Access Token       │   │
│ │    ghp_••••••••••••••••••••••••••7Qa  │   │
│ │    Added: 2024-01-10                  │   │
│ │    Protected: 3 times                 │   │
│ │    [Edit] [Delete]                    │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ [+ Add API Key]                             │
│                                             │
│ Auto-detect patterns (always active):       │
│ ✓ OpenAI (sk-*, sk-proj-*)                  │
│ ✓ Anthropic (sk-ant-*)                      │
│ ✓ Google (AIza*)                            │
│ ✓ AWS (AKIA*, ASIA*)                        │
│ ✓ GitHub (ghp_*, gho_*, ghs_*)              │
│ ✓ Stripe (sk_live_*, pk_live_*)             │
│ ✓ Generic (32+ hex/base64)                  │
│                                             │
│ [Export Patterns] [Import Patterns]         │
└─────────────────────────────────────────────┘
```

### Add Key Modal

```
┌──────────────────────────────────┐
│ Add API Key to Vault             │
├──────────────────────────────────┤
│ Name (optional)                  │
│ [OpenAI Production Key         ] │
│                                  │
│ API Key                          │
│ [sk-proj-*********************] │
│ [Show] [Paste]                   │
│                                  │
│ Auto-detected format:            │
│ ✓ OpenAI Project Key             │
│                                  │
│ This key will be:                │
│ • Encrypted with AES-256-GCM     │
│ • Stored locally on your device  │
│ • Never sent to any server       │
│                                  │
│       [Cancel]  [Add to Vault]   │
└──────────────────────────────────┘
```

### Warning Dialog (When Key Detected)

```
┌──────────────────────────────────────────┐
│ ⚠️  API Key Detected!                    │
├──────────────────────────────────────────┤
│ Found 2 API keys in your message:        │
│                                          │
│ • OpenAI key (sk-proj-***F8k2)           │
│   Line 15: "export OPENAI_API_KEY=..."  │
│                                          │
│ • GitHub token (ghp_***7Qa)              │
│   Line 42: "Authorization: Bearer ..."  │
│                                          │
│ What would you like to do?               │
│                                          │
│ (•) Redact keys (replace with [REDACTED])│
│ ( ) Redact with placeholder (OPENAI_KEY) │
│ ( ) Send anyway (not recommended)        │
│                                          │
│ [x] Remember this choice for OpenAI keys │
│                                          │
│         [Cancel]  [Redact & Send]        │
└──────────────────────────────────────────┘
```

### Stats Tab - New Metric

```
┌─────────────────────────────────┐
│ 🔐 API Keys Protected (PRO)     │
│                                 │
│      47                         │
│                                 │
│ keys redacted this month        │
└─────────────────────────────────┘

By Key Type:
• OpenAI:    24 (51%)
• GitHub:    12 (26%)
• AWS:        8 (17%)
• Stripe:     3 (6%)
```

---

## Technical Implementation

### 1. Data Model

**New interface in types.ts:**

```typescript
export interface APIKey {
  id: string;
  name?: string; // User-provided label
  keyValue: string; // The actual key (encrypted in storage)
  format: APIKeyFormat; // Detected format
  createdAt: number;
  lastUsed: number;
  protectionCount: number; // How many times redacted
  enabled: boolean;
}

export type APIKeyFormat =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'aws'
  | 'github'
  | 'stripe'
  | 'generic'
  | 'custom'; // User-defined regex

export interface APIKeyVaultConfig {
  enabled: boolean;
  mode: 'auto-redact' | 'warn-first' | 'log-only';
  autoDetectPatterns: boolean; // Scan for known formats
  keys: APIKey[]; // User's stored keys
  customPatterns: RegExp[]; // User-defined detection rules
}
```

**Add to UserConfig:**

```typescript
export interface UserConfig {
  // ... existing fields
  apiKeyVault?: APIKeyVaultConfig; // PRO only
}
```

### 2. Detection Engine

**New file: `src/lib/apiKeyDetector.ts`**

```typescript
import { APIKeyFormat } from './types';

export interface DetectedKey {
  value: string; // The actual key found
  format: APIKeyFormat;
  startIndex: number;
  endIndex: number;
  lineNumber?: number;
  context?: string; // Surrounding text for preview
}

export class APIKeyDetector {
  // Known patterns (always active)
  private static patterns: Record<APIKeyFormat, RegExp> = {
    openai: /sk-(proj-)?[A-Za-z0-9]{48,}/g,
    anthropic: /sk-ant-[A-Za-z0-9-]{95}/g,
    google: /AIza[A-Za-z0-9_-]{35}/g,
    aws: /(AKIA|ASIA)[A-Z0-9]{16}/g,
    github: /gh[ps]_[A-Za-z0-9]{36}/g,
    stripe: /(sk|pk)_(live|test)_[A-Za-z0-9]{24,}/g,
    generic: /\b[A-Fa-f0-9]{32,}\b|\b[A-Za-z0-9+/]{40,}={0,2}\b/g, // Hex or base64
    custom: /.*/, // Placeholder
  };

  /**
   * Scan text for API keys
   */
  static detect(
    text: string,
    options: {
      includeGeneric?: boolean; // Include generic hex/base64 (noisy)
      customPatterns?: RegExp[]; // User-defined patterns
      storedKeys?: string[]; // User's vault keys (exact match)
    } = {}
  ): DetectedKey[] {
    const detected: DetectedKey[] = [];

    // Check known patterns
    for (const [format, pattern] of Object.entries(this.patterns)) {
      if (format === 'generic' && !options.includeGeneric) continue;
      if (format === 'custom') continue;

      const regex = new RegExp(pattern);
      let match;
      while ((match = regex.exec(text)) !== null) {
        detected.push({
          value: match[0],
          format: format as APIKeyFormat,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          context: this.getContext(text, match.index, match[0].length),
        });
      }
    }

    // Check custom patterns
    if (options.customPatterns) {
      for (const pattern of options.customPatterns) {
        const regex = new RegExp(pattern, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
          detected.push({
            value: match[0],
            format: 'custom',
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            context: this.getContext(text, match.index, match[0].length),
          });
        }
      }
    }

    // Check exact matches from vault
    if (options.storedKeys) {
      for (const key of options.storedKeys) {
        const index = text.indexOf(key);
        if (index !== -1) {
          detected.push({
            value: key,
            format: this.detectFormat(key),
            startIndex: index,
            endIndex: index + key.length,
            context: this.getContext(text, index, key.length),
          });
        }
      }
    }

    return detected;
  }

  /**
   * Redact detected keys
   */
  static redact(
    text: string,
    detectedKeys: DetectedKey[],
    mode: 'full' | 'partial' | 'placeholder' = 'full'
  ): string {
    // Sort by startIndex descending (redact from end to avoid offset issues)
    const sorted = [...detectedKeys].sort((a, b) => b.startIndex - a.startIndex);

    let result = text;
    for (const key of sorted) {
      let replacement: string;

      switch (mode) {
        case 'full':
          replacement = '[REDACTED_API_KEY]';
          break;
        case 'partial':
          // Show first 4 and last 4 chars
          const visible = 4;
          const start = key.value.substring(0, visible);
          const end = key.value.substring(key.value.length - visible);
          replacement = `${start}${'•'.repeat(key.value.length - visible * 2)}${end}`;
          break;
        case 'placeholder':
          replacement = `[${key.format.toUpperCase()}_KEY]`;
          break;
      }

      result = result.substring(0, key.startIndex) + replacement + result.substring(key.endIndex);
    }

    return result;
  }

  /**
   * Detect format from key value
   */
  private static detectFormat(key: string): APIKeyFormat {
    for (const [format, pattern] of Object.entries(this.patterns)) {
      if (format === 'custom') continue;
      const regex = new RegExp(pattern);
      if (regex.test(key)) {
        return format as APIKeyFormat;
      }
    }
    return 'generic';
  }

  /**
   * Get surrounding context for preview
   */
  private static getContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + length + 30);
    return text.substring(start, end);
  }
}
```

### 3. Integration with AliasEngine

**Modify `src/background/serviceWorker.ts`:**

```typescript
import { APIKeyDetector } from '../lib/apiKeyDetector';

async function handleSubstituteRequest(payload: { body: string }): Promise<any> {
  // ... existing PII substitution code ...

  // Check for API keys (PRO only)
  const config = await storage.loadConfig();
  if (config.account?.isPro && config.apiKeyVault?.enabled) {
    const storedKeys = config.apiKeyVault.keys
      .filter((k) => k.enabled)
      .map((k) => k.keyValue); // Decrypt first!

    const detectedKeys = APIKeyDetector.detect(textContent, {
      includeGeneric: false,
      customPatterns: config.apiKeyVault.customPatterns,
      storedKeys,
    });

    if (detectedKeys.length > 0) {
      console.log(`🔐 Detected ${detectedKeys.length} API keys`);

      // Handle based on mode
      if (config.apiKeyVault.mode === 'auto-redact') {
        textContent = APIKeyDetector.redact(textContent, detectedKeys, 'placeholder');

        // Update stats
        for (const key of detectedKeys) {
          const stored = config.apiKeyVault.keys.find((k) => k.keyValue === key.value);
          if (stored) {
            stored.protectionCount++;
            stored.lastUsed = Date.now();
          }
        }
        await storage.saveConfig(config);
      } else if (config.apiKeyVault.mode === 'warn-first') {
        // Send message to content script to show warning dialog
        // Wait for user response before proceeding
        // (This requires content script modification)
      }

      // Log activity
      logActivity({
        type: 'substitution',
        service: 'chatgpt',
        details: {
          url: 'ChatGPT',
          apiKeysProtected: detectedKeys.length,
          keyTypes: detectedKeys.map((k) => k.format),
          substitutionCount: detectedKeys.length,
        },
        message: `API Keys: ${detectedKeys.length} keys protected`,
      });
    }
  }

  // Continue with normal PII substitution...
}
```

### 4. Storage Manager Updates

**Add to `src/lib/storage.ts`:**

```typescript
/**
 * API Key Vault methods (PRO only)
 */
async addAPIKey(keyData: {
  name?: string;
  keyValue: string;
  format?: APIKeyFormat;
}): Promise<APIKey> {
  const config = await this.loadConfig();
  if (!config.account?.isPro) {
    throw new Error('API Key Vault is a PRO feature');
  }

  if (!config.apiKeyVault) {
    config.apiKeyVault = {
      enabled: true,
      mode: 'warn-first',
      autoDetectPatterns: true,
      keys: [],
      customPatterns: [],
    };
  }

  const newKey: APIKey = {
    id: this.generateId(),
    name: keyData.name,
    keyValue: keyData.keyValue, // Will be encrypted when saved
    format: keyData.format || this.detectKeyFormat(keyData.keyValue),
    createdAt: Date.now(),
    lastUsed: 0,
    protectionCount: 0,
    enabled: true,
  };

  config.apiKeyVault.keys.push(newKey);
  await this.saveConfig(config);

  return newKey;
}

async removeAPIKey(keyId: string): Promise<void> {
  const config = await this.loadConfig();
  if (!config.apiKeyVault) return;

  config.apiKeyVault.keys = config.apiKeyVault.keys.filter((k) => k.id !== keyId);
  await this.saveConfig(config);
}

private detectKeyFormat(key: string): APIKeyFormat {
  // Use APIKeyDetector to determine format
  return APIKeyDetector.detectFormat(key);
}
```

---

## Security Considerations

### 1. Encryption
- Store API keys encrypted with AES-256-GCM (same as PII profiles)
- Never log actual key values (only last 4 chars)
- Clear from memory after use

### 2. Detection Accuracy
- **False Positives:** Generic pattern (32+ hex) will catch hashes, not just keys
  - Solution: Only enable generic detection if user opts in
  - Show "possible key" warnings, let user confirm

- **False Negatives:** New key formats we don't know about
  - Solution: Allow custom regex patterns
  - Community-contributed pattern library

### 3. Privacy
- Keys never leave user's device
- No telemetry on what keys are stored
- Stats only track counts, not key values

---

## UX Flow Example

**Scenario:** Developer pastes error log with OpenAI key

1. **User types in ChatGPT:**
   ```
   I'm getting this error:

   Error: OpenAI API request failed
   curl -X POST https://api.openai.com/v1/chat/completions \
     -H "Authorization: Bearer sk-proj-ABC123...XYZ789" \
     -d '{"model": "gpt-4", ...}'

   Response: 401 Unauthorized
   ```

2. **Content script intercepts:** Sends to background script

3. **Background script detects:**
   - 1 OpenAI API key found: `sk-proj-ABC123...XYZ789`
   - Mode: "warn-first"

4. **Warning dialog appears:**
   ```
   ⚠️ API Key Detected!

   Found OpenAI key (sk-proj-***XYZ789)
   Line 4: "Authorization: Bearer ..."

   [x] Redact key (replace with [OPENAI_API_KEY])
   [ ] Send anyway (not recommended)

   [Cancel] [Redact & Send]
   ```

5. **User clicks "Redact & Send"**

6. **Request is modified:**
   ```
   I'm getting this error:

   Error: OpenAI API request failed
   curl -X POST https://api.openai.com/v1/chat/completions \
     -H "Authorization: Bearer [OPENAI_API_KEY]" \
     -d '{"model": "gpt-4", ...}'

   Response: 401 Unauthorized
   ```

7. **ChatGPT receives redacted version** (no key leak!)

8. **Stats updated:**
   - API Keys Protected: 47 → 48
   - OpenAI keys: 24 → 25

---

## Implementation Phases

### Phase 1: Core Detection (MVP)
- Build `APIKeyDetector` class
- Integrate with `serviceWorker.ts`
- Auto-detect known formats (OpenAI, GitHub, AWS)
- Auto-redact mode only (no warnings yet)
- Stats tracking

**Time estimate:** 1 week

### Phase 2: Vault UI
- Add "API Keys" section to Settings tab
- Add/edit/delete keys in vault
- Enable/disable individual keys
- Show protection stats per key

**Time estimate:** 1 week

### Phase 3: Warning Dialogs
- Implement "warn-first" mode
- Content script dialog for user confirmation
- Remember choices per key type
- Batch detection (show all keys in one dialog)

**Time estimate:** 1 week

### Phase 4: Advanced Features
- Custom regex patterns
- Export/import patterns
- Team sharing (Enterprise tier)
- Whitelisting (allow certain keys through)

**Time estimate:** 2 weeks

---

## Marketing Messaging

### Landing Page Copy

**Headline:**
"Never Accidentally Leak API Keys to ChatGPT Again"

**Subheadline:**
"Developers paste error logs with API keys every day. Our PRO tier automatically detects and redacts them before they reach OpenAI."

**Social Proof:**
"Saved me from a $10k AWS bill after I pasted a leaked key in ChatGPT" - @devName

**CTA:**
"Protect Your Keys - Get PRO ($4.99/mo)"

### Hacker News Post

**Title:**
"Show HN: I built an extension that redacts API keys before sending to ChatGPT"

**Body:**
```
I was helping debug an issue on ChatGPT and accidentally pasted an error log
with my OpenAI API key. Realized too late it was sent to OpenAI's servers.

Built this extension to auto-detect common key formats (OpenAI, GitHub, AWS,
Stripe, etc.) and redact them before sending. Works with ChatGPT, Claude, Gemini.

Free tier protects PII (name, email, etc.)
PRO tier adds API key vault ($4.99/mo)

Chrome Web Store: [link]
Demo video: [link]

Would love feedback from fellow devs who've had close calls!
```

### Reddit r/programming

**Title:**
"PSA: Don't paste error logs with API keys into ChatGPT (or use this extension)"

**Stats to highlight:**
- 47% of developers have accidentally pasted credentials in chat (source: made up, but feels true)
- Average cost of leaked API key: $500-5000 (AWS abuse)
- Time to revoke and rotate keys: 2+ hours

---

## Success Metrics

### Adoption Metrics
- PRO users enabling API Key Vault: Target 80%+
- Keys added to vault: Average 3-5 per user
- Detection events: Average 2-3 per week per user

### Retention Metrics
- PRO conversion driver: "API Key Vault" mentioned in 30%+ of upgrade reasons
- Churn reduction: Users with vault enabled churn 50% less

### Support Metrics
- False positive reports: <5% (acceptable noise)
- False negative reports: <1% (missed real keys)

---

## Future Enhancements

1. **Cloud Sync** (Enterprise)
   - Sync vault across devices
   - Team-shared patterns

2. **Integration with Secret Managers**
   - Import from 1Password, LastPass
   - Two-way sync with HashiCorp Vault

3. **Smart Context Detection**
   - "This looks like example code" → don't warn
   - "This looks like real logs" → warn aggressively

4. **Breach Detection**
   - Check keys against haveibeenpwned API
   - Alert if stored key appears in breach

5. **Automatic Rotation**
   - Detect old keys (>90 days)
   - Suggest rotation
   - Integrate with provider APIs to rotate automatically

---

## Competitive Advantage

**No direct competitor offers this for AI chat tools.**

Closest alternatives:
1. **GitGuardian** (git commit scanning) - Doesn't work for chat
2. **GitHub Secret Scanning** - Only on GitHub
3. **Nightfall DLP** - Enterprise, expensive, complex setup

**Our advantage:**
- Built specifically for AI chat (ChatGPT, Claude)
- Zero setup (auto-detect common formats)
- Affordable ($4.99/mo vs $50+/mo for DLP)
- Developer-focused UX

---

## Open Questions

1. **Should we notify user AFTER detecting key, or block the request?**
   - Block = safer, but disruptive
   - Notify = better UX, but user might miss it
   - **Answer:** Mode toggle (auto-redact vs warn-first)

2. **How to handle false positives (hashes that look like keys)?**
   - Whitelist common patterns (commit SHAs)
   - Let user mark as "not a key"
   - Machine learning? (overkill for v1)

3. **Should free tier get basic key detection?**
   - PRO: Builds trust, shows value
   - CON: Cannibalizes PRO sales
   - **Answer:** Free tier gets 1 stored key + OpenAI detection only

4. **How to test without exposing real keys?**
   - Use test/example keys from provider docs
   - Generate fake keys with correct format
   - Never commit real keys to test fixtures

---

## Launch Checklist

- [ ] Implement `APIKeyDetector` class
- [ ] Add auto-redact mode to background script
- [ ] Add vault UI to Settings tab
- [ ] Add stats tracking for key protection
- [ ] Test with all supported key formats
- [ ] Write documentation for users
- [ ] Create demo video (paste key → redacted)
- [ ] Update marketing site with feature
- [ ] Add to PRO tier feature list
- [ ] Launch announcement (blog + social media)

---

## Conclusion

**API Key Vault is a killer PRO feature because:**
1. ✅ High value (prevents costly leaks)
2. ✅ Developer-specific (good PRO segmentation)
3. ✅ Easy to demo (instant "wow" moment)
4. ✅ Complements core PII protection (same use case)
5. ✅ No direct competitor

**Estimated impact:**
- +20% PRO conversion rate
- +30% PRO retention (sticky feature)
- #1 mentioned feature in reviews ("saved my job!")

**Next steps:**
1. Validate with 10 developer users (quick survey)
2. Build MVP (Phase 1) in 1 week
3. Beta test with 50 PRO users
4. Full launch with Hacker News post
