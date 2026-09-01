import mongoose from 'mongoose';

const PostSchema = mongoose.Schema({
    title: {
        en: { type: String, required: true },
        ar: { type: String, default: '' },
        hi: { type: String, default: '' }
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    content: {
        en: { type: String, required: true },
        ar: { type: String, default: '' },
        hi: { type: String, default: '' }
    },
    picture: {
        type: String,
        required: false
    },
    username: {
        type: String,
        required: true
    },
    categories: {
        type: Array,
        required: false
    },
    published: {
        type: Boolean,
        default: false
    },
    premium: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
}
);


const post = mongoose.model('post', PostSchema);

export default post;