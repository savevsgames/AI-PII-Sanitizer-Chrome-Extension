# Quick Firebase Deployment Guide

**You're at Part 7 of the Firebase Setup!**

## What You Need to Do Now:

### Step 1: Run the Setup Script

Open **Git Bash** (or Command Prompt if you prefer) in your project directory and run:

```bash
# Git Bash / Unix / Mac:
./firebase-setup.sh

# Windows Command Prompt:
firebase-setup.bat
```

### What Will Happen:

1. **Firebase Login**
   - Your browser will open
   - Sign in with the same Google account you used to create Firebase project
   - You'll see: "✔ Success! Logged in as your@email.com"

2. **Select Project**
   - You'll see a list of your Firebase projects
   - Use arrow keys to select: **promptblocker-prod**
   - Press Enter
   - You'll see: "✔ Using project promptblocker-prod"

3. **Deploy Security Rules**
   - Rules will be uploaded to Firebase
   - You'll see: "✔ Deploy complete!"
   - Takes ~5-10 seconds

### Expected Output:

```
==========================================
Firebase Setup for PromptBlocker
==========================================

Step 1: Logging in to Firebase...
✔ Success! Logged in as your@email.com

Step 2: Setting Firebase project...
✔ Using project promptblocker-prod (promptblocker-prod)

Step 3: Deploying Firestore security rules...
=== Deploying to 'promptblocker-prod'...

i  deploying firestore
i  firestore: checking firestore.rules for compilation errors...
✔  firestore: rules file firestore.rules compiled successfully
i  firestore: uploading rules firestore.rules...
✔  firestore: released rules firestore.rules

✔  Deploy complete!

==========================================
✅ Firebase setup complete!
==========================================
```

### Step 2: Verify in Firebase Console

1. Go to: https://console.firebase.google.com/
2. Select your project: **promptblocker-prod**
3. Click **"Firestore Database"** in left sidebar
4. Click **"Rules"** tab
5. You should see your security rules
6. Top of page shows: **"Published: Just now"**

### Troubleshooting:

**Error: "Command not found: firebase"**
- Run: `npm install -g firebase-tools`
- Verify: `firebase --version`

**Error: "No project found"**
- Make sure you selected the right project during setup
- Manually set: `firebase use promptblocker-prod`

**Error: "Permission denied"**
- Make script executable: `chmod +x firebase-setup.sh`
- Or run commands manually (see below)

### Manual Deployment (If Script Fails):

```bash
# 1. Login
firebase login

# 2. List your projects (to verify)
firebase projects:list

# 3. Set project
firebase use promptblocker-prod

# 4. Deploy rules
firebase deploy --only firestore:rules
```

## What's Next After Deployment:

✅ **Part 7 Complete!** You now have:
- Firestore database with secure access rules
- Users can only access their own data
- Ready for authentication implementation

### Move to Part 8: Test Your Setup

Create a test file to verify Firebase connection:

```typescript
// src/test-firebase.ts
import { auth, db } from './lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

async function testFirebase() {
  console.log('[Test] Testing Firebase connection...');

  try {
    // Test auth
    const userCred = await signInAnonymously(auth);
    console.log('[Test] ✅ Auth works! User:', userCred.user.uid);

    // Test Firestore write
    const testDoc = doc(db, `users/${userCred.user.uid}`);
    await setDoc(testDoc, {
      email: 'test@example.com',
      createdAt: Date.now(),
      tier: 'free',
    });
    console.log('[Test] ✅ Firestore write works!');

    // Test Firestore read
    const snapshot = await getDoc(testDoc);
    console.log('[Test] ✅ Firestore read works!', snapshot.data());

  } catch (error) {
    console.error('[Test] ❌ Test failed:', error);
  }
}

testFirebase();
```

Then:
1. Build: `npm run build`
2. Load extension in Chrome
3. Check console for test results

---

**Questions?**
- Check main Firebase setup guide: `docs/setup/FIREBASE_SETUP_GUIDE.md`
- Firebase Console: https://console.firebase.google.com/
- Let me know if you hit any issues!
