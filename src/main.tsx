import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './material-web';
import './index.css';
import { installEmulatorHook } from './lib/firebase/emulatorHook';

installEmulatorHook();

createRoot(document.getElementById('root')!).render(<App />);
