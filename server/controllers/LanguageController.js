import Language from '../models/Language.js';
import Translation from '../models/Translation.js';
import { defaultTranslations } from '../data/defaultTranslations.js';
import { clearTranslationCache } from '../helpers/translationHelper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load base json files if present to populate initial DB
const loadLocaleJson = (langCode) => {
    try {
        const filePath = path.resolve(__dirname, `../../client/public/locales/${langCode}/translation.json`);
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        // Fallback
    }
    return {};
};

const flattenObject = (obj, prefix = '') => {
    let result = {};
    for (const [key, value] of Object.entries(obj || {})) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value, newKey));
        } else {
            result[newKey] = String(value ?? '');
        }
    }
    return result;
};

// Seed default languages and populate Translation table in MongoDB
export const seedDefaultLanguages = async () => {
    try {
        const langCount = await Language.countDocuments();
        if (langCount === 0) {
            await Language.insertMany([
                {
                    name: 'English',
                    code: 'en',
                    app_code: 'en',
                    flag: 'us',
                    dir: 'LTR',
                    isRtl: false,
                    isDefault: true,
                    isActive: true
                },
                {
                    name: 'Hindi (हिन्दी)',
                    code: 'in',
                    app_code: 'hi',
                    flag: 'in',
                    dir: 'LTR',
                    isRtl: false,
                    isDefault: false,
                    isActive: true
                },
                {
                    name: 'Arabic (العربية)',
                    code: 'sa',
                    app_code: 'ar',
                    flag: 'sa',
                    dir: 'RTL',
                    isRtl: true,
                    isDefault: false,
                    isActive: true
                }
            ]);
        }

        // Seed Translation collection if empty
        const transCount = await Translation.countDocuments();
        if (transCount === 0 && defaultTranslations) {
            const docs = [];
            for (const [key, val] of Object.entries(defaultTranslations)) {
                const enVal = val.en || key;
                const hiVal = val.hi || enVal;
                const arVal = val.ar || enVal;

                docs.push({ lang: 'en', lang_key: key, lang_value: enVal });
                docs.push({ lang: 'in', lang_key: key, lang_value: hiVal });
                docs.push({ lang: 'hi', lang_key: key, lang_value: hiVal });
                docs.push({ lang: 'sa', lang_key: key, lang_value: arVal });
                docs.push({ lang: 'ar', lang_key: key, lang_value: arVal });
            }

            if (docs.length > 0) {
                await Translation.insertMany(docs, { ordered: false }).catch(() => {});
            }
        }
    } catch (err) {
        console.error('Error seeding languages & translations:', err);
    }
};

// Get all languages (Admin)
export const getAllLanguages = async (req, res) => {
    try {
        await seedDefaultLanguages();
        const languages = await Language.find().sort({ isDefault: -1, createdAt: 1 });
        return res.status(200).json({
            success: true,
            languages
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch languages',
            error: error.message
        });
    }
};

// Get public active languages
export const getActiveLanguages = async (req, res) => {
    try {
        await seedDefaultLanguages();
        const languages = await Language.find({ isActive: true })
            .select('name code app_code flag dir isRtl rtl isDefault isActive')
            .sort({ isDefault: -1, name: 1 });
        return res.status(200).json({
            success: true,
            languages
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch active languages',
            error: error.message
        });
    }
};

// Get translation dictionary for public frontend from MongoDB directly
export const getTranslationsByCode = async (req, res) => {
    try {
        await seedDefaultLanguages();
        const { code } = req.params;
        const normalized = (code || 'en').toLowerCase().trim();

        const language = await Language.findOne({
            $or: [{ code: normalized }, { app_code: normalized }]
        }) || await Language.findOne({ isDefault: true }) || { code: 'en', isRtl: false, dir: 'LTR' };

        // Fetch translations for this language from MongoDB
        const targetTranslations = await Translation.find({
            lang: { $in: [normalized, language.code, language.app_code] }
        });

        // Also fetch English default keys to fill any untranslated gaps
        const englishTranslations = await Translation.find({ lang: 'en' });

        const dictionary = {};
        for (const item of englishTranslations) {
            dictionary[item.lang_key] = item.lang_value || item.lang_key;
        }
        for (const item of targetTranslations) {
            if (item.lang_value && item.lang_value.trim() !== '') {
                dictionary[item.lang_key] = item.lang_value;
            }
        }

        const isRtlLang = Boolean(language.isRtl || language.dir === 'RTL' || language.rtl === 1);

        return res.status(200).json({
            success: true,
            code: language.code || normalized,
            app_code: language.app_code || normalized,
            isRtl: isRtlLang,
            rtl: language.rtl || (isRtlLang ? 1 : 0),
            dir: language.dir || (isRtlLang ? 'RTL' : 'LTR'),
            translations: dictionary
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch translations',
            error: error.message
        });
    }
};

// Get language translation key-values (for Admin Editor)
export const getLanguageTranslations = async (req, res) => {
    try {
        const { id } = req.params;

        const language = await Language.findById(id);
        if (!language) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        // Fetch all base English keys from MongoDB
        const allKeys = await Translation.find({ lang: 'en' });
        const defaultKeysMap = {};
        for (const item of allKeys) {
            defaultKeysMap[item.lang_key] = item.lang_value || item.lang_key;
        }

        // Fetch target translations
        const targetKeys = await Translation.find({
            lang: { $in: [language.code, language.app_code] }
        });
        const targetKeysMap = {};
        for (const item of targetKeys) {
            targetKeysMap[item.lang_key] = item.lang_value;
        }

        return res.status(200).json({
            success: true,
            language: {
                _id: language._id,
                name: language.name,
                code: language.code,
                app_code: language.app_code,
                isRtl: language.isRtl,
                dir: language.dir
            },
            defaultKeys: defaultKeysMap,
            translations: targetKeysMap
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch translations',
            error: error.message
        });
    }
};

// Update translations directly in MongoDB Translation collection
export const updateLanguageTranslations = async (req, res) => {
    try {
        const { id } = req.params;
        const { translations } = req.body;

        if (!translations || typeof translations !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid translations payload' });
        }

        const language = await Language.findById(id);
        if (!language) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        const flatData = flattenObject(translations);
        const operations = [];

        for (const [key, value] of Object.entries(flatData)) {
            operations.push({
                updateOne: {
                    filter: { lang: language.code, lang_key: key },
                    update: { $set: { lang: language.code, lang_key: key, lang_value: value } },
                    upsert: true
                }
            });
            if (language.app_code && language.app_code !== language.code) {
                operations.push({
                    updateOne: {
                        filter: { lang: language.app_code, lang_key: key },
                        update: { $set: { lang: language.app_code, lang_key: key, lang_value: value } },
                        upsert: true
                    }
                });
            }
        }

        if (operations.length > 0) {
            await Translation.bulkWrite(operations);
        }

        clearTranslationCache();

        return res.status(200).json({
            success: true,
            message: 'Translations successfully saved into MongoDB database',
            language
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update translations',
            error: error.message
        });
    }
};

// Auto-register missing keys into DB dynamically
export const syncMissingKeys = async (req, res) => {
    try {
        const { keys } = req.body;
        if (Array.isArray(keys)) {
            for (const key of keys) {
                if (key && typeof key === 'string') {
                    const cleanKey = key.trim();
                    await Translation.findOneAndUpdate(
                        { lang: 'en', lang_key: cleanKey },
                        { $setOnInsert: { lang: 'en', lang_key: cleanKey, lang_value: cleanKey } },
                        { upsert: true }
                    ).catch(() => {});
                }
            }
        }
        return res.status(200).json({ success: true, message: 'Keys synchronized with DB' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Create new language
export const createLanguage = async (req, res) => {
    try {
        const { name, code, app_code, flag, dir, isRtl, isActive } = req.body;

        if (!name || !code) {
            return res.status(400).json({ success: false, message: 'Name and Code are required' });
        }

        const normalizedCode = code.toLowerCase().trim();
        const existing = await Language.findOne({ code: normalizedCode });
        if (existing) {
            return res.status(400).json({ success: false, message: `Language code "${code}" already exists` });
        }

        const resolvedIsRtl = isRtl !== undefined ? Boolean(isRtl) : dir === 'RTL';
        const resolvedDir = resolvedIsRtl ? 'RTL' : (dir || 'LTR');

        const language = await Language.create({
            name: name.trim(),
            code: normalizedCode,
            app_code: (app_code || code).toLowerCase().trim(),
            flag: flag || '🌐',
            dir: resolvedDir,
            isRtl: resolvedIsRtl,
            isActive: isActive !== undefined ? isActive : true,
            isDefault: false
        });

        // Copy English default keys into new language in DB
        const englishKeys = await Translation.find({ lang: 'en' });
        const newTranslations = englishKeys.map(k => ({
            lang: normalizedCode,
            lang_key: k.lang_key,
            lang_value: ''
        }));
        if (newTranslations.length > 0) {
            await Translation.insertMany(newTranslations, { ordered: false }).catch(() => {});
        }

        return res.status(201).json({
            success: true,
            message: 'Language created and initialized in database successfully',
            language
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create language',
            error: error.message
        });
    }
};

// Get single language by ID
export const getLanguageById = async (req, res) => {
    try {
        const { id } = req.params;
        const language = await Language.findById(id);
        if (!language) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }
        return res.status(200).json({
            success: true,
            language
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch language',
            error: error.message
        });
    }
};

// Update language meta details
export const updateLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, app_code, flag, dir, isRtl, isActive } = req.body;

        const language = await Language.findById(id);
        if (!language) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        if (code && code.toLowerCase().trim() !== language.code) {
            if (language.isDefault || language.code === 'en') {
                return res.status(400).json({ success: false, message: 'Default/English language code cannot be edited' });
            }
            const duplicate = await Language.findOne({ code: code.toLowerCase().trim(), _id: { $ne: id } });
            if (duplicate) {
                return res.status(400).json({ success: false, message: 'This code is already used for another language' });
            }
            language.code = code.toLowerCase().trim();
        }

        if (name) language.name = name.trim();
        if (app_code) language.app_code = app_code.toLowerCase().trim();
        if (flag) language.flag = flag;

        if (isRtl !== undefined) {
            language.isRtl = Boolean(isRtl);
            language.dir = language.isRtl ? 'RTL' : 'LTR';
        } else if (dir) {
            language.dir = dir;
            language.isRtl = dir === 'RTL';
        }

        if (isActive !== undefined && !language.isDefault) {
            language.isActive = Boolean(isActive);
        }

        await language.save();

        return res.status(200).json({
            success: true,
            message: 'Language updated successfully',
            language
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update language',
            error: error.message
        });
    }
};

// Toggle active status
export const toggleLanguageStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const language = await Language.findById(id);

        if (!language) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        if (language.isDefault) {
            return res.status(400).json({ success: false, message: 'Cannot disable the default system language' });
        }

        language.isActive = !language.isActive;
        await language.save();

        return res.status(200).json({
            success: true,
            message: `Language ${language.isActive ? 'activated' : 'deactivated'} successfully`,
            language
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle status',
            error: error.message
        });
    }
};

// Toggle RTL
export const toggleLanguageRtl = async (req, res) => {
    try {
        const { id } = req.params;
        const language = await Language.findById(id);

        if (!language) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        language.isRtl = !language.isRtl;
        language.dir = language.isRtl ? 'RTL' : 'LTR';
        await language.save();

        return res.status(200).json({
            success: true,
            message: `Language RTL set to ${language.isRtl ? 'RTL' : 'LTR'}`,
            language
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle RTL',
            error: error.message
        });
    }
};

// Set default language
export const setDefaultLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        const target = await Language.findById(id);

        if (!target) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        // Unset previous defaults
        await Language.updateMany({}, { isDefault: false });

        target.isDefault = true;
        target.isActive = true;
        await target.save();

        return res.status(200).json({
            success: true,
            message: `${target.name} set as default system language`,
            language: target
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to set default language',
            error: error.message
        });
    }
};

// Import Translations (ARB / JSON) directly into MongoDB
export const importTranslations = async (req, res) => {
    try {
        const { id, rawContent, langCode } = req.body;

        let targetLanguage = null;
        if (id) {
            targetLanguage = await Language.findById(id);
        } else if (langCode) {
            targetLanguage = await Language.findOne({ $or: [{ code: langCode }, { app_code: langCode }] });
        } else {
            targetLanguage = await Language.findOne({ isDefault: true });
        }

        if (!targetLanguage) {
            return res.status(404).json({ success: false, message: 'Target language not found' });
        }

        let parsedData = {};
        if (typeof rawContent === 'string') {
            try {
                parsedData = JSON.parse(rawContent);
            } catch (err) {
                return res.status(400).json({ success: false, message: 'Invalid JSON/ARB file format' });
            }
        } else if (typeof rawContent === 'object') {
            parsedData = rawContent;
        }

        const flatData = flattenObject(parsedData);
        const operations = [];

        for (const [key, value] of Object.entries(flatData)) {
            operations.push({
                updateOne: {
                    filter: { lang: targetLanguage.code, lang_key: key },
                    update: { $set: { lang: targetLanguage.code, lang_key: key, lang_value: value } },
                    upsert: true
                }
            });
        }

        if (operations.length > 0) {
            await Translation.bulkWrite(operations);
        }

        clearTranslationCache();

        return res.status(200).json({
            success: true,
            message: `Translations successfully imported into MongoDB for ${targetLanguage.name}`,
            language: targetLanguage
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to import translations',
            error: error.message
        });
    }
};

// Export translations JSON from MongoDB
export const exportTranslations = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query;

        const language = await Language.findById(id);
        if (!language) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        const records = await Translation.find({
            lang: { $in: [language.code, language.app_code] }
        });

        const data = {};
        for (const item of records) {
            data[item.lang_key] = item.lang_value || '';
        }

        const filename = type === 'app'
            ? `app_${language.app_code || language.code}.arb`
            : `${language.code}_translation.json`;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.status(200).send(JSON.stringify(data, null, 2));
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to export translations',
            error: error.message
        });
    }
};

// Delete language and its MongoDB translations
export const deleteLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        const language = await Language.findById(id);

        if (!language) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        if (language.isDefault) {
            return res.status(400).json({ success: false, message: 'Cannot delete default system language' });
        }

        await Language.findByIdAndDelete(id);
        await Translation.deleteMany({ lang: { $in: [language.code, language.app_code] } });

        clearTranslationCache();

        return res.status(200).json({
            success: true,
            message: 'Language and its database translations deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete language',
            error: error.message
        });
    }
};
