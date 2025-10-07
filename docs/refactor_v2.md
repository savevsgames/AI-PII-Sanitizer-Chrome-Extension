# AI PII Sanitizer - V2 Refactor Document

**Date**: 2025-10-07
**Status**: Planning Phase
**Version**: 2.0.0

---

## Executive Summary

This document outlines the refactor from a simple name-only alias system to a comprehensive multi-PII identity profile system with enhanced UI, stats tracking, and user controls.

### Key Changes
1. **Alias Profiles**: Single identity profiles containing multiple PII types (name, email, phone, address)
2. **Enhanced UI**: Multi-tab interface with Stats Dashboard, Settings, and Debug Console
3. **State Management**: Implement Zustand for unified state across popup/background/content scripts
4. **Advanced Stats**: Detailed tracking of interceptions by PII type, frequency, and service
5. **User Control Modes**: Optional warning/approval mode before substitution

---

## Current State (v1.0)

### Data Model

**AliasEntry** (types.ts:5-18):
```typescript
interface AliasEntry {
  id: string;
  realValue: string;        // Single PII value
  aliasValue: string;       // Single alias value
  type: 'name' | 'email' | 'phone' | 'address';
  category?: string;
  metadata: {
    createdAt: number;
    usageCount: number;
    lastUsed: number;
    confidence: number;
  };
  enabled: boolean;
}
```

**Limitations**:
- One alias entry = one PII value
- To protect "Greg Barker" with email/phone requires 3 separate entries
- No relationship between related PII
- Difficult to manage coherent identity profiles

### UI Architecture

**Current Dimensions**: 350px × 400px (popup.css:14-16)

**Layout**:
```
┌─────────────────────────────────┐
│ Header (Status Indicator)       │
├─────────────────────────────────┤
│ Stats: Protected | Aliases      │
├─────────────────────────────────┤
│                                 │
│ Alias List                      │
│  - Real Name → Alias Name       │
│  - Simple display               │
│                                 │
├─────────────────────────────────┤
│ Footer: Settings | Help         │
└─────────────────────────────────┘
```

**Limitations**:
- Limited space for complex data
- No debug console
- Minimal stats (just counters)
- Settings button non-functional
- Help link just goes to GitHub

### Core Logic

**AliasEngine** (aliasEngine.ts):
- Simple Map-based lookup (realToAliasMap, aliasToRealMap)
- Single-type substitution
- No multi-PII coordination
- Basic case preservation
- Possessive handling

**Storage** (storage.ts):
- AES-GCM encryption for aliases
- Flat array storage
- No relationship modeling

---

## Proposed State (v2.0)

### New Data Model

#### AliasProfile (Primary Entity)

```typescript
interface AliasProfile {
  id: string;
  profileName: string;          // e.g., "Greg - Work"
  description?: string;          // Optional notes
  enabled: boolean;

  // Real identity
  real: {
    name?: string;               // "Greg Barker"
    email?: string;              // "greg@work.com"
    phone?: string;              // "(555) 123-4567"
    cellPhone?: string;          // "(555) 987-6543"
    address?: string;            // "123 Main St, City, ST"
    company?: string;            // "Acme Corp"
    custom?: Record<string, string>;  // Future: extensible fields
  };

  // Alias identity
  alias: {
    name?: string;               // "John Smith"
    email?: string;              // "john@example.com"
    phone?: string;              // "(555) 000-0001"
    cellPhone?: string;          // "(555) 000-0002"
    address?: string;            // "456 Oak Ave, Town, ST"
    company?: string;            // "Generic LLC"
    custom?: Record<string, string>;
  };

  // Metadata
  metadata: {
    createdAt: number;
    updatedAt: number;
    usageStats: {
      totalSubstitutions: number;
      lastUsed: number;
      byService: {                // Per-service tracking
        chatgpt: number;
        claude: number;
        gemini: number;
      };
      byPIIType: {                // Per-type tracking
        name: number;
        email: number;
        phone: number;
        address: number;
      };
    };
    confidence: number;           // 0-1 for auto-detected profiles
  };

  // Settings per profile
  settings: {
    autoReplace: boolean;         // Auto-replace or warn first
    highlightInUI: boolean;       // Show visual highlights
    activeServices: string[];     // Which AI services to protect
  };
}
```

**Benefits**:
- Single profile = complete identity
- Coherent relationship between PII types
- Per-profile settings and stats
- Extensible with custom fields
- Better user mental model

#### Updated UserConfig

```typescript
interface UserConfig {
  version: number;

  // Account info (optional - for email updates & future Pro tier)
  account?: {                                    // NEW
    email?: string;              // Optional email for community updates
    emailOptIn: boolean;         // User consented to emails
    licenseKey?: string;         // For future Pro tier (v3.0)
    tier: 'free' | 'pro' | 'enterprise';
    syncEnabled: boolean;        // Cloud sync (Pro feature, v3.0)
    discordId?: string;          // Optional Discord link for community
  };

  // Global settings
  settings: {
    enabled: boolean;
    defaultMode: 'auto-replace' | 'warn-first';  // NEW
    showNotifications: boolean;
    protectedDomains: string[];
    excludedDomains: string[];
    strictMode: boolean;
    debugMode: boolean;                          // NEW
    cloudSync: boolean;                          // NEW: v3.0 Pro feature
  };

  // Profiles instead of flat aliases
  profiles: AliasProfile[];

  // Enhanced global stats
  stats: {
    totalSubstitutions: number;
    totalInterceptions: number;                  // NEW: Requests analyzed
    totalWarnings: number;                       // NEW: Warnings shown
    successRate: number;
    lastSyncTimestamp: number;
    byService: {                                 // NEW
      chatgpt: { requests: number; substitutions: number };
      claude: { requests: number; substitutions: number };
      gemini: { requests: number; substitutions: number };
    };
    activityLog: ActivityLogEntry[];            // NEW: Recent activity
  };
}
```

#### ActivityLogEntry (for Debug Console)

```typescript
interface ActivityLogEntry {
  id: string;
  timestamp: number;
  type: 'interception' | 'substitution' | 'warning' | 'error';
  service: 'chatgpt' | 'claude' | 'gemini';
  details: {
    url: string;
    profilesUsed: string[];      // Profile IDs
    piiTypesFound: string[];     // ['name', 'email']
    substitutionCount: number;
    error?: string;
  };
  message: string;
}
```

### New UI Architecture

#### Expanded Dimensions
- **Width**: 500px (up from 350px)
- **Height**: 600px (up from 400px)
- Allows for richer content, multi-column layouts

#### Tab-Based Layout

```
┌────────────────────────────────────────────────┐
│ Header: AI PII Sanitizer       [●] Active     │
├────────────────────────────────────────────────┤
│  [Aliases] [Stats] [Settings] [Debug Console] │
├────────────────────────────────────────────────┤
│                                                │
│                                                │
│              TAB CONTENT AREA                  │
│                                                │
│                                                │
└────────────────────────────────────────────────┘
```

#### Tab 1: Aliases

```
┌────────────────────────────────────────────────┐
│ Aliases                          [+ New Profile]│
├────────────────────────────────────────────────┤
│                                                │
│ ┌─────────────────────────────────────────┐  │
│ │ 👤 Greg - Work                   [●][🗑️]│  │
│ │   Greg Barker → John Smith              │  │
│ │   greg@work.com → john@example.com      │  │
│ │   (555) 123-4567 → (555) 000-0001       │  │
│ │   Used: 24 times | Last: 2 hours ago    │  │
│ └─────────────────────────────────────────┘  │
│                                                │
│ ┌─────────────────────────────────────────┐  │
│ │ 👤 Sarah - Personal              [●][🗑️]│  │
│ │   Sarah Chen → Emma Wilson              │  │
│ │   sarah@personal.com → emma@fake.com    │  │
│ │   Used: 12 times | Last: 1 day ago      │  │
│ └─────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

**Features**:
- Profile cards showing all PII mappings
- Expandable/collapsible details
- Enable/disable toggle per profile
- Usage stats at a glance
- Quick actions (edit, delete)

#### Tab 2: Stats Dashboard

```
┌────────────────────────────────────────────────┐
│ Statistics                 [Last 7 Days ▼]     │
├────────────────────────────────────────────────┤
│                                                │
│ Total Protected:  156                          │
│ Total Requests:   203                          │
│ Success Rate:     98.5%                        │
│                                                │
│ By Service:                                    │
│ ┌──────────────────────────────────────────┐  │
│ │ ChatGPT   ████████████░░ 120 (76%)      │  │
│ │ Claude    ███░░░░░░░░░░░  24 (15%)      │  │
│ │ Gemini    ██░░░░░░░░░░░░  12 (9%)       │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ By PII Type:                                   │
│ ┌──────────────────────────────────────────┐  │
│ │ Names     ████████████░░  89 (57%)      │  │
│ │ Emails    ████████░░░░░░  45 (29%)      │  │
│ │ Phones    ███░░░░░░░░░░░  22 (14%)      │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Most Used Profile:                             │
│   Greg - Work (78 substitutions)               │
│                                                │
└────────────────────────────────────────────────┘
```

**Features**:
- Visual charts/progress bars
- Time-based filtering (24h, 7d, 30d, all)
- Service breakdown
- PII type breakdown
- Most active profiles

#### Tab 3: Settings

```
┌────────────────────────────────────────────────┐
│ Settings                                       │
├────────────────────────────────────────────────┤
│                                                │
│ General                                        │
│ ┌────────────────────────────────────────┐    │
│ │ [✓] Enable PII Protection              │    │
│ │ [✓] Show Notifications                 │    │
│ │ [ ] Debug Mode                         │    │
│ └────────────────────────────────────────┘    │
│                                                │
│ Substitution Mode                              │
│ ┌────────────────────────────────────────┐    │
│ │ ◉ Auto-Replace (Default)               │    │
│ │   Automatically replace PII with alias │    │
│ │                                        │    │
│ │ ○ Warn First                           │    │
│ │   Show popup before replacing          │    │
│ └────────────────────────────────────────┘    │
│                                                │
│ Protected Services                             │
│ ┌────────────────────────────────────────┐    │
│ │ [✓] ChatGPT                            │    │
│ │ [✓] Claude                             │    │
│ │ [✓] Gemini                             │    │
│ └────────────────────────────────────────┘    │
│                                                │
│ Advanced                                       │
│   [Clear all stats]  [Export profiles]         │
│                                                │
│ Community & Updates                            │
│ ┌────────────────────────────────────────┐    │
│ │ [✓] Get notified about new features    │    │
│ │     (Optional - no account required)   │    │
│ │                                        │    │
│ │  Email: _____________________          │    │
│ │         [Subscribe]                    │    │
│ │                                        │    │
│ │ ℹ️ Used only for product updates.     │    │
│ │    ~1 email/month. Unsubscribe anytime.│    │
│ │                                        │    │
│ │ [Discord] Join our Discord community   │    │
│ └────────────────────────────────────────┘    │
│                                                │
└────────────────────────────────────────────────┘
```

**Features**:
- Global enable/disable
- Mode selection (auto-replace vs warn-first)
- Per-service toggles
- Debug mode toggle
- Data management (export, clear)
- **Optional email opt-in** for community updates (NEW)
- **Discord community link** (NEW)

#### Tab 4: Debug Console

```
┌────────────────────────────────────────────────┐
│ Debug Console                    [Clear Log]   │
├────────────────────────────────────────────────┤
│                                                │
│ [14:32:15] ✓ Interception - ChatGPT           │
│   Found: 2 PII items (name, email)            │
│   Profile: Greg - Work                         │
│   Substituted: 2 items                         │
│                                                │
│ [14:28:03] ⚠ Warning - ChatGPT                │
│   Found: 1 PII item (phone)                    │
│   User approved replacement                    │
│                                                │
│ [14:15:42] ✗ Error - Claude                   │
│   Failed to parse response                     │
│   Details: JSON parse error at line 24         │
│                                                │
│ [13:58:21] ✓ Interception - ChatGPT           │
│   Found: 1 PII item (name)                     │
│   Profile: Sarah - Personal                    │
│                                                │
│ [View More...]                                 │
│                                                │
└────────────────────────────────────────────────┘
```

**Features**:
- Real-time activity log
- Color-coded by type (success, warning, error)
- Expandable details
- Clear log button
- Persistent across sessions (last 100 entries)

### State Management with Zustand

#### Why Zustand?

- **Lightweight**: ~1KB vs Redux ~3KB
- **Simple API**: No boilerplate, actions, or reducers
- **TypeScript-first**: Excellent type inference
- **Cross-context**: Easy to sync between popup/background/content
- **Devtools**: React DevTools support for debugging

#### Store Structure

```typescript
// src/store/index.ts

interface AppState {
  // Profiles
  profiles: AliasProfile[];
  activeProfileId: string | null;

  // Config
  config: UserConfig;

  // UI State
  ui: {
    activeTab: 'aliases' | 'stats' | 'settings' | 'debug';
    isAddingProfile: boolean;
    expandedProfiles: Set<string>;
  };

  // Activity Log
  activityLog: ActivityLogEntry[];

  // Actions
  addProfile: (profile: Omit<AliasProfile, 'id' | 'metadata'>) => Promise<void>;
  updateProfile: (id: string, updates: Partial<AliasProfile>) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  toggleProfile: (id: string) => Promise<void>;

  setActiveTab: (tab: string) => void;
  toggleProfileExpansion: (id: string) => void;

  addActivityLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  clearActivityLog: () => void;

  updateStats: (updates: Partial<UserConfig['stats']>) => Promise<void>;
  updateSettings: (updates: Partial<UserConfig['settings']>) => Promise<void>;

  // Sync with storage
  loadFromStorage: () => Promise<void>;
  syncToStorage: () => Promise<void>;
}

const useStore = create<AppState>((set, get) => ({
  // Initial state
  profiles: [],
  activeProfileId: null,
  config: DEFAULT_CONFIG,
  ui: {
    activeTab: 'aliases',
    isAddingProfile: false,
    expandedProfiles: new Set(),
  },
  activityLog: [],

  // Actions implementations...
}));
```

---

## Architecture Changes

### Component Hierarchy

```
Extension Root
│
├── Service Worker (background.ts)
│   ├── Request Interceptor
│   │   └── Multi-PII Matcher (NEW)
│   ├── Response Processor
│   └── Stats Tracker (ENHANCED)
│
├── Content Script (content.ts)
│   ├── Fetch Override
│   ├── Warning Modal (NEW)
│   └── Highlight Manager
│
└── Popup UI
    ├── Zustand Store (NEW)
    ├── Tab Manager (NEW)
    │   ├── AliasesTab
    │   │   ├── ProfileCard (NEW)
    │   │   └── ProfileEditor (NEW)
    │   ├── StatsTab (NEW)
    │   ├── SettingsTab (NEW)
    │   └── DebugConsoleTab (NEW)
    └── Shared Components
        ├── Header
        └── StatusIndicator
```

### Enhanced AliasEngine

**New Capabilities**:
1. **Multi-PII Matching**: Scan for name, email, phone, address simultaneously
2. **Profile-Aware**: Return which profile matched
3. **Context Building**: Build substitution context for warning modal

```typescript
// Enhanced substitute method signature
substitute(
  text: string,
  direction: 'encode' | 'decode',
  options?: {
    mode?: 'auto' | 'detect-only';  // NEW: detect without replacing
    profileIds?: string[];           // NEW: limit to specific profiles
  }
): SubstitutionResult & {
  profilesMatched: Array<{           // NEW
    profileId: string;
    profileName: string;
    piiTypes: string[];
    matches: Array<{ type: string; value: string; position: number }>;
  }>;
}
```

### Warning Modal (Warn-First Mode)

When `settings.defaultMode === 'warn-first'`:

```
┌──────────────────────────────────────────────┐
│          ⚠️ Personal Information Detected     │
├──────────────────────────────────────────────┤
│                                              │
│ We found the following personal info:        │
│                                              │
│ Profile: Greg - Work                         │
│  • Name: Greg Barker                         │
│  • Email: greg@work.com                      │
│                                              │
│ Replace with alias before sending?           │
│                                              │
│  [✓] Don't ask again for this profile        │
│                                              │
│     [Cancel]      [Replace & Send]           │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Monetization & Account Strategy

### Overview

**Philosophy**: Privacy-first with optional monetization. All core features remain free and local.

### V2.0: Foundation (Free Tier)

**No Required Accounts**:
- All features work 100% locally
- No sign-up, no login, no paywalls
- Open source codebase

**Optional Email Collection**:
- In Settings → "Community & Updates" section
- User can opt-in to receive product updates
- One-time submission to Mailchimp/ConvertKit
- Stored locally in `UserConfig.account.email`
- Used only for occasional newsletters (~1/month)

**Discord Community**:
- Link in Settings tab
- Free support, feature requests, discussions
- No account linking required

### V3.0: Freemium Model (Future)

#### Free Tier (v2.0 Feature Set)
✅ Unlimited local profiles
✅ All PII protection (name, email, phone, address)
✅ Bidirectional substitution
✅ Stats dashboard (7-day history)
✅ Debug console
✅ ChatGPT + Claude + Gemini support
✅ No account required
✅ Open source

#### Pro Tier ($4.99/month or $49/year)
🔐 **Requires license key activation**

**Additional Features**:
- ☁️ **Cloud Sync**: Sync profiles across devices
- 📊 **Extended Analytics**: 30-day history (vs 7-day)
- 👥 **Team Shared Profiles**: Collaborate with team members
- 🎨 **Custom Themes**: Dark mode, color customization
- 🔔 **Priority Support**: Email support within 24h
- 🚀 **Early Access**: Beta features before public release

#### Enterprise Tier (Custom Pricing)
📧 **Contact for quote**

**Everything in Pro, plus**:
- 🏢 Team management dashboard
- 📋 Compliance reports (GDPR, HIPAA)
- 🔐 SSO integration
- 📞 Dedicated support
- 🎓 Training sessions

### Technical Implementation

#### License Key System

**Purchase Flow** (v3.0):
1. User visits website → purchases Pro license
2. Payment via Gumroad/Stripe
3. User receives license key via email
4. Enters key in Settings → validates via API
5. Extension stores key locally, unlocks Pro features

**License Validation**:
```typescript
// Lightweight validation API (serverless function)
POST https://api.ai-pii-sanitizer.com/v1/validate
{
  "licenseKey": "PRO-XXXX-XXXX-XXXX",
  "extensionId": "chrome-extension-id"
}

Response:
{
  "valid": true,
  "tier": "pro",
  "expiresAt": 1735689600000,
  "features": ["cloud-sync", "extended-analytics", "team-profiles"]
}
```

**Validation Frequency**:
- Check on startup (cached for 24h)
- Soft validation: grace period if offline
- No features disabled mid-session

**Open Source Handling**:
- License code is visible (honor system)
- Forking loses cloud sync (our backend)
- Most users will support development

#### Cloud Sync Architecture (Pro Feature)

**How It Works**:
```
Extension (Pro)
    ↕️ (encrypted profiles)
Backend API (Node.js/Deno)
    ↕️
Database (PostgreSQL)
```

**Encryption**:
- Profiles encrypted client-side before upload
- Server stores encrypted blobs (zero-knowledge)
- Decryption key derived from user password (never sent)

**Sync Strategy**:
- Conflict resolution: last-write-wins + manual merge UI
- Background sync every 5 minutes (if changes detected)
- Manual sync button

### Email Collection (V2.0)

**UI Flow**:
1. User opens Settings tab
2. Sees "Community & Updates" section
3. Checks "Get notified about new features"
4. Enters email → clicks "Subscribe"
5. Extension sends email to Mailchimp via serverless function
6. Saves `emailOptIn: true` locally (don't ask again)

**Technical**:
```typescript
// Serverless function (Netlify/Vercel)
POST https://api.ai-pii-sanitizer.com/v1/subscribe
{
  "email": "user@example.com",
  "source": "chrome-extension"
}

// Adds to Mailchimp list via API
// Returns success/error
```

**Privacy**:
- Email never leaves browser except to subscription service
- No tracking, no analytics
- Unsubscribe link in every email

### Discord Server

**Purpose**:
- Community support (free tier users)
- Feature requests & discussions
- Beta testing coordination
- Announcements (new releases)

**Channels**:
- `#general` - General chat
- `#support` - Help with issues
- `#feature-requests` - Vote on features
- `#beta` - Early access testing
- `#dev` - For contributors

**No Integration** (for now):
- Just a link in Settings
- No Discord auth in extension
- Keep it simple

### Future Considerations

**Team Profiles** (Enterprise):
- Admin creates team workspace
- Shares profile library with team
- Central management console

**API Access** (Enterprise):
- RESTful API for integration
- Webhook support
- Rate-limited by tier

**White-Label** (Enterprise):
- Custom branding
- Self-hosted backend option

---

## Migration Strategy

### Data Migration

**Challenge**: Existing v1 aliases → v2 profiles

**Strategy**:
1. Detect version on load (UserConfig.version)
2. If version === 1, run migration
3. Convert each AliasEntry to minimal AliasProfile

```typescript
async function migrateV1ToV2(v1Config: UserConfigV1): Promise<UserConfig> {
  const profiles: AliasProfile[] = [];

  // Group v1 aliases by category (best effort)
  const grouped = new Map<string, AliasEntry[]>();

  for (const alias of v1Config.aliases) {
    const key = alias.category || 'default';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(alias);
  }

  // Convert each group to a profile
  for (const [category, aliases] of grouped) {
    const profile: AliasProfile = {
      id: generateId(),
      profileName: category === 'default' ? 'Imported' : category,
      description: 'Migrated from v1',
      enabled: true,
      real: {},
      alias: {},
      metadata: {
        createdAt: Math.min(...aliases.map(a => a.metadata.createdAt)),
        updatedAt: Date.now(),
        usageStats: {
          totalSubstitutions: aliases.reduce((sum, a) => sum + a.metadata.usageCount, 0),
          lastUsed: Math.max(...aliases.map(a => a.metadata.lastUsed)),
          byService: { chatgpt: 0, claude: 0, gemini: 0 },
          byPIIType: { name: 0, email: 0, phone: 0, address: 0 },
        },
        confidence: 1,
      },
      settings: {
        autoReplace: true,
        highlightInUI: true,
        activeServices: ['chatgpt', 'claude', 'gemini'],
      },
    };

    // Map aliases to profile fields
    for (const alias of aliases) {
      if (alias.type === 'name') {
        profile.real.name = alias.realValue;
        profile.alias.name = alias.aliasValue;
      } else if (alias.type === 'email') {
        profile.real.email = alias.realValue;
        profile.alias.email = alias.aliasValue;
      }
      // ... etc
    }

    profiles.push(profile);
  }

  return {
    version: 2,
    settings: { ...v1Config.settings, defaultMode: 'auto-replace', debugMode: false },
    profiles,
    stats: {
      ...v1Config.stats,
      totalInterceptions: 0,
      totalWarnings: 0,
      byService: { chatgpt: {}, claude: {}, gemini: {} },
      activityLog: [],
    },
  };
}
```

### Rollback Plan

- Keep v1 backup in storage (`config_backup_v1`)
- Provide "Revert to v1" button in settings (first 30 days)
- After 30 days, delete backup

---

## Implementation Plan

### Phase 1: Data Layer (Week 1)

**Tasks**:
- [ ] Define new TypeScript interfaces (AliasProfile, enhanced UserConfig, ActivityLogEntry)
- [ ] Update StorageManager to handle profiles
- [ ] Implement data migration (v1 → v2)
- [ ] Write migration tests
- [ ] Update AliasEngine to work with profiles
  - [ ] Multi-PII matching
  - [ ] Profile-aware results
  - [ ] Detect-only mode

**Deliverable**: New data structures working, backward-compatible loading

### Phase 2: State Management (Week 1-2)

**Tasks**:
- [ ] Install Zustand (`npm install zustand`)
- [ ] Create store structure (`src/store/index.ts`)
- [ ] Implement profile actions (add, update, remove, toggle)
- [ ] Implement stats actions
- [ ] Implement activity log actions
- [ ] Write store tests
- [ ] Integrate store with background script
- [ ] Set up storage sync (store ↔ Chrome Storage)

**Deliverable**: Zustand store managing all state, syncing to storage

### Phase 3: UI Foundation (Week 2)

**Tasks**:
- [ ] Update popup dimensions (500×600)
- [ ] Create tab navigation component
- [ ] Implement tab routing/switching
- [ ] Update popup.html structure for tabs
- [ ] Style tab navigation

**Deliverable**: Tabbed UI shell with navigation working

### Phase 4: Aliases Tab (Week 3)

**Tasks**:
- [ ] Design ProfileCard component
- [ ] Implement profile list rendering
- [ ] Create ProfileEditor form (multi-field)
- [ ] Add expand/collapse functionality
- [ ] Integrate with Zustand store
- [ ] Style profile cards

**Deliverable**: Full profile management in Aliases tab

### Phase 5: Stats Tab (Week 3)

**Tasks**:
- [ ] Design stats layout
- [ ] Implement progress bar/chart components
- [ ] Calculate stats from store data
- [ ] Add time-based filtering (24h, 7d, 30d)
- [ ] Display breakdown by service/PII type
- [ ] Style dashboard

**Deliverable**: Visual stats dashboard

### Phase 6: Settings Tab (Week 4)

**Tasks**:
- [ ] Create settings form
- [ ] Implement mode toggle (auto-replace vs warn-first)
- [ ] Add service toggles
- [ ] Add debug mode toggle
- [ ] Implement clear stats action
- [ ] Implement export profiles action
- [ ] **Add "Community & Updates" section** (NEW)
  - [ ] Email opt-in checkbox
  - [ ] Email input field
  - [ ] Subscribe button → Mailchimp/ConvertKit integration
  - [ ] Discord community link
  - [ ] Save email opt-in status to UserConfig.account
- [ ] Style settings page

**Deliverable**: Functional settings with all controls + email collection

### Phase 7: Debug Console Tab (Week 4)

**Tasks**:
- [ ] Create activity log display component
- [ ] Implement log filtering (by type, service)
- [ ] Add clear log action
- [ ] Style console with color coding
- [ ] Hook up real-time logging from background script
- [ ] Limit log size (last 100 entries)

**Deliverable**: Working debug console with live activity

### Phase 8: Warning Modal (Week 5)

**Tasks**:
- [ ] Create modal component in content script
- [ ] Implement PII detection summary UI
- [ ] Add "Don't ask again" checkbox
- [ ] Integrate with AliasEngine detect-only mode
- [ ] Handle user approval/cancel
- [ ] Update profile settings based on checkbox
- [ ] Style modal

**Deliverable**: Warning modal working in warn-first mode

### Phase 9: Enhanced Stats Tracking (Week 5)

**Tasks**:
- [ ] Update background script to track:
  - [ ] Per-service stats
  - [ ] Per-PII type stats
  - [ ] Per-profile stats
  - [ ] Activity log entries
- [ ] Increment counters on each interception
- [ ] Persist to storage periodically
- [ ] Optimize for performance

**Deliverable**: Detailed stats populating correctly

### Phase 10: Testing & Polish (Week 6)

**Tasks**:
- [ ] E2E testing (all tabs, all features)
- [ ] Migration testing (v1 → v2)
- [ ] Performance testing (100+ profiles)
- [ ] UI polish (animations, loading states)
- [ ] Error handling UI
- [ ] Accessibility (keyboard navigation)
- [ ] Documentation updates

**Deliverable**: Production-ready v2.0

---

## Technical Considerations

### Performance

**Concerns**:
- Multiple PII types → more regex operations
- Larger data structures
- More complex UI

**Mitigations**:
- Lazy load profile details (only expand when clicked)
- Virtualized lists for 100+ profiles
- Memoize expensive computations
- Throttle activity log updates
- Index profiles by PII type for faster lookup

### Security

**No Regressions**:
- Continue AES-GCM encryption for profiles
- Store remains local-only
- No new network requests

**Enhancements**:
- Debug console: don't log full PII values (mask them)
- Activity log: sanitize before display

### Backward Compatibility

**Breaking Changes**:
- Storage schema (handled by migration)
- AliasEntry → AliasProfile (internal only)

**Non-Breaking**:
- API messages (backward compatible)
- Core substitution logic (same behavior)

---

## Success Metrics

### User Experience

- [ ] Profile creation takes < 30 seconds
- [ ] UI renders in < 100ms
- [ ] Stats update in real-time
- [ ] Debug console helpful for troubleshooting

### Technical

- [ ] Migration success rate: 100%
- [ ] No data loss
- [ ] Performance: < 50ms substitution for 10 profiles
- [ ] Test coverage: > 80%

### Feature Completion

- [ ] Multi-PII profiles working
- [ ] All 4 tabs functional
- [ ] Stats accurate
- [ ] Warning mode working
- [ ] Debug console useful

---

## Open Questions

1. **Profile Limit**: Should we cap at 50 profiles? 100?
   - **Decision**: 100 profiles, show warning at 75

2. **Stats Persistence**: How long to keep activity log?
   - **Decision**: 100 most recent entries, or 30 days (whichever is smaller)

3. **Export Format**: JSON? CSV?
   - **Decision**: JSON (easier to re-import)

4. **Warning Modal Timing**: Show before or after message is typed?
   - **Decision**: Intercept on send (less disruptive)

5. **Profile Templates**: Offer pre-made templates (e.g., "Work Profile")?
   - **Decision**: Post-MVP feature

---

## Rollout Plan

### Alpha (Internal Testing)

- Deploy to dev environment
- Manual testing with 10+ profiles
- Fix critical bugs
- Duration: 1 week

### Beta (Limited Users)

- Share unpacked extension with 5-10 users
- Gather feedback
- Monitor error logs (debug console)
- Duration: 2 weeks

### Production

- Chrome Web Store submission
- Announce v2.0 launch
- Monitor adoption & migration success
- Duration: Ongoing

---

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Migration fails, data loss | High | Low | Backup v1 data, test migration thoroughly |
| Performance degrades with many profiles | Medium | Medium | Optimize matching, use indexing |
| UI too complex for users | Medium | Medium | User testing, simplify based on feedback |
| Zustand adds bugs | Medium | Low | Thorough testing, keep logic simple |
| Scope creep delays launch | Low | High | Strict phase gates, MVP discipline |

---

## Conclusion

This refactor transforms AI PII Sanitizer from a simple name aliasing tool to a comprehensive identity protection system. The profile-based approach, enhanced UI, and robust stats tracking position the extension to compete with (and differentiate from) tools like Lakera Privacy Guard.

**Key Differentiators**:
- **Bidirectional substitution** (vs Lakera's detection-only)
- **Identity profiles** (vs single-PII alerts)
- **Transparent operation** (vs intrusive warnings)
- **Rich stats dashboard** (vs basic counters)

By implementing this refactor methodically over 6 weeks, we'll deliver a production-ready v2.0 that users will love.

---

**Next Steps**:
1. Review this document
2. Get approval on scope
3. Commit current state as v1.0 baseline
4. Begin Phase 1: Data Layer
