import express from 'express';
import { getAllUsers, updateUserRole, toggleUserStatus, deleteUser, getDashboardStats, impersonateUser } from '../controllers/AdminUserController.js';
import { getAllStaff, createStaff, updateStaff, toggleStaffStatus, deleteStaff } from '../controllers/StaffController.js';
import { getAllRoles, getRoleById, createRole, updateRole, deleteRole, getAvailablePermissions } from '../controllers/RoleController.js';
import { clearAdminCache } from '../controllers/CacheController.js';
import { getSettings, updateSettings } from '../controllers/SettingController.js';
import {
    getHomepageSettings,
    getHeaderSettings,
    getFooterSettings,
    getAppearanceSettings,
    getSmtpSettings,
    updateSmtpSettings,
    testSmtpEmail,
    getActivationSettings,
    updateActivationSetting,
    getPaymentMethodSettings,
    updatePaymentMethodSettings,
    getGoogleSettings,
    updateGoogleSettings,
    getWebsiteSettings,
    updateWebsiteSettings,
    env_key_update,
    payment_method_update,
    google_recaptcha_update,
    google_firebase_update,
    google_file_update,
    google_play
} from '../controllers/WebsiteSettingController.js';
import {
    getPages,
    getPageById,
    createPage,
    updatePage,
    deletePage
} from '../controllers/PageController.js';
import { getActivityLogs } from '../controllers/ActivityLogController.js';
import { getContacts, replyContact, deleteContact, bulkDeleteContacts } from '../controllers/ContactController.js';
import { getLoginHistory } from '../controllers/LoginHistoryController.js';
import {
    categoryCreate,
    categoryUpdate,
    categoryRemove,
    categoryGetAll,
    categoryGetById,
    categoryToggleStatus
} from '../controllers/CategoryController.js';
import {
    blogCreate,
    blogUpdate,
    blogRemove,
    blogGetAll,
    blogGetById,
    blogToggleStatus,
    postCreate,
    postUpdate,
    postRemove,
    postGetAll
} from '../controllers/BlogController.js';
import {
    getAllLanguages,
    getLanguageById,
    createLanguage,
    updateLanguage,
    toggleLanguageStatus,
    toggleLanguageRtl,
    setDefaultLanguage,
    deleteLanguage,
    getLanguageTranslations,
    updateLanguageTranslations,
    importTranslations,
    exportTranslations
} from '../controllers/LanguageController.js';
import {
    getFileSystemSettings,
    updateFileSystemSettings,
    updateFileSystemActivation,
    testRedisConnection
} from '../controllers/FileSystemController.js';
import {
    getUploadedFiles,
    uploadFile,
    getFileByIds,
    destroyFile,
    bulkDeleteFiles,
    fileInfo
} from '../controllers/AizUploadController.js';
import { aizUploadMiddleware } from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validators/categoryValidator.js';
import { createBlogSchema, updateBlogSchema, createPostSchema, updatePostSchema } from '../validators/blogValidator.js';
import { createStaffSchema, updateStaffSchema } from '../validators/staffValidator.js';
import { createRoleSchema, updateRoleSchema } from '../validators/roleValidator.js';

const router = express.Router();

// Admin Dashboard Stats
router.get('/dashboard-stats', protect, authorize('admin', 'staff'), getDashboardStats);
router.get('/admin/dashboard-stats', protect, authorize('admin', 'staff'), getDashboardStats);

// User Management
router.get('/users', protect, authorize('admin', 'staff'), getAllUsers);
router.get('/admin/users', protect, authorize('admin', 'staff'), getAllUsers);

router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);
router.put('/admin/users/:id/role', protect, authorize('admin'), updateUserRole);

router.patch('/users/:id/status', protect, authorize('admin', 'staff'), toggleUserStatus);
router.patch('/admin/users/:id/status', protect, authorize('admin', 'staff'), toggleUserStatus);
router.patch('/admin/users/:id/toggle-status', protect, authorize('admin', 'staff'), toggleUserStatus);

router.delete('/users/:id', protect, authorize('admin'), deleteUser);
router.delete('/admin/users/:id', protect, authorize('admin'), deleteUser);

// Site Settings
router.get('/settings', protect, authorize('admin', 'staff'), getSettings);
router.get('/admin/settings', protect, authorize('admin', 'staff'), getSettings);

router.post('/settings', protect, authorize('admin'), updateSettings);
router.post('/admin/settings', protect, authorize('admin'), updateSettings);

// Language Management
router.get('/languages', protect, authorize('admin', 'staff'), getAllLanguages);
router.get('/admin/languages', protect, authorize('admin', 'staff'), getAllLanguages);
router.get('/languages/:id', protect, authorize('admin', 'staff'), getLanguageById);
router.get('/admin/languages/:id', protect, authorize('admin', 'staff'), getLanguageById);

router.post('/languages', protect, authorize('admin'), createLanguage);
router.post('/admin/languages', protect, authorize('admin'), createLanguage);

router.put('/languages/:id', protect, authorize('admin'), updateLanguage);
router.put('/admin/languages/:id', protect, authorize('admin'), updateLanguage);

router.patch('/languages/:id/toggle', protect, authorize('admin', 'staff'), toggleLanguageStatus);
router.patch('/admin/languages/:id/toggle', protect, authorize('admin', 'staff'), toggleLanguageStatus);

router.patch('/languages/:id/rtl', protect, authorize('admin', 'staff'), toggleLanguageRtl);
router.patch('/admin/languages/:id/rtl', protect, authorize('admin', 'staff'), toggleLanguageRtl);

router.patch('/languages/:id/default', protect, authorize('admin'), setDefaultLanguage);
router.patch('/admin/languages/:id/default', protect, authorize('admin'), setDefaultLanguage);

router.get('/languages/:id/translations', protect, authorize('admin', 'staff'), getLanguageTranslations);
router.get('/admin/languages/:id/translations', protect, authorize('admin', 'staff'), getLanguageTranslations);

router.put('/languages/:id/translations', protect, authorize('admin'), updateLanguageTranslations);
router.put('/admin/languages/:id/translations', protect, authorize('admin'), updateLanguageTranslations);

router.post('/languages/import', protect, authorize('admin'), importTranslations);
router.post('/admin/languages/import', protect, authorize('admin'), importTranslations);
router.post('/languages/:id/import', protect, authorize('admin'), importTranslations);
router.post('/admin/languages/:id/import', protect, authorize('admin'), importTranslations);

router.get('/languages/:id/export', protect, authorize('admin', 'staff'), exportTranslations);
router.get('/admin/languages/:id/export', protect, authorize('admin', 'staff'), exportTranslations);

router.delete('/languages/:id', protect, authorize('admin'), deleteLanguage);
router.delete('/admin/languages/:id', protect, authorize('admin'), deleteLanguage);

// Activity Logs
router.get('/activity-logs', protect, authorize('admin', 'staff'), getActivityLogs);
router.get('/logs', protect, authorize('admin', 'staff'), getActivityLogs);
router.get('/admin/activity-logs', protect, authorize('admin', 'staff'), getActivityLogs);
router.get('/admin/logs', protect, authorize('admin', 'staff'), getActivityLogs);

// Contact Inquiries
router.get('/contacts', protect, authorize('admin', 'staff'), getContacts);
router.get('/admin/contacts', protect, authorize('admin', 'staff'), getContacts);

router.post('/contacts/:id/reply', protect, authorize('admin', 'staff'), replyContact);
router.post('/admin/contacts/:id/reply', protect, authorize('admin', 'staff'), replyContact);

router.delete('/contacts/:id', protect, authorize('admin'), deleteContact);
router.delete('/admin/contacts/:id', protect, authorize('admin'), deleteContact);

router.post('/contacts/bulk-delete', protect, authorize('admin'), bulkDeleteContacts);
router.post('/admin/contacts/bulk-delete', protect, authorize('admin'), bulkDeleteContacts);

// User Login History
router.get('/login-history', protect, authorize('admin', 'staff'), getLoginHistory);
router.get('/admin/login-history', protect, authorize('admin', 'staff'), getLoginHistory);

// Admin Category Management
router.get('/categories', protect, authorize('admin', 'staff'), categoryGetAll);
router.get('/admin/categories', protect, authorize('admin', 'staff'), categoryGetAll);

router.get('/categories/:id', protect, authorize('admin', 'staff'), categoryGetById);
router.get('/admin/categories/:id', protect, authorize('admin', 'staff'), categoryGetById);

router.post('/categories', protect, authorize('admin', 'staff'), validate(createCategorySchema), categoryCreate);
router.post('/admin/categories', protect, authorize('admin', 'staff'), validate(createCategorySchema), categoryCreate);

router.put('/categories/:id', protect, authorize('admin', 'staff'), validate(updateCategorySchema), categoryUpdate);
router.put('/admin/categories/:id', protect, authorize('admin', 'staff'), validate(updateCategorySchema), categoryUpdate);

router.delete('/categories/:id', protect, authorize('admin'), categoryRemove);
router.delete('/admin/categories/:id', protect, authorize('admin'), categoryRemove);

router.patch('/categories/:id/toggle', protect, authorize('admin', 'staff'), categoryToggleStatus);
router.patch('/admin/categories/:id/toggle', protect, authorize('admin', 'staff'), categoryToggleStatus);


// Admin Blog Management (matching Laravel base-module /admin/blogs)
router.get('/blogs', protect, authorize('admin', 'staff'), blogGetAll);
router.get('/admin/blogs', protect, authorize('admin', 'staff'), blogGetAll);
router.get('/blogs/:id', protect, authorize('admin', 'staff'), blogGetById);
router.get('/admin/blogs/:id', protect, authorize('admin', 'staff'), blogGetById);

router.post('/blogs', protect, authorize('admin', 'staff'), validate(createBlogSchema), blogCreate);
router.post('/admin/blogs', protect, authorize('admin', 'staff'), validate(createBlogSchema), blogCreate);

router.put('/blogs/:id', protect, authorize('admin', 'staff'), validate(updateBlogSchema), blogUpdate);
router.put('/admin/blogs/:id', protect, authorize('admin', 'staff'), validate(updateBlogSchema), blogUpdate);

router.patch('/blogs/:id/toggle', protect, authorize('admin', 'staff'), blogToggleStatus);
router.patch('/admin/blogs/:id/toggle', protect, authorize('admin', 'staff'), blogToggleStatus);

router.delete('/blogs/:id', protect, authorize('admin'), blogRemove);
router.delete('/admin/blogs/:id', protect, authorize('admin'), blogRemove);

// Backward-compatible Post routes
router.get('/posts', protect, authorize('admin', 'staff'), blogGetAll);
router.get('/admin/posts', protect, authorize('admin', 'staff'), blogGetAll);
router.get('/posts/:id', protect, authorize('admin', 'staff'), blogGetById);
router.get('/admin/posts/:id', protect, authorize('admin', 'staff'), blogGetById);

router.post('/posts', protect, authorize('admin', 'staff'), validate(createBlogSchema), blogCreate);
router.post('/admin/posts', protect, authorize('admin', 'staff'), validate(createBlogSchema), blogCreate);

router.put('/posts/:id', protect, authorize('admin', 'staff'), validate(updateBlogSchema), blogUpdate);
router.put('/admin/posts/:id', protect, authorize('admin', 'staff'), validate(updateBlogSchema), blogUpdate);

router.patch('/posts/:id/toggle', protect, authorize('admin', 'staff'), blogToggleStatus);
router.patch('/admin/posts/:id/toggle', protect, authorize('admin', 'staff'), blogToggleStatus);

router.delete('/posts/:id', protect, authorize('admin'), blogRemove);
router.delete('/admin/posts/:id', protect, authorize('admin'), blogRemove);

// File System & Redis Configuration (matching base-module admin/file_system)
router.get('/file_system', protect, authorize('admin', 'staff'), getFileSystemSettings);
router.get('/admin/file_system', protect, authorize('admin', 'staff'), getFileSystemSettings);
router.get('/setup/file-system', protect, authorize('admin', 'staff'), getFileSystemSettings);
router.get('/admin/setup/file-system', protect, authorize('admin', 'staff'), getFileSystemSettings);

router.post('/file_system', protect, authorize('admin'), updateFileSystemSettings);
router.post('/admin/file_system', protect, authorize('admin'), updateFileSystemSettings);
router.post('/setup/file-system', protect, authorize('admin'), updateFileSystemSettings);
router.post('/admin/setup/file-system', protect, authorize('admin'), updateFileSystemSettings);

router.post('/file_system/activation', protect, authorize('admin'), updateFileSystemActivation);
router.post('/admin/file_system/activation', protect, authorize('admin'), updateFileSystemActivation);
router.post('/business_settings/update/activation', protect, authorize('admin'), updateFileSystemActivation);
router.post('/admin/business_settings/update/activation', protect, authorize('admin'), updateFileSystemActivation);

router.post('/file_system/test-redis', protect, authorize('admin'), testRedisConnection);
router.post('/admin/file_system/test-redis', protect, authorize('admin'), testRedisConnection);

// AIZ Uploader & Uploaded Files Management (matching Laravel base-module)
router.get('/aiz-uploader/get-uploaded-files', protect, getUploadedFiles);
router.get('/aiz-uploader/get_uploaded_files', protect, getUploadedFiles);
router.get('/admin/aiz-uploader/get-uploaded-files', protect, getUploadedFiles);

router.post('/aiz-uploader/upload', protect, aizUploadMiddleware, uploadFile);
router.post('/admin/aiz-uploader/upload', protect, aizUploadMiddleware, uploadFile);

router.post('/aiz-uploader/get_file_by_ids', protect, getFileByIds);
router.post('/admin/aiz-uploader/get_file_by_ids', protect, getFileByIds);

router.get('/uploaded-files', protect, getUploadedFiles);
router.get('/admin/uploaded-files', protect, getUploadedFiles);

router.get('/uploaded-files/info/:id', protect, fileInfo);
router.post('/uploaded-files/info', protect, fileInfo);
router.get('/admin/uploaded-files/info/:id', protect, fileInfo);
router.post('/admin/uploaded-files/info', protect, fileInfo);

router.delete('/uploaded-files/:id', protect, destroyFile);
router.delete('/uploaded-files/destroy/:id', protect, destroyFile);
router.delete('/admin/uploaded-files/:id', protect, destroyFile);
router.delete('/admin/uploaded-files/destroy/:id', protect, destroyFile);

router.post('/bulk-uploaded-files-delete', protect, bulkDeleteFiles);
router.post('/admin/bulk-uploaded-files-delete', protect, bulkDeleteFiles);

// User Impersonation ("Login as User")
router.post('/users/:id/impersonate', protect, authorize('admin'), impersonateUser);
router.post('/admin/users/:id/impersonate', protect, authorize('admin'), impersonateUser);

// Staff Management Routes (matching Laravel base-module /admin/staffs)
router.get('/staffs', protect, authorize('admin'), getAllStaff);
router.get('/admin/staffs', protect, authorize('admin'), getAllStaff);
router.get('/staff', protect, authorize('admin'), getAllStaff);
router.get('/admin/staff', protect, authorize('admin'), getAllStaff);
router.get('/admin/staff/all', protect, authorize('admin'), getAllStaff);

router.post('/staffs', protect, authorize('admin'), validate(createStaffSchema), createStaff);
router.post('/admin/staffs', protect, authorize('admin'), validate(createStaffSchema), createStaff);
router.post('/staff', protect, authorize('admin'), validate(createStaffSchema), createStaff);
router.post('/admin/staff', protect, authorize('admin'), validate(createStaffSchema), createStaff);

router.put('/staffs/:id', protect, authorize('admin'), validate(updateStaffSchema), updateStaff);
router.put('/admin/staffs/:id', protect, authorize('admin'), validate(updateStaffSchema), updateStaff);
router.put('/staff/:id', protect, authorize('admin'), validate(updateStaffSchema), updateStaff);
router.put('/admin/staff/:id', protect, authorize('admin'), validate(updateStaffSchema), updateStaff);

router.patch('/staffs/:id/toggle', protect, authorize('admin'), toggleStaffStatus);
router.patch('/admin/staffs/:id/toggle', protect, authorize('admin'), toggleStaffStatus);
router.patch('/staff/:id/toggle', protect, authorize('admin'), toggleStaffStatus);
router.patch('/admin/staff/:id/toggle', protect, authorize('admin'), toggleStaffStatus);

router.delete('/staffs/:id', protect, authorize('admin'), deleteStaff);
router.delete('/admin/staffs/:id', protect, authorize('admin'), deleteStaff);
router.delete('/staff/:id', protect, authorize('admin'), deleteStaff);
router.delete('/admin/staff/:id', protect, authorize('admin'), deleteStaff);

// Staff Roles & Permissions Routes (matching Laravel base-module /admin/roles)
router.get('/roles', protect, authorize('admin'), getAllRoles);
router.get('/admin/roles', protect, authorize('admin'), getAllRoles);
router.get('/admin/staff/permissions', protect, authorize('admin'), getAllRoles);
router.get('/roles/permissions/list', protect, authorize('admin'), getAvailablePermissions);
router.get('/admin/roles/permissions/list', protect, authorize('admin'), getAvailablePermissions);

router.get('/roles/:id', protect, authorize('admin'), getRoleById);
router.get('/admin/roles/:id', protect, authorize('admin'), getRoleById);

router.post('/roles', protect, authorize('admin'), validate(createRoleSchema), createRole);
router.post('/admin/roles', protect, authorize('admin'), validate(createRoleSchema), createRole);

router.put('/roles/:id', protect, authorize('admin'), validate(updateRoleSchema), updateRole);
router.put('/admin/roles/:id', protect, authorize('admin'), validate(updateRoleSchema), updateRole);

router.delete('/roles/:id', protect, authorize('admin'), deleteRole);
router.delete('/admin/roles/:id', protect, authorize('admin'), deleteRole);

// Clear Cache Route (for Admin panel top toolbar button)
router.post('/clear-cache', protect, authorize('admin', 'staff'), clearAdminCache);
router.post('/admin/clear-cache', protect, authorize('admin', 'staff'), clearAdminCache);
router.post('/admin/clear_cache', protect, authorize('admin', 'staff'), clearAdminCache);
router.post('/cache/clear', protect, authorize('admin', 'staff'), clearAdminCache);

// Website Setup - Homepage Settings (matching Laravel base-module /admin/website-setup/homepage)
router.get('/website-settings/homepage', protect, authorize('admin', 'staff'), getHomepageSettings);
router.get('/admin/website-settings/homepage', protect, authorize('admin', 'staff'), getHomepageSettings);
router.post('/website-settings/homepage', protect, authorize('admin'), updateWebsiteSettings);
router.post('/admin/website-settings/homepage', protect, authorize('admin'), updateWebsiteSettings);

// Website Setup - Header Settings (/admin/website-setup/header)
router.get('/website-settings/header', protect, authorize('admin', 'staff'), getHeaderSettings);
router.get('/admin/website-settings/header', protect, authorize('admin', 'staff'), getHeaderSettings);
router.post('/website-settings/header', protect, authorize('admin'), updateWebsiteSettings);
router.post('/admin/website-settings/header', protect, authorize('admin'), updateWebsiteSettings);

// Website Setup - Footer Settings (/admin/website-setup/footer)
router.get('/website-settings/footer', protect, authorize('admin', 'staff'), getFooterSettings);
router.get('/admin/website-settings/footer', protect, authorize('admin', 'staff'), getFooterSettings);
router.post('/website-settings/footer', protect, authorize('admin'), updateWebsiteSettings);
router.post('/admin/website-settings/footer', protect, authorize('admin'), updateWebsiteSettings);

// Website Setup - Appearance Settings (/admin/website-setup/appearance)
router.get('/website-settings/appearance', protect, authorize('admin', 'staff'), getAppearanceSettings);
router.get('/admin/website-settings/appearance', protect, authorize('admin', 'staff'), getAppearanceSettings);
router.post('/website-settings/appearance', protect, authorize('admin'), updateWebsiteSettings);
router.post('/admin/website-settings/appearance', protect, authorize('admin'), updateWebsiteSettings);

// Website Setup - Pages Management (/admin/website-setup/pages)
router.get('/pages', protect, authorize('admin', 'staff'), getPages);
router.get('/admin/pages', protect, authorize('admin', 'staff'), getPages);
router.get('/pages/:id', protect, authorize('admin', 'staff'), getPageById);
router.get('/admin/pages/:id', protect, authorize('admin', 'staff'), getPageById);
router.post('/pages', protect, authorize('admin'), createPage);
router.post('/admin/pages', protect, authorize('admin'), createPage);
router.put('/pages/:id', protect, authorize('admin'), updatePage);
router.put('/admin/pages/:id', protect, authorize('admin'), updatePage);
router.delete('/pages/:id', protect, authorize('admin'), deletePage);
router.delete('/admin/pages/:id', protect, authorize('admin'), deletePage);

// Setup & Config - SMTP Settings (/admin/setup/smtp)
router.get('/setup/smtp', protect, authorize('admin', 'staff'), getSmtpSettings);
router.get('/admin/setup/smtp', protect, authorize('admin', 'staff'), getSmtpSettings);
router.post('/setup/smtp', protect, authorize('admin'), updateSmtpSettings);
router.post('/admin/setup/smtp', protect, authorize('admin'), updateSmtpSettings);
router.post('/setup/smtp/test', protect, authorize('admin'), testSmtpEmail);
router.post('/admin/setup/smtp/test', protect, authorize('admin'), testSmtpEmail);

// Setup & Config - Feature Activation (/admin/setup/features)
router.get('/setup/features', protect, authorize('admin', 'staff'), getActivationSettings);
router.get('/admin/setup/features', protect, authorize('admin', 'staff'), getActivationSettings);
router.post('/setup/features/toggle', protect, authorize('admin'), updateActivationSetting);
router.post('/admin/setup/features/toggle', protect, authorize('admin'), updateActivationSetting);
router.post('/settings/activation', protect, authorize('admin'), updateActivationSetting);
router.post('/admin/settings/activation', protect, authorize('admin'), updateActivationSetting);

// Setup & Config - Payment Methods (/admin/setup/payment-methods)
router.get('/setup/payment-methods', protect, authorize('admin', 'staff'), getPaymentMethodSettings);
router.get('/admin/setup/payment-methods', protect, authorize('admin', 'staff'), getPaymentMethodSettings);
router.post('/setup/payment-methods', protect, authorize('admin'), updatePaymentMethodSettings);
router.post('/admin/setup/payment-methods', protect, authorize('admin'), updatePaymentMethodSettings);

// Setup & Config - Google / Third Party Settings (/admin/setup/google)
router.get('/setup/google', protect, authorize('admin', 'staff'), getGoogleSettings);
router.get('/admin/setup/google', protect, authorize('admin', 'staff'), getGoogleSettings);
router.post('/setup/google', protect, authorize('admin'), updateWebsiteSettings);
router.post('/admin/setup/google', protect, authorize('admin'), updateWebsiteSettings);

// Generic Website Settings & Laravel Compatibility Routes
router.get('/website-settings', protect, authorize('admin', 'staff'), getWebsiteSettings);
router.get('/admin/website-settings', protect, authorize('admin', 'staff'), getWebsiteSettings);
router.post('/website-settings', protect, authorize('admin'), updateWebsiteSettings);
router.post('/admin/website-settings', protect, authorize('admin'), updateWebsiteSettings);
router.post('/website-settings/update', protect, authorize('admin'), updateWebsiteSettings);
router.post('/admin/website-settings/update', protect, authorize('admin'), updateWebsiteSettings);
router.post('/business_settings/update', protect, authorize('admin'), updateWebsiteSettings);
router.post('/admin/business_settings/update', protect, authorize('admin'), updateWebsiteSettings);

// Environment Key Update Routes
router.post('/env_key_update', protect, authorize('admin'), env_key_update);
router.post('/admin/env_key_update', protect, authorize('admin'), env_key_update);
router.post('/env-key-update', protect, authorize('admin'), env_key_update);
router.post('/admin/env-key-update', protect, authorize('admin'), env_key_update);

// Payment Method Update Routes
router.post('/payment_method_update', protect, authorize('admin'), payment_method_update);
router.post('/admin/payment_method_update', protect, authorize('admin'), payment_method_update);
router.post('/payment-method-update', protect, authorize('admin'), payment_method_update);
router.post('/admin/payment-method-update', protect, authorize('admin'), payment_method_update);

// Google & Third-Party Configuration Update Routes
router.post('/google_recaptcha_update', protect, authorize('admin'), google_recaptcha_update);
router.post('/admin/google_recaptcha_update', protect, authorize('admin'), google_recaptcha_update);
router.post('/google_firebase_update', protect, authorize('admin'), google_firebase_update);
router.post('/admin/google_firebase_update', protect, authorize('admin'), google_firebase_update);
router.post('/google_file_update', protect, authorize('admin'), google_file_update);
router.post('/admin/google_file_update', protect, authorize('admin'), google_file_update);
router.get('/google-play', protect, authorize('admin', 'staff'), google_play);
router.get('/admin/google-play', protect, authorize('admin', 'staff'), google_play);

export default router;

