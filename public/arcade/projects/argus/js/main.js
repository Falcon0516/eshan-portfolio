/* Shell: camera on one continuous stage, loop, input, overlays. */
(function () {
  var F = window.FACTS, A = window.A, S = A.scenes, Race = window.Race;
  var $ = function (s) { return document.querySelector(s); }, cv = $('#cv'), g = cv.getContext('2d'); A.g = g;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cam = { x: 1280, y: 720, z: 0.5 }, from = null, to = null, ct = 1, cur = -1, mode = 'present', last = 0, idleT = 0, rain = [], lightT = 6, hintOff = 0;
  [['bg', 'control_room_bg.webp'], ['map', 'city_map.png'], ['board', 'evidence_board.png'], ['stamp', 'stamp_set.png']].forEach(function (a) { var im = new Image(); im.onload = function () { A.imgs[a[0]] = im; }; im.src = 'assets/' + a[1]; });
  for (var i = 0; i < 120; i++) rain.push({ x: Math.random(), y: Math.random(), l: 8 + Math.random() * 16, s: 0.5 + Math.random() * 0.9 });

  function resize() { A.W = innerWidth; A.H = innerHeight; A.dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = A.W * A.dpr; cv.height = A.H * A.dpr; if (cur >= 0) camTo(S[cur].cam, true); }
  function camTo(r, instant) { var s = Math.min(A.W / r.w, A.H / r.h); to = { x: r.x + r.w / 2, y: r.y + r.h / 2, z: Math.log(s) }; from = { x: cam.x, y: cam.y, z: Math.log(cam.z) }; ct = (instant || reduced) ? 1 : 0; if (ct === 1) { cam.x = to.x; cam.y = to.y; cam.z = Math.exp(to.z); } }

  /* ---- HUD ---- */
  function tip(k) { return '<abbr tabindex="0" data-tip="' + F.tips[k].replace(/"/g, '') + '">' + k + '</abbr>'; }
  var dots = $('#dots'); F.scenes.forEach(function (s, i) { var d = document.createElement('i'); d.setAttribute('role', 'button'); d.setAttribute('aria-label', 'Scene ' + (i + 1)); d.onclick = function (e) { e.stopPropagation(); go(i); }; dots.appendChild(d); });
  var rc = $('#rc'); (function () { var h = ''; Object.keys(F.reality).forEach(function (k, i) { h += '<div class="col"><h3>' + k + '</h3><ul>' + F.reality[k].map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>' + (i === 0 ? '<div class="stamp" id="kg"></div>' : '') + '</div>'; }); rc.innerHTML = h; })();
  function stampBox(el, idx, text, w) { var R = [[49, 108, 485, 305], [585, 155, 451, 193], [1086, 107, 491, 315]][idx], k = w / R[2]; el.style.width = w + 'px'; el.style.height = R[3] * k + 'px'; el.style.backgroundImage = 'url(assets/stamp_set.png)'; el.style.backgroundSize = (1600 * k) + 'px auto'; el.style.backgroundPosition = (-R[0] * k) + 'px ' + (-R[1] * k) + 'px'; el.innerHTML = '<span>' + text + '</span>'; }
  stampBox($('#kg'), 1, 'FIELD RUN', 300);
  function setRC(on) { rc.classList.toggle('on', on); var k = $('#kg'); k.classList.remove('on'); if (on) { void k.offsetWidth; k.classList.add('on'); if (A.snd) setTimeout(function () { A.snd('thump'); }, 700); } }

  function go(i, instant) {
    i = Math.max(0, Math.min(S.length - 1, i)); var same = i === cur; cur = i; A.st = 0; var d = F.scenes[i];
    $('#head').textContent = d.head; $('#cap').textContent = d.cap; $('#take').textContent = d.take;
    $('#terms').innerHTML = d.terms.map(tip).join(''); $('#bub').textContent = d.bub; $('#notes').textContent = d.note;
    var m = $('#mas'); m.classList.remove('up'); setTimeout(function () { if (cur === i) m.classList.add('up'); }, 1400); setTimeout(function () { if (cur === i) m.classList.remove('up'); }, 6500);
    [].forEach.call(dots.children, function (e, k) { e.className = k === i ? 'on' : ''; });
    $('#hunt').classList.toggle('on', i === 4 && mode === 'present'); $('#reg').classList.toggle('on', i === 5 || i === 6);
    $('#reg').textContent = F.registration; setRC(i === 6);
    if (!same) { A.flow.clear(); camTo(S[i].cam, instant); }
    S[i].enter(); if (location.hash !== '#scene-' + (i + 1)) history.replaceState(null, '', '#scene-' + (i + 1));
    A.cur = i; document.body.classList.toggle('s7', i === 6);
  }
  function next() { if (cur < S.length - 1) go(cur + 1); } function prev() { if (cur > 0) go(cur - 1); }
  function setMode(m) { mode = m; document.body.classList.toggle('explore', m === 'explore'); $('#modeBtn').textContent = m === 'present' ? 'PRESENT' : 'EXPLORE'; if (m === 'explore') { setRC(false); $('#notes').classList.remove('on'); Race.reset(); } else go(cur, true); }

  /* ---- input ---- */
  function key(e) {
    var k = e.key; if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown') { if (mode === 'present') next(); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { if (mode === 'present') prev(); e.preventDefault(); }
    else if (k === 'Enter' && mode === 'present' && document.activeElement.tagName !== 'BUTTON') { S[cur].enter(); A.st = 0; }
    else if (k === 'p' || k === 'P') setMode(mode === 'present' ? 'explore' : 'present');
    else if (k === 'r' || k === 'R') { if (mode === 'present' && cur !== 6) setRC(!rc.classList.contains('on')); }
    else if (k === 't' || k === 'T') $('#notes').classList.toggle('on');
    else if (k === 'm' || k === 'M') toggleSound();
    else if (k === 'f' || k === 'F') { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
    else if (k === 'Escape') { if ($('#notes').classList.contains('on')) $('#notes').classList.remove('on'); else if (rc.classList.contains('on') && cur !== 6) setRC(false); else if (mode === 'explore') setMode('present'); else location.href = '../../index.html?from=argus'; }
  }
  addEventListener('keydown', key);
  document.addEventListener('click', function (e) { if (mode !== 'present') return; if (e.target.closest('button,a,abbr,#dots,#rc,#notes,#ctl')) return; if (e.clientX > A.W * 0.7) next(); });
  var tx = 0; addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }); addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - tx; if (mode === 'present' && Math.abs(dx) > 50) { if (dx < 0) next(); else prev(); } });
  $('#modeBtn').onclick = function () { setMode(mode === 'present' ? 'explore' : 'present'); };
  $('#rBtn').onclick = function () { if (mode === 'present' && cur !== 6) setRC(!rc.classList.contains('on')); };
  $('#tBtn').onclick = function () { $('#notes').classList.toggle('on'); }; $('#mBtn').onclick = toggleSound;
  $('#fBtn').onclick = function () { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); };
  [].forEach.call(document.querySelectorAll('#hunt button'), function (b) { b.onclick = function () { [].forEach.call(document.querySelectorAll('#hunt button'), function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); S[4].pick(+b.dataset.s); }; });
  $('#cm').onclick = function () { Race.cams = Math.max(1, Race.cams - 1); $('#cn').textContent = Race.cams; }; $('#cp').onclick = function () { Race.cams = Math.min(6, Race.cams + 1); $('#cn').textContent = Race.cams; };
  $('#dm').onclick = function () { Race.setCrowd(Race.crowd - 1); $('#dn').textContent = Race.crowd; }; $('#dp').onclick = function () { Race.setCrowd(Race.crowd + 1); $('#dn').textContent = Race.crowd; };
  [].forEach.call(document.querySelectorAll('.sw'), function (b) { b.onclick = function () { Race.trig[b.dataset.k] = !Race.trig[b.dataset.k]; b.classList.toggle('on', Race.trig[b.dataset.k]); b.setAttribute('aria-pressed', Race.trig[b.dataset.k]); }; });
  $('#evt').onclick = function () { Race.event(); A.shake = 0.6; if (A.snd) A.snd('thump'); };
  addEventListener('mousemove', function () { idleT = 0; document.body.classList.remove('idle', 'pres-hide'); });
  addEventListener('hashchange', function () { var m = /scene-(\d)/.exec(location.hash); if (m && +m[1] - 1 !== cur) go(+m[1] - 1); });
  addEventListener('resize', resize);

  /* ---- sound (muted by default, synthesised) ---- */
  var ac = null, muted = true, rainG = null;
  function toggleSound() { muted = !muted; $('#mBtn').setAttribute('aria-pressed', !muted); $('#mBtn').style.color = muted ? '' : '#FFB020';
    if (!muted && !ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); var n = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = n.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var s = ac.createBufferSource(); s.buffer = n; s.loop = true; var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; rainG = ac.createGain(); rainG.gain.value = 0.05; s.connect(f); f.connect(rainG); rainG.connect(ac.destination); s.start(); } catch (e) { ac = null; } }
    if (rainG) rainG.gain.value = muted ? 0 : 0.05; }
  A.snd = function (kind) { if (muted || !ac) return; var o = ac.createOscillator(), v = ac.createGain(), t = ac.currentTime; o.connect(v); v.connect(ac.destination);
    if (kind === 'thump') { o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + .25); v.gain.setValueAtTime(.4, t); v.gain.exponentialRampToValueAtTime(.001, t + .3); o.start(t); o.stop(t + .32); }
    else { o.type = 'square'; o.frequency.value = 1800; v.gain.setValueAtTime(.05, t); v.gain.exponentialRampToValueAtTime(.001, t + .04); o.start(t); o.stop(t + .05); } };

  /* ---- loop ---- */
  function frame(ts) {
    requestAnimationFrame(frame); if (document.hidden) { last = ts; return; }
    var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; A.t += dt; A.st += dt; idleT += dt;
    if (idleT > 3) document.body.classList.add('idle'); if (idleT > 6 && mode === 'present') document.body.classList.add('pres-hide');
    if (!hintOff && A.t > 6) { hintOff = 1; $('#hint').classList.add('off'); }
    var W = A.W, H = A.H, d = A.dpr;
    g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = '#0A0F14'; g.fillRect(0, 0, W, H);
    A.shake = Math.max(0, A.shake - dt * 2.2); A.flash = Math.max(0, A.flash - dt * 2.5);
    if (mode === 'present') {
      if (ct < 1) { ct = Math.min(1, ct + dt / 1.15); var e = 1 - Math.pow(1 - ct, 4); cam.x = from.x + (to.x - from.x) * e; cam.y = from.y + (to.y - from.y) * e; cam.z = Math.exp(from.z + (to.z - from.z) * e); }
      A.flow.update(dt); A.wallUpdate(dt); S[cur].update(dt);
      var z = cam.z, sx = reduced ? 0 : (Math.random() - .5) * A.shake * 18, sy = reduced ? 0 : (Math.random() - .5) * A.shake * 18, dr = reduced ? 0 : Math.sin(A.t * .4) * 5;
      g.setTransform(d * z, 0, 0, d * z, d * (W / 2 - cam.x * z + sx + dr), d * (H / 2 - cam.y * z + sy));
      if (A.imgs.bg) g.drawImage(A.imgs.bg, 0, 0, 2560, 1440); else { var gr = g.createLinearGradient(0, 0, 0, 1440); gr.addColorStop(0, '#0f1a24'); gr.addColorStop(1, '#1B2733'); g.fillStyle = gr; g.fillRect(0, 0, 2560, 1440); g.fillStyle = '#14212c'; g.fillRect(730, 60, 1090, 760); g.fillStyle = '#2a1d10'; g.fillRect(0, 60, 700, 700); }
      A.wallDraw(g);
      g.setTransform(d, 0, 0, d, 0, 0); S[cur].draw(g, W, H);
    } else { Race.update(dt); g.setTransform(d, 0, 0, d, 0, 0); Race.draw(g, W, H, A.imgs.map, 0); }
    /* rain (max 120), lightning, alert flash; all under 3 Hz */
    g.setTransform(d, 0, 0, d, 0, 0); g.strokeStyle = 'rgba(170,200,230,.22)'; g.lineWidth = 1; g.beginPath();
    for (var i = 0; i < 120; i++) { var r = rain[i]; r.y += r.s * dt * 1.1; r.x -= dt * 0.05; if (r.y > 1) { r.y = -0.05; r.x = Math.random() * 1.1; } var px = r.x * W, py = r.y * H; g.moveTo(px, py); g.lineTo(px - 2, py + r.l); } g.stroke();
    lightT -= dt; if (lightT < 0) { lightT = 11 + Math.random() * 8; A.flash = reduced ? 0 : 0.35; }
    if (A.flash > 0) { g.fillStyle = 'rgba(190,220,255,' + A.flash * 0.35 + ')'; g.fillRect(0, 0, W, H); }
  }
  /* ---- start ---- */
  resize(); var q = location.search; if (/from=hub/.test(q) && !reduced) { var en = $('#entry'); en.className = 'go'; setTimeout(function () { en.className = ''; }, 800); }
  var m0 = /scene-(\d)/.exec(location.hash); go(m0 ? Math.min(7, Math.max(1, +m0[1])) - 1 : 0, true); requestAnimationFrame(frame);
})();
