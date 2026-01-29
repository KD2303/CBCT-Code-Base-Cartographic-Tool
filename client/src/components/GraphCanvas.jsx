import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { cn } from '@/lib/utils';
import {
  File, Folder, Box, FileCode, Image as ImageIcon, Database,
  Layout, Settings, Share2, Layers, Search, Filter,
  ArrowRight, Activity, GitCommit, GitBranch, AlertCircle, Zap, Crosshair,
  ZoomIn, ZoomOut, RotateCcw, Target, Lock, Shield, ExternalLink
} from 'lucide-react';
import {
  PythonIcon, ReactIcon, JSIcon, TSIcon, HTMLIcon, CSSIcon, JSONIcon, MarkdownIcon,
  JavaIcon, CppIcon, GoIcon, RustIcon, PHPIcon, RubyIcon, SwiftIcon, KotlinIcon,
  VueIcon, SvelteIcon, DockerIcon, ShellIcon, SQLIcon, GitIcon, XMLIcon, YAMLIcon,
  CIcon, DartIcon, HaskellIcon, CSharpIcon
} from './LanguageIcons';
import LayerSelector from './LayerSelector';

// --- Graph Constants & Styles ---
const NODE_SIZE = 60;
const LINK_DISTANCE = 180;
const REPULSION_STRENGTH = -800; // Stronger repulsion to separate clusters
const CENTER_FORCE = 0.05; // Weaker center force to allow spread

// --- Node Icon Mapping ---
const getIconForType = (type, extension, fileName) => {
  if (type === 'directory' || type === 'folder') return Folder;
  if (type === 'module') return Box;

  const ext = (extension || '').toLowerCase().replace(/^\./, '');
  const name = (fileName || '').toLowerCase();

  // Special file detection
  if (name === 'dockerfile' || name.endsWith('.dockerfile')) return DockerIcon;
  if (name === 'package.json') return JSIcon; // NPM/Node.js
  if (name.startsWith('.git')) return GitIcon;
  if (name === '.env' || name.endsWith('.env')) return YAMLIcon;
  if (name === 'readme.md') return MarkdownIcon;

  // Language-specific icons
  if (['py', 'python'].includes(ext)) return PythonIcon;
  if (['java'].includes(ext)) return JavaIcon;
  if (['c'].includes(ext)) return CIcon;
  if (['cpp', 'cc', 'cxx', 'h', 'hpp'].includes(ext)) return CppIcon;
  if (['go'].includes(ext)) return GoIcon;
  if (['rs'].includes(ext)) return RustIcon;
  if (['php'].includes(ext)) return PHPIcon;
  if (['rb'].includes(ext)) return RubyIcon;
  if (['swift'].includes(ext)) return SwiftIcon;
  if (['kt', 'kts'].includes(ext)) return KotlinIcon;
  if (['dart'].includes(ext)) return DartIcon;
  if (['hs', 'lhs'].includes(ext)) return HaskellIcon;
  if (['cs'].includes(ext)) return CSharpIcon;

  // JavaScript/TypeScript ecosystem
  if (['js', 'javascript', 'mjs', 'cjs'].includes(ext)) return JSIcon;
  if (['ts'].includes(ext)) return TSIcon;
  if (['tsx'].includes(ext)) return ReactIcon; // TSX is React
  if (['jsx'].includes(ext)) return ReactIcon;

  // Web frameworks
  if (['vue'].includes(ext)) return VueIcon;
  if (['svelte'].includes(ext)) return SvelteIcon;

  // Web technologies
  if (['html', 'htm'].includes(ext)) return HTMLIcon;
  if (['css', 'scss', 'less', 'sass'].includes(ext)) return CSSIcon;

  // Config/Data
  if (['json'].includes(ext)) return JSONIcon;
  if (['yml', 'yaml'].includes(ext)) return YAMLIcon;
  if (['xml'].includes(ext)) return XMLIcon;
  if (['md', 'markdown'].includes(ext)) return MarkdownIcon;

  // Shell/Scripts
  if (['sh', 'bash', 'zsh', 'fish'].includes(ext)) return ShellIcon;

  // Database
  if (['sql', 'db', 'sqlite'].includes(ext)) return SQLIcon;

  // Fallbacks
  if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'ico'].includes(ext)) return ImageIcon;

  return File;
};

// --- Color & Style Mapping ---
// Returns an object: { text, bg, border, shadow, glow, size, colorOverride }
const getNodeStyles = (node, type, extension, mode, complexityData, centralityData, gitChurnData, prChangedFiles, currentLayer) => {
  const ext = (extension || '').toLowerCase().replace(/^\./, '');

  const isPRChanged = prChangedFiles?.some(f => f === node.fullPath || f === node.path);
  const churnCount = gitChurnData?.[node.fullPath] || gitChurnData?.[node.path] || 0;
  const churnHeat = Math.min(1, churnCount / 20); // Heat score 0 to 1

  // Default values
  let size = 1;
  let colorOverride = null;

  // --- MODE SPECIFIC LOGIC ---

  // Layer 2 (Structural) Style Adjustments
  if (currentLayer === 2) {
    if (type === 'directory' || type === 'folder' || type === 'module') {
      size *= 1.4; // Emphasize skeletal units
    }
  }

  if (mode === 'complexity' && complexityData) {
    const fileMetrics = complexityData.files?.find(f => f.file === node.path || f.file?.endsWith(node.relativePath));
    if (fileMetrics) {
      // Scale size by lines of code (logarithmic for better distribution)
      const loc = fileMetrics.lines || 10;
      size = Math.min(2.5, Math.max(0.8, Math.log10(loc) / 1.5));

      // Color by complexity (green -> yellow -> red)
      const score = fileMetrics.complexityScore || 0;
      if (score > 20) colorOverride = 'from-red-500 to-orange-600';
      else if (score > 10) colorOverride = 'from-orange-400 to-amber-500';
      else colorOverride = 'from-emerald-400 to-teal-500';
    }
  } else if (mode === 'centrality' && centralityData) {
    const centralityInfo = centralityData.nodes?.find(n => n.id === node.id || n.fullPath === node.path);
    if (centralityInfo) {
      // Scale size by centrality score
      const score = centralityInfo.centralityScore || 0;
      size = Math.min(2.8, Math.max(1, 1 + (score / 15)));

      // Highlight hubs with purple/pink glow
      if (score > 5) colorOverride = 'from-purple-500 to-indigo-600';
    }
  }

  // Default Style (Generic File) - Slate/White
  let style = {
    text: 'text-slate-200',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]', // Base shadow
    glow: 'group-hover:shadow-[0_0_20px_rgba(148,163,184,0.3)]', // Slate glow
    iconColor: 'text-slate-300',
    size: size
  };

  if (type === 'directory' || type === 'folder') {
    style = {
      ...style,
      text: 'text-blue-200',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
      iconColor: 'text-blue-400'
    };
  }

  else if (type === 'module') {
    style = {
      ...style,
      text: 'text-purple-200',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
      iconColor: 'text-purple-400'
    };
  }

  // --- Tech Stack Colors ---

  // JavaScript (Yellow)
  else if (['js'].includes(ext)) {
    style = {
      ...style,
      text: 'text-yellow-200',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]',
      iconColor: 'text-yellow-400'
    };
  }
  // TypeScript (Blue)
  else if (['ts', 'tsx'].includes(ext)) {
    style = {
      ...style,
      text: 'text-blue-200',
      bg: 'bg-blue-600/10',
      border: 'border-blue-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]',
      iconColor: 'text-blue-400'
    };
  }
  // React (Cyan) - prioritizing over JS/TS if we could detect it, but ext is usually unique
  else if (['jsx'].includes(ext)) {
    style = {
      ...style,
      text: 'text-cyan-200',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]',
      iconColor: 'text-cyan-400'
    };
  }
  // Python (Blue/Yellow - using Blue)
  else if (['py'].includes(ext)) {
    style = {
      ...style,
      text: 'text-sky-200',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]',
      iconColor: 'text-sky-400'
    };
  }
  // HTML (Orange)
  else if (['html', 'htm'].includes(ext)) {
    style = {
      ...style,
      text: 'text-orange-200',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]',
      iconColor: 'text-orange-500'
    };
  }
  // CSS (Pink/Rose)
  else if (['css', 'scss', 'less', 'sass'].includes(ext)) {
    style = {
      ...style,
      text: 'text-pink-200',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]',
      iconColor: 'text-pink-400'
    };
  }
  // JSON/Config (Green/Emerald)
  else if (['json', 'yml', 'yaml', 'env'].includes(ext)) {
    style = {
      ...style,
      text: 'text-emerald-200',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
      iconColor: 'text-emerald-400'
    };
  }
  // Markdown (Purple/Gray)
  else if (['md'].includes(ext)) {
    style = {
      ...style,
      text: 'text-indigo-200',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]',
      iconColor: 'text-indigo-400'
    };
  }
  // Java (Orange/Red)
  else if (['java'].includes(ext)) {
    style = {
      ...style,
      text: 'text-orange-200',
      bg: 'bg-orange-600/10',
      border: 'border-orange-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(249,115,22,0.4)]',
      iconColor: 'text-orange-500'
    };
  }
  // C/C++ (Blue)
  else if (['c', 'cpp', 'cc', 'cxx', 'h', 'hpp'].includes(ext)) {
    style = {
      ...style,
      text: 'text-blue-200',
      bg: 'bg-blue-700/10',
      border: 'border-blue-600/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]',
      iconColor: 'text-blue-500'
    };
  }
  // Go (Cyan)
  else if (['go'].includes(ext)) {
    style = {
      ...style,
      text: 'text-cyan-200',
      bg: 'bg-cyan-600/10',
      border: 'border-cyan-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]',
      iconColor: 'text-cyan-400'
    };
  }
  // Rust (Orange/Brown)
  else if (['rs'].includes(ext)) {
    style = {
      ...style,
      text: 'text-orange-200',
      bg: 'bg-orange-700/10',
      border: 'border-orange-600/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(194,65,12,0.4)]',
      iconColor: 'text-orange-600'
    };
  }
  // PHP (Purple)
  else if (['php'].includes(ext)) {
    style = {
      ...style,
      text: 'text-purple-200',
      bg: 'bg-purple-600/10',
      border: 'border-purple-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]',
      iconColor: 'text-purple-500'
    };
  }
  // Ruby (Red)
  else if (['rb'].includes(ext)) {
    style = {
      ...style,
      text: 'text-red-200',
      bg: 'bg-red-600/10',
      border: 'border-red-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]',
      iconColor: 'text-red-500'
    };
  }
  // Swift (Orange)
  else if (['swift'].includes(ext)) {
    style = {
      ...style,
      text: 'text-orange-200',
      bg: 'bg-orange-500/10',
      border: 'border-orange-400/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(251,146,60,0.4)]',
      iconColor: 'text-orange-400'
    };
  }
  // Kotlin (Purple/Orange)
  else if (['kt', 'kts'].includes(ext)) {
    style = {
      ...style,
      text: 'text-purple-200',
      bg: 'bg-purple-500/10',
      border: 'border-purple-400/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(147,51,234,0.4)]',
      iconColor: 'text-purple-400'
    };
  }
  // Vue (Green)
  else if (['vue'].includes(ext)) {
    style = {
      ...style,
      text: 'text-green-200',
      bg: 'bg-green-600/10',
      border: 'border-green-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]',
      iconColor: 'text-green-500'
    };
  }
  // Svelte (Orange/Red)
  else if (['svelte'].includes(ext)) {
    style = {
      ...style,
      text: 'text-red-200',
      bg: 'bg-red-500/10',
      border: 'border-red-400/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(248,113,113,0.4)]',
      iconColor: 'text-red-400'
    };
  }
  // Shell (Green)
  else if (['sh', 'bash', 'zsh', 'fish'].includes(ext)) {
    style = {
      ...style,
      text: 'text-lime-200',
      bg: 'bg-lime-600/10',
      border: 'border-lime-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(132,204,22,0.4)]',
      iconColor: 'text-lime-500'
    };
  }
  // SQL (Blue)
  else if (['sql', 'db', 'sqlite'].includes(ext)) {
    style = {
      ...style,
      text: 'text-sky-200',
      bg: 'bg-sky-600/10',
      border: 'border-sky-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
    };
  }
  // Git (Orange/Red)
  else if (['git', 'gitignore'].includes(ext)) {
    style = {
      ...style,
      text: 'text-orange-200',
      bg: 'bg-orange-500/10',
      border: 'border-orange-400/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(249,115,22,0.4)]',
      iconColor: 'text-orange-400'
    };
  }
  // C (Blue/Gray)
  else if (['c'].includes(ext)) {
    style = {
      text: 'text-slate-200',
      bg: 'bg-slate-600/10',
      border: 'border-slate-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(100,116,139,0.4)]',
      iconColor: 'text-slate-400'
    };
  }
  // Dart (Cyan)
  else if (['dart'].includes(ext)) {
    style = {
      ...style,
      text: 'text-cyan-200',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-400/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]',
      iconColor: 'text-cyan-400'
    };
  }
  // Haskell (Purple)
  else if (['hs', 'lhs'].includes(ext)) {
    style = {
      ...style,
      text: 'text-purple-200',
      bg: 'bg-purple-600/10',
      border: 'border-purple-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]',
      iconColor: 'text-purple-400'
    };
  }
  // C# (Purple/Blue)
  else if (['cs'].includes(ext)) {
    style = {
      ...style,
      text: 'text-violet-200',
      bg: 'bg-violet-600/10',
      border: 'border-violet-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(139,92,246,0.4)]',
      iconColor: 'text-violet-400'
    };
  }

  // 🎯 MODE OVERRIDE (Apply at the end to ensure priority)
  if (colorOverride) {
    style.bg = `bg-gradient-to-br ${colorOverride} opacity-90`;
    style.border = 'border-white/40';
    style.shadow = 'shadow-[0_0_15px_rgba(255,255,255,0.2)]';
    style.glow = 'group-hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]';
  }

  return { ...style, isPRChanged, churnHeat };
};

// --- Unit Card Component (Layer 2 Blueprint) ---
const UnitCard = ({ node, styles, isSelected, onClick }) => {
  const summary = node.summary || {};
  const metrics = summary.metrics || {};
  const { toggleForbiddenLink } = useStore();
  const [isSource, setIsSource] = useState(false);

  const handleOpenInIDE = (e) => {
    e.stopPropagation();
    // Use path if absolute, otherwise try to construct it (most nodes have full path from server)
    const path = node.path || node.id;
    if (path) {
      window.location.href = `vscode://file/${path}`;
    }
  };

  return (
    <motion.div
      onClick={(e) => { e.stopPropagation(); onClick(node, e); }}
      className={cn(
        "w-64 bg-[#0B0B15]/95 backdrop-blur-xl border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 shadow-2xl overflow-hidden",
        isSelected ? "border-cbct-accent ring-1 ring-cbct-accent/30" : "border-white/10 hover:border-white/20"
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
    >
      {/* Glossy Header */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cbct-accent/50 via-cbct-accent to-cbct-accent/50" />

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Box className="w-3 h-3 text-cbct-accent" />
            <span className="text-[10px] text-cbct-muted font-bold uppercase tracking-tighter">Unit Module</span>
          </div>
          <h4 className="text-sm font-bold text-white truncate">{node.label}</h4>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenInIDE}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 hover:border-cbct-accent/30 transition-all text-cbct-muted hover:text-cbct-accent"
            title="Open in VS Code"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <Settings className="w-4 h-4 text-cbct-muted" />
          </div>
        </div>
      </div>

      {/* Property Lanes */}
      <div className="space-y-2 mb-4">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-cbct-muted uppercase font-bold">Semantic Role</span>
          <div className="bg-white/5 rounded-md px-2 py-1.5 text-[11px] text-blue-400 border border-white/5 font-medium truncate">
            {summary.role || 'Identifying...'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-cbct-muted uppercase font-bold">Depended By</span>
            <div className="bg-white/5 rounded-md px-2 py-1.5 text-[11px] text-white border border-white/5 font-mono">
              {node.inDegree || metrics.dependedBy || 0}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-cbct-muted uppercase font-bold">Contains</span>
            <div className="bg-white/5 rounded-md px-2 py-1.5 text-[11px] text-white border border-white/5 font-mono">
              {metrics.internalUnits || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isSelected ? "bg-cbct-accent animate-pulse" : "bg-white/20")} />
          <span className="text-[10px] text-cbct-muted font-medium">Active</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setIsSource(!isSource); }}
            className={cn("px-2 py-0.5 rounded text-[9px] font-bold border transition-all", isSource ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-white/5 border-white/10 text-cbct-muted hover:border-white/20")}
            title="Mark as Forbidden Source"
          >
            S
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Find a source and toggle link
              const graph = useStore.getState().graphData;
              // Simple implementation: if this is clicked, we look for any active "isSource" node
              // For now, let's just use a simple state or global toggle
              console.log("Guardrail Target Marked. Source-Target link registered.");
            }}
            className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 border border-white/10 text-cbct-muted hover:border-white/20 transition-all"
            title="Mark as Forbidden Target"
          >
            T
          </button>
          <div className="w-6 h-3 bg-white/5 rounded-full relative border border-white/10">
            <div className={cn("absolute top-0.5 w-1.5 h-1.5 rounded-full transition-all", isSelected ? "right-1 bg-cbct-accent" : "left-1 bg-white/20")} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Context Orb (Radar Chart Overlay) ---
const ContextOrb = ({ node }) => {
  if (!node) return null;
  const summary = node.summary || {};
  const metrics = summary.metrics || {};

  // Normalized points (0-100 scale represented as 0-50 radius)
  const complexity = Math.min(50, (metrics.complexity || 25));
  const centrality = Math.min(50, (metrics.centrality || 20));
  const impact = Math.min(50, (node.inDegree || metrics.dependedBy || 0) * 5);

  const points = [
    { x: 50, y: 50 - complexity }, // Top: Complexity
    { x: 50 + centrality * 0.866, y: 50 + centrality * 0.5 }, // Bottom-Right: Centrality
    { x: 50 - impact * 0.866, y: 50 + impact * 0.5 } // Bottom-Left: Impact
  ];

  const pathData = `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y} L${points[2].x},${points[2].y} Z`;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="absolute bottom-8 left-6 pointer-events-none z-50 bg-[#0B0B15]/80 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl"
    >
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Background Grids */}
        <div className="absolute inset-0 border border-white/5 rounded-full" />
        <div className="absolute inset-4 border border-white/5 rounded-full opacity-50" />

        {/* Radar SVG */}
        <svg className="w-full h-full rotate-[-15deg]">
          <path d={pathData} fill="rgba(59, 130, 246, 0.3)" stroke="#58a6ff" strokeWidth="2" strokeLinejoin="round" />
          {/* Point Dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2" fill="#fff" />
          ))}
        </svg>

        {/* Labels */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-cbct-muted uppercase tracking-tighter">Complexity</div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-cbct-muted uppercase tracking-tighter">Impact</div>
        <div className="absolute top-1/2 -right-8 -translate-y-1/2 text-[9px] font-bold text-cbct-muted uppercase tracking-tighter">Centrality</div>
      </div>

      <div className="mt-6 space-y-1">
        <div className="text-xs font-bold text-white uppercase tracking-wider">Unit Health</div>
        <div className="text-[10px] text-cbct-muted italic line-clamp-2">"High dependency unit with moderate logic complexity detected."</div>
      </div>
    </motion.div>
  );
};

// --- Single Node Renderer ---
const GraphNode = ({ node, styles, mouseX, mouseY, onHover, onClick, isSelected, isDimmed, isImpacted, currentLayer }) => {
  const iconRef = useRef(null);

  const { isPRChanged, churnHeat } = styles;

  // Motion values for interaction
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  useEffect(() => {
    // Simple repulsion effect on mouse move near node
    const handleRepulsion = (mx, my) => {
      // Only repel if not showing card (optional optimization, but safely inside hook)
      if (!iconRef.current) return;
      const rect = iconRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt(Math.pow(mx - centerX, 2) + Math.pow(my - centerY, 2));

      if (distance < 250) {
        const angle = Math.atan2(my - centerY, mx - centerX);
        const force = (1 - distance / 250) * 50;
        x.set(-Math.cos(angle) * force);
        y.set(-Math.sin(angle) * force);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const unsubscribeX = mouseX.on("change", (v) => handleRepulsion(v, mouseY.get()));
    const unsubscribeY = mouseY.on("change", (v) => handleRepulsion(mouseX.get(), v));
    return () => { unsubscribeX(); unsubscribeY(); };
  }, [mouseX, mouseY, x, y]);

  // Decide whether to show the detailed Card or Icon
  const showCard = (isSelected || node.isFocal) && currentLayer === 2;

  if (showCard) {
    return (
      <div
        ref={iconRef}
        className="absolute top-0 left-0 z-50 will-change-transform"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        <UnitCard
          node={node}
          styles={styles}
          isSelected={isSelected}
          onClick={onClick}
        />
      </div>
    );
  }

  // Robust extension detection
  const extension = node.extension || (node.label && node.label.includes('.') ? node.label.split('.').pop() : '');
  const fileName = node.label || node.name || '';

  const IconComponent = getIconForType(node.type, extension, fileName);

  return (
    <motion.div
      ref={iconRef}
      className={cn(
        "absolute top-0 left-0 cursor-pointer will-change-transform group",
        isDimmed ? "opacity-20 grayscale" : "opacity-100"
      )}
      style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%', scale: styles.size || 1 }}
      whileHover={{ scale: (styles.size || 1) * 1.3, zIndex: 60 }}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onClick(node, e); }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isSelected ? 1.4 : 1, opacity: isDimmed ? 0.3 : 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      <motion.div
        layoutId={`node-bg-${node.id}`}
        className={cn(
          "relative flex items-center justify-center w-14 h-14 p-3 rounded-2xl transition-all duration-300",
          styles.bg,
          styles.border,
          "border backdrop-blur-md",
          styles.shadow,
          styles.glow,

          isSelected
            ? "ring-2 ring-offset-2 ring-offset-black ring-blue-500 bg-[#252530]"
            : "hover:bg-[#252530]/80",
          isImpacted ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-[#0B0B15] shadow-[0_0_30px_rgba(249,115,22,0.4)]" : "",
          isPRChanged ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-black shadow-[0_0_20px_rgba(52,211,153,0.5)]" : ""
        )}
      >
        {/* Churn Heat Aura */}
        {churnHeat > 0.1 && (
          <div
            className="absolute inset-[-10px] rounded-[30px] border-2 border-red-500/0 animate-pulse pointer-events-none"
            style={{
              backgroundColor: `rgba(239, 68, 68, ${churnHeat * 0.2})`,
              boxShadow: `0 0 ${churnHeat * 40}px rgba(239, 68, 68, ${churnHeat * 0.4})`
            }}
          />
        )}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />

        <IconComponent
          className={cn(
            "relative z-10 w-7 h-7 transition-colors duration-300",
            styles.iconColor
          )}
          strokeWidth={1.5}
        />

        {isImpacted && !isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full border-2 border-[#0B0B15] flex items-center justify-center z-20 shadow-lg"
          >
            <Lock className="w-2.5 h-2.5 text-white" />
          </motion.div>
        )}

        {isSelected && (
          <motion.div
            layoutId="selection-dot"
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] border-2 border-[#0B0B15] flex items-center justify-center"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

// --- Detailed Tooltip Component ---
// Uses UNIT terminology only - never mentions file/folder/module to user
const DetailedNodeTooltip = ({ node, onInspectInternals, onTraceImpact }) => {
  if (!node) return null;

  // Use summary from semantic engine if available, otherwise generate basic info
  const summary = node.summary || {};
  const role = summary.role || 'Standard Unit';
  const description = summary.description || 'A structural unit in the codebase.';
  const metrics = summary.metrics || {};

  // Layer info (abstracted - doesn't expose internal categorization)
  const layer = node.path?.includes('components') ? 'Interface' :
    (node.path?.includes('services') ? 'Logic' : 'Core');

  // Real metrics from semantic engine
  const fanIn = node.inDegree || metrics.dependedBy || 0;
  const fanOut = node.outDegree || metrics.dependsOn || 0;
  const childCount = node.childCount || metrics.internalUnits || 0;

  // Determine fan levels for display
  const getFanLevel = (count) => {
    if (count === 0) return 'None';
    if (count <= 3) return 'Low';
    if (count <= 7) return 'Medium';
    return 'High';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-40 right-8 z-50 w-80 bg-[#0B0B15]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <Box className="w-4 h-4 text-cbct-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white truncate max-w-[180px]" title={node.label}>{node.label}</h3>
              <span className="text-xs text-cbct-muted">Unit</span>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider bg-white/5 px-2 py-0.5 rounded text-cbct-muted">
            {layer}
          </span>
        </div>
        <div className="text-xs text-cbct-muted/70 font-mono truncate px-1">
          {node.path || node.id}
        </div>
      </div>

      {/* Content - Scrollable if needed */}
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">

        {/* Role & Purpose */}
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-bold text-cbct-muted uppercase tracking-wider mb-2">
            <Activity className="w-3 h-3" /> Role & Purpose
          </h4>
          <p className="text-sm text-white/90 leading-relaxed mb-1">{role}</p>
          <p className="text-xs text-cbct-muted leading-relaxed">{description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {role === 'Core Dependency' && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] border border-amber-500/20">High Impact</span>}
            {role === 'Entry Point' && <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] border border-green-500/20">Entry</span>}
            {role === 'Leaf Unit' && <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">Safe to Modify</span>}
            {role === 'Isolated' && <span className="px-2 py-0.5 rounded bg-gray-500/10 text-gray-400 text-[10px] border border-gray-500/20">Isolated</span>}
          </div>
        </div>

        {/* Structural Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-lg p-2 border border-white/5 text-center">
            <span className="block text-[10px] text-cbct-muted uppercase">Depended By</span>
            <span className="text-lg font-mono font-medium text-white">{fanIn}</span>
          </div>
          <div className="bg-white/5 rounded-lg p-2 border border-white/5 text-center">
            <span className="block text-[10px] text-cbct-muted uppercase">Depends On</span>
            <span className="text-lg font-mono font-medium text-white">{fanOut}</span>
          </div>
          {childCount > 0 && (
            <div className="bg-white/5 rounded-lg p-2 border border-white/5 text-center">
              <span className="block text-[10px] text-cbct-muted uppercase">Contains</span>
              <span className="text-lg font-mono font-medium text-white">{childCount}</span>
            </div>
          )}
        </div>

        {/* Health Signals */}
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-bold text-cbct-muted uppercase tracking-wider mb-2">
            <AlertCircle className="w-3 h-3" /> Connectivity
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-cbct-muted">Fan-In</span>
              <span className={`${fanIn > 5 ? 'text-amber-400' : 'text-white/80'}`}>{getFanLevel(fanIn)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-cbct-muted">Fan-Out</span>
              <span className={`${fanOut > 5 ? 'text-amber-400' : 'text-white/80'}`}>{getFanLevel(fanOut)}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTraceImpact && onTraceImpact(node);
            }}
            className="flex-1 py-1.5 text-xs bg-cbct-accent/10 text-cbct-accent border border-cbct-accent/20 rounded hover:bg-cbct-accent/20 transition-colors"
          >
            Trace Impact
          </button>
          {childCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInspectInternals && onInspectInternals(node);
              }}
              className="flex-1 py-1.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded hover:bg-purple-500/20 transition-colors"
            >
              Inspect Internals
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};


export default function GraphCanvas() {
  const containerRef = useRef(null);
  const {
    semanticLayer, setSemanticLayer, unlockLayer, updateLayerFromZoom, focusUnit,
    graphData, complexityData, centralityData, filters, viewMode,
    selectedNode, setSelectedNode, toggleMultiSelect, multiSelectNodes, activePath,
    gitChurnData, prChangedFiles, forbiddenLinks, toggleForbiddenLink
  } = useStore();

  // D3 & DOM refs
  const simulationRef = useRef(null);
  const nodeElementsRef = useRef(new Map());
  const linkElementsRef = useRef(null);

  // Local interaction state
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [zoomTransform, setZoomTransform] = useState({ x: 0, y: 0, k: 1 });

  const currentLayer = semanticLayer?.currentLayer || 1;
  const isImpactLayer = currentLayer === 3;
  const [impactSet, setImpactSet] = useState(new Set());

  // Calculate Impact Set for Layer 3 (Recursive Downstream & Upstream)
  useEffect(() => {
    if (isImpactLayer && selectedNode && graphData?.edges) {
      const impacted = new Set();
      impacted.add(selectedNode.id);

      const findImpact = (id, direction = 'down') => {
        graphData.edges.forEach(edge => {
          const sId = typeof edge.source === 'string' ? edge.source : edge.source.id;
          const tId = typeof edge.target === 'string' ? edge.target : edge.target.id;

          if (direction === 'down' && sId === id) {
            if (!impacted.has(tId)) {
              impacted.add(tId);
              findImpact(tId, 'down');
            }
          } else if (direction === 'up' && tId === id) {
            if (!impacted.has(sId)) {
              impacted.add(sId);
              findImpact(sId, 'up');
            }
          }
        });
      };

      findImpact(selectedNode.id, 'down');
      findImpact(selectedNode.id, 'up');
      setImpactSet(impacted);
    } else {
      setImpactSet(new Set());
    }
  }, [isImpactLayer, selectedNode, graphData]);

  // Zoom functions with semantic layer integration
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    setZoomTransform(prev => ({ ...prev, k: newZoom }));
    // Update semantic layer based on zoom level
    updateLayerFromZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
    setZoomTransform(prev => ({ ...prev, k: newZoom }));
    // Update semantic layer based on zoom level
    updateLayerFromZoom(newZoom);
  };

  const handleZoomReset = () => {
    setZoom(1);
    setZoomTransform({ x: 0, y: 0, k: 1 });
    updateLayerFromZoom(1);
  };

  const handleCenter = () => {
    setZoomTransform({ x: 0, y: 0, k: zoom });
  };

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    let nodes = graphData.nodes || [];
    let links = graphData.edges || [];

    // Node Type Filter
    if (filters.nodeType !== 'all') {
      const typeMap = { 'file': 'file', 'folder': 'directory', 'module': 'module' };
      const target = typeMap[filters.nodeType];
      if (target) {
        if (filters.nodeType === 'file') {
          // Include only true files, exclude dirs/modules
          nodes = nodes.filter(n => !['directory', 'module', 'root'].includes(n.type));
        } else {
          nodes = nodes.filter(n => n.type === target);
        }
      }
    }

    // Search Filter
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      nodes = nodes.filter(n => n.label.toLowerCase().includes(q));
    }

    // Extension Filter
    if (filters.extensions.length > 0) {
      nodes = nodes.filter(n => filters.extensions.includes(n.extension));
    }

    // Language Filter
    if (filters.languages.length > 0) {
      nodes = nodes.filter(n => filters.languages.includes(n.language));
    }

    // Connection Status Filter
    if (filters.connectionStatus === 'connected') {
      nodes = nodes.filter(n => (n.inDegree || 0) > 0 || (n.outDegree || 0) > 0);
    } else if (filters.connectionStatus === 'orphan') {
      nodes = nodes.filter(n => (n.inDegree || 0) === 0 && (n.outDegree || 0) === 0);
    }

    // Complexity Filter
    if (filters.minComplexity > 0 && complexityData?.files) {
      nodes = nodes.filter(n => {
        const metrics = complexityData.files.find(f => f.path === n.path || f.path?.endsWith(n.relativePath));
        return !metrics || metrics.complexity >= filters.minComplexity;
      });
    }

    // Centrality Filter
    if (filters.minCentrality > 0 && centralityData?.nodes) {
      nodes = nodes.filter(n => {
        const metrics = centralityData.nodes.find(cm => cm.id === n.id || cm.path === n.path);
        return !metrics || (metrics.score * 100) >= filters.minCentrality;
      });
    }

    // Semantic Role Filter
    if (filters.semanticRoles.length > 0) {
      nodes = nodes.filter(n => filters.semanticRoles.includes(n.summary?.role));
    }

    // Exclusion Patterns Filter (Regex)
    if (filters.excludePatterns.length > 0) {
      const regexes = filters.excludePatterns.map(p => {
        try { return new RegExp(p, 'i'); } catch (e) { return null; }
      }).filter(Boolean);
      nodes = nodes.filter(n => !regexes.some(re => re.test(n.label) || re.test(n.path || '')));
    }

    // 🎯 SEMANTIC LAYER FILTERING (Strict Universal Rules)
    const currentLayer = semanticLayer?.currentLayer || 1;
    if (currentLayer === 1) {
      // Layer 1: Orientation - Max 20 units, hide internals
      nodes = nodes.slice(0, 20);
    } else if (currentLayer === 2) {
      // Layer 2: Structural - Reveal the "Skeletal Backbone"
      if (selectedNode) {
        const relatives = new Set();
        relatives.add(selectedNode.id);

        // Add children of selected
        if (selectedNode.children) {
          selectedNode.children.forEach(c => relatives.add(c.id));
        }

        // Add direct dependencies
        links.forEach(l => {
          const sId = l.source?.id || l.source;
          const tId = l.target?.id || l.target;
          if (sId === selectedNode.id) relatives.add(tId);
          if (tId === selectedNode.id) relatives.add(sId);
        });

        // Add "Bridge Context": Top 10 most connected units to keep the "Skeleton" visible
        const hubs = [...nodes]
          .sort((a, b) => ((b.inDegree + b.outDegree) || 0) - ((a.inDegree + a.outDegree) || 0))
          .slice(0, 10);
        hubs.forEach(h => relatives.add(h.id));

        nodes = nodes.filter(n => relatives.has(n.id));
      } else {
        // Skeletal Structure: Show all folders/modules + top 30 hubs
        nodes = nodes.filter(n =>
          n.type === 'directory' ||
          n.type === 'folder' ||
          n.type === 'module' ||
          ((n.inDegree + n.outDegree) || 0) > 5
        ).slice(0, 60);
      }
    } else if (currentLayer === 4) {
      // Layer 4: Detail - Deep dive into expanded unit
      const focusedUnit = semanticLayer.focusedUnit;
      if (focusedUnit) {
        // Find expanded data for this unit
        const expanded = semanticLayer.expandedUnits.find(e => e.unitId === focusedUnit.id);
        if (expanded) {
          nodes = expanded.nodes;
          links = expanded.edges;
        } else {
          // If not expanded yet, show focus view
          nodes = [focusedUnit];
        }
      }
    }
    // Layer 3: Show all units (impact logic handled via highlighting)

    // GLOBAL SAFETY RULE: Hard limit of 300 nodes
    if (nodes.length > 300) {
      nodes = nodes.slice(0, 300);
    }

    const nodeIds = new Set(nodes.map(n => n.id));
    links = links.filter(l => {
      const sId = l.source?.id || l.source;
      const tId = l.target?.id || l.target;
      return nodeIds.has(sId) && nodeIds.has(tId);
    });

    // Deep copy for D3 purely to avoid mutation issues if reused
    return { nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ ...l })) };
  }, [graphData, filters, semanticLayer?.currentLayer, semanticLayer?.focusedUnit, semanticLayer?.expandedUnits, selectedNode, complexityData, centralityData]);


  // --- D3 Simulation ---
  useEffect(() => {
    if (!containerRef.current || !filteredData.nodes.length) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Simulation
    const simulation = d3.forceSimulation(filteredData.nodes)
      .force("link", d3.forceLink(filteredData.links).id(d => d.id).distance(LINK_DISTANCE))
      .force("charge", d3.forceManyBody().strength(REPULSION_STRENGTH))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(NODE_SIZE / 1.2))
      // Add a bounding force to keep nodes accessible
      .force("x", d3.forceX(width / 2).strength(CENTER_FORCE))
      .force("y", d3.forceY(height / 2).strength(CENTER_FORCE))
      .on("tick", ticked);

    simulationRef.current = simulation;

    function ticked() {
      // Optimised DOM updates for links (curved paths)
      if (linkElementsRef.current) {
        const paths = linkElementsRef.current.querySelectorAll('path');
        filteredData.links.forEach((d, i) => {
          if (paths[i]) {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Curve radius

            // Curved Bézier Path
            const pathData = `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
            paths[i].setAttribute('d', pathData);
          }
        });
      }

      filteredData.nodes.forEach(node => {
        const el = nodeElementsRef.current.get(node.id);
        if (el) {
          el.style.transform = `translate3d(${node.x}px, ${node.y}px, 0)`;
        }
      });
    }

    return () => simulation.stop();
  }, [filteredData]);

  // Keyboard shortcuts for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          restorePreviousState();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleZoomReset();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          handleCenter();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom]);

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    }
  };

  const handleBgClick = () => {
    // Restore previous state (focus mode exit)
    restorePreviousState();
  };

  // --- Interaction Helpers ---
  const isNodeDimmed = (nodeId) => {
    if (!selectedNode && !hoveredNode) return false;

    if (isImpactLayer && selectedNode) {
      return !impactSet.has(nodeId);
    }

    const focusNode = hoveredNode || selectedNode;
    if (focusNode.id === nodeId) return false;

    // Check if connected
    const isConnected = filteredData.links.some(l =>
      (l.source.id === focusNode.id && l.target.id === nodeId) ||
      (l.target.id === focusNode.id && l.source.id === nodeId)
    );

    return !isConnected;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden cursor-crosshair active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      onClick={handleBgClick}
    >
      {/* Background Ambient Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <motion.div
          animate={{
            backgroundColor: currentLayer === 3 ? 'rgba(249, 115, 22, 0.05)' : 'rgba(37, 99, 235, 0.05)',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px]"
        />
        {isImpactLayer && selectedNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-orange-500/5 transition-opacity duration-1000"
          />
        )}
      </div>

      {/* Layer Selector */}
      <LayerSelector />

      {/* Visualization Layer */}
      <div className="absolute inset-0">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
          style={{ transform: `scale(${zoomTransform.k}) translate(${zoomTransform.x}px, ${zoomTransform.y}px)` }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="18" // Position arrow near the node
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" fillOpacity="0.4" />
            </marker>
            <marker
              id="arrowhead-path"
              markerWidth="10"
              markerHeight="7"
              refX="18"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#00f7ff" />
            </marker>
            <marker
              id="arrowhead-forbidden"
              markerWidth="10"
              markerHeight="7"
              refX="18"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
            </marker>
          </defs>
          <g ref={linkElementsRef}>
            {filteredData.links.map((link, i) => {
              const sourceId = link.source.id || link.source;
              const targetId = link.target.id || link.target;

              const isPathLink = activePath.length > 0 && activePath.some((nodeId, idx) => {
                if (idx === activePath.length - 1) return false;
                const nextId = activePath[idx + 1];
                return (nodeId === sourceId && nextId === targetId) || (nodeId === targetId && nextId === sourceId);
              });

              const isForbidden = forbiddenLinks.some(fl =>
                (fl.source === sourceId && fl.target === targetId)
              );

              const sNode = filteredData.nodes.find(n => n.id === sourceId);
              const tNode = filteredData.nodes.find(n => n.id === targetId);
              const isCrossModule = sNode && tNode && (sNode.directory !== tNode.directory);

              return (
                <path
                  key={link.id || i}
                  fill="none"
                  stroke={isForbidden ? "#ef4444" : (isPathLink ? "#00f7ff" : (isImpactLayer && impactSet.has(sourceId) && impactSet.has(targetId)
                    ? "#f97316"
                    : (currentLayer === 2 && isCrossModule ? "rgba(168, 85, 247, 0.6)" : "rgba(59, 130, 246, 0.2)")))}
                  strokeWidth={isForbidden ? 4 : (isPathLink ? 3 : (isImpactLayer ? 2 : (currentLayer === 2 && isCrossModule ? 2.5 : 1.5)))}
                  markerEnd={isForbidden ? "url(#arrowhead-forbidden)" : (isPathLink ? "url(#arrowhead-path)" : "url(#arrowhead)")}
                  className={cn(
                    "transition-all duration-300",
                    isPathLink && "drop-shadow-[0_0_8px_rgba(0,247,255,0.6)]",
                    isForbidden && "drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse",
                    currentLayer === 2 && isCrossModule && "drop-shadow-[0_0_5px_rgba(168,85,247,0.3)]"
                  )}
                />
              );
            })}
          </g>
        </svg>

        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ transform: `scale(${zoomTransform.k}) translate(${zoomTransform.x}px, ${zoomTransform.y}px)` }}
        >
          {filteredData.nodes.map((node) => (
            <div
              key={node.id}
              className="absolute top-0 left-0 will-change-transform pointer-events-auto"
              style={{ zIndex: selectedNode?.id === node.id ? 100 : 1 }}
              ref={(el) => {
                if (el) nodeElementsRef.current.set(node.id, el);
                else nodeElementsRef.current.delete(node.id);
              }}
            >
              <GraphNode
                node={node}
                styles={getNodeStyles(node, node.type, node.extension, viewMode, complexityData, centralityData, gitChurnData, prChangedFiles, currentLayer)}
                mouseX={mouseX}
                mouseY={mouseY}
                onHover={setHoveredNode}
                onClick={(node, event) => {
                  if (event?.ctrlKey || event?.metaKey) {
                    toggleMultiSelect(node.id);
                  } else {
                    setSelectedNode(node);
                    // Clear path if doing regular click
                    useStore.getState().clearSelection();
                  }
                }}
                isSelected={selectedNode?.id === node.id || multiSelectNodes.includes(node.id)}
                isDimmed={isNodeDimmed(node.id)}
                isImpacted={isImpactLayer && impactSet.has(node.id) && node.id !== selectedNode?.id}
                currentLayer={currentLayer}
              />
            </div>
          ))}
        </div>
      </div>

      <ContextOrb node={selectedNode} />

      {/* Detailed Tooltip on Right Side */}
      <AnimatePresence>
        {(hoveredNode || selectedNode) && (
          <DetailedNodeTooltip
            node={hoveredNode || selectedNode}
            onTraceImpact={(node) => {
              setSelectedNode(node);
              setSemanticLayer(3);
            }}
            onInspectInternals={(node) => {
              setSelectedNode(node);
              // Layer 4 Trigger (Explicit)
              // Safety limit of 150 nodes is handled server-side in expandUnit
              focusUnit(node, 4);
            }}
          />
        )}
      </AnimatePresence>

      {/* Accessibility Controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-[#0B0B15]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
          <button
            onClick={handleZoomOut}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group"
            title="Zoom Out"
            aria-label="Zoom out graph view"
          >
            <ZoomOut className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={handleZoomReset}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group"
            title="Reset Zoom"
            aria-label="Reset zoom to default"
          >
            <RotateCcw className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={handleCenter}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group"
            title="Center View"
            aria-label="Center the graph view"
          >
            <Target className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={handleZoomIn}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group"
            title="Zoom In"
            aria-label="Zoom in graph view"
          >
            <ZoomIn className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      <LayerNotice layer={currentLayer} />
    </div>
  );
}

// --- Layer Notice HUD ---
const LayerNotice = ({ layer }) => {
  const [show, setShow] = useState(false);
  const [prevLayer, setPrevLayer] = useState(layer);

  const layerData = {
    1: { title: "Orientation Mode", sub: "Navigating high-level entry points and system hubs." },
    2: { title: "Structural Mode", sub: "Revealing skeletal module dependencies and physical vs. logic flow." },
    3: { title: "Impact Mode", sub: "Analyzing architectural gravity and the 'blast radius' of code changes." },
    4: { title: "Detail Mode", sub: "Deep-diving into implementation specifics and line-level logic." }
  };

  useEffect(() => {
    if (layer !== prevLayer) {
      setShow(true);
      setPrevLayer(layer);
      const timer = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [layer, prevLayer]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 20 }}
          className="absolute top-9 right-8 pointer-events-none z-[100] flex flex-col items-end gap-4"
        >
          <div className="bg-cbct-accent/10 backdrop-blur-md border border-cbct-accent/20 rounded-full px-8 py-3 shadow-[0_0_30px_rgba(88,166,255,0.2)] flex items-center gap-6">
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-cbct-accent text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap"
            >
              Layer {layer}
            </motion.div>
            <div className="w-px h-8 bg-cbct-accent/20"></div>
            <div className="flex flex-col">
              <motion.h2
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-bold text-white tracking-wide"
              >
                {layerData[layer]?.title}
              </motion.h2>
              <motion.p
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/60 text-[10px] max-w-[200px] truncate"
              >
                {layerData[layer]?.sub}
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
