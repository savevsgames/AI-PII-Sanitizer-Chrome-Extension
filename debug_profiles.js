const fs = require('fs');

console.log('Adding detailed profile debugging...');

let gemini = fs.readFileSync('src/content/observers/gemini-observer.ts', 'utf8');

// Find and replace the response handling to add detailed logging
const oldResponseHandling = `          const response = event.data.response;
          if (response?.success && response.data) {
            const allAliases: AliasMapping[] = [];

            // response.data is an array of AliasProfile objects (V2 structure)
            // Each profile has: { real: IdentityData, alias: IdentityData }
            response.data.forEach((profile: any) => {`;

const newResponseHandling = `          const response = event.data.response;
          console.log('[Gemini Observer] 🔍 Raw GET_PROFILES response:', response);
          console.log('[Gemini Observer] 🔍 Response success?', response?.success);
          console.log('[Gemini Observer] 🔍 Response data:', response?.data);
          console.log('[Gemini Observer] 🔍 Response data type:', typeof response?.data);
          console.log('[Gemini Observer] 🔍 Response data is array?', Array.isArray(response?.data));
          if (response?.data && Array.isArray(response.data)) {
            console.log('[Gemini Observer] 🔍 Number of profiles:', response.data.length);
          }

          if (response?.success && response.data) {
            const allAliases: AliasMapping[] = [];

            // response.data is an array of AliasProfile objects (V2 structure)
            // Each profile has: { real: IdentityData, alias: IdentityData }
            response.data.forEach((profile: any, index: number) => {
              console.log(\`[Gemini Observer] 🔍 Processing profile \${index}:\`, profile);
              console.log(\`[Gemini Observer] 🔍 Profile enabled?\`, profile.enabled);
              console.log(\`[Gemini Observer] 🔍 Profile.real:\`, profile.real);
              console.log(\`[Gemini Observer] 🔍 Profile.alias:\`, profile.alias);`;

gemini = gemini.replace(oldResponseHandling, newResponseHandling);

fs.writeFileSync('src/content/observers/gemini-observer.ts', gemini, 'utf8');
console.log('✅ Added detailed profile debugging to gemini-observer.ts');
