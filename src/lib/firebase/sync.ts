import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseDb } from './client';
import { stableStringify } from '../syncMerge';
import type { TaskItem } from '../../store/useAppStore';
import type { FocusSessionRecord } from '../analyticsEngine';
import type { UserTestGoal } from '../../data/tests/catalog';

export { stableStringify };

/**
 * Firestore layout (all under users/{uid}):
 *   tasks/{taskId}        sessionLogs/{logId}   testGoals/{goalId}
 *   templates/{id}        settings/main         meta/migration
 * Wallet/ledger collections exist in rules but are not written by the
 * client yet (milestone 4, server-side enforcement).
 */

export interface SyncedState {
  tasks: TaskItem[];
  sessionLogs: FocusSessionRecord[];
  testGoals: UserTestGoal[];
  templates: DocumentData[];
  settings: {
    locale?: string;
    themeMode?: string;
    seedHex?: string;
    dailyGoalSessions?: number;
    timerConfig?: unknown;
    onboardingCompleted?: boolean;
    updatedAt?: number;
  } | null;
}

export interface CloudStateSlice {
  tasks?: TaskItem[];
  sessionLogs?: FocusSessionRecord[];
  testGoals?: UserTestGoal[];
  templates?: DocumentData[];
  locale?: string;
  themeMode?: string;
  seedHex?: string;
  dailyGoalSessions?: number;
  timerConfig?: unknown;
  onboardingCompleted?: boolean;
  settingsUpdatedAt?: number;
}

const SETTINGS_DOC_ID = 'main';
const MIGRATION_DOC_ID = 'migration';
const BATCH_LIMIT = 400;

function userCollection(uid: string, name: string) {
  return collection(getFirebaseDb(), 'users', uid, name);
}

function docIdOf(item: { id?: string } | DocumentData, fallback: string): string {
  const id = (item as { id?: string }).id;
  return typeof id === 'string' && id.length > 0 ? id : fallback;
}

/** True when local guest data exists that could be migrated to the cloud. */
export function hasMigratableLocalData(slice: CloudStateSlice): boolean {
  return (
    (slice.tasks?.length ?? 0) > 0 ||
    (slice.testGoals?.length ?? 0) > 0 ||
    (slice.sessionLogs?.length ?? 0) > 0
  );
}

/** Reads every synced collection for the user. */
export async function pullCloudState(uid: string): Promise<SyncedState> {
  const db = getFirebaseDb();
  const names = ['tasks', 'sessionLogs', 'testGoals', 'templates'] as const;
  const result: SyncedState = {
    tasks: [],
    sessionLogs: [],
    testGoals: [],
    templates: [],
    settings: null,
  };

  await Promise.all(
    names.map(async (name) => {
      const snap = await getDocs(userCollection(uid, name));
      const rows = snap.docs.map((d) => d.data() as DocumentData);
      if (name === 'tasks') result.tasks = rows as TaskItem[];
      else if (name === 'sessionLogs') result.sessionLogs = rows as FocusSessionRecord[];
      else if (name === 'testGoals') result.testGoals = rows as UserTestGoal[];
      else result.templates = rows;
    }),
  );

  const settingsSnap = await getDoc(doc(db, 'users', uid, 'settings', SETTINGS_DOC_ID));
  result.settings = settingsSnap.exists() ? (settingsSnap.data() as SyncedState['settings']) : null;

  return result;
}

/** True when the cloud already holds any synced user data. */
export async function cloudHasData(uid: string): Promise<boolean> {
  const db = getFirebaseDb();
  const [settingsSnap, tasksSnap, goalsSnap, logsSnap] = await Promise.all([
    getDoc(doc(db, 'users', uid, 'settings', SETTINGS_DOC_ID)),
    getDocs(collection(db, 'users', uid, 'tasks')),
    getDocs(collection(db, 'users', uid, 'testGoals')),
    getDocs(collection(db, 'users', uid, 'sessionLogs')),
  ]);
  return (
    settingsSnap.exists() ||
    tasksSnap.size > 0 ||
    goalsSnap.size > 0 ||
    logsSnap.size > 0
  );
}

// Collections whose deletes propagate as tombstones. sessionLogs is
// append-only (rules deny update/delete), so missing remote logs are
// simply never removed client-side.
const TOMBSTONE_COLLECTIONS = new Set(['tasks', 'testGoals', 'templates']);

async function syncDocCollection(
  uid: string,
  name: string,
  localItems: DocumentData[],
): Promise<boolean> {
  const colRef = userCollection(uid, name);
  const remoteSnap = await getDocs(colRef);
  const remoteById = new Map(remoteSnap.docs.map((d) => [d.id, d]));

  const localById = new Map<string, DocumentData>();
  for (const item of localItems) {
    localById.set(docIdOf(item, ''), item);
  }

  let changed = false;
  let batch = writeBatch(getFirebaseDb());
  let ops = 0;
  const flush = async () => {
    if (ops > 0) {
      await batch.commit();
      batch = writeBatch(getFirebaseDb());
      ops = 0;
    }
  };

  const allowTombstones = TOMBSTONE_COLLECTIONS.has(name);

  // Remote docs missing locally become tombstones so the delete reaches
  // other devices on their next pull. Already-tombstoned and append-only
  // collections are skipped.
  for (const [id, remoteDoc] of remoteById) {
    if (localById.has(id)) continue;
    const data = remoteDoc.data();
    if (data._deleted === true || !allowTombstones) continue;
    batch.set(doc(getFirebaseDb(), 'users', uid, name, id), {
      _deleted: true,
      updatedAt: Date.now(),
      id,
    });
    ops++;
    changed = true;
    if (ops >= BATCH_LIMIT) await flush();
  }

  // Upsert local docs (setDoc overwrites, so retries are idempotent).
  // Local data carries updatedAt stamped by the store; unchanged docs are
  // skipped by content comparison.
  for (const [id, data] of localById) {
    const remote = remoteById.get(id);
    const remoteData = remote?.data();
    if (
      remoteData &&
      remoteData._deleted !== true &&
      stableStringify(remoteData) === stableStringify(data)
    ) {
      continue;
    }
    batch.set(doc(getFirebaseDb(), 'users', uid, name, id), data);
    ops++;
    changed = true;
    if (ops >= BATCH_LIMIT) await flush();
  }
  await flush();
  return changed;
}

async function syncSettingsDoc(
  uid: string,
  settings: NonNullable<SyncedState['settings']>,
  updatedAt?: number,
): Promise<void> {
  // Firestore rejects undefined field values; strip them. Rules require the
  // core preference keys, so merge over the existing doc to keep them.
  const clean = Object.fromEntries(
    Object.entries(settings).filter(([, v]) => v !== undefined),
  );
  const ref = doc(getFirebaseDb(), 'users', uid, 'settings', SETTINGS_DOC_ID);
  const existing = await getDoc(ref);
  await setDoc(ref, {
    ...(existing.exists() ? existing.data() : {}),
    ...clean,
    updatedAt: updatedAt ?? Date.now(),
  });
}

/**
 * Pushes the given local slice to Firestore. Idempotent: documents are keyed
 * by their entity id and written with set(), remote docs missing locally are
 * deleted, and unchanged docs are skipped.
 */
export async function pushCloudState(uid: string, slice: CloudStateSlice): Promise<void> {
  const jobs: Promise<unknown>[] = [];

  if (slice.tasks) jobs.push(syncDocCollection(uid, 'tasks', slice.tasks));
  if (slice.sessionLogs) jobs.push(syncDocCollection(uid, 'sessionLogs', slice.sessionLogs));
  if (slice.testGoals) jobs.push(syncDocCollection(uid, 'testGoals', slice.testGoals));
  if (slice.templates) jobs.push(syncDocCollection(uid, 'templates', slice.templates));

  if (
    slice.locale !== undefined ||
    slice.themeMode !== undefined ||
    slice.seedHex !== undefined ||
    slice.dailyGoalSessions !== undefined ||
    slice.timerConfig !== undefined ||
    slice.onboardingCompleted !== undefined ||
    slice.settingsUpdatedAt !== undefined
  ) {
    jobs.push(
      syncSettingsDoc(
        uid,
        {
          locale: slice.locale,
          themeMode: slice.themeMode,
          seedHex: slice.seedHex,
          dailyGoalSessions: slice.dailyGoalSessions,
          timerConfig: slice.timerConfig,
          onboardingCompleted: slice.onboardingCompleted,
        },
        slice.settingsUpdatedAt,
      ),
    );
  }

  await Promise.all(jobs);
}

/** Marks guest->cloud migration as completed for this user. */
export async function markMigrationComplete(uid: string): Promise<void> {
  await setDoc(doc(getFirebaseDb(), 'users', uid, 'meta', MIGRATION_DOC_ID), {
    completed: true,
    completedAt: Date.now(),
  });
}

/** True when this user already resolved the guest->cloud migration prompt. */
export async function isMigrationComplete(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid, 'meta', MIGRATION_DOC_ID));
  return snap.exists() && snap.data().completed === true;
}
