/* Explore Mode: six simulations. Everything here is a SIMULATION. No microphone, no network. */
(function () {
  var F = window.FACTS, $ = K.$, X = K.explore = { open: false, cur: 0 }, root = $('#explore'), tabs = $('#xtabs'), body = $('#xbody'), sims = [], active = null;
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  function fit(a, el) { var r = el.getBoundingClientRect(); a.size(Math.max(60, r.width), Math.max(40, r.height), DPR); }
  function chip(t) { return '<span class="chip">' + K.rich(t) + '</span>'; }
  function logTo(el, msg) { var d = K.el('div', null, '<code>' + msg + '</code>'); el.insertBefore(d, el.firstChild); while (el.children.length > 7) el.removeChild(el.lastChild); }

  /* ================= S1: the emergency panel (hero) ================= */
  var S1 = {
    mount: function (el) {
      var a = F.agents, areas = ['threat', 'family', 'fir', 'nav', 'argus', 'ncrb'], me = this;
      el.innerHTML = '<div class="s1"><div class="s1page">' + a.map(function (g, i) {
        return '<div class="xp" style="grid-area:' + areas[i] + ';--c:' + g.color + '"><canvas></canvas><div class="ptag"><b>' + g.id + '</b>' + g.chips.map(chip).join('') + '</div></div>';
      }).join('') + '</div><aside class="s1ctl"><div class="trs">' + F.triggers.map(function (t, i) { return '<button class="stamp" data-i="' + i + '" aria-pressed="' + (i === 0) + '"><b>' + t.label + '</b></button>'; }).join('') +
        '</div><label class="lever"><span>Situation intensity</span><input id="inten" type="range" min="0" max="100" value="85" aria-label="Situation intensity"></label><div class="runs"><button class="btn go" id="runP">' + F.ui.runPar + '</button><button class="btn alt" id="runS">' + F.ui.runSeq + '</button></div>' +
        '<canvas id="mg" width="660" height="260"></canvas><p class="note">' + F.ui.illusNote + '</p></aside></div>';
      me.ag = K.$$('.xp canvas', el).map(function (c, i) { var g = new K.Agent(i, c); return g; }); me.cells = K.$$('.xp', el);
      me.run = new K.Runner(me.ag); me.env = { intensity: 0.85, user: F.map.user, near: K.nearest() }; me.mode = 'par'; me.durs = F.dur.slice(); me.trig = 0; me.last = null;
      me.run.onStart = function (i) { K.audio.tick(); }; me.run.onDone = function () { K.audio.chime(); };
      function resize() { me.ag.forEach(function (g, i) { fit(g, me.cells[i]); }); } me.resize = resize; setTimeout(resize, 30); window.addEventListener('resize', resize);
      K.$$('.stamp', el).forEach(function (b) { b.addEventListener('click', function () { K.$$('.stamp', el).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); me.trig = +b.dataset.i; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); K.audio.tick(); }); });
      $('#inten', el).addEventListener('input', function (e) { me.env.intensity = e.target.value / 100; });
      function go(mode) { me.mode = mode; me.durs = F.dur.map(function (d) { return d * (0.65 + Math.random() * 0.7); }); var mx = Math.max.apply(null, me.durs); me.durs = me.durs.map(function (d) { return d / mx; }); me.run.start(mode, mode === 'par' ? 2800 : 1500, me.durs, performance.now()); me.last = mode; K.audio.pow(); K.shake(6, 140); }
      $('#runP', el).addEventListener('click', function () { go('par'); }); $('#runS', el).addEventListener('click', function () { go('seq'); });
      me.mg = $('#mg', el).getContext('2d');
    },
    unmount: function () { window.removeEventListener('resize', this.resize); },
    tick: function (now, dt) {
      var me = this, t = now / 1000; me.run.update(now);
      me.ag.forEach(function (g) { if (g.state === 'done') g.since += dt; g.draw(t, me.env); });
      var c = me.mg, w = 660, h = 260, tot = me.durs.reduce(function (a, b) { return a + b; }, 0), mx = Math.max.apply(null, me.durs), i, acc = 0;
      c.clearRect(0, 0, w, h); c.font = 'bold 26px ' + K.FONT; c.fillStyle = K.COL.ink; c.textBaseline = 'top'; c.fillText('One by one', 4, 2); c.fillText('In parallel', 4, 118);
      var sc = (w - 8) / tot;
      for (i = 0; i < 6; i++) { c.fillStyle = F.agents[i].color; c.strokeStyle = K.COL.ink; c.lineWidth = 4; c.fillRect(4 + acc * sc, 36, me.durs[i] * sc, 46); c.strokeRect(4 + acc * sc, 36, me.durs[i] * sc, 46); acc += me.durs[i]; c.fillRect(4, 150 + i * 16, me.durs[i] * sc, 12); c.strokeRect(4, 150 + i * 16, me.durs[i] * sc, 12); }
      c.strokeStyle = K.COL.mag; c.lineWidth = 4; c.setLineDash([8, 6]); c.beginPath(); c.moveTo(4 + mx * sc, 144); c.lineTo(4 + mx * sc, 252); c.stroke(); c.setLineDash([]);
      if (me.run.running || me.last) { var el = Math.min(1, (now - me.run.t0) / (me.run.total || 1)); if (me.run.running) { var lane = me.mode === 'seq' ? 36 : 150; c.fillStyle = K.COL.paper; c.fillRect(4 + el * (me.run.total / (me.mode === 'par' ? 2800 : 1500)) * sc, lane - 6, 5, me.mode === 'seq' ? 58 : 100); } }
    }
  };

  /* ================= S2: trigger lab ================= */
  var S2 = {
    mount: function (el) {
      var me = this; me.ok = true; me.sw = { on: 0, t: 0 }; me.hold = null; me.vol = [];
      el.innerHTML = '<div class="s2"><div class="s2-phone" id="ph" data-int tabindex="0" aria-label="Phone. Drag it side to side to shake"><div class="scr"><b id="phS">Ready</b><i id="phSub"></i></div><button class="volb" id="volb" aria-label="Volume button, press three times"><span></span><span></span><span></span></button><div class="pips" id="pips"><u></u><u></u><u></u></div></div>' +
        '<div class="s2-lab"><button class="holdbtn" id="hold" aria-label="SOS, press and hold"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="trk"/><circle cx="100" cy="100" r="88" class="prog" id="holdp" pathLength="100"/></svg><span>SOS</span></button>' +
        '<div class="row"><button class="btn" id="voiceB">Say kavach</button><button class="btn alt" id="shakeB">Shake it</button><div class="bubble" id="vb" aria-live="polite"></div></div>' +
        '<div class="walk"><label>SafeWalk <input id="wmin" type="range" min="1" max="30" value="10" aria-label="SafeWalk minutes"> <output id="wout">10 min</output></label><button class="btn" id="wgo">Start</button><button class="btn alt" id="wfast">Speed up</button><svg class="wring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="trk"/><circle cx="50" cy="50" r="42" class="prog" id="wp" pathLength="100"/></svg><b id="wt">--:--</b></div>' +
        '<label class="swt"><input type="checkbox" id="bk" checked><span class="lever2"></span><b id="bkl">Backend answers</b></label></div>' +
        '<div class="s2-side"><div class="fb"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="trk"/><circle cx="50" cy="50" r="42" class="prog" id="fbp" pathLength="100"/></svg><b id="fbt">' + F.fallback.secs + '</b></div><p class="fbl">' + F.fallback.label + ' ' + K.term('audit', F.fallback.src) + '</p><div class="sms" id="sms" hidden>sms: help request</div><div class="log" id="log2"></div></div></div>';
      var ph = $('#ph', el), S = function (a, b) { $('#phS', el).textContent = a; $('#phSub', el).textContent = b || ''; };
      me.S = S; me.logEl = $('#log2', el); me.fb = null;
      me.fire = function (name) {
        logTo(me.logEl, 'TRIGGER ' + name); S('SENT', name); ph.classList.add('hit'); setTimeout(function () { ph.classList.remove('hit'); }, 500); K.audio.pow(); $('#sms', el).hidden = true;
        if (me.fb) cancelAnimationFrame(me.fb); var bk = $('#bk', el).checked;
        if (bk) { setTimeout(function () { S('Backend answered', name); K.audio.chime(); logTo(me.logEl, 'backend answered'); }, 350); $('#fbp', el).style.strokeDashoffset = 100; $('#fbt', el).textContent = F.fallback.secs; }
        else { var t0 = performance.now(), L = F.fallback.secs * 1000; (function step(n) { var p = Math.min(1, (n - t0) / L); $('#fbp', el).style.strokeDashoffset = 100 - p * 100; $('#fbt', el).textContent = Math.max(0, Math.ceil((1 - p) * F.fallback.secs)); if (p < 1) me.fb = requestAnimationFrame(step); else { S('SMS link opened', 'fallback'); $('#sms', el).hidden = false; logTo(me.logEl, 'no answer: SMS link opens'); K.audio.chime(); } })(t0); }
      };
      /* SOS press and hold */
      var hold = $('#hold', el), hp = $('#holdp', el);
      function hs(e) { e.preventDefault(); if (me.hold) return; me.hold = { t0: performance.now() }; hold.classList.add('down'); }
      function he() { if (!me.hold) return; me.hold = null; hold.classList.remove('down'); hp.style.strokeDashoffset = 100; }
      hold.addEventListener('pointerdown', hs); window.addEventListener('pointerup', he); hold.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); me.fire('SOS'); } });
      me.he = he;
      /* voice gag, scripted, no microphone */
      $('#voiceB', el).addEventListener('click', function () { var vb = $('#vb', el); vb.textContent = '...'; vb.className = 'bubble on'; S('Listening', 'scripted'); setTimeout(function () { vb.textContent = '\u201Ckavach?\u201D'; }, 700); setTimeout(function () { vb.textContent = '\u201CKAVACH!\u201D'; }, 1400); setTimeout(function () { vb.textContent = 'Heard. No microphone used.'; me.fire('voice'); }, 2100); });
      /* shake: drag the phone */
      var drag = null, tr = []; me.ph = ph;
      ph.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, ox: me.px || 0, oy: me.py || 0 }; tr.length = 0; ph.setPointerCapture(e.pointerId); });
      ph.addEventListener('pointermove', function (e) { if (!drag) return; me.px = drag.ox + e.clientX - drag.x; me.py = drag.oy + e.clientY - drag.y; var n = performance.now(); tr.push([n, e.clientX]); while (tr.length && n - tr[0][0] > 900) tr.shift(); var rev = 0, i; for (i = 2; i < tr.length; i++) if ((tr[i][1] - tr[i - 1][1]) * (tr[i - 1][1] - tr[i - 2][1]) < 0 && Math.abs(tr[i][1] - tr[i - 1][1]) > 6) rev++; if (rev >= 4) { tr.length = 0; me.fire('shake'); } });
      ph.addEventListener('pointerup', function () { drag = null; }); $('#shakeB', el).addEventListener('click', function () { ph.classList.remove('wob'); void ph.offsetWidth; ph.classList.add('wob'); me.fire('shake'); });
      /* triple volume */
      $('#volb', el).addEventListener('click', function () { var n = performance.now(); me.vol.push(n); me.vol = me.vol.filter(function (t) { return n - t < 1300; }); K.$$('#pips u', el).forEach(function (u, i) { u.classList.toggle('on', i < me.vol.length); }); K.audio.tick(); if (me.vol.length >= 3) { me.vol = []; setTimeout(function () { K.$$('#pips u', el).forEach(function (u) { u.classList.remove('on'); }); }, 500); me.fire('volume x3'); } });
      /* SafeWalk */
      var wmin = $('#wmin', el); wmin.addEventListener('input', function () { $('#wout', el).textContent = wmin.value + ' min'; });
      $('#wgo', el).addEventListener('click', function () { me.sw = { on: 1, left: wmin.value * 60, total: wmin.value * 60, rate: 1 }; logTo(me.logEl, 'SafeWalk started: ' + wmin.value + ' min'); S('SafeWalk', 'timer running'); });
      $('#wfast', el).addEventListener('click', function () { me.sw.rate = me.sw.rate === 1 ? 240 : 1; });
      $('#bk', el).addEventListener('change', function (e) { $('#bkl', el).textContent = e.target.checked ? 'Backend answers' : 'Backend down'; });
    },
    unmount: function () { window.removeEventListener('pointerup', this.he); if (this.fb) cancelAnimationFrame(this.fb); },
    tick: function (now, dt) {
      var me = this, el = body;
      if (me.hold) { var p = Math.min(1, (now - me.hold.t0) / 1200); $('#holdp', el).style.strokeDashoffset = 100 - p * 100; if (p >= 1) { me.hold = null; $('#hold', el).classList.remove('down'); $('#holdp', el).style.strokeDashoffset = 100; me.fire('SOS'); } }
      if (me.sw && me.sw.on) { me.sw.left -= dt * me.sw.rate; var m = Math.max(0, me.sw.left); $('#wt', el).textContent = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.floor(m % 60)).padStart(2, '0'); $('#wp', el).style.strokeDashoffset = 100 - (1 - m / me.sw.total) * 100; if (me.sw.left <= 0) { me.sw.on = 0; $('#wt', el).textContent = 'overdue'; me.fire('SafeWalk overdue'); } }
      var px = me.px || 0, py = me.py || 0; if (!me.dragging) { me.px = px * 0.9; me.py = py * 0.9; if (Math.abs(me.px) < 0.3) me.px = 0; if (Math.abs(me.py) < 0.3) me.py = 0; }
      me.ph.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) rotate(' + (px * 0.05).toFixed(2) + 'deg)';
    }
  };

  /* ================= S3: keypad path ================= */
  var S3 = {
    mount: function (el) {
      var me = this, L = F.keypad.labels;
      var keys = [['call', 32.7, 56.6, 'Call'], ['sms', 63.3, 58, 'SMS']], digs = [], cols = [30, 50, 71], rows = [66.4, 73.6, 81.4, 87];
      '123456789*0#'.split('').forEach(function (d, n) { digs.push([d, cols[n % 3], rows[(n / 3) | 0], d]); });
      el.innerHTML = '<div class="s3"><div class="kp"><img src="assets/feature_phone.png" alt="Keypad phone"><svg class="phfb" viewBox="0 0 120 200"><rect x="14" y="6" width="92" height="188" rx="16" fill="#9a9a8a" stroke="#12082B" stroke-width="6"/><rect x="28" y="22" width="64" height="48" fill="#bfe3cf"/></svg><div class="kscr" id="kscr"><b id="kmain">Ready</b><i id="kdig"></i></div>' +
        keys.concat(digs).map(function (k) { return '<button class="key k-' + (k[0].length > 1 ? k[0] : 'd') + '" data-k="' + k[0] + '" style="left:' + k[1] + '%;top:' + k[2] + '%" aria-label="' + (k[0].length > 1 ? k[3] + ' key' : 'Digit ' + k[0]) + '"><span>' + (k[0].length > 1 ? k[3] : '') + '</span></button>'; }).join('') + '</div>' +
        '<div class="pipe" id="pipe"><canvas id="pfx" width="900" height="520"></canvas>' +
        '<div class="pn pn-teth"><b>Tethered phone</b>' + chip('Phone Link') + '</div><div class="pn pn-twi"><b>' + F.keypad.twilioNote + '</b>' + chip('Twilio') + '<code>' + F.keypad.route + '</code></div>' +
        '<div class="pn pn-q"><b>' + L.queue + '</b><div id="qrows" class="qrows"></div></div><div class="pn pn-br"><b>' + L.bridge + '</b>' + chip('audit') + '<div class="poll"><u></u></div></div>' +
        '<div class="pn pn-v"><b>' + L.voice + '</b><div class="vw" id="vw">' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return '<i style="--i:' + n + '"></i>'; }).join('') + '</div></div>' +
        '<div class="say"><code id="say"></code></div><div class="steps" id="steps">' + F.keypad.incoming.map(function (t) { return '<span class="chip">' + K.rich(t) + '</span>'; }).join('') + '</div></div></div>';
      me.q = []; me.flow = new K.Flow({ max: 80 }); me.ctx = $('#pfx', el).getContext('2d'); me.digits = ''; me.timer = 0;
      var P = me.paths = {
        call: me.flow.addPath({ id: 'call', pts: [0, 180, 80, 160, 140, 90, 240, 100], rate: 0, speed: 0.5, color: '#3FE0FF', w: 6 }),
        sms: me.flow.addPath({ id: 'sms', pts: [0, 200, 80, 250, 140, 330, 240, 350], rate: 0, speed: 0.5, color: '#FFC700', w: 6 }),
        t2q: me.flow.addPath({ id: 't2q', pts: [400, 100, 470, 120, 480, 170, 520, 200], rate: 0, speed: 0.5, color: '#3FE0FF', w: 6 }),
        w2q: me.flow.addPath({ id: 'w2q', pts: [400, 350, 470, 330, 480, 280, 520, 260], rate: 0, speed: 0.5, color: '#FFC700', w: 6 }),
        q2b: me.flow.addPath({ id: 'q2b', pts: [660, 200, 700, 160, 720, 120, 760, 100], rate: 0, speed: 0.5, color: '#FF2E93', w: 6 }),
        b2v: me.flow.addPath({ id: 'b2v', pts: [760, 150, 780, 230, 780, 290, 760, 340], rate: 0, speed: 0.5, color: '#FFF4E0', w: 6 })
      };
      me.flow.onArrive = function (p) {
        if (p.id === 'call') { me.flow.emit(P.t2q); } else if (p.id === 'sms') { me.flow.emit(P.w2q); }
        else if (p.id === 't2q' || p.id === 'w2q') { me.q.push(p.id === 't2q' ? 'Missed call' : 'SMS'); me.drawQ(); }
        else if (p.id === 'q2b') { me.flow.emit(P.b2v); me.speak(); }
      };
      me.drawQ = function () { $('#qrows', el).innerHTML = me.q.map(function (t) { return '<i>' + t + '</i>'; }).join(''); };
      me.speak = function () { $('#vw', el).classList.add('on'); K.type($('#say', el), F.keypad.brief, 30); K.audio.chime(); K.$$('#steps .chip', el).forEach(function (c, i) { setTimeout(function () { c.classList.add('lit'); }, 300 + i * 700); }); setTimeout(function () { $('#vw', el).classList.remove('on'); K.$$('#steps .chip', el).forEach(function (c) { c.classList.remove('lit'); }); }, 3600); };
      me.timer = setInterval(function () { if (me.q.length) { me.q.shift(); me.drawQ(); me.flow.emit(P.q2b); } }, F.keypad.pollSecs * 1000);
      K.$$('.key', el).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.dataset.k; K.audio.tick();
          if (k === 'call') { $('#kmain', el).textContent = 'Calling...'; $('#kscr', el).classList.add('ring'); me.flow.burst(P.call, 5); setTimeout(function () { $('#kscr', el).classList.remove('ring'); $('#kmain', el).textContent = 'Missed call'; }, 2200); K.burst && 0; }
          else if (k === 'sms') { $('#kmain', el).textContent = 'SMS sent'; me.flow.burst(P.sms, 5); setTimeout(function () { $('#kmain', el).textContent = 'Ready'; }, 1800); }
          else { me.digits = (me.digits + k).slice(-8); $('#kdig', el).textContent = me.digits; }
        });
      });
    },
    unmount: function () { clearInterval(this.timer); },
    tick: function (now, dt) { var c = this.ctx; c.clearRect(0, 0, 900, 520); this.flow.update(dt, now); this.flow.draw(c, now); }
  };

  /* ================= S4: agent board ================= */
  var S4 = {
    mount: function (el) {
      var me = this; me.i = 0;
      el.innerHTML = '<div class="s4"><div class="roster">' + F.agents.map(function (g, i) { return '<button class="ab" data-i="' + i + '" style="--c:' + g.color + ';--r:' + ((i % 2 ? 1 : -1) * (1 + i % 3)) + 'deg" aria-pressed="' + (i === 0) + '">' + g.id + '</button>'; }).join('') +
        '</div><div class="detail"><div class="dcan"><canvas id="dc"></canvas></div><dl id="dd"></dl></div></div>';
      me.ag = new K.Agent(0, $('#dc', el)); me.env = { intensity: 0.8, user: F.map.user, near: K.nearest() };
      me.show = function (i) { me.i = i; me.ag.i = i; var g = F.agents[i]; $('#dd', el).innerHTML = '<dt>Does</dt><dd>' + K.rich(g.does) + '</dd><dt>Uses</dt><dd>' + K.rich(g.uses) + '</dd><dt>Watch out</dt><dd>' + K.rich(g.watch) + '</dd>'; K.$$('.ab', el).forEach(function (b, n) { b.setAttribute('aria-pressed', n === i); }); me.t0 = performance.now(); };
      K.$$('.ab', el).forEach(function (b) { b.addEventListener('click', function () { me.show(+b.dataset.i); K.audio.tick(); }); });
      me.resize = function () { fit(me.ag, $('.dcan', el)); }; setTimeout(me.resize, 30); window.addEventListener('resize', me.resize); me.show(0);
    },
    unmount: function () { window.removeEventListener('resize', this.resize); },
    tick: function (now, dt) { var me = this, c = ((now - me.t0) % 5200) / 5200; me.ag.p = Math.min(1, c * 1.25); me.ag.state = me.ag.p >= 1 ? 'done' : 'run'; me.ag.since = Math.max(0, c * 1.25 - 1) * 4; me.ag.draw(now / 1000, me.env); }
  };

  /* ================= S5: Haversine toy ================= */
  var S5 = {
    mount: function (el) {
      var me = this, H = F.haversine; me.A = [220, 300]; me.B = [620, 170]; me.drag = null;
      el.innerHTML = '<div class="s5"><canvas id="hc" width="900" height="560" aria-label="Map with two draggable points" data-int></canvas><div class="hf"><h3>' + K.term('Haversine') + '</h3><code>' + H.formula[0] + '</code><code>' + H.formula[1] + '</code><p>' + H.note + '</p><div class="big"><b id="hd">0</b><span>km</span></div></div></div>';
      var cv = $('#hc', el); me.cv = cv; me.ctx = cv.getContext('2d');
      function pos(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * 900 / r.width, (e.clientY - r.top) * 560 / r.height]; }
      cv.addEventListener('pointerdown', function (e) { var p = pos(e); me.drag = Math.hypot(p[0] - me.A[0], p[1] - me.A[1]) < Math.hypot(p[0] - me.B[0], p[1] - me.B[1]) ? 'A' : 'B'; cv.setPointerCapture(e.pointerId); me[me.drag] = p; });
      cv.addEventListener('pointermove', function (e) { if (me.drag) me[me.drag] = pos(e); }); cv.addEventListener('pointerup', function () { me.drag = null; });
    },
    unmount: function () { },
    tick: function (now) {
      var me = this, c = me.ctx, m = F.map, A = me.A, B = me.B, i;
      function ll(p) { return [m.lat0 + (1 - p[1] / 560) * m.dLat, m.lon0 + p[0] / 900 * m.dLon]; }
      c.clearRect(0, 0, 900, 560); c.fillStyle = K.COL.indigo; c.fillRect(0, 0, 900, 560); c.globalAlpha = 0.25; c.fillStyle = K.dotPattern(c, K.COL.violet); c.fillRect(0, 0, 900, 560); c.globalAlpha = 1;
      c.strokeStyle = 'rgba(255,244,224,.12)'; c.lineWidth = 2; for (i = 1; i < 9; i++) { c.beginPath(); c.moveTo(i * 100, 0); c.lineTo(i * 100, 560); c.stroke(); } for (i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, i * 100); c.lineTo(900, i * 100); c.stroke(); }
      var a = ll(A), b = ll(B), d = K.haversine(a[0], a[1], b[0], b[1]);
      c.setLineDash([16, 12]); c.lineDashOffset = -now * 0.03; c.strokeStyle = K.COL.ink; c.lineWidth = 12; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); c.strokeStyle = K.COL.gold; c.lineWidth = 6; c.stroke(); c.setLineDash([]);
      [[A, 'A', K.COL.cyan], [B, 'B', K.COL.mag]].forEach(function (p) { c.fillStyle = K.COL.ink; c.beginPath(); c.arc(p[0][0], p[0][1], 30, 0, 7); c.fill(); c.fillStyle = p[2]; c.beginPath(); c.arc(p[0][0], p[0][1], 24, 0, 7); c.fill(); c.fillStyle = K.COL.ink; c.font = 'bold 30px ' + K.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p[1], p[0][0], p[0][1] + 2); });
      var mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2 - 36, txt = d.toFixed(2) + ' km'; c.font = 'bold 34px ' + K.MONO; var tw = c.measureText(txt).width + 28; c.fillStyle = K.COL.ink; c.fillRect(mx - tw / 2, my - 26, tw, 52); c.fillStyle = K.COL.paper; c.fillText(txt, mx, my + 2);
      $('#hd', body).textContent = d.toFixed(2);
    }
  };

  /* ================= S6: provider failover ================= */
  var S6 = {
    mount: function (el) {
      var me = this, N = F.providers.length;
      el.innerHTML = '<div class="s6"><canvas id="fc" width="1000" height="620" data-int aria-label="Providers. Click one to knock it out"></canvas><p class="note">Click a provider to knock it out.</p></div>';
      me.cv = $('#fc', el); me.ctx = me.cv.getContext('2d'); me.flow = new K.Flow({ max: 200 }); me.down = []; me.hits = []; me.pos = [];
      var i, y;
      for (i = 0; i < N; i++) { y = 60 + i * 100; me.pos.push([800, y]); me.down.push(false); me.hits.push(0); me.flow.addPath({ id: i, pts: [190, 310, 380, 310, 500, y, 710, y], rate: 3, speed: 0.55, color: i < 4 ? '#FFC700' : i === 4 ? '#3FE0FF' : '#FF2E93', w: 5, size: 7 }); }
      me.flow.onArrive = function (p) { me.hits[p.id] = 1; };
      me.cv.addEventListener('click', function (e) { var r = me.cv.getBoundingClientRect(), x = (e.clientX - r.left) * 1000 / r.width, y2 = (e.clientY - r.top) * 620 / r.height, k; for (k = 0; k < N; k++) if (Math.abs(y2 - me.pos[k][1]) < 44 && x > 700) { me.down[k] = !me.down[k]; K.audio.tick(); me.rebalance(); } });
      me.rebalance = function () { var up = me.down.filter(function (d) { return !d; }).length || 1, k; for (k = 0; k < N; k++) { var p = me.flow.paths[k]; p.rate = me.down[k] ? 0 : 18 / up; p.cutUntil = me.down[k] ? 1e12 : 0; p.cutT = 0.55; } };
      me.rebalance();
    },
    unmount: function () { },
    tick: function (now, dt) {
      var me = this, c = me.ctx, i; c.clearRect(0, 0, 1000, 620); me.flow.update(dt, now);
      c.fillStyle = K.COL.ink; c.beginPath(); c.arc(110, 310, 86, 0, 7); c.fill(); c.fillStyle = K.COL.violet; c.beginPath(); c.arc(110, 310, 74, 0, 7); c.fill(); c.fillStyle = K.COL.paper; c.font = 'bold 30px ' + K.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('agents', 110, 312);
      me.flow.draw(c, now);
      for (i = 0; i < me.pos.length; i++) {
        me.hits[i] = Math.max(0, me.hits[i] - dt * 4); var x = me.pos[i][0], y = me.pos[i][1], dn = me.down[i], s = 1 + me.hits[i] * 0.08;
        c.save(); c.translate(x + 90, y); c.scale(s, s); c.fillStyle = K.COL.ink; c.fillRect(-100, -38, 200, 76); c.fillStyle = dn ? '#3a2f6e' : K.COL.paper; c.fillRect(-94, -32, 188, 64); c.fillStyle = dn ? K.COL.paper : K.COL.ink; c.font = 'bold 28px ' + K.FONT; c.fillText(F.providers[i], 0, 2);
        if (dn) { c.strokeStyle = K.COL.mag; c.lineWidth = 10; c.beginPath(); c.moveTo(-90, -28); c.lineTo(90, 28); c.moveTo(90, -28); c.lineTo(-90, 28); c.stroke(); } c.restore();
      }
    }
  };

  sims = [S1, S2, S3, S4, S5, S6];
  F.ui.tabs.forEach(function (t, i) { var b = K.el('button', 'xtab', t); b.setAttribute('role', 'tab'); b.setAttribute('data-int', ''); b.addEventListener('click', function () { X.sel(i); }); tabs.appendChild(b); });
  X.sel = function (i) {
    if (active && active.unmount) active.unmount(); X.cur = i; body.innerHTML = ''; K.$$('.xtab', tabs).forEach(function (b, n) { b.setAttribute('aria-selected', n === i); b.classList.toggle('cur', n === i); });
    active = sims[i]; var host = K.el('div', 'xhost x' + (i + 1)); body.appendChild(host); active.mount(host); host.classList.add('in');
  };
  X.show = function () { root.hidden = false; X.open = true; X.sel(X.cur); };
  X.hide = function () { if (active && active.unmount) active.unmount(); active = null; body.innerHTML = ''; root.hidden = true; X.open = false; };
  X.tick = function (now, dt) { if (active && active.tick) active.tick(now, dt); };
})();
