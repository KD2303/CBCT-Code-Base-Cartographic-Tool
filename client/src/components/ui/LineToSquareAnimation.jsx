import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

const LineToSquareAnimation = () => {
  const controls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      while (true) {
        // Initial state: Line only
        await controls.set({
          pathLength: 0.25, // 1/4 of total permiter (one side) represents the line
          pathOffset: 0,
          opacity: 1
        });

        // 1. Travel Phase (Line Only)
        // Move the "line" (dash) along the path without growing
        await controls.start({
          pathOffset: 0.75, // Move to the end of the first lap effectively
          transition: { duration: 2, ease: "linear" }
        });

        // 2. Square Construction
        // Grow from line (0.25 length) to full square (1 length)
        // We need to adjust offset so it looks like it grows from the lead point? 
        // Or simply grow pathLength.
        // Let's grow pathLength from 0.25 to 1.
        // To make it look like it's growing from the "end" of the travel, we keep pathOffset.
        await controls.start({
          pathLength: 1,
          transition: { duration: 1.5, ease: "easeInOut" }
        });

        // 3. Hold
        await new Promise(resolve => setTimeout(resolve, 500));

        // 4. Reverse to Line
        // Shrink back to 0.25
        await controls.start({
          pathLength: 0.25,
          transition: { duration: 1.5, ease: "easeInOut" }
        });

        // 5. Travel Phase (Again)
        // Continue moving the line forward. 
        // pathOffset is currently 0.75. We want to move it more.
        // But SVG paths loop. 0.75 + distance.
        // To seamlessly loop, we might need to reset. 
        // If we just animate to pathOffset: 1, it completes the loop.
        await controls.start({
          pathOffset: 1,
          transition: { duration: 1, ease: "linear" }
        });
        
        // Reset purely for logic (visual jump should be 0 if path is perfect loop)
        await controls.set({ pathOffset: 0 });
      }
    };

    sequence();
  }, [controls]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden bg-transparent z-0">
      <svg
        width="300"
        height="300"
        viewBox="0 0 100 100"
        className="opacity-50" // Overall dimness
      >
        {/* 
          A simple square rect. 
          Total length = 100 * 4 = 400 (if simple math).
          We want the line to be one edge (25% of total).
          
          Color: gray-80, white-20 -> mostly gray, slightly white.
          Let's try a hex like #cccccc or rgba(200, 200, 200, 0.8) but user said "gray-80, white-20" which usually means 80% gray, 20% white mix? 
          Or maybe gray-80 scale? 
          Let's go with a subtle light gray.
        */}
        <motion.rect
          x="10"
          y="10"
          width="80"
          height="80"
          rx="2" // slight rounded corners for aesthetics? User said "Square", strict square might be better. Let's keep it sharp or very minimal.
          fill="none"
          stroke="rgba(200, 200, 200, 0.3)" // Base track (optional, maybe remove if user wants ONLY the moving line)
          strokeWidth="1"
          style={{ opacity: 0.1 }}
        />
        
        <motion.rect
          x="10"
          y="10"
          width="80"
          height="80"
          rx="2"
          fill="none"
          stroke="rgba(220, 220, 230, 0.6)" // The Active Line color
          strokeWidth="2"
          initial={{ pathLength: 0.25, pathOffset: 0 }}
          animate={controls}
          strokeLinecap="square"
        />
      </svg>
    </div>
  );
};

export default LineToSquareAnimation;
