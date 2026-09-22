import WebsiteSetting from '../models/WebsiteSetting.js';
import Upload from '../models/Upload.js';
import {
    cacheGet,
    cacheSet,
    cacheDel,
    cacheFlush,
    registerFlushListener
} from '../config/redis.js';

// In-memory cache for settings & uploaded assets with 24-hour default TTL (86400 seconds)
const cacheStore = new Map();

// Register listener to clear local memory when cache is flushed system-wide
registerFlushListener(() => {
    cacheStore.clear();
    uploadMemoryCache.clear();
});

/**
 * Cache remember utility (supporting Redis & In-Memory fallback)
 * @param {string} key
 * @param {number} ttlSeconds
 * @param {Function} callback
 * @returns {Promise<any>}
 */
export const cacheRemember = async (key, ttlSeconds = 86400, callback) => {
    // 1. Check local fast memory store
    const cached = cacheStore.get(key);
    const now = Date.now();

    if (cached && cached.expiry > now) {
        return cached.data;
    }

    // 2. Check Redis cache if enabled/active
    try {
        const redisVal = await cacheGet(key);
        if (redisVal !== null && redisVal !== undefined) {
            cacheStore.set(key, {
                data: redisVal,
                expiry: now + ttlSeconds * 1000
            });
            return redisVal;
        }
    } catch {
        // Fall back to callback
    }

    // 3. Resolve fresh data from callback
    const data = await callback();
    if (data !== undefined && data !== null) {
        cacheStore.set(key, {
            data,
            expiry: now + ttlSeconds * 1000
        });
        await cacheSet(key, data, ttlSeconds).catch(() => {});
    }

    return data;
};

/**
 * Clear specific key or entire cache (mimicking Laravel Artisan::call('cache:clear'))
 * @param {string} [key]
 */
export const clearCache = async (key = null) => {
    if (key) {
        cacheStore.delete(key);
        await cacheDel(key).catch(() => {});
    } else {
        cacheStore.clear();
        uploadMemoryCache.clear();
        await cacheFlush().catch(() => {});
    }
};

export const clearSettingsCache = async () => {
    cacheStore.delete('website_settings');
    await cacheDel('website_settings').catch(() => {});
};

/**
 * Helper to generate URL for an asset filename (mimicking Laravel my_asset())
 * @param {string} fileName
 * @returns {string|null}
 */
export const my_asset = (fileName) => {
    if (!fileName) return null;
    const cleanName = String(fileName).trim().replace(/\\/g, '/');
    if (!cleanName) return null;

    if (cleanName.startsWith('http://') || cleanName.startsWith('https://')) {
        return cleanName;
    }

    const port = process.env.PORT || 8000;
    const baseUrl = (process.env.APP_URL || `http://localhost:${port}`).replace(/\/$/, '');
    const relativePath = cleanName.replace(/^\/?(public\/)?/, '');

    return `${baseUrl}/${relativePath}`;
};

/**
 * Retrieve a website setting by key with caching and language support
 * (Matches Laravel get_setting($key, $default = null, $lang = false))
 *
 * @param {string} key
 * @param {any} [defaultValue=null]
 * @param {string|boolean} [lang=false]
 * @returns {Promise<any>}
 */
export const get_setting = async (key, defaultValue = null, lang = false) => {
    try {
        const settings = await cacheRemember('website_settings', 86400, async () => {
            return await WebsiteSetting.find().lean();
        });

        if (!Array.isArray(settings)) {
            return defaultValue;
        }

        let setting = null;

        if (lang === false || !lang) {
            setting = settings.find(s => s.type === key && (s.lang === null || s.lang === ''))
                || settings.find(s => s.type === key);
        } else {
            const cleanLang = String(lang).toLowerCase().trim();
            setting = settings.find(s => s.type === key && s.lang?.toLowerCase() === cleanLang);
            if (!setting) {
                setting = settings.find(s => s.type === key && (s.lang === null || s.lang === ''))
                    || settings.find(s => s.type === key);
            }
        }

        if (!setting || setting.value === undefined || setting.value === null) {
            return defaultValue;
        }

        let value = setting.value;
        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
            try {
                value = JSON.parse(value);
            } catch {
                // Return raw string if JSON parsing fails
            }
        }

        return value;
    } catch (error) {
        console.error(`Error in get_setting('${key}'):`, error);
        return defaultValue;
    }
};

// Static in-memory cache for uploaded_asset (mimicking static $uploadMemoryCache = [])
const uploadMemoryCache = new Map();

/**
 * Retrieve the full URL for an uploaded file asset by its ID with caching
 * (Matches Laravel uploaded_asset($id))
 *
 * @param {string|number|mongoose.Types.ObjectId} id
 * @returns {Promise<string|null>}
 */
export const uploaded_asset = async (id) => {
    if (!id) {
        return null;
    }

    const idStr = String(id).trim();
    if (!idStr || idStr === 'null' || idStr === 'undefined') {
        return null;
    }

    if (uploadMemoryCache.has(idStr)) {
        return uploadMemoryCache.get(idStr);
    }

    try {
        const assetUrl = await cacheRemember(`upload_asset_url_${idStr}`, 86400, async () => {
            const asset = await Upload.findById(idStr).lean();
            if (!asset) return null;

            if (asset.external_link) {
                return asset.external_link;
            }

            return asset.file_name ? my_asset(asset.file_name) : null;
        });

        uploadMemoryCache.set(idStr, assetUrl);
        return assetUrl;
    } catch (error) {
        console.error(`Error in uploaded_asset('${idStr}'):`, error);
        return null;
    }
};

// Bind to global scope so they are accessible to the whole project without explicit imports
if (typeof global !== 'undefined') {
    global.get_setting = get_setting;
    global.uploaded_asset = uploaded_asset;
    global.my_asset = my_asset;
    global.clearCache = clearCache;
    global.clearSettingsCache = clearSettingsCache;
}

export default {
    get_setting,
    uploaded_asset,
    my_asset,
    cacheRemember,
    clearCache,
    clearSettingsCache
};
