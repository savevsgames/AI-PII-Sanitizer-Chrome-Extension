/**
 * Firebase Initialization
 * Connects Chrome extension to Firebase Authentication and Firestore
 *
 * Context-Aware Auth:
 * - Service Worker: Uses firebase/auth/web-extension (no DOM required)
 * - Popup/Content: Uses firebase/auth (standard web auth)
 */
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
declare let app: FirebaseApp;
declare let db: Firestore;
declare let auth: Auth;
declare let authReady: Promise<Auth>;
export declare function waitForAuth(): Promise<Auth>;
export { app, auth, db, authReady };
//# sourceMappingURL=firebase.d.ts.map