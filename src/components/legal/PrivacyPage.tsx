import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';

export const PrivacyPage: React.FC = () => {
  const { locale, setActiveTab } = useAppStore();
  const t = TRANSLATIONS[locale];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => setActiveTab('focus')}
        className="flex items-center gap-1.5 text-xs font-semibold mb-6 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer"
        style={{
          borderColor: 'var(--md-sys-color-outline-variant)',
          color: 'var(--md-sys-color-primary)',
        }}
      >
        <MaterialIcon name="arrow_back" size={16} className="rtl:rotate-180" />
        <span>{t.legal.backToApp}</span>
      </button>

      <div
        className="p-8 rounded-3xl border space-y-6"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div>
          <h1
            className="text-2xl font-bold font-display"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {t.legal.privacyTitle}
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--md-sys-color-outline)' }}
          >
            {t.legal.lastUpdated}
          </p>
        </div>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            1. 100% Local Device Storage (Current Release)
          </h2>
          <p>
            Currently, Focus Plan M3E saves all your tasks, countdown sessions, streaks, badges, and test goals exclusively within your browser's localStorage. No data is transmitted to Firebase, Google, or any remote server.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            2. Future Cloud Sync Architecture
          </h2>
          <p>
            When Firebase Authentication and Cloud Firestore are introduced in Phase 3, you will have the choice to synchronize your local records to a secure private profile. Until you authenticate, no personal data leaves your machine.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            3. Leaderboards & Public Visibility
          </h2>
          <p>
            Your profile and focus minutes are only visible to members of study circles you explicitly join. The public global leaderboard is opt-in and disabled by default. You can change your privacy settings at any time in Settings.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            4. Right to Deletion & Data Export
          </h2>
          <p>
            You have full ownership of your data. You can download a complete JSON backup or CSV summary of your tasks at any moment, and purge all stored data with a single click in Settings.
          </p>
        </section>
      </div>
    </div>
  );
};
