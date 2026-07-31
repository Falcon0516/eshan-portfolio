"use client";
import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Float, Plane } from "@react-three/drei";
import * as THREE from "three";
import { useMemoryLattice } from "./useMemoryLattice";

function Tile3D({ tile, isFlipped, isMatched, onClick, position }) {
  const groupRef = useRef();
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetRotY = isFlipped ? Math.PI : 0;
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 8, delta);
  });

  return (
    <Float floatIntensity={1} rotationIntensity={0.2} speed={2}>
      <group position={position} ref={groupRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        
        {/* Front (Face Down) */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#16213e" side={THREE.FrontSide} />
        </mesh>
        <Text position={[0, 0, 0.02]} fontSize={0.5} color="rgba(0, 255, 255, 0.5)">?</Text>
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
          <lineBasicMaterial color="rgba(0, 255, 255, 0.2)" />
        </lineSegments>

        {/* Back (Face Up) */}
        <mesh position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={isMatched ? "#00ff88" : "#26315e"} side={THREE.FrontSide} />
        </mesh>
        <Text position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]} fontSize={0.6} color="white">{tile.icon}</Text>
        <lineSegments rotation={[0, Math.PI, 0]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
          <lineBasicMaterial color={isMatched ? "#00ff88" : "#00ffff"} />
        </lineSegments>
        
      </group>
    </Float>
  );
}

export default function MemoryLattice3D({ content, onComplete }) {
  const { tiles, flipped, matched, flip, solved } = useMemoryLattice(content);
  
  useEffect(() => {
    if (solved) {
      setTimeout(() => onComplete(250), 1000);
    }
  }, [solved, onComplete]);

  // Layout in a 4x2 grid
  const cols = 4;
  const spacing = 1.5;
  const startX = -((cols - 1) * spacing) / 2;
  const startY = spacing / 2;

  return (
    <group position={[0, 0, 0]}>
      <Text position={[0, 2.5, 0]} fontSize={0.4} color="#00ffff" anchorX="center">
        {solved ? "LATTICE SYNCHRONIZED" : "MEMORY LATTICE"}
      </Text>

      {tiles.map((tile, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = startX + col * spacing;
        const y = startY - row * spacing;
        
        const isFlipped = flipped.includes(i) || matched.includes(tile.pairId);
        const isMatched = matched.includes(tile.pairId);

        return (
          <Tile3D 
            key={tile.id}
            tile={tile}
            position={[x, y, 0]}
            isFlipped={isFlipped}
            isMatched={isMatched}
            onClick={() => flip(i)}
          />
        );
      })}
    </group>
  );
}
