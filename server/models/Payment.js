import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
    {
        paymentType: {
            type: String,
            enum: ['blog_premium', 'category_purchase'],
            default: 'blog_premium',
            index: true
        },
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Blog',
            default: null,
            index: true
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'category',
            default: null,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            default: null,
            index: true
        },
        stripeSessionId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        stripePaymentIntentId: {
            type: String,
            default: null
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'usd'
        },
        status: {
            type: String,
            enum: ['pending', 'success', 'failed'],
            default: 'pending',
            index: true
        },
        username: {
            type: String,
            required: true,
            index: true
        },
        customerEmail: {
            type: String,
            default: null
        },
        failureReason: {
            type: String,
            default: null
        }
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual alias for blog
paymentSchema.virtual('blog', {
    ref: 'Blog',
    localField: 'postId',
    foreignField: '_id',
    justOne: true
});

// Virtual alias for category
paymentSchema.virtual('category', {
    ref: 'category',
    localField: 'categoryId',
    foreignField: '_id',
    justOne: true
});

export default mongoose.model('Payment', paymentSchema);
