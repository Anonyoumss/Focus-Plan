import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { navigateToAppTab } from '../../lib/router';

interface InvitePageProps {
  code: string;
}

export const InvitePage: React.FC<InvitePageProps> = ({ code }) => {
  const { locale } = useAppStore();
  const t = TRANSLATIONS[locale];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        backgroundColor: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-on-surface)',
      }}
    >
      <div
        className="w-full max-w-md p-8 rounded-3xl border text-center"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
          }}
        >
          <MaterialIcon name="group_off" size={28} />
        </div>

        <h1
          className="text-xl font-bold font-display mb-2"
          style={{ color: 'var(--md-sys-color-on-surface)' }}
        >
          {t.invite.title}
        </h1>
        <p
          className="text-sm leading-relaxed mb-5"
          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {t.invite.body}
        </p>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold mb-6"
          style={{
            borderColor: 'var(--md-sys-color-outline-variant)',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          <MaterialIcon name="tag" size={14} />
          <span>{t.invite.codeLabel}: {code}</span>
        </div>

        <div>
          <button
            onClick={() => navigateToAppTab('focus')}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
            }}
          >
            {t.invite.backCta}
          </button>
        </div>
      </div>
    </div>
  );
};
