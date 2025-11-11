/**
 * Firebase Initialization for Service Worker
 * Uses firebase/auth/web-extension (static import)
 */
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth/web-extension';
import { Firestore } from 'firebase/firestore';
declare let app: FirebaseApp;
declare let db: Firestore;
declare let auth: Auth;
declare let authReady: Promise<Auth>;
export declare function waitForAuth(): Promise<Auth>;
export { app, auth, db, authReady };
//# sourceMappingURL=firebase-sw.d.ts.map