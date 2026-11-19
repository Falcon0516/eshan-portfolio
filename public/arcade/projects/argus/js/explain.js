/* EXPLAIN card renderer. Content: data/explain.js (window.EXPLAIN). Key: E. */
(function () {
  var D = window.EXPLAIN; if (!D) return;
  var th = D.theme || {}, root = document.documentElement.style;
  root.setProperty('--ex-bg', th.bg || '#101418'); root.setProperty('--ex-ink', th.ink || '#eef3f6');
  root.setProperty('--ex-accent', th.accent || '#ffb000'); root.setProperty('--ex-line', th.line || '#58636d');
  root.setProperty('--ex-font', th.font || 'Georgia,"Times New Roman",serif');
  root.setProperty('--ex-mono', 'ui-monospace,"SF Mono",Menlo,Consolas,"Courier New",monospace');
  if (typeof th.top === 'number') { /* per-project vertical offset for the button */ }
  function el(tag, cls, txt, par) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; if (par) par.appendChild(e); return e; }
  var btn = el('button', null, null, document.body); btn.id = 'ex-btn'; btn.type = 'button';
  btn.setAttribute('aria-label', 'Explain this project in detail (E)'); btn.setAttribute('aria-haspopup', 'dialog');
  el('i', null, 'E', btn); el('span', null, 'EXPLAIN', btn);
  if (th.top) btn.style.top = th.top + 'px';
  if (th.left) btn.style.left = th.left;
  var scrim = el('div', null, null, document.body); scrim.id = 'ex-scrim'; scrim.setAttribute('role', 'dialog'); scrim.setAttribute('aria-modal', 'true'); scrim.setAttribute('aria-label', D.title + ' in detail');
  var card = el('div', null, null, scrim); card.id = 'ex-card';
  var x = el('button', null, '\u00d7', card); x.id = 'ex-x'; x.type = 'button'; x.setAttribute('aria-label', 'Close');
  var rail = el('aside', null, null, card); rail.id = 'ex-rail';
  el('span', 'ex-tag', 'PROJECT FILE', rail);
  var h = el('h2', null, D.title, rail); h.id = 'ex-title';
  el('p', null, D.line, rail).id = 'ex-line';
  if (D.achievements && D.achievements.length) {
    el('div', 'ex-h', 'ACHIEVEMENTS', rail);
    var ul = el('ul', null, null, rail); ul.id = 'ex-ach';
    D.achievements.forEach(function (a) { var li = el('li', null, null, ul); el('b', null, a.k, li); var d = el('div', null, null, li); el('strong', null, a.t, d); if (a.s) el('span', null, a.s, d); });
  }
  el('div', 'ex-h', 'BUILT WITH', rail);
  var st = el('div', null, null, rail); st.id = 'ex-stack'; D.stack.forEach(function (s) { el('span', null, s, st); });
  var main = el('div', null, null, card); main.id = 'ex-main'; main.tabIndex = 0;
  D.sections.forEach(function (s, i) {
    var sec = el('section', null, null, main); el('div', 'ex-n', (i + 1 < 10 ? '0' : '') + (i + 1), sec);
    var box = el('div', null, null, sec); el('h3', null, s.h, box);
    var u = el('ul', null, null, sec);
    s.pts.forEach(function (p) { var li = el('li', null, null, u); var m = /^(.*?)\s*\[(.+)\]$/.exec(p); li.appendChild(document.createTextNode(m ? m[1] : p)); if (m) el('em', null, m[2], li); });
  });
  var foot = el('footer', null, null, card); foot.id = 'ex-foot';
  (D.links || []).forEach(function (l) { var a = el('a', null, l.label + '  ' + l.url, foot); a.href = 'https://' + l.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  el('span', 'sp', '', foot); el('span', 'k', 'E or Esc to close', foot);
  var open = false, last = null;
  function set(on) {
    if (on === open) return; open = on; scrim.classList.toggle('on', on); document.body.classList.toggle('ex-open', on);
    if (on) { last = document.activeElement; main.scrollTop = 0; x.focus(); } else if (last && last.focus) { try { last.focus(); } catch (e) {} }
  }
  btn.addEventListener('click', function (e) { e.stopPropagation(); set(true); });
  x.addEventListener('click', function () { set(false); });
  scrim.addEventListener('click', function (e) { if (e.target === scrim) set(false); });
  ['pointerdown', 'click', 'wheel', 'touchstart'].forEach(function (t) { scrim.addEventListener(t, function (e) { e.stopPropagation(); }); btn.addEventListener(t, function (e) { e.stopPropagation(); }); });
  window.addEventListener('keydown', function (e) {
    var k = e.key, tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if ((k === 'e' || k === 'E') && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); e.stopImmediatePropagation(); set(!open); return; }
    if (!open) return;
    if (k === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); set(false); return; }
    if (k === 'Tab') return;
    if (k === 'ArrowDown' || k === 'PageDown' || k === ' ') { e.stopImmediatePropagation(); if (k !== 'ArrowDown') { e.preventDefault(); main.scrollBy({ top: main.clientHeight * 0.8 }); } return; }
    if (k === 'ArrowUp' || k === 'PageUp') { e.stopImmediatePropagation(); if (k === 'PageUp') { e.preventDefault(); main.scrollBy({ top: -main.clientHeight * 0.8 }); } return; }
    e.stopImmediatePropagation();
  }, true);
})();
