import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { navigateToAppTab } from '../../lib/router';

export const TermsPage: React.FC = () => {
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
            {t.legal.termsTitle}
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
            1. Purpose and Current Local State
          </h2>
          <p>
            Focus Plan M3E works fully as a guest: timers, task goals, streaks, coins, and test records are stored in your browser's local storage. If cloud sync is configured for this build, you may optionally sign in with Google. Signing in syncs your tasks, session logs, test goals, templates, settings, wallet, and ledger to Google Cloud Firestore under a private per-user path, and enables optional study groups. No data leaves your device unless you choose to sign in.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            2. Google Sign-In & Future Integrations
          </h2>
          <p>
            Google sign-in uses Firebase Authentication and requests only basic profile scopes. On first sign-in you choose whether to import existing local data or keep the cloud copy; nothing is merged silently. Future releases may add Google Tasks and Google Calendar integrations, which will strictly require explicit user authorization.
          </p>
          <p className="pt-2">
            Scheduled push notifications and calendar reminders are not part of this release. The only alerts today are in-app notification permission requests for session completion while the app is open.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            3. Standardized Test Information Disclaimer
          </h2>
          <p>
            Standardized test dates, syllabus structures, and scoring scales provided in the catalog (including Saudi GAT, SAAT, STEP, KFUPM and International SAT, ACT, IELTS, TOEFL, Duolingo) are reference benchmarks. You are solely responsible for verifying registration deadlines and test dates directly on official test authority portals.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            4. Optional AI Features
          </h2>
          <p>
            When the optional AI assistant is available, requests are sent through our server to Google Gemini. Only what the feature needs is transmitted: test names, section names, target and current scores, section score ranges, and study-planning numbers. Your name, email, tasks, notes, and session history are never sent. AI output is always a suggestion you review and confirm; nothing is saved until you accept it.
          </p>
          <p className="pt-2">
            The AI service currently runs on Google's unpaid (free) tier, under which Google may use submitted content to improve its products and human reviewers may process it. Do not enter sensitive personal information into AI prompts. If the service is unavailable, the app falls back to clearly labeled local estimates.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            5. User Accountability & Fair Play
          </h2>
          <p>
            Study groups are optional and available only when you sign in. Anyone holding a group's invite code or link can join; treat invite codes like passwords and share them only with people you want in the group. Group leaderboards and the opt-in public leaderboard rank members by self-reported focus minutes. Because award and ranking calculations run on your device, they are an honor system and are not verified or cheat-proof. You are responsible for the alias you publish and for leaving groups you no longer wish to participate in. Study data you create yourself is yours to export or delete at any time in Settings.
          </p>
        </section>
      </div>
    </div>
  );
};
