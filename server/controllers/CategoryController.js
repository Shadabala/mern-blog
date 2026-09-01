import Category from "../models/Category.js";

export const categoryCreate = async (req, res) => {
    try {
        const { name, lang: requestLang } = req.body;

        // Validate name
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }

        const lang = requestLang || "en";
        // Generate slug
        const slug = name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");

        let existingCategory = await Category.findOne({ slug });
        let i = 1;
        while (existingCategory) {
            slug = slug + "-" + i;
            existingCategory = await Category.findOne({ slug });
            i++;
        }

        // Create category
        const category = await Category.create({
            name: {
                [lang]: name.trim()
            },
            slug,
            status: true,
            username: req.user.username
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const categoryUpdate = async (req, res) => {
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

export const categoryRemove = async (req, res) => {
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

export const categoryGetById = async (req, res) => {
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

export const categoryGetAll = async (req, res) => {
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

export const categoryToggleStatus = async (req, res) => {
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