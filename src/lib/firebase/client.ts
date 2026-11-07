import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { emulatorsEnabled, getFirebaseConfig } from './config';
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  type Firestore,
} from 'firebase/firestore';

export { emulatorsEnabled, getFirebaseConfig, isFirebaseConfigured } from './config';

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const config = getFirebaseConfig();
    if (!config) throw new Error('Firebase is not configured');
    app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    const firebaseApp = getFirebaseApp();
    authInstance = getAuth(firebaseApp);
    if (emulatorsEnabled() && !authEmulatorConnected) {
      authEmulatorConnected = true;
      connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', {
        disableWarnings: true,
      });
    }
  }
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    const firebaseApp = getFirebaseApp();
    try {
      dbInstance = initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache(),
      });
    } catch {
      // initializeFirestore throws if a default instance already exists
      // (e.g. after HMR); reuse it.
      dbInstance = getFirestore(firebaseApp);
    }
    if (emulatorsEnabled() && !firestoreEmulatorConnected) {
      firestoreEmulatorConnected = true;
      connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
    }
  }
  return dbInstance;
}
