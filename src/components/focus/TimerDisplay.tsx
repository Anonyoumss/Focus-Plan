import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { formatTime, calculateProgress } from '../../lib/timerEngine';

export const TimerDisplay: React.FC = () => {
  const {
    locale,
    timerMode,
    isRunning,
    remainingSeconds,
    timerConfig,
    activeTaskId,
    tasks,
    todaySessionsCount,
    dailyGoalSessions,
    ambientSound,
    alarmVolume,
    setTimerMode,
    startTimer,
    pauseTimer,
    skipTimer,
    resetTimer,
    tickTimer,
    setAmbientSound,
    setAlarmVolume,
  } = useAppStore();

  const t = TRANSLATIONS[locale];
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        tickTimer();
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, tickTimer]);

  const totalDuration =
    timerMode === 'focus'
      ? timerConfig.focusDuration
      : timerMode === 'shortBreak'
      ? timerConfig.shortBreakDuration
      : timerConfig.longBreakDuration;

  const progress = calculateProgress(remainingSeconds, totalDuration);

  const size = 320;
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto px-4 py-6">
      <div
        className="flex items-center p-1 rounded-full mb-8"
        style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
        role="group"
        aria-label="Timer Mode Selector"
      >
        <button
          onClick={() => setTimerMode('focus')}
          className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer rounded-s-full rounded-e-none ${
            timerMode === 'focus' ? 'shadow-sm' : 'hover:opacity-85'
          }`}
          style={{
            backgroundColor:
              timerMode === 'focus'
                ? 'var(--md-sys-color-primary)'
                : 'transparent',
            color:
              timerMode === 'focus'
                ? 'var(--md-sys-color-on-primary)'
                : 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          {t.timer.focus}
        </button>

        <button
          onClick={() => setTimerMode('shortBreak')}
          className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer rounded-none border-x border-transparent ${
            timerMode === 'shortBreak' ? 'shadow-sm' : 'hover:opacity-85'
          }`}
          style={{
            backgroundColor:
              timerMode === 'shortBreak'
                ? 'var(--md-sys-color-primary)'
                : 'transparent',
            color:
              timerMode === 'shortBreak'
                ? 'var(--md-sys-color-on-primary)'
                : 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          {t.timer.shortBreak}
        </button>

        <button
          onClick={() => setTimerMode('longBreak')}
          className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer rounded-e-full rounded-s-none ${
            timerMode === 'longBreak' ? 'shadow-sm' : 'hover:opacity-85'
          }`}
          style={{
            backgroundColor:
              timerMode === 'longBreak'
                ? 'var(--md-sys-color-primary)'
                : 'transparent',
            color:
              timerMode === 'longBreak'
                ? 'var(--md-sys-color-on-primary)'
                : 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          {t.timer.longBreak}
        </button>
      </div>

      <div className="relative flex items-center justify-center w-72 h-72 sm:w-80 sm:h-80 mb-8 select-none">
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            style={{ stroke: 'var(--md-sys-color-surface-container-highest)', opacity: 0.5 }}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
            style={{
              stroke: 'var(--md-sys-color-primary)',
              filter: isRunning ? 'drop-shadow(0 0 4px var(--md-sys-color-primary-container))' : 'none',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="font-timer text-6xl sm:text-7xl font-bold tracking-tight"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {formatTime(remainingSeconds)}
          </span>

          <span
            className="text-xs sm:text-sm font-medium mt-2"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {t.timer.dailyTarget}: {todaySessionsCount} / {dailyGoalSessions}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6">
        <button
          onClick={resetTimer}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
          title={t.timer.reset}
          aria-label={t.timer.reset}
        >
          <MaterialIcon name="refresh" size={24} />
        </button>

        <button
          onClick={isRunning ? pauseTimer : startTimer}
          className="min-w-44 max-w-full h-14 px-6 sm:px-8 rounded-2xl flex items-center justify-center gap-3 font-semibold text-base transition-all duration-200 active:scale-98 cursor-pointer shadow-md"
          style={{
            backgroundColor: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary)',
          }}
          aria-label={isRunning ? t.timer.pause : t.timer.start}
        >
          <MaterialIcon name={isRunning ? 'pause' : 'play_arrow'} size={28} filled />
          <span>{isRunning ? t.timer.pause : t.timer.start}</span>
        </button>

        <button
          onClick={skipTimer}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
          title={t.timer.skip}
          aria-label={t.timer.skip}
        >
          <MaterialIcon name="skip_next" size={24} />
        </button>
      </div>

      <div
        className="w-full rounded-2xl p-4 flex items-center justify-between border"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div className="flex items-center gap-3 truncate">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
            }}
          >
            <MaterialIcon name="task_alt" size={20} />
          </div>
          <div className="truncate text-start">
            <div
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: 'var(--md-sys-color-outline)' }}
            >
              {t.timer.currentTask}
            </div>
            <div
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {activeTask ? activeTask.title : t.timer.noActiveTask}
            </div>
          </div>
        </div>

        {activeTask && (
          <div
            className="text-xs font-medium px-3 py-1 rounded-md shrink-0"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-highest)',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            {activeTask.completedSessions} / {activeTask.estimatedSessions}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-y-2 w-full mt-4 px-2 text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <MaterialIcon name="graphic_eq" size={18} className="shrink-0" />
          <span className="shrink-0">{t.timer.ambientSound}:</span>
          <select
            value={ambientSound}
            onChange={(e) => setAmbientSound(e.target.value as any)}
            className="bg-transparent border rounded-md px-2 py-1 text-xs outline-none cursor-pointer max-w-36 truncate"
            style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
          >
            <option value="none">{locale === 'ar' ? 'إيقاف' : 'Off'}</option>
            <option value="whitenoise">{locale === 'ar' ? 'ضوضاء وردية' : 'Pink Noise'}</option>
            <option value="binaural">{locale === 'ar' ? 'موجات ألفا (ثنائية الأذن)' : 'Alpha Waves (Binaural)'}</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <MaterialIcon name="volume_up" size={18} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={alarmVolume}
            onChange={(e) => setAlarmVolume(parseFloat(e.target.value))}
            className="w-16 cursor-pointer"
            style={{ accentColor: 'var(--md-sys-color-primary)' }}
            aria-label={t.timer.volume}
          />
        </div>
      </div>
    </div>
  );
};
