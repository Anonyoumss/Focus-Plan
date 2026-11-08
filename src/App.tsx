/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { syncDocumentTheme } from './design/theme';
import { soundEngine } from './lib/soundEngine';
import { Shell } from './components/layout/Shell';
import { TimerDisplay } from './components/focus/TimerDisplay';
import { TaskList } from './components/focus/TaskList';

const PlanView = lazy(() => import('./components/plan/PlanView').then((m) => ({ default: m.PlanView })));
const TestsView = lazy(() => import('./components/tests/TestsView').then((m) => ({ default: m.TestsView })));
const ProgressView = lazy(() => import('./components/progress/ProgressView').then((m) => ({ default: m.ProgressView })));
const FriendsView = lazy(() => import('./components/friends/FriendsView').then((m) => ({ default: m.FriendsView })));
const StoreView = lazy(() => import('./components/store/StoreView').then((m) => ({ default: m.StoreView })));
const SettingsView = lazy(() => import('./components/settings/SettingsView').then((m) => ({ default: m.SettingsView })));
const TermsPage = lazy(() => import('./components/legal/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./components/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const OnboardingModal = lazy(() => import('./components/onboarding/OnboardingModal').then((m) => ({ default: m.OnboardingModal })));
const MigrationDialog = lazy(() => import('./components/auth/MigrationDialog').then((m) => ({ default: m.MigrationDialog })));
const ShortcutsModal = lazy(() => import('./components/common/ShortcutsModal').then((m) => ({ default: m.ShortcutsModal })));
const LandingPage = lazy(() => import('./components/landing/LandingPage').then((m) => ({ default: m.LandingPage })));
const InvitePage = lazy(() => import('./components/landing/InvitePage').then((m) => ({ default: m.InvitePage })));
const ReferralPage = lazy(() => import('./components/landing/ReferralPage').then((m) => ({ default: m.ReferralPage })));
import { AppRoute, parseHashRoute, subscribeToHash } from './lib/router';

function SwUpdateBanner() {
  const { locale } = useAppStore();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onUpdate = () => setVisible(true);
    window.addEventListener('sw:update-available', onUpdate);
    return () => window.removeEventListener('sw:update-available', onUpdate);
  }, []);
  if (!visible) return null;
  const reload = () => {
    navigator.serviceWorker?.getRegistration().then((reg) => {
      reg?.waiting?.postMessage('SKIP_WAITING');
    });
    // controllerchange fires after the new worker takes over.
    navigator.serviceWorker?.addEventListener('controllerchange', () => window.location.reload());
  };
  const ar = locale === 'ar';
  return (
    <div
      role="status"
      className="fixed bottom-20 inset-x-4 sm:inset-x-auto sm:end-6 sm:bottom-6 z-[60] flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
        borderColor: 'var(--md-sys-color-outline-variant)',
        color: 'var(--md-sys-color-on-surface)',
      }}
    >
      <span className="text-sm flex-1">
        {ar ? 'يتوفر إصدار جديد من التطبيق.' : 'A new version of the app is available.'}
      </span>
      <button
        onClick={reload}
        className="text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
        style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
      >
        {ar ? 'تحديث' : 'Update'}
      </button>
      <button
        onClick={() => setVisible(false)}
        aria-label={ar ? 'إغلاق' : 'Dismiss'}
        className="p-1 rounded cursor-pointer"
        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
      >
        ×
      </button>
    </div>
  );
}

export default function App() {
  const { activeTab, setActiveTab, themeMode, seedHex, locale } = useAppStore();
  const [route, setRoute] = useState<AppRoute>(() => parseHashRoute(window.location.hash));

  useEffect(() => subscribeToHash(() => setRoute(parseHashRoute(window.location.hash))), []);

  useEffect(() => {
    if (route.name === 'app' && route.tab !== activeTab) {
      setActiveTab(route.tab);
    }
  }, [route, activeTab, setActiveTab]);

  // Initialize dynamic M3 theme & text direction on launch
  useEffect(() => {
    syncDocumentTheme(themeMode, seedHex);
    const dark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    void import('./lib/native/capacitor').then((m) => m.nativeSyncStatusBar(dark));
  }, [themeMode, seedHex]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
  }, [locale]);

  // Ambient/tick audio belongs to the app shell; stop it when the user
  // leaves app routes (landing, legal, invite).
  useEffect(() => {
    if (route.name !== 'app') {
      soundEngine.stopAmbient();
    }
  }, [route.name]);

  if (route.name === 'landing') {
    return (
      <Suspense fallback={null}>
        <LandingPage />
      </Suspense>
    );
  }

  if (route.name === 'invite') {
    return (
      <Suspense fallback={null}>
        <InvitePage code={route.code} />
      </Suspense>
    );
  }

  if (route.name === 'referral') {
    return (
      <Suspense fallback={null}>
        <ReferralPage code={route.code} />
      </Suspense>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'focus':
        return (
          <div className="py-2">
            <TimerDisplay />
            <TaskList />
          </div>
        );
      case 'plan':
        return <PlanView />;
      case 'tests':
        return <TestsView />;
      case 'progress':
        return <ProgressView />;
      case 'friends':
        return <FriendsView />;
      case 'store':
        return <StoreView />;
      case 'settings':
        return <SettingsView />;
      case 'terms':
        return <TermsPage />;
      case 'privacy':
        return <PrivacyPage />;
      default:
        return (
          <div className="py-2">
            <TimerDisplay />
            <TaskList />
          </div>
        );
    }
  };

  return (
    <Shell>
      <Suspense fallback={null}>{renderActiveView()}</Suspense>
      <SwUpdateBanner />
      <Suspense fallback={null}>
        <OnboardingModal />
        <MigrationDialog />
        <ShortcutsModal />
      </Suspense>
    </Shell>
  );
}
