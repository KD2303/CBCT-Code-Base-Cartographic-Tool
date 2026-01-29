import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  BarChart3,
  Target,
  Layers,
  ChevronRight,
  ChevronLeft,
  Info,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '@/lib/utils';

const viewModes = [
  {
    id: 'dependencies',
    label: 'Dependencies',
    icon: GitBranch,
    description: 'Unit connections and imports'
  },
  {
    id: 'complexity',
    label: 'Complexity',
    icon: BarChart3,
    description: 'Code density and structure'
  },
  {
    id: 'centrality',
    label: 'Centrality',
    icon: Target,
    description: 'Hub units and gravity'
  }
];

function Sidebar() {
  const {
    repositoryPath,
    repositoryInfo,
    viewMode,
    setViewMode,
    graphData,
    selectedNode,
    semanticLayer
  } = useStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Toggle function with resize trigger for D3
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 400);
  };

  if (!repositoryPath) return null;

  return (
    <motion.aside
      initial={{ width: 320 }}
      animate={{ width: isCollapsed ? 64 : 320 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative bg-[#0B0B15]/95 backdrop-blur-xl border-r border-white/10 flex flex-col z-40 h-full shadow-2xl overflow-hidden"
    >
      {/* Header with Minimize Button */}
      <div className={cn(
        "p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-white/5 to-transparent transition-all duration-300",
        isCollapsed ? "px-2 justify-center" : "px-6"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cbct-accent/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-cbct-accent" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">ANALYSIS</h2>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "p-2 hover:bg-white/10 rounded-lg text-cbct-muted hover:text-white transition-all duration-300",
            isCollapsed ? "bg-cbct-accent text-white hover:scale-110" : ""
          )}
          title={isCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
        >
          {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Content Container */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
      )}>
        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* View Mode */}
          <div>
            <h2 className="text-[10px] font-bold text-cbct-muted uppercase tracking-[0.2em] mb-4 px-1">
              View Mode
            </h2>
            <div className="space-y-2">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all duration-300 group relative border ${viewMode === mode.id
                    ? 'bg-cbct-accent/10 border-cbct-accent/30 text-cbct-accent shadow-lg shadow-cbct-accent/5'
                    : 'border-transparent text-cbct-muted hover:bg-white/5 hover:text-white hover:border-white/10'
                    }`}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                    viewMode === mode.id ? "bg-cbct-accent/20 shadow-inner" : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    <mode.icon className={cn(
                      "w-5 h-5 transition-transform duration-300",
                      viewMode === mode.id ? "scale-110 text-cbct-accent" : "text-cbct-muted group-hover:scale-110 group-hover:text-white"
                    )} />
                  </div>
                  <div>
                    <div className="text-sm font-bold tracking-tight">{mode.label}</div>
                    <div className="text-[10px] opacity-60 leading-tight mt-0.5 font-medium">{mode.description}</div>
                  </div>
                  {viewMode === mode.id && (
                    <motion.div layoutId="sidebar-mode-indicator" className="absolute right-3 w-1.5 h-1.5 rounded-full bg-cbct-accent shadow-[0_0_8px_rgba(88,166,255,0.8)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Repository Stats */}
          {repositoryInfo && !isCollapsed && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-[10px] font-bold text-cbct-muted uppercase tracking-[0.2em] mb-4 px-1">
                Repository Stats
              </h2>
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-5 border border-white/5 space-y-4">
                <div className="flex justify-between items-center group">
                  <span className="text-xs text-cbct-muted group-hover:text-cbct-muted/80 transition-colors">Total Files</span>
                  <span className="font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded text-xs">{repositoryInfo.totalFiles}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-xs text-cbct-muted group-hover:text-cbct-muted/80 transition-colors">Modules</span>
                  <span className="font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded text-xs">{repositoryInfo.structure?.modules?.length || 0}</span>
                </div>

                {repositoryInfo.languages?.length > 0 && (
                  <div className="pt-4 border-t border-white/5 mt-2">
                    <span className="text-[10px] font-bold text-cbct-muted/60 uppercase tracking-wider block mb-3">Languages</span>
                    <div className="flex flex-wrap gap-2">
                      {repositoryInfo.languages.map((lang) => (
                        <span key={lang} className="text-[9px] font-bold bg-cbct-accent/10 text-cbct-accent px-2.5 py-1 rounded-lg border border-cbct-accent/20 uppercase tracking-tighter">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Unit Inspector (Mini) */}
          {selectedNode && !isCollapsed && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-[10px] font-bold text-cbct-accent uppercase tracking-[0.2em] mb-4 px-1">
                Focused Unit
              </h2>
              <div className="bg-cbct-accent/[0.07] p-5 rounded-2xl border border-cbct-accent/20 shadow-xl shadow-cbct-accent/5">
                <div className="font-bold text-white text-sm break-all mb-1 tracking-tight">{selectedNode.label}</div>
                <div className="text-[10px] text-cbct-accent font-black uppercase tracking-widest mb-3 opacity-80">UNIT SOURCE</div>
                <div className="text-[10px] text-cbct-muted/80 font-mono break-all line-clamp-3 leading-relaxed bg-black/20 p-2 rounded-lg border border-white/5">{selectedNode.path || selectedNode.id}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/40">
          <div className="text-[9px] text-cbct-muted/40 text-center font-bold tracking-[0.3em] uppercase">
            CBCT v1.0.0
          </div>
        </div>
      </div>

      {/* Collapsed View Shortcuts */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-8 space-y-6">
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setViewMode(mode.id);
                // Expand on selection for better UX? Or just stay collapsed? 
                // Let's stay collapsed but show active state.
              }}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group",
                viewMode === mode.id ? "bg-cbct-accent text-white shadow-lg shadow-cbct-accent/20" : "bg-white/5 text-cbct-muted hover:bg-white/10 hover:text-white"
              )}
              title={mode.label}
            >
              <mode.icon className="w-5 h-5" />
              {viewMode === mode.id && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-l-full" />
              )}
            </button>
          ))}

          <div className="flex-1" />

          <button
            onClick={toggleSidebar}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-cbct-muted hover:text-white hover:bg-white/10 transition-colors"
            title="Expand All"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.aside>
  );
}

export default Sidebar;
