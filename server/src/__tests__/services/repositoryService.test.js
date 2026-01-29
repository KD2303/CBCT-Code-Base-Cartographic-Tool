/**
 * Unit tests for repositoryService
 */
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

const repositoryService = require('../../services/repositoryService');

describe('repositoryService', () => {
  let testDir;

  beforeAll(async () => {
    // Create a temporary test directory structure
    testDir = path.join(os.tmpdir(), `cbct-repo-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true });
    
    // Create test files with various extensions
    await fs.writeFile(path.join(testDir, 'src', 'index.js'), 'console.log("hello");');
    await fs.writeFile(path.join(testDir, 'src', 'utils.ts'), 'export const x = 1;');
    await fs.writeFile(path.join(testDir, 'src', 'styles.css'), '.test { color: red; }');
    await fs.writeFile(path.join(testDir, 'README.md'), '# Test');
    await fs.writeFile(path.join(testDir, 'package.json'), '{"name": "test"}');
    
    // File in node_modules (should be ignored)
    await fs.writeFile(path.join(testDir, 'node_modules', 'pkg.js'), 'module.exports = {};');
  });

  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
  });

  describe('scanRepository', () => {
    it('should scan a valid directory', async () => {
      const result = await repositoryService.scanRepository(testDir);
      
      expect(result).toBeDefined();
      expect(result.path).toBe(testDir);
      expect(result.name).toBeDefined();
      expect(typeof result.totalFiles).toBe('number');
      expect(result.scannedAt).toBeDefined();
    });

    it('should throw error for non-existent path', async () => {
      await expect(repositoryService.scanRepository('/non/existent/path'))
        .rejects.toThrow('does not exist');
    });

    it('should throw error for file path', async () => {
      const filePath = path.join(testDir, 'package.json');
      await expect(repositoryService.scanRepository(filePath))
        .rejects.toThrow('not a directory');
    });

    it('should detect languages correctly', async () => {
      const result = await repositoryService.scanRepository(testDir);
      
      expect(result.languages).toBeDefined();
      expect(Array.isArray(result.languages)).toBe(true);
    });
  });

  describe('getCodeFiles', () => {
    it('should return array of code files', async () => {
      const files = await repositoryService.getCodeFiles(testDir);
      
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should ignore node_modules', async () => {
      const files = await repositoryService.getCodeFiles(testDir);
      
      const hasNodeModules = files.some(f => f.includes('node_modules'));
      expect(hasNodeModules).toBe(false);
    });

    it('should include valid code extensions', async () => {
      const files = await repositoryService.getCodeFiles(testDir);
      
      const hasJsFile = files.some(f => f.endsWith('.js'));
      const hasTsFile = files.some(f => f.endsWith('.ts'));
      
      expect(hasJsFile).toBe(true);
      expect(hasTsFile).toBe(true);
    });
  });

  describe('isGithubUrl', () => {
    it('should identify valid GitHub URLs', () => {
      expect(repositoryService.isGithubUrl('https://github.com/user/repo')).toBe(true);
      expect(repositoryService.isGithubUrl('http://github.com/user/repo')).toBe(true);
      expect(repositoryService.isGithubUrl('https://github.com/user/repo.git')).toBe(true);
    });

    it('should reject non-GitHub URLs', () => {
      expect(repositoryService.isGithubUrl('https://gitlab.com/user/repo')).toBe(false);
      expect(repositoryService.isGithubUrl('/local/path')).toBe(false);
      expect(repositoryService.isGithubUrl('C:\\Users\\test')).toBe(false);
      expect(repositoryService.isGithubUrl(null)).toBe(false);
      expect(repositoryService.isGithubUrl(undefined)).toBe(false);
    });
  });

  describe('parseGithubUrl', () => {
    it('should parse basic GitHub URL', () => {
      const result = repositoryService.parseGithubUrl('https://github.com/facebook/react');
      
      expect(result.owner).toBe('facebook');
      expect(result.repo).toBe('react');
    });

    it('should parse GitHub URL with .git extension', () => {
      const result = repositoryService.parseGithubUrl('https://github.com/facebook/react.git');
      
      expect(result.owner).toBe('facebook');
      expect(result.repo).toBe('react');
    });

    it('should parse GitHub URL with branch', () => {
      const result = repositoryService.parseGithubUrl('https://github.com/facebook/react/tree/main');
      
      expect(result.owner).toBe('facebook');
      expect(result.repo).toBe('react');
      expect(result.branch).toBe('main');
    });

    it('should parse GitHub URL with subdirectory', () => {
      const result = repositoryService.parseGithubUrl('https://github.com/facebook/react/tree/main/packages/react');
      
      expect(result.owner).toBe('facebook');
      expect(result.repo).toBe('react');
      expect(result.subdir).toContain('packages/react');
    });
  });
});

describe('Edge cases', () => {
  it('should handle special characters in path', async () => {
    const specialDir = path.join(os.tmpdir(), `cbct-special-${Date.now()}-test`);
    await fs.mkdir(specialDir, { recursive: true });
    await fs.writeFile(path.join(specialDir, 'test.js'), 'console.log("test");');
    
    const files = await repositoryService.getCodeFiles(specialDir);
    expect(Array.isArray(files)).toBe(true);
    
    await fs.rm(specialDir, { recursive: true, force: true });
  });
});
