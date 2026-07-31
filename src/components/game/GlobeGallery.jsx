"use client";
import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { BLOCK_CONTENT } from "../../data/gameContent";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useGameStore } from "../../state/gameStore";

function GalleryNode({ pos, data, contentKey, onClick }) {
  const ref = useRef();
  const [hovered, setHover] = useState(false);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.quaternion.copy(state.camera.quaternion);
      if (hovered) {
        ref.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
      } else {
        ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <group position={pos} ref={ref}>
      <mesh 
        onClick={(e) => { e.stopPropagation(); onClick(contentKey); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = 'auto'; }}
      >
        <planeGeometry args={[2.5, 2.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      <Html center style={{ pointerEvents: 'none' }}>
        <div className={`globe-card ${hovered ? 'hovered' : ''}`}>
          {data.image && <img src={data.image} alt={data.title} className="globe-card-img" />}
          <div className="globe-card-title">{data.title}</div>
        </div>
      </Html>
    </group>
  );
}

function Globe({ keys, onOpenCard }) {
  const groupRef = useRef();
  
  // Distribute nodes evenly on a sphere using Fibonacci lattice
  const nodes = useMemo(() => {
    const items = [];
    const n = keys.length;
    const phi = Math.PI * (3 - Math.sqrt(5));
    const radius = 12;

    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      items.push({
        pos: [x * radius, y * radius, z * radius],
        data: BLOCK_CONTENT[keys[i]],
        contentKey: keys[i]
      });
    }
    return items;
  }, [keys]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central energy core */}
      <mesh>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.1} wireframe />
      </mesh>
      
      {nodes.map((node, i) => (
        <GalleryNode key={i} pos={node.pos} data={node.data} contentKey={node.contentKey} onClick={onOpenCard} />
      ))}
    </group>
  );
}

export default function GlobeGallery({ keys, onOpenCard, onClose }) {
  const graphicsTier = useGameStore((s) => s.graphicsTier);
  const dpr = graphicsTier === "high" ? [1, 2] : (graphicsTier === "medium" ? [1, 1.5] : [1, 1]);

  return (
    <div className="finish-overlay" style={{ background: 'rgba(5,5,10,0.95)' }}>
      <button className="finish-close" style={{ zIndex: 200, pointerEvents: 'auto' }} onClick={(e) => { e.stopPropagation(); onClose(); }}>✕ CLOSE ODYSSEY</button>
      <div className="finish-title" style={{ position: 'absolute', top: 40, zIndex: 10 }}>🏆 ODYSSEY ARCHIVE</div>
      <div className="finish-sub" style={{ position: 'absolute', top: 85, zIndex: 10 }}>Drag to rotate. Click to explore.</div>
      
      <div style={{ width: '100%', height: '100%' }}>
        <Canvas camera={{ position: [0, 0, 25], fov: 60 }} dpr={dpr}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} />
          <Globe keys={keys} onOpenCard={onOpenCard} />
          <OrbitControls enableZoom={true} enablePan={false} autoRotate autoRotateSpeed={0.5} />
          {graphicsTier !== "low" && (
            <EffectComposer>
              <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.6} mipmapBlur />
              <Vignette eskil={false} offset={0.15} darkness={0.6} />
            </EffectComposer>
          )}
        </Canvas>
      </div>
    </div>
  );
}
