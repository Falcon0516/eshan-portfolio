/* EXPLAIN card, top chrome dock, Resume modal, and project spotlight tutorial. */
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
    } else if (from === 'game') {
      saved = '/';
    } else if (from === 'portfolio') {
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

  /* Top cluster: PORTFOLIO + RESUME + EXPLAIN + TAKE ME TO PROJECT (+ SND? + ?) */
  var topBar = el('div', null, null, document.body);
  topBar.id = 'ex-top';

  /* Return path button: PORTFOLIO */
  var portBtn = el('a', null, null, topBar);
  portBtn.id = 'ex-port';
  el('span', 'ex-lbl-desk', '\u25C0 PORTFOLIO', portBtn);
  el('span', 'ex-lbl-mob', '\u25C0 PORT', portBtn);
  var portUrl = resolvePortfolioUrl();
  portBtn.href = portUrl;
  if (location.protocol === 'file:') {
    portBtn.target = '_blank';
    portBtn.rel = 'noopener noreferrer';
    portBtn.setAttribute('aria-label', 'Open live portfolio website (opens in a new tab)');
  } else {
    portBtn.setAttribute('aria-label', 'Back to Eshan portfolio');
  }

  var resBtn = el('button', null, 'RESUME', topBar);
  resBtn.id = 'ex-res';
  resBtn.type = 'button';
  resBtn.setAttribute('aria-label', 'View and download Eshan H resume');
  resBtn.setAttribute('aria-haspopup', 'dialog');

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
    el('span', 'ex-lbl-desk', 'TAKE ME TO PROJECT', goBtn);
    el('span', 'ex-lbl-mob', 'PROJECT', goBtn);
    el('span', 'ex-arr', '\u2197', goBtn);
  }

  var tutBtn = el('button', null, '?', topBar);
  tutBtn.id = 'ex-tut-btn';
  tutBtn.type = 'button';
  tutBtn.setAttribute('aria-label', 'Show showcase tutorial guide');
  tutBtn.title = 'How to explore & chat';

  /* For showcases lacking an on-screen mute button (saathi, soil-and-toil), provide synced SND pill */
  var sndBtn = null;
  if (!document.querySelector('#mbtn,#mBtn,#btnM,#bM,#b-m,#soundbtn,#mSound')) {
    sndBtn = el('button', null, 'SND', topBar);
    sndBtn.id = 'ex-snd';
    sndBtn.type = 'button';
    sndBtn.setAttribute('aria-label', 'Toggle sound (M)');
    function syncSndPill() {
      var on = false;
      try { on = localStorage.getItem('arc_snd') === '1'; } catch (e) {}
      sndBtn.textContent = on ? 'SND ON' : 'SND';
      sndBtn.classList.toggle('on', on);
      sndBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    syncSndPill();
    window.addEventListener('arcade:sound-sync', syncSndPill);
    window.addEventListener('pageshow', syncSndPill);
    sndBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
      syncSndPill();
    });
  }

  function layoutChrome() {
    var w = window.innerWidth;
    var backEl = document.getElementById('back') || document.getElementById('arcade');
    if (w <= 920) {
      topBar.classList.remove('ex-compact');
      topBar.style.left = '';
      topBar.style.top = '';
      topBar.style.transform = '';
      var maxB = 48;
      var sels = ['#back', '#arcade', '#top', '#topbar', '#bar', '#ctrls', '#modes', '#keys', '#toggles', '#modeBtn', '#modebtn', '#tools'];
      sels.forEach(function (sel) {
        var nodes = document.querySelectorAll(sel);
        for (var i = 0; i < nodes.length; i++) {
          var r = nodes[i].getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && r.top < 110 && r.bottom > maxB) {
            maxB = Math.ceil(r.bottom);
          }
        }
      });
      root.setProperty('--ex-mob-top', (maxB + 6) + 'px');
      return;
    }

    root.removeProperty('--ex-mob-top');
    var ledgerEl = document.getElementById('ledger');
    var br = backEl ? backEl.getBoundingClientRect() : null;
    var rowY = br && br.width > 0 ? Math.round(br.top) : 12;
    if (ledgerEl) {
      var lr = ledgerEl.getBoundingClientRect();
      if (lr.width > w * 0.7 && lr.top <= 12) rowY = Math.round(lr.bottom + 10);
    }

    /* Find the widest clean horizontal slot on rowY without overlapping native controls or badges */
    var bandTop = rowY - 2, bandBot = rowY + 46;
    var blocked = [];
    var scanNodes = document.querySelectorAll('a, button, #simbadge, .badge, #badge');
    for (var si = 0; si < scanNodes.length; si++) {
      var node = scanNodes[si];
      if ((node.id || '').indexOf('ex-') === 0 || (node.id || '').indexOf('ch-') === 0) continue;
      if (node.closest('#ex-top, #ex-scrim, #ex-res-scrim, #ex-tut, #ch-panel')) continue;
      var st = window.getComputedStyle(node);
      if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') continue;
      var nr = node.getBoundingClientRect();
      if (nr.width <= 0 || nr.height <= 0 || nr.right <= 0 || nr.left >= w) continue;
      if (nr.bottom > bandTop && nr.top < bandBot) {
        blocked.push([Math.max(0, nr.left - 8), Math.min(w, nr.right + 8)]);
      }
    }
    blocked.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [];
    for (var bi = 0; bi < blocked.length; bi++) {
      var cur = blocked[bi];
      if (!merged.length || cur[0] > merged[merged.length - 1][1]) merged.push([cur[0], cur[1]]);
      else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], cur[1]);
    }

    var cursor = 8, bestL = 8, bestR = w - 8, bestW = 0;
    for (var mi = 0; mi < merged.length; mi++) {
      if (merged[mi][0] - cursor > bestW) {
        bestW = merged[mi][0] - cursor;
        bestL = cursor; bestR = merged[mi][0];
      }
      cursor = Math.max(cursor, merged[mi][1]);
    }
    if ((w - 8) - cursor > bestW) {
      bestW = (w - 8) - cursor;
      bestL = cursor; bestR = w - 8;
    }

    topBar.classList.remove('ex-compact');
    topBar.style.transform = 'none';
    topBar.style.top = rowY + 'px';
    var fullW = topBar.getBoundingClientRect().width;
    if (fullW > bestW) {
      topBar.classList.add('ex-compact');
    }
    var finalW = topBar.getBoundingClientRect().width;
    var x = Math.round(bestL + Math.max(0, (bestW - finalW) / 2));
    x = Math.max(bestL, Math.min(x, bestR - finalW));
    topBar.style.left = Math.max(8, x) + 'px';
  }
  layoutChrome();
  window.addEventListener('resize', layoutChrome);
  window.addEventListener('load', layoutChrome);

  /* EXPLAIN modal card with single-scroll mobile layout + sticky Full Expand & Close bar */
  var scrim = el('div', null, null, document.body); scrim.id = 'ex-scrim'; scrim.setAttribute('role', 'dialog'); scrim.setAttribute('aria-modal', 'true'); scrim.setAttribute('aria-label', D.title + ' in detail');
  var card = el('div', null, null, scrim); card.id = 'ex-card';

  var winBar = el('div', null, null, card); winBar.id = 'ex-win-bar';
  el('span', null, 'PROJECT FILE · ' + D.title, winBar).id = 'ex-mob-pill';
  var winBtns = el('div', null, null, winBar);
  winBtns.style.display = 'flex';
  var expBtn = el('button', null, 'FULL VIEW', winBtns); expBtn.id = 'ex-expand'; expBtn.type = 'button';
  expBtn.setAttribute('aria-label', 'Expand explain card fullscreen');
  var x = el('button', null, '\u00d7', winBtns); x.id = 'ex-x'; x.type = 'button'; x.setAttribute('aria-label', 'Close');

  var scrollWrap = el('div', null, null, card); scrollWrap.id = 'ex-scroll';
  var rail = el('aside', null, null, scrollWrap); rail.id = 'ex-rail';
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
  var main = el('div', null, null, scrollWrap); main.id = 'ex-main'; main.tabIndex = 0;
  D.sections.forEach(function (s, i) {
    var sec = el('section', null, null, main); el('div', 'ex-n', (i + 1 < 10 ? '0' : '') + (i + 1), sec);
    var box = el('div', null, null, sec); el('h3', null, s.h, box);
    var u = el('ul', null, null, sec);
    s.pts.forEach(function (p) { var li = el('li', null, null, u); var m = /^(.*?)\s*\[(.+)\]$/.exec(p); li.appendChild(document.createTextNode(m ? m[1] : p)); if (m) el('em', null, m[2], li); });
  });

  var foot = el('footer', null, null, card); foot.id = 'ex-foot';
  if (destUrl) {
    var footGo = el('a', null, 'PROJECT \u2197 (' + destKind + ')', foot);
    footGo.id = 'ex-foot-go';
    footGo.href = destUrl;
    footGo.target = '_blank';
    footGo.rel = 'noopener noreferrer';
    footGo.setAttribute('aria-label', 'Take me to project ' + D.title + ' (' + destKind + ', opens in a new tab)');
  }
  var footRes = el('button', null, 'RESUME', foot);
  footRes.id = 'ex-foot-res';
  footRes.type = 'button';
  var linksToggle = el('button', null, 'LINKS \u25BE', foot);
  linksToggle.id = 'ex-foot-more';
  linksToggle.type = 'button';
  var footLinks = el('div', null, null, foot);
  footLinks.id = 'ex-foot-links';
  (D.links || []).forEach(function (l) { var a = el('a', null, l.label + '  ' + l.url, footLinks); a.href = 'https://' + l.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  linksToggle.addEventListener('click', function () {
    var on = footLinks.classList.toggle('open');
    linksToggle.textContent = on ? 'LINKS \u25B4' : 'LINKS \u25BE';
  });
  el('span', 'sp', '', foot); el('span', 'k', 'E or Esc to close', foot);

  expBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var on = card.classList.toggle('ex-full');
    expBtn.textContent = on ? 'COMPACT' : 'FULL VIEW';
  });

  /* Resume preview + PDF download modal */
  var resScrim = el('div', null, null, document.body);
  resScrim.id = 'ex-res-scrim';
  resScrim.setAttribute('role', 'dialog');
  resScrim.setAttribute('aria-modal', 'true');
  resScrim.setAttribute('aria-label', 'Eshan H Resume Preview');
  var resCard = el('div', null, null, resScrim); resCard.id = 'ex-res-card';
  var resHead = el('div', null, null, resCard); resHead.id = 'ex-res-head';
  el('h2', null, 'ESHAN H \u00b7 RESUME', resHead);
  var resActs = el('div', 'ex-res-acts', null, resHead);
  var resDl = el('a', 'ex-res-btn dl', 'DOWNLOAD PDF', resActs);
  resDl.href = '../../assets/resume/Eshan_H_Resume.pdf';
  resDl.setAttribute('download', 'Eshan_H_Resume.pdf');
  var resOpenPdf = el('a', 'ex-res-btn', 'OPEN PDF \u2197', resActs);
  resOpenPdf.href = '../../assets/resume/Eshan_H_Resume.pdf';
  resOpenPdf.target = '_blank';
  resOpenPdf.rel = 'noopener noreferrer';
  var resExpBtn = el('button', 'ex-res-btn', 'FULL VIEW', resActs);
  resExpBtn.type = 'button';
  resExpBtn.addEventListener('click', function () {
    var on = resCard.classList.toggle('ex-full');
    resExpBtn.textContent = on ? 'COMPACT' : 'FULL VIEW';
  });
  var resClose = el('button', 'ex-res-btn', '\u00d7 CLOSE', resActs);
  resClose.id = 'ex-res-x';
  resClose.type = 'button';
  resClose.setAttribute('aria-label', 'Close resume preview');
  var resPages = el('div', null, null, resCard); resPages.id = 'ex-res-pages'; resPages.tabIndex = 0;
  el('div', null, 'ESC TO CLOSE \u00b7 DOWNLOAD OR OPEN PDF ANYTIME', resCard).id = 'ex-res-foot';

  var open = false, resOpen = false, last = null, resLast = null;
  function set(on) {
    if (on === open) return; open = on;
    if (!on) { card.classList.remove('ex-full'); expBtn.textContent = 'FULL VIEW'; }
    scrim.classList.toggle('on', on); document.body.classList.toggle('ex-open', on);
    if (on) { last = document.activeElement; scrollWrap.scrollTop = 0; main.scrollTop = 0; x.focus(); } else if (last && last.focus) { try { last.focus(); } catch (e) {} }
  }
  function setRes(on) {
    if (on === resOpen) return; resOpen = on;
    if (on && !resPages.dataset.loaded) {
      resPages.dataset.loaded = '1';
      ['../../assets/resume/resume_page_1.webp', '../../assets/resume/resume_page_2.webp'].forEach(function (src, idx) {
        var img = el('img', null, null, resPages);
        img.src = src;
        img.alt = 'Eshan H Resume page ' + (idx + 1);
        img.loading = 'lazy';
        img.decoding = 'async';
      });
    }
    if (!on) { resCard.classList.remove('ex-full'); resExpBtn.textContent = 'FULL VIEW'; }
    resScrim.classList.toggle('on', on);
    document.body.classList.toggle('ex-res-open', on);
    if (on) { resLast = document.activeElement; resPages.scrollTop = 0; resClose.focus(); }
    else if (resLast && resLast.focus) { try { resLast.focus(); } catch (e) {} }
  }

  /* Guided Spotlight Tutorial for Showcase Pages */
  var tutOpen = false, tutStep = 0;
  var tut = el('div', null, null, document.body); tut.id = 'ex-tut';
  tut.setAttribute('role', 'dialog'); tut.setAttribute('aria-modal', 'true'); tut.setAttribute('aria-label', 'Project showcase walkthrough');
  var tutHole = el('div', null, null, tut); tutHole.id = 'ex-tut-hole';
  var tutCard = el('div', null, null, tut); tutCard.id = 'ex-tut-card';
  var tutStepEl = el('div', null, '', tutCard); tutStepEl.id = 'ex-tut-step';
  var tutTitleEl = el('h3', null, '', tutCard); tutTitleEl.id = 'ex-tut-title';
  var tutBodyEl = el('p', null, '', tutCard); tutBodyEl.id = 'ex-tut-body';
  var tutCueEl = el('div', null, '', tutCard); tutCueEl.id = 'ex-tut-cue';
  el('i', null, '\u2190 \u2192', tutCueEl);
  var tutCueSpan = el('span', null, '', tutCueEl);
  var tutActs = el('div', null, null, tutCard); tutActs.id = 'ex-tut-acts';
  var tutSkip = el('button', null, 'SKIP', tutActs); tutSkip.type = 'button';
  var tutNext = el('button', null, 'NEXT', tutActs); tutNext.id = 'ex-tut-next'; tutNext.type = 'button';

  function findChatTarget() {
    var fab = document.getElementById('ch-fab');
    if (fab && fab.classList.contains('show')) return fab;
    var mSel = window.CHAT && window.CHAT.target;
    if (mSel) {
      var m = document.querySelector(mSel);
      if (m) {
        var r = m.getBoundingClientRect();
        if (r.width > 12 && r.height > 12 && r.right > 0 && r.left < window.innerWidth) return m;
      }
    }
    return fab || tutBtn;
  }

  function closeTut() {
    if (!tutOpen) return;
    tutOpen = false;
    tut.classList.remove('on');
    try { localStorage.setItem('arc_proj_tut_done', '1'); } catch (e) {}
  }

  function showTutStep(i) {
    var steps = [
      {
        el: function () { return document.getElementById('dots') || document.getElementById('hud') || document.body; },
        title: 'Scroll & Explore Scenes',
        cue: 'Swipe Left / Right · Keys \u2190 \u2192 · EXPLORE mode',
        body: 'Move across interactive scenes by swiping sideways, tapping the right side of the stage, or using Arrow keys. Switch to EXPLORE to test the live controls.'
      },
      {
        el: function () { return btn; },
        title: 'Explain Card & Project Links',
        cue: '',
        body: 'Tap EXPLAIN (E) anytime for the full architectural breakdown with Full Expand view, or open Live Demo / GitHub and Resume directly from the top bar.'
      },
      {
        el: findChatTarget,
        title: 'AI Corner Guide (' + ((window.CHAT && window.CHAT.name) || D.title) + ')',
        cue: '',
        body: 'Tap this glowing guide in the corner to ask anything about ' + D.title + ' or Eshan. Responses format step-by-step architecture flows and link to demos or repos.'
      }
    ];
    tutStep = i;
    var stp = steps[i];
    tutStepEl.textContent = 'GUIDE ' + (i + 1) + ' OF ' + steps.length;
    tutTitleEl.textContent = stp.title;
    tutBodyEl.textContent = stp.body;
    if (stp.cue) { tutCueEl.classList.add('on'); tutCueSpan.textContent = stp.cue; }
    else { tutCueEl.classList.remove('on'); }
    tutNext.textContent = i + 1 === steps.length ? 'GOT IT' : 'NEXT';
    tut.classList.add('on');
    tutOpen = true;

    var tEl = stp.el();
    var vw = window.innerWidth, vh = window.innerHeight;
    var r = tEl ? tEl.getBoundingClientRect() : null;
    if (!r || r.width <= 0 || r.height <= 0) r = { left: vw * 0.25, top: vh * 0.72, right: vw * 0.75, bottom: vh * 0.86, width: vw * 0.5, height: 50 };
    var hx = Math.max(4, Math.min(vw - 44, r.left - 6));
    var hy = Math.max(4, Math.min(vh - 44, r.top - 6));
    var hw = Math.min(vw - hx - 4, Math.max(44, r.width + 12));
    var hh = Math.min(vh - hy - 4, Math.max(44, r.height + 12));
    tutHole.style.left = hx + 'px'; tutHole.style.top = hy + 'px';
    tutHole.style.width = hw + 'px'; tutHole.style.height = hh + 'px';

    var ch = tutCard.offsetHeight || 220, cw = tutCard.offsetWidth || 320;
    var cy = (r.top > vh * 0.5) ? Math.max(12, hy - ch - 12) : Math.min(vh - ch - 12, hy + hh + 12);
    var cx = Math.max(12, Math.min(vw - cw - 12, hx + hw / 2 - cw / 2));
    tutCard.style.left = cx + 'px'; tutCard.style.top = cy + 'px';
  }

  tutBtn.addEventListener('click', function (e) { e.stopPropagation(); set(false); setRes(false); showTutStep(0); });
  tutSkip.addEventListener('click', closeTut);
  tutNext.addEventListener('click', function () { if (tutStep + 1 < 3) showTutStep(tutStep + 1); else closeTut(); });
  tut.addEventListener('click', function (e) { if (e.target === tut) closeTut(); });

  window.addEventListener('load', function () {
    setTimeout(function () {
      try { if (localStorage.getItem('arc_proj_tut_done') === '1') return; } catch (e) {}
      if (!open && !resOpen && !document.body.classList.contains('ch-open')) showTutStep(0);
    }, 650);
  });

  btn.addEventListener('click', function (e) { e.stopPropagation(); closeTut(); set(true); });
  resBtn.addEventListener('click', function (e) { e.stopPropagation(); closeTut(); setRes(true); });
  footRes.addEventListener('click', function (e) { e.stopPropagation(); set(false); setRes(true); });
  x.addEventListener('click', function () { set(false); });
  scrim.addEventListener('click', function (e) { if (e.target === scrim) set(false); });
  resClose.addEventListener('click', function () { setRes(false); });
  resScrim.addEventListener('click', function (e) { if (e.target === resScrim) setRes(false); });
  ['pointerdown', 'click', 'wheel', 'touchstart'].forEach(function (t) {
    scrim.addEventListener(t, function (e) { e.stopPropagation(); });
    resScrim.addEventListener(t, function (e) { e.stopPropagation(); });
    tut.addEventListener(t, function (e) { e.stopPropagation(); });
    topBar.addEventListener(t, function (e) { e.stopPropagation(); });
    portBtn.addEventListener(t, function (e) { e.stopPropagation(); });
    resBtn.addEventListener(t, function (e) { e.stopPropagation(); });
  });
  window.addEventListener('arcade:open-explain', function () { closeTut(); set(true); });
  window.addEventListener('keydown', function (e) {
    if (document.body.classList.contains('ch-open')) return;
    var k = e.key, tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if (tutOpen) {
      if (k === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeTut(); return; }
      if (k === 'ArrowRight' || k === 'Enter' || k === ' ') { e.preventDefault(); e.stopImmediatePropagation(); if (tutStep + 1 < 3) showTutStep(tutStep + 1); else closeTut(); return; }
      e.stopImmediatePropagation();
      return;
    }
    if (resOpen) {
      if (k === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); setRes(false); return; }
      if (k === 'Tab') return;
      if (k === 'ArrowDown' || k === 'PageDown') { resPages.scrollBy({ top: k === 'ArrowDown' ? 90 : resPages.clientHeight * 0.8 }); e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (k === 'ArrowUp' || k === 'PageUp') { resPages.scrollBy({ top: k === 'ArrowUp' ? -90 : -resPages.clientHeight * 0.8 }); e.preventDefault(); e.stopImmediatePropagation(); return; }
      e.stopImmediatePropagation();
      return;
    }
    if ((k === 'e' || k === 'E') && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); e.stopImmediatePropagation(); set(!open); return; }
    if (!open) return;
    if (k === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); set(false); return; }
    if (k === 'Tab') return;
    if (k === 'ArrowDown' || k === 'PageDown' || k === ' ') {
      var box = window.innerWidth <= 920 ? scrollWrap : main;
      e.stopImmediatePropagation();
      if (k !== 'ArrowDown') { e.preventDefault(); box.scrollBy({ top: box.clientHeight * 0.8 }); }
      return;
    }
    if (k === 'ArrowUp' || k === 'PageUp') {
      var box2 = window.innerWidth <= 920 ? scrollWrap : main;
      e.stopImmediatePropagation();
      if (k === 'PageUp') { e.preventDefault(); box2.scrollBy({ top: -box2.clientHeight * 0.8 }); }
      return;
    }
    e.stopImmediatePropagation();
  }, true);
})();
