/* ui.js: HUD text, tooltips, Reality Check, presenter notes, synthesised sound. */
(function () {
  'use strict';
  var U = window.UTB, F = U.FACTS;
  var $ = function (id) { return document.getElementById(id); };
  var UI = U.UI = { overlay: null };

  /* ---- tooltips: terms in HUD text become focusable spans; SVG labels carry data-term ---- */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  UI.termify = function (text) {
    var out = esc(text), marks = [];
    F.termOrder.forEach(function (k) {
      var re = new RegExp('(^|[^A-Za-z-])(' + k.replace(/[-]/g, '[- ]') + ')(?![A-Za-z-])', 'i');
      out = out.replace(re, function (m, a, b) { marks.push(b); return a + '\u0001' + (marks.length - 1) + '\u0002'; });
    });
    return out.replace(/\u0001(\d+)\u0002/g, function (m, i) {
      var raw = marks[+i], key = raw.toUpperCase().replace(/WAKE LOCK$/, 'WAKE LOCKS');
      var term = F.terms[key] ? key : (F.terms[key + 'S'] ? key + 'S' : null);
      if (!term) { key = raw.toUpperCase().replace(' ', '-'); term = F.terms[key] ? key : null; }
      return term ? '<span class="term" tabindex="0" data-term="' + term + '">' + raw + '</span>' : raw;
    });
  };
  var tip = null;
  function showTip(el) {
    var k = el.getAttribute('data-term'), t = F.terms[k]; if (!t) return;
    if (el.ownerSVGElement && parseFloat(getComputedStyle(el).opacity) < .5) return;
    tip.textContent = t; tip.classList.add('on');
    var r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    var x = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2));
    var y = r.top - h - 12; if (y < 12) y = r.bottom + 12;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hideTip() { tip.classList.remove('on'); }
  UI.initTips = function () {
    tip = $('tip');
    document.addEventListener('mouseover', function (e) { var t = e.target.closest && e.target.closest('[data-term]'); if (t) showTip(t); });
    document.addEventListener('mouseout', function (e) { var t = e.target.closest && e.target.closest('[data-term]'); if (t) hideTip(); });
    document.addEventListener('focusin', function (e) { var t = e.target.closest && e.target.closest('[data-term]'); if (t) showTip(t); });
    document.addEventListener('focusout', hideTip);
  };

  /* ---- HUD ---- */
  UI.hud = function (i, animate) {
    var s = F.scenes[i], h = $('hud');
    h.classList.remove('wipe'); void h.offsetWidth;
    $('hHead').textContent = s.head; $('hCap').innerHTML = UI.termify(s.cap); $('hTake').innerHTML = UI.termify(s.take);
    if (animate !== false) h.classList.add('wipe');
    var dots = $('dots').children; for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('on', k === i);
    $('tbSheet').textContent = 'SHEET ' + (i + 1) + ' OF ' + F.scenes.length;
    if (UI.overlay === 'notes') $('notes').textContent = s.notes;
  };
  UI.explore = function (on) {
    document.body.classList.toggle('explore', on);
    $('tbSheet').textContent = on ? 'EXPLORE' : $('tbSheet').textContent;
    $('mPresent').setAttribute('aria-pressed', on ? 'false' : 'true'); $('mExplore').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('mPresent').classList.toggle('on', !on); $('mExplore').classList.toggle('on', on);
  };

  /* ---- Reality Check ---- */
  UI.buildReality = function () {
    var R = F.reality, h = '<h2 id="rTitle">REALITY CHECK</h2><div class="rcols">';
    [['REAL', R.real, 'real'], ['PARTIAL', R.partial, 'partial']].forEach(function (c) {
      h += '<section class="rcol ' + c[2] + '"><h3>' + c[0] + '</h3><ul>' + c[1].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section>';
    });
    $('reality').innerHTML = h + '</div>';
  };
  UI.reality = function (on) {
    if (on) { UI.closeOverlays(); UI.overlay = 'reality'; } else if (UI.overlay === 'reality') UI.overlay = null;
    $('reality').classList.toggle('on', on);
  };
  UI.notes = function (on, text) {
    if (on) { if (UI.overlay === 'reality') $('reality').classList.remove('on'); UI.overlay = 'notes'; $('notes').textContent = text; } else if (UI.overlay === 'notes') UI.overlay = null;
    $('notes').classList.toggle('on', on);
  };
  UI.closeOverlays = function () { $('reality').classList.remove('on'); $('notes').classList.remove('on'); UI.overlay = null; };

  UI.hint = function () {
    var h = $('hint'); h.textContent = F.hint; h.classList.add('on'); setTimeout(function () { h.classList.remove('on'); }, 6000);
  };

  /* ---- synthesised sound (muted by default; context created only after a gesture) ---- */
  var ac = null, muted = true;
  UI.sound = { toggle: function () {
    muted = !muted;
    if (!muted && !ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    $('mSound').setAttribute('aria-pressed', muted ? 'false' : 'true'); $('mSound').classList.toggle('on', !muted);
    if (!muted) UI.sfx('blip'); return !muted;
  } };
  function tone(f, d, type, vol, slide) {
    var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .02);
  }
  function noise(d, vol, fq) {
    var n = Math.floor(ac.sampleRate * d), buf = ac.createBuffer(1, n, ac.sampleRate), a = buf.getChannelData(0);
    for (var i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'bandpass'; f.frequency.value = fq; g.gain.value = vol;
    s.buffer = buf; s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
  }
  var last = {};
  UI.sfx = function (n) {
    if (muted || !ac) return; var now = performance.now(); if (last[n] && now - last[n] < 60) return; last[n] = now;
    if (n === 'blip') tone(880, .09, 'sine', .06, 1320);
    else if (n === 'clank') { tone(180, .16, 'triangle', .12, 90); tone(1200, .05, 'square', .025); }
    else if (n === 'click') tone(520, .05, 'square', .04, 260);
    else if (n === 'buzz') tone(140, .4, 'sawtooth', .08);
    else if (n === 'pop') tone(300, .09, 'sine', .08, 700);
    else if (n === 'thud') tone(90, .3, 'sine', .2, 40);
    else if (n === 'bell') { tone(1320, .5, 'sine', .06); tone(1760, .4, 'sine', .03); }
    else if (n === 'paper') noise(.35, .08, 3000);
  };
})();
