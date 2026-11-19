/* UI: HUD, minimap, list, Hall of Fame, Design Registration, settings, toast, tooltips. */
(function (A) {
  var D = A.DATA, S = A.S, $ = function (id) { return document.getElementById(id); }, toastT = 0, hintT = 0, hallT = [], tip, mini = [], listSel = 0, listEls = [];
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  A.store = store;
  function openOv(id) { A.ui.closeAll(true); $(id).classList.add('on'); S.overlay = id; }

  A.ui = {
    init: function () {
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
      $('bList').addEventListener('click', A.ui.openList); $('bTour').addEventListener('click', function () { A.engine.tour(!S.tour); });
      $('bSnd').addEventListener('click', function () { A.audio.setMuted(!A.audio.isMuted()); store('arc_snd', A.audio.isMuted() ? '0' : '1'); });
      $('bCfg').addEventListener('click', function () { A.ui.openCfg(); }); $('skip').addEventListener('click', function () { A.engine.skipIntro(); });
      $('cScan').addEventListener('change', function (e) { document.body.classList.toggle('noscan', !e.target.checked); store('arc_scan', e.target.checked ? '1' : '0'); });
      $('cQuick').addEventListener('change', function (e) { S.quick = e.target.checked; store('arc_quick', S.quick ? '1' : '0'); });
      $('cSnd').addEventListener('change', function (e) { A.audio.setMuted(!e.target.checked); });
      document.querySelectorAll('.ov').forEach(function (o) { o.addEventListener('click', function (e) { if (e.target === o) A.ui.closeAll(); }); });
      /* restore settings */
      if (store('arc_scan') === '0') { $('cScan').checked = false; document.body.classList.add('noscan'); }
      if (store('arc_quick') === '1') { S.quick = true; $('cQuick').checked = true; }
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
    closeAll: function (silent) { document.querySelectorAll('.ov.on').forEach(function (o) { o.classList.remove('on'); }); hallT.forEach(clearTimeout); hallT = []; var was = !!S.overlay; S.overlay = null; return was; },
    openList: function () { openOv('ovList'); A.ui.listSel(S.near >= 0 && A.world.items[S.near].kind === 'door' ? A.world.items[S.near].i : 0); },
    listSel: function (i) { listSel = (i + listEls.length) % listEls.length; listEls.forEach(function (a, k) { a.classList.toggle('sel', k === listSel); }); listEls[listSel].focus({ preventScroll: true }); },
    openHall: function () {
      openOv('ovHall'); var rows = $('hallRows').children, i; for (i = 0; i < rows.length; i++) rows[i].classList.remove('in');
      for (i = 0; i < rows.length; i++) (function (k) { hallT.push(setTimeout(function () { rows[k].classList.add('in'); A.audio.play('coin'); }, S.rm ? 0 : 220 + k * 220)); })(i);
    },
    openReg: function () { openOv('ovReg'); },
    openCfg: function () { openOv('ovCfg'); $('cScan').focus(); },
    /* overlay keyboard: returns true when handled */
    key: function (e) {
      if (S.overlay === 'ovList') {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { A.ui.listSel(listSel + 1); return true; }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { A.ui.listSel(listSel - 1); return true; }
        if (e.key === 'Enter' || e.key === ' ') { A.engine.quickGo(D.cards[listSel].slug); return true; }
      }
      return false;
    }
  };
})(window.A = window.A || {});
