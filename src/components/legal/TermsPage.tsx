import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';

export const TermsPage: React.FC = () => {
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
            {t.legal.termsTitle}
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
            1. Purpose and Current Local State
          </h2>
          <p>
            Focus Plan M3E is currently operating exclusively as a client-side web application. All session timers, task goals, streak records, and mock leaderboards are stored solely within your local browser storage. No data is transmitted to Firebase, Google Cloud, or third-party servers at this time.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            2. Future Google Workspace & Cloud Services
          </h2>
          <p>
            Future releases will introduce optional Google sign-in and Workspace synchronizations (Google Tasks and Google Calendar). When released, these integrations will strictly require explicit user authorization. No credentials or tokens are currently collected.
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
            4. User Accountability & Fair Play
          </h2>
          <p>
            Study circles and leaderboards are designed for honest mutual motivation. Automated scripts or attempts to manipulate coin balances or focus hours may result in leaderboard disqualification.
          </p>
        </section>
      </div>
    </div>
  );
};
