# PromptBlocker - Release Process

**Last Updated:** 2025-01-10

This document explains how to create release packages with **consistent extension IDs** across all testers.

---

## 🎯 Goal

Ensure all testers get the **same extension ID** (`gpmmdongkfeimmejkbcnilmacgngnjgi`) so that:
- Firebase UID-based encryption works consistently
- User data is accessible across development cycles
- No confusion about which version testers are using

---

## 🔐 How Extension ID Works

Chrome generates extension IDs using this process:
1. Takes the **public key** from `manifest.json`
2. Hashes it with SHA-256
3. Encodes the first 128 bits in base16 (using `a-p` alphabet)

**Key insight:** Same public key = Same extension ID (always)

---

## 📦 Release Workflow

### Prerequisites

1. **Environment variables in `.env`:**
   ```bash
   EXTENSION_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
   EXTENSION_ID=gpmmdongkfeimmejkbcnilmacgngnjgi
   ```

2. **Never commit `.env` to git** (already in `.gitignore`)

3. **Never store `.pem` files in the repository** (use `/temp` for temporary operations)

---

## 🚀 Creating a Release

### Step 1: Update Version

Edit `src/manifest.json`:
```json
{
  "version": "0.3.0",
  ...
}
```

### Step 2: Build and Package

Run the release command:
```bash
npm run build:release
```

This will:
1. Build the extension with webpack
2. **Inject the public key** from `.env` into `dist/manifest.json`
3. Copy `dist/` to `releases/vX.X.X/PromptBlocker-vX.X.X/`
4. Create a ZIP file: `releases/vX.X.X/PromptBlocker-vX.X.X.zip`

### Step 3: Verify Extension ID

Check the console output for:
```
✓ Injected EXTENSION_PUBLIC_KEY into manifest.json
✓ Extension ID will be: gpmmdongkfeimmejkbcnilmacgngnjgi
```

You can also manually verify:
```bash
node -e "console.log(require('./dist/manifest.json').key ? 'Key present ✓' : 'Key missing ✗')"
```

### Step 4: Distribute to Testers

Share the ZIP file from `releases/vX.X.X/PromptBlocker-vX.X.X.zip`

**Installation instructions for testers:**
1. Extract the ZIP file
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extracted `PromptBlocker-vX.X.X` folder
6. Extension ID will be: `gpmmdongkfeimmejkbcnilmacgngnjgi` ✓

---

## 🔧 What Happens Behind the Scenes

### webpack.config.js

The `CopyPlugin` transform function injects the public key:

```javascript
{
  from: 'src/manifest.json',
  to: 'manifest.json',
  transform(content) {
    const manifest = JSON.parse(content.toString());

    // Inject public key from environment
    if (process.env.EXTENSION_PUBLIC_KEY) {
      manifest.key = process.env.EXTENSION_PUBLIC_KEY;
      console.log('✓ Injected EXTENSION_PUBLIC_KEY into manifest.json');
      console.log('✓ Extension ID will be: gpmmdongkfeimmejkbcnilmacgngnjgi');
    }

    return JSON.stringify(manifest, null, 2);
  }
}
```

### scripts/package-release.js

The release script:
1. Verifies `dist/manifest.json` has the `key` field
2. Creates release directory structure
3. Copies the built extension
4. Creates a ZIP package
5. Prints distribution instructions

---

## 🛡️ Security Best Practices

### ✅ DO:
- Store private key in `.env` (git-ignored)
- Store public key in `.env` (git-ignored, but safe to expose)
- Use `/temp` folder for temporary files (git-ignored)
- Inject public key during build process
- Distribute **unpacked extensions** (folders, not .crx files)

### ❌ DON'T:
- Commit `.env` to git
- Store `.pem` files in the repository
- Hardcode keys in source files
- Create `.crx` files with `chrome --pack-extension` (Chrome Web Store doesn't accept them)
- Share private keys with testers (they don't need them)

---

## 📂 Release Directory Structure

```
releases/
├── v0.1.0/
│   ├── PromptBlocker-v0.1.0/          # Unpacked extension (extracted folder)
│   │   ├── manifest.json              # Has "key" field injected
│   │   ├── background.js
│   │   ├── content.js
│   │   └── ...
│   ├── PromptBlocker-v0.1.0.zip       # ZIP package for distribution
│   ├── INSTALL.md                      # Installation instructions for testers
│   └── BETA_TESTING.md                 # Feedback template
├── v0.2.0/
│   └── ...
└── README.md                           # Release history
```

---

## 🧪 Testing the Release

### Verify Extension ID

After loading the extension:
1. Go to `chrome://extensions/`
2. Find "PromptBlocker"
3. Check the ID under the extension name
4. Should be: `gpmmdongkfeimmejkbcnilmacgngnjgi`

### Verify Firebase Encryption Works

1. Sign in with Google
2. Create a profile
3. Check `chrome.storage.local` in DevTools:
   ```javascript
   chrome.storage.local.get(null, console.log)
   ```
4. Profile data should be encrypted
5. Firebase UID should be used as the encryption key source

---

## 🔄 Updating Releases

To create a new release version:

1. **Update version in `src/manifest.json`**
   ```json
   "version": "0.3.0"
   ```

2. **Run the build command:**
   ```bash
   npm run build:release
   ```

3. **Create release documentation:**
   - Copy `INSTALL.md` from previous version
   - Update version numbers
   - Update "What's New" section

4. **Tag in git:**
   ```bash
   git add .
   git commit -m "release: v0.3.0"
   git tag -a v0.3.0 -m "Release v0.3.0"
   git push origin main --tags
   ```

---

## ❓ FAQ

### Q: Why not use `.crx` files?

**A:** Chrome Web Store requires unpacked extensions for submission. `.crx` files are pre-signed packages that Chrome Web Store won't accept. Testers also need unpacked extensions for development testing.

### Q: What if I lose the private key?

**A:** You can still use the public key (stored in `.env`) to maintain the same extension ID. The private key is only needed if you want to create `.crx` files, which we don't need.

### Q: Can testers see the public key?

**A:** Yes, and that's fine! Public keys are meant to be public. They can see it in `manifest.json` after installation. The **private key** must remain secret.

### Q: What if two developers build the extension?

**A:** As long as both have the same `EXTENSION_PUBLIC_KEY` in their `.env` file, both will produce the same extension ID.

### Q: How do I regenerate the key pair?

**A:** You shouldn't need to. If you do:
1. Generate a new key pair
2. Update `.env` with the new keys
3. **Warning:** This will change the extension ID, breaking Firebase UID encryption for existing users

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues)
- **Documentation:** `docs/` folder
- **CLAUDE.md:** Project instructions for AI assistance

---

**Last Updated:** 2025-01-10
**Current Extension ID:** `gpmmdongkfeimmejkbcnilmacgngnjgi`
**Next Release:** v0.3.0 (planned)
