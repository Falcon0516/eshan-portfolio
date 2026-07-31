"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ImageWithLoader from "./ImageWithLoader";

export default function CylinderCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const angle = 360 / images.length;
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => prev + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      perspective: "1000px",
      width: "100%",
      height: "220px",
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      overflow: "visible",
      marginTop: "10px",
      marginBottom: "20px"
    }}>
      <motion.div
        style={{
          width: "80%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
        }}
        animate={{ rotateY: currentIndex * -angle }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
      >
        {images.map((src, i) => {
          // For 3 items, radius is about 120px to prevent overlap
          const radius = images.length === 3 ? 140 : 200; 
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
                backfaceVisibility: "hidden",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(0,0,0,0.6)"
              }}
            >
              <ImageWithLoader 
                src={src} 
                alt={`Slide ${i}`}
                style={{ width: "100%", height: "100%", objectFit: "contain" }} 
              />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
