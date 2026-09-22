import Redis from 'ioredis';
import mongoose from 'mongoose';
import Setting from '../models/Setting.js';

let redisClient = null;
let isRedisConnected = false;

// High-speed In-Memory Cache Fallback with TTL
const inMemoryCache = new Map();

// Hook functions to clear other in-memory stores on cache flush
const flushListeners = new Set();

/**
 * Register a callback to be called when cache is flushed
 */
export const registerFlushListener = (fn) => {
    if (typeof fn === 'function') {
        flushListeners.add(fn);
    }
};

/**
 * Clean and sanitize password to avoid literal 'null', 'undefined', etc.
 */
const cleanPassword = (p) => {
    if (!p) return undefined;
    const str = String(p).trim();
    if (!str || str === 'null' || str === 'undefined' || str === 'none' || str === '""' || str === "''") {
        return undefined;
    }
    return str;
};

/**
 * Get Redis client instance supporting standard Redis, Upstash, or Redis URL
 * @param {Object} [customConfig] - Optional override config (e.g. for connection testing)
 * @param {boolean} [forceNew=false] - If true, disconnects existing client and creates a fresh connection
 */
export const getRedisClient = async (customConfig = null, forceNew = false) => {
    if (!customConfig && !forceNew && redisClient && isRedisConnected) {
        return redisClient;
    }

    if (forceNew && redisClient && !customConfig) {
        try {
            redisClient.disconnect();
        } catch {
            // ignore
        }
        redisClient = null;
        isRedisConnected = false;
    }

    try {
        let redisUrl = null;
        let host = '127.0.0.1';
        let port = 6379;
        let password = undefined;

        if (customConfig) {
            redisUrl = customConfig.REDIS_URL || customConfig.url || null;
            host = customConfig.REDIS_HOST || customConfig.host || '127.0.0.1';
            port = Number(customConfig.REDIS_PORT || customConfig.port || 6379);
            password = cleanPassword(customConfig.REDIS_PASSWORD ?? customConfig.password);
        } else {
            // Fetch from database if connected
            if (mongoose.connection && mongoose.connection.readyState === 1) {
                try {
                    const [hostSetting, portSetting, passSetting, urlSetting] = await Promise.all([
                        Setting.findOne({ key: 'REDIS_HOST' }).lean(),
                        Setting.findOne({ key: 'REDIS_PORT' }).lean(),
                        Setting.findOne({ key: 'REDIS_PASSWORD' }).lean(),
                        Setting.findOne({ key: 'REDIS_URL' }).lean()
                    ]);

                    redisUrl = urlSetting?.value || process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || null;
                    host = hostSetting?.value || process.env.REDIS_HOST || '127.0.0.1';
                    port = Number(portSetting?.value || process.env.REDIS_PORT || 6379);
                    password = cleanPassword(passSetting?.value ?? process.env.REDIS_PASSWORD);
                } catch {
                    redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || null;
                    host = process.env.REDIS_HOST || '127.0.0.1';
                    port = Number(process.env.REDIS_PORT || 6379);
                    password = cleanPassword(process.env.REDIS_PASSWORD);
                }
            } else {
                redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || null;
                host = process.env.REDIS_HOST || '127.0.0.1';
                port = Number(process.env.REDIS_PORT || 6379);
                password = cleanPassword(process.env.REDIS_PASSWORD);
            }
        }

        const commonOptions = {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            connectTimeout: 4000,
            retryStrategy: (times) => {
                if (times > 2) return null;
                return Math.min(times * 150, 1000);
            }
        };

        let client;
        if (redisUrl && (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://'))) {
            client = new Redis(redisUrl, commonOptions);
        } else {
            const options = {
                ...commonOptions,
                host: String(host).trim(),
                port: Number(port) || 6379
            };
            if (password) {
                options.password = password;
            }
            client = new Redis(options);
        }

        client.on('connect', () => {
            if (!customConfig) {
                isRedisConnected = true;
            }
            console.log(`[Redis] Connected to ${host}:${port}`);
        });

        client.on('error', (err) => {
            if (!customConfig) {
                isRedisConnected = false;
            }
        });

        client.on('close', () => {
            if (!customConfig) {
                isRedisConnected = false;
            }
        });

        await client.connect();

        if (!customConfig) {
            isRedisConnected = true;
            redisClient = client;
            return redisClient;
        }

        return client;
    } catch (err) {
        if (!customConfig) {
            isRedisConnected = false;
            return null;
        }
        throw err;
    }
};

/**
 * Cache GET with Redis & In-Memory fallback
 */
export const cacheGet = async (key) => {
    try {
        let driver = process.env.CACHE_DRIVER || 'file';
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                const driverSetting = await Setting.findOne({ key: 'CACHE_DRIVER' }).lean();
                if (driverSetting?.value) driver = driverSetting.value;
            } catch {}
        }

        if (driver === 'redis') {
            const client = await getRedisClient();
            if (client && isRedisConnected) {
                const data = await client.get(key);
                if (data !== null && data !== undefined) {
                    try {
                        return JSON.parse(data);
                    } catch {
                        return data;
                    }
                }
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
    // Always store in-memory for instant fallback
    inMemoryCache.set(key, {
        value,
        expiresAt: Date.now() + (ttlSeconds * 1000)
    });

    try {
        let driver = process.env.CACHE_DRIVER || 'file';
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                const driverSetting = await Setting.findOne({ key: 'CACHE_DRIVER' }).lean();
                if (driverSetting?.value) driver = driverSetting.value;
            } catch {}
        }

        if (driver === 'redis') {
            const client = await getRedisClient();
            if (client && isRedisConnected) {
                const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
                await client.set(key, serialized, 'EX', ttlSeconds);
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
 * Cache Remember utility (fetches from Redis / in-memory or evaluates callback and caches)
 */
export const cacheRemember = async (key, ttlSeconds = 86400, callback) => {
    const cached = await cacheGet(key);
    if (cached !== null && cached !== undefined) {
        return cached;
    }

    const data = await callback();
    if (data !== undefined && data !== null) {
        await cacheSet(key, data, ttlSeconds);
    }
    return data;
};

/**
 * Clear All Cache (Flush Redis, In-Memory, and all registered cache listeners)
 */
export const cacheFlush = async () => {
    inMemoryCache.clear();
    let redisFlushed = false;

    // Trigger all registered flush listeners (Helper store, translation store, etc.)
    for (const listener of flushListeners) {
        try {
            listener();
        } catch {
            // ignore
        }
    }

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

/**
 * Check if Redis is currently connected
 */
export const isConnected = () => isRedisConnected;

export default {
    getRedisClient,
    cacheGet,
    cacheSet,
    cacheDel,
    cacheRemember,
    cacheFlush,
    isConnected,
    registerFlushListener
};
