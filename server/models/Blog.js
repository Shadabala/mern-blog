import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        default: null,
        index: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    banner: {
        type: String,
        default: ''
    },
    short_description: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    meta_title: {
        type: String,
        default: ''
    },
    meta_img: {
        type: String,
        default: ''
    },
    meta_description: {
        type: String,
        default: ''
    },
    meta_keywords: {
        type: String,
        default: ''
    },
    status: {
        type: Boolean,
        default: true
    },
    premium: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        default: 10
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    username: {
        type: String,
        default: 'admin'
    },
    deleted_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual populate for category matching Laravel $blog->category
BlogSchema.virtual('category', {
    ref: 'category',
    localField: 'category_id',
    foreignField: '_id',
    justOne: true
});

// Virtual populate for blog_translations matching Laravel $blog->blog_translations
BlogSchema.virtual('blog_translations', {
    ref: 'BlogTranslation',
    localField: '_id',
    foreignField: 'blog_id'
});

// Method getTranslation matching Laravel Blog::getTranslation($field, $lang)
BlogSchema.methods.getTranslation = function (field = 'title', lang = 'en') {
    if (this.blog_translations && Array.isArray(this.blog_translations)) {
        const trans = this.blog_translations.find(t => t.lang === lang);
        if (trans && trans[field]) {
            return trans[field];
        }
    }
    return this[field] || '';
};

// Index for full-text search & sorting
BlogSchema.index({ title: 'text', short_description: 'text', description: 'text' });
BlogSchema.index({ status: 1, createdAt: -1 });

const Blog = mongoose.model('Blog', BlogSchema);

export default Blog;
