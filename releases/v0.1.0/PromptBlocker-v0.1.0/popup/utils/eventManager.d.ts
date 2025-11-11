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
export declare class EventManager {
    private listeners;
    private timers;
    private intervals;
    /**
     * Add event listener and track it for cleanup
     */
    add(element: EventTarget, event: string, handler: EventHandler, options?: boolean | AddEventListenerOptions): void;
    /**
     * Add multiple event listeners to the same element
     */
    addMultiple(element: EventTarget, events: string[], handler: EventHandler, options?: boolean | AddEventListenerOptions): void;
    /**
     * Remove a specific event listener
     */
    remove(element: EventTarget, event: string, handler: EventHandler, options?: boolean | AddEventListenerOptions): void;
    /**
     * Add setTimeout and track it for cleanup
     */
    setTimeout(callback: () => void, delay: number): number;
    /**
     * Add setInterval and track it for cleanup
     */
    setInterval(callback: () => void, delay: number): number;
    /**
     * Clear a specific timeout
     */
    clearTimeout(id: number): void;
    /**
     * Clear a specific interval
     */
    clearInterval(id: number): void;
    /**
     * Remove all tracked event listeners
     */
    cleanup(): void;
    /**
     * Get count of tracked listeners (for debugging)
     */
    count(): {
        listeners: number;
        timers: number;
        intervals: number;
        total: number;
    };
    /**
     * Log current tracked items (for debugging)
     */
    debug(): void;
}
/**
 * Global EventManager singleton for shared use
 * Use this for components that don't manage their own lifecycle
 */
export declare const globalEventManager: EventManager;
export {};
//# sourceMappingURL=eventManager.d.ts.map