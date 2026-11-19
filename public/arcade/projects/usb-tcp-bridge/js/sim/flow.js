/* flow.js: reusable flow engine. Paths (sampled from SVG), beads, gates, bounded queues, particles, canvas renderer. */
(function () {
  'use strict';
  var U = window.UTB = window.UTB || {};
  var NS = 'http://www.w3.org/2000/svg';
  var STEP = 2, POOL = 360, NPART = 240, NMOTE = 46;
  /* bead colours: 0 cyan line, 1 yellow highlight, 2 red stop, 3 chalk byte */
  var COLS = [[127, 208, 255], [255, 213, 74], [255, 90, 95], [245, 250, 255]];
  var CSS = ['#7FD0FF', '#FFD54A', '#FF5A5F', '#F5FAFF'];
  var cvs, ctx, W = 0, H = 0, DPR = 1, hid = null, cursor = 0;
  var sprites = [], paths = [], pool = [], OUT = { x: 0, y: 0 };
  var px = new Float32Array(NPART), py = new Float32Array(NPART), pvx = new Float32Array(NPART), pvy = new Float32Array(NPART);
  var pl = new Float32Array(NPART), pm = new Float32Array(NPART), pc = new Uint8Array(NPART), ps = new Float32Array(NPART);
  var motes = [];
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function sprite(c) {
    var s = document.createElement('canvas'); s.width = s.height = 64;
    var g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(.2, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',.9)');
    gr.addColorStop(.55, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',.25)');
    gr.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return s;
  }
  function hidden() {
    if (!hid) {
      hid = document.createElementNS(NS, 'svg');
      hid.setAttribute('width', '0'); hid.setAttribute('height', '0');
      hid.setAttribute('aria-hidden', 'true');
      hid.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;pointer-events:none';
      document.body.appendChild(hid);
    }
    return hid;
  }

  /* A Path is a polyline lookup sampled from an SVG path string every STEP units. */
  function Path(id, d, o) {
    o = o || {};
    this.id = id; this.gap = o.gap || 26; this.speed = o.speed || 520; this.mul = 1;
    this.beads = []; this.gates = []; this.onEnd = null; this.onDrop = null; this.q = null; this.dropped = 0; this.count = 0;
    var svg = hidden(), p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d); svg.appendChild(p);
    var len = p.getTotalLength(), n = Math.ceil(len / STEP) + 2;
    this.len = len; this.xs = new Float32Array(n); this.ys = new Float32Array(n);
    for (var i = 0; i < n; i++) { var pt = p.getPointAtLength(Math.min(len, i * STEP)); this.xs[i] = pt.x; this.ys[i] = pt.y; }
    svg.removeChild(p);
  }
  Path.prototype.at = function (s) {
    if (s < 0) s = 0; if (s > this.len) s = this.len;
    var f = s / STEP, i = f | 0, t = f - i, j = i + 1; if (j >= this.xs.length) j = i;
    OUT.x = this.xs[i] + (this.xs[j] - this.xs[i]) * t; OUT.y = this.ys[i] + (this.ys[j] - this.ys[i]) * t; return OUT;
  };
  Path.prototype.gate = function (s, open) { var g = { s: s, open: open !== false }; this.gates.push(g); return g; };
  /* bounded queue zone: when more than cap beads sit past zone start, the front (oldest) drops. */
  Path.prototype.queue = function (zone, cap) { this.q = { zone: zone, cap: cap }; };

  var Flow = U.Flow = {
    COLS: CSS,
    init: function (canvas) {
      cvs = canvas; ctx = cvs.getContext('2d');
      for (var i = 0; i < COLS.length; i++) sprites.push(sprite(COLS[i]));
      for (i = 0; i < POOL; i++) pool.push({ on: false, path: null, s: 0, v: 1, kind: 0, ch: '', text: '', col: 0, r: 9, tr: false, t: 0 });
      for (i = 0; i < NMOTE; i++) motes.push({ x: Math.random(), y: Math.random(), z: .3 + Math.random() * .7, p: Math.random() * 6.28 });
      Flow.resize();
    },
    resize: function () {
      DPR = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
      cvs.width = Math.round(W * DPR); cvs.height = Math.round(H * DPR);
      cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
    },
    addPath: function (id, d, o) { var p = new Path(id, d, o); paths.push(p); return p; },
    spawn: function (path, o) {
      for (var k = 0; k < POOL; k++) {
        var b = pool[(cursor + k) % POOL];
        if (!b.on) {
          cursor = (cursor + k + 1) % POOL;
          b.on = true; b.path = path; b.s = o.s || 0; b.v = o.v || 1; b.kind = o.kind || 0; b.ch = o.ch || '';
          b.text = o.text || ''; b.col = o.col || 0; b.r = o.r || 9; b.tr = !!o.tr; b.t = 0;
          path.beads.push(b); return b;
        }
      }
      return null;
    },
    kill: function (b) { b.on = false; b.path = null; },
    move: function (b, path, s) { b.path = path; b.s = s || 0; path.beads.push(b); },
    clear: function (path) {
      var list = path ? [path] : paths;
      for (var i = 0; i < list.length; i++) { var a = list[i].beads; while (a.length) Flow.kill(a.pop()); }
    },
    burst: function (x, y, n, col, spd, life) {
      if (reduced) n = Math.ceil(n / 3);
      for (var i = 0; i < NPART && n > 0; i++) {
        if (pl[i] <= 0) {
          var a = Math.random() * 6.283, v = (spd || 120) * (.4 + Math.random() * .8);
          px[i] = x; py[i] = y; pvx[i] = Math.cos(a) * v; pvy[i] = Math.sin(a) * v;
          pm[i] = pl[i] = (life || .6) * (.6 + Math.random() * .6); pc[i] = col || 1; ps[i] = 5 + Math.random() * 7; n--;
        }
      }
    },
    update: function (dt) {
      for (var pi = 0; pi < paths.length; pi++) {
        var P = paths[pi], a = P.beads, sp = P.speed * P.mul * dt, i, g;
        for (i = 0; i < a.length; i++) {
          var b = a[i], ns = b.s + sp * b.v;
          for (g = 0; g < P.gates.length; g++) { var G = P.gates[g]; if (!G.open && b.s <= G.s + .5 && ns > G.s) ns = G.s; }
          if (i > 0) { var lim = a[i - 1].s - P.gap; if (ns > lim) ns = lim > b.s ? lim : b.s; }
          b.s = ns; b.t += dt;
        }
        while (a.length && a[0].s >= P.len - .5) { var e = a.shift(); if (P.onEnd) P.onEnd(e, P); else Flow.kill(e); }
        if (P.q) {
          var c = 0; for (i = 0; i < a.length; i++) { if (a[i].s >= P.q.zone) c++; else break; }
          while (c > P.q.cap) { var d = a.shift(); P.dropped++; if (P.onDrop) P.onDrop(d, P); Flow.kill(d); c--; }
          P.count = c;
        }
      }
      for (i = 0; i < NPART; i++) {
        if (pl[i] > 0) { pl[i] -= dt; px[i] += pvx[i] * dt; py[i] += pvy[i] * dt; pvx[i] *= .96; pvy[i] *= .96; }
      }
    },
    /* cam: {x,y,z,r(rad)}; ox,oy: screen point where the camera centre sits */
    render: function (cam, ox, oy, shx, shy, t) {
      var i, b, o, k;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
      /* dust motes in screen space, parallax */
      ctx.fillStyle = 'rgba(190,227,255,.5)';
      for (i = 0; i < NMOTE; i++) {
        var m = motes[i], mx = ((m.x * W * 1.2 - cam.x * m.z * .08 + Math.sin(t * .2 + m.p) * 20) % (W * 1.1) + W * 1.1) % (W * 1.1);
        var my = ((m.y * H * 1.2 - cam.y * m.z * .08 - t * 6 * m.z) % (H * 1.1) + H * 1.1) % (H * 1.1);
        ctx.globalAlpha = .18 + .3 * m.z * (.5 + .5 * Math.sin(t + m.p)); ctx.fillRect(mx, my, 1.5 + m.z * 1.8, 1.5 + m.z * 1.8);
      }
      ctx.globalAlpha = 1;
      var z = cam.z, c = Math.cos(cam.r), s = Math.sin(cam.r);
      ctx.setTransform(DPR * z * c, DPR * z * s, -DPR * z * s, DPR * z * c,
        DPR * (ox + shx - z * (c * cam.x - s * cam.y)), DPR * (oy + shy - z * (s * cam.x + c * cam.y)));
      ctx.textAlign = 'center';
      /* pass 1: additive glows and trails */
      ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < POOL; i++) {
        b = pool[i]; if (!b.on) continue;
        o = b.path.at(b.s); var x = o.x, y = o.y, sp = sprites[b.col], r = b.r;
        if (b.kind === 0) { ctx.globalAlpha = .75; ctx.drawImage(sp, x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4); }
        else {
          for (k = 1; k <= 3; k++) {
            var o2 = b.path.at(b.s - k * 9), rr = r * (1.7 - k * .18);
            ctx.globalAlpha = .34 - k * .07; ctx.drawImage(sp, o2.x - rr * 1.5, o2.y - rr * 1.5, rr * 3, rr * 3);
          }
          ctx.globalAlpha = .95; ctx.drawImage(sp, x - r * 3, y - r * 3, r * 6, r * 6);
        }
      }
      for (i = 0; i < NPART; i++) {
        if (pl[i] > 0) { var f = pl[i] / pm[i], q = ps[i] * (.4 + f); ctx.globalAlpha = f; ctx.drawImage(sprites[pc[i]], px[i] - q, py[i] - q, q * 2, q * 2); }
      }
      /* pass 2: cores and text */
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.lineJoin = 'round'; ctx.strokeStyle = '#072A4F';
      for (i = 0; i < POOL; i++) {
        b = pool[i]; if (!b.on) continue;
        o = b.path.at(b.s); var X = o.x, Y = o.y;
        if (b.kind === 0) {
          ctx.font = '700 26px "Courier New",Courier,monospace'; ctx.fillStyle = CSS[b.col];
          ctx.fillText(b.ch, X, Y + 8);
        } else {
          ctx.fillStyle = '#F5FAFF'; ctx.beginPath(); ctx.arc(X, Y, b.r * .55, 0, 6.283); ctx.fill();
          if (b.tr || b.kind === 4) {
            var big = b.kind === 4;
            ctx.font = '700 ' + (big ? 38 : 24) + 'px "Courier New",Courier,monospace'; ctx.lineWidth = big ? 8 : 6;
            ctx.strokeText(b.text, X, Y - b.r - 12); ctx.fillStyle = big ? '#FFB3B5' : '#F5FAFF'; ctx.fillText(b.text, X, Y - b.r - 12);
          }
        }
      }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
  };
})();
