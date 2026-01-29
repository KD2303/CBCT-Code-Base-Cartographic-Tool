import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Map, GitBranch, AlertTriangle, Search, ChevronRight, Minimize2, Maximize2, Layers, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

const LAYERS = [
    {
        id: 1,
        name: 'Orientation',
        icon: Map,
        description: 'High-level overview',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-400',
        hoverBg: 'hover:bg-blue-500/20',
        detailedInfo: {
            title: 'Orientation & Entry',
            purpose: 'Provides a "birds-eye view" of the entire repository architecture.',
            helpItems: [
                'Identify core entry points and system hubs',
                'Understand high-level module distribution',
                'Perfect for onboarding to new codebases'
            ]
        }
    },
    {
        id: 2,
        name: 'Structural',
        icon: GitBranch,
        description: 'Connections & relationships',
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        textColor: 'text-purple-400',
        hoverBg: 'hover:bg-purple-500/20',
        detailedInfo: {
            title: 'Structural Backbone',
            purpose: 'Focuses on how core units and folders communicate with each other.',
            helpItems: [
                'Reveal the skeletal structure of module dependencies',
                'Identify patterns in cross-module communication',
                'Visualize the physical organization vs logic flow'
            ]
        }
    },
    {
        id: 3,
        name: 'Impact & Risk',
        icon: AlertTriangle,
        description: 'Dependencies & risks',
        color: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400',
        hoverBg: 'hover:bg-amber-500/20',
        detailedInfo: {
            title: 'Impact & Risk Radius',
            purpose: 'Simulates the metabolic risk of changing specific units.',
            helpItems: [
                'Predict the "Blast Radius" of a code change',
                'Identify units with high architectural gravity',
                'Locate circular dependencies and fragile chokepoints'
            ]
        }
    },
    {
        id: 4,
        name: 'Detail',
        icon: Search,
        description: 'Full file-level analysis',
        color: 'from-emerald-500 to-teal-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        textColor: 'text-emerald-400',
        hoverBg: 'hover:bg-emerald-500/20',
        detailedInfo: {
            title: 'Detail & Implementation',
            purpose: 'Deep-dives into the internal specifics of any selected unit.',
            helpItems: [
                'Inspect full file-level internal details',
                'Visualize line-by-line internal complexity',
                'Identify hotspots and refactoring targets'
            ]
        }
    }
];

export default function LayerSelector() {
    const { semanticLayer, setSemanticLayer, unlockLayer, graphData } = useStore();
    const currentLayer = semanticLayer?.currentLayer || 1;
    const isLocked = semanticLayer?.isLayerLocked;
    const [showToast, setShowToast] = useState(false);
    const [toastLayer, setToastLayer] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeDetailId, setActiveDetailId] = useState(null);

    // Sync activeDetailId with currentLayer initially
    // Sync activeDetailId with currentLayer initially - REMOVED to prevent auto-popup clutter
    // useEffect(() => {
    //     if (!isMinimized) {
    //         setActiveDetailId(currentLayer);
    //     }
    // }, [currentLayer, isMinimized]);

    const handleLayerChange = (layerId) => {
        console.log('🔄 Layer change clicked:', layerId);
        setActiveDetailId(null); // Explicitly close detail card to clear clutter
        setSemanticLayer(layerId);

        // ... rest of toast logic ...

        // Show toast notification
        const layer = LAYERS.find(l => l.id === layerId);
        setToastLayer(layer);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    // Don't show if no graph data is loaded
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
        return null;
    }

    return (
        <>
            <div
                className="absolute top-6 left-6 z-50 flex items-start gap-3"
                onClick={(e) => e.stopPropagation()}
            >
                <AnimatePresence mode="wait">
                    {isMinimized ? (
                        <motion.button
                            key="minimized"
                            initial={{ opacity: 0, scale: 0.8, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -20 }}
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.15)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsMinimized(false)}
                            className="bg-[#0B0B15]/95 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl flex items-center justify-center group relative"
                            title="Expand Semantic Layers"
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br transition-all duration-300",
                                LAYERS.find(l => l.id === currentLayer)?.color || "from-cbct-accent to-blue-500"
                            )}>
                                {(() => {
                                    const ActiveIcon = LAYERS.find(l => l.id === currentLayer)?.icon || Layers;
                                    return <ActiveIcon className="w-5 h-5 text-white" />;
                                })()}
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-cbct-accent rounded-full border-2 border-[#0B0B15] flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                                {currentLayer}
                            </div>
                            {isLocked && (
                                <div className="absolute top-1 -left-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-[#0B0B15] flex items-center justify-center shadow-lg">
                                    <Lock className="w-2.5 h-2.5 text-white" />
                                </div>
                            )}
                            <div className="ml-0 w-0 overflow-hidden group-hover:w-24 group-hover:ml-3 transition-all duration-300 flex flex-col items-start whitespace-nowrap">
                                <span className="text-xs font-bold text-white">Layer {currentLayer}</span>
                                <span className="text-[10px] text-cbct-muted">{isLocked ? 'Pinned' : 'Click to expand'}</span>
                            </div>
                        </motion.button>
                    ) : (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -20, scale: 0.95 }}
                            className="bg-[#0B0B15]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden w-64"
                        >
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-cbct-accent/20 rounded-lg">
                                        <Layers className="w-4 h-4 text-cbct-accent" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-white">Semantic Layers</h3>
                                        <p className="text-[10px] text-cbct-muted">
                                            Layer {currentLayer} of 4
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-cbct-muted hover:text-white transition-colors"
                                    title="Minimize"
                                >
                                    <Minimize2 className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Layer Buttons */}
                            <div className="p-3 space-y-1.5">
                                {LAYERS.map((layer) => {
                                    const Icon = layer.icon;
                                    const isActive = currentLayer === layer.id;
                                    const isAccessible = true; // All layers accessible now if data exists

                                    return (
                                        <motion.div
                                            role="button"
                                            tabIndex={0}
                                            key={layer.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isAccessible) {
                                                    handleLayerChange(layer.id);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    if (isAccessible) handleLayerChange(layer.id);
                                                }
                                            }}
                                            animate={isActive ? { scale: 1.02, x: 2 } : { scale: 1, x: 0 }}
                                            whileHover={isAccessible ? { scale: 1.02, x: 2 } : {}}
                                            whileTap={isAccessible ? { scale: 0.98 } : {}}
                                            className={cn(
                                                "w-full flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-300 relative group outline-none focus:ring-2 focus:ring-cbct-accent/50",
                                                isActive
                                                    ? `${layer.bgColor} ${layer.borderColor} shadow-lg shadow-${layer.textColor.split('-')[1]}-500/10`
                                                    : "bg-white/5 border-white/5 hover:border-white/10",
                                                isAccessible ? "cursor-pointer" : "opacity-40 cursor-not-allowed grayscale"
                                            )}
                                        >
                                            {/* Icon */}
                                            <div
                                                className={cn(
                                                    "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500",
                                                    isActive
                                                        ? `bg-gradient-to-br ${layer.color} shadow-lg shadow-${layer.textColor.split('-')[1]}-500/30`
                                                        : "bg-white/10 group-hover:bg-white/15"
                                                )}
                                            >
                                                <Icon
                                                    className={cn(
                                                        "w-5 h-5 transition-transform duration-300",
                                                        isActive ? "scale-110 text-white" : "text-white/50 group-hover:scale-110"
                                                    )}
                                                    strokeWidth={2}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 text-left min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            "text-sm font-bold tracking-tight transition-colors duration-300",
                                                            isActive ? "text-white" : "text-white/60 group-hover:text-white/90"
                                                        )}
                                                    >
                                                        {layer.name}
                                                    </span>
                                                    {isActive && isLocked && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="p-1 rounded bg-orange-500/20"
                                                        >
                                                            <Lock className="w-3 h-3 text-orange-400" />
                                                        </motion.div>
                                                    )}
                                                </div>
                                                <p
                                                    className={cn(
                                                        "text-[10px] leading-tight transition-colors duration-300",
                                                        isActive ? "text-white/60" : "text-cbct-muted group-hover:text-cbct-muted/90"
                                                    )}
                                                >
                                                    {layer.description}
                                                </p>
                                            </div>

                                            {/* Layer Number / Info Action */}
                                            <div className="relative">
                                                <div
                                                    className={cn(
                                                        "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-all duration-300",
                                                        isActive
                                                            ? `${layer.bgColor} ${layer.textColor} ${layer.borderColor} scale-110`
                                                            : "bg-white/5 text-white/30 border-white/5",
                                                        "group-hover:opacity-0 transition-opacity"
                                                    )}
                                                >
                                                    {layer.id}
                                                </div>
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    whileHover={{ scale: 1.1 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDetailId(activeDetailId === layer.id ? null : layer.id);
                                                    }}
                                                    className={cn(
                                                        "absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200",
                                                        isActive ? "bg-white/20" : "bg-white/10 hover:bg-white/20"
                                                    )}
                                                >
                                                    <AlertTriangle className="w-3 h-3 text-white" />
                                                </motion.button>
                                            </div>

                                            {/* Active Glow Bar */}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="active-bar"
                                                    className={cn(
                                                        "absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full",
                                                        `bg-gradient-to-b ${layer.color}`
                                                    )}
                                                />
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Footer Hint */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isLocked) unlockLayer();
                                }}
                                className={cn(
                                    "px-5 py-3 border-t w-full flex items-center justify-center gap-2 transition-colors",
                                    isLocked ? "bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20" : "border-white/5 bg-white/[0.02]"
                                )}
                            >
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full animate-pulse",
                                    isLocked ? "bg-orange-500" : "bg-cbct-accent/40"
                                )} />
                                <p className={cn(
                                    "text-[10px] font-medium tracking-wide flex items-center gap-1.5",
                                    isLocked ? "text-orange-400" : "text-cbct-muted"
                                )}>
                                    {isLocked ? (
                                        <>
                                            <Unlock className="w-3 h-3" /> CLICK TO RELEASE ZOOM LOCK
                                        </>
                                    ) : (
                                        "USE ZOOM TO NAVIGATE LAYERS"
                                    )}
                                </p>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Detailed Explanation Card - Re-positioned to Bottom Right for less clutter */}
            <AnimatePresence>
                {!isMinimized && activeDetailId && (
                    <div className="fixed bottom-8 right-8 z-50">
                        <LayerDetailCard
                            layer={LAYERS.find(l => l.id === activeDetailId)}
                            onClose={() => setActiveDetailId(null)}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {showToast && toastLayer && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.9 }}
                        className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                        <div className={cn(
                            "px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl",
                            toastLayer.bgColor,
                            toastLayer.borderColor
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                    `bg-gradient-to-br ${toastLayer.color}`
                                )}>
                                    {React.createElement(toastLayer.icon, {
                                        className: "w-6 h-6 text-white",
                                        strokeWidth: 2
                                    })}
                                </div>
                                <div>
                                    <div className="text-white font-bold text-lg">
                                        Layer {toastLayer.id}: {toastLayer.name}
                                    </div>
                                    <div className="text-white/70 text-sm">
                                        {toastLayer.description}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function LayerDetailCard({ layer, onClose }) {
    if (!layer || !layer.detailedInfo) return null;

    const { title, purpose, helpItems } = layer.detailedInfo;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            className="bg-[#0B0B15]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6 w-72 h-fit"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                    "p-2 rounded-xl bg-gradient-to-br",
                    layer.color
                )}>
                    {React.createElement(layer.icon, { className: "w-4 h-4 text-white" })}
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    {title}
                </h4>
            </div>

            <div className="space-y-4">
                <p className="text-xs text-white/70 leading-relaxed italic border-l-2 border-white/10 pl-3">
                    "{purpose}"
                </p>

                <div className="space-y-3 pt-2">
                    {helpItems.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * (i + 1) }}
                            className="flex items-start gap-2.5 group"
                        >
                            <div className={cn(
                                "mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125",
                                layer.textColor.replace('text-', 'bg-')
                            )} />
                            <span className="text-[11px] text-cbct-muted group-hover:text-white/90 transition-colors">
                                {item}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex -space-x-1.5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-5 h-5 rounded-full border border-[#0B0B15] bg-white/5" />
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="text-[10px] font-bold text-cbct-accent hover:text-white transition-colors"
                >
                    GOT IT
                </button>
            </div>

            {/* Visual Decoration */}
            <div className={cn(
                "absolute -right-1 top-10 bottom-10 w-0.5 rounded-full blur-[1px] opacity-30",
                `bg-gradient-to-b ${layer.color}`
            )} />
        </motion.div>
    );
}
