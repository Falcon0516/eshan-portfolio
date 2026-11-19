/* Synthesised sound only. Muted by default. AudioContext is created after a user gesture. */
(function () {
  'use strict';
  var ctx = null, on = false;
  try { on = localStorage.getItem('arc_snd') === '1'; } catch (e) {}
  function save(v) { try { localStorage.setItem('arc_snd', v ? '1' : '0'); } catch (e) {} }
  function ensure() { if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (C) ctx = new C(); } if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} } return ctx; }
  if (on) {
    ['pointerdown', 'keydown'].forEach(function (ev) {
      document.addEventListener(ev, function () { if (on) ensure(); }, { capture: true, once: true, passive: true });
    });
  }
  function tone(f, d, type, vol, slide) {
    if (!on || !ensure()) return;
    var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + d + 0.02);
  }
  window.Sound = {
    toggle: function () { on = !on; save(on); if (on) { ensure(); tone(660, 0.12, 'square', 0.04); } return on; },
    sync: function () { try { on = localStorage.getItem('arc_snd') === '1'; } catch (e) {} return on; },
    isOn: function () { return on; },
    ping: function () { tone(1400, 0.12, 'sine', 0.04, 900); },
    beep: function () { tone(520, 0.08, 'square', 0.03); setTimeout(function () { tone(780, 0.1, 'square', 0.03); }, 90); },
    click: function () { tone(220, 0.05, 'square', 0.04); },
    alarm: function () { tone(300, 0.18, 'sawtooth', 0.035, 200); setTimeout(function () { tone(300, 0.18, 'sawtooth', 0.035, 200); }, 220); },
    static_: function () { tone(90, 0.25, 'sawtooth', 0.02, 60); }
  };
})();
