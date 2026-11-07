import { create } from 'zustand';
import { Locale } from '../i18n/translations';
import { ThemeMode, syncDocumentTheme } from '../design/theme';
import {
  TimerMode,
  TimerConfig,
  DEFAULT_TIMER_CONFIG,
  calculateRemainingSeconds,
  getNextMode,
  updateDocumentTitle,
  restoreDefaultTitle,
  requestScreenWakeLock,
  releaseScreenWakeLock,
  sendWebNotification,
} from '../lib/timerEngine';
import { soundEngine } from '../lib/soundEngine';
import {
  StreakState,
  getTodayDateString,
  updateStreakOnSessionComplete,
} from '../lib/streakCalculator';
import {
  CoinTransaction,
  StoreItem,
  processPurchase,
  awardPoints,
} from '../lib/coinsEngine';
import { UserTestGoal } from '../data/tests/catalog';
import {
  FocusSessionRecord,
  generateDefaultSessionLogs,
  exportSessionsToCsv,
} from '../lib/analyticsEngine';
import { isFirebaseConfigured } from '../lib/firebase/config';
import type { CloudStateSlice, SyncedState } from '../lib/firebase/sync';
import {
  mergeSyncedState,
  stampSyncedCollections,
  type SyncMeta,
} from '../lib/syncMerge';
import { dayKey, recentDayKeys } from '../lib/groupStats';
import {
  applyTemplate,
  toBlueprint,
  validateTemplate,
  type TaskTemplate,
} from '../lib/templates';
import {
  importTasksCsv,
  importTasksJson,
  type PortResult,
} from '../lib/dataPort';
import {
  DEFAULT_REMINDER_SETTINGS,
  buildReminderCandidates,
  dueReminders,
  markFired,
  type ReminderSettings,
} from '../lib/reminders';

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  estimatedSessions: number;
  completedSessions: number;
  minGoal: number;
  maxGoal: number;
  cadence: 'hourly' | 'daily' | 'weekly' | 'monthly';
  notes: string;
  isCompleted: boolean;
  createdAt: number;
}

export type TabDestination =
  | 'focus'
  | 'plan'
  | 'tests'
  | 'progress'
  | 'friends'
  | 'store'
  | 'settings'
  | 'terms'
  | 'privacy';

export interface AppState {
  locale: Locale;
  themeMode: ThemeMode;
  seedHex: string;
  activeTab: TabDestination;
  onboardingCompleted: boolean;
  showShortcutsModal: boolean;

  // Timer state
  timerMode: TimerMode;
  isRunning: boolean;
  targetEndTime: number | null;
  remainingSeconds: number;
  completedFocusSessions: number;
  dailyGoalSessions: number;
  todaySessionsCount: number;
  activeTaskId: string | null;
  ambientSound: 'none' | 'whitenoise' | 'binaural' | 'rain';
  alarmVolume: number;
  ambientVolume: number;
  tickSoundEnabled: boolean;
  tickVolume: number;
  reminderSettings: ReminderSettings;
  setReminderSettings: (settings: ReminderSettings) => void;
  timerConfig: TimerConfig;

  // Tasks & Goals
  tasks: TaskItem[];
  taskTemplates: TaskTemplate[];
  testGoals: UserTestGoal[];

  // Streaks, Coins & Gamification
  streak: StreakState;
  coins: number;
  focusPoints: number;
  inventory: Record<string, number>;
  transactions: CoinTransaction[];

  // Session Logs & Telemetry
  sessionLogs: FocusSessionRecord[];
  demoDataLoaded: boolean;

  // Cloud sync (Firebase Auth + Firestore)
  firebaseEnabled: boolean;
  authStatus: 'loading' | 'ready';
  user: { uid: string; email: string | null; displayName: string | null } | null;
  cloudSyncEnabled: boolean;
  /** Set when sign-in finds both local and cloud data (or local-only data). */
  migrationChoice: 'local-only' | 'both' | null;
  syncError: string | null;

  // Groups (cloud-only; membership lives in Firestore)
  activeGroupId: string | null;
  groupFocusTaskId: string | null;
  setActiveGroup: (gid: string | null) => void;
  setGroupFocusTask: (taskId: string | null) => void;

  // Actions
  setLocale: (locale: Locale) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setSeedHex: (hex: string) => void;
  setActiveTab: (tab: TabDestination) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setShowShortcutsModal: (show: boolean) => void;

  // Timer actions
  setTimerMode: (mode: TimerMode) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  skipTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  setActiveTaskId: (id: string | null) => void;
  setAmbientSound: (type: 'none' | 'whitenoise' | 'binaural' | 'rain') => void;
  setAlarmVolume: (vol: number) => void;
  setAmbientVolume: (vol: number) => void;
  setTickSoundEnabled: (enabled: boolean) => void;
  setTickVolume: (vol: number) => void;
  updateTimerConfig: (config: Partial<TimerConfig>) => void;
  setDailyGoalSessions: (goal: number) => void;
  addSessionLog: (record: FocusSessionRecord) => void;

  // Task actions
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'completedSessions' | 'isCompleted'>) => void;
  updateTask: (id: string, updates: Partial<TaskItem>) => void;
  deleteTask: (id: string) => void;
  toggleTaskDone: (id: string) => void;
  clearDoneTasks: () => void;
  moveTask: (id: string, targetIndex: number) => void;

  // Template & import actions
  saveTaskAsTemplate: (taskId: string, name: string) => void;
  saveTaskListAsTemplate: (name: string) => void;
  applyTaskTemplate: (templateId: string) => void;
  renameTaskTemplate: (id: string, name: string) => void;
  deleteTaskTemplate: (id: string) => void;
  importTasks: (blueprints: PortResult['tasks']) => number;
  importTasksFromJson: (text: string) => PortResult;
  importTasksFromCsv: (text: string) => PortResult;

  // Test Goal actions
  addTestGoal: (goal: UserTestGoal) => void;
  updateTestGoal: (id: string, updates: Partial<UserTestGoal>) => void;
  deleteTestGoal: (id: string) => void;

  // Store actions
  purchaseItem: (item: StoreItem) => Promise<boolean>;

  // Export / Reset
  exportDataJson: () => string;
  exportDataCsv: () => string;
  resetAllData: () => void;
  loadDemoData: () => void;

  // Cloud sync actions
  signIn: () => Promise<void>;
  signOutAccount: () => Promise<void>;
  resolveMigration: (choice: 'import' | 'cloud' | 'later') => Promise<void>;
}

const STORAGE_KEY = 'focus_plan_m3e_v1';

type PersistedShape = Partial<AppState> & { syncMeta?: SyncMeta };

function loadPersistedState(): PersistedShape {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse local storage state:', e);
    return {};
  }
}

// Per-record { hash, updatedAt } map driving conflict-free sync merges.
// Persisted inside the same localStorage blob under `syncMeta`.
let syncMeta: SyncMeta = loadPersistedState().syncMeta ?? {};

function persistState(state: AppState) {
  if (typeof window === 'undefined') return;
  const toSave = {
    locale: state.locale,
    themeMode: state.themeMode,
    seedHex: state.seedHex,
    onboardingCompleted: state.onboardingCompleted,
    dailyGoalSessions: state.dailyGoalSessions,
    todaySessionsCount: state.todaySessionsCount,
    completedFocusSessions: state.completedFocusSessions,
    timerConfig: state.timerConfig,
    tasks: state.tasks,
    taskTemplates: state.taskTemplates,
    testGoals: state.testGoals,
    streak: state.streak,
    coins: state.coins,
    focusPoints: state.focusPoints,
    inventory: state.inventory,
    transactions: state.transactions,
    activeTaskId: state.activeTaskId,
    sessionLogs: state.sessionLogs,
    demoDataLoaded: state.demoDataLoaded,
    timerMode: state.timerMode,
    isRunning: state.isRunning,
    targetEndTime: state.targetEndTime,
    activeGroupId: state.activeGroupId,
    groupFocusTaskId: state.groupFocusTaskId,
    reminderSettings: state.reminderSettings,
    tickSoundEnabled: state.tickSoundEnabled,
    tickVolume: state.tickVolume,
  };
  // Stamp updatedAt for the cloud push and advance the sync meta map.
  // localStorage keeps the clean records; only the enqueued slice carries
  // updatedAt so Firestore docs get per-record timestamps. The cloud slice
  // key is `templates` while local state/persistence uses `taskTemplates`.
  const { slice, meta } = stampSyncedCollections(
    { ...toSave, templates: state.taskTemplates } as unknown as Record<string, unknown>,
    syncMeta,
    Date.now(),
  );
  syncMeta = meta;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...toSave, syncMeta }));
  } catch (e) {
    console.warn('Failed to persist state:', e);
  }
  void import('../lib/firebase/cloudSync')
    .then((m) => m.enqueueCloudSync(slice as unknown as CloudStateSlice))
    .catch(() => {});
}

const initialPersisted = loadPersistedState();

const initialTimerConfig = initialPersisted.timerConfig || DEFAULT_TIMER_CONFIG;
const initialTimerMode = initialPersisted.timerMode || 'focus';
const initialModeDuration =
  initialTimerMode === 'focus'
    ? initialTimerConfig.focusDuration
    : initialTimerMode === 'shortBreak'
    ? initialTimerConfig.shortBreakDuration
    : initialTimerConfig.longBreakDuration;
const recoveredEndTime =
  initialPersisted.isRunning && initialPersisted.targetEndTime
    ? initialPersisted.targetEndTime
    : null;
const recoveredRemaining = recoveredEndTime
  ? Math.max(0, calculateRemainingSeconds(recoveredEndTime, Date.now()))
  : initialModeDuration;

const DEMO_TASKS: TaskItem[] = [
  {
    id: 'sample_task_1',
    title: 'GAT Quantitative Reasoning Problem Set',
    category: 'Standardized Tests',
    estimatedSessions: 4,
    completedSessions: 2,
    minGoal: 2,
    maxGoal: 6,
    cadence: 'daily',
    notes: 'Focus on geometry and arithmetic speed drills.',
    isCompleted: false,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'sample_task_2',
    title: 'SAT Reading Evidence-Based Passages',
    category: 'Study',
    estimatedSessions: 3,
    completedSessions: 1,
    minGoal: 1,
    maxGoal: 4,
    cadence: 'daily',
    notes: 'Review historical text analysis strategies.',
    isCompleted: false,
    createdAt: Date.now() - 1800000,
  },
];

const DEMO_TEST_GOALS: UserTestGoal[] = [
  {
    id: 'demo_gat_goal',
    testId: 'gat_qudurat',
    testName: 'Saudi GAT (Qudurat)',
    testDate: '2026-12-15',
    targetScore: 92,
    currentBaselineScore: 81,
    sectionTargets: { gat_quant: 94, gat_verbal: 90 },
    weeklyHours: 12,
    weeklyPomodoros: 24,
    completedPomodoros: 14,
    scoresHistory: [
      { date: '2026-10-15', score: 81, sectionScores: { gat_quant: 83, gat_verbal: 79 }, notes: 'Diagnostic baseline' },
    ],
  },
  {
    id: 'demo_sat_goal',
    testId: 'sat_collegeboard',
    testName: 'SAT Digital',
    testDate: '2026-12-05',
    targetScore: 1480,
    currentBaselineScore: 1360,
    sectionTargets: { sat_reading_writing: 720, sat_math: 760 },
    weeklyHours: 10,
    weeklyPomodoros: 20,
    completedPomodoros: 8,
    scoresHistory: [],
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  locale: initialPersisted.locale || 'en',
  themeMode: initialPersisted.themeMode || 'system',
  seedHex: initialPersisted.seedHex || '#2e6b52',
  activeTab: 'focus',
  onboardingCompleted: initialPersisted.onboardingCompleted ?? false,
  showShortcutsModal: false,

  timerMode: initialTimerMode,
  isRunning: !!recoveredEndTime,
  targetEndTime: recoveredEndTime,
  remainingSeconds: recoveredRemaining,
  completedFocusSessions: initialPersisted.completedFocusSessions || 0,
  dailyGoalSessions: initialPersisted.dailyGoalSessions || 4,
  todaySessionsCount: initialPersisted.todaySessionsCount || 0,
  activeTaskId: initialPersisted.activeTaskId || null,
  ambientSound: 'none',
  alarmVolume: 0.7,
  ambientVolume: 0.5,
  tickSoundEnabled: initialPersisted.tickSoundEnabled ?? false,
  tickVolume: initialPersisted.tickVolume ?? 0.3,
  reminderSettings: initialPersisted.reminderSettings || DEFAULT_REMINDER_SETTINGS,
  timerConfig: initialPersisted.timerConfig || DEFAULT_TIMER_CONFIG,

  tasks: initialPersisted.tasks || [],
  taskTemplates: (initialPersisted.taskTemplates || []).filter(validateTemplate),
  testGoals: initialPersisted.testGoals || [],

  streak: initialPersisted.streak || {
    currentStreak: 0,
    bestStreak: 0,
    lastActiveDate: null,
    streakFreezes: 0,
    freezeUsedDates: [],
  },
  coins: initialPersisted.coins ?? 0,
  focusPoints: initialPersisted.focusPoints ?? 0,
  inventory: initialPersisted.inventory || {},
  transactions: initialPersisted.transactions || [],
  sessionLogs: initialPersisted.sessionLogs || [],
  demoDataLoaded: initialPersisted.demoDataLoaded || false,
  activeGroupId: initialPersisted.activeGroupId ?? null,
  groupFocusTaskId: initialPersisted.groupFocusTaskId ?? null,

  firebaseEnabled: isFirebaseConfigured(),
  authStatus: isFirebaseConfigured() ? 'loading' : 'ready',
  user: null,
  cloudSyncEnabled: false,
  migrationChoice: null,
  syncError: null,

  setLocale: (locale) => {
    set({ locale });
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    persistState(get());
  },

  setThemeMode: (themeMode) => {
    set({ themeMode });
    syncDocumentTheme(themeMode, get().seedHex);
    persistState(get());
  },

  setSeedHex: (seedHex) => {
    set({ seedHex });
    syncDocumentTheme(get().themeMode, seedHex);
    persistState(get());
  },

  setActiveTab: (activeTab) => {
    set({ activeTab });
  },

  setOnboardingCompleted: (onboardingCompleted) => {
    set({ onboardingCompleted });
    persistState(get());
  },

  setShowShortcutsModal: (showShortcutsModal) => {
    set({ showShortcutsModal });
  },

  setTimerMode: (timerMode) => {
    const { timerConfig } = get();
    let duration = timerConfig.focusDuration;
    if (timerMode === 'shortBreak') duration = timerConfig.shortBreakDuration;
    if (timerMode === 'longBreak') duration = timerConfig.longBreakDuration;

    set({
      timerMode,
      isRunning: false,
      targetEndTime: null,
      remainingSeconds: duration,
    });
    restoreDefaultTitle();
    releaseScreenWakeLock();
    soundEngine.stopAmbient();
    persistState(get());
  },

  startTimer: () => {
    const { remainingSeconds, isRunning, ambientSound, ambientVolume } = get();
    if (isRunning) return;

    const targetEndTime = Date.now() + remainingSeconds * 1000;
    set({
      isRunning: true,
      targetEndTime,
    });

    requestScreenWakeLock();
    if (ambientSound !== 'none') {
      soundEngine.setAmbient(ambientSound, ambientVolume);
    }
    persistState(get());
  },

  pauseTimer: () => {
    const { isRunning, targetEndTime } = get();
    if (!isRunning || !targetEndTime) return;

    const remainingSeconds = calculateRemainingSeconds(targetEndTime, Date.now());
    set({
      isRunning: false,
      targetEndTime: null,
      remainingSeconds,
    });

    releaseScreenWakeLock();
    soundEngine.stopAmbient();
    persistState(get());
  },

  skipTimer: () => {
    const { timerMode, completedFocusSessions, timerConfig } = get();
    const nextMode = getNextMode(timerMode, completedFocusSessions, timerConfig.longBreakInterval);
    get().setTimerMode(nextMode);
  },

  resetTimer: () => {
    const { timerMode } = get();
    get().setTimerMode(timerMode);
  },

  tickTimer: () => {
    const { isRunning, targetEndTime, timerMode, completedFocusSessions, timerConfig, activeTaskId, tasks, streak, todaySessionsCount, coins, focusPoints, alarmVolume, tickSoundEnabled, tickVolume } = get();
    if (isRunning && tickSoundEnabled) {
      soundEngine.playTick(tickVolume);
    }
    if (!isRunning || !targetEndTime) return;

    const now = Date.now();
    const remaining = calculateRemainingSeconds(targetEndTime, now);

    if (remaining > 0) {
      set({ remainingSeconds: remaining });
      updateDocumentTitle(
        `${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`,
        timerMode
      );
      return;
    }

    soundEngine.playChime(alarmVolume);
    soundEngine.stopAmbient();
    releaseScreenWakeLock();

    const isFocus = timerMode === 'focus';
    const newCompletedSessions = isFocus ? completedFocusSessions + 1 : completedFocusSessions;
    const newTodaySessions = isFocus ? todaySessionsCount + 1 : todaySessionsCount;

    let updatedTasks = tasks;
    if (isFocus && activeTaskId) {
      updatedTasks = tasks.map((t) =>
        t.id === activeTaskId ? { ...t, completedSessions: t.completedSessions + 1 } : t
      );
    }

    let newStreak = streak;
    let newCoins = coins;
    let newFocusPoints = focusPoints;
    let earnedCoins = 0;
    let earnedPoints = 0;
    let newTransactions = get().transactions;
    let newSessionLogs = get().sessionLogs;

    if (isFocus) {
      newStreak = updateStreakOnSessionComplete(streak, newTodaySessions);
      const coinResult = awardPoints(coins, 1, 'Completed focus session');
      newCoins = coinResult.newCoins;
      newTransactions = [coinResult.transaction, ...newTransactions];
      earnedCoins += 1;

      if (newTodaySessions === 3) {
        const streakBonus = awardPoints(newCoins, 2, 'Maintained daily 3+ streak threshold');
        newCoins = streakBonus.newCoins;
        newTransactions = [streakBonus.transaction, ...newTransactions];
        newFocusPoints += 1;
        earnedCoins += 2;
        earnedPoints += 1;
      }

      const activeTask = tasks.find((t) => t.id === activeTaskId);
      const newSessionRecord: FocusSessionRecord = {
        id: `sess_${Date.now()}`,
        timestamp: Date.now(),
        dateStr: getTodayDateString(),
        durationMinutes: Math.round(timerConfig.focusDuration / 60),
        taskId: activeTaskId,
        taskTitle: activeTask ? activeTask.title : 'Deep Focus Session',
        category: activeTask ? activeTask.category : 'Study',
      };
      newSessionLogs = [newSessionRecord, ...newSessionLogs];
    }

    sendWebNotification(
      isFocus ? 'Focus Session Complete!' : 'Break Over!',
      isFocus ? 'Great job! Time for a well-deserved break.' : 'Break finished. Ready for your next focus session?'
    );

    const nextMode = getNextMode(timerMode, newCompletedSessions, timerConfig.longBreakInterval);
    let nextDuration = timerConfig.focusDuration;
    if (nextMode === 'shortBreak') nextDuration = timerConfig.shortBreakDuration;
    if (nextMode === 'longBreak') nextDuration = timerConfig.longBreakDuration;

    set({
      timerMode: nextMode,
      isRunning: false,
      targetEndTime: null,
      remainingSeconds: nextDuration,
      completedFocusSessions: newCompletedSessions,
      todaySessionsCount: newTodaySessions,
      tasks: updatedTasks,
      streak: newStreak,
      coins: newCoins,
      focusPoints: newFocusPoints,
      transactions: newTransactions,
      sessionLogs: newSessionLogs,
    });

    persistState(get());
    restoreDefaultTitle();

    // Best-effort cloud mirrors: wallet ledger rows for earned coins/FP
    // and group session minutes when a group focus task is active.
    const { user: authUser, cloudSyncEnabled, activeGroupId, groupFocusTaskId } = get();
    if (authUser && cloudSyncEnabled) {
      if (earnedCoins > 0) {
        void import('../lib/firebase/groups')
          .then((m) => m.creditWallet(authUser.uid, earnedCoins, 0, 'Focus session award', 'focus_session'))
          .catch((e) => console.warn('Wallet coin mirror failed:', e));
      }
      if (earnedPoints > 0) {
        void import('../lib/firebase/groups')
          .then((m) => m.creditWallet(authUser.uid, 0, earnedPoints, 'Streak threshold award', 'streak_bonus'))
          .catch((e) => console.warn('Wallet FP mirror failed:', e));
      }
      if (activeGroupId && groupFocusTaskId) {
        void import('../lib/firebase/groups')
          .then((m) =>
            m.logGroupSession(
              activeGroupId,
              authUser.uid,
              groupFocusTaskId,
              timerConfig.focusDuration / 60,
            ),
          )
          .catch((e) => console.warn('Group session log failed:', e));
      }
    }

    if (
      (nextMode !== 'focus' && timerConfig.autoStartBreaks) ||
      (nextMode === 'focus' && timerConfig.autoStartPomodoros)
    ) {
      setTimeout(() => get().startTimer(), 500);
    }
  },

  setActiveTaskId: (activeTaskId) => {
    set({ activeTaskId });
    persistState(get());
  },

  setAmbientSound: (ambientSound) => {
    set({ ambientSound });
    if (get().isRunning) {
      soundEngine.setAmbient(ambientSound, get().ambientVolume);
    }
  },

  setAlarmVolume: (alarmVolume) => {
    set({ alarmVolume });
  },

  setAmbientVolume: (ambientVolume) => {
    set({ ambientVolume });
    soundEngine.setAmbientVolume(ambientVolume);
  },

  setTickSoundEnabled: (tickSoundEnabled) => {
    set({ tickSoundEnabled });
    persistState(get());
  },

  setTickVolume: (tickVolume) => {
    set({ tickVolume });
    persistState(get());
  },

  setReminderSettings: (reminderSettings) => {
    set({ reminderSettings });
    persistState(get());
  },

  updateTimerConfig: (config) => {
    const timerConfig = { ...get().timerConfig, ...config };
    set({ timerConfig });
    persistState(get());
  },

  setDailyGoalSessions: (dailyGoalSessions) => {
    set({ dailyGoalSessions });
    persistState(get());
  },

  addSessionLog: (record) => {
    const sessionLogs = [record, ...get().sessionLogs];
    set({ sessionLogs });
    persistState(get());
  },

  addTask: (taskData) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      completedSessions: 0,
      isCompleted: false,
      createdAt: Date.now(),
    };
    const tasks = [newTask, ...get().tasks];
    set({ tasks, activeTaskId: newTask.id });
    persistState(get());
  },

  updateTask: (id, updates) => {
    const tasks = get().tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    set({ tasks });
    persistState(get());
  },

  deleteTask: (id) => {
    const tasks = get().tasks.filter((t) => t.id !== id);
    const activeTaskId = get().activeTaskId === id ? null : get().activeTaskId;
    set({ tasks, activeTaskId });
    persistState(get());
  },

  toggleTaskDone: (id) => {
    const tasks = get().tasks.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    set({ tasks });
    persistState(get());
  },

  clearDoneTasks: () => {
    const tasks = get().tasks.filter((t) => !t.isCompleted);
    set({ tasks });
    persistState(get());
  },

  moveTask: (id, targetIndex) => {
    const tasks = [...get().tasks];
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1 || targetIndex < 0 || targetIndex >= tasks.length || targetIndex === index) return;
    const [moved] = tasks.splice(index, 1);
    tasks.splice(targetIndex, 0, moved);
    set({ tasks });
    persistState(get());
  },

  saveTaskAsTemplate: (taskId, name) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const tpl: TaskTemplate = {
      id: `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      title: name.slice(0, 120) || task.title,
      kind: 'task',
      items: [toBlueprint(task)],
      createdAt: Date.now(),
      category: 'Templates',
      cadence: 'daily',
      minGoal: 0,
      maxGoal: 0,
    };
    set({ taskTemplates: [tpl, ...get().taskTemplates] });
    persistState(get());
  },

  saveTaskListAsTemplate: (name) => {
    const tasks = get().tasks.filter((t) => !t.isCompleted);
    if (tasks.length === 0) return;
    const tpl: TaskTemplate = {
      id: `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      title: name.slice(0, 120) || 'Task list',
      kind: 'list',
      items: tasks.map(toBlueprint),
      createdAt: Date.now(),
      category: 'Templates',
      cadence: 'daily',
      minGoal: 0,
      maxGoal: 0,
    };
    set({ taskTemplates: [tpl, ...get().taskTemplates] });
    persistState(get());
  },

  applyTaskTemplate: (templateId) => {
    const tpl = get().taskTemplates.find((t) => t.id === templateId);
    if (!tpl) return;
    const genId = () =>
      `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const created = applyTemplate(tpl, genId) as TaskItem[];
    set({ tasks: [...get().tasks, ...created] });
    persistState(get());
  },

  renameTaskTemplate: (id, name) => {
    set({
      taskTemplates: get().taskTemplates.map((t) =>
        t.id === id ? { ...t, title: name.slice(0, 120) } : t,
      ),
    });
    persistState(get());
  },

  deleteTaskTemplate: (id) => {
    // Sync layer writes the tombstone for the removed slice doc.
    set({ taskTemplates: get().taskTemplates.filter((t) => t.id !== id) });
    persistState(get());
  },

  importTasks: (blueprints) => {
    const genId = () =>
      `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const created: TaskItem[] = blueprints.map((b) => ({
      ...b,
      id: genId(),
      completedSessions: 0,
      isCompleted: false,
      createdAt: now,
    }));
    set({ tasks: [...get().tasks, ...created] });
    persistState(get());
    return created.length;
  },

  importTasksFromJson: (text) => importTasksJson(text),
  importTasksFromCsv: (text) => importTasksCsv(text),

  addTestGoal: (goal) => {
    const testGoals = [goal, ...get().testGoals];
    set({ testGoals });
    persistState(get());
  },

  updateTestGoal: (id, updates) => {
    const testGoals = get().testGoals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    set({ testGoals });
    persistState(get());
  },

  deleteTestGoal: (id) => {
    const testGoals = get().testGoals.filter((g) => g.id !== id);
    set({ testGoals });
    persistState(get());
  },

  purchaseItem: async (item) => {
    const { coins, inventory, transactions, user, cloudSyncEnabled } = get();
    const result = processPurchase(coins, inventory, item);
    if (!result) return false;

    let streak = get().streak;
    if (item.id === 'streak_freeze') {
      streak = { ...streak, streakFreezes: streak.streakFreezes + 1 };
    }

    // Signed-in purchases are rule-enforced in Firestore: the wallet
    // update and ledger row commit in one transaction or not at all.
    if (user && cloudSyncEnabled) {
      try {
        const { spendCoins } = await import('../lib/firebase/groups');
        await spendCoins(user.uid, item.price, item.id, `Purchased ${item.titleKey}`);
      } catch (e) {
        console.warn('Cloud purchase failed:', e);
        set({ syncError: 'purchase-failed' });
        return false;
      }
    }

    set({
      coins: result.newCoins,
      inventory: result.newInventory,
      transactions: [result.transaction, ...transactions],
      streak,
    });
    persistState(get());
    return true;
  },

  setActiveGroup: (gid) => {
    set({ activeGroupId: gid });
    persistState(get());
  },

  setGroupFocusTask: (taskId) => {
    set({ groupFocusTaskId: taskId });
    persistState(get());
  },

  exportDataJson: () => {
    const state = get();
    const exportable = {
      exportedAt: new Date().toISOString(),
      tasks: state.tasks,
      testGoals: state.testGoals,
      streak: state.streak,
      coins: state.coins,
      focusPoints: state.focusPoints,
      todaySessionsCount: state.todaySessionsCount,
      completedFocusSessions: state.completedFocusSessions,
      sessionLogs: state.sessionLogs,
    };
    return JSON.stringify(exportable, null, 2);
  },

  exportDataCsv: () => {
    const state = get();
    return exportSessionsToCsv(state.sessionLogs);
  },

  resetAllData: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      tasks: [],
      testGoals: [],
      streak: {
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDate: null,
        streakFreezes: 0,
        freezeUsedDates: [],
      },
      coins: 0,
      focusPoints: 0,
      inventory: {},
      transactions: [],
      todaySessionsCount: 0,
      completedFocusSessions: 0,
      sessionLogs: [],
      demoDataLoaded: false,
    });
  },

  loadDemoData: () => {
    set({
      tasks: DEMO_TASKS,
      testGoals: DEMO_TEST_GOALS,
      activeTaskId: DEMO_TASKS[0]?.id || null,
      streak: {
        currentStreak: 4,
        bestStreak: 7,
        lastActiveDate: getTodayDateString(),
        streakFreezes: 1,
        freezeUsedDates: [],
      },
      coins: 35,
      focusPoints: 12,
      inventory: { streak_freeze: 1 },
      transactions: [
        { id: 'tx_demo_init', timestamp: Date.now() - 86400000, amount: 15, type: 'earn', reason: 'Demo welcome bonus' },
      ],
      todaySessionsCount: 4,
      completedFocusSessions: 26,
      sessionLogs: generateDefaultSessionLogs(),
      demoDataLoaded: true,
    });
    persistState(get());
  },

  signIn: async () => {
    try {
      set({ syncError: null });
      const { signInWithGoogle } = await import('../lib/firebase/auth');
      await signInWithGoogle();
      // Auth state listener drives the rest (migration check / pull).
    } catch (e) {
      console.warn('Google sign-in failed:', e);
      set({ syncError: 'sign-in-failed' });
    }
  },

  signOutAccount: async () => {
    try {
      const { signOutUser } = await import('../lib/firebase/auth');
      await signOutUser();
    } catch (e) {
      console.warn('Sign-out failed:', e);
      set({ syncError: 'sign-out-failed' });
    }
  },

  resolveMigration: async (choice) => {
    const uid = get().user?.uid;
    if (!uid) return;
    try {
      if (choice === 'import') {
        const { slice } = stampSyncedCollections(
          syncedSliceOf(get()) as unknown as Record<string, unknown>,
          syncMeta,
          Date.now(),
        );
        const sync = await import('../lib/firebase/sync');
        const cloudSync = await import('../lib/firebase/cloudSync');
        await sync.pushCloudState(uid, slice as unknown as CloudStateSlice);
        await sync.markMigrationComplete(uid);
        cloudSync.setCloudSyncContext(uid, true);
        set({ cloudSyncEnabled: true, migrationChoice: null, syncError: null });
        cloudSync.enqueueCloudSync(syncedSliceOf(get()));
        void adoptWalletAndClaimAwards(uid);
      } else if (choice === 'cloud') {
        const sync = await import('../lib/firebase/sync');
        const cloudSync = await import('../lib/firebase/cloudSync');
        const remote = await sync.pullCloudState(uid);
        // User may have signed out while the pull was in flight.
        if (get().user?.uid !== uid) return;
        applyCloudState(remote);
        await sync.markMigrationComplete(uid);
        cloudSync.setCloudSyncContext(uid, true);
        set({ cloudSyncEnabled: true, migrationChoice: null, syncError: null });
        void adoptWalletAndClaimAwards(uid);
      } else {
        // "Later": keep local data, leave cloud sync off until next sign-in.
        const cloudSync = await import('../lib/firebase/cloudSync');
        cloudSync.setCloudSyncContext(uid, false);
        set({ cloudSyncEnabled: false, migrationChoice: null });
      }
    } catch (e) {
      console.warn('Migration failed:', e);
      set({ syncError: 'migration-failed' });
    }
  },
}));

// ---- Cloud auth lifecycle (module scope; uses store statics) ----

function syncedSliceOf(s: AppState): CloudStateSlice {
  return {
    tasks: s.tasks,
    templates: s.taskTemplates as never,
    sessionLogs: s.sessionLogs,
    testGoals: s.testGoals,
    locale: s.locale,
    themeMode: s.themeMode,
    seedHex: s.seedHex,
    dailyGoalSessions: s.dailyGoalSessions,
    timerConfig: s.timerConfig,
    onboardingCompleted: s.onboardingCompleted,
  };
}

function applyCloudState(remote: SyncedState) {
  // Per-record LWW merge: newer updatedAt wins, remote tombstones delete
  // local records, remote-only docs are added. Local edits made offline
  // (newer local updatedAt) are kept and pushed on the next sync.
  const localSlice = syncedSliceOf(useAppStore.getState());
  const merged = mergeSyncedState(
    {
      tasks: localSlice.tasks,
      sessionLogs: localSlice.sessionLogs,
      testGoals: localSlice.testGoals,
      templates: localSlice.templates as { id?: string }[] | undefined,
    },
    remote,
    syncMeta,
  );
  syncMeta = merged.meta;

  const patch: Partial<AppState> = {
    tasks: merged.tasks as TaskItem[],
    sessionLogs: merged.sessionLogs as FocusSessionRecord[],
    testGoals: merged.testGoals as UserTestGoal[],
    taskTemplates: (merged.templates as TaskTemplate[]).filter(validateTemplate),
  };
  const st = merged.settings;
  if (st) {
    if (st.locale === 'en' || st.locale === 'ar') patch.locale = st.locale;
    if (st.themeMode === 'system' || st.themeMode === 'light' || st.themeMode === 'dark') {
      patch.themeMode = st.themeMode;
    }
    if (typeof st.seedHex === 'string') patch.seedHex = st.seedHex;
    if (typeof st.dailyGoalSessions === 'number') patch.dailyGoalSessions = st.dailyGoalSessions;
    if (st.timerConfig) patch.timerConfig = st.timerConfig as TimerConfig;
    if (typeof st.onboardingCompleted === 'boolean') {
      patch.onboardingCompleted = st.onboardingCompleted;
    }
  }
  useAppStore.setState(patch);
  persistState(useAppStore.getState());
}

function wipeUserData() {
  localStorage.removeItem(STORAGE_KEY);
  useAppStore.setState({
    tasks: [],
    testGoals: [],
    sessionLogs: [],
    activeTaskId: null,
    streak: {
      currentStreak: 0,
      bestStreak: 0,
      lastActiveDate: null,
      streakFreezes: 0,
      freezeUsedDates: [],
    },
    coins: 0,
    focusPoints: 0,
    inventory: {},
    transactions: [],
    todaySessionsCount: 0,
    completedFocusSessions: 0,
    demoDataLoaded: false,
    timerMode: 'focus',
    isRunning: false,
    targetEndTime: null,
    remainingSeconds: DEFAULT_TIMER_CONFIG.focusDuration,
    migrationChoice: null,
    cloudSyncEnabled: false,
    syncError: null,
  });
}

let previousUid: string | null = null;

/**
 * Adopts the cloud wallet as the coin/FP source of truth and claims any
 * unclaimed group daily/weekly awards. Best-effort: failures are logged,
 * never block the UI.
 */
async function adoptWalletAndClaimAwards(uid: string) {
  try {
    const s = useAppStore.getState();
    const groups = await import('../lib/firebase/groups');
    const wallet = await groups.reconcileWallet(uid, s.coins, s.focusPoints);
    const patch: Partial<AppState> = {};
    if (wallet.coins !== s.coins) patch.coins = wallet.coins;
    if (wallet.focusPoints !== s.focusPoints) patch.focusPoints = wallet.focusPoints;
    if (Object.keys(patch).length > 0) {
      useAppStore.setState(patch);
      persistState(useAppStore.getState());
    }

    const myGroups = await groups.listMyGroups(uid).catch(() => []);
    for (const g of myGroups) {
      await groups.claimGroupAwards(uid, g.id).catch((e) =>
        console.warn('Group award claim failed:', g.id, e),
      );
    }
    // Awards may have raised focusPoints; refresh once.
    const after = await groups.reconcileWallet(uid, 0, 0).catch(() => null);
    if (after && after.focusPoints !== useAppStore.getState().focusPoints) {
      useAppStore.setState({ focusPoints: after.focusPoints });
      persistState(useAppStore.getState());
    }

    // Public board stats refresh each time the member opens the app
    // (this runs on every auth-ready event for signed-in users).
    const pub = await groups.getPublicProfile(uid).catch(() => null);
    const board = await groups.listPublicBoard().catch(() => []);
    const onBoard = board.some((e) => e.uid === uid);
    if (pub && onBoard && (pub.shareMinutes || pub.shareStreak)) {
      const s = useAppStore.getState();
      const week = recentDayKeys(new Date(), 7);
      const weeklyMinutes = s.sessionLogs
        .filter((l) => week.has(dayKey(new Date(l.dateStr + 'T12:00:00'))))
        .reduce((sum, l) => sum + l.durationMinutes, 0);
      await groups.setPublicBoardEntry(uid, {
        uid,
        alias: pub.alias,
        weeklyMinutes: pub.shareMinutes ? weeklyMinutes : 0,
        streak: pub.shareStreak ? s.streak.currentStreak : 0,
        updatedAt: Date.now(),
      }).catch((e) => console.warn('Public board refresh failed:', e));
    }
  } catch (e) {
    console.warn('Wallet/award adoption failed:', e);
  }
}

async function handleAuthUser(user: { uid: string; email: string | null; displayName: string | null } | null) {
  if (!user) {
    const wasSignedIn = previousUid !== null;
    previousUid = null;
    void import('../lib/firebase/cloudSync').then((m) => m.setCloudSyncContext(null, false)).catch(() => {});
    useAppStore.setState({
      user: null,
      authStatus: 'ready',
      cloudSyncEnabled: false,
      migrationChoice: null,
    });
    // Sign-out must not leave the previous user's data on screen.
    if (wasSignedIn) wipeUserData();
    // A cloud pull that was in flight when sign-out happened must not
    // re-apply the previous user's records afterwards.
    if (wasSignedIn) wipeUserData();
    return;
  }

  previousUid = user.uid;
  useAppStore.setState({
    user: { uid: user.uid, email: user.email, displayName: user.displayName },
    authStatus: 'ready',
    syncError: null,
  });

  try {
    // Once the guest->cloud choice is resolved, later sign-ins (including
    // reloads) must not re-prompt: both sides legitimately hold data.
    const sync = await import('../lib/firebase/sync');
    const cloudSync = await import('../lib/firebase/cloudSync');
    if (await sync.isMigrationComplete(user.uid)) {
      const remote = await sync.pullCloudState(user.uid);
      if (useAppStore.getState().user?.uid !== user.uid) return;
      applyCloudState(remote);
      cloudSync.setCloudSyncContext(user.uid, true);
      useAppStore.setState({ cloudSyncEnabled: true, migrationChoice: null });
      void adoptWalletAndClaimAwards(user.uid);
      return;
    }

    const store = useAppStore.getState();
    const localHas = sync.hasMigratableLocalData(syncedSliceOf(store));
    const cloudHas = await sync.cloudHasData(user.uid);
    if (useAppStore.getState().user?.uid !== user.uid) return;

    if (localHas && !cloudHas) {
      cloudSync.setCloudSyncContext(user.uid, false);
      useAppStore.setState({ migrationChoice: 'local-only', cloudSyncEnabled: false });
      return;
    }
    if (localHas && cloudHas) {
      cloudSync.setCloudSyncContext(user.uid, false);
      useAppStore.setState({ migrationChoice: 'both', cloudSyncEnabled: false });
      return;
    }

    const remote = await sync.pullCloudState(user.uid);
    if (useAppStore.getState().user?.uid !== user.uid) return;
    applyCloudState(remote);
    cloudSync.setCloudSyncContext(user.uid, true);
    useAppStore.setState({ cloudSyncEnabled: true, migrationChoice: null });
    void adoptWalletAndClaimAwards(user.uid);
  } catch (e) {
    console.warn('Cloud sync init failed:', e);
    void import('../lib/firebase/cloudSync').then((m) => m.setCloudSyncContext(user.uid, false)).catch(() => {});
    useAppStore.setState({ syncError: 'cloud-sync-failed', cloudSyncEnabled: false });
  }
}

/** Single reminder pass; exported for tests via the DEV debug hook. */
export function runReminderCheck(now: Date = new Date()): void {
  const s = useAppStore.getState();
  const settings = s.reminderSettings;
  if (!settings.enabled || typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
  const candidates = buildReminderCandidates(s.tasks, s.testGoals, now);
  const due = dueReminders(candidates, settings, now);
  if (due.length === 0) return;
  for (const r of due) {
    try {
      new Notification(r.title, { body: r.body, tag: r.id });
    } catch {
      /* notification construction can throw on some platforms */
    }
  }
  s.setReminderSettings(markFired(settings, due.map((d) => d.id), now));
}

// In-app reminder loop: checks every minute while the app is open and
// fires a browser Notification for due goal/test reminders. No push —
// scheduled delivery is not shipped (see DECISIONS.md).
if (typeof window !== 'undefined') {
  setInterval(() => runReminderCheck(), 60_000);
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__fpDebug = { runReminderCheck };

  }
}

if (isFirebaseConfigured()) {
  void import('../lib/firebase/auth')
    .then((m) =>
      m.subscribeAuth((firebaseUser) => {
        void handleAuthUser(
          firebaseUser
            ? {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
              }
            : null,
        );
      }),
    )
    .catch((e) => console.warn('Firebase auth init failed:', e));
}
