/**
 * Gemini DOM Observer
 * Watches for Gemini response text and replaces aliases with real names
 */

import type { Observer, AliasMapping } from './types';

const DEBUG_MODE = false;

export class GeminiObserver implements Observer {
  private observer: MutationObserver | null = null;
  private aliases: Map<string, string> = new Map(); // alias → real
  private debounceTimer: number | null = null;
  private isActive = false;

  // Configuration
  private readonly DEBOUNCE_MS = 300;
  private readonly MAX_MUTATIONS_PER_BATCH = 100;

  // Gemini response container selectors (verified from DOM inspection)
  private readonly RESPONSE_SELECTORS = [
    '.model-response-text',      // Main AI response container
    '.message-content',           // Message wrapper
    '.markdown-main-panel',       // Markdown content area
    '.response-content'           // Outer response container
  ];

  // Selectors to EXCLUDE (don't replace text here)
  private readonly EXCLUDE_SELECTORS = [
    'code',           // Code blocks
    'pre',            // Preformatted text
    '.user-message',  // User's own messages
    'input',          // Input fields
    'textarea'        // Text areas
  ];

  constructor() {
    console.log('[Gemini Observer] Initialized');
  }

  /**
   * Start observing Gemini DOM for responses
   */
  start(): void {
    console.log('[Gemini Observer] 🚀 START called');
    console.log('[Gemini Observer] 🌐 URL:', window.location.href);
    if (this.isActive) {
      console.warn('[Gemini Observer] Already running');
      return;
    }

    // Fetch aliases from background
    this.fetchAliases();

    // Create MutationObserver
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    // Start observing the document body
    this.observer.observe(document.body, {
      childList: true,      // Watch for added/removed nodes
      subtree: true,        // Watch entire subtree
      characterData: true,  // Watch for text changes
      characterDataOldValue: false
    });

    this.isActive = true;
    console.log('[Gemini Observer] Started watching for responses');
  }

  /**
   * Stop observing
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.isActive = false;
    console.log('[Gemini Observer] Stopped');
  }

  /**
   * Check if observer is running
   */
  isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Update alias mappings
   */
  updateAliases(aliases: AliasMapping[]): void {
    this.aliases.clear();
    aliases.forEach(({ real, alias }) => {
      // Store in both directions for flexible matching
      this.aliases.set(alias.toLowerCase(), real);

      // Also store variations
      this.aliases.set(alias.toUpperCase(), real);
      this.aliases.set(this.toTitleCase(alias), real);
    });

    console.log('[Gemini Observer] Updated aliases:', this.aliases.size);
  }

  /**
   * Handle mutation events (debounced)
   */
  private handleMutations(mutations: MutationRecord[]): void {
    // Limit batch size for performance
    if (mutations.length > this.MAX_MUTATIONS_PER_BATCH) {
      console.warn('[Gemini Observer] Large mutation batch:', mutations.length);
      mutations = mutations.slice(0, this.MAX_MUTATIONS_PER_BATCH);
    }

    // Debounce processing
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.processMutations(mutations);
    }, this.DEBOUNCE_MS);
  }

  /**
   * Process mutations and replace text
   */
  private processMutations(mutations: MutationRecord[]): void {
    console.log('[Gemini Observer] 🔄 Processing', mutations.length, 'mutations');
    const startTime = performance.now();
    let replacements = 0;

    // Find all text nodes in mutated elements
    const textNodes: Text[] = [];

    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (this.isResponseNode(node)) {
            textNodes.push(...this.getTextNodes(node));
          }
        });
      } else if (mutation.type === 'characterData') {
        const node = mutation.target as Text;
        if (this.isResponseNode(node.parentElement)) {
          textNodes.push(node);
        }
      }
    });

    console.log('[Gemini Observer] 📝 Found', textNodes.length, 'text nodes');
    console.log('[Gemini Observer] 🗺️ Aliases loaded:', this.aliases.size);
    // Replace aliases in text nodes
    textNodes.forEach(textNode => {
      const replaced = this.replaceAliasesInText(textNode);
      if (replaced) replacements++;
    });

    const duration = performance.now() - startTime;

    if (replacements > 0) {
      console.log(`[Gemini Observer] Replaced ${replacements} aliases in ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Check if node is a Gemini response (not user message or excluded element)
   */
  private isResponseNode(node: Node | null): boolean {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;

    const element = node as Element;

    // Check if in excluded element
    for (const selector of this.EXCLUDE_SELECTORS) {
      if (element.matches(selector) || element.closest(selector)) {
        return false;
      }
    }

    // Check if in response container
    for (const selector of this.RESPONSE_SELECTORS) {
      if (element.matches(selector) || element.closest(selector)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all text nodes within an element
   */
  private getTextNodes(node: Node): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip empty text nodes
          if (!node.textContent?.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          // Skip excluded elements
          if (!this.isResponseNode(node.parentElement)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      textNodes.push(currentNode as Text);
    }

    return textNodes;
  }

  /**
   * Replace aliases with real names in a text node
   */
  private replaceAliasesInText(textNode: Text): boolean {
    if (!textNode.textContent) return false;

    let text = textNode.textContent;
    let modified = false;

    // Replace each alias with real name
    this.aliases.forEach((real, alias) => {
      // Use regex for whole word matching
      const regex = new RegExp(`\\b${this.escapeRegex(alias)}\\b`, 'gi');
      if (regex.test(text)) {
        text = text.replace(regex, real);
        modified = true;
      }
    });

    if (modified) {
      textNode.textContent = text;
    }

    return modified;
  }

  /**
   * Fetch aliases from background script
   */
  private async fetchAliases(): Promise<void> {
    try {
      const messageId = Math.random().toString(36).substr(2, 9);

      // Listen for response from content script
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.source === 'ai-pii-content' &&
            event.data?.messageId === messageId) {
          window.removeEventListener('message', handleMessage);

          const response = event.data.response;
          if (DEBUG_MODE) {
            console.log('[Gemini Observer] 🔍 Raw GET_PROFILES response:', response);
            console.log('[Gemini Observer] 🔍 Response success?', response?.success);
            console.log('[Gemini Observer] 🔍 Response data:', response?.data);
            console.log('[Gemini Observer] 🔍 Response data type:', typeof response?.data);
            console.log('[Gemini Observer] 🔍 Response data is array?', Array.isArray(response?.data));
            if (response?.data && Array.isArray(response.data)) {
              console.log('[Gemini Observer] 🔍 Number of profiles:', response.data.length);
            }
          }

          if (response?.success && response.data) {
            const allAliases: AliasMapping[] = [];

            // response.data is an array of AliasProfile objects (V2 structure)
            // Each profile has: { real: IdentityData, alias: IdentityData }
            response.data.forEach((profile: any, index: number) => {
              if (DEBUG_MODE) {
                console.log(`[Gemini Observer] 🔍 Processing profile ${index}:`, profile);
                console.log(`[Gemini Observer] 🔍 Profile enabled?`, profile.enabled);
                console.log(`[Gemini Observer] 🔍 Profile.real:`, profile.real);
                console.log(`[Gemini Observer] 🔍 Profile.alias:`, profile.alias);
              }
              if (!profile.enabled) return; // Skip disabled profiles

              // Extract name aliases
              if (profile.real?.name && profile.alias?.name) {
                allAliases.push({
                  real: profile.real.name,
                  alias: profile.alias.name
                });
              }

              // Extract email aliases
              if (profile.real?.email && profile.alias?.email) {
                allAliases.push({
                  real: profile.real.email,
                  alias: profile.alias.email
                });
              }

              // Extract phone aliases
              if (profile.real?.phone && profile.alias?.phone) {
                allAliases.push({
                  real: profile.real.phone,
                  alias: profile.alias.phone
                });
              }

              // Extract cellPhone aliases
              if (profile.real?.cellPhone && profile.alias?.cellPhone) {
                allAliases.push({
                  real: profile.real.cellPhone,
                  alias: profile.alias.cellPhone
                });
              }

              // Extract address aliases
              if (profile.real?.address && profile.alias?.address) {
                allAliases.push({
                  real: profile.real.address,
                  alias: profile.alias.address
                });
              }

              // Extract company aliases
              if (profile.real?.company && profile.alias?.company) {
                allAliases.push({
                  real: profile.real.company,
                  alias: profile.alias.company
                });
              }

              // Extract custom field aliases
              if (profile.real?.custom && profile.alias?.custom) {
                Object.keys(profile.real.custom).forEach(key => {
                  if (profile.real.custom[key] && profile.alias.custom[key]) {
                    allAliases.push({
                      real: profile.real.custom[key],
                      alias: profile.alias.custom[key]
                    });
                  }
                });
              }
            });

            console.log('[Gemini Observer] Fetched profiles with aliases:', allAliases.length);
            this.updateAliases(allAliases);
          } else {
            console.warn('[Gemini Observer] Failed to fetch aliases:', response);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Send request with proper format (matching inject.js pattern)
      window.postMessage({
        source: 'ai-pii-inject',
        messageId: messageId,
        type: 'GET_PROFILES',
        payload: {}
      }, '*');

      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
      }, 5000);
    } catch (error) {
      console.error('[Gemini Observer] Error fetching aliases:', error);
    }
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Convert string to Title Case
   */
  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
}
