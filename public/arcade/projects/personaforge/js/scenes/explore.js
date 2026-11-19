/* EXPLORE mode: free sandbox. Stations: BUILD (bench, compiler, conflicts, scorer, budget), CHANNEL (switch, preview, barge-in), KEYS (key pool). */
(function () {
  var F = PF.FACTS, S = PF.stage, C = PF.compiler, U = F.UI, $ = function (s) { return document.querySelector(s); };
  var X = PF.explore = { st: 'build', cfg: { ids: [], channel: 'web', plain: false, patched: {}, budget: 260 }, res: null, on: false, filter: -1 };
  var POSE = { build: { x: 1500, y: 1120, z: 1.0, r: 0 }, chan: { x: 1150, y: 900, z: 1.0, r: 0 }, keys: { x: 950, y: 1380, z: 0.95, r: 0 } };
  var ORDER = ['build', 'chan', 'keys'], built = false, seenC = {}, voiceT = null;

  function build() {
    if (built) return; built = true; var h = $('#hud'), chips = '', cats = '<button class="cat on" data-c="-1">ALL</button>';
    F.CATS.forEach(function (c, i) { cats += '<button class="cat" data-c="' + i + '" style="--c:' + c.col + '" aria-label="' + c.n + '" title="' + c.n + '"></button>'; });
    F.BLOCKS.forEach(function (b) { var c = F.CATS[b.c]; chips += '<button class="chip" data-id="' + b.id + '" data-c="' + b.c + '" style="--c:' + c.col + '"><i></i><span>' + b.n + '</span></button>'; });
    h.innerHTML =
      '<div id="tabs" role="tablist">' + ORDER.map(function (k) { return '<button role="tab" data-st="' + k + '">' + U.tabs[k] + '</button>'; }).join('') + '<button id="x-reset" class="rs">' + U.reset + '</button></div>' +
      '<aside id="xl" class="xp"><div class="xs"><h4>' + U.score + '</h4><div class="sc"><b id="x-score">0</b><small>/ 100</small></div><div class="lights" id="x-lights"></div></div>' +
      '<div class="xs"><h4>' + U.conflicts + '</h4><div id="x-conf"></div></div>' +
      '<div class="xs"><h4>' + PF.tipify('[[' + U.budget + '|token budget]]') + ' <em id="x-bv"></em></h4><input type="range" id="x-bud" min="20" max="260" step="1" value="260" aria-label="maxTokenBudget"><div id="x-drop" class="drop"></div></div></aside>' +
      '<aside id="xr" class="xp"><div class="xh"><b>' + F.L.receipt + '</b><span>' + F.layoutLabel + '</span></div><div id="x-worn" class="worn"></div><div class="r-rows" id="x-rows"></div><div class="xf" id="x-tok"></div></aside>' +
      '<div id="tray" class="xp"><div class="tl"><b>' + F.benchLabel + '</b><div class="cats">' + cats + '</div></div><div class="chips">' + chips + '</div></div>' +
      '<div id="chbar" class="xp"><div class="plugs">' + [['web', 'WEB'], ['voice', 'VOICE'], ['whatsapp', 'WHATSAPP']].map(function (p) { return '<button class="plug" data-ch="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div><div class="pr">' + F.PROMPTS.map(function (p) { return '<button class="chip q" data-q="' + p.k + '"><i></i><span>' + p.q + '</span></button>'; }).join('') + '</div></div>' +
      '<div id="kbar" class="xp"><span>' + U.pull + '</span><small>' + U.keyhint + '</small></div>';
    h.addEventListener('click', onClick); $('#x-bud').addEventListener('input', function (e) { X.cfg.budget = +e.target.value; render(); PF.snd.cut(); });
    $('#x-reset').onclick = function () { X.cfg = { ids: [], channel: 'web', plain: false, patched: {}, budget: 260 }; $('#x-bud').value = 260; seenC = {}; render(); };
    // drag from tray
    var chipsEl = h.querySelector('.chips'), drag = null;
    chipsEl.addEventListener('pointerdown', function (e) { var c = e.target.closest('.chip'); if (!c) return; drag = { c: c, x: e.clientX, y: e.clientY, g: null }; });
    addEventListener('pointermove', function (e) { if (!drag) return; if (!drag.g && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10) { drag.g = drag.c.cloneNode(true); drag.g.className += ' ghost'; document.body.appendChild(drag.g); } if (drag.g) { drag.g.style.left = e.clientX + 'px'; drag.g.style.top = e.clientY + 'px'; } });
    addEventListener('pointerup', function (e) { if (!drag) return; if (drag.g) { drag.g.remove(); if (e.clientY < $('#tray').getBoundingClientRect().top) add(drag.c.dataset.id, true); drag.c.dataset.dragged = '1'; setTimeout(function () { delete drag.c.dataset.dragged; }, 50); } drag = null; });
    // lever + keys
    var lv = $('#lever'), kn = lv.querySelector('.knob');
    lv.addEventListener('pointerdown', function (e) { lv.setPointerCapture(e.pointerId); mv(e); lv._d = 1; });
    lv.addEventListener('pointermove', function (e) { if (lv._d) mv(e); }); lv.addEventListener('pointerup', function () { lv._d = 0; });
    function mv(e) { var r = lv.getBoundingClientRect(), k = (e.clientY - r.top - r.height * 0.1) / (r.height * 0.7); PF.wheel.script = false; PF.wheel.setLever(1 - k); }
    lv.addEventListener('keydown', function (e) { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { PF.wheel.setLever(PF.wheel.load + (e.key === 'ArrowUp' ? 0.1 : -0.1)); e.preventDefault(); e.stopPropagation(); } });
    var disc = $('#disc'); disc.addEventListener('click', function (e) { var g = e.target.closest('.key'); if (!g || !PF.wheel.on) return; var i = +g.dataset.i, k = PF.wheel.pool.keys[i]; if (k.st === 'dead') PF.wheel.pool.revive(i); else PF.wheel.hit(i, 'cool'); });
    disc.addEventListener('dblclick', function (e) { var g = e.target.closest('.key'); if (g && PF.wheel.on) PF.wheel.hit(+g.dataset.i, 'dead'); });
    $('#barge').addEventListener('click', function () { if (X.on) stopVoice(); });
  }

  function onClick(e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.dataset.st) return station(t.dataset.st, true);
    if (t.classList.contains('cat')) { X.filter = +t.dataset.c; [].forEach.call(document.querySelectorAll('.cat'), function (b) { b.classList.toggle('on', b === t); }); [].forEach.call(document.querySelectorAll('.chips .chip'), function (c) { c.hidden = X.filter >= 0 && +c.dataset.c !== X.filter; }); return; }
    if (t.classList.contains('chip') && t.dataset.id) { if (t.dataset.dragged) return; return add(t.dataset.id); }
    if (t.dataset.ch) { X.cfg.channel = t.dataset.ch; PF.snd.click(); render(); return; }
    if (t.dataset.q) return ask(t.dataset.q);
    if (t.dataset.fix) { var c = X.res.conflicts[+t.dataset.fix]; X.cfg = C.applyPatch(X.cfg, c); PF.snd.ding(); S.bounce(0.1); PF.fx.burst(1250, 1000, 20, { speed: 400, kind: 1 }); render(); return; }
    if (t.dataset.rm) { var i = X.cfg.ids.indexOf(t.dataset.rm); if (i >= 0) { X.cfg.ids.splice(i, 1); PF.snd.pop(); render(); } }
  }

  function add(id, dropped) {
    var i = X.cfg.ids.indexOf(id); if (i >= 0) { X.cfg.ids.splice(i, 1); PF.snd.pop(); render(); return; }
    X.cfg.ids.push(id); PF.snd.snap(); S.bounce(0.09); render();
    var n = X.cfg.ids.length - 1; if (n < 8) { var from = { x: S.towerPos(n).x + 700, y: S.towerPos(n).y - 300 }; S.place(id, { x: from.x, y: from.y, s: 1 }); var a = { x: from.x, y: from.y }, to = S.towerPos(n); PF.tl.tween(520, function (e) { S.place(id, { x: a.x + (to.x - a.x) * e, y: a.y + (to.y - a.y) * e, r: to.r * e, s: 1 }); }, { ease: PF.ease.back, done: function () { S.squashBrick(id, 0.16); } }); }
    PF.fx.burst(1250, S.G.headTop - 40, 12, { colors: [F.CATS[PF.BY[id].c].col, '#FFF7E8'], speed: 360, kind: 1 });
    var r = X.res, face = C.face(X.cfg); S.face(face);
  }

  function render() {
    var cfg = X.cfg, res = X.res = C.compile(cfg), nconf = res.conflicts.length;
    S.renderReceipt(res, $('#x-rows'), { showEmpty: true });
    if (!cfg.ids.length) $('#x-rows').insertAdjacentHTML('afterbegin', '<p class="emp">' + U.empty + '</p>');
    // tower (first 8 worn blocks)
    S.hideAll(); cfg.ids.slice(0, 8).forEach(function (id, i) { S.place(id, S.towerPos(i)); S.brick(id).classList.toggle('clash', res.conflicts.some(function (c) { return c.a === id || c.b === id; })); });
    $('#x-worn').innerHTML = cfg.ids.map(function (id) { return '<button class="dot" data-rm="' + id + '" style="--c:' + F.CATS[PF.BY[id].c].col + '" title="' + PF.BY[id].n + '" aria-label="Remove ' + PF.BY[id].n + '"></button>'; }).join('') || '<small>' + U.worn + '</small>';
    $('#x-score').textContent = res.score.total;
    $('#x-lights').innerHTML = res.score.checks.map(function (c) { return '<span class="' + (c.ok ? 'on' : '') + '"><i></i>' + c.n + ' <em>' + c.w + '</em></span>'; }).join('');
    $('#x-conf').innerHTML = nconf ? res.conflicts.map(function (c, i) { return '<div class="cn"><b>' + c.n + '</b><button class="knob" data-fix="' + i + '">' + c.fixLabel + '</button></div>'; }).join('') : '<small>-</small>';
    $('#x-bv').textContent = cfg.budget; $('#x-tok').innerHTML = '<b>' + res.tokens + '</b> ' + PF.tipify('[[' + U.tokens + '|token]]') + ' / ' + (cfg.budget);
    $('#x-drop').innerHTML = res.dropped.length ? U.dropped + ': ' + res.dropped.map(function (d) { return '<s><svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 6 L20 18 M4 18 L20 6" stroke="currentColor" stroke-width="3" fill="none"/></svg> ' + d.t + '</s>'; }).join('') : U.none;
    if (res.dropped.length > (X._dn || 0)) { PF.snd.cut(); } X._dn = res.dropped.length;
    [].forEach.call(document.querySelectorAll('.plug'), function (b) { b.classList.toggle('on', b.dataset.ch === cfg.channel); });
    [].forEach.call(document.querySelectorAll('.panel'), function (p) { p.classList.toggle('active', p.id === 'p-' + (cfg.channel === 'whatsapp' ? 'wa' : cfg.channel)); });
    var fm = res.cfg.channel === 'voice' ? (nconf && res.conflicts.some(function (c) { return c.rule === 'voicemd'; }) ? F.L.fmtVoice + ' ?' : F.L.fmtVoice) : cfg.channel === 'whatsapp' ? F.L.fmtWa : F.L.fmtWeb;
    // new conflict: zap
    res.conflicts.forEach(function (c) { var k = c.rule + c.a + c.b; if (!seenC[k]) { seenC[k] = 1; if (X.st === 'build') { PF.fx.bolt(S.G.lamp.bx, S.G.lamp.by, 1250, 980, 380); PF.fx.shake(10, 380); PF.snd.zap(); S.face('x'); } } });
    if (!nconf) S.face(C.face(cfg));
    [].forEach.call(document.querySelectorAll('.chip[data-id]'), function (c) { c.classList.toggle('wearing', cfg.ids.indexOf(c.dataset.id) >= 0); });
    wireTrace();
  }
  function wireTrace() {
    var rows = $('#x-rows'); if (rows._w) return; rows._w = 1;
    var over = function (e) { var r = e.target.closest('.r-row'); if (!r) return; var id = r.dataset.id; [].forEach.call(document.querySelectorAll('.r-row'), function (x) { x.classList.toggle('tr', x.dataset.id === id); }); var b = id && id[0] !== '@' && S.pos[id] && S.pos[id].s > 0 ? S.brick(id) : null; if (b) b.classList.add('hl'); [].forEach.call(document.querySelectorAll('.dot'), function (d) { d.classList.toggle('hl', d.dataset.rm === id); }); };
    var out = function () { [].forEach.call(document.querySelectorAll('.r-row.tr,.brick.hl,.dot.hl'), function (x) { x.classList.remove('tr', 'hl'); }); };
    rows.addEventListener('mouseover', over); rows.addEventListener('focusin', over); rows.addEventListener('mouseleave', out);
  }

  function ask(k) {
    var cfg = X.cfg, r = C.reply(k, cfg), ch = cfg.channel; PF.snd.pop(); S.face('oh'); setTimeout(function () { S.face(C.face(cfg)); }, 600);
    var web = $('#p-web'), wa = $('#p-wa'), q = F.PROMPTS.filter(function (p) { return p.k === k; })[0].q;
    S.chatSet('web', q, ch === 'web' ? r.text : ''); S.chatSet('wa', q, ch === 'whatsapp' ? r.text : '');
    var warn = r.risky ? ' (made up)' : ''; if (r.risky) $('#p-web .msg.b').textContent = r.text + warn;
    if (ch === 'voice') speak(r.text);
    PF.stage.say(r.text, 2400);
  }
  function speak(t) {
    stopVoice(); $('#p-voice').classList.remove('cut'); $('#barge').classList.remove('press'); $('#wave').classList.add('on'); $('#vcap').textContent = t;
    var w = PF.tl.tween(6000, function (e) { $('#vprog').style.width = (e * 100) + '%'; }, { ease: PF.ease.lin, done: function () { $('#wave').classList.remove('on'); } }); voiceT = w;
  }
  function stopVoice() { if (voiceT) voiceT.t = voiceT.ms; voiceT = null; $('#wave').classList.remove('on'); $('#p-voice').classList.add('cut'); $('#barge').classList.add('press'); $('#vcap').textContent = F.L.stopped; PF.snd.cut(); }

  function station(k, click) {
    X.st = k; PF.tl.clear(); S.clearStrings(); var wl = S.world.classList; wl.toggle('s-panels', k === 'chan'); wl.toggle('s-wheel', k === 'keys'); wl.remove('s-meter', 's-peg', 's-belt'); wl.toggle('s-run', false);
    $('#hud').dataset.st = k; [].forEach.call(document.querySelectorAll('#tabs [data-st]'), function (b) { b.setAttribute('aria-selected', b.dataset.st === k); b.classList.toggle('on', b.dataset.st === k); });
    if (k === 'keys') { PF.wheel.script = false; PF.wheel.start(); PF.wheel.setLever(0.35); } else PF.wheel.stop();
    $('#receipt').classList.add('off'); $('#rail').classList.add('off'); S.notesShow(false); $('#znote') && $('#znote').remove();
    if (k === 'chan') { $('#p-voice').classList.remove('cut'); $('#wave').classList.remove('on'); }
    PF.camTo(POSE[k], click ? 1100 : 1); render();
    if (click) PF.snd.click();
  }
  X.step = function (d) { var i = (ORDER.indexOf(X.st) + d + ORDER.length) % ORDER.length; station(ORDER[i], true); };
  X.enter = function () { build(); X.on = true; $('#hud').hidden = false; S.pegHang([]); station(X.st, false); S.say(''); };
  X.leave = function () { X.on = false; $('#hud').hidden = true; PF.wheel.stop(); $('#receipt').classList.remove('off'); $('#r-rows').innerHTML = ''; S.hideAll(); stopQuiet(); };
  function stopQuiet() { voiceT = null; }
})();
