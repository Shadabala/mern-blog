import mongoose from 'mongoose';

const CategoryTranslationSchema = new mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    },
    lang: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

CategoryTranslationSchema.index({ category_id: 1, lang: 1 }, { unique: true });

const CategoryTranslation = mongoose.model('CategoryTranslation', CategoryTranslationSchema);

export default CategoryTranslation;
