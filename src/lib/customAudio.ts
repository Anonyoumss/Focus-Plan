/**
 * Custom audio library: user-supplied alarm/tick/ambient files stored
 * locally in IndexedDB (localStorage fallback for tiny files). Files are
 * strictly device-local — never synced to Firestore or any server.
 */

export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
  'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/flac'];
export const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.webm', '.m4a', '.aac', '.flac'];
export const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB
const LS_KEY = 'fp-custom-audio';
const DB_NAME = 'focusplan-audio';
const STORE = 'files';

export interface CustomAudioMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: number;
}

interface StoredAudio extends CustomAudioMeta {
  dataUrl: string; // base64 data URL
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
  }
  return dbPromise;
}

function lsAll(): StoredAudio[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as StoredAudio[]) : [];
  } catch { return []; }
}
function lsPut(list: StoredAudio[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* quota */ }
}

export function validateAudioFile(file: { name: string; type: string; size: number }): string | null {
  if (file.size <= 0) return 'empty';
  if (file.size > MAX_AUDIO_BYTES) return 'too-large';
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const okType = ALLOWED_AUDIO_TYPES.includes(file.type) || file.type.startsWith('audio/');
  const okExt = ALLOWED_EXTENSIONS.includes(ext);
  if (!okType && !okExt) return 'bad-type';
  return null;
}

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export async function listCustomAudio(): Promise<CustomAudioMeta[]> {
  const db = await openDb();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as StoredAudio[]).map(({ id, name, size, type, addedAt }) => ({ id, name, size, type, addedAt })));
      req.onerror = () => resolve(lsAll().map(({ id, name, size, type, addedAt }) => ({ id, name, size, type, addedAt })));
    });
  }
  return lsAll().map(({ id, name, size, type, addedAt }) => ({ id, name, size, type, addedAt }));
}

export async function addCustomAudio(file: File): Promise<CustomAudioMeta> {
  const err = validateAudioFile(file);
  if (err) throw new Error(err);
  const dataUrl = await fileToDataUrl(file);
  const meta: StoredAudio = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    type: file.type || 'audio/mpeg',
    addedAt: Date.now(),
    dataUrl,
  };
  const db = await openDb();
  if (db) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(meta);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } else {
    lsPut([...lsAll(), meta]);
  }
  return { id: meta.id, name: meta.name, size: meta.size, type: meta.type, addedAt: meta.addedAt };
}

export async function removeCustomAudio(id: string): Promise<void> {
  const db = await openDb();
  if (db) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } else {
    lsPut(lsAll().filter((a) => a.id !== id));
  }
}

export async function getCustomAudioDataUrl(id: string): Promise<string | null> {
  const db = await openDb();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as StoredAudio | undefined)?.dataUrl ?? null);
      req.onerror = () => resolve(null);
    });
  }
  return lsAll().find((a) => a.id === id)?.dataUrl ?? null;
}

export async function clearCustomAudio(): Promise<void> {
  const db = await openDb();
  if (db) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

/** One-shot playback of a stored custom file. */
export async function playCustomAudio(id: string, volume = 0.7): Promise<void> {
  const dataUrl = await getCustomAudioDataUrl(id);
  if (!dataUrl || typeof Audio === 'undefined') return;
  const audio = new Audio(dataUrl);
  audio.volume = Math.min(1, Math.max(0, volume));
  await audio.play().catch(() => undefined);
}
