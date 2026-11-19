/* Per-character chat widget with safe rich DOM formatting, flow diagrams, allowlisted actions, expand & session memory. */
(function () {
  var C = window.CHAT;
  var E = window.EXPLAIN;
  if (!C || !E) return;

  var MAX_LEN = 500;
  var MAX_TURNS = 8;
  var STORE_KEY = 'arc_chat_' + (C.slug || 'proj');
  var KNOWN_SLUGS = { argus: 1, saathi: 1, verifarm: 1, 'soil-and-toil': 1, axiom: 1, personaforge: 1, kavach: 1, 'pro-rover': 1, 'usb-tcp-bridge': 1 };
  var ALLOWED_SECTIONS = { '#top': 1, '#about': 1, '#skills': 1, '#work': 1, '#awards': 1, '#research': 1, '#certs': 1, '#gallery': 1, '#contact': 1 };
  var ALLOWED_EXT = {
    'https://github.com/Falcon0516': 1,
    'https://www.linkedin.com/in/eshan-h': 1,
    'https://linkedin.com/in/eshan-h': 1,
    'https://argus-47.netlify.app': 1,
    'https://saathi-presentation.netlify.app': 1,
    'https://persona--forge.vercel.app': 1,
    'https://vigyantra.vercel.app': 1,
    'https://verifarm-2026.web.app': 1,
    'https://play.google.com/store/apps/details?id=com.verifarm.app': 1,
    'https://www.ijcrt.org/papers/IJCRTBE02004.pdf': 1,
    'mailto:eshanh051116@gmail.com': 1
  };

  var mascot = null, fab = null, panel = null, msgsEl = null, inputEl = null, sendEl = null, offlineBar = null;
  var open = false, initialized = false, isOnlineMode = false, availabilityPromise = null, busy = false, lastFocused = null, bound = false;
  var history = [];

  function loadHistory() {
    try {
      var raw = sessionStorage.getItem(STORE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.slice(-MAX_TURNS * 2) : [];
    } catch (e) { return []; }
  }
  function saveHistory() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-MAX_TURNS * 2))); } catch (e) {}
  }

  function isAllowedUrl(type, target) {
    if (type === 'SECTION') return !!ALLOWED_SECTIONS[target];
    if (type === 'MODAL') return target === 'resume' || target === 'explain';
    if (type === 'ARCADE') {
      if (target === '/' || target === '/Eshan_Portfolio/index.html' || target === '/arcade/index.html') return true;
      var m = /^\/arcade\/projects\/([a-z0-9-]+)\/index\.html$/.exec(target);
      return !!(m && KNOWN_SLUGS[m[1]]);
    }
    if (type === 'EXT') {
      return !!ALLOWED_EXT[target] || target.indexOf('https://github.com/Falcon0516/') === 0;
    }
    return false;
  }

  function resolveInternalUrl(target) {
    if (location.protocol === 'file:') {
      if (target === '/arcade/index.html') return '../../index.html';
      var m = /^\/arcade\/projects\/([a-z0-9-]+)\/index\.html$/.exec(target);
      if (m) return '../' + m[1] + '/index.html';
      return 'https://eshan-portfolio.streyeke.cloud';
    }
    return target;
  }

  function appendInlineRich(parent, str) {
    var parts = String(str || '').split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    parts.forEach(function (part) {
      if (!part) return;
      if (part.indexOf('**') === 0 && part.lastIndexOf('**') === part.length - 2 && part.length > 4) {
        var b = document.createElement('strong');
        b.textContent = part.slice(2, -2);
        parent.appendChild(b);
      } else if (part.charAt(0) === '`' && part.charAt(part.length - 1) === '`' && part.length > 2) {
        var c = document.createElement('code');
        c.textContent = part.slice(1, -1);
        parent.appendChild(c);
      } else {
        parent.appendChild(document.createTextNode(part));
      }
    });
  }

  function appendFlowBlock(container, flowText) {
    var raw = String(flowText || '').replace(/\n+/g, ' -> ').trim();
    var nodes = raw.split(/\s*(?:->|\u2192|\u2194)\s*/).filter(Boolean);
    if (nodes.length < 2) return false;
    var wrap = document.createElement('div');
    wrap.className = 'ch-flow';
    nodes.forEach(function (label, idx) {
      var n = document.createElement('span');
      n.className = 'ch-node';
      n.textContent = label.replace(/^\*\*|\*\*$/g, '').trim();
      wrap.appendChild(n);
      if (idx + 1 < nodes.length) {
        var a = document.createElement('span');
        a.className = 'ch-arr';
        a.textContent = '\u2192';
        wrap.appendChild(a);
      }
    });
    container.appendChild(wrap);
    return true;
  }

  function renderRichBot(container, rawText) {
    var actions = [];
    var text = String(rawText || '').replace(/\[\[ACTION:([A-Za-z]+)\|([^|\]]+)\|([^\]]+)\]\]/g, function (_, t, lbl, tgt) {
      var type = String(t || '').toUpperCase();
      var label = String(lbl || '').trim();
      var target = String(tgt || '').trim();
      if (label && isAllowedUrl(type, target) && actions.length < 3) {
        actions.push({ type: type, label: label, target: target });
      }
      return '';
    }).trim();

    /* Split fenced ```flow blocks safely */
    var segs = text.split(/```(?:flow|diagram)?\s*\n([\s\S]*?)```/gi);
    segs.forEach(function (seg, idx) {
      if (idx % 2 === 1) {
        if (!appendFlowBlock(container, seg)) {
          var p = document.createElement('p');
          p.textContent = seg.trim();
          container.appendChild(p);
        }
        return;
      }
      var lines = seg.split('\n');
      var listEl = null, listType = '';
      function flushList() { listEl = null; listType = ''; }

      lines.forEach(function (rawLine) {
        var line = rawLine.trim();
        if (!line) { flushList(); return; }
        if (/^(?:Flow\s*:\s*)?.+(?:\s*(?:->|→)\s*.+){2,}$/i.test(line)) {
          flushList();
          appendFlowBlock(container, line.replace(/^Flow\s*:\s*/i, ''));
          return;
        }
        var ulm = /^[-*\u2022]\s+(.+)$/.exec(line);
        if (ulm) {
          if (listType !== 'ul') { listEl = document.createElement('ul'); listEl.className = 'ch-list'; container.appendChild(listEl); listType = 'ul'; }
          var li = document.createElement('li');
          appendInlineRich(li, ulm[1]);
          listEl.appendChild(li);
          return;
        }
        var olm = /^\d+[.)]\s+(.+)$/.exec(line);
        if (olm) {
          if (listType !== 'ol') { listEl = document.createElement('ol'); listEl.className = 'ch-list'; container.appendChild(listEl); listType = 'ol'; }
          var oli = document.createElement('li');
          appendInlineRich(oli, olm[1]);
          listEl.appendChild(oli);
          return;
        }
        flushList();
        var hm = /^#{1,4}\s+(.+)$/.exec(line);
        if (hm) {
          var h = document.createElement('div');
          h.className = 'ch-h';
          h.textContent = hm[1].replace(/\*\*/g, '');
          container.appendChild(h);
          return;
        }
        var p = document.createElement('p');
        appendInlineRich(p, line);
        container.appendChild(p);
      });
    });

    if (actions.length) {
      var actRow = document.createElement('div');
      actRow.className = 'ch-acts';
      actions.forEach(function (act) {
        if (act.type === 'MODAL') {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'ch-act';
          b.textContent = act.label;
          b.addEventListener('click', function () {
            if (act.target === 'explain') { setOpen(false); window.dispatchEvent(new CustomEvent('arcade:open-explain')); }
            else if (act.target === 'resume') {
              setOpen(false);
              var rb = document.getElementById('ex-res');
              if (rb) rb.click();
            }
          });
          actRow.appendChild(b);
        } else {
          var a = document.createElement('a');
          a.className = 'ch-act';
          a.textContent = act.label;
          if (act.type === 'SECTION') {
            a.href = (location.protocol === 'file:' ? 'https://eshan-portfolio.streyeke.cloud' : '/Eshan_Portfolio/index.html') + act.target;
            if (location.protocol === 'file:') { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
          } else if (act.type === 'ARCADE') {
            a.href = resolveInternalUrl(act.target);
          } else {
            a.href = act.target;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
          }
          actRow.appendChild(a);
        }
      });
      container.appendChild(actRow);
    }
  }

  function syncFab() {
    if (!mascot || !fab) return;
    var st = window.getComputedStyle(mascot);
    var r = mascot.getBoundingClientRect();
    var onScreenW = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
    var visible = st.display !== 'none' && st.visibility !== 'hidden' && r.width > 12 && r.height > 12 && onScreenW >= 84;
    fab.classList.toggle('show', !visible && !open);
  }

  function mountMascot() {
    if (bound) return true;
    mascot = document.querySelector(C.target);
    if (!mascot) return false;
    bound = true;

    mascot.classList.add('ch-host');
    if (!mascot.hasAttribute('tabindex')) mascot.tabIndex = 0;
    if (!mascot.getAttribute('role')) mascot.setAttribute('role', 'button');
    mascot.setAttribute('aria-label', 'Chat with ' + C.name + ' about ' + E.title);
    mascot.setAttribute('aria-haspopup', 'dialog');
    mascot.setAttribute('aria-expanded', 'false');

    var dot = document.createElement('span');
    dot.className = 'ch-dot';
    dot.setAttribute('aria-hidden', 'true');
    mascot.appendChild(dot);

    fab = document.createElement('button');
    fab.id = 'ch-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Chat with ' + C.name + ' about ' + E.title);
    fab.setAttribute('aria-haspopup', 'dialog');
    fab.setAttribute('aria-expanded', 'false');
    var fabDot = document.createElement('span');
    fabDot.className = 'ch-fab-dot';
    fabDot.setAttribute('aria-hidden', 'true');
    fab.appendChild(fabDot);
    document.body.appendChild(fab);

    syncFab();
    window.addEventListener('resize', syncFab);
    if (window.MutationObserver) {
      var fabObserver = new MutationObserver(syncFab);
      fabObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      fabObserver.observe(mascot, { attributes: true, attributeFilter: ['style', 'class'] });
    }

    mascot.addEventListener('click', onTrigger);
    ['pointerdown', 'pointerup', 'mousedown', 'touchstart', 'touchend'].forEach(function (evt) {
      mascot.addEventListener(evt, function (e) { e.stopPropagation(); });
      fab.addEventListener(evt, function (e) { e.stopPropagation(); });
    });
    mascot.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(!open);
      }
    });
    fab.addEventListener('click', onTrigger);
    return true;
  }

  function el(tag, cls, txt, par) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    if (par) par.appendChild(n);
    return n;
  }

  function addMsg(text, who) {
    var m = el('div', 'ch-msg ' + who, null, msgsEl);
    if (who === 'bot') renderRichBot(m, text);
    else m.textContent = text;
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return m;
  }

  function trimHistory() {
    var limit = MAX_TURNS * 2;
    if (history.length > limit) history = history.slice(history.length - limit);
  }

  /* Local offline answerer with structured bullets, flow diagrams, and direct action chips */
  function answerLocally(question) {
    var q = (question || '').toLowerCase();
    var lines = [];
    var linksMap = window.ARCADE_LINKS || {};
    var link = linksMap[C.slug] && linksMap[C.slug].url ? linksMap[C.slug].url : '';

    if (q.indexOf('architecture') !== -1 || q.indexOf('how') !== -1 || q.indexOf('work') !== -1 || q.indexOf('flow') !== -1 || q.indexOf('pipeline') !== -1) {
      var flowNodes = (E.stack && E.stack.length >= 3) ? E.stack.slice(0, 4).join(' -> ') : (E.title + ' -> Core Logic -> Interactive Demo');
      lines.push('**' + E.title + ' Architecture Overview**');
      lines.push('```flow\n' + flowNodes + '\n```');
    }

    var words = q.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2; });
    var secs = E.sections || [];
    var scored = [];
    secs.forEach(function (sec) {
      var heading = (sec.h || '').toLowerCase();
      var score = 0, matchedPts = [];
      words.forEach(function (w) { if (heading.indexOf(w) !== -1) score += 2; });
      (sec.pts || []).forEach(function (p) {
        var lp = p.toLowerCase(), ps = 0;
        words.forEach(function (w) { if (lp.indexOf(w) !== -1) ps += 1; });
        if (ps > 0) { score += ps; matchedPts.push(p); }
      });
      scored.push({ sec: sec, score: score, matchedPts: matchedPts });
    });

    if (q.indexOf('award') !== -1 || q.indexOf('win') !== -1 || q.indexOf('hack') !== -1 || q.indexOf('design') !== -1 || q.indexOf('registration') !== -1) {
      if (E.achievements && E.achievements.length) {
        lines.push('**Achievements:**');
        E.achievements.forEach(function (a) { lines.push('- **' + a.t + '**' + (a.s ? ' (' + a.s + ')' : '')); });
      }
    } else {
      scored.sort(function (a, b) { return b.score - a.score; });
      var best = scored[0];
      if (best && best.score > 0) {
        var picks = best.matchedPts.length ? best.matchedPts.slice(0, 3) : (best.sec.pts || []).slice(0, 3);
        lines.push('**' + best.sec.h + ':**');
        picks.forEach(function (pt) { lines.push('- ' + pt); });
      } else {
        lines.push('- **Summary:** ' + (E.line || E.title));
        if (E.stack && E.stack.length) lines.push('- **Stack:** ' + E.stack.join(', '));
      }
    }

    lines.push('[[ACTION:MODAL|Open Explain Card|explain]]');
    lines.push('[[ACTION:MODAL|View Resume|resume]]');
    if (link && isAllowedUrl('EXT', link)) lines.push('[[ACTION:EXT|Project Link \u2197|' + link + ']]');
    return lines.join('\n');
  }

  function setModeUI(online) {
    isOnlineMode = online;
    if (offlineBar) offlineBar.classList.toggle('on', !online);
    if (inputEl) {
      inputEl.disabled = !online;
      inputEl.placeholder = online ? ('Ask ' + C.name + '...') : 'Offline mode: tap chips or open EXPLAIN';
    }
    if (sendEl) sendEl.disabled = !online;
  }

  function checkAvailability() {
    if (availabilityPromise) return availabilityPromise;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') {
      setModeUI(false);
      availabilityPromise = Promise.resolve(false);
      return availabilityPromise;
    }
    if (navigator.onLine === false) {
      setModeUI(false);
      availabilityPromise = Promise.resolve(false);
      return availabilityPromise;
    }
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 3000) : null;
    availabilityPromise = fetch('/api/chat', { method: 'GET', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : { ok: false }; })
      .then(function (d) {
        var ok = !!(d && d.ok && d.configured);
        setModeUI(ok);
        if (ok && open && inputEl) { try { inputEl.focus(); } catch (e) {} }
        return ok;
      })
      .catch(function () { setModeUI(false); return false; })
      .finally(function () { if (timer) clearTimeout(timer); });
    return availabilityPromise;
  }

  function renderWelcome() {
    addMsg(C.welcome || ('Ask me about **' + E.title + '** or Eshan!\n[[ACTION:MODAL|Open Explain Card|explain]] [[ACTION:MODAL|Resume|resume]]'), 'bot');
  }

  function buildPanel() {
    if (initialized) return;
    initialized = true;

    panel = el('section', null, null, document.body);
    panel.id = 'ch-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with ' + C.name);

    var head = el('div', null, null, panel); head.id = 'ch-head';
    var titleBox = el('div', null, null, head); titleBox.id = 'ch-title';
    el('span', null, C.name, titleBox).id = 'ch-name';
    el('span', null, E.title + ' Guide', titleBox).id = 'ch-sub';
    var hbtns = el('div', null, null, head); hbtns.id = 'ch-hbtns';
    var clrBtn = el('button', null, 'CLEAR', hbtns); clrBtn.id = 'ch-clear'; clrBtn.type = 'button'; clrBtn.setAttribute('aria-label', 'Clear conversation');
    var expBtn = el('button', null, '\u2922', hbtns); expBtn.id = 'ch-expand'; expBtn.type = 'button'; expBtn.setAttribute('aria-label', 'Expand chat window');
    var closeBtn = el('button', null, '\u00d7', hbtns); closeBtn.id = 'ch-close'; closeBtn.type = 'button'; closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.addEventListener('click', function () { setOpen(false); });
    expBtn.addEventListener('click', function () {
      var on = panel.classList.toggle('expanded');
      expBtn.textContent = on ? '\u2199' : '\u2922';
      expBtn.setAttribute('aria-label', on ? 'Restore chat size' : 'Expand chat window');
    });
    clrBtn.addEventListener('click', function () {
      history = [];
      saveHistory();
      msgsEl.textContent = '';
      renderWelcome();
    });

    offlineBar = el('div', null, null, panel); offlineBar.id = 'ch-offline';
    el('span', null, 'Offline fallback active. Use chips or EXPLAIN for the full story.', offlineBar);
    var openEx = el('button', null, 'OPEN EXPLAIN', offlineBar);
    openEx.id = 'ch-open-ex';
    openEx.type = 'button';
    openEx.addEventListener('click', function () {
      setOpen(false);
      window.dispatchEvent(new CustomEvent('arcade:open-explain'));
    });

    msgsEl = el('div', null, null, panel);
    msgsEl.id = 'ch-msgs';
    msgsEl.setAttribute('role', 'log');
    msgsEl.setAttribute('aria-live', 'polite');

    renderWelcome();
    history = loadHistory();
    history.forEach(function (turn) {
      if (turn && turn.content) addMsg(turn.content, turn.role === 'user' ? 'user' : 'bot');
    });

    var chips = el('div', null, null, panel); chips.id = 'ch-chips';
    (C.starters || []).slice(0, 3).forEach(function (q) {
      var chip = el('button', 'ch-chip', q, chips);
      chip.type = 'button';
      chip.addEventListener('click', function () { submitQuestion(q); });
    });

    var form = el('form', null, null, panel); form.id = 'ch-form';
    form.setAttribute('autocomplete', 'off');
    inputEl = el('input', null, null, form);
    inputEl.id = 'ch-input';
    inputEl.type = 'text';
    inputEl.maxLength = MAX_LEN;
    inputEl.setAttribute('aria-label', 'Ask a question (max 500 characters)');
    sendEl = el('button', null, 'SEND', form);
    sendEl.id = 'ch-send';
    sendEl.type = 'submit';
    sendEl.setAttribute('aria-label', 'Send message');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var val = (inputEl.value || '').trim();
      if (!val) return;
      inputEl.value = '';
      submitQuestion(val);
    });

    ['pointerdown', 'pointerup', 'mousedown', 'click', 'touchstart', 'touchend', 'wheel'].forEach(function (evt) {
      panel.addEventListener(evt, function (e) { e.stopPropagation(); });
    });

    checkAvailability();
  }

  function submitQuestion(rawText) {
    var text = (rawText || '').trim();
    if (!text || busy) return;
    if (text.length > MAX_LEN) {
      addMsg('Please keep questions under ' + MAX_LEN + ' characters.', 'bot');
      return;
    }

    addMsg(text, 'user');

    (availabilityPromise || checkAvailability()).then(function (online) {
      if (!online) {
        var localAns = answerLocally(text);
        addMsg(localAns, 'bot');
        history.push({ role: 'user', content: text }, { role: 'assistant', content: localAns });
        trimHistory(); saveHistory();
        return;
      }

      busy = true;
      sendEl.disabled = true;

      var typingEl = el('div', 'ch-msg bot typing', null, msgsEl);
      el('i', null, '...', typingEl);
      msgsEl.scrollTop = msgsEl.scrollHeight;

      var payload = {
        message: text,
        project: C.slug,
        persona: C.name,
        history: history.slice(-MAX_TURNS * 2)
      };

      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          typingEl.remove();
          if (data && data.offline) {
            setModeUI(false);
            var offAns = answerLocally(text);
            addMsg(offAns, 'bot');
            history.push({ role: 'user', content: text }, { role: 'assistant', content: offAns });
            trimHistory(); saveHistory();
            return;
          }
          var replyText = (data && (data.reply || data.error)) || 'Could not reach the assistant right now. Try again shortly.';
          addMsg(replyText, 'bot');
          if (res.ok && data && data.reply) {
            history.push({ role: 'user', content: text }, { role: 'assistant', content: data.reply });
            trimHistory(); saveHistory();
          }
        });
      }).catch(function () {
        typingEl.remove();
        setModeUI(false);
        var offAns = answerLocally(text);
        addMsg(offAns, 'bot');
        history.push({ role: 'user', content: text }, { role: 'assistant', content: offAns });
        trimHistory(); saveHistory();
      }).finally(function () {
        if (timer) clearTimeout(timer);
        busy = false;
        if (sendEl) sendEl.disabled = !isOnlineMode;
        if (inputEl && isOnlineMode && open) {
          try { inputEl.focus(); } catch (e) {}
        }
      });
    });
  }

  function pickCorner() {
    var r = mascot.getBoundingClientRect();
    var bl = C.corner === 'bl';
    if (r.width > 12 && r.height > 12) bl = (r.left + r.width / 2) < (window.innerWidth / 2);
    panel.classList.toggle('bl', bl);
  }

  function setOpen(next) {
    if (next && !initialized) buildPanel();
    if (next === open) return;
    open = next;
    if (next) {
      lastFocused = document.activeElement;
      pickCorner();
      panel.classList.add('open');
      document.body.classList.add('ch-open');
      mascot.setAttribute('aria-expanded', 'true');
      fab.setAttribute('aria-expanded', 'true');
      if (isOnlineMode && inputEl && !inputEl.disabled) {
        setTimeout(function () { try { inputEl.focus(); } catch (e) {} }, 30);
      } else {
        var cBtn = document.getElementById('ch-close');
        if (cBtn) cBtn.focus();
      }
    } else {
      panel.classList.remove('open');
      panel.classList.remove('expanded');
      var exp = document.getElementById('ch-expand');
      if (exp) exp.textContent = '\u2922';
      document.body.classList.remove('ch-open');
      mascot.setAttribute('aria-expanded', 'false');
      fab.setAttribute('aria-expanded', 'false');
      syncFab();
      if (lastFocused && lastFocused.focus) { try { lastFocused.focus(); } catch (e) {} }
    }
  }

  function onTrigger(e) { e.stopPropagation(); setOpen(!open); }

  if (!mountMascot()) {
    document.addEventListener('DOMContentLoaded', mountMascot);
    window.addEventListener('load', mountMascot);
    if (window.MutationObserver && document.body) {
      var waitObs = new MutationObserver(function () {
        if (mountMascot()) waitObs.disconnect();
      });
      waitObs.observe(document.body, { childList: true, subtree: true });
    }
  }

  window.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      setOpen(false);
      return;
    }
    if (panel && e.target && panel.contains(e.target)) {
      if (e.key !== 'Tab') e.stopImmediatePropagation();
    }
  }, true);
})();
