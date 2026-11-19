/* KAVACH utilities. Global namespace K. No modules, works from file://. */
(function () {
  var K = window.K = {};
  K.$ = function (s, r) { return (r || document).querySelector(s); };
  K.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  K.el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  K.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  K.lerp = function (a, b, t) { return a + (b - a) * t; };
  K.reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  K.bez = function (x1, y1, x2, y2) {
    return function (t) {
      if (t <= 0) return 0; if (t >= 1) return 1;
      var x = t, i, cx, dx;
      for (i = 0; i < 8; i++) {
        cx = 3 * x1 * x * (1 - x) * (1 - x) + 3 * x2 * x * x * (1 - x) + x * x * x - t;
        dx = 3 * x1 * (1 - x) * (1 - x) + 6 * (x2 - x1) * x * (1 - x) + 3 * (1 - x2) * x * x;
        if (Math.abs(dx) < 1e-6) break; x -= cx / dx;
      }
      return 3 * y1 * x * (1 - x) * (1 - x) + 3 * y2 * x * x * (1 - x) + x * x * x;
    };
  };
  K.ease = K.bez(0.2, 0.8, 0.2, 1);
  K.overshoot = function (t) { if (t <= 0) return 0; if (t >= 1) return 1; var c = 2.4; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t; };
  K.rng = function (seed) {
    var a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  };
  K.haversine = function (la1, lo1, la2, lo2) {
    var R = 6371, r = Math.PI / 180, dp = (la2 - la1) * r, dl = (lo2 - lo1) * r;
    var a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  };
  /* cancellable timers: scenes register beats here, leaving a scene clears them */
  K._timers = [];
  K.after = function (ms, fn) { var id = setTimeout(function () { var i = K._timers.indexOf(id); if (i > -1) K._timers.splice(i, 1); fn(); }, ms); K._timers.push(id); return id; };
  K.clearTimers = function () { K._timers.forEach(clearTimeout); K._timers.length = 0; };
  K.type = function (el, text, cps) {
    if (el._tt) clearInterval(el._tt);
    if (K.reduced) { el.textContent = text; return; }
    var i = 0; el.textContent = '';
    el._tt = setInterval(function () { i++; el.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(el._tt); el._tt = 0; } }, 1000 / (cps || 38));
  };
  K.fmtKm = function (km) { return km < 1 ? (km * 1000).toFixed(0) + ' m' : km.toFixed(1) + ' km'; };
  K.dotCache = {};
  K.dotPattern = function (ctx, color) {
    if (!K.dotCache[color]) {
      var c = document.createElement('canvas'); c.width = c.height = 14; var x = c.getContext('2d');
      x.fillStyle = color; x.beginPath(); x.arc(7, 7, 2.6, 0, 7); x.fill();
      K.dotCache[color] = ctx.createPattern(c, 'repeat');
    }
    return K.dotCache[color];
  };
  K.COL = { ink: '#12082B', indigo: '#1B1464', violet: '#2B1F8F', mag: '#FF2E93', gold: '#FFC700', cyan: '#3FE0FF', paper: '#FFF4E0' };
  K.FONT = '"Comic Sans MS","Chalkboard SE","Marker Felt",sans-serif';
  K.MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,monospace';
})();
