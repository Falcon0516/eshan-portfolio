/* Reusable flow engine: bezier paths carrying particles, with gates, obstacles and a cut tool.
   Use: var f = new K.Flow(); var p = f.addPath({pts:[x0,y0,x1,y1,x2,y2,x3,y3], rate:6, speed:.5, color:'#FF2E93'});
        f.update(dt, now); f.draw(ctx, now); f.cut(x,y,r,ms); */
(function () {
  var N = 40;
  function Flow(opts) { opts = opts || {}; this.paths = []; this.parts = []; this.max = opts.max || 260; this.onArrive = null; this.onCut = null; this.obstacles = []; }
  Flow.prototype.addPath = function (o) {
    var p = { id: o.id, pts: o.pts, rate: o.rate == null ? 4 : o.rate, speed: o.speed || 0.4, color: o.color || '#FF2E93', w: o.w || 6, ink: o.ink !== false,
      acc: 0, cutT: 0.5, cutUntil: 0, drawn: o.drawn == null ? 1 : o.drawn, dash: o.dash !== false, size: o.size || 7, on: o.on !== false, xs: new Float32Array(N + 1), ys: new Float32Array(N + 1), len: 1 };
    this.setPts(p, o.pts); this.paths.push(p); return p;
  };
  Flow.prototype.setPts = function (p, q) {
    p.pts = q; var i, t, mt, len = 0;
    for (i = 0; i <= N; i++) {
      t = i / N; mt = 1 - t;
      p.xs[i] = mt * mt * mt * q[0] + 3 * mt * mt * t * q[2] + 3 * mt * t * t * q[4] + t * t * t * q[6];
      p.ys[i] = mt * mt * mt * q[1] + 3 * mt * mt * t * q[3] + 3 * mt * t * t * q[5] + t * t * t * q[7];
      if (i) len += Math.hypot(p.xs[i] - p.xs[i - 1], p.ys[i] - p.ys[i - 1]);
    }
    p.len = len || 1;
  };
  Flow.prototype.at = function (p, t, out) {
    var f = K.clamp(t, 0, 1) * N, i = Math.min(N - 1, f | 0), k = f - i;
    out.x = p.xs[i] + (p.xs[i + 1] - p.xs[i]) * k; out.y = p.ys[i] + (p.ys[i + 1] - p.ys[i]) * k; return out;
  };
  Flow.prototype.emit = function (p) {
    if (this.parts.length >= this.max) return;
    this.parts.push({ p: p, t: 0, v: 0.85 + Math.random() * 0.3, hold: 0 });
  };
  Flow.prototype.burst = function (p, n) { for (var i = 0; i < n; i++) this.emit(p); };
  Flow.prototype.update = function (dt, now) {
    var i, p, q, j, o;
    for (i = 0; i < this.paths.length; i++) {
      p = this.paths[i]; if (!p.on || p.rate <= 0) continue;
      p.acc += p.rate * dt; while (p.acc >= 1) { p.acc -= 1; this.emit(p); }
    }
    for (j = this.parts.length - 1; j >= 0; j--) {
      q = this.parts[j]; p = q.p;
      var step = (p.speed * q.v * p.drawn * 600 / p.len) * dt;
      var nt = q.t + step;
      if (p.cutUntil > now && q.t < p.cutT && nt >= p.cutT) { nt = p.cutT - 0.004; q.hold += dt; if (q.hold > 1.6) { if (this.onCut) this.onCut(p, p.xs[0], p.ys[0]); this.parts.splice(j, 1); continue; } }
      q.t = nt;
      if (q.t >= 1) { if (this.onArrive) this.onArrive(p, q); this.parts.splice(j, 1); }
    }
  };
  /* user disturbance: block the route nearest (x,y) for ms. returns the path hit or null */
  Flow.prototype.cut = function (x, y, r, ms, now) {
    var i, k, p, best = null, bd = r;
    for (i = 0; i < this.paths.length; i++) {
      p = this.paths[i];
      for (k = 0; k <= N; k++) { var d = Math.hypot(p.xs[k] - x, p.ys[k] - y); if (d < bd) { bd = d; best = p; best.cutT = k / N; } }
    }
    if (best) best.cutUntil = now + ms; return best;
  };
  Flow.prototype.draw = function (ctx, now, o) {
    o = o || {}; var i, p, q, j, pt = { x: 0, y: 0 };
    ctx.lineCap = 'round';
    if (!o.noLines) for (i = 0; i < this.paths.length; i++) {
      p = this.paths[i]; if (p.drawn <= 0) continue;
      ctx.beginPath(); ctx.moveTo(p.xs[0], p.ys[0]);
      var upto = Math.max(1, Math.round(N * p.drawn));
      for (j = 1; j <= upto; j++) ctx.lineTo(p.xs[j], p.ys[j]);
      if (p.ink) { ctx.setLineDash([]); ctx.strokeStyle = K.COL.ink; ctx.lineWidth = p.w + 5; ctx.stroke(); }
      ctx.setLineDash(p.dash ? [p.w * 2.2, p.w * 1.6] : []); ctx.lineDashOffset = -now * 0.03 * p.w;
      ctx.strokeStyle = p.cutUntil > now ? K.COL.paper : p.color; ctx.lineWidth = p.w; ctx.stroke(); ctx.setLineDash([]);
      if (p.cutUntil > now) { ctx.fillStyle = K.COL.mag; ctx.beginPath(); ctx.arc(p.xs[(p.cutT * N) | 0], p.ys[(p.cutT * N) | 0], p.w * 1.6, 0, 7); ctx.fill(); }
    }
    for (j = 0; j < this.parts.length; j++) {
      q = this.parts[j]; p = q.p; this.at(p, q.t, pt);
      ctx.fillStyle = K.COL.ink; ctx.beginPath(); ctx.arc(pt.x, pt.y, p.size + 3, 0, 7); ctx.fill();
      ctx.fillStyle = o.partColor || K.COL.gold; ctx.beginPath(); ctx.arc(pt.x, pt.y, p.size, 0, 7); ctx.fill();
    }
  };
  K.Flow = Flow;
})();
