/* Reusable flow engine: bezier paths with arc-length sampling, pooled carriers, speed gates, obstacles.
   Usage: var fl = new PF.Flow({make:function(c){return el}, parent:node});
          fl.path('belt', [[p0,p1,p2,p3],...]); fl.spawn('belt',{speed:300,data:{}}); fl.update(dt) from the main loop. */
(function () {
  function Path(segs) {
    this.segs = segs; this.lut = []; this.len = 0; var N = 28, px = null, py = null, self = this;
    this.pts = [];
    segs.forEach(function (sg) {
      for (var i = 0; i <= N; i++) {
        var t = i / N, x = bz(sg[0][0], sg[1][0], sg[2][0], sg[3][0], t), y = bz(sg[0][1], sg[1][1], sg[2][1], sg[3][1], t);
        if (px !== null) self.len += Math.hypot(x - px, y - py);
        if (!(i === 0 && px !== null)) self.pts.push({ x: x, y: y, s: self.len });
        px = x; py = y;
      }
    });
    this.out = { x: 0, y: 0, a: 0 };
  }
  function bz(a, b, c, d, t) { var u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; }
  Path.prototype.at = function (s) { // position and angle at arc length s
    var p = this.pts, lo = 0, hi = p.length - 1;
    if (s <= 0) s = 0; if (s >= this.len) s = this.len;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (p[m].s <= s) lo = m; else hi = m; }
    var a = p[lo], b = p[hi], k = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0, o = this.out;
    o.x = a.x + (b.x - a.x) * k; o.y = a.y + (b.y - a.y) * k; o.a = Math.atan2(b.y - a.y, b.x - a.x); return o;
  };

  function Flow(opt) { this.opt = opt || {}; this.paths = {}; this.cs = []; this.pool = []; this.gates = []; this.obst = null; this.paused = false; }
  Flow.prototype.path = function (name, segs) { this.paths[name] = new Path(segs); return this.paths[name]; };
  /* gate: {path, s0, s1, mult} slows (mult<1) or stops (mult 0) carriers inside [s0,s1]; gate.open=false blocks at s0 */
  Flow.prototype.gate = function (g) { g.open = g.open !== false; this.gates.push(g); return g; };
  Flow.prototype.spawn = function (name, o) {
    o = o || {}; var P = this.paths[name]; if (!P) return null;
    var c = { path: name, s: o.s0 || 0, speed: o.speed || 200, data: o.data || {}, delay: o.delay || 0, onEnd: o.onEnd, loop: !!o.loop, el: null, dead: false, wait: 0 };
    this.cs.push(c); return c;
  };
  Flow.prototype.clear = function () { for (var i = 0; i < this.cs.length; i++) this.free(this.cs[i]); this.cs.length = 0; };
  Flow.prototype.free = function (c) { if (c.el) { c.el.style.display = 'none'; this.pool.push(c.el); c.el = null; } c.dead = true; };
  Flow.prototype.count = function () { return this.cs.length; };
  Flow.prototype.update = function (dt) {
    if (this.paused) return;
    var cs = this.cs, gs = this.gates;
    for (var i = cs.length - 1; i >= 0; i--) {
      var c = cs[i];
      if (c.delay > 0) { c.delay -= dt * 1000; continue; }
      var P = this.paths[c.path], v = c.speed;
      for (var g = 0; g < gs.length; g++) {
        var G = gs[g]; if (G.path !== c.path) continue;
        if (!G.open && c.s < G.s0 && c.s + v * dt >= G.s0 - (c.data.gap || 0)) { v = 0; c.s = Math.min(c.s, G.s0 - (c.data.gap || 0)); }
        else if (c.s >= G.s0 && c.s <= G.s1) v *= G.mult == null ? 1 : G.mult;
      }
      if (this.obst && this.obst(c)) v = 0;
      c.s += v * dt;
      if (c.s >= P.len) {
        if (c.loop) c.s -= P.len; else { if (c.onEnd) c.onEnd(c); this.free(c); cs.splice(i, 1); continue; }
      }
      if (!c.el && this.opt.make) {
        c.el = this.pool.pop() || this.opt.make(c); if (!c.el.parentNode && this.opt.parent) this.opt.parent.appendChild(c.el);
        c.el.style.display = ''; if (this.opt.init) this.opt.init(c);
      }
      if (c.el) { var o = P.at(c.s); c.el.style.transform = 'translate3d(' + o.x.toFixed(1) + 'px,' + o.y.toFixed(1) + 'px,0) rotate(' + (this.opt.noRot ? 0 : (o.a * 57.3).toFixed(1)) + 'deg)'; if (this.opt.tick) this.opt.tick(c, o); }
    }
  };
  PF.Flow = Flow; PF.Path = Path;
})();
