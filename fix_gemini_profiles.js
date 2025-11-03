const fs = require('fs');

// Fix gemini-observer.ts to correctly parse V2 AliasProfile structure
console.log('Fixing Gemini observer to use V2 profiles...');

let gemini = fs.readFileSync('src/content/observers/gemini-observer.ts', 'utf8');

// Replace the entire fetchAliases method with correct V2 profile parsing
const oldFetchMethod = /private async fetchAliases\(\): Promise<void> \{[\s\S]*?\n  \}/;

const newFetchMethod = `private async fetchAliases(): Promise<void> {
    try {
      const messageId = Math.random().toString(36).substr(2, 9);

      // Listen for response from content script
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.source === 'ai-pii-content' &&
            event.data?.messageId === messageId) {
          window.removeEventListener('message', handleMessage);

          const response = event.data.response;
          if (response?.success && response.data) {
            const allAliases: AliasMapping[] = [];

            // response.data is an array of AliasProfile objects (V2 structure)
            // Each profile has: { real: IdentityData, alias: IdentityData }
            response.data.forEach((profile: any) => {
              if (!profile.enabled) return; // Skip disabled profiles

              // Extract name aliases
              if (profile.real?.name && profile.alias?.name) {
                allAliases.push({
                  real: profile.real.name,
                  alias: profile.alias.name
                });
              }

              // Extract email aliases
              if (profile.real?.email && profile.alias?.email) {
                allAliases.push({
                  real: profile.real.email,
                  alias: profile.alias.email
                });
              }

              // Extract phone aliases
              if (profile.real?.phone && profile.alias?.phone) {
                allAliases.push({
                  real: profile.real.phone,
                  alias: profile.alias.phone
                });
              }

              // Extract cellPhone aliases
              if (profile.real?.cellPhone && profile.alias?.cellPhone) {
                allAliases.push({
                  real: profile.real.cellPhone,
                  alias: profile.alias.cellPhone
                });
              }

              // Extract address aliases
              if (profile.real?.address && profile.alias?.address) {
                allAliases.push({
                  real: profile.real.address,
                  alias: profile.alias.address
                });
              }

              // Extract company aliases
              if (profile.real?.company && profile.alias?.company) {
                allAliases.push({
                  real: profile.real.company,
                  alias: profile.alias.company
                });
              }

              // Extract custom field aliases
              if (profile.real?.custom && profile.alias?.custom) {
                Object.keys(profile.real.custom).forEach(key => {
                  if (profile.real.custom[key] && profile.alias.custom[key]) {
                    allAliases.push({
                      real: profile.real.custom[key],
                      alias: profile.alias.custom[key]
                    });
                  }
                });
              }
            });

            console.log('[Gemini Observer] Fetched aliases:', allAliases.length);
            this.updateAliases(allAliases);
          } else {
            console.warn('[Gemini Observer] Failed to fetch aliases:', response);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Send request with proper format (matching inject.js pattern)
      window.postMessage({
        source: 'ai-pii-inject',
        messageId: messageId,
        type: 'GET_ALIASES',
        payload: {}
      }, '*');

      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
      }, 5000);
    } catch (error) {
      console.error('[Gemini Observer] Error fetching aliases:', error);
    }
  }`;

gemini = gemini.replace(oldFetchMethod, newFetchMethod);

fs.writeFileSync('src/content/observers/gemini-observer.ts', gemini, 'utf8');
console.log('✅ Fixed Gemini observer to correctly parse V2 profiles');
console.log('✅ This fix ONLY affects Gemini observer - ChatGPT/Claude unchanged');
