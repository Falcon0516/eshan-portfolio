/* Present Mode: seven camera positions on one stage. Each scene autoplays a 6 to 12 s beat on entry. */
(function () {
  var F = window.FACTS, $ = K.$, world = $('#world'), grid = $('#grid'), trig = $('#trig'), shield = $('#shield'), sosBtn = $('#sosBtn');
  var CX = K.GRID.x + 1200, CY = K.GRID.y + 800; /* page centre = SOS hub */
  var DEFS = [
    { cam: { cx: 2250, cy: 1780, w: 2100, rot: 0 }, sh: { x: 1290, y: 1930, w: 380 }, pos: 'tl' },
    { cam: { cx: 3600, cy: 1100, w: 2500, rot: 0 }, sh: { x: 2420, y: 1250, w: 330 }, pos: 'tl' },
    { cam: { cx: 2000, cy: 1200, w: 3300, rot: 0 }, sh: { x: 440, y: 1500, w: 320 }, pos: 'tl' },
    { cam: { cx: 2400, cy: 1511, w: 4200, rot: -1.2 }, sh: { x: 720, y: 1700, w: 360 }, pos: 'bl' },
    { cam: { cx: 2800, cy: 1205, w: 1500, rot: 0 }, sh: { x: 2090, y: 1290, w: 250 }, pos: 'tl' },
    { cam: { cx: 3800, cy: 2100, w: 2000, rot: 0 }, sh: { x: 2830, y: 2210, w: 320 }, pos: 'tl' },
    { cam: { cx: 2400, cy: 1350, w: 3800, rot: 1.4 }, sh: { x: 400, y: 1850, w: 420 }, pos: 'tl' }
  ];
  var hHead = $('#hHead'), hCap = $('#hCap'), hTk = $('#hTk'), hcap = $('#hcap'), dots = $('#dots'), stream = $('#stream'), gantt = $('#gantt');
  var S = K.scene = { i: -1, n: DEFS.length, first: true }, prevI = -1;

  /* ---------- flow engine instance for the page burst (grid-local coordinates) ---------- */
  var fxc = $('#fx'), fctx = fxc.getContext('2d'), flow = new K.Flow({ max: 220 });
  var ENTRY = [[1100, 520], [1300, 515], [1120, 780], [1280, 790], [1100, 1075], [1300, 1085]], fpaths = [];
  ENTRY.forEach(function (e, i) {
    var sx = 1200, sy = 800, mx = (sx + e[0]) / 2, my = (sy + e[1]) / 2, nx = -(e[1] - sy), ny = e[0] - sx, nl = Math.hypot(nx, ny) || 1, k = 40 * (i % 2 ? 1 : -1);
    fpaths.push(flow.addPath({ id: i, pts: [sx, sy, mx + nx / nl * k, my + ny / nl * k, mx + nx / nl * k * 0.4, my + ny / nl * k * 0.4, e[0], e[1]], rate: 0, speed: 0.55, color: F.agents[i].color, w: 6, size: 9, drawn: 0 }));
  });
  flow.onArrive = function (p) { var a = K.wAgents[p.id]; a.flash = 1; };
  flow.onCut = function (p, x, y) { K.audio.tick(); };
  S.flow = flow; S.fpaths = fpaths;
  var fxOn = false, fade = 1, pulseUntil = 0;

  /* ---------- HUD ---------- */
  function hud(i) {
    var s = F.scenes[i]; hcap.setAttribute('data-pos', DEFS[i].pos); hcap.classList.remove('in'); void hcap.offsetWidth; hcap.classList.add('in');
    hHead.textContent = s.head; hCap.innerHTML = ''; hTk.innerHTML = ''; hTk.classList.remove('on');
    K.after(380, function () { hCap.innerHTML = K.rich(s.cap); if (K.reduced) { hTk.innerHTML = K.rich(s.tk); hTk.classList.add('on'); } });
    K.after(1300, function () { hTk.innerHTML = K.rich(s.tk); hTk.classList.add('on'); });
    K.$$('button', dots).forEach(function (b, n) { b.classList.toggle('cur', n === i); b.setAttribute('aria-current', n === i ? 'step' : 'false'); });
    K.notes.set(i);
  }
  F.scenes.forEach(function (s, n) { var b = K.el('button'); b.setAttribute('aria-label', 'Scene ' + (n + 1) + ': ' + s.head); b.setAttribute('data-int', ''); b.addEventListener('click', function (e) { e.stopPropagation(); S.go(n); }); dots.appendChild(b); });

  function placeShield(d, instant) {
    var k = d.w / 400; shield.style.transition = instant ? 'none' : ''; shield.style.transform = 'translate(' + d.x + 'px,' + d.y + 'px) scale(' + k + ')';
  }
  function ensureDone() { K.wAgents.forEach(function (a) { if (a.state !== 'done') { a.state = 'done'; a.p = 1; a.since = 1; } }); K.runner.running = false; }

  /* ---------- scene 1: quiet night ---------- */
  var woman = $('#woman');
  function beat1() {
    woman.classList.remove('walk', 'stopped'); woman.style.transition = 'none'; woman.style.transform = 'translate(1500px,1798px) scale(1.25)'; void woman.offsetWidth;
    woman.classList.add('walk'); woman.style.transition = K.reduced ? 'none' : 'transform 5.2s linear'; woman.style.transform = 'translate(2250px,1798px) scale(1.25)';
    K.after(5300, function () {
      woman.classList.remove('walk'); woman.classList.add('stopped');
      K.burst(0, 2460, 1930, 460, 'TAP!', 2200); K.audio.pow(); K.shake(8, 160);
      var rp = K.el('div', 'ripple'); rp.style.left = '2421px'; rp.style.top = '2024px'; $('#bursts').appendChild(rp); K.after(1800, function () { rp.remove(); });
      shield.classList.add('beat');
    });
    K.after(7800, function () { shield.classList.remove('beat'); });
  }
  /* ---------- scene 2: five ways ---------- */
  function beat2() {
    trig.classList.remove('go'); void trig.offsetWidth; trig.classList.add('go');
    var ids = ['sos', 'voice', 'shake', 'vol', 'walk', 'keypad'];
    ids.forEach(function (id, n) { K.after(2000 + n * 1200, function () { var e = $('#tp-' + id); e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); K.audio.tick(); K.after(1100, function () { e.classList.remove('on'); }); }); });
    K.after(9400, function () { $('#tp-sos').classList.add('hint'); });
  }
  /* ---------- scene 3: the page explodes ---------- */
  var shardsEl = $('#shards');
  function makeShards() {
    var r = K.rng(Date.now() & 1023), i; shardsEl.innerHTML = '';
    for (i = 0; i < 12; i++) {
      var a = i / 12 * Math.PI * 2 + r() * 0.4, d = 700 + r() * 900, sz = 260 + r() * 360, el = K.el('div', 'shard'), pts = [[r() * 60, r() * 60], [sz - r() * 80, r() * 120], [r() * sz, sz - r() * 40]].map(function (p) { return p[0].toFixed(0) + ',' + p[1].toFixed(0); }).join(' ');
      el.style.cssText = 'left:' + (CX - sz / 2) + 'px;top:' + (CY - sz / 2) + 'px;width:' + sz + 'px;height:' + sz + 'px;--tx:' + (Math.cos(a) * d).toFixed(0) + 'px;--ty:' + (Math.sin(a) * d * 0.7).toFixed(0) + 'px;--rot:' + ((r() - 0.5) * 540).toFixed(0) + 'deg;';
      el.innerHTML = '<svg viewBox="0 0 ' + sz.toFixed(0) + ' ' + sz.toFixed(0) + '" width="' + sz + '" height="' + sz + '"><polygon points="' + pts + '" fill="' + (i % 3 === 0 ? '#FF2E93' : i % 3 === 1 ? '#FFC700' : '#FFF4E0') + '" stroke="#12082B" stroke-width="9" stroke-linejoin="round"/></svg>';
      shardsEl.appendChild(el);
    }
    void shardsEl.offsetWidth; shardsEl.classList.add('fly');
  }
  K.impact = function () { var im = $('#impact'); im.classList.remove('go'); void im.offsetWidth; im.classList.add('go'); var hb = $('#halfBloom'); hb.classList.remove('go'); void hb.offsetWidth; hb.classList.add('go'); };
  function startRun(unit) {
    var now = performance.now(); fade = 1; fxOn = true;
    K.runner.onStart = function (i) { fpaths[i].drawn = 1; fpaths[i].rate = 7; flow.burst(fpaths[i], 6); };
    K.runner.onDone = function (i) { fpaths[i].rate = 0; K.audio.chime(); K.wAgents[i].flash = 1; };
    K.runner.onAll = function () { $('#grid').classList.add('slow'); K.after(2600, function () { fxOn = true; }); fade = 1; };
    $('#grid').classList.remove('slow'); K.runner.start('par', unit, null, now);
    fpaths.forEach(function (p) { p.drawn = 1; p.rate = 7; });
    K.after(300, function () { K.audio.chime(); });
  }
  function beat3(full) {
    sosBtn.classList.remove('hot'); grid.classList.remove('open', 'dim', 'focus');
    if (!full) { grid.classList.add('open'); trig.classList.add('shattered'); sosBtn.style.transition = 'none'; sosBtn.style.transform = 'translate(' + (CX - 100) + 'px,' + (CY - 100) + 'px)'; world.classList.add('sosOn'); startRun(3200); return; }
    sosBtn.style.transition = 'none'; sosBtn.style.transform = 'translate(3000px,900px) scale(.6)'; void sosBtn.offsetWidth; world.classList.add('sosOn');
    sosBtn.style.transition = ''; sosBtn.style.transform = 'translate(' + (CX - 100) + 'px,' + (CY - 100) + 'px)';
    K.runner.reset();
    K.after(420, function () {
      K.impact(); K.shake(30, 420); K.audio.pow(); trig.classList.add('shattered'); makeShards(); sosBtn.classList.add('hot');
      K.burst(1, CX, CY, 1500, 'POW!', 1500, -8);
    });
    K.after(650, function () { grid.classList.add('open'); });
    K.after(1500, function () { startRun(6500); });
  }
  /* ---------- scene 4: parallel vs one by one ---------- */
  function beat4() {
    ensureDone(); grid.classList.add('open', 'dim'); trig.classList.add('shattered'); world.classList.add('sosOn'); grid.classList.add('slow');
    var tot = F.dur.reduce(function (a, b) { return a + b; }, 0), mx = Math.max.apply(null, F.dur), seg = '', par = '', acc = 0;
    F.dur.forEach(function (d, i) { var short = ['threat', 'family', 'fir', 'nav', 'argus', 'ncrb'][i]; seg += '<i style="--c:' + F.agents[i].color + ';--w:' + (d / tot * 100).toFixed(2) + '%;--d:' + (acc / tot * 2.6).toFixed(2) + 's"><em>' + short + '</em></i>'; acc += d; par += '<i style="--c:' + F.agents[i].color + ';--w:' + (d / tot * 100).toFixed(2) + '%;--d:2.9s"></i>'; });
    gantt.hidden = false; gantt.classList.remove('go'); gantt.innerHTML = '<div class="g-stamp">' + F.ui.illustrative + '</div><div class="g-row"><span class="g-lab">One by one</span><div class="g-lane seq">' + seg + '</div></div><div class="g-row"><span class="g-lab">In parallel</span><div class="g-lane par">' + par + '<u style="left:' + (mx / tot * 100).toFixed(2) + '%"><s>slowest</s></u></div></div>';
    void gantt.offsetWidth; gantt.classList.add('go');
    K.after(2200, function () { K.burst(2, CX + 560, CY + 230, 340, 'WHOOSH', 2400, 6); K.audio.pow(); });
  }
  /* ---------- scene 5: command center ---------- */
  var s5t0 = 0;
  function beat5() {
    ensureDone(); grid.classList.add('open', 'dim', 'focus'); trig.classList.add('shattered'); world.classList.remove('sosOn'); stream.hidden = false; stream.innerHTML = '';
    var a = K.wAgents[3]; a.state = 'run'; a.p = 0; s5t0 = performance.now();
    F.thoughts.forEach(function (t, n) {
      K.after(900 + n * 1050, function () {
        var b = K.el('div', 'th'); b.innerHTML = '<code>' + K.rich(t) + '</code>'; stream.appendChild(b); K.audio.tick();
        while (stream.children.length > 5) stream.removeChild(stream.firstChild);
        K.$$('.th', stream).forEach(function (e, k, all) { e.style.opacity = (0.35 + 0.65 * (k + 1) / all.length).toFixed(2); });
      });
    });
    var ch = K.el('div', 'cchips'); ch.innerHTML = F.commandChips.map(function (c) { return '<span class="chip">' + K.rich(c) + '</span>'; }).join(''); stream.appendChild(ch);
  }
  /* ---------- scene 6: no smartphone ---------- */
  var p6 = $('#p6'), p6c, p6ctx, p6flow, p6on = false, p6paths = [];
  (function buildP6() {
    var L = F.keypad.labels;
    p6.innerHTML = '<div class="p6-ink"></div><div class="p6-paper"></div><canvas id="p6fx" width="1260" height="940"></canvas>' +
      '<div class="p6-phone"><img src="assets/feature_phone.png" alt="Keypad phone"><div class="ring rg1"></div><div class="ring rg2"></div></div>' +
      '<div class="p6-lab missed">' + L.missed + '</div>' +
      '<div class="p6-node n1"><b>Tethered phone</b><span class="chip">' + K.rich('Phone Link') + '</span></div>' +
      '<div class="p6-node n2"><b>' + L.queue + '</b><div class="qrows"><i></i><i></i><i></i></div></div>' +
      '<div class="p6-node n3"><b>' + L.bridge + '</b><span class="chip">' + K.term('audit', F.keypad.pollSrc) + '</span><div class="poll"><u></u></div></div>' +
      '<div class="p6-node n4"><b>' + L.voice + '</b><div class="vw">' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return '<i style="--i:' + n + '"></i>'; }).join('') + '</div></div>' +
      '<div class="p6-say"><code id="p6say"></code></div>';
    p6c = $('#p6fx'); p6ctx = p6c.getContext('2d'); p6flow = new K.Flow({ max: 90 });
    [[440, 300, 500, 200, 520, 120, 560, 130, '#3FE0FF'], [800, 170, 860, 200, 880, 250, 930, 290, '#FFC700'], [930, 360, 960, 450, 760, 430, 700, 470, '#FF2E93'], [700, 560, 780, 600, 860, 600, 940, 600, '#FFF4E0']].forEach(function (q, n) {
      p6paths.push(p6flow.addPath({ id: n, pts: q.slice(0, 8), rate: 0, speed: 0.42, color: q[8], w: 7, size: 9 }));
    });
    p6flow.onArrive = function (p) { if (p.id === 3 && !p6.said) { p6.said = 1; K.type($('#p6say'), F.keypad.brief, 28); } };
  })();
  function beat6() {
    ensureDone(); grid.classList.add('open', 'dim'); trig.classList.add('shattered'); world.classList.remove('sosOn'); p6.classList.remove('go'); void p6.offsetWidth; p6.classList.add('go'); p6.said = 0; $('#p6say').textContent = ''; p6on = true;
    p6paths.forEach(function (p) { p.rate = 0; });
    K.after(900, function () { K.burst(2, 3690, 1860, 330, 'RING!', 1800, -8); K.audio.tick(); $('#p6').classList.add('ringing'); });
    K.after(2600, function () { p6paths[0].rate = 2.2; });
    K.after(3600, function () { p6paths[1].rate = 2.2; });
    K.after(4600, function () { p6paths[2].rate = 2.2; });
    K.after(5600, function () { p6paths[3].rate = 2.2; K.audio.chime(); });
  }
  /* ---------- scene 7: back page ---------- */
  function beat7() { ensureDone(); grid.classList.add('open', 'dim'); trig.classList.add('shattered'); world.classList.remove('sosOn'); K.after(700, function () { K.reality.show(true); K.audio.pow(); }); }

  /* ---------- state classes ---------- */
  function setState(i) {
    world.setAttribute('data-scene', i + 1); gantt.hidden = i !== 3; stream.hidden = i !== 4; if (i !== 4) stream.innerHTML = '';
    if (i < 2) { trig.classList.remove('shattered'); grid.classList.remove('open', 'dim', 'focus', 'slow'); world.classList.remove('sosOn'); }
    if (i === 1) trig.classList.add('show'); else if (i === 0) trig.classList.remove('show', 'go');
    if (i !== 2 && i !== 3 && i !== 4) grid.classList.remove('focus'); if (i !== 4) grid.classList.remove('focus');
    if (i !== 6) K.reality.hide();
    p6on = i === 5; if (i !== 5) p6.classList.remove('go', 'ringing');
    if (i > 2) { trig.classList.add('shattered'); trig.classList.add('show'); }
    fxOn = i === 2 || i === 3;
  }

  S.go = function (i, opts) {
    i = K.clamp(i, 0, DEFS.length - 1); opts = opts || {}; var dir = i >= S.i ? 1 : -1, was = S.i;
    if (i === S.i && !opts.replay) return;
    K.clearTimers(); shield.classList.remove('beat'); K.clearBursts(); K.$$('.ripple').forEach(function (e) { e.remove(); });
    var d = DEFS[i], now = performance.now();
    S.i = i; setState(i); hud(i);
    if ((was === 0 && i === 1) || i === 6 || was === 6 || (was === 1 && i === 0)) K.pageTurn();
    K.stage.go(d.cam, opts.instant || S.first ? 0 : 1250, now); placeShield(d.sh, opts.instant || S.first);
    if (opts.hash !== false) { try { history.replaceState(null, '', '#scene-' + (i + 1)); } catch (e) { } }
    var fresh = was === -1 || opts.replay;
    switch (i) {
      case 0: beat1(); break;
      case 1: beat2(); break;
      case 2: beat3(was === 1 || !!opts.replay); break;
      case 3: beat4(); break;
      case 4: beat5(); break;
      case 5: beat6(); break;
      case 6: beat7(); break;
    }
    S.first = false; prevI = was;
  };
  S.next = function () { if (S.i < DEFS.length - 1) S.go(S.i + 1); };
  S.prev = function () { if (S.i > 0) S.go(S.i - 1); };
  S.replay = function () { var i = S.i; K.runner.reset(); S.go(i, { replay: true, instant: false }); if (i === 2) { /* replay explosion from scratch */ } };
  K.pageTurn = function () { var t = $('#turn'); if (K.reduced) return; t.classList.remove('go'); void t.offsetWidth; t.classList.add('go'); };

  /* user disturbance: drag across a route to cut it (scene 3) */
  S.cut = function (px, py, now) {
    if (S.i !== 2) return; var w = K.stage.toWorld(px, py), p = flow.cut(w[0] - K.GRID.x, w[1] - K.GRID.y, 90, 1800, now);
    if (p) { K.audio.tick(); K.shake(4, 80); }
  };

  /* ---------- per-frame ---------- */
  var lastFlash = 0;
  S.tick = function (now, dt) {
    var i, a, st = K.stage;
    /* agents: cull by camera, advance stamp timers */
    for (i = 0; i < K.wAgents.length; i++) {
      a = K.wAgents[i]; if (a.state === 'done') a.since += dt; if (a.flash > 0) a.flash = Math.max(0, a.flash - dt * 2.5);
      a.vis = st.sees(a.rect[0], a.rect[1], a.rect[2], a.rect[3]);
    }
    if (S.i === 4) { var n = K.wAgents[3]; if (n.state === 'run') { n.p = Math.min(1, (now - s5t0) / 3400); if (n.p >= 1) { n.state = 'done'; n.since = 0; } } }
    /* flow fx on the page */
    if (S.i === 2 || S.i === 3) {
      fctx.clearRect(0, 0, 2400, 1600); flow.update(dt, now); var any = flow.parts.length > 0 || fpaths.some(function (p) { return p.drawn > 0; });
      if (K.runner.finished && !K.runner.running && S.i === 2) { fade = Math.max(0.0, fade - dt * 0.35); }
      if (any && fade > 0) { fctx.globalAlpha = S.i === 3 ? 0.35 : Math.max(0.25, fade); flow.draw(fctx, now); fctx.globalAlpha = 1; }
    } else if (fxOn === false && fctx) { /* nothing */ }
    if (p6on) {
      p6ctx.clearRect(0, 0, 1260, 940); p6flow.update(dt, now); p6flow.draw(p6ctx, now);
    }
  };
  S.drawAgents = function (now, t, vis) {
    var i, a, env = K.env;
    for (i = 0; i < K.wAgents.length; i++) {
      a = K.wAgents[i]; if (!a.vis || !vis) continue;
      if (a.state === 'idle' && (Math.floor(now / 50) % 2)) continue; /* idle panels at 30 fps */
      a.draw(t, env); K.winEls[i].classList.toggle('flash', a.flash > 0.5);
    }
  };
})();
