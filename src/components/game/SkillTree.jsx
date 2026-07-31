"use client";
import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Line, Float } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useGameStore } from "../../state/gameStore";
import TerminalBreach from "../minigames/terminalBreach/TerminalBreach";

const SKILLS = [
  { id: "core", name: "CORE", pos: [0, -3, 0], level: 100, desc: "The Foundation", script: "import { developer } from 'me';" },
  { id: "py", parent: "core", name: "Python", pos: [-4, 0, 0], level: 95, desc: "FastAPI, AI/ML pipelines, Data Processing", script: "@app.get('/api/ai')\\ndef process():\\n  return model.predict(data)" },
  { id: "js", parent: "core", name: "JavaScript", pos: [4, 0, 0], level: 88, desc: "ES6+, DOM manipulation, Web APIs", script: "const tree = new Tree3D();\\ntree.grow();" },
  { id: "react", parent: "js", name: "React / Next.js", pos: [3, 3, 2], level: 90, desc: "Server components, Three.js, complex state", script: "export default function App() {\\n  return <Canvas><Globe /></Canvas>\\n}" },
  { id: "llm", parent: "py", name: "GenAI & LLMs", pos: [-5, 3, 2], level: 93, desc: "Groq, OpenAI, Local models, RAG architectures", script: "const response = await groq.chat.completions.create({\\n  model: 'llama3-70b-8192'\\n});" },
  { id: "db", parent: "core", name: "Databases", pos: [0, 1, -3], level: 85, desc: "PostgreSQL, MongoDB, Redis", script: "db.collection('projects').aggregate([\\n  { $match: { tech: 'AI' } }\\n]);" },
  { id: "devops", parent: "db", name: "Docker & K8s", pos: [0, 4, -4], level: 85, desc: "Containerization, orchestration, deployment", script: "FROM python:3.10\\nWORKDIR /app\\nCOPY . .\\nCMD ['uvicorn', 'main:app']" },
];

function Branch({ start, end, progress }) {
  const points = [
    new THREE.Vector3(...start),
    new THREE.Vector3().lerpVectors(new THREE.Vector3(...start), new THREE.Vector3(...end), progress)
  ];
  return (
    <Line points={points} color="#00ffff" lineWidth={3} transparent opacity={progress} />
  );
}

function SkillNode({ data, delay, onNodeClick, activeNodeId, isLocked }) {
  const [scale, setScale] = useState(0);
  const isActive = activeNodeId === data.id;

  useFrame((state, delta) => {
    if (state.clock.elapsedTime > delay && scale < 1) {
      setScale(s => Math.min(1, s + delta * 2));
    }
  });

  if (scale === 0) return null;

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={data.pos} scale={[scale, scale, scale]}>
        <mesh onClick={(e) => { e.stopPropagation(); onNodeClick(data); }}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color={isActive ? "#00ff88" : (isLocked ? "#ff0055" : "#00ffff")} emissive={isActive ? "#00ff88" : (isLocked ? "#ff0055" : "#00ffff")} emissiveIntensity={isActive ? 1 : 0.5} wireframe={!isActive} />
        </mesh>
        
        <Html distanceFactor={15} center zIndexRange={[100, 0]}>
          <div className={`skill-node-label ${isActive ? 'active' : ''}`} onClick={() => onNodeClick(data)} style={{ cursor: 'pointer', background: isActive ? 'rgba(0, 255, 136, 0.2)' : (isLocked ? 'rgba(255, 0, 85, 0.2)' : 'rgba(0,0,0,0.6)'), border: `1px solid ${isActive ? '#00ff88' : (isLocked ? '#ff0055' : '#00ffff')}`, padding: '4px 8px', borderRadius: '4px', color: '#fff', fontFamily: 'monospace', whiteSpace: 'nowrap', pointerEvents: 'auto', userSelect: 'none' }}>
            {data.name} <span style={{ color: isActive ? '#00ff88' : '#00ffff' }}>{data.level}%</span>
          </div>
        </Html>
      </group>
    </Float>
  );
}

function TreeScene({ activeNodeId, unlockedNodes, onNodeClick }) {
  const [growProgress, setGrowProgress] = useState(0);
  
  useFrame((state, delta) => {
    if (growProgress < 1) {
      setGrowProgress(p => Math.min(1, p + delta * 0.5));
    }
  });

  return (
    <group position={[0, -2, 0]}>
      {/* Branches */}
      {SKILLS.map((skill) => {
        if (!skill.parent) return null;
        const parent = SKILLS.find(s => s.id === skill.parent);
        if (!parent) return null;
        return <Branch key={`branch-${skill.id}`} start={parent.pos} end={skill.pos} progress={growProgress} />;
      })}

      {/* Nodes */}
      {SKILLS.map((skill, i) => {
        const isLocked = (skill.id === "llm" || skill.id === "devops") && !unlockedNodes.has(skill.id);
        const displaySkill = { ...skill, name: isLocked ? "🔒 ENCRYPTED" : skill.name };
        return <SkillNode key={skill.id} data={displaySkill} delay={i * 0.2} onNodeClick={onNodeClick} activeNodeId={activeNodeId} isLocked={isLocked} />;
      })}
    </group>
  );
}

export default function SkillTree({ active, onClose }) {
  const [activeNode, setActiveNode] = useState(null);
  const [challengedNode, setChallengedNode] = useState(null);
  const [unlockedNodes, setUnlockedNodes] = useState(new Set());
  const graphicsTier = useGameStore((s) => s.graphicsTier);
  const dpr = graphicsTier === "high" ? [1, 2] : (graphicsTier === "medium" ? [1, 1.5] : [1, 1]);

  if (!active) return null;

  const handleNodeClick = (node) => {
    if ((node.id === "llm" || node.id === "devops") && !unlockedNodes.has(node.id)) {
      setChallengedNode(node);
      setActiveNode(null);
    } else {
      setActiveNode(node);
    }
  };

  return (
    <div className="finish-overlay" style={{ background: 'rgba(5,5,10,0.95)', pointerEvents: 'auto' }}>
      <button className="finish-close" style={{ zIndex: 200, position: 'absolute', top: 20, right: 20, pointerEvents: 'auto' }} onClick={(e) => { e.stopPropagation(); onClose(); }}>✕ CLOSE SKILL TREE</button>
      <div className="finish-title" style={{ position: 'absolute', top: 40, left: 40, zIndex: 10, fontFamily: 'monospace', fontSize: '24px', color: '#fff' }}>⚡ NEURAL SKILL MAP</div>
      <div className="finish-sub" style={{ position: 'absolute', top: 85, left: 40, zIndex: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>Select a node to inspect system capabilities.</div>

      {/* Active Node Info Panel */}
      <AnimatePresence mode="wait">
        {activeNode && (
          <motion.div 
            key={activeNode.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ position: 'absolute', bottom: 40, left: 40, zIndex: 10, width: '350px', background: 'rgba(0,0,0,0.6)', border: '1px solid #00ff88', padding: '20px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#00ff88', fontFamily: 'monospace', fontSize: '20px' }}>{activeNode.name}</h3>
            <p style={{ color: '#fff', fontSize: '14px', marginBottom: '15px' }}>{activeNode.desc}</p>
            <div style={{ background: '#111', padding: '10px', borderRadius: '4px', borderLeft: '3px solid #00ffff' }}>
              <pre style={{ margin: 0, color: '#00ffff', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                {activeNode.script}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {challengedNode && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, background: 'rgba(0,0,0,0.9)' }}>
          <div style={{ position: 'absolute', top: 20, width: '100%', textAlign: 'center', color: '#ff0055', fontFamily: 'monospace', zIndex: 1001, textShadow: '0 0 10px red' }}>
            SECURITY BREACH DETECTED: DECRYPT NODE TO ACCESS
          </div>
          <TerminalBreach 
            content={{
              codeSnippet: challengedNode.id === "llm" 
                ? { template: "const res = await ___.chat.completions.___({", blanks: ["groq", "create"], bank: ["groq", "create", "fetch", "axios", "then"] }
                : { template: "FROM python:3.10\\n___ /app\\n___ . .", blanks: ["WORKDIR", "COPY"], bank: ["WORKDIR", "COPY", "RUN", "CMD", "ADD"] }
            }}
            onComplete={() => {
              const nextUnlocked = new Set(unlockedNodes);
              nextUnlocked.add(challengedNode.id);
              setUnlockedNodes(nextUnlocked);
              setActiveNode(SKILLS.find(s => s.id === challengedNode.id));
              setChallengedNode(null);
            }}
            onSkip={() => setChallengedNode(null)}
          />
        </div>
      )}

      <div style={{ width: '100%', height: '100%' }}>
        <Canvas camera={{ position: [0, 2, 12], fov: 60 }} dpr={dpr}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} color="#00ffff" intensity={0.5} />
          <TreeScene activeNodeId={activeNode?.id} unlockedNodes={unlockedNodes} onNodeClick={handleNodeClick} />
          <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} maxDistance={20} minDistance={5} />
        </Canvas>
      </div>
    </div>
  );
}
