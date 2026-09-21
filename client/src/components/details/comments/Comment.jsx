import { Avatar, Box, Typography, styled, IconButton, Tooltip } from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import { API } from '../../../service/api';
import { confirmDelete } from '../../../utils/swal';
import { useAuth } from '../../../context/AuthContext';

// ── Styled ────────────────────────────────────────────────────────────────────

const CommentCard = styled(Box)`
    display: flex;
    gap: 14px;
    margin-bottom: 24px;
    align-items: flex-start;
`;

const CommentAvatar = styled(Avatar)`
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #1a1a2e, #0f3460);
    font-size: 15px;
    font-weight: 700;
    flex-shrink: 0;
`;

const CommentBody = styled(Box)`
    flex: 1;
    background: #f8f9fa;
    border-radius: 12px;
    padding: 14px 18px;
    position: relative;
`;

const CommentHeader = styled(Box)`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
`;

const CommenterName = styled(Typography)`
    font-weight: 700;
    font-size: 15px;
    color: #1a1a2e;
`;

const CommentDate = styled(Typography)`
    font-size: 12px;
    color: #aaa;
    margin-left: 10px;
`;

const CommentText = styled(Typography)`
    font-size: 15px;
    color: #444;
    line-height: 1.6;
    white-space: pre-line;
`;

// ── Component ─────────────────────────────────────────────────────────────────

const Comment = ({ comment, setToggle, currentUsername }) => {
    const { user } = useAuth();

    const removeComment = async () => {
        const confirmed = await confirmDelete({
            title: 'Delete Comment?',
            text: 'Are you sure you want to delete this comment?',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (confirmed) {
            await API.deleteComment(comment._id);
            setToggle(prev => !prev);
        }
    };

    const isUserAdminOrStaff = user?.role === 'admin' || user?.role === 'staff' || user?.user_type === 'admin';
    const isOwner = isUserAdminOrStaff || (
        currentUsername && (
            comment.name === currentUsername ||
            comment.name === user?.name ||
            comment.name === user?.username
        )
    );

    const formattedDate = (() => {
        try {
            const d = new Date(comment.date || comment.createdAt);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric'
            });
        } catch {
            return '';
        }
    })();

    return (
        <CommentCard>
            <CommentAvatar>
                {comment.name?.charAt(0).toUpperCase() || '?'}
            </CommentAvatar>
            <CommentBody>
                <CommentHeader>
                    <Box display="flex" alignItems="center">
                        <CommenterName>{comment.name}</CommenterName>
                        {formattedDate && (
                            <CommentDate>
                                {formattedDate}
                            </CommentDate>
                        )}
                    </Box>
                    {isOwner && (
                        <Tooltip title="Delete comment">
                            <IconButton
                                size="small"
                                onClick={removeComment}
                                sx={{ color: '#e94560', '&:hover': { background: 'rgba(233,69,96,0.08)' } }}
                            >
                                <DeleteOutline fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </CommentHeader>
                <CommentText>{comment.comments}</CommentText>
            </CommentBody>
        </CommentCard>
    );
};

export default Comment;