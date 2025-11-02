const fs = require('fs');

console.log('Adding GET_PROFILES handler to serviceWorker.ts...');

let sw = fs.readFileSync('src/background/serviceWorker.ts', 'utf8');

// Add GET_PROFILES case in the message handler switch
const oldSwitch = `    case 'GET_ALIASES':
      return handleGetAliases();

    case 'ADD_ALIAS':`;

const newSwitch = `    case 'GET_ALIASES':
      return handleGetAliases();

    case 'GET_PROFILES':
      return handleGetProfiles();

    case 'ADD_ALIAS':`;

sw = sw.replace(oldSwitch, newSwitch);

// Add the handler function after handleGetAliases
const oldGetAliases = `async function handleGetAliases() {
  const storage = StorageManager.getInstance();
  const aliases = await storage.loadAliases();
  return { success: true, data: aliases };
}`;

const newGetAliases = `async function handleGetAliases() {
  const storage = StorageManager.getInstance();
  const aliases = await storage.loadAliases();
  return { success: true, data: aliases };
}

/**
 * Get all profiles (V2) - for Gemini observer
 */
async function handleGetProfiles() {
  const storage = StorageManager.getInstance();
  const profiles = await storage.loadProfiles();
  return { success: true, data: profiles };
}`;

sw = sw.replace(oldGetAliases, newGetAliases);

fs.writeFileSync('src/background/serviceWorker.ts', sw, 'utf8');
console.log('✅ Added GET_PROFILES handler to serviceWorker.ts');

// Now update gemini-observer to use GET_PROFILES
console.log('Updating gemini-observer.ts to use GET_PROFILES...');

let gemini = fs.readFileSync('src/content/observers/gemini-observer.ts', 'utf8');

gemini = gemini.replace(
  "type: 'GET_ALIASES',",
  "type: 'GET_PROFILES',"
);

gemini = gemini.replace(
  "[Gemini Observer] Fetched aliases:",
  "[Gemini Observer] Fetched profiles with aliases:"
);

fs.writeFileSync('src/content/observers/gemini-observer.ts', gemini, 'utf8');
console.log('✅ Updated gemini-observer.ts to use GET_PROFILES');

console.log('\n✅ All changes complete - GET_PROFILES will return V2 data!');
console.log('✅ GET_ALIASES unchanged - ChatGPT/Claude remain safe!');
