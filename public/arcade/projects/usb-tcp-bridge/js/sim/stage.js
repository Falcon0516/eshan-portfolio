/* stage.js: ONE continuous blueprint stage. World SVG + assets + moving camera + Plug mascot + visual state setters. */
(function () {
  'use strict';
  var U = window.UTB, F = U.FACTS, Flow = U.Flow;
  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var Stage = U.Stage = {
    cam: { x: 1630, y: 960, z: .44, r: 0 }, reduced: reduced, vw: 0, vh: 0, portrait: false,
    act: function () {}, shk: { x: 0, y: 0, a: 0 }
  };

  /* ---------- pipe geometry (world units, 3200 x 1800) ---------- */
  var PIPES = Stage.PIPES = {
    R1: 'M630,800 C770,800 850,870 1010,870 L1200,870',
    F2R: 'M1200,870 L1380,870',
    MAIN: 'M1380,870 L2200,870 C2400,870 2450,800 2660,800',
    US: 'M1380,870 C1450,870 1440,700 1530,700 L2200,700 C2400,700 2450,700 2660,700',
    B: 'M2660,860 C2450,860 2400,930 2200,930 L1100,930',
    R2: 'M1100,930 L1010,930 C850,930 770,860 630,860',
    ML: 'M630,860 C580,900 520,1050 520,1212',
    TELE: 'M1440,1065 L2200,1065 C2400,1065 2450,940 2660,940',
    GPS: 'M1440,1160 L2200,1160 C2400,1160 2450,1000 2660,1000',
    FS: 'M1245,985 L1245,930 L1100,930'
  };
  var PIPE_X = { R1: 630, F2R: 1200, MAIN: 1380, US: 1500, B: 2300, R2: 900, ML: 560, TELE: 1600, GPS: 1700, FS: 1245 };
  var ROWS = { us: 708, main: 836, tele: 948, gps: 1008 };
  var PORTY = { us: 700, main: 800, tele: 940, gps: 1000 };

  /* ---------- tiny SVG string helpers ---------- */
  function rp(x, y, w, h, r) {
    r = r || 0;
    return 'M' + (x + r) + ',' + y + ' H' + (x + w - r) + ' Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + ' V' + (y + h - r) +
      ' Q' + (x + w) + ',' + (y + h) + ' ' + (x + w - r) + ',' + (y + h) + ' H' + (x + r) + ' Q' + x + ',' + (y + h) + ' ' + x + ',' + (y + h - r) +
      ' V' + (y + r) + ' Q' + x + ',' + y + ' ' + (x + r) + ',' + y + ' Z';
  }
  function cp(cx, cy, r) { return 'M' + (cx - r) + ',' + cy + ' a' + r + ',' + r + ' 0 1,0 ' + (2 * r) + ',0 a' + r + ',' + r + ' 0 1,0 ' + (-2 * r) + ',0'; }
  function dl(x) { return (0.15 + x / 3200 * 1.8).toFixed(2) + 's'; }
  function D(d, cls, x, extra) { return '<path class="' + cls + ' draw" pathLength="1" style="--d:' + dl(x) + '" d="' + d + '" ' + (extra || '') + '/>'; }
  function lab(x, y, txt, sc, o) {
    o = o || {};
    var t = o.term !== undefined ? o.term : (F.terms[txt] ? txt : null);
    return '<text class="lab ' + sc + (o.cls ? ' ' + o.cls : '') + '" x="' + x + '" y="' + y + '"' + (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') +
      (o.id ? ' id="' + o.id + '"' : '') + (t ? ' data-term="' + t + '" tabindex="-1" role="note" aria-label="' + t + '"' : '') + '>' + txt + '</text>';
  }
  function dim(x1, x2, y, text, sc) {
    var d = 'M' + x1 + ',' + y + ' H' + x2 + ' M' + x1 + ',' + (y - 18) + ' V' + (y + 18) + ' M' + x2 + ',' + (y - 18) + ' V' + (y + 18) +
      ' M' + (x1 + 30) + ',' + (y - 9) + ' L' + x1 + ',' + y + ' L' + (x1 + 30) + ',' + (y + 9) + ' M' + (x2 - 30) + ',' + (y - 9) + ' L' + x2 + ',' + y + ' L' + (x2 - 30) + ',' + (y + 9);
    return D(d, 'dm', x1) + lab((x1 + x2) / 2, y - 20, text, sc + ' hand', { anchor: 'middle' });
  }

  function worldSVG() {
    var h = '<svg id="world" xmlns="' + NS + '" width="3200" height="1800" viewBox="0 0 3200 1800" role="img" aria-label="Blueprint: robot, phone and four network ports">';
    /* construction lines */
    h += '<g class="cons">' + D('M520,870 H2740', 'cn', 520) + D('M1380,500 V1260', 'cn', 1380) + D('M1100,520 V1260', 'cn', 1100) + D('M2200,520 V1260', 'cn', 2200) + '</g>';
    /* dimensions */
    h += dim(80, 980, 625, 'ROBOT', 's1') + dim(1100, 2200, 505, 'ANDROID PHONE', 's1 s4') + dim(2690, 3180, 595, 'LAPTOP', 's1 s5');
    /* pipes */
    h += '<g id="pipes">';
    ['R1', 'F2R', 'MAIN', 'US', 'B', 'R2', 'ML', 'TELE', 'GPS', 'FS'].forEach(function (id) {
      h += '<g class="pipe" id="pg-' + id + '">' + D(PIPES[id], 'po', PIPE_X[id]) + D(PIPES[id], 'pi', PIPE_X[id], 'id="p-' + id + '"') + '</g>';
    });
    h += '</g>';
    /* phone: screen dim, service bar, doorbell */
    h += '<path id="scrDim" d="' + rp(1100, 570, 1100, 660, 70) + '"/>';
    h += D(rp(1250, 620, 700, 44, 10), 'ln', 1500) + '<circle id="lamp" cx="1282" cy="642" r="11"/>';
    h += lab(1312, 651, 'FOREGROUND SERVICE', 's1 s4') + lab(1935, 651, 'KOTLIN', 's1 s4', { anchor: 'end' });
    h += '<g id="bell"><g id="bellg"><path class="ln" d="M1045,578 Q1043,545 1060,538 Q1077,545 1075,578 Z"/><circle class="fillL" cx="1060" cy="589" r="6"/></g></g>';
    h += lab(1030, 556, 'USB_DEVICE_ATTACHED', 'attach', { anchor: 'end' }) + lab(1030, 590, 'FTDI \u00b7 CP210x \u00b7 CH34x', 'attach', { anchor: 'end', term: 'USB-SERIAL CHIPS' });
    /* usb-c connector end */
    h += '<g id="conn"><path class="ln thick" d="' + rp(1080, 850, 34, 100, 8) + '"/><path class="ln" d="M1092,872 H1102 M1092,928 H1102"/></g>';
    /* framer */
    h += D(rp(1168, 834, 64, 72, 8), 'ln', 1200);
    h += '<g id="blade"><polygon points="1186,770 1214,770 1214,838 1200,858 1186,838"/></g><text id="bufTxt" x="1200" y="754" text-anchor="middle"></text>';
    h += lab(1200, 722, 'FRAMING', 's2', { anchor: 'middle' });
    h += lab(1100, 800, 'READ BUFFER 4096 B', 's2', { anchor: 'end', term: 'SERIAL' }) + '<text class="src s2" x="1100" y="826" text-anchor="end">[USBManager]</text>';
    /* router */
    h += '<circle class="po2" cx="1380" cy="870" r="40"/><circle class="fillD" cx="1380" cy="870" r="31"/>';
    h += '<g id="lever"><path class="ln thick" d="M1380,870 H1410"/><circle class="fillY" cx="1413" cy="870" r="7"/></g>';
    h += lab(1380, 806, 'ROUTER', 's2 s3', { anchor: 'middle' });
    /* queue 1 (USB to TCP) and queue 2 (TCP to USB) */
    h += D(rp(1492, 838, 424, 64, 10), 'ln', 1700) + D(rp(1492, 900, 424, 60, 10), 'ln dimm', 1700);
    var c1 = '', c2 = '';
    for (var i = 0; i < 16; i++) {
      c1 += '<path class="cell" id="q1c' + i + '" d="' + rp(1503 + 25 * i, 846, 21, 48, 3) + '"/>';
      c2 += '<path class="cell dimm" d="' + rp(1503 + 25 * i, 906, 21, 48, 3) + '"/>';
    }
    h += '<g id="qcells">' + c1 + c2 + '</g>';
    h += '<text id="q1num" class="s3" x="1496" y="792">1000</text>' + lab(1680, 792, 'SLOTS', 's3') + '<text class="src s3" x="1700" y="1000">[DataBridge]</text>';
    h += lab(1496, 828, 'QUEUE', 's3') + lab(1500, 996, 'QUEUE', 's3');
    h += '<text id="qdrop" x="1916" y="792" text-anchor="end"></text>';
    /* wifi valve (gate) */
    h += '<g id="wifiV" class="int" tabindex="-1" role="button" aria-label="Wi-Fi valve: open or stall"><circle class="valveBody" cx="1935" cy="870" r="30"/>' +
      '<path class="valveSp" d="M1935,846 V894 M1911,870 H1959 M1918,853 L1952,887 M1952,853 L1918,887"/><circle class="valveHub" cx="1935" cy="870" r="7"/>' +
      '<path class="valveStem" d="M1935,840 V822 M1920,822 H1950"/></g>';
    h += lab(1935, 806, 'WI-FI', 's3', { anchor: 'middle' });
    h += lab(2330, 826, 'NODELAY', 's3', { anchor: 'middle' }) + lab(2420, 760, 'TCP', 's1 s3', { anchor: 'middle' });
    /* sensors */
    h += D(cp(1440, 1065, 26) + ' M1414,1065 H1466 M1440,1039 V1091', 'ln', 1440) + lab(1440, 1022, 'IMU', 's1', { anchor: 'middle' });
    h += D('M1440,1190 C1415,1165 1418,1138 1440,1138 C1462,1138 1465,1165 1440,1190 Z', 'ln', 1440) + '<circle class="fillL" cx="1440" cy="1160" r="6"/>' + lab(1440, 1228, 'GPS', 's1', { anchor: 'middle' });
    /* fail-safe box */
    h += '<path id="fsbox" class="ln" d="' + rp(1160, 985, 170, 52, 8) + '"/>' + lab(1245, 1020, 'FAIL-SAFE', 's4', { anchor: 'middle' });
    /* lock toggles */
    [['wake', 1090, 'WAKELOCK'], ['wifi', 1160, 'WIFILOCK']].forEach(function (t) {
      h += '<g id="tg-' + t[0] + '" class="tg int on" tabindex="-1" role="switch" aria-checked="true" aria-label="' + t[2] + '"><path class="slot" d="' + rp(1150, t[1], 76, 36, 18) + '"/>' +
        '<circle class="knob" cx="1168" cy="' + (t[1] + 18) + '" r="13"/></g>' + lab(1244, t[1] + 27, t[2], 's4 tgl');
    });
    /* laptop */
    h += D(rp(2690, 640, 490, 400, 16), 'ln thick', 2700) + D('M2650,1040 H3220 L3190,1082 H2680 Z', 'ln', 2800);
    h += '<path class="fillScr" d="' + rp(2690, 640, 490, 400, 16) + '"/>';
    [['us', '8004'], ['main', '1234'], ['tele', '8001'], ['gps', '8002']].forEach(function (p) {
      var k = p[0], y = ROWS[k];
      h += lab(2712, y, ':' + p[1], 'a portlab', { id: 'pl-' + k, term: 'PORT' }) + '<text class="logt" id="log-' + k + '" x="2712" y="' + (y + 34) + '"></text>';
      h += '<circle class="ring" id="pp-' + k + '" cx="2672" cy="' + PORTY[k] + '" r="18"/>';
      h += '<g class="port int" id="port-' + k + '" tabindex="-1" role="button" aria-label="Port ' + p[1] + '"><rect x="2640" y="' + (y - 34) + '" width="540" height="84" fill="transparent"/></g>';
    });
    h += '<g id="cplug" class="int" tabindex="-1" role="button" aria-label="Client cable: pull to disconnect"><path class="plugB" d="' + rp(2614, 772, 52, 120, 8) + '"/><path class="ln" d="M2628,800 H2652 M2628,864 H2652"/><path class="ln thick" d="M2614,832 H2590"/></g>';
    h += '<path class="ln dimm" d="' + rp(2664, 776, 24, 108, 4) + '"/>';
    /* motor wheel */
    h += '<g class="wheelg">' + D(cp(520, 1290, 78), 'ln thick', 520) + '<g id="wheel"><path class="tread" d="' + cp(520, 1290, 78) + '"/><path class="ln" d="' + cp(520, 1290, 52) + '"/>';
    for (var a = 0; a < 8; a++) { var an = a * Math.PI / 4; h += '<path class="ln" d="M' + (520 + Math.cos(an) * 12).toFixed(1) + ',' + (1290 + Math.sin(an) * 12).toFixed(1) + ' L' + (520 + Math.cos(an) * 52).toFixed(1) + ',' + (1290 + Math.sin(an) * 52).toFixed(1) + '"/>'; }
    h += '<circle class="fillY" cx="520" cy="1290" r="9"/></g>' + lab(520, 1424, 'MOTORS', 's4', { anchor: 'middle', term: null }) + '</g>';
    /* arduino ring */
    h += D('M410,785 a115,46 0 1,0 230,0 a115,46 0 1,0 -230,0', 'ln dsh', 525) + lab(525, 728, 'ARDUINO', 's1 s4', { anchor: 'middle' }) + lab(860, 770, 'USB-OTG', 's1 s2 s4', { anchor: 'middle' });
    /* compass rose */
    h += '<g id="compass">' + D(cp(3010, 300, 80), 'ln', 3000) + D('M3010,205 V395 M2915,300 H3105 M2943,233 L3077,367 M3077,233 L2943,367', 'ln', 3010) + '<path class="fillL" d="M3010,212 L3022,300 L3010,288 L2998,300 Z"/></g>';
    /* tombstone */
    h += '<g id="tomb"><path class="tombB" d="M1565,1002 V842 Q1565,745 1650,745 Q1735,745 1735,842 V1002 Z"/><circle class="skull" cx="1650" cy="832" r="34"/><rect class="skull" x="1635" y="856" width="30" height="18" rx="4"/>' +
      '<circle class="eye" cx="1637" cy="828" r="8"/><circle class="eye" cx="1663" cy="828" r="8"/><path class="eye2" d="M1650,840 L1645,850 H1655 Z M1641,865 V874 M1650,865 V874 M1659,865 V874"/>' +
      '<text class="hand tt" x="1650" y="920" text-anchor="middle">R.I.P.</text><text class="hand tt2" x="1650" y="962" text-anchor="middle">SERVICE</text>' +
      '<path class="ln" d="M1530,1004 Q1590,985 1650,1000 Q1710,985 1770,1004"/></g>';
    h += '</svg>';
    return h;
  }

  /* ---------- assets with graceful fallbacks ---------- */
  function asset(parent, cls, src, alt, fb) {
    var w = document.createElement('div'); w.className = 'asset ' + cls;
    var f = document.createElement('div'); f.className = 'fb'; f.innerHTML = fb; f.style.display = 'none';
    var im = new Image(); im.alt = alt; im.decoding = 'async';
    im.onerror = function () { im.style.display = 'none'; f.style.display = 'block'; };
    im.src = src; w.appendChild(im); w.appendChild(f); parent.appendChild(w); return w;
  }
  var FB_ROBOT = '<svg viewBox="0 0 900 506" width="100%" height="100%"><g fill="none" stroke="#BEE3FF" stroke-width="4"><rect x="150" y="200" width="600" height="150" rx="16"/><rect x="330" y="120" width="240" height="80" rx="8"/><circle cx="220" cy="380" r="70"/><circle cx="680" cy="380" r="70"/></g></svg>';
  var FB_PHONE = '<svg viewBox="0 0 660 1100" width="100%" height="100%"><rect x="20" y="20" width="620" height="1060" rx="70" fill="none" stroke="#BEE3FF" stroke-width="5"/><circle cx="110" cy="110" r="36" fill="none" stroke="#BEE3FF" stroke-width="4"/></svg>';
  var FB_PLUG = '<svg viewBox="0 0 240 240" width="100%" height="100%"><g fill="#072A4F" stroke="#BEE3FF" stroke-width="4"><rect x="82" y="10" width="76" height="70" rx="6"/><rect x="62" y="80" width="116" height="120" rx="22"/></g><circle cx="102" cy="140" r="9" fill="#F5FAFF"/><circle cx="138" cy="140" r="9" fill="#F5FAFF"/></svg>';

  /* ---------- build ---------- */
  Stage.build = function () {
    var cam = $('cam'), bg = $('bg');
    bg.innerHTML = '<div class="paper"><img alt="" src="assets/blueprint_paper.webp" onerror="this.style.display=\'none\'"></div>';
    cam.innerHTML = '';
    asset(cam, 'robot', 'assets/robot_blueprint.png', 'Line drawing of a four-wheeled robot rover with an Arduino board', FB_ROBOT);
    var ph = asset(cam, 'phone', 'assets/phone_blueprint.png', 'Line drawing of a smartphone', FB_PHONE);
    ph.querySelector('img').setAttribute('draggable', 'false');
    var holder = document.createElement('div'); holder.innerHTML = worldSVG(); cam.appendChild(holder.firstChild);
    var pg = document.createElement('div'); pg.id = 'plug';
    pg.innerHTML = '<div class="plugin"></div><div class="note" id="plugNote" aria-live="polite"></div>';
    cam.appendChild(pg);
    var inner = pg.querySelector('.plugin');
    asset(inner, 'plugimg', 'assets/plug_mascot.png', 'Plug, a tiny USB connector character with two eyes', FB_PLUG);
    Stage.world = $('world'); Stage.plugEl = pg;
    Stage.plugState = { x: 700, y: 430, rot: 0, sx: 1, sy: 1 }; plugSet();
    /* flow paths sampled from the same geometry as the drawn pipes */
    var P = Stage.paths = {};
    P.R1 = Flow.addPath('R1', PIPES.R1, { gap: 24, speed: 640 });
    P.F2R = Flow.addPath('F2R', PIPES.F2R, { gap: 30, speed: 520 });
    P.MAIN = Flow.addPath('MAIN', PIPES.MAIN, { gap: 25, speed: 520 });
    P.US = Flow.addPath('US', PIPES.US, { gap: 30, speed: 520 });
    P.B = Flow.addPath('B', PIPES.B, { gap: 40, speed: 560 });
    P.R2 = Flow.addPath('R2', PIPES.R2, { gap: 40, speed: 560 });
    P.ML = Flow.addPath('ML', PIPES.ML, { gap: 40, speed: 560 });
    P.TELE = Flow.addPath('TELE', PIPES.TELE, { gap: 50, speed: 520 });
    P.GPS = Flow.addPath('GPS', PIPES.GPS, { gap: 50, speed: 520 });
    P.FS = Flow.addPath('FS', PIPES.FS, { gap: 40, speed: 560 });
    P.MAIN.gate(530, true); P.MAIN.queue(120, 16);
    bindInteractions();
    Stage.resize();
  };

  /* ---------- camera ---------- */
  function bez(x1, y1, x2, y2) {
    return function (t) {
      if (t <= 0) return 0; if (t >= 1) return 1;
      var lo = 0, hi = 1, x = .5;
      for (var i = 0; i < 18; i++) { x = (lo + hi) / 2; var u = 3 * x * (1 - x) * (1 - x) * x1 + 3 * x * x * (1 - x) * x2 + x * x * x; if (u < t) lo = x; else hi = x; }
      return 3 * x * (1 - x) * (1 - x) * y1 + 3 * x * x * (1 - x) * y2 + x * x * x;
    };
  }
  var ease = bez(.2, .8, .2, 1), tw = null;
  Stage.resize = function () {
    Stage.vw = window.innerWidth; Stage.vh = window.innerHeight; Stage.portrait = Stage.vw < Stage.vh * 1.05;
    if (Stage.target) { var z = Stage.zoomFor(Stage.target.w); Stage.cam.z = z; setLabelSize(z); }
    Stage.apply();
  };
  Stage.zoomFor = function (w) { if (Stage.portrait) w *= .6; return Math.min(Stage.vw / w, Stage.vh / (w * .625)); };
  Stage.origin = function () { return Stage.portrait ? { x: Stage.vw * .5, y: Stage.vh * .36 } : { x: Stage.vw * .55, y: Stage.vh * .42 }; };
  function setLabelSize(z) {
    var ls = Math.max(24, 15.5 / z), hs = Math.max(32, 22 / z);
    var s = Stage.world.style; s.setProperty('--ls', ls.toFixed(1) + 'px'); s.setProperty('--hs', hs.toFixed(1) + 'px');
  }
  Stage.moveTo = function (c, ms) {
    Stage.target = c;
    var z = Stage.zoomFor(c.w), to = { x: c.x, y: c.y, z: z, r: (c.r || 0) * Math.PI / 180 };
    setLabelSize(z);
    if (reduced || !ms) {
      var el = $('cam'); el.style.transition = 'none';
      Stage.cam.x = to.x; Stage.cam.y = to.y; Stage.cam.z = to.z; Stage.cam.r = to.r; tw = null; Stage.apply();
      if (reduced) { el.style.opacity = 0; el.getBoundingClientRect(); el.style.transition = 'opacity .35s'; el.style.opacity = 1; }
      return;
    }
    tw = { t0: performance.now(), d: ms, from: { x: Stage.cam.x, y: Stage.cam.y, z: Stage.cam.z, r: Stage.cam.r }, to: to };
    var f = $('fold'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  };
  Stage.shake = function (a) { if (!reduced) Stage.shk.a = Math.max(Stage.shk.a, a); };
  Stage.apply = function () {
    var c = Stage.cam, o = Stage.origin(), sx = Stage.shk.x, sy = Stage.shk.y;
    $('cam').style.transform = 'translate(' + (o.x + sx).toFixed(2) + 'px,' + (o.y + sy).toFixed(2) + 'px) rotate(' + c.r.toFixed(5) + 'rad) scale(' + c.z.toFixed(5) + ') translate(' + (-c.x).toFixed(2) + 'px,' + (-c.y).toFixed(2) + 'px)';
    /* background plate: slower parallax, always larger than the viewport */
    var pz = c.z * .8, px = 1600 + (c.x - 1600) * .6, py = 900 + (c.y - 900) * .6;
    $('bg').style.transform = 'translate(' + o.x.toFixed(1) + 'px,' + o.y.toFixed(1) + 'px) rotate(' + c.r.toFixed(5) + 'rad) scale(' + pz.toFixed(5) + ') translate(' + (-px).toFixed(1) + 'px,' + (-py).toFixed(1) + 'px)';
  };
  Stage.tick = function (now, dt) {
    if (tw) {
      var t = Math.min(1, (now - tw.t0) / tw.d), e = ease(t), c = Stage.cam, a = tw.from, b = tw.to;
      /* zoom interpolated in log space so it feels even */
      c.x = a.x + (b.x - a.x) * e; c.y = a.y + (b.y - a.y) * e; c.r = a.r + (b.r - a.r) * e;
      c.z = a.z * Math.pow(b.z / a.z, e);
      if (t >= 1) tw = null;
    }
    var s = Stage.shk; if (s.a > .05) { s.x = (Math.random() - .5) * s.a; s.y = (Math.random() - .5) * s.a; s.a *= Math.pow(.0009, dt); } else { s.a = 0; s.x = s.y = 0; }
    Stage.apply();
  };

  /* ---------- Plug the mascot ---------- */
  function ptf(s) { return 'translate(' + (s.x - 120) + 'px,' + (s.y - 120) + 'px) rotate(' + s.rot + 'deg) scale(' + s.sx + ',' + s.sy + ')'; }
  function plugSet() { Stage.plugEl.style.transform = ptf(Stage.plugState); }
  var plugAnim = null;
  Stage.plugTo = function (x, y, rot, ms, hop) {
    var s = Stage.plugState, to = { x: x, y: y, rot: rot, sx: 1, sy: 1 };
    if (plugAnim) { plugAnim.cancel(); plugAnim = null; }
    if (reduced || !ms) { Stage.plugState = to; plugSet(); return; }
    var mid = { x: (s.x + x) / 2, y: Math.min(s.y, y) - (hop === undefined ? 120 : hop), rot: (s.rot + rot) / 2, sx: .92, sy: 1.1 };
    var sq = { x: x, y: y, rot: rot, sx: 1.12, sy: .86 };
    plugEl().style.transform = ptf(s);
    plugAnim = plugEl().animate([{ transform: ptf(s) }, { transform: ptf(mid), offset: .5 }, { transform: ptf(sq), offset: .86 }, { transform: ptf(to) }],
      { duration: ms, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' });
    plugAnim.onfinish = function () { Stage.plugState = to; plugSet(); if (plugAnim) { plugAnim.cancel(); plugAnim = null; } };
  };
  function plugEl() { return Stage.plugEl; }
  Stage.plugShrug = function () {
    if (reduced) return; var s = Stage.plugState, a = { x: s.x, y: s.y, rot: s.rot, sx: 1, sy: 1 };
    var up = { x: s.x, y: s.y - 26, rot: s.rot - 7, sx: .96, sy: 1.06 }, up2 = { x: s.x, y: s.y - 20, rot: s.rot + 7, sx: .96, sy: 1.06 };
    plugEl().animate([{ transform: ptf(a) }, { transform: ptf(up) }, { transform: ptf(up2) }, { transform: ptf(a) }], { duration: 900, easing: 'ease-in-out' });
  };
  Stage.note = function (text, dx, dy) {
    var n = $('plugNote'); n.style.left = (dx === undefined ? 150 : dx) + 'px'; n.style.top = (dy === undefined ? -40 : dy) + 'px';
    n.classList.remove('pop'); void n.offsetWidth; n.textContent = text || ''; n.style.display = text ? 'block' : 'none'; if (text) n.classList.add('pop');
  };

  /* ---------- visual state setters (called by bridge and scenes) ---------- */
  var cells = [], lastCount = -1;
  Stage.scene = function (id) {
    document.body.setAttribute('data-scene', String(id));
    var labs = Stage.world.querySelectorAll('.lab[data-term]');
    requestAnimationFrame(function () {
      for (var i = 0; i < labs.length; i++) { var vis = parseFloat(getComputedStyle(labs[i]).opacity) > .5; labs[i].setAttribute('tabindex', vis ? '0' : '-1'); }
    });
  };
  Stage.setBuf = function (t) { $('bufTxt').textContent = t.length > 16 ? '\u2026' + t.slice(-15) : t; };
  Stage.slam = function () { var b = $('blade'); b.classList.remove('slam'); void b.getBoundingClientRect(); b.classList.add('slam'); };
  Stage.lever = function (dir) { $('lever').style.transform = dir === 'us' ? 'rotate(-38deg)' : 'rotate(0deg)'; };
  Stage.setQ = function (count, cap) {
    if (count === lastCount) return; lastCount = count;
    if (!cells.length) for (var k = 0; k < 16; k++) cells.push($('q1c' + k));
    for (var i = 0; i < 16; i++) cells[i].setAttribute('class', 'cell' + ((15 - i) < count ? (count >= cap ? ' full' : ' lit') : ''));
  };
  Stage.dropped = function (n) { var t = $('qdrop'); t.textContent = n ? 'DROPPED ' + n : ''; t.classList.remove('tick'); void t.getBoundingClientRect(); t.classList.add('tick'); };
  Stage.valve = function (open) { var v = $('wifiV'); v.classList.toggle('shut', !open); v.style.setProperty('--rot', open ? '0deg' : '90deg'); };
  Stage.lamp = function (on, dead) { var l = $('lamp'); l.setAttribute('class', on ? 'on' : (dead ? 'dead' : '')); };
  Stage.toggle = function (name, on) { var g = $('tg-' + name); g.classList.toggle('on', !!on); g.setAttribute('aria-checked', on ? 'true' : 'false'); };
  Stage.screen = function (on) { $('scrDim').classList.toggle('off', !on); };
  Stage.tomb = function (show) {
    var t = $('tomb'); t.classList.toggle('show', !!show);
    document.body.classList.toggle('svc-dead', !!show);
  };
  Stage.client = function (ok) {
    $('cplug').classList.toggle('out', !ok); $('pg-MAIN').classList.toggle('cut', !ok); $('pg-B').classList.toggle('cut', !ok);
    $('cplug').setAttribute('aria-label', ok ? 'Client cable: pull to disconnect' : 'Client cable: plug back in');
  };
  Stage.cableDrag = function (dx) { $('cplug').style.transform = 'translateX(' + dx.toFixed(1) + 'px)'; $('cplug').style.transition = 'none'; };
  Stage.cableRelease = function () { var c = $('cplug'); c.style.transition = ''; c.style.transform = ''; };
  Stage.ring = function () {
    var b = $('bell'); b.classList.remove('ring'); void b.getBoundingClientRect(); b.classList.add('ring');
    var l = Stage.world.querySelectorAll('.attach'); for (var i = 0; i < l.length; i++) l[i].classList.add('on');
    clearTimeout(Stage._ringT); Stage._ringT = setTimeout(function () { for (var j = 0; j < l.length; j++) l[j].classList.remove('on'); }, 3200);
  };
  Stage.conn = function (on) { $('conn').classList.toggle('on', !!on); };
  Stage.log = function (key, text, bad) {
    var t = $('log-' + key); if (!t) return;
    t.textContent = text.length > 21 ? text.slice(0, 20) + '\u2026' : text; t.classList.toggle('bad', !!bad);
    t.classList.remove('flash'); void t.getBoundingClientRect(); t.classList.add('flash');
    Stage.pulsePort(key);
  };
  Stage.clearLogs = function () { ['us', 'main', 'tele', 'gps'].forEach(function (k) { $('log-' + k).textContent = ''; }); };
  Stage.pulsePort = function (key) { var r = $('pp-' + key); if (!r) return; r.classList.remove('pulse'); void r.getBoundingClientRect(); r.classList.add('pulse'); };
  Stage.wheel = function (deg) { $('wheel').style.transform = 'rotate(' + deg.toFixed(1) + 'deg)'; };
  Stage.hlPort = function (key) {
    ['us', 'main', 'tele', 'gps'].forEach(function (k) { $('pl-' + k).classList.toggle('hl', k === key); });
    ['US', 'MAIN', 'B', 'TELE', 'GPS'].forEach(function (id) { $('pg-' + id).classList.remove('hl'); });
    if (key === 'us') $('pg-US').classList.add('hl');
    if (key === 'main') { $('pg-MAIN').classList.add('hl'); $('pg-B').classList.add('hl'); }
    if (key === 'tele') $('pg-TELE').classList.add('hl');
    if (key === 'gps') $('pg-GPS').classList.add('hl');
  };
  Stage.drawOn = function () { var w = Stage.world; w.classList.remove('drawn'); void w.getBoundingClientRect(); w.classList.add('drawn'); };
  Stage.qNum = function (v) { $('q1num').textContent = String(v); };

  /* ---------- direct manipulation on stage objects ---------- */
  function bindInteractions() {
    function act(name) { Stage.act(name); }
    function key(e, name) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); act(name); } }
    [['wifiV', 'wifi'], ['tg-wake', 'wake'], ['tg-wifi', 'wifilock']].forEach(function (p) {
      var el = $(p[0]); el.addEventListener('click', function (e) { e.stopPropagation(); act(p[1]); }); el.addEventListener('keydown', function (e) { key(e, p[1]); });
    });
    ['us', 'main', 'tele', 'gps'].forEach(function (k) {
      var el = $('port-' + k); el.addEventListener('click', function (e) { e.stopPropagation(); act('port:' + k); }); el.addEventListener('keydown', function (e) { key(e, 'port:' + k); });
    });
    var pl = $('cplug'), sx = 0, drag = false, moved = 0, id = 0;
    pl.addEventListener('pointerdown', function (e) { e.stopPropagation(); drag = true; sx = e.clientX; moved = 0; id = e.pointerId; try { pl.setPointerCapture(id); } catch (x) {} });
    pl.addEventListener('pointermove', function (e) {
      if (!drag) return; var dx = (e.clientX - sx) / Stage.cam.z; moved = Math.max(moved, Math.abs(dx));
      Stage.cableDrag(Math.max(-150, Math.min(40, dx)));
    });
    function end(e) {
      if (!drag) return; drag = false; var dx = (e.clientX - sx) / Stage.cam.z; Stage.cableRelease();
      var out = $('cplug').classList.contains('out');
      if (moved < 8 || (!out && dx < -45) || (out && dx > 20)) act('plug');
    }
    pl.addEventListener('pointerup', end); pl.addEventListener('pointercancel', function () { drag = false; Stage.cableRelease(); });
    pl.addEventListener('click', function (e) { e.stopPropagation(); });
    pl.addEventListener('keydown', function (e) { key(e, 'plug'); });
  }
})();
