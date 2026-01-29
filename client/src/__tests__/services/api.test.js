/**
 * Unit tests for API service
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

// Import after mocking
import { api } from '../../services/api';

describe('API Service', () => {
  let mockClient;

  beforeEach(() => {
    // Get the mock client instance
    mockClient = axios.create();
    vi.clearAllMocks();
  });

  describe('scanRepository', () => {
    it('should call correct endpoint with path', async () => {
      const mockResponse = { 
        data: { 
          path: '/test/repo', 
          totalFiles: 100,
          name: 'test-repo'
        } 
      };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await api.scanRepository('/test/repo');

      expect(mockClient.post).toHaveBeenCalledWith('/repository/scan', { path: '/test/repo' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle GitHub URLs', async () => {
      const mockResponse = { 
        data: { 
          clonePath: '/tmp/repo', 
          totalFiles: 500 
        } 
      };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await api.scanRepository('https://github.com/user/repo');

      expect(mockClient.post).toHaveBeenCalledWith('/repository/scan', { 
        path: 'https://github.com/user/repo' 
      });
    });

    it('should propagate errors', async () => {
      const error = new Error('Network error');
      mockClient.post.mockRejectedValue(error);

      await expect(api.scanRepository('/test')).rejects.toThrow('Network error');
    });
  });

  describe('getFileTree', () => {
    it('should call correct endpoint with query params', async () => {
      const mockResponse = { data: { tree: [] } };
      mockClient.get.mockResolvedValue(mockResponse);

      await api.getFileTree('/test/repo');

      expect(mockClient.get).toHaveBeenCalledWith('/repository/tree', { 
        params: { path: '/test/repo' } 
      });
    });
  });

  describe('analyzeDependencies', () => {
    it('should call with default language', async () => {
      const mockResponse = { 
        data: { nodes: [], edges: [] } 
      };
      mockClient.post.mockResolvedValue(mockResponse);

      await api.analyzeDependencies('/test/repo');

      expect(mockClient.post).toHaveBeenCalledWith('/analysis/dependencies', { 
        path: '/test/repo', 
        language: 'javascript' 
      });
    });

    it('should use provided language', async () => {
      const mockResponse = { data: { nodes: [], edges: [] } };
      mockClient.post.mockResolvedValue(mockResponse);

      await api.analyzeDependencies('/test/repo', 'typescript');

      expect(mockClient.post).toHaveBeenCalledWith('/analysis/dependencies', { 
        path: '/test/repo', 
        language: 'typescript' 
      });
    });

    it('should return nodes and edges', async () => {
      const mockData = {
        nodes: [{ id: '1', label: 'test.js' }],
        edges: [{ source: '1', target: '2' }],
      };
      mockClient.post.mockResolvedValue({ data: mockData });

      const result = await api.analyzeDependencies('/test');

      expect(result).toEqual(mockData);
    });
  });

  describe('analyzeComplexity', () => {
    it('should call correct endpoint', async () => {
      const mockResponse = { data: [] };
      mockClient.post.mockResolvedValue(mockResponse);

      await api.analyzeComplexity('/test/repo');

      expect(mockClient.post).toHaveBeenCalledWith('/analysis/complexity', { 
        path: '/test/repo' 
      });
    });
  });

  describe('analyzeCentrality', () => {
    it('should call correct endpoint', async () => {
      const mockResponse = { data: [] };
      mockClient.post.mockResolvedValue(mockResponse);

      await api.analyzeCentrality('/test/repo');

      expect(mockClient.post).toHaveBeenCalledWith('/analysis/centrality', { 
        path: '/test/repo' 
      });
    });
  });

  describe('getNodeInsights', () => {
    it('should call correct endpoint with node ID', async () => {
      const mockResponse = { data: { insights: {} } };
      mockClient.get.mockResolvedValue(mockResponse);

      await api.getNodeInsights('/test/repo', 'node-123');

      expect(mockClient.get).toHaveBeenCalledWith('/analysis/insights/node-123', {
        params: { path: '/test/repo' }
      });
    });
  });

  describe('Global Graph endpoints', () => {
    it('should build global graph', async () => {
      const mockResponse = { data: { success: true } };
      mockClient.post.mockResolvedValue(mockResponse);

      await api.buildGlobalGraph('/test/repo');

      expect(mockClient.post).toHaveBeenCalledWith('/graph/build', { 
        path: '/test/repo' 
      });
    });

    it('should get global graph', async () => {
      const mockResponse = { data: { nodes: [], edges: [] } };
      mockClient.post.mockResolvedValue(mockResponse);

      await api.getGlobalGraph('/test/repo');

      expect(mockClient.post).toHaveBeenCalledWith('/graph/get', { 
        path: '/test/repo' 
      });
    });

    it('should get most used nodes', async () => {
      const mockResponse = { data: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await api.getMostUsedNodes('/test/repo', 5);

      expect(mockClient.get).toHaveBeenCalledWith('/graph/analysis/most-used', {
        params: { path: '/test/repo', limit: 5 }
      });
    });

    it('should find circular dependencies', async () => {
      const mockResponse = { data: { cycles: [] } };
      mockClient.get.mockResolvedValue(mockResponse);

      await api.findCircularDependencies('/test/repo');

      expect(mockClient.get).toHaveBeenCalledWith('/graph/analysis/cycles', {
        params: { path: '/test/repo' }
      });
    });
  });

  describe('Semantic Layer endpoints', () => {
    it('should expand unit', async () => {
      const mockResponse = { data: { nodes: [], edges: [] } };
      mockClient.post.mockResolvedValue(mockResponse);

      await api.expandUnit('/test/repo', 'unit-id', 2);

      expect(mockClient.post).toHaveBeenCalledWith('/analysis/expand', {
        path: '/test/repo',
        unitId: 'unit-id',
        depth: 2
      });
    });

    it('should get unit impact', async () => {
      const mockResponse = { data: { impactScore: 0.8 } };
      mockClient.post.mockResolvedValue(mockResponse);

      await api.getUnitImpact('/test/repo', 'unit-id');

      expect(mockClient.post).toHaveBeenCalledWith('/analysis/impact', {
        path: '/test/repo',
        unitId: 'unit-id'
      });
    });
  });

  describe('Git Analysis endpoints', () => {
    it('should get git churn', async () => {
      const mockResponse = { data: {} };
      mockClient.post.mockResolvedValue(mockResponse);

      await api.getGitChurn('/test/repo');

      expect(mockClient.post).toHaveBeenCalledWith('/analysis/git/churn', {
        path: '/test/repo'
      });
    });

    it('should get PR impact', async () => {
      const mockResponse = { data: { files: [] } };
      mockClient.post.mockResolvedValue(mockResponse);

      await api.getPRImpact('/test/repo', 'feature-branch');

      expect(mockClient.post).toHaveBeenCalledWith('/analysis/git/impact', {
        path: '/test/repo',
        baseBranch: 'feature-branch'
      });
    });
  });
});
