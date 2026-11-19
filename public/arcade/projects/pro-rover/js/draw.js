/* Window renderers: A field map, B plot / link / bug, C sonar + safety ladder. Canvas 2D only. */
(function () {
  'use strict';
  var F = window.FACTS, N = F.nums, TAU = 6.2832;
  var C = { deep: '#1A0F0A', rust: '#C1440E', sand: '#F2C894', sun: '#FFB347', teal: '#2BD9C5', warn: '#FF3B30', crop: '#6BBF59' };
  var MONO = '"Courier New",monospace', BK = 2;
  var SPR = [[16, 179, 231, 239], [273, 182, 215, 231], [516, 127, 411, 346], [952, 132, 286, 320], [1263, 134, 321, 336]];
  var Draw = { sim: new Sim(), view: { hud: false, cones: true, bMode: 'plot', fire: 0 }, dust: new Flow.Pool(120), fx: new Flow.Pool(90) };
  var sim = Draw.sim, T = 0;

  function mk(id, w, h) {
    var cv = document.getElementById(id); cv.width = w * BK; cv.height = h * BK;
    var ctx = cv.getContext('2d'); ctx.setTransform(BK, 0, 0, BK, 0, 0); return { cv: cv, ctx: ctx, w: w, h: h };
  }
  var A = mk('cvA', 521, 432), B = mk('cvB', 529, 432), Cw = mk('cvC', 504, 450);
  Draw.A = A; Draw.B = B; Draw.C = Cw;
  var PPM = A.w / sim.W;

  function text(ctx, s, x, y, size, col, align, weight) {
    ctx.font = (weight || 700) + ' ' + size + 'px ' + MONO; ctx.fillStyle = col; ctx.textAlign = align || 'left'; ctx.fillText(s, x, y);
  }
  function plate(ctx, x, y, w, h, col) { ctx.fillStyle = col || 'rgba(26,15,10,.82)'; ctx.fillRect(x, y, w, h); }

  /* ---------- A: field ---------- */
  function fieldBg(ctx, w, h) {
    var im = Stage.img.field;
    if (im && im.ok) {
      var sc = Math.max(w / 2560, h / 1440), sw = w / sc, sh = h / sc;
      ctx.drawImage(im.el, (2560 - sw) / 2, (1440 - sh) / 2, sw, sh, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#8a3a14'; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? '#4f7a36' : '#6BBF59'; ctx.fillRect(0, 40 + i * 42, w, 14); }
    }
    ctx.fillStyle = 'rgba(26,15,10,.22)'; ctx.fillRect(0, 0, w, h);
  }
  function obstacle(ctx, o) {
    var s = o.r * 2 * PPM * 1.7, x = o.x * PPM, y = o.y * PPM, im = Stage.img.crates, sq = o.squash > 0 ? 1 + o.squash * 0.25 : 1;
    ctx.save(); ctx.translate(x + (o.squash > 0 ? Math.sin(T * 90) * 2 : 0), y); ctx.scale(sq, 1 / sq);
    if (im && im.ok) { var r = SPR[o.k % 5], k = s / Math.max(r[2], r[3]); ctx.drawImage(im.el, r[0], r[1], r[2], r[3], -r[2] * k / 2, -r[3] * k / 2, r[2] * k, r[3] * k); }
    else { ctx.fillStyle = o.k < 2 ? '#8a5a2a' : '#5a5048'; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.strokeStyle = C.deep; ctx.lineWidth = 2; ctx.strokeRect(-s / 2, -s / 2, s, s); }
    ctx.restore();
  }
  function rover(ctx, S, sc) {
    ctx.save(); ctx.translate(S.x * PPM, S.y * PPM); ctx.rotate(S.th); ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-12, -8, 26, 20);
    for (var side = -1; side <= 1; side += 2) for (var i = -1; i <= 1; i++) {
      var wx = i * 9, wy = side * 10; ctx.fillStyle = C.deep; ctx.fillRect(wx - 4, wy - 3, 8, 6);
      ctx.strokeStyle = C.sand; ctx.lineWidth = 1; ctx.beginPath(); var sp = Math.floor(S.spoke * 2 + i) % 2 ? 1 : -1;
      ctx.moveTo(wx - 3, wy - 2 * sp); ctx.lineTo(wx + 3, wy + 2 * sp); ctx.stroke();
    }
    ctx.fillStyle = C.rust; ctx.fillRect(-11, -7, 22, 14); ctx.fillStyle = C.teal; ctx.fillRect(-11, -2, 22, 4);
    ctx.fillStyle = C.sand; ctx.fillRect(5, -4, 6, 8); ctx.fillStyle = C.deep; ctx.beginPath(); ctx.arc(9, 0, 2.2, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function cones(ctx, S) {
    var offs = [-0.785, 0, 0.785], e = T - Draw.view.fire;
    for (var k = 0; k < 3; k++) {
      var a = S.th + offs[k], len = Math.min(S.sonar[k], 400) / 100 * PPM, el = e - k * 0.05, lit = el > 0 && el < 0.4;
      ctx.fillStyle = lit ? 'rgba(43,217,197,.30)' : 'rgba(43,217,197,.10)';
      ctx.beginPath(); ctx.moveTo(S.x * PPM, S.y * PPM); ctx.arc(S.x * PPM, S.y * PPM, len, a - 0.26, a + 0.26); ctx.closePath(); ctx.fill();
      if (lit) { ctx.strokeStyle = C.teal; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(S.x * PPM, S.y * PPM, Math.max(2, el / 0.4 * len), a - 0.26, a + 0.26); ctx.stroke(); }
      if (S.sonar[k] < 399) {
        var hx = S.x * PPM + Math.cos(a) * len, hy = S.y * PPM + Math.sin(a) * len, t = Math.round(S.sonar[k]) + '';
        plate(ctx, hx - 2, hy - 15, t.length * 8 + 8, 18); text(ctx, t, hx + 2, hy - 2, 14, C.teal);
      }
    }
  }
  function drawA() {
    var ctx = A.ctx, S = sim; fieldBg(ctx, A.w, A.h);
    ctx.strokeStyle = 'rgba(242,200,148,.5)'; ctx.lineWidth = 1.5;
    if (S.tn > 3) { ctx.beginPath(); ctx.moveTo(S.trace[0] * PPM, S.trace[1] * PPM); for (var i = 2; i < S.tn; i += 2) ctx.lineTo(S.trace[i] * PPM, S.trace[i + 1] * PPM); ctx.stroke(); }
    for (var w = 0; w < S.wp.length; w++) {
      var p = S.wp[w]; ctx.strokeStyle = C.teal; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(p[0] * PPM, p[1] * PPM, N.arriveM.v * PPM, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = w >= S.wpi ? C.sun : C.crop; ctx.beginPath(); ctx.arc(p[0] * PPM, p[1] * PPM, 5, 0, TAU); ctx.fill();
      text(ctx, String(w + 1), p[0] * PPM + 8, p[1] * PPM - 8, 14, C.sand);
    }
    Draw.dust.draw(ctx, 'rgba(242,200,148,.8)', 3);
    for (var o = 0; o < S.obs.length; o++) obstacle(ctx, S.obs[o]);
    if (Draw.view.cones) cones(ctx, S);
    rover(ctx, S, 1.45);
    if (Draw.view.hud === 'us') {
      plate(ctx, 0, A.h - 40, A.w, 40); text(ctx, 'US:' + Math.round(S.sonar[0]) + ',' + Math.round(S.sonar[1]) + ',' + Math.round(S.sonar[2]), 10, A.h - 12, 22, C.sun);
    } else if (Draw.view.hud) {
      plate(ctx, 0, A.h - 44, A.w, 44);
      text(ctx, 'BRG ' + Math.round(S.bearing * 57.3) + '  DST ' + S.dist.toFixed(1) + 'm  ERR ' + Math.round(S.err * 57.3), 8, A.h - 26, 14, C.teal);
      text(ctx, 'L ' + S.cmdl.toFixed(1) + ' R ' + S.cmdr.toFixed(1) + '  US ' + Math.round(S.sonar[0]) + ',' + Math.round(S.sonar[1]) + ',' + Math.round(S.sonar[2]), 8, A.h - 8, 14, C.sand);
    }
    if (S.safety.state !== 'CLEAR' && S.safety.state !== 'SLOW') text(ctx, S.safety.state === 'WATCHDOG' ? 'WATCHDOG STOP' : 'E-STOP', A.w - 10, 24, 20, C.warn, 'right');
    text(ctx, 'FIELD  SIM', 8, 18, 14, C.sand);
  }

  /* ---------- B: plot / link / bug ---------- */
  var link = Draw.link = { cut: false, cutAt: 0, boom: 0 };
  var P1 = new Flow.Path([[44, 340, 90, 340, 100, 250, 150, 250], [150, 250, 220, 250, 230, 160, 300, 160], [300, 160, 370, 160, 400, 100, 470, 96]]);
  var P2 = new Flow.Path([[470, 120, 400, 150, 330, 190, 300, 200], [300, 200, 230, 230, 190, 280, 150, 290], [150, 290, 110, 300, 90, 380, 44, 380]]);
  var up = new Flow.Stream(P1, { speed: 0.28, rate: 2.2, max: 12, gate: { t: 0.55, open: true }, onBlock: function () { Draw.fx.burst(300, 160, 6, 90, 0.5); } });
  var dn = new Flow.Stream(P2, { speed: 0.22, rate: 1.2, max: 8 });
  Draw.up = up;
  var NODES = [['ARDUINO', 44, 360], ['PHONE', 150, 270], ['TAILSCALE', 300, 180], ['LAPTOP', 470, 108]];
  var bug = Draw.bug = { fixed: false, ran: false, t: 0, line: '' };
  function drawPlot(ctx) {
    ctx.fillStyle = '#0c0705'; ctx.fillRect(0, 0, B.w, B.h);
    ctx.strokeStyle = 'rgba(43,217,197,.14)'; ctx.lineWidth = 1;
    for (var g = 40; g < B.w; g += 40) { ctx.beginPath(); ctx.moveTo(g, 50); ctx.lineTo(g, 330); ctx.stroke(); }
    for (var h = 50; h <= 330; h += 35) { ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(B.w, h); ctx.stroke(); }
    var mid = 190, n = sim.errHist.length, sx = B.w / (n - 1);
    ctx.strokeStyle = C.sun; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(B.w, mid); ctx.stroke();
    ctx.strokeStyle = C.teal; ctx.lineWidth = 3; ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var v = sim.errHist[(sim.hi + i) % n], y = mid - Math.max(-1.6, Math.min(1.6, v)) * 85;
      if (i === 0) ctx.moveTo(0, y); else ctx.lineTo(i * sx, y);
    }
    ctx.stroke();
    text(ctx, 'HEADING ERROR', 10, 30, 16, C.sand); text(ctx, 'SIM', B.w - 10, 30, 14, C.sun, 'right');
    var bars = [['Kp', sim.kp / 3.5], ['Ki', sim.ki / 0.3], ['Kd', sim.kd / 0.5]];
    for (var b = 0; b < 3; b++) {
      var bx = 18 + b * 168; text(ctx, bars[b][0], bx, 372, 18, C.sand);
      ctx.fillStyle = 'rgba(242,200,148,.2)'; ctx.fillRect(bx + 32, 358, 110, 14); ctx.fillStyle = C.sun; ctx.fillRect(bx + 32, 358, 110 * Math.min(1, bars[b][1]), 14);
    }
    text(ctx, 'ERR ' + Math.round(sim.err * 57.3) + ' deg', 10, 412, 18, C.teal);
  }
  function packet(ctx, x, y, t, lab) {
    ctx.fillStyle = C.sun; ctx.fillRect(x - 3, y - 3, 6, 6);
    if (lab) { plate(ctx, x + 6, y - 22, 92, 18); text(ctx, 'US:L,M,R', x + 10, y - 8, 14, C.sun); }
  }
  function drawLink(ctx, dt) {
    ctx.fillStyle = '#0c0705'; ctx.fillRect(0, 0, B.w, B.h);
    ctx.strokeStyle = 'rgba(43,217,197,.35)'; ctx.lineWidth = 6; P1.stroke(ctx);
    ctx.strokeStyle = 'rgba(193,68,14,.55)'; ctx.lineWidth = 3; P2.stroke(ctx);
    up.update(dt); dn.update(dt);
    var lab = 0; up.draw(ctx, 4, C.sun, function (c, x, y, t) { packet(c, x, y, t, (lab++ === 0)); });
    dn.draw(ctx, 3, C.sand);
    if (link.cut) { ctx.strokeStyle = C.warn; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(284, 144); ctx.lineTo(316, 176); ctx.moveTo(316, 144); ctx.lineTo(284, 176); ctx.stroke(); }
    Draw.fx.draw(ctx, C.sun, 4);
    for (var i = 0; i < NODES.length; i++) {
      var n = NODES[i]; ctx.fillStyle = C.deep; ctx.strokeStyle = C.sand; ctx.lineWidth = 3; ctx.fillRect(n[1] - 40, n[2] - 20, 80, 36); ctx.strokeRect(n[1] - 40, n[2] - 20, 80, 36);
      text(ctx, n[0], n[1], n[2] + 4, 14, C.sand, 'center');
    }
    text(ctx, 'LINK', 10, 30, 16, C.sand); text(ctx, 'SIM', B.w - 10, 30, 14, C.sun, 'right');
    if (link.cut) {
      var late = T - link.cutAt; text(ctx, late > N.watchdogS.v ? 'WATCHDOG STOP' : 'LINK CUT', 12, 420, 22, C.warn);
    } else text(ctx, 'click link to cut', 12, 420, 14, C.sand);
  }
  function drawBug(ctx) {
    ctx.fillStyle = '#0c0705'; ctx.fillRect(0, 0, B.w, B.h);
    var t = bug.fixed ? 1 : 0, k = F.bug; bug.t += ((bug.fixed ? 1 : 0) - bug.t) * 0.08; t = bug.t;
    text(ctx, 'PRODUCER sends', 14, 26, 14, C.teal); text(ctx, 'CLIENT reads', 14, 214, 14, C.sun); text(ctx, 'SIM', B.w - 10, 26, 14, C.sun, 'right');
    for (var i = 0; i < 3; i++) {
      var y1 = 52 + i * 38, y2 = 232 + i * 38, wrongX = (1 - t) * (i === 1 ? 26 : -20);
      ctx.fillStyle = C.deep; ctx.strokeStyle = t > 0.9 ? C.crop : C.sand; ctx.lineWidth = 2;
      ctx.fillRect(14, y1, 260, 30); ctx.strokeRect(14, y1, 260, 30); text(ctx, k.producer[i], 22, y1 + 21, 16, C.sand);
      var cx = 14 + wrongX; ctx.fillStyle = C.deep; ctx.strokeStyle = t > 0.9 ? C.crop : C.warn; ctx.fillRect(Math.max(4, cx), y2, 290, 30); ctx.strokeRect(Math.max(4, cx), y2, 290, 30);
      text(ctx, t > 0.9 ? k.producer[i] : k.consumer[i], Math.max(4, cx) + 8, y2 + 21, 15, t > 0.9 ? C.crop : C.warn);
      ctx.strokeStyle = t > 0.9 ? C.crop : C.warn; ctx.lineWidth = 3; ctx.setLineDash(t > 0.9 ? [] : [6, 6]);
      ctx.beginPath(); ctx.moveTo(150 + i * 12, y1 + 30); ctx.lineTo(150 + i * 12 + (1 - t) * (i - 1) * 40, y2); ctx.stroke(); ctx.setLineDash([]);
      if (t < 0.5) { text(ctx, 'X', 150 + i * 12 + 10, (y1 + y2) / 2 + 24, 20, C.warn); }
    }
    plate(ctx, 0, 360, B.w, 72, 'rgba(255,59,48,.0)');
    var col = bug.fixed ? C.crop : C.warn;
    text(ctx, 'PLANNER SEES', 14, 378, 14, C.sand);
    text(ctx, bug.ran ? (bug.fixed ? 'live: speed, heading, sonar' : F.bug.defaults) : '...', 14, 402, 18, col);
    text(ctx, bug.ran ? bug.line : 'press RUN PLANNER', 14, 424, 16, col);
  }
  function drawB(dt) {
    var ctx = B.ctx, m = Draw.view.bMode;
    ctx.fillStyle = '#0c0705'; ctx.fillRect(0, 0, B.w, B.h);
    ctx.save(); ctx.translate(22, 18); ctx.scale(0.915, 0.915);
    if (m === 'link') drawLink(ctx, dt); else if (m === 'bug') drawBug(ctx); else drawPlot(ctx);
    ctx.restore();
  }

  /* ---------- C: sonar + safety ladder ---------- */
  var rig = Draw.rig = { d: 90, target: -1, sf: new Safety(), cut: false, age: 0, acc: 0, shown: 90, squash: 0, last: 'CLEAR', drag: false, pulse: 0 };
  var X0 = 78, PXC = 2.2;
  function rigStep(dt) {
    var r = rig; if (r.target >= 0) { r.d += (r.target - r.d) * Math.min(1, dt * 2.2); }
    r.acc += dt; r.age += dt; r.pulse += dt;
    while (r.acc >= 0.15) { r.acc -= 0.15; if (!r.cut) { r.shown = Math.max(2, r.d + (Math.random() - 0.5) * 2); r.age = 0; Draw.view.fire = T; } }
    var st = r.sf.update(r.shown, r.age);
    if (st !== r.last) {
      if ((st === 'STOP' || st === 'WATCHDOG') && r.last !== 'STOP' && r.last !== 'WATCHDOG') {
        r.squash = 0.5; Draw.fx.burst(X0 + r.d * PXC, 330, 18, 130, 0.7); Draw.onImpact && Draw.onImpact(st);
      }
      r.last = st;
    }
    if (r.squash > 0) r.squash -= dt;
  }
  var RUNGS = [['CLEAR', 'CLEAR', C.crop], ['SLOW', 'SLOW under 50', C.sun], ['STOP', 'STOP under 15', C.warn], ['LATCH', 'CLEARS at 25', C.sand], ['WATCHDOG', 'SENSOR 1 s', C.warn]];
  function drawC() {
    var ctx = Cw.ctx, r = rig, st = r.sf.state; ctx.fillStyle = '#0c0705'; ctx.fillRect(0, 0, Cw.w, Cw.h);
    var rx = X0 + 15 * PXC, sx = X0 + 25 * PXC, ax = X0 + 50 * PXC;
    ctx.fillStyle = 'rgba(255,59,48,.22)'; ctx.fillRect(X0, 300, rx - X0, 60);
    ctx.fillStyle = 'rgba(255,179,71,.18)'; ctx.fillRect(rx, 300, ax - rx, 60);
    ctx.fillStyle = 'rgba(107,191,89,.14)'; ctx.fillRect(ax, 300, 330 - ax, 60);
    ctx.strokeStyle = C.sand; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(sx, 290); ctx.lineTo(sx, 370); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.sand; ctx.fillRect(X0 - 4, 296, 332, 4); ctx.fillRect(X0 - 4, 360, 332, 4);
    ctx.fillStyle = C.rust; ctx.fillRect(18, 312, 44, 36); ctx.fillStyle = C.teal; ctx.fillRect(18, 326, 44, 6); ctx.fillStyle = C.deep; ctx.fillRect(62, 322, 10, 16);
    var e = T - Draw.view.fire;
    if (!r.cut) for (var q = 0; q < 2; q++) { var el = e - q * 0.07; if (el > 0 && el < 0.45) { ctx.strokeStyle = 'rgba(43,217,197,' + (1 - el / 0.45) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(72, 330, el / 0.45 * (r.d * PXC), -0.5, 0.5); ctx.stroke(); } }
    var cx = X0 + r.d * PXC, sq = r.squash > 0 ? 1 + r.squash * 0.4 : 1;
    ctx.save(); ctx.translate(cx + 18 + (r.squash > 0 ? Math.sin(T * 80) * 3 : 0), 330); ctx.scale(sq, 1 / sq);
    var im = Stage.img.crates; if (im && im.ok) ctx.drawImage(im.el, 16, 179, 231, 239, -22, -22, 44, 44);
    else { ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-20, -20, 40, 40); ctx.strokeStyle = C.deep; ctx.lineWidth = 3; ctx.strokeRect(-20, -20, 40, 40); }
    ctx.restore();
    Draw.fx.draw(ctx, C.sun, 5);
    var cm = String(Math.round(r.shown)); while (cm.length < 3) cm = '0' + cm;
    ctx.font = '400 74px Impact,"Arial Narrow",sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = st === 'STOP' || st === 'WATCHDOG' ? C.warn : C.sand; ctx.fillText(cm, 16, 84);
    text(ctx, 'cm', 126, 84, 20, C.sand); text(ctx, 'SIM', 16, 108, 14, C.sun);
    text(ctx, 'US:' + cm + (r.cut ? '  NO ECHO' : ''), 16, 140, 16, r.cut ? C.warn : C.teal);
    text(ctx, 'drag the crate', 80, 420, 14, C.sand);
    for (var i = 0; i < 5; i++) {
      var on = (i === 0 && st === 'CLEAR') || (i === 1 && st === 'SLOW') || (i === 2 && st === 'STOP') || (i === 3 && r.sf.latched && r.shown >= 15) || (i === 4 && st === 'WATCHDOG');
      var y = 30 + i * 52 + (i >= 4 ? 8 : 0), col = RUNGS[i][2];
      ctx.fillStyle = on ? col : 'rgba(242,200,148,.1)'; ctx.fillRect(340, y, 156, 44);
      ctx.strokeStyle = on ? col : 'rgba(242,200,148,.4)'; ctx.lineWidth = 3; ctx.strokeRect(340, y, 156, 44);
      text(ctx, RUNGS[i][1], 418, y + 28, 15, on ? C.deep : C.sand, 'center');
    }
    if (st === 'SLOW') text(ctx, 'speed x' + r.sf.scale.toFixed(2), 340, 20, 15, C.sun);
  }

  /* ---------- loop ---------- */
  var last = 0, running = true, acc = 0;
  Draw.interactive = { A: true, C: true };
  Draw.hooks = [];
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!running) { last = ts; return; }
    var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts; T = ts / 1000; Draw.t = T;
    for (var h = 0; h < Draw.hooks.length; h++) Draw.hooks[h](dt, T);
    sim.step(dt); if (sim.pinged) { sim.pinged = false; Draw.view.fire = T; if (Draw.onPing) Draw.onPing(); }
    if (Math.abs(sim.v) > 0.2 && Math.random() < 0.5) Draw.dust.emit(sim.x * PPM - Math.cos(sim.th) * 10, sim.y * PPM - Math.sin(sim.th) * 10, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18, 0.7);
    Draw.dust.update(dt); Draw.fx.update(dt);
    for (var o = 0; o < sim.obs.length; o++) if (sim.obs[o].squash > 0) sim.obs[o].squash -= dt;
    rigStep(dt);
    drawA(); drawB(dt); drawC();
    if (Draw.afterFrame) Draw.afterFrame(dt, T);
  }
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });
  Draw.start = function () { requestAnimationFrame(frame); };
  Draw.ppm = PPM; Draw.C = C;
  window.Draw = Draw; Draw.cw = Cw;
})();
