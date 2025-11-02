const fs = require('fs');

console.log('Adding XMLHttpRequest interception to inject.js...');

let inject = fs.readFileSync('src/content/inject.js', 'utf8');

// Add XHR interception after fetch interception
const insertPoint = "  console.log('🛡️ AI PII Sanitizer: Active and monitoring');";

const xhrInterception = `  console.log('🛡️ AI PII Sanitizer: Active and monitoring');

  // INTERCEPT XMLHttpRequest for Gemini (they don't use fetch!)
  const nativeXHROpen = XMLHttpRequest.prototype.open;
  const nativeXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    this._method = method;

    if (window.location.hostname.includes('gemini.google.com')) {
      console.log('🌐 [DEBUG] XHR open:', method, url);
    }

    return nativeXHROpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.send = function(body) {
    if (window.location.hostname.includes('gemini.google.com') && this._url) {
      console.log('🌐 [DEBUG] XHR send:', this._method, this._url);
      console.log('🌐 [DEBUG] XHR body length:', body?.length || 0);

      if (this._url.includes('BardChatUi') || this._url.includes('batchexecute')) {
        console.log('🔍 [Gemini] XHR API REQUEST DETECTED!');
        console.log('🔍 [Gemini] URL:', this._url);
        console.log('🔍 [Gemini] Body:', body?.substring(0, 200));
      }
    }

    return nativeXHRSend.apply(this, [body]);
  };`;

inject = inject.replace(insertPoint, xhrInterception);

fs.writeFileSync('src/content/inject.js', inject, 'utf8');
console.log('✅ Added XHR interception logging');
