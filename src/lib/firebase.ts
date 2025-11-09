/**
 * Firebase Initialization
 * Connects Chrome extension to Firebase Authentication and Firestore
 *
 * Context-Aware Auth:
 * - Service Worker: Uses firebase/auth/web-extension (no DOM required)
 * - Popup/Content: Uses firebase/auth (standard web auth)
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Validate configuration
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  throw new Error(
    `[Firebase] Missing required environment variables: ${missingKeys.map(k => `FIREBASE_${k.toUpperCase()}`).join(', ')}`
  );
}

// Detect execution context
const isServiceWorker = typeof document === 'undefined';
const contextName = isServiceWorker ? 'SERVICE WORKER' : 'POPUP/CONTENT';

// Initialize Firebase App and Firestore (synchronous)
let app: FirebaseApp;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  // Firestore emulator works in both contexts
  if (process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATORS === 'true') {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('[Firebase] Connected Firestore to local emulator');
  }

  console.log('[Firebase] App initialized successfully');
  console.log('[Firebase] Context:', contextName);
  console.log('[Firebase] Project ID:', firebaseConfig.projectId);
} catch (error) {
  console.error('[Firebase] App initialization failed in', contextName, ':', error);
  throw error;
}

// Auth initialization (async - context-dependent)
// This will be set after async initialization completes
let auth: Auth = null as any;  // Temporary null, will be set immediately
let authReady: Promise<Auth>;

// Initialize auth based on context (runs immediately)
authReady = (async () => {
  try {
    if (isServiceWorker) {
      // Service Worker: Use web-extension auth module (no DOM required)
      const { getAuth: getWebExtAuth, indexedDBLocalPersistence } = await import('firebase/auth/web-extension');
      auth = getWebExtAuth(app);

      // Enable IndexedDB persistence for service worker
      await auth.setPersistence(indexedDBLocalPersistence);

      console.log('[Firebase] ✅ Initialized with WEB-EXTENSION auth for service worker');
    } else {
      // Popup/Content: Use standard auth module (requires DOM)
      const { getAuth: getStandardAuth, connectAuthEmulator } = await import('firebase/auth');
      auth = getStandardAuth(app);

      console.log('[Firebase] ✅ Initialized with STANDARD auth for popup/content');

      // Auth emulator only in popup/content (service worker doesn't support it)
      if (process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATORS === 'true') {
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log('[Firebase] Connected auth to local emulator');
      }
    }

    return auth;
  } catch (error) {
    console.error('[Firebase] Auth initialization failed in', contextName, ':', error);
    throw error;
  }
})();

// Helper function to ensure auth is ready before using
export async function waitForAuth(): Promise<Auth> {
  return authReady;
}

export { app, auth, db, authReady };
