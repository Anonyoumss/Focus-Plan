/* Popup — reads the same fpState snapshot the app pulls. */
(function () {
  'use strict';
  var statusEl = document.getElementById('status');
  var contentEl = document.getElementById('content');

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function fmt(sec) {
    sec = Math.round(sec || 0);
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h > 0 ? h + 'h ' + m + 'm' : m + 'm';
  }

  chrome.runtime.sendMessage({ type: 'pull' }, function (res) {
    var data = res && res.data;
    if (!data) { statusEl.textContent = 'Extension data unavailable.'; return; }
    statusEl.textContent = data.enabled === false ? 'Disabled — flip it on in settings.'
      : data.sessionActive ? 'Tracking this focus session' : 'Idle — tracking starts with a Focus Plan session';

    var today = (data.daily || []).slice(-1)[0];
    var html = '<div class="card">';
    if (today) {
      html += '<div class="row"><span><span class="dot on"></span>On-task</span><b>' + fmt(today.onTaskSec) + '</b></div>';
      html += '<div class="row"><span><span class="dot off"></span>Off-task</span><b>' + fmt(today.offTaskSec) + '</b></div>';
      html += '<div class="row"><span><span class="dot other"></span>Other</span><b>' + fmt(today.otherSec) + '</b></div>';
    } else {
      html += '<div class="empty">No tracked time yet today.</div>';
    }
    html += '</div>';

    var sessions = (data.sessions || []).slice(0, 3);
    if (sessions.length) {
      html += '<div class="card">';
      sessions.forEach(function (s) {
        html += '<div class="session">' + esc(new Date(s.startedAt).toLocaleString()) +
          ' — on ' + fmt(s.onTaskSec) + ', off ' + fmt(s.offTaskSec) + '</div>';
      });
      html += '</div>';
    }
    contentEl.innerHTML = html;
  });
})();
