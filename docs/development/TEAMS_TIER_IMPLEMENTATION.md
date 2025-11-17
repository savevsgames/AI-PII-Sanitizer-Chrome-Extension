# Teams Tier Implementation Guide

**Estimated Time:** 2 days of development
**Goal:** Add a "Teams" pricing tier with minimal changes to existing codebase
**Target:** Small teams (5-50 people) who want shared billing but not enterprise features

---

## Why This Is Quick

The key insight: **Teams tier is just group checkout + basic admin, not multi-tenancy**

We're NOT building:
- ❌ Shared storage/aliases (each user still has their own data)
- ❌ Central policy enforcement
- ❌ Real-time sync
- ❌ SSO

We ARE building:
- ✅ Multi-seat Stripe checkout
- ✅ Admin can add/remove seats
- ✅ Team members get PRO features
- ✅ Single bill for the team

**This is essentially "bulk PRO subscriptions with a dashboard"**

---

## Architecture

### Current State
```
User → Stripe Checkout → Individual Subscription → PRO Access
```

### Teams State
```
Admin → Stripe Checkout (qty: 5) → Team Subscription → Invite Links
Team Member → Click Invite → Auto-PRO Access (linked to team sub)
```

---

## Implementation Steps

### Day 1: Backend (Stripe + Firestore)

#### 1.1 Create New Stripe Price IDs (10 minutes)

In Stripe Dashboard:
1. Create new product: "PromptBlocker Teams"
2. Create price: $8/seat/month (recurring, per-unit pricing)
3. Set minimum quantity: 5
4. Add to `.env`:
```env
STRIPE_PRICE_TEAMS_MONTHLY=price_xxxxx
STRIPE_PRICE_TEAMS_YEARLY=price_xxxxx
```

#### 1.2 Update Firestore Schema (30 minutes)

Add new collection: `teams`

```typescript
// firestore/teams/{teamId}
{
  teamId: string;           // Auto-generated
  name: string;             // "Acme Corp Legal Team"
  adminUserId: string;      // UID of person who created team
  stripeSubscriptionId: string;
  stripePriceId: string;
  seats: number;            // How many seats purchased
  usedSeats: number;        // How many invited
  status: 'active' | 'canceled' | 'past_due';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// firestore/teams/{teamId}/members/{userId}
{
  userId: string;
  email: string;
  invitedAt: Timestamp;
  activatedAt?: Timestamp;  // When they accepted invite
  role: 'admin' | 'member';
}

// Add to existing users collection:
// firestore/users/{userId}
{
  // ... existing fields ...
  teamId?: string;          // If they're part of a team
  teamRole?: 'admin' | 'member';
}
```

#### 1.3 Update Cloud Functions (2 hours)

**New function: `createTeamCheckoutSession`**
```typescript
// functions/src/stripe/createTeamCheckoutSession.ts
export const createTeamCheckoutSession = functions.https.onCall(async (data, context) => {
  const { seats, interval } = data; // seats: number, interval: 'month' | 'year'
  const userId = context.auth?.uid;

  if (!userId) throw new Error('Unauthorized');
  if (seats < 5) throw new Error('Minimum 5 seats required');

  const priceId = interval === 'year'
    ? process.env.STRIPE_PRICE_TEAMS_YEARLY
    : process.env.STRIPE_PRICE_TEAMS_MONTHLY;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price: priceId,
      quantity: seats,
    }],
    success_url: `${process.env.WEBSITE_URL}/teams/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.WEBSITE_URL}/teams/cancel`,
    client_reference_id: userId, // Admin user ID
    metadata: {
      type: 'team_subscription',
      adminUserId: userId,
      seats: seats.toString(),
    },
  });

  return { url: session.url };
});
```

**Update existing: `handleStripeWebhook`**
```typescript
// Add to checkout.session.completed handler
if (session.metadata?.type === 'team_subscription') {
  const teamId = db.collection('teams').doc().id;

  await db.collection('teams').doc(teamId).set({
    teamId,
    name: `Team ${teamId.substring(0, 8)}`, // Default name, admin can change
    adminUserId: session.metadata.adminUserId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: session.metadata.priceId,
    seats: parseInt(session.metadata.seats),
    usedSeats: 0,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update admin user
  await db.collection('users').doc(session.metadata.adminUserId).update({
    tier: 'PRO',
    teamId,
    teamRole: 'admin',
  });
}

// Add to customer.subscription.updated handler
// Update team status when subscription changes
if (subscription.metadata?.type === 'team_subscription') {
  const teamQuery = await db.collection('teams')
    .where('stripeSubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (!teamQuery.empty) {
    await teamQuery.docs[0].ref.update({
      status: subscription.status,
      seats: subscription.items.data[0].quantity,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
```

**New function: `inviteTeamMember`**
```typescript
export const inviteTeamMember = functions.https.onCall(async (data, context) => {
  const { email } = data;
  const userId = context.auth?.uid;

  if (!userId) throw new Error('Unauthorized');

  // Get user's team
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData?.teamId || userData.teamRole !== 'admin') {
    throw new Error('Not a team admin');
  }

  // Check seat availability
  const teamDoc = await db.collection('teams').doc(userData.teamId).get();
  const team = teamDoc.data();

  if (!team) throw new Error('Team not found');
  if (team.usedSeats >= team.seats) {
    throw new Error('No available seats');
  }

  // Create invite
  const inviteId = db.collection('teams').doc(userData.teamId).collection('invites').doc().id;

  await db.collection('teams').doc(userData.teamId).collection('invites').doc(inviteId).set({
    inviteId,
    email,
    invitedBy: userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending',
  });

  // TODO: Send email with invite link (use SendGrid/similar)
  // For MVP: Just return invite link to admin to share manually

  return {
    inviteLink: `${process.env.WEBSITE_URL}/teams/join/${inviteId}`,
  };
});
```

**New function: `acceptTeamInvite`**
```typescript
export const acceptTeamInvite = functions.https.onCall(async (data, context) => {
  const { inviteId } = data;
  const userId = context.auth?.uid;

  if (!userId) throw new Error('Unauthorized');

  // Find invite across all teams (we don't know which team yet)
  const teamsSnapshot = await db.collection('teams').get();
  let invite: any = null;
  let teamId: string | null = null;

  for (const teamDoc of teamsSnapshot.docs) {
    const inviteDoc = await teamDoc.ref.collection('invites').doc(inviteId).get();
    if (inviteDoc.exists) {
      invite = inviteDoc.data();
      teamId = teamDoc.id;
      break;
    }
  }

  if (!invite || !teamId) throw new Error('Invalid invite');
  if (invite.status !== 'pending') throw new Error('Invite already used');

  // Verify email matches (if user is signed in)
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  // Accept invite
  const batch = db.batch();

  // Update user
  batch.update(db.collection('users').doc(userId), {
    tier: 'PRO',
    teamId,
    teamRole: 'member',
  });

  // Add to team members
  batch.set(db.collection('teams').doc(teamId).collection('members').doc(userId), {
    userId,
    email: userData?.email || invite.email,
    invitedAt: invite.createdAt,
    activatedAt: admin.firestore.FieldValue.serverTimestamp(),
    role: 'member',
  });

  // Increment used seats
  batch.update(db.collection('teams').doc(teamId), {
    usedSeats: admin.firestore.FieldValue.increment(1),
  });

  // Mark invite as accepted
  batch.update(
    db.collection('teams').doc(teamId).collection('invites').doc(inviteId),
    { status: 'accepted', acceptedBy: userId }
  );

  await batch.commit();

  return { success: true };
});
```

---

### Day 2: Frontend (Extension UI + Landing Pages)

#### 2.1 Add Teams Option to Popup (1 hour)

Update `popup-v2.html` account modal:

```html
<!-- In account settings modal, after current PRO upgrade button -->
<div id="teamsSection" class="section">
  <h3>Teams</h3>
  <p>Get PromptBlocker for your team (minimum 5 seats)</p>

  <!-- If user is NOT on a team -->
  <div id="noTeamView">
    <button id="createTeamBtn" class="btn-primary">
      Create Team ($8/seat/month)
    </button>
  </div>

  <!-- If user IS team admin -->
  <div id="teamAdminView" style="display: none;">
    <div class="team-info">
      <p><strong>Team:</strong> <span id="teamName"></span></p>
      <p><strong>Seats:</strong> <span id="usedSeats"></span> / <span id="totalSeats"></span> used</p>
    </div>

    <div class="invite-section">
      <input type="email" id="inviteEmail" placeholder="Email to invite">
      <button id="inviteBtn">Send Invite</button>
    </div>

    <div id="inviteLink" style="display: none;">
      <p>Share this link:</p>
      <input type="text" id="inviteLinkInput" readonly>
      <button id="copyInviteLink">Copy</button>
    </div>

    <button id="manageTeamBtn">Manage Team</button>
  </div>

  <!-- If user IS team member (not admin) -->
  <div id="teamMemberView" style="display: none;">
    <p>You're part of <strong id="memberTeamName"></strong></p>
    <p>PRO features enabled via team subscription</p>
  </div>
</div>
```

Add handler in `popup-v2.ts`:

```typescript
// Check if user is on a team
async function loadTeamStatus() {
  const user = await getCurrentUser();
  if (!user) return;

  if (user.teamId) {
    const teamDoc = await db.collection('teams').doc(user.teamId).get();
    const team = teamDoc.data();

    if (user.teamRole === 'admin') {
      showTeamAdminView(team);
    } else {
      showTeamMemberView(team);
    }
  } else {
    showNoTeamView();
  }
}

document.getElementById('createTeamBtn')?.addEventListener('click', async () => {
  // For MVP: Default to 5 seats, monthly
  const seats = 5;
  const interval = 'month';

  const { url } = await functions.httpsCallable('createTeamCheckoutSession')({
    seats,
    interval,
  });

  chrome.tabs.create({ url });
});

document.getElementById('inviteBtn')?.addEventListener('click', async () => {
  const email = (document.getElementById('inviteEmail') as HTMLInputElement).value;

  const { inviteLink } = await functions.httpsCallable('inviteTeamMember')({ email });

  document.getElementById('inviteLinkInput').value = inviteLink;
  document.getElementById('inviteLink').style.display = 'block';
});
```

#### 2.2 Create Teams Landing Pages (2 hours)

**File: `promptblocker.com/teams/index.html`**
```html
<!DOCTYPE html>
<html>
<head>
  <title>PromptBlocker Teams - Privacy Protection for Your Team</title>
  <!-- Same styling as main site -->
</head>
<body>
  <nav><!-- Same nav as main site --></nav>

  <section class="hero">
    <h1>Protect Your Team's Privacy in AI Chats</h1>
    <p>Centralized billing, PRO features for everyone, simple team management</p>

    <div class="pricing-card">
      <h2>Teams Plan</h2>
      <div class="price">$8<span>/seat/month</span></div>
      <p>Minimum 5 seats</p>

      <ul>
        <li>✓ All PRO features for every team member</li>
        <li>✓ Centralized billing (one invoice)</li>
        <li>✓ Easy invite system</li>
        <li>✓ Add/remove seats anytime</li>
        <li>✓ Priority support</li>
      </ul>

      <form id="teamsCheckoutForm">
        <label>
          Number of seats:
          <input type="number" id="seats" min="5" value="5">
        </label>
        <p class="total">Total: $<span id="totalPrice">40</span>/month</p>

        <label>
          <input type="radio" name="interval" value="month" checked> Monthly
          <input type="radio" name="interval" value="year"> Yearly (save 17%)
        </label>

        <button type="submit" class="btn-primary">Get Started</button>
      </form>
    </div>
  </section>

  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';

    // Same Firebase config as other pages
    const app = initializeApp({ /* config */ });
    const functions = getFunctions(app);

    document.getElementById('teamsCheckoutForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const seats = parseInt(document.getElementById('seats').value);
      const interval = document.querySelector('input[name="interval"]:checked').value;

      const createSession = httpsCallable(functions, 'createTeamCheckoutSession');
      const { data } = await createSession({ seats, interval });

      window.location.href = data.url;
    });

    // Update total price
    document.getElementById('seats').addEventListener('input', (e) => {
      const seats = parseInt(e.target.value);
      const price = seats * 8;
      document.getElementById('totalPrice').textContent = price;
    });
  </script>
</body>
</html>
```

**File: `promptblocker.com/teams/success.html`**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Team Created Successfully!</title>
</head>
<body>
  <div class="success-container">
    <h1>✓ Your Team is Ready!</h1>
    <p>Your team subscription is now active.</p>

    <div class="next-steps">
      <h2>Next Steps:</h2>
      <ol>
        <li>Open the PromptBlocker extension</li>
        <li>Go to Account Settings</li>
        <li>Invite your team members</li>
      </ol>
    </div>

    <a href="#" id="openExtension" class="btn-primary">Open Extension</a>
  </div>

  <script>
    // Get extension ID from URL params
    const params = new URLSearchParams(window.location.search);
    const extensionId = 'gpmmdongkfeimmejkbcnilmacgngnjgi'; // From env

    document.getElementById('openExtension').href = `chrome-extension://${extensionId}/popup-v2.html`;
  </script>
</body>
</html>
```

**File: `promptblocker.com/teams/join/[inviteId].html`** (dynamic route)
```html
<!DOCTYPE html>
<html>
<head>
  <title>Join Team - PromptBlocker</title>
</head>
<body>
  <div class="join-container">
    <h1>You've Been Invited!</h1>
    <p id="teamInfo">Loading...</p>

    <button id="acceptInvite" class="btn-primary">Accept Invitation & Get PRO Access</button>
    <p class="note">You'll need to sign in with Google to accept this invitation</p>
  </div>

  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    import { getAuth, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
    import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';

    const app = initializeApp({ /* config */ });
    const auth = getAuth(app);
    const functions = getFunctions(app);

    const inviteId = window.location.pathname.split('/').pop();

    document.getElementById('acceptInvite').addEventListener('click', async () => {
      // Sign in first if not already
      if (!auth.currentUser) {
        await signInWithPopup(auth, new GoogleAuthProvider());
      }

      // Accept invite
      const acceptInvite = httpsCallable(functions, 'acceptTeamInvite');
      await acceptInvite({ inviteId });

      // Redirect to success
      window.location.href = '/teams/welcome.html';
    });
  </script>
</body>
</html>
```

---

## Testing Checklist

- [ ] Create team with 5 seats
- [ ] Verify admin has PRO access
- [ ] Send invite link
- [ ] Accept invite as different user
- [ ] Verify team member has PRO access
- [ ] Verify Stripe subscription shows correct quantity
- [ ] Try inviting 6th person (should fail)
- [ ] Purchase more seats
- [ ] Remove team member (TODO: implement this)
- [ ] Cancel team subscription
- [ ] Verify all members lose PRO access

---

## What's NOT Included (For Later)

- Admin dashboard (just use extension popup for MVP)
- Email automation (share invite links manually)
- Usage analytics per team
- Bulk CSV import for members
- SSO / SAML
- Central policy management
- Audit logs

---

## Deployment

1. Add environment variables to Firebase Functions
2. Deploy functions: `firebase deploy --only functions`
3. Deploy Netlify pages (already set up)
4. Create Stripe products/prices
5. Test with Stripe test mode first

---

## Revenue Math

5 seats × $8/seat = $40/month per team
10 teams = $400/month
50 teams = $2,000/month
100 teams = $4,000/month

**This is your bridge to enterprise revenue while building enterprise features.**
