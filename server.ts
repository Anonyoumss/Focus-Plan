import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  validateIntakeBody,
  validateStudyPlanBody,
  validatePostTestBody,
  validateIntakeOutput,
  validateStudyPlanOutput,
  validatePostTestOutput,
} from './src/lib/ai/validation.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

/**
 * AI proxy server. Security model:
 * - Every /api/gemini/* POST requires a Firebase ID token (Bearer).
 * - Per-user daily call cap persisted to disk (survives restarts).
 * - Strict input validation; AI output re-validated (incl. score ranges).
 * - CORS limited to first-party origins; same-origin is the default path.
 * - Logs carry method/path/status only — never tokens, emails, prompts,
 *   or user content.
 */

const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 30;
const RATE_LIMIT_FILE = path.join(__dirname, 'data', 'ai-usage.json');
const ALLOWED_ORIGINS = (process.env.AI_ALLOWED_ORIGINS ||
  'http://localhost:3000,http://127.0.0.1:3000,https://anonyoumss.github.io')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/* ---------------- Rate limit (JSON file, survives restarts) ---------------- */

type UsageMap = Record<string, number>;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readUsage(): UsageMap {
  try {
    return JSON.parse(fs.readFileSync(RATE_LIMIT_FILE, 'utf8')) as UsageMap;
  } catch {
    return {};
  }
}

function writeUsage(map: UsageMap): void {
  try {
    fs.mkdirSync(path.dirname(RATE_LIMIT_FILE), { recursive: true });
    const tmp = `${RATE_LIMIT_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(map));
    fs.renameSync(tmp, RATE_LIMIT_FILE);
  } catch {
    /* best effort; a lost counter only affects limiting, never correctness */
  }
}

function rateLimitHit(uid: string): { allowed: boolean; remaining: number } {
  const map = readUsage();
  const today = todayKey();
  // Prune entries older than today so the file cannot grow unbounded.
  for (const k of Object.keys(map)) {
    if (!k.endsWith(`:${today}`) && !k.endsWith(`:${yesterdayKey()}`)) delete map[k];
  }
  const key = `${uid}:${today}`;
  const count = map[key] ?? 0;
  if (count >= DAILY_LIMIT) {
    writeUsage(map);
    return { allowed: false, remaining: 0 };
  }
  map[key] = count + 1;
  writeUsage(map);
  return { allowed: true, remaining: DAILY_LIMIT - count - 1 };
}

function yesterdayKey(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/* ---------------- Firebase ID token verification ---------------- */

const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certCache: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getGoogleCerts(): Promise<Record<string, string>> {
  if (certCache && Date.now() < certCache.expiresAt - 60_000) return certCache.certs;
  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) throw new Error('cert-fetch-failed');
  const certs = (await res.json()) as Record<string, string>;
  const maxAge = Number(res.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] ?? 3600);
  certCache = { certs, expiresAt: Date.now() + maxAge * 1000 };
  return certs;
}

function decodeJwt(token: string): { header: any; payload: any; signature: Buffer; signingInput: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return { header, payload, signature: Buffer.from(parts[2], 'base64url'), signingInput: `${parts[0]}.${parts[1]}` };
  } catch {
    return null;
  }
}

/**
 * Verify a Firebase Auth ID token. Returns the uid or null.
 * Uses Google's public certs for RS256. When the Auth emulator is in use
 * (FIREBASE_AUTH_EMULATOR_HOST set — the standard emulator signal), the
 * token is decoded without signature checks; emulator tokens are only
 * ever issued by the local emulator.
 */
async function verifyIdToken(token: string): Promise<string | null> {
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  const { header, payload, signature, signingInput } = decoded;

  const emulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
  if (!emulator) {
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;
    const certs = await getGoogleCerts().catch(() => null);
    const cert = certs?.[header.kid];
    if (!cert) return null;
    const ok = crypto.verify('RSA-SHA256', Buffer.from(signingInput), cert, signature);
    if (!ok) return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  const expectedIss = `https://securetoken.google.com/${projectId}`;
  // Emulator tokens may use a demo project id; accept the configured one only.
  if (payload.iss !== expectedIss) return null;
  if (payload.aud !== projectId) return null;
  if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) return null;
  if (payload.email_verified !== undefined && payload.email_verified !== true) {
    // Firebase ID tokens always carry email_verified for Google sign-in;
    // tolerate its absence but reject an explicit false.
    return null;
  }
  return payload.sub;
}

/* ---------------- Middleware ---------------- */

function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(origin && ALLOWED_ORIGINS.includes(origin) ? 204 : 403);
    return;
  }
  next();
}

/** Minimal request log: method + path + status. No bodies, tokens, or user data. */
function logRequest(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    if (req.path.startsWith('/api/')) {
      console.log(`${req.method} ${req.path} -> ${res.statusCode}`);
    }
  });
  next();
}

interface AuthedRequest extends Request {
  uid?: string;
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || token.length > 8192) {
    res.status(401).json({ error: 'UNAUTHORIZED', fallback: true });
    return;
  }
  try {
    const uid = await verifyIdToken(token);
    if (!uid) {
      res.status(401).json({ error: 'UNAUTHORIZED', fallback: true });
      return;
    }
    const limit = rateLimitHit(uid);
    if (!limit.allowed) {
      res.status(429).json({ error: 'RATE_LIMITED', fallback: true });
      return;
    }
    req.uid = uid;
    next();
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED', fallback: true });
  }
}

/* ---------------- Gemini client ---------------- */

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function geminiUnavailable(res: Response): void {
  res.status(503).json({
    error: 'GEMINI_KEY_UNAVAILABLE',
    message: 'Server-side Gemini API key is not configured in environment.',
    fallback: true,
  });
}

function aiError(res: Response, err: unknown): void {
  // Never forward raw provider errors: they can echo prompt content.
  console.warn('gemini request failed:', err instanceof Error ? err.name : 'unknown');
  res.status(502).json({ error: 'GEMINI_INFERENCE_ERROR', fallback: true });
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(corsMiddleware);
  app.use(logRequest);
  app.use(express.json({ limit: '256kb' }));

  // Status endpoint: public, reveals only whether a key is configured.
  app.get('/api/gemini/status', (_req: Request, res: Response) => {
    res.json({
      available: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.8-flash',
    });
  });

  app.post('/api/gemini/intake-consult', requireAuth, async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const ai = getGeminiClient();
      if (!ai) return geminiUnavailable(res);
      const input = validateIntakeBody(req.body);
      if (!input) {
        res.status(400).json({ error: 'INVALID_INPUT', fallback: true });
        return;
      }

      const isAr = input.locale === 'ar';
      const systemInstruction =
        'You are an expert academic advisor for standardized tests. Given test metadata, user baseline, and target score, output per-section target scores and total weekly pomodoros (25m each). Never invent unofficial scoring ranges or exam dates. Output strict JSON with aiSuggested: true.';
      const prompt = JSON.stringify({
        testId: input.testId,
        testName: input.testName || input.testId,
        currentScore: input.currentScore,
        targetScore: input.targetScore,
        weeksRemaining: input.weeksRemaining || 8,
        currentDailyHours: input.currentDailyHours || 2,
        sections: input.sections || [],
        instructions: isAr
          ? 'اكتب التوجيهات والاستراتيجية باللغة العربية مع إبقاء مسميات الاختبار الرسمية كما هي.'
          : 'Write strategy summary in English keeping official test terminology.',
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sectionTargets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sectionId: { type: Type.STRING },
                    targetScore: { type: Type.NUMBER },
                    weeklyPomodoros: { type: Type.INTEGER },
                  },
                  required: ['sectionId', 'targetScore', 'weeklyPomodoros'],
                },
              },
              totalWeeklyPomodoros: { type: Type.INTEGER },
              strategySummary: { type: Type.STRING },
              aiSuggested: { type: Type.BOOLEAN },
              disclaimer: { type: Type.STRING },
            },
            required: ['sectionTargets', 'totalWeeklyPomodoros', 'strategySummary', 'aiSuggested', 'disclaimer'],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error('empty-response');
      const parsed = validateIntakeOutput(JSON.parse(text), input);
      if (!parsed) {
        res.status(502).json({ error: 'AI_OUTPUT_INVALID', fallback: true });
        return;
      }
      res.json({
        ...parsed,
        aiSuggested: true,
        disclaimer: isAr
          ? 'مقترح بالذكاء الاصطناعي، يرجى التحقق من الجهة الرسمية للاختبار'
          : 'AI suggested, verify with official testing authorities',
      });
    } catch (err) {
      aiError(res, err);
    }
  });

  app.post('/api/gemini/study-plan', requireAuth, async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const ai = getGeminiClient();
      if (!ai) return geminiUnavailable(res);
      const input = validateStudyPlanBody(req.body);
      if (!input) {
        res.status(400).json({ error: 'INVALID_INPUT', fallback: true });
        return;
      }

      const isAr = input.locale === 'ar';
      const systemInstruction =
        'Generate a weekly pomodoro task schedule based on section gaps and weekly capacity. Output actionable task items with estimated pomodoros and weekday distribution. Never invent exam dates. Output strict JSON with aiSuggested: true.';
      const prompt = JSON.stringify({
        testId: input.testId,
        testName: input.testName || input.testId,
        weeklyPomodoroTarget: input.weeklyPomodoroTarget || 20,
        sectionPriorities: input.sectionPriorities,
        instructions: isAr
          ? 'اكتب عناوين المهام باللغة العربية الواضحة المحددة.'
          : 'Write actionable, concrete study task titles in English.',
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    sectionId: { type: Type.STRING },
                    estimatedPomodoros: { type: Type.INTEGER },
                    dayOfWeek: {
                      type: Type.STRING,
                      enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
                    },
                  },
                  required: ['title', 'sectionId', 'estimatedPomodoros', 'dayOfWeek'],
                },
              },
              aiSuggested: { type: Type.BOOLEAN },
              disclaimer: { type: Type.STRING },
            },
            required: ['tasks', 'aiSuggested', 'disclaimer'],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error('empty-response');
      const parsed = validateStudyPlanOutput(JSON.parse(text), input);
      if (!parsed) {
        res.status(502).json({ error: 'AI_OUTPUT_INVALID', fallback: true });
        return;
      }
      res.json({
        ...parsed,
        aiSuggested: true,
        disclaimer: isAr
          ? 'مقترح بالذكاء الاصطناعي، يرجى التحقق من خطتك ومراجعتها'
          : 'AI suggested, verify with your study plan and official sources',
      });
    } catch (err) {
      aiError(res, err);
    }
  });

  app.post('/api/gemini/post-test-analysis', requireAuth, async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const ai = getGeminiClient();
      if (!ai) return geminiUnavailable(res);
      const input = validatePostTestBody(req.body);
      if (!input) {
        res.status(400).json({ error: 'INVALID_INPUT', fallback: true });
        return;
      }

      const isAr = input.locale === 'ar';
      const systemInstruction =
        'Analyze completed mock/real test section scores against targets. Identify largest gaps and suggest compensatory study adjustments. Never invent official score scales or exam dates. Output strict JSON with aiSuggested: true.';
      const prompt = JSON.stringify({
        testId: input.testId,
        testName: input.testName || input.testId,
        targetScore: input.targetScore,
        actualScores: input.actualScores,
        sectionTargets: input.sectionTargets || {},
        sectionNames: input.sectionNames || {},
        instructions: isAr
          ? 'اكتب التحليل والتوصيات باللغة العربية بأسلوب تحفيزي وإرشادي محكم.'
          : 'Write actionable diagnostic narrative and recommendations in English.',
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallGap: { type: Type.NUMBER },
              weakestSection: { type: Type.STRING },
              recommendedWeeklyShift: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sectionId: { type: Type.STRING },
                    deltaPomodoros: { type: Type.INTEGER },
                  },
                  required: ['sectionId', 'deltaPomodoros'],
                },
              },
              analysisNarrative: { type: Type.STRING },
              aiSuggested: { type: Type.BOOLEAN },
              disclaimer: { type: Type.STRING },
            },
            required: ['overallGap', 'weakestSection', 'recommendedWeeklyShift', 'analysisNarrative', 'aiSuggested', 'disclaimer'],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error('empty-response');
      const parsed = validatePostTestOutput(JSON.parse(text), input);
      if (!parsed) {
        res.status(502).json({ error: 'AI_OUTPUT_INVALID', fallback: true });
        return;
      }
      res.json({
        ...parsed,
        aiSuggested: true,
        disclaimer: isAr
          ? 'مقترح بالذكاء الاصطناعي، يرجى مراجعة النتائج والتحقق'
          : 'AI suggested, verify with your official score report',
      });
    } catch (err) {
      aiError(res, err);
    }
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
    // Express 5: no '*' wildcard — any non-asset GET falls back to index.html.
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
