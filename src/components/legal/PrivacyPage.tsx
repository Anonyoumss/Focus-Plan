import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { navigateToAppTab } from '../../lib/router';

export const PrivacyPage: React.FC = () => {
  const { locale } = useAppStore();
  const t = TRANSLATIONS[locale];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigateToAppTab('focus')}
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
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {t.legal.lastUpdated}
          </p>
        </div>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            1. 100% Local Device Storage (Current Release)
          </h2>
          <p>
            By default, Focus Plan M3E saves all your tasks, countdown sessions, streaks, badges, coins, and test goals exclusively within your browser's localStorage. If you choose to sign in with Google (when cloud sync is configured), your tasks, session logs, test goals, templates, settings, wallet balance, and ledger entries are stored in Google Cloud Firestore under a private per-user path readable only by your account. Signing out clears the synced data from this device.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            2. What the Cloud Stores
          </h2>
          <p>
            Cloud Firestore holds only the study records listed above, scoped to your account by security rules. Firebase Authentication handles sign-in; the app does not collect analytics, advertising identifiers, or contacts. Until you authenticate, no personal data leaves your machine.
          </p>
          <p>
            Study groups are optional and require sign-in. When you join a group, the group's other members can see your chosen alias, your join date, the group tasks you can see, and the focus minutes you log against shared group tasks. Your private profile (email, tasks, session history, wallet) is never visible to other users.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            3. Leaderboards & Public Visibility
          </h2>
          <p>
            Each group shows an internal leaderboard of weekly or daily focus minutes to its members only. Separately, the public leaderboard is off by default: if you opt in, other signed-in users can see only the alias you choose plus the statistics you explicitly enable (weekly minutes and/or streak). Focus points and your private profile are never published. Turning the opt-in off removes your public leaderboard entry and stops sharing your statistics. You can leave a group at any time, which removes your membership and the minutes you contributed stay attributed to the group record.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            4. Right to Deletion & Data Export
          </h2>
          <p>
            You have full ownership of your data. You can download a complete JSON backup or CSV summary of your tasks at any moment, and purge all stored data with a single click in Settings. For cloud data, leaving a group removes your membership immediately, disabling the public leaderboard opt-in deletes your public entry, and signing out wipes synced data from the device. Deleting your Firebase account data entirely is not self-serve in this release.
          </p>
        </section>
      </div>
    </div>
  );
};
