# ChatGPT Document Upload Sanitization - Implementation Plan

**Status:** 📋 PLANNING
**Priority:** 🔴 CRITICAL (Killer Feature)
**Target:** Phase 3A Implementation
**Last Updated:** November 7, 2025

---

## Executive Summary

**Goal:** Enable safe document upload to ChatGPT by automatically redacting PII before upload, then restoring it in responses.

**Use Cases:**
- **Lawyers:** Upload 50-page contracts for analysis without breaching client confidentiality
- **Doctors:** Analyze clinical notes without HIPAA violations
- **Accountants:** Process tax returns with AI safely

**Business Impact:** This is THE transformational feature that differentiates us from chat-only protection (marketing analysis).

---

## Current Chat Protection (Already Working)

### What We Have ✅

**Request Interception:**
- File: `src/content/inject.js`
- Intercepts: `POST https://chatgpt.com/backend-api/conversation`
- Substitutes: Real PII → Aliases in chat messages
- Status: ✅ Production ready

**Response Decoding:**
- File: `src/background/serviceWorker.ts`
- Converts: Aliases → Real PII in responses
- Control: `config.settings.decodeResponses` toggle
- Status: ✅ Available (currently disabled by default)

### Request Format (Chat Only)
```json
{
  "action": "next",
  "messages": [
    {
      "role": "user",
      "content": {
        "content_type": "text",
        "parts": ["My email is gregcbarker@gmail.com"]  // ← Substituted
      }
    }
  ],
  "model": "gpt-4",
  // ... other fields
}
```

**Our Current Code:**
- `textProcessor.ts:extractTextFromRequest()` - Extracts `messages[].content.parts[]`
- `textProcessor.ts:replaceTextInRequest()` - Replaces with aliases
- Works perfectly for chat! ✅

---

## What's New: Document Upload

### Discovery Needed 🔍

**Questions to Answer:**
1. What endpoint does ChatGPT use for file uploads?
   - Hypothesis: `POST /backend-api/files` or similar
   - Method: Check Network tab while uploading PDF/DOCX

2. What's the request format?
   - Hypothesis: `multipart/form-data` with file blob
   - Fields: `file`, `purpose`, maybe `conversation_id`

3. How is the file referenced in conversation?
   - Hypothesis: Upload returns `file_id`, then conversation references it
   - Alternative: File content embedded directly in message

4. What file types are supported?
   - Known: PDF, DOCX, TXT, CSV, XLSX (from web search)
   - Limit: ~20MB per file (web interface)

5. Does ChatGPT extract text server-side or client-side?
   - Important: Affects whether we need to parse files ourselves

### Research Plan

**Step 1: Manual Testing (30 minutes)**
1. Open ChatGPT in Chrome
2. Open DevTools → Network tab
3. Upload a test PDF with fake PII
4. Record:
   - Upload endpoint URL
   - Request headers (Content-Type, etc.)
   - Request payload (multipart structure)
   - Response (file_id? upload confirmation?)
5. Send message referencing the file
6. Record:
   - How file is referenced in conversation request
   - Response format with file analysis

**Step 2: Document Findings**
- Create `chatgpt/upload-endpoint-analysis.md`
- Include screenshots of Network tab
- Copy-paste actual request/response JSONs

---

## Implementation Strategies

### Strategy A: Pre-Upload Sanitization (Preferred)

**How It Works:**
```
User uploads document
    ↓
Extension intercepts file upload
    ↓
Parse document (client-side)
    - PDF: Use pdf.js to extract text
    - DOCX: Use mammoth.js to extract text
    - Images: Use Tesseract.js OCR (already spec'd)
    ↓
Detect PII in extracted text
    - Use existing AliasEngine
    - Find: names, emails, SSNs, addresses
    ↓
Show "Document Preview" modal
    - Original text (left column)
    - Redacted text (right column)
    - Highlight PII in yellow
    - User clicks "Approve & Upload"
    ↓
Create sanitized document
    - Replace PII in original file
    - OR: Convert to text-only format
    - OR: Upload text instead of file
    ↓
Upload sanitized version to ChatGPT
```

**Pros:**
- ✅ Maximum security (PII never reaches OpenAI servers)
- ✅ User sees exactly what will be uploaded
- ✅ Works even if ChatGPT changes API

**Cons:**
- ❌ Complex: Need PDF/DOCX parsers
- ❌ Client-side processing (slower for large docs)
- ❌ May lose formatting (if converting to text)

**Libraries Needed:**
```json
{
  "pdf.js": "Parse PDFs",
  "mammoth.js": "Parse DOCX",
  "tesseract.js": "OCR for images" // Already have spec
}
```

---

### Strategy B: Post-Upload Reference Sanitization

**How It Works:**
```
User uploads document (unmodified)
    ↓
ChatGPT uploads to OpenAI servers
    ↓
Returns file_id (e.g., "file-abc123")
    ↓
User references file in chat
    ↓
Extension intercepts conversation request
    - Sees file_id in message
    - Fetches file content from local copy (if we cached it)
    - OR: Shows warning "Can't sanitize uploaded files yet"
    ↓
Block request OR allow with warning
```

**Pros:**
- ✅ Simpler to implement initially
- ✅ No parsing libraries needed
- ✅ Preserves file formatting

**Cons:**
- ❌ ⚠️ **SECURITY ISSUE:** File already uploaded to OpenAI with PII!
- ❌ Not a real solution (just warning, not protection)
- ❌ Defeats the purpose of Prompt Blocker

**Verdict:** ❌ This doesn't actually protect users. Not acceptable.

---

### Strategy C: Hybrid Approach (Recommended)

**How It Works:**
```
User clicks "Upload File"
    ↓
Extension intercepts file input dialog
    ↓
User selects file (we get File object)
    ↓
Extension reads file locally
    - Parse PDF/DOCX/Image to extract text
    - Detect PII using AliasEngine
    ↓
If PII found:
    - Show preview modal with redactions
    - User approves
    - Create sanitized copy
    - Upload sanitized version
    ↓
If NO PII found:
    - Allow original file through
    - Show toast: "✅ No PII detected, file uploaded safely"
```

**Pros:**
- ✅ Secure (PII redacted before upload)
- ✅ User confirmation (shows what will be uploaded)
- ✅ Fast path for non-PII files
- ✅ Best UX

**Cons:**
- ⚠️ Still need parsers
- ⚠️ Client-side processing overhead

**Verdict:** ✅ This is the way. Implement Strategy C.

---

## Technical Implementation Plan

### Phase 1: Research & Discovery (1-2 hours)

**Tasks:**
1. ✅ Manual testing of ChatGPT file upload (record Network traffic)
2. ✅ Document upload endpoint, request format, response format
3. ✅ Understand how files are referenced in conversations
4. ✅ Determine if we need to parse files or ChatGPT provides text

**Deliverable:** `upload-endpoint-analysis.md` with all findings

---

### Phase 2: File Input Interception (4-6 hours)

**Goal:** Catch file uploads BEFORE they reach ChatGPT

**Approach:**
```javascript
// In inject.js or content.ts

// Option 1: Intercept fetch for file upload endpoint
// (Same as current chat interception)

// Option 2: Monitor file input elements
document.addEventListener('change', (e) => {
  if (e.target.tagName === 'INPUT' && e.target.type === 'file') {
    const files = e.target.files;
    // Process each file
    handleFileUpload(files[0]);
  }
}, true);

// Option 3: Intercept FormData creation
const originalFormData = window.FormData;
window.FormData = function() {
  const fd = new originalFormData(...arguments);
  const originalAppend = fd.append;

  fd.append = function(key, value) {
    if (value instanceof File) {
      // Intercept file append!
      console.log('File being uploaded:', value.name);
      // Process file here
    }
    return originalAppend.apply(this, arguments);
  };

  return fd;
};
```

**Deliverable:** File upload detection working (logs to console)

---

### Phase 3: File Parsing & PII Detection (8-10 hours)

**Libraries to Add:**

**PDF Parsing:**
```bash
npm install pdfjs-dist
```

**Usage:**
```typescript
import * as pdfjsLib from 'pdfjs-dist';

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}
```

**DOCX Parsing:**
```bash
npm install mammoth
```

**Usage:**
```typescript
import mammoth from 'mammoth';

async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
```

**Image OCR:**
```typescript
// Already spec'd in feature_image_scanning.md
// Use Tesseract.js (we have detailed docs)
```

**Deliverable:** Text extraction working for PDF, DOCX, images

---

### Phase 4: UI - Document Preview Modal (6-8 hours)

**Design:**
```
┌─────────────────────────────────────────────────────┐
│ 🔒 PII Detected in Document                         │
├─────────────────────────────────────────────────────┤
│ Found 15 PII instances in "contract.pdf"            │
│                                                      │
│ ┌──────────────────┬──────────────────┐            │
│ │ Original         │ Redacted         │            │
│ ├──────────────────┼──────────────────┤            │
│ │ John Doe         │ [ALIAS_NAME_1]   │ ← Yellow   │
│ │ 555-123-4567     │ [ALIAS_PHONE_1]  │   Highlight│
│ │ john@company.com │ [ALIAS_EMAIL_1]  │            │
│ │ ...              │ ...              │            │
│ └──────────────────┴──────────────────┘            │
│                                                      │
│ Detected PII Types:                                 │
│ • 3 Names                                           │
│ • 2 Email Addresses                                 │
│ • 5 Phone Numbers                                   │
│ • 4 Addresses                                       │
│ • 1 SSN                                             │
│                                                      │
│ What would you like to do?                          │
│                                                      │
│ [Cancel Upload]  [Upload Redacted Version]         │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Side-by-side diff view
- Scroll sync (left/right panes scroll together)
- Highlighted PII (yellow background)
- Count of each PII type
- Approve button

**Implementation:**
```typescript
// New file: src/popup/components/documentPreviewModal.ts

export async function showDocumentPreview(
  fileName: string,
  originalText: string,
  redactedText: string,
  piiItems: DetectedPII[]
): Promise<boolean> {
  // Returns true if user approves upload
  // Returns false if user cancels
}
```

**Deliverable:** Preview modal working (tested with dummy data)

---

### Phase 5: Document Sanitization & Upload (4-6 hours)

**Goal:** Create sanitized document and upload it

**Options:**

**Option A: Upload Text Instead of File**
```typescript
// Convert document to text, upload as message
const sanitizedText = await sanitizeDocument(originalText, aliases);

// Instead of file upload, send as chat message:
const message = {
  role: "user",
  content: {
    content_type: "text",
    parts: [`Here's the document content:\n\n${sanitizedText}`]
  }
};
```

**Pros:**
- ✅ Simple
- ✅ No file format issues

**Cons:**
- ❌ Loses formatting
- ❌ Not a real "file upload"

**Option B: Create Sanitized PDF**
```typescript
// Use jsPDF to create new PDF with redacted text
import jsPDF from 'jspdf';

const doc = new jsPDF();
doc.text(sanitizedText, 10, 10);
const pdfBlob = doc.output('blob');

// Upload sanitized PDF
uploadFile(pdfBlob, 'contract_redacted.pdf');
```

**Pros:**
- ✅ Real file upload
- ✅ User experience matches original

**Cons:**
- ⚠️ Additional library (jsPDF)
- ⚠️ Formatting lost (plain text PDF)

**Option C: Modify Original File**
```typescript
// For PDFs: Replace text content while preserving structure
// HARD - requires PDF editing (not just reading)

// For DOCX: Modify XML content
// MEDIUM - mammoth.js can help
```

**Recommendation:** Start with Option A (text upload), iterate to Option B if needed.

**Deliverable:** Sanitized upload working end-to-end

---

### Phase 6: Response Decoding (2-4 hours)

**Goal:** Convert aliases back to real PII in ChatGPT responses

**Already Built:** ✅
- `serviceWorker.ts` has response decoding
- Just needs `decodeResponses = true`

**Enhancement for Documents:**
- Detect when response references document
- Ensure alias→real substitution works correctly
- May need to track file_id → original_text mapping

**Deliverable:** Response decoding working for document analysis

---

## File Type Support Matrix

| File Type | Parse Library | Priority | Complexity | Est. Time |
|-----------|--------------|----------|------------|-----------|
| **PDF** | pdf.js | 🔴 HIGH | Medium | 4-6 hours |
| **DOCX** | mammoth.js | 🔴 HIGH | Low | 2-3 hours |
| **TXT** | Native | 🔴 HIGH | Trivial | 30 min |
| **Images (PNG/JPG)** | Tesseract.js | 🟡 MEDIUM | Medium | Already spec'd |
| **CSV** | PapaParse | 🟢 LOW | Low | 1-2 hours |
| **XLSX** | xlsx.js | 🟢 LOW | Medium | 3-4 hours |

**MVP (Phase 1):** PDF, DOCX, TXT
**Phase 2:** Images (using existing OCR spec)
**Phase 3:** CSV, XLSX

---

## Testing Plan

### Unit Tests

**Document Parsing:**
```typescript
describe('PDF Parser', () => {
  it('should extract text from simple PDF', async () => {
    const file = loadTestFile('test-simple.pdf');
    const text = await extractTextFromPDF(file);
    expect(text).toContain('Hello World');
  });

  it('should extract text from multi-page PDF', async () => {
    const file = loadTestFile('test-multipage.pdf');
    const text = await extractTextFromPDF(file);
    expect(text.split('\n').length).toBeGreaterThan(1);
  });
});
```

**PII Detection:**
```typescript
describe('Document PII Detection', () => {
  it('should detect email in PDF', async () => {
    const text = await extractTextFromPDF(testPDF);
    const pii = detectPII(text);
    expect(pii.emails).toContain('john@example.com');
  });

  it('should detect multiple PII types', async () => {
    const text = 'John Doe, john@example.com, 555-123-4567';
    const pii = detectPII(text);
    expect(pii.names).toContain('John Doe');
    expect(pii.emails).toContain('john@example.com');
    expect(pii.phones).toContain('555-123-4567');
  });
});
```

### Integration Tests

**End-to-End:**
1. Upload test PDF with known PII
2. Verify preview modal appears
3. Verify PII highlighted correctly
4. Approve upload
5. Verify sanitized version uploaded
6. Verify ChatGPT response received
7. Verify aliases converted back to real PII

**Test Files Needed:**
- `test-contract.pdf` (legal contract with client names)
- `test-medical.pdf` (clinical notes with patient info)
- `test-tax-return.pdf` (tax return with SSN, address)

---

## Security Considerations

### What We Protect ✅

1. **Pre-Upload Redaction:** PII removed BEFORE file reaches OpenAI
2. **User Confirmation:** Preview modal shows exactly what will be uploaded
3. **Local Processing:** All parsing happens client-side (nothing sent to servers)
4. **Encrypted Storage:** Original documents not stored (only processed in memory)

### What We DON'T Protect ⚠️

1. **Non-Text PII:** Images embedded in PDFs (OCR helps but not perfect)
2. **Handwriting:** Scanned documents with handwritten PII
3. **Steganography:** Hidden data in images
4. **Metadata:** Document properties (author name, company name in metadata)

**Mitigation:**
- Show warning: "Only text-based PII is redacted. Images and metadata may contain PII."
- Future: Add metadata stripping
- Future: Better OCR for embedded images

---

## Performance Considerations

### Client-Side Processing Overhead

**Estimated Processing Times:**
| Document Size | Processing Time |
|---------------|----------------|
| 1-page PDF | ~500ms |
| 10-page PDF | ~2-3 seconds |
| 50-page PDF | ~10-15 seconds |
| 100-page PDF | ~30-45 seconds |

**UI Strategy:**
- Show progress indicator
- "Scanning page 5 of 50..."
- Allow cancellation
- Timeout after 60 seconds (suggest splitting document)

### Bundle Size Impact

**Additional Libraries:**
```
pdf.js: ~500KB (WASM + worker)
mammoth.js: ~150KB
tesseract.js: ~3MB (already spec'd for images)
jsPDF (optional): ~200KB

Total: ~850KB (without Tesseract)
Total with OCR: ~3.8MB
```

**Mitigation:**
- Lazy load parsers (only download when file upload attempted)
- Code splitting (separate bundle for document features)

---

## Open Questions

1. **Does ChatGPT return file content in responses?**
   - If yes: Easy to decode
   - If no: Need to map file_id → original content

2. **Can we intercept file upload before it's sent?**
   - Or do we need to block the request entirely and re-upload?

3. **What happens to file formatting?**
   - If we upload text instead of PDF, does ChatGPT understand context?

4. **How to handle large documents?**
   - 100+ page PDFs take 30+ seconds to process
   - Timeout? Progress bar? Split into chunks?

5. **What about file metadata?**
   - PDF author, company name, creation date
   - Do we need to strip metadata?

**Answer These During Phase 1 Research**

---

## Success Metrics

### Adoption
- % of users who upload documents (Target: 30%+ within 30 days)
- Avg documents per active user (Target: 5+/month)

### Effectiveness
- PII detection rate (Target: 95%+ of PII found)
- False positive rate (Target: <10%)
- User approval rate (Target: >80% approve after preview)

### Performance
- Processing time (Target: <5 seconds for avg document)
- User complaints about slowness (Target: <5%)
- Upload success rate (Target: >95%)

---

## Next Steps

**Immediate (This Week):**
1. ✅ Create this planning document
2. 🔍 Phase 1: Research upload endpoint (manual testing - 1-2 hours)
3. 📝 Document findings in `upload-endpoint-analysis.md`

**Short-Term (Next 2 Weeks):**
4. Build file interception (Phase 2 - 4-6 hours)
5. Implement PDF/DOCX parsing (Phase 3 - 8-10 hours)
6. Build preview modal UI (Phase 4 - 6-8 hours)

**Medium-Term (Sprint):**
7. End-to-end implementation (Phase 5-6 - 6-10 hours)
8. Testing & iteration (2-3 days)
9. Launch as PRO feature

---

## References

- **Marketing Analysis:** `docs/current/MARKET_ANALYSIS.md` - "Document upload is transformational"
- **Image Scanning Spec:** `docs/features/feature_image_scanning.md` - OCR with Tesseract.js
- **Current Chat Protection:** `src/lib/textProcessor.ts` - Working PII substitution
- **Platform Support:** `docs/platforms/_general/platform-support-audit.md` - ChatGPT confirmed working

---

**Status:** 📋 PLANNING COMPLETE - Ready for Phase 1 Research
**Next Action:** Manual testing of ChatGPT file upload mechanism
**Owner:** TBD
**Target Start Date:** Week of November 11, 2025
