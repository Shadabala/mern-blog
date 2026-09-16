import ActivityLog from '../models/ActivityLog.js';

export const getActivityLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page || 1, 10);
        const limit = parseInt(req.query.limit || 20, 10);
        const skip = (page - 1) * limit;

        const total = await ActivityLog.countDocuments();
        const logs = await ActivityLog.find()
            .populate('user', 'name username email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            logs,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching activity logs',
            error: error.message
        });
    }
};
