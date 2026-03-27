# CBCT Public Launch API - Technical Architecture

## System Diagram

```
External System (e.g., AetherOS)
        │
        │ calls: window.CBCT.launch(config)
        ▼
    ┌────────────────────────────────────────┐
    │   PUBLIC API LAYER                     │
    │   client/src/public/launch.js          │
    │                                        │
    │   export function launch({             │
    │     repoPath,                          │
    │     mode,                              │
    │     initialData                        │
    │   })                                   │
    │                                        │
    │   ✓ External facing only               │
    │   ✓ No internal implementation exposed │
    └────────────────────────────────────────┘
        │
        │ calls store actions
        ▼
    ┌────────────────────────────────────────┐
    │   STORE LAYER (Internal)               │
    │   client/src/store/useStore.js         │
    │                                        │
    │   ✓ mode: 'standalone'|'embedded'     │
    │   ✓ setMode(mode)                      │
    │   ✓ bootstrap(data)                    │
    │   ✓ setRepositoryPath(path)            │
    │                                        │
    │   All state management here            │
    └────────────────────────────────────────┘
        │
        │ updates state
        ▼
    ┌────────────────────────────────────────┐
    │   COMPONENT LAYER                      │
    │   client/src/App.jsx                   │
    │                                        │
    │   ✓ Reads mode, repositoryPath         │
    │   ✓ Conditionally shows welcome        │
    │   ✓ Auto-triggers analysis in embedded │
    │   ✓ Renders graph when ready           │
    └────────────────────────────────────────┘
```

## Data Flow: Standalone Mode

```
User visits CBCT
    ↓
App.jsx: mode === 'standalone' ✓ (default)
    ↓
repositoryPath === null ✓
    ↓
showWelcome = true
    ↓
WelcomeScreen renders
    ↓
User inputs repo path
    ↓
setRepositoryPath(path) called
    ↓
Analysis runs, graph displays
```

## Data Flow: Embedded Mode (Auto-Analysis)

```
External system calls:
  window.CBCT.launch({
    repoPath: '/path/to/repo',
    mode: 'embedded'
  })
    ↓
launch.js: store.setMode('embedded')
    ↓
launch.js: store.setRepositoryPath(repoPath)
    ↓
App.jsx: useEffect detects embedded mode + repo path
    ↓
Automatically triggers: setRepositoryPath(repoPath)
    ↓
Analysis runs, graph displays
```

## Data Flow: Embedded Mode (Cached Data)

```
External system calls:
  window.CBCT.launch({
    repoPath: '/path/to/repo',
    mode: 'embedded',
    initialData: cachedGraph
  })
    ↓
launch.js: store.setMode('embedded')
    ↓
launch.js: store.bootstrap(initialData)
    ↓
bootstrap() loads graph into state
    ↓
App.jsx: graphData !== null
    ↓
Graph displays immediately (no API calls)
```

## Module Responsibilities

### `client/src/public/launch.js`
**What it does**: Acts as the only interface between external systems and CBCT

```javascript
export function launch({ repoPath, mode, initialData }) {
  // 1. Get store reference (safe access)
  const store = getCBCTStore.getState();
  
  // 2. Set mode
  store.setMode(mode);
  
  // 3. Load cached data if provided
  if (initialData) store.bootstrap(initialData);
  
  // 4. Trigger analysis if repo path provided
  if (repoPath && !initialData) store.setRepositoryPath(repoPath);
}
```

**Guarantees**:
- ✓ Never exposes internal store to external code
- ✓ Handles all three launch scenarios
- ✓ Simple, predictable behavior
- ✓ No external system knowledge

---

### `client/src/store/useStore.js`
**What it does**: Central state management (unchanged philosophy)

**New additions**:
```javascript
mode: 'standalone',  // Launch mode

setMode: (mode) => {
  // Validate and set mode
  if (mode === 'standalone' || mode === 'embedded') {
    set({ mode });
  }
}

bootstrap: (data) => {
  // Load pre-computed data
  if (data.graph) {
    set({ graphData: data.graph });
    // Initialize semantic layer with loaded graph
  }
  if (data.metrics) {
    set({ complexityData, centralityData });
  }
}
```

**Guarantees**:
- ✓ All state logic in one place
- ✓ Follows existing Zustand patterns
- ✓ No external calls from store
- ✓ Pure state transitions

---

### `client/src/App.jsx`
**What it does**: Smart rendering based on mode and state

**Changes**:
```javascript
// 1. Read mode from store
const { mode } = useStore();

// 2. Update welcome logic
const showWelcome = !repositoryPath && !isLoading && mode === 'standalone';

// 3. Add auto-trigger effect
useEffect(() => {
  if (mode === 'embedded' && repositoryPath && !graphData && !isLoading && !error) {
    setRepositoryPath(repositoryPath);
  }
}, [mode, repositoryPath, graphData, isLoading, error]);
```

**Guarantees**:
- ✓ Respects mode setting
- ✓ Auto-analysis only in embedded mode
- ✓ User interaction still works in standalone
- ✓ Clean state transitions

---

### `client/src/main.jsx`
**What it does**: Makes public API globally accessible

```javascript
import { launch } from './public/launch';

window.CBCT = { launch };
```

**Guarantees**:
- ✓ Minimal global pollution
- ✓ Only public API exposed
- ✓ No internal implementation details visible
- ✓ Safe for external scripts

---

## Data Structures

### Launch Configuration
```typescript
interface LaunchConfig {
  repoPath?: string;
  mode?: 'standalone' | 'embedded';
  initialData?: {
    graph: {
      nodes: Node[];
      edges: Edge[];
      metadata: object;
    };
    metrics?: {
      complexity?: object;
      centrality?: object;
    };
  };
}
```

### Store State (Relevant Parts)
```typescript
interface CBCTState {
  // New for public API
  mode: 'standalone' | 'embedded';
  setMode(mode: string): void;
  bootstrap(data: any): void;
  
  // Existing (used by public API)
  repositoryPath: string | null;
  graphData: object | null;
  isLoading: boolean;
  error: string | null;
  setRepositoryPath(path: string): Promise<void>;
  // ... other state and actions
}
```

---

## Execution Order in Embedded Mode

```
T0: External system calls window.CBCT.launch(config)
T1: launch.js receives config
T2: store.setMode('embedded') → mode state updated
T3: If initialData: store.bootstrap(data) → graph loaded
T4: If repoPath && !initialData: store.setRepositoryPath(path) → analysis starts
T5: App.jsx renders waiting for graphData
T6: Optional: API analysis completes, graph stored
T7: App.jsx detects graphData change, renders graph
```

---

## Error Handling

### At Public API Level
```javascript
function launch(config) {
  try {
    const store = getCBCTStore.getState();
    
    // Validate mode
    if (config.mode && !['standalone', 'embedded'].includes(config.mode)) {
      console.warn('Invalid mode:', config.mode);
      return;
    }
    
    // Safe operation sequence
    store.setMode(config.mode || 'standalone');
    if (config.initialData) store.bootstrap(config.initialData);
    if (config.repoPath && !config.initialData) {
      store.setRepositoryPath(config.repoPath);
    }
  } catch (error) {
    console.error('CBCT launch failed:', error);
    // Fail gracefully, don't crash external system
  }
}
```

### At Store Level
```javascript
setRepositoryPath: async (path) => {
  set({ isLoading: true, error: null });
  try {
    // Perform analysis...
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
}
```

### At Component Level
```javascript
const showError = error && !isLoading;
// Error UI displayed to user
```

---

## Isolation Boundaries

### Public Boundary
```
What external systems CAN do:
  ✓ Call window.CBCT.launch(config)
  ✓ Provide repoPath
  ✓ Provide initialData
  ✓ Set mode to 'embedded'
  ✓ Switch repositories
```

### Private Boundary
```
What external systems CANNOT do:
  ✗ Access useStore directly
  ✗ Call store actions (except via launch)
  ✗ Modify graphData
  ✗ Inspect semantic layer state
  ✗ Make assumptions about internals
```

---

## Backward Compatibility

### Existing CBCT Usage
```javascript
// OLD: Still works
import { useStore } from './store/useStore';
const { setRepositoryPath } = useStore();
setRepositoryPath(path);
```

### New Public API
```javascript
// NEW: Recommended for external systems
window.CBCT.launch({
  repoPath: path,
  mode: 'embedded'
});
```

**Result**: Both work fine because internal logic unchanged

---

## Performance Implications

### With Cached Data
```
CBCT.launch({ repoPath: '/repo', mode: 'embedded', initialData })
  ├─ bootstrap() → O(1) store update
  ├─ render → O(n) graph nodes and edges
  ├─ API calls → 0
  └─ Time to display → ~100-500ms (rendering only)
```

### Without Cached Data
```
CBCT.launch({ repoPath: '/repo', mode: 'embedded' })
  ├─ setRepositoryPath() → API call
  ├─ scanRepository() → O(n) file system scan
  ├─ analyzeDependencies() → O(e) dependency analysis
  ├─ render → O(n) graph nodes and edges
  ├─ fetchGitIntelligence() → async git operations
  └─ Time to display → seconds to minutes (depends on repo size)
```

**Optimization**: Always provide initialData if available

---

## Thread Safety

Zustand stores are synchronous and single-threaded (JavaScript):
- ✓ No race conditions
- ✓ No concurrent state updates
- ✓ Predictable behavior
- ✓ External systems can safely call launch() multiple times

---

## Testing Strategy

### Unit Tests
```javascript
describe('CBCT Public API', () => {
  test('launch() with no args shows welcome', () => {
    window.CBCT.launch({});
    expect(store.mode).toBe('standalone');
  });
  
  test('launch() with repoPath and embedded mode triggers analysis', () => {
    window.CBCT.launch({
      repoPath: '/test',
      mode: 'embedded'
    });
    expect(store.isLoading).toBe(true);
  });
  
  test('launch() with initialData loads graph instantly', () => {
    window.CBCT.launch({
      repoPath: '/test',
      mode: 'embedded',
      initialData: mockGraph
    });
    expect(store.graphData).toEqual(mockGraph.graph);
  });
});
```

### Integration Tests
```javascript
describe('CBCT Embedded Integration', () => {
  test('External system can switch repositories', () => {
    // Launch repo 1
    window.CBCT.launch({
      repoPath: '/repo1',
      mode: 'embedded'
    });
    // Later, switch to repo 2
    window.CBCT.launch({
      repoPath: '/repo2',
      mode: 'embedded'
    });
    // Verify second analysis started
  });
});
```

---

## Deployment Checklist

- [ ] No breaking changes to existing CBCT usage
- [ ] Public API available at `window.CBCT.launch`
- [ ] Standalone mode works as before
- [ ] Embedded mode respects autoAnalysis
- [ ] Cached data loading works
- [ ] Error states handled gracefully
- [ ] Documentation complete
- [ ] Integration examples provided

---

## Key Architectural Decisions

### 1. Why separate `launch.js`?
- ✓ Clear public contract
- ✓ Single point of integration
- ✓ Easy to document
- ✓ Simple to version if needed

### 2. Why `bootstrap()` instead of direct data assignment?
- ✓ Encapsulates how data is ingested
- ✓ Can validate and transform data
- ✓ Can initialize related state (semantic layer, etc.)
- ✓ Hide implementation details

### 3. Why not expose store directly?
- ✓ Prevent external code from breaking CBCT's invariants
- ✓ Make integration explicit and auditable
- ✓ Allow internal refactoring without breaking external code
- ✓ Better security and isolation

### 4. Why mode-based logic instead of function parameters?
- ✓ Explicit state in store (can be inspected)
- ✓ Clear behavioral contract
- ✓ Easy to extend with more modes in future
- ✓ Works with React/Zustand patterns

---

## Summary

The CBCT public API follows these principles:

1. **Minimal public surface** - Only what's needed for integration
2. **Clear contracts** - Explicit behavior based on parameters
3. **Complete isolation** - External code never touches internals
4. **Backward compatibility** - Existing code unaffected
5. **Extensibility** - Easy to add features without breaking integration

Result: CBCT is now both a powerful standalone tool AND a clean integration partner.
