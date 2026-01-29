const express = require('express');
const router = express.Router();
const { 
  getOrCreateGraph, 
  invalidateGraph, 
  clearGraphCache 
} = require('../services/globalDependencyGraph');

/**
 * Build or rebuild the global dependency graph for a repository
 * POST /api/graph/build
 */
router.post('/build', async (req, res) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    console.log('[Graph API] Building global dependency graph for:', path);

    const graph = await getOrCreateGraph(path);
    const graphData = graph.getGraph();

    res.json({
      success: true,
      data: graphData,
      stats: graph.getStats(),
    });
  } catch (error) {
    console.error('[Graph API] Error building graph:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get the current global graph
 * POST /api/graph/get
 */
router.post('/get', async (req, res) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    console.log('[Graph API] Getting global dependency graph for:', path);

    const graph = await getOrCreateGraph(path);
    const graphData = graph.getGraph();

    res.json({
      success: true,
      data: graphData,
      stats: graph.getStats(),
    });
  } catch (error) {
    console.error('[Graph API] Error getting graph:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get node information from graph
 * GET /api/graph/node/:nodeId
 */
router.get('/node/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const graph = await getOrCreateGraph(path);
    const node = graph.getNode(nodeId);

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const { incoming, outgoing } = graph.getEdgesForNode(nodeId);
    const dependencies = graph.getDependencies(nodeId);
    const dependents = graph.getDependents(nodeId);
    const transitiveDependencies = graph.getTransitiveDependencies(nodeId);

    res.json({
      success: true,
      node,
      edges: { incoming, outgoing },
      dependencies,
      dependents,
      transitiveDependencies,
      inDegree: graph.getInDegree(nodeId),
      outDegree: graph.getOutDegree(nodeId),
    });
  } catch (error) {
    console.error('[Graph API] Error getting node:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get nodes by type
 * GET /api/graph/nodes/type/:type
 */
router.get('/nodes/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const graph = await getOrCreateGraph(path);
    const nodes = graph.getNodesByType(type);

    res.json({
      success: true,
      type,
      count: nodes.length,
      nodes,
    });
  } catch (error) {
    console.error('[Graph API] Error getting nodes by type:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get nodes by language
 * GET /api/graph/nodes/language/:language
 */
router.get('/nodes/language/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const graph = await getOrCreateGraph(path);
    const nodes = graph.getNodesByLanguage(language);

    res.json({
      success: true,
      language,
      count: nodes.length,
      nodes,
    });
  } catch (error) {
    console.error('[Graph API] Error getting nodes by language:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get most used nodes (highest in-degree)
 * GET /api/graph/analysis/most-used
 */
router.get('/analysis/most-used', async (req, res) => {
  try {
    const { path, limit } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const graph = await getOrCreateGraph(path);
    const nodes = graph.getMostUsedNodes(parseInt(limit) || 10);

    res.json({
      success: true,
      analysis: 'most-used-nodes',
      count: nodes.length,
      nodes,
    });
  } catch (error) {
    console.error('[Graph API] Error analyzing most used nodes:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get most dependent nodes (highest out-degree)
 * GET /api/graph/analysis/most-dependent
 */
router.get('/analysis/most-dependent', async (req, res) => {
  try {
    const { path, limit } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const graph = await getOrCreateGraph(path);
    const nodes = graph.getMostDependentNodes(parseInt(limit) || 10);

    res.json({
      success: true,
      analysis: 'most-dependent-nodes',
      count: nodes.length,
      nodes,
    });
  } catch (error) {
    console.error('[Graph API] Error analyzing most dependent nodes:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Find circular dependencies
 * GET /api/graph/analysis/cycles
 */
router.get('/analysis/cycles', async (req, res) => {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const graph = await getOrCreateGraph(path);
    const cycles = graph.findCircularDependencies();

    res.json({
      success: true,
      analysis: 'circular-dependencies',
      cycleCount: cycles.length,
      cycles,
    });
  } catch (error) {
    console.error('[Graph API] Error finding cycles:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get graph statistics
 * GET /api/graph/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const graph = await getOrCreateGraph(path);
    const stats = graph.getStats();
    const memoryStats = graph.getMemoryStats();

    res.json({
      success: true,
      stats: {
        ...stats,
        memory: memoryStats,
      },
    });
  } catch (error) {
    console.error('[Graph API] Error getting stats:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Recompute graph (when repository changes)
 * POST /api/graph/recompute
 */
router.post('/recompute', async (req, res) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    console.log('[Graph API] Recomputing graph for:', path);
    invalidateGraph(path);
    
    const graph = await getOrCreateGraph(path);
    const graphData = graph.getGraph();

    res.json({
      success: true,
      message: 'Graph recomputed successfully',
      data: graphData,
      stats: graph.getStats(),
    });
  } catch (error) {
    console.error('[Graph API] Error recomputing graph:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export graph to JSON
 * GET /api/graph/export
 */
router.get('/export', async (req, res) => {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const graph = await getOrCreateGraph(path);
    const exportData = await graph.exportToJSON();

    res.json(exportData);
  } catch (error) {
    console.error('[Graph API] Error exporting graph:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check for graph service
 * GET /api/graph/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Global Dependency Graph API',
    features: [
      'Repository Structural Extraction (F0)',
      'Global Dependency Graph (F1)',
      'Node analysis',
      'Circular dependency detection',
      'Statistics and metrics',
    ],
  });
});

module.exports = router;
