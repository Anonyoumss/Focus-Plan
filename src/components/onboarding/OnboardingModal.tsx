import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { THEME_PRESETS } from '../../design/theme';
import { MaterialIcon } from '../common/MaterialIcon';

export const OnboardingModal: React.FC = () => {
  const {
    locale,
    onboardingCompleted,
    setOnboardingCompleted,
    seedHex,
    setSeedHex,
    addTask,
  } = useAppStore();

  const t = TRANSLATIONS[locale];
  const [step, setStep] = useState(1);
  const [firstTaskName, setFirstTaskName] = useState('GAT Quantitative Problem Set');

  if (onboardingCompleted) return null;

  const handleFinish = () => {
    if (firstTaskName.trim()) {
      addTask({
        title: firstTaskName.trim(),
        category: 'Standardized Tests',
        estimatedSessions: 4,
        minGoal: 2,
        maxGoal: 6,
        cadence: 'daily',
        notes: 'Created during onboarding kickoff',
      });
    }
    setOnboardingCompleted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--md-sys-color-surface)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: step === s ? '24px' : '8px',
                  backgroundColor:
                    step === s
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-surface-container-highest)',
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setOnboardingCompleted(true)}
            className="text-xs font-semibold hover:underline cursor-pointer"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {t.onboarding.skip}
          </button>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
              }}
            >
              <MaterialIcon name="palette" size={26} />
            </div>

            <h2
              className="text-xl font-bold font-display mb-1"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.onboarding.step1Title}
            </h2>
            <p
              className="text-xs mb-6"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {t.onboarding.step1Subtitle}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {THEME_PRESETS.map((preset) => {
                const isSelected = seedHex.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSeedHex(preset.hex)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                      isSelected ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--md-sys-color-surface-container-low)',
                      borderColor: 'var(--md-sys-color-outline-variant)',
                      boxShadow: isSelected ? '0 0 0 2px var(--md-sys-color-primary)' : 'none',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <div className="truncate text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {locale === 'ar' ? preset.nameAr : preset.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
              }}
            >
              <MaterialIcon name="target" size={26} />
            </div>

            <h2
              className="text-xl font-bold font-display mb-1"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.onboarding.step2Title}
            </h2>
            <p
              className="text-xs mb-6"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {t.onboarding.step2Subtitle}
            </p>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {t.tasks.taskName}
              </label>
              <input
                type="text"
                value={firstTaskName}
                onChange={(e) => setFirstTaskName(e.target.value)}
                placeholder="e.g. Saudi GAT Math Practice"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />
              <div className="flex flex-wrap gap-2 text-xs">
                {['Saudi GAT Verbal', 'SAT Math Section', 'Physics Chapter 4', 'Deep Reading'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setFirstTaskName(sample)}
                    className="px-2.5 py-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    style={{
                      borderColor: 'var(--md-sys-color-outline-variant)',
                      color: 'var(--md-sys-color-on-surface-variant)',
                    }}
                  >
                    + {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
              }}
            >
              <MaterialIcon name="groups" size={26} />
            </div>

            <h2
              className="text-xl font-bold font-display mb-1"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.onboarding.step3Title}
            </h2>
            <p
              className="text-xs mb-6"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {t.onboarding.step3Subtitle}
            </p>

            <div
              className="p-4 rounded-2xl border text-center mb-6"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderColor: 'var(--md-sys-color-outline-variant)',
              }}
            >
              <div className="text-[11px] uppercase font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {locale === 'ar' ? 'رمز دائرة المذاكرة المبدئية' : 'Your Starter Circle Code'}
              </div>
              <div
                className="text-2xl font-timer font-bold tracking-widest tabular-nums mb-2"
                style={{ color: 'var(--md-sys-color-primary)' }}
              >
                FOCUS7
              </div>
              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {locale === 'ar'
                  ? 'شارك هذا الرمز مع أصدقائك للمنافسة على مكافآت نقاط التركيز اليومية.'
                  : 'Share this with your study peers to compete for weekly focus bonuses.'}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors"
              style={{
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              {locale === 'ar' ? 'السابق' : 'Back'}
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-transform active:scale-95 shadow-sm"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              {t.onboarding.continue}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-transform active:scale-95 shadow-sm"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              {t.onboarding.finish}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
