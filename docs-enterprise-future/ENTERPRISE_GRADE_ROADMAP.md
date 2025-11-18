# Enterprise-Grade PromptBlocker: Implementation Roadmap

**Target Market:** Law firms, financial services, healthcare, consulting firms (100+ employees)
**Price Point:** $50-100/seat/year ($5,000-10,000 minimum annual contract)
**Estimated Build Time:** 3-6 months (with enterprise customer feedback)

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Enterprise Features](#core-enterprise-features)
3. [Industry-Specific Configurations](#industry-specific-configurations)
4. [Analytics & Compliance](#analytics--compliance)
5. [Privacy-Preserving Usage Tracking](#privacy-preserving-usage-tracking)
6. [Implementation Phases](#implementation-phases)
7. [Sales Strategy](#sales-strategy)

---

## Architecture Overview

### Current (Consumer/Teams)
```
User Browser Extension
  ↓
Local chrome.storage (encrypted profiles)
  ↓
Firebase Auth (key material only)
```

### Enterprise
```
User Browser Extension
  ↓
↙         ↘
Local Profiles     +     Company Policy Server
(personal aliases)         (corporate lists, compliance rules)
  ↓                              ↓
Firebase Auth          Enterprise Database (self-hosted or cloud)
(user identity)         (encrypted lists, audit logs, analytics)
```

**Key Principles:**
1. **Hybrid storage** - Personal aliases stay local, corporate data from server
2. **Zero-trust architecture** - Enterprise server never sees plaintext (only hashes for matching)
3. **Compliance-first** - Every substitution logged (encrypted) for audit
4. **Self-hosted option** - Enterprise can run their own policy server (premium tier)

---

## Core Enterprise Features

### 1. SSO / Identity Integration ⭐ CRITICAL

**Why:** Enterprises won't manually invite 500 employees

**Implementation:**
- SAML 2.0 support (Azure AD, Okta, OneLogin)
- OAuth with Google Workspace / Microsoft 365
- Automatic provisioning/deprovisioning

**Technical:**
```typescript
// New Cloud Function
export const enterpriseSSOCallback = functions.https.onRequest(async (req, res) => {
  const samlResponse = req.body.SAMLResponse;

  // Validate SAML assertion
  const profile = await validateSAMLAssertion(samlResponse);

  // Auto-create user with enterprise license
  const user = await admin.auth().createUser({
    uid: profile.nameID,
    email: profile.email,
    displayName: profile.displayName,
  });

  // Link to enterprise org
  await db.collection('users').doc(user.uid).set({
    email: profile.email,
    tier: 'ENTERPRISE',
    orgId: profile.orgId, // From SAML metadata
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Redirect to extension
  res.redirect(`chrome-extension://${EXTENSION_ID}/popup-v2.html`);
});
```

**Effort:** 2-3 weeks (SAML library integration, testing with Azure AD/Okta)

---

### 2. Centralized Policy Management ⭐ CRITICAL

**Why:** Company needs to enforce what gets protected (e.g., "always protect client names")

**Features:**
- Admin portal to define protected entity types
- Policy templates per industry (law, healthcare, finance)
- Push policies to all extensions in real-time

**Data Model:**
```typescript
// Firestore: /organizations/{orgId}/policies/{policyId}
{
  policyId: string;
  type: 'client_list' | 'employee_list' | 'product_list' | 'patient_list' | 'custom';
  name: string; // "Active Client List"
  description: string;
  enabled: boolean;
  priority: number; // Higher priority matches first
  entries: {
    // For client list example:
    hash: string;      // SHA-256 hash of "Acme Corp" (for matching)
    alias: string;     // "Client-2847" (what to substitute)
    metadata?: {       // Encrypted, only admin can decrypt
      clientId: string;
      industry: string;
    }
  }[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Extension Logic:**
```typescript
// In content script substitution logic
async function performSubstitution(text: string): Promise<string> {
  // 1. Check local personal profiles first (existing logic)
  let result = await substituteLocalProfiles(text);

  // 2. Check enterprise policies (NEW)
  if (user.tier === 'ENTERPRISE') {
    const policies = await getOrgPolicies(user.orgId);

    for (const policy of policies) {
      // Hash words in text, compare to policy hashes
      const words = text.split(/\s+/);
      for (const word of words) {
        const wordHash = await sha256(word.toLowerCase());

        const match = policy.entries.find(e => e.hash === wordHash);
        if (match) {
          result = result.replace(new RegExp(word, 'gi'), match.alias);

          // Log substitution for audit
          await logSubstitution({
            userId: user.uid,
            orgId: user.orgId,
            policyId: policy.policyId,
            hash: wordHash, // Don't log actual word!
            alias: match.alias,
            platform: getCurrentPlatform(),
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  return result;
}
```

**Privacy Note:** We NEVER send actual user text to the server. We hash locally and compare hashes.

**Effort:** 3-4 weeks

---

### 3. Industry-Specific List Templates

**Your idea is spot-on.** Here's how to implement:

**Admin Onboarding Flow:**
```
1. Choose Industry:
   [ ] Legal
   [ ] Healthcare
   [ ] Financial Services
   [ ] Consulting
   [ ] Custom

2. Based on selection, pre-populate policy types:

   Legal → Client Lists, Case Lists, Opposing Counsel
   Healthcare → Patient Lists, Medication Lists, Diagnosis Codes
   Finance → Client Portfolios, Transaction IDs, Account Numbers
```

**CSV Import Tool:**
```typescript
// Admin uploads CSV with headers: name, id, category
// We DON'T store raw data, only hashes

interface CSVImportResult {
  policyId: string;
  importedCount: number;
  skippedCount: number;
  preview: {
    sample: string;      // "John Doe" (first row, shown to admin)
    hash: string;        // SHA-256 hash
    alias: string;       // "Client-2847" (generated)
  }[];
}

async function importCSV(file: File, policyId: string): Promise<CSVImportResult> {
  const csv = await parseCSV(file);

  // Validate headers
  const headers = csv[0];
  const nameColumn = detectNameColumn(headers); // "name" | "client_name" | "full_name" etc.

  if (!nameColumn) {
    throw new Error('Could not detect name column. Please select manually.');
  }

  // Process rows
  const entries = csv.slice(1).map((row, index) => {
    const name = row[nameColumn];
    const hash = sha256(name.toLowerCase());
    const alias = `${policyType}-${index + 1000}`; // "Client-1000", "Patient-1001"

    return { hash, alias, metadata: encryptMetadata(row) }; // Encrypt other columns
  });

  // Store in policy
  await db.collection('organizations').doc(orgId)
    .collection('policies').doc(policyId)
    .update({
      entries: admin.firestore.FieldValue.arrayUnion(...entries),
    });

  return {
    policyId,
    importedCount: entries.length,
    skippedCount: 0,
    preview: entries.slice(0, 5), // Show first 5 for confirmation
  };
}
```

**Effort:** 2 weeks (CSV parser, column detection, UI)

---

### 4. Audit Logs & Compliance Reporting ⭐ CRITICAL

**Why:** Enterprises NEED to prove compliance (HIPAA, GDPR, attorney-client privilege)

**Requirements:**
- Every substitution logged (encrypted)
- Admin can generate reports: "What PII was protected this month?"
- Exportable to CSV for compliance audits

**Data Model:**
```typescript
// Firestore: /organizations/{orgId}/audit_logs/{logId}
{
  logId: string;
  userId: string;
  userEmail: string;
  timestamp: Timestamp;
  platform: 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'copilot';
  substitutionCount: number; // How many replacements in this message
  policyIds: string[];       // Which policies triggered
  encrypted_details: string; // AES-256 encrypted JSON with actual substitutions
                             // Key held by org admin only
}
```

**Reports:**
```typescript
// Admin portal function
async function generateComplianceReport(orgId: string, startDate: Date, endDate: Date) {
  const logs = await db.collection('organizations').doc(orgId)
    .collection('audit_logs')
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();

  return {
    totalSubstitutions: logs.docs.reduce((sum, doc) => sum + doc.data().substitutionCount, 0),
    uniqueUsers: new Set(logs.docs.map(doc => doc.data().userId)).size,
    byPlatform: groupBy(logs.docs, doc => doc.data().platform),
    byPolicy: groupBy(logs.docs, doc => doc.data().policyIds),
    exportCSV: generateCSV(logs.docs), // For compliance teams
  };
}
```

**Effort:** 2 weeks

---

### 5. Admin Dashboard (Web Portal)

**URL:** `portal.promptblocker.com` (or `app.promptblocker.com`)

**Features:**
- View all employees using the extension
- Create/edit/delete policies
- Import CSV lists
- View analytics dashboard
- Generate compliance reports
- Manage billing/seats

**Tech Stack:**
- React + TypeScript (reuse extension UI components)
- Firebase Hosting
- Tailwind CSS (for speed)

**Effort:** 4-6 weeks (this is the big one)

---

### 6. Self-Hosted Option (Premium Tier)

**Why:** Banks/law firms may require data stay on-premises

**Architecture:**
```
Enterprise Policy Server (Docker container)
  ↓
PostgreSQL (encrypted policies, audit logs)
  ↓
Sync to extensions via secure API
```

**Implementation:**
- Package policy server as Docker image
- Provide Terraform/CloudFormation templates for AWS/Azure deployment
- Extensions connect to customer's domain: `https://promptblocker.acmecorp.com`

**Pricing:** $20,000-50,000/year + implementation fee

**Effort:** 6-8 weeks + ongoing support

**Priority:** Build ONLY when a customer asks for it (don't build speculatively)

---

## Privacy-Preserving Usage Tracking

**Your question: "How do we track usage without being creepy?"**

Here's the ethical approach:

### What to Track (Aggregated, Anonymous)
✅ **DO track:**
- Number of substitutions per day (count only, no content)
- Which platforms are used most (ChatGPT vs Claude vs Gemini)
- Feature usage (profiles created, custom rules used)
- Performance metrics (substitution latency)

❌ **DON'T track:**
- Actual text content
- User identities (hash userID if needed)
- Specific profiles/aliases
- Conversation content

### Implementation

**Local counting (privacy-first):**
```typescript
// In extension background script
let dailyStats = {
  date: new Date().toISOString().split('T')[0], // "2025-01-15"
  substitutions: {
    chatgpt: 0,
    claude: 0,
    gemini: 0,
    perplexity: 0,
    copilot: 0,
  },
  profilesUsed: new Set(), // Just count, don't store names
};

// When a substitution happens
function recordSubstitution(platform: string, profileId: string) {
  dailyStats.substitutions[platform]++;
  dailyStats.profilesUsed.add(profileId);
}

// Once per day, send aggregated stats (opt-in!)
async function sendDailyStats() {
  const userConsent = await getUserAnalyticsConsent(); // Ask in settings

  if (userConsent) {
    await fetch('https://api.promptblocker.com/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: chrome.runtime.getManifest().version,
        date: dailyStats.date,
        substitutions: dailyStats.substitutions,
        profileCount: dailyStats.profilesUsed.size, // Count only
        tier: user.tier,
        // NO user ID, NO content, NO specific profiles
      }),
    });
  }

  // Reset for next day
  dailyStats = { date: new Date().toISOString().split('T')[0], substitutions: {}, profilesUsed: new Set() };
}
```

**UI in Settings:**
```html
<div class="analytics-consent">
  <h3>Anonymous Usage Analytics</h3>
  <p>Help us improve PromptBlocker by sharing anonymous usage statistics.</p>
  <p><strong>We collect:</strong> Number of substitutions, which platforms you use</p>
  <p><strong>We NEVER collect:</strong> Your conversations, profile names, or personal data</p>

  <label>
    <input type="checkbox" id="analyticsConsent">
    Share anonymous usage data (recommended)
  </label>

  <a href="/privacy">Learn more about our privacy practices</a>
</div>
```

**Alternative: Server-side (for Enterprise):**
```typescript
// In audit logs (already encrypted)
// Aggregate monthly for org admin dashboard
async function getOrgUsageStats(orgId: string, month: string) {
  const logs = await getMonthLogs(orgId, month);

  return {
    totalSubstitutions: logs.reduce((sum, log) => sum + log.substitutionCount, 0),
    activeUsers: new Set(logs.map(log => log.userId)).size,
    topPlatforms: groupByPlatform(logs),
    // All stats are aggregates, no individual user data exposed
  };
}
```

**Best Practice:**
1. **Default to OFF** - Make analytics opt-in, not opt-out
2. **Be transparent** - Show exactly what you collect in settings
3. **Give value back** - Show users their own stats (e.g., "You've protected 1,247 messages this month!")
4. **Enterprise override** - Org admins can enable for compliance, but only aggregated

---

## Implementation Phases

### Phase 1: MVP Enterprise (3 months)
**Build when you have 2-3 interested enterprise customers**

- [ ] SSO (SAML + Google Workspace)
- [ ] Basic admin portal (policy management only)
- [ ] One industry template (legal or healthcare)
- [ ] CSV import for client/patient lists
- [ ] Basic audit logging
- [ ] Pricing: $50/seat/year, minimum 50 seats = $30k/year

**Deliverable:** Can sell to first 5 enterprise customers

---

### Phase 2: Compliance-Ready (6 months)
**Build based on customer feedback from Phase 1**

- [ ] Advanced audit reports (HIPAA/GDPR compliance exports)
- [ ] Multi-industry templates (legal, healthcare, finance)
- [ ] Real-time policy sync
- [ ] User provisioning/deprovisioning automation
- [ ] Enhanced admin dashboard (usage analytics)
- [ ] Pricing: $75/seat/year

**Deliverable:** Can pass enterprise security audits

---

### Phase 3: Self-Hosted Option (9-12 months)
**Build ONLY if customers ask (banks, government)**

- [ ] On-premises deployment option
- [ ] Air-gapped mode (no internet required)
- [ ] Advanced encryption (customer-managed keys)
- [ ] Premium support SLA
- [ ] Pricing: $100+/seat/year or $50k flat fee

**Deliverable:** Can sell to banks, government, high-security orgs

---

## Sales Strategy

### Target Customers (Ranked by Urgency)

**1. Law Firms** ⭐ EASIEST SELL
- **Pain:** Attorney-client privilege violations
- **Budget:** High ($500k+ for tech)
- **Size:** 50-500 lawyers per firm
- **Approach:** "Protect client confidentiality when using AI research tools"
- **Pitch:** "One leaked client name = malpractice lawsuit. We prevent that."

**2. Healthcare Organizations**
- **Pain:** HIPAA violations ($50k+ fines per incident)
- **Budget:** Moderate
- **Size:** 100-1,000 employees
- **Approach:** "HIPAA-compliant AI chat usage for clinical staff"
- **Pitch:** "Use AI for clinical notes without exposing patient data"

**3. Financial Services**
- **Pain:** SEC/FINRA compliance, client confidentiality
- **Budget:** High
- **Size:** 100-10,000 employees
- **Approach:** "Compliant AI usage for advisors and analysts"

**4. Consulting Firms**
- **Pain:** Client NDAs, competitive information leaks
- **Budget:** Moderate
- **Size:** 50-5,000 employees
- **Approach:** "Protect client confidentiality in AI-assisted proposals"

---

### Pricing Tiers

| Tier | Price | Features | Target |
|------|-------|----------|--------|
| Individual | $5/mo | Personal profiles, 5 platforms | Consumers |
| Teams | $8/seat/mo | Shared billing, 5-50 seats | Small businesses |
| Enterprise | $50/seat/yr | SSO, policies, audit logs, admin portal | 50-500 employees |
| Enterprise Plus | $75/seat/yr | Custom integrations, premium support | 500+ employees |
| Self-Hosted | $100+/seat/yr | On-premises, custom SLA | Banks, government |

---

## Revenue Projections

**Conservative (18 months):**
- 500 individuals @ $5/mo = $2,500/mo
- 20 teams (10 seats avg) @ $8/seat = $1,600/mo
- 3 enterprise (100 seats avg) @ $50/seat/yr = $15,000/yr = $1,250/mo
- **Total: $5,350/mo = $64k/year**

**Aggressive (18 months):**
- 2,000 individuals = $10k/mo
- 50 teams = $4k/mo
- 10 enterprise (200 seats avg) @ $75/seat/yr = $150k/yr = $12.5k/mo
- **Total: $26.5k/mo = $318k/year**

**One big self-hosted deal = $50k+ one-time**

---

## Key Decisions

### 1. Do you want to bootstrap or raise capital?

**Bootstrap:**
- Build Teams tier first (2 days)
- Use revenue to fund enterprise development
- Keep 100% equity
- Slower growth but sustainable

**Raise seed round ($500k-$1M):**
- Hire 2-3 engineers
- Build enterprise faster (6 months instead of 18)
- Give up 10-20% equity
- Faster growth, more risk

### 2. Do you want to sell the company eventually?

**If YES:**
- Focus on enterprise revenue (acquirers pay 5-10x revenue for B2B SaaS)
- Aim for $1M ARR in 2-3 years → $5-10M acquisition
- Potential buyers: LastPass, 1Password, Grammarly, McAfee, Norton

**If NO (lifestyle business):**
- Mix of individual + teams is fine
- Aim for $10-20k/mo recurring = $120-240k/year personal income
- Less stress, more freedom

---

## My Recommendation

1. **Launch Individual + Teams tiers** (next 2 weeks)
2. **Get to $5k MRR** from individuals/teams (3 months)
3. **Find 2-3 enterprise pilot customers** (law firms are easiest)
4. **Build enterprise features** based on their feedback (3-6 months)
5. **Hire help** once you hit $10k MRR (or raise capital)
6. **Decision point at $50k MRR:** Lifestyle business or scale to exit?

Your instinct to combine B2C + enterprise is correct. The question is sequencing: build enough to get traction first, then enterprise.

---

## Next Steps (Immediate)

1. **Add Teams tier** (use other doc)
2. **Create enterprise landing page** (`promptblocker.com/enterprise`) with "Request Demo" form
3. **Email 50 law firms** with free pilot offer
4. **When 3 say yes**, start building enterprise features in this doc
5. **Don't build enterprise speculatively** - customer feedback is essential

---

**Want me to help with any specific section? I can create:**
- Enterprise sales email templates
- Demo script
- Security questionnaire (for enterprise buyers)
- Compliance documentation (HIPAA, SOC 2 prep)
