import mongoose from 'mongoose';
import Setting from '../models/Setting.js';
import { getRedisClient } from '../config/redis.js';
import { readEnvFile, overWriteEnvFile } from '../utils/envHelper.js';

const DEFAULT_SETTINGS = {
    FILESYSTEM_DRIVER: 'local',
    AWS_ACCESS_KEY_ID: '',
    AWS_SECRET_ACCESS_KEY: '',
    AWS_DEFAULT_REGION: 'us-east-1',
    AWS_BUCKET: '',
    AWS_URL: '',
    CACHE_DRIVER: 'file',
    SESSION_DRIVER: 'file',
    REDIS_HOST: '127.0.0.1',
    REDIS_PASSWORD: '',
    REDIS_PORT: '6379'
};

/**
 * Get all File System and Redis Settings directly from .env (with fallback)
 */
export const getFileSystemSettings = async (req, res) => {
    try {
        const envMap = readEnvFile();
        const rawDriver = (envMap.FILESYSTEM_DRIVER || process.env.FILESYSTEM_DRIVER || 'local').toLowerCase().trim();
        const driver = (rawDriver === 's3' || rawDriver === 'aws') ? 's3' : 'local';

        const settingsMap = {
            FILESYSTEM_DRIVER: driver,
            AWS_ACCESS_KEY_ID: envMap.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
            AWS_SECRET_ACCESS_KEY: envMap.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
            AWS_DEFAULT_REGION: envMap.AWS_DEFAULT_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
            AWS_BUCKET: envMap.AWS_BUCKET || process.env.AWS_BUCKET || '',
            AWS_URL: envMap.AWS_URL || process.env.AWS_URL || '',
            CACHE_DRIVER: envMap.CACHE_DRIVER || process.env.CACHE_DRIVER || 'file',
            SESSION_DRIVER: envMap.SESSION_DRIVER || process.env.SESSION_DRIVER || 'file',
            REDIS_HOST: envMap.REDIS_HOST || process.env.REDIS_HOST || '127.0.0.1',
            REDIS_PASSWORD: envMap.REDIS_PASSWORD ?? process.env.REDIS_PASSWORD ?? '',
            REDIS_PORT: envMap.REDIS_PORT || process.env.REDIS_PORT || '6379'
        };

        return res.status(200).json({
            success: true,
            settings: settingsMap
        });
    } catch (error) {
        console.error('Error fetching file system settings:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch settings'
        });
    }
};

/**
 * Update multiple File System / Redis Settings directly into .env
 */
export const updateFileSystemSettings = async (req, res) => {
    try {
        const payload = req.body;

        for (const [key, value] of Object.entries(payload)) {
            if (key in DEFAULT_SETTINGS || key.startsWith('AWS_') || key.startsWith('REDIS_') || key.endsWith('_DRIVER')) {
                overWriteEnvFile(key, value);

                // Keep Setting model in sync for backward compatibility if DB is connected
                if (mongoose.connection && mongoose.connection.readyState === 1) {
                    await Setting.findOneAndUpdate(
                        { key },
                        { $set: { key, value: String(value ?? '').trim(), group: 'filesystem' } },
                        { upsert: true, returnDocument: 'after' }
                    ).catch(() => {});
                }
            }
        }

        // If Redis or Cache settings changed, re-initialize Redis client
        if (payload.REDIS_HOST !== undefined || payload.REDIS_PORT !== undefined || payload.REDIS_PASSWORD !== undefined || payload.CACHE_DRIVER !== undefined) {
            try {
                await getRedisClient(null, true);
            } catch {
                // Ignore reconnect error in background
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating file system settings:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update settings'
        });
    }
};

/**
 * Update File System Driver Activation (Local vs S3) directly into .env
 */
export const updateFileSystemActivation = async (req, res) => {
    try {
        const { driver, type, value } = req.body;
        const selected = driver || value || 'local';
        const selectedDriver = (selected === 'aws' || selected === 's3') ? 's3' : 'local';

        overWriteEnvFile('FILESYSTEM_DRIVER', selectedDriver);

        if (mongoose.connection && mongoose.connection.readyState === 1) {
            await Setting.findOneAndUpdate(
                { key: 'FILESYSTEM_DRIVER' },
                { $set: { key: 'FILESYSTEM_DRIVER', value: selectedDriver, group: 'filesystem' } },
                { upsert: true, returnDocument: 'after' }
            ).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: 'File System activation updated successfully',
            driver: selectedDriver
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update activation'
        });
    }
};

/**
 * Test Redis Connection
 * Supports optional host/port/password payload for live verification
 */
export const testRedisConnection = async (req, res) => {
    let testClient = null;
    try {
        const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_URL } = req.body || {};
        const customConfig = (REDIS_HOST || REDIS_PORT || REDIS_PASSWORD || REDIS_URL) ? {
            REDIS_HOST,
            REDIS_PORT,
            REDIS_PASSWORD,
            REDIS_URL
        } : null;

        testClient = await getRedisClient(customConfig, true);
        if (!testClient) {
            return res.status(400).json({
                success: false,
                message: 'Failed to initialize Redis client. Please ensure Redis server is running.'
            });
        }

        const pong = await testClient.ping();
        if (pong === 'PONG') {
            return res.status(200).json({
                success: true,
                message: 'Redis connected successfully (PONG response received)'
            });
        }

        return res.status(400).json({
            success: false,
            message: `Unexpected response from Redis: ${pong}`
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: `Redis connection failed: ${error.message}`
        });
    } finally {
        if (testClient && req.body && (req.body.REDIS_HOST || req.body.REDIS_PORT)) {
            try {
                testClient.disconnect();
            } catch {
                // ignore
            }
        }
    }
};

export default {
    getFileSystemSettings,
    updateFileSystemSettings,
    updateFileSystemActivation,
    testRedisConnection
};
