# PRO Feature Gating Audit Report

**Date:** November 6, 2025
**Status:** 🔴 CRITICAL GAPS FOUND
**Priority:** P0 - Must fix before production launch

---

## Executive Summary

The Stripe integration is working perfectly, BUT we have critical revenue protection gaps:

### 🔴 Critical Issues Found:
1. **Profile creation has NO limit** - FREE users can create unlimited profiles (should be 5)
2. **Custom rules accessible to FREE** - Set to 'free' tier for testing, never changed back
3. **Template limit inconsistency** - Code says 3, config says 10, docs say 5
4. **No downgrade migration** - When PRO cancels, excess data not cleaned up

### ✅ What's Working:
- API Key Vault limits (10 for FREE, unlimited for PRO)
- Quick Alias Generator bulk/themes (PRO only)
- Template creation limits (partially - wrong number)

---

## Tier Limits (As Documented)

### FREE Tier
- ✅ 5 alias profiles max
- ⚠️ 5 prompt templates max (code shows 3, config shows 10)
- ✅ API Key Vault: 10 keys, OpenAI only
- ✅ Quick Alias: Single generation, basic templates only
- ✅ **Backgrounds: 6 backgrounds** (theme defaults + 4 nature scenes)
- ✅ **BG Transparency slider** (0-100%)
- ✅ **Blur effect toggle**

### PRO Tier ($4.99/month or $49/year)
- ✅ Unlimited alias profiles
- ✅ Unlimited prompt templates
- ✅ Quick Alias Generator: Bulk (2-10), PRO themes
- ✅ Custom redaction rules
- ✅ API Key Vault: Unlimited keys, all patterns
- ✅ **Backgrounds: 14 total** (6 free + 8 PRO backgrounds)
- ✅ **Custom background upload** (500KB limit)

---

## Detailed Audit Results

### ✅ CORRECTLY GATED FEATURES

#### 1. API Key Vault Limits
**File:** `src/lib/storage.ts:555-580`
**Status:** ✅ WORKING

```typescript
// FREE tier: 10 keys max, OpenAI only
const isFree = config.account?.tier === 'free';
if (isFree) {
  if (currentKeyCount >= 10) {
    throw new Error('FREE_TIER_LIMIT: Upgrade to PRO for unlimited keys');
  }
  if (format !== 'openai') {
    throw new Error('FREE_TIER_PATTERN: Upgrade to PRO for non-OpenAI key detection');
  }
}
```

**Test Status:** ✅ Confirmed working

---

#### 2. Quick Alias Generator - Bulk & Themes
**Files:**
- `src/popup/components/featuresTab.ts:34` - Shows as FREE
- `src/popup/components/quickAliasGenerator.ts:87-125` - Bulk generation locked

**Status:** ✅ WORKING (with notes)

**What's gated:**
- Bulk generation (2-10 profiles) - PRO only ✅
- PRO templates (fantasy, vintage, coder) - Locked with upgrade prompt ✅

**What's FREE:**
- Single profile generation ✅
- Basic templates (professional, casual) ✅

**Note:** Quick Alias feature card shows tier='free' but bulk features are gated in the modal.

---

#### 3. Prompt Templates Limit
**File:** `src/lib/storage.ts:872-889`
**Status:** ⚠️ WORKING BUT INCONSISTENT

```typescript
// Check if limit reached (for FREE tier)
if (config.promptTemplates!.maxTemplates !== -1 &&
    config.promptTemplates!.templates.length >= config.promptTemplates!.maxTemplates) {
  throw new Error(`Template limit reached. FREE tier allows ${config.promptTemplates!.maxTemplates} templates.`);
}
```

**DISCREPANCY:**
- Code logic: `maxTemplates: 3` (line 863)
- Default config: `maxTemplates: 10` (line 1044)
- Documentation: 5 templates for FREE
- **Decision needed:** Standardize on 5 templates

---

#### 4. Background Customization
**File:** `src/popup/components/backgroundManager.ts`
**Status:** ✅ WORKING

```typescript
// PRO backgrounds gated by tier check
const availableBackgrounds = getAvailableBackgrounds(userTier);

// In backgrounds.ts:
export function getAvailableBackgrounds(tier: TierLevel): Background[] {
  if (tier === 'pro') {
    return BACKGROUNDS; // All 14 backgrounds
  }
  // Free tier: Only backgrounds without PRO flag
  return BACKGROUNDS.filter(bg => !bg.tier || bg.tier === 'free');
}

// Custom upload gated in UI
if (userTier !== 'pro') {
  showUpgradePrompt();
  return;
}
```

**What's gated:**
- PRO backgrounds (8) - Locked with 🔒 badge + upgrade prompt ✅
- Custom background upload - Button hidden for FREE users ✅

**What's FREE:**
- 6 free backgrounds (2 theme defaults + 4 nature scenes) ✅
- BG transparency slider (0-100%) ✅
- Blur effect toggle ✅
- Bidirectional theme/background sync ✅

**Test Status:** ✅ Confirmed working
- Free users see 6 unlocked + 8 locked backgrounds
- Locked backgrounds show 🔒 PRO badge
- Clicking locked background shows upgrade prompt
- Custom upload section hidden for free users
- PRO users see all 14 backgrounds + upload button

---

### ❌ UNGATED FEATURES (CRITICAL GAPS)

#### 1. Profile Creation - NO LIMITS ❌❌❌
**Priority:** 🔴 CRITICAL
**Impact:** FREE users can create unlimited profiles (unlimited PRO value for free)

**Files checked:**
- `src/lib/store.ts:92-101` - addProfile method
- `src/lib/storage.ts:180-241` - createProfile method
- `src/popup/components/profileModal.ts:281-330` - saveProfile method

**Problem:** No tier check exists before creating profiles!

**Fix needed:** Add check in `src/lib/storage.ts` after line 187:

```typescript
async createProfile(profileData: {...}): Promise<AliasProfile> {
  const profiles = await this.loadProfiles();

  // ADD THIS CHECK:
  const config = await this.loadConfig();
  const isFree = config?.account?.tier === 'free';
  if (isFree && profiles.length >= 5) {
    throw new Error('FREE_TIER_LIMIT: You can only create 5 profiles on the FREE tier. Upgrade to PRO for unlimited profiles.');
  }

  const newProfile: AliasProfile = { ... };
  // ... rest of method
}
```

**User experience needed:**
- Show error modal: "You've reached the limit of 5 profiles (FREE tier)"
- Show upgrade button in the error modal
- Prevent "New Profile" button from working when at limit

---

#### 2. Custom Redaction Rules - Set to FREE ❌❌
**Priority:** 🔴 CRITICAL
**Impact:** PRO feature available to all users for free

**Files:**
- `src/popup/components/featuresTab.ts:52` - Shows tier='free'
- `src/lib/storage.ts:724-760` - No tier check in addCustomRule()

**Problem 1:** Feature card shows `tier: 'free'` with TODO comment:

```typescript
{
  id: 'custom-rules',
  name: 'Custom Redaction Rules',
  tier: 'free', // TODO: Change back to 'pro' after testing
  status: 'active',
}
```

**Problem 2:** No enforcement in the code - anyone can create rules!

**Fix #1:** Change tier in `featuresTab.ts:52`:
```typescript
tier: 'pro', // Changed back from testing
```

**Fix #2:** Add enforcement in `storage.ts` after line 738:

```typescript
async addCustomRule(ruleData: {...}): Promise<string> {
  const config = await this.loadConfig();
  await this.ensureCustomRulesConfig(config);

  // ADD THIS CHECK:
  const isFree = config.account?.tier === 'free';
  if (isFree) {
    throw new Error('PRO_FEATURE: Custom redaction rules are a PRO feature. Upgrade to PRO to create custom rules.');
  }

  const ruleId = crypto.randomUUID();
  // ... rest of method
}
```

---

#### 3. Downgrade Data Migration - NOT IMPLEMENTED ❌
**Priority:** 🟡 HIGH
**Impact:** PRO users who cancel still have unlimited profiles/templates

**Documentation:** `docs/user-management/USER_MANAGEMENT.md:243-302`
**Reality:** Function `handleDowngrade()` is documented but doesn't exist

**When needed:**
- User cancels PRO subscription → tier changes from 'pro' to 'free'
- Webhook handler updates Firestore tier
- Extension needs to clean up excess data

**What should happen:**
1. Limit profiles to 5 (keep most recent, disable rest)
2. Limit templates to 5 (keep most recent, disable rest)
3. Show notification: "Your subscription was cancelled. Some profiles/templates are now disabled."

**Where to implement:**
Create new file: `src/lib/tierMigration.ts`

```typescript
export async function handleDowngrade(userId: string): Promise<void> {
  const storage = StorageManager.getInstance();

  // 1. Get all profiles
  const profiles = await storage.loadProfiles();

  if (profiles.length > 5) {
    // Keep 5 most recently used
    profiles.sort((a, b) => b.lastUsed - a.lastUsed);
    const toDisable = profiles.slice(5);

    for (const profile of toDisable) {
      await storage.updateProfile(profile.id, {
        enabled: false,
        disabledReason: 'FREE_TIER_LIMIT'
      });
    }
  }

  // 2. Get all templates
  const templates = await storage.loadPromptTemplates();

  if (templates.length > 5) {
    // Keep 5 most recently used
    templates.sort((a, b) => b.lastUsed - a.lastUsed);
    const toDisable = templates.slice(5);

    for (const template of toDisable) {
      await storage.updatePromptTemplate(template.id, {
        enabled: false,
        disabledReason: 'FREE_TIER_LIMIT'
      });
    }
  }
}
```

**Call from:** Real-time tier listener in `userProfile.ts`:

```typescript
unsubscribeTierListener = listenToUserTier(user.uid, async (tier) => {
  const previousTier = store.config?.account?.tier;

  // Update store
  await store.updateAccount({ tier });

  // Handle downgrade
  if (previousTier === 'pro' && tier === 'free') {
    await handleDowngrade(user.uid);
    console.log('⬇️ Downgraded to FREE - data migration complete');
  }

  // Update UI
  updateTierBadge();
});
```

---

## Template Limit Discrepancy Analysis

**Found in codebase:**

| Location | Value | Line |
|----------|-------|------|
| `storage.ts` tier check logic | 3 templates | 863 |
| `storage.ts` default config | 10 templates | 1044 |
| `docs/stripe/STRIPE_INTEGRATION.md` | 5 templates | 46 |
| `docs/user-management/USER_MANAGEMENT.md` | Not specified | - |

**Recommendation:** Standardize on **5 templates** for FREE tier to match Stripe docs.

**Changes needed:**
1. `storage.ts:863` - Change from 3 to 5
2. `storage.ts:1044` - Change from 10 to 5
3. Update error messages to say "5 templates"

---

## Implementation Priority

### 🔴 P0 - Before ANY Production Launch
1. **Add profile creation limit** (5 for FREE)
2. **Change custom rules back to PRO-only**
3. **Add custom rules enforcement code**
4. **Fix template limit to 5** (resolve discrepancy)

**Estimated time:** 2-3 hours

### 🟡 P1 - Before First Real Users
5. **Implement downgrade data migration**
6. **Add upgrade prompts when hitting limits**
7. **Test all tier gates with FREE account**

**Estimated time:** 3-4 hours

### 🟢 P2 - Polish
8. **Better error messages for tier limits**
9. **UI shows disabled profiles/templates after downgrade**
10. **Analytics tracking for upgrade friction points**

---

## Testing Checklist

### FREE Tier Testing
- [ ] Create 5 profiles → Should succeed
- [ ] Try to create 6th profile → Should block with upgrade prompt
- [ ] Create 5 templates → Should succeed
- [ ] Try to create 6th template → Should block with upgrade prompt
- [ ] Try to access custom rules → Should show PRO badge and lock
- [ ] Add 10 API keys (OpenAI) → Should succeed
- [ ] Try to add 11th key → Should block
- [ ] Try to add non-OpenAI key → Should block

### PRO Tier Testing
- [ ] Create 10+ profiles → Should succeed
- [ ] Create 10+ templates → Should succeed
- [ ] Access custom rules → Should work
- [ ] Add 20+ API keys → Should succeed
- [ ] Add non-OpenAI keys → Should succeed
- [ ] Use bulk alias generator → Should work

### Downgrade Testing
- [ ] PRO user with 20 profiles cancels → Only 5 remain enabled
- [ ] PRO user with 15 templates cancels → Only 5 remain enabled
- [ ] Extension shows notification about disabled items
- [ ] User can re-enable by upgrading again

---

## Code Locations Summary

### Files That Need Changes:

1. **`src/lib/storage.ts`**
   - Line ~187: Add profile creation limit check
   - Line ~738: Add custom rules tier check
   - Line 863: Change template limit from 3 to 5
   - Line 1044: Change default maxTemplates from 10 to 5

2. **`src/popup/components/featuresTab.ts`**
   - Line 52: Change `tier: 'free'` to `tier: 'pro'` for custom rules

3. **`src/lib/tierMigration.ts`** (NEW FILE)
   - Create downgrade handler function
   - Export handleDowngrade()

4. **`src/popup/components/userProfile.ts`**
   - Line ~132-145: Call handleDowngrade() when tier changes from pro to free

### Files That Are Correct:
- ✅ `src/lib/storage.ts` - API key vault limits working
- ✅ `src/popup/components/quickAliasGenerator.ts` - Bulk generation gated
- ✅ `src/lib/storage.ts` - Template limit logic working (just wrong number)

---

## Recommendations

### Immediate Actions (Today):
1. Add profile creation limit check - **15 minutes**
2. Change custom rules to PRO and add enforcement - **20 minutes**
3. Fix template limit to 5 templates - **10 minutes**
4. Test with FREE account - **30 minutes**

**Total: ~1.5 hours to close critical gaps**

### This Week:
5. Implement downgrade migration - **2 hours**
6. Add upgrade prompts/modals - **2 hours**
7. Comprehensive tier testing - **1 hour**

**Total: ~5 hours additional work**

### Next Week:
8. Polish error messages
9. Analytics tracking
10. User feedback on tier limits

---

## Revenue Impact

**Current state:** Users can get unlimited profiles (PRO feature) for free
**Lost revenue:** Every FREE user who needs >5 profiles should be paying $4.99/month

**After fixes:**
- Users hit limit at 5 profiles
- Clear upgrade path shown
- PRO features actually require PRO tier

**Estimated conversion improvement:** 30-50% of users who hit limits will upgrade

---

## Next Steps

1. **Review this audit** with team
2. **Prioritize fixes** based on launch timeline
3. **Implement P0 changes** (profile limit, custom rules, template fix)
4. **Test thoroughly** with FREE account
5. **Deploy** with confidence that revenue is protected

---

**Questions? Check:**
- `docs/stripe/STRIPE_INTEGRATION.md` - Payment flow
- `docs/user-management/USER_MANAGEMENT.md` - Tier management
- `docs/stripe/STRIPE_NEXT_STEPS.md` - Overall roadmap
