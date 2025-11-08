# Claude Document Upload - Rough Planning Notes

**Status:** 📋 RESEARCH NEEDED
**Priority:** 🟡 MEDIUM (After ChatGPT)
**Last Updated:** November 7, 2025

---

## What We Know

**Current Status:**
- ✅ Chat protection working (confirmed in platform-support-audit.md)
- ✅ API endpoint: `claude.ai/api/organizations`
- ❌ Document upload: Not tested yet

---

## Research Needed

### Questions
1. Does Claude web interface support file uploads?
2. What endpoint is used for uploads?
3. What file types are supported?
4. Request format (multipart? JSON with base64?)
5. How are files referenced in conversations?

### Discovery Tasks
- [ ] Visit claude.ai
- [ ] Test file upload feature
- [ ] Record Network traffic
- [ ] Document request/response format
- [ ] Test with sample PDF

---

## Initial Approach

**Strategy:** Same as ChatGPT
1. Intercept file upload
2. Parse document (PDF/DOCX)
3. Detect PII
4. Show preview modal
5. Upload sanitized version

**Differences from ChatGPT:**
- Different API endpoint
- May have different file size limits
- May support different file types
- Response format likely different

---

## Implementation Notes

**When to implement:** After ChatGPT document upload is working

**Estimated effort:** 2-3 days (if ChatGPT approach works similarly)

**Dependencies:**
- Same parsing libraries (pdf.js, mammoth.js)
- Same preview modal UI (reusable)
- Platform-specific API interception

---

## References

- **Chat Protection:** Already working
- **ChatGPT Plan:** Use as template
- **Claude Docs:** `docs/platforms/claude/claude-notes.md`
