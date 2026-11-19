/* Reusable flow engine: bezier paths, particles with speed/density, gates that block, and obstacles.
   Particles live in a fixed pool (no allocation in the hot loop). Drawn in stage coordinates. */
window.Flow = (function () {
  var MAX = 420, pool = [], i;
  for (i = 0; i < MAX; i++) pool.push({ on: false, f: null, t: 0, v: 0, ox: 0, oy: 0, x: 0, y: 0, life: 0, kind: 0, vx: 0, vy: 0, r: 0, col: '#fff' });

  /* path = array of cubic segments [p0,c1,c2,p1] each as {x,y}; sampled into a polyline for even speed */
  function makePath(segs, n) {
    var pts = [], s, k, t, a, b, c, d, u;
    n = n || 24;
    for (s = 0; s < segs.length; s++) {
      a = segs[s][0]; b = segs[s][1]; c = segs[s][2]; d = segs[s][3];
      for (k = (s ? 1 : 0); k <= n; k++) {
        t = k / n; u = 1 - t;
        pts.push({ x: u*u*u*a.x + 3*u*u*t*b.x + 3*u*t*t*c.x + t*t*t*d.x, y: u*u*u*a.y + 3*u*u*t*b.y + 3*u*t*t*c.y + t*t*t*d.y });
      }
    }
    var len = [0]; for (k = 1; k < pts.length; k++) len[k] = len[k-1] + Math.hypot(pts[k].x - pts[k-1].x, pts[k].y - pts[k-1].y);
    return { pts: pts, len: len, total: len[len.length - 1] };
  }
  function at(p, t, out) {
    var d = Math.max(0, Math.min(1, t)) * p.total, lo = 0, hi = p.len.length - 1, m;
    while (hi - lo > 1) { m = (lo + hi) >> 1; if (p.len[m] <= d) lo = m; else hi = m; }
    var seg = p.len[hi] - p.len[lo] || 1, u = (d - p.len[lo]) / seg, a = p.pts[lo], b = p.pts[hi];
    out.x = a.x + (b.x - a.x) * u; out.y = a.y + (b.y - a.y) * u; out.a = Math.atan2(b.y - a.y, b.x - a.x); return out;
  }
  /* a flow: {path, rate (particles/s), speed (path/s), color, size, gate: t or -1, open: bool, kind} */
  function create(o) { return { path: o.path, rate: o.rate || 4, speed: o.speed || 0.12, color: o.color || '#FFC93C', size: o.size || 9,
    gate: o.gate == null ? -1 : o.gate, open: o.open !== false, kind: o.kind || 0, acc: 0, active: true, onBlock: o.onBlock || null, jitter: o.jitter || 6, tmp: { x: 0, y: 0, a: 0 } }; }
  function spawn(f) {
    for (var k = 0; k < MAX; k++) if (!pool[k].on) { var p = pool[k]; p.on = true; p.f = f; p.t = 0; p.v = f.speed * (0.85 + Math.random() * 0.3);
      p.ox = (Math.random() - 0.5) * f.jitter; p.oy = (Math.random() - 0.5) * f.jitter; p.kind = 0; p.life = 0; return p; }
    return null;
  }
  function burst(x, y, n, col, spd) {
    for (var k = 0, c = 0; k < MAX && c < n; k++) if (!pool[k].on) { var p = pool[k], a = Math.random() * 6.283, s = (spd || 160) * (0.3 + Math.random());
      p.on = true; p.f = null; p.kind = 1; p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s - 60; p.life = 0.6 + Math.random() * 0.6; p.r = 3 + Math.random() * 5; p.col = col || '#FFC93C'; c++; }
  }
  function petals(x, y, n) {
    for (var k = 0, c = 0; k < MAX && c < n; k++) if (!pool[k].on) { var p = pool[k];
      p.on = true; p.f = null; p.kind = 2; p.x = x + (Math.random() - 0.5) * 900; p.y = y - 300 - Math.random() * 200; p.vx = (Math.random() - 0.5) * 60; p.vy = 80 + Math.random() * 120;
      p.life = 2.4 + Math.random() * 1.6; p.r = 6 + Math.random() * 6; p.col = Math.random() < 0.5 ? '#FFC93C' : '#F4A300'; p.ox = Math.random() * 6.28; c++; }
  }
  function step(flows, dt) {
    var f, k, p, n;
    for (n = 0; n < flows.length; n++) { f = flows[n]; if (!f.active) continue; f.acc += dt * f.rate; while (f.acc >= 1) { f.acc -= 1; spawn(f); } }
    for (k = 0; k < MAX; k++) { p = pool[k]; if (!p.on) continue;
      if (p.kind === 0) {
        f = p.f; var prev = p.t; p.t += p.v * dt;
        if (f.gate >= 0 && prev < f.gate && p.t >= f.gate && !f.open) {
          p.t = f.gate - 0.002; if (f.onBlock) f.onBlock(p); at(f.path, p.t, f.tmp); burst(f.tmp.x, f.tmp.y, 3, '#C65D3B', 120); p.on = false; continue; }
        if (p.t >= 1) p.on = false;
      } else { p.life -= dt; if (p.life <= 0) { p.on = false; continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === 1) p.vy += 380 * dt; else { p.ox += dt * 3; p.x += Math.sin(p.ox) * 40 * dt; } }
    }
  }
  function draw(c, flows, time) {
    var k, p, f, t = { x: 0, y: 0, a: 0 };
    for (k = 0; k < MAX; k++) { p = pool[k]; if (!p.on) continue;
      if (p.kind === 0) { f = p.f; at(f.path, p.t, t); var x = t.x + p.ox, y = t.y + p.oy + Math.sin(time * 6 + k) * 2;
        c.globalAlpha = 0.22; c.fillStyle = f.color; c.beginPath(); c.arc(x, y, f.size * 2, 0, 6.283); c.fill();
        c.globalAlpha = 1; c.fillStyle = f.color; c.strokeStyle = '#3A2518'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, f.size, 0, 6.283); c.fill(); c.stroke();
      } else if (p.kind === 1) { c.globalAlpha = Math.min(1, p.life * 2); c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
      } else { c.globalAlpha = Math.min(1, p.life); c.fillStyle = p.col; c.save(); c.translate(p.x, p.y); c.rotate(p.ox); c.beginPath(); c.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, 6.283); c.fill(); c.restore(); }
    }
    c.globalAlpha = 1;
  }
  function clear() { for (var k = 0; k < MAX; k++) pool[k].on = false; }
  return { makePath: makePath, at: at, create: create, step: step, draw: draw, burst: burst, petals: petals, clear: clear };
})();
