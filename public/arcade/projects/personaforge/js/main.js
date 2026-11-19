/* Core: camera, loop, timeline, chrome, modes, input, overlays, tooltips. */
(function () {
  var F = PF.FACTS, $ = function (s, r) { return (r || document).querySelector(s); };
  PF.reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var ERR = null;

  /* [[term|key]] -> tooltip span */
  PF.tipify = function (s) {
    return String(s).replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, function (m, t, k) {
      k = (k || t).toLowerCase(); var tip = F.TIPS[k]; if (!tip) return t;
      return '<span class="tipt" tabindex="0" data-tip="' + k + '">' + t + '</span>';
    });
  };
  var tipEl;
  function tipShow(el) {
    var t = F.TIPS[el.dataset.tip]; if (!t) return; tipEl.innerHTML = '<b>' + t[0] + '</b> ' + t[1]; tipEl.hidden = false;
    var r = el.getBoundingClientRect(), w = tipEl.offsetWidth, x = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)), y = r.top - tipEl.offsetHeight - 10; if (y < 8) y = r.bottom + 10;
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  }

  /* easing + loop */
  function bez(x1, y1, x2, y2) { return function (t) { if (t <= 0) return 0; if (t >= 1) return 1; var a = t; for (var i = 0; i < 6; i++) { var cx = 3 * x1 * a * (1 - a) * (1 - a) + 3 * x2 * a * a * (1 - a) + a * a * a - t, d = 3 * x1 * (1 - a) * (1 - a) + 6 * (x2 - x1) * a * (1 - a) + 3 * (1 - x2) * a * a; if (Math.abs(d) < 1e-5) break; a -= cx / d; } return 3 * y1 * a * (1 - a) * (1 - a) + 3 * y2 * a * a * (1 - a) + a * a * a; }; }
  PF.ease = { cam: bez(0.2, 0.8, 0.2, 1), out: function (t) { return 1 - Math.pow(1 - t, 3); }, io: function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }, back: function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }, lin: function (t) { return t; } };
  var subs = [], tws = [], tos = [];
  PF.loop = function (fn) { subs.push(fn); };
  PF.flows = [];
  PF.tl = {
    at: function (ms, fn) { var id = setTimeout(function () { try { fn(); } catch (e) { console.error(e); } }, ms); tos.push(id); return id; },
    tween: function (ms, upd, o) { o = o || {}; var w = { t: 0, ms: Math.max(1, PF.reduced && !o.keep ? 1 : ms), upd: upd, ease: o.ease || PF.ease.out, done: o.done, d: o.delay || 0 }; tws.push(w); return w; },
    clear: function () { tos.forEach(clearTimeout); tos = []; tws.length = 0; PF.flows.forEach(function (f) { f.clear(); f.paused = false; f.gates.length = 0; }); }
  };
  var last = 0;
  function frame(ts) {
    requestAnimationFrame(frame); if (document.hidden) { last = ts; return; }
    var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    for (var i = tws.length - 1; i >= 0; i--) { var w = tws[i]; if (w.d > 0) { w.d -= dt * 1000; continue; } w.t += dt * 1000; var k = Math.min(1, w.t / w.ms); w.upd(w.ease(k), k); if (k >= 1) { tws.splice(i, 1); if (w.done) w.done(); } }
    for (i = 0; i < subs.length; i++) subs[i](dt);
    PF.flows.forEach(function (f) { f.update(dt); });
    PF.fx.update(dt); PF.camApply(dt);
  }

  /* camera */
  var cam = PF.cam = { x: 1900, y: 1120, z: 0.95, r: 0, vw: 1, vh: 1, s: 1 };
  var vp, world, camTw = null;
  cam.scale = function (z) { var w = cam.vw, h = cam.vh; return w < h * 0.8 ? Math.max(z * w / 1100, h / 2160) : z * Math.max(w / 2000, h / 1125); };
  cam.w2s = function (x, y) { return { x: cam.vw / 2 + (x - cam.x) * cam.s, y: cam.vh / 2 + (y - cam.y) * cam.s }; };
  PF.camApply = function () {
    var s = cam.scale(cam.z), hw = cam.vw / (2 * s), hh = cam.vh / (2 * s), x = cam.x, y = cam.y;
    x = hw * 2 < 3840 ? Math.max(hw, Math.min(3840 - hw, x)) : 1920; y = hh * 2 < 2160 ? Math.max(hh, Math.min(2160 - hh, y)) : 1080; cam.s = s;
    if (cam._k === x + '|' + y + '|' + s + '|' + cam.r) return; cam._k = x + '|' + y + '|' + s + '|' + cam.r; cam.ex = x; cam.ey = y;
    world.style.transform = 'translate3d(' + cam.vw / 2 + 'px,' + cam.vh / 2 + 'px,0) rotate(' + cam.r.toFixed(2) + 'deg) scale(' + s.toFixed(4) + ') translate(' + (-x).toFixed(1) + 'px,' + (-y).toFixed(1) + 'px)';
    var L = PF.stage.layers || []; for (var i = 0; i < L.length; i++) { var k = parseFloat(L[i].dataset.par); L[i].style.transform = 'translate3d(' + (-(x - 1920) * (k - 1)).toFixed(1) + 'px,' + (-(y - 1080) * (k - 1)).toFixed(1) + 'px,0)'; }
  };
  PF.camTo = function (p, ms) {
    var a = { x: cam.x, y: cam.y, z: cam.z, r: cam.r }; if (camTw) camTw.dead = true;
    world.classList.add('moving');
    if (PF.reduced) { cam.x = p.x; cam.y = p.y; cam.z = p.z; cam.r = p.r || 0; vp.animate([{ opacity: 0.4 }, { opacity: 1 }], 250); world.classList.remove('moving'); return; }
    camTw = PF.tl.tween(ms == null ? 1200 : ms, function (e) { cam.x = a.x + (p.x - a.x) * e; cam.y = a.y + (p.y - a.y) * e; cam.z = a.z + (p.z - a.z) * e; cam.r = a.r + ((p.r || 0) - a.r) * e; }, { ease: PF.ease.cam, keep: 1, done: function () { world.classList.remove('moving'); } });
  };
  function resize() { cam.vw = innerWidth; cam.vh = innerHeight; cam._k = ''; }

  /* scenes + modes */
  var cur = -1, mode = 'present', first = true, idleT;
  PF.mode = function () { return mode; };
  function dots() { var d = $('#dots'); d.innerHTML = F.scenes.map(function (s, i) { return '<button aria-label="Scene ' + (i + 1) + ': ' + s.head + '" data-i="' + i + '"></button>'; }).join(''); d.onclick = function (e) { var b = e.target.closest('button'); if (b) go(+b.dataset.i); }; }
  function ui(i) {
    var s = F.scenes[i], sl = $('#slab'); $('#s-num').textContent = (i + 1) + ' / ' + F.scenes.length; $('#s-head').textContent = s.head; $('#s-cap').innerHTML = PF.tipify(s.cap); $('#s-take').innerHTML = PF.tipify(s.take);
    sl.classList.remove('in'); void sl.offsetWidth; sl.classList.add('in'); $('#notes-t').textContent = s.note;
    [].forEach.call($('#dots').children, function (b, k) { b.classList.toggle('on', k === i); });
  }
  function go(i, o) {
    o = o || {}; i = Math.max(0, Math.min(F.scenes.length - 1, i)); if (mode !== 'present') setMode('present', true);
    if (cur === i && !o.replay) return;
    var sc = PF.scenes[i]; PF.tl.clear(); if (cur >= 0 && PF.scenes[cur].end) PF.scenes[cur].end(); closeReality(true);
    cur = i; ui(i); if (location.hash !== '#scene-' + (i + 1)) { try { history.replaceState(null, '', '#scene-' + (i + 1)); } catch (e) { location.hash = 'scene-' + (i + 1); } }
    $('#sceneui').classList.toggle('right', sc.ui === 'r'); sc.start(); PF.camTo(sc.cam, first ? 1 : 1200); first = false;
    PF.tl.at(o.replay ? 100 : 650, function () { sc.beat(); });
  }
  PF.go = go;
  function setMode(m, silent) {
    if (m === mode) return; mode = m; document.body.className = document.body.className.replace(/mode-\w+/, 'mode-' + m);
    $('#mt-p').setAttribute('aria-pressed', m === 'present'); $('#mt-e').setAttribute('aria-pressed', m === 'explore');
    PF.tl.clear(); if (cur >= 0 && PF.scenes[cur].end) PF.scenes[cur].end();
    if (m === 'explore') { PF.stage.clearStrings(); PF.explore.enter(); $('#notes-t').textContent = F.UI.exploreNote; }
    else { PF.explore.leave(); if (!silent) { var c = cur; cur = -1; go(c < 0 ? 0 : c); } }
  }
  function openReality(manual) { var r = $('#reality'); r.hidden = false; void r.offsetWidth; r.classList.add('open'); r.dataset.manual = manual ? '1' : ''; PF.snd.whir(); if (manual) $('#rc-close').focus(); }
  function closeReality(force) { var r = $('#reality'); if (r.hidden) return false; if (!force && !r.dataset.manual) return false; r.classList.remove('open'); setTimeout(function () { if (!r.classList.contains('open')) r.hidden = true; }, 700); return true; }
  PF.reality = { open: openReality, close: closeReality };

  function toHub() { location.href = '../../index.html?from=personaforge'; }
  function key(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; var k = e.key, tgt = e.target.tagName;
    if (tgt === 'INPUT' && k !== 'Escape') return;
    var step = function (d) { if (mode === 'present') go(cur + d); else PF.explore.step(d); };
    if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && tgt !== 'BUTTON')) { step(1); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { step(-1); e.preventDefault(); }
    else if (k === 'Enter' && tgt !== 'BUTTON' && tgt !== 'A') { if (mode === 'present') go(cur, { replay: true }); }
    else if (k === 'p' || k === 'P') setMode(mode === 'present' ? 'explore' : 'present');
    else if (k === 'r' || k === 'R') { var r = $('#reality'); if (!r.hidden && r.classList.contains('open') && r.dataset.manual) closeReality(); else if (!(mode === 'present' && cur === 7)) openReality(true); }
    else if (k === 't' || k === 'T') $('#notes-p').hidden = !$('#notes-p').hidden;
    else if (k === 'm' || k === 'M') toggleSound();
    else if (k === 'f' || k === 'F') fs();
    else if (k === 'Escape') {
      if (!$('#notes-p').hidden) { $('#notes-p').hidden = true; return; }
      if (closeReality()) return; if (PF.explore.closeOverlay && PF.explore.closeOverlay()) return; toHub();
    }
  }
  function toggleSound() { var on = PF.snd.toggle(); $('#b-m').setAttribute('aria-pressed', on); $('#b-m').classList.toggle('on', on); }
  function fs() { try { var d = document, e = d.documentElement; if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else (e.requestFullscreen || e.webkitRequestFullscreen).call(e); } catch (x) {} }

  function wake() { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(function () { document.body.classList.add('idle'); }, 3000); }

  function init() {
    vp = $('#vp'); world = $('#world'); tipEl = $('#tip'); PF.fx.init(); PF.stage.build(); resize(); addEventListener('resize', resize);
    // static text
    $('#arcade').innerHTML = F.UI.arcade; $('#mt-p').textContent = F.UI.present; $('#mt-e').textContent = F.UI.explore; $('#badge').textContent = F.badge; $('#hint').textContent = F.UI.hint;
    var R = F.reality, col = function (cls, name, arr) { return '<div class="rc-col ' + cls + '"><h3>' + name + '</h3><ul>' + arr.map(function (t) { return '<li>' + PF.tipify(t) + '</li>'; }).join('') + '</ul></div>'; };
    $('#rc-in').innerHTML = '<h2>' + R.title + '</h2><div class="rc-cols">' + col('real', 'REAL', R.real) + col('part', 'PARTIAL', R.partial) + '</div><small>' + F.author + ' · ' + F.url + '</small>';
    dots(); $('#notes-t').textContent = F.scenes[0].note;
    document.addEventListener('keydown', key);
    document.addEventListener('mouseover', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t) tipShow(t); });
    document.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest('[data-tip]')) tipEl.hidden = true; });
    document.addEventListener('focusin', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t) tipShow(t); });
    document.addEventListener('focusout', function () { tipEl.hidden = true; });
    ['mousemove', 'pointerdown', 'keydown', 'touchstart'].forEach(function (n) { addEventListener(n, wake, { passive: true }); }); wake();
    $('#mt-p').onclick = function () { setMode('present'); }; $('#mt-e').onclick = function () { setMode('explore'); };
    $('#b-r').onclick = function () { var r = $('#reality'); if (!r.hidden && r.dataset.manual) closeReality(); else if (!(mode === 'present' && cur === 7)) openReality(true); };
    $('#rc-close').onclick = function () { closeReality(); };
    $('#b-t').onclick = function () { $('#notes-p').hidden = !$('#notes-p').hidden; }; $('#b-m').onclick = toggleSound; $('#b-f').onclick = fs;
    // click right 30% to advance; never when clicking an interactive object
    $('#app').addEventListener('click', function (e) {
      if (mode !== 'present' || e.target.closest('.int,button,a,input,label,#reality,#notes-p,[data-tip],#chrome,#dots')) return;
      if (e.clientX > innerWidth * 0.7) go(cur + 1);
    });
    var sx = null; addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 60 && !e.target.closest('.int,#hud,#reality')) { if (mode === 'present') go(cur + (dx < 0 ? 1 : -1)); else PF.explore.step(dx < 0 ? 1 : -1); } }, { passive: true });
    addEventListener('hashchange', function () { var m = /^#scene-(\d+)$/.exec(location.hash); if (m && mode === 'present') go(+m[1] - 1); });
    setTimeout(function () { $('#hint').classList.add('gone'); }, 6500);
    var m = /^#scene-(\d+)$/.exec(location.hash), start = m ? +m[1] - 1 : 0, hub = /[?&]from=hub/.test(location.search);
    if (hub) { var en = $('#entry'); en.hidden = false; requestAnimationFrame(function () { en.classList.add('up'); setTimeout(function () { en.hidden = true; PF.stage.bounce(0.14); PF.stage.say(F.SAY.hi, 1800); }, 800); }); }
    requestAnimationFrame(frame); go(start);
  }
  window.addEventListener('error', function (e) { ERR = e; });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
