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
      addMessage(data.reply || "Signal's a bit weak — try asking that again.", 'bot');
    } catch (err) {
      typingEl.remove();
      addMessage(localFallback(text), 'bot');
    }
  }

  // ---- Local fallback knowledge base (used only if the
  // serverless function isn't reachable) ----
  function localFallback(q) {
    const s = q.toLowerCase();
    if (s.includes('argus')) return "Project Argus is Eshan's final-year capstone — a decentralized, multi-node AI surveillance platform with dynamic agent spawning for real-time detection and cross-camera tracking. You can open the live demo from the Builds section above.";
    if (s.includes('saathi')) return "SAATHI is an AI health-screening assistant reachable over SMS, calls, and WhatsApp, in native Indian languages, built for people using basic feature phones. It won 2nd place at Innovathon IMPULSE 2026 and was pitched to and selected by Sujai's Dental Clinic in Bengaluru.";
    if (s.includes('intern') || s.includes('job') || s.includes('hire') || s.includes('role')) return "Yes — Eshan is actively looking for internship and entry-level opportunities. Best way to reach him is via the contact section at the bottom of this page, or directly at eshanh051116@gmail.com.";
    if (s.includes('achievement') || s.includes('biggest') || s.includes('award')) return "Hard to pick just one, but the 30-day streak stands out: 5 hackathon wins across 4 different teams, plus a Best Research Paper Award at ICRIET-2025 for work on 3D-printed battlefield medical aids.";
    if (s.includes('research') || s.includes('paper')) return "Two published/awarded works: a Best Paper Award at ICRIET-2025 on 3D-printed medical aids for hemorrhage control, and a study on SkillM, a gamified e-learning platform that improved test scores by 63% for underserved students.";
    if (s.includes('education') || s.includes('college') || s.includes('cgpa')) return "Eshan is a final-year Computer Science Engineering student at SJB Institute of Technology, Bengaluru, with a CGPA of 9.21+.";
    return "I'm running on a local fallback right now (the live AI backend isn't connected in this preview). Try asking about Project Argus, SAATHI, his research papers, or whether he's open to opportunities — I've got answers cached for those.";
  }
});
