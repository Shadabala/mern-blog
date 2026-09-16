import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    userName: {
        type: String,
        default: ''
    },
    userRole: {
        type: String,
        default: ''
    },
    action: {
        type: String,
        required: true
    },
    module: {
        type: String,
        required: true,
        trim: true
    },
    ipAddress: {
        type: String,
        default: ''
    },
    details: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ module: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
