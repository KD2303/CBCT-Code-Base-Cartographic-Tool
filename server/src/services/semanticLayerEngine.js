/**
 * CBCT Semantic Layer Engine
 * 
 * This engine provides adaptive graph visualization based on repository size.
 * The user experience remains identical - only internal complexity adapts.
 * 
 * CORE CONCEPT: Everything shown in the graph is a UNIT.
 * - Small repos (< 80 files): units = files
 * - Medium repos (< 500 files): units = folders
 * - Large repos (>= 500 files): units = semantic clusters
 */

// Constants for unit selection
const SMALL_REPO_THRESHOLD = 80;
const MEDIUM_REPO_THRESHOLD = 500;
const MAX_INITIAL_UNITS = 20;
const MAX_VISIBLE_NODES = 300;
const MAX_DETAIL_NODES = 150;

/**
 * Determine repository size category (INTERNAL ONLY - never expose to user)
 */
function getRepoSizeCategory(fileCount) {
  if (fileCount < 80) return 'small';
  if (fileCount < 500) return 'medium';
  return 'large';
}

/**
 * Get reveal depth based on repo size (INTERNAL ONLY)
 * - Small repo: depth 3 (show more detail)
 * - Medium repo: depth 2
 * - Large repo: depth 1 (show less detail initially)
 */
function getRevealDepth(sizeCategory) {
  switch (sizeCategory) {
    case 'small': return 3;
    case 'medium': return 2;
    case 'large': return 1;
    default: return 2;
  }
}

/**
 * Select units based on repository size
 * Returns nodes transformed into "units" for graph display
 */
function selectUnits(nodes, edges, fileCount) {
  const sizeCategory = getRepoSizeCategory(fileCount);

  if (sizeCategory === 'small') {
    return selectFileUnits(nodes, edges);
  } else if (sizeCategory === 'medium') {
    return selectFolderUnits(nodes, edges);
  } else {
    return selectSemanticClusters(nodes, edges);
  }
}

/**
 * Small repos: Each file is a unit
 */
function selectFileUnits(nodes, edges) {
  const units = nodes.map(node => ({
    ...node,
    unitType: 'file',
    isUnit: true,
    children: [],
    childCount: 0
  }));

  // Sort by connectivity to show most important nodes first
  const sortedUnits = units.sort((a, b) =>
    ((b.inDegree + b.outDegree) || 0) - ((a.inDegree + a.outDegree) || 0)
  );
  const limitedUnits = sortedUnits.slice(0, MAX_INITIAL_UNITS);

  // Filter edges to only include visible units
  const unitIds = new Set(limitedUnits.map(u => u.id));
  const unitEdges = edges.filter(e =>
    unitIds.has(e.source) && unitIds.has(e.target)
  );

  return { units: limitedUnits, edges: unitEdges, totalUnits: nodes.length };
}

/**
 * Medium repos: Folders become units
 */
function selectFolderUnits(nodes, edges) {
  // Group nodes by their parent directory
  const folderMap = new Map();

  nodes.forEach(node => {
    const dir = node.directory || getParentDirectory(node.path || node.id);
    if (!folderMap.has(dir)) {
      folderMap.set(dir, {
        id: `folder:${dir}`,
        label: dir.split('/').pop() || dir || 'root',
        path: dir,
        directory: getParentDirectory(dir),
        type: 'folder',
        unitType: 'folder',
        isUnit: true,
        children: [],
        childCount: 0,
        inDegree: 0,
        outDegree: 0
      });
    }
    folderMap.get(dir).children.push(node);
    folderMap.get(dir).childCount++;
  });

  // Calculate folder-level dependencies
  const folderEdges = [];
  const edgeSet = new Set();

  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (sourceNode && targetNode) {
      const sourceDir = sourceNode.directory || getParentDirectory(sourceNode.path || sourceNode.id);
      const targetDir = targetNode.directory || getParentDirectory(targetNode.path || targetNode.id);

      if (sourceDir !== targetDir) {
        const edgeKey = `folder:${sourceDir}->folder:${targetDir}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          folderEdges.push({
            source: `folder:${sourceDir}`,
            target: `folder:${targetDir}`,
            weight: 1
          });

          // Update degrees
          const sourceFolder = folderMap.get(sourceDir);
          const targetFolder = folderMap.get(targetDir);
          if (sourceFolder) sourceFolder.outDegree++;
          if (targetFolder) targetFolder.inDegree++;
        } else {
          // Increment weight for existing edge
          const existingEdge = folderEdges.find(e =>
            e.source === `folder:${sourceDir}` && e.target === `folder:${targetDir}`
          );
          if (existingEdge) existingEdge.weight++;
        }
      }
    }
  });

  // Sort by connectivity to prioritize hubs
  const sortedUnits = Array.from(folderMap.values()).sort((a, b) =>
    ((b.inDegree + b.outDegree) || 0) - ((a.inDegree + a.outDegree) || 0)
  );

  const limitedUnits = sortedUnits.slice(0, MAX_INITIAL_UNITS);

  return {
    units: limitedUnits,
    edges: folderEdges.filter(e => {
      const unitIds = new Set(limitedUnits.map(u => u.id));
      return unitIds.has(e.source) && unitIds.has(e.target);
    }),
    totalUnits: folderMap.size
  };
}

/**
 * Large repos: Semantic clusters become units
 * Clusters are formed by grouping files with heavy interdependencies
 */
function selectSemanticClusters(nodes, edges) {
  // Build adjacency list for clustering
  const adjacency = new Map();
  nodes.forEach(node => adjacency.set(node.id, new Set()));

  edges.forEach(edge => {
    if (adjacency.has(edge.source)) {
      adjacency.get(edge.source).add(edge.target);
    }
    if (adjacency.has(edge.target)) {
      adjacency.get(edge.target).add(edge.source);
    }
  });

  // Simple clustering: Group by shared dependencies + folder structure
  const clusters = new Map();
  const nodeToCluster = new Map();
  let clusterIndex = 0;

  // First pass: Create initial clusters from high-connectivity nodes
  const sortedByConnections = [...nodes].sort((a, b) => {
    const aConns = (adjacency.get(a.id)?.size || 0);
    const bConns = (adjacency.get(b.id)?.size || 0);
    return bConns - aConns;
  });

  sortedByConnections.forEach(node => {
    if (nodeToCluster.has(node.id)) return;

    // Check if this node should join an existing cluster
    const neighbors = adjacency.get(node.id) || new Set();
    let bestCluster = null;
    let bestScore = 0;

    neighbors.forEach(neighborId => {
      const cluster = nodeToCluster.get(neighborId);
      if (cluster !== undefined) {
        const clusterNodes = clusters.get(cluster)?.children || [];
        // Score based on how many cluster members this node connects to
        const score = clusterNodes.filter(n => neighbors.has(n.id)).length;
        if (score > bestScore) {
          bestScore = score;
          bestCluster = cluster;
        }
      }
    });

    if (bestCluster !== null && bestScore >= 2) {
      // Join existing cluster
      nodeToCluster.set(node.id, bestCluster);
      clusters.get(bestCluster).children.push(node);
      clusters.get(bestCluster).childCount++;
    } else {
      // Create new cluster
      const clusterId = `cluster:${clusterIndex}`;
      const dir = node.directory || getParentDirectory(node.path || node.id);

      clusters.set(clusterIndex, {
        id: clusterId,
        label: `Module ${clusterIndex + 1}`,
        path: dir,
        directory: getParentDirectory(dir),
        type: 'module',
        unitType: 'cluster',
        isUnit: true,
        children: [node],
        childCount: 1,
        inDegree: 0,
        outDegree: 0,
        // Store common patterns for better naming
        patterns: new Set([dir])
      });
      nodeToCluster.set(node.id, clusterIndex);
      clusterIndex++;
    }
  });

  // Improve cluster labels based on common paths
  clusters.forEach(cluster => {
    if (cluster.children.length > 0) {
      const dirs = cluster.children.map(n =>
        n.directory || getParentDirectory(n.path || n.id)
      );
      const commonDir = findCommonPath(dirs);
      if (commonDir) {
        cluster.label = commonDir.split('/').pop() || `Module ${cluster.id.split(':')[1]}`;
      }
    }
  });

  // Calculate cluster-level edges
  const clusterEdges = [];
  const edgeSet = new Set();

  edges.forEach(edge => {
    const sourceCluster = nodeToCluster.get(edge.source);
    const targetCluster = nodeToCluster.get(edge.target);

    if (sourceCluster !== undefined && targetCluster !== undefined && sourceCluster !== targetCluster) {
      const sourceId = `cluster:${sourceCluster}`;
      const targetId = `cluster:${targetCluster}`;
      const edgeKey = `${sourceId}->${targetId}`;

      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        clusterEdges.push({
          source: sourceId,
          target: targetId,
          weight: 1
        });

        // Update degrees
        if (clusters.has(sourceCluster)) clusters.get(sourceCluster).outDegree++;
        if (clusters.has(targetCluster)) clusters.get(targetCluster).inDegree++;
      } else {
        const existingEdge = clusterEdges.find(e => e.source === sourceId && e.target === targetId);
        if (existingEdge) existingEdge.weight++;
      }
    }
  });

  // Sort by connectivity to prioritize hubs
  const sortedUnits = Array.from(clusters.values()).sort((a, b) =>
    ((b.inDegree + b.outDegree) || 0) - ((a.inDegree + a.outDegree) || 0)
  );

  const limitedUnits = sortedUnits.slice(0, MAX_INITIAL_UNITS);
  const unitIds = new Set(limitedUnits.map(u => u.id));

  return {
    units: limitedUnits,
    edges: clusterEdges.filter(e => unitIds.has(e.source) && unitIds.has(e.target)),
    totalUnits: clusters.size
  };
}

/**
 * Expand a unit to reveal its children (for Layer 2+)
 */
function expandUnit(unit, allNodes, allEdges, depth = 1) {
  if (!unit || !unit.children || unit.children.length === 0) {
    return { nodes: [], edges: [] };
  }

  let expandedNodes = [...unit.children];

  // For deeper expansion, include connected nodes up to depth
  if (depth > 1) {
    const nodeIds = new Set(expandedNodes.map(n => n.id));

    for (let d = 1; d < depth; d++) {
      const newNodes = [];
      allEdges.forEach(edge => {
        if (nodeIds.has(edge.source) && !nodeIds.has(edge.target)) {
          const targetNode = allNodes.find(n => n.id === edge.target);
          if (targetNode) {
            newNodes.push(targetNode);
            nodeIds.add(targetNode.id);
          }
        }
        if (nodeIds.has(edge.target) && !nodeIds.has(edge.source)) {
          const sourceNode = allNodes.find(n => n.id === edge.source);
          if (sourceNode) {
            newNodes.push(sourceNode);
            nodeIds.add(sourceNode.id);
          }
        }
      });
      expandedNodes = [...expandedNodes, ...newNodes];
    }
  }

  // Limit expansion
  expandedNodes = expandedNodes.slice(0, MAX_DETAIL_NODES);

  // Filter edges for expanded nodes
  const nodeIds = new Set(expandedNodes.map(n => n.id));
  const expandedEdges = allEdges.filter(e =>
    nodeIds.has(e.source) && nodeIds.has(e.target)
  );

  return { nodes: expandedNodes, edges: expandedEdges };
}

/**
 * Get impact chain for a unit (upstream + downstream dependencies)
 * Used for Layer 3 - Impact & Risk
 */
function getImpactChain(unitId, units, edges, maxDepth = 3) {
  const upstream = new Set();
  const downstream = new Set();
  const riskIndicators = [];

  // Find downstream (what depends on this unit)
  function findDownstream(id, depth = 0) {
    if (depth >= maxDepth) return;
    edges.forEach(edge => {
      if (edge.source === id && !downstream.has(edge.target)) {
        downstream.add(edge.target);
        findDownstream(edge.target, depth + 1);
      }
    });
  }

  // Find upstream (what this unit depends on)
  function findUpstream(id, depth = 0) {
    if (depth >= maxDepth) return;
    edges.forEach(edge => {
      if (edge.target === id && !upstream.has(edge.source)) {
        upstream.add(edge.source);
        findUpstream(edge.source, depth + 1);
      }
    });
  }

  findDownstream(unitId);
  findUpstream(unitId);

  // Detect risk indicators
  const unit = units.find(u => u.id === unitId);

  // High fan-out risk
  if (downstream.size > 10) {
    riskIndicators.push({
      type: 'high-impact',
      severity: 'warning',
      message: `Changes here affect ${downstream.size} other units`
    });
  }

  // High fan-in risk
  if (upstream.size > 10) {
    riskIndicators.push({
      type: 'high-dependency',
      severity: 'info',
      message: `Depends on ${upstream.size} other units`
    });
  }

  // Cycle detection (simplified)
  const inBoth = [...upstream].filter(id => downstream.has(id));
  if (inBoth.length > 0) {
    riskIndicators.push({
      type: 'cycle',
      severity: 'error',
      message: `Circular dependency detected with ${inBoth.length} unit(s)`
    });
  }

  return {
    unitId,
    upstream: Array.from(upstream),
    downstream: Array.from(downstream),
    riskIndicators,
    totalImpact: upstream.size + downstream.size
  };
}

/**
 * Generate semantic summary for a unit
 */
function generateUnitSummary(unit, edges) {
  const inDegree = unit.inDegree || 0;
  const outDegree = unit.outDegree || 0;
  const childCount = unit.childCount || (unit.children?.length || 0);

  let role = 'Standard';
  let description = '';

  // Determine role based on metrics
  if (inDegree > outDegree * 2 && inDegree > 5) {
    role = 'Core Dependency';
    description = 'Many units depend on this. Changes require careful review.';
  } else if (outDegree > inDegree * 2 && outDegree > 5) {
    role = 'Integration Point';
    description = 'Connects many parts. May be a good refactoring candidate.';
  } else if (inDegree === 0 && outDegree > 0) {
    role = 'Entry Point';
    description = 'Entry point with no dependencies coming in.';
  } else if (outDegree === 0 && inDegree > 0) {
    role = 'Leaf Unit';
    description = 'End of dependency chain. Safe to modify in isolation.';
  } else if (inDegree === 0 && outDegree === 0) {
    role = 'Isolated';
    description = 'No detected dependencies. May be unused or self-contained.';
  } else {
    description = 'Standard connectivity pattern.';
  }

  return {
    role,
    description,
    metrics: {
      dependedBy: inDegree,
      dependsOn: outDegree,
      internalUnits: childCount
    }
  };
}

// Utility functions
function getParentDirectory(filePath) {
  if (!filePath) return '';
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  parts.pop();
  return parts.join('/') || 'root';
}

function findCommonPath(paths) {
  if (!paths || paths.length === 0) return '';
  if (paths.length === 1) return paths[0];

  const splitPaths = paths.map(p => (p || '').split('/'));
  const minLength = Math.min(...splitPaths.map(p => p.length));

  let common = [];
  for (let i = 0; i < minLength; i++) {
    const segment = splitPaths[0][i];
    if (splitPaths.every(p => p[i] === segment)) {
      common.push(segment);
    } else {
      break;
    }
  }

  return common.join('/');
}

/**
 * Apply safety limits to graph data
 */
function applySafetyLimits(nodes, edges) {
  // Never show more than MAX_VISIBLE_NODES
  const limitedNodes = nodes.slice(0, MAX_VISIBLE_NODES);
  const nodeIds = new Set(limitedNodes.map(n => n.id));
  const limitedEdges = edges.filter(e =>
    nodeIds.has(e.source) && nodeIds.has(e.target)
  );

  return { nodes: limitedNodes, edges: limitedEdges };
}

/**
 * Transform raw analysis data into semantic layer format
 * This is the main entry point for the engine
 */
function processForSemanticLayers(rawNodes, rawEdges, fileCount) {
  const sizeCategory = getRepoSizeCategory(fileCount);
  const revealDepth = getRevealDepth(sizeCategory);

  // Select units based on repo size
  const { units, edges, totalUnits } = selectUnits(rawNodes, rawEdges, fileCount);

  // Apply safety limits
  const { nodes: safeUnits, edges: safeEdges } = applySafetyLimits(units, edges);

  // Generate summaries for each unit
  const unitsWithSummaries = safeUnits.map(unit => ({
    ...unit,
    label: unit.label || unit.name || 'Unit',
    type: 'unit', // Force universal type for UI
    summary: generateUnitSummary(unit, safeEdges)
  }));

  return {
    // Visible data for Layer 1
    nodes: unitsWithSummaries,
    edges: safeEdges,

    // Metadata (internal - used by client for layer transitions)
    metadata: {
      totalUnits,
      visibleUnits: unitsWithSummaries.length,
      revealDepth,
      maxNodes: MAX_VISIBLE_NODES,
      maxDetailNodes: MAX_DETAIL_NODES,
      maxInitialUnits: MAX_INITIAL_UNITS
    },

    // Raw data stored for expansion (internal use)
    _internal: {
      allNodes: rawNodes,
      allEdges: rawEdges
    }
  };
}

module.exports = {
  getRepoSizeCategory,
  getRevealDepth,
  selectUnits,
  expandUnit,
  getImpactChain,
  generateUnitSummary,
  applySafetyLimits,
  processForSemanticLayers,

  // Constants exported for testing
  SMALL_REPO_THRESHOLD,
  MEDIUM_REPO_THRESHOLD,
  MAX_INITIAL_UNITS,
  MAX_VISIBLE_NODES,
  MAX_DETAIL_NODES
};
