import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { navigateToAppTab } from '../../lib/router';
import { getFirebaseDb } from '../../lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { joinGroupByCode } from '../../lib/firebase/groups';

interface InvitePageProps {
  code: string;
}

type InviteState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'ready'; groupName: string }
  | { kind: 'joined'; groupName: string }
  | { kind: 'error' };

export const InvitePage: React.FC<InvitePageProps> = ({ code }) => {
  const { locale, user, authStatus, signIn, setActiveGroup } = useAppStore();
  const t = TRANSLATIONS[locale];
  const ar = locale === 'ar';
  const [state, setState] = useState<InviteState>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const snap = await getDoc(doc(getFirebaseDb(), 'inviteCodes', code.trim().toUpperCase()));
        if (cancelled) return;
        if (!snap.exists()) {
          setState({ kind: 'invalid' });
          return;
        }
        // Non-members cannot read groups/{gid}; the invite doc carries the name.
        const name = (snap.data().groupName as string | undefined) ?? '';
        setState({ kind: 'ready', groupName: name || code });
      } catch {
        if (!cancelled) setState({ kind: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const handleJoin = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const group = await joinGroupByCode(
        user.uid,
        user.displayName || user.email?.split('@')[0] || 'Member',
        code,
      );
      setActiveGroup(group.id);
      setState({ kind: 'joined', groupName: group.name });
    } catch {
      setState({ kind: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const title =
    state.kind === 'joined'
      ? t.friends.joined
      : state.kind === 'invalid' || state.kind === 'error'
        ? t.friends.errorGeneric
        : t.invite.title;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        backgroundColor: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-on-surface)',
      }}
    >
      <div
        className="w-full max-w-md p-8 rounded-3xl border text-center"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
          }}
        >
          <MaterialIcon
            name={state.kind === 'joined' ? 'group_add' : state.kind === 'invalid' ? 'group_off' : 'group'}
            size={28}
          />
        </div>

        <h1 className="text-xl font-bold font-display mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
          {title}
        </h1>

        {state.kind === 'loading' && (
          <div className="space-y-2 mb-5" aria-hidden="true">
            <div className="h-4 w-3/4 mx-auto rounded animate-pulse" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }} />
            <div className="h-4 w-1/2 mx-auto rounded animate-pulse" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }} />
          </div>
        )}

        {state.kind === 'ready' && (
          <>
            <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {ar ? 'دعوة للانضمام إلى مجموعة دراسية:' : "You're invited to join a study group:"}
            </p>
            <p className="text-base font-bold mb-5" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {state.groupName}
            </p>
            <div className="flex flex-col gap-2">
              {user ? (
                <button
                  onClick={() => void handleJoin()}
                  disabled={busy}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                  }}
                >
                  {busy ? '…' : t.friends.join}
                </button>
              ) : authStatus === 'loading' ? null : (
                <button
                  onClick={() => void signIn()}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                  }}
                >
                  {t.friends.signInCta}
                </button>
              )}
              <button
                onClick={() => navigateToAppTab('focus')}
                className="px-6 py-2 rounded-xl text-xs font-semibold cursor-pointer border"
                style={{
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {t.invite.backCta}
              </button>
            </div>
          </>
        )}

        {state.kind === 'joined' && (
          <button
            onClick={() => navigateToAppTab('friends')}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
            }}
          >
            {t.friends.title}
          </button>
        )}

        {(state.kind === 'invalid' || state.kind === 'error') && (
          <div className="flex flex-col gap-2">
            {!user && authStatus === 'ready' && (
              <button
                onClick={() => void signIn()}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                }}
              >
                {t.friends.signInCta}
              </button>
            )}
            <button
              onClick={() => navigateToAppTab('focus')}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              {t.invite.backCta}
            </button>
          </div>
        )}

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold mt-6"
          style={{
            borderColor: 'var(--md-sys-color-outline-variant)',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          <MaterialIcon name="tag" size={14} />
          <span>{t.invite.codeLabel}: {code}</span>
        </div>
      </div>
    </div>
  );
};
