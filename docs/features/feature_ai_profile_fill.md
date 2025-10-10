# Feature Spec: AI-Powered Profile Fill

## Overview

**Problem:** Creating realistic fake aliases is tedious. Users need to manually invent names, emails, phone numbers, and addresses that sound believable.

**Solution:** Use the AI chat the user is currently on (ChatGPT, Claude, Gemini) to generate a complete fake identity profile with one click.

**Target Users:** All users (FREE + PRO)

**Value Prop:** "Generate a complete fake identity in 5 seconds using the AI you're already talking to"

**Key Principle:** 🔒 **100% TRANSPARENT** - User sees the message we send to the AI, nothing hidden

---

## User Stories

1. **As a user**, I want to quickly generate a fake profile without thinking of names manually, so I can protect my privacy faster.

2. **As a user**, I want the extension to use ChatGPT/Claude to generate the profile, so the alias looks realistic and contextually appropriate.

3. **As a user**, I want to see the AI generation request in my chat history (transparent), so I know exactly what data was shared.

4. **As a user**, I want the option to delete the generation message afterward, so my chat history stays clean (optional).

5. **As a user**, I want the generated profile to pre-fill my profile form, so I can review and save it quickly.

---

## UI/UX Design

### Profile Modal - New Button: "AI Generate"

**Location:** Profile editor modal (popup-v2.html)

```
┌──────────────────────────────────────────┐
│ ✏️  Edit Profile: Work Profile           │
├──────────────────────────────────────────┤
│ Real Information                         │
│ Name:     [Greg Barker              ]   │
│ Email:    [greg@acme.com            ]   │
│ Phone:    [(555) 123-4567           ]   │
│                                          │
│ Alias Information                        │
│ Name:     [                         ]   │
│ Email:    [                         ]   │
│ Phone:    [                         ]   │
│                                          │
│ [🤖 AI Generate Alias]  ← NEW BUTTON    │
│                                          │
│           [Cancel]  [Save Profile]       │
└──────────────────────────────────────────┘
```

### Step 1: User Clicks "AI Generate Alias"

**Consent Modal:**
```
┌───────────────────────────────────────────────┐
│ 🤖 AI Profile Generator                       │
├───────────────────────────────────────────────┤
│ This will send a message to ChatGPT to        │
│ generate a fake identity profile.             │
│                                               │
│ ⚠️  You will see this request in your chat:   │
│ ┌───────────────────────────────────────────┐ │
│ │ [AI Profile Generator Request]            │ │
│ │                                           │ │
│ │ Generate a realistic fake identity:       │ │
│ │ - Full name                               │ │
│ │ - Email address                           │ │
│ │ - Phone number (US format)                │ │
│ │ - Company name                            │ │
│ │                                           │ │
│ │ Return ONLY valid JSON:                   │ │
│ │ {"name": "...", "email": "...", ...}      │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ 🔒 Privacy Notes:                             │
│ • Your REAL info is NOT shared with the AI   │
│ • AI generates completely random fake data   │
│ • You can delete this message afterward      │
│                                               │
│ [x] Delete message after generation           │
│                                               │
│          [Cancel]  [Generate]                 │
└───────────────────────────────────────────────┘
```

### Step 2: Extension Sends Message to Chat

**What the user sees in ChatGPT:**
```
┌──────────────────────────────────────────┐
│ You:                                     │
│ [AI Profile Generator Request]           │
│                                          │
│ Generate a realistic fake identity:      │
│ - Full name (first and last)            │
│ - Email address                          │
│ - Phone number (US format)               │
│ - Company name                           │
│                                          │
│ Return ONLY valid JSON in this format:   │
│ {                                        │
│   "name": "John Smith",                  │
│   "email": "john.smith@example.com",     │
│   "phone": "(555) 123-4567",             │
│   "company": "Acme Corporation"          │
│ }                                        │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ ChatGPT:                                 │
│ {                                        │
│   "name": "Michael Chen",                │
│   "email": "m.chen@techstart.io",        │
│   "phone": "(415) 555-8920",             │
│   "company": "TechStart Solutions"       │
│ }                                        │
└──────────────────────────────────────────┘
```

### Step 3: Extension Parses Response

**Success Modal:**
```
┌────────────────────────────────────────┐
│ ✅ Profile Generated!                  │
├────────────────────────────────────────┤
│ AI generated this alias for you:       │
│                                        │
│ Name:    Michael Chen                  │
│ Email:   m.chen@techstart.io           │
│ Phone:   (415) 555-8920                │
│ Company: TechStart Solutions           │
│                                        │
│ These values have been filled in your  │
│ profile form. Review and save below.   │
│                                        │
│ [x] Message deleted from chat ✓        │
│                                        │
│              [OK]                      │
└────────────────────────────────────────┘
```

### Step 4: Profile Form Pre-Filled

```
┌──────────────────────────────────────────┐
│ ✏️  Edit Profile: Work Profile           │
├──────────────────────────────────────────┤
│ Real Information                         │
│ Name:     [Greg Barker              ]   │
│ Email:    [greg@acme.com            ]   │
│ Phone:    [(555) 123-4567           ]   │
│                                          │
│ Alias Information (✨ AI Generated)      │
│ Name:     [Michael Chen             ]   │
│ Email:    [m.chen@techstart.io      ]   │
│ Phone:    [(415) 555-8920           ]   │
│ Company:  [TechStart Solutions      ]   │
│                                          │
│ [🔄 Regenerate]  [🤖 Generate Variations]│
│                                          │
│           [Cancel]  [Save Profile]       │
└──────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Data Model

**Add to types.ts:**

```typescript
/**
 * AI Profile Generation Configuration
 */
export interface AIProfileGenConfig {
  enabled: boolean;
  deleteMessageAfterGen: boolean; // User preference
  lastUsed: number;
  generationCount: number; // Stats tracking
  preferredService: 'auto' | 'chatgpt' | 'claude' | 'gemini'; // Which AI to use
}

// Add to UserConfig
export interface UserConfig {
  // ... existing fields
  aiProfileGen?: AIProfileGenConfig;
}
```

### 2. Prompt Engineering for Different AI Services

**New file: `src/lib/aiProfileGenerator.ts`**

```typescript
import { AIService } from './types';

export interface GeneratedProfile {
  name: string;
  email: string;
  phone: string;
  cellPhone?: string;
  address?: string;
  company?: string;
}

export class AIProfileGenerator {
  /**
   * Get prompt for specific AI service
   */
  static getPrompt(service: AIService, fields: string[]): string {
    const basePrompt = this.getBasePrompt(fields);

    switch (service) {
      case 'chatgpt':
        return this.getChatGPTPrompt(basePrompt);
      case 'claude':
        return this.getClaudePrompt(basePrompt);
      case 'gemini':
        return this.getGeminiPrompt(basePrompt);
      default:
        return this.getChatGPTPrompt(basePrompt); // Fallback
    }
  }

  /**
   * Base prompt template
   */
  private static getBasePrompt(fields: string[]): string {
    const fieldDescriptions = {
      name: 'Full name (first and last)',
      email: 'Professional email address',
      phone: 'Phone number (US format with area code)',
      cellPhone: 'Mobile phone number (US format)',
      address: 'Full mailing address (street, city, state, ZIP)',
      company: 'Company name (realistic business name)',
    };

    const requestedFields = fields
      .map((field) => `- ${fieldDescriptions[field] || field}`)
      .join('\n');

    return `[AI Profile Generator Request]

Generate a realistic fake identity profile with the following information:
${requestedFields}

Return ONLY valid JSON in this exact format (no additional text):
{
${fields.map((f) => `  "${f}": "..."`).join(',\n')}
}

Important:
- Use realistic but completely fictional data
- Ensure all values are plausible (valid phone format, real-looking email domain)
- Do not use famous names or real people
- Keep it professional (business context)`;
  }

  /**
   * ChatGPT-specific prompt
   */
  private static getChatGPTPrompt(basePrompt: string): string {
    return `${basePrompt}

Example output:
{
  "name": "Sarah Williams",
  "email": "s.williams@techcorp.io",
  "phone": "(425) 555-1234",
  "company": "TechCorp Industries"
}`;
  }

  /**
   * Claude-specific prompt
   * (Claude is more verbose, needs explicit JSON-only instruction)
   */
  private static getClaudePrompt(basePrompt: string): string {
    return `${basePrompt}

CRITICAL: Return ONLY the JSON object. No explanations, no markdown, no additional text.
Your entire response should be valid JSON that starts with { and ends with }.`;
  }

  /**
   * Gemini-specific prompt
   * (Gemini sometimes adds markdown, needs strict format)
   */
  private static getGeminiPrompt(basePrompt: string): string {
    return `${basePrompt}

Format: Return ONLY raw JSON. Do not wrap in markdown code blocks.
Do not include any text before or after the JSON object.`;
  }

  /**
   * Parse AI response and extract JSON
   */
  static parseResponse(response: string, fields: string[]): GeneratedProfile | null {
    try {
      // Try direct JSON parse first
      const parsed = JSON.parse(response);

      // Validate all required fields exist
      const missingFields = fields.filter((f) => !parsed[f]);
      if (missingFields.length > 0) {
        console.warn('[AIProfileGen] Missing fields:', missingFields);
        return null;
      }

      return parsed as GeneratedProfile;
    } catch (e) {
      // AI might have wrapped JSON in markdown or added extra text
      // Try to extract JSON using regex
      return this.extractJSONFromText(response, fields);
    }
  }

  /**
   * Extract JSON from text (handles markdown, extra text, etc.)
   */
  private static extractJSONFromText(text: string, fields: string[]): GeneratedProfile | null {
    // Remove markdown code blocks
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Try to find JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[AIProfileGen] No JSON found in response');
      return null;
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const missingFields = fields.filter((f) => !parsed[f]);
      if (missingFields.length > 0) {
        console.warn('[AIProfileGen] Missing fields after extraction:', missingFields);
        return null;
      }

      return parsed as GeneratedProfile;
    } catch (e) {
      console.error('[AIProfileGen] Failed to parse extracted JSON:', e);
      return null;
    }
  }

  /**
   * Validate generated profile data
   */
  static validateProfile(profile: GeneratedProfile): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate name (should have first and last)
    if (profile.name && profile.name.split(' ').length < 2) {
      errors.push('Name should include first and last name');
    }

    // Validate email (basic regex)
    if (profile.email && !this.isValidEmail(profile.email)) {
      errors.push('Invalid email format');
    }

    // Validate phone (should have 10 digits)
    if (profile.phone && !this.isValidPhone(profile.phone)) {
      errors.push('Invalid phone format (should be US format with area code)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    // Extract digits
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11; // 10 or 11 digits (with country code)
  }
}
```

### 3. Chat Message Injection

**New file: `src/content/chatMessageInjector.ts`**

```typescript
/**
 * Inject messages into AI chat pages
 * Supports ChatGPT, Claude, Gemini
 */

export interface ChatMessageInjector {
  sendMessage(prompt: string): Promise<string>;
  deleteLastMessage(): Promise<boolean>;
  detectService(): 'chatgpt' | 'claude' | 'gemini' | 'unknown';
}

export class ChatGPTInjector implements ChatMessageInjector {
  detectService(): 'chatgpt' {
    return 'chatgpt';
  }

  async sendMessage(prompt: string): Promise<string> {
    // Find ChatGPT input textarea
    const inputBox = document.querySelector('textarea[data-id="root"]') ||
                     document.querySelector('#prompt-textarea');

    if (!inputBox) {
      throw new Error('ChatGPT input box not found');
    }

    // Fill input with prompt
    (inputBox as HTMLTextAreaElement).value = prompt;

    // Trigger input event (ChatGPT listens to this)
    inputBox.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for send button to be enabled
    await this.waitForSendButton();

    // Click send button
    const sendButton = document.querySelector('button[data-testid="send-button"]');
    if (!sendButton) {
      throw new Error('Send button not found');
    }

    (sendButton as HTMLButtonElement).click();

    // Wait for response
    return await this.waitForResponse();
  }

  private async waitForSendButton(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const sendButton = document.querySelector('button[data-testid="send-button"]');
        if (sendButton && !(sendButton as HTMLButtonElement).disabled) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
  }

  private async waitForResponse(): Promise<string> {
    return new Promise((resolve, reject) => {
      let responseText = '';
      let lastCheck = Date.now();
      const timeout = 30000; // 30 second timeout

      const checkInterval = setInterval(() => {
        // Check if response is still streaming
        const stopButton = document.querySelector('button[data-testid="stop-button"]');

        if (!stopButton) {
          // Response finished
          const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
          const lastMessage = messages[messages.length - 1];

          if (lastMessage) {
            responseText = lastMessage.textContent || '';
            clearInterval(checkInterval);
            resolve(responseText);
          }
        } else {
          // Still streaming, reset timeout
          lastCheck = Date.now();
        }

        // Check timeout
        if (Date.now() - lastCheck > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Response timeout (30s)'));
        }
      }, 500);
    });
  }

  async deleteLastMessage(): Promise<boolean> {
    try {
      // Find the last two messages (user prompt + AI response)
      const messages = document.querySelectorAll('[data-testid^="conversation-turn-"]');

      if (messages.length < 2) {
        return false;
      }

      // Delete last 2 messages (our prompt + AI response)
      for (let i = messages.length - 1; i >= messages.length - 2; i--) {
        const message = messages[i];

        // Find delete button (usually in hover menu)
        const moreButton = message.querySelector('button[aria-label="More"]');
        if (moreButton) {
          (moreButton as HTMLButtonElement).click();

          // Wait for menu
          await new Promise((resolve) => setTimeout(resolve, 200));

          // Click delete option
          const deleteButton = document.querySelector('[role="menuitem"]') as HTMLButtonElement;
          if (deleteButton && deleteButton.textContent?.includes('Delete')) {
            deleteButton.click();

            // Confirm deletion
            await new Promise((resolve) => setTimeout(resolve, 200));
            const confirmButton = document.querySelector('button:has-text("Delete")');
            if (confirmButton) {
              (confirmButton as HTMLButtonElement).click();
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('[ChatGPTInjector] Failed to delete messages:', error);
      return false;
    }
  }
}

export class ClaudeInjector implements ChatMessageInjector {
  detectService(): 'claude' {
    return 'claude';
  }

  async sendMessage(prompt: string): Promise<string> {
    // Find Claude input
    const inputBox = document.querySelector('div[contenteditable="true"]');

    if (!inputBox) {
      throw new Error('Claude input box not found');
    }

    // Set text (contenteditable uses innerHTML)
    inputBox.innerHTML = prompt;

    // Trigger input event
    inputBox.dispatchEvent(new Event('input', { bubbles: true }));

    // Find and click send button
    const sendButton = document.querySelector('button[aria-label="Send Message"]');
    if (!sendButton) {
      throw new Error('Send button not found');
    }

    (sendButton as HTMLButtonElement).click();

    // Wait for response
    return await this.waitForResponse();
  }

  private async waitForResponse(): Promise<string> {
    // Similar to ChatGPT, but Claude has different DOM structure
    return new Promise((resolve, reject) => {
      const timeout = 30000;
      const startTime = Date.now();

      const checkInterval = setInterval(() => {
        // Check for Claude response
        const messages = document.querySelectorAll('[data-is-streaming="false"]');
        const lastMessage = messages[messages.length - 1];

        if (lastMessage) {
          const responseText = lastMessage.textContent || '';
          clearInterval(checkInterval);
          resolve(responseText);
        }

        // Timeout check
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Response timeout'));
        }
      }, 500);
    });
  }

  async deleteLastMessage(): Promise<boolean> {
    // Claude-specific deletion logic
    // (Implementation similar to ChatGPT but with Claude's DOM structure)
    return false; // TODO: Implement
  }
}

export class GeminiInjector implements ChatMessageInjector {
  detectService(): 'gemini' {
    return 'gemini';
  }

  async sendMessage(prompt: string): Promise<string> {
    // Gemini-specific implementation
    throw new Error('Gemini injector not yet implemented');
  }

  async deleteLastMessage(): Promise<boolean> {
    return false; // TODO: Implement
  }
}

/**
 * Factory to get appropriate injector based on current page
 */
export function getChatInjector(): ChatMessageInjector {
  const hostname = window.location.hostname;

  if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
    return new ChatGPTInjector();
  }
  if (hostname.includes('claude.ai')) {
    return new ClaudeInjector();
  }
  if (hostname.includes('gemini.google.com')) {
    return new GeminiInjector();
  }

  throw new Error('Unsupported AI service');
}
```

### 4. Profile Modal Integration

**Modify: `src/popup/components/profileModal.ts`**

```typescript
import { AIProfileGenerator } from '../../lib/aiProfileGenerator';

/**
 * Add "AI Generate" button to profile modal
 */
function initAIGenerateButton() {
  const aliasNameField = document.getElementById('aliasName') as HTMLInputElement;
  const aiGenerateBtn = document.createElement('button');
  aiGenerateBtn.id = 'aiGenerateBtn';
  aiGenerateBtn.className = 'ai-generate-btn';
  aiGenerateBtn.innerHTML = '🤖 AI Generate Alias';
  aiGenerateBtn.type = 'button'; // Prevent form submission

  // Insert after alias fields
  const aliasSection = aliasNameField.closest('.form-section');
  if (aliasSection) {
    aliasSection.appendChild(aiGenerateBtn);
  }

  // Handle click
  aiGenerateBtn.addEventListener('click', async () => {
    await handleAIGenerate();
  });
}

/**
 * Handle AI generation flow
 */
async function handleAIGenerate() {
  // Step 1: Show consent modal
  const userConsent = await showConsentModal();

  if (!userConsent.accepted) {
    return; // User cancelled
  }

  // Step 2: Send message to content script to inject prompt
  try {
    showLoadingState();

    const response = await chrome.runtime.sendMessage({
      type: 'AI_GENERATE_PROFILE',
      payload: {
        fields: ['name', 'email', 'phone', 'company'],
        deleteAfter: userConsent.deleteAfter,
      },
    });

    hideLoadingState();

    if (response.success) {
      // Step 3: Fill form with generated data
      fillFormWithGeneratedData(response.profile);

      // Step 4: Show success message
      showSuccessMessage(response.profile, userConsent.deleteAfter);
    } else {
      showErrorMessage(response.error);
    }
  } catch (error) {
    hideLoadingState();
    showErrorMessage(error.message);
  }
}

/**
 * Show consent modal
 */
async function showConsentModal(): Promise<{ accepted: boolean; deleteAfter: boolean }> {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'ai-consent-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <h3>🤖 AI Profile Generator</h3>
          <p>This will send a message to ChatGPT to generate a fake identity profile.</p>

          <div class="warning-box">
            <strong>⚠️ You will see this request in your chat:</strong>
            <pre>[AI Profile Generator Request]

Generate a realistic fake identity:
- Full name
- Email address
- Phone number
- Company name

Return ONLY valid JSON...</pre>
          </div>

          <div class="privacy-notes">
            <strong>🔒 Privacy Notes:</strong>
            <ul>
              <li>Your REAL info is NOT shared with the AI</li>
              <li>AI generates completely random fake data</li>
              <li>You can delete this message afterward</li>
            </ul>
          </div>

          <label>
            <input type="checkbox" id="deleteAfterCheckbox" checked>
            Delete message after generation
          </label>

          <div class="modal-actions">
            <button class="cancel-btn">Cancel</button>
            <button class="generate-btn">Generate</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.cancel-btn')!.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve({ accepted: false, deleteAfter: false });
    });

    modal.querySelector('.generate-btn')!.addEventListener('click', () => {
      const deleteAfter = (document.getElementById('deleteAfterCheckbox') as HTMLInputElement).checked;
      document.body.removeChild(modal);
      resolve({ accepted: true, deleteAfter });
    });
  });
}

/**
 * Fill form with generated data
 */
function fillFormWithGeneratedData(profile: any) {
  (document.getElementById('aliasName') as HTMLInputElement).value = profile.name || '';
  (document.getElementById('aliasEmail') as HTMLInputElement).value = profile.email || '';
  (document.getElementById('aliasPhone') as HTMLInputElement).value = profile.phone || '';
  (document.getElementById('aliasCompany') as HTMLInputElement).value = profile.company || '';

  // Show visual indicator that fields were AI-generated
  document.querySelectorAll('.alias-field').forEach((field) => {
    field.classList.add('ai-generated');
  });
}
```

### 5. Background Service Worker Handler

**Modify: `src/background/serviceWorker.ts`**

```typescript
import { AIProfileGenerator } from '../lib/aiProfileGenerator';

/**
 * Handle AI profile generation request
 */
async function handleAIGenerateProfile(payload: {
  fields: string[];
  deleteAfter: boolean;
}): Promise<any> {
  try {
    // Send message to content script to inject chat message
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tabs[0]?.id) {
      throw new Error('No active tab found');
    }

    const tabId = tabs[0].id;

    // Get prompt for current service
    const service = detectService(tabs[0].url || '');
    const prompt = AIProfileGenerator.getPrompt(service, payload.fields);

    // Send to content script to inject message
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'INJECT_CHAT_MESSAGE',
      payload: { prompt, deleteAfter: payload.deleteAfter },
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    // Parse AI response
    const profile = AIProfileGenerator.parseResponse(response.aiResponse, payload.fields);

    if (!profile) {
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Validate profile
    const validation = AIProfileGenerator.validateProfile(profile);
    if (!validation.valid) {
      throw new Error(`Generated profile is invalid: ${validation.errors.join(', ')}`);
    }

    // Update stats
    const storage = StorageManager.getInstance();
    const config = await storage.loadConfig();
    if (config.aiProfileGen) {
      config.aiProfileGen.generationCount++;
      config.aiProfileGen.lastUsed = Date.now();
      await storage.saveConfig(config);
    }

    return {
      success: true,
      profile,
    };
  } catch (error: any) {
    console.error('[AIProfileGen] Error:', error);
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

    case 'AI_GENERATE_PROFILE':
      return handleAIGenerateProfile(message.payload);

    // ...
  }
}
```

### 6. Content Script Handler

**Modify: `src/content/content.ts`**

```typescript
import { getChatInjector } from './chatMessageInjector';

// Handle INJECT_CHAT_MESSAGE from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INJECT_CHAT_MESSAGE') {
    (async () => {
      try {
        const injector = getChatInjector();

        // Send message to AI
        const aiResponse = await injector.sendMessage(message.payload.prompt);

        // Optionally delete message
        if (message.payload.deleteAfter) {
          await injector.deleteLastMessage();
        }

        sendResponse({ success: true, aiResponse });
      } catch (error: any) {
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Async response
  }
});
```

---

## Error Handling

### Common Failures & Solutions

1. **AI refuses to generate JSON**
   - Fallback: Retry with more explicit prompt
   - Show user the AI response and ask them to manually parse

2. **AI response is not valid JSON**
   - Try to extract JSON from markdown/text
   - If fails, show error and suggest manual entry

3. **Input box not found (page structure changed)**
   - Show error: "Could not find chat input. Please try manually."
   - Log error for debugging

4. **Send button disabled (rate limit)**
   - Show error: "ChatGPT rate limit reached. Please wait and try again."

5. **Response timeout (AI is slow)**
   - 30 second timeout
   - Show error: "AI took too long to respond. Please try again."

---

## FREE vs PRO Comparison

| Feature | FREE | PRO |
|---------|------|-----|
| **AI Profile Generation** | ✅ 5 generations/day | ✅ Unlimited |
| **Delete Message Option** | ✅ Yes | ✅ Yes |
| **Supported Services** | ChatGPT only | All services (ChatGPT, Claude, Gemini) |
| **Fields Generated** | Name, email, phone | All fields + custom fields |
| **Regenerate Button** | ❌ No | ✅ Yes (unlimited retries) |
| **AI Variation Generator** | ❌ No | ✅ Yes (generate alias variations) |

---

## Implementation Phases

### Phase 1: ChatGPT MVP (Week 1)
- [ ] Build `AIProfileGenerator` with ChatGPT prompts
- [ ] Build `ChatGPTInjector` for message injection
- [ ] Add "AI Generate" button to profile modal
- [ ] Implement consent modal
- [ ] Test end-to-end on ChatGPT

**Deliverable:** Working AI generation for ChatGPT

### Phase 2: Claude + Gemini (Week 2)
- [ ] Implement `ClaudeInjector`
- [ ] Implement `GeminiInjector`
- [ ] Test on Claude and Gemini
- [ ] Handle service-specific quirks

**Deliverable:** Multi-service support

### Phase 3: Polish (Week 2)
- [ ] Add delete message functionality
- [ ] Add regenerate button (PRO)
- [ ] Error handling for all edge cases
- [ ] Loading states and animations

**Deliverable:** Production-ready feature

### Phase 4: Advanced Features (Future)
- [ ] AI-powered alias variations (PRO)
- [ ] Context-aware generation (based on real info)
- [ ] Batch generation (generate 5 profiles at once)

---

## Privacy & Transparency

### What We Send to AI:
- ✅ Generic prompt requesting fake data
- ❌ **NEVER** the user's real information

### What User Sees:
- ✅ Full prompt in their chat (transparent)
- ✅ Option to delete afterward
- ✅ Explicit consent modal before sending

### What AI Sees:
- ✅ Generic generation request
- ❌ No real PII
- ❌ No extension metadata

**This is 100% transparent and privacy-preserving.**

---

## Success Metrics

### Adoption
- 50%+ of users try AI generation at least once
- 30% use it regularly (>1x per week)
- 80% keep "delete message" enabled

### Quality
- 90%+ successful generations (valid JSON returned)
- <5% retry rate (first generation is usually good)
- 95%+ user satisfaction ("generated alias looks realistic")

### Performance
- <10 seconds total time (injection → response → parse)
- <5% timeout rate

---

## Marketing Messaging

**Headline:** "Create Fake Identities in 5 Seconds with AI"

**Subheadline:** "Let ChatGPT generate realistic aliases for you. One click, instant fake profile."

**Features:**
- ✅ AI-generated names, emails, phone numbers
- ✅ Completely transparent (you see what we send)
- ✅ Optional: delete message after generation
- ✅ Works with ChatGPT, Claude, Gemini

**CTA:** "Try AI Generation (FREE)"

---

## Future Enhancements

1. **AI Variation Generator (PRO)**
   - Generate alias variations using AI
   - "Generate 10 variations of 'Greg Barker' → 'GregBarker', 'gbarker', etc."

2. **Context-Aware Generation**
   - Use real info to generate contextually similar alias
   - "Real: 'greg@acme.com' → Alias: 'john@techcorp.io' (similar domain pattern)"

3. **Batch Generation**
   - Generate 5 profiles at once
   - User picks their favorite

4. **Team Profiles**
   - Generate entire team of fake identities
   - Consistent company name, similar email domains

---

## Conclusion

**AI Profile Fill is a high-impact, differentiated feature:**
- ✅ Saves user time (no manual alias creation)
- ✅ Uses AI they're already using (no new API keys)
- ✅ Completely transparent (privacy-preserving)
- ✅ Great demo feature (wow factor)
- ✅ Opens door to future AI features (variations, suggestions)

**Estimated Impact:**
- +20% user engagement (AI features are sticky)
- +5% PRO conversion (unlimited generations)
- #3 most mentioned feature in marketing (after PII protection + API key vault)

**Next Steps:**
1. Build Phase 1 (ChatGPT MVP) - 1 week
2. Test with 10 beta users
3. Add Claude/Gemini support - 1 week
4. Launch with demo video showing AI generation
