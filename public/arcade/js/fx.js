/* Particle pool (no allocation in the hot loop), CRT static, flood and collapse helpers. */
(function (A) {
  var MAX = 120, P = [], i;
  for (i = 0; i < MAX; i++) P.push({ on: 0, x: 0, y: 0, vx: 0, vy: 0, l: 0, m: 1, s: 2, c: '#fff', g: 0 });
  var cur = 0, statOn = 0, sctx = null, simg = null;
  function spawn(x, y, vx, vy, life, size, color, grav) {
    var p = P[cur = (cur + 1) % MAX];
    p.on = 1; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.l = life; p.m = life; p.s = size; p.c = color; p.g = grav;
  }
  A.fx = {
    count: function () { var n = 0, k; for (k = 0; k < MAX; k++) if (P[k].on) n++; return n; },
    puff: function (x, y, dir) { for (var k = 0; k < 4; k++) spawn(x, y, -dir * (20 + Math.random() * 60), -(10 + Math.random() * 40), 0.45 + Math.random() * 0.3, 6 + Math.random() * 8, 'rgba(210,190,230,.55)', -20); },
    burst: function (x, y, n, color) { for (var k = 0; k < n; k++) { var a = Math.random() * 6.283, v = 120 + Math.random() * 380; spawn(x, y, Math.cos(a) * v, Math.sin(a) * v - 120, 0.5 + Math.random() * 0.5, 4 + Math.random() * 6, color, 600); } },
    spark: function (x, y, color) { spawn(x, y, (Math.random() - 0.5) * 30, -20 - Math.random() * 50, 1.2 + Math.random(), 3, color, -10); },
    update: function (dt) {
      for (var k = 0; k < MAX; k++) { var p = P[k]; if (!p.on) continue; p.l -= dt; if (p.l <= 0) { p.on = 0; continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    },
    draw: function (c, ox) {
      for (var k = 0; k < MAX; k++) { var p = P[k]; if (!p.on) continue; var a = p.l / p.m; c.globalAlpha = a > 1 ? 1 : a; c.fillStyle = p.c; c.fillRect((p.x + ox) | 0, p.y | 0, p.s, p.s); }
      c.globalAlpha = 1;
    },
    shake: function (el, ms) {
      if (A.S.rm) return; var t0 = performance.now();
      (function f(t) { var k = (t - t0) / ms; if (k >= 1) { el.style.transform = ''; return; } var m = (1 - k) * 9; el.style.transform = 'translate(' + ((Math.random() - .5) * m).toFixed(1) + 'px,' + ((Math.random() - .5) * m).toFixed(1) + 'px)'; requestAnimationFrame(f); })(t0);
    },
    /* static noise on the #stat canvas */
    static: function (ms, alpha) {
      var cv = document.getElementById('stat'); if (!cv) return; if (!sctx) { sctx = cv.getContext('2d'); simg = sctx.createImageData(cv.width, cv.height); }
      statOn = performance.now() + ms; cv.style.opacity = alpha == null ? 0.7 : alpha; A.audio.play('static');
    },
    tickStatic: function (now) {
      var cv = document.getElementById('stat'); if (!sctx || !cv) return;
      if (now < statOn) { var d = simg.data, n = d.length, k, v; for (k = 0; k < n; k += 4) { v = (Math.random() * 255) | 0; d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255; } sctx.putImageData(simg, 0, 0); }
      else if (cv.style.opacity !== '0') cv.style.opacity = 0;
    },
    flood: function (color, a, ms) { var f = document.getElementById('flood'); f.style.transition = 'opacity ' + (ms || 200) + 'ms linear'; f.style.background = color; f.style.opacity = a; }
  };
})(window.A = window.A || {});
