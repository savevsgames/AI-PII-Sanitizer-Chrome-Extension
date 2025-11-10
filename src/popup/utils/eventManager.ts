/**
 * Event Manager Utility
 * Tracks and cleans up event listeners to prevent memory leaks
 *
 * Usage:
 * ```typescript
 * const events = new EventManager();
 *
 * // Add listeners
 * const button = document.getElementById('myButton');
 * events.add(button, 'click', handleClick);
 * events.add(window, 'resize', handleResize);
 *
 * // Clean up all listeners when done
 * events.cleanup();
 * ```
 */

type EventTarget = HTMLElement | Window | Document | null | undefined;
type EventHandler = EventListener | EventListenerObject;

interface TrackedListener {
  element: HTMLElement | Window | Document;
  event: string;
  handler: EventHandler;
  options?: boolean | AddEventListenerOptions;
}

export class EventManager {
  private listeners: TrackedListener[] = [];
  private timers: number[] = [];
  private intervals: number[] = [];

  /**
   * Add event listener and track it for cleanup
   */
  public add(
    element: EventTarget,
    event: string,
    handler: EventHandler,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (!element) {
      console.warn('[EventManager] Attempted to add listener to null element');
      return;
    }

    element.addEventListener(event, handler, options);
    this.listeners.push({ element, event, handler, options });
  }

  /**
   * Add multiple event listeners to the same element
   */
  public addMultiple(
    element: EventTarget,
    events: string[],
    handler: EventHandler,
    options?: boolean | AddEventListenerOptions
  ): void {
    events.forEach(event => this.add(element, event, handler, options));
  }

  /**
   * Remove a specific event listener
   */
  public remove(
    element: EventTarget,
    event: string,
    handler: EventHandler,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (!element) return;

    element.removeEventListener(event, handler, options);

    // Remove from tracking
    this.listeners = this.listeners.filter(
      listener => !(
        listener.element === element &&
        listener.event === event &&
        listener.handler === handler
      )
    );
  }

  /**
   * Add setTimeout and track it for cleanup
   */
  public setTimeout(callback: () => void, delay: number): number {
    const id = window.setTimeout(callback, delay);
    this.timers.push(id);
    return id;
  }

  /**
   * Add setInterval and track it for cleanup
   */
  public setInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(callback, delay);
    this.intervals.push(id);
    return id;
  }

  /**
   * Clear a specific timeout
   */
  public clearTimeout(id: number): void {
    window.clearTimeout(id);
    this.timers = this.timers.filter(timerId => timerId !== id);
  }

  /**
   * Clear a specific interval
   */
  public clearInterval(id: number): void {
    window.clearInterval(id);
    this.intervals = this.intervals.filter(intervalId => intervalId !== id);
  }

  /**
   * Remove all tracked event listeners
   */
  public cleanup(): void {
    // Remove event listeners
    this.listeners.forEach(({ element, event, handler, options }) => {
      try {
        element.removeEventListener(event, handler, options);
      } catch (error) {
        console.warn('[EventManager] Failed to remove listener:', error);
      }
    });

    // Clear all timeouts
    this.timers.forEach(id => {
      try {
        window.clearTimeout(id);
      } catch (error) {
        console.warn('[EventManager] Failed to clear timeout:', error);
      }
    });

    // Clear all intervals
    this.intervals.forEach(id => {
      try {
        window.clearInterval(id);
      } catch (error) {
        console.warn('[EventManager] Failed to clear interval:', error);
      }
    });

    // Reset tracking arrays
    this.listeners = [];
    this.timers = [];
    this.intervals = [];

    console.log('[EventManager] Cleanup complete');
  }

  /**
   * Get count of tracked listeners (for debugging)
   */
  public count(): {
    listeners: number;
    timers: number;
    intervals: number;
    total: number;
  } {
    return {
      listeners: this.listeners.length,
      timers: this.timers.length,
      intervals: this.intervals.length,
      total: this.listeners.length + this.timers.length + this.intervals.length,
    };
  }

  /**
   * Log current tracked items (for debugging)
   */
  public debug(): void {
    const counts = this.count();
    console.log('[EventManager] Tracked items:', counts);
    console.log('[EventManager] Listeners:', this.listeners.map(l => ({
      element: l.element,
      event: l.event,
    })));
    console.log('[EventManager] Timers:', this.timers.length);
    console.log('[EventManager] Intervals:', this.intervals.length);
  }
}

/**
 * Global EventManager singleton for shared use
 * Use this for components that don't manage their own lifecycle
 */
export const globalEventManager = new EventManager();

/**
 * Clean up global event manager on page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalEventManager.cleanup();
  });
}
