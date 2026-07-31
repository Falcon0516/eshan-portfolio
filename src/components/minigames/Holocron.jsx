import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useGameStore } from "../../state/gameStore";

const CERTS = [
  { id: "aihr", path: "/files/AI_IN_HRM.png", title: "AI in HR — 83%" },
  { id: "daa", path: "/files/Design_and_analysis_of_algorithms.png", title: "Design & Analysis of Algorithms" },
  { id: "eh", path: "/files/Ethical_Hacking.png", title: "Ethical Hacking — 81%" },
  { id: "java", path: "/files/java_basic_certificate.png", title: "Java (Basic)" },
  { id: "ps", path: "/files/problem_solving_basic_certificate.png", title: "Problem Solving (Basic)" },
  { id: "py", path: "/files/python_basic_certificate.png", title: "Python (Basic)" },
  { id: "sql", path: "/files/sql_basic_certificate.png", title: "SQL (Basic)" },
];

function CertPlane({ cert, index, total, radius, onClick }) {
  const meshRef = useRef();
  
  // Load texture
  const texture = useLoader(THREE.TextureLoader, cert.path);

  const angle = (index / total) * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Make them face outwards from center
      meshRef.current.lookAt(0, 0, 0);
      // Flip them 180 so they face outwards instead of inwards
      meshRef.current.rotateY(Math.PI);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh 
        position={[x, 0, z]} 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(cert);
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <planeGeometry args={[3, 2.2]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
    </Float>
  );
}

function HolocronCore() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.5;
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#00ffff" wireframe emissive="#00ffff" emissiveIntensity={2} />
      <mesh>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
    </mesh>
  );
}

function HolocronScene({ onSelect }) {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
      <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      
      <HolocronCore />
      
      <group ref={groupRef}>
        {CERTS.map((cert, i) => (
          <CertPlane 
            key={cert.id} 
            cert={cert} 
            index={i} 
            total={CERTS.length} 
            radius={5.5} 
            onClick={onSelect} 
          />
        ))}
      </group>

      <OrbitControls enableZoom={true} maxDistance={15} minDistance={3} autoRotate={false} />
    </>
  );
}

export default function Holocron({ onComplete, onSkip, onOpenCard }) {
  const [selectedCert, setSelectedCert] = useState(null);
  const graphicsTier = useGameStore((s) => s.graphicsTier);
  const dpr = graphicsTier === "high" ? [1, 2] : (graphicsTier === "medium" ? [1, 1.5] : [1, 1]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, background: 'radial-gradient(circle at center, #0a0a1a 0%, #000 100%)' }}>
      
      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'cyan', fontFamily: 'monospace', textShadow: '0 0 10px cyan' }}>
        <h2>CERTIFICATION HOLOCRON</h2>
        <p>Drag to rotate. Scroll to zoom. Click a certificate to view.</p>
      </div>

      <button 
        onClick={() => onSkip()} 
        style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, padding: '10px 20px', background: 'rgba(0,255,255,0.1)', border: '1px solid cyan', color: 'cyan', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}>
        ✕ CLOSE HOLOCRON
      </button>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 2, 9] }} dpr={dpr}>
        <React.Suspense fallback={null}>
          <HolocronScene onSelect={setSelectedCert} />
          {graphicsTier !== "low" && (
            <EffectComposer>
              <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.6} mipmapBlur />
              <Vignette eskil={false} offset={0.15} darkness={0.6} />
            </EffectComposer>
          )}
        </React.Suspense>
      </Canvas>

      {/* Selected Certificate Preview */}
      {selectedCert && (
        <div 
          onClick={() => setSelectedCert(null)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          
          <img src={selectedCert.path} alt={selectedCert.title} style={{ maxWidth: '90%', maxHeight: '75%', border: '2px solid cyan', boxShadow: '0 0 30px cyan', borderRadius: '4px' }} />
          
          <div style={{ marginTop: 20, color: 'cyan', fontFamily: 'monospace', fontSize: '20px', textShadow: '0 0 10px cyan' }}>
            {selectedCert.title}
          </div>
          <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: '12px' }}>
            CLICK ANYWHERE TO CLOSE
          </div>
        </div>
      )}
    </div>
  );
}
