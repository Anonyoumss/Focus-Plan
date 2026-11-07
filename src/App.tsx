/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { syncDocumentTheme } from './design/theme';
import { Shell } from './components/layout/Shell';
import { TimerDisplay } from './components/focus/TimerDisplay';
import { TaskList } from './components/focus/TaskList';
import { PlanView } from './components/plan/PlanView';
import { TestsView } from './components/tests/TestsView';
import { ProgressView } from './components/progress/ProgressView';
import { FriendsView } from './components/friends/FriendsView';
import { StoreView } from './components/store/StoreView';
import { SettingsView } from './components/settings/SettingsView';
import { TermsPage } from './components/legal/TermsPage';
import { PrivacyPage } from './components/legal/PrivacyPage';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { MigrationDialog } from './components/auth/MigrationDialog';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { LandingPage } from './components/landing/LandingPage';
import { InvitePage } from './components/landing/InvitePage';
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

  if (route.name === 'landing') {
    return <LandingPage />;
  }

  if (route.name === 'invite') {
    return <InvitePage code={route.code} />;
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
      {renderActiveView()}
      <OnboardingModal />
      <MigrationDialog />
      <ShortcutsModal />
    </Shell>
  );
}
