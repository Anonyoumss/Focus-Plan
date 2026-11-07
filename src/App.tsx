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
import { AppRoute, parseHashRoute, subscribeToHash } from './lib/router';

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
      <Suspense fallback={null}>
        <OnboardingModal />
        <MigrationDialog />
        <ShortcutsModal />
      </Suspense>
    </Shell>
  );
}
