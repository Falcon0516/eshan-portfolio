import { useState, useCallback, useMemo, useEffect } from "react";

export function useMemoryLattice(content, { pairsCount = 4 } = {}) {
  const tiles = useMemo(() => {
    let base = content?.matchIcons?.length 
      ? content.matchIcons 
      : ["🚀", "💻", "🔥", "🛡️", "🔗", "🧠", "✨", "🌟"];
    
    // Fallback if not enough base icons
    while (base.length < pairsCount) base = [...base, ...base];
    
    base = base.slice(0, pairsCount);
    
    const deck = [];
    base.forEach(icon => {
      deck.push({ pairId: icon, icon });
      deck.push({ pairId: icon, icon });
    });
    
    // Shuffle
    return deck.sort(() => Math.random() - 0.5).map((t, i) => ({ ...t, id: i }));
  }, [content, pairsCount]);

  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);

  const flip = useCallback((index) => {
    if (flipped.length === 2) return;
    if (flipped.includes(index)) return;
    if (matched.includes(tiles[index].pairId)) return;

    setFlipped(prev => [...prev, index]);
  }, [flipped, matched, tiles]);

  useEffect(() => {
    if (flipped.length === 2) {
      const [a, b] = flipped;
      if (tiles[a].pairId === tiles[b].pairId) {
        setMatched(prev => [...prev, tiles[a].pairId]);
        setFlipped([]);
      } else {
        const timer = setTimeout(() => setFlipped([]), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [flipped, tiles]);

  const solved = matched.length === pairsCount;

  return { tiles, flipped, matched, flip, solved };
}
