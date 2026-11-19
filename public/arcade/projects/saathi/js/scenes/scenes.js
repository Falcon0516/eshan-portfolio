/* Seven scenes. Each factory gets the shared API `A` and returns {build, enter, leave, draw}. */
(function () {
  var F = window.FACTS;
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  function center(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  function tubeEl(A, root, i, left, top, w) {
    var t = A.el('div', 'tube obj', '<img src="assets/tube_module.png" alt="" onerror="this.style.display=\'none\'"><b>' + F.stations[i] + '</b>');
    t.style.left = left; t.style.top = top; if (w) t.style.width = w; root.appendChild(t); return t;
  }

  /* 1. RING RING: the signature moment. Drag the cable from the lamp into the jack. */
  function ring(A) {
    var root, lamp, jack, tubes = [], rope = new Flow.Rope(18), plugged = false, drag = false, auto = false, tEnter = 0;
    var end = { x: 0, y: 0 }, pulse = -1, loopT = 0, o = { x: 0, y: 0 }, pts = [];
    function pointer(e) { end.x = e.clientX; end.y = e.clientY; }
    function startRope() {
      var a = center(lamp), j = center(jack);
      rope.init(a.x, a.y, j.x - 40, j.y + 90); plugged = false; drag = false; auto = false; pulse = -1;
      end.x = rope.x[rope.n - 1]; end.y = rope.y[rope.n - 1];
    }
    function plug() { plugged = true; drag = false; auto = false; pulse = 0; var j = center(jack); A.spark(j.x, j.y, 24, '#FFB000'); A.snd.click(); A.shake(9); A.say('Connected'); }
    return {
      build: function (r) {
        root = r;
        A.el('div', 'obj phone', '', null, root).style.cssText = 'left:9vw;top:20vh';
        lamp = A.el('div', 'obj lamp', '', null, root); lamp.style.cssText = 'left:22vw;top:24vh';
        jack = A.el('div', 'obj', '', null, root);
        jack.style.cssText = 'left:46vw;top:46vh;width:60px;height:60px;border-radius:50%;border:8px solid #C9A24B;background:#120a05;box-shadow:0 0 0 4px #2A1B12';
        for (var i = 0; i < 5; i++) { var t = tubeEl(A, root, i, (54 + i * 9) + 'vw', (30 + (i % 2) * 6) + 'vh', '8vw'); tubes.push(t); }
        window.addEventListener('pointermove', function (e) { if (drag && A.cur() === 0) pointer(e); });
        window.addEventListener('pointerdown', function (e) {
          if (A.cur() !== 0 || e.target.closest('button,a')) return;
          var j = center(jack), ex = rope.x[rope.n - 1], ey = rope.y[rope.n - 1];
          if (plugged && Math.hypot(e.clientX - j.x, e.clientY - j.y) < 50) { plugged = false; drag = true; pulse = -1; pointer(e); A.snd.click(); }
          else if (!plugged && Math.hypot(e.clientX - ex, e.clientY - ey) < 60) { drag = true; auto = false; pointer(e); }
        });
        window.addEventListener('pointerup', function (e) {
          if (!drag || A.cur() !== 0) return; var j = center(jack);
          if (Math.hypot(e.clientX - j.x, e.clientY - j.y) < 55) plug(); else drag = false;
        });
      },
      enter: function () { tEnter = 0; startRope(); },
      cablePlugged: function () { return plugged; },
      draw: function (c, t, dt) {
        tEnter += dt;
        if (!plugged && !drag && !auto && tEnter > 7) auto = true;
        var j = center(jack), a = center(lamp);
        if (auto) { end.x = lerp(end.x, j.x, 0.06); end.y = lerp(end.y, j.y, 0.06); if (Math.hypot(end.x - j.x, end.y - j.y) < 14) plug(); }
        rope.step(a.x, a.y, plugged || drag || auto, plugged ? j.x : end.x, plugged ? j.y : end.y);
        rope.draw(c, '#FFB000');
        c.fillStyle = '#C9A24B'; c.fillRect(rope.x[rope.n - 1] - 9, rope.y[rope.n - 1] - 9, 18, 18);
        /* rail: line through tube centres, pulse runs down it */
        pts.length = 0; pts.push(j);
        for (var i = 0; i < 5; i++) { var tc = center(tubes[i]); pts.push({ x: tc.x, y: tc.y + 40 }); }
        c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
        for (i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
        c.strokeStyle = plugged ? 'rgba(25,195,177,.5)' : 'rgba(201,162,75,.25)'; c.lineWidth = 4; c.setLineDash(plugged ? [] : [4, 10]); c.stroke(); c.setLineDash([]);
        for (i = 0; i < 5; i++) A.glow(tubes[i], plugged ? 0.25 + 0.1 * Math.sin(t * 3 + i) : 0.05);
        if (plugged) {
          loopT += dt; if (loopT > 3.4) { loopT = 0; pulse = 0; }
          if (pulse >= 0) {
            pulse += dt / 2.4; var p = pulse;
            if (p < 0.3) rope.at(1 - p / 0.3, o);
            else { var k = (p - 0.3) / 0.7 * (pts.length - 1), s = Math.min(pts.length - 2, k | 0), r = k - s; o.x = lerp(pts[s].x, pts[s + 1].x, r); o.y = lerp(pts[s].y, pts[s + 1].y, r); var ti = Math.min(4, Math.round(k) - 1); if (ti >= 0 && ti < 5) A.glow(tubes[ti], 1); }
            c.fillStyle = '#FFB000'; c.shadowColor = '#FFB000'; c.shadowBlur = 26; c.beginPath(); c.arc(o.x, o.y, 11, 0, 6.28); c.fill(); c.shadowBlur = 0;
            if (pulse > 1) pulse = -1;
          }
        }
      }
    };
  }

  /* 2. HEAR: synthetic waveform, brass knobs for threshold and silence timeout. */
  function hear(A) {
    var thr = F.vad.threshold, sil = F.vad.silenceMs, tube, tl, flash = 0, speaking = false, lastLoud = 0, hint, tEnter = 0, tIn = 0;
    function amp(t) {
      var p = t % 9, base = 0.008 * (Math.sin(t * 91) * 0.5 + 0.5 + Math.sin(t * 57) * 0.3 + 0.3);
      if (p > 0.5 && p < 3.2) { var e = Math.sin((p - 0.5) / 2.7 * Math.PI); return base + e * (0.02 + 0.03 * Math.abs(Math.sin(p * 9.1))) ; }
      return base;
    }
    return {
      build: function (r) {
        tube = tubeEl(A, r, 0, '28vw', '5vh');
        A.knob(r, { x: '30vw', y: '48vh', min: 0.005, max: 0.05, val: thr, label: 'threshold', fmt: function (v) { return v.toFixed(3); }, on: function (v) { thr = v; } });
        A.knob(r, { x: '38vw', y: '48vh', min: 200, max: 1500, val: sil, label: 'silence', fmt: function (v) { return Math.round(v) + ' ms'; }, on: function (v) { sil = v; } });
        tl = A.el('div', 'obj', '', null, r); tl.style.cssText = 'left:46vw;top:60vh;font-size:20px;background:rgba(27,18,11,.9);padding:6px 12px;color:#FFB000';
        hint = A.el('div', 'obj', A.T('VAD') + ' on ' + A.T('RMS') + ' energy. Default ' + F.vad.threshold + ', ' + F.vad.silenceMs + ' ms (code).', null, r);
        hint.style.cssText = 'left:46vw;top:67vh;font-size:15px;background:rgba(27,18,11,.88);padding:4px 8px;max-width:48vw';
      },
      enter: function () { tEnter = 0; speaking = false; lastLoud = 0; },
      draw: function (c, t, dt, W, H) {
        tEnter += dt; var ts = tEnter, x0 = W * 0.46, cols = 120, wd = W * 0.48 / cols, cy = H * 0.34, sc = H * 0.2 / 0.06;
        /* scene 1 sits at camera index 1: track is already translated, so draw in viewport coords */
        for (var k = 0; k < cols; k++) {
          var tk = ts - (cols - k) * 0.03, a = tk > 0 ? amp(tk) : 0, hgt = a * sc;
          c.fillStyle = a > thr ? '#FFB000' : 'rgba(246,231,200,.35)';
          c.fillRect(x0 + k * wd, cy - hgt, wd - 2, hgt * 2 + 2);
        }
        c.fillStyle = 'rgba(25,195,177,.9)'; c.fillRect(x0, cy - thr * sc, W * 0.48, 2); c.fillRect(x0, cy + thr * sc, W * 0.48, 2);
        var a0 = amp(ts); A.glow(tube, Math.min(1, a0 / 0.05));
        if (a0 > thr) { if (!speaking) speaking = true; lastLoud = ts; }
        var q = ts - lastLoud;
        if (speaking && q * 1000 >= sil) { speaking = false; flash = 1; A.snd.blip(); A.spark(x0 + W * 0.48, cy, 14, '#FFB000'); }
        flash = Math.max(0, flash - dt * 0.8);
        var left = speaking ? sil : Math.max(0, sil - q * 1000);
        tl.textContent = speaking ? 'hearing ...' : flash > 0 ? 'END OF SPEECH' : 'silence ' + Math.round(sil - Math.min(sil, left)) + ' / ' + Math.round(sil) + ' ms';
        if (flash > 0) { c.fillStyle = 'rgba(255,176,0,' + flash * 0.25 + ')'; c.fillRect(x0, cy - H * 0.14, W * 0.48, H * 0.28); }
      }
    };
  }

  /* 3. WRITE: paper tape in EN, HI or KN. Online or offline engine. */
  function write(A) {
    var tape, lang = 'EN', online = true, eng, tube, beads = new Flow.Beads(14), btns = {};
    function run() {
      tape.className = 'tape obj'; tape.setAttribute('lang', lang); tape.textContent = F.tape[lang][online ? 'on' : 'off'];
      tape.style.borderTop = '6px solid ' + (online ? '#19C3B1' : '#FFB000'); void tape.offsetWidth; tape.className = 'tape obj go';
      eng.innerHTML = 'Engine: ' + (online ? A.T('Sarvam') + ' saaras:v3' : A.T('Whisper') + ' (whisper-rs)') + (online ? '' : ', no internet needed');
      for (var k in btns) btns[k].className = (k === lang || k === (online ? 'ONLINE' : 'OFFLINE')) ? 'on' : ''; A.snd.click();
    }
    return {
      build: function (r) {
        tube = tubeEl(A, r, 1, '36vw', '6vh');
        tape = A.el('div', 'tape obj', '', null, r); tape.style.cssText = 'left:36vw;top:46vh;width:56vw';
        var row = A.el('div', 'row obj', '', null, r); row.style.cssText = 'left:36vw;top:62vh';
        ['EN', 'HI', 'KN', 'ONLINE', 'OFFLINE'].forEach(function (n) {
          var b = A.el('button', '', n, null, row); btns[n] = b;
          b.onclick = function () { if (n === 'ONLINE') online = true; else if (n === 'OFFLINE') online = false; else lang = n; run(); };
        });
        eng = A.el('div', 'obj', '', null, r); eng.style.cssText = 'left:36vw;top:72vh;font-size:16px;background:rgba(27,18,11,.88);padding:4px 10px';
      },
      enter: function () { run(); },
      draw: function (c, t, dt, W, H) {
        var x0 = W * 0.46, y0 = H * 0.3, x1 = W * 0.46, y1 = H * 0.46, o = { x: 0, y: 0 };
        beads.update(dt, 0.45, 2.2, null); A.glow(tube, 0.5 + 0.3 * Math.sin(t * 4));
        beads.draw(c, function (p, out) { out.x = x0 + Math.sin(p * 3) * 14; out.y = lerp(y0, y1, p); }, online ? '#19C3B1' : '#FFB000', 5);
      }
    };
  }

  /* 4. SPEAK EARLY: tokens stream, each finished sentence flies to the speaker. */
  function early(A) {
    var typer, spk, b1, b2, l1, l2, think, speak, run = 0, timers = [];
    function after(ms, fn) { var id = setTimeout(fn, ms); timers.push(id); }
    return {
      build: function (r) {
        think = tubeEl(A, r, 2, '46vw', '4vh', '9vw'); speak = tubeEl(A, r, 3, '78vw', '4vh', '9vw');
        typer = A.el('div', 'typer', '', null, r); typer.style.cssText = 'left:46vw;top:30vh';
        spk = A.el('div', 'obj', '', null, r);
        spk.style.cssText = 'left:84vw;top:36vh;width:90px;height:90px;border-radius:50%;border:8px solid #C9A24B;background:radial-gradient(circle,#120a05 30%,#2A1B12 70%)';
        var w = A.el('div', 'obj', '', null, r); w.style.cssText = 'left:46vw;top:56vh;width:44vw';
        A.el('div', 'barl', 'Wait for the whole answer', null, w); b1 = A.el('div', 'bar', '', null, w); b1.style.background = '#E5484D';
        A.el('div', 'barl', 'Speak sentence by sentence', null, w); b2 = A.el('div', 'bar', '', null, w);
        A.el('div', 'barl', 'time to first audio, illustrative', null, w).style.opacity = .8;
      },
      enter: function () {
        var my = ++run; timers.forEach(clearTimeout); timers = []; typer.textContent = ''; b1.style.width = '0'; b2.style.width = '0'; A.glow(think, 0); A.glow(speak, 0);
        var all = F.reply.join(' '), words = all.split(' '), buf = '', first = F.reply[0].length / all.length, i = 0;
        after(500, function () { b1.style.width = '100%'; });
        words.forEach(function (w, k) {
          after(900 + k * 330, function () {
            if (my !== run) return; buf += (buf ? ' ' : '') + w; typer.textContent = buf; A.glow(think, 0.9);
            if (/[.?!]$/.test(w)) {
              var s = buf.split(/(?<=[.?!])\s/).pop(), f = A.el('div', 'bubble', s, null, document.body);
              var a = typer.getBoundingClientRect(), b = spk.getBoundingClientRect(); f.style.left = a.left + 'px'; f.style.top = a.bottom - 20 + 'px'; f.style.zIndex = 5;
              var an = f.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.bottom + 20) + 'px) scale(.5)', opacity: .2 }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
              an.onfinish = function () { f.remove(); A.snd.blip(); A.glow(speak, 1); A.spark(b.left + 45, b.top + 45, 10, '#19C3B1'); if (!b2.style.width || b2.style.width === '0px') b2.style.width = Math.max(14, first * 100) + '%'; };
            }
          });
        });
      },
      leave: function () { run++; timers.forEach(clearTimeout); timers = []; },
      draw: function (c, t) { A.glow(speak, 0.15 + 0.1 * Math.sin(t * 5)); }
    };
  }

  /* 5. MUTE THE MIC: red latch mutes capture while the speaker plays. */
  function mute(A) {
    var mic, latch, spk, line, open = false, beads = new Flow.Beads(10), tag, auto = 0, touched = false, rings = [], tEnter = 0;
    function set(v) { open = v; latch.className = 'latch obj' + (open ? ' open' : ''); tag.textContent = open ? 'MIC LIVE: it hears itself' : 'MIC MUTED'; tag.style.color = open ? '#E5484D' : '#19C3B1'; mic.style.background = open ? '#F6E7C8' : '#7a5a50'; A.snd.click(); }
    return {
      build: function (r) {
        line = tubeEl(A, r, 4, '60vw', '5vh', '9vw');
        mic = A.el('div', 'mic obj', '', null, r); mic.style.cssText = 'left:48vw;top:30vh';
        latch = A.el('div', 'latch obj', '', null, r); latch.style.cssText = 'left:49vw;top:44vh'; latch.tabIndex = 0; latch.setAttribute('role', 'button'); latch.setAttribute('aria-label', 'Toggle mic mute latch');
        latch.onclick = function () { touched = true; set(!open); };
        latch.onkeydown = function (e) { if (e.key === 'Enter') { e.stopPropagation(); latch.click(); } };
        spk = A.el('div', 'obj', '', null, r); spk.style.cssText = 'left:78vw;top:34vh;width:90px;height:90px;border-radius:50%;border:8px solid #C9A24B;background:radial-gradient(circle,#120a05 30%,#2A1B12 70%)';
        tag = A.el('div', 'obj', '', null, r); tag.style.cssText = 'left:44vw;top:62vh;font-size:18px;background:rgba(27,18,11,.9);padding:4px 10px';
        var e = A.el('div', 'obj', A.T('echo suppression') + ': capture muted by a flag while the AI speaks', null, r); e.style.cssText = 'left:44vw;top:69vh;font-size:15px;background:rgba(27,18,11,.88);padding:4px 8px;max-width:46vw';
      },
      enter: function () { tEnter = 0; touched = false; set(false); latch.className = 'latch obj'; },
      draw: function (c, t, dt, W, H) {
        tEnter += dt;
        if (!touched) { if (tEnter > 4.5 && tEnter < 9 && !open) set(true); else if (tEnter >= 9 && open) set(false); }
        var sc = center(spk), mc = center(mic), lc = center(line);
        beads.update(dt, 0.5, 2, null);
        if (!open) { beads.draw(c, function (p, o) { o.x = lerp(sc.x, lc.x, p); o.y = lerp(sc.y, lc.y + 40, p) - Math.sin(p * 3.14) * 30; }, '#19C3B1', 5); A.glow(line, 0.6 + 0.2 * Math.sin(t * 3)); }
        else {
          beads.draw(c, function (p, o) { o.x = lerp(sc.x, mc.x, p); o.y = lerp(sc.y, mc.y, p) + Math.sin(p * 3.14) * 120; }, '#E5484D', 6);
          var ph = (t * 1.4) % 1; c.strokeStyle = 'rgba(229,72,77,' + (1 - ph) + ')'; c.lineWidth = 4; c.beginPath(); c.arc(mc.x, mc.y, 40 + ph * 80, 0, 6.28); c.stroke();
          A.glow(line, 0.5 + 0.4 * Math.sin(t * 4));
        }
      }
    };
  }

  /* 6. TWO LIVES: both versions, side by side. V1 number carries its source tag; V2 shows none. */
  function two(A) {
    var c1, c2;
    function card(v, cls) {
      var d = A.el('div', 'card', '<h3>' + v.t + '</h3><em>' + v.s + '</em><ul>' + v.l.map(function (x) { return '<li>' + A.T(x) + '</li>'; }).join('') + '</ul>' + (v.n ? '<p style="margin:10px 0 0;font-size:16px;color:#7a5a12">' + v.n + '</p>' : ''));
      return d;
    }
    return {
      build: function (r) {
        c1 = card(F.versions.v1); c1.style.cssText = 'left:38vw;top:16vh'; r.appendChild(c1);
        c2 = card(F.versions.v2); c2.style.cssText = 'left:68vw;top:20vh;background:#19C3B1;'; r.appendChild(c2);
        var s = A.el('div', 'obj', '', null, r); s.style.cssText = 'left:38vw;top:62vh;font-size:15px;background:rgba(27,18,11,.88);padding:4px 8px'; s.innerHTML = 'V1 and V2 both shown. V2 has no stored latency figure.';
        c2.onclick = function () { c2.style.transform = c2.style.transform ? '' : 'rotateY(360deg)'; A.snd.click(); }; c2.className += ' obj';
      },
      enter: function () { c1.style.transform = 'translateY(40px) rotate(-3deg)'; c2.style.transform = 'rotateY(90deg)'; setTimeout(function () { c1.style.transform = ''; }, 100); setTimeout(function () { c2.style.transform = ''; A.snd.click(); }, 1800); },
      draw: function (c, t, dt, W, H) {
        var a = c1.getBoundingClientRect(), b = c2.getBoundingClientRect();
        c.setLineDash([2, 12]); c.lineCap = 'round'; c.lineWidth = 6; c.strokeStyle = '#C9A24B'; c.beginPath(); c.moveTo(a.right, a.top + 90); c.quadraticCurveTo((a.right + b.left) / 2, a.top + 170, b.left, b.top + 90); c.stroke(); c.setLineDash([]);
      }
    };
  }

  /* 7. REALITY: three columns and the dotted cable that carries nothing. */
  function real(A) {
    var cols = {}, jack;
    return {
      build: function (r) {
        var row = A.el('div', 'row obj', '', null, r); row.style.cssText = 'left:4vw;top:6vh;gap:2vw;flex-wrap:nowrap';
        Object.keys(F.reality).forEach(function (k) {
          var d = A.el('div', 'card', '<h3>' + k + '</h3><ul>' + F.reality[k].map(function (x) { return '<li>' + A.T(x) + '</li>'; }).join('') + '</ul>', null, row);
          d.style.position = 'relative'; d.style.width = '42vw'; d.style.borderTop = '8px solid ' + (k === 'REAL' ? '#19C3B1' : k === 'PARTIAL' ? '#FFB000' : '#E5484D'); cols[k] = d;
        });
        jack = A.el('div', 'obj', '', null, r); jack.style.cssText = 'left:60vw;top:68vh;width:50px;height:50px;border-radius:50%;border:7px solid #5a4a30;background:#120a05';
        var n = A.el('div', 'obj', 'no signal', null, r); n.style.cssText = 'left:63vw;top:69vh;font-size:16px;color:#E5484D;background:rgba(27,18,11,.88);padding:2px 8px';
      },
      enter: function () {},
      draw: function (c, t, dt, W, H) {
        var a = cols.PARTIAL.getBoundingClientRect(), j = center(jack), sx = a.left + a.width / 2, sy = a.bottom;
        c.setLineDash([3, 12]); c.lineWidth = 6; c.lineCap = 'round'; c.strokeStyle = '#E5484D'; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx, j.y, j.x, j.y); c.stroke(); c.setLineDash([]);
        var p = (t * 0.5) % 1; if (p < 0.5) { var x = (1 - p) * (1 - p) * sx + 2 * (1 - p) * p * sx + p * p * j.x, y = (1 - p) * (1 - p) * sy + 2 * (1 - p) * p * j.y + p * p * j.y; c.fillStyle = '#FFB000'; c.beginPath(); c.arc(x, y, 6, 0, 6.28); c.fill(); }
        else if (p < 0.52) A.spark(sx + (j.x - sx) * 0.4, sy + (j.y - sy) * 0.55, 6, '#E5484D');
      }
    };
  }

  window.SCENES = [ring, hear, write, early, mute, two, real];
})();
