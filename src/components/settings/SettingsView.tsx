import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { THEME_PRESETS, ThemeMode } from '../../design/theme';
import { MaterialIcon } from '../common/MaterialIcon';
import { MdSwitch } from '../common/MdControls';
import { navigateToAppTab } from '../../lib/router';
import ExtensionSettingsCard from './ExtensionSettingsCard';
import { CustomAudioSettingsCard } from './CustomAudioSettingsCard';
import { EasterEggLauncher } from '../easter/EasterEggLauncher';

export const SettingsView: React.FC = () => {
  const {
    locale,
    setLocale,
    themeMode,
    setThemeMode,
    seedHex,
    setSeedHex,
    timerConfig,
    updateTimerConfig,
    exportDataJson,
    exportDataCsv,
    resetAllData,
    demoDataLoaded,
    loadDemoData,
    firebaseEnabled,
    authStatus,
    user,
    cloudSyncEnabled,
    syncError,
    signIn,
    signOutAccount,
    tickSoundEnabled,
    tickVolume,
    setTickSoundEnabled,
    setTickVolume,
    tasks,
    taskTemplates,
    saveTaskListAsTemplate,
    applyTaskTemplate,
    renameTaskTemplate,
    deleteTaskTemplate,
    importTasks,
    importTasksFromJson,
    importTasksFromCsv,
    reminderSettings,
    setReminderSettings,
    spotlightMode,
    setSpotlightMode,
    reduceAnimations,
    setReduceAnimations,
  } = useAppStore();

  const t = TRANSLATIONS[locale];
  const [customHex, setCustomHex] = useState(seedHex);
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const flashImport = (msg: string) => {
    setImportFeedback(msg);
    setTimeout(() => setImportFeedback(null), 3000);
  };

  const handleImportFile = (file: File, kind: 'json' | 'csv') => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const result = kind === 'json' ? importTasksFromJson(text) : importTasksFromCsv(text);
      if (result.ok) {
        const n = importTasks(result.tasks);
        flashImport(`${t.settings.importSuccess} (${n})`);
      } else {
        flashImport(t.settings.importFailed);
      }
    };
    reader.readAsText(file);
  };

  const handleRequestNotification = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      setNotificationStatus(res);
    }
  };

  const handleDownloadJson = () => {
    const dataStr = exportDataJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus_plan_m3e_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csv = exportDataCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus_plan_m3e_sessions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold font-display"
          style={{ color: 'var(--md-sys-color-on-surface)' }}
        >
          {t.settings.title}
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {locale === 'ar'
            ? 'تخصيص المظهر، لغة الواجهة، أوقات المؤقت، وتصدير البيانات.'
            : 'Personalize appearance, dynamic color seed, language, and timer parameters.'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance & Dynamic Theme */}
        <div
          className="p-6 rounded-3xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <MaterialIcon name="palette" size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
            <h2
              className="text-base font-bold"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.settings.appearance}
            </h2>
          </div>

          {/* Theme Mode Toggle (System, Light, Dark) */}
          <div className="mb-5">
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {t.settings.themeMode}
            </label>
            <div
              className="inline-flex items-center p-1 rounded-xl border text-xs"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                borderColor: 'var(--md-sys-color-outline-variant)',
              }}
            >
              {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setThemeMode(mode)}
                  className={`px-4 py-2 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                    themeMode === mode ? 'font-bold' : ''
                  }`}
                  style={{
                    backgroundColor: themeMode === mode ? 'var(--md-sys-color-primary)' : 'transparent',
                    color: themeMode === mode ? 'var(--md-sys-color-on-primary)' : 'inherit',
                  }}
                >
                  {t.settings[mode as keyof typeof t.settings] || mode}
                </button>
              ))}
            </div>
          </div>

          {/* Seed Palettes */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {t.settings.seedPalette}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {THEME_PRESETS.map((preset) => {
                const isSelected = seedHex.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSeedHex(preset.hex);
                      setCustomHex(preset.hex);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--md-sys-color-surface-container)',
                      borderColor: 'var(--md-sys-color-outline-variant)',
                      boxShadow: isSelected ? '0 0 0 2px var(--md-sys-color-primary)' : 'none',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span className="text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {locale === 'ar' ? preset.nameAr : preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <input
                type="color"
                aria-label={locale === 'ar' ? 'اختيار لون مخصص' : 'Pick custom color'}
                value={/^#[0-9a-fA-F]{6}$/.test(customHex) ? customHex : '#2e6b52'}
                onChange={(e) => {
                  setCustomHex(e.target.value);
                  setSeedHex(e.target.value);
                }}
                className="w-11 h-11 rounded-xl border cursor-pointer p-1"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              />
              <input
                type="text"
                value={customHex}
                onChange={(e) => {
                  const v = e.target.value;
                  setCustomHex(v);
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) setSeedHex(v);
                }}
                placeholder="#2e6b52"
                maxLength={7}
                spellCheck={false}
                className="w-28 px-3 py-2 rounded-xl border text-xs font-mono outline-none"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />
              <div
                className="w-8 h-8 rounded-full border"
                aria-hidden="true"
                style={{
                  backgroundColor: /^#[0-9a-fA-F]{6}$/.test(customHex)
                    ? customHex
                    : 'var(--md-sys-color-surface-container-highest)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div
          className="p-6 rounded-3xl border flex items-center justify-between"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center gap-3">
            <MaterialIcon name="language" size={22} style={{ color: 'var(--md-sys-color-primary)' }} />
            <div>
              <h2
                className="text-base font-bold"
                style={{ color: 'var(--md-sys-color-on-surface)' }}
              >
                {t.settings.language}
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                English & Arabic (العربية) with full RTL support.
              </p>
            </div>
          </div>

          <div
            className="flex items-center p-1 rounded-xl border text-xs"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <button
              onClick={() => setLocale('en')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                locale === 'en' ? 'font-bold' : ''
              }`}
              style={{
                backgroundColor: locale === 'en' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: locale === 'en' ? 'var(--md-sys-color-on-primary)' : 'inherit',
              }}
            >
              English
            </button>
            <button
              onClick={() => setLocale('ar')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                locale === 'ar' ? 'font-bold' : ''
              }`}
              style={{
                backgroundColor: locale === 'ar' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: locale === 'ar' ? 'var(--md-sys-color-on-primary)' : 'inherit',
              }}
            >
              العربية
            </button>
          </div>
        </div>

        {/* Timer Parameters */}
        <div
          className="p-6 rounded-3xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <MaterialIcon name="schedule" size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
            <h2
              className="text-base font-bold"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.settings.timerDurations}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {t.settings.focusDuration} (min)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={Math.round(timerConfig.focusDuration / 60)}
                onChange={(e) =>
                  updateTimerConfig({ focusDuration: (parseInt(e.target.value) || 25) * 60 })
                }
                className="w-full px-3 py-2 rounded-xl border text-sm text-center tabular-nums outline-none"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {t.settings.shortBreakDuration} (min)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={Math.round(timerConfig.shortBreakDuration / 60)}
                onChange={(e) =>
                  updateTimerConfig({ shortBreakDuration: (parseInt(e.target.value) || 5) * 60 })
                }
                className="w-full px-3 py-2 rounded-xl border text-sm text-center tabular-nums outline-none"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {t.settings.longBreakDuration} (min)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={Math.round(timerConfig.longBreakDuration / 60)}
                onChange={(e) =>
                  updateTimerConfig({ longBreakDuration: (parseInt(e.target.value) || 15) * 60 })
                }
                className="w-full px-3 py-2 rounded-xl border text-sm text-center tabular-nums outline-none"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2 text-xs">
            <MdSwitch
              selected={timerConfig.autoStartBreaks}
              onSelectedChange={(v) => updateTimerConfig({ autoStartBreaks: v })}
              label={t.settings.autoStartBreaks}
            />

            <MdSwitch
              selected={timerConfig.autoStartPomodoros}
              onSelectedChange={(v) => updateTimerConfig({ autoStartPomodoros: v })}
              label={t.settings.autoStartPomodoros}
            />
          </div>
        </div>

        {/* Notifications */}
        <div
          className="p-6 rounded-3xl border flex items-center justify-between"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center gap-3">
            <MaterialIcon name="notifications" size={22} style={{ color: 'var(--md-sys-color-primary)' }} />
            <div>
              <h2
                className="text-base font-bold"
                style={{ color: 'var(--md-sys-color-on-surface)' }}
              >
                {t.settings.notifications}
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                Status: {notificationStatus}
              </p>
            </div>
          </div>

          <button
            onClick={handleRequestNotification}
            className="px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors"
            style={{
              borderColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-primary)',
            }}
          >
            {notificationStatus === 'granted'
              ? (locale === 'ar' ? 'مفعل' : 'Enabled')
              : (locale === 'ar' ? 'تفعيل الإشعارات' : 'Enable Web Alerts')}
          </button>
        </div>

        {/* Export Data */}
        <div
          className="p-6 rounded-3xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <h2
            className="text-base font-bold mb-1"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {t.settings.exportData}
          </h2>
          <p
            className="text-xs mb-4"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {locale === 'ar'
              ? 'تنزيل ملخص بيانات دراستك كملف CSV أو نسخة احتياطية بصيغة JSON.'
              : 'Download your full study records, tasks, and streaks.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors"
              style={{
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              <MaterialIcon name="table_chart" size={16} />
              <span>{t.settings.downloadCsv}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors"
              style={{
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              <MaterialIcon name="download" size={16} />
              <span>{t.settings.downloadJson}</span>
            </button>
          </div>
        </div>

        {/* Sounds */}
        <div
          className="p-6 rounded-3xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <h2 className="text-base font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {locale === 'ar' ? 'الأصوات' : 'Sounds'}
          </h2>
          <label className="flex items-center gap-3 text-sm mb-3 cursor-pointer" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            <MdSwitch selected={tickSoundEnabled} onSelectedChange={setTickSoundEnabled} label={t.settings.tickSound} />
          </label>
          {tickSoundEnabled && (
            <label className="flex items-center gap-3 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              <span className="w-28">{t.settings.tickVolume}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={tickVolume}
                onChange={(e) => setTickVolume(Number(e.target.value))}
                className="flex-1 accent-[var(--md-sys-color-primary)]"
              />
            </label>
          )}
        </div>

        <CustomAudioSettingsCard />
        <EasterEggLauncher />

        {/* Focus mode & motion */}
        <div
          className="p-6 rounded-3xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <h2 className="text-base font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {locale === 'ar' ? 'التركيز والحركة' : 'Focus & Motion'}
          </h2>
          <label className="flex items-center gap-3 text-sm mb-3 cursor-pointer" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            <MdSwitch
              selected={spotlightMode}
              onSelectedChange={setSpotlightMode}
              label={locale === 'ar' ? 'وضع التركيز (إبراز المؤقت)' : 'Spotlight mode (highlight the timer)'}
            />
          </label>
          <p className="text-[11px] mb-3 ms-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {locale === 'ar'
              ? 'يُبقي شريط التنقل والمؤقت وأزرار الإيقاف مؤقتاً والانتقال بارزة ويُخفت بقية الشاشة أثناء عمل المؤقت. اضغط Esc للخروج.'
              : 'Keeps the navigation, clock and pause/skip buttons bright and dims the rest of the screen while the timer runs. Press Esc to exit.'}
          </p>
          <label className="flex items-center gap-3 text-sm cursor-pointer" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            <MdSwitch
              selected={reduceAnimations}
              onSelectedChange={setReduceAnimations}
              label={locale === 'ar' ? 'تقليل الحركة' : 'Reduce animations'}
            />
          </label>
          <p className="text-[11px] mt-1 ms-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {locale === 'ar'
              ? 'يتجاوز إعداد تقليل الحركة في نظام التشغيل.'
              : 'Overrides the operating system reduce-motion setting.'}
          </p>
        </div>

        {/* Reminders (in-app only, no push) */}
        <div
          className="p-6 rounded-3xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {locale === 'ar' ? 'التذكيرات' : 'Reminders'}
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {locale === 'ar'
              ? 'تعمل التذكيرات داخل التطبيق فقط عند فتحه. لا يوجد إرسال في الخلفية بعد.'
              : 'Reminders work inside the app while it is open. Background push is not shipped yet.'}
          </p>
          <label className="flex items-center gap-3 text-sm mb-3 cursor-pointer" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            <MdSwitch
              selected={reminderSettings.enabled}
              onSelectedChange={(v) => setReminderSettings({ ...reminderSettings, enabled: v })}
              label={locale === 'ar' ? 'تفعيل التذكيرات' : 'Enable reminders'}
            />
          </label>
          {reminderSettings.enabled && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                <span>{locale === 'ar' ? 'ساعات الهدوء' : 'Quiet hours'}</span>
                <input
                  type="time"
                  value={reminderSettings.quietStart}
                  onChange={(e) => setReminderSettings({ ...reminderSettings, quietStart: e.target.value })}
                  className="px-2 py-1 rounded-lg border text-xs"
                  style={{ backgroundColor: 'var(--md-sys-color-surface-container)', borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
                />
                <span aria-hidden>–</span>
                <input
                  type="time"
                  value={reminderSettings.quietEnd}
                  onChange={(e) => setReminderSettings({ ...reminderSettings, quietEnd: e.target.value })}
                  className="px-2 py-1 rounded-lg border text-xs"
                  style={{ backgroundColor: 'var(--md-sys-color-surface-container)', borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
                />
              </div>
              {notificationStatus === 'denied' && (
                <p className="text-[11px] font-semibold" style={{ color: 'var(--md-sys-color-error)' }} role="alert">
                  {locale === 'ar'
                    ? 'الإشعارات محظورة. فعّلها من إعدادات المتصفح لعمل التذكيرات.'
                    : 'Notifications are blocked. Enable them in your browser settings for reminders to work.'}
                </p>
              )}
              {notificationStatus !== 'granted' && notificationStatus !== 'denied' && (
                <button
                  onClick={handleRequestNotification}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
                  style={{ borderColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-primary)' }}
                >
                  {locale === 'ar' ? 'السماح بالإشعارات' : 'Allow notifications'}
                </button>
              )}
              {notificationStatus === 'granted' && (
                <p className="text-[11px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {locale === 'ar' ? 'الإشعارات مسموحة' : 'Notifications allowed'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Import Data */}
        <div
          className="p-6 rounded-3xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {t.settings.importData}
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {locale === 'ar'
              ? 'استورد مهامًا من ملف JSON أو CSV. الملفات التالفة تُرفض دون تعطل التطبيق.'
              : 'Import tasks from a JSON or CSV file. Malformed files are rejected safely.'}
          </p>
          {importFeedback && (
            <p className="text-xs mb-3 font-semibold" style={{ color: 'var(--md-sys-color-primary)' }} role="status">
              {importFeedback}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
              style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
            >
              <MaterialIcon name="upload" size={16} />
              <span>{t.settings.importJson}</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFile(f, 'json');
                  e.target.value = '';
                }}
              />
            </label>
            <label
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
              style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
            >
              <MaterialIcon name="upload" size={16} />
              <span>{t.settings.importCsv}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFile(f, 'csv');
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>

        {/* Task Templates */}
        <div
          className="p-6 rounded-3xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {t.settings.templatesTitle}
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {t.settings.templatesDesc}
          </p>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={t.settings.templateNamePlaceholder}
              maxLength={120}
              className="flex-1 px-3.5 py-2.5 rounded-xl border text-sm outline-none"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            />
            <button
              onClick={() => {
                saveTaskListAsTemplate(templateName.trim() || 'Task list');
                setTemplateName('');
              }}
              disabled={tasks.filter((t) => !t.isCompleted).length === 0}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
            >
              {t.settings.saveListAsTemplate}
            </button>
          </div>
          {taskTemplates.length > 0 && (
            <ul className="space-y-2">
              {taskTemplates.map((tpl) => (
                <li
                  key={tpl.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border"
                  style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
                >
                  {renamingId === tpl.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      placeholder={tpl.title}
                      className="flex-1 px-2 py-1 rounded border text-sm"
                      style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {tpl.title} · {tpl.items.length} {locale === 'ar' ? 'عنصر' : 'items'}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {renamingId === tpl.id ? (
                      <button
                        onClick={() => {
                          renameTaskTemplate(tpl.id, renameValue);
                          setRenamingId(null);
                        }}
                        className="text-xs font-semibold cursor-pointer"
                        style={{ color: 'var(--md-sys-color-primary)' }}
                      >
                        {t.settings.renameTemplate}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setRenamingId(tpl.id);
                          setRenameValue(tpl.title);
                        }}
                        className="text-xs cursor-pointer"
                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                      >
                        {t.settings.renameTemplate}
                      </button>
                    )}
                    <button
                      onClick={() => applyTaskTemplate(tpl.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                      style={{ backgroundColor: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' }}
                    >
                      {t.settings.applyTemplate}
                    </button>
                    <button
                      onClick={() => deleteTaskTemplate(tpl.id)}
                      className="text-xs cursor-pointer"
                      style={{ color: 'var(--md-sys-color-error)' }}
                    >
                      {t.settings.deleteTemplate}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Demo Data */}
        <div
          className="p-6 rounded-3xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MaterialIcon name="science" size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
            <h2
              className="text-base font-bold"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.settings.demoDataTitle}
            </h2>
            {demoDataLoaded && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--md-sys-color-tertiary-container)',
                  color: 'var(--md-sys-color-on-tertiary-container)',
                }}
              >
                {locale === 'ar' ? 'تجريبي' : 'Demo'}
              </span>
            )}
          </div>
          <p
            className="text-xs mb-4"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {demoDataLoaded ? t.settings.demoDataLoaded : t.settings.demoDataDescription}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {!demoDataLoaded ? (
              <button
                onClick={loadDemoData}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-primary)',
                }}
              >
                <MaterialIcon name="download" size={16} />
                <span>{t.settings.loadDemoData}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirm(locale === 'ar' ? 'إزالة جميع البيانات التجريبية؟' : 'Remove all demo data?')) {
                    resetAllData();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--md-sys-color-error)',
                  color: 'var(--md-sys-color-error)',
                }}
              >
                <MaterialIcon name="delete" size={16} />
                <span>{t.settings.clearDemoData}</span>
              </button>
            )}
          </div>
        </div>

        {/* Account and Data Reset */}
        <div
          className="p-6 rounded-3xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2
                className="text-base font-bold"
                style={{ color: 'var(--md-sys-color-on-surface)' }}
              >
                {t.settings.account}
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                {!firebaseEnabled
                  ? t.settings.cloudNotConfigured
                  : authStatus === 'loading'
                  ? '…'
                  : user
                  ? `${t.settings.signedInAs} ${user.email ?? user.displayName ?? user.uid}`
                  : t.settings.guestMode}
              </p>
              {firebaseEnabled && user && (
                <p
                  className="text-xs mt-0.5"
                  style={{
                    color: syncError
                      ? 'var(--md-sys-color-error)'
                      : cloudSyncEnabled
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-outline)',
                  }}
                >
                  {syncError ? t.settings.syncFailed : cloudSyncEnabled ? t.settings.syncActive : t.settings.syncPaused}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {firebaseEnabled && !user && authStatus === 'ready' && (
                <button
                  onClick={() => void signIn()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                  }}
                >
                  {t.settings.signInGoogle}
                </button>
              )}
              {user && (
                <button
                  onClick={() => void signOutAccount()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer"
                  style={{
                    borderColor: 'var(--md-sys-color-outline-variant)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {t.settings.signOut}
                </button>
              )}
              <button
              onClick={() => {
                if (confirm(locale === 'ar' ? 'هل أنت متأكد من مسح جميع البيانات المحلية؟' : 'Are you sure you want to reset all local data?')) {
                  resetAllData();
                }
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer"
              style={{
                borderColor: 'var(--md-sys-color-error)',
                color: 'var(--md-sys-color-error)',
                backgroundColor: 'transparent',
              }}
            >
              {locale === 'ar' ? 'إعادة ضبط البيانات' : 'Reset Local Data'}
            </button>
            </div>
          </div>
        </div>

        {/* Browser extension (optional, local-first) */}
        <ExtensionSettingsCard />

        {/* Legal */}
        <div
          className="p-6 rounded-3xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <h2 className="text-base font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {locale === 'ar' ? 'قانوني' : 'Legal'}
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigateToAppTab('terms')}
              className="px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer"
              style={{
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              {t.nav.terms}
            </button>
            <button
              onClick={() => navigateToAppTab('privacy')}
              className="px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer"
              style={{
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              {t.nav.privacy}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
