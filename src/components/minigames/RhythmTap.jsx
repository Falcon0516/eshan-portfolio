"use client";
import { useEffect, useRef, useState } from "react";

export default function RhythmTap({ content, onComplete, onSkip }) {
  const [pos, setPos] = useState(0);
  const [result, setResult] = useState(null);
  const posRef = useRef(0);
  const dirRef = useRef(1);
  const doneRef = useRef(false);
  const rafRef = useRef(null);

  useEffect(() => {
    let last = performance.now();
    function tick(now) {
      const dt = Math.min((now - last) / 16.67, 3); last = now;
      if (!doneRef.current) {
        posRef.current += dirRef.current * 2.6 * dt;
        if (posRef.current >= 100) { posRef.current = 100; dirRef.current = -1; }
        if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1; }
        setPos(posRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    const hardStop = setTimeout(() => { if (!doneRef.current) finish(false); }, 3600);

    function finish(hit) {
      if (doneRef.current) return;
      doneRef.current = true;
      const inZone = posRef.current >= 40 && posRef.current <= 60;
      setResult(hit && inZone ? "hit" : "miss");
      setTimeout(() => onComplete(hit && inZone ? 200 : 0), 500);
    }

    const onKey = (e) => {
      if (e.code === "Escape") { doneRef.current = true; onSkip(); }
      else if (e.code === "Space") { e.preventDefault(); finish(true); }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(hardStop);
      window.removeEventListener("keydown", onKey);
    };
  }, [onComplete, onSkip]);

  return (
    <div className="minigame-overlay" onClick={onSkip}>
      <div className="minigame-box rhythm-box" onClick={(e) => e.stopPropagation()}>
        <div className="minigame-tag">🏆 PODIUM REACTION</div>
        <div className="rhythm-track">
          <div className="rhythm-zone" />
          <div className="rhythm-marker" style={{ left: `${pos}%` }} />
          <div className="rhythm-trophy">🏆</div>
        </div>
        <div className="rhythm-hint">{result ? (result === "hit" ? "✓ NAILED IT +200" : "→ almost...") : "Press SPACE when it lines up!"}</div>
        <button className="minigame-skip" onClick={onSkip}>ESC to skip</button>
      </div>
    </div>
  );
}
