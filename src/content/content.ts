/**
 * Content Script - ISOLATED world
 * Acts as a relay between page context (inject.js) and background script
 *
 * Architecture:
 * inject.js (page) → window.postMessage → content.ts → chrome.runtime.sendMessage → background.ts
 */

// Inject the fetch interceptor script into page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = () => {
  script.remove();
  console.log('🛡️ AI PII Sanitizer: Injector loaded');
};
(document.head || document.documentElement).appendChild(script);

/**
 * Show auto-activation toast when visiting protected pages
 */
async function showActivationToast() {
  try {
    // Check if extension context is valid by trying to communicate
    const response = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });

    if (!response?.success || !response.data?.settings?.enabled) {
      return; // Extension is disabled
    }

    // Show "You are protected" toast
    showToast({
      message: 'You are protected',
      icon: 'shield',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      duration: 3000
    });

  } catch (error: any) {
    // Check if extension context was invalidated
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes('Extension context invalidated') || errorMsg.includes('Receiving end does not exist')) {
      console.warn('⚠️ Extension context invalidated - page needs refresh');

      // Show "Refresh Required" toast
      showToast({
        message: 'Extension reloaded - Click to refresh page',
        icon: 'warning',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        duration: 10000,
        clickable: true,
        onClick: () => {
          location.reload();
        }
      });
    } else {
      console.error('Failed to show activation toast:', error);
    }
  }
}

/**
 * Show a toast notification
 */
function showToast(options: {
  message: string;
  icon: 'shield' | 'warning';
  background: string;
  duration: number;
  clickable?: boolean;
  onClick?: () => void;
}) {
  const { message, icon, background, duration, clickable = false, onClick } = options;

  // Create toast container
  const toast = document.createElement('div');
  toast.id = 'ai-pii-sanitizer-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${background};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 999999;
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    ${clickable ? 'cursor: pointer; pointer-events: all;' : 'pointer-events: none;'}
  `;

  // Add icon SVG based on type
  const iconSvg = icon === 'shield'
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="M9 12l2 2 4-4"></path>
      </svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <span>${message}</span>
  `;

  // Add click handler if clickable
  if (clickable && onClick) {
    toast.addEventListener('click', () => {
      onClick();
      toast.remove();
    });
  }

  document.body.appendChild(toast);

  // Slide in animation
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 100);

  // Slide out after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';

    // Remove from DOM after animation
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, duration);
}

// Show toast when page loads (wait for DOM to be ready)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showActivationToast);
} else {
  showActivationToast();
}

// Listen for messages from background (PING, WARN_API_KEY)
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'PING') {
    // Verify we can actually communicate with background script
    // If extension was reloaded, this will fail
    chrome.runtime.sendMessage({ type: 'HEALTH_CHECK' })
      .then(() => {
        sendResponse('PONG');
      })
      .catch(() => {
        // Extension context invalidated - don't respond
        sendResponse(null);
      });
    return true; // Will respond asynchronously
  }

  if (request.type === 'WARN_API_KEY') {
    // Show warning modal to user
    showAPIKeyWarning(request.payload)
      .then((userChoice) => {
        sendResponse({ allow: userChoice });
      })
      .catch(() => {
        sendResponse({ allow: false }); // Block by default on error
      });
    return true; // Will respond asynchronously
  }

  return false; // Not handling this message
});

// Listen for messages from inject.js (page context)
window.addEventListener('message', async (event) => {
  // Only accept messages from our own page
  if (event.source !== window) return;

  // Handle API key warning requests from inject.js
  if (event.data?.source === 'ai-pii-inject-warning') {
    const { messageId, keysDetected, keyTypes } = event.data;

    console.log('⚠️ Showing API key warning modal');

    const allow = await showAPIKeyWarning({ keysDetected, keyTypes });

    // Send response back to inject.js
    window.postMessage({
      source: 'ai-pii-content-warning',
      messageId,
      allow
    }, '*');

    return;
  }

  // Check if message is from our inject script
  if (event.data?.source !== 'ai-pii-inject') return;

  const { messageId, type, payload } = event.data;

  console.log('🔄 Content script relaying:', type);

  try {
    // Forward to background script
    const response = await chrome.runtime.sendMessage({
      type,
      payload
    });

    // Send response back to inject.js
    window.postMessage({
      source: 'ai-pii-content',
      messageId,
      response
    }, '*');
  } catch (error) {
    console.error('❌ Content script relay error:', error);

    // Check if extension was invalidated (common during development)
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('Extension context invalidated')) {
      console.warn('⚠️ Extension reloaded - please refresh this page (Ctrl+Shift+R)');
    }

    // Send error response back
    window.postMessage({
      source: 'ai-pii-content',
      messageId,
      response: {
        success: false,
        error: errorMsg
      }
    }, '*');
  }
});

/**
 * Show API Key Warning Modal
 * Returns Promise<boolean> - true if user allows, false if blocked
 */
function showAPIKeyWarning(payload: { keysDetected: number; keyTypes: string[] }): Promise<boolean> {
  return new Promise((resolve) => {
    // Remove existing modal if any
    const existing = document.getElementById('api-key-warning-modal');
    if (existing) existing.remove();

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'api-key-warning-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: fadeIn 0.2s ease-out;
    `;

    // Create modal content with glassmorphism
    const content = document.createElement('div');
    content.style.cssText = `
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      padding: 0;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      animation: slideUp 0.3s ease-out;
    `;

    content.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 24px; border-radius: 16px 16px 0 0; color: white;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <h3 style="margin: 0; font-size: 20px; font-weight: 600;">API Key Detected!</h3>
        </div>
      </div>
      <div style="padding: 24px; color: #1f2937; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px);">
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #111827;">
          <strong>You're about to send ${payload.keysDetected} API key${payload.keysDetected > 1 ? 's' : ''} to ChatGPT:</strong>
        </p>
        <div style="
          background: rgba(254, 243, 199, 0.8);
          backdrop-filter: blur(10px);
          border-left: 4px solid #f59e0b;
          padding: 12px 16px;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
        ">
          <div style="font-size: 13px; color: #92400e; font-weight: 600;">
            ${payload.keyTypes.map(type => `• ${type.toUpperCase()} API Key`).join('<br>')}
          </div>
        </div>
        <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">
          Sending API keys to AI services is <strong style="color: #dc2626;">not recommended</strong> as they could be logged or misused.
        </p>
      </div>
      <div style="padding: 0 24px 24px 24px; display: flex; gap: 12px;">
        <button id="api-key-block" style="
          flex: 1;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        ">
          🛡️ Block Request
        </button>
        <button id="api-key-allow" style="
          flex: 1;
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">
          Send Anyway
        </button>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Add hover effects
    const allowBtn = content.querySelector('#api-key-allow') as HTMLButtonElement;
    const blockBtn = content.querySelector('#api-key-block') as HTMLButtonElement;

    allowBtn.addEventListener('mouseenter', () => {
      allowBtn.style.transform = 'translateY(-2px)';
      allowBtn.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.4)';
    });
    allowBtn.addEventListener('mouseleave', () => {
      allowBtn.style.transform = 'translateY(0)';
      allowBtn.style.boxShadow = 'none';
    });

    blockBtn.addEventListener('mouseenter', () => {
      blockBtn.style.transform = 'translateY(-2px)';
      blockBtn.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.4)';
    });
    blockBtn.addEventListener('mouseleave', () => {
      blockBtn.style.transform = 'translateY(0)';
      blockBtn.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
    });

    // Handle button clicks
    blockBtn.addEventListener('click', () => {
      modal.remove();
      resolve(false); // Block
    });

    allowBtn.addEventListener('click', () => {
      modal.remove();
      resolve(true); // Allow
    });

    // Block on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
        resolve(false); // Block by default
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}
