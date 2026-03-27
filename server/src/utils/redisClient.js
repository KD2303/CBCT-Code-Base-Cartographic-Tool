/**
 * Redis Client Manager
 * 
 * Provides a universal caching layer for CBCT
 * - System-agnostic (works with all consumers: AetherOS, CLI, etc.)
 * - Single source of cached intelligence
 * - Non-blocking: degrades gracefully if Redis unavailable
 */

import redis from 'redis';

let redisClient = null;
let isConnected = false;

/**
 * Initialize and return Redis client
 * Gracefully handles connection failures
 * 
 * Supports:
 * - Local: redis://localhost:6379
 * - Upstash: rediss://default:password@host:port (TLS enabled)
 * - Custom: Via REDIS_URL environment variable
 */
export async function initRedis() {
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const isUpstash = redisUrl.startsWith('rediss://');
    
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        connectTimeout: 10000,
        tls: isUpstash // Enable TLS for Upstash (rediss:// protocol)
      }
    });

    redisClient.on('error', (err) => {
      console.warn('[Redis] Connection error:', err.message);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Ready for operations');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    await redisClient.connect();
    isConnected = true;
    console.log('[Redis] Client initialized');

    return redisClient;
  } catch (error) {
    console.warn('[Redis] Failed to initialize:', error.message);
    console.warn('[Redis] Cache layer disabled - will continue without caching');
    isConnected = false;
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient() {
  return redisClient;
}

/**
 * Check if Redis is connected and available
 */
export function isRedisConnected() {
  return isConnected && redisClient !== null;
}

/**
 * Gracefully disconnect Redis
 */
export async function disconnectRedis() {
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
