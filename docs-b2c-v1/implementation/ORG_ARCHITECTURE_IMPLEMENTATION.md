# Org-Based Architecture Implementation Guide
**Status**: READY TO IMPLEMENT (Plan validated against codebase)
**Source**: Consolidated from `MIGRATION_ANALYSIS_B2C_TO_TEAMS.md` (2025-11-16)
**Target**: Phase 0+1 Combined Launch (B2C + Teams from Day 1)

---

## Table of Contents
1. [Why Org-Based from Day 1](#why-org-based-from-day-1)
2. [Firestore Schema](#firestore-schema)
3. [Implementation Checklist](#implementation-checklist)
4. [Migration Strategy](#migration-strategy)
5. [Testing Plan](#testing-plan)

---

## Why Org-Based from Day 1

### The Technical Debt Problem
**If we launch B2C first, then add Teams later:**
- ❌ Painful data migration (profiles → aliases in nested org structure)
- ❌ Chrome permission warnings ("Extension Updated - Review New Permissions")
- ❌ User resistance to change ("it worked fine before")
- ❌ Risk of data loss during migration
- ❌ Weeks of migration code + user support

**If we launch with org-based architecture from Day 1:**
- ✅ Individuals = orgs with 1 member (backward compatible)
- ✅ Small teams = orgs with 5-20 members (ready to test)
- ✅ Zero migration needed (architecture scales naturally)
- ✅ All permissions requested upfront (no scary updates)
- ✅ Real enterprise feedback during beta (not guessing features)

### The Business Opportunity
**Small Teams for Beta Testing**:
- Law firms (2-10 attorneys) - High privacy needs
- Chiropractors (3-8 staff) - HIPAA compliance required
- Consultants (2-5 partners) - Client confidentiality
- Family businesses (3-10 employees) - Simple admin needs

**Benefit**: Get real feedback on team features BEFORE public launch, not after.

---

## Firestore Schema

### Current Schema (B2C Only)
```
users/{userId}
  - email: string
  - tier: 'free' | 'pro'
  - stripeCustomerId: string
  - stripeSubscriptionId: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

### Target Schema (Org-Based)

```
organizations/{orgId}
  - orgId: string                        // "org_abc123xyz" for individuals, "org_team_xyz" for teams
  - name: string                         // "Personal Account" for individuals, "Acme Law Firm" for teams
  - type: 'individual' | 'team' | 'enterprise' | 'power'
  - plan: 'free' | 'pro' | 'team' | 'enterprise'
  - seats: number                        // 1 for individuals, 5-50 for teams
  - settings: {
      orgName: string,
      timezone: string,
      defaultLayerVisibility: 'personal' | 'shared'
    }
  - billing: {
      stripeCustomerId: string,
      stripeSubscriptionId: string,
      billingEmail: string,
      nextBillingDate: Timestamp
    }
  - createdBy: string                    // userId who created org
  - createdAt: Timestamp
  - updatedAt: Timestamp

  /members/{userId}
    - userId: string                     // Firebase UID
    - email: string
    - displayName: string
    - role: 'owner' | 'admin' | 'member'
    - accessLayers: string[]             // ["layer_personal", "layer_team_shared"]
    - invitedBy: string                  // userId who sent invite
    - invitedAt: Timestamp
    - joinedAt: Timestamp
    - lastActive: Timestamp

  /alias_layers/{layerId}
    - layerId: string                    // "layer_personal" or "layer_team_shared"
    - name: string                       // "Personal", "Team Shared"
    - description: string
    - createdBy: string                  // userId
    - visibleToRoles: string[]           // ["owner"] for personal, ["owner", "admin", "member"] for shared
    - editableByRoles: string[]          // ["owner"] for personal, ["owner", "admin"] for shared
    - createdAt: Timestamp
    - updatedAt: Timestamp

    /aliases/{aliasId}
      - aliasId: string
      - realValueHash: string            // sha256(realName) for matching
      - realValueEncrypted: string       // AES-256-GCM encrypted with org or user key
      - aliasValue: string               // Plaintext (safe to expose)
      - category: 'name' | 'email' | 'phone' | 'cellPhone' | 'address' | 'company' | 'jobTitle' | 'custom'
      - createdBy: string                // userId
      - createdAt: Timestamp
      - updatedAt: Timestamp
      - usageCount: number
      - lastUsed: Timestamp
      - variations: string[]             // PRO feature: ["GregBarker", "greg.barker", ...]

users/{userId}  (KEEP - backwards compatibility)
  - uid: string
  - email: string
  - displayName: string
  - photoURL: string
  - primaryOrgId: string                 // "org_abc123xyz" (user's default org)
  - orgMemberships: {
      "org_abc123xyz": {
        role: 'owner',
        joinedAt: Timestamp
      },
      "org_team_xyz": {
        role: 'member',
        joinedAt: Timestamp
      }
    }
  - tier: 'free' | 'pro'                 // DEPRECATED (use organizations/{orgId}.plan instead)
  - stripeCustomerId: string             // DEPRECATED
  - stripeSubscriptionId: string         // DEPRECATED
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

### Key Design Decisions

**1. Per-User vs Org-Level Encryption**

**Decision**: Use per-user encryption for maximum privacy

```typescript
// Personal layer aliases
encrypt(alias, deriveKey(user.firebaseUID))  // Only that user can decrypt

// Team shared layer aliases
encrypt(alias, deriveKey(org.orgId))  // All team members can decrypt
```

**Benefit**: Team admins CANNOT decrypt personal aliases (strong privacy boundary)

**2. Layer-Based Access Control**

**Layers**:
- `layer_personal` - Only visible to profile owner
- `layer_team_shared` - Visible to all team members

**Roles**:
- `owner` - Can view/edit all layers, manage members, billing
- `admin` - Can view/edit shared layers, manage members (no billing)
- `member` - Can view/use shared layers (read-only)

**Future**: Add more layers (department-specific, project-specific) in Phase 2

**3. Firestore Rules**

```javascript
// firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // === ORGANIZATIONS ===
    match /organizations/{orgId} {
      // User can read org if they're a member
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));

      // Only owner can update org settings or delete
      allow update, delete: if request.auth != null &&
        get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role == 'owner';

      // === MEMBERS ===
      match /members/{userId} {
        // Members can read member list
        allow read: if request.auth != null &&
          exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));

        // Owner/admin can add/remove members
        allow create, delete: if request.auth != null &&
          get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role in ['owner', 'admin'];

        // User can update their own member doc (lastActive, etc.)
        allow update: if request.auth.uid == userId;
      }

      // === ALIAS LAYERS ===
      match /alias_layers/{layerId} {
        // User can read layer if their role is in visibleToRoles
        allow read: if request.auth != null &&
          get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role in resource.data.visibleToRoles;

        // User can edit layer if their role is in editableByRoles
        allow create, update, delete: if request.auth != null &&
          get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role in resource.data.editableByRoles;

        // === ALIASES ===
        match /aliases/{aliasId} {
          // Inherit parent layer visibility
          allow read: if request.auth != null &&
            exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));

          // Inherit parent layer editability
          allow create, update, delete: if request.auth != null &&
            get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role in
            get(/databases/$(database)/documents/organizations/$(orgId)/alias_layers/$(layerId)).data.editableByRoles;
        }
      }
    }

    // === USERS (backwards compatibility) ===
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## Implementation Checklist

### Phase B1: Firestore Backend (3-5 days)

- [ ] **Update Firestore Schema**
  - [ ] Create `organizations` collection (test with emulator first)
  - [ ] Create `organizations/{orgId}/members` subcollection
  - [ ] Create `organizations/{orgId}/alias_layers` subcollection
  - [ ] Create `organizations/{orgId}/alias_layers/{layerId}/aliases` subcollection
  - [ ] Keep `users` collection (backwards compatibility)

- [ ] **Deploy Firestore Rules**
  - [ ] Copy rules from [Firestore Rules](#firestore-rules) above
  - [ ] Test rules in Firebase emulator
  - [ ] Deploy: `firebase deploy --only firestore:rules`
  - [ ] Verify rules in Firebase Console

- [ ] **Create Migration Cloud Function**
  - [ ] File: `functions/src/migrateUserToOrgModel.ts`
  - [ ] Function: `migrateUserToOrgModel(userId: string)`
  - [ ] Logic:
    ```typescript
    async function migrateUserToOrgModel(userId: string) {
      // 1. Check if already migrated
      const user = await db.collection('users').doc(userId).get();
      if (user.data()?.primaryOrgId) {
        return { success: true, message: 'Already migrated' };
      }

      // 2. Create personal org
      const orgId = `org_${userId}`;
      await db.collection('organizations').doc(orgId).set({
        orgId,
        name: 'Personal Account',
        type: 'individual',
        plan: user.data()?.tier || 'free',  // Inherit from user tier
        seats: 1,
        settings: { orgName: 'Personal Account', timezone: 'UTC' },
        billing: {
          stripeCustomerId: user.data()?.stripeCustomerId || null,
          stripeSubscriptionId: user.data()?.stripeSubscriptionId || null,
          billingEmail: user.data()?.email
        },
        createdBy: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. Add user as owner
      await db.collection('organizations').doc(orgId)
        .collection('members').doc(userId).set({
          userId,
          email: user.data()?.email,
          displayName: user.data()?.displayName || user.data()?.email,
          role: 'owner',
          accessLayers: ['layer_personal'],
          invitedBy: userId,
          invitedAt: admin.firestore.FieldValue.serverTimestamp(),
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastActive: admin.firestore.FieldValue.serverTimestamp()
        });

      // 4. Create personal layer
      await db.collection('organizations').doc(orgId)
        .collection('alias_layers').doc('layer_personal').set({
          layerId: 'layer_personal',
          name: 'Personal',
          description: 'Your personal aliases (only you can see these)',
          createdBy: userId,
          visibleToRoles: ['owner'],
          editableByRoles: ['owner'],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      // 5. Migrate existing profiles from chrome.storage to Firestore
      // NOTE: This happens in extension, not Cloud Function (Cloud Function can't access chrome.storage)
      // Cloud Function just creates org structure, extension migrates profiles on next sign-in

      // 6. Update user doc with primaryOrgId
      await db.collection('users').doc(userId).update({
        primaryOrgId: orgId,
        orgMemberships: {
          [orgId]: {
            role: 'owner',
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
          }
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, orgId, message: 'Migration complete' };
    }
    ```

  - [ ] Deploy: `firebase deploy --only functions:migrateUserToOrgModel`
  - [ ] Test with dummy user in Firebase emulator

- [ ] **Update Stripe Webhook**
  - [ ] File: `functions/src/stripeWebhook.ts`
  - [ ] Update `checkout.session.completed` handler:
    ```typescript
    // OLD: Update users/{userId}.tier
    await db.collection('users').doc(userId).update({ tier: 'pro' });

    // NEW: Update organizations/{orgId}.plan
    const user = await db.collection('users').doc(userId).get();
    const orgId = user.data()?.primaryOrgId;
    if (orgId) {
      await db.collection('organizations').doc(orgId).update({ plan: 'pro' });
    }
    ```
  - [ ] Update `customer.subscription.deleted` handler similarly
  - [ ] Deploy: `firebase deploy --only functions:stripeWebhook`

**Deliverable**: Firestore org structure ready, migration function deployed

---

### Phase B2: Extension Storage Layer (5-7 days)

- [ ] **Update Storage Manager for Org Support**
  - [ ] File: `src/lib/storage.ts` (or create `src/lib/storage/StorageOrgManager.ts`)
  - [ ] Add `currentOrgId` to config:
    ```typescript
    interface UserConfig {
      account: {
        email: string;
        firebaseUid: string;
        tier: 'free' | 'pro';
        currentOrgId?: string;  // NEW
        orgMemberships?: {      // NEW
          [orgId: string]: {
            role: 'owner' | 'admin' | 'member';
            joinedAt: string;
          };
        };
      };
      // ... rest of config
    }
    ```

  - [ ] Add Firestore sync methods:
    ```typescript
    async function loadProfilesFromFirestore(orgId: string): Promise<AliasProfile[]> {
      // 1. Get user's accessible layers
      const member = await db.collection('organizations').doc(orgId)
        .collection('members').doc(userId).get();
      const accessLayers = member.data()?.accessLayers || [];

      // 2. Load aliases from all accessible layers
      const allAliases = [];
      for (const layerId of accessLayers) {
        const aliases = await db.collection('organizations').doc(orgId)
          .collection('alias_layers').doc(layerId)
          .collection('aliases').get();

        for (const doc of aliases.docs) {
          allAliases.push(doc.data());
        }
      }

      // 3. Convert Firestore aliases to AliasProfile format
      // (Group by profile, decrypt encrypted values, etc.)
      return convertAliasesToProfiles(allAliases);
    }

    async function saveProfileToFirestore(orgId: string, profile: AliasProfile) {
      const layerId = 'layer_personal';  // For now, always save to personal layer

      // Convert profile to individual aliases
      const aliases = [
        {
          aliasId: `${profile.id}_name`,
          realValueHash: sha256(profile.realIdentity.name),
          realValueEncrypted: encrypt(profile.realIdentity.name, userKey),
          aliasValue: profile.aliasIdentity.name,
          category: 'name',
          createdBy: userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          // ... more fields
        },
        // ... repeat for email, phone, etc.
      ];

      // Save to Firestore
      const batch = db.batch();
      for (const alias of aliases) {
        const ref = db.collection('organizations').doc(orgId)
          .collection('alias_layers').doc(layerId)
          .collection('aliases').doc(alias.aliasId);
        batch.set(ref, alias);
      }
      await batch.commit();
    }
    ```

  - [ ] Add Firestore realtime listeners:
    ```typescript
    function setupFirestoreSync(orgId: string) {
      // Listen for changes to org's aliases
      db.collection('organizations').doc(orgId)
        .collection('alias_layers')
        .onSnapshot((snapshot) => {
          // Reload profiles when team members update shared aliases
          loadProfilesFromFirestore(orgId);
        });
    }
    ```

  - [ ] Add offline queue:
    ```typescript
    // Write to chrome.storage immediately, queue Firestore write
    async function saveProfile(profile: AliasProfile) {
      // 1. Save locally (offline-first)
      await saveToLocalStorage(profile);

      // 2. Queue Firestore write
      await queueFirestoreWrite(profile);
    }

    async function queueFirestoreWrite(profile: AliasProfile) {
      if (navigator.onLine) {
        await saveProfileToFirestore(currentOrgId, profile);
      } else {
        // Add to pending queue
        await addToPendingQueue(profile);
      }
    }

    // On reconnect, flush queue
    window.addEventListener('online', async () => {
      const queue = await getPendingQueue();
      for (const profile of queue) {
        await saveProfileToFirestore(currentOrgId, profile);
      }
      clearPendingQueue();
    });
    ```

**Deliverable**: Storage layer supports org-scoped profiles, Firestore sync, offline queue

---

### Phase B3: Extension UI Updates (4-6 days)

- [ ] **Add Org Switcher** (if user in multiple orgs)
  - [ ] File: `src/popup/components/orgSwitcher.ts` (create new)
  - [ ] UI: Dropdown in header (next to user profile dropdown)
  - [ ] Logic:
    ```typescript
    async function renderOrgSwitcher() {
      const config = await storage.loadConfig();
      const orgMemberships = config.account.orgMemberships || {};

      if (Object.keys(orgMemberships).length <= 1) {
        // User only in 1 org, hide switcher
        return;
      }

      // Show dropdown with org names
      const orgs = await Promise.all(
        Object.keys(orgMemberships).map(orgId =>
          db.collection('organizations').doc(orgId).get()
        )
      );

      const dropdown = `
        <select id="orgSwitcher">
          ${orgs.map(org => `
            <option value="${org.id}" ${org.id === config.account.currentOrgId ? 'selected' : ''}>
              ${org.data().name}
            </option>
          `).join('')}
        </select>
      `;

      // On change, switch org and reload profiles
      document.getElementById('orgSwitcher').addEventListener('change', async (e) => {
        const newOrgId = e.target.value;
        await storage.updateConfig({ account: { currentOrgId: newOrgId } });
        await reloadProfiles();
      });
    }
    ```

- [ ] **Add Layer Tabs** (Personal vs Team Shared)
  - [ ] File: `src/popup/components/profileRenderer.ts` (update existing)
  - [ ] UI: Tab buttons above profile list
  - [ ] Logic:
    ```typescript
    async function renderLayerTabs() {
      const config = await storage.loadConfig();
      const orgId = config.account.currentOrgId;

      // Get user's accessible layers
      const member = await db.collection('organizations').doc(orgId)
        .collection('members').doc(userId).get();
      const accessLayers = member.data()?.accessLayers || [];

      if (accessLayers.length <= 1) {
        // User only has personal layer, hide tabs
        return;
      }

      // Show tabs
      const tabs = `
        <div class="layer-tabs">
          <button class="tab ${currentLayer === 'layer_personal' ? 'active' : ''}" data-layer="layer_personal">
            Personal
          </button>
          <button class="tab ${currentLayer === 'layer_team_shared' ? 'active' : ''}" data-layer="layer_team_shared">
            Team Shared
          </button>
        </div>
      `;

      // On click, filter profiles by layer
      document.querySelectorAll('.layer-tabs .tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          currentLayer = e.target.dataset.layer;
          renderProfiles();  // Re-render with filtered profiles
        });
      });
    }
    ```

- [ ] **Update Profile Cards** (show layer affiliation)
  - [ ] File: `src/popup/components/profileRenderer.ts` (update existing)
  - [ ] Add badge to team profiles:
    ```html
    <div class="profile-card">
      <h3>
        ${profile.profileName}
        ${profile.layer === 'layer_team_shared' ? '<span class="badge">Team</span>' : ''}
      </h3>
      <!-- ... rest of card -->
    </div>
    ```

  - [ ] Disable edit/delete for team profiles if user is 'member' (read-only)

- [ ] **Add "Upgrade to Teams" Button** (for individual users)
  - [ ] File: `src/popup/components/settingsHandlers.ts` (update existing)
  - [ ] Location: Settings tab → Account section
  - [ ] Button: "Upgrade to Teams" (opens Stripe checkout with team pricing)
  - [ ] Hide button if user already in a team org

**Deliverable**: UI adapts based on org type (individual vs team), layer tabs, org switcher

---

### Phase C: Teams-Specific Features (5-7 days)

- [ ] **Team Admin Panel**
  - [ ] File: `src/popup/components/teamAdmin.ts` (create new)
  - [ ] Location: New "Team" tab (only visible to owner/admin)
  - [ ] Features:
    - [ ] View team members list (table with name, email, role, last active)
    - [ ] Invite new members (email input → send invite link)
    - [ ] Remove members (with confirmation)
    - [ ] View team usage stats (substitutions per member)
    - [ ] Manage shared alias layer (create/edit/delete shared aliases)

- [ ] **Team Invite System**
  - [ ] Backend: `functions/src/inviteTeamMember.ts` (create new)
    ```typescript
    export const inviteTeamMember = functions.https.onCall(async (data, context) => {
      const { orgId, email, role } = data;
      const inviterId = context.auth.uid;

      // 1. Verify inviter is owner/admin
      const inviter = await db.collection('organizations').doc(orgId)
        .collection('members').doc(inviterId).get();
      if (!['owner', 'admin'].includes(inviter.data()?.role)) {
        throw new functions.https.HttpsError('permission-denied', 'Only owners/admins can invite');
      }

      // 2. Create invite link (expires in 7 days)
      const inviteToken = crypto.randomBytes(32).toString('hex');
      await db.collection('invites').doc(inviteToken).set({
        orgId,
        email,
        role: role || 'member',
        invitedBy: inviterId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // 3. Send email (use SendGrid, Firebase Email Extension, or custom SMTP)
      const inviteLink = `https://promptblocker.com/invite?token=${inviteToken}`;
      await sendEmail({
        to: email,
        subject: 'You've been invited to join PromptBlocker',
        html: `
          <p>You've been invited to join ${orgName} on PromptBlocker.</p>
          <a href="${inviteLink}">Accept Invite</a>
        `
      });

      return { success: true, inviteToken };
    });
    ```

  - [ ] Frontend: Accept invite flow
    - [ ] Page: `src/invite.html` (create new)
    - [ ] Logic: Validate token, auto-join org on sign-in

- [ ] **Shared Alias Layer Management**
  - [ ] File: `src/popup/components/sharedAliases.ts` (create new)
  - [ ] Features:
    - [ ] View shared aliases (table view)
    - [ ] Create shared alias (modal form)
    - [ ] Edit shared alias (owner/admin only)
    - [ ] Delete shared alias (owner/admin only)
    - [ ] Copy shared alias to personal layer (all members)

**Deliverable**: Full team collaboration features (invite, shared aliases, admin panel)

---

### Phase D: Testing (3-5 days)

- [ ] **Update Unit Tests**
  - [ ] File: `tests/storage.test.ts` (update for org support)
  - [ ] Test org-scoped profile loading
  - [ ] Test Firestore sync (use Firebase emulator)
  - [ ] Test offline queue

- [ ] **Add Integration Tests**
  - [ ] File: `tests/integration/orgMigration.test.ts` (create new)
  - [ ] Test user migration (B2C → org model)
  - [ ] Test team invite flow
  - [ ] Test multi-org switching
  - [ ] Test layer-based access control

- [ ] **Manual Testing**
  - [ ] Test as individual user (should see no "org" terminology)
  - [ ] Test as team owner (invite members, manage shared aliases)
  - [ ] Test as team member (view shared aliases, cannot edit)
  - [ ] Test multi-org switching (user in 2+ orgs)
  - [ ] Test offline mode (profiles cached, sync when online)

**Deliverable**: All tests passing (target: 800+ tests from 750)

---

## Migration Strategy

### For Existing Users (If Any)

**Trigger**: User signs in after org-based code deployed

**Migration Flow**:
```
1. User clicks "Sign in with Google"
2. Firebase auth returns user.uid
3. Extension checks: config.account.currentOrgId exists?
4. If NO:
   a) Call Cloud Function: migrateUserToOrgModel(userId)
   b) Cloud Function creates org structure in Firestore
   c) Extension reads encrypted profiles from chrome.storage.local
   d) Extension decrypts profiles (using Firebase UID key)
   e) Extension converts profiles to aliases (one alias per field)
   f) Extension uploads aliases to Firestore (organizations/{orgId}/alias_layers/layer_personal/aliases)
   g) Extension keeps local profiles as backup (not deleted)
   h) Extension updates config.account.currentOrgId
5. If YES:
   a) User already migrated, load profiles normally
```

**Safety**:
- ✅ Local profiles NEVER deleted (backup in case Firestore write fails)
- ✅ Migration is idempotent (safe to run multiple times)
- ✅ Rollback: If Firestore fails, user still has local profiles (fallback mode)

### Rollback Plan

**If migration fails for some users**:
```typescript
// Extension detects Firestore connection failed
if (firestoreSyncFailed) {
  // Fall back to local-only mode
  console.warn('[Storage] Firestore sync failed, using local storage only');
  const localProfiles = await loadFromChromeStorage();
  return localProfiles;
}
```

**User sees banner**: "Sync failed, using local data. [Retry Sync]"

---

## Testing Plan

### Unit Tests (Add 50+ tests)

**File**: `tests/storage.test.ts`
- [ ] Test `loadProfilesFromFirestore(orgId)`
- [ ] Test `saveProfileToFirestore(orgId, profile)`
- [ ] Test offline queue (write when offline, sync when online)
- [ ] Test org switcher (switch orgs, reload profiles)

**File**: `tests/integration/orgMigration.test.ts` (new)
- [ ] Test migration (local profiles → Firestore aliases)
- [ ] Test idempotency (migrate twice, no duplicates)
- [ ] Test rollback (Firestore fails, fall back to local)

### Integration Tests (Add 10+ tests)

**Firebase Emulator Required**:
```bash
firebase emulators:start
```

**File**: `tests/integration/firestore.test.ts`
- [ ] Test Firestore rules (owner can edit, member cannot)
- [ ] Test team invite (create invite, accept invite, user added to org)
- [ ] Test layer access (member can view shared layer, cannot edit)

### Manual Testing Checklist

**Individual User Flow**:
- [ ] Sign in as new user → auto-creates personal org
- [ ] Create profile → saves to Firestore
- [ ] Sign out, sign in → profiles reloaded
- [ ] No "org" terminology visible in UI (seamless)

**Team Owner Flow**:
- [ ] Create team → org created with type='team'
- [ ] Invite member → email sent, invite link works
- [ ] Create shared alias → visible to all members
- [ ] View usage stats → see team member activity

**Team Member Flow**:
- [ ] Accept invite → joined org
- [ ] View shared aliases → can use, cannot edit
- [ ] Create personal alias → only visible to self

**Multi-Org Flow**:
- [ ] User in 2 orgs → org switcher visible
- [ ] Switch org → profiles reload for new org
- [ ] Create profile in org A → not visible in org B

---

## Success Criteria

### Phase B1-B3 Complete When:
- ✅ Firestore schema deployed (orgs, members, layers, aliases)
- ✅ Migration function works (tested with dummy data)
- ✅ Storage layer supports org-scoped profiles
- ✅ UI adapts to individual vs team context
- ✅ Org switcher works (for multi-org users)
- ✅ Layer tabs work (personal vs shared)

### Phase C Complete When:
- ✅ Team admin panel functional (invite, manage members)
- ✅ Team invite system works (email sent, invite accepted)
- ✅ Shared alias management works (create, edit, delete)

### Phase D Complete When:
- ✅ All tests passing (800+ tests)
- ✅ Manual testing complete (individual + team flows)
- ✅ No critical bugs (data loss, security issues)

### Ready for Launch When:
- ✅ Individuals can use extension (seamless, no "org" visible)
- ✅ Teams can invite members, share aliases, manage billing
- ✅ Beta testing complete (5+ individual users, 2+ teams)
- ✅ Chrome Web Store approved

---

## Summary

**Org-based architecture from Day 1 = future-proof, scalable, zero migration debt.**

**Implementation Order**:
1. Firestore backend (schema + rules + migration function)
2. Extension storage (org support + Firestore sync)
3. Extension UI (org switcher, layer tabs)
4. Teams features (admin panel, invite system)
5. Testing (unit + integration + manual)
6. Launch (individuals + teams simultaneously)

**Total Estimated Time**: 3-4 weeks (if working full-time on this)

---

**Next**: See `../testing/ORG_TESTING_STRATEGY.md` for detailed test plan
