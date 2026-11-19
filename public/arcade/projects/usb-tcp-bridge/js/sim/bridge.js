/* bridge.js: the simulated bridge. Framer, router, bounded queue, power model, fail-safe, motor. All SIMULATION. */
(function () {
  'use strict';
  var U = window.UTB, F = U.FACTS, Flow = U.Flow, S = U.Stage;
  var B = U.Bridge = {
    alive: true, screen: true, locks: true, client: true, wifi: 1, mode: 'bytes', hooks: {},
    buf: '', bufTr: false, chars: [], emitAcc: 0, charRate: 26, lineRate: 0, lineAcc: 0, loopI: 0,
    amb: { robot: 0, sensors: false, cmd: 0 }, ambT: { robot: 0, accel: 0, gps: 0, cmd: 0 },
    killT: 0, killAfter: 2, motor: { target: 0, w: 0, ang: 0 }, P: null
  };
  function sfx(n) { if (B.hooks.sfx) B.hooks.sfx(n); }
  function pt(path, s) { var o = path.at(s); return { x: o.x, y: o.y }; }

  B.init = function () {
    var P = B.P = S.paths;
    P.R1.onEnd = function (b) {
      var ch = b.ch, tr = b.tr; Flow.kill(b);
      if (!B.alive) { Flow.burst(1100, 870, 3, 3, 40, .4); return; }
      if (ch === '\u21B5') {
        var text = B.buf, t2 = B.bufTr; B.buf = ''; B.bufTr = false; S.setBuf(''); S.slam(); sfx('clank'); S.shake(3);
        Flow.burst(1200, 870, 10, 1, 140);
        Flow.spawn(P.F2R, { kind: 1, text: text, col: t2 ? 1 : 0, r: 10, tr: t2 });
      } else { B.buf += ch; B.bufTr = B.bufTr || tr; S.setBuf(B.buf); }
    };
    P.F2R.onEnd = function (b) {
      var us = b.text.indexOf('US:') === 0; S.lever(us ? 'us' : 'main'); sfx('clank');
      Flow.burst(1380, 870, 8, 1, 110); Flow.move(b, us ? P.US : P.MAIN, 0);
      if (B.hooks.routed) B.hooks.routed(b.text, us ? 'us' : 'main');
    };
    P.MAIN.onEnd = function (b) { S.log('main', b.text); sfx('blip'); Flow.burst(2660, 800, 8, b.col, 100); Flow.kill(b); };
    P.US.onEnd = function (b) { S.log('us', b.text); sfx('blip'); Flow.burst(2660, 700, 8, 1, 100); Flow.kill(b); };
    P.TELE.onEnd = function (b) { S.log('tele', b.text); Flow.kill(b); };
    P.GPS.onEnd = function (b) { S.log('gps', b.text); Flow.kill(b); };
    P.B.onEnd = function (b) { Flow.move(b, P.R2, 0); };
    P.FS.onEnd = function (b) { Flow.move(b, P.R2, 0); };
    P.R2.onEnd = function (b) { Flow.move(b, P.ML, 0); };
    P.ML.onEnd = function (b) {
      var t = b.text, m = /^M:(-?\d+),(-?\d+)/.exec(t);
      if (m) B.motor.target = (Math.abs(+m[1]) + Math.abs(+m[2])) / 2 / 100 * 7;
      if (b.kind === 4) { sfx('buzz'); S.shake(10); Flow.burst(520, 1212, 26, 2, 220, .8); if (B.hooks.stopped) B.hooks.stopped(); }
      else Flow.burst(520, 1212, 8, 1, 100);
      Flow.kill(b);
    };
    B.syncGates();
  };

  B.syncGates = function () {
    var open = B.alive && B.client && B.wifi > .02;
    B.P.MAIN.gates[0].open = open; B.P.MAIN.mul = B.alive ? Math.max(.0, B.wifi) : 0; S.valve(B.wifi > .02);
  };
  B.setWifi = function (v) { B.wifi = v; B.syncGates(); };
  B.toggleWifi = function () { B.setWifi(B.wifi > .02 ? 0 : 1); sfx('clank'); };

  /* senders */
  B.robotSend = function (text, tr) {
    var s = text + '\n';
    for (var i = 0; i < s.length; i++) B.chars.push({ ch: s[i] === '\n' ? '\u21B5' : s[i], tr: !!tr });
  };
  B.robotLine = function (text, tr) { Flow.spawn(B.P.F2R, { kind: 1, text: text, col: tr ? 1 : 0, r: 10, tr: !!tr }); };
  B.laptopSend = function (text, tr) {
    if (!B.client || !B.alive) { Flow.burst(2640, 860, 6, 2, 80); return false; }
    Flow.spawn(B.P.B, { kind: 3, text: text, col: tr ? 1 : 0, r: 10, tr: !!tr, v: 1.5 }); return true;
  };
  B.sensor = function (which, text, tr) {
    if (!B.alive) return;
    Flow.spawn(which === 'gps' ? B.P.GPS : B.P.TELE, { kind: 2, text: text, col: 0, r: 9, tr: !!tr });
  };
  B.motorSet = function (v) { B.motor.target = v; };

  /* service state */
  B.serviceOn = function (on, silent) { B.alive = on; S.lamp(on, false); B.syncGates(); if (!silent) sfx('blip'); };
  B.die = function () {
    if (!B.alive) return; B.alive = false; B.buf = ''; S.setBuf(''); S.lamp(false, true); S.tomb(true); B.syncGates();
    ['F2R', 'MAIN', 'US', 'TELE', 'GPS', 'B'].forEach(function (k) { Flow.clear(B.P[k]); });
    sfx('thud'); S.shake(8); Flow.burst(1650, 900, 30, 0, 200, 1);
  };
  B.revive = function () {
    if (B.alive) return; S.tomb(false); S.ring(); sfx('bell'); B.killT = 0;
    setTimeout(function () { B.alive = true; S.lamp(true, false); B.syncGates(); }, 450);
  };
  B.setScreen = function (on) { B.screen = on; S.screen(on); sfx('click'); };
  B.setLocks = function (on) { B.locks = on; S.toggle('wake', on); S.toggle('wifi', on); sfx('click'); };
  B.toggleLock = function (which) {
    /* the two locks act together in the model; each switch flips both so the story stays simple */
    B.setLocks(!B.locks);
  };
  B.failSafe = function () {
    if (!B.alive) return;
    Flow.spawn(B.P.FS, { kind: 4, text: 'M:0,0', col: 2, r: 15, tr: true, v: 1.5 }); sfx('click');
    if (B.hooks.failsafe) B.hooks.failsafe();
  };
  B.disconnectClient = function () {
    if (!B.client) return; B.client = false; S.client(false); B.syncGates(); sfx('click'); Flow.burst(2640, 830, 16, 2, 160);
    Flow.clear(B.P.B); B.failSafe();
  };
  B.reconnectClient = function () { if (B.client) return; B.client = true; S.client(true); B.syncGates(); sfx('click'); Flow.burst(2640, 830, 10, 1, 120); };
  B.killService = function () { if (!B.alive) return; B.failSafe(); setTimeout(B.die, 350); };
  B.plugBackIn = function () { if (B.alive) return; B.revive(); };

  B.reset = function () {
    Flow.clear(); B.chars.length = 0; B.buf = ''; S.setBuf(''); B.alive = true; B.client = true; B.wifi = 1; B.screen = true; B.locks = true;
    S.tomb(false); S.lamp(true); S.screen(true); S.toggle('wake', true); S.toggle('wifi', true); S.client(true); S.lever('main'); S.dropped(0);
    B.P.MAIN.dropped = 0; B.motor.target = 0; B.killT = 0; B.mode = 'bytes'; B.lineRate = 0;
    B.amb = { robot: 0, sensors: false, cmd: 0 }; B.ambT = { robot: 0, accel: .6, gps: 1.2, cmd: 0 }; B.syncGates(); S.clearLogs();
  };
  B.setAmb = function (o) { for (var k in o) B.amb[k] = o[k]; };

  B.update = function (dt) {
    var P = B.P, i;
    /* power model: screen off and no locks kills the service after a sped-up timer */
    if (B.alive && !B.screen && !B.locks) { B.killT += dt; if (B.killT >= B.killAfter) B.die(); } else if (B.alive) B.killT = 0;
    B.killFrac = B.alive && !B.screen && !B.locks ? B.killT / B.killAfter : 0;
    /* serial emitter */
    B.emitAcc += dt * B.charRate;
    while (B.emitAcc >= 1 && B.chars.length) {
      var tail = P.R1.beads.length ? P.R1.beads[P.R1.beads.length - 1].s : 999;
      if (tail < P.R1.gap) break;
      var c = B.chars.shift(); B.emitAcc -= 1;
      Flow.spawn(P.R1, { kind: 0, ch: c.ch, col: c.ch === '\u21B5' ? 1 : 3, r: 8, tr: c.tr });
    }
    if (!B.chars.length && B.emitAcc > 1) B.emitAcc = 1;
    /* line emitter (queue lab) */
    if (B.lineRate > 0 && B.alive) {
      B.lineAcc += dt * B.lineRate;
      while (B.lineAcc >= 1) { B.lineAcc -= 1; B.robotLine(F.samples.loop[B.loopI++ % F.samples.loop.length]); }
    }
    /* ambient scripts */
    var A = B.amb, T = B.ambT;
    if (A.robot) { T.robot -= dt; if (T.robot <= 0) { T.robot = A.robot; var line = F.samples.loop[B.loopI++ % F.samples.loop.length]; if (B.mode === 'lines') B.robotLine(line); else B.robotSend(line); } }
    if (A.sensors && B.alive) {
      T.accel -= dt; if (T.accel <= 0) { T.accel = 1.7; B.sensor('tele', F.samples.accel); }
      T.gps -= dt; if (T.gps <= 0) { T.gps = 2.6; B.sensor('gps', F.samples.gps); }
    }
    if (A.cmd && B.client && B.alive) { T.cmd -= dt; if (T.cmd <= 0) { T.cmd = A.cmd; B.laptopSend(F.samples.m); } }
    /* queue meter and drop counter */
    S.setQ(P.MAIN.count, 16);
    if (B.lastDrop !== P.MAIN.dropped) { B.lastDrop = P.MAIN.dropped; S.dropped(P.MAIN.dropped); }
    /* motor wheel: spring toward target */
    var m = B.motor; m.w += (m.target - m.w) * (1 - Math.exp(-dt * 3.4)); if (m.target === 0 && m.w < .02) m.w = 0;
    m.ang += m.w * 57.3 * dt; S.wheel(m.ang);
  };
  /* queue drop hook: pop at the front of the queue */
  B.hookDrops = function () {
    B.P.MAIN.onDrop = function (b) { var p = pt(B.P.MAIN, b.s); Flow.burst(p.x, p.y, 14, 2, 170, .5); sfx('pop'); S.shake(2); };
  };
})();
