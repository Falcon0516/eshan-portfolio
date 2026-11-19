/* World: corridor items (nine doors plus three bonus objects), parallax background, door DOM. */
(function (A) {
  var W = 1442, H = 1090, FLOOR = 800, LEN = 7900, D = A.DATA;
  var items = [], stripImg = new Image(), stripReady = false, glows = {}, sky = null, floorG = null, stars = [], blds = [], cardsEl, bgc;
  stripImg.onload = function () { stripReady = true; };
  stripImg.src = 'assets/corridor_sea' + 'mless_mirrored.png';
  var picks = {}; /* card images that loaded */

  function rgb(h) { return parseInt(h.slice(1, 3), 16) + ',' + parseInt(h.slice(3, 5), 16) + ',' + parseInt(h.slice(5, 7), 16); }
  function glow(color) {
    if (glows[color]) return glows[color];
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(' + rgb(color) + ',1)'); r.addColorStop(0.4, 'rgba(' + rgb(color) + ',.35)'); r.addColorStop(1, 'rgba(' + rgb(color) + ',0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return (glows[color] = c);
  }
  function rnd(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function initProc() {
    var r = rnd(42), i; for (i = 0; i < 90; i++) stars.push({ x: r() * W, y: r() * 560, r: r() < 0.15 ? 3 : 2, ph: r() * 6.28 });
    var x = 0; while (x < 3200) { var w = 70 + r() * 120, h = 120 + r() * 300; blds.push({ x: x, w: w, h: h, s: (r() * 1000) | 0 }); x += w + 6 + r() * 14; }
    sky = bgc.createLinearGradient(0, 0, 0, FLOOR); sky.addColorStop(0, '#0D0B1E'); sky.addColorStop(0.6, '#2a1250'); sky.addColorStop(1, '#6b1f6e');
    floorG = bgc.createLinearGradient(0, FLOOR, 0, H); floorG.addColorStop(0, 'rgba(18,10,40,.97)'); floorG.addColorStop(1, 'rgba(7,5,18,1)');
  }

  /* ---- procedural door icons (fallback art, also the base under the supplied art) ---- */
  function icon(slug, c) {
    var a = c[0], b = c[1], d = c[2], s = '<svg viewBox="0 0 300 450" aria-hidden="true"><defs><linearGradient id="g' + slug + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + d + '"/><stop offset="1" stop-color="' + b + '" stop-opacity=".6"/></linearGradient></defs><rect width="300" height="450" fill="url(#g' + slug + ')"/>', i, o = '';
    switch (slug) {
      case 'saathi': for (i = 0; i < 9; i++) o += '<rect class="wv" style="animation-delay:' + (i * 0.11) + 's" x="' + (46 + i * 24) + '" y="110" width="14" height="150" fill="' + (i % 2 ? b : a) + '"/>'; break;
      case 'argus': o = '<path class="sweep" d="M150 120 L40 330 L260 330Z" fill="' + a + '" opacity=".22"/><circle cx="150" cy="120" r="30" fill="' + a + '"/><circle cx="150" cy="120" r="12" fill="' + d + '"/>'; break;
      case 'soil-and-toil': o = '<ellipse cx="150" cy="300" rx="100" ry="40" fill="' + b + '"/><path class="bob" d="M150 290 C150 220 150 190 150 160" stroke="' + a + '" stroke-width="10" fill="none"/><path class="bob" d="M150 190 C100 190 90 150 110 130 C150 130 150 160 150 190Z M150 170 C200 170 215 130 195 112 C155 112 150 140 150 170Z" fill="' + a + '"/>'; break;
      case 'axiom': o = '<circle class="spin" cx="150" cy="190" r="86" fill="none" stroke="' + a + '" stroke-width="10" stroke-dasharray="40 14"/><circle cx="150" cy="190" r="48" fill="none" stroke="' + b + '" stroke-width="8"/><rect x="132" y="172" width="36" height="36" fill="' + d + '"/>'; break;
      case 'personaforge': o = '<rect class="bob" x="80" y="250" width="140" height="44" fill="' + a + '"/><rect class="bob" x="100" y="200" width="100" height="44" fill="' + b + '"/><rect class="bob" x="116" y="150" width="68" height="44" fill="' + d + '"/><rect x="70" y="300" width="160" height="10" fill="#000" opacity=".3"/>'; break;
      case 'kavach': o = '<path class="bob" d="M150 90 L230 120 L225 240 C220 290 180 320 150 335 C120 320 80 290 75 240 L70 120Z" fill="' + b + '" stroke="' + a + '" stroke-width="10"/><path d="M150 130 L200 150 L196 235 C190 262 170 278 150 290Z" fill="' + a + '" opacity=".5"/>'; break;
      case 'pro-rover': o = '<rect class="bob" x="70" y="200" width="160" height="70" fill="' + a + '"/><rect x="100" y="164" width="70" height="40" fill="' + b + '"/><circle cx="96" cy="288" r="28" fill="' + d + '" stroke="' + b + '" stroke-width="6"/><circle cx="204" cy="288" r="28" fill="' + d + '" stroke="' + b + '" stroke-width="6"/><path d="M230 232 L280 232" stroke="' + a + '" stroke-width="6" stroke-dasharray="8 8"/>'; break;
      case 'usb-tcp-bridge': o = '<rect x="110" y="110" width="80" height="120" fill="' + b + '"/><rect x="124" y="90" width="52" height="30" fill="' + a + '"/><path class="trace" d="M60 300 H120 V250 M240 300 H180 V250 M150 250 V340" stroke="' + a + '" stroke-width="6" fill="none" stroke-dasharray="14 10"/>'; break;
      case 'verifarm': for (i = 0; i < 7; i++) o += '<path class="bob" style="animation-delay:' + (i * 0.2) + 's" d="M' + (60 + i * 30) + ' 330 V200 m0 30 l-12 -16 m12 16 l12 -16 m-12 -14 l-12 -16 m12 16 l12 -16" stroke="' + a + '" stroke-width="5" fill="none"/>'; o += '<rect x="80" y="320" width="140" height="50" fill="' + b + '"/>'; break;
      default: o = '<circle class="spin" cx="150" cy="200" r="70" fill="none" stroke="' + a + '" stroke-width="8" stroke-dasharray="30 12"/><ellipse cx="150" cy="200" rx="28" ry="70" fill="none" stroke="' + b + '" stroke-width="5"/><path d="M80 200H220" stroke="' + b + '" stroke-width="5"/>';
    }
    return s + o + '</svg>';
  }

  function termify(t) {
    var keys = Object.keys(D.terms).sort(function (x, y) { return y.length - x.length; }), out = t.replace(/&/g, '&amp;');
    keys.forEach(function (k) { out = out.replace(new RegExp('(^|[^A-Za-z])(' + k + ')(?![A-Za-z])'), '$1<span class="term" tabindex="0" data-tip="' + D.terms[k].replace(/"/g, '&quot;') + '">$2</span>'); });
    return out;
  }
  A.termify = termify;

  function mkItem(o) {
    var el = document.createElement('div'); el.className = 'item' + (o.extra ? ' extra' : ''); el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', o.label);
    el.style.setProperty('--c1', o.c[0]); el.style.setProperty('--c', o.c[0]); el.style.transformOrigin = '50% 100%';
    var pic = o.pic ? '<img class="pic" alt="" src="' + o.pic + '" onerror="this.style.display=\'none\'">' : '';
    el.innerHTML = '<div class="glow" style="background:radial-gradient(closest-side,' + o.c[0] + ',transparent)"></div><div class="panel"><div class="art">' + icon(o.slug || 'x', o.c) + '</div>' + pic + '<div class="plate"><h3>' + o.title + '</h3><div class="stat">' + (o.stat ? termify(o.stat) : '') + '</div></div><div class="star" aria-hidden="true">&#9733;</div></div>';
    cardsEl.appendChild(el); return el;
  }

  A.world = {
    LEN: LEN, W: W, H: H, FLOOR: FLOOR, items: items,
    doorX: function (i) { return 900 + i * 640; },
    build: function () {
      cardsEl = document.getElementById('cards'); bgc = document.getElementById('bg').getContext('2d'); initProc();
      var gold = ['#FFC857', '#8B5CFF', '#241043'];
      items.push({ kind: 'reg', id: 'reg', x: 560, z: 0.8, el: mkItem({ title: 'DESIGN REGISTRATION', c: ['#FFC857', '#7a4cff', '#1b1038'], extra: 1, label: 'Design Registration poster' }) });
      D.cards.forEach(function (c, i) { items.push({ kind: 'door', id: c.slug, i: i, x: A.world.doorX(i), z: 1, c: c.c, data: c, el: mkItem({ slug: c.slug, title: c.title, stat: c.stat, c: c.c, pic: 'assets/cards/' + c.slug + '.webp', label: 'Open ' + c.title }) }); });
      items.push({ kind: 'hof', id: 'hof', x: 6700, z: 0.9, el: mkItem({ title: 'HALL OF FAME', c: gold, extra: 1, pic: 'assets/hall_of_fame_poster.png', label: 'Hall of Fame' }) });
      items.push({ kind: 'port', id: 'port', x: 7350, z: 0.8, el: mkItem({ title: D.portfolio.label, stat: D.portfolio.note, c: ['#3FE6FF', '#FF3FA4', '#0D0B1E'], extra: 1, label: 'Portfolio website, needs internet' }) });
      items.forEach(function (it, k) { it.el.dataset.k = k; it.vis = false; it.prox = 0; it.lift = 0; it.rot = 0; });
    },
    /* nearest interactive item within reach */
    nearest: function (hx) {
      var best = -1, bd = 1e9, k, d;
      for (k = 0; k < items.length; k++) { d = Math.abs(items[k].x - hx); if (d < bd) { bd = d; best = k; } }
      return bd <= (items[best].kind === 'door' ? 140 : 160) ? best : -1;
    },
    layout: function (camC, visW, near, t, tilt, dt) {
      var k, it, nx, half = visW / 2 + 260, a, lerp = 1 - Math.exp(-9 * dt);
      for (k = 0; k < items.length; k++) {
        it = items[k]; nx = it.x - camC + W / 2;
        var on = nx > W / 2 - half && nx < W / 2 + half;
        if (on !== it.vis) { it.vis = on; it.el.style.display = on ? 'block' : 'none'; }
        if (!on) continue;
        var isNear = k === near; it.prox += ((isNear ? 1 : 0) - it.prox) * lerp;
        a = (W / 2 - nx) / (W / 2) * 15; a = a > 22 ? 22 : a < -22 ? -22 : a; if (isNear) a = a * (1 - it.prox) + tilt.x * 11 * it.prox;
        var bob = Math.sin(t * 1.4 + k * 1.7) * 5, lift = -26 * it.prox, sc = it.z * (1 + 0.07 * it.prox);
        it.el.style.transform = 'translate3d(' + (nx - 150).toFixed(1) + 'px,' + (360 + bob + lift + (it.kind === 'door' ? 0 : 20)).toFixed(1) + 'px,' + (it.kind === 'door' ? 0 : -40) + 'px) rotateY(' + a.toFixed(2) + 'deg) rotateX(' + (isNear ? (-tilt.y * 7 * it.prox).toFixed(2) : 0) + 'deg) scale(' + sc.toFixed(3) + ')';
        var cl = it.el.classList; cl.toggle('near', isNear); cl.toggle('dim', near >= 0 && !isNear);
      }
    },
    setOpen: function (k, on) { items[k].el.classList.toggle('open', on); },
    setVisited: function (slug) { items.forEach(function (it) { if (it.id === slug) it.el.classList.add('visited'); }); },
    glow: glow,
    drawBG: function (camC, t, S) {
      var c = bgc, k, i, x, s, nx;
      c.fillStyle = sky; c.fillRect(0, 0, W, FLOOR + 4);
      /* stars + moon (far, slow) */
      for (k = 0; k < stars.length; k++) { s = stars[k]; x = (((s.x - camC * 0.06) % W) + W) % W; c.globalAlpha = 0.45 + 0.45 * Math.sin(t * 1.6 + s.ph); c.fillStyle = '#e9e3ff'; c.fillRect(x | 0, s.y | 0, s.r, s.r); }
      c.globalAlpha = 0.55; c.drawImage(glow('#FF3FA4'), 980 - ((camC * 0.03) % 400), 70, 340, 340); c.globalAlpha = 1;
      /* mid strip (supplied) or procedural skyline */
      if (stripReady) {
        var sc = H / 1080, dw = 7680 * sc, off = (((camC * 0.38) % dw) + dw) % dw;
        for (x = -off; x < W; x += dw) c.drawImage(stripImg, x, 0, dw, H);
      } else {
        var off2 = (((camC * 0.35) % 3200) + 3200) % 3200;
        for (var rep = -1; rep < 2; rep++) for (k = 0; k < blds.length; k++) {
          var b = blds[k], bx = b.x - off2 + rep * 3200; if (bx > W || bx + b.w < 0) continue;
          c.fillStyle = k % 3 ? '#1a1038' : '#241450'; c.fillRect(bx, FLOOR - b.h, b.w, b.h);
          c.fillStyle = k % 2 ? '#3FE6FF' : '#FF3FA4'; for (i = 0; i < 9; i++) { if (((b.s >> i) & 3) === 0) c.fillRect(bx + 10 + (i % 3) * (b.w / 3.4), FLOOR - b.h + 20 + ((i / 3) | 0) * 40, 8, 12); }
        }
      }
      c.fillStyle = 'rgba(255,63,164,' + (0.035 + 0.025 * Math.sin(t * 2.1)) + ')'; c.fillRect(0, 300, W, 400);
      /* street lamps (parallax 1.0, between doors) */
      for (k = 0; k < 9; k++) { nx = A.world.doorX(k) + 320 - camC + W / 2; if (nx < -60 || nx > W + 60) continue; c.fillStyle = '#15102b'; c.fillRect(nx - 5, 330, 10, FLOOR - 330); c.fillRect(nx - 5, 330, 46, 8); c.globalAlpha = 0.85 + 0.1 * Math.sin(t * 3 + k * 2); c.drawImage(glow(k % 2 ? '#3FE6FF' : '#FF3FA4'), nx + 4, 300, 72, 72); c.globalAlpha = 1; }
      /* floor: reflective tiles in perspective */
      c.fillStyle = floorG; c.fillRect(0, FLOOR, W, H - FLOOR);
      c.strokeStyle = 'rgba(63,230,255,.22)'; c.lineWidth = 2; c.beginPath();
      for (i = 1; i < 9; i++) { var yy = FLOOR + i * i * 3.3; c.moveTo(0, yy); c.lineTo(W, yy); }
      var offx = ((camC % 160) + 160) % 160; for (i = -2; i < 12; i++) { var bx2 = i * 160 - offx + 1; c.moveTo(W / 2 + (bx2 - W / 2) * 0.22, FLOOR); c.lineTo(bx2, H); }
      c.stroke();
      /* light spill from every visible item, brighter when near (S.near) */
      for (k = 0; k < items.length; k++) { var it = items[k]; if (!it.vis) continue; nx = it.x - camC + W / 2; c.globalAlpha = 0.22 + 0.6 * it.prox; c.drawImage(glow((it.c || ['#FFC857'])[0]), nx - 260, FLOOR - 10, 520, 150); }
      c.globalAlpha = 1;
    }
  };
})(window.A = window.A || {});
