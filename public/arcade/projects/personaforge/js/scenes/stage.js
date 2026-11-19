/* The ONE stage: a 3840x2160 world. Everything persists; scenes only move the camera and re-arrange props. */
(function () {
  var F = PF.FACTS, S = PF.stage = { pos: {}, W: 3840, H: 2160 };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var RECTS = [[188,18,385,353],[602,16,383,357],[1014,16,383,355],[1432,18,375,353],[1848,18,372,354],[134,395,403,372],[575,397,393,371],[1012,395,392,372],[1446,395,392,375],[1882,395,388,373],[72,781,429,399],[537,781,415,399],[998,781,411,399],[1456,780,411,401],[1914,780,414,402]];
  var K = 0.5;

  /* world geometry (world units) */
  S.G = {
    forge: { x: 845, y: 815, s: 0.9, cx: 1250 }, headTop: 960,
    lamp: { x: 1850, y: 1560, w: 325, h: 455, bx: 2012, by: 1668 },
    conv: { x: 2300, y: 1500, s: 0.9 },
    meter: { x: 2150, y: 380, w: 680, h: 820 },
    receipt: { x: 2960, y: 500, w: 800 },
    rail: { y: 1340, x0: 2480, dx: 100 },
    wheel: { cx: 620, cy: 1480, r: 380 },
    panels: { y: 380 }
  };
  S.pegPos = function (i) { var L = [560, 760, 960], R = [1540, 1740], Y = [500, 670, 840]; if (i < 9) return { x: L[i % 3], y: Y[(i / 3) | 0] }; var j = i - 9; return { x: R[j % 2], y: Y[(j / 2) | 0] }; };
  S.towerPos = function (i) { return { x: S.G.forge.cx + (i % 2 ? 6 : -6), y: S.G.headTop - 95 - i * 80, r: (i % 2 ? 2.2 : -2.4), s: 1 }; };
  S.railPos = function (i) { return { x: S.G.rail.x0 + 50 + i * S.G.rail.dx, y: S.G.rail.y - 10, r: (i % 2 ? 2 : -2), s: 0.5 }; };
  S.hopper = { x: 2485, y: 1626 };

  function cat(id) { return F.CATS[PF.BY[id].c]; }

  S.build = function () {
    var w = $('#world'), g = S.G, fg = g.forge; S.world = w;
    var h = '';
    // plate + fallback
    h += '<div id="plate" class="layer"><img id="bg" src="assets/workshop_bg.webp" alt="" width="3840" height="2160"></div>';
    h += '<div id="rays" class="layer" data-par="0.8"><i></i><i></i><i></i></div>';
    h += '<div id="dust" class="layer" data-par="0.7">' + dust() + '</div>';
    // peg tag
    h += '<div id="pegtag" class="wlab" style="left:520px;top:395px">' + F.L.pegHint + '</div>';
    // key wheel + lever
    h += wheelHTML();
    // channel panels
    h += panelsHTML();
    // meter board
    h += meterHTML();
    // conveyor + tube + receipt
    h += convHTML();
    h += '<svg id="tubes" class="layer" width="3840" height="2160" viewBox="0 0 3840 2160" aria-hidden="true">' +
      '<path id="tube-o" d="M3700 2000 C3830 2010 3850 1920 3800 1800 L3800 640 C3800 520 3760 470 3600 470 L3380 470"/>' +
      '<path id="tube-i" d="M3700 2000 C3830 2010 3850 1920 3800 1800 L3800 640 C3800 520 3760 470 3600 470 L3380 470"/></svg>';
    h += '<button id="valve" class="int" aria-label="Pinch the print tube (hold)" style="left:3752px;top:1290px"><span>' + F.L.valve + '</span></button>';
    h += '<div id="slips" class="layer"></div>';
    h += receiptHTML();
    h += '<div id="rail" style="left:' + (g.rail.x0 - 40) + 'px;top:' + (g.rail.y + 40) + 'px;width:' + (g.rail.dx * 11 + 80) + 'px"><b>' + F.L.rail + '</b><i></i><i></i></div>';
    // lamp
    h += '<div id="lamp" style="left:' + g.lamp.x + 'px;top:' + g.lamp.y + 'px;width:' + g.lamp.w + 'px;height:' + g.lamp.h + 'px"><div class="glow"></div>' +
      '<img src="assets/zapper_lamp.png" alt="Zapper lamp, a lightning bolt desk lamp" width="325" height="455">' + lampFB() + '</div>';
    // turntable + forge
    h += '<div id="turn" style="left:' + (fg.cx - 430) + 'px;top:1730px"><i></i></div>';
    h += '<div id="notes" class="layer"></div>';
    h += forgeHTML();
    h += '<div id="bubble" class="int"><span></span></div>';
    h += '<div id="bricks" class="layer"></div>';
    h += '<svg id="strings" class="layer" width="3840" height="2160" viewBox="0 0 3840 2160" aria-hidden="true"></svg>';
    h += '<div id="fgl" class="layer" data-par="1.35"><i style="left:240px;top:300px"></i><i style="left:3300px;top:1900px"></i><i style="left:1700px;top:2050px"></i><i style="left:2900px;top:240px"></i></div>';
    w.innerHTML = h;

    // asset fallbacks: never a broken image
    [['bg', 'no-bg'], ['.forge-img', 'no-forge'], ['#lamp img', 'no-lamp'], ['.conv-img', 'no-conv']].forEach(function (p) {
      var el = $(p[0].charAt(0) === '#' || p[0].charAt(0) === '.' ? p[0] : '#' + p[0]); if (!el) return;
      var bad = function () { document.documentElement.classList.add(p[1]); el.style.display = 'none'; };
      el.addEventListener('error', bad); if (el.complete && el.naturalWidth === 0) setTimeout(function () { if (el.naturalWidth === 0) bad(); }, 50);
    });
    var sp = new Image(); sp.onerror = function () { document.documentElement.classList.add('no-sprite'); }; sp.src = 'assets/blocks_sprite.png';

    S.bricksEl = $('#bricks'); S.bubble = $('#bubble'); S.forge = $('#forge'); S.faceEl = $('#face');
    S.buildNotes(); S.face('happy'); S.layers = [].slice.call(w.querySelectorAll('[data-par]'));
    // pegboard bricks (one per category)
    F.PEG.forEach(function (id, i) { S.brick(id); });
    S.buildWheelParts();
  };

  function dust() { var s = ''; for (var i = 0; i < 18; i++) s += '<i style="left:' + (2300 + ((i * 137) % 1100)) + 'px;top:' + (300 + ((i * 211) % 1000)) + 'px;animation-delay:' + (-i * 1.3) + 's;animation-duration:' + (9 + (i % 5) * 3) + 's"></i>'; return s; }
  function lampFB() { return '<svg class="fb fb-lamp" viewBox="0 0 325 455" aria-hidden="true"><circle cx="162" cy="100" r="62" fill="#FFD166" stroke="#2B2147" stroke-width="8"/><rect x="140" y="160" width="46" height="40" fill="#2B2147"/><path d="M190 190 L120 300 L170 300 L130 420 L230 270 L180 270 Z" fill="#FF9F43" stroke="#2B2147" stroke-width="8"/><ellipse cx="162" cy="435" rx="80" ry="20" fill="#FF6B9A" stroke="#2B2147" stroke-width="8"/></svg>'; }
  function forgeHTML() {
    var fg = S.G.forge, W = 900 * fg.s, H = 1100 * fg.s;
    return '<div id="forge" class="int" style="left:' + fg.x + 'px;top:' + fg.y + 'px;width:' + W + 'px;height:' + H + 'px"><div class="forge-body">' +
      '<img class="forge-img" src="assets/forge_robot.png" alt="Forge, a friendly toy robot with a screen face" width="810" height="990">' +
      '<svg class="fb fb-forge" viewBox="0 0 900 1100" aria-hidden="true"><rect x="270" y="130" width="360" height="300" rx="70" fill="#FF6B9A" stroke="#2B2147" stroke-width="14"/><rect x="310" y="190" width="280" height="190" rx="30" fill="#2B2147"/><rect x="300" y="430" width="300" height="400" rx="80" fill="#FFD166" stroke="#2B2147" stroke-width="14"/><rect x="330" y="560" width="240" height="190" rx="60" fill="#FF6B9A"/><rect x="130" y="470" width="150" height="300" rx="60" fill="#FF6B9A" stroke="#2B2147" stroke-width="14"/><rect x="620" y="470" width="150" height="300" rx="60" fill="#FF6B9A" stroke="#2B2147" stroke-width="14"/><rect x="330" y="820" width="100" height="220" rx="40" fill="#FFD166" stroke="#2B2147" stroke-width="14"/><rect x="470" y="820" width="100" height="220" rx="40" fill="#FFD166" stroke="#2B2147" stroke-width="14"/><rect x="430" y="40" width="40" height="100" fill="#6BCBFF"/><circle cx="450" cy="40" r="26" fill="#FF6B9A" stroke="#2B2147" stroke-width="8"/></svg>' +
      '<svg id="face" viewBox="0 0 232 210" aria-hidden="true" style="left:' + (324 * fg.s) + 'px;top:' + (210 * fg.s) + 'px;width:' + (232 * fg.s) + 'px;height:' + (210 * fg.s) + 'px"><g id="eyes"></g><g id="mouth"></g></svg>' +
      '</div></div>';
  }
  function panelsHTML() {
    var y = S.G.panels.y, L = F.L, i, bars = '';
    for (i = 0; i < 26; i++) bars += '<i style="--i:' + i + '"></i>';
    return '<div id="panels" class="layer">' +
      '<section id="p-web" class="panel" style="left:480px;top:' + y + 'px;width:420px;height:500px"><header>' + L.web + '</header><div class="chat"><div class="msg u"></div><div class="msg b"></div></div><footer><span class="fmt">' + L.fmtWeb + '</span></footer></section>' +
      '<section id="p-voice" class="panel" style="left:930px;top:' + y + 'px;width:420px;height:500px"><header>' + L.voice + ' <small>' + PF.tipify('[[STT|stt]] · [[TTS|tts]]') + '</small></header>' +
      '<div class="wave" id="wave">' + bars + '</div><div class="prog"><b id="vprog"></b></div><div class="cap" id="vcap">' + L.speaking + '</div>' +
      '<button id="barge" class="int knob" aria-label="Interrupt the voice bot (barge-in)">' + PF.tipify('[[' + L.interrupt + '|bargein]]') + '</button><footer><span class="fmt">' + L.fmtVoice + '</span></footer></section>' +
      '<section id="p-wa" class="panel phone" style="left:1380px;top:' + y + 'px;width:320px;height:500px"><header>' + L.wa + '</header><div class="chat"><div class="msg u"></div><div class="msg b"></div></div><footer><span class="fmt">' + L.fmtWa + '</span> <small>' + PF.tipify('[[FastAck|fastack]]') + '</small></footer></section></div>';
  }
  function meterHTML() {
    var m = S.G.meter, i, ticks = '', bulbs = '';
    for (i = 0; i <= 10; i++) ticks += '<span style="bottom:' + (i * 10) + '%"><u>' + (i * 10) + '</u></span>';
    F.CHECKS.forEach(function (c, k) { bulbs += '<div class="bulb" data-k="' + c.k + '"><i></i><b>' + c.n + '</b><em>' + c.w + '</em></div>'; });
    return '<div id="meter" class="layer-obj" style="left:' + m.x + 'px;top:' + m.y + 'px;width:' + m.w + 'px;height:' + m.h + 'px">' +
      '<h3>' + F.L.meterTitle + '</h3><div class="ruler"><div class="ticks">' + ticks + '</div><div class="merc"><span id="mfill"></span><svg class="mface" viewBox="0 0 60 60"><circle cx="30" cy="30" r="27" fill="#FFF7E8" stroke="#2B2147" stroke-width="4"/><path d="M16 26 Q22 18 28 26 M34 26 Q40 18 46 26 M20 38 Q30 48 40 38" fill="none" stroke="#2B2147" stroke-width="4" stroke-linecap="round"/></svg></div></div>' +
      '<div class="bulbs">' + bulbs + '</div><div class="big"><span id="mnum">0</span><small>/ 100</small></div><div class="src">' + F.L.weights + '</div></div>';
  }
  function convHTML() {
    var c = S.G.conv, s = c.s;
    return '<div id="conv" class="int" style="left:' + c.x + 'px;top:' + c.y + 'px;width:' + (1600 * s) + 'px;height:' + (700 * s) + 'px">' +
      '<img class="conv-img" src="assets/conveyor_machine.png" alt="Cartoon conveyor machine that compiles prompts" width="1440" height="630">' +
      '<svg class="fb fb-conv" viewBox="0 0 1600 700" aria-hidden="true"><ellipse cx="205" cy="140" rx="185" ry="70" fill="#FF6B9A" stroke="#2B2147" stroke-width="12"/><rect x="380" y="150" width="620" height="420" rx="170" fill="#6BCBFF" stroke="#2B2147" stroke-width="12"/><rect x="860" y="410" width="360" height="70" fill="#2B2147"/><path d="M1180 470 L1600 620 L1600 660 L1180 560Z" fill="#6BCBFF" stroke="#2B2147" stroke-width="10"/></svg>' +
      '<div class="belt"></div><i class="puff"></i><i class="puff"></i><i class="puff"></i>' +
      '<div class="clab">' + PF.tipify('[[COMPILER|compiler]]') + '</div></div>';
  }
  function receiptHTML() {
    var r = S.G.receipt;
    return '<div id="receipt" class="int" style="left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px"><div class="r-slot"></div><div class="r-paper"><div class="r-head"><b>' + F.L.receipt + '</b><span>' + F.layoutLabel + '</span></div><div class="r-rows" id="r-rows"></div><div class="r-foot" id="r-foot"></div></div></div>';
  }
  function wheelHTML() {
    var w = S.G.wheel, sz = w.r * 2;
    return '<div id="wheelwrap" class="layer-obj" style="left:' + (w.cx - w.r - 40) + 'px;top:' + (w.cy - w.r - 70) + 'px;width:' + (sz + 80) + 'px;height:' + (sz + 140) + 'px">' +
      '<div class="wlab" id="wtitle" style="left:50px;top:0">' + PF.tipify('[[' + F.L.wheel + '|keypool]]') + ' · ' + PF.tipify('[[' + F.L.redis + '|redis]]') + '</div>' +
      '<svg id="wheel" viewBox="-400 -400 800 800" width="' + (sz + 40) + '" height="' + (sz + 40) + '" style="left:20px;top:80px"><circle r="380" class="w-rim"/><circle r="330" class="w-face"/><g id="disc"></g><circle r="64" class="w-hub"/><path d="M-26 -380 L26 -380 L0 -330Z" class="w-ptr"/></svg>' +
      '<div id="lever" class="int" role="slider" tabindex="0" aria-label="Traffic" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" style="left:-60px;top:230px"><div class="slot"></div><div class="knob"><span>' + F.L.lever + '</span></div><small>' + F.L.traffic + '</small></div>' +
      '<div class="wstat" id="wstat"></div></div>';
  }

  /* ----- bricks ----- */
  S.brick = function (id) {
    var b = S.bricksEl.querySelector('[data-id="' + id + '"]'); if (b) return b;
    var def = PF.BY[id], c = cat(id), ci = def.c, r = RECTS[ci], w = r[2] * K, hh = r[3] * K;
    b = document.createElement('div'); b.className = 'brick int'; b.dataset.id = id; b.tabIndex = -1;
    b.innerHTML = '<div class="bi"><div class="art" style="width:' + w + 'px;height:' + hh + 'px;left:' + ((200 - w) / 2) + 'px;top:' + ((190 - hh) / 2) + 'px;background-position:' + (-r[0] * K) + 'px ' + (-r[1] * K) + 'px"></div>' +
      '<div class="fbk" style="--bc:' + c.col + '"><s></s><s></s><s></s><s></s></div></div><div class="tg">' + def.n.split(': ')[0].toUpperCase() + '</div>';
    b.style.setProperty('--bc', c.col); S.bricksEl.appendChild(b);
    S.pos[id] = { x: 0, y: 0, r: 0, s: 0 }; S.place(id, { x: -500, y: -500, r: 0, s: 0 }); b.style.display = 'none';
    return b;
  };
  S.place = function (id, p) {
    var b = S.brick(id), o = S.pos[id]; o.x = p.x; o.y = p.y; o.r = p.r || 0; o.s = p.s == null ? 1 : p.s;
    b.style.transform = 'translate3d(' + (p.x - 100).toFixed(1) + 'px,' + (p.y - 95).toFixed(1) + 'px,0) rotate(' + o.r.toFixed(1) + 'deg) scale(' + o.s.toFixed(3) + ')';
    b.style.display = o.s <= 0.001 ? 'none' : '';
  };
  S.hideBrick = function (id) { var b = S.brick(id); b.style.display = 'none'; S.pos[id].s = 0; };
  S.hideAll = function () { [].forEach.call(S.bricksEl.children, function (b) { b.style.display = 'none'; S.pos[b.dataset.id].s = 0; b.classList.remove('hl', 'clash'); }); };
  S.squashBrick = function (id, amp) {
    var a = S.brick(id).querySelector('.bi'); a.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(' + (1 + amp * 0.5) + ',' + (1 - amp) + ')' }, { transform: 'scale(' + (1 - amp * 0.3) + ',' + (1 + amp * 0.5) + ')' }, { transform: 'scale(1,1)' }], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  };
  S.pegHang = function (hung, opts) { // hung: array of ids that sit on the pegboard
    F.PEG.forEach(function (id, i) { var p = S.pegPos(i); if (hung.indexOf(id) >= 0) { S.place(id, { x: p.x, y: p.y, r: (i % 3 - 1) * 2, s: 0.8 }); S.brick(id).classList.add('labelled'); } else S.hideBrick(id); });
  };
  S.setTower = function (ids) { S.towerIds = ids.slice(); ids.forEach(function (id, i) { var p = S.towerPos(i); S.place(id, p); S.brick(id).classList.remove('labelled'); }); };
  S.setRail = function (ids) { ids.forEach(function (id, i) { S.place(id, S.railPos(i)); S.brick(id).classList.remove('labelled'); }); };

  /* ----- Forge: face, speech, squash ----- */
  var EYE = '#9FF3FF';
  var FACES = {
    happy: ['<path d="M46 100 Q66 72 86 100 M146 100 Q166 72 186 100"/>', '<path d="M96 126 Q116 148 136 126"/>'],
    wink:  ['<circle cx="66" cy="92" r="12" class="f"/><path d="M146 98 Q166 74 186 98"/>', '<path d="M90 122 Q116 156 142 122"/>'],
    flat:  ['<path d="M46 92 H86 M146 92 H186"/>', '<path d="M96 134 H136"/>'],
    cool:  ['<path d="M36 84 H98 M134 84 H196" class="th"/>', '<path d="M96 132 Q120 142 140 124"/>'],
    soft:  ['<circle cx="66" cy="94" r="15"/><circle cx="166" cy="94" r="15"/><path d="M44 66 L84 78 M188 66 L148 78"/>', '<path d="M100 130 Q116 140 132 130"/>'],
    smirk: ['<path d="M46 98 H86 M146 98 H186" class="th"/><circle cx="76" cy="88" r="5" class="f"/>', '<path d="M96 132 Q120 136 140 118"/>'],
    x:     ['<path d="M50 74 L82 106 M82 74 L50 106 M150 74 L182 106 M182 74 L150 106"/>', '<path d="M92 136 Q104 120 116 136 T140 136"/>'],
    wobble:['<circle cx="66" cy="92" r="16"/><circle cx="166" cy="92" r="9"/><path d="M60 92 L72 92"/>', '<path d="M92 134 L104 122 L116 136 L128 122 L142 134"/>'],
    oh:    ['<circle cx="66" cy="92" r="10" class="f"/><circle cx="166" cy="92" r="10" class="f"/>', '<ellipse cx="116" cy="134" rx="13" ry="12"/>'],
    think: ['<circle cx="72" cy="84" r="10" class="f"/><circle cx="172" cy="84" r="10" class="f"/>', '<path d="M100 134 H132"/>']
  };
  S.face = function (name) {
    var f = FACES[name] || FACES.happy; S.curFace = name;
    $('#eyes').innerHTML = f[0]; $('#mouth').innerHTML = f[1];
    S.faceEl.animate([{ transform: 'scale(1.0)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  };
  S.say = function (text, ms) {
    var b = S.bubble, sp = b.firstChild; clearTimeout(S._sayT);
    if (!text) { b.classList.remove('on'); return; }
    sp.textContent = text; b.classList.add('on'); b.animate([{ transform: 'scale(.6) rotate(-4deg)' }, { transform: 'scale(1.06) rotate(1deg)' }, { transform: 'scale(1) rotate(0)' }], { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    if (ms) S._sayT = setTimeout(function () { b.classList.remove('on'); }, ms);
  };
  S.bounce = function (amp) {
    amp = amp || 0.1; if (PF.reduced) return;
    S.forge.firstChild.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(' + (1 + amp * 0.5) + ',' + (1 - amp) + ')', offset: 0.25 }, { transform: 'scale(' + (1 - amp * 0.4) + ',' + (1 + amp * 0.6) + ') translateY(-14px)', offset: 0.55 }, { transform: 'scale(1,1)' }], { duration: 520, easing: 'ease-out' });
  };
  S.forgeAt = function (dy) { return { x: S.G.forge.cx, y: 1100 + (dy || 0) }; };

  /* ----- sticky notes (scene 1) ----- */
  S.buildNotes = function () {
    var n = $('#notes'), T = [['Be formal!', '#FFD166', -8], ['Use slang!', '#FF6B9A', 6], ['Be short', '#6BCBFF', -4], ['Be long', '#7BE0AD', 9], ['No jokes', '#FF9F43', -11], ['Joke more', '#9B7BFF', 5], ['Be nice', '#FFD166', 12], ['Be rude?', '#FF6B9A', -6]], h = '';
    var P = [[470, 1620], [660, 1700], [560, 1800], [780, 1650], [880, 1780], [1520, 1840], [1690, 1760], [1610, 1650]];
    T.forEach(function (t, i) { h += '<div class="sticky" data-i="' + i + '" style="left:' + P[i][0] + 'px;top:' + P[i][1] + 'px;--rot:' + t[2] + 'deg;background:' + t[1] + '"><span>' + t[0] + '</span><em></em></div>'; });
    h += '<div id="qm" class="q" style="left:1230px;top:780px">?</div>'; n.innerHTML = h;
  };
  S.notesShow = function (on) { $('#notes').classList.toggle('off', !on); };

  /* ----- receipt ----- */
  function textColor(col) { return PF.compiler.lum(col) > 0.55 ? '#2B2147' : '#FFF7E8'; }
  S.renderReceipt = function (res, root, o) { // builds rows; o.hide => rows hidden for progressive reveal
    o = o || {}; var h = '', first;
    res.sections.forEach(function (s, si) {
      if (!s.rows.length && !o.showEmpty) return;
      if (!s.rows.length) { h += '<div class="r-row empty"><span class="r-sec">' + s.name + '</span><span class="r-line">-</span></div>'; return; }
      s.rows.forEach(function (r, i) {
        var c = F.CATS[PF.BY[r.id] ? PF.BY[r.id].c : 0], col = r.id === '@compiler' ? '#2B2147' : c.col;
        h += '<div class="r-row' + (o.hide ? ' hid' : '') + '" data-id="' + r.id + '" data-n="' + r.n + '" style="--c:' + col + ';--t:' + textColor(col) + '" tabindex="0">' +
          '<span class="r-sec">' + (i === 0 ? s.name : '') + '</span><span class="r-line">' + r.t.replace(/</g, '&lt;') + '</span></div>';
      });
    });
    root.innerHTML = h; return root;
  };
  S.rowWorld = function (row) {
    var r = $('#receipt'), x = 0, y = 0, el = row;
    while (el && el !== r) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return { x: S.G.receipt.x + x, y: S.G.receipt.y + y + row.offsetHeight / 2 };
  };
  S.string = function (row, id, ms) { // string tag from a receipt line to its source brick on the rail
    var svg = $('#strings'), p = S.pos[id]; if (!p || p.s <= 0) return null; S.clearStrings();
    var a = S.rowWorld(row), b = { x: p.x, y: p.y + 30 }, d = 'M' + (a.x + 4) + ' ' + a.y + ' C' + (a.x - 260) + ' ' + (a.y + 40) + ',' + (b.x + 90) + ' ' + (b.y - 200) + ',' + b.x + ' ' + b.y;
    var pa = document.createElementNS('http://www.w3.org/2000/svg', 'path'); pa.setAttribute('d', d); pa.setAttribute('class', 'str'); svg.appendChild(pa);
    var L = pa.getTotalLength(); pa.style.strokeDasharray = L; pa.style.strokeDashoffset = L;
    pa.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: PF.reduced ? 1 : (ms || 420), easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    var tg = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); tg.setAttribute('cx', b.x); tg.setAttribute('cy', b.y); tg.setAttribute('r', 11); tg.setAttribute('class', 'str-end'); svg.appendChild(tg);
    var b0 = S.brick(id); b0.classList.add('hl', 'labelled'); S._hl = id; return pa;
  };
  S.clearStrings = function () { var s = $('#strings'); while (s.firstChild) s.removeChild(s.firstChild); if (S._hl) { var b = S.brick(S._hl); b.classList.remove('hl'); if (S.pos[S._hl].s <= 0.55) b.classList.remove('labelled'); S._hl = null; } };

  /* ----- key wheel parts ----- */
  S.buildWheelParts = function () {
    var d = $('#disc'), h = '', n = F.N.keys.v, i;
    for (i = 0; i < n; i++) {
      h += '<g class="key live" data-i="' + i + '" transform="rotate(' + (i * 360 / n) + ')"><g class="kslot" transform="translate(0,-250)">' +
        '<circle class="kring" r="44"/><path class="karc" d=""/>' +
        '<g class="kshape"><circle class="kbow" cx="0" cy="-12" r="22"/><circle cx="0" cy="-12" r="8" class="khole"/><rect class="kshaft" x="-6" y="8" width="12" height="46" rx="3"/><path class="kteeth" d="M6 38 H20 V46 H6 M6 24 H16 V30 H6"/></g>' +
        '<text class="klab" y="74" text-anchor="middle">' + (i + 1) + '</text><text class="kst" y="6" text-anchor="middle"></text></g></g>';
    }
    d.innerHTML = h; S.keyEls = [].slice.call(d.querySelectorAll('.key'));
  };

  /* panels helpers */
  S.chatSet = function (which, u, b) { var p = $('#p-' + which); p.querySelector('.msg.u').textContent = u || ''; p.querySelector('.msg.b').textContent = b || ''; p.querySelector('.msg.u').style.opacity = u ? 1 : 0; p.querySelector('.msg.b').style.opacity = b ? 1 : 0; };
})();
