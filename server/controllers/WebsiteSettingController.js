import WebsiteSetting from '../models/WebsiteSetting.js';
import Language from '../models/Language.js';
import Category from '../models/Category.js';
import ActivityLog from '../models/ActivityLog.js';
import sendEmail from '../utils/sendEmail.js';

const resolveLanguageInfo = async (requestedLang) => {
    let defaultDoc = null;
    try {
        defaultDoc = await Language.findOne({ isDefault: true }) || await Language.findOne({ isActive: true });
    } catch {
        defaultDoc = null;
    }
    const defaultLang = (defaultDoc?.code || 'en').toLowerCase().trim();

    const cleanReq = requestedLang ? String(requestedLang).toLowerCase().trim() : defaultLang;
    let langDoc = null;
    try {
        langDoc = await Language.findOne({
            $or: [{ code: cleanReq }, { app_code: cleanReq }]
        });
    } catch {
        langDoc = null;
    }

    const candidateLangs = new Set([cleanReq]);
    if (langDoc) {
        if (langDoc.code) candidateLangs.add(langDoc.code.toLowerCase());
        if (langDoc.app_code) candidateLangs.add(langDoc.app_code.toLowerCase());
    }

    const currentLang = langDoc?.code || cleanReq;
    const isDefault = Boolean(
        langDoc?.isDefault ||
        currentLang === defaultLang ||
        (langDoc?.app_code && langDoc.app_code === defaultLang)
    );

    return {
        currentLang,
        defaultLang,
        candidateLangs: Array.from(candidateLangs),
        isDefault
    };
};

const getDefaultLanguageCode = async () => {
    try {
        const defaultLang = await Language.findOne({ isDefault: true });
        return defaultLang ? defaultLang.code : 'en';
    } catch {
        return 'en';
    }
};

/**
 * Helper to get settings map for specific keys and language fallback
 */
const getSettingsMap = async (keys, requestedLang) => {
    const { currentLang, defaultLang, candidateLangs } = await resolveLanguageInfo(requestedLang);

    const settings = await WebsiteSetting.find({
        type: { $in: keys },
        $or: [
            { lang: { $in: candidateLangs } },
            { lang: null },
            { lang: '' },
            { lang: defaultLang }
        ]
    });

    const result = {};
    keys.forEach(key => {
        // Priority 1: Localized candidate match
        const localized = settings.find(s => s.type === key && candidateLangs.includes(s.lang));
        // Priority 2: Null / empty (universal fallback)
        const fallbackNull = settings.find(s => s.type === key && (s.lang === null || s.lang === ''));
        // Priority 3: Default language
        const fallbackDefault = settings.find(s => s.type === key && s.lang === defaultLang);
        // Priority 4: Any matching record
        const match = localized || fallbackNull || fallbackDefault || settings.find(s => s.type === key);

        if (match) {
            try {
                result[key] = typeof match.value === 'string' && (match.value.startsWith('[') || match.value.startsWith('{'))
                    ? JSON.parse(match.value)
                    : match.value;
            } catch {
                result[key] = match.value;
            }
        } else {
            result[key] = '';
        }
    });

    return { result, currentLang, defaultLang, candidateLangs };
};

/**
 * =========================================================================
 * HOMEPAGE SETTINGS
 * =========================================================================
 */
export const getHomepageSettings = async (req, res) => {
    try {
        const { lang: requestedLang } = req.query;
        const homepageKeys = [
            'home_slider_images',
            'home_slider_links',
            'home_banner1_images',
            'home_banner1_links',
            'home_banner2_images',
            'home_banner2_links',
            'top10_categories',
            'featured_categories',
            'flash_deal_title',
            'flash_deal_status'
        ];

        const { result, currentLang, candidateLangs } = await getSettingsMap(homepageKeys, requestedLang);

        if (!Array.isArray(result.home_slider_images)) result.home_slider_images = [];
        if (!Array.isArray(result.home_slider_links)) result.home_slider_links = [];
        if (!Array.isArray(result.home_banner2_images)) result.home_banner2_images = ['', ''];
        if (!Array.isArray(result.home_banner2_links)) result.home_banner2_links = ['', ''];
        if (!Array.isArray(result.top10_categories)) result.top10_categories = [];
        if (!Array.isArray(result.featured_categories)) result.featured_categories = [];

        result.lang = currentLang;

        const categories = await Category.find({ status: true })
            .populate('category_translations')
            .select('name slug _id category_translations')
            .sort({ order_level: -1 });

        const mappedCategories = categories.map(cat => {
            const trans = (cat.category_translations || []).find(t => candidateLangs.includes(t.lang?.toLowerCase()));
            return {
                _id: cat._id,
                id: cat._id,
                name: trans?.name || cat.name,
                slug: cat.slug
            };
        });

        return res.status(200).json({
            success: true,
            settings: result,
            categories: mappedCategories
        });
    } catch (error) {
        console.error('Error fetching homepage settings:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch homepage settings',
            error: error.message
        });
    }
};

export const updateHomepageSettings = async (req, res) => {
    try {
        const {
            lang: requestedLang,
            home_slider_images,
            home_slider_links,
            home_banner1_images,
            home_banner1_links,
            home_banner2_images,
            home_banner2_links,
            top10_categories,
            featured_categories,
            flash_deal_title,
            flash_deal_status
        } = req.body;

        const { currentLang, defaultLang, candidateLangs, isDefault } = await resolveLanguageInfo(requestedLang);

        const updates = {
            home_slider_images: Array.isArray(home_slider_images) ? JSON.stringify(home_slider_images) : home_slider_images,
            home_slider_links: Array.isArray(home_slider_links) ? JSON.stringify(home_slider_links) : home_slider_links,
            home_banner1_images: typeof home_banner1_images === 'object' ? JSON.stringify(home_banner1_images) : (home_banner1_images || ''),
            home_banner1_links: typeof home_banner1_links === 'object' ? JSON.stringify(home_banner1_links) : (home_banner1_links || ''),
            home_banner2_images: Array.isArray(home_banner2_images) ? JSON.stringify(home_banner2_images) : home_banner2_images,
            home_banner2_links: Array.isArray(home_banner2_links) ? JSON.stringify(home_banner2_links) : home_banner2_links,
            top10_categories: Array.isArray(top10_categories) ? JSON.stringify(top10_categories) : top10_categories,
            featured_categories: Array.isArray(featured_categories) ? JSON.stringify(featured_categories) : featured_categories,
            flash_deal_title: flash_deal_title || '',
            flash_deal_status: flash_deal_status !== undefined ? flash_deal_status : true
        };

        // Capture any other homepage/website setting key sent in body
        for (const [key, val] of Object.entries(req.body)) {
            if (key !== 'lang' && updates[key] === undefined && val !== undefined) {
                updates[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
            }
        }

        for (const [type, value] of Object.entries(updates)) {
            if (value !== undefined) {
                for (const l of candidateLangs) {
                    await WebsiteSetting.findOneAndUpdate(
                        { type, lang: l },
                        { $set: { type, value, lang: l } },
                        { upsert: true, returnDocument: 'after' }
                    );
                }

                if (isDefault) {
                    await WebsiteSetting.findOneAndUpdate(
                        { type, lang: null },
                        { $set: { type, value, lang: null } },
                        { upsert: true, returnDocument: 'after' }
                    );
                }
            }
        }

        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: 'Updated Homepage Settings',
                module: 'website_settings',
                ipAddress: req.ip || '',
                details: `Updated homepage settings for language [${currentLang}]`
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Homepage settings has been updated successfully'
        });
    } catch (error) {
        console.error('Error updating homepage settings:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update homepage settings',
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
        const { lang: requestedLang } = req.query;
        const headerKeys = [
            'header_logo',
            'topbar_banner',
            'topbar_banner_medium',
            'topbar_banner_small',
            'topbar_banner_link',
            'helpline_number',
            'header_nav_menu_text',
            'header_menu_labels',
            'header_menu_links',
            'show_language_switcher',
            'show_currency_switcher'
        ];

        const { result, currentLang } = await getSettingsMap(headerKeys, requestedLang);

        if (!Array.isArray(result.header_menu_labels)) result.header_menu_labels = [];
        if (!Array.isArray(result.header_menu_links)) result.header_menu_links = [];
        if (!result.header_nav_menu_text) result.header_nav_menu_text = 'light';

        result.lang = currentLang;

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

export const updateHeaderSettings = async (req, res) => {
    try {
        const {
            lang: requestedLang,
            header_logo,
            topbar_banner,
            topbar_banner_medium,
            topbar_banner_small,
            topbar_banner_link,
            helpline_number,
            header_nav_menu_text,
            header_menu_labels,
            header_menu_links,
            show_language_switcher,
            show_currency_switcher
        } = req.body;

        const { currentLang, defaultLang, candidateLangs, isDefault } = await resolveLanguageInfo(requestedLang);

        const updates = {
            header_logo: header_logo || '',
            topbar_banner: topbar_banner || '',
            topbar_banner_medium: topbar_banner_medium || '',
            topbar_banner_small: topbar_banner_small || '',
            topbar_banner_link: topbar_banner_link || '',
            helpline_number: helpline_number || '',
            header_nav_menu_text: header_nav_menu_text || 'light',
            header_menu_labels: Array.isArray(header_menu_labels) ? JSON.stringify(header_menu_labels) : header_menu_labels,
            header_menu_links: Array.isArray(header_menu_links) ? JSON.stringify(header_menu_links) : header_menu_links,
            show_language_switcher: show_language_switcher !== undefined ? show_language_switcher : 'on',
            show_currency_switcher: show_currency_switcher !== undefined ? show_currency_switcher : 'on'
        };

        for (const [type, value] of Object.entries(updates)) {
            if (value !== undefined) {
                for (const l of candidateLangs) {
                    await WebsiteSetting.findOneAndUpdate(
                        { type, lang: l },
                        { $set: { type, value, lang: l } },
                        { upsert: true, returnDocument: 'after' }
                    );
                }

                if (isDefault) {
                    await WebsiteSetting.findOneAndUpdate(
                        { type, lang: null },
                        { $set: { type, value, lang: null } },
                        { upsert: true, returnDocument: 'after' }
                    );
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Header settings updated successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update header settings',
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
        const { lang: requestedLang } = req.query;
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

        const { result, currentLang } = await getSettingsMap(footerKeys, requestedLang);

        if (!Array.isArray(result.widget_one_labels)) result.widget_one_labels = [];
        if (!Array.isArray(result.widget_one_links)) result.widget_one_links = [];
        if (!Array.isArray(result.widget_two_labels)) result.widget_two_labels = [];
        if (!Array.isArray(result.widget_two_links)) result.widget_two_links = [];
        if (!Array.isArray(result.payment_method_images)) result.payment_method_images = [];

        result.lang = currentLang;

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

export const updateFooterSettings = async (req, res) => {
    try {
        const {
            lang: requestedLang,
            footer_logo,
            about_us_description,
            contact_address,
            contact_phone,
            contact_email,
            widget_one_title,
            widget_one_labels,
            widget_one_links,
            widget_two_title,
            widget_two_labels,
            widget_two_links,
            frontend_copyright_text,
            show_social_links,
            facebook_link,
            twitter_link,
            instagram_link,
            youtube_link,
            linkedin_link,
            payment_method_images
        } = req.body;

        const { currentLang, defaultLang, candidateLangs, isDefault } = await resolveLanguageInfo(requestedLang);

        const updates = {
            footer_logo: footer_logo || '',
            about_us_description: about_us_description || '',
            contact_address: contact_address || '',
            contact_phone: contact_phone || '',
            contact_email: contact_email || '',
            widget_one_title: widget_one_title || '',
            widget_one_labels: Array.isArray(widget_one_labels) ? JSON.stringify(widget_one_labels) : widget_one_labels,
            widget_one_links: Array.isArray(widget_one_links) ? JSON.stringify(widget_one_links) : widget_one_links,
            widget_two_title: widget_two_title || '',
            widget_two_labels: Array.isArray(widget_two_labels) ? JSON.stringify(widget_two_labels) : widget_two_labels,
            widget_two_links: Array.isArray(widget_two_links) ? JSON.stringify(widget_two_links) : widget_two_links,
            frontend_copyright_text: frontend_copyright_text || '',
            show_social_links: show_social_links !== undefined ? show_social_links : 'on',
            facebook_link: facebook_link || '',
            twitter_link: twitter_link || '',
            instagram_link: instagram_link || '',
            youtube_link: youtube_link || '',
            linkedin_link: linkedin_link || '',
            payment_method_images: Array.isArray(payment_method_images) ? JSON.stringify(payment_method_images) : payment_method_images
        };

        for (const [type, value] of Object.entries(updates)) {
            if (value !== undefined) {
                for (const l of candidateLangs) {
                    await WebsiteSetting.findOneAndUpdate(
                        { type, lang: l },
                        { $set: { type, value, lang: l } },
                        { upsert: true, returnDocument: 'after' }
                    );
                }

                if (isDefault) {
                    await WebsiteSetting.findOneAndUpdate(
                        { type, lang: null },
                        { $set: { type, value, lang: null } },
                        { upsert: true, returnDocument: 'after' }
                    );
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Footer settings updated successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update footer settings',
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

        const { result } = await getSettingsMap(appearanceKeys, 'en');

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

export const updateAppearanceSettings = async (req, res) => {
    try {
        const payload = req.body;

        for (const [type, value] of Object.entries(payload)) {
            if (value !== undefined) {
                const storedValue = typeof value === 'object' ? JSON.stringify(value) : value;
                await WebsiteSetting.findOneAndUpdate(
                    { type, lang: null },
                    { $set: { type, value: storedValue, lang: null } },
                    { upsert: true, new: true }
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Appearance settings updated successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update appearance settings',
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

export const updateActivationSetting = async (req, res) => {
    try {
        const { type, value } = req.body;

        if (!type) {
            return res.status(400).json({
                success: false,
                message: 'Feature type is required'
            });
        }

        await WebsiteSetting.findOneAndUpdate(
            { type, lang: null },
            { $set: { type, value: value === 1 || value === true || value === '1' || value === 'On' ? 1 : 0, lang: null } },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Feature setting updated successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update feature setting',
            error: error.message
        });
    }
};

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

export const updatePaymentMethodSettings = async (req, res) => {
    try {
        const payload = req.body;

        for (const [type, value] of Object.entries(payload)) {
            if (value !== undefined) {
                await WebsiteSetting.findOneAndUpdate(
                    { type, lang: null },
                    { $set: { type, value: typeof value === 'boolean' ? (value ? 1 : 0) : String(value), lang: null } },
                    { upsert: true, new: true }
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Payment method configuration updated successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update payment settings',
            error: error.message
        });
    }
};

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

export const updateGoogleSettings = async (req, res) => {
    try {
        const payload = req.body;

        for (const [type, value] of Object.entries(payload)) {
            if (value !== undefined) {
                await WebsiteSetting.findOneAndUpdate(
                    { type, lang: null },
                    { $set: { type, value: typeof value === 'boolean' ? (value ? 1 : 0) : String(value), lang: null } },
                    { upsert: true, new: true }
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Configuration updated successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
};

/**
 * =========================================================================
 * GENERIC WEBSITE SETTINGS CRUD
 * =========================================================================
 */
export const getWebsiteSettings = async (req, res) => {
    try {
        const { lang } = req.query;
        const query = lang ? { $or: [{ lang }, { lang: null }] } : {};
        const settings = await WebsiteSetting.find(query);

        return res.status(200).json({
            success: true,
            settings
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateWebsiteSettings = async (req, res) => {
    try {
        const { settings, lang } = req.body;

        if (Array.isArray(settings)) {
            for (const item of settings) {
                await WebsiteSetting.findOneAndUpdate(
                    { type: item.type, lang: lang || null },
                    { $set: { type: item.type, value: item.value, lang: lang || null } },
                    { upsert: true, new: true }
                );
            }
        } else if (typeof settings === 'object' && settings !== null) {
            for (const [type, value] of Object.entries(settings)) {
                await WebsiteSetting.findOneAndUpdate(
                    { type, lang: lang || null },
                    { $set: { type, value, lang: lang || null } },
                    { upsert: true, new: true }
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Website settings updated successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
