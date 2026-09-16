import mongoose from 'mongoose';

const translationSchema = new mongoose.Schema({
    lang: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    lang_key: {
        type: String,
        required: true,
        trim: true
    },
    lang_value: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Compound unique index for lang and lang_key
translationSchema.index({ lang: 1, lang_key: 1 }, { unique: true });

const Translation = mongoose.model('Translation', translationSchema);

export default Translation;
