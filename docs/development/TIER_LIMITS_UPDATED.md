# Updated Tier Limits & Downgrade Strategy

**Date:** November 6, 2025
**Status:** 📋 Design Approved - Ready to Implement

---

## New Tier Structure

### FREE Tier (Updated)
- ✅ **1 alias profile** (down from 5)
- ✅ **3 starter templates** (provided by us, read-only)
- ✅ **0 custom templates** (can't create or edit)
- ✅ **10 API keys** (OpenAI only)
- ✅ **Quick Alias: Single generation** (basic templates only)
- ❌ **No custom redaction rules**

### PRO Tier ($4.99/month or $49/year)
- ✅ **Unlimited alias profiles**
- ✅ **3 starter templates** (same as FREE)
- ✅ **Unlimited custom templates** (create & edit)
- ✅ **Unlimited API keys** (all patterns)
- ✅ **Quick Alias: Bulk generation** (2-10 profiles, PRO themes)
- ✅ **Custom redaction rules**

---

## Template System Design

### Starter Templates (Always Free, Read-Only)
These 3 templates are provided to ALL users (FREE and PRO):

1. **Professional Email** - Generate professional emails
2. **Code Review Request** - Request AI code review
3. **Meeting Summary** - Create meeting notes

**Behavior:**
- Always visible to all users
- **Cannot be edited** by FREE users (read-only)
- **Cannot be deleted** by FREE users
- PRO users **CAN edit and delete** them (become custom templates)

**Implementation:**
- Add `isStarter: true` flag to starter templates
- Add `readonly: boolean` flag (true for FREE, false for PRO)
- UI shows lock icon on starter templates for FREE users

---

### Custom Templates (PRO Only)
**FREE users:** Cannot create or edit templates
**PRO users:** Unlimited custom templates

**When FREE user tries to create template:**
```
🔒 Custom Templates - PRO Feature

Creating custom templates requires PRO.

With PRO you get:
• Unlimited custom templates
• Edit starter templates
• Advanced template variables
• Share templates (coming soon)

[Upgrade to PRO - $4.99/month]  [Cancel]
```

---

## Profile Limits (Simplified)

### OLD (Confusing):
- FREE: 5 profiles
- PRO: Unlimited

### NEW (Clear):
- FREE: **1 profile only**
- PRO: **Unlimited profiles**

**Rationale:**
- Simpler to explain: "1 free profile, unlimited with PRO"
- Stronger incentive to upgrade
- Easier to implement limits
- Most users need multiple personas → upgrade
- Single profile is enough to try the product

---

## Downgrade Strategy

### When PRO → FREE (Subscription Cancelled)

**Option 1: Nuke & Archive (Recommended)**
```
Your subscription was cancelled.

FREE tier includes:
• 1 alias profile (your data has been reset)
• 3 starter templates (read-only)

Your PRO data has been archived and will be restored if you re-subscribe within 90 days.

[Learn More]  [Reactivate PRO]
```

**What happens:**
1. **Archive ALL PRO data** (profiles, templates, rules, settings)
   - Encrypted export stored in Chrome local storage
   - Expires after 90 days
   - Can be restored on re-subscription

2. **Reset to clean FREE state:**
   - Delete all profiles (user starts fresh with 1 new profile)
   - Delete all custom templates (keep 3 starter templates)
   - Delete all custom rules
   - Reset all settings to FREE defaults

3. **Show restoration notice:**
   - "Your PRO data is archived for 90 days"
   - "Re-subscribe to restore everything instantly"

---

### Archive Data Structure

**Stored as:** `_archivedProData` in Chrome storage

```typescript
interface ArchivedProData {
  userId: string;
  archivedAt: number; // timestamp
  expiresAt: number;  // archivedAt + 90 days

  // Encrypted backup of PRO data
  encryptedData: string; // Contains:
  // - All profiles
  // - All custom templates
  // - All custom rules
  // - PRO settings
  // - Usage stats
}
```

**Size estimate:** ~50KB encrypted (well within Chrome storage limits)

---

### Restoration Flow (When User Re-Subscribes)

**User re-subscribes within 90 days:**

```
Welcome back to PRO! 🎉

We found your archived data from [date].

Would you like to restore your previous settings?
• 15 alias profiles
• 8 custom templates
• 5 custom rules
• All your previous settings

[Restore My Data]  [Start Fresh]
```

**If user clicks "Restore My Data":**
1. Decrypt archived data
2. Restore all profiles, templates, rules
3. Merge with any new FREE data (if they created a profile)
4. Show success: "Your PRO data has been restored!"

**If user clicks "Start Fresh":**
1. Delete archived data
2. Keep current FREE profile (if exists)
3. Start with clean PRO slate

---

### Archive Expiration (After 90 Days)

**Automatic cleanup:**
- Background job checks for expired archives weekly
- Delete expired archives automatically
- No user notification (it's been 90 days)

**If user re-subscribes after 90 days:**
```
Welcome back to PRO! 🎉

You're starting with a clean slate since your previous data expired after 90 days.

Ready to create unlimited profiles and templates!

[Get Started]
```

---

## Implementation Plan

### Phase 1: Update Tier Limits (30 min)
1. **Profile limit:** Change from 5 → 1 for FREE
   - File: `src/lib/storage.ts`
   - Add check: `if (isFree && profiles.length >= 1)`

2. **Template logic:** Mark starters as readonly for FREE
   - File: `src/lib/storage.ts`
   - Add `isStarter: true` to 3 starter templates
   - Block `addPromptTemplate()` for FREE users
   - Block `updatePromptTemplate()` for FREE users on starter templates

3. **Custom rules:** Enforce PRO-only
   - File: `src/popup/components/featuresTab.ts:52` → `tier: 'pro'`
   - File: `src/lib/storage.ts` → Block `addCustomRule()` for FREE

### Phase 2: Implement Archive System (2 hours)
1. **Create archive utility** (`src/lib/tierArchive.ts`)
   - `archiveProData(userId)` - Encrypt and save PRO data
   - `restoreProData(userId)` - Decrypt and restore
   - `clearArchivedData(userId)` - Delete archive
   - `isArchiveExpired(timestamp)` - Check 90-day expiration

2. **Update downgrade handler**
   - File: `src/lib/tierMigration.ts`
   - Call `archiveProData()` before wiping
   - Reset to clean FREE state
   - Show restoration notice

3. **Add restoration UI**
   - File: `src/popup/components/tierRestoration.ts` (new)
   - Modal: "Restore your archived data?"
   - Button: "Restore My Data" / "Start Fresh"

### Phase 3: UI Updates (1 hour)
1. **Profile creation button**
   - Show "1/1 profiles" for FREE users
   - Disable "New Profile" button when at limit
   - Show upgrade modal when clicked

2. **Template tab**
   - Lock icon on starter templates for FREE users
   - "Create Template" button shows upgrade modal for FREE
   - "PRO Feature" badge on custom templates

3. **Downgrade notification**
   - Show modal when tier changes from PRO → FREE
   - Explain what happened
   - Offer re-subscription

---

## Code Changes Summary

### 1. Profile Limit (1 for FREE)
**File:** `src/lib/storage.ts` (Line ~187)

```typescript
async createProfile(profileData: {...}): Promise<AliasProfile> {
  const profiles = await this.loadProfiles();

  // Check FREE tier limit (1 profile max)
  const config = await this.loadConfig();
  const isFree = config?.account?.tier === 'free';

  if (isFree && profiles.length >= 1) {
    throw new Error('FREE_TIER_LIMIT: You can only create 1 profile on the FREE tier. Upgrade to PRO for unlimited profiles.');
  }

  // ... rest of method
}
```

---

### 2. Template Logic (Starters Free, Custom PRO)
**File:** `src/lib/storage.ts`

```typescript
getStarterTemplates() {
  const now = Date.now();
  return [
    {
      id: `starter-professional-email`,
      isStarter: true, // NEW FLAG
      readonly: false, // Will be set dynamically based on tier
      name: "Professional Email",
      // ... rest of template
    },
    // ... other 2 starter templates
  ];
}

async addPromptTemplate(templateData: {...}): Promise<PromptTemplate> {
  const config = await this.loadConfig();
  const isFree = config?.account?.tier === 'free';

  // FREE users cannot create custom templates
  if (isFree) {
    throw new Error('PRO_FEATURE: Creating custom templates requires PRO tier. Upgrade to unlock unlimited templates.');
  }

  // ... rest of method (PRO users only reach here)
}

async updatePromptTemplate(id: string, updates: {...}) {
  const config = await this.loadConfig();
  const isFree = config?.account?.tier === 'free';

  const template = await this.getPromptTemplate(id);

  // FREE users cannot edit starter templates
  if (isFree && template?.isStarter) {
    throw new Error('PRO_FEATURE: Editing templates requires PRO tier. Upgrade to unlock.');
  }

  // ... rest of method
}
```

---

### 3. Archive System (NEW FILE)
**File:** `src/lib/tierArchive.ts`

```typescript
import { StorageManager } from './storage';

interface ArchivedProData {
  userId: string;
  archivedAt: number;
  expiresAt: number;
  encryptedData: string;
}

const ARCHIVE_KEY = '_archivedProData';
const ARCHIVE_DURATION_DAYS = 90;

export async function archiveProData(userId: string): Promise<void> {
  console.log('[Archive] 📦 Archiving PRO data for user:', userId);

  const storage = StorageManager.getInstance();

  // Collect all PRO data
  const profiles = await storage.loadProfiles();
  const config = await storage.loadConfig();

  const proData = {
    profiles: profiles, // All profiles
    customTemplates: config?.promptTemplates?.templates.filter(t => !t.isStarter) || [],
    customRules: config?.customRules?.rules || [],
    settings: config?.settings || {},
    stats: config?.stats || {},
  };

  // Encrypt the data
  const encrypted = await storage.encrypt(JSON.stringify(proData));

  const archive: ArchivedProData = {
    userId,
    archivedAt: Date.now(),
    expiresAt: Date.now() + (ARCHIVE_DURATION_DAYS * 24 * 60 * 60 * 1000),
    encryptedData: encrypted,
  };

  // Save to Chrome storage
  await chrome.storage.local.set({ [ARCHIVE_KEY]: archive });

  console.log('[Archive] ✅ PRO data archived, expires in 90 days');
}

export async function getArchivedData(userId: string): Promise<ArchivedProData | null> {
  const result = await chrome.storage.local.get(ARCHIVE_KEY);
  const archive = result[ARCHIVE_KEY] as ArchivedProData | undefined;

  if (!archive || archive.userId !== userId) {
    return null;
  }

  // Check if expired
  if (Date.now() > archive.expiresAt) {
    await clearArchivedData(userId);
    return null;
  }

  return archive;
}

export async function restoreProData(userId: string): Promise<boolean> {
  console.log('[Archive] 📂 Restoring PRO data for user:', userId);

  const archive = await getArchivedData(userId);
  if (!archive) {
    console.warn('[Archive] No archived data found');
    return false;
  }

  const storage = StorageManager.getInstance();

  // Decrypt the data
  const decrypted = await storage.decrypt(archive.encryptedData);
  const proData = JSON.parse(decrypted);

  // Restore profiles
  await storage.saveProfiles(proData.profiles);

  // Restore templates, rules, settings
  const config = await storage.loadConfig();
  if (config) {
    config.promptTemplates.templates = [
      ...storage.getStarterTemplates(), // Keep starters
      ...proData.customTemplates,       // Add custom
    ];
    config.customRules = { enabled: true, rules: proData.customRules };
    config.settings = { ...config.settings, ...proData.settings };
    config.stats = { ...config.stats, ...proData.stats };

    await storage.saveConfig(config);
  }

  // Clear the archive (no longer needed)
  await clearArchivedData(userId);

  console.log('[Archive] ✅ PRO data restored successfully');
  return true;
}

export async function clearArchivedData(userId: string): Promise<void> {
  await chrome.storage.local.remove(ARCHIVE_KEY);
  console.log('[Archive] 🗑️  Archived data cleared');
}

export function formatArchiveDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
```

---

### 4. Downgrade Handler (UPDATED)
**File:** `src/lib/tierMigration.ts`

```typescript
import { archiveProData } from './tierArchive';
import { StorageManager } from './storage';

export async function handleDowngrade(userId: string): Promise<void> {
  console.log('[Downgrade] ⬇️  User downgraded to FREE, starting migration...');

  // Step 1: Archive all PRO data (90-day restoration)
  await archiveProData(userId);

  // Step 2: Wipe everything and reset to clean FREE state
  const storage = StorageManager.getInstance();

  // Clear all profiles
  await storage.saveProfiles([]);
  console.log('[Downgrade] 🗑️  Cleared all profiles');

  // Reset config to FREE defaults
  const config = await storage.loadConfig();
  if (config) {
    // Keep only starter templates
    config.promptTemplates.templates = storage.getStarterTemplates();

    // Clear custom rules
    config.customRules = { enabled: false, rules: [] };

    // Clear API keys (or limit to 10)
    if (config.apiKeyVault && config.apiKeyVault.keys.length > 10) {
      config.apiKeyVault.keys = config.apiKeyVault.keys.slice(0, 10);
    }

    // Reset stats
    config.stats = {
      ...config.stats,
      totalSubstitutions: 0,
      activityLog: [],
    };

    await storage.saveConfig(config);
  }

  console.log('[Downgrade] ✅ Downgrade complete - user reset to FREE tier');
  console.log('[Downgrade] 📦 PRO data archived for 90 days');
}
```

---

## User Experience Flow

### Downgrade Notification Modal

```
┌─────────────────────────────────────────┐
│  🔔 Your PRO Subscription Was Cancelled │
│                                         │
│  You're now on the FREE tier:          │
│  • 1 alias profile                      │
│  • 3 starter templates (read-only)     │
│                                         │
│  📦 Your PRO data has been archived     │
│     and will be restored if you         │
│     re-subscribe within 90 days.        │
│                                         │
│  [Reactivate PRO]    [Continue Free]   │
└─────────────────────────────────────────┘
```

### Re-Subscription Restoration Modal

```
┌─────────────────────────────────────────┐
│  🎉 Welcome Back to PRO!                │
│                                         │
│  We found your archived data from       │
│  October 15, 2025                       │
│                                         │
│  Restore your previous setup?           │
│  • 15 alias profiles                    │
│  • 8 custom templates                   │
│  • 5 custom rules                       │
│  • All your settings                    │
│                                         │
│  [Restore My Data]    [Start Fresh]    │
└─────────────────────────────────────────┘
```

---

## Summary

### New Limits:
- **FREE:** 1 profile, 3 starter templates (read-only), no custom rules
- **PRO:** Unlimited everything

### Downgrade Strategy:
- **Archive PRO data** (encrypted, 90-day expiration)
- **Wipe FREE data** (clean slate)
- **Restore on re-sub** (within 90 days)

### Is This Doable?
✅ **YES! Very doable:**
- Chrome storage has plenty of space (~10MB limit)
- 90 days of archived data = ~50KB encrypted
- Encryption already implemented in storage manager
- Restoration is just decrypting and re-saving
- Clean, simple user experience

### Implementation Time:
- Phase 1 (Limits): 30 minutes
- Phase 2 (Archive): 2 hours
- Phase 3 (UI): 1 hour
- **Total: ~3.5 hours**

---

**Ready to implement?** This is a solid, user-friendly approach that protects revenue while being fair to users who might want to come back! 🚀
