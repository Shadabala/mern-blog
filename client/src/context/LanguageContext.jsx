import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const LanguageContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Missing keys buffer to auto-insert into DB like Laravel translate()
const missingKeysSet = new Set();
let syncTimer = null;

const syncKeysToBackend = () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
        if (missingKeysSet.size > 0) {
            const keys = Array.from(missingKeysSet);
            missingKeysSet.clear();
            try {
                await axios.post(`${API_URL}/public/languages/sync-keys`, { keys });
            } catch (err) {
                // Silently ignore
            }
        }
    }, 2500);
};

export const LanguageProvider = ({ children }) => {
    const [currentLang, setCurrentLang] = useState(() => localStorage.getItem('app_language') || 'en');
    const [languages, setLanguages] = useState([]);
    const [translations, setTranslations] = useState({});
    const [isRtl, setIsRtl] = useState(false);
    const [loading, setLoading] = useState(true);

    // Synchronize HTML attributes exactly matching Laravel blade:
    // @if(\App\Models\Language::where('code', Session::get('locale', Config::get('app.locale')))->first()->rtl == 1)
    // <html dir="rtl" lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    // @else
    // <html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    const applyHtmlAttributes = useCallback((langCode, rtlState) => {
        const formattedLang = String(langCode || 'en').replace('_', '-');
        document.documentElement.setAttribute('lang', formattedLang);

        if (rtlState) {
            document.documentElement.setAttribute('dir', 'rtl');
            document.body.setAttribute('dir', 'rtl');
        } else {
            document.documentElement.removeAttribute('dir');
            document.body.removeAttribute('dir');
        }
    }, []);

    // Fetch active languages list from DB
    const fetchLanguages = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/public/languages`);
            if (res.data && res.data.success && Array.isArray(res.data.languages)) {
                setLanguages(res.data.languages);
                const active = res.data.languages.find((l) => l.code === currentLang || l.app_code === currentLang);
                if (active) {
                    const rtlActive = Boolean(active.rtl === 1 || active.isRtl === true || active.dir === 'RTL');
                    setIsRtl(rtlActive);
                    applyHtmlAttributes(currentLang, rtlActive);
                }
            }
        } catch (err) {
            console.error('Failed to load active languages:', err);
        }
    }, [currentLang, applyHtmlAttributes]);

    // Fetch translations from DB for current language
    const fetchTranslations = useCallback(async (langCode) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/public/languages/translations/${langCode}`);
            if (res.data && res.data.success) {
                setTranslations(res.data.translations || {});
                const rtl = Boolean(res.data.rtl === 1 || res.data.isRtl === true || res.data.dir === 'RTL');
                setIsRtl(rtl);
                applyHtmlAttributes(langCode, rtl);
            }
        } catch (err) {
            console.error(`Failed to load DB translations for ${langCode}:`, err);
        } finally {
            setLoading(false);
        }
    }, [applyHtmlAttributes]);

    useEffect(() => {
        fetchLanguages();
        fetchTranslations(currentLang);
    }, [currentLang, fetchLanguages, fetchTranslations]);

    // Change current language
    const changeLanguage = useCallback((langCode) => {
        const normalized = String(langCode).toLowerCase().trim();
        setCurrentLang(normalized);
        localStorage.setItem('app_language', normalized);
        const active = languages.find((l) => l.code === normalized || l.app_code === normalized);
        const rtl = Boolean(active?.rtl === 1 || active?.isRtl === true || active?.dir === 'RTL');
        setIsRtl(rtl);
        applyHtmlAttributes(normalized, rtl);
        fetchTranslations(normalized);
    }, [fetchTranslations, languages, applyHtmlAttributes]);

    /**
     * Universal translate($key, defaultVal) function
     */
    const translate = useCallback((key, defaultVal = null) => {
        if (!key) return '';
        const cleanKey = String(key).trim();

        // 1. Direct match in translations dictionary
        if (translations && translations[cleanKey] !== undefined && translations[cleanKey] !== '') {
            return translations[cleanKey];
        }

        // 2. DefaultVal match in translations dictionary
        if (defaultVal) {
            const cleanDef = String(defaultVal).trim();
            if (translations && translations[cleanDef] !== undefined && translations[cleanDef] !== '') {
                return translations[cleanDef];
            }
            return defaultVal;
        }

        // 3. Fallback for dotted keys if translation is missing (e.g. 'uploader.uploadNewFile' -> 'Upload New File')
        if (cleanKey.includes('.')) {
            const lastPart = cleanKey.split('.').pop();
            const formatted = lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
            return formatted;
        }

        // Auto-register missing key into DB
        if (!translations || translations[cleanKey] === undefined) {
            missingKeysSet.add(cleanKey);
            syncKeysToBackend();
        }

        return cleanKey;
    }, [translations]);

    const value = useMemo(() => ({
        currentLang,
        languages,
        translations,
        isRtl,
        loading,
        changeLanguage,
        translate,
        t: translate, // Alias for ease of use
        refreshTranslations: () => fetchTranslations(currentLang),
        fetchLanguages,
        refreshLanguages: fetchLanguages
    }), [currentLang, languages, translations, isRtl, loading, changeLanguage, translate, fetchTranslations, fetchLanguages]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        return {
            currentLang: 'en',
            languages: [],
            translations: {},
            isRtl: false,
            loading: false,
            changeLanguage: () => {},
            translate: (k) => k,
            t: (k) => k,
            refreshTranslations: () => {},
            fetchLanguages: () => {},
            refreshLanguages: () => {}
        };
    }
    return context;
};

export default LanguageContext;
