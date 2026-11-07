import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { getFirebaseDb } from './client';
import {
  awardPeriodsToClaim,
  dayKey,
  groupAwardDayId,
} from '../groupStats';

/**
 * Groups, shared tasks, sessions, awards, wallet transactions and public
 * profiles. All paths are flat and rules-enforced; see firestore.rules.
 *
 * Layout:
 *   groups/{gid}                     group doc
 *   groups/{gid}/members/{uid}       roster entry (alias, role, joinedAt)
 *   groups/{gid}/tasks/{taskId}      shared group tasks
 *   groups/{gid}/sessions/{autoId}   append-only pomodoro minutes
 *   inviteCodes/{CODE}               { groupId, createdBy } lookup
 *   users/{uid}/memberships/{gid}    membership index for "my groups"
 *   users/{uid}/groupAwards/{id}     create-only daily/weekly award claims
 *   users/{uid}/profile/main         private profile (owner only)
 *   users/{uid}/public/profile       opt-in public projection
 *   users/{uid}/wallet/main          coins/focusPoints + ledgerId
 *   users/{uid}/ledger/{id}          append-only ledger rows
 *   publicLeaderboard/{uid}          opt-in public board entries
 */

export interface GroupDoc {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: number;
  updatedAt?: number;
}

export interface GroupMember {
  uid: string;
  alias: string;
  role: 'owner' | 'member';
  joinedAt: number;
}

export interface GroupTask {
  id: string;
  title: string;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface GroupSession {
  id: string;
  uid: string;
  taskId: string;
  minutes: number;
  dateStr: string;
  createdAt: number;
}

export interface PublicProfile {
  alias: string;
  shareMinutes: boolean;
  shareStreak: boolean;
  shareFocusPoints: boolean;
  // Stat keys are present only when the member shares them; rules and
  // the UI both treat absent keys as "not shared".
  weeklyMinutes?: number;
  streak?: number;
  focusPoints?: number;
  updatedAt: number;
}

export interface PublicBoardEntry {
  uid: string;
  alias: string;
  weeklyMinutes: number;
  streak: number;
  updatedAt: number;
}

const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function genInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return code;
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function db(): Firestore {
  return getFirebaseDb();
}

// ---------- Groups ----------

export async function createGroup(
  uid: string,
  name: string,
  alias: string,
): Promise<GroupDoc> {
  const firestore = db();
  const groupRef = doc(collection(firestore, 'groups'));
  const inviteCode = genInviteCode();
  const now = Date.now();
  const gid = groupRef.id;

  const batch = writeBatch(firestore);
  batch.set(groupRef, {
    name: name.slice(0, 120),
    ownerId: uid,
    inviteCode,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(doc(firestore, 'groups', gid, 'members', uid), {
    uid,
    alias: alias.slice(0, 60) || 'Member',
    role: 'owner',
    joinedAt: now,
  });
  batch.set(doc(firestore, 'inviteCodes', inviteCode), {
    groupId: gid,
    groupName: name.slice(0, 120),
    createdBy: uid,
    createdAt: now,
  });
  batch.set(doc(firestore, 'users', uid, 'memberships', gid), {
    groupId: gid,
    joinedAt: now,
  });
  await batch.commit();

  // The shared task requires isGroupMember(), and rules cannot see other
  // writes in the same batch — it must be a separate commit.
  const taskRef = doc(collection(firestore, 'groups', gid, 'tasks'));
  await setDoc(taskRef, {
    id: taskRef.id,
    title: 'Group focus session',
    createdBy: uid,
    createdAt: now,
    updatedAt: now,
  });

  return { id: gid, name: name.slice(0, 120), ownerId: uid, inviteCode, createdAt: now };
}

export async function joinGroupByCode(
  uid: string,
  alias: string,
  code: string,
): Promise<GroupDoc> {
  const firestore = db();
  const normalized = code.trim().toUpperCase();
  const inviteSnap = await getDoc(doc(firestore, 'inviteCodes', normalized));
  if (!inviteSnap.exists()) throw new Error('invite-code-not-found');
  const invite = inviteSnap.data();
  const gid = invite.groupId as string;
  // Non-members cannot read groups/{gid}; the invite doc carries the name.
  const name = (invite.groupName as string | undefined) ?? '';

  // Idempotent: re-joining an existing membership is a no-op. Non-members
  // cannot read the members collection, so a denied read just means "new".
  const memberRef = doc(firestore, 'groups', gid, 'members', uid);
  const existing = await getDoc(memberRef).catch(() => null);
  if (!existing?.exists()) {
    const batch = writeBatch(firestore);
    batch.set(memberRef, {
      uid,
      alias: alias.slice(0, 60) || 'Member',
      role: 'member',
      joinedAt: Date.now(),
    });
    batch.set(doc(firestore, 'users', uid, 'memberships', gid), {
      groupId: gid,
      joinedAt: Date.now(),
    });
    await batch.commit();
  }
  return { id: gid, name, ownerId: '', inviteCode: normalized, createdAt: Date.now() };
}

export async function listMyGroups(uid: string): Promise<GroupDoc[]> {
  const firestore = db();
  const memberships = await getDocs(collection(firestore, 'users', uid, 'memberships'));
  const groups: GroupDoc[] = [];
  for (const m of memberships.docs) {
    const gid = m.data().groupId as string;
    const snap = await getDoc(doc(firestore, 'groups', gid));
    if (snap.exists()) {
      groups.push({ id: gid, ...(snap.data() as Omit<GroupDoc, 'id'>) });
    }
  }
  return groups;
}

export async function getGroup(gid: string): Promise<GroupDoc | null> {
  const snap = await getDoc(doc(db(), 'groups', gid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<GroupDoc, 'id'>) };
}

export async function listMembers(gid: string): Promise<GroupMember[]> {
  const snap = await getDocs(collection(db(), 'groups', gid, 'members'));
  return snap.docs.map((d) => d.data() as GroupMember);
}

export async function listGroupTasks(gid: string): Promise<GroupTask[]> {
  const snap = await getDocs(collection(db(), 'groups', gid, 'tasks'));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<GroupTask, 'id'>) }))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function listGroupSessions(gid: string): Promise<GroupSession[]> {
  const snap = await getDocs(collection(db(), 'groups', gid, 'sessions'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GroupSession, 'id'>) }));
}

export async function addGroupTask(
  gid: string,
  uid: string,
  title: string,
): Promise<GroupTask> {
  const ref = doc(collection(db(), 'groups', gid, 'tasks'));
  const now = Date.now();
  await setDoc(ref, {
    id: ref.id,
    title: title.slice(0, 200),
    createdBy: uid,
    createdAt: now,
    updatedAt: now,
  });
  return { id: ref.id, title: title.slice(0, 200), createdBy: uid, createdAt: now };
}

export async function deleteGroupTask(gid: string, taskId: string): Promise<void> {
  await deleteDoc(doc(db(), 'groups', gid, 'tasks', taskId));
}

/** Appends one pomodoro of group minutes. Append-only by rules. */
export async function logGroupSession(
  gid: string,
  uid: string,
  taskId: string,
  minutes: number,
): Promise<void> {
  await addDoc(collection(db(), 'groups', gid, 'sessions'), {
    uid,
    taskId,
    minutes: Math.max(1, Math.min(600, Math.round(minutes))),
    dateStr: dayKey(new Date()),
    createdAt: Date.now(),
  });
}

/**
 * Leave a group. Removes own membership docs; when the last member leaves,
 * the group doc, invite code and remaining subcollection docs are removed.
 */
export async function leaveGroup(uid: string, gid: string): Promise<void> {
  const firestore = db();
  const group = await getGroup(gid);
  const members = await listMembers(gid);

  // Ownership transfer must happen while the leaver is still a member:
  // the rules only let a member/owner update roster entries.
  if (group?.ownerId === uid && members.length > 1) {
    const next = members
      .filter((m) => m.uid !== uid)
      .sort((a, b) => a.joinedAt - b.joinedAt)[0];
    if (next) {
      await updateDoc(doc(firestore, 'groups', gid), {
        ownerId: next.uid,
        updatedAt: Date.now(),
      });
      await updateDoc(doc(firestore, 'groups', gid, 'members', next.uid), {
        role: 'owner',
      });
    }
  }

  const batch = writeBatch(firestore);
  batch.delete(doc(firestore, 'groups', gid, 'members', uid));
  batch.delete(doc(firestore, 'users', uid, 'memberships', gid));
  await batch.commit();

  const remaining = members.filter((m) => m.uid !== uid);
  if (remaining.length === 0) {
    const cleanup = writeBatch(firestore);
    if (group?.inviteCode) {
      cleanup.delete(doc(firestore, 'inviteCodes', group.inviteCode));
    }
    cleanup.delete(doc(firestore, 'groups', gid));
    await cleanup.commit();
  }
}

// ---------- Wallet + ledger (rule-enforced) ----------

export interface WalletDoc {
  coins: number;
  focusPoints: number;
  ledgerId?: string;
  updatedAt?: number;
}

async function walletRef(uid: string) {
  return doc(db(), 'users', uid, 'wallet', 'main');
}

/** Returns the wallet doc or null. */
export async function getWallet(uid: string): Promise<WalletDoc | null> {
  const snap = await getDoc(await walletRef(uid));
  return snap.exists() ? (snap.data() as WalletDoc) : null;
}

/** Creates the zero wallet if missing (rules require 0/0 on create). */
export async function ensureWallet(uid: string): Promise<void> {
  const ref = await walletRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { coins: 0, focusPoints: 0, updatedAt: Date.now() });
  }
}

/**
 * Credits coins and/or focus points in a transaction with a matching
 * ledger row. Positive deltas only; rules cap coin awards at 20 and
 * focus-point awards at 10 per write, so callers chunk larger amounts.
 */
export async function creditWallet(
  uid: string,
  coinDelta: number,
  fpDelta: number,
  reason: string,
  itemId: string,
): Promise<WalletDoc> {
  const firestore = db();
  const ref = await walletRef(uid);
  const ledgerId = genId('tx');
  return runTransaction(firestore, async (txn) => {
    const snap = await txn.get(ref);
    const old = snap.exists() ? (snap.data() as WalletDoc) : { coins: 0, focusPoints: 0 };
    const next: WalletDoc = {
      coins: old.coins + coinDelta,
      focusPoints: old.focusPoints + fpDelta,
      ledgerId,
      updatedAt: Date.now(),
    };
    txn.set(ref, next, { merge: true });
    txn.set(doc(firestore, 'users', uid, 'ledger', ledgerId), {
      userId: uid,
      amount: coinDelta !== 0 ? coinDelta : fpDelta,
      reason: reason.slice(0, 200),
      itemId: itemId.slice(0, 64),
      createdAt: Date.now(),
    });
    return next;
  });
}

/**
 * Spends coins at a catalog price. `price` must be one of the rule
 * allow-list (-10, -25, -15 as deltas); throws when balance is short.
 */
export async function spendCoins(
  uid: string,
  price: number,
  itemId: string,
  reason: string,
): Promise<WalletDoc> {
  const firestore = db();
  const ref = await walletRef(uid);
  const ledgerId = genId('tx');
  return runTransaction(firestore, async (txn) => {
    const snap = await txn.get(ref);
    const old = snap.exists() ? (snap.data() as WalletDoc) : { coins: 0, focusPoints: 0 };
    if (old.coins < price) throw new Error('insufficient-coins');
    const next: WalletDoc = {
      coins: old.coins - price,
      focusPoints: old.focusPoints,
      ledgerId,
      updatedAt: Date.now(),
    };
    txn.set(ref, next, { merge: true });
    txn.set(doc(firestore, 'users', uid, 'ledger', ledgerId), {
      userId: uid,
      amount: -price,
      reason: reason.slice(0, 200),
      itemId: itemId.slice(0, 64),
      createdAt: Date.now(),
    });
    return next;
  });
}

/**
 * On first sign-in: creates the wallet when missing and migrates the
 * local coin/FP balance through chunked ledger-justified credits (rules
 * cap awards per write). When a wallet already exists its values are
 * authoritative and returned so the caller can adopt them.
 */
export async function reconcileWallet(
  uid: string,
  localCoins: number,
  localFocusPoints: number,
): Promise<WalletDoc> {
  const existing = await getWallet(uid);
  if (existing) return existing;

  await ensureWallet(uid);
  let coins = 0;
  let fp = 0;
  let remaining = Math.max(0, Math.floor(localCoins));
  while (remaining > 0) {
    const chunk = Math.min(20, remaining);
    const w = await creditWallet(uid, chunk, 0, 'Local balance migration', 'migration');
    coins = w.coins;
    remaining -= chunk;
  }
  remaining = Math.max(0, Math.floor(localFocusPoints));
  while (remaining > 0) {
    const chunk = Math.min(10, remaining);
    const w = await creditWallet(uid, 0, chunk, 'Local balance migration', 'migration');
    fp = w.focusPoints;
    remaining -= chunk;
  }
  return { coins, focusPoints: fp, updatedAt: Date.now() };
}

// ---------- Group awards (daily +1 FP, weekly +7 FP) ----------

const DAY_FP_AWARD = 1;
const WEEK_FP_AWARD = 7;

/**
 * Claims unclaimed daily/weekly group awards for `uid` in `gid`.
 * Each claim is a transaction containing a create-only award doc, a
 * ledger row and the wallet update, so two members opening at the same
 * time cannot double-award: the loser's transaction retries, sees the
 * doc exists, and skips. Walk-back window is limited (7 days / 4 weeks,
 * see awardPeriodsToClaim) — older unclaimed periods are forfeited.
 */
export async function claimGroupAwards(uid: string, gid: string): Promise<number> {
  const firestore = db();
  await ensureWallet(uid);
  const { dayKeys, weekKeys } = awardPeriodsToClaim(new Date());
  const periods: { id: string; fp: number; reason: string }[] = [
    ...dayKeys.map((k) => ({
      id: groupAwardDayId(gid, new Date(`${k}T12:00:00`)),
      fp: DAY_FP_AWARD,
      reason: 'group_daily_award',
    })),
    ...weekKeys.map((k) => ({
      id: `${gid}_week_${k}`,
      fp: WEEK_FP_AWARD,
      reason: 'group_weekly_award',
    })),
  ];

  let awarded = 0;
  for (const period of periods) {
    const awardRef = doc(firestore, 'users', uid, 'groupAwards', period.id);
    const walletRefDoc = await walletRef(uid);
    const ledgerId = genId('tx');
    try {
      const result = await runTransaction(firestore, async (txn) => {
        const awardSnap = await txn.get(awardRef);
        if (awardSnap.exists()) return false;
        const wSnap = await txn.get(walletRefDoc);
        const old = wSnap.exists()
          ? (wSnap.data() as WalletDoc)
          : { coins: 0, focusPoints: 0 };
        txn.set(awardRef, {
          groupId: gid,
          period: period.id,
          uid,
          claimedAt: Date.now(),
        });
        txn.set(walletRefDoc, {
          coins: old.coins,
          focusPoints: old.focusPoints + period.fp,
          ledgerId,
          updatedAt: Date.now(),
        });
        txn.set(doc(firestore, 'users', uid, 'ledger', ledgerId), {
          userId: uid,
          amount: period.fp,
          reason: period.reason,
          itemId: period.id.slice(0, 64),
          createdAt: Date.now(),
        });
        return true;
      });
      if (result) awarded++;
    } catch (e) {
      console.warn('Group award claim failed:', period.id, e);
    }
  }
  return awarded;
}

// ---------- Profiles and public leaderboard ----------

export async function getPrivateProfile(uid: string): Promise<{ alias: string } | null> {
  const snap = await getDoc(doc(db(), 'users', uid, 'profile', 'main'));
  if (!snap.exists()) return null;
  return { alias: snap.data().alias as string };
}

export async function savePrivateProfile(uid: string, alias: string): Promise<void> {
  await setDoc(doc(db(), 'users', uid, 'profile', 'main'), {
    alias: alias.slice(0, 60),
    updatedAt: Date.now(),
  });
}

export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  const snap = await getDoc(doc(db(), 'users', uid, 'public', 'profile'));
  return snap.exists() ? (snap.data() as PublicProfile) : null;
}

export async function savePublicProfile(
  uid: string,
  profile: Omit<PublicProfile, 'updatedAt'>,
): Promise<void> {
  // Drop undefined stat keys so unshared fields never reach Firestore.
  const clean = Object.fromEntries(
    Object.entries(profile).filter(([, v]) => v !== undefined),
  );
  await setDoc(doc(db(), 'users', uid, 'public', 'profile'), {
    ...clean,
    alias: profile.alias.slice(0, 60),
    updatedAt: Date.now(),
  });
}

export async function deletePublicProfile(uid: string): Promise<void> {
  await deleteDoc(doc(db(), 'users', uid, 'public', 'profile'));
}

/** Opt-in public leaderboard entry; absent doc means not listed. */
export async function setPublicBoardEntry(
  uid: string,
  entry: PublicBoardEntry | null,
): Promise<void> {
  const ref = doc(db(), 'publicLeaderboard', uid);
  if (entry === null) {
    await deleteDoc(ref);
    return;
  }
  await setDoc(ref, { ...entry, updatedAt: Date.now() });
}

export async function listPublicBoard(): Promise<PublicBoardEntry[]> {
  const snap = await getDocs(collection(db(), 'publicLeaderboard'));
  return snap.docs
    .map((d) => ({ uid: d.id, ...(d.data() as Omit<PublicBoardEntry, 'uid'>) }))
    .sort((a, b) => b.weeklyMinutes - a.weeklyMinutes || b.streak - a.streak);
}
