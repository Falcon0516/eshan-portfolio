import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

export default function TerminalBreach({ content, onComplete, onSkip }) {
  const defaultSnippet = {
    template: "const res = await ___.chat.completions.___({",
    blanks: ["groq", "create"],
    bank: ["groq", "create", "fetch", "axios", "then"]
  };
  
  const snippet = content?.codeSnippet || defaultSnippet;
  
  // filled[i] = null or string
  const [filled, setFilled] = useState(new Array(snippet.blanks.length).fill(null));
  
  // Create bank items with unique IDs so duplicates (if any) don't bug out
  const [bank, setBank] = useState(() => {
    return [...snippet.bank]
      .sort(() => Math.random() - 0.5)
      .map((text, id) => ({ id, text, used: false }));
  });
  
  const [timeLeft, setTimeLeft] = useState(25);
  const [solved, setSolved] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillCounter, setAutoFillCounter] = useState(3);
  const [showAutoFill, setShowAutoFill] = useState(true);

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
        const newFilled = snippet.blanks.map((text, i) => ({ id: 100+i, text, used: true }));
        setFilled(newFilled);
      }
    }, 1000);
  }, [snippet]);

  // Auto-fill automatically without user interaction
  useEffect(() => {
    const autoTimer = setTimeout(() => {
      if (!solved && !autoFilling) handleAutoFill();
    }, 1000);
    return () => clearTimeout(autoTimer);
  }, [solved, autoFilling, handleAutoFill]);

  const handleBankClick = (bankItem) => {
    if (solved) return;
    if (bankItem.used) return;
    
    // Find first empty slot
    const emptyIdx = filled.findIndex(v => v === null);
    if (emptyIdx === -1) return; // Full
    
    const newFilled = [...filled];
    newFilled[emptyIdx] = bankItem;
    setFilled(newFilled);
    
    setBank(prev => prev.map(b => b.id === bankItem.id ? { ...b, used: true } : b));
  };

  const handleSlotClick = (idx) => {
    if (solved) return;
    const item = filled[idx];
    if (!item) return;
    
    const newFilled = [...filled];
    newFilled[idx] = null;
    setFilled(newFilled);
    
    setBank(prev => prev.map(b => b.id === item.id ? { ...b, used: false } : b));
  };

  useEffect(() => {
    // Check if full
    if (filled.every(v => v !== null)) {
      const isCorrect = filled.every((v, i) => v.text === snippet.blanks[i]);
      if (isCorrect) {
        setSolved(true);
        setTimeout(() => onComplete(200 + timeLeft * 10), 1500);
      } else {
        // Flash red and clear? Or leave it to user to manually clear?
        // Let's flash and clear
        setTimeout(() => {
          setFilled(new Array(snippet.blanks.length).fill(null));
          setBank(prev => prev.map(b => ({ ...b, used: false })));
        }, 500);
      }
    }
  }, [filled, snippet.blanks, onComplete, timeLeft]);

  // Split template by "___"
  const templateParts = snippet.template.split("___");

  return (
    <div className="minigame-overlay">
      <motion.div 
        className="minigame-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        style={{ maxWidth: '500px' }}
      >
        <div className="minigame-header">
          <h3>TERMINAL BREACH</h3>
          <div className="minigame-timer">00:{timeLeft.toString().padStart(2, '0')}</div>
        </div>
        
        <p className="minigame-desc">Fill in the missing commands to compile.</p>

        <div style={{
          background: '#0a0a0a',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #333',
          fontFamily: 'monospace',
          fontSize: '16px',
          lineHeight: '2.5',
          color: '#e0e0e0',
          marginTop: '20px'
        }}>
          {templateParts.map((part, i) => (
            <React.Fragment key={i}>
              <span>{part}</span>
              {i < templateParts.length - 1 && (
                <span 
                  onClick={() => handleSlotClick(i)}
                  style={{
                    display: 'inline-block',
                    minWidth: '80px',
                    height: '30px',
                    borderBottom: '2px solid #00ffff',
                    margin: '0 8px',
                    textAlign: 'center',
                    color: '#00ffff',
                    cursor: 'pointer',
                    verticalAlign: 'middle',
                    background: filled[i] ? 'rgba(0, 255, 255, 0.1)' : 'transparent',
                    lineHeight: '30px'
                  }}
                >
                  {filled[i] ? filled[i].text : ""}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginTop: '20px',
          justifyContent: 'center'
        }}>
          {bank.map((item) => (
            <div 
              key={item.id}
              onClick={() => handleBankClick(item)}
              style={{
                padding: '8px 16px',
                background: item.used ? '#333' : '#1a1a2e',
                border: `1px solid ${item.used ? '#555' : '#00ffff'}`,
                color: item.used ? '#777' : '#00ffff',
                borderRadius: '4px',
                cursor: item.used ? 'default' : 'pointer',
                fontFamily: 'monospace',
                userSelect: 'none',
                opacity: item.used ? 0.5 : 1
              }}
            >
              {item.text}
            </div>
          ))}
        </div>

        {solved && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ marginTop: '20px', color: '#00ff88', fontWeight: 'bold', textAlign: 'center', fontFamily: 'monospace' }}
          >
            {'>'} COMPILE SUCCESSFUL
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
            <motion.button 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="minigame-skip" 
              style={{ borderColor: '#00ffff', color: '#00ffff', fontSize: '1.2rem', padding: '10px 20px' }} 
              onClick={handleAutoFill}
            >
              Auto Fill
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}


