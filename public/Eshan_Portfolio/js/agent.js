// ============================================================
// agent.js — "ARGUS" AI assistant for Eshan H's portfolio.
// Features sessionStorage memory (multi-turn history), safe-DOM
// formatting (bullets, flow diagrams, bold labels), strict allowlisted
// section/modal/external action chips, expandable panel & offline fallback.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('agentPanel');
  const toggle = document.getElementById('agentToggle');
  const closeBtn = document.getElementById('agentClose');
  const expandBtn = document.getElementById('agentExpand');
  const clearBtn = document.getElementById('agentClear');
  const messages = document.getElementById('agentMessages');
  const form = document.getElementById('agentForm');
  const input = document.getElementById('agentInput');
  const suggestions = document.getElementById('agentSuggestions');

  if (!panel || !toggle) return;

  const STORE_KEY = 'eshan_argus_history';
  const MAX_TURNS = 8;
  const ALLOWED_SECTIONS = new Set(['#top', '#about', '#skills', '#work', '#awards', '#research', '#certs', '#gallery', '#contact']);
  const ALLOWED_SLUGS = new Set(['argus', 'saathi', 'verifarm', 'soil-and-toil', 'axiom', 'personaforge', 'kavach', 'pro-rover', 'usb-tcp-bridge']);
  const ALLOWED_EXT = new Set([
    'https://github.com/Falcon0516',
    'https://www.linkedin.com/in/eshan-h',
    'https://linkedin.com/in/eshan-h',
    'https://argus-47.netlify.app',
    'https://saathi-presentation.netlify.app',
    'https://persona--forge.vercel.app',
    'https://vigyantra.vercel.app',
    'https://verifarm-2026.web.app',
    'https://play.google.com/store/apps/details?id=com.verifarm.app',
    'https://www.ijcrt.org/papers/IJCRTBE02004.pdf',
    'mailto:eshanh051116@gmail.com'
  ]);

  let opened = false;
  let history = loadHistory();

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.slice(-MAX_TURNS * 2) : [];
    } catch { return []; }
  }

  function saveHistory() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-MAX_TURNS * 2))); } catch {}
  }

  function isAllowedAction(type, target) {
    if (type === 'SECTION') return ALLOWED_SECTIONS.has(target);
    if (type === 'MODAL') return target === 'resume' || target === 'explain';
    if (type === 'ARCADE') {
      if (target === '/' || target === '/Eshan_Portfolio/index.html' || target === '/arcade/index.html') return true;
      const m = /^\/arcade\/projects\/([a-z0-9-]+)\/index\.html$/.exec(target);
      return !!(m && ALLOWED_SLUGS.has(m[1]));
    }
    if (type === 'EXT') return ALLOWED_EXT.has(target) || target.startsWith('https://github.com/Falcon0516/');
    return false;
  }

  function appendInlineRich(parent, str) {
    const parts = String(str || '').split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    parts.forEach((part) => {
      if (!part) return;
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const b = document.createElement('strong');
        b.textContent = part.slice(2, -2);
        parent.appendChild(b);
      } else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        const c = document.createElement('code');
        c.textContent = part.slice(1, -1);
        parent.appendChild(c);
      } else {
        parent.appendChild(document.createTextNode(part));
      }
    });
  }

  function appendFlowBlock(container, flowText) {
    const raw = String(flowText || '').replace(/\n+/g, ' -> ').trim();
    const nodes = raw.split(/\s*(?:->|\u2192|\u2194)\s*/).filter(Boolean);
    if (nodes.length < 2) return false;
    const wrap = document.createElement('div');
    wrap.className = 'ag-flow';
    nodes.forEach((label, idx) => {
      const n = document.createElement('span');
      n.className = 'ag-node';
      n.textContent = label.replace(/^\*\*|\*\*$/g, '').trim();
      wrap.appendChild(n);
      if (idx + 1 < nodes.length) {
        const a = document.createElement('span');
        a.className = 'ag-arr';
        a.textContent = '\u2192';
        wrap.appendChild(a);
      }
    });
    container.appendChild(wrap);
    return true;
  }

  function scrollToSection(hash) {
    const target = document.querySelector(hash);
    if (!target) return;
    if (window.innerWidth <= 640 || panel.classList.contains('expanded')) {
      panel.classList.remove('expanded', 'open');
      if (expandBtn) expandBtn.textContent = '\u2922';
      opened = false;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('ag-flash');
    setTimeout(() => target.classList.remove('ag-flash'), 1600);
  }

  function renderRichReply(container, rawText) {
    const actions = [];
    const text = String(rawText || '').replace(/\[\[ACTION:([A-Za-z]+)\|([^|\]]+)\|([^\]]+)\]\]/g, (_, t, lbl, tgt) => {
      const type = String(t || '').toUpperCase();
      const label = String(lbl || '').trim();
      const target = String(tgt || '').trim();
      if (label && isAllowedAction(type, target) && actions.length < 3) {
        actions.push({ type, label, target });
      }
      return '';
    }).trim();

    const segs = text.split(/```(?:flow|diagram)?\s*\n([\s\S]*?)```/gi);
    segs.forEach((seg, idx) => {
      if (idx % 2 === 1) {
        if (!appendFlowBlock(container, seg)) {
          const p = document.createElement('p');
          p.textContent = seg.trim();
          container.appendChild(p);
        }
        return;
      }
      let listEl = null;
      let listType = '';
      const flushList = () => { listEl = null; listType = ''; };

      seg.split('\n').forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line) { flushList(); return; }
        if (/^(?:Flow\s*:\s*)?.+(?:\s*(?:->|→)\s*.+){2,}$/i.test(line)) {
          flushList();
          appendFlowBlock(container, line.replace(/^Flow\s*:\s*/i, ''));
          return;
        }
        const ulm = /^[-*\u2022]\s+(.+)$/.exec(line);
        if (ulm) {
          if (listType !== 'ul') { listEl = document.createElement('ul'); listEl.className = 'ag-list'; container.appendChild(listEl); listType = 'ul'; }
          const li = document.createElement('li');
          appendInlineRich(li, ulm[1]);
          listEl.appendChild(li);
          return;
        }
        const olm = /^\d+[.)]\s+(.+)$/.exec(line);
        if (olm) {
          if (listType !== 'ol') { listEl = document.createElement('ol'); listEl.className = 'ag-list'; container.appendChild(listEl); listType = 'ol'; }
          const oli = document.createElement('li');
          appendInlineRich(oli, olm[1]);
          listEl.appendChild(oli);
          return;
        }
        flushList();
        const hm = /^#{1,4}\s+(.+)$/.exec(line);
        if (hm) {
          const h = document.createElement('div');
          h.className = 'ag-h';
          h.textContent = hm[1].replace(/\*\*/g, '');
          container.appendChild(h);
          return;
        }
        const p = document.createElement('p');
        appendInlineRich(p, line);
        container.appendChild(p);
      });
    });

    if (actions.length) {
      const actRow = document.createElement('div');
      actRow.className = 'ag-acts';
      actions.forEach((act) => {
        if (act.type === 'SECTION') {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'ag-act'; b.textContent = act.label;
          b.addEventListener('click', () => scrollToSection(act.target));
          actRow.appendChild(b);
        } else if (act.type === 'MODAL') {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'ag-act'; b.textContent = act.label;
          b.addEventListener('click', () => {
            if (act.target === 'resume') {
              const btn = document.getElementById('navResumeBtn') || document.getElementById('heroResumeBtn');
              if (btn) btn.click();
            } else {
              scrollToSection('#work');
            }
          });
          actRow.appendChild(b);
        } else if (act.type === 'ARCADE') {
          const a = document.createElement('a');
          a.className = 'ag-act'; a.textContent = act.label;
          a.href = act.target + (act.target.includes('arcade') ? '?from=pro' : '');
          actRow.appendChild(a);
        } else {
          const a = document.createElement('a');
          a.className = 'ag-act'; a.textContent = act.label;
          a.href = act.target; a.target = '_blank'; a.rel = 'noopener noreferrer';
          actRow.appendChild(a);
        }
      });
      container.appendChild(actRow);
    }
  }

  function addMessage(text, who) {
    const wrap = document.createElement('div');
    wrap.className = `agent-msg ${who}`;
    if (who === 'bot') renderRichReply(wrap, text);
    else {
      const p = document.createElement('p');
      p.textContent = text;
      wrap.appendChild(p);
    }
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
    return wrap;
  }

  function addTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'agent-msg bot typing';
    wrap.innerHTML = '<p>ARGUS is thinking...</p>';
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
    return wrap;
  }

  function resetConversation() {
    history = [];
    saveHistory();
    messages.innerHTML = '';
    addMessage("Hi! I'm **ARGUS**, Eshan's AI portfolio guide. Ask about his architecture flows, design registration, GigBirds experience, or open sections directly.", 'bot');
  }

  // Restore saved session turns
  if (history.length) {
    history.forEach((turn) => {
      if (turn && turn.content) addMessage(turn.content, turn.role === 'user' ? 'user' : 'bot');
    });
  }

  // Subtle first-visit spotlight pill introducing the corner ARGUS chatbot
  const introEl = document.getElementById('agentIntroTip');
  function dismissIntroTip() {
    if (introEl) introEl.classList.remove('on');
    try { localStorage.setItem('pro_argus_seen', '1'); } catch {}
  }
  if (introEl) {
    try {
      if (localStorage.getItem('pro_argus_seen') !== '1') {
        setTimeout(() => { if (!opened) introEl.classList.add('on'); }, 1200);
      }
    } catch {}
    const dismissBtn = introEl.querySelector('button');
    if (dismissBtn) dismissBtn.addEventListener('click', (e) => { e.stopPropagation(); dismissIntroTip(); });
  }

  toggle.addEventListener('click', () => {
    opened = !opened;
    panel.classList.toggle('open', opened);
    dismissIntroTip();
    if (opened) input.focus();
  });
  closeBtn.addEventListener('click', () => {
    opened = false;
    panel.classList.remove('open', 'expanded');
    if (expandBtn) expandBtn.textContent = '\u2922';
  });
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      const on = panel.classList.toggle('expanded');
      expandBtn.textContent = on ? '\u2199' : '\u2922';
      expandBtn.setAttribute('aria-label', on ? 'Restore chat size' : 'Expand chat window');
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', resetConversation);
  }

  suggestions.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-q');
      sendMessage(q);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    input.value = '';
    sendMessage(val);
  });

  async function sendMessage(text) {
    addMessage(text, 'user');
    const typingEl = addTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-MAX_TURNS * 2) })
      });

      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      typingEl.remove();
      const reply = data.reply || 'Signal is weak right now. Try asking that again.';
      addMessage(reply, 'bot');
      history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
      saveHistory();
    } catch {
      typingEl.remove();
      const fallback = localFallback(text);
      addMessage(fallback, 'bot');
      history.push({ role: 'user', content: text }, { role: 'assistant', content: fallback });
      saveHistory();
    }
  }

  function localFallback(q) {
    const s = q.toLowerCase();
    if (s.includes('argus') || s.includes('design') || s.includes('patent')) {
      return [
        '**Project ARGUS:** Multi-camera AI surveillance platform running on an 8 GB MacBook.',
        '```flow\n6 Cameras -> YOLOv8n Edge Sentry -> Groq VLM Router -> Stage 2 Verify -> SQLite Dashboard\n```',
        '- **IP Status:** Indian Design Application No. `515509-001` (design registration, published in Journal 41/2026).',
        '- **Efficiency (2h run):** 971 cloud calls vs 466,523 naive frames (99.8% fewer).',
        '[[ACTION:ARCADE|Open ARGUS Showcase|/arcade/projects/argus/index.html]] [[ACTION:SECTION|View IP & Research|#research]] [[ACTION:EXT|ARGUS Live Demo \u2197|https://argus-47.netlify.app]]'
      ].join('\n');
    }
    if (s.includes('saathi')) {
      return [
        '**SAATHI:** Real-time multilingual voice-AI phone assistant (English, Hindi, Kannada) without paid telephony APIs.',
        '```flow\nCaller Audio -> VoidCaller WS -> VAD Ring Buffer -> Sarvam / Whisper -> Groq Llama -> Piper TTS\n```',
        '- **Awards:** 2nd place at AI-STHETICA AIVORA 2026 and Innovathon IMPULSE 6.0.',
        '[[ACTION:ARCADE|Open SAATHI Showcase|/arcade/projects/saathi/index.html]] [[ACTION:EXT|SAATHI Demo \u2197|https://saathi-presentation.netlify.app]]'
      ].join('\n');
    }
    if (s.includes('gigbirds') || s.includes('experience') || s.includes('work')) {
      return [
        '**Experience at GigBirds (Sep 2026 - Present):** Part-time App Developer.',
        '- **Stack:** Two Flutter apps (students & recruiters) + FastAPI backend.',
        '- **AI & Governance:** Groq Llama 3.3 70B + Qwen 27B document parser, physical master-key append-only ledger.',
        '[[ACTION:SECTION|About & Experience|#about]] [[ACTION:MODAL|View Resume|resume]]'
      ].join('\n');
    }
    if (s.includes('resume') || s.includes('cv')) {
      return 'You can preview both pages or download Eshan H\'s resume PDF directly:\n[[ACTION:MODAL|View Resume|resume]] [[ACTION:SECTION|Education & Timeline|#about]]';
    }
    if (s.includes('achievement') || s.includes('award') || s.includes('hackathon') || s.includes('win')) {
      return [
        '**Highlights (15+ Hackathons, 8 Podiums):**',
        '- **Four 1st Places:** ADVAYA 2.0 (National), Beam Build Battle, M&E Ideathon, SIH Internal Hackathon 2026.',
        '- **IP & Research:** Design Registration `515509-001` (published) and Best Paper Award (ICRIET-2025).',
        '[[ACTION:SECTION|Explore Awards|#awards]] [[ACTION:SECTION|Research & IP|#research]]'
      ].join('\n');
    }
    if (s.includes('research') || s.includes('paper')) {
      return [
        '**Publications & IP:**',
        '- **ICRIET-2025 (Best Paper):** 3D-Printed Medical Aids for Hemorrhage Control (IJCRT Vol. 13).',
        '- **Design Reg. 515509-001:** Published in Patent Office Journal 41/2026.',
        '- **SkillM:** Gamified offline e-learning paper submitted to Educational Technology & Society.',
        '[[ACTION:SECTION|View Research Section|#research]] [[ACTION:EXT|Read ICRIET Paper \u2197|https://www.ijcrt.org/papers/IJCRTBE02004.pdf]]'
      ].join('\n');
    }
    if (s.includes('contact') || s.includes('intern') || s.includes('hire') || s.includes('github') || s.includes('linkedin')) {
      return [
        'Eshan is open to software engineering roles building and operating real systems:',
        '- **Email:** `eshanh051116@gmail.com`',
        '[[ACTION:EXT|GitHub \u2197|https://github.com/Falcon0516]] [[ACTION:EXT|LinkedIn \u2197|https://linkedin.com/in/eshan-h]] [[ACTION:SECTION|Contact Section|#contact]]'
      ].join('\n');
    }
    return [
      'Running in offline summary mode. Here are quick jumps:',
      '- **25+ Projects & 9 Interactive Showcases** in Project Arcade',
      '- **15+ Hackathons & 8 Podiums**, Indian Design Reg. `515509-001`',
      '[[ACTION:ARCADE|Open Project Arcade|/arcade/index.html]] [[ACTION:MODAL|View Resume|resume]] [[ACTION:SECTION|Browse Work|#work]]'
    ].join('\n');
  }
});
