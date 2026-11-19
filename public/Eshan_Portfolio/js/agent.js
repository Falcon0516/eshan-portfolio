// ============================================================
// agent.js — "ARGUS" guide agent UI.
// Talks to /.netlify/functions/chat, which proxies Groq with a
// server-side API key (never exposed to the browser).
// Falls back to a small local knowledge base if the function
// isn't deployed yet (e.g. opened straight from the filesystem),
// so the portfolio never looks "broken" during local preview.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('agentPanel');
  const toggle = document.getElementById('agentToggle');
  const closeBtn = document.getElementById('agentClose');
  const messages = document.getElementById('agentMessages');
  const form = document.getElementById('agentForm');
  const input = document.getElementById('agentInput');
  const suggestions = document.getElementById('agentSuggestions');

  if (!panel || !toggle) return;

  let opened = false;
  toggle.addEventListener('click', () => {
    opened = !opened;
    panel.classList.toggle('open', opened);
    if (opened) input.focus();
  });
  closeBtn.addEventListener('click', () => {
    opened = false;
    panel.classList.remove('open');
  });

  suggestions.querySelectorAll('button').forEach(btn => {
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

  function addMessage(text, who) {
    const wrap = document.createElement('div');
    wrap.className = `agent-msg ${who}`;
    const p = document.createElement('p');
    p.textContent = text;
    wrap.appendChild(p);
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
    return wrap;
  }

  function addTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'agent-msg bot typing';
    wrap.innerHTML = '<p>ARGUS is thinking…</p>';
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
    return wrap;
  }

  async function sendMessage(text) {
    addMessage(text, 'user');
    const typingEl = addTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      typingEl.remove();
      addMessage(data.reply || "Signal is weak right now. Try asking that again.", 'bot');
    } catch (err) {
      typingEl.remove();
      addMessage(localFallback(text), 'bot');
    }
  }

  // ---- Local fallback knowledge base (used only if the
  // serverless function isn't reachable) ----
  function localFallback(q) {
    const s = q.toLowerCase();
    if (s.includes('argus')) return "Project ARGUS is Eshan's final-year capstone, a multi-camera AI surveillance platform running on an 8 GB MacBook. It holds Indian Design Application No. 515509-001 (design registration, published in Patent Office Journal 41/2026) and has a live demo and showcase in Project Arcade.";
    if (s.includes('saathi')) return "SAATHI is a voice-AI phone assistant answering real calls in English, Hindi, and Kannada without paid telephony APIs. It won 2nd place at AI-STHETICA AIVORA 2026 and Innovathon IMPULSE 6.0.";
    if (s.includes('gigbirds') || s.includes('experience') || s.includes('work')) return "Since Sep 2026, Eshan has been working part-time as an App Developer at GigBirds, building two Flutter apps (students and recruiters) and a FastAPI backend with Groq Llama 3.3 70B and Qwen 27B.";
    if (s.includes('resume') || s.includes('cv')) return "You can preview and download Eshan's resume directly using the Resume button in the navigation bar or hero section.";
    if (s.includes('intern') || s.includes('job') || s.includes('hire') || s.includes('role')) return "Eshan is looking for opportunities to grow as a software engineer and learn how real systems are built and kept running. Reach him via the Contact section or at eshanh051116@gmail.com.";
    if (s.includes('achievement') || s.includes('biggest') || s.includes('award') || s.includes('patent') || s.includes('design')) return "Across 15+ hackathons, Eshan has 8 podium finishes including four 1st places (ADVAYA 2.0, Beam Build Battle, Ideathon, SIH Internal 2026), a Best Paper Award at ICRIET-2025, and Indian Design Registration 515509-001 (published) for ARGUS.";
    if (s.includes('research') || s.includes('paper')) return "Best Paper Award at ICRIET-2025 for 3D-printed medical aids (published in IJCRT, Vol. 13), plus a co-authored SkillM e-learning study submitted to Educational Technology & Society.";
    if (s.includes('education') || s.includes('college') || s.includes('cgpa')) return "Eshan is a final-year B.E. CSE student at SJBIT Bengaluru (VTU, 2023 to 2027) with a 9.28 CGPA, after 91.5% in Pre-University (PCMC) and 97.44% in SSLC.";
    return "Running on local fallback right now. Try asking about Project ARGUS, GigBirds, SAATHI, his design registration, research papers, or resume.";
  }
});
