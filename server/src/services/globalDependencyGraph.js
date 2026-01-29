const fs = require('fs').promises;
const path = require('path');
const { extractRepositoryStructure, extractAllDependencies } = require('./structuralExtraction');

/**
 * F1: Global Dependency Graph Service
 * 
 * Maintains a single, authoritative graph of the entire repository.
 * Provides stable node identity across multiple scans and recomputations.
 * All visual features and analyses are projections of this graph.
 */

class GlobalDependencyGraph {
  constructor(repoPath) {
    this.repoPath = repoPath;
    this.graph = null;
    this.lastUpdated = null;
    this.nodeMap = new Map(); // path -> nodeId for quick lookup
    this.adjacencyList = new Map(); // nodeId -> Set of connected nodeIds
    this.stats = null;
  }

  /**
   * Build the global graph from repository
   * This is the single source of truth
   */
  async buildGraph() {
    try {
      console.log('[GlobalDependencyGraph] Building graph for:', this.repoPath);
      const startTime = Date.now();

      // F0: Extract repository structure
      const { nodes, nodeMap } = await extractRepositoryStructure(this.repoPath);
      
      if (nodes.length === 0) {
        this.graph = {
          nodes: [],
          edges: [],
          metadata: {
            repoPath: this.repoPath,
            nodeCount: 0,
            edgeCount: 0,
            timestamp: new Date().toISOString(),
            buildTime: 0,
            status: 'no-files',
          }
        };
        return this.graph;
      }

      // F1: Extract all dependencies to create edges
      const edges = await extractAllDependencies(this.repoPath, nodes);

      this.graph = {
        nodes: nodes,
        edges: edges,
        metadata: {
          repoPath: this.repoPath,
          nodeCount: nodes.length,
          edgeCount: edges.length,
          timestamp: new Date().toISOString(),
          buildTime: Date.now() - startTime,
          status: 'success',
        }
      };

      // Build internal structures for quick lookups
      this.nodeMap.clear();
      nodes.forEach(node => {
        this.nodeMap.set(node.path, node.id);
      });

      this.adjacencyList.clear();
      nodes.forEach(node => {
        this.adjacencyList.set(node.id, new Set());
      });

      edges.forEach(edge => {
        this.adjacencyList.get(edge.source)?.add(edge.target);
      });

      this.lastUpdated = new Date();
      this.computeStats();

      console.log('[GlobalDependencyGraph] Graph built successfully in', this.graph.metadata.buildTime, 'ms');
      return this.graph;
    } catch (error) {
      throw new Error(`Failed to build global dependency graph: ${error.message}`);
    }
  }

  /**
   * Recompute graph (for when repository changes)
   * Maintains stable node identities
   */
  async recompute() {
    console.log('[GlobalDependencyGraph] Recomputing graph...');
    return this.buildGraph();
  }

  /**
   * Get the entire graph
   */
  getGraph() {
    if (!this.graph) {
      throw new Error('Graph not built. Call buildGraph() first.');
    }
    return this.graph;
  }

  /**
   * Get node by ID
   */
  getNode(nodeId) {
    if (!this.graph) return null;
    return this.graph.nodes.find(n => n.id === nodeId);
  }

  /**
   * Get node by path
   */
  getNodeByPath(filePath) {
    if (!this.graph) return null;
    const nodeId = this.nodeMap.get(filePath);
    return nodeId ? this.getNode(nodeId) : null;
  }

  /**
   * Get all nodes of a specific type
   */
  getNodesByType(type) {
    if (!this.graph) return [];
    return this.graph.nodes.filter(n => n.type === type);
  }

  /**
   * Get all nodes of a specific language
   */
  getNodesByLanguage(language) {
    if (!this.graph) return [];
    return this.graph.nodes.filter(n => n.language === language);
  }

  /**
   * Get edges connected to a node
   */
  getEdgesForNode(nodeId) {
    if (!this.graph) return { incoming: [], outgoing: [] };
    
    const incoming = this.graph.edges.filter(e => e.target === nodeId);
    const outgoing = this.graph.edges.filter(e => e.source === nodeId);
    
    return { incoming, outgoing };
  }

  /**
   * Get all nodes that a given node depends on (immediate dependencies)
   */
  getDependencies(nodeId) {
    if (!this.graph) return [];
    return this.graph.edges
      .filter(e => e.source === nodeId)
      .map(e => this.getNode(e.target))
      .filter(Boolean);
  }

  /**
   * Get all nodes that depend on a given node (dependents)
   */
  getDependents(nodeId) {
    if (!this.graph) return [];
    return this.graph.edges
      .filter(e => e.target === nodeId)
      .map(e => this.getNode(e.source))
      .filter(Boolean);
  }

  /**
   * Get transitive dependencies (all nodes reachable from a node)
   */
  getTransitiveDependencies(nodeId, visited = new Set()) {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);

    const dependencies = this.getDependencies(nodeId);
    const transitive = [...dependencies];

    for (const dep of dependencies) {
      const further = this.getTransitiveDependencies(dep.id, visited);
      transitive.push(...further);
    }

    // Remove duplicates
    return Array.from(new Map(transitive.map(d => [d.id, d])).values());
  }

  /**
   * Calculate in-degree (number of dependents)
   */
  getInDegree(nodeId) {
    if (!this.graph) return 0;
    return this.graph.edges.filter(e => e.target === nodeId).length;
  }

  /**
   * Calculate out-degree (number of dependencies)
   */
  getOutDegree(nodeId) {
    if (!this.graph) return 0;
    return this.graph.edges.filter(e => e.source === nodeId).length;
  }

  /**
   * Get nodes with highest in-degree (most depended upon)
   */
  getMostUsedNodes(limit = 10) {
    if (!this.graph) return [];
    
    const nodeScores = this.graph.nodes.map(node => ({
      node,
      inDegree: this.getInDegree(node.id),
    }));

    return nodeScores
      .sort((a, b) => b.inDegree - a.inDegree)
      .slice(0, limit)
      .map(({ node, inDegree }) => ({ ...node, inDegree }));
  }

  /**
   * Get nodes with highest out-degree (most dependencies)
   */
  getMostDependentNodes(limit = 10) {
    if (!this.graph) return [];
    
    const nodeScores = this.graph.nodes.map(node => ({
      node,
      outDegree: this.getOutDegree(node.id),
    }));

    return nodeScores
      .sort((a, b) => b.outDegree - a.outDegree)
      .slice(0, limit)
      .map(({ node, outDegree }) => ({ ...node, outDegree }));
  }

  /**
   * Find circular dependencies
   */
  findCircularDependencies() {
    if (!this.graph || this.graph.edges.length === 0) return [];

    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (nodeId, path) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const dependencies = this.getDependencies(nodeId);
      
      for (const dep of dependencies) {
        if (recursionStack.has(dep.id)) {
          // Found a cycle
          const cycleStart = path.indexOf(dep.id);
          const cycle = path.slice(cycleStart).concat(dep.id);
          cycles.push(cycle.map(id => this.getNode(id).path));
        } else if (!visited.has(dep.id)) {
          dfs(dep.id, [...path]);
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const node of this.graph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    }

    return cycles;
  }

  /**
   * Compute statistics about the graph
   */
  computeStats() {
    if (!this.graph) return null;

    const languages = {};
    const types = {};
    let totalLines = 0;
    let totalSize = 0;

    for (const node of this.graph.nodes) {
      languages[node.language] = (languages[node.language] || 0) + 1;
      types[node.type] = (types[node.type] || 0) + 1;
      totalLines += node.metadata?.lines || 0;
      totalSize += node.metadata?.size || 0;
    }

    const inDegrees = this.graph.nodes.map(n => this.getInDegree(n.id));
    const outDegrees = this.graph.nodes.map(n => this.getOutDegree(n.id));

    const avgInDegree = inDegrees.reduce((a, b) => a + b, 0) / inDegrees.length || 0;
    const avgOutDegree = outDegrees.reduce((a, b) => a + b, 0) / outDegrees.length || 0;

    this.stats = {
      nodeCount: this.graph.nodes.length,
      edgeCount: this.graph.edges.length,
      languages,
      types,
      totalLines,
      totalSize,
      averageInDegree: avgInDegree,
      averageOutDegree: avgOutDegree,
      maxInDegree: Math.max(...inDegrees, 0),
      maxOutDegree: Math.max(...outDegrees, 0),
      orphanNodes: this.graph.nodes.filter(n => this.getInDegree(n.id) === 0 && this.getOutDegree(n.id) === 0).length,
      cyclesDetected: this.findCircularDependencies().length,
    };

    return this.stats;
  }

  /**
   * Get graph statistics
   */
  getStats() {
    return this.stats;
  }

  /**
   * Export graph to JSON
   */
  async exportToJSON() {
    if (!this.graph) {
      throw new Error('Graph not built');
    }

    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      repoPath: this.repoPath,
      graph: this.graph,
      stats: this.stats,
    };
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    if (!this.graph) return null;

    const nodeMemory = JSON.stringify(this.graph.nodes).length;
    const edgeMemory = JSON.stringify(this.graph.edges).length;
    const totalMemory = nodeMemory + edgeMemory;

    return {
      nodeMemoryBytes: nodeMemory,
      edgeMemoryBytes: edgeMemory,
      totalMemoryBytes: totalMemory,
      estimatedKB: Math.round(totalMemory / 1024),
    };
  }
}

/**
 * Global graph instance cache
 */
const graphInstances = new Map();

/**
 * Get or create a graph instance for a repository
 */
async function getOrCreateGraph(repoPath) {
  if (!graphInstances.has(repoPath)) {
    const graph = new GlobalDependencyGraph(repoPath);
    await graph.buildGraph();
    graphInstances.set(repoPath, graph);
  }
  return graphInstances.get(repoPath);
}

/**
 * Invalidate graph cache (when repository changes)
 */
function invalidateGraph(repoPath) {
  graphInstances.delete(repoPath);
}

/**
 * Clear all cached graphs
 */
function clearGraphCache() {
  graphInstances.clear();
}

module.exports = {
  GlobalDependencyGraph,
  getOrCreateGraph,
  invalidateGraph,
  clearGraphCache,
};
