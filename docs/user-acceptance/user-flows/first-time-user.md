# User Flow: First-Time User

**Flow Name:** New User Onboarding
**Priority:** 🔥 CRITICAL (Most common path)
**Estimated Duration:** 5-10 minutes
**Success Rate Goal:** >90% completion

---

## Overview

This flow documents the experience of a user installing Prompt Blocker for the first time and setting up their first profile.

**User Persona:**
- Name: Alex (Privacy-conscious professional)
- Goal: Protect personal info when using AI assistants
- Tech Savvy: Medium
- Motivation: Saw privacy concerns online, wants protection

---

## Flow Diagram

```
Install Extension
  ↓
First Visit to AI Service
  ↓
See Badge (RED/YELLOW - not protected)
  ↓
Click Extension Icon
  ↓
See "No Profiles" Message
  ↓
Click "Sign In"
  ↓
Choose Auth Provider (Google/GitHub)
  ↓
Complete OAuth
  ↓
Return to Popup
  ↓
Click "Create Profile"
  ↓
Fill in PII + Aliases
  ↓
Save Profile
  ↓
Badge Turns GREEN
  ↓
Test Substitution
  ↓
SUCCESS!
```

---

## Step-by-Step Experience

### Step 1: Discovery & Installation
**User Action:** Searches "AI privacy extension" → Finds Prompt Blocker

**Touchpoints:**
- Chrome Web Store listing
- Reviews and ratings
- Screenshots
- Description

**User Thoughts:**
> "This looks promising. 4.5 stars, good reviews. Let me try it."

**Action:** Clicks "Add to Chrome" → Confirms installation

**Expected Outcome:**
- Extension installed successfully
- Icon appears in Chrome toolbar
- Welcome notification (optional)

**Red Flags:**
- ❌ Installation fails
- ❌ No visible icon
- ❌ Intrusive welcome screen

---

### Step 2: First Visit to AI Service
**User Action:** Opens ChatGPT (already had tab open OR opens new tab)

**Expected Experience:**
- Badge appears (RED ! or YELLOW ?)
- Tooltip: "Not Protected - Click to configure"
- NO green badge (this would be false!)

**User Thoughts:**
> "Red badge? I guess I need to set something up. Let me click it."

**Critical Success Factor:**
- ✅ Badge clearly indicates NOT protected
- ✅ Badge is visible and actionable
- ✅ User understands action needed

**Failure Mode (Bug):**
- 🔴 Badge shows GREEN → User thinks "Great, it's working!" → Skips setup → PII leaked

---

### Step 3: Opening Extension Popup
**User Action:** Clicks extension icon in toolbar

**Expected UI:**
```
┌─────────────────────────────────────┐
│ 🔴 Not Protected                   │ ← Status indicator
├─────────────────────────────────────┤
│ Tabs: Aliases | Stats | Settings   │
├─────────────────────────────────────┤
│ 📝 No profiles configured           │
│                                     │
│  You need to create a profile to    │
│  protect your personal information. │
│                                     │
│  [Sign In to Get Started]           │ ← Primary CTA
│                                     │
│  💡 Profiles contain your real PII  │
│     and aliases for substitution    │
└─────────────────────────────────────┘
```

**User Thoughts:**
> "Okay, I need to sign in first. Makes sense for security."

**Critical Success Factors:**
- ✅ Clear "not protected" message
- ✅ Obvious "Sign In" button
- ✅ Brief explanation of what profiles are
- ✅ NO green status indicator

**Failure Modes:**
- ❌ Unclear what action to take
- ❌ "Sign In" button hidden or unclear
- ❌ Too much text (user skips reading)
- ❌ Contradictory signals (red badge but "working" message)

---

### Step 4: Authentication
**User Action:** Clicks "Sign In" → Popup opens with auth options

**Expected Auth Modal:**
```
┌─────────────────────────────────────┐
│ Sign In to Prompt Blocker           │
├─────────────────────────────────────┤
│ Choose your sign-in method:         │
│                                     │
│ [Continue with Google]   🔐         │
│ [Continue with GitHub]   🔐         │
│                                     │
│ ─────── OR ───────                  │
│                                     │
│ Email: _______________              │
│ Password: ___________              │
│ [Sign In] [Create Account]          │
│                                     │
│ 🔒 Your data is encrypted with      │
│    your chosen provider's UID       │
└─────────────────────────────────────┘
```

**User Choice:** Selects "Continue with Google" (most common)

**OAuth Flow:**
1. Popup window opens → Google sign-in
2. User authorizes Prompt Blocker
3. Popup closes → Returns to extension

**User Thoughts:**
> "I'll use Google since I'm already signed in."

**Expected Outcome:**
- User signed in successfully
- Popup shows signed-in state (email, profile picture)
- "Create Profile" button now available

**Failure Modes:**
- ❌ OAuth popup blocked (browser settings)
- ❌ Auth fails (network issue)
- ❌ Confusing redirect flow
- ❌ User closes popup accidentally

---

### Step 5: Profile Creation Prompt
**User Action:** Returns to popup after auth

**Expected UI:**
```
┌─────────────────────────────────────┐
│ 🔴 Not Protected                    │ ← Still red (no profiles yet)
│ alex@gmail.com 👤                   │ ← Signed in
├─────────────────────────────────────┤
│ Tabs: Aliases | Stats | Settings    │
├─────────────────────────────────────┤
│ 🎉 Welcome, Alex!                   │
│                                     │
│ You're signed in. Now create your   │
│ first profile to start protecting   │
│ your personal information.          │
│                                     │
│ [Create Your First Profile]         │ ← Primary CTA
│                                     │
│ 💡 Tip: Start with your name and    │
│    email. You can add more later.   │
└─────────────────────────────────────┘
```

**User Thoughts:**
> "Alright, let's create a profile. What do I put?"

**Critical Success Factors:**
- ✅ Clear next step (create profile)
- ✅ Friendly welcome message
- ✅ Quick tip to guide user
- ✅ Status still shows "not protected" (accurate)

---

### Step 6: Creating First Profile
**User Action:** Clicks "Create Your First Profile" → Profile modal opens

**Expected Profile Form:**
```
┌─────────────────────────────────────┐
│ Create Profile                      │
│                                 [✕] │
├─────────────────────────────────────┤
│ Real Information (Will be hidden)   │
│ ───────────────────────────────────│
│ Name:  [Alex Johnson___________]    │
│ Email: [alex@gmail.com_________]    │
│ Phone: [555-0123_______________]    │
│                                     │
│ Aliases (Will be shown instead)     │
│ ───────────────────────────────────│
│ Name:  [Phoenix Thunder________]    │
│ Email: [phantom@temp.mail______]    │
│ Phone: [555-9999_______________]    │
│                                     │
│ [✅] Enable this profile            │
│                                     │
│ [Cancel]  [Save Profile]            │
└─────────────────────────────────────┘
```

**User Flow:**
1. Types real name: "Alex Johnson"
2. Types real email: "alex@gmail.com"
3. Types real phone: "555-0123"
4. Types alias name: "Phoenix Thunder" (thinks of cool name)
5. Types alias email: "phantom@temp.mail"
6. Types alias phone: "555-9999"
7. Toggles "Enable this profile" ON (if not default)
8. Clicks "Save Profile"

**User Thoughts During Form:**
> "Okay, this makes sense. Real info on the left, fake info on the right. Phoenix Thunder sounds cool!"

**Expected Outcome:**
- Profile saved successfully
- Modal closes
- Profile appears in Aliases tab
- Badge turns GREEN ✓

**Failure Modes:**
- ❌ Unclear which field is real vs alias
- ❌ Validation errors (no guidance)
- ❌ Save fails (no error message)
- ❌ Form too long (user abandons)

---

### Step 7: First Successful Protection
**User Action:** Profile saved → Returns to ChatGPT tab

**Expected Experience:**
1. Badge changes from RED/YELLOW → GREEN ✓
2. Tooltip: "Protected ✓ - 1 profile active"
3. User sees green badge and feels secure

**User Thoughts:**
> "Great! Green badge means it's working now."

**User Action:** Types message in ChatGPT to test

**Test Message:** "My name is Alex Johnson and my email is alex@gmail.com"

**Expected Substitution:**
- "Alex Johnson" turns RED → changes to "Phoenix Thunder"
- "alex@gmail.com" turns RED → changes to "phantom@temp.mail"
- User sees real-time substitution

**User Reaction:**
> "😮 Wow! It's actually working! My real info is being replaced!"

**Critical Success Factors:**
- ✅ Badge turns green immediately (no delay)
- ✅ Substitution happens in real-time
- ✅ Visual feedback (red highlight) shows what changed
- ✅ User feels confident and secure

---

### Step 8: Confidence Check
**User Action:** Sends message to ChatGPT → Reads response

**ChatGPT Response:**
> "Hello Phoenix Thunder! I've noted your email as phantom@temp.mail..."

**User Thoughts:**
> "🎉 Perfect! ChatGPT thinks my name is Phoenix Thunder. My real info is safe!"

**User Feels:**
- ✅ Confident the extension works
- ✅ Excited about privacy protection
- ✅ Likely to recommend to friends
- ✅ Ready to explore more features

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Install → First Profile Created | >70% | Analytics tracking |
| Time to First Profile | <5 minutes | Session duration |
| Profile Form Abandonment Rate | <20% | Form analytics |
| First Substitution Success Rate | >95% | Tech validation |
| User Satisfaction (Post-Setup) | >4.5/5.0 | In-app survey |

---

## Drop-Off Points (Where Users Quit)

### Drop-Off 1: No Clear Next Step (25% abandon)
**Problem:** User sees red badge but doesn't know what to do

**Fix:**
- Add tooltip: "Click to configure"
- Show notification: "Set up your first profile"
- Badge pulsing animation (subtle)

---

### Drop-Off 2: Auth Wall (15% abandon)
**Problem:** User doesn't want to create account

**Fix:**
- Explain WHY sign-in required (encryption, sync)
- Offer multiple auth options (Google, GitHub, Email)
- "Your data stays private" reassurance

---

### Drop-Off 3: Profile Form Too Complex (30% abandon)
**Problem:** User overwhelmed by form fields

**Fix:**
- Start with Name + Email only (minimum viable)
- Add "Add More Fields" button for phone, etc.
- Show example aliases ("Need ideas?")
- Add "Quick Start" template

---

### Drop-Off 4: No Immediate Feedback (10% abandon)
**Problem:** User creates profile but doesn't see it working

**Fix:**
- Badge changes to green immediately
- Show toast: "Profile created! Try typing in ChatGPT"
- In-app tutorial overlay (optional)

---

## Optimization Ideas

### Onboarding Checklist
Show checklist in popup:
```
Getting Started:
✅ Sign in (Complete!)
✅ Create first profile (Complete!)
⬜ Test substitution (Click here to test)
⬜ Explore custom rules
⬜ Try prompt templates
```

### Interactive Tutorial
After first profile created:
1. Overlay highlights ChatGPT input box
2. Tooltip: "Type your real name here to test"
3. User types → Sees substitution
4. ✅ Tutorial complete

### Pre-filled Example Profile
Offer quick start:
```
[Quick Start: Use Example Profile]

This will create a sample profile so you
can see how it works. You can edit later.

Real Name: John Doe
Alias: Phoenix Thunder

[Try It Now]  [I'll Create My Own]
```

---

## Related Documents

- **Test Case:** [test-cases/badge-status-flows.md TC1](../test-cases/badge-status-flows.md#test-case-1-first-time-install-no-account)
- **Bug:** [bugs/CRITICAL-001](../bugs/CRITICAL-001-badge-false-positive.md)
- **Architecture:** [architecture/badge-state-management.md](../architecture/badge-state-management.md)

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-11 | v1.0 | Initial first-time user flow | Claude Code |
