import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    ipAddress: {
        type: String,
        default: '127.0.0.1'
    },
    deviceInfo: {
        type: String,
        default: 'Web Browser'
    },
    loginAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

loginHistorySchema.index({ user: 1, createdAt: -1 });
loginHistorySchema.index({ createdAt: -1 });

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
export default LoginHistory;
