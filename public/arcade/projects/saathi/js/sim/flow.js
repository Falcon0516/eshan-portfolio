/* Flow engine: verlet rope, bead paths with gates, spark pool. Canvas 2D, no allocation in hot loops. */
window.Flow = (function () {
  function Rope(n) {
    this.n = n; this.x = new Float32Array(n); this.y = new Float32Array(n);
    this.px = new Float32Array(n); this.py = new Float32Array(n); this.L = 20;
  }
  Rope.prototype.init = function (ax, ay, bx, by) {
    var n = this.n;
    for (var i = 0; i < n; i++) {
      var k = i / (n - 1);
      this.x[i] = this.px[i] = ax + (bx - ax) * k; this.y[i] = this.py[i] = ay + (by - ay) * k;
    }
    this.L = Math.hypot(bx - ax, by - ay) / (n - 1) * 1.1;
  };
  /* anchor always pinned; end pinned when endPin is set */
  Rope.prototype.step = function (ax, ay, endPin, ex, ey) {
    var n = this.n, x = this.x, y = this.y, px = this.px, py = this.py, i, it;
    for (i = 1; i < n; i++) {
      var vx = (x[i] - px[i]) * 0.985, vy = (y[i] - py[i]) * 0.985;
      px[i] = x[i]; py[i] = y[i]; x[i] += vx; y[i] += vy + 0.55;
    }
    x[0] = ax; y[0] = ay;
    if (endPin) { x[n - 1] = ex; y[n - 1] = ey; }
    for (it = 0; it < 10; it++) {
      for (i = 0; i < n - 1; i++) {
        var dx = x[i + 1] - x[i], dy = y[i + 1] - y[i], d = Math.hypot(dx, dy) || 0.001;
        var f = (d - this.L) / d * 0.5, mx = dx * f, my = dy * f;
        if (i > 0) { x[i] += mx; y[i] += my; }
        if (i + 1 < n - 1 || !endPin) { x[i + 1] -= mx; y[i + 1] -= my; }
      }
      x[0] = ax; y[0] = ay;
      if (endPin) { x[n - 1] = ex; y[n - 1] = ey; }
    }
  };
  Rope.prototype.at = function (t, out) {
    var f = Math.max(0, Math.min(1, t)) * (this.n - 1), i = Math.min(this.n - 2, f | 0), r = f - i;
    out.x = this.x[i] + (this.x[i + 1] - this.x[i]) * r; out.y = this.y[i] + (this.y[i + 1] - this.y[i]) * r;
  };
  Rope.prototype.draw = function (c, color) {
    var n = this.n, i, pass;
    for (pass = 0; pass < 3; pass++) {
      c.beginPath(); c.moveTo(this.x[0], this.y[0]);
      for (i = 1; i < n; i++) c.lineTo(this.x[i], this.y[i]);
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.lineWidth = pass === 0 ? 14 : pass === 1 ? 9 : 2;
      c.strokeStyle = pass === 0 ? '#120a05' : pass === 1 ? color : 'rgba(246,231,200,.55)';
      c.stroke();
    }
  };

  /* Beads travel along any path function pt(t,out) with t in 0..1. gate(t) returns false to block. */
  function Beads(count) { this.t = new Float32Array(count); this.on = new Uint8Array(count); this.acc = 0; this.o = { x: 0, y: 0 }; }
  Beads.prototype.update = function (dt, speed, rate, gate) {
    var i, n = this.t.length;
    this.acc += dt * rate;
    for (i = 0; i < n; i++) {
      if (this.on[i]) {
        var nt = this.t[i] + dt * speed;
        if (gate && !gate(nt)) { this.on[i] = 0; continue; }
        this.t[i] = nt; if (nt >= 1) this.on[i] = 0;
      } else if (this.acc >= 1) { this.on[i] = 1; this.t[i] = 0; this.acc -= 1; }
    }
    if (this.acc > 1) this.acc = 1;
  };
  Beads.prototype.draw = function (c, pt, color, r) {
    var i, n = this.t.length;
    for (i = 0; i < n; i++) if (this.on[i]) {
      pt(this.t[i], this.o); c.fillStyle = color; c.shadowColor = color; c.shadowBlur = 14;
      c.beginPath(); c.arc(this.o.x, this.o.y, r || 5, 0, 6.2832); c.fill();
    }
    c.shadowBlur = 0;
  };

  function Sparks(n) { this.n = n; this.x = new Float32Array(n); this.y = new Float32Array(n); this.vx = new Float32Array(n); this.vy = new Float32Array(n); this.l = new Float32Array(n); this.c = []; }
  Sparks.prototype.burst = function (x, y, k, color) {
    var i, m = 0;
    for (i = 0; i < this.n && m < k; i++) if (this.l[i] <= 0) {
      var a = Math.random() * 6.28, s = 2 + Math.random() * 5;
      this.x[i] = x; this.y[i] = y; this.vx[i] = Math.cos(a) * s; this.vy[i] = Math.sin(a) * s - 1; this.l[i] = 1; this.c[i] = color; m++;
    }
  };
  Sparks.prototype.draw = function (c, dt) {
    var i;
    for (i = 0; i < this.n; i++) if (this.l[i] > 0) {
      this.x[i] += this.vx[i]; this.y[i] += this.vy[i]; this.vy[i] += 0.18; this.l[i] -= dt * 1.8;
      c.globalAlpha = Math.max(0, this.l[i]); c.fillStyle = this.c[i]; c.fillRect(this.x[i], this.y[i], 4, 4);
    }
    c.globalAlpha = 1;
  };
  return { Rope: Rope, Beads: Beads, Sparks: Sparks };
})();
