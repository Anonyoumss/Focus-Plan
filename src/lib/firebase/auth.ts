import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from './client';
import { isNativeApp, nativeGoogleIdToken } from '../native/capacitor';

export type AuthListener = (user: User | null) => void;

/** Google sign-in via popup. Requires Firebase Auth configured. */
export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  // Inside the Android WebView the popup flow cannot work; the native
  // Google sign-in plugin returns an ID token exchanged as a credential.
  if (isNativeApp()) {
    const idToken = await nativeGoogleIdToken();
    if (!idToken) throw new Error('Google sign-in unavailable on this device');
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  }
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}

/** Subscribe to auth state. Returns unsubscribe. */
export function subscribeAuth(listener: AuthListener): () => void {
  return onAuthStateChanged(getFirebaseAuth(), listener);
}
