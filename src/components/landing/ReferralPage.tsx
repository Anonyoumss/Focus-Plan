import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { navigateToAppTab } from '../../lib/router';
import {
  type ReferralCodeDoc,
  resolveReferralCode,
  redeemReferralCode,
} from '../../lib/firebase/referrals';

interface ReferralPageProps {
  code: string;
}

type ReferralPageState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'ready'; doc: ReferralCodeDoc }
  | { kind: 'claimed'; rewardCoins: number }
  | { kind: 'error'; message: string };

export const ReferralPage: React.FC<ReferralPageProps> = ({ code }) => {
  const { locale, user, authStatus, signIn, coins } = useAppStore();
  const t = TRANSLATIONS[locale];
  const ar = locale === 'ar';

  const [state, setState] = useState<ReferralPageState>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);

  // Look up real Firestore referral doc
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const docData = await resolveReferralCode(code);
        if (cancelled) return;
        if (!docData) {
          setState({ kind: 'invalid' });
          return;
        }
        setState({ kind: 'ready', doc: docData });
      } catch (e) {
        console.warn('Failed to resolve referral code:', e);
        if (!cancelled) {
          setState({ kind: 'error', message: t.referrals.redeemErrorInvalid });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, t.referrals.redeemErrorInvalid]);

  const handleClaim = async () => {
    if (!user) return;
    setBusy(true);

    try {
      const res = await redeemReferralCode(user.uid, code);
      if (res.ok) {
        const reward = res.rewardCoins || 15;
        useAppStore.setState({ coins: coins + reward });
        setState({ kind: 'claimed', rewardCoins: reward });
      } else {
        let msg = t.referrals.redeemErrorInvalid;
        if (res.error === 'self_referral') msg = t.referrals.redeemErrorSelf;
        if (res.error === 'already_redeemed') msg = t.referrals.redeemErrorAlready;
        setState({ kind: 'error', message: msg });
      }
    } catch {
      setState({ kind: 'error', message: t.referrals.redeemErrorInvalid });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        backgroundColor: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-on-surface)',
      }}
    >
      <div
        className="w-full max-w-md p-8 rounded-3xl border text-center shadow-lg"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        {/* Referral Badge Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
          }}
        >
          <MaterialIcon
            name={state.kind === 'claimed' ? 'celebration' : state.kind === 'invalid' ? 'link_off' : 'card_giftcard'}
            size={28}
          />
        </div>

        <h1 className="text-xl font-bold font-display mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
          {state.kind === 'claimed'
            ? (ar ? 'تمت إضافة المكافأة بنجاح!' : 'Reward Claimed!')
            : state.kind === 'invalid'
            ? (ar ? 'رمز الإحالة غير صالح' : 'Invalid Referral Code')
            : t.referrals.landingTitle}
        </h1>

        <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {state.kind === 'claimed'
            ? (ar ? 'تمت إضافة 15 عملة تركيز إلى محفظتك الدراسية.' : '15 Focus Coins have been credited to your wallet.')
            : state.kind === 'invalid'
            ? (ar ? 'لم نتمكن من العثور على هذا الرمز في السجل الحقيقي لفايربيس.' : 'This referral code was not found in Firestore records.')
            : t.referrals.landingSubtitle}
        </p>

        {state.kind === 'loading' && (
          <div className="space-y-3 mb-6" aria-hidden="true">
            <div className="h-4 w-3/4 mx-auto rounded animate-pulse" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }} />
            <div className="h-4 w-1/2 mx-auto rounded animate-pulse" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }} />
          </div>
        )}

        {state.kind === 'ready' && (
          <div className="space-y-5">
            {/* Referrer Details Card */}
            <div
              className="p-4 rounded-2xl border text-start space-y-2"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                borderColor: 'var(--md-sys-color-outline-variant)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {t.referrals.invitedBy}
                </span>
                <span className="text-xs font-mono font-bold tracking-wider" style={{ color: 'var(--md-sys-color-primary)' }}>
                  {state.doc.code}
                </span>
              </div>
              <p className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {state.doc.alias}
              </p>
              <div
                className="flex items-center gap-1.5 pt-2 border-t text-xs font-semibold"
                style={{
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-tertiary)',
                }}
              >
                <MaterialIcon name="toll" size={16} />
                <span>+15 {ar ? 'عملة تركيز لك ولصديقك' : 'Focus Coins for both of you'}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2.5">
              {user ? (
                <button
                  type="button"
                  onClick={() => void handleClaim()}
                  disabled={busy}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                  }}
                >
                  {busy ? (ar ? 'جارٍ التحقق...' : 'Claiming...') : t.referrals.redeemAction}
                </button>
              ) : authStatus === 'loading' ? null : (
                <button
                  type="button"
                  onClick={() => void signIn()}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                  }}
                >
                  {t.referrals.claimReward}
                </button>
              )}

              <button
                type="button"
                onClick={() => navigateToAppTab('focus')}
                className="px-6 py-2 rounded-xl text-xs font-semibold cursor-pointer border"
                style={{
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {ar ? 'المتابعة كضيف' : 'Continue as guest'}
              </button>
            </div>
          </div>
        )}

        {state.kind === 'claimed' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => navigateToAppTab('store')}
              className="w-full px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              {ar ? 'زيارة متجر العملات' : 'Visit Coins Store'}
            </button>
            <button
              type="button"
              onClick={() => navigateToAppTab('focus')}
              className="w-full px-6 py-2 rounded-xl text-xs font-semibold cursor-pointer border"
              style={{
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              {ar ? 'بدء جلسة التركيز' : 'Start Focus Timer'}
            </button>
          </div>
        )}

        {(state.kind === 'invalid' || state.kind === 'error') && (
          <div className="space-y-3">
            {state.kind === 'error' && (
              <p className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-error)' }}>
                {state.message}
              </p>
            )}
            <button
              type="button"
              onClick={() => navigateToAppTab('focus')}
              className="w-full px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              {ar ? 'الذهاب إلى التطبيق' : 'Go to App'}
            </button>
          </div>
        )}

        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono mt-6"
          style={{
            borderColor: 'var(--md-sys-color-outline-variant)',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          <MaterialIcon name="tag" size={14} />
          <span>{code}</span>
        </div>
      </div>
    </div>
  );
};
