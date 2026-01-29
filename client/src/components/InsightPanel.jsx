import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileCode, 
  ArrowUpRight, 
  ArrowDownLeft,
  Lightbulb,
  Folder
} from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../store/useStore';

function InsightPanel({ node, onClose }) {
  const { effectivePath } = useStore();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      if (!node || !effectivePath) return;
      
      setLoading(true);
      try {
        const data = await api.getNodeInsights(effectivePath, node.id);
        setInsights(data);
      } catch (error) {
        console.error('Failed to load insights:', error);
      } finally {
        setLoading(false);
      }
    }

    loadInsights();
  }, [node, effectivePath]);

  if (!node) return null;

  return (
    <aside className="w-80 bg-cbct-surface/90 backdrop-blur-md border-l border-cbct-border flex flex-col fade-in shadow-2xl z-20">
      {/* Header */}
      <div className="p-4 border-b border-cbct-border/50 flex items-start justify-between bg-cbct-surface/50">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 bg-cbct-accent/10 rounded-lg">
            <FileCode className="w-5 h-5 text-cbct-accent flex-shrink-0" />
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 className="font-semibold truncate text-lg leading-tight">{node.label}</h2>
            <p className="text-xs text-cbct-muted truncate flex items-center gap-1 mt-1">
              <Folder className="w-3 h-3" />
              <span className="opacity-80">{node.directory || '.'}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-cbct-surfaceHover rounded-full transition-colors text-cbct-muted hover:text-cbct-text"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-cbct-muted flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-cbct-accent border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm">Analyzing component structure...</span>
          </div>
        ) : (
          <>
            {/* Node Stats */}
            <div className="p-4 border-b border-cbct-border/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cbct-surfaceHover rounded-xl p-4 border border-cbct-border/50 shadow-sm">
                  <div className="text-3xl font-bold text-cbct-accent mb-1">
                    {node.inDegree || 0}
                  </div>
                  <div className="text-xs text-cbct-muted font-medium uppercase tracking-wide">Depended By</div>
                </div>
                <div className="bg-cbct-surfaceHover rounded-xl p-4 border border-cbct-border/50 shadow-sm">
                  <div className="text-3xl font-bold text-cbct-text mb-1">
                    {node.outDegree || 0}
                  </div>
                  <div className="text-xs text-cbct-muted font-medium uppercase tracking-wide">Depends On</div>
                </div>
              </div>
              <div className="mt-4 text-xs flex justify-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-cbct-accent/10 text-cbct-accent border border-cbct-accent/20 font-medium capitalize">
                  {node.type} Component
                </span>
              </div>
            </div>

            {/* Observations */}
            {insights?.observations?.length > 0 && (
              <div className="p-4 border-b border-cbct-border">
                <h3 className="text-xs font-semibold text-cbct-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Lightbulb className="w-3 h-3" />
                  Observations
                </h3>
                <div className="space-y-2">
                  {insights.observations.map((obs, idx) => (
                    <p key={idx} className="text-sm text-gray-300 leading-relaxed">
                      {obs}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies (files this depends on) */}
            {insights?.dependsOn?.length > 0 && (
              <div className="p-4 border-b border-cbct-border">
                <h3 className="text-xs font-semibold text-cbct-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ArrowUpRight className="w-3 h-3" />
                  Depends On ({insights.dependsOn.length})
                </h3>
                <div className="space-y-1">
                  {insights.dependsOn.slice(0, 10).map((dep) => (
                    <div
                      key={dep.id}
                      className="text-sm py-1.5 px-2 rounded hover:bg-cbct-border cursor-pointer truncate"
                    >
                      {dep.label}
                    </div>
                  ))}
                  {insights.dependsOn.length > 10 && (
                    <div className="text-xs text-cbct-muted px-2 py-1">
                      +{insights.dependsOn.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dependents (files that depend on this) */}
            {insights?.dependedBy?.length > 0 && (
              <div className="p-4">
                <h3 className="text-xs font-semibold text-cbct-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ArrowDownLeft className="w-3 h-3" />
                  Depended By ({insights.dependedBy.length})
                </h3>
                <div className="space-y-1">
                  {insights.dependedBy.slice(0, 10).map((dep) => (
                    <div
                      key={dep.id}
                      className="text-sm py-1.5 px-2 rounded hover:bg-cbct-border cursor-pointer truncate"
                    >
                      {dep.label}
                    </div>
                  ))}
                  {insights.dependedBy.length > 10 && (
                    <div className="text-xs text-cbct-muted px-2 py-1">
                      +{insights.dependedBy.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!insights?.dependsOn?.length && !insights?.dependedBy?.length && (
              <div className="p-4 text-center text-cbct-muted text-sm">
                No connections detected for this file.
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-cbct-border">
        <p className="text-xs text-cbct-muted text-center italic">
          "Notice this."
        </p>
      </div>
    </aside>
  );
}

export default InsightPanel;
