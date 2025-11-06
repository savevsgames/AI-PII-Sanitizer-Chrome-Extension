// Quick script to check chrome.storage contents
chrome.storage.local.get(null, (items) => {
  console.log('All storage keys:', Object.keys(items));
  console.log('Has _encryptionKeyMaterial:', !!items._encryptionKeyMaterial);
  console.log('Has profiles_v2:', !!items.profiles_v2);
  if (items.profiles_v2) {
    console.log('profiles_v2 length:', items.profiles_v2.length);
    console.log('profiles_v2 preview:', items.profiles_v2.substring(0, 100));
  }
});
