/* Explore mode: S1 The Race. NAIVE vs ARGUS on the same city. Everything here is a SIMULATION. */
(function () {
  var DOTS = [[441, 800], [731, 408], [1008, 1073], [1156, 551], [1487, 251], [1567, 608]];
  var R = { cams: 6, crowd: 3, trig: { count: true, scene: true, hb: true }, t: 0, ag: [], lane: [], evts: [], models: 1, labels: [] };
  var cloudNaive = null;
  function mkLane() { return { calls: 0, mem: 300, rate: 0, f: new window.Flow(), cnt: [0, 0, 0, 0, 0, 0], cd: [0, 0, 0, 0, 0, 0], hb: [0, 0.7, 1.4, 2.1, 2.8, 3.5], nt: [0, 0.1, 0.2, 0.3, 0.4, 0.5] }; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function mkAgent(v) { var a = { x: rnd(200, 1800), y: rnd(200, 1200), tx: 0, ty: 0, v: v, sp: v ? rnd(80, 130) : rnd(22, 40), ph: 0 }; pick(a); return a; }
  function pick(a) { a.tx = rnd(150, 1850); a.ty = rnd(150, 1250); }
  R.reset = function () {
    R.t = 0; R.ag.length = 0; R.evts.length = 0; R.labels.length = 0; R.models = 1;
    for (var i = 0; i < 12 + R.crowd * 8; i++) R.ag.push(mkAgent(i % 4 === 0));
    R.lane = [mkLane(), mkLane()];
    R.lane[0].f.onArrive = function () { R.lane[0].calls++; R.lane[0].rate += 1; };
    R.lane[1].f.onArrive = function () { R.lane[1].calls++; R.lane[1].rate += 1; };
  };
  R.setCrowd = function (n) { R.crowd = Math.max(1, Math.min(5, n)); var want = 12 + R.crowd * 8; while (R.ag.length < want) R.ag.push(mkAgent(R.ag.length % 4 === 0)); R.ag.length = want; };
  R.event = function () { var c = Math.floor(Math.random() * R.cams); R.evts.push({ c: c, t: 0, real: Math.random() < 0.5 }); R.models = Math.min(3, R.models + 1); };
  function geom(W, H) {
    var m = 24, top = 72, bot = 96, pw = (W - m * 3) / 2, ph = H - top - bot - 8, mh = ph - 118, s = Math.min(pw / 2000, mh / 1400); ph = Math.min(ph, 1400 * s + 128); mh = ph - 118;
    return { pw: pw, ph: ph, s: s, ox: (pw - 2000 * s) / 2, oy: 0, xs: [m, m * 2 + pw], y0: top, mh: mh };
  }
  R.update = function (dt) {
    R.t += dt;
    var i, a, L;
    for (i = 0; i < R.ag.length; i++) { a = R.ag[i]; var dx = a.tx - a.x, dy = a.ty - a.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 6) pick(a); else if (a.v) { if (Math.abs(dx) > 8) a.x += Math.sign(dx) * a.sp * dt; else a.y += Math.sign(dy) * a.sp * dt; } else { a.x += dx / d * a.sp * dt; a.y += dy / d * a.sp * dt; } }
    for (i = R.evts.length - 1; i >= 0; i--) { R.evts[i].t += dt; if (R.evts[i].t > 9) R.evts.splice(i, 1); }
    if (R.evts.length === 0 && R.models > 1 && Math.random() < dt * 0.15) R.models--;
    for (var l = 0; l < 2; l++) { L = R.lane[l]; L.f.update(dt); L.rate *= Math.max(0, 1 - dt * 0.9); }
    var N = R.lane[0], Ar = R.lane[1];
    for (i = 0; i < R.cams; i++) {
      N.nt[i] -= dt; if (N.nt[i] <= 0) { N.nt[i] += 0.5; N.f.emit(DOTS[i][0], DOTS[i][1], -1, -1, '#FF3B3B', 0.9, 6); }
      var c = 0; for (var j = 0; j < R.ag.length; j++) { var q = R.ag[j], ex = q.x - DOTS[i][0], ey = q.y - DOTS[i][1]; if (ex * ex + ey * ey < 36100) c++; }
      Ar.cd[i] -= dt; Ar.hb[i] -= dt;
      if (R.trig.count && c !== Ar.cnt[i] && Ar.cd[i] <= 0) { Ar.cd[i] = 1.2; Ar.f.emit(DOTS[i][0], DOTS[i][1], -1, -1, '#FFB020', 0.9, 7); }
      Ar.cnt[i] = c;
      if (R.trig.hb && Ar.hb[i] <= 0) { Ar.hb[i] = 4; Ar.f.emit(DOTS[i][0], DOTS[i][1], -1, -1, '#FFB020', 0.9, 7); }
    }
    for (i = 0; i < R.evts.length; i++) { var e = R.evts[i]; if (e.c < R.cams && !e.sent && R.trig.scene) { e.sent = 1; Ar.f.emit(DOTS[e.c][0], DOTS[e.c][1], -1, -1, '#FFB020', 0.8, 9); } }
  };
  var tgtN = 0, tgtA = 0;
  R.draw = function (g, W, H, img, T) {
    var G = geom(W, H), l, i, L, nm = R.cams / 6; G.y0 = 72;
    tgtN = 5650 * (0.3 + 0.7 * nm) * (1 - Math.exp(-R.t / 16)); tgtA = 1078 * (0.42 + 0.58 * R.models / 3) * (1 - 0.5 * Math.exp(-R.t / 3));
    for (l = 0; l < 2; l++) {
      L = R.lane[l]; var px = G.xs[l], py = G.y0;
      g.fillStyle = 'rgba(14,22,30,.9)'; g.fillRect(px, py, G.pw, G.ph);
      g.strokeStyle = l ? '#35E0FF' : '#FF3B3B'; g.lineWidth = 2; g.strokeRect(px, py, G.pw, G.ph);
      g.save(); g.beginPath(); g.rect(px, py, G.pw, G.mh); g.clip(); g.translate(px + G.ox, py);
      if (img) g.drawImage(img, 0, 0, 2000 * G.s, 1400 * G.s); g.scale(G.s, G.s);
      for (i = 0; i < R.ag.length; i++) { var a = R.ag[i]; g.fillStyle = a.v ? '#FFB020' : '#E8E2D0'; if (a.v) g.fillRect(a.x - 9, a.y - 5, 18, 10); else { g.beginPath(); g.arc(a.x, a.y, 6, 0, 6.3); g.fill(); } }
      for (i = 0; i < R.cams; i++) { var cx = DOTS[i][0], cy = DOTS[i][1]; g.strokeStyle = l ? '#35E0FF' : '#FF3B3B'; g.globalAlpha = 0.5; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 190, 0, 6.3); g.stroke(); g.globalAlpha = 1; g.fillStyle = '#35E0FF'; g.fillRect(cx - 8, cy - 8, 16, 16); }
      for (i = 0; i < R.evts.length; i++) { var e = R.evts[i]; if (e.c >= R.cams) continue; g.strokeStyle = '#FF3B3B'; g.lineWidth = 5; g.globalAlpha = Math.max(0, 1 - e.t / 9); g.beginPath(); g.arc(DOTS[e.c][0], DOTS[e.c][1], 40 + (e.t * 90) % 160, 0, 6.3); g.stroke(); g.globalAlpha = 1;
        if (l === 1 && e.t > 1.5) { g.fillStyle = e.real ? '#FFB020' : '#E8E2D0'; g.font = 'bold 44px "Courier New",monospace'; g.fillText(e.real ? 'CONFIRMED' : 'FALSE ALARM', DOTS[e.c][0] + 30, DOTS[e.c][1] - 40); } }
      g.restore();
      /* cloud node and packets (screen space, map offset) */
      var cxs = px + G.pw - 46, cys = py + 34;
      g.fillStyle = '#35E0FF'; g.globalAlpha = .9; g.beginPath(); g.arc(cxs - 14, cys + 4, 12, 0, 6.3); g.arc(cxs + 6, cys - 6, 15, 0, 6.3); g.arc(cxs + 22, cys + 5, 11, 0, 6.3); g.fill(); g.globalAlpha = 1;
      for (i = 0; i < 420; i++) { var p = L.f.p[i]; if (!p.on) continue; if (p.bx < 0) { p.bx = cxs; p.by = cys; p.cx = 0; p.ax = px + G.ox + p.ax * G.s; p.ay = py + p.ay * G.s; p.cx = (p.ax + p.bx) / 2; p.cy = (p.ay + p.by) / 2 - 50; } }
      L.f.draw(g);
      /* gauges */
      var gy = py + G.mh + 10;
      g.fillStyle = l ? '#35E0FF' : '#FF3B3B'; g.font = '400 34px Impact,"Arial Narrow Bold",sans-serif'; g.fillText(l ? 'ARGUS' : 'NAIVE', px + 14, gy + 34);
      g.fillStyle = '#E8E2D0'; g.font = 'bold 14px "Courier New",monospace'; g.fillText('CLOUD CALLS', px + 150, gy + 14);
      g.font = 'bold 34px "Courier New",monospace'; g.fillText(Math.round(L.calls).toLocaleString('en-US'), px + 150, gy + 44);
      var mem = l ? tgtA : tgtN; L.mem += (mem - L.mem) * 0.05;
      bar(g, px + 14, gy + 60, G.pw - 28, 'RAM ' + Math.round(L.mem).toLocaleString('en-US') + ' MB', L.mem / 5650, L.mem > 4000 ? '#FF3B3B' : '#35E0FF');
      bar(g, px + 14, gy + 90, G.pw - 28, '429 PRESSURE', Math.min(1, L.rate / 9), L.rate / 9 > 0.7 ? '#FF3B3B' : '#FFB020');
    }
    g.fillStyle = '#FFB020'; g.font = 'bold 14px "Courier New",monospace'; g.textAlign = 'left';
    g.fillText('illustrative scale; real field-run totals in the Numbers scene. 20 s heartbeat shown every 4 s.', 24, G.y0 + G.ph + 22);
  };
  function bar(g, x, y, w, label, v, col) {
    g.fillStyle = '#E8E2D0'; g.font = 'bold 14px "Courier New",monospace'; g.fillText(label, x, y + 12);
    g.fillStyle = '#1B2733'; g.fillRect(x + 190, y, w - 190, 14); g.fillStyle = col; g.fillRect(x + 190, y, (w - 190) * Math.max(0, Math.min(1, v)), 14);
  }
  R.DOTS = DOTS; R.reset();
  window.Race = R;
})();
