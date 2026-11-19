/* Reusable flow engine: packets travel along curved paths. Pool, no allocation in the loop. */
(function () {
  var MAX = 420;
  function Flow() { this.p = []; this.onArrive = null; for (var i = 0; i < MAX; i++) this.p.push({ on: 0, ax: 0, ay: 0, bx: 0, by: 0, cx: 0, cy: 0, t: 0, sp: 1, c: '#fff', s: 4, tag: 0 }); }
  Flow.prototype.emit = function (ax, ay, bx, by, color, speed, size, tag) {
    for (var i = 0; i < MAX; i++) { var q = this.p[i]; if (!q.on) {
      q.on = 1; q.ax = ax; q.ay = ay; q.bx = bx; q.by = by; q.cx = (ax + bx) / 2 + (ay - by) * 0.12; q.cy = (ay + by) / 2 - 60;
      q.t = 0; q.sp = speed || 1; q.c = color; q.s = size || 4; q.tag = tag || 0; return q; } }
    return null;
  };
  Flow.prototype.update = function (dt) {
    for (var i = 0; i < MAX; i++) { var q = this.p[i]; if (!q.on) continue; q.t += dt * q.sp;
      if (q.t >= 1) { q.on = 0; if (this.onArrive) this.onArrive(q); } }
  };
  Flow.prototype.clear = function () { for (var i = 0; i < MAX; i++) this.p[i].on = 0; };
  Flow.prototype.draw = function (g) {
    for (var i = 0; i < MAX; i++) { var q = this.p[i]; if (!q.on) continue;
      var t = q.t, u = 1 - t, x = u * u * q.ax + 2 * u * t * q.cx + t * t * q.bx, y = u * u * q.ay + 2 * u * t * q.cy + t * t * q.by;
      var t2 = Math.max(0, t - 0.06), u2 = 1 - t2, x2 = u2 * u2 * q.ax + 2 * u2 * t2 * q.cx + t2 * t2 * q.bx, y2 = u2 * u2 * q.ay + 2 * u2 * t2 * q.cy + t2 * t2 * q.by;
      g.strokeStyle = q.c; g.globalAlpha = 0.35; g.lineWidth = q.s * 0.6; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x, y); g.stroke();
      g.globalAlpha = 1; g.fillStyle = q.c; g.fillRect(x - q.s / 2, y - q.s / 2, q.s, q.s); }
    g.globalAlpha = 1;
  };
  window.Flow = Flow;
})();
