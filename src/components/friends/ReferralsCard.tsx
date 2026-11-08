import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import {
  type ReferralCodeDoc,
  type ReferralStats,
  getOrCreateReferralCode,
  getReferralStats,
  redeemReferralCode,
} from '../../lib/firebase/referrals';

interface ReferralsCardProps {
  alias?: string;
}

export const ReferralsCard: React.FC<ReferralsCardProps> = ({ alias }) => {
  const {
    locale,
    user,
    cloudSyncEnabled,
    firebaseEnabled,
    signIn,
    coins,
  } = useAppStore();

  const t = TRANSLATIONS[locale];
  const ar = locale === 'ar';
  const uid = user?.uid ?? null;

  const [myCodeDoc, setMyCodeDoc] = useState<ReferralCodeDoc | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [codeToRedeem, setCodeToRedeem] = useState('');
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loading = !!uid && cloudSyncEnabled && myCodeDoc === null;

  // Load real Firestore referral data for signed-in user
  useEffect(() => {
    let active = true;
    if (!uid || !cloudSyncEnabled) {
      return () => {
        active = false;
      };
    }

    const userAlias = alias?.trim() || user?.displayName?.trim() || 'Focus Student';
    Promise.all([
      getOrCreateReferralCode(uid, userAlias),
      getReferralStats(uid),
    ])
      .then(([codeDoc, userStats]) => {
        if (!active) return;
        setMyCodeDoc(codeDoc);
        setStats(userStats);
      })
      .catch((e) => {
        console.warn('Failed to load referral details:', e);
      });

    return () => {
      active = false;
    };
  }, [uid, cloudSyncEnabled, alias, user?.displayName]);

  const handleCopy = async () => {
    if (!myCodeDoc) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#/referral/${encodeURIComponent(myCodeDoc.code)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !codeToRedeem.trim()) return;

    setFeedback(null);
    setRedeemBusy(true);

    try {
      const res = await redeemReferralCode(uid, codeToRedeem);
      if (res.ok) {
        setFeedback({ type: 'success', message: t.referrals.redeemSuccess });
        setCodeToRedeem('');
        // Refresh local store coins and referral stats
        useAppStore.setState({ coins: coins + (res.rewardCoins || 15) });
        const updatedStats = await getReferralStats(uid);
        setStats(updatedStats);
      } else {
        let msg = t.referrals.redeemErrorInvalid;
        if (res.error === 'self_referral') msg = t.referrals.redeemErrorSelf;
        if (res.error === 'already_redeemed') msg = t.referrals.redeemErrorAlready;
        setFeedback({ type: 'error', message: msg });
      }
    } catch (err) {
      console.error('Redeem failed:', err);
      setFeedback({ type: 'error', message: t.referrals.redeemErrorInvalid });
    } finally {
      setRedeemBusy(false);
    }
  };

  const cardStyle = {
    backgroundColor: 'var(--md-sys-color-surface-container-low)',
    borderColor: 'var(--md-sys-color-outline-variant)',
  };
  const inputStyle = {
    backgroundColor: 'var(--md-sys-color-surface-container)',
    borderColor: 'var(--md-sys-color-outline-variant)',
    color: 'var(--md-sys-color-on-surface)',
  };
  const primaryBtnStyle = {
    backgroundColor: 'var(--md-sys-color-primary)',
    color: 'var(--md-sys-color-on-primary)',
  };

  return (
    <div className="rounded-2xl border p-5 space-y-6" style={cardStyle}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold font-display" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {t.referrals.title}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {t.referrals.subtitle}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto border"
          style={{
            backgroundColor: 'var(--md-sys-color-tertiary-container)',
            color: 'var(--md-sys-color-on-tertiary-container)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <MaterialIcon name="toll" size={16} />
          <span>+15 {ar ? 'عملة لكل منكما' : 'Coins each'}</span>
        </div>
      </div>

      {!uid ? (
        // Guest mode fallback
        <div
          className="p-4 rounded-xl border space-y-3"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-start gap-3">
            <MaterialIcon name="group_add" size={24} style={{ color: 'var(--md-sys-color-primary)' }} />
            <div className="space-y-1">
              <p className="text-xs font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {t.referrals.guestPrompt}
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {ar
                  ? 'برنامج الإحالات يمنحك أنت وزميلك 15 عملة تركيز حقيقية فور الانضمام. سجل الدخول لحفظ رابطك الدائم والمشاركة.'
                  : 'The referral program awards both you and your friend 15 Focus Coins upon redemption. Sign in to generate your unique link.'}
              </p>
            </div>
          </div>
          {firebaseEnabled && (
            <button
              type="button"
              onClick={() => void signIn()}
              className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors"
              style={primaryBtnStyle}
            >
              {ar ? 'تسجيل الدخول لتفعيل الإحالات' : 'Sign in to access referrals'}
            </button>
          )}
        </div>
      ) : loading ? (
        // Skeleton loader
        <div className="space-y-3 animate-pulse" aria-hidden="true">
          <div className="h-10 rounded-xl" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }} />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 rounded-xl" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }} />
            <div className="h-16 rounded-xl" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }} />
          </div>
        </div>
      ) : (
        <>
          {/* My Code + Link Copy */}
          {myCodeDoc && (
            <div className="space-y-3">
              <label className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {t.referrals.yourCode}
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div
                  className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-wider"
                  style={inputStyle}
                >
                  <span className="font-bold select-all">{myCodeDoc.code}</span>
                  <span className="text-[11px] font-sans opacity-75">
                    {window.location.origin}#/referral/{myCodeDoc.code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  style={primaryBtnStyle}
                >
                  <MaterialIcon name={copied ? 'check' : 'content_copy'} size={16} />
                  <span>{copied ? (ar ? 'تم النسخ!' : 'Copied!') : t.referrals.copyLink}</span>
                </button>
              </div>
            </div>
          )}

          {/* Referral Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-3.5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MaterialIcon name="how_to_reg" size={18} style={{ color: 'var(--md-sys-color-primary)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {t.referrals.successfulReferrals}
                  </span>
                </div>
                <p className="text-xl font-bold font-mono" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {stats.totalReferred}
                </p>
              </div>

              <div
                className="p-3.5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MaterialIcon name="toll" size={18} style={{ color: 'var(--md-sys-color-tertiary)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {t.referrals.coinsEarned}
                  </span>
                </div>
                <p className="text-xl font-bold font-mono" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {stats.coinsEarned}
                </p>
              </div>
            </div>
          )}

          {/* Redeem a Friend's Code */}
          <div
            className="pt-4 border-t space-y-3"
            style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
          >
            <label className="text-xs font-semibold block" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {t.referrals.redeemTitle}
            </label>
            <form onSubmit={handleRedeem} className="flex items-center gap-2">
              <input
                type="text"
                value={codeToRedeem}
                onChange={(e) => setCodeToRedeem(e.target.value.toUpperCase().trim())}
                placeholder={t.referrals.redeemPlaceholder}
                maxLength={16}
                disabled={redeemBusy}
                className="flex-1 px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-wider uppercase outline-none"
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={redeemBusy || !codeToRedeem.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border disabled:opacity-50 transition-colors"
                style={primaryBtnStyle}
              >
                {redeemBusy ? (ar ? 'جارٍ التحقق...' : 'Checking...') : t.referrals.redeemAction}
              </button>
            </form>

            {feedback && (
              <div
                className={`text-xs font-semibold px-3 py-2 rounded-xl border ${
                  feedback.type === 'success'
                    ? 'border-emerald-600/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
                    : 'border-red-600/30 text-red-700 dark:text-red-300 bg-red-500/10'
                }`}
                role="status"
              >
                {feedback.message}
              </div>
            )}

            <p className="text-[11px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {t.referrals.termsNotice}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
