import Role from '../models/Role.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

// Predefined available permission definitions grouped by section matching Laravel base-module
export const PERMISSION_GROUPS = [
    {
        name: 'Blog System',
        key: 'blog_system',
        permissions: [
            { id: 'blogs_view', name: 'Show All Blogs' },
            { id: 'blogs_create', name: 'Add New Blog' },
            { id: 'blogs_edit', name: 'Edit Blog' },
            { id: 'blogs_delete', name: 'Delete Blog' },
            { id: 'categories_manage', name: 'Manage Categories' }
        ]
    },
    {
        name: 'Uploaded Files',
        key: 'uploaded_files',
        permissions: [
            { id: 'uploads_view', name: 'View Uploaded Files' },
            { id: 'uploads_create', name: 'Upload New File' },
            { id: 'uploads_delete', name: 'Delete Uploaded Files' }
        ]
    },
    {
        name: 'Customer & User Management',
        key: 'users',
        permissions: [
            { id: 'users_view', name: 'View Users' },
            { id: 'users_edit', name: 'Edit User Roles & Status' },
            { id: 'users_impersonate', name: 'Login as User' },
            { id: 'users_delete', name: 'Delete Users' }
        ]
    },
    {
        name: 'Staff & Roles',
        key: 'staff',
        permissions: [
            { id: 'staff_view', name: 'View All Staff' },
            { id: 'staff_create', name: 'Add New Staff' },
            { id: 'staff_edit', name: 'Edit Staff' },
            { id: 'staff_delete', name: 'Delete Staff' },
            { id: 'roles_manage', name: 'Manage Staff Roles & Permissions' }
        ]
    },
    {
        name: 'Website Setup & Settings',
        key: 'settings',
        permissions: [
            { id: 'homepage_settings', name: 'Homepage Settings' },
            { id: 'header_settings', name: 'Header Settings' },
            { id: 'footer_settings', name: 'Footer Settings' },
            { id: 'pages_manage', name: 'Manage Custom Pages' },
            { id: 'appearance_manage', name: 'Appearance & Theme Settings' },
            { id: 'settings_view', name: 'View General Settings' },
            { id: 'settings_edit', name: 'Update General Settings' }
        ]
    },
    {
        name: 'Setup & Configurations',
        key: 'setup',
        permissions: [
            { id: 'feature_activation', name: 'Feature Activation' },
            { id: 'languages_manage', name: 'Language & Translation Management' },
            { id: 'file_system_manage', name: 'File System & S3 Configuration' },
            { id: 'smtp_manage', name: 'SMTP Email Configuration' },
            { id: 'payment_methods_manage', name: 'Payment Methods' },
            { id: 'google_manage', name: 'Google & Third-Party Configuration' },
            { id: 'cache_clear', name: 'Clear Cache' }
        ]
    },
    {
        name: 'Inquiries & Activity Logs',
        key: 'logs_inquiries',
        permissions: [
            { id: 'contacts_manage', name: 'Manage Contact Enquiries' },
            { id: 'login_history_view', name: 'View User Login History' },
            { id: 'logs_view', name: 'View Activity Logs' }
        ]
    }
];

export const getAvailablePermissions = async (req, res) => {
    return res.status(200).json({
        success: true,
        groups: PERMISSION_GROUPS
    });
};

export const getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find().sort({ createdAt: -1 });
        
        // Count staff members per role
        const rolesWithCounts = await Promise.all(roles.map(async (r) => {
            const count = await User.countDocuments({ role_id: r._id, role: 'staff' });
            return {
                _id: r._id,
                id: r._id,
                name: r.name,
                description: r.description,
                permissions: r.permissions || [],
                staff_count: count,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt
            };
        }));

        return res.status(200).json({
            success: true,
            roles: rolesWithCounts
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch roles',
            error: error.message
        });
    }
};

export const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findById(id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        return res.status(200).json({
            success: true,
            role
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch role',
            error: error.message
        });
    }
};

export const createRole = async (req, res) => {
    try {
        const { name, permissions = [], description = '' } = req.body;

        const existing = await Role.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Role name already exists'
            });
        }

        const role = new Role({
            name: name.trim(),
            permissions: Array.isArray(permissions) ? permissions : [],
            description: description || ''
        });

        await role.save();

        if (req.user) {
            try {
                await ActivityLog.create({
                    user: req.user._id,
                    userName: req.user.name || req.user.username,
                    userRole: req.user.role || 'admin',
                    action: `Created new role: ${role.name}`,
                    module: 'staff',
                    ipAddress: req.ip || '',
                    details: `Permissions: ${role.permissions.join(', ')}`
                });
            } catch (logErr) {
                console.warn('Activity log error (createRole):', logErr.message);
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Role has been created successfully',
            role
        });
    } catch (error) {
        console.error('Error creating role:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create role',
            error: error.message
        });
    }
};

export const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, permissions, description } = req.body;

        const role = await Role.findById(id);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        if (name && name.trim() !== role.name) {
            const existing = await Role.findOne({ name: name.trim(), _id: { $ne: id } });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Role name already in use'
                });
            }
            role.name = name.trim();
        }

        if (permissions !== undefined) {
            role.permissions = Array.isArray(permissions) ? permissions : [];
        }

        if (description !== undefined) {
            role.description = description;
        }

        await role.save();

        if (req.user) {
            try {
                await ActivityLog.create({
                    user: req.user._id,
                    userName: req.user.name || req.user.username,
                    userRole: req.user.role || 'admin',
                    action: `Updated role: ${role.name}`,
                    module: 'staff',
                    ipAddress: req.ip || '',
                    details: `Permissions updated`
                });
            } catch (logErr) {
                console.warn('Activity log error (updateRole):', logErr.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Role has been updated successfully',
            role
        });
    } catch (error) {
        console.error('Error updating role:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update role',
            error: error.message
        });
    }
};

export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findById(id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        // Check if role is assigned to any staff
        const staffCount = await User.countDocuments({ role_id: id });
        if (staffCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete role. It is assigned to ${staffCount} staff member(s).`
            });
        }

        await Role.findByIdAndDelete(id);

        if (req.user) {
            try {
                await ActivityLog.create({
                    user: req.user._id,
                    userName: req.user.name || req.user.username,
                    userRole: req.user.role || 'admin',
                    action: `Deleted role: ${role.name}`,
                    module: 'staff',
                    ipAddress: req.ip || ''
                });
            } catch (logErr) {
                console.warn('Activity log error (deleteRole):', logErr.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Role has been deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting role:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete role',
            error: error.message
        });
    }
};
