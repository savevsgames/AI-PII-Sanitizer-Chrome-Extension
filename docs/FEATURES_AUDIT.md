# Features Audit & Implementation Plan

**Created:** 2025-11-04
**Purpose:** Comprehensive audit of all planned features (Free vs PRO)
**Goal:** Complete all features before Chrome Web Store launch

---

## Executive Summary

**Current Status:** 2 of 6 features implemented
**Next Priority:** Implement 4 remaining features for launch

### Feature Implementation Status

| Feature | Status | Tier | Priority | Location |
|---------|--------|------|----------|----------|
| ✅ **API Key Vault** | COMPLETE | FREE + PRO | 🔴 HIGH | Features Tab |
| ✅ **Custom Redaction Rules** | COMPLETE | FREE + PRO | 🔴 HIGH | Features Tab |
| ⏳ **Prompt Templates** | PLANNED | FREE + PRO | 🔴 HIGH | Features Tab |
| 📋 **AI Profile Fill** | PLANNED | FREE | 🟡 MEDIUM | Profile Modal |
| 📋 **Alias Variations** | IMPLEMENTED | FREE | ✅ DONE | Core Engine |
| 📋 **Image PII Scanner** | PLANNED | PRO | 🟢 LOW | Optional |
| 📋 **Dev Terms Spellcheck** | PLANNED | FREE | 🟢 LOW | Optional |

---

## Feature 1: API Key Vault ✅ COMPLETE

**Status:** ✅ COMPLETE - Working in Features Tab
**Tier:** FREE (3 keys) + PRO (unlimited)
**Implementation:** `src/popup/components/apiKeyVault.ts`

### Current Implementation:
- [x] Add/edit/delete API keys
- [x] Protect OpenAI, Anthropic, Google, GitHub, AWS, Stripe keys
- [x] Custom key patterns (regex)
- [x] Auto-redaction in prompts
- [x] Protection counter stats
- [x] Protection mode: Auto-redact, Warn first, Log only
- [x] Encryption of stored keys (AES-256-GCM)

### What's Working:
- API key detection engine (37 tests passing)
- Storage with encryption
- UI in Features tab
- Stats tracking

### What's Missing:
- ❌ FREE tier limit enforcement (3 keys max)
- ❌ PRO upgrade prompt when limit reached

---

## Feature 2: Custom Redaction Rules ✅ COMPLETE

**Status:** ✅ COMPLETE - Working in Features Tab
**Tier:** FREE (3 rules) + PRO (unlimited)
**Implementation:** `src/popup/components/customRulesUI.ts`

### Current Implementation:
- [x] Create custom regex patterns
- [x] Template library (SSN, Credit Card, Phone, IP, Email, Medical)
- [x] Test pattern before saving
- [x] Priority ordering (0-100)
- [x] Category organization (PII, Financial, Medical, Custom)
- [x] Match counter stats
- [x] Enable/disable toggle
- [x] Encryption of stored rules

### What's Working:
- Redaction engine (35 tests passing)
- Template system
- UI in Features tab
- Pattern validation

### What's Missing:
- ❌ FREE tier limit enforcement (3 rules max)
- ❌ PRO upgrade prompt when limit reached

---

## Feature 3: Prompt Templates ⏳ PLANNED

**Status:** ⏳ NOT STARTED
**Tier:** FREE (3 templates) + PRO (unlimited)
**Priority:** 🔴 HIGH (Core PRO feature)
**Estimated Time:** 2-3 days

### Feature Overview:
Users can save commonly used prompts with placeholders that auto-fill with their alias profile data.

**Example:**
- Template: `"Write an email from {{name}} at {{email}} about..."`
- Auto-fills: `"Write an email from John Smith at john@company.com about..."`

### Data Model:
```typescript
interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;               // Template text with {{placeholders}}
  category?: string;              // "Email", "Code", "Research"
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  lastUsed?: number;
  profileId?: string;             // Which profile to use
}

interface PromptTemplateConfig {
  templates: PromptTemplate[];
  maxTemplates: number;           // 3 for FREE, unlimited for PRO
  defaultProfile?: string;
  enableKeyboardShortcuts: boolean;
}
```

### Placeholder Syntax:
**Supported Placeholders:**
- `{{name}}` - Real name from active profile
- `{{alias_name}}` - Alias name
- `{{email}}` - Real email
- `{{alias_email}}` - Alias email
- `{{phone}}` - Real phone
- `{{alias_phone}}` - Alias phone
- `{{address}}` - Real address
- `{{alias_address}}` - Alias address
- `{{company}}` - Company name
- `{{job_title}}` - Job title

### Implementation Checklist:

#### Phase 1: Data Layer (2-3 hours)
- [ ] Add `promptTemplates` to UserConfig type
- [ ] Add encryption for templates in StorageManager
- [ ] Add store actions (addTemplate, updateTemplate, deleteTemplate)
- [ ] Add template usage tracking

#### Phase 2: UI - Features Tab (3-4 hours)
- [ ] Add Prompt Templates card to Features tab (featuresTab.ts)
- [ ] Create template list view
- [ ] Create template editor modal
- [ ] Add category/tag filtering
- [ ] Add usage stats display
- [ ] Add template search

#### Phase 3: Placeholder Engine (2-3 hours)
- [ ] Create `src/lib/templateEngine.ts`
- [ ] Implement placeholder parsing
- [ ] Implement placeholder replacement with profile data
- [ ] Handle missing placeholders gracefully
- [ ] Add validation for template syntax

#### Phase 4: Integration (2-3 hours)
- [ ] Add "Insert Template" button to chat interfaces (content script)
- [ ] Add template picker dropdown
- [ ] Add profile selector (which profile to use)
- [ ] Track template usage stats
- [ ] Add keyboard shortcut (Ctrl+Shift+T)

#### Phase 5: Tier Gating (1 hour)
- [ ] Enforce 3 template limit for FREE tier
- [ ] Show PRO upgrade prompt when limit reached
- [ ] Display template count in Features tab

**Total Estimated Time:** 10-14 hours

---

## Feature 4: AI Profile Fill 📋 PLANNED

**Status:** 📋 NOT STARTED
**Tier:** FREE (all users)
**Priority:** 🟡 MEDIUM (Nice-to-have for launch)
**Estimated Time:** 1-2 days

### Feature Overview:
Use the AI chat the user is currently on (ChatGPT, Claude, Gemini) to generate a complete fake identity profile with one click.

**Key Principle:** 🔒 100% TRANSPARENT - User sees the message we send to the AI.

### User Flow:
1. User clicks "AI Generate Alias" button in Profile Modal
2. Consent modal shows the exact prompt that will be sent
3. User confirms → Extension sends prompt to current AI chat
4. AI responds with JSON: `{"name": "...", "email": "...", ...}`
5. Extension parses response and pre-fills profile form
6. User reviews and saves

### Implementation Checklist:

#### Phase 1: Prompt Engineering (2 hours)
- [ ] Design prompt template for ChatGPT/Claude/Gemini
- [ ] Test prompt on all 3 platforms
- [ ] Ensure JSON response format
- [ ] Handle edge cases (non-JSON responses)

#### Phase 2: UI Integration (3 hours)
- [ ] Add "AI Generate Alias" button to Profile Modal
- [ ] Create consent modal
- [ ] Add loading spinner during generation
- [ ] Add error handling UI
- [ ] Add "Delete generation message" option

#### Phase 3: Content Script Integration (4 hours)
- [ ] Inject prompt into active chat
- [ ] Listen for AI response
- [ ] Parse JSON from response
- [ ] Send parsed data back to popup
- [ ] Handle multi-platform differences (ChatGPT vs Claude vs Gemini)

#### Phase 4: Error Handling (2 hours)
- [ ] Handle non-JSON responses
- [ ] Handle API errors
- [ ] Handle timeout (30s)
- [ ] Add retry mechanism
- [ ] Show user-friendly error messages

**Total Estimated Time:** 11 hours

**Recommendation:** DEFER to v1.1 - Not critical for MVP launch

---

## Feature 5: Alias Variations ✅ IMPLEMENTED

**Status:** ✅ IMPLEMENTED (Core Engine)
**Tier:** FREE (all users)
**Implementation:** `src/lib/aliasVariations.ts`

### Current Implementation:
- [x] Name variations (First, Last, Middle, Suffixes)
- [x] Nickname generation (John → Johnny, Jack)
- [x] Email variations (parts, with/without dots)
- [x] Phone number format variations
- [x] Address format variations

### What's Working:
- Core variation engine (generateIdentityVariations)
- 8 common nickname mappings
- Integrated with profile creation
- Used by aliasEngine for matching

### What's Missing:
- ⚠️ Only 5.44% test coverage (needs 40-50 tests)
- ⚠️ Limited nickname database (only 8 names)

### Enhancement Opportunities:
- [ ] Expand nickname database to 50+ names
- [ ] Add international name support
- [ ] Add cultural name variations
- [ ] Add diminutives (Robert → Bob, Bobby, Robby)

**Note:** Feature is functional but needs comprehensive testing (deferred to testing phase)

---

## Feature 6: Image PII Scanner 📋 PLANNED

**Status:** 📋 NOT STARTED
**Tier:** PRO (paid feature)
**Priority:** 🟢 LOW (Post-launch feature)
**Estimated Time:** 2-3 weeks

### Feature Overview:
Scan images for PII before upload (OCR + pattern matching).

**Use Cases:**
- Screenshots with PII visible
- Scanned documents
- Photos with license plates
- Whiteboards with sensitive info

### Technical Challenges:
- Requires OCR library (Tesseract.js - 2MB+)
- Performance impact (OCR is slow)
- False positives (detecting PII that isn't there)
- Extension size increase

**Recommendation:** DEFER to v1.2+ - Not essential for MVP

---

## Feature 7: Dev Terms Spellcheck 📋 PLANNED

**Status:** 📋 NOT STARTED
**Tier:** FREE (all users)
**Priority:** 🟢 LOW (Nice-to-have)
**Estimated Time:** 1-2 days

### Feature Overview:
Add common developer terms to browser spellcheck dictionary (e.g., "async", "useState", "TypeScript").

**Implementation:**
- Whitelist of 500+ common dev terms
- Auto-add to browser spellcheck
- Per-platform customization

**Recommendation:** DEFER to v1.2+ - Not essential for MVP

---

## Recommended Implementation Order

### For MVP Launch (v1.0):
1. ✅ **API Key Vault** - COMPLETE
2. ✅ **Custom Redaction Rules** - COMPLETE
3. 🔴 **Prompt Templates** - IMPLEMENT NEXT (10-14 hours)
4. 🔴 **Tier Gating** - Add FREE/PRO limits (2-3 hours)

**Total MVP Work:** 12-17 hours

### Post-Launch (v1.1):
5. 🟡 **AI Profile Fill** - Nice UX improvement (11 hours)
6. 🟡 **Enhanced Alias Variations** - Expand nickname database

### Future (v1.2+):
7. 🟢 **Image PII Scanner** - Advanced PRO feature
8. 🟢 **Dev Terms Spellcheck** - Quality-of-life feature

---

## Feature Tier Matrix

### FREE Tier Features:
- ✅ Identity aliasing (unlimited profiles)
- ✅ Alias variations
- ✅ API Key Vault (3 keys max)
- ✅ Custom Redaction Rules (3 rules max)
- ⏳ Prompt Templates (3 templates max)
- 📋 AI Profile Fill (unlimited)
- ✅ Multi-service support (5 platforms)
- ✅ Activity log (last 50 entries)

### PRO Tier Features ($5/month):
- ✅ Unlimited API keys
- ✅ Unlimited custom redaction rules
- ⏳ Unlimited prompt templates
- ✅ Cloud sync (Firestore)
- ✅ Priority support
- 📋 Export/import profiles
- 📋 Advanced analytics
- 📋 Image PII scanner (future)

### Enterprise Tier (Future):
- 📋 Team management
- 📋 Centralized policy enforcement
- 📋 Audit logs
- 📋 SSO integration

---

## Files to Update

### Add Prompt Templates Feature:

**New Files to Create:**
- `src/lib/templateEngine.ts` - Placeholder parsing/replacement
- `src/popup/components/promptTemplates.ts` - UI component
- `tests/templateEngine.test.ts` - Tests

**Files to Modify:**
- `src/lib/types.ts` - Add PromptTemplate interfaces
- `src/lib/storage.ts` - Add template encryption
- `src/lib/store.ts` - Add template actions
- `src/popup/components/featuresTab.ts` - Add templates card
- `src/popup/popup-v2.html` - Add templates UI
- `src/popup/styles/features.css` - Add templates styling
- `src/content/content.ts` - Add template insertion

### Add Tier Gating:

**Files to Modify:**
- `src/popup/components/apiKeyVault.ts` - Check key count limit
- `src/popup/components/customRulesUI.ts` - Check rule count limit
- `src/popup/components/promptTemplates.ts` - Check template count limit
- `src/popup/components/featuresTab.ts` - Show upgrade CTAs

---

## Success Criteria

### MVP Launch (v1.0):
- [ ] 3 core features in Features tab (API Keys, Custom Rules, Prompt Templates)
- [ ] FREE tier limits enforced (3 keys, 3 rules, 3 templates)
- [ ] PRO upgrade CTAs when limits reached
- [ ] All features working on all 5 platforms
- [ ] Comprehensive tests for prompt templates (20+ tests)
- [ ] Documentation updated

### Post-Launch (v1.1):
- [ ] AI Profile Fill working on ChatGPT, Claude, Gemini
- [ ] Enhanced alias variations (50+ nicknames)
- [ ] User feedback incorporated

---

## Next Steps

### Immediate (This Session):
1. ✅ Complete features audit (this document)
2. ⏳ Implement Prompt Templates (10-14 hours)
   - Start with data layer
   - Build UI in Features tab
   - Create placeholder engine
   - Integrate with content scripts
3. ⏳ Add tier gating (2-3 hours)
   - Enforce limits
   - Add upgrade prompts

### This Week:
4. Test all features on all platforms
5. Update user documentation
6. Prepare Chrome Web Store assets

### Future Sessions:
7. Implement AI Profile Fill (v1.1)
8. Expand alias variations database
9. Plan Image PII Scanner (v1.2)

---

## Open Questions

1. **Prompt Template Keyboard Shortcut:**
   - Use Ctrl+Shift+T globally?
   - Or Ctrl+K for command palette style?

2. **Template Categories:**
   - Pre-defined categories only? (Email, Code, Research)
   - Or allow custom categories?

3. **Template Sharing:**
   - Allow export/import of templates?
   - Community template marketplace (future)?

4. **AI Profile Fill Consent:**
   - Show consent modal every time?
   - Or "Don't show again" checkbox?

5. **FREE Tier Marketing:**
   - Are 3 templates/keys/rules enough to be useful?
   - Or should we increase to 5?

---

**End of Features Audit**
