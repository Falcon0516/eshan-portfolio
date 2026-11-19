/* VERIFARM core: stage, camera, chain ribbon, overlays, input. Plain script, no modules. */
(function () {
  var D = window.VF, $ = function (s, r) { return (r || document).querySelector(s); };
  var SW = 2560, SH = 1440, FOCUS = { x: 0.66, y: 0.44 };
  var VFx = D; /* data object doubles as namespace */
  VFx.lang = 'en'; VFx.mode = 'present'; VFx.scene = -1; VFx.scenes_impl = VFx.scenes_impl || [];

  /* ---------- helpers ---------- */
  function el(tag, cls, html, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  function T(o) { return o == null ? '' : (typeof o === 'string' ? o : (o[VFx.lang] || o.en)); }
  function termify(s) {
    var keys = Object.keys(D.terms).sort(function (a, b) { return b.length - a.length; });
    keys.forEach(function (k) { var re = new RegExp('(^|[^\\w>"-])(' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\w"-])'); s = s.replace(re, '$1<span class="term" tabindex="0" data-term="' + k + '">$2</span>'); });
    return s;
  }
  VFx.el = el; VFx.T = T; VFx.termify = termify; VFx.$ = $;
  VFx.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  VFx.reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- timers + tweens (cleared per scene) ---------- */
  var tweens = [], timers = [];
  VFx.after = function (ms, fn) { timers.push({ at: performance.now() + ms, fn: fn }); };
  VFx.tween = function (ms, fn, done, ease) { tweens.push({ t0: performance.now(), d: ms, fn: fn, done: done, e: ease }); };
  VFx.clearTimers = function () { tweens.length = 0; timers.length = 0; };
  function eio(u) { return u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  VFx.eio = eio;
  var bez = (function () { /* cubic-bezier(.2,.8,.2,1) */
    var x1 = .2, y1 = .8, x2 = .2, y2 = 1;
    function B(a, b, t) { var u = 1 - t; return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t; }
    return function (x) { var lo = 0, hi = 1, m, i; for (i = 0; i < 18; i++) { m = (lo + hi) / 2; if (B(x1, x2, m) < x) lo = m; else hi = m; } return B(y1, y2, (lo + hi) / 2); };
  })();
  VFx.count = function (node, from, to, ms, dec) {
    VFx.tween(ms || 900, function (u) { node.textContent = (from + (to - from) * eio(u)).toFixed(dec || 0); }, function () { node.textContent = to.toFixed(dec || 0); });
  };

  /* ---------- viewport + camera ---------- */
  var vp = $('#viewport'), stage = $('#stage'), fx = $('#fx'), ctx = fx.getContext('2d'), VW = 0, VH = 0, DPR = 1, S0 = 1, mobile = false;
  var cam = { x: 1280, y: 720, z: 1 }, camA = null, bob = { x: 0, y: 0 };
  VFx.cam = cam;
  function resize() {
    VW = window.innerWidth; VH = window.innerHeight; DPR = Math.min(2, window.devicePixelRatio || 1); mobile = VW < 820;
    fx.width = VW * DPR; fx.height = VH * DPR; S0 = Math.max(VW / SW, VH / SH);
  }
  window.addEventListener('resize', resize); resize();
  function camMatrix() {
    var z = cam.z * (mobile ? 0.78 : 1), s = S0 * z, fxp = mobile ? 0.5 : FOCUS.x, fyp = mobile ? 0.6 : FOCUS.y;
    var tx = VW * fxp - cam.x * s + bob.x, ty = VH * fyp - cam.y * s + bob.y;
    tx = VFx.clamp(tx, VW - SW * s, 0); ty = VFx.clamp(ty, VH - SH * s, 0); /* never show beyond the plate */
    return { s: s, tx: tx, ty: ty };
  }
  VFx.goTo = function (x, y, z, ms) {
    if (VFx.reduced) { cam.x = x; cam.y = y; cam.z = z; camA = null; return; }
    camA = { x0: cam.x, y0: cam.y, z0: cam.z, x1: x, y1: y, z1: z, t0: performance.now(), d: ms || 1200 };
  };
  VFx.toScreen = function (x, y) { var m = camMatrix(); return { x: x * m.s + m.tx, y: y * m.s + m.ty, s: m.s }; };

  /* ---------- asset fallback ---------- */
  ['mandi_town_iso.webp', 'characters_sheet.png', 'props_sheet.png', 'ragi_raja.png', 'rangoli_border.png'].forEach(function (f) {
    var im = new Image(); im.onerror = function () { document.body.classList.add('no-assets'); }; im.src = 'assets/' + f;
  });

  /* ---------- sprites ---------- */
  var SHEETS = { chars: ['assets/characters_sheet.png', 2400, 700], props: ['assets/props_sheet.png', 2400, 800] };
  var RECT = {
    chars: [[16,63,349,585],[531,48,341,600],[1095,54,254,596],[1583,72,397,571],[2150,62,234,589]],
    props: [[16,242,306,342],[360,267,389,313],[761,251,438,343],[1198,206,274,376],[1513,288,253,271],[1819,221,241,359],[2060,221,324,359]]
  };
  VFx.spr = function (sheet, n, x, y, scale, parent, cls) {
    var sh = SHEETS[sheet], r = RECT[sheet][n - 1], d = el('div', 'spr ' + (cls || ''), '', parent || $('#props'));
    d.style.width = r[2] * scale + 'px'; d.style.height = r[3] * scale + 'px'; d.style.left = (x - r[2] * scale / 2) + 'px'; d.style.top = (y - r[3] * scale) + 'px';
    d.style.backgroundImage = 'url(' + sh[0] + ')'; d.style.backgroundSize = (sh[1] * scale) + 'px ' + (sh[2] * scale) + 'px'; d.style.backgroundPosition = (-r[0] * scale) + 'px ' + (-r[1] * scale) + 'px';
    d._w = r[2] * scale; d._h = r[3] * scale; return d;
  };
  VFx.layerEl = function () { var l = el('div', 'layer', '', $('#props')); l.style.cssText = 'position:absolute;inset:0;pointer-events:none'; return l; };

  /* ---------- master route (farm, mandi, yard, mill, shop) ---------- */
  var P = function (x, y) { return { x: x, y: y }; };
  VFx.stations = [P(720, 650), P(1560, 600), P(1260, 1010), P(900, 760), P(1750, 840)];
  var st = VFx.stations;
  var segs = [
    [st[0], P(1000, 560), P(1300, 700), st[1]],
    [st[1], P(1700, 800), P(1500, 1040), st[2]],
    [st[2], P(1050, 980), P(960, 880), st[3]],
    [st[3], P(1180, 640), P(1520, 960), st[4]]
  ];
  VFx.route = Flow.makePath(segs, 24);
  VFx.stationT = [0, 1, 2, 3, 4].map(function (i) { return VFx.route.len[i * 24] / VFx.route.total; });
  VFx.routeSegPath = function (i) { return Flow.makePath([segs[i]], 24); };
  VFx.routeSegs = segs;

  /* ---------- build the stage ---------- */
  var props = $('#props'), routes = $('#routes'), flags = [], bagEl, signs = {};
  function buildStage() {
    var NS = 'http://www.w3.org/2000/svg', d = '';
    segs.forEach(function (s, i) { d += (i ? ' ' : '') + 'M' + s[0].x + ',' + s[0].y + ' C' + s[1].x + ',' + s[1].y + ' ' + s[2].x + ',' + s[2].y + ' ' + s[3].x + ',' + s[3].y; });
    routes.innerHTML = '<path d="' + d + '" fill="none" stroke="#3A2518" stroke-width="16" stroke-opacity=".22" stroke-linecap="round"/>' +
      '<path id="routeline" d="' + d + '" fill="none" stroke="#FFF4DC" stroke-width="7" stroke-dasharray="4 22" stroke-linecap="round"><animate attributeName="stroke-dashoffset" from="0" to="-52" dur="1.6s" repeatCount="indefinite"/></path>';
    VFx.spr('chars', 2, 650, 690, .34, props).id = 'farmer';
    VFx.spr('chars', 1, 1400, 740, .32, props).id = 'clerk';
    VFx.spr('chars', 3, 860, 800, .3, props).id = 'miller';
    VFx.spr('chars', 4, 1790, 880, .3, props).id = 'shopkeep';
    VFx.spr('chars', 5, 1930, 900, .32, props).id = 'consumer';
    var tk = VFx.spr('props', 3, 1250, 1040, .42, props); tk.id = 'truck'; tk.style.display = 'none';
    VFx.spr('props', 6, 1700, 860, .3, props).id = 'qrposter';
    var g = el('div', 'garland', '', props); g.style.cssText = 'left:1380px;top:430px;width:340px;transform:rotate(-14deg)';
    g = el('div', 'garland', '', props); g.style.cssText = 'left:1700px;top:700px;width:240px;animation-delay:-1.3s;transform:rotate(-11deg)';
    /* signs */
    signs.farm = el('div', 'sign', '', props); signs.farm.style.cssText = 'left:420px;top:740px';
    signs.mandi = el('div', 'sign', '', props); signs.mandi.style.cssText = 'left:1380px;top:560px';
    signs.truck = el('div', 'sign', '', props); signs.truck.style.cssText = 'left:1090px;top:1060px';
    signs.mill = el('div', 'sign', '', props); signs.mill.style.cssText = 'left:760px;top:830px';
    signs.shop = el('div', 'sign', '', props); signs.shop.style.cssText = 'left:1700px;top:920px';
    /* flags above buildings */
    var fp = [[760, 470], [1480, 330], [1010, 620], [1130, 830], [900, 470], [1790, 690]];
    D.orgs.forEach(function (o, i) {
      var f = el('div', 'flag', '<i style="background:' + o.color + '"></i><b></b>', props); f.style.left = fp[i][0] + 'px'; f.style.top = fp[i][1] + 'px';
      f.style.setProperty('opacity', '1'); f.tabIndex = -1; f.dataset.org = o.id; flags.push(f);
    });
    bagEl = VFx.spr('props', 1, 0, 0, .3, props, 'bag'); bagEl.style.zIndex = 5; bagEl.style.filter = 'drop-shadow(0 0 14px #FFC93C)';
    VFx.bag = { t: 0, el: bagEl, w: bagEl._w, h: bagEl._h, hide: function () { bagEl.style.display = 'none'; }, show: function () { bagEl.style.display = ''; } };
    VFx.setBag(0);
    VFx.refreshLabels();
  }
  var tmpP = { x: 0, y: 0, a: 0 };
  VFx.setBag = function (t) { VFx.bag.t = t; Flow.at(VFx.route, t, tmpP); var b = VFx.bag; b.el.style.left = (tmpP.x - b.w / 2) + 'px'; b.el.style.top = (tmpP.y - b.h + 8) + 'px'; b.x = tmpP.x; b.y = tmpP.y; };
  VFx.bagTo = function (t, ms, done) {
    var t0 = VFx.bag.t; VFx.tween(ms || 1200, function (u) { VFx.setBag(t0 + (t - t0) * bez(u)); VFx.bag.el.style.transform = 'translateY(' + (-Math.abs(Math.sin(u * 14)) * 10 * (1 - u)) + 'px)'; }, function () { VFx.setBag(t); VFx.bag.el.style.transform = ''; if (done) done(); });
  };
  VFx.refreshLabels = function () {
    var s = D.ui.stations;
    signs.farm.textContent = T(s.farm); signs.mandi.innerHTML = '<span class="term hot" tabindex="0" data-term="APMC" style="pointer-events:auto">APMC</span> ' + T(s.mandi);
    signs.truck.textContent = T(s.truck); signs.mill.textContent = T(s.mill); signs.shop.textContent = T(s.shop);
    D.orgs.forEach(function (o, i) { flags[i].querySelector('b').textContent = T(o); flags[i].setAttribute('aria-label', T(o)); });
    document.querySelectorAll('[data-ui]').forEach(function (n) { n.textContent = T(D.ui[n.dataset.ui]); });
    $('#modebtn').textContent = T(VFx.mode === 'present' ? D.ui.explore : D.ui.present);
    document.documentElement.lang = VFx.lang;
  };
  VFx.flags = flags;
  VFx.showFlagLabels = function (on) { flags.forEach(function (f) { f.querySelector('b').style.opacity = on ? 1 : 0; f.style.opacity = on ? 1 : .0; f.style.pointerEvents = on ? 'auto' : 'none'; f.tabIndex = on ? 0 : -1; }); };

  /* ---------- chain ribbon (real SHA-256, local) ---------- */
  var chain = [], blocksEl = $('#blocks');
  function hashOf(i, label, data, prev) { return sha256(i + '|' + label + '|' + data + '|' + prev); }
  VFx.chain = {
    list: chain,
    add: function (label, data) {
      var prev = chain.length ? chain[chain.length - 1].hash : '0'.repeat(64), i = chain.length, b = { i: i, label: label, data: data, prev: prev, hash: hashOf(i, label, data, prev), tampered: false, orig: data };
      chain.push(b); VFx.chain.render(); blocksEl.scrollLeft = blocksEl.scrollWidth; if (window.VFAudio) VFAudio.clack(); return b;
    },
    reset: function () { chain.length = 0; VFx.chain.render(); },
    verify: function () { var bad = false, prev = '0'.repeat(64); chain.forEach(function (b) { var h = hashOf(b.i, b.label, b.data, prev); b.bad = h !== b.hash; prev = h; }); },
    tamper: function (k) { var b = chain[k]; if (!b) return; b.tampered = !b.tampered; b.data = b.tampered ? b.orig + '~edited' : b.orig; VFx.chain.render(); if (window.VFAudio) (b.tampered ? VFAudio.fail : VFAudio.clack)(); },
    render: function () {
      VFx.chain.verify(); var full = blocksEl.children.length === chain.length;
      if (full) { chain.forEach(function (b, k) { var n = blocksEl.children[k]; n.className = 'blk' + (b.bad ? ' bad' : ''); n.style.animation = 'none'; n.querySelector('span').textContent = (b.bad ? 'X ' : '') + hashOf(b.i, b.label, b.data, b.i ? hashOf2(k) : '0'.repeat(64)).slice(0, 10); }); return; }
      blocksEl.innerHTML = ''; chain.forEach(function (b, k) {
        var n = el('button', 'blk' + (b.bad ? ' bad' : ''), '<b></b><span></span>', blocksEl); n.querySelector('b').textContent = '#' + b.i + ' ' + b.label;
        n.querySelector('span').textContent = (b.bad ? 'X ' : '') + b.hash.slice(0, 10); n.setAttribute('aria-label', 'Block ' + b.i + ' ' + b.label + ', click to tamper'); n.title = '';
        n.addEventListener('click', function () { VFx.chain.tamper(k); });
      });
      $('#ribbon-hint').textContent = chain.length ? T(D.ui.tamper) : '';
    }
  };
  function hashOf2(k) { var prev = '0'.repeat(64), h, i; for (i = 0; i < k; i++) { h = hashOf(chain[i].i, chain[i].label, chain[i].data, prev); prev = h; } return prev; }
  /* recompute displayed hashes live so tamper visibly changes them */
  VFx.chain.render = (function (orig) { return function () {
    VFx.chain.verify(); var prev = '0'.repeat(64), rebuild = blocksEl.children.length !== chain.length;
    if (rebuild) { blocksEl.innerHTML = ''; chain.forEach(function (b, k) { var n = el('button', 'blk', '<b></b><span></span>', blocksEl); n.setAttribute('aria-label', 'Block ' + b.i + ', click to tamper'); n.addEventListener('click', function () { VFx.chain.tamper(k); }); }); }
    chain.forEach(function (b, k) { var h = hashOf(b.i, b.label, b.data, prev), n = blocksEl.children[k]; prev = h;
      n.querySelector('b').textContent = '#' + b.i + ' ' + b.label; n.querySelector('span').textContent = (b.bad ? 'X ' : '') + h.slice(0, 10);
      var was = n.classList.contains('bad'); n.classList.toggle('bad', !!b.bad); if (!rebuild) n.style.animation = (b.bad && !was) ? 'rattle .4s' : 'none'; });
    $('#ribbon-hint').textContent = chain.length ? T(D.ui.tamper) : '';
  }; })(VFx.chain.render);

  /* ---------- stamp / shake / say ---------- */
  var stampEl = $('#stamp'), bubbleEl = $('#bubble'), bubT = 0;
  VFx.stamp = function (text, ok) {
    stampEl.textContent = text; stampEl.className = ok ? 'ok' : ''; void stampEl.offsetWidth; stampEl.classList.add('slam');
    if (window.VFAudio) VFAudio.stamp();
    VFx.after(180, function () { if (!ok) { document.body.classList.add('shake'); VFx.after(380, function () { document.body.classList.remove('shake'); }); } });
  };
  VFx.say = function (txt) { bubbleEl.textContent = txt; bubbleEl.classList.add('on'); clearTimeout(bubT); bubT = setTimeout(function () { bubbleEl.classList.remove('on'); }, 3600); };
  VFx.burstAt = function (x, y, n, col) { Flow.burst(x, y, n, col, 220); };

  /* ---------- slider object (rail + knob) ---------- */
  VFx.slider = function (o) {
    var rail = el('div', 'rail'), band = el('div', 'band', '', rail), knob = el('div', 'knob', '', rail), val = o.value, step = o.step || 1;
    rail.setAttribute('role', 'slider'); rail.tabIndex = 0; rail.setAttribute('aria-label', o.label || 'value'); rail.setAttribute('aria-valuemin', o.min); rail.setAttribute('aria-valuemax', o.max);
    var api = { el: rail, band: band, knob: knob, get: function () { return val; }, min: o.min, max: o.max,
      set: function (v, silent) { v = VFx.clamp(Math.round(v / step) * step, o.min, o.max); val = v; knob.style.left = ((v - o.min) / (o.max - o.min) * 100) + '%'; rail.setAttribute('aria-valuenow', v); if (!silent && o.onInput) o.onInput(v); },
      setBand: function (a, b) { band.style.left = ((a - o.min) / (o.max - o.min) * 100) + '%'; band.style.width = ((b - a) / (o.max - o.min) * 100) + '%'; } };
    function fromX(cx) { var r = rail.getBoundingClientRect(); api.set(o.min + VFx.clamp((cx - r.left) / r.width, 0, 1) * (o.max - o.min)); }
    rail.addEventListener('pointerdown', function (e) { rail.setPointerCapture(e.pointerId); knob.classList.remove('pulse'); api.dragging = true; fromX(e.clientX); e.stopPropagation(); });
    rail.addEventListener('pointermove', function (e) { if (api.dragging) fromX(e.clientX); });
    rail.addEventListener('pointerup', function () { api.dragging = false; if (o.onRelease) o.onRelease(val); });
    rail.addEventListener('keydown', function (e) { var k = e.key, d = (k === 'ArrowRight' || k === 'ArrowUp') ? 1 : (k === 'ArrowLeft' || k === 'ArrowDown') ? -1 : 0; if (d) { api.set(val + d * step * (e.shiftKey ? 5 : 1)); e.preventDefault(); e.stopPropagation(); } });
    api.set(val, true); return api;
  };

  /* ---------- scenes ---------- */
  var dotsEl = $('#dots'), headEl = $('#head'), capEl = $('#cap'), takeEl = $('#take'), widget = $('#widget'), notes = $('#notes'), badge = $('#badge'), cur = null, curLayer = null;
  VFx.flows = [];
  function buildDots() { dotsEl.innerHTML = ''; D.scenes.forEach(function (s, i) { var b = el('button', '', '<i></i>', dotsEl); b.setAttribute('aria-label', 'Scene ' + (i + 1) + ': ' + s.head); b.addEventListener('click', function () { VFx.go(i); }); }); }
  VFx.go = function (i, replay) {
    var n = D.scenes.length; i = VFx.clamp(i, 0, n - 1); if (i === VFx.scene && !replay) return;
    var impl = VFx.scenes_impl[i]; if (!impl) return;
    if (cur && cur.leave) cur.leave(); VFx.clearTimers(); VFx.flows = []; widget.innerHTML = ''; if (curLayer && curLayer.parentNode) curLayer.parentNode.removeChild(curLayer);
    curLayer = VFx.layerEl(); VFx.layer = curLayer; $('#stampwrap').style.display = ''; VFx.showReality(false);
    var first = VFx.scene < 0; VFx.scene = i; cur = impl; var sc = D.scenes[i];
    headEl.textContent = sc.head; headEl.classList.remove('pop'); void headEl.offsetWidth; headEl.classList.add('pop');
    capEl.innerHTML = termify(sc.cap); takeEl.innerHTML = termify(sc.take); notes.textContent = sc.note;
    Array.prototype.forEach.call(dotsEl.children, function (b, k) { b.classList.toggle('on', k === i); });
    if (!replay) { VFx.goTo(impl.cam.x, impl.cam.y, impl.cam.z, first ? 0 : 1200); $('#raja').classList.add('walk'); setTimeout(function () { $('#raja').classList.remove('walk'); }, 1200); }
    badge.style.display = impl.sim === false ? 'none' : '';
    if (impl.hash !== false && !replay) { try { history.replaceState(null, '', '#scene-' + (i + 1)); } catch (e) { location.hash = 'scene-' + (i + 1); } }
    VFx.after(first ? 400 : 700, function () { VFx.say(D.ui.raja[i]); impl.enter(curLayer, !!replay); });
  };
  VFx.replay = function () { if (VFx.mode === 'present') VFx.go(VFx.scene, true); };
  VFx.next = function () { VFx.go(VFx.scene + 1); }; VFx.prev = function () { VFx.go(VFx.scene - 1); };

  /* ---------- overlays ---------- */
  var realityEl = $('#reality');
  VFx.showReality = function (on) {
    realityEl.classList.toggle('on', on); if (!on) return; var r = D.reality, t = D.realityTitles, h = '<div class="board"><h2>REALITY CHECK</h2><div class="cols">';
    ['real', 'partial'].forEach(function (k) { h += '<div class="col ' + k + '"><h4>' + t[k] + '</h4><ul>' + r[k].map(function (x) { return '<li>' + termify(x) + '</li>'; }).join('') + '</ul></div>'; });
    h += '</div><p class="plain">' + D.plain + '</p><div class="win">1st place<br>ADVAYA Hackathon 2.0</div></div>'; realityEl.innerHTML = h;
  };
  function closeOverlays() { if (realityEl.classList.contains('on')) { VFx.showReality(false); return true; } if (notes.classList.contains('on')) { notes.classList.remove('on'); return true; } return false; }
  var tip = $('#tip');
  function showTip(e) { var t = e.target.closest && e.target.closest('.term'); if (!t) return; var r = t.getBoundingClientRect(); tip.innerHTML = '<b>' + t.dataset.term + '</b> ' + D.terms[t.dataset.term]; tip.classList.add('on'); tip.style.left = Math.min(VW - 310, Math.max(8, r.left)) + 'px'; tip.style.top = (r.bottom + 8 > VH - 90 ? r.top - tip.offsetHeight - 8 : r.bottom + 8) + 'px'; }
  document.addEventListener('mouseover', showTip); document.addEventListener('focusin', showTip);
  document.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest('.term')) tip.classList.remove('on'); });
  document.addEventListener('focusout', function () { tip.classList.remove('on'); });
  VFx.tipFor = function (node, term) { node.classList.add('term'); node.dataset.term = term; node.tabIndex = 0; };

  /* ---------- modes + language ---------- */
  VFx.setMode = function (m) {
    VFx.mode = m; document.body.className = document.body.className.replace(/mode-\w+/, 'mode-' + m); VFx.refreshLabels();
    if (m === 'explore') { VFx.clearTimers(); VFx.flows = []; widget.innerHTML = ''; if (cur && cur.leave) cur.leave(); cur = null; if (curLayer && curLayer.parentNode) curLayer.parentNode.removeChild(curLayer); curLayer = null; VFx.scene = -1; VFx.showReality(false); if (VFx.explore) VFx.explore.open(); try { history.replaceState(null, '', '#explore'); } catch (e) {} }
    else { if (VFx.explore) VFx.explore.close(); VFx.go(0); }
  };
  VFx.setLang = function (l) {
    VFx.lang = l; Array.prototype.forEach.call(document.querySelectorAll('.lang'), function (b) { b.classList.toggle('on', b.dataset.l === l); });
    VFx.refreshLabels(); if (cur && cur.relang) cur.relang(); if (VFx.explore && VFx.mode === 'explore') VFx.explore.relang();
  };

  /* ---------- day-night, birds, smoke, cow ---------- */
  var tod = 0.3, todForce = null, birds = [], puffs = [], cow = { x: 560, dir: 1 }, lastTint = 0;
  VFx.setTOD = function (v) { todForce = v; };
  for (var i = 0; i < 4; i++) birds.push({ x: Math.random() * SW, y: 180 + Math.random() * 220, v: 40 + Math.random() * 30, ph: Math.random() * 6 });
  for (i = 0; i < 14; i++) puffs.push({ a: i / 14 });
  function tint(t) {
    var n = $('#tint'), c, o;
    if (t < 0.12) { c = '#F4A300'; o = 0.20 - t; } else if (t < 0.6) { c = '#FFF4DC'; o = 0; } else if (t < 0.78) { c = '#C65D3B'; o = (t - 0.6) * 1.1; } else { c = '#2B3A67'; o = Math.min(0.24, 0.2 + (t - 0.78)); }
    n.style.background = c; n.style.opacity = Math.max(0, o).toFixed(3);
  }

  /* ---------- main loop ---------- */
  var last = 0, running = true, time = 0;
  function frame(now) {
    if (!running) return; requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; time += dt;
    for (var k = timers.length - 1; k >= 0; k--) if (now >= timers[k].at) { var f = timers.splice(k, 1)[0].fn; f(); }
    for (k = tweens.length - 1; k >= 0; k--) { var tw = tweens[k], u = Math.min(1, (now - tw.t0) / tw.d); tw.fn(u); if (u >= 1) { tweens.splice(k, 1); if (tw.done) tw.done(); } }
    if (camA) { var u2 = Math.min(1, (now - camA.t0) / camA.d), e = bez(u2); cam.x = camA.x0 + (camA.x1 - camA.x0) * e; cam.y = camA.y0 + (camA.y1 - camA.y0) * e; cam.z = camA.z0 + (camA.z1 - camA.z0) * e; if (u2 >= 1) camA = null; }
    bob.x = VFx.reduced ? 0 : Math.sin(time * 0.35) * 5; bob.y = VFx.reduced ? 0 : Math.cos(time * 0.27) * 4;
    var m = camMatrix(); stage.style.transform = 'translate(' + m.tx.toFixed(2) + 'px,' + m.ty.toFixed(2) + 'px) scale(' + m.s.toFixed(4) + ')';
    tod = todForce != null ? tod + (todForce - tod) * Math.min(1, dt * 1.5) : (tod + dt / 300) % 1;
    if (now - lastTint > 250) { lastTint = now; tint(tod); }
    Flow.step(VFx.flows, dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, fx.width, fx.height); ctx.setTransform(DPR * m.s, 0, 0, DPR * m.s, DPR * m.tx, DPR * m.ty);
    drawAmbient(dt); Flow.draw(ctx, VFx.flows, time);
    if (VFx.onDraw) VFx.onDraw(ctx, time, dt);
  }
  function drawAmbient(dt) {
    var i, b, p;
    ctx.fillStyle = 'rgba(58,37,24,.55)';
    for (i = 0; i < birds.length; i++) { b = birds[i]; b.x += b.v * dt; if (b.x > SW + 60) { b.x = -60; b.y = 160 + Math.random() * 240; } var w = Math.sin(time * 9 + b.ph) * 8;
      ctx.beginPath(); ctx.moveTo(b.x - 18, b.y - w); ctx.quadraticCurveTo(b.x - 6, b.y - 8 + w * .3, b.x, b.y); ctx.quadraticCurveTo(b.x + 6, b.y - 8 + w * .3, b.x + 18, b.y - w); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(58,37,24,.6)'; ctx.stroke(); }
    for (i = 0; i < puffs.length; i++) { p = puffs[i]; p.a = (p.a + dt * 0.12) % 1; ctx.globalAlpha = (1 - p.a) * 0.5; ctx.fillStyle = '#FFF4DC'; ctx.beginPath(); ctx.arc(842 + p.a * 70 + Math.sin(p.a * 9 + i) * 8, 585 - p.a * 170, 12 + p.a * 30, 0, 6.283); ctx.fill(); }
    ctx.globalAlpha = 1;
    cow.x += cow.dir * 14 * dt; if (cow.x > 640 || cow.x < 520) cow.dir *= -1; var cx = cow.x, cy = 785 + Math.sin(time * 2) * 1.5;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(cow.dir, 1); ctx.fillStyle = '#FFF4DC'; ctx.strokeStyle = '#3A2518'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, -22, 28, 16, 0, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(30, -34, 11, 9, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8C4A2F'; ctx.beginPath(); ctx.ellipse(-8, -26, 8, 6, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#3A2518'; ctx.fillRect(-20, -8, 5, 14 + Math.sin(time * 4) * 2); ctx.fillRect(12, -8, 5, 14 - Math.sin(time * 4) * 2); ctx.restore();
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) running = false; else if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } });

  /* ---------- input ---------- */
  var idleT = 0;
  function wake() { document.body.classList.remove('idle', 'hide-cursor'); clearTimeout(idleT); idleT = setTimeout(function () { document.body.classList.add('idle', 'hide-cursor'); }, 3000); }
  ['mousemove', 'pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, wake, { passive: true }); });
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; var k = e.key, inSlider = e.target.closest && e.target.closest('.rail');
    if (k === 'Escape') { if (!closeOverlays()) location.href = $('#arcade').href; e.preventDefault(); return; }
    if (e.target.tagName === 'INPUT') return;
    if (VFx.mode === 'present') {
      if (!inSlider && (k === 'ArrowRight' || k === ' ' || k === 'PageDown')) { VFx.next(); e.preventDefault(); return; }
      if (!inSlider && (k === 'ArrowLeft' || k === 'PageUp')) { VFx.prev(); e.preventDefault(); return; }
      if (k === 'Enter' && !(e.target.closest && e.target.closest('button,a'))) { VFx.replay(); e.preventDefault(); return; }
    }
    var lk = k.toLowerCase();
    if (lk === 'p') VFx.setMode(VFx.mode === 'present' ? 'explore' : 'present');
    else if (lk === 'r') { if (!realityEl.classList.contains('on')) VFx.showReality(true); else VFx.showReality(false); }
    else if (lk === 't') notes.classList.toggle('on');
    else if (lk === 'm') { var on = VFAudio.toggle(); $('#mbtn').classList.toggle('on', on); }
    else if (lk === 'f') toggleFS();
  });
  function toggleFS() { var d = document, e = d.documentElement; if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else (e.requestFullscreen || e.webkitRequestFullscreen || function () {}).call(e); }
  $('#modebtn').addEventListener('click', function () { VFx.setMode(VFx.mode === 'present' ? 'explore' : 'present'); });
  $('#rbtn').addEventListener('click', function () { VFx.showReality(!realityEl.classList.contains('on')); });
  $('#mbtn').addEventListener('click', function () { $('#mbtn').classList.toggle('on', VFAudio.toggle()); });
  $('#fbtn').addEventListener('click', toggleFS);
  Array.prototype.forEach.call(document.querySelectorAll('.lang'), function (b) { b.addEventListener('click', function () { VFx.setLang(b.dataset.l); }); });
  realityEl.addEventListener('click', function (e) { if (e.target === realityEl) VFx.showReality(false); });
  vp.addEventListener('click', function (e) {
    if (VFx.mode !== 'present' || e.target.closest('button,a,.rail,.panel,.hot,.flag,.term,#reality,#notes,#ribbon,#widget,#dots,#topbar')) return;
    if (e.clientX > VW * 0.7) VFx.next();
  });
  var sx = null; vp.addEventListener('pointerdown', function (e) { sx = e.target.closest('.rail,.panel,button,#ribbon') ? null : [e.clientX, e.clientY]; });
  vp.addEventListener('pointerup', function (e) { if (!sx || VFx.mode !== 'present') return; var dx = e.clientX - sx[0], dy = e.clientY - sx[1]; sx = null; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) { dx < 0 ? VFx.next() : VFx.prev(); } });
  window.addEventListener('hashchange', function () { var m = /^#scene-(\d+)$/.exec(location.hash); if (m && VFx.mode === 'present') VFx.go(+m[1] - 1); });

  /* ---------- boot ---------- */
  window.VFBoot = function () {
    buildStage(); buildDots(); VFx.chain.render(); VFx.showFlagLabels(false);
    var hub = /[?&]from=hub\b/.test(location.search); if (hub) { $('#entry').classList.add('on'); setTimeout(function () { $('#entry').classList.remove('on'); }, 800); }
    var m = /^#scene-(\d+)$/.exec(location.hash), start = m ? +m[1] - 1 : 0;
    var h = $('#hint'); h.textContent = D.keysHint; setTimeout(function () { h.classList.add('on'); }, 600); setTimeout(function () { h.classList.remove('on'); }, 6600);
    if (location.hash === '#explore') VFx.setMode('explore'); else VFx.go(start);
    wake(); last = performance.now(); requestAnimationFrame(frame);
  };
})();
