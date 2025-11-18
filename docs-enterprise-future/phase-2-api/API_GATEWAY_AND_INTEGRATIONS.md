# PromptBlocker API Gateway & Integration Platform

**Vision:** The compliance layer between businesses and AI - enabling personalized AI communications without exposing PII.

**Market:** $10B+ opportunity (every business using Mailchimp/HubSpot/Salesforce wants AI personalization but can't due to compliance)

**Strategy:** Launch B2C extension first (trust + feedback) → Build API Gateway (revenue) → Enterprise integrations (scale)

---

## Table of Contents
1. [The Core Insight](#the-core-insight)
2. [Architecture: MCP + API Hybrid](#architecture-mcp--api-hybrid)
3. [Integration Ecosystem](#integration-ecosystem)
4. [Data Mapping Wizard](#data-mapping-wizard)
5. [Pre-Built Use Cases](#pre-built-use-cases)
6. [Pricing Strategy](#pricing-strategy)
7. [Go-to-Market Roadmap](#go-to-market-roadmap)
8. [Technical Implementation](#technical-implementation)

---

## The Core Insight

**The Problem:**
- Healthcare: Can't use AI for patient communications (HIPAA)
- Legal: Can't use AI for client outreach (attorney-client privilege)
- Finance: Can't use AI for customer emails (SOX, GDPR)
- Sales: Can't use AI for personalized campaigns (privacy laws)

**Current "Solutions" Don't Work:**
- ❌ Manual review (slow, expensive, doesn't scale)
- ❌ Avoid AI entirely (lose competitive advantage)
- ❌ Generic templates (not personalized)
- ❌ Hope for the best (compliance violations, lawsuits)

**PromptBlocker's Solution:**
```
Customer Data → PromptBlocker (anonymize) → AI → PromptBlocker (re-inject) → Personalized Output
```

**Example:**
```
Input:  "Draft email for John Doe about his knee surgery follow-up"
        ↓ (PromptBlocker anonymizes)
Prompt: "Draft email for Patient-2847 about Procedure-A follow-up"
        ↓ (AI generates)
AI:     "Dear Patient-2847, we hope Procedure-A recovery is going well..."
        ↓ (PromptBlocker re-injects)
Output: "Dear John Doe, we hope your knee surgery recovery is going well..."
```

**Why This Works:**
- ✅ AI never sees PII (compliance maintained)
- ✅ Output is fully personalized (better than templates)
- ✅ Automated (scales to millions of messages)
- ✅ Audit trail (every substitution logged)

---

## Architecture: MCP + API Hybrid

### Model Context Protocol (MCP) Layer

**What is MCP?**
- Protocol for AI systems to access external data safely
- Developed by Anthropic (makers of Claude)
- Standard way to connect AI to databases, CRMs, APIs
- Think of it as "OAuth for AI data access"

**Why MCP + PromptBlocker = Perfect Match:**
```
CRM/Database
  ↓ (MCP: read customer data)
PromptBlocker MCP Server
  ↓ (sanitize PII before AI sees it)
AI Model (Claude, GPT-4, etc.)
  ↓ (generate personalized content)
PromptBlocker API
  ↓ (re-inject real data)
Email/SMS/Chat Platform
```

**Architecture Diagram:**
```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER'S SYSTEM                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Salesforce  │  │ Patient EHR  │  │ MySQL/Postgres│       │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                  │                │
└─────────┼─────────────────┼──────────────────┼───────────────┘
          │                 │                  │
          └────────┬────────┴────────┬─────────┘
                   │                 │
          ┌────────▼─────────────────▼─────────┐
          │  PromptBlocker MCP Server          │
          │  • Read customer data via MCP      │
          │  • Apply org policies              │
          │  • Hash-based matching             │
          │  • Generate aliases                │
          │  • Store session mapping           │
          └────────┬───────────────────────────┘
                   │
          ┌────────▼─────────────────────────┐
          │  PromptBlocker API Gateway        │
          │  • /sanitize-prompt               │
          │  • /call-ai (optional)            │
          │  • /de-sanitize-response          │
          │  • /audit-logs                    │
          └────────┬───────────────────────────┘
                   │
          ┌────────▼────────┬────────────────┐
          │                 │                 │
    ┌─────▼─────┐   ┌──────▼──────┐  ┌──────▼──────┐
    │ OpenAI API│   │Anthropic API│  │ Gemini API  │
    └─────┬─────┘   └──────┬──────┘  └──────┬──────┘
          │                 │                 │
          └────────┬────────┴────────┬────────┘
                   │                 │
          ┌────────▼─────────────────▼─────────┐
          │  De-sanitization Layer              │
          │  • Retrieve session mapping         │
          │  • Replace aliases with real data   │
          │  • Format for destination           │
          └────────┬───────────────────────────┘
                   │
          ┌────────▼────────┬────────────────┐
          │                 │                 │
    ┌─────▼─────┐   ┌──────▼──────┐  ┌──────▼──────┐
    │ Mailchimp │   │  SendGrid   │  │   n8n       │
    └───────────┘   └─────────────┘  └─────────────┘
```

---

## Integration Ecosystem

### Tier 1: No-Code Platforms (Launch First)

#### 1. **n8n Integration** ⭐ PRIORITY
**Why:** Open-source, popular with agencies, easy to build custom nodes

**Implementation:**
```json
// n8n custom node: @n8n-nodes-promptblocker

Node: "PromptBlocker Sanitize"
Inputs:
  - Connection: MCP Server URL (customer's self-hosted or cloud)
  - Org ID
  - Data source: Previous node output
  - Policies: Dropdown (patient_list, client_list, product_list, custom)

Outputs:
  - sanitized_prompt: string
  - session_id: string
  - mapping_preview: object (for debugging)

Node: "PromptBlocker De-sanitize"
Inputs:
  - Session ID (from previous Sanitize node)
  - AI response text

Outputs:
  - personalized_message: string
  - metadata: object (substitution count, policies applied)
```

**Pre-Built Templates:**
1. "HIPAA-Compliant Patient Email Campaign"
2. "Legal Client Follow-up Automation"
3. "Financial Advisor Personalized Newsletters"
4. "Real Estate Agent Property Recommendations"

**Go-to-Market:**
- Submit to n8n community templates
- Blog post: "How to use AI for patient communications legally"
- YouTube tutorial series
- Sponsor n8n newsletter ($500/month)

---

#### 2. **Zapier Integration**
**Why:** 7M users, enterprise-friendly, high intent

**Implementation:**
```javascript
// Zapier app: PromptBlocker

Triggers: None (action-only for MVP)

Actions:
1. "Sanitize Text for AI"
   - Input: Text with PII, Org ID, Policies
   - Output: Sanitized text, Session ID

2. "De-sanitize AI Response"
   - Input: AI response, Session ID
   - Output: Personalized message

3. "Batch Sanitize" (enterprise tier)
   - Input: Array of records from CRM
   - Output: Sanitized batch + session IDs
```

**Pre-Built Zaps:**
1. "New Salesforce Contact → AI Personalized Welcome Email"
2. "HubSpot Deal Won → AI Thank You + Upsell Email"
3. "Airtable Patient Record → AI Appointment Reminder"

---

#### 3. **Make.com (Integromat)**
**Why:** Visual workflow builder, popular in EU, strong SMB market

**Implementation:** Similar to Zapier

---

### Tier 2: Enterprise Platforms (Post-PMF)

#### 4. **Salesforce AppExchange** ⭐ BIGGEST REVENUE
**Why:** 150,000 paying customers, $50-200/user/month pricing accepted

**Product: "PromptBlocker for Salesforce"**

**Features:**
- Button in Salesforce UI: "Generate AI Email" (on Contact/Lead/Opportunity views)
- Admin panel: Configure policies (which fields to protect)
- Audit dashboard: See all AI-generated communications
- Native Salesforce UI (Lightning Web Components)

**User Experience:**
```
1. Sales rep opens Contact: "John Doe - Acme Corp - Interested in Product A"
2. Clicks "Generate Follow-up Email (AI)"
3. Behind the scenes:
   - PromptBlocker sanitizes: "John Doe" → "Contact-2847", "Acme Corp" → "Company-A"
   - Calls GPT-4: "Draft follow-up for Contact-2847 at Company-A about Product A"
   - De-sanitizes response
4. Email appears in Salesforce composer, ready to send
5. Rep clicks "Send" (or edits first)
```

**Pricing:**
- $50/user/month (Salesforce customers expect this pricing)
- Minimum 10 users ($500/month = $6k/year)
- Average deal: 50 users = $2,500/month = $30k/year

**Revenue Potential:**
- 100 customers × 50 seats × $50 = $250k/month = $3M/year
- This ALONE could be a venture-scale business

**Timeline:**
- Build after reaching $10k MRR from API
- 3-4 months to build + pass AppExchange security review

---

#### 5. **HubSpot Marketplace**
**Why:** 194,000 customers, marketing automation focus

**Product: "AI Personalization by PromptBlocker"**

**Features:**
- Workflow action: "Personalize with AI (Privacy-Safe)"
- Email editor: "Generate AI Subject Line" button
- Integration with HubSpot lists (use contact properties as variables)

**Pricing:** $99-299/month (per HubSpot portal)

---

#### 6. **Microsoft 365 / Outlook Add-in**
**Why:** 345M Office 365 users, enterprise standard

**Product: "PromptBlocker AI Assistant"**

**Features:**
- Outlook sidebar: "Compose AI Email" button
- Reads recipient from "To:" field
- Pulls data from Exchange/Azure AD
- Generates personalized email in composer

**Distribution:** Microsoft AppSource

---

### Tier 3: Developer Tools

#### 7. **MCP Server (Open Source)**
**Why:** Build ecosystem, attract developers, enable self-hosted

**GitHub Repository: `promptblocker-mcp-server`**

**What It Does:**
- MCP-compliant server that connects to customer databases
- Applies PromptBlocker policies before exposing data to AI
- Can be self-hosted or used via PromptBlocker Cloud

**Use Cases:**
- Developers building custom AI apps
- Enterprises with strict data residency requirements
- Open-source community contributions (new integrations)

**Monetization:**
- Open-source (free)
- Upsell: PromptBlocker Cloud hosting ($99-999/month)
- Upsell: Enterprise support ($5k+/year)

---

#### 8. **REST API** (Core Product)
**Why:** Foundation for all integrations

**Endpoints:**
```
POST /api/v1/sanitize
POST /api/v1/de-sanitize
POST /api/v1/batch/sanitize
POST /api/v1/batch/de-sanitize
GET  /api/v1/sessions/{sessionId}
GET  /api/v1/audit-logs
POST /api/v1/policies (admin only)
```

**Documentation:** `api.promptblocker.com/docs` (OpenAPI/Swagger)

---

## Data Mapping Wizard

**The Problem:** Enterprises have messy data in various formats (Salesforce fields, MySQL columns, CSV exports, etc.)

**The Solution:** Visual data mapping wizard (like Zapier's field mapper, but privacy-aware)

### User Flow

**Step 1: Connect Data Source**
```
┌─────────────────────────────────────────┐
│  Connect Your Data Source               │
│                                          │
│  [Salesforce]  [MySQL]  [PostgreSQL]    │
│  [CSV Upload]  [API]    [Airtable]      │
│                                          │
│  OR: Use PromptBlocker MCP Server       │
│  [ ] Self-hosted                         │
│  [ ] PromptBlocker Cloud                 │
└─────────────────────────────────────────┘
```

**Step 2: Detect PII Fields**
```
┌──────────────────────────────────────────────┐
│  We detected these fields in your data:     │
│                                               │
│  Field Name          Type      Protect?      │
│  ────────────────────────────────────────    │
│  ✓ full_name         Name      [✓] Yes       │
│  ✓ email             Email     [✓] Yes       │
│  ✓ phone             Phone     [✓] Yes       │
│  ✓ diagnosis         Medical   [✓] Yes       │
│    employee_id       ID        [ ] No        │
│    created_at        Date      [ ] No        │
│                                               │
│  [ Add Custom Field ]                         │
└──────────────────────────────────────────────┘
```

**Step 3: Choose Industry Template**
```
┌──────────────────────────────────────────────┐
│  Select your industry for pre-configured     │
│  protection rules:                            │
│                                               │
│  ( ) Healthcare - HIPAA Compliance           │
│      • Patient names, MRNs, diagnoses        │
│      • Prescription data, provider names     │
│                                               │
│  ( ) Legal - Attorney-Client Privilege       │
│      • Client names, case numbers            │
│      • Opposing parties, court names         │
│                                               │
│  ( ) Financial Services - SOX/GDPR           │
│      • Account numbers, transaction IDs      │
│      • Client names, portfolio data          │
│                                               │
│  ( ) Custom - Build Your Own                 │
└──────────────────────────────────────────────┘
```

**Step 4: CSV Upload & Column Mapping** (For Custom Lists)
```
┌──────────────────────────────────────────────┐
│  Upload your client/patient/product list    │
│                                               │
│  [Choose File: clients.csv]                  │
│                                               │
│  CSV Preview:                                 │
│  ┌──────────────────────────────────────┐   │
│  │ client_name  │ industry  │ contact  │   │
│  │ Acme Corp    │ Tech      │ John Doe │   │
│  │ Beta Inc     │ Finance   │ Jane Doe │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  Map columns to protection types:            │
│                                               │
│  client_name  → [ Client Names ▼ ]          │
│  industry     → [ Don't Protect ▼ ]          │
│  contact      → [ Contact Names ▼ ]          │
│                                               │
│  Alias Format:                                │
│  client_name → [Client-####] (e.g. Client-1001) │
│  contact     → [Contact-####] (e.g. Contact-2001) │
│                                               │
│  [Import 1,247 Records]                       │
└──────────────────────────────────────────────┘
```

**Step 5: Test & Preview**
```
┌──────────────────────────────────────────────┐
│  Test Your Configuration                     │
│                                               │
│  Sample Input:                                │
│  ┌─────────────────────────────────────────┐│
│  │ Draft email for John Doe at Acme Corp   ││
│  │ about his knee replacement surgery      ││
│  └─────────────────────────────────────────┘│
│                                               │
│  Sanitized Output:                            │
│  ┌─────────────────────────────────────────┐│
│  │ Draft email for Contact-2001 at         ││
│  │ Client-1001 about Procedure-A           ││
│  └─────────────────────────────────────────┘│
│                                               │
│  Protection Applied:                          │
│  • "John Doe" → Contact-2001 (Contact Names)│
│  • "Acme Corp" → Client-1001 (Client List)  │
│  • "knee replacement surgery" → Procedure-A │
│                                               │
│  [✓ Looks Good] [⚙ Adjust Settings]          │
└──────────────────────────────────────────────┘
```

**Step 6: Deploy**
```
┌──────────────────────────────────────────────┐
│  Your API Key:                                │
│  pb_live_sk_abc123...  [Copy]               │
│                                               │
│  Quick Start:                                 │
│  [ n8n Template ]  [ Zapier Zap ]            │
│  [ API Docs ]      [ Salesforce App ]        │
│                                               │
│  Next Steps:                                  │
│  1. Install PromptBlocker n8n node           │
│  2. Create your first workflow               │
│  3. Send test email                           │
│                                               │
│  [View Tutorial] [Contact Support]           │
└──────────────────────────────────────────────┘
```

---

## Pre-Built Use Cases

### 1. Healthcare: Patient Email Campaigns

**Scenario:** Dental practice wants to send personalized appointment reminders using AI

**n8n Workflow:**
```yaml
Trigger: Schedule (Every Monday 9am)

Nodes:
1. MySQL: Query upcoming appointments
   SELECT patient_name, procedure, appointment_date FROM appointments
   WHERE appointment_date BETWEEN NOW() AND NOW() + INTERVAL 7 DAY

2. PromptBlocker Sanitize:
   For each patient:
   Template: "Draft reminder email for {patient_name} about {procedure} on {date}"
   Policies: ["patient_list", "medical_procedures"]

3. OpenAI:
   Model: gpt-4
   Prompt: {{ $node["PromptBlocker Sanitize"].json.sanitized_prompt }}

4. PromptBlocker De-sanitize:
   Session ID: {{ $node["PromptBlocker Sanitize"].json.session_id }}
   AI Response: {{ $node["OpenAI"].json.choices[0].message.content }}

5. SendGrid:
   To: {{ $node["MySQL"].json.patient_email }}
   Subject: "Upcoming Appointment Reminder"
   Body: {{ $node["PromptBlocker De-sanitize"].json.personalized_message }}

6. MySQL: Log sent email (audit trail)
```

**Result:**
- HIPAA compliant (AI never saw patient names/procedures)
- Personalized (each email tailored to specific appointment)
- Automated (runs weekly without manual work)
- Auditable (every substitution logged)

**Customer Value:** Save 10 hours/week, increase appointment attendance 20%

---

### 2. Legal: Client Intake Automation

**Scenario:** Law firm wants AI-generated welcome emails for new clients

**Zapier Workflow:**
```
Trigger: New client added to Clio (legal CRM)

Steps:
1. Get client data:
   - Client name
   - Case type
   - Opposing party
   - Assigned attorney

2. PromptBlocker Sanitize:
   Template: "Draft welcome email for {client_name} regarding {case_type} case vs {opposing_party}. Introduce {attorney_name} as their attorney."

3. ChatGPT: Generate email

4. PromptBlocker De-sanitize: Re-inject real names

5. Create draft in Gmail

6. Notify attorney: "Review draft for John Doe case"
```

**Result:**
- Maintains attorney-client privilege
- Saves 30 minutes per client
- Consistent, professional tone
- Attorney reviews before sending (compliance)

---

### 3. Sales: Personalized Outreach at Scale

**Scenario:** SaaS company wants AI-personalized emails for 10,000 leads

**HubSpot Workflow:**
```
Trigger: Contact enters "Nurture Campaign" list

Steps:
1. Get contact properties:
   - Company name
   - Industry
   - Pain point (from form submission)
   - Previous interactions

2. PromptBlocker Sanitize (via HubSpot custom code action):
   Template: "Draft follow-up email for {name} at {company} in {industry} who mentioned {pain_point}"

3. Call OpenAI API

4. PromptBlocker De-sanitize

5. Create email in HubSpot

6. Send (or queue for rep review if high-value)
```

**Result:**
- 10x email productivity
- Higher open rates (personalized subject lines)
- GDPR compliant (data minimization)
- Scales to millions

---

## Pricing Strategy

### API Gateway Tiers

| Tier | Price | API Calls | Features | Target |
|------|-------|-----------|----------|--------|
| **Starter** | $99/mo | 10k/mo | Basic policies, 3 AI providers, Email support | Agencies, small practices |
| **Professional** | $299/mo | 50k/mo | Custom policies, All integrations, Priority support | Growing businesses |
| **Business** | $699/mo | 200k/mo | Batch processing, Webhooks, Advanced analytics | Mid-market |
| **Enterprise** | $1,999+/mo | Unlimited | Self-hosted MCP, SSO, Dedicated support, SLA | Large enterprises |

**Overages:** $10 per 1,000 additional API calls

---

### Platform-Specific Pricing

**Salesforce App:**
- $50/user/month
- Minimum 10 users
- Average deal: $2,500/month ($30k/year)

**HubSpot App:**
- $199/portal/month (unlimited users)
- Enterprise: $499/portal/month (advanced features)

**n8n/Zapier/Make:**
- Included in API Gateway tier
- No separate pricing

**MCP Server (Self-Hosted):**
- Free (open source)
- Enterprise support: $5,000/year

---

### Bundle Pricing (API + Extension)

**Team + API:** $599/month
- 10 extension seats ($8/seat = $80)
- API Starter tier ($99)
- Actually: $179, but bundled for $149/month (save $30)

**Enterprise + API:** Custom
- Extension seats: $50/seat/year
- API: $1,999+/month
- Negotiated based on volume

---

## Go-to-Market Roadmap

### Phase 1: Foundation (Months 1-3) ← YOU ARE HERE
**Goal:** Launch B2C extension, validate product-market fit, gather feedback

**Actions:**
- [ ] Launch extension on Chrome Web Store
- [ ] Add Teams tier ($8/seat/month, 5 seat minimum)
- [ ] Ship 100 units to early adopters
- [ ] Collect testimonials + case studies
- [ ] Create demo videos

**Success Metrics:**
- 500 total users
- 100 paying customers ($5k MRR from extension)
- 10+ testimonials
- Product Hunt top 5 in "Privacy" category

**Marketing:**
- Product Hunt launch
- Reddit (r/ChatGPT, r/privacy)
- Twitter/X content
- LinkedIn posts about AI privacy

---

### Phase 2: API MVP (Months 4-6)
**Goal:** Build API Gateway, launch n8n integration, get first 10 API customers

**Build:**
- [ ] API Gateway (sanitize + de-sanitize endpoints)
- [ ] MCP server (connects to customer databases)
- [ ] n8n custom node
- [ ] 3 pre-built templates (healthcare, legal, sales)
- [ ] Documentation site

**Launch:**
- [ ] API landing page (`promptblocker.com/api`)
- [ ] n8n community template submission
- [ ] Blog post: "HIPAA-Compliant AI with n8n"
- [ ] YouTube tutorial: "Build AI email workflow in 10 minutes"

**Success Metrics:**
- 10 paying API customers ($99-299/month avg = $2k MRR)
- 50 n8n template installs
- 1,000 views on tutorial video

**Sales:**
- Email 100 marketing agencies
- Cold outreach to dental practices
- Post in n8n/Zapier communities

---

### Phase 3: Integration Expansion (Months 7-9)
**Goal:** Launch Zapier, Make.com, get to $10k MRR

**Build:**
- [ ] Zapier integration
- [ ] Make.com integration
- [ ] 10 more pre-built templates
- [ ] Batch API endpoint (for large campaigns)

**Launch:**
- [ ] Zapier App Directory submission
- [ ] Make.com template marketplace
- [ ] Case study: Healthcare practice using PromptBlocker
- [ ] Webinar: "Compliant AI for Marketing Teams"

**Success Metrics:**
- 50 API customers ($10k MRR from API)
- 200 Zapier/Make users
- 2,000 extension users ($10k MRR from extension)
- **Total: $20k MRR**

---

### Phase 4: Enterprise Platforms (Months 10-15)
**Goal:** Launch HubSpot + Salesforce apps, get first enterprise deals

**Build:**
- [ ] HubSpot app
- [ ] Salesforce app (Lightning Web Components)
- [ ] Admin dashboard (web portal)
- [ ] SSO (SAML, OAuth)
- [ ] Audit logging + compliance reports

**Launch:**
- [ ] HubSpot Marketplace
- [ ] Salesforce AppExchange (3-4 month security review)
- [ ] Enterprise landing page
- [ ] Sales deck + demo environment

**Success Metrics:**
- 3 Salesforce customers (avg 50 seats × $50 = $7.5k MRR)
- 10 HubSpot customers (avg $299/portal = $3k MRR)
- **Total API + Apps: $20k+ MRR**
- **Total (all products): $40k MRR**

**Sales:**
- Hire first sales rep (when hitting $30k MRR)
- Outbound to law firms, medical practices
- Attend healthcare/legal tech conferences

---

### Phase 5: Scale (Months 16-24)
**Goal:** $100k MRR, raise Series A or stay bootstrapped

**Expand:**
- [ ] Microsoft 365 add-in
- [ ] Google Workspace add-on
- [ ] More industry templates (real estate, consulting, education)
- [ ] International expansion (EU data residency)
- [ ] Enterprise self-hosted option

**Success Metrics:**
- 100+ Salesforce customers ($50k MRR)
- 200 API customers ($30k MRR)
- 10,000 extension users ($20k MRR)
- **Total: $100k MRR = $1.2M ARR**

**Decision Point:**
- Raise Series A ($5-10M) to scale faster
- OR stay bootstrapped and profitable

---

## Technical Implementation

### API Gateway (Node.js + Express)

**Core Endpoints:**

```typescript
// server/api/v1/sanitize.ts
import { Request, Response } from 'express';
import { getOrgPolicies, hashText, generateAlias, storeSession } from '../services';

export async function sanitize(req: Request, res: Response) {
  const { orgId, template, data, policies } = req.body;

  // Validate API key
  const apiKey = req.headers['x-api-key'];
  const org = await validateApiKey(apiKey, orgId);

  // Load org policies
  const orgPolicies = await getOrgPolicies(orgId, policies);

  // Create session
  const sessionId = generateSessionId();
  const mapping: Record<string, string> = {};

  // Perform substitution
  let sanitizedText = template;

  // Replace template variables with actual data
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{${key}}`;
    sanitizedText = sanitizedText.replace(placeholder, value);
  }

  // Apply policies
  for (const policy of orgPolicies) {
    for (const entry of policy.entries) {
      // Hash words in text, compare to policy hashes
      const words = sanitizedText.split(/\s+/);

      for (const word of words) {
        const wordHash = await hashText(word.toLowerCase());

        if (entry.hash === wordHash) {
          // Generate or use existing alias
          const alias = entry.alias || generateAlias(policy.type);

          // Replace in text
          sanitizedText = sanitizedText.replace(new RegExp(word, 'gi'), alias);

          // Store in mapping
          mapping[alias] = word;

          // Log for audit
          await logSubstitution({
            orgId,
            userId: org.userId,
            policyId: policy.policyId,
            hash: wordHash,
            alias,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  // Store session (expires in 1 hour)
  await storeSession(sessionId, mapping, 3600);

  res.json({
    sanitized_prompt: sanitizedText,
    session_id: sessionId,
    substitution_count: Object.keys(mapping).length,
  });
}
```

```typescript
// server/api/v1/de-sanitize.ts
export async function deSanitize(req: Request, res: Response) {
  const { sessionId, aiResponse } = req.body;

  // Retrieve session
  const mapping = await getSession(sessionId);

  if (!mapping) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }

  // Reverse substitution
  let personalizedMessage = aiResponse;

  for (const [alias, original] of Object.entries(mapping)) {
    personalizedMessage = personalizedMessage.replace(new RegExp(alias, 'g'), original);
  }

  res.json({
    personalized_message: personalizedMessage,
    substitutions_applied: Object.keys(mapping).length,
  });
}
```

---

### MCP Server (TypeScript + MCP SDK)

```typescript
// mcp-server/index.ts
import { MCPServer } from '@modelcontextprotocol/sdk';
import { PolicyEngine } from './policy-engine';

const server = new MCPServer({
  name: 'promptblocker-mcp',
  version: '1.0.0',
});

// Tool: Read customer data (with sanitization)
server.addTool({
  name: 'get_customer_data',
  description: 'Retrieve customer data with PII protection applied',
  parameters: {
    customerId: { type: 'string', required: true },
    fields: { type: 'array', items: { type: 'string' } },
  },
  async handler({ customerId, fields }) {
    // Read from customer's database
    const rawData = await db.customers.findById(customerId);

    // Apply PromptBlocker policies
    const sanitized = await PolicyEngine.sanitize(rawData, {
      orgId: this.orgId,
      policies: ['customer_pii'],
    });

    return sanitized;
  },
});

// Tool: Send personalized email (with de-sanitization)
server.addTool({
  name: 'send_personalized_email',
  description: 'Send email with AI-generated content (PII re-injected)',
  parameters: {
    customerId: { type: 'string' },
    subject: { type: 'string' },
    body: { type: 'string' }, // Contains aliases like "Customer-2847"
    sessionId: { type: 'string' }, // From previous sanitization
  },
  async handler({ customerId, subject, body, sessionId }) {
    // De-sanitize body
    const personalizedBody = await PolicyEngine.deSanitize(body, sessionId);

    // Send email
    await sendEmail({
      to: await getCustomerEmail(customerId),
      subject,
      body: personalizedBody,
    });

    return { sent: true };
  },
});

server.start();
```

---

## Revenue Projections (Conservative)

| Month | Extension MRR | API MRR | Apps MRR | Total MRR | Notes |
|-------|---------------|---------|----------|-----------|-------|
| 1-3   | $5k           | $0      | $0       | $5k       | B2C launch |
| 4-6   | $10k          | $2k     | $0       | $12k      | API MVP |
| 7-9   | $15k          | $10k    | $0       | $25k      | Zapier/Make |
| 10-12 | $20k          | $15k    | $5k      | $40k      | HubSpot |
| 13-15 | $25k          | $20k    | $15k     | $60k      | Salesforce |
| 16-18 | $30k          | $30k    | $30k     | $90k      | Scale |
| 19-24 | $40k          | $40k    | $50k     | $130k     | Enterprise |

**Year 1 ARR:** ~$500k
**Year 2 ARR:** ~$1.5M

**At $1.5M ARR:**
- Bootstrap: ~$500k profit (after expenses) = lifestyle business
- Raise capital: Series A at $15-20M valuation

---

## Next Immediate Steps

**Week 1-2:**
- [ ] Finish B2C extension (final testing)
- [ ] Create API landing page mockup
- [ ] Write 3 blog posts (healthcare, legal, sales use cases)

**Week 3-4:**
- [ ] Launch extension on Chrome Web Store
- [ ] Product Hunt launch
- [ ] Start building API Gateway MVP

**Month 2:**
- [ ] Ship API MVP
- [ ] Build n8n node
- [ ] Create first template (healthcare email campaign)

**Month 3:**
- [ ] Get first 10 API customers
- [ ] Validate pricing
- [ ] Collect feedback for Zapier integration

---

## Summary: Why This Works

✅ **Real problem:** Businesses can't use AI for personalized comms due to compliance
✅ **Huge market:** Every Mailchimp/HubSpot/Salesforce customer wants AI
✅ **Defensible:** Complex tech (encryption, MCP, integrations), not easy to copy
✅ **Network effects:** More integrations → more customers → more integrations
✅ **Multiple revenue streams:** Extension, API, Apps, Enterprise
✅ **Capital efficient:** Can bootstrap to $500k ARR, then decide to raise or not

**The key:** Launch B2C first (trust + feedback), then build API/integrations (revenue + scale).

This isn't just a browser extension. It's the **compliance layer for the AI economy.**
