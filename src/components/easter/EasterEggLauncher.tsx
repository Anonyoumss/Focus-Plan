import React, { lazy, Suspense, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MaterialIcon } from '../common/MaterialIcon';
import { isEasterEggUnlocked } from '../../lib/easterEgg';
import { getTodayDateString } from '../../lib/streakCalculator';

const EasterEggGame = lazy(() => import('./EasterEggGame').then((m) => ({ default: m.EasterEggGame })));

/**
 * Settings easter egg: a discreet row that only appears once the unlock
 * condition is met (any badge, or 4 focus sessions in one local day).
 */
export const EasterEggLauncher: React.FC = () => {
  const store = useAppStore();
  const { locale } = store;
  const ar = locale === 'ar';
  const [open, setOpen] = useState(false);

  const unlocked = isEasterEggUnlocked(
    {
      todaySessionsCount: store.todaySessionsCount,
      todayCountDate: store.todayCountDate,
      dailyGoalSessions: store.dailyGoalSessions,
      streak: store.streak,
      completedFocusSessions: store.completedFocusSessions,
      testGoals: store.testGoals,
    },
    getTodayDateString(),
  );

  if (!unlocked) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer text-start"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        <MaterialIcon name="sports_esports" size={20} />
        <span>{ar ? 'المستوى السري' : 'Secret level'}</span>
      </button>
      {open && (
        <Suspense fallback={null}>
          <EasterEggGame onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
};
