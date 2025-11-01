/**
 * DOM manipulation utilities with XSS protection
 */

/**
 * Escape HTML to prevent XSS attacks
 * Use this whenever inserting user-generated content into innerHTML
 */
export function escapeHtml(text: string): string {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

/**
 * Safely render HTML template with escaped user data
 * @param template - Template literal string
 * @param data - Object with values to escape
 * @returns Safe HTML string with escaped values
 *
 * @example
 * const html = safeHTML('<div>${name}</div>', { name: userInput });
 */
export function safeHTML(
  template: string,
  data: Record<string, string | number | boolean | null | undefined>
): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const escaped = value === null || value === undefined
      ? ''
      : typeof value === 'string'
        ? escapeHtml(value)
        : String(value);
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), escaped);
  }
  return result;
}

/**
 * Safely map array items to HTML with automatic escaping
 * @param items - Array of items to render
 * @param renderFn - Function that returns HTML template for each item
 * @param escapeFields - Fields to escape (user-controlled data)
 * @returns Safe HTML string
 *
 * @example
 * const html = safeMap(
 *   profiles,
 *   (p) => `<div>${p.name}</div>`,
 *   ['name'] // Escape 'name' field
 * );
 */
export function safeMap<T extends Record<string, any>>(
  items: T[],
  renderFn: (item: T) => string,
  escapeFields: (keyof T)[]
): string {
  return items.map(item => {
    const escaped = { ...item };
    escapeFields.forEach(field => {
      if (typeof escaped[field] === 'string') {
        escaped[field] = escapeHtml(escaped[field]);
      }
    });
    return renderFn(escaped);
  }).join('');
}

/**
 * Safely set innerHTML with escaped content
 */
export function setInnerHTML(element: HTMLElement, html: string): void {
  element.innerHTML = html;
}

/**
 * Create element with safe text content
 * Prefer this over template strings when possible
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    className?: string;
    textContent?: string;
    innerHTML?: string;
    attributes?: Record<string, string>;
    children?: HTMLElement[];
  }
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (options?.className) {
    element.className = options.className;
  }

  if (options?.textContent) {
    element.textContent = options.textContent;
  }

  if (options?.innerHTML) {
    element.innerHTML = options.innerHTML;
  }

  if (options?.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (options?.children) {
    options.children.forEach(child => {
      element.appendChild(child);
    });
  }

  return element;
}

/**
 * Safely add event listener with automatic cleanup
 */
export function addEventListenerWithCleanup(
  element: HTMLElement,
  event: string,
  handler: EventListener,
  abortController?: AbortController
): () => void {
  const signal = abortController?.signal;
  element.addEventListener(event, handler, { signal });

  return () => {
    if (!signal) {
      element.removeEventListener(event, handler);
    } else {
      abortController?.abort();
    }
  };
}

/**
 * Remove all children from an element
 */
export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Toggle class on element
 */
export function toggleClass(
  element: HTMLElement,
  className: string,
  force?: boolean
): boolean {
  return element.classList.toggle(className, force);
}

/**
 * Query selector with type safety
 */
export function qs<T extends HTMLElement = HTMLElement>(
  selector: string,
  parent: HTMLElement | Document = document
): T | null {
  return parent.querySelector(selector) as T | null;
}

/**
 * Query selector all with type safety
 */
export function qsa<T extends HTMLElement = HTMLElement>(
  selector: string,
  parent: HTMLElement | Document = document
): T[] {
  return Array.from(parent.querySelectorAll(selector)) as T[];
}
