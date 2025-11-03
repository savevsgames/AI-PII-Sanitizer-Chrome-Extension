/**
 * Injected script that runs in page context
 * This file is loaded via <script src="..."> to bypass CSP
 *
 * ARCHITECTURE:
 * - This script intercepts fetch calls in the page context
 * - Sends request body to background for substitution (real → alias)
 * - Makes the actual fetch call with modified body (NO RE-FETCHING IN BACKGROUND!)
 * - Sends response to background for reverse substitution (alias → real)
 * - Returns modified response to the page
 */

(function() {
  console.log('🛡️ AI PII Sanitizer: Loading...');
  console.log('🌐 Current hostname:', window.location.hostname);
  console.log('🌐 Current URL:', window.location.href);

  const nativeFetch = window.fetch;
  window.__nativeFetch = nativeFetch;

  // Extension disable flag - when true, stops all interception
  let extensionDisabled = false;

  // Health check system - fail safe approach with exponential backoff
  let isProtected = false;
  let healthCheckAttempts = 0;
  let healthCheckInterval = 1000; // Start at 1 second
  const MAX_HEALTH_CHECK_ATTEMPTS = 3;
  const MIN_HEALTH_CHECK_INTERVAL = 1000; // 1 second
  const MAX_HEALTH_CHECK_INTERVAL = 300000; // 5 minutes

  /**
   * Perform health check to verify extension is connected
   * Returns true if protected, false if not
   */
  async function performHealthCheck() {
    return new Promise((resolve) => {
      const messageId = Math.random().toString(36);
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        resolve(false); // Fail safe - assume not protected
      }, 500); // 500ms timeout

      const handleResponse = (event) => {
        if (event.data?.source === 'ai-pii-content-health' &&
            event.data?.messageId === messageId) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);
          resolve(event.data.isAlive === true);
        }
      };

      window.addEventListener('message', handleResponse);

      window.postMessage({
        source: 'ai-pii-inject-health',
        messageId
      }, '*');
    });
  }

  /**
   * Continuous health monitoring with exponential backoff
   */
  async function monitorHealth() {
    // Check if extension was disabled - stop monitoring
    if (extensionDisabled) {
      console.log('⚠️ Extension disabled - stopping health monitoring');
      return; // Stop the health check loop
    }

    const wasProtected = isProtected;
    isProtected = await performHealthCheck();

    if (!isProtected) {
      healthCheckAttempts++;

      // Retry up to MAX_HEALTH_CHECK_ATTEMPTS times immediately
      if (healthCheckAttempts < MAX_HEALTH_CHECK_ATTEMPTS) {
        console.warn(`⚠️ Health check failed (attempt ${healthCheckAttempts}/${MAX_HEALTH_CHECK_ATTEMPTS}), retrying...`);
        // Retry immediately
        await new Promise(resolve => setTimeout(resolve, 200));
        isProtected = await performHealthCheck();
      }

      if (!isProtected) {
        // Only log once when first detected
        if (wasProtected) {
          console.error('🛑 NOT PROTECTED - Extension connection lost');
          console.error('⚠️ Please refresh the page (Ctrl+Shift+R) to restore protection');
        }

        // Exponential backoff - double the interval each time, max 5 minutes
        healthCheckInterval = Math.min(healthCheckInterval * 2, MAX_HEALTH_CHECK_INTERVAL);
      }
    } else {
      // Reset on success
      if (!wasProtected) {
        console.log('✅ PROTECTED - Extension connection active');
      }
      healthCheckAttempts = 0;
      healthCheckInterval = MIN_HEALTH_CHECK_INTERVAL; // Reset to 1 second
    }

    // Continue monitoring with current interval
    setTimeout(monitorHealth, healthCheckInterval);
  }

  // Start health monitoring
  monitorHealth();

  // Track if we've already shown the modal for this page load
  let hasShownNotProtectedModal = false;

  // Listen for tab visibility changes - show modal when tab becomes visible if not protected
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      // Check if extension was disabled - skip protection check
      if (extensionDisabled) {
        console.log('⚠️ Extension disabled - skipping protection check');
        return;
      }

      console.log('👁️ Tab became visible, checking protection status...');

      // Perform immediate health check
      const isCurrentlyProtected = await performHealthCheck();

      if (!isCurrentlyProtected && !hasShownNotProtectedModal) {
        console.warn('⚠️ Tab focused but NOT PROTECTED - showing modal');

        // Request modal from content script
        const userAction = await new Promise((resolve) => {
          const messageId = Math.random().toString(36);

          const timeout = setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            resolve(null); // No action on timeout
          }, 30000); // 30 second timeout

          const handleResponse = (event) => {
            if (event.data?.source === 'ai-pii-content-not-protected' &&
                event.data?.messageId === messageId) {
              clearTimeout(timeout);
              window.removeEventListener('message', handleResponse);
              resolve(event.data.action); // 'disable' | 'reload'
            }
          };

          window.addEventListener('message', handleResponse);

          window.postMessage({
            source: 'ai-pii-inject-not-protected',
            messageId
          }, '*');
        });

        hasShownNotProtectedModal = true; // Only show once per page load

        if (userAction === 'reload') {
          console.log('🔄 User chose reload from tab focus modal');
          // Page will reload, no need to do anything
        } else if (userAction === 'disable') {
          console.log('⚠️ User chose disable - stopping all interception');
          extensionDisabled = true;
          // Restore original fetch to stop all interception
          window.fetch = nativeFetch;
          console.log('✅ Extension disabled - fetch restored to native');
        }
      }
    }
  });

  const aiDomains = [
    // ChatGPT
    'api.openai.com',
    'backend-api/conversation',
    'backend-api/f/conversation',

    // Claude
    'claude.ai/api/organizations',

    // Gemini (uses BardChatUi endpoint, not /api/)
    'gemini.google.com/_/BardChatUi',

    // Perplexity
    'perplexity.ai/socket.io',
    'perplexity.ai/api',
    'perplexity.ai/rest',  // Main REST API endpoint

    // Poe
    'poe.com/api',

    // Copilot
    'copilot.microsoft.com/api',
    'sydney.bing.com/sydney',

    // You.com
    'you.com/api'
  ];

  function isAIRequest(url) {
    return aiDomains.some(domain => url.includes(domain));
  }

  window.fetch = async function(...args) {
    // If extension was disabled, this override should never run
    // But if it does (race condition), pass through immediately
    if (extensionDisabled) {
      return nativeFetch.apply(this, args);
    }

    const [url, options] = args;
    const urlStr = typeof url === 'string' ? url : url.toString();

    // Log ALL requests on Gemini to debug
    if (window.location.hostname.includes('gemini.google.com')) {
      console.log('🌐 [DEBUG] All Gemini fetch:', urlStr);
      console.log('🌐 [DEBUG] isAIRequest?', isAIRequest(urlStr));
    }

    // Pass through non-AI requests immediately
    if (!isAIRequest(urlStr)) {
      return nativeFetch.apply(this, args);
    }

    console.log('🔒 AI PII Sanitizer: Intercepting', urlStr);
    if (urlStr.includes('gemini.google.com')) {
      console.log('🔍 [Gemini] Request detected!');
      console.log('🔍 [Gemini] URL:', urlStr);
      console.log('🔍 [Gemini] Method:', options?.method || 'GET');
    }

    // Note: We don't block based on isProtected flag anymore.
    // The background service worker will handle whether to substitute or not.
    // If no aliases are loaded, substitution will return 0 replacements and
    // the request will pass through unchanged.

    try {
      const requestBody = options?.body || '';

      // Step 1: Send request body to content script for substitution (real → alias)
      const substituteRequest = await new Promise((resolve) => {
        const messageId = Math.random().toString(36);

        // Listen for response from content script
        const handleResponse = (event) => {
          if (event.data?.source === 'ai-pii-content' &&
              event.data?.messageId === messageId) {
            window.removeEventListener('message', handleResponse);
            resolve(event.data.response);
          }
        };

        window.addEventListener('message', handleResponse);

        // Send to content script via window.postMessage
        window.postMessage({
          source: 'ai-pii-inject',
          messageId: messageId,
          type: 'SUBSTITUTE_REQUEST',
          payload: {
            body: requestBody,
            url: urlStr  // Include URL for service detection
          }
        }, '*');
      });

      if (!substituteRequest || !substituteRequest.success) {
        const errorMsg = substituteRequest?.error || 'Unknown error';
        console.error('❌ Substitution failed:', errorMsg);
        console.error('🛑 BLOCKING REQUEST - Extension protection unavailable');

        // SECURITY: Block the request instead of passing through unprotected data
        // Return a rejected promise to prevent the request from reaching the AI
        throw new Error(`AI PII Sanitizer: Protection failed (${errorMsg}). Request blocked for your safety. Please refresh the page (Ctrl+Shift+R) to restore protection.`);
      }

      // Handle API Key Warning (warn-first mode)
      if (substituteRequest.needsWarning) {
        console.warn('⚠️ API Key detected - showing warning modal');

        // Show warning modal to user via content script
        const userChoice = await new Promise((resolve) => {
          const messageId = Math.random().toString(36);

          const timeout = setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            resolve('block'); // Block by default on timeout
          }, 30000); // 30 second timeout

          const handleResponse = (event) => {
            if (event.data?.source === 'ai-pii-content-warning' &&
                event.data?.messageId === messageId) {
              clearTimeout(timeout);
              window.removeEventListener('message', handleResponse);
              resolve(event.data.allow);
            }
          };

          window.addEventListener('message', handleResponse);

          // Send warning request to content script
          window.postMessage({
            source: 'ai-pii-inject-warning',
            messageId,
            keysDetected: substituteRequest.keysDetected,
            keyTypes: substituteRequest.keyTypes
          }, '*');
        });

        if (userChoice === 'block') {
          console.log('🛡️ User blocked API key transmission');
          // Return fake successful response to avoid errors
          return new Response(JSON.stringify({ error: 'Request blocked by user' }), {
            status: 403,
            statusText: 'Forbidden - API Key Blocked',
            headers: { 'Content-Type': 'application/json' }
          });
        } else if (userChoice === 'allow-all') {
          console.log('⚠️ User allowed everything - ALL PROTECTION DISABLED');
          // Use original request without any substitutions
          return nativeFetch.apply(this, args);
        } else if (userChoice === 'allow-key-only') {
          console.log('🔑 User allowed API key only - PII still protected');
          // Continue with PII-protected body (API keys allowed through)
          // The modifiedBody already has PII substituted, just no API key redaction
        }
      }

      console.log('✅ Request substituted:', substituteRequest.substitutions, 'replacements');

      // Step 2: Make actual fetch with substituted body
      const method = (options?.method || 'GET').toUpperCase();
      const modifiedOptions = { ...options };

      // Only add body for methods that support it (not GET/HEAD)
      if (method !== 'GET' && method !== 'HEAD') {
        modifiedOptions.body = substituteRequest.modifiedBody;
      }

      const response = await nativeFetch(urlStr, modifiedOptions);

      // Step 3: Handle streaming responses (ChatGPT uses SSE)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
        console.log('⚡ Streaming response detected');
        return handleStreamingResponse(response);
      }

      // Step 4: For non-streaming, get response text
      const responseText = await response.text();

      // Step 5: Send response to content script for reverse substitution (alias → real)
      const substituteResponse = await new Promise((resolve) => {
        const messageId = Math.random().toString(36);

        const handleResponse = (event) => {
          if (event.data?.source === 'ai-pii-content' &&
              event.data?.messageId === messageId) {
            window.removeEventListener('message', handleResponse);
            resolve(event.data.response);
          }
        };

        window.addEventListener('message', handleResponse);

        window.postMessage({
          source: 'ai-pii-inject',
          messageId: messageId,
          type: 'SUBSTITUTE_RESPONSE',
          payload: { text: responseText }
        }, '*');
      });

      if (!substituteResponse || !substituteResponse.success) {
        console.warn('⚠️ Response substitution failed, returning original');
        return new Response(responseText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }

      console.log('✅ Response decoded:', substituteResponse.substitutions, 'replacements');

      // Step 6: Return modified response
      return new Response(substituteResponse.modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

    } catch (error) {
      console.error('❌ AI PII Sanitizer:', error);
      throw error;
    }
  };

  /**
   * Handle streaming responses (ChatGPT uses Server-Sent Events)
   */
  async function handleStreamingResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode chunk
          const chunk = decoder.decode(value, { stream: true });

          // Send chunk to content script for substitution
          const substituteChunk = await new Promise((resolve) => {
            const messageId = Math.random().toString(36);

            // Timeout after 1 second for streaming chunks (faster than request timeout)
            const timeout = setTimeout(() => {
              window.removeEventListener('message', handleResponse);
              console.warn('⚠️ Chunk substitution timeout');
              resolve({ success: false, error: 'timeout' });
            }, 1000);

            const handleResponse = (event) => {
              if (event.data?.source === 'ai-pii-content' &&
                  event.data?.messageId === messageId) {
                clearTimeout(timeout);
                window.removeEventListener('message', handleResponse);
                resolve(event.data.response);
              }
            };

            window.addEventListener('message', handleResponse);

            window.postMessage({
              source: 'ai-pii-inject',
              messageId: messageId,
              type: 'SUBSTITUTE_RESPONSE',
              payload: { text: chunk }
            }, '*');
          });

          // Enqueue modified or original chunk
          const modifiedChunk = substituteChunk?.success
            ? substituteChunk.modifiedText
            : chunk;

          controller.enqueue(new TextEncoder().encode(modifiedChunk));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }

  console.log('🛡️ AI PII Sanitizer: Active and monitoring');

  // INTERCEPT XMLHttpRequest for Gemini ONLY (they don't use fetch!)
  // IMPORTANT: This ONLY runs on gemini.google.com - does NOT affect ChatGPT/Claude
  if (window.location.hostname.includes('gemini.google.com')) {
    console.log('[Gemini XHR] Initializing XHR interception for Gemini');

    const nativeXHROpen = XMLHttpRequest.prototype.open;
    const nativeXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._interceptor = {
        url: typeof url === 'string' ? url : url.toString(),
        method: method.toUpperCase(),
        shouldIntercept: false
      };

      // Only intercept POST requests to BardChatUi batchexecute endpoints
      if (method.toUpperCase() === 'POST' &&
          (this._interceptor.url.includes('BardChatUi') ||
           this._interceptor.url.includes('batchexecute'))) {
        this._interceptor.shouldIntercept = true;
        console.log('[Gemini XHR] Will intercept:', method, this._interceptor.url);
      }

      return nativeXHROpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(body) {
      const interceptorData = this._interceptor;

      // Pass through if not intercepting
      if (!interceptorData || !interceptorData.shouldIntercept) {
        return nativeXHRSend.apply(this, [body]);
      }

      console.log('[Gemini XHR] 🔒 Intercepting request');
      console.log('[Gemini XHR] URL:', interceptorData.url);
      console.log('[Gemini XHR] Body length:', body?.length || 0);
      console.log('[Gemini XHR] Body preview:', body?.substring(0, 200));

      // Check if extension is disabled
      if (extensionDisabled) {
        console.warn('[Gemini XHR] Extension disabled - passing through');
        return nativeXHRSend.apply(this, [body]);
      }

      // For Gemini XHR interception, we don't block based on isProtected flag
      // because profiles are loaded via content script independently.
      // The background will handle whether to substitute or pass through.
      // If no aliases are loaded, substitution will simply return 0 replacements.

      // Handle async XHR with request/response interception
      const xhr = this;
      (async () => {
        try {
          // Step 1: Send request body to background for substitution
          const bodyStr = body ? String(body) : '';

          const substituteRequest = await new Promise((resolve) => {
            const messageId = Math.random().toString(36);

            const timeout = setTimeout(() => {
              window.removeEventListener('message', handleResponse);
              console.error('[Gemini XHR] Request substitution timeout');
              resolve({ success: false, error: 'timeout' });
            }, 5000);

            const handleResponse = (event) => {
              if (event.data?.source === 'ai-pii-content' &&
                  event.data?.messageId === messageId) {
                clearTimeout(timeout);
                window.removeEventListener('message', handleResponse);
                resolve(event.data.response);
              }
            };

            window.addEventListener('message', handleResponse);

            window.postMessage({
              source: 'ai-pii-inject',
              messageId: messageId,
              type: 'SUBSTITUTE_REQUEST',
              payload: { body: bodyStr, url: interceptorData.url }
            }, '*');
          });

          if (!substituteRequest || !substituteRequest.success) {
            console.error('[Gemini XHR] ❌ Substitution failed, blocking request');
            setTimeout(() => {
              const event = new Event('error');
              xhr.dispatchEvent(event);
            }, 0);
            return;
          }

          console.log('[Gemini XHR] ✅ Request substituted:', substituteRequest.substitutions, 'replacements');

          // Step 2: Set up response interceptor
          const originalOnReadyStateChange = xhr.onreadystatechange;

          xhr.onreadystatechange = async function(event) {
            if (this.readyState === XMLHttpRequest.DONE) {
              try {
                const originalResponse = this.responseText;

                console.log('[Gemini XHR] 🔓 Intercepting response');
                console.log('[Gemini XHR] Response length:', originalResponse.length);
                console.log('[Gemini XHR] Response preview:', originalResponse.substring(0, 200));

                // Step 3: Send response to background for decoding
                const substituteResponse = await new Promise((resolve) => {
                  const messageId = Math.random().toString(36);

                  const timeout = setTimeout(() => {
                    window.removeEventListener('message', handleResponse);
                    console.warn('[Gemini XHR] Response substitution timeout');
                    resolve({ success: false, error: 'timeout' });
                  }, 5000);

                  const handleResponse = (event) => {
                    if (event.data?.source === 'ai-pii-content' &&
                        event.data?.messageId === messageId) {
                      clearTimeout(timeout);
                      window.removeEventListener('message', handleResponse);
                      resolve(event.data.response);
                    }
                  };

                  window.addEventListener('message', handleResponse);

                  window.postMessage({
                    source: 'ai-pii-inject',
                    messageId: messageId,
                    type: 'SUBSTITUTE_RESPONSE',
                    payload: { text: originalResponse }
                  }, '*');
                });

                if (substituteResponse && substituteResponse.success) {
                  console.log('[Gemini XHR] ✅ Response decoded:', substituteResponse.substitutions, 'replacements');

                  // Step 4: Replace responseText with decoded version
                  Object.defineProperty(this, 'responseText', {
                    value: substituteResponse.modifiedText,
                    writable: false,
                    configurable: true
                  });

                  // Also handle response property
                  Object.defineProperty(this, 'response', {
                    value: this.responseType === '' || this.responseType === 'text'
                      ? substituteResponse.modifiedText
                      : this.response,
                    writable: false,
                    configurable: true
                  });
                } else {
                  console.warn('[Gemini XHR] ⚠️ Response substitution failed, returning original');
                }

              } catch (error) {
                console.error('[Gemini XHR] ❌ Response handling error:', error);
              }
            }

            // Call original handler
            if (originalOnReadyStateChange) {
              originalOnReadyStateChange.call(this, event);
            }
          };

          // Step 5: Send modified request
          nativeXHRSend.call(xhr, substituteRequest.modifiedBody);

        } catch (error) {
          console.error('[Gemini XHR] ❌ Interception error:', error);
          // Fallback: send original request
          nativeXHRSend.call(xhr, body);
        }
      })();
    };

    console.log('[Gemini XHR] ✅ XHR interception initialized for Gemini');
  }

  // ==========================
  // COPILOT WEBSOCKET INTERCEPTION
  // ==========================
  // Copilot uses WebSocket for real-time chat communication
  // WebSocket URL: wss://copilot.microsoft.com/c/api/chat?api-version=2
  // This interception is similar to Gemini XHR - runs in page context with message passing

  if (window.location.hostname.includes('copilot.microsoft.com')) {
    console.log('[Copilot WS] 🚀 Initializing WebSocket interception for Copilot');

    const nativeWebSocket = window.WebSocket;
    const nativeSend = WebSocket.prototype.send;
    const nativeAddEventListener = WebSocket.prototype.addEventListener;

    // Track Copilot WebSocket instances
    const copilotWebSockets = new WeakMap();

    // Intercept WebSocket constructor
    window.WebSocket = function(url, protocols) {
      console.log('[Copilot WS] WebSocket created:', url);

      const ws = new nativeWebSocket(url, protocols);

      // Only intercept Copilot chat WebSocket
      if (url.includes('/c/api/chat')) {
        console.log('[Copilot WS] ✅ Copilot chat WebSocket detected - will intercept');
        copilotWebSockets.set(ws, {
          url: url,
          shouldIntercept: true,
          messageBuffer: []
        });
      } else {
        console.log('[Copilot WS] ⏭️  Non-chat WebSocket - passing through');
      }

      return ws;
    };

    // Preserve WebSocket prototype
    window.WebSocket.prototype = nativeWebSocket.prototype;
    window.WebSocket.CONNECTING = nativeWebSocket.CONNECTING;
    window.WebSocket.OPEN = nativeWebSocket.OPEN;
    window.WebSocket.CLOSING = nativeWebSocket.CLOSING;
    window.WebSocket.CLOSED = nativeWebSocket.CLOSED;

    // Intercept WebSocket.send()
    WebSocket.prototype.send = function(data) {
      const wsData = copilotWebSockets.get(this);

      // Pass through if not a Copilot chat WebSocket
      if (!wsData || !wsData.shouldIntercept) {
        return nativeSend.call(this, data);
      }

      // Check if extension is disabled
      if (extensionDisabled) {
        console.warn('[Copilot WS] Extension disabled - passing through');
        return nativeSend.call(this, data);
      }

      console.log('[Copilot WS] 🔒 Intercepting outgoing message');
      console.log('[Copilot WS] Message length:', data?.length || 0);
      console.log('[Copilot WS] Message preview:', typeof data === 'string' ? data.substring(0, 500) : data);

      // Handle async interception
      const ws = this;
      (async () => {
        try {
          const messageStr = typeof data === 'string' ? data : String(data);

          const substituteRequest = await new Promise((resolve) => {
            const messageId = Math.random().toString(36);

            const timeout = setTimeout(() => {
              window.removeEventListener('message', handleResponse);
              console.error('[Copilot WS] Request substitution timeout');
              resolve({ success: false, error: 'timeout' });
            }, 5000);

            const handleResponse = (event) => {
              if (event.data?.source === 'ai-pii-content' &&
                  event.data?.messageId === messageId) {
                clearTimeout(timeout);
                window.removeEventListener('message', handleResponse);
                resolve(event.data.response);
              }
            };

            window.addEventListener('message', handleResponse);

            window.postMessage({
              source: 'ai-pii-inject',
              messageId: messageId,
              type: 'SUBSTITUTE_REQUEST',
              payload: {
                body: messageStr,
                url: wsData.url,
                method: 'WEBSOCKET'
              }
            }, '*');
          });

          if (substituteRequest?.success) {
            console.log('[Copilot WS] ✅ Sending modified message');
            console.log('[Copilot WS] Substitutions:', substituteRequest.substitutions || 0);
            nativeSend.call(ws, substituteRequest.modifiedBody);
          } else {
            console.error('[Copilot WS] ❌ Substitution failed, sending original');
            nativeSend.call(ws, data);
          }
        } catch (error) {
          console.error('[Copilot WS] ❌ Interception error:', error);
          nativeSend.call(ws, data);
        }
      })();
    };

    // Intercept WebSocket.addEventListener('message') for response decoding
    WebSocket.prototype.addEventListener = function(type, listener, options) {
      const wsData = copilotWebSockets.get(this);

      // Pass through if not a Copilot chat WebSocket or not a message event
      if (type !== 'message' || !wsData || !wsData.shouldIntercept) {
        return nativeAddEventListener.call(this, type, listener, options);
      }

      console.log('[Copilot WS] 📨 Intercepting onmessage handler');

      // Wrap the listener to decode responses
      const wrappedListener = async function(event) {
        try {
          console.log('[Copilot WS] 📩 Message received:', event.data?.substring(0, 200));

          // TODO Phase 4: Decode aliases in streaming responses
          // For now, pass through unchanged
          return listener.call(this, event);
        } catch (error) {
          console.error('[Copilot WS] ❌ Message interception error:', error);
          return listener.call(this, event);
        }
      };

      return nativeAddEventListener.call(this, type, wrappedListener, options);
    };

    console.log('[Copilot WS] ✅ WebSocket interception initialized for Copilot');
  }
})();
