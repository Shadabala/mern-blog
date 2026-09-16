import Setting from '../models/Setting.js';
import { getRedisClient } from '../config/redis.js';

const DEFAULT_SETTINGS = {
    FILESYSTEM_DRIVER: 'local',
    AWS_ACCESS_KEY_ID: '',
    AWS_SECRET_ACCESS_KEY: '',
    AWS_DEFAULT_REGION: 'us-east-1',
    AWS_BUCKET: '',
    AWS_URL: '',
    BACKBLAZE_ACCESS_KEY_ID: '',
    BACKBLAZE_SECRET_ACCESS_KEY: '',
    BACKBLAZE_DEFAULT_REGION: 'us-east-005',
    BACKBLAZE_BUCKET: '',
    BACKBLAZE_ENDPOINT: '',
    BACKBLAZE_URL: '',
    CACHE_DRIVER: 'file',
    SESSION_DRIVER: 'file',
    REDIS_HOST: '127.0.0.1',
    REDIS_PASSWORD: '',
    REDIS_PORT: '6379'
};

/**
 * Get all File System and Redis Settings
 */
export const getFileSystemSettings = async (req, res) => {
    try {
        const settingsFromDb = await Setting.find({
            key: { $in: Object.keys(DEFAULT_SETTINGS) }
        });

        const settingsMap = { ...DEFAULT_SETTINGS };

        settingsFromDb.forEach(item => {
            if (item.key && item.value !== undefined) {
                settingsMap[item.key] = item.value;
            }
        });

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
 * Update multiple File System / Redis Settings
 */
export const updateFileSystemSettings = async (req, res) => {
    try {
        const payload = req.body;
        const updates = [];

        for (const [key, value] of Object.entries(payload)) {
            if (key in DEFAULT_SETTINGS) {
                updates.push(
                    Setting.findOneAndUpdate(
                        { key },
                        { $set: { key, value: String(value ?? '').trim(), group: 'filesystem' } },
                        { upsert: true, new: true }
                    )
                );
            }
        }

        await Promise.all(updates);

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
 * Update File System Driver Activation (Local vs S3 vs Backblaze)
 * Matches Laravel business_settings.update.activation
 */
export const updateFileSystemActivation = async (req, res) => {
    try {
        const { driver, type, value } = req.body;
        const selectedDriver = driver || value || 'local';

        await Setting.findOneAndUpdate(
            { key: 'FILESYSTEM_DRIVER' },
            { $set: { key: 'FILESYSTEM_DRIVER', value: selectedDriver, group: 'filesystem' } },
            { upsert: true, new: true }
        );

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
 */
export const testRedisConnection = async (req, res) => {
    try {
        const client = await getRedisClient();
        if (!client) {
            return res.status(400).json({
                success: false,
                message: 'Failed to initialize Redis client. Please check host and port.'
            });
        }

        const pong = await client.ping();
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
    }
};
