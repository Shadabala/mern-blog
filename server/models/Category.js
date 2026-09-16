import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        default: null
    },
    order_level: {
        type: Number,
        default: 0
    },
    icon: {
        type: String,
        default: ''
    },
    meta_title: {
        type: String,
        default: ''
    },
    meta_description: {
        type: String,
        default: ''
    },
    status: {
        type: Boolean,
        default: true
    },
    price: {
        type: Number,
        default: 10
    },
    username: {
        type: String,
        default: 'admin'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual populate for category_translations matching Laravel's category_translations() relationship
CategorySchema.virtual('category_translations', {
    ref: 'CategoryTranslation',
    localField: '_id',
    foreignField: 'category_id'
});

// Method getTranslation matching Laravel Category::getTranslation($field, $lang)
CategorySchema.methods.getTranslation = function (field = 'name', lang = 'en') {
    if (this.category_translations && Array.isArray(this.category_translations)) {
        const trans = this.category_translations.find(t => t.lang === lang);
        if (trans && trans[field]) {
            return trans[field];
        }
    }
    return this[field] || '';
};

CategorySchema.index({ status: 1, order_level: 1 });
CategorySchema.index({ parent_id: 1 });
CategorySchema.index({ name: 'text' });

const Category = mongoose.model('category', CategorySchema);

export default Category;