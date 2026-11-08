/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AlarmPresetType = 'chime' | 'bell' | 'digital' | 'wood' | 'bowl';
export type TickPresetType = 'clock' | 'digital_tick' | 'wood_tick' | 'tap';
export type AmbientPresetType = 'none' | 'whitenoise' | 'binaural' | 'rain' | 'stream';

export interface CustomAudioItem {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
  createdAt?: number;
  updatedAt?: number;
}

export type StoredAudioFile = CustomAudioItem;

export const ALARM_PRESETS: Array<{ id: AlarmPresetType; nameEn: string; nameAr: string; descEn: string; descAr: string }> = [
  {
    id: 'chime',
    nameEn: 'Harmonic Chime',
    nameAr: 'رنين نغمي',
    descEn: 'Major triad chord with gentle decay (classic default)',
    descAr: 'نغمة كلاسيكية متناغمة وثلاثية الأبعاد',
  },
  {
    id: 'bell',
    nameEn: 'Meditation Bell',
    nameAr: 'جرس التأمل',
    descEn: 'Rich acoustic bell with multi-harmonic overtones',
    descAr: 'جرس رنان بطبقات صوتية هادئة تحاكي أجراس التأمل',
  },
  {
    id: 'digital',
    nameEn: 'Modern Digital',
    nameAr: 'إلكتروني حديث',
    descEn: 'Crisp, contemporary electronic focus completion tone',
    descAr: 'تنبيه إلكتروني نقي وموجز بنمط عصري',
  },
  {
    id: 'wood',
    nameEn: 'Zen Woodblock',
    nameAr: 'نقرة خشبية (زن)',
    descEn: 'Warm acoustic temple woodblock strike',
    descAr: 'صوت خشبي دافئ مستوحى من كتل الخشب التقليدية',
  },
  {
    id: 'bowl',
    nameEn: 'Singing Bowl',
    nameAr: 'وعاء التبت',
    descEn: 'Deep resonant bowl with slow acoustic binaural decay',
    descAr: 'رنين عميق وممتد مع ترددات صوتية مهدئة',
  },
];

export const TICK_PRESETS: Array<{ id: TickPresetType; nameEn: string; nameAr: string }> = [
  { id: 'clock', nameEn: 'Mechanical Clock', nameAr: 'ساعة ميكانيكية' },
  { id: 'digital_tick', nameEn: 'Soft Digital Pulse', nameAr: 'نبض رقمي هادئ' },
  { id: 'wood_tick', nameEn: 'Wood Tap', nameAr: 'نقرة خشبية' },
  { id: 'tap', nameEn: 'Minimalist Click', nameAr: 'نقرة بسيطة' },
];

export const AMBIENT_PRESETS: Array<{ id: AmbientPresetType; nameEn: string; nameAr: string }> = [
  { id: 'none', nameEn: 'None (Silent)', nameAr: 'بدون صوت (صامت)' },
  { id: 'whitenoise', nameEn: 'Pink & White Noise', nameAr: 'ضوضاء وردية/بيضاء' },
  { id: 'binaural', nameEn: 'Alpha Wave (10 Hz)', nameAr: 'موجات ألفا (10 هرتز)' },
  { id: 'rain', nameEn: 'Rain & Precipitation', nameAr: 'صوت المطر والرذاذ' },
  { id: 'stream', nameEn: 'Gentle Stream Flow', nameAr: 'خرير مياه هادئ' },
];

export const MAX_AUDIO_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
];

/** Validate audio file format and size limits */
export function validateCustomAudioFile(file: File): { ok: boolean; error?: string } {
  if (file.size > MAX_AUDIO_FILE_SIZE) {
    return { ok: false, error: 'File size exceeds maximum 5 MB limit.' };
  }
  // Allow if mime type matches or extension matches common audio formats
  const validExt = /\.(mp3|wav|ogg|webm|m4a|aac)$/i.test(file.name);
  const validMime = SUPPORTED_AUDIO_TYPES.includes(file.type) || (file.type && file.type.startsWith('audio/'));
  if (!validExt && !validMime) {
    return { ok: false, error: 'Unsupported format. Please upload MP3, WAV, OGG, WebM, or M4A.' };
  }
  return { ok: true };
}

export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const res = validateCustomAudioFile(file);
  return { valid: res.ok, error: res.error };
}

/** Convert a File or Blob into a data URL */
export async function fileToDataUrl(file: File | Blob): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsDataURL(file);
    });
  }

  // Node.js fallback for tests
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mime = file.type || 'audio/mpeg';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

const STORAGE_KEY_CUSTOM_AUDIO = 'focus_plan_custom_audio_v1';
const DB_NAME = 'focus_plan_audio_db';
const STORE_NAME = 'audio_files';

// In-memory fallback if IndexedDB and localStorage are unavailable (e.g. Node tests)
const memoryStore = new Map<string, StoredAudioFile>();

function openAudioDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function getStoredCustomAudioSync(): StoredAudioFile[] {
  if (typeof localStorage === 'undefined') {
    return Array.from(memoryStore.values());
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_AUDIO);
    if (!raw) return Array.from(memoryStore.values());
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return Array.from(memoryStore.values());
  }
}

/** Store a user-uploaded custom audio file into local IndexedDB with localStorage fallback */
export async function saveCustomAudioFile(item: StoredAudioFile): Promise<void> {
  memoryStore.set(item.id, item);

  const idb = await openAudioDb();
  if (idb) {
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = idb.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  if (typeof localStorage !== 'undefined') {
    try {
      const existing = getStoredCustomAudioSync();
      const next = [item, ...existing.filter((x) => x.id !== item.id)].slice(0, 5);
      localStorage.setItem(STORAGE_KEY_CUSTOM_AUDIO, JSON.stringify(next));
    } catch {
      // ignore storage quota error
    }
  }
}

export async function saveCustomAudio(file: File, customName?: string): Promise<CustomAudioItem> {
  const validation = validateCustomAudioFile(file);
  if (!validation.ok) {
    throw new Error(validation.error || 'Invalid audio file');
  }

  const dataUrl = await fileToDataUrl(file);

  const item: CustomAudioItem = {
    id: `audio_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: (customName || file.name.replace(/\.[^/.]+$/, '')).slice(0, 60),
    dataUrl,
    mimeType: file.type || 'audio/mpeg',
    sizeBytes: file.size,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveCustomAudioFile(item);
  return item;
}

export async function loadCustomAudioFile(id = 'alarm'): Promise<StoredAudioFile | null> {
  const idb = await openAudioDb();
  if (idb) {
    const res = await new Promise<StoredAudioFile | null>((resolve) => {
      try {
        const tx = idb.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve((req.result as StoredAudioFile) || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    if (res) return res;
  }

  const syncList = getStoredCustomAudioSync();
  const match = syncList.find((x) => x.id === id);
  if (match) return match;

  return memoryStore.get(id) || null;
}

export async function listCustomAudio(): Promise<CustomAudioItem[]> {
  const idb = await openAudioDb();
  if (idb) {
    return new Promise<CustomAudioItem[]>((resolve) => {
      try {
        const tx = idb.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as CustomAudioItem[]) || []);
        req.onerror = () => resolve(getStoredCustomAudioSync());
      } catch {
        resolve(getStoredCustomAudioSync());
      }
    });
  }
  return getStoredCustomAudioSync();
}

export async function deleteCustomAudioFile(id = 'alarm'): Promise<void> {
  memoryStore.delete(id);

  const idb = await openAudioDb();
  if (idb) {
    await new Promise<void>((resolve) => {
      try {
        const tx = idb.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  if (typeof localStorage !== 'undefined') {
    try {
      const existing = getStoredCustomAudioSync();
      const filtered = existing.filter((x) => x.id !== id);
      localStorage.setItem(STORAGE_KEY_CUSTOM_AUDIO, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }
}

export async function deleteCustomAudio(id: string): Promise<void> {
  return deleteCustomAudioFile(id);
}
