import mongoose from 'mongoose';

const pageTranslationSchema = new mongoose.Schema({
    page_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Page',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        default: ''
    },
    lang: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    }
}, {
    timestamps: true
});

pageTranslationSchema.index({ page_id: 1, lang: 1 }, { unique: true });

const PageTranslation = mongoose.model('PageTranslation', pageTranslationSchema);

export default PageTranslation;
