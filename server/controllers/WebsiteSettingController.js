import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import WebsiteSetting from '../models/WebsiteSetting.js';
import Category from '../models/Category.js';
import ActivityLog from '../models/ActivityLog.js';
import sendEmail from '../utils/sendEmail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getEnvPath = () => {
    const serverEnv = path.resolve(__dirname, '../.env');
    if (fs.existsSync(serverEnv)) return serverEnv;
    const rootEnv = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(rootEnv)) return rootEnv;
    return serverEnv;
};

export const getStoragePath = (relativePath = '') => {
    return path.resolve(__dirname, '../storage', relativePath);
};

/**
 * overWrite the Env File values (matching Laravel overWriteEnvFile)
 * @param  {string} type - Env key name
 * @param  {string} val - Env value
 */
export const overWriteEnvFile = (type, val) => {
    if (process.env.DEMO_MODE === 'On') {
        return;
    }
    const envPath = getEnvPath();
    if (!fs.existsSync(envPath)) {
        return;
    }

    const trimmedVal = val !== undefined && val !== null ? String(val).trim() : '';
    const formattedVal = `"${trimmedVal}"`;
    let content = fs.readFileSync(envPath, 'utf8');

    const escapedKey = type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedKey}\\s*=.*$`, 'm');

    if (regex.test(content)) {
        content = content.replace(regex, `${type}=${formattedVal}`);
    } else {
        content += (content.endsWith('\n') ? '' : '\r\n') + `${type}=${formattedVal}\r\n`;
    }

    fs.writeFileSync(envPath, content, 'utf8');
    process.env[type] = trimmedVal;
};

/**
 * overWrite the Env File values for Google / Firebase (matching Laravel overWriteEnvFileGoogle)
 * @param  {string} key
 * @param  {string} value
 */
export const overWriteEnvFileGoogle = (key, value) => {
    const envPath = getEnvPath();
    if (!fs.existsSync(envPath)) {
        return;
    }

    const cleanVal = value !== undefined && value !== null ? String(value).replace(/^["']|["']$/g, '').trim() : '';
    const newLine = `${key}=${cleanVal}`;
    let envContent = fs.readFileSync(envPath, 'utf8');

    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escapedKey}\\s*=.*$`, 'm');

    if (pattern.test(envContent)) {
        envContent = envContent.replace(pattern, newLine);
    } else {
        envContent += (envContent.endsWith('\n') ? '' : '\r\n') + newLine + '\r\n';
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    process.env[key] = cleanVal;
};


/**
 * Helper to get settings map for specific keys
 */
const getSettingsMap = async (keys, requestedLang = null) => {
    const cleanLang = requestedLang ? String(requestedLang).toLowerCase().trim() : null;
    const query = { type: { $in: keys } };
    if (cleanLang) {
        query.$or = [{ lang: cleanLang }, { lang: null }, { lang: '' }];
    }

    const settings = await WebsiteSetting.find(query);
    const result = {};

    keys.forEach(key => {
        const item = cleanLang
            ? (settings.find(s => s.type === key && s.lang?.toLowerCase() === cleanLang) || settings.find(s => s.type === key))
            : settings.find(s => s.type === key);

        if (item) {
            try {
                result[key] = typeof item.value === 'string' && (item.value.startsWith('[') || item.value.startsWith('{'))
                    ? JSON.parse(item.value)
                    : item.value;
            } catch {
                result[key] = item.value;
            }
        } else {
            result[key] = '';
        }
    });

    return { result };
};

/**
 * =========================================================================
 * HOMEPAGE SETTINGS
 * =========================================================================
 */
export const getHomepageSettings = async (req, res) => {
    try {
        const homepageKeys = [
            'home_slider_images',
            'home_slider_links',
        ];

        const { result } = await getSettingsMap(homepageKeys, req.query?.lang);

        if (!Array.isArray(result.home_slider_images)) result.home_slider_images = [];
        if (!Array.isArray(result.home_slider_links)) result.home_slider_links = [];

        const categories = await Category.find({ status: true })
            .select('name slug _id')
            .sort({ order_level: -1 });

        return res.status(200).json({
            success: true,
            settings: result,
            categories
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch homepage settings',
            error: error.message
        });
    }
};

/**
 * =========================================================================
 * HEADER SETTINGS
 * =========================================================================
 */
export const getHeaderSettings = async (req, res) => {
    try {
        const headerKeys = [
            'header_logo',
            'topbar_banner',
            'topbar_banner_link',
            'helpline_number',
            'helpine_email',
            'helpline_email',
            'helpine_whatsapp',
            'helpline_whatsapp',
            'show_language_switcher',
            'enable_sticky_header',
            'header_nav_menu_text',
            'header_menu_labels',
            'header_menu_links'
        ];

        const { result } = await getSettingsMap(headerKeys, req.query?.lang);

        if (!Array.isArray(result.header_menu_labels)) result.header_menu_labels = [];
        if (!Array.isArray(result.header_menu_links)) result.header_menu_links = [];
        if (!result.header_nav_menu_text) result.header_nav_menu_text = 'light';

        if (!result.helpine_email && result.helpline_email) {
            result.helpine_email = result.helpline_email;
        }
        if (!result.helpine_whatsapp && result.helpline_whatsapp) {
            result.helpine_whatsapp = result.helpline_whatsapp;
        }

        return res.status(200).json({
            success: true,
            settings: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch header settings',
            error: error.message
        });
    }
};

/**
 * =========================================================================
 * FOOTER SETTINGS
 * =========================================================================
 */
export const getFooterSettings = async (req, res) => {
    try {
        const footerKeys = [
            'footer_logo',
            'about_us_description',
            'contact_address',
            'contact_phone',
            'contact_email',
            'widget_one_title',
            'widget_one_labels',
            'widget_one_links',
            'widget_two_title',
            'widget_two_labels',
            'widget_two_links',
            'frontend_copyright_text',
            'show_social_links',
            'facebook_link',
            'twitter_link',
            'instagram_link',
            'youtube_link',
            'linkedin_link',
            'seller_app_link',
            'delivery_boy_app_link',
            'payment_method_images'
        ];

        const { result } = await getSettingsMap(footerKeys, req.query?.lang);

        if (!Array.isArray(result.widget_one_labels)) result.widget_one_labels = [];
        if (!Array.isArray(result.widget_one_links)) result.widget_one_links = [];
        if (!Array.isArray(result.widget_two_labels)) result.widget_two_labels = [];
        if (!Array.isArray(result.widget_two_links)) result.widget_two_links = [];
        if (!Array.isArray(result.payment_method_images)) result.payment_method_images = [];

        return res.status(200).json({
            success: true,
            settings: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch footer settings',
            error: error.message
        });
    }
};

/**
 * =========================================================================
 * APPEARANCE SETTINGS
 * =========================================================================
 */
export const getAppearanceSettings = async (req, res) => {
    try {
        const appearanceKeys = [
            'site_name',
            'website_name',
            'site_motto',
            'site_icon',
            'system_logo_white',
            'system_logo_black',
            'primary_color',
            'primary_hover_color',
            'secondary_color',
            'meta_title',
            'meta_description',
            'meta_keywords',
            'meta_image',
            'cookies_agreement_text',
            'show_cookies_agreement',
            'show_website_popup',
            'website_popup_content',
            'show_subscribe_form',
            'header_script',
            'footer_script'
        ];

        const { result } = await getSettingsMap(appearanceKeys, req.query?.lang);

        return res.status(200).json({
            success: true,
            settings: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch appearance settings',
            error: error.message
        });
    }
};

/**
 * =========================================================================
 * SMTP & EMAIL CONFIGURATION
 * =========================================================================
 */
export const getSmtpSettings = async (req, res) => {
    try {
        const smtpKeys = [
            'MAIL_DRIVER',
            'MAIL_HOST',
            'MAIL_PORT',
            'MAIL_USERNAME',
            'MAIL_PASSWORD',
            'MAIL_ENCRYPTION',
            'MAIL_FROM_ADDRESS',
            'MAIL_FROM_NAME',
            'MAILGUN_DOMAIN',
            'MAILGUN_SECRET'
        ];

        const { result } = await getSettingsMap(smtpKeys, 'en');

        // Fallback to process.env if not in DB yet
        const finalSettings = {
            MAIL_DRIVER: result.MAIL_DRIVER || process.env.MAIL_MAILER || 'smtp',
            MAIL_HOST: result.MAIL_HOST || process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
            MAIL_PORT: result.MAIL_PORT || process.env.MAIL_PORT || process.env.SMTP_PORT || '587',
            MAIL_USERNAME: result.MAIL_USERNAME || process.env.MAIL_USERNAME || process.env.SMTP_USER || '',
            MAIL_PASSWORD: result.MAIL_PASSWORD || process.env.MAIL_PASSWORD || process.env.SMTP_PASS || '',
            MAIL_ENCRYPTION: result.MAIL_ENCRYPTION || process.env.MAIL_ENCRYPTION || 'tls',
            MAIL_FROM_ADDRESS: result.MAIL_FROM_ADDRESS || process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM_EMAIL || '',
            MAIL_FROM_NAME: result.MAIL_FROM_NAME || process.env.MAIL_FROM_NAME || process.env.SMTP_FROM_NAME || 'Base Blog',
            MAILGUN_DOMAIN: result.MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN || '',
            MAILGUN_SECRET: result.MAILGUN_SECRET || process.env.MAILGUN_SECRET || ''
        };

        return res.status(200).json({
            success: true,
            settings: finalSettings
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch SMTP settings',
            error: error.message
        });
    }
};

export const updateSmtpSettings = async (req, res) => {
    try {
        const payload = req.body;

        for (const [type, value] of Object.entries(payload)) {
            if (value !== undefined) {
                await WebsiteSetting.findOneAndUpdate(
                    { type, lang: null },
                    { $set: { type, value: String(value), lang: null } },
                    { upsert: true, new: true }
                );

                // Update process.env live for running app
                process.env[type] = String(value);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'SMTP settings updated successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update SMTP settings',
            error: error.message
        });
    }
};

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
            text: 'Hello! This is a test email sent from your Base Module admin panel to confirm that your SMTP mail settings are functioning correctly.',
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
                <h2 style="color: #2563eb;">SMTP Test Successful!</h2>
                <p>Hello,</p>
                <p>This is a verification email from your application. Your SMTP settings have been configured successfully!</p>
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
 * =========================================================================
 * FEATURE ACTIVATION SETTINGS
 * =========================================================================
 */
export const getActivationSettings = async (req, res) => {
    try {
        const activationKeys = [
            'FORCE_HTTPS',
            'maintenance_mode',
            'disable_image_optimization',
            'vendor_system_activation',
            'classified_product',
            'wallet_system',
            'email_verification',
            'facebook_login',
            'google_login',
            'twitter_login',
            'apple_login',
            'club_point',
            'pickup_point'
        ];

        const { result } = await getSettingsMap(activationKeys, 'en');

        return res.status(200).json({
            success: true,
            settings: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch feature activation settings',
            error: error.message
        });
    }
};

/**
 * Update activation settings in .env file (matching Laravel updateActivationSettingsInEnv)
 * @param {string} type
 * @param {any} value
 */
export const updateActivationSettingsInEnv = (type, value) => {
    const isValTrue = (value === '1' || value === 1 || value === true || value === 'On' || value === 's3');

    if (type === 'FORCE_HTTPS' && isValTrue) {
        overWriteEnvFile(type, 'On');
        const appUrl = process.env.APP_URL || '';
        if (appUrl.includes('http:')) {
            overWriteEnvFile('APP_URL', appUrl.replace('http:', 'https:'));
        }
    } else if (type === 'FORCE_HTTPS' && !isValTrue) {
        overWriteEnvFile(type, 'Off');
        const appUrl = process.env.APP_URL || '';
        if (appUrl.includes('https:')) {
            overWriteEnvFile('APP_URL', appUrl.replace('https:', 'http:'));
        }
    } else if (type === 'FILESYSTEM_DRIVER' && isValTrue) {
        overWriteEnvFile(type, 's3');
    } else if (type === 'FILESYSTEM_DRIVER' && !isValTrue) {
        overWriteEnvFile(type, 'local');
    }

    return '1';
};

/**
 * Update feature activation settings (matching Laravel updateActivationSettings)
 */
export const updateActivationSettings = async (req, res) => {
    try {
        const { type, value } = req.body;

        if (!type) {
            return res.status(400).json({
                success: false,
                message: 'Feature type is required'
            });
        }

        const envChanges = ['FORCE_HTTPS', 'FILESYSTEM_DRIVER'];
        if (envChanges.includes(type)) {
            updateActivationSettingsInEnv(type, value);
        }

        const isValTrue = (value === 1 || value === '1' || value === true || value === 'On' || value === 's3');
        const numericVal = isValTrue ? 1 : 0;

        await WebsiteSetting.findOneAndUpdate(
            { type, lang: null },
            { $set: { type, value: numericVal, lang: null } },
            { upsert: true, returnDocument: 'after' }
        );

        if (req.headers['x-requested-with'] === 'XMLHttpRequest' && !req.headers.accept?.includes('application/json')) {
            return res.status(200).send('1');
        }

        return res.status(200).json({
            success: true,
            status: 1,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating activation setting:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update feature setting',
            error: error.message
        });
    }
};

export const updateActivationSetting = updateActivationSettings;


/**
 * =========================================================================
 * PAYMENT METHODS SETTINGS
 * =========================================================================
 */
export const getPaymentMethodSettings = async (req, res) => {
    try {
        const paymentKeys = [
            'PAYPAL_CLIENT_ID',
            'PAYPAL_CLIENT_SECRET',
            'paypal_sandbox',
            'paypal_payment',
            'STRIPE_KEY',
            'STRIPE_SECRET',
            'stripe_payment',
            'RAZORPAY_KEY',
            'RAZORPAY_SECRET',
            'razorpay_payment',
            'PAYSTACK_PUBLIC_KEY',
            'PAYSTACK_SECRET_KEY',
            'paystack_payment',
            'manual_payment_1_name',
            'manual_payment_1_instruction',
            'manual_payment_1_status'
        ];

        const { result } = await getSettingsMap(paymentKeys, 'en');

        return res.status(200).json({
            success: true,
            settings: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch payment settings',
            error: error.message
        });
    }
};

/**
 * Update payment method configuration and env credentials (matching Laravel payment_method_update)
 */
export const payment_method_update = async (req, res) => {
    try {
        const { types, payment_method } = req.body;

        // Update env variables from types array if provided
        if (Array.isArray(types)) {
            for (const type of types) {
                if (typeof type === 'string' && req.body[type] !== undefined) {
                    overWriteEnvFile(type, req.body[type]);
                    await WebsiteSetting.findOneAndUpdate(
                        { type, lang: null },
                        { $set: { type, value: String(req.body[type]), lang: null } },
                        { upsert: true, returnDocument: 'after' }
                    );
                }
            }
        }

        // Handle sandbox and payment toggle for the specific payment method
        if (payment_method) {
            const sandboxKey = `${payment_method}_sandbox`;
            const isSandbox = (req.body[sandboxKey] == 1 || req.body[sandboxKey] === true || req.body[sandboxKey] === '1' || req.body[sandboxKey] === 'on') ? 1 : 0;
            await WebsiteSetting.findOneAndUpdate(
                { type: sandboxKey, lang: null },
                { $set: { type: sandboxKey, value: isSandbox, lang: null } },
                { upsert: true, returnDocument: 'after' }
            );

            const paymentKey = `${payment_method}_payment`;
            if (req.body[paymentKey] !== undefined) {
                const isEnabled = (req.body[paymentKey] == 1 || req.body[paymentKey] === true || req.body[paymentKey] === '1' || req.body[paymentKey] === 'on') ? 1 : 0;
                await WebsiteSetting.findOneAndUpdate(
                    { type: paymentKey, lang: null },
                    { $set: { type: paymentKey, value: isEnabled, lang: null } },
                    { upsert: true, returnDocument: 'after' }
                );
            }
        }

        // Also process any direct payload fields
        for (const [key, value] of Object.entries(req.body)) {
            if (key === 'types' || key === 'payment_method') continue;
            if (value !== undefined) {
                const isEnvKey = ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'STRIPE_KEY', 'STRIPE_SECRET', 'RAZORPAY_KEY', 'RAZORPAY_SECRET', 'PAYSTACK_PUBLIC_KEY', 'PAYSTACK_SECRET_KEY'].includes(key);
                if (isEnvKey) {
                    overWriteEnvFile(key, value);
                }
                const formattedVal = typeof value === 'boolean' ? (value ? 1 : 0) : String(value);
                await WebsiteSetting.findOneAndUpdate(
                    { type: key, lang: null },
                    { $set: { type: key, value: formattedVal, lang: null } },
                    { upsert: true, returnDocument: 'after' }
                );
            }
        }

        return res.status(200).json({
            success: true,
            status: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error in payment_method_update:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update payment settings',
            error: error.message
        });
    }
};

export const paymentMethodUpdate = payment_method_update;
export const updatePaymentMethodSettings = payment_method_update;

/**
 * =========================================================================
 * GOOGLE CONFIGURATION (reCAPTCHA, Analytics, Firebase) & FACEBOOK PIXEL
 * =========================================================================
 */
export const getGoogleSettings = async (req, res) => {
    try {
        const googleKeys = [
            'google_recaptcha',
            'CAPTCHA_KEY',
            'RECAPTCHA_SECRET_KEY',
            'google_analytics',
            'TRACKING_ID',
            'facebook_pixel',
            'FACEBOOK_PIXEL_ID',
            'google_firebase',
            'FIREBASE_API_KEY',
            'FIREBASE_PROJECT_ID'
        ];

        const { result } = await getSettingsMap(googleKeys, 'en');

        return res.status(200).json({
            success: true,
            settings: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch Google settings',
            error: error.message
        });
    }
};

export async function updateGoogleSettings(req, res) {
    return updateWebsiteSettings(req, res);
}

export async function google_recaptcha_update(req, res) {
    return updateWebsiteSettings(req, res);
}

export const googleRecaptchaUpdate = google_recaptcha_update;

/**
 * Update Google Firebase settings (matching Laravel google_firebase_update)
 */
export const google_firebase_update = async (req, res) => {
    try {
        const types = req.body.types || [];
        if (Array.isArray(types)) {
            for (const type of types) {
                if (typeof type === 'string' && req.body[type] !== undefined) {
                    overWriteEnvFileGoogle(type, req.body[type]);
                    await WebsiteSetting.findOneAndUpdate(
                        { type, lang: null },
                        { $set: { type, value: String(req.body[type]), lang: null } },
                        { upsert: true, returnDocument: 'after' }
                    );
                }
            }
        }

        const isFirebaseEnabled = (req.body.google_firebase == 1 || req.body.google_firebase === true || req.body.google_firebase === '1' || req.body.google_firebase === 'on') ? 1 : 0;
        await WebsiteSetting.findOneAndUpdate(
            { type: 'google_firebase', lang: null },
            { $set: { type: 'google_firebase', value: isFirebaseEnabled, lang: null } },
            { upsert: true, returnDocument: 'after' }
        );

        return res.status(200).json({
            success: true,
            status: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error in google_firebase_update:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const googleFirebaseUpdate = google_firebase_update;

/**
 * Update Google external files like firebase / google-play JSON (matching Laravel google_file_update)
 */
export const google_file_update = async (req, res) => {
    try {
        const files = {
            fcm_content: path.join('external', 'kash-firebase.json'),
            google_play_content: path.join('external', 'kash-google-play.json'),
        };

        for (const [requestKey, relativePath] of Object.entries(files)) {
            if (req.body[requestKey] !== undefined) {
                const content = typeof req.body[requestKey] === 'object'
                    ? JSON.stringify(req.body[requestKey], null, 2)
                    : String(req.body[requestKey]);

                const filePath = getStoragePath(relativePath);
                const directory = path.dirname(filePath);

                if (!fs.existsSync(directory)) {
                    fs.mkdirSync(directory, { recursive: true });
                }

                fs.writeFileSync(filePath, content, 'utf8');
            }
        }

        return res.status(200).json({
            success: true,
            status: true,
            message: 'File updated successfully'
        });
    } catch (error) {
        console.error('Error in google_file_update:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const googleFileUpdate = google_file_update;

/**
 * Read Google Play configuration JSON file content (matching Laravel google_play)
 */
export const google_play = async (req, res) => {
    try {
        const filePath = getStoragePath(path.join('external', 'kash-google-play.json'));
        const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

        return res.status(200).json({
            success: true,
            content
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update environment keys directly (matching Laravel env_key_update)
 */
export const env_key_update = async (req, res) => {
    try {
        const types = req.body.types || [];
        if (Array.isArray(types)) {
            for (const type of types) {
                if (typeof type === 'string' && req.body[type] !== undefined) {
                    overWriteEnvFile(type, req.body[type]);
                }
            }
        }

        return res.status(200).json({
            success: true,
            status: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error in env_key_update:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const envKeyUpdate = env_key_update;

/**
 * Clear system / application cache (matching Laravel clearCache)
 */
export const clearCache = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            status: true,
            message: 'Cache cleared successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const clear_cache = clearCache;

/**
 * =========================================================================
 * GENERIC WEBSITE SETTINGS CRUD
 * =========================================================================
 */
export const getWebsiteSettings = async (req, res) => {
    try {
        const { lang } = req.query;
        const query = lang ? { $or: [{ lang }, { lang: null }, { lang: '' }] } : {};
        const settings = await WebsiteSetting.find(query).lean();

        const settingsMap = {};
        settings.forEach(s => {
            let val = s.value;
            if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
                try { val = JSON.parse(val); } catch {}
            }
            if (!settingsMap[s.type] || s.lang === lang) {
                settingsMap[s.type] = val;
            }
        });

        return res.status(200).json({
            success: true,
            settings,
            settingsMap
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update website settings & synchronize system env keys (matching Laravel update(Request $request))
 * Single unified method used for updating and inserting type, value, lang with timestamp
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
                types = [typesInput];
            }
        } else if (Array.isArray(req.body.settings)) {
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

            if (type === 'site_name') {
                const val = req.body[type] !== undefined ? req.body[type] : (req.body.site_name || req.body.system_name);
                if (val !== undefined) {
                    overWriteEnvFile('APP_NAME', val);
                }
            } else if (type === 'timezone' || type === 'time_zone') {
                const val = req.body[type] !== undefined ? req.body[type] : (req.body.timezone || req.body.time_zone);
                if (val !== undefined) {
                    overWriteEnvFile('APP_TIMEZONE', val);
                }
            } else {
                let settings = null;
                if (lang) {
                    settings = await WebsiteSetting.findOne({ type, lang });
                    if (!settings && (lang === 'en' || lang === 'null')) {
                        settings = await WebsiteSetting.findOne({ type, lang: null });
                    }
                } else {
                    settings = await WebsiteSetting.findOne({ type, $or: [{ lang: null }, { lang: '' }] })
                        || await WebsiteSetting.findOne({ type });
                }

                let reqVal = req.body[type];
                if (reqVal === undefined && typeof item === 'object') {
                    reqVal = req.body[Object.values(item)[0]];
                }

                // Handle switch/checkbox default if sent in types
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

                if (settings != null) {
                    settings.value = valueToSave;
                    settings.lang = lang;
                    await settings.save();
                } else {
                    settings = new WebsiteSetting({
                        type: type,
                        value: valueToSave,
                        lang: lang
                    });
                    await settings.save();
                }
            }
        }

        if (req.user) {
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
            } catch {
                // Ignore activity log failure
            }
        }

        if (typeof clearSettingsCache === 'function') {
            clearSettingsCache();
        }

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

export const update = updateWebsiteSettings;


