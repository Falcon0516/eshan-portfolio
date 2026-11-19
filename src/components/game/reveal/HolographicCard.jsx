"use client";
import React from "react";
import { motion } from "framer-motion";
import { useCardTilt } from "../../../hooks/useCardTilt";
import { deriveRarity } from "../../../lib/rarity";
import MagicalPortal from "../MagicalPortal";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? null : this.props.children; }
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

/**
 * Holographic card component — replaces the flat .content-card.
 * Features:
 *   - Rarity-driven border glow and holo sheen intensity
 *   - Pointer-tilt for mouse users (disabled on touch)
 *   - Staggered entrance animation for child elements
 *   - Spring-based pop-in with blur dissolve
 *
 * Children should be the existing card content JSX — badge, title, stats, etc.
 * Each direct child gets wrapped in a motion.div for the staggered reveal.
 */
export default function HolographicCard({ content, contentKey, accent, onClose, children }) {
  const rarity = deriveRarity(content || {});
  const isTouch = typeof window !== "undefined" && "ontouchstart" in window;
  const tilt = useCardTilt();
  const cardId = contentKey || content?.title || "__card";
  const [expandedCardId, setExpandedCardId] = React.useState(null);
  const expanded = expandedCardId === cardId;

  return (
    <motion.div
      className={`holo-card${expanded ? " expanded" : ""}`}
      data-rarity={rarity}
      style={{ "--zone-accent": accent, ...(isTouch || expanded ? {} : tilt.style) }}
      ref={isTouch || expanded ? undefined : tilt.ref}
      onMouseMove={isTouch || expanded ? undefined : tilt.onMouseMove}
      onMouseLeave={isTouch || expanded ? undefined : tilt.onMouseLeave}
      onClick={e => e.stopPropagation()}
      initial={{ opacity: 0, scale: 0.3, filter: "blur(20px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 180, damping: 20 }}
    >
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <ErrorBoundary><MagicalPortal cardKey={contentKey} /></ErrorBoundary>
      </div>
      <div className="holo-win-bar">
        <span className="holo-win-label">{expanded ? "FULL VIEW" : "PROJECT / MILESTONE"}</span>
        <div className="holo-win-acts">
          <button
            type="button"
            className="holo-win-btn"
            onClick={() => setExpandedCardId(v => (v === cardId ? null : cardId))}
            aria-expanded={expanded}
          >
            {expanded ? "⤡ COMPACT" : "⤢ FULL VIEW"}
          </button>
          <button
            type="button"
            className="holo-win-btn close"
            onClick={onClose}
            aria-label="Close card"
          >
            ✕ CLOSE
          </button>
        </div>
      </div>
      <motion.div variants={container} initial="hidden" animate="show" className="holo-card-inner">
        {children}
      </motion.div>
      <div className="scroll-hint-indicator">
        <span>▼</span>
      </div>
    </motion.div>
  );
}
