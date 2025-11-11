/**
 * Authentication Provider Registry
 * Centralized configuration for all auth providers
 * Makes adding new providers (Apple, GitHub, Microsoft) trivial
 */
export type AuthProviderType = 'google' | 'apple' | 'github' | 'microsoft' | 'email';
export interface AuthProvider {
    id: AuthProviderType;
    name: string;
    icon: string;
    enabled: boolean;
    platformSupport: {
        windows: 'excellent' | 'good' | 'poor';
        mac: 'excellent' | 'good' | 'poor';
        linux: 'excellent' | 'good' | 'poor';
    };
    display: {
        buttonText: string;
        buttonClass: string;
        order: number;
        showOnPlatforms?: ('windows' | 'mac' | 'linux')[];
    };
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
export declare const AUTH_PROVIDERS: Record<AuthProviderType, AuthProvider>;
/**
 * Get enabled auth providers sorted by platform preference
 */
export declare function getAvailableProviders(platform?: 'windows' | 'mac' | 'linux'): AuthProvider[];
/**
 * Detect current platform
 */
export declare function detectPlatform(): 'windows' | 'mac' | 'linux';
/**
 * Get platform-specific guidance message
 */
export declare function getPlatformGuidance(platform?: 'windows' | 'mac' | 'linux'): string;
/**
 * Get provider-specific error guidance
 */
export declare function getProviderErrorGuidance(providerId: AuthProviderType, errorCode?: string): {
    title: string;
    message: string;
    showEmailFallback: boolean;
};
//# sourceMappingURL=authProviders.d.ts.map