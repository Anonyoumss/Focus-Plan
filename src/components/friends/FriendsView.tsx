import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { navigateToAppTab } from '../../lib/router';
import {
  addGroupTask,
  createGroup,
  deleteGroupTask,
  getPrivateProfile,
  getPublicProfile,
  joinGroupByCode,
  leaveGroup,
  listGroupSessions,
  listGroupTasks,
  listMembers,
  listMyGroups,
  listPublicBoard,
  savePrivateProfile,
  savePublicProfile,
  setPublicBoardEntry,
  type GroupDoc,
  type GroupMember,
  type GroupSession,
  type GroupTask,
  type PublicBoardEntry,
} from '../../lib/firebase/groups';
import { dayKey, minutesByMember, rankLeaderboard, recentDayKeys } from '../../lib/groupStats';
import { MdSwitch } from '../common/MdControls';
import { ReferralsCard } from './ReferralsCard';

interface GroupDetail {
  members: GroupMember[];
  tasks: GroupTask[];
  sessions: GroupSession[];
}

export const FriendsView: React.FC = () => {
  const {
    locale,
    user,
    cloudSyncEnabled,
    authStatus,
    firebaseEnabled,
    signIn,
    focusPoints,
    streak,
    sessionLogs,
    activeGroupId,
    groupFocusTaskId,
    setActiveGroup,
    setGroupFocusTask,
  } = useAppStore();
  const t = TRANSLATIONS[locale];
  const ar = locale === 'ar';

  const [groups, setGroups] = useState<GroupDoc[]>([]);
  const [selected, setSelected] = useState<GroupDoc | null>(null);
  const [detail, setDetail] = useState<GroupDetail>({ members: [], tasks: [], sessions: [] });
  const [board, setBoard] = useState<PublicBoardEntry[]>([]);
  const [alias, setAlias] = useState('');
  const [publicAlias, setPublicAlias] = useState('');
  const [shareMinutes, setShareMinutes] = useState(false);
  const [shareStreak, setShareStreak] = useState(false);
  const [onPublicBoard, setOnPublicBoard] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [period, setPeriod] = useState<'day' | 'week'>('week');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const uid = user?.uid ?? null;
  const ready = !!uid && cloudSyncEnabled;

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  const refreshGroups = useCallback(async () => {
    if (!uid) return;
    await Promise.resolve();
    const list = await listMyGroups(uid).catch(() => [] as GroupDoc[]);
    setGroups(list);
    setSelected((prev) => {
      if (!prev) return list[0] ?? null;
      return list.find((g) => g.id === prev.id) ?? list[0] ?? null;
    });
  }, [uid]);

  const refreshDetail = useCallback(async (g: GroupDoc | null) => {
    await Promise.resolve();
    if (!g) {
      setDetail({ members: [], tasks: [], sessions: [] });
      return;
    }
    const [members, tasks, sessions] = await Promise.all([
      listMembers(g.id).catch(() => [] as GroupMember[]),
      listGroupTasks(g.id).catch(() => [] as GroupTask[]),
      listGroupSessions(g.id).catch(() => [] as GroupSession[]),
    ]);
    setDetail({ members, tasks, sessions });
  }, []);

  useEffect(() => {
    if (!ready || !uid) return;
    queueMicrotask(() => void refreshGroups());
    void (async () => {
      const [priv, pub, pubBoard] = await Promise.all([
        getPrivateProfile(uid).catch(() => null),
        getPublicProfile(uid).catch(() => null),
        listPublicBoard().catch(() => [] as PublicBoardEntry[]),
      ]);
      if (priv) setAlias(priv.alias);
      if (pub) {
        setPublicAlias(pub.alias);
        setShareMinutes(pub.shareMinutes);
        setShareStreak(pub.shareStreak);
      }
      setOnPublicBoard(pubBoard.some((e) => e.uid === uid));
      setBoard(pubBoard);
    })();
  }, [ready, uid, refreshGroups]);

  useEffect(() => {
    queueMicrotask(() => void refreshDetail(selected));
  }, [selected, refreshDetail]);

  // Re-fetch group detail periodically so other members' minutes appear.
  useEffect(() => {
    if (!selected) return;
    const id = setInterval(() => void refreshDetail(selected), 15000);
    return () => clearInterval(id);
  }, [selected, refreshDetail]);

  const weeklyMinutes = useCallback(
    (memberUid: string) => {
      const keys = recentDayKeys(new Date(), 7);
      return minutesByMember(detail.sessions, keys).get(memberUid) ?? 0;
    },
    [detail.sessions],
  );

  const dayMinutes = useCallback(
    (memberUid: string) =>
      minutesByMember(detail.sessions, new Set([dayKey(new Date())])).get(memberUid) ?? 0,
    [detail.sessions],
  );

  const leaderboard = useMemo(() => {
    const minutesOf = period === 'day' ? dayMinutes : weeklyMinutes;
    const entries = detail.members.map((m) => {
      const isSelf = m.uid === uid;
      return {
        uid: m.uid,
        alias: m.alias,
        minutes: minutesOf(m.uid),
        focusPoints: isSelf ? focusPoints : 0,
        streak: isSelf ? streak.currentStreak : 0,
        isSelf,
      };
    });
    return rankLeaderboard(entries);
  }, [detail.members, period, dayMinutes, weeklyMinutes, uid, focusPoints, streak.currentStreak]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      console.warn(e);
      flash(t.friends.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () =>
    run(async () => {
      if (!uid || !newGroupName.trim()) return;
      const g = await createGroup(uid, newGroupName.trim(), alias || user?.displayName || 'Member');
      setNewGroupName('');
      await refreshGroups();
      setSelected(g);
    });

  const handleJoin = () =>
    run(async () => {
      if (!uid || !joinCode.trim()) return;
      const g = await joinGroupByCode(uid, alias || user?.displayName || 'Member', joinCode.trim());
      setJoinCode('');
      await refreshGroups();
      setSelected(g);
      flash(t.friends.joined);
    });

  const handleLeave = () =>
    run(async () => {
      if (!uid || !selected) return;
      await leaveGroup(uid, selected.id);
      if (activeGroupId === selected.id) {
        setActiveGroup(null);
        setGroupFocusTask(null);
      }
      setSelected(null);
      await refreshGroups();
      flash(t.friends.leftGroup);
    });

  const handleSaveAlias = () =>
    run(async () => {
      if (!uid) return;
      await savePrivateProfile(uid, alias.trim());
      flash(t.friends.aliasSaved);
    });

  const handleSavePublic = (optIn: boolean) =>
    run(async () => {
      if (!uid) return;
      const name = publicAlias.trim() || alias.trim() || user?.displayName || 'Member';
      if (optIn) {
        // Publish only opted-in stat keys; the rules whitelist drops the rest.
        const myMinutes = sessionLogs
          .filter((s) => s.durationMinutes > 0)
          .reduce((sum, s) => {
            const d = new Date(s.dateStr + 'T12:00:00');
            return recentDayKeys(new Date(), 7).has(dayKey(d)) ? sum + s.durationMinutes : sum;
          }, 0);
        await savePublicProfile(uid, {
          alias: name.slice(0, 60),
          shareMinutes,
          shareStreak,
          shareFocusPoints: false,
          ...(shareMinutes ? { weeklyMinutes: myMinutes } : {}),
          ...(shareStreak ? { streak: streak.currentStreak } : {}),
        });
        await setPublicBoardEntry(uid, {
          uid,
          alias: name.slice(0, 60),
          weeklyMinutes: shareMinutes ? myMinutes : 0,
          streak: shareStreak ? streak.currentStreak : 0,
          updatedAt: Date.now(),
        });
      } else {
        await savePublicProfile(uid, {
          alias: name.slice(0, 60),
          shareMinutes: false,
          shareStreak: false,
          shareFocusPoints: false,
        });
        await setPublicBoardEntry(uid, null);
      }
      const pubBoard = await listPublicBoard().catch(() => [] as PublicBoardEntry[]);
      setBoard(pubBoard);
      setOnPublicBoard(optIn);
    });

  const card = 'rounded-2xl border p-5';
  const cardStyle = {
    backgroundColor: 'var(--md-sys-color-surface-container-low)',
    borderColor: 'var(--md-sys-color-outline-variant)',
  } as const;
  const inputStyle = {
    backgroundColor: 'var(--md-sys-color-surface-container)',
    borderColor: 'var(--md-sys-color-outline-variant)',
    color: 'var(--md-sys-color-on-surface)',
  } as const;
  const primaryBtn =
    'px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50';
  const primaryBtnStyle = {
    backgroundColor: 'var(--md-sys-color-primary)',
    color: 'var(--md-sys-color-on-primary)',
  } as const;

  if (authStatus === 'loading') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--md-sys-color-on-surface)' }}>
          {t.friends.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {ar
            ? 'مجموعات مذاكرة حقيقية مع مهام مشتركة ولوحات صدارة.'
            : 'Real study groups with shared tasks and leaderboards.'}
        </p>
      </div>

      <div className="mb-6">
        <ReferralsCard />
      </div>

      {notice && (
        <div
          className="mb-4 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
          }}
          role="status"
        >
          {notice}
        </div>
      )}

      {!ready ? (
        <div className="space-y-4">
          {/* Skeleton leaderboard preview */}
          <div className={card} style={cardStyle} aria-hidden="true">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-32 rounded-lg" style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }} />
              <div className="h-6 w-20 rounded-full" style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }} />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <div className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/5 rounded" style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }} />
                  <div className="h-2.5 w-1/4 rounded" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }} />
                </div>
                <div className="h-3 w-12 rounded" style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }} />
              </div>
            ))}
          </div>
          <div className={card} style={cardStyle}>
            <p className="text-sm mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {firebaseEnabled
                ? t.friends.signInRequired
                : (ar
                  ? 'تسجيل الدخول لتكوين المجموعات أو الانضمام إليها يتطلب خلفية مُهيأة. هذا الإصدار يعمل كضيف محلي.'
                  : 'Creating or joining groups requires sign-in with a configured backend. This build runs as a local guest.')}
            </p>
            {firebaseEnabled && (
              <button
                onClick={() => void signIn()}
                className={primaryBtn}
                style={primaryBtnStyle}
                disabled={busy}
              >
                {t.friends.signInCta}
              </button>
            )}
          </div>
          <ReferralsCard />
        </div>
      ) : (
        <>
          {/* Profile + public board opt-in */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className={card} style={cardStyle}>
              <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {t.friends.aliasLabel}
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder={t.friends.aliasPlaceholder}
                  maxLength={60}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                  style={inputStyle}
                />
                <button onClick={handleSaveAlias} className={primaryBtn} style={primaryBtnStyle} disabled={busy}>
                  {t.friends.saveAlias}
                </button>
              </div>
            </div>

            <div className={card} style={cardStyle}>
              <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {t.friends.publicLeaderboard}
              </h2>
              <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                <MdSwitch
                  selected={onPublicBoard}
                  onSelectedChange={(v) => void handleSavePublic(v)}
                  label={t.friends.publicOptIn}
                />
              </div>
              {onPublicBoard && (
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    <input type="checkbox" checked={shareMinutes} onChange={(e) => setShareMinutes(e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--md-sys-color-primary)' }} />
                    {t.friends.focusTime}
                  </label>
                  <label className="flex items-center gap-3 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    <input type="checkbox" checked={shareStreak} onChange={(e) => setShareStreak(e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--md-sys-color-primary)' }} />
                    {t.streaks.dayStreak}
                  </label>
                  <button onClick={() => void handleSavePublic(true)} className={primaryBtn} style={primaryBtnStyle} disabled={busy}>
                    {t.friends.saveAlias}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Create + join */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className={card} style={cardStyle}>
              <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {t.friends.createGroup}
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={t.friends.groupName}
                  maxLength={120}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                  style={inputStyle}
                />
                <button onClick={handleCreate} className={primaryBtn} style={primaryBtnStyle} disabled={busy || !newGroupName.trim()}>
                  {t.friends.createGroup}
                </button>
              </div>
            </div>

            <div className={card} style={cardStyle}>
              <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {t.friends.joinByCode}
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={t.friends.enterCode}
                  maxLength={8}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border text-sm uppercase tracking-wider outline-none"
                  style={inputStyle}
                />
                <button onClick={handleJoin} className={primaryBtn} style={primaryBtnStyle} disabled={busy || !joinCode.trim()}>
                  {t.friends.join}
                </button>
              </div>
            </div>
          </div>

          {/* Referrals (Stage E) */}
          <div className="mb-8">
            <ReferralsCard alias={alias} />
          </div>

          {/* Group selector */}
          {groups.length === 0 ? (
            <p className="text-sm mb-8" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {t.friends.noGroups}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-6">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelected(g)}
                  className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer border"
                  style={
                    selected?.id === g.id
                      ? { backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', borderColor: 'var(--md-sys-color-primary)' }
                      : { backgroundColor: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)', borderColor: 'var(--md-sys-color-outline-variant)' }
                  }
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="space-y-6">
              {/* Invite code + leave */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border"
                  style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  <MaterialIcon name="tag" size={16} />
                  <span className="text-xs font-semibold">{t.friends.shareLink}</span>
                  <code className="text-sm font-bold tracking-widest">{selected.inviteCode}</code>
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(`${location.origin}${location.pathname}#/invite/${selected.inviteCode}`);
                      flash(t.friends.copied);
                    }}
                    className="text-xs font-semibold cursor-pointer"
                    style={{ color: 'var(--md-sys-color-primary)' }}
                  >
                    {t.friends.copyCode}
                  </button>
                </div>
                <button
                  onClick={handleLeave}
                  className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border"
                  style={{ borderColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-error)' }}
                  disabled={busy}
                >
                  {t.friends.leaveGroup}
                </button>
              </div>

              {/* Members + shared tasks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={card} style={cardStyle}>
                  <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {t.friends.members} ({detail.members.length})
                  </h2>
                  <ul className="space-y-1.5">
                    {detail.members.map((m) => (
                      <li key={m.uid} className="flex items-center justify-between text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        <span>
                          {m.alias}
                          {m.uid === uid ? ` (${ar ? 'أنت' : 'you'})` : ''}
                          {m.role === 'owner' ? ' · owner' : ''}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          {new Date(m.joinedAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={card} style={cardStyle}>
                  <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {t.friends.groupTasks}
                  </h2>
                  <ul className="space-y-1.5 mb-3">
                    {detail.tasks.map((task) => (
                      <li key={task.id} className="flex items-center justify-between gap-2 text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        <button
                          onClick={() => {
                            setActiveGroup(selected.id);
                            setGroupFocusTask(task.id);
                            navigateToAppTab('focus');
                          }}
                          className="text-start flex-1 cursor-pointer"
                          style={{ color: groupFocusTaskId === task.id && activeGroupId === selected.id ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface)' }}
                        >
                          {task.title}
                          {groupFocusTaskId === task.id && activeGroupId === selected.id ? ` · ${t.friends.focusOnTask}` : ''}
                        </button>
                        {task.createdBy === uid && (
                          <button
                            onClick={() => void run(() => deleteGroupTask(selected.id, task.id))}
                            className="cursor-pointer"
                            style={{ color: 'var(--md-sys-color-error)' }}
                            aria-label="delete"
                          >
                            <MaterialIcon name="delete" size={16} />
                          </button>
                        )}
                      </li>
                    ))}
                    {detail.tasks.length === 0 && (
                      <li className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>—</li>
                    )}
                  </ul>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder={t.friends.taskTitlePlaceholder}
                      maxLength={200}
                      className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                      style={inputStyle}
                    />
                    <button
                      onClick={() =>
                        run(async () => {
                          if (!uid || !newTaskTitle.trim()) return;
                          await addGroupTask(selected.id, uid, newTaskTitle.trim());
                          setNewTaskTitle('');
                          await refreshDetail(selected);
                        })
                      }
                      className={primaryBtn}
                      style={primaryBtnStyle}
                      disabled={busy || !newTaskTitle.trim()}
                    >
                      {t.friends.addTask}
                    </button>
                  </div>
                </div>
              </div>

              {/* Leaderboard */}
              <div
                className="rounded-3xl p-6 border"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {t.friends.weeklyLeaderboard}
                  </h2>
                  <div className="flex gap-2">
                    {(['day', 'week'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border"
                        style={
                          period === p
                            ? { backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', borderColor: 'var(--md-sys-color-primary)' }
                            : { borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface-variant)' }
                        }
                      >
                        {p === 'day' ? t.friends.dayFilter : t.friends.weekFilter}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {leaderboard.map((m, i) => (
                    <div
                      key={m.uid}
                      className="flex items-center justify-between p-3.5 rounded-xl border"
                      style={{
                        backgroundColor: m.isSelf
                          ? 'var(--md-sys-color-primary-container)'
                          : 'var(--md-sys-color-surface-container-low)',
                        borderColor: m.isSelf
                          ? 'var(--md-sys-color-primary)'
                          : 'var(--md-sys-color-outline-variant)',
                        color: m.isSelf
                          ? 'var(--md-sys-color-on-primary-container)'
                          : 'var(--md-sys-color-on-surface)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-timer font-bold text-sm w-6 text-center tabular-nums">#{i + 1}</span>
                        <div>
                          <div className="text-sm font-bold">{m.alias}</div>
                          <div className="text-xs" style={{ opacity: 0.8 }}>
                            {m.streak} {t.streaks.dayStreak} · {m.focusPoints} {t.store.focusPoints}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-timer font-bold tabular-nums">
                        {period === 'day' ? dayMinutes(m.uid) : weeklyMinutes(m.uid)} {ar ? 'دقيقة' : 'mins'}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {t.friends.dailyWinnerNotice} · {t.friends.weeklyWinnerNotice}
                </p>
              </div>
            </div>
          )}

          {/* Public leaderboard */}
          <div
            className="rounded-3xl p-6 border mt-8"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {t.friends.publicBoard}
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {t.friends.publicBoardNote}
            </p>
            {board.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {t.friends.publicBoardEmpty}
              </p>
            ) : (
              <div className="space-y-2">
                {board.slice(0, 20).map((e, i) => (
                  <div
                    key={e.uid}
                    className="flex items-center justify-between p-3 rounded-xl text-sm"
                    style={{
                      backgroundColor: 'var(--md-sys-color-surface-container)',
                      color: 'var(--md-sys-color-on-surface)',
                    }}
                  >
                    <span className="font-semibold">
                      #{i + 1} {e.alias}
                      {e.uid === uid ? ` (${ar ? 'أنت' : 'you'})` : ''}
                    </span>
                    <span className="font-timer tabular-nums">
                      {e.weeklyMinutes} {ar ? 'دقيقة' : 'mins'} · {e.streak} {t.streaks.dayStreak}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
