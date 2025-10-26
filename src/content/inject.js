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

    try {
      const requestBody = options?.body || '';

      // Step 1: Send request body to content script for substitution (real → alias)
      const substituteRequest = await new Promise((resolve) => {
        const messageId = Math.random().toString(36);

        // Timeout after 2 seconds (extension may be reloaded)
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handleResponse);
          console.warn('⚠️ Substitution timeout - extension may need reload');
          resolve({ success: false, error: 'timeout' });
        }, 2000);

        // Listen for response from content script
        const handleResponse = (event) => {
          if (event.data?.source === 'ai-pii-content' &&
              event.data?.messageId === messageId) {
            clearTimeout(timeout);
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
        console.warn('⚠️ Substitution failed, passing through original request');
        return nativeFetch.apply(this, args);
      }

      // Check if warning is needed (warn-first mode)
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
          // Use original body without any substitutions
          return nativeFetch.apply(this, args);
        } else if (userChoice === 'allow-key-only') {
          console.log('🔑 User allowed API key only - PII still protected');
          // Re-request substitution with flag to skip API key check
          const retrySubstitution = await new Promise((resolve) => {
            const messageId = Math.random().toString(36);

            const timeout = setTimeout(() => {
              window.removeEventListener('message', handleResponse);
              resolve({ success: false, error: 'timeout' });
            }, 2000);

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
                body: requestBody,
                url: urlStr,
                skipApiKeyCheck: true  // New flag
              }
            }, '*');
          });

          if (!retrySubstitution || !retrySubstitution.success) {
            console.warn('⚠️ Retry substitution failed');
            return nativeFetch.apply(this, args);
          }

          // Use the PII-substituted body (but with original API key)
          const modifiedOptions = {
            ...options,
            body: retrySubstitution.modifiedBody
          };
          const response = await nativeFetch(urlStr, modifiedOptions);

          // Still need to reverse PII substitution on response
          // Continue to response handling below
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/event-stream')) {
            return handleStreamingResponse(response);
          } else {
            return handleNormalResponse(response);
          }
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

        // Timeout after 2 seconds
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handleResponse);
          console.warn('⚠️ Response substitution timeout');
          resolve({ success: false, error: 'timeout' });
        }, 2000);

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
      return nativeFetch.apply(this, args);
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

            // Timeout after 2 seconds for streaming chunks
            const timeout = setTimeout(() => {
              window.removeEventListener('message', handleResponse);
              resolve({ success: false, error: 'timeout' });
            }, 2000);

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
