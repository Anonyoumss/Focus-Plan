import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';

export const FriendsView: React.FC = () => {
  const { locale, focusPoints } = useAppStore();
  const t = TRANSLATIONS[locale];

  const [groupCode, setGroupCode] = useState('FOCUS7');
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [publicLeaderboardOptIn, setPublicLeaderboardOptIn] = useState(false);

  // Group members leaderboard
  const members = [
    { rank: 1, name: 'Tariq (You)', minutes: 420, streak: 4, isCurrentUser: true },
    { rank: 2, name: 'Fahad S.', minutes: 380, streak: 6, isCurrentUser: false },
    { rank: 3, name: 'Sarah A.', minutes: 310, streak: 3, isCurrentUser: false },
    { rank: 4, name: 'Omar K.', minutes: 225, streak: 2, isCurrentUser: false },
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold font-display"
          style={{ color: 'var(--md-sys-color-on-surface)' }}
        >
          {t.friends.title}
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {locale === 'ar'
            ? 'حلقات المذاكرة التشاركية، مهام المجموعات المشتركة، ولوحات صدارة النقاط.'
            : 'Collaborative study circles, shared group goals, and focus point rewards.'}
        </p>
      </div>

      {/* Circle Info & Join Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Your Circle Card */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--md-sys-color-outline)' }}
              >
                {locale === 'ar' ? 'حلقة المذاكرة النشطة' : 'Active Circle'}
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                }}
              >
                4 {locale === 'ar' ? 'أعضاء' : 'Members'}
              </span>
            </div>

            <h3
              className="text-base font-bold mb-1"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              GAT & SAT Champions 2026
            </h3>
            <p
              className="text-xs mb-4"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {locale === 'ar'
                ? 'مجموعة مخصصة للتحضير المكثف للاختبارات القادمة ومشاركة التقدم.'
                : 'Dedicated circle for intensive admissions prep and mutual focus streaks.'}
            </p>
          </div>

          <div
            className="flex items-center justify-between p-3 rounded-xl border"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <div>
              <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--md-sys-color-outline)' }}>
                {t.friends.shareLink}
              </div>
              <div className="text-sm font-timer font-bold tracking-widest tabular-nums">
                {groupCode}
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              <MaterialIcon name={copied ? 'done' : 'content_copy'} size={16} />
              <span>{copied ? t.friends.copied : t.friends.copyCode}</span>
            </button>
          </div>
        </div>

        {/* Join Circle Card */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--md-sys-color-outline)' }}
            >
              {t.friends.joinByCode}
            </div>

            <h3
              className="text-base font-bold mb-1"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {locale === 'ar' ? 'الانضمام لحلقة دراسية' : 'Enter an Invite Code'}
            </h3>
            <p
              className="text-xs mb-4"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {locale === 'ar'
                ? 'أدخل الرمز المكون من 6 أحرف للانضمام إلى مجموعة أصدقائك.'
                : 'Enter a 6-character circle code shared by your classmates.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              maxLength={8}
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. FOCUS9"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm uppercase tracking-wider font-timer outline-none"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            />
            <button
              onClick={() => {
                if (joinCodeInput.trim()) {
                  alert(locale === 'ar' ? 'تم الانضمام بنجاح!' : 'Joined circle successfully!');
                  setJoinCodeInput('');
                }
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition-transform active:scale-95"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              {locale === 'ar' ? 'انضمام' : 'Join'}
            </button>
          </div>
        </div>
      </div>

      {/* Circle Leaderboard Standings */}
      <div
        className="rounded-3xl p-6 border mb-8"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2
              className="text-base font-bold"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.friends.weeklyLeaderboard}
            </h2>
            <div
              className="flex items-center gap-3 text-xs mt-0.5"
              style={{ color: 'var(--md-sys-color-outline)' }}
            >
              <span>{t.friends.dailyWinnerNotice}</span>
              <span aria-hidden="true">·</span>
              <span>{t.friends.weeklyWinnerNotice}</span>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            <MaterialIcon name="stars" size={16} className="text-amber-500" />
            <span>{focusPoints} {t.store.focusPoints}</span>
          </div>
        </div>

        {/* Member Table Rows */}
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.rank}
              className="flex items-center justify-between p-3.5 rounded-xl border"
              style={{
                backgroundColor: m.isCurrentUser
                  ? 'var(--md-sys-color-primary-container)'
                  : 'var(--md-sys-color-surface-container-low)',
                borderColor: m.isCurrentUser
                  ? 'var(--md-sys-color-primary)'
                  : 'var(--md-sys-color-outline-variant)',
                color: m.isCurrentUser
                  ? 'var(--md-sys-color-on-primary-container)'
                  : 'var(--md-sys-color-on-surface)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="font-timer font-bold text-sm w-6 text-center tabular-nums">
                  #{m.rank}
                </span>
                <div>
                  <div className="text-sm font-bold">{m.name}</div>
                  <div
                    className="text-xs"
                    style={{
                      color: m.isCurrentUser
                        ? 'var(--md-sys-color-on-primary-container)'
                        : 'var(--md-sys-color-on-surface-variant)',
                      opacity: 0.8,
                    }}
                  >
                    {m.streak} {t.streaks.dayStreak}
                  </div>
                </div>
              </div>

              <div className="text-sm font-timer font-bold tabular-nums">
                {m.minutes} {locale === 'ar' ? 'دقيقة' : 'mins'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Opt-in Public Leaderboard Toggle Card */}
      <div
        className="p-5 rounded-2xl border flex items-center justify-between"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div>
          <h3
            className="text-sm font-bold"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {t.friends.publicLeaderboard}
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {t.friends.publicOptIn}
          </p>
        </div>

        <input
          type="checkbox"
          checked={publicLeaderboardOptIn}
          onChange={(e) => setPublicLeaderboardOptIn(e.target.checked)}
          className="w-5 h-5 accent-emerald-600 rounded cursor-pointer shrink-0"
        />
      </div>
    </div>
  );
};
