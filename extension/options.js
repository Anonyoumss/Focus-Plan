/* Options page — plain script, chrome.* callback style (Chrome + Firefox). */
(function () {
  'use strict';
  var KEY = 'fpState';
  var statusEl = document.getElementById('status');
  function status(t) { statusEl.textContent = t; setTimeout(function(){ statusEl.textContent=''; }, 4000); }
  function load(cb) {
    chrome.storage.local.get(KEY, function (r) {
      cb((r && r[KEY]) || null);
    });
  }
  function save(patch, cb) {
    load(function (st) {
      var base = st || { version: 1, enabled: true, lists: { allow: [], block: [] }, trustedOrigins: [], session: null, seg: null, agg: {}, daily: {}, lastNudgeAt: 0 };
      for (var k in patch) base[k] = patch[k];
      var o = {}; o[KEY] = base;
      chrome.storage.local.set(o, cb || function () {});
    });
  }
  function lines(el) { return el.value.split('\n').map(function(s){return s.trim();}).filter(Boolean); }

  load(function (st) {
    st = st || {};
    document.getElementById('enabled').checked = st.enabled !== false;
    document.getElementById('allow').value = ((st.lists && st.lists.allow) || []).join('\n');
    document.getElementById('block').value = ((st.lists && st.lists.block) || []).join('\n');
    document.getElementById('origins').value = (st.trustedOrigins || []).join('\n');
  });

  document.getElementById('enabled').addEventListener('change', function (e) {
    save({ enabled: e.target.checked }, function () { status('Saved.'); });
  });
  document.getElementById('saveLists').addEventListener('click', function () {
    save({ lists: { allow: lines(document.getElementById('allow')), block: lines(document.getElementById('block')) } }, function () { status('Lists saved.'); });
  });
  document.getElementById('saveOrigins').addEventListener('click', function () {
    save({ trustedOrigins: lines(document.getElementById('origins')) }, function () { status('Origins saved.'); });
  });
  document.getElementById('exportBtn').addEventListener('click', function () {
    load(function (st) {
      var data = { app: 'focus-plan-companion', version: 1, exportedAt: Date.now(),
        lists: st && st.lists, agg: st && st.agg, daily: st && st.daily };
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'focus-plan-data.json'; a.click();
      URL.revokeObjectURL(a.href);
      status('Exported.');
    });
  });
  document.getElementById('importBtn').addEventListener('click', function () {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var data = JSON.parse(rd.result);
        save({ agg: data.agg || {}, daily: data.daily || {}, lists: data.lists || { allow: [], block: [] } }, function () { status('Imported.'); });
      } catch (err) { status('Invalid file.'); }
    };
    rd.readAsText(f); e.target.value = '';
  });
  document.getElementById('deleteBtn').addEventListener('click', function () {
    if (!confirm('Delete all recorded focus-tracking data? Your lists and settings are kept.')) return;
    load(function (st) {
      var keep = st || {};
      var fresh = { version: 1, enabled: keep.enabled !== false, lists: keep.lists || { allow: [], block: [] },
        trustedOrigins: keep.trustedOrigins || [], session: null, seg: null, agg: {}, daily: {}, lastNudgeAt: 0 };
      var o = {}; o[KEY] = fresh;
      chrome.storage.local.set(o, function () { status('Data deleted.'); });
    });
  });
})();
