import Post from "../models/Post.js";

export const postCreate = async (req, res) => {
    // try {
    const { title, content, picture, categories, lang: requestLang } = req.body;
    // return res.status(200).json({
    //     success: true,
    //     message: "Request",
    //     data: req.body
    // });
    // Validate title
    if (!title || !title.trim()) {
        return res.status(400).json({
            success: false,
            message: "Title is required"
        });
    }
    if (!content || !content.trim()) {
        return res.status(400).json({
            success: false,
            message: "Content is required"
        });
    }

    if (!categories) {
        return res.status(400).json({
            success: false,
            message: "Categories is required"
        });
    }

    const lang = requestLang || "en";
    // Generate slug
    const slug = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    let existingPost = await Post.findOne({ slug });
    let i = 1;
    while (existingPost) {
        slug = slug + "-" + i;
        existingPost = await Post.findOne({ slug });
        i++;
    }

    // Create post
    const post = await Post.create({
        title: {
            [lang]: title.trim()
        },
        content: {
            [lang]: content.trim()
        },
        picture: picture,
        categories,
        slug,
        username: req.user.username
    });

    return res.status(201).json({
        success: true,
        message: "Post created successfully",
        post
    });
    // } catch (error) {
    //     res.status(500).json({
    //         success: false,
    //         message: error.message
    //     });
    // }
};

export const postUpdate = async (req, res) => {
    try {
        const { name, lang: requestLang } = req.body;
        const { id } = req.params;

        // Validate name
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }

        const lang = requestLang || "en";

        // Find category
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        if (category.username !== req.user.username) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this category"
            });
        }

        // Update category properties
        category.name.set(lang, name.trim());

        await category.save();

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const postRemove = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const postGetById = async (req, res) => {
    try {
        const { id } = req.params;
        const { lang: requestLang } = req.query;
        const lang = requestLang || "en";

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const data = {
            _id: category._id,
            name: category.name.get(lang) || category.name.get("en") || "",
            slug: category.slug,
            status: category.status,
            username: category.username,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
        };

        return res.status(200).json({
            success: true,
            category: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const postGetAll = async (req, res) => {
    try {
        const { lang: requestLang } = req.query;
        const lang = requestLang || "en";
        let status = req.query.status;

        status = status === "true" ? true : false;

        let categories;
        if (status) {
            categories = await Category.find({
                status
            }).sort({ createdAt: -1 });
        } else {
            categories = await Category.find().sort({ createdAt: -1 });
        }

        const data = categories.map(category => ({
            _id: category._id,
            name: category.name.get(lang) || category.name.get("en") || "",
            slug: category.slug,
            status: category.status,
            username: category.username,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
        }));

        return res.status(200).json({
            success: true,
            categories: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const postToggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        category.status = !category.status;
        await category.save();

        return res.status(200).json({
            success: true,
            message: `Category status updated to ${category.status ? "active" : "inactive"}`,
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};