/**
 * Firebase Initialization for Service Worker
 * Uses firebase/auth/web-extension (static import)
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth as getWebExtAuth, Auth, indexedDBLocalPersistence } from 'firebase/auth/web-extension';
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
    `[Firebase SW] Missing required environment variables: ${missingKeys.map(k => `FIREBASE_${k.toUpperCase()}`).join(', ')}`
  );
}

console.log('[Firebase SW] Initializing for service worker...');

// Initialize Firebase App and Firestore (synchronous)
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  // Firestore emulator works in service worker
  if (process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATORS === 'true') {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('[Firebase SW] Connected Firestore to local emulator');
  }

  console.log('[Firebase SW] App initialized successfully');
  console.log('[Firebase SW] Project ID:', firebaseConfig.projectId);
} catch (error) {
  console.error('[Firebase SW] App initialization failed:', error);
  throw error;
}

// Auth initialization (uses web-extension module)
let authReady: Promise<Auth>;

authReady = (async () => {
  try {
    console.log('[Firebase SW] Initializing web-extension auth...');

    auth = getWebExtAuth(app);
    console.log('[Firebase SW] Auth instance created');

    // Enable IndexedDB persistence for service worker
    await auth.setPersistence(indexedDBLocalPersistence);
    console.log('[Firebase SW] Persistence set to IndexedDB');

    console.log('[Firebase SW] ✅ Auth initialized successfully');
    return auth;
  } catch (error) {
    console.error('[Firebase SW] Auth initialization failed:', error);
    throw error;
  }
})();

// Helper function to ensure auth is ready before using
export async function waitForAuth(): Promise<Auth> {
  return authReady;
}

export { app, auth, db, authReady };
