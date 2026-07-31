import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemoryLattice } from "./useMemoryLattice";

export default function MemoryLattice2D({ content, onComplete, onSkip }) {
  const { tiles, flipped, matched, flip, solved } = useMemoryLattice(content);
  const [timeLeft, setTimeLeft] = useState(20);
  
  useEffect(() => {
    if (solved) return;
    if (timeLeft <= 0) {
      onSkip();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [solved, timeLeft, onSkip]);

  useEffect(() => {
    if (solved) {
      setTimeout(() => onComplete(200 + timeLeft * 10), 1000);
    }
  }, [solved, onComplete, timeLeft]);

  return (
    <div className="minigame-overlay">
      <motion.div 
        className="minigame-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        style={{ maxWidth: '400px' }}
      >
        <div className="minigame-header">
          <h3>MEMORY LATTICE</h3>
          <div className="minigame-timer">00:{timeLeft.toString().padStart(2, '0')}</div>
        </div>
        
        <p className="minigame-desc">Match the tech stack pairs to unlock.</p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginTop: '20px',
          perspective: '1000px'
        }}>
          {tiles.map((tile, i) => {
            const isFlipped = flipped.includes(i) || matched.includes(tile.pairId);
            return (
              <div 
                key={tile.id}
                onClick={() => flip(i)}
                style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  cursor: isFlipped ? 'default' : 'pointer'
                }}
              >
                {/* Front (Face Down) */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                  border: '1px solid rgba(0, 255, 255, 0.2)',
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(0, 255, 255, 0.5)',
                  fontSize: '24px'
                }}>?</div>
                
                {/* Back (Face Up) */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  background: matched.includes(tile.pairId) ? 'linear-gradient(135deg, #00ff8822, #00ff8811)' : 'linear-gradient(135deg, #2a2a4e, #26315e)',
                  border: `1px solid ${matched.includes(tile.pairId) ? '#00ff88' : '#00ffff'}`,
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px',
                  transform: 'rotateY(180deg)'
                }}>{tile.icon}</div>
              </div>
            );
          })}
        </div>

        {solved && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="minigame-success-banner"
            style={{ marginTop: '20px', color: '#00ff88', fontWeight: 'bold', textAlign: 'center' }}
          >
            LATTICE SYNCHRONIZED
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
