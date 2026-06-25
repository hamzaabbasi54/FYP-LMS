// ============================================
// File: backend/config/redis.js
// Redis Cache Client – connects to Redis Cloud
// or local Docker/WSL instance via REDIS_URL.
// Exports helper functions for cache operations.
// ============================================

import { createClient } from 'redis';

let redisClient = null;
let isConnected = false;
const memoryCache = new Map();

const now = () => Date.now();

const getMemoryValue = (key) => {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= now()) {
        memoryCache.delete(key);
        return null;
    }
    return entry.value;
};

const setMemoryValue = (key, value, ttl) => {
    memoryCache.set(key, {
        value,
        expiresAt: now() + (ttl * 1000)
    });
};

const pruneMemoryCache = () => {
    if (memoryCache.size < 1000) return;
    const current = now();
    for (const [key, entry] of memoryCache.entries()) {
        if (entry.expiresAt <= current) memoryCache.delete(key);
    }
};

/**
 * Initialize and connect the Redis client.
 * Call this once during server startup.
 */
export const connectRedis = async () => {
    const url = process.env.REDIS_URL;
    if (!url) {
        console.warn('⚠️  REDIS_URL not set – caching disabled, falling back to MySQL on every request.');
        return null;
    }

    try {
        redisClient = createClient({ url });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err.message);
            isConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('🔗 Redis connecting...');
        });

        redisClient.on('ready', () => {
            isConnected = true;
            console.log('✅ Redis connected and ready');
        });

        redisClient.on('end', () => {
            isConnected = false;
            console.log('🔌 Redis disconnected');
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.error('❌ Redis connection failed:', error.message);
        console.warn('⚠️  System will continue without cache (slower).');
        isConnected = false;
        return null;
    }
};

// ==================== Cache Helpers ====================

/**
 * Get a cached value by key. Returns parsed JSON or null on miss/error.
 */
export const cacheGet = async (key) => {
    if (!isConnected || !redisClient) return getMemoryValue(key);
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error(`Redis GET error [${key}]:`, err.message);
        return null;
    }
};

/**
 * Set a cached value with a TTL (Time-To-Live) in seconds.
 * @param {string} key   - The cache key
 * @param {*}      value - Any JSON-serializable value
 * @param {number} ttl   - Expiration in seconds (default: 3600 = 1 hour)
 */
export const cacheSet = async (key, value, ttl = 3600) => {
    if (!isConnected || !redisClient) {
        setMemoryValue(key, value, ttl);
        pruneMemoryCache();
        return;
    }
    try {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (err) {
        console.error(`Redis SET error [${key}]:`, err.message);
    }
};

/**
 * Delete a specific cache key (invalidation).
 */
export const cacheDel = async (key) => {
    if (!isConnected || !redisClient) {
        memoryCache.delete(key);
        return;
    }
    try {
        await redisClient.del(key);
    } catch (err) {
        console.error(`Redis DEL error [${key}]:`, err.message);
    }
};

/**
 * Delete all keys matching a pattern (e.g., "scope:courses:*").
 * Use sparingly — SCAN is safe for production but still iterative.
 */
export const cacheDelPattern = async (pattern) => {
    if (!isConnected || !redisClient) {
        const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
        for (const key of memoryCache.keys()) {
            if (regex.test(key)) memoryCache.delete(key);
        }
        return;
    }
    try {
        let cursor = '0';
        do {
            const result = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
            cursor = String(result.cursor);
            if (result.keys.length > 0) {
                await redisClient.del(result.keys);
            }
        } while (cursor !== '0');
    } catch (err) {
        console.error(`Redis DEL pattern error [${pattern}]:`, err.message);
    }
};

/**
 * Check if Redis is currently connected and healthy.
 */
export const isRedisConnected = () => isConnected;

export default {
    connectRedis,
    cacheGet,
    cacheSet,
    cacheDel,
    cacheDelPattern,
    isRedisConnected
};
