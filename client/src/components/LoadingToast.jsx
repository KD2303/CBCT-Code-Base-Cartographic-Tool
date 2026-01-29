import React, { useState, useEffect } from 'react';

const LOADING_FACTS = [
  {
    icon: '⚡',
    title: 'Instant Visualization',
    text: 'Our engine parses standard structures instantly. No manual configuration required to generate the map.'
  },
  {
    icon: '🔍',
    title: 'Smart Detection',
    text: 'We automatically detect imports, dependencies, and connections across multiple programming languages.'
  },
  {
    icon: '🎯',
    title: 'Hub Detection',
    text: 'Files with many incoming connections are highlighted as hubs - these are your core modules.'
  },
  {
    icon: '📊',
    title: 'Complexity Insights',
    text: 'Switch to Complexity view to see which files might need refactoring based on code metrics.'
  },
  {
    icon: '🔗',
    title: 'Dependency Mapping',
    text: 'Every line you see represents an import or require statement connecting two files.'
  },
  {
    icon: '🌐',
    title: 'Multi-Language Support',
    text: 'Supports JavaScript, TypeScript, Python, Kotlin, Java, and many more languages.'
  },
  {
    icon: '🖱️',
    title: 'Interactive Exploration',
    text: 'Click any node to see its connections. Drag to rearrange. Scroll to zoom in and out.'
  },
  {
    icon: '📁',
    title: 'Directory Grouping',
    text: 'Files from the same directory naturally cluster together for easier navigation.'
  },
  {
    icon: '🎨',
    title: 'Color Coding',
    text: 'Different file types have different colors - components, services, utilities, and more.'
  },
  {
    icon: '💡',
    title: 'Quick Tip',
    text: 'Orphan nodes (files with no connections) might be entry points, configs, or unused code.'
  }
];

function LoadingToast({ isVisible }) {
  const [currentFact, setCurrentFact] = useState(null);
  const [isShowing, setIsShowing] = useState(false);
  const [usedIndices, setUsedIndices] = useState([]);

  useEffect(() => {
    if (!isVisible) {
      setIsShowing(false);
      setUsedIndices([]);
      return;
    }

    const showNextFact = () => {
      // Get available indices
      let available = LOADING_FACTS.map((_, i) => i).filter(i => !usedIndices.includes(i));
      
      // Reset if all used
      if (available.length === 0) {
        available = LOADING_FACTS.map((_, i) => i);
        setUsedIndices([]);
      }

      // Pick random from available
      const randomIndex = available[Math.floor(Math.random() * available.length)];
      setUsedIndices(prev => [...prev, randomIndex]);
      setCurrentFact(LOADING_FACTS[randomIndex]);
      setIsShowing(true);

      // Hide after 4 seconds
      setTimeout(() => {
        setIsShowing(false);
      }, 4000);
    };

    // Show first fact immediately
    showNextFact();

    // Then show new fact every 5 seconds
    const interval = setInterval(showNextFact, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible || !currentFact) return null;

  return (
    <div 
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-700 ease-out ${
        isShowing 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8 pointer-events-none'
      }`}
    >
      <div className="bg-cbct-surface border border-cbct-border rounded-xl shadow-soft px-6 py-4 max-w-md">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-cbct-accent/10 flex items-center justify-center text-2xl flex-shrink-0">
            {currentFact.icon}
          </div>
          <div>
            <h4 className="font-semibold text-cbct-text mb-1">{currentFact.title}</h4>
            <p className="text-sm text-cbct-muted leading-relaxed">{currentFact.text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingToast;
