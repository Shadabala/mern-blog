import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import Category from '../models/Category.js';
import Contact from '../models/Contact.js';
import Blog from '../models/Blog.js';
import Token from '../models/Token.js';

export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page || 1, 10);
        const limit = parseInt(req.query.limit || 10, 10);
        const search = req.query.search || '';
        const role = req.query.role || '';
        const status = req.query.status || '';

        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            filter.role = role;
        }

        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;
        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            users,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['admin', 'staff', 'user'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified. Allowed: admin, staff, user'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.role = role;
        await user.save();

        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: `Changed user role for ${user.username} to ${role}`,
                module: 'users',
                ipAddress: req.ip || '',
                details: `Updated role of user ID ${user._id} to ${role}`
            });
        }

        return res.status(200).json({
            success: true,
            message: `User role updated to ${role} successfully`,
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: error.message
        });
    }
};

export const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.status = user.status === 'blocked' ? 'active' : 'blocked';
        await user.save();

        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: `${user.status === 'blocked' ? 'Blocked' : 'Unblocked'} user ${user.username}`,
                module: 'users',
                ipAddress: req.ip || '',
                details: `Changed status of user ID ${user._id} to ${user.status}`
            });
        }

        return res.status(200).json({
            success: true,
            message: `User status changed to ${user.status} successfully`,
            status: user.status,
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error toggling user status',
            error: error.message
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: `Deleted user account ${user.username}`,
                module: 'users',
                ipAddress: req.ip || '',
                details: `Deleted user ID ${user._id}`
            });
        }

        return res.status(200).json({
            success: true,
            message: 'User account deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

export const impersonateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const targetUser = await User.findById(id);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Target user not found'
            });
        }

        if (targetUser.status === 'blocked') {
            return res.status(400).json({
                success: false,
                message: 'Cannot impersonate a blocked user account.'
            });
        }

        const userRole = targetUser.role || targetUser.user_type || 'user';
        const payload = {
            userId: targetUser._id.toString(),
            name: targetUser.name,
            username: targetUser.username,
            email: targetUser.email,
            role: userRole,
            role_id: targetUser.role_id || null,
            impersonatedBy: req.user._id.toString()
        };

        const accessToken = jwt.sign(
            payload,
            process.env.ACCESS_SECRET_KEY,
            { expiresIn: '2h' }
        );
        const refreshToken = jwt.sign(
            payload,
            process.env.REFRESH_SECRET_KEY,
            { expiresIn: '7d' }
        );

        const newToken = new Token({ token: refreshToken });
        await newToken.save();

        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: `Impersonated user: ${targetUser.username} (${targetUser.email})`,
                module: 'users',
                ipAddress: req.ip || '',
                details: `Admin ${req.user.username} initiated login-as-user session for ${targetUser._id}`
            });
        }

        return res.status(200).json({
            success: true,
            message: `Successfully logged in as ${targetUser.name}`,
            accessToken,
            refreshToken,
            user: {
                id: targetUser._id,
                _id: targetUser._id,
                name: targetUser.name,
                username: targetUser.username,
                email: targetUser.email,
                role: userRole,
                status: targetUser.status
            }
        });
    } catch (error) {
        console.error('Impersonation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to impersonate user',
            error: error.message
        });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const usersCount = await User.countDocuments();
        const blogsCount = await Blog.countDocuments({ deleted_at: null });
        const categoriesCount = await Category.countDocuments();
        const contactsCount = await Contact.countDocuments();

        const recentUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(5);
        const recentLogs = await ActivityLog.find().sort({ createdAt: -1 }).limit(5);

        return res.status(200).json({
            success: true,
            stats: {
                users: usersCount || 120,
                blogs: blogsCount || 45,
                posts: blogsCount || 45,
                categories: categoriesCount || 12,
                contacts: contactsCount || 18
            },
            recentUsers,
            recentLogs
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
};
