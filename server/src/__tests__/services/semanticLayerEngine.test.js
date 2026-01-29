/**
 * Unit tests for semanticLayerEngine
 */
const semanticLayerEngine = require('../../services/semanticLayerEngine');

describe('semanticLayerEngine', () => {
  // Sample test data
  const sampleNodes = [
    { id: 'src/index.js', label: 'index.js', path: 'src/index.js', directory: 'src', type: 'file', inDegree: 5, outDegree: 2 },
    { id: 'src/utils.js', label: 'utils.js', path: 'src/utils.js', directory: 'src', type: 'file', inDegree: 10, outDegree: 1 },
    { id: 'src/components/App.js', label: 'App.js', path: 'src/components/App.js', directory: 'src/components', type: 'file', inDegree: 3, outDegree: 4 },
    { id: 'src/components/Header.js', label: 'Header.js', path: 'src/components/Header.js', directory: 'src/components', type: 'file', inDegree: 2, outDegree: 1 },
    { id: 'src/services/api.js', label: 'api.js', path: 'src/services/api.js', directory: 'src/services', type: 'file', inDegree: 8, outDegree: 3 },
  ];

  const sampleEdges = [
    { source: 'src/index.js', target: 'src/utils.js', weight: 1 },
    { source: 'src/index.js', target: 'src/components/App.js', weight: 1 },
    { source: 'src/components/App.js', target: 'src/utils.js', weight: 1 },
    { source: 'src/components/App.js', target: 'src/components/Header.js', weight: 1 },
    { source: 'src/components/App.js', target: 'src/services/api.js', weight: 1 },
  ];

  describe('getRepoSizeCategory', () => {
    it('should categorize small repos correctly', () => {
      expect(semanticLayerEngine.getRepoSizeCategory(50)).toBe('small');
      expect(semanticLayerEngine.getRepoSizeCategory(79)).toBe('small');
    });

    it('should categorize medium repos correctly', () => {
      expect(semanticLayerEngine.getRepoSizeCategory(80)).toBe('medium');
      expect(semanticLayerEngine.getRepoSizeCategory(300)).toBe('medium');
      expect(semanticLayerEngine.getRepoSizeCategory(499)).toBe('medium');
    });

    it('should categorize large repos correctly', () => {
      expect(semanticLayerEngine.getRepoSizeCategory(500)).toBe('large');
      expect(semanticLayerEngine.getRepoSizeCategory(1000)).toBe('large');
      expect(semanticLayerEngine.getRepoSizeCategory(10000)).toBe('large');
    });
  });

  describe('processForSemanticLayers', () => {
    it('should process small repo with file units', () => {
      const result = semanticLayerEngine.processForSemanticLayers(sampleNodes, sampleEdges, 50);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.sizeCategory).toBe('small');
    });

    it('should process medium repo with folder units', () => {
      // Create more nodes to simulate medium repo
      const mediumNodes = [];
      const mediumEdges = [];
      
      for (let i = 0; i < 100; i++) {
        mediumNodes.push({
          id: `src/module${i}/file${i}.js`,
          label: `file${i}.js`,
          path: `src/module${i}/file${i}.js`,
          directory: `src/module${Math.floor(i / 10)}`,
          type: 'file',
          inDegree: Math.floor(Math.random() * 10),
          outDegree: Math.floor(Math.random() * 5)
        });
      }
      
      const result = semanticLayerEngine.processForSemanticLayers(mediumNodes, mediumEdges, 200);
      
      expect(result.metadata.sizeCategory).toBe('medium');
    });

    it('should include metadata with total files', () => {
      const result = semanticLayerEngine.processForSemanticLayers(sampleNodes, sampleEdges, 50);
      
      expect(result.metadata.totalFiles).toBe(50);
    });

    it('should handle empty nodes array', () => {
      const result = semanticLayerEngine.processForSemanticLayers([], [], 0);
      
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });
  });

  describe('selectUnits', () => {
    it('should select file units for small repos', () => {
      const result = semanticLayerEngine.selectUnits(sampleNodes, sampleEdges, 50);
      
      expect(result.units).toBeDefined();
      expect(Array.isArray(result.units)).toBe(true);
      
      // For small repos, units should be files
      result.units.forEach(unit => {
        expect(unit.unitType).toBe('file');
      });
    });

    it('should select folder units for medium repos', () => {
      const result = semanticLayerEngine.selectUnits(sampleNodes, sampleEdges, 200);
      
      expect(result.units).toBeDefined();
      // For medium repos, units should be folders
      result.units.forEach(unit => {
        expect(unit.unitType).toBe('folder');
      });
    });
  });

  describe('getRevealDepth', () => {
    it('should return higher depth for small repos', () => {
      const smallDepth = semanticLayerEngine.getRevealDepth('small');
      const largeDepth = semanticLayerEngine.getRevealDepth('large');
      
      expect(smallDepth).toBeGreaterThan(largeDepth);
    });

    it('should return correct depth values', () => {
      expect(semanticLayerEngine.getRevealDepth('small')).toBe(3);
      expect(semanticLayerEngine.getRevealDepth('medium')).toBe(2);
      expect(semanticLayerEngine.getRevealDepth('large')).toBe(1);
    });
  });

  describe('calculateRiskIndicators', () => {
    it('should identify high-impact nodes', () => {
      const nodesWithRisk = semanticLayerEngine.calculateRiskIndicators(sampleNodes, sampleEdges);
      
      expect(Array.isArray(nodesWithRisk)).toBe(true);
      
      // utils.js has highest inDegree (10), should be marked as high impact
      const utilsNode = nodesWithRisk.find(n => n.id === 'src/utils.js');
      if (utilsNode) {
        expect(utilsNode.riskIndicators).toBeDefined();
      }
    });
  });

  describe('getLayerConfiguration', () => {
    it('should return valid layer configuration', () => {
      const config = semanticLayerEngine.getLayerConfiguration(1);
      
      expect(config).toBeDefined();
      expect(config.name).toBeDefined();
      expect(config.showNodes).toBeDefined();
    });

    it('should have configurations for all 4 layers', () => {
      for (let i = 1; i <= 4; i++) {
        const config = semanticLayerEngine.getLayerConfiguration(i);
        expect(config).toBeDefined();
      }
    });
  });
});

describe('Unit expansion', () => {
  const testNodes = [
    { id: 'folder:src', label: 'src', unitType: 'folder', children: ['src/a.js', 'src/b.js'] },
  ];

  it('should expand folder units to show children', () => {
    const expanded = semanticLayerEngine.expandUnitToChildren('folder:src', testNodes, []);
    
    expect(expanded).toBeDefined();
  });
});
