import Page from '../models/Page.js';
import PageTranslation from '../models/PageTranslation.js';
import Language from '../models/Language.js';
import ActivityLog from '../models/ActivityLog.js';

const getDefaultLanguageCode = async () => {
    try {
        const defaultLang = await Language.findOne({ isDefault: true });
        return defaultLang ? defaultLang.code : 'en';
    } catch {
        return 'en';
    }
};

// Seed default system pages and page translations if not present
const seedDefaultPages = async () => {
    try {
        const count = await Page.countDocuments();
        if (count === 0) {
            const defaultPages = [
                {
                    title: 'Home Page',
                    slug: 'home_page',
                    type: 'home_page',
                    content: '<h1>Welcome to our Blog</h1>',
                    status: true
                },
                {
                    title: 'About Us',
                    slug: 'about-us',
                    type: 'custom_page',
                    content: '<p>Learn more about our team and mission.</p>',
                    status: true
                },
                {
                    title: 'Contact Us',
                    slug: 'contact-us',
                    type: 'custom_page',
                    content: '<p>Get in touch with our team.</p>',
                    status: true
                },
                {
                    title: 'Privacy Policy',
                    slug: 'privacy-policy',
                    type: 'custom_page',
                    content: '<p>Your privacy is very important to us.</p>',
                    status: true
                },
                {
                    title: 'Terms & Conditions',
                    slug: 'terms-conditions',
                    type: 'custom_page',
                    content: '<p>Please read these terms carefully before using our service.</p>',
                    status: true
                }
            ];

            for (const item of defaultPages) {
                const page = await Page.create(item);
                await PageTranslation.create({
                    page_id: page._id,
                    title: item.title,
                    content: item.content,
                    lang: 'en'
                });
            }
        }
    } catch (e) {
        console.error('Error seeding pages:', e.message);
    }
};

seedDefaultPages();

/**
 * Display a listing of the resource.
 * GET /admin/pages?lang=en
 */
export const getPages = async (req, res) => {
    try {
        const { lang: requestedLang } = req.query;
        const defaultLang = await getDefaultLanguageCode();
        const currentLang = requestedLang || defaultLang;

        const pages = await Page.find().sort({ type: -1, createdAt: 1 });

        // Retrieve translations for active language
        const pageIds = pages.map(p => p._id);
        const translations = await PageTranslation.find({
            page_id: { $in: pageIds },
            lang: currentLang
        });

        const mappedPages = pages.map(page => {
            const tr = translations.find(t => t.page_id.toString() === page._id.toString());
            return {
                _id: page._id,
                title: tr?.title || page.title,
                slug: page.slug,
                type: page.type,
                content: tr?.content || page.content,
                meta_title: page.meta_title,
                meta_description: page.meta_description,
                keywords: page.keywords,
                meta_image: page.meta_image,
                status: page.status,
                createdAt: page.createdAt
            };
        });

        return res.status(200).json({
            success: true,
            pages: mappedPages
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pages',
            error: error.message
        });
    }
};

/**
 * Show the form for editing the specified resource.
 * GET /admin/pages/:id?lang=en
 */
export const getPageById = async (req, res) => {
    try {
        const { id } = req.params;
        const { lang: requestedLang } = req.query;
        const defaultLang = await getDefaultLanguageCode();
        const currentLang = requestedLang || defaultLang;

        const page = await Page.findOne({
            $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }]
        });

        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        // Fetch translation from PageTranslation collection
        const pageTranslation = await PageTranslation.findOne({
            page_id: page._id,
            lang: currentLang
        });

        return res.status(200).json({
            success: true,
            page: {
                ...page.toObject(),
                title: pageTranslation?.title || page.title,
                content: pageTranslation?.content !== undefined ? pageTranslation.content : page.content,
                lang: currentLang
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch page',
            error: error.message
        });
    }
};

/**
 * Store a newly created resource in storage.
 * POST /admin/pages
 */
export const createPage = async (req, res) => {
    try {
        const {
            title,
            slug,
            content,
            meta_title,
            meta_description,
            keywords,
            meta_image,
            lang: requestedLang
        } = req.body;

        const defaultLang = await getDefaultLanguageCode();
        const currentLang = requestedLang || defaultLang;

        if (!title || !slug) {
            return res.status(400).json({
                success: false,
                message: 'Title and Slug are required'
            });
        }

        const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-');

        const existing = await Page.findOne({ slug: formattedSlug });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'A page with this URL slug already exists'
            });
        }

        // 1. Create Page
        const page = new Page({
            title,
            slug: formattedSlug,
            type: 'custom_page',
            content: content || '',
            meta_title: meta_title || '',
            meta_description: meta_description || '',
            keywords: keywords || '',
            meta_image: meta_image || '',
            status: true
        });

        await page.save();

        // 2. Create PageTranslation for default language / requested language
        await PageTranslation.findOneAndUpdate(
            { page_id: page._id, lang: currentLang },
            {
                $set: {
                    page_id: page._id,
                    title,
                    content: content || '',
                    lang: currentLang
                }
            },
            { upsert: true, new: true }
        );

        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: 'Created Custom Page',
                module: 'website_pages',
                ipAddress: req.ip || '',
                details: `Created page [${title}] with slug [${formattedSlug}]`
            });
        }

        return res.status(201).json({
            success: true,
            message: 'New page has been created successfully',
            page
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create page',
            error: error.message
        });
    }
};

/**
 * Update the specified resource in storage.
 * PUT /admin/pages/:id
 */
export const updatePage = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            slug,
            content,
            meta_title,
            meta_description,
            keywords,
            meta_image,
            lang: requestedLang
        } = req.body;

        const defaultLang = await getDefaultLanguageCode();
        const currentLang = requestedLang || defaultLang;

        const page = await Page.findById(id);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        if (slug && page.type === 'custom_page') {
            const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-');
            const duplicate = await Page.findOne({ slug: formattedSlug, _id: { $ne: id } });
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug has been used already'
                });
            }
            page.slug = formattedSlug;
        }

        // Update base Page model if default language
        if (currentLang === defaultLang) {
            if (title) page.title = title;
            if (content !== undefined) page.content = content;
        }

        if (meta_title !== undefined) page.meta_title = meta_title;
        if (meta_description !== undefined) page.meta_description = meta_description;
        if (keywords !== undefined) page.keywords = keywords;
        if (meta_image !== undefined) page.meta_image = meta_image;

        await page.save();

        // Update or Create PageTranslation for this language
        await PageTranslation.findOneAndUpdate(
            { page_id: page._id, lang: currentLang },
            {
                $set: {
                    page_id: page._id,
                    title: title || page.title,
                    content: content !== undefined ? content : page.content,
                    lang: currentLang
                }
            },
            { upsert: true, new: true }
        );

        if (req.user) {
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name || req.user.username,
                userRole: req.user.role || 'admin',
                action: 'Updated Page',
                module: 'website_pages',
                ipAddress: req.ip || '',
                details: `Updated page [${page.title}] in language [${currentLang}]`
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Page has been updated successfully',
            page
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update page',
            error: error.message
        });
    }
};

/**
 * Remove the specified resource from storage.
 * DELETE /admin/pages/:id
 */
export const deletePage = async (req, res) => {
    try {
        const { id } = req.params;
        const page = await Page.findById(id);

        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        if (page.type === 'home_page') {
            return res.status(400).json({
                success: false,
                message: 'Home page cannot be deleted'
            });
        }

        // Delete associated page translations matching $page->page_translations()->delete()
        await PageTranslation.deleteMany({ page_id: id });
        await Page.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Page has been deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete page',
            error: error.message
        });
    }
};

/**
 * Display public custom page by slug.
 * GET /public/page/:slug?lang=en
 */
export const getPublicPageBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const { lang: requestedLang } = req.query;
        const defaultLang = await getDefaultLanguageCode();
        const currentLang = requestedLang || defaultLang;

        if (!slug) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        const isMongoId = /^[0-9a-fA-F]{24}$/.test(slug);
        const page = await Page.findOne({
            $and: [
                {
                    $or: isMongoId ? [{ slug }, { _id: slug }] : [{ slug }]
                },
                {
                    $or: [{ status: true }, { status: 1 }, { status: { $exists: false } }]
                }
            ]
        });

        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        const pageTranslation = await PageTranslation.findOne({
            page_id: page._id,
            lang: currentLang
        });

        return res.status(200).json({
            success: true,
            page: {
                _id: page._id,
                id: page._id,
                title: pageTranslation?.title || page.title,
                content: pageTranslation?.content !== undefined && pageTranslation?.content !== null ? pageTranslation.content : (page.content || ''),
                meta_title: pageTranslation?.meta_title || page.meta_title || pageTranslation?.title || page.title,
                meta_description: pageTranslation?.meta_description || page.meta_description || '',
                keywords: page.keywords || '',
                meta_image: page.meta_image || '',
                slug: page.slug,
                type: page.type,
                createdAt: page.createdAt,
                updatedAt: page.updatedAt
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch page',
            error: error.message
        });
    }
};
