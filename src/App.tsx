/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
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
import { ShortcutsModal } from './components/common/ShortcutsModal';

export default function App() {
  const { activeTab, themeMode, seedHex, locale } = useAppStore();

  // Initialize dynamic M3 theme & text direction on launch
  useEffect(() => {
    syncDocumentTheme(themeMode, seedHex);
  }, [themeMode, seedHex]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
  }, [locale]);

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
      <ShortcutsModal />
    </Shell>
  );
}
