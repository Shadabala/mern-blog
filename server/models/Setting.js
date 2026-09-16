import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        default: ''
    },
    group: {
        type: String,
        default: 'general'
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
