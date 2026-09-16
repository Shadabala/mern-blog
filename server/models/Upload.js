import mongoose from 'mongoose';
import './User.js';

const uploadSchema = new mongoose.Schema({
    file_original_name: {
        type: String,
        default: 'Unknown'
    },
    file_name: {
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    extension: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['image', 'video', 'audio', 'archive', 'document', 'other'],
        default: 'other'
    },
    file_size: {
        type: Number,
        default: 0
    },
    external_link: {
        type: String,
        default: null
    },
    deleted_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for fast search and sorting
uploadSchema.index({ file_original_name: 'text', file_name: 'text' });
uploadSchema.index({ user_id: 1, createdAt: -1 });

const Upload = mongoose.model('Upload', uploadSchema);

export default Upload;
