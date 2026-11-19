/* main.js: boot, render loop, modes, keys, navigation. */
(function () {
  'use strict';
  var U = window.UTB, F = U.FACTS, S = U.Stage, B = U.Bridge, UI = U.UI, Flow = U.Flow, Dir = U.Dir, Labs = U.Labs;
  var $ = function (id) { return document.getElementById(id); };
  var st = { mode: 'present', i: 0 }, last = 0, idleT = 0;

  function boot() {
    Flow.init($('fx')); S.build(); B.init(); B.hookDrops();
    B.hooks.sfx = UI.sfx;
    S.act = function (n) {
      if (n === 'wifi') B.toggleWifi();
      else if (n === 'wake' || n === 'wifilock') { B.toggleLock(); }
      else if (n === 'plug') { if (B.client) B.disconnectClient(); else B.reconnectClient(); }
      else if (Labs.act) Labs.act(n);
    };
    UI.initTips(); UI.buildReality(); Labs.build();
    var dots = $('dots'); F.scenes.forEach(function (s, i) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Scene ' + (i + 1) + ': ' + s.head); b.innerHTML = '<i></i>';
      b.addEventListener('click', function (e) { e.stopPropagation(); setMode('present'); go(i); }); dots.appendChild(b);
    });
    $('badge').textContent = F.badge; $('tbName').textContent = F.title; $('tbBy').textContent = 'DRAWN ' + F.author.toUpperCase();
    $('mPresent').addEventListener('click', function () { setMode('present'); });
    $('mExplore').addEventListener('click', function () { setMode('explore'); });
    $('mSound').addEventListener('click', function () { UI.sound.toggle(); });
    $('mFull').addEventListener('click', fullscreen);
    $('mNotes').addEventListener('click', toggleNotes); $('mReal').addEventListener('click', toggleReal);
    window.addEventListener('resize', function () { Flow.resize(); S.resize(); });
    document.addEventListener('visibilitychange', function () { last = 0; });
    var hubIn = /[?&]from=hub/.test(location.search);
    var m = /^#scene-(\d)$/.exec(location.hash); var start = m ? Math.min(F.scenes.length, Math.max(1, +m[1])) - 1 : 0;
    window.addEventListener('hashchange', function () { var mm = /^#scene-(\d)$/.exec(location.hash); if (mm && st.mode === 'present') { var n = +mm[1] - 1; if (n >= 0 && n < F.scenes.length && n !== st.i) go(n, true); } });
    S.moveTo(U.Scenes[start].cam, 0);
    go(start, false, true);
    if (hubIn) entry(); else UI.hint();
    requestAnimationFrame(loop);
    bindInput();
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    var dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now;
    S.tick(now, dt); B.update(dt); Flow.update(dt);
    var o = S.origin(); Flow.render(S.cam, o.x, o.y, S.shk.x, S.shk.y, now / 1000);
    idleT += dt; if (idleT > 3) document.body.classList.add('idle');
  }

  function go(i, fromHash, first) {
    i = Math.max(0, Math.min(F.scenes.length - 1, i));
    Dir.clear(); UI.closeOverlays(); st.i = i; Labs.close && Labs.close();
    var sc = U.Scenes[i]; S.scene(i + 1); UI.hud(i, !first);
    if (!first || true) S.moveTo(sc.cam, first ? 0 : 1200);
    if (!first) UI.sfx('paper');
    try { if (location.hash !== '#scene-' + (i + 1)) location.replace('#scene-' + (i + 1)); } catch (e) {}
    sc.enter();
  }
  function setMode(m) {
    if (m === st.mode) return; st.mode = m; UI.closeOverlays(); Dir.clear();
    if (m === 'explore') { UI.explore(true); Labs.open('pipes'); }
    else { UI.explore(false); Labs.close(); go(st.i); }
  }
  function toggleReal() { UI.reality(UI.overlay !== 'reality'); }
  function toggleNotes() { UI.notes(UI.overlay !== 'notes', st.mode === 'present' ? F.scenes[st.i].notes : 'Explore mode. Pick a lab, poke the stage.'); }
  function fullscreen() { var d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen(); }
  function entry() {
    var s = $('stage'); document.body.classList.add('entering');
    if (!s.animate || S.reduced) { document.body.classList.remove('entering'); return; }
    var a = s.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
    var t = $('tube'); t.animate([{ transform: 'translateY(-60px)' }, { transform: 'translateY(' + innerHeight + 'px)' }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
    a.onfinish = function () { document.body.classList.remove('entering'); UI.hint(); };
  }

  function bindInput() {
    function wake() { idleT = 0; document.body.classList.remove('idle'); }
    ['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(function (e) { window.addEventListener(e, wake, { passive: true }); });
    window.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var a = document.activeElement, typing = a && (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.tagName === 'TEXTAREA');
      if (typing) { if (e.key === 'Escape') a.blur(); return; }
      var onInt = a && (a.tagName === 'BUTTON' || a.tagName === 'A' || (a.classList && a.classList.contains('int')));
      var k = e.key, p = st.mode === 'present';
      if (k === 'Escape') { if (UI.overlay) UI.closeOverlays(); else if (document.fullscreenElement) document.exitFullscreen(); else location.href = '../../index.html?from=usb-tcp-bridge'; e.preventDefault(); return; }
      if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !onInt)) { if (p) { go(st.i + 1); e.preventDefault(); } else if (k !== ' ') {} return; }
      if (k === 'ArrowLeft' || k === 'PageUp') { if (p) { go(st.i - 1); e.preventDefault(); } return; }
      if (k === 'Enter' && !onInt && p) { e.preventDefault(); go(st.i); return; }
      var l = k.toLowerCase();
      if (l === 'p') setMode(p ? 'explore' : 'present');
      else if (l === 'r') toggleReal(); else if (l === 't') toggleNotes();
      else if (l === 'm') UI.sound.toggle(); else if (l === 'f') fullscreen();
    });
    var stage = $('stage'), sx = 0, sy = 0;
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (st.mode === 'present' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { go(st.i + (dx < 0 ? 1 : -1)); } });
    document.addEventListener('click', function (e) {
      if (st.mode !== 'present') return;
      if (e.target.closest('.int,button,input,a,.panel,#reality,#notes,.term,[data-term],#dots')) return;
      if (e.clientX > innerWidth * .7) go(st.i + 1);
    });
    /* explore: drag to pan, wheel to zoom */
    var pan = null;
    stage.addEventListener('pointerdown', function (e) { if (st.mode !== 'explore' || e.target.closest('.int,[data-term]')) return; pan = { x: e.clientX, y: e.clientY, cx: S.cam.x, cy: S.cam.y }; });
    window.addEventListener('pointermove', function (e) { if (!pan) return; S.cam.x = pan.cx - (e.clientX - pan.x) / S.cam.z; S.cam.y = pan.cy - (e.clientY - pan.y) / S.cam.z; S.target = null; });
    window.addEventListener('pointerup', function () { pan = null; });
    stage.addEventListener('wheel', function (e) { if (st.mode !== 'explore') return; S.cam.z = Math.max(.3, Math.min(1.8, S.cam.z * (e.deltaY < 0 ? 1.08 : .93))); }, { passive: true });
  }
  window.addEventListener('DOMContentLoaded', boot);
})();
