/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Shared sync context with NO Firebase imports, so the store can flip it
// synchronously on sign-out without pulling the SDK into the bundle.
// cloudSync.ts (dynamic) reads this to decide whether pushes are allowed.

export interface SyncContext {
  uid: string | null;
  enabled: boolean;
}

let context: SyncContext = { uid: null, enabled: false };

export function setCloudSyncContext(uid: string | null, enabled: boolean): void {
  context = { uid, enabled };
}

export function getCloudSyncContext(): SyncContext {
  return context;
}

export function isCloudSyncEnabled(): boolean {
  return context.uid !== null && context.enabled;
}
