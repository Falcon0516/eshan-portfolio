/* One continuous stage: a 4800x2700 world and a moving camera. Builds trigger panels, six agent windows, foreground poles. */
(function () {
  var F = window.FACTS, W = 4800, H = 2700;
  var GRID = { x: 1200, y: 400 };
  var WIN = [[92, 101, 1076, 441], [1235, 99, 1076, 435], [87, 571, 1077, 446], [1231, 578, 1082, 454], [90, 1057, 1082, 449], [1237, 1064, 1074, 442]];
  K.W = W; K.H = H; K.GRID = GRID; K.WIN = WIN;
  var world = K.$('#world'), fg = K.$('#fg'), cam = K.$('#cam');
  var st = K.stage = { cam: { cx: 2300, cy: 1750, w: 2200, rot: 0 }, s: 1, tw: null, sh: { amp: 0, until: 0, t0: 0 }, vw: 1, vh: 1 };

  /* ---------- asset fallbacks ---------- */
  [['plate', 'assets/comic_street_bg.webp'], ['shield', 'assets/kavach_shield.png'], ['frames', 'assets/panel_frames.png'], ['burst', 'assets/burst_set.png'], ['phone', 'assets/feature_phone.png']].forEach(function (a) {
    var im = new Image(); im.onerror = function () { document.documentElement.classList.add('no-' + a[0]); }; im.src = a[1];
  });
  K.$$('#plate,#frames,#shield img').forEach(function (im) { im.addEventListener('error', function () { im.style.display = 'none'; }); });

  /* ---------- camera ---------- */
  st.apply = function (c) {
    var vw = innerWidth, vh = innerHeight, h = c.w * 9 / 16, s = Math.min(vw / c.w, vh / h); st.s = s; st.vw = vw; st.vh = vh;
    var t = 'translate(' + (vw / 2).toFixed(1) + 'px,' + (vh / 2).toFixed(1) + 'px) rotate(' + c.rot.toFixed(3) + 'deg) scale(' + s.toFixed(5) + ') translate(' + (-c.cx).toFixed(1) + 'px,' + (-c.cy).toFixed(1) + 'px)';
    world.style.transform = t;
    var s2 = s * 1.14; fg.style.transform = 'translate(' + (vw / 2).toFixed(1) + 'px,' + (vh / 2).toFixed(1) + 'px) rotate(' + c.rot.toFixed(3) + 'deg) scale(' + s2.toFixed(5) + ') translate(' + (-c.cx).toFixed(1) + 'px,' + (-c.cy).toFixed(1) + 'px)';
    st.cur = c;
  };
  st.go = function (target, ms, now) {
    if (!ms || K.reduced) { st.tw = null; st.cam = { cx: target.cx, cy: target.cy, w: target.w, rot: target.rot || 0 }; st.apply(st.cam); return; }
    st.tw = { a: { cx: st.cam.cx, cy: st.cam.cy, w: st.cam.w, rot: st.cam.rot }, b: { cx: target.cx, cy: target.cy, w: target.w, rot: target.rot || 0 }, t0: now == null ? performance.now() : now, ms: ms };
  };
  st.toWorld = function (px, py) {
    var c = st.cur || st.cam, r = c.rot * Math.PI / 180, dx = px - st.vw / 2, dy = py - st.vh / 2;
    var x = dx * Math.cos(r) + dy * Math.sin(r), y = -dx * Math.sin(r) + dy * Math.cos(r);
    return [c.cx + x / st.s, c.cy + y / st.s];
  };
  st.sees = function (x, y, w, h) {
    var c = st.cur || st.cam, vh = c.w * 9 / 16, mx = c.w * 0.8, my = vh * 0.8;
    return !(x > c.cx + mx || x + w < c.cx - mx || y > c.cy + my || y + h < c.cy - my);
  };
  K.shake = function (amp, ms) { if (K.reduced) return; st.sh.amp = amp; st.sh.t0 = performance.now(); st.sh.until = st.sh.t0 + ms; };
  st.tick = function (now) {
    var tw = st.tw, c;
    if (tw) {
      var k = Math.min(1, (now - tw.t0) / tw.ms), e = K.ease(k);
      c = { cx: K.lerp(tw.a.cx, tw.b.cx, e), cy: K.lerp(tw.a.cy, tw.b.cy, e), w: Math.exp(K.lerp(Math.log(tw.a.w), Math.log(tw.b.w), e)), rot: K.lerp(tw.a.rot, tw.b.rot, e) + Math.sin(k * Math.PI) * 0.7 * (tw.b.cx >= tw.a.cx ? 1 : -1) };
      st.cam = { cx: c.cx, cy: c.cy, w: c.w, rot: tw.b.rot * e + tw.a.rot * (1 - e) }; st.apply(c); if (k >= 1) { st.tw = null; st.apply(st.cam = { cx: tw.b.cx, cy: tw.b.cy, w: tw.b.w, rot: tw.b.rot }); }
    }
    if (st.sh.until > now) { var d = (st.sh.until - now) / (st.sh.until - st.sh.t0), a = st.sh.amp * d; cam.style.transform = 'translate(' + ((Math.random() - 0.5) * a).toFixed(1) + 'px,' + ((Math.random() - 0.5) * a).toFixed(1) + 'px)'; st._sh = 1; }
    else if (st._sh) { cam.style.transform = ''; st._sh = 0; }
  };
  window.addEventListener('resize', function () { if (!st.tw) st.apply(st.cam); });

  /* ---------- twinkles + foreground poles ---------- */
  var tw = K.$('#twinkles'), r = K.rng(11), i, d;
  for (i = 0; i < 46; i++) {
    d = K.el('i'); d.style.left = (r() * W) + 'px'; d.style.top = (r() * H * 0.34) + 'px'; d.style.animationDelay = (r() * 4).toFixed(2) + 's'; d.style.animationDuration = (2.4 + r() * 3).toFixed(2) + 's'; d.style.width = d.style.height = (6 + r() * 8) + 'px'; tw.appendChild(d);
  }
  [[0.265, 0.25], [0.86, 0.2], [0.78, 0.42], [0.36, 0.48], [0.63, 0.38]].forEach(function (p, n) { var l = K.el('b', 'lamp'); l.style.left = (p[0] * W) + 'px'; l.style.top = (p[1] * H) + 'px'; l.style.animationDelay = (n * 0.7) + 's'; tw.appendChild(l); });
  [1150, 2640, 3390, 4690].forEach(function (x, n) {
    var p = K.el('div', 'pole'); p.style.left = x + 'px';
    p.innerHTML = '<svg viewBox="0 0 120 1800" width="120" height="1800"><rect x="52" y="120" width="16" height="1680" fill="#12082B"/><rect x="20" y="150" width="80" height="12" fill="#12082B"/><path d="M60 110c-30 0-44 14-50 34h100c-6-20-20-34-50-34z" fill="#12082B"/><circle cx="60" cy="150" r="9" fill="#FFC700" opacity=".9"/><path d="M52 600h-300M68 640h300" stroke="#12082B" stroke-width="5" fill="none"/></svg>';
    fg.appendChild(p);
  });

  /* ---------- six agent windows ---------- */
  var wins = K.$('#wins'), tags = K.$('#gridTags');
  K.wAgents = []; K.winEls = [];
  WIN.forEach(function (w, i) {
    var pad = 8, el = K.el('div', 'win'); el.style.left = (w[0] - pad) + 'px'; el.style.top = (w[1] - pad) + 'px'; el.style.width = (w[2] + pad * 2) + 'px'; el.style.height = (w[3] + pad * 2) + 'px';
    var cv = K.el('canvas'); cv.setAttribute('aria-label', F.agents[i].id + ' agent panel (simulation)'); cv.setAttribute('role', 'img'); el.appendChild(cv); wins.appendChild(el); K.winEls.push(el);
    var a = new K.Agent(i, cv); a.size(w[2] + pad * 2, w[3] + pad * 2, i === 3 ? 2 : 1.5); a.rect = [GRID.x + w[0], GRID.y + w[1], w[2], w[3]]; K.wAgents.push(a);
    var tg = K.el('div', 'ptag'); tg.style.left = (w[0] + 16) + 'px'; tg.style.top = (w[1] - 26) + 'px';
    tg.innerHTML = '<b>' + F.agents[i].id + '</b>' + F.agents[i].chips.map(function (c) { return '<span class="chip">' + K.rich(c) + '</span>'; }).join('');
    tg.style.setProperty('--c', F.agents[i].color); tags.appendChild(tg);
  });
  K.runner = new K.Runner(K.wAgents);
  K.env = K.agentEnv();

  /* ---------- trigger panels (scene 2) ---------- */
  var TP = [
    { id: 'sos', x: 2780, y: 620, w: 640, h: 760, clip: '3% 2%,97% 0,100% 97%,2% 100%', t: 0 },
    { id: 'voice', x: 3480, y: 600, w: 520, h: 380, clip: '0 4%,96% 0,100% 94%,3% 100%', t: 1 },
    { id: 'shake', x: 4060, y: 640, w: 520, h: 420, clip: '2% 0,100% 5%,97% 100%,0 96%', t: 2 },
    { id: 'vol', x: 3480, y: 1030, w: 420, h: 400, clip: '0 2%,98% 0,100% 100%,4% 97%', t: 3 },
    { id: 'walk', x: 3950, y: 1110, w: 380, h: 380, clip: '3% 0,100% 3%,96% 100%,0 98%', t: 4 },
    { id: 'keypad', x: 4350, y: 1090, w: 330, h: 520, clip: '0 0,97% 3%,100% 100%,3% 96%', t: 5 }
  ];
  var ART = {
    sos: '<svg viewBox="0 0 200 200"><circle class="rip r1" cx="100" cy="100" r="44"/><circle class="rip r2" cx="100" cy="100" r="44"/><circle class="btn" cx="100" cy="100" r="56"/><text x="100" y="116" text-anchor="middle" class="svgT">SOS</text></svg>',
    voice: '<svg viewBox="0 0 200 200"><g class="wave">' + [0, 1, 2, 3, 4, 5, 6].map(function (n) { return '<rect x="' + (28 + n * 22) + '" y="78" width="12" height="44" rx="5" style="--i:' + n + '"/>'; }).join('') + '</g><path class="bub" d="M30 22h140a10 10 0 0 1 10 10v30a10 10 0 0 1-10 10H88l-24 18 4-18H30a10 10 0 0 1-10-10V32a10 10 0 0 1 10-10z"/><text x="100" y="56" text-anchor="middle" class="svgT s">kavach</text></svg>',
    shake: '<svg viewBox="0 0 200 200"><g class="phoneS"><rect x="70" y="30" width="60" height="120" rx="12"/><rect x="78" y="44" width="44" height="76" rx="4" class="scr"/><circle cx="100" cy="135" r="5"/></g><path class="arc a1" d="M40 60q-14 40 0 80"/><path class="arc a2" d="M160 60q14 40 0 80"/></svg>',
    vol: '<svg viewBox="0 0 200 200"><rect x="60" y="20" width="76" height="150" rx="14" class="body"/><g class="pips"><rect x="136" y="46" width="14" height="22" rx="3" style="--i:0"/><rect x="136" y="76" width="14" height="22" rx="3" style="--i:1"/><rect x="136" y="106" width="14" height="22" rx="3" style="--i:2"/></g><g class="pings"><path d="M158 50l16 0M158 80l22 0M158 110l28 0"/></g></svg>',
    walk: '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="62" class="face"/><circle cx="100" cy="100" r="62" class="sweep" pathLength="100"/><path class="hand" d="M100 100V56"/><circle cx="100" cy="100" r="8" class="hub"/></svg>',
    keypad: ''
  };
  var trig = K.$('#trig'), cx0 = 3100, cy0 = 1000;
  TP.forEach(function (p) {
    var el = K.el('div', 'tp tp-' + p.id); el.tabIndex = 0; el.setAttribute('data-int', ''); el.id = 'tp-' + p.id;
    el.style.cssText = 'left:' + p.x + 'px;top:' + p.y + 'px;width:' + p.w + 'px;height:' + p.h + 'px;--clip:polygon(' + p.clip + ');--d:' + (Math.hypot(p.x + p.w / 2 - cx0, p.y + p.h / 2 - cy0) * 0.45).toFixed(0) + 'ms';
    var tr = F.triggers[p.t];
    el.setAttribute('aria-label', tr.label + '. ' + tr.sub);
    el.innerHTML = '<div class="tp-ink"></div><div class="tp-paper"></div><div class="tp-art">' + (p.id === 'keypad' ? '<img src="assets/feature_phone.png" alt="Keypad phone"><div class="ring rg1"></div><div class="ring rg2"></div><svg class="phfb" viewBox="0 0 120 200"><rect x="14" y="6" width="92" height="188" rx="16" fill="#9a9a8a" stroke="#12082B" stroke-width="6"/><rect x="28" y="22" width="64" height="48" fill="#bfe3cf"/></svg>' : ART[p.id]) + '</div><div class="tp-lab"><b>' + K.rich(tr.label) + '</b><span>' + K.rich(tr.sub) + '</span></div>';
    trig.appendChild(el);
    function fire() { el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); K.audio.tick(); setTimeout(function () { el.classList.remove('on'); }, 2400); }
    el.addEventListener('click', fire); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); fire(); } });
  });
  var pw = K.el('div', 'wtag pwa'); pw.style.left = '2800px'; pw.style.top = '1400px'; pw.innerHTML = '<b>' + K.rich(F.pwaTag) + '</b>'; K.$('#trig').appendChild(pw);
  var sosTag = K.$('#sosTag'); sosTag.innerHTML = '<b>' + K.term('LangGraph') + '</b> ' + K.term('supervisor');

  /* ---------- onomatopoeia bursts cut from the sprite sheet ---------- */
  var CUT = [[45, 17, 567, 567], [629, 25, 556, 549], [1230, 43, 526, 512]], bl = K.$('#bursts');
  K.burst = function (kind, x, y, size, text, life, tilt) {
    var c = CUT[kind], k = size / c[2], b = K.el('div', 'burst b' + kind);
    b.style.cssText = 'left:' + (x - size / 2) + 'px;top:' + (y - size * c[3] / c[2] / 2) + 'px;width:' + size + 'px;height:' + (size * c[3] / c[2]) + 'px;background-size:' + (1800 * k) + 'px ' + (600 * k) + 'px;background-position:-' + (c[0] * k) + 'px -' + (c[1] * k) + 'px;--tilt:' + (tilt || -6) + 'deg';
    b.innerHTML = '<span style="font-size:' + (size * 0.2) + 'px">' + text + '</span>'; bl.appendChild(b);
    setTimeout(function () { b.classList.add('out'); setTimeout(function () { b.remove(); }, 500); }, life || 1400); return b;
  };
  K.clearBursts = function () { bl.innerHTML = ''; };
})();
