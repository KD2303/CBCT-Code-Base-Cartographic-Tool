const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { glob } = require('glob');
const simpleGit = require('simple-git');

// Configuration for handling large repositories
const CONFIG = {
  MAX_FILES_TO_ANALYZE: 50000,      // Dynamic limit - chunked processing handles large repos
  MAX_FILE_SIZE_KB: 500,            // Skip files larger than this (likely not source code)
  CLONE_CACHE_HOURS: 24,            // Cache cloned repos for this long
  CLONE_TIMEOUT_MS: 600000,         // 10 minutes max for clone operation (increased for large repos like React)
};

// In-memory cache for recently cloned repos
const cloneCache = new Map();

// File extensions to analyze
const CODE_EXTENSIONS = [
  // JavaScript / TypeScript
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  // Python
  '.py',
  // Java / Kotlin
  '.java', '.kt', '.kts',
  // C / C++
  '.cpp', '.c', '.h', '.hpp', '.cc', '.cxx',
  // C# / .NET
  '.cs',
  // Go
  '.go',
  // Rust
  '.rs',
  // Ruby
  '.rb',
  // PHP
  '.php',
  // Swift / Objective-C
  '.swift', '.m', '.mm',
  // Web
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.vue', '.svelte',
  // Config / Data
  '.json', '.yaml', '.yml', '.xml', '.toml',
  // Shell
  '.sh', '.bash', '.zsh', '.ps1',
  // Other
  '.sql', '.graphql', '.md', '.markdown'
];

// Directories to ignore
const IGNORE_DIRS = [
  'node_modules', '.git', 'dist', 'build', 'coverage',
  '__pycache__', '.next', '.cache', 'vendor', 'target'
];

/**
 * Scan a repository and return its metadata
 */
async function scanRepository(repoPath) {
  // Validate the path exists
  let stats;
  try {
    stats = await fs.stat(repoPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Path does not exist: ${repoPath}`);
    }
    throw new Error(`Cannot access path: ${error.message}`);
  }

  if (!stats.isDirectory()) {
    throw new Error('Path is not a directory');
  }

  const files = await getCodeFiles(repoPath);
  const structure = await analyzeStructure(repoPath, files);

  return {
    path: repoPath,
    name: path.basename(repoPath),
    totalFiles: files.length,
    structure,
    languages: detectLanguages(files),
    scannedAt: new Date().toISOString()
  };
}

/**
 * Determine if input is a GitHub URL
 */
function isGithubUrl(input) {
  if (typeof input !== 'string') return false;
  const trimmed = input.trim();
  return /^https?:\/\/github\.com\//i.test(trimmed);
}

/**
 * Parse GitHub URL for owner, repo, branch, and subdir.
 * Supports:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo/tree/branch
 * - https://github.com/owner/repo/tree/branch/sub/dir
 */
function parseGithubUrl(urlStr) {
  const u = new URL(urlStr);
  const parts = u.pathname.split('/').filter(Boolean);
  const owner = parts[0];
  let repo = (parts[1] || '').replace(/\.git$/i, '');
  let branch = '';
  let subdir = '';
  if (parts[2] === 'tree') {
    branch = parts[3] || '';
    subdir = parts.slice(4).join('/');
  }
  return { owner, repo, branch, subdir };
}

/**
 * Clone a GitHub repo to a temporary folder and return local path
 * Includes caching to avoid re-cloning recently cloned repos
 */
async function cloneGithubRepo(repoUrl) {
  const { owner, repo, branch, subdir } = parseGithubUrl(repoUrl);
  console.log('[Clone] Parsed URL:', { owner, repo, branch, subdir });

  if (!owner || !repo) {
    throw new Error('Invalid GitHub URL: could not parse owner/repo');
  }

  // Check cache first
  const cacheKey = `${owner}/${repo}/${branch || 'default'}`;
  const cached = cloneCache.get(cacheKey);
  if (cached) {
    const ageHours = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
    if (ageHours < CONFIG.CLONE_CACHE_HOURS) {
      // Verify the cached path still exists
      try {
        await fs.stat(cached.targetDir);
        console.log('[Clone] Using cached clone:', cached.targetDir);
        const localPath = subdir ? path.join(cached.targetDir, subdir) : cached.targetDir;
        return { localPath, targetDir: cached.targetDir, fromCache: true };
      } catch (e) {
        // Cache entry is stale, remove it
        cloneCache.delete(cacheKey);
      }
    } else {
      cloneCache.delete(cacheKey);
    }
  }

  const baseDir = 'C:\\cbct-repos';
  console.log('[Clone] Creating base directory:', baseDir);

  try {
    await fs.mkdir(baseDir, { recursive: true });
  } catch (mkdirErr) {
    console.error('[Clone] Failed to create tmp-repos directory:', mkdirErr.message);
    throw new Error(`Failed to create temp directory: ${mkdirErr.message}`);
  }

  // Clean up old clones to save disk space (keep last 20)
  await cleanupOldClones(baseDir, 20);

  const targetDir = path.join(baseDir, `${owner}__${repo}__${Date.now()}`);
  const gitUrl = `https://github.com/${owner}/${repo}.git`;
  console.log('[Clone] Cloning from:', gitUrl, 'to:', targetDir);

  // Configure git with timeout and optimizations
  const git = simpleGit({
    timeout: {
      block: CONFIG.CLONE_TIMEOUT_MS,
    },
    // Let simple-git auto-detect git from system PATH
  });

  // Enable long path support globally for Windows
  try {
    await git.raw(['config', '--global', 'core.longpaths', 'true']);
  } catch (configErr) {
    console.warn('[Clone] Could not set global longpaths config:', configErr.message);
  }

  // Use shallow clone with single branch for speed
  const cloneOpts = [
    '--depth', '1',
    '--single-branch',
  ];
  if (branch) {
    cloneOpts.push('--branch', branch);
  }

  try {
    console.log('[Clone] Starting clone with options:', cloneOpts.join(' '));
    const startTime = Date.now();
    await git.clone(gitUrl, targetDir, cloneOpts);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Clone] Clone successful in ${elapsed}s`);
  } catch (cloneErr) {
    console.error('[Clone] Git clone failed:', cloneErr.message);

    // Provide specific error messages for common issues
    if (cloneErr.message.includes('HTTP 500')) {
      throw new Error(`GitHub repository returned server error (HTTP 500). This could indicate the repository is temporarily unavailable or has server-side issues. Try again later or verify the repository exists and is accessible.`);
    }

    if (cloneErr.message.includes('Repository not found') || cloneErr.message.includes('not found')) {
      throw new Error(`Repository not found. Please verify the URL is correct and the repository exists and is public: ${gitUrl}`);
    }

    if (cloneErr.message.includes('Filename too long')) {
      throw new Error(`Repository cannot be cloned on Windows due to extremely long file paths. This is a Windows filesystem limitation (260 character limit). Try using Windows Subsystem for Linux (WSL) or a shorter target directory path.`);
    }

    if (cloneErr.message.includes('checkout failed')) {
      throw new Error(`Repository cloned but checkout failed due to long file paths. This is common with large repositories on Windows. Consider using a shorter clone path or WSL.`);
    }

    // Try simpler clone without filter if partial clone fails
    if (cloneErr.message.includes('filter')) {
      console.log('[Clone] Retrying without blob filter...');
      try {
        const simpleOpts = ['--depth', '1'];
        if (branch) simpleOpts.push('--branch', branch);
        await git.clone(gitUrl, targetDir, simpleOpts);
      } catch (retryErr) {
        throw new Error(`Git clone failed even with simplified options: ${retryErr.message}`);
      }
    } else {
      throw new Error(`Git clone failed: ${cloneErr.message}`);
    }
  }

  const localPath = subdir ? path.join(targetDir, subdir) : targetDir;
  console.log('[Clone] Local path:', localPath);

  try {
    const stat = await fs.stat(localPath);
    if (!stat.isDirectory()) {
      throw new Error('Cloned path is not a directory');
    }
  } catch (statErr) {
    console.error('[Clone] Failed to stat cloned path:', statErr.message);
    throw new Error(`Failed to access cloned repository: ${statErr.message}`);
  }

  // Cache this clone
  cloneCache.set(cacheKey, { targetDir, timestamp: Date.now() });

  return { localPath, targetDir, fromCache: false };
}

/**
 * Clean up old clone directories to save disk space
 */
async function cleanupOldClones(baseDir, keepCount) {
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const dirs = entries
      .filter(e => e.isDirectory())
      .map(e => ({ name: e.name, path: path.join(baseDir, e.name) }));

    if (dirs.length <= keepCount) return;

    // Sort by timestamp in name (oldest first)
    dirs.sort((a, b) => {
      const tsA = parseInt(a.name.split('__').pop()) || 0;
      const tsB = parseInt(b.name.split('__').pop()) || 0;
      return tsA - tsB;
    });

    // Remove oldest directories
    const toRemove = dirs.slice(0, dirs.length - keepCount);
    for (const dir of toRemove) {
      try {
        await fs.rm(dir.path, { recursive: true, force: true });
        console.log('[Cleanup] Removed old clone:', dir.name);
      } catch (e) {
        console.warn('[Cleanup] Failed to remove:', dir.name, e.message);
      }
    }
  } catch (e) {
    console.warn('[Cleanup] Error during cleanup:', e.message);
  }
}

/**
 * Scan repository from either a local path or a GitHub URL
 */
async function scanRepositoryInput(input) {
  if (isGithubUrl(input)) {
    const { owner, repo } = parseGithubUrl(input);
    const { localPath, targetDir } = await cloneGithubRepo(input);
    const result = await scanRepository(localPath);
    return {
      ...result,
      name: `${owner}/${repo}`,  // Friendly display name for GitHub repos
      source: 'github',
      repoUrl: input,
      clonePath: targetDir
    };
  }
  return scanRepository(input);
}

/**
 * Get file tree from either a local path or a GitHub URL
 */
async function getFileTreeInput(input) {
  if (isGithubUrl(input)) {
    const { localPath, targetDir } = await cloneGithubRepo(input);
    const tree = await getFileTree(localPath);
    return {
      source: 'github',
      repoUrl: input,
      clonePath: targetDir,
      tree
    };
  }
  return getFileTree(input);
}

/**
 * Get all code files in the repository with limits for large repos
 */
async function getCodeFiles(repoPath, options = {}) {
  const maxFiles = options.maxFiles || CONFIG.MAX_FILES_TO_ANALYZE;

  // Validate path exists before scanning
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

  const patterns = CODE_EXTENSIONS.map(ext => `**/*${ext}`);
  const ignorePatterns = IGNORE_DIRS.map(dir => `**/${dir}/**`);

  console.log('[Scan] Scanning for code files...');
  const startTime = Date.now();

  let files = await glob(patterns, {
    cwd: repoPath,
    ignore: ignorePatterns,
    nodir: true
  });

  const totalFound = files.length;
  console.log(`[Scan] Found ${totalFound} code files in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  // For large repos, analyze all files with chunked processing
  // No artificial limit - let analysis service handle chunking
  console.log(`[Scan] Will analyze all ${totalFound} files using chunked processing`);

  return files;
}

/**
 * Prioritize which files to analyze when there are too many
 * Focuses on entry points, core files, and representative samples
 */
function prioritizeFiles(files, limit) {
  const priorityPatterns = [
    // Entry points and config
    /^(index|main|app|server|client)\.[jt]sx?$/i,
    /package\.json$/,
    /tsconfig\.json$/,
    // Source directories
    /^src\//,
    /^app\//,
    /^lib\//,
    /^core\//,
    // Components and pages
    /components?\//i,
    /pages?\//i,
    /views?\//i,
    /routes?\//i,
    /api\//i,
    /services?\//i,
    /utils?\//i,
    /hooks?\//i,
  ];

  const scored = files.map(file => {
    let score = 0;
    for (let i = 0; i < priorityPatterns.length; i++) {
      if (priorityPatterns[i].test(file)) {
        score += (priorityPatterns.length - i) * 10; // Higher priority = higher score
      }
    }
    // Prefer shorter paths (less nested = more important)
    score -= (file.split('/').length - 1) * 2;
    // Prefer .ts/.tsx over .js/.jsx
    if (/\.tsx?$/.test(file)) score += 5;
    return { file, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.file);
}

/**
 * Analyze the directory structure
 */
async function analyzeStructure(repoPath, files) {
  const structure = {
    directories: new Set(),
    modules: [],
    fileCount: {}
  };

  for (const file of files) {
    const dir = path.dirname(file);
    structure.directories.add(dir);

    const ext = path.extname(file);
    structure.fileCount[ext] = (structure.fileCount[ext] || 0) + 1;
  }

  // Identify potential modules (directories with multiple files)
  const dirCounts = {};
  for (const file of files) {
    const topDir = file.split(path.sep)[0];
    dirCounts[topDir] = (dirCounts[topDir] || 0) + 1;
  }

  structure.modules = Object.entries(dirCounts)
    .filter(([dir, count]) => count > 1 && dir !== '.')
    .map(([dir, count]) => ({ name: dir, fileCount: count }));

  structure.directories = Array.from(structure.directories);

  return structure;
}

/**
 * Detect languages used in the repository
 */
function detectLanguages(files) {
  const langMap = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (React)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (React)',
    '.mjs': 'JavaScript (ESM)',
    '.cjs': 'JavaScript (CommonJS)',
    '.py': 'Python',
    '.java': 'Java',
    '.kt': 'Kotlin',
    '.kts': 'Kotlin Script',
    '.cpp': 'C++',
    '.cc': 'C++',
    '.cxx': 'C++',
    '.c': 'C',
    '.h': 'C/C++ Header',
    '.hpp': 'C++ Header',
    '.cs': 'C#',
    '.go': 'Go',
    '.rs': 'Rust',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.m': 'Objective-C',
    '.mm': 'Objective-C++',
    '.html': 'HTML',
    '.htm': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.sass': 'Sass',
    '.less': 'Less',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.xml': 'XML',
    '.toml': 'TOML',
    '.sh': 'Shell',
    '.bash': 'Bash',
    '.ps1': 'PowerShell',
    '.sql': 'SQL',
    '.graphql': 'GraphQL',
    '.md': 'Markdown'
  };

  const languages = new Set();

  for (const file of files) {
    const ext = path.extname(file);
    if (langMap[ext]) {
      languages.add(langMap[ext]);
    }
  }

  return Array.from(languages);
}

/**
 * Get file tree structure for visualization
 */
async function getFileTree(repoPath) {
  const files = await getCodeFiles(repoPath);

  const tree = {
    name: path.basename(repoPath),
    type: 'directory',
    path: '',
    children: []
  };

  for (const file of files) {
    const parts = file.split(path.sep);
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      let child = current.children.find(c => c.name === part);

      if (!child) {
        child = {
          name: part,
          type: isFile ? 'file' : 'directory',
          path: currentPath,
          children: isFile ? undefined : []
        };
        current.children.push(child);
      }

      if (!isFile) {
        current = child;
      }
    }
  }

  return tree;
}

module.exports = {
  scanRepository,
  getFileTree,
  getCodeFiles,
  scanRepositoryInput,
  getFileTreeInput,
  isGithubUrl,
  parseGithubUrl,
  CONFIG
};
