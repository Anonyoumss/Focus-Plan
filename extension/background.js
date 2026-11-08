/* Focus Plan Companion — background entry.
 * Chrome MV3: classic service worker, loads core via importScripts.
 * Firefox MV3: event page where manifest lists src/core.js first, so
 * FocusCore is already global; importScripts is guarded.
 */
if (typeof importScripts === 'function') {
  try { importScripts('src/core.js'); } catch (e) { /* core already loaded */ }
}
(function () {
  'use strict';
  var C = globalThis.FocusCore;
  var STATE_KEY = 'fpState';
  var ALARM = 'fp-tick';

  function load(cb) {
    chrome.storage.local.get(STATE_KEY, function (r) {
      var s = r && r[STATE_KEY];
      cb(s && s.version === 1 ? s : C.defaultState());
    });
  }
  function save(state, cb) {
    var o = {}; o[STATE_KEY] = state;
    chrome.storage.local.set(o, cb || function () {});
  }
  function originOf(sender) {
    try { return new URL(sender && sender.url || '').origin; } catch (e) { return ''; }
  }

  // ---- tab observation ----
  function observeActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var t = tabs && tabs[0];
      if (!t || !t.url) return;
      load(function (st) {
        var now = Date.now();
        var r = C.applyEvent(st, { type: 'observeUrl', url: t.url }, now);
        save(r.state, function () { runEffects(r.effects); });
      });
    });
  }

  function runEffects(effects) {
    (effects || []).forEach(function (e) {
      if (e.type === 'nudge') {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-128.png',
          title: 'Focus Plan',
          message: 'Off-task site: ' + e.host + '. Gently return to your study list?',
        });
      } else if (e.type === 'export') {
        // handled by caller via sendResponse path
      }
    });
  }

  chrome.tabs.onActivated.addListener(observeActiveTab);
  chrome.tabs.onUpdated.addListener(function (id, info, tab) {
    if (info.status === 'complete' && tab && tab.active) observeActiveTab();
  });
  chrome.alarms.create(ALARM, { periodInMinutes: 0.5 });
  chrome.alarms.onAlarm.addListener(function (a) {
    if (a.name !== ALARM) return;
    load(function (st) {
      var now = Date.now();
      var r = C.applyEvent(st, { type: 'tick' }, now);
      save(r.state, function () { runEffects(r.effects); });
    });
  });

  // ---- external messages from the Focus Plan web app ----
  chrome.runtime.onMessageExternal.addListener(function (msg, sender, sendResponse) {
    var origin = originOf(sender);
    load(function (st) {
      var trusted = (st.trustedOrigins || []).indexOf(origin) !== -1;
      var now = Date.now();
      var reply = { ok: false };

      if (msg && msg.type === 'ping') {
        reply = { ok: trusted, app: 'focus-plan-companion', version: 1, trusted: trusted };
        sendResponse(reply); return;
      }
      if (!trusted) { sendResponse(reply); return; }

      switch (msg.type) {
        case 'session': {
          var ev = msg.state === 'running' ? 'sessionStart' : msg.state === 'paused' ? 'sessionPause' : 'sessionEnd';
          var r = C.applyEvent(st, { type: ev, id: msg.sessionId }, now);
          save(r.state, function () { sendResponse({ ok: true }); });
          return true; // async
        }
        case 'pull': {
          var snap = C.snapshot(st, now);
          var r2 = C.applyEvent(st, { type: 'tick' }, now);
          save(r2.state, function () { sendResponse({ ok: true, data: snap }); });
          return true;
        }
        case 'pushLists': {
          var r3 = C.applyEvent(st, { type: 'setLists', allow: msg.allow || [], block: msg.block || [] }, now);
          save(r3.state, function () { sendResponse({ ok: true, lists: r3.state.lists }); });
          return true;
        }
        case 'setEnabled': {
          var r4 = C.applyEvent(st, { type: 'setEnabled', enabled: !!msg.enabled }, now);
          save(r4.state, function () { sendResponse({ ok: true, enabled: r4.state.enabled }); });
          return true;
        }
        case 'deleteData': {
          var r5 = C.applyEvent(st, { type: 'deleteData' }, now);
          save(r5.state, function () { sendResponse({ ok: true }); });
          return true;
        }
        case 'export': {
          var r6 = C.applyEvent(st, { type: 'exportData' }, now);
          save(r6.state, function () { sendResponse({ ok: true, data: r6.effects[0] && r6.effects[0].data }); });
          return true;
        }
        case 'import': {
          var r7 = C.applyEvent(st, { type: 'importData', data: msg.data }, now);
          save(r7.state, function () { sendResponse({ ok: true }); });
          return true;
        }
        default:
          sendResponse(reply); return;
      }
    });
  });
})();
