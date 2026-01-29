import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Map, FolderOpen, ArrowRight, Zap, Layers, ShieldCheck, Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import LinkToSquareAnimation from './ui/LineToSquareAnimation';

function WelcomeScreen() {
  const [inputPath, setInputPath] = useState('');
  const { setRepositoryPath, error, clearError } = useStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputPath.trim()) {
      setRepositoryPath(inputPath.trim());
    }
  };

  const examplePaths = [
    { label: 'Current Project', path: '.' },
    { label: 'Facebook/React', path: 'https://github.com/facebook/react' }
  ];

  return (
    <div className="absolute inset-0 overflow-y-auto bg-cbct-bg text-cbct-text custom-scrollbar selection:bg-cbct-accent/30">
      <LinkToSquareAnimation />
      {/* Tubelight Effect Background - White light spreading from top BEHIND navbar */}
      <div className="absolute top-0 left-0 right-0 h-[60vh] flex items-start justify-center overflow-hidden pointer-events-none z-0">
        
        {/* The tubelight bar itself - bright bright white line at top, blending with navbar */}
        <motion.div
          initial={{ width: "10rem", opacity: 0 }}
          animate={{ width: "45rem", opacity: 1 }}
          transition={{ ease: "easeOut", delay: 0.1, duration: 1.2 }}
          className="absolute top-[-2px] h-[3px] bg-white shadow-[0_0_50px_10px_rgba(255,255,255,0.9),0_0_100px_30px_rgba(255,255,255,0.5),0_0_150px_60px_rgba(255,255,255,0.3)] z-10"
        />

        {/* Main volumetric glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ease: "easeOut", delay: 0.3, duration: 1.5 }}
          className="absolute top-[-10%] h-[500px] w-full max-w-4xl bg-gradient-to-b from-white/20 via-white/5 to-transparent blur-[80px]"
        />

        {/* Left cone of light - subtle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 2 }}
          className="absolute top-0 right-[45%] w-[400px] h-[500px] bg-gradient-conic from-white/10 via-transparent to-transparent opacity-30 transform -rotate-12 blur-3xl origin-top-right"
        />
        
        {/* Right cone of light - subtle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 2 }}
          className="absolute top-0 left-[45%] w-[400px] h-[500px] bg-gradient-conic from-transparent via-transparent to-white/10 opacity-30 transform rotate-12 blur-3xl origin-top-left"
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center min-h-full z-10">
        
        {/* Hero Section with Animation */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ease: "easeOut", delay: 0.2, duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-20 relative"
        >
          {/* Badge */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md shadow-lg"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cbct-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cbct-accent"></span>
            </span>
            <span className="text-[11px] font-bold tracking-widest text-cbct-accent uppercase font-mono">AI-Powered Code Mapping</span>
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl md:text-8xl font-bold leading-tight mb-8 tracking-tighter text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.15)]"
          >
            Say goodbye to <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">spaghetti code</span>.
          </motion.h1>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-xl text-cbct-muted/80 mb-12 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Visualize architecture, identify bottlenecks, and refactor with confidence. The next generation of codebase cartography is here.
          </motion.p>

          {/* Search/Input Area with Animation */}
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="max-w-xl mx-auto"
          >
            <div className="relative group p-[1px] rounded-2xl bg-gradient-to-br from-white/20 to-transparent">
              <div className="bg-[#0B0B15]/80 backdrop-blur-xl rounded-2xl relative overflow-hidden">
                <form onSubmit={handleSubmit} className="relative flex items-center p-2">
                   <div className="absolute left-6 text-cbct-muted/50 group-hover:text-cbct-accent transition-colors">
                     <Search className="w-5 h-5" />
                   </div>
                   <input 
                      type="text" 
                      value={inputPath}
                      onChange={(e) => {
                        setInputPath(e.target.value);
                        if(error) clearError();
                      }}
                      className="w-full bg-transparent border-none outline-none text-white px-14 py-4 placeholder:text-cbct-muted/30 font-medium text-lg"
                      placeholder="Paste repository URL or local path..." 
                   />
                   <button 
                      type="submit"
                      disabled={!inputPath.trim()}
                      className="absolute right-2 px-8 py-3 bg-white text-black hover:bg-white/90 rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                   >
                     Analyze
                   </button>
                </form>
              </div>
            </div>
            
            {/* Examples */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-6 flex justify-center gap-6 text-xs text-cbct-muted/50 font-medium"
            >
              <span>TRY:</span>
              {examplePaths.map((ex) => (
                <button 
                  key={ex.path}
                  onClick={() => setInputPath(ex.path)}
                  className="hover:text-white transition-colors border-b border-transparent hover:border-white/50"
                >
                  {ex.label}
                </button>
              ))}
            </motion.div>
          </motion.div>

           {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 mx-auto max-w-md p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-md flex items-center gap-3 text-red-200 text-sm shadow-xl"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse"></span>
              {error}
            </motion.div>
          )}
        </motion.div>

        {/* Feature Cards with Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-12">
          {/* Card 1 */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="group relative p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-cbct-accent/20 to-transparent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-cbct-accent drop-shadow-[0_0_10px_rgba(88,166,255,0.5)]" />
            </div>
            <h3 className="text-lg font-bold mb-3 text-white">Instant Visualization</h3>
            <p className="text-cbct-muted/70 leading-relaxed text-sm">
              Our engine parses standard structures instantly. No manual configuration required to generate the map.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="group relative p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative w-12 h-12 bg-gradient-to-br from-cbct-secondary/20 to-transparent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6 text-cbct-secondary drop-shadow-[0_0_10px_rgba(63,185,80,0.5)]" />
            </div>
            <h3 className="text-lg font-bold mb-3 relative text-white">Deep Insights</h3>
            <p className="text-cbct-muted/70 leading-relaxed text-sm relative">
              AI analyzes patterns, classifies modules, and learns from inputs to automate documentation.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="group relative p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-transparent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            </div>
            <h3 className="text-lg font-bold mb-3 text-white">Enterprise Security</h3>
            <p className="text-cbct-muted/70 leading-relaxed text-sm">
              Your code stays local. We process metadata to generate visual graphs without exposing proprietary logic.
            </p>
          </motion.div>
        </div>

        {/* Footer-ish trusted by */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-32 text-center"
        >
           <p className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase mb-8">Developers by</p>
           <div className="flex justify-center gap-16 grayscale opacity-60">
              <span className="text-lg font-bold font-serif text-white">Team TechOps</span>
           </div>
        </motion.div>

      </div>
    </div>
  );
}

export default WelcomeScreen;
