export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerConfig {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
};

export function calculateRemainingSeconds(targetEndTime: number, now: number = Date.now()): number {
  if (targetEndTime <= now) return 0;
  return Math.max(0, Math.ceil((targetEndTime - now) / 1000));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateProgress(remainingSeconds: number, totalDurationSeconds: number): number {
  if (totalDurationSeconds <= 0) return 0;
  const elapsed = totalDurationSeconds - remainingSeconds;
  return Math.min(1, Math.max(0, elapsed / totalDurationSeconds));
}

export function getNextMode(
  currentMode: TimerMode,
  completedFocusSessions: number,
  longBreakInterval: number
): TimerMode {
  if (currentMode !== 'focus') {
    return 'focus';
  }
  if (completedFocusSessions > 0 && completedFocusSessions % longBreakInterval === 0) {
    return 'longBreak';
  }
  return 'shortBreak';
}

export function updateDocumentTitle(formattedTime: string, mode: TimerMode, appName: string = 'Focus Plan M3E'): void {
  const modeLabel = mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break';
  document.title = `(${formattedTime}) ${modeLabel} · ${appName}`;
}

export function restoreDefaultTitle(appName: string = 'Focus Plan M3E'): void {
  document.title = `${appName} - Pomodoro & Study Tracker`;
}

let wakeLockSentinel: any = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  if ('wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch (err) {
      console.warn('Screen wake lock unavailable:', err);
      return false;
    }
  }
  return false;
}

export async function releaseScreenWakeLock(): Promise<void> {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // ignore
    }
    wakeLockSentinel = null;
  }
}

export function sendWebNotification(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
      });
    } catch (err) {
      console.warn('Failed to display web notification:', err);
    }
  }
}
