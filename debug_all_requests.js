const fs = require('fs');

console.log('Adding logging for ALL fetch requests on Gemini...');

let inject = fs.readFileSync('src/content/inject.js', 'utf8');

// Add logging BEFORE the isAIRequest check to see all URLs
const oldIsAICheck = `    // Pass through non-AI requests immediately
    if (!isAIRequest(urlStr)) {
      return nativeFetch.apply(this, args);
    }`;

const newIsAICheck = `    // Log ALL requests on Gemini to debug
    if (window.location.hostname.includes('gemini.google.com')) {
      console.log('🌐 [DEBUG] All Gemini fetch:', urlStr);
      console.log('🌐 [DEBUG] isAIRequest?', isAIRequest(urlStr));
    }

    // Pass through non-AI requests immediately
    if (!isAIRequest(urlStr)) {
      return nativeFetch.apply(this, args);
    }`;

inject = inject.replace(oldIsAICheck, newIsAICheck);

fs.writeFileSync('src/content/inject.js', inject, 'utf8');
console.log('✅ Added debug logging for all Gemini fetch requests');
