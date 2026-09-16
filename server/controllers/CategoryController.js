import Category from '../models/Category.js';
import CategoryTranslation from '../models/CategoryTranslation.js';
import Language from '../models/Language.js';
import User from '../models/User.js';
import { resolveLanguageCandidates } from '../helpers/translationHelper.js';

/**
 * Get all active languages for translation tabs
 */
const getDefaultLanguageCode = async () => {
    try {
        const defaultLang = await Language.findOne({ isDefault: true });
        return defaultLang ? defaultLang.code : 'en';
    } catch {
        return 'en';
    }
};

/**
 * Create a new Category matching Laravel CategoryController@store
 */
export const categoryCreate = async (req, res) => {
    try {
        const {
            name,
            parent_id,
            order_level,
            icon,
            meta_title,
            meta_description,
            slug: requestedSlug,
            lang: requestedLang
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        const defaultLang = await getDefaultLanguageCode();
        const currentLang = requestedLang || defaultLang;

        // Generate or clean slug
        let slug = requestedSlug
            ? requestedSlug.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
            : name.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

        if (!slug) {
            slug = 'category-' + Date.now();
        }

        let existingCategory = await Category.findOne({ slug });
        let i = 1;
        while (existingCategory) {
            slug = `${slug}-${i}`;
            existingCategory = await Category.findOne({ slug });
            i++;
        }

        const category = new Category({
            name: name.trim(),
            slug,
            parent_id: parent_id && parent_id !== '0' && parent_id !== '' ? parent_id : null,
            order_level: Number(order_level) || 0,
            icon: icon || '',
            meta_title: meta_title || '',
            meta_description: meta_description || '',
            status: true,
            username: req.user?.username || 'admin'
        });

        await category.save();

        // Save CategoryTranslation
        await CategoryTranslation.findOneAndUpdate(
            { category_id: category._id, lang: currentLang },
            { $set: { category_id: category._id, lang: currentLang, name: name.trim() } },
            { upsert: true, new: true }
        );

        return res.status(201).json({
            success: true,
            message: 'Category has been created successfully',
            category
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create category'
        });
    }
};

/**
 * Get Category by ID with specific language translation (matching edit form with lang tab)
 */
export const categoryGetById = async (req, res) => {
    try {
        const { id } = req.params;
        const { primaryCode, candidates } = await resolveLanguageCandidates(req);

        const category = await Category.findById(id).populate('category_translations').populate('parent_id', 'name slug');

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const translation = (category.category_translations || []).find(t => candidates.includes(t.lang?.toLowerCase()));
        const localizedName = translation?.name || category.name;

        return res.status(200).json({
            success: true,
            category: {
                ...category.toObject(),
                name: localizedName,
                translated_name: localizedName,
                selected_lang: primaryCode
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch category'
        });
    }
};

/**
 * Update Category & Category Translation matching Laravel CategoryController@update
 */
export const categoryUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            parent_id,
            order_level,
            icon,
            meta_title,
            meta_description,
            slug: requestedSlug,
            lang: requestedLang
        } = req.body;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const defaultLang = await getDefaultLanguageCode();
        const currentLang = requestedLang || defaultLang;

        // If updating default language, update main category.name
        if (currentLang === defaultLang && name) {
            category.name = name.trim();
        }

        if (order_level !== undefined) category.order_level = Number(order_level) || 0;
        if (icon !== undefined) category.icon = icon;
        if (meta_title !== undefined) category.meta_title = meta_title;
        if (meta_description !== undefined) category.meta_description = meta_description;
        if (parent_id !== undefined) {
            category.parent_id = parent_id && parent_id !== '0' && parent_id !== '' ? parent_id : null;
        }

        if (requestedSlug) {
            const cleanSlug = requestedSlug.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
            if (cleanSlug && cleanSlug !== category.slug) {
                const existing = await Category.findOne({ slug: cleanSlug, _id: { $ne: id } });
                if (!existing) {
                    category.slug = cleanSlug;
                }
            }
        }

        await category.save();

        // Upsert CategoryTranslation for requested lang
        if (name && name.trim()) {
            await CategoryTranslation.findOneAndUpdate(
                { category_id: id, lang: currentLang },
                { $set: { category_id: id, lang: currentLang, name: name.trim() } },
                { upsert: true, new: true }
            );
        }

        const updatedCategory = await Category.findById(id).populate('category_translations');

        return res.status(200).json({
            success: true,
            message: 'Category has been updated successfully',
            category: updatedCategory
        });
    } catch (error) {
        console.error('Error updating category:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update category'
        });
    }
};

/**
 * Remove Category and all its translations
 */
export const categoryRemove = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        await CategoryTranslation.deleteMany({ category_id: id });

        return res.status(200).json({
            success: true,
            message: 'Category has been deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete category'
        });
    }
};

/**
 * Get all Categories with translations resolved for active language
 */
export const categoryGetAll = async (req, res) => {
    try {
        const { search, status } = req.query;
        const { primaryCode, candidates } = await resolveLanguageCandidates(req);

        let query = {};
        if (status === 'true' || status === true || status === 1 || status === '1') {
            query.status = true;
        } else if (status === 'false' || status === false || status === 0 || status === '0') {
            query.status = false;
        }
        if (search && search.trim()) {
            const term = search.trim();
            const matchingTrans = await CategoryTranslation.find({
                name: { $regex: term, $options: 'i' }
            }).select('category_id');
            const matchingIds = matchingTrans.map(t => t.category_id);

            query.$or = [
                { name: { $regex: term, $options: 'i' } },
                { slug: { $regex: term, $options: 'i' } },
                { _id: { $in: matchingIds } }
            ];
        }

        const categories = await Category.find(query)
            .populate('category_translations')
            .populate('parent_id', 'name slug')
            .sort({ order_level: -1, createdAt: -1 });

        let data = categories.map(cat => {
            const translation = (cat.category_translations || []).find(t => candidates.includes(t.lang?.toLowerCase()));
            const resolvedName = translation?.name || cat.name;

            return {
                _id: cat._id,
                id: cat._id,
                name: resolvedName,
                translated_name: resolvedName,
                default_name: cat.name,
                slug: cat.slug,
                parent_id: cat.parent_id,
                order_level: cat.order_level,
                icon: cat.icon,
                meta_title: cat.meta_title,
                meta_description: cat.meta_description,
                status: cat.status,
                category_translations: cat.category_translations || [],
                createdAt: cat.createdAt,
                updatedAt: cat.updatedAt
            };
        });

        return res.status(200).json({
            success: true,
            categories: data,
            selected_lang: primaryCode
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch categories'
        });
    }
};

/**
 * Toggle Category Status
 */
export const categoryToggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        category.status = !category.status;
        await category.save();

        return res.status(200).json({
            success: true,
            message: `Category status updated to ${category.status ? 'active' : 'inactive'}`,
            status: category.status
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to toggle category status'
        });
    }
};

/**
 * Get categories purchased by the authenticated user
 */
export const getUserPurchasedCategories = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User identity not found'
            });
        }

        const user = await User.findById(userId).populate({
            path: 'purchased_categories',
            populate: { path: 'category_translations' }
        });

        const { candidates } = await resolveLanguageCandidates(req);

        const purchased = (user?.purchased_categories || []).map(cat => {
            const translation = (cat.category_translations || []).find(t => candidates.includes(t.lang?.toLowerCase()));
            const resolvedName = translation?.name || cat.name;

            return {
                _id: cat._id,
                id: cat._id,
                name: resolvedName,
                slug: cat.slug,
                price: cat.price || 10,
                icon: cat.icon,
                status: cat.status
            };
        });

        return res.status(200).json({
            success: true,
            categories: purchased
        });
    } catch (error) {
        console.error('Error fetching user purchased categories:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch purchased categories'
        });
    }
};
