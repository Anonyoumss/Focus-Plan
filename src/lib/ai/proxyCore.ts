/**
 * Framework-free Gemini proxy core — shared by the Express dev/prod server
 * (server.ts) and the Vercel serverless functions (api/gemini/*.ts).
 *
 * Security model (identical on both hosts):
 * - Every /api/gemini/* POST requires a Firebase ID token (Bearer).
 * - Per-user daily call cap via a pluggable QuotaStore (file on Node,
 *   Firestore REST on Vercel).
 * - Strict input validation; AI output re-validated (incl. score ranges).
 * - CORS limited to first-party origins.
 * - Callers must never log bodies, tokens, prompts or user content.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  validateIntakeBody,
  validateStudyPlanBody,
  validatePostTestBody,
  validateIntakeOutput,
  validateStudyPlanOutput,
  validatePostTestOutput,
} from './validation';

export const GEMINI_MODEL = 'gemini-3.8-flash';

const ALLOWED_ORIGINS = (
  process.env.AI_ALLOWED_ORIGINS ||
  [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://anonyoumss.github.io',
    'https://focus-plan-delta.vercel.app',
    // Capacitor Android WebView origin (default https scheme, no port).
    'https://localhost',
    'http://localhost',
  ].join(',')
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export function isAllowedOrigin(origin: string | undefined): boolean {
  return !!origin && ALLOWED_ORIGINS.includes(origin);
}

export function corsHeaders(origin: string | undefined): Record<string, string> {
  if (!isAllowedOrigin(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin as string,
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
  };
}

/* ---------------- Quota stores ---------------- */

export interface QuotaResult {
  allowed: boolean;
  remaining: number;
}

export interface QuotaStore {
  hit(uid: string, idToken?: string): Promise<QuotaResult>;
}

const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 30;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** JSON-file quota — durable on a single Node host (dev:server / self-host). */
export class FileQuotaStore implements QuotaStore {
  private file: string;
  constructor(file?: string) {
    const here = path.dirname(fileURLToPath(import.meta.url));
    this.file = file ?? path.join(here, '..', '..', '..', 'data', 'ai-usage.json');
  }
  async hit(uid: string): Promise<QuotaResult> {
    let map: Record<string, number> = {};
    try {
      map = JSON.parse(fs.readFileSync(this.file, 'utf8')) as Record<string, number>;
    } catch { /* fresh */ }
    const today = todayKey();
    const key = `${uid}:${today}`;
    const count = map[key] ?? 0;
    if (count >= DAILY_LIMIT) return { allowed: false, remaining: 0 };
    map[key] = count + 1;
    for (const k of Object.keys(map)) {
      if (!k.endsWith(`:${today}`)) delete map[k];
    }
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(map));
      fs.renameSync(tmp, this.file);
    } catch { /* best effort */ }
    return { allowed: true, remaining: DAILY_LIMIT - count - 1 };
  }
}

/**
 * Firestore quota via the user's own ID token (no service account needed).
 * Doc: aiUsage/{uid}/days/{YYYY-MM-DD} { count: int }. Security rules scope
 * writes to request.auth.uid == uid. A determined user can reset their own
 * counter client-side — same honor-system model as the wallet (see
 * DECISIONS.md). Store errors fail open: auth + Gemini key still gate abuse.
 */
export class FirestoreQuotaStore implements QuotaStore {
  constructor(private projectId: string | undefined) {}
  async hit(uid: string, idToken?: string): Promise<QuotaResult> {
    const pid = this.projectId ?? process.env.FIREBASE_PROJECT_ID;
    if (!pid || !idToken) return { allowed: true, remaining: DAILY_LIMIT };
    const day = todayKey();
    const docPath = `aiUsage/${uid}/days/${day}`;
    const base = `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/${docPath}`;
    try {
      const getRes = await fetch(base, { headers: { Authorization: `Bearer ${idToken}` } });
      let count = 0;
      if (getRes.ok) {
        const doc = (await getRes.json()) as { fields?: { count?: { integerValue?: string } } };
        count = Number(doc.fields?.count?.integerValue ?? 0);
      } else if (getRes.status !== 404) {
        return { allowed: true, remaining: DAILY_LIMIT };
      }
      if (count >= DAILY_LIMIT) return { allowed: false, remaining: 0 };
      const patch = await fetch(base, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { count: { integerValue: String(count + 1) } } }),
      });
      if (!patch.ok) return { allowed: true, remaining: DAILY_LIMIT };
      return { allowed: true, remaining: DAILY_LIMIT - count - 1 };
    } catch {
      return { allowed: true, remaining: DAILY_LIMIT };
    }
  }
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

function decodeJwt(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return {
      header: JSON.parse(Buffer.from(parts[0], 'base64url').toString()),
      payload: JSON.parse(Buffer.from(parts[1], 'base64url').toString()),
      signature: Buffer.from(parts[2], 'base64url'),
      signingInput: `${parts[0]}.${parts[1]}`,
    };
  } catch {
    return null;
  }
}

/** Verify a Firebase Auth ID token. Returns the uid or null. */
export async function verifyIdToken(token: string): Promise<string | null> {
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
  if (payload.iss !== expectedIss) return null;
  if (payload.aud !== projectId) return null;
  if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) return null;
  if (payload.email_verified !== undefined && payload.email_verified !== true) return null;
  return payload.sub;
}

/* ---------------- Request handling ---------------- */

export interface ApiRequest {
  method: string;
  /** Path after /api, e.g. 'gemini/intake-consult'. */
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ApiResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

function headerStr(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function json(status: number, body: unknown, extraHeaders: Record<string, string> = {}): ApiResponse {
  return { status, headers: { 'Content-Type': 'application/json', ...extraHeaders }, body };
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function aiError(): ApiResponse {
  // Never forward raw provider errors: they can echo prompt content.
  console.warn('gemini request failed');
  return json(502, { error: 'GEMINI_INFERENCE_ERROR', fallback: true });
}

async function authenticate(
  req: ApiRequest,
  quota: QuotaStore,
  cors: Record<string, string>,
): Promise<{ uid: string; idToken: string } | ApiResponse> {
  const header = headerStr(req.headers.authorization);
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || token.length > 8192) {
    return json(401, { error: 'UNAUTHORIZED', fallback: true }, cors);
  }
  try {
    const uid = await verifyIdToken(token);
    if (!uid) return json(401, { error: 'UNAUTHORIZED', fallback: true }, cors);
    const limit = await quota.hit(uid, token);
    if (!limit.allowed) {
      return json(429, { error: 'RATE_LIMITED', fallback: true }, cors);
    }
    return { uid, idToken: token };
  } catch {
    return json(401, { error: 'UNAUTHORIZED', fallback: true }, cors);
  }
}

async function geminiJson(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string,
  schema: Record<string, unknown>,
  required: string[],
): Promise<unknown> {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: { type: Type.OBJECT, properties: schema as never, required } as never,
    },
  });
  const text = response.text;
  if (!text) throw new Error('empty-response');
  return JSON.parse(text);
}

export async function handleGeminiApi(req: ApiRequest, quota: QuotaStore): Promise<ApiResponse> {
  const origin = headerStr(req.headers.origin);
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return { status: isAllowedOrigin(origin) ? 204 : 403, headers: cors, body: null };
  }
  if (!req.path.startsWith('gemini/')) {
    return json(404, { error: 'NOT_FOUND' }, cors);
  }

  if (req.path === 'gemini/status' && req.method === 'GET') {
    return json(200, { available: Boolean(process.env.GEMINI_API_KEY), model: GEMINI_MODEL }, cors);
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'METHOD_NOT_ALLOWED' }, cors);
  }

  const route = req.path.slice('gemini/'.length);
  if (!['intake-consult', 'study-plan', 'post-test-analysis'].includes(route)) {
    return json(404, { error: 'NOT_FOUND' }, cors);
  }

  const auth = await authenticate(req, quota, cors);
  if ('status' in auth) return auth;

  const ai = getGeminiClient();
  if (!ai) {
    return json(503, {
      error: 'GEMINI_KEY_UNAVAILABLE',
      message: 'Server-side Gemini API key is not configured in environment.',
      fallback: true,
    }, cors);
  }

  try {
    if (route === 'intake-consult') {
      const input = validateIntakeBody(req.body);
      if (!input) return json(400, { error: 'INVALID_INPUT', fallback: true }, cors);
      const isAr = input.locale === 'ar';
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
      const parsed = validateIntakeOutput(
        await geminiJson(ai, prompt,
          'You are an expert academic advisor for standardized tests. Given test metadata, user baseline, and target score, output per-section target scores and total weekly pomodoros (25m each). Never invent unofficial scoring ranges or exam dates. Output strict JSON with aiSuggested: true.',
          {
            sectionTargets: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
              sectionId: { type: Type.STRING }, targetScore: { type: Type.NUMBER }, weeklyPomodoros: { type: Type.INTEGER },
            }, required: ['sectionId', 'targetScore', 'weeklyPomodoros'] } },
            totalWeeklyPomodoros: { type: Type.INTEGER },
            strategySummary: { type: Type.STRING },
            aiSuggested: { type: Type.BOOLEAN },
            disclaimer: { type: Type.STRING },
          },
          ['sectionTargets', 'totalWeeklyPomodoros', 'strategySummary', 'aiSuggested', 'disclaimer']),
        input,
      );
      if (!parsed) return json(502, { error: 'AI_OUTPUT_INVALID', fallback: true }, cors);
      return json(200, {
        ...parsed,
        aiSuggested: true,
        disclaimer: isAr
          ? 'مقترح بالذكاء الاصطناعي، يرجى التحقق من الجهة الرسمية للاختبار'
          : 'AI suggested, verify with official testing authorities',
      }, cors);
    }

    if (route === 'study-plan') {
      const input = validateStudyPlanBody(req.body);
      if (!input) return json(400, { error: 'INVALID_INPUT', fallback: true }, cors);
      const isAr = input.locale === 'ar';
      const prompt = JSON.stringify({
        testId: input.testId,
        testName: input.testName || input.testId,
        weeklyPomodoroTarget: input.weeklyPomodoroTarget || 20,
        sectionPriorities: input.sectionPriorities,
        instructions: isAr
          ? 'اكتب عناوين المهام باللغة العربية الواضحة المحددة.'
          : 'Write actionable, concrete study task titles in English.',
      });
      const parsed = validateStudyPlanOutput(
        await geminiJson(ai, prompt,
          'Generate a weekly pomodoro task schedule based on section gaps and weekly capacity. Output actionable task items with estimated pomodoros and weekday distribution. Never invent exam dates. Output strict JSON with aiSuggested: true.',
          {
            tasks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
              title: { type: Type.STRING }, sectionId: { type: Type.STRING },
              estimatedPomodoros: { type: Type.INTEGER },
              dayOfWeek: { type: Type.STRING, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
            }, required: ['title', 'sectionId', 'estimatedPomodoros', 'dayOfWeek'] } },
            aiSuggested: { type: Type.BOOLEAN },
            disclaimer: { type: Type.STRING },
          },
          ['tasks', 'aiSuggested', 'disclaimer']),
        input,
      );
      if (!parsed) return json(502, { error: 'AI_OUTPUT_INVALID', fallback: true }, cors);
      return json(200, {
        ...parsed,
        aiSuggested: true,
        disclaimer: isAr
          ? 'مقترح بالذكاء الاصطناعي، يرجى التحقق من خطتك ومراجعتها'
          : 'AI suggested, verify with your study plan and official sources',
      }, cors);
    }

    // post-test-analysis
    const input = validatePostTestBody(req.body);
    if (!input) return json(400, { error: 'INVALID_INPUT', fallback: true }, cors);
    const isAr = input.locale === 'ar';
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
    const parsed = validatePostTestOutput(
      await geminiJson(ai, prompt,
        'Analyze completed mock/real test section scores against targets. Identify largest gaps and suggest compensatory study adjustments. Never invent official score scales or exam dates. Output strict JSON with aiSuggested: true.',
        {
          overallGap: { type: Type.NUMBER },
          weakestSection: { type: Type.STRING },
          recommendedWeeklyShift: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
            sectionId: { type: Type.STRING }, deltaPomodoros: { type: Type.INTEGER },
          }, required: ['sectionId', 'deltaPomodoros'] } },
          analysisNarrative: { type: Type.STRING },
          aiSuggested: { type: Type.BOOLEAN },
          disclaimer: { type: Type.STRING },
        },
        ['overallGap', 'weakestSection', 'recommendedWeeklyShift', 'analysisNarrative', 'aiSuggested', 'disclaimer']),
      input,
    );
    if (!parsed) return json(502, { error: 'AI_OUTPUT_INVALID', fallback: true }, cors);
    return json(200, {
      ...parsed,
      aiSuggested: true,
      disclaimer: isAr
        ? 'مقترح بالذكاء الاصطناعي، يرجى مراجعة النتائج والتحقق'
        : 'AI suggested, verify with your official score report',
    }, cors);
  } catch (err) {
    void err;
    return aiError();
  }
}
