# CBCT Development Guide

This guide covers setup, testing, and integration workflows for developers working on or with the CodeBase Cartographic Tool.

## 🛠️ Environment Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- VS Code (optional, for IDE Sync feature)

### Installation
```bash
npm install
```

### Running the App
```bash
# Start both client and server in development mode
npm run dev
```

---

## 🧪 Testing Procedures

### Backend Integration Tests
You can verify the API endpoints using `curl` or any API client.

**1. Dependency Analysis Scan**
```bash
curl -X POST http://localhost:5000/api/analysis/dependencies \
  -H "Content-Type: application/json" \
  -d '{"path": "/your/local/repo/path"}'
```

**2. Git Churn Analysis**
```bash
curl -X POST http://localhost:5000/api/analysis/git/churn \
  -H "Content-Type: application/json" \
  -d '{"path": "/your/local/repo/path"}'
```

### Frontend Verification
- **Layer Transitions**: Zoom in/out to ensure layers 1-3 transition automatically.
- **Unit Expansion**: Click a unit (Layer 2) and select "Inspect Internals" to verify Layer 4 detail.
- **Pathfinding**: Use `Ctrl + Click` to select two nodes and verify the path highlights in cyan.

---

## 🖱️ Client-Side Integration

### Using the Store
CBCT uses Zustand for global state.

```javascript
import { useStore } from './store/useStore';

const { selectedNode, activePath, gitChurnData } = useStore();
```

### Integration Workflow
1. **Fetch Graph**: Use `setRepositoryPath(path)` to initialize analysis.
2. **Access Insights**: Node metrics are available via the `selectedNode` object.
3. **Trigger Analytics**: Complexity and Centrality analysis are triggered automatically on repo load.

---

## 📚 API Reference Summary

### Repository Management
- `POST /api/repository/scan`: Clones (if Git) or scans (if local) a projected.
- `GET /api/repository/tree`: Returns the physical file tree.

### Advanced Features
- **IDE Sync**: Uses `vscode://file/{fullPath}` protocol.
- **Governance**: Managed via `forbiddenLinks` in the store. Use `toggleForbiddenLink(source, target)` to set architectural guardrails.

---

## 🛡️ Architectural Guardrails User Guide
1. Select a node to open its **Unit Card**.
2. Click **'S'** to mark it as a Forbidden **Source**.
3. select another node and click **'T'** to mark it as a Forbidden **Target**.
4. The system will immediately flag any dependency between these nodes with a pulsing red highlight.

---
**Build with ❤️ for Advanced CodeBase Mapping.**
