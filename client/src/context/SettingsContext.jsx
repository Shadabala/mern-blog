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

    // Already a full external URL
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
