/**
 * Gemini DOM Observer
 * Watches for Gemini response text and replaces aliases with real names
 */

import type { Observer, AliasMapping } from './types';

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
      window.postMessage({
        source: 'ai-pii-inject',
        action: 'GET_ALIASES'
      }, '*');

      // Listen for response
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.source === 'ai-pii-content' && event.data?.aliases) {
          const mappings = event.data.aliases.map((a: any) => ({
            real: a.real,
            alias: a.alias
          }));
          this.updateAliases(mappings);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
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
