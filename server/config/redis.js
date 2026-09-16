import Redis from 'ioredis';
import Setting from '../models/Setting.js';

let redisClient = null;
let isRedisConnected = false;

// High-speed In-Memory Cache Fallback with TTL
const inMemoryCache = new Map();

/**
 * Get Redis client instance supporting standard Redis, Upstash, or Redis URL
 */
export const getRedisClient = async () => {
    if (redisClient && isRedisConnected) {
        return redisClient;
    }

    try {
        const hostSetting = await Setting.findOne({ key: 'REDIS_HOST' });
        const portSetting = await Setting.findOne({ key: 'REDIS_PORT' });
        const passSetting = await Setting.findOne({ key: 'REDIS_PASSWORD' });
        const urlSetting = await Setting.findOne({ key: 'REDIS_URL' });

        const redisUrl = urlSetting?.value || process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || null;

        if (redisUrl && (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://'))) {
            redisClient = new Redis(redisUrl, {
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false
            });
        } else {
            const host = hostSetting?.value || process.env.REDIS_HOST || '127.0.0.1';
            const port = Number(portSetting?.value || process.env.REDIS_PORT || 6379);
            const password = passSetting?.value || process.env.REDIS_PASSWORD || undefined;

            const options = {
                host,
                port,
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false
            };

            if (password && password.trim() !== '') {
                options.password = password.trim();
            }

            redisClient = new Redis(options);
        }

        redisClient.on('connect', () => {
            isRedisConnected = true;
            console.log('[Redis] Connected successfully');
        });

        redisClient.on('error', () => {
            isRedisConnected = false;
        });

        await redisClient.connect().catch(() => {});
        return redisClient;
    } catch {
        isRedisConnected = false;
        return null;
    }
};

/**
 * Cache GET with Redis & In-Memory fallback
 */
export const cacheGet = async (key) => {
    try {
        const driverSetting = await Setting.findOne({ key: 'CACHE_DRIVER' });
        const driver = driverSetting?.value || process.env.CACHE_DRIVER || 'redis';

        if (driver === 'redis') {
            const client = await getRedisClient();
            if (client && isRedisConnected) {
                const data = await client.get(key);
                if (data) return JSON.parse(data);
            }
        }
    } catch {
        // Fall back to in-memory
    }

    // In-memory lookup
    if (inMemoryCache.has(key)) {
        const item = inMemoryCache.get(key);
        if (item.expiresAt > Date.now()) {
            return item.value;
        }
        inMemoryCache.delete(key);
    }
    return null;
};

/**
 * Cache SET with Redis & In-Memory fallback
 */
export const cacheSet = async (key, value, ttlSeconds = 3600) => {
    // In-memory set
    inMemoryCache.set(key, {
        value,
        expiresAt: Date.now() + (ttlSeconds * 1000)
    });

    try {
        const driverSetting = await Setting.findOne({ key: 'CACHE_DRIVER' });
        const driver = driverSetting?.value || process.env.CACHE_DRIVER || 'redis';

        if (driver === 'redis') {
            const client = await getRedisClient();
            if (client && isRedisConnected) {
                await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
                return true;
            }
        }
    } catch {
        return false;
    }
    return true;
};

/**
 * Cache DEL single key
 */
export const cacheDel = async (key) => {
    inMemoryCache.delete(key);
    try {
        const client = await getRedisClient();
        if (client && isRedisConnected) {
            await client.del(key);
            return true;
        }
    } catch {
        return false;
    }
    return true;
};

/**
 * Clear All Cache (Flush Redis & In-Memory)
 */
export const cacheFlush = async () => {
    inMemoryCache.clear();
    let redisFlushed = false;
    try {
        const client = await getRedisClient();
        if (client && isRedisConnected) {
            await client.flushdb();
            redisFlushed = true;
        }
    } catch {
        redisFlushed = false;
    }
    return { inMemoryCleared: true, redisFlushed };
};

export default {
    getRedisClient,
    cacheGet,
    cacheSet,
    cacheDel,
    cacheFlush
};
