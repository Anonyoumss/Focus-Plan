import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MdDialog } from '../common/MdControls';

/**
 * Shown after Google sign-in when both local guest data and cloud data
 * exist (or local data exists and the cloud is empty). The user explicitly
 * chooses import, cloud, or defer; cloud data is never overwritten silently.
 */
export const MigrationDialog: React.FC = () => {
  const { locale, migrationChoice, resolveMigration } = useAppStore();
  const t = TRANSLATIONS[locale];

  if (!migrationChoice) return null;

  return (
    <MdDialog
      open
      onClose={() => resolveMigration('later')}
      label={t.migration.title}
    >
      <div className="p-6 max-w-md">
        <h2
          className="text-lg font-bold font-display mb-2"
          style={{ color: 'var(--md-sys-color-on-surface)' }}
        >
          {t.migration.title}
        </h2>
        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {migrationChoice === 'both' ? t.migration.bodyBoth : t.migration.bodyLocal}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => resolveMigration('later')}
            className="px-4 py-2 rounded-xl text-xs font-medium border cursor-pointer"
            style={{
              borderColor: 'var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            {t.migration.later}
          </button>
          {migrationChoice === 'both' && (
            <button
              onClick={() => resolveMigration('cloud')}
              className="px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
              style={{
                borderColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-primary)',
              }}
            >
              {t.migration.useCloud}
            </button>
          )}
          <button
            onClick={() => resolveMigration('import')}
            className="px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
            }}
          >
            {t.migration.import}
          </button>
        </div>
      </div>
    </MdDialog>
  );
};
