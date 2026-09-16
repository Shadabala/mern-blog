import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Role from '../models/Role.js';
import ActivityLog from '../models/ActivityLog.js';

export const getAllStaff = async (req, res) => {
    try {
        const staffMembers = await User.find({ role: 'staff' })
            .populate('role_id')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            staff: staffMembers
        });
    } catch (error) {
        console.error('Error fetching staff members:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch staff members',
            error: error.message
        });
    }
};

export const createStaff = async (req, res) => {
    try {
        const { name, email, password, phone = '', role_id, status = 'active' } = req.body;

        const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email address is already in use'
            });
        }

        const role = await Role.findById(role_id);
        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Selected role does not exist'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const username = email.split('@')[0] + '-' + Math.floor(1000 + Math.random() * 9000);

        const staff = new User({
            name: name.trim(),
            username,
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            phone: phone ? phone.trim() : '',
            role: 'staff',
            role_id: role._id,
            status: status || 'active'
        });

        await staff.save();

        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: `Added new staff: ${staff.name} (${role.name})`,
                module: 'staff',
                ipAddress: req.ip || '',
                details: `Email: ${staff.email}, Phone: ${staff.phone}`
            });
        }

        const populatedStaff = await User.findById(staff._id).populate('role_id');

        return res.status(201).json({
            success: true,
            message: 'Staff member has been created successfully',
            staff: populatedStaff
        });
    } catch (error) {
        console.error('Error creating staff member:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create staff member',
            error: error.message
        });
    }
};

export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, phone, role_id, status } = req.body;

        const staff = await User.findOne({ _id: id, role: 'staff' });
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        if (email && email.trim().toLowerCase() !== staff.email) {
            const existingEmail = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: id } });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email address is already in use'
                });
            }
            staff.email = email.trim().toLowerCase();
        }

        if (name !== undefined) staff.name = name.trim();
        if (phone !== undefined) staff.phone = phone.trim();
        if (status !== undefined) staff.status = status;

        if (role_id) {
            const role = await Role.findById(role_id);
            if (!role) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected role does not exist'
                });
            }
            staff.role_id = role._id;
        }

        if (password && password.trim().length >= 6) {
            staff.password = await bcrypt.hash(password.trim(), 10);
        }

        await staff.save();

        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: `Updated staff member: ${staff.name}`,
                module: 'staff',
                ipAddress: req.ip || ''
            });
        }

        const populatedStaff = await User.findById(staff._id).populate('role_id');

        return res.status(200).json({
            success: true,
            message: 'Staff member has been updated successfully',
            staff: populatedStaff
        });
    } catch (error) {
        console.error('Error updating staff member:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update staff member',
            error: error.message
        });
    }
};

export const toggleStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await User.findOne({ _id: id, role: 'staff' });

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        staff.status = staff.status === 'blocked' ? 'active' : 'blocked';
        await staff.save();

        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: `${staff.status === 'blocked' ? 'Blocked' : 'Unblocked'} staff ${staff.name}`,
                module: 'staff',
                ipAddress: req.ip || ''
            });
        }

        return res.status(200).json({
            success: true,
            message: `Staff status changed to ${staff.status} successfully`,
            status: staff.status,
            staff
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error toggling staff status',
            error: error.message
        });
    }
};

export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await User.findOne({ _id: id, role: 'staff' });

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        await User.findByIdAndDelete(id);

        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: `Deleted staff member: ${staff.name}`,
                module: 'staff',
                ipAddress: req.ip || ''
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Staff member deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting staff member:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete staff member',
            error: error.message
        });
    }
};
