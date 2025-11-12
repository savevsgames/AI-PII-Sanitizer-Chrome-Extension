# PromptBlocker Installation Guide

Welcome! This guide will walk you through installing **PromptBlocker** (v0.1.0) in developer mode on Chrome for both **Windows** and **Mac**.

---

## What is PromptBlocker?

PromptBlocker is a Chrome extension that protects your privacy by replacing real personally identifiable information (PII) with aliases when using AI chat services like ChatGPT, Claude, Gemini, Perplexity, and Copilot.

**Key Features:**
- 🔒 Replace your real name, email, phone, address with aliases
- 🎯 API Key Vault for protecting sensitive API keys
- 📄 Multi-document analysis (PDF, DOCX, TXT)
- 🔐 All data stored locally with AES-256-GCM encryption
- ✅ Works on 5 major AI platforms

---

## Prerequisites

Before you begin, ensure you have:
- **Google Chrome** installed (latest version recommended)
- The PromptBlocker installation file:
  - **Mac**: `dist.zip` (or `dist` folder)
  - **Windows**: `releases/v0.1.0/PromptBlocker-v0.1.0.zip`

---

## Installation Instructions

### For Mac Users

1. **Extract the files**
   - Locate the `dist.zip` file provided to you
   - Double-click `dist.zip` to extract it (or use `unzip dist.zip` in Terminal)
   - You should now have a `dist` folder

2. **Open Chrome Extensions page**
   - Open Google Chrome
   - In the address bar, type: `chrome://extensions/`
   - Press Enter

3. **Enable Developer Mode**
   - In the top-right corner, toggle the **"Developer mode"** switch to ON
   - You should see additional buttons appear (Load unpacked, Pack extension, Update)

4. **Load the extension**
   - Click the **"Load unpacked"** button
   - Navigate to the `dist` folder you extracted in step 1
   - Select the `dist` folder and click **"Select"** (or **"Open"**)

5. **Verify installation**
   - You should see the PromptBlocker extension card appear
   - Look for the PromptBlocker icon in your Chrome toolbar (top-right)
   - If you don't see the icon, click the puzzle piece icon and pin PromptBlocker

6. **Test the extension**
   - Click the PromptBlocker icon to open the popup
   - You're ready to create your first privacy profile!

---

### For Windows Users

1. **Extract the files**
   - Locate `PromptBlocker-v0.1.0.zip` in the `releases/v0.1.0/` folder
   - Right-click the ZIP file → **"Extract All..."**
   - Choose a destination folder (e.g., `C:\PromptBlocker`)
   - Click **"Extract"**
   - You should now have a `PromptBlocker-v0.1.0` folder containing the extension files

2. **Open Chrome Extensions page**
   - Open Google Chrome
   - In the address bar, type: `chrome://extensions/`
   - Press Enter

3. **Enable Developer Mode**
   - In the top-right corner, toggle the **"Developer mode"** switch to ON
   - You should see additional buttons appear (Load unpacked, Pack extension, Update)

4. **Load the extension**
   - Click the **"Load unpacked"** button
   - Navigate to the extracted `PromptBlocker-v0.1.0` folder
   - Select the folder and click **"Select Folder"**

5. **Verify installation**
   - You should see the PromptBlocker extension card appear with version 0.1.0
   - Look for the PromptBlocker icon in your Chrome toolbar (top-right)
   - If you don't see the icon, click the puzzle piece icon (Extensions) and pin PromptBlocker

6. **Test the extension**
   - Click the PromptBlocker icon to open the popup
   - You're ready to create your first privacy profile!

---

## Quick Start Guide

Once installed, here's how to get started:

1. **Create a Profile**
   - Click the PromptBlocker icon in your toolbar
   - Go to the **"Aliases"** tab
   - Click **"+ Add Alias"**
   - Enter your real information and the fake information you want to use
   - Click **"Save"**

2. **Visit a Supported AI Platform**
   - ChatGPT (chat.openai.com)
   - Claude (claude.ai)
   - Gemini (gemini.google.com)
   - Perplexity (perplexity.ai)
   - Copilot (copilot.microsoft.com)

3. **Start Chatting**
   - Type a message containing your real name or other PII
   - PromptBlocker will automatically replace it with your alias before sending
   - AI responses containing your alias will be converted back to your real name

4. **Check Activity Log**
   - Open PromptBlocker popup
   - Go to the **"Activity"** tab
   - See all substitutions made across all platforms

---

## Troubleshooting

### Extension not showing up?
- Make sure Developer mode is enabled
- Try refreshing the extensions page (`chrome://extensions/`)
- Check that you selected the correct folder (should contain `manifest.json`)

### Icon not visible in toolbar?
- Click the puzzle piece icon (Extensions) in Chrome toolbar
- Find PromptBlocker in the list
- Click the pin icon to make it always visible

### Extension not working on AI sites?
- Refresh the AI chat page after installing the extension
- Check that the extension is enabled on the `chrome://extensions/` page
- Open browser console (F12) and check for any errors

### Need to reload the extension?
- Go to `chrome://extensions/`
- Find PromptBlocker
- Click the circular refresh icon on the extension card

---

## Supported Platforms

PromptBlocker currently works on:
- ✅ **ChatGPT** (chat.openai.com, chatgpt.com)
- ✅ **Claude** (claude.ai)
- ✅ **Gemini** (gemini.google.com)
- ✅ **Perplexity** (perplexity.ai)
- ✅ **Copilot** (copilot.microsoft.com)

Combined coverage: ~98% of global AI chatbot market share!

---

## Privacy & Security

- 🔒 **100% Local**: All data stored in your browser, never sent to external servers
- 🔐 **Encrypted**: AES-256-GCM encryption for all sensitive data
- 🚫 **Zero Telemetry**: No tracking, analytics, or data collection
- 📖 **Open Source**: Fully transparent codebase

---

## Need Help?

- **Website**: [promptblocker.com](https://promptblocker.com)
- **Issues**: Please use the feedback form (`feedback_form.md`)
- **Documentation**: Check the `/docs` folder in the project

---

## Version Information

- **Version**: 0.1.0
- **Release Date**: November 2025
- **Manifest**: Version 3 (Latest Chrome standard)

---

**Thank you for testing PromptBlocker!** 🎉

Your feedback is invaluable in helping us build the best privacy protection tool for AI chat services.
