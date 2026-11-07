import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { THEME_PRESETS, ThemeMode } from '../../design/theme';
import { MaterialIcon } from '../common/MaterialIcon';
import { MdSwitch } from '../common/MdControls';

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
  } = useAppStore();

  const t = TRANSLATIONS[locale];
  const [, setCustomHex] = useState(seedHex);
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

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
              style={{ color: 'var(--md-sys-color-outline)' }}
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
              style={{ color: 'var(--md-sys-color-outline)' }}
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
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-outline)' }}>
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
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-outline)' }}>
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
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-outline)' }}>
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
          <div className="flex items-center justify-between">
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
                {t.settings.guestMode}
              </p>
            </div>

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
    </div>
  );
};
