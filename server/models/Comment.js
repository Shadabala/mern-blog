import mongoose from 'mongoose';

const CommentSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    blog_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        default: null
    },
    blogId: {
        type: String,
        default: ''
    },
    postId: {
        type: String,
        default: ''
    },
    date: {
        type: String,
        required: true
    },
    comments: {
        type: String,
        required: true
    }
}, {
    timestamps: true
}
);


const comment = mongoose.model('comment', CommentSchema);

export default comment;