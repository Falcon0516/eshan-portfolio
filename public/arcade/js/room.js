/* Room: CSS 3D living room, TV, power-on, dolly into the glass, boot sequence. */
(function (A) {
  var D = A.DATA, S = A.S = A.S || {}, tv, rig, screen, boot, dust, dctx, motes = [], mx = 0.5, my = 0.5, rx = 0, ry = 0, timers = [], mode = 'room', vw = 0, vh = 0, dustOn = true;
  A.view = { s: 1, visW: 1442, visH: 1090 };

  function T(m) {
    var s, cx, cy;
    if (m === 'room') { s = Math.min(vw * 0.56 / 2400, vh * 0.62 / 1600); cx = vw * 0.5 - 245 * s; cy = vh * 0.47; }
    else if (m === 'boot') {
      s = vw < vh ? Math.min(vw / 1442, vh / 1090) * 0.96 : Math.max(vw / 1442, vh / 1090) * 1.04;
      cx = vw / 2; cy = vh / 2; A.view.s = s; A.view.visW = vw / s; A.view.visH = vh / s;
    }
    else { s = Math.max(vw / 1442, vh / 1090) * 1.06; cx = vw / 2; cy = vh / 2; A.view.s = s; A.view.visW = vw / s; A.view.visH = vh / s; }
    return 'translate(' + (cx - s * 955).toFixed(2) + 'px,' + (cy - s * 799).toFixed(2) + 'px) scale(' + s.toFixed(4) + ')';
  }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearAll() { timers.forEach(clearTimeout); timers = []; }
  function size() { vw = window.innerWidth; vh = window.innerHeight; dust.width = vw; dust.height = vh; }

  A.room = {
    init: function () {
      tv = document.getElementById('tvwrap'); rig = document.getElementById('rig'); screen = document.getElementById('screen'); boot = document.getElementById('boot');
      dust = document.getElementById('dust'); dctx = dust.getContext('2d'); size();
      for (var i = 0; i < 46; i++) motes.push({ x: 0.45 + Math.random() * 0.5, y: 0.15 + Math.random() * 0.7, r: 1 + Math.random() * 2.2, p: Math.random() * 6.28, v: 0.003 + Math.random() * 0.01 });
      A.room.fit(S.state === 'WORLD' ? 'world' : 'room', true);
      window.addEventListener('mousemove', function (e) { mx = e.clientX / vw; my = e.clientY / vh; }, { passive: true });
      window.addEventListener('resize', function () {
        size();
        var st = S.state;
        if (st === 'TV_ON' || st === 'BOOT' || st === 'PRESS_START') A.room.fit('boot', true);
        else A.room.fit(mode, true);
      });
      document.getElementById('knob').addEventListener('click', function () { A.engine.powerOn(); });
    },
    fit: function (m, now) {
      mode = m; tv.classList.toggle('now', !!now); tv.style.transform = T(m);
      if (m === 'world' && now) { document.body.classList.add('inworld'); }
    },
    tick: function (dt, t) {
      if (!dustOn) return;
      if (S.state === 'ROOM_IDLE') { var tx = S.rm ? 0 : (my - 0.5) * -6, ty = S.rm ? 0 : (mx - 0.5) * 12; rx += (tx - rx) * 0.06; ry += (ty - ry) * 0.06; rig.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)'; }
      dctx.clearRect(0, 0, vw, vh);
      if (S.state !== 'ROOM_IDLE' && S.state !== 'TV_ON') return;
      dctx.fillStyle = 'rgba(255,217,160,.55)';
      for (var i = 0; i < motes.length; i++) { var m = motes[i]; m.p += dt * 0.6; m.y -= m.v * dt; m.x += Math.sin(m.p) * 0.0004; if (m.y < 0.1) m.y = 0.9; dctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(m.p * 1.3)); dctx.beginPath(); dctx.arc(m.x * vw, m.y * vh, m.r, 0, 6.283); dctx.fill(); }
      dctx.globalAlpha = 1;
    },
    /* knob click: switch-on, dolly into the glass, boot text */
    powerOn: function () {
      var rm = S.rm; S.state = 'TV_ON'; rig.style.transition = 'transform .6s'; rig.style.transform = 'none';
      document.body.classList.remove('room-mode'); document.body.classList.add('boot-mode');
      A.audio.play('thunk'); A.audio.play('on');
      screen.classList.add('poweron'); A.fx.static(1500, 0.85);
      later(function () { A.room.fit('boot', rm); }, rm ? 0 : 160);
      later(function () { document.body.classList.add('inworld'); screen.classList.remove('poweron'); if (!rm) { screen.classList.add('degauss'); } A.room.runBoot(); }, rm ? 200 : 1800);
    },
    runBoot: function () {
      S.state = 'BOOT'; boot.classList.add('on'); var os = document.getElementById('bOs'), bar = document.getElementById('bBar'), logo = document.getElementById('bLogo'), txt = D.boot.os, i = 0;
      (function typeIt() { os.textContent = txt.slice(0, ++i) + (i < txt.length ? '_' : ''); if (i < txt.length) later(typeIt, 38); else bar0(); })();
      function bar0() {
        document.querySelector('.b-bar').style.opacity = 1; var p = 0;
        (function adv() { p += 7 + Math.random() * 9; bar.style.width = Math.min(100, p) + '%'; if (p < 100) later(adv, 70); else later(logoIn, 260); })();
      }
      function logoIn() {
        logo.style.opacity = 1; logo.classList.add('glitch'); A.fx.static(260, 0.55);
        later(function () { boot.classList.add('ready'); S.state = 'PRESS_START'; }, S.rm ? 50 : 700);
      }
    },
    endBoot: function () { clearAll(); boot.classList.remove('on'); document.body.classList.remove('boot-mode'); },
    skipTo: function () { clearAll(); document.body.classList.remove('room-mode'); A.room.fit('world', true); boot.classList.remove('on'); screen.classList.remove('poweron', 'degauss'); },
    stopDust: function () { dustOn = false; dctx.clearRect(0, 0, vw, vh); }
  };
})(window.A = window.A || {});
