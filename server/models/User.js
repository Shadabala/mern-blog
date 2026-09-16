import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ["admin", "staff", "user"],
        default: "user"
    },
    role_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: null
    },
    phone: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    resetOtp: {
        type: String,
        default: null
    },
    resetOtpExpires: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ["active", "blocked"],
        default: "active"
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorOtp: {
        type: String,
        default: null
    },
    twoFactorOtpExpires: {
        type: Date,
        default: null
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockedUntil: {
        type: Date,
        default: null
    },
    purchased_categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual('role_details', {
    ref: 'Role',
    localField: 'role_id',
    foreignField: '_id',
    justOne: true
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ role_id: 1 });
userSchema.index({ createdAt: -1 });

const user = mongoose.models.user || mongoose.model('user', userSchema);
if (!mongoose.models.User) {
    try {
        mongoose.model('User', userSchema);
    } catch {
        // Ignored if already defined
    }
}

export default user;