/* Synthesised sound, muted by default. AudioContext is created only after a user gesture (M key). */
window.VFAudio = (function () {
  var ctx = null, on = false, master = null;
  function init() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
  }
  function tone(f, d, type, vol, slide) {
    if (!on || !ctx) return; var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(vol || 0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.02);
  }
  function noise(d, vol, freq) {
    if (!on || !ctx) return; var n = ctx.sampleRate * d, buf = ctx.createBuffer(1, n, ctx.sampleRate), data = buf.getChannelData(0);
    for (var i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.frequency.value = freq || 800; g.gain.value = vol || 0.3; s.buffer = buf; s.connect(f); f.connect(g); g.connect(master); s.start();
  }
  return {
    toggle: function () { init(); if (!ctx) return false; on = !on; if (on && ctx.state === 'suspended') ctx.resume(); return on; },
    isOn: function () { return on; },
    stamp: function () { tone(90, 0.18, 'sine', 0.6, 40); noise(0.12, 0.4, 600); },
    bell: function () { tone(880, 0.9, 'sine', 0.25); tone(1320, 0.7, 'sine', 0.12); },
    horn: function () { tone(220, 0.35, 'sawtooth', 0.12); tone(277, 0.35, 'sawtooth', 0.1); },
    clack: function () { tone(520, 0.05, 'square', 0.12, 260); },
    pass: function () { tone(660, 0.12, 'triangle', 0.2); setTimeout(function () { tone(880, 0.16, 'triangle', 0.18); }, 90); },
    fail: function () { tone(150, 0.3, 'sawtooth', 0.2, 70); }
  };
})();
