/* Overlays: tooltips (hover/focus, terms only), Reality Check (R), presenter notes (T), key hint chip. */
(function () {
  var F = window.FACTS, tip = K.$('#tip');
  var ALIAS = [
    ['LangGraph', /LangGraph/g], ['fan-out', /[Ff]an-out/g], ['supervisor', /supervisor/g], ['agent', /\bagents?\b/g], ['PWA', /\bPWA\b/g], ['SOS', /\bSOS\b/g],
    ['SafeWalk', /SafeWalk/g], ['FIR', /\bFIRs?\b/g], ['IPC', /\bIPC\b/g], ['NCRB', /\bNCRB\b/g], ['Haversine', /Haversine/g], ['YOLOv8n', /YOLOv8n/g],
    ['Haar cascade', /Haar cascade/g], ['OCR', /\bOCR\b/g], ['WebSocket', /WebSocket/g], ['MJPEG', /MJPEG/g], ['Twilio', /Twilio/g], ['Tailscale', /Tailscale/g],
    ['VPN', /\bVPN\b/g], ['Firebase', /Firebase/g], ['Phone Link', /Phone Link/g], ['STT', /\bSTT\b/g]
  ];
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  /* wrap known terms in focusable spans. One pass, longest-first, no nested wraps. */
  K.rich = function (str) {
    var s = esc(str), marks = [], i, m, re;
    for (i = 0; i < ALIAS.length; i++) {
      re = new RegExp(ALIAS[i][1].source, 'g');
      while ((m = re.exec(s))) marks.push([m.index, m.index + m[0].length, ALIAS[i][0]]);
    }
    marks.sort(function (a, b) { return a[0] - b[0] || (b[1] - b[0]) - (a[1] - a[0]); });
    var out = '', pos = 0;
    marks.forEach(function (k) { if (k[0] < pos) return; out += s.slice(pos, k[0]) + '<span class="term" tabindex="0" data-term="' + k[2] + '">' + s.slice(k[0], k[1]) + '</span>'; pos = k[1]; });
    return out + s.slice(pos);
  };
  K.term = function (name, label) { return '<span class="term" tabindex="0" data-term="' + name + '">' + esc(label || name) + '</span>'; };
  function show(el) {
    var t = F.terms[el.getAttribute('data-term')]; if (!t) return;
    tip.textContent = t; tip.hidden = false;
    var r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    var x = K.clamp(r.left + r.width / 2 - tw / 2, 8, innerWidth - tw - 8), y = r.top - th - 12; if (y < 8) y = r.bottom + 12;
    tip.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    el.setAttribute('aria-describedby', 'tip');
  }
  function hide() { tip.hidden = true; }
  document.addEventListener('mouseover', function (e) { var t = e.target.closest && e.target.closest('.term'); if (t) show(t); });
  document.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest('.term')) hide(); });
  document.addEventListener('focusin', function (e) { if (e.target.classList && e.target.classList.contains('term')) show(e.target); });
  document.addEventListener('focusout', hide);

  /* ---------- Reality Check ---------- */
  var R = F.reality, rEl = K.$('#reality');
  function col(cls, name, arr) { return '<section class="rc ' + cls + '"><h3>' + name + '</h3><ul>' + arr.map(function (b) { return '<li>' + K.rich(b) + '</li>'; }).join('') + '</ul></section>'; }
  rEl.innerHTML = '<div class="rpage"><h2>' + R.title + '</h2><div class="rcols">' + col('real', R.cols[0], R.real) + col('part', R.cols[1], R.partial) +
    '</div><div class="rethics"><ul>' + R.ethics.map(function (b) { return '<li>' + K.rich(b) + '</li>'; }).join('') + '</ul></div><div class="rstamp">' + R.stamp + '</div></div>';
  K.reality = {
    open: false,
    show: function (embedded) { rEl.hidden = false; rEl.classList.toggle('embedded', !!embedded); rEl.classList.remove('flip'); void rEl.offsetWidth; rEl.classList.add('flip'); K.reality.open = true; },
    hide: function () { rEl.hidden = true; K.reality.open = false; },
    toggle: function () { if (K.reality.open) K.reality.hide(); else K.reality.show(false); }
  };
  /* ---------- notes ---------- */
  var nEl = K.$('#notes'); K.notes = { open: false, set: function (i) { nEl.textContent = F.scenes[i].note; }, toggle: function () { nEl.hidden = !nEl.hidden; K.notes.open = !nEl.hidden; } };
  /* ---------- hint chip (first 6 s) ---------- */
  var hint = K.$('#hint'); hint.textContent = F.ui.hint.join('   \u00B7   ');
  K.hintShow = function () { hint.classList.add('on'); setTimeout(function () { hint.classList.remove('on'); }, 6000); };
})();
