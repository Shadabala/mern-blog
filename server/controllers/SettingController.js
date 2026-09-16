import Setting from '../models/Setting.js';
import ActivityLog from '../models/ActivityLog.js';

export const getSettings = async (req, res) => {
    try {
        const settings = await Setting.find().sort({ group: 1, key: 1 });
        
        // Convert to key-value object map
        const settingsMap = {};
        settings.forEach(item => {
            settingsMap[item.key] = item.value;
        });

        return res.status(200).json({
            success: true,
            settings,
            settingsMap
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching settings',
            error: error.message
        });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const { settings } = req.body; // Expect array of { key, value, group, description } or object map

        if (Array.isArray(settings)) {
            for (const item of settings) {
                await Setting.findOneAndUpdate(
                    { key: item.key },
                    { 
                        value: item.value, 
                        group: item.group || 'general',
                        description: item.description || '' 
                    },
                    { upsert: true, new: true }
                );
            }
        } else if (typeof settings === 'object' && settings !== null) {
            for (const [key, value] of Object.entries(settings)) {
                await Setting.findOneAndUpdate(
                    { key },
                    { value },
                    { upsert: true, new: true }
                );
            }
        }

        // Audit log action
        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: 'Updated Website Settings',
                module: 'settings',
                ipAddress: req.ip || '',
                details: 'Updated global site settings configuration'
            });
        }

        const updatedSettings = await Setting.find();
        return res.status(200).json({
            success: true,
            message: 'Website settings updated successfully',
            settings: updatedSettings
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating settings',
            error: error.message
        });
    }
};

export const getPublicSettings = async (req, res) => {
    try {
        const settings = await Setting.find({ group: { $in: ['general', 'site', 'social'] } });
        const publicMap = {};
        settings.forEach(item => {
            publicMap[item.key] = item.value;
        });

        return res.status(200).json({
            success: true,
            settings: publicMap
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching public settings',
            error: error.message
        });
    }
};
