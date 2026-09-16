import Translation from '../models/Translation.js';
import Language from '../models/Language.js';

// Fast in-memory cache for translations
const translationCache = new Map();

/**
 * Dynamic translate helper function matching Laravel translate($key, $lang)
 * Looks up translation in MongoDB. If key doesn't exist, auto-inserts it into DB!
 */
export const translate = async (key, lang = null) => {
    if (!key) return '';
    const cleanKey = String(key).trim();
    if (!cleanKey) return '';

    let targetLang = lang;
    if (!targetLang) {
        const defaultLang = await Language.findOne({ isDefault: true }).catch(() => null);
        targetLang = defaultLang ? defaultLang.code : 'en';
    }
    targetLang = targetLang.toLowerCase().trim();

    const cacheKey = `${targetLang}:${cleanKey}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

    try {
        let entry = await Translation.findOne({ lang: targetLang, lang_key: cleanKey });

        if (!entry) {
            // Auto-insert into DB
            entry = await Translation.create({
                lang: targetLang,
                lang_key: cleanKey,
                lang_value: targetLang === 'en' ? cleanKey : ''
            });

            // Ensure key exists for English default
            if (targetLang !== 'en') {
                await Translation.findOneAndUpdate(
                    { lang: 'en', lang_key: cleanKey },
                    { $setOnInsert: { lang: 'en', lang_key: cleanKey, lang_value: cleanKey } },
                    { upsert: true }
                ).catch(() => {});
            }
        }

        const resolvedValue = entry && entry.lang_value && entry.lang_value.trim() !== ''
            ? entry.lang_value
            : cleanKey;

        translationCache.set(cacheKey, resolvedValue);
        return resolvedValue;
    } catch (err) {
        return cleanKey;
    }
};

/**
 * Clear the translation cache when translations are updated in DB
 */
export const clearTranslationCache = () => {
    translationCache.clear();
};

/**
 * Resolve language candidates from request (query, headers, or default)
 * Dynamically queries MongoDB Language model to match both code and app_code.
 */
export const resolveLanguageCandidates = async (req) => {
    try {
        const rawRequested = req?.query?.lang || req?.headers?.['x-language-code'] || req?.headers?.['accept-language'];
        let cleanReq = rawRequested ? String(rawRequested).split(',')[0].trim().toLowerCase() : null;
        if (cleanReq && cleanReq.includes(';')) {
            cleanReq = cleanReq.split(';')[0].trim();
        }
        if (cleanReq && cleanReq.includes('-')) {
            cleanReq = cleanReq.split('-')[0].trim();
        }

        let langDoc = null;
        if (cleanReq) {
            langDoc = await Language.findOne({
                $or: [{ code: cleanReq }, { app_code: cleanReq }]
            });
        }

        if (!langDoc) {
            langDoc = await Language.findOne({ isDefault: true }) || await Language.findOne({ isActive: true });
        }

        const candidates = new Set();
        if (langDoc) {
            if (langDoc.code) candidates.add(langDoc.code.toLowerCase());
            if (langDoc.app_code) candidates.add(langDoc.app_code.toLowerCase());
        }
        if (cleanReq) {
            candidates.add(cleanReq);
        }

        const candidateList = Array.from(candidates);
        return {
            primaryCode: langDoc?.code || cleanReq || 'en',
            candidates: candidateList.length > 0 ? candidateList : ['en']
        };
    } catch (err) {
        return {
            primaryCode: 'en',
            candidates: ['en']
        };
    }
};
