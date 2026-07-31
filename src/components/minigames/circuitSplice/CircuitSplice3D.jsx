"use client";
import React, { useState, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Line, Text, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { useCircuitPuzzle } from "./useCircuitPuzzle";

export default function CircuitSplice3D({ content, onComplete }) {
  const { pins, connections, connect, solved } = useCircuitPuzzle(content);
  const { camera, raycaster, pointer } = useThree();
  
  const [activeDrag, setActiveDrag] = useState(null); // { outputId, startPos, currentPos }
  
  const leftX = -2;
  const rightX = 2;
  const spacing = 1.2;
  const startY = (pins.outputs.length - 1) * spacing / 2;

  const outputNodes = useRef({});
  const inputNodes = useRef({});

  const handlePointerDown = (e, outputId, pos) => {
    e.stopPropagation();
    if (connections[outputId] === outputId) return;
    setActiveDrag({
      outputId,
      startPos: pos,
      currentPos: pos.clone()
    });
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    if (!activeDrag) return;
    
    // Check if we dropped on an input node
    const intersects = raycaster.intersectObjects(Object.values(inputNodes.current).filter(Boolean));
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const inputId = hit.userData.id;
      if (inputId === activeDrag.outputId) {
        connect(activeDrag.outputId, inputId);
      }
    }
    setActiveDrag(null);
  };

  const handlePointerMove = (e) => {
    if (activeDrag) {
      // Find intersection with z=0 plane
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, target);
      if (target) {
        setActiveDrag(prev => ({ ...prev, currentPos: target }));
      }
    }
  };

  useEffect(() => {
    if (solved) {
      setTimeout(() => onComplete(250), 1000);
    }
  }, [solved, onComplete]);

  return (
    <group 
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <Text position={[0, startY + 1.5, 0]} fontSize={0.4} color="#00ffff" anchorX="center">
        {solved ? "CIRCUIT SECURED" : "CIRCUIT SPLICE"}
      </Text>

      {/* Outputs */}
      {pins.outputs.map((label, i) => {
        const y = startY - i * spacing;
        const pos = new THREE.Vector3(leftX, y, 0);
        const isSolved = connections[label] === label;
        
        return (
          <group key={`out-${label}`} position={pos}>
            <Sphere 
              args={[0.2, 16, 16]}
              onPointerDown={(e) => handlePointerDown(e, label, pos)}
              userData={{ id: label }}
            >
              <meshBasicMaterial color={isSolved ? "#00ff88" : "#00ffff"} wireframe={!isSolved} />
            </Sphere>
            <Text position={[-0.5, 0, 0]} fontSize={0.3} color="white">{label}</Text>
          </group>
        );
      })}

      {/* Inputs */}
      {pins.inputs.map((label, i) => {
        const y = startY - i * spacing;
        const pos = new THREE.Vector3(rightX, y, 0);
        const isSolved = Object.values(connections).includes(label);
        
        return (
          <group key={`in-${label}`} position={pos}>
            <Sphere 
              args={[0.2, 16, 16]}
              ref={el => { if (el) inputNodes.current[label] = el; }}
              userData={{ id: label }}
            >
              <meshBasicMaterial color={isSolved ? "#00ff88" : "#444"} wireframe={!isSolved} />
            </Sphere>
            <Text position={[0.5, 0, 0]} fontSize={0.3} color="white">{label}</Text>
          </group>
        );
      })}

      {/* Established Lines */}
      {pins.outputs.map(outId => {
        const inId = connections[outId];
        if (!inId) return null;
        
        const outIdx = pins.outputs.indexOf(outId);
        const inIdx = pins.inputs.indexOf(inId);
        
        const p1 = new THREE.Vector3(leftX, startY - outIdx * spacing, 0);
        const p2 = new THREE.Vector3(rightX, startY - inIdx * spacing, 0);
        
        return (
          <Line key={`conn-${outId}`} points={[p1, p2]} color="#00ff88" lineWidth={3} dashed dashScale={10} dashSize={1} gapSize={1} />
        );
      })}

      {/* Active Drag Line */}
      {activeDrag && (
        <Line points={[activeDrag.startPos, activeDrag.currentPos]} color="#00ffff" lineWidth={2} />
      )}
    </group>
  );
}
