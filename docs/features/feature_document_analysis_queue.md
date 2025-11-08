# Document Analysis Queue System

**Status:** ✅ Implemented
**Version:** 1.0
**Last Updated:** 2025-01-08

## Overview

The Document Analysis Queue System allows users to upload and sanitize multiple documents (PDF, TXT, DOCX) simultaneously. Files are processed sequentially through a visual queue interface, then combined into a single preview window with pagination and a visual progress indicator showing document boundaries.

## Features

### 📄 Multi-Document Upload (All Users)
- **File Types:** PDF, TXT, DOCX
- **Batch Upload:** Select multiple files at once
- **Queue Management:** Add, remove, toggle files before processing
- **Visual Feedback:** Status badges (Pending, Processing, Completed, Error)
- **File Validation:** Size limits, format checking

### 🎯 Queue Interface
- **File List:** Shows all queued documents with metadata
- **Toggle Selection:** Checkboxes to select which files to process
- **Status Tracking:** Real-time status updates per file
- **Remove Files:** Delete files from queue before processing
- **File Icons:** Visual indicators for PDF, TXT, DOCX types

### 🔄 Sequential Processing
- **One at a time:** Files processed sequentially to avoid overload
- **Progress Updates:** Live status messages during processing
- **PII Detection:** Each document analyzed independently
- **Combined Output:** All sanitized text merged into single view

### 📊 Multi-Document Progress Bar (New!)
- **Visual Timeline:** Horizontal progress bar showing position across all documents
- **Document Markers:** Numbered colored circles marking where each document begins
- **Theme-Aware:** Colors adapt to selected theme (light/dark)
- **Page-Based:** Shows progress through paginated combined document
- **Auto-Update:** Fills as user navigates pages

### 📖 Unified Preview Window
- **Single Window:** One preview for all documents, not multiple windows
- **Combined Text:** Documents concatenated with headers (`DOCUMENT 1: filename.pdf`)
- **Pagination:** Smart 15k character pages respecting paragraph boundaries
- **Side-by-Side Diff:** Original vs Sanitized comparison
- **Theme Matching:** Preview window uses same theme as main extension

## User Interface

### Location
**Features Tab → Document Analysis Card**

```
Features Hub
└── Document Analysis
    ├── 📄 Upload Documents (file picker, multi-select)
    ├── Queue (list of selected files)
    │   ├── File 1 [✓] [Status] [Remove]
    │   ├── File 2 [✓] [Status] [Remove]
    │   └── File 3 [ ] [Status] [Remove]
    └── 🔍 Analyze Documents (button, processes selected files)
```

### Queue Item Display
Each file shows:
- **Checkbox:** Toggle for processing inclusion
- **File Icon:** 📄 PDF, 📝 TXT, 📋 DOCX
- **Filename:** Full name with extension
- **File Size:** Human-readable (KB, MB)
- **Status Badge:** Visual indicator
  - **Pending:** Gray, awaiting processing
  - **Processing:** Blue with pulse animation
  - **Completed:** Green checkmark
  - **Error:** Red with error message
- **Remove Button:** ✕ icon to delete from queue

### Preview Window Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Combined: file1.pdf, file2.pdf                    [ Close ] │
├─────────────────────────────────────────────────────────────┤
│ [◄◄] [◄] PAGE 4 of 7 [►] [►►]  ●────●────  [Copy] [Save]  │
│                                 1    2                       │
├─────────────────────────────────────────────────────────────┤
│ Original Document      │  Sanitized Document                │
│ CONTAINS PII          │  PII REMOVED                       │
│                        │                                    │
│ DOCUMENT 1: file1.pdf  │  DOCUMENT 1: file1.pdf            │
│ ==================     │  ==================                │
│ Content here...        │  [REDACTED] here...               │
└─────────────────────────────────────────────────────────────┘
```

## Technical Architecture

### Files
- **Component:** `src/popup/components/documentAnalysis.ts`
- **Preview Page:** `src/document-preview.ts`, `src/document-preview.html`
- **Styles:**
  - `src/popup/styles/document-analysis.css`
  - `src/document-preview.css`
  - `src/document-preview-progress.css`
- **Parsers:**
  - `src/lib/documentParsers/pdfParser.ts`
  - `src/lib/documentParsers/docxParser.ts`
  - `src/lib/documentParsers/index.ts`
- **Libraries:** `pdfjs-dist`, `mammoth`

### Queue State Management

```typescript
// Module-level state in documentAnalysis.ts
let uploadQueue: QueuedFile[] = [];
let isProcessing: boolean = false;

interface QueuedFile {
  id: string;          // Unique ID
  file: File;          // Browser File object
  fileName: string;    // Display name
  fileSize: number;    // Bytes
  fileType: string;    // MIME type
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  extractedText?: string;
  sanitizedText?: string;
}
```

### Processing Flow

```
User uploads files
  → addFilesToQueue(files)
    → Validate each file (type, size)
    → Generate unique IDs
    → Add to uploadQueue[]
    → renderUploadQueue()

User clicks "Analyze Documents"
  → getSelectedFiles() - filter checked files
  → processMultipleFiles(selectedFiles)
    → FOR EACH file sequentially:
      ├─ Update status to 'processing'
      ├─ Parse document (PDF/TXT/DOCX)
      ├─ Sanitize text with enabled profiles
      ├─ Track document boundary (character position)
      ├─ Combine with header: "DOCUMENT N: filename"
      ├─ Update status to 'completed'
      └─ renderUploadQueue()

    → Calculate document boundaries (page-based)
    → Create combined DocumentAlias
    → openPreviewWindow()
      ├─ Generate session key
      ├─ Store data in chrome.storage.session
      ├─ Open chrome.tabs.create()
      └─ Pass theme to preview

Preview window loads
  → init()
    ├─ Get session key from URL
    ├─ Load data from chrome.storage.session
    ├─ Clean up session storage
    ├─ applyTheme() - set background gradient
    ├─ renderDocument()
    │   ├─ paginateText() - 15k char pages
    │   ├─ calculatePageBoundaries() - find doc start pages
    │   └─ renderProgressBar() - colored markers
    └─ Setup event listeners
```

### Document Boundary Tracking

The system tracks where each document begins in the combined text:

1. **During Processing (Character-based):**
   ```typescript
   documentBoundaries: Array<{
     name: string;        // filename.pdf
     startChar: number;   // character offset in combined text
     percentage: number;  // calculated later
   }>
   ```

2. **After Pagination (Page-based):**
   ```typescript
   // In calculatePageBoundaries()
   // Finds which page contains each document's start character
   // Converts to page percentage: (page - 1) / (totalPages - 1) * 100
   ```

3. **Visual Rendering:**
   - Creates `.doc-marker` div for each document
   - Positions at calculated percentage along progress bar
   - Assigns unique color from palette

### Session Storage Data Transfer

**Problem:** URL parameters have size limits (~2MB), combined documents exceed this.

**Solution:** Use `chrome.storage.session` as intermediary:

```typescript
// documentAnalysis.ts - Sender
const sessionKey = `doc_preview_${Date.now()}`;
await chrome.storage.session.set({ [sessionKey]: dataWithTheme });
const previewUrl = chrome.runtime.getURL(
  `document-preview.html?sessionKey=${sessionKey}`
);
chrome.tabs.create({ url: previewUrl });

// document-preview.ts - Receiver
const urlParams = new URLSearchParams(window.location.search);
const sessionKey = urlParams.get('sessionKey');
const result = await chrome.storage.session.get(sessionKey);
documentData = result[sessionKey];
await chrome.storage.session.remove(sessionKey); // Clean up
```

### Theme Integration

**Document Preview Window matches main extension theme:**

```typescript
// applyTheme() in document-preview.ts
function applyTheme(theme: string) {
  // Set data attributes for CSS selectors
  body.setAttribute('data-theme', theme);
  body.setAttribute('data-theme-mode', isDark ? 'dark' : 'light');

  // Update CSS variables to apply theme gradient
  body.style.setProperty('--theme-bg-gradient', `var(--theme-${theme})`);
  body.style.setProperty('--theme-header-gradient', `var(--theme-${theme}-header)`);
}
```

**CSS uses theme variables:**
```css
body {
  background: var(--theme-bg-gradient);
}

.progress-fill {
  background: var(--color-primary);
}

.doc-marker {
  border: 3px solid var(--card-bg);
  color: var(--card-bg);
}
```

## Document Parser Support

### PDF Parser (`pdfParser.ts`)
- **Library:** `pdfjs-dist` v4.0.379
- **Method:** `getTextContent()` per page
- **Output:** Plain text with preserved spacing
- **Limitations:** No OCR for image-based PDFs

### TXT Parser (`index.ts`)
- **Method:** `FileReader.readAsText()`
- **Encoding:** UTF-8
- **Simple:** Direct text extraction

### DOCX Parser (`docxParser.ts`)
- **Library:** `mammoth` v1.x
- **Method:** `extractRawText()`
- **Output:** Plain text (no formatting)
- **Validation:** Checks for empty content

### Validation (`index.ts`)
```typescript
function isValidDocumentFile(file: File): boolean {
  return isPdf(file) || isText(file) || isDocx(file);
}

function getSupportedExtensions(): string {
  return '.pdf,.txt,.text,.docx';
}
```

## Progress Bar System

### Visual Design
- **Track:** 10px height, semi-transparent background
  - Light themes: `rgba(0, 0, 0, 0.2)`
  - Dark themes: `rgba(255, 255, 255, 0.15)`
- **Fill:** Theme primary color, animates width
- **Markers:** 36px circles, numbered 1-10
  - Positioned at document start page percentage
  - 10 distinct colors (purple, green, orange, red, violet, teal, etc.)
  - White border in light themes, dark border in dark themes

### Update Logic
```typescript
// Called on every page change
function updateProgressBar() {
  const progress = (currentPage / totalPages) * 100;
  progressFill.style.width = `${progress}%`;
}

// Wire to pagination
function updatePaginationControls() {
  // ... update page input, buttons
  updateProgressBar(); // <-- Updates on navigation
}
```

### Responsive Behavior
- **Single Document:** Progress bar hidden (no boundaries)
- **Multiple Documents:** Progress bar visible in unified controls bar
- **Flex Layout:** Takes available space between pagination and actions

## User Experience Flow

### First-Time Use
1. Navigate to Features tab
2. Click "Document Analysis" card
3. Click "Upload Documents" button
4. Select multiple PDF/TXT/DOCX files
5. Files appear in queue with checkboxes
6. Click "Analyze Documents"
7. Watch status badges update
8. Preview window opens when complete

### Queue Management
**Adding Files:**
- Click upload button → file picker → select files
- Files instantly appear in queue

**Toggling Files:**
- Check/uncheck boxes to select which files to process
- Analyze button only processes checked files

**Removing Files:**
- Click ✕ button on any file to remove from queue
- Can remove before or after processing

**Re-analyzing:**
- After processing, can upload more files
- Queue persists until explicitly removed or page refreshed

### Preview Window Usage
**Navigation:**
- Use pagination buttons (◄◄ ◄ ► ►►) to move between pages
- Type page number to jump directly
- Progress bar shows visual position

**Finding Documents:**
- Look at numbered markers on progress bar
- Marker "1" = Document 1 starts here
- Marker "2" = Document 2 starts here
- Document headers visible in content: `DOCUMENT 1: filename.pdf`

**Actions:**
- **Copy:** Copy sanitized text to clipboard
- **Download:** Save as .txt file
- **Save:** Store in extension storage
- **Send to Chat:** Insert into active chat input
- **Save & Download:** Do both actions

## Performance Considerations

### Sequential Processing
**Why Sequential?**
- Avoids memory overload from parsing multiple large PDFs
- Provides clear progress feedback
- Easier error handling per file

**Trade-off:**
- Slower than parallel for small files
- Better UX for large files with progress updates

### Pagination
**15k characters per page:**
- ~1 full page of dense text
- Respects paragraph boundaries (won't split mid-paragraph)
- Keeps rendering performant even with large documents

### Session Storage
**Benefits:**
- No URL length limits
- Clean separation of data transfer
- Automatic cleanup after loading

**Limitations:**
- `chrome.storage.session` clears on browser close
- Suitable for temporary preview data only

## Known Limitations

### Current Restrictions
- **No OCR:** Image-based PDFs won't extract text
- **No Formatting:** Plain text only, loses bold/italic/structure
- **Sequential Only:** Files process one at a time
- **No Resume:** If error occurs, must restart from beginning
- **Session-Only:** Preview data not persisted across browser restarts

### File Size Considerations
- Large PDFs (50+ pages) may take 10-30 seconds to parse
- DOCX files with many images may be slower
- Memory usage scales with combined document size

### Browser Compatibility
- Requires Chrome/Edge Manifest V3
- Uses modern ES6+ features
- PDF.js library may have rendering differences across browsers

## Future Enhancements

### Planned Features (Q1 2025)
- [ ] **Parallel Processing:** Process multiple files simultaneously (with concurrency limit)
- [ ] **Progress Percentage:** Show "45% complete" for individual files
- [ ] **Drag & Drop:** Drag files directly into queue area
- [ ] **Reorder Queue:** Drag to reorder processing sequence
- [ ] **Bulk Actions:** "Select All", "Clear All", "Process All"
- [ ] **Error Recovery:** Retry failed files without restarting
- [ ] **Format Preservation:** Maintain basic formatting in preview

### Under Consideration
- [ ] **Cloud Storage Integration:** Upload from Google Drive, Dropbox
- [ ] **Batch Download:** Download all sanitized docs as ZIP
- [ ] **Custom Separators:** User-defined document boundary markers
- [ ] **Smart Merging:** Detect related documents, merge intelligently
- [ ] **OCR Support:** Extract text from scanned PDFs/images
- [ ] **Progress Bar Interactions:** Click markers to jump to documents

## Testing Checklist

- [x] Upload single file (PDF, TXT, DOCX)
- [x] Upload multiple files at once
- [x] Toggle file checkboxes (select/deselect)
- [x] Remove files from queue
- [x] Process all checked files sequentially
- [x] Status badges update correctly
- [x] Preview window opens with combined document
- [x] Pagination works across all combined text
- [x] Progress bar shows for multiple documents
- [x] Document markers positioned correctly
- [x] Progress fill updates on page navigation
- [x] Theme applies to preview window background
- [x] Theme colors apply to progress bar
- [x] Light/dark mode switches properly
- [x] Copy, download, save actions work
- [x] Send to chat functionality works
- [x] Error handling shows user-friendly messages
- [x] Large files (20+ pages) process without errors
- [x] Multiple document types mixed (PDF + DOCX + TXT)
- [x] Preview window closes cleanly
- [x] Session storage cleans up properly

## Troubleshooting

### Common Issues

**Files not appearing in queue:**
- Check file type (must be PDF, TXT, or DOCX)
- Verify file picker shows "Accept" for uploaded files
- Check browser console for validation errors

**Processing stuck:**
- Large PDFs may take time (wait 30s)
- Check `isProcessing` flag didn't get stuck
- Refresh extension if completely frozen

**Preview window blank:**
- Check browser console for session storage errors
- Verify theme data passed correctly
- Try with single small file to isolate issue

**Progress bar not showing:**
- Requires 2+ documents to display
- Check `documentBoundaries.length > 1`
- Verify CSS file copied to dist during build

**Wrong theme colors:**
- Check theme name passed to preview window
- Verify CSS variables loaded in document-preview.html
- Inspect computed styles in DevTools

**Markers invisible:**
- Originally caused by missing CSS file in webpack config
- Fixed: Added `document-preview-progress.css` to CopyPlugin
- Ensure `dist/document-preview-progress.css` exists after build

## Documentation Updates

This feature requires updates to:
- [x] `feature_document_analysis_queue.md` (this file)
- [ ] `FEATURES_AUDIT.md` - Add multi-document queue entry
- [ ] `ROADMAP.md` - Mark as complete, add future enhancements
- [ ] `README.md` - Mention document analysis in features list
- [ ] `docs/user-guide/document-analysis.md` - Create user guide

## Related Files

### Core Implementation
- `src/popup/components/documentAnalysis.ts` - Queue management, processing
- `src/document-preview.ts` - Preview window logic
- `src/document-preview.html` - Preview UI markup
- `src/document-preview.css` - Preview styling
- `src/document-preview-progress.css` - Progress bar styling
- `src/popup/styles/document-analysis.css` - Queue UI styling

### Parsers
- `src/lib/documentParsers/pdfParser.ts` - PDF text extraction
- `src/lib/documentParsers/docxParser.ts` - DOCX text extraction
- `src/lib/documentParsers/index.ts` - Parser dispatcher

### Configuration
- `webpack.config.js` - Build config (CopyPlugin for CSS)
- `package.json` - Dependencies (`pdfjs-dist`, `mammoth`)

## Changelog

### v1.0.0 (2025-01-08) - Initial Release
- ✅ Implemented multi-document upload queue
- ✅ Added sequential file processing with status tracking
- ✅ Created combined preview window with pagination
- ✅ Implemented progress bar with document markers
- ✅ Added DOCX support (PDF, TXT, DOCX)
- ✅ Integrated theme system into preview window
- ✅ Implemented session storage for large data transfer
- ✅ Added document boundary tracking (page-based)
- ✅ Created unified controls bar layout
- ✅ Made progress bar theme-aware (light/dark)
- ✅ Fixed webpack config to include progress CSS
- ✅ Optimized marker visibility with proper specificity

---

**Implementation Complete:** January 8, 2025
**Feature Status:** Production Ready ✅
