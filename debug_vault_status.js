/**
 * Debug script to check API Key Vault status
 * Run this in the browser console (on extension popup or background page)
 */

(async function debugAPIKeyVault() {
  console.log('=== API KEY VAULT DEBUG ===\n');

  try {
    // Load config from storage
    const data = await chrome.storage.local.get('user_config');
    const config = data.user_config;

    if (!config) {
      console.error('❌ No config found in storage!');
      console.log('💡 This is likely a fresh install. Try adding a profile first.');
      return;
    }

    console.log('✅ Config loaded');
    console.log('📊 Config version:', config.version);
    console.log('🎫 Account tier:', config.account?.tier || 'unknown');

    // Check API Key Vault status
    if (!config.apiKeyVault) {
      console.warn('⚠️  API Key Vault config is NOT initialized!');
      console.log('💡 Solution: Add your first API key to initialize the vault');
      console.log('   Or run this to initialize manually:');
      console.log(`
      config.apiKeyVault = {
        enabled: true,
        mode: 'auto-redact',
        autoDetectPatterns: true,
        keys: [],
        customPatterns: []
      };
      await chrome.storage.local.set({ user_config: config });
      console.log('✅ Vault initialized!');
      `);
    } else {
      console.log('✅ API Key Vault is initialized!');
      console.log('🔐 Vault settings:');
      console.log('   - Enabled:', config.apiKeyVault.enabled);
      console.log('   - Mode:', config.apiKeyVault.mode);
      console.log('   - Auto-detect:', config.apiKeyVault.autoDetectPatterns);
      console.log('   - Stored keys:', config.apiKeyVault.keys?.length || 0);
      console.log('   - Custom patterns:', config.apiKeyVault.customPatterns?.length || 0);

      if (config.apiKeyVault.keys && config.apiKeyVault.keys.length > 0) {
        console.log('\n📋 Stored keys:');
        config.apiKeyVault.keys.forEach((key, i) => {
          console.log(`   ${i + 1}. ${key.name || 'Unnamed'} (${key.format})`);
          console.log(`      - Enabled: ${key.enabled}`);
          console.log(`      - Protected: ${key.protectionCount} times`);
          console.log(`      - Value: ${key.keyValue.slice(0, 10)}...${key.keyValue.slice(-4)}`);
        });
      } else {
        console.log('\n📭 No API keys stored yet');
        console.log('💡 Go to Features → API Key Vault → Add API Key');
      }
    }

    // Test detection
    console.log('\n🧪 Testing API Key Detection:');
    const testKey = 'sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    console.log(`   Test key: ${testKey}`);

    // Check if APIKeyDetector is available
    if (typeof APIKeyDetector !== 'undefined') {
      const detected = APIKeyDetector.detect(testKey);
      console.log('   ✅ Detector found:', detected.length, 'keys');
      if (detected.length > 0) {
        console.log('   Format:', detected[0].format);
      }
    } else {
      console.log('   ⚠️  APIKeyDetector not available in this context');
      console.log('   (This is expected if run in popup - detector is in background worker)');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n=== END DEBUG ===');
})();
