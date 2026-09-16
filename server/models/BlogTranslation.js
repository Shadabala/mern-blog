import mongoose from 'mongoose';

const BlogTranslationSchema = new mongoose.Schema({
    blog_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true
    },
    lang: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    title: {
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
    meta_description: {
        type: String,
        default: ''
    },
    meta_keywords: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

BlogTranslationSchema.index({ blog_id: 1, lang: 1 }, { unique: true });

const BlogTranslation = mongoose.model('BlogTranslation', BlogTranslationSchema);

export default BlogTranslation;
