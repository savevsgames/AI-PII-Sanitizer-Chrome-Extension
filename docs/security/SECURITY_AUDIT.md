# PromptBlocker - Security Audit & Roadmap to Production

**Date:** 2025-11-01
**Status:** 🚨 **CRITICAL ISSUES IDENTIFIED** - Not production-ready
**Auditor:** Development team self-audit

---

## 🎯 Executive Summary

PromptBlocker has a solid technical foundation but **has critical security and infrastructure gaps that MUST be addressed before Chrome Web Store launch**. This audit identifies security vulnerabilities, missing authentication/payment systems, and infrastructure requirements.

### Risk Level: 🔴 HIGH

**Showstoppers for Launch:**
1. ❌ No authentication system (users can't be verified)
2. ❌ No payment processing (can't monetize PRO tier)
3. ❌ XSS vulnerabilities in popup UI (innerHTML without consistent escaping)
4. ❌ localStorage usage detected (should use chrome.storage.local exclusively)
5. ❌ No server infrastructure for user management
6. ❌ Untested on systems other than developer's local machine
7. ❌ No community support infrastructure (Discord, issue tracking, feedback system)
8. ❌ No CI/CD pipeline for safe deployments

---

## 🔒 Security Vulnerabilities

### CRITICAL: XSS Risks (Priority: P0)

**Issue:** Multiple innerHTML assignments without consistent XSS protection

**Vulnerable Code Locations:**
```typescript
// src/popup/components/activityLog.ts:45
debugConsole.innerHTML = activityLog.map(...).join('\n');

// src/popup/components/apiKeyModal.ts:401
detectedKeysContainer.innerHTML = keys.map((key, index) => `...`).join('');

// src/popup/components/profileModal.ts:446, 471
emptyState.innerHTML = `...`;
header.innerHTML = `...`;

// src/popup/components/profileRenderer.ts:27
profileList.innerHTML = profiles.map(...).join('');

// And 40+ more instances across popup components
```

**Why This is Dangerous:**
- User-controlled data (profile names, emails, custom rule patterns) rendered directly
- Attacker could inject malicious JavaScript through profile names
- Example attack: Profile name: `<img src=x onerror=alert('XSS')>`
- Could steal encrypted data, modify profiles, or exfiltrate API keys

**Impact:** HIGH - User data exposure, credential theft, profile manipulation

**Fix Required:**
```typescript
// BEFORE (vulnerable):
element.innerHTML = `<div>${userInput}</div>`;

// AFTER (safe):
import { escapeHtml } from '../utils/dom';
element.innerHTML = `<div>${escapeHtml(userInput)}</div>`;

// OR (preferred):
element.textContent = userInput; // No HTML rendering
```

**Files Requiring Audit:**
- ✅ `src/popup/utils/dom.ts` - escapeHtml() exists but NOT consistently used
- ❌ `src/popup/components/activityLog.ts` - Direct innerHTML
- ❌ `src/popup/components/apiKeyModal.ts` - Template literals without escaping
- ❌ `src/popup/components/apiKeyVault.ts` - Key rendering without escaping
- ❌ `src/popup/components/customRulesUI.ts` - Pattern/result rendering
- ❌ `src/popup/components/featuresTab.ts` - Feature cards
- ❌ `src/popup/components/profileModal.ts` - Profile editing UI
- ❌ `src/popup/components/profileRenderer.ts` - Profile list rendering
- ❌ `src/popup/components/statsRenderer.ts` - Stats visualization

**Action Items:**
1. [ ] Audit every innerHTML assignment (52 instances found)
2. [ ] Apply escapeHtml() to ALL user-controlled data
3. [ ] Create ESLint rule to prevent raw innerHTML
4. [ ] Add security tests for XSS prevention
5. [ ] Document safe coding practices in CONTRIBUTING.md

---

### CRITICAL: localStorage Usage (Priority: P0)

**Issue:** `localStorage` detected in codebase (should use chrome.storage.local exclusively)

**Why This is Dangerous:**
- localStorage is NOT encrypted (anyone with disk access can read it)
- Violates Chrome extension security best practices
- Not sandboxed per-extension (potential cross-extension leaks)
- Does not respect extension uninstall (data persists)

**Vulnerable Locations:**
```typescript
// src/popup/components/minimalMode.ts (likely)
// Grep found localStorage usage in popup components
```

**Impact:** HIGH - Unencrypted data exposure, privacy violation

**Fix Required:**
1. [ ] Replace ALL localStorage with chrome.storage.local
2. [ ] Ensure StorageManager.ts handles all persistence
3. [ ] Grep audit: `rg "localStorage" src/ --type ts`
4. [ ] Add ESLint rule to ban localStorage

---

### CRITICAL: Encryption Key Material Co-Located with Encrypted Data (Priority: P0) 🚨

**Issue:** Encryption key material stored alongside encrypted data in chrome.storage.local

**Location:** `src/lib/storage.ts:1669-1688` (key material), `src/lib/storage.ts:153-156` (encrypted data)

```typescript
// CRITICAL VULNERABILITY:
// 1. Key material stored in chrome.storage.local
await chrome.storage.local.set({ '_encryptionKeyMaterial': randomKey }); // 🔴 INSECURE

// 2. Salt stored in chrome.storage.local
await chrome.storage.local.set({ '_encryptionSalt': randomSalt }); // 🔴 INSECURE

// 3. Encrypted profiles ALSO in chrome.storage.local
await chrome.storage.local.set({ 'profiles': encryptedProfiles }); // 🔴 INSECURE

// Result: Attacker with chrome.storage access has BOTH key and data!
```

**Why This is CRITICAL:**
- **Defeats Purpose of Encryption**: Like locking your house and leaving the key under the doormat
- **Single Point of Compromise**: Malicious extension with chrome.storage access gets everything
- **No Key Separation**: Key material and ciphertext in same security boundary
- **Attack Scenario:**
  1. Malicious extension reads chrome.storage.local
  2. Extracts `_encryptionKeyMaterial` and `_encryptionSalt`
  3. Derives AES-256 key using PBKDF2 (same algorithm we use)
  4. Decrypts all profiles, API keys, custom rules

**Impact:** CRITICAL - Complete bypass of encryption. User PII fully exposed to attackers with chrome.storage access.

**Current State:**
- ⚠️ Random key material implemented (better than chrome.runtime.id)
- ⚠️ Per-user unique keys (good)
- ⚠️ 210k PBKDF2 iterations (good)
- ❌ **But key material stored with encrypted data (CRITICAL FLAW)**

**Fix Required: Firebase UID-Based Encryption** 🔐

**Solution:** Use Firebase User ID as key material (never stored locally)

```typescript
// SECURE IMPLEMENTATION:
private async getEncryptionKey(): Promise<CryptoKey> {
  const { auth } = await import('./firebase');

  // Key material = Firebase UID (NOT stored in chrome.storage!)
  if (!auth.currentUser?.uid) {
    throw new Error('ENCRYPTION_KEY_UNAVAILABLE: Sign in to access encrypted data');
  }

  const keyMaterial = auth.currentUser.uid; // ✅ SECURE: Only in memory

  // Salt can be public (stored in chrome.storage.local is OK)
  const salt = await this.getOrGenerateSalt();

  // Derive AES-256 key
  return await this.deriveKey(keyMaterial, salt);
}
```

**Benefits:**
1. ✅ **Key Separation**: Firebase UID never stored locally
2. ✅ **Auto-Locking**: User logs out → Firebase UID unavailable → data locked
3. ✅ **Two-Factor Protection**: Attacker needs BOTH chrome.storage AND Firebase session
4. ✅ **Remote Revocation**: User can revoke Firebase session → immediately locks data
5. ✅ **Per-User Isolation**: Each Firebase user has unique UID

**Action Items:**
1. [ ] **BLOCKER**: Implement Firebase UID-based encryption (2-3 days)
2. [ ] Add migration for existing users with random key material
3. [ ] Handle signed-out state (show locked UI)
4. [ ] Test encryption/decryption with Firebase auth flow
5. [ ] Document security model in user-facing docs

**See Also:** [Firebase UID Encryption Plan](./development/FIREBASE_UID_ENCRYPTION.md) (comprehensive implementation guide)

**Status:** 🚨 **BLOCKER FOR LAUNCH** - Must be fixed before Chrome Web Store submission

---

### MEDIUM: No Input Validation (Priority: P2)

**Issue:** Limited input validation on profile data, API keys, custom rules

**Impact:** MEDIUM - Malformed data could cause crashes or unexpected behavior

**Fix Required:**
1. [ ] Add regex validation for email, phone, address formats
2. [ ] Validate custom rule patterns (prevent ReDoS attacks)
3. [ ] Sanitize all text inputs before storage
4. [ ] Add max length limits (prevent memory exhaustion)

---

### LOW: Debug Logs May Leak PII (Priority: P3)

**Issue:** `console.log()` statements throughout codebase may log sensitive data

**Examples:**
```typescript
// src/lib/storage.ts:222
console.log('[StorageManager] Created profile:', newProfile.profileName, 'with variations');
```

**Fix Required:**
1. [ ] Audit all console.log statements
2. [ ] Remove PII from logs (only log IDs, not names/emails)
3. [ ] Use DEBUG_MODE flag consistently
4. [ ] Consider log sanitization helper

---

## 🚫 Missing Infrastructure

### CRITICAL: No Authentication System (Priority: P0)

**Current State:**
- No user accounts
- No login/signup flow
- Tier system (`free`/`pro`) stored locally but not validated
- Anyone can set `config.account.tier = 'pro'` in console

**Why This Blocks Launch:**
- Cannot enforce PRO feature restrictions
- Cannot track users or prevent piracy
- Cannot provide support (no way to identify users)
- Cannot collect payments (no user to charge)

**Solution Options:**

#### Option A: Firebase Authentication + Firestore (Recommended)
**Pros:**
- Free tier generous (50k MAU)
- Scales automatically
- Built-in OAuth (Google, GitHub, Email)
- Real-time database for sync
- Secure by default

**Cons:**
- Google dependency
- Complex pricing at scale
- Requires learning Firebase APIs

**Implementation:**
```typescript
// 1. Install Firebase
npm install firebase

// 2. Initialize in background
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 3. User login flow
async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Store user ID in chrome.storage
  await chrome.storage.local.set({ userId: user.uid });

  // Fetch user tier from Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const tier = userDoc.data()?.tier || 'free';

  return { userId: user.uid, tier };
}

// 4. Verify tier on PRO feature access
async function checkPROFeature(featureName: string): Promise<boolean> {
  const { userId } = await chrome.storage.local.get('userId');
  if (!userId) {
    // Not logged in - show login modal
    return false;
  }

  const userDoc = await getDoc(doc(db, 'users', userId));
  const tier = userDoc.data()?.tier;

  if (tier !== 'pro') {
    // Show upgrade modal
    return false;
  }

  return true;
}
```

**Cost:** $0-25/month for first 1,000 users

---

#### Option B: Self-Hosted Server (Linux Machine)
**Pros:**
- Full control
- No vendor lock-in
- Private data
- Can run on your Linux machine

**Cons:**
- More work to build
- Must handle security yourself
- Scaling requires infrastructure work
- Uptime responsibility

**Tech Stack:**
```
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL (user accounts) + Redis (sessions)
- Auth: Passport.js (OAuth) or custom JWT
- Payment: Stripe
- Hosting: Your Linux machine (+ Cloudflare for DDoS protection)
```

**Implementation:**
```typescript
// Server: POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Verify credentials
  const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign({ userId: user.id, tier: user.tier }, SECRET_KEY);

  res.json({ token, tier: user.tier });
});

// Extension: Login flow
async function login(email: string, password: string) {
  const response = await fetch('https://yourserver.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const { token, tier } = await response.json();

  // Store token in chrome.storage (secure)
  await chrome.storage.local.set({ authToken: token, tier });
}

// Verify PRO features
async function checkPROFeature(): Promise<boolean> {
  const { authToken } = await chrome.storage.local.get('authToken');
  if (!authToken) return false;

  const response = await fetch('https://yourserver.com/api/auth/verify', {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  const { tier } = await response.json();
  return tier === 'pro';
}
```

**Cost:** $5-20/month (VPS) + domain + SSL cert

---

#### Option C: Supabase (Best of Both Worlds)
**Pros:**
- Open source Firebase alternative
- Self-hostable OR use their cloud
- PostgreSQL database (SQL)
- Built-in auth, real-time, storage
- Generous free tier (50k MAU)

**Cons:**
- Newer, less mature than Firebase
- Smaller community

**Implementation:**
```typescript
// 1. Install Supabase
npm install @supabase/supabase-js

// 2. Initialize
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// 3. User signup
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password'
});

// 4. Check tier
const { data: user } = await supabase
  .from('users')
  .select('tier')
  .eq('id', supabase.auth.user()?.id)
  .single();

return user.tier === 'pro';
```

**Cost:** $0-25/month for first 1,000 users

---

### CRITICAL: No Payment Processing (Priority: P0)

**Current State:**
- PRO features coded but no payment flow
- No Stripe integration
- No subscription management

**Required Components:**
1. **Stripe Integration:**
   ```typescript
   // Server-side: Create checkout session
   const session = await stripe.checkout.sessions.create({
     customer_email: user.email,
     line_items: [{
       price: 'price_1234', // PRO plan price ID
       quantity: 1,
     }],
     mode: 'subscription',
     success_url: 'https://yourapp.com/success',
     cancel_url: 'https://yourapp.com/cancel',
   });

   // Extension: Open Stripe checkout
   chrome.tabs.create({ url: session.url });
   ```

2. **Webhook Handler:**
   ```typescript
   // Server: POST /api/webhooks/stripe
   app.post('/api/webhooks/stripe', async (req, res) => {
     const sig = req.headers['stripe-signature'];
     const event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);

     if (event.type === 'checkout.session.completed') {
       const session = event.data.object;
       // Update user tier to 'pro'
       await db.query('UPDATE users SET tier = $1 WHERE email = $2', ['pro', session.customer_email]);
     }

     res.json({ received: true });
   });
   ```

3. **Subscription Management:**
   - Cancel subscription
   - Update payment method
   - View billing history
   - Handle failed payments

**Cost:** Stripe fees: 2.9% + $0.30 per transaction

---

### CRITICAL: No Testing on Other Systems (Priority: P0)

**Current State:**
- Developer has only tested on their own machine
- No external beta testers
- Unknown compatibility issues

**Risks:**
- May not work on macOS/Linux
- Chrome version compatibility unknown
- Performance issues on slower machines
- Race conditions under heavy load

**Solution:**
1. [ ] Set up beta testing program (10-20 users)
2. [ ] Test on multiple OS (Windows, macOS, Linux)
3. [ ] Test on different Chrome versions (120, 121, 122)
4. [ ] Load testing (100+ profiles, high usage)
5. [ ] Create bug reporting flow (GitHub Issues + template)

---

### HIGH: No Community Infrastructure (Priority: P1)

**Current State:**
- No Discord server
- No email support
- No feedback mechanism
- GitHub Issues not configured

**Required:**
1. **Discord Server:**
   - #announcements channel
   - #support channel
   - #feature-requests channel
   - #bug-reports channel
   - Bot for GitHub issue creation

2. **GitHub Configuration:**
   - Issue templates (bug report, feature request)
   - Pull request template
   - CODEOWNERS file
   - GitHub Discussions enabled

3. **Support Email:**
   - support@promptblocker.com
   - Auto-responder with Discord link

4. **Feedback Form:**
   - In-app feedback button
   - Sends to Discord webhook or email

---

### MEDIUM: No CI/CD Pipeline (Priority: P2)

**Current State:**
- Manual builds with `npm run build:prod`
- No automated testing on commit
- No deployment automation

**Required:**
1. **GitHub Actions Workflow:**
   ```yaml
   # .github/workflows/test.yml
   name: Test & Build

   on: [push, pull_request]

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm ci
         - run: npm test
         - run: npm run build:prod
         - uses: actions/upload-artifact@v3
           with:
             name: extension-dist
             path: dist/
   ```

2. **Automated Chrome Web Store Upload:**
   - Use `chrome-webstore-upload` npm package
   - Requires Chrome Web Store API credentials
   - Only deploy on tagged releases

---

## 🛡️ Security Recommendations

### Immediate Actions (Before Launch)

1. **Fix XSS Vulnerabilities (1-2 days):**
   - [ ] Audit all 52 innerHTML assignments
   - [ ] Apply escapeHtml() consistently
   - [ ] Add XSS prevention tests
   - [ ] Document safe patterns

2. **Fix localStorage Usage (2 hours):**
   - [ ] Replace localStorage with chrome.storage.local
   - [ ] Add ESLint rule to prevent future usage

3. **Improve Encryption (4 hours):**
   - [ ] Generate per-user random keys
   - [ ] Store keys in chrome.storage.local
   - [ ] Update key derivation logic

4. **Choose Auth Provider (1 day research, 3-5 days implementation):**
   - [ ] Evaluate Firebase vs Supabase vs self-hosted
   - [ ] Set up authentication flow
   - [ ] Implement tier verification
   - [ ] Test login/logout flows

5. **Integrate Stripe (2-3 days):**
   - [ ] Create Stripe account
   - [ ] Set up products/prices
   - [ ] Implement checkout flow
   - [ ] Add webhook handler
   - [ ] Test payment flows

### Before Public Launch

1. **Beta Testing (1-2 weeks):**
   - [ ] Recruit 10-20 beta testers
   - [ ] Set up bug reporting system
   - [ ] Fix critical bugs found

2. **Security Audit (External):**
   - [ ] Hire security consultant (optional but recommended)
   - [ ] Run automated security scans
   - [ ] Penetration testing

3. **Performance Testing:**
   - [ ] Load test with 100+ profiles
   - [ ] Memory leak detection
   - [ ] CPU usage profiling

4. **Documentation:**
   - [ ] Security policy (SECURITY.md)
   - [ ] Data handling transparency (PRIVACY_POLICY.md)
   - [ ] Incident response plan

---

## 📋 Updated Roadmap

### Phase 1: Security Fixes (Week 1 - CRITICAL)
**Estimated Time:** 5-7 days

1. [ ] Fix XSS vulnerabilities (all innerHTML)
2. [ ] Replace localStorage with chrome.storage.local
3. [ ] Improve encryption key derivation
4. [ ] Add input validation
5. [ ] Sanitize debug logs

**Deliverable:** Security-hardened codebase

---

### Phase 2: Authentication System (Week 2-3)
**Estimated Time:** 7-10 days

**Decision Point:** Choose auth provider

#### If Firebase/Supabase:
1. [ ] Create Firebase/Supabase project
2. [ ] Implement OAuth login (Google + Email)
3. [ ] Add user profile management
4. [ ] Implement tier verification
5. [ ] Test login flows

#### If Self-Hosted:
1. [ ] Set up Linux server (DigitalOcean, Linode, or your machine)
2. [ ] Install PostgreSQL + Redis
3. [ ] Build Node.js API (Express + TypeScript)
4. [ ] Implement JWT authentication
5. [ ] Add Cloudflare for DDoS protection
6. [ ] Test on staging environment

**Deliverable:** Working authentication system

---

### Phase 3: Payment Integration (Week 3-4)
**Estimated Time:** 5-7 days

1. [ ] Create Stripe account
2. [ ] Define product/pricing:
   - PRO: $4.99/month or $49/year
   - Free trial: 7 days
3. [ ] Implement Stripe Checkout
4. [ ] Add webhook handler
5. [ ] Build subscription management UI
6. [ ] Test payment flows (use Stripe test mode)

**Deliverable:** Monetization system

---

### Phase 4: Beta Testing (Week 4-5)
**Estimated Time:** 7-14 days

1. [ ] Set up Discord server
2. [ ] Configure GitHub Issues (templates)
3. [ ] Recruit 10-20 beta testers (Reddit, Twitter, ProductHunt)
4. [ ] Create feedback form
5. [ ] Monitor bugs and fix critical issues
6. [ ] Iterate based on feedback

**Deliverable:** Beta-tested extension with real users

---

### Phase 5: CI/CD & Automation (Week 5-6)
**Estimated Time:** 3-5 days

1. [ ] Create GitHub Actions workflows
2. [ ] Automate testing on push
3. [ ] Automate Chrome Web Store upload
4. [ ] Set up version tagging
5. [ ] Document deployment process

**Deliverable:** Automated deployment pipeline

---

### Phase 6: Chrome Web Store Submission (Week 6-7)
**Estimated Time:** 5-7 days (includes review wait time)

1. [ ] Create Chrome Web Store developer account ($5 one-time fee)
2. [ ] Prepare listing:
   - 5 screenshots (1280x800)
   - 3 promotional images (440x280, 920x680, 1400x560)
   - Compelling description
   - Privacy policy link
3. [ ] Submit for review
4. [ ] Address any rejection feedback
5. [ ] Publish!

**Deliverable:** Live on Chrome Web Store

---

## 💰 Cost Estimate

### One-Time Costs
- Chrome Web Store developer account: $5
- Domain name (optional): $10-15/year
- SSL certificate (optional, Let's Encrypt is free): $0

### Monthly Costs (First 100 users)
**Option A: Firebase/Supabase**
- Authentication: $0 (free tier)
- Database: $0 (free tier)
- Stripe fees: ~$50-200/month (at 10-40 PRO subs)
- **Total: ~$50-200/month**

**Option B: Self-Hosted**
- VPS (DigitalOcean, Linode): $5-20/month
- Cloudflare (DDoS protection): $0 (free tier)
- Database: $0 (self-hosted PostgreSQL)
- Stripe fees: ~$50-200/month
- **Total: ~$55-220/month**

### Monthly Costs (1,000+ users)
**Option A: Firebase/Supabase**
- Authentication: $25-75/month
- Database: $25-50/month
- Stripe fees: ~$500-2,000/month
- **Total: ~$550-2,125/month**

**Option B: Self-Hosted**
- VPS: $40-100/month (upgraded)
- Cloudflare: $20-50/month (Pro plan)
- Stripe fees: ~$500-2,000/month
- **Total: ~$560-2,150/month**

**Revenue (1,000 users, 5% conversion):**
- 50 PRO users × $4.99/month = **$249.50/month**
- **Profit: -$300 to -$1,900/month** (not profitable yet)

**Break-even point:** ~250-450 PRO subscribers

---

## 🎯 Recommendation: Firebase + Stripe

**Why Firebase:**
1. **Fast to implement:** 5-7 days vs 10-14 days for self-hosted
2. **Scales automatically:** No server management needed
3. **Reliable:** Google's infrastructure (99.95% uptime SLA)
4. **Secure by default:** Built-in security rules, OAuth providers
5. **Free tier generous:** Can launch with $0 infrastructure cost

**Why Not Self-Hosted (Yet):**
1. **More work:** Build API, manage server, handle security
2. **Maintenance burden:** OS updates, security patches, backups
3. **Single point of failure:** Your Linux machine (need redundancy)
4. **Premature optimization:** Solve scaling problems when you have them

**Migration Path:**
- Start with Firebase (v1.0 - v1.5)
- If costs grow, migrate to self-hosted (v2.0+)
- By then, you'll have revenue to hire DevOps help

---

## 🚀 Next Steps

### Immediate (This Week)
1. **Fix XSS vulnerabilities** (highest priority)
2. **Replace localStorage** (2 hour task)
3. **Choose auth provider** (Firebase recommended)
4. **Set up Stripe account** (create test products)

### Short-term (Next 2 Weeks)
1. Implement Firebase authentication
2. Integrate Stripe payments
3. Recruit beta testers
4. Set up Discord server

### Medium-term (Next 4 Weeks)
1. Beta test with 10-20 users
2. Fix critical bugs
3. Prepare Chrome Web Store listing
4. Submit for review

### Long-term (Next 8 Weeks)
1. Launch on Chrome Web Store
2. Build community (Discord, Reddit, Twitter)
3. Iterate based on feedback
4. Plan v1.1 features

---

## 📚 Resources

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)
- [Content Security Policy](https://developer.chrome.com/docs/extensions/mv3/manifest/content_security_policy/)

### Authentication
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [OAuth 2.0 Best Practices](https://oauth.net/2/)

### Payments
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [PCI Compliance](https://stripe.com/guides/pci-compliance)

### Community
- [Discord Server Setup](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server-)
- [GitHub Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests)

---

**Last Updated:** 2025-11-01
**Next Review:** After Phase 1 completion (security fixes)
