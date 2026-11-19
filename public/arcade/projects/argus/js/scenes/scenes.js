/* The monitor wall (persistent object) and the 7 scenes. Each scene = camera rect + enter/update/draw. */
(function () {
  var F = window.FACTS, N = F.nums, A = window.A = { g: null, W: 0, H: 0, dpr: 1, t: 0, st: 0, shake: 0, flash: 0, imgs: {}, sound: null, rt: 0 };
  var CLOUD = [1270, -70], flow = new window.Flow(); A.flow = flow;
  var PAPER = '#E8E2D0', AMB = '#FFB020', CY = '#35E0FF', RED = '#FF3B3B';
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ease(x) { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); }
  function over(x) { x = Math.max(0, Math.min(1, x)); var c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function txt(g, s, x, y, size, col, al, font) { g.font = (font || 'bold ') + size + 'px "Courier New",monospace'; g.fillStyle = col; g.textAlign = al || 'left'; g.fillText(s, x, y); g.textAlign = 'left'; }
  function sten(g, s, x, y, size, col, al) { g.font = '400 ' + size + 'px Impact,"Arial Narrow Bold",sans-serif'; g.fillStyle = col; g.textAlign = al || 'left'; g.fillText(s, x, y); g.textAlign = 'left'; }
  function fit(g, s, w, size) { g.font = '400 ' + size + 'px Impact,"Arial Narrow Bold",sans-serif'; var m = g.measureText(s).width; return m > w ? Math.floor(size * w / m) : size; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

  /* ---------- Wall ---------- */
  var scan = document.createElement('canvas'); scan.width = 4; scan.height = 4; var sg = scan.getContext('2d'); sg.fillStyle = 'rgba(0,0,0,.35)'; sg.fillRect(0, 0, 4, 1);
  var feeds = [], lamps = [0, 0, 0, 0], boxT = 0, mode = 'off', nextTrig = 0, naiveT = 0, trigN = 0;
  for (var r = 0; r < 2; r++) for (var c = 0; c < 3; c++) { var f = { x: 745 + c * 355, y: 70 + r * 372, w: 335, h: 330, ag: [], lit: 0 }; for (var k = 0; k < 6; k++) f.ag.push({ x: rnd(10, 320), y: rnd(60, 300), s: rnd(10, 38) * (Math.random() < .5 ? -1 : 1), v: k % 3 === 0, hit: rnd(0, 1) }); feeds.push(f); }
  var scanPat = null;
  A.wallMode = function (m) { mode = m; };
  flow.onArrive = function (q) { if (q.tag === 1) { A.calls++; } };
  A.calls = 0;
  function wallUpdate(dt) {
    var i, j, f, a;
    for (i = 0; i < 6; i++) { f = feeds[i]; f.lit = Math.min(1, f.lit + dt * (A.entryT !== undefined && A.entryT < 1 ? 0 : 1.2)); for (j = 0; j < 6; j++) { a = f.ag[j]; a.x += a.s * dt; if (a.x > 325) a.x = 10; if (a.x < 10) a.x = 325; a.hit -= dt; if (a.hit < 0) a.hit = rnd(.6, 1.6); } }
    for (i = 0; i < 4; i++) lamps[i] = Math.max(0, lamps[i] - dt * 1.4);
    if (mode === 'naive') { naiveT -= dt; if (naiveT <= 0) { naiveT = 0.07; f = feeds[(Math.random() * 6) | 0]; flow.emit(f.x + f.w / 2, f.y + f.h / 2, CLOUD[0] + rnd(-30, 30), CLOUD[1], RED, 1.1, 7, 1); } }
    if (mode === 'argus') { nextTrig -= dt; if (nextTrig <= 0) { nextTrig = rnd(1.3, 2.2); trigN++; var kind = trigN % 5 === 0 ? 2 : (trigN % 3 === 0 ? 1 : 0); A.fire(kind, (Math.random() * 6) | 0); } }
  }
  A.fire = function (kind, i) { var f = feeds[i]; lamps[kind] = 1; f.lit = 1; flow.emit(f.x + f.w / 2, f.y + f.h / 2, CLOUD[0], CLOUD[1], AMB, 1.0, 9, 1); if (A.snd) A.snd('clack'); };
  function wallDraw(g) {
    var i, j, f, a;
    for (i = 0; i < 6; i++) { f = feeds[i]; g.save(); g.beginPath(); g.rect(f.x, f.y, f.w, f.h); g.clip();
      g.fillStyle = '#0c1c24'; g.globalAlpha = 0.9 * f.lit; g.fillRect(f.x, f.y, f.w, f.h); g.globalAlpha = f.lit;
      g.strokeStyle = 'rgba(53,224,255,.12)'; g.lineWidth = 1; for (j = 1; j < 6; j++) { g.beginPath(); g.moveTo(f.x, f.y + j * 55); g.lineTo(f.x + f.w, f.y + j * 55); g.stroke(); }
      for (j = 0; j < 6; j++) { a = f.ag[j]; var ax = f.x + a.x, ay = f.y + a.y;
        g.fillStyle = a.v ? AMB : PAPER; if (a.v) g.fillRect(ax - 14, ay - 7, 28, 14); else { g.beginPath(); g.arc(ax, ay, 7, 0, 6.3); g.fill(); g.fillRect(ax - 4, ay + 6, 8, 14); }
        if (mode === 'argus') { var p = over(1 - Math.max(0, a.hit - 0.4) * 2.5); var s = 1.35 - 0.35 * p; g.strokeStyle = CY; g.lineWidth = 2; var bw = (a.v ? 44 : 26) * s, bh = (a.v ? 26 : 40) * s; g.strokeRect(ax - bw / 2, ay - bh / 2 + (a.v ? 0 : 6), bw, bh); } }
      if (!scanPat) scanPat = g.createPattern(scan, 'repeat'); g.fillStyle = scanPat; g.fillRect(f.x, f.y, f.w, f.h);
      var by = f.y + ((A.t * 60 + i * 90) % (f.h + 60)) - 30; g.fillStyle = 'rgba(53,224,255,.06)'; g.fillRect(f.x, by, f.w, 30);
      g.restore();
      if (Math.sin(A.t * 4 + i) > 0) { g.fillStyle = RED; g.beginPath(); g.arc(f.x + 22, f.y + 24, 6, 0, 6.3); g.fill(); }
      txt(g, 'CAM ' + (i + 1), f.x + 36, f.y + 30, 16, PAPER); if (mode === 'argus') txt(g, 'YOLOv8n ' + N.yoloMs + ' ms', f.x + f.w - 150, f.y + 30, 14, CY); }
    /* cloud */
    g.fillStyle = mode === 'naive' ? RED : CY; g.globalAlpha = 0.95; g.beginPath(); g.arc(CLOUD[0] - 40, CLOUD[1] + 10, 28, 0, 6.3); g.arc(CLOUD[0] + 5, CLOUD[1] - 14, 38, 0, 6.3); g.arc(CLOUD[0] + 50, CLOUD[1] + 10, 28, 0, 6.3); g.fill(); g.globalAlpha = 1;
    txt(g, 'CLOUD', CLOUD[0], CLOUD[1] + 70, 18, PAPER, 'center');
    flow.draw(g);
    /* lamp glow */
    var gr = g.createRadialGradient(1010, 880, 10, 1010, 880, 420); gr.addColorStop(0, 'rgba(255,200,90,' + (0.18 + 0.03 * Math.sin(A.t * 3)) + ')'); gr.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = gr; g.fillRect(500, 500, 1000, 800);
  }
  /* ---------- HUD helpers (screen space) ---------- */
  function panel(g, x, y, w, h) { g.fillStyle = 'rgba(8,12,16,.86)'; g.fillRect(x, y, w, h); g.fillStyle = AMB; g.fillRect(x, y, 5, h); }
  function meter(g, x, y, label, val, col, spin) {
    txt(g, label, x, y, 14, col);
    var s = fmt(val); if (spin && val > 100) { s = s.slice(0, -1) + Math.floor(Math.random() * 10); }
    txt(g, s, x, y + 44, 44, PAPER);
  }
  function gauge(g, x, y, w, label, val, max, col) {
    txt(g, label, x, y, 14, col); txt(g, fmt(val) + ' MB', x + w, y, 14, PAPER, 'right');
    g.fillStyle = '#1B2733'; g.fillRect(x, y + 8, w, 16); g.fillStyle = val / max > .75 ? RED : col; g.fillRect(x, y + 8, w * Math.min(1, val / max), 16);
    g.fillStyle = RED; g.fillRect(x + w * .8, y + 4, 2, 24);
  }
  function race(t) { return Math.min(1, t / 14); }
  var rt = 0;

  /* ---------- Scenes ---------- */
  var S = [];
  S[0] = { cam: { x: -60, y: -130, w: 2000, h: 1250 },
    enter: function () { A.wallMode('naive'); rt = 0; },
    update: function (dt) { rt += dt; },
    draw: function (g, W, H) { var k = ease(rt / 12), px = W * .04, py = H * .2;
      panel(g, px - 14, py - 34, 360, 230); meter(g, px, py, 'CLOUD CALLS', N.callsNaive * k, RED, true); gauge(g, px, py + 80, 320, 'RAM', N.memNaive * ease(rt / 10), 6000, RED);
      txt(g, 'NAIVE LANE', px, py + 130, 16, RED); txt(g, 'illustrative scale', px, py + 156, 14, AMB); } };
  S[1] = { cam: { x: -60, y: -130, w: 2000, h: 1250 },
    enter: function () { A.wallMode('argus'); rt = 0; },
    update: function (dt) { rt += dt; },
    draw: function (g, W, H) { var k = ease(rt / 12), px = W * .04, py = H * .2;
      panel(g, px - 14, py - 34, 360, 230);
      meter(g, px, py, 'NAIVE CALLS', N.callsNaive * (0.35 + 0.65 * k), RED, true); meter(g, px, py + 110, 'ARGUS CALLS', N.callsArgus * Math.min(1, (rt + 1) / 14), CY, false);
      txt(g, 'illustrative scale', px, py + 170, 14, AMB);
      var lx = W * .05, ly = H * .5; for (var i = 0; i < 4; i++) { var on = lamps[i]; g.fillStyle = on > 0 ? AMB : '#2a3440'; g.globalAlpha = 0.4 + 0.6 * Math.min(1, on * 1.4 + (on > 0 ? 0 : 0)); g.beginPath(); g.arc(lx + 14, ly + i * 34, 11, 0, 6.3); g.fill(); g.globalAlpha = 1; txt(g, F.triggers[i], lx + 38, ly + i * 34 + 5, 16, on > 0 ? AMB : PAPER); } } };
  var rack = [], seq = [[.8, 0], [1.8, 1], [2.8, 2], [4.4, 3]], evicted = -1, ev0 = 0;
  S[2] = { cam: { x: 1300, y: 480, w: 1260, h: 900 },
    enter: function () { A.wallMode('off'); rt = 0; rack = [-1, -1, -1]; evicted = -1; },
    update: function (dt) { rt += dt; var cyc = rt % 10; if (cyc < dt && rt > 1) { rack = [-1, -1, -1]; evicted = -1; }
      for (var i = 0; i < 4; i++) if (cyc >= seq[i][0] && cyc - dt < seq[i][0]) { if (i < 3) { rack[i] = i; } else { rack[0] = 3; evicted = 0; ev0 = cyc; } if (A.snd) A.snd('clack'); } },
    draw: function (g, W, H) { var cyc = rt % 10, x0 = W * .32, y0 = H * .24, sw = Math.min(250, W * .17), gap = 22;
      g.fillStyle = 'rgba(8,12,16,.86)'; g.fillRect(x0 - 30, y0 - 90, sw * 3 + gap * 2 + 60, 380); g.fillStyle = AMB; g.fillRect(x0 - 30, y0 - 90, sw * 3 + gap * 2 + 60, 5);
      txt(g, 'ROUTER (VLM) PICKS UP TO 3', x0, y0 - 50, 16, CY); txt(g, 'GRACE: 2 MISSES', x0 + sw * 3 + gap * 2, y0 - 50, 14, AMB, 'right');
      for (var s = 0; s < 3; s++) { var x = x0 + s * (sw + gap); g.strokeStyle = '#4a5d6f'; g.lineWidth = 3; g.strokeRect(x, y0, sw, 220); txt(g, 'SLOT ' + (s + 1), x + 10, y0 + 22, 14, '#7f93a6');
        var m = rack[s]; if (m >= 0) { var born = seq[m][0], age = cyc - born, sl = m === 3 ? over(age / .5) : over(age / .6), yy = y0 + (1 - sl) * -140; var leaving = m === 0 && evicted === 0 && cyc > ev0 + 1.2;
          if (m === 0 && evicted !== 0) { /* LRU candidate shows grace ring at 4.2..5.6 */ }
          g.save(); g.globalAlpha = Math.min(1, sl * 1.4); g.fillStyle = m === 3 ? '#3a2a10' : '#14232f'; g.fillRect(x + 8, yy + 40, sw - 16, 160); g.strokeStyle = m === 3 ? AMB : CY; g.lineWidth = 2; g.strokeRect(x + 8, yy + 40, sw - 16, 160);
          sten(g, F.models[m], x + 18, yy + 100, fit(g, F.models[m], sw - 36, 30), PAPER); txt(g, m === 3 ? 'NEWEST' : 'LOADED', x + 18, yy + 180, 14, m === 3 ? AMB : CY); g.restore(); }
        if (s === 0 && cyc > 3.6 && cyc < 5.6) { var gp = (cyc - 3.6) / 2; g.strokeStyle = AMB; g.lineWidth = 6; g.beginPath(); g.arc(x + sw - 34, y0 + 70, 20, -1.57, -1.57 + 6.28 * gp); g.stroke(); } }
      if (cyc > 3.6 && cyc < 4.4) { g.globalAlpha = 1; txt(g, 'NEW CARD ARRIVES', x0 + sw * 3 + gap * 2, y0 + 256, 16, AMB, 'right'); }
      if (cyc > 5.6) { var ex = x0 - 120 - (cyc - 5.6) * 140; g.globalAlpha = Math.max(0, 1 - (cyc - 5.6) * 1.2); g.fillStyle = '#14232f'; g.fillRect(x0 + 8 - (cyc - 5.6) * 380, y0 + 40, sw - 16, 160); sten(g, 'WEAPON', x0 + 18 - (cyc - 5.6) * 380, y0 + 100, fit(g, 'WEAPON', sw - 36, 30), PAPER); g.globalAlpha = 1; } } };
  var stamp1 = 0, stamp2 = 0, shook1 = 0, shook2 = 0;
  function stampDraw(g, idx, x, y, w, text, p, ang) {
    if (p <= 0) return; var R = [[49, 108, 485, 305], [585, 155, 451, 193], [1086, 107, 491, 315]][idx], k = w / R[2], h = R[3] * k, im = A.imgs.stamp;
    g.save(); g.translate(x + w / 2, y + h / 2); var sc = 3 - 2 * Math.min(1, p) + (p > 1 ? 0 : 0); sc = p >= 1 ? 1 : 1 + 2 * (1 - over(p)) ; g.scale(sc, sc); g.globalAlpha = Math.min(1, p * 3); g.globalCompositeOperation = 'multiply'; g.rotate(ang);
    if (im) g.drawImage(im, R[0], R[1], R[2], R[3], -w / 2, -h / 2, w, h); else { g.strokeStyle = '#b01818'; g.lineWidth = 6; g.strokeRect(-w / 2, -h / 2, w, h); }
    sten(g, text, 0, h * .14, Math.min(h * .5, w * .13), '#a81616', 'center'); g.restore();
  }
  function pict(g, x, y, kind) { /* pictogram crop: kind 0 phone held like pistol, 1 pistol shape */
    g.fillStyle = '#2a3440'; g.fillRect(x, y, 230, 170); g.fillStyle = '#c9a98a'; g.fillRect(x + 40, y + 70, 70, 44);
    if (kind === 0) { g.save(); g.translate(x + 130, y + 62); g.rotate(-.2); g.fillStyle = '#10161c'; g.fillRect(0, 0, 38, 66); g.fillStyle = CY; g.fillRect(4, 5, 30, 50); g.restore(); }
    else { g.fillStyle = '#10161c'; g.fillRect(x + 100, y + 62, 90, 22); g.fillRect(x + 100, y + 80, 22, 50); }
    g.strokeStyle = AMB; g.lineWidth = 2; g.strokeRect(x + 4, y + 4, 222, 162); }
  S[3] = { cam: { x: 560, y: -60, w: 1300, h: 860 },
    enter: function () { A.wallMode('off'); rt = 0; shook1 = shook2 = 0; },
    update: function (dt) { rt += dt; var c = rt % 14; if (c > 4.4 && !shook1) { shook1 = 1; A.shake = 1; if (A.snd) A.snd('thump'); } if (c > 10.4 && !shook2) { shook2 = 1; A.shake = 1; if (A.snd) A.snd('thump'); } if (c < dt) { shook1 = shook2 = 0; } },
    draw: function (g, W, H) { var c = rt % 14, px = W * .4, py = H * .13, w = Math.min(W * .5, 640);
      g.fillStyle = 'rgba(8,12,16,.88)'; g.fillRect(px - 20, py - 20, w + 40, H * .62); g.fillStyle = AMB; g.fillRect(px - 20, py - 20, w + 40, 5);
      var second = c >= 7, base = second ? 7 : 0, t = c - base, kind = second ? 1 : 0;
      g.fillStyle = PAPER; g.fillRect(px, py, 250, 190); pict(g, px + 10, py + 10, kind);
      txt(g, 'CROP', px + 262, py + 24, 14, CY);
      var wconf = (kind ? .91 : .61) * ease((t - .6) / 1), by = py + 50; txt(g, 'WEAPON MODEL', px + 262, by + 16, 16, PAPER); g.fillStyle = '#1B2733'; g.fillRect(px + 262, by + 26, 280, 16); g.fillStyle = RED; g.fillRect(px + 262, by + 26, 280 * wconf, 16); txt(g, 'ALERT', px + 262 + 292, by + 40, 16, RED);
      if (t > 1.8) { txt(g, 'STAGE 2 LOOKS AT THE CROP', px + 262, by + 82, 16, CY); var dots = '.'.repeat(1 + Math.floor(t * 3) % 3); if (t < 3.6) txt(g, dots, px + 262, by + 108, 24, CY); }
      stampDraw(g, kind ? 1 : 0, px + 250 - (kind ? 30 : 20), py + 80, kind ? 400 : 330, kind ? 'CONFIRMED' : 'FALSE ALARM', (t - 3.8) / .4, kind ? 0 : -.14);
      txt(g, 'weapon.pt precision ' + N.weaponPrec + ' / false discoveries ' + N.weaponFDR, px, py + 290, 16, AMB); txt(g, 'phone held like a pistol (pictogram)', px, py + 316, 14, '#9fb0c0'); } };
  var CAMS = window.Race.DOTS, SUS = [[0, 1, 3, 5, 4], [1, 3, 2, 5]], hsel = 0, htime = 0, spring = [];
  function mapRect(W, H) { var bw = Math.min(W * .62, H * .98 * 1.5), bh = bw / 1.5; return { x: W * .06, y: H * .1, w: bw, h: bh }; }
  S[4] = { cam: { x: 0, y: 60, w: 900, h: 700 },
    enter: function () { A.wallMode('off'); rt = 0; hsel = 0; document.querySelectorAll('#hunt button').forEach(function (b, i) { b.classList.toggle('sel', i === 0); }); },
    update: function (dt) { rt += dt; },
    draw: function (g, W, H) { var B = mapRect(W, H), a = ease((rt - .5) / 1);
      g.globalAlpha = a; if (A.imgs.board) g.drawImage(A.imgs.board, B.x, B.y, B.w, B.h); else { g.fillStyle = '#6b4a2a'; g.fillRect(B.x, B.y, B.w, B.h); }
      var m = { x: B.x + B.w * .17, y: B.y + B.h * .2, w: B.w * .66, h: B.h * .6 }; if (A.imgs.map) g.drawImage(A.imgs.map, m.x, m.y, m.w, m.h); else { g.fillStyle = '#0d1a2a'; g.fillRect(m.x, m.y, m.w, m.h); }
      g.strokeStyle = PAPER; g.lineWidth = 6; g.strokeRect(m.x, m.y, m.w, m.h);
      var pts = SUS[hsel].map(function (i) { return [m.x + CAMS[i][0] / 2000 * m.w, m.y + CAMS[i][1] / 1400 * m.h]; }), tt = (rt - 1) / 1.1;
      for (var i = 0; i < CAMS.length; i++) { g.fillStyle = 'rgba(53,224,255,.7)'; g.fillRect(m.x + CAMS[i][0] / 2000 * m.w - 5, m.y + CAMS[i][1] / 1400 * m.h - 5, 10, 10); }
      g.strokeStyle = RED; g.lineWidth = 4; g.lineCap = 'round';
      for (var s = 0; s < pts.length - 1; s++) { var u = tt - s; if (u <= 0) break; var sp = Math.min(1, u); var k = 1 - Math.pow(1 - sp, 3) * Math.cos(sp * 9) * 0.0 ; var ov = sp >= 1 ? 1 : over(sp); var ax = pts[s][0], ay = pts[s][1], bx = pts[s + 1][0], by = pts[s + 1][1], ex = ax + (bx - ax) * ov, ey = ay + (by - ay) * ov;
        g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo((ax + ex) / 2, (ay + ey) / 2 + 16 * Math.sin(A.t * 6 + s) * (1 - sp), ex, ey); g.stroke(); }
      for (var p = 0; p < pts.length; p++) { var pu = tt - (p - 1); if (p === 0) pu = tt + 1; if (pu <= 0) continue; var sc = over(Math.min(1, pu * 2)); g.save(); g.translate(pts[p][0], pts[p][1]); g.scale(sc, sc); g.fillStyle = RED; g.beginPath(); g.arc(0, 0, 11, 0, 6.3); g.fill(); g.fillStyle = '#fff4'; g.fillRect(-4, -5, 4, 4); g.restore();
        var sec = (p * 98 + (hsel ? 40 : 0)); txt(g, 'T+' + ('0' + Math.floor(sec / 60)).slice(-2) + ':' + ('0' + (sec % 60)).slice(-2), pts[p][0] + 16, pts[p][1] - 12, 16, AMB); }
      g.globalAlpha = 1; txt(g, 'FACE 0.42  CLOTHES 0.74  PLATE 1 EDIT', B.x + 16, B.y + B.h + 28, 16, PAPER); txt(g, hsel ? 'placeholder plate XX-00' : 'clothing fingerprint', B.x + B.w - 16, B.y + B.h + 28, 14, AMB, 'right'); },
    pick: function (i) { hsel = i; rt = 0.6; } };
  var cnt = [[N.callsArgus, 0], [N.callsNaive, 0], [1077.8, 1], [5650, 1], [2, 2], [31, 3]];
  S[5] = { cam: { x: 600, y: 680, w: 1400, h: 760 },
    enter: function () { A.wallMode('off'); rt = 0; },
    update: function (dt) { rt += dt; },
    draw: function (g, W, H) { var px = W * .05, py = H * .17, pw = Math.min(W * .62, 900); panel(g, px - 14, py - 34, pw, H * .5);
      var rows = [['CLOUD CALLS', N.callsArgus, N.callsNaive, '99.79% FEWER'], ['PEAK MEMORY MB', N.memArgus, N.memNaive, 'vs load everything'], ['FALSE ALARMS CAUGHT', 2, 4, 'Stage 2 suppressed 2 of 4'], ['CAMERA HOPS', 31, 0, 'one suspect, ' + N.searchTime]];
      for (var i = 0; i < rows.length; i++) { var y = py + i * H * .1, k = ease((rt - i * .5) / 1.6), r = rows[i]; txt(g, r[0], px, y, 14, CY);
        var v = r[1] * k; txt(g, i === 1 ? v.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : fmt(v), px, y + 52, Math.min(60, H * .07), PAPER);
        if (r[2]) txt(g, (i === 2 ? 'of ' : 'vs ') + fmt(r[2]), px + pw * .5, y + 52, Math.min(34, H * .045), i === 2 ? PAPER : RED);
        txt(g, r[3], px, y + 76, 16, AMB); }
      txt(g, 'source: ' + F.SRC, px, py + H * .43, 16, CY); } };
  S[6] = { cam: { x: 880, y: 820, w: 900, h: 600 }, enter: function () { A.wallMode('off'); rt = 0; }, update: function (dt) { rt += dt; }, draw: function () {} };
  S.forEach(function (s) { s.update = s.update || function () {}; });
  A.scenes = S; A.wallUpdate = wallUpdate; A.wallDraw = wallDraw; A.lampN = lamps;
})();
