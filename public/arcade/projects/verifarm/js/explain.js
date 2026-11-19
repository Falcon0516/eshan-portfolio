/* EXPLAIN card + top nav renderer. Content: data/explain.js (window.EXPLAIN), data/links.js (window.ARCADE_LINKS). Key: E. */
(function () {
  var D = window.EXPLAIN; if (!D) return;
  var th = D.theme || {}, root = document.documentElement.style;
  root.setProperty('--ex-bg', th.bg || '#101418'); root.setProperty('--ex-ink', th.ink || '#eef3f6');
  root.setProperty('--ex-accent', th.accent || '#ffb000'); root.setProperty('--ex-line', th.line || '#58636d');
  root.setProperty('--ex-font', th.font || 'Georgia,"Times New Roman",serif');
  root.setProperty('--ex-mono', 'ui-monospace,"SF Mono",Menlo,Consolas,"Courier New",monospace');

  function el(tag, cls, txt, par) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; if (par) par.appendChild(e); return e; }

  /* Resolve current project slug without hard-coding URLs */
  var slugMatch = /\/projects\/([^/]+)\//i.exec(location.pathname || '');
  var slug = (window.CHAT && window.CHAT.slug) || (slugMatch && decodeURIComponent(slugMatch[1])) ||
    (D.title || '').toLowerCase().replace(/\s*&\s*/g, '-and-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  var linksMap = window.ARCADE_LINKS || {};
  var fallback = window.ARCADE_LINKS_FALLBACK || {};
  var linkEntry = linksMap[slug] || {};
  var hasOwnUrl = !!(linkEntry.url && linkEntry.url.trim());
  var destUrl = hasOwnUrl ? linkEntry.url.trim() : (fallback.url || '');
  var destKind = hasOwnUrl ? (linkEntry.label || 'PROJECT') : (fallback.label || 'GITHUB');

  /* Resolve return path back to the portfolio view the visitor came from */
  function resolvePortfolioUrl() {
    if (location.protocol === 'file:') return 'https://eshan-portfolio.streyeke.cloud';
    var m = /[?&]from=([^&#]*)/.exec(location.search || '');
    var from = m ? decodeURIComponent(m[1]) : '';
    var saved = '';
    try { saved = sessionStorage.getItem('arc_return') || ''; } catch (e) {}
    if (from === 'pro') {
      saved = '/Eshan_Portfolio/index.html';
    } else if (from === 'portfolio' || from === 'game') {
      var ref = document.referrer || '';
      if (ref && ref.indexOf(location.origin) === 0 && ref.indexOf('/Eshan_Portfolio') !== -1) {
        saved = '/Eshan_Portfolio/index.html';
      } else {
        saved = '/';
      }
    }
    if (saved) {
      try { sessionStorage.setItem('arc_return', saved); } catch (e) {}
      return saved;
    }
    return '/';
  }

  /* Top cluster: EXPLAIN + TAKE ME TO PROJECT */
  var topBar = el('div', th.left ? 'ex-left' : null, null, document.body);
  topBar.id = 'ex-top';
  if (th.top) topBar.style.top = th.top + 'px';

  var btn = el('button', null, null, topBar); btn.id = 'ex-btn'; btn.type = 'button';
  btn.setAttribute('aria-label', 'Explain this project in detail (E)'); btn.setAttribute('aria-haspopup', 'dialog');
  el('i', null, 'E', btn); el('span', null, 'EXPLAIN', btn);

  var goBtn = null;
  if (destUrl) {
    goBtn = el('a', null, null, topBar);
    goBtn.id = 'ex-go';
    goBtn.href = destUrl;
    goBtn.target = '_blank';
    goBtn.rel = 'noopener noreferrer';
    goBtn.setAttribute('aria-label', 'Take me to project ' + D.title + ' (' + destKind + ', opens in a new tab)');
    goBtn.title = destKind + ': ' + destUrl;
    el('span', null, 'TAKE ME TO PROJECT', goBtn);
    el('span', 'ex-arr', '\u2197', goBtn);
  }

  /* Return path button: PORTFOLIO */
  var portBtn = el('a', null, '\u25C0 PORTFOLIO', document.body);
  portBtn.id = 'ex-port';
  var portUrl = resolvePortfolioUrl();
  portBtn.href = portUrl;
  if (location.protocol === 'file:') {
    portBtn.target = '_blank';
    portBtn.rel = 'noopener noreferrer';
    portBtn.setAttribute('aria-label', 'Open live portfolio website (opens in a new tab)');
  } else {
    portBtn.setAttribute('aria-label', 'Back to Eshan portfolio');
  }

  function layoutChrome() {
    var w = window.innerWidth;
    var backEl = document.getElementById('back') || document.getElementById('arcade');
    if (w <= 820) {
      if (portBtn.parentNode !== topBar) topBar.insertBefore(portBtn, topBar.firstChild);
      portBtn.style.left = '';
      portBtn.style.top = '';
      var maxB = 56;
      var sels = ['#back', '#arcade', '#top', '#topbar', '#bar', '#ctrls', '#modes', '#keys', '#toggles', '#modeBtn', '#modebtn', '#simbadge', '.badge', '#badge', '#tools'];
      sels.forEach(function (sel) {
        var nodes = document.querySelectorAll(sel);
        for (var i = 0; i < nodes.length; i++) {
          var r = nodes[i].getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && r.top < 140 && r.bottom > maxB) {
            maxB = Math.ceil(r.bottom);
          }
        }
      });
      root.setProperty('--ex-mob-top', (maxB + 6) + 'px');
      return;
    }

    if (portBtn.parentNode !== document.body) document.body.appendChild(portBtn);
    root.removeProperty('--ex-mob-top');
    if (backEl) {
      var br = backEl.getBoundingClientRect();
      if (br.width > 0 && br.height > 0) {
        if (th.left) {
          portBtn.style.left = Math.round(br.left) + 'px';
          portBtn.style.top = Math.round(br.bottom + 8) + 'px';
        } else {
          portBtn.style.left = Math.round(br.right + 8) + 'px';
          portBtn.style.top = Math.round(br.top) + 'px';
        }
      }
    }
  }
  layoutChrome();
  window.addEventListener('resize', layoutChrome);
  window.addEventListener('load', layoutChrome);

  /* EXPLAIN modal card */
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
  if (destUrl) {
    var footGo = el('a', null, 'TAKE ME TO PROJECT \u2197 (' + destKind + ')', foot);
    footGo.id = 'ex-foot-go';
    footGo.href = destUrl;
    footGo.target = '_blank';
    footGo.rel = 'noopener noreferrer';
    footGo.setAttribute('aria-label', 'Take me to project ' + D.title + ' (' + destKind + ', opens in a new tab)');
  }
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
  ['pointerdown', 'click', 'wheel', 'touchstart'].forEach(function (t) {
    scrim.addEventListener(t, function (e) { e.stopPropagation(); });
    topBar.addEventListener(t, function (e) { e.stopPropagation(); });
    portBtn.addEventListener(t, function (e) { e.stopPropagation(); });
  });
  window.addEventListener('arcade:open-explain', function () { set(true); });
  window.addEventListener('keydown', function (e) {
    if (document.body.classList.contains('ch-open')) return;
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
