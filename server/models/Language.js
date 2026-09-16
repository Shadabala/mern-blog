import mongoose from 'mongoose';

const languageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    app_code: {
        type: String,
        lowercase: true,
        trim: true,
        default: 'en'
    },
    flag: {
        type: String,
        default: '🌐'
    },
    dir: {
        type: String,
        enum: ['LTR', 'RTL'],
        default: 'LTR'
    },
    rtl: {
        type: Number,
        default: 0
    },
    isRtl: {
        type: Boolean,
        default: false
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    translations: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    app_translations: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    minimize: false
});

const Language = mongoose.model('Language', languageSchema);

export default Language;

