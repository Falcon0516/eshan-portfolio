/* UI: HUD, minimap, list, Hall of Fame, Design Registration, settings, toast, tooltips. */
(function (A) {
  var D = A.DATA, S = A.S, $ = function (id) { return document.getElementById(id); }, toastT = 0, hintT = 0, hallT = [], tip, mini = [], listSel = 0, listEls = [];
  function store(k, v) {
    try {
      if (v === undefined) {
        var lv = localStorage.getItem(k);
        return lv !== null ? lv : sessionStorage.getItem(k);
      }
      localStorage.setItem(k, v);
      sessionStorage.setItem(k, v);
    } catch (e) { return null; }
  }
  A.store = store;
  function openOv(id) { A.ui.closeAll(true); $(id).classList.add('on'); S.overlay = id; }

  A.ui = {
    init: function () {
      var bPort = $('bPort');
      if (bPort) {
        if (location.protocol === 'file:') {
          bPort.href = D.portfolio.url;
          bPort.target = '_blank';
          bPort.rel = 'noopener noreferrer';
          bPort.setAttribute('aria-label', 'Open live portfolio website (opens in a new tab)');
        } else {
          var fm = /[?&]from=([^&#]*)/.exec(location.search || '');
          var fval = fm ? decodeURIComponent(fm[1]) : '';
          var ret = store('arc_return') || '';
          if (fval === 'pro') ret = '/Eshan_Portfolio/index.html';
          else if (fval === 'game') ret = '/';
          else if (fval === 'portfolio') {
            var ref = document.referrer || '';
            ret = (ref && ref.indexOf(location.origin) === 0 && ref.indexOf('/Eshan_Portfolio') !== -1) ? '/Eshan_Portfolio/index.html' : '/';
          }
          if (!ret) ret = '/';
          store('arc_return', ret);
          bPort.href = ret;
        }
      }
      $('hudPlayer').textContent = D.boot.hud; $('hudLevel').textContent = D.boot.level; $('hudCoin').textContent = D.boot.projects;
      $('hint').textContent = D.ui.hint; $('tourChip').textContent = D.ui.tourHint;
      var m = $('mini'); D.cards.forEach(function (c, i) { var b = document.createElement('button'); b.type = 'button'; b.style.setProperty('--c', c.c[0]); b.setAttribute('aria-label', 'Go to ' + c.title); b.title = c.title; b.addEventListener('click', function () { A.engine.walkTo(i); }); m.appendChild(b); mini.push(b); });
      /* list */
      var ol = $('listRows'); D.cards.forEach(function (c, i) {
        var li = document.createElement('li'), a = document.createElement('a'); a.href = 'projects/' + c.slug + '/index.html?from=hub'; a.style.setProperty('--c', c.c[0]);
        a.innerHTML = '<span>' + (i + 1) + '. ' + c.title.replace(/&/g, '&amp;') + '</span><small>' + c.tag + '</small>';
        a.addEventListener('click', function (e) { e.preventDefault(); A.engine.quickGo(c.slug); }); li.appendChild(a); ol.appendChild(li); listEls.push(a);
      });
      /* hall + reg */
      $('hallH').textContent = D.hof.head; $('hpT').textContent = 'HI-SCORE'; $('aboutLine').textContent = D.about;
      $('regH').textContent = D.reg.head; $('regBody').textContent = D.reg.body;
      var hr = $('hallRows'); D.awards.forEach(function (a) { var li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('span'); b.textContent = a.rank; s.textContent = a.text; li.appendChild(b); li.appendChild(s); hr.appendChild(li); });
      /* buttons */
      $('bList').addEventListener('click', A.ui.openList); $('bResume').addEventListener('click', function () { A.ui.openResume(); }); $('bTour').addEventListener('click', function () { A.engine.tour(!S.tour); });
      $('bSnd').addEventListener('click', function () { A.audio.setMuted(!A.audio.isMuted()); store('arc_snd', A.audio.isMuted() ? '0' : '1'); });
      $('bCfg').addEventListener('click', function () { A.ui.openCfg(); }); $('bTut').addEventListener('click', function () { A.ui.startTutorial(true); }); $('resClose').addEventListener('click', function () { A.ui.closeAll(); }); $('ovResume').addEventListener('click', function (e) { if (e.target === $('ovResume')) A.ui.closeAll(); }); $('skip').addEventListener('click', function () { A.engine.skipIntro(); });
      /* Add consistent Full-Expand + Close buttons to every overlay */
      document.querySelectorAll('.ov .ov-in').forEach(function (box) {
        var isRes = box.classList.contains('res-box');
        if (isRes) {
          var acts = box.querySelector('.res-actions');
          if (acts) {
            var exp = document.createElement('button');
            exp.type = 'button'; exp.className = 'pbtn ov-exp'; exp.textContent = 'FULL';
            exp.setAttribute('aria-label', 'Expand fullscreen');
            exp.addEventListener('click', function () {
              var on = box.classList.toggle('expanded');
              exp.textContent = on ? 'COMPACT' : 'FULL';
            });
            acts.insertBefore(exp, acts.lastElementChild);
          }
          return;
        }
        var bar = document.createElement('div');
        bar.className = 'ov-bar';
        var expBtn = document.createElement('button');
        expBtn.type = 'button'; expBtn.className = 'pbtn ov-exp'; expBtn.textContent = 'FULL';
        expBtn.setAttribute('aria-label', 'Expand dialog fullscreen');
        expBtn.addEventListener('click', function () {
          var on = box.classList.toggle('expanded');
          expBtn.textContent = on ? 'COMPACT' : 'FULL';
        });
        var clsBtn = document.createElement('button');
        clsBtn.type = 'button'; clsBtn.className = 'pbtn'; clsBtn.textContent = 'CLOSE';
        clsBtn.setAttribute('aria-label', 'Close dialog');
        clsBtn.addEventListener('click', function () { A.ui.closeAll(); });
        bar.appendChild(expBtn);
        bar.appendChild(clsBtn);
        box.insertBefore(bar, box.firstChild);
      });
      $('cScan').addEventListener('change', function (e) { document.body.classList.toggle('noscan', !e.target.checked); store('arc_scan', e.target.checked ? '1' : '0'); });
      $('cQuick').addEventListener('change', function (e) { S.quick = e.target.checked; store('arc_quick', S.quick ? '1' : '0'); });
      $('cSnd').addEventListener('change', function (e) { A.audio.setMuted(!e.target.checked); store('arc_snd', e.target.checked ? '1' : '0'); });
      document.querySelectorAll('.ov').forEach(function (o) { o.addEventListener('click', function (e) { if (e.target === o) A.ui.closeAll(); }); });
      /* restore settings (incl. sound across project navigations) */
      if (store('arc_scan') === '0') { $('cScan').checked = false; document.body.classList.add('noscan'); }
      if (store('arc_quick') === '1') { S.quick = true; $('cQuick').checked = true; }
      function syncSoundPref() {
        var wantOn = store('arc_snd') === '1';
        A.audio.setMuted(!wantOn);
        A.ui.syncSound();
      }
      syncSoundPref();
      window.addEventListener('pageshow', syncSoundPref);
      ['pointerdown', 'keydown'].forEach(function (ev) {
        document.addEventListener(ev, function () { if (store('arc_snd') === '1' && !A.audio.isMuted()) A.audio.unlock(); }, { capture: true, passive: true });
      });
      /* tooltips */
      tip = $('tip');
      function show(el) { var r = el.getBoundingClientRect(); tip.textContent = el.getAttribute('data-tip'); tip.classList.add('on'); var w = tip.offsetWidth, x = Math.min(innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2)); tip.style.left = x + 'px'; tip.style.top = Math.max(8, r.top - tip.offsetHeight - 10) + 'px'; }
      document.addEventListener('mouseover', function (e) { var t = e.target.closest && e.target.closest('.term'); if (t) show(t); });
      document.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest('.term')) tip.classList.remove('on'); });
      document.addEventListener('focusin', function (e) { if (e.target.classList && e.target.classList.contains('term')) show(e.target); });
      document.addEventListener('focusout', function () { tip.classList.remove('on'); });
      /* mobile pad */
      document.querySelectorAll('#pad button').forEach(function (b) {
        var k = b.dataset.k;
        b.addEventListener('pointerdown', function (e) { e.preventDefault(); if (k === 'enter') A.engine.interact(); else A.engine.pad(k, 1); });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { if (k !== 'enter') A.engine.pad(k, 0); }); });
      });
    },
    syncSound: function () { var off = A.audio.isMuted(); $('bSnd').textContent = off ? 'SOUND OFF' : 'SOUND ON'; $('cSnd').checked = !off; },
    toast: function (msg, ms) { var t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, ms || 2800); },
    hint: function (on) { var h = $('hint'); clearTimeout(hintT); h.classList.toggle('on', on); if (on) hintT = setTimeout(function () { h.classList.remove('on'); }, 6000); },
    tourChip: function (on) { $('tourChip').classList.toggle('on', !!on); $('bTour').textContent = on ? 'EXIT TOUR' : 'TOUR'; },
    setActive: function (k) { mini.forEach(function (b, i) { b.classList.toggle('on', i === k); }); },
    markVisited: function (slug) { var i = D.cards.findIndex(function (c) { return c.slug === slug; }); if (i >= 0) mini[i].classList.add('vis'); A.world.setVisited(slug); },
    isOpen: function () { return !!S.overlay; },
    closeAll: function (silent) {
      var tutClosed = A.ui.closeTutorial ? A.ui.closeTutorial() : false;
      document.querySelectorAll('.ov.on').forEach(function (o) {
        o.classList.remove('on');
        var box = o.querySelector('.ov-in');
        if (box) { box.classList.remove('expanded'); var eb = box.querySelector('.ov-exp'); if (eb) eb.textContent = 'FULL'; }
      });
      hallT.forEach(clearTimeout); hallT = [];
      var was = !!S.overlay || tutClosed;
      S.overlay = null;
      return was;
    },
    openList: function () { openOv('ovList'); A.ui.listSel(S.near >= 0 && A.world.items[S.near].kind === 'door' ? A.world.items[S.near].i : 0); },
    listSel: function (i) { listSel = (i + listEls.length) % listEls.length; listEls.forEach(function (a, k) { a.classList.toggle('sel', k === listSel); }); listEls[listSel].focus({ preventScroll: true }); },
    openHall: function () {
      openOv('ovHall'); var rows = $('hallRows').children, i; for (i = 0; i < rows.length; i++) rows[i].classList.remove('in');
      for (i = 0; i < rows.length; i++) (function (k) { hallT.push(setTimeout(function () { rows[k].classList.add('in'); A.audio.play('coin'); }, S.rm ? 0 : 220 + k * 220)); })(i);
    },
    openReg: function () { openOv('ovReg'); },
    openCfg: function () { openOv('ovCfg'); $('cScan').focus(); },
    openResume: function () {
      var pages = $('resPages');
      if (pages && !pages.dataset.loaded) {
        pages.dataset.loaded = '1';
        ['assets/resume/resume_page_1.webp', 'assets/resume/resume_page_2.webp'].forEach(function (src, idx) {
          var img = document.createElement('img');
          img.src = src;
          img.alt = 'Eshan H Resume page ' + (idx + 1);
          img.loading = 'lazy';
          img.decoding = 'async';
          pages.appendChild(img);
        });
      }
      openOv('ovResume');
      if ($('resClose')) $('resClose').focus();
    },
    /* overlay keyboard: returns true when handled */
    key: function (e) {
      if (S.overlay === 'ovList') {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { A.ui.listSel(listSel + 1); return true; }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { A.ui.listSel(listSel - 1); return true; }
        if (e.key === 'Enter' || e.key === ' ') { A.engine.quickGo(D.cards[listSel].slug); return true; }
      }
      return false;
    },
    closeTutorial: function () {
      var el = $('hubTut');
      if (!el || !el.classList.contains('on')) return false;
      el.classList.remove('on');
      try { localStorage.setItem('arc_hub_tut_done', '1'); } catch (e) {}
      return true;
    },
    maybeTutorial: function () {
      try { if (localStorage.getItem('arc_hub_tut_done') === '1') return; } catch (e) {}
      if (S.overlay) return;
      A.ui.startTutorial(false);
    },
    startTutorial: function (force) {
      if (S.state !== 'WORLD') return;
      A.ui.closeAll(true);
      var steps = [
        { target: '#mini', title: 'Explore Horizontal Hallway', swipe: 'Swipe Left / Right · Keys ← → · Minimap Dots', body: 'Scroll horizontally across all 9 project doors by swiping, pressing Arrow keys, using on-screen pads, or hitting TOUR for autopilot.' },
        { target: '#bList', title: 'Open Projects & Awards', body: 'Tap any glowing door (or press ENTER) to step into its interactive project showcase. Use LIST for a jump menu or inspect the Hall of Fame.' },
        { target: '#bSnd', title: 'Sound, Resume & Portfolio Return', body: 'Toggle SOUND here — your audio setting stays ON when entering projects and returning. Use RESUME or PORTFOLIO in the top-left bar anytime.' }
      ];
      var tut = $('hubTut'), hole, card, stEl, hEl, bEl, swEl, nextBtn, idx = 0;
      if (!tut) {
        tut = document.createElement('div'); tut.id = 'hubTut'; tut.className = 'hub-tut';
        tut.setAttribute('role', 'dialog'); tut.setAttribute('aria-label', 'Arcade navigation tutorial');
        hole = document.createElement('div'); hole.className = 'hub-tut-hole';
        card = document.createElement('div'); card.className = 'hub-tut-card';
        stEl = document.createElement('div'); stEl.className = 'hub-tut-step';
        hEl = document.createElement('h3');
        bEl = document.createElement('p');
        swEl = document.createElement('div'); swEl.className = 'hub-tut-swipe'; swEl.innerHTML = '<i>&larr; &rarr;</i><span></span>';
        var acts = document.createElement('div'); acts.className = 'hub-tut-acts';
        var skipBtn = document.createElement('button'); skipBtn.type = 'button'; skipBtn.className = 'pbtn'; skipBtn.textContent = 'SKIP';
        nextBtn = document.createElement('button'); nextBtn.type = 'button'; nextBtn.className = 'pbtn hub-tut-next'; nextBtn.textContent = 'NEXT';
        skipBtn.addEventListener('click', function () { A.ui.closeTutorial(); });
        nextBtn.addEventListener('click', function () { if (idx + 1 < steps.length) show(idx + 1); else A.ui.closeTutorial(); });
        acts.appendChild(skipBtn); acts.appendChild(nextBtn);
        card.appendChild(stEl); card.appendChild(hEl); card.appendChild(bEl); card.appendChild(swEl); card.appendChild(acts);
        tut.appendChild(hole); tut.appendChild(card);
        tut.addEventListener('click', function (e) { if (e.target === tut) A.ui.closeTutorial(); });
        document.getElementById('ui').appendChild(tut);
      } else {
        hole = tut.querySelector('.hub-tut-hole'); card = tut.querySelector('.hub-tut-card');
        stEl = tut.querySelector('.hub-tut-step'); hEl = tut.querySelector('h3'); bEl = tut.querySelector('p');
        swEl = tut.querySelector('.hub-tut-swipe'); nextBtn = tut.querySelector('.hub-tut-next');
      }
      function show(i) {
        idx = i;
        var st = steps[i];
        stEl.textContent = 'STEP ' + (i + 1) + ' OF ' + steps.length;
        hEl.textContent = st.title;
        bEl.textContent = st.body;
        if (st.swipe) { swEl.style.display = 'inline-flex'; swEl.querySelector('span').textContent = st.swipe; }
        else { swEl.style.display = 'none'; }
        nextBtn.textContent = i + 1 === steps.length ? 'GOT IT' : 'NEXT';
        tut.classList.add('on');
        var tEl = document.querySelector(st.target);
        var vw = window.innerWidth, vh = window.innerHeight;
        var r = tEl ? tEl.getBoundingClientRect() : { left: vw * 0.2, top: vh * 0.4, right: vw * 0.8, bottom: vh * 0.6, width: vw * 0.6, height: vh * 0.2 };
        if (r.width <= 0 || r.height <= 0) r = { left: vw * 0.2, top: vh * 0.72, right: vw * 0.8, bottom: vh * 0.88, width: vw * 0.6, height: 60 };
        var hx = Math.max(4, r.left - 6), hy = Math.max(4, r.top - 6);
        var hw = Math.min(vw - hx - 4, r.width + 12), hh = Math.min(vh - hy - 4, r.height + 12);
        hole.style.left = hx + 'px'; hole.style.top = hy + 'px'; hole.style.width = hw + 'px'; hole.style.height = hh + 'px';
        var ch = card.offsetHeight || 220, cw = card.offsetWidth || 320;
        var cy = (r.top > vh * 0.48) ? Math.max(12, hy - ch - 14) : Math.min(vh - ch - 12, hy + hh + 14);
        var cx = Math.max(12, Math.min(vw - cw - 12, hx + hw / 2 - cw / 2));
        card.style.left = cx + 'px'; card.style.top = cy + 'px';
      }
      show(0);
    }
  };
})(window.A = window.A || {});
