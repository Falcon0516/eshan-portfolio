/* Eight Present scenes. Each: cam pose, start() sets static start state, beat() autoplays 6-12 s. */
(function () {
  var F = PF.FACTS, S = PF.stage, C = PF.compiler, $ = function (s) { return document.querySelector(s); }, TL = PF.tl;
  var P2 = ['role_study', 'tone_play', 'g_ground', 'lang_user'];
  var P3 = ['id_forge', 'role_study', 'tone_play', 'lang_user', 'kn_faq', 'g_ground', 'ref_harm', 'fb_idk', 'fmt_md', 'ch_chat', 'ex_hi'];
  var STEPS5 = ['role_study', 'g_ground', 'fb_idk', 'lang_user', 'kn_faq', 'len_short', 'ref_harm'];
  var flows = {};
  function mkFlow(name, cls, o) {
    if (flows[name]) return flows[name]; var p = $('#slips'); var f = new PF.Flow({ parent: o && o.parent || $('#world'), make: function () { var e = document.createElement('i'); e.className = cls; return e; }, noRot: o && o.noRot, init: o && o.init });
    PF.flows.push(f); flows[name] = f; return f;
  }
  function reset(o) { // common static state
    o = o || {}; S.hideAll(); S.clearStrings(); S.say(''); S.notesShow(!!o.notes); S.face(o.face || 'happy');
    var w = S.world.classList; w.toggle('s-panels', !!o.panels); w.toggle('s-meter', !!o.meter); w.toggle('s-wheel', !!o.wheel); w.toggle('s-belt', !!o.belt); w.toggle('s-zap', false);
    $('#znote') && $('#znote').remove(); S.forge.firstChild.classList.toggle('wobble', !!o.wobble);
    $('#receipt').classList.toggle('blank', true); $('#r-rows').innerHTML = ''; $('#r-foot').innerHTML = ''; $('#rail').classList.toggle('off', !o.rail);
  }
  function arc(a, b, k, h) { return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * h }; }
  function fly(id, to, ms, h, done, o) {
    o = o || {}; var a = { x: S.pos[id].x, y: S.pos[id].y, r: S.pos[id].r, s: S.pos[id].s }; S.brick(id);
    TL.tween(ms, function (e) { var p = arc(a, to, e, h); S.place(id, { x: p.x, y: p.y, r: a.r + ((to.r || 0) - a.r) * e + (o.spin ? Math.sin(e * 6.28) * 14 : 0), s: a.s + ((to.s == null ? 1 : to.s) - a.s) * e }); }, { ease: o.ease || PF.ease.io, done: function () { if (done) done(); } });
  }
  function wiggle(id) { S.brick(id).animate([{ rotate: '0deg' }, { rotate: '-8deg' }, { rotate: '7deg' }, { rotate: '-4deg' }, { rotate: '0deg' }], { duration: 380 }); }
  function land(id, col) { S.squashBrick(id, 0.18); S.bounce(0.08); PF.snd.snap(); var p = S.pos[id]; PF.fx.burst(p.x, p.y, 16, { colors: [col || '#FFD166', '#FFF7E8', '#FF6B9A'], speed: 420, kind: 1, up: 120 }); }
  function bcol(id) { return F.CATS[PF.BY[id].c].col; }
  function say(t, ms) { S.say(t, ms || 2200); }

  var sc = PF.scenes = [];

  /* 1 WOBBLY */
  sc[0] = {
    cam: { x: 1950, y: 1150, z: 0.72, r: 0 },
    start: function () { reset({ notes: true, wobble: true, face: 'wobble' }); S.pegHang(F.PEG); $('#world').classList.add('s-peg'); },
    beat: function () {
      var N = [].slice.call(document.querySelectorAll('.sticky')), f = mkFlow('tangle', 'bead', { init: function (c) { c.el.style.background = c.data.col; } });
      N.forEach(function (n, i) { var d = Math.abs(parseFloat(n.style.left) - 1250) * 0.5 + i * 40; n.animate([{ transform: 'translateY(-1300px) rotate(' + (i * 40) + 'deg)', opacity: 0 }, { transform: 'translateY(0) rotate(var(--rot))', opacity: 1 }], { duration: 900, delay: d, easing: 'cubic-bezier(.34,1.3,.64,1)', fill: 'backwards' }); });
      var cols = ['#FF6B9A', '#6BCBFF', '#FFD166', '#9B7BFF'], n = 0;
      function spawn() { var el = N[n % N.length], x = parseFloat(el.style.left) + 70, y = parseFloat(el.style.top) + 70; f.path('t' + n % 8, [[[x, y], [x + 200 * (n % 2 ? 1 : -1), y - 500], [1250 + (n % 3 - 1) * 400, 1500], [1250, 1060]]]); f.spawn('t' + n % 8, { speed: 640, data: { col: cols[n % 4] }, onEnd: function () { PF.fx.burst(1250, 1060, 5, { speed: 160, size: 5, life: 0.4 }); } }); n++; }
      for (var i = 0; i < 28; i++) TL.at(900 + i * 300, spawn);
      var L = F.SAY.wobbly, faces = ['wobble', 'x', 'wobble', 'think'];
      for (i = 0; i < 6; i++) (function (k) { TL.at(1600 + k * 1700, function () { say(L[k % L.length], 1500); S.face(faces[k % 4]); PF.snd.pop(); }); })(i);
      TL.at(2000, function () { var q = $('#qm'); if (q) q.classList.add('on'); });
    },
    end: function () { S.forge.firstChild.classList.remove('wobble'); }
  };

  /* 2 SNAP ON */
  sc[1] = {
    cam: { x: 1300, y: 1060, z: 1.15, r: -0.6 },
    start: function () { reset({ face: 'happy' }); S.pegHang(F.PEG); $('#world').classList.add('s-peg'); },
    beat: function () {
      var cfg = { ids: [], channel: 'web' };
      P2.forEach(function (id, i) {
        var t0 = 700 + i * 2300, pi = F.PEG.indexOf(id), pp = S.pegPos(pi);
        TL.at(t0, function () { wiggle(id); S.brick(id).classList.add('labelled'); PF.snd.click(); });
        TL.at(t0 + 380, function () {
          fly(id, S.towerPos(i), 780, 260, function () {
            land(id, bcol(id)); cfg.ids.push(id); var key = id === 'g_ground' ? 'rain' : 'hi';
            S.face(C.face(cfg)); say(id === 'lang_user' ? F.SAY.lang : C.reply(key, cfg).text, 2000);
          }, { spin: 1 });
        });
      });
    }
  };

  /* 3 THE BELT */
  var recv = null;
  sc[2] = {
    cam: { x: 2700, y: 1250, z: 0.75, r: 0.5 },
    start: function () {
      reset({ belt: true, rail: true }); var hung = F.PEG.filter(function (x) { return P2.indexOf(x) < 0; }); S.pegHang(hung); S.setTower(P2); $('#world').classList.add('s-peg');
      $('#r-foot').innerHTML = '<b id="r-n">0</b> <span>sections</span> <i>src: ' + F.N.sections.src + '</i>';
    },
    beat: function () {
      var res = C.compile({ ids: P3, channel: 'web' }), eaten = 0, H = S.hopper, conv = $('#conv');
      function eat(id) { S.hideBrick(id); eaten++; PF.snd.pop(); conv.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.025,.975)' }, { transform: 'scale(1,1)' }], { duration: 260 }); PF.fx.burst(H.x, H.y, 8, { colors: ['#FFD166', '#FFF7E8'], speed: 200, size: 5 }); }
      P2.forEach(function (id, i) { TL.at(300 + i * 230, function () { fly(id, { x: H.x, y: H.y - 30, s: 0.3, r: 200 }, 1100, 380, function () { eat(id); }, { spin: 1 }); }); });
      P3.filter(function (x) { return P2.indexOf(x) < 0; }).forEach(function (id, i) { TL.at(600 + i * 260, function () { fly(id, { x: H.x, y: H.y - 30, s: 0.3, r: -200 }, 1300, 420, function () { eat(id); }, { spin: 1 }); }); });
      TL.at(3200, function () { PF.snd.whir(); S.world.classList.add('s-run'); PF.fx.shake(6, 900); });
      // bricks pop onto rail, lines print through the tube
      var f = mkFlow('print', 'slip', { noRot: true }); f.path('print', [[[3110, 1850], [3200, 1870], [3300, 1900], [3400, 1930]], [[3400, 1930], [3520, 1965], [3640, 2000], [3730, 2005]], [[3730, 2005], [3830, 2005], [3830, 1900], [3800, 1800]], [[3800, 1800], [3800, 1500], [3800, 1000], [3800, 640]], [[3800, 640], [3800, 520], [3750, 470], [3600, 470]], [[3600, 470], [3500, 470], [3450, 470], [3380, 470]]]);
      f.gate({ path: 'print', s0: 1800, s1: 1850, mult: 1, open: true }); S._gate = f.gates[0];
      S.renderReceipt(res, $('#r-rows'), { hide: true }); $('#receipt').classList.remove('blank');
      var rows = [].slice.call(document.querySelectorAll('#r-rows .r-row')), secSeen = {}, nrow = 0;
      rows.forEach(function (row, i) {
        TL.at(3600 + i * 300, function () { f.spawn('print', { speed: 1700, onEnd: function () { row.classList.remove('hid'); row.animate([{ transform: 'translateY(-14px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'steps(3)' }); PF.snd.click(); nrow++; if (row.querySelector('.r-sec').textContent) { secSeen.n = (secSeen.n || 0) + 1; $('#r-n').textContent = secSeen.n; } if (nrow === rows.length) afterPrint(); } }); });
      });
      P3.forEach(function (id, i) { TL.at(3400 + i * 220, function () { S.place(id, { x: 3056, y: 1620, r: 0, s: 0.1 }); fly(id, S.railPos(i), 700, 300, function () { S.squashBrick(id, 0.2); PF.snd.snap(); }); }); });
      function afterPrint() {
        var pick = [3, 7].map(function (k) { return rows[Math.min(k, rows.length - 1)]; });
        TL.at(500, function () { S.string(pick[0], pick[0].dataset.id); }); TL.at(2600, function () { S.string(pick[1], pick[1].dataset.id); });
      }
      var rcp = $('#receipt'); if (!rcp._bound) { rcp._bound = 1; var over = function (e) { var r = e.target.closest('.r-row'); if (!r || r.classList.contains('hid') || PF.mode() !== 'present') return; S.string(r, r.dataset.id); }; rcp.addEventListener('mouseover', over); rcp.addEventListener('focusin', over); rcp.addEventListener('mouseleave', function () { if (PF.mode() === 'present') S.clearStrings(); }); }
      var v = $('#valve'); if (!v._bound) { v._bound = 1; var set = function (o) { var g = flows.print && flows.print.gates[0]; if (g) g.open = o; v.classList.toggle('held', !o); }; v.addEventListener('pointerdown', function (e) { set(false); v.setPointerCapture(e.pointerId); PF.snd.click(); }); v.addEventListener('pointerup', function () { set(true); }); v.addEventListener('pointercancel', function () { set(true); }); v.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var g = flows.print.gates[0]; set(!g.open); e.stopPropagation(); } }); }
    },
    end: function () { S.world.classList.remove('s-run'); }
  };

  /* 4 ZAP */
  sc[3] = {
    cam: { x: 1560, y: 1050, z: 1.0, r: 0 },
    start: function () { reset({ face: 'happy' }); S.pegHang([]); $('#world').classList.remove('s-peg'); },
    beat: function () {
      var cfg = { ids: ['tone_formal', 'tone_slang'], channel: 'web' }, fixed = false, hp = { x: 1250, y: 640 };
      ['tone_formal', 'tone_slang'].forEach(function (id, i) { S.place(id, { x: i ? 2000 : 500, y: 520, r: 0, s: 1 }); S.brick(id).classList.add('labelled'); });
      TL.at(700, function () { fly('tone_formal', { x: 1130, y: 640, r: -4 }, 1100, 120, null, { ease: PF.ease.back }); fly('tone_slang', { x: 1370, y: 640, r: 4 }, 1100, 120, null, { ease: PF.ease.back }); });
      TL.at(2100, function () { fly('tone_formal', { x: 1215, y: 640, r: 0 }, 260, 0, null, {}); fly('tone_slang', { x: 1285, y: 640, r: 0 }, 260, 0, impact, {}); });
      function impact() {
        S.squashBrick('tone_formal', 0.3); S.squashBrick('tone_slang', 0.3); PF.fx.burst(1250, 640, 40, { speed: 600, kind: 1, colors: ['#FFD166', '#FFF7E8', '#FF6B9A'] }); PF.fx.shake(16, 520); PF.snd.zap();
        PF.fx.bolt(S.G.lamp.bx, S.G.lamp.by, 1250, 660, 420); TL.at(220, function () { PF.fx.bolt(S.G.lamp.bx, S.G.lamp.by, 1250, 700, 300); });
        S.world.classList.add('s-zap'); S.face('x'); ['tone_formal', 'tone_slang'].forEach(function (id) { S.brick(id).classList.add('clash'); });
        var c = C.compile(cfg).conflicts[0], n = document.createElement('div'); n.id = 'znote'; n.className = 'int';
        n.innerHTML = '<b>' + F.L.clash + '</b><span>' + c.n + '</span><button class="knob pulse" id="zfix">' + F.L.fix + '</button>'; S.world.appendChild(n); n.animate([{ transform: 'scale(.3) rotate(-12deg)', opacity: 0 }, { transform: 'scale(1) rotate(-2deg)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' });
        $('#zfix').onclick = fix; TL.at(4200, fix);
      }
      function fix() {
        if (fixed) return; fixed = true; var c = C.compile(cfg).conflicts[0]; cfg = C.applyPatch(cfg, c); var n = $('#znote'); if (n) n.innerHTML = '<b>OK</b><span>' + c.fixLabel + '</span>';
        S.world.classList.remove('s-zap'); ['tone_formal', 'tone_slang'].forEach(function (id) { S.brick(id).classList.remove('clash'); });
        fly('tone_formal', S.towerPos(0), 600, 120, function () { land('tone_formal', '#FFD166'); }); fly('tone_slang', S.towerPos(1), 700, 140, function () { land('tone_slang', '#FF6B9A'); S.face(C.face(cfg)); say(F.SAY.patch, 2200); PF.snd.ding(); if (n) TL.at(1200, function () { n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }); }); });
      }
      var lamp = $('#lamp'); lamp.onclick = function () { PF.fx.bolt(S.G.lamp.bx, S.G.lamp.by, 1250, 700, 300); PF.snd.zap(); };
    }
  };

  /* 5 SCORE */
  sc[4] = {
    cam: { x: 2480, y: 800, z: 0.95, r: -0.5 },
    start: function () { reset({ meter: true }); S.pegHang([]); $('#world').classList.remove('s-peg'); S.setTower(['role_study', 'g_ground']); setMeter(null, 0); },
    beat: function () {
      var f = mkFlow('cable', 'glowdot', { noRot: true }), ids = [], shown = 0, prev = {};
      F.CHECKS.forEach(function (c, i) { var b = bulbPos(c.k); f.path('c' + c.k, [[[1330, 720], [1700, 420 + i * 20], [b.x - 400, b.y - 160], [b.x, b.y]]]); });
      STEPS5.forEach(function (id, i) {
        TL.at(900 + i * 1050, function () {
          ids.push(id); var r = C.compile({ ids: ids, channel: 'web' }); PF.snd.snap();
          r.score.checks.forEach(function (c) { if (c.ok && !prev[c.k]) for (var k = 0; k < 3; k++) f.spawn('c' + c.k, { speed: 1100, delay: k * 90 }); });
          TL.at(420, function () { setMeter(r, r.score.total); r.score.checks.forEach(function (c) { if (c.ok && !prev[c.k]) PF.fx.burst(bulbPos(c.k).x, bulbPos(c.k).y, 8, { speed: 220, size: 5 }); prev[c.k] = c.ok; if (!c.ok) prev[c.k] = false; }); if (r.score.total >= 100) win(); else PF.snd.click(); });
        });
      });
      function win() { PF.fx.confetti(150); PF.snd.ding(); $('#meter').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04) rotate(.5deg)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'cubic-bezier(.34,1.56,.64,1)' }); }
    }
  };
  function bulbPos(k) { var m = $('#meter'), b = m.querySelector('.bulb[data-k="' + k + '"]'), x = S.G.meter.x, y = S.G.meter.y, e = b; while (e && e !== m) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x: x + 70, y: y + 50 }; }
  var shownScore = 0;
  function setMeter(res, total) {
    [].forEach.call(document.querySelectorAll('#meter .bulb'), function (b) { var c = res && res.score.checks.filter(function (x) { return x.k === b.dataset.k; })[0]; b.classList.toggle('lit', !!(c && c.ok)); b.classList.toggle('bad', !!(res && c && !c.ok && b.dataset.k === 'contra' && res.conflicts.length)); });
    var from = shownScore; TL.tween(800, function (e) { var v = Math.round(from + (total - from) * e); $('#mnum').textContent = v; $('#mfill').style.height = v + '%'; shownScore = v; });
    if (!res) { shownScore = 0; $('#mnum').textContent = 0; $('#mfill').style.height = '0%'; }
  }
  PF.setMeter = setMeter; PF.bulbPos = bulbPos;

  /* 6 ONE BRAIN */
  sc[5] = {
    cam: { x: 1150, y: 900, z: 1.0, r: 0 },
    start: function () { reset({ panels: true }); S.pegHang([]); $('#world').classList.add('s-peg'); S.chatSet('web'); S.chatSet('wa'); $('#vcap').textContent = F.L.speaking; $('#vprog').style.width = '0'; $('#wave').classList.remove('on'); $('#p-voice').classList.remove('cut'); },
    beat: function () {
      var base = ['role_study', 'tone_play', 'g_ground', 'fb_idk', 'lang_user', 'fmt_md'], f = mkFlow('speech', 'bead s', { init: function (c) { c.el.style.background = c.data.col; } });
      [['web', 690], ['voice', 1140], ['wa', 1540]].forEach(function (p) { f.path(p[0], [[[1250, 1010], [1250, 900 - (p[1] - 1250) * 0.1], [p[1], 1000], [p[1], 890]]]); });
      var pend = function (w) { for (var k = 0; k < 8; k++) f.spawn(w, { speed: 520, delay: k * 120, data: { col: ['#FF6B9A', '#FFD166', '#6BCBFF'][k % 3] } }); };
      document.querySelectorAll('.panel').forEach(function (p, i) { p.animate([{ transform: 'translateY(-90px) rotate(' + (i - 1) * 5 + 'deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 700, delay: i * 140, easing: 'cubic-bezier(.34,1.4,.64,1)', fill: 'backwards' }); });
      var web = { ids: base, channel: 'web' }, voice = { ids: base, channel: 'voice' }, wa = { ids: base, channel: 'whatsapp' };
      TL.at(900, function () { pend('web'); S.chatSet('web', F.SAY.chatQ, ''); S.face('oh'); });
      TL.at(1700, function () { S.chatSet('web', F.SAY.chatQ, C.reply('hi', web).text); S.face(C.face(web)); PF.snd.pop(); S.bounce(0.07); });
      TL.at(3600, function () { pend('voice'); var cr = C.compile(voice); $('#p-voice .fmt').textContent = cr.conflicts.length ? F.L.fmtVoice + ' ?' : F.L.fmtVoice; $('#wave').classList.add('on'); S.face('oh'); PF.snd.whir(); TL.tween(2200, function (e) { $('#vprog').style.width = (e * 100) + '%'; }, { ease: PF.ease.lin }); });
      TL.at(4100, function () { var vc = C.compile(C.applyPatch(voice, C.compile(voice).conflicts[0])); $('#p-voice .fmt').textContent = F.L.fmtVoice; $('#p-voice').classList.add('patched'); });
      TL.at(5900, function () { barge(); });
      function barge() { var b = $('#barge'); b.classList.add('press'); f.clear(); $('#wave').classList.remove('on'); $('#p-voice').classList.add('cut'); $('#vcap').textContent = F.L.stopped; PF.snd.cut(); PF.fx.burst(1140, 780, 10, { speed: 240, size: 5 }); S.face('happy'); }
      $('#barge').onclick = function () { barge(); };
      TL.at(7000, function () { pend('wa'); S.chatSet('wa', F.SAY.chatQ, ''); });
      TL.at(7900, function () { S.chatSet('wa', F.SAY.chatQ, C.reply('hi', wa).text); PF.snd.pop(); });
    }
  };

  /* 7 KEY WHEEL */
  var W = PF.wheel = { pool: null, load: 0, acc: 0, ang: 0, tgt: 0, on: false, script: false };
  W.start = function () {
    W.pool = W.pool || new PF.KeyPool(F.N.keys.v); W.pool.reset(); W.load = 0; W.ang = 0; W.on = true; W.acc = 0; W.setLever(0);
    var f = mkFlow('req', 'req', { noRot: true }); W.f = f; f.clear(); f.path('req', [[[160, 1000], [240, 880], [540, 900], [620, 1100]]]);
  };
  W.stop = function () { W.on = false; };
  W.setLever = function (v) { W.load = Math.max(0, Math.min(1, v)); var l = $('#lever'); l.querySelector('.knob').style.transform = 'translateY(' + ((1 - W.load) * 340) + 'px)'; l.setAttribute('aria-valuenow', Math.round(W.load * 100)); };
  W.hit = function (i, kind) { if (kind === 'dead') { W.pool.kill(i); PF.fx.burst(S.G.wheel.cx, S.G.wheel.cy - 250, 10, { speed: 200, colors: ['#9a94a8'] }); } else { W.pool.rateLimit(i, 8 + (i % 3) * 2); PF.fx.burst(S.G.wheel.cx, S.G.wheel.cy - 250, 10, { speed: 260, colors: ['#6BCBFF', '#FFF7E8'] }); } PF.snd.zap(); };
  PF.loop(function (dt) {
    if (!W.on) return; var p = W.pool, n = p.keys.length, f = W.f;
    p.tick(dt); W.acc += dt * (1 + W.load * 9) * (W.load > 0 ? 1 : 0.4);
    while (W.acc >= 1) { W.acc -= 1; f.spawn('req', { speed: 900, onEnd: function () { var i = p.next(); if (i >= 0) { var k = p.keys[i]; PF.fx.burst(S.G.wheel.cx, S.G.wheel.cy - 340, 3, { speed: 120, size: 4, life: 0.3 }); if (!W.script && W.load > 0.45 && p.rnd() < (W.load - 0.4) * 0.12) W.hit(i, 'cool'); } } }); }
    W.tgt = -p.ptr * (360 / n); var d = W.tgt - W.ang; while (d > 180) d -= 360; while (d < -180) d += 360; W.ang += d * Math.min(1, dt * 8);
    var disc = $('#disc'); disc.style.transform = 'rotate(' + W.ang.toFixed(2) + 'deg)';
    S.keyEls.forEach(function (g, i) {
      var k = p.keys[i], cl = 'key ' + (k.st === 'cool' ? 'cool' : k.st === 'dead' ? 'dead' : 'live'); if (g.getAttribute('class') !== cl) g.setAttribute('class', cl);
      var lab = g.querySelector('.kslot'); lab.setAttribute('transform', 'translate(0,-250) rotate(' + (-(W.ang + i * 360 / n)).toFixed(1) + ')');
      var st = g.querySelector('.kst'), arc = g.querySelector('.karc'), t = k.st === 'cool' ? Math.ceil(k.cool) + 's' : k.st === 'dead' ? '401' : ''; if (st.textContent !== t) st.textContent = t;
      if (k.st === 'cool') { var a = 6.283 * (1 - k.cool / k.max), x = Math.sin(a) * 50, y = -Math.cos(a) * 50; arc.setAttribute('d', 'M0 -50 A50 50 0 ' + (a > 3.14 ? 1 : 0) + ' 1 ' + x.toFixed(1) + ' ' + y.toFixed(1)); } else if (arc.getAttribute('d')) arc.setAttribute('d', '');
    });
    $('#wstat').innerHTML = '<b>' + F.L.live + ' ' + p.liveCount() + '</b><b class="c">' + PF.tipify('[[' + F.L.cooling + '|cooldown]]') + ' ' + p.coolCount() + '</b><b class="d">' + F.L.dead + '</b> ' + p.keys.filter(function (k) { return k.st === 'dead'; }).length;
  });
  sc[6] = {
    cam: { x: 950, y: 1380, z: 0.95, r: 0.6 }, ui: 'r',
    start: function () { reset({ wheel: true }); S.pegHang([]); $('#world').classList.add('s-peg'); W.start(); },
    beat: function () {
      W.script = true; var ramp = [[0, .25], [1200, .5], [2600, .8], [4200, .95], [8800, .45], [10500, .15]];
      ramp.forEach(function (r) { TL.at(r[0] + 200, function () { var a = W.load; TL.tween(900, function (e) { W.setLever(a + (r[1] - a) * e); }); }); });
      TL.at(3200, function () { W.hit(2); }); TL.at(4700, function () { W.hit(5); }); TL.at(6600, function () { W.hit(7, 'dead'); });
      TL.at(11800, function () { W.script = false; });
    },
    end: function () { W.stop(); W.script = false; }
  };

  /* 8 REALITY */
  sc[7] = {
    cam: { x: 1950, y: 1150, z: 0.72, r: 0 },
    start: function () { reset({ face: 'happy' }); S.pegHang([]); },
    beat: function () { PF.reality.open(false); TL.at(900, function () { S.bounce(0.12); }); }
  };
})();
