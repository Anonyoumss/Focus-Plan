import { describe, expect, it } from 'vitest';
import {
  hashOf,
  mergeCollection,
  mergeSyncedState,
  stampSyncedCollections,
  type RemoteDoc,
  type SyncMeta,
} from '../syncMerge';

interface Rec {
  id: string;
  title: string;
  updatedAt?: number;
}

const rec = (id: string, title: string): Rec => ({ id, title });
const doc = (r: Rec, updatedAt: number): RemoteDoc => ({ ...r, updatedAt });
const tombstone = (id: string, updatedAt: number): RemoteDoc => ({
  id,
  _deleted: true,
  updatedAt,
});

describe('stampSyncedCollections', () => {
  it('stamps updatedAt and keeps it stable while content is unchanged', () => {
    const input = { tasks: [rec('a', 'one')] };
    const first = stampSyncedCollections(input, {}, 1000);
    expect((first.slice.tasks as Rec[])[0].updatedAt).toBe(1000);

    const second = stampSyncedCollections(input, first.meta, 2000);
    expect((second.slice.tasks as Rec[])[0].updatedAt).toBe(1000);

    const changed = { tasks: [rec('a', 'two')] };
    const third = stampSyncedCollections(changed, second.meta, 3000);
    expect((third.slice.tasks as Rec[])[0].updatedAt).toBe(3000);
  });

  it('does not mutate the input records', () => {
    const item = rec('a', 'one');
    stampSyncedCollections({ tasks: [item] }, {}, 1000);
    expect(item.updatedAt).toBeUndefined();
  });
});

describe('mergeCollection', () => {
  it('offline edit then pull: newer local updatedAt wins over older remote', () => {
    // Device edited offline at t=5000; remote still has t=1000 version.
    const local = [rec('a', 'local edit')];
    const meta: SyncMeta = {
      tasks: { a: { hash: hashOf(local[0]), updatedAt: 5000 } },
    };
    const remote = [doc(rec('a', 'old remote'), 1000)];

    const { items, meta: next } = mergeCollection(local, remote, meta.tasks!);
    expect(items).toHaveLength(1);
    expect((items[0] as Rec).title).toBe('local edit');
    expect(next.a.updatedAt).toBe(5000);
  });

  it('edit on two simulated devices converges to the newer updatedAt', () => {
    // Device A local has title "A" stamped t=100; device B pushed "B" t=200.
    const localA = [rec('x', 'A')];
    const metaA: SyncMeta = { tasks: { x: { hash: hashOf(localA[0]), updatedAt: 100 } } };
    const remoteB = [doc(rec('x', 'B'), 200)];

    const mergedA = mergeCollection(localA, remoteB, metaA.tasks!);
    expect((mergedA.items[0] as Rec).title).toBe('B');
    expect(mergedA.meta.x.updatedAt).toBe(200);

    // Device B pulls A's older doc afterwards: B's newer copy must win.
    const localB = [rec('x', 'B')];
    const metaB: SyncMeta = {
      tasks: { x: { hash: hashOf(localB[0]), updatedAt: 200 } },
    };
    const remoteA = [doc(rec('x', 'A'), 100)];
    const mergedB = mergeCollection(localB, remoteA, metaB.tasks!);
    expect((mergedB.items[0] as Rec).title).toBe('B');
    expect(mergedB.items).toEqual(mergedA.items);
  });

  it('delete on one device: newer remote tombstone removes the local record', () => {
    const local = [rec('a', 'keep?'), rec('b', 'other')];
    const meta: SyncMeta = {
      tasks: {
        a: { hash: hashOf(local[0]), updatedAt: 100 },
        b: { hash: hashOf(local[1]), updatedAt: 100 },
      },
    };
    const remote = [tombstone('a', 500), doc(rec('b', 'other'), 100)];

    const { items, meta: next } = mergeCollection(local, remote, meta.tasks!);
    expect(items.map((i) => (i as Rec).id)).toEqual(['b']);
    expect(next.a).toBeUndefined();
    expect(next.b).toBeDefined();
  });

  it('older tombstone does not delete a newer local edit', () => {
    const local = [rec('a', 'edited after delete')];
    const meta: SyncMeta = {
      tasks: { a: { hash: hashOf(local[0]), updatedAt: 900 } },
    };
    const remote = [tombstone('a', 500)];

    const { items } = mergeCollection(local, remote, meta.tasks!);
    expect(items).toHaveLength(1);
    expect((items[0] as Rec).title).toBe('edited after delete');
  });

  it('repeated sync is idempotent', () => {
    const local = [rec('a', 'one'), rec('b', 'two')];
    const meta: SyncMeta = {
      tasks: {
        a: { hash: hashOf(local[0]), updatedAt: 100 },
        b: { hash: hashOf(local[1]), updatedAt: 100 },
      },
    };
    const remote = [doc(rec('a', 'one remote'), 300), tombstone('b', 300)];

    const first = mergeCollection(local, remote, meta.tasks!);
    // Second merge simulates another pull of the same remote state; feed
    // the merged result back as "local" with its returned meta.
    const second = mergeCollection(first.items, remote, first.meta);
    expect(second.items).toEqual(first.items);
    expect(second.meta).toEqual(first.meta);
  });

  it('remote-only live docs are added and tombstoned remote docs are ignored', () => {
    const local: Rec[] = [];
    const remote = [doc(rec('n', 'new'), 50), tombstone('gone', 60)];
    const { items, meta } = mergeCollection(local, remote, {});
    expect(items.map((i) => (i as Rec).id)).toEqual(['n']);
    expect((items[0] as Rec).updatedAt).toBeUndefined();
    expect(meta.n.updatedAt).toBe(50);
    expect(meta.gone).toBeUndefined();
  });
});

describe('mergeSyncedState', () => {
  it('merges all collections and picks the newer settings doc', () => {
    const local = {
      tasks: [rec('a', 'local task')],
      sessionLogs: [],
      testGoals: [],
    };
    const meta: SyncMeta = {
      tasks: { a: { hash: hashOf(local.tasks[0]), updatedAt: 100 } },
      settings: { main: { hash: 'old', updatedAt: 100 } },
    };
    const remote = {
      tasks: [doc(rec('a', 'remote task'), 200)],
      sessionLogs: [],
      testGoals: [],
      settings: { locale: 'ar', updatedAt: 300 },
    };

    const out = mergeSyncedState(local, remote, meta);
    expect((out.tasks[0] as Rec).title).toBe('remote task');
    expect(out.settings).not.toBeNull();
    expect(out.settings!.locale).toBe('ar');
    expect(out.settingsUpdatedAt).toBe(300);
    expect(out.meta.settings!.main.updatedAt).toBe(300);
  });

  it('keeps local settings when remote is older', () => {
    const local = { tasks: [], sessionLogs: [], testGoals: [] };
    const meta: SyncMeta = {
      settings: { main: { hash: 'new', updatedAt: 500 } },
    };
    const remote = {
      tasks: [],
      sessionLogs: [],
      testGoals: [],
      settings: { locale: 'en', updatedAt: 100 },
    };
    const out = mergeSyncedState(local, remote, meta);
    expect(out.settings).toBeNull();
    expect(out.meta.settings!.main.updatedAt).toBe(500);
  });
});
