/* Per-character chat widget. Loads deferred, initialises lazily on first mascot click.
   Reads window.CHAT (data/chat.js) and window.EXPLAIN (data/explain.js). */
(function () {
  var C = window.CHAT;
  var E = window.EXPLAIN;
  if (!C || !E) return;

  var MAX_LEN = 500;
  var MAX_TURNS = 8; // 16 messages
  var mascot = null;
  var fab = null;
  var panel = null;
  var msgsEl = null;
  var inputEl = null;
  var sendEl = null;
  var offlineBar = null;
  var open = false;
  var initialized = false;
  var isOnlineMode = false;
  var availabilityPromise = null;
  var busy = false;
  var lastFocused = null;
  var history = [];
  var bound = false;

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

    /* Make mascot keyboard-focusable and clickable without building the chat DOM yet */
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

    /* Compact speech-dot launcher shown only when the project CSS hides the mascot sprite */
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
    var m = el('div', 'ch-msg ' + who, text, msgsEl);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return m;
  }

  function trimHistory() {
    var limit = MAX_TURNS * 2;
    if (history.length > limit) history = history.slice(history.length - limit);
  }

  /* Local offline answerer using only window.EXPLAIN facts */
  function answerLocally(question) {
    var q = (question || '').toLowerCase();
    var words = q.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2; });
    var secs = E.sections || [];
    var scored = [];

    secs.forEach(function (sec) {
      var heading = (sec.h || '').toLowerCase();
      var pts = sec.pts || [];
      var score = 0;
      words.forEach(function (w) {
        if (heading.indexOf(w) !== -1) score += 2;
      });
      var matchedPts = [];
      pts.forEach(function (p) {
        var lp = p.toLowerCase();
        var ps = 0;
        words.forEach(function (w) { if (lp.indexOf(w) !== -1) ps += 1; });
        if (ps > 0) { score += ps; matchedPts.push(p); }
      });
      scored.push({ sec: sec, score: score, matchedPts: matchedPts });
    });

    if (q.indexOf('award') !== -1 || q.indexOf('win') !== -1 || q.indexOf('hack') !== -1 || q.indexOf('design') !== -1 || q.indexOf('registration') !== -1) {
      if (E.achievements && E.achievements.length) {
        return E.achievements.map(function (a) { return a.t + (a.s ? ' (' + a.s + ')' : ''); }).join('. ') + '.';
      }
    }

    scored.sort(function (a, b) { return b.score - a.score; });
    var best = scored[0];
    if (best && best.score > 0) {
      var picks = best.matchedPts.length ? best.matchedPts.slice(0, 3) : (best.sec.pts || []).slice(0, 3);
      return best.sec.h + ': ' + picks.join(' ');
    }
    var summary = E.line || '';
    if (E.stack && E.stack.length) summary += ' Stack: ' + E.stack.join(', ') + '.';
    return summary || 'Open the EXPLAIN card for full project details.';
  }

  function setModeUI(online) {
    isOnlineMode = online;
    if (offlineBar) offlineBar.classList.toggle('on', !online);
    if (inputEl) {
      inputEl.disabled = !online;
      inputEl.placeholder = online ? ('Ask ' + C.name + '...') : 'Chat needs internet (use chips or EXPLAIN)';
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
        if (ok && open && inputEl) {
          try { inputEl.focus(); } catch (e) {}
        }
        return ok;
      })
      .catch(function () {
        setModeUI(false);
        return false;
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
      });
    return availabilityPromise;
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
    var closeBtn = el('button', null, '\u00d7', head);
    closeBtn.id = 'ch-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.addEventListener('click', function () { setOpen(false); });

    offlineBar = el('div', null, null, panel); offlineBar.id = 'ch-offline';
    el('span', null, 'Chat needs internet. Open the EXPLAIN card for the full story.', offlineBar);
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

    addMsg(C.welcome || ('Ask me about ' + E.title + ' or Eshan.'), 'bot');

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
        trimHistory();
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
        var ct = (res.headers.get('content-type') || '').toLowerCase();
        if (res.ok && res.body && res.body.getReader && (ct.indexOf('text/event-stream') !== -1 || ct.indexOf('text/plain') !== -1)) {
          typingEl.remove();
          var botEl = addMsg('', 'bot');
          var reader = res.body.getReader();
          var dec = new TextDecoder();
          var full = '';
          function pump() {
            return reader.read().then(function (step) {
              if (step.done) return full;
              var chunk = dec.decode(step.value, { stream: true });
              if (ct.indexOf('text/event-stream') !== -1) {
                chunk.split('\n').forEach(function (line) {
                  if (line.indexOf('data: ') === 0) {
                    var d = line.slice(6);
                    if (d !== '[DONE]') full += d;
                  }
                });
              } else {
                full += chunk;
              }
              botEl.textContent = full;
              msgsEl.scrollTop = msgsEl.scrollHeight;
              return pump();
            });
          }
          return pump().then(function (out) {
            if (out) {
              history.push({ role: 'user', content: text }, { role: 'assistant', content: out });
              trimHistory();
            }
          });
        }

        return res.json().catch(function () { return {}; }).then(function (data) {
          typingEl.remove();
          if (data && data.offline) {
            setModeUI(false);
            var offAns = answerLocally(text);
            addMsg(offAns, 'bot');
            return;
          }
          var replyText = (data && (data.reply || data.error)) || 'Could not reach the assistant right now. Try again shortly.';
          addMsg(replyText, 'bot');
          if (res.ok && data && data.reply) {
            history.push({ role: 'user', content: text }, { role: 'assistant', content: data.reply });
            trimHistory();
          }
        });
      }).catch(function () {
        typingEl.remove();
        setModeUI(false);
        addMsg('Connection unavailable right now. Switched to offline summary: ' + answerLocally(text), 'bot');
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
    if (r.width > 12 && r.height > 12) {
      bl = (r.left + r.width / 2) < (window.innerWidth / 2);
    }
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
      document.body.classList.remove('ch-open');
      mascot.setAttribute('aria-expanded', 'false');
      fab.setAttribute('aria-expanded', 'false');
      syncFab();
      if (lastFocused && lastFocused.focus) {
        try { lastFocused.focus(); } catch (e) {}
      }
    }
  }

  function onTrigger(e) {
    e.stopPropagation();
    setOpen(!open);
  }

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

  /* Stop arcade shortcuts & Escape navigation while chat is open */
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
