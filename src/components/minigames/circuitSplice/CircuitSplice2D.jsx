import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCircuitPuzzle } from "./useCircuitPuzzle";
import { spawnCircuitBurst } from "../../game/aura/AuraSystem";

export default function CircuitSplice2D({ content, onComplete, onSkip }) {
  const { pins, connections, connect, solved } = useCircuitPuzzle(content);
  
  const containerRef = useRef(null);
  const [activeDrag, setActiveDrag] = useState(null); // { outputId, x, y }
  const [pinCoords, setPinCoords] = useState({ outputs: {}, inputs: {} });

  const [timeLeft, setTimeLeft] = useState(15);
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillCounter, setAutoFillCounter] = useState(3);
  const [showAutoFill, setShowAutoFill] = useState(false);
  
  useEffect(() => {
    const showTimer = setTimeout(() => setShowAutoFill(true), 3000);
    return () => clearTimeout(showTimer);
  }, []);
  
  useEffect(() => {
    if (solved || autoFilling) return;
    if (timeLeft <= 0) {
      onSkip();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [solved, timeLeft, onSkip, autoFilling]);

  const handleAutoFill = useCallback(() => {
    setAutoFilling(true);
    let count = 2;
    setAutoFillCounter(count);
    const interval = setInterval(() => {
      count--;
      setAutoFillCounter(count);
      if (count <= 0) {
        clearInterval(interval);
        // Connect all outputs to their matching inputs
        pins.outputs.forEach(o => connect(o, o));
      }
    }, 1000);
  }, [pins.outputs, connect]);

  // Auto-fill automatically without user interaction
  useEffect(() => {
    const autoTimer = setTimeout(() => {
      if (!solved && !autoFilling) handleAutoFill();
    }, 1000);
    return () => clearTimeout(autoTimer);
  }, [solved, autoFilling, handleAutoFill]);

  // Update pin coordinates for drawing lines
  useEffect(() => {
    const updateCoords = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newCoords = { outputs: {}, inputs: {} };
      
      const outEls = containerRef.current.querySelectorAll('.pin-output');
      outEls.forEach(el => {
        const r = el.getBoundingClientRect();
        newCoords.outputs[el.dataset.id] = { x: r.left - rect.left + r.width/2, y: r.top - rect.top + r.height/2 };
      });
      
      const inEls = containerRef.current.querySelectorAll('.pin-input');
      inEls.forEach(el => {
        const r = el.getBoundingClientRect();
        newCoords.inputs[el.dataset.id] = { x: r.left - rect.left + r.width/2, y: r.top - rect.top + r.height/2 };
      });
      
      setPinCoords(newCoords);
    };
    
    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [pins]);

  useEffect(() => {
    if (solved) {
      // Fire sparks
      for(let i = 0; i < 5; i++) {
         setTimeout(() => {
             // In a real app we'd trigger an SFX or visual burst here.
             // We'll reuse the score popup pattern for completion
         }, i * 100);
      }
      setTimeout(() => onComplete(150 + timeLeft * 10), 1000);
    }
  }, [solved, onComplete, timeLeft]);

  const handlePointerDown = (e, outputId) => {
    e.preventDefault();
    if (connections[outputId] === outputId) return; // Already correctly solved
    
    const rect = containerRef.current.getBoundingClientRect();
    setActiveDrag({
      outputId,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handlePointerMove = (e) => {
    if (!activeDrag) return;
    const rect = containerRef.current.getBoundingClientRect();
    setActiveDrag(prev => ({
      ...prev,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }));
  };

  const handlePointerUp = (e) => {
    if (!activeDrag) return;
    
    // Find what we dropped on
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.classList.contains('pin-input')) {
      const inputId = el.dataset.id;
      if (inputId === activeDrag.outputId) {
        connect(activeDrag.outputId, inputId);
        // Play success sound if needed
      }
    }
    
    setActiveDrag(null);
  };

  return (
    <div className="minigame-overlay">
      <motion.div 
        className="minigame-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <div className="minigame-header">
          <h3>CIRCUIT SPLICE</h3>
          <div className="minigame-timer">00:{timeLeft.toString().padStart(2, '0')}</div>
        </div>
        
        <p className="minigame-desc">Drag outputs (left) to their matching inputs (right) to decrypt.</p>

        <div 
          ref={containerRef}
          className="circuit-board"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ position: 'relative', width: '100%', height: '250px', marginTop: '20px', touchAction: 'none' }}
        >
          {/* SVG for Lines */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            {/* Draw established connections */}
            {pins.outputs.map(outId => {
               const inId = connections[outId];
               if (!inId || !pinCoords.outputs[outId] || !pinCoords.inputs[inId]) return null;
               
               const p1 = pinCoords.outputs[outId];
               const p2 = pinCoords.inputs[inId];
               return (
                 <line 
                   key={`conn-${outId}`}
                   x1={p1.x} y1={p1.y} 
                   x2={p2.x} y2={p2.y} 
                   stroke="#00ff88" 
                   strokeWidth="3"
                   strokeDasharray="5,5"
                 />
               );
            })}
            
            {/* Draw active drag line */}
            {activeDrag && pinCoords.outputs[activeDrag.outputId] && (
              <line 
                x1={pinCoords.outputs[activeDrag.outputId].x} 
                y1={pinCoords.outputs[activeDrag.outputId].y} 
                x2={activeDrag.x} 
                y2={activeDrag.y} 
                stroke="#00ffff" 
                strokeWidth="2"
              />
            )}
          </svg>

          {/* Left Pins (Outputs) */}
          <div style={{ position: 'absolute', left: '10%', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', zIndex: 2 }}>
            {pins.outputs.map((label, i) => {
              const isSolved = connections[label] === label;
              return (
                <div 
                  key={`out-${i}`} 
                  className={`circuit-pin pin-output ${isSolved ? 'solved' : ''}`}
                  data-id={label}
                  onPointerDown={(e) => handlePointerDown(e, label)}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: isSolved ? '#00ff88' : '#222',
                    border: `2px solid ${isSolved ? '#00ff88' : '#00ffff'}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: isSolved ? 'default' : 'grab', color: isSolved ? '#000' : '#fff', userSelect: 'none'
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* Right Pins (Inputs) */}
          <div style={{ position: 'absolute', right: '10%', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', zIndex: 2 }}>
            {pins.inputs.map((label, i) => {
              const isSolved = Object.values(connections).includes(label);
              return (
                <div 
                  key={`in-${i}`} 
                  className={`circuit-pin pin-input ${isSolved ? 'solved' : ''}`}
                  data-id={label}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: isSolved ? '#00ff88' : '#222',
                    border: `2px solid ${isSolved ? '#00ff88' : '#00ffff'}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isSolved ? '#000' : '#fff', userSelect: 'none'
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {solved && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="minigame-success-banner"
            style={{ marginTop: '20px', color: '#00ff88', fontWeight: 'bold', textAlign: 'center' }}
          >
            CIRCUIT SECURED. DECRYPTING...
          </motion.div>
        )}
        
        {autoFilling && !solved && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ marginTop: '20px', color: '#00ffff', fontWeight: 'bold', textAlign: 'center' }}
          >
            AUTO FILLING IN {autoFillCounter}...
          </motion.div>
        )}
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px', alignItems: 'center' }}>
          <button className="minigame-skip" onClick={onSkip}>ESC to skip</button>
          {!solved && !autoFilling && showAutoFill && (
            <button 
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 50,
                background: 'transparent',
                border: '1px solid #00ffff',
                color: '#00ffff',
                padding: '4px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: '"Share Tech Mono", monospace',
              }} 
              onClick={handleAutoFill}
            >
              Auto Fill
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
