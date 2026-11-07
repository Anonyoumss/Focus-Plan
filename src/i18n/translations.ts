export type Locale = 'en' | 'ar';

export interface Translations {
  appName: string;
  tagline: string;
  nav: {
    focus: string;
    plan: string;
    tests: string;
    progress: string;
    friends: string;
    store: string;
    settings: string;
    more: string;
    terms: string;
    privacy: string;
  };
  timer: {
    focus: string;
    shortBreak: string;
    longBreak: string;
    start: string;
    pause: string;
    skip: string;
    reset: string;
    sessionNumber: string;
    dailyTarget: string;
    currentTask: string;
    noActiveTask: string;
    selectTask: string;
    completedRounds: string;
    timeRemaining: string;
    wakeLockActive: string;
    ambientSound: string;
    alarmSound: string;
    volume: string;
  };
  tasks: {
    title: string;
    addTask: string;
    editTask: string;
    taskName: string;
    category: string;
    estimatedPomodoros: string;
    completedPomodoros: string;
    minGoal: string;
    maxGoal: string;
    cadence: string;
    cadenceDaily: string;
    cadenceWeekly: string;
    cadenceMonthly: string;
    cadenceHourly: string;
    notes: string;
    markDone: string;
    delete: string;
    clearDone: string;
    noTasks: string;
    save: string;
    cancel: string;
    reorderHint: string;
    moveUp: string;
    moveDown: string;
  };
  categories: {
    work: string;
    school: string;
    extracurriculars: string;
    study: string;
    standardizedTests: string;
    personal: string;
  };
  tests: {
    title: string;
    catalogTitle: string;
    myGoals: string;
    addTestGoal: string;
    testName: string;
    testDate: string;
    targetScore: string;
    currentScore: string;
    scoreScale: string;
    sections: string;
    hoursPerWeek: string;
    sessionsPerWeek: string;
    daysRemaining: string;
    verifyNotice: string;
    verifyOnOfficialSite: string;
    customTest: string;
    logScore: string;
    scoreLoopPrompt: string;
    scoreHistory: string;
  };
  streaks: {
    streakTitle: string;
    dayStreak: string;
    bestStreak: string;
    streakRuleNotice: string;
    activeToday: string;
    sessionsToday: string;
    goalMet: string;
    streakFreezeAvailable: string;
    streakFreezes: string;
    freezeNotice: string;
  };
  badges: {
    title: string;
    overachievement: string;
    overachievementDesc: string;
    streakMilestone: string;
    hoursMilestone: string;
    firstScore: string;
    scoreImproved: string;
    groupWinner: string;
    locked: string;
    unlocked: string;
  };
  store: {
    title: string;
    coinsBalance: string;
    focusPoints: string;
    items: string;
    streakFreezeTitle: string;
    streakFreezeDesc: string;
    breakMultiplierTitle: string;
    breakMultiplierDesc: string;
    colorThemeTitle: string;
    colorThemeDesc: string;
    price: string;
    buy: string;
    owned: string;
    insufficientCoins: string;
    purchasedSuccess: string;
  };
  friends: {
    title: string;
    createGroup: string;
    groupName: string;
    joinByCode: string;
    enterCode: string;
    shareLink: string;
    copyCode: string;
    copied: string;
    groupTasks: string;
    weeklyLeaderboard: string;
    dailyWinnerNotice: string;
    weeklyWinnerNotice: string;
    publicLeaderboard: string;
    publicOptIn: string;
    rank: string;
    member: string;
    focusTime: string;
  };
  settings: {
    title: string;
    appearance: string;
    themeMode: string;
    system: string;
    light: string;
    dark: string;
    seedPalette: string;
    language: string;
    english: string;
    arabic: string;
    timerDurations: string;
    focusDuration: string;
    shortBreakDuration: string;
    longBreakDuration: string;
    longBreakInterval: string;
    autoStartBreaks: string;
    autoStartPomodoros: string;
    notifications: string;
    enableNotifications: string;
    quietHours: string;
    integrations: string;
    googleTasks: string;
    googleCalendar: string;
    privacy: string;
    publicProfileVisible: string;
    exportData: string;
    downloadCsv: string;
    downloadJson: string;
    account: string;
    guestMode: string;
    signInGoogle: string;
    signOut: string;
    signedInAs: string;
    cloudNotConfigured: string;
    syncActive: string;
    syncPaused: string;
    syncFailed: string;
    demoDataTitle: string;
    demoDataDescription: string;
    loadDemoData: string;
    demoDataLoaded: string;
    clearDemoData: string;
  };
  migration: {
    title: string;
    bodyLocal: string;
    bodyBoth: string;
    import: string;
    useCloud: string;
    later: string;
  };
  onboarding: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    step1Title: string;
    step1Subtitle: string;
    step2Title: string;
    step2Subtitle: string;
    step3Title: string;
    step3Subtitle: string;
    continue: string;
    skip: string;
    finish: string;
  };
  shortcuts: {
    title: string;
    space: string;
    reset: string;
    skip: string;
    modes: string;
    newTask: string;
    help: string;
    close: string;
  };
  legal: {
    termsTitle: string;
    privacyTitle: string;
    lastUpdated: string;
    backToApp: string;
  };
  analytics: {
    title: string;
    subtitle: string;
    day: string;
    week: string;
    month: string;
    year: string;
    allTime: string;
    chartView: string;
    barChart: string;
    lineChart: string;
    categoryBreakdown: string;
    heatmap: string;
    tableView: string;
    totalHours: string;
    totalSessions: string;
    dailyAvg: string;
    peakDay: string;
    completionRate: string;
    estimatedVsActual: string;
    categoryDistribution: string;
    activityHeatmapTitle: string;
    less: string;
    more: string;
    date: string;
    minutes: string;
    sessions: string;
    topCategory: string;
    task: string;
  };
  reports: {
    weeklyReport: string;
    weekSelector: string;
    currentWeek: string;
    lastWeek: string;
    twoWeeksAgo: string;
    downloadCsv: string;
    printPdf: string;
    reportSummary: string;
    studyEffort: string;
    testPrepOverview: string;
    taskCompletionStatus: string;
    dailyBreakdown: string;
    streakSummary: string;
    closeReport: string;
  };
  scoreLoop: {
    title: string;
    subtitle: string;
    targetScoreLine: string;
    actualScoreLine: string;
    gapAnalysis: string;
    sectionBreakdown: string;
    target: string;
    actual: string;
    gap: string;
    gapSurplus: string;
    gapDeficit: string;
    adaptiveRecommendations: string;
    recommendationText: string;
    applyRecommendation: string;
    appliedSuccess: string;
    logNewAttempt: string;
    historyTitle: string;
    noHistory: string;
  };
  landing: {
    headline: string;
    subheadline: string;
    cta: string;
    openApp: string;
    timerTitle: string;
    timerDesc: string;
    goalsTitle: string;
    goalsDesc: string;
    streakTitle: string;
    streakDesc: string;
    testsTitle: string;
    testsDesc: string;
    testsCta: string;
    verifyNote: string;
    privacyFirst: string;
  };
  invite: {
    title: string;
    body: string;
    codeLabel: string;
    backCta: string;
  };
}

export const TRANSLATIONS: Record<Locale, Translations> = {
  en: {
    appName: 'Focus Plan M3E',
    tagline: 'Material 3 Expressive Pomodoro & Study Tracker',
    nav: {
      focus: 'Focus',
      plan: 'Plan',
      tests: 'Tests',
      progress: 'Progress',
      friends: 'Friends',
      store: 'Store',
      settings: 'Settings',
      more: 'More',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
    },
    timer: {
      focus: 'Focus',
      shortBreak: 'Short Break',
      longBreak: 'Long Break',
      start: 'Start Focus',
      pause: 'Pause Timer',
      skip: 'Skip Mode',
      reset: 'Reset Timer',
      sessionNumber: 'Session',
      dailyTarget: 'Daily Goal',
      currentTask: 'Active Task',
      noActiveTask: 'No Task Selected',
      selectTask: 'Choose a task to track your time',
      completedRounds: 'Completed Today',
      timeRemaining: 'Remaining',
      wakeLockActive: 'Screen Kept Awake',
      ambientSound: 'Ambient Background',
      alarmSound: 'Alarm Chime',
      volume: 'Volume',
    },
    tasks: {
      title: 'Tasks & Topics',
      addTask: 'New Task',
      editTask: 'Edit Task',
      taskName: 'Task Name',
      category: 'Category',
      estimatedPomodoros: 'Estimated Sessions',
      completedPomodoros: 'Completed',
      minGoal: 'Minimum Goal',
      maxGoal: 'Maximum Goal',
      cadence: 'Repeat Cadence',
      cadenceDaily: 'Daily',
      cadenceWeekly: 'Weekly',
      cadenceMonthly: 'Monthly',
      cadenceHourly: 'Hourly',
      notes: 'Notes or Syllabus details',
      markDone: 'Mark Complete',
      delete: 'Delete Task',
      clearDone: 'Clear Finished',
      noTasks: 'No tasks scheduled yet. Add your first goal to begin.',
      save: 'Save Task',
      cancel: 'Cancel',
      reorderHint: 'Drag or reorder tasks in priority sequence',
      moveUp: 'Move task up',
      moveDown: 'Move task down',
    },
    categories: {
      work: 'Work',
      school: 'School',
      extracurriculars: 'Extracurriculars',
      study: 'Study',
      standardizedTests: 'Standardized Tests',
      personal: 'Personal',
    },
    tests: {
      title: 'Standardized Test Goals',
      catalogTitle: 'Exam Catalog',
      myGoals: 'My Target Tests',
      addTestGoal: 'Add Test Goal',
      testName: 'Test Name',
      testDate: 'Exam Date',
      targetScore: 'Target Score',
      currentScore: 'Baseline Score',
      scoreScale: 'Score Range',
      sections: 'Sections & Breakdown',
      hoursPerWeek: 'Target Hours / Week',
      sessionsPerWeek: 'Weekly Pomodoros',
      daysRemaining: 'Days Left',
      verifyNotice: 'Please verify exact test dates and registration deadlines on the official testing portal.',
      verifyOnOfficialSite: 'Verify on official site',
      customTest: 'Custom Exam',
      logScore: 'Log Real Exam Score',
      scoreLoopPrompt: 'Have you completed your test? Enter your real scores to review progress and adjust your next plan.',
      scoreHistory: 'Score History',
    },
    streaks: {
      streakTitle: 'Focus Streak',
      dayStreak: 'Day Streak',
      bestStreak: 'Best Streak',
      streakRuleNotice: 'Complete at least 3 Pomodoros daily to advance your streak.',
      activeToday: 'Streak Maintained Today',
      sessionsToday: 'Sessions Completed Today',
      goalMet: 'Target Reached',
      streakFreezeAvailable: 'Streak Freeze Equipped',
      streakFreezes: 'Streak Freezes',
      freezeNotice: 'Streak freezes protect your streak if a day is missed.',
    },
    badges: {
      title: 'Achievements & Badges',
      overachievement: 'Double Output',
      overachievementDesc: 'Completed 200% of your daily session goal',
      streakMilestone: 'Consistent Scholar',
      hoursMilestone: 'Master of Time',
      firstScore: 'First Trial Logged',
      scoreImproved: 'Positive Trajectory',
      groupWinner: 'Study Circle Champion',
      locked: 'In Progress',
      unlocked: 'Earned',
    },
    store: {
      title: 'Focus Rewards Store',
      coinsBalance: 'Focus Coins Balance',
      focusPoints: 'Focus Points',
      items: 'Available Perks',
      streakFreezeTitle: 'Streak Freeze',
      streakFreezeDesc: 'Shields your streak from resetting if you miss a day.',
      breakMultiplierTitle: 'Break Multiplier',
      breakMultiplierDesc: 'Unlocks a restful 30-minute long break after reaching 8 daily sessions.',
      colorThemeTitle: 'Palette Seed Token',
      colorThemeDesc: 'Unlocks custom tonal palette extraction and luxury themes.',
      price: 'Coins',
      buy: 'Redeem Item',
      owned: 'Equipped',
      insufficientCoins: 'Need more Focus Coins to redeem',
      purchasedSuccess: 'Item redeemed and added to your inventory',
    },
    friends: {
      title: 'Study Circles & Groups',
      createGroup: 'Create Study Circle',
      groupName: 'Circle Name',
      joinByCode: 'Join With Code',
      enterCode: 'Enter 6-character code',
      shareLink: 'Share Circle Link',
      copyCode: 'Copy Code',
      copied: 'Code copied to clipboard',
      groupTasks: 'Shared Circle Goal',
      weeklyLeaderboard: 'Weekly Standings',
      dailyWinnerNotice: 'Daily leader earns 1 Focus Point',
      weeklyWinnerNotice: 'Weekly champion earns 7 bonus Focus Points',
      publicLeaderboard: 'Opt-in Public Leaderboard',
      publicOptIn: 'Display my alias and focus hours on the public leaderboard',
      rank: 'Rank',
      member: 'Member',
      focusTime: 'Focus Minutes',
    },
    settings: {
      title: 'App Settings',
      appearance: 'Appearance & Theme',
      themeMode: 'Theme Mode',
      system: 'System Default',
      light: 'Light',
      dark: 'Dark',
      seedPalette: 'Seed Color Palette',
      language: 'Language',
      english: 'English',
      arabic: 'العربية (Arabic)',
      timerDurations: 'Timer Durations (Minutes)',
      focusDuration: 'Focus Time',
      shortBreakDuration: 'Short Break',
      longBreakDuration: 'Long Break',
      longBreakInterval: 'Sessions Between Long Breaks',
      autoStartBreaks: 'Auto-start Breaks',
      autoStartPomodoros: 'Auto-start Focus Sessions',
      notifications: 'Notifications & Audio',
      enableNotifications: 'Web Notifications',
      quietHours: 'Quiet Hours (Do Not Disturb)',
      integrations: 'Cloud & Workspace Integrations',
      googleTasks: 'Google Tasks Sync',
      googleCalendar: 'Google Calendar Study Blocks',
      privacy: 'Privacy & Sharing',
      publicProfileVisible: 'Allow group members to view focus hours',
      exportData: 'Export Study Data',
      downloadCsv: 'Download CSV Summary',
      downloadJson: 'Download JSON Backup',
      account: 'Account & Synchronization',
      guestMode: 'Guest Mode (Local Storage Only)',
      signInGoogle: 'Sign In with Google',
      signOut: 'Sign Out',
      signedInAs: 'Signed in as',
      cloudNotConfigured: 'Cloud sync is not configured for this build. Your data stays in this browser.',
      syncActive: 'Cloud sync is on. Tasks, sessions, test goals and settings sync to your account.',
      syncPaused: 'Cloud sync is paused. Sign in again to merge your data.',
      syncFailed: 'Cloud sync failed. Check your connection and try again.',
      demoDataTitle: 'Demo Data',
      demoDataDescription: 'Load sample tasks, test goals, a streak, coins, and session history to explore the app. This is clearly labeled demo content and can be removed at any time.',
      loadDemoData: 'Load demo data',
      demoDataLoaded: 'Demo data is currently loaded in this browser.',
      clearDemoData: 'Remove demo data',
    },
    migration: {
      title: 'Merge your data',
      bodyLocal: 'We found study data on this device and your cloud account is empty. Import it so it syncs across your devices?',
      bodyBoth: 'This device and your cloud account both have study data. Choose which one to keep. The other stays untouched on its side only if you pick later.',
      import: 'Import device data',
      useCloud: 'Use cloud data',
      later: 'Decide later',
    },
    onboarding: {
      welcomeTitle: 'Welcome to Focus Plan M3E',
      welcomeSubtitle: 'Material 3 Expressive Pomodoro and test preparation engineered for deep focus.',
      step1Title: 'Select Your Palette',
      step1Subtitle: 'Choose a soothing tonal palette tailored to your visual environment.',
      step2Title: 'Set Your First Goal',
      step2Subtitle: 'Select an exam target or a deep work topic to initiate your cadence.',
      step3Title: 'Study Circles',
      step3Subtitle: 'Create or join a study group with friends to build mutual momentum.',
      continue: 'Continue',
      skip: 'Skip Setup',
      finish: 'Start Focusing',
    },
    shortcuts: {
      title: 'Keyboard Shortcuts',
      space: 'Start / Pause Timer',
      reset: 'Reset Timer to Mode Start',
      skip: 'Skip Current Timer Mode',
      modes: 'Switch to Focus (1), Short Break (2), Long Break (3)',
      newTask: 'Open New Task Modal',
      help: 'Toggle Keyboard Shortcuts',
      close: 'Dismiss',
    },
    legal: {
      termsTitle: 'Terms of Service',
      privacyTitle: 'Privacy Policy',
      lastUpdated: 'Last Updated: November 2026',
      backToApp: 'Back to Timer',
    },
    analytics: {
      title: 'Study Telemetry & Trends',
      subtitle: 'In-depth focus analytics, category distributions, and daily momentum.',
      day: 'Day',
      week: 'Week',
      month: 'Month',
      year: 'Year',
      allTime: 'All Time',
      chartView: 'Chart View',
      barChart: 'Bar Chart',
      lineChart: 'Trend Line',
      categoryBreakdown: 'Categories',
      heatmap: 'Activity Grid',
      tableView: 'Table View',
      totalHours: 'Total Focus Time',
      totalSessions: 'Completed Sessions',
      dailyAvg: 'Daily Average',
      peakDay: 'Peak Productive Day',
      completionRate: 'Task Plan Accuracy',
      estimatedVsActual: 'Estimated vs Actual Sessions',
      categoryDistribution: 'Category Distribution',
      activityHeatmapTitle: 'Consistency Heatmap',
      less: 'Less',
      more: 'More',
      date: 'Date',
      minutes: 'Minutes',
      sessions: 'Sessions',
      topCategory: 'Top Category',
      task: 'Task',
    },
    reports: {
      weeklyReport: 'Weekly Focus Report',
      weekSelector: 'Select Week',
      currentWeek: 'Current Week',
      lastWeek: 'Previous Week',
      twoWeeksAgo: '2 Weeks Ago',
      downloadCsv: 'Export CSV Report',
      printPdf: 'Print / Save PDF',
      reportSummary: 'Weekly Summary',
      studyEffort: 'Study Effort by Subject',
      testPrepOverview: 'Standardized Test Readiness',
      taskCompletionStatus: 'Planned Tasks Status',
      dailyBreakdown: 'Daily Session Breakdown',
      streakSummary: 'Habit Consistency',
      closeReport: 'Close Report',
    },
    scoreLoop: {
      title: 'Score Loop & Gap Analysis',
      subtitle: 'Evaluate trial performance against target scores and generate tailored study adjustments.',
      targetScoreLine: 'Target Benchmark',
      actualScoreLine: 'Logged Score',
      gapAnalysis: 'Per-Section Gap Analysis',
      sectionBreakdown: 'Section Benchmark Breakdown',
      target: 'Target',
      actual: 'Actual',
      gap: 'Gap',
      gapSurplus: 'Surplus',
      gapDeficit: 'Deficit',
      adaptiveRecommendations: 'Adaptive Study Recommendation',
      recommendationText: 'Based on your recent mock exam, we recommend increasing your weekly prep sessions for the sections with the largest point gap.',
      applyRecommendation: 'Apply Target Adjustment',
      appliedSuccess: 'Plan adjusted! Your weekly target pomodoros have been updated.',
      logNewAttempt: 'Log New Mock Exam Attempt',
      historyTitle: 'Historical Score Progression',
      noHistory: 'No prior trial attempts logged yet. Record your first attempt below.',
    },
    landing: {
      headline: 'Plan your focus. Track your progress.',
      subheadline: 'A pomodoro timer with a study layer built for goals, streaks, and real test scores.',
      cta: 'Start focusing',
      openApp: 'Open app',
      timerTitle: 'A timer that keeps the real state',
      timerDesc: 'Focus, short break, and long break modes with session counting and ambient sound. This preview is live; what you start here is what the app sees.',
      goalsTitle: 'Tasks with goals, not just checkboxes',
      goalsDesc: 'Group work into categories, set minimum and maximum session goals, and choose how often each task repeats. Create your first task below; it saves to this browser immediately.',
      streakTitle: 'Streaks that reward showing up',
      streakDesc: 'Three or more finished pomodoros in a day keep your streak alive. Your current numbers are on the right, computed from your real sessions.',
      testsTitle: 'Built for standardized tests',
      testsDesc: 'Saudi GAT, SAAT, STEP, KFUPM Early SAAT, SAT, ACT, IELTS, TOEFL, Duolingo, and custom goals with per-section targets and a score loop.',
      testsCta: 'Browse the test catalog',
      verifyNote: 'Catalog details come from official sources where confirmed. Anything unverified is labeled verify on the official site.',
      privacyFirst: 'Local first. Your data stays in this browser until you choose otherwise.',
    },
    invite: {
      title: 'Group invites are not open yet',
      body: 'Friend groups and invite links arrive with the social milestone. Nothing was shared or stored by opening this link.',
      codeLabel: 'Invite code',
      backCta: 'Back to the app',
    },
  },
  ar: {
    appName: 'فوكس بلان M3E',
    tagline: 'مؤقت بومودورو وتتبع دراسي بنمط ماتيريال 3 التعبيري',
    nav: {
      focus: 'التركيز',
      plan: 'الخطة',
      tests: 'الاختبارات',
      progress: 'التقدم',
      friends: 'الأصدقاء',
      store: 'المتجر',
      settings: 'الإعدادات',
      more: 'المزيد',
      terms: 'شروط الخدمة',
      privacy: 'سياسة الخصوصية',
    },
    timer: {
      focus: 'التركيز',
      shortBreak: 'استراحة قصيرة',
      longBreak: 'استراحة طويلة',
      start: 'بدء التركيز',
      pause: 'إيقاف مؤقت',
      skip: 'تخطي الجلسة',
      reset: 'إعادة التعيين',
      sessionNumber: 'الجلسة',
      dailyTarget: 'الهدف اليومي',
      currentTask: 'المهمة النشطة',
      noActiveTask: 'لم يتم اختيار مهمة',
      selectTask: 'اختر مهمة لتتبع وقتك وإنجازك',
      completedRounds: 'المكتمل اليوم',
      timeRemaining: 'المتبقي',
      wakeLockActive: 'الشاشة قيد التشغيل الدائم',
      ambientSound: 'الصوت المحيطي المهدئ',
      alarmSound: 'جرس التنبيه',
      volume: 'مستوى الصوت',
    },
    tasks: {
      title: 'المهام والموضوعات',
      addTask: 'مهمة جديدة',
      editTask: 'تعديل المهمة',
      taskName: 'اسم المهمة',
      category: 'التصنيف',
      estimatedPomodoros: 'الجلسات المقدرة',
      completedPomodoros: 'المكتمل',
      minGoal: 'الحد الأدنى للجلسات',
      maxGoal: 'الحد الأقصى للجلسات',
      cadence: 'دورية التكرار',
      cadenceDaily: 'يومياً',
      cadenceWeekly: 'أسبوعياً',
      cadenceMonthly: 'شهرياً',
      cadenceHourly: 'كل ساعة',
      notes: 'ملاحظات وتفاصيل المنهج',
      markDone: 'اكتمال المهمة',
      delete: 'حذف المهمة',
      clearDone: 'مسح المكتملة',
      noTasks: 'لا توجد مهام حالياً. أضف هدفك الأول للانطلاق.',
      save: 'حفظ المهمة',
      cancel: 'إلغاء',
      reorderHint: 'اسحب المهام لترتيبها حسب الأولوية',
      moveUp: 'تحريك المهمة للأعلى',
      moveDown: 'تحريك المهمة للأسفل',
    },
    categories: {
      work: 'العمل',
      school: 'المدرسة',
      extracurriculars: 'الأنشطة الإضافية',
      study: 'المذاكرة',
      standardizedTests: 'الاختبارات المعيارية',
      personal: 'شخصي',
    },
    tests: {
      title: 'أهداف الاختبارات المعيارية',
      catalogTitle: 'دليل الاختبارات',
      myGoals: 'اختباراتي المستهدفة',
      addTestGoal: 'إضافة هدف اختبار',
      testName: 'اسم الاختبار',
      testDate: 'تاريخ الاختبار',
      targetScore: 'الدرجة المستهدفة',
      currentScore: 'الدرجة الحالية',
      scoreScale: 'نطاق الدرجات',
      sections: 'الأقسام والمعايير',
      hoursPerWeek: 'الساعات المستهدفة أسبوعياً',
      sessionsPerWeek: 'جلسات البومودورو الأسبوعية',
      daysRemaining: 'الأيام المتبقية',
      verifyNotice: 'يرجى مراجعة وتأكيد مواعيد الاختبارات والتسجيل الرسمية عبر موقع الجهة المنظمة للاختبار.',
      verifyOnOfficialSite: 'تحقق من الموقع الرسمي',
      customTest: 'اختبار مخصص',
      logScore: 'تسجيل الدرجة الفعلية',
      scoreLoopPrompt: 'هل انتهيت من اختبارك؟ أدخل درجاتك الحقيقية لمقارنة تقدمك وتعديل الخطة القادمة.',
      scoreHistory: 'سجل الدرجات',
    },
    streaks: {
      streakTitle: 'سلسلة التركيز',
      dayStreak: 'أيام متتالية',
      bestStreak: 'أفضل سلسلة',
      streakRuleNotice: 'أنجز 3 جلسات بومودورو يومياً على الأقل للحفاظ على السلسلة.',
      activeToday: 'تم الحفاظ على السلسلة اليوم',
      sessionsToday: 'الجلسات المكتملة اليوم',
      goalMet: 'تم تحقيق الهدف',
      streakFreezeAvailable: 'تجميد السلسلة مفعل',
      streakFreezes: 'مرات تجميد السلسلة',
      freezeNotice: 'يحمي تجميد السلسلة تقدمك إذا فاتك يوم دون إكمال الجلسات.',
    },
    badges: {
      title: 'الإنجازات والأوسمة',
      overachievement: 'إنجاز مضاعف',
      overachievementDesc: 'إكمال 200% من هدف الجلسات اليومي',
      streakMilestone: 'الباحث المتفاني',
      hoursMilestone: 'سيد إدارة الوقت',
      firstScore: 'تسجيل المحاولة الأولى',
      scoreImproved: 'مسار تصاعدي متميز',
      groupWinner: 'بطل حلقة المذاكرة',
      locked: 'قيد التقدم',
      unlocked: 'تم الحصول عليه',
    },
    store: {
      title: 'متجر مكافآت التركيز',
      coinsBalance: 'رصيد عملات التركيز',
      focusPoints: 'نقاط التركيز',
      items: 'المكافآت المتاحة',
      streakFreezeTitle: 'تجميد السلسلة',
      streakFreezeDesc: 'يحمي سلسلتك من التصفير في حال عدم المذاكرة ليوم واحد.',
      breakMultiplierTitle: 'مضاعف الاستراحة',
      breakMultiplierDesc: 'يمنحك استراحة طويلة لمدة 30 دقيقة عند إتمام 8 جلسات في يوم واحد.',
      colorThemeTitle: 'رمز لوحة الألوان',
      colorThemeDesc: 'يفتح لك استخراج لوحات ألوان حصرية من الصور والتدرجات الراقية.',
      price: 'عملة',
      buy: 'استبدال',
      owned: 'مملوك',
      insufficientCoins: 'تحتاج للمزيد من عملات التركيز للاستبدال',
      purchasedSuccess: 'تم شراء العنصر بنجاح وإضافته إلى حقيبتك',
    },
    friends: {
      title: 'حلقات المذاكرة والأصدقاء',
      createGroup: 'إنشاء حلقة مذاكرة',
      groupName: 'اسم الحلقة',
      joinByCode: 'انضمام بواسطة رمز',
      enterCode: 'أدخل الرمز المكون من 6 خانات',
      shareLink: 'مشاركة رابط الحلقة',
      copyCode: 'نسخ الرمز',
      copied: 'تم نسخ الرمز إلى الحافظة',
      groupTasks: 'المهمة المشتركة للحلقة',
      weeklyLeaderboard: 'صدارة الأسبوع',
      dailyWinnerNotice: 'يحصل متصدر اليوم على نقطة تركيز واحدة',
      weeklyWinnerNotice: 'يحصل بطل الأسبوع على 7 نقاط تركيز إضافية',
      publicLeaderboard: 'لوحة الصدارة العامة (اختياري)',
      publicOptIn: 'إظهار اسمي المستعار وساعات تركيزي على لوحة الصدارة العامة',
      rank: 'الترتيب',
      member: 'العضو',
      focusTime: 'دقائق التركيز',
    },
    settings: {
      title: 'إعدادات التطبيق',
      appearance: 'المظهر والسمات',
      themeMode: 'نمط العرض',
      system: 'حسب النظام',
      light: 'فاتح',
      dark: 'داكن',
      seedPalette: 'لوحة الألوان الأساسية',
      language: 'اللغة',
      english: 'English (الإنجليزية)',
      arabic: 'العربية',
      timerDurations: 'مدد المؤقت (بالدقائق)',
      focusDuration: 'مدة التركيز',
      shortBreakDuration: 'استراحة قصيرة',
      longBreakDuration: 'استراحة طويلة',
      longBreakInterval: 'الجلسات بين كل استراحة طويلة',
      autoStartBreaks: 'بدء الاستراحة تلقائياً',
      autoStartPomodoros: 'بدء جلسات التركيز تلقائياً',
      notifications: 'الإشعارات والأصوات',
      enableNotifications: 'إشعارات المتصفح',
      quietHours: 'أوقات الهدوء (عدم الإزعاج)',
      integrations: 'التكامل السحابي ومنصة جوجل',
      googleTasks: 'مزامنة مهام جوجل (Google Tasks)',
      googleCalendar: 'جدولة جلسات التقويم (Google Calendar)',
      privacy: 'الخصوصية والمشاركة',
      publicProfileVisible: 'السماح للأصدقاء بمشاهدة ساعات تركيزي',
      exportData: 'تصدير البيانات الدراسية',
      downloadCsv: 'تنزيل ملخص CSV',
      downloadJson: 'تنزيل نسخة احتياطية JSON',
      account: 'الحساب والمزامنة',
      guestMode: 'وضع الضيف (حفظ محلي فقط)',
      signInGoogle: 'تسجيل الدخول عبر Google',
      signOut: 'تسجيل الخروج',
      signedInAs: 'تم تسجيل الدخول كـ',
      cloudNotConfigured: 'المزامنة السحابية غير مهيأة في هذا الإصدار. تبقى بياناتك في هذا المتصفح.',
      syncActive: 'المزامنة السحابية مفعّلة. تتم مزامنة المهام والجلسات وأهداف الاختبارات والإعدادات مع حسابك.',
      syncPaused: 'المزامنة السحابية متوقفة. سجّل الدخول مجددًا لدمج بياناتك.',
      syncFailed: 'فشلت المزامنة السحابية. تحقق من الاتصال وحاول مجددًا.',
      demoDataTitle: 'بيانات تجريبية',
      demoDataDescription: 'حمّل مهاماً وأهداف اختبارات وسلسلة عملات وسجلات جلسات تجريبية لاستكشاف التطبيق. هذا محتوى تجريبي موسوم بوضوح ويمكن إزالته في أي وقت.',
      loadDemoData: 'تحميل بيانات تجريبية',
      demoDataLoaded: 'البيانات التجريبية محمّلة حالياً في هذا المتصفح.',
      clearDemoData: 'إزالة البيانات التجريبية',
    },
    migration: {
      title: 'دمج بياناتك',
      bodyLocal: 'وجدنا بيانات دراسة على هذا الجهاز وحسابك السحابي فارغ. هل تريد استيرادها لتتم مزامنتها عبر أجهزتك؟',
      bodyBoth: 'يوجد بيانات دراسة على هذا الجهاز وفي حسابك السحابي. اختر البيانات التي تريد الاحتفاظ بها.',
      import: 'استيراد بيانات الجهاز',
      useCloud: 'استخدام البيانات السحابية',
      later: 'لاحقًا',
    },
    onboarding: {
      welcomeTitle: 'أهلاً بك في فوكس بلان M3E',
      welcomeSubtitle: 'مؤقت بومودورو وإدارة اختبارات بنمط ماتيريال 3 التعبيري لتحقيق أعلى درجات التركيز.',
      step1Title: 'اختر لوحة الألوان',
      step1Subtitle: 'حدد التدرج اللوني المريح لعينيك ليتكيف التطبيق معه بانسيابية.',
      step2Title: 'حدد هدفك الدراسي الأول',
      step2Subtitle: 'اختر اختبارك القادم أو موضوع عملك العميق لبدء وتيرة الإنجاز.',
      step3Title: 'حلقات المذاكرة',
      step3Subtitle: 'أنشئ أو انضم لمجموعة دراسية مع زملائك لتحفيز مستمر.',
      continue: 'متابعة',
      skip: 'تخطي الإعداد',
      finish: 'ابدأ التركيز الآن',
    },
    shortcuts: {
      title: 'اختصارات لوحة المفاتيح',
      space: 'بدء / إيقاف المؤقت مؤقتاً',
      reset: 'إعادة تعيين المؤقت إلى البداية',
      skip: 'تخطي وضع المؤقت الحالي',
      modes: 'التبديل إلى تركيز (1)، استراحة قصيرة (2)، استراحة طويلة (3)',
      newTask: 'فتح نافذة إضافة مهمة جديدة',
      help: 'إظهار نافذة اختصارات المفاتيح',
      close: 'إغلاق',
    },
    legal: {
      termsTitle: 'شروط الخدمة',
      privacyTitle: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث: نوفمبر 2026',
      backToApp: 'العودة للمؤقت',
    },
    analytics: {
      title: 'إحصائيات التركيز والتحليلات',
      subtitle: 'تحليلات تفصيلية لساعات التركيز، توزيع الأقسام، ومعدلات الانتظام اليومية.',
      day: 'يوم',
      week: 'أسبوع',
      month: 'شهر',
      year: 'سنة',
      allTime: 'كل الفترات',
      chartView: 'طريقة العرض',
      barChart: 'أعمدة بيانية',
      lineChart: 'خط الاتجاه',
      categoryBreakdown: 'التصنيفات',
      heatmap: 'مصفوفة النشاط',
      tableView: 'عرض جدولي',
      totalHours: 'إجمالي ساعات التركيز',
      totalSessions: 'الجلسات المكتملة',
      dailyAvg: 'المعدل اليومي',
      peakDay: 'اليوم الأكثر إنتاجية',
      completionRate: 'دقة خطة المهام',
      estimatedVsActual: 'الجلسات المتوقعة مقابل الفعلية',
      categoryDistribution: 'توزيع فئات التركيز',
      activityHeatmapTitle: 'مصفوفة الانتظام اليومي',
      less: 'أقل',
      more: 'أكثر',
      date: 'التاريخ',
      minutes: 'الدقائق',
      sessions: 'الجلسات',
      topCategory: 'المجال الأبرز',
      task: 'المهمة',
    },
    reports: {
      weeklyReport: 'التقرير الأسبوعي للتركيز',
      weekSelector: 'اختر الأسبوع',
      currentWeek: 'الأسبوع الحالي',
      lastWeek: 'الأسبوع الماضي',
      twoWeeksAgo: 'قبل أسبوعين',
      downloadCsv: 'تصدير تقرير CSV',
      printPdf: 'طباعة / حفظ كملف PDF',
      reportSummary: 'ملخص الأسبوع',
      studyEffort: 'المجهود الدراسي حسب المجال',
      testPrepOverview: 'جاهزية الاختبارات المعيارية',
      taskCompletionStatus: 'حالة المهام المجدولة',
      dailyBreakdown: 'تفصيل الجلسات اليومية',
      streakSummary: 'انتظام العادات',
      closeReport: 'إغلاق التقرير',
    },
    scoreLoop: {
      title: 'حلقة مراجعة الدرجات وتحليل الفجوات',
      subtitle: 'قياس درجات الاختبار التجريبي مقارنة بالدرجة المستهدفة واقتراح التعديلات الدراسية.',
      targetScoreLine: 'الهدف المستهدف',
      actualScoreLine: 'الدرجة المسجلة',
      gapAnalysis: 'تحليل الفجوة لكل قسم',
      sectionBreakdown: 'تفصيل معايير الأقسام',
      target: 'المستهدف',
      actual: 'الفعلي',
      gap: 'الفارق',
      gapSurplus: 'فائض',
      gapDeficit: 'عجز',
      adaptiveRecommendations: 'التوصيات الدراسية التكيفية',
      recommendationText: 'بناءً على نتائج اختبارك التجريبي الأخير، نوصي بزيادة جلسات التحضير الأسبوعية للأقسام ذات الفجوة الأكبر.',
      applyRecommendation: 'اعتماد تعديل الخطة',
      appliedSuccess: 'تم تعديل الخطة! جرى تحديث عدد جلسات البومودورو الأسبوعية المستهدفة.',
      logNewAttempt: 'تسجيل اختبار تجريبي جديد',
      historyTitle: 'سجل تتبع الدرجات السابقة',
      noHistory: 'لا توجد محاولات تجريبية مسجلة حتى الآن. سجّل نتيجتك الأولى أدناه.',
    },
    landing: {
      headline: 'خطط لتركيزك. تتبّع تقدمك.',
      subheadline: 'مؤقت بومودورو بطبقة دراسية مبنية للأهداف والسلاسل ودرجات الاختبارات الحقيقية.',
      cta: 'ابدأ التركيز',
      openApp: 'افتح التطبيق',
      timerTitle: 'مؤقت يعرض الحالة الحقيقية',
      timerDesc: 'أوضاع التركيز والاستراحة القصيرة والطويلة مع عد الجلسات والصوت المحيطي. هذه المعاينة تعمل فعلياً؛ ما تبدؤه هنا هو ما يراه التطبيق.',
      goalsTitle: 'مهام بأهداف، وليست مجرد قوائم',
      goalsDesc: 'جمّع عملك في فئات، وحدد أهداف الجلسات الدنيا والقصوى، واختر وتيرة تكرار كل مهمة. أنشئ مهمتك الأولى أدناه؛ تُحفظ في هذا المتصفح فوراً.',
      streakTitle: 'سلاسل تكافئ الاستمرار',
      streakDesc: 'ثلاث جلسات بومودورو مكتملة على الأقل في اليوم تحافظ على سلسلتك. أرقامك الحالية على اليسار محسوبة من جلساتك الفعلية.',
      testsTitle: 'مصمم للاختبارات المعيارية',
      testsDesc: 'القدرات والتحصيلي وSTEP والقبول المبكر في كفعم، إضافة إلى SAT وACT وIELTS وTOEFL ودوولينجو وأهداف مخصصة بمعايير أقسام وحلقة درجات.',
      testsCta: 'تصفح دليل الاختبارات',
      verifyNote: 'تفاصيل الدليل من مصادر رسمية حيثما تأكدت. أي حقل غير مؤكد موسوم بـ تحقق من الموقع الرسمي.',
      privacyFirst: 'محلي أولاً. بياناتك تبقى في هذا المتصفح إلى أن تقرر غير ذلك.',
    },
    invite: {
      title: 'دعوات المجموعات غير متاحة بعد',
      body: 'مجموعات الأصدقاء وروابط الدعوة تصل مع مرحلة التواصل الاجتماعي. لم تتم مشاركة أو تخزين أي بيانات بفتح هذا الرابط.',
      codeLabel: 'رمز الدعوة',
      backCta: 'العودة إلى التطبيق',
    },
  },
};

const CATEGORY_KEY_MAP: Record<string, keyof Translations['categories']> = {
  'Standardized Tests': 'standardizedTests',
  Study: 'study',
  School: 'school',
  Work: 'work',
  Extracurriculars: 'extracurriculars',
  Personal: 'personal',
};

export function getCategoryLabel(t: Translations, category: string): string {
  const key = CATEGORY_KEY_MAP[category];
  return key ? t.categories[key] : category;
}

const CADENCE_KEY_MAP: Record<string, keyof Translations['tasks']> = {
  hourly: 'cadenceHourly',
  daily: 'cadenceDaily',
  weekly: 'cadenceWeekly',
  monthly: 'cadenceMonthly',
};

export function getCadenceLabel(t: Translations, cadence: string): string {
  const key = CADENCE_KEY_MAP[cadence];
  return key ? (t.tasks[key] as string) : cadence;
}

export function lookupTranslationString(tree: unknown, key: string): string | undefined {
  if (!tree || typeof tree !== 'object') return undefined;
  for (const [k, v] of Object.entries(tree as Record<string, unknown>)) {
    if (k === key && typeof v === 'string') return v;
    if (v && typeof v === 'object') {
      const found = lookupTranslationString(v, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}
