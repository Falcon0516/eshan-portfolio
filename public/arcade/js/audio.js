/* Synthesised Web Audio only. Muted by default. Context is created after a user gesture. */
(function (A) {
  var ctx = null, master = null, muted = true, loopId = 0, step = 0;
  function ensure() {
    if (!ctx) {
      try { var C = window.AudioContext || window.webkitAudioContext; ctx = new C(); master = ctx.createGain(); master.gain.value = 0.45; master.connect(ctx.destination); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  function tone(f, d, type, vol, slide, when) {
    var t = ctx.currentTime + (when || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + d);
    g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.03);
  }
  function noise(d, vol, f0, f1) {
    var n = Math.floor(ctx.sampleRate * d), b = ctx.createBuffer(1, n, ctx.sampleRate), data = b.getChannelData(0), i;
    for (i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = b; fl.type = 'bandpass'; fl.frequency.setValueAtTime(f0 || 1800, ctx.currentTime);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, ctx.currentTime + d);
    g.gain.value = vol || 0.1; s.connect(fl); fl.connect(g); g.connect(master); s.start();
  }
  var ARP = [220, 277.2, 329.6, 440, 329.6, 277.2, 246.9, 311.1, 370, 493.9, 370, 311.1];
  function loop(on) {
    clearInterval(loopId); loopId = 0;
    if (on && !muted && ensure()) loopId = setInterval(function () { if (document.hidden || muted) return; tone(ARP[step++ % ARP.length], 0.16, 'square', 0.022); if (step % 4 === 1) tone(ARP[0] / 2, 0.3, 'triangle', 0.05); }, 210);
  }
  A.audio = {
    isMuted: function () { return muted; },
    setMuted: function (m) { muted = m; if (!m) { ensure(); } loop(!m && A.S && A.S.state === 'WORLD'); if (A.ui) A.ui.syncSound(); },
    loop: loop,
    play: function (n) {
      if (muted || !ensure()) return;
      switch (n) {
        case 'thunk': tone(110, 0.16, 'square', 0.14, 45); noise(0.1, 0.08, 400, 120); break;
        case 'on': noise(0.5, 0.07, 3000, 800); tone(60, 0.9, 'sawtooth', 0.03); break;
        case 'static': noise(0.35, 0.09, 2400, 600); break;
        case 'blip': tone(880, 0.07, 'square', 0.05); tone(1320, 0.07, 'square', 0.04, 0, 0.06); break;
        case 'step': tone(180 + Math.random() * 30, 0.04, 'square', 0.02); break;
        case 'creak': tone(140, 0.45, 'sawtooth', 0.04, 260); break;
        case 'whoosh': noise(0.6, 0.12, 500, 5000); tone(200, 0.6, 'sine', 0.05, 900); break;
        case 'coin': tone(988, 0.07, 'square', 0.06); tone(1319, 0.3, 'square', 0.06, 0, 0.07); break;
        case 'off': tone(900, 0.3, 'sawtooth', 0.06, 40); noise(0.3, 0.1, 4000, 200); break;
      }
    }
  };
})(window.A = window.A || {});
