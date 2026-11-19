/* Impact FX: canvas particles, lightning bolt, confetti, screen shake, synthesised sound (muted by default). */
(function () {
  var cv, ctx, W = 0, H = 0, dpr = 1, P = [], MAXP = 420, bolts = [], shk = { a: 0, t: 0, d: 0 }, shakeEl;
  var COLS = ['#FF6B9A', '#FFD166', '#6BCBFF', '#7BE0AD', '#9B7BFF', '#FF9F43'];
  for (var i = 0; i < MAXP; i++) P.push({ on: 0, x: 0, y: 0, vx: 0, vy: 0, l: 0, m: 1, s: 4, c: '#fff', k: 0, r: 0, vr: 0, g: 0 });
  var cursor = 0;
  function take() { for (var n = 0; n < MAXP; n++) { cursor = (cursor + 1) % MAXP; if (!P[cursor].on) return P[cursor]; } return P[cursor]; }
  function resize() { dpr = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function init() { cv = document.getElementById('fx'); ctx = cv.getContext('2d'); shakeEl = document.getElementById('shake'); resize(); window.addEventListener('resize', resize); }

  var fx = {
    init: init,
    burst: function (wx, wy, n, o) { // world coords
      o = o || {}; var s = PF.cam.w2s(wx, wy); fx.burstScreen(s.x, s.y, n, o);
    },
    burstScreen: function (x, y, n, o) {
      o = o || {}; if (PF.reduced) n = Math.ceil(n / 3);
      for (var i = 0; i < n; i++) {
        var p = take(), a = Math.random() * 6.283, v = (o.speed || 380) * (0.35 + Math.random() * 0.8);
        p.on = 1; p.x = x; p.y = y; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - (o.up || 80); p.l = p.m = (o.life || 0.7) * (0.6 + Math.random() * 0.7);
        p.s = (o.size || 7) * (0.6 + Math.random() * 0.8); p.c = o.colors ? o.colors[(Math.random() * o.colors.length) | 0] : COLS[(Math.random() * COLS.length) | 0];
        p.k = o.kind || 0; p.r = Math.random() * 6; p.vr = (Math.random() - 0.5) * 12; p.g = o.grav == null ? 900 : o.grav;
      }
    },
    confetti: function (n) {
      n = PF.reduced ? 20 : (n || 140);
      for (var i = 0; i < n; i++) {
        var p = take(); p.on = 1; p.x = Math.random() * W; p.y = -20 - Math.random() * H * 0.4; p.vx = (Math.random() - 0.5) * 160; p.vy = 120 + Math.random() * 260;
        p.l = p.m = 2.6 + Math.random() * 1.6; p.s = 9 + Math.random() * 9; p.c = COLS[(Math.random() * COLS.length) | 0]; p.k = 2; p.r = Math.random() * 6; p.vr = (Math.random() - 0.5) * 10; p.g = 120;
      }
    },
    bolt: function (ax, ay, bx, by, ms) { // world coords
      var a = PF.cam.w2s(ax, ay), b = PF.cam.w2s(bx, by); bolts.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, t: (ms || 380) / 1000, tt: 0, seed: Math.random() });
      if (bolts.length > 6) bolts.shift();
    },
    shake: function (amp, ms) { if (PF.reduced) return; shk.a = amp; shk.d = ms / 1000; shk.t = ms / 1000; },
    update: function (dt) {
      var any = false, i, p;
      if (shk.t > 0) { shk.t -= dt; var k = Math.max(0, shk.t / shk.d), a = shk.a * k * k; shakeEl.style.transform = 'translate3d(' + ((Math.random() - 0.5) * 2 * a).toFixed(1) + 'px,' + ((Math.random() - 0.5) * 2 * a).toFixed(1) + 'px,0)'; if (shk.t <= 0) shakeEl.style.transform = ''; }
      for (i = 0; i < MAXP; i++) if (P[i].on) { any = true; break; }
      if (!any && !bolts.length) { if (fx._dirty) { ctx.clearRect(0, 0, W, H); fx._dirty = false; } return; }
      fx._dirty = true; ctx.clearRect(0, 0, W, H);
      for (i = 0; i < MAXP; i++) {
        p = P[i]; if (!p.on) continue; p.l -= dt; if (p.l <= 0 || p.y > H + 40) { p.on = 0; continue; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        var al = Math.min(1, p.l / p.m * 1.6); ctx.globalAlpha = al; ctx.fillStyle = p.c;
        if (p.k === 2) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }
        else if (p.k === 1) { ctx.strokeStyle = p.c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (0.5 + 0.5 * al), 0, 6.283); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      for (i = bolts.length - 1; i >= 0; i--) {
        var b = bolts[i]; b.tt += dt; if (b.tt >= b.t) { bolts.splice(i, 1); continue; }
        var jit = Math.floor(b.tt * 14), r = b.seed * 97 + jit * 13.7, steps = 9, dx = b.bx - b.ax, dy = b.by - b.ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
        var fade = 1 - b.tt / b.t;
        for (var pass = 0; pass < 2; pass++) {
          ctx.beginPath(); ctx.moveTo(b.ax, b.ay);
          for (var s = 1; s < steps; s++) { var tt = s / steps, o = Math.sin(r * (s + 1.3) * 12.9898) * 43758.5453; o = (o - Math.floor(o) - 0.5) * 70 * (1 - Math.abs(tt - 0.5) * 0.6); ctx.lineTo(b.ax + dx * tt + nx * o, b.ay + dy * tt + ny * o); }
          ctx.lineTo(b.bx, b.by);
          ctx.strokeStyle = pass ? '#FFF7E8' : '#FFD166'; ctx.lineWidth = pass ? 3 : 10; ctx.globalAlpha = (pass ? 1 : 0.55) * fade; ctx.lineJoin = 'round'; ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
  };

  /* Synth sound: AudioContext is created only after a user gesture (pressing M). */
  var ac = null, muted = true;
  function tone(type, f0, f1, dur, vol, delay) {
    if (muted || !ac) return; var t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, f) {
    if (muted || !ac) return; var n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ac.createBufferSource(), g = ac.createGain(), fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f || 2000; s.buffer = b; g.gain.value = vol;
    s.connect(fl); fl.connect(g); g.connect(ac.destination); s.start();
  }
  PF.snd = {
    toggle: function () {
      if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
      muted = !muted; if (ac && ac.state === 'suspended') ac.resume(); if (!muted) this.click(); return !muted;
    },
    isOn: function () { return !muted; },
    click: function () { tone('square', 900, 400, 0.05, 0.08); noise(0.03, 0.15, 3500); },
    snap: function () { tone('square', 520, 180, 0.09, 0.1); noise(0.05, 0.2, 2500); },
    ding: function () { tone('sine', 988, 988, 0.5, 0.12); tone('sine', 1319, 1319, 0.6, 0.09, 0.09); },
    zap: function () { tone('sawtooth', 1800, 90, 0.35, 0.1); noise(0.3, 0.25, 4000); },
    whir: function () { tone('triangle', 120, 260, 0.7, 0.07); },
    pop: function () { tone('sine', 300, 700, 0.08, 0.1); },
    cut: function () { tone('square', 1200, 600, 0.06, 0.06); }
  };
  PF.fx = fx;
})();
