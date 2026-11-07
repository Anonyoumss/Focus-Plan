import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from './MaterialIcon';

export const ShortcutsModal: React.FC = () => {
  const { locale, showShortcutsModal, setShowShortcutsModal } = useAppStore();
  const t = TRANSLATIONS[locale];

  if (!showShortcutsModal) return null;

  const shortcutsList = [
    { key: 'Space', desc: t.shortcuts.space },
    { key: 'R', desc: t.shortcuts.reset },
    { key: 'S', desc: t.shortcuts.skip },
    { key: '1 / 2 / 3', desc: t.shortcuts.modes },
    { key: 'N', desc: t.shortcuts.newTask },
    { key: '?', desc: t.shortcuts.help },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 border shadow-xl animate-in fade-in zoom-in-95"
        style={{
          backgroundColor: 'var(--md-sys-color-surface)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MaterialIcon name="keyboard" size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
            <h3
              className="text-base font-bold"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.shortcuts.title}
            </h3>
          </div>

          <button
            onClick={() => setShowShortcutsModal(false)}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            <MaterialIcon name="close" size={18} />
          </button>
        </div>

        <div className="space-y-2.5 mb-6">
          {shortcutsList.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl border text-xs"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderColor: 'var(--md-sys-color-outline-variant)',
              }}
            >
              <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{item.desc}</span>
              <kbd
                className="px-2 py-1 rounded-md font-mono font-bold text-[11px] border shadow-xs"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                  borderColor: 'var(--md-sys-color-outline)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowShortcutsModal(false)}
            className="px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
            }}
          >
            {t.shortcuts.close}
          </button>
        </div>
      </div>
    </div>
  );
};
