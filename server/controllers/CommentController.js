import mongoose from 'mongoose';
import Comment from '../models/Comment.js';

/**
 * Create a new comment
 * Same implementation as Blog-Website controller
 */
export const newComment = async (request, response) => {
    try {
        const { name, postId, blogId, blog_id, date, comments, comment: legacyComment } = request.body;
        const effectiveId = postId || blogId || blog_id || '';
        const commentText = comments || legacyComment || '';

        if (!commentText.trim()) {
            return response.status(400).json({ msg: 'Comment text is required', message: 'Comment text is required' });
        }

        const newCommentDoc = new Comment({
            name: name || request.user?.name || request.user?.username || 'Anonymous',
            postId: effectiveId,
            blogId: effectiveId,
            blog_id: mongoose.Types.ObjectId.isValid(effectiveId) ? effectiveId : null,
            date: date || new Date().toISOString(),
            comments: commentText.trim()
        });

        await newCommentDoc.save();

        return response.status(200).json('Comment saved successfully');
    } catch (error) {
        console.error('Error in newComment:', error);
        return response.status(500).json({ msg: error.message, message: error.message });
    }
};

/**
 * Get all comments for a post/blog
 * Same implementation as Blog-Website controller
 */
export const getComments = async (request, response) => {
    try {
        const { id } = request.params;
        if (!id) {
            return response.status(400).json({ msg: 'Post ID is required', message: 'Post ID is required' });
        }

        const query = {
            $or: [
                { postId: id },
                { blogId: id }
            ]
        };

        if (mongoose.Types.ObjectId.isValid(id)) {
            query.$or.push({ blog_id: id });
        }

        const comments = await Comment.find(query).sort({ createdAt: -1 });

        return response.status(200).json(comments);
    } catch (error) {
        console.error('Error in getComments:', error);
        return response.status(500).json({ msg: error.message, message: error.message });
    }
};

/**
 * Delete a comment by ID
 * Same implementation as Blog-Website controller
 */
export const deleteComment = async (request, response) => {
    try {
        const { id } = request.params;
        const comment = await Comment.findById(id);
        if (!comment) {
            return response.status(404).json({ msg: 'Comment not found', message: 'Comment not found' });
        }

        await Comment.deleteOne({ _id: id });

        return response.status(200).json('Comment deleted successfully');
    } catch (error) {
        console.error('Error in deleteComment:', error);
        return response.status(500).json({ msg: error.message, message: error.message });
    }
};
