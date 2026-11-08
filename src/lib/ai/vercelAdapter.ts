/**
 * Shared adapter for Vercel Node functions -> proxyCore.
 * Vercel maps api/gemini/<name>.ts to /api/gemini/<name>.
 */
import { FirestoreQuotaStore, handleGeminiApi, type ApiRequest } from './proxyCore.ts';

interface VercelReq {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}
interface VercelRes {
  setHeader(name: string, value: string): void;
  status(code: number): VercelRes;
  json(body: unknown): void;
  end(): void;
}

const quota = new FirestoreQuotaStore(process.env.FIREBASE_PROJECT_ID);

export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  const urlPath = (req.url || '').split('?')[0].replace(/^\/+api\/+/, '');
  const result = await handleGeminiApi(
    {
      method: (req.method || 'GET').toUpperCase(),
      path: urlPath,
      headers: req.headers,
      body: req.body,
    } satisfies ApiRequest,
    quota,
  );
  for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v);
  if (result.status === 204 || result.body === null) {
    res.status(result.status).end();
    return;
  }
  res.status(result.status).json(result.body);
}
