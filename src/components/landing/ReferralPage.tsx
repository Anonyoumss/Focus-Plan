import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { resolveReferralCode, redeemReferralCode, REFERRAL_BONUS_COINS } from '../../lib/firebase/referrals';
import { navigateToAppTab } from '../../lib/router';

interface Props { code: string }

/**
 * #/referral/<code> landing: previews the inviter (public alias only) and
 * lets a signed-in user redeem immediately. Guests get a sign-in CTA; the
 * code survives in the hash across auth.
 */
export const ReferralPage: React.FC<Props> = ({ code }) => {
  const { locale, user, cloudSyncEnabled, signIn, coins } = useAppStore();
  const t = TRANSLATIONS[locale];
  const fr = t.friends;
  const ar = locale === 'ar';
  const [info, setInfo] = useState<{ alias: string; reward: number } | null | undefined>(undefined);
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void resolveReferralCode(code)
      .then((r) => { if (!cancelled) setInfo(r); })
      .catch(() => { if (!cancelled) setInfo(null); });
    return () => { cancelled = true; };
  }, [code]);

  const redeem = async () => {
    if (!user) return;
    setState('busy'); setError('');
    const res = await redeemReferralCode(user.uid, code).catch(() => null);
    if (!res) { setState('error'); setError(fr.errorGeneric); return; }
    if (res.ok) setState('done');
    else {
      setState('error');
      setError(
        res.reason === 'self' ? fr.referralSelf
        : res.reason === 'already' ? fr.referralAlready
        : res.reason === 'full' ? fr.referralFull
        : fr.referralInvalid,
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
      <div className="w-full max-w-md p-8 rounded-3xl border text-center"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}>
        <MaterialIcon name="card_giftcard" size={40} />
        <h1 className="text-xl font-bold mt-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
          {fr.referralTitle}
        </h1>

        {info === undefined && <p className="text-sm mt-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>…</p>}
        {info === null && (
          <p className="text-sm mt-4" style={{ color: 'var(--md-sys-color-error)' }}>{fr.referralInvalid}</p>
        )}
        {info && (
          <p className="text-sm mt-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {ar
              ? `${info.alias} يدعوك للانضمام — مكافأتك ${info.reward} عملة تركيز.`
              : `${info.alias} invited you — you get ${info.reward} Focus Coins.`}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {state === 'done' ? (
            <>
              <p className="text-sm font-semibold" style={{ color: 'var(--md-sys-color-primary)' }}>
                {fr.referralRedeemed}
              </p>
              <button
                onClick={() => navigateToAppTab('focus')}
                className="w-full px-4 py-3 rounded-full font-semibold cursor-pointer"
                style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
              >
                {ar ? 'ابدأ التركيز' : 'Start focusing'}
              </button>
            </>
          ) : user ? (
            <button
              onClick={() => void redeem()}
              disabled={state === 'busy' || !cloudSyncEnabled}
              className="w-full px-4 py-3 rounded-full font-semibold cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
            >
              {state === 'busy' ? '…' : `${fr.referralRedeem} (+${REFERRAL_BONUS_COINS})`}
            </button>
          ) : (
            <button
              onClick={() => void signIn()}
              disabled={!cloudSyncEnabled}
              className="w-full px-4 py-3 rounded-full font-semibold cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
            >
              {fr.signInCta}
            </button>
          )}
          {error && <p className="text-xs" style={{ color: 'var(--md-sys-color-error)' }}>{error}</p>}
          {!cloudSyncEnabled && (
            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {ar ? 'هذا الإصدار يعمل بدون خلفية سحابية.' : 'This build has no cloud backend configured.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
