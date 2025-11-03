# Debugging Guide: Protection Failure Investigation

**Issue:** Extension shows "Active" but real PII was sent to Claude.ai

---

## Step 1: Check Console Logs

### On Claude.ai page, open DevTools Console (F12)

**Expected logs when page loads:**
```
🛡️ AI PII Sanitizer: Injector loaded
🛡️ AI PII Sanitizer: Active and monitoring
```

**Expected logs when sending message:**
```
🔒 AI PII Sanitizer: Intercepting https://claude.ai/api/organizations/...
🔄 Content script relaying: SUBSTITUTE_REQUEST
✅ Request substituted: 3 replacements
```

### What Each Log Means:

1. **"Injector loaded"** = inject.js successfully loaded
   - ❌ If MISSING: inject.js didn't load (timing or CSP issue)

2. **"Active and monitoring"** = fetch interception active
   - ❌ If MISSING: fetch override failed

3. **"Intercepting"** = Fetch call detected
   - ❌ If MISSING: URL pattern not matched or fetch not overridden

4. **"Content script relaying"** = Message sent to background
   - ❌ If MISSING: window.postMessage not working

5. **"Request substituted: X replacements"** = Substitution succeeded
   - ❌ If 0 replacements: Profile not matching or no PII found
   - ❌ If MISSING: Background script failed

---

## Step 2: Check Activity Log

1. Open extension popup
2. Go to "Debug" tab
3. Scroll to "Activity Log"
4. Look for the most recent entry

**What to check:**
- **Type:** Should be "interception" or "substitution"
- **Profiles Used:** Should list "Greg's Personal Profile"
- **PII Types Found:** Should list "email", "name", "address"
- **Substitution Count:** Should be > 0
- **Error:** Should be empty

**If Activity Log is empty:**
- Request never reached background script
- inject.js or content.ts failed

**If "Substitution Count: 0":**
- Profile not matching
- PII not detected
- Profile disabled

---

## Step 3: Check Profile Status

1. Open extension popup
2. Go to "Aliases" tab
3. Find "Greg's Personal Profile"

**Verify:**
- ✅ Green "Alias Enabled" button (not red "Disabled")
- ✅ Real data matches what you typed: "gregcbarker@gmail.com"
- ✅ Alias data exists: "chad@gladman.com"

---

## Step 4: Check Extension Settings

1. Open extension popup
2. Go to "Settings" tab
3. Check "Extension Status"

**Verify:**
- ✅ Extension should be "Enabled" (toggle ON)
- ✅ Protected Domains should include "claude.ai"

---

## Step 5: Check Manifest Permissions

In DevTools Console, run:
```javascript
chrome.permissions.getAll((permissions) => {
  console.log('Host Permissions:', permissions.origins);
});
```

**Expected output:**
```
Host Permissions: [
  "https://chat.openai.com/*",
  "https://chatgpt.com/*",
  "https://claude.ai/*",
  ...
]
```

❌ If claude.ai is MISSING: Manifest not loaded correctly

---

## Common Issues & Solutions

### Issue 1: inject.js Not Loading
**Symptoms:**
- No "Injector loaded" message
- No "Intercepting" messages

**Causes:**
- CSP blocking inline script
- Timing issue (loads after page scripts)
- inject.js not in dist/ folder

**Solutions:**
1. Check `dist/inject.js` exists
2. Check webpack.config.js has CopyPlugin for inject.js
3. Use external file (NOT inline textContent)

---

### Issue 2: Fetch Not Intercepted
**Symptoms:**
- "Injector loaded" appears
- NO "Intercepting" messages

**Causes:**
- URL pattern not matched
- Fetch already overridden by page
- Wrong fetch signature

**Solutions:**
1. Check aiDomains list in inject.js includes "claude.ai/api"
2. Verify `window.fetch === window.__nativeFetch` (if true, not intercepted)
3. Check if Claude uses XMLHttpRequest instead of fetch

---

### Issue 3: Profile Not Matching
**Symptoms:**
- "Intercepting" appears
- "Substitution Count: 0" in logs

**Causes:**
- Profile disabled
- Real data doesn't match input
- Case sensitivity issue
- Whitespace differences

**Solutions:**
1. Enable profile (green button)
2. Check exact string match: "gregcbarker@gmail.com" (no spaces)
3. Check aliasEngine matching logic

---

###Issue 4: Background Script Failed
**Symptoms:**
- "Content script relaying" appears
- NO "Request substituted" message
- Activity Log empty

**Causes:**
- Background script error
- AliasEngine not initialized
- Storage not loaded

**Solutions:**
1. Check background script console for errors
2. Verify StorageManager.getInstance() works
3. Check UserConfig loaded

---

## Debug Commands (Run in Console)

### Check if fetch is intercepted:
```javascript
console.log('Native fetch:', window.__nativeFetch);
console.log('Current fetch:', window.fetch);
console.log('Intercepted?', window.fetch !== window.__nativeFetch);
```

### Test message relay:
```javascript
window.postMessage({
  source: 'ai-pii-inject',
  messageId: 'test-123',
  type: 'SUBSTITUTE_REQUEST',
  payload: { body: '{"messages":[{"content":"Test"}]}', url: 'claude.ai/api/test' }
}, '*');
```

### Check extension status:
```javascript
chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
  console.log('Config:', response);
  console.log('Enabled?', response?.data?.settings?.enabled);
  console.log('Profiles:', response?.data?.profiles?.length);
});
```

---

## Next Steps

1. ✅ Run through all checks above
2. ✅ Note which logs are MISSING
3. ✅ Check Activity Log for errors
4. ✅ Report findings

**Most likely causes:**
1. inject.js timing issue (loads too late)
2. Profile matching bug (case/whitespace)
3. Claude.ai changed their API endpoint
4. Extension globally disabled

---

**Once you identify which logs are missing, we can pinpoint the exact issue!**
