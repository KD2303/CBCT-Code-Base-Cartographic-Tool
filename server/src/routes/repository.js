const express = require('express');
const router = express.Router();
const pathLib = require('path');
const { scanRepositoryInput, getFileTreeInput } = require('../services/repositoryService');

function normalizeRepoPath(input) {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim();
  // Strip surrounding quotes if present
  const unquoted = trimmed.replace(/^['"]|['"]$/g, '');
  // Preserve URLs to avoid breaking protocol/slashes
  if (/^https?:\/\//i.test(unquoted)) {
    return unquoted;
  }
  // Normalize slashes and segments (handles Windows vs POSIX)
  return pathLib.normalize(unquoted);
}

// POST /api/repository/scan - Scan a local repository
router.post('/scan', async (req, res) => {
  try {
    const rawPath = req.body.path;
    const repoPath = normalizeRepoPath(rawPath);
    
    console.log('[Repository] Scan request for:', repoPath);
    
    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const result = await scanRepositoryInput(repoPath);
    console.log('[Repository] Scan success - clonePath:', result.clonePath, 'files:', result.totalFiles);
    res.json(result);
  } catch (error) {
    console.error('[Repository] Error scanning:', error.message);
    console.error('[Repository] Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/repository/tree - Get file tree structure
router.get('/tree', async (req, res) => {
  try {
    const rawPath = req.query.path;
    const repoPath = normalizeRepoPath(rawPath);
    
    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const result = await getFileTreeInput(repoPath);
    res.json(result);
  } catch (error) {
    console.error('Error getting file tree:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
