# Privacy Policy for AI PII Sanitizer

**Last Updated:** January 2025
**Effective Date:** January 2025

## Introduction

AI PII Sanitizer ("we", "our", or "the extension") is committed to protecting your privacy. This extension is designed with privacy-first principles: all data remains local, encrypted, and under your complete control.

## What We Collect

### Information Stored Locally

The extension stores the following data **locally on your device only**:

1. **Identity Profiles**: Your personal information (PII) and corresponding aliases that you create
   - Real information (names, emails, phone numbers, addresses, company names)
   - Alias information (fake/alternative data used for substitution)
   - Profile names and descriptions
   - Profile usage statistics (substitution counts, last used timestamps)

2. **Configuration Settings**: Your preferences and settings
   - Extension enabled/disabled state
   - Notification preferences
   - Debug mode settings
   - Protected AI services toggles

3. **Activity Log**: Local debugging information
   - Timestamps of substitutions
   - URLs where substitutions occurred
   - Number of substitutions per session
   - Success/error status

### Information We Do NOT Collect

- ❌ We do NOT send any data to external servers
- ❌ We do NOT transmit your PII or aliases anywhere
- ❌ We do NOT track your browsing activity
- ❌ We do NOT use analytics or telemetry services
- ❌ We do NOT share data with third parties
- ❌ We do NOT create user accounts or store data in the cloud

## How We Store Data

### Local Storage with Encryption

All sensitive data is stored using Chrome's local storage API with the following security measures:

1. **AES-256-GCM Encryption**: Your identity profiles are encrypted using military-grade AES-256-GCM encryption before storage
2. **Local Only**: All data remains on your device and is never transmitted
3. **User-Controlled**: You can export, delete, or modify your data at any time

### Data Location

- Storage: Chrome Extension Local Storage API
- Location: Your device only
- Access: Only you and this extension

## How We Use Your Data

The extension uses your data **exclusively** for the following purposes:

1. **PII Substitution**: Replace your real information with aliases in AI chat requests
2. **Response Decoding**: Convert aliases back to real information in AI responses
3. **Statistics**: Show you usage statistics (all calculated locally)
4. **Activity Logging**: Provide debugging information (stored locally only)

## Data Retention

- **Local Storage**: Data persists until you manually delete it or uninstall the extension
- **Uninstall**: All data is automatically deleted when you uninstall the extension
- **Manual Deletion**: You can clear all data anytime via Settings → Clear All Stats

## Your Rights and Controls

You have complete control over your data:

1. **Access**: View all your profiles and settings in the extension popup
2. **Modify**: Edit or update profiles at any time
3. **Delete**: Remove individual profiles or clear all data
4. **Export**: Download your profiles as JSON files
5. **Disable**: Turn off protection temporarily or permanently

## Third-Party Services

### AI Services We Interact With

The extension intercepts requests to the following AI services for substitution purposes:

- ChatGPT (OpenAI)
- Claude (Anthropic)
- Gemini (Google)
- Perplexity AI
- Poe
- Microsoft Copilot
- You.com

**Important**: We only modify the data you send to these services. We do not collect, store, or transmit any data to/from these services ourselves. Each AI service has its own privacy policy that governs how they handle data.

### No Analytics or Tracking

This extension does NOT use:

- Google Analytics
- Mixpanel
- Segment
- Sentry
- Any other analytics or error tracking services

## Children's Privacy

This extension is not directed at children under 13. We do not knowingly collect information from children. If you believe a child has used this extension, please contact us.

## Chrome Web Store Compliance

This extension complies with Chrome Web Store's [Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/):

- **Single Purpose**: Protects PII in AI chats through substitution
- **Limited Use**: Only accesses AI service requests for substitution purposes
- **User Disclosure**: All permissions are clearly disclosed
- **Data Handling**: All data is stored locally and encrypted

### Required Permissions

The extension requests the following permissions:

1. **storage**: Store encrypted profiles and settings locally
2. **webRequest / declarativeNetRequest**: Intercept AI service requests for substitution
3. **activeTab**: Inject content scripts on AI service pages
4. **host permissions**: Access specific AI service domains (chatgpt.com, claude.ai, etc.)

## Data Security

### Security Measures

- **Encryption**: AES-256-GCM encryption for all sensitive data
- **No Network Transmission**: Data never leaves your device
- **Manifest V3**: Uses latest Chrome extension security standards
- **Code Transparency**: Source code available on GitHub for audit

### Limitations

While we implement strong security measures, no system is 100% secure. Local storage can be accessed by:

- Other extensions with broad permissions (rare, but possible)
- Malware on your device
- Physical access to your unlocked device

**Best Practice**: Use strong device passwords and only install trusted extensions.

## Changes to This Policy

We may update this Privacy Policy occasionally. Changes will be posted:

- In this document with an updated "Last Updated" date
- In the extension's release notes
- On our GitHub repository

Continued use after changes constitutes acceptance of the updated policy.

## Contact Us

If you have questions about this Privacy Policy:

- **GitHub Issues**: [https://github.com/[YOUR_USERNAME]/ai-pii-sanitizer/issues](https://github.com/[YOUR_USERNAME]/ai-pii-sanitizer/issues)
- **Email**: [YOUR_SUPPORT_EMAIL]

## Open Source

This extension is open source. You can review the code, report issues, or contribute:

- **Repository**: [https://github.com/[YOUR_USERNAME]/ai-pii-sanitizer](https://github.com/[YOUR_USERNAME]/ai-pii-sanitizer)
- **License**: GNU Affero General Public License v3.0 (AGPL-3.0)

---

## GDPR Compliance (EU Users)

For users in the European Union, under GDPR:

- **Data Controller**: You are the data controller of your own data
- **Legal Basis**: Consent (you create and manage profiles voluntarily)
- **Data Processing**: All processing happens locally on your device
- **Right to Access**: Full access via extension interface
- **Right to Deletion**: Delete profiles or uninstall extension
- **Right to Portability**: Export profiles as JSON
- **No Data Transfer**: Data never leaves the EU (or your device)

## CCPA Compliance (California Users)

For California residents, under CCPA:

- **No Sale of Data**: We do not sell personal information
- **No Sharing**: We do not share personal information with third parties
- **Access & Deletion**: Full control via extension interface
- **No Discrimination**: Free features remain free regardless of privacy choices

---

**Summary**: This extension stores all data locally, encrypts sensitive information, and never transmits data to external servers. You have complete control over your data at all times.
