import mongoose from 'mongoose';
import WebsiteSetting from '../models/WebsiteSetting.js';
import ActivityLog from '../models/ActivityLog.js';
import sendEmail from '../utils/sendEmail.js';
import { clearSettingsCache } from '../helpers/Helper.js';
import {
    getEnvPath,
    readEnvFile,
    getEnvValue,
    overWriteEnvFile,
    env_key_update
} from '../utils/envHelper.js';

// Re-export environment helpers for backward compatibility
export { getEnvPath, readEnvFile, getEnvValue, overWriteEnvFile, env_key_update };

/**
 * Helper to safely sync setting to MongoDB only if connected
 */
const syncWebsiteSettingToDb = async (type, value, lang = null) => {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
            const filter = lang ? { type, lang } : { type, $or: [{ lang: null }, { lang: '' }] };
            await WebsiteSetting.findOneAndUpdate(
                filter,
                { $set: { type, value: String(value ?? ''), lang: lang || null } },
                { upsert: true, returnDocument: 'after' }
            );
        } catch {
            // Non-blocking warning
        }
    }
};

/**
 * 1. Feature Activation Settings (Fetched from .env)
 */
export const getActivationSettings = async (req, res) => {
    try {
        const envMap = readEnvFile();
        const settings = {
            FORCE_HTTPS: envMap.FORCE_HTTPS || process.env.FORCE_HTTPS || 'Off',
            maintenance_mode: Number(envMap.MAINTENANCE_MODE ?? envMap.maintenance_mode ?? process.env.MAINTENANCE_MODE ?? 0),
            disable_image_optimization: Number(envMap.DISABLE_IMAGE_OPTIMIZATION ?? envMap.disable_image_optimization ?? process.env.DISABLE_IMAGE_OPTIMIZATION ?? 0),
            wallet_system: Number(envMap.WALLET_SYSTEM ?? envMap.wallet_system ?? process.env.WALLET_SYSTEM ?? 0),
            email_verification: Number(envMap.EMAIL_VERIFICATION ?? envMap.email_verification ?? process.env.EMAIL_VERIFICATION ?? 0),
            facebook_login: Number(envMap.FACEBOOK_LOGIN ?? envMap.facebook_login ?? process.env.FACEBOOK_LOGIN ?? 0),
            google_login: Number(envMap.GOOGLE_LOGIN ?? envMap.google_login ?? process.env.GOOGLE_LOGIN ?? 0)
        };

        return res.status(200).json({
            success: true,
            status: true,
            settings
        });
    } catch (error) {
        console.error('Error fetching activation settings:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch activation settings'
        });
    }
};

/**
 * Update Feature Activation Setting (Saved to .env & WebsiteSetting)
 */
export const updateActivationSetting = async (req, res) => {
    try {
        const { type, value } = req.body;
        if (!type) {
            return res.status(400).json({ success: false, message: 'Type is required' });
        }

        const isChecked = (value === 1 || value === '1' || value === true || value === 'On');
        const numVal = isChecked ? 1 : 0;

        if (type === 'FORCE_HTTPS') {
            const httpsVal = isChecked ? 'On' : 'Off';
            overWriteEnvFile('FORCE_HTTPS', httpsVal);
        } else {
            overWriteEnvFile(type, String(numVal));
        }

        // Keep WebsiteSetting collection synchronized
        await syncWebsiteSettingToDb(type, numVal);

        clearSettingsCache();

        return res.status(200).json({
            success: true,
            status: true,
            message: 'Feature activation updated successfully'
        });
    } catch (error) {
        console.error('Error updating activation setting:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update activation setting'
        });
    }
};

/**
 * 2. SMTP Mail Settings (Fetched from .env)
 */
export const getSmtpSettings = async (req, res) => {
    try {
        const envMap = readEnvFile();
        const settings = {
            MAIL_DRIVER: envMap.MAIL_MAILER || envMap.MAIL_DRIVER || process.env.MAIL_MAILER || process.env.MAIL_DRIVER || 'smtp',
            MAIL_HOST: envMap.MAIL_HOST || process.env.MAIL_HOST || 'smtp.gmail.com',
            MAIL_PORT: envMap.MAIL_PORT || process.env.MAIL_PORT || '587',
            MAIL_USERNAME: envMap.MAIL_USERNAME || process.env.MAIL_USERNAME || '',
            MAIL_PASSWORD: envMap.MAIL_PASSWORD || process.env.MAIL_PASSWORD || '',
            MAIL_ENCRYPTION: envMap.MAIL_ENCRYPTION || process.env.MAIL_ENCRYPTION || 'tls',
            MAIL_FROM_ADDRESS: envMap.MAIL_FROM_ADDRESS || process.env.MAIL_FROM_ADDRESS || '',
            MAIL_FROM_NAME: envMap.MAIL_FROM_NAME || process.env.MAIL_FROM_NAME || process.env.APP_NAME || '',
            MAILGUN_DOMAIN: envMap.MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN || '',
            MAILGUN_SECRET: envMap.MAILGUN_SECRET || process.env.MAILGUN_SECRET || ''
        };

        return res.status(200).json({
            success: true,
            status: true,
            settings
        });
    } catch (error) {
        console.error('Error fetching SMTP settings:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch SMTP settings'
        });
    }
};

/**
 * Update SMTP Settings (Saved to .env & WebsiteSetting)
 */
export const updateSmtpSettings = async (req, res) => {
    try {
        const payload = req.body || {};

        for (const [key, value] of Object.entries(payload)) {
            overWriteEnvFile(key, value);
            if (key === 'MAIL_DRIVER') {
                overWriteEnvFile('MAIL_MAILER', value);
            } else if (key === 'MAIL_MAILER') {
                overWriteEnvFile('MAIL_DRIVER', value);
            }

            // Sync with WebsiteSetting model
            await syncWebsiteSettingToDb(key, value);
        }

        clearSettingsCache();

        return res.status(200).json({
            success: true,
            status: true,
            message: 'SMTP settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating SMTP settings:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update SMTP settings'
        });
    }
};

/**
 * Test SMTP email configuration
 */
export const testSmtpEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const targetEmail = email || (req.user && req.user.email);

        if (!targetEmail) {
            return res.status(400).json({
                success: false,
                message: 'Target email address is required'
            });
        }

        await sendEmail({
            to: targetEmail,
            subject: 'SMTP Configuration Test Email',
            text: 'This is a test email sent from your Base Module admin panel to confirm that your SMTP settings are working.',
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
                <h2 style="color: #2563eb;">SMTP Test Successful!</h2>
                <p>Your SMTP mail settings are configured and functioning correctly.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #64748b;">Sent at: ${new Date().toISOString()}</p>
            </div>`
        });

        return res.status(200).json({
            success: true,
            message: `Test email sent successfully to ${targetEmail}`
        });
    } catch (error) {
        console.error('SMTP test failed:', error);
        return res.status(500).json({
            success: false,
            message: `SMTP test failed: ${error.message}`
        });
    }
};

/**
 * 3. Payment Methods Settings (Fetched from .env)
 */
export const getPaymentMethodSettings = async (req, res) => {
    try {
        const envMap = readEnvFile();
        const settings = {
            STRIPE_KEY: envMap.STRIPE_KEY || process.env.STRIPE_KEY || '',
            STRIPE_SECRET: envMap.STRIPE_SECRET || envMap.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY || '',
            stripe_payment: Number(envMap.STRIPE_PAYMENT ?? envMap.stripe_payment ?? process.env.STRIPE_PAYMENT ?? 1),
            RAZORPAY_KEY: envMap.RAZORPAY_KEY || process.env.RAZORPAY_KEY || '',
            RAZORPAY_SECRET: envMap.RAZORPAY_SECRET || process.env.RAZORPAY_SECRET || '',
            razorpay_payment: Number(envMap.RAZORPAY_PAYMENT ?? envMap.razorpay_payment ?? process.env.RAZORPAY_PAYMENT ?? 0),
            PAYPAL_CLIENT_ID: envMap.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || '',
            PAYPAL_CLIENT_SECRET: envMap.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_CLIENT_SECRET || '',
            paypal_payment: Number(envMap.PAYPAL_PAYMENT ?? envMap.paypal_payment ?? process.env.PAYPAL_PAYMENT ?? 0),
            manual_payment_1_name: envMap.MANUAL_PAYMENT_1_NAME || envMap.manual_payment_1_name || process.env.MANUAL_PAYMENT_1_NAME || 'Bank Transfer / Wire',
            manual_payment_1_instruction: envMap.MANUAL_PAYMENT_1_INSTRUCTION || envMap.manual_payment_1_instruction || process.env.MANUAL_PAYMENT_1_INSTRUCTION || 'Please transfer funds to Account #123456 and email the receipt.',
            manual_payment_1_status: Number(envMap.MANUAL_PAYMENT_1_STATUS ?? envMap.manual_payment_1_status ?? process.env.MANUAL_PAYMENT_1_STATUS ?? 1)
        };

        return res.status(200).json({
            success: true,
            status: true,
            settings
        });
    } catch (error) {
        console.error('Error fetching payment method settings:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch payment method settings'
        });
    }
};

/**
 * Update Payment Methods Settings (Saved to .env & WebsiteSetting)
 */
export const updatePaymentMethodSettings = async (req, res) => {
    try {
        const payload = req.body || {};

        for (const [key, value] of Object.entries(payload)) {
            overWriteEnvFile(key, value);
            if (key.toUpperCase() === 'STRIPE_SECRET') {
                overWriteEnvFile('STRIPE_SECRET_KEY', value);
            }

            // Sync with WebsiteSetting model
            await syncWebsiteSettingToDb(key, value);
        }

        clearSettingsCache();

        return res.status(200).json({
            success: true,
            status: true,
            message: 'Payment method settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating payment method settings:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update payment method settings'
        });
    }
};

/**
 * 4. Google & reCAPTCHA Settings (Fetched from .env)
 */
export const getGoogleSettings = async (req, res) => {
    try {
        const envMap = readEnvFile();
        const settings = {
            google_recaptcha: Number(envMap.GOOGLE_RECAPTCHA ?? envMap.google_recaptcha ?? process.env.GOOGLE_RECAPTCHA ?? 0),
            CAPTCHA_KEY: envMap.CAPTCHA_KEY || envMap.RECAPTCHA_SITE_KEY || process.env.CAPTCHA_KEY || process.env.RECAPTCHA_SITE_KEY || '',
            RECAPTCHA_SECRET_KEY: envMap.RECAPTCHA_SECRET_KEY || process.env.RECAPTCHA_SECRET_KEY || ''
        };

        return res.status(200).json({
            success: true,
            status: true,
            settings
        });
    } catch (error) {
        console.error('Error fetching Google settings:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch Google settings'
        });
    }
};

/**
 * Update Google & reCAPTCHA Settings (Saved to .env & WebsiteSetting)
 */
export const updateGoogleSettings = async (req, res) => {
    try {
        const payload = req.body || {};

        for (const [key, value] of Object.entries(payload)) {
            overWriteEnvFile(key, value);
            if (key.toUpperCase() === 'CAPTCHA_KEY') {
                overWriteEnvFile('RECAPTCHA_SITE_KEY', value);
            }

            // Sync with WebsiteSetting model
            await syncWebsiteSettingToDb(key, value);
        }

        clearSettingsCache();

        return res.status(200).json({
            success: true,
            status: true,
            message: 'Google reCAPTCHA settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating Google settings:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update Google settings'
        });
    }
};

export const getInstaTokenSettings = async (req, res) => {
    try {
        const envMap = readEnvFile();
        const settings = {
            INSTA_FEED: Number(envMap.INSTA_FEED ?? process.env.INSTA_FEED ?? 0),
            INSTAGRAM_USER_ID: envMap.INSTAGRAM_USER_ID || process.env.INSTAGRAM_USER_ID || '',
            INSTAGRAM_ACCESS_TOKEN: envMap.INSTAGRAM_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN || ''
        };

        return res.status(200).json({
            success: true,
            status: true,
            settings
        });
    } catch (error) {
        console.error('Error fetching Google settings:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch Google settings'
        });
    }
};

export const updateInstaTokenSettings = async (req, res) => {
    try {
        const payload = req.body || {};

        for (const [key, value] of Object.entries(payload)) {
            overWriteEnvFile(key, value);
            // Sync with WebsiteSetting model
            await syncWebsiteSettingToDb(key, value);
        }

        clearSettingsCache();

        return res.status(200).json({
            success: true,
            status: true,
            message: 'Instagram settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating Instagram settings:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update Google settings'
        });
    }
};

/**
 * 5. General Website Settings (Fetched from DB & .env)
 */
export const getWebsiteSettings = async (req, res) => {
    try {
        const lang = req.query?.lang || req.headers['x-language-code'] || 'en';
        const cleanLang = lang ? String(lang).toLowerCase().trim() : null;
        let rawKeys = req.query?.keys || req.query?.key || req.query?.types || req.body?.keys;
        let keys = null;

        if (typeof rawKeys === 'string') {
            keys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
        } else if (Array.isArray(rawKeys)) {
            keys = rawKeys.map(k => String(k).trim()).filter(Boolean);
        }

        // Build database query
        let settings = [];
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            const query = {};
            if (keys && keys.length > 0) {
                query.type = { $in: keys };
            }
            if (cleanLang) {
                query.$or = [{ lang: cleanLang }, { lang: null }, { lang: '' }];
            }
            settings = await WebsiteSetting.find(query).lean().catch(() => []);
        }

        const settingsMap = {};
        const envMap = readEnvFile();

        // Helper to parse stored JSON values safely
        const parseValue = (val) => {
            if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
                try { return JSON.parse(val); } catch { return val; }
            }
            return val;
        };

        if (keys && keys.length > 0) {
            keys.forEach(key => {
                const item = cleanLang
                    ? (settings.find(s => s.type === key && s.lang?.toLowerCase() === cleanLang) || settings.find(s => s.type === key))
                    : settings.find(s => s.type === key);

                if (item && item.value !== undefined && item.value !== null) {
                    settingsMap[key] = parseValue(item.value);
                } else if (envMap[key] !== undefined) {
                    settingsMap[key] = envMap[key];
                } else {
                    settingsMap[key] = '';
                }
            });
        } else {
            settings.forEach(s => {
                if (!settingsMap[s.type] || s.lang === cleanLang) {
                    settingsMap[s.type] = parseValue(s.value);
                }
            });
        }

        // Map core environment configurations
        if (envMap.APP_NAME && !settingsMap.site_name) {
            settingsMap.site_name = envMap.APP_NAME;
        }
        if (envMap.APP_TIMEZONE && !settingsMap.timezone) {
            settingsMap.timezone = envMap.APP_TIMEZONE;
        }
        if (envMap.FORCE_HTTPS !== undefined) {
            settingsMap.FORCE_HTTPS = envMap.FORCE_HTTPS;
        }
        if (envMap.FILESYSTEM_DRIVER !== undefined) {
            settingsMap.FILESYSTEM_DRIVER = envMap.FILESYSTEM_DRIVER;
        }

        return res.status(200).json({
            success: true,
            status: true,
            settings: settingsMap,
            settingsMap,
            data: settingsMap
        });
    } catch (error) {
        console.error('Error in getWebsiteSettings:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch website settings',
            error: error.message
        });
    }
};

/**
 * Update General Website Settings (Syncs to DB & .env)
 */
export const updateWebsiteSettings = async (req, res) => {
    try {
        const typesInput = req.body.types || req.body['types[]'];
        let types = [];

        if (Array.isArray(typesInput)) {
            types = typesInput;
        } else if (typeof typesInput === 'string') {
            try {
                const parsed = JSON.parse(typesInput);
                types = Array.isArray(parsed) ? parsed : [typesInput];
            } catch {
                types = typesInput.split(',').map(t => t.trim()).filter(Boolean);
            }
        } else if (req.body.settings && Array.isArray(req.body.settings)) {
            types = req.body.settings.map(s => s.type);
        } else if (req.body && typeof req.body === 'object') {
            types = Object.keys(req.body).filter(k => !['types', 'types[]', 'lang', '_id', '__v'].includes(k));
        }

        const bodyLang = req.body.lang || req.query?.lang || null;

        for (const item of types) {
            let type = item;
            let lang = null;

            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                lang = Object.keys(item)[0];
                type = item[lang];
            } else if (bodyLang) {
                lang = bodyLang;
            }

            if (!type || typeof type !== 'string') continue;
            type = type.trim();

            let reqVal = req.body[type];
            if (reqVal === undefined && typeof item === 'object') {
                reqVal = req.body[Object.values(item)[0]];
            }

            // Sync with system .env for core configuration
            if (type === 'site_name' || type === 'system_name') {
                const val = reqVal !== undefined ? reqVal : (req.body.site_name || req.body.system_name);
                if (val !== undefined) overWriteEnvFile('APP_NAME', val);
            } else if (type === 'timezone' || type === 'time_zone') {
                const val = reqVal !== undefined ? reqVal : (req.body.timezone || req.body.time_zone);
                if (val !== undefined) overWriteEnvFile('APP_TIMEZONE', val);
            } else if (type === 'FORCE_HTTPS') {
                overWriteEnvFile('FORCE_HTTPS', (reqVal === '1' || reqVal === 1 || reqVal === true || reqVal === 'On') ? 'On' : 'Off');
            } else if (type === 'FILESYSTEM_DRIVER') {
                overWriteEnvFile('FILESYSTEM_DRIVER', (reqVal === 's3' || reqVal === 'aws') ? 's3' : 'local');
            } else if (type.startsWith('AWS_') || type.startsWith('REDIS_') || type.startsWith('MAIL_') || type.startsWith('STRIPE_') || type.startsWith('RAZORPAY_') || type.startsWith('PAYPAL_')) {
                if (reqVal !== undefined) {
                    overWriteEnvFile(type, reqVal);
                }
            }

            // Format boolean / switch default
            if (reqVal === undefined) {
                if (type.startsWith('show_') || type.startsWith('enable_')) {
                    reqVal = 'off';
                } else {
                    reqVal = '';
                }
            } else if (typeof reqVal === 'boolean') {
                reqVal = reqVal ? 'on' : 'off';
            }

            let valueToSave;
            if (typeof reqVal === 'object' && reqVal !== null) {
                valueToSave = JSON.stringify(reqVal);
            } else {
                valueToSave = reqVal !== undefined && reqVal !== null ? String(reqVal) : '';
            }

            // Upsert into WebsiteSetting table
            await syncWebsiteSettingToDb(type, valueToSave, lang);
        }

        // Record activity log
        if (req.user && mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                await ActivityLog.create({
                    user: req.user._id,
                    userName: req.user.name || req.user.username,
                    userRole: req.user.role || 'admin',
                    action: 'Updated Website Settings',
                    module: 'website_settings',
                    ipAddress: req.ip || '',
                    details: 'Updated website settings'
                });
            } catch { }
        }

        clearSettingsCache();

        return res.status(200).json({
            success: true,
            status: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error in updateWebsiteSettings:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Aliases and backward compatibility
export const getHomepageSettings = getWebsiteSettings;
export const getHeaderSettings = getWebsiteSettings;
export const getFooterSettings = getWebsiteSettings;
export const getAppearanceSettings = getWebsiteSettings;

export const update = updateWebsiteSettings;
export const updateSettings = updateWebsiteSettings;
export const updateActivationSettings = updateActivationSetting;
export const payment_method_update = updatePaymentMethodSettings;
export const google_settings_update = updateGoogleSettings;
export const google_recaptcha_update = updateGoogleSettings;
export const google_firebase_update = updateGoogleSettings;
export const google_file_update = updateGoogleSettings;
export const google_play = getGoogleSettings;

export default {
    getWebsiteSettings,
    updateWebsiteSettings,
    getActivationSettings,
    updateActivationSetting,
    getSmtpSettings,
    updateSmtpSettings,
    testSmtpEmail,
    getPaymentMethodSettings,
    updatePaymentMethodSettings,
    getGoogleSettings,
    updateGoogleSettings,
    getEnvPath,
    readEnvFile,
    getEnvValue,
    overWriteEnvFile,
    env_key_update,
    getInstaTokenSettings,
    updateInstaTokenSettings
};
