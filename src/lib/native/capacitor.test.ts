import { describe, it, expect, afterEach } from 'vitest';
import {
  isNativeApp,
  nativeInit,
  nativeKeepAwake,
  nativeHaptic,
  nativeSyncStatusBar,
  scheduleSessionEndNotification,
  cancelSessionEndNotification,
  nativeGoogleIdToken,
} from './capacitor';

const g = globalThis as { window?: { Capacitor?: { isNativePlatform?: () => boolean } } };

afterEach(() => {
  delete g.window;
});

describe('native bridge', () => {
  it('reports not-native with no window', () => {
    expect(isNativeApp()).toBe(false);
  });

  it('reports not-native on web (no Capacitor bridge)', () => {
    g.window = {};
    expect(isNativeApp()).toBe(false);
  });

  it('honors the injected bridge flag', () => {
    g.window = { Capacitor: { isNativePlatform: () => true } };
    expect(isNativeApp()).toBe(true);
  });

  it('all plugin calls resolve without throwing on web', async () => {
    g.window = {};
    await expect(nativeInit()).resolves.toBeUndefined();
    await expect(nativeKeepAwake(true)).resolves.toBeUndefined();
    await expect(nativeKeepAwake(false)).resolves.toBeUndefined();
    await expect(nativeHaptic()).resolves.toBeUndefined();
    await expect(nativeSyncStatusBar(true)).resolves.toBeUndefined();
    await expect(nativeSyncStatusBar(false)).resolves.toBeUndefined();
    await expect(
      scheduleSessionEndNotification(Date.now() + 60000, 't', 'b'),
    ).resolves.toBeUndefined();
    await expect(cancelSessionEndNotification()).resolves.toBeUndefined();
    await expect(nativeGoogleIdToken()).resolves.toBeNull();
  });
});
