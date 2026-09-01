import mongoose from 'mongoose';

const CategorySchema = mongoose.Schema({
    name: {
        type: Map,
        of: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    username: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
}
);


const category = mongoose.model('category', CategorySchema);

export default category;