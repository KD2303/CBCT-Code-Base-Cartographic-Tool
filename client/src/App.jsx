import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GraphCanvas from './components/GraphCanvas';

import WelcomeScreen from './components/WelcomeScreen';
import LoadingToast from './components/LoadingToast';
import { GooeyText } from '@/components/ui/gooey-text-morphing';
import { useStore } from './store/useStore';
import BackgroundAnimation from './components/ui/BackgroundAnimation';

function App() {
  const { repositoryPath, isLoading, graphData, error } = useStore();

  const showWelcome = !repositoryPath && !isLoading;
  const showGraph = repositoryPath && graphData && !error;
  const showError = error && !isLoading;

  return (
    <div className="h-screen w-screen flex flex-col bg-cbct-bg text-cbct-text font-sans overflow-hidden">
      <Header />
      
      {/* Loading Toast - shows info during analysis */}
      <LoadingToast isVisible={isLoading} />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Background Effects (Hero Style) - Only for Graph view background context if needed, but usually graph has its own */}
        
        {/* Left Sidebar - Add top margin to span below header */}
        <div className={`${showWelcome ? 'hidden' : 'block'} pt-16 h-full`}>
           <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className={`flex-1 relative z-10 w-full h-full ${showWelcome ? '' : 'pt-16'}`}>
          {showWelcome && <WelcomeScreen />}
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
               <BackgroundAnimation />
              <div className="h-[200px] flex items-center justify-center relative z-10">
                <GooeyText
                  texts={["Analyzing Repository", "Mapping Codebase", "Generating Graph", "Discovering Insights"]}
                  morphTime={1}
                  cooldownTime={0.25}
                  className="font-bold"
                  textClassName="text-4xl md:text-5xl text-cbct-accent"
                />
              </div>
            </div>

          )}
          
          {showError && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="bg-destructive/10 border border-destructive/20 backdrop-blur-md p-8 rounded-2xl max-w-lg text-center">
                <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Analysis Failed</h3>
                <p className="text-cbct-muted mb-6">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-cbct-surface hover:bg-cbct-surfaceHover text-white rounded-lg transition-colors border border-cbct-border"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          
          {showGraph && (
            <GraphCanvas />
          )}
        </main>


      </div>
    </div>
  );
}

export default App;
