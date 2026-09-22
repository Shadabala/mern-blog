import Blog from '../models/Blog.js';
import BlogTranslation from '../models/BlogTranslation.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { resolveLanguageCandidates } from '../helpers/translationHelper.js';

// Helper to make clean slug
const makeSlug = (text) => {
    return (text || '')
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

/**
 * Create a new Blog
 * Replicates Laravel BlogController::store
 */
export const blogCreate = async (req, res) => {
    try {
        const {
            title,
            category_id,
            category,
            categories,
            slug,
            banner = '',
            picture = '',
            short_description = '',
            description = '',
            meta_title = '',
            meta_img = '',
            meta_description = '',
            meta_keywords = '',
            status = 1,
            lang: requestLang = 'en'
        } = req.body;

        const resolvedTitle = typeof title === 'object' ? (title.en || title.ar || title.hi || '') : (title || '');
        const resolvedDesc = typeof description === 'object' ? (description.en || description.ar || description.hi || '') : (description || '');
        const resolvedBanner = banner || picture || '';

        let resolvedCategoryId = category_id || category;
        if (!resolvedCategoryId && categories) {
            if (categories.toString().match(/^[0-9a-fA-F]{24}$/)) {
                resolvedCategoryId = categories;
            } else {
                const cat = await Category.findOne({
                    $or: [
                        { name: categories },
                        { 'name.en': categories },
                        { slug: categories }
                    ]
                });
                if (cat) resolvedCategoryId = cat._id;
            }
        }

        if (!resolvedTitle || !resolvedTitle.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Blog Title is required'
            });
        }

        if (!resolvedCategoryId) {
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }

        // Check if regular user has purchased this category
        if (req.user && req.user.role === 'user') {
            const currentUser = await User.findById(req.user._id);
            const isPurchased = (currentUser?.purchased_categories || []).some(
                catId => catId.toString() === resolvedCategoryId.toString()
            );
            if (!isPurchased) {
                return res.status(403).json({
                    success: false,
                    message: 'You have not purchased this category. Please purchase it before writing blogs in it.'
                });
            }
        }

        const activeLang = (requestLang || 'en').toLowerCase();

        // Calculate unique slug
        let finalSlug = slug ? makeSlug(slug) : makeSlug(resolvedTitle);
        if (!finalSlug) finalSlug = `blog-${Date.now()}`;

        let existingSlug = await Blog.findOne({ slug: finalSlug });
        let counter = 1;
        while (existingSlug) {
            finalSlug = `${slug ? makeSlug(slug) : makeSlug(resolvedTitle)}-${counter}`;
            existingSlug = await Blog.findOne({ slug: finalSlug });
            counter++;
        }

        const blog = new Blog({
            title: resolvedTitle.trim(),
            category_id: resolvedCategoryId,
            slug: finalSlug,
            banner: resolvedBanner,
            short_description: short_description || '',
            description: resolvedDesc,
            meta_title: meta_title || '',
            meta_img: meta_img || '',
            meta_description: meta_description || '',
            meta_keywords: meta_keywords || '',
            status: Number(status) === 0 ? 0 : 1,
            user_id: req.user ? req.user._id : null,
            username: req.user ? (req.user.name || req.user.username || 'admin') : 'admin'
        });

        await blog.save();

        // Save translations
        if (typeof title === 'object') {
            for (const [l, t] of Object.entries(title)) {
                if (t && t.trim()) {
                    const d = typeof description === 'object' ? (description[l] || '') : (l === activeLang ? resolvedDesc : '');
                    await BlogTranslation.findOneAndUpdate(
                        { blog_id: blog._id, lang: l },
                        {
                            $set: {
                                blog_id: blog._id,
                                lang: l,
                                title: t.trim(),
                                short_description: short_description || '',
                                description: d,
                                meta_title: meta_title || '',
                                meta_description: meta_description || '',
                                meta_keywords: meta_keywords || ''
                            }
                        },
                        { upsert: true, returnDocument: 'after' }
                    );
                }
            }
        } else {
            await BlogTranslation.findOneAndUpdate(
                { blog_id: blog._id, lang: activeLang },
                {
                    $set: {
                        blog_id: blog._id,
                        lang: activeLang,
                        title: resolvedTitle.trim(),
                        short_description: short_description || '',
                        description: resolvedDesc,
                        meta_title: meta_title || '',
                        meta_description: meta_description || '',
                        meta_keywords: meta_keywords || ''
                    }
                },
                { upsert: true, returnDocument: 'after' }
            );
        }

        return res.status(201).json({
            success: true,
            message: 'Blog has been created successfully',
            blog,
            post: blog,
            data: blog
        });
    } catch (error) {
        console.error('Error creating blog:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create blog',
            error: error.message
        });
    }
};

/**
 * Update an existing Blog
 * Replicates Laravel BlogController::update with multi-language tabs
 */
export const blogUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            category_id,
            category,
            categories,
            slug,
            banner,
            picture,
            short_description,
            description,
            meta_title,
            meta_img,
            meta_description,
            meta_keywords,
            status,
            lang: requestLang = 'en'
        } = req.body;

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        let resolvedCategoryId = category_id || category;
        if (!resolvedCategoryId && categories) {
            if (categories.toString().match(/^[0-9a-fA-F]{24}$/)) {
                resolvedCategoryId = categories;
            } else {
                const cat = await Category.findOne({
                    $or: [
                        { name: categories },
                        { 'name.en': categories },
                        { slug: categories }
                    ]
                });
                if (cat) resolvedCategoryId = cat._id;
            }
        }

        // Regular users can only edit their own blogs and must have purchased the target category
        if (req.user && req.user.role === 'user') {
            const isOwner = (blog.user_id && blog.user_id.toString() === req.user._id.toString()) ||
                            (blog.username && blog.username === (req.user.username || req.user.name));
            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized: You can only edit your own blogs'
                });
            }

            if (resolvedCategoryId && resolvedCategoryId.toString() !== (blog.category_id ? blog.category_id.toString() : '')) {
                const currentUser = await User.findById(req.user._id);
                const isPurchased = (currentUser?.purchased_categories || []).some(
                    catId => catId.toString() === resolvedCategoryId.toString()
                );
                if (!isPurchased) {
                    return res.status(403).json({
                        success: false,
                        message: 'You have not purchased this category. Please purchase it before assigning blogs to it.'
                    });
                }
            }
        }

        const activeLang = (requestLang || 'en').toLowerCase();
        const resolvedTitle = typeof title === 'object' ? (title.en || title.ar || title.hi || '') : title;
        const resolvedDesc = typeof description === 'object' ? (description.en || description.ar || description.hi || '') : description;
        const resolvedBanner = banner || picture;

        // If editing in default language 'en', update base blog record
        if (activeLang === 'en') {
            if (resolvedTitle !== undefined) blog.title = resolvedTitle.trim();
            if (resolvedCategoryId !== undefined) blog.category_id = resolvedCategoryId || null;
            if (resolvedBanner !== undefined) blog.banner = resolvedBanner;
            if (short_description !== undefined) blog.short_description = short_description;
            if (resolvedDesc !== undefined) blog.description = resolvedDesc;
            if (meta_title !== undefined) blog.meta_title = meta_title;
            if (meta_img !== undefined) blog.meta_img = meta_img;
            if (meta_description !== undefined) blog.meta_description = meta_description;
            if (meta_keywords !== undefined) blog.meta_keywords = meta_keywords;
            if (status !== undefined) blog.status = Number(status) === 0 ? 0 : 1;

            if (slug && slug !== blog.slug) {
                let finalSlug = makeSlug(slug);
                let existingSlug = await Blog.findOne({ slug: finalSlug, _id: { $ne: id } });
                let counter = 1;
                while (existingSlug) {
                    finalSlug = `${makeSlug(slug)}-${counter}`;
                    existingSlug = await Blog.findOne({ slug: finalSlug, _id: { $ne: id } });
                    counter++;
                }
                blog.slug = finalSlug;
            }

            await blog.save();
        } else {
            // Non-translatable fields like category/slug/banner still sync
            if (category_id !== undefined) blog.category_id = category_id || null;
            if (banner !== undefined) blog.banner = banner;
            if (meta_img !== undefined) blog.meta_img = meta_img;
            if (status !== undefined) blog.status = Number(status) === 0 ? 0 : 1;
            await blog.save();
        }

        // Upsert localized translation in BlogTranslation
        await BlogTranslation.findOneAndUpdate(
            { blog_id: blog._id, lang: activeLang },
            {
                $set: {
                    blog_id: blog._id,
                    lang: activeLang,
                    title: title !== undefined ? title.trim() : blog.title,
                    short_description: short_description !== undefined ? short_description : blog.short_description,
                    description: description !== undefined ? description : blog.description,
                    meta_title: meta_title !== undefined ? meta_title : blog.meta_title,
                    meta_description: meta_description !== undefined ? meta_description : blog.meta_description,
                    meta_keywords: meta_keywords !== undefined ? meta_keywords : blog.meta_keywords
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        return res.status(200).json({
            success: true,
            message: 'Blog has been updated successfully',
            blog,
            post: blog
        });
    } catch (error) {
        console.error('Error updating blog:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update blog',
            error: error.message
        });
    }
};

/**
 * Get single blog by ID with language translations
 * Replicates Laravel BlogController::edit
 */
export const blogGetById = async (req, res) => {
    try {
        const { id } = req.params;
        const { primaryCode, candidates } = await resolveLanguageCandidates(req);

        let blog = null;

        const populateConfig = [
            {
                path: 'category_id',
                populate: { path: 'category_translations' }
            },
            {
                path: 'blog_translations'
            }
        ];

        // Try find by ObjectId or slug
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            blog = await Blog.findById(id).populate(populateConfig);
        } else {
            blog = await Blog.findOne({ slug: id }).populate(populateConfig);
        }

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        const translation = (blog.blog_translations || []).find(t => candidates.includes(t.lang?.toLowerCase()));

        let catName = blog.category_id?.name || '';
        if (blog.category_id?.category_translations) {
            const catTrans = blog.category_id.category_translations.find(t => candidates.includes(t.lang?.toLowerCase()));
            if (catTrans?.name) catName = catTrans.name;
        }

        const resolvedTitle = translation?.title || blog.title;
        const resolvedShortDesc = translation?.short_description || blog.short_description;
        const resolvedDesc = translation?.description || blog.description;
        const resolvedMetaTitle = translation?.meta_title || blog.meta_title;
        const resolvedMetaDesc = translation?.meta_description || blog.meta_description;
        const resolvedMetaKeywords = translation?.meta_keywords || blog.meta_keywords;

        const responseData = {
            _id: blog._id,
            id: blog._id,
            title: resolvedTitle,
            category_id: blog.category_id?._id || blog.category_id || '',
            category: blog.category_id ? {
                _id: blog.category_id._id,
                id: blog.category_id._id,
                name: catName,
                category_name: catName,
                slug: blog.category_id.slug
            } : null,
            categories: catName,
            slug: blog.slug,
            banner: blog.banner,
            picture: blog.banner,
            short_description: resolvedShortDesc,
            description: resolvedDesc,
            meta_title: resolvedMetaTitle,
            meta_img: blog.meta_img,
            meta_description: resolvedMetaDesc,
            meta_keywords: resolvedMetaKeywords,
            status: blog.status,
            published: blog.status === 1,
            user_id: blog.user_id,
            username: blog.username,
            created_at: blog.createdAt,
            createdDate: blog.createdAt,
            updated_at: blog.updatedAt,
            translations: blog.blog_translations || [],
            selected_lang: primaryCode
        };

        return res.status(200).json({
            success: true,
            blog: responseData,
            post: responseData,
            data: responseData
        });
    } catch (error) {
        console.error('Error fetching blog by id:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch blog',
            error: error.message
        });
    }
};

/**
 * Get all blogs with search, pagination, category filtering, and multi-language support
 * Replicates Laravel BlogController::index & all_blog
 */
export const blogGetAll = async (req, res) => {
    try {
        const {
            search,
            category,
            category_id,
            category_slug,
            status,
            username,
            user_id,
            author,
            my_blogs,
            page = 1,
            limit = 15
        } = req.query;

        const { primaryCode, candidates } = await resolveLanguageCandidates(req);
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 15;
        const skip = (pageNum - 1) * limitNum;

        const andConditions = [{ deleted_at: null }];

        // Status filter (if specified)
        if (status !== undefined && status !== '') {
            if (status === 'true' || status === true || status === 1 || status === '1') {
                andConditions.push({ status: true });
            } else if (status === 'false' || status === false || status === 0 || status === '0') {
                andConditions.push({ status: false });
            }
        }

        // Category filter
        const targetCategoryId = category_id || category;
        if (targetCategoryId && targetCategoryId !== 'All' && targetCategoryId !== '') {
            if (targetCategoryId.match(/^[0-9a-fA-F]{24}$/)) {
                andConditions.push({ category_id: targetCategoryId });
            } else {
                const cat = await Category.findOne({
                    $or: [
                        { slug: targetCategoryId },
                        { name: { $regex: new RegExp(`^${targetCategoryId}$`, 'i') } }
                    ]
                });
                if (cat) {
                    andConditions.push({ category_id: cat._id });
                }
            }
        } else if (category_slug) {
            const cat = await Category.findOne({ slug: category_slug });
            if (cat) andConditions.push({ category_id: cat._id });
        }

        // Author / User filter
        const targetUsername = username || author;
        if (my_blogs === 'true' && req.user) {
            andConditions.push({
                $or: [
                    { user_id: req.user._id },
                    { username: req.user.username },
                    { username: req.user.name }
                ]
            });
        } else if (user_id) {
            andConditions.push({ user_id });
        } else if (targetUsername) {
            andConditions.push({ username: targetUsername });
        }

        // Keyword Search across Blog and BlogTranslation
        if (search && search.trim()) {
            const term = search.trim();
            const matchingTrans = await BlogTranslation.find({
                $or: [
                    { title: { $regex: term, $options: 'i' } },
                    { short_description: { $regex: term, $options: 'i' } },
                    { description: { $regex: term, $options: 'i' } }
                ]
            }).select('blog_id');
            const matchingIds = matchingTrans.map(t => t.blog_id);

            andConditions.push({
                $or: [
                    { title: { $regex: term, $options: 'i' } },
                    { short_description: { $regex: term, $options: 'i' } },
                    { description: { $regex: term, $options: 'i' } },
                    { _id: { $in: matchingIds } }
                ]
            });
        }

        const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

        const total = await Blog.countDocuments(query);
        const blogs = await Blog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate({
                path: 'category_id',
                populate: { path: 'category_translations' }
            })
            .populate('blog_translations');

        // Aggregate payment stats for returned blogs
        const blogPaidMap = {};
        try {
            const blogIds = blogs.map(b => b._id);
            const blogPaymentStats = await Payment.aggregate([
                { $match: { status: 'success', postId: { $in: blogIds } } },
                { $group: { _id: '$postId', count: { $sum: 1 }, uniqueUsers: { $addToSet: '$userId' } } }
            ]);
            blogPaymentStats.forEach(bp => {
                if (bp._id) {
                    blogPaidMap[bp._id.toString()] = bp.uniqueUsers ? bp.uniqueUsers.filter(Boolean).length : bp.count;
                }
            });
        } catch (aggErr) {
            console.warn('Error calculating blog payment stats:', aggErr.message);
        }

        const formattedBlogs = blogs.map(b => {
            const translation = (b.blog_translations || []).find(t => candidates.includes(t.lang?.toLowerCase()));

            let catName = b.category_id?.name || '';
            if (b.category_id?.category_translations) {
                const catTrans = b.category_id.category_translations.find(t => candidates.includes(t.lang?.toLowerCase()));
                if (catTrans?.name) catName = catTrans.name;
            }

            const resolvedTitle = translation?.title || b.title;
            const resolvedShortDesc = translation?.short_description || b.short_description;
            const resolvedDesc = translation?.description || b.description;
            const resolvedMetaTitle = translation?.meta_title || b.meta_title;
            const resolvedMetaDesc = translation?.meta_description || b.meta_description;
            const resolvedMetaKeywords = translation?.meta_keywords || b.meta_keywords;

            const paidCount = blogPaidMap[b._id.toString()] || (b.premium ? 1 : 0);

            return {
                _id: b._id,
                id: b._id,
                title: resolvedTitle,
                category_id: b.category_id?._id || b.category_id,
                category: b.category_id ? {
                    _id: b.category_id._id,
                    id: b.category_id._id,
                    name: catName,
                    category_name: catName,
                    slug: b.category_id.slug
                } : null,
                categories: catName,
                slug: b.slug,
                banner: b.banner,
                picture: b.banner,
                short_description: resolvedShortDesc,
                description: resolvedDesc,
                meta_title: resolvedMetaTitle,
                meta_img: b.meta_img,
                meta_description: resolvedMetaDesc,
                meta_keywords: resolvedMetaKeywords,
                status: Boolean(b.status === 1 || b.status === true || b.status === 'true' || b.status === '1'),
                published: Boolean(b.status === 1 || b.status === true || b.status === 'true' || b.status === '1'),
                premium: !!b.premium,
                price: b.price || 10,
                paid_users_count: paidCount,
                username: b.username,
                created_at: b.createdAt,
                createdDate: b.createdAt,
                updated_at: b.updatedAt
            };
        });

        return res.status(200).json({
            success: true,
            blogs: formattedBlogs,
            posts: formattedBlogs,
            data: formattedBlogs,
            current_page: pageNum,
            last_page: Math.ceil(total / limitNum) || 1,
            total,
            from: skip + 1,
            to: skip + formattedBlogs.length,
            selected_lang: primaryCode
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch blogs',
            error: error.message
        });
    }
};

/**
 * Toggle blog status (Published / Draft)
 * Replicates Laravel BlogController::change_status
 */
export const blogToggleStatus = async (req, res) => {
    try {
        const id = req.params.id || req.body.id;
        const blog = await Blog.findById(id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        const currentStatus = Boolean(blog.status === 1 || blog.status === true || blog.status === 'true' || blog.status === '1');
        blog.status = !currentStatus;
        await blog.save();

        return res.status(200).json({
            success: true,
            message: `Blog status updated to ${blog.status ? 'active' : 'inactive'}`,
            status: Boolean(blog.status)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to toggle blog status'
        });
    }
};

/**
 * Delete a blog
 * Replicates Laravel BlogController::destroy
 */
export const blogRemove = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findById(id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Regular users can only delete their own blogs
        if (req.user && req.user.role === 'user') {
            const isOwner = (blog.user_id && blog.user_id.toString() === req.user._id.toString()) ||
                            (blog.username && blog.username === (req.user.username || req.user.name));
            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized: You can only delete your own blogs'
                });
            }
        }

        // Cascade delete translations
        await BlogTranslation.deleteMany({ blog_id: id });
        await Blog.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Blog has been deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting blog:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete blog',
            error: error.message
        });
    }
};

// Aliases for full backward-compatibility
export const postCreate = blogCreate;
export const postUpdate = blogUpdate;
export const postGetById = blogGetById;
export const postGetAll = blogGetAll;
export const postToggleStatus = blogToggleStatus;
export const postRemove = blogRemove;
