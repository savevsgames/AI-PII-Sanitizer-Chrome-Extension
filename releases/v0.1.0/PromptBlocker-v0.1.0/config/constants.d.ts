/**
 * Application Constants
 * Centralized configuration for external URLs and social links
 */
export declare const SOCIAL_LINKS: {
    readonly discord: {
        readonly url: string;
        readonly label: "Discord";
        readonly icon: "💬";
        readonly ariaLabel: "Join our Discord community";
    };
    readonly twitter: {
        readonly url: string;
        readonly label: "Twitter";
        readonly icon: "🐦";
        readonly ariaLabel: "Follow us on Twitter";
    };
    readonly github: {
        readonly url: string;
        readonly label: "GitHub";
        readonly icon: "🐙";
        readonly ariaLabel: "Star us on GitHub";
    };
};
export declare const WEBSITE_URL: string;
export declare const SERVICE_URLS: {
    readonly chatgpt: "https://chatgpt.com";
    readonly claude: "https://claude.ai";
    readonly gemini: "https://gemini.google.com";
    readonly perplexity: "https://www.perplexity.ai";
    readonly copilot: "https://copilot.microsoft.com";
};
export type SocialPlatform = keyof typeof SOCIAL_LINKS;
export type ServiceName = keyof typeof SERVICE_URLS;
//# sourceMappingURL=constants.d.ts.map