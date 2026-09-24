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
import {
    getAllPayments,
    approveManualPayment,
    rejectManualPayment
} from '../controllers/PaymentController.js';
import { aizUploadMiddleware } from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validators/categoryValidator.js';
import { createBlogSchema, updateBlogSchema, createPostSchema, updatePostSchema } from '../validators/blogValidator.js';
import { createStaffSchema, updateStaffSchema } from '../validators/staffValidator.js';
import { createRoleSchema, updateRoleSchema } from '../validators/roleValidator.js';

const router = express.Router();

// 1. Admin Dashboard Stats
router.get('/dashboard-stats', protect, authorize('admin', 'staff'), getDashboardStats);
router.get('/admin/dashboard-stats', protect, authorize('admin', 'staff'), getDashboardStats);

// 2. Customer & User Management
router.get('/users', protect, checkPermission('users_view'), getAllUsers);
router.get('/admin/users', protect, checkPermission('users_view'), getAllUsers);
router.put('/users/:id/role', protect, checkPermission('users_edit'), updateUserRole);
router.put('/admin/users/:id/role', protect, checkPermission('users_edit'), updateUserRole);
router.put('/users/:id/status', protect, checkPermission('users_edit'), toggleUserStatus);
router.put('/admin/users/:id/status', protect, checkPermission('users_edit'), toggleUserStatus);
router.patch('/users/:id/toggle', protect, checkPermission('users_edit'), toggleUserStatus);
router.patch('/admin/users/:id/toggle', protect, checkPermission('users_edit'), toggleUserStatus);
router.post('/users/:id/impersonate', protect, checkPermission('users_impersonate'), impersonateUser);
router.post('/admin/users/:id/impersonate', protect, checkPermission('users_impersonate'), impersonateUser);
router.delete('/users/:id', protect, checkPermission('users_delete'), deleteUser);
router.delete('/admin/users/:id', protect, checkPermission('users_delete'), deleteUser);

// 3. Activity Logs & Login History
router.get('/logs', protect, checkPermission('logs_view'), getActivityLogs);
router.get('/admin/logs', protect, checkPermission('logs_view'), getActivityLogs);
router.get('/login-history', protect, checkPermission('login_history_view'), getLoginHistory);
router.get('/admin/login-history', protect, checkPermission('login_history_view'), getLoginHistory);

// 4. Contact Enquiries
router.get('/contacts', protect, checkPermission('contacts_manage'), getContacts);
router.get('/admin/contacts', protect, checkPermission('contacts_manage'), getContacts);
router.post('/contacts/:id/reply', protect, checkPermission('contacts_manage'), replyContact);
router.post('/admin/contacts/:id/reply', protect, checkPermission('contacts_manage'), replyContact);
router.delete('/contacts/:id', protect, checkPermission('contacts_manage'), deleteContact);
router.delete('/admin/contacts/:id', protect, checkPermission('contacts_manage'), deleteContact);
router.post('/contacts/bulk-delete', protect, checkPermission('contacts_manage'), bulkDeleteContacts);
router.post('/admin/contacts/bulk-delete', protect, checkPermission('contacts_manage'), bulkDeleteContacts);

// 5. Category Management
router.get('/categories', protect, checkPermission(['categories_manage', 'blogs_view', 'blogs_create', 'blogs_edit']), categoryGetAll);
router.get('/admin/categories', protect, checkPermission(['categories_manage', 'blogs_view', 'blogs_create', 'blogs_edit']), categoryGetAll);
router.get('/categories/:id', protect, checkPermission(['categories_manage', 'blogs_view']), categoryGetById);
router.get('/admin/categories/:id', protect, checkPermission(['categories_manage', 'blogs_view']), categoryGetById);

router.post('/categories', protect, checkPermission('categories_manage'), validate(createCategorySchema), categoryCreate);
router.post('/admin/categories', protect, checkPermission('categories_manage'), validate(createCategorySchema), categoryCreate);
router.put('/categories/:id', protect, checkPermission('categories_manage'), validate(updateCategorySchema), categoryUpdate);
router.put('/admin/categories/:id', protect, checkPermission('categories_manage'), validate(updateCategorySchema), categoryUpdate);
router.delete('/categories/:id', protect, checkPermission('categories_manage'), categoryRemove);
router.delete('/admin/categories/:id', protect, checkPermission('categories_manage'), categoryRemove);
router.patch('/categories/:id/toggle', protect, checkPermission('categories_manage'), categoryToggleStatus);
router.patch('/admin/categories/:id/toggle', protect, checkPermission('categories_manage'), categoryToggleStatus);

// 6. Blog & Post Management
router.get('/blogs', protect, checkPermission('blogs_view'), blogGetAll);
router.get('/admin/blogs', protect, checkPermission('blogs_view'), blogGetAll);
router.get('/blogs/:id', protect, checkPermission(['blogs_view', 'blogs_edit']), blogGetById);
router.get('/admin/blogs/:id', protect, checkPermission(['blogs_view', 'blogs_edit']), blogGetById);

router.post('/blogs', protect, checkPermission('blogs_create'), validate(createBlogSchema), blogCreate);
router.post('/admin/blogs', protect, checkPermission('blogs_create'), validate(createBlogSchema), blogCreate);
router.put('/blogs/:id', protect, checkPermission('blogs_edit'), validate(updateBlogSchema), blogUpdate);
router.put('/admin/blogs/:id', protect, checkPermission('blogs_edit'), validate(updateBlogSchema), blogUpdate);
router.patch('/blogs/:id/toggle', protect, checkPermission('blogs_edit'), blogToggleStatus);
router.patch('/admin/blogs/:id/toggle', protect, checkPermission('blogs_edit'), blogToggleStatus);
router.delete('/blogs/:id', protect, checkPermission('blogs_delete'), blogRemove);
router.delete('/admin/blogs/:id', protect, checkPermission('blogs_delete'), blogRemove);

// Post aliases
router.get('/posts', protect, checkPermission('blogs_view'), blogGetAll);
router.get('/admin/posts', protect, checkPermission('blogs_view'), blogGetAll);
router.get('/posts/:id', protect, checkPermission(['blogs_view', 'blogs_edit']), blogGetById);
router.get('/admin/posts/:id', protect, checkPermission(['blogs_view', 'blogs_edit']), blogGetById);
router.post('/posts', protect, checkPermission('blogs_create'), validate(createBlogSchema), blogCreate);
router.post('/admin/posts', protect, checkPermission('blogs_create'), validate(createBlogSchema), blogCreate);
router.put('/posts/:id', protect, checkPermission('blogs_edit'), validate(updateBlogSchema), blogUpdate);
router.put('/admin/posts/:id', protect, checkPermission('blogs_edit'), validate(updateBlogSchema), blogUpdate);
router.patch('/posts/:id/toggle', protect, checkPermission('blogs_edit'), blogToggleStatus);
router.patch('/admin/posts/:id/toggle', protect, checkPermission('blogs_edit'), blogToggleStatus);
router.delete('/posts/:id', protect, checkPermission('blogs_delete'), blogRemove);
router.delete('/admin/posts/:id', protect, checkPermission('blogs_delete'), blogRemove);

// 7. File System & Storage Configuration
router.get('/file_system', protect, checkPermission('file_system_manage'), getFileSystemSettings);
router.get('/admin/file_system', protect, checkPermission('file_system_manage'), getFileSystemSettings);
router.get('/setup/file-system', protect, checkPermission('file_system_manage'), getFileSystemSettings);
router.get('/admin/setup/file-system', protect, checkPermission('file_system_manage'), getFileSystemSettings);

router.post('/file_system', protect, checkPermission('file_system_manage'), updateFileSystemSettings);
router.post('/admin/file_system', protect, checkPermission('file_system_manage'), updateFileSystemSettings);
router.post('/setup/file-system', protect, checkPermission('file_system_manage'), updateFileSystemSettings);
router.post('/admin/setup/file-system', protect, checkPermission('file_system_manage'), updateFileSystemSettings);
router.post('/file_system/activation', protect, checkPermission('file_system_manage'), updateFileSystemActivation);
router.post('/admin/file_system/activation', protect, checkPermission('file_system_manage'), updateFileSystemActivation);
router.post('/file_system/test-redis', protect, checkPermission('file_system_manage'), testRedisConnection);
router.post('/admin/file_system/test-redis', protect, checkPermission('file_system_manage'), testRedisConnection);

// 8. Uploaded Files Management
router.get('/aiz-uploader/get-uploaded-files', protect, checkPermission(['uploads_view', 'blogs_create', 'blogs_edit', 'settings_edit']), getUploadedFiles);
router.post('/aiz-uploader/upload', protect, checkPermission(['uploads_create', 'blogs_create', 'blogs_edit', 'settings_edit']), aizUploadMiddleware, uploadFile);
router.post('/aiz-uploader/get_file_by_ids', protect, checkPermission(['uploads_view', 'blogs_create', 'blogs_edit', 'settings_edit']), getFileByIds);
router.get('/uploaded-files', protect, checkPermission('uploads_view'), getUploadedFiles);
router.get('/admin/uploaded-files', protect, checkPermission('uploads_view'), getUploadedFiles);
router.get('/uploaded-files/info/:id', protect, checkPermission('uploads_view'), fileInfo);
router.get('/admin/uploaded-files/info/:id', protect, checkPermission('uploads_view'), fileInfo);
router.delete('/uploaded-files/:id', protect, checkPermission('uploads_delete'), destroyFile);
router.delete('/admin/uploaded-files/:id', protect, checkPermission('uploads_delete'), destroyFile);
router.post('/bulk-uploaded-files-delete', protect, checkPermission('uploads_delete'), bulkDeleteFiles);
router.post('/admin/bulk-uploaded-files-delete', protect, checkPermission('uploads_delete'), bulkDeleteFiles);

// 9. Language & Translation Management
router.get('/languages', protect, checkPermission('languages_manage'), getAllLanguages);
router.get('/admin/languages', protect, checkPermission('languages_manage'), getAllLanguages);
router.get('/languages/:id', protect, checkPermission('languages_manage'), getLanguageById);
router.get('/admin/languages/:id', protect, checkPermission('languages_manage'), getLanguageById);
router.post('/languages', protect, checkPermission('languages_manage'), createLanguage);
router.post('/admin/languages', protect, checkPermission('languages_manage'), createLanguage);
router.put('/languages/:id', protect, checkPermission('languages_manage'), updateLanguage);
router.put('/admin/languages/:id', protect, checkPermission('languages_manage'), updateLanguage);
router.patch('/languages/:id/toggle', protect, checkPermission('languages_manage'), toggleLanguageStatus);
router.patch('/admin/languages/:id/toggle', protect, checkPermission('languages_manage'), toggleLanguageStatus);
router.patch('/languages/:id/rtl', protect, checkPermission('languages_manage'), toggleLanguageRtl);
router.patch('/admin/languages/:id/rtl', protect, checkPermission('languages_manage'), toggleLanguageRtl);
router.patch('/languages/:id/default', protect, checkPermission('languages_manage'), setDefaultLanguage);
router.patch('/admin/languages/:id/default', protect, checkPermission('languages_manage'), setDefaultLanguage);
router.delete('/languages/:id', protect, checkPermission('languages_manage'), deleteLanguage);
router.delete('/admin/languages/:id', protect, checkPermission('languages_manage'), deleteLanguage);
router.get('/languages/:id/translations', protect, checkPermission('languages_manage'), getLanguageTranslations);
router.get('/admin/languages/:id/translations', protect, checkPermission('languages_manage'), getLanguageTranslations);
router.put('/languages/:id/translations', protect, checkPermission('languages_manage'), updateLanguageTranslations);
router.put('/admin/languages/:id/translations', protect, checkPermission('languages_manage'), updateLanguageTranslations);
router.post('/languages/import', protect, checkPermission('languages_manage'), importTranslations);
router.post('/admin/languages/import', protect, checkPermission('languages_manage'), importTranslations);
router.get('/languages/:id/export', protect, checkPermission('languages_manage'), exportTranslations);
router.get('/admin/languages/:id/export', protect, checkPermission('languages_manage'), exportTranslations);

// 10. Staff Management
router.get('/staffs', protect, checkPermission('staff_view'), getAllStaff);
router.get('/admin/staffs', protect, checkPermission('staff_view'), getAllStaff);
router.get('/staff', protect, checkPermission('staff_view'), getAllStaff);
router.get('/admin/staff', protect, checkPermission('staff_view'), getAllStaff);

router.post('/staffs', protect, checkPermission('staff_create'), validate(createStaffSchema), createStaff);
router.post('/admin/staffs', protect, checkPermission('staff_create'), validate(createStaffSchema), createStaff);
router.post('/staff', protect, checkPermission('staff_create'), validate(createStaffSchema), createStaff);
router.post('/admin/staff', protect, checkPermission('staff_create'), validate(createStaffSchema), createStaff);

router.put('/staffs/:id', protect, checkPermission('staff_edit'), validate(updateStaffSchema), updateStaff);
router.put('/admin/staffs/:id', protect, checkPermission('staff_edit'), validate(updateStaffSchema), updateStaff);
router.put('/staff/:id', protect, checkPermission('staff_edit'), validate(updateStaffSchema), updateStaff);
router.put('/admin/staff/:id', protect, checkPermission('staff_edit'), validate(updateStaffSchema), updateStaff);

router.patch('/staffs/:id/toggle', protect, checkPermission('staff_edit'), toggleStaffStatus);
router.patch('/admin/staffs/:id/toggle', protect, checkPermission('staff_edit'), toggleStaffStatus);
router.patch('/staff/:id/toggle', protect, checkPermission('staff_edit'), toggleStaffStatus);
router.patch('/admin/staff/:id/toggle', protect, checkPermission('staff_edit'), toggleStaffStatus);

router.delete('/staffs/:id', protect, checkPermission('staff_delete'), deleteStaff);
router.delete('/admin/staffs/:id', protect, checkPermission('staff_delete'), deleteStaff);
router.delete('/staff/:id', protect, checkPermission('staff_delete'), deleteStaff);
router.delete('/admin/staff/:id', protect, checkPermission('staff_delete'), deleteStaff);

// 11. Staff Roles & Permissions
router.get('/roles', protect, checkPermission('roles_manage'), getAllRoles);
router.get('/admin/roles', protect, checkPermission('roles_manage'), getAllRoles);
router.get('/admin/staff/permissions', protect, checkPermission('roles_manage'), getAllRoles);
router.get('/roles/permissions/list', protect, checkPermission('roles_manage'), getAvailablePermissions);
router.get('/admin/roles/permissions/list', protect, checkPermission('roles_manage'), getAvailablePermissions);
router.get('/roles/:id', protect, checkPermission('roles_manage'), getRoleById);
router.get('/admin/roles/:id', protect, checkPermission('roles_manage'), getRoleById);
router.post('/roles', protect, checkPermission('roles_manage'), validate(createRoleSchema), createRole);
router.post('/admin/roles', protect, checkPermission('roles_manage'), validate(createRoleSchema), createRole);
router.put('/roles/:id', protect, checkPermission('roles_manage'), validate(updateRoleSchema), updateRole);
router.put('/admin/roles/:id', protect, checkPermission('roles_manage'), validate(updateRoleSchema), updateRole);
router.delete('/roles/:id', protect, checkPermission('roles_manage'), deleteRole);
router.delete('/admin/roles/:id', protect, checkPermission('roles_manage'), deleteRole);

// 12. Clear Cache Route
router.post('/clear-cache', protect, checkPermission('cache_clear'), clearAdminCache);
router.post('/admin/clear-cache', protect, checkPermission('cache_clear'), clearAdminCache);
router.post('/admin/clear_cache', protect, checkPermission('cache_clear'), clearAdminCache);
router.post('/cache/clear', protect, checkPermission('cache_clear'), clearAdminCache);

// 13. Website Setup - Homepage Settings
router.get('/website-settings/homepage', protect, checkPermission(['homepage_settings', 'settings_view']), getHomepageSettings);
router.get('/admin/website-settings/homepage', protect, checkPermission(['homepage_settings', 'settings_view']), getHomepageSettings);
router.post('/website-settings/homepage', protect, checkPermission(['homepage_settings', 'settings_edit']), updateWebsiteSettings);
router.post('/admin/website-settings/homepage', protect, checkPermission(['homepage_settings', 'settings_edit']), updateWebsiteSettings);

// 14. Website Setup - Header Settings
router.get('/website-settings/header', protect, checkPermission(['header_settings', 'settings_view']), getHeaderSettings);
router.get('/admin/website-settings/header', protect, checkPermission(['header_settings', 'settings_view']), getHeaderSettings);
router.post('/website-settings/header', protect, checkPermission(['header_settings', 'settings_edit']), updateWebsiteSettings);
router.post('/admin/website-settings/header', protect, checkPermission(['header_settings', 'settings_edit']), updateWebsiteSettings);

// 15. Website Setup - Footer Settings
router.get('/website-settings/footer', protect, checkPermission(['footer_settings', 'settings_view']), getFooterSettings);
router.get('/admin/website-settings/footer', protect, checkPermission(['footer_settings', 'settings_view']), getFooterSettings);
router.post('/website-settings/footer', protect, checkPermission(['footer_settings', 'settings_edit']), updateWebsiteSettings);
router.post('/admin/website-settings/footer', protect, checkPermission(['footer_settings', 'settings_edit']), updateWebsiteSettings);

// 16. Website Setup - Appearance Settings
router.get('/website-settings/appearance', protect, checkPermission(['appearance_manage', 'settings_view']), getAppearanceSettings);
router.get('/admin/website-settings/appearance', protect, checkPermission(['appearance_manage', 'settings_view']), getAppearanceSettings);
router.post('/website-settings/appearance', protect, checkPermission(['appearance_manage', 'settings_edit']), updateWebsiteSettings);
router.post('/admin/website-settings/appearance', protect, checkPermission(['appearance_manage', 'settings_edit']), updateWebsiteSettings);

// 17. Website Setup - Pages Management
router.get('/pages', protect, checkPermission(['pages_manage', 'settings_view']), getPages);
router.get('/admin/pages', protect, checkPermission(['pages_manage', 'settings_view']), getPages);
router.get('/pages/:id', protect, checkPermission(['pages_manage', 'settings_view']), getPageById);
router.get('/admin/pages/:id', protect, checkPermission(['pages_manage', 'settings_view']), getPageById);
router.post('/pages', protect, checkPermission('pages_manage'), createPage);
router.post('/admin/pages', protect, checkPermission('pages_manage'), createPage);
router.put('/pages/:id', protect, checkPermission('pages_manage'), updatePage);
router.put('/admin/pages/:id', protect, checkPermission('pages_manage'), updatePage);
router.delete('/pages/:id', protect, checkPermission('pages_manage'), deletePage);
router.delete('/admin/pages/:id', protect, checkPermission('pages_manage'), deletePage);

// 18. Setup & Config - SMTP Settings
router.get('/setup/smtp', protect, checkPermission('smtp_manage'), getSmtpSettings);
router.get('/admin/setup/smtp', protect, checkPermission('smtp_manage'), getSmtpSettings);
router.post('/setup/smtp', protect, checkPermission('smtp_manage'), updateSmtpSettings);
router.post('/admin/setup/smtp', protect, checkPermission('smtp_manage'), updateSmtpSettings);
router.post('/setup/smtp/test', protect, checkPermission('smtp_manage'), testSmtpEmail);
router.post('/admin/setup/smtp/test', protect, checkPermission('smtp_manage'), testSmtpEmail);

// 19. Setup & Config - Feature Activation
router.get('/setup/features', protect, checkPermission('feature_activation'), getActivationSettings);
router.get('/admin/setup/features', protect, checkPermission('feature_activation'), getActivationSettings);
router.post('/setup/features/toggle', protect, checkPermission('feature_activation'), updateActivationSetting);
router.post('/admin/setup/features/toggle', protect, checkPermission('feature_activation'), updateActivationSetting);
router.post('/settings/activation', protect, checkPermission('feature_activation'), updateActivationSetting);
router.post('/admin/settings/activation', protect, checkPermission('feature_activation'), updateActivationSetting);

// 20. Setup & Config - Payment Methods
router.get('/setup/payment-methods', protect, checkPermission('payment_methods_manage'), getPaymentMethodSettings);
router.get('/admin/setup/payment-methods', protect, checkPermission('payment_methods_manage'), getPaymentMethodSettings);
router.post('/setup/payment-methods', protect, checkPermission('payment_methods_manage'), updatePaymentMethodSettings);
router.post('/admin/setup/payment-methods', protect, checkPermission('payment_methods_manage'), updatePaymentMethodSettings);

// 21. Setup & Config - Google / Third Party Settings
router.get('/setup/google', protect, checkPermission('google_manage'), getGoogleSettings);
router.get('/admin/setup/google', protect, checkPermission('google_manage'), getGoogleSettings);
router.post('/setup/google', protect, checkPermission('google_manage'), updateGoogleSettings);
router.post('/admin/setup/google', protect, checkPermission('google_manage'), updateGoogleSettings);

// 22. Generic Website Settings & Direct Updates
router.get('/website-settings', protect, checkPermission('settings_view'), getWebsiteSettings);
router.get('/admin/website-settings', protect, checkPermission('settings_view'), getWebsiteSettings);
router.post('/website-settings', protect, checkPermission('settings_edit'), updateWebsiteSettings);
router.post('/admin/website-settings', protect, checkPermission('settings_edit'), updateWebsiteSettings);
router.post('/website-settings/update', protect, checkPermission('settings_edit'), updateWebsiteSettings);
router.post('/admin/website-settings/update', protect, checkPermission('settings_edit'), updateWebsiteSettings);
router.post('/business_settings/update', protect, checkPermission('settings_edit'), updateWebsiteSettings);
router.post('/admin/business_settings/update', protect, checkPermission('settings_edit'), updateWebsiteSettings);

// 23. Environment & Legacy Updates
router.post('/env_key_update', protect, checkPermission('file_system_manage'), env_key_update);
router.post('/admin/env_key_update', protect, checkPermission('file_system_manage'), env_key_update);
router.post('/payment_method_update', protect, checkPermission('payment_methods_manage'), payment_method_update);
router.post('/admin/payment_method_update', protect, checkPermission('payment_methods_manage'), payment_method_update);
router.post('/google_recaptcha_update', protect, checkPermission('google_manage'), google_recaptcha_update);
router.post('/admin/google_recaptcha_update', protect, checkPermission('google_manage'), google_recaptcha_update);
router.post('/google_firebase_update', protect, checkPermission('google_manage'), google_firebase_update);
router.post('/admin/google_firebase_update', protect, checkPermission('google_manage'), google_firebase_update);
router.post('/google_file_update', protect, checkPermission('google_manage'), google_file_update);
router.post('/admin/google_file_update', protect, checkPermission('google_manage'), google_file_update);
router.get('/google-play', protect, checkPermission('google_manage'), google_play);
router.get('/admin/google-play', protect, checkPermission('google_manage'), google_play);

// 24. Admin Payment Management & Offline Verifications
router.get('/payments', protect, authorize('admin', 'staff'), checkPermission('payment_methods_manage'), getAllPayments);
router.get('/admin/payments', protect, authorize('admin', 'staff'), checkPermission('payment_methods_manage'), getAllPayments);
router.put('/payments/:id/approve', protect, authorize('admin', 'staff'), checkPermission('payment_methods_manage'), approveManualPayment);
router.put('/admin/payments/:id/approve', protect, authorize('admin', 'staff'), checkPermission('payment_methods_manage'), approveManualPayment);
router.put('/payments/:id/reject', protect, authorize('admin', 'staff'), checkPermission('payment_methods_manage'), rejectManualPayment);
router.put('/admin/payments/:id/reject', protect, authorize('admin', 'staff'), checkPermission('payment_methods_manage'), rejectManualPayment);

// 25. Website Setup - Custom Pages Management
router.get('/pages', protect, checkPermission('pages_manage'), getPages);
router.get('/admin/pages', protect, checkPermission('pages_manage'), getPages);
router.get('/pages/:id', protect, checkPermission('pages_manage'), getPageById);
router.get('/admin/pages/:id', protect, checkPermission('pages_manage'), getPageById);
router.post('/pages', protect, checkPermission('pages_manage'), createPage);
router.post('/admin/pages', protect, checkPermission('pages_manage'), createPage);
router.put('/pages/:id', protect, checkPermission('pages_manage'), updatePage);
router.put('/admin/pages/:id', protect, checkPermission('pages_manage'), updatePage);
router.delete('/pages/:id', protect, checkPermission('pages_manage'), deletePage);
router.delete('/admin/pages/:id', protect, checkPermission('pages_manage'), deletePage);

export default router;
