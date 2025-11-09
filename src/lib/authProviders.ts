/**
 * Authentication Provider Registry
 * Centralized configuration for all auth providers
 * Makes adding new providers (Apple, GitHub, Microsoft) trivial
 */

export type AuthProviderType = 'google' | 'apple' | 'github' | 'microsoft' | 'email';

export interface AuthProvider {
  id: AuthProviderType;
  name: string;
  icon: string; // Emoji or icon class
  enabled: boolean;

  // Platform compatibility
  platformSupport: {
    windows: 'excellent' | 'good' | 'poor';
    mac: 'excellent' | 'good' | 'poor';
    linux: 'excellent' | 'good' | 'poor';
  };

  // Display configuration
  display: {
    buttonText: string;
    buttonClass: string;
    order: number; // Lower = higher priority
    showOnPlatforms?: ('windows' | 'mac' | 'linux')[]; // Omit to show on all
  };

  // OAuth configuration (for future providers)
  oauth?: {
    clientId?: string;
    scopes?: string[];
    authUrl?: string;
  };
}

/**
 * Auth Provider Registry
 * Add new providers here - they'll automatically appear in the UI
 */
export const AUTH_PROVIDERS: Record<AuthProviderType, AuthProvider> = {
  google: {
    id: 'google',
    name: 'Google',
    icon: '🔍',
    enabled: true,
    platformSupport: {
      windows: 'excellent',
      mac: 'poor', // Popup blocking issues
      linux: 'good',
    },
    display: {
      buttonText: 'Continue with Google',
      buttonClass: 'btn-google',
      order: 2, // Second choice on Mac, first on Windows
    },
    oauth: {
      clientId: '861822607891-l9ibauv7lhok7eejnml3t403mvhdgf4r.apps.googleusercontent.com',
      scopes: ['email', 'profile'],
    },
  },

  apple: {
    id: 'apple',
    name: 'Apple',
    icon: '🍎',
    enabled: false, // TODO: Enable in v1.1 (Phase 2)
    platformSupport: {
      windows: 'good',
      mac: 'excellent', // Native integration, no popup issues
      linux: 'good',
    },
    display: {
      buttonText: 'Sign in with Apple',
      buttonClass: 'btn-apple',
      order: 1, // First choice on Mac
      showOnPlatforms: ['mac', 'windows', 'linux'], // Show on all when enabled
    },
  },

  github: {
    id: 'github',
    name: 'GitHub',
    icon: '💻',
    enabled: true, // ✅ Enabled with Cloud Function backend
    platformSupport: {
      windows: 'good',
      mac: 'poor', // Same popup issues as Google
      linux: 'good',
    },
    display: {
      buttonText: 'Continue with GitHub',
      buttonClass: 'btn-github',
      order: 3, // Third choice (developer-focused)
    },
    oauth: {
      clientId: 'Ov23li8pSP8uzrl6DN7A', // GitHub OAuth App Client ID
      scopes: ['user:email', 'read:user'],
    },
  },

  microsoft: {
    id: 'microsoft',
    name: 'Microsoft',
    icon: '🪟',
    enabled: false, // TODO: Enable in v1.2 (optional)
    platformSupport: {
      windows: 'excellent',
      mac: 'poor',
      linux: 'good',
    },
    display: {
      buttonText: 'Continue with Microsoft',
      buttonClass: 'btn-microsoft',
      order: 4,
    },
  },

  email: {
    id: 'email',
    name: 'Email/Password',
    icon: '📧',
    enabled: true,
    platformSupport: {
      windows: 'excellent',
      mac: 'excellent', // Always works
      linux: 'excellent',
    },
    display: {
      buttonText: 'Sign in with Email',
      buttonClass: 'btn-email',
      order: 99, // Always last (fallback option)
    },
  },
};

/**
 * Get enabled auth providers sorted by platform preference
 */
export function getAvailableProviders(platform: 'windows' | 'mac' | 'linux' = detectPlatform()): AuthProvider[] {
  return Object.values(AUTH_PROVIDERS)
    .filter(p => p.enabled)
    .filter(p => !p.display.showOnPlatforms || p.display.showOnPlatforms.includes(platform))
    .sort((a, b) => {
      // On Mac, prioritize providers with better Mac support
      if (platform === 'mac') {
        const aMacScore = a.platformSupport.mac === 'excellent' ? 0 : a.platformSupport.mac === 'good' ? 1 : 2;
        const bMacScore = b.platformSupport.mac === 'excellent' ? 0 : b.platformSupport.mac === 'good' ? 1 : 2;
        if (aMacScore !== bMacScore) return aMacScore - bMacScore;
      }

      // Otherwise sort by display order
      return a.display.order - b.display.order;
    });
}

/**
 * Detect current platform
 */
export function detectPlatform(): 'windows' | 'mac' | 'linux' {
  const platform = navigator.platform.toUpperCase();
  if (platform.indexOf('MAC') >= 0) return 'mac';
  if (platform.indexOf('WIN') >= 0) return 'windows';
  return 'linux';
}

/**
 * Get platform-specific guidance message
 */
export function getPlatformGuidance(platform: 'windows' | 'mac' | 'linux' = detectPlatform()): string {
  switch (platform) {
    case 'mac':
      return 'macOS users: Email/Password sign-in is recommended for best compatibility.';
    case 'windows':
      return '';
    case 'linux':
      return '';
    default:
      return '';
  }
}

/**
 * Get provider-specific error guidance
 */
export function getProviderErrorGuidance(
  providerId: AuthProviderType,
  errorCode?: string
): { title: string; message: string; showEmailFallback: boolean } {
  if (errorCode === 'popup-blocked' || errorCode === 'popup-closed-by-user') {
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

  if (errorCode === 'auth/cancelled-popup-request') {
    return {
      title: 'Sign-In Cancelled',
      message: `${AUTH_PROVIDERS[providerId].name} sign-in was cancelled. Please try again or use Email/Password.`,
      showEmailFallback: true,
    };
  }

  return {
    title: 'Sign-In Failed',
    message: `${AUTH_PROVIDERS[providerId].name} sign-in is temporarily unavailable. Please use Email/Password instead.`,
    showEmailFallback: true,
  };
}
