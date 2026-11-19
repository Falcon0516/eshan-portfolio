/* Engine: fixed-step loop, input, hero physics, camera, enter / return sequences, tour, attract mode. */
(function (A) {
  var D = A.DATA, S = A.S = A.S || {}, W = A.world, $ = function (id) { return document.getElementById(id); };
  var STEP = 1 / 60, FY = 870, acc = 0, last = 0, screenEl, fxc, fxx, bubble, items, bubbleKey = -2, idleMs = 0, mouseIdle = 0, buf = '', visited = {}, lastNear = -1;
  S.state = 'ROOM_IDLE'; S.hx = 140; S.px = 140; S.hv = 0; S.hdir = 1; S.hy = 0; S.hs = 1; S.ha = 1; S.hsq = 1; S.cam = 140; S.look = 0; S.near = -1; S.target = null;
  S.tour = null; S.quick = false; S.t = 0; S.wt = 0; S.keys = { left: 0, right: 0, run: 0 }; S.tilt = { x: 0, y: 0 }; S.tt = { x: 0, y: 0 }; S.seq = null; S.attract = false; S.hop = -1; S.pause = 0; S.overlay = null;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function doorItem(i) { for (var k = 0; k < items.length; k++) if (items[k].kind === 'door' && items[k].i === i) return k; return -1; }
  function touch() { idleMs = 0; if (S.attract) { S.attract = false; S.target = null; } document.body.classList.remove('idle'); }
  function saveVisited() { A.store('arc_v', JSON.stringify(visited)); }

  /* ---------- navigation ---------- */
  function go(slug) {
    S.state = 'NAVIGATE'; var url = 'projects/' + slug + '/index.html?from=hub';
    setTimeout(function () { /* only runs if the page did not change */ A.ui.toast(D.ui.coming, 4000); recover(); }, 2200);
    try { window.location.href = url; } catch (e) { A.ui.toast(D.ui.coming, 4000); recover(); }
  }
  function recover() { S.state = 'WORLD'; screenEl.classList.remove('collapse'); A.fx.flood('#fff', 0, 200); if (S.seq) { W.setOpen(S.seq.k, false); S.seq = null; } S.hy = 0; S.hs = 1; S.ha = 1; S.hsq = 1; A.ui.openList(); }
  A.engine = {
    go: go,
    quickGo: function (slug) { if (S.state === 'NAVIGATE') return; A.ui.closeAll(); S.state = 'ENTERING'; S.seq = null; A.fx.flood('#fff', 0.96, 120); A.audio.play('whoosh'); setTimeout(function () { go(slug); }, 300); },
    skipIntro: function () { A.store('arc_skip', '1'); A.room.skipTo(); A.engine.startWorld(null); },
    powerOn: function () { if (S.state !== 'ROOM_IDLE') return; A.room.powerOn(); },
    pad: function (k, v) { if (k === 'left') S.keys.left = v; if (k === 'right') S.keys.right = v; touch(); S.target = null; },
    walkTo: function (i, then) { var k = typeof i === 'number' ? doorItem(i) : i; if (k < 0 || S.state !== 'WORLD') return; S.target = { x: items[k].x, k: k, then: !!then }; },
    tour: function (on) {
      if (S.state !== 'WORLD') return;
      if (!on) { S.tour = null; A.ui.tourChip(false); S.target = null; return; }
      S.tour = 0; A.ui.tourChip(true); A.ui.closeAll(); A.engine.walkTo(0);
    },
    interact: function () {
      if (S.state !== 'WORLD' || S.overlay) return; var k = S.near; if (k < 0) return; var it = items[k];
      if (it.kind === 'door') A.engine.enterDoor(k); else if (it.kind === 'reg') A.ui.openReg(); else if (it.kind === 'hof') A.ui.openHall(); else if (it.kind === 'port') { A.ui.toast(D.portfolio.label + ' · ' + D.portfolio.note, 2500); try { window.open(D.portfolio.url, '_blank', 'noopener'); } catch (e) {} }
    },
    enterDoor: function (k) {
      if (S.state !== 'WORLD') return; var it = items[k]; A.ui.closeAll(); S.target = null; S.hv = 0; S.state = 'ENTERING'; S.tourPaused = false;
      var coin = !S.quick && !A.store('arc_coin'); if (coin) { A.store('arc_coin', '1'); A.ui.toast('INSERT COIN', 260); A.audio.play('coin'); }
      S.seq = { t: S.rm ? 0 : (coin ? -0.26 : 0), k: k, slug: it.id, c: it.c, ph: 0 };
    },
    startWorld: function (from) {
      A.room.endBoot(); A.room.stopDust(); document.body.classList.remove('room-mode', 'boot-mode'); document.body.classList.add('inworld', 'playing');
      A.room.fit('world', true); S.state = 'WORLD'; S.near = -1; touch();
      var k = -1; if (from) for (var q = 0; q < items.length; q++) if (items[q].id === from && items[q].kind === 'door') k = q;
      if (k >= 0) { S.hx = S.px = items[k].x; S.cam = S.hx; S.hy = -110; S.hs = 0.34; S.ha = 0; S.state = 'RETURNING'; S.seq = { t: 0, k: k, c: items[k].c, back: 1 }; A.fx.flood(items[k].c[0], 1, 1); setTimeout(function () { A.fx.flood(items[k].c[0], 0, 600); }, 30); if (S.rm) finishReturn(); }
      else { S.hx = S.px = 60; S.cam = 200; S.hv = 0; A.engine.walkTo(0); S.target = { x: 260, k: -1, then: false }; }
      A.ui.hint(true); A.audio.loop(true); A.ui.setActive(-1);
      if (!from && A.ui.maybeTutorial) setTimeout(function () { A.ui.maybeTutorial(); }, S.rm ? 50 : 450);
    }
  };
  function finishReturn() { if (S.seq) W.setOpen(S.seq.k, false); S.seq = null; S.state = 'WORLD'; S.hy = 0; S.hs = 1; S.ha = 1; S.hsq = 1; A.ui.toast(D.boot.toast, 3200); }

  /* ---------- update ---------- */
  function arrive() {
    var tg = S.target; S.target = null; S.hv = 0; if (tg.x) S.hx = tg.x; S.hop = 0; A.audio.play('blip');
    if (tg.then) setTimeout(function () { if (S.state === 'WORLD') A.engine.interact(); }, 160);
    if (S.attract) S.pause = 1.6;
  }
  function update(dt) {
    var st = S.state, k, it;
    S.px = S.hx;
    if (st !== 'WORLD' && st !== 'ENTERING' && st !== 'RETURNING' && st !== 'NAVIGATE') return;
    if (st === 'WORLD') {
      var ov = !!S.overlay, dirIn = ov ? 0 : S.keys.right - S.keys.left, max = S.keys.run ? 760 : (S.tour !== null || S.attract ? 520 : 420), want = 0, rate = 3600;
      if (S.target && !ov) {
        var dx = S.target.x - S.hx;
        if (Math.abs(dx) < 4 && Math.abs(S.hv) < 90) arrive(); else { want = (dx > 0 ? 1 : -1) * Math.min(max, Math.max(60, Math.abs(dx) * 4.5)); rate = 3000; }
      } else if (dirIn) { want = dirIn * max; rate = 2600; }
      var dv = want - S.hv, m = rate * dt; S.hv += clamp(dv, -m, m);
      S.hx += S.hv * dt;
      if (S.hx < 80) { S.hx = 80; S.hv = Math.abs(S.hv) * 0.3; } else if (S.hx > W.LEN - 80) { S.hx = W.LEN - 80; S.hv = -Math.abs(S.hv) * 0.3; }
      var mv = Math.abs(S.hv) > 25;
      if (mv) { S.hdir = S.hv > 0 ? 1 : -1; var wt0 = S.wt; S.wt += dt * (5 + Math.abs(S.hv) / 120); if (((S.wt * 2) | 0) !== ((wt0 * 2) | 0)) { A.fx.puff(A.engine.screenX() , FY, S.hdir); A.audio.play('step'); } }
      if (S.hop >= 0) { S.hop += dt; if (S.hop > 0.42) S.hop = -1; }
      S.hy = S.hop >= 0 ? -Math.sin(S.hop / 0.42 * Math.PI) * 46 : 0;
      S.near = ov ? S.near : W.nearest(S.hx);
      if (S.near !== lastNear) { lastNear = S.near; if (S.near >= 0) A.audio.play('blip'); A.ui.setActive(S.near >= 0 && items[S.near].kind === 'door' ? items[S.near].i : -1); }
      /* idle / attract */
      if (!S.target && !dirIn && !ov && S.tour === null) { idleMs += dt * 1000; mouseIdle += dt; if (mouseIdle > 3) document.body.classList.add('idle'); }
      if (S.attract && !S.target && !ov) { S.pause -= dt; if (S.pause <= 0) { var nk = S.near >= 0 ? (S.near + 1) % items.length : 0; if (nk === 0 || items[nk].kind === 'port') nk = 1; S.target = { x: items[nk].x, k: nk, then: false }; } }
      if (!S.attract && idleMs > 25000 && S.tour === null) { S.attract = true; S.pause = 0; idleMs = 0; }
    }
    else if (S.seq) seqUpdate(dt);
    /* camera: lag + look-ahead */
    var visW = A.view.visW, lk = S.hdir * (Math.abs(S.hv) > 25 ? 170 : 40); S.look += (lk - S.look) * (1 - Math.exp(-2.4 * dt));
    S.cam += (S.hx + S.look - S.cam) * (1 - Math.exp(-4 * dt)); S.cam = clamp(S.cam, visW / 2 - 140, W.LEN - visW / 2 + 140);
    S.tilt.x += (S.tt.x - S.tilt.x) * 0.15; S.tilt.y += (S.tt.y - S.tilt.y) * 0.15;
    /* hero squash recovers */
    if (S.state === 'WORLD') S.hsq += (1 - S.hsq) * 0.2;
    A.fx.update(dt);
    /* ambient neon spark along the floor */
    if (((S.t * 4) | 0) !== (((S.t - dt) * 4) | 0)) A.fx.spark(Math.random() * 1442, 830 + Math.random() * 130, Math.random() < 0.5 ? '#3FE6FF' : '#FF3FA4');
  }

  function seqUpdate(dt) {
    var q = S.seq, it = items[q.k], c = q.c || ['#fff']; q.t += dt;
    if (S.state === 'ENTERING') {
      var t = q.t, cx = it.x;
      if (S.rm) { if (!q.fl) { q.fl = 1; A.fx.flood(c[0], 1, 350); setTimeout(function () { go(q.slug); }, 450); } return; }
      if (t < 0) return;
      S.hx += (cx - S.hx) * 0.18; S.hv = 0;
      if (t < 0.2) S.hsq = 1 - ease(t / 0.2) * 0.12;
      if (t >= 0.2 && !q.o) { q.o = 1; W.setOpen(q.k, true); A.audio.play('creak'); A.fx.burst(A.engine.screenXof(cx), 560, 26, c[0]); A.fx.shake(screenEl, 260); }
      if (t >= 0.2 && t < 0.45) S.hsq = 0.88 + ease((t - 0.2) / 0.25) * 0.12;
      if (t >= 0.45 && t < 1.05) { var u = ease((t - 0.45) / 0.6); S.hs = 1 - u * 0.66; S.hy = -u * 130; S.ha = 1 - u * 0.5; S.hsq = 1; q.walk = 1; }
      if (t >= 1.0 && !q.f) { q.f = 1; A.fx.flood(c[0], 1, 220); A.audio.play('whoosh'); }
      if (t >= 1.22 && !q.c2) { q.c2 = 1; screenEl.classList.add('collapse'); A.fx.static(500, 0.8); A.audio.play('off'); }
      if (t >= 1.7 && !q.n) { q.n = 1; go(q.slug); }
    } else if (S.state === 'RETURNING') {
      var tt = q.t; S.hv = 0;
      if (tt < 0.1) { if (!q.o) { q.o = 1; W.setOpen(q.k, true); A.audio.play('creak'); A.fx.burst(A.engine.screenXof(it.x), 560, 22, c[0]); } }
      if (tt >= 0.35 && tt < 1.0) { var r = ease((tt - 0.35) / 0.65); S.hs = 0.34 + r * 0.66; S.hy = -110 * (1 - r); S.ha = Math.min(1, r * 2); S.hsq = 1; }
      if (tt >= 1.0) { S.hs = 1; S.hy = 0; S.ha = 1; }
      if (tt >= 1.25 && q.o === 1) { q.o = 2; W.setOpen(q.k, false); A.ui.toast(D.boot.toast, 3200); }
      if (tt >= 1.6) { S.seq = null; S.state = 'WORLD'; S.hop = 0; }
    }
  }

  /* ---------- render ---------- */
  A.engine.screenX = function () { return S.hx - S.cam + 721; };
  A.engine.screenXof = function (x) { return x - S.cam + 721; };
  function render(al) {
    var t = S.t, st = S.state;
    if (st === 'ROOM_IDLE' || st === 'TV_ON') { A.room.tick(STEP, t); return; }
    A.room.tick(STEP, t);
    if (st === 'BOOT' || st === 'PRESS_START') { A.fx.tickStatic(performance.now()); return; }
    var hx = S.px + (S.hx - S.px) * al, sx = hx - S.cam + 721;
    W.drawBG(S.cam, t, S); W.layout(S.cam, A.view.visW, (st === 'WORLD' || st === 'RETURNING') && !S.seq ? S.near : (S.seq ? S.seq.k : -1), t, S.tilt, STEP);
    fxx.clearRect(0, 0, 1442, 1090);
    /* flow lanes: neon packets carried along the floor */
    var l, i, px;
    for (l = 0; l < 3; l++) { fxx.fillStyle = l % 2 ? '#FF3FA4' : '#3FE6FF'; for (i = 0; i < 12; i++) { px = (((i * 190 + t * (70 + l * 45)) - S.cam * (1 + l * 0.05)) % 2280 + 2280) % 2280 - 400; if (px < -10 || px > 1450) continue; fxx.globalAlpha = 0.7; fxx.fillRect(px, 870 + l * 24, 22 + l * 6, 4); } }
    fxx.globalAlpha = 1;
    /* hero */
    var moving = Math.abs(S.hv) > 25, kind, frame, seq = S.seq;
    if (seq && ((st === 'ENTERING' && seq.t >= 0.0) || st === 'RETURNING')) { kind = 'back'; frame = (st === 'ENTERING' && seq.t >= 0.45) || (st === 'RETURNING' && seq.t >= 0.35 && seq.t < 1.0) ? ((t * 7) | 0) & 1 : 0; }
    else if (moving) { kind = 'walk'; frame = S.wt | 0; }
    else if (S.near >= 0 && Math.abs(S.hv) < 5 && !S.target) { kind = 'idle'; frame = 3; }
    else { kind = 'idle'; frame = (t % 3.7) < 0.13 ? 2 : (((t * 1.2) | 0) & 1); }
    A.hero.draw(fxx, sx, FY + S.hy, { scale: S.hs, alpha: S.ha, squash: S.hsq, dir: S.hdir, kind: kind, frame: frame, bob: moving ? Math.abs(Math.sin(S.wt * Math.PI)) * 8 : Math.sin(t * 2.2) * 1.5 });
    A.fx.draw(fxx, 0);
    /* bubble over the hero's head */
    var show = st === 'WORLD' && S.near >= 0 && Math.abs(S.hv) < 260 && !S.overlay, key = show ? S.near : -1;
    if (key !== bubbleKey) { bubbleKey = key; if (show) { var it = items[S.near], h = ''; if (it.kind === 'door') h = '<b>ENTER: ' + it.data.title.replace(/&/g, '&amp;') + '</b><span>' + it.data.tag + '</span><em>PRESS ENTER</em>'; else h = '<b>' + it.el.querySelector('h3').textContent + '</b>' + (it.kind === 'port' ? '<span>' + D.portfolio.note + '</span>' : '') + '<em>PRESS ENTER</em>'; bubble.innerHTML = h; } bubble.classList.toggle('on', show); }
    if (show) { bubble.style.left = clamp(sx, 280, 1160).toFixed(0) + 'px'; bubble.style.top = (FY - 238 + S.hy - Math.sin(t * 2.2) * 2).toFixed(0) + 'px'; }
    A.fx.tickStatic(performance.now());
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = 0; return; }
    if (!last) last = now; var dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1; acc += dt;
    while (acc >= STEP) { update(STEP); S.t += STEP; acc -= STEP; }
    render(acc / STEP);
  }

  /* ---------- input ---------- */
  var NAMES = { saathi: 0, argus: 1, soil: 2, axiom: 3, personaforge: 4, kavach: 5, prorover: 6, usb: 7, bridge: 7, verifarm: 8 };
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; var k = e.key, kl = k.length === 1 ? k.toLowerCase() : k; touch(); S.keys.run = e.shiftKey ? 1 : 0;
    if (kl === 'm') { A.audio.setMuted(!A.audio.isMuted()); A.store('arc_snd', A.audio.isMuted() ? '0' : '1'); return; }
    if (kl === 'f') { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (x) {} return; }
    if (k === 'Escape') { if (A.ui.closeAll()) { e.preventDefault(); return; } if (S.tour !== null) A.engine.tour(false); S.target = null; return; }
    if (S.overlay) { if (A.ui.key(e)) e.preventDefault(); return; }
    if (S.state === 'ROOM_IDLE') { if (kl === 'n') { document.body.classList.toggle('night'); return; } if (k === 'Shift' || k === 'Tab') return; e.preventDefault(); A.engine.powerOn(); return; }
    if (S.state === 'TV_ON') return;
    if (S.state === 'BOOT' || S.state === 'PRESS_START') { if (k === 'Shift' || k === 'Tab') return; e.preventDefault(); A.engine.startWorld(null); return; }
    if (S.state === 'ENTERING' || S.state === 'RETURNING') { if (S.state === 'ENTERING' && S.seq && S.seq.slug && !S.seq.n) { S.seq.n = 1; go(S.seq.slug); } else if (S.state === 'RETURNING') finishReturn(); e.preventDefault(); return; }
    if (S.state !== 'WORLD') return;
    if (kl.length === 1 && /[a-z]/.test(kl)) { buf = (buf + kl).slice(-14); for (var n in NAMES) if (buf.slice(-n.length) === n) { buf = ''; S.tour = null; A.ui.tourChip(false); A.engine.walkTo(NAMES[n]); return; } }
    switch (kl) {
      case 'ArrowLeft': case 'a': S.keys.left = 1; S.target = null; e.preventDefault(); break;
      case 'ArrowRight': case 'd': S.keys.right = 1; S.target = null; e.preventDefault(); break;
      case 'Enter': case 'e': case 'ArrowUp': e.preventDefault(); if (e.repeat) break; A.engine.interact(); break;
      case ' ': case 'PageDown': e.preventDefault(); if (e.repeat) break; if (S.tour !== null) { if (S.tour < 8) { S.tour++; A.engine.walkTo(S.tour); } else A.ui.toast('END OF TOUR', 1800); } else A.engine.interact(); break;
      case 'PageUp': e.preventDefault(); if (S.tour !== null && S.tour > 0) { S.tour--; A.engine.walkTo(S.tour); } break;
      case 'l': A.ui.openList(); break;
      case 'p': A.engine.tour(S.tour === null); break;
    }
  }
  function onKeyUp(e) {
    var kl = e.key.length === 1 ? e.key.toLowerCase() : e.key; S.keys.run = e.shiftKey ? 1 : 0;
    if (kl === 'ArrowLeft' || kl === 'a') S.keys.left = 0; if (kl === 'ArrowRight' || kl === 'd') S.keys.right = 0;
  }
  function itemFrom(e) { var el = e.target.closest && e.target.closest('.item'); return el ? +el.dataset.k : -1; }
  function bindMouse() {
    screenEl.addEventListener('click', function (e) {
      touch(); var st = S.state;
      if (st === 'BOOT' || st === 'PRESS_START') { A.engine.startWorld(null); return; }
      if (st !== 'WORLD' || S.overlay) return;
      var k = itemFrom(e);
      if (k >= 0) {
        var it = items[k];
        if (it.kind === 'door' && (e.ctrlKey || e.metaKey || S.quick)) { A.engine.quickGo(it.id); return; }
        S.tour = null; A.ui.tourChip(false); if (Math.abs(it.x - S.hx) <= 20) { S.near = k; A.engine.interact(); } else S.target = { x: it.x, k: k, then: true };
        return;
      }
      var r = screenEl.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width * 1442; S.target = { x: clamp(S.cam + nx - 721, 80, W.LEN - 80), k: -1, then: false };
    });
    screenEl.addEventListener('dblclick', function (e) { var k = itemFrom(e); if (k >= 0 && S.state === 'WORLD' && items[k].kind === 'door') A.engine.quickGo(items[k].id); });
    screenEl.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('item')) { e.stopPropagation(); e.preventDefault(); var k = +e.target.dataset.k; touch(); if (S.state === 'WORLD') { S.target = { x: items[k].x, k: k, then: true }; } } });
    window.addEventListener('mousemove', function (e) {
      mouseIdle = 0; idleMs = 0; document.body.classList.remove('idle'); if (S.attract) touch();
      var k = S.near; if (k < 0 || !items[k].vis) { S.tt.x = S.tt.y = 0; return; }
      var r = items[k].el.getBoundingClientRect(); S.tt.x = clamp((e.clientX - r.left - r.width / 2) / (r.width / 2), -1, 1); S.tt.y = clamp((e.clientY - r.top - r.height / 2) / (r.height / 2), -1, 1);
    }, { passive: true });
    window.addEventListener('pointerdown', function () { touch(); }, { passive: true });
    /* Horizontal swipe/drag on touch screens moves along the Arcade hallway */
    var tsx = 0, tsy = 0, swiping = false;
    screenEl.addEventListener('touchstart', function (e) {
      if (S.state !== 'WORLD' || S.overlay || e.touches.length !== 1) return;
      tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; swiping = true;
    }, { passive: true });
    screenEl.addEventListener('touchend', function (e) {
      if (!swiping || S.state !== 'WORLD' || S.overlay) { swiping = false; return; }
      swiping = false;
      var t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      var dx = t.clientX - tsx, dy = t.clientY - tsy;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        S.tour = null; A.ui.tourChip(false);
        var step = Math.max(260, Math.min(700, Math.abs(dx) * 3.2));
        S.target = { x: clamp(S.hx + (dx < 0 ? step : -step), 80, W.LEN - 80), k: -1, then: false };
      }
    }, { passive: true });
  }

  /* ---------- boot ---------- */
  function init() {
    S.rm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    screenEl = $('screen'); fxc = $('fx'); fxx = fxc.getContext('2d'); bubble = $('bubble');
    W.build(); items = W.items; A.ui.init(); A.room.init(); A.ui.syncSound();
    try { visited = JSON.parse(A.store('arc_v') || '{}') || {}; } catch (e) { visited = {}; }
    for (var s in visited) A.ui.markVisited(s);
    var m = /[?&]from=([^&#]*)/.exec(location.search), from = m ? decodeURIComponent(m[1]) : null;
    var isDoorSlug = !!(from && from !== 'hub' && from !== 'portfolio' && from !== 'pro' && from !== 'game');
    if (isDoorSlug) { visited[from] = 1; saveVisited(); A.ui.markVisited(from); }
    document.addEventListener('click', function (ev) { var b = ev.target.closest && ev.target.closest('.pbtn'); if (b) b.blur(); });
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp); bindMouse();
    window.addEventListener('blur', function () { S.keys.left = S.keys.right = S.keys.run = 0; });
    document.addEventListener('visibilitychange', function () { last = 0; if (document.hidden) A.audio.loop(false); else if (S.state === 'WORLD') A.audio.loop(true); });
    window.addEventListener('resize', function () { if (S.state === 'WORLD') A.room.fit('world', true); });
    var skip = A.store('arc_skip') === '1';
    if (isDoorSlug) { A.engine.startWorld(from); }
    else if (skip || from === 'hub') { A.room.skipTo(); A.engine.startWorld(null); }
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window.A = window.A || {});
