# Firebase Connection Test Instructions

## Prerequisites

Before running the test, enable Anonymous Authentication in Firebase:

### Step 1: Enable Anonymous Auth

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: **promptblocker-prod**
3. Click **"Authentication"** in left sidebar
4. Click **"Sign-in method"** tab
5. Scroll down and click **"Anonymous"**
6. Toggle **"Enable"** switch to ON
7. Click **"Save"**

✅ Anonymous authentication is now enabled!

---

## Running the Test

### Option A: Test in Browser Console (Easiest)

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Load extension in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select your `dist/` folder

3. **Open extension popup:**
   - Click the extension icon in toolbar
   - Right-click popup → "Inspect"
   - This opens DevTools

4. **Run test in console:**
   Paste this code into the Console tab:

   ```javascript
   // Import Firebase
   import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js').then(async ({ initializeApp }) => {
     const { getAuth, signInAnonymously, signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
     const { getFirestore, doc, setDoc, getDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

     const firebaseConfig = {
       apiKey: "AIzaSyButCAKxUJoyaq_4ITE5Wvtcb7BZ5JWhyQ",
       authDomain: "promptblocker-prod.firebaseapp.com",
       projectId: "promptblocker-prod",
       storageBucket: "promptblocker-prod.firebasestorage.app",
       messagingSenderId: "861822607891",
       appId: "1:861822607891:web:69b2213902528793f715e6"
     };

     console.log('[Test] Initializing Firebase...');
     const app = initializeApp(firebaseConfig);
     const auth = getAuth(app);
     const db = getFirestore(app);

     console.log('[Test] Signing in anonymously...');
     const userCred = await signInAnonymously(auth);
     console.log('[Test] ✅ Authenticated! User ID:', userCred.user.uid);

     const testDoc = doc(db, `users/${userCred.user.uid}`);
     const testData = { email: 'test@example.com', createdAt: Date.now(), tier: 'free' };

     console.log('[Test] Writing to Firestore...');
     await setDoc(testDoc, testData);
     console.log('[Test] ✅ Write successful!');

     console.log('[Test] Reading from Firestore...');
     const snapshot = await getDoc(testDoc);
     console.log('[Test] ✅ Read successful!', snapshot.data());

     console.log('[Test] Cleaning up...');
     await deleteDoc(testDoc);
     await signOut(auth);
     console.log('[Test] ✅ All tests passed! 🎉');
   });
   ```

### Option B: Add Test to Background Script (Advanced)

1. **Temporarily modify `src/background/serviceWorker.ts`:**

   Add this at the very top of the file (after imports):

   ```typescript
   // TEMPORARY: Firebase connection test
   import { auth, db } from '../lib/firebase';
   import { signInAnonymously, signOut } from 'firebase/auth';
   import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

   async function testFirebaseConnection() {
     console.log('[Firebase Test] Starting...');
     try {
       const userCred = await signInAnonymously(auth);
       console.log('[Firebase Test] ✅ Auth works! User:', userCred.user.uid);

       const testDoc = doc(db, `users/${userCred.user.uid}`);
       await setDoc(testDoc, { email: 'test@example.com', createdAt: Date.now(), tier: 'free' });
       console.log('[Firebase Test] ✅ Firestore write works!');

       const snapshot = await getDoc(testDoc);
       console.log('[Firebase Test] ✅ Firestore read works!', snapshot.data());

       await deleteDoc(testDoc);
       await signOut(auth);
       console.log('[Firebase Test] ✅ All tests passed! 🎉');
     } catch (error) {
       console.error('[Firebase Test] ❌ Failed:', error);
     }
   }

   // Run test when extension loads
   testFirebaseConnection();
   ```

2. **Build and reload extension:**
   ```bash
   npm run build
   ```

3. **Check background script console:**
   - Go to `chrome://extensions/`
   - Find your extension
   - Click "service worker" link (or "Inspect views: background page")
   - Look for test output in console

4. **IMPORTANT: Remove test code after verification!**

---

## Expected Output

You should see:

```
[Firebase Test] Starting...
[Firebase Test] ✅ Auth works! User: abc123xyz...
[Firebase Test] ✅ Firestore write works!
[Firebase Test] ✅ Firestore read works! { email: 'test@example.com', createdAt: 1234567890, tier: 'free' }
[Firebase Test] ✅ All tests passed! 🎉
```

---

## Verify in Firebase Console

1. **Check Authentication:**
   - Firebase Console → Authentication → Users
   - Should see an anonymous user (or it will be deleted after test)

2. **Check Firestore:**
   - Firebase Console → Firestore Database → Data
   - During test: You'll see `users` collection with test document
   - After test: Document should be deleted (cleanup)

---

## Troubleshooting

### Error: "auth/operation-not-allowed"
**Fix:** Enable Anonymous authentication (see Step 1 above)

### Error: "Missing or insufficient permissions"
**Fix:**
- Verify security rules deployed: `firebase deploy --only firestore:rules`
- Check Firebase Console → Firestore → Rules tab

### Error: "Firebase: Error (auth/invalid-api-key)"
**Fix:**
- Check `.env` file has correct API key
- Rebuild: `npm run build`

### Error: "process.env.FIREBASE_API_KEY is undefined"
**Fix:**
- Verify `dotenv-webpack` is installed
- Check `webpack.config.js` has Dotenv plugin
- Rebuild: `npm run build`

---

## Once Tests Pass

✅ **Part 8 Complete!** Firebase is working correctly:
- Authentication works
- Firestore read/write works
- Security rules are enforced

**Next:** Build authentication UI (sign-in popup)

