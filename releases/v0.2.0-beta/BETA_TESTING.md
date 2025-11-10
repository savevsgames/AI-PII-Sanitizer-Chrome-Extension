# PromptBlocker v0.2.0-beta - Testing & Feedback Form

**Thank you for testing PromptBlocker!** Your feedback helps make this extension better for everyone.

---

## How to Report Issues

Please copy this template and fill it out when reporting bugs or feedback:

---

### 🐛 Bug Report Template

```
**Your Name/Username:**

**Date Tested:**

**System Info:**
- OS: [Windows 10/11, macOS version, Linux distro]
- Browser: [Chrome/Edge/Brave + version number]
- Extension Version: v0.2.0-beta

**What happened?**
[Describe the bug clearly]

**What did you expect to happen?**
[What should have happened instead?]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [etc.]

**Which AI platform?**
[ChatGPT / Claude / Gemini / Perplexity / Copilot]

**Console Errors (if any):**
[Press F12 → Console tab → paste any red errors here]

**Screenshots:**
[Attach screenshots if helpful - REDACT ANY REAL PII!]

**How often does this happen?**
[Always / Sometimes / Rarely / Only once]

**Severity:**
[Critical - Blocks usage / High - Major issue / Medium - Annoying / Low - Minor]
```

---

## Testing Checklist

Please test as many of these items as possible and report any issues:

### ✅ Installation & Setup

- [ ] Extension installed without errors
- [ ] Popup opens correctly
- [ ] Can create a new profile
- [ ] Can edit a profile
- [ ] Can delete a profile
- [ ] Can switch between profiles
- [ ] Can export profile data
- [ ] Can import profile data

**Notes:**

---

### ✅ ChatGPT (chatgpt.com)

- [ ] Extension icon shows "protected" badge when enabled
- [ ] PII is replaced in outgoing prompts (check browser DevTools Network tab)
- [ ] Real PII appears correctly in ChatGPT's responses
- [ ] Stats tracking works (check Activity Log)
- [ ] Protection toggle on/off works correctly
- [ ] No console errors (F12 → Console)

**Test Profile Used:**
- Name: [e.g., John Smith]
- Email: [e.g., john@example.com]
- Other PII: [list what you tested]

**What worked:**

**What didn't work:**

---

### ✅ Claude (claude.ai)

- [ ] Extension icon shows "protected" badge when enabled
- [ ] PII is replaced in outgoing prompts
- [ ] Real PII appears correctly in Claude's responses
- [ ] Stats tracking works
- [ ] Protection toggle on/off works correctly
- [ ] No console errors

**Test Profile Used:**

**What worked:**

**What didn't work:**

---

### ✅ Google Gemini (gemini.google.com)

- [ ] Extension icon shows "protected" badge when enabled
- [ ] PII is replaced in outgoing prompts
- [ ] Real PII appears correctly in Gemini's responses
- [ ] Stats tracking works
- [ ] Protection toggle on/off works correctly
- [ ] No console errors

**Test Profile Used:**

**What worked:**

**What didn't work:**

---

### ✅ Perplexity AI (perplexity.ai)

- [ ] Extension icon shows "protected" badge when enabled
- [ ] PII is replaced in outgoing prompts
- [ ] Real PII appears correctly in Perplexity's responses
- [ ] Stats tracking works
- [ ] Protection toggle on/off works correctly
- [ ] No console errors

**Test Profile Used:**

**What worked:**

**What didn't work:**

---

### ✅ Microsoft Copilot (copilot.microsoft.com)

- [ ] Extension icon shows "protected" badge when enabled
- [ ] PII is replaced in outgoing prompts
- [ ] Real PII appears correctly in Copilot's responses
- [ ] Stats tracking works
- [ ] Protection toggle on/off works correctly
- [ ] No console errors

**Test Profile Used:**

**What worked:**

**What didn't work:**

---

### ✅ Advanced Features

**Document Analysis:**
- [ ] Can upload TXT file
- [ ] Can upload PDF file
- [ ] Can upload DOCX file
- [ ] Document preview shows correctly
- [ ] Can download sanitized document
- [ ] PII highlighting works

**Notes:**

**Image Redaction:**
- [ ] Can upload images
- [ ] Can draw redaction boxes
- [ ] Can zoom and pan
- [ ] Can download redacted image
- [ ] Redacted areas are truly blocked

**Notes:**

**Custom Rules:**
- [ ] Can create custom rule
- [ ] Custom rule works correctly
- [ ] Can edit custom rule
- [ ] Can delete custom rule
- [ ] Can toggle rules on/off

**Notes:**

**Firebase Authentication:**
- [ ] Google Sign-In works
- [ ] Email/Password sign-in works (if implemented)
- [ ] Sign out works correctly
- [ ] Profile sync works if testing on multiple devices

**Notes:**

---

### ✅ Edge Cases & Stress Testing

- [ ] Works with multiple profiles (5+)
- [ ] Works with long text (1000+ words)
- [ ] Case preservation works (JOHN → ALEX, John → Alex, john → alex)
- [ ] Possessives work (John's → Alex's)
- [ ] Plurals work (Johns → Alexs)
- [ ] Profile switching during active session
- [ ] Browser restart (does data persist?)
- [ ] Extension reload (does protection resume?)
- [ ] Concurrent tabs (multiple AI platforms open)
- [ ] Long session (1+ hours of usage)

**Notes:**

---

## 💡 Feature Requests

**What features would you like to see added?**

---

## 🎨 UI/UX Feedback

**What do you think about the user interface?**
- [ ] Easy to use
- [ ] Confusing
- [ ] Looks professional
- [ ] Needs improvement

**Specific UI suggestions:**

---

## 📊 Performance

**How is the performance?**
- [ ] Fast and responsive
- [ ] Occasionally slow
- [ ] Frequently slow
- [ ] Unusable

**When is it slow? (if applicable)**

---

## 🌟 Overall Experience

**Rate your experience (1-10):**
- Installation: __ / 10
- Ease of use: __ / 10
- Features: __ / 10
- Performance: __ / 10
- Would you recommend it? [Yes / No / Maybe]

**Overall impression:**

---

## 📤 How to Submit Feedback

### Option 1: GitHub Issues (Preferred)
1. Go to: https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues
2. Click "New Issue"
3. Copy your filled-out sections from above
4. Submit

### Option 2: Email
- Send your filled-out form to: [your-email@example.com]

### Option 3: Direct Message
- Contact me on [Discord/Slack/etc.]

---

## 🔍 How to Check Console Errors

**Chrome/Edge/Brave:**
1. Press `F12` (or `Cmd+Option+I` on Mac)
2. Click "Console" tab
3. Look for red error messages
4. Right-click error → "Save as..." → send to me

**Common Errors to Report:**
- `Uncaught TypeError:`
- `Failed to fetch`
- `NetworkError`
- `Extension context invalidated`
- Any red text!

---

## 🎯 Focus Areas for This Beta

We're especially interested in feedback on:

1. **Cross-Platform Compatibility**
   - Does it work on your OS?
   - Does it work in your browser?

2. **All 5 AI Platforms**
   - ChatGPT, Claude, Gemini, Perplexity, Copilot
   - Which ones work? Which ones don't?

3. **Memory Usage**
   - Does the extension slow down after long use?
   - Any memory leaks? (check Task Manager after 1+ hour)

4. **Data Persistence**
   - Do profiles survive browser restart?
   - Do settings persist correctly?

5. **Real-World Usage**
   - Does it actually protect your PII in practice?
   - Are there edge cases we missed?

---

## 🚨 Critical Issues to Report IMMEDIATELY

If you encounter any of these, please report ASAP:

1. **Data Loss**
   - Profiles disappearing
   - Settings resetting
   - Export/import failing

2. **Security Issues**
   - Real PII leaking through to AI platforms
   - Unencrypted data visible anywhere
   - Extension crashing on certain platforms

3. **Browser Crashes**
   - Extension causes browser to freeze/crash
   - Extension causes tabs to crash

4. **Privacy Violations**
   - Data being sent to external servers (other than AI platforms)
   - Unexpected network requests

---

## 📋 Testing Tips

### Verify PII Replacement
1. Open Browser DevTools (F12)
2. Go to "Network" tab
3. Send a message with PII
4. Click the network request
5. Check "Payload" or "Request" tab
6. Verify your real PII is NOT there (only aliases)

### Check Memory Usage
- Windows: Task Manager → Details → chrome.exe processes
- Mac: Activity Monitor → chrome processes
- Linux: htop or System Monitor

### Long Session Testing
1. Enable protection
2. Use normally for 1+ hours
3. Check if performance degrades
4. Check memory usage
5. Report if anything gets slow

---

## 🎁 Beta Tester Recognition

All beta testers who submit feedback will be:
- Listed in CONTRIBUTORS.md (if desired)
- Get early access to new features
- Receive a special "Beta Tester" badge (when we add user accounts)

**Would you like to be listed in contributors?**
- [ ] Yes, as: [Your name/username]
- [ ] No, anonymous testing is fine

---

## 🙏 Thank You!

Your time and feedback are incredibly valuable. Every bug you find, every suggestion you make, and every edge case you discover helps make PromptBlocker better for everyone who values their digital privacy.

**Questions?** Feel free to reach out anytime!

---

**Version:** 0.2.0-beta
**Testing Period:** January 10, 2025 - January 24, 2025
**Target Release:** February 2025 (Chrome Web Store)
