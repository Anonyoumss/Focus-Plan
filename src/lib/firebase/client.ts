import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
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

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Reads the public Firebase web config from VITE_FIREBASE_* env vars.
 * Returns null when any required value is missing so the app can run as a
 * pure guest without Firebase.
 */
export function getFirebaseConfig(): FirebaseWebConfig | null {
  const env = import.meta.env;
  const config: FirebaseWebConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: env.VITE_FIREBASE_APP_ID ?? '',
  };
  const complete = Object.values(config).every((v) => v.trim().length > 0);
  return complete ? config : null;
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null;
}

export function emulatorsEnabled(): boolean {
  return import.meta.env.VITE_USE_EMULATORS === 'true';
}

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
