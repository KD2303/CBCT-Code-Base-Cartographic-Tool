import React, { useState } from 'react';
import { Map, FolderOpen, Github, X, Search, Filter, Settings, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function GlassHeader() {
  const { 
    repositoryPath, 
    repositoryInfo, 
    clearRepository, 
    filters, 
    setFilter 
  } = useStore();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <header className="glass-panel h-16 flex items-center justify-between px-6 z-40 fixed top-0 left-0 right-0 border-b border-cbct-border/30">
      
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-cbct-accent-glow">
          <Map className="w-6 h-6 animate-pulse-slow" />
          <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cbct-accent-glow to-blue-400">
            CODEBASE CARTOGRAPHY
          </span>
        </div>
      </div>

      {/* Center: Search / Repository Info */}
      <div className="flex-1 flex justify-center max-w-2xl mx-4">
        {repositoryPath ? (
          <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <span className="p-1.5 bg-cbct-accent/20 rounded-full text-cbct-accent">
               {repositoryPath.startsWith('http') ? <Github size={16} /> : <FolderOpen size={16} />}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white truncate max-w-[300px]">
                {repositoryPath.split('/').pop()}
              </span>
              {repositoryInfo && (
                <span className="text-[10px] text-cbct-muted uppercase tracking-wider">
                  {repositoryInfo.totalFiles} files • {repositoryInfo.totalSize || '0 KB'}
                </span>
              )}
            </div>
            <div className="h-6 w-px bg-white/10 mx-2" />
            <button 
              onClick={clearRepository}
              className="p-1 hover:bg-rose-500/20 hover:text-rose-400 rounded-full transition-colors text-cbct-text/50"
              title="Close Repository"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-cbct-muted/50 text-sm italic">
            <Search size={14} />
            <span>Select a repository to begin analysis...</span>
          </div>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {repositoryPath && (
          <>
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-2 rounded-lg transition-all duration-300 border ${
                  isFilterOpen 
                    ? 'bg-cbct-accent/20 text-cbct-accent border-cbct-accent/50 shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
                    : 'bg-black/20 text-cbct-text border-white/5 hover:bg-white/5'
                }`}
              >
                <Filter size={18} />
              </button>
              
              {/* Filter Dropdown */}
              {isFilterOpen && (
                <div className="absolute top-full right-0 mt-3 w-64 glass-panel border border-white/10 p-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-xs font-semibold text-cbct-muted uppercase mb-3">Filter Graph</h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-cbct-text/70">Search Nodes</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cbct-accent/50 transition-colors"
                          placeholder="filename..."
                          value={filters?.searchQuery || ''}
                          onChange={(e) => setFilter && setFilter('searchQuery', e.target.value)}
                        />
                        <Search className="absolute right-2 top-2 text-white/20" size={12} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        <button className="p-2 hover:bg-white/5 rounded-lg text-cbct-text/70 transition-colors">
          <Settings size={18} />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cbct-accent to-purple-500 shadow-lg border border-white/20" />
      </div>
    </header>
  );
}
