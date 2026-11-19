/* HUD, tooltips, dials, switches, overlays. */
(function () {
  'use strict';
  var F = window.FACTS, $ = function (id) { return document.getElementById(id); };
  var UI = { onDial: null };
  var terms = Object.keys(F.terms).sort(function (a, b) { return b.length - a.length; });
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  UI.termify = function (txt) {
    var out = esc(txt);
    terms.forEach(function (t) {
      var re = new RegExp('(^|[^\\w>-])(' + t.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + ')(?![\\w<-])');
      out = out.replace(re, function (m, a, b) { return a + '<span class="tip" tabindex="0" data-term="' + b + '">' + b + '</span>'; });
    });
    return out;
  };
  /* tooltip */
  var tip = $('tip');
  function showTip(el) {
    var d = F.terms[el.getAttribute('data-term')]; if (!d) return;
    tip.innerHTML = '<b>' + d[0] + '</b>' + d[1]; var r = el.getBoundingClientRect();
    tip.style.left = Math.max(8, Math.min(window.innerWidth - 330, r.left)) + 'px';
    tip.style.top = Math.min(window.innerHeight - 90, r.bottom + 8) + 'px'; tip.className = 'on';
  }
  document.addEventListener('mouseover', function (e) { var t = e.target.closest && e.target.closest('[data-term]'); if (t) showTip(t); });
  document.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest('[data-term]')) tip.className = ''; });
  document.addEventListener('focusin', function (e) { var t = e.target.closest && e.target.closest('[data-term]'); if (t) showTip(t); });
  document.addEventListener('focusout', function () { tip.className = ''; });

  /* copy block */
  UI.setCopy = function (sc, explore) {
    $('head').textContent = sc.head; $('cap').innerHTML = UI.termify(sc.cap); $('take').innerHTML = UI.termify(sc.take);
    var L = $('labels'); L.innerHTML = '';
    sc.labels.forEach(function (l) { var s = document.createElement('span'); s.className = 'tag'; s.tabIndex = 0; s.setAttribute('data-term', l); s.textContent = l; L.appendChild(s); });
  };
  var bt = 0;
  UI.say = function (txt) { var b = $('bubble'); b.textContent = txt; b.className = 'on'; clearTimeout(bt); bt = setTimeout(function () { b.className = ''; }, 5200); };

  /* rovy placement */
  UI.rovy = function (big) {
    var r = $('rovy'), w = innerWidth;
    if (big) { r.style.width = r.style.height = Math.min(innerHeight * 0.62, 520) + 'px'; r.style.left = (w * 0.42) + 'px'; r.style.bottom = '12vh'; }
    else { var s = w < 760 ? 110 : 190; r.style.width = r.style.height = s + 'px'; r.style.left = (w < 760 ? w - s - 10 : w - s - 24) + 'px'; r.style.bottom = (w < 760 ? '300px' : '66px'); }
  };

  /* dots */
  UI.dots = function (n, go) {
    var d = $('dots'); d.innerHTML = '';
    for (var i = 0; i < n; i++) (function (i) { var b = document.createElement('button'); b.setAttribute('aria-label', 'Scene ' + (i + 1)); b.onclick = function (e) { e.stopPropagation(); go(i); }; d.appendChild(b); })(i);
  };
  UI.activeDot = function (i) { var k = $('dots').children; for (var j = 0; j < k.length; j++) k[j].className = j === i ? 'on' : ''; };

  /* dials */
  var D = {
    kp: { lab: 'Kp', get: function (s) { return (s.kp - 0.1) / 3.4; }, set: function (s, v) { s.kp = 0.1 + v * 3.4; } },
    ki: { lab: 'Ki', get: function (s) { return s.ki / 0.3; }, set: function (s, v) { s.ki = v * 0.3; } },
    kd: { lab: 'Kd', get: function (s) { return s.kd / 0.5; }, set: function (s, v) { s.kd = v * 0.5; } },
    noise: { lab: 'Noise', get: function (s) { return s.noise / 0.12; }, set: function (s, v) { s.noise = v * 0.12; } }
  };
  var dialEls = {};
  function ang(v) { return -135 + v * 270; }
  function paint(k) {
    var e = dialEls[k], v = e.v; e.needle.setAttribute('transform', 'rotate(' + ang(v) + ' 39 39)');
    e.root.setAttribute('aria-valuenow', Math.round(v * 100));
  }
  UI.buildDials = function (sim) {
    var box = $('dials'); box.innerHTML = '';
    Object.keys(D).forEach(function (k, idx) {
      var root = document.createElement('div'); root.className = 'dial'; root.tabIndex = 0; root.setAttribute('role', 'slider'); root.setAttribute('aria-label', D[k].lab); root.setAttribute('aria-valuemin', 0); root.setAttribute('aria-valuemax', 100);
      var ticks = ''; for (var i = 0; i <= 10; i++) { var a = (-135 + i * 27) * Math.PI / 180; ticks += '<line x1="' + (39 + Math.sin(a) * 33) + '" y1="' + (39 - Math.cos(a) * 33) + '" x2="' + (39 + Math.sin(a) * 38) + '" y2="' + (39 - Math.cos(a) * 38) + '" stroke="#F2C894" stroke-width="2"/>'; }
      root.innerHTML = '<svg viewBox="0 0 78 78">' + ticks + '<circle cx="39" cy="39" r="26" fill="#1A0F0A" stroke="#F2C894" stroke-width="3"/><g class="needle"><line x1="39" y1="39" x2="39" y2="17" stroke="#FFB347" stroke-width="5" stroke-linecap="round"/><circle cx="39" cy="39" r="5" fill="#C1440E"/></g></svg><div class="lab">' + D[k].lab + '</div>';
      box.appendChild(root);
      var e = dialEls[k] = { root: root, needle: root.querySelector('.needle'), v: D[k].get(sim) };
      var set = function (v, quiet) { v = Math.max(0, Math.min(1, Math.round(v * 20) / 20)); if (v !== e.v && !quiet) window.Sound.click(); e.v = v; D[k].set(sim, v); paint(k); };
      var y0, v0;
      root.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); root.setPointerCapture(ev.pointerId); y0 = ev.clientY; v0 = e.v; if (UI.onDial) UI.onDial(); });
      root.addEventListener('pointermove', function (ev) { if (y0 === undefined) return; set(v0 + (y0 - ev.clientY) / 140); });
      root.addEventListener('pointerup', function () { y0 = undefined; });
      root.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowUp' || ev.key === 'ArrowRight') { ev.stopPropagation(); ev.preventDefault(); set(e.v + 0.05); } if (ev.key === 'ArrowDown' || ev.key === 'ArrowLeft') { ev.stopPropagation(); ev.preventDefault(); set(e.v - 0.05); } });
      e.set = set; paint(k);
    });
  };
  UI.syncDials = function (sim) { Object.keys(dialEls).forEach(function (k) { dialEls[k].v = Math.max(0, Math.min(1, D[k].get(sim))); paint(k); }); };
  UI.switches = function (list) {
    var box = $('switches'); box.innerHTML = '';
    list.forEach(function (it) { var b = document.createElement('button'); b.className = 'obj'; b.textContent = it.label; b.onclick = function (e) { e.stopPropagation(); window.Sound.click(); it.fn(b); }; box.appendChild(b); });
  };
  UI.rack = function (dials, sw) { document.body.classList.toggle('rack', !!(dials || sw)); $('dials').style.display = dials ? 'flex' : 'none'; };

  /* reality check */
  UI.buildReality = function () {
    var box = $('reality'), cls = { 'REAL': 'REAL', 'PARTIAL': 'PARTIAL', 'NOT BUILT': 'NBU' }, rot = { 'REAL': -2, 'PARTIAL': 1.5, 'NOT BUILT': -1 }, html = '';
    ['REAL', 'PARTIAL'].forEach(function (k) {
      html += '<div class="col ' + cls[k] + '"><h3>' + k + '</h3><ul>' + F.reality[k].map(function (t, i) { return '<li style="transition-delay:' + (i * 90 + 150) + 'ms">' + UI.termify(t) + '</li>'; }).join('') + '</ul></div>';
    });
    box.innerHTML = html;
  };
  UI.reality = function (on, dock) {
    var r = $('reality'); r.classList.toggle('hidden', !on); r.classList.toggle('full', on && !dock);
    document.body.classList.toggle('docked', !!(on && dock));
    if (on) requestAnimationFrame(function () { r.classList.add('show'); }); else r.classList.remove('show');
  };
  UI.realityOpen = function () { return !$('reality').classList.contains('hidden'); };
  UI.notes = function (txt, toggle) { var n = $('notes'); if (txt !== null) n.textContent = txt; if (toggle) n.classList.toggle('hidden'); return !n.classList.contains('hidden'); };
  UI.notesOpen = function () { return !$('notes').classList.contains('hidden'); };
  UI.hint = function (txt, ms) { var h = $('hint'); h.textContent = txt; h.className = 'on'; setTimeout(function () { h.className = ''; }, ms || 6000); };
  window.UI = UI;
})();
