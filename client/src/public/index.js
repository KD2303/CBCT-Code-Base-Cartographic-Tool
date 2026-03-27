/**
 * CBCT Public API Index
 * 
 * This is the official public contract for CBCT integration.
 * All other modules and internal store access are considered private.
 * 
 * External systems should ONLY use the functions exported here.
 */

export { launch } from './launch';

/**
 * PUBLIC API REFERENCE
 * 
 * ============================================
 * window.CBCT.launch(config)
 * ============================================
 * 
 * Launch/configure CBCT with the given options.
 * 
 * @param {Object} config - Configuration object (all properties optional)
 * @param {string} config.repoPath - Repository path (local path or GitHub URL)
 * @param {string} config.mode - 'standalone' (default) or 'embedded'
 * @param {Object} config.initialData - Pre-computed graph data to bootstrap
 * 
 * 
 * USAGE EXAMPLES:
 * 
 * 1. STANDALONE MODE (existing behavior - default)
 *    User sees welcome screen and inputs repo manually
 *    
 *    CBCT.launch({})
 *    // or completely omit argument
 *    CBCT.launch()
 * 
 * 
 * 2. EMBEDDED MODE with automatic analysis
 *    CBCT auto-starts analyzing the provided repo
 *    
 *    CBCT.launch({
 *      repoPath: '/path/to/repo',
 *      // or: 'https://github.com/owner/repo'
 *      mode: 'embedded'
 *    })
 * 
 * 
 * 3. EMBEDDED MODE with pre-loaded data (no API calls)
 *    CBCT skips analysis and shows pre-computed graph immediately
 *    
 *    CBCT.launch({
 *      repoPath: '/path/to/repo',
 *      mode: 'embedded',
 *      initialData: {
 *        graph: cachedGraphData,  // from previous analysis
 *        metrics: {
 *          complexity: complexityData,
 *          centrality: centralityData
 *        }
 *      }
 *    })
 * 
 * 
 * ============================================
 * MODE BEHAVIOR
 * ============================================
 * 
 * STANDALONE MODE (default):
 * - Shows welcome screen when initialized with no repoPath
 * - User manually inputs repository path
 * - Preserves existing CBCT behavior
 * - External systems cannot control analysis flow
 * 
 * EMBEDDED MODE:
 * - Hides welcome screen
 * - Automatically starts analysis if repoPath provided
 * - If initialData provided, skips API analysis entirely
 * - Suitable for integration with external systems (e.g., AetherOS)
 * - CBCT remains fully independent with no AetherOS dependencies
 * 
 * 
 * ============================================
 * CONSTRAINTS & GUARANTEES
 * ============================================
 * 
 * ✓ CBCT is always standalone and independent
 * ✓ No AetherOS or external system dependencies are introduced
 * ✓ Internal store/state management is never exposed externally
 * ✓ All existing CBCT features work unchanged in standalone mode
 * ✓ Initial data format matches graph analysis output
 * 
 * ✗ Never access useStore directly from external systems
 * ✗ Never modify CBCT's internal state directly
 * ✗ Never assume CBCT implementation details
 * ✗ Never introduce reverse dependencies on external systems
 */
