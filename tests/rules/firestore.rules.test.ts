import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import 'firebase/compat/app';
import 'firebase/compat/firestore';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const validTask = {
  id: 'task_1',
  title: 'GAT Math drills',
  category: 'Study',
  estimatedSessions: 4,
  completedSessions: 1,
  minGoal: 2,
  maxGoal: 6,
  cadence: 'daily',
  notes: '',
  isCompleted: false,
  createdAt: 1700000000000,
};

const validSettings = {
  locale: 'en',
  themeMode: 'light',
  seedHex: '#2e6b52',
  dailyGoalSessions: 4,
  timerConfig: { focusDuration: 1500 },
  onboardingCompleted: true,
};

const validSessionLog = {
  id: 'sess_1',
  timestamp: 1700000000000,
  dateStr: '2026-11-08',
  durationMinutes: 25,
  taskId: 'task_1',
  taskTitle: 'GAT Math drills',
  category: 'Study',
};

beforeAll(async () => {
  const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-focus-plan-test',
    firestore: { rules },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('per-user isolation', () => {
  it('owner can create and read own task', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    const ref = db.doc('users/user_a/tasks/task_1');
    await assertSucceeds(ref.set(validTask));
    await assertSucceeds(ref.get());
  });

  it('another user cannot read or write the task', async () => {
    const dbB = testEnv.authenticatedContext('user_b').firestore();
    const ref = dbB.doc('users/user_a/tasks/task_1');
    await assertFails(ref.get());
    await assertFails(ref.set({ ...validTask, title: 'hijack' }));
  });

  it('unauthenticated user cannot read', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.doc('users/user_a/tasks/task_1').get());
  });
});

describe('field validation', () => {
  it('rejects invalid cadence and oversized title', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    await assertFails(
      db.doc('users/user_a/tasks/bad1').set({ ...validTask, cadence: 'hourly-ish' }),
    );
    await assertFails(
      db.doc('users/user_a/tasks/bad2').set({ ...validTask, title: 'x'.repeat(500) }),
    );
  });

  it('rejects settings doc missing required preference keys', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    await assertFails(db.doc('users/user_a/settings/main').set({ themeMode: 'dark' }));
    await assertSucceeds(db.doc('users/user_a/settings/main').set(validSettings));
  });

  it('session logs are append-only', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    const ref = db.doc('users/user_a/sessionLogs/sess_1');
    await assertSucceeds(ref.set(validSessionLog));
    await assertFails(ref.update({ durationMinutes: 99 }));
    await assertFails(ref.delete());
  });
});

describe('tombstones and deletes', () => {
  it('owner can tombstone own task so deletes sync', async () => {
    const db = testEnv.authenticatedContext('user_d').firestore();
    const ref = db.doc('users/user_d/tasks/task_del');
    await assertSucceeds(ref.set(validTask));
    await assertSucceeds(
      ref.set({ _deleted: true, updatedAt: 1700000001000, id: 'task_del' }),
    );
    const snap = await ref.get();
    expect(snap.data()?._deleted).toBe(true);
  });

  it('tombstone without updatedAt is denied', async () => {
    const db = testEnv.authenticatedContext('user_d').firestore();
    await assertFails(
      db.doc('users/user_d/tasks/task_bad_tomb').set({ _deleted: true, id: 'x' }),
    );
  });

  it('tombstone with extra fields is denied', async () => {
    const db = testEnv.authenticatedContext('user_d').firestore();
    await assertFails(
      db.doc('users/user_d/tasks/task_fat_tomb').set({
        _deleted: true,
        updatedAt: 1,
        id: 'x',
        title: 'smuggled',
      }),
    );
  });

  it('another user cannot tombstone my task', async () => {
    const dbB = testEnv.authenticatedContext('user_e').firestore();
    await assertFails(
      dbB.doc('users/user_d/tasks/task_del').set({
        _deleted: true,
        updatedAt: 1,
        id: 'task_del',
      }),
    );
  });

  it('hard delete of a synced task is denied (must tombstone)', async () => {
    const db = testEnv.authenticatedContext('user_d').firestore();
    await assertFails(db.doc('users/user_d/tasks/task_del').delete());
  });
});

describe('wallet and ledger enforcement', () => {
  it('wallet create with nonzero balance is denied', async () => {
    const db = testEnv.authenticatedContext('user_c').firestore();
    await assertFails(
      db.doc('users/user_c/wallet/main').set({ coins: 999, focusPoints: 0 }),
    );
  });

  it('zero-balance wallet can be created by owner', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    await assertSucceeds(
      db.doc('users/user_a/wallet/main').set({ coins: 0, focusPoints: 0 }),
    );
  });

  it('balance edit without a ledger row is denied', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    await assertFails(db.doc('users/user_a/wallet/main').update({ coins: 40 }));
  });

  it('award with matching ledger row succeeds', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    const batch = db.batch();
    batch.update(db.doc('users/user_a/wallet/main'), {
      coins: 20,
      ledgerId: 'tx_award_1',
    });
    batch.set(db.doc('users/user_a/ledger/tx_award_1'), {
      userId: 'user_a',
      amount: 20,
      reason: 'Completed focus sessions',
      itemId: 'focus_session',
      createdAt: 1700000000000,
    });
    await assertSucceeds(batch.commit());
  });

  it('spend with matching ledger row at catalog price succeeds', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    const batch = db.batch();
    batch.update(db.doc('users/user_a/wallet/main'), {
      coins: 10,
      ledgerId: 'tx_freeze_1',
    });
    batch.set(db.doc('users/user_a/ledger/tx_freeze_1'), {
      userId: 'user_a',
      amount: -10,
      reason: 'Streak freeze',
      itemId: 'streak_freeze',
      createdAt: 1700000000000,
    });
    await assertSucceeds(batch.commit());
  });

  it('spend with non-catalog amount is denied', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    const batch = db.batch();
    batch.update(db.doc('users/user_a/wallet/main'), {
      coins: 5,
      ledgerId: 'tx_bad_1',
    });
    batch.set(db.doc('users/user_a/ledger/tx_bad_1'), {
      userId: 'user_a',
      amount: -5,
      reason: 'Not a catalog price',
      itemId: 'streak_freeze',
      createdAt: 1700000000000,
    });
    await assertFails(batch.commit());
  });

  it('oversized award is denied', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    const batch = db.batch();
    batch.update(db.doc('users/user_a/wallet/main'), {
      coins: 500,
      ledgerId: 'tx_huge_1',
    });
    batch.set(db.doc('users/user_a/ledger/tx_huge_1'), {
      userId: 'user_a',
      amount: 480,
      reason: 'Too large',
      itemId: 'focus_session',
      createdAt: 1700000000000,
    });
    await assertFails(batch.commit());
  });

  it('reusing an existing ledger id for a second wallet change is denied', async () => {
    const db = testEnv.authenticatedContext('user_replay').firestore();
    await assertSucceeds(
      db.doc('users/user_replay/wallet/main').set({ coins: 0, focusPoints: 0 }),
    );
    const batch1 = db.batch();
    batch1.update(db.doc('users/user_replay/wallet/main'), {
      coins: 20,
      ledgerId: 'tx_once',
    });
    batch1.set(db.doc('users/user_replay/ledger/tx_once'), {
      userId: 'user_replay',
      amount: 20,
      reason: 'First award',
      itemId: 'focus_session',
      createdAt: 1700000000000,
    });
    await assertSucceeds(batch1.commit());

    // Second change citing the SAME ledger row must be rejected: the
    // ledger doc already exists, so it cannot justify another delta.
    const batch2 = db.batch();
    batch2.update(db.doc('users/user_replay/wallet/main'), {
      coins: 40,
      ledgerId: 'tx_once',
    });
    await assertFails(batch2.commit());
  });

  it('wallet docs other than the canonical main doc are denied', async () => {
    const db = testEnv.authenticatedContext('user_walletid').firestore();
    await assertFails(
      db.doc('users/user_walletid/wallet/evil').set({ coins: 0, focusPoints: 0 }),
    );
    await assertFails(
      db.doc('users/user_walletid/wallet/evil').set({ coins: 999, focusPoints: 0 }),
    );
  });

  it('ledger rows cannot be updated or deleted', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    const ref = db.doc('users/user_a/ledger/tx_freeze_1');
    await assertFails(ref.update({ amount: 0 }));
    await assertFails(ref.delete());
  });

  it('focus-point award with matching ledger row succeeds', async () => {
    const db = testEnv.authenticatedContext('user_fp').firestore();
    await assertSucceeds(
      db.doc('users/user_fp/wallet/main').set({ coins: 0, focusPoints: 0 }),
    );
    const batch = db.batch();
    batch.update(db.doc('users/user_fp/wallet/main'), {
      focusPoints: 7,
      ledgerId: 'tx_fp_week',
    });
    batch.set(db.doc('users/user_fp/ledger/tx_fp_week'), {
      userId: 'user_fp',
      amount: 7,
      reason: 'group_weekly_award',
      itemId: 'g1_week_2026-W01',
      createdAt: 1700000000000,
    });
    await assertSucceeds(batch.commit());
  });

  it('oversized focus-point award is denied', async () => {
    const db = testEnv.authenticatedContext('user_fp').firestore();
    const batch = db.batch();
    batch.update(db.doc('users/user_fp/wallet/main'), {
      focusPoints: 18,
      ledgerId: 'tx_fp_huge',
    });
    batch.set(db.doc('users/user_fp/ledger/tx_fp_huge'), {
      userId: 'user_fp',
      amount: 11,
      reason: 'too big',
      itemId: 'x',
      createdAt: 1700000000000,
    });
    await assertFails(batch.commit());
  });

  it('buying without enough coins is denied', async () => {
    const db = testEnv.authenticatedContext('user_broke').firestore();
    await assertSucceeds(
      db.doc('users/user_broke/wallet/main').set({ coins: 0, focusPoints: 0 }),
    );
    const batch = db.batch();
    batch.update(db.doc('users/user_broke/wallet/main'), {
      coins: -10,
      ledgerId: 'tx_broke',
    });
    batch.set(db.doc('users/user_broke/ledger/tx_broke'), {
      userId: 'user_broke',
      amount: -10,
      reason: 'streak freeze',
      itemId: 'streak_freeze',
      createdAt: 1700000000000,
    });
    await assertFails(batch.commit());
  });

  it('buying twice with one ledger row is denied', async () => {
    const db = testEnv.authenticatedContext('user_twice').firestore();
    await assertSucceeds(
      db.doc('users/user_twice/wallet/main').set({ coins: 0, focusPoints: 0 }),
    );
    // Fund the wallet through a legitimate award first (0 -> 20).
    const fund = db.batch();
    fund.update(db.doc('users/user_twice/wallet/main'), {
      coins: 20,
      ledgerId: 'tx_fund',
    });
    fund.set(db.doc('users/user_twice/ledger/tx_fund'), {
      userId: 'user_twice',
      amount: 20,
      reason: 'focus sessions',
      itemId: 'focus_session',
      createdAt: 1700000000000,
    });
    await assertSucceeds(fund.commit());
    // First purchase: 20 -> 10 with ledger row tx_once.
    const b1 = db.batch();
    b1.update(db.doc('users/user_twice/wallet/main'), {
      coins: 10,
      ledgerId: 'tx_once',
    });
    b1.set(db.doc('users/user_twice/ledger/tx_once'), {
      userId: 'user_twice',
      amount: -10,
      reason: 'streak freeze',
      itemId: 'streak_freeze',
      createdAt: 1700000000000,
    });
    await assertSucceeds(b1.commit());
    // Second purchase reuses the same ledger id: ledger create is denied.
    const b2 = db.batch();
    b2.update(db.doc('users/user_twice/wallet/main'), {
      coins: 0,
      ledgerId: 'tx_once',
    });
    b2.set(db.doc('users/user_twice/ledger/tx_once'), {
      userId: 'user_twice',
      amount: -10,
      reason: 'streak freeze',
      itemId: 'streak_freeze',
      createdAt: 1700000000001,
    });
    await assertFails(b2.commit());
  });
});

describe('groups and profiles', () => {
  const groupDoc = {
    name: 'GAT squad',
    ownerId: 'user_g',
    inviteCode: 'ABC123',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };
  const memberDoc = {
    uid: 'user_g',
    alias: 'G',
    role: 'owner',
    joinedAt: 1700000000000,
  };

  async function seedGroup() {
    const db = testEnv.authenticatedContext('user_g').firestore();
    await assertSucceeds(db.doc('groups/g1').set(groupDoc));
    await assertSucceeds(db.doc('groups/g1/members/user_g').set(memberDoc));
    await assertSucceeds(
      db.doc('inviteCodes/ABC123').set({
        groupId: 'g1',
        groupName: 'GAT squad',
        createdBy: 'user_g',
        createdAt: 1700000000000,
      }),
    );
    await assertSucceeds(
      db.doc('users/user_g/memberships/g1').set({
        groupId: 'g1',
        joinedAt: 1700000000000,
      }),
    );
  }

  it('createGroup batch succeeds atomically (group, member, invite, membership, task)', async () => {
    const db = testEnv.authenticatedContext('user_g').firestore();
    const batch = db.batch();
    batch.set(db.doc('groups/g_batch'), { ...groupDoc, ownerId: 'user_g' });
    batch.set(db.doc('groups/g_batch/members/user_g'), memberDoc);
    batch.set(db.doc('inviteCodes/NEWCOD'), {
      groupId: 'g_batch',
      groupName: 'GAT squad',
      createdBy: 'user_g',
      createdAt: 1700000000000,
    });
    batch.set(db.doc('users/user_g/memberships/g_batch'), {
      groupId: 'g_batch',
      joinedAt: 1700000000000,
    });
    await assertSucceeds(batch.commit());
    // Group tasks require isGroupMember(); rules cannot see same-batch
    // writes, so the client commits the task separately (see groups.ts).
    await assertSucceeds(
      db.doc('groups/g_batch/tasks/t1').set({
        id: 't1',
        title: 'Group focus session',
        createdBy: 'user_g',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      }),
    );
  });

  it('non-member cannot read the group; self-join then roster read works', async () => {
    await seedGroup();
    const dbH = testEnv.authenticatedContext('user_h').firestore();
    await assertFails(dbH.doc('groups/g1').get());
    // Self-add is allowed (invite code is the capability).
    await assertSucceeds(
      dbH.doc('groups/g1/members/user_h').set({
        uid: 'user_h',
        alias: 'H',
        role: 'member',
        joinedAt: 1700000001000,
      }),
    );
    await assertSucceeds(dbH.doc('groups/g1').get());
    const roster = await dbH.collection('groups/g1/members').get();
    expect(roster.size).toBe(2);
  });

  it('cannot add another user to a group', async () => {
    const dbH = testEnv.authenticatedContext('user_h').firestore();
    await assertFails(
      dbH.doc('groups/g1/members/user_x').set({
        uid: 'user_x',
        alias: 'X',
        role: 'member',
        joinedAt: 1,
      }),
    );
  });

  it('sessions are append-only and only own uid', async () => {
    const dbH = testEnv.authenticatedContext('user_h').firestore();
    const ref = dbH.doc('groups/g1/sessions/s1');
    await assertSucceeds(
      ref.set({
        uid: 'user_h',
        taskId: 't1',
        minutes: 25,
        dateStr: '2026-11-08',
        createdAt: 1700000000000,
      }),
    );
    await assertFails(ref.update({ minutes: 99 }));
    await assertFails(ref.delete());
    await assertFails(
      dbH.doc('groups/g1/sessions/s2').set({
        uid: 'user_g',
        taskId: 't1',
        minutes: 25,
        dateStr: '2026-11-08',
        createdAt: 1700000000000,
      }),
    );
  });

  it('outsider cannot read sessions or tasks', async () => {
    const dbX = testEnv.authenticatedContext('user_x').firestore();
    await assertFails(dbX.collection('groups/g1/sessions').get());
    await assertFails(dbX.collection('groups/g1/tasks').get());
  });

  it('private profile is owner-only; public projection hides unshared fields', async () => {
    const dbI = testEnv.authenticatedContext('user_i').firestore();
    await assertSucceeds(
      dbI.doc('users/user_i/profile/main').set({ alias: 'Intl', updatedAt: 1 }),
    );
    const dbJ = testEnv.authenticatedContext('user_j').firestore();
    await assertFails(dbJ.doc('users/user_i/profile/main').get());
    // Public doc deliberately omits streak/focusPoints (not shared).
    await assertSucceeds(
      dbI.doc('users/user_i/public/profile').set({
        alias: 'Intl',
        shareMinutes: true,
        shareStreak: false,
        shareFocusPoints: false,
        weeklyMinutes: 120,
        updatedAt: 1,
      }),
    );
    const pub = await dbJ.doc('users/user_i/public/profile').get();
    expect(pub.exists).toBe(true);
    const data = pub.data()!;
    expect(data.alias).toBe('Intl');
    expect(data.streak).toBeUndefined();
    expect(data.focusPoints).toBeUndefined();
  });

  it('public profile rejects smuggled fields', async () => {
    const dbI = testEnv.authenticatedContext('user_i').firestore();
    await assertFails(
      dbI.doc('users/user_i/public/profile').set({
        alias: 'Intl',
        shareMinutes: true,
        shareStreak: true,
        shareFocusPoints: true,
        weeklyMinutes: 1,
        streak: 1,
        focusPoints: 1,
        email: 'leak@example.com',
        updatedAt: 1,
      }),
    );
  });

  it('public leaderboard entry allows only alias/minutes/streak', async () => {
    const dbI = testEnv.authenticatedContext('user_i').firestore();
    await assertSucceeds(
      dbI.doc('publicLeaderboard/user_i').set({
        alias: 'Intl',
        weeklyMinutes: 300,
        streak: 5,
        updatedAt: 1,
      }),
    );
    await assertFails(
      dbI.doc('publicLeaderboard/user_i').set({
        alias: 'Intl',
        weeklyMinutes: 300,
        streak: 5,
        email: 'leak@example.com',
        updatedAt: 2,
      }),
    );
    // Another signed-in user can read the board.
    const dbJ = testEnv.authenticatedContext('user_j').firestore();
    await assertSucceeds(dbJ.doc('publicLeaderboard/user_i').get());
    // Opt-out deletes own entry.
    await assertSucceeds(dbI.doc('publicLeaderboard/user_i').delete());
  });

describe('aiUsage quota docs', () => {
  it('owner can read/write own day counter; others cannot', async () => {
    const dbA = testEnv.authenticatedContext('user_a').firestore();
    const dbB = testEnv.authenticatedContext('user_b').firestore();
    const day = '2026-11-08';
    await assertSucceeds(
      dbA.doc(`aiUsage/user_a/days/${day}`).set({ count: 3 }),
    );
    await assertSucceeds(dbA.doc(`aiUsage/user_a/days/${day}`).get());
    await assertFails(dbB.doc(`aiUsage/user_a/days/${day}`).get());
    await assertFails(
      dbB.doc(`aiUsage/user_a/days/${day}`).set({ count: 0 }),
    );
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(anon.doc(`aiUsage/user_a/days/${day}`).get());
  });
});
});

