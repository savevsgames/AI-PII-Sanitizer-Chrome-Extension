/**
 * Observer Registry
 * Coordinates service-specific DOM observers
 */

import { GeminiObserver } from './gemini-observer';
import type { Observer } from './types';

let activeObserver: Observer | null = null;

/**
 * Initialize appropriate observer based on current page
 */
export function initObservers(): void {
  const hostname = window.location.hostname;

  console.log('[Observers] 🚀 Initializing for:', hostname);
  console.log('[Observers] 🌐 Full URL:', window.location.href);
  console.log('[Observers] 🔍 Is Gemini?', hostname.includes('gemini.google.com'));

  // Clean up any existing observer
  if (activeObserver) {
    activeObserver.stop();
    activeObserver = null;
  }

  // Start service-specific observer
  if (hostname.includes('gemini.google.com')) {
    console.log('[Observers] ✅ GEMINI DETECTED!');
    console.log('[Observers] 🚀 Starting Gemini observer...');
    activeObserver = new GeminiObserver();
    activeObserver.start();
  }
  // Future: Add Claude, Perplexity observers if needed
  // else if (hostname.includes('claude.ai')) {
  //   activeObserver = new ClaudeObserver();
  //   activeObserver.start();
  // }
  else {
    console.log('[Observers] No observer needed for this service');
  }
}

/**
 * Stop all observers (cleanup)
 */
export function stopObservers(): void {
  if (activeObserver) {
    console.log('[Observers] Stopping active observer');
    activeObserver.stop();
    activeObserver = null;
  }
}

/**
 * Update aliases in active observer
 */
export function updateObserverAliases(aliases: any[]): void {
  if (activeObserver) {
    const mappings = aliases.map(a => ({
      real: a.real,
      alias: a.alias
    }));
    activeObserver.updateAliases(mappings);
  }
}
