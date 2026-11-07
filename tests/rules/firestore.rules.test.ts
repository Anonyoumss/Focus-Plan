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
import { beforeAll, afterAll, describe, it } from 'vitest';

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

  it('ledger rows cannot be updated or deleted', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    const ref = db.doc('users/user_a/ledger/tx_freeze_1');
    await assertFails(ref.update({ amount: 0 }));
    await assertFails(ref.delete());
  });
});
