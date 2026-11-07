import { getFirebaseAuth } from './client';
import {
  creditWallet,
  getPublicProfile,
  getWallet,
  listGroupSessions,
  listGroupTasks,
  listMembers,
  listMyGroups,
  listPublicBoard,
  logGroupSession,
  savePublicProfile,
} from './groups';

/**
 * Emulator/dev-only hook for Playwright specs: exposes the same groups.ts
 * functions the UI uses so tests can simulate a second user's writes and
 * read back what rules actually allow. Never installed in production
 * builds (gated on VITE_USE_EMULATORS=true, which is never set for prod).
 */
export function installEmulatorHook(): void {
  if (typeof window === 'undefined') return;
  if (import.meta.env.VITE_USE_EMULATORS !== 'true') return;
  (window as unknown as { __fpEmu: unknown }).__fpEmu = {
    uid: () => getFirebaseAuth().currentUser?.uid ?? null,
    listMyGroups,
    listMembers,
    listGroupTasks,
    listGroupSessions,
    logGroupSession,
    getPublicProfile,
    savePublicProfile,
    listPublicBoard,
    getWallet,
    creditWallet,
  };
}
