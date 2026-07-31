"use client";
import { useEffect, useState } from "react";

const FACES = ["front", "back", "right", "left", "top", "bottom"];

/**
 * CSS-3D crate that flies up, spins, and cracks open.
 * Used for common/epic/rare reveals. Crystal entries use CrystalShatterReveal instead.
 * 
 * Props:
 *   accent       - zone accent color (hex)
 *   anchor       - {x, y} screen coords to anchor the crate, or null for center
 *   onDone       - callback when the crate animation finishes
 *   reducedMotion - if true, skip animation entirely and call onDone immediately
 */
export default function CrateReveal({ accent = "#00ffff", anchor, onDone, reducedMotion }) {
  const [cracking, setCracking] = useState(false);

  useEffect(() => {
    if (reducedMotion) { onDone?.(); return; } // skip straight to card
    const t1 = setTimeout(() => setCracking(true), 620);
    const t2 = setTimeout(() => onDone?.(), 1080);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone, reducedMotion]);

  const stageStyle = anchor
    ? { justifyContent: "flex-start", alignItems: "flex-start" }
    : {};
  const boxStyle = anchor
    ? { position: "absolute", left: anchor.x - 42, top: anchor.y - 42 }
    : {};

  return (
    <div className="crate-reveal-stage" style={stageStyle}>
      <div className={`crate ${cracking ? "cracking" : ""}`}
           style={{ "--zone-accent": accent, ...boxStyle }}>
        {FACES.map(f => (
          <div key={f} className={`crate-face ${f}`}>{f === "front" ? "?" : ""}</div>
        ))}
      </div>
    </div>
  );
}
