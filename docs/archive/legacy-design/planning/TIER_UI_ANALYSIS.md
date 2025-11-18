# FREE/PRO Tier UI Elements - Comprehensive Analysis

Date: November 5, 2025
Thoroughness Level: Medium (UI components and tier-related elements)

---

## 1. EXISTING PRO BADGES/INDICATORS

### 1.1 Tier Badge Component

HTML Locations:
- /src/popup/popup-v2.html (lines 50, 190, 207, 924)

Badge Instances:
- Header tier badge: line 50
- Features tab tier badge: line 190
- Feature detail tier badge: line 207
- Dropdown tier badge: line 924

### 1.2 CSS Styling for Tier Badges

File: /src/popup/styles/auth.css (lines 167-187)

.user-tier-badge {
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-tier-badge.tier-free {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.user-tier-badge.tier-pro {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #78350f;
  border: 1px solid #f59e0b;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
}

File: /src/popup/styles/features.css (lines 17-44)

.tier-badge {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.tier-badge.free {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%);
  color: #059669;
  border: 1px solid rgba(5, 150, 105, 0.2);
}

.tier-badge.pro {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 139, 250, 0.15) 100%));
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

### 1.3 Badge Update Logic

File: /src/popup/components/userProfile.ts (lines 210-229)

Function updateTierBadge() queries all .user-tier-badge and .tier-badge elements
Updates textContent with tier value (FREE/PRO)
Applies CSS class based on tier: tier-free or tier-pro

---

## 2. USER DROPDOWN MENU

### 2.1 HTML Structure

File: /src/popup/popup-v2.html (lines 920-950)

Menu items:
1. Email display with tier badge (header)
2. Get Started (🚀) - Opens promptblocker.com
3. Account Settings (⚙️) - TODO implementation
4. Manage Billing (💳) - TODO implementation
5. Sign Out (🚪) - Shows confirmation modal

### 2.2 Existing Click Handlers

File: /src/popup/components/userProfile.ts

IMPLEMENTED:
- Line 32-40: Sign In button opens auth modal
- Line 46-48: User menu toggle shows/hides dropdown
- Line 64-68: Get Started button opens website
- Line 88-91: Sign Out button shows confirmation

TODO/STUB:
- Line 71-76: Account Settings - just logs to console
- Line 78-84: Manage Billing - just logs to console

### 2.3 CSS Classes

File: /src/popup/styles/auth.css (lines 189-272)

Key classes:
.user-dropdown - Main container, fixed position, dark background (#1a202c)
.user-dropdown-header - Email and tier badge section
.user-dropdown-item - Menu buttons with hover effects
.user-dropdown-signout - Red colored sign out button
.dropdown-icon - Icon styling

### 2.4 Dropdown Trigger

File: /src/popup/popup-v2.html (lines 46-52)

Button with:
- User avatar (hidden by default)
- User initials (shown by default)
- Tier badge
- Gradient background

---

## 3. EXISTING MODAL PATTERNS

### 3.1 Modal Structure

File: /src/popup/styles/modal.css (lines 6-62)

Base structure:
.modal - Fixed overlay with blur
.modal-content - Frosted glass card
.modal-header - Title and close button
.modal-body - Content area with scroll
.modal-footer - Buttons

### 3.2 Existing Modals

authModal (#authModal) - Sign in/Sign up
profileModal (#profileModal) - Create/Edit profile
apiKeyModal (#apiKeyModal) - Add/edit API keys
deleteModal (#deleteModal) - Delete confirmation
signOutModal (#signOutModal) - Sign out confirmation

### 3.3 Form Sections

File: /src/popup/styles/modal.css (lines 131-181)

Three form section styles with color-coded borders:
1. First section - Blue/primary color (left border)
2. Second section - Red/danger color (left border)
3. Third section - Green/success color (left border)

---

## 4. BUTTON PATTERNS

### 4.1 Primary Button

File: /src/popup/styles/buttons.css (lines 23-40)

Indigo gradient: #6366f1 to #8b5cf6
White text
Hover: translateY(-2px) with increased shadow

### 4.2 Secondary Button

File: /src/popup/styles/buttons.css (lines 42-58)

Glass background with blur
Hover: Changes to primary color
Smooth transitions

### 4.3 Base Button

File: /src/popup/styles/buttons.css (lines 6-21)

Pill-shaped: border-radius 20px
Sizes: .btn-sm (6px 14px), .btn-lg (14px 28px)
Display: inline-flex with centered content

### 4.4 Upgrade to PRO Button

File: /src/popup/components/featuresTab.ts (lines 172-173)

Shows when: feature tier is 'pro' AND user is 'free'
Text: "🔒 Upgrade to PRO"
Class: feature-card-action.locked

---

## 5. TIER GATING IN CODE

### 5.1 Account Type Definition

File: /src/lib/types.ts (lines 160-165)

account?: {
  email?: string;
  firebaseUid?: string;
  tier: 'free' | 'pro' | 'enterprise';
  licenseKey?: string;
  lastSyncedAt?: string;
}

### 5.2 Tier Checking Pattern

File: /src/popup/components/featuresTab.ts (lines 114-117)

const isAccessible = feature.tier === 'free' || userTier === 'pro' || userTier === 'enterprise';
const isLocked = feature.status === 'locked' || (!isAccessible && feature.status === 'active');

### 5.3 Feature Definitions

File: /src/popup/components/featuresTab.ts (lines 27-64)

FEATURES array with tier property:
- quick-alias-generator: tier 'free'
- api-key-vault: tier 'free'
- custom-rules: tier 'free' (TODO: Change to 'pro')
- prompt-templates: tier 'free'

### 5.4 Load Tier from Firebase

File: /src/lib/store.ts (lines 222-245)

loadUserTier() function:
Gets firebaseUid from account
Loads tier from Firestore users collection
Updates store with tier value

### 5.5 Update Account

File: /src/lib/store.ts (lines 186-195)

updateAccount() function:
Merges updates with existing account object
Saves to Chrome storage

---

## 6. CSS VARIABLE COLORS

File: /src/popup/styles/variables.css

FREE Tier:
background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%);
color: #059669;

PRO Tier (features tab):
background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 139, 250, 0.15) 100%));
color: #8b5cf6;

PRO Tier (header badge):
background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
color: #78350f;
box-shadow: 0 0 10px rgba(251, 191, 36, 0.3);

---

## 7. WHAT'S BUILT VS WHAT NEEDS WORK

FULLY IMPLEMENTED:
- Tier badge display and styling
- Tier badge updates based on user account
- User dropdown menu structure
- Sign out confirmation modal
- Modal framework and patterns
- Button styles and variants
- Tier checking logic
- Feature tier definitions
- Firebase tier loading

TODO/STUBS:
- Account Settings dropdown item (logs to console)
- Manage Billing dropdown item (logs to console)
- Upgrade CTA handler (shows alert, needs real upgrade flow)
- Some features should be PRO but marked as FREE (custom-rules has TODO)

---

## 8. KEY FILE PATHS

Badges:
/src/popup/popup-v2.html (HTML)
/src/popup/components/userProfile.ts (Logic)
/src/popup/styles/auth.css (Styling)
/src/popup/styles/features.css (Styling)

Dropdown:
/src/popup/popup-v2.html (HTML)
/src/popup/components/userProfile.ts (Logic)
/src/popup/styles/auth.css (Styling)

Modals:
/src/popup/popup-v2.html (HTML)
/src/popup/styles/modal.css (Styling)

Buttons:
/src/popup/styles/buttons.css (Styling)

Tier Logic:
/src/lib/types.ts (Types)
/src/lib/store.ts (Store methods)
/src/popup/components/featuresTab.ts (Feature definitions)

