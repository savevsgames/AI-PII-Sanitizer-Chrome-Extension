# PromptBlocker: Product Roadmap v1.0 to Enterprise
**Unified Execution Plan - B2C Launch to Industry-Specific Buildouts**

---

## Executive Summary

This roadmap outlines the evolution of PromptBlocker from B2C Chrome extension to enterprise-grade API platform. The key architectural insight: **design the organization structure from Day 1**, treating individuals as "orgs with 1 member" to avoid painful data migrations later.

**Timeline**: 18-24 months from v1.0 launch to first enterprise contracts

**Revenue Trajectory**:
- Month 1-3: $5k MRR (B2C + early Teams)
- Month 4-12: $50k MRR (API + integrations)
- Month 13-24: $150k+ MRR (Enterprise contracts)

---

## Phase 0: B2C Launch Readiness (Weeks 1-4)

### Goal
Get 10 beta users successfully running v0.1.0 with zero errors, then launch v1.0 on Chrome Web Store.

### Technical Deliverables

**1. Extension Stability**
- [ ] E2E test suite passing (auth, profiles, substitution)
- [ ] Error logging to Firebase (catch all unhandled exceptions)
- [ ] Health check system monitoring extension state
- [ ] Graceful fallback if Firebase unreachable

**2. Marketing Assets**
- [ ] Landing page at `promptblocker.com`
- [ ] Product Hunt launch page
- [ ] Discord server setup
- [ ] Twitter/LinkedIn presence
- [ ] Chrome Web Store listing (screenshots, video demo)

**3. User Onboarding Flow**
- [ ] Welcome screen after install
- [ ] Quick start guide (3 steps: Sign in → Create profile → Test on ChatGPT)
- [ ] In-app tooltips for first-time users
- [ ] Video walkthrough (2 min)

### Tracking & Analytics - Phase 0

**Events to Track** (Firebase Analytics):
```javascript
// Installation & Setup
analytics.logEvent('extension_installed', { version: '1.0.0' });
analytics.logEvent('auth_started', { method: 'google' });
analytics.logEvent('auth_completed', { timeToComplete: 12 });
analytics.logEvent('first_profile_created', { fieldCount: 5 });

// Usage Patterns
analytics.logEvent('popup_opened', { frequency: 'daily' });
analytics.logEvent('profile_activated', { profileId: 'hash' });
analytics.logEvent('substitution_performed', { platform: 'chatgpt', fieldType: 'name' });

// Errors & Issues
analytics.logEvent('error_occurred', {
  errorType: 'firebase_connection_failed',
  userImpact: 'high',
  recovered: false
});
```

**Privacy Compliance - Phase 0**:
- [ ] Privacy Policy posted at `promptblocker.com/privacy`
- [ ] Terms of Service at `promptblocker.com/terms`
- [ ] Cookie consent banner (GDPR requirement)
- [ ] Analytics opt-out mechanism in extension settings
- [ ] Data retention policy (30 days for analytics events)

**Legal Notices Required**:
- [ ] Extension manifest.json includes privacy policy link
- [ ] Chrome Web Store listing links to privacy policy
- [ ] First-run consent: "We use Firebase Analytics to improve the product. [Learn more] [Opt out]"

**Firebase Analytics Setup**:
```typescript
// src/services/analytics.ts
import { getAnalytics, logEvent, setAnalyticsCollectionEnabled } from 'firebase/analytics';

class AnalyticsService {
  private analytics;
  private enabled: boolean = true;

  async init() {
    // Check user consent
    const consent = await chrome.storage.local.get('analytics_consent');
    this.enabled = consent.analytics_consent !== false; // Default opt-in

    this.analytics = getAnalytics();
    setAnalyticsCollectionEnabled(this.analytics, this.enabled);
  }

  logEvent(eventName: string, params?: Record<string, any>) {
    if (!this.enabled) return;

    // Never log PII - hash identifiers
    const sanitized = this.sanitizeParams(params);
    logEvent(this.analytics, eventName, sanitized);
  }

  private sanitizeParams(params: Record<string, any>): Record<string, any> {
    // Remove any potential PII before logging
    const safe = { ...params };
    delete safe.email;
    delete safe.realName;
    delete safe.aliasName;
    // ... etc
    return safe;
  }
}
```

**Key Metrics - Phase 0**:
- Install-to-signup conversion rate
- Signup-to-first-profile conversion rate
- Daily active users (DAU)
- Substitutions per user per day
- Error rate (% of users hitting errors)
- Time to first successful substitution
- Did user click any link(s) built into extension to share extension?

### Success Criteria
- 10 beta users with 0 critical errors over 7 days
- Average 4.5+ star rating from beta testers
- < 2% error rate in production logs
- All legal/privacy docs published

**Timeline**: 4 weeks (marketing prep overlaps with bug fixes)

---

## Phase 1: Teams + Unified Org Architecture (Months 2-3)

### Goal
Add group aliases and Teams tier while building the org structure that will scale to Enterprise. Design it so individuals are just "orgs with 1 member and 1 privilege layer."

### Data Architecture - Unified Model

**Firestore Schema**:
```typescript
// organizations/{orgId}
{
  orgId: string;
  name: string; // For individuals: "Personal Account" 
  type: 'individual' | 'team' | 'enterprise' | 'power'; // Power Users are individuals who want MCP/API access without FULL team/org management features
  createdAt: Timestamp;

  // Billing
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise' | 'power';
  seats: number; // 1 for individuals, 5+ for teams
  usedSeats: number;

  // Settings
  settings: {
    defaultPrivacyLevel: 'standard' | 'zero_knowledge';
    requireMFA: boolean;
    allowedDomains?: string[]; // For enterprise SSO
  };
}

// organizations/{orgId}/members/{userId}
{
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Timestamp;

  // For enterprise: role-based access
  accessLayers: string[]; // ['layer_all', 'layer_sales', 'layer_legal']
}

// organizations/{orgId}/alias_layers/{layerId}
{
  layerId: string;
  name: string; // 'Personal', 'Sales Team', 'Legal Department'
  description: string;
  createdBy: string; // userId

  // Access control
  visibleToRoles: string[]; // ['admin', 'member'] or specific memberIds
  editableByRoles: string[]; // ['admin'] only

  // Individual: 1 layer ('personal')
  // Team: 1 layer ('team_shared')
  // Enterprise: Multiple layers ('sales', 'legal', 'hr', etc.)
}

// organizations/{orgId}/alias_layers/{layerId}/aliases/{aliasId}
{
  aliasId: string;
  realValueHash: string; // sha256 hash for matching
  aliasValue: string;
  category: 'name' | 'email' | 'phone' | 'address' | 'company' | 'custom';

  // Encryption
  realValueEncrypted: string; // Only for cloud storage mode
  encryptionKeyId: string;

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  lastUsed?: Timestamp;
  usageCount: number;
}

// users/{userId} (legacy - still needed for Firebase Auth)
{
  uid: string;
  email: string;

  // Link to their primary org
  primaryOrgId: string;

  // For users in multiple orgs (enterprise employees using personal account too)
  orgMemberships: {
    [orgId: string]: {
      role: string;
      joinedAt: Timestamp;
    }
  };
}
```

**Migration Strategy for Existing Users**:
```typescript
// Cloud Function: migrateUserToOrgModel
async function migrateUserToOrgModel(userId: string) {
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  // Create personal org
  const orgId = `org_${userId}`;
  await db.collection('organizations').doc(orgId).set({
    orgId,
    name: 'Personal Account',
    type: 'individual',
    plan: userData.subscriptionTier || 'free',
    seats: 1,
    usedSeats: 1,
    settings: {
      defaultPrivacyLevel: 'standard',
      requireMFA: false,
    },
    createdAt: Timestamp.now(),
  });

  // Add user as owner
  await db.collection('organizations').doc(orgId).collection('members').doc(userId).set({
    userId,
    email: userData.email,
    role: 'owner',
    accessLayers: ['layer_personal'],
    joinedAt: Timestamp.now(),
  });

  // Create personal layer
  const layerId = 'layer_personal';
  await db.collection('organizations').doc(orgId).collection('alias_layers').doc(layerId).set({
    layerId,
    name: 'Personal',
    description: 'Your private aliases',
    createdBy: userId,
    visibleToRoles: ['owner'],
    editableByRoles: ['owner'],
  });

  // Migrate existing profiles to aliases
  const profiles = await db.collection('users').doc(userId).collection('profiles').get();
  for (const profile of profiles.docs) {
    const data = profile.data();

    // Each profile field becomes an alias
    if (data.realName && data.aliasName) {
      await createAlias(orgId, layerId, {
        realValue: data.realName,
        aliasValue: data.aliasName,
        category: 'name',
        createdBy: userId,
      });
    }
    // ... repeat for email, phone, etc.
  }

  // Update user doc with orgId
  await db.collection('users').doc(userId).update({
    primaryOrgId: orgId,
    orgMemberships: {
      [orgId]: { role: 'owner', joinedAt: Timestamp.now() }
    },
  });
}
```

### Teams Feature - Phase 1

**User Flow**:
1. User clicks "Upgrade to Teams" in extension
2. Redirected to `promptblocker.com/teams/checkout`
3. Stripe checkout: Enter team name, select seats (5-50)
4. After payment, user becomes org admin
5. Can invite team members via email
6. Team members get email: "Join [Company] on PromptBlocker"
7. They sign in, accept invite, get access to shared aliases

**Team Admin Capabilities**:
- Create/edit/delete aliases in the shared layer
- Invite/remove team members
- View team usage analytics
- Set team-wide policies (e.g., "always block SSN patterns")

**Team Member Experience**:
- Extension shows 2 tabs: "Personal Aliases" | "Team Aliases"
- Can create personal aliases (private to them)
- Can use team aliases (read-only, managed by admin)
- Profile switcher shows: "[Personal] Greg" vs "[Acme Inc] Sales Template"

**Pricing - Phase 1**:
- Individual: $5/month (unlimited personal aliases)
- Team: $8/seat/month (min 5 seats = $40/month)
  - Shared alias library
  - Team admin dashboard
  - Usage analytics

### Tracking & Analytics - Phase 1

**New Events**:
```javascript
// Team Creation & Management
analytics.logEvent('team_created', { seats: 10, plan: 'team' });
analytics.logEvent('team_member_invited', { role: 'member' });
analytics.logEvent('team_member_joined', { inviteAccepted: true });

// Shared Alias Usage
analytics.logEvent('shared_alias_used', {
  layerId: 'hash',
  category: 'company',
  userRole: 'member'
});

analytics.logEvent('personal_vs_shared_ratio', {
  personalAliasCount: 5,
  sharedAliasCount: 20
});

// Team Admin Actions
analytics.logEvent('team_alias_created', { category: 'email', createdBy: 'admin' });
analytics.logEvent('team_policy_updated', { policyType: 'auto_block_ssn' });
```

**Privacy Compliance - Phase 1**:
- [ ] Update Privacy Policy: Add section on team data sharing
- [ ] Team member consent: "Your admin can see team aliases but NOT your personal aliases"
- [ ] Data Processing Agreement (DPA) for team admins (GDPR requirement)
- [ ] Team-level analytics opt-out (admin can disable analytics for entire team)

**Legal Notices - Phase 1**:
- [ ] Terms of Service updated: Add "Team Subscription Terms"
- [ ] DPA template at `promptblocker.com/dpa` (required for EU teams)
- [ ] Team invite email includes privacy notice
- [ ] Team dashboard shows data retention policy

**Stripe Integration - Tracking**:
```typescript
// Track subscription lifecycle
stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: TEAM_PRICE_ID, quantity: 10 }],
  metadata: {
    orgId: orgId,
    orgType: 'team',
    createdVia: 'extension_upgrade'
  }
});

// Webhook events to log
await analytics.logEvent('subscription_created', {
  plan: 'team',
  seats: 10,
  mrr: 80, // $8 * 10 seats
});

await analytics.logEvent('subscription_cancelled', {
  plan: 'team',
  cancelReason: metadata.cancelReason,
  lifetimeValue: 240, // 3 months * $80
});
```

**Key Metrics - Phase 1**:
- Individual → Team upgrade conversion rate
- Average team size (seats purchased)
- Team member activation rate (% who accept invite)
- Shared alias usage vs personal alias usage
- Team churn rate
- MRR from teams vs individuals

**Compliance Requirements - Phase 1**:
- [ ] GDPR: Right to data portability (export team aliases as CSV)
- [ ] GDPR: Right to deletion (delete user from team, cascade to aliases they created)
- [ ] CCPA: "Do Not Sell My Personal Information" link in footer
- [ ] CAN-SPAM: Team invite emails must have unsubscribe link

### Success Criteria
- 50 teams signed up ($2k+ MRR from teams alone)
- < 5% team churn rate
- 80%+ team member activation rate
- Unified org architecture deployed (zero downtime migration)

**Timeline**: 8 weeks

---

## Phase 2: MCP/API + Admin Dashboards (Months 4-7)

### Goal
Launch API Gateway for AI personalization at scale. Build admin portal at `promptblocker.com` for managing API keys, MCP servers, and data mappings. Treat "power users" as orgs with 1 member.

### Architecture Overview

**Two Access Methods**:

1. **MCP (Model Context Protocol)** - For AI assistants to read data
   - Open source MCP server users self-host
   - Reads data from CRM/EHR/database
   - Sends sanitized prompts to AI
   - Managed at `promptblocker.com/mcp_dashboard`

2. **REST API** - For automation platforms (n8n, Zapier, custom apps)
   - POST `/api/v1/sanitize` - Replace PII with aliases
   - POST `/api/v1/de-sanitize` - Re-inject real data after AI response
   - Managed at `promptblocker.com/api_dashboard`

**Data Flow Example**:
```
CRM Database (Salesforce)
  ↓ (MCP reads: "John Doe, knee surgery, 555-1234")
PromptBlocker MCP Server
  ↓ (sanitize: "Patient-2847, Procedure-A, Phone-1029")
AI Model (Claude via API)
  ↓ (generate: "Dear Patient-2847, your Procedure-A recovery...")
PromptBlocker API (/de-sanitize)
  ↓ (re-inject: "Dear John Doe, your knee surgery recovery...")
Email Platform (Mailchimp)
```

### Admin Portal - Unified Dashboard

**URL Structure**:
- `promptblocker.com/dashboard` - Main hub (org switcher if user in multiple orgs)
- `promptblocker.com/dashboard/aliases` - Manage alias layers (replaces extension popup for power users)
- `promptblocker.com/dashboard/api` - API keys, usage stats, billing
- `promptblocker.com/dashboard/mcp` - MCP server config, connection status
- `promptblocker.com/dashboard/team` - Team member management (if team/enterprise)
- `promptblocker.com/dashboard/data-mapping` - CSV import wizard for bulk aliases

**Who Can Access What**:

| User Type | Aliases Tab | API Tab | MCP Tab | Team Tab | Data Mapping |
|-----------|-------------|---------|---------|----------|--------------|
| Individual Free | Personal only | ❌ | ❌ | ❌ | ❌ |
| Individual Pro | Personal only | ✅ (1 key) | ✅ (1 server) | ❌ | ✅ (100 rows) |
| Team Admin | Personal + Shared | ✅ (3 keys) | ✅ (3 servers) | ✅ | ✅ (1,000 rows) |
| Team Member | Personal + Shared (read-only) | ❌ | ❌ | View only | ❌ |
| Enterprise Admin | All layers | ✅ (Unlimited) | ✅ (Unlimited) | ✅ | ✅ (Unlimited) |
| Enterprise Member | Assigned layers | ❌ | ❌ | View only | ❌ |

### API Implementation

**Endpoints**:
```typescript
// POST /api/v1/sanitize
{
  "orgId": "org_acme_medical",
  "layerId": "layer_patients", // Which alias set to use
  "text": "Schedule appointment for John Doe regarding knee replacement",
  "options": {
    "preserveCase": true,
    "returnMatches": true // Return what was replaced (for logging)
  }
}

Response:
{
  "sanitized": "Schedule appointment for Patient-2847 regarding Procedure-A",
  "sessionId": "sess_abc123", // For de-sanitization later
  "matches": [
    { "original": "hash_only", "alias": "Patient-2847", "category": "name" },
    { "original": "hash_only", "alias": "Procedure-A", "category": "procedure" }
  ],
  "expiresAt": "2024-01-15T10:30:00Z" // Session expires after 1 hour
}

// POST /api/v1/de-sanitize
{
  "sessionId": "sess_abc123",
  "text": "Dear Patient-2847, your Procedure-A recovery is progressing well."
}

Response:
{
  "personalized": "Dear John Doe, your knee replacement recovery is progressing well."
}

// GET /api/v1/usage
{
  "orgId": "org_acme_medical",
  "period": "2024-01" // Monthly usage
}

Response:
{
  "sanitizeCalls": 1250,
  "deSanitizeCalls": 1180, // Some sessions expired unused
  "totalCharactersProcessed": 450000,
  "uniqueSessionsCreated": 1250,
  "averageSubstitutionsPerCall": 3.2,
  "billing": {
    "plan": "api_pro",
    "includedCalls": 1000,
    "overageCalls": 250,
    "overageCharge": 12.50, // $0.05 per call over limit
    "totalDue": 112.50 // $100 base + $12.50 overage
  }
}

// POST /api/v1/layers/{layerId}/aliases/bulk
// Upload CSV of aliases
{
  "orgId": "org_acme_medical",
  "layerId": "layer_patients",
  "file": "base64_encoded_csv",
  "mapping": {
    "realName": "column_A",
    "aliasName": "column_B",
    "realEmail": "column_C",
    "aliasEmail": "column_D"
  },
  "options": {
    "hashRealValues": true, // Don't store plaintext, only hashes
    "encryptAliases": false // Aliases are safe to store unencrypted
  }
}

Response:
{
  "imported": 450,
  "skipped": 12, // Duplicates
  "errors": 3, // Invalid format
  "layerId": "layer_patients"
}
```

**Authentication**:
```typescript
// API keys are scoped to org + layer
const apiKey = await generateApiKey({
  orgId: 'org_acme_medical',
  name: 'Mailchimp Integration',
  scopes: ['read:aliases', 'create:sessions'], // NOT 'write:aliases' for security
  layers: ['layer_patients'], // Can only access patient aliases
  rateLimit: 1000, // Calls per day
  expiresAt: '2025-01-01',
});

// Result: pk_live_acme_medical_a8f2k3j9d...
// Format: pk_{env}_{orgId}_{random}

// Validate on each request
const decoded = await validateApiKey(request.headers['Authorization']);
if (!decoded.scopes.includes('create:sessions')) {
  return res.status(403).json({ error: 'Insufficient permissions' });
}
```

### MCP Server Implementation

**Open Source Repository**: `github.com/promptblocker/mcp-server`

```typescript
// server.ts - PromptBlocker MCP Server
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'promptblocker-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {}, // Can read data sources
      tools: {}, // Provides sanitization tools
    },
  }
);

// Tool: Sanitize text before sending to AI
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'sanitize_text') {
    const { text, layerId } = request.params.arguments;

    // Call PromptBlocker API
    const response = await fetch('https://api.promptblocker.com/v1/sanitize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PROMPTBLOCKER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orgId: process.env.PROMPTBLOCKER_ORG_ID,
        layerId,
        text,
      }),
    });

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: data.sanitized,
        },
      ],
      // Store sessionId for later de-sanitization
      metadata: {
        sessionId: data.sessionId,
        expiresAt: data.expiresAt,
      },
    };
  }

  if (request.params.name === 'de_sanitize_text') {
    const { text, sessionId } = request.params.arguments;

    const response = await fetch('https://api.promptblocker.com/v1/de-sanitize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PROMPTBLOCKER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, text }),
    });

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: data.personalized,
        },
      ],
    };
  }
});

// Resource: Read customer data from CRM (example)
server.setRequestHandler('resources/read', async (request) => {
  if (request.params.uri.startsWith('crm://customers/')) {
    const customerId = request.params.uri.split('/').pop();

    // This would integrate with Salesforce, HubSpot, etc.
    const customer = await fetchFromCRM(customerId);

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'application/json',
          text: JSON.stringify(customer),
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

**MCP Dashboard** (`promptblocker.com/dashboard/mcp`):
- List of configured MCP servers
- Connection status (green = healthy, red = connection failed)
- Logs of recent sanitization requests
- Data source integrations (Salesforce, HubSpot, PostgreSQL, etc.)
- API key rotation

### Data Mapping Wizard

**Use Case**: Customer has CSV with 5,000 patient names and wants to import as aliases.

**Wizard Flow** (`promptblocker.com/dashboard/data-mapping`):

**Step 1: Upload CSV**
```
Drag and drop your CSV file here
or click to browse

Supported formats: CSV, XLSX, TSV
Max file size: 10 MB (Enterprise: 100 MB)
```

**Step 2: Preview Data**
```
We found 4 columns and 5,234 rows. Here's a preview:

| Column A       | Column B        | Column C              | Column D              |
|----------------|-----------------|-----------------------|-----------------------|
| John Doe       | Patient-2847    | john.doe@email.com    | patient2847@anon.com  |
| Jane Smith     | Patient-2848    | jane.smith@email.com  | patient2848@anon.com  |
| ...            | ...             | ...                   | ...                   |

[Next: Map Columns]
```

**Step 3: Map Columns to Fields**
```
Tell us which columns contain real data vs aliases:

Column A: [Dropdown: Real Name ▼]
Column B: [Dropdown: Alias Name ▼]
Column C: [Dropdown: Real Email ▼]
Column D: [Dropdown: Alias Email ▼]

Add more field mappings: [+ Custom Field]

[Next: Privacy Settings]
```

**Step 4: Privacy Settings**
```
How should we store this data?

○ Standard (Recommended)
  - Real values encrypted with your Firebase key
  - Aliases stored in plaintext for fast matching
  - Searchable in dashboard

○ Zero-Knowledge (Maximum Privacy)
  - Real values hashed (irreversible)
  - Aliases stored encrypted
  - Matching happens via hash comparison
  - You cannot view real values in dashboard

☑ Delete uploaded CSV after import (GDPR best practice)

[Next: Review & Import]
```

**Step 5: Review**
```
Import Summary:

- File: patients_q1_2024.csv
- Rows: 5,234
- Unique real names: 5,234
- Unique alias names: 5,234
- Target layer: layer_patients (Acme Medical)
- Privacy mode: Standard
- Estimated time: 2-3 minutes

[Cancel] [Start Import]
```

**Step 6: Processing**
```
Importing aliases...

Progress: [=========>        ] 3,200 / 5,234 (61%)

Imported: 3,200
Skipped (duplicates): 14
Errors: 2

[View Errors] [Cancel Import]
```

**Step 7: Complete**
```
Import complete!

✓ 5,218 aliases imported to layer_patients
⚠ 14 skipped (duplicates)
✗ 2 errors (invalid email format)

[Download Error Report] [View Aliases] [Import Another File]
```

### Storage Modes - Implementation

**1. Standard Mode** (Default):
```typescript
// Store encrypted real value + plaintext alias
async function createAlias(orgId: string, layerId: string, data: AliasData) {
  const encryptionKey = await getOrgEncryptionKey(orgId);

  const alias = {
    aliasId: generateId(),
    realValueHash: await sha256(data.realValue), // For matching
    realValueEncrypted: await encrypt(data.realValue, encryptionKey), // For display in dashboard
    aliasValue: data.aliasValue, // Plaintext (safe to expose)
    category: data.category,
  };

  await db.collection('organizations').doc(orgId)
    .collection('alias_layers').doc(layerId)
    .collection('aliases').doc(alias.aliasId).set(alias);
}

// Matching is fast (hash comparison)
async function findMatch(text: string, layerId: string): Promise<string | null> {
  const hash = await sha256(text.toLowerCase());
  const snapshot = await db.collection('...').where('realValueHash', '==', hash).get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data().aliasValue;
}
```

**2. Zero-Knowledge Mode** (Enterprise option):
```typescript
// Store ONLY hashes, no reversible encryption
async function createAliasZeroKnowledge(orgId: string, layerId: string, data: AliasData) {
  const alias = {
    aliasId: generateId(),
    realValueHash: await sha256(data.realValue), // For matching
    // NO realValueEncrypted field! Irreversible.
    aliasValue: await encrypt(data.aliasValue, getOrgKey(orgId)), // Even alias is encrypted
    category: data.category,
  };

  await db.collection('...').set(alias);
}

// Admin cannot see real values in dashboard
// They only see: "Hash: a3f8d2c1... → Alias: [Encrypted]"
// To view aliases, they must enter their encryption passphrase
```

**Email-Based Key Unlock** (Future feature):
```typescript
// Instead of storing encryption key in Firebase
// Send it to user's email on first login
async function setupEmailKeyUnlock(userId: string, orgId: string) {
  const encryptionKey = generateKey();

  // Send email with key
  await sendEmail({
    to: user.email,
    subject: 'Your PromptBlocker Encryption Key',
    body: `
      Your encryption key for ${orgName}:

      ${encryptionKey}

      Store this securely. You'll need it to unlock your aliases.
      We do NOT store this key on our servers.
    `,
  });

  // Store only a hash in Firestore (to verify user's input)
  await db.collection('organizations').doc(orgId).update({
    encryptionKeyHash: await sha256(encryptionKey),
  });
}

// User must paste key to unlock aliases
async function unlockAliases(orgId: string, userProvidedKey: string) {
  const org = await db.collection('organizations').doc(orgId).get();
  const storedHash = org.data().encryptionKeyHash;

  if (await sha256(userProvidedKey) !== storedHash) {
    throw new Error('Invalid encryption key');
  }

  // Decrypt aliases in memory (never stored decrypted)
  const aliases = await loadEncryptedAliases(orgId);
  return aliases.map(a => decrypt(a.aliasValue, userProvidedKey));
}
```

### Pricing - Phase 2

**API Tiers**:
- **Starter**: $99/month
  - 1,000 API calls/month
  - 1 API key
  - Standard storage
  - 1 MCP server

- **Pro**: $299/month
  - 10,000 API calls/month
  - 5 API keys
  - Standard or Zero-Knowledge storage
  - 5 MCP servers
  - CSV import (10,000 rows)

- **Business**: $999/month
  - 100,000 API calls/month
  - Unlimited API keys
  - Both storage modes
  - Unlimited MCP servers
  - CSV import (1M rows)
  - Priority support

- **Enterprise**: Custom pricing
  - Unlimited API calls
  - Custom rate limits
  - Self-hosted option
  - SLA guarantees
  - Dedicated support engineer

### Tracking & Analytics - Phase 2

**New Events**:
```javascript
// API Usage
analytics.logEvent('api_call', {
  endpoint: '/sanitize',
  orgId: 'hash',
  layerId: 'hash',
  characterCount: 450,
  substitutionCount: 3,
  responseTime: 120, // ms
  plan: 'api_pro'
});

analytics.logEvent('api_session_created', {
  sessionId: 'hash',
  ttl: 3600, // 1 hour
});

analytics.logEvent('api_session_expired', {
  sessionId: 'hash',
  deSanitizeCalled: false // Session expired without being used
});

// MCP Usage
analytics.logEvent('mcp_server_connected', {
  serverId: 'hash',
  dataSource: 'salesforce',
  orgId: 'hash'
});

analytics.logEvent('mcp_sanitization', {
  serverId: 'hash',
  toolName: 'sanitize_text',
  characterCount: 200,
  substitutionCount: 2
});

// Data Mapping Wizard
analytics.logEvent('csv_import_started', {
  rowCount: 5234,
  columnCount: 4,
  fileSize: 450, // KB
  storageMode: 'standard'
});

analytics.logEvent('csv_import_completed', {
  imported: 5218,
  skipped: 14,
  errors: 2,
  durationSeconds: 145
});

// Dashboard Usage
analytics.logEvent('dashboard_page_view', {
  page: 'api_keys',
  orgType: 'team',
  userRole: 'admin'
});

analytics.logEvent('api_key_created', {
  scopes: ['read:aliases', 'create:sessions'],
  layers: 1,
  rateLimit: 1000
});
```

**Privacy Compliance - Phase 2**:
- [ ] Update Privacy Policy: Add "API Data Processing" section
- [ ] DPA updated for API customers (GDPR requirement)
- [ ] SOC 2 Type II audit (required for enterprise sales)
- [ ] HIPAA BAA template available (for healthcare customers)
- [ ] Data retention policy for API sessions (delete after 1 hour)
- [ ] Right to deletion: API for customers to delete all aliases via API
- [ ] Subprocessor list: Disclose Firebase, Stripe, SendGrid

**Legal Notices - Phase 2**:
- [ ] API Terms of Service at `promptblocker.com/api/terms`
- [ ] Acceptable Use Policy (no bulk scraping, no PII storage by API consumers)
- [ ] SLA document for Business/Enterprise tiers
- [ ] Security whitepaper published (architecture, encryption, compliance)

**SOC 2 Requirements** (For Enterprise Sales):
```
SOC 2 Type II covers 5 Trust Service Criteria:

1. Security: Encryption at rest/transit, key rotation, access controls
2. Availability: 99.9% uptime SLA, redundancy, monitoring
3. Processing Integrity: API rate limits, input validation, error handling
4. Confidentiality: Zero-knowledge mode, no logging of PII
5. Privacy: GDPR/CCPA compliance, data retention policies

Timeline: 6 months (3 months prep + 3 months audit)
Cost: $15k-$30k for auditor
```

**HIPAA Compliance** (For Healthcare):
- [ ] HIPAA BAA (Business Associate Agreement) template
- [ ] PHI encryption in transit (TLS 1.3) and at rest (AES-256)
- [ ] Access logs for all PHI (audit trail)
- [ ] Breach notification process
- [ ] Employee HIPAA training

**API Rate Limiting & Abuse Prevention**:
```typescript
// Track API usage per key
const usage = await redis.get(`api_usage:${apiKeyId}:${today}`);
if (usage >= key.rateLimit) {
  return res.status(429).json({
    error: 'Rate limit exceeded',
    limit: key.rateLimit,
    resetAt: endOfDay(today)
  });
}

await redis.incr(`api_usage:${apiKeyId}:${today}`);

// Log excessive usage (potential abuse)
if (usage > key.rateLimit * 1.5) {
  await analytics.logEvent('api_abuse_suspected', {
    apiKeyId: 'hash',
    usage: usage,
    limit: key.rateLimit,
    overage: usage - key.rateLimit
  });

  // Auto-revoke if 3x over limit
  if (usage > key.rateLimit * 3) {
    await revokeApiKey(apiKeyId);
    await sendEmail({
      to: orgAdmin.email,
      subject: 'API Key Revoked - Rate Limit Violation',
      body: '...'
    });
  }
}
```

**Key Metrics - Phase 2**:
- API Monthly Recurring Revenue (MRR)
- Average API calls per customer
- API call success rate (% non-error responses)
- Average substitutions per API call
- MCP server adoption rate (% of API customers using MCP)
- CSV import usage (% of customers importing data)
- Dashboard DAU (daily active users)
- API key creation rate
- Storage mode adoption (Standard vs Zero-Knowledge %)
- Session expiration rate (% of sessions never de-sanitized)

**Billing Integration**:
```typescript
// Track overage usage for Stripe metered billing
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId,
  {
    quantity: apiCallCount, // Number of calls this month
    timestamp: Math.floor(Date.now() / 1000),
    action: 'increment',
  }
);

// Send usage warning emails
if (usage >= plan.includedCalls * 0.8) {
  await sendEmail({
    to: orgAdmin.email,
    subject: 'API Usage Warning: 80% of Monthly Limit',
    body: `
      You've used ${usage} of ${plan.includedCalls} included API calls.
      Overage charges: $0.05 per call.
      Upgrade to Pro for 10x more calls: promptblocker.com/pricing
    `
  });
}
```

### Success Criteria
- 100 API customers ($30k+ MRR from API alone)
- 50 MCP server deployments
- < 2% API error rate
- Average 4.5+ NPS from API customers
- SOC 2 Type II certification complete

**Timeline**: 16 weeks (4 months)

---

## Phase 3: Industry-Specific Buildouts (Months 8-24)

### Goal
Target high-value verticals with custom features, compliance certifications, and pre-built integrations. Land first 5 enterprise contracts.

### Industry #1: Healthcare (HIPAA)

**Target Customer**:
- Medical practices (5-50 doctors)
- Hospital systems (100-5,000 employees)
- Telehealth platforms
- Medical billing companies

**Custom Features**:

**1. Pre-Built Medical Alias Templates**
```typescript
// templates/healthcare/patient_demographics.json
{
  "layerName": "Patient Demographics",
  "categories": [
    {
      "name": "Patient Names",
      "aliasFormat": "Patient-{sequential}",
      "startNumber": 1000
    },
    {
      "name": "Medical Record Numbers",
      "aliasFormat": "MRN-{sequential}",
      "startNumber": 100000
    },
    {
      "name": "Diagnosis Codes",
      "mappingType": "icd10", // Pre-built ICD-10 code mappings
      "example": "M25.561 (knee pain) → Condition-A"
    },
    {
      "name": "Procedure Codes",
      "mappingType": "cpt",
      "example": "27447 (knee arthroplasty) → Procedure-B"
    },
    {
      "name": "Medication Names",
      "mappingType": "rxnorm",
      "example": "Lisinopril → Medication-C"
    }
  ]
}

// Auto-import on setup
async function setupHealthcareOrg(orgId: string) {
  const template = await loadTemplate('healthcare/patient_demographics');

  for (const category of template.categories) {
    const layerId = `layer_${category.name.toLowerCase().replace(/ /g, '_')}`;
    await createAliasLayer(orgId, layerId, {
      name: category.name,
      template: category,
    });

    // For standard code sets (ICD-10, CPT), pre-populate
    if (category.mappingType === 'icd10') {
      await importICD10Aliases(orgId, layerId);
    }
  }
}
```

**2. EHR Integrations** (Epic, Cerner, Athenahealth)
```typescript
// MCP server for Epic FHIR API
server.setRequestHandler('resources/read', async (request) => {
  if (request.params.uri.startsWith('epic://patients/')) {
    const patientId = request.params.uri.split('/').pop();

    // Fetch from Epic FHIR API
    const patient = await fetch(`${EPIC_FHIR_BASE}/Patient/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${EPIC_ACCESS_TOKEN}`,
      },
    }).then(r => r.json());

    // Sanitize before returning to AI
    const sanitized = await sanitizePatient(patient);

    return {
      contents: [{
        uri: request.params.uri,
        mimeType: 'application/json',
        text: JSON.stringify(sanitized),
      }],
    };
  }
});

async function sanitizePatient(patient: FHIRPatient) {
  // Replace name
  patient.name[0].text = await getAlias(patient.name[0].text, 'layer_patients');

  // Replace MRN
  patient.identifier = patient.identifier.map(id => ({
    ...id,
    value: getAlias(id.value, 'layer_mrns'),
  }));

  // Replace address
  if (patient.address) {
    patient.address[0].line = ['Address Redacted'];
    patient.address[0].city = 'City-' + await hash(patient.address[0].city);
  }

  return patient;
}
```

**3. HIPAA Compliance Features**
- Audit logs: Log every API call with timestamp, user, data accessed
- Automatic PHI detection: Flag fields containing SSN, DOB, phone
- Breach notification workflow: If API key compromised, auto-notify affected patients
- Minimum necessary access: Restrict layers per user role (doctors see all, nurses see assigned patients)
- Data retention: Auto-delete API sessions after 1 hour (HIPAA requires minimum retention)

**4. Pre-Built Use Cases**

**Use Case: AI-Powered Patient Follow-Up Emails**
```
1. Medical assistant uploads patient list CSV (500 patients)
2. PromptBlocker imports: "John Doe" → "Patient-2847"
3. n8n workflow triggers daily:
   - Fetch patients with appointments tomorrow
   - For each patient:
     a. Sanitize: "Reminder for John Doe, knee surgery consult"
     b. Send to Claude API: "Draft friendly reminder email for Patient-2847, Procedure-A consult"
     c. Claude generates: "Dear Patient-2847, this is a reminder about your Procedure-A consultation..."
     d. De-sanitize: "Dear John Doe, this is a reminder about your knee surgery consultation..."
     e. Send via SendGrid
```

**n8n Template** (Published on n8n marketplace):
```json
{
  "name": "HIPAA-Compliant Patient Reminder Emails",
  "nodes": [
    {
      "type": "Cron",
      "parameters": { "schedule": "0 18 * * *" }
    },
    {
      "type": "PromptBlocker",
      "operation": "sanitize",
      "parameters": {
        "orgId": "{{ $env.PROMPTBLOCKER_ORG_ID }}",
        "layerId": "layer_patients",
        "text": "Reminder for {{ $json.patientName }}, {{ $json.procedure }} consult"
      }
    },
    {
      "type": "Anthropic",
      "parameters": {
        "prompt": "Draft a friendly reminder email for {{ $json.sanitized }}"
      }
    },
    {
      "type": "PromptBlocker",
      "operation": "de-sanitize",
      "parameters": {
        "sessionId": "{{ $json.sessionId }}",
        "text": "{{ $json.aiResponse }}"
      }
    },
    {
      "type": "SendGrid",
      "parameters": {
        "to": "{{ $json.patientEmail }}",
        "subject": "Appointment Reminder",
        "body": "{{ $json.personalized }}"
      }
    }
  ]
}
```

**Pricing - Healthcare**:
- **Small Practice**: $500/month (5-10 users, 5k API calls)
- **Medium Practice**: $2,000/month (50 users, 50k API calls)
- **Hospital System**: $10,000+/month (500+ users, unlimited API calls, SSO, dedicated support)

### Industry #2: Legal (Attorney-Client Privilege)

**Target Customer**:
- Law firms (5-500 attorneys)
- Corporate legal departments
- Legal tech companies (contract review, e-discovery)

**Custom Features**:

**1. Legal-Specific Alias Templates**
```typescript
// templates/legal/client_matters.json
{
  "layerName": "Client Matters",
  "categories": [
    {
      "name": "Client Names",
      "aliasFormat": "Client-{sequential}",
      "startNumber": 1000
    },
    {
      "name": "Case Numbers",
      "aliasFormat": "Matter-{sequential}",
      "startNumber": 2000
    },
    {
      "name": "Opposing Counsel",
      "aliasFormat": "OpposingCounsel-{sequential}"
    },
    {
      "name": "Contract Parties",
      "aliasFormat": "Party-{letter}", // Party-A, Party-B
    },
    {
      "name": "Judges",
      "aliasFormat": "Judge-{sequential}"
    }
  ]
}
```

**2. Document Redaction Tool**

**Use Case**: Redact client names from 500-page discovery document before sending to AI for summarization.

**Integration**: Microsoft Word Add-In + API
```typescript
// Word Add-In (Office.js)
Office.onReady(() => {
  document.getElementById('redactButton').onclick = async () => {
    await Word.run(async (context) => {
      const body = context.document.body;
      const searchResults = body.search('*', { matchWildcards: true });
      searchResults.load('text');

      await context.sync();

      // Send to PromptBlocker API for redaction
      const redacted = await fetch('https://api.promptblocker.com/v1/sanitize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({
          orgId: FIRM_ORG_ID,
          layerId: 'layer_clients',
          text: searchResults.items.map(r => r.text).join('\n'),
        }),
      }).then(r => r.json());

      // Replace in document
      for (let i = 0; i < searchResults.items.length; i++) {
        searchResults.items[i].insertText(redacted.sanitized, 'Replace');
      }

      await context.sync();
    });
  };
});
```

**3. Conflict Check Integration**

**Use Case**: Before accepting new client "Acme Corp", check if any existing clients conflict.

```typescript
// Salesforce integration via MCP
const conflicts = await mcpServer.callTool('check_conflicts', {
  prospectiveClient: 'Acme Corp',
  layerId: 'layer_clients',
});

// PromptBlocker sanitizes ALL client names, then asks AI
const sanitized = await sanitize('Check for conflicts: Acme Corp vs existing clients');
// Result: "Check for conflicts: ProspectiveClient-A vs Client-1001, Client-1002, ..."

const aiResponse = await claude.messages.create({
  model: 'claude-3-5-sonnet',
  messages: [{
    role: 'user',
    content: sanitized + '\n\nAnalyze if ProspectiveClient-A conflicts with any existing clients based on industry, opposing parties, or related matters.',
  }],
});

// AI can analyze without ever seeing real client names
```

**Pricing - Legal**:
- **Solo/Small Firm**: $200/month (1-5 attorneys)
- **Mid-Size Firm**: $2,500/month (50 attorneys, document redaction, conflict checks)
- **Large Firm**: $15,000+/month (500+ attorneys, integration with DMS, unlimited API)

### Industry #3: Financial Services (SOX, GDPR)

**Target Customer**:
- Wealth management firms
- Insurance companies
- Fintech startups
- Accounting firms

**Custom Features**:

**1. Financial Alias Templates**
```typescript
// templates/finance/client_portfolios.json
{
  "categories": [
    {
      "name": "Client Names",
      "aliasFormat": "Investor-{sequential}"
    },
    {
      "name": "Account Numbers",
      "aliasFormat": "Account-{randomAlphaNumeric:8}",
      "autoGenerate": true
    },
    {
      "name": "Transaction IDs",
      "aliasFormat": "Txn-{uuid}"
    },
    {
      "name": "Portfolio Holdings",
      "mappingType": "ticker", // AAPL → Stock-A
    }
  ]
}
```

**2. Bloomberg Terminal Integration**

**Use Case**: Wealth advisor asks AI to draft portfolio review email for high-net-worth client.

```typescript
// MCP reads from Bloomberg Terminal API
const portfolio = await bloomberg.getPortfolio(clientId);
// Returns: { holdings: [{ ticker: 'AAPL', shares: 500, value: 95000 }, ...] }

// Sanitize client name + holdings
const sanitized = await sanitize(`
  Portfolio review for ${clientName}:
  - AAPL: 500 shares, $95,000
  - TSLA: 200 shares, $52,000
`);
// Result: "Portfolio review for Investor-2847: Stock-A: 500 shares, $95,000, Stock-B: ..."

// AI drafts email
const email = await generateEmail(sanitized);

// De-sanitize before sending
const personalized = await deSanitize(email, sessionId);
```

**3. Transaction Monitoring (AML Compliance)**

**Use Case**: Bank wants AI to analyze transaction patterns for fraud detection, but can't share customer names.

```typescript
// Transaction log (sanitized)
const transactions = await sanitize(`
  John Doe: $10,000 wire to ABC Corp (Cayman Islands)
  John Doe: $9,500 withdrawal (cash)
  Jane Smith: $15,000 deposit from XYZ LLC
`);

// Result:
// Customer-A: $10,000 wire to Company-B (Cayman Islands)
// Customer-A: $9,500 withdrawal (cash)
// Customer-C: $15,000 deposit from Company-D

const analysis = await claude.analyze(transactions + '\n\nFlag suspicious patterns');
// AI can detect structuring (multiple transactions under $10k) without knowing real names
```

**Pricing - Finance**:
- **Startup/RIA**: $500/month (5-20 users)
- **Mid-Market**: $5,000/month (100 users, Bloomberg integration, SOX compliance)
- **Enterprise Bank**: $50,000+/month (10k+ users, self-hosted, custom SLA)

### Platform Integrations - Phase 3

**Salesforce AppExchange** (Priority #1 for all industries):
```typescript
// Salesforce Managed Package
// Adds "PromptBlocker" tab to Salesforce UI

// Custom Object: PromptBlocker_Alias_Mapping__c
{
  Real_Value_Hash__c: String(64), // SHA-256 hash
  Alias_Value__c: String(255),
  Category__c: Picklist(['Contact', 'Account', 'Opportunity', 'Custom']),
  Layer_ID__c: String(50),
}

// Apex Trigger: Before sending data to AI via API
trigger SanitizeBeforeAPI on Contact (before update) {
  for (Contact c : Trigger.new) {
    if (c.Send_To_AI__c == true) {
      // Call PromptBlocker API
      HttpRequest req = new HttpRequest();
      req.setEndpoint('https://api.promptblocker.com/v1/sanitize');
      req.setMethod('POST');
      req.setHeader('Authorization', 'Bearer ' + PromptBlocker_Settings__c.getInstance().API_Key__c);
      req.setBody(JSON.serialize(new Map<String, Object>{
        'orgId' => PromptBlocker_Settings__c.getInstance().Org_ID__c,
        'layerId' => 'layer_contacts',
        'text' => c.FirstName + ' ' + c.LastName
      }));

      Http http = new Http();
      HttpResponse res = http.send(req);

      Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
      c.Sanitized_Name__c = (String) result.get('sanitized');
      c.Session_ID__c = (String) result.get('sessionId');
    }
  }
}
```

**HubSpot Marketplace**:
```typescript
// HubSpot Private App with custom card
// Displays on Contact record: "PromptBlocker Alias: Contact-2847"

app.get('/contact-card', async (req, res) => {
  const contactId = req.query.contactId;

  // Fetch contact from HubSpot
  const contact = await hubspot.contacts.getById(contactId);

  // Check if alias exists
  const alias = await findAlias(contact.properties.firstname + ' ' + contact.properties.lastname);

  res.json({
    results: [{
      objectId: contactId,
      title: 'PromptBlocker',
      properties: [
        { label: 'Alias', value: alias || 'Not yet mapped' },
        { label: 'Layer', value: 'layer_contacts' },
      ],
      actions: [
        {
          type: 'IFRAME',
          width: 800,
          height: 600,
          uri: `https://promptblocker.com/hubspot/create-alias?contactId=${contactId}`,
          label: 'Create Alias',
        },
      ],
    }],
  });
});
```

### Tracking & Analytics - Phase 3

**Industry-Specific Events**:
```javascript
// Healthcare
analytics.logEvent('ehr_integration_enabled', {
  ehrSystem: 'epic',
  fhirVersion: 'r4',
  orgId: 'hash'
});

analytics.logEvent('phi_detected', {
  fieldType: 'ssn',
  autoRedacted: true,
  layerId: 'layer_patients'
});

// Legal
analytics.logEvent('document_redacted', {
  documentType: 'contract',
  pageCount: 45,
  redactionCount: 127,
  tool: 'word_addin'
});

analytics.logEvent('conflict_check_performed', {
  prospectiveClient: 'hash',
  conflictsFound: 0
});

// Finance
analytics.logEvent('transaction_monitoring', {
  transactionCount: 1500,
  flaggedSuspicious: 3,
  complianceRule: 'aml_structuring'
});

// Platform Integrations
analytics.logEvent('salesforce_sync', {
  recordsProcessed: 250,
  aliasesCreated: 18,
  syncDuration: 12 // seconds
});

analytics.logEvent('hubspot_card_viewed', {
  contactId: 'hash',
  aliasExists: true
});
```

**Compliance Tracking** (For Audits):
```typescript
// Log ALL data access for SOC 2 / HIPAA audits
await auditLog.create({
  timestamp: new Date(),
  userId: req.user.uid,
  orgId: req.body.orgId,
  action: 'api_sanitize',
  resourceType: 'alias',
  resourceId: aliasId,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  result: 'success',
  metadata: {
    layerId: req.body.layerId,
    characterCount: req.body.text.length,
    substitutionCount: result.matches.length,
  },
});

// Retention: 7 years for HIPAA, 3 years for SOC 2
```

**Privacy Compliance - Phase 3**:
- [ ] HIPAA BAA signed with all healthcare customers
- [ ] SOC 2 Type II completed (required for all enterprise sales)
- [ ] ISO 27001 certification (international enterprises)
- [ ] GDPR Data Processing Addendum (DPA) for EU customers
- [ ] State privacy laws (CCPA, VCDPA, CPA) compliance
- [ ] Industry-specific: FinCEN (finance), ABA ethics (legal)

**Legal Notices - Phase 3**:
- [ ] Industry-specific Terms (separate for healthcare, legal, finance)
- [ ] Subprocessor updates (disclose Epic, Salesforce integrations)
- [ ] Security incident response plan published
- [ ] Penetration test results summary (redacted) for enterprise buyers
- [ ] Compliance certifications page (`promptblocker.com/compliance`)

**Key Metrics - Phase 3**:
- Enterprise contracts signed (goal: 5 in Year 1)
- Average contract value (ACV)
- Sales cycle length (days from demo to contract)
- Integration adoption rate (% using Salesforce, HubSpot, etc.)
- Industry-specific metrics:
  - Healthcare: EHR integrations active
  - Legal: Documents redacted per month
  - Finance: Transactions monitored per month
- Net Revenue Retention (NRR) - goal: 120%+ (expansion revenue)
- Customer Acquisition Cost (CAC) vs Lifetime Value (LTV) - goal: 1:5 ratio

### Success Criteria - Phase 3
- 5 enterprise contracts ($250k+ total ARR)
- SOC 2 Type II + ISO 27001 certified
- 3 industry verticals with 10+ customers each
- Published on Salesforce AppExchange + HubSpot Marketplace
- Case studies from healthcare, legal, finance customers
- NPS 50+ from enterprise customers

**Timeline**: 16 months (Months 8-24)

---

## Unified Data Architecture - Technical Deep Dive

### Why Design for Enterprise from Day 1?

**The Problem with "We'll Add Teams Later"**:
```typescript
// BAD: Individual-first design
users/{userId}/profiles/{profileId}

// When you add teams, you have to:
// 1. Migrate all existing users to new schema
// 2. Handle backwards compatibility
// 3. Risk data loss during migration
// 4. Expensive Cloud Function to migrate millions of docs

// Result: Weeks of downtime, angry users, data inconsistencies
```

**The Solution: Unified Org Model**:
```typescript
// GOOD: Org-first design from Day 1
organizations/{orgId}/alias_layers/{layerId}/aliases/{aliasId}

// Individual user = Org with 1 member, 1 layer
// Team = Org with 5+ members, 1 shared layer
// Enterprise = Org with 100+ members, multiple layers

// When user upgrades Individual → Team:
// 1. Add members to existing org (no migration!)
// 2. Create new shared layer
// 3. User's personal layer stays intact

// Result: Zero downtime, seamless upgrade, data stays safe
```

### Org Types Comparison

| Feature | Individual | Team | Enterprise |
|---------|-----------|------|------------|
| Members | 1 | 5-50 | 50+ |
| Layers | 1 (Personal) | 1 (Shared) + Personal | Multiple (Departments) + Personal |
| Admins | 1 (self) | 1 | Multiple (role-based) |
| Access Control | N/A | All members see shared aliases | Layer-based permissions |
| Billing | $5/month | $8/seat/month | Custom |
| API Access | ❌ | ✅ (limited) | ✅ (unlimited) |
| MCP Servers | ❌ | ✅ (3) | ✅ (unlimited) |
| SSO | ❌ | ❌ | ✅ |
| Support | Community | Email | Dedicated engineer |

### Upgrade Paths

**Individual → Team**:
```typescript
async function upgradeToTeam(orgId: string, seats: number) {
  // 1. Update org type
  await db.collection('organizations').doc(orgId).update({
    type: 'team',
    plan: 'team',
    seats: seats,
    stripeSubscriptionId: subscription.id,
  });

  // 2. Create shared layer
  await db.collection('organizations').doc(orgId)
    .collection('alias_layers').doc('layer_team_shared').set({
      layerId: 'layer_team_shared',
      name: 'Team Shared',
      description: 'Aliases shared across the team',
      visibleToRoles: ['owner', 'admin', 'member'],
      editableByRoles: ['owner', 'admin'],
    });

  // 3. Personal layer stays intact (no data loss!)
  // User now has 2 layers: 'layer_personal' + 'layer_team_shared'
}
```

**Team → Enterprise**:
```typescript
async function upgradeToEnterprise(orgId: string) {
  // 1. Update org type
  await db.collection('organizations').doc(orgId).update({
    type: 'enterprise',
    plan: 'enterprise',
    seats: 100, // Negotiated in contract
    settings: {
      requireMFA: true,
      allowedDomains: ['acmecorp.com'], // SSO domain
      defaultPrivacyLevel: 'zero_knowledge',
    },
  });

  // 2. Convert single admin to admin group
  const owner = await db.collection('organizations').doc(orgId)
    .collection('members').where('role', '==', 'owner').get();

  await owner.docs[0].ref.update({
    role: 'admin', // Part of admin group now
    accessLayers: ['layer_all'], // Can see all layers
  });

  // 3. Create departmental layers
  const departments = ['Sales', 'Legal', 'HR', 'Finance'];
  for (const dept of departments) {
    const layerId = `layer_${dept.toLowerCase()}`;
    await db.collection('organizations').doc(orgId)
      .collection('alias_layers').doc(layerId).set({
        layerId,
        name: dept,
        description: `${dept} department aliases`,
        visibleToRoles: ['admin'],
        editableByRoles: ['admin'],
      });
  }

  // 4. Team shared layer stays (no data loss!)
  // Now has: Personal + Team Shared + Sales + Legal + HR + Finance
}
```

### Access Control - Layer Visibility

**Example: Law Firm with 50 Attorneys**

```typescript
// Org structure
{
  orgId: 'org_smithlaw',
  type: 'enterprise',

  members: {
    'user_partner1': { role: 'admin', accessLayers: ['layer_all'] },
    'user_partner2': { role: 'admin', accessLayers: ['layer_all'] },
    'user_attorney1': { role: 'member', accessLayers: ['layer_litigation'] },
    'user_attorney2': { role: 'member', accessLayers: ['layer_corporate'] },
    'user_paralegal1': { role: 'member', accessLayers: ['layer_litigation'] },
  },

  layers: {
    'layer_all_clients': { visibleToRoles: ['admin'] }, // Partners only
    'layer_litigation': { visibleToRoles: ['admin', 'litigation_team'] },
    'layer_corporate': { visibleToRoles: ['admin', 'corporate_team'] },
    'layer_conflicts': { visibleToRoles: ['admin'] }, // Sensitive - partners only
  }
}

// Query: What aliases can user_attorney1 see?
async function getVisibleAliases(userId: string) {
  const member = await db.collection('organizations/org_smithlaw/members').doc(userId).get();
  const accessLayers = member.data().accessLayers; // ['layer_litigation']

  const aliases = [];
  for (const layerId of accessLayers) {
    const layerAliases = await db.collection('organizations/org_smithlaw/alias_layers')
      .doc(layerId).collection('aliases').get();
    aliases.push(...layerAliases.docs);
  }

  return aliases;
  // Result: user_attorney1 only sees litigation client aliases, NOT corporate clients
}
```

### Zero-Knowledge Mode - Enterprise Privacy

**Use Case**: Bank doesn't trust cloud storage for customer names.

```typescript
// When creating alias in zero-knowledge mode
async function createAliasZeroKnowledge(orgId: string, layerId: string, data: AliasData) {
  // User's browser derives encryption key from passphrase (never sent to server)
  const userPassphrase = prompt('Enter your encryption passphrase:');
  const encryptionKey = await deriveKey(userPassphrase); // PBKDF2 with salt

  // Encrypt alias value client-side
  const encryptedAlias = await encryptAES(data.aliasValue, encryptionKey);

  // Hash real value (irreversible)
  const hash = await sha256(data.realValue);

  // Send to server
  await db.collection('...').add({
    aliasId: generateId(),
    realValueHash: hash, // Server only stores hash
    aliasValueEncrypted: encryptedAlias, // Server can't decrypt without passphrase
    category: data.category,
  });
}

// Matching still works (hash comparison)
async function sanitize(text: string, layerId: string) {
  const words = text.split(/\s+/);
  let result = text;

  for (const word of words) {
    const hash = await sha256(word.toLowerCase());

    // Find matching hash in Firestore
    const snapshot = await db.collection('...').where('realValueHash', '==', hash).get();

    if (!snapshot.empty) {
      // Found match! Decrypt alias value
      const encrypted = snapshot.docs[0].data().aliasValueEncrypted;

      // User must enter passphrase to decrypt
      const passphrase = getPassphraseFromSession(); // Cached for 1 hour
      const key = await deriveKey(passphrase);
      const aliasValue = await decryptAES(encrypted, key);

      result = result.replace(new RegExp(word, 'gi'), aliasValue);
    }
  }

  return result;
}

// What server sees in Firestore:
{
  aliasId: 'alias_abc123',
  realValueHash: 'f3d8a9c1e4b7...', // Can't reverse this to get "John Doe"
  aliasValueEncrypted: 'U2FsdGVkX1...', // Can't decrypt without passphrase
  category: 'name'
}

// Even if Firestore is breached, attacker gets nothing useful!
```

---

## Go-To-Market Timeline

### Months 1-3: B2C Launch
- Week 1-2: Beta testing (10 users)
- Week 3: Fix bugs, polish UX
- Week 4: Submit to Chrome Web Store
- Week 5-6: Marketing campaign (Product Hunt, Reddit, Twitter)
- Week 7-12: Iterate based on feedback, aim for 500 users

**Goal**: $5k MRR (1,000 users @ $5/month)

### Months 2-3: Teams Tier
- Week 1-4: Build Teams features (overlaps with B2C marketing)
- Week 5-6: Beta test with 5 teams
- Week 7-8: Launch Teams tier, target small agencies

**Goal**: $2k MRR from teams (25 teams @ $80/month avg)

### Months 4-7: API/MCP Launch
- Month 4: Build API endpoints + MCP server
- Month 5: Create n8n custom node + templates
- Month 6: Launch on n8n marketplace
- Month 7: Add Zapier integration

**Goal**: $30k MRR ($5k B2C + $2k Teams + $23k API)

### Months 8-12: Industry Verticals
- Month 8-9: Healthcare buildout (HIPAA compliance)
- Month 10-11: Legal buildout (conflict checks, redaction)
- Month 12: Finance buildout (AML monitoring)

**Goal**: $50k MRR (first 3 enterprise contracts @ $5k-$10k/month each)

### Months 13-18: Enterprise Sales
- Hire enterprise sales rep
- SOC 2 Type II certification
- Salesforce AppExchange listing
- Target 50-500 employee companies

**Goal**: $100k MRR (10 enterprise contracts)

### Months 19-24: Scale & Expansion
- Expand to international markets (EU, UK, Australia)
- GDPR compliance certifications
- HubSpot Marketplace listing
- Self-hosted option for banks/government

**Goal**: $150k MRR ($1.8M ARR)

---

## Revenue Model Summary

| Revenue Stream | Month 3 | Month 6 | Month 12 | Month 24 |
|----------------|---------|---------|----------|----------|
| B2C Individual | $5k | $10k | $25k | $50k |
| Teams | $2k | $5k | $15k | $30k |
| API/MCP | - | $15k | $30k | $60k |
| Enterprise | - | - | $30k | $100k |
| **Total MRR** | **$7k** | **$30k** | **$100k** | **$240k** |
| **ARR** | $84k | $360k | $1.2M | $2.88M |

**Exit Options**:
- Bootstrap: Keep growing, aim for $5M ARR, take $3M+ profit/year
- Series A: Raise at Month 18-24 when at $1.5M ARR, 15x multiple = $20M+ valuation
- Acquisition: Salesforce, HubSpot, or Epic might acquire for $50M+ at $2M ARR

---

## Technical Implementation Priorities

### Phase 0 (Weeks 1-4):
1. ✅ E2E tests passing (auth, profiles, substitution)
2. ✅ Error logging to Firebase
3. ⬜ Landing page + Chrome Web Store listing
4. ⬜ Privacy policy + Terms of Service
5. ⬜ Analytics integration (Firebase Analytics)
6. ⬜ Beta testing with 10 users

### Phase 1 (Weeks 5-12):
1. ⬜ Firestore schema migration to org model
2. ⬜ Cloud Functions: createTeamCheckoutSession, inviteTeamMember, acceptTeamInvite
3. ⬜ Extension UI: Org switcher, layer tabs
4. ⬜ Stripe integration (multi-seat billing)
5. ⬜ Team invite email templates
6. ⬜ DPA for GDPR compliance

### Phase 2 (Weeks 13-28):
1. ⬜ API endpoints: /sanitize, /de-sanitize, /usage
2. ⬜ API key generation + authentication
3. ⬜ Admin dashboard at promptblocker.com/dashboard
4. ⬜ MCP server (open source repo)
5. ⬜ CSV import wizard (data mapping)
6. ⬜ n8n custom node
7. ⬜ SOC 2 prep (access logs, encryption, monitoring)
8. ⬜ Zero-knowledge storage mode

### Phase 3 (Weeks 29-80):
1. ⬜ Healthcare: EHR integrations (Epic FHIR, Cerner)
2. ⬜ Legal: Word Add-In, conflict check tool
3. ⬜ Finance: Bloomberg integration, AML monitoring
4. ⬜ Salesforce AppExchange package
5. ⬜ HubSpot Marketplace app
6. ⬜ SOC 2 Type II audit
7. ⬜ ISO 27001 certification
8. ⬜ HIPAA BAA templates

---

## Key Success Metrics (KPIs)

### Product Metrics:
- **Activation Rate**: % of installs that create first profile (goal: 70%+)
- **DAU/MAU Ratio**: Daily vs monthly active users (goal: 30%+)
- **Substitutions per User**: Avg per day (goal: 10+)
- **Error Rate**: % of API calls failing (goal: <1%)
- **Session Expiration Rate**: % of sanitize sessions never de-sanitized (goal: <20%)

### Business Metrics:
- **MRR Growth Rate**: Month-over-month (goal: 20%+)
- **Churn Rate**: % of users canceling (goal: <5%)
- **Net Revenue Retention (NRR)**: Expansion revenue (goal: 120%+)
- **CAC Payback Period**: Months to recover acquisition cost (goal: <6 months)
- **LTV:CAC Ratio**: Lifetime value vs cost (goal: 5:1)

### Sales Metrics (Enterprise):
- **Sales Cycle Length**: Days from demo to contract (goal: <60 days)
- **Win Rate**: % of opportunities closed (goal: 30%+)
- **Average Contract Value (ACV)**: Per enterprise deal (goal: $50k+)
- **Expansion Rate**: % of customers upgrading (goal: 40%+)

### Compliance Metrics:
- **Audit Log Completeness**: % of actions logged (goal: 100%)
- **Data Breach Count**: Incidents per year (goal: 0)
- **Privacy Request Response Time**: Days to fulfill GDPR requests (goal: <14 days)
- **Uptime SLA**: % uptime for Enterprise tier (goal: 99.9%+)

---

## Risk Mitigation

### Technical Risks:

**Risk**: Firebase costs spike with scale
- **Mitigation**: Implement aggressive caching (Redis), rate limiting, move hot data to PostgreSQL

**Risk**: API abuse (bot traffic, DDoS)
- **Mitigation**: API key rate limits, Cloudflare WAF, auto-revoke on 3x overage

**Risk**: Data breach exposes customer PII
- **Mitigation**: Zero-knowledge mode, encryption at rest, SOC 2 compliance, bug bounty program

### Business Risks:

**Risk**: Chrome Web Store rejects extension
- **Mitigation**: Pre-submission review with CWS policy expert, have Firefox + Edge versions ready

**Risk**: Low B2C conversion (free users don't upgrade)
- **Mitigation**: Freemium limits (5 aliases max), clear value prop for Pro ($5/month = unlimited)

**Risk**: Enterprise sales cycle too long (18+ months)
- **Mitigation**: Focus on mid-market (50-200 employees) first, faster decisions

### Competitive Risks:

**Risk**: Google/Microsoft builds this into Chrome/Edge
- **Mitigation**: Focus on API/MCP (they won't build this), enterprise features (compliance, integrations)

**Risk**: Open-source competitor emerges
- **Mitigation**: Our moat is integrations (Salesforce, Epic, n8n), not core tech

---

## Next Steps (Immediate Action Items)

### This Week:
1. ✅ Finalize this roadmap document
2. ⬜ Create GitHub project board with Phase 0-3 tasks
3. ⬜ Set up Firebase Analytics in extension
4. ⬜ Draft privacy policy (use template, customize for our use case)
5. ⬜ Design landing page mockup

### Next 2 Weeks:
1. ⬜ Complete E2E test suite (auth lifecycle, profile CRUD, substitution validation)
2. ⬜ Fix any remaining bugs found by E2E tests
3. ⬜ Build landing page (promptblocker.com)
4. ⬜ Write Chrome Web Store listing copy
5. ⬜ Record demo video (2 min)

### Next 4 Weeks:
1. ⬜ Beta test with 10 users
2. ⬜ Implement analytics event tracking
3. ⬜ Launch v1.0 on Chrome Web Store
4. ⬜ Product Hunt launch
5. ⬜ Begin Firestore migration to org model

---

## Conclusion

This roadmap transforms PromptBlocker from a B2C privacy tool into an **enterprise-grade AI compliance platform**. The key insights:

1. **Design org architecture from Day 1** - treat individuals as "orgs with 1 member" to avoid painful migrations
2. **Launch B2C first** - build trust, gather feedback, generate initial revenue
3. **API/MCP is the big opportunity** - compliance middleware for the AI economy
4. **Industry-specific buildouts win enterprise** - healthcare, legal, finance have budget + compliance needs
5. **Integrations are the moat** - Salesforce, Epic, n8n make us irreplaceable

**Timeline**: 24 months from v1.0 launch to $2.88M ARR

**Investment**: $0 (bootstrap) or optional Series A at Month 18 ($1.5M ARR = $20M valuation)

**Exit**: Bootstrap to $5M+ ARR, or sell to Salesforce/HubSpot/Epic for $50M+

This is the roadmap. Let's execute. 🚀
