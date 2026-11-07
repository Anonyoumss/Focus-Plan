import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './material-web';
import './index.css';

// Emulator-only test hook; loaded dynamically so the Firebase SDK stays
// out of the production bundle entirely.
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  void import('./lib/firebase/emulatorHook').then((m) => m.installEmulatorHook());
}

createRoot(document.getElementById('root')!).render(<App />);
