/* Boot, navigation, modes, keys, overlays. */
(function () {
  'use strict';
  var F = window.FACTS, $ = function (id) { return document.getElementById(id); }, D = window.Draw, S = D.sim, Sc = window.Scenes, UI = window.UI, St = window.Stage;
  var body = document.body, idx = 0, mode = 'present', tab = 0, t0 = 0, cur = { auto: true }, started = 0, simBadge = $('simbadge');
  var BACK = '../../index.html?from=pro-rover';

  function now() { return performance.now() / 1000; }
  function wipe() { if (St.reduce) return; var w = $('wipe'); w.classList.remove('go'); void w.offsetWidth; w.classList.add('go'); }
  function applyScene(i, auto) {
    var sc = Sc[i], data = F.scenes[i]; cur = { auto: auto !== false }; t0 = now(); Sc.resetTouch();
    if (D.view) D.fx.burst(0, 0, 0, 0, 0);
    sc.setup(); St.go(sc.cam);
    $('sun').classList.toggle('open', !(sc.sunClosed && cur.auto && mode === 'present'));
    var cnt = $('count'); cnt.textContent = '3'; cnt.style.opacity = 0.9; cnt.style.display = sc.sunClosed ? '' : 'none';
    UI.rovy(!!(sc.sunClosed && mode === 'present'));
    if (!sc.sunClosed) setTimeout(function () { UI.say(data.rovy); }, 900);
    UI.reality(!!sc.dock && mode === 'present', true);
    UI.notes(data.note, false);
    if (mode === 'present') UI.setCopy(data); else UI.setCopy({ head: Sc.explore[tab].head || data.head, cap: '', take: '', labels: Sc.explore[tab].labels || data.labels });
    simBadge.className = '';
    UI.activeDot(i);
  }
  function go(i, nowipe) {
    i = Math.max(0, Math.min(Sc.length - 1, i)); if (mode !== 'present') return;
    var changed = i !== idx; idx = i; if (changed && !nowipe) { wipe(); window.Sound.static_(); }
    history.replaceState(null, '', '#scene-' + (i + 1));
    applyScene(i, true);
  }
  function setTab(k) {
    tab = k; var e = Sc.explore[k]; var kids = $('explore-tabs').children; for (var j = 0; j < kids.length; j++) kids[j].className = 'obj' + (j === k ? ' on' : '');
    wipe(); var sceneIdx = e.idx === undefined ? 3 : e.idx, sc = Sc[sceneIdx];
    if (e.setup) { e.setup(); St.go(e.cam); idx = 3; } else { sc.setup(); St.go(sc.cam); idx = sceneIdx; }
    cur = { auto: false }; UI.setCopy({ head: e.head || F.scenes[idx].head, cap: '', take: '', labels: e.labels || F.scenes[idx].labels });
    $('sun').classList.add('open'); UI.reality(false); UI.rovy(false); UI.say(k === 0 ? 'Click the field. Drag crates.' : F.scenes[idx].rovy);
  }
  function setMode(m) {
    mode = m; body.classList.toggle('explore', m === 'explore'); $('stage').className = 'mode-' + m; $('modebtn').textContent = m === 'present' ? 'PRESENT' : 'EXPLORE'; $('modebtn').classList.toggle('on', m === 'explore');
    if (m === 'explore') {
      var T = $('explore-tabs'); T.innerHTML = '';
      Sc.explore.forEach(function (e, k) { var b = document.createElement('button'); b.className = 'obj'; b.textContent = e.label; b.onclick = function (ev) { ev.stopPropagation(); setTab(k); }; T.appendChild(b); });
      $('dots').style.display = 'none'; setTab(tab);
    } else { $('dots').style.display = ''; $('explore-tabs').innerHTML = ''; go(idx, true); }
  }

  /* frame loop hook */
  D.hooks.push(function (dt) {
    var t = now() - t0, sc = Sc[idx];
    if (mode === 'present') sc.tick(t, cur); else if (Sc.explore[tab].setup === undefined && sc.tick) sc.tick(t, cur);
    if (t - (D.lastClock || 0) > 1) { D.lastClock = t; var s = Math.floor(now() - started), m = Math.floor(s / 60); $('clocktxt').textContent = 'T+' + (m < 10 ? '0' : '') + m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
  });

  /* dust motes in screen space */
  (function () {
    var cv = $('dust'), ctx = cv.getContext('2d'), P = [], n = 40, k;
    function rs() { cv.width = innerWidth; cv.height = innerHeight; } rs(); addEventListener('resize', rs);
    for (k = 0; k < n; k++) P.push([Math.random(), Math.random(), 0.2 + Math.random() * 0.8, Math.random() * 6]);
    D.afterFrame = function (dt, T) {
      if (St.reduce) return; ctx.clearRect(0, 0, cv.width, cv.height); ctx.fillStyle = 'rgba(242,200,148,.35)';
      for (var i = 0; i < n; i++) { var p = P[i]; p[0] += dt * 0.012 * p[2]; p[1] += Math.sin(T + p[3]) * dt * 0.004; if (p[0] > 1.02) p[0] = -0.02; ctx.fillRect(p[0] * cv.width, p[1] * cv.height, 2 * p[2] + 1, 2 * p[2] + 1); }
    };
  })();

  /* impacts + E-STOP */
  function shake() { if (St.reduce) return; var s = $('stage'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }
  D.onImpact = function (st) { shake(); window.Sound.alarm(); var v = $('vignette'); v.className = 'on'; setTimeout(function () { if (!S.safety.manual) v.className = ''; }, 700); };
  D.onPing = function () { if (idx === 1 && mode === 'present') window.Sound.ping(); };
  $('estop').addEventListener('click', function (e) {
    e.stopPropagation(); var m = !S.safety.manual; S.safety.manual = m; D.rig.sf.manual = m;
    this.classList.toggle('hot', m); $('vignette').className = m ? 'on' : ''; if (m) { shake(); window.Sound.alarm(); UI.say('E-STOP. Everything frozen.'); } else UI.say('Released. Rolling.');
    Sc.touch();
  });

  /* canvas pointer interaction */
  function loc(e, el, w, h) { var r = el.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * w, (e.clientY - r.top) / r.height * h]; }
  var drag = null, ppm = D.ppm;
  D.A.cv.addEventListener('pointerdown', function (e) {
    e.stopPropagation(); var p = loc(e, D.A.cv, D.A.w, D.A.h), mx = p[0] / ppm, my = p[1] / ppm; Sc.touch();
    for (var i = S.obs.length - 1; i >= 0; i--) { var o = S.obs[i]; if (Math.hypot(o.x - mx, o.y - my) < o.r * 1.5) { drag = o; D.A.cv.setPointerCapture(e.pointerId); return; } }
    if (mode === 'explore' || idx === 3) {
      if (S.state === 'ARRIVED' || S.state === 'IDLE' || !S.wp.length) { S.wp = [[mx, my]]; S.wpi = 0; S.state = 'DRIVE'; S.tn = 0; S.I = 0; } else S.wp.push([mx, my]);
      window.Sound.click();
    }
  });
  D.A.cv.addEventListener('pointermove', function (e) { if (!drag) return; var p = loc(e, D.A.cv, D.A.w, D.A.h); drag.x = Math.max(0.5, Math.min(S.W - 0.5, p[0] / ppm)); drag.y = Math.max(0.5, Math.min(S.H - 0.5, p[1] / ppm)); drag.squash = 0.05; });
  D.A.cv.addEventListener('pointerup', function () { drag = null; });
  var cdrag = false;
  function cset(e) { var p = loc(e, D.cw.cv, D.cw.w, D.cw.h); D.rig.target = -1; D.rig.d = Math.max(2, Math.min(100, (p[0] - 78 - 18) / 2.2)); }
  D.cw.cv.addEventListener('pointerdown', function (e) { e.stopPropagation(); Sc.touch(); var p = loc(e, D.cw.cv, D.cw.w, D.cw.h); if (p[1] > 240 && p[0] < 340) { cdrag = true; D.cw.cv.setPointerCapture(e.pointerId); cset(e); } });
  D.cw.cv.addEventListener('pointermove', function (e) { if (cdrag) cset(e); });
  D.cw.cv.addEventListener('pointerup', function () { cdrag = false; });
  D.B.cv.addEventListener('pointerdown', function (e) { e.stopPropagation(); Sc.touch(); if (D.view.bMode === 'link') Sc.link(); });

  /* navigation */
  function interactive(el) { return el.closest && el.closest('canvas,.obj,button,a,#dials,#rack,#reality,#notes,#explore-tabs,#dots'); }
  $('stage').addEventListener('click', function (e) { if (mode !== 'present' || interactive(e.target)) return; if (e.clientX > innerWidth * 0.7) go(idx + 1); });
  var sx = 0, sy = 0;
  addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1)); }, { passive: true });
  function closeOverlays() {
    var closed = false;
    if (UI.notesOpen()) { UI.notes(null, true); closed = true; }
    if (UI.realityOpen() && !(Sc[idx].dock && mode === 'present')) { UI.reality(false); closed = true; }
    return closed;
  }
  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown') { if (e.target.closest && e.target.closest('.dial')) return; e.preventDefault(); go(idx + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { if (e.target.closest && e.target.closest('.dial')) return; e.preventDefault(); go(idx - 1); }
    else if (k === 'Enter' && e.target === document.body) { if (mode === 'present') applyScene(idx, true); }
    else if (k === 'p' || k === 'P') setMode(mode === 'present' ? 'explore' : 'present');
    else if (k === 'r' || k === 'R') { if (!(Sc[idx].dock && mode === 'present')) UI.reality(!UI.realityOpen(), false); }
    else if (k === 't' || k === 'T') UI.notes(null, true);
    else if (k === 'm' || k === 'M') { $('soundbtn').textContent = window.Sound.toggle() ? 'SND ON' : 'SND OFF'; }
    else if (k === 'f' || k === 'F') { var d = document; if (d.fullscreenElement) d.exitFullscreen(); else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen(); }
    else if (k === 'Escape') { if (!closeOverlays()) { if (mode === 'explore') setMode('present'); else location.href = BACK; } }
  });
  $('modebtn').onclick = function () { setMode(mode === 'present' ? 'explore' : 'present'); };
  function syncSoundBtn() { var on = window.Sound.sync(); $('soundbtn').textContent = on ? 'SND ON' : 'SND OFF'; }
  syncSoundBtn();
  window.addEventListener('pageshow', syncSoundBtn);
  $('soundbtn').onclick = function () { this.textContent = window.Sound.toggle() ? 'SND ON' : 'SND OFF'; };
  $('notebtn').onclick = function () { UI.notes(null, true); };
  $('realbtn').onclick = function () { if (UI.realityOpen() && !(Sc[idx].dock && mode === 'present')) UI.reality(false); else UI.reality(true, Sc[idx].dock && mode === 'present'); };
  $('rovy').addEventListener('click', function () { window.Sound.beep(); });

  /* idle cursor */
  var it; function wake() { body.classList.remove('idle'); clearTimeout(it); it = setTimeout(function () { body.classList.add('idle'); }, 3000); }
  addEventListener('mousemove', wake); addEventListener('keydown', wake); wake();

  /* boot */
  St.resize(); UI.buildReality(); UI.dots(F.scenes.length, go); started = now();
  if (/from=hub/.test(location.search)) { body.classList.add('poweron'); setTimeout(function () { body.classList.remove('poweron'); window.Sound.beep(); }, 760); }
  var m = /#scene-(\d+)/.exec(location.hash); idx = m ? Math.max(0, Math.min(Sc.length - 1, +m[1] - 1)) : 0;
  window.addEventListener('hashchange', function () { var h = /#scene-(\d+)/.exec(location.hash); if (h && mode === 'present') { var n = Math.max(0, Math.min(Sc.length - 1, +h[1] - 1)); if (n !== idx) go(n); } });
  D.start(); applyScene(idx, true); UI.hint(F.keys, 6000);
})();
