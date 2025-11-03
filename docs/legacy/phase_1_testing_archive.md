# Phase 1 Testing Guide - AI PII Sanitizer

> **⚠️ ARCHIVED DOCUMENT**
>
> **Archived Date:** 2025-11-03
> **Reason:** This document was for Phase 1 MVP testing (October 2025). The extension has since been completed and modernized.
>
> **Current Testing Documentation:** See `docs/TESTING.md` for up-to-date testing information.
>
> **Historical Context:** This document was used during the initial build phase when only ChatGPT was fully supported. The extension now supports 5 platforms (ChatGPT, Claude, Gemini, Perplexity, Copilot) with 306 comprehensive tests.

---

# Original Document Content (Archived)

**Phase**: MVP Foundation (Week 1-4)
**Version**: 0.1.0
**Status**: Initial build complete, ready for testing
**Created**: October 2025

---

## What's Been Built So Far

### Completed Components
✅ **Core Architecture**
- TypeScript + Webpack build pipeline
- Chrome Manifest V3 extension structure
- Encrypted storage system
- Alias management system

✅ **Alias Engine** (`src/lib/aliasEngine.ts`)
- Bidirectional text substitution (real ↔ alias)
- Case preservation (Joe → John, JOE → JOHN)
- Possessive handling (Joe's → John's)
- Word boundary detection (won't replace "Joe" in "Joelle")

✅ **Storage Manager** (`src/lib/storage.ts`)
- Local encrypted storage using Web Crypto API
- CRUD operations for aliases
- Configuration management

✅ **Service Worker** (`src/background/serviceWorker.ts`)
- Message passing between components
- Request/response interception framework
- Alias dictionary management via messages

✅ **Content Script** (`src/content/content.ts`)
- Fetch API interception injection
- Communication bridge between page and extension
- Basic input monitoring (placeholder for Phase 2)

✅ **Popup UI** (`src/popup/`)
- Alias management interface
- Add/delete aliases
- Statistics display
- Clean, modern design

---

## How the Extension Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                            │
│                                                              │
│  1. User types: "Help me email Joe Smith"                   │
│                          ↓                                   │
│  2. Content Script intercepts fetch to AI API               │
│                          ↓                                   │
│  3. Service Worker substitutes: "Joe Smith" → "John Doe"    │
│                          ↓                                   │
│  4. Modified request sent to AI: "Help me email John Doe"   │
│                          ↓                                   │
│  5. AI responds: "Dear John Doe, ..."                       │
│                          ↓                                   │
│  6. Service Worker reverses: "John Doe" → "Joe Smith"       │
│                          ↓                                   │
│  7. User sees: "Dear Joe Smith, ..."                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Content Script** runs on AI chat pages (chat.openai.com, claude.ai, etc.)
2. It injects a fetch interceptor into the page context
3. When the page makes an API request, the interceptor catches it
4. Content script forwards request to **Service Worker** via Chrome messaging
5. Service Worker loads aliases and performs substitution
6. Modified request is sent to AI service
7. Response comes back, Service Worker reverses the substitution
8. User sees their original names in the response

### No API Keys Required!

The extension works at the **browser level**, not the API level:
- You visit chat.openai.com in your browser (logged in normally)
- The extension intercepts the browser's network requests
- Your OpenAI account/subscription is used as normal
- No API keys, no additional costs, no configuration needed

---

## Installation & Loading

### Step 1: Load Extension in Chrome

1. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```

2. Enable **Developer mode** (toggle in top-right corner)

3. Click **"Load unpacked"**

4. Navigate to your project and select the **`dist`** folder:
   ```
   H:\AI_Interceptor\dist
   ```

5. The extension should appear with the name **"AI PII Sanitizer"**

### Step 2: Verify Installation

**Expected Results:**
- Extension appears in Chrome extensions list
- Status shows "Service worker (Inactive)" - this is normal
- No errors in the extensions page

**Known Issue:**
- Extension icon will be a default placeholder (we haven't created icon images yet)

### Step 3: Check Console for Errors

1. Click **"Service worker"** link in the extension card
2. A DevTools window opens showing the service worker console
3. Should see: `AI PII Sanitizer installed`
4. **If you see errors**: Check the troubleshooting section below

---

## Testing the Popup UI

### Test 1: Open the Popup

1. Click the extension icon in Chrome toolbar (or pin it first)
2. Popup window should open (350px wide)

**Expected:**
- Header shows "AI PII Sanitizer"
- Status indicator shows "Active" with green dot
- Stats show "Protected: 0" and "Aliases: 0"
- Empty state message: "No aliases yet"
- "+ Add" button visible

**Screenshot of Expected UI:**
```
┌────────────────────────────────────┐
│ AI PII Sanitizer    ⚫ Active      │ (purple gradient header)
├────────────────────────────────────┤
│  Protected    │    Aliases         │
│      0        │       0            │
├────────────────────────────────────┤
│ Aliases              [+ Add]       │
│                                    │
│     No aliases yet                 │
│ Add your first alias to start      │
│   protecting your privacy          │
└────────────────────────────────────┘
```

---

### Test 2: Add Your First Alias

1. Click **"+ Add"** button
2. Form appears with three fields

**Test Case 2.1: Successful Add**

Input:
- Real Name: `Joe Smith`
- Alias Name: `John Doe`
- Category: `test` (optional)

Actions:
1. Fill in the form
2. Click **"Save"**

**Expected:**
- Form disappears
- Alias appears in list showing:
  - "Joe Smith"
  - "→ John Doe"
  - Delete button (🗑️)
- "Aliases: 1" counter updates
- Empty state disappears

**Test Case 2.2: Validation**

1. Click "+ Add" again
2. Leave "Real Name" empty
3. Click "Save"

**Expected:**
- Browser validation error (HTML5 required field)
- Form stays open

---

### Test 3: Manage Aliases

**Test Case 3.1: Add Multiple Aliases**

Add these aliases:
1. `Sarah Chen` → `Emma Wilson` (category: `work`)
2. `Dr. Martinez` → `Dr. Johnson` (category: `medical`)
3. `Mom` → `Mary` (category: `family`)

**Expected:**
- All aliases appear in list
- "Aliases: 4" counter (including Joe Smith from Test 2)

**Test Case 3.2: Delete an Alias**

1. Click 🗑️ on "Mom → Mary"
2. Confirm deletion dialog appears
3. Click "OK"

**Expected:**
- Alias disappears from list
- "Aliases: 3" counter updates
- No errors in console

**Test Case 3.3: Data Persistence**

1. Close the popup
2. Open the popup again

**Expected:**
- All 3 remaining aliases still visible
- Counts correct
- Data persisted in Chrome storage

---

## Testing Core Functionality (Limited in Phase 1)

### Current State: Framework Ready, Integration Incomplete

**What's Working:**
✅ Aliases are stored and managed
✅ Alias engine can substitute text
✅ Fetch interceptor is injected into pages
✅ Message passing works between components

**What's NOT Working Yet:**
❌ **Actual AI request interception** - The API endpoint detection may not match real API calls
❌ **Response reversal in live chat** - Needs real-world testing and refinement
❌ **Input highlighting** - Placeholder for Phase 2 (Week 5)

### Manual Test of Alias Engine

You can test the core substitution logic via browser console:

1. Open Chrome DevTools (F12)
2. Go to the Console tab
3. Test the substitution logic:

```javascript
// Note: This is a conceptual test - actual implementation is in background
// We'll add proper testing tools in Phase 2
```

For now, the alias engine has **unit tests** you can run:

```bash
npm test
```

**Expected Output:**
- Tests for case preservation
- Tests for possessive handling
- Tests for bidirectional substitution
- All tests should pass

---

## Testing AI Service Integration (Manual)

### ⚠️ Important Disclaimer

**Phase 1 Status**: The interception framework is built, but we haven't tested it against live AI services yet. The API endpoints and request/response formats may have changed since documentation was written.

**What You Can Try:**

### Test with ChatGPT

1. Make sure you have aliases added (e.g., "Joe Smith" → "John Doe")
2. Open a new tab and go to: `https://chat.openai.com`
3. Log in if needed
4. Open Chrome DevTools (F12) → Console tab
5. You should see: `AI PII Sanitizer: Active`

**Try a Simple Prompt:**
```
Type: "Tell me a story about Joe Smith going to the park"
```

**What to Check:**

✅ **Check Service Worker Console:**
1. Go to `chrome://extensions/`
2. Click "Service worker" link under AI PII Sanitizer
3. Look for log messages like:
   - "Substituted: X items"
   - "Decoded: X items"

✅ **Check Content Script Console:**
1. In the ChatGPT tab, open DevTools
2. Look for fetch intercept messages

**Expected Behavior (if working):**
- Your prompt gets intercepted
- "Joe Smith" replaced with "John Doe" before sending to ChatGPT
- ChatGPT responds mentioning "John Doe"
- Response gets reversed back to show "Joe Smith"

**Likely Outcome in Phase 1:**
- ⚠️ **Interception may not trigger** - API endpoints might be different than expected
- ⚠️ **Request format may be wrong** - We used educated guesses from docs
- 💡 **This is expected!** - Phase 1 is foundation, Phase 2 is integration refinement

---

## Troubleshooting

### Extension Won't Load

**Error**: "Manifest file is missing or unreadable"
- **Fix**: Make sure you selected the `dist` folder, not `src`

**Error**: "Service worker registration failed"
- **Fix**: Check `dist/background.js` exists
- Run `npm run build` again

### Popup Doesn't Open

**Symptom**: Clicking extension icon does nothing

**Fixes**:
1. Check if `dist/popup.html` exists
2. Right-click extension icon → Inspect popup
3. Look for errors in popup DevTools

### No Aliases Appear After Adding

**Symptom**: Alias form submits but nothing shows up

**Debugging**:
1. Open popup
2. Right-click → Inspect
3. Go to Console tab
4. Look for errors like "chrome.runtime.sendMessage failed"

**Possible Cause**: Service worker crashed
- Go to `chrome://extensions/`
- Click "Reload" button under extension
- Try again

### Storage Encryption Fails

**Error in console**: "Failed to decrypt aliases"

**Fix**:
1. Go to Chrome DevTools → Application tab
2. Storage → Local Storage → Extension
3. Clear all data
4. Reload extension
5. Re-add aliases

---

## Known Limitations (Phase 1)

### AI Service Integration
- **ChatGPT, Claude, Gemini**: API endpoints are guesses based on documentation
- **Streaming responses**: Not handled yet (AI services often stream responses)
- **Multi-turn conversations**: Context tracking not implemented
- **Error handling**: Basic at best

### Alias Engine
- **Name types only**: No email, phone, address support yet
- **English only**: Case handling assumes English text
- **Pronouns**: Not tracked ("he/she" won't be context-aware)
- **New entities**: If AI generates new names, they won't be flagged

### UI
- **No settings page**: All settings hardcoded
- **No search/filter**: Can't search aliases if you have many
- **No bulk import/export**: Can't load aliases from file
- **No icons**: Extension uses Chrome default icon

### Performance
- **No caching**: Each substitution recalculates everything
- **No web workers**: Heavy processing blocks main thread
- **Large text**: Untested with very long prompts (>10KB)

---

## Success Criteria for Phase 1

Based on the TDD roadmap (Week 1-4), Phase 1 is complete when:

✅ **Foundation** (We're Here!)
- [x] TypeScript + Webpack working
- [x] Extension loads without errors
- [x] Popup UI functional
- [x] Aliases can be added/deleted
- [x] Data persists across sessions
- [x] Basic storage encryption works

⏳ **Integration** (Next Steps)
- [ ] Request interception working on ChatGPT
- [ ] Response reversal working on ChatGPT
- [ ] Manual end-to-end test successful
- [ ] Unit tests pass (run `npm test`)

---

## Next Steps: Moving to Phase 2

Once you've tested and we've fixed any issues:

### Week 2 Tasks (Substitution Engine Polish)
- Fix any bugs found in testing
- Improve case preservation edge cases
- Add more comprehensive unit tests
- Performance optimization

### Week 3 Tasks (Request Interception)
- **Debug real API endpoints** for ChatGPT/Claude/Gemini
- Handle streaming responses
- Better error handling
- Test with real conversations

### Week 4 Tasks (Integration Testing)
- End-to-end testing on all 3 AI services
- Edge case handling
- User acceptance testing
- Bug fixes

---

## Feedback & Issues

As you test, please note:

1. **What works**: Features that work as expected
2. **What breaks**: Errors, crashes, unexpected behavior
3. **What's confusing**: UX issues, unclear features
4. **What's missing**: Critical features for MVP

We'll use this feedback to refine Phase 1 and plan Phase 2 improvements.

---

## Quick Reference: Testing Checklist

```
Phase 1 Basic Testing Checklist:

Extension Loading:
[ ] Extension loads without errors
[ ] Service worker active
[ ] No console errors on install

Popup UI:
[ ] Popup opens correctly
[ ] Can add alias
[ ] Alias appears in list
[ ] Can delete alias
[ ] Data persists after closing popup
[ ] Counter updates correctly

Storage:
[ ] Aliases saved to Chrome storage
[ ] Data persists after browser restart
[ ] No encryption errors

Unit Tests:
[ ] Run `npm test`
[ ] All tests pass

AI Integration (Experimental):
[ ] Visit chat.openai.com
[ ] Extension console shows "Active"
[ ] Try sending prompt with alias name
[ ] Check service worker logs
[ ] Note any interception behavior

Known Issues:
[ ] No icons (expected)
[ ] AI interception may not work yet (expected)
[ ] No input highlighting (Phase 2 feature)
```

---

**Happy Testing!** 🧪

If you hit any blockers or find critical bugs, stop testing and we'll debug together.
