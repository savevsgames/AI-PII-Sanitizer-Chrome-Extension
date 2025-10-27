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

  const nativeFetch = window.fetch;
  window.__nativeFetch = nativeFetch;

  // Health check system - fail safe approach with exponential backoff
  let isProtected = false;
  let healthCheckAttempts = 0;
  let healthCheckInterval = 1000; // Start at 1 second
  let userAllowedUnprotected = false; // User override flag
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

  const aiDomains = [
    // ChatGPT
    'api.openai.com',
    'backend-api/conversation',
    'backend-api/f/conversation',

    // Claude
    'claude.ai/api/organizations',

    // Gemini
    'gemini.google.com/api',

    // Perplexity
    'perplexity.ai/socket.io',
    'perplexity.ai/api',

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
    const [url, options] = args;
    const urlStr = typeof url === 'string' ? url : url.toString();

    // Pass through non-AI requests immediately
    if (!isAIRequest(urlStr)) {
      return nativeFetch.apply(this, args);
    }

    console.log('🔒 AI PII Sanitizer: Intercepting', urlStr);

    // SECURITY: Check if protection is active before allowing request
    // Skip check if user already allowed this request
    if (!isProtected && !userAllowedUnprotected) {
      console.error('🛑 BLOCKING REQUEST - Extension not protected');

      // Show modal to user asking what to do
      const userChoice = await new Promise((resolve) => {
        const messageId = Math.random().toString(36);

        const timeout = setTimeout(() => {
          window.removeEventListener('message', handleResponse);
          resolve(false); // Block by default on timeout
        }, 30000); // 30 second timeout

        const handleResponse = (event) => {
          if (event.data?.source === 'ai-pii-content-not-protected' &&
              event.data?.messageId === messageId) {
            clearTimeout(timeout);
            window.removeEventListener('message', handleResponse);
            resolve(event.data.allow === true);
          }
        };

        window.addEventListener('message', handleResponse);

        // Request modal from content script
        window.postMessage({
          source: 'ai-pii-inject-not-protected',
          messageId
        }, '*');
      });

      if (!userChoice) {
        // User chose to refresh or modal timed out
        throw new Error('AI PII Sanitizer: Request blocked - not protected');
      }

      // User chose "Allow Anyway" - set flag and log warning
      userAllowedUnprotected = true;
      console.warn('⚠️ USER OVERRIDE: Allowing unprotected request');
    }

    // If user allowed unprotected request, pass through original request without any protection
    if (userAllowedUnprotected) {
      console.warn('🚨 PASSING THROUGH ORIGINAL UNPROTECTED REQUEST - User override active');
      try {
        return await nativeFetch.apply(this, args);
      } finally {
        // Reset flag after request
        console.log('🔄 Resetting user override flag');
        userAllowedUnprotected = false;
      }
    }

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
      const modifiedOptions = {
        ...options,
        body: substituteRequest.modifiedBody
      };

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
})();
