import React from 'react';
import { Home, Compass, BarChart2, GitBranch, Layers, Settings, HelpCircle, FileCode } from 'lucide-react';

export default function GlassSidebar() {
  const navItems = [
    { icon: Home, label: 'Overview', active: false },
    { icon: Compass, label: 'Explore', active: true },
    { icon: GitBranch, label: 'Graph', active: false },
    { icon: BarChart2, label: 'Analysis', active: false },
  ];

  const toolItems = [
    { icon: Layers, label: 'Layers' },
    { icon: FileCode, label: 'Source' },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-16 glass-panel border-r border-cbct-border/30 flex flex-col items-center py-6 z-30 transition-all duration-300 hover:w-20">
      
      {/* Main Nav */}
      <nav className="flex-1 flex flex-col gap-4 w-full items-center">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            className={`p-3 rounded-xl transition-all duration-300 group relative ${
              item.active 
                ? 'bg-cbct-accent/20 text-cbct-accent shadow-[0_0_15px_rgba(56,189,248,0.15)]' 
                : 'text-cbct-muted hover:text-white hover:bg-white/5'
            }`}
            title={item.label}
          >
            <item.icon size={22} strokeWidth={item.active ? 2.5 : 2} />
            
            {/* Tooltip */}
            <span className="absolute left-14 bg-slate-900 border border-white/10 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </span>
            
            {/* Active Indicator */}
            {item.active && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cbct-accent rounded-r-full shadow-[0_0_10px_#38bdf8]" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Tools */}
      <div className="flex flex-col gap-4 w-full items-center pb-4">
        <div className="w-8 h-px bg-white/10" />
        {toolItems.map((item, idx) => (
          <button
            key={idx}
            className="p-3 text-cbct-muted hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 relative group"
            title={item.label}
          >
            <item.icon size={20} />
          </button>
        ))}
        <button className="mt-2 p-3 text-cbct-muted hover:text-white hover:bg-white/5 rounded-xl transition-colors">
          <HelpCircle size={20} />
        </button>
      </div>
    </aside>
  );
}
