import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { TimerDisplay } from '../focus/TimerDisplay';
import { TaskList } from '../focus/TaskList';
import { ProgressStatCards } from '../progress/ProgressStatCards';
import { TEST_CATALOG } from '../../data/tests/catalog';
import { navigateToAppTab } from '../../lib/router';
import { syncDocumentTheme } from '../../design/theme';

export const LandingPage: React.FC = () => {
  const { locale, setLocale, themeMode, setThemeMode, seedHex } = useAppStore();
  const t = TRANSLATIONS[locale];

  useEffect(() => {
    syncDocumentTheme(themeMode, seedHex);
  }, [themeMode, seedHex]);

  const toggleTheme = () => {
    if (themeMode === 'light') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('system');
    else setThemeMode('light');
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{
        backgroundColor: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-on-surface)',
      }}
    >
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          backgroundColor: 'var(--md-sys-color-surface)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
              }}
            >
              <MaterialIcon name="timer" size={20} filled />
            </div>
            <span className="text-base font-bold font-display">{t.appName}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {locale === 'en' ? 'عربي' : 'EN'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              aria-label={t.settings.themeMode}
            >
              <MaterialIcon
                name={themeMode === 'dark' ? 'dark_mode' : themeMode === 'light' ? 'light_mode' : 'brightness_auto'}
                size={20}
              />
            </button>
            <button
              onClick={() => navigateToAppTab('focus')}
              className="ms-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              {t.landing.openApp}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 pt-14 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="pt-6">
              <h1
                className="text-4xl sm:text-5xl font-bold font-display leading-tight"
                style={{ color: 'var(--md-sys-color-on-surface)' }}
              >
                {t.landing.headline}
              </h1>
              <p
                className="text-base mt-4 max-w-md leading-relaxed"
                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                {t.landing.subheadline}
              </p>
              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={() => navigateToAppTab('focus')}
                  className="px-7 py-3.5 rounded-2xl text-sm font-semibold cursor-pointer transition-transform active:scale-98 shadow-md"
                  style={{
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                  }}
                >
                  {t.landing.cta}
                </button>
                <span
                  className="text-xs flex items-center gap-1.5"
                  style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  <MaterialIcon name="lock" size={14} />
                  {t.landing.privacyFirst}
                </span>
              </div>
            </div>

            <TimerDisplay />
          </div>
        </section>

        {/* Goals section */}
        <section
          className="border-t"
          style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
        >
          <div className="max-w-6xl mx-auto px-4 py-14">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              <div className="lg:col-span-2">
                <h2
                  className="text-2xl font-bold font-display"
                  style={{ color: 'var(--md-sys-color-on-surface)' }}
                >
                  {t.landing.goalsTitle}
                </h2>
                <p
                  className="text-sm mt-3 leading-relaxed"
                  style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  {t.landing.goalsDesc}
                </p>
              </div>
              <div className="lg:col-span-3">
                <TaskList />
              </div>
            </div>
          </div>
        </section>

        {/* Streak section */}
        <section
          className="border-t"
          style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
        >
          <div className="max-w-6xl mx-auto px-4 py-14">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
              <div className="lg:col-span-3">
                <ProgressStatCards />
              </div>
              <div className="lg:col-span-2">
                <h2
                  className="text-2xl font-bold font-display"
                  style={{ color: 'var(--md-sys-color-on-surface)' }}
                >
                  {t.landing.streakTitle}
                </h2>
                <p
                  className="text-sm mt-3 leading-relaxed"
                  style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  {t.landing.streakDesc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tests section */}
        <section
          className="border-t"
          style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
        >
          <div className="max-w-6xl mx-auto px-4 py-14">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              <div className="lg:col-span-2">
                <h2
                  className="text-2xl font-bold font-display"
                  style={{ color: 'var(--md-sys-color-on-surface)' }}
                >
                  {t.landing.testsTitle}
                </h2>
                <p
                  className="text-sm mt-3 leading-relaxed"
                  style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  {t.landing.testsDesc}
                </p>
                <p
                  className="text-xs mt-4 flex items-start gap-1.5"
                  style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  <MaterialIcon name="verified" size={14} className="shrink-0 mt-0.5" />
                  {t.landing.verifyNote}
                </p>
                <button
                  onClick={() => navigateToAppTab('tests')}
                  className="mt-6 px-5 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors"
                  style={{
                    borderColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-primary)',
                  }}
                >
                  {t.landing.testsCta}
                </button>
              </div>

              <ul className="lg:col-span-3 divide-y" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                {TEST_CATALOG.map((test) => (
                  <li
                    key={test.id}
                    className="flex items-center justify-between gap-4 py-3"
                    style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
                  >
                    <div className="min-w-0">
                      <span
                        className="text-xs font-bold me-2"
                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                      >
                        {test.code}
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--md-sys-color-on-surface)' }}
                      >
                        {locale === 'ar' ? test.nameAr : test.nameEn}
                      </span>
                    </div>
                    <a
                      href={test.officialPortal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs shrink-0 flex items-center gap-1 hover:underline"
                      style={{ color: 'var(--md-sys-color-primary)' }}
                    >
                      {locale === 'ar' ? 'الموقع الرسمي' : 'Official site'}
                      <MaterialIcon name="open_in_new" size={13} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer
        className="border-t py-5 px-4"
        style={{
          borderColor: 'var(--md-sys-color-outline-variant)',
          color: 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>Focus Plan M3E © 2026</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateToAppTab('terms')}
              className="hover:underline cursor-pointer"
            >
              {t.nav.terms}
            </button>
            <button
              onClick={() => navigateToAppTab('privacy')}
              className="hover:underline cursor-pointer"
            >
              {t.nav.privacy}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
