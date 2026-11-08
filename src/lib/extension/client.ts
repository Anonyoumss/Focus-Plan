/**
 * Focus Plan Companion extension client.
 *
 * Talks to the MV3 extension (extension/) via chrome.runtime.sendMessage to a
 * pinned extension ID. Everything is optional: without the extension installed
 * every call resolves to null/false and the app works fully.
 *
 * Channel security: the extension only answers origins in its own
 * trustedOrigins list (managed in the extension's options page). This app
 * cannot add itself — the user does it once in the extension options.
 */

export const EXTENSION_ID = 'hppldplcookimjhlkmanllinfjnbnjff';

export interface ExtensionSessionSummary {
  id: string;
  startedAt: number;
  endedAt: number | null;
  onTaskSec: number;
  offTaskSec: number;
  otherSec: number;
  totalSec: number;
  topDomains: string[];
}

export interface ExtensionDailyPoint {
  date: string;
  onTaskSec: number;
  offTaskSec: number;
  otherSec: number;
}

export interface ExtensionSnapshot {
  enabled: boolean;
  lists: { allow: string[]; block: string[] };
  sessionActive: boolean;
  sessions: ExtensionSessionSummary[];
  daily: ExtensionDailyPoint[];
}

interface ChromeRuntimeLike {
  sendMessage: (
    extensionId: string,
    message: unknown,
    callback?: (response: unknown) => void,
  ) => void;
}

function chromeRuntime(): ChromeRuntimeLike | null {
  const c = (globalThis as { chrome?: { runtime?: ChromeRuntimeLike & { lastError?: { message?: string } } } }).chrome;
  const rt = c?.runtime;
  return rt && typeof rt.sendMessage === 'function' ? rt : null;
}

export function extensionAvailable(): boolean {
  return chromeRuntime() !== null;
}

function send<T>(message: Record<string, unknown>): Promise<T | null> {
  const rt = chromeRuntime();
  if (!rt) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      rt.sendMessage(EXTENSION_ID, message, (response) => {
        // chrome.runtime.lastError is set when the extension is absent.
        const err = (globalThis as { chrome?: { runtime?: { lastError?: { message?: string } } } }).chrome?.runtime?.lastError;
        resolve(err ? null : ((response as T) ?? null));
      });
    } catch {
      resolve(null);
    }
  });
}

export interface PingResult {
  ok: boolean;
  trusted: boolean;
  app?: string;
}

export async function pingExtension(): Promise<PingResult | null> {
  return send<PingResult>({ type: 'ping' });
}

export async function pullExtensionData(): Promise<ExtensionSnapshot | null> {
  const r = await send<{ ok: boolean; data: ExtensionSnapshot }>({ type: 'pull' });
  return r && r.ok ? r.data : null;
}

let activeSessionId: string | null = null;
let lastSessionId: string | null = null;

/** Mirror timer lifecycle into the extension. Safe no-op without it. */
export async function notifyExtensionSession(phase: 'running' | 'paused' | 'ended'): Promise<void> {
  if (phase === 'running') {
    if (!activeSessionId) activeSessionId = `s-${Date.now().toString(36)}`;
  } else if (phase === 'ended') {
    lastSessionId = activeSessionId;
    activeSessionId = null;
  }
  const id = phase === 'ended' ? lastSessionId : activeSessionId;
  if (!id) return;
  await send({
    type: 'session',
    state: phase === 'ended' ? 'end' : phase,
    sessionId: id,
  });
}

export async function pushExtensionLists(allow: string[], block: string[]): Promise<boolean> {
  const r = await send<{ ok: boolean }>({ type: 'pushLists', allow, block });
  return !!(r && r.ok);
}

export async function setExtensionEnabled(enabled: boolean): Promise<boolean> {
  const r = await send<{ ok: boolean; enabled: boolean }>({ type: 'setEnabled', enabled });
  return !!(r && r.ok);
}

export async function deleteExtensionData(): Promise<boolean> {
  const r = await send<{ ok: boolean }>({ type: 'deleteData' });
  return !!(r && r.ok);
}
