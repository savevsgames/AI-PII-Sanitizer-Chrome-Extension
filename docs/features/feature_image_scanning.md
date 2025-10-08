# Feature Spec: Image PII Scanner (Optional Toggle)

## Overview

**Problem:** Users upload screenshots/images containing PII (emails, names, SSNs, API keys) to ChatGPT/Claude without realizing it.

**Solution:** Optional browser-based OCR that scans images locally before upload, warns if PII detected.

**Key Feature:** Toggle ON/OFF in settings - user controls performance vs security trade-off.

---

## User Stories

1. **As a developer**, I want to scan code screenshots for API keys before uploading to ChatGPT, so I don't accidentally leak credentials.

2. **As a casual user**, I want image scanning disabled by default, so my uploads are instant without delays.

3. **As a privacy-conscious user**, I want to enable image scanning before uploading work documents, so I can review detected PII before sending.

4. **As a user**, I want to see what PII was found in the image, so I can decide to proceed or cancel the upload.

---

## UX Design

### Settings Tab - New Section

```
┌─────────────────────────────────────────────┐
│ 🖼️ Image Scanning (Beta)                    │
├─────────────────────────────────────────────┤
│ Scan images for text-based PII before      │
│ uploading to AI services                    │
│                                             │
│ [x] Enable image PII scanning               │
│                                             │
│ ⚠️ When enabled:                            │
│ • Adds 2-5 second delay per image           │
│ • Scans for emails, names, SSNs, API keys  │
│ • Shows warning if PII detected             │
│ • All processing happens locally            │
│                                             │
│ Recommended for:                            │
│ • Uploading screenshots                     │
│ • Documents with sensitive info             │
│ • Code snippets with API keys               │
│                                             │
│ Not needed for:                             │
│ • Personal photos                           │
│ • Memes/GIFs                                │
│ • Non-sensitive diagrams                    │
└─────────────────────────────────────────────┘
```

### Warning Dialog (When PII Found)

```
┌──────────────────────────────────────────────┐
│ ⚠️  PII Detected in Image!                   │
├──────────────────────────────────────────────┤
│ Found 3 pieces of PII in this image:         │
│                                              │
│ [IMAGE PREVIEW with red boxes around PII]   │
│                                              │
│ Detected:                                    │
│ • Email: greg@example.com                    │
│ • Phone: (555) 123-4567                      │
│ • Name: Greg Barker                          │
│                                              │
│ What would you like to do?                   │
│                                              │
│ ( ) Cancel upload (recommended)              │
│ (•) Proceed anyway (send to AI)              │
│ ( ) Edit image first                         │
│                                              │
│ [x] Don't show this warning again for this   │
│     session                                  │
│                                              │
│          [Cancel]  [Proceed Anyway]          │
└──────────────────────────────────────────────┘
```

### Minimal Mode - Indicator

When scanning is active:
```
┌────────────────────────┐
│ 🛡️ 5 protected         │
│ 🔍 Scanning image...   │
└────────────────────────┘
```

---

## Technical Implementation

### 1. Add Tesseract.js

**Install:**
```bash
npm install tesseract.js
```

**Size impact:** ~3MB (acceptable for optional feature)

### 2. Update Types

**src/lib/types.ts:**
```typescript
export interface UserConfig {
  // ... existing fields

  imageScanning?: {
    enabled: boolean;
    warnThreshold: number;  // Min number of PII items to warn (default: 1)
    autoBlock: boolean;     // Auto-block uploads (vs warn) (PRO feature)
    scanTimeout: number;    // Max seconds to wait (default: 10)
    skipFileTypes: string[]; // Don't scan these (e.g., ['gif', 'png'] for memes)
  };
}

export interface ImageScanResult {
  success: boolean;
  piiFound: DetectedPII[];
  text: string;  // Raw OCR text
  scanTimeMs: number;
}

export interface DetectedPII {
  type: PIIType;
  value: string;  // The actual PII found
  confidence: number;  // OCR confidence (0-1)
  position?: { x: number; y: number; width: number; height: number };
}
```

### 3. Create OCR Module

**src/lib/imageScanner.ts:**
```typescript
import Tesseract from 'tesseract.js';
import { PIIDetector } from './piiDetector'; // Reuse from API key vault

export class ImageScanner {
  private worker: Tesseract.Worker | null = null;

  async initialize() {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => console.log('[OCR]', m),
      });
    }
  }

  async scanImage(imageBlob: Blob): Promise<ImageScanResult> {
    const startTime = Date.now();

    try {
      await this.initialize();

      // Convert blob to image
      const imageUrl = URL.createObjectURL(imageBlob);

      // Run OCR
      const { data } = await this.worker!.recognize(imageUrl);
      const text = data.text;

      URL.revokeObjectURL(imageUrl);

      // Detect PII in extracted text
      const piiFound: DetectedPII[] = [];

      // Check for emails
      const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
      if (emails) {
        emails.forEach(email => {
          piiFound.push({
            type: 'email',
            value: email,
            confidence: 0.9, // High confidence for email regex
          });
        });
      }

      // Check for phone numbers
      const phones = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g);
      if (phones) {
        phones.forEach(phone => {
          piiFound.push({
            type: 'phone',
            value: phone,
            confidence: 0.8,
          });
        });
      }

      // Check for SSN
      const ssns = text.match(/\b\d{3}-\d{2}-\d{4}\b/g);
      if (ssns) {
        ssns.forEach(ssn => {
          piiFound.push({
            type: 'ssn',
            value: ssn,
            confidence: 0.95,
          });
        });
      }

      // Check for API keys (reuse from API key vault)
      const apiKeys = PIIDetector.detectAPIKeys(text);
      if (apiKeys.length > 0) {
        apiKeys.forEach(key => {
          piiFound.push({
            type: 'apiKey',
            value: key.value,
            confidence: 0.9,
          });
        });
      }

      // Check for names (basic heuristic)
      const words = data.words || [];
      const potentialNames = words.filter(w =>
        w.text.length > 2 &&
        /^[A-Z][a-z]+$/.test(w.text) &&
        w.confidence > 80
      );

      // Group consecutive capitalized words (likely names)
      for (let i = 0; i < potentialNames.length - 1; i++) {
        const current = potentialNames[i];
        const next = potentialNames[i + 1];

        if (next && Math.abs(current.bbox.x1 - next.bbox.x0) < 20) {
          const fullName = `${current.text} ${next.text}`;
          piiFound.push({
            type: 'name',
            value: fullName,
            confidence: Math.min(current.confidence, next.confidence) / 100,
            position: {
              x: current.bbox.x0,
              y: current.bbox.y0,
              width: next.bbox.x1 - current.bbox.x0,
              height: current.bbox.y1 - current.bbox.y0,
            },
          });
          i++; // Skip next word
        }
      }

      return {
        success: true,
        piiFound,
        text,
        scanTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('[ImageScanner] Error:', error);
      return {
        success: false,
        piiFound: [],
        text: '',
        scanTimeMs: Date.now() - startTime,
      };
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
```

### 4. Intercept Image Uploads

**src/content/inject.js:**
```javascript
// Intercept file inputs and drag-drop uploads
(function() {
  console.log('🛡️ AI PII Sanitizer: Image scanner loading...');

  // Monitor file input changes
  document.addEventListener('change', async (event) => {
    const target = event.target;

    if (target.tagName === 'INPUT' && target.type === 'file') {
      const files = Array.from(target.files || []);

      for (const file of files) {
        if (file.type.startsWith('image/')) {
          await handleImageUpload(file, target);
        }
      }
    }
  }, true);

  // Monitor drag-drop uploads
  document.addEventListener('drop', async (event) => {
    const files = Array.from(event.dataTransfer?.files || []);

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        // Prevent default upload temporarily
        event.preventDefault();
        event.stopPropagation();

        const shouldProceed = await handleImageUpload(file, event.target);
        if (!shouldProceed) {
          return; // Block upload
        }
      }
    }
  }, true);

  async function handleImageUpload(file, targetElement) {
    console.log('🖼️ Image upload detected:', file.name);

    // Check if image scanning is enabled
    const config = await getConfig();
    if (!config?.imageScanning?.enabled) {
      console.log('⏭️ Image scanning disabled, allowing upload');
      return true;
    }

    // Show scanning indicator
    showScanningIndicator(file.name);

    // Send to background script for OCR
    const scanResult = await new Promise((resolve) => {
      const messageId = Math.random().toString(36);

      const handleResponse = (event) => {
        if (event.data?.source === 'ai-pii-content' &&
            event.data?.messageId === messageId) {
          window.removeEventListener('message', handleResponse);
          resolve(event.data.response);
        }
      };

      window.addEventListener('message', handleResponse);

      window.postMessage({
        source: 'ai-pii-inject',
        messageId: messageId,
        type: 'SCAN_IMAGE',
        payload: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          imageBlob: file, // Send file blob
        }
      }, '*');
    });

    hideScanningIndicator();

    // If PII found, show warning
    if (scanResult.success && scanResult.piiFound.length > 0) {
      const shouldProceed = await showPIIWarningDialog(file, scanResult);
      return shouldProceed;
    }

    console.log('✅ No PII found in image, allowing upload');
    return true;
  }

  function showScanningIndicator(fileName) {
    // Show small toast notification
    const toast = document.createElement('div');
    toast.id = 'pii-scanner-toast';
    toast.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: sans-serif;
        font-size: 14px;
      ">
        🔍 Scanning ${fileName}...
      </div>
    `;
    document.body.appendChild(toast);
  }

  function hideScanningIndicator() {
    const toast = document.getElementById('pii-scanner-toast');
    if (toast) toast.remove();
  }

  async function showPIIWarningDialog(file, scanResult) {
    return new Promise((resolve) => {
      // Create modal dialog
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          font-family: sans-serif;
        ">
          <div style="
            background: white;
            padding: 24px;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          ">
            <h2 style="margin: 0 0 16px 0; color: #e74c3c;">
              ⚠️ PII Detected in Image!
            </h2>

            <p style="margin: 0 0 16px 0; color: #555;">
              Found <strong>${scanResult.piiFound.length}</strong> pieces of PII in this image:
            </p>

            <div style="
              background: #f5f5f5;
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 16px;
              max-height: 200px;
              overflow-y: auto;
            ">
              ${scanResult.piiFound.map(pii => `
                <div style="margin-bottom: 8px;">
                  <strong>${pii.type}:</strong> ${maskPII(pii.value)}
                </div>
              `).join('')}
            </div>

            <p style="margin: 0 0 16px 0; color: #555; font-size: 14px;">
              Scan time: ${scanResult.scanTimeMs}ms | OCR extracted ${scanResult.text.length} characters
            </p>

            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button id="pii-cancel" style="
                padding: 10px 20px;
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
              ">
                Cancel Upload
              </button>
              <button id="pii-proceed" style="
                padding: 10px 20px;
                background: #95a5a6;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
              ">
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('pii-cancel').onclick = () => {
        modal.remove();
        resolve(false); // Block upload
      };

      document.getElementById('pii-proceed').onclick = () => {
        modal.remove();
        resolve(true); // Allow upload
      };
    });
  }

  function maskPII(value) {
    // Show first 3 and last 3 chars
    if (value.length <= 6) return '***';
    return value.substring(0, 3) + '***' + value.substring(value.length - 3);
  }

  async function getConfig() {
    // Request config from background script
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
        resolve(response?.data || null);
      });
    });
  }

  console.log('🛡️ AI PII Sanitizer: Image scanner ready');
})();
```

### 5. Background Script Handler

**src/background/serviceWorker.ts:**
```typescript
import { ImageScanner } from '../lib/imageScanner';

// Add to message handler
case 'SCAN_IMAGE':
  return handleScanImage(message.payload);

async function handleScanImage(payload: {
  fileName: string;
  fileType: string;
  fileSize: number;
  imageBlob: Blob;
}): Promise<any> {
  try {
    const scanner = new ImageScanner();
    const result = await scanner.scanImage(payload.imageBlob);
    await scanner.terminate();

    console.log(`🔍 Image scan complete: ${result.piiFound.length} PII found in ${result.scanTimeMs}ms`);

    // Log activity
    if (result.piiFound.length > 0) {
      logActivity({
        type: 'warning',
        service: 'unknown',
        details: {
          url: 'Image Upload',
          piiTypesFound: result.piiFound.map(p => p.type),
          substitutionCount: result.piiFound.length,
        },
        message: `Image scan: ${result.piiFound.length} PII items detected`,
      });
    }

    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    console.error('❌ Image scan error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### 6. Settings UI

**src/popup/popup-v2.html:**
```html
<!-- Add to Settings tab -->
<div class="settings-section">
  <h3>🖼️ Image Scanning (Beta)</h3>
  <div class="setting-item">
    <label class="toggle-label">
      <input type="checkbox" id="imageScanningToggle">
      <span class="toggle-slider"></span>
      <span class="setting-label-text">Scan images for PII before upload</span>
    </label>
    <p class="setting-hint">
      Adds 2-5 second delay. Scans for emails, names, SSNs, API keys.
      All processing happens locally.
    </p>
  </div>
</div>
```

**src/popup/popup-v2.ts:**
```typescript
// Load image scanning setting
const imageScanningToggle = document.getElementById('imageScanningToggle') as HTMLInputElement;
if (imageScanningToggle) {
  imageScanningToggle.checked = config.imageScanning?.enabled || false;

  imageScanningToggle.addEventListener('change', async () => {
    await store.updateConfig({
      imageScanning: {
        enabled: imageScanningToggle.checked,
        warnThreshold: 1,
        autoBlock: false,
        scanTimeout: 10,
        skipFileTypes: [],
      },
    });
    console.log('[Popup V2] Image scanning:', imageScanningToggle.checked);
  });
}
```

---

## Implementation Phases

### Phase 1: Basic Toggle + Warning (MVP) - 1 week
- ✅ Add settings toggle
- ✅ Integrate Tesseract.js
- ✅ Basic PII detection (email, phone, SSN)
- ✅ Simple warning dialog
- ✅ Block/proceed choice

**Deliverable:** Users can enable image scanning, get warned if PII found, choose to proceed or cancel.

### Phase 2: Enhanced Detection - 1 week
- ✅ API key detection (reuse from API key vault)
- ✅ Name detection (capitalized words heuristic)
- ✅ Better regex patterns
- ✅ Confidence scoring
- ✅ Visual preview with PII highlighted

**Deliverable:** More accurate PII detection, better UX with highlighted regions.

### Phase 3: Advanced Features (PRO) - 2 weeks
- 💎 Auto-block mode (no dialog, just block)
- 💎 Skip file types (e.g., don't scan GIFs)
- 💎 Scan timeout configuration
- 💎 Stats tracking (images scanned, PII blocked)
- 💎 Export scan history

**Deliverable:** Power users get fine-grained control.

### Phase 4: Image Editing (Enterprise) - 3 weeks
- 🏢 In-browser image editor
- 🏢 Auto-blur detected PII regions
- 🏢 Manual redaction tools
- 🏢 Save edited version
- 🏢 Upload edited image instead

**Deliverable:** Full image sanitization workflow.

---

## Marketing Messaging

### Free Tier
**Feature:** Screenshot detection warnings
**Message:** "⚠️ Warns when uploading screenshots that may contain PII"

### PRO Tier ($4.99/mo)
**Feature:** Full OCR image scanning
**Message:**
- "🔍 Scans images for text-based PII before upload"
- "🚫 Blocks uploads containing emails, SSNs, API keys"
- "📊 Shows detected PII with confidence scores"
**CTA:** "Protect Your Screenshots - Get PRO"

### Enterprise Tier
**Feature:** Auto-redaction + editing
**Message:**
- "✂️ Automatically blur PII in images"
- "🎨 Edit images before upload"
- "📋 Audit log of blocked uploads"

---

## Performance Considerations

**Bundle size:**
- Tesseract.js: ~3MB (WASM + worker)
- Impact: Increases extension from ~2MB to ~5MB
- Solution: Lazy load - only download when user enables image scanning

**Scan speed:**
- Small screenshot (800x600): ~2 seconds
- Large screenshot (1920x1080): ~5 seconds
- Document scan (full page): ~10 seconds

**Optimization:**
- Use Tesseract.js web worker (non-blocking)
- Show progress indicator
- Cache worker (don't reload per image)
- Allow timeout cancellation

---

## Privacy & Security

**All processing is local:**
- ✅ Images never leave user's device
- ✅ No server uploads
- ✅ No external API calls
- ✅ OCR runs in browser WASM

**What we DON'T store:**
- ❌ Image contents
- ❌ OCR text
- ❌ Detected PII values

**What we DO store:**
- ✅ Image scan count (stat)
- ✅ PII block count (stat)
- ✅ Activity log (service, count, timestamp only)

---

## Testing Checklist

- [ ] Settings toggle works (enable/disable)
- [ ] Tesseract.js loads on first scan
- [ ] Screenshot with email detected correctly
- [ ] Screenshot with phone number detected
- [ ] Screenshot with API key detected
- [ ] Warning dialog appears with correct PII list
- [ ] "Cancel" blocks upload
- [ ] "Proceed" allows upload
- [ ] Stats increment correctly
- [ ] Works on ChatGPT file upload
- [ ] Works on Claude file upload
- [ ] Works on drag-drop upload
- [ ] No performance impact when disabled
- [ ] Memory cleanup (worker terminated)

---

## Open Questions

1. **Should we scan clipboard images?**
   - User pastes screenshot from clipboard
   - Pro: Catches another leak vector
   - Con: Adds latency to paste operation

2. **What about non-English text?**
   - Need to load additional language packs?
   - Or just support English for v1?

3. **How to handle false positives?**
   - "John Smith" detected as name but it's example text
   - Allow user to whitelist certain patterns?

4. **Should we offer "Edit Image" option?**
   - Open basic image editor in popup
   - Let user blur PII manually
   - Upload edited version

---

## Success Metrics

**Adoption:**
- % of users who enable image scanning
- Target: 20% of PRO users

**Effectiveness:**
- Images scanned per week
- PII detected per image (average)
- Uploads blocked vs proceeded
- Target: Block 30% of scanned images

**Performance:**
- Average scan time
- User complaints about slowness
- Target: <5 seconds per image, <5% complaints

---

## Next Steps

1. **Validate with users** - Survey: "Would you use optional image scanning?"
2. **Build Phase 1 MVP** - Basic toggle + Tesseract.js integration
3. **Beta test with 10 users** - Get feedback on UX and performance
4. **Iterate based on feedback**
5. **Launch as PRO feature** ($4.99/mo)

Want to build this? I can start with Phase 1 (basic toggle + OCR) right now!
