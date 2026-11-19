"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';

const IDLE_PHRASES = [
  "Ask about ARGUS, Saathi & 9 projects",
  "Try: \"How does ARGUS work?\"",
  "Ask about Eshan's CGPA or patents",
  "Try: \"Take me to Hackathon wins\"",
  "Conversation memory & shortcuts active"
];

const MEM_KEY = 'game_argus_history';
const MAX_TURNS = 16;

const ALLOWED_SLUGS = new Set([
  'argus', 'axiom', 'kavach', 'personaforge',
  'pro-rover', 'saathi', 'soil-and-toil', 'usb-tcp-bridge', 'verifarm'
]);
const ALLOWED_SECTIONS = new Set([
  '#top', '#about', '#skills', '#work', '#awards', '#research', '#certs', '#gallery', '#contact'
]);
const ALLOWED_MODALS = new Set(['resume', 'explain']);
const ALLOWED_EXT_EXACT = new Set([
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

function isSafeAction(type, val) {
  const t = String(type || '').trim().toUpperCase();
  const v = String(val || '').trim();
  if (!t || !v) return false;
  if (t === 'ARCADE') {
    if (v === '/' || v === '/Eshan_Portfolio/index.html' || v === '/arcade/index.html') return true;
    const m = /^\/arcade\/projects\/([a-z0-9-]+)\/index\.html$/.exec(v);
    return !!(m && ALLOWED_SLUGS.has(m[1]));
  }
  if (t === 'SECTION') return ALLOWED_SECTIONS.has(v);
  if (t === 'MODAL') return ALLOWED_MODALS.has(v);
  if (t === 'EXT') {
    if (ALLOWED_EXT_EXACT.has(v)) return true;
    return v.startsWith('https://github.com/Falcon0516/');
  }
  return false;
}

function renderInline(text) {
  const parts = [];
  const rx = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m;
  let idx = 0;
  while ((m = rx.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(<strong key={`b${idx++}`} className="guide-bold">{tok.slice(2, -2)}</strong>);
    } else {
      parts.push(<code key={`c${idx++}`} className="guide-code">{tok.slice(1, -1)}</code>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

function parseReply(rawText) {
  const actions = [];
  const seen = new Set();
  const cleanLines = [];

  const lines = String(rawText || '').replace(/\r/g, '').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^\[\[ACTION:([A-Za-z]+)\|([^|\]]+)\|([^\]]+)\]\]$/);
    if (match) {
      const [, type, label, val] = match;
      const t = type.trim().toUpperCase();
      const v = val.trim();
      const key = `${t}:${v}`;
      if (actions.length < 3 && isSafeAction(t, v) && !seen.has(key)) {
        seen.add(key);
        actions.push({ type: t, val: v, label: label.trim().slice(0, 42) });
      }
      continue;
    }
    const scrubbed = line.replace(/\[\[ACTION:([A-Za-z]+)\|([^|\]]+)\|([^\]]+)\]\]/g, (_f, type, label, val) => {
      const t = type.trim().toUpperCase();
      const v = val.trim();
      const key = `${t}:${v}`;
      if (actions.length < 3 && isSafeAction(t, v) && !seen.has(key)) {
        seen.add(key);
        actions.push({ type: t, val: v, label: label.trim().slice(0, 42) });
      }
      return '';
    }).trimEnd();
    if (scrubbed.trim() || cleanLines.length) cleanLines.push(scrubbed);
  }
  while (cleanLines.length && !cleanLines[cleanLines.length - 1].trim()) cleanLines.pop();
  return { text: cleanLines.join('\n'), actions };
}

function FormattedReply({ rawText, onAction }) {
  const { text, actions } = parseReply(rawText);
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }

    if (line.startsWith('```')) {
      const flowLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        if (lines[i].trim()) flowLines.push(lines[i].trim());
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ kind: 'flow', raw: flowLines.join(' → ') });
      continue;
    }

    if ((line.includes('→') || line.includes('->')) && line.split(/→|->/).filter(s => s.trim()).length >= 2) {
      blocks.push({ kind: 'flow', raw: line });
      i++;
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      blocks.push({ kind: 'h', text: line.replace(/^#{1,3}\s+/, '') });
      i++;
      continue;
    }

    blocks.push({ kind: 'p', text: line });
    i++;
  }

  return (
    <div className="guide-rich">
      {blocks.map((blk, idx) => {
        if (blk.kind === 'h') return <div key={idx} className="guide-h">{renderInline(blk.text)}</div>;
        if (blk.kind === 'p') return <p key={idx} className="guide-p">{renderInline(blk.text)}</p>;
        if (blk.kind === 'ul') {
          return (
            <ul key={idx} className="guide-list">
              {blk.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
            </ul>
          );
        }
        if (blk.kind === 'ol') {
          return (
            <ol key={idx} className="guide-list num">
              {blk.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
            </ol>
          );
        }
        if (blk.kind === 'flow') {
          const nodes = blk.raw.split(/→|->/).map(s => s.trim()).filter(Boolean);
          return (
            <div key={idx} className="guide-flow">
              {nodes.map((node, j) => (
                <React.Fragment key={j}>
                  <span className="guide-flow-node">{node}</span>
                  {j < nodes.length - 1 && <span className="guide-flow-arr">→</span>}
                </React.Fragment>
              ))}
            </div>
          );
        }
        return null;
      })}

      {actions.length > 0 && (
        <div className="guide-actions">
          {actions.map((act, idx) => (
            <button
              key={idx}
              type="button"
              className={`guide-act-chip${act.type === 'ARCADE' ? ' arcade' : ''}`}
              onClick={() => onAction && onAction(act.type, act.val)}
            >
              {act.label} ↗
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function localGameFallback(q) {
  const s = q.toLowerCase();
  if (/resume|cv|pdf|hire|download/.test(s)) {
    return "**Eshan H** (B.E. CSE '27, SJBIT, **9.28 CGPA**) · Open the 2-page Resume viewer anytime.\n[[ACTION:MODAL|Preview / Download Resume|resume]]\n[[ACTION:EXT|LinkedIn Profile|https://www.linkedin.com/in/eshan-h]]";
  }
  if (/argus|patent|design|surveillance|police/.test(s)) {
    return "**ARGUS** holds an Indian Design Registration (**No. 515509-001**, Journal **41/2026**).\n```\n6 RTSP Feeds -> YOLOv8n + ByteTrack -> LLaVA -> Officer Dashboard\n```\n[[ACTION:ARCADE|Play ARGUS Showcase|/arcade/projects/argus/index.html]]\n[[ACTION:SECTION|Research & Patent|#research]]";
  }
  if (/saathi|voice|call|kannada|hindi/.test(s)) {
    return "**Saathi** is a multilingual phone voice AI (**English, Hindi, Kannada**), 2nd Place at AIVORA 2026.\n```\nInbound Call -> Speech STT -> LLM Agent -> Regional Voice Reply\n```\n[[ACTION:ARCADE|Play Saathi Showcase|/arcade/projects/saathi/index.html]]\n[[ACTION:EXT|Saathi Live Site|https://saathi-presentation.netlify.app]]";
  }
  if (/verifarm|farm|agri|flutter|play store/.test(s)) {
    return "**VeriFarm** is live on Google Play — edge soil/crop diagnostics with blockchain traceability.\n- Offline-first Flutter app + edge sensors\n- Direct farmer marketplace & verification\n[[ACTION:ARCADE|Play VeriFarm Showcase|/arcade/projects/verifarm/index.html]]\n[[ACTION:EXT|Google Play Store|https://play.google.com/store/apps/details?id=com.verifarm.app]]";
  }
  if (/github|linkedin|contact|email|social/.test(s)) {
    return "Connect with **Eshan H**:\n- GitHub: **github.com/Falcon0516**\n- LinkedIn: **linkedin.com/in/eshan-h**\n[[ACTION:EXT|GitHub Profile|https://github.com/Falcon0516]]\n[[ACTION:EXT|LinkedIn Profile|https://www.linkedin.com/in/eshan-h]]";
  }
  return "**ARGUS AI Guide Online** · Ask me about:\n- **Projects:** ARGUS, Axiom, Saathi, VeriFarm, Kavach\n- **Credentials:** 9.28 CGPA, 15+ Hackathons, Patent 515509-001\n[[ACTION:ARCADE|Open Project Arcade|/arcade/index.html]]\n[[ACTION:MODAL|View Resume|resume]]";
}

export default function GuideBubble({ initialMsg, keepOpen, hidden, onAction }) {
  const [chatMsg, setChatMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = sessionStorage.getItem(MEM_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.slice(-MAX_TURNS) : [];
    } catch {
      return [];
    }
  });
  const [idlePhrase, setIdlePhrase] = useState(IDLE_PHRASES[0]);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const msgsRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(MEM_KEY, JSON.stringify(messages.slice(-MAX_TURNS)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (!keepOpen) return;
    let idx = 0;
    const t = setInterval(() => {
      idx = (idx + 1) % IDLE_PHRASES.length;
      setIdlePhrase(IDLE_PHRASES[idx]);
    }, 4500);
    return () => clearInterval(t);
  }, [keepOpen]);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages, isMinimized, isExpanded]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    try { sessionStorage.removeItem(MEM_KEY); } catch {}
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = chatMsg.trim();
    if (!trimmed || loading) return;

    const prevHistory = messages.slice(-12);
    const nextWithUser = [...messages, { role: 'user', content: trimmed }].slice(-MAX_TURNS);
    setMessages(nextWithUser);
    setChatMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          project: 'Portfolio Game',
          history: prevHistory
        })
      });
      const data = await res.json();
      const replyText = (res.ok && data.reply) ? data.reply : localGameFallback(trimmed);
      setMessages(curr => [...curr, { role: 'assistant', content: replyText }].slice(-MAX_TURNS));
    } catch {
      setMessages(curr => [...curr, { role: 'assistant', content: localGameFallback(trimmed) }].slice(-MAX_TURNS));
    } finally {
      setLoading(false);
    }
  };

  if (hidden || !keepOpen) return null;

  if (isMinimized) {
    return (
      <button
        type="button"
        className="guide-orb"
        onClick={() => setIsMinimized(false)}
        title="Ask ARGUS AI Assistant"
        aria-label="Open ARGUS AI Assistant"
      >
        <span className="guide-orb-icon" aria-hidden="true">🤖</span>
        <span className="guide-orb-tag">ARGUS AI</span>
      </button>
    );
  }

  return (
    <div
      className={`guide-bubble${isExpanded ? ' expanded' : ''}`}
      role="dialog"
      aria-label="ARGUS AI Chat"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="guide-hdr">
        <div className="guide-name">🤖 ARGUS AI · GAME MODE</div>
        <div className="guide-win-acts">
          {messages.length > 0 && (
            <button type="button" className="guide-hdr-btn" onClick={clearHistory} title="Clear conversation memory">
              Clear
            </button>
          )}
          <button
            type="button"
            className="guide-hdr-btn"
            onClick={() => setIsExpanded(v => !v)}
            aria-expanded={isExpanded}
            title={isExpanded ? 'Compact view' : 'Full view'}
          >
            {isExpanded ? '⤡' : '⤢'}
          </button>
          <button
            type="button"
            className="guide-hdr-btn close"
            onClick={() => { setIsMinimized(true); setIsExpanded(false); }}
            title="Minimize chat"
            aria-label="Minimize chat"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="guide-subticker">{idlePhrase}</div>

      <div ref={msgsRef} className="guide-thread">
        {messages.length === 0 ? (
          <div className="guide-msg-card assistant">
            <FormattedReply
              rawText={
                initialMsg
                  ? `**Falcon Hint:** ${initialMsg}\n\nAsk me anything about Eshan's projects, patents, or skills!`
                  : "**ARGUS AI Ready.** Ask about Eshan's 9 projects, **Patent 515509-001**, or request a shortcut below."
              }
              onAction={onAction}
            />
          </div>
        ) : (
          messages.map((m, idx) => (
            <div key={idx} className={`guide-msg-card ${m.role === 'user' ? 'user' : 'assistant'}`}>
              {m.role === 'user' ? (
                <span>{m.content}</span>
              ) : (
                <FormattedReply rawText={m.content} onAction={onAction} />
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="guide-msg-card assistant typing">Thinking with context...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="guide-form">
        <input
          type="text"
          value={chatMsg}
          onChange={(e) => setChatMsg(e.target.value)}
          placeholder="Ask ARGUS about Eshan..."
          className="guide-input"
          disabled={loading}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
        />
        <button type="submit" disabled={loading} className="guide-send">
          {loading ? '...' : 'SEND'}
        </button>
      </form>
    </div>
  );
}
