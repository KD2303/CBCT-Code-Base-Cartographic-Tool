/**
 * CBCT Public Launch API - Implementation Examples & Testing
 * 
 * This file demonstrates proper usage of the public launch interface
 * and serves as a reference for external systems integrating with CBCT.
 */

/**
 * EXAMPLE 1: Standalone Mode (Default)
 * 
 * CBCT runs independently with no external control.
 * User sees welcome screen and inputs repository manually.
 * This is the default behavior - useful for standalone deployments.
 */
export function example_standaloneMode() {
  // Initialize CBCT in standalone mode (implicit when no mode specified)
  if (window.CBCT) {
    window.CBCT.launch({
      // No repoPath: shows welcome screen
      // No mode: defaults to 'standalone'
    });
  }
}

/**
 * EXAMPLE 2: Embedded Mode - Auto Analysis
 * 
 * External system (like AetherOS) provides a repo path.
 * CBCT automatically starts analysis without showing welcome screen.
 * User sees loading animation while analysis runs.
 * 
 * Scenario: AetherOS opens CBCT and wants to analyze a specific repo
 */
export function example_embeddedModeAutoAnalysis() {
  if (window.CBCT) {
    const repoPath = '/Projects/my-app'; // from AetherOS context
    
    window.CBCT.launch({
      repoPath: repoPath,
      mode: 'embedded'
      // No initialData: CBCT will fetch analysis from API
    });
  }
}

/**
 * EXAMPLE 3: Embedded Mode - With Cached Data
 * 
 * External system has pre-computed graph from previous analysis.
 * CBCT loads cached data immediately (instant display, no API calls).
 * Useful for fast context switching or offline scenarios.
 * 
 * Scenario: AetherOS recalls cached analysis for performance
 */
export function example_embeddedModeWithCache() {
  if (window.CBCT) {
    const repoPath = '/Projects/my-app';
    const cachedAnalysis = {
      timestamp: Date.now(),
      graph: {
        nodes: [
          { id: 'main.js', type: 'file', name: 'main.js' },
          { id: 'config.js', type: 'file', name: 'config.js' }
        ],
        edges: [
          { source: 'main.js', target: 'config.js', type: 'import' }
        ],
        metadata: { revealDepth: 3 }
      },
      metrics: {
        complexity: { 'main.js': 8, 'config.js': 3 },
        centrality: { 'main.js': 0.95, 'config.js': 0.35 }
      }
    };
    
    window.CBCT.launch({
      repoPath: repoPath,
      mode: 'embedded',
      initialData: cachedAnalysis
    });
  }
}

/**
 * EXAMPLE 4: Defensive Integration Pattern
 * 
 * Safe pattern that handles CBCT not being loaded yet.
 * Useful when CBCT is loaded asynchronously or optionally.
 */
export function example_defensiveIntegration() {
  // Check if CBCT is available
  if (!window.CBCT || !window.CBCT.launch) {
    console.warn('CBCT not loaded. Skipping integration.');
    return;
  }
  
  try {
    window.CBCT.launch({
      repoPath: '/path/to/repo',
      mode: 'embedded'
    });
  } catch (error) {
    console.error('Failed to launch CBCT:', error.message);
  }
}

/**
 * EXAMPLE 5: Migration Pattern
 * 
 * For systems currently using CBCT standalone,
 * this shows how to upgrade to embedded mode
 * without breaking existing functionality.
 */
export function example_migrationPath() {
  // OLD PATTERN (still works in standalone mode):
  // window.CBCT.launch({})
  // User manually inputs repo when welcome screen appears
  
  // NEW PATTERN (with optional external control):
  const externalRepoPath = getRepoPathFromExternalSystem();
  
  window.CBCT.launch({
    repoPath: externalRepoPath || undefined,
    mode: externalRepoPath ? 'embedded' : 'standalone'
  });
  
  function getRepoPathFromExternalSystem() {
    // Return repo path if available from external system, else null
    return null; // In standalone, this would be null
  }
}

/**
 * ANTI-PATTERNS & What NOT to Do
 */
export const antiPatterns = {
  /**
   * ❌ WRONG: Do not access internal store
   */
  wrong_directStoreAccess() {
    // This violates the public contract and is fragile
    // const store = useStore.getState();
    // store.setRepositoryPath(path);
  },

  /**
   * ❌ WRONG: Do not manipulate store state externally
   */
  wrong_externalStateManipulation() {
    // const store = useStore.getState();
    // store.graphData = cachedGraph; // BAD!
  },

  /**
   * ❌ WRONG: Do not assume CBCT implementation details
   */
  wrong_assumingImplementation() {
    // What if store changes? What if internals refactor?
    // Always use the public API
  },

  /**
   * ❌ WRONG: Do not create circular dependencies
   */
  wrong_circularDependencies() {
    // CBCT should never depend on AetherOS
    // AetherOS can depend on CBCT, not the other way around
  },

  /**
   * ❌ WRONG: Do not hardcode CBCT-specific logic in external systems
   */
  wrong_hardcodedIntegration() {
    // Maintain clean separation of concerns
    // CBCT should work standalone AND embedded
  }
};

/**
 * TEST SCENARIOS
 * 
 * For development/testing teams, verify these scenarios work correctly:
 */
export const testScenarios = {
  /**
   * Test 1: Standalone initialization works
   */
  test_standaloneInitialization() {
    window.CBCT.launch({});
    // Expected: Welcome screen appears, no repo selected
  },

  /**
   * Test 2: Embedded mode with repo path auto-starts analysis
   */
  test_embeddedAutoAnalysis() {
    window.CBCT.launch({
      repoPath: '/path/to/test/repo',
      mode: 'embedded'
    });
    // Expected: No welcome screen, loading animation shows, analysis starts
  },

  /**
   * Test 3: Embedded mode with cached data loads instantly
   */
  test_embeddedWithCache() {
    const mockData = {
      graph: {
        nodes: [{ id: 'test.js' }],
        edges: [],
        metadata: { revealDepth: 3 }
      }
    };
    
    window.CBCT.launch({
      repoPath: '/path/to/test/repo',
      mode: 'embedded',
      initialData: mockData
    });
    // Expected: No welcome screen, no API loading, graph displays immediately
  },

  /**
   * Test 4: External system can switch repos
   */
  test_repoSwitching() {
    // First repo
    window.CBCT.launch({
      repoPath: '/path/to/repo1',
      mode: 'embedded'
    });
    
    // After analysis completes, switch to second repo
    setTimeout(() => {
      window.CBCT.launch({
        repoPath: '/path/to/repo2',
        mode: 'embedded'
      });
    }, 5000);
    // Expected: Graph resets, new analysis begins
  },

  /**
   * Test 5: Standalone mode remains fully independent
   */
  test_standaloneIndependence() {
    // Launch in standalone mode
    window.CBCT.launch({ mode: 'standalone' });
    
    // User manually inputs a repo via UI
    // (simulated by welcome screen interaction)
    // Expected: Works exactly as before, no external system needed
  }
};

/**
 * DEBUGGING & MONITORING
 */
export const debugging = {
  /**
   * Check current CBCT state (internal use only for debugging)
   */
  getDebugInfo() {
    // This is internal and subject to change
    // Use only for debugging integration issues
    if (window.CBCT && window.CBCT._getDebugState) {
      return window.CBCT._getDebugState();
    }
    return null;
  },

  /**
   * Monitor CBCT state changes (advanced users)
   */
  monitorStateChanges() {
    // In production, you would set up a listener on store changes
    // Example using Zustand subscription:
    // const unsubscribe = useStore.subscribe(
    //   (state) => console.log('CBCT state changed:', state),
    //   (state) => state  // select everything
    // );
  }
};
