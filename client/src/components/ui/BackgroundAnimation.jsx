import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const GridBlock = ({ delay, duration, x, y }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: [0, 0.4, 0.2, 0],
        scale: [0.8, 1, 1, 0.8],
      }}
      transition={{ 
        duration: duration,
        delay: delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 5 + 3,
        ease: "easeInOut"
      }}
      className="absolute bg-cbct-accent/20 border border-cbct-accent/10 backdrop-blur-sm"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${Math.random() * 10 + 5}rem`,
        height: `${Math.random() * 4 + 2}rem`,
        borderRadius: '4px',
      }}
    />
  );
};

const ScanningLine = () => {
  return (
    <motion.div
      initial={{ top: "0%", opacity: 0 }}
      animate={{ 
        top: ["0%", "100%"],
        opacity: [0, 1, 1, 0]
      }}
      transition={{ 
        duration: 8,
        repeat: Infinity,
        ease: "linear",
        repeatDelay: 2
      }}
      className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cbct-accent/50 to-transparent shadow-[0_0_15px_rgba(88,166,255,0.5)]"
    />
  );
};

const BackgroundAnimation = () => {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    // Generate random grid blocks
    const newBlocks = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 90, // Random percentage left
      y: Math.random() * 80 + 10, // Random percentage top (avoid very top)
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    }));
    setBlocks(newBlocks);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0" 
        style={{
          backgroundImage: `linear-gradient(rgba(88, 166, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(88, 166, 255, 0.03) 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }}
      />

      {/* Primary Horizontal Light Line (The "Breathing" Start) */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ 
          scaleX: [0, 1, 1.2, 1], 
          opacity: [0, 1, 0.5, 0] 
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          repeatDelay: 1,
          ease: "easeInOut" 
        }}
        className="absolute top-[20%] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent blur-[1px]"
      />

      {/* Floating Grid Blocks (The "Mapping" Effect) */}
      {blocks.map((block) => (
        <GridBlock 
          key={block.id} 
          {...block} 
        />
      ))}

      {/* Vertical Scanning Line */}
      <ScanningLine />

      {/* Ambient Glows */}
      <div className="absolute top-[-10%] left-[20%] w-[40rem] h-[40rem] bg-cbct-accent/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[20%] w-[30rem] h-[30rem] bg-cbct-secondary/5 rounded-full blur-[80px]" />
    </div>
  );
};

export default BackgroundAnimation;
