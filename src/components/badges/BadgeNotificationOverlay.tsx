import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BADGE_CATALOG, type BadgeDefinition } from './BadgeSystem';
import { MaterialIcon } from '../common/MaterialIcon';

export const BadgeNotificationOverlay: React.FC = () => {
  const store = useAppStore();
  const ar = store.locale === 'ar';

  const [activeToast, setActiveToast] = useState<BadgeDefinition | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    // Check which badges are currently unlocked
    BADGE_CATALOG.forEach((badge) => {
      const unlocked = badge.checkUnlocked(store);
      if (unlocked && !unlockedIds.has(badge.id)) {
        // Newly unlocked badge detected!
        setUnlockedIds((prev) => new Set([...prev, badge.id]));
        setActiveToast(badge);

        // Sound chime for badge achievement
        try {
          store.previewAlarmSound('chime');
        } catch {
          // fallback
        }

        setTimeout(() => setActiveToast(null), 5500);
      }
    });
  }, [store.todaySessionsCount, store.streak.currentStreak, store.coins, store.testGoals.length, store.activeGroupId]);

  if (!activeToast) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-bounce">
      <div
        className="p-4 rounded-2xl border shadow-2xl flex items-center gap-3.5 relative overflow-hidden"
        style={{
          backgroundColor: 'var(--md-sys-color-primary-container)',
          borderColor: 'var(--md-sys-color-primary)',
          color: 'var(--md-sys-color-on-primary-container)',
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
          style={{
            backgroundColor: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary)',
          }}
        >
          <MaterialIcon name={activeToast.icon} size={28} />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 block">
            {ar ? '🏆 وسام جديد فتحته!' : '🏆 NEW BADGE UNLOCKED!'}
          </span>
          <h4 className="text-sm font-bold truncate">
            {ar ? activeToast.titleAr : activeToast.titleEn}
          </h4>
          <p className="text-xs truncate opacity-85">
            {ar ? activeToast.descAr : activeToast.descEn}
          </p>
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="text-xs opacity-70 hover:opacity-100 p-1 cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
