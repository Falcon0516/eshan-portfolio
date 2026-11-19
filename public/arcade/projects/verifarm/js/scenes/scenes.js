/* VERIFARM Present scenes (8). Each scene = a camera position on the one stage plus an autoplaying beat.
   Shared rule helpers live on VF.rules2 and are reused by the Explore simulations. */
(function () {
  var D = window.VF, el = D.el, T = D.T, $ = D.$, R = D.rules;
  function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* ---------- rule helpers (exact formulas from the Truth Sheet) ---------- */
  var H = D.rules2 = {
    band: function (k) { var c = D.crops[k]; return c.kind === 'high' ? [c.msp, c.avg * 1.10] : [c.avg * 0.85, c.avg * 1.15]; },
    sale: function (k, price) { var b = H.band(k); if (price < b[0]) return D.crops[k].kind === 'high' ? 'below' : 'low'; if (price > b[1]) return 'high'; return 'ok'; },
    yieldOK: function (k, y) { var r = R.yields[k]; return y >= r[0] && y <= r[1]; },
    haversine: function (la1, lo1, la2, lo2) { var r = Math.PI / 180, dla = (la2 - la1) * r, dlo = (lo2 - lo1) * r, a = Math.sin(dla / 2) * Math.sin(dla / 2) + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dlo / 2) * Math.sin(dlo / 2); return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); },
    routeClass: function (km) { return km > R.routeHighKm ? 'high' : km > R.routeWarnKm ? 'dev' : 'ok'; },
    trust: function (v, ev) { return D.clamp(v + R.trustDeltas[ev], R.trustMin, R.trustMax); },
    KM: 0.33, /* km per stage pixel in the illustrative map */
    ll: function (x, y) { return [13 + y * 0.33 / 111.19, 77 + x * 0.33 / (111.19 * Math.cos(13 * Math.PI / 180))]; },
    kmBetween: function (a, b) { var p = H.ll(a.x, a.y), q = H.ll(b.x, b.y); return H.haversine(p[0], p[1], q[0], q[1]); }
  };
  var STN = ['TOKEN', 'SALE', 'CUSTODY', 'PROCESS', 'RETAIL'];
  function ensure(label, data) { var L = D.chain.list, i, k = STN.indexOf(label); if (k < 0) { D.chain.add(label, data); return; }
    for (i = 0; i < k; i++) if (!has(STN[i])) D.chain.add(STN[i], BLOCKDATA[STN[i]]);
    if (!has(label)) D.chain.add(label, data); }
  function has(l) { var L = D.chain.list; for (var i = 0; i < L.length; i++) if (L[i].label === l) return true; return false; }
  D.ensureBlock = ensure;
  var BLOCKDATA = { TOKEN: D.ids.token, SALE: 'sale within band', CUSTODY: 'route ok', PROCESS: 'yield ok', RETAIL: 'shelf' };
  D.blockData = BLOCKDATA; D.STN = STN;

  /* ---------- isolation toy (random axis-aligned splits). Illustrative, not the real model ---------- */
  D.IsoToy = function (canvas, W, Hh) {
    var ctx = canvas.getContext('2d'), pts = [], target = -1, splits = [], rs = 7;
    function rnd() { rs = (rs * 16807) % 2147483647; return rs / 2147483647; }
    function norm() { return (rnd() + rnd() + rnd() - 1.5) * 2; }
    function reset() { pts = []; for (var i = 0; i < 36; i++) pts.push({ x: 0.38 + norm() * 0.1, y: 0.5 + norm() * 0.16 }); target = -1; splits = []; }
    function pathLen(idx, trials, record) { /* mean number of splits to isolate point idx */
      var sum = 0, t, k, box, alive, n, ax, lo, hi, cut, p = pts[idx];
      for (t = 0; t < trials; t++) { box = { x0: 0, x1: 1, y0: 0, y1: 1 }; n = 0;
        for (k = 0; k < 14; k++) { alive = 0; pts.forEach(function (q) { if (q.x >= box.x0 && q.x <= box.x1 && q.y >= box.y0 && q.y <= box.y1) alive++; }); if (alive <= 1) break;
          ax = rnd() < 0.5 ? 'x' : 'y'; lo = ax === 'x' ? box.x0 : box.y0; hi = ax === 'x' ? box.x1 : box.y1; cut = lo + rnd() * (hi - lo);
          if (record && t === 0) splits.push({ ax: ax, v: cut, b: { x0: box.x0, x1: box.x1, y0: box.y0, y1: box.y1 } });
          if (ax === 'x') { if (p.x < cut) box.x1 = cut; else box.x0 = cut; } else { if (p.y < cut) box.y1 = cut; else box.y0 = cut; } n++; }
        sum += n; }
      return sum / trials;
    }
    var api = { pts: function () { return pts; }, reset: reset, splitsShown: 0, score: null,
      add: function (x, y) { pts.push({ x: D.clamp(x, 0.02, 0.98), y: D.clamp(y, 0.05, 0.95) }); api.test(pts.length - 1); },
      test: function (idx) { target = idx; splits = []; rs = 11 + idx; var mine = pathLen(idx, 1, true), mean = 0, k, a = pathLen(idx, 60, false), base = 0;
        for (k = 0; k < 12; k++) base += pathLen(k, 20, false); base /= 12; api.score = { mine: a, base: base, flagged: a < base * 0.5 && pts.length >= 10 }; api.splitsShown = 0; return api.score; },
      draw: function (reveal, time) {
        ctx.setTransform(canvas.width / W, 0, 0, canvas.height / Hh, 0, 0); ctx.clearRect(0, 0, W, Hh); ctx.fillStyle = '#FFF4DC'; ctx.fillRect(0, 0, W, Hh);
        ctx.strokeStyle = 'rgba(58,37,24,.12)'; ctx.lineWidth = 1; for (var g = 1; g < 10; g++) { ctx.beginPath(); ctx.moveTo(g * W / 10, 0); ctx.lineTo(g * W / 10, Hh); ctx.moveTo(0, g * Hh / 10); ctx.lineTo(W, g * Hh / 10); ctx.stroke(); }
        var shown = Math.min(splits.length, reveal), i, s;
        for (i = 0; i < shown; i++) { s = splits[i]; ctx.strokeStyle = i === shown - 1 ? '#C65D3B' : 'rgba(43,58,103,.55)'; ctx.lineWidth = i === shown - 1 ? 5 : 3; ctx.setLineDash([10, 8]); ctx.beginPath();
          if (s.ax === 'x') { ctx.moveTo(s.v * W, s.b.y0 * Hh); ctx.lineTo(s.v * W, s.b.y1 * Hh); } else { ctx.moveTo(s.b.x0 * W, s.v * Hh); ctx.lineTo(s.b.x1 * W, s.v * Hh); } ctx.stroke(); }
        ctx.setLineDash([]);
        pts.forEach(function (p, k) { var isT = k === target; ctx.fillStyle = isT ? (api.score && api.score.flagged ? '#C65D3B' : '#F4A300') : '#2E8B57'; ctx.strokeStyle = '#3A2518'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x * W, p.y * Hh, isT ? 14 + Math.sin(time * 6) * 2 : 8, 0, 6.283); ctx.fill(); ctx.stroke(); });
        ctx.fillStyle = '#3A2518'; ctx.font = '700 20px ui-monospace,Menlo,monospace'; ctx.fillText('quantity per crop and district →', 14, Hh - 12);
        if (api.score) { ctx.font = '700 26px ui-monospace,Menlo,monospace'; ctx.fillStyle = api.score.flagged ? '#C65D3B' : '#2E8B57'; ctx.fillText(api.score.flagged ? 'FLAGGED (toy)' : 'normal (toy)', 14, 34);
          ctx.fillStyle = '#3A2518'; ctx.font = '400 20px ui-monospace,Menlo,monospace'; ctx.fillText('splits to isolate: ' + api.score.mine.toFixed(1) + ' vs typical ' + api.score.base.toFixed(1), 14, 62); }
      } };
    reset(); return api;
  };

  var S = D.scenes_impl = D.scenes_impl = [];
  function panel(parent, title) { var p = el('div', 'panel', title ? '<h3>' + title + '</h3>' : '', parent); return p; }
  function tag(layer, x, y, txt, css) { var t = el('div', 'tag', txt, layer); t.style.left = x + 'px'; t.style.top = y + 'px'; if (css) t.style.cssText += css; return t; }
  function pulseBag() { D.bag.el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35,.8)' }, { transform: 'scale(.9,1.15)' }, { transform: 'scale(1)' }], { duration: 500 }); }
  var spring = [{ transform: 'scale(0) rotate(-8deg)', opacity: 0 }, { transform: 'scale(1.18) rotate(2deg)', opacity: 1, offset: .55 }, { transform: 'scale(.95)', offset: .8 }, { transform: 'scale(1)', opacity: 1 }];
  function popIn(n, delay) { n.style.opacity = 0; D.after(delay || 0, function () { n.style.opacity = 1; n.animate(spring, { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' }); }); }
  function pathFlow(i, o) { var f = Flow.create({ path: D.routeSegPath(i), rate: o.rate, speed: o.speed, color: o.color, size: o.size || 10, gate: o.gate, open: o.open, jitter: o.jitter }); D.flows.push(f); return f; }

  /* ===== 1 THE TOKEN ===== */
  S[0] = { cam: { x: 760, y: 640, z: 2.2 },
    enter: function (layer) {
      D.setTOD(0.02); D.chain.reset(); D.bagTo(0, 500);
      var farm = [[560, 560], [520, 640], [610, 720]];
      var g = Flow.makePath([[{ x: 470, y: 600 }, { x: 540, y: 560 }, { x: 640, y: 700 }, { x: 740, y: 650 }]], 20); D.flows.push(Flow.create({ path: g, rate: 9, speed: 0.22, color: '#FFC93C', size: 7, jitter: 60 }));
      var card = el('div', 'token', '<span class="lock"></span>' + D.ids.token + '<small>' + D.ids.qty + '</small>', layer); card.style.left = '800px'; card.style.top = '430px'; popIn(card, 1500);
      var h = sha256(D.ids.farmer), idc = el('div', 'token', '<span class="lock"></span>' + D.ids.farmer + '<small><span class="term hot" tabindex="0" data-term="SHA-256" style="pointer-events:auto">SHA-256</span> ' + h.slice(0, 12) + '...</small><small style="font-size:16px">sample ID, hashed locally</small>', layer);
      idc.style.left = '800px'; idc.style.top = '600px'; popIn(idc, 3200);
      D.after(4800, function () { pulseBag(); D.burstAt(D.bag.x, D.bag.y - 40, 26, '#FFC93C'); D.ensureBlock('TOKEN', D.ids.token); });
      D.after(6500, function () { D.flows.forEach(function (f) { f.rate = 3; }); });
    },
    leave: function () { D.setTOD(null); } };

  /* ===== 2 THE MANDI GATE ===== */
  S[1] = { cam: { x: 1500, y: 640, z: 2.1 },
    enter: function (layer) {
      D.setTOD(0.3); D.bagTo(D.stationT[1], 1100); var crop = 'ragi', st = { v: 3300, last: 'ok' }, b = H.band(crop), lo = 2400, hi = 4200;
      var gate = pathFlow(0, { rate: 5, speed: 0.2, color: '#FFC93C', size: 9, gate: 0.97, open: true });
      var w = $('#widget'), p = panel(w), val, status, sl;
      p.innerHTML = '<h3>' + T(D.ui.price) + ' · <span class="term" tabindex="0" data-term="MSP">MSP</span> ' + T(D.crops[crop]) + '</h3><div class="val"></div>'; val = p.querySelector('.val');
      status = el('div', 'val', '', p); status.style.fontSize = '22px'; status.style.marginTop = '6px';
      sl = D.slider({ min: lo, max: hi, value: st.v, step: 10, label: T(D.ui.price), onInput: update }); p.appendChild(sl.el); sl.setBand(b[0], b[1]); sl.knob.classList.add('pulse');
      var mini = el('div', 'mini', '<span>MSP ' + fmt(b[0]) + '</span><span>x1.10 avg ' + fmt(b[1]) + '</span>', p);
      el('div', 'src', '[' + D.placeholderTag + '] [code rule]', p);
      var alert = tag(layer, 1540, 800, 'BELOW_MSP_ALERT', 'background:#C65D3B;opacity:0'); var stampT = 0;
      function update(v) {
        st.v = v; var r = H.sale(crop, v); val.textContent = 'Rs ' + fmt(v) + ' /qtl'; gate.open = r === 'ok';
        status.textContent = r === 'ok' ? T(D.ui.approved) : r === 'below' ? T(D.ui.belowMsp) : (r === 'high' ? T(D.ui.flagged) : T(D.ui.blocked)); status.style.color = r === 'ok' ? '#2E8B57' : '#C65D3B';
        sl.knob.style.background = r === 'ok' ? '' : 'radial-gradient(circle at 35% 30%,#F6B5A0,#C65D3B 60%,#6B2312)';
        if (r !== st.last) { var now = performance.now(); if (now - stampT > 500) { stampT = now;
            if (r === 'ok') { D.stamp(T(D.ui.approved), true); alert.style.opacity = 0; D.burstAt(1560, 640, 30, '#2E8B57'); if (VFAudio) VFAudio.pass(); D.ensureBlock('SALE', 'price ' + fmt(v)); }
            else { D.stamp(r === 'high' ? T(D.ui.flagged) : T(D.ui.blocked), false); alert.style.opacity = 1; D.burstAt(1560, 640, 40, '#C65D3B'); if (VFAudio) VFAudio.fail(); } } st.last = r; }
      }
      update(3300); st.last = 'ok';
      var steps = [[1200, 2700], [3400, 3300]]; /* beat: sweep below MSP, then back into the band */
      function sweep(a, b2, ms) { D.tween(ms, function (u) { sl.set(a + (b2 - a) * D.eio(u)); }); }
      D.after(1500, function () { sweep(3300, 2700, 1400); }); D.after(4300, function () { sweep(2700, 3300, 1400); });
      D.after(7600, function () { sl.knob.classList.add('pulse'); });
    } };

  /* ===== 3 THE TRUCK ===== */
  S[2] = { cam: { x: 1420, y: 800, z: 1.75 },
    enter: function (layer, replay) {
      D.setTOD(0.3); var path = D.routeSegPath(1), truck = $('#truck'), dev = 0, banner, last = 'ok'; truck.style.display = '';
      D.bagTo(D.stationT[1], 600); D.bag.hide(); /* the bag rides in the truck */
      var P0 = { x: 0, y: 0, a: 0 }, P1 = { x: 0, y: 0, a: 0 }, tp = { x: 0, y: 0 }, tt = 0;
      function place(t, dv) { Flow.at(path, t, P0); var nx = -Math.sin(P0.a), ny = Math.cos(P0.a); tp.x = P0.x + nx * dv / H.KM; tp.y = P0.y + ny * dv / H.KM; truck.style.left = (tp.x - truck._w / 2) + 'px'; truck.style.top = (tp.y - truck._h) + 'px'; truck.style.transform = 'scaleX(' + (P0.a > 1.5 || P0.a < -1.5 ? -1 : 1) + ')'; }
      function km() { Flow.at(path, tt, P0); return H.kmBetween(P0, tp); }
      place(0, 0);
      var w = $('#widget'), p = panel(w, 'DEVIATION'), val, sl; val = el('div', 'val', '0 km', p);
      sl = D.slider({ min: 0, max: 130, value: 0, step: 1, label: 'Deviation km', onInput: function (v) { dev = v; place(tt, dev); upd(); } }); p.appendChild(sl.el);
      el('div', 'mini', '<span>50 km</span><span>100 km</span>', p); el('div', 'src', '[code rule] <span class="term" tabindex="0" data-term="Haversine">Haversine</span> check', p);
      banner = tag(layer, 1100, 700, '', 'opacity:0;font-size:34px');
      function upd() { var d = km(), c = H.routeClass(d); val.textContent = Math.round(d) + ' km'; val.style.color = c === 'ok' ? '#2E8B57' : '#C65D3B'; banner.textContent = c === 'high' ? 'HIGH ' + Math.round(d) + ' km' : c === 'dev' ? 'DEVIATION ' + Math.round(d) + ' km' : ''; banner.style.opacity = c === 'ok' ? 0 : 1; banner.style.background = c === 'high' ? '#8E2F1B' : '#C65D3B';
        if (c !== last) { if (c === 'high') { D.stamp('HIGH', false); } else if (c === 'dev') { D.burstAt(tp.x, tp.y - 60, 24, '#C65D3B'); if (VFAudio) VFAudio.fail(); } if (c === 'ok') D.ensureBlock('CUSTODY', 'route ok'); last = c; } }
      D.onDraw = function (c, time) { /* corridor, thresholds, red arc */
        var pts = path.pts, i, n = pts.length, k, off;
        c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = 'rgba(46,139,87,.45)'; c.lineWidth = 34; c.beginPath(); c.moveTo(pts[0].x, pts[0].y); for (i = 1; i < n; i++) c.lineTo(pts[i].x, pts[i].y); c.stroke();
        [[50, '#F4A300'], [100, '#C65D3B']].forEach(function (th) { off = th[0] / H.KM; c.strokeStyle = th[1]; c.lineWidth = 5; c.setLineDash([16, 12]); c.beginPath();
          for (i = 0; i < n; i++) { var a = pts[Math.min(n - 1, i + 1)], b = pts[Math.max(0, i - 1)], ang = Math.atan2(a.y - b.y, a.x - b.x), x = pts[i].x - Math.sin(ang) * off, y = pts[i].y + Math.cos(ang) * off; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); });
        c.setLineDash([]);
        if (dev > 1) { Flow.at(path, tt, P0); c.strokeStyle = '#C65D3B'; c.lineWidth = 8; c.beginPath(); c.moveTo(P0.x, P0.y); c.quadraticCurveTo((P0.x + tp.x) / 2 + 30, (P0.y + tp.y) / 2 - 30, tp.x, tp.y); c.stroke(); c.fillStyle = '#C65D3B'; c.beginPath(); c.arc(tp.x, tp.y, 12, 0, 6.283); c.fill(); }
        c.font = '700 30px ui-monospace,Menlo,monospace'; c.lineWidth = 7; c.strokeStyle = '#3A2518'; c.fillStyle = '#FFF4DC'; [[50, 10], [100, 10]].forEach(function (th) { var a = pts[th[1]], b = pts[th[1] + 1], ang = Math.atan2(b.y - a.y, b.x - a.x), off = th[0] / H.KM, x = a.x - Math.sin(ang) * off, y = a.y + Math.cos(ang) * off; c.strokeText(th[0] + ' km', x, y); c.fillText(th[0] + ' km', x, y); });
      };
      var kf = [[0, 0], [0.3, 0], [0.55, 65], [0.8, 120], [1, 0]];
      function devAt(u) { for (var i = 1; i < kf.length; i++) if (u <= kf[i][0]) { var a = kf[i - 1], b = kf[i], k = (u - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * D.eio(k); } return 0; }
      var beat = replay ? 7000 : 8500; if (VFAudio) VFAudio.horn();
      D.after(900, function () { D.tween(beat, function (u) { tt = Math.min(1, u * 1.0); dev = devAt(u); sl.set(dev, true); place(tt, dev); upd(); }, function () { tt = 1; place(1, 0); sl.set(0, true); dev = 0; upd(); }); });
      this._truck = truck;
    },
    leave: function () { D.onDraw = null; D.bag.show(); var t = $('#truck'); t.style.display = 'none'; t.style.transform = ''; } };

  /* ===== 4 THE MILL ===== */
  S[3] = { cam: { x: 930, y: 700, z: 2.2 },
    enter: function (layer) {
      D.setTOD(0.35); D.bagTo(D.stationT[3], 1100); var crop = 'ragi', range = R.yields[crop], y = 70, last = 'ok';
      var feed = pathFlow(2, { rate: 7, speed: 0.22, color: '#8C4A2F', size: 7, gate: 0.93, open: true });
      var bell = el('div', '', '', layer); bell.style.cssText = 'position:absolute;left:1000px;top:560px;width:70px;height:80px;transform-origin:50% 0';
      bell.innerHTML = '<svg viewBox="0 0 70 80" width="70" height="80"><path d="M35 4 C18 8 14 30 12 52 L6 62 H64 L58 52 C56 30 52 8 35 4Z" fill="#F4A300" stroke="#3A2518" stroke-width="5"/><circle cx="35" cy="68" r="8" fill="#3A2518"/></svg>';
      var al = tag(layer, 940, 500, 'YIELD ANOMALY', 'background:#C65D3B;opacity:0;font-size:30px');
      var w = $('#widget'), p = panel(w, T(D.ui.yield) + ' · ' + T(D.crops[crop]));
      p.innerHTML += '<svg viewBox="0 0 240 140" width="260" height="150" role="img" aria-label="Yield dial"><path id="arcBg" d="M20 120 A100 100 0 0 1 220 120" fill="none" stroke="#6B4226" stroke-width="22"/><path id="arcOk" d="" fill="none" stroke="#2E8B57" stroke-width="22"/><g id="needle"><path d="M-5 0 L0 -96 L5 0Z" fill="#3A2518"/><circle r="10" fill="#C65D3B" stroke="#3A2518" stroke-width="4"/></g></svg>';
      var val = el('div', 'val', '', p), svg = p.querySelector('svg'), needle = svg.querySelector('#needle'), arcOk = svg.querySelector('#arcOk');
      function ang(v) { return -90 + (v - 50) / 50 * 180; } function pt(v, r) { var a = (ang(v) - 90) * Math.PI / 180; return (120 + Math.cos(a) * r).toFixed(1) + ' ' + (120 + Math.sin(a) * r).toFixed(1); }
      arcOk.setAttribute('d', 'M' + pt(range[0], 100) + ' A100 100 0 0 1 ' + pt(range[1], 100));
      var sl = D.slider({ min: 50, max: 100, value: y, step: 1, label: T(D.ui.yield), onInput: upd }); p.appendChild(sl.el); sl.setBand(range[0], range[1]); sl.knob.classList.add('pulse');
      el('div', 'mini', '<span>Ragi ' + range[0] + ' to ' + range[1] + '%</span><span>[code rule]</span>', p);
      function upd(v) { y = v; needle.setAttribute('transform', 'translate(120 120) rotate(' + ang(v) + ')'); var ok = H.yieldOK(crop, v), c = ok ? 'ok' : 'bad'; val.textContent = v + '%'; val.style.color = ok ? '#2E8B57' : '#C65D3B'; feed.open = ok; al.style.opacity = ok ? 0 : 1;
        if (c !== last) { if (!ok) { D.bag.el.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 400 }); bell.animate([{ transform: 'rotate(-28deg)' }, { transform: 'rotate(26deg)' }, { transform: 'rotate(-20deg)' }, { transform: 'rotate(16deg)' }, { transform: 'rotate(0)' }], { duration: 1100 }); if (VFAudio) VFAudio.bell(); document.body.classList.add('shake'); D.after(380, function () { document.body.classList.remove('shake'); }); D.burstAt(1000, 620, 30, '#C65D3B'); } else { D.burstAt(D.bag.x, D.bag.y - 30, 24, '#2E8B57'); D.ensureBlock('PROCESS', 'yield ok'); } last = c; } }
      upd(70); last = 'bad';
      function sweep(a, b, ms) { D.tween(ms, function (u) { sl.set(a + (b - a) * D.eio(u)); }); }
      D.after(1300, function () { sweep(70, 85, 1500); }); D.after(4000, function () { sweep(85, 97, 1300); }); D.after(6400, function () { sweep(97, 85, 1200); });
    } };

  /* ===== 5 SIX FLAGS ===== */
  S[4] = { cam: { x: 1320, y: 700, z: 1.05 },
    enter: function (layer) {
      D.setTOD(0.45); D.showFlagLabels(true); D.bag.show(); D.bagTo(0, 400);
      var f0 = D.flags, loop = [], i; f0.forEach(function (f) { loop.push({ x: parseFloat(f.style.left), y: parseFloat(f.style.top) - 10 }); });
      var segs = []; for (i = 0; i < 6; i++) { var a = loop[i], b = loop[(i + 1) % 6]; segs.push([a, { x: a.x + (b.x - a.x) * .3, y: a.y - 80 }, { x: a.x + (b.x - a.x) * .7, y: b.y - 80 }, b]); }
      var lp = Flow.makePath(segs, 18); D.flows.push(Flow.create({ path: lp, rate: 6, speed: 0.07, color: '#FFF4DC', size: 8, jitter: 4 }));
      D.onDraw = function (c) { c.strokeStyle = 'rgba(255,244,220,.5)'; c.lineWidth = 4; c.setLineDash([6, 14]); c.beginPath(); lp.pts.forEach(function (p, k) { if (k) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.stroke(); c.setLineDash([]); };
      var raft = tag(layer, 1500, 250, '', ''); raft.innerHTML = 'leader: <span class="term hot" tabindex="0" data-term="Raft" style="pointer-events:auto">Raft</span> &middot; <span class="term hot" tabindex="0" data-term="Hyperledger Fabric" style="pointer-events:auto">Hyperledger Fabric</span>'; raft.style.fontSize = '30px';
      var lead = 0; (function crown() { f0.forEach(function (f, k) { f.classList.toggle('crown', k === lead); }); lead = (lead + 1) % 6; D.after(1700, crown); })();
      /* the bag does the whole trip; a block drops at each hand-off */
      var T0 = D.stationT; D.bag.show();
      var stops = [[1, 'SALE'], [2, 'CUSTODY'], [3, 'PROCESS'], [4, 'RETAIL']];
      D.after(800, function () { D.tween(7400, function (u) { D.setBag(u); stops.forEach(function (s) { if (u >= T0[s[0]] && !s.done) { s.done = true; D.ensureBlock(s[1], D.blockData[s[1]]); pulseBag(); D.burstAt(D.bag.x, D.bag.y - 30, 14, '#FFC93C'); } }); }); });
      var tg = $('#tip'); layer.addEventListener('click', function () {});
    },
    leave: function () { D.showFlagLabels(false); D.onDraw = null; D.flags.forEach(function (f) { f.classList.remove('crown'); }); } };

  /* ===== 6 FRAUD EYE ===== */
  S[5] = { cam: { x: 1900, y: 540, z: 1.3 },
    enter: function (layer) {
      D.setTOD(0.5); var cv = document.createElement('canvas'), W = 640, Hh = 380; cv.width = 960; cv.height = 570; cv.style.cssText = 'position:absolute;left:1640px;top:200px;width:' + W + 'px;height:' + Hh + 'px;border:6px solid #3A2518;box-shadow:10px 12px 0 rgba(58,37,24,.5);pointer-events:auto;cursor:crosshair;background:#FFF4DC';
      layer.appendChild(cv); var iso = D.IsoToy(cv, W, Hh), reveal = 0, rev = 0, t0 = 0;
      var lbl = tag(layer, 1640, 140, '', 'font-size:26px'); lbl.innerHTML = '<span class="term hot" tabindex="0" data-term="IsolationForest" style="pointer-events:auto">IsolationForest</span> toy &middot; illustrative, not the real model';
      var bell = el('div', '', '', layer); bell.style.cssText = 'position:absolute;left:1960px;top:600px;width:90px;height:100px;transform-origin:50% 0;opacity:0'; bell.innerHTML = '<svg viewBox="0 0 70 80" width="90" height="100"><path d="M35 4 C18 8 14 30 12 52 L6 62 H64 L58 52 C56 30 52 8 35 4Z" fill="#C65D3B" stroke="#3A2518" stroke-width="5"/><circle cx="35" cy="68" r="8" fill="#3A2518"/></svg>';
      var dash = tag(layer, 1900, 720, 'GOV DASHBOARD', 'background:#2B3A67;font-size:24px;opacity:0');
      D.onDraw = function (c, time) { iso.draw(Math.floor(reveal), time); };
      function run(x) { iso.add(x, 0.3 + Math.random() * 0.4); reveal = 0; var n = 16; t0 = performance.now(); D.tween(2400, function (u) { reveal = u * n; }, function () { if (iso.score && iso.score.flagged) { bell.style.opacity = 1; dash.style.opacity = 1; bell.animate([{ transform: 'rotate(-25deg)' }, { transform: 'rotate(22deg)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(0)' }], { duration: 1000 }); if (VFAudio) VFAudio.bell(); D.burstAt(1980, 700, 26, '#C65D3B'); } else { bell.style.opacity = 0; dash.style.opacity = 0; } }); }
      cv.addEventListener('click', function (e) { var r = cv.getBoundingClientRect(); iso.add((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); reveal = 0; D.tween(1800, function (u) { reveal = u * 16; }); e.stopPropagation(); });
      D.after(1400, function () { run(0.94); });
      D.after(6200, function () { iso.add(0.4, 0.5); reveal = 0; D.tween(1400, function (u) { reveal = u * 16; }); });
      D.flows.push(Flow.create({ path: Flow.makePath([[{ x: 1560, y: 760 }, { x: 1700, y: 700 }, { x: 1800, y: 780 }, { x: 1960, y: 700 }]], 16), rate: 4, speed: 0.2, color: '#FFC93C', size: 7 }));
      var w = $('#widget'), p = panel(w, 'CLICK THE PLOT'); el('div', 'src', 'Add a point. Far ones isolate in few splits. Rules explain why.', p); p.style.maxWidth = '300px';
    },
    leave: function () { D.onDraw = null; } };

  /* ===== 7 SCAN TO TRACE ===== */
  S[6] = { cam: { x: 1560, y: 820, z: 1.45 },
    enter: function (layer, replay) {
      D.setTOD(0.55); D.bag.show(); D.setBag(1);
      var qr = $('#qrposter'), scan = el('div', '', '', layer); scan.style.cssText = 'position:absolute;left:1690px;top:650px;width:' + 110 + 'px;height:6px;background:#2E8B57;box-shadow:0 0 18px #2E8B57;opacity:0';
      var phone = el('div', '', '', layer); phone.style.cssText = 'position:absolute;left:1850px;top:690px;width:64px;height:110px;border:6px solid #3A2518;border-radius:12px;background:#2B3A67;transform:rotate(-12deg);opacity:0'; phone.innerHTML = '<div style="margin:12px 6px;height:70px;background:#FFF4DC"></div>';
      D.ensureBlock('TOKEN', D.ids.token); STN.forEach(function (s) { D.ensureBlock(s, D.blockData[s]); });
      var tr = R.trustStart, labels = [], tvals = [R.trustStart], ev = ['', 'mspCompliance', 'delivery', 'delivery', 'delivery'], k, tv = R.trustStart;
      for (k = 1; k < 5; k++) { tv = H.trust(tv, ev[k]); tvals.push(tv); }
      D.stations.forEach(function (s, i) { var n = tag(layer, s.x + 20, s.y - 150, STN[i] + ' ' + D.chain.list[i].hash.slice(0, 6) + '<br>trust ' + tvals[i].toFixed(1) + ' <small>(sim)</small>', 'font-size:24px;opacity:0;line-height:1.2;background:rgba(43,58,103,.95)'); labels.push(n); });
      var lbT = labels[3]; var t1 = 800;
      D.after(700, function () { phone.style.opacity = 1; phone.animate([{ transform: 'translateY(40px) rotate(-12deg)', opacity: 0 }, { transform: 'rotate(-12deg)', opacity: 1 }], { duration: 500, easing: 'ease-out' }); });
      D.after(1200, function () { scan.style.opacity = 1; scan.animate([{ top: '650px' }, { top: '780px' }, { top: '650px' }], { duration: 1400, iterations: 1 }); D.burstAt(1750, 720, 20, '#2E8B57'); });
      D.after(2800, function () { scan.style.opacity = 0; D.tween(6500, function (u) { var t = 1 - u; D.setBag(t); for (var i = 4; i >= 0; i--) if (t <= D.stationT[i] + 0.0 && labels[i].style.opacity !== '1') { labels[i].style.opacity = 1; labels[i].animate(spring, { duration: 500 }); D.burstAt(D.stations[i].x, D.stations[i].y - 20, 14, '#FFC93C'); } }); });
      D.flows.push(Flow.create({ path: Flow.makePath([[{ x: 1760, y: 840 }, { x: 1560, y: 960 }, { x: 1200, y: 760 }, { x: 760, y: 660 }]], 24), rate: 3, speed: 0.06, color: '#2B3A67', size: 6 }));
    } };

  /* ===== 8 REALITY ===== */
  S[7] = { cam: { x: 1280, y: 740, z: 1.0 }, sim: false,
    enter: function () {
      D.setTOD(0.62); D.bag.show(); D.bagTo(1, 800); D.showReality(true); D.after(500, function () { Flow.petals(1280, 400, 60); }); D.after(1800, function () { Flow.petals(1500, 400, 60); if (VFAudio) VFAudio.pass(); });
    } };
  var relang = function () { var i = D.scene; if (i >= 0 && S[i]) { D.go(i, true); } };
  S.forEach(function (s) { s.relang = relang; });
})();
