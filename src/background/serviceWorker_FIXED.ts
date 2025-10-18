// THIS FILE CONTAINS THE FIXED IMPLEMENTATION
// Copy the key functions from here to serviceWorker.ts

/**
 * Substitute text in-place without extraction (FIXED VERSION)
 * This preserves message structure and handles multi-paragraph content correctly
 */
async function substituteInPlace(data: any, aliasEngine: any): Promise<{
  data: any;
  substitutionCount: number;
  profilesMatched: Array<{ profileName: string; piiTypes: string[] }>;
}> {
  const modified = JSON.parse(JSON.stringify(data)); // Deep clone
  let totalSubstitutions = 0;
  const profileMatchesMap = new Map<string, Set<string>>();

  // ChatGPT format: { messages: [{ role, content }] }
  if (modified.messages && Array.isArray(modified.messages)) {
    for (let i = 0; i < modified.messages.length; i++) {
      const msg = modified.messages[i];
      
      if (!msg.content) continue;

      // String content
      if (typeof msg.content === 'string') {
        const substituted = aliasEngine.substitute(msg.content, 'encode');
        modified.messages[i].content = substituted.text;
        totalSubstitutions += substituted.substitutions.length;
        
        // Track profile matches
        if (substituted.profilesMatched) {
          for (const match of substituted.profilesMatched) {
            if (!profileMatchesMap.has(match.profileName)) {
              profileMatchesMap.set(match.profileName, new Set());
            }
            for (const piiType of match.piiTypes) {
              profileMatchesMap.get(match.profileName)!.add(piiType);
            }
          }
        }
      }
      
      // Nested object: { content_type: "text", parts: [...] }
      else if (msg.content.parts && Array.isArray(msg.content.parts)) {
        for (let j = 0; j < msg.content.parts.length; j++) {
          const substituted = aliasEngine.substitute(msg.content.parts[j], 'encode');
          modified.messages[i].content.parts[j] = substituted.text;
          totalSubstitutions += substituted.substitutions.length;
          
          // Track profile matches
          if (substituted.profilesMatched) {
            for (const match of substituted.profilesMatched) {
              if (!profileMatchesMap.has(match.profileName)) {
                profileMatchesMap.set(match.profileName, new Set());
              }
              for (const piiType of match.piiTypes) {
                profileMatchesMap.get(match.profileName)!.add(piiType);
              }
            }
          }
        }
      }
      
      // Array of content blocks
      else if (Array.isArray(msg.content)) {
        for (let j = 0; j < msg.content.length; j++) {
          const block = msg.content[j];
          if (typeof block === 'string') {
            const substituted = aliasEngine.substitute(block, 'encode');
            modified.messages[i].content[j] = substituted.text;
            totalSubstitutions += substituted.substitutions.length;
            
            // Track profile matches
            if (substituted.profilesMatched) {
              for (const match of substituted.profilesMatched) {
                if (!profileMatchesMap.has(match.profileName)) {
                  profileMatchesMap.set(match.profileName, new Set());
                }
                for (const piiType of match.piiTypes) {
                  profileMatchesMap.get(match.profileName)!.add(piiType);
                }
              }
            }
          } else if (block.text) {
            const substituted = aliasEngine.substitute(block.text, 'encode');
            modified.messages[i].content[j].text = substituted.text;
            totalSubstitutions += substituted.substitutions.length;
            
            // Track profile matches
            if (substituted.profilesMatched) {
              for (const match of substituted.profilesMatched) {
                if (!profileMatchesMap.has(match.profileName)) {
                  profileMatchesMap.set(match.profileName, new Set());
                }
                for (const piiType of match.piiTypes) {
                  profileMatchesMap.get(match.profileName)!.add(piiType);
                }
              }
            }
          }
        }
      }
    }
  }

  // Claude format: { prompt: "..." }
  else if (modified.prompt && typeof modified.prompt === 'string') {
    const substituted = aliasEngine.substitute(modified.prompt, 'encode');
    modified.prompt = substituted.text;
    totalSubstitutions += substituted.substitutions.length;
    
    // Track profile matches
    if (substituted.profilesMatched) {
      for (const match of substituted.profilesMatched) {
        if (!profileMatchesMap.has(match.profileName)) {
          profileMatchesMap.set(match.profileName, new Set());
        }
        for (const piiType of match.piiTypes) {
          profileMatchesMap.get(match.profileName)!.add(piiType);
        }
      }
    }
  }

  // Gemini format: { contents: [{ parts: [{ text }] }] }
  else if (modified.contents && Array.isArray(modified.contents)) {
    for (let i = 0; i < modified.contents.length; i++) {
      const content = modified.contents[i];
      if (content.parts && Array.isArray(content.parts)) {
        for (let j = 0; j < content.parts.length; j++) {
          const part = content.parts[j];
          if (part.text) {
            const substituted = aliasEngine.substitute(part.text, 'encode');
            modified.contents[i].parts[j].text = substituted.text;
            totalSubstitutions += substituted.substitutions.length;
            
            // Track profile matches
            if (substituted.profilesMatched) {
              for (const match of substituted.profilesMatched) {
                if (!profileMatchesMap.has(match.profileName)) {
                  profileMatchesMap.set(match.profileName, new Set());
                }
                for (const piiType of match.piiTypes) {
                  profileMatchesMap.get(match.profileName)!.add(piiType);
                }
              }
            }
          }
        }
      }
    }
  }

  // Convert profile matches to array
  const profilesMatched = Array.from(profileMatchesMap.entries()).map(([profileName, piiTypes]) => ({
    profileName,
    piiTypes: Array.from(piiTypes)
  }));

  return {
    data: modified,
    substitutionCount: totalSubstitutions,
    profilesMatched
  };
}

/**
 * Apply redacted text back to data structure (for API key redaction)
 */
async function replaceAllTextWithRedacted(data: any, redactedText: string): Promise<any> {
  const modified = JSON.parse(JSON.stringify(data)); // Deep clone
  
  // Split redacted text back into message parts (same delimiter as extraction)
  const textParts = redactedText.split('\n\n').filter(Boolean);
  let partIndex = 0;

  // ChatGPT format
  if (modified.messages && Array.isArray(modified.messages)) {
    for (let i = 0; i < modified.messages.length; i++) {
      const msg = modified.messages[i];
      
      if (!msg.content) continue;

      // String content
      if (typeof msg.content === 'string' && msg.content) {
        if (partIndex < textParts.length) {
          modified.messages[i].content = textParts[partIndex++];
        }
      }
      
      // Nested object format
      else if (msg.content.parts && Array.isArray(msg.content.parts)) {
        if (partIndex < textParts.length) {
          modified.messages[i].content.parts = [textParts[partIndex++]];
        }
      }
      
      // Array of content blocks
      else if (Array.isArray(msg.content)) {
        for (let j = 0; j < msg.content.length; j++) {
          const block = msg.content[j];
          if (partIndex >= textParts.length) break;
          
          if (typeof block === 'string') {
            modified.messages[i].content[j] = textParts[partIndex++];
          } else if (block.text) {
            modified.messages[i].content[j].text = textParts[partIndex++];
          }
        }
      }
    }
  }

  // Claude format
  else if (modified.prompt && typeof modified.prompt === 'string') {
    modified.prompt = redactedText;
  }

  // Gemini format
  else if (modified.contents && Array.isArray(modified.contents)) {
    for (let i = 0; i < modified.contents.length; i++) {
      const content = modified.contents[i];
      if (content.parts && Array.isArray(content.parts)) {
        for (let j = 0; j < content.parts.length; j++) {
          const part = content.parts[j];
          if (part.text && partIndex < textParts.length) {
            modified.contents[i].parts[j].text = textParts[partIndex++];
          }
        }
      }
    }
  }

  return modified;
}
