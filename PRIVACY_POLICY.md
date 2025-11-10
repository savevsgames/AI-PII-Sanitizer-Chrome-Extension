# Privacy Policy for Prompt Blocker

**Last Updated:** January 10, 2025
**Effective Date:** January 10, 2025

## Introduction

Prompt Blocker ("we", "our", or "the extension") is committed to protecting your privacy. This extension is designed with privacy-first principles: your sensitive data is encrypted and under your complete control.

## What We Collect

### Information Stored Locally

The extension stores the following data **encrypted on your device using Chrome's local storage API**:

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

### Information Stored in Cloud Services

To provide authentication and optional cloud backup features, we use the following cloud services:

1. **Firebase Authentication** (Google)
   - Your email address (if you sign in with Google, GitHub, or Microsoft)
   - Authentication provider information
   - Firebase User ID (UID)
   - Used for: Encrypting your local data with your unique Firebase UID

2. **Firebase Firestore** (Google Cloud) - *Optional Premium Feature*
   - Encrypted profile backups (if you enable cloud sync)
   - Profile metadata (names, timestamps - NOT your actual PII)
   - Used for: Syncing profiles across devices (requires paid subscription)

3. **Stripe** (Payment Processing) - *Premium Features Only*
   - Payment information (credit card, billing address)
   - Purchase history
   - Used for: Processing premium feature subscriptions
   - Note: We DO NOT store credit card numbers - Stripe handles all payment data

### Information We Do NOT Collect

- ❌ We do NOT track your browsing activity outside of AI service domains
- ❌ We do NOT use analytics or telemetry services
- ❌ We do NOT sell or share your personal data with third parties
- ❌ We do NOT read your AI chat conversations beyond the data you choose to protect

## How We Store Data

### Local Storage with Encryption

All sensitive data is encrypted using Chrome's local storage API with the following security measures:

1. **AES-256-GCM Encryption**: Your identity profiles are encrypted using military-grade AES-256-GCM encryption before storage
2. **Firebase UID as Key Material**: Your Firebase User ID is used to derive the encryption key (your PII cannot be decrypted without being signed in)
3. **True Key Separation**: Encrypted data stays local; key material (Firebase UID) is stored remotely by Firebase
4. **User-Controlled**: You can export, delete, or modify your data at any time

### Data Location

**Local Storage (Chrome Extension)**
- Storage: Chrome Extension Local Storage API (`chrome.storage.local`)
- Location: Your device only
- Access: Only you (while signed in) and this extension
- Contains: Encrypted profiles, encrypted activity logs, encrypted settings

**Cloud Storage (Firebase)**
- Storage: Firebase Authentication (auth state, email, UID)
- Storage: Firebase Firestore (optional profile backups - premium feature only)
- Location: Google Cloud Platform servers (region: us-central1)
- Access: Only you (authenticated) via this extension
- Contains: Authentication credentials, optional encrypted profile backups

## How We Use Your Data

The extension uses your data **exclusively** for the following purposes:

1. **PII Substitution**: Replace your real information with aliases in AI chat requests
2. **Response Decoding**: Convert aliases back to real information in AI responses
3. **Statistics**: Show you usage statistics (all calculated locally)
4. **Activity Logging**: Provide debugging information (stored locally only)

## Data Retention

### Local Storage
- **Persistence**: Data persists until you manually delete it or uninstall the extension
- **Uninstall**: All local data is automatically deleted when you uninstall the extension
- **Manual Deletion**: You can clear all data anytime via Settings → Clear All Stats

### Cloud Storage (Firebase)
- **Authentication Data**: Retained while your account is active
- **Account Deletion**: You can delete your account via Settings → Account → Delete Account
  - This will permanently delete all cloud data (Firebase auth account, Firestore backups)
  - Local encrypted data will become inaccessible (encryption key lost)
- **Inactive Accounts**: We do not automatically delete inactive accounts
- **Data Retention After Deletion**: Firebase may retain logs for up to 180 days for security/audit purposes (per Google's data retention policy)

### Premium Subscription Data (Stripe)
- **Payment History**: Retained for 7 years for tax/legal compliance
- **Credit Card Data**: Never stored by us (Stripe handles all payment data)
- **Cancellation**: You can cancel your subscription anytime; billing data is retained per legal requirements

## Your Rights and Controls

You have complete control over your data:

1. **Access**: View all your profiles and settings in the extension popup
2. **Modify**: Edit or update profiles at any time
3. **Delete**:
   - Remove individual profiles
   - Clear all local data (Settings → Clear All Stats)
   - Delete your Firebase account (Settings → Account → Delete Account)
4. **Export**: Download your profiles as JSON files (Settings → Export Data)
5. **Disable**: Turn off protection temporarily or permanently
6. **Sign Out**: Sign out to lock your encrypted data (requires sign-in to decrypt)

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

1. **storage**: Store encrypted profiles and settings locally on your device
2. **unlimitedStorage**: Allow larger profile databases without quota limits (all data remains encrypted)
3. **activeTab**: Inject content scripts on AI service pages to enable PII substitution
4. **scripting**: Inject JavaScript to intercept and modify AI chat requests
5. **tabs**: Monitor when you navigate to AI services to update protection status badge
6. **identity**: Enable Google/Microsoft sign-in for authentication (encrypts your data with your Firebase UID)
7. **host_permissions**: Access specific AI service domains to perform substitutions:
   - `https://chat.openai.com/*` (ChatGPT)
   - `https://chatgpt.com/*` (ChatGPT)
   - `https://claude.ai/*` (Claude)
   - `https://gemini.google.com/*` (Gemini)
   - `https://perplexity.ai/*` (Perplexity)
   - `https://*.perplexity.ai/*` (Perplexity subdomains)
   - `https://copilot.microsoft.com/*` (Copilot)
   - `https://*.bing.com/*` (Copilot backend)

**Why These Permissions Are Necessary:**
- Without `host_permissions`, we cannot intercept requests to AI services
- Without `scripting`, we cannot inject code to perform substitutions
- Without `storage`, we cannot save your profiles
- Without `identity`, we cannot provide secure sign-in for encryption
- Without `tabs`, we cannot show you when protection is active

## Data Security

### Security Measures

- **Encryption**: AES-256-GCM encryption for all sensitive data
- **Key Separation**: Encryption key derived from Firebase UID (stored remotely), encrypted data stored locally
- **Authentication Required**: Must be signed in to decrypt your data
- **Manifest V3**: Uses latest Chrome extension security standards
- **Code Transparency**: Source code available on GitHub for audit
- **HTTPS Only**: All cloud communication uses encrypted HTTPS connections
- **No Third-Party Sharing**: We never share your data with advertisers or data brokers

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

- **Website**: https://promptblocker.com
- **GitHub Issues**: https://github.com/savevsgames/prompt-blocker/issues
- **Email**: support@promptblocker.com

## Open Source

This extension is open source. You can review the code, report issues, or contribute:

- **Repository**: https://github.com/savevsgames/prompt-blocker
- **License**: GNU Affero General Public License v3.0 (AGPL-3.0)

---

## GDPR Compliance (EU Users)

For users in the European Union, under GDPR:

- **Data Controller**: Prompt Blocker (developer: Greg Barker / Save Vs Games)
- **Data Processor**: Google LLC (Firebase services), Stripe Inc. (payments)
- **Legal Basis**:
  - **Consent**: You create and manage profiles voluntarily
  - **Contractual Necessity**: Processing needed to provide premium features (if purchased)
  - **Legitimate Interest**: Fraud prevention, security, service improvement
- **Data Processing**:
  - Local processing on your device (profiles, substitutions)
  - Cloud processing by Firebase (authentication, optional backups)
  - Payment processing by Stripe (premium subscriptions only)
- **Right to Access**: Full access via extension interface (Settings → Export Data)
- **Right to Deletion**: Delete account via Settings → Account → Delete Account
- **Right to Portability**: Export profiles as JSON (Settings → Export Data)
- **Right to Object**: Opt out of optional features (cloud sync, etc.)
- **Data Transfer**:
  - Firebase data may be processed in USA (Google's EU-US Data Privacy Framework certified)
  - Stripe data processed according to Stripe's DPA (EU-US Data Privacy Framework certified)
- **Data Protection Officer**: support@promptblocker.com
- **Supervisory Authority**: You have the right to lodge a complaint with your local data protection authority

## CCPA Compliance (California Users)

For California residents, under CCPA:

- **No Sale of Data**: We do not sell personal information
- **No Sharing**: We do not share personal information with third parties
- **Access & Deletion**: Full control via extension interface
- **No Discrimination**: Free features remain free regardless of privacy choices

---

## Third-Party Service Providers

We use the following third-party services to operate Prompt Blocker:

### Google Firebase
- **Services Used**: Authentication, Firestore (optional backups)
- **Data Shared**: Email, Firebase UID, encrypted profile backups (if enabled)
- **Privacy Policy**: https://firebase.google.com/support/privacy
- **Purpose**: User authentication and optional cloud sync

### Stripe
- **Services Used**: Payment processing (premium features only)
- **Data Shared**: Payment info, billing address, purchase history
- **Privacy Policy**: https://stripe.com/privacy
- **Purpose**: Process subscription payments securely
- **Note**: We never see or store your credit card numbers

### Google Cloud Platform
- **Services Used**: Firebase backend infrastructure
- **Data Shared**: Same as Firebase (encrypted backups, auth data)
- **Privacy Policy**: https://cloud.google.com/privacy
- **Purpose**: Host Firebase services

---

**Summary**: This extension stores sensitive data locally with AES-256-GCM encryption. Authentication and optional cloud backups use Firebase. Premium payments use Stripe. You have complete control over your data at all times. We never sell or share your data with advertisers or data brokers.
