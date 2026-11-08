import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { FileQuotaStore, handleGeminiApi } from './src/lib/ai/proxyCore.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

/**
 * AI proxy dev/prod server. All /api/gemini/* logic lives in
 * src/lib/ai/proxyCore.ts (shared with the Vercel functions in api/).
 * This host uses the file-backed quota store; Vercel uses Firestore.
 * Logs carry method/path/status only — never tokens, prompts or content.
 */

const quota = new FileQuotaStore();

/** Minimal request log: method + path + status. No bodies, tokens, or user data. */
function logRequest(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    if (req.path.startsWith('/api/')) {
      console.log(`${req.method} ${req.path} -> ${res.statusCode}`);
    }
  });
  next();
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(logRequest);
  app.use(express.json({ limit: '256kb' }));

  app.use('/api', async (req: Request, res: Response) => {
    const result = await handleGeminiApi(
      {
        method: req.method,
        path: req.path.replace(/^\/+/, ''),
        headers: req.headers as Record<string, string | string[] | undefined>,
        body: req.body,
      },
      quota,
    );
    for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v);
    res.status(result.status).json(result.body ?? {});
  });

  // Mount Vite middleware in development; serve built static dist in production
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Focus Plan M3E server running on http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err instanceof Error ? err.name : 'unknown');
  process.exit(1);
});
