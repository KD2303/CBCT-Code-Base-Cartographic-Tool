const express = require('express');
const cors = require('cors');
const repositoryRoutes = require('./routes/repository');
const analysisRoutes = require('./routes/analysis');
const graphRoutes = require('./routes/graph');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logger for debugging proxy/reset issues
app.use((req, res, next) => {
  try {
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - body:`, req.body ? JSON.stringify(req.body).slice(0, 200) : '{}');
  } catch (e) {
    console.log('[HTTP] request logger error', e && e.message);
  }
  next();
});

// Error handling middleware to catch async errors not handled in routes
app.use((err, req, res, next) => {
  console.error('[Express] Unhandled error middleware caught:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err?.message || 'Internal Server Error' });
});

// Routes
app.use('/api/repository', repositoryRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/graph', graphRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CBCT Server is running' });
});

const server = app.listen(PORT, () => {
  console.log(`🗺️  CBCT Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});

// Increase server timeouts significantly for large repository analysis
try {
  server.keepAliveTimeout = 300 * 1000; // 5 minutes
  server.headersTimeout = 305 * 1000;   // slightly more than keepAliveTimeout
  server.timeout = 300 * 1000;          // request timeout
  console.log('[Server] Timeouts configured for large repos: keepAlive=300s, headers=305s, request=300s');
} catch (e) {
  console.warn('[Server] Unable to set timeout values:', e && e.message);
}

// Global handlers to capture unexpected crashes and promise rejections
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err && err.stack ? err.stack : err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason && reason.stack ? reason.stack : reason);
});
