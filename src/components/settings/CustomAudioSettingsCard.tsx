import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import {
  addCustomAudio,
  clearCustomAudio,
  listCustomAudio,
  playCustomAudio,
  removeCustomAudio,
  type CustomAudioMeta,
} from '../../lib/customAudio';
import { soundEngine } from '../../lib/soundEngine';

const ALARM_PRESETS = ['chime', 'zen', 'temple', 'beep', 'wood', 'bowl'];
const TICK_STYLES = ['default', 'clock', 'pulse', 'metronome', 'tap'];
const AMBIENT_PRESETS = ['none', 'whitenoise', 'binaural', 'rain', 'stream', 'alpha'];

export const CustomAudioSettingsCard: React.FC = () => {
  const { locale, alarmPreset, setAlarmPreset, tickPreset, setTickPreset, alarmVolume } = useAppStore();
  const t = TRANSLATIONS[locale];
  const ar = locale === 'ar';
  const [files, setFiles] = useState<CustomAudioMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    void listCustomAudio().then(setFiles);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true); setError('');
    try {
      for (const f of Array.from(list)) await addCustomAudio(f);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const card = 'p-6 rounded-3xl border';
  const cardStyle = {
    backgroundColor: 'var(--md-sys-color-surface-container-low)',
    borderColor: 'var(--md-sys-color-outline-variant)',
  } as const;
  const label = { color: 'var(--md-sys-color-on-surface)' } as const;
  const sub = { color: 'var(--md-sys-color-on-surface-variant)' } as const;

  return (
    <div className={card} style={cardStyle}>
      <h2 className="text-base font-bold mb-1" style={label}>
        {ar ? 'مكتبة الصوت المخصصة' : 'Custom Audio Library'}
      </h2>
      <p className="text-xs mb-4" style={sub}>
        {ar
          ? 'ملفاتك الصوتية تُخزَّن على هذا الجهاز فقط ولا تُزامَن مع السحابة أبداً.'
          : 'Your audio files stay on this device only — they are never synced to the cloud.'}
      </p>

      {/* Alarm preset */}
      <label className="block text-sm mb-1" style={label}>{ar ? 'نغمة التنبيه' : 'Alarm sound'}</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {ALARM_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => { setAlarmPreset(p); soundEngine.playAlarm(p, 0.6); }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer"
            style={alarmPreset === p
              ? { backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', borderColor: 'transparent' }
              : { borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
          >
            {p === 'chime' ? (ar ? 'جرس' : 'Chime') : p}
          </button>
        ))}
        {files.map((f) => (
          <button
            key={f.id}
            onClick={() => { setAlarmPreset(`custom:${f.id}`); void playCustomAudio(f.id, alarmVolume); }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer max-w-40 truncate"
            style={alarmPreset === `custom:${f.id}`
              ? { backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', borderColor: 'transparent' }
              : { borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
            title={f.name}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Tick style */}
      <label className="block text-sm mb-1" style={label}>{ar ? 'نمط التكتكة' : 'Tick sound'}</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {TICK_STYLES.map((p) => (
          <button
            key={p}
            onClick={() => { setTickPreset(p); soundEngine.playTickStyled(p, 0.5); }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer"
            style={tickPreset === p
              ? { backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', borderColor: 'transparent' }
              : { borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Upload */}
      <div className="flex items-center gap-3 mb-3">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.webm,.m4a,.aac,.flac"
          multiple
          hidden
          onChange={(e) => void onFiles(e.target.files)}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}
        >
          <MaterialIcon name="upload" size={18} />
          {ar ? 'إضافة ملفات صوتية' : 'Add audio files'}
        </button>
        {files.length > 0 && (
          <button
            onClick={() => { void clearCustomAudio().then(refresh); setAlarmPreset('chime'); }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer"
            style={{ borderColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-error)' }}
          >
            {ar ? 'حذف الكل' : 'Delete all'}
          </button>
        )}
      </div>
      {error && <p className="text-xs mb-2" style={{ color: 'var(--md-sys-color-error)' }}>{error}</p>}

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 text-xs" style={sub}>
              <MaterialIcon name="audio_file" size={16} />
              <span className="flex-1 truncate">{f.name}</span>
              <span>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              <button
                onClick={() => void playCustomAudio(f.id, alarmVolume)}
                className="px-2 py-1 rounded-lg cursor-pointer"
                style={{ color: 'var(--md-sys-color-primary)' }}
                aria-label={ar ? 'معاينة' : 'Preview'}
              >
                <MaterialIcon name="play_arrow" size={16} />
              </button>
              <button
                onClick={() => void removeCustomAudio(f.id).then(() => {
                  if (alarmPreset === `custom:${f.id}`) setAlarmPreset('chime');
                  refresh();
                })}
                className="px-2 py-1 rounded-lg cursor-pointer"
                style={{ color: 'var(--md-sys-color-error)' }}
                aria-label={ar ? 'حذف' : 'Delete'}
              >
                <MaterialIcon name="delete" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
