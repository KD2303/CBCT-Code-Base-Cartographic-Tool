/**
 * Integration tests for analysis routes
 */
const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Mock simple-git for git-related tests
jest.mock('simple-git', () => {
  return jest.fn(() => ({
    log: jest.fn().mockResolvedValue({ all: [] }),
    diff: jest.fn().mockResolvedValue(''),
    revparse: jest.fn().mockResolvedValue('main'),
  }));
});

// Create test app
const app = express();
app.use(express.json());

// Import routes
const analysisRoutes = require('../../routes/analysis');
app.use('/api/analysis', analysisRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Test error:', err.message);
  res.status(500).json({ error: err.message });
});

describe('Analysis Routes', () => {
  let testDir;

  beforeAll(async () => {
    // Create a temporary test directory with code files
    testDir = path.join(os.tmpdir(), `cbct-analysis-route-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    
    await fs.writeFile(
      path.join(testDir, 'src', 'index.js'),
      `import { helper } from './utils';\nconsole.log(helper());`
    );
    await fs.writeFile(
      path.join(testDir, 'src', 'utils.js'),
      `export const helper = () => 'hello';`
    );
  });

  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
  });

  describe('POST /api/analysis/dependencies', () => {
    it('should return 400 for missing path', async () => {
      const response = await request(app)
        .post('/api/analysis/dependencies')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 for non-existent path', async () => {
      const response = await request(app)
        .post('/api/analysis/dependencies')
        .send({ path: '/non/existent/path' });

      expect(response.status).toBe(400);
    });

    it('should analyze dependencies for valid path', async () => {
      const response = await request(app)
        .post('/api/analysis/dependencies')
        .send({ path: testDir });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('nodes');
      expect(response.body).toHaveProperty('edges');
      expect(Array.isArray(response.body.nodes)).toBe(true);
      expect(Array.isArray(response.body.edges)).toBe(true);
    });

    it('should accept language parameter', async () => {
      const response = await request(app)
        .post('/api/analysis/dependencies')
        .send({ path: testDir, language: 'javascript' });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/analysis/complexity', () => {
    it('should return 400 for missing path', async () => {
      const response = await request(app)
        .post('/api/analysis/complexity')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should analyze complexity for valid path', async () => {
      const response = await request(app)
        .post('/api/analysis/complexity')
        .send({ path: testDir });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/analysis/centrality', () => {
    it('should return 400 for missing path', async () => {
      const response = await request(app)
        .post('/api/analysis/centrality')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should analyze centrality for valid path', async () => {
      const response = await request(app)
        .post('/api/analysis/centrality')
        .send({ path: testDir });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/analysis/insights/:nodeId', () => {
    it('should return insights for valid node', async () => {
      // First get a valid node ID
      const depResponse = await request(app)
        .post('/api/analysis/dependencies')
        .send({ path: testDir });

      if (depResponse.body.nodes && depResponse.body.nodes.length > 0) {
        const nodeId = encodeURIComponent(depResponse.body.nodes[0].id);
        
        const response = await request(app)
          .get(`/api/analysis/insights/${nodeId}`)
          .query({ path: testDir });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('POST /api/analysis/expand', () => {
    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .post('/api/analysis/expand')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 400 when unitId is missing', async () => {
      const response = await request(app)
        .post('/api/analysis/expand')
        .send({ path: testDir });

      expect(response.status).toBe(400);
    });
  });
});
