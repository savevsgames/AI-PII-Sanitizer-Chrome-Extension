# AliasEngine & Alias Mapping System Analysis

**Date:** November 7, 2025
**Feature:** Document Analysis
**Purpose:** Understanding how PII detection and substitution works

---

## Executive Summary

The **AliasEngine** is the core of Prompt Blocker's PII protection system. It performs **bidirectional text substitution** with **case preservation**, **fuzzy matching via variations**, and **profile-based organization**.

**Key Capabilities:**
- Real ↔ Alias bidirectional substitution
- Case-preserving replacements ("Greg Barker" → "John Doe", "GREG BARKER" → "JOHN DOE")
- Variation matching (auto-generated + custom)
- Profile-based multi-PII detection
- Possessive handling ("Greg's" → "John's")
- Word boundary detection (prevents partial matches)

**Perfect for Document Analysis:** The engine is already built to handle large text blocks - we just need to integrate it with document parsing.

---

## Architecture Overview

**Location:** `src/lib/aliasEngine.ts`

### Singleton Pattern

```typescript
export class AliasEngine {
  private static instance: AliasEngine;
  private profiles: AliasProfile[] = [];
  private realToAliasMap: Map<string, PIIMapping> = new Map();
  private aliasToRealMap: Map<string, PIIMapping> = new Map();

  public static async getInstance(): Promise<AliasEngine> {
    if (!AliasEngine.instance) {
      AliasEngine.instance = new AliasEngine();
      await AliasEngine.instance.loadProfiles();
    }
    return AliasEngine.instance;
  }
}
```

**Key Design:**
- Single instance shared across all contexts
- Pre-built lookup maps for O(1) PII detection
- Profiles loaded once, maps rebuilt when profiles change

---

## Profile Structure

**Location:** `src/lib/types.ts` lines 56-121

```typescript
interface AliasProfile {
  id: string;                    // UUID
  profileName: string;           // "Greg - Work"
  description?: string;
  enabled: boolean;              // Only enabled profiles are used

  // Real identity (PII to protect)
  real: IdentityData;            // { name, email, phone, address, company, ... }

  // Alias identity (fake data to use)
  alias: IdentityData;           // { name, email, phone, address, company, ... }

  // Auto-generated variations (fuzzy matching)
  variations?: {
    real: Record<string, string[]>;   // { name: ["Greg Barker", "GregBarker", ...] }
    alias: Record<string, string[]>;  // { name: ["John Doe", "JohnDoe", ...] }
  };

  // User-added custom variations
  customVariations?: {
    real: Record<string, Array<{ value: string; enabled: boolean }>>;
    alias: Record<string, Array<{ value: string; enabled: boolean }>>;
  };

  // Disabled auto-generated variations
  disabledVariations?: {
    real: Record<string, string[]>;
    alias: Record<string, string[]>;
  };

  // Metadata
  metadata: {
    createdAt: number;
    updatedAt: number;
    usageStats: {
      totalSubstitutions: number;
      lastUsed: number;
      byService: { chatgpt, claude, gemini, perplexity, copilot };
      byPIIType: { name, email, phone, address, company, custom };
    };
    confidence: number;  // 0-1 for auto-detected profiles
  };

  // Per-profile settings
  settings: {
    autoReplace: boolean;          // Auto-replace or warn first
    highlightInUI: boolean;        // Show visual highlights
    activeServices: string[];      // Which AI services to protect
    enableVariations: boolean;     // Use fuzzy matching
  };
}
```

**Implications for Document Analysis:**
- Each document can be analyzed against **all enabled profiles**
- Multiple profiles can match in a single document (e.g., "Greg - Work" + "Sarah - Personal")
- Variation matching catches different spellings/formats
- Stats track which PII types are most common

---

## PII Types Supported

```typescript
type PIIType = 'name' | 'email' | 'phone' | 'cellPhone' | 'address' | 'company' | 'custom';
```

**Standard Fields:**
- `name` - Full name
- `email` - Email address
- `phone` - Phone number
- `cellPhone` - Cell phone (separate from landline)
- `address` - Physical address
- `company` - Company name
- `jobTitle` - Job title (implied, needs verification)

**Custom Fields:**
- Extensible `custom: Record<string, string>` for user-defined PII
- Examples: SSN, employee ID, project codenames, etc.

**For Document Analysis:**
- Documents often contain all PII types
- Need comprehensive detection across all fields
- Consider adding document-specific PII types (e.g., case numbers, patient IDs)

---

## Lookup Map System

**Location:** `src/lib/aliasEngine.ts` lines 85-187

### buildLookupMaps() Process

```typescript
private buildLookupMaps(): void {
  this.realToAliasMap.clear();
  this.aliasToRealMap.clear();

  const piiFields: PIIType[] = ['name', 'email', 'phone', 'cellPhone', 'address', 'company'];

  for (const profile of this.profiles) {
    if (!profile.enabled) continue;  // Skip disabled profiles

    for (const piiType of piiFields) {
      const realValue = profile.real[piiType];
      const aliasValue = profile.alias[piiType];

      if (realValue && aliasValue) {
        const mapping: PIIMapping = {
          real: realValue,
          alias: aliasValue,
          profileId: profile.id,
          profileName: profile.profileName,
          piiType,
        };

        // Add primary values (case-insensitive keys)
        this.realToAliasMap.set(realValue.toLowerCase(), mapping);
        this.aliasToRealMap.set(aliasValue.toLowerCase(), mapping);

        // Add auto-generated variations (if enabled)
        if (profile.settings.enableVariations && profile.variations) {
          const realVariations = profile.variations.real[piiType] || [];
          for (const variation of realVariations) {
            if (!profile.disabledVariations?.real[piiType]?.includes(variation)) {
              this.realToAliasMap.set(variation.toLowerCase(), mapping);
            }
          }
        }

        // Add custom variations (if enabled)
        if (profile.customVariations) {
          const customRealVariations = profile.customVariations.real[piiType] || [];
          for (const varObj of customRealVariations) {
            if (varObj.enabled) {
              this.realToAliasMap.set(varObj.value.toLowerCase(), mapping);
            }
          }
        }
      }
    }
  }
}
```

**Key Features:**
- **Case-insensitive matching:** All keys stored as `.toLowerCase()`
- **Variation support:** Auto-generated + custom variations
- **Disabled variation handling:** Skip explicitly disabled variations
- **Efficient O(1) lookup:** Direct map access

**Example Lookup Map:**

```javascript
realToAliasMap = {
  "greg barker": { real: "Greg Barker", alias: "John Doe", profileId: "abc", piiType: "name" },
  "gregbarker": { real: "Greg Barker", alias: "John Doe", ... },
  "greg.barker": { real: "Greg Barker", alias: "John Doe", ... },
  "g.barker": { real: "Greg Barker", alias: "John Doe", ... },
  "greg@example.com": { real: "greg@example.com", alias: "john@example.com", ... }
}
```

---

## Substitution Algorithm

**Location:** `src/lib/aliasEngine.ts` lines 195-300

### substitute() Method

```typescript
substitute(
  text: string,
  direction: 'encode' | 'decode',
  options?: SubstitutionOptions
): SubstitutionResult
```

**Parameters:**
- `text` - Input text to process
- `direction` -
  - `'encode'` = real → alias (sanitize)
  - `'decode'` = alias → real (restore)
- `options` -
  - `mode: 'detect-only'` - Find PII without replacing
  - `profileIds: string[]` - Limit to specific profiles

**Returns:**
```typescript
interface SubstitutionResult {
  text: string;                   // Modified text
  substitutions: Array<{          // List of all replacements
    from: string;
    to: string;
    position: number;
    profileId?: string;
    piiType?: string;
  }>;
  confidence: number;             // 0-1 based on match count
  profilesMatched?: Array<{       // Which profiles were used
    profileId: string;
    profileName: string;
    piiTypes: string[];
    matches: Array<{
      type: string;
      value: string;
      position: number;
    }>;
  }>;
}
```

### Algorithm Steps

1. **Select Map:**
   ```typescript
   const map = direction === 'encode' ? this.realToAliasMap : this.aliasToRealMap;
   ```

2. **Sort Keys by Length (Longest First):**
   ```typescript
   const sortedKeys = Array.from(map.keys()).sort((a, b) => b.length - a.length);
   ```
   **Why:** Prevents partial matches. "Greg Barker" must be matched before "Greg".

3. **For Each Key:**
   ```typescript
   for (const key of sortedKeys) {
     const mapping = map.get(key);
     const replacement = direction === 'encode' ? mapping.alias : mapping.real;

     // Create regex with word boundaries
     const regex = new RegExp(`\\b${this.escapeRegex(key)}\\b`, 'gi');

     // Find all matches
     let match;
     while ((match = regex.exec(result)) !== null) {
       matches.push({ match: match[0], index: match.index });
     }

     // Replace with case preservation (reverse order to preserve indices)
     for (let i = matches.length - 1; i >= 0; i--) {
       const preserved = this.preserveCase(match.match, replacement);
       result = result.substring(0, index) + preserved + result.substring(index + length);
     }
   }
   ```

4. **Handle Possessives:**
   ```typescript
   result = this.handlePossessives(result, map, direction);
   ```

5. **Return Result:**
   ```typescript
   return {
     text: result,
     substitutions,
     confidence: this.calculateConfidence(substitutions.length),
     profilesMatched: [...]
   };
   ```

---

## Case Preservation

**Location:** `src/lib/aliasEngine.ts` (inferred from description)

```typescript
private preserveCase(original: string, replacement: string): string {
  // If original is ALL CAPS → return ALL CAPS replacement
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }

  // If original is Title Case → return Title Case replacement
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  // Otherwise → return lowercase replacement
  return replacement.toLowerCase();
}
```

**Examples:**
- "Greg Barker" → "John Doe"
- "GREG BARKER" → "JOHN DOE"
- "greg barker" → "john doe"
- "Greg's project" → "John's project"

**For Document Analysis:**
- Critical for maintaining document formatting
- Professional documents often mix case styles
- Headers (ALL CAPS), body (Title Case), code (lowercase)

---

## Word Boundary Detection

**Pattern:** `\b${escapedKey}\b`

**Prevents partial matches:**
- ❌ "Gregory" should NOT match "Greg"
- ✅ "Greg Barker" should match "Greg Barker"
- ✅ "Contact Greg" should match "Greg"

**Edge Cases:**
- Emails: `greg@example.com` → word boundary at `@` works correctly
- Hyphenated: "Greg-Barker" → may NOT match "Greg Barker" (needs testing)
- Apostrophes: "Greg's" → handled separately by `handlePossessives()`

---

## Variation Generation

**Location:** `src/lib/aliasVariations.ts`

```typescript
export function generateIdentityVariations(identity: IdentityData): {
  real: Record<string, string[]>;
  alias: Record<string, string[]>;
}
```

**Auto-Generated Variations for Names:**
```javascript
"Greg Barker" generates:
  - "greg barker"
  - "gregbarker"
  - "Greg.Barker"
  - "greg.barker"
  - "G Barker"
  - "G.Barker"
  - "Barker, Greg"
```

**For Emails:**
```javascript
"greg@example.com" generates:
  - "greg"
  - "greg@example"
```

**For Documents:**
- Variations catch different formatting styles
- OCR errors might produce slight variations
- Copy-paste from different sources may have spacing differences

---

## Custom Variations

Users can add their own variations:

```typescript
customVariations: {
  real: {
    name: [
      { value: "G. Barker", enabled: true },
      { value: "Gregory Barker", enabled: true },
      { value: "Greg B.", enabled: false }  // User disabled this one
    ]
  }
}
```

**Use Case for Documents:**
- User knows their documents use specific abbreviations
- Company-specific formatting (e.g., "Barker, Gregory (Greg)")
- Nicknames or alternate names

---

## Possessive Handling

**Location:** `src/lib/aliasEngine.ts` (method: `handlePossessives()`)

**Challenge:** Word boundaries don't catch possessives:
- "Greg's project" → Word boundary after "Greg" doesn't include "'s"
- Regex: `\bGreg\b` matches "Greg" but misses the "'s"

**Solution:**
```typescript
private handlePossessives(text: string, map: Map<string, PIIMapping>, direction: string): string {
  // Find all "Name's" patterns
  for (const [key, mapping] of map.entries()) {
    const possessivePattern = new RegExp(`\\b${this.escapeRegex(key)}'s\\b`, 'gi');
    const replacement = direction === 'encode' ? mapping.alias : mapping.real;

    text = text.replace(possessivePattern, (match) => {
      const preserved = this.preserveCase(match.replace(/'s$/, ''), replacement);
      return preserved + "'s";
    });
  }

  return text;
}
```

**Examples:**
- "Greg's document" → "John's document"
- "GREG'S PROJECT" → "JOHN'S PROJECT"
- "Contact Greg's team" → "Contact John's team"

---

## Confidence Scoring

**Location:** `src/lib/aliasEngine.ts` (method: `calculateConfidence()`)

```typescript
private calculateConfidence(substitutionCount: number): number {
  // More substitutions = higher confidence
  // Exponential curve: confidence approaches 1 as count increases
  return Math.min(1, 1 - Math.exp(-substitutionCount / 5));
}
```

**Confidence Levels:**
- 0 substitutions → 0.0 confidence
- 1 substitution → ~0.18 confidence
- 5 substitutions → ~0.63 confidence
- 10 substitutions → ~0.86 confidence
- 20+ substitutions → ~1.0 confidence

**For Document Analysis:**
- Documents with many PII instances = high confidence
- Single mention = lower confidence (might be coincidence)
- Use confidence to recommend manual review

---

## Integration with Document Analysis

### 1. Document Text Extraction

```typescript
// After parsing PDF/DOCX/TXT
const documentText = extractedText;

// Get AliasEngine instance
const engine = await AliasEngine.getInstance();

// Detect PII (without replacing yet)
const detectionResult = engine.substitute(documentText, 'encode', {
  mode: 'detect-only'
});

console.log('PII Found:', detectionResult.substitutions);
console.log('Profiles Matched:', detectionResult.profilesMatched);
```

### 2. Show Preview with PII Highlighted

```typescript
// Highlight real PII in original
const highlightedOriginal = highlightPII(documentText, detectionResult.substitutions, 'real');

// Generate sanitized version
const sanitizedResult = engine.substitute(documentText, 'encode');

// Highlight aliases in sanitized
const highlightedSanitized = highlightPII(sanitizedResult.text, sanitizedResult.substitutions, 'alias');

// Show side-by-side
showPreviewModal(highlightedOriginal, highlightedSanitized);
```

### 3. Create Document Alias

```typescript
interface DocumentAlias {
  id: string;                    // "doc_abc123"
  documentName: string;          // "Contract_2024.pdf"
  createdAt: number;
  fileSize: number;
  fileType: string;              // "application/pdf"

  // All PII found in this document
  piiMap: Array<{
    profileId: string;           // Which profile matched
    profileName: string;         // "Greg - Work"
    piiType: PIIType;            // "name", "email", etc.
    realValue: string;           // "Greg Barker"
    aliasValue: string;          // "John Doe"
    occurrences: number;         // How many times found
  }>;

  // Original text (encrypted)
  originalText?: string;

  // Sanitized text (for quick re-use)
  sanitizedText: string;

  // Metadata
  confidence: number;
  substitutionCount: number;
  profilesUsed: string[];        // List of profile IDs
}
```

### 4. Store Document Alias

```typescript
// In StorageManager
async saveDocumentAlias(documentAlias: DocumentAlias): Promise<void> {
  const encrypted = await this.encrypt(JSON.stringify(documentAlias));
  const existing = await this.loadDocumentAliases();
  existing.push(encrypted);
  await chrome.storage.local.set({ documentAliases: existing });
}
```

### 5. Decode Responses (If Needed)

If the AI service echoes back the sanitized text:

```typescript
// User sends: "John Doe's contract..."
// AI responds: "Based on John Doe's contract..."

// Decode response
const decoded = engine.substitute(aiResponse, 'decode');
// Result: "Based on Greg Barker's contract..."
```

**Note:** User has setting `decodeResponses: boolean` in config (default: false)

---

## Performance Considerations

### Current Performance
- **Lookup:** O(1) map access
- **Regex matching:** O(n * m) where n = text length, m = number of PII mappings
- **Sorting keys:** O(m log m)

### For Large Documents
- 10-page PDF ~5,000 words
- Typical profile has ~6 PII fields × ~10 variations = 60 patterns
- 5,000 words × 60 patterns = 300,000 regex operations

**Optimization Strategies:**
1. **Pre-filter by word boundaries:**
   - Split document into words first
   - Only run regex on paragraphs containing potential matches

2. **Batch processing:**
   - Process documents in chunks
   - Show progress bar ("Analyzing page 3 of 10...")

3. **Worker threads (future):**
   - Offload parsing to Web Worker
   - Keep UI responsive during large document processing

4. **Caching:**
   - Store document alias with sanitized text
   - Re-use if document hasn't changed

---

## Edge Cases to Handle

### 1. Overlapping PII
```
"Greg Barker's company is Barker Industries"
```
- "Greg Barker" → "John Doe"
- "Barker Industries" → ?
  - If "Barker Industries" is in custom PII, replace separately
  - Otherwise, leave as is (already part of "Greg Barker" replacement)

**Solution:** Longest-first sorting prevents this issue.

### 2. Partial Matches
```
"Gregory contacted us"
```
- Should NOT match "Greg"
- Word boundaries prevent this: `\bGreg\b` won't match "Gregory"

### 3. Case Sensitivity
```
"GREG BARKER" vs "Greg Barker" vs "greg barker"
```
- All keys stored as lowercase
- Case preserved in replacement

### 4. Special Characters
```
"greg.barker@company.com"
```
- Dots, @, underscores are NOT word boundaries
- Email matching must be exact

### 5. Unicode/International Names
```
"José García"
```
- Regex `\b` word boundary works with Unicode
- Test with accented characters, Chinese names, etc.

---

## Testing Strategy

### Unit Tests Needed

1. **Basic Substitution:**
   - Single PII replacement
   - Multiple PII in same text
   - No PII found

2. **Case Preservation:**
   - Title Case, UPPER CASE, lower case
   - Mixed case in document

3. **Variations:**
   - Auto-generated variations
   - Custom variations
   - Disabled variations (should NOT match)

4. **Word Boundaries:**
   - Partial matches (should fail)
   - Full matches with punctuation
   - Possessives

5. **Large Documents:**
   - 10,000+ word document
   - Performance benchmarks
   - Memory usage

6. **Bidirectional:**
   - Encode then decode = original
   - Multiple encode/decode cycles

---

## Next Steps

1. ✅ AliasEngine analyzed
2. 🔜 Test AliasEngine with sample PDF text
3. 🔜 Design DocumentAlias type
4. 🔜 Implement PII highlighting for preview
5. 🔜 Build document storage methods
6. 🔜 Integrate with file parsers (pdf.js, mammoth.js)

---

**Status:** ✅ Analysis Complete
**Confidence:** High - Core engine is production-ready
**Ready for Integration:** Yes - Just need wrapper functions for document flow
