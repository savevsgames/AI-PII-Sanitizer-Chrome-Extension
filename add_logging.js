const fs = require('fs');

// 1. Update inject.js
console.log('Updating inject.js...');
let inject = fs.readFileSync('src/content/inject.js', 'utf8');

// Add hostname logging at start
inject = inject.replace(
  "console.log('🛡️ AI PII Sanitizer: Loading...');",
  "console.log('🛡️ AI PII Sanitizer: Loading...');\n  console.log('🌐 Current hostname:', window.location.hostname);\n  console.log('🌐 Current URL:', window.location.href);"
);

// Add detailed Gemini request logging
inject = inject.replace(
  "console.log('🔒 AI PII Sanitizer: Intercepting', urlStr);",
  "console.log('🔒 AI PII Sanitizer: Intercepting', urlStr);\n    if (urlStr.includes('gemini.google.com')) {\n      console.log('🔍 [Gemini] Request detected!');\n      console.log('🔍 [Gemini] URL:', urlStr);\n      console.log('🔍 [Gemini] Method:', options?.method || 'GET');\n    }"
);

fs.writeFileSync('src/content/inject.js', inject, 'utf8');
console.log('✅ inject.js updated');

// 2. Update content.ts
console.log('Updating content.ts...');
let content = fs.readFileSync('src/content/content.ts', 'utf8');

content = content.replace(
  "// Initialize DOM observers after page load\n  if (document.readyState === 'loading') {",
  "// Initialize DOM observers after page load\n  console.log('🌐 [Content] Hostname:', window.location.hostname);\n  console.log('🌐 [Content] URL:', window.location.href);\n  if (document.readyState === 'loading') {\n    console.log('📄 [Content] Waiting for DOMContentLoaded...');"
);

content = content.replace(
  "document.addEventListener('DOMContentLoaded', initObservers);",
  "document.addEventListener('DOMContentLoaded', () => {\n      console.log('📄 [Content] DOMContentLoaded fired');\n      initObservers();\n    });"
);

content = content.replace(
  "} else {\n    initObservers();",
  "} else {\n    console.log('📄 [Content] DOM already ready');\n    initObservers();"
);

fs.writeFileSync('src/content/content.ts', content, 'utf8');
console.log('✅ content.ts updated');

// 3. Update observers/index.ts
console.log('Updating observers/index.ts...');
let obsIndex = fs.readFileSync('src/content/observers/index.ts', 'utf8');

obsIndex = obsIndex.replace(
  "console.log('[Observers] Initializing for:', hostname);",
  "console.log('[Observers] 🚀 Initializing for:', hostname);\n  console.log('[Observers] 🌐 Full URL:', window.location.href);\n  console.log('[Observers] 🔍 Is Gemini?', hostname.includes('gemini.google.com'));"
);

obsIndex = obsIndex.replace(
  "console.log('[Observers] Starting Gemini observer');",
  "console.log('[Observers] ✅ GEMINI DETECTED!');\n    console.log('[Observers] 🚀 Starting Gemini observer...');"
);

fs.writeFileSync('src/content/observers/index.ts', obsIndex, 'utf8');
console.log('✅ observers/index.ts updated');

// 4. Update gemini-observer.ts
console.log('Updating gemini-observer.ts...');
let gemini = fs.readFileSync('src/content/observers/gemini-observer.ts', 'utf8');

gemini = gemini.replace(
  "start(): void {\n    if (this.isActive) {",
  "start(): void {\n    console.log('[Gemini Observer] 🚀 START called');\n    console.log('[Gemini Observer] 🌐 URL:', window.location.href);\n    if (this.isActive) {"
);

gemini = gemini.replace(
  "private processMutations(mutations: MutationRecord[]): void {\n    const startTime = performance.now();",
  "private processMutations(mutations: MutationRecord[]): void {\n    console.log('[Gemini Observer] 🔄 Processing', mutations.length, 'mutations');\n    const startTime = performance.now();"
);

gemini = gemini.replace(
  "// Replace aliases in text nodes\n    textNodes.forEach(textNode => {",
  "console.log('[Gemini Observer] 📝 Found', textNodes.length, 'text nodes');\n    console.log('[Gemini Observer] 🗺️ Aliases loaded:', this.aliases.size);\n    // Replace aliases in text nodes\n    textNodes.forEach(textNode => {"
);

fs.writeFileSync('src/content/observers/gemini-observer.ts', gemini, 'utf8');
console.log('✅ gemini-observer.ts updated');

console.log('\n✅ All files updated with extensive logging!');
