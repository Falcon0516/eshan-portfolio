"use client";
import { useRef, useCallback, useState } from "react";

/**
 * Pointer-tilt hook for holographic card effect.
 * Tracks mouse position over the card and generates CSS transform + CSS custom properties
 * for the holographic sheen overlay.
 * On touch devices, tilt is disabled (no hover) — only the static entrance plays.
 */
export function useCardTilt({ max = 14, scale = 1.03 } = {}) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  const onMouseMove = useCallback((e) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * max * 2;
    const rotateX = (0.5 - py) * max * 2;
    setStyle({
      transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
      "--sheen-x": `${px * 100}%`, "--sheen-y": `${py * 100}%`,
    });
  }, [max, scale]);

  const onMouseLeave = useCallback(() => {
    setStyle({
      transform: "perspective(900px) rotateX(0) rotateY(0) scale(1)",
      "--sheen-x": "50%", "--sheen-y": "50%",
    });
  }, []);

  return { ref, style, onMouseMove, onMouseLeave };
}
