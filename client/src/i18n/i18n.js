import { useLanguage } from '../context/LanguageContext';

/**
 * Universal useTranslation hook powered purely by Database (MongoDB)
 * Matches Laravel translate($key) in base-module.
 */
export const useTranslation = () => {
    const { translate, t, currentLang, changeLanguage, isRtl, languages, refreshTranslations } = useLanguage();
    return {
        t,
        translate,
        i18n: {
            language: currentLang,
            changeLanguage,
            languages,
            dir: () => (isRtl ? 'rtl' : 'ltr')
        },
        refreshTranslations
    };
};

const i18n = { useTranslation };
export default i18n;