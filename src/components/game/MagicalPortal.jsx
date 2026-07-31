"use client";
import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Float } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "../../state/gameStore";

// A mesmerizing abstract 3D object for the portal
function MagicalCore({ color }) {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.2;
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[2, 1]} />
        <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={2} />
      </mesh>
      
      {/* Inner solid core */}
      <mesh>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
    </Float>
  );
}

function Particles({ color }) {
  const count = 200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 20;
  }
  
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.001;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.1} color={color} transparent opacity={0.6} />
    </points>
  );
}

export default function MagicalPortal({ cardKey, onEnter }) {
  const [hovered, setHovered] = useState(false);
  const graphicsTier = useGameStore((s) => s.graphicsTier);
  const dpr = graphicsTier === "high" ? [1, 2] : (graphicsTier === "medium" ? [1, 1.5] : [1, 1]);
  
  let color = "#00ffff"; // default cyan
  if (cardKey === "argus") color = "#ff00ff";
  else if (cardKey === "axiom") color = "#00ff88";
  else if (cardKey === "hack_aisthetica") color = "#ffaa00";

  useEffect(() => {
    // Force canvas resize to bypass the R3F 300x150 glitch when mounted inside framer-motion
    const t1 = setTimeout(() => window.dispatchEvent(new Event("resize")), 10);
    const t2 = setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
    const t3 = setTimeout(() => window.dispatchEvent(new Event("resize")), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="magical-portal-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: 'transparent' }}>
      <Canvas camera={{ position: [0, 0, 8] }} dpr={dpr}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color={color} />
        
        <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        
        {/* MagicalCore removed per user request (hover ball) */}
        <Particles color={color} />
        
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
      </Canvas>
    </div>
  );
}
