/* Scenes = camera positions over one stage. Each beat autoplays on entry; Enter replays. */
(function () {
  'use strict';
  var D = window.Draw, S = D.sim, view = D.view, rig = D.rig, link = D.link, bug = D.bug, UI = window.UI;
  function ob(x, y, k, r) { return { x: x, y: y, k: k, r: r || 0.6, squash: 0 }; }
  var touched = false; UI.onDial = function () { touched = true; };
  function guard(fn) { return function () { touched = true; fn.apply(null, arguments); }; }
  function pid(name) { S.preset(name); UI.syncDials(S); }
  function fire(st, key, cond, fn) { if (!st[key] && cond) { st[key] = 1; fn(); } }
  function resetRig(d) { rig.d = d; rig.shown = d; rig.target = -1; rig.cut = false; rig.age = 0; rig.sf.latched = false; rig.sf.manual = false; rig.sf.state = 'CLEAR'; rig.last = 'CLEAR'; rig.squash = 0; }
  function sw_pid() {
    return [{ label: 'AGGRESSIVE', fn: guard(function () { pid('aggressive'); }) }, { label: 'SLEEPY', fn: guard(function () { pid('sleepy'); }) },
      { label: 'JUST RIGHT', fn: guard(function () { pid('right'); }) }, { label: 'GUST', fn: guard(function () { S.gust = 2.2; }) },
      { label: 'RESTART', fn: guard(function () { S.reset(3, 13, -1.2); S.setWaypoints([[16, 4]]); }) }];
  }
  var fieldObs = function () { return [ob(8, 3.5, 3, 0.6), ob(11.5, 11, 2, 0.7), ob(15, 13.5, 0, 0.6), ob(5, 6, 4, 0.6)]; };

  var Scenes = [
    { /* 0 LAUNCH */
      cam: { wx: 1280, wy: 720, z: 1, fx: 0.5, fy: 0.5 },
      setup: function () { view.cones = false; view.hud = false; view.bMode = 'plot'; S.reset(0.8, 12.5, -0.35); S.obs = [ob(8, 3, 3, 0.5), ob(17, 15, 0, 0.5), ob(4, 5, 2, 0.5)]; pid('right'); S.setWaypoints([[16, 9]]); UI.rack(false); UI.switches([]); },
      tick: function (t, st) {
        var c = document.getElementById('count');
        if (st.auto) {
          var n = 3 - Math.floor(t / 0.9); c.textContent = n > 0 ? n : 'GO'; c.style.opacity = t > 3.0 ? 0 : 0.9;
          fire(st, 'open', t > 3.1, function () { document.getElementById('sun').classList.add('open'); UI.rovy(false); UI.say(window.FACTS.scenes[0].rovy); window.Sound.beep(); });
        }
      },
      sunClosed: true
    },
    { /* 1 EARS */
      cam: { wx: 525, wy: 429, z: 2.45, fx: 0.68, fy: 0.46 },
      setup: function () { view.cones = true; view.hud = 'us'; view.bMode = 'plot'; S.reset(3.5, 8.3, 0); S.obs = [ob(6.0, 6.0, 0, 0.55), ob(6.4, 8.3, 2, 0.6), ob(5.8, 10.7, 3, 0.55)]; S.state = 'IDLE'; UI.rack(false); UI.switches([]); },
      tick: function (t, st) { if (st.auto && t > 4.5) { S.obs[1].x = Math.max(4.9, 6.4 - (t - 4.5) * 0.35); } }
    },
    { /* 2 BRAIN */
      cam: { wx: 1281, wy: 429, z: 2.45, fx: 0.68, fy: 0.46 },
      setup: function () { view.bMode = 'link'; link.cut = false; D.up.gate.open = true; UI.rack(false); UI.switches([{ label: 'CUT LINK', fn: guard(function () { toggleLink(); }) }]); },
      tick: function (t, st) { if (st.auto) { fire(st, 'cut', t > 5, function () { if (!touched) toggleLink(true); }); fire(st, 'fix', t > 8.5, function () { if (!touched && link.cut) toggleLink(false); }); } }
    },
    { /* 3 PID */
      cam: { wx: 905, wy: 440, z: 1.32, fx: 0.66, fy: 0.45 },
      setup: function () { view.cones = true; view.hud = true; view.bMode = 'plot'; S.obs = []; S.reset(3, 13, -1.2); pid('aggressive'); S.setWaypoints([[16, 4]]); touched = false; UI.buildDials(S); UI.rack(true, true); UI.switches(sw_pid()); },
      tick: function (t, st) {
        if (!st.auto || touched) return;
        fire(st, 'b', t > 6, function () { S.reset(3, 13, -1.2); pid('right'); S.setWaypoints([[16, 4]]); });
      }
    },
    { /* 4 SAFETY */
      cam: { wx: 2031, wy: 880, z: 1.5, fx: 0.78, fy: 0.5 },
      setup: function () { resetRig(90); UI.rack(false, true); UI.switches([{ label: 'CUT CABLE', fn: guard(function (b) { rig.cut = !rig.cut; b.textContent = rig.cut ? 'REPAIR CABLE' : 'CUT CABLE'; }) }, { label: 'RESET CRATE', fn: guard(function () { resetRig(90); }) }]); },
      tick: function (t, st) {
        if (!st.auto || touched) return;
        fire(st, 'a', t > 1, function () { rig.target = 6; });
        fire(st, 'b', t > 5, function () { rig.target = 21; });
        fire(st, 'c', t > 7.2, function () { rig.target = 40; });
        fire(st, 'd', t > 10, function () { rig.cut = true; });
      }
    },
    { /* 5 BUG */
      cam: { wx: 1281, wy: 429, z: 2.45, fx: 0.68, fy: 0.46 },
      setup: function () { view.bMode = 'bug'; bug.fixed = false; bug.ran = false; bug.t = 0; UI.rack(false, true);
        UI.switches([{ label: 'RUN PLANNER', fn: guard(function () { runPlanner(); }) }, { label: 'FIX KEYS', fn: guard(function () { bug.fixed = true; runPlanner(); }) }, { label: 'BREAK AGAIN', fn: guard(function () { bug.fixed = false; bug.ran = false; }) }]); },
      tick: function (t, st) {
        if (!st.auto || touched) return;
        fire(st, 'r', t > 1.8, function () { runPlanner(); });
        fire(st, 'f', t > 6.5, function () { bug.fixed = true; runPlanner(); });
      }
    },
    { /* 6 REALITY */
      cam: { wx: 1280, wy: 600, z: 1.12, fx: 0.5, fy: 0.3 },
      dock: true,
      setup: function () { view.cones = true; view.hud = false; view.bMode = 'plot'; S.obs = fieldObs(); S.reset(3, 12, -0.5); pid('right'); S.setWaypoints([[16, 5], [4, 3], [14, 13]]); UI.rack(false); UI.switches([]); },
      tick: function () {}
    }
  ];
  function runPlanner() { bug.ran = true; bug.line = bug.fixed ? 'SLOW. Obstacle ahead.' : 'ALL CLEAR. Drive on.'; }
  function toggleLink(v) { link.cut = v === undefined ? !link.cut : v; D.up.gate.open = !link.cut; if (link.cut) link.cutAt = D.t; window.Sound.click(); }
  Scenes.link = toggleLink; Scenes.touch = function () { touched = true; }; Scenes.resetTouch = function () { touched = false; };

  /* Explore tabs reuse the same setups without autoplay. */
  Scenes.explore = [
    { label: 'FIELD', head: 'FIELD ROVER', labels: ['PID', 'bearing', 'GPS'], cam: { wx: 525, wy: 429, z: 2.75, fx: 0.62, fy: 0.46 },
      setup: function () { view.cones = true; view.hud = true; view.bMode = 'plot'; S.obs = fieldObs(); S.reset(3, 13, -1.0); pid('right'); S.wp = []; S.state = 'IDLE'; UI.buildDials(S); UI.rack(true, true);
        UI.switches([{ label: 'CLEAR ROUTE', fn: function () { S.reset(3, 13, -1.0); S.wp = []; } }, { label: 'AGGRESSIVE', fn: function () { pid('aggressive'); } }, { label: 'SLEEPY', fn: function () { pid('sleepy'); } }, { label: 'JUST RIGHT', fn: function () { pid('right'); } }, { label: 'GUST', fn: function () { S.gust = 2.2; } }]); } },
    { label: 'PID', idx: 3 }, { label: 'SAFETY', idx: 4 }, { label: 'BUG LAB', idx: 5 }
  ];
  window.Scenes = Scenes;
})();
