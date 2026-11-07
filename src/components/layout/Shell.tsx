import React, { useEffect, useState } from 'react';
import { useAppStore, TabDestination } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const {
    locale,
    setLocale,
    themeMode,
    setThemeMode,
    activeTab,
    setActiveTab,
    setShowShortcutsModal,
    startTimer,
    pauseTimer,
    isRunning,
    resetTimer,
    skipTimer,
    setTimerMode,
  } = useAppStore();

  const t = TRANSLATIONS[locale];
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  // Global Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) pauseTimer();
        else startTimer();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetTimer();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        skipTimer();
      } else if (e.key === '1') {
        e.preventDefault();
        setTimerMode('focus');
      } else if (e.key === '2') {
        e.preventDefault();
        setTimerMode('shortBreak');
      } else if (e.key === '3') {
        e.preventDefault();
        setTimerMode('longBreak');
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, startTimer, pauseTimer, resetTimer, skipTimer, setTimerMode, setShowShortcutsModal]);

  const navItems: { id: TabDestination; label: string; icon: string }[] = [
    { id: 'focus', label: t.nav.focus, icon: 'timer' },
    { id: 'plan', label: t.nav.plan, icon: 'checklist' },
    { id: 'tests', label: t.nav.tests, icon: 'school' },
    { id: 'progress', label: t.nav.progress, icon: 'bar_chart' },
    { id: 'friends', label: t.nav.friends, icon: 'groups' },
    { id: 'store', label: t.nav.store, icon: 'shopping_bag' },
    { id: 'settings', label: t.nav.settings, icon: 'settings' },
  ];

  const primaryNavItems = navItems.slice(0, 4);
  const overflowNavItems = navItems.slice(4);
  const moreIsActive = overflowNavItems.some((item) => item.id === activeTab);

  const toggleTheme = () => {
    if (themeMode === 'light') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('system');
    else setThemeMode('light');
  };

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row transition-colors"
      style={{
        backgroundColor: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-on-surface)',
      }}
    >
      {/* Desktop / Tablet M3 Navigation Rail */}
      <aside
        className="hidden md:flex flex-col items-center justify-between w-20 py-6 border-e shrink-0 select-none z-30"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        {/* Brand Logo mark */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setActiveTab('focus')}
            className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-transform active:scale-95"
            style={{
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
            }}
            title={t.appName}
          >
            <MaterialIcon name="timer" size={26} filled />
          </button>
        </div>

        {/* Primary Destinations */}
        <nav className="flex flex-col items-center gap-2 my-auto" aria-label="Main Navigation Rail">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center w-16 py-1.5 rounded-2xl transition-all cursor-pointer group"
                title={item.label}
              >
                <div
                  className={`w-14 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? 'shadow-xs' : 'group-hover:bg-black/5 dark:group-hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: isActive
                      ? 'var(--md-sys-color-primary)'
                      : 'transparent',
                    color: isActive
                      ? 'var(--md-sys-color-on-primary)'
                      : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  <MaterialIcon name={item.icon} size={22} filled={isActive} />
                </div>
                <span
                  className="text-[11px] font-medium tracking-tight mt-1 truncate max-w-16"
                  style={{
                    color: isActive
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer controls: Theme, Language, Shortcuts */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            title={t.settings.themeMode}
            aria-label={t.settings.themeMode}
          >
            <MaterialIcon
              name={themeMode === 'dark' ? 'dark_mode' : themeMode === 'light' ? 'light_mode' : 'brightness_auto'}
              size={20}
            />
          </button>

          <button
            onClick={toggleLocale}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-xs font-bold"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            title="Toggle Language"
            aria-label="Toggle Language"
          >
            {locale === 'en' ? 'AR' : 'EN'}
          </button>

          <button
            onClick={() => setShowShortcutsModal(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            title={t.shortcuts.title}
            aria-label={t.shortcuts.title}
          >
            <MaterialIcon name="keyboard" size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Mobile Top Header Bar */}
        <header
          className="flex md:hidden items-center justify-between px-4 py-3 border-b sticky top-0 z-20"
          style={{
            backgroundColor: 'var(--md-sys-color-surface)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
              }}
            >
              <MaterialIcon name="timer" size={20} filled />
            </div>
            <span
              className="text-base font-bold tracking-tight font-display"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.appName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleLocale}
              className="p-1.5 rounded-lg text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {locale === 'en' ? 'عربي' : 'EN'}
            </button>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              <MaterialIcon
                name={themeMode === 'dark' ? 'dark_mode' : themeMode === 'light' ? 'light_mode' : 'brightness_auto'}
                size={20}
              />
            </button>
          </div>
        </header>

        {/* Active Page Component Body */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Global Footer with Plain-Language Legal Links */}
        <footer
          className="border-t py-4 px-6 text-center text-xs mt-auto"
          style={{
            borderColor: 'var(--md-sys-color-outline-variant)',
            color: 'var(--md-sys-color-outline)',
          }}
        >
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setActiveTab('terms')}
              className="hover:underline cursor-pointer"
            >
              {t.nav.terms}
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('privacy')}
              className="hover:underline cursor-pointer"
            >
              {t.nav.privacy}
            </button>
            <span aria-hidden="true">·</span>
            <span>Focus Plan M3E © 2026</span>
          </div>
        </footer>
      </div>

      {/* Mobile Floating Bottom Navigation Bar */}
      <nav
        className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 border-t px-2 z-40 items-center justify-around"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
        aria-label="Mobile Bottom Navigation"
      >
        {primaryNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] cursor-pointer"
            >
              <div
                className={`w-12 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? 'shadow-xs' : ''
                }`}
                style={{
                  backgroundColor: isActive
                    ? 'var(--md-sys-color-primary)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--md-sys-color-on-primary)'
                    : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                <MaterialIcon name={item.icon} size={20} filled={isActive} />
              </div>
              <span
                className="text-[10px] font-medium tracking-tight mt-0.5 truncate"
                style={{
                  color: isActive
                    ? 'var(--md-sys-color-primary)'
                    : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More button opens a sheet with Friends, Store, and Settings */}
        <button
          onClick={() => setShowMoreSheet(true)}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] cursor-pointer"
          aria-haspopup="dialog"
          aria-expanded={showMoreSheet}
        >
          <div
            className={`w-12 h-7 rounded-full flex items-center justify-center transition-colors ${
              moreIsActive ? 'shadow-xs' : ''
            }`}
            style={{
              backgroundColor: moreIsActive
                ? 'var(--md-sys-color-primary)'
                : 'transparent',
              color: moreIsActive
                ? 'var(--md-sys-color-on-primary)'
                : 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            <MaterialIcon name={moreIsActive ? 'menu_open' : 'menu'} size={20} filled={moreIsActive} />
          </div>
          <span
            className="text-[10px] font-medium tracking-tight mt-0.5 truncate"
            style={{
              color: moreIsActive
                ? 'var(--md-sys-color-primary)'
                : 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            {t.nav.more}
          </span>
        </button>
      </nav>

      {/* Mobile "More" bottom sheet */}
      {showMoreSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t.nav.more}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMoreSheet(false)}
          />
          <div
            className="relative w-full rounded-t-3xl border-t p-4 pb-8"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
            <div className="space-y-1">
              {overflowNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowMoreSheet(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer text-start"
                    style={{
                      backgroundColor: isActive
                        ? 'var(--md-sys-color-primary-container)'
                        : 'transparent',
                      color: isActive
                        ? 'var(--md-sys-color-on-primary-container)'
                        : 'var(--md-sys-color-on-surface)',
                    }}
                  >
                    <MaterialIcon name={item.icon} size={22} filled={isActive} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
