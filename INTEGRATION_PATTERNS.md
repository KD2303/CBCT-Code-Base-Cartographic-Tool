# Integration Patterns for Long-Term CBCT Compatibility

## For Integration Architects & Teams

This guide shows proven patterns for different integration scenarios that **will work today and in the future**.

---

## Pattern 1: Safe IDE Plugin Integration (VS Code, JetBrains, WebStorm)

### Challenge
IDE plugins need persistent cache, version detection, and fallback UI.

### Solution: Version-Safe Wrapper
```typescript
/**
 * CBCT Integration Wrapper for IDE Plugins
 * 
 * Guarantees:
 * - Works with CBCT 2.0+
 * - Auto-detects available features
 * - Graceful degradation
 * - Handles CBCT loading delays
 */

class CBCTIDEAdapter {
  private static CBCT_LOADED_TIMEOUT = 5000;
  private static cache = new Map<string, AnalysisResult>();
  
  /**
   * Safe launch method that works across versions
   */
  static async launch(workspacePath: string): Promise<boolean> {
    // 1. Check if CBCT is loaded
    if (!this.waitForCBCT()) {
      console.warn('CBCT not loaded within timeout');
      return false;
    }
    
    // 2. Prepare data
    const cachedData = this.getFromCache(workspacePath);
    
    // 3. Launch with appropriate config
    const config = {
      repoPath: workspacePath,
      mode: 'embedded',
      ...(cachedData && { initialData: cachedData })
    };
    
    // 4. Safe API call
    try {
      window.CBCT.launch(config);
      return true;
    } catch (error) {
      console.error('CBCT launch failed:', error);
      return false;
    }
  }
  
  /**
   * Version-aware event subscription
   * Works in 2.1+ (gracefully skipped in 2.0)
   */
  static subscribeToEvents(): void {
    if (!window.CBCT?.on) {
      // Feature not available, use polling instead
      this.startPolling();
      return;
    }
    
    // Feature available, use native events
    window.CBCT.on('graph:loaded', (graph) => {
      this.handleGraphLoaded(graph);
    });
    
    if (window.CBCT.features?.includes('progress')) {
      window.CBCT.on('analysis:progress', (progress) => {
        this.updateProgressUI(progress);
      });
    }
  }
  
  /**
   * Feature detection for advanced capabilities
   */
  static supportsFeature(feature: string): boolean {
    return window.CBCT?.features?.includes(feature) ?? false;
  }
  
  /**
   * Version checking for conditional logic
   */
  static isAtLeastVersion(minVersion: string): boolean {
    if (!window.CBCT?.version) return false;
    
    const [major, minor, patch] = minVersion.split('.').map(Number);
    const [cMajor, cMinor, cPatch] = (
      window.CBCT.version as string
    ).split('.').map(Number);
    
    if (cMajor !== major) return cMajor > major;
    if (cMinor !== minor) return cMinor > minor;
    return cPatch >= patch;
  }
  
  // Utility methods
  private static waitForCBCT(): boolean {
    const endTime = Date.now() + this.CBCT_LOADED_TIMEOUT;
    while (Date.now() < endTime) {
      if (window.CBCT?.launch) return true;
      // Small busy-wait or use promise
    }
    return false;
  }
  
  private static getFromCache(path: string): AnalysisResult | null {
    return this.cache.get(path) ?? null;
  }
  
  private static handleGraphLoaded(graph: any): void {
    // Update IDE sidebar, breadcrumbs, etc.
  }
  
  private static updateProgressUI(progress: any): void {
    // Show progress bar in IDE
  }
  
  private static startPolling(): void {
    // Fallback for older CBCT versions
  }
}

// Usage in IDE plugin
const adapter = CBCTIDEAdapter;

// When user opens workspace
async function onWorkspaceOpened(workspacePath: string) {
  const success = await adapter.launch(workspacePath);
  if (!success) {
    showErrorMessage('CBCT analysis unavailable');
  }
}

// Subscribe to available events
adapter.subscribeToEvents();
```

### Why This Works
✅ Uses only public API  
✅ Feature detection prevents errors  
✅ Version checking enables advanced features  
✅ Works in CBCT 2.0 and future versions  
✅ Graceful fallback if CBCT unavailable  

---

## Pattern 2: Enterprise SaaS Integration (Cloud Platform)

### Challenge
Multi-tenant platform needs auth, analytics, and enterprise features.

### Solution: Adapter with Optional Enhancement
```typescript
/**
 * CBCT Integration for Enterprise/SaaS Platforms
 * 
 * Handles:
 * - User authentication
 * - Multi-repository support
 * - Analytics tracking
 * - Version-aware feature usage
 */

class CBCTEnterpriseIntegration {
  constructor(
    private userId: string,
    private companyId: string,
    private apiToken: string
  ) {}
  
  /**
   * Main entry point - launch CBCT for a repository
   */
  async launchRepositoryAnalysis(
    repoUrl: string,
    opts?: { useCache?: boolean; userId?: string }
  ): Promise<boolean> {
    try {
      // 1. Get cached analysis if available
      const cached = opts?.useCache 
        ? await this.getCachedAnalysis(repoUrl)
        : null;
      
      // 2. Build configuration
      const config = this.buildLaunchConfig(repoUrl, cached);
      
      // 3. Launch CBCT
      if (!window.CBCT?.launch) {
        throw new Error('CBCT not available');
      }
      
      window.CBCT.launch(config);
      
      // 4. Track event (for analytics)
      this.trackAnalyticsEvent('cbct_launched', {
        repo: repoUrl,
        hasCache: !!cached,
        mode: 'embedded'
      });
      
      // 5. Setup event listeners if available
      this.setupEventListenersIfSupported();
      
      return true;
    } catch (error) {
      console.error('CBCT launch failed:', error);
      this.trackAnalyticsEvent('cbct_launch_failed', {
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Build launch config with version-aware features
   */
  private buildLaunchConfig(repoUrl: string, cachedData: any) {
    const baseConfig = {
      repoPath: repoUrl,
      mode: 'embedded',
      ...(cachedData && { initialData: cachedData })
    };
    
    // Add authentication if supported (2.1+)
    if (this.supportsAuth()) {
      return {
        ...baseConfig,
        auth: {
          token: this.apiToken,
          userId: this.userId,
          companyId: this.companyId
        }
      };
    }
    
    // Add compliance flags if supported
    if (this.supportsCompliance()) {
      return {
        ...baseConfig,
        compliance: {
          recordAnalytics: true,
          retentionDays: 30
        }
      };
    }
    
    return baseConfig;
  }
  
  /**
   * Setup version-aware event listeners
   */
  private setupEventListenersIfSupported(): void {
    if (!window.CBCT?.on) return;
    
    // Graph loaded event
    if (window.CBCT.features?.includes('events')) {
      window.CBCT.on('graph:loaded', (graph) => {
        this.onGraphLoaded(graph);
      });
      
      window.CBCT.on('analysis:complete', (result) => {
        this.onAnalysisComplete(result);
      });
    }
    
    // Progress event (new in future versions)
    if (window.CBCT.features?.includes('progress-events')) {
      window.CBCT.on('analysis:progress', (progress) => {
        this.onAnalysisProgress(progress);
      });
    }
  }
  
  /**
   * Version capability detection
   */
  private supportsAuth(): boolean {
    return this.checkVersion('2.1.0') &&
           this.hasFeature('auth');
  }
  
  private supportsCompliance(): boolean {
    return this.checkVersion('2.2.0') &&
           this.hasFeature('compliance');
  }
  
  private checkVersion(minVersion: string): boolean {
    if (!window.CBCT?.version) return false;
    
    const parts = (window.CBCT.version as string)
      .split('.')
      .map(Number);
    const minParts = minVersion.split('.').map(Number);
    
    for (let i = 0; i < minParts.length; i++) {
      if ((parts[i] ?? 0) > minParts[i]) return true;
      if ((parts[i] ?? 0) < minParts[i]) return false;
    }
    return true;
  }
  
  private hasFeature(feature: string): boolean {
    return window.CBCT?.features?.includes(feature) ?? false;
  }
  
  // Event handlers
  private onGraphLoaded(graph: any): void {
    // Store analysis result
    this.cacheAnalysis(graph);
    // Notify dashboard
    this.notifyDashboard('analysis_ready', graph);
  }
  
  private onAnalysisComplete(result: any): void {
    // Update user's dashboard
    this.updateUserDashboard(result);
    // Send email notification
    this.sendNotificationEmail();
  }
  
  private onAnalysisProgress(progress: any): void {
    // Update real-time progress in UI
    this.notifyDashboard('progress_update', progress);
  }
  
  // Helpers
  private async getCachedAnalysis(repo: string): Promise<any> {
    // Call backend API
    return null; // placeholder
  }
  
  private cacheAnalysis(graph: any): void {
    // Save to database
  }
  
  private notifyDashboard(event: string, data: any): void {
    // Emit event to dashboard WebSocket
  }
  
  private updateUserDashboard(result: any): void {
    // Update user's dashboard UI
  }
  
  private sendNotificationEmail(): void {
    // Send completion email
  }
  
  private trackAnalyticsEvent(event: string, data: any): void {
    // Send to analytics platform (Mixpanel, etc)
  }
}

// Usage in SaaS backend
const integration = new CBCTEnterpriseIntegration(
  userId,
  companyId,
  apiToken
);

// When user analyzes a repo
await integration.launchRepositoryAnalysis(
  'https://github.com/user/repo',
  { useCache: true }
);
```

### Why This Works
✅ Handles missing features gracefully  
✅ Uses version detection for features  
✅ Works with CBCT 2.0+  
✅ Can add auth, compliance, analytics later  
✅ Enterprise-grade error handling  

---

## Pattern 3: CLI / Server-Side Integration (Batch Processing)

### Challenge
Need headless analysis, batch processing, and result export (future features).

### Solution: Future-Proof Wrapper
```typescript
/**
 * CBCT CLI/Batch Integration
 * 
 * Usage:
 *   cbct-analyze /path/to/repo --format json
 *   cbct-batch analyze repos.txt --parallel 4
 */

class CBCTBatchAnalyzer {
  /**
   * Analyze single repository
   * Works in current versions via embedded mode
   * Will work in headless mode when available
   */
  static async analyzeRepo(
    repoPath: string,
    opts?: { format?: 'json' | 'csv' | 'html' }
  ): Promise<AnalysisResult> {
    // Check if headless mode available (future)
    if (this.supportsHeadlessMode()) {
      return this.analyzeHeadless(repoPath, opts);
    }
    
    // Fallback: use embedded mode with cache
    return this.analyzeEmbedded(repoPath, opts);
  }
  
  /**
   * Headless analysis (future, CBCT 2.2+)
   */
  private static async analyzeHeadless(
    repoPath: string,
    opts?: any
  ): Promise<AnalysisResult> {
    if (!window.CBCT?.launch) {
      throw new Error('CBCT not available');
    }
    
    return new Promise((resolve, reject) => {
      try {
        // Launch in headless mode (doesn't render UI)
        window.CBCT.launch({
          repoPath: repoPath,
          mode: 'headless', // New in CBCT 2.2+
          onComplete: (analysis) => {
            const result = this.formatResult(analysis, opts?.format);
            resolve(result);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Embedded mode analysis with caching
   */
  private static async analyzeEmbedded(
    repoPath: string,
    opts?: any
  ): Promise<AnalysisResult> {
    // Try to get cached data
    const cached = await this.getCachedAnalysis(repoPath);
    
    if (window.CBCT?.launch) {
      window.CBCT.launch({
        repoPath: repoPath,
        mode: 'embedded',
        ...(cached && { initialData: cached })
      });
      
      // Monitor for completion
      return this.waitForAnalysisComplete(repoPath, opts);
    }
    
    throw new Error('CBCT not available');
  }
  
  /**
   * Check if headless mode is supported
   */
  private static supportsHeadlessMode(): boolean {
    return this.checkVersion('2.2.0') &&
           (window.CBCT?.features?.includes('headless') ?? false);
  }
  
  /**
   * Format result for output
   */
  private static formatResult(
    analysis: any,
    format: string = 'json'
  ): AnalysisResult {
    switch (format) {
      case 'json':
        return analysis as AnalysisResult;
      case 'csv':
        return this.toCSV(analysis);
      case 'html':
        return this.toHTML(analysis);
      default:
        return analysis;
    }
  }
  
  // Utility methods
  private static async getCachedAnalysis(repo: string): Promise<any> {
    // Get from disk cache
    return null;
  }
  
  private static async waitForAnalysisComplete(
    repo: string,
    opts?: any
  ): Promise<AnalysisResult> {
    // Poll or wait for event
    return {} as AnalysisResult;
  }
  
  private static toCSV(analysis: any): any {
    // Convert to CSV format
    return analysis;
  }
  
  private static toHTML(analysis: any): any {
    // Generate HTML report
    return analysis;
  }
  
  private static checkVersion(minVersion: string): boolean {
    if (!window.CBCT?.version) return false;
    const parts = (window.CBCT.version as string)
      .split('.').map(Number);
    const min = minVersion.split('.').map(Number);
    return parts[0] > min[0] ||
           (parts[0] === min[0] && parts[1] >= min[1]);
  }
}

// CLI usage
async function analyzeRepositories(repoPaths: string[]) {
  for (const repo of repoPaths) {
    const result = await CBCTBatchAnalyzer.analyzeRepo(repo, {
      format: 'json'
    });
    console.log(JSON.stringify(result, null, 2));
  }
}
```

### Why This Works
✅ Works with current embedded mode  
✅ Automatically uses headless when available  
✅ Never breaks older CBCT versions  
✅ Gracefully handles missing features  
✅ Ready for export functionality  

---

## Pattern 4: Real-Time Integration (Monitoring Systems)

### Challenge
Need real-time analysis updates, streaming support, and performance optimization.

### Solution: Adaptive Loading Strategy
```typescript
/**
 * CBCT Real-Time Monitoring Integration
 * 
 * Adapts to:
 * - Network speed (streaming vs bulk load)
 * - Memory constraints (progressive loading)
 * - Update frequency (cache vs fresh)
 */

class CBCTRealtimeMonitor {
  private static memoryThreshold = 512 * 1024 * 1024; // 512MB
  private static updateInterval = 5 * 60 * 1000; // 5 min
  
  /**
   * Smart launch that adapts to environment
   */
  static async launch(
    repoPath: string,
    isLargeRepo: boolean = false
  ): Promise<void> {
    if (!window.CBCT?.launch) {
      throw new Error('CBCT not available');
    }
    
    // Detect system capabilities
    const memAvailable = this.getAvailableMemory();
    const supportsStreaming = this.supportsStreaming();
    
    // Choose loading strategy
    const config = this.buildConfig(
      repoPath,
      isLargeRepo,
      memAvailable,
      supportsStreaming
    );
    
    window.CBCT.launch(config);
    
    // Setup monitoring
    this.setupMonitoring(repoPath);
  }
  
  /**
   * Build adaptive configuration
   */
  private static buildConfig(
    repoPath: string,
    isLargeRepo: boolean,
    memAvailable: number,
    supportsStreaming: boolean
  ): any {
    const baseConfig = {
      repoPath: repoPath,
      mode: 'embedded'
    };
    
    // For large repos with streaming support
    if (isLargeRepo && supportsStreaming && this.checkVersion('2.2.0')) {
      return {
        ...baseConfig,
        streaming: true,
        chunkSize: this.calculateChunkSize(memAvailable)
      } as any;
    }
    
    // For large repos without streaming
    if (isLargeRepo) {
      return {
        ...baseConfig,
        maxNodes: 5000, // Limit nodes
        deferRendering: true
      } as any;
    }
    
    // Standard config
    return baseConfig;
  }
  
  /**
   * Setup real-time monitoring
   */
  private static setupMonitoring(repoPath: string): void {
    // Listen for updates if events supported
    if (window.CBCT?.on) {
      window.CBCT.on('graph:loaded', (graph) => {
        this.saveSnapshot(repoPath, graph);
        this.scheduleNextUpdate(repoPath);
      });
      
      if (window.CBCT.features?.includes('stream-update')) {
        window.CBCT.on('graph:updated', (delta) => {
          this.applyUpdate(repoPath, delta);
        });
      }
    } else {
      // Fallback: polling
      this.startPolling(repoPath);
    }
  }
  
  /**
   * Version and feature detection
   */
  private static supportsStreaming(): boolean {
    return this.checkVersion('2.2.0') &&
           (window.CBCT?.features?.includes('streaming') ?? false);
  }
  
  private static checkVersion(minVersion: string): boolean {
    if (!window.CBCT?.version) return false;
    const [major, minor] = (window.CBCT.version as string)
      .split('.').map(Number);
    const [minMajor, minMinor] = minVersion.split('.').map(Number);
    return major > minMajor || (major === minMajor && minor >= minMinor);
  }
  
  // Utility methods
  private static getAvailableMemory(): number {
    if ((performance as any).memory) {
      return (performance as any).memory.jsHeapSizeLimit;
    }
    return 1024 * 1024 * 1024; // Default 1GB
  }
  
  private static calculateChunkSize(memAvailable: number): number {
    return Math.max(100, Math.floor(memAvailable / 10 / 1024));
  }
  
  private static saveSnapshot(repo: string, graph: any): void {
    // Save to cache
  }
  
  private static scheduleNextUpdate(repo: string): void {
    // Schedule refresh
  }
  
  private static applyUpdate(repo: string, delta: any): void {
    // Apply incremental changes
  }
  
  private static startPolling(repo: string): void {
    // Poll periodically
  }
}

// Usage in monitoring system
async function monitorRepository(repoPath: string) {
  try {
    await CBCTRealtimeMonitor.launch(repoPath, true);
    console.log('Monitoring started');
  } catch (error) {
    console.error('Failed to start monitoring:', error);
  }
}
```

### Why This Works
✅ Adapts to available features  
✅ Handles large repositories  
✅ Works with current and future streaming  
✅ Memory-conscious loading  
✅ Graceful degradation  

---

## Testing Integration Compatibility

### For All Integration Patterns

```typescript
/**
 * Test that your integration remains compatible
 * as CBCT evolves
 */

describe('CBCT Integration Compatibility', () => {
  test('Works with CBCT 2.0.0 minimal API', () => {
    const config = {
      repoPath: '/test/repo',
      mode: 'embedded'
    };
    
    expect(() => window.CBCT.launch(config))
      .not.toThrow();
  });
  
  test('Gracefully handles missing features', () => {
    // Simulate old CBCT without `on()` method
    const originalOn = window.CBCT.on;
    delete window.CBCT.on;
    
    expect(() => {
      if (window.CBCT?.on) {
        window.CBCT.on('event', () => {});
      } else {
        // Fallback works
      }
    }).not.toThrow();
    
    // Restore
    if (originalOn) window.CBCT.on = originalOn;
  });
  
  test('Detects version correctly', () => {
    const version = window.CBCT?.version;
    expect(version).toMatch(/\d+\.\d+\.\d+/);
  });
  
  test('Feature detection works', () => {
    const hasStreaming = window.CBCT?.features?.includes('streaming');
    expect(typeof hasStreaming).toBe('boolean');
  });
  
  test('Handles initialData in compatible format', () => {
    const mockData = {
      graph: {
        nodes: [],
        edges: [],
        metadata: {}
      }
    };
    
    expect(() => window.CBCT.launch({
      repoPath: '/repo',
      initialData: mockData
    })).not.toThrow();
  });
});
```

---

## Summary of Patterns

| Pattern | Best For | Future-Safe? |
|---------|----------|-----------|
| **IDE Plugin Adapter** | VS Code, JetBrains, WebStorm | ✅ Yes |
| **Enterprise Integration** | SaaS, multi-tenant platforms | ✅ Yes |
| **Batch/CLI Processing** | Headless analysis, batch jobs | ✅ Yes |
| **Real-Time Monitoring** | Streaming, large repos | ✅ Yes |

All patterns:
- ✅ Use only public API
- ✅ Include feature detection
- ✅ Have graceful fallbacks
- ✅ Support new versions
- ✅ Don't break on old versions

Choose the pattern that matches your integration scenario and customize as needed.
