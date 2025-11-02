# Firebase Setup Guide for PromptBlocker

**Complete step-by-step guide for setting up Firebase Authentication and Firestore for Chrome extension.**

This guide assumes **NO prior Firebase experience**. Every step is explained in detail with screenshots described.

---

## Table of Contents

- [Firebase Setup Guide for PromptBlocker](#firebase-setup-guide-for-promptblocker)
  - [Table of Contents](#table-of-contents)
  - [What is Firebase?](#what-is-firebase)
  - [Prerequisites](#prerequisites)
  - [Part 1: Create Firebase Account](#part-1-create-firebase-account)
  - [Part 2: Create Firebase Project](#part-2-create-firebase-project)
  - [Part 3: Set Up Firebase Authentication](#part-3-set-up-firebase-authentication)
  - [Part 4: Set Up Firestore Database](#part-4-set-up-firestore-database)
  - [Part 5: Get Configuration Keys](#part-5-get-configuration-keys)
  - [Part 6: Configure Chrome Extension](#part-6-configure-chrome-extension)
  - [Part 7: Deploy Security Rules](#part-7-deploy-security-rules)
  - [Part 8: Testing Your Setup](#part-8-testing-your-setup)
  - [Troubleshooting](#troubleshooting)
    - [Issue: "Firebase: Error (auth/invalid-api-key)"](#issue-firebase-error-authinvalid-api-key)
    - [Issue: "Missing or insufficient permissions"](#issue-missing-or-insufficient-permissions)
    - [Issue: "process.env.FIREBASE\_API\_KEY is undefined"](#issue-processenvfirebase_api_key-is-undefined)
    - [Issue: "Failed to load resource: net::ERR\_BLOCKED\_BY\_CLIENT"](#issue-failed-to-load-resource-neterr_blocked_by_client)
    - [Issue: Firebase CLI commands not found](#issue-firebase-cli-commands-not-found)
    - [Issue: "Project not found" when deploying rules](#issue-project-not-found-when-deploying-rules)
  - [Cost Breakdown](#cost-breakdown)
    - [Free Tier (Spark Plan) - $0/month](#free-tier-spark-plan---0month)
    - [Paid Tier (Blaze Plan) - Pay-as-you-go](#paid-tier-blaze-plan---pay-as-you-go)
    - [Setting Billing Alerts](#setting-billing-alerts)
  - [Next Steps](#next-steps)

---

## What is Firebase?

**Firebase** is Google's backend-as-a-service (BaaS) platform. Think of it as a pre-built backend server that handles:

- **Authentication** (sign-in/sign-up) - No need to build login forms or password storage
- **Database** (Firestore) - NoSQL cloud database that syncs in real-time
- **Hosting** - Deploy websites (we won't use this for the extension)
- **Cloud Functions** - Run server code without managing servers

**Key Terms:**
- **Project** - A container for all your Firebase services (like a folder for your app)
- **Firestore** - The database where we'll store user data (profiles, subscriptions)
- **Authentication (Auth)** - Handles user sign-in (Google, email/password, etc.)
- **Console** - The web dashboard where you configure Firebase (like WordPress admin panel)
- **SDK** - Software Development Kit - the JavaScript library we'll use to connect to Firebase
- **API Key** - A public identifier for your Firebase project (safe to include in code)
- **Security Rules** - Server-side rules that control who can read/write data

**Why Firebase for PromptBlocker?**
- ✅ **Free tier** - Up to 50,000 users/month free
- ✅ **Google integration** - Already trusted by Chrome users
- ✅ **Real-time sync** - Subscription status updates instantly
- ✅ **Serverless** - No server maintenance required
- ✅ **Secure** - Industry-standard security

---

## Prerequisites

Before starting, you need:

1. **Google Account** - You'll use this to sign in to Firebase
   - Can be personal Gmail or Google Workspace account
   - Will NOT be visible to users (they create their own accounts)

2. **Chrome Browser** - For testing the extension

3. **Credit Card (Optional)** - Only needed if you exceed free tier limits
   - Free tier: 50,000 users, 1GB storage, 10GB bandwidth/month
   - You can set billing alerts to avoid surprises
   - **You will NOT be charged automatically** - Firebase requires explicit upgrade

4. **Text Editor** - You already have this (VS Code, etc.)

5. **5-10 Minutes** - Time to complete setup

---

## Part 1: Create Firebase Account

**Step 1.1: Go to Firebase Console**

1. Open your browser and go to: **https://console.firebase.google.com/**
2. You'll see a page titled "Welcome to Firebase"

**Step 1.2: Sign In with Google**

1. Click **"Go to console"** button (top right)
2. Sign in with your Google account
3. Accept Terms of Service if prompted

**What you'll see:**
- A dashboard showing "Get started by adding Firebase to your app"
- Or, if you've used Firebase before, a list of existing projects

---

## Part 2: Create Firebase Project

A Firebase **project** is like a container for your app's backend. You'll create one project for PromptBlocker.

**Step 2.1: Create New Project**

1. Click **"Create a project"** (or **"Add project"** if you have existing projects)
2. You'll see a 3-step wizard

**Step 2.2: Enter Project Details (Step 1 of 3)**

1. **Project name**: Enter `promptblocker-prod` (or your preferred name)
   - This is just for you to identify the project
   - Users will NEVER see this name
   - Can use lowercase, numbers, hyphens
   - Example names: `promptblocker`, `pb-production`, `my-extension-prod`

2. Click **"Continue"**

**Step 2.3: Google Analytics (Step 2 of 3)**

1. You'll see: "Enable Google Analytics for this project?"
2. **Recommendation**: Toggle **OFF** (disable)
   - We don't need analytics for MVP
   - You can enable it later if needed
   - Saves setup time

3. Click **"Continue"** (or **"Create project"** if you disabled analytics)

**Step 2.4: Wait for Project Creation (Step 3 of 3)**

1. Firebase will create your project (takes 30-60 seconds)
2. You'll see: "Your new project is ready"
3. Click **"Continue"**

**What you'll see now:**
- Firebase Console dashboard
- Left sidebar with menu items: Authentication, Firestore, Storage, etc.
- Center panel showing "Get started by adding Firebase to your app"

---

## Part 3: Set Up Firebase Authentication

**Authentication** (or "Auth") handles user sign-in. We'll enable Google sign-in and Email/Password sign-in.

**Step 3.1: Navigate to Authentication**

1. In the left sidebar, click **"Authentication"**
2. If this is your first time, you'll see: "Get started with Firebase Authentication"
3. Click **"Get started"** button

**What you'll see:**
- A page with tabs: "Users", "Sign-in method", "Templates", "Usage", "Settings"
- Currently on "Users" tab (empty - no users yet)

**Step 3.2: Enable Sign-In Methods**

1. Click the **"Sign-in method"** tab (second tab at top)
2. You'll see a list of sign-in providers:
   - Email/Password
   - Google
   - Facebook
   - GitHub
   - etc.

**Step 3.3: Enable Google Sign-In**

1. Click on **"Google"** row in the list
2. A popup will appear: "Google"
3. Toggle **"Enable"** switch to ON (should turn blue)
4. You'll see two fields:
   - **Project support email**: Select your Google account email from dropdown
     - This email is shown in OAuth consent screen
     - Users see this if they have issues signing in
   - **Project public-facing name**: Auto-filled as your project name
     - This is what users see in the Google sign-in popup
     - Change to "PromptBlocker" (user-friendly name)

5. Click **"Save"** button

**What just happened:**
- Google sign-in is now enabled
- When users click "Sign in with Google", Firebase handles everything
- You don't need to write any OAuth code

**Step 3.4: Enable Email/Password Sign-In**

1. Back on "Sign-in method" tab, click **"Email/Password"** row
2. A popup will appear: "Email/Password"
3. Toggle **"Enable"** switch to ON
4. You'll see:
   - **Email/Password**: Enabled (what we just toggled)
   - **Email link (passwordless sign-in)**: Disabled (leave this OFF)

5. Click **"Save"** button

**What you'll see now:**
- "Sign-in method" tab shows:
  - ✅ Google (Enabled)
  - ✅ Email/Password (Enabled)
  - All others: Disabled

**Why both methods?**
- **Google sign-in**: Fastest, users trust Google, no password to remember
- **Email/Password**: Backup option for users without Google accounts

---

## Part 4: Set Up Firestore Database

**Firestore** is the database where we'll store:
- User profiles (name, email, tier)
- Subscription data (free/PRO, expiration)
- Extension settings (synced across devices)

**Step 4.1: Navigate to Firestore**

1. In the left sidebar, click **"Firestore Database"**
2. You'll see: "Cloud Firestore" with "Get started" button
3. Click **"Create database"** button

**Step 4.2: Choose Security Rules (Step 1 of 2)**

You'll see two options:

**Option 1: Production mode** (Recommended for now)
- Starts with secure rules: Deny all reads/writes
- We'll configure proper rules later
- **Select this option** (click the radio button)

**Option 2: Test mode** (NOT recommended)
- Allows all reads/writes for 30 days
- INSECURE - anyone can read/write your database
- Only use for quick testing, never production

**What to do:**
1. Select **"Start in production mode"** (first radio button)
2. Click **"Next"**

**Step 4.3: Choose Location (Step 2 of 2)**

1. You'll see: "Set up Cloud Firestore locations"
2. **Firestore location**: Select the region closest to your users
   - **North America**: `us-central1` (Iowa) - Good for USA/Canada
   - **Europe**: `europe-west1` (Belgium) - Good for EU
   - **Asia**: `asia-northeast1` (Tokyo) - Good for Asia-Pacific
   - **Multi-region**: `nam5` (US) or `eur3` (EU) - More expensive, better uptime

3. **⚠️ IMPORTANT**: Location **CANNOT** be changed later
   - Choose carefully based on your target audience
   - If unsure, choose `us-central1` (good global performance)

4. Click **"Enable"**

**Wait for database creation (30-60 seconds)**

**What you'll see now:**
- Firestore Database console
- "Cloud Firestore" tab with "Data", "Rules", "Indexes", "Usage" tabs
- Currently on "Data" tab
- Empty database (no collections yet)

**Firestore Key Terms:**
- **Collection** - Like a database table (e.g., "users", "subscriptions")
- **Document** - Like a row in a table (e.g., a specific user's data)
- **Field** - Like a column (e.g., "email", "tier", "createdAt")

**Example Structure:**
```
users (collection)
  ├─ userId123 (document)
  │   ├─ email: "john@example.com" (field)
  │   ├─ tier: "free" (field)
  │   └─ createdAt: timestamp (field)
  └─ userId456 (document)
      ├─ email: "jane@example.com"
      └─ tier: "pro"
```

---

## Part 5: Get Configuration Keys

Now we need to get the **Firebase configuration** - the keys that connect your Chrome extension to Firebase.

**Step 5.1: Go to Project Settings**

1. In the left sidebar, click the **⚙️ (gear icon)** at the very top
2. Click **"Project settings"** from the dropdown menu

**What you'll see:**
- Project settings page
- Tabs: General, Service accounts, Usage and billing, Cloud messaging, Integrations

**Step 5.2: Register Your App**

1. Scroll down to **"Your apps"** section (middle of the page)
2. You'll see icons for: iOS, Android, Web, Unity, Flutter
3. Click the **"</>" (Web)** icon

**What you'll see:**
- Popup: "Add Firebase to your web app"

**Step 5.3: Register Web App**

1. **App nickname**: Enter `PromptBlocker Extension`
   - This is just for you to identify the app
   - Users won't see this

2. **Firebase Hosting**: Leave checkbox **UNCHECKED**
   - We don't need hosting for a Chrome extension

3. Click **"Register app"**

**Step 5.4: Copy Configuration**

**⚠️ IMPORTANT: You'll need these values in Part 6**

You'll see a code snippet like this:

```javascript
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfH3jK2mL4nP5qR6sT7uV8wX9yZ0aB1cD",
  authDomain: "promptblocker-prod.firebaseapp.com",
  projectId: "promptblocker-prod",
  storageBucket: "promptblocker-prod.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl"
};
```

**What to do:**

1. Click **"Copy to clipboard"** button
2. Open a text editor (Notepad, VS Code, etc.)
3. **Paste and save** this configuration somewhere safe
   - You'll need it in Part 6
   - ⚠️ **Keep this file secure** - don't commit to public GitHub yet
   - These keys will go in a `.env` file later

4. Click **"Continue to console"**

**What each key means:**
- **apiKey**: Public identifier for your project (safe to expose in extension)
- **authDomain**: Where Firebase Auth redirects for sign-in
- **projectId**: Your project's unique ID (same as project name)
- **storageBucket**: Where Firebase Storage files would go (not used yet)
- **messagingSenderId**: For Firebase Cloud Messaging (not used yet)
- **appId**: Unique ID for this app registration

**Security Note:**
- These keys are **safe to include in your Chrome extension code**
- Firebase API Key is NOT a secret - it's meant to be public
- Security is enforced by Firebase Security Rules (server-side)
- Attackers cannot abuse these keys if your Security Rules are correct

---

## Part 6: Configure Chrome Extension

Now we'll add Firebase to your Chrome extension codebase.

**Step 6.1: Install Firebase SDK**

1. Open terminal in your project directory:
   ```bash
   cd H:/AI_Interceptor
   ```

2. Install Firebase:
   ```bash
   npm install firebase
   ```

3. Verify installation (should see firebase@11.x.x or similar):
   ```bash
   npm list firebase
   ```

**Step 6.2: Create Environment Configuration**

We'll store Firebase config in a `.env` file (not committed to Git).

1. Create `.env.local` file in project root:
   ```bash
   # On Windows (Git Bash):
   touch .env.local

   # On Windows (PowerShell):
   New-Item .env.local
   ```

2. Open `.env.local` in your text editor

3. Paste your Firebase configuration (from Part 5.4):
   ```bash
   # Firebase Configuration
   FIREBASE_API_KEY=AIzaSyDfH3jK2mL4nP5qR6sT7uV8wX9yZ0aB1cD
   FIREBASE_AUTH_DOMAIN=promptblocker-prod.firebaseapp.com
   FIREBASE_PROJECT_ID=promptblocker-prod
   FIREBASE_STORAGE_BUCKET=promptblocker-prod.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=123456789012
   FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789jkl
   ```

   **⚠️ Replace with YOUR actual values from Part 5.4**

4. Save the file

**Step 6.3: Add .env.local to .gitignore**

1. Open `.gitignore` file

2. Add this line if not already present:
   ```
   .env.local
   .env
   ```

3. Save `.gitignore`

**Why use .env file?**
- Keeps sensitive config out of Git history
- Easy to change between dev/staging/production
- Standard practice for web development

**Step 6.4: Create Firebase Initialization File**

We'll create a file that initializes Firebase when the extension loads.

1. Create `src/lib/firebase.ts`:
   ```typescript
   /**
    * Firebase Initialization
    * Connects Chrome extension to Firebase Authentication and Firestore
    */

   import { initializeApp } from 'firebase/app';
   import { getAuth, connectAuthEmulator } from 'firebase/auth';
   import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

   // Firebase configuration from environment variables
   const firebaseConfig = {
     apiKey: process.env.FIREBASE_API_KEY,
     authDomain: process.env.FIREBASE_AUTH_DOMAIN,
     projectId: process.env.FIREBASE_PROJECT_ID,
     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
     messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
     appId: process.env.FIREBASE_APP_ID,
   };

   // Initialize Firebase
   const app = initializeApp(firebaseConfig);

   // Initialize Firebase Authentication
   export const auth = getAuth(app);

   // Initialize Cloud Firestore
   export const db = getFirestore(app);

   // For local development with emulators (optional)
   if (process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATORS === 'true') {
     connectAuthEmulator(auth, 'http://localhost:9099');
     connectFirestoreEmulator(db, 'localhost', 8080);
     console.log('[Firebase] Connected to local emulators');
   }

   console.log('[Firebase] Initialized successfully');
   ```

2. Save the file

**What this code does:**
- Imports Firebase SDK modules
- Reads config from environment variables
- Initializes Firebase app
- Exports `auth` (for authentication) and `db` (for Firestore)
- Optionally connects to local emulators for testing

**Step 6.5: Configure Webpack to Handle Environment Variables**

We need to tell Webpack to replace `process.env.X` with actual values.

1. Install dotenv:
   ```bash
   npm install --save-dev dotenv webpack-dotenv-plugin
   ```

2. Open `webpack.config.js` (or create if it doesn't exist)

3. Add at the top:
   ```javascript
   const Webpack = require('webpack');
   const Dotenv = require('dotenv-webpack');
   ```

4. In the `plugins` array, add:
   ```javascript
   plugins: [
     new Dotenv({
       path: './.env.local',
       safe: false,
       systemvars: true,
     }),
     // ... other plugins
   ]
   ```

5. Save `webpack.config.js`

**Step 6.6: Update manifest.json**

Firebase needs certain permissions in your extension's manifest.

1. Open `manifest.json`

2. Add to `permissions` array:
   ```json
   "permissions": [
     "storage",
     "identity",
     "https://securetoken.googleapis.com/*",
     "https://www.googleapis.com/*",
     "https://identitytoolkit.googleapis.com/*"
   ]
   ```

3. Add `content_security_policy` (if not present):
   ```json
   "content_security_policy": {
     "extension_pages": "script-src 'self'; object-src 'self'"
   }
   ```

4. Save `manifest.json`

**Step 6.7: Build and Test**

1. Build the extension:
   ```bash
   npm run build
   ```

2. Check for errors in terminal
   - Should see "Build successful" or similar

3. Load extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select your `dist/` folder

4. Check console for Firebase initialization:
   - Right-click extension icon → "Inspect popup"
   - Look for: `[Firebase] Initialized successfully`

**If you see errors:**
- Check `.env.local` values match Firebase console
- Verify `webpack.config.js` dotenv plugin is configured
- Ensure all Firebase packages installed (`npm install`)

---

## Part 7: Deploy Security Rules

**Security Rules** control who can read/write data in Firestore. They run on Firebase servers (not in your extension).

**Step 7.1: Create Security Rules File**

1. Create `firestore.rules` in project root:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       // Helper function: Check if user is authenticated
       function isAuthenticated() {
         return request.auth != null;
       }

       // Helper function: Check if user is accessing their own data
       function isOwner(userId) {
         return isAuthenticated() && request.auth.uid == userId;
       }

       // Users collection: Users can only read/write their own document
       match /users/{userId} {
         allow read: if isOwner(userId);
         allow write: if isOwner(userId);
       }

       // Subscriptions collection: Users can only read their own subscription
       match /subscriptions/{userId} {
         allow read: if isOwner(userId);
         allow write: if false; // Only backend can write subscriptions (via Cloud Functions)
       }

       // Everything else: Deny by default
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

2. Save the file

**What these rules do:**
- Users can ONLY read/write their own data
- Subscriptions are read-only (we'll write them via Stripe webhooks later)
- Everything else is denied

**Step 7.2: Install Firebase CLI**

The Firebase Command Line Interface (CLI) lets you deploy rules from your terminal.

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Verify installation:
   ```bash
   firebase --version
   ```
   - Should show version number (e.g., `13.0.0`)

**Step 7.3: Login to Firebase CLI**

1. Run login command:
   ```bash
   firebase login
   ```

2. Your browser will open showing "Firebase CLI Login"

3. Select your Google account (same one used for Firebase Console)

4. Click "Allow" to grant Firebase CLI access

5. You'll see in terminal: "✔ Success! Logged in as your@email.com"

**Step 7.4: Initialize Firebase in Project**

1. Run init command:
   ```bash
   firebase init firestore
   ```

2. You'll see: "Which Firebase project do you want to use?"
   - Use arrow keys to select your project (e.g., `promptblocker-prod`)
   - Press Enter

3. "What file should be used for Firestore Rules?"
   - Press Enter to accept default: `firestore.rules`

4. "What file should be used for Firestore indexes?"
   - Press Enter to accept default: `firestore.indexes.json`

5. You'll see: "✔ Firebase initialization complete!"

**What just happened:**
- Created `firebase.json` (Firebase CLI configuration)
- Created `.firebaserc` (stores your project ID)
- Ready to deploy rules

**Step 7.5: Deploy Security Rules**

1. Deploy rules to Firebase:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. You'll see:
   ```
   === Deploying to 'promptblocker-prod'...

   ✔ Deploy complete!

   Project Console: https://console.firebase.google.com/project/promptblocker-prod/overview
   ```

**Step 7.6: Verify Rules Deployed**

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Click "Firestore Database" in left sidebar
4. Click "Rules" tab
5. You should see your rules (the code from Step 7.1)
6. Top of page shows: "Published: Just now"

**✅ Security Rules are now active!**

---

## Part 8: Testing Your Setup

Let's verify everything works before building the full authentication UI.

**Step 8.1: Test Firebase Connection**

1. Create `src/test-firebase.ts`:
   ```typescript
   import { auth, db } from './lib/firebase';
   import { signInAnonymously } from 'firebase/auth';
   import { doc, setDoc, getDoc } from 'firebase/firestore';

   async function testFirebase() {
     console.log('[Test] Starting Firebase test...');

     try {
       // Test 1: Authentication
       console.log('[Test] Testing auth...');
       const userCredential = await signInAnonymously(auth);
       console.log('[Test] ✅ Auth works! User ID:', userCredential.user.uid);

       // Test 2: Firestore write
       console.log('[Test] Testing Firestore write...');
       const testDoc = doc(db, `users/${userCredential.user.uid}`);
       await setDoc(testDoc, {
         testField: 'Hello Firebase!',
         timestamp: Date.now(),
       });
       console.log('[Test] ✅ Firestore write works!');

       // Test 3: Firestore read
       console.log('[Test] Testing Firestore read...');
       const docSnap = await getDoc(testDoc);
       if (docSnap.exists()) {
         console.log('[Test] ✅ Firestore read works! Data:', docSnap.data());
       } else {
         console.error('[Test] ❌ Document not found');
       }

       console.log('[Test] 🎉 All tests passed!');
     } catch (error) {
       console.error('[Test] ❌ Test failed:', error);
     }
   }

   testFirebase();
   ```

2. Run the test:
   ```bash
   npm run build
   # Then load extension in Chrome and check console
   ```

3. Expected output in console:
   ```
   [Test] Starting Firebase test...
   [Test] Testing auth...
   [Test] ✅ Auth works! User ID: abc123...
   [Test] Testing Firestore write...
   [Test] ✅ Firestore write works!
   [Test] Testing Firestore read...
   [Test] ✅ Firestore read works! Data: { testField: 'Hello Firebase!', timestamp: 1234567890 }
   [Test] 🎉 All tests passed!
   ```

**If you see errors:**
- Check `.env.local` values
- Verify Security Rules deployed (Step 7.6)
- Check Firebase Console → Authentication → Users (should see anonymous user)
- Check Firebase Console → Firestore → Data (should see `users` collection)

**Step 8.2: Verify in Firebase Console**

1. Go to Firebase Console
2. Click "Authentication" → "Users" tab
   - Should see 1 anonymous user with UID matching console log

3. Click "Firestore Database" → "Data" tab
   - Should see `users` collection
   - Inside: document with your user's UID
   - Inside document: `testField` and `timestamp` fields

**✅ Firebase is working correctly!**

---

## Troubleshooting

### Issue: "Firebase: Error (auth/invalid-api-key)"

**Cause**: Wrong API key in `.env.local`

**Fix**:
1. Go to Firebase Console → Project Settings → Your apps
2. Copy the `apiKey` value again
3. Update `.env.local`
4. Rebuild: `npm run build`

---

### Issue: "Missing or insufficient permissions"

**Cause**: Security rules not deployed or wrong

**Fix**:
1. Verify `firestore.rules` file exists
2. Deploy rules: `firebase deploy --only firestore:rules`
3. Check Firebase Console → Firestore → Rules tab
4. Look for "Published: [recent time]"

---

### Issue: "process.env.FIREBASE_API_KEY is undefined"

**Cause**: Webpack not loading `.env.local`

**Fix**:
1. Install: `npm install --save-dev dotenv-webpack`
2. Verify `webpack.config.js` has `Dotenv` plugin
3. Check `.env.local` has no syntax errors
4. Rebuild: `npm run build`

---

### Issue: "Failed to load resource: net::ERR_BLOCKED_BY_CLIENT"

**Cause**: Ad blocker blocking Firebase domains

**Fix**:
1. Disable ad blocker for your extension
2. Or whitelist `*.googleapis.com` and `*.firebaseapp.com`

---

### Issue: Firebase CLI commands not found

**Cause**: Firebase CLI not installed globally

**Fix**:
```bash
npm install -g firebase-tools
firebase --version
```

---

### Issue: "Project not found" when deploying rules

**Cause**: Not logged in or wrong project selected

**Fix**:
```bash
firebase login
firebase use --add
# Select your project from list
firebase deploy --only firestore:rules
```

---

## Cost Breakdown

Firebase pricing is **pay-as-you-go** with a **generous free tier**.

### Free Tier (Spark Plan) - $0/month

**Authentication:**
- ✅ 50,000 phone authentications/month
- ✅ Unlimited Google Sign-In
- ✅ Unlimited Email/Password sign-ins

**Firestore:**
- ✅ 50,000 reads/day (1.5M/month)
- ✅ 20,000 writes/day (600K/month)
- ✅ 20,000 deletes/day (600K/month)
- ✅ 1 GB storage
- ✅ 10 GB/month bandwidth

**Real-World Estimates:**
- **1,000 active users**: Well within free tier ✅
- **10,000 active users**: Likely within free tier ✅
- **50,000 active users**: May need paid plan (~$25-50/month)

### Paid Tier (Blaze Plan) - Pay-as-you-go

**When you exceed free tier:**
- Firestore reads: $0.06 per 100K reads
- Firestore writes: $0.18 per 100K writes
- Storage: $0.18/GB/month
- Bandwidth: $0.12/GB

**Example costs for 100,000 users:**
- Authentication: Still free (Google Sign-In is free)
- Firestore (10 operations/user/day): ~$50-100/month
- Total: ~$50-100/month

**Cost protection:**
- Set billing budget alerts in Firebase Console
- Set daily limits in Firestore (optional)
- You can downgrade to free tier anytime

### Setting Billing Alerts

1. Firebase Console → ⚙️ Project settings
2. "Usage and billing" tab
3. Click "Details & settings" under Billing
4. Click "Create budget" in Cloud Console
5. Set alert at: $10, $25, $50, $100
6. Enter your email for notifications

---

## Next Steps

✅ **You've completed Firebase setup!**

**What you have now:**
- ✅ Firebase project created
- ✅ Authentication enabled (Google + Email/Password)
- ✅ Firestore database ready
- ✅ Security rules deployed
- ✅ Chrome extension connected to Firebase

**What's next:**
1. Build authentication UI (sign-in popup)
2. Create user profile on first sign-in
3. Implement tier checking (free vs PRO)
4. Sync user data across devices
5. Set up Stripe for payments (Phase 3)

**Resources:**
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Pricing Calculator](https://firebase.google.com/pricing)

---

**Questions?**
- Check [Firebase StackOverflow](https://stackoverflow.com/questions/tagged/firebase)
- Firebase Support: https://firebase.google.com/support
- This project's GitHub Issues (once public)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-01
**Author:** Claude Code + PromptBlocker Team
