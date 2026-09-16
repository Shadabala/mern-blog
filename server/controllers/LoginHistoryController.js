import LoginHistory from '../models/LoginHistory.js';

export const getLoginHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page || 1, 10);
        const limit = parseInt(req.query.limit || 15, 10);
        const skip = (page - 1) * limit;

        const totalLogs = await LoginHistory.countDocuments();
        const logs = await LoginHistory.find()
            .populate('user', 'name username email role')
            .sort({ loginAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            logs,
            pagination: {
                page,
                limit,
                totalLogs,
                totalPages: Math.ceil(totalLogs / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching login history', error: error.message });
    }
};
