# Implementation Guide: Fix for Paragraph Truncation Bug

**Date:** October 17, 2025  
**Status:** 🔧 READY TO IMPLEMENT  
**File:** `src/background/serviceWorker.ts`

---

## 📋 Implementation Steps

### Step 1: Add the New `substituteInPlace()` Function

**Location:** After `handleSubstituteResponse()` function (around line 365)

**Action:** Add this new function:

```typescript
/**
 * Substitute text in-place without extraction (FIXED VERSION)
 * This preserves message structure and handles multi-paragraph content correctly
 */
async function substituteInPlace(data: any, aliasEngine: AliasEngine): Promise<{
  data: any;
  substitutionCount: number;
  profilesMatched: Array<{ profileName: string; piiTypes: string[] }>;
}> {
  const modified = JSON.parse(JSON.stringify(data)); // Deep clone
  let totalSubstitutions = 0;
  const profileMatchesMap = new Map<string, Set<string>>();

  // ChatGPT format: { messages: [{ role, content }] }
  if (modified.messages && Array.isArray(modified.messages)) {
    for (let i = 0; i < modified.messages.length; i++) {
      const msg = modified.messages[i];
      
      if (!msg.content) continue;

      // String content
      if (typeof msg.content === 'string') {
        const substituted = aliasEngine.substitute(msg.content, 'encode');
        modified.messages[i].content = substituted.text;
        totalSubstitutions += substituted.substitutions.length;
        
        // Track profile matches
        if (substituted.profilesMatched) {
          for (const match of substituted.profilesMatched) {
            if (!profileMatchesMap.has(match.profileName)) {
              profileMatchesMap.set(match.profileName, new Set());
            }
            for (const piiType of match.piiTypes) {
              profileMatchesMap.get(match.profileName)!.add(piiType);
            }
          }
        }
      }
      
      // Nested object: { content_type: "text", parts: [...] }
      else if (msg.content.parts && Array.isArray(msg.content.parts)) {
        for (let j = 0; j < msg.content.parts.length; j++) {
          const substituted = aliasEngine.substitute(msg.content.parts[j], 'encode');
          modified.messages[i].content.parts[j] = substituted.text;
          totalSubstitutions += substituted.substitutions.length;
          
          // Track profile matches
          if (substituted.profilesMatched) {
            for (const match of substituted.profilesMatched) {
              if (!profileMatchesMap.has(match.profileName)) {
                profileMatchesMap.set(match.profileName, new Set());
              }
              for (const piiType of match.piiTypes) {
                profileMatchesMap.get(match.profileName)!.add(piiType);
              }
            }
          }
        }
      }
      
      // Array of content blocks
      else if (Array.isArray(msg.content)) {
        for (let j = 0; j < msg.content.length; j++) {
          const block = msg.content[j];
          if (typeof block === 'string') {
            const substituted = aliasEngine.substitute(block, 'encode');
            modified.messages[i].content[j] = substituted.text;
            totalSubstitutions += substituted.substitutions.length;
            
            // Track profile matches
            if (substituted.profilesMatched) {
              for (const match of substituted.profilesMatched) {
                if (!profileMatchesMap.has(match.profileName)) {
                  profileMatchesMap.set(match.profileName, new Set());
                }
                for (const piiType of match.piiTypes) {
                  profileMatchesMap.get(match.profileName)!.add(piiType);
                }
              }
            }
          } else if (block.text) {
            const substituted = aliasEngine.substitute(block.text, 'encode');
            modified.messages[i].content[j].text = substituted.text;
            totalSubstitutions += substituted.substitutions.length;
            
            // Track profile matches
            if (substituted.profilesMatched) {
              for (const match of substituted.profilesMatched) {
                if (!profileMatchesMap.has(match.profileName)) {
                  profileMatchesMap.set(match.profileName, new Set());
                }
                for (const piiType of match.piiTypes) {
                  profileMatchesMap.get(match.profileName)!.add(piiType);
                }
              }
            }
          }
        }
      }
    }
  }

  // Claude format: { prompt: "..." }
  else if (modified.prompt && typeof modified.prompt === 'string') {
    const substituted = aliasEngine.substitute(modified.prompt, 'encode');
    modified.prompt = substituted.text;
    totalSubstitutions += substituted.substitutions.length;
    
    // Track profile matches
    if (substituted.profilesMatched) {
      for (const match of substituted.profilesMatched) {
        if (!profileMatchesMap.has(match.profileName)) {
          profileMatchesMap.set(match.profileName, new Set());
        }
        for (const piiType of match.piiTypes) {
          profileMatchesMap.get(match.profileName)!.add(piiType);
        }
      }
    }
  }

  // Gemini format: { contents: [{ parts: [{ text }] }] }
  else if (modified.contents && Array.isArray(modified.contents)) {
    for (let i = 0; i < modified.contents.length; i++) {
      const content = modified.contents[i];
      if (content.parts && Array.isArray(content.parts)) {
        for (let j = 0; j < content.parts.length; j++) {
          const part = content.parts[j];
          if (part.text) {
            const substituted = aliasEngine.substitute(part.text, 'encode');
            modified.contents[i].parts[j].text = substituted.text;
            totalSubstitutions += substituted.substitutions.length;
            
            // Track profile matches
            if (substituted.profilesMatched) {
              for (const match of substituted.profilesMatched) {
                if (!profileMatchesMap.has(match.profileName)) {
                  profileMatchesMap.set(match.profileName, new Set());
                }
                for (const piiType of match.piiTypes) {
                  profileMatchesMap.get(match.profileName)!.add(piiType);
                }
              }
            }
          }
        }
      }
    }
  }

  // Convert profile matches to array
  const profilesMatched = Array.from(profileMatchesMap.entries()).map(([profileName, piiTypes]) => ({
    profileName,
    piiTypes: Array.from(piiTypes)
  }));

  return {
    data: modified,
    substitutionCount: totalSubstitutions,
    profilesMatched
  };
}
```

---

### Step 2: Update `handleSubstituteRequest()` Function

**Location:** Around line 132-210

**Find this section:**
```typescript
    // Extract all text content from messages/prompt
    const textContent = extractAllText(requestData);

    console.log('📝 Extracted text:', textContent.substring(0, 300));

    if (!textContent) {
      console.log('⚠️ No text extracted from request');
      return {
        success: true,
        modifiedBody: body,
        substitutions: 0,
      };
    }

    // Apply substitution (real → alias)
    const aliasEngine = await AliasEngine.getInstance();
    const profiles = aliasEngine.getProfiles();
    console.log('📋 Active profiles:', profiles.length, '-', profiles.map((p: any) => p.profileName).join(', '));

    const substituted = aliasEngine.substitute(textContent, 'encode');

    console.log('✅ Request substituted:', substituted.substitutions.length, 'replacements');
    if (substituted.substitutions.length > 0) {
      console.log('🔀 Changes:', substituted.substitutions);

      // Log activity for debug console
      const serviceName = service === 'chatgpt' ? 'ChatGPT' :
                         service === 'claude' ? 'Claude' :
                         service === 'gemini' ? 'Gemini' :
                         service === 'perplexity' ? 'Perplexity' :
                         service === 'poe' ? 'Poe' :
                         service === 'copilot' ? 'Copilot' :
                         service === 'you' ? 'You.com' : 'Unknown';

      logActivity({
        type: 'substitution',
        service: service,
        details: {
          url: serviceName,
          profilesUsed: substituted.profilesMatched?.map(p => p.profileName) || [],
          piiTypesFound: substituted.profilesMatched?.flatMap(p => p.piiTypes) || [],
          substitutionCount: substituted.substitutions.length,
        },
        message: `${serviceName}: ${substituted.substitutions.length} items replaced`,
      });
    }

    // Reconstruct request body with substituted text
    let modifiedText = substituted.text;
```

**Replace with:**
```typescript
    // Apply in-place substitution (real → alias)
    const aliasEngine = await AliasEngine.getInstance();
    const profiles = aliasEngine.getProfiles();
    console.log('📋 Active profiles:', profiles.length, '-', profiles.map((p: any) => p.profileName).join(', '));

    // Substitute in-place without extracting/joining
    const result = await substituteInPlace(requestData, aliasEngine);
    const modifiedRequestData = result.data;
    const totalSubstitutions = result.substitutionCount;
    const profilesMatched = result.profilesMatched;

    console.log('✅ Request substituted:', totalSubstitutions, 'replacements');
    if (totalSubstitutions > 0) {
      console.log('🔀 Substitutions applied in-place');

      // Log activity for debug console
      const serviceName = service === 'chatgpt' ? 'ChatGPT' :
                         service === 'claude' ? 'Claude' :
                         service === 'gemini' ? 'Gemini' :
                         service === 'perplexity' ? 'Perplexity' :
                         service === 'poe' ? 'Poe' :
                         service === 'copilot' ? 'Copilot' :
                         service === 'you' ? 'You.com' : 'Unknown';

      logActivity({
        type: 'substitution',
        service: service,
        details: {
          url: serviceName,
          profilesUsed: profilesMatched.map((p: any) => p.profileName),
          piiTypesFound: profilesMatched.flatMap((p: any) => p.piiTypes),
          substitutionCount: totalSubstitutions,
        },
        message: `${serviceName}: ${totalSubstitutions} items replaced`,
      });
    }

    // Get all text for API key detection (join all content)
    let modifiedText = extractAllText(modifiedRequestData);
```

---

### Step 3: Update the Final Return Statement

**Location:** End of `handleSubstituteRequest()` function (around line 320-330)

**Find this:**
```typescript
    // Reconstruct request body with modified text (PII + API keys substituted)
    const modifiedRequestData = replaceAllText(requestData, modifiedText);

    return {
      success: true,
      modifiedBody: JSON.stringify(modifiedRequestData),
      substitutions: substituted.substitutions.length,
    };
```

**Replace with:**
```typescript
    // If API keys were redacted, apply them back to the data structure
    if (modifiedText !== extractAllText(modifiedRequestData)) {
      // Re-apply in-place substitution with the API-key-redacted text
      const finalResult = await replaceAllTextWithRedacted(modifiedRequestData, modifiedText);
      return {
        success: true,
        modifiedBody: JSON.stringify(finalResult),
        substitutions: totalSubstitutions,
      };
    }

    return {
      success: true,
      modifiedBody: JSON.stringify(modifiedRequestData),
      substitutions: totalSubstitutions,
    };
```

---

### Step 4: Add `replaceAllTextWithRedacted()` Helper Function

**Location:** After `extractAllText()` function (around line 430)

**Action:** Add this function:

```typescript
/**
 * Apply redacted text back to data structure (for API key redaction)
 */
async function replaceAllTextWithRedacted(data: any, redactedText: string): Promise<any> {
  const modified = JSON.parse(JSON.stringify(data)); // Deep clone
  
  // Split redacted text back into message parts (same delimiter as extraction)
  const textParts = redactedText.split('\n\n').filter(Boolean);
  let partIndex = 0;

  // ChatGPT format
  if (modified.messages && Array.isArray(modified.messages)) {
    for (let i = 0; i < modified.messages.length; i++) {
      const msg = modified.messages[i];
      
      if (!msg.content) continue;

      // String content
      if (typeof msg.content === 'string' && msg.content) {
        if (partIndex < textParts.length) {
          modified.messages[i].content = textParts[partIndex++];
        }
      }
      
      // Nested object format
      else if (msg.content.parts && Array.isArray(msg.content.parts)) {
        if (partIndex < textParts.length) {
          modified.messages[i].content.parts = [textParts[partIndex++]];
        }
      }
      
      // Array of content blocks
      else if (Array.isArray(msg.content)) {
        for (let j = 0; j < msg.content.length; j++) {
          const block = msg.content[j];
          if (partIndex >= textParts.length) break;
          
          if (typeof block === 'string') {
            modified.messages[i].content[j] = textParts[partIndex++];
          } else if (block.text) {
            modified.messages[i].content[j].text = textParts[partIndex++];
          }
        }
      }
    }
  }

  // Claude format
  else if (modified.prompt && typeof modified.prompt === 'string') {
    modified.prompt = redactedText;
  }

  // Gemini format
  else if (modified.contents && Array.isArray(modified.contents)) {
    for (let i = 0; i < modified.contents.length; i++) {
      const content = modified.contents[i];
      if (content.parts && Array.isArray(content.parts)) {
        for (let j = 0; j < content.parts.length; j++) {
          const part = content.parts[j];
          if (part.text && partIndex < textParts.length) {
            modified.contents[i].parts[j].text = textParts[partIndex++];
          }
        }
      }
    }
  }

  return modified;
}
```

---

### Step 5: Rename Old `replaceAllText()` Function (Optional)

**Location:** Around line 462

**Action:** Rename to indicate it's deprecated:

```typescript
/**
 * DEPRECATED: Old function that caused the paragraph truncation bug
 * Kept for reference but should not be used
 */
function replaceAllText_DEPRECATED(data: any, substitutedText: string): any {
  // ... existing code ...
}
```

---

## ✅ Verification Steps

After implementing:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Check for TypeScript errors:**
   ```bash
   npm run type-check
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Manual testing:**
   - Load extension in Chrome
   - Open ChatGPT
   - Send multi-paragraph message:
     ```
     Hi, my name is Joe Smith.
     
     I work at Acme Corp as a software engineer.
     
     Can you help me write a resume for a new role at Google?
     ```
   - Open Chrome DevTools Network tab
   - Verify ALL paragraphs are sent (not just first one)
   - Verify substitutions are applied correctly

---

## 📊 Expected Results

- ✅ All paragraphs sent to AI services
- ✅ PII substitutions applied correctly
- ✅ API key detection still works
- ✅ No regression in existing functionality
- ✅ All tests passing

---

## 🔙 Rollback Plan

If issues occur:
```bash
git checkout src/background/serviceWorker.ts
npm run build
```

---

## 📝 Notes

- The fix changes the architecture from extract→substitute→replace to in-place substitution
- This eliminates the paragraph truncation bug caused by splitting on `\n\n`
- API key detection still works because we extract text AFTER PII substitution
- The old `replaceAllText()` function can be safely removed after testing
