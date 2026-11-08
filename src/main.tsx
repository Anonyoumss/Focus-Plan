import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { useAppStore } from './store/useAppStore';
import './material-web';
import './index.css';

// Emulator-only test hook; loaded dynamically so the Firebase SDK stays
// out of the production bundle entirely.
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  void import('./lib/firebase/emulatorHook').then((m) => m.installEmulatorHook());
}

// Production-only service worker: caches the app shell so the installed PWA
// works offline. Resolves './sw.js' relative to the deploy base, so it works
// under both '/Focus-Plan/' and '/'.
// Native app (Capacitor WebView): init splash/status-bar/notifications and
// skip the service worker — the WebView loads from the filesystem.
const isNativeShell = typeof window !== 'undefined' &&
  (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() === true;
if (isNativeShell) {
  void import('./lib/native/capacitor').then((m) => m.nativeInit());
}

if (import.meta.env.PROD && !isNativeShell && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('sw:update-available'));
            }
          });
        });
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void reg.update();
        });
      })
      .catch(() => {
        // SW registration is best-effort; the app works without it.
      });
  });
}

// Test/e2e hook: exposes the store for specs that need to seed demo data.
(window as unknown as { __appStore?: typeof useAppStore }).__appStore = useAppStore;

createRoot(document.getElementById('root')!).render(<App />);
