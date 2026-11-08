/* Focus Plan Companion — shared core.
 * Plain classic script (no modules) so the same file works as a Chrome MV3
 * service worker (via importScripts) and a Firefox MV3 event page
 * (listed in manifest background.scripts). All functions are pure: state in,
 * {state, effects} out. Persistence and chrome.* calls live in background.js.
 */
var FocusCore = (function () {
  'use strict';

  var NUDGE_COOLDOWN_MS = 5 * 60 * 1000;
  var TICK_MS = 30 * 1000;
  var DAY_MS = 24 * 60 * 60 * 1000;

  function defaultState() {
    return {
      version: 1,
      enabled: true,
      lists: { allow: [], block: [] },
      trustedOrigins: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:4173',
        'http://localhost:4173',
      ],
      session: null, // {id, startedAt, paused}
      seg: null,     // {host, kind, since} — in-memory only, rebuilt on load
      agg: {},       // sessionId -> {on,off,other,domains:{host:sec},startedAt,endedAt}
      daily: {},     // YYYY-MM-DD -> {on,off,other}
      lastNudgeAt: 0,
    };
  }

  function normalizeEntry(entry) {
    // Accept bare domains or full URLs; store lowercase host without www.
    var s = String(entry || '').trim().toLowerCase();
    if (!s) return '';
    if (s.indexOf('://') === -1 && s.indexOf('/') === -1) s = 'https://' + s;
    try {
      var h = new URL(s).hostname;
      return h.replace(/^www\./, '');
    } catch (e) { return ''; }
  }

  function normalizeHost(url) {
    try {
      var u = new URL(String(url || ''));
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
      var h = u.hostname.toLowerCase();
      if (!h || h === 'localhost' || /^[\d.]+$/.test(h)) return '';
      return h.replace(/^www\./, '');
    } catch (e) { return ''; }
  }

  function matchesList(host, list) {
    if (!host) return false;
    for (var i = 0; i < list.length; i++) {
      var d = normalizeEntry(list[i]);
      if (d && (host === d || host.slice(-(d.length + 1)) === '.' + d)) return true;
    }
    return false;
  }

  function classifyHost(host, lists) {
    if (matchesList(host, lists.block)) return 'off';
    if (matchesList(host, lists.allow)) return 'on';
    return 'other';
  }

  function dayKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function ensureSegAgg(state, sessionId, startedAt) {
    if (!state.agg[sessionId]) {
      state.agg[sessionId] = { on: 0, off: 0, other: 0, domains: {}, startedAt: startedAt, endedAt: null };
    }
    return state.agg[sessionId];
  }

  function accrue(state, now) {
    // Close the current segment into the running session's aggregates.
    if (!state.session || state.session.paused || !state.seg) return false;
    var elapsed = Math.max(0, Math.floor((now - state.seg.since) / 1000));
    if (elapsed <= 0) { state.seg.since = now; return false; }
    state.seg.since = now;
    var agg = ensureSegAgg(state, state.session.id, state.session.startedAt);
    agg[state.seg.kind] = (agg[state.seg.kind] || 0) + elapsed;
    var dk = dayKey(now - elapsed * 1000);
    if (!state.daily[dk]) state.daily[dk] = { on: 0, off: 0, other: 0 };
    state.daily[dk][state.seg.kind] += elapsed;
    var d = state.seg.host;
    agg.domains[d] = (agg.domains[d] || 0) + elapsed;
    return true;
  }

  function maybeNudge(state, now, kind) {
    if (state.session && !state.session.paused && kind === 'off' && now - state.lastNudgeAt > NUDGE_COOLDOWN_MS) {
      state.lastNudgeAt = now;
      return true;
    }
    return false;
  }

  // event: {type, ...}  returns {state, effects:[...]}
  function applyEvent(state, event, now) {
    state = JSON.parse(JSON.stringify(state || defaultState()));
    var effects = [];
    switch (event.type) {
      case 'observeUrl': {
        var host = normalizeHost(event.url);
        if (!host) { accrue(state, now); state.seg = null; break; }
        if (state.seg && state.seg.host === host) break;
        accrue(state, now);
        var kind = classifyHost(host, state.lists);
        state.seg = { host: host, kind: kind, since: now };
        if (maybeNudge(state, now, kind)) effects.push({ type: 'nudge', host: host });
        break;
      }
      case 'tick':
        accrue(state, now);
        break;
      case 'sessionStart': {
        accrue(state, now);
        state.seg = null;
        state.session = { id: String(event.id || 's' + now), startedAt: now, paused: false };
        ensureSegAgg(state, state.session.id, now);
        break;
      }
      case 'sessionPause':
        accrue(state, now);
        state.seg = null;
        if (state.session) state.session.paused = true;
        break;
      case 'sessionEnd':
        accrue(state, now);
        state.seg = null;
        if (state.session) state.session.endedAt = now;
        state.session = null;
        break;
      case 'setEnabled':
        state.enabled = !!event.enabled;
        if (!state.enabled) { accrue(state, now); state.seg = null; if (state.session) state.session.paused = true; }
        break;
      case 'setLists': {
        state.lists = {
          allow: (event.allow || []).map(normalizeEntry).filter(Boolean),
          block: (event.block || []).map(normalizeEntry).filter(Boolean),
        };
        // Reclassify the open segment immediately.
        if (state.seg) {
          var k = classifyHost(state.seg.host, state.lists);
          if (k !== state.seg.kind) { accrue(state, now); state.seg.kind = k; state.seg.since = now; }
        }
        break;
      }
      case 'setTrustedOrigins':
        state.trustedOrigins = (event.origins || []).map(String);
        break;
      case 'deleteData':
        var keep = { enabled: state.enabled, lists: state.lists, trustedOrigins: state.trustedOrigins };
        state = defaultState();
        state.enabled = keep.enabled; state.lists = keep.lists; state.trustedOrigins = keep.trustedOrigins;
        state.seg = null; state.session = null;
        break;
      case 'exportData':
        effects.push({ type: 'export', data: exportData(state) });
        break;
      case 'importData':
        if (event.data && event.data.version === 1) {
          state.agg = event.data.agg || {};
          state.daily = event.data.daily || {};
          state.lists = event.data.lists || state.lists;
        }
        break;
      default:
        break;
    }
    return { state: state, effects: effects };
  }

  function exportData(state) {
    return {
      app: 'focus-plan-companion',
      version: 1,
      exportedAt: Date.now(),
      lists: state.lists,
      agg: state.agg,
      daily: state.daily,
    };
  }

  // Summary sent to the app on 'pull'.
  function snapshot(state, now) {
    accrue(state, now);
    var sessions = Object.keys(state.agg).map(function (id) {
      var a = state.agg[id];
      return {
        id: id,
        startedAt: a.startedAt,
        endedAt: a.endedAt,
        onTaskSec: a.on || 0,
        offTaskSec: a.off || 0,
        otherSec: a.other || 0,
        totalSec: (a.on || 0) + (a.off || 0) + (a.other || 0),
        topDomains: Object.keys(a.domains || {}).sort(function (x, y) { return a.domains[y] - a.domains[x]; }).slice(0, 5),
      };
    }).sort(function (x, y) { return y.startedAt - x.startedAt; });
    var days = Object.keys(state.daily).sort().slice(-14).map(function (k) {
      return { date: k, onTaskSec: state.daily[k].on, offTaskSec: state.daily[k].off, otherSec: state.daily[k].other };
    });
    return {
      enabled: state.enabled,
      lists: state.lists,
      sessionActive: !!(state.session && !state.session.paused),
      sessions: sessions.slice(0, 60),
      daily: days,
    };
  }

  return {
    TICK_MS: TICK_MS,
    defaultState: defaultState,
    normalizeEntry: normalizeEntry,
    normalizeHost: normalizeHost,
    matchesList: matchesList,
    classifyHost: classifyHost,
    dayKey: dayKey,
    applyEvent: applyEvent,
    exportData: exportData,
    snapshot: snapshot,
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = FocusCore;
// Expose on the global object for classic-script contexts (workers, windows)
// and for tests importing this file as a module.
if (typeof globalThis !== 'undefined') globalThis.FocusCore = FocusCore;
