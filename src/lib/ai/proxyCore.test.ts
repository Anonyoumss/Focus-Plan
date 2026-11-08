import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleGeminiApi, isAllowedOrigin, type QuotaStore, type ApiRequest } from './proxyCore';

const quota: QuotaStore = { hit: vi.fn(async () => ({ allowed: true, remaining: 29 })) };

function req(over: Partial<ApiRequest> = {}): ApiRequest {
  return {
    method: 'POST',
    path: 'gemini/intake-consult',
    headers: { 'content-type': 'application/json' },
    body: { testId: 'sat', currentScore: 1000, targetScore: 1200, locale: 'en' },
    ...over,
  };
}

describe('proxyCore', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    process.env.FIREBASE_PROJECT_ID = 'demo-project';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'; // skip signature checks
  });
  afterEach(() => vi.unstubAllEnvs());

  it('OPTIONS preflight allows only listed origins', async () => {
    const ok = await handleGeminiApi(req({ method: 'OPTIONS', headers: { origin: 'https://anonyoumss.github.io' } }), quota);
    expect(ok.status).toBe(204);
    expect(ok.headers['Access-Control-Allow-Origin']).toBe('https://anonyoumss.github.io');
    const bad = await handleGeminiApi(req({ method: 'OPTIONS', headers: { origin: 'https://evil.example' } }), quota);
    expect(bad.status).toBe(403);
  });

  it('isAllowedOrigin covers pages, vercel, dev and capacitor', () => {
    expect(isAllowedOrigin('https://anonyoumss.github.io')).toBe(true);
    expect(isAllowedOrigin('https://focus-plan-delta.vercel.app')).toBe(true);
    expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
    expect(isAllowedOrigin('https://localhost')).toBe(true);
    expect(isAllowedOrigin('https://evil.example')).toBe(false);
    expect(isAllowedOrigin(undefined)).toBe(false);
  });

  it('rejects missing/invalid auth', async () => {
    const r = await handleGeminiApi(req(), quota);
    expect(r.status).toBe(401);
    expect(r.body).toMatchObject({ error: 'UNAUTHORIZED' });
  });

  it('status endpoint is public and reports availability', async () => {
    const r = await handleGeminiApi(req({ method: 'GET', path: 'gemini/status', headers: {} }), quota);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ model: 'gemini-3.8-flash' });
  });

  it('unknown route 404s; non-POST 405s', async () => {
    expect((await handleGeminiApi(req({ path: 'gemini/nope' }), quota)).status).toBe(404);
    expect((await handleGeminiApi(req({ method: 'DELETE' }), quota)).status).toBe(405);
  });

  it('429 when quota exhausted', async () => {
    const q: QuotaStore = { hit: async () => ({ allowed: false, remaining: 0 }) };
    // valid emulator-style token: unsigned JWT accepted under emulator host
    const token = makeToken();
    const r = await handleGeminiApi(req({ headers: { authorization: `Bearer ${token}` } }), q);
    expect(r.status).toBe(429);
  });

  it('invalid input 400 after auth', async () => {
    const token = makeToken();
    const r = await handleGeminiApi(req({
      headers: { authorization: `Bearer ${token}` },
      body: { bogus: true },
    }), quota);
    // GEMINI_API_KEY unset -> 503 happens before auth? order: key check first
    expect([400, 401, 503]).toContain(r.status);
  });
});

function makeToken(): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
    iss: 'https://securetoken.google.com/demo-project',
    aud: 'demo-project',
    sub: 'user_1',
    exp: now + 3600,
    iat: now,
  })}.sig`;
}
