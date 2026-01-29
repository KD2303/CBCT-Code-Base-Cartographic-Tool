const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

/**
 * F0: Repository Structural Extraction Service
 * 
 * Parses entire repository without configuration, annotations, or assumptions.
 * Builds the truth layer of nodes (files/modules) and edges (dependencies/references).
 * This is the foundation for all other analysis features.
 */

/**
 * Normalize path to use forward slashes for consistency
 */
function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

/**
 * Get file extension and detect language
 */
function getLanguageFromExtension(ext) {
  const extMap = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.pyi': 'python',
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
    '.cc': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.vue': 'javascript',
    '.svelte': 'javascript',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.html': 'html',
    '.htm': 'html',
    '.dart': 'dart',
    '.hs': 'haskell',
    '.lhs': 'haskell',
  };
  return extMap[ext] || 'unknown';
}

/**
 * Determine file type category from path and extension
 */
function getFileType(filePath, extension) {
  const pathLower = filePath.toLowerCase();
  const extLower = extension.toLowerCase();

  // Test files
  if (/\.(test|spec)\.(js|ts|jsx|tsx|py)$/.test(pathLower) || /^test\/|^tests\/|^__tests__\//.test(pathLower)) {
    return 'test';
  }

  // Component files
  if (/(component|page|view|screen)\.(jsx?|tsx?)$/i.test(pathLower)) {
    return 'component';
  }

  // Configuration
  if (/^(config|\.config|configuration|webpack|babel|tsconfig|vite|rollup)/i.test(path.basename(filePath)) ||
    /\.(config|rc)\.(js|ts|json)$/i.test(filePath)) {
    return 'config';
  }

  // Services and API
  if (/(service|api|handler|middleware)\.(js|ts|py)$/i.test(pathLower)) {
    return 'service';
  }

  // Hooks (React)
  if (/^use[A-Z].*\.(js|ts|jsx|tsx)$/i.test(path.basename(filePath))) {
    return 'hook';
  }

  // Routes
  if (/(route|routing|router|pages)\.(js|ts|jsx|tsx)$/i.test(pathLower) ||
    /^routes?\//i.test(pathLower)) {
    return 'route';
  }

  // Models/Types
  if (/(model|schema|type|interface|entity)\.(js|ts|py)$/i.test(pathLower)) {
    return 'model';
  }

  // Entry points
  if (/(index|main|entry)\.(js|ts|jsx|tsx|py)$/i.test(pathLower)) {
    return 'entry';
  }

  // Utilities
  if (/(util|helper|common|shared|lib|tool)\.(js|ts|py)$/i.test(pathLower)) {
    return 'utility';
  }

  // Styles
  if (['.css', '.scss', '.sass', '.less'].includes(extLower)) {
    return 'style';
  }

  // Config files
  if (['.json', '.yaml', '.yml', '.xml'].includes(extLower)) {
    return 'config';
  }

  return 'module';
}

/**
 * Get file size in bytes
 */
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Count lines in file
 */
async function countLines(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

/**
 * Parse JavaScript/TypeScript imports
 */
function parseJSImports(content, filePath, rootPath) {
  const imports = [];
  const baseDir = normalizePath(path.dirname(filePath));
  const rootNorm = normalizePath(rootPath);

  // CommonJS require() pattern
  const requirePattern = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let match;
  while ((match = requirePattern.exec(content)) !== null) {
    const importPath = match[1];
    const resolvedPath = resolveModulePath(importPath, baseDir, rootNorm);
    if (resolvedPath) imports.push(resolvedPath);
  }

  // ES6 import pattern
  const importPattern = /import\s+(?:(?:\{[^}]*\})|(?:\*\s+as\s+\w+)|(?:\w+))\s+from\s+['"`]([^'"`]+)['"`]/g;
  while ((match = importPattern.exec(content)) !== null) {
    const importPath = match[1];
    const resolvedPath = resolveModulePath(importPath, baseDir, rootNorm);
    if (resolvedPath) imports.push(resolvedPath);
  }

  // Dynamic imports
  const dynamicPattern = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  while ((match = dynamicPattern.exec(content)) !== null) {
    const importPath = match[1];
    const resolvedPath = resolveModulePath(importPath, baseDir, rootNorm);
    if (resolvedPath) imports.push(resolvedPath);
  }

  return imports;
}

/**
 * Resolve import path to actual file path
 */
function resolveModulePath(importPath, fromDir, rootPath) {
  // Skip external packages
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return null;
  }

  // Skip URLs and protocols
  if (importPath.includes('://')) {
    return null;
  }

  // Resolve relative path
  let resolvedPath = path.resolve(fromDir, importPath);
  resolvedPath = normalizePath(resolvedPath);

  // Try different extensions
  const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '/index.js', '/index.ts', '/index.jsx', '/index.tsx'];

  for (const ext of extensions) {
    const candidate = resolvedPath + ext;
    // Check if within root path (prevent escape)
    if (candidate.startsWith(rootPath)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Parse Python imports
 */
function parsePythonImports(content, filePath, rootPath) {
  const imports = [];
  const baseDir = normalizePath(path.dirname(filePath));
  const rootNorm = normalizePath(rootPath);

  // Import statements
  const importPattern = /^(?:from|import)\s+([.\w]+)/gm;
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const modulePath = match[1];
    // Convert Python module path to file path
    const filePath = modulePath.replace(/\./g, '/') + '.py';
    const resolvedPath = path.resolve(baseDir, filePath);
    if (resolvedPath.startsWith(rootNorm)) {
      imports.push(normalizePath(resolvedPath));
    }
  }

  return imports;
}

/**
 * Parse imports based on language
 */
function parseImports(content, filePath, language, rootPath) {
  if (['javascript', 'typescript'].includes(language)) {
    return parseJSImports(content, filePath, rootPath);
  } else if (language === 'python') {
    return parsePythonImports(content, filePath, rootPath);
  }
  return [];
}

/**
 * Get glob patterns to include in extraction
 */
function getGlobPatterns() {
  return [
    // JavaScript/TypeScript
    '**/*.js',
    '**/*.jsx',
    '**/*.mjs',
    '**/*.cjs',
    '**/*.ts',
    '**/*.tsx',
    // Python
    '**/*.py',
    // Java
    '**/*.java',
    // Go
    '**/*.go',
    // Rust
    '**/*.rs',
    // Other languages
    '**/*.rb',
    '**/*.php',
    '**/*.swift',
    '**/*.c',
    '**/*.cpp',
    '**/*.cc',
    '**/*.h',
    '**/*.hpp',
    '**/*.cs',
    // Web
    '**/*.vue',
    '**/*.svelte',
    '**/*.css',
    '**/*.scss',
    '**/*.less',
    '**/*.html',
    // Config
    '**/*.json',
    '**/*.yaml',
    '**/*.yml',
    '**/*.xml',
    '**/*.dart',
    '**/*.hs',
    '**/*.lhs',
  ];
}

/**
 * Get ignore patterns
 */
function getIgnorePatterns() {
  return [
    'node_modules',
    '.git',
    '.venv',
    'env',
    '__pycache__',
    'dist',
    'build',
    '.next',
    '.nuxt',
    'out',
    'coverage',
    '.cache',
    'tmp',
    'temp',
    '*.min.js',
    '*.min.css',
    '.DS_Store',
    'Thumbs.db',
  ];
}

/**
 * F0: Repository Structural Extraction
 * Parses entire repository and extracts structural information
 * Returns nodes (files/modules) without any processing or assumptions
 */
async function extractRepositoryStructure(repoPath) {
  try {
    // Validate repo path
    const stats = await fs.stat(repoPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${repoPath}`);
    }

    const rootPath = normalizePath(repoPath);
    const patterns = getGlobPatterns();
    const ignorePatterns = getIgnorePatterns();

    // Find all code files
    const globOptions = {
      cwd: repoPath,
      absolute: true,
      ignore: ignorePatterns,
      maxDepth: 50, // Prevent infinite recursion
    };

    const files = await glob(patterns, globOptions);

    if (!files || files.length === 0) {
      return {
        nodes: [],
        metadata: {
          timestamp: new Date().toISOString(),
          repoPath: rootPath,
          fileCount: 0,
          error: 'No code files found in repository',
        }
      };
    }

    // Create nodes for each file
    const nodes = [];
    const nodeMap = new Map(); // Map of normalized path -> node id

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      const normalizedPath = normalizePath(filePath);
      const relativePath = normalizePath(path.relative(repoPath, filePath));
      const extension = path.extname(filePath);
      const language = getLanguageFromExtension(extension);
      const fileType = getFileType(relativePath, extension);

      const [size, lines] = await Promise.all([
        getFileSize(filePath),
        countLines(filePath),
      ]);

      const nodeId = `node_${i}`;
      const node = {
        id: nodeId,
        path: normalizedPath, // Full absolute path (truth layer)
        relativePath: relativePath, // Relative to repo root
        name: path.basename(filePath),
        directory: normalizePath(path.dirname(relativePath)),
        extension: extension,
        language: language,
        type: fileType,
        metadata: {
          size: size, // bytes
          lines: lines,
          createdAt: new Date().toISOString(),
        }
      };

      nodes.push(node);
      nodeMap.set(normalizedPath, nodeId);
    }

    return {
      nodes: nodes,
      nodeMap: nodeMap, // For internal use in linking
      metadata: {
        timestamp: new Date().toISOString(),
        repoPath: rootPath,
        fileCount: nodes.length,
        languages: [...new Set(nodes.map(n => n.language))],
        types: [...new Set(nodes.map(n => n.type))],
      }
    };
  } catch (error) {
    throw new Error(`Repository structural extraction failed: ${error.message}`);
  }
}

/**
 * Extract dependencies from a single file
 */
async function extractFileDependencies(filePath, language, rootPath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseImports(content, filePath, language, rootPath);
  } catch (error) {
    console.warn(`Failed to parse dependencies in ${filePath}:`, error.message);
    return [];
  }
}

/**
 * F1 Part 1: Extract all edges (dependencies) from the repository
 * This will be used to build the global graph
 */
async function extractAllDependencies(repoPath, nodes) {
  const rootPath = normalizePath(repoPath);
  const edges = [];
  const edgeSet = new Set(); // Prevent duplicates

  // Create a set of known file paths for validation
  const knownPaths = new Set(nodes.map(n => n.path));

  for (const node of nodes) {
    try {
      const fullPath = node.path;
      const dependencies = await extractFileDependencies(fullPath, node.language, rootPath);

      for (const depPath of dependencies) {
        // Only create edge if target is a known file
        if (knownPaths.has(depPath)) {
          const edgeKey = `${node.id}->${nodes.find(n => n.path === depPath)?.id}`;

          if (!edgeSet.has(edgeKey)) {
            edges.push({
              source: node.id,
              target: nodes.find(n => n.path === depPath).id,
              type: 'import',
              metadata: {
                createdAt: new Date().toISOString(),
              }
            });
            edgeSet.add(edgeKey);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to extract dependencies for node ${node.id}:`, error.message);
    }
  }

  return edges;
}

module.exports = {
  extractRepositoryStructure,
  extractAllDependencies,
  extractFileDependencies,
  parseImports,
  normalizePath,
  getLanguageFromExtension,
  getFileType,
};
