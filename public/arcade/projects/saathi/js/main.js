/* Shell: one stage, camera moves between scenes. Keys, overlays, tooltips, explore panel, sound. */
(function () {
  var F = window.FACTS, $ = function (s) { return document.querySelector(s); };
  var track = $('#track'), plate = $('#plate'), cv = $('#fx'), cx = cv.getContext('2d'), W = 0, H = 0;
  var cur = 0, mode = 'present', sound = false, ac = null, sparks = new Flow.Sparks(120), insts = [], moving = 0, lastMove = 0;
  try { sound = localStorage.getItem('arc_snd') === '1'; } catch (e) {}
  function saveSnd(on) { try { localStorage.setItem('arc_snd', on ? '1' : '0'); } catch (e) {} }
  function ensureAc() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') { try { ac.resume(); } catch (e) {} }
  }
  if (sound) {
    ['pointerdown', 'keydown'].forEach(function (ev) {
      document.addEventListener(ev, function () { if (sound) ensureAc(); }, { capture: true, once: true, passive: true });
    });
  }
  window.addEventListener('pageshow', function () { try { sound = localStorage.getItem('arc_snd') === '1'; } catch (e) {} });
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* tooltips: wrap known terms */
  var keys = Object.keys(F.tips).sort(function (a, b) { return b.length - a.length; });
  var tipRe = new RegExp('\\b(' + keys.join('|') + ')\\b', 'g');
  function T(s) { return String(s).replace(tipRe, function (m) { return '<span class="term" tabindex="0" data-tip="' + F.tips[m].replace(/"/g, '&quot;') + '">' + m + '</span>'; }); }

  function tone(f, d, type, v) {
    if (!sound) return;
    if (!ac) ensureAc();
    if (!ac) return;
    var o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.value = v;
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
  }
  var snd = { click: function () { tone(180, 0.06, 'square', 0.08); }, blip: function () { tone(880, 0.1, 'sine', 0.1); }, ring: function () { tone(440, 0.3, 'sine', 0.08); } };

  var A = {
    el: function (tag, cls, html, style, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; if (parent) parent.appendChild(e); return e; },
    T: T, snd: snd, cur: function () { return cur; },
    glow: function (el, v) { var p = parseFloat(el.style.getPropertyValue('--g')) || 0; if (Math.abs(p - v) > 0.02) el.style.setProperty('--g', v.toFixed(2)); },
    spark: function (x, y, n, c) { sparks.burst(x, y, n, c); },
    shake: function (px) { if (reduced) return; $('#stage').animate([{ transform: 'translate(0,0)' }, { transform: 'translate(' + px + 'px,' + -px / 2 + 'px)' }, { transform: 'translate(' + -px / 2 + 'px,' + px / 2 + 'px)' }, { transform: 'translate(0,0)' }], { duration: 260 }); },
    say: function (s) { var b = $('#bubble'); b.innerHTML = T(s); b.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1 }, { transform: 'scale(1)' }], { duration: 400 }); },
    knob: function (parent, o) {
      var k = A.el('div', 'knob obj', '<i></i><span class="klab"></span>', null, parent), v = o.val, lab = k.querySelector('.klab');
      k.style.left = o.x; k.style.top = o.y; k.tabIndex = 0; k.setAttribute('role', 'slider'); k.setAttribute('aria-label', o.label); k.setAttribute('aria-valuemin', o.min); k.setAttribute('aria-valuemax', o.max);
      function show() { k.firstChild.style.cssText = ''; k.style.transform = 'rotate(' + (-135 + 270 * (v - o.min) / (o.max - o.min)) + 'deg)'; lab.style.transform = 'translateX(-50%) rotate(' + (135 - 270 * (v - o.min) / (o.max - o.min)) + 'deg)'; lab.textContent = o.label + ' ' + o.fmt(v); k.setAttribute('aria-valuenow', v); o.on(v); }
      function set(n) { v = Math.max(o.min, Math.min(o.max, n)); show(); }
      var sy = 0, sv = 0, on = false;
      k.addEventListener('pointerdown', function (e) { on = true; sy = e.clientY; sv = v; k.setPointerCapture(e.pointerId); snd.click(); });
      k.addEventListener('pointermove', function (e) { if (on) set(sv + (sy - e.clientY) * (o.max - o.min) / 160); });
      k.addEventListener('pointerup', function () { on = false; });
      k.addEventListener('keydown', function (e) { var d = (o.max - o.min) / 20; if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { set(v + d); e.preventDefault(); } if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { set(v - d); e.preventDefault(); } });
      show(); return k;
    }
  };

  /* build scenes */
  F.scenes.forEach(function (s, i) {
    var sc = A.el('section', 'scene', '', null, track); sc.style.left = i * 100 + 'vw'; sc.setAttribute('aria-label', s.h);
    insts[i] = window.SCENES[i](A); insts[i].build(sc);
    A.el('div', 'label', '<h1>' + s.h + '</h1><p>' + T(s.cap) + '</p>', null, sc);
    A.el('div', 'take', T(s.take), null, sc);
    var d = A.el('button', '', '', null, $('#dots')); d.setAttribute('aria-label', 'Scene ' + (i + 1) + ': ' + s.h); d.onclick = function () { go(i); };
  });

  function go(i) {
    i = Math.max(0, Math.min(F.scenes.length - 1, i)); if (insts[cur].leave) insts[cur].leave();
    var first = !moving && i === cur && !lastMove; cur = i; lastMove = performance.now(); var id = ++moving;
    track.style.transform = 'translateX(' + -i * 100 + 'vw)';
    plate.style.transform = 'translateX(' + -i * 30 + 'vw) translateY(' + (i === 6 ? -5 : 0) + 'vh) scale(' + (i === 5 ? 0.96 : 1) + ')';
    cv.style.opacity = 0;
    [].forEach.call($('#dots').children, function (b, k) { b.className = k === i ? 'on' : ''; });
    $('#notes').textContent = F.scenes[i].note; A.say(F.scenes[i].bubble);
    try { history.replaceState(null, '', '#scene-' + (i + 1)); } catch (e) {}
    setTimeout(function () { if (id !== moving) return; cv.style.opacity = 1; insts[i].enter(); }, first || reduced ? 50 : 1000);
    if (mode === 'explore' && i !== 0) setMode('present');
  }
  function replay() { if (insts[cur].leave) insts[cur].leave(); insts[cur].enter(); }

  /* overlays */
  function realHTML() { return Object.keys(F.reality).map(function (k) { return '<div class="col ' + k.split(' ')[0] + '"><h2>' + k + '</h2><ul>' + F.reality[k].map(function (x) { return '<li>' + T(x) + '</li>'; }).join('') + '</ul></div>'; }).join(''); }
  $('#real').innerHTML = realHTML();
  function toggle(sel) { var e = $(sel); e.classList.toggle('show'); return e.classList.contains('show'); }

  /* explore panel: router lever and internet cable */
  var net = { router: 'AUTO', out: false, tOut: 0, eff: 'on', shown: '' };
  var ex = $('#explore');
  ex.innerHTML = '<div><div class="tag">Router lever</div><div id="rt"></div></div><div><div class="tag">Internet cable</div><button id="cable">Pull internet cable</button><div class="tag" style="margin-top:8px">time x30: the 30 s probe runs in 1 s</div></div><div id="eng"></div>';
  ['AUTO', 'ONLINE', 'OFFLINE'].forEach(function (n) { var b = A.el('button', n === 'AUTO' ? 'on' : '', n, null, $('#rt')); b.onclick = function () { net.router = n; net.tOut = 0; [].forEach.call($('#rt').children, function (x) { x.className = x === b ? 'on' : ''; }); snd.click(); }; });
  $('#cable').onclick = function () { net.out = !net.out; net.tOut = 0; this.textContent = net.out ? 'Plug internet cable in' : 'Pull internet cable'; snd.click(); };
  function netTick(dt) {
    if (net.out) net.tOut += dt; else net.tOut = 0;
    var eff = net.router === 'OFFLINE' ? 'off' : net.router === 'ONLINE' ? (net.out ? 'fail' : 'on') : (net.out && net.tOut > 1 ? 'off' : 'on');
    var key = eff + net.out; if (key === net.shown) return; net.shown = key; net.eff = eff;
    var e = F.engine, on = eff === 'on', f = eff === 'fail';
    $('#eng').innerHTML = '<div class="tag">Active engines (' + (f ? 'no route' : on ? 'ONLINE' : 'OFFLINE') + ')</div>' +
      '<div style="font-size:18px;line-height:1.6;color:' + (f ? '#E5484D' : on ? '#19C3B1' : '#FFB000') + '">' +
      (f ? 'Waiting: online forced, cable out' : 'STT: ' + T(on ? 'Sarvam saaras:v3' : 'Whisper (whisper-rs)') + '<br>LLM: ' + T(on ? e.llmOn : e.llmOff) + '<br>TTS: ' + T(on ? e.ttsOn : e.ttsOff)) + '</div>';
  }

  function setMode(m) {
    mode = m; ex.classList.toggle('show', m === 'explore'); $('#mode').textContent = m === 'explore' ? 'PRESENT (P)' : 'EXPLORE (P)'; $('#mode').className = m === 'explore' ? 'on' : '';
    if (m === 'explore' && cur !== 0) { go(0); mode = 'explore'; ex.classList.add('show'); }
  }
  $('#mode').onclick = function () { setMode(mode === 'present' ? 'explore' : 'present'); };

  /* sound toggle synced with global arc_snd; AudioContext starts on gesture */
  function toggleSound() { sound = !sound; saveSnd(sound); if (sound) { ensureAc(); snd.blip(); } window.dispatchEvent(new CustomEvent('arcade:sound-sync', { detail: { on: sound } })); }

  /* keys */
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key, tg = e.target;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { if (k === ' ' && tg.tagName === 'BUTTON') return; e.preventDefault(); go(cur + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go(cur - 1); }
    else if (k === 'Enter' && tg.tagName !== 'BUTTON' && tg.tagName !== 'A') replay();
    else if (k === 'p' || k === 'P') setMode(mode === 'present' ? 'explore' : 'present');
    else if (k === 'r' || k === 'R') toggle('#real');
    else if (k === 't' || k === 'T') toggle('#notes');
    else if (k === 'm' || k === 'M') toggleSound();
    else if (k === 'f' || k === 'F') { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
    else if (k === 'Escape') {
      if ($('#real').classList.contains('show')) $('#real').classList.remove('show');
      else if ($('#notes').classList.contains('show')) $('#notes').classList.remove('show');
      else if (mode === 'explore') setMode('present');
      else location.href = $('#back').getAttribute('href');
    }
  });
  /* click right 30% or swipe to advance. Interactive objects never advance. */
  var sx = 0, sy = 0;
  $('#stage').addEventListener('click', function (e) { if (e.target.closest('.obj,button,a,.label,.card,.term')) return; if (e.clientX > innerWidth * 0.7) go(cur + 1); else if (e.clientX < innerWidth * 0.12) go(cur - 1); });
  document.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) { if (e.target.closest('.obj,button')) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60 && Math.abs(e.changedTouches[0].clientY - sy) < 60) go(cur + (dx < 0 ? 1 : -1)); }, { passive: true });
  /* tooltips */
  var tip = $('#tip');
  function showTip(e) { var t = e.target.closest && e.target.closest('.term'); if (!t) return; var r = t.getBoundingClientRect(); tip.textContent = t.getAttribute('data-tip'); tip.style.left = Math.max(8, Math.min(innerWidth - 270, r.left)) + 'px'; tip.style.top = Math.max(8, r.top - 56) + 'px'; tip.style.opacity = 1; }
  function hideTip() { tip.style.opacity = 0; }
  document.addEventListener('mouseover', showTip); document.addEventListener('mouseout', hideTip); document.addEventListener('focusin', showTip); document.addEventListener('focusout', hideTip);
  /* idle cursor, hint chip */
  var idleT; function wake() { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(function () { document.body.classList.add('idle'); }, 3000); }
  document.addEventListener('mousemove', wake); wake(); setTimeout(function () { $('#hint').style.opacity = 0; }, 6000);

  /* frame loop */
  var dust = [], i0; for (i0 = 0; i0 < 30; i0++) dust.push({ x: Math.random(), y: Math.random(), s: 0.01 + Math.random() * 0.02 });
  function resize() { var d = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); }
  addEventListener('resize', resize); resize();
  var last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame); if (document.hidden) { last = now; return; }
    var dt = Math.min(0.05, (now - last) / 1000); last = now; cx.clearRect(0, 0, W, H);
    for (var i = 0; i < dust.length; i++) { var d = dust[i]; d.y -= d.s * dt; d.x += Math.sin(now / 2000 + i) * 0.00015; if (d.y < 0) d.y = 1; cx.fillStyle = 'rgba(255,176,0,.35)'; cx.fillRect(d.x * W * 0.6, d.y * H, 2, 2); }
    insts[cur].draw(cx, now / 1000, dt, W, H); sparks.draw(cx, dt);
    if (mode === 'explore') netTick(dt);
  }
  requestAnimationFrame(frame);

  /* boot: optional hub entry, deep link */
  var start = 0, m = /^#scene-(\d+)$/.exec(location.hash); if (m) start = Math.max(0, Math.min(6, +m[1] - 1));
  if (/[?&]from=hub\b/.test(location.search)) { var en = $('#entry'); en.style.transition = 'none'; en.style.opacity = 1; void en.offsetWidth; en.style.transition = 'opacity .7s'; setTimeout(function () { en.style.opacity = 0; }, 60); }
  go(start);
})();
