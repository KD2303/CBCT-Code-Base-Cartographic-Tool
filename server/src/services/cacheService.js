/**
 * Cache Service
 * 
 * Abstraction layer for all caching operations
 * - Provides clean API for storing/retrieving cached analysis
 * - Handles JSON serialization/deserialization
 * - Gracefully degrades if Redis unavailable
 * - Consistent key naming across CBCT
 */

import { getRedisClient, isRedisConnected } from '../utils/redisClient.js';

/**
 * Standard cache key format: repo:{repoPath}:{type}
 */
function getCacheKey(repoPath, type = 'analysis') {
  return `repo:${encodeURIComponent(repoPath)}:${type}`;
}

/**
 * Get cached analysis data
 * 
 * @param {string} repoPath - Repository path
 * @param {string} type - Cache type (analysis, complexity, centrality, etc)
 * @returns {Promise<object|null>} - Cached data or null if not found/error
 */
export async function getCache(repoPath, type = 'analysis') {
  if (!isRedisConnected()) {
    return null;
  }

  try {
    const client = getRedisClient();
    if (!client) return null;

    const key = getCacheKey(repoPath, type);
    const data = await client.get(key);

    if (data) {
      console.log(`[CACHE HIT] ${type} for ${repoPath}`);
      return JSON.parse(data);
    }

    console.log(`[CACHE MISS] ${type} for ${repoPath}`);
    return null;
  } catch (error) {
    console.warn(`[CACHE] Error retrieving ${type} for ${repoPath}:`, error.message);
    return null;
  }
}

/**
 * Store analysis data in cache
 * 
 * @param {string} repoPath - Repository path
 * @param {object} value - Data to cache
 * @param {string} type - Cache type (analysis, complexity, centrality, etc)
 * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
 * @returns {Promise<boolean>} - Success status
 */
export async function setCache(repoPath, value, type = 'analysis', ttl = 3600) {
  if (!isRedisConnected()) {
    return false;
  }

  try {
    const client = getRedisClient();
    if (!client) return false;

    const key = getCacheKey(repoPath, type);
    const serialized = JSON.stringify(value);

    await client.setEx(key, ttl, serialized);
    console.log(`[CACHE STORE] ${type} for ${repoPath} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.warn(`[CACHE] Error storing ${type} for ${repoPath}:`, error.message);
    return false;
  }
}

/**
 * Invalidate cache entry
 * 
 * @param {string} repoPath - Repository path
 * @param {string} type - Cache type (null to invalidate all types)
 * @returns {Promise<boolean>} - Success status
 */
export async function invalidateCache(repoPath, type = null) {
  if (!isRedisConnected()) {
    return false;
  }

  try {
    const client = getRedisClient();
    if (!client) return false;

    if (type) {
      const key = getCacheKey(repoPath, type);
      await client.del(key);
      console.log(`[CACHE INVALIDATE] ${type} for ${repoPath}`);
    } else {
      // Invalidate all types for this repo
      const patterns = [
        getCacheKey(repoPath, 'analysis'),
        getCacheKey(repoPath, 'complexity'),
        getCacheKey(repoPath, 'centrality'),
        getCacheKey(repoPath, 'metadata'),
        getCacheKey(repoPath, 'git')
      ];

      for (const key of patterns) {
        await client.del(key);
      }
      console.log(`[CACHE INVALIDATE] All types for ${repoPath}`);
    }
    return true;
  } catch (error) {
    console.warn(`[CACHE] Error invalidating cache for ${repoPath}:`, error.message);
    return false;
  }
}

/**
 * Check if data exists in cache without retrieving it
 * 
 * @param {string} repoPath - Repository path
 * @param {string} type - Cache type
 * @returns {Promise<boolean>} - Whether data exists in cache
 */
export async function cacheExists(repoPath, type = 'analysis') {
  if (!isRedisConnected()) {
    return false;
  }

  try {
    const client = getRedisClient();
    if (!client) return false;

    const key = getCacheKey(repoPath, type);
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.warn(`[CACHE] Error checking existence for ${repoPath}:`, error.message);
    return false;
  }
}

/**
 * Get TTL (Time To Live) for cached entry
 * 
 * @param {string} repoPath - Repository path
 * @param {string} type - Cache type
 * @returns {Promise<number>} - TTL in seconds (-1 if no expiry, -2 if not exists)
 */
export async function getCacheTTL(repoPath, type = 'analysis') {
  if (!isRedisConnected()) {
    return -2;
  }

  try {
    const client = getRedisClient();
    if (!client) return -2;

    const key = getCacheKey(repoPath, type);
    const ttl = await client.ttl(key);
    return ttl;
  } catch (error) {
    console.warn(`[CACHE] Error getting TTL for ${repoPath}:`, error.message);
    return -2;
  }
}

/**
 * Get cache statistics
 * 
 * @returns {Promise<object>} - Cache stats (info from Redis)
 */
export async function getCacheStats() {
  if (!isRedisConnected()) {
    return { status: 'disconnected' };
  }

  try {
    const client = getRedisClient();
    if (!client) return { status: 'unavailable' };

    const info = await client.info('stats');
    return { status: 'connected', info };
  } catch (error) {
    console.warn('[CACHE] Error getting stats:', error.message);
    return { status: 'error', message: error.message };
  }
}

/**
 * Health check
 * 
 * @returns {Promise<boolean>} - Whether cache is healthy
 */
export async function healthCheck() {
  if (!isRedisConnected()) {
    return false;
  }

  try {
    const client = getRedisClient();
    if (!client) return false;

    await client.ping();
    return true;
  } catch (error) {
    console.warn('[CACHE] Health check failed:', error.message);
    return false;
  }
}
