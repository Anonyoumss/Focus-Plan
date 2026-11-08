import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DEPLOY_TARGET controls the asset base path:
//   'pages'   -> '/Focus-Plan/'  (GitHub Pages project site)
//   'android' -> './'            (Capacitor serves from the device filesystem)
//   unset     -> '/'             (local dev, Vercel root domain)
const deployTarget = process.env.DEPLOY_TARGET;
const base = deployTarget === 'pages' ? '/Focus-Plan/' : deployTarget === 'android' ? './' : '/';

export default defineConfig(() => {
  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      // Emits precache.json listing every hashed build asset so public/sw.js
      // can precache the full app shell (including lazy route chunks) at
      // install time — required for first-visit offline reloads.
      {
        name: 'sw-precache-manifest',
        generateBundle(_options, bundle) {
          const files = Object.keys(bundle).filter((f) => f.startsWith('assets/'));
          this.emitFile({
            type: 'asset',
            fileName: 'precache.json',
            source: JSON.stringify(files),
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
