/**
 * Unit tests for Zustand store
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../../store/useStore';

// Mock the API module
vi.mock('../../services/api', () => ({
  api: {
    scanRepository: vi.fn(),
    analyzeDependencies: vi.fn(),
    analyzeComplexity: vi.fn(),
    analyzeCentrality: vi.fn(),
    expandUnit: vi.fn(),
    analyzeGitChurn: vi.fn(),
    analyzePRImpact: vi.fn(),
  },
}));

describe('useStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useStore.setState({
      repositoryPath: null,
      effectivePath: null,
      repositoryInfo: null,
      graphData: null,
      complexityData: null,
      centralityData: null,
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
        searchQuery: '',
        minComplexity: 0,
        minCentrality: 0,
        semanticRoles: [],
        excludePatterns: []
      },
      isLoading: false,
      error: null,
      viewMode: 'dependencies',
      selectedNode: null,
      multiSelectNodes: [],
      activePath: [],
      gitChurnData: {},
      prChangedFiles: [],
      forbiddenLinks: [],
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useStore.getState();
      
      expect(state.repositoryPath).toBeNull();
      expect(state.effectivePath).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.viewMode).toBe('dependencies');
    });

    it('should have correct semantic layer defaults', () => {
      const state = useStore.getState();
      
      expect(state.semanticLayer.currentLayer).toBe(1);
      expect(state.semanticLayer.focusedUnit).toBeNull();
      expect(state.semanticLayer.isLayerLocked).toBe(false);
    });

    it('should have correct filter defaults', () => {
      const state = useStore.getState();
      
      expect(state.filters.connectionStatus).toBe('all');
      expect(state.filters.searchQuery).toBe('');
      expect(state.filters.minComplexity).toBe(0);
    });
  });

  describe('setSemanticLayer', () => {
    it('should update the current layer', () => {
      const { setSemanticLayer } = useStore.getState();
      
      setSemanticLayer(2);
      
      const state = useStore.getState();
      expect(state.semanticLayer.currentLayer).toBe(2);
    });

    it('should lock the layer when manually set', () => {
      const { setSemanticLayer } = useStore.getState();
      
      setSemanticLayer(3);
      
      const state = useStore.getState();
      expect(state.semanticLayer.isLayerLocked).toBe(true);
    });

    it('should save previous state', () => {
      const { setSemanticLayer } = useStore.getState();
      
      setSemanticLayer(2);
      
      const state = useStore.getState();
      expect(state.semanticLayer.previousState).toBeDefined();
      expect(state.semanticLayer.previousState.currentLayer).toBe(1);
    });
  });

  describe('unlockLayer', () => {
    it('should unlock the layer', () => {
      const { setSemanticLayer, unlockLayer } = useStore.getState();
      
      setSemanticLayer(2);
      expect(useStore.getState().semanticLayer.isLayerLocked).toBe(true);
      
      unlockLayer();
      expect(useStore.getState().semanticLayer.isLayerLocked).toBe(false);
    });
  });

  describe('focusUnit', () => {
    it('should set focused unit and update selected node', () => {
      const { focusUnit } = useStore.getState();
      const mockUnit = { id: 'test-unit', label: 'Test Unit' };
      
      focusUnit(mockUnit, 2);
      
      const state = useStore.getState();
      expect(state.semanticLayer.focusedUnit).toEqual(mockUnit);
      expect(state.selectedNode).toEqual(mockUnit);
      expect(state.semanticLayer.currentLayer).toBe(2);
    });

    it('should handle null unit (unfocus)', () => {
      const { focusUnit } = useStore.getState();
      
      // First focus on a unit
      focusUnit({ id: 'test', label: 'Test' }, 2);
      
      // Then unfocus
      focusUnit(null);
      
      const state = useStore.getState();
      expect(state.semanticLayer.focusedUnit).toBeNull();
      expect(state.semanticLayer.currentLayer).toBe(1);
    });
  });

  describe('Filters', () => {
    it('should update search query', () => {
      useStore.setState(state => ({
        filters: { ...state.filters, searchQuery: 'test' }
      }));
      
      expect(useStore.getState().filters.searchQuery).toBe('test');
    });

    it('should update extensions filter', () => {
      useStore.setState(state => ({
        filters: { ...state.filters, extensions: ['.js', '.ts'] }
      }));
      
      expect(useStore.getState().filters.extensions).toEqual(['.js', '.ts']);
    });

    it('should update connection status', () => {
      useStore.setState(state => ({
        filters: { ...state.filters, connectionStatus: 'connected' }
      }));
      
      expect(useStore.getState().filters.connectionStatus).toBe('connected');
    });
  });

  describe('View Mode', () => {
    it('should allow changing view mode', () => {
      useStore.setState({ viewMode: 'complexity' });
      
      expect(useStore.getState().viewMode).toBe('complexity');
    });

    it('should accept valid view modes', () => {
      const validModes = ['dependencies', 'complexity', 'centrality'];
      
      validModes.forEach(mode => {
        useStore.setState({ viewMode: mode });
        expect(useStore.getState().viewMode).toBe(mode);
      });
    });
  });

  describe('Loading State', () => {
    it('should track loading state', () => {
      useStore.setState({ isLoading: true });
      expect(useStore.getState().isLoading).toBe(true);
      
      useStore.setState({ isLoading: false });
      expect(useStore.getState().isLoading).toBe(false);
    });
  });

  describe('Error State', () => {
    it('should handle error messages', () => {
      const errorMessage = 'Repository not found';
      
      useStore.setState({ error: errorMessage });
      
      expect(useStore.getState().error).toBe(errorMessage);
    });

    it('should clear errors', () => {
      useStore.setState({ error: 'Some error' });
      useStore.setState({ error: null });
      
      expect(useStore.getState().error).toBeNull();
    });
  });

  describe('Multi-select and Pathfinding', () => {
    it('should track multi-selected nodes', () => {
      useStore.setState({ multiSelectNodes: ['node1', 'node2'] });
      
      expect(useStore.getState().multiSelectNodes).toEqual(['node1', 'node2']);
    });

    it('should track active path', () => {
      useStore.setState({ activePath: ['a', 'b', 'c'] });
      
      expect(useStore.getState().activePath).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Git Integration', () => {
    it('should store git churn data', () => {
      const churnData = { 'src/index.js': 50, 'src/utils.js': 25 };
      
      useStore.setState({ gitChurnData: churnData });
      
      expect(useStore.getState().gitChurnData).toEqual(churnData);
    });

    it('should store PR changed files', () => {
      const changedFiles = ['src/app.js', 'src/components/Header.js'];
      
      useStore.setState({ prChangedFiles: changedFiles });
      
      expect(useStore.getState().prChangedFiles).toEqual(changedFiles);
    });
  });
});
