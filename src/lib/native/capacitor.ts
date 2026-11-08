/**
 * Capacitor native bridge. All plugin access is behind dynamic imports so
 * the web bundle never ships native code; every function is a safe no-op
 * outside the Android WebView. Detection uses the bridge object Capacitor
 * injects (`window.Capacitor`) — no import needed.
 */

export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return cap?.isNativePlatform?.() === true;
}

export async function nativeInit(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch { /* splash stays until hidden; non-fatal */ }
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.requestPermissions();
    void perm;
  } catch { /* notifications optional */ }
}

/** Keep the screen on while a session runs (native only; web uses Wake Lock). */
export async function nativeKeepAwake(on: boolean): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { KeepAwake } = await import('@capacitor-community/keep-awake');
    if (on) await KeepAwake.keepAwake();
    else await KeepAwake.allowSleep();
  } catch { /* plugin absent */ }
}

export async function nativeHaptic(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* haptics optional */ }
}

/** Match the native status bar to the app theme (dark theme -> light icons). */
export async function nativeSyncStatusBar(dark: boolean): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: dark ? '#121b16' : '#f4f9f5' });
  } catch { /* status bar optional */ }
}

const SESSION_NOTIFY_ID = 4242;

/**
 * Schedule a local notification at the session end timestamp so the user is
 * alerted even if the WebView is killed. The in-app timer already persists
 * targetEndTime and recovers on relaunch; this is the belt-and-suspenders
 * native alert.
 */
export async function scheduleSessionEndNotification(
  endTimeMs: number,
  title: string,
  body: string,
): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [
        {
          id: SESSION_NOTIFY_ID,
          title,
          body,
          schedule: { at: new Date(endTimeMs) },
          smallIcon: 'ic_stat_notify',
        },
      ],
    });
  } catch { /* scheduling optional */ }
}

export async function cancelSessionEndNotification(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: SESSION_NOTIFY_ID }] });
  } catch { /* cancel optional */ }
}

/**
 * Native Google sign-in via @capgo/capacitor-social-login. Returns the
 * Google ID token for Firebase Auth credential exchange, or null when
 * sign-in is unavailable/cancelled. Requires google-services.json + SHA-1;
 * without them the plugin throws and we return null so the app stays guest.
 */
export async function nativeGoogleIdToken(): Promise<string | null> {
  if (!isNativeApp()) return null;
  try {
    const { SocialLogin } = await import('@capgo/capacitor-social-login');
    const result = await SocialLogin.login({
      provider: 'google',
      options: { scopes: ['profile', 'email'] },
    });
    const r = result.result as { idToken?: string | null };
    return r.idToken ?? null;
  } catch {
    return null;
  }
}
