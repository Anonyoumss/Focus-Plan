import React, { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MaterialIcon } from '../common/MaterialIcon';
import {
  pullExtensionData,
  type ExtensionSessionSummary,
} from '../../lib/extension/client';

function fmtMin(sec: number): string {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

function sessionDate(ts: number, locale: string): string {
  return new Date(ts).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const FocusInsightsCard: React.FC = () => {
  const { locale, extensionData, extensionConnected, setExtensionSnapshot } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const ar = locale === 'ar';

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const snap = await pullExtensionData();
    if (snap) setExtensionSnapshot(snap);
    setRefreshing(false);
  }, [setExtensionSnapshot]);

  useEffect(() => {
    if (extensionConnected && !extensionData) {
      const id = window.setTimeout(() => void refresh(), 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = extensionData;
  const weekOn = data ? data.daily.slice(-7).reduce((a, d) => a + d.onTaskSec, 0) : 0;
  const weekOff = data ? data.daily.slice(-7).reduce((a, d) => a + d.offTaskSec, 0) : 0;
  const weekOther = data ? data.daily.slice(-7).reduce((a, d) => a + d.otherSec, 0) : 0;
  const recent: ExtensionSessionSummary[] = (data?.sessions ?? []).slice(0, 5);

  return (
    <div
      className="p-6 rounded-3xl border mb-8"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderColor: 'var(--md-sys-color-outline-variant)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MaterialIcon name="trending_up" size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {ar ? 'رؤى التركيز' : 'Focus insights'}
          </h2>
        </div>
        {extensionConnected && (
          <button
            onClick={() => void refresh()}
            disabled={refreshing}
            className="p-2 rounded-xl border hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
            style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface-variant)' }}
            title={ar ? 'تحديث' : 'Refresh'}
          >
            <MaterialIcon name="refresh" size={18} />
          </button>
        )}
      </div>

      {!extensionConnected ? (
        <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {ar
            ? 'وصّل إضافة Focus Plan Companion من الإعدادات لعرض دقائق التركيز داخل المهام مقابل الانحراف أثناء الجلسات.'
            : 'Connect the Focus Plan Companion extension in Settings to see on-task vs off-task minutes per session.'}
        </p>
      ) : !data || data.sessions.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {ar
            ? 'لا توجد بيانات بعد. شغّل جلسة تركيز مع تفعيل الإضافة.'
            : 'No data yet. Run a focus session with the extension enabled.'}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span style={{ color: 'var(--md-sys-color-on-surface)' }}>
              <strong>{fmtMin(weekOn)}</strong>{' '}
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{ar ? 'داخل المهام' : 'on-task'}</span>
            </span>
            <span style={{ color: 'var(--md-sys-color-on-surface)' }}>
              <strong>{fmtMin(weekOff)}</strong>{' '}
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{ar ? 'خارج المهام' : 'off-task'}</span>
            </span>
            {weekOther > 0 && (
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {fmtMin(weekOther)} {ar ? 'أخرى' : 'other'}
              </span>
            )}
            <span className="text-xs self-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {ar ? 'آخر ٧ أيام' : 'last 7 days'}
            </span>
          </div>
          <ul className="space-y-2">
            {recent.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between text-sm rounded-xl px-3 py-2"
                style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
              >
                <span style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {sessionDate(s.startedAt, locale)}
                  <span className="text-xs ms-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {s.topDomains.slice(0, 2).join(', ') || '—'}
                  </span>
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {fmtMin(s.onTaskSec)} / {fmtMin(s.offTaskSec + s.otherSec)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {ar
              ? 'on-task = مواقع قائمة الدراسة · off-task = قائمة المشتتات · أخرى = غير مصنّفة. بيانات دومين فقط، محفوظة محلياً.'
              : 'on-task = your study allowlist · off-task = your blocklist · other = unclassified. Domain names only, stored locally.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FocusInsightsCard;
