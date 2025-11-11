# P0 Refactoring: Launch Blockers

**Priority:** 🔥 **P0 - MUST FIX BEFORE LAUNCH**
**Total Effort:** 28-36 hours (3.5-4.5 days)
**Business Impact:** HIGH - Data loss, platform bugs
**Blocking Launch:** YES

---

## Overview

These refactoring tasks are **launch blockers** that must be completed before public release. They pose significant risk of user-facing bugs, data loss, or platform-specific failures.

---

## P0-REFACTOR-001: documentAnalysis.ts (1,072 lines)

**Current State:** God object with multiple responsibilities
**Target State:** 5-6 focused modules
**Effort:** 12-16 hours

### Problems

1. **Too Many Responsibilities:**
   - File upload (drag-drop, click, validation)
   - Queue management (add, remove, process)
   - Storage quota tracking
   - Document list rendering
   - PDF preview modal
   - UI event handlers

2. **Global State:**
   ```typescript
   let uploadQueue: QueuedFile[] = []; // Module-level state
   let isProcessing: boolean = false;
   ```
   - State shared between functions
   - Hard to test
   - Memory leak risk

3. **Complex Event Handling:**
   - 200+ lines of event listeners
   - No clear lifecycle management
   - Potential for duplicate listeners

4. **Business Risk:**
   - Document upload failures
   - Queue corruption (files stuck "processing")
   - Storage quota errors (user can't upload)
   - Hard to debug when issues occur

---

### Refactoring Plan

#### Split Into Modules:

```
src/popup/components/documentAnalysis/
├── documentUpload.ts (200 lines)
│   └── File input, drag-drop, validation, file reading
│
├── documentQueue.ts (150 lines)
│   └── Queue state management, add/remove, processing logic
│
├── documentList.ts (200 lines)
│   └── Document list rendering, delete buttons, empty state
│
├── documentStorage.ts (150 lines)
│   └── Storage quota tracking, warnings, cleanup
│
├── documentPreviewModal.ts (ALREADY EXISTS - 421 lines)
│   └── PDF preview, thumbnail generation, modal UI
│
└── index.ts (150 lines)
    └── Main orchestrator, initializes all sub-modules
```

---

#### New Architecture:

```typescript
// index.ts (Main Orchestrator)
import { DocumentUploadHandler } from './documentUpload';
import { DocumentQueueManager } from './documentQueue';
import { DocumentListRenderer } from './documentList';
import { StorageQuotaManager } from './documentStorage';

export function initDocumentAnalysis() {
  const queueManager = new DocumentQueueManager();
  const uploadHandler = new DocumentUploadHandler(queueManager);
  const listRenderer = new DocumentListRenderer(queueManager);
  const storageManager = new StorageQuotaManager();

  // Wire up events
  queueManager.on('queueChanged', () => {
    listRenderer.render();
    storageManager.updateQuotaDisplay();
  });

  uploadHandler.init();
  listRenderer.init();
  storageManager.init();
}
```

---

#### documentUpload.ts:

```typescript
export class DocumentUploadHandler {
  constructor(private queueManager: DocumentQueueManager) {}

  init() {
    // Setup file input
    // Setup drag-drop
    // Setup validation
  }

  private async handleFileSelect(files: FileList) {
    for (const file of files) {
      if (!this.validateFile(file)) continue;
      await this.queueManager.addToQueue(file);
    }
  }

  private validateFile(file: File): boolean {
    // Check file type (PDF only)
    // Check file size (<10MB)
    // Check quota available
    return true;
  }
}
```

---

#### documentQueue.ts:

```typescript
export class DocumentQueueManager {
  private queue: QueuedFile[] = [];
  private processing: boolean = false;
  private eventEmitter = new EventEmitter();

  async addToQueue(file: File) {
    const queuedFile: QueuedFile = {
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
    };

    this.queue.push(queuedFile);
    this.eventEmitter.emit('queueChanged', this.queue);

    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];
      await this.processItem(item);
      this.queue.shift();
      this.eventEmitter.emit('queueChanged', this.queue);
    }

    this.processing = false;
  }

  on(event: string, handler: Function) {
    this.eventEmitter.on(event, handler);
  }
}
```

---

### Testing Plan

**Unit Tests (4 hours):**
- DocumentUploadHandler validation logic
- DocumentQueueManager queue processing
- StorageQuotaManager calculations

**Integration Tests (2 hours):**
- End-to-end upload flow
- Queue with multiple files
- Storage quota warnings

**Manual QA (2 hours):**
- Drag-drop 5 PDFs simultaneously
- Upload PDF >10MB (should fail gracefully)
- Fill storage quota (should show warning)
- Delete documents while uploading (queue handling)

---

### Rollout Plan

**Phase 1: Extract DocumentQueue (4 hours)**
- Create documentQueue.ts
- Move queue state + logic
- Add EventEmitter for notifications
- Test queue processing

**Phase 2: Extract DocumentUpload (3 hours)**
- Create documentUpload.ts
- Move file input, drag-drop, validation
- Wire up to DocumentQueue
- Test upload flows

**Phase 3: Extract DocumentList (3 hours)**
- Create documentList.ts
- Move rendering logic
- Wire up to DocumentQueue events
- Test UI updates

**Phase 4: Extract StorageQuota (2 hours)**
- Create documentStorage.ts
- Move quota tracking
- Test warnings

**Phase 5: Create Orchestrator (2 hours)**
- Create index.ts
- Initialize all modules
- Test end-to-end

**Phase 6: Testing & Cleanup (4 hours)**
- Run full test suite
- Fix any issues
- Update documentation

**TOTAL: 18 hours (2.5 days)**

---

## P0-REFACTOR-002: content.ts (979 lines)

**Current State:** Platform logic scattered throughout
**Target State:** Platform adapter pattern
**Effort:** 16-20 hours

### Problems

1. **Platform Detection Everywhere:**
   ```typescript
   // Scattered throughout 979 lines
   if (hostname.includes('chatgpt.com')) {
     // ChatGPT-specific logic
   } else if (hostname.includes('claude.ai')) {
     // Claude-specific logic
   } else if (hostname.includes('gemini.google.com')) {
     // Gemini-specific logic
   }
   ```

2. **Tight Coupling:**
   - Template injection mixed with platform detection
   - Toast notifications mixed with API key warnings
   - Hard to add new platforms

3. **Selector Duplication:**
   - Each platform has different selectors
   - Selectors hardcoded in multiple places
   - Changes require searching entire file

4. **Business Risk:**
   - Platform-specific bugs ("Works on ChatGPT, not Claude")
   - New platform requires changes in 10+ places
   - Hard to test individual platforms
   - Support burden: "Extension doesn't work on [platform]"

---

### Refactoring Plan

#### Platform Adapter Pattern:

```
src/content/
├── content.ts (200 lines)
│   └── Main orchestrator, loads correct adapter
│
├── adapters/
│   ├── BasePlatformAdapter.ts (100 lines)
│   │   └── Abstract base class
│   │
│   ├── ChatGPTAdapter.ts (150 lines)
│   │   └── chat.openai.com + chatgpt.com
│   │
│   ├── ClaudeAdapter.ts (100 lines)
│   │   └── claude.ai
│   │
│   ├── GeminiAdapter.ts (100 lines)
│   │   └── gemini.google.com
│   │
│   ├── PerplexityAdapter.ts (80 lines)
│   │   └── perplexity.ai
│   │
│   └── CopilotAdapter.ts (80 lines)
│       └── copilot.microsoft.com
│
├── notifications/
│   ├── toastNotifications.ts (100 lines)
│   └── apiKeyWarnings.ts (50 lines)
│
└── templateInjection.ts (200 lines)
    └── Template insertion logic (platform-agnostic)
```

---

#### BasePlatformAdapter.ts:

```typescript
export abstract class BasePlatformAdapter {
  abstract get platformName(): string;
  abstract get inputSelectors(): string[];
  abstract get buttonSelectors(): string[];

  abstract injectTemplate(template: string): Promise<void>;
  abstract showAPIKeyWarning(): void;

  // Common utilities
  protected findInput(): HTMLElement | null {
    for (const selector of this.inputSelectors) {
      const el = document.querySelector(selector);
      if (el) return el as HTMLElement;
    }
    return null;
  }

  protected insertText(text: string) {
    const input = this.findInput();
    if (!input) return false;

    // Cross-platform text insertion logic
    // ...

    return true;
  }
}
```

---

#### ChatGPTAdapter.ts:

```typescript
export class ChatGPTAdapter extends BasePlatformAdapter {
  get platformName() {
    return 'ChatGPT';
  }

  get inputSelectors() {
    return [
      '#prompt-textarea',
      'textarea[placeholder*="Message"]',
      '[contenteditable="true"][role="textbox"]',
    ];
  }

  get buttonSelectors() {
    return ['button[data-testid="send-button"]'];
  }

  async injectTemplate(template: string): Promise<void> {
    const input = this.findInput();
    if (!input) {
      throw new Error('ChatGPT input not found');
    }

    // ChatGPT-specific insertion (contenteditable)
    if (input.contentEditable === 'true') {
      input.textContent = template;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      this.insertText(template);
    }
  }

  showAPIKeyWarning(): void {
    // ChatGPT-specific warning modal positioning
    // ...
  }
}
```

---

#### ClaudeAdapter.ts:

```typescript
export class ClaudeAdapter extends BasePlatformAdapter {
  get platformName() {
    return 'Claude';
  }

  get inputSelectors() {
    return [
      'div[contenteditable="true"].ProseMirror',
      '[role="textbox"]',
    ];
  }

  get buttonSelectors() {
    return ['button[aria-label="Send Message"]'];
  }

  async injectTemplate(template: string): Promise<void> {
    const input = this.findInput();
    if (!input) {
      throw new Error('Claude input not found');
    }

    // Claude uses ProseMirror editor
    input.textContent = template;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  showAPIKeyWarning(): void {
    // Claude-specific warning modal positioning
    // ...
  }
}
```

---

#### content.ts (Main Orchestrator):

```typescript
import { ChatGPTAdapter } from './adapters/ChatGPTAdapter';
import { ClaudeAdapter } from './adapters/ClaudeAdapter';
import { GeminiAdapter } from './adapters/GeminiAdapter';
// ... other adapters

// Detect platform and load correct adapter
function getAdapter(): BasePlatformAdapter {
  const hostname = window.location.hostname;

  if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    return new ChatGPTAdapter();
  } else if (hostname.includes('claude.ai')) {
    return new ClaudeAdapter();
  } else if (hostname.includes('gemini.google.com')) {
    return new GeminiAdapter();
  } else if (hostname.includes('perplexity.ai')) {
    return new PerplexityAdapter();
  } else if (hostname.includes('copilot.microsoft.com')) {
    return new CopilotAdapter();
  }

  throw new Error('Unsupported platform');
}

// Initialize with correct adapter
const adapter = getAdapter();

// Handle template injection request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INJECT_TEMPLATE') {
    adapter.injectTemplate(message.template)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Async response
  }
});
```

---

### Benefits

**Adding New Platform (e.g., Mistral.ai):**

**Before (Monolithic):**
- Modify 10+ locations in content.ts (979 lines)
- Search for all platform checks
- Risk breaking existing platforms
- 4-6 hours of work

**After (Adapter Pattern):**
1. Create `MistralAdapter.ts` (80 lines)
2. Define selectors
3. Implement template injection
4. Add to getAdapter() switch
5. **TOTAL: 1-2 hours**

---

### Testing Plan

**Unit Tests (4 hours):**
- Each adapter in isolation
- Selector finding logic
- Text insertion methods

**Integration Tests (4 hours):**
- Template injection on all 5 platforms
- API key warnings on all platforms
- Toast notifications

**Manual QA (4 hours):**
- Test on real ChatGPT, Claude, Gemini, Perplexity, Copilot
- Template insertion
- API key detection
- Toast positioning

---

### Rollout Plan

**Phase 1: Create Base Adapter (3 hours)**
- Define BasePlatformAdapter interface
- Implement common utilities
- Write tests

**Phase 2: Extract ChatGPT (3 hours)**
- Create ChatGPTAdapter
- Move selectors
- Test on chatgpt.com

**Phase 3: Extract Claude (2 hours)**
- Create ClaudeAdapter
- Move selectors
- Test on claude.ai

**Phase 4: Extract Gemini/Perplexity/Copilot (4 hours)**
- Create remaining adapters
- Test on all platforms

**Phase 5: Refactor Main content.ts (3 hours)**
- Simplify to orchestrator
- Load correct adapter
- Remove platform-specific code

**Phase 6: Extract Notifications (2 hours)**
- Move toast logic to separate module
- Move API warnings to separate module

**Phase 7: Testing & Cleanup (3 hours)**
- Run full test suite
- Manual QA on all platforms
- Update documentation

**TOTAL: 20 hours (2.5 days)**

---

## Combined P0 Timeline

### Week 1: Fix Both Blockers

**Monday-Tuesday (16 hours):**
- documentAnalysis.ts refactor (Days 1-2)
- Phases 1-5 complete
- Testing started

**Wednesday-Friday (20 hours):**
- content.ts refactor (Days 3-4)
- All adapters created
- Full platform testing

**Weekend:**
- Final integration testing
- Bug fixes
- Documentation

**TOTAL: 36 hours (4.5 days with buffer)**

---

## Success Criteria

### documentAnalysis.ts
- ✅ No file >300 lines
- ✅ Clear separation of concerns
- ✅ No global state
- ✅ All tests passing
- ✅ Upload flow works on all platforms

### content.ts
- ✅ Platform adapters <150 lines each
- ✅ Easy to add new platform (<2 hours)
- ✅ Template injection works on all 5 platforms
- ✅ No platform-specific bugs in testing

---

## Risk Mitigation

### Risk: Refactoring Introduces New Bugs
**Mitigation:**
- Comprehensive test coverage first
- Refactor one module at a time
- Test after each phase
- Keep old code until new code proven

### Risk: Timeline Slips
**Mitigation:**
- Add 20% buffer (36 hours instead of 30)
- Daily progress check-ins
- Prioritize documentAnalysis first (higher risk)

### Risk: Breaks Existing Features
**Mitigation:**
- Run full regression test suite
- Manual QA on all user flows
- Beta test with 10 users before public launch

---

## Sign-Off

**Refactoring Plan Approved By:**

**Engineering Lead:** _________________ Date: _______

**Product Manager:** _________________ Date: _______

**Target Completion Date:** _______

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-11 | v1.0 | Initial P0 refactoring plan | Claude Code |
