import api from './axios';

// Users Management API
export const fetchUsers = async (params) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
};
export const updateUserRole = async (userId, role) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
};
export const toggleUserStatus = async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/toggle-status`);
    return response.data;
};
export const deleteUser = async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
};

// Dashboard Stats
export const fetchDashboardStats = async () => {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
};

// Login History
export const fetchLoginHistory = async (params) => {
    const response = await api.get('/admin/login-history', { params });
    return response.data;
};

// Categories API
export const fetchAdminCategories = async (params) => {
    const response = await api.get('/admin/categories', { params });
    return response.data;
};
export const fetchAdminCategoryById = async (id, params) => {
    const response = await api.get(`/admin/categories/${id}`, { params });
    return response.data;
};
export const createCategory = async (data) => {
    const response = await api.post('/admin/categories', data);
    return response.data;
};
export const updateCategory = async (id, data) => {
    const response = await api.put(`/admin/categories/${id}`, data);
    return response.data;
};
export const deleteCategory = async (id) => {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
};
export const toggleCategoryStatus = async (id) => {
    const response = await api.patch(`/admin/categories/${id}/toggle`);
    return response.data;
};

// Blogs API (matching Laravel base-module /admin/blogs)
export const fetchAdminBlogs = async (params) => {
    const response = await api.get('/admin/blogs', { params });
    return response.data;
};
export const fetchAdminBlogById = async (id, lang = 'en') => {
    const response = await api.get(`/admin/blogs/${id}`, { params: { lang } });
    return response.data;
};
export const createBlog = async (data) => {
    const response = await api.post('/admin/blogs', data);
    return response.data;
};
export const updateBlog = async (id, data) => {
    const response = await api.put(`/admin/blogs/${id}`, data);
    return response.data;
};
export const toggleBlogStatus = async (id, status) => {
    const response = await api.patch(`/admin/blogs/${id}/toggle`, { status });
    return response.data;
};
export const deleteBlog = async (id) => {
    const response = await api.delete(`/admin/blogs/${id}`);
    return response.data;
};

// Backward-compatibility aliases
export const fetchAdminPosts = fetchAdminBlogs;
export const fetchAdminPostById = fetchAdminBlogById;
export const createPost = createBlog;
export const updatePost = updateBlog;
export const togglePostStatus = toggleBlogStatus;
export const deletePost = deleteBlog;

// Activity Logs API
export const fetchActivityLogs = async (params) => {
    const response = await api.get('/admin/logs', { params });
    return response.data;
};

// Settings API
export const fetchAdminSettings = async () => {
    const response = await api.get('/admin/settings');
    return response.data;
};
export const updateAdminSettings = async (data) => {
    const response = await api.post('/admin/settings', data);
    return response.data;
};

// Contact Inquiries API
export const fetchContacts = async () => {
    const response = await api.get('/admin/contacts');
    return response.data;
};
export const replyContactApi = async (id, reply) => {
    const response = await api.post(`/admin/contacts/${id}/reply`, { reply });
    return response.data;
};
export const deleteContactApi = async (id) => {
    const response = await api.delete(`/admin/contacts/${id}`);
    return response.data;
};
export const bulkDeleteContactsApi = async (ids) => {
    const response = await api.post('/admin/contacts/bulk-delete', { ids });
    return response.data;
};

// Language Management API
export const fetchAdminLanguages = async () => {
    const response = await api.get('/admin/languages');
    return response.data;
};
export const fetchLanguageByIdApi = async (id) => {
    const response = await api.get(`/admin/languages/${id}`);
    return response.data;
};
export const fetchActiveLanguagesApi = async () => {
    const response = await api.get('/public/languages');
    return response.data;
};
export const fetchPublicTranslationsApi = async (code) => {
    const response = await api.get(`/public/languages/translations/${code}`);
    return response.data;
};
export const createLanguageApi = async (data) => {
    const response = await api.post('/admin/languages', data);
    return response.data;
};
export const updateLanguageApi = async (id, data) => {
    const response = await api.put(`/admin/languages/${id}`, data);
    return response.data;
};
export const toggleLanguageStatusApi = async (id) => {
    const response = await api.patch(`/admin/languages/${id}/toggle`);
    return response.data;
};
export const toggleLanguageRtlApi = async (id) => {
    const response = await api.patch(`/admin/languages/${id}/rtl`);
    return response.data;
};
export const setDefaultLanguageApi = async (id) => {
    const response = await api.patch(`/admin/languages/${id}/default`);
    return response.data;
};
export const fetchLanguageTranslationsApi = async (id, type = 'web') => {
    const response = await api.get(`/admin/languages/${id}/translations?type=${type}`);
    return response.data;
};
export const updateLanguageTranslationsApi = async (id, translations, type = 'web') => {
    const response = await api.put(`/admin/languages/${id}/translations`, { translations, type });
    return response.data;
};
export const importTranslationsApi = async (data) => {
    const response = await api.post('/admin/languages/import', data);
    return response.data;
};
export const deleteLanguageApi = async (id) => {
    const response = await api.delete(`/admin/languages/${id}`);
    return response.data;
};

// Instagram Token API
export const fetchInstaTokenSettings = async () => {
    const response = await api.get('/admin/setup/insta-token');
    return response.data;
};
export const updateInstaTokenSettings = async (data) => {
    const response = await api.post('/admin/setup/insta-token', data);
    return response.data;
};
// File System & Redis Configuration API
export const fetchFileSystemSettings = async () => {
    const response = await api.get('/admin/file_system');
    return response.data;
};
export const updateFileSystemSettingsApi = async (data) => {
    const response = await api.post('/admin/file_system', data);
    return response.data;
};
export const updateFileSystemActivationApi = async (data) => {
    const response = await api.post('/admin/file_system/activation', data);
    return response.data;
};
export const testRedisConnectionApi = async (data = {}) => {
    const response = await api.post('/admin/file_system/test-redis', data);
    return response.data;
};

// Uploaded Files API (matching Laravel base-module)
export const fetchUploadedFilesApi = async (params = {}) => {
    const response = await api.get('/admin/uploaded-files', { params });
    return response.data;
};

export const fetchFileInfoApi = async (id) => {
    const response = await api.get(`/admin/uploaded-files/info/${id}`);
    return response.data;
};

export const deleteUploadedFileApi = async (id) => {
    const response = await api.delete(`/admin/uploaded-files/${id}`);
    return response.data;
};

export const bulkDeleteUploadedFilesApi = async (ids) => {
    const response = await api.post('/admin/bulk-uploaded-files-delete', { id: ids });
    return response.data;
};

export const fetchFilesByIdsApi = async (ids) => {
    const response = await api.post('/admin/aiz-uploader/get_file_by_ids', { ids });
    return response.data;
};

// User Impersonation API
export const impersonateUserApi = async (userId) => {
    const response = await api.post(`/admin/users/${userId}/impersonate`);
    return response.data;
};

// Staff Management API
export const fetchStaffsApi = async () => {
    const response = await api.get('/admin/staff');
    return response.data;
};
export const createStaffApi = async (data) => {
    const response = await api.post('/admin/staff', data);
    return response.data;
};
export const updateStaffApi = async (id, data) => {
    const response = await api.put(`/admin/staff/${id}`, data);
    return response.data;
};
export const toggleStaffStatusApi = async (id) => {
    const response = await api.patch(`/admin/staff/${id}/toggle`);
    return response.data;
};
export const deleteStaffApi = async (id) => {
    const response = await api.delete(`/admin/staff/${id}`);
    return response.data;
};

// Roles & Permissions API
export const fetchRolesApi = async () => {
    const response = await api.get('/admin/roles');
    return response.data;
};
export const fetchRoleByIdApi = async (id) => {
    const response = await api.get(`/admin/roles/${id}`);
    return response.data;
};
export const fetchAvailablePermissionsApi = async () => {
    const response = await api.get('/admin/roles/permissions/list');
    return response.data;
};
export const createRoleApi = async (data) => {
    const response = await api.post('/admin/roles', data);
    return response.data;
};
export const updateRoleApi = async (id, data) => {
    const response = await api.put(`/admin/roles/${id}`, data);
    return response.data;
};
export const deleteRoleApi = async (id) => {
    const response = await api.delete(`/admin/roles/${id}`);
    return response.data;
};

// Clear Cache API
export const clearAdminCacheApi = async () => {
    const response = await api.post('/admin/clear-cache');
    return response.data;
};

// Unified Website Settings API
export const fetchWebsiteSettingsApi = async (keys = null, lang = 'en') => {
    const params = { lang };
    if (keys) {
        params.keys = Array.isArray(keys) ? keys.join(',') : keys;
    }
    const response = await api.get('/admin/website-settings', { params });
    return response.data;
};

export const updateWebsiteSettingsApi = async (data) => {
    const response = await api.post('/admin/website-settings', data);
    return response.data;
};

// Aliases routing through unified endpoints
export const fetchHomepageSettingsApi = (lang = 'en') => fetchWebsiteSettingsApi([
    'home_slider_images', 'home_slider_links', 'home_slider_heading', 'home_slider_text'
], lang);
export const fetchContactPageSettingsApi = (lang = 'en') => fetchWebsiteSettingsApi([
    'contact_page_phone', 'contact_whatsapp', 'contact_email', 'contact_address', 'contact_hours', 'contact_page_slider_heading', 'contact_page_slider_text', 'contact_page_main_heading', 'contact_page_main_text', 'contact_page_info_heading', 'contact_page_info_text', 'contact_page_form_heading', 'contact_page_form_text'
], lang);
export const fetchAboutPageSettingsApi = (lang = 'en') => fetchWebsiteSettingsApi([
    'about_page_banner_heading', 'about_page_banner_description', 'about_page_main_heading', 'about_page_main_description'
], lang);
export const updateHomepageSettingsApi = updateWebsiteSettingsApi;

export const fetchHeaderSettingsApi = (lang = 'en') => fetchWebsiteSettingsApi([
    'header_logo', 'topbar_banner', 'topbar_banner_link', 'helpline_number',
    'helpine_email', 'helpline_email', 'helpine_whatsapp', 'helpline_whatsapp',
    'show_language_switcher', 'enable_sticky_header', 'header_nav_menu_text',
    'header_menu_labels', 'header_menu_links', 'top_bar_bg_color',
    'header_bg_color'
], lang);
export const updateHeaderSettingsApi = updateWebsiteSettingsApi;

export const fetchFooterSettingsApi = (lang = 'en') => fetchWebsiteSettingsApi([
    'footer_logo', 'about_us_description', 'contact_address', 'contact_phone',
    'contact_email', 'widget_one_title', 'widget_one_labels', 'widget_one_links',
    'widget_two_title', 'widget_two_labels', 'widget_two_links',
    'frontend_copyright_text', 'show_social_links', 'facebook_link', 'twitter_link', 'x_link',
    'instagram_link', 'youtube_link', 'linkedin_link', 'payment_method_images', 'footer_bg_color'
], lang);
export const updateFooterSettingsApi = updateWebsiteSettingsApi;

export const fetchAppearanceSettingsApi = (lang = 'en') => fetchWebsiteSettingsApi([
    'site_name', 'website_name', 'site_motto', 'site_icon', 'system_logo_white',
    'system_logo_black', 'primary_color', 'primary_hover_color', 'secondary_color',
    'meta_title', 'meta_description', 'meta_keywords', 'meta_image',
    'cookies_agreement_text', 'show_cookies_agreement', 'show_website_popup',
    'website_popup_content', 'show_subscribe_form', 'header_script', 'footer_script'
], lang);
export const updateAppearanceSettingsApi = updateWebsiteSettingsApi;

// Website Setup - Pages Management API
export const fetchPagesApi = async (lang = 'en') => {
    const response = await api.get('/admin/pages', { params: { lang } });
    return response.data;
};

export const fetchPageByIdApi = async (id, lang = 'en') => {
    const response = await api.get(`/admin/pages/${id}`, { params: { lang } });
    return response.data;
};

export const createPageApi = async (data) => {
    const response = await api.post('/admin/pages', data);
    return response.data;
};

export const updatePageApi = async (id, data) => {
    const response = await api.put(`/admin/pages/${id}`, data);
    return response.data;
};

export const deletePageApi = async (id) => {
    const response = await api.delete(`/admin/pages/${id}`);
    return response.data;
};

// Setup & Config - SMTP Settings API
export const fetchSmtpSettingsApi = async () => {
    const response = await api.get('/admin/setup/smtp');
    return response.data;
};

export const updateSmtpSettingsApi = async (data) => {
    const response = await api.post('/admin/setup/smtp', data);
    return response.data;
};

export const testSmtpEmailApi = async (email) => {
    const response = await api.post('/admin/setup/smtp/test', { email });
    return response.data;
};

// Setup & Config - Feature Activation API
export const fetchActivationSettingsApi = async () => {
    const response = await api.get('/admin/setup/features');
    return response.data;
};

export const updateActivationSettingApi = async (type, value) => {
    const response = await api.post('/admin/setup/features/toggle', { type, value });
    return response.data;
};

// Setup & Config - Payment Methods API
export const fetchPaymentMethodsApi = async () => {
    const response = await api.get('/admin/setup/payment-methods');
    return response.data;
};

export const updatePaymentMethodsApi = async (data) => {
    const response = await api.post('/admin/setup/payment-methods', data);
    return response.data;
};

// Setup & Config - Google Settings API
export const fetchGoogleSettingsApi = async () => {
    const response = await api.get('/admin/setup/google');
    return response.data;
};

export const updateGoogleSettingsApi = async (data) => {
    const response = await api.post('/admin/setup/google', data);
    return response.data;
};

// Payment Management & Offline Verifications API
export const fetchAdminPaymentsApi = async (params = {}) => {
    const response = await api.get('/admin/payments', {
        params: { all: 'true', ...params }
    });
    return response.data;
};

export const approvePaymentApi = async (id) => {
    const response = await api.put(`/admin/payments/${id}/approve`);
    return response.data;
};

export const rejectPaymentApi = async (id, reason = '') => {
    const response = await api.put(`/admin/payments/${id}/reject`, { reason });
    return response.data;
};
