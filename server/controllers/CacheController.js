import { cacheFlush } from '../config/redis.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * Clear All System Cache
 * Matches Laravel artisan cache:clear & admin clear cache button
 */
export const clearAdminCache = async (req, res) => {
    try {
        const result = await cacheFlush();

        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: 'Cleared Application Cache',
                module: 'system',
                ipAddress: req.ip || '',
                details: `In-memory & Redis cache purged. Redis flushed: ${result.redisFlushed}`
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Application cache has been cleared successfully',
            result
        });
    } catch (error) {
        console.error('Error clearing cache:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to clear cache',
            error: error.message
        });
    }
};
