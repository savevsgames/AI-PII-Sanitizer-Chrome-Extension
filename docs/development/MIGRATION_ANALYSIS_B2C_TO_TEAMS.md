# Migration Analysis: B2C to Teams/Enterprise Architecture

**Date**: 2025-11-16
**Purpose**: Analyze the migration complexity from current single-user B2C architecture to org-based Teams/Enterprise model
**Status**: ANALYSIS ONLY - NO CODE CHANGES YET

---

## Executive Summary

**Current State**: PromptBlocker is a **single-user B2C extension** with:
- All data stored locally in `chrome.storage.local` (encrypted)
- Minimal Firestore usage (just user auth + Stripe subscriptions)
- No cloud sync, no sharing, no teams

**Proposed State**: Org-based multi-user platform with:
- Firestore-first architecture (cloud sync required)
- Organizations, members, layers, shared aliases
- Teams, Enterprise, and VPN tiers

**The Big Question**: Can we migrate existing users smoothly, or do we need a separate codebase?

**TL;DR Answer**:
- ✅ **MIGRATE IN-PLACE** - Don't create new repo
- ✅ We can do it with **ZERO user downtime**
- ✅ Existing users auto-migrate on next sign-in
- ✅ They keep using B2C extension exactly as before
- ✅ Teams features are **additive** (new UI, not replacing old)

---

## Current Architecture (As-Is)

### Data Storage Locations

**1. Chrome Local Storage (`chrome.storage.local`)**
```typescript
// ALL user data currently lives here (encrypted)
{
  // Encrypted with Firebase UID-derived key
  profiles: "[ENCRYPTED]",  // AliasProfile[] encrypted as JSON string
  documentAliases: "[ENCRYPTED]",  // DocumentAlias[] encrypted

  // NOT encrypted (safe config data)
  config: {
    version: 1,
    account: {
      email: "user@example.com",
      tier: "free" | "pro",
      syncEnabled: false,  // NOT IMPLEMENTED YET
      firebaseUid: "abc123xyz",
    },
    settings: { enabled: true, defaultMode: "auto-replace", ... },
    stats: { totalSubstitutions: 150, ... },
  },

  // Encryption keys (public, not sensitive)
  _encryptionSalt: "random_salt_hex",
}
```

**2. Firestore (Minimal Usage)**
```
users/{userId}
  - email: string
  - tier: 'free' | 'pro'
  - stripeCustomerId: string
  - stripeSubscriptionId: string
  - createdAt: Timestamp
  - updatedAt: Timestamp

(NO subcollections - profiles NOT in Firestore)
```

**Key Insight**: Firestore is currently **NOT the source of truth** for profiles. It's only for:
1. User account metadata
2. Stripe subscription status (managed by webhooks)

### Encryption Model

```typescript
// Current encryption flow:
1. User signs in with Google OAuth → Firebase Auth returns UID
2. Extension derives key: PBKDF2(uid, salt, 600k iterations) → AES-256-GCM key
3. Profiles encrypted: encrypt(JSON.stringify(profiles), key) → store in chrome.storage.local
4. Key NEVER stored (re-derived each session from UID)
5. User signs out → key lost → profiles unreadable until next sign-in
```

**Security Properties**:
- ✅ Profiles encrypted at rest (in `chrome.storage.local`)
- ✅ Encryption key not stored locally (requires auth to derive)
- ✅ Even if attacker steals `chrome.storage.local`, can't decrypt without Firebase session
- ❌ No cloud backup (if user loses device, data is GONE)
- ❌ No sync across devices (profiles on Device A don't appear on Device B)

### Current Firestore Rules

```javascript
// firestore.rules (current)
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

match /users/{userId}/profiles/{profileId} {
  allow read, write: if request.auth.uid == userId;
}
// Note: /profiles subcollection EXISTS in rules but is EMPTY (not used)

match /subscriptions/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if false; // Backend only
}
```

---

## Proposed Architecture (To-Be)

### New Firestore Schema

```
organizations/{orgId}
  - orgId: string (e.g., "org_abc123xyz" for individuals)
  - name: string ("Personal Account" for individuals, "Acme Inc" for teams)
  - type: 'individual' | 'team' | 'enterprise' | 'power'
  - plan: 'free' | 'pro' | 'team' | 'enterprise'
  - seats: number (1 for individuals, 5+ for teams)
  - stripeCustomerId: string
  - stripeSubscriptionId: string
  - createdAt: Timestamp

  /members/{userId}
    - userId: string
    - email: string
    - role: 'owner' | 'admin' | 'member'
    - accessLayers: string[] (e.g., ['layer_personal'])
    - joinedAt: Timestamp

  /alias_layers/{layerId}
    - layerId: string (e.g., "layer_personal", "layer_team_shared")
    - name: string ("Personal", "Team Shared")
    - createdBy: string (userId)
    - visibleToRoles: string[] (['owner'] for personal, ['owner', 'member'] for shared)
    - editableByRoles: string[] (['owner'] for personal, ['admin', 'owner'] for shared)

    /aliases/{aliasId}
      - aliasId: string
      - realValueHash: string (sha256 hash for matching)
      - realValueEncrypted: string (encrypted with org key)
      - aliasValue: string (plaintext - safe to expose)
      - category: 'name' | 'email' | 'phone' | ...
      - createdBy: string (userId)
      - createdAt: Timestamp
      - usageCount: number
      - lastUsed: Timestamp

users/{userId}  (KEPT - for Firebase Auth compatibility)
  - uid: string
  - email: string
  - primaryOrgId: string (e.g., "org_abc123xyz")
  - orgMemberships: { [orgId]: { role, joinedAt } }
  - createdAt: Timestamp
```

### Key Changes

| Aspect | Current (B2C) | Proposed (Org-Based) |
|--------|---------------|----------------------|
| **Data Source of Truth** | `chrome.storage.local` | Firestore |
| **Profile Storage** | Local only (encrypted) | Firestore (encrypted) + cached locally |
| **Multi-Device Sync** | ❌ No | ✅ Yes (Firestore realtime listeners) |
| **Cloud Backup** | ❌ No | ✅ Yes (data in Firestore) |
| **Multi-User** | ❌ No | ✅ Yes (orgs with members) |
| **Sharing** | ❌ No | ✅ Yes (shared layers) |
| **Encryption Location** | Local only | Local + Firestore (double encryption) |
| **Encryption Key** | Derived from Firebase UID | Derived from Firebase UID (per user) OR org-level key |
| **User Data Model** | Flat user document | User → Org → Layers → Aliases (nested) |
| **Billing** | Per-user Stripe sub | Per-org Stripe sub (multi-seat) |

---

## Migration Complexity Analysis

### What Needs to Change?

#### 1. **Firestore Schema** (NEW COLLECTIONS)

**Impact**: ADDITIVE (doesn't break existing users)

```typescript
// NEW collections to create:
organizations/{orgId}
organizations/{orgId}/members/{userId}
organizations/{orgId}/alias_layers/{layerId}
organizations/{orgId}/alias_layers/{layerId}/aliases/{aliasId}

// EXISTING collections (KEEP AS-IS):
users/{userId}  // Add new fields: primaryOrgId, orgMemberships
subscriptions/{userId}  // Keep for backwards compat
```

**Migration Strategy**:
```typescript
// When existing user signs in AFTER migration deployed:
async function ensureOrgExists(userId: string) {
  const user = await db.collection('users').doc(userId).get();

  // Check if already migrated
  if (user.data()?.primaryOrgId) {
    return user.data().primaryOrgId; // Already migrated
  }

  // First sign-in after migration → auto-create personal org
  const orgId = `org_${userId}`;
  await createPersonalOrg(userId, orgId);

  // Migrate local profiles to Firestore
  await migrateLocalProfilesToFirestore(userId, orgId);

  return orgId;
}
```

**Result**: Existing users seamlessly migrated on next sign-in.

---

#### 2. **Extension Code Changes**

**Files That Need Updates**:

**A. Storage Layer** (`src/lib/storage/`)

| File | Current Behavior | New Behavior | Complexity |
|------|-----------------|--------------|------------|
| `StorageProfileManager.ts` | Reads/writes `chrome.storage.local` | Reads/writes Firestore + caches locally | **HIGH** |
| `StorageEncryptionManager.ts` | Encrypts with user's Firebase UID | Same (per-user encryption) OR org-level key | **MEDIUM** |
| `StorageConfigManager.ts` | Manages local config | Add `currentOrgId`, `orgMemberships` | **LOW** |

**B. Firestore Service** (`src/lib/firebaseService.ts`)

| Function | Current | New | Complexity |
|----------|---------|-----|------------|
| `syncUserToFirestore()` | Creates `users/{uid}` doc | ALSO creates org if not exists | **MEDIUM** |
| NEW: `getOrganization()` | N/A | Fetch org data | **LOW** |
| NEW: `getAliasLayers()` | N/A | Fetch layers user can access | **MEDIUM** |
| NEW: `saveAlias()` | N/A | Save to Firestore `aliases` subcollection | **MEDIUM** |
| NEW: `deleteAlias()` | N/A | Delete from Firestore | **LOW** |

**C. UI Components** (`src/popup-v2.ts`, `src/components/`)

| Component | Current | New | Complexity |
|-----------|---------|-----|------------|
| Profile List | Shows local profiles | Shows profiles from Firestore (with loading state) | **MEDIUM** |
| Profile Form | Saves to `chrome.storage.local` | Saves to Firestore | **LOW** |
| NEW: Org Switcher | N/A | Dropdown to switch between orgs (if user in multiple) | **MEDIUM** |
| NEW: Layer Tabs | N/A | "Personal" / "Team Shared" tabs | **LOW** |
| Settings | Local settings only | Add "Cloud Sync" toggle | **LOW** |

**D. Background Service** (`src/background.ts`)

| Feature | Current | New | Complexity |
|---------|---------|-----|------------|
| Substitution Engine | Reads profiles from `chrome.storage.local` | Reads from Firestore (cached locally) | **MEDIUM** |
| Realtime Sync | N/A | Listen to Firestore changes (team members update shared aliases) | **HIGH** |
| Offline Support | Works offline (local data) | Cache Firestore data, queue writes when offline | **HIGH** |

**E. Cloud Functions** (`functions/src/`)

| Function | Current | New | Complexity |
|----------|---------|-----|------------|
| `stripeWebhook.ts` | Updates `users/{uid}.tier` | Updates `organizations/{orgId}.plan` | **MEDIUM** |
| NEW: `createTeamCheckoutSession.ts` | N/A | Create Stripe checkout for team subscriptions | **MEDIUM** |
| NEW: `inviteTeamMember.ts` | N/A | Send email invite to join team | **LOW** |
| NEW: `acceptTeamInvite.ts` | N/A | Add user to org members | **LOW** |

---

#### 3. **Data Migration Script**

**When Needed**: When user signs in AFTER org-based code is deployed

**What It Does**:
1. Check if user has `primaryOrgId` (already migrated?)
2. If not, create personal org: `org_{userId}`
3. Read encrypted profiles from `chrome.storage.local`
4. Decrypt using Firebase UID-derived key
5. Create `layer_personal` in Firestore
6. For each profile field (realName/aliasName, realEmail/aliasEmail, etc.):
   - Hash real value: `sha256(realName)`
   - Encrypt real value: `encrypt(realName, userKey)`
   - Create alias doc in Firestore
7. Mark user as migrated: `users/{userId}.primaryOrgId = org_{userId}`
8. Keep local profiles as cache (for offline use)

**Edge Cases**:
- User has no profiles → Create empty org, done
- User is already on Team (early adopter) → Skip personal org creation
- User signed in on 2 devices → First device to sign in triggers migration, second device pulls from Firestore

**Rollback Safety**:
- ✅ Local profiles NEVER deleted (kept as backup)
- ✅ If Firestore write fails, user still has local data
- ✅ Migration is idempotent (safe to run multiple times)

---

#### 4. **Firestore Security Rules**

**NEW Rules Required**:

```javascript
// firestore.rules (updated)
match /organizations/{orgId} {
  // User can read org if they're a member
  allow read: if request.auth.uid != null &&
    exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));

  // Only owner can update org settings
  allow update: if request.auth.uid != null &&
    get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role == 'owner';

  match /members/{userId} {
    // Members can read member list
    allow read: if request.auth.uid != null &&
      exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));

    // Only owner/admin can add/remove members
    allow write: if request.auth.uid != null &&
      get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role in ['owner', 'admin'];
  }

  match /alias_layers/{layerId} {
    // User can read layer if they have access
    allow read: if request.auth.uid != null &&
      request.auth.uid in resource.data.visibleToRoles ||
      get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role in resource.data.visibleToRoles;

    // User can write if they have edit permission
    allow write: if request.auth.uid != null &&
      get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role in resource.data.editableByRoles;

    match /aliases/{aliasId} {
      // Inherit parent layer permissions
      allow read: if request.auth.uid != null &&
        exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));

      allow write: if request.auth.uid != null &&
        get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role in
        get(/databases/$(database)/documents/organizations/$(orgId)/alias_layers/$(layerId)).data.editableByRoles;
    }
  }
}

// Keep existing rules for backwards compat
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

**Complexity**: **MEDIUM** (nested rules, role checks)

---

## Migration Path Options

### Option 1: ❌ **New Repo (Separate Codebase)**

**Pros**:
- Clean slate (no legacy code)
- Can design from scratch for orgs
- No risk of breaking existing B2C users

**Cons**:
- ❌ **Two codebases to maintain** (massive overhead)
- ❌ Users must migrate manually (install new extension, export/import data)
- ❌ Lose all existing users (they don't auto-upgrade)
- ❌ Chrome Web Store shows 2 extensions (confusing)
- ❌ Duplicated code (storage, encryption, UI components)
- ❌ Bug fixes must be applied to BOTH repos

**Verdict**: **DON'T DO THIS**

---

### Option 2: ✅ **In-Place Migration (Same Repo, Backwards Compatible)**

**Pros**:
- ✅ One codebase (easier maintenance)
- ✅ Existing users auto-migrate seamlessly
- ✅ Backwards compatible (B2C users keep working)
- ✅ Gradual rollout (B2C → Teams → Enterprise)
- ✅ Shared code (storage, encryption, UI)

**Cons**:
- ⚠️ More complex migration logic
- ⚠️ Must maintain backwards compat during transition
- ⚠️ Firestore rules more complex (support old + new schema)

**Implementation Plan**:

**Phase 1: Preparation (Week 1-2)**
1. Create new Firestore collections (`organizations`, `alias_layers`, `aliases`)
2. Update Firestore rules (support old + new schema)
3. Write migration Cloud Function (`migrateUserToOrgModel`)
4. Test migration with dummy data

**Phase 2: Backend Changes (Week 3-4)**
1. Update `firebaseService.ts` (add org CRUD methods)
2. Update Cloud Functions (Stripe webhooks → update orgs not users)
3. Create `createTeamCheckoutSession` function
4. Deploy Cloud Functions

**Phase 3: Extension Changes (Week 5-8)**
1. Update `StorageProfileManager` (read/write Firestore)
2. Add Firestore realtime listeners (sync across devices)
3. Add offline caching (IndexedDB for Firestore data)
4. Update UI (org switcher, layer tabs)
5. Add migration UI ("Migrating your profiles to cloud...")

**Phase 4: Testing (Week 9)**
1. Test with existing B2C users (auto-migration)
2. Test with new team sign-ups
3. Test offline mode (cached data works)
4. Load testing (1000 concurrent users)

**Phase 5: Gradual Rollout (Week 10-12)**
1. Deploy to 10% of users (feature flag)
2. Monitor error rates, migration success
3. Deploy to 50% of users
4. Deploy to 100%

**Rollback Plan**:
- If migration fails: Users still have local data (not deleted)
- Feature flag to disable org-based code, fall back to local storage
- Firestore writes are non-blocking (extension works offline)

---

### Option 3: ⚠️ **Hybrid (New Repo for Teams/Enterprise, Keep B2C Separate)**

**Approach**:
- Keep current repo for B2C extension (individuals only)
- Create new repo for "PromptBlocker Teams" (different Chrome Web Store listing)
- Users who want Teams manually switch extensions

**Pros**:
- ✅ B2C code stays simple (no org complexity)
- ✅ Teams code is clean (no legacy compat)

**Cons**:
- ❌ Two Chrome Web Store listings (confusing brand)
- ❌ Users must manually export/import data
- ❌ Lost upsell opportunity (B2C users don't know about Teams)
- ❌ Duplicated code (storage, encryption, UI)

**Verdict**: **NOT RECOMMENDED** (worse than Option 2)

---

## Recommendation: Option 2 (In-Place Migration)

### Why This Is The Best Path:

**1. User Experience**
- Existing users: "Just works" (auto-migrated on next sign-in)
- New users: Get org-based architecture from day 1
- Upgrade path: Individual → Team is seamless (just add members)

**2. Business**
- One brand, one extension (PromptBlocker)
- Easy upsell (B2C users see "Upgrade to Teams" button)
- All users on latest codebase (easier support)

**3. Technical**
- Shared code (DRY principle)
- One deployment pipeline
- Bug fixes apply to everyone

**4. Migration Safety**
- ✅ Local data NEVER deleted (backup)
- ✅ Firestore writes are non-blocking (offline-first)
- ✅ Feature flags for gradual rollout
- ✅ Rollback plan if things break

---

## Migration Complexity Estimate

### Code Changes Required

| Area | Files Affected | Lines Changed | Complexity | Time Estimate |
|------|---------------|---------------|------------|---------------|
| **Firestore Schema** | `firestore.rules` | +100 | Medium | 1 day |
| **Cloud Functions** | `functions/src/*.ts` | +500 | Medium | 3 days |
| **Storage Layer** | `src/lib/storage/*.ts` | +800 | High | 5 days |
| **Firestore Service** | `src/lib/firebaseService.ts` | +400 | Medium | 3 days |
| **UI Components** | `src/popup-v2.ts`, `src/components/*` | +600 | Medium | 4 days |
| **Background Service** | `src/background.ts` | +300 | High | 3 days |
| **Migration Script** | `src/lib/migration.ts` (NEW) | +400 | High | 3 days |
| **Tests** | `tests/**/*.test.ts` | +1000 | Medium | 5 days |
| **Docs** | `docs/*.md` | +2000 | Low | 2 days |
| **Total** | ~30 files | **~6,100 lines** | **High** | **~29 days** |

**Team Size**: 1 developer (you)
**Calendar Time**: **6-8 weeks** (including testing + buffer)

---

## What About "Just Teams First" (Simpler Scope)?

**Question**: Can we do JUST the Teams tier (skip Enterprise/VPN for now)?

**Answer**: YES! Here's the simplified scope:

### Minimal Viable Migration (Teams Only)

**INCLUDE**:
- ✅ Org-based architecture (individuals = orgs with 1 member)
- ✅ Shared alias layers (team members see same aliases)
- ✅ Multi-seat Stripe billing
- ✅ Team invite flow
- ✅ Cloud sync (Firestore)

**EXCLUDE** (save for later):
- ❌ Multiple layers per org (keep it simple: 1 shared layer)
- ❌ Role-based access (everyone is "member", one "owner")
- ❌ API/MCP (extension only)
- ❌ VPN proxy (extension only)
- ❌ CSV import wizard
- ❌ Zero-knowledge mode (use standard encryption)

**Reduced Complexity**:

| Area | Full Teams | Minimal Teams | Savings |
|------|-----------|---------------|---------|
| Alias Layers | Multiple per org | 1 shared layer | -30% code |
| Access Control | Role-based | Owner/member only | -40% code |
| Encryption | Standard + zero-knowledge | Standard only | -20% code |
| API/MCP | Yes | No | -50% code |
| CSV Import | Yes | No | -15% code |
| **Total Time** | **29 days** | **~18 days** | **-38%** |

**Simplified Data Model**:

```typescript
// MINIMAL TEAMS SCHEMA
organizations/{orgId}
  - orgId, name, type: 'individual' | 'team'
  - plan: 'free' | 'pro' | 'team'
  - seats, stripeCustomerId, stripeSubscriptionId

  /members/{userId}
    - userId, email, role: 'owner' | 'member', joinedAt

  /aliases/{aliasId}  // FLAT (no layers!)
    - aliasId, realValueHash, realValueEncrypted, aliasValue
    - category, createdBy, createdAt, usageCount
    - shared: boolean  // true = team can see, false = personal only

users/{userId}
  - uid, email, primaryOrgId
```

**Benefits**:
- ✅ Simpler code (no layer nesting)
- ✅ Easier migration (flat structure)
- ✅ Faster to ship (3 weeks instead of 6)
- ✅ Still allows upgrade to Enterprise later (add layers when needed)

---

## New Repo vs In-Place: Final Verdict

### ❌ **DON'T Create New Repo**

**Reasons**:
1. ❌ Existing users won't auto-upgrade (you lose them)
2. ❌ Two codebases = 2x maintenance burden
3. ❌ Duplicated code (storage, encryption, UI)
4. ❌ Confusing brand (two extensions on Chrome Web Store)
5. ❌ Can't upsell B2C → Teams (different extensions)

### ✅ **DO Migrate In-Place**

**Reasons**:
1. ✅ Existing users auto-migrate (seamless)
2. ✅ One codebase (easier maintenance)
3. ✅ Easy upsell path (Individual → Teams)
4. ✅ Backwards compatible (B2C works during migration)
5. ✅ Shared code (bug fixes apply to everyone)

---

## Migration Risks & Mitigations

### Risk 1: **Data Loss During Migration**

**Impact**: HIGH (users lose all profiles)
**Likelihood**: LOW (if we code carefully)

**Mitigation**:
- ✅ NEVER delete local data (keep as backup)
- ✅ Migration is ADDITIVE (copy to Firestore, don't move)
- ✅ Rollback: If Firestore fails, extension reads from local storage
- ✅ User can export profiles before migration (backup button)

### Risk 2: **Migration Fails for Some Users**

**Impact**: MEDIUM (some users stuck on old schema)
**Likelihood**: MEDIUM (network errors, auth issues)

**Mitigation**:
- ✅ Retry logic (if migration fails, try again on next sign-in)
- ✅ Error logging (Firebase Analytics tracks migration success/failure)
- ✅ Manual migration UI ("Retry Migration" button in settings)
- ✅ Support can manually migrate user via Cloud Function

### Risk 3: **Performance Degradation (Firestore Reads)**

**Impact**: MEDIUM (extension feels slow)
**Likelihood**: MEDIUM (Firestore has ~100ms latency)

**Mitigation**:
- ✅ Aggressive caching (IndexedDB stores Firestore data locally)
- ✅ Offline-first (extension works without network)
- ✅ Firestore realtime listeners (push updates, not polling)
- ✅ Pagination (load 50 aliases at a time, not all 1000)

### Risk 4: **Firestore Costs Spike**

**Impact**: HIGH (unexpected $1000/month bill)
**Likelihood**: LOW (if we design queries carefully)

**Mitigation**:
- ✅ Index only what's needed (no wildcard queries)
- ✅ Cache reads (99% of reads from IndexedDB cache)
- ✅ Limit writes (batch alias updates, not 1 write per field)
- ✅ Monitor costs (Firebase console alerts if >$100/month)

**Cost Estimate** (1,000 users):
```
Firestore reads: 1,000 users × 10 profiles × 5 fields × 30 days = 1.5M reads/month
Cost: 1.5M / 50k (free tier) × $0.06/50k = ~$1.80/month

Firestore writes: 1,000 users × 2 profile updates/month × 5 fields = 10k writes/month
Cost: 10k / 20k (free tier) = FREE (under free tier)

Total: ~$2/month for 1,000 users (negligible)
```

### Risk 5: **Existing Tests Break**

**Impact**: MEDIUM (CI/CD blocked)
**Likelihood**: HIGH (storage layer changes break tests)

**Mitigation**:
- ✅ Update tests incrementally (don't break everything at once)
- ✅ Mock Firestore in unit tests (use Firebase emulator)
- ✅ E2E tests cover migration flow ("sign in → profiles appear")
- ✅ Feature flag to disable new code (if tests fail, disable orgs)

---

## Documentation Updates Required

### Files That Need Updates:

| File | Current | New | Complexity |
|------|---------|-----|------------|
| `README.md` | B2C only | Add Teams tier info | LOW |
| `docs/ARCHITECTURE.md` | Single-user | Org-based architecture | MEDIUM |
| `docs/ENCRYPTION.md` | Local encryption only | Firestore encryption + local cache | MEDIUM |
| `docs/API.md` | N/A | NEW (for future API tier) | LOW |
| `docs/FIRESTORE_SCHEMA.md` | NEW | Document org structure | MEDIUM |
| `docs/MIGRATION_GUIDE.md` | NEW | How migration works | LOW |
| `CHANGELOG.md` | Last entry: v0.9.x | Add v1.0 (Teams support) | LOW |

**Estimated Time**: 2 days

---

## Go/No-Go Decision Matrix

| Criteria | In-Place Migration | New Repo | Weight | Winner |
|----------|-------------------|----------|--------|--------|
| **User Experience** | Seamless auto-migration | Manual export/import | 10 | ✅ In-Place |
| **Maintenance Burden** | 1 codebase | 2 codebases | 9 | ✅ In-Place |
| **Time to Ship** | 6-8 weeks | 4-6 weeks (but 2 repos) | 7 | ⚠️ Tie |
| **Upsell Path** | Easy (one extension) | Hard (different extensions) | 8 | ✅ In-Place |
| **Risk of Breaking B2C** | Medium | Low | 6 | ⚠️ New Repo |
| **Code Quality** | Mixed (legacy + new) | Clean (new only) | 4 | ⚠️ New Repo |
| **Brand Consistency** | One extension | Two extensions | 7 | ✅ In-Place |
| **Long-Term Vision** | Supports all tiers | Fragmented | 9 | ✅ In-Place |
| **Total Score** | **450** | **310** | - | ✅ **In-Place** |

**Recommendation**: ✅ **Migrate in-place (same repo)**

---

## Next Steps (Action Items)

### Immediate (This Week):
1. ✅ **DECISION**: Confirm in-place migration approach
2. ⬜ Create feature branch: `feature/teams-architecture`
3. ⬜ Design minimal Teams schema (flat aliases, no layers)
4. ⬜ Write migration plan doc (step-by-step implementation)
5. ⬜ Set up Firebase emulator (local testing)

### Phase 1: Backend (Week 1-2):
1. ⬜ Update `firestore.rules` (add org rules)
2. ⬜ Create migration Cloud Function (`migrateUserToOrgModel`)
3. ⬜ Update Stripe webhook (write to orgs not users)
4. ⬜ Write unit tests (Firebase emulator)
5. ⬜ Deploy to staging Firebase project

### Phase 2: Extension (Week 3-5):
1. ⬜ Update `firebaseService.ts` (org CRUD)
2. ⬜ Update `StorageProfileManager` (Firestore reads/writes)
3. ⬜ Add Firestore cache layer (IndexedDB)
4. ⬜ Update UI (org switcher, shared aliases indicator)
5. ⬜ Add migration UI ("Syncing profiles to cloud...")

### Phase 3: Testing (Week 6):
1. ⬜ Test B2C user migration (existing users)
2. ⬜ Test new team sign-up flow
3. ⬜ Test offline mode (cached data)
4. ⬜ Load test (1000 users, 10k aliases)
5. ⬜ Security audit (Firestore rules)

### Phase 4: Launch (Week 7-8):
1. ⬜ Deploy to 10% of users (feature flag)
2. ⬜ Monitor errors (Firebase Crashlytics)
3. ⬜ Deploy to 100%
4. ⬜ Announce Teams tier (Product Hunt, blog post)
5. ⬜ Update pricing page (promptblocker.com/pricing)

---

## Conclusion

**Bottom Line**:
- ✅ **Migrate in-place** (same repo, backwards compatible)
- ✅ Start with **Minimal Teams** (flat schema, no layers)
- ✅ **6-8 weeks** to ship (including testing)
- ✅ Existing users auto-migrate (zero friction)
- ✅ Easy upsell path (Individual → Teams)

**DON'T**:
- ❌ Create new repo (maintenance nightmare)
- ❌ Build full Enterprise/VPN now (too much scope)
- ❌ Delete local data during migration (keep as backup)

**DO**:
- ✅ Start with backend (Firestore schema, Cloud Functions)
- ✅ Test migration extensively (Firebase emulator)
- ✅ Feature flag for gradual rollout
- ✅ Keep local storage as fallback (offline-first)

This is the path. Let's build it. 🚀
