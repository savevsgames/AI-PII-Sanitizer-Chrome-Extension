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
    // Check if extension is active (has config)
    const response = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });

    if (!response?.success || !response.data?.settings?.enabled) {
      return; // Extension is disabled
    }

    // Create toast container with glassmorphism
    const toast = document.createElement('div');
    toast.id = 'ai-pii-sanitizer-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(16, 185, 129, 0.15);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 12px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      pointer-events: none;
    `;

    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="M9 12l2 2 4-4"></path>
      </svg>
      <span>You are protected</span>
    `;

    document.body.appendChild(toast);

    // Slide in animation
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 100);

    // Slide out after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';

      // Remove from DOM after animation
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 3000);

  } catch (error) {
    console.error('Failed to show activation toast:', error);
  }
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
        sendResponse({ allow: 'block' }); // Block by default on error
      });
    return true; // Will respond asynchronously
  }

  return false; // Not handling this message
});

// Listen for messages from inject.js (page context)
window.addEventListener('message', async (event) => {
  // Only accept messages from our own page
  if (event.source !== window) return;

  // Handle health check requests from inject.js
  if (event.data?.source === 'ai-pii-inject-health') {
    const { messageId } = event.data;

    // Verify full chain: inject -> content -> background -> content -> inject
    try {
      await chrome.runtime.sendMessage({ type: 'HEALTH_CHECK' });

      // If we got here, the full chain is working
      window.postMessage({
        source: 'ai-pii-content-health',
        messageId,
        isAlive: true
      }, '*');
    } catch (error) {
      // Extension context invalidated or background not responding
      window.postMessage({
        source: 'ai-pii-content-health',
        messageId,
        isAlive: false
      }, '*');
    }

    return;
  }

  // Handle "not protected" modal request from inject.js
  if (event.data?.source === 'ai-pii-inject-not-protected') {
    const { messageId } = event.data;

    console.log('🛑 Showing NOT PROTECTED modal');

    const userChoice = await showNotProtectedModal();

    // Send response back to inject.js
    window.postMessage({
      source: 'ai-pii-content-not-protected',
      messageId,
      allow: userChoice === 'allow-anyway'
    }, '*');

    return;
  }

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
 * Returns Promise<string> - 'block', 'allow-key-only', or 'allow-all'
 */
function showAPIKeyWarning(payload: { keysDetected: number; keyTypes: string[] }): Promise<'block' | 'allow-key-only' | 'allow-all'> {
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
          <strong>You're about to send ${payload.keysDetected} API key${payload.keysDetected > 1 ? 's' : ''} to an AI service:</strong>
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
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #374151; line-height: 1.5;">
          Sending API keys to AI services is <strong style="color: #dc2626;">not recommended</strong> as they could be logged or misused.
        </p>
        <div style="
          background: rgba(239, 68, 68, 0.1);
          backdrop-filter: blur(10px);
          border-left: 4px solid #ef4444;
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 12px;
        ">
          <p style="margin: 0; font-size: 13px; color: #7f1d1d; font-weight: 600; line-height: 1.5;">
            ⚠️ <strong>Important:</strong> If you choose "Send Everything Unprotected", <strong>ALL protection will be disabled</strong> for this message (including PII aliases).
          </p>
        </div>
      </div>
      <div style="padding: 0 24px 24px 24px; display: flex; flex-direction: column; gap: 10px;">
        <button id="api-key-block" style="
          width: 100%;
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <span style="font-size: 18px;">🛡️</span>
          <span>Block Everything</span>
        </button>
        <button id="api-key-allow-pii-protected" style="
          width: 100%;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <span style="font-size: 18px;">🔑</span>
          <span>Send API Key Only (PII Protected)</span>
        </button>
        <button id="api-key-allow-all" style="
          width: 100%;
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <span style="font-size: 18px;">⚠️</span>
          <span>Send Everything Unprotected</span>
        </button>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Add hover effects
    const blockBtn = content.querySelector('#api-key-block') as HTMLButtonElement;
    const allowPiiProtectedBtn = content.querySelector('#api-key-allow-pii-protected') as HTMLButtonElement;
    const allowAllBtn = content.querySelector('#api-key-allow-all') as HTMLButtonElement;

    // Hover effect for block button
    blockBtn.addEventListener('mouseenter', () => {
      blockBtn.style.transform = 'translateY(-2px)';
      blockBtn.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.4)';
    });
    blockBtn.addEventListener('mouseleave', () => {
      blockBtn.style.transform = 'translateY(0)';
      blockBtn.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
    });

    // Hover effect for allow PII protected button
    allowPiiProtectedBtn.addEventListener('mouseenter', () => {
      allowPiiProtectedBtn.style.transform = 'translateY(-2px)';
      allowPiiProtectedBtn.style.boxShadow = '0 4px 16px rgba(245, 158, 11, 0.4)';
    });
    allowPiiProtectedBtn.addEventListener('mouseleave', () => {
      allowPiiProtectedBtn.style.transform = 'translateY(0)';
      allowPiiProtectedBtn.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
    });

    // Hover effect for allow all button
    allowAllBtn.addEventListener('mouseenter', () => {
      allowAllBtn.style.transform = 'translateY(-2px)';
      allowAllBtn.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.4)';
    });
    allowAllBtn.addEventListener('mouseleave', () => {
      allowAllBtn.style.transform = 'translateY(0)';
      allowAllBtn.style.boxShadow = 'none';
    });

    // Handle button clicks
    blockBtn.addEventListener('click', () => {
      modal.remove();
      resolve('block'); // Block everything
    });

    allowPiiProtectedBtn.addEventListener('click', () => {
      modal.remove();
      resolve('allow-key-only'); // Allow API key, protect PII
    });

    allowAllBtn.addEventListener('click', () => {
      modal.remove();
      resolve('allow-all'); // Allow everything unprotected
    });

    // Block on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
        resolve('block'); // Block by default
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

/**
 * Show Extension Not Protected Modal
 * Returns Promise<string> - 'refresh' or 'allow-anyway'
 */
function showNotProtectedModal(): Promise<'refresh' | 'allow-anyway'> {
  return new Promise((resolve) => {
    // Remove existing modal if any
    const existing = document.getElementById('not-protected-modal');
    if (existing) existing.remove();

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'not-protected-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: fadeIn 0.2s ease-out;
      pointer-events: auto;
    `;

    // Create modal content with glassmorphism
    const content = document.createElement('div');
    content.style.cssText = `
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 32px;
      max-width: 500px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.3);
      pointer-events: auto;
      position: relative;
      z-index: 1;
    `;

    content.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 64px; margin-bottom: 16px;">🛑</div>
        <h2 style="margin: 0 0 8px 0; color: #1a202c; font-size: 24px; font-weight: 600;">
          PromptBlocker.com
        </h2>
        <h3 style="margin: 0 0 16px 0; color: #ef4444; font-size: 18px; font-weight: 600;">
          Extension Not Protected
        </h3>
        <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
          The extension has lost connection and <strong style="color: #ef4444;">cannot protect your data</strong>.
          <br><br>
          This typically happens when the extension is reloaded. Please refresh this page to restore full protection.
        </p>

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button id="not-protected-refresh" style="
            flex: 1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
          ">
            🔄 Refresh Page
          </button>
          <button id="not-protected-allow" style="
            flex: 1;
            background: rgba(0, 0, 0, 0.05);
            color: #718096;
            border: 1px solid rgba(0, 0, 0, 0.1);
            padding: 14px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
          ">
            ⚠️ Allow Anyway
          </button>
        </div>

        <p style="margin: 16px 0 0 0; color: #a0aec0; font-size: 12px;">
          Press Ctrl+Shift+R for hard refresh
        </p>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    console.log('🛑 NOT PROTECTED modal displayed');

    // Button handlers
    const refreshBtn = content.querySelector('#not-protected-refresh') as HTMLButtonElement;
    const allowBtn = content.querySelector('#not-protected-allow') as HTMLButtonElement;

    if (!refreshBtn || !allowBtn) {
      console.error('❌ Modal buttons not found!');
      return;
    }

    console.log('✅ Modal buttons attached:', refreshBtn, allowBtn);

    // Use both addEventListener AND onclick for maximum compatibility
    const handleRefresh = () => {
      console.log('🔄 User clicked Refresh - reloading page');
      modal.remove();
      location.reload();
      resolve('refresh');
    };

    const handleAllow = () => {
      console.log('⚠️ User clicked Allow Anyway - allowing unprotected request');
      modal.remove();
      resolve('allow-anyway');
    };

    refreshBtn.addEventListener('click', handleRefresh);
    refreshBtn.onclick = handleRefresh;

    allowBtn.addEventListener('click', handleAllow);
    allowBtn.onclick = handleAllow;

    // Hover effects
    refreshBtn.addEventListener('mouseenter', () => {
      refreshBtn.style.transform = 'translateY(-2px)';
      refreshBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
    });
    refreshBtn.addEventListener('mouseleave', () => {
      refreshBtn.style.transform = 'translateY(0)';
      refreshBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    allowBtn.addEventListener('mouseenter', () => {
      allowBtn.style.transform = 'translateY(-2px)';
      allowBtn.style.background = 'rgba(0, 0, 0, 0.08)';
    });
    allowBtn.addEventListener('mouseleave', () => {
      allowBtn.style.transform = 'translateY(0)';
      allowBtn.style.background = 'rgba(0, 0, 0, 0.05)';
    });

    // ESC key to default to refresh
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
        location.reload();
        resolve('refresh');
      }
    };

    document.addEventListener('keydown', handleEscape);
  });
}
