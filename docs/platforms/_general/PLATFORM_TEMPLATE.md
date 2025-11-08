# Platform Support Template

> **Template Version:** 1.0
> **Last Updated:** 2025-11-02
> **Status Template:** Use one of: ✅ Production | 🚧 In Development | ⏳ Planned | 🔴 Blocked | 📦 Archived

---

## Platform: [PLATFORM_NAME]

**URL Pattern:** `[domain pattern, e.g., *.chatgpt.com, *.claude.ai]`
**Status:** [Current implementation status]
**Implementation Date:** [YYYY-MM-DD]
**Last Updated:** [YYYY-MM-DD]
**Maintained By:** [Team/Person]

---

## 1. Platform Overview

### Description
[Brief description of the AI platform - what it is, who makes it, key features]

### User Base & Priority
- **Estimated Users:** [number or "Unknown"]
- **Priority Level:** [High/Medium/Low - based on user demand]
- **Business Impact:** [Why this platform matters for PromptBlocker]

### Key Characteristics
- **API Type:** [REST API / WebSocket / GraphQL / Other]
- **Request Format:** [JSON / Form-encoded / Binary / Custom]
- **Response Format:** [JSON / Server-Sent Events / WebSocket / Other]
- **Authentication:** [OAuth / API Key / Session-based / None]

---

## 2. Technical Implementation

### 2.1 Detection & Initialization

**Hostname Detection:**
```javascript
// Pattern used in observers/[platform]-observer.ts
if (window.location.hostname.includes('[domain]')) {
  // Initialize platform observer
}
```

**URL Patterns Supported:**
- `[pattern 1]` - [Description]
- `[pattern 2]` - [Description]

**Initialization Sequence:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

### 2.2 Request Interception Method

**Primary Method:** [fetch() / XMLHttpRequest / WebSocket / Other]

**Why This Method:**
[Explain why this interception method was chosen for this platform]

**Implementation Location:**
- **File:** `src/content/[file].ts` or `src/content/inject.js`
- **Function:** `[function name]`
- **Lines:** [line range]

**Interception Pattern:**
```javascript
// Example code showing how requests are intercepted
// for this platform
```

### 2.3 Request/Response Format

**Request Structure:**
```json
// Example request format
{
  "field": "value"
}
```

**Request Endpoint Pattern:**
```
[API endpoint pattern, e.g., /api/v1/chat]
```

**Response Structure:**
```json
// Example response format
{
  "field": "value"
}
```

**Streaming Support:** [Yes/No - if streaming, describe the format]

### 2.4 PII Substitution Strategy

**Request Substitution:**
- **Location in Request:** [Where PII appears in the request body]
- **Encoding/Decoding Required:** [Yes/No - if yes, describe the encoding]
- **Special Handling:** [Any special considerations]

**Response Substitution:**
- **Location in Response:** [Where aliases appear in the response]
- **DOM Observation:** [Yes/No - if yes, describe the DOM structure]
- **Special Handling:** [Any special considerations]

**Example Flow:**
```
User Input (Real PII)
  → [step 1]
  → [step 2]
  → API Request (Aliases)
  → API Response (Aliases)
  → [step 3]
  → User Display (Real PII)
```

---

## 3. Code Architecture

### 3.1 Key Files

| File | Purpose | Lines | Complexity |
|------|---------|-------|------------|
| `src/observers/[platform]-observer.ts` | DOM observation & response decoding | [count] | [Low/Med/High] |
| `src/content/inject.js` | Request interception (if needed) | [count] | [Low/Med/High] |
| `src/content/content.ts` | Content script initialization | [count] | [Low/Med/High] |
| `src/background/serviceWorker.ts` | Background substitution logic | [count] | [Low/Med/High] |

### 3.2 Message Passing Flow

```
[Platform Page]
     ↓
inject.js (page context)
     ↓ window.postMessage
content.ts (isolated world)
     ↓ chrome.runtime.sendMessage
serviceWorker.ts (background)
     ↓ Substitution
content.ts (isolated world)
     ↓ window.postMessage
inject.js (page context)
     ↓
[Modified Request Sent]
```

### 3.3 Observer Implementation

**Observer Type:** [MutationObserver / DOM Polling / Event-based]

**Target Selectors:**
- **Chat Input:** `[CSS selector]`
- **Response Container:** `[CSS selector]`
- **Streaming Container:** `[CSS selector if applicable]`

**Observer Configuration:**
```javascript
{
  childList: true,
  subtree: true,
  characterData: true,
  // ... other options
}
```

---

## 4. Testing & Validation

### 4.1 Test Scenarios

**Basic Functionality:**
- [ ] Platform detection works on [URL]
- [ ] Observer initializes correctly
- [ ] Request interception captures API calls
- [ ] PII substitution works in requests
- [ ] Response decoding works
- [ ] User sees real PII in UI
- [ ] Platform sees only aliases

**Edge Cases:**
- [ ] [Edge case 1]
- [ ] [Edge case 2]
- [ ] [Edge case 3]

**Performance:**
- [ ] No noticeable latency added
- [ ] No memory leaks during long sessions
- [ ] Works with rapid consecutive requests

### 4.2 Known Issues

| Issue | Severity | Status | Workaround |
|-------|----------|--------|------------|
| [Issue description] | [High/Med/Low] | [Open/Fixed/Wontfix] | [Workaround if any] |

### 4.3 Test Results

**Last Tested:** [YYYY-MM-DD]
**Tester:** [Name/Role]
**Environment:** [Browser version, OS]

**Results:**
- ✅ [Passed test 1]
- ✅ [Passed test 2]
- ⚠️ [Partial test 3]
- 🔴 [Failed test 4]

---

## 5. Platform-Specific Challenges

### 5.1 Technical Challenges

**Challenge 1: [Title]**
- **Problem:** [Description]
- **Solution:** [How we solved it]
- **Trade-offs:** [Any compromises made]

**Challenge 2: [Title]**
- **Problem:** [Description]
- **Solution:** [How we solved it]
- **Trade-offs:** [Any compromises made]

### 5.2 Platform Limitations

- **Limitation 1:** [Description and impact]
- **Limitation 2:** [Description and impact]

### 5.3 Future Risks

- **Risk 1:** [Potential breaking change from platform]
- **Risk 2:** [Potential breaking change from platform]
- **Mitigation:** [How we plan to handle these]

---

## 6. Maintenance & Updates

### 6.1 Monitoring

**What to Monitor:**
- [Metric 1: e.g., API endpoint changes]
- [Metric 2: e.g., Request format changes]
- [Metric 3: e.g., Error rates]

**How to Monitor:**
- [Method 1: e.g., Console logs, error tracking]
- [Method 2: e.g., User reports]

### 6.2 Update Checklist

When platform updates break integration:
1. [ ] Check for API endpoint changes
2. [ ] Verify request/response format
3. [ ] Test request interception still works
4. [ ] Check DOM selectors for observer
5. [ ] Validate substitution logic
6. [ ] Run full test suite
7. [ ] Update documentation

### 6.3 Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| [YYYY-MM-DD] | 1.0.0 | Initial implementation | [Name] |
| [YYYY-MM-DD] | 1.1.0 | [Change description] | [Name] |

---

## 7. Security Considerations

### 7.1 Data Handling

- **Request Data:** [How request data is handled]
- **Response Data:** [How response data is handled]
- **Storage:** [What data is stored, if any]
- **Transmission:** [How data is transmitted between components]

### 7.2 Privacy Impact

- **PII Exposure Risk:** [Low/Medium/High]
- **Mitigation:** [How we prevent PII leakage]
- **User Control:** [What control users have]

### 7.3 Security Audit Results

**Last Audit:** [YYYY-MM-DD]
**Auditor:** [Name/Role]

**Findings:**
- ✅ [Passed check 1]
- ✅ [Passed check 2]
- ⚠️ [Warning 1]
- 🔴 [Critical issue - should be none in production]

---

## 8. User Experience

### 8.1 Performance Impact

- **Latency Added:** [<50ms / 50-100ms / >100ms]
- **Memory Usage:** [Negligible / Low / Medium / High]
- **CPU Usage:** [Negligible / Low / Medium / High]

### 8.2 Visual Indicators

- **Protection Status:** [How user knows protection is active]
- **Substitution Feedback:** [How user sees what was substituted]
- **Error States:** [How errors are communicated]

### 8.3 Known UX Issues

| Issue | Impact | Priority | Status |
|-------|--------|----------|--------|
| [Issue] | [High/Med/Low] | [P0/P1/P2] | [Open/In Progress/Fixed] |

---

## 9. Dependencies

### 9.1 External Dependencies

- [Dependency 1: e.g., specific browser API]
- [Dependency 2: e.g., third-party library]

### 9.2 Internal Dependencies

- [Internal module 1]
- [Internal module 2]

### 9.3 Breaking Change Risk

**Risk Level:** [Low/Medium/High]

**Potential Breaking Changes:**
1. [Change 1 and impact]
2. [Change 2 and impact]

---

## 10. References & Resources

### 10.1 Platform Documentation

- [Official API Docs URL]
- [Developer Portal URL]
- [Community Resources]

### 10.2 Related Internal Docs

- `docs/current/adding_ai_services.md` - Generic platform integration guide
- `docs/current/technical_architecture.md` - Overall architecture
- `docs/development/final-dev-phase.md` - Implementation details

### 10.3 External References

- [Relevant blog posts]
- [Stack Overflow discussions]
- [GitHub issues/PRs]

---

## 11. Quick Reference

### Command Cheat Sheet

```bash
# Build extension
npm run build

# Test on platform
# 1. Load unpacked extension
# 2. Navigate to [platform URL]
# 3. Open DevTools console
# 4. Look for: [key log messages]

# Debug issues
# Check console for: [key error patterns]
```

### Key Log Messages

```
✅ [Platform] Observer initialized
✅ [Platform] Request intercepted
✅ [Platform] Substituted: X replacements
✅ [Platform] Response decoded: X replacements
🔴 [Platform] ERROR: [error pattern]
```

### Troubleshooting Quick Fixes

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| [Symptom 1] | [Cause] | [Fix] |
| [Symptom 2] | [Cause] | [Fix] |

---

## 12. Migration & Deprecation

### 12.1 Migration Path

If this implementation needs to be replaced:
1. [Step 1]
2. [Step 2]
3. [Step 3]

### 12.2 Deprecation Plan

**Deprecation Criteria:**
- [Condition 1 that would trigger deprecation]
- [Condition 2 that would trigger deprecation]

**Sunset Timeline:**
- [Phase 1: Warning period]
- [Phase 2: Deprecation notice]
- [Phase 3: Removal]

---

## Appendix A: Code Snippets

### Full Request Interception Code
```javascript
// Complete implementation of request interception
// for this platform
```

### Full Observer Code
```javascript
// Complete implementation of DOM observer
// for this platform
```

---

## Appendix B: Diagrams

### Architecture Diagram
```
[ASCII diagram or link to image showing architecture]
```

### Data Flow Diagram
```
[ASCII diagram or link to image showing data flow]
```

---

**Template Maintenance:**
- This template should be updated when new platform integration patterns emerge
- Deprecated sections should be marked but retained for historical reference
- Version the template and track changes in git

**Using This Template:**
1. Copy this file to `docs/platforms/[platform-name].md`
2. Replace all `[bracketed placeholders]` with actual values
3. Delete any sections not applicable (mark "N/A" if unsure)
4. Update the header status and dates
5. Keep it updated as the platform implementation evolves
