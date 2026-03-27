/**
 * CBCT Public Launch Interface
 * 
 * Provides a clean, integration-ready API for launching CBCT as a standalone tool
 * or as part of an external system (e.g., AetherOS).
 * 
 * This module is the ONLY public contract - internal store implementation is hidden.
 */

import { useStore as getCBCTStore } from '../store/useStore';

/**
 * Launch CBCT with optional configuration
 * 
 * @param {Object} config - Launch configuration
 * @param {string} [config.repoPath] - Repository path to analyze (local path or GitHub URL)
 * @param {string} [config.mode='standalone'] - Launch mode: 'standalone' or 'embedded'
 * @param {Object} [config.initialData] - Pre-computed graph data for bootstrap (skips analysis)
 * 
 * Modes:
 * - 'standalone': CBCT shows welcome screen if no repoPath. User inputs repo manually.
 * - 'embedded': CBCT is controlled by external system. Auto-starts analysis or skips if initialData provided.
 * 
 * @example
 * // Standalone usage (existing behavior)
 * CBCT.launch({})
 * 
 * // Embedded usage with automatic analysis
 * CBCT.launch({
 *   repoPath: '/path/to/repo',
 *   mode: 'embedded'
 * })
 * 
 * // Embedded usage with pre-loaded data (no API calls)
 * CBCT.launch({
 *   repoPath: '/path/to/repo',
 *   mode: 'embedded',
 *   initialData: cachedGraphData
 * })
 */
export function launch({ repoPath, mode = 'standalone', initialData } = {}) {
  const store = getCBCTStore.getState();

  // Set launch mode
  store.setMode(mode);

  // If initial data provided, bootstrap directly
  if (initialData) {
    store.bootstrap(initialData);
  }

  // If repoPath provided and no initial data, trigger analysis
  if (repoPath && !initialData) {
    store.setRepositoryPath(repoPath);
  } else if (repoPath) {
    // Even with initial data, update paths without triggering analysis
    store.setRepositoryPath(repoPath);
  }
}

/**
 * For debugging: get current CBCT state
 * NOT exposed in public API - internal only
 */
export function _getDebugState() {
  const store = getCBCTStore.getState();
  return {
    mode: store.mode,
    repoPath: store.repositoryPath,
    effectivePath: store.effectivePath,
    graphLoaded: store.graphData !== null,
    isLoading: store.isLoading,
    error: store.error
  };
}
