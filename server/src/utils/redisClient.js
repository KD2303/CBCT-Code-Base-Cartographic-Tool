/**
 * Redis Client Manager
 * 
 * Provides a universal caching layer for CBCT
 * - System-agnostic (works with all consumers: AetherOS, CLI, etc.)
 * - Single source of cached intelligence
 * - Non-blocking: degrades gracefully if Redis unavailable
 */

const redis = require('redis');

let redisClient = null;
let isConnected = false;
let connectionAttempted = false; // Track if we've already tried to connect

/**
 * Initialize and return Redis client
 * Gracefully handles connection failures - app continues without cache if Redis unavailable
 * 
 * Supports:
 * - Local: redis://localhost:6379
 * - Upstash: rediss://default:password@host:port (TLS enabled)
 * - Custom: Via REDIS_URL environment variable
 * - Disabled: If no REDIS_URL set and not in development
 */
async function initRedis() {
  if (connectionAttempted) {
    return redisClient; // Already tried to connect, don't retry
  }
  
  connectionAttempted = true;

  try {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.warn('[Redis] REDIS_URL environment variable not set');
      console.warn('[Redis] Cache layer disabled - continuing without caching');
      console.warn('[Redis] To enable Redis, set REDIS_URL=rediss://default:password@host:port');
      return null;
    }

    const isUpstash = redisUrl.startsWith('rediss://');
    
    console.log('[Redis] Initializing client...');
    console.log('[Redis] URL format:', isUpstash ? 'rediss:// (TLS/Upstash)' : 'redis://');
    
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            console.error('[Redis] Max reconnection attempts reached. Giving up.');
            return new Error('Max reconnection attempts');
          }
          if (retries % 5 === 0) {
            console.log(`[Redis] Reconnect attempt ${retries}...`);
          }
          return Math.min(retries * 100, 3000);
        },
        connectTimeout: 15000,
        tls: isUpstash // Enable TLS for Upstash (rediss:// protocol)
      }
    });

    let errorLogged = false;
    redisClient.on('error', (err) => {
      if (!errorLogged) {
        console.warn(`[Redis] Connection failed: ${err.code || err.name} - ${err.message}`);
        console.warn('[Redis] Check that REDIS_URL is correct and the Redis server is accessible');
        errorLogged = true;
      }
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Ready for operations');
      isConnected = true;
    });

    // Try to connect with timeout
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );

    try {
      await Promise.race([connectPromise, timeoutPromise]);
      isConnected = true;
      console.log('[Redis] Client initialized and connected');
      return redisClient;
    } catch (timeoutErr) {
      console.warn('[Redis] Connection timeout - cache layer will be unavailable');
      console.warn('[Redis] Continuing without caching - analysis will run without cache optimization');
      return null;
    }
  } catch (error) {
    console.warn(`[Redis] Failed to initialize: ${error.message}`);
    console.warn('[Redis] Cache layer disabled - app will continue without caching');
    return null;
  }
}

/**
 * Get Redis client instance
 */
function getRedisClient() {
  return redisClient;
}

/**
 * Check if Redis is connected and available
 */
function isRedisConnected() {
  return isConnected && redisClient !== null;
}

/**
 * Gracefully disconnect Redis
 */
async function disconnectRedis() {
  if (redisClient && isConnected) {
    try {
      await redisClient.quit();
      console.log('[Redis] Disconnected');
      isConnected = false;
    } catch (error) {
      console.error('[Redis] Error during disconnect:', error.message);
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectRedis();
  process.exit(0);
});

module.exports = {
  initRedis,
  getRedisClient,
  isRedisConnected,
  disconnectRedis
};
