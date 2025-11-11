/**
 * Application Constants
 * Centralized configuration for external URLs and social links
 */

// Social & Community Links
export const SOCIAL_LINKS = {
  discord: {
    url: process.env.DISCORD_URL || 'https://discord.gg/hztcJDjsqF',
    label: 'Discord',
    icon: '💬',
    ariaLabel: 'Join our Discord community',
  },
  twitter: {
    url: process.env.TWITTER_URL || 'https://twitter.com/promptblocker',
    label: 'Twitter',
    icon: '🐦',
    ariaLabel: 'Follow us on Twitter',
  },
  github: {
    url: process.env.GITHUB_URL || 'https://github.com/promptblocker',
    label: 'GitHub',
    icon: '🐙',
    ariaLabel: 'Star us on GitHub',
  },
} as const;

// Main Website
export const WEBSITE_URL = process.env.WEBSITE_URL || 'https://promptblocker.com';

// Protected Service URLs (for "Visit" links in Settings)
export const SERVICE_URLS = {
  chatgpt: 'https://chatgpt.com',
  claude: 'https://claude.ai',
  gemini: 'https://gemini.google.com',
  perplexity: 'https://www.perplexity.ai',
  copilot: 'https://copilot.microsoft.com',
} as const;

// Type exports for TypeScript safety
export type SocialPlatform = keyof typeof SOCIAL_LINKS;
export type ServiceName = keyof typeof SERVICE_URLS;
