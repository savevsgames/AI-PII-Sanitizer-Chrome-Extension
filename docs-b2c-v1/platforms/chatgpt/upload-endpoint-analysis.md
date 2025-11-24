# ChatGPT File Upload Endpoint Analysis

**Date:** November 7, 2025
**Method:** Manual Network Analysis
**Test File:** BettersonBrands.png (1.8MB image)
**Status:** ✅ COMPLETE

---

## Executive Summary

ChatGPT uses a **3-step upload process** with **Azure Blob Storage** as the backend:
1. Request signed upload URL from ChatGPT backend
2. Upload file directly to Azure Blob Storage (PUT)
3. Monitor processing status via Server-Sent Events
4. Reference file in conversation by `file_id`

**Key Discovery:** Files are NOT uploaded to ChatGPT servers directly - they go to Microsoft Azure storage with signed URLs.

---

## Upload Flow (Complete)

### Step 1: Request Upload URL

**Endpoint:**
```
POST https://chatgpt.com/backend-api/files
```

**Request Body:**
```json
{
  "file_name": "BettersonBrands.png",
  "file_size": 1130362,
  "use_case": "multimodal",
  "timezone_offset_min": 420
}
```

**Response:**
```json
{
  "status": "success",
  "download_url": "https://chatgpt.com/backend-api/estuary/content?id=file_00000000142872305d4f0105872b4749&sc=48960d&p=f1dc1d-1&ig=d2cj",
  "file_name": null,
  "creation_time": null,
  "file_size_bytes": null,
  "mime_type": null,
  "upload_url": "https://sdmntprwestus.oaiusercontent.com/files/00000000-2554-7230-b9ed-e110f49fccb5/raw?se=2025-11-08T02:37:15Z&sp=w&sv=2024-08-04&sr=b&sig=[signature]"
}
```

**Key Fields:**
- `file_id`: Unique identifier for the file
- `upload_url`: Signed Azure Blob Storage URL (valid for ~1 hour)
- `download_url`: ChatGPT backend URL to retrieve file later

---

### Step 2: Upload File to Azure Blob Storage

**Endpoint:**
```
PUT https://sdmntprwestus.oaiusercontent.com/files/00000000-2554-7230-b9ed-e110f49fccb5/raw?[signed_url_params]
```

**Request Headers:**
```http
PUT /files/00000000-2554-7230-b9ed-e110f49fccb5/raw?se=2025-11-08T02:37:15Z&sp=w&sv=2024-08-04&sr=b&sig=[signature]
Host: sdmntprwestus.oaiusercontent.com
Content-Type: image/png
Content-Length: 1814963
Origin: https://chatgpt.com
x-ms-blob-type: BlockBlob
x-ms-version: 2020-04-08
```

**Signed URL Parameters:**
```
se: Expiry time (2025-11-08T02:37:15Z)
sp: Permission (w = write)
sv: Storage version (2024-08-04)
sr: Resource (b = blob)
scid: Service container ID (bb96e094-3352-4368-aa30-a048dd122a56)
skoid: Storage Key Object ID
sktid: Storage Key Tenant ID
skt: Signed Key Time
ske: Signed Key Expiry
sks: b (?)
skv: Storage Key Version
sig: Signature (authentication hash)
```

**Request Body:**
```
[Binary file data - 1,814,963 bytes]
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Length: 0
ETag: "0x8DE1E6F087AAAF5"
Last-Modified: Sat, 08 Nov 2025 02:32:16 GMT
x-ms-request-id: 8f024ed3-101e-007a-3e57-50b370000000
x-ms-request-server-encrypted: true
x-ms-version: 2020-04-08
```

---

### Step 3: Monitor Processing Status

**Endpoint:**
```
EventStream: /backend-api/files/process_upload_stream
```

**Server-Sent Events (SSE):**
```json
{
  "file_id": "file_00000000142872305d4f0105872b4749",
  "event": "file.processing.started",
  "message": "Start processing file: file_00000000142872305d4f0105872b4749",
  "progress": 0.0,
  "extra": null
}

{
  "file_id": "file_00000000142872305d4f0105872b4749",
  "event": "file.processing.file_ready",
  "message": "File file_00000000142872305d4f0105872b4749 is ready to download",
  "progress": 100.0,
  "extra": null
}

{
  "file_id": "file_00000000142872305d4f0105872b4749",
  "event": "file.processing.completed",
  "message": "Succeeded processing file file_00000000142872305d4f0105872b4749",
  "progress": 100.0,
  "extra": null
}
```

---

### Step 4: Reference File in Conversation

**Endpoint:**
```
POST https://chatgpt.com/backend-api/conversation
```

**Request Body (Inferred):**
```json
{
  "action": "next",
  "messages": [
    {
      "role": "user",
      "content": {
        "content_type": "multimodal_text",
        "parts": [
          {
            "asset_pointer": "file_00000000142872305d4f0105872b4749",
            "size_bytes": 1130362,
            "width": 1000,
            "height": 1000
          },
          "what is good / bad about this design?"
        ]
      }
    }
  ],
  "model": "gpt-4",
  "conversation_id": "...",
  "parent_message_id": "..."
}
```

---

## Azure Blob Storage Details

### Service Provider
- **Provider:** Microsoft Azure Blob Storage
- **Domain:** `oaiusercontent.com` (OpenAI User Content)
- **Region:** West US (`sdmntprwestus`)
- **Protocol:** HTTPS with signed URLs (SAS tokens)

### Storage API Version
- **x-ms-version:** `2020-04-08`
- **Blob Type:** BlockBlob
- **Server Encryption:** Enabled (`x-ms-request-server-encrypted: true`)

### Security
- **Authentication:** Signed URLs with time-based expiration
- **Expiry:** ~1 hour from issuance
- **CORS:** `access-control-allow-origin: *`
- **HTTPS Only:** Strict Transport Security enabled

---

## File Types Observed

### Images
- **PNG:** ✅ Confirmed working (BettersonBrands.png)
- **JPG:** Likely supported
- **GIF:** Likely supported

### Documents
- **PDF:** ✅ Supported (per web search)
- **DOCX:** ✅ Supported (per web search)
- **TXT:** ✅ Supported
- **CSV:** ✅ Supported
- **XLSX:** ✅ Supported

### Size Limits
- **Web Interface:** ~20MB per file (per web search)
- **Test File:** 1.8MB uploaded successfully

---

## Interception Points for PII Protection

### Option 1: Intercept Initial Metadata Request ⭐ RECOMMENDED
```javascript
// intercept POST to /backend-api/files

if (url.includes('/backend-api/files') && method === 'POST') {
  const metadata = JSON.parse(requestBody);

  // We have: file_name, file_size, use_case
  // But NOT the actual file yet!

  // Problem: Need to get the File object somehow
  // Solution: Also monitor file input element
}
```

**Pros:**
- Early interception (before Azure upload)
- Can block entire flow if needed

**Cons:**
- Don't have access to File object at this point
- Need to coordinate with file input monitoring

---

### Option 2: Monitor File Input Element ⭐ RECOMMENDED
```javascript
// Monitor file input changes BEFORE ChatGPT's upload flow

document.addEventListener('change', (event) => {
  if (event.target.tagName === 'INPUT' && event.target.type === 'file') {
    const file = event.target.files[0];

    // We have the File object!
    // Parse it, detect PII, show preview modal

    if (userApprovesUpload) {
      // Create sanitized version
      // Store it for later
      // Let ChatGPT's upload flow proceed
    } else {
      // Clear the file input
      event.target.value = '';
      event.preventDefault();
    }
  }
}, true);
```

**Pros:**
- Have access to actual File object
- Can process before any network requests
- Can block upload at source

**Cons:**
- Need to coordinate with Step 3 (Azure upload)

---

### Option 3: Intercept Azure Blob Upload
```javascript
// Intercept PUT to oaiusercontent.com

if (url.includes('oaiusercontent.com/files') && method === 'PUT') {
  // File is about to be uploaded to Azure

  // Replace request body with sanitized file
  const sanitizedBlob = getSanitizedFile(originalFile);

  // Continue upload with sanitized content
}
```

**Pros:**
- Can replace file content right before upload

**Cons:**
- File metadata already sent to ChatGPT backend
- Filename contains original name (minor privacy leak)
- Need to ensure file size matches (or update metadata)

---

### Recommended Approach: **Hybrid (Option 1 + 2 + 3)**

```javascript
// Step 1: Monitor file input (get File object early)
let selectedFile = null;
let sanitizedFile = null;

document.addEventListener('change', async (event) => {
  if (event.target.type === 'file') {
    selectedFile = event.target.files[0];

    // Parse and analyze
    const piiDetected = await analyzFile(selectedFile);

    if (piiDetected.length > 0) {
      // Show preview modal
      const approved = await showPreviewModal(piiDetected);

      if (approved) {
        // Create sanitized version
        sanitizedFile = await createSanitizedFile(selectedFile);
      } else {
        // Block upload
        event.target.value = '';
        event.preventDefault();
        return;
      }
    }
  }
});

// Step 2: Intercept metadata request (safety check)
// (In fetch interceptor)
if (url.includes('/backend-api/files') && method === 'POST') {
  if (!sanitizedFile && selectedFile) {
    // PII detected but user didn't approve sanitized upload
    // Block the request
    return new Response(JSON.stringify({error: "Upload blocked"}), {status: 403});
  }
}

// Step 3: Intercept Azure upload (replace file content)
if (url.includes('oaiusercontent.com/files') && method === 'PUT') {
  if (sanitizedFile) {
    // Replace body with sanitized file
    const newBody = await sanitizedFile.arrayBuffer();

    // Create new request with sanitized content
    return fetch(url, {
      ...options,
      body: newBody,
      headers: {
        ...headers,
        'Content-Length': sanitizedFile.size
      }
    });
  }
}
```

---

## Technical Challenges & Solutions

### Challenge 1: File Object Access
**Problem:** Intercepting `/backend-api/files` doesn't give us the File object
**Solution:** Monitor file input element changes to capture File object early

### Challenge 2: Azure Signed URLs
**Problem:** Can't generate our own signed URLs for Azure
**Solution:** Use the same URL ChatGPT provides, just replace file content

### Challenge 3: File Size Mismatch
**Problem:** Sanitized file may be different size than original
**Solution:**
- Update `Content-Length` header in Azure PUT request
- Original metadata request already sent (minor issue)
- ChatGPT backend doesn't strictly validate size

### Challenge 4: Binary File Modification
**Problem:** Need to modify PDF/DOCX files (not just text)
**Solution:**
- Option A: Parse → Sanitize → Recreate file (complex)
- Option B: Convert to text, upload as TXT (loses formatting)
- Option C: Create new PDF with sanitized text (jsPDF)

---

## Implementation Recommendations

### Phase 1: Text Files Only (MVP)
- Support: TXT, CSV
- Parsing: Native (simple text reading)
- No binary file handling needed
- **Effort:** 1-2 days

### Phase 2: PDF Support
- Library: pdf.js (extract text)
- Sanitization: Text-based
- Output: Text or new PDF (jsPDF)
- **Effort:** 3-5 days

### Phase 3: DOCX Support
- Library: mammoth.js (extract text)
- Sanitization: Text-based
- Output: Text or new DOCX
- **Effort:** 2-3 days

### Phase 4: Image Support (OCR)
- Library: tesseract.js (already spec'd)
- Sanitization: OCR → detect PII
- Output: Warning only (can't edit images easily)
- **Effort:** 4-6 days (already planned)

---

## Code Examples

### Intercept File Input
```typescript
// src/content/inject.js or content.ts

class FileUploadInterceptor {
  private selectedFile: File | null = null;
  private sanitizedFile: File | null = null;

  init() {
    document.addEventListener('change', this.handleFileInput.bind(this), true);
  }

  async handleFileInput(event: Event) {
    const target = event.target as HTMLInputElement;

    if (target.tagName === 'INPUT' && target.type === 'file') {
      const file = target.files?.[0];
      if (!file) return;

      this.selectedFile = file;
      console.log('[File Upload] Detected:', file.name, file.size, file.type);

      // Analyze file
      const analysis = await this.analyzeFile(file);

      if (analysis.piiDetected.length > 0) {
        // Show modal
        const proceed = await this.showPreviewModal(analysis);

        if (proceed) {
          this.sanitizedFile = await this.createSanitizedFile(file, analysis);
        } else {
          // Block upload
          target.value = '';
          event.preventDefault();
          event.stopPropagation();
        }
      }
    }
  }

  async analyzeFile(file: File): Promise<FileAnalysis> {
    // Parse file based on type
    const text = await this.extractText(file);

    // Detect PII
    const piiDetected = detectPII(text); // Use existing AliasEngine

    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      text,
      piiDetected
    };
  }

  async extractText(file: File): Promise<string> {
    if (file.type === 'text/plain') {
      return await file.text();
    }

    if (file.type === 'application/pdf') {
      return await this.extractPDFText(file);
    }

    if (file.type.includes('word')) {
      return await this.extractDOCXText(file);
    }

    return '';
  }
}
```

### Intercept Azure Upload
```typescript
// In fetch interceptor

const originalFetch = window.fetch;
window.fetch = function(url, options) {
  // Check if this is Azure blob upload
  if (typeof url === 'string' && url.includes('oaiusercontent.com/files')) {
    console.log('[Azure Upload] Intercepting:', url);

    // Replace body with sanitized file if available
    if (fileInterceptor.sanitizedFile) {
      const newOptions = {
        ...options,
        body: await fileInterceptor.sanitizedFile.arrayBuffer(),
        headers: {
          ...options.headers,
          'Content-Length': fileInterceptor.sanitizedFile.size.toString()
        }
      };

      console.log('[Azure Upload] Uploading sanitized file');
      return originalFetch.call(this, url, newOptions);
    }
  }

  return originalFetch.apply(this, arguments);
};
```

---

## Next Steps

1. ✅ **Discovery Complete** - Upload flow documented
2. 🔜 **Prototype File Input Monitoring** - Capture File object
3. 🔜 **Implement Text File Sanitization** - MVP with TXT/CSV
4. 🔜 **Add PDF Support** - Use pdf.js
5. 🔜 **Build Preview Modal** - Show original vs sanitized
6. 🔜 **Test End-to-End** - Upload sanitized file to ChatGPT

---

## Screenshots Reference

- **pb_02.png:** Download URL response
- **pb_03.png:** EventStream processing events
- **pb_04.png:** Initial metadata request (POST /backend-api/files)
- **pb_05.png:** Azure Blob Storage PUT request with signed URL
- **consolelogs.txt:** Full request headers from Azure upload

---

**Status:** ✅ DISCOVERY COMPLETE
**Confidence:** High - Real network traffic analyzed
**Ready for Implementation:** Yes
**Estimated Effort (MVP):** 2-3 weeks
