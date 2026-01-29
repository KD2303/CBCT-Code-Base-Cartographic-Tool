/**
 * Unit tests for analysisService
 */
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Mock the dependencies before requiring the module
jest.mock('simple-git', () => {
  return jest.fn(() => ({
    log: jest.fn().mockResolvedValue({ all: [] }),
    diff: jest.fn().mockResolvedValue(''),
    revparse: jest.fn().mockResolvedValue('main'),
  }));
});

const analysisService = require('../../services/analysisService');

describe('analysisService', () => {
  let testDir;

  beforeAll(async () => {
    // Create a temporary test directory structure
    testDir = path.join(os.tmpdir(), `cbct-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'src', 'components'), { recursive: true });
    
    // Create test files
    await fs.writeFile(
      path.join(testDir, 'src', 'index.js'),
      `import { helper } from './utils';\nimport App from './components/App';\n\nconsole.log('Hello');`
    );
    
    await fs.writeFile(
      path.join(testDir, 'src', 'utils.js'),
      `export const helper = () => 'helper';\nexport const format = (x) => x.toString();`
    );
    
    await fs.writeFile(
      path.join(testDir, 'src', 'components', 'App.js'),
      `import React from 'react';\nimport { helper } from '../utils';\n\nexport default function App() { return <div />; }`
    );

    await fs.writeFile(
      path.join(testDir, 'src', 'components', 'Header.js'),
      `import React from 'react';\n\nexport default function Header() { return <header />; }`
    );
  });

  afterAll(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
  });

  describe('analyzeDependencies', () => {
    it('should throw error for missing path', async () => {
      await expect(analysisService.analyzeDependencies(null))
        .rejects.toThrow('Repository path is required');
    });

    it('should throw error for non-existent path', async () => {
      await expect(analysisService.analyzeDependencies('/non/existent/path'))
        .rejects.toThrow('does not exist');
    });

    it('should analyze a valid repository', async () => {
      const result = await analysisService.analyzeDependencies(testDir);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(result.edges).toBeDefined();
      expect(Array.isArray(result.edges)).toBe(true);
    });

    it('should detect nodes correctly', async () => {
      const result = await analysisService.analyzeDependencies(testDir, 'javascript', false);
      
      // Should find our test files
      expect(result.nodes.length).toBeGreaterThan(0);
      
      // Check that nodes have required properties
      result.nodes.forEach(node => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('label');
        expect(node).toHaveProperty('type');
      });
    });

    it('should use semantic layers when enabled', async () => {
      const result = await analysisService.analyzeDependencies(testDir, 'javascript', true);
      
      expect(result).toBeDefined();
      // Semantic layer processing adds metadata
      if (result.metadata) {
        expect(result.metadata).toHaveProperty('sizeCategory');
        expect(result.metadata).toHaveProperty('totalFiles');
      }
    });
  });

  describe('analyzeComplexity', () => {
    it('should throw error for missing path', async () => {
      await expect(analysisService.analyzeComplexity(null))
        .rejects.toThrow('Repository path is required');
    });

    it('should analyze complexity for valid repo', async () => {
      const result = await analysisService.analyzeComplexity(testDir);
      
      expect(result).toBeDefined();
      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.summary).toBeDefined();
    });
  });

  describe('analyzeCentrality', () => {
    it('should throw error for missing path', async () => {
      await expect(analysisService.analyzeCentrality(null))
        .rejects.toThrow('Repository path is required');
    });

    it('should analyze centrality for valid repo', async () => {
      const result = await analysisService.analyzeCentrality(testDir);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
    });
  });

  describe('getModuleInsights', () => {
    it('should throw error for missing parameters', async () => {
      await expect(analysisService.getModuleInsights(null, 'test'))
        .rejects.toThrow();
    });

    it('should return insights for valid node', async () => {
      // First analyze to get valid node IDs
      const analysis = await analysisService.analyzeDependencies(testDir, 'javascript', false);
      
      if (analysis.nodes && analysis.nodes.length > 0) {
        const nodeId = analysis.nodes[0].id;
        const insights = await analysisService.getModuleInsights(testDir, nodeId);
        
        expect(insights).toBeDefined();
      }
    });
  });
});

describe('Edge cases and error handling', () => {
  it('should handle empty directory gracefully', async () => {
    const emptyDir = path.join(os.tmpdir(), `cbct-empty-${Date.now()}`);
    await fs.mkdir(emptyDir, { recursive: true });
    
    const result = await analysisService.analyzeDependencies(emptyDir);
    
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
    
    await fs.rm(emptyDir, { recursive: true, force: true });
  });

  it('should handle file path instead of directory', async () => {
    const tempFile = path.join(os.tmpdir(), `cbct-file-${Date.now()}.js`);
    await fs.writeFile(tempFile, 'console.log("test");');
    
    await expect(analysisService.analyzeDependencies(tempFile))
      .rejects.toThrow('not a directory');
    
    await fs.unlink(tempFile);
  });
});
