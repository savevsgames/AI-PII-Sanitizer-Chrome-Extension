# Authentication Provider Guide

## Overview

Prompt Blocker uses a **registry-based auth provider system** that makes adding new OAuth providers (Apple, GitHub, Microsoft) trivial. All provider configuration is centralized in `src/lib/authProviders.ts`.

## Current Providers

| Provider | Status | Platform Support | Notes |
|----------|--------|------------------|-------|
| **Email/Password** | ✅ Live | Excellent (all platforms) | Fallback option |
| **Google** | ✅ Live | Excellent (Windows/Linux), Poor (Mac) | Popup blocking on Mac |
| **Apple** | 🚧 Configured | Excellent (Mac), Good (Windows/Linux) | Enable in v1.1 - solves Mac issues |
| **GitHub** | 🚧 Configured | Good (Windows/Linux), Poor (Mac) | Enable in v1.1 - developer-focused |
| **Microsoft** | 🚧 Configured | Excellent (Windows), Good (Linux), Poor (Mac) | Optional for v1.2 |

## How the Registry System Works

### 1. Provider Registry (`src/lib/authProviders.ts`)

All providers are defined in one place with complete metadata:

```typescript
export const AUTH_PROVIDERS: Record<AuthProviderType, AuthProvider> = {
  google: {
    id: 'google',
    name: 'Google',
    icon: '🔍',
    enabled: true, // ← Toggle this to enable/disable
    platformSupport: {
      windows: 'excellent',
      mac: 'poor', // Popup blocking issues
      linux: 'good',
    },
    display: {
      buttonText: 'Continue with Google',
      buttonClass: 'btn-google',
      order: 2, // Lower = higher priority
    },
    oauth: {
      clientId: '861822607891-l9ibauv7lhok7eejnml3t403mvhdgf4r.apps.googleusercontent.com',
      scopes: ['email', 'profile'],
    },
  },
  // Apple, GitHub, Microsoft already configured...
};
```

### 2. Platform Detection

The system automatically detects the user's platform and prioritizes providers accordingly:

```typescript
export function getAvailableProviders(platform = detectPlatform()): AuthProvider[] {
  return Object.values(AUTH_PROVIDERS)
    .filter(p => p.enabled) // Only enabled providers
    .filter(p => !p.display.showOnPlatforms || p.display.showOnPlatforms.includes(platform))
    .sort((a, b) => {
      // On Mac, prioritize providers with better Mac support
      if (platform === 'mac') {
        const aMacScore = a.platformSupport.mac === 'excellent' ? 0 :
                         a.platformSupport.mac === 'good' ? 1 : 2;
        const bMacScore = b.platformSupport.mac === 'excellent' ? 0 :
                         b.platformSupport.mac === 'good' ? 1 : 2;
        if (aMacScore !== bMacScore) return aMacScore - bMacScore;
      }
      return a.display.order - b.display.order;
    });
}
```

**Result**:
- **Mac users** see: Email/Password first (excellent support), then Google (poor support)
- **Windows users** see: Google first (excellent support), then Email/Password (fallback)
- **Future**: Apple will be first on Mac (excellent support)

### 3. Error Handling

Provider-specific error messages with actionable guidance:

```typescript
export function getProviderErrorGuidance(
  providerId: AuthProviderType,
  errorCode?: string
): { title: string; message: string; showEmailFallback: boolean } {
  if (errorCode === 'popup-blocked') {
    return {
      title: `${AUTH_PROVIDERS[providerId].name} Sign-In Blocked`,
      message:
        `Your browser blocked the ${AUTH_PROVIDERS[providerId].name} sign-in popup.\n\n` +
        `To fix this:\n` +
        `1. Allow popups for this extension in your browser settings\n` +
        `2. Or use Email/Password sign-in instead (100% reliable)`,
      showEmailFallback: true,
    };
  }
  // ...more error cases
}
```

## Adding a New Provider (Step-by-Step)

### Example: Enabling Apple Sign-In

**Step 1: Enable in Registry** (`src/lib/authProviders.ts:68`)

```typescript
apple: {
  id: 'apple',
  name: 'Apple',
  icon: '🍎',
  enabled: true, // ← Change from false to true
  // ...rest already configured
},
```

**Step 2: Configure Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click **Add new provider** → **Apple**
5. Follow Firebase's Apple Sign-In setup guide
6. Copy the **Service ID** and **Key ID**

**Step 3: Implement Sign-In Handler** (`src/popup/components/authModal.ts`)

Add handler similar to Google Sign-In:

```typescript
async function handleAppleSignIn() {
  const appleSignInBtn = document.getElementById('appleSignInBtn');
  if (!appleSignInBtn) return;

  setLoading(appleSignInBtn, true, 'Signing in...');

  try {
    // Use Firebase Apple provider
    const provider = new firebase.auth.OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;

    if (user) {
      console.log('[Auth] Apple sign-in successful:', user.email);
      hideAuthModal();
      // Auto-refresh UI
    }
  } catch (error: any) {
    console.error('[Auth] Apple sign-in error:', error);
    setLoading(appleSignInBtn, false, 'Sign in with Apple');

    // Use error guidance system
    let errorCode: string | undefined;
    if (error.message?.includes('popup')) {
      errorCode = 'popup-blocked';
    }

    const guidance = getProviderErrorGuidance('apple', errorCode);
    showAuthErrorModal(
      guidance.title,
      guidance.message,
      guidance.showEmailFallback ? switchToEmailPasswordMode : undefined
    );
  }
}
```

**Step 4: Add UI Button** (authModal already auto-generates from registry)

If using manual HTML, add button in `popup.html`:

```html
<button id="appleSignInBtn" class="btn btn-apple">
  🍎 Sign in with Apple
</button>
```

**Step 5: Wire Up Event Listener** (`src/popup/components/authModal.ts`)

```typescript
const appleSignInBtn = document.getElementById('appleSignInBtn');
appleSignInBtn?.addEventListener('click', handleAppleSignIn);
```

**Step 6: Test**

```bash
npm run build:dev
```

Test on:
- ✅ Mac (should have excellent support - no popup blocking)
- ✅ Windows
- ✅ Linux

**Step 7: Update Styles** (if needed) (`src/popup/styles/modal.css`)

```css
.btn-apple {
  background: #000;
  color: #fff;
  border: 1px solid #000;
}

.btn-apple:hover {
  background: #333;
  border-color: #333;
}
```

## Provider Checklist Template

Use this checklist when adding any new provider:

### Configuration Phase
- [ ] Set `enabled: true` in `src/lib/authProviders.ts`
- [ ] Configure provider in Firebase Console
- [ ] Get OAuth credentials (Client ID, Secret, etc.)
- [ ] Add credentials to environment variables (if needed)

### Implementation Phase
- [ ] Implement `handle[Provider]SignIn()` function
- [ ] Add error handling with `getProviderErrorGuidance()`
- [ ] Add UI button (or verify auto-generation works)
- [ ] Wire up event listener
- [ ] Add provider-specific styles

### Testing Phase
- [ ] Test on Windows
- [ ] Test on Mac
- [ ] Test on Linux
- [ ] Test popup blocking scenario
- [ ] Test error cases (network failure, cancelled sign-in)
- [ ] Verify email/password fallback works

### Documentation Phase
- [ ] Update this guide with provider-specific notes
- [ ] Update `README.md` with new provider
- [ ] Add provider to release notes

## Common Issues and Solutions

### Issue: Popup Blocked

**Symptoms**: User clicks sign-in button, nothing happens, or browser shows popup blocked notification

**Solution**: Error modal automatically shows with guidance:
```
Your browser blocked the [Provider] sign-in popup.

To fix this:
1. Allow popups for this extension in your browser settings
2. Or use Email/Password sign-in instead (100% reliable)
```

The error modal includes a **"Use Email/Password Instead"** button that auto-switches to email form.

### Issue: Platform-Specific Auth Failures

**Symptoms**: Works on Windows but not Mac

**Root Cause**: Mac has stricter popup blocking policies

**Solution**: Platform detection automatically shows guidance message:

```
macOS users: Email/Password sign-in is recommended for best compatibility.
```

**Long-term Solution**: Add Apple Sign-In (excellent Mac support, no popup issues)

### Issue: Firebase Configuration Missing

**Symptoms**: `auth/configuration-not-found` error

**Solution**:
1. Verify provider is enabled in Firebase Console
2. Check that OAuth credentials are correct
3. Ensure redirect URIs are whitelisted

## Platform Support Matrix

| Provider | Windows | Mac | Linux | Notes |
|----------|---------|-----|-------|-------|
| **Email/Password** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Always works |
| **Google** | ⭐⭐⭐ | ⭐ | ⭐⭐ | Mac popup blocking issues |
| **Apple** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | Best for Mac users |
| **GitHub** | ⭐⭐ | ⭐ | ⭐⭐ | Developer-focused |
| **Microsoft** | ⭐⭐⭐ | ⭐ | ⭐⭐ | Best for enterprise |

**Legend**:
- ⭐⭐⭐ Excellent: No issues, recommended
- ⭐⭐ Good: Works reliably, minor quirks
- ⭐ Poor: Popup blocking or compatibility issues

## Design Philosophy

The registry system follows these principles:

1. **Centralized Configuration**: All provider metadata in one file
2. **Platform-Aware UX**: Automatically adapt UI based on user's OS
3. **Graceful Degradation**: Always offer email/password fallback
4. **Scalability**: Adding new provider = 5 lines of config + handler
5. **User Guidance**: Clear error messages with actionable solutions

## Future Enhancements

### Phase 2 (v1.1)
- [ ] Enable Apple Sign-In (solves Mac popup issues)
- [ ] Enable GitHub Sign-In (developer audience)
- [ ] A/B test provider ordering on different platforms

### Phase 3 (v1.2)
- [ ] Optional: Microsoft Sign-In (enterprise users)
- [ ] Optional: LinkedIn Sign-In (professional network)
- [ ] Analytics: Track which providers users prefer

### Phase 4 (v2.0)
- [ ] Dynamic provider rendering (auto-generate buttons from registry)
- [ ] User preference memory (remember last used provider)
- [ ] Multi-account support (switch between accounts)

## Questions?

If you're implementing a new provider and get stuck, refer to:
- `src/lib/authProviders.ts` - Provider registry
- `src/popup/components/authModal.ts:257-280` - Google Sign-In implementation
- `src/popup/components/errorModal.ts` - Error modal system
- Firebase Auth docs: https://firebase.google.com/docs/auth/web/start

## Quick Reference

**Enable a provider**:
```typescript
// src/lib/authProviders.ts
apple: { enabled: true } // Change to true
```

**Show error modal**:
```typescript
import { showAuthErrorModal } from './errorModal';
import { getProviderErrorGuidance } from '../../lib/authProviders';

const guidance = getProviderErrorGuidance('apple', 'popup-blocked');
showAuthErrorModal(guidance.title, guidance.message, switchToEmailPasswordMode);
```

**Detect platform**:
```typescript
import { detectPlatform, getAvailableProviders } from '../../lib/authProviders';

const platform = detectPlatform(); // 'windows' | 'mac' | 'linux'
const providers = getAvailableProviders(platform); // Auto-sorted by platform preference
```

---

**Last Updated**: 2025-11-09
**Phase**: 1 (UX Improvements Complete)
**Next**: Enable Apple Sign-In in Phase 2
