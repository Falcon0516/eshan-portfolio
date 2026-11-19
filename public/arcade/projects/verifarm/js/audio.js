/* Synthesised sound with global Arcade persistence. AudioContext starts on user gesture. */
window.VFAudio = (function () {
  var ctx = null, on = false, master = null;
  try { on = localStorage.getItem('arc_snd') === '1'; } catch (e) {}
  function save(v) { try { localStorage.setItem('arc_snd', v ? '1' : '0'); } catch (e) {} }
  function init() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    }
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
  }
  function unlock() { if (on) init(); }
  if (on) {
    ['pointerdown', 'keydown'].forEach(function (ev) {
      document.addEventListener(ev, unlock, { capture: true, once: true, passive: true });
    });
  }
  function tone(f, d, type, vol, slide) {
    if (!on) return; if (!ctx) init(); if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(vol || 0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.02);
  }
  function noise(d, vol, freq) {
    if (!on) return; if (!ctx) init(); if (!ctx) return;
    var n = Math.floor(ctx.sampleRate * d), buf = ctx.createBuffer(1, n, ctx.sampleRate), data = buf.getChannelData(0);
    for (var i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.frequency.value = freq || 800; g.gain.value = vol || 0.3; s.buffer = buf; s.connect(f); f.connect(g); g.connect(master); s.start();
  }
  return {
    toggle: function () { on = !on; save(on); if (on) init(); return on; },
    sync: function () { try { on = localStorage.getItem('arc_snd') === '1'; } catch (e) {} return on; },
    isOn: function () { return on; },
    stamp: function () { tone(90, 0.18, 'sine', 0.6, 40); noise(0.12, 0.4, 600); },
    bell: function () { tone(880, 0.9, 'sine', 0.25); tone(1320, 0.7, 'sine', 0.12); },
    horn: function () { tone(220, 0.35, 'sawtooth', 0.12); tone(277, 0.35, 'sawtooth', 0.1); },
    clack: function () { tone(520, 0.05, 'square', 0.12, 260); },
    pass: function () { tone(660, 0.12, 'triangle', 0.2); setTimeout(function () { tone(880, 0.16, 'triangle', 0.18); }, 90); },
    fail: function () { tone(150, 0.3, 'sawtooth', 0.2, 70); }
  };
})();
