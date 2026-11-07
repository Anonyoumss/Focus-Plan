import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from './client';

export type AuthListener = (user: User | null) => void;

/** Google sign-in via popup. Requires Firebase Auth configured. */
export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
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
