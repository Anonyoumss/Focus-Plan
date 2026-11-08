import { createRoot } from 'react-dom/client';
import App from './App.tsx';
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
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
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

createRoot(document.getElementById('root')!).render(<App />);
