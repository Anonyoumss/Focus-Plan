import {
  doc,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { getFirebaseDb } from './client';
import { creditWallet } from './groups';

/**
 * Referral program.
 *
 * Layout:
 *   referralCodes/{CODE}              public doc: {code, ownerUid, alias, uses, maxUses, createdAt}
 *   users/{uid}/referralCode/main     owner's code pointer {code}
 *   users/{uid}/referral/{CODE}       redemption marker (create-only)
 *
 * Reward: 15 Focus Coins to the redeemer, credited through the rule-
 * enforced wallet ledger (coin award delta <= 20 is allowed by
 * walletDeltaOk). Self-referral, double redemption and over-cap uses are
 * rejected inside one Firestore transaction.
 */

export const REFERRAL_BONUS_COINS = 15;
const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing chars

function genCode(): string {
  let s = '';
  for (let i = 0; i < 8; i++) {
    s += REFERRAL_CODE_ALPHABET[Math.floor(Math.random() * REFERRAL_CODE_ALPHABET.length)];
  }
  return `REF${s}`;
}

export interface ReferralCodeDoc {
  code: string;
  ownerUid: string;
  alias: string;
  uses: number;
  maxUses: number;
  createdAt: number;
}

function db() { return getFirebaseDb(); }

/** Returns the caller's existing referral code, creating one if needed. */
export async function getOrCreateReferralCode(uid: string, alias: string): Promise<string> {
  const pointerRef = doc(db(), 'users', uid, 'referralCode', 'main');
  const snap = await getDoc(pointerRef);
  if (snap.exists()) {
    const code = (snap.data() as { code?: string }).code;
    if (code) return code;
  }
  // Try a few codes in case of collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genCode();
    const codeRef = doc(db(), 'referralCodes', code);
    const exists = await getDoc(codeRef);
    if (exists.exists()) continue;
    await runTransaction(db(), async (txn) => {
      txn.set(codeRef, {
        code,
        ownerUid: uid,
        alias: alias.slice(0, 60) || 'Friend',
        uses: 0,
        maxUses: 100,
        createdAt: Date.now(),
      } satisfies ReferralCodeDoc);
      txn.set(pointerRef, { code });
    });
    return code;
  }
  throw new Error('Could not allocate a referral code');
}

/** Public preview for the landing page — returns alias or null. */
export async function resolveReferralCode(code: string): Promise<{ alias: string; reward: number } | null> {
  const snap = await getDoc(doc(db(), 'referralCodes', code.trim().toUpperCase()));
  if (!snap.exists()) return null;
  const d = snap.data() as ReferralCodeDoc;
  return { alias: d.alias || 'A friend', reward: REFERRAL_BONUS_COINS };
}

export type RedeemResult =
  | { ok: true; bonus: number }
  | { ok: false; reason: 'invalid' | 'self' | 'already' | 'full' };

/** Redeems a code for the signed-in user. Atomic: marker + counter + wallet. */
export async function redeemReferralCode(uid: string, rawCode: string): Promise<RedeemResult> {
  const code = rawCode.trim().toUpperCase();
  if (!/^REF[A-Z0-9]{8}$/.test(code)) return { ok: false, reason: 'invalid' };
  const codeRef = doc(db(), 'referralCodes', code);
  const markerRef = doc(db(), 'users', uid, 'referral', code);
  try {
    await runTransaction(db(), async (txn) => {
      const [codeSnap, markerSnap] = await Promise.all([txn.get(codeRef), txn.get(markerRef)]);
      if (!codeSnap.exists()) throw new Error('invalid');
      const d = codeSnap.data() as ReferralCodeDoc;
      if (d.ownerUid === uid) throw new Error('self');
      if (markerSnap.exists()) throw new Error('already');
      if ((d.uses ?? 0) >= (d.maxUses ?? 100)) throw new Error('full');
      txn.set(markerRef, { code, redeemedAt: Date.now(), bonusCoins: REFERRAL_BONUS_COINS });
      txn.update(codeRef, { uses: (d.uses ?? 0) + 1 });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'invalid') return { ok: false, reason: 'invalid' };
    if (msg === 'self') return { ok: false, reason: 'self' };
    if (msg === 'already') return { ok: false, reason: 'already' };
    if (msg === 'full') return { ok: false, reason: 'full' };
    throw e;
  }
  await creditWallet(uid, REFERRAL_BONUS_COINS, 0, 'referral_bonus', 'referral');
  return { ok: true, bonus: REFERRAL_BONUS_COINS };
}

export interface ReferralStats {
  code: string;
  uses: number;
  maxUses: number;
}

export async function getReferralStats(uid: string): Promise<ReferralStats | null> {
  const pointerSnap = await getDoc(doc(db(), 'users', uid, 'referralCode', 'main'));
  const code = (pointerSnap.data() as { code?: string } | undefined)?.code;
  if (!code) return null;
  const codeSnap = await getDoc(doc(db(), 'referralCodes', code));
  if (!codeSnap.exists()) return null;
  const d = codeSnap.data() as ReferralCodeDoc;
  return { code, uses: d.uses ?? 0, maxUses: d.maxUses ?? 100 };
}
