/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Pure env-var config — no Firebase SDK imports so it stays out of the
// initial bundle and works in guest mode with zero config.

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

