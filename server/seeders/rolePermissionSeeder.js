import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Connection from '../database/db.js';
import Role from '../models/Role.js';
import User from '../models/User.js';

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

export const getAllPermissionIds = () => {
    const ids = [];
    PERMISSION_GROUPS.forEach(group => {
        group.permissions.forEach(p => ids.push(p.id));
    });
    return ids;
};

export const seedDefaultRoles = async () => {
    try {
        console.log('--- Seeding Roles & Permissions ---');
        const allIds = getAllPermissionIds();

        // 1. Super Admin Role
        let superAdmin = await Role.findOne({ name: 'Super Admin' });
        if (!superAdmin) {
            superAdmin = await Role.create({
                name: 'Super Admin',
                description: 'Full access to all system modules and settings',
                permissions: allIds
            });
            console.log('✓ Created Role: Super Admin');
        } else {
            // Update permissions to include any new ones
            superAdmin.permissions = Array.from(new Set([...(superAdmin.permissions || []), ...allIds]));
            await superAdmin.save();
            console.log('✓ Updated Role: Super Admin');
        }

        // 2. Content Manager Role
        let contentManager = await Role.findOne({ name: 'Content Manager' });
        const contentPerms = [
            'blogs_view', 'blogs_create', 'blogs_edit', 'blogs_delete',
            'categories_manage', 'uploads_view', 'uploads_create', 'uploads_delete',
            'pages_manage', 'homepage_settings', 'header_settings', 'footer_settings'
        ];
        if (!contentManager) {
            contentManager = await Role.create({
                name: 'Content Manager',
                description: 'Manage blogs, categories, uploads, pages, and website content',
                permissions: contentPerms
            });
            console.log('✓ Created Role: Content Manager');
        } else {
            contentManager.permissions = contentPerms;
            await contentManager.save();
            console.log('✓ Updated Role: Content Manager');
        }

        // 3. Support Staff Role
        let supportStaff = await Role.findOne({ name: 'Support Staff' });
        const supportPerms = [
            'contacts_manage', 'users_view', 'blogs_view', 'login_history_view', 'logs_view'
        ];
        if (!supportStaff) {
            supportStaff = await Role.create({
                name: 'Support Staff',
                description: 'Handle customer inquiries, view users, and check logs',
                permissions: supportPerms
            });
            console.log('✓ Created Role: Support Staff');
        } else {
            supportStaff.permissions = supportPerms;
            await supportStaff.save();
            console.log('✓ Updated Role: Support Staff');
        }

        // Link existing staff users without role_id to Content Manager by default
        const unassignedStaff = await User.find({ role: 'staff', $or: [{ role_id: null }, { role_id: { $exists: false } }] });
        if (unassignedStaff.length > 0 && contentManager) {
            for (const staff of unassignedStaff) {
                staff.role_id = contentManager._id;
                await staff.save();
                console.log(`✓ Assigned default role to staff user: ${staff.email}`);
            }
        }

        console.log('✓ Roles & Permissions seeding complete.');
    } catch (err) {
        console.error('Error seeding roles & permissions:', err);
    }
};

// If run directly via node
if (process.argv[1] && process.argv[1].endsWith('rolePermissionSeeder.js')) {
    (async () => {
        const username = process.env.DB_USERNAME;
        const password = process.env.DB_PASSWORD;
        await Connection(username, password);
        await seedDefaultRoles();
        await mongoose.disconnect();
        process.exit(0);
    })();
}
