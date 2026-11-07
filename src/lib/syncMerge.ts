/**
 * Per-record sync metadata and merge logic for cloud sync.
 *
 * Framework-free: no React, DOM, or Firebase imports. Used by the store
 * (persistState stamping + pull merge) and unit-tested directly.
 *
 * Model:
 * - Every synced record carries `updatedAt` (ms epoch) in Firestore only.
 *   Local records stay clean; a persisted `SyncMeta` map records
 *   { hash, updatedAt } per record id, where updatedAt is the last time
 *   the record's content changed locally.
 * - Deletes propagate as tombstones: `{ _deleted: true, updatedAt }`.
 * - Merge rule: newer updatedAt wins. Ties keep the local copy.
 */

/** JSON.stringify with recursively sorted keys for stable comparisons. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

export interface RecordMeta {
  hash: string;
  updatedAt: number;
}

/** collection -> recordId -> meta. 'settings' uses doc key 'main'. */
export type SyncMeta = Record<string, Record<string, RecordMeta>>;

export const SYNCED_COLLECTIONS = ['tasks', 'sessionLogs', 'testGoals'] as const;
export type SyncedCollectionName = (typeof SYNCED_COLLECTIONS)[number];

export const SETTINGS_COLLECTION = 'settings';
export const SETTINGS_DOC_KEY = 'main';

const SETTINGS_FIELD_KEYS = [
  'locale',
  'themeMode',
  'seedHex',
  'dailyGoalSessions',
  'timerConfig',
  'onboardingCompleted',
] as const;

const SYNC_ONLY_FIELDS = new Set(['updatedAt', '_deleted']);

/** Removes fields that exist only on Firestore documents. */
export function stripSyncFields<T>(doc: T): T {
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) return doc;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc as Record<string, unknown>)) {
    if (!SYNC_ONLY_FIELDS.has(k)) out[k] = v;
  }
  return out as T;
}

/** Content hash ignoring sync-only fields, so updatedAt never self-triggers. */
export function hashOf(item: unknown): string {
  return stableStringify(stripSyncFields(item));
}

export interface RemoteDoc {
  id?: string;
  updatedAt?: number;
  _deleted?: boolean;
}

export interface StampedResult {
  /** Slice safe to hand to enqueueCloudSync/pushCloudState. */
  slice: Record<string, unknown>;
  meta: SyncMeta;
}

/**
 * Stamps `updatedAt` onto every synced record in `input` for the cloud
 * push, and returns the next SyncMeta. Records whose content hash is
 * unchanged keep their previous updatedAt; meta entries for records that
 * no longer exist locally are dropped.
 *
 * `input` is not mutated. Non-collection fields pass through untouched.
 */
export function stampSyncedCollections(
  input: Record<string, unknown>,
  meta: SyncMeta,
  now: number,
): StampedResult {
  const next: SyncMeta = {};
  for (const [coll, collMeta] of Object.entries(meta)) {
    next[coll] = { ...collMeta };
  }

  const slice: Record<string, unknown> = { ...input };

  for (const coll of SYNCED_COLLECTIONS) {
    const items = (input[coll] as { id?: string }[] | undefined) ?? [];
    const collMeta: Record<string, RecordMeta> = {};
    const stamped = items.map((item) => {
      const id = String(item.id ?? '');
      const hash = hashOf(item);
      const prev = next[coll]?.[id];
      const updatedAt = prev && prev.hash === hash ? prev.updatedAt : now;
      collMeta[id] = { hash, updatedAt };
      return { ...item, updatedAt };
    });
    slice[coll] = stamped;
    next[coll] = collMeta;
  }

  const settingsPart = Object.fromEntries(
    SETTINGS_FIELD_KEYS.filter((k) => input[k] !== undefined).map((k) => [k, input[k]]),
  );
  if (Object.keys(settingsPart).length > 0) {
    const hash = hashOf(settingsPart);
    const prev = next[SETTINGS_COLLECTION]?.[SETTINGS_DOC_KEY];
    const updatedAt = prev && prev.hash === hash ? prev.updatedAt : now;
    next[SETTINGS_COLLECTION] = {
      ...(next[SETTINGS_COLLECTION] ?? {}),
      [SETTINGS_DOC_KEY]: { hash, updatedAt },
    };
    slice.settingsUpdatedAt = updatedAt;
  }

  return { slice, meta: next };
}

/**
 * Merges one synced collection: local items vs remote Firestore docs.
 * Newer updatedAt wins; remote tombstones delete local records when newer;
 * remote-only live docs are added. Returns clean local-shaped items plus
 * the next meta for this collection.
 */
export function mergeCollection<T extends { id?: string }>(
  localItems: T[],
  remoteDocs: RemoteDoc[],
  collMeta: Record<string, RecordMeta>,
): { items: T[]; meta: Record<string, RecordMeta> } {
  const remoteById = new Map<string, RemoteDoc>();
  for (const d of remoteDocs) {
    const id = String(d.id ?? '');
    if (id) remoteById.set(id, d);
  }

  const meta: Record<string, RecordMeta> = {};
  const items: T[] = [];
  const localIds = new Set(localItems.map((i) => String(i.id ?? '')));

  const remoteUpdatedAt = (d: RemoteDoc) =>
    typeof d.updatedAt === 'number' ? d.updatedAt : 0;

  for (const item of localItems) {
    const id = String(item.id ?? '');
    const remote = remoteById.get(id);
    const localU = collMeta[id]?.updatedAt ?? 0;

    if (!remote) {
      if (collMeta[id]) meta[id] = collMeta[id];
      items.push(item);
      continue;
    }

    const remoteU = remoteUpdatedAt(remote);

    if (remote._deleted === true) {
      // Remote delete wins only when it is newer than the local edit.
      if (remoteU > localU) continue;
      meta[id] = collMeta[id] ?? { hash: hashOf(item), updatedAt: localU };
      items.push(item);
      continue;
    }

    if (remoteU > localU) {
      const clean = stripSyncFields(remote) as T;
      meta[id] = { hash: hashOf(clean), updatedAt: remoteU };
      items.push(clean);
    } else {
      meta[id] = collMeta[id] ?? { hash: hashOf(item), updatedAt: localU };
      items.push(item);
    }
  }

  for (const [id, remote] of remoteById) {
    if (localIds.has(id) || remote._deleted === true) continue;
    const remoteU = remoteUpdatedAt(remote);
    const clean = stripSyncFields(remote) as T;
    meta[id] = { hash: hashOf(clean), updatedAt: remoteU };
    items.push(clean);
  }

  return { items, meta };
}

export interface SyncedCollectionsInput {
  tasks?: { id?: string }[];
  sessionLogs?: { id?: string }[];
  testGoals?: { id?: string }[];
}

export interface RemoteSyncedState extends SyncedCollectionsInput {
  settings?: (RemoteDoc & { [key: string]: unknown }) | null;
}

export interface MergeStateResult {
  tasks: unknown[];
  sessionLogs: unknown[];
  testGoals: unknown[];
  /** Remote settings doc when it wins the merge, else null (keep local). */
  settings: Record<string, unknown> | null;
  settingsUpdatedAt?: number;
  meta: SyncMeta;
}

/**
 * Merges a full pulled cloud state into the local synced collections.
 * `meta` is the persisted local SyncMeta; the returned meta replaces it.
 */
export function mergeSyncedState(
  local: SyncedCollectionsInput,
  remote: RemoteSyncedState,
  meta: SyncMeta,
): MergeStateResult {
  const next: SyncMeta = {};
  for (const [coll, collMeta] of Object.entries(meta)) {
    next[coll] = { ...collMeta };
  }

  const tasks = mergeCollection(local.tasks ?? [], remote.tasks ?? [], next.tasks ?? {});
  next.tasks = tasks.meta;
  const sessionLogs = mergeCollection(
    local.sessionLogs ?? [],
    remote.sessionLogs ?? [],
    next.sessionLogs ?? {},
  );
  next.sessionLogs = sessionLogs.meta;
  const testGoals = mergeCollection(
    local.testGoals ?? [],
    remote.testGoals ?? [],
    next.testGoals ?? {},
  );
  next.testGoals = testGoals.meta;

  let settings: Record<string, unknown> | null = null;
  let settingsUpdatedAt: number | undefined;
  const remoteSettings = remote.settings ?? null;
  if (remoteSettings) {
    const remoteU =
      typeof remoteSettings.updatedAt === 'number' ? remoteSettings.updatedAt : 0;
    const localU = next[SETTINGS_COLLECTION]?.[SETTINGS_DOC_KEY]?.updatedAt ?? 0;
    if (remoteU > localU) {
      const clean = stripSyncFields(remoteSettings) as Record<string, unknown>;
      settings = clean;
      settingsUpdatedAt = remoteU;
      next[SETTINGS_COLLECTION] = {
        ...(next[SETTINGS_COLLECTION] ?? {}),
        [SETTINGS_DOC_KEY]: { hash: hashOf(clean), updatedAt: remoteU },
      };
    }
  }

  return {
    tasks: tasks.items,
    sessionLogs: sessionLogs.items,
    testGoals: testGoals.items,
    settings,
    settingsUpdatedAt,
    meta: next,
  };
}
