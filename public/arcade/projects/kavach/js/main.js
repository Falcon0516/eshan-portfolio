/* Boot, modes, keys, navigation, main loop. */
(function () {
  var F = window.FACTS, $ = K.$, app = $('#app'), mode = 'present', last = performance.now(), idleT = 0;
  $('#arcade').textContent = F.ui.arcade; $('#sim').textContent = F.ui.sim;
  var btnP = $('#btnP'); function setBtn() { btnP.textContent = mode === 'present' ? 'P ' + F.ui.explore : 'P ' + F.ui.present; }
  setBtn();
  function setMode(m) {
    mode = m; app.setAttribute('data-mode', m); setBtn();
    if (m === 'explore') { K.reality.hide(); K.explore.show(); } else K.explore.hide();
  }
  function overlayOpen() { return K.reality.open && !$('#reality').classList.contains('embedded') || K.notes.open; }
  function esc() {
    if (K.reality.open && !$('#reality').classList.contains('embedded')) { K.reality.hide(); return; }
    if (K.notes.open) { K.notes.toggle(); return; }
    if (mode === 'explore') { setMode('present'); return; }
    location.href = $('#arcade').getAttribute('href');
  }
  function syncSoundBtn() { var on = !!K.audio.on; $('#btnM').classList.toggle('on', on); $('#btnM').setAttribute('aria-pressed', on); }
  function sound() { var on = K.audio.toggle(); syncSoundBtn(); }
  syncSoundBtn();
  window.addEventListener('pageshow', function () { try { K.audio.on = localStorage.getItem('arc_snd') === '1'; } catch (e) {} syncSoundBtn(); });
  function full() { var d = document; if (!d.fullscreenElement && !d.webkitFullscreenElement) { (app.requestFullscreen || app.webkitRequestFullscreen || function () { }).call(app); } else { (d.exitFullscreen || d.webkitExitFullscreen).call(d); } }
  function R() { if (K.reality.open && $('#reality').classList.contains('embedded')) return; K.reality.toggle(); }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return; var k = e.key, tgt = e.target;
    if (tgt && (tgt.tagName === 'INPUT') && (k === ' ' || k.indexOf('Arrow') === 0)) return;
    if (k === 'Escape') { esc(); return; }
    if (k === 'p' || k === 'P') { setMode(mode === 'present' ? 'explore' : 'present'); return; }
    if (k === 'r' || k === 'R') { R(); return; }
    if (k === 't' || k === 'T') { K.notes.toggle(); return; }
    if (k === 'm' || k === 'M') { sound(); return; }
    if (k === 'f' || k === 'F') { full(); return; }
    if (mode !== 'present') return;
    if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !(tgt && tgt.tagName === 'BUTTON'))) { e.preventDefault(); K.scene.next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); K.scene.prev(); }
    else if (k === 'Enter' && !(tgt && (tgt.tagName === 'BUTTON' || tgt.classList.contains('tp')))) { K.scene.replay(); }
    else if (k === 'Home') K.scene.go(0); else if (k === 'End') K.scene.go(K.scene.n - 1);
  });
  btnP.addEventListener('click', function () { setMode(mode === 'present' ? 'explore' : 'present'); });
  $('#btnR').addEventListener('click', R); $('#btnT').addEventListener('click', function () { K.notes.toggle(); }); $('#btnM').addEventListener('click', sound); $('#btnF').addEventListener('click', full);
  function interactive(t) { return t.closest && t.closest('[data-int],button,a,input,label,.term,#reality,#explore,#notes'); }
  document.addEventListener('click', function (e) {
    if (mode !== 'present' || interactive(e.target)) return;
    if (e.clientX > innerWidth * 0.7) K.scene.next(); else if (e.clientX < innerWidth * 0.12) K.scene.prev();
  });
  $('#sosBtn').addEventListener('click', function () { if (K.scene.i === 2) K.scene.replay(); });
  var sx = 0, sy = 0, down = false;
  document.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; down = !interactive(e.target); });
  document.addEventListener('pointermove', function (e) { if (down && mode === 'present' && e.buttons) K.scene.cut(e.clientX, e.clientY, performance.now()); idleT = 0; document.body.classList.remove('idle'); });
  document.addEventListener('pointerup', function (e) { if (!down || mode !== 'present') return; down = false; var dx = e.clientX - sx, dy = e.clientY - sy; if (e.pointerType === 'touch' && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) K.scene.next(); else K.scene.prev(); } });
  window.addEventListener('hashchange', function () { var m = /scene-(\d)/.exec(location.hash); if (m && mode === 'present') K.scene.go(+m[1] - 1, { hash: false }); });

  /* hub entry */
  if (/[?&]from=hub/.test(location.search) && !K.reduced) { var cv = $('#cover'); cv.hidden = false; setTimeout(function () { cv.classList.add('open'); }, 40); setTimeout(function () { cv.hidden = true; }, 800); }
  var m0 = /scene-(\d)/.exec(location.hash); K.scene.go(m0 ? +m0[1] - 1 : 0, { instant: true });
  K.hintShow();

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; idleT += dt;
    if (idleT > 3) document.body.classList.add('idle');
    if (!document.hidden) {
      if (mode === 'present') {
        K.stage.tick(now); K.runner.update(now); K.scene.tick(now, dt); K.scene.drawAgents(now, now / 1000, true);
      } else K.explore.tick(now, dt);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.addEventListener('mousemove', function () { idleT = 0; document.body.classList.remove('idle'); });
  window.addEventListener('keydown', function () { idleT = 0; document.body.classList.remove('idle'); });
})();
