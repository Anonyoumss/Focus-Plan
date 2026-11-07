import {
  pushCloudState,
  stableStringify,
  type CloudStateSlice,
} from './sync';

/**
 * Debounced bridge between the Zustand store's persistState() and Firestore.
 * The store calls setCloudSyncContext() when auth state resolves and
 * enqueueCloudSync() on every persisted change. Writes are skipped when the
 * signed-in user has not completed (or declined) the migration prompt.
 */

import { getCloudSyncContext, setCloudSyncContext as setCloudSyncContextShared } from './syncContext';

let pending: CloudStateSlice | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const lastPushedSignatures = new Map<string, string>();
let inFlight: Promise<void> | null = null;

const COLLECTION_KEYS = ['tasks', 'sessionLogs', 'testGoals', 'templates'] as const;
const SETTINGS_KEYS = [
  'locale',
  'themeMode',
  'seedHex',
  'dailyGoalSessions',
  'timerConfig',
  'onboardingCompleted',
] as const;

export function setCloudSyncContext(uid: string | null, enabled: boolean): void {
  setCloudSyncContextShared(uid, enabled);
  if (!enabled) {
    pending = null;
    lastPushedSignatures.clear();
  }
}

export function enqueueCloudSync(slice: CloudStateSlice): void {
  const context = getCloudSyncContext();
  if (!context.uid || !context.enabled) return;
  pending = { ...(pending ?? {}), ...slice };
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushCloudSync();
  }, 800);
}

function signatureOf(slice: CloudStateSlice): Map<string, string> {
  const sig = new Map<string, string>();
  for (const key of COLLECTION_KEYS) {
    const items = slice[key as keyof CloudStateSlice];
    if (Array.isArray(items)) sig.set(key, stableStringify(items));
  }
  const settingsPart = SETTINGS_KEYS.map((k) => [k, slice[k as keyof CloudStateSlice]]).filter(
    ([, v]) => v !== undefined,
  );
  if (settingsPart.length > 0) sig.set('settings', stableStringify(Object.fromEntries(settingsPart)));
  return sig;
}

/** Flushes pending changes now. Resolves when the write attempt finishes. */
export async function flushCloudSync(): Promise<void> {
  if (inFlight) return inFlight;
  const context = getCloudSyncContext();
  const uid = context.uid;
  const slice = pending;
  pending = null;
  if (!uid || !context.enabled || !slice) return;

  inFlight = (async () => {
    try {
      const signatures = signatureOf(slice);
      const changed: CloudStateSlice = {};
      let anyChanged = false;
      for (const [key, sig] of signatures) {
        if (lastPushedSignatures.get(key) !== sig) {
          anyChanged = true;
          if (key === 'settings') {
            for (const k of SETTINGS_KEYS) {
              const v = slice[k as keyof CloudStateSlice];
              if (v !== undefined) (changed as Record<string, unknown>)[k] = v;
            }
            if (slice.settingsUpdatedAt !== undefined) {
              changed.settingsUpdatedAt = slice.settingsUpdatedAt;
            }
          } else {
            (changed as Record<string, unknown>)[key] = (slice as Record<string, unknown>)[key];
          }
        }
      }
      if (!anyChanged) return;
      await pushCloudState(uid, changed);
      for (const [key, sig] of signatures) lastPushedSignatures.set(key, sig);
    } catch (e) {
      console.warn('Cloud sync push failed:', e);
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
