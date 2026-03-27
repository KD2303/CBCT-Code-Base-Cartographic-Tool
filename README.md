# 🗺️ CBCT - CodeBase Cartographic Tool

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Tests](https://img.shields.io/badge/Tests-Jest%20%26%20Vitest-green)

**Transform your codebase from a text forest into a navigable landscape.**

[Quick Start](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Deployment](#-deployment) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**CBCT (CodeBase Cartographic Tool)** is a system that helps developers understand and explore large codebases by mapping them the way a cartographer maps terrain.

Instead of treating a codebase as a flat collection of files or a simple dependency graph, CBCT constructs a **context-aware, layered map** of the codebase. This map captures not just *what* is connected, but *how* and *why* those connections matter within the system.

### What CBCT Enables

- 🎯 **Identify central and critical components** - Find the core modules that your system depends on
- 🔄 **Understand impact paths before making changes** - See what will be affected by modifications
- 🧭 **Navigate unfamiliar codebases with confidence** - Explore new projects without getting lost
- 🗺️ **Visualize relationships at multiple levels** - From high-level architecture to file-level details

By turning complex codebases into navigable maps, CBCT transforms code exploration from guesswork into guided understanding, helping teams maintain, extend, and reason about software systems more effectively.

### 🎯 Core Philosophy

| Principle | Description |
|-----------|-------------|
| **Thinking-First Design** | Cognitive clarity over automation |
| **Observational** | Describes what exists, never prescribes |
| **Silent by Default** | No alerts, popups, or interruptions |
| **Exploration-Driven** | Understanding is discovered |
| **Adaptive** | Same UX regardless of repo size |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **npm** 9+ or **yarn** 1.22+
- **Git** (for GitHub repository analysis)

### Installation

```bash
# Clone the repository
git clone https://github.com/KD2303/CBCT-Code-Base-Cartographic-Tool.git
cd CBCT-Code-Base-Cartographic-Tool

# Install all dependencies
npm install

# Start development servers (frontend + backend)
npm run dev
```

### Access the Application

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:5000 |
| **Health Check** | http://localhost:5000/api/health |

---

## 🗺️ Features

### 🔍 Semantic Layer Engine

CBCT features an **adaptive visualization system** that automatically adjusts to your repository's size:

```
┌─────────────────────────────────────────────────────────────────┐
│  Small Repos (<80 files)     → File-based units                 │
│  Medium Repos (80-500 files) → Folder-based units               │
│  Large Repos (500+ files)    → Semantic cluster units           │
└─────────────────────────────────────────────────────────────────┘
```

**4 Progressive Layers:**

| Layer | Name | Purpose |
|-------|------|---------|
| 1 | **Orientation** | High-level overview |
| 2 | **Structural** | Connections and relationships |
| 3 | **Impact & Risk** | Dependency chains, risk indicators |
| 4 | **Detail** | Full file-level analysis |

### ⚡ Developer Workflow Features

- **🔗 IDE Sync** - Click to jump directly to source in VS Code
- **🛤️ Pathfinding** - `Ctrl + Click` to trace shortest dependency chain
- **🔥 Git Churn Hotspots** - Visual heat auras for volatile files
- **🚧 Architectural Guardrails** - Define and visualize forbidden boundaries

### 🌐 GitHub Integration

Analyze any public GitHub repository by pasting the URL:

```
https://github.com/facebook/react
https://github.com/vuejs/vue/tree/main/src
```

---

## 📁 Project Structure

```
cbct/
├── 📁 client/                          # React frontend (Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/                 # UI components
│   │   │   ├── GraphCanvas.jsx         # Main visualization
│   │   │   ├── Sidebar.jsx             # Navigation panel
│   │   │   └── ErrorBoundary.jsx
│   │   ├── services/                   # API client
│   │   ├── store/                      # Zustand state management
│   │   ├── public/                     # Public API exports
│   │   └── __tests__/                  # Unit tests (Vitest)
│   └── package.json
│
├── 📁 server/                          # Node.js backend (Express)
│   ├── src/
│   │   ├── routes/                     # API endpoints
│   │   │   ├── analysis.js             # Dependency analysis
│   │   │   ├── repository.js           # Repo scanning & cloning
│   │   │   └── graph.js                # Graph operations
│   │   ├── services/                   # Business logic
│   │   │   ├── analysisService.js
│   │   │   ├── repositoryService.js
│   │   │   ├── semanticLayerEngine.js
│   │   │   ├── cacheService.js         # Redis cache layer
│   │   │   └── globalDependencyGraph.js
│   │   ├── utils/                      # Utilities
│   │   │   └── redisClient.js          # Redis connection
│   │   └── __tests__/                  # Unit tests (Jest)
│   └── package.json
│
├── 📁 docker/                          # Docker configuration
│   ├── Dockerfile                      # Production container
│   ├── Dockerfile.dev                  # Development container
│   ├── docker-compose.yml              # Container orchestration
│   └── README.md                       # Docker usage guide
│
├── 📁 Guides/                          # Documentation hub
│   └── Navigations/                    # All documentation guides
│       ├── INDEX.md                    # Documentation index
│       ├── QUICK_START.md              # Getting started
│       ├── ARCHITECTURE.md             # System architecture
│       ├── TECHNICAL_ARCHITECTURE.md   # Technical deep dive
│       ├── SEMANTIC_LAYER_GUIDE.md     # Semantic layer details
│       ├── DEVELOPMENT.md              # Development setup
│       ├── INTEGRATION_CONTRACT.md     # Public API contract
│       ├── INTEGRATION_PATTERNS.md     # Integration examples
│       ├── FORWARD_COMPATIBILITY_ASSESSMENT.md
│       ├── REDIS_INTEGRATION.md        # Redis caching guide
│       ├── DEPLOYMENT_GUIDE.md         # Deploy to Upstash+Render+Vercel
│       ├── DEPLOYMENT_CHECKLIST.md     # Deployment verification
│       ├── DEPLOYMENT_QUICK_REFERENCE.md
│       └── DEPLOYMENT_FILES_SUMMARY.md
│
├── 📄 README.md                        # This file
├── 📄 package.json                     # Workspace root
├── 📄 .env.example                     # Environment template
└── 📄 verify-deployment.js             # Deployment verification script
```

---

## 🧪 Testing

### Run All Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### Run Tests Separately

```bash
# Server tests only (Jest)
npm run test:server

# Client tests only (Vitest)
npm run test:client

# Watch mode
cd server && npm run test:watch
cd client && npm run test:watch
```

### Test Coverage

Tests cover:
- ✅ Service layer (analysis, repository, semantic engine)
- ✅ API routes (dependencies, complexity, centrality)
- ✅ React components and hooks
- ✅ State management (Zustand store)
- ✅ Edge cases and error handling

---

## 🐳 Deployment

### Option 1: Docker (Recommended)

```bash
# Run production container
docker-compose -f docker/docker-compose.yml up

# Run development container with hot reload
docker-compose -f docker/docker-compose.yml --profile dev up
```

📖 See [docker/README.md](./docker/README.md) for detailed Docker instructions.

### Option 2: Manual Deployment

```bash
# Build the client
npm run build:client

# Start production server
NODE_ENV=production npm start
```

### Option 3: Cloud Deployment (Upstash + Render + Vercel)

Deploy with Redis caching on production platforms:

```bash
# Run verification script
node verify-deployment.js
```

📖 See [Guides/Navigations/DEPLOYMENT_GUIDE.md](./Guides/Navigations/DEPLOYMENT_GUIDE.md) for complete setup instructions.

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server
NODE_ENV=production
PORT=5000

# Analysis
MAX_FILE_SIZE_KB=500
LARGE_REPO_THRESHOLD=1000

# Timeouts
SERVER_TIMEOUT=300000
CLONE_TIMEOUT_MS=600000
```

---

## 📡 API Reference

### Repository Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/repository/scan` | Scan local path or GitHub URL |
| `GET` | `/api/repository/tree` | Get file tree structure |

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analysis/dependencies` | Analyze file dependencies |
| `POST` | `/api/analysis/complexity` | Analyze code complexity |
| `POST` | `/api/analysis/centrality` | Calculate module centrality |
| `POST` | `/api/analysis/expand` | Expand a unit (Layer 2+) |
| `POST` | `/api/analysis/churn` | Get git modification heat |
| `GET` | `/api/analysis/insights/:nodeId` | Get node-specific insights |

### Graph Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/graph/build` | Build global dependency graph |
| `POST` | `/api/graph/get` | Retrieve cached graph |
| `GET` | `/api/graph/analysis/cycles` | Find circular dependencies |
| `GET` | `/api/graph/analysis/most-used` | Get most imported modules |

---

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers with hot reload |
| `npm run dev:client` | Start frontend only (port 5173) |
| `npm run dev:server` | Start backend only (port 5000) |
| `npm run build` | Build for production |
| `npm test` | Run all tests |
| `npm run test:coverage` | Generate coverage report |

📖 See [Guides/Navigations/DEVELOPMENT.md](./Guides/Navigations/DEVELOPMENT.md) for full development setup.

### Tech Stack

**Frontend:**
- React 18 + Vite
- TailwindCSS + Framer Motion
- React Force Graph 2D / Sigma.js
- Zustand (state management)
- Vitest + Testing Library

**Backend:**
- Node.js + Express
- simple-git (Git operations)
- glob (file scanning)
- Jest + Supertest

---

## 📚 Documentation

All documentation is organized in `Guides/Navigations/` folder. Start with the **[INDEX.md](./Guides/Navigations/INDEX.md)** for complete navigation.

### Key Guides

| Document | Description |
|----------|-------------|
| [QUICK_START.md](./Guides/Navigations/QUICK_START.md) | Get up and running quickly |
| [ARCHITECTURE.md](./Guides/Navigations/ARCHITECTURE.md) | System architecture overview |
| [TECHNICAL_ARCHITECTURE.md](./Guides/Navigations/TECHNICAL_ARCHITECTURE.md) | Deep technical dive |
| [SEMANTIC_LAYER_GUIDE.md](./Guides/Navigations/SEMANTIC_LAYER_GUIDE.md) | Semantic layer details |
| [DEVELOPMENT.md](./Guides/Navigations/DEVELOPMENT.md) | Development environment setup |
| [INTEGRATION_CONTRACT.md](./Guides/Navigations/INTEGRATION_CONTRACT.md) | Public API contract |
| [DEPLOYMENT_GUIDE.md](./Guides/Navigations/DEPLOYMENT_GUIDE.md) | Deploy to Upstash + Render + Vercel |
| [REDIS_INTEGRATION.md](./Guides/Navigations/REDIS_INTEGRATION.md) | Redis caching setup |

**👉 [View all guides →](./Guides/Navigations/INDEX.md)**

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [React Force Graph](https://github.com/vasturiano/react-force-graph)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- State managed by [Zustand](https://github.com/pmndrs/zustand)
- Git operations by [simple-git](https://github.com/steveukx/git-js)

---

<div align="center">

**Made with ❤️ for developers who think in graphs**

</div>
