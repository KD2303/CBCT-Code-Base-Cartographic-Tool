import { create } from 'zustand';
import { api } from '../services/api';

export const useStore = create((set, get) => ({
  // Repository state
  repositoryPath: null,      // Original input (URL or local path)
  effectivePath: null,       // Actual local path for analysis (clonePath for GitHub, same as repositoryPath for local)
  repositoryInfo: null,

  // Graph data (now includes semantic layer metadata)
  graphData: null,
  complexityData: null,
  centralityData: null,

  // Semantic Layer State (INTERNAL - adapts based on repo size, never exposed to user)
  semanticLayer: {
    currentLayer: 1,        // 1=Orientation, 2=Structural, 3=Impact, 4=Detail
    focusedUnit: null,      // Currently focused unit
    expandedUnits: [],      // Units that have been expanded
    previousState: null,    // For restoring on escape/background click
    revealDepth: 3,         // Based on repo size (set from metadata)
    isLayerLocked: false    // NEW: Prevents zoom from changing layer
  },

  // Filter state
  filters: {
    extensions: [],      // e.g., ['.js', '.ts']
    languages: [],       // e.g., ['JavaScript', 'TypeScript']
    directories: [],     // e.g., ['src', 'components']
    hubFiles: [],        // e.g., ['app.js','index.js'] - files that act as central hubs
    connectionStatus: 'all', // 'all' | 'connected' | 'orphan'
    searchQuery: '',      // text search for unit names
    minComplexity: 0,    // filter by complexity score
    minCentrality: 0,    // filter by centrality score
    semanticRoles: [],    // filter by node role (e.g., 'Core Dependency')
    excludePatterns: []   // array of regex strings to exclude
  },

  // UI state
  isLoading: false,
  error: null,
  viewMode: 'dependencies', // 'dependencies' | 'complexity' | 'centrality'
  selectedNode: null,
  multiSelectNodes: [], // Array of node IDs for pathfinding
  activePath: [],       // Calculated path (node IDs)
  gitChurnData: {},      // File path -> modification count
  prChangedFiles: [],    // Array of file paths changed in current branch
  forbiddenLinks: [],     // Array of { source, target } ids for guardrails

  // Semantic Layer Actions
  setSemanticLayer: (layer) => {
    const current = get().semanticLayer;
    set({
      semanticLayer: {
        ...current,
        previousState: { ...current },
        currentLayer: layer,
        isLayerLocked: true // Manually selecting a layer locks it
      }
    });
  },

  unlockLayer: () => {
    const current = get().semanticLayer;
    set({
      semanticLayer: {
        ...current,
        isLayerLocked: false
      }
    });
  },

  focusUnit: (unit, targetLayer = 2) => {
    const current = get().semanticLayer;
    set({
      semanticLayer: {
        ...current,
        previousState: { ...current },
        focusedUnit: unit,
        currentLayer: unit ? targetLayer : 1
      },
      selectedNode: unit
    });

    // If transitioning to Layer 4, auto-expand
    if (unit && targetLayer === 4) {
      get().expandUnit(unit);
    }
  },

  expandUnit: async (unit) => {
    const { effectivePath, semanticLayer } = get();
    if (!effectivePath || !unit) return;

    try {
      const expanded = await api.expandUnit(effectivePath, unit.id, semanticLayer.revealDepth);
      set(state => ({
        semanticLayer: {
          ...state.semanticLayer,
          expandedUnits: [...state.semanticLayer.expandedUnits, {
            unitId: unit.id,
            nodes: expanded.nodes,
            edges: expanded.edges
          }]
        }
      }));
      return expanded;
    } catch (error) {
      console.error('Failed to expand unit:', error);
      return null;
    }
  },

  getUnitImpact: async (unit) => {
    const { effectivePath } = get();
    if (!effectivePath || !unit) return null;

    try {
      const impact = await api.getUnitImpact(effectivePath, unit.id);
      set(state => ({
        semanticLayer: {
          ...state.semanticLayer,
          currentLayer: 3  // Auto-transition to Layer 3 for impact view
        }
      }));
      return impact;
    } catch (error) {
      console.error('Failed to get unit impact:', error);
      return null;
    }
  },

  restorePreviousState: () => {
    const current = get().semanticLayer;
    set({
      semanticLayer: {
        ...current,
        currentLayer: 1,
        focusedUnit: null,
        isLayerLocked: false
      },
      selectedNode: null
    });
  },

  // Zoom-to-layer mapping (Universal Semantic)
  updateLayerFromZoom: (zoomLevel) => {
    const current = get().semanticLayer;
    if (current.isLayerLocked) return;

    let newLayer = 1;
    if (zoomLevel < 0.6) {
      newLayer = 1;  // Zoom out -> Orientation
    } else if (zoomLevel < 1.4) {
      newLayer = 2;  // Normal -> Structural
    } else if (zoomLevel < 2.5) {
      newLayer = 3;  // Zoom in -> Impact
    } else {
      newLayer = 4;  // Max zoom reveals Detail Analysis
    }

    if (current.currentLayer !== newLayer) {
      set({
        semanticLayer: {
          ...current,
          currentLayer: newLayer
        }
      });
    }
  },

  // Actions
  setSelectedNode: (node) => {
    set({ selectedNode: node });

    // SMART NAVIGATION: 
    // Only auto-switch to Layer 2 (Structural) if we are currently in Layer 1 (Orientation).
    // If we are in Layer 3 (Impact) or Layer 4 (Detail), we want to stay in that mode 
    // while we explore different nodes.
    if (node && get().semanticLayer.currentLayer === 1) {
      get().focusUnit(node, 2);
    } else if (node) {
      // Just update the focused unit but keep the current layer
      const current = get().semanticLayer;
      set({
        semanticLayer: {
          ...current,
          focusedUnit: node
        }
      });

      // If we are in Layer 4, we might need to auto-expand the new selection
      if (current.currentLayer === 4) {
        get().expandUnit(node);
      }
    }
  },

  toggleMultiSelect: (nodeId) => {
    const { multiSelectNodes } = get();
    let newSelection;
    if (multiSelectNodes.includes(nodeId)) {
      newSelection = multiSelectNodes.filter(id => id !== nodeId);
    } else {
      newSelection = [...multiSelectNodes, nodeId].slice(-2); // Limit to 2 for pathfinding
    }
    set({ multiSelectNodes: newSelection });

    if (newSelection.length === 2) {
      get().calculatePath(newSelection[0], newSelection[1]);
    } else {
      set({ activePath: [] });
    }
  },

  calculatePath: (startId, endId) => {
    const { graphData } = get();
    if (!graphData) return;

    const nodes = graphData.nodes;
    const links = graphData.edges;

    // BFS for shortest path
    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];

      if (node === endId) {
        set({ activePath: path });
        return;
      }

      // Find neighbors (links are source -> target)
      // Check both directions for pathfinding connectivity
      const neighbors = links
        .filter(l => l.source === node || l.target === node)
        .map(l => l.source === node ? l.target : l.source);

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    set({ activePath: [] }); // No path found
  },

  clearSelection: () => {
    set({ multiSelectNodes: [], activePath: [] });
  },

  fetchGitIntelligence: async (path) => {
    try {
      const [churn, impact] = await Promise.all([
        api.getGitChurn(path),
        api.getPRImpact(path)
      ]);
      set({ gitChurnData: churn, prChangedFiles: impact });
    } catch (error) {
      console.warn('[Store] Git intelligence failed:', error.message);
    }
  },

  toggleForbiddenLink: (sourceId, targetId) => {
    const { forbiddenLinks } = get();
    const exists = forbiddenLinks.find(l => l.source === sourceId && l.target === targetId);

    if (exists) {
      set({ forbiddenLinks: forbiddenLinks.filter(l => !(l.source === sourceId && l.target === targetId)) });
    } else {
      set({ forbiddenLinks: [...forbiddenLinks, { source: sourceId, target: targetId }] });
    }
  },

  setRepositoryPath: async (path) => {
    set({ isLoading: true, error: null });

    try {
      // First scan repository to get info and effective path
      const repoInfo = await api.scanRepository(path);

      // For GitHub repos, use clonePath; for local repos, use the scanned path
      const effectivePath = repoInfo.clonePath || repoInfo.path || path;

      set({
        repositoryPath: path,
        effectivePath,
        repositoryInfo: repoInfo
      });

      // Load dependency graph using the effective local path (not the GitHub URL)
      const graphData = await api.analyzeDependencies(effectivePath);

      // Extract reveal depth from metadata if available
      const revealDepth = graphData.metadata?.revealDepth || 3;

      set({
        graphData,
        semanticLayer: {
          currentLayer: 1,
          focusedUnit: null,
          expandedUnits: [],
          previousState: null,
          revealDepth,
          isLayerLocked: false // Ensure this is preserved/reset
        }
      });

      set({ isLoading: false });

      // Automatically trigger secondary analytics
      get().fetchGitIntelligence(effectivePath);
      get().loadComplexityData();
    } catch (error) {
      set({
        error: error.message || 'Failed to load repository',
        isLoading: false
      });
    }
  },

  loadComplexityData: async () => {
    const { effectivePath } = get();
    if (!effectivePath) return;

    try {
      const data = await api.analyzeComplexity(effectivePath);
      set({ complexityData: data });
    } catch (error) {
      console.error('Failed to load complexity data:', error);
    }
  },

  loadCentralityData: async () => {
    const { effectivePath } = get();
    if (!effectivePath) return;

    try {
      const data = await api.analyzeCentrality(effectivePath);
      set({ centralityData: data });
    } catch (error) {
      console.error('Failed to load centrality data:', error);
    }
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });

    // Load data for the view mode if not already loaded
    const { complexityData, centralityData, loadComplexityData, loadCentralityData } = get();

    if (mode === 'complexity' && !complexityData) {
      loadComplexityData();
    }
    if (mode === 'centrality' && !centralityData) {
      loadCentralityData();
    }
  },

  clearRepository: () => {
    set({
      repositoryPath: null,
      effectivePath: null,
      repositoryInfo: null,
      graphData: null,
      complexityData: null,
      centralityData: null,
      error: null,
      semanticLayer: {
        currentLayer: 1,
        focusedUnit: null,
        expandedUnits: [],
        previousState: null,
        revealDepth: 3,
        isLayerLocked: false
      },
      filters: {
        extensions: [],
        languages: [],
        directories: [],
        hubFiles: [],
        connectionStatus: 'all',
        nodeType: 'all',
        searchQuery: ''
      },
      selectedNode: null
    });
  },

  // Filter actions
  setFilter: (filterType, value) => {
    set(state => ({
      filters: {
        ...state.filters,
        [filterType]: value
      }
    }));
  },

  toggleExtensionFilter: (ext) => {
    set(state => {
      const current = state.filters.extensions;
      const newExts = current.includes(ext)
        ? current.filter(e => e !== ext)
        : [...current, ext];
      return { filters: { ...state.filters, extensions: newExts } };
    });
  },

  toggleLanguageFilter: (lang) => {
    set(state => {
      const current = state.filters.languages;
      const newLangs = current.includes(lang)
        ? current.filter(l => l !== lang)
        : [...current, lang];
      return { filters: { ...state.filters, languages: newLangs } };
    });
  },

  toggleSemanticRole: (role) => {
    set(state => {
      const current = state.filters.semanticRoles;
      const newRoles = current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role];
      return { filters: { ...state.filters, semanticRoles: newRoles } };
    });
  },

  clearFilters: () => {
    set({
      filters: {
        extensions: [],
        languages: [],
        directories: [],
        hubFiles: [],
        connectionStatus: 'all',
        nodeType: 'all',
        searchQuery: '',
        minComplexity: 0,
        minCentrality: 0,
        semanticRoles: [],
        excludePatterns: []
      }
    });
  },

  clearError: () => set({ error: null })
}));

