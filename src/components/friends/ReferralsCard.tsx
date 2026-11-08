import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import {
  getOrCreateReferralCode,
  getReferralStats,
  redeemReferralCode,
  REFERRAL_BONUS_COINS,
} from '../../lib/firebase/referrals';

/**
 * Referral card shown inside Friends for signed-in users. Guests see a
 * sign-in prompt. The reward goes to the NEW member (15 Focus Coins via the
 * rule-enforced wallet ledger); the inviter gets a counter only.
 */
export const ReferralsCard: React.FC = () => {
  const { locale, user, cloudSyncEnabled, signIn } = useAppStore();
  const t = TRANSLATIONS[locale];
  const fr = t.friends;
  const ar = locale === 'ar';
  const uid = user?.uid ?? null;
  const ready = !!uid && cloudSyncEnabled;

  const [code, setCode] = useState('');
  const [stats, setStats] = useState<{ uses: number; maxUses: number } | null>(null);
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ready || !uid) return;
    let cancelled = false;
    void (async () => {
      const alias = user?.displayName || user?.email?.split('@')[0] || 'Friend';
      const c = await getOrCreateReferralCode(uid, alias);
      if (cancelled) return;
      setCode(c);
      setStats(await getReferralStats(uid));
    })().catch(() => undefined);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, uid]);

  const link = `${window.location.origin}${window.location.pathname}#/referral/${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const redeem = async () => {
    if (!uid || !input.trim()) return;
    setBusy(true); setNotice('');
    const res = await redeemReferralCode(uid, input).catch(() => null);
    setBusy(false);
    if (!res) { setNotice(fr.errorGeneric); return; }
    if (res.ok) {
      setNotice(fr.referralRedeemed);
      setInput('');
      setStats(await getReferralStats(uid).catch(() => null));
    } else {
      setNotice(
        res.reason === 'self' ? fr.referralSelf
        : res.reason === 'already' ? fr.referralAlready
        : res.reason === 'full' ? fr.referralFull
        : fr.referralInvalid,
      );
    }
  };

  const card = 'p-6 rounded-3xl border';
  const cardStyle = {
    backgroundColor: 'var(--md-sys-color-surface-container-low)',
    borderColor: 'var(--md-sys-color-outline-variant)',
  } as const;
  const label = { color: 'var(--md-sys-color-on-surface)' } as const;
  const sub = { color: 'var(--md-sys-color-on-surface-variant)' } as const;

  return (
    <div className={card} style={cardStyle}>
      <div className="flex items-center gap-2 mb-1">
        <MaterialIcon name="card_giftcard" size={20} />
        <h2 className="text-base font-bold" style={label}>{fr.referralTitle}</h2>
      </div>
      <p className="text-xs mb-4" style={sub}>{fr.referralSubtitle}</p>

      {!ready ? (
        <div className="flex items-center gap-3">
          <p className="text-sm flex-1" style={sub}>{fr.referralSignIn}</p>
          {cloudSyncEnabled && (
            <button
              onClick={() => void signIn()}
              className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer"
              style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
            >
              {fr.signInCta}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <code className="px-3 py-1.5 rounded-lg text-sm font-mono tracking-widest"
              style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', color: 'var(--md-sys-color-on-surface)' }}>
              {code || '…'}
            </code>
            {stats && (
              <span className="text-xs" style={sub}>
                {stats.uses}/{stats.maxUses} {fr.referralStats}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl text-xs border bg-transparent outline-none"
              style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
              aria-label={fr.referralLink}
            />
            <button
              onClick={() => void copy()}
              className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer shrink-0"
              style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}
            >
              {copied ? fr.referralCopied : fr.referralCopy}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder={fr.referralRedeemPlaceholder}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm border bg-transparent outline-none font-mono"
              style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
              maxLength={12}
            />
            <button
              onClick={() => void redeem()}
              disabled={busy || !input.trim()}
              className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer disabled:opacity-50 shrink-0"
              style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
            >
              {fr.referralRedeem}
            </button>
          </div>
          {notice && <p className="text-xs mt-2" style={sub}>{notice}</p>}
          <p className="text-xs mt-3" style={sub}>
            {ar ? `المكافأة: ${REFERRAL_BONUS_COINS} عملة تركيز للعضو الجديد.` : `Reward: ${REFERRAL_BONUS_COINS} Focus Coins for the new member.`}
          </p>
        </>
      )}
    </div>
  );
};
