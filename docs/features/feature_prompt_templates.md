# Prompt Templates Architecture & Flow Analysis

## Current Implementation Flow

### 1. Template Creation (Storage Layer)
**Location**: `src/lib/storage.ts`, `src/popup/components/promptTemplates.ts`

```
User creates template → Stored in config.promptTemplates
{
  id: string,
  name: string,
  content: string,  // Contains {{placeholder}} syntax
  category: string,
  profileId?: string,  // Optional default profile
  ...
}
```

### 2. Template Injection Flow (Request Path)

```
┌─────────────┐
│   Popup UI  │ User clicks "Use Template" button
│promptTempla │
│  tes.ts     │
└──────┬──────┘
       │ 1. Loads template.content (has {{placeholders}})
       │ 2. Gets active profile from store.profiles
       │ 3. Replaces {{name}} → alias.name, {{email}} → alias.email, etc.
       │ 4. Creates filled template with ALIAS data
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ chrome.tabs.sendMessage(tab.id, {                        │
│   type: 'INJECT_TEMPLATE',                               │
│   payload: { content: filledTemplate }  // Has \n chars  │
│ })                                                        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────┐
       │  Content Script     │ chrome.runtime.onMessage
       │  content.ts:149     │
       └──────────┬──────────┘
                  │ Receives message with filled template
                  │
                  ▼
       ┌─────────────────────┐
       │ injectTemplateInto  │ content.ts:180
       │ Chat()              │
       └──────────┬──────────┘
                  │
                  ├─ ChatGPT: contenteditable div (#prompt-textarea)
                  │  └─ Creates text node with \n characters
                  │     └─ ProseMirror processes and may normalize
                  │
                  ├─ Claude/Gemini: contenteditable div
                  │  └─ Converts \n → <br> tags via innerHTML
                  │
                  └─ Perplexity/Copilot: <textarea>
                     └─ Sets .value property (preserves \n naturally)
```

### 3. Interception Flow (When User Sends)

```
┌──────────────────┐
│ User clicks Send │
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│  inject.js (page)  │ Intercepts fetch() at page context
│  Line 206-342      │
└────────┬───────────┘
         │ 1. Captures request body
         │ 2. Posts to content script via window.postMessage
         │
         ▼
┌────────────────────┐
│  content.ts        │ Relays message to background
│  Line 374-411      │
└────────┬───────────┘
         │
         ▼
┌────────────────────────────────────────────────────┐
│  serviceWorker.ts (background)                     │
│  handleSubstituteRequest() - Line 390-655          │
└────────┬───────────────────────────────────────────┘
         │ 1. extractAllText() - combines all message text
         │ 2. aliasEngine.substitute(text, 'encode')
         │    └─ Replaces: Real Name → Alias Name
         │       Real Email → Alias Email, etc.
         │ 3. replaceAllText() - puts text back into structure
         │ 4. Returns modifiedBody
         │
         ▼
┌────────────────────┐
│  Back to inject.js │ Makes actual fetch with modified body
└────────────────────┘
```

**CURRENT ISSUE**: When templates already have ALIAS data:
- Template fills: `{{name}}` → `Alias Name`
- User sends: Text already says "Alias Name"
- Interceptor looks for "Real Name" → no match → no substitution
- Result: ✅ Correct! Aliases are sent as-is

**But formatting is lost somewhere in this chain!**

---

## The Response Path (AI → User)

### Current Implementation

```
┌─────────────────┐
│  AI Response    │ Streaming or JSON
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│  inject.js         │ Intercepts response
│  Line 344-449      │
└────────┬───────────┘
         │ For each chunk:
         │ 1. Extracts text from response
         │ 2. Posts to content script
         │
         ▼
┌────────────────────┐
│  content.ts        │ Relays to background
└────────┬───────────┘
         │
         ▼
┌────────────────────────────────────────────────────┐
│  serviceWorker.ts                                  │
│  handleSubstituteResponse() - Line 660-700         │
└────────┬───────────────────────────────────────────┘
         │ IF config.settings.decodeResponses is TRUE:
         │   aliasEngine.substitute(text, 'decode')
         │   └─ Replaces: Alias Name → Real Name
         │      Alias Email → Real Email
         │ ELSE:
         │   Returns text unchanged (aliases stay)
         │
         ▼
┌────────────────────┐
│  Back to inject.js │ Returns modified response to page
│                    │ ChatGPT renders it
└────────────────────┘
```

**Current Behavior**:
- `decodeResponses: true` → AI response shows YOUR REAL DATA ⚠️
- `decodeResponses: false` → AI response shows ALIAS DATA ✅

---

## Proposed Feature: Manual Re-injection of Real Data

### Your Idea
```
1. User gets AI response (contains alias data)
2. User clicks "Replace Aliases" button in popup
3. Cursor changes to indicate "selection mode"
4. User clicks on the AI response they want to convert
5. Extension replaces alias → real data in that specific message
```

### Technical Challenges

#### Challenge 1: Finding the Response Element
ChatGPT/Claude/etc. don't expose easy selectors for individual messages.

**Possible Solutions**:
- **Option A**: Click anywhere, walk up DOM to find message container
- **Option B**: Hover to highlight, click to select
- **Option C**: Inject UI markers next to each AI response

#### Challenge 2: Extracting Text from Rich HTML
AI responses contain:
- Code blocks (`<pre><code>`)
- Lists (`<ul>`, `<ol>`)
- Bold/italic (`<strong>`, `<em>`)
- Links (`<a>`)

**We need to**:
1. Extract text while preserving structure
2. Run decode substitution
3. Re-inject while maintaining formatting

#### Challenge 3: Platform-Specific DOM Structures

Each platform renders differently:

**ChatGPT**:
```html
<div data-message-id="...">
  <div class="markdown">
    <p>Text with <strong>formatting</strong></p>
    <pre><code>code here</code></pre>
  </div>
</div>
```

**Claude**:
```html
<div class="font-claude-message">
  <!-- Similar but different classes -->
</div>
```

**Gemini/Perplexity/Copilot**: All different!

---

## Proposed Implementation Plan

### Phase 1: Message Detection & Selection

**File**: `src/content/content.ts`

```typescript
// Add message listener from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'START_REINJECTION_MODE') {
    enableReinjectionMode();
    sendResponse({ success: true });
  }
});

function enableReinjectionMode() {
  // Change cursor
  document.body.style.cursor = 'crosshair';

  // Add click listener
  const clickHandler = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    const messageElement = findMessageContainer(target);

    if (messageElement) {
      await reinjectRealData(messageElement);
      disableReinjectionMode();
    }
  };

  document.addEventListener('click', clickHandler, true);

  // Store handler to remove later
  (window as any).__reinjectionHandler = clickHandler;
}

function findMessageContainer(element: HTMLElement): HTMLElement | null {
  // Platform-specific logic
  const hostname = window.location.hostname;

  if (hostname.includes('chatgpt.com')) {
    // Walk up to find [data-message-id] or similar
    let current = element;
    while (current && current !== document.body) {
      if (current.hasAttribute('data-message-id') ||
          current.matches('.group.final-completion')) {
        return current;
      }
      current = current.parentElement!;
    }
  }

  // Similar for other platforms...

  return null;
}
```

### Phase 2: Text Extraction & Substitution

```typescript
async function reinjectRealData(messageElement: HTMLElement) {
  // 1. Extract all text nodes while preserving structure
  const textNodes = getAllTextNodes(messageElement);

  // 2. Get combined text
  const combinedText = textNodes.map(node => node.textContent).join('\n');

  // 3. Request decode substitution from background
  const response = await chrome.runtime.sendMessage({
    type: 'DECODE_TEXT',
    payload: { text: combinedText }
  });

  if (!response.success) return;

  // 4. Split decoded text and replace in-place
  const decodedParts = response.decodedText.split('\n');
  textNodes.forEach((node, index) => {
    if (decodedParts[index]) {
      node.textContent = decodedParts[index];
    }
  });

  // 5. Visual feedback
  messageElement.style.outline = '2px solid #10b981';
  setTimeout(() => {
    messageElement.style.outline = '';
  }, 2000);
}

function getAllTextNodes(element: HTMLElement): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip code blocks, scripts, etc.
        const parent = node.parentElement;
        if (parent?.matches('code, script, style')) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.textContent?.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node as Text);
  }

  return textNodes;
}
```

### Phase 3: Background Handler

**File**: `src/background/serviceWorker.ts`

```typescript
case 'DECODE_TEXT':
  return handleDecodeText(message.payload);

async function handleDecodeText(payload: { text: string }) {
  try {
    const aliasEngine = await AliasEngine.getInstance();
    const decoded = aliasEngine.substitute(payload.text, 'decode');

    return {
      success: true,
      decodedText: decoded.text,
      substitutions: decoded.substitutions.length
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### Phase 4: Popup UI

**File**: `src/popup/components/promptTemplates.ts` or new feature section

```html
<button id="start-reinjection" class="secondary-button">
  🔄 Replace Aliases in Response
</button>
```

```typescript
document.getElementById('start-reinjection')?.addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab.id) return;

  // Send message to content script
  await chrome.tabs.sendMessage(tab.id, {
    type: 'START_REINJECTION_MODE'
  });

  // Close popup (optional)
  window.close();
});
```

---

## Alternative: Automatic Decode on Copy

Instead of clicking, we could:

1. User selects text in AI response
2. User presses Ctrl+C (copy)
3. Extension intercepts copy event
4. Decodes aliases → real data
5. Puts decoded text in clipboard

**Pros**:
- Simpler UX (just copy)
- Works with any text selection
- No need to identify message boundaries

**Cons**:
- Only works on copy, not in-place replacement
- User doesn't see real data on screen

**Implementation**:
```typescript
document.addEventListener('copy', async (event) => {
  const selection = window.getSelection();
  if (!selection) return;

  const text = selection.toString();
  if (!text) return;

  // Decode it
  const response = await chrome.runtime.sendMessage({
    type: 'DECODE_TEXT',
    payload: { text }
  });

  if (response.success) {
    event.preventDefault();
    event.clipboardData?.setData('text/plain', response.decodedText);
  }
});
```

---

## Recommendation

Start with **automatic decode on copy** because:
1. Much simpler to implement (15 lines of code vs 200+)
2. Works universally across all platforms
3. Less intrusive UX
4. Safer (no DOM mutation risks)

Then, if users request it, add the full click-to-replace feature.

---

## Current Bug: Formatting Loss

**Need to trace**:
1. ✅ Template has `\n` characters when stored
2. ✅ Popup sends with `\n` preserved
3. ✅ Content script receives with `\n` preserved
4. ❓ Content script injects... what happens to `\n`?
5. ❓ ChatGPT's ProseMirror normalizes it?

**Next step**: Run template with all logging enabled and trace exactly where `\n` is lost.
