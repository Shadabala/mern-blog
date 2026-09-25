import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from './LanguageContext';

const SettingsContext = createContext({
    settings: {},
    get_setting: () => null,
    uploaded_asset: () => null,
    refreshSettings: () => Promise.resolve(),
    loading: false
});

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_BASE = API_URL.replace(/\/api\/?$/, '');

// Global cache for access outside React components if needed
let globalSettingsMap = {};

/**
 * Resolve asset URL for an uploaded file (matching Laravel uploaded_asset($id))
 * @param {string|number} idOrPath
 * @returns {string|null}
 */
export const uploaded_asset = (idOrPath) => {
    if (!idOrPath) return null;
    const str = String(idOrPath).trim();
    if (!str || str === 'null' || str === 'undefined') return null;

    // Direct S3/Backblaze bucket URLs are private and return 403 Forbidden.
    // Route them through the backend streaming proxy.
    if (str.includes('.amazonaws.com/')) {
        const afterDomain = str.split('.amazonaws.com/')[1];
        if (afterDomain) {
            const cleanPath = afterDomain.replace(/^\/?(public\/)?/, '');
            return `${BACKEND_BASE}/${cleanPath}`;
        }
    }
    if (str.includes('.backblazeb2.com/')) {
        const afterDomain = str.split('.backblazeb2.com/')[1];
        if (afterDomain) {
            const cleanPath = afterDomain.replace(/^\/?(public\/)?/, '');
            return `${BACKEND_BASE}/${cleanPath}`;
        }
    }

    // Already a full external URL (e.g. CloudFront, custom CDN, external link)
    if (str.startsWith('http://') || str.startsWith('https://')) {
        return str;
    }

    // Relative path clean up
    const cleanPath = str.replace(/\\/g, '/').replace(/^\/?(public\/)?/, '');
    return `${BACKEND_BASE}/${cleanPath}`;
};

/**
 * Get setting value by key (matching Laravel get_setting($key, $default = null))
 * @param {string} key
 * @param {any} [defaultValue=null]
 * @returns {any}
 */
export const get_setting = (key, defaultValue = null) => {
    if (!key) return defaultValue;
    const val = globalSettingsMap[key];
    if (val === undefined || val === null || val === '') {
        return defaultValue;
    }
    return val;
};

export const SettingsProvider = ({ children }) => {
    const { currentLang } = useLanguage();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async (langCode) => {
        try {
            const lang = langCode || currentLang || localStorage.getItem('app_language') || 'en';
            const res = await axios.get(`${API_URL}/public/website-settings`, {
                params: { lang }
            });
            if (res.data && res.data.settingsMap) {
                setSettings(res.data.settingsMap);
                globalSettingsMap = res.data.settingsMap;
            } else if (res.data && res.data.settings) {
                // If returned as array
                const map = {};
                res.data.settings.forEach(s => {
                    let val = s.value;
                    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
                        try { val = JSON.parse(val); } catch {}
                    }
                    map[s.type] = val;
                });
                setSettings(map);
                globalSettingsMap = map;
            }
        } catch (error) {
            console.warn('Failed to load public website settings:', error.message);
        } finally {
            setLoading(false);
        }
    }, [currentLang]);

    useEffect(() => {
        fetchSettings(currentLang);

        const handleSettingsUpdated = () => fetchSettings(currentLang);
        window.addEventListener('website_settings_updated', handleSettingsUpdated);
        return () => window.removeEventListener('website_settings_updated', handleSettingsUpdated);
    }, [currentLang, fetchSettings]);

    // Apply Appearance Settings to DOM (Theme, Meta, Favicon, Title, Custom Scripts)
    useEffect(() => {
        if (!settings || Object.keys(settings).length === 0) return;

        // 1. Dynamic Document Title
        const metaTitle = settings.meta_title;
        const siteName = settings.site_name || settings.website_name;
        const siteMotto = settings.site_motto;
        if (metaTitle) {
            document.title = metaTitle;
        } else if (siteName && siteMotto) {
            document.title = `${siteName} - ${siteMotto}`;
        } else if (siteName) {
            document.title = siteName;
        }

        // 2. Dynamic Favicon (site_icon)
        const siteIcon = settings.site_icon;
        if (siteIcon) {
            const iconUrl = uploaded_asset(siteIcon);
            let favicon = document.querySelector("link[rel~='icon']");
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = iconUrl;
        }

        // 3. Dynamic Meta Tags
        const updateMeta = (name, content, isProperty = false) => {
            if (!content) return;
            const selector = isProperty ? `meta[property='${name}']` : `meta[name='${name}']`;
            let el = document.querySelector(selector);
            if (!el) {
                el = document.createElement('meta');
                if (isProperty) el.setAttribute('property', name);
                else el.setAttribute('name', name);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        if (settings.meta_description) {
            updateMeta('description', settings.meta_description);
            updateMeta('og:description', settings.meta_description, true);
        }
        if (settings.meta_keywords) {
            updateMeta('keywords', settings.meta_keywords);
        }
        if (settings.meta_title || siteName) {
            updateMeta('og:title', settings.meta_title || siteName, true);
        }
        if (settings.meta_image) {
            updateMeta('og:image', uploaded_asset(settings.meta_image), true);
        }

        // 4. Dynamic Theme Colors (CSS Variables)
        if (settings.primary_color) {
            document.documentElement.style.setProperty('--primary-color', settings.primary_color);
        }
        if (settings.primary_hover_color) {
            document.documentElement.style.setProperty('--primary-hover-color', settings.primary_hover_color);
        }
        if (settings.secondary_color) {
            document.documentElement.style.setProperty('--secondary-color', settings.secondary_color);
        }
        if (settings.secondary_hover_color) {
            document.documentElement.style.setProperty('--secondary-hover-color', settings.secondary_hover_color);
        }

        // 5. Custom Header Script
        if (settings.header_script !== undefined) {
            let headerScriptEl = document.getElementById('custom-header-script-container');
            if (!headerScriptEl) {
                headerScriptEl = document.createElement('div');
                headerScriptEl.id = 'custom-header-script-container';
                document.head.appendChild(headerScriptEl);
            }
            headerScriptEl.innerHTML = settings.header_script || '';
        }

        // 6. Custom Footer Script
        if (settings.footer_script !== undefined) {
            let footerScriptEl = document.getElementById('custom-footer-script-container');
            if (!footerScriptEl) {
                footerScriptEl = document.createElement('div');
                footerScriptEl.id = 'custom-footer-script-container';
                document.body.appendChild(footerScriptEl);
            }
            footerScriptEl.innerHTML = settings.footer_script || '';
        }
    }, [settings]);

    const getSettingFn = useCallback((key, defaultValue = null) => {
        if (!key) return defaultValue;
        const val = settings[key];
        if (val === undefined || val === null || val === '') {
            return defaultValue;
        }
        return val;
    }, [settings]);

    return (
        <SettingsContext.Provider value={{
            settings,
            get_setting: getSettingFn,
            uploaded_asset,
            refreshSettings: fetchSettings,
            loading
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);

export default SettingsContext;
