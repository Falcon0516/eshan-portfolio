"use client";
import { useEffect, useRef, useState } from "react";

const SCRAMBLE_CHARS = "!@#$%&*<>/\\{}[]01";

export default function DecryptPuzzle({ content, onComplete, onSkip }) {
  const target = (content.subtitle || content.title || "MODULE").toUpperCase();
  const [display, setDisplay] = useState(target);
  const doneRef = useRef(false);
  const revealedRef = useRef(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 26; // fast, under ~1.6s of scrambling
    const iv = setInterval(() => {
      frame++;
      revealedRef.current = Math.min(target.length, Math.floor((frame / totalFrames) * target.length));
      const chars = target.split("").map((ch, i) => {
        if (ch === " ") return " ";
        if (i < revealedRef.current) return ch;
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      });
      setDisplay(chars.join(""));
      if (frame >= totalFrames) {
        clearInterval(iv);
        setDisplay(target);
        if (!doneRef.current) {
          doneRef.current = true;
          setTimeout(() => onComplete(150), 400);
        }
      }
    }, 45);

    const hardStop = setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onSkip(); } }, 4800);
    const speedUp = () => { revealedRef.current = target.length; };
    const onKey = (e) => { if (e.code === "Escape") { doneRef.current = true; onSkip(); } else speedUp(); };
    window.addEventListener("keydown", onKey);

    return () => { clearInterval(iv); clearTimeout(hardStop); window.removeEventListener("keydown", onKey); };
  }, [target, onComplete, onSkip]);

  return (
    <div className="minigame-overlay" onClick={onSkip}>
      <div className="minigame-box decrypt-box" onClick={(e) => e.stopPropagation()}>
        <div className="minigame-tag">🔓 DECRYPTING MODULE</div>
        <div className="decrypt-terminal">
          <span className="decrypt-prompt">$ decrypt --module</span>
          <div className="decrypt-line">{display}</div>
        </div>
        <button className="minigame-skip" onClick={onSkip}>ESC to skip</button>
      </div>
    </div>
  );
}
