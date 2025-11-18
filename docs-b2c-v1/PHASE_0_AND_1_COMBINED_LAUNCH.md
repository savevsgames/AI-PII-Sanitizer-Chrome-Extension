# Phase 0 + Phase 1: Combined B2C + Teams Launch
**Product**: PromptBlocker Chrome Extension
**Target**: Chrome Web Store with org-based architecture from Day 1
**Current Status**: 90% B2C complete, org architecture needs implementation

---

## Strategic Decision: Why Launch with Teams Architecture from Day 1

### The Problem with Sequential Launches
❌ **Launch B2C → Add Teams Later**:
- Requires painful data migration (users/{userId}/profiles → organizations/{orgId}/layers/{layerId}/aliases)
- New permissions trigger scary Chrome warning: "Extension Updated - Review New Permissions"
- Weeks of migration code + user support headaches
- Risk of data loss during migration
- Users resist change ("it worked fine before")

### The Solution: Org-Based from Day 1
✅ **Launch with Unified Architecture**:
- Individuals = orgs with 1 member (seamless, they never see "org" terminology)
- Small teams = orgs with 5-20 members (beta testing with real businesses)
- Zero migration needed (architecture scales naturally)
- All permissions requested upfront (no scary updates later)
- Real enterprise feedback during beta (not guessing features)

### Permission Strategy
**Request Now** (even if not all used immediately):
```json
"permissions": [
  "storage",           // ✅ Using now
  "unlimitedStorage",  // ✅ Using now
  "activeTab",         // ✅ Using now
  "scripting",         // ✅ Using now
  "tabs",              // ✅ Using now (for Stripe redirects)
  "identity"           // ✅ Using now (Google Sign-In)
],
"optional_permissions": [
  // None - request everything upfront to avoid future warnings
]
```

**Users won't care about extra permissions IF**:
- Privacy Policy clearly explains what each permission does
- We explicitly state "we never read your browsing history" (even though we have activeTab)
- Chrome Web Store description emphasizes local-first encryption

---

## Part 1: What's Built (Validated Against Codebase)

### ✅ Individual User Flow (100% Complete)
- Profile management, encryption, 5 platforms, tier system
- 750/750 tests passing
- Firebase Auth + Stripe integration live
- See full feature list in DOCUMENTATION_CONSOLIDATION_ANALYSIS.md Part 1

**Status**: Production-ready for individuals

### ⏳ Org-Based Architecture (Needs Implementation)
**Current State**: Single-user B2C architecture
```typescript
// Current: chrome.storage.local
{
  profiles: "[ENCRYPTED]",  // AliasProfile[]
  config: { tier: 'free' | 'pro', ... }
}

// Current: Firestore
users/{userId}
  - email, tier, stripeCustomerId, stripeSubscriptionId
```

**Target State**: Org-based multi-user architecture
```typescript
// Still use: chrome.storage.local (for offline-first)
{
  currentOrgId: "org_abc123",
  orgMemberships: {
    "org_abc123": { role: 'owner', accessLayers: ['layer_personal'] }
  },
  // Profiles cached locally per org
  cachedProfiles: {
    "org_abc123": "[ENCRYPTED]"  // Same encryption, just org-scoped
  }
}

// New: Firestore schema
organizations/{orgId}
  - orgId, name, type: 'individual' | 'team', plan, seats, settings

  /members/{userId}
    - userId, email, role: 'owner' | 'admin' | 'member', accessLayers

  /alias_layers/{layerId}
    - layerId, name (e.g., "Personal", "Team Shared")
    - visibleToRoles, editableByRoles

    /aliases/{aliasId}
      - realValueHash, realValueEncrypted, aliasValue
      - category, createdBy, usageCount, lastUsed
```

**Key Insight**: Individuals still use local storage (offline-first), but data is ALSO synced to Firestore (for multi-device + teams).

**Migration Path**: Use `MIGRATION_ANALYSIS_B2C_TO_TEAMS.md` implementation plan (already written!)

---

## Part 2: Phase 0+1 Combined Checklist

### Category A: Individual Features (Already Built ✅)
- [x] Profile management with encryption
- [x] 5 AI platform support
- [x] Firebase Auth (Google Sign-In)
- [x] Stripe payments (FREE/PRO tiers)
- [x] 6 PRO features (variations, templates, generator, etc.)
- [x] 750 passing tests

**Status**: Ready for individual users

---

### Category B: Org Architecture (Needs Implementation)

#### B1. Firestore Schema Updates
- [ ] Create `organizations/{orgId}` collection
- [ ] Create `organizations/{orgId}/members/{userId}` subcollection
- [ ] Create `organizations/{orgId}/alias_layers/{layerId}` subcollection
- [ ] Create `organizations/{orgId}/alias_layers/{layerId}/aliases/{aliasId}` subcollection
- [ ] Update Firestore security rules (see `firestore.rules` in MIGRATION_ANALYSIS)
- [ ] Deploy updated rules: `firebase deploy --only firestore:rules`

**Deliverable**: New Firestore schema live in `promptblocker-prod`

---

#### B2. Backend Migration Function
- [ ] Create Cloud Function: `migrateUserToOrgModel(userId)`
  - Auto-creates personal org: `org_{userId}`
  - Adds user as owner with `layer_personal` access
  - Migrates existing profiles to aliases (if any)
  - Updates `users/{userId}.primaryOrgId`
- [ ] Trigger on user sign-in (check if `primaryOrgId` exists, if not → migrate)
- [ ] Make migration idempotent (safe to run multiple times)
- [ ] Add rollback safety (keep local profiles as backup)

**Deliverable**: Seamless auto-migration for existing users

---

#### B3. Extension Storage Layer Updates
**File**: `src/lib/storage.ts`

- [ ] Add `currentOrgId` to chrome.storage.local config
- [ ] Add `orgMemberships` map to config
- [ ] Update `loadProfiles()` to read from Firestore by orgId
- [ ] Update `saveProfile()` to write to Firestore aliases subcollection
- [ ] Add Firestore realtime listeners (sync across devices/team members)
- [ ] Add offline queue (write to local first, sync to Firestore when online)
- [ ] Update encryption to use org-scoped keys (or keep per-user, both work)

**Deliverable**: Storage layer supports orgs + layers, backwards compatible

---

#### B4. Extension UI Updates
**File**: `src/popup/popup-v2.ts` and components

- [ ] Add org switcher dropdown (if user in multiple orgs)
  - Hidden for individuals (they only have 1 org)
  - Shows for team members: "Personal Account | Acme Law Firm"
- [ ] Add layer tabs in Profiles section
  - Individuals see: "My Profiles" (single tab)
  - Team members see: "Personal | Team Shared" (two tabs)
- [ ] Update profile list to show layer affiliation
  - Personal profiles: normal display
  - Team profiles: show (Team) badge, read-only if member
- [ ] Add "Upgrade to Teams" button in Settings (for individual users)
  - Opens Stripe checkout with team pricing

**Deliverable**: UI adapts based on org type (individuals vs teams)

---

#### B5. Teams-Specific Features

##### Team Admin Features
- [ ] Create team admin panel (new tab or modal)
  - View team members list
  - Invite new members (email input → send invite link)
  - Remove members
  - View team usage stats (substitutions per member)
- [ ] Create team invite flow
  - Cloud Function: `inviteTeamMember(orgId, email, role)`
  - Send email with invite link
  - Invite link opens extension → auto-joins org
- [ ] Create shared alias layer management
  - Admin can create/edit/delete shared aliases
  - Members can view/use but not edit

##### Team Member Features
- [ ] Accept team invite (one-click join)
- [ ] Switch between personal and team profiles
- [ ] Use team aliases in substitution engine
- [ ] View team usage stats (own stats only)

**Deliverable**: Full team collaboration features

---

#### B6. Stripe Multi-Seat Billing
**Files**: `functions/src/createCheckoutSession.ts`, `functions/src/stripeWebhook.ts`

- [ ] Update `createCheckoutSession` to support team pricing
  - Individual: $4.99/month (1 seat)
  - Team: $8/seat/month (min 5 seats = $40/month)
  - Add `quantity` parameter to Stripe checkout
- [ ] Update `stripeWebhook` to handle team subscriptions
  - Write to `organizations/{orgId}.plan` instead of `users/{userId}.tier`
  - Handle seat count changes (upgrade from 5 → 10 seats)
- [ ] Create team customer portal link
  - Allow admin to add/remove seats
  - Show per-seat pricing breakdown

**Deliverable**: Teams can purchase multi-seat subscriptions

---

#### B7. Testing Updates
- [ ] Update unit tests for org-based storage
- [ ] Add integration tests for Firestore org schema
- [ ] Add tests for team invite flow
- [ ] Add tests for multi-org switching
- [ ] Add tests for layer-based access control
- [ ] Verify all 750 existing tests still pass

**Deliverable**: Test coverage for org/teams features

---

### Category C: Legal & Launch (Same as Before)

#### C1. Legal Documents
- [ ] Write Privacy Policy (add section on team data sharing)
- [ ] Write Terms of Service (add team subscription terms)
- [ ] Deploy to promptblocker.com/privacy and /terms
- [ ] Add Data Processing Agreement (DPA) for teams (GDPR requirement)

**Deliverable**: Legal compliance for B2C + Teams

---

#### C2. Landing Pages
- [ ] Create Stripe success page (promptblocker.com/checkout/success)
- [ ] Create Stripe cancel page (promptblocker.com/checkout/cancel)
- [ ] Create team pricing page (promptblocker.com/pricing/teams)
- [ ] Deploy to Firebase Hosting

**Deliverable**: Payment flow UX complete

---

#### C3. Firebase Analytics
- [ ] Configure individual user events (profile_created, substitution_performed, etc.)
- [ ] Add team-specific events (team_created, member_invited, shared_alias_used)
- [ ] Add opt-out toggle in settings
- [ ] Verify no PII logged

**Deliverable**: Privacy-preserving analytics

---

#### C4. Beta Testing (Parallel Audiences)
**Individual Users** (recruit 10-20):
- Post on Reddit (r/ChatGPT, r/privacy)
- Focus: Ease of use, onboarding, substitution accuracy
- Compensation: FREE PRO lifetime

**Small Teams** (recruit 3-5):
- Target: Small law firms (2-10 attorneys), chiropractors (3-8 staff), consultants
- Focus: Team invite flow, shared aliases, admin controls, billing
- Compensation: FREE Team tier for 6 months
- Approach: Direct outreach (LinkedIn, cold email, local networking)

**Deliverable**: Real feedback from both user types

---

#### C5. Chrome Web Store Submission
- [ ] Take 5 screenshots (show both individual AND team features)
- [ ] Create promotional images
- [ ] Write store listing (mention "Teams" as key feature)
- [ ] Submit for review

**Deliverable**: Extension live on Chrome Web Store

---

## Part 3: Implementation Phases (No Timelines, Just Order)

### Phase A: Documentation Cleanup (CURRENT)
**Goal**: Consolidate docs, create clear truth vs vision separation

- [ ] Create `/docs-b2c-v1/` structure
- [ ] Move validated docs (architecture, features, testing)
- [ ] Create `/docs-enterprise-future/` for Phase 2+ (API, SSO, etc.)
- [ ] Archive outdated docs to `/docs/archive/`
- [ ] Update root README.md

**Deliverable**: Clean documentation structure

**When Complete**: Move to Phase B

---

### Phase B: Org Architecture Implementation
**Goal**: Refactor from single-user to org-based architecture

**Sub-Phase B1: Backend (Firestore)**
- [ ] Update Firestore schema (collections + rules)
- [ ] Create migration Cloud Function
- [ ] Test migration with dummy data
- [ ] Deploy to production

**Sub-Phase B2: Extension Storage**
- [ ] Refactor `src/lib/storage.ts` for org support
- [ ] Add Firestore sync (realtime listeners)
- [ ] Add offline queue
- [ ] Test locally

**Sub-Phase B3: Extension UI**
- [ ] Add org switcher (hidden for individuals)
- [ ] Add layer tabs (personal vs team)
- [ ] Update profile renderer
- [ ] Test in dev mode

**Deliverable**: Org-based architecture working locally

**When Complete**: Move to Phase C (or run C in parallel)

---

### Phase C: Teams Features
**Goal**: Build team-specific functionality

- [ ] Team admin panel UI
- [ ] Team invite system (backend + frontend)
- [ ] Shared alias layer management
- [ ] Member list + usage stats
- [ ] Multi-seat Stripe checkout

**Deliverable**: Teams features working in dev mode

**When Complete**: Move to Phase D

---

### Phase D: Testing & Polish
**Goal**: Ensure quality before public launch

- [ ] Update all tests (750 → 800+ with org/teams tests)
- [ ] Manual testing on all 5 platforms
- [ ] Test team invite flow end-to-end
- [ ] Test multi-seat Stripe checkout
- [ ] Fix any bugs found

**Deliverable**: All tests passing, no critical bugs

**When Complete**: Move to Phase E

---

### Phase E: Legal & Launch Prep
**Goal**: Get ready for Chrome Web Store submission

- [ ] Write legal docs (Privacy Policy, Terms, DPA)
- [ ] Create landing pages (success, cancel, pricing)
- [ ] Enable Firebase Analytics
- [ ] Take screenshots (5 individual + 3 team features)
- [ ] Write store listing

**Deliverable**: All launch assets ready

**When Complete**: Move to Phase F

---

### Phase F: Beta Testing
**Goal**: Validate with real users before public launch

- [ ] Recruit 10-20 individual beta testers
- [ ] Recruit 3-5 small team beta testers
- [ ] Distribute extension (private Chrome Web Store link)
- [ ] Monitor Discord for bugs
- [ ] Fix critical issues (24h turnaround)
- [ ] Collect feedback (surveys, 1-on-1 calls)

**Deliverable**: <5 bugs, 0 critical, 80%+ positive feedback

**When Complete**: Move to Phase G

---

### Phase G: Chrome Web Store Submission
**Goal**: Get extension approved and live

- [ ] Create Chrome Web Store Developer Account ($5)
- [ ] Upload extension ZIP
- [ ] Fill out listing (copy from template)
- [ ] Add screenshots and images
- [ ] Submit for review
- [ ] Wait for approval (1-5 days)
- [ ] Fix any issues if rejected
- [ ] **GO LIVE** 🎉

**Deliverable**: Extension live on Chrome Web Store

**When Complete**: LAUNCHED! Move to post-launch growth

---

## Part 4: Success Criteria (Definition of "Done")

### Phase 0+1 Complete When:
1. ✅ Org-based architecture implemented and tested
2. ✅ Individuals can use extension (seamless, no "org" terminology visible)
3. ✅ Teams can invite members, share aliases, manage billing
4. ✅ All tests passing (800+ tests with org/teams coverage)
5. ✅ Legal docs published (Privacy Policy, Terms, DPA)
6. ✅ Stripe multi-seat billing working
7. ✅ Beta testing complete (individuals + teams, <5 bugs)
8. ✅ Chrome Web Store approved
9. ✅ **Extension live with B2C + Teams support**

### Ready for Phase 2 (API/MCP) When:
- 100+ active users (50+ individuals, 5+ teams)
- Teams asking for API access ("We want to integrate with our CRM")
- $2,000+ MRR (proves B2C + Teams model works)

**Don't build API until teams demand it.** Get real feedback on org/teams first.

---

## Part 5: Why This Approach Works

### Technical Benefits
✅ **Zero Migration Debt**: Org architecture from Day 1 = no painful refactors later
✅ **Permission Stability**: Request all permissions upfront, no scary update warnings
✅ **Scalability**: Architecture scales from 1 user → 10,000 users with zero changes

### Business Benefits
✅ **Dual Audience**: Can market to individuals AND small businesses simultaneously
✅ **Enterprise Credibility**: "Supports teams" = more professional, higher perceived value
✅ **Real Feedback**: Beta testing with actual teams = build the RIGHT features, not guessed features
✅ **Higher Revenue**: Team pricing ($40/month for 5 seats) > Individual pricing ($5/month)

### User Experience Benefits
✅ **Individuals Don't Notice**: They never see "org" terminology, works like single-user app
✅ **Teams Get Value Day 1**: Shared aliases, member management, usage tracking
✅ **Smooth Upgrades**: Individual → Team is just "invite members", no migration needed

---

## Part 6: Key Architectural Decisions

### Decision 1: Local-First + Firestore Sync (Hybrid Model)
**Why Not Cloud-Only?**
- Offline access (users can still use profiles without internet)
- Faster performance (read from local cache, not Firestore every time)
- Privacy (data encrypted locally, only synced if user wants)

**How It Works**:
```typescript
// On profile save
1. Write to chrome.storage.local (encrypted, immediate)
2. Queue Firestore write (async, retries if offline)
3. When online, sync to Firestore
4. Realtime listener updates other devices/team members
```

**Benefit**: Best of both worlds (offline + sync)

---

### Decision 2: Per-User Encryption (Not Org-Level)
**Why?**
- Individual users keep their own encryption keys (derived from Firebase UID)
- Team admins CANNOT decrypt personal profiles (privacy guarantee)
- Team shared aliases use org-level encryption (admin has access)

**How It Works**:
```typescript
// Personal profile
encrypt(profile, deriveKey(user.firebaseUID)) // Only that user can decrypt

// Team shared alias
encrypt(alias, deriveKey(org.orgId)) // All team members can decrypt
```

**Benefit**: Strong privacy boundaries (personal vs shared)

---

### Decision 3: Role-Based Access (Simple, Not Complex)
**Roles**:
- `owner` - Created the org, can delete org, manage billing, all permissions
- `admin` - Can invite/remove members, manage shared aliases (future: multiple admins)
- `member` - Can view/use shared aliases, cannot edit

**Why Simple?**
- Phase 1 doesn't need complex permissions (small teams trust each other)
- Can add granular permissions later if needed (Phase 2: department-specific layers)
- Easier to test and debug

---

## Part 7: What Gets Built Now vs Later

### Build Now (Phase 0+1)
✅ Org-based architecture
✅ Individual user flow (as "org with 1 member")
✅ Team creation + member invites
✅ Shared alias layers (one layer per team)
✅ Multi-seat Stripe billing
✅ Basic admin panel (members, usage stats)

### Build Later (Phase 2+)
⏳ **API Gateway** - Wait for teams to request it
⏳ **Multiple Layers Per Org** - Wait for larger teams (50+ members)
⏳ **SSO (SAML)** - Wait for enterprise customers ($10k+ contracts)
⏳ **Advanced Analytics** - Wait for compliance requirements
⏳ **CSV Import** - Wait for teams with large customer lists
⏳ **Self-Hosted Option** - Wait for banks/government to request it

**Key Principle**: Build only what's needed for launch. Add features based on demand, not speculation.

---

## Part 8: Migration Safety

### For Existing Users (If Any)
**Current**: Profiles in chrome.storage.local (encrypted)

**Migration Flow**:
1. User signs in after org update deployed
2. Extension checks: `config.primaryOrgId` exists?
3. If NO → call `migrateUserToOrgModel(userId)`
4. Migration creates personal org, converts profiles to aliases
5. Old profiles KEPT as backup (not deleted)
6. User sees no UI change (works exactly the same)

**Rollback Plan**:
- If migration fails, user still has local profiles (fallback mode)
- Extension shows "Sync failed, using local data" banner
- User can retry migration or continue offline

**Success Criteria**: 100% of existing users migrated with 0 data loss

---

## Part 9: Documentation Structure Post-Cleanup

```
docs-b2c-v1/ (CURRENT TRUTH - B2C + Teams)
  ├── PHASE_0_AND_1_COMBINED_LAUNCH.md (this file)
  ├── architecture/
  │   ├── ORG_BASED_MODEL.md (unified architecture)
  │   ├── DATA_FLOW.md (individual vs team flows)
  │   ├── ENCRYPTION_MODEL.md (per-user vs org-level)
  │   └── FIRESTORE_SCHEMA.md (collections + rules)
  ├── features/
  │   ├── individual/ (works for all users)
  │   └── teams/ (team-specific)
  ├── implementation/
  │   ├── ORG_MIGRATION_PLAN.md (step-by-step refactor)
  │   └── TESTING_STRATEGY.md (org/teams test coverage)
  └── launch/
      ├── LEGAL_DOCS.md (Privacy Policy, Terms, DPA)
      └── BETA_TESTING.md (individual + team recruitment)

docs-enterprise-future/ (PHASE 2+ VISION)
  ├── phase-2-api/
  ├── phase-3-verticals/
  └── phase-4-self-hosted/

docs/archive/ (OUTDATED)
  └── [historical docs]
```

---

## Next Steps

**Right Now**:
1. ✅ Read this doc
2. Decide: Start Phase B (org implementation) or finish Phase A (doc cleanup)?
3. If starting Phase B: Review `MIGRATION_ANALYSIS_B2C_TO_TEAMS.md` implementation plan

**After Documentation Cleanup (Phase A Complete)**:
1. Create `docs-b2c-v1/architecture/ORG_BASED_MODEL.md` (consolidate from MIGRATION_ANALYSIS)
2. Create `docs-b2c-v1/implementation/ORG_MIGRATION_PLAN.md` (step-by-step checklist)
3. Begin Phase B (Firestore schema updates)

**Question for You**:
- Do you want to finish doc cleanup first, THEN implement org architecture?
- Or implement org architecture now (using existing MIGRATION_ANALYSIS doc as guide)?

**My Recommendation**: Finish Phase A (doc cleanup) first. Having clean docs will make Phase B implementation smoother (clear reference, no confusion).

---

## Appendix: Quick Reference Checklists

### Phase A Checklist (Doc Cleanup)
- [ ] Create `/docs-b2c-v1/` structure
- [ ] Move architecture docs
- [ ] Move feature docs
- [ ] Move testing docs
- [ ] Create `/docs-enterprise-future/` structure
- [ ] Move Phase 2+ docs (API, SSO, etc.)
- [ ] Create `/docs/archive/` structure
- [ ] Move outdated docs
- [ ] Update root README.md
- [ ] Update ROADMAP.md

### Phase B Checklist (Org Architecture)
- [ ] Update Firestore schema
- [ ] Create migration Cloud Function
- [ ] Refactor storage layer
- [ ] Add Firestore sync
- [ ] Update extension UI
- [ ] Test locally

### Phase C Checklist (Teams Features)
- [ ] Team admin panel
- [ ] Invite system
- [ ] Shared alias management
- [ ] Multi-seat billing
- [ ] Test end-to-end

### Phase D-G Checklist (Testing & Launch)
- [ ] Update tests
- [ ] Write legal docs
- [ ] Create landing pages
- [ ] Enable analytics
- [ ] Recruit beta testers
- [ ] Fix bugs
- [ ] Submit to Chrome Web Store
- [ ] **LAUNCH** 🎉

---

**You're building the right thing. Org-based from Day 1 = future-proof architecture.** 🚀
