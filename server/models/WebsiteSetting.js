import mongoose from 'mongoose';

const websiteSettingSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        default: ''
    },
    lang: {
        type: String,
        default: null,
        trim: true,
        lowercase: true
    }
}, {
    timestamps: true
});

websiteSettingSchema.index({ type: 1, lang: 1 }, { unique: true });

const WebsiteSetting = mongoose.model('WebsiteSetting', websiteSettingSchema);

export default WebsiteSetting;
