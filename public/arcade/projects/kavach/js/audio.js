/* Synthesised Web Audio only. Muted by default. Gentle heartbeat, comic pow, soft chime. Never sirens or screams. */
(function () {
  var A = K.audio = { on: false, ctx: null, beat: 0 };
  try { A.on = localStorage.getItem('arc_snd') === '1'; } catch (e) {}
  function save(v) { try { localStorage.setItem('arc_snd', v ? '1' : '0'); } catch (e) {} }
  A.init = function () { if (!A.ctx) { var C = window.AudioContext || window.webkitAudioContext; if (C) A.ctx = new C(); } if (A.ctx && A.ctx.state === 'suspended') { try { A.ctx.resume(); } catch (e) {} } return !!A.ctx; };
  function startAmbient() { if (!A.on || !A.init()) return; A.heart(); if (!A.beat) A.beat = setInterval(A.heart, 1300); }
  if (A.on) {
    ['pointerdown', 'keydown'].forEach(function (ev) {
      document.addEventListener(ev, startAmbient, { capture: true, once: true, passive: true });
    });
  }
  function tone(f0, f1, dur, vol, type, delay) {
    var c = A.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  A.heart = function () { if (!A.on || !A.ctx) return; tone(70, 40, 0.16, 0.18); tone(62, 38, 0.2, 0.12, 'sine', 0.2); };
  A.pow = function () {
    if (!A.on || !A.ctx) return; var c = A.ctx, len = c.sampleRate * 0.22, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0), i;
    for (i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = 0.22;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(c.destination); s.start(); tone(240, 55, 0.25, 0.2, 'triangle');
  };
  A.chime = function () { if (!A.on || !A.ctx) return; tone(880, 880, 0.35, 0.08); tone(1320, 1320, 0.45, 0.06, 'sine', 0.09); };
  A.tick = function () { if (!A.on || !A.ctx) return; tone(500, 420, 0.05, 0.05, 'square'); };
  A.toggle = function () {
    if (!A.on) { A.on = true; save(true); startAmbient(); }
    else { A.on = false; save(false); clearInterval(A.beat); A.beat = 0; }
    return A.on;
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden && A.ctx && A.ctx.state === 'running') A.ctx.suspend(); else if (!document.hidden && A.on && A.ctx) A.ctx.resume(); });
})();
