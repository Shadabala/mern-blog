import mongoose from 'mongoose';
import PageTranslation from './PageTranslation.js';

const pageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    type: {
        type: String,
        enum: ['home_page', 'custom_page'],
        default: 'custom_page'
    },
    content: {
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
    keywords: {
        type: String,
        default: ''
    },
    meta_image: {
        type: String,
        default: ''
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for Page Translations relationship
pageSchema.virtual('page_translations', {
    ref: 'PageTranslation',
    localField: '_id',
    foreignField: 'page_id'
});

/**
 * getTranslation helper matching Laravel Page::getTranslation($field, $lang)
 */
pageSchema.methods.getTranslation = async function (field = 'title', lang = 'en') {
    const translation = await PageTranslation.findOne({ page_id: this._id, lang });
    if (translation && translation[field]) {
        return translation[field];
    }
    return this[field];
};

const Page = mongoose.model('Page', pageSchema);

export default Page;
