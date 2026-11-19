/* Mini prompt compiler (demo). Deterministic: same config in, same prompt out.
   cfg = { ids:[blockId], channel:'web'|'voice'|'whatsapp', plain:bool, patched:{id:true}, budget:number }
   Mirrors the real behaviour described in the Truth Sheet; rules here are illustrative. */
(function () {
  var F = PF.FACTS, BY = {};
  F.BLOCKS.forEach(function (b) { BY[b.id] = b; });

  function active(b, cfg) { // filter by mode (chat/voice) and channel
    var voice = cfg.channel === 'voice';
    if (b.mode === 'voice' && !voice) return false;
    if (b.mode === 'chat' && voice) return false;
    return true;
  }
  function attr(b, cfg, key) {
    var v = (cfg.patched && cfg.patched[b.id] && b.alt && key in b.alt) ? b.alt[key] : b[key];
    return v;
  }
  function linesOf(b, cfg) {
    var arr = (cfg.patched && cfg.patched[b.id] && b.alt && b.alt.l) ? b.alt.l : b.l;
    return arr.map(function (x) { return typeof x === 'string' ? { t: x, md: 0 } : x; });
  }
  function tok(s) { return Math.ceil(s.length / 4); }

  function conflicts(cfg) {
    var out = [], act = [];
    (cfg.ids || []).forEach(function (id) { var b = BY[id]; if (b && active(b, cfg)) act.push(b); });
    var md = act.filter(function (b) { return attr(b, cfg, 'md'); })[0];
    if (cfg.channel === 'voice' && md && !cfg.plain)
      out.push({ rule: 'voicemd', a: md.id, b: null, patch: { plain: true } });
    var gr = act.filter(function (b) { return b.grounding; })[0];
    var hasFaq = act.some(function (b) { return b.faq; });
    if (gr && !hasFaq) out.push({ rule: 'faq', a: gr.id, b: null, patch: { add: 'kn_faq' } });
    var fo = act.filter(function (b) { return (attr(b, cfg, 'formality') || 0) >= 0.7; })[0];
    var sl = act.filter(function (b) { return attr(b, cfg, 'slang'); })[0];
    if (fo && sl) out.push({ rule: 'formal', a: fo.id, b: sl.id, patch: { fix: fo.id } });
    var em = act.filter(function (b) { return (attr(b, cfg, 'empathy') || 0) >= 0.8; })[0];
    var sa = act.filter(function (b) { return attr(b, cfg, 'sarcasm'); })[0];
    if (em && sa) out.push({ rule: 'sarc', a: em.id, b: sa.id, patch: { fix: sa.id } });
    out.forEach(function (c) { c.n = F.CONFLICTS[c.rule].n; c.fixLabel = F.CONFLICTS[c.rule].fix; });
    return out;
  }
  function applyPatch(cfg, c) { // returns a NEW cfg
    var n = JSON.parse(JSON.stringify(cfg)); n.patched = n.patched || {};
    if (c.patch.plain) n.plain = true;
    if (c.patch.add && n.ids.indexOf(c.patch.add) < 0) n.ids.push(c.patch.add);
    if (c.patch.fix) n.patched[c.patch.fix] = true;
    return n;
  }

  function score(cfg, act, confs) {
    var has = function (ci) { return act.some(function (b) { return b.c === ci; }); };
    var grounded = act.some(function (b) { return b.grounding; }), faq = act.some(function (b) { return b.faq; });
    var ok = {
      role: has(1), guard: has(5), fb: has(7), lang: has(3), domain: has(14) || has(4), len: has(11),
      refuse: has(6), halu: grounded && faq, contra: act.length > 0 && confs.length === 0
    };
    var total = 0, checks = F.CHECKS.map(function (c) { var o = !!ok[c.k]; if (o) total += c.w; return { k: c.k, n: c.n, w: c.w, ok: o }; });
    return { total: total, checks: checks };
  }

  function compile(cfg) {
    cfg = cfg || { ids: [] };
    cfg.channel = cfg.channel || 'web';
    var act = [], rows = [];
    (cfg.ids || []).forEach(function (id) { var b = BY[id]; if (b && active(b, cfg)) act.push(b); });
    var confs = conflicts(cfg);
    act.forEach(function (b, bi) {
      linesOf(b, cfg).forEach(function (ln, li) {
        if (cfg.channel === 'voice' && cfg.plain && ln.md) return; // voice drops markdown
        rows.push({ sec: F.CATS[b.c].sec, t: ln.t, id: b.id, pri: b.p, ord: bi * 10 + li });
      });
    });
    var chan = { web: 'Channel: web chat. Markdown is fine.', voice: 'Channel: voice. Speak, do not format.', whatsapp: 'Channel: WhatsApp. Keep messages short.' };
    rows.push({ sec: 9, t: chan[cfg.channel], id: '@compiler', pri: 5, ord: -1 });
    if (cfg.channel === 'voice' && cfg.plain) rows.push({ sec: 8, t: 'Format: plain speech, no markdown.', id: '@compiler', pri: 5, ord: -2 });
    rows.sort(function (a, b) { return a.sec - b.sec || b.pri - a.pri || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) || a.ord - b.ord; });

    // token budget: drop lowest-priority lines one by one until it fits
    var dropped = [], budget = cfg.budget == null ? Infinity : cfg.budget;
    function total() {
      var t = 0, seen = {};
      rows.forEach(function (r) { if (r.drop) return; t += tok(r.t); if (!seen[r.sec]) { seen[r.sec] = 1; t += 3; } });
      return t;
    }
    var guard = 0;
    while (total() > budget && guard++ < 400) {
      var pick = null;
      for (var i = rows.length - 1; i >= 0; i--) { var r = rows[i]; if (r.drop) continue; if (!pick || r.pri < pick.pri) pick = r; }
      if (!pick) break;
      pick.drop = true; dropped.push(pick);
    }
    var secs = F.SECTIONS.map(function (name, si) { return { name: name, rows: rows.filter(function (r) { return r.sec === si && !r.drop; }) }; });
    var trace = {}, n = 0, text = [];
    secs.forEach(function (s) {
      n++; text.push('## ' + s.name);
      s.rows.forEach(function (r) { n++; r.n = n; trace[n] = r.id; text.push(r.t); });
    });
    var kept = act.filter(function (b) { return rows.some(function (r) { return r.id === b.id && !r.drop; }); });
    return { cfg: cfg, sections: secs, trace: trace, text: text.join('\n'), tokens: total(), budget: budget, dropped: dropped, conflicts: confs, score: score(cfg, act, confs), active: act, kept: kept };
  }

  /* Persona preview (SIMULATION): canned replies keyed to role, tone and guardrails */
  function reply(key, cfg) {
    var act = []; (cfg.ids || []).forEach(function (id) { var b = BY[id]; if (b && active(b, cfg)) act.push(b); });
    var role = act.filter(function (b) { return b.c === 1; })[0];
    var R = F.REPLY, txt, styles = [];
    act.forEach(function (b) { var st = b.style; if (st === 'formal' && cfg.patched && cfg.patched[b.id]) st = null; if (st === 'sarcasm' && cfg.patched && cfg.patched[b.id]) st = null; if (st && F.STYLE[st]) styles.push(st); });
    if (key === 'rain') {
      var safe = act.some(function (b) { return b.style === 'ground' || b.style === 'idk'; });
      txt = safe ? (act.some(function (b) { return b.style === 'idk'; }) ? R.rain.safe : R.rain.safeNoIdk) : R.rain.guess;
    } else txt = (R[key][role ? role.id : 'd']) || R[key].d;
    var pre = '', suf = '';
    styles.forEach(function (s) { pre = pre || F.STYLE[s].pre; suf += F.STYLE[s].suf; });
    var out = pre + txt + (cfg.channel === 'whatsapp' ? '' : suf);
    if (cfg.channel === 'voice') out = out.replace(/!/g, '.');
    return { text: out, risky: key === 'rain' && txt === R.rain.guess };
  }
  function face(cfg) {
    var act = []; (cfg.ids || []).forEach(function (id) { var b = BY[id]; if (b && active(b, cfg)) act.push(b); });
    var m = { play: 'wink', formal: 'flat', slang: 'cool', empathy: 'soft', sarcasm: 'smirk' }, f = 'happy';
    act.forEach(function (b) { var st = b.style; if (st && cfg.patched && cfg.patched[b.id]) st = null; if (m[st]) f = m[st]; });
    return f;
  }
  function lum(hex) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

  PF.BY = BY;
  PF.compiler = { compile: compile, conflicts: conflicts, applyPatch: applyPatch, reply: reply, face: face, lum: lum };
})();
