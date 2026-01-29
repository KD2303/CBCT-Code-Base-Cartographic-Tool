# CBCT - CodeBase Cartographic Tool

> Transform your codebase from a text forest into a navigable landscape.

**CBCT** is a cognitive-first software visualization system designed to help developers understand, reason about, and reflect on the structure of a codebase.

## 🎯 Core Philosophy

- **Thinking-First Design** — Cognitive clarity over automation
- **Observational, Not Prescriptive** — Describes what exists, never what should be done
- **Silent by Default** — No alerts, popups, or interruptions
- **Exploration-Driven** — Understanding is discovered
- **Respect for Developer Intelligence** — No oversimplification

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
cd cbct

# Install all dependencies
npm install

# Start development servers (both client & server)
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
cbct/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── services/       # API client
│   │   ├── store/          # Zustand state management
│   │   └── App.jsx         # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── index.js        # Server entry
│   └── package.json
└── package.json            # Workspace root
```

## 🗺️ Features

### 🎯 Semantic Layer Engine (NEW!)

CBCT features an **adaptive visualization system** that automatically adjusts to repository size while maintaining a consistent user experience:

- **4 Semantic Layers**: Progressive disclosure from overview to detail
  - Layer 1: Orientation (high-level overview)
  - Layer 2: Structural (connections and relationships)
  - Layer 3: Impact & Risk (dependency chains and risk indicators)
  - Layer 4: Detail (full file-level analysis)

- **Adaptive Unit Selection**: Automatically chooses the right abstraction level
  - Small repos (< 80 files): File-based units
  - Medium repos (80-500 files): Folder-based units
  - Large repos (≥ 500 files): Semantic cluster units

- **Consistent UX**: Same interaction model regardless of repository size
- **Performance Optimized**: Safety limits prevent UI overload
- **Risk Detection**: Identifies circular dependencies, high-impact units, and potential issues

### ⚡ Advanced Developer Workflow (NEW!)

CBCT transforms from a static map to a **proactive engineering cockpit**:

- **IDE Sync**: Click the External Link icon to instantly jump to the source in **VS Code**.
- **Pathfinding**: High-speed BFS traces the **shortest dependency chain** between any two units via `Ctrl + Click`.
- **Git Intelligence**:
    - **Churn Hotspots**: Pulsing **Heat Auras** highlight files with high historical volatility.
    - **PR Impact Mode**: Neon highlighters show what’s changed in your current branch vs `main`.
- **Architectural Guardrails**: Define forbidden boundaries (e.g., UI → DB) and get **visual alerts** on violations.

📚 **[Semantic Layer Guide](./SEMANTIC_LAYER_GUIDE.md)** | **[Technical Architecture](./ARCHITECTURE.md)** | **[Development Guide](./DEVELOPMENT.md)**

## 📁 Project Structure

```
cbct/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── services/       # API client & state management
│   │   └── store/          # Zustand store
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   └── services/       # Analysis & Semantic engines
└── package.json            # Workspace root
```

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, react-force-graph-2d, Zustand, Lucide React.
**Backend:** Node.js, Express, simple-git, glob.

## 🎨 Design Principles

- No insight is shown without explicit user intent.
- Highlights are descriptive, not judgmental.
- Real-time metabolic signals (Churn) reveal the living system.

---

**Clear thinking precedes confident code.**
