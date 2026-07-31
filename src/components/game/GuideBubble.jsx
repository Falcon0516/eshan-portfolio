import React, { useState, useRef, useEffect, useCallback } from 'react';

const IDLE_PHRASES = [
  "💬 Got questions? Ask away!",
  "🤖 Your personal AI guide here...",
  "⚡ Try: \"What's his best project?\"",
  "🎯 Ask me about Eshan's skills!",
  "🏆 Curious about hackathon wins?",
  "💡 Tip: Ask about certifications!",
  "👋 Hey recruiter! I know everything.",
  "🔍 \"What tech does he use?\"",
  "📊 I have stats on everything...",
  "🚀 Ask me anything about Eshan!",
];

const DOODLES = [
  "scanning databanks... 🔎",
  "optimizing neural pathways... 🧠",
  "calibrating sensors... ⚙️",
  "browsing Eshan's portfolio... 📂",
  "analyzing skill matrices... 📊",
  "indexing hackathon records... 🏆",
  "compiling achievements... ✨",
  "loading project data... 💾",
  "running diagnostics... 🔧",
  "syncing with mainframe... 📡",
];

export default function GuideBubble({ initialMsg, x, y, keepOpen, hidden }) {
  const [chatMsg, setChatMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayMsg, setDisplayMsg] = useState(initialMsg);
  const [idlePhrase, setIdlePhrase] = useState(IDLE_PHRASES[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasCustomPos, setHasCustomPos] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [doodleText, setDoodleText] = useState(null);

  // welcomePhase: 'waiting' → 'greeting' → 'done'
  const [welcomePhase, setWelcomePhase] = useState('waiting');

  const dragOffset = useRef({ x: 0, y: 0 });
  const bubbleRef = useRef(null);
  const idleTimer = useRef(null);
  const doodleTimer = useRef(null);
  const isUserResponse = useRef(false);

  // ── Welcome sequence: wait → centered greeting → auto-dismiss ──
  useEffect(() => {
    if (!keepOpen || welcomePhase !== 'waiting') return;

    // Show greeting after a brief delay
    const t1 = setTimeout(() => setWelcomePhase('greeting'), 1200);

    // Auto-dismiss after 8.2s total (1.2s delay + 7s display)
    const t2 = setTimeout(() => {
      setWelcomePhase('done');
      setIsMinimized(true);
    }, 8200);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [keepOpen, welcomePhase]);

  // Sync displayMsg when scripted guide messages come in
  // Block during welcome greeting phase
  useEffect(() => {
    if (initialMsg && !isUserResponse.current && welcomePhase === 'done') {
      setDisplayMsg(initialMsg);
    }
  }, [initialMsg, welcomePhase]);

  // Cycle idle phrases every 4 seconds
  useEffect(() => {
    if (!keepOpen) return;
    let idx = 0;
    idleTimer.current = setInterval(() => {
      idx = (idx + 1) % IDLE_PHRASES.length;
      setIdlePhrase(IDLE_PHRASES[idx]);
    }, 4000);
    return () => clearInterval(idleTimer.current);
  }, [keepOpen]);

  // Random doodle every 12-20 seconds
  useEffect(() => {
    if (!keepOpen) return;
    const scheduleDoodle = () => {
      const delay = 12000 + Math.random() * 8000;
      doodleTimer.current = setTimeout(() => {
        if (!isUserResponse.current) {
          const d = DOODLES[Math.floor(Math.random() * DOODLES.length)];
          setDoodleText(d);
          setTimeout(() => setDoodleText(null), 3000);
        }
        scheduleDoodle();
      }, delay);
    };
    scheduleDoodle();
    return () => clearTimeout(doodleTimer.current);
  }, [keepOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim() || loading) return;

    isUserResponse.current = true;
    setDisplayMsg("Processing query...");
    setLoading(true);
    setDoodleText(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMsg })
      });
      const data = await res.json();
      setDisplayMsg(data.reply || "Error parsing response.");
    } catch (err) {
      setDisplayMsg("Connection to mainframe failed.");
    } finally {
      setLoading(false);
      setChatMsg('');
      setTimeout(() => { isUserResponse.current = false; }, 15000);
    }
  };

  // ── Drag logic ──
  const onPointerDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    setHasCustomPos(true);
  }, [isDragging]);

  const onPointerUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDragging, onPointerMove, onPointerUp]);

  // ── Render nothing when hidden or before game starts ──
  if (hidden) return null;
  if (!keepOpen && !displayMsg) return null;
  if (welcomePhase === 'waiting') return null;

  // ══════════════════════════════════════════════════════
  // PHASE: GREETING — centered overlay introducing ARGUS
  // ══════════════════════════════════════════════════════
  if (welcomePhase === 'greeting') {
    const dismissGreeting = () => {
      setWelcomePhase('done');
      setIsMinimized(true);
    };

    return (
      <div
        onClick={dismissGreeting}
        style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, pointerEvents: 'auto',
          background: 'rgba(0,0,0,0.55)',
          animation: 'fadeInUp 0.4s ease',
        }}
      >
        <div
          className="guide-bubble"
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            display: 'flex', flexDirection: 'column', gap: '8px',
            maxWidth: '300px', minWidth: '240px',
            animation: 'bubble-in 0.4s ease',
            textAlign: 'center',
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '36px' }}>🤖</div>
          <div className="guide-name" style={{ margin: 0, textAlign: 'center', fontSize: '9px' }}>
            ARGUS — AI GUIDE
          </div>
          <div className="guide-msg" style={{ fontSize: '12px', lineHeight: '1.5', color: '#00ffff' }}>
            Hey! I&apos;m <strong>ARGUS</strong>. Whenever you need help or want to know about Eshan, just tap my icon in the corner!
          </div>

          <div style={{ 
            marginTop: '10px', 
            fontSize: '10px', 
            color: '#aaa', 
            background: 'rgba(0,0,0,0.5)', 
            padding: '8px', 
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ marginBottom: '4px', color: '#fff' }}>📱 Mobile Experience:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ color: '#00ff88' }}>✅ Portrait</span>
              <span style={{ color: '#ff0055' }}>❌ Landscape</span>
            </div>
          </div>
          <button
            onClick={dismissGreeting}
            style={{
              marginTop: '2px', padding: '8px 20px',
              background: 'cyan', color: '#000',
              border: 'none', borderRadius: '6px',
              fontSize: '11px', fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: '"Share Tech Mono", monospace',
              letterSpacing: '1px',
            }}
          >
            GOT IT!
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // Normal: minimized orb (top-right corner)
  // ══════════════════════════════════════════════════════
  if (isMinimized) {
    return (
      <div
        ref={bubbleRef}
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed', top: 44, right: 12,
          pointerEvents: 'auto', zIndex: 200, cursor: 'pointer',
          background: 'rgba(0,10,20,0.85)',
          border: '1px solid cyan', borderRadius: '50%',
          width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
          boxShadow: '0 0 12px rgba(0,255,255,0.4)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
        title="Ask ARGUS"
      >
        🤖
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // Normal: expanded chat panel
  // ══════════════════════════════════════════════════════
  const bubbleStyle = hasCustomPos
    ? { left: position.x, top: position.y, position: 'fixed' }
    : { left: 12, top: 50, position: 'fixed' };

  return (
    <div
      ref={bubbleRef}
      onPointerDown={onPointerDown}
      className="guide-bubble"
      style={{
        ...bubbleStyle,
        pointerEvents: 'auto',
        display: 'flex', flexDirection: 'column', gap: '4px',
        zIndex: 200,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none', userSelect: 'none',
      }}
    >
      {/* Idle phrase ticker */}
      <div style={{
        fontSize: '9px', color: '#00ffff88', textAlign: 'center',
        fontFamily: '"Share Tech Mono", monospace',
        letterSpacing: '0.5px', animation: 'fadeInUp 0.5s ease', minHeight: '12px',
      }}>
        {idlePhrase}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="guide-name" style={{ margin: 0, fontSize: '7px' }}>🤖 ARGUS</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setHasCustomPos(false); }}
            title="Reset position"
            style={{ background: 'none', border: '1px solid #00ffff44', color: 'cyan', fontSize: '9px', cursor: 'pointer', borderRadius: '3px', padding: '1px 4px', lineHeight: 1 }}
          >
            ⟲
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
            title="Minimize"
            style={{ background: 'none', border: '1px solid #00ffff44', color: 'cyan', fontSize: '9px', cursor: 'pointer', borderRadius: '3px', padding: '1px 4px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Doodle or message */}
      <div className="guide-msg" style={{ fontSize: '11px', lineHeight: '1.3', maxHeight: '80px', overflowY: 'auto' }}>
        {doodleText && !loading ? (
          <span style={{ color: '#00ffff66', fontStyle: 'italic' }}>{doodleText}</span>
        ) : (
          displayMsg || "Systems online. How can I help?"
        )}
      </div>

      {/* Chat input */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '3px' }}>
        <input
          type="text"
          value={chatMsg}
          onChange={(e) => setChatMsg(e.target.value)}
          placeholder="Ask me anything..."
          style={{
            flex: 1, background: 'rgba(0,0,0,0.6)',
            border: '1px solid #00ffff55', color: 'cyan',
            padding: '4px 6px', fontSize: '11px', borderRadius: '4px',
            outline: 'none', fontFamily: '"Share Tech Mono", monospace',
          }}
          disabled={loading}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#00666699' : 'cyan', color: 'black',
            border: 'none', padding: '4px 8px', fontSize: '10px',
            cursor: loading ? 'not-allowed' : 'pointer', borderRadius: '4px',
            fontWeight: 'bold', fontFamily: '"Share Tech Mono", monospace',
            letterSpacing: '1px',
          }}
        >
          {loading ? '...' : 'SEND'}
        </button>
      </form>
    </div>
  );
}
