import { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, styled, Avatar, TextField, Button, Divider
} from '@mui/material';
import { ChatBubbleOutline, LockOutlined, LoginOutlined, PersonAddOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../i18n/i18n';

import { DataContext } from '../../../context/DataProvider';
import { useAuth } from '../../../context/AuthContext';
import { API } from '../../../service/api';
import Comment from './Comment';

// ── Styled ────────────────────────────────────────────────────────────────────

const Section = styled(Box)`
    margin-top: 60px;
    border-top: 2px solid #f0f0f0;
    padding-top: 40px;
`;

const SectionTitle = styled(Typography)`
    font-size: 22px;
    font-weight: 800;
    color: #1a1a2e;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 32px;
`;

const CommentCount = styled('span')`
    font-size: 14px;
    font-weight: 600;
    background: rgba(59, 247, 62, 0.15);
    color: var(--primary-color, #e94560);
    padding: 2px 10px;
    border-radius: 20px;
`;

/* ── Input area (logged-in users) ── */
const InputRow = styled(Box)`
    display: flex;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 32px;
`;

const StyledAvatar = styled(Avatar)`
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #1a1a2e, #0f3460);
    font-weight: 700;
    flex-shrink: 0;
`;

const InputBlock = styled(Box)`
    flex: 1;
`;

const NameField = styled(TextField)`
    margin-bottom: 10px;
    & .MuiOutlinedInput-root {
        border-radius: 10px;
        font-size: 14px;
    }
`;

const CommentField = styled(TextField)`
    & .MuiOutlinedInput-root {
        border-radius: 10px;
        font-size: 15px;
    }
`;

const PostBtn = styled(Button)`
    margin-top: 10px;
    background: var(--primary-color, #e94560);
    color: #fff;
    border-radius: 8px;
    text-transform: none;
    font-weight: 700;
    padding: 8px 24px;
    float: right;
    &:hover {
        background: var(--primary-hover-color, #c0392b);
    }
`;

/* ── Login gate ── */
const LoginGate = styled(Box)`
    background: linear-gradient(135deg, #f8f9ff, #f0f4ff);
    border: 1.5px dashed #c5cae9;
    border-radius: 16px;
    padding: 32px;
    text-align: center;
    margin-bottom: 32px;
`;

const GateIcon = styled(Box)`
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(233,69,96,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
`;

const GateBtnRow = styled(Box)`
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 20px;
`;

// ── Component ─────────────────────────────────────────────────────────────────

const getUsernameFromToken = () => {
    try {
        const raw = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
        if (!raw) return '';
        const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.username || payload.name || '';
    } catch { return ''; }
};

const Comments = ({ post }) => {
    const navigate = useNavigate();
    const { account } = useContext(DataContext);
    const { user, isAuthenticated } = useAuth();
    const { t } = useTranslation();

    // resolve logged-in user (from AuthContext, DataContext, localStorage or JWT)
    const currentUser = user || account || {};
    const loggedInUsername = currentUser.username || currentUser.name || account?.username || account?.name || getUsernameFromToken();
    const displayName = currentUser.name || currentUser.username || account?.name || account?.username || loggedInUsername || '';
    const isLoggedIn = Boolean(isAuthenticated || loggedInUsername);

    const [comments, setComments] = useState([]);
    const [toggle, setToggle] = useState(false);

    // Comment form state
    const [commenterName, setCommenterName] = useState('');
    const [commentText, setCommentText] = useState('');
    const [nameError, setNameError] = useState('');
    const [textError, setTextError] = useState('');

    const targetPostId = post?._id || post?.id || (typeof post === 'string' ? post : '');

    // Fetch all comments for this post (public)
    useEffect(() => {
        const getData = async () => {
            if (!targetPostId) return;
            const response = await API.getAllComments(targetPostId);
            if (response && response.isSuccess) {
                const list = Array.isArray(response.data) ? response.data : (response.data?.comments || []);
                setComments(list);
            }
        };
        getData();
    }, [toggle, targetPostId]);

    // Pre-fill the name field when the user is logged in
    useEffect(() => {
        if (isLoggedIn && displayName) {
            setCommenterName(displayName);
        }
    }, [isLoggedIn, displayName]);

    const validate = () => {
        let valid = true;
        if (!commenterName.trim()) { setNameError(t("post.enterName", "Please enter your name")); valid = false; }
        else setNameError('');
        if (!commentText.trim()) { setTextError(t("post.emptyComment", "Comment cannot be empty")); valid = false; }
        else setTextError('');
        return valid;
    };

    const addComment = async () => {
        if (!validate()) return;
        const payload = {
            name: commenterName.trim(),
            postId: targetPostId,
            blogId: targetPostId,
            blog_id: targetPostId,
            date: new Date().toISOString(),
            comments: commentText.trim()
        };
        const res = await API.newComment(payload);
        if (res && res.isSuccess) {
            setCommentText('');
            setToggle(prev => !prev);
        }
    };

    return (
        <Section>
            <SectionTitle>
                <ChatBubbleOutline sx={{ color: 'var(--primary-color, #e94560)' }} />
                {t("post.comments", "Comments")}
                <CommentCount>{comments.length}</CommentCount>
            </SectionTitle>

            {/* ── Input area or login gate ── */}
            {isLoggedIn ? (
                <InputRow>
                    <StyledAvatar>
                        {(displayName || 'U').charAt(0).toUpperCase()}
                    </StyledAvatar>
                    <InputBlock>
                        <NameField
                            fullWidth
                            size="small"
                            label={t("post.namePlaceholder", "Your name (displayed with comment)")}
                            value={commenterName}
                            onChange={e => { setCommenterName(e.target.value); setNameError(''); }}
                            error={Boolean(nameError)}
                            helperText={nameError}
                        />
                        <CommentField
                            fullWidth
                            multiline
                            minRows={3}
                            placeholder={t("post.shareThoughts", "Share your thoughts...")}
                            value={commentText}
                            onChange={e => { setCommentText(e.target.value); setTextError(''); }}
                            error={Boolean(textError)}
                            helperText={textError}
                        />
                        <PostBtn onClick={addComment}>{t("post.postComment", "Post Comment")}</PostBtn>
                        <Box sx={{ clear: 'both' }} />
                    </InputBlock>
                </InputRow>
            ) : (
                <LoginGate>
                    <GateIcon>
                        <LockOutlined sx={{ color: 'var(--primary-color, #e94560)', fontSize: 28 }} />
                    </GateIcon>
                    <Typography fontWeight={700} fontSize={18} color="#1a1a2e" mb={0.5}>
                        {t("post.joinConversation", "Join the conversation")}
                    </Typography>
                    <Typography color="#666" fontSize={14}>
                        {t("post.loginToComment", "Please log in or create an account to post a comment.")}
                    </Typography>
                    <GateBtnRow>
                        <Button
                            variant="contained"
                            startIcon={<LoginOutlined />}
                            onClick={() => navigate('/login')}
                            sx={{
                                background: 'var(--primary-color, #e94560)',
                                color: '#ffffff',
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                '&:hover': { background: 'var(--primary-hover-color, #c0392b)' }
                            }}
                        >
                            {t("post.logIn", "Log In")}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<PersonAddOutlined />}
                            onClick={() => navigate('/signup')}
                            sx={{
                                borderColor: '#1a1a2e',
                                color: '#1a1a2e',
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                '&:hover': { background: 'rgba(26,26,46,0.06)' }
                            }}
                        >
                            {t("post.signUp", "Sign Up")}
                        </Button>
                    </GateBtnRow>
                </LoginGate>
            )}

            {/* ── Comment list (visible to everyone) ── */}
            {comments.length > 0 ? (
                <Box>
                    <Divider sx={{ mb: 3 }} />
                    {comments.map(c => (
                        <Comment
                            key={c._id}
                            comment={c}
                            setToggle={setToggle}
                            currentUsername={loggedInUsername}
                        />
                    ))}
                </Box>
            ) : (
                <Box textAlign="center" py={4} color="#aaa">
                    <ChatBubbleOutline sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                    <Typography>{t("post.noComments", "No comments yet. Be the first to share your thoughts!")}</Typography>
                </Box>
            )}
        </Section>
    );
};

export default Comments;