# Feature Spec: Prompt Templates

**Status:** 📋 Planned
**Priority:** Medium
**Estimated Effort:** 5-7 days
**Target Release:** Phase 2C (Week 4-5)
**Tier:** FREE (limited) + PRO (unlimited)

---

## 📖 Overview

**Problem:**
Users often send similar prompts to AI chats with slight variations (e.g., asking for code reviews, writing emails, analyzing data). Typing these prompts repeatedly is tedious, and users want to maintain their privacy by using their alias information consistently.

**Solution:**
Prompt Templates allow users to save commonly used prompts with placeholders that auto-fill with their alias profile data when inserted into AI chats.

**Example:**
- Template: `"Write a professional email from {{name}} at {{email}} to introduce our new product..."`
- Auto-fills: `"Write a professional email from John Smith at john@company.com to introduce our new product..."`

---

## 🎯 Goals

### Primary Goals
1. Save users time by reusing common prompts
2. Make it easy to use alias data in prompts
3. Provide value to justify PRO tier subscription
4. Simple, intuitive UX (no learning curve)

### Success Metrics
- **Adoption:** 30%+ of users create at least one template
- **Usage:** Templates used in 10%+ of AI chat interactions
- **Conversion:** Template users convert to PRO at 2x rate vs non-users
- **Performance:** Template insertion <100ms

---

## 👥 User Stories

### Free Tier User
> "As a free user, I want to save my 3 most common prompts so I don't have to retype them every time."

### PRO User
> "As a PRO user, I want unlimited templates organized by category so I can have templates for different use cases (coding, writing, research)."

### Power User
> "As a power user, I want to share my templates with colleagues or export them for backup."

---

## 🏗️ Architecture

### Data Model

```typescript
interface PromptTemplate {
  id: string;                    // UUID
  name: string;                  // "Professional Email Template"
  description?: string;          // Optional description
  content: string;               // Template text with {{placeholders}}
  category?: string;             // "Email", "Code Review", "Research", etc.
  tags?: string[];               // ["work", "formal", "intro"]
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
  usageCount: number;            // How many times used
  lastUsed?: number;             // Last usage timestamp
  profileId?: string;            // Which profile to use (optional, can select at use)
}

interface PromptTemplateConfig {
  templates: PromptTemplate[];
  maxTemplates: number;          // 3 for FREE, unlimited for PRO
  defaultProfile?: string;       // Default profile ID to use for placeholders
  enableKeyboardShortcuts: boolean;
}
```

### Placeholder Syntax

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
- `{{custom:fieldName}}` - Custom field (PRO only)

**Placeholder Format:**
- Case-insensitive: `{{Name}}` = `{{name}}`
- Whitespace tolerant: `{{ name }}` = `{{name}}`
- Unknown placeholders: Show as-is (don't error)

**Example:**
```
Template:
"Hi, I'm {{name}} from {{company}}. Contact me at {{email}} for collaboration."

Filled (using active profile):
"Hi, I'm John Smith from Acme Corp. Contact me at john@acme.com for collaboration."
```

---

## 🎨 UI Design

### Template Manager (Settings → Templates)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ 📝 Prompt Templates                    [+ New] │
├─────────────────────────────────────────────────┤
│ FREE: 2/3 Templates Used    [Upgrade to PRO]   │
├─────────────────────────────────────────────────┤
│ Search: [________________]  Category: [All ▼]  │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 📧 Professional Email Template              │ │
│ │ Write emails introducing products           │ │
│ │ Used 12 times • Last: 2 hours ago           │ │
│ │ [Edit] [Delete] [Duplicate]                 │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ 💻 Code Review Request                      │ │
│ │ Ask for code review with context            │ │
│ │ Used 5 times • Last: 1 day ago              │ │
│ │ [Edit] [Delete] [Duplicate]                 │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Template Editor Modal

```
┌─────────────────────────────────────────────────┐
│ Add Template                           [Close] │
├─────────────────────────────────────────────────┤
│ Name: [Professional Email Template________]    │
│                                                 │
│ Description (optional):                         │
│ [Write emails introducing products_________]   │
│                                                 │
│ Category: [Email ▼]                             │
│                                                 │
│ Template Content:                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ Hi, I'm {{name}} from {{company}}.         │ │
│ │                                              │ │
│ │ I wanted to reach out about...              │ │
│ │                                              │ │
│ │ Best regards,                                │ │
│ │ {{name}}                                     │ │
│ │ {{email}}                                    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Preview (using current profile):                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Hi, I'm John Smith from Acme Corp.          │ │
│ │                                              │ │
│ │ I wanted to reach out about...              │ │
│ │                                              │ │
│ │ Best regards,                                │ │
│ │ John Smith                                   │ │
│ │ john@acme.com                                │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Insert Placeholder: [{{name}} ▼]               │
│                                                 │
│                        [Cancel] [Save Template] │
└─────────────────────────────────────────────────┘
```

### Chat Integration

**Option A: Inject Button in Chat Input**
```
┌─────────────────────────────────────────────────┐
│ [📝 Templates ▼]  Type your message here...   │
└─────────────────────────────────────────────────┘
     ↓ (Dropdown appears)
┌─────────────────────────────────┐
│ 📧 Professional Email Template  │
│ 💻 Code Review Request          │
│ 📊 Data Analysis Request        │
│ ─────────────────────────────   │
│ ⚙️  Manage Templates            │
└─────────────────────────────────┘
```

**Option B: Keyboard Shortcut**
- `Ctrl+Shift+T` opens template picker overlay
- User selects template → auto-inserted into chat input

---

## 🚀 Implementation Plan

### Phase 1: Data Model & Storage (Day 1)
**Files:**
- `src/lib/types.ts` - Add `PromptTemplate` types
- `src/lib/promptTemplateManager.ts` - Create manager class

**Tasks:**
- [ ] Define TypeScript interfaces
- [ ] Create `PromptTemplateManager` class
- [ ] CRUD operations (create, read, update, delete)
- [ ] Storage in `chrome.storage.local`
- [ ] Placeholder parser function
- [ ] Template validation (max length, sanitize)

**Deliverable:** Backend logic for managing templates

---

### Phase 2: Template Manager UI (Day 2-3)
**Files:**
- `src/popup/components/templateManager.ts` - Manager component
- `src/popup/styles/templates.css` - Styling
- `src/popup/popup-v2.html` - Add Templates section

**Tasks:**
- [ ] Create Templates tab or section in Settings
- [ ] Template list view with search/filter
- [ ] Add/Edit template modal
- [ ] Delete confirmation
- [ ] Duplicate template functionality
- [ ] Category dropdown
- [ ] Preview pane with placeholder replacement
- [ ] FREE tier counter (X/3 templates)
- [ ] Upgrade prompt when limit reached

**Deliverable:** Full template management UI

---

### Phase 3: Chat Integration (Day 3-4)
**Files:**
- `src/content/templateInjector.ts` - Inject into AI chats
- Content scripts for each AI service

**Tasks:**
- [ ] Detect chat input fields on AI platforms
- [ ] Inject template dropdown button
- [ ] Handle template selection
- [ ] Replace placeholders with active profile data
- [ ] Insert template content into input field
- [ ] Profile selector (if multiple profiles exist)
- [ ] Keyboard shortcut support (optional)
- [ ] Track usage statistics

**Deliverable:** Working template insertion in AI chats

---

### Phase 4: PRO Feature Gating (Day 5)
**Files:**
- `src/popup/components/templateManager.ts` - Add tier checks
- `src/lib/store.ts` - Tier verification

**Tasks:**
- [ ] Check user tier before allowing template creation
- [ ] Show "X/3 templates" for FREE tier
- [ ] Block creation when limit reached
- [ ] Show upgrade modal with benefits
- [ ] PRO tier: No limits, show "Unlimited" badge
- [ ] Import/Export (PRO only)

**Deliverable:** Tier enforcement working

---

### Phase 5: Testing & Polish (Day 6-7)
**Tasks:**
- [ ] Unit tests for placeholder parser
- [ ] Test template CRUD operations
- [ ] Test on all 7 AI platforms
- [ ] Test FREE tier limits
- [ ] Test profile switching
- [ ] Performance testing (100+ templates)
- [ ] Edge cases (empty templates, special characters)
- [ ] UX polish (animations, error messages)

**Deliverable:** Production-ready feature

---

## 🔒 Security Considerations

### XSS Prevention
- **Sanitize template content** before storing
- **Escape HTML** in placeholder values
- **No `eval()` or dynamic code execution**
- **Validate placeholder syntax** (no script tags)

### Storage Limits
- **Max template content:** 5,000 characters
- **Max templates (FREE):** 3
- **Max templates (PRO):** 1,000
- **Total storage budget:** Track usage, warn if approaching limit

### Privacy
- **Templates stored locally** in `chrome.storage.local`
- **No cloud sync** (unless user explicitly enables)
- **Export templates** as encrypted JSON (optional)

---

## 🎁 Tier Comparison

| Feature | FREE | PRO |
|---------|------|-----|
| Templates | 3 | Unlimited |
| Placeholders | Basic (name, email, phone) | All + custom fields |
| Categories | No | Yes |
| Import/Export | No | Yes |
| Shared Template Library | View-only | Full access |
| Keyboard Shortcuts | No | Yes |

---

## 📊 Success Metrics

### Adoption Metrics
- **Template Creation Rate:** % of users who create ≥1 template
- **Template Usage Rate:** % of AI chat messages using templates
- **Average Templates per User:** Mean # of templates created
- **Template Diversity:** # of unique template categories used

### Conversion Metrics
- **Template-to-PRO Conversion:** % of template users who upgrade
- **FREE Tier Limit Hits:** # of times users hit 3-template limit
- **Upgrade Modal CTR:** Click-through rate on upgrade prompts

### Engagement Metrics
- **Templates Used per Day:** Daily active template usage
- **Most Popular Templates:** Top 10 template names/categories
- **Template Lifecycle:** Average time between create and first use

---

## 🚧 Known Limitations

### MVP (Phase 2C)
- **No cloud sync** - Templates stored locally only
- **No shared library** - Can't browse community templates
- **No versioning** - Can't undo template edits
- **No folders** - Only categories, no nested organization
- **No collaboration** - Can't share with team members

### Future Enhancements (Post-Launch)
- **Cloud sync** (opt-in, encrypted)
- **Template marketplace** (share/sell templates)
- **Template versioning** (undo/redo edits)
- **Folder organization** (nested categories)
- **Team templates** (Enterprise feature)
- **AI-powered suggestions** ("Similar templates exist")
- **Template variables** (dynamic dates, counters)

---

## 🧪 Testing Strategy

### Unit Tests
- Placeholder parser (all field types)
- Template validation (length, special chars)
- Storage operations (CRUD)
- Tier enforcement (FREE limits)

### Integration Tests
- Template insertion into ChatGPT input
- Profile switching updates placeholders
- Keyboard shortcuts trigger correctly
- Import/Export roundtrip works

### Manual Tests
- Create/edit/delete templates
- Use templates on all 7 AI platforms
- Hit FREE tier limit
- Upgrade to PRO, verify unlimited
- Large templates (5,000 chars)

---

## 📚 Documentation Needs

### User Guide
- **What are Prompt Templates?**
- **How to create your first template**
- **Placeholder syntax reference**
- **Using templates in AI chats**
- **Organizing templates with categories**
- **Keyboard shortcuts**
- **FREE vs PRO differences**

### Developer Docs
- **PromptTemplateManager API**
- **Adding new placeholder types**
- **Extending template injection to new AI services**

---

## 💬 User Feedback (Pre-Launch)

**Validation Needed:**
- Would users actually use this feature?
- Is 3 templates enough for FREE tier?
- What placeholder fields are most valuable?
- Keyboard shortcuts vs dropdown button?

**How to Validate:**
- Survey existing users about prompt reuse habits
- Beta test with 10-20 power users
- A/B test different FREE tier limits (3 vs 5)

---

## 🎯 Launch Criteria

**Must Have:**
- ✅ Create, edit, delete templates
- ✅ Placeholder replacement working
- ✅ Works on ChatGPT (primary platform)
- ✅ FREE tier limited to 3 templates
- ✅ PRO tier unlimited
- ✅ No XSS vulnerabilities

**Nice to Have:**
- ⏳ Works on all 7 AI platforms
- ⏳ Keyboard shortcuts
- ⏳ Import/Export
- ⏳ Categories and search

**Can Wait:**
- ⏸️ Cloud sync
- ⏸️ Shared template library
- ⏸️ Template versioning

---

## 📅 Timeline Summary

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Data model & storage | Backend logic complete |
| 2-3 | Template manager UI | Full CRUD interface |
| 3-4 | Chat integration | Template insertion working |
| 5 | PRO feature gating | Tier enforcement |
| 6-7 | Testing & polish | Production-ready |

**Total:** 5-7 days from start to launch

---

**Questions? Feedback?**
Open an issue on GitHub or discuss in Discord.

**Status:** 📋 Spec complete, awaiting implementation approval
