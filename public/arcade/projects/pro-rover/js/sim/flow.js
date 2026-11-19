/* Reusable flow engine: bezier paths, streams of particles, gates, dust. */
(function () {
  'use strict';
  var Flow = {};
  function bez(p, t) {
    var u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * p[0] + b * p[2] + c * p[4] + d * p[6], a * p[1] + b * p[3] + c * p[5] + d * p[7]];
  }
  /* Path = chain of cubic segments, each [x0,y0,c1x,c1y,c2x,c2y,x1,y1]; t in 0..1 over the chain */
  function Path(segs) { this.segs = segs; this.tmp = [0, 0]; }
  Path.prototype.at = function (t, out) {
    var n = this.segs.length, f = Math.min(Math.max(t, 0), 0.9999) * n, i = f | 0, p = bez(this.segs[i], f - i);
    out = out || this.tmp; out[0] = p[0]; out[1] = p[1]; return out;
  };
  Path.prototype.stroke = function (ctx) {
    ctx.beginPath();
    for (var i = 0; i < this.segs.length; i++) {
      var s = this.segs[i]; if (i === 0) ctx.moveTo(s[0], s[1]);
      ctx.bezierCurveTo(s[2], s[3], s[4], s[5], s[6], s[7]);
    }
    ctx.stroke();
  };
  /* Stream: fixed pool of particles moving along a path. gate = {t, open} blocks at t when closed. */
  function Stream(path, o) {
    o = o || {}; this.path = path; this.speed = o.speed || 0.25; this.rate = o.rate || 3; this.max = o.max || 24;
    this.t = new Float32Array(this.max); this.on = new Uint8Array(this.max); this.acc = 0;
    this.gate = o.gate || null; this.onBlock = o.onBlock || null; this.pt = [0, 0];
  }
  Stream.prototype.update = function (dt) {
    this.acc += dt * this.rate;
    while (this.acc >= 1) { this.acc -= 1; for (var k = 0; k < this.max; k++) if (!this.on[k]) { this.on[k] = 1; this.t[k] = 0; break; } }
    for (var i = 0; i < this.max; i++) {
      if (!this.on[i]) continue;
      var nt = this.t[i] + this.speed * dt;
      if (this.gate && !this.gate.open && this.t[i] < this.gate.t && nt >= this.gate.t) { this.on[i] = 0; if (this.onBlock) this.onBlock(this.gate.t); continue; }
      this.t[i] = nt; if (nt >= 1) this.on[i] = 0;
    }
  };
  Stream.prototype.draw = function (ctx, r, color, drawFn) {
    ctx.fillStyle = color;
    for (var i = 0; i < this.max; i++) {
      if (!this.on[i]) continue;
      var p = this.path.at(this.t[i], this.pt);
      if (drawFn) drawFn(ctx, p[0], p[1], this.t[i]); else { ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 6.2832); ctx.fill(); }
    }
  };
  /* Burst/dust particle pool (no allocation in hot loop) */
  function Pool(n) {
    this.n = n; this.x = new Float32Array(n); this.y = new Float32Array(n); this.vx = new Float32Array(n);
    this.vy = new Float32Array(n); this.life = new Float32Array(n); this.max = new Float32Array(n); this.i = 0;
  }
  Pool.prototype.emit = function (x, y, vx, vy, life) {
    var k = this.i++ % this.n; this.x[k] = x; this.y[k] = y; this.vx[k] = vx; this.vy[k] = vy; this.life[k] = life; this.max[k] = life;
  };
  Pool.prototype.burst = function (x, y, count, speed, life) {
    for (var i = 0; i < count; i++) { var a = Math.random() * 6.2832, s = speed * (0.3 + Math.random()); this.emit(x, y, Math.cos(a) * s, Math.sin(a) * s, life * (0.6 + Math.random() * 0.6)); }
  };
  Pool.prototype.update = function (dt) {
    for (var i = 0; i < this.n; i++) { if (this.life[i] <= 0) continue; this.life[i] -= dt; this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt; this.vx[i] *= 0.96; this.vy[i] *= 0.96; }
  };
  Pool.prototype.draw = function (ctx, color, r) {
    ctx.fillStyle = color;
    for (var i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      ctx.globalAlpha = Math.max(0, this.life[i] / this.max[i]) * 0.9;
      ctx.fillRect(this.x[i] - r / 2, this.y[i] - r / 2, r, r);
    }
    ctx.globalAlpha = 1;
  };
  Flow.Path = Path; Flow.Stream = Stream; Flow.Pool = Pool; Flow.bez = bez;
  window.Flow = Flow;
})();
