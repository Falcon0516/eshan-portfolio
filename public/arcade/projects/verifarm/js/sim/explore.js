/* VERIFARM Explore mode: seven simulations. Hero = Town Journey. All rules from the Truth Sheet (data/facts.js). */
(function () {
  var D = window.VF, el = D.el, T = D.T, $ = D.$, R = D.rules, H = D.rules2, E = D.ex, root = $('#explore');
  var tab = 0, tabsEl, dock, bench, cleanup = null, S = { crop: 'ragi', price: 3300, route: 0, yield: 85, trust: R.trustStart, busy: false, notify: [true, true, true] };
  var CROPS = Object.keys(D.crops);
  function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function btn(txt, cls, parent, fn) { var b = el('button', 'btn ' + (cls || ''), txt, parent); if (fn) b.addEventListener('click', fn); return b; }
  function panel(parent, title) { return el('div', 'panel', title ? '<h3>' + title + '</h3>' : '', parent); }
  function leaveTab() { if (cleanup) { cleanup(); cleanup = null; } D.onDraw = null; D.flows = []; D.clearTimers(); D.showFlagLabels(false); D.flags.forEach(function (f) { f.classList.remove('crown'); f.onclick = null; }); D.bag.show(); }
  function drawTabs() { tabsEl.innerHTML = ''; E.tabs.forEach(function (n, i) { var b = el('button', 'chip' + (i === tab ? ' on' : ''), T(n), tabsEl); b.addEventListener('click', function () { show(i); }); }); }
  function show(i) {
    leaveTab(); tab = i; if (!tabsEl) return; drawTabs(); Array.prototype.slice.call(root.children).forEach(function (n) { if (n !== tabsEl) root.removeChild(n); });
    dock = el('div', 'dock', '', root); bench = null; D.flags.forEach(function (f) { f.classList.remove('crown'); }); D.bag.show();
    [journey, mspGate, haversine, trustSim, isoSim, notifySim, orgsSim][i]();
  }
  D.explore = {
    open: function () { root.innerHTML = ''; D.setTOD(0.3); D.chain.reset(); tabsEl = el('div', 'tabs', '', root); show(tab); },
    close: function () { leaveTab(); root.innerHTML = ''; D.setTOD(null); },
    relang: function () { show(tab); }
  };
  function benchEl() { bench = el('div', 'bench', '', root); return bench; }
  function cropPicker(parent, cur, on) { var row = el('div', 'row', '', parent); CROPS.forEach(function (k) { var b = btn(T(D.crops[k]), k === cur ? 'on' : '', row, function () { on(k); }); }); return row; }

  /* ===== S1 Town Journey (hero) ===== */
  function journey() {
    D.goTo(1300, 740, 1.15, 900); D.setBag(0); D.chain.reset();
    var p = panel(dock, T(D.ui.crop)), crops, priceVal, sl, yv, ysl, route, trustEl, status, go, pl;
    function setCrop(k) { S.crop = k; S.price = Math.round(D.crops[k].avg); show(0); }
    cropPicker(p, S.crop, setCrop);
    var pp = panel(dock, T(D.ui.price)); priceVal = el('div', 'val', '', pp);
    var b = H.band(S.crop), lo = Math.round(D.crops[S.crop].avg * 0.6), hi = Math.round(D.crops[S.crop].avg * 1.4);
    sl = D.slider({ min: lo, max: hi, value: Math.min(hi, Math.max(lo, S.price)), step: 10, label: T(D.ui.price), onInput: function (v) { S.price = v; upd(); } }); pp.appendChild(sl.el); sl.setBand(b[0], b[1]); sl.knob.classList.add('pulse');
    el('div', 'src', '[' + D.placeholderTag + '] band ' + fmt(b[0]) + ' to ' + fmt(b[1]), pp);
    var rp = panel(dock, T(D.ui.route)), rr = el('div', 'row', '', rp); [D.ui.normal, D.ui.off60, D.ui.off120].forEach(function (n, i) { var bb = btn(T(n), i === S.route ? 'on' : '', rr, function () { S.route = i; Array.prototype.forEach.call(rr.children, function (c, k) { c.classList.toggle('on', k === i); }); }); });
    var yp = panel(dock, T(D.ui.yield)), yr = R.yields[S.crop]; yv = el('div', 'val', '', yp);
    ysl = D.slider({ min: 0, max: 100, value: S.yield, step: 1, label: T(D.ui.yield), onInput: function (v) { S.yield = v; upd(); } }); yp.appendChild(ysl.el); ysl.setBand(yr[0], yr[1]);
    el('div', 'src', '[code rule] ' + yr[0] + ' to ' + yr[1] + '%', yp);
    var tp = panel(dock, T(D.ui.trust)); trustEl = el('div', 'val', S.trust.toFixed(1), tp); el('div', 'src', '0 to 10 · starts 5.0 [code rule] · SIMULATION', tp); status = el('div', 'src', '', tp); status.style.fontSize = '18px';
    go = btn(T(D.ui.run), '', dock, run); go.style.minHeight = '56px'; go.style.fontSize = '20px';
    function upd() { priceVal.textContent = 'Rs ' + fmt(S.price) + ' /qtl'; var r = H.sale(S.crop, S.price); priceVal.style.color = r === 'ok' ? '#2E8B57' : '#C65D3B'; yv.textContent = S.yield + '%'; yv.style.color = H.yieldOK(S.crop, S.yield) ? '#2E8B57' : '#C65D3B'; }
    upd();
    function setTrust(ev) { var from = S.trust; S.trust = H.trust(S.trust, ev); D.count(trustEl, from, S.trust, 600, 1); }
    function stop(msg) { status.textContent = msg; S.busy = false; }
    function run() {
      if (S.busy) return; S.busy = true; S.trust = R.trustStart; trustEl.textContent = '5.0'; status.textContent = ''; D.chain.reset(); D.setBag(0); D.flows = [];
      var T0 = D.stationT, k = D.crops[S.crop], clean = true;
      var steps = [
        function (next) { D.ensureBlock('TOKEN', D.ids.token); D.stamp('TOKEN', true); next(); },
        function (next) { var r = H.sale(S.crop, S.price); if (r === 'ok') { D.stamp(T(D.ui.approved), true); setTrust('mspCompliance'); D.ensureBlock('SALE', 'price ' + fmt(S.price)); D.burstAt(D.bag.x, D.bag.y - 40, 26, '#2E8B57'); next(); }
          else { D.stamp(r === 'high' ? T(D.ui.flagged) : T(D.ui.blocked), false); if (r === 'below' || r === 'low') setTrust('belowMsp'); D.ensureBlock('ALERT', 'BELOW_MSP_ALERT ' + fmt(S.price)); D.burstAt(D.bag.x, D.bag.y - 40, 40, '#C65D3B'); if (VFAudio) VFAudio.fail(); if (r !== 'high') { stop(T(E.stopped) + ' ' + T(D.ui.stations.mandi)); return; } clean = false; next(); } },
        function (next) { var c = ['ok', 'dev', 'high'][S.route]; if (c === 'ok') { setTrust('delivery'); D.ensureBlock('CUSTODY', 'route ok'); } else { setTrust('routeDeviation'); clean = false; D.stamp(c === 'high' ? 'HIGH' : T(D.ui.flagged), false); D.ensureBlock('CUSTODY', 'deviation ' + (S.route === 1 ? '60' : '120') + ' km'); if (VFAudio) VFAudio.horn(); } next(); },
        function (next) { if (H.yieldOK(S.crop, S.yield)) { D.ensureBlock('PROCESS', 'yield ' + S.yield); D.burstAt(D.bag.x, D.bag.y - 30, 20, '#2E8B57'); } else { setTrust('yieldAnomaly'); clean = false; D.stamp(T(D.ui.flagged), false); D.ensureBlock('PROCESS', 'YIELD ANOMALY ' + S.yield); if (VFAudio) VFAudio.bell(); } next(); },
        function (next) { setTrust('delivery'); D.ensureBlock('RETAIL', 'shelf'); if (clean) { Flow.petals(D.bag.x, D.bag.y, 70); if (VFAudio) VFAudio.pass(); stop(T(E.clean)); } else stop(''); S.busy = false; }
      ];
      var i = 0; (function go2() { if (i >= steps.length) return; var s = steps[i], t = [0, 1, 2, 3, 4][i]; D.goTo(D.stations[i].x, D.stations[i].y, 1.7, 900);
        D.bagTo(T0[i], i ? 1400 : 300, function () { D.after(250, function () { var fin = true; s(function () { i++; D.after(1100, go2); }); }); }); })();
    }
  }

  /* ===== S2 MSP gate ===== */
  function mspGate() {
    D.goTo(1560, 600, 1.4, 900); var local = JSON.parse(JSON.stringify({ k: S.crop, msp: D.crops[S.crop].msp, avg: D.crops[S.crop].avg }));
    var p = panel(dock, T(D.ui.crop)); cropPicker(p, S.crop, function (k) { S.crop = k; show(1); });
    var kind = D.crops[S.crop].kind, o = { msp: local.msp, avg: local.avg, price: local.avg }, bp = benchEl(), svg;
    var p1 = panel(dock, T(E.mspMin)), v1 = el('div', 'val', '', p1), s1 = D.slider({ min: 0, max: 12000, value: o.msp, step: 50, label: 'MSP', onInput: function (v) { o.msp = v; draw(); } }); p1.appendChild(s1.el);
    var p2 = panel(dock, T(E.avg)), v2 = el('div', 'val', '', p2), s2 = D.slider({ min: 500, max: 12000, value: o.avg, step: 50, label: 'avg', onInput: function (v) { o.avg = v; draw(); } }); p2.appendChild(s2.el);
    var p3 = panel(dock, T(D.ui.price)), v3 = el('div', 'val', '', p3), s3 = D.slider({ min: 500, max: 14000, value: o.price, step: 50, label: 'price', onInput: function (v) { o.price = v; draw(); } }); p3.appendChild(s3.el);
    el('div', 'src', '[' + D.placeholderTag + '] not real government prices', p3);
    if (kind === 'perish') p1.style.opacity = .5;
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 800 300'); svg.setAttribute('width', 800); bp.appendChild(svg);
    function draw() {
      var lo = kind === 'high' ? o.msp : o.avg * 0.85, hi = kind === 'high' ? o.avg * 1.10 : o.avg * 1.15, X = function (v) { return 40 + v / 14000 * 720; };
      var res = o.price < lo ? 'below' : o.price > hi ? 'high' : 'ok'; v1.textContent = 'Rs ' + fmt(o.msp); v2.textContent = 'Rs ' + fmt(o.avg); v3.textContent = 'Rs ' + fmt(o.price);
      svg.innerHTML = '<rect x="40" y="130" width="720" height="40" rx="20" fill="#6B4226" stroke="#3A2518" stroke-width="4"/><rect x="' + X(lo) + '" y="134" width="' + Math.max(0, X(hi) - X(lo)) + '" height="32" rx="16" fill="#2E8B57"/>' +
        '<circle cx="' + X(o.price) + '" cy="150" r="22" fill="' + (res === 'ok' ? '#F4A300' : '#C65D3B') + '" stroke="#3A2518" stroke-width="5"/>' +
        '<text x="40" y="60" font-family="Georgia" font-style="italic" font-weight="700" font-size="34" fill="#3A2518">' + (kind === 'high' ? '[MSP, avg x 1.10]' : '[avg x 0.85, avg x 1.15]') + '</text>' +
        '<text x="' + X(lo) + '" y="215" text-anchor="middle" font-family="monospace" font-size="24" fill="#3A2518">' + fmt(lo) + '</text><text x="' + X(hi) + '" y="250" text-anchor="middle" font-family="monospace" font-size="24" fill="#3A2518">' + fmt(hi) + '</text>' +
        '<text x="760" y="60" text-anchor="end" font-family="Georgia" font-weight="700" font-size="34" fill="' + (res === 'ok' ? '#2E8B57' : '#C65D3B') + '">' + (res === 'ok' ? T(D.ui.approved) : res === 'high' ? T(D.ui.flagged) : (kind === 'high' ? T(D.ui.belowMsp) : T(D.ui.blocked))) + '</text>';
    }
    draw();
  }

  /* ===== S3 Haversine route ===== */
  function haversine() {
    D.goTo(1300, 740, 1.1, 900); var bp = benchEl(), W = 760, Hh = 520, A = { x: 380, y: 260 }, B = { x: 380, y: 260 + 120 }, svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh); svg.setAttribute('width', W); bp.appendChild(svg);
    var p = panel(dock, 'HAVERSINE'); var val = el('div', 'val', '', p), cls = el('div', 'val', '', p); cls.style.fontSize = '22px'; el('div', 'src', '[code rule] over 50 km deviation, over 100 km high. Drag the two points.', p);
    function km() { var a = H.ll(A.x, A.y), b = H.ll(B.x, B.y); return H.haversine(a[0], a[1], b[0], b[1]); }
    var drag = null;
    function draw() {
      var r50 = 50 / H.KM, r100 = 100 / H.KM, d = km(), c = H.routeClass(d); val.textContent = Math.round(d) + ' km'; cls.textContent = c === 'high' ? 'HIGH' : c === 'dev' ? T(D.ui.flagged) : T(D.ui.approved); cls.style.color = c === 'ok' ? '#2E8B57' : '#C65D3B';
      svg.innerHTML = '<circle cx="' + A.x + '" cy="' + A.y + '" r="' + r100 + '" fill="rgba(198,93,59,.12)" stroke="#C65D3B" stroke-width="4" stroke-dasharray="14 10"/><circle cx="' + A.x + '" cy="' + A.y + '" r="' + r50 + '" fill="rgba(244,163,0,.18)" stroke="#F4A300" stroke-width="4" stroke-dasharray="14 10"/>' +
        '<line x1="' + A.x + '" y1="' + A.y + '" x2="' + B.x + '" y2="' + B.y + '" stroke="' + (c === 'ok' ? '#2E8B57' : '#C65D3B') + '" stroke-width="8" stroke-linecap="round"/>' +
        '<text x="' + (A.x + r50 * 0.7) + '" y="' + (A.y - r50 * 0.7) + '" font-family="monospace" font-weight="700" font-size="22" fill="#8A5A00">50 km</text><text x="' + (A.x + r100 * 0.7) + '" y="' + (A.y - r100 * 0.7) + '" font-family="monospace" font-weight="700" font-size="22" fill="#C65D3B">100 km</text>' +
        '<g tabindex="0" id="ptA" style="cursor:grab"><circle cx="' + A.x + '" cy="' + A.y + '" r="20" fill="#2B3A67" stroke="#3A2518" stroke-width="5"/></g><g tabindex="0" id="ptB" style="cursor:grab"><circle cx="' + B.x + '" cy="' + B.y + '" r="20" fill="#F4A300" stroke="#3A2518" stroke-width="5"/></g>';
      ['A', 'B'].forEach(function (n) { var g = svg.querySelector('#pt' + n), pt = n === 'A' ? A : B; g.addEventListener('pointerdown', function (e) { drag = pt; svg.setPointerCapture(e.pointerId); e.stopPropagation(); }); g.addEventListener('keydown', function (e) { var s = e.shiftKey ? 30 : 10; if (e.key === 'ArrowLeft') pt.x -= s; else if (e.key === 'ArrowRight') pt.x += s; else if (e.key === 'ArrowUp') pt.y -= s; else if (e.key === 'ArrowDown') pt.y += s; else return; draw(); svg.querySelector('#pt' + n).focus(); e.preventDefault(); }); });
    }
    svg.addEventListener('pointermove', function (e) { if (!drag) return; var r = svg.getBoundingClientRect(); drag.x = D.clamp((e.clientX - r.left) / r.width * W, 20, W - 20); drag.y = D.clamp((e.clientY - r.top) / r.height * Hh, 20, Hh - 20); draw(); });
    svg.addEventListener('pointerup', function () { drag = null; }); draw();
  }

  /* ===== S4 Trust score ===== */
  function trustSim() {
    D.goTo(1300, 740, 1.1, 900); var v = R.trustStart, log = [], p = panel(dock, T(D.ui.trust)), bp = benchEl(), box = el('div', '', '', bp); box.style.cssText = 'width:min(760px,100%);background:rgba(255,244,220,.95);border:3px solid #3A2518;padding:20px;box-shadow:5px 6px 0 rgba(58,37,24,.5)';
    var big = el('div', 'val', '', box); big.style.fontSize = '84px'; var bar = el('div', 'rail', '', box); bar.style.cursor = 'default'; var fill = el('div', 'band', '', bar); fill.style.left = '2px'; var lg = el('div', 'src', '', box); lg.style.fontSize = '18px'; lg.style.minHeight = '90px';
    el('div', 'src', '0 to 10 · start 5.0 · SIMULATION · deltas [code rule]', box);
    Object.keys(R.trustDeltas).forEach(function (k) { var d = R.trustDeltas[k]; btn(T(E.events[k]) + ' ' + (d > 0 ? '+' : '') + d.toFixed(1), d < 0 ? 'red' : 'on', p, function () { var from = v; v = H.trust(v, k); log.unshift(T(E.events[k]) + ' ' + (d > 0 ? '+' : '') + d.toFixed(1) + ' = ' + v.toFixed(1)); log = log.slice(0, 4); D.count(big, from, v, 500, 1); fill.style.width = (v * 10) + '%'; fill.style.background = v < 3 ? '#C65D3B' : v < 5 ? '#F4A300' : '#2E8B57'; lg.innerHTML = log.join('<br>'); if (d < 0) { D.stamp(T(E.events[k]), false); } else { D.burstAt(D.bag.x, D.bag.y, 16, '#2E8B57'); } }); p.lastChild.style.margin = '4px 4px 0 0'; });
    btn(T(E.reset), '', p, function () { v = R.trustStart; big.textContent = '5.0'; fill.style.width = '50%'; lg.innerHTML = ''; }).style.marginTop = '4px'; big.textContent = '5.0'; fill.style.width = '50%'; fill.style.background = '#2E8B57';
  }

  /* ===== S5 Isolation toy ===== */
  function isoSim() {
    D.goTo(1980, 640, 1.2, 900); var bp = benchEl(), cv = document.createElement('canvas'), W = 760, Hh = 460; cv.width = 1140; cv.height = 690; cv.style.cssText = 'width:' + W + 'px;max-width:100%;cursor:crosshair'; bp.appendChild(cv);
    var iso = D.IsoToy(cv, W, Hh), reveal = 0, p = panel(dock, 'ISOLATION TOY'); el('div', 'src', 'illustrative, not the real model. Click the plot to add a point.', p);
    function anim() { reveal = 0; D.tween(2000, function (u) { reveal = u * 16; }); }
    btn(T(E.addOut), 'red', p, function () { iso.add(0.9 + Math.random() * 0.08, 0.2 + Math.random() * 0.6); anim(); }).style.marginRight = '6px'; btn(T(E.reset), '', p, function () { iso.reset(); reveal = 0; });
    cv.addEventListener('click', function (e) { var r = cv.getBoundingClientRect(); iso.add((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); anim(); });
    D.onDraw = function (c, t) { iso.draw(Math.floor(reveal), t); };
  }

  /* ===== S6 Notification fallback ===== */
  function notifySim() {
    D.goTo(1300, 740, 1.1, 900); var bp = benchEl(), W = 760, svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' 360'); svg.setAttribute('width', W); bp.appendChild(svg);
    var p = panel(dock, 'VOICE > WHATSAPP > SMS'); D.notify.forEach(function (n, i) { var b = btn('<span class="lamp ' + (S.notify[i] ? 'on' : 'bad') + '"></span>' + n, '', p, function () { S.notify[i] = !S.notify[i]; b.firstChild.className = 'lamp ' + (S.notify[i] ? 'on' : 'bad'); draw(); }); b.style.margin = '3px 4px 0 0'; });
    btn('>>', 'on', p, function () { send(); }).style.marginTop = '3px'; el('div', 'src', '[code design] tries in this order. Toggle a channel to fail it.', p);
    var dot = 0, winner = -1;
    function draw() { var h = '<line x1="60" y1="170" x2="700" y2="170" stroke="#6B4226" stroke-width="14" stroke-linecap="round"/>'; D.notify.forEach(function (n, i) { var x = 160 + i * 210; h += '<rect x="' + (x - 60) + '" y="110" width="120" height="120" rx="14" fill="' + (S.notify[i] ? '#2E8B57' : '#C65D3B') + '" stroke="#3A2518" stroke-width="5"/><text x="' + x + '" y="178" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="26" fill="#FFF4DC">' + n + '</text>'; });
      h += '<circle id="dotm" cx="' + (60 + dot) + '" cy="170" r="16" fill="#FFC93C" stroke="#3A2518" stroke-width="5"/><text x="380" y="60" text-anchor="middle" font-family="Georgia" font-style="italic" font-weight="700" font-size="34" fill="#3A2518">' + T(E.notifyMsg) + '</text>';
      h += '<text x="380" y="320" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="30" fill="' + (winner >= 0 ? '#2E8B57' : '#C65D3B') + '">' + (winner >= 0 ? T(E.via) + ' ' + D.notify[winner] : (winner === -2 ? T(E.allFailed) : '')) + '</text>'; svg.innerHTML = h; }
    function send() { winner = -1; dot = 0; draw(); var i = 0; (function tryNext() { if (i >= 3) { winner = -2; draw(); if (VFAudio) VFAudio.fail(); return; } var x = 100 + i * 210; D.tween(700, function (u) { dot = dot + (x - 60 - dot) * D.eio(u) * 0.2 + (u > .95 ? 0 : 0); dot = (i ? 100 + (i - 1) * 210 - 60 : 0) + ((x - 60) - (i ? 100 + (i - 1) * 210 - 60 : 0)) * D.eio(u); draw(); }, function () { if (S.notify[i]) { winner = i; draw(); if (VFAudio) VFAudio.pass(); D.burstAt(D.stations[3].x, D.stations[3].y, 20, '#2E8B57'); } else { i++; D.after(250, tryNext); } }); })(); }
    draw(); D.after(500, send);
  }

  /* ===== S7 Six organisations ===== */
  function orgsSim() {
    D.goTo(1320, 700, 1.05, 900); D.showFlagLabels(true); var p = panel(dock, T(E.pickFlag)), box = el('div', 'val', '', p); box.style.fontSize = '24px'; var role = el('div', 'src', '', p); role.style.fontSize = '20px';
    var lead = 0; (function crown() { D.flags.forEach(function (f, k) { f.classList.toggle('crown', k === lead); }); lead = (lead + 1) % 6; D.after(1700, crown); })();
    D.flags.forEach(function (f, i) { f.onclick = function () { var o = D.orgs[i]; box.textContent = T(o); box.style.color = o.color; role.textContent = o.role; D.burstAt(parseFloat(f.style.left) + 30, parseFloat(f.style.top) + 30, 18, o.color); if (VFAudio) VFAudio.clack(); }; });
    var list = el('div', '', '', dock); D.orgs.forEach(function (o, i) { var b = btn('<span class="sw" style="background:' + o.color + '"></span>' + T(o), '', list, function () { D.flags[i].onclick(); }); b.style.margin = '3px 4px 0 0'; });
    el('div', 'src', 'Raft leader crown rotates (illustration).', dock);
  }
})();
