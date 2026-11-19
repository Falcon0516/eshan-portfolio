/* Six agent canvases, a Runner (parallel or one by one), and shared map helpers. All outputs are SIMULATION. */
(function () {
  var C = K.COL, FONT = K.FONT, MONO = K.MONO, F = window.FACTS;
  var TAU = Math.PI * 2;

  /* ---------- map helpers ---------- */
  K.mapXY = function (lat, lon) { var m = F.map; return [(lon - m.lon0) / m.dLon, 1 - (lat - m.lat0) / m.dLat]; };
  K.nearest = function (user) {
    var out = [], k, i, best, d, pl;
    user = user || F.map.user;
    for (k in F.places) {
      best = null;
      for (i = 0; i < F.places[k].length; i++) {
        pl = F.places[k][i]; d = K.haversine(user.lat, user.lon, pl[1], pl[2]);
        if (!best || d < best.km) best = { kind: k, name: pl[0], lat: pl[1], lon: pl[2], km: d };
      }
      out.push(best);
    }
    return out;
  };
  var ROADS = (function () { var r = K.rng(7), a = [], i; for (i = 0; i < 9; i++) a.push([r(), r(), r(), r(), r() > 0.5]); return a; })();

  /* ---------- drawing helpers ---------- */
  function U(w, h) { return Math.min(w / 1076, h / 441); }
  function font(ctx, px, bold) { ctx.font = (bold === false ? '' : 'bold ') + px + 'px ' + FONT; }
  function outline(ctx, text, x, y, fill, lw) { ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y); }
  function base(ctx, w, h, t) {
    var g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#1B1464'); g.addColorStop(1, '#12082B');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.2; ctx.fillStyle = K.dotPattern(ctx, C.violet); ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
  }
  function standby(ctx, w, h, t, u) {
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 2.4); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; font(ctx, 46 * u);
    ctx.fillStyle = C.paper; ctx.fillText(F.ui.standby, w / 2, h / 2); ctx.globalAlpha = 1;
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(w / 2, h / 2 + 52 * u, (7 + 2 * Math.sin(t * 5)) * u, 0, TAU); ctx.fill();
  }
  function bar(ctx, w, h, p, color, u) {
    ctx.fillStyle = 'rgba(18,8,43,.8)'; ctx.fillRect(0, h - 12 * u, w, 12 * u);
    ctx.fillStyle = color; ctx.fillRect(0, h - 12 * u, w * p, 12 * u);
  }
  function stampDone(ctx, w, h, a, u) {
    if (a.state !== 'done') return; var k = K.overshoot(Math.min(1, (a.since || 0) * 3));
    ctx.save(); ctx.translate(w - 62 * u, 56 * u); ctx.scale(k, k); ctx.rotate(-0.18);
    ctx.fillStyle = C.gold; ctx.strokeStyle = C.ink; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.arc(0, 0, 36 * u, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 9 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-15 * u, 2 * u); ctx.lineTo(-4 * u, 14 * u); ctx.lineTo(17 * u, -12 * u); ctx.stroke(); ctx.restore();
  }
  function levelOf(i) { return i < 0.34 ? 0 : i < 0.67 ? 1 : 2; }

  /* ---------- 1 threat ---------- */
  function dThreat(ctx, w, h, t, a, E, u) {
    var cx = w * 0.3, cy = h * 0.86, R = Math.min(w * 0.25, h * 0.66), arcs = [[Math.PI, Math.PI * 1.34, C.cyan], [Math.PI * 1.34, Math.PI * 1.67, C.gold], [Math.PI * 1.67, TAU, C.mag]], i, p = a.p;
    ctx.lineCap = 'butt';
    for (i = 0; i < 3; i++) {
      ctx.strokeStyle = C.ink; ctx.lineWidth = R * 0.4; ctx.beginPath(); ctx.arc(cx, cy, R, arcs[i][0], arcs[i][1]); ctx.stroke();
      ctx.strokeStyle = arcs[i][2]; ctx.lineWidth = R * 0.28; ctx.beginPath(); ctx.arc(cx, cy, R, arcs[i][0] + 0.02, arcs[i][1] - 0.02); ctx.stroke();
    }
    var e = K.overshoot(Math.min(1, p * 1.5)), jit = a.state === 'run' ? Math.sin(t * 17) * 0.035 : Math.sin(t * 2) * 0.012;
    var ang = Math.PI + Math.PI * K.clamp(E.intensity, 0.04, 0.96) * e + jit;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 15 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * R * 1.02, cy + Math.sin(ang) * R * 1.02); ctx.stroke();
    ctx.strokeStyle = C.paper; ctx.lineWidth = 7 * u; ctx.stroke();
    ctx.fillStyle = C.gold; ctx.strokeStyle = C.ink; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.arc(cx, cy, 22 * u, 0, TAU); ctx.fill(); ctx.stroke();
    var lv = levelOf(E.intensity), col = [C.cyan, C.gold, C.mag][lv];
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (p > 0.78) { var k = K.overshoot((p - 0.78) / 0.22); ctx.save(); ctx.translate(w * 0.62, h * 0.58); ctx.scale(k, k); ctx.rotate(-0.06); font(ctx, 112 * u); outline(ctx, F.panelText.threat[lv], 0, 0, col, 12 * u); ctx.restore(); }
    for (i = 0; i < 8; i++) {
      var bh = (0.3 + 0.7 * Math.abs(Math.sin(t * (2 + i * 0.7) + i))) * (a.state === 'done' ? 0.5 : 1) * h * 0.18 * p;
      ctx.fillStyle = i % 3 === 0 ? C.mag : C.violet; ctx.fillRect(w * 0.62 + i * 34 * u, h * 0.86 - bh, 22 * u, bh);
    }
  }
  /* ---------- 2 family_alert ---------- */
  function bubble(ctx, x, y, bw, bh, fill, text, u, mine, k) {
    ctx.save(); ctx.translate(x + bw / 2, y + bh / 2); ctx.scale(k, k); ctx.translate(-bw / 2, -bh / 2);
    ctx.lineJoin = 'round'; ctx.fillStyle = fill; ctx.strokeStyle = C.ink; ctx.lineWidth = 7 * u;
    ctx.beginPath(); ctx.moveTo(18 * u, 0); ctx.lineTo(bw - 18 * u, 0); ctx.quadraticCurveTo(bw, 0, bw, 18 * u); ctx.lineTo(bw, bh - 18 * u); ctx.quadraticCurveTo(bw, bh, bw - 18 * u, bh);
    if (mine) { ctx.lineTo(bw - 6 * u, bh); ctx.lineTo(bw + 14 * u, bh + 16 * u); ctx.lineTo(bw - 40 * u, bh); }
    ctx.lineTo(18 * u, bh); ctx.quadraticCurveTo(0, bh, 0, bh - 18 * u); ctx.lineTo(0, 18 * u); ctx.quadraticCurveTo(0, 0, 18 * u, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.ink; font(ctx, 32 * u); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, 22 * u, bh / 2 + 2 * u); ctx.restore();
  }
  function dFamily(ctx, w, h, t, a, E, u) {
    var T = F.panelText.family, p = a.p, th = [0.1, 0.38, 0.66], i, k;
    for (i = 0; i < 3; i++) {
      k = K.overshoot(K.clamp((p - th[i]) / 0.14, 0, 1)); if (k <= 0) continue;
      bubble(ctx, w * (i === 1 ? 0.2 : 0.07), h * (0.1 + i * 0.28), w * (i === 1 ? 0.7 : 0.56 + i * 0.04), h * 0.2, i === 1 ? C.cyan : C.paper, T[i], u, i !== 1, k);
    }
    if (p > 0.82) {
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 9 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      var bx = w * 0.8, by = h * 0.74, s = 1 + 0.06 * Math.sin(t * 6);
      for (i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(bx + i * 22 * u, by); ctx.lineTo(bx + 12 * u + i * 22 * u, by + 14 * u * s); ctx.lineTo(bx + 38 * u + i * 22 * u, by - 18 * u * s); ctx.stroke(); }
    }
  }
  /* ---------- 3 fir ---------- */
  function dFir(ctx, w, h, t, a, E, u) {
    var p = a.p, sx = w * 0.1, sw = w * 0.46, sy = h * 0.07, sh = h * 0.86, i, lines = 6;
    ctx.save(); ctx.translate(sx + sw / 2, sy + sh / 2); ctx.rotate(-0.025); ctx.translate(-sw / 2, -sh / 2);
    ctx.fillStyle = C.paper; ctx.strokeStyle = C.ink; ctx.lineWidth = 6 * u; ctx.fillRect(0, 0, sw, sh); ctx.strokeRect(0, 0, sw, sh);
    ctx.fillStyle = C.ink; font(ctx, 38 * u); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(F.panelText.fir.head, 20 * u, 14 * u);
    ctx.fillStyle = C.mag; font(ctx, 30 * u); ctx.fillText(F.panelText.fir.mark, 20 * u + 90 * u, 20 * u);
    var rr = K.rng(3);
    for (i = 0; i < lines; i++) {
      var lp = K.clamp(p * (lines + 2) - i, 0, 1), lw = (0.45 + rr() * 0.5) * (sw - 40 * u) * lp;
      ctx.fillStyle = i === 3 ? C.violet : C.ink; ctx.globalAlpha = 0.85; ctx.fillRect(20 * u, 74 * u + i * 40 * u, lw, 14 * u);
    }
    ctx.globalAlpha = 1;
    if (p > 0.55) { ctx.fillStyle = C.violet; font(ctx, 30 * u); ctx.fillText(F.panelText.fir.ipc, 20 * u, sh - 54 * u); }
    ctx.translate(sw / 2, sh / 2); ctx.rotate(-0.5); ctx.globalAlpha = 0.14; ctx.fillStyle = C.mag; font(ctx, 100 * u); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(F.panelText.fir.mark, 0, 0); ctx.globalAlpha = 1;
    ctx.restore();
    if (p > 0.86) {
      var k = K.overshoot((p - 0.86) / 0.14); ctx.save(); ctx.translate(w * 0.78, h * 0.5); ctx.rotate(-0.14); ctx.scale(k, k);
      font(ctx, 44 * u); var tw = ctx.measureText(F.panelText.fir.stamp).width + 36 * u;
      ctx.strokeStyle = C.mag; ctx.lineWidth = 8 * u; ctx.strokeRect(-tw / 2, -34 * u, tw, 68 * u); ctx.fillStyle = C.mag; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(F.panelText.fir.stamp, 0, 3 * u); ctx.restore();
    }
  }
  /* ---------- 4 navigation ---------- */
  function dNav(ctx, w, h, t, a, E, u) {
    var p = a.p, i, k, pl, xy, kc = { police: C.cyan, hospital: C.mag, safe: C.gold }, kl = { police: 'P', hospital: 'H', safe: 'S' };
    ctx.strokeStyle = 'rgba(63,224,255,.16)'; ctx.lineWidth = 9 * u; ctx.lineCap = 'round';
    for (i = 0; i < ROADS.length; i++) { var r = ROADS[i]; ctx.beginPath(); ctx.moveTo(r[0] * w, r[1] * h); ctx.quadraticCurveTo(r[4] ? r[2] * w : r[0] * w, r[4] ? r[1] * h : r[3] * h, r[2] * w, r[3] * h); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,244,224,.08)'; ctx.lineWidth = 3 * u; for (i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(w * i / 8, 0); ctx.lineTo(w * i / 8, h); ctx.stroke(); }
    var me = K.mapXY(E.user.lat, E.user.lon), mx = me[0] * w, my = me[1] * h;
    var near = E.near;
    for (k in F.places) for (i = 0; i < F.places[k].length; i++) {
      pl = F.places[k][i]; xy = K.mapXY(pl[1], pl[2]); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(xy[0] * w, xy[1] * h, 15 * u, 0, TAU); ctx.fill();
      ctx.fillStyle = kc[k]; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(xy[0] * w, xy[1] * h, 11 * u, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
    for (i = 0; i < near.length; i++) {
      var n = near[i], q = K.mapXY(n.lat, n.lon), nx = q[0] * w, ny = q[1] * h, g = K.clamp((p - 0.18 - i * 0.2) / 0.22, 0, 1);
      if (g <= 0) continue;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo((mx + nx) / 2, Math.min(my, ny) - 36 * u, mx + (nx - mx) * g, my + (ny - my) * g * 1);
      ctx.setLineDash([]); ctx.strokeStyle = C.ink; ctx.lineWidth = 11 * u; ctx.stroke();
      ctx.setLineDash([16 * u, 12 * u]); ctx.lineDashOffset = -t * 60 * u; ctx.strokeStyle = kc[n.kind]; ctx.lineWidth = 6 * u; ctx.stroke(); ctx.setLineDash([]);
      if (g >= 1) {
        var k2 = K.overshoot(K.clamp((p - 0.4 - i * 0.2) / 0.15, 0, 1)); ctx.save(); ctx.translate(nx, ny); ctx.scale(k2, k2);
        ctx.fillStyle = kc[n.kind]; ctx.strokeStyle = C.ink; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.arc(0, 0, 20 * u, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.ink; font(ctx, 24 * u); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(kl[n.kind], 0, 2 * u);
        var lab = n.name + '  ' + K.fmtKm(n.km); font(ctx, 28 * u); var lw = ctx.measureText(lab).width + 24 * u, lx = nx > w * 0.6 ? -lw - 26 * u : 26 * u;
        ctx.fillStyle = C.ink; ctx.fillRect(lx, -22 * u, lw, 44 * u); ctx.fillStyle = C.paper; ctx.textAlign = 'left'; ctx.fillText(lab, lx + 12 * u, 2 * u); ctx.restore();
      }
    }
    if (p < 0.5 && a.state === 'run') { ctx.strokeStyle = C.gold; ctx.globalAlpha = 1 - p * 2; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.arc(mx, my, (40 + p * 2 * w * 0.35) , 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.strokeStyle = C.gold; ctx.globalAlpha = 0.6; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.arc(mx, my, (24 + (t * 18 % 22)) * u, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = C.gold; ctx.strokeStyle = C.ink; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.arc(mx, my, 17 * u, 0, TAU); ctx.fill(); ctx.stroke();
  }
  /* ---------- 5 argus ---------- */
  function dArgus(ctx, w, h, t, a, E, u) {
    var p = a.p, x0 = w * 0.07, y0 = h * 0.1, fw = w * 0.86, fh = h * 0.78, i;
    ctx.fillStyle = '#0c0624'; ctx.fillRect(x0, y0, fw, fh); ctx.strokeStyle = C.ink; ctx.lineWidth = 7 * u; ctx.strokeRect(x0, y0, fw, fh);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, fw, fh); ctx.clip();
    var gg = ctx.createLinearGradient(0, y0, 0, y0 + fh); gg.addColorStop(0, '#2B1F8F'); gg.addColorStop(1, '#12082B'); ctx.fillStyle = gg; ctx.globalAlpha = 0.6; ctx.fillRect(x0, y0, fw, fh); ctx.globalAlpha = 1;
    var people = [[0.3, 0.74, 1], [0.58, 0.7, 0.8]], pp;
    for (i = 0; i < people.length; i++) {
      pp = people[i]; var px = x0 + fw * pp[0] + Math.sin(t * 0.7 + i * 2) * 22 * u, py = y0 + fh * pp[1], s = pp[2] * u;
      ctx.fillStyle = '#6F5CFF'; ctx.beginPath(); ctx.arc(px, py - 118 * s, 26 * s, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(px - 34 * s, py - 84 * s); ctx.lineTo(px + 34 * s, py - 84 * s); ctx.lineTo(px + 26 * s, py); ctx.lineTo(px - 26 * s, py); ctx.closePath(); ctx.fill();
      var g1 = K.clamp((p - 0.15 - i * 0.2) / 0.2, 0, 1);
      if (g1 > 0) {
        ctx.strokeStyle = C.cyan; ctx.lineWidth = 5 * u; ctx.strokeRect(px - 50 * s, py - 150 * s, 100 * s * g1, 156 * s * g1);
        if (g1 >= 1) { font(ctx, 26 * u); ctx.fillStyle = C.cyan; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(F.panelText.argus.person, px - 50 * s, py - 154 * s); }
      }
      if (i === 0 && p > 0.5) { var fk = K.clamp((p - 0.5) / 0.15, 0, 1); ctx.strokeStyle = C.mag; ctx.lineWidth = 5 * u; ctx.strokeRect(px - 30 * s, py - 150 * s, 60 * s * fk, 62 * s * fk); if (fk >= 1) { font(ctx, 26 * u); ctx.fillStyle = C.mag; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(F.panelText.argus.face, px + 150 * s, py - 154 * s); } }
    }
    var vx = x0 + fw * 0.82, vy = y0 + fh * 0.72; ctx.fillStyle = '#3a2f9e'; ctx.fillRect(vx - 90 * u, vy - 56 * u, 180 * u, 56 * u); ctx.fillStyle = '#26196f'; ctx.fillRect(vx - 56 * u, vy - 86 * u, 112 * u, 32 * u);
    if (p > 0.7) {
      var pk = K.clamp((p - 0.7) / 0.15, 0, 1); ctx.strokeStyle = C.gold; ctx.lineWidth = 5 * u; ctx.strokeRect(vx - 40 * u, vy - 28 * u, 80 * u * pk, 22 * u);
      if (pk >= 1) { ctx.fillStyle = C.gold; for (i = 0; i < 5; i++) ctx.fillRect(vx - 32 * u + i * 15 * u, vy - 24 * u, 9 * u, 14 * u); font(ctx, 26 * u); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillStyle = C.gold; ctx.fillText(F.panelText.argus.plate, vx + 90 * u, vy - 90 * u); }
    }
    ctx.fillStyle = 'rgba(0,0,0,.16)'; for (i = 0; i < fh; i += 6 * u) ctx.fillRect(x0, y0 + i, fw, 2 * u);
    ctx.fillStyle = 'rgba(63,224,255,.12)'; ctx.fillRect(x0, y0 + ((t * 120) % fh), fw, 18 * u);
    ctx.restore();
    if (Math.floor(t * 1.6) % 2 === 0) { ctx.fillStyle = C.mag; ctx.beginPath(); ctx.arc(x0 + fw - 30 * u, y0 + 28 * u, 10 * u, 0, TAU); ctx.fill(); }
  }
  /* ---------- 6 ncrb ---------- */
  var HOT = [[0.28, 0.52, 0.2], [0.62, 0.34, 0.15], [0.78, 0.7, 0.18], [0.45, 0.8, 0.1]];
  function dNcrb(ctx, w, h, t, a, E, u) {
    var p = a.p, cols = 14, rows = 6, i, j, cw = w / cols, ch = (h - 12 * u) / rows;
    for (i = 0; i < cols; i++) for (j = 0; j < rows; j++) { ctx.fillStyle = (i + j) % 2 ? 'rgba(43,31,143,.55)' : 'rgba(27,20,100,.55)'; ctx.fillRect(i * cw + 3 * u, j * ch + 3 * u, cw - 6 * u, ch - 6 * u); }
    for (i = 0; i < HOT.length; i++) {
      var hh = HOT[i], g = K.clamp((p - i * 0.12) / 0.4, 0, 1) * (0.88 + 0.12 * Math.sin(t * 2.3 + i)), rad = Math.min(w, h * 2.4) * hh[2] * g;
      if (rad < 2) continue;
      var rg = ctx.createRadialGradient(hh[0] * w, hh[1] * h, 0, hh[0] * w, hh[1] * h, rad); rg.addColorStop(0, 'rgba(255,199,0,.95)'); rg.addColorStop(0.45, 'rgba(255,46,147,.7)'); rg.addColorStop(1, 'rgba(255,46,147,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(hh[0] * w, hh[1] * h, rad, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.5; ctx.fillStyle = K.dotPattern(ctx, C.ink); ctx.beginPath(); ctx.arc(hh[0] * w, hh[1] * h, rad, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
    var me = K.mapXY(E.user.lat, E.user.lon); ctx.fillStyle = C.gold; ctx.strokeStyle = C.ink; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.arc(me[0] * w, me[1] * h, 12 * u, 0, TAU); ctx.fill(); ctx.stroke();
    var lx = w * 0.7, ly = h - 52 * u, lg = ctx.createLinearGradient(lx, 0, lx + w * 0.26, 0); lg.addColorStop(0, C.cyan); lg.addColorStop(0.5, C.gold); lg.addColorStop(1, C.mag);
    ctx.fillStyle = C.ink; ctx.fillRect(lx - 8 * u, ly - 12 * u, w * 0.26 + 16 * u, 22 * u); ctx.fillStyle = lg; ctx.fillRect(lx, ly - 6 * u, w * 0.26, 10 * u);
    font(ctx, 28 * u); ctx.fillStyle = C.paper; ctx.textBaseline = 'bottom'; ctx.textAlign = 'left'; ctx.fillText(F.panelText.ncrb.low, lx, ly - 18 * u); ctx.textAlign = 'right'; ctx.fillText(F.panelText.ncrb.high, lx + w * 0.26, ly - 18 * u);
  }
  var DRAW = [dThreat, dFamily, dFir, dNav, dArgus, dNcrb];
  K.drawers = DRAW;

  /* ---------- Agent ---------- */
  function Agent(i, canvas) { this.i = i; this.c = canvas; this.ctx = canvas.getContext('2d'); this.state = 'idle'; this.p = 0; this.since = 0; this.w = 1076; this.h = 441; this.q = 1.5; this.vis = true; }
  Agent.prototype.size = function (w, h, q) { this.w = w; this.h = h; this.q = q; this.c.width = Math.round(w * q); this.c.height = Math.round(h * q); this.ctx.setTransform(q, 0, 0, q, 0, 0); };
  Agent.prototype.draw = function (t, E) {
    var ctx = this.ctx, w = this.w, h = this.h, u = U(w, h);
    ctx.save(); ctx.setTransform(this.q, 0, 0, this.q, 0, 0); base(ctx, w, h, t);
    if (this.state === 'idle') standby(ctx, w, h, t, u); else { DRAW[this.i](ctx, w, h, t, this, E, u); stampDone(ctx, w, h, this, u); }
    bar(ctx, w, h, this.p, F.agents[this.i].color, u); ctx.restore();
  };
  K.Agent = Agent;

  /* ---------- Runner: parallel or one by one, relative durations ---------- */
  function Runner(agents) { this.agents = agents; this.running = false; this.mode = 'par'; this.sched = []; this.t0 = 0; this.total = 0; this.onStart = null; this.onDone = null; this.onAll = null; this.durs = F.dur.slice(); }
  Runner.prototype.reset = function () { this.running = false; this.agents.forEach(function (a) { a.state = 'idle'; a.p = 0; a.since = 0; a._s = 0; }); };
  Runner.prototype.start = function (mode, unit, durs, now) {
    this.reset(); this.mode = mode; this.durs = durs || F.dur.slice(); this.t0 = now; var acc = 0, self = this; this.sched = [];
    this.agents.forEach(function (a, i) {
      var d = self.durs[i] * unit; self.sched.push(mode === 'par' ? [0, d] : [acc, acc + d]); acc += d;
    });
    this.total = mode === 'par' ? Math.max.apply(null, this.sched.map(function (s) { return s[1]; })) : acc; this.running = true; this.finished = false;
  };
  Runner.prototype.update = function (now) {
    var i, a, s, el = now - this.t0, all = true, p;
    for (i = 0; i < this.agents.length; i++) {
      a = this.agents[i];
      if (!this.running) { if (a.state === 'done') a.since = (a.since || 0) + 0; continue; }
      s = this.sched[i]; p = K.clamp((el - s[0]) / (s[1] - s[0]), 0, 1);
      if (el < s[0]) { a.state = 'idle'; a.p = 0; all = false; continue; }
      if (!a._s) { a._s = 1; if (this.onStart) this.onStart(i); }
      a.p = p; if (p < 1) { a.state = 'run'; all = false; } else { if (a.state !== 'done') { a.state = 'done'; a.since = 0; if (this.onDone) this.onDone(i); } }
    }
    if (this.running && all && !this.finished) { this.finished = true; this.running = false; if (this.onAll) this.onAll(); }
  };
  K.Runner = Runner;
  K.agentEnv = function () { return { intensity: 0.85, user: F.map.user, near: K.nearest() }; };
})();
