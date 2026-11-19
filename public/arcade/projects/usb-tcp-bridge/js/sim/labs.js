/* labs.js: EXPLORE mode. Seven simulation labs, all SIMULATION · illustrative. */
(function () {
  'use strict';
  var U = window.UTB, F = U.FACTS, S = U.Stage, B = U.Bridge, UI = U.UI;
  var $ = function (id) { return document.getElementById(id); };
  var Labs = U.Labs = { cur: null };
  var CAMS = {
    pipes: { x: 1630, y: 960, w: 3300 }, framing: { x: 1450, y: 880, w: 1450 }, queue: { x: 1800, y: 890, w: 1500 },
    power: { x: 1650, y: 900, w: 1700 }, failsafe: { x: 1585, y: 1090, w: 2700 }, baud: { x: 1450, y: 880, w: 1450 }, ports: { x: 1630, y: 960, w: 3300 }
  };
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function btn(txt, fn, cls) { var b = h('button', 'lb ' + (cls || ''), txt); b.type = 'button'; b.addEventListener('click', function (e) { e.stopPropagation(); fn(b); }); return b; }
  function row(label) { var r = h('div', 'lrow'); if (label) r.appendChild(h('span', 'llab', label)); return r; }
  function slider(label, min, max, val, fn) {
    var r = row(label), i = h('input'); i.type = 'range'; i.min = min; i.max = max; i.value = val; i.setAttribute('aria-label', label);
    var o = h('output', 'lval', val); i.addEventListener('input', function () { o.textContent = i.value; fn(+i.value); }); r.appendChild(i); r.appendChild(o); return r;
  }
  var timer = 0;
  function stopTimers() { clearInterval(timer); timer = 0; }

  Labs.build = function () {
    var tabs = $('labTabs'); tabs.innerHTML = '';
    F.labs.forEach(function (l, i) {
      var b = h('button', 'ltab', l.name); b.type = 'button'; b.setAttribute('data-lab', l.id);
      b.addEventListener('click', function (e) { e.stopPropagation(); Labs.open(l.id); }); tabs.appendChild(b);
    });
  };
  Labs.open = function (id) {
    stopTimers(); U.Dir.clear(); Labs.cur = id; document.body.setAttribute('data-lab', id);
    var tabs = $('labTabs').children; for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('on', tabs[i].getAttribute('data-lab') === id);
    var lab = F.labs.filter(function (l) { return l.id === id; })[0], p = $('labPanel'); p.innerHTML = '';
    p.appendChild(h('p', 'lcap', UI.termify(lab.cap)));
    B.reset(); B.mode = 'bytes'; B.hookDrops(); S.conn(true); S.hlPort(null); S.scene('all'); S.moveTo(CAMS[id], 1100); S.note('');
    S.plugTo(CAMS[id].x - CAMS[id].w * .22, CAMS[id].y - CAMS[id].w * .2, 0, 700, 80);
    B.setAmb({ sensors: id === 'pipes' || id === 'ports' });
    LAB[id](p);
  };
  var LAB = {
    pipes: function (p) {
      var res = h('p', 'lres', 'Pick a line or type one.'), side = 'robot';
      function send(text, from) {
        text = text || '(empty)';
        if (from === 'robot') { B.robotSend(text, true); res.textContent = text.indexOf('US:') === 0 ? 'Router: US: prefix, split to port 8004.' : /^(ACCEL|GPS):/.test(text) ? 'Router only splits US:. This goes to main 1234. Sensors stream from the phone.' : 'Router: no match, main bridge 1234.'; }
        else if (from === 'phone') { B.sensor(/^GPS/.test(text) ? 'gps' : 'tele', text, true); res.textContent = /^GPS/.test(text) ? 'Phone GPS stream, port 8002.' : 'Phone sensor stream, port 8001.'; }
        else { var ok = B.laptopSend(text, true); res.textContent = ok ? 'Laptop to robot, through the TCP to USB queue.' : 'No client or service. Nothing sent.'; }
      }
      var chips = row('LINES'), sm = F.samples;
      [[sm.us, 'robot'], [sm.hello, 'robot'], [sm.accel, 'phone'], [sm.gps, 'phone'], [sm.m, 'laptop'], [sm.stop, 'laptop']].forEach(function (c) { chips.appendChild(btn(c[0], function () { send(c[0], c[1]); }, 'chip')); });
      p.appendChild(chips);
      var r = row('CUSTOM'), inp = h('input', 'ltext'); inp.type = 'text'; inp.value = 'US:5,6,7'; inp.maxLength = 40; inp.setAttribute('aria-label', 'Custom line');
      inp.addEventListener('keydown', function (e) { e.stopPropagation(); });
      r.appendChild(inp); r.appendChild(btn('ROBOT \u25B6', function () { send(inp.value, 'robot'); })); r.appendChild(btn('\u25C0 LAPTOP', function () { send(inp.value, 'laptop'); }));
      p.appendChild(r); p.appendChild(res);
    },
    framing: function (p) {
      var nl = true, bin = false, out = h('div', 'fout'), r = row('');
      var bn = btn('NEWLINE: ON', function (b) { nl = !nl; b.textContent = 'NEWLINE: ' + (nl ? 'ON' : 'OFF'); run(); });
      var bb = btn('BINARY: OFF', function (b) { bin = !bin; b.textContent = 'BINARY: ' + (bin ? 'ON' : 'OFF'); run(); });
      r.appendChild(bn); r.appendChild(bb); p.appendChild(r); p.appendChild(out);
      function run() {
        var bytes = bin ? ['01', '0A', '42', '0A', '7F'] : null, msgs = [], buf = [];
        var stream = bin ? bytes : (F.samples.us + (nl ? '\n' : '') + F.samples.hello + (nl ? '\n' : '') + 'US:9,41,30' + (nl ? '\n' : '')).split('');
        var rowIn = '<div class="frow"><span class="llab">BYTES IN</span>';
        stream.forEach(function (c) {
          var nlb = (c === '\n' || c === '0A'); rowIn += '<span class="fc' + (nlb ? ' nl' : '') + '">' + (c === '\n' ? '\u21B5' : (nlb ? '0A' : c)) + '</span>';
          if (nlb) { msgs.push(buf.join(' ')); buf = []; } else buf.push(c);
        });
        rowIn += '</div><div class="frow"><span class="llab">MESSAGES</span>';
        msgs.forEach(function (m) { rowIn += '<span class="fm' + (bin ? ' bad' : '') + '">' + (m || '(empty)') + '</span>'; });
        if (buf.length) rowIn += '<span class="fm wait">' + buf.join(bin ? ' ' : '') + ' ...never ends</span>';
        rowIn += '</div><p class="lres">' + (bin ? 'One binary packet became ' + msgs.length + ' pieces. Newline framing breaks on binary.' : nl ? 'Each newline closes a message.' : 'No newline: everything merges into one message that never ends.') + '</p>';
        out.innerHTML = rowIn;
      }
      run();
    },
    queue: function (p) {
      B.mode = 'lines'; B.lineRate = 7; B.setWifi(1);
      p.appendChild(slider('WI-FI SPEED', 0, 100, 100, function (v) { B.setWifi(v / 100); }));
      p.appendChild(slider('SERIAL RATE', 1, 14, 7, function (v) { B.lineRate = v; }));
      p.appendChild(h('p', 'lres', 'Queue holds 1000 slots [DataBridge]. When full, the oldest line drops.'));
    },
    power: function (p) {
      B.setAmb({ robot: 2.2, sensors: true });
      var r = row(''), bs, bl;
      bs = btn('SCREEN: ON', function () { B.setScreen(!B.screen); bs.textContent = 'SCREEN: ' + (B.screen ? 'ON' : 'OFF'); });
      bl = btn('WAKE LOCKS: ON', function () { B.toggleLock(); bl.textContent = 'WAKE LOCKS: ' + (B.locks ? 'ON' : 'OFF'); });
      r.appendChild(bs); r.appendChild(bl); r.appendChild(btn('RE-PLUG USB', function () { B.plugBackIn(); B.setAmb({ robot: 2.2, sensors: true }); }));
      var bar = h('div', 'kbar', '<i></i>'), res = h('p', 'lres', 'Screen off and no locks: the service is killed (sped-up timer).');
      p.appendChild(r); p.appendChild(bar); p.appendChild(res);
      Labs._sync = function () { bs.textContent = 'SCREEN: ' + (B.screen ? 'ON' : 'OFF'); bl.textContent = 'WAKE LOCKS: ' + (B.locks ? 'ON' : 'OFF'); bar.firstChild.style.width = (B.killFrac * 100) + '%'; };
      timer = setInterval(Labs._sync, 100);
    },
    failsafe: function (p) {
      B.motorSet(7); B.setAmb({ cmd: 1.8, robot: 3 });
      var out = h('div', 'wire', 'serial out: <b>(nothing yet)</b>'), r = row('');
      B.hooks.failsafe = function () { out.innerHTML = 'serial out: <b>M:0,0\\n</b>'; };
      r.appendChild(btn('DISCONNECT CLIENT', function () { B.disconnectClient(); }));
      r.appendChild(btn('KILL SERVICE', function () { B.killService(); }));
      r.appendChild(btn('RESET', function () { B.reset(); B.motorSet(7); B.setAmb({ cmd: 1.8, robot: 3 }); out.innerHTML = 'serial out: <b>(nothing yet)</b>'; }));
      p.appendChild(r); p.appendChild(out);
    },
    baud: function (p) {
      var rb = 115200, pb = 115200, shown = h('p', 'baudout'), res = h('p', 'lres');
      function mk(label, get, set) {
        var r = row(label); [9600, 115200].forEach(function (v) { var b = btn(String(v), function () { set(v); upd(); }); b.dataset.v = v; r.appendChild(b); }); r._u = function () { var k = r.querySelectorAll('button'); for (var i = 0; i < k.length; i++) k[i].classList.toggle('on', +k[i].dataset.v === get()); }; return r;
      }
      var a = mk('ROBOT BAUD', function () { return rb; }, function (v) { rb = v; }), b = mk('PHONE BAUD', function () { return pb; }, function (v) { pb = v; });
      var g = '\u2592\u2591?\u00bf~#%&\u00a4'; 
      function upd() {
        a._u(); b._u(); var t = F.samples.us, o = '';
        for (var i = 0; i < t.length; i++) o += rb === pb ? t[i] : g[(t.charCodeAt(i) * 7 + i * 3) % g.length];
        shown.textContent = 'phone reads: ' + o; shown.classList.toggle('bad', rb !== pb);
        res.textContent = rb === pb ? 'Speeds match. Clean text.' : 'Speeds differ. Garbled text.';
      }
      p.appendChild(a); p.appendChild(b);
      p.appendChild(btn('AFTER PERMISSION PROMPT', function () { pb = 9600; upd(); res.textContent = 'Saved baud is lost. Phone falls back to 9600 [build log].'; }, 'chip'));
      p.appendChild(shown); p.appendChild(res); upd();
    },
    ports: function (p) {
      var info = h('p', 'lres', 'Click a port socket on the laptop, or a button.'), r = row('');
      function pick(k) { var po = F.ports.filter(function (x) { return x.key === k; })[0]; S.hlPort(k); info.innerHTML = '<b>' + po.n + ' ' + po.name + '</b>: ' + po.line + ' <span class="src">[' + po.src + ']</span>'; }
      F.ports.forEach(function (po) { r.appendChild(btn(String(po.n), function () { pick(po.key); })); });
      Labs._pick = pick; p.appendChild(r); p.appendChild(info); p.appendChild(h('p', 'lres small', F.portsFoot));
    }
  };
  Labs.close = function () { stopTimers(); B.hooks.failsafe = null; Labs._pick = null; document.body.removeAttribute('data-lab'); S.hlPort(null); };
  Labs.act = function (name) { if (name.indexOf('port:') === 0 && Labs._pick) Labs._pick(name.slice(5)); };
})();
