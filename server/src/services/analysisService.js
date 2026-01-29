const fs = require('fs').promises;
const path = require('path');
const simpleGit = require('simple-git');
const { getCodeFiles } = require('./repositoryService');
const semanticLayerEngine = require('./semanticLayerEngine');

// Configuration for analysis
const ANALYSIS_CONFIG = {
  MAX_FILE_SIZE_KB: 500,           // Skip files larger than this
  BATCH_SIZE: 100,                  // Process files in batches
  MAX_IMPORTS_PER_FILE: 200,        // Limit imports to prevent abuse
  CHUNK_SIZE: 500,                  // Files per chunk for parallel processing
  MAX_PARALLEL_CHUNKS: 4,           // Max concurrent chunk processing
  LARGE_REPO_THRESHOLD: 1000,       // Use chunked processing above this file count
};

/**
 * Validate that a path exists and is a directory
 */
async function validateRepoPath(repoPath) {
  if (!repoPath || typeof repoPath !== 'string') {
    throw new Error('Repository path is required');
  }

  try {
    const stats = await fs.stat(repoPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${repoPath}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Repository path does not exist: ${repoPath}`);
    }
    throw error;
  }
}

/**
 * Normalize path to use forward slashes (for consistent graph usage)
 */
function normalizeToForward(p) {
  return p.replace(/\\/g, '/');
}

/**
 * Detect language from field extension
 */
function detectLanguageFromExtension(ext) {
  const extMap = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.kt': 'kotlin',
    '.kts': 'kotlin',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.vue': 'javascript',
    '.svelte': 'javascript'
  };
  return extMap[ext] || 'unknown';
}

/**
 * Analyze dependencies between files
 * Uses chunked parallel processing for large repositories
 * Returns nodes and edges for graph visualization
 * 
 * Now integrates with Semantic Layer Engine for adaptive visualization
 */
async function analyzeDependencies(repoPath, defaultLanguage = 'javascript', useSemanticLayers = true) {
  await validateRepoPath(repoPath);

  try {
    const files = await getCodeFiles(repoPath);

    if (!files || files.length === 0) {
      return { nodes: [], edges: [], message: 'No code files found in repository' };
    }

    console.log(`[Analysis] Starting analysis of ${files.length} files`);

    let rawResult;

    // For large repos, use chunked parallel processing
    if (files.length > ANALYSIS_CONFIG.LARGE_REPO_THRESHOLD) {
      console.log(`[Analysis] Large repo detected (${files.length} files), using chunked processing`);
      rawResult = await analyzeInChunks(repoPath, files, defaultLanguage);
    } else {
      // For smaller repos, use standard processing
      rawResult = await analyzeStandard(repoPath, files, defaultLanguage);
    }

    // Apply semantic layer processing if enabled
    if (useSemanticLayers && rawResult.nodes && rawResult.nodes.length > 0) {
      console.log(`[SemanticLayer] Processing ${rawResult.nodes.length} nodes for semantic visualization`);
      const semanticData = semanticLayerEngine.processForSemanticLayers(
        rawResult.nodes,
        rawResult.edges,
        files.length
      );

      // Return semantic layer data with raw data stored for expansion
      return {
        nodes: semanticData.nodes,
        edges: semanticData.edges,
        metadata: semanticData.metadata,
        // Store raw data for layer expansion (used by expandUnit API)
        _rawNodes: rawResult.nodes,
        _rawEdges: rawResult.edges,
        stats: rawResult.stats
      };
    }

    return rawResult;
  } catch (error) {
    console.error('Analysis failed:', error);
    return {
      nodes: [],
      edges: [],
      error: error.message,
      details: error.stack
    };
  }
}

/**
 * Standard analysis for smaller repositories (under threshold)
 */
async function analyzeStandard(repoPath, files, defaultLanguage) {
  const normalizedFiles = files.map(f => normalizeToForward(f));
  const normalizedFilesSet = new Set(normalizedFiles);

  const nodes = [];
  const edges = [];
  const nodeMap = new Map();

  // Create nodes for each file
  for (let i = 0; i < files.length; i++) {
    const file = normalizedFiles[i];
    const id = `node_${i}`;
    const ext = path.extname(file);
    const node = {
      id,
      label: path.basename(file),
      fullPath: file,
      directory: normalizeToForward(path.dirname(file)),
      extension: ext,
      type: getFileType(file),
      language: detectLanguageFromExtension(ext)
    };
    nodes.push(node);
    nodeMap.set(file, id);
  }

  // Analyze imports/dependencies for each file
  for (let i = 0; i < files.length; i++) {
    const file = normalizedFiles[i];
    const filePath = path.join(repoPath, files[i]);
    const ext = path.extname(file);
    const language = detectLanguageFromExtension(ext) || defaultLanguage;

    const imports = await extractImports(filePath, language);
    const sourceId = nodeMap.get(file);

    if (!sourceId) continue;

    for (const imp of imports) {
      const resolvedImport = resolveImport(file, imp, normalizedFiles, normalizedFilesSet, language);
      if (resolvedImport) {
        const normalizedResolved = normalizeToForward(resolvedImport);
        if (nodeMap.has(normalizedResolved)) {
          const targetId = nodeMap.get(normalizedResolved);
          const edgeId = `edge_${sourceId}_${targetId}`;
          if (sourceId !== targetId && !edges.find(e => e.id === edgeId)) {
            edges.push({
              id: edgeId,
              source: sourceId,
              target: targetId,
              type: 'dependency'
            });
          }
        }
      }
    }
  }

  // Calculate node metrics
  calculateNodeMetrics(nodes, edges);

  return { nodes, edges };
}

/**
 * Chunked parallel analysis for large repositories
 * Splits files into chunks, processes in parallel, then merges results
 */
async function analyzeInChunks(repoPath, files, defaultLanguage) {
  const startTime = Date.now();

  // Pre-normalize all files (needed for cross-chunk import resolution)
  const normalizedFiles = files.map(f => normalizeToForward(f));
  const normalizedFilesSet = new Set(normalizedFiles);

  // Create global node mapping first (all files get consistent IDs)
  const globalNodeMap = new Map();
  const allNodes = [];

  for (let i = 0; i < files.length; i++) {
    const file = normalizedFiles[i];
    const id = `node_${i}`;
    const ext = path.extname(file);
    const node = {
      id,
      label: path.basename(file),
      fullPath: file,
      directory: normalizeToForward(path.dirname(file)),
      extension: ext,
      type: getFileType(file),
      language: detectLanguageFromExtension(ext)
    };
    allNodes.push(node);
    globalNodeMap.set(file, id);
  }

  // Split files into chunks - dynamic chunk size based on repo size
  const chunkSize = Math.min(500, Math.max(50, Math.floor(files.length / 100)));
  const chunks = createChunks(files, normalizedFiles, chunkSize);
  console.log(`[Analysis] Split into ${chunks.length} chunks of ~${chunkSize} files each (dynamic sizing for ${files.length} total files)`);

  // Process chunks in parallel with controlled concurrency
  const allEdges = [];
  const maxParallel = ANALYSIS_CONFIG.MAX_PARALLEL_CHUNKS;

  for (let i = 0; i < chunks.length; i += maxParallel) {
    const batch = chunks.slice(i, i + maxParallel);
    const batchNum = Math.floor(i / maxParallel) + 1;
    const totalBatches = Math.ceil(chunks.length / maxParallel);

    console.log(`[Analysis] Processing batch ${batchNum}/${totalBatches} (${batch.length} chunks in parallel)`);

    const chunkResults = await Promise.all(
      batch.map((chunk, idx) =>
        processChunk(
          repoPath,
          chunk,
          globalNodeMap,
          normalizedFiles,
          normalizedFilesSet,
          defaultLanguage,
          i + idx + 1,
          chunks.length
        )
      )
    );

    // Collect edges from all chunks
    for (const result of chunkResults) {
      if (result.edges && result.edges.length > 0) {
        allEdges.push(...result.edges);
      }
    }
  }

  // Deduplicate edges (in case of any cross-chunk duplicates)
  const uniqueEdges = deduplicateEdges(allEdges);

  // Calculate metrics on the merged result
  calculateNodeMetrics(allNodes, uniqueEdges);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Analysis] Completed: ${allNodes.length} nodes, ${uniqueEdges.length} edges in ${elapsed}s`);

  return {
    nodes: allNodes,
    edges: uniqueEdges,
    stats: {
      totalFiles: files.length,
      chunksProcessed: chunks.length,
      processingTime: elapsed + 's'
    }
  };
}

/**
 * Create chunks from file list with metadata
 */
function createChunks(files, normalizedFiles, chunkSize) {
  const chunks = [];

  for (let i = 0; i < files.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, files.length);
    chunks.push({
      id: chunks.length,
      startIndex: i,
      endIndex: end,
      files: files.slice(i, end),
      normalizedFiles: normalizedFiles.slice(i, end),
      fileCount: end - i
    });
  }

  return chunks;
}

/**
 * Process a single chunk - extract imports and create edges
 */
async function processChunk(repoPath, chunk, globalNodeMap, allNormalizedFiles, allFilesSet, defaultLanguage, chunkNum, totalChunks) {
  const chunkEdges = [];
  const edgeSet = new Set(); // For fast duplicate detection within chunk

  console.log(`[Chunk ${chunkNum}/${totalChunks}] Processing ${chunk.fileCount} files...`);
  const startTime = Date.now();

  for (let i = 0; i < chunk.files.length; i++) {
    const file = chunk.normalizedFiles[i];
    const originalFile = chunk.files[i];
    const filePath = path.join(repoPath, originalFile);
    const ext = path.extname(file);
    const language = detectLanguageFromExtension(ext) || defaultLanguage;

    try {
      const imports = await extractImports(filePath, language);
      const sourceId = globalNodeMap.get(file);

      if (!sourceId) continue;

      for (const imp of imports) {
        // Resolve against ALL files in repo (not just this chunk)
        const resolvedImport = resolveImport(file, imp, allNormalizedFiles, allFilesSet, language);

        if (resolvedImport) {
          const normalizedResolved = normalizeToForward(resolvedImport);
          const targetId = globalNodeMap.get(normalizedResolved);

          if (targetId && sourceId !== targetId) {
            const edgeKey = `${sourceId}->${targetId}`;

            if (!edgeSet.has(edgeKey)) {
              edgeSet.add(edgeKey);
              chunkEdges.push({
                id: `edge_${sourceId}_${targetId}`,
                source: sourceId,
                target: targetId,
                type: 'dependency'
              });
            }
          }
        }
      }
    } catch (err) {
      // Skip files that fail to process
      console.warn(`[Chunk ${chunkNum}] Failed to process ${originalFile}: ${err.message}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Chunk ${chunkNum}/${totalChunks}] Done: ${chunkEdges.length} edges found in ${elapsed}s`);

  return {
    chunkId: chunk.id,
    edges: chunkEdges,
    filesProcessed: chunk.fileCount
  };
}

/**
 * Deduplicate edges from merged chunks
 */
function deduplicateEdges(edges) {
  const seen = new Set();
  const unique = [];

  for (const edge of edges) {
    const key = `${edge.source}->${edge.target}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(edge);
    }
  }

  return unique;
}

/**
 * Calculate inDegree, outDegree, and totalConnections for nodes
 */
function calculateNodeMetrics(nodes, edges) {
  const inDegree = {};
  const outDegree = {};

  for (const edge of edges) {
    outDegree[edge.source] = (outDegree[edge.source] || 0) + 1;
    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
  }

  for (const node of nodes) {
    node.inDegree = inDegree[node.id] || 0;
    node.outDegree = outDegree[node.id] || 0;
    node.totalConnections = node.inDegree + node.outDegree;
  }
}

/**
 * Extract imports from a file with size limit check
 */
async function extractImports(filePath, language) {
  try {
    // Check file size first to skip huge files
    const stats = await fs.stat(filePath);
    if (stats.size > ANALYSIS_CONFIG.MAX_FILE_SIZE_KB * 1024) {
      console.log(`[Analysis] Skipping large file (${(stats.size / 1024).toFixed(0)}KB): ${path.basename(filePath)}`);
      return [];
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const imports = [];

    if (language === 'javascript' || language === 'typescript') {
      // ES6 imports: import x from './path'
      const es6Regex = /import\s+(?:[\w{}\s,*]+\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;
      while ((match = es6Regex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      // CommonJS requires: require('./path')
      const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = cjsRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      // Dynamic imports: import('./path')
      const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = dynamicRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    } else if (language === 'python') {
      // Python imports
      const importRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }
    } else if (language === 'kotlin' || language === 'java') {
      // Kotlin/Java imports: import com.example.ClassName
      // Also handle wildcard imports: import com.example.*
      const importRegex = /import\s+([\w.]+)(?:\s*\.\s*\*)?/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        // Filter out standard library imports - keep only project-specific imports
        if (!importPath.startsWith('java.') &&
          !importPath.startsWith('javax.') &&
          !importPath.startsWith('kotlin.') &&
          !importPath.startsWith('kotlinx.') &&
          !importPath.startsWith('android.') &&
          !importPath.startsWith('androidx.') &&
          !importPath.startsWith('org.junit') &&
          !importPath.startsWith('org.jetbrains')) {
          imports.push(importPath);
        }
      }
    }

    // Limit imports to prevent memory issues with weird files
    if (imports.length > ANALYSIS_CONFIG.MAX_IMPORTS_PER_FILE) {
      console.log(`[Analysis] Limiting imports from ${imports.length} to ${ANALYSIS_CONFIG.MAX_IMPORTS_PER_FILE}: ${path.basename(filePath)}`);
      return imports.slice(0, ANALYSIS_CONFIG.MAX_IMPORTS_PER_FILE);
    }

    return imports;
  } catch (error) {
    return [];
  }
}

/**
 * Resolve an import path to a file in the repository
 */
function resolveImport(sourceFile, importPath, normalizedAllFiles, normalizedFilesSet, language = 'javascript') {
  // We assume normalizedAllFiles uses forward slashes.

  // Handle Kotlin/Java package imports (e.g., com.example.package.ClassName)
  if (language === 'kotlin' || language === 'java') {
    return resolvePackageImport(importPath, normalizedAllFiles);
  }

  // Handle Python imports (e.g., from module.submodule import something)
  if (language === 'python') {
    return resolvePythonImport(sourceFile, importPath, normalizedAllFiles, normalizedFilesSet);
  }

  // Use simple dirname for sourceDir since sourceFile is normalized
  const sourceDir = sourceFile.split('/').slice(0, -1).join('/');

  // If import is relative or absolute path, resolve normally
  if (importPath.startsWith('.') || importPath.startsWith('/')) {
    // We construct the path manually to ensure forward slashes
    // Standard path.join might introduce backslashes on Windows
    let resolved;
    if (importPath.startsWith('/')) {
      resolved = importPath.substring(1); // Treat as relative to root? Or keep absolute? Usually 'src/foo'
    } else {
      // Handle relative path navigation
      const parts = sourceDir.split('/').filter(Boolean);
      const relParts = importPath.split('/').filter(Boolean);

      for (const part of relParts) {
        if (part === '.') continue;
        if (part === '..') {
          parts.pop();
        } else {
          parts.push(part);
        }
      }
      resolved = parts.join('/');
    }

    // Try different extensions and index files
    const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '/index.js', '/index.ts', '/index.jsx', '/index.tsx', '.vue', '.svelte'];
    for (const ext of extensions) {
      const candidate = resolved + ext;
      if (normalizedFilesSet.has(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  // Handle aliases like @/ or ~/
  let aliasedPath = importPath;
  if (importPath.startsWith('@/')) {
    aliasedPath = 'src/' + importPath.substring(2);
  } else if (importPath.startsWith('~/')) {
    aliasedPath = 'src/' + importPath.substring(2);
  }

  // Non-relative imports (bare specifiers) logic for aliased paths
  // If it was aliased, we now treat it as a relative-ish path from root
  if (aliasedPath !== importPath) {
    const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '/index.js', '/index.ts', '/index.jsx', '/index.tsx', '.vue', '.svelte'];
    // Try generic 'src' and specific client/server roots which act as alias bases
    const aliasBases = ['', 'client/', 'server/', 'src/', 'client/src/', 'server/src/'];

    // Remove 'src/' from aliased path if we are going to try prepending it again to avoid src/src
    const rawPath = importPath.substring(2); // remove @/

    for (const base of aliasBases) {
      for (const ext of extensions) {
        const candidate1 = base + rawPath + ext;
        if (normalizedFilesSet.has(candidate1)) return candidate1;

        // Check for index files explicitly if not covered
        if (!candidate1.endsWith('index' + ext)) {
          const candidate2 = base + rawPath + '/index' + ext;
          if (normalizedFilesSet.has(candidate2)) return candidate2;
        }
      }
    }
  }

  // Standard non-relative imports handling
  if (!importPath.includes('/')) {
    return null;
  }

  // Build candidate suffixes
  const candidates = [];
  const base = importPath.replace(/^\/+/, '');
  const exts = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte'];

  // 1. Exact match attempt
  candidates.push(base);
  for (const e of exts) candidates.push(base + e);
  for (const e of exts) candidates.push(base + '/index' + e);
  candidates.push(base + '/index.js');

  // 2. Try simpler prefixes
  const prefixes = ['src/', 'app/', 'lib/', 'client/src/', 'server/src/']; // Added client/server src
  for (const p of prefixes) {
    candidates.push(p + base);
    for (const e of exts) candidates.push(p + base + e);
    for (const e of exts) candidates.push(p + base + '/index' + e);
  }

  for (const cand of candidates) {
    if (normalizedFilesSet.has(cand)) return cand;
  }

  // Try suffix matching as fallback (RESTRICTED: Only if path implies uniqueness)
  // Removed global suffix matching which causes false positives (e.g. 'utils' matching 'src/utils' and 'lib/utils')

  // As a fallback, try matching by final segment/class name
  // RESTRICTED: Only if the name is unique in the entire repo to avoid 'config.js' collisions
  const finalSegment = base.split('/').pop();
  if (finalSegment && finalSegment.length > 5) { // Only do this for reasonably unique names
    const matches = normalizedAllFiles.filter(f => {
      const fileName = f.split('/').pop();
      if (!fileName) return false;
      const nameNoExt = fileName.replace(/\.[^/.]+$/, '');
      return nameNoExt === finalSegment;
    });

    // Only return if exactly one match found (safe fallback)
    if (matches.length === 1) return matches[0];
  }

  return null;
}

/**
 * Resolve Kotlin/Java package imports to files
 */
function resolvePackageImport(importPath, allFiles) {
  // allFiles is normalized
  const pathFromPackage = importPath.replace(/\./g, '/');

  const extensions = ['.kt', '.java', '.kts'];

  for (const file of allFiles) {
    for (const ext of extensions) {
      const expectedEnding = pathFromPackage + ext;
      if (file.endsWith(expectedEnding)) {
        return file;
      }

      const className = importPath.split('.').pop();
      // file uses forward slashes
      if (file.endsWith('/' + className + ext)) {
        // Simple heuristic check
        if (file.includes(pathFromPackage.split('/').pop())) {
          return file;
        }
      }
    }
  }

  return null;
}

/**
 * Resolve Python imports to files
 */
function resolvePythonImport(sourceFile, importPath, allFiles, fileSet) {
  // sourceFile is normalized, allFiles is normalized
  let cleanPath = importPath.replace(/^\.+/, '');
  const pathFromImport = cleanPath.replace(/\./g, '/');

  const sourceDir = sourceFile.split('/').slice(0, -1).join('/');
  const dotCount = (importPath.match(/^\.*/) || [''])[0].length;

  let baseParts = sourceDir.split('/');
  for (let i = 1; i < dotCount; i++) {
    baseParts.pop();
  }

  const baseDir = baseParts.join('/');
  const relativePath = baseDir ? (baseDir + '/' + pathFromImport) : pathFromImport;

  const candidates = [
    relativePath + '.py',
    relativePath + '/__init__.py',
    pathFromImport + '.py',
    pathFromImport + '/__init__.py'
  ];

  for (const candidate of candidates) {
    if (fileSet && fileSet.has(candidate)) return candidate;
    if (allFiles.includes(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Get file type based on naming conventions
 */
function getFileType(file) {
  const name = path.basename(file).toLowerCase();

  if (name.includes('.test.') || name.includes('.spec.')) return 'test';
  if (name.includes('.config.') || name === 'config.js') return 'config';
  if (name.includes('component') || name.endsWith('.jsx') || name.endsWith('.tsx')) return 'component';
  if (name.includes('service')) return 'service';
  if (name.includes('util') || name.includes('helper')) return 'utility';
  if (name.includes('hook')) return 'hook';
  if (name.includes('route')) return 'route';
  if (name.includes('model') || name.includes('schema')) return 'model';
  if (name === 'index.js' || name === 'index.ts') return 'entry';

  return 'module';
}

/**
 * Analyze code complexity metrics with chunked processing for large repos
 */
async function analyzeComplexity(repoPath) {
  await validateRepoPath(repoPath);

  const files = await getCodeFiles(repoPath);

  if (!files || files.length === 0) {
    return { files: [], summary: { totalFiles: 0, avgComplexity: 0, mostComplex: [], leastComplex: [] } };
  }

  console.log(`[Complexity] Analyzing ${files.length} files`);
  const startTime = Date.now();

  // Process in chunks for large repos - dynamic chunk size
  const chunkSize = Math.min(500, Math.max(50, Math.floor(files.length / 100)));
  const complexityData = [];

  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, Math.min(i + chunkSize, files.length));
    const chunkNum = Math.floor(i / chunkSize) + 1;
    const totalChunks = Math.ceil(files.length / chunkSize);

    if (files.length > ANALYSIS_CONFIG.LARGE_REPO_THRESHOLD) {
      console.log(`[Complexity] Processing chunk ${chunkNum}/${totalChunks}`);
    }

    // Process chunk files in parallel (batch of promises)
    const chunkResults = await Promise.all(
      chunk.map(file => analyzeFileComplexity(repoPath, file))
    );

    // Collect non-null results
    for (const result of chunkResults) {
      if (result) complexityData.push(result);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Complexity] Completed in ${elapsed}s`);

  // Sort by complexity
  complexityData.sort((a, b) => b.complexityScore - a.complexityScore);

  return {
    files: complexityData,
    summary: {
      totalFiles: complexityData.length,
      avgComplexity: complexityData.length > 0
        ? Math.round(complexityData.reduce((sum, f) => sum + f.complexityScore, 0) / complexityData.length)
        : 0,
      mostComplex: complexityData.slice(0, 5),
      leastComplex: complexityData.slice(-5).reverse()
    }
  };
}

/**
 * Analyze complexity of a single file
 */
async function analyzeFileComplexity(repoPath, file) {
  const filePath = path.join(repoPath, file);
  try {
    // Check file size first
    const stats = await fs.stat(filePath);
    if (stats.size > ANALYSIS_CONFIG.MAX_FILE_SIZE_KB * 1024) {
      return null; // Skip large files
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Simple complexity metrics
    const metrics = {
      file,
      lines: lines.length,
      codeLines: lines.filter(l => l.trim() && !l.trim().startsWith('//')).length,
      functions: (content.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g) || []).length,
      classes: (content.match(/class\s+\w+/g) || []).length,
      conditionals: (content.match(/if\s*\(|switch\s*\(|\?\s*.*:/g) || []).length,
      loops: (content.match(/for\s*\(|while\s*\(|\.forEach|\.map|\.filter|\.reduce/g) || []).length
    };

    // Calculate complexity score (simplified)
    metrics.complexityScore = Math.round(
      (metrics.conditionals * 2) +
      (metrics.loops * 2) +
      (metrics.functions * 1) +
      (metrics.lines / 50)
    );

    return metrics;
  } catch (error) {
    return null; // Skip files that can't be read
  }
}

/**
 * Analyze module centrality (hub detection)
 */
async function analyzeCentrality(repoPath) {
  const { nodes, edges } = await analyzeDependencies(repoPath);

  // Calculate centrality metrics
  const centrality = nodes.map(node => {
    const dependsOn = edges.filter(e => e.source === node.id).length;
    const dependedBy = edges.filter(e => e.target === node.id).length;

    return {
      ...node,
      dependsOn,
      dependedBy,
      centralityScore: dependedBy * 2 + dependsOn, // Higher weight for being depended upon
      isHub: dependedBy > 3,
      isLeaf: dependsOn > 0 && dependedBy === 0,
      isOrphan: dependsOn === 0 && dependedBy === 0
    };
  });

  // Sort by centrality
  centrality.sort((a, b) => b.centralityScore - a.centralityScore);

  return {
    nodes: centrality,
    hubs: centrality.filter(n => n.isHub),
    leaves: centrality.filter(n => n.isLeaf),
    orphans: centrality.filter(n => n.isOrphan),
    summary: {
      totalNodes: centrality.length,
      hubCount: centrality.filter(n => n.isHub).length,
      leafCount: centrality.filter(n => n.isLeaf).length,
      orphanCount: centrality.filter(n => n.isOrphan).length
    }
  };
}

/**
 * Get insights for a specific module (on hover/click)
 */
async function getModuleInsights(repoPath, nodeId) {
  const { nodes, edges } = await analyzeDependencies(repoPath);
  const node = nodes.find(n => n.id === nodeId);

  if (!node) {
    return { error: 'Node not found' };
  }

  const dependsOn = edges
    .filter(e => e.source === nodeId)
    .map(e => nodes.find(n => n.id === e.target))
    .filter(Boolean);

  const dependedBy = edges
    .filter(e => e.target === nodeId)
    .map(e => nodes.find(n => n.id === e.source))
    .filter(Boolean);

  // Generate observational insights (non-judgmental)
  const observations = [];

  if (dependedBy.length > 5) {
    observations.push(`This file is referenced by ${dependedBy.length} other files.`);
  }

  if (dependsOn.length > 10) {
    observations.push(`This file depends on ${dependsOn.length} other files.`);
  }

  if (dependedBy.length === 0 && dependsOn.length === 0) {
    observations.push('This file has no detected connections to other files.');
  }

  if (dependedBy.length > 0 && dependsOn.length === 0) {
    observations.push('This file is a leaf node - it provides functionality without dependencies.');
  }

  return {
    node,
    dependsOn: dependsOn.map(n => ({ id: n.id, label: n.label, path: n.fullPath })),
    dependedBy: dependedBy.map(n => ({ id: n.id, label: n.label, path: n.fullPath })),
    observations
  };
}

/**
 * Expand a unit to show its internals (for Layer 2+ transitions)
 */
async function expandUnit(repoPath, unitId, depth = 1) {
  // Get raw dependency data
  const rawResult = await analyzeDependencies(repoPath, 'javascript', false);

  // Find the unit in semantic data
  const semanticData = semanticLayerEngine.processForSemanticLayers(
    rawResult.nodes,
    rawResult.edges,
    rawResult.nodes.length
  );

  const unit = semanticData.nodes.find(u => u.id === unitId);

  if (!unit) {
    return { error: 'Unit not found', nodes: [], edges: [] };
  }

  // Expand the unit using semantic layer engine
  const expanded = semanticLayerEngine.expandUnit(
    unit,
    rawResult.nodes,
    rawResult.edges,
    depth
  );

  return expanded;
}

/**
 * Get impact chain for a unit (for Layer 3 - Impact & Risk)
 */
async function getUnitImpact(repoPath, unitId) {
  const rawResult = await analyzeDependencies(repoPath, 'javascript', false);

  const semanticData = semanticLayerEngine.processForSemanticLayers(
    rawResult.nodes,
    rawResult.edges,
    rawResult.nodes.length
  );

  return semanticLayerEngine.getImpactChain(
    unitId,
    semanticData.nodes,
    semanticData.edges
  );
}

module.exports = {
  analyzeDependencies,
  analyzeComplexity,
  analyzeCentrality,
  getModuleInsights,
  expandUnit,
  getUnitImpact,
  analyzeGitChurn,
  analyzePRImpact
};

/**
 * Analyze git modification frequency per file (Hotspots)
 */
async function analyzeGitChurn(repoPath) {
  await validateRepoPath(repoPath);
  const git = simpleGit(repoPath);

  try {
    // Get list of all files with their modification count
    // This gives us the "heat" of each file based on its history
    const log = await git.raw(['log', '--name-only', '--pretty=format:']);
    const lines = log.split('\n').filter(Boolean);

    const churnMap = {};
    for (const line of lines) {
      const normalized = normalizeToForward(line.trim());
      churnMap[normalized] = (churnMap[normalized] || 0) + 1;
    }

    return churnMap;
  } catch (error) {
    console.warn('[Git] Failed to fetch churn data:', error.message);
    return {};
  }
}

/**
 * Analyze PR impact based on current diff vs main (Risk prediction)
 */
async function analyzePRImpact(repoPath, baseBranch = 'main') {
  await validateRepoPath(repoPath);
  const git = simpleGit(repoPath);

  try {
    // Get list of files changed between current HEAD and baseBranch
    const diff = await git.raw(['diff', '--name-only', baseBranch]);
    const changedFiles = diff.split('\n').filter(Boolean).map(normalizeToForward);

    return changedFiles;
  } catch (error) {
    console.warn('[Git] Failed to fetch PR diff for branch:', baseBranch, error.message);
    // Silent fallback to 'master' if 'main' is not found
    if (baseBranch === 'main') {
      return analyzePRImpact(repoPath, 'master');
    }
    return [];
  }
}
