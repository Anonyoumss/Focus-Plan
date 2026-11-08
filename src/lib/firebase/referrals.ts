/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  doc,
  getDoc,
  runTransaction,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import { getFirebaseDb } from './client';
import { isFirebaseConfigured } from './config';

export interface ReferralCodeDoc {
  code: string;
  ownerUid: string;
  alias: string;
  rewardCoins: number;
  usesCount: number;
  createdAt: number;
}

export interface ReferralRedemptionDoc {
  referredByCode: string;
  referredByUid: string;
  redeemedAt: number;
  rewardCoins: number;
}

export interface ReferralStats {
  code: string | null;
  usesCount: number;
  totalReferred: number;
  earnedCoins: number;
  coinsEarned: number;
  hasRedeemed: boolean;
  referredByCode?: string;
}

const REFERRAL_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const REFERRAL_REWARD_COINS = 15;

export function genReferralCode(): string {
  let code = 'REF';
  for (let i = 0; i < 5; i++) {
    code += REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)];
  }
  return code;
}

export function normalizeReferralCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16);
}

function db(): Firestore {
  return getFirebaseDb();
}

/**
 * Generates and claims a personal referral code in Firestore for the signed-in user.
 * Re-uses an existing code if already created.
 */
export async function getOrCreateReferralCode(
  uid: string,
  alias: string
): Promise<ReferralCodeDoc> {
  if (!isFirebaseConfigured()) {
    throw new Error('firebase-not-configured');
  }

  const firestore = db();
  const myCodeRef = doc(firestore, 'users', uid, 'referral', 'myCode');
  const existingMyCodeSnap = await getDoc(myCodeRef).catch(() => null);

  if (existingMyCodeSnap?.exists()) {
    const existingCode = existingMyCodeSnap.data().code as string;
    const codeSnap = await getDoc(doc(firestore, 'referralCodes', existingCode)).catch(() => null);
    if (codeSnap?.exists()) {
      return codeSnap.data() as ReferralCodeDoc;
    }
  }

  // Generate a collision-resistant 8-character referral code
  let newCode = genReferralCode();
  let attempts = 0;
  while (attempts < 5) {
    const checkSnap = await getDoc(doc(firestore, 'referralCodes', newCode)).catch(() => null);
    if (!checkSnap?.exists()) break;
    newCode = genReferralCode();
    attempts++;
  }

  const now = Date.now();
  const referralData: ReferralCodeDoc = {
    code: newCode,
    ownerUid: uid,
    alias: (alias || 'Member').slice(0, 60),
    rewardCoins: REFERRAL_REWARD_COINS,
    usesCount: 0,
    createdAt: now,
  };

  await setDoc(doc(firestore, 'referralCodes', newCode), referralData);
  await setDoc(myCodeRef, { code: newCode, createdAt: now });

  return referralData;
}

export interface RedeemResult {
  ok: boolean;
  rewardCoins?: number;
  referrerAlias?: string;
  error?: 'self_referral' | 'already_redeemed' | 'not_found' | 'firebase_not_configured' | 'generic';
}

/**
 * Resolves a referral code from Firestore. Never returns mock or hardcoded data.
 */
export async function resolveReferralCode(rawCode: string): Promise<ReferralCodeDoc | null> {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const firestore = db();
  const normalized = normalizeReferralCode(rawCode);
  const snap = await getDoc(doc(firestore, 'referralCodes', normalized)).catch(() => null);
  if (!snap || !snap.exists()) {
    return null;
  }

  return snap.data() as ReferralCodeDoc;
}

/**
 * Redeems a referral code for a signed-in user.
 * Validates self-referral, enforces one-time redemption per user,
 * updates usesCount, and credits the 15-coin referral bonus to the wallet with matching ledger entry.
 */
export async function redeemReferralCode(
  uid: string,
  code: string
): Promise<RedeemResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, error: 'firebase_not_configured' };
  }

  try {
    const firestore = db();
    const referral = await resolveReferralCode(code);
    if (!referral) {
      return { ok: false, error: 'not_found' };
    }

    if (referral.ownerUid === uid) {
      return { ok: false, error: 'self_referral' };
    }

    const redemptionRef = doc(firestore, 'users', uid, 'referral', 'redemption');
    const existingRedemption = await getDoc(redemptionRef).catch(() => null);
    if (existingRedemption?.exists()) {
      return { ok: false, error: 'already_redeemed' };
    }

    const now = Date.now();
    const rewardCoins = referral.rewardCoins || REFERRAL_REWARD_COINS;
    const ledgerId = `tx_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const walletRef = doc(firestore, 'users', uid, 'wallet', 'main');
    const ledgerRef = doc(firestore, 'users', uid, 'ledger', ledgerId);
    const codeRef = doc(firestore, 'referralCodes', referral.code);

    await runTransaction(firestore, async (tx) => {
      const walletSnap = await tx.get(walletRef);
      const codeSnap = await tx.get(codeRef);

      const oldCoins = walletSnap.exists() ? (walletSnap.data().coins as number) : 0;
      const oldFp = walletSnap.exists() ? (walletSnap.data().focusPoints as number) : 0;
      const currentUses = codeSnap.exists() ? ((codeSnap.data().usesCount as number) || 0) : 0;

      // Record one-time redemption
      tx.set(redemptionRef, {
        referredByCode: referral.code,
        referredByUid: referral.ownerUid,
        redeemedAt: now,
        rewardCoins,
      });

      // Increment referral usage count
      tx.update(codeRef, {
        usesCount: currentUses + 1,
      });

      // Append-only ledger row
      tx.set(ledgerRef, {
        userId: uid,
        amount: rewardCoins,
        reason: `Referral bonus via ${referral.alias} (${referral.code})`,
        itemId: 'referral_bonus',
      });

      // Update wallet balance with matching ledgerId
      tx.set(walletRef, {
        coins: oldCoins + rewardCoins,
        focusPoints: oldFp,
        ledgerId,
      });
    });

    return { ok: true, rewardCoins, referrerAlias: referral.alias };
  } catch (e) {
    console.error('redeemReferralCode failed:', e);
    return { ok: false, error: 'generic' };
  }
}

/**
 * Fetches referral statistics for the signed-in user.
 */
export async function getReferralStats(uid: string): Promise<ReferralStats> {
  if (!isFirebaseConfigured()) {
    return {
      code: null,
      usesCount: 0,
      totalReferred: 0,
      earnedCoins: 0,
      coinsEarned: 0,
      hasRedeemed: false,
    };
  }

  const firestore = db();
  const [myCodeSnap, redemptionSnap] = await Promise.all([
    getDoc(doc(firestore, 'users', uid, 'referral', 'myCode')).catch(() => null),
    getDoc(doc(firestore, 'users', uid, 'referral', 'redemption')).catch(() => null),
  ]);

  let code: string | null = null;
  let usesCount = 0;

  if (myCodeSnap?.exists()) {
    code = myCodeSnap.data().code as string;
    const codeDocSnap = await getDoc(doc(firestore, 'referralCodes', code)).catch(() => null);
    if (codeDocSnap?.exists()) {
      usesCount = (codeDocSnap.data().usesCount as number) || 0;
    }
  }

  const hasRedeemed = Boolean(redemptionSnap?.exists());
  const referredByCode = redemptionSnap?.exists()
    ? (redemptionSnap.data().referredByCode as string)
    : undefined;
  const coins = usesCount * REFERRAL_REWARD_COINS;

  return {
    code,
    usesCount,
    totalReferred: usesCount,
    earnedCoins: coins,
    coinsEarned: coins,
    hasRedeemed,
    referredByCode,
  };
}
