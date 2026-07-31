"use client";
import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useGameStore } from "../../../state/gameStore";
import CrateReveal from "./CrateReveal";

/**
 * Shard that flies outward from the center and fades.
 */
function Shard({ startPos, velocity, color, delay }) {
  const ref = useRef();
  const startTime = useRef(null);

  useFrame((state) => {
    if (!ref.current) return;
    if (startTime.current === null) startTime.current = state.clock.elapsedTime + delay;
    
    const elapsed = state.clock.elapsedTime - startTime.current;
    if (elapsed < 0) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    
    const t = Math.min(elapsed / 0.6, 1); // 600ms flight
    ref.current.position.x = startPos[0] + velocity[0] * t * 3;
    ref.current.position.y = startPos[1] + velocity[1] * t * 3;
    ref.current.position.z = startPos[2] + velocity[2] * t * 3;
    ref.current.rotation.x += 0.08;
    ref.current.rotation.z += 0.05;
    ref.current.material.opacity = 1 - t;
    ref.current.scale.setScalar(1 - t * 0.5);
  });

  return (
    <mesh ref={ref} visible={false}>
      <tetrahedronGeometry args={[0.25, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        transparent
        opacity={1}
      />
    </mesh>
  );
}

/**
 * The crystal core — icosahedron that rotates, then shatters into shards.
 */
function ShatterCore({ color, onShatter }) {
  const coreRef = useRef();
  const [shattered, setShattered] = useState(false);
  const startTime = useRef(null);

  useFrame((state) => {
    if (!coreRef.current) return;
    if (startTime.current === null) startTime.current = state.clock.elapsedTime;
    
    const elapsed = state.clock.elapsedTime - startTime.current;
    
    if (!shattered) {
      // Rotate and pulse before shattering
      coreRef.current.rotation.x = elapsed * 0.8;
      coreRef.current.rotation.y = elapsed * 1.2;
      
      // Scale pulse
      const pulse = 1 + Math.sin(elapsed * 8) * 0.05;
      coreRef.current.scale.setScalar(pulse);
      
      // Shatter at ~0.5s
      if (elapsed > 0.5) {
        setShattered(true);
        coreRef.current.visible = false;
        onShatter?.();
      }
    }
  });

  return (
    <Float speed={3} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial
          color={color}
          wireframe
          emissive={color}
          emissiveIntensity={3}
        />
      </mesh>
      {/* Inner solid core */}
      {!shattered && (
        <mesh>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.5}
          />
        </mesh>
      )}
    </Float>
  );
}

/**
 * Ambient particles — reuses MagicalPortal's pattern.
 */
function AmbientParticles({ color }) {
  const count = 150;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      arr[i] = (Math.random() - 0.5) * 16;
    }
    return arr;
  }, []);
  
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.002;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color={color} transparent opacity={0.5} />
    </points>
  );
}

/**
 * The full scene — renders inside a Canvas.
 */
function ShatterScene({ accent, onDone }) {
  const color = accent || "#00ffff";
  const [showShards, setShowShards] = useState(false);
  const doneRef = useRef(false);
  
  // Generate shard data
  const shards = useMemo(() => {
    const arr = [];
    const tier = useGameStore.getState().graphicsTier;
    const count = tier === "high" ? 24 : 12;
    for (let i = 0; i < count; i++) {
      // Fibonacci sphere distribution for even spread
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const velocity = [
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      ];
      arr.push({
        id: i,
        startPos: [0, 0, 0],
        velocity,
        delay: Math.random() * 0.05,
      });
    }
    return arr;
  }, []);

  const handleShatter = () => {
    setShowShards(true);
    // Signal done after shards fly out
    setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
    }, 700);
  };

  // Safety auto-complete timeout
  useEffect(() => {
    const t = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={2} color={color} />
      <pointLight position={[-5, -3, 3]} intensity={1} color="#ffffff" />
      
      <Stars radius={30} depth={30} count={1000} factor={3} saturation={0} fade speed={2} />
      
      <ShatterCore color={color} onShatter={handleShatter} />
      
      {showShards && shards.map((s) => (
        <Shard
          key={s.id}
          startPos={s.startPos}
          velocity={s.velocity}
          color={color}
          delay={s.delay}
        />
      ))}
      
      <AmbientParticles color={color} />
    </>
  );
}

/**
 * CrystalShatterReveal — r3f shatter effect for legendary/crystal entries.
 * Reuses MagicalPortal's icosahedron/particle patterns.
 * Falls back to CrateReveal on low-tier devices (handled by parent).
 */
export default function CrystalShatterReveal({ accent = "#00ffff", onDone }) {
  const graphicsTier = useGameStore((s) => s.graphicsTier);

  if (graphicsTier === "low") {
    return <CrateReveal accent={accent} onDone={onDone} />;
  }

  const dpr = graphicsTier === "high" ? [1, 2] : [1, 1.5];

  return (
    <div className="crate-reveal-stage" style={{ background: "radial-gradient(circle at center, rgba(20,10,30,0.95) 0%, rgba(0,0,0,0.98) 100%)" }}>
      <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
        <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={dpr}>
          <ShatterScene accent={accent} onDone={onDone} />
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.6} mipmapBlur />
            <Vignette eskil={false} offset={0.15} darkness={0.6} />
          </EffectComposer>
        </Canvas>
      </div>
    </div>
  );
}
