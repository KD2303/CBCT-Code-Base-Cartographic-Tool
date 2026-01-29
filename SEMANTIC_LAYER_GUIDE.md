# CBCT Semantic Layer System - Complete Guide

## 🎯 Overview

The **Semantic Layer Engine** is the core innovation of CBCT that enables consistent, intuitive visualization of code repositories regardless of their size. It automatically adapts the level of abstraction while maintaining a uniform user experience.

---

## 🧠 Core Concept: The UNIT

Everything shown in the graph is a **UNIT**. The user never needs to know whether they're looking at files, folders, or semantic clusters - the interaction model remains identical.

### Adaptive Unit Selection

The engine automatically selects the appropriate unit type based on repository size:

| Repository Size | Unit Type | Description |
|----------------|-----------|-------------|
| **Small** (< 80 files) | Files | Each file is a unit |
| **Medium** (80-500 files) | Folders | Each folder is a unit |
| **Large** (≥ 500 files) | Semantic Clusters | Intelligently grouped modules |

> **Critical UX Rule**: This categorization is **INTERNAL ONLY**. The UI always uses the term "unit" and never exposes the underlying implementation.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Restore previous state / Exit focus |
| `+` or `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom |
| `C` | Center view |

---

## 📊 The 4 Semantic Layers

The system progressively reveals information through 4 semantic layers, triggered by zoom level and user interaction:

### Layer 1: Orientation 🗺️
**Zoom Level**: < 0.5 (zoomed out)

**Purpose**: High-level repository overview

**What's Shown**:
- Top 20 most important units
- Major architectural components
- Key entry points and hubs

**Use Case**: "What is this codebase about?"

---

### Layer 2: Structural 🏗️
**Zoom Level**: 0.5 - 1.2 (normal view)

**Purpose**: Understand structure and relationships

**What's Shown**:
- Expanded unit details
- Internal structure of selected units
- Connections between units
- Dependency patterns

**Use Case**: "How are these components connected?"

**Interaction**: Click a unit to expand and see its internals

---

### Layer 3: Impact & Risk ⚠️
**Zoom Level**: 1.2 - 2.0 (zoomed in)

**Purpose**: Assess change impact and identify risks

**What's Shown**:
- **Upstream dependencies**: What this unit depends on
- **Downstream dependencies**: What depends on this unit
- **Risk indicators**:
  - High-impact units (many dependents)
  - High-dependency units (many dependencies)
  - Circular dependencies
  - Isolated units

**Use Case**: "What will break if I change this?"

**Interaction**: Click "Trace Impact" to see the full impact chain

---

### Layer 4: Detail 🔍
**Trigger**: Explicit user action (not automatic zoom)

**Purpose**: Maximum detail for deep analysis

**What's Shown**:
- Full file-level detail
- Line-by-line dependencies
- Code metrics
- Complexity scores

**Use Case**: "I need to understand every detail"

**Interaction**: Click "Inspect Internals" on a unit

---

## 🔧 Technical Architecture

### Server-Side Components

#### 1. Semantic Layer Engine (`semanticLayerEngine.js`)

**Core Functions**:

```javascript
// Main entry point - processes raw data into semantic layers
processForSemanticLayers(rawNodes, rawEdges, fileCount)

// Selects appropriate units based on repo size
selectUnits(nodes, edges, fileCount)

// Expands a unit to show its children (Layer 2+)
expandUnit(unit, allNodes, allEdges, depth)

// Gets impact chain for a unit (Layer 3)
getImpactChain(unitId, units, edges, maxDepth)

// Generates semantic summary for a unit
generateUnitSummary(unit, edges)
```

**Key Constants**:
```javascript
SMALL_REPO_THRESHOLD = 80      // Files
MEDIUM_REPO_THRESHOLD = 500    // Files
MAX_INITIAL_UNITS = 20         // Layer 1 limit
MAX_VISIBLE_NODES = 300        // Safety limit
MAX_DETAIL_NODES = 150         // Expansion limit
```

#### 2. Analysis Service Integration (`analysisService.js`)

```javascript
// Analyzes dependencies with semantic layer processing
async function analyzeDependencies(repoPath, language, useSemanticLayers = true)

// Expands a unit to show internals
async function expandUnit(repoPath, unitId, depth)

// Gets impact chain for a unit
async function getUnitImpact(repoPath, unitId)
```

#### 3. API Endpoints (`routes/analysis.js`)

```javascript
POST /api/analysis/dependencies  // Get initial graph with semantic layers
POST /api/analysis/expand        // Expand a unit (Layer 2)
POST /api/analysis/impact        // Get impact chain (Layer 3)
```

---

### Client-Side Components

#### 1. State Management (`useStore.js`)

**Semantic Layer State**:
```javascript
semanticLayer: {
  currentLayer: 1,           // Current layer (1-4)
  focusedUnit: null,         // Currently focused unit
  expandedUnits: [],         // Expanded units cache
  previousState: null,       // For Escape key restoration
  revealDepth: 3            // Based on repo size
}
```

**Key Actions**:
```javascript
setSemanticLayer(layer)           // Manually set layer
focusUnit(unit)                   // Focus on a unit (auto Layer 2)
expandUnit(unit)                  // Expand unit internals
getUnitImpact(unit)              // Get impact chain (auto Layer 3)
restorePreviousState()           // Restore previous state (Escape)
updateLayerFromZoom(zoomLevel)   // Auto-update layer from zoom
```

#### 2. Visualization (`GraphCanvas.jsx`)

**Zoom-to-Layer Mapping**:
```javascript
if (zoomLevel < 0.5)       → Layer 1 (Orientation)
if (zoomLevel < 1.2)       → Layer 2 (Structural)
if (zoomLevel < 2.0)       → Layer 3 (Impact & Risk)
else                       → Layer 3 (Layer 4 requires explicit action)
```

**Keyboard Shortcuts**:
- `Escape`: Restore previous state / Exit focus mode
- `+` or `=`: Zoom in
- `-`: Zoom out
- `0`: Reset zoom
- `C`: Center view

#### 3. API Client (`api.js`)

```javascript
// Expand a unit to show its internals
async expandUnit(path, unitId, depth = 1)

// Get impact chain for a unit
async getUnitImpact(path, unitId)
```

---

## 🎨 UX Consistency Rules

### ✅ DO:
- Always use the term **"unit"** in the UI
- Provide consistent interactions across all repo sizes
- Use progressive disclosure (zoom to reveal)
- Show metrics in a uniform format
- Use semantic role descriptions ("Core Dependency", "Entry Point", etc.)

### ❌ DON'T:
- Never expose "file", "folder", or "cluster" terminology to users
- Never show different UI elements based on repo size
- Never require users to understand the internal categorization
- Never break the zoom-to-layer mapping

---

## 🧪 Testing Guide

### Test Scenarios

#### 1. Small Repository (< 80 files)
**Expected Behavior**:
- Units are individual files
- All files visible in Layer 1 (up to 20)
- Expansion shows file details
- Fast performance

**Test**:
```bash
# Analyze a small repo
curl -X POST http://localhost:5000/api/analysis/dependencies \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/small/repo"}'
```

**Verify**:
- `metadata.totalUnits` ≈ file count
- `nodes[0].unitType === 'file'`
- `nodes.length <= 20`

---

#### 2. Medium Repository (80-500 files)
**Expected Behavior**:
- Units are folders
- Top 20 folders shown in Layer 1
- Expansion shows files within folder
- Good performance

**Test**:
```bash
curl -X POST http://localhost:5000/api/analysis/dependencies \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/medium/repo"}'
```

**Verify**:
- `nodes[0].unitType === 'folder'`
- `nodes[0].childCount > 0`
- Folder-level edges exist

---

#### 3. Large Repository (≥ 500 files)
**Expected Behavior**:
- Units are semantic clusters
- Top 20 clusters shown in Layer 1
- Expansion shows cluster internals
- Optimized performance

**Test**:
```bash
curl -X POST http://localhost:5000/api/analysis/dependencies \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/large/repo"}'
```

**Verify**:
- `nodes[0].unitType === 'cluster'`
- `nodes[0].label` contains semantic name (e.g., "Module 1")
- Cluster-level edges exist
- Performance remains acceptable

---

#### 4. Layer Transitions
**Test Zoom Behavior**:
1. Start at Layer 1 (zoomed out)
2. Zoom in → Should transition to Layer 2
3. Zoom in more → Should transition to Layer 3
4. Zoom out → Should return to Layer 2, then Layer 1

**Test Interaction Behavior**:
1. Click a unit → Should focus and transition to Layer 2
2. Click "Trace Impact" → Should transition to Layer 3
3. Press Escape → Should restore previous state

---

#### 5. Unit Expansion
**Test**:
```bash
# Expand a unit
curl -X POST http://localhost:5000/api/analysis/expand \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/repo", "unitId": "folder:src", "depth": 1}'
```

**Verify**:
- Returns `nodes` and `edges` for unit internals
- Respects `MAX_DETAIL_NODES` limit
- Depth parameter controls expansion breadth

---

#### 6. Impact Analysis
**Test**:
```bash
# Get impact chain
curl -X POST http://localhost:5000/api/analysis/impact \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/repo", "unitId": "folder:src"}'
```

**Verify**:
- Returns `upstream` and `downstream` arrays
- Includes `riskIndicators` array
- Calculates `totalImpact` correctly

---

## 📈 Performance Considerations

### Safety Limits
The engine enforces strict limits to prevent UI overload:

```javascript
MAX_INITIAL_UNITS = 20      // Layer 1 never shows more than 20 units
MAX_VISIBLE_NODES = 300     // Total nodes in view capped at 300
MAX_DETAIL_NODES = 150      // Expansion limited to 150 nodes
```

### Optimization Strategies

1. **Chunked Processing**: Large repos processed in parallel chunks
2. **Lazy Expansion**: Units expanded on-demand, not preloaded
3. **Caching**: Expanded units cached in client state
4. **Deduplication**: Edges deduplicated during merge
5. **Semantic Clustering**: Reduces large repos to manageable clusters

---

## 🚀 Usage Examples

### Example 1: Analyzing a Repository

```javascript
// In your React component
import { useStore } from './store/useStore';

function RepositoryAnalyzer() {
  const { setRepositoryPath, graphData, semanticLayer } = useStore();

  const handleAnalyze = async () => {
    await setRepositoryPath('/path/to/repo');
    // graphData now contains semantic layer data
    // semanticLayer.currentLayer === 1 (Orientation)
  };

  return (
    <div>
      <button onClick={handleAnalyze}>Analyze Repository</button>
      <p>Current Layer: {semanticLayer.currentLayer}</p>
      <p>Units Shown: {graphData?.nodes?.length || 0}</p>
    </div>
  );
}
```

---

### Example 2: Expanding a Unit

```javascript
function UnitExpander({ unit }) {
  const { expandUnit } = useStore();

  const handleExpand = async () => {
    const expanded = await expandUnit(unit);
    // expanded contains { nodes, edges } for unit internals
    // semanticLayer.currentLayer auto-transitions to 2
  };

  return (
    <button onClick={handleExpand}>
      Inspect Internals ({unit.childCount} items)
    </button>
  );
}
```

---

### Example 3: Viewing Impact Chain

```javascript
function ImpactViewer({ unit }) {
  const { getUnitImpact } = useStore();
  const [impact, setImpact] = useState(null);

  const handleViewImpact = async () => {
    const impactData = await getUnitImpact(unit);
    setImpact(impactData);
    // semanticLayer.currentLayer auto-transitions to 3
  };

  return (
    <div>
      <button onClick={handleViewImpact}>Trace Impact</button>
      {impact && (
        <div>
          <p>Upstream: {impact.upstream.length}</p>
          <p>Downstream: {impact.downstream.length}</p>
          <p>Total Impact: {impact.totalImpact}</p>
          {impact.riskIndicators.map(risk => (
            <div key={risk.type} className={risk.severity}>
              {risk.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🎓 Best Practices

### For Developers

1. **Always use semantic layer data**: Don't bypass the engine for raw file data
2. **Respect safety limits**: Don't try to show more nodes than the limits allow
3. **Use unit terminology**: Never expose internal categorization to users
4. **Handle layer transitions**: Update UI based on `semanticLayer.currentLayer`
5. **Cache expanded data**: Store expanded units to avoid redundant API calls

### For Users

1. **Start zoomed out**: Layer 1 gives you the best overview
2. **Use zoom to explore**: Natural zoom reveals more detail
3. **Click to focus**: Click units to see their internals
4. **Press Escape to reset**: Quickly return to previous state
5. **Look for risk indicators**: Red/amber badges show potential issues

---

## 🔮 Future Enhancements

Potential improvements to the semantic layer system:

- [ ] **AI-powered clustering**: Use ML to create more semantic clusters
- [ ] **Custom layer definitions**: Let users define their own layer thresholds
- [ ] **Layer history**: Navigate through layer transition history
- [ ] **Collaborative annotations**: Share insights about units
- [ ] **Real-time updates**: Live updates as code changes
- [ ] **Performance profiling**: Show runtime performance data in layers
- [ ] **Test coverage overlay**: Visualize test coverage per unit

---

## 📚 Additional Resources
- [Architecture Guide](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)

---

## 🤝 Contributing

When contributing to the semantic layer system:

1. Maintain UX consistency across all repo sizes
2. Add tests for new unit selection strategies
3. Document any new semantic layer features
4. Ensure performance remains acceptable for large repos
5. Follow the "unit" terminology in all user-facing code

---

**Built with ❤️ for Google Summer of Code 2025**
