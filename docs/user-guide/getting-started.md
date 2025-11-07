# Getting Started with PromptBlocker

Welcome to PromptBlocker! This guide will help you set up and start protecting your privacy in just a few minutes.

---

## 🎯 What is PromptBlocker?

PromptBlocker protects your personal information when using AI chat services like ChatGPT, Claude, and Gemini. It automatically replaces your real information with aliases before sending messages to AI servers.

**Example:**
- You type: "My name is John Smith and my email is john@example.com"
- AI receives: "My name is Alex Johnson and my email is alex@demo.com"
- AI responds to "Alex Johnson"
- You see the response with your real name back

**Benefits:**
- 🔒 Privacy protection - AI never sees your real information
- 🎭 Multiple identities - Create different profiles for different purposes
- 🛡️ Secure - All data encrypted and stored locally
- 🚀 Easy - Works automatically once set up

---

## 📦 Installation

### From Chrome Web Store (Recommended)
1. Visit [Chrome Web Store](https://chrome.google.com/webstore) (link coming soon)
2. Search for "PromptBlocker"
3. Click "Add to Chrome"
4. Click "Add extension" to confirm

### Manual Installation (Development)
1. Download the latest release from [GitHub](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/releases)
2. Unzip the file
3. Open Chrome and go to `chrome://extensions`
4. Enable "Developer mode" (top right corner)
5. Click "Load unpacked"
6. Select the `dist` folder from the unzipped files

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Open the Extension

Click the PromptBlocker icon in your Chrome toolbar (or pin it for easy access).

**Can't see the icon?**
- Click the puzzle piece icon in Chrome toolbar
- Find "PromptBlocker" and click the pin icon

### Step 2: Create Your First Profile

1. Click **"+ New Profile"** button
2. Fill in your information:

**Profile Name:**
```
Work Profile
```

**Your Real Information:**
```
Real Name: John Smith
Real Email: john.smith@company.com
Real Phone: +1-555-123-4567
```

**Your Alias Information:**
```
Alias Name: Alex Johnson
Alias Email: alex.demo@example.com
Alias Phone: +1-555-999-0000
```

3. Click **"Save Profile"**

✅ Your first profile is created!

### Step 3: Test It Out

1. Go to [ChatGPT](https://chat.openai.com)
2. Check the PromptBlocker badge:
   - 🟢 **Green** = Protected (good!)
   - 🔴 **Red** = Not protected (refresh the page)

3. Type a message with your real information:
```
Hi! My name is John Smith and you can reach me at john.smith@company.com
```

4. Before sending, check if your profile is enabled (green toggle in PromptBlocker popup)

5. Send the message

6. **What ChatGPT sees:**
```
Hi! My name is Alex Johnson and you can reach me at alex.demo@example.com
```

7. **What you see in the response:**
ChatGPT will respond to "Alex Johnson", but PromptBlocker automatically converts it back to "John Smith" for you!

✅ You're now protected!

---

## 🎓 Understanding Profiles

### What is a Profile?

A profile is a set of real→alias mappings. You can create multiple profiles for different purposes:

**Examples:**
- **Work Profile:** Professional alias for work-related AI assistance
- **Personal Profile:** Casual alias for personal projects
- **Learning Profile:** Student alias for educational use
- **Testing Profile:** Throwaway information for testing

### Profile Fields

You can protect these types of information:

| Field | Example Real | Example Alias |
|-------|-------------|---------------|
| Name | John Smith | Alex Johnson |
| Email | john@company.com | alex@demo.com |
| Phone | +1-555-123-4567 | +1-555-999-0000 |
| Address | 123 Main St, NYC | 456 Demo Ave, SF |

**Pro Tip:** You don't need to fill in all fields - only add what you use!

### Enabling/Disabling Profiles

- **Green toggle** = Profile active (will substitute PII)
- **Gray toggle** = Profile inactive (no substitution)

You can have multiple profiles, but only enabled ones will be used.

---

## 🛡️ Protection Status

### Badge Colors

The PromptBlocker badge shows your current protection status:

| Badge | Status | Meaning |
|-------|--------|---------|
| 🟢 Green | Protected | Extension is working, PII will be substituted |
| 🔴 Red | Not Protected | Extension not active OR service toggle is OFF, **real PII will be sent** |
| ⚪ Gray | Inactive | Not on a supported AI service |

### What to Do if Badge is Red?

1. **Check if service is enabled** - Open Settings tab and verify the toggle for that service (ChatGPT, Claude, etc.) is ON
2. **Refresh the page** (F5 or Ctrl+R) if toggle is ON but badge is still red
3. Wait 2-3 seconds for extension to load
4. Check if badge turns green
5. If still red, click the PromptBlocker icon to see why

**Common Reasons:**
- Service toggle is OFF in Settings (turn it ON to protect that platform)
- Extension was just installed (refresh page)
- Extension was just updated (refresh page)
- Content script failed to inject (check console for errors)

### "Not Protected" Modal

If you switch to an AI service tab and the badge is red, you'll see a modal:

```
⚠️ You Are Not Protected

Your personal information may be exposed.
Please refresh this page to enable protection.

[Refresh Page] [Disable Extension]
```

**What to do:**
- Click **"Refresh Page"** to reload and enable protection
- Click **"Disable Extension"** if you want to opt out (not recommended)

---

## 📊 Viewing Statistics

### Usage Stats

Click on the **Stats** tab in the PromptBlocker popup to see:

- **Total substitutions** - How many times PII was replaced
- **By service** - Breakdown by ChatGPT, Claude, Gemini, etc.
- **By PII type** - How many names, emails, phones were substituted
- **Recent activity** - Timeline of recent substitutions

### Per-Profile Stats

Each profile shows:
- Times used
- Last used date
- Success rate

This helps you understand which profiles you use most!

---

## ⚙️ Settings

### Extension Settings

In the **Settings** tab, you can configure:

**Theme:**
- Choose from 12 color themes (6 light + 6 dark)
- Classic, Lavender, Sky, Fire, Leaf, Sunlight themes
- Or match your Chrome browser theme

**Background Customization:**
- **FREE:** 6 beautiful backgrounds (theme defaults + nature scenes)
- **PRO:** 14 total backgrounds + custom upload
- **BG Transparency slider:** Control how visible your background is (0-100%)
- **Blur effect toggle:** Apply a smooth blur to your background image
- **Smart sync:** Selecting classic themes auto-sets matching backgrounds

**General:**
- Enable/disable extension globally
- Auto-enable on install
- Show notifications

**Protected Services:**
- Toggle protection for individual AI services (ChatGPT, Claude, Gemini, Perplexity, Copilot)
- Each service can be enabled/disabled independently
- Status indicator shows "Active" (all 5 services protected) or "Partial (X/5)" when some are disabled
- Disabled services will show red badge and no protection on those platforms

**Privacy:**
- Export profiles (encrypted backup)
- Import profiles (restore from backup)
- Clear all data

---

## 🎯 Supported AI Services

PromptBlocker works on these AI chat services:

| Service | URL | Status |
|---------|-----|--------|
| ChatGPT | chat.openai.com | ✅ Fully supported |
| Claude | claude.ai | ✅ Fully supported |
| Gemini | gemini.google.com | ✅ Fully supported |
| Perplexity | perplexity.ai | ✅ Fully supported |
| Poe | poe.com | ✅ Fully supported |
| GitHub Copilot | copilot.github.com | ✅ Fully supported |
| You.com | you.com | ✅ Fully supported |

More services coming soon! Request support in [GitHub Issues](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues).

---

## 🔧 Troubleshooting

### Extension Not Working?

**1. Check Badge Status**
- Is it green? ✅ You're protected
- Is it red? 🔴 Refresh the page

**2. Verify Profile is Enabled**
- Open PromptBlocker popup
- Check if your profile has a green toggle
- If gray, click the toggle to enable

**3. Check Chrome Extensions Page**
- Go to `chrome://extensions`
- Find "PromptBlocker"
- Ensure it's enabled (toggle on the right)

**4. Reload Extension**
- Go to `chrome://extensions`
- Click the reload icon (🔄) on PromptBlocker card
- Refresh your AI service tab

### Substitution Not Happening?

**Check these:**
- [ ] Profile is enabled (green toggle)
- [ ] Badge is green
- [ ] You typed the exact text from your profile (case-sensitive)
- [ ] You're on a supported AI service

**Example:**
- Profile has "John Smith" but you type "john smith" → Won't match (case-sensitive)
- Solution: Type exact case or enable case-insensitive matching (PRO feature)

### Page Won't Load?

Try:
1. Disable PromptBlocker temporarily
2. Reload the page
3. Re-enable PromptBlocker
4. Reload the page again

If issue persists, [report a bug](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues).

---

## 💎 PRO Features (Coming Soon)

Upgrade to PRO for advanced features:

### API Key Vault
Detect and redact API keys automatically:
- OpenAI, Anthropic, Google, AWS, GitHub, Stripe
- Three redaction modes (full, partial, placeholder)
- Secure key storage

### Custom Redaction Rules
Create your own PII patterns:
- Social Security Numbers
- Credit card numbers
- Custom regex patterns

### Alias Variations
Auto-generate name variations:
- "John Smith" → "John", "Smith", "J. Smith"
- Smart partial matching

### Advanced Statistics
- Export activity logs
- Custom date ranges
- Detailed analytics

**Pricing:** $4.99/month or $49/year (7-day free trial)

---

## ❓ FAQ

**Q: Is my data sent to any servers?**
A: No! All processing happens locally in your browser. PromptBlocker never sends data to external servers.

**Q: Can I use multiple profiles at once?**
A: Yes! Enable multiple profiles and PromptBlocker will apply all of them.

**Q: What happens if I disable a profile mid-conversation?**
A: Previous messages remain substituted, but new messages will use your real information.

**Q: Does this work on mobile?**
A: Not yet. PromptBlocker is currently Chrome-only. Mobile support is planned for the future.

**Q: Can I export my profiles?**
A: Yes! Go to Settings → Export Profiles. The export is encrypted for security.

---

## 🆘 Getting Help

**Need more help?**
- **User Guide:** [docs/user-guide/](../user-guide/)
- **Debug Guide:** [DEBUG_GUIDE.md](../../DEBUG_GUIDE.md)
- **GitHub Issues:** [Report a bug](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/issues)
- **GitHub Discussions:** [Ask a question](https://github.com/savevsgames/AI-PII-Sanitizer-Chrome-Extension/discussions)

---

## 🎉 You're All Set!

Congratulations! You've successfully set up PromptBlocker and learned the basics.

**Next Steps:**
- Create additional profiles for different use cases
- Explore the Stats tab to track your usage
- Join our community on GitHub

**Enjoy your privacy-protected AI conversations!** 🛡️

---

**Last Updated:** 2025-11-01
