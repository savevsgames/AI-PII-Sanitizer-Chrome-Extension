# Feature Spec: Alias Variations

## Overview

**Problem:** Users type their names in different formats (GregBarker, gregbarker, gbarker, G.Barker) but the extension only matches exact text. Typos and formatting variations slip through.

**Solution:** Auto-generate common variations of each PII field and allow users to add custom variations. Match all variations seamlessly.

**Target Users:** All users (FREE with limits, PRO unlimited)

**Value Prop:** "Catch 'GregBarker', 'gregbarker', 'gbarker' automatically - no missed substitutions"

**Related Doc:** This extends the plan in `docs/current/refactor_v3.md` (lines 138-297)

---

## User Stories

1. **As a user**, I want the extension to match "GregBarker" (no space) even though my profile says "Greg Barker", so I don't accidentally leak my name.

2. **As a user**, I want auto-generated variations (gbarker, G.Barker, greg.barker) added to my profile, so I don't have to think of every possible format.

3. **As a user**, I want to add my own custom variations (nicknames, abbreviations), so the extension catches all the ways I might type my name.

4. **As a PRO user**, I want AI to suggest variations based on my real name, so I can quickly add all relevant variations.

5. **As a user**, I want to see which variation was matched in the stats, so I can understand what triggered the substitution.

---

## Current Problem (Example)

### User Profile:
```
Real Name: "Greg Barker"
Alias Name: "John Smith"
```

### What Gets Matched:
- ✅ "Greg Barker" (exact match, case-insensitive)
- ✅ "greg barker" (lowercase)
- ✅ "GREG BARKER" (uppercase)

### What Gets MISSED:
- ❌ "GregBarker" (no space)
- ❌ "gregbarker" (no space, lowercase)
- ❌ "gbarker" (initials)
- ❌ "G.Barker" (abbreviated first name)
- ❌ "G Barker" (abbreviated)
- ❌ "greg.barker" (email format)

**Result:** User accidentally leaks their name in these formats!

---

## Proposed Solution

### Auto-Generated Variations

**For Names:**
```typescript
Input: "Greg Barker"

Auto-generated variations:
1. "GregBarker"        // No space
2. "gregbarker"        // No space, lowercase
3. "gbarker"           // First initial + last name
4. "G.Barker"          // Abbreviated with period
5. "G Barker"          // Abbreviated with space
6. "greg.barker"       // Email-style
7. "GregB"             // First name + last initial
8. "gregb"             // Lowercase version
```

**For Emails:**
```typescript
Input: "greg.barker@acme.com"

Auto-generated variations:
1. "Greg.Barker@acme.com"    // Title case
2. "GREG.BARKER@ACME.COM"    // All caps
3. "greg.barker@ACME.COM"    // Domain caps
4. "gbarker@acme.com"        // No period
5. "gregbarker@acme.com"     // No period or space
```

**For Phone Numbers:**
```typescript
Input: "(555) 123-4567"

Auto-generated variations:
1. "5551234567"              // Digits only
2. "555-123-4567"            // Dashes
3. "555.123.4567"            // Dots
4. "+1-555-123-4567"         // With country code
5. "+1 (555) 123-4567"       // Country code + parens
```

---

## UI/UX Design

### Profile Modal - Variations Section

```
┌──────────────────────────────────────────┐
│ ✏️  Edit Profile: Work Profile           │
├──────────────────────────────────────────┤
│ Real Information                         │
│ Name:     [Greg Barker              ]   │
│ Email:    [greg@acme.com            ]   │
│                                          │
│ Alias Information                        │
│ Name:     [John Smith               ]   │
│ Email:    [john@example.com         ]   │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 🔄 Name Variations (8 suggested)    │  │
│ │                                    │  │
│ │ Auto-generated:                    │  │
│ │ [✓] GregBarker                     │  │
│ │ [✓] gregbarker                     │  │
│ │ [✓] gbarker                        │  │
│ │ [✓] G.Barker                       │  │
│ │ [✓] G Barker                       │  │
│ │ [✓] greg.barker                    │  │
│ │ [✓] GregB                          │  │
│ │ [✓] gregb                          │  │
│ │                                    │  │
│ │ [+ Add Custom Variation]           │  │
│ │ [🤖 AI Suggest More] (PRO) ⭐       │  │
│ └────────────────────────────────────┘  │
│                                          │
│           [Cancel]  [Save Profile]       │
└──────────────────────────────────────────┘
```

### Add Custom Variation

```
┌────────────────────────────────────┐
│ Add Custom Variation               │
├────────────────────────────────────┤
│ Variation Text                     │
│ [Gregory Barker                 ] │
│                                    │
│ This will match:                   │
│ • gregory barker (case-insensitive)│
│ • Gregory Barker                   │
│ • GREGORY BARKER                   │
│                                    │
│ FREE tier: 5/10 custom variations  │
│                                    │
│       [Cancel]  [Add]              │
└────────────────────────────────────┘
```

### AI Suggest More (PRO Feature)

```
┌─────────────────────────────────────────┐
│ 🤖 AI Variation Suggestions (PRO)       │
├─────────────────────────────────────────┤
│ Based on "Greg Barker", AI suggests:    │
│                                         │
│ [✓] Gregory Barker (full name)         │
│ [✓] Greg B (abbreviated)                │
│ [✓] Greg (first name only)              │
│ [✓] Barker (last name only)             │
│ [ ] GBarker (no period)                 │
│ [ ] G.B. (initials)                     │
│                                         │
│ Nicknames:                              │
│ [ ] Gregg (common typo)                 │
│ [ ] Gregory (formal variant)            │
│                                         │
│ [Select All] [Add Selected Variations]  │
└─────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Data Model

**Update types.ts:**

```typescript
export interface IdentityData {
  name?: string;
  email?: string;
  phone?: string;
  cellPhone?: string;
  address?: string;
  company?: string;

  // NEW: Variations for each field
  variations?: {
    name?: string[];        // ["GregBarker", "gregbarker", "gbarker", ...]
    email?: string[];       // ["Greg.Barker@acme.com", "GREG.BARKER@ACME.COM", ...]
    phone?: string[];       // ["5551234567", "555-123-4567", ...]
    cellPhone?: string[];
    address?: string[];
    company?: string[];
  };

  custom?: Record<string, string>;
}

// Stats tracking for variations
export interface VariationMatch {
  originalValue: string;     // "Greg Barker"
  variationMatched: string;  // "gregbarker"
  matchCount: number;
  lastMatched: number;
}
```

### 2. Variation Generator

**New file: `src/lib/aliasVariations.ts`**

```typescript
/**
 * Generate common variations of PII values
 * Used by both auto-generation and AI-powered suggestion
 */

export class AliasVariationGenerator {
  /**
   * Generate all variations for a name
   */
  static generateNameVariations(fullName: string): string[] {
    const variations: Set<string> = new Set([fullName]);
    const trimmed = fullName.trim();
    const parts = trimmed.split(/\s+/);

    if (parts.length === 2) {
      const [first, last] = parts;
      const firstInitial = first[0];
      const lastInitial = last[0];

      // No space variations
      variations.add(`${first}${last}`); // GregBarker
      variations.add(`${first.toLowerCase()}${last.toLowerCase()}`); // gregbarker

      // First initial variations
      variations.add(`${firstInitial}${last}`); // GBarker
      variations.add(`${firstInitial}.${last}`); // G.Barker
      variations.add(`${firstInitial} ${last}`); // G Barker
      variations.add(`${firstInitial.toLowerCase()}${last.toLowerCase()}`); // gbarker

      // Last initial variations
      variations.add(`${first}${lastInitial}`); // GregB
      variations.add(`${first}${lastInitial.toLowerCase()}`); // Gregb
      variations.add(`${first.toLowerCase()}${lastInitial.toLowerCase()}`); // gregb

      // Email-style
      variations.add(`${first.toLowerCase()}.${last.toLowerCase()}`); // greg.barker

      // Underscore (common in usernames)
      variations.add(`${first.toLowerCase()}_${last.toLowerCase()}`); // greg_barker
    } else if (parts.length === 3) {
      // Handle middle names: "John Paul Smith"
      const [first, middle, last] = parts;
      const firstInitial = first[0];
      const middleInitial = middle[0];
      const lastInitial = last[0];

      // Common 3-name variations
      variations.add(`${first}${last}`); // JohnSmith (skip middle)
      variations.add(`${first} ${last}`); // John Smith (skip middle)
      variations.add(`${firstInitial}.${middleInitial}.${last}`); // J.P.Smith
      variations.add(`${firstInitial}${middleInitial}${last}`); // JPSmith
      variations.add(`${first} ${middleInitial}. ${last}`); // John P. Smith
    }

    return Array.from(variations);
  }

  /**
   * Generate email variations
   */
  static generateEmailVariations(email: string): string[] {
    const variations: Set<string> = new Set([email]);
    const [localPart, domain] = email.split('@');

    if (!localPart || !domain) {
      return Array.from(variations);
    }

    // Case variations
    variations.add(email.toLowerCase());
    variations.add(email.toUpperCase());
    variations.add(`${localPart.toUpperCase()}@${domain.toLowerCase()}`);
    variations.add(`${localPart.toLowerCase()}@${domain.toUpperCase()}`);

    // Title case variations
    const titleCase = localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase();
    variations.add(`${titleCase}@${domain.toLowerCase()}`);

    // Remove dots/underscores
    if (localPart.includes('.') || localPart.includes('_')) {
      const noDots = localPart.replace(/[._]/g, '');
      variations.add(`${noDots}@${domain}`);
      variations.add(`${noDots.toLowerCase()}@${domain.toLowerCase()}`);
    }

    return Array.from(variations);
  }

  /**
   * Generate phone number variations
   */
  static generatePhoneVariations(phone: string): string[] {
    const variations: Set<string> = new Set([phone]);

    // Extract digits only
    const digitsOnly = phone.replace(/\D/g, '');
    variations.add(digitsOnly);

    if (digitsOnly.length === 10) {
      const area = digitsOnly.slice(0, 3);
      const prefix = digitsOnly.slice(3, 6);
      const line = digitsOnly.slice(6, 10);

      // Common formats
      variations.add(`(${area}) ${prefix}-${line}`); // (555) 123-4567
      variations.add(`${area}-${prefix}-${line}`); // 555-123-4567
      variations.add(`${area}.${prefix}.${line}`); // 555.123.4567
      variations.add(`+1-${area}-${prefix}-${line}`); // +1-555-123-4567
      variations.add(`+1 (${area}) ${prefix}-${line}`); // +1 (555) 123-4567
      variations.add(`${area} ${prefix} ${line}`); // 555 123 4567
    }

    return Array.from(variations);
  }

  /**
   * Generate address variations
   */
  static generateAddressVariations(address: string): string[] {
    const variations: Set<string> = new Set([address]);

    // Common abbreviations
    variations.add(address.replace(/\bStreet\b/gi, 'St'));
    variations.add(address.replace(/\bSt\.?\b/gi, 'Street'));
    variations.add(address.replace(/\bAvenue\b/gi, 'Ave'));
    variations.add(address.replace(/\bAve\.?\b/gi, 'Avenue'));
    variations.add(address.replace(/\bRoad\b/gi, 'Rd'));
    variations.add(address.replace(/\bRd\.?\b/gi, 'Road'));
    variations.add(address.replace(/\bDrive\b/gi, 'Dr'));
    variations.add(address.replace(/\bDr\.?\b/gi, 'Drive'));

    return Array.from(variations);
  }

  /**
   * Generate company name variations
   */
  static generateCompanyVariations(company: string): string[] {
    const variations: Set<string> = new Set([company]);

    // With/without legal suffixes
    variations.add(company.replace(/\s+(Inc|LLC|Ltd|Corp|Corporation)\.?$/i, ''));
    variations.add(company.replace(/\s+(Inc|LLC|Ltd|Corp|Corporation)\.?$/i, ' Inc'));
    variations.add(company.replace(/\s+(Inc|LLC|Ltd|Corp|Corporation)\.?$/i, ' LLC'));

    // Case variations
    variations.add(company.toLowerCase());
    variations.add(company.toUpperCase());

    return Array.from(variations);
  }
}
```

### 3. Integration with AliasEngine

**Modify: `src/lib/aliasEngine.ts`**

```typescript
import { AliasVariationGenerator } from './aliasVariations';

/**
 * Build lookup maps with variations
 */
private buildLookupMaps(): void {
  this.realToAliasMap.clear();
  this.aliasToRealMap.clear();

  const piiFields: PIIType[] = ['name', 'email', 'phone', 'cellPhone', 'address', 'company'];

  for (const profile of this.profiles) {
    if (!profile.enabled) continue;

    for (const piiType of piiFields) {
      const realValue = profile.real[piiType] as string | undefined;
      const aliasValue = profile.alias[piiType] as string | undefined;

      if (!realValue || !aliasValue) continue;

      // Base mapping (original value)
      const baseMapping: PIIMapping = {
        real: realValue,
        alias: aliasValue,
        profileId: profile.id,
        profileName: profile.profileName,
        piiType,
      };

      this.realToAliasMap.set(realValue.toLowerCase(), baseMapping);
      this.aliasToRealMap.set(aliasValue.toLowerCase(), baseMapping);

      // Add variations
      const realVariations = profile.real.variations?.[piiType] || [];
      const aliasVariations = profile.alias.variations?.[piiType] || [];

      // Map each real variation to the alias
      for (const variation of realVariations) {
        const varMapping: PIIMapping = {
          ...baseMapping,
          real: variation, // Original variation that was matched
        };
        this.realToAliasMap.set(variation.toLowerCase(), varMapping);
      }

      // Map each alias variation to the real value
      for (const variation of aliasVariations) {
        const varMapping: PIIMapping = {
          ...baseMapping,
          alias: variation,
        };
        this.aliasToRealMap.set(variation.toLowerCase(), varMapping);
      }
    }
  }

  console.log('[AliasEngine] Built maps with variations:', this.realToAliasMap.size, 'real→alias mappings');
}
```

### 4. Auto-Generate on Profile Save

**Modify: `src/lib/storage.ts`**

```typescript
import { AliasVariationGenerator } from './aliasVariations';

/**
 * Add or update profile (auto-generates variations)
 */
async addProfile(profileData: Partial<AliasProfile>): Promise<AliasProfile> {
  // ... existing code ...

  // Auto-generate variations for real and alias data
  if (newProfile.real.name) {
    if (!newProfile.real.variations) {
      newProfile.real.variations = {};
    }
    newProfile.real.variations.name = AliasVariationGenerator.generateNameVariations(
      newProfile.real.name
    );
  }

  if (newProfile.real.email) {
    if (!newProfile.real.variations) {
      newProfile.real.variations = {};
    }
    newProfile.real.variations.email = AliasVariationGenerator.generateEmailVariations(
      newProfile.real.email
    );
  }

  if (newProfile.real.phone) {
    if (!newProfile.real.variations) {
      newProfile.real.variations = {};
    }
    newProfile.real.variations.phone = AliasVariationGenerator.generatePhoneVariations(
      newProfile.real.phone
    );
  }

  // Do same for alias variations
  // ... similar code for alias.name, alias.email, etc.

  // Save profile
  await this.saveProfile(newProfile);

  return newProfile;
}
```

### 5. UI for Managing Variations

**Modify: `src/popup/components/profileModal.ts`**

```typescript
/**
 * Render variations section in profile modal
 */
function renderVariationsSection(profile: AliasProfile) {
  const variationsHtml = `
    <div class="variations-section">
      <h4>🔄 Name Variations (${(profile.real.variations?.name?.length || 0)} suggested)</h4>

      <div class="variations-list">
        ${(profile.real.variations?.name || []).map((variation, i) => `
          <label class="variation-item">
            <input type="checkbox" checked data-variation-index="${i}">
            <span>${escapeHtml(variation)}</span>
          </label>
        `).join('')}
      </div>

      <button type="button" class="add-variation-btn">+ Add Custom Variation</button>
      <button type="button" class="ai-suggest-btn pro-badge">🤖 AI Suggest More</button>
    </div>
  `;

  return variationsHtml;
}

/**
 * Handle add custom variation
 */
async function handleAddCustomVariation() {
  const variation = prompt('Enter custom variation:');
  if (!variation) return;

  // Add to profile variations
  const profile = getCurrentProfile();
  if (!profile.real.variations) {
    profile.real.variations = {};
  }
  if (!profile.real.variations.name) {
    profile.real.variations.name = [];
  }

  // Check FREE tier limit (10 custom variations)
  const customCount = profile.real.variations.name.filter(v =>
    !AliasVariationGenerator.generateNameVariations(profile.real.name!).includes(v)
  ).length;

  const tier = (await chrome.runtime.sendMessage({ type: 'GET_CONFIG' })).data.account?.tier || 'free';

  if (tier === 'free' && customCount >= 10) {
    alert('FREE tier limit: 10 custom variations. Upgrade to PRO for unlimited.');
    return;
  }

  profile.real.variations.name.push(variation);

  // Re-render
  renderVariationsSection(profile);
}
```

---

## FREE vs PRO Comparison

| Feature | FREE | PRO |
|---------|------|-----|
| **Auto-Generated Variations** | ✅ Yes (8-10 per field) | ✅ Yes (8-10 per field) |
| **Custom Variations** | ✅ 10 total across all fields | ✅ Unlimited |
| **AI Variation Suggestions** | ❌ No | ✅ Yes (generates 10+ suggestions) |
| **Edit Auto-Generated** | ❌ No (accept/reject only) | ✅ Yes (can edit or remove) |
| **Variation Stats** | Basic (total matches) | Advanced (per-variation stats) |

---

## Implementation Phases

### Phase 1: Auto-Generation (Base Implementation)
**Time:** 1 week

- [ ] Build `AliasVariationGenerator` class
- [ ] Integrate with `aliasEngine.ts` (buildLookupMaps)
- [ ] Auto-generate variations on profile save
- [ ] Show variations in profile modal (read-only checkboxes)
- [ ] Test matching with variations

**Deliverable:** Variations auto-generated and matched

### Phase 2: Custom Variations (FREE Feature)
**Time:** 3-4 days

- [ ] Add "Add Custom Variation" button in profile modal
- [ ] Enforce FREE tier limit (10 total custom variations)
- [ ] Allow editing/deleting custom variations
- [ ] Update storage to persist custom variations

**Deliverable:** Users can add custom variations (10 max for FREE)

### Phase 3: AI-Powered Suggestions (PRO Feature)
**Time:** 1 week

- [ ] Integrate with AI Profile Fill feature (reuse chat injector)
- [ ] Send prompt: "Generate 10 variations of 'Greg Barker'"
- [ ] Parse AI response and show in modal
- [ ] Allow user to select which variations to add
- [ ] Unlimited custom variations for PRO

**Deliverable:** PRO users get AI variation suggestions

### Phase 4: Stats & Analytics
**Time:** 2-3 days

- [ ] Track which variation triggered match
- [ ] Show in stats: "gregbarker matched 12 times this month"
- [ ] Suggest removing unused variations
- [ ] Variation effectiveness report (PRO)

**Deliverable:** Insights into variation usage

---

## Performance Considerations

### Dictionary Size
- 1 profile with 5 PII fields × 8 variations each = 40 additional lookups
- 10 profiles = 400 total lookups
- Map lookup is O(1), so performance impact is negligible

### Memory Usage
- 100 profiles × 40 variations × 20 bytes average = 80KB
- Totally acceptable

### Optimization
- Store variations in lowercase in Map (no runtime case conversion)
- Use Set to deduplicate variations before saving

---

## Success Metrics

### Adoption
- 80%+ of profiles have variations enabled
- Average 5-8 variations per profile
- 30% of users add at least 1 custom variation

### Effectiveness
- 25%+ reduction in missed substitutions
- Variations account for 15-20% of all matches
- Most common matched variations: no-space versions (GregBarker, gregbarker)

### PRO Conversion
- 10% of users upgrade specifically for AI variation suggestions
- PRO users add 2x more custom variations than FREE users

---

## Conclusion

**Alias Variations is a critical feature for protection completeness:**
- ✅ Solves the #1 user complaint ("Why didn't it catch GregBarker?")
- ✅ Auto-generation is seamless (no user effort)
- ✅ Custom variations are powerful (nicknames, typos)
- ✅ AI suggestions are a compelling PRO feature
- ✅ Minimal performance impact

**Estimated Impact:**
- -25% missed substitutions (better protection)
- +80% user confidence in extension
- +10% PRO conversion (AI variations)

**Next Steps:**
1. Build Phase 1 (auto-generation) - 1 week
2. Test with real user profiles
3. Add custom variations (FREE feature)
4. Add AI suggestions (PRO feature)
