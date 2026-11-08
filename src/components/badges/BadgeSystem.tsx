import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MaterialIcon } from '../common/MaterialIcon';

export interface BadgeDefinition {
  id: string;
  icon: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  requirementEn: string;
  requirementAr: string;
  checkUnlocked: (state: any) => boolean;
  progressPercent: (state: any) => number;
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'arcade_master',
    icon: 'sports_esports',
    titleEn: '3D Arcade Champion',
    titleAr: 'بطل أركيد 3D',
    descEn: 'Unlocked the 3D Focus Arcade by completing 4 focus sessions today or tapping the secret easter egg!',
    descAr: 'فتحت لعبة الأركيد ثلاثية الأبعاد بإكمال 4 جلسات تركيز اليوم أو عبر الزر السري!',
    requirementEn: 'Complete 4 focus sessions in 1 day',
    requirementAr: 'إكمال 4 جلسات تركيز في يوم واحد',
    checkUnlocked: (s) => s.todaySessionsCount >= 4 || s.completedFocusSessions >= 4,
    progressPercent: (s) => Math.min(100, Math.round((Math.min(4, s.todaySessionsCount) / 4) * 100)),
  },
  {
    id: 'streak_master',
    icon: 'local_fire_department',
    titleEn: 'Streak Master',
    titleAr: 'سيد السلسلة',
    descEn: 'Maintained an unbroken study streak for 3 or more days!',
    descAr: 'حافظت على سلسلة مذاكرة دون انقطاع لمدة 3 أيام أو أكثر!',
    requirementEn: 'Reach a 3-day focus streak',
    requirementAr: 'الوصول إلى سلسلة 3 أيام',
    checkUnlocked: (s) => s.streak.currentStreak >= 3,
    progressPercent: (s) => Math.min(100, Math.round((Math.min(3, s.streak.currentStreak) / 3) * 100)),
  },
  {
    id: 'test_strategist',
    icon: 'psychology',
    titleEn: 'Exam Strategist',
    titleAr: 'استراتيجي الاختبارات',
    descEn: 'Configured a target standardized exam goal (GAT, SAAT, SAT, IELTS) with section targets.',
    descAr: 'حددت هدف اختبار معياري (القدرات، التحصيلي، SAT) مع درجات الأقسام.',
    requirementEn: 'Create 1 target test goal',
    requirementAr: 'إنشاء هدف اختبار معياري واحد',
    checkUnlocked: (s) => s.testGoals.length > 0,
    progressPercent: (s) => (s.testGoals.length > 0 ? 100 : 0),
  },
  {
    id: 'coin_collector',
    icon: 'monetization_on',
    titleEn: 'Coin Collector',
    titleAr: 'جامع العملات',
    descEn: 'Accumulated 20 or more Focus Coins through session completion & daily streaks.',
    descAr: 'جمعت 20 عملة تركيز أو أكثر من خلال إكمال الجلسات والسلاسل.',
    requirementEn: 'Earn 20 Focus Coins',
    requirementAr: 'كسب 20 عملة تركيز',
    checkUnlocked: (s) => s.coins >= 20,
    progressPercent: (s) => Math.min(100, Math.round((Math.min(20, s.coins) / 20) * 100)),
  },
  {
    id: 'centurion_focus',
    icon: 'timer',
    titleEn: 'Centurion Focus',
    titleAr: 'مئة دقيقة تركيز',
    descEn: 'Logged over 100 total minutes of deep focus study sessions.',
    descAr: 'أنجزت أكثر من 100 دقيقة إجمالية من جلسات التركيز العميق.',
    requirementEn: 'Reach 100 total focus minutes',
    requirementAr: 'الوصول إلى 100 دقيقة تركيز',
    checkUnlocked: (s) => {
      const totalMins = s.sessionLogs.reduce((acc: number, log: any) => acc + (log.durationMinutes || 25), 0);
      return totalMins >= 100;
    },
    progressPercent: (s) => {
      const totalMins = s.sessionLogs.reduce((acc: number, log: any) => acc + (log.durationMinutes || 25), 0);
      return Math.min(100, Math.round((Math.min(100, totalMins) / 100) * 100));
    },
  },
  {
    id: 'ai_pioneer',
    icon: 'auto_awesome',
    titleEn: 'AI Pioneer',
    titleAr: 'رائد الذكاء الاصطناعي',
    descEn: 'Utilized Gemini AI to generate an optimized weekly study plan or consult your coach.',
    descAr: 'استخدمت الذكاء الاصطناعي لتوليد خطة أسبوعية أو استشارة المدرب.',
    requirementEn: 'Generate an AI study plan',
    requirementAr: 'توليد خطة بالذكاء الاصطناعي',
    checkUnlocked: () => true, // Default unlocked for exploration or store state
    progressPercent: () => 100,
  },
  {
    id: 'squad_scholar',
    icon: 'groups',
    titleEn: 'Squad Scholar',
    titleAr: 'عضو المجموعات',
    descEn: 'Joined or created a collaborative study group with friends.',
    descAr: 'انضممت أو أنشأت مجموعة مذاكرة مع أصدقائك.',
    requirementEn: 'Join a study group',
    requirementAr: 'الانضمام لمجموعة مذاكرة',
    checkUnlocked: (s) => !!s.activeGroupId,
    progressPercent: (s) => (s.activeGroupId ? 100 : 0),
  },
];

interface BadgeSystemProps {
  onClose?: () => void;
}

export const BadgeSystem: React.FC<BadgeSystemProps> = ({ onClose }) => {
  const store = useAppStore();
  const ar = store.locale === 'ar';

  const unlockedCount = BADGE_CATALOG.filter((b) => b.checkUnlocked(store)).length;

  return (
    <div
      className="p-6 rounded-3xl border space-y-6 max-w-4xl mx-auto"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderColor: 'var(--md-sys-color-outline-variant)',
      }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: 'var(--md-sys-color-tertiary-container)',
              color: 'var(--md-sys-color-on-tertiary-container)',
            }}
          >
            <MaterialIcon name="military_tech" size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {ar ? 'أوسمة وإنجازات الدراسة' : 'Study Badges & Achievements'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {ar ? `فتحت ${unlockedCount} من أصل ${BADGE_CATALOG.length} أوسمة!` : `Unlocked ${unlockedCount} of ${BADGE_CATALOG.length} badges!`}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer opacity-80 hover:opacity-100"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              borderColor: 'var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BADGE_CATALOG.map((badge) => {
          const isUnlocked = badge.checkUnlocked(store);
          const percent = badge.progressPercent(store);

          return (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                isUnlocked ? 'shadow-md scale-[1.01]' : 'opacity-70 grayscale'
              }`}
              style={{
                backgroundColor: isUnlocked
                  ? 'var(--md-sys-color-surface-container)'
                  : 'var(--md-sys-color-surface-container-lowest)',
                borderColor: isUnlocked
                  ? 'var(--md-sys-color-primary)'
                  : 'var(--md-sys-color-outline-variant)',
              }}
            >
              {/* Top Row: Icon + Badge Status */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                    style={{
                      backgroundColor: isUnlocked
                        ? 'var(--md-sys-color-primary-container)'
                        : 'var(--md-sys-color-surface-container-highest)',
                      color: isUnlocked
                        ? 'var(--md-sys-color-on-primary-container)'
                        : 'var(--md-sys-color-on-surface-variant)',
                    }}
                  >
                    <MaterialIcon name={badge.icon} size={22} />
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      isUnlocked ? 'animate-pulse' : ''
                    }`}
                    style={{
                      backgroundColor: isUnlocked
                        ? 'var(--md-sys-color-tertiary-container)'
                        : 'var(--md-sys-color-surface-container-high)',
                      color: isUnlocked
                        ? 'var(--md-sys-color-on-tertiary-container)'
                        : 'var(--md-sys-color-on-surface-variant)',
                      borderColor: 'var(--md-sys-color-outline-variant)',
                    }}
                  >
                    {isUnlocked ? (ar ? 'مفتوح 🔓' : 'Unlocked 🔓') : (ar ? 'مغلق 🔒' : 'Locked 🔒')}
                  </span>
                </div>

                <h3 className="text-sm font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {ar ? badge.titleAr : badge.titleEn}
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {ar ? badge.descAr : badge.descEn}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                <div className="flex items-center justify-between text-[10px] font-medium mb-1">
                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {ar ? badge.requirementAr : badge.requirementEn}
                  </span>
                  <span className="font-mono font-bold" style={{ color: 'var(--md-sys-color-primary)' }}>
                    {percent}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: 'var(--md-sys-color-primary)',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
