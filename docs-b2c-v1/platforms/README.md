# Platform Documentation - Organized Structure

**Last Updated:** November 7, 2025
**Organization:** Platform-specific subfolders

---

## Folder Structure

```
docs/platforms/
├── _general/               # Cross-platform documentation
│   ├── README.md           # This file
│   ├── PLATFORM_TEMPLATE.md
│   ├── platform-roadmap.md
│   └── platform-support-audit.md
│
├── chatgpt/               # ChatGPT (OpenAI)
│   └── document-upload-sanitization.md  🔴 DETAILED PLAN
│
├── claude/                # Claude (Anthropic)
│   ├── claude-notes.md
│   └── document-upload-notes.md  📋 ROUGH NOTES
│
├── gemini/                # Gemini (Google)
│   ├── gemini.md
│   ├── GEMINI_IMPLEMENTATION_PLAN.md
│   ├── GEMINI_XHR_INTERCEPTION_PLAN.md
│   └── document-upload-notes.md  📋 ROUGH NOTES
│
├── perplexity/            # Perplexity AI
│   ├── perplexity-complete.md  ✅ WORKING
│   ├── perplexity-implementation-notes.md
│   ├── perplexity-OLD.md
│   └── document-upload-notes.md  📋 ROUGH NOTES
│
├── copilot/               # Microsoft Copilot
│   ├── copilot.md
│   ├── copilot-complete.md
│   ├── COPILOT_WEBSOCKET_PLAN.md
│   └── document-upload-notes.md  📋 ROUGH NOTES
│
├── poe/                   # Poe (Multi-model aggregator)
│   ├── poe.md
│   └── document-upload-notes.md  📋 ROUGH NOTES
│
├── you/                   # You.com
│   ├── you.md
│   ├── you-analysis.md
│   └── document-upload-notes.md  📋 ROUGH NOTES
│
└── meta/                  # Meta AI
    ├── meta.md
    └── document-upload-notes.md  📋 ROUGH NOTES
```

---

## Platform Status Summary

### Chat Protection (Text-Based)

| Platform | Status | Confidence | Notes |
|----------|--------|------------|-------|
| **ChatGPT** | ✅ Working | High | Production ready, extensively tested |
| **Claude** | ✅ Working | High | Production ready, extensively tested |
| **Perplexity** | ✅ Working | High | Dual query field fix implemented |
| **Gemini** | 🟡 Ready | Medium | Infrastructure ready, needs testing |
| **Copilot** | 🟡 Ready | Medium | Infrastructure ready, needs testing |
| **Poe** | 🟡 Ready | Medium | Infrastructure ready, needs testing |
| **You.com** | 🟡 Ready | Low | Infrastructure ready, minimal testing |
| **Meta** | 🟡 Ready | Low | Infrastructure ready, unclear product status |

### Document Upload Protection

| Platform | Status | Priority | Plan |
|----------|--------|----------|------|
| **ChatGPT** | 📋 Planned | 🔴 CRITICAL | [Detailed plan](./chatgpt/document-upload-sanitization.md) (41KB) |
| **Claude** | 📋 Research | 🟡 MEDIUM | [Rough notes](./claude/document-upload-notes.md) |
| **Gemini** | 📋 Research | 🟢 LOW | [Rough notes](./gemini/document-upload-notes.md) |
| **Perplexity** | 📋 Research | 🟢 LOW | [Rough notes](./perplexity/document-upload-notes.md) |
| **Copilot** | 📋 Research | 🟡 MEDIUM | [Rough notes](./copilot/document-upload-notes.md) |
| **Poe** | 📋 Research | 🟢 LOW | [Rough notes](./poe/document-upload-notes.md) |
| **You.com** | 📋 Research | 🟢 LOW | [Rough notes](./you/document-upload-notes.md) |
| **Meta** | 📋 Research | 🟢 LOW | [Rough notes](./meta/document-upload-notes.md) |

---

## Implementation Priority

### Phase 1: ChatGPT Document Upload (CURRENT)
**Target:** Week of November 11, 2025
**Effort:** 2-3 weeks
**Status:** Detailed planning complete

**Why First:**
- Largest market share (82.7%)
- Most requested feature (lawyer/doctor use cases)
- "Transformational" feature per marketing analysis

**Deliverables:**
1. Research upload endpoint (1-2 hours)
2. File interception (4-6 hours)
3. PDF/DOCX parsing (8-10 hours)
4. Preview modal UI (6-8 hours)
5. Sanitization & upload (4-6 hours)
6. Response decoding (2-4 hours)
7. Testing & iteration (2-3 days)

### Phase 2: Claude Document Upload
**Target:** After ChatGPT working
**Effort:** 2-3 days (reuse ChatGPT components)

**Why Second:**
- Second largest user base (0.9% but growing)
- Similar UX to ChatGPT
- Code reuse opportunities

### Phase 3: Copilot Document Upload
**Target:** After Claude
**Effort:** 3-5 days (Microsoft-specific handling)

**Why Third:**
- Enterprise use case (4.5% market share)
- Business customers need compliance
- Microsoft ecosystem integration

### Phase 4+: Other Platforms
**Target:** Q2 2025
**Effort:** Varies

**Rationale:**
- Lower priority (smaller market share)
- May not all support file uploads
- Research needed to determine viability

---

## Document Upload Strategy

### Approach: Pre-Upload Sanitization

**Flow:**
```
User uploads document
    ↓
Extension intercepts file
    ↓
Parse document (PDF/DOCX/Image)
    ↓
Detect PII using AliasEngine
    ↓
Show preview modal (original vs redacted)
    ↓
User approves
    ↓
Upload sanitized version
    ↓
ChatGPT analyzes
    ↓
Response with aliases
    ↓
Convert aliases back to real PII
```

### Shared Components

**Parsing Libraries (Reusable):**
- `pdf.js` - PDF text extraction
- `mammoth.js` - DOCX text extraction
- `tesseract.js` - Image OCR (already spec'd)

**UI Components (Reusable):**
- Document preview modal
- Progress indicator
- PII highlight view
- Side-by-side diff

**Processing Logic (Reusable):**
- PII detection (existing AliasEngine)
- Text substitution (existing)
- Alias mapping (existing)

**Platform-Specific:**
- Upload endpoint interception
- Request format handling
- File reference tracking

---

## File Type Support

### MVP (Phase 1)
- ✅ **PDF** - Most common (contracts, reports)
- ✅ **DOCX** - Microsoft Word documents
- ✅ **TXT** - Plain text (trivial)

### Phase 2
- ✅ **Images (PNG/JPG)** - OCR with Tesseract.js
- ✅ **CSV** - Spreadsheet data
- ✅ **XLSX** - Excel files

### Future
- ⏳ **RTF** - Rich text format
- ⏳ **ODT** - OpenDocument
- ⏳ **PPTX** - PowerPoint (lower priority)

---

## Research Questions by Platform

### ChatGPT
- [x] Endpoint for file upload?
- [x] Request format (multipart/form-data)?
- [ ] How files referenced in conversation?
- [ ] Response format with file analysis?
- [ ] File size limits?

### Claude
- [ ] File upload supported?
- [ ] Endpoint and format?
- [ ] File size limits?
- [ ] Integration differences from ChatGPT?

### Gemini
- [ ] Google Drive integration?
- [ ] Direct upload vs file linking?
- [ ] Google-specific auth requirements?

### Perplexity
- [ ] File upload feature exists?
- [ ] Or URL-based document analysis only?

### Copilot
- [ ] OneDrive/SharePoint integration?
- [ ] Microsoft auth requirements?
- [ ] Enterprise-specific features?

---

## Key Documentation

### General
- **Platform Support Audit:** `_general/platform-support-audit.md`
- **Platform Roadmap:** `_general/platform-roadmap.md`
- **Template:** `_general/PLATFORM_TEMPLATE.md`

### ChatGPT (Most Complete)
- **Document Upload Plan:** `chatgpt/document-upload-sanitization.md` ⭐
  - 41KB detailed implementation plan
  - Phases, strategies, code examples
  - Testing plan, success metrics
  - Ready to implement

### Perplexity (Reference Implementation)
- **Completion Report:** `perplexity/perplexity-complete.md`
  - Shows what "done" looks like
  - Dual query field handling
  - Production-ready status

---

## Marketing Impact

**From Marketing Analysis:**
> "Document upload protection is transformational, not incremental value. You're not selling 'privacy' - you're selling 'AI enablement for regulated industries.'"

**Target Users:**
- Lawyers (can't upload contracts)
- Doctors (can't analyze clinical notes - HIPAA)
- Accountants (can't process tax returns)

**Success Metric:**
- **30%+ of users attempt document upload within 30 days**
- If <20%: Feature is not the killer use case
- If >30%: Validates product-market fit

---

## Next Steps

1. ✅ **Organize platforms folder** - DONE
2. ✅ **Create ChatGPT detailed plan** - DONE
3. ✅ **Create rough notes for other platforms** - DONE
4. 🔜 **ChatGPT: Phase 1 Research** - NEXT (manual testing, 1-2 hours)
5. 🔜 **ChatGPT: Implementation** - Start after research
6. 🔜 **Claude: Research** - After ChatGPT MVP working
7. 🔜 **Iterate** - Based on learnings

---

## Contributing

When adding platform documentation:

1. **Create subfolder** for new platform
2. **Use PLATFORM_TEMPLATE.md** as starting point
3. **Document discovery** process (Network tab, API analysis)
4. **Include screenshots** in platform subfolder
5. **Update this README** with status
6. **Link from ROADMAP.md**

---

**Status:** 📁 ORGANIZED & READY
**Next:** ChatGPT document upload implementation
**Owner:** TBD
