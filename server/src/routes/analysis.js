const express = require('express');
const router = express.Router();
const {
  analyzeDependencies,
  analyzeComplexity,
  analyzeCentrality,
  getModuleInsights,
  expandUnit,
  getUnitImpact,
  analyzeGitChurn,
  analyzePRImpact
} = require('../services/analysisService');

// POST /api/analysis/dependencies - Analyze file dependencies
router.post('/dependencies', async (req, res) => {
  try {
    const { path, language } = req.body;

    console.log('[Analysis] Dependencies request for path:', path);

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const dependencies = await analyzeDependencies(path, language || 'javascript');
    // If analysis service returned an error object, surface it as 400 when it's a path/validation issue
    if (dependencies && dependencies.error && /path does not exist|not a directory|Repository path is required/i.test(dependencies.error)) {
      console.warn('[Analysis] Validation error during dependency analysis:', dependencies.error);
      return res.status(400).json({ error: dependencies.error });
    }

    console.log('[Analysis] Success - Nodes:', dependencies.nodes?.length, 'Edges:', dependencies.edges?.length);
    res.json(dependencies);
  } catch (error) {
    // If validation-like error, return 400 to client for clearer feedback
    const msg = error?.message || String(error);
    console.error('[Analysis] Error analyzing dependencies:', msg);
    console.error('[Analysis] Stack:', error.stack);
    if (/path does not exist|not a directory|Repository path is required/i.test(msg)) {
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: msg });
  }
});

// POST /api/analysis/complexity - Analyze code complexity
router.post('/complexity', async (req, res) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const complexity = await analyzeComplexity(path);
    res.json(complexity);
  } catch (error) {
    console.error('Error analyzing complexity:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analysis/centrality - Analyze module centrality
router.post('/centrality', async (req, res) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const centrality = await analyzeCentrality(path);
    res.json(centrality);
  } catch (error) {
    console.error('Error analyzing centrality:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analysis/insights/:nodeId - Get insights for a specific node
router.get('/insights/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { path } = req.query;

    const insights = await getModuleInsights(path, nodeId);
    res.json(insights);
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analysis/expand - Expand a unit to show its internals (Layer 2+)
router.post('/expand', async (req, res) => {
  try {
    const { path, unitId, depth } = req.body;

    if (!path || !unitId) {
      return res.status(400).json({ error: 'Repository path and unitId are required' });
    }

    const expanded = await expandUnit(path, unitId, depth || 1);
    res.json(expanded);
  } catch (error) {
    console.error('Error expanding unit:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analysis/impact - Get impact chain for a unit (Layer 3)
router.post('/impact', async (req, res) => {
  try {
    const { path, unitId } = req.body;

    if (!path || !unitId) {
      return res.status(400).json({ error: 'Repository path and unitId are required' });
    }

    const impact = await getUnitImpact(path, unitId);
    res.json(impact);
  } catch (error) {
    console.error('Error getting unit impact:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analysis/git/churn - Analyze historical hotspots
router.post('/git/churn', async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) return res.status(400).json({ error: 'Repository path is required' });
    const churn = await analyzeGitChurn(path);
    res.json(churn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analysis/git/impact - Analyze PR diff impact
router.post('/git/impact', async (req, res) => {
  try {
    const { path, baseBranch } = req.body;
    if (!path) return res.status(400).json({ error: 'Repository path is required' });
    const changedFiles = await analyzePRImpact(path, baseBranch || 'main');
    res.json(changedFiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

