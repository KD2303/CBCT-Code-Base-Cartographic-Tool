import axios from 'axios';

const BASE_URL = '/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 5 minutes timeout for large repos
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Repository endpoints
  async scanRepository(path) {
    const response = await client.post('/repository/scan', { path });
    return response.data;
  },

  async getFileTree(path) {
    const response = await client.get('/repository/tree', { params: { path } });
    return response.data;
  },

  // Analysis endpoints
  async analyzeDependencies(path, language = 'javascript') {
    const response = await client.post('/analysis/dependencies', { path, language });
    return response.data;
  },

  async analyzeComplexity(path) {
    const response = await client.post('/analysis/complexity', { path });
    return response.data;
  },

  async analyzeCentrality(path) {
    const response = await client.post('/analysis/centrality', { path });
    return response.data;
  },

  async getNodeInsights(path, nodeId) {
    const response = await client.get(`/analysis/insights/${nodeId}`, {
      params: { path }
    });
    return response.data;
  },

  // Global Dependency Graph endpoints (F0 & F1)
  async buildGlobalGraph(path) {
    const response = await client.post('/graph/build', { path });
    return response.data;
  },

  async getGlobalGraph(path) {
    const response = await client.post('/graph/get', { path });
    return response.data;
  },

  async getNodeFromGraph(path, nodeId) {
    const response = await client.get(`/graph/node/${nodeId}`, { params: { path } });
    return response.data;
  },

  async getNodesByType(path, type) {
    const response = await client.get(`/graph/nodes/type/${type}`, { params: { path } });
    return response.data;
  },

  async getNodesByLanguage(path, language) {
    const response = await client.get(`/graph/nodes/language/${language}`, { params: { path } });
    return response.data;
  },

  async getMostUsedNodes(path, limit = 10) {
    const response = await client.get('/graph/analysis/most-used', {
      params: { path, limit }
    });
    return response.data;
  },

  async getMostDependentNodes(path, limit = 10) {
    const response = await client.get('/graph/analysis/most-dependent', {
      params: { path, limit }
    });
    return response.data;
  },

  async findCircularDependencies(path) {
    const response = await client.get('/graph/analysis/cycles', { params: { path } });
    return response.data;
  },

  async getGraphStats(path) {
    const response = await client.get('/graph/stats', { params: { path } });
    return response.data;
  },

  async recomputeGraph(path) {
    const response = await client.post('/graph/recompute', { path });
    return response.data;
  },

  async exportGraph(path) {
    const response = await client.get('/graph/export', { params: { path } });
    return response.data;
  },

  async getGraphHealth() {
    const response = await client.get('/graph/health');
    return response.data;
  },

  // Semantic Layer endpoints
  async expandUnit(path, unitId, depth = 1) {
    const response = await client.post('/analysis/expand', { path, unitId, depth });
    return response.data;
  },

  async getUnitImpact(path, unitId) {
    const response = await client.post('/analysis/impact', { path, unitId });
    return response.data;
  },

  // Git Intelligence
  async getGitChurn(path) {
    const response = await client.post('/analysis/git/churn', { path });
    return response.data;
  },

  async getPRImpact(path, baseBranch = 'main') {
    const response = await client.post('/analysis/git/impact', { path, baseBranch });
    return response.data;
  },

  // Health check
  async healthCheck() {
    const response = await client.get('/health');
    return response.data;
  }
};

