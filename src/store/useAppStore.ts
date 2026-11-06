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

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  estimatedSessions: number;
  completedSessions: number;
  minGoal: number;
  maxGoal: number;
  cadence: 'daily' | 'weekly' | 'monthly';
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
  timerConfig: TimerConfig;

  // Tasks & Goals
  tasks: TaskItem[];
  testGoals: UserTestGoal[];

  // Streaks, Coins & Gamification
  streak: StreakState;
  coins: number;
  focusPoints: number;
  inventory: Record<string, number>;
  transactions: CoinTransaction[];

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
  updateTimerConfig: (config: Partial<TimerConfig>) => void;
  setDailyGoalSessions: (goal: number) => void;

  // Task actions
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'completedSessions' | 'isCompleted'>) => void;
  updateTask: (id: string, updates: Partial<TaskItem>) => void;
  deleteTask: (id: string) => void;
  toggleTaskDone: (id: string) => void;
  clearDoneTasks: () => void;

  // Test Goal actions
  addTestGoal: (goal: UserTestGoal) => void;
  updateTestGoal: (id: string, updates: Partial<UserTestGoal>) => void;
  deleteTestGoal: (id: string) => void;

  // Store actions
  purchaseItem: (item: StoreItem) => boolean;

  // Export / Reset
  exportDataJson: () => string;
  resetAllData: () => void;
}

const STORAGE_KEY = 'focus_plan_m3e_v1';

function loadPersistedState(): Partial<AppState> {
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

function persistState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
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
      testGoals: state.testGoals,
      streak: state.streak,
      coins: state.coins,
      focusPoints: state.focusPoints,
      inventory: state.inventory,
      transactions: state.transactions,
      activeTaskId: state.activeTaskId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to persist state:', e);
  }
}

const initialPersisted = loadPersistedState();

const defaultTasks: TaskItem[] = [
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

export const useAppStore = create<AppState>((set, get) => ({
  locale: initialPersisted.locale || 'en',
  themeMode: initialPersisted.themeMode || 'system',
  seedHex: initialPersisted.seedHex || '#2e6b52',
  activeTab: 'focus',
  onboardingCompleted: initialPersisted.onboardingCompleted ?? false,
  showShortcutsModal: false,

  timerMode: 'focus',
  isRunning: false,
  targetEndTime: null,
  remainingSeconds: (initialPersisted.timerConfig?.focusDuration || DEFAULT_TIMER_CONFIG.focusDuration),
  completedFocusSessions: initialPersisted.completedFocusSessions || 0,
  dailyGoalSessions: initialPersisted.dailyGoalSessions || 4,
  todaySessionsCount: initialPersisted.todaySessionsCount || 0,
  activeTaskId: initialPersisted.activeTaskId || 'sample_task_1',
  ambientSound: 'none',
  alarmVolume: 0.7,
  ambientVolume: 0.5,
  timerConfig: initialPersisted.timerConfig || DEFAULT_TIMER_CONFIG,

  tasks: initialPersisted.tasks || defaultTasks,
  testGoals: initialPersisted.testGoals || [
    {
      id: 'default_gat_goal',
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
      id: 'default_sat_goal',
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
  ],

  streak: initialPersisted.streak || {
    currentStreak: 4,
    bestStreak: 7,
    lastActiveDate: getTodayDateString(),
    streakFreezes: 1,
    freezeUsedDates: [],
  },
  coins: initialPersisted.coins ?? 35,
  focusPoints: initialPersisted.focusPoints ?? 12,
  inventory: initialPersisted.inventory || { streak_freeze: 1 },
  transactions: initialPersisted.transactions || [
    { id: 'tx_init', timestamp: Date.now() - 86400000, amount: 15, type: 'earn', reason: 'Welcome focus bonus' },
  ],

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
    const { isRunning, targetEndTime, timerMode, completedFocusSessions, timerConfig, activeTaskId, tasks, streak, todaySessionsCount, coins, focusPoints, alarmVolume } = get();
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
    let newTransactions = get().transactions;

    if (isFocus) {
      newStreak = updateStreakOnSessionComplete(streak, newTodaySessions);
      const coinResult = awardPoints(coins, 1, 'Completed focus session');
      newCoins = coinResult.newCoins;
      newTransactions = [coinResult.transaction, ...newTransactions];

      if (newTodaySessions === 3) {
        const streakBonus = awardPoints(newCoins, 2, 'Maintained daily 3+ streak threshold');
        newCoins = streakBonus.newCoins;
        newTransactions = [streakBonus.transaction, ...newTransactions];
        newFocusPoints += 1;
      }
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
    });

    persistState(get());
    restoreDefaultTitle();

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

  updateTimerConfig: (config) => {
    const timerConfig = { ...get().timerConfig, ...config };
    set({ timerConfig });
    persistState(get());
  },

  setDailyGoalSessions: (dailyGoalSessions) => {
    set({ dailyGoalSessions });
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

  purchaseItem: (item) => {
    const { coins, inventory, transactions } = get();
    const result = processPurchase(coins, inventory, item);
    if (!result) return false;

    let streak = get().streak;
    if (item.id === 'streak_freeze') {
      streak = { ...streak, streakFreezes: streak.streakFreezes + 1 };
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
    };
    return JSON.stringify(exportable, null, 2);
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
    });
  },
}));
