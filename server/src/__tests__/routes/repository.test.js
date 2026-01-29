/**
 * Integration tests for repository routes
 */
const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Create test app
const app = express();
app.use(express.json());

// Import routes
const repositoryRoutes = require('../../routes/repository');
app.use('/api/repository', repositoryRoutes);

describe('Repository Routes', () => {
  let testDir;

  beforeAll(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `cbct-route-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'src', 'index.js'), 'console.log("test");');
    await fs.writeFile(path.join(testDir, 'package.json'), '{"name": "test"}');
  });

  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
  });

  describe('POST /api/repository/scan', () => {
    it('should return 400 for missing path', async () => {
      const response = await request(app)
        .post('/api/repository/scan')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 500 for non-existent path', async () => {
      const response = await request(app)
        .post('/api/repository/scan')
        .send({ path: '/non/existent/path' });

      expect(response.status).toBe(500);
    });

    it('should scan a valid local path', async () => {
      const response = await request(app)
        .post('/api/repository/scan')
        .send({ path: testDir });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('path');
      expect(response.body).toHaveProperty('totalFiles');
    });

    it('should handle paths with quotes', async () => {
      const response = await request(app)
        .post('/api/repository/scan')
        .send({ path: `"${testDir}"` });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/repository/tree', () => {
    it('should return 400 for missing path', async () => {
      const response = await request(app)
        .get('/api/repository/tree');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return file tree for valid path', async () => {
      const response = await request(app)
        .get('/api/repository/tree')
        .query({ path: testDir });

      expect(response.status).toBe(200);
    });
  });
});
