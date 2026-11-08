import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { MdSwitch } from '../common/MdControls';
import {
  type ChimeSoundType,
  type TickSoundType,
  type AmbientSoundType,
} from '../../lib/soundEngine';
import {
  type StoredAudioFile,
  loadCustomAudioFile,
  saveCustomAudioFile,
  deleteCustomAudioFile,
  validateAudioFile,
  fileToDataUrl,
} from '../../lib/customAudio';

export const CustomAudioSettingsCard: React.FC = () => {
  const {
    locale,
    alarmVolume,
    setAlarmVolume,
    alarmSoundType,
    setAlarmSoundType,
    customAlarmAudio,
    setCustomAlarmAudio,
    previewAlarmSound,
    tickSoundEnabled,
    setTickSoundEnabled,
    tickVolume,
    setTickVolume,
    tickSoundType,
    setTickSoundType,
    previewTickSound,
    ambientSound,
    setAmbientSound,
    ambientVolume,
    setAmbientVolume,
  } = useAppStore();

  const t = TRANSLATIONS[locale];
  const ar = locale === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load custom audio from IndexedDB on mount if not loaded in store
  useEffect(() => {
    if (!customAlarmAudio) {
      void loadCustomAudioFile('alarm').then((file) => {
        if (file) {
          setCustomAlarmAudio(file);
        }
      });
    }
  }, [customAlarmAudio, setCustomAlarmAudio]);

  const chimeOptions: { id: ChimeSoundType; label: string }[] = [
    { id: 'chime', label: t.settings.soundPresetChime },
    { id: 'bell', label: t.settings.soundPresetBell },
    { id: 'digital', label: t.settings.soundPresetDigital },
    { id: 'wood', label: t.settings.soundPresetWood },
    { id: 'bowl', label: t.settings.soundPresetBowl },
    { id: 'custom', label: customAlarmAudio ? `${t.settings.soundCustom} (${customAlarmAudio.name})` : t.settings.soundCustom },
  ];

  const tickOptions: { id: TickSoundType; label: string }[] = [
    { id: 'clock', label: t.settings.tickPresetClock },
    { id: 'digital_tick', label: t.settings.tickPresetDigital },
    { id: 'wood_tick', label: t.settings.tickPresetWood },
    { id: 'tap', label: t.settings.tickPresetTap },
  ];

  const ambientOptions: { id: AmbientSoundType; label: string }[] = [
    { id: 'none', label: ar ? 'بدون صوت خلفية' : 'None' },
    { id: 'whitenoise', label: ar ? 'ضوضاء بيضاء' : 'White Noise' },
    { id: 'binaural', label: ar ? 'موجات ثنائية (Alpha 10Hz)' : 'Binaural Beats' },
    { id: 'rain', label: ar ? 'صوت مطر' : 'Gentle Rain' },
    { id: 'stream', label: t.settings.ambientStream },
  ];

  const handleFileSelected = async (file: File) => {
    setUploadError(null);
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid audio file');
      return;
    }

    try {
      setIsUploading(true);
      const dataUrl = await fileToDataUrl(file);
      const audio = new Audio();
      audio.src = dataUrl;

      // Read duration
      await new Promise<void>((resolve) => {
        audio.onloadedmetadata = () => resolve();
        audio.onerror = () => resolve();
        setTimeout(resolve, 1500);
      });

      const stored: StoredAudioFile = {
        id: 'alarm',
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type,
        durationSeconds: isFinite(audio.duration) ? Math.round(audio.duration * 10) / 10 : undefined,
        dataUrl,
        updatedAt: Date.now(),
      };

      await saveCustomAudioFile(stored);
      setCustomAlarmAudio(stored);
      setAlarmSoundType('custom');
      previewAlarmSound('custom', dataUrl);
    } catch (e) {
      console.error('Failed to process custom audio:', e);
      setUploadError(ar ? 'فشل تحميل الملف الصوتي' : 'Failed to process audio file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteCustom = async () => {
    await deleteCustomAudioFile('alarm');
    setCustomAlarmAudio(null);
    setAlarmSoundType('chime');
  };

  return (
    <div
      className="p-6 rounded-3xl border space-y-6"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderColor: 'var(--md-sys-color-outline-variant)',
      }}
    >
      <div>
        <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
          {ar ? 'الأصوات والمنبهات المخصصة' : 'Audio & Custom Alarms'}
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {ar
            ? 'تخصيص نغمات انتهاء الجلسات ونمط التكتكة وأصوات الخلفية الهادئة.'
            : 'Customize session completion alarms, ticking rhythm, and ambient focus soundscapes.'}
        </p>
      </div>

      {/* 1. Alarm Sound Selector & Volume */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {t.settings.alarmSound}
          </label>
          <div className="flex items-center gap-2">
            <select
              value={alarmSoundType}
              onChange={(e) => setAlarmSoundType(e.target.value as ChimeSoundType)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              {chimeOptions.map((opt) => (
                <option key={opt.id} value={opt.id} disabled={opt.id === 'custom' && !customAlarmAudio}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => previewAlarmSound()}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border cursor-pointer transition-colors"
              style={{
                borderColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-primary)',
              }}
              title={t.settings.previewSound}
              aria-label={t.settings.previewSound}
            >
              <MaterialIcon name="play_arrow" size={16} />
              <span>{t.settings.previewSound}</span>
            </button>
          </div>
        </div>

        {/* Alarm Volume Slider */}
        <label className="flex items-center gap-3 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <MaterialIcon name="volume_up" size={16} />
          <span className="w-24 shrink-0">{t.settings.alarmVolume}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={alarmVolume}
            onChange={(e) => setAlarmVolume(Number(e.target.value))}
            className="flex-1 accent-[var(--md-sys-color-primary)] cursor-pointer"
          />
          <span className="w-8 text-end font-mono">{Math.round(alarmVolume * 100)}%</span>
        </label>

        {/* Custom Audio Upload Dropzone & Info */}
        <div
          className="p-4 rounded-2xl border space-y-3"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <MaterialIcon
                name="music_note"
                size={20}
                className="mt-0.5"
                style={{ color: 'var(--md-sys-color-primary)' }}
              />
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {t.settings.soundCustom}
                </p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {t.settings.customAudioLocalNote}
                </p>
              </div>
            </div>

            {customAlarmAudio && (
              <button
                type="button"
                onClick={() => void handleDeleteCustom()}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border cursor-pointer"
                style={{
                  borderColor: 'var(--md-sys-color-error)',
                  color: 'var(--md-sys-color-error)',
                }}
              >
                <MaterialIcon name="delete" size={14} />
                <span>{t.settings.deleteCustomAudio}</span>
              </button>
            )}
          </div>

          {customAlarmAudio ? (
            <div
              className="flex items-center justify-between p-2.5 rounded-xl border text-xs"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              <div className="truncate max-w-[240px]">
                <span className="font-semibold">{customAlarmAudio.name}</span>
                <span className="text-[11px] ms-2 opacity-75">
                  ({Math.round(customAlarmAudio.sizeBytes / 1024)} KB
                  {customAlarmAudio.durationSeconds ? ` • ${customAlarmAudio.durationSeconds}s` : ''})
                </span>
              </div>
              <button
                type="button"
                onClick={() => previewAlarmSound('custom', customAlarmAudio.dataUrl)}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border"
                style={{
                  borderColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-primary)',
                }}
              >
                {ar ? 'تجربة' : 'Test'}
              </button>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mp3,audio/wav,audio/ogg,audio/webm,audio/x-m4a,audio/m4a,audio/aac"
                className="hidden"
                id="custom-audio-uploader"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFileSelected(f);
                }}
              />
              <label
                htmlFor="custom-audio-uploader"
                className="flex flex-col items-center justify-center p-4 border border-dashed rounded-xl cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                }}
              >
                <MaterialIcon name="upload_file" size={24} style={{ color: 'var(--md-sys-color-primary)' }} />
                <span className="text-xs font-semibold mt-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {isUploading ? (ar ? 'جارٍ التحميل...' : 'Loading audio...') : t.settings.customAudioHint}
                </span>
                <span className="text-[10px] mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  MP3, WAV, OGG, WebM, M4A (&le; 5 MB)
                </span>
              </label>
            </div>
          )}

          {uploadError && (
            <p className="text-[11px] font-medium" style={{ color: 'var(--md-sys-color-error)' }}>
              {uploadError}
            </p>
          )}
        </div>
      </div>

      <div className="h-px" style={{ backgroundColor: 'var(--md-sys-color-outline-variant)' }} />

      {/* 2. Tick Sound & Style */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 text-sm cursor-pointer" style={{ color: 'var(--md-sys-color-on-surface)' }}>
          <MdSwitch selected={tickSoundEnabled} onSelectedChange={setTickSoundEnabled} label={t.settings.tickSound} />
        </label>

        {tickSoundEnabled && (
          <div className="space-y-3 ps-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {t.settings.tickType}
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={tickSoundType}
                  onChange={(e) => setTickSoundType(e.target.value as TickSoundType)}
                  className="text-xs font-medium px-3 py-1.5 rounded-xl border outline-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                >
                  {tickOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => previewTickSound()}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border cursor-pointer"
                  style={{
                    borderColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-primary)',
                  }}
                  title={t.settings.previewSound}
                >
                  <MaterialIcon name="play_arrow" size={16} />
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              <span className="w-24 shrink-0">{t.settings.tickVolume}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={tickVolume}
                onChange={(e) => setTickVolume(Number(e.target.value))}
                className="flex-1 accent-[var(--md-sys-color-primary)] cursor-pointer"
              />
              <span className="w-8 text-end font-mono">{Math.round(tickVolume * 100)}%</span>
            </label>
          </div>
        )}
      </div>

      <div className="h-px" style={{ backgroundColor: 'var(--md-sys-color-outline-variant)' }} />

      {/* 3. Ambient Background Soundscape */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {ar ? 'أصوات الخلفية المريحة' : 'Ambient Focus Soundscapes'}
            </span>
            <p className="text-[11px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {ar ? 'تعمل تلقائياً مع بدء جلسة التركيز وتتوقف عند الاستراحة.' : 'Plays automatically during focus sessions.'}
            </p>
          </div>
          <select
            value={ambientSound}
            onChange={(e) => setAmbientSound(e.target.value as AmbientSoundType)}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            {ambientOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {ambientSound !== 'none' && (
          <label className="flex items-center gap-3 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            <span className="w-24 shrink-0">{ar ? 'مستوى الصوت' : 'Volume'}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={ambientVolume}
              onChange={(e) => setAmbientVolume(Number(e.target.value))}
              className="flex-1 accent-[var(--md-sys-color-primary)] cursor-pointer"
            />
            <span className="w-8 text-end font-mono">{Math.round(ambientVolume * 100)}%</span>
          </label>
        )}
      </div>
    </div>
  );
};
