import { useState, useCallback, useMemo } from "react";

export function useCircuitPuzzle(content, { pinCount = 4 } = {}) {
  const pins = useMemo(() => {
    let labels = content?.matchIcons?.length 
      ? content.matchIcons 
      : ["🛡️", "🔗", "💾", "📡"];
      
    labels = labels.slice(0, pinCount);
    
    // Create shuffled inputs
    const inputs = [...labels].sort(() => Math.random() - 0.5);
    return { outputs: labels, inputs };
  }, [content, pinCount]);

  const [connections, setConnections] = useState({}); // outputId -> inputId

  const connect = useCallback((outputId, inputId) => {
    setConnections(c => ({ ...c, [outputId]: inputId }));
  }, []);

  const solved = pins.outputs.length > 0 && pins.outputs.every(o => connections[o] === o);

  return { pins, connections, connect, solved };
}
