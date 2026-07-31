import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function SignalLock({ content, onComplete, onSkip }) {
  const TARGET_RADIUS = 40;
  const OUTER_RADIUS = 160;
  const HIT_TOLERANCE = 12;
  const RING_COUNT = 3;

  const [ringRadii, setRingRadii] = useState([OUTER_RADIUS, OUTER_RADIUS, OUTER_RADIUS]);
  const [statuses, setStatuses] = useState(["pending", "pending", "pending"]); // "pending", "hit", "miss"
  const [combo, setCombo] = useState(0);
  
  const rafRef = useRef(null);
  const startRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const doneRef = useRef(false);
  const activeRingRef = useRef(0);
  const statusesRef = useRef(["pending", "pending", "pending"]);
  const radiiRef = useRef([OUTER_RADIUS, OUTER_RADIUS, OUTER_RADIUS]);

  useEffect(() => {
    startRef.current = performance.now();
    
    function tick(now) {
      if (doneRef.current) return;
      const elapsedMs = now - startRef.current;
      
      const newRadii = [...radiiRef.current];
      let allDone = true;
      
      for (let i = 0; i < RING_COUNT; i++) {
        const ringElapsed = elapsedMs - i * 1000; // Stagger by 1s
        if (ringElapsed > 0 && statusesRef.current[i] === "pending") {
          // Shrink over 2000ms
          const r = Math.max(0, OUTER_RADIUS * (1 - ringElapsed / 2000));
          newRadii[i] = r;
          allDone = false;
          
          if (r === 0) {
            statusesRef.current[i] = "miss";
            if (activeRingRef.current === i) activeRingRef.current = i + 1;
            setStatuses([...statusesRef.current]);
            setCombo(0);
          }
        } else if (statusesRef.current[i] === "pending") {
          newRadii[i] = OUTER_RADIUS;
          allDone = false;
        } else {
          // Keep it at target radius if hit, or 0 if miss
          newRadii[i] = statusesRef.current[i] === "hit" ? TARGET_RADIUS : 0;
        }
      }
      
      radiiRef.current = newRadii;
      setRingRadii(newRadii);
      
      if (allDone) {
        finish();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    
    rafRef.current = requestAnimationFrame(tick);
    
    function finish() {
      if (doneRef.current) return;
      doneRef.current = true;
      const hits = statusesRef.current.filter(s => s === "hit").length;
      const score = hits * 100 * (hits === 3 ? 1.5 : 1);
      setTimeout(() => onComplete(score), 1000);
    }
    
    const onKey = (e) => {
      if (e.code === "Escape") { doneRef.current = true; onSkip(); }
      else if (e.code === "Space") { e.preventDefault(); tryHit(); }
    };
    
    window.addEventListener("keydown", onKey);
    
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKey);
    };
  }, [onComplete, onSkip]);

  const tryHit = () => {
    if (doneRef.current) return;
    const activeIdx = activeRingRef.current;
    if (activeIdx >= RING_COUNT) return;
    
    const r = radiiRef.current[activeIdx];
    // If ring hasn't started shrinking yet, it's an early miss
    if (r === OUTER_RADIUS) {
      statusesRef.current[activeIdx] = "miss";
      setStatuses([...statusesRef.current]);
      setCombo(0);
      activeRingRef.current = activeIdx + 1;
      return;
    }

    const inWindow = Math.abs(r - TARGET_RADIUS) < HIT_TOLERANCE;
    
    if (inWindow) {
      statusesRef.current[activeIdx] = "hit";
      setStatuses([...statusesRef.current]);
      setCombo(c => c + 1);
    } else {
      statusesRef.current[activeIdx] = "miss";
      setStatuses([...statusesRef.current]);
      setCombo(0);
    }
    activeRingRef.current = activeIdx + 1;
  };

  return (
    <div className="minigame-overlay" onPointerDown={tryHit}>
      <motion.div 
        className="minigame-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        style={{ maxWidth: '400px', cursor: 'crosshair', userSelect: 'none' }}
      >
        <div className="minigame-header">
          <h3>SIGNAL LOCK</h3>
          <div className="minigame-timer">COMBO x{combo}</div>
        </div>
        
        <p className="minigame-desc">Tap or press SPACE when rings hit the center target.</p>

        <div style={{ position: 'relative', width: '100%', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <radialGradient id="targetGrad" cx="50%" cy="50%" r="50%">
                <stop offset="80%" stopColor="#00ffff" stopOpacity="0" />
                <stop offset="100%" stopColor="#00ffff" stopOpacity="0.5" />
              </radialGradient>
            </defs>
            
            {/* Target Band */}
            <circle cx="50%" cy="50%" r={TARGET_RADIUS} fill="url(#targetGrad)" stroke="#00ffff" strokeWidth="2" strokeDasharray="4 4" />
            
            {/* Center Core */}
            <circle cx="50%" cy="50%" r="10" fill="#00ffff" />

            {/* Shrinking Rings */}
            {[0, 1, 2].map((i) => {
              const r = ringRadii[i];
              if (r === OUTER_RADIUS || r === 0) return null; // Not active or missed entirely
              
              const status = statuses[i];
              let strokeColor = "#fff";
              if (status === "hit") strokeColor = "#00ff88";
              else if (status === "miss") strokeColor = "#ff0066";

              return (
                <circle 
                  key={i} 
                  cx="50%" cy="50%" 
                  r={r} 
                  fill="none" 
                  stroke={strokeColor} 
                  strokeWidth={status === "hit" ? "4" : "2"}
                  opacity={status === "hit" ? 0.8 : 1}
                />
              );
            })}
          </svg>

          {/* Feedback Text */}
          <div style={{ position: 'absolute', bottom: '20px', width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
            {statuses.includes("hit") && doneRef.current && <span style={{ color: '#00ff88' }}>SIGNAL ACQUIRED</span>}
            {statuses.every(s => s === "miss") && doneRef.current && <span style={{ color: '#ff0066' }}>SIGNAL LOST</span>}
          </div>
        </div>
        
        <button className="minigame-skip" onClick={(e) => { e.stopPropagation(); onSkip(); }} style={{ marginTop: '10px' }}>ESC to skip</button>
      </motion.div>
    </div>
  );
}
