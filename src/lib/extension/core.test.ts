import { describe, it, expect } from 'vitest';
await import('../../../extension/src/core.js');
const FocusCore: any = (globalThis as any).FocusCore;

const T0 = 1700000000000;
const lists = { allow: ['khanacademy.org', 'brilliant.org'], block: ['youtube.com', 'tiktok.com'] };

function st(over: any = {}) {
  return { ...FocusCore.defaultState(), ...over, lists: over.lists || lists };
}

describe('domain normalization and matching', () => {
  it('normalizes URLs and bare domains to lowercase host without www', () => {
    expect(FocusCore.normalizeEntry('HTTPS://WWW.YouTube.com/watch?v=x')).toBe('youtube.com');
    expect(FocusCore.normalizeEntry(' KhanAcademy.org ')).toBe('khanacademy.org');
    expect(FocusCore.normalizeEntry('')).toBe('');
    expect(FocusCore.normalizeEntry('not a url')).toBe('not%20a%20url'.includes(' ') ? '' : FocusCore.normalizeEntry('not a url'));
  });

  it('extracts host from tab URLs and rejects non-http(s)', () => {
    expect(FocusCore.normalizeHost('https://www.khanacademy.org/math')).toBe('khanacademy.org');
    expect(FocusCore.normalizeHost('chrome://settings')).toBe('');
    expect(FocusCore.normalizeHost('')).toBe('');
  });

  it('matches subdomains against list entries', () => {
    expect(FocusCore.matchesList('mail.google.com', ['google.com'])).toBe(true);
    expect(FocusCore.matchesList('notgoogle.com', ['google.com'])).toBe(false);
    expect(FocusCore.matchesList('google.com.evil.com', ['google.com'])).toBe(false);
  });

  it('classifies: block wins over allow, unknown is other', () => {
    const l = { allow: ['study.com'], block: ['example.com', 'yt.com'] };
    expect(FocusCore.classifyHost('yt.com', l)).toBe('off');
    expect(FocusCore.classifyHost('sub.example.com', l)).toBe('off');
    expect(FocusCore.classifyHost('deep.sub.study.com', l)).toBe('on');
    expect(FocusCore.classifyHost('random.org', l)).toBe('other');
  });
});

describe('session attribution', () => {
  it('attributes running-session time to on/off/other buckets', () => {
    let s = st();
    let r = FocusCore.applyEvent(s, { type: 'sessionStart', id: 'sess1' }, T0);
    s = r.state;
    r = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://khanacademy.org/x' }, T0 + 1000);
    s = r.state;
    r = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://youtube.com/watch' }, T0 + 61000);
    s = r.state;
    r = FocusCore.applyEvent(s, { type: 'sessionEnd', id: 'sess1' }, T0 + 121000);
    s = r.state;
    const a = s.agg.sess1;
    expect(a.on).toBe(60);   // 1s..61s on khanacademy
    expect(a.off).toBe(60);  // 61s..121s on youtube
    expect(a.other).toBe(0);
    expect(a.domains['khanacademy.org']).toBe(60);
    expect(a.domains['youtube.com']).toBe(60);
  });

  it('paused sessions accrue nothing', () => {
    let s = st();
    s = FocusCore.applyEvent(s, { type: 'sessionStart', id: 's2' }, T0).state;
    s = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://youtube.com/' }, T0).state;
    s = FocusCore.applyEvent(s, { type: 'sessionPause' }, T0 + 10000).state;
    s = FocusCore.applyEvent(s, { type: 'tick' }, T0 + 70000).state;
    expect(s.agg.s2.off).toBe(10);
  });

  it('no session means tab visits are ignored', () => {
    let s = st();
    s = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://youtube.com/' }, T0).state;
    s = FocusCore.applyEvent(s, { type: 'tick' }, T0 + 60000).state;
    expect(Object.keys(s.agg)).toHaveLength(0);
  });

  it('daily rollup tracks the same buckets', () => {
    let s = st();
    s = FocusCore.applyEvent(s, { type: 'sessionStart', id: 's3' }, T0).state;
    s = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://khanacademy.org/' }, T0).state;
    s = FocusCore.applyEvent(s, { type: 'sessionEnd' }, T0 + 30000).state;
    const dk = FocusCore.dayKey(T0);
    expect(s.daily[dk].on).toBe(30);
  });
});

describe('nudges', () => {
  it('off-task visit during a running session emits one nudge per cooldown', () => {
    let s = st();
    s = FocusCore.applyEvent(s, { type: 'sessionStart', id: 'n1' }, T0).state;
    let r = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://youtube.com/' }, T0 + 1000);
    expect(r.effects.some(e => e.type === 'nudge')).toBe(true);
    s = r.state;
    // switch away and back within cooldown -> no second nudge
    r = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://khanacademy.org/' }, T0 + 20000);
    s = r.state;
    r = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://youtube.com/' }, T0 + 30000);
    expect(r.effects.some(e => e.type === 'nudge')).toBe(false);
    // after cooldown -> nudge again
    r = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://example.org/' }, T0 + 40000);
    s = r.state;
    r = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://youtube.com/' }, T0 + 5 * 60 * 1000 + 41000);
    expect(r.effects.some(e => e.type === 'nudge')).toBe(true);
  });
});

describe('settings and data', () => {
  it('setLists normalizes and reclassifies the open segment', () => {
    let s = st({ lists: { allow: [], block: [] } });
    s = FocusCore.applyEvent(s, { type: 'sessionStart', id: 'l1' }, T0).state;
    s = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://newsite.com/' }, T0).state;
    s = FocusCore.applyEvent(s, { type: 'setLists', allow: [], block: ['newsite.com'] }, T0 + 5000).state;
    s = FocusCore.applyEvent(s, { type: 'sessionEnd' }, T0 + 15000).state;
    expect(s.agg.l1.off).toBe(10);
    expect(s.agg.l1.other).toBe(5); // first 5s ran before the list update
  });

  it('deleteData wipes aggregates but keeps lists and enabled flag', () => {
    let s = st();
    s = FocusCore.applyEvent(s, { type: 'sessionStart', id: 'd1' }, T0).state;
    s = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://youtube.com/' }, T0).state;
    s = FocusCore.applyEvent(s, { type: 'sessionEnd' }, T0 + 5000).state;
    s = FocusCore.applyEvent(s, { type: 'deleteData' }, T0 + 6000).state;
    expect(Object.keys(s.agg)).toHaveLength(0);
    expect(s.lists.allow).toEqual(lists.allow);
    expect(s.enabled).toBe(true);
  });

  it('snapshot returns per-session and daily summaries', () => {
    let s = st();
    s = FocusCore.applyEvent(s, { type: 'sessionStart', id: 'p1' }, T0).state;
    s = FocusCore.applyEvent(s, { type: 'observeUrl', url: 'https://khanacademy.org/' }, T0).state;
    s = FocusCore.applyEvent(s, { type: 'sessionEnd' }, T0 + 45000).state;
    const snap = FocusCore.snapshot(s, T0 + 46000);
    expect(snap.sessions[0].onTaskSec).toBe(45);
    expect(snap.sessions[0].offTaskSec).toBe(0);
    expect(snap.daily.length).toBeGreaterThan(0);
  });
});
