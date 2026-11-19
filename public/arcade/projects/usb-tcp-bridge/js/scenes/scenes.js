/* scenes.js: five Present scenes = five camera positions on the same stage. Each autoplays its key beat. */
(function () {
  'use strict';
  var U = window.UTB, F = U.FACTS, S = U.Stage, B = U.Bridge, UI = U.UI, Flow = U.Flow;
  var timers = [];
  var Dir = U.Dir = {
    at: function (ms, fn) { timers.push(setTimeout(fn, ms)); },
    clear: function () { timers.forEach(clearTimeout); timers.length = 0; }
  };
  function count(from, to, ms, set) {
    var t0 = performance.now(); (function f() { var t = Math.min(1, (performance.now() - t0) / ms); set(Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)))); if (t < 1) requestAnimationFrame(f); })();
  }
  function reduced() { return S.reduced; }

  var scenes = U.Scenes = [
    { /* 1 A WIRE */
      cam: { x: 1630, y: 960, w: 3300, r: -.3 },
      enter: function () {
        B.reset(); B.serviceOn(false, true); B.mode = 'bytes'; S.lamp(false, false); S.conn(false); S.drawOn();
        S.plugTo(700, 430, 0, 0); S.note(F.scenes[0].plug, 140, -60);
        Dir.at(1900, function () { S.note(''); S.plugTo(985, 900, 90, 700, 150); });
        Dir.at(2650, function () { S.conn(true); B.hooks.sfx('click'); Flow.burst(1100, 900, 22, 1, 200, .5); S.shake(4); });
        Dir.at(3100, function () { S.ring(); B.hooks.sfx('bell'); S.plugTo(880, 540, 0, 800, 100); });
        Dir.at(3800, function () { B.serviceOn(true); S.lamp(true); S.note(F.scenes[0].plug, 140, -60); });
        ['main', 'tele', 'gps', 'us'].forEach(function (k, i) { Dir.at(4100 + i * 280, function () { S.pulsePort(k); B.hooks.sfx('blip'); }); });
        Dir.at(5400, function () { B.setAmb({ robot: 1.6, sensors: true }); });
      }
    },
    { /* 2 SORT BYTES */
      cam: { x: 1450, y: 880, w: 1450, r: .3 },
      enter: function () {
        B.reset(); B.mode = 'bytes'; S.conn(true); S.clearLogs(); B.charRate = 24;
        S.plugTo(1010, 640, 0, 900, 90); S.note(F.scenes[1].plug, 130, -20);
        Dir.at(500, function () { B.robotSend(F.samples.us, true); });
        Dir.at(4300, function () { U.Stage.moveTo({ x: 2350, y: 880, w: 1500, r: -.2 }, 1100); });
        Dir.at(6200, function () { U.Stage.moveTo({ x: 1450, y: 880, w: 1450, r: .3 }, 1100); B.robotSend(F.samples.hello, true); });
        Dir.at(9800, function () { B.setAmb({ robot: 3 }); });
      }
    },
    { /* 3 NEVER BLOCK */
      cam: { x: 1800, y: 890, w: 1500, r: -.3 },
      enter: function () {
        B.reset(); B.mode = 'lines'; B.hookDrops(); S.conn(true); S.clearLogs(); B.lineRate = 7;
        S.plugTo(1250, 660, 0, 900, 90); S.note(F.scenes[2].plug, 130, -20);
        if (reduced()) S.qNum(1000); else count(0, 1000, 1100, S.qNum);
        Dir.at(1500, function () { B.setWifi(0); B.hooks.sfx('clank'); });
        Dir.at(8800, function () { B.setWifi(1); B.hooks.sfx('clank'); });
      }
    },
    { /* 4 STAY AWAKE */
      cam: { x: 1650, y: 900, w: 1700, r: .3 },
      enter: function () {
        B.reset(); B.mode = 'bytes'; S.conn(true); S.clearLogs(); B.motorSet(7); B.setAmb({ robot: 2.6, sensors: true, cmd: 2 });
        S.plugTo(2250, 590, 0, 900, 90); S.note(F.scenes[3].plug, -400, 10);
        Dir.at(900, function () { B.setScreen(false); });
        Dir.at(1700, function () { B.setLocks(false); });
        Dir.at(6800, function () { B.revive(); });
        Dir.at(7700, function () { B.setLocks(true); B.setAmb({ robot: 2.6, sensors: true, cmd: 2 }); });
        Dir.at(8600, function () { S.moveTo({ x: 1585, y: 1090, w: 2700, r: -.3 }, 1200); });
        Dir.at(10300, function () { B.disconnectClient(); });
      }
    },
    { /* 5 REALITY */
      cam: { x: 1630, y: 960, w: 3300, r: .4 },
      enter: function () {
        B.reset(); B.setAmb({ robot: 3, sensors: true }); S.plugTo(2900, 520, 0, 900, 90); S.note(F.scenes[4].plug, -150, -110);
        Dir.at(900, function () { UI.reality(true); S.plugShrug(); });
      }
    }
  ];
})();
