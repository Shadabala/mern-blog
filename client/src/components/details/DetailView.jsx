import { useState, useEffect, useContext } from 'react';
import { Box, Typography, styled, IconButton, Tooltip, Chip, Avatar } from '@mui/material';
import { DeleteOutline, EditOutlined, VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../i18n/i18n';
import { useLanguage } from '../../context/LanguageContext';
import { API } from '../../service/api';
import { DataContext } from '../../context/DataProvider';
import { confirmDelete, alertError } from '../../utils/swal';
import Comments from './comments/Comments';

const PageWrapper = styled(Box)`
    min-height: 100vh;
    background: #f8f9fa;
    padding-bottom: 60px;
`;

const HeroImage = styled('img')`
    width: 100%;
    height: 400px;
    object-fit: cover;
    display: block;
`;

const ContentContainer = styled(Box)`
    max-width: 900px;
    margin: -60px auto 0;
    background: #fff;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.08);
    position: relative;
    z-index: 10;
`;

const ActionPanel = styled(Box)`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 16px;
`;

const MetaHeader = styled(Box)`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
`;

const Title = styled(Typography)`
    font-size: clamp(24px, 4vw, 40px);
    font-weight: 800;
    color: #1a1a2e;
    line-height: 1.3;
    margin-bottom: 24px;
`;

const AuthorSection = styled(Box)`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 0;
    border-top: 1px solid rgba(0,0,0,0.06);
    border-bottom: 1px solid rgba(0,0,0,0.06);
    margin-bottom: 32px;
`;

const BlogContent = styled(Typography)`
    font-size: 18px;
    line-height: 1.8;
    color: #333;
    white-space: pre-wrap;
    margin-bottom: 60px;
`;

const DetailView = () => {
    const url = 'https://images.unsplash.com/photo-1543128639-4cb7e6eeef1b?ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8bGFwdG9wJTIwc2V0dXB8ZW58MHx8MHx8&ixlib=rb-1.2.1&w=1000&q=80';
    
    const [post, setPost] = useState({});
    const [categories, setCategories] = useState([]);
    const { account } = useContext(DataContext);
    const navigate = useNavigate();
    const { id } = useParams();
    const { t } = useTranslation();
    const { currentLang, translate } = useLanguage();
    
    useEffect(() => {
        const fetchData = async () => {
            let response = await API.getPostById(id, { lang: currentLang });
            if (response.isSuccess) {
                const data = response.data?.blog || response.data?.post || response.data;
                setPost(data || {});
            }
            
            const catRes = await API.getCategories({ lang: currentLang });
            if (catRes.isSuccess) {
                const list = catRes.data?.categories || catRes.data || [];
                setCategories(Array.isArray(list) ? list : []);
            }
        };
        fetchData();
    }, [id, currentLang]);

    const deleteBlog = async () => {  
        const confirmed = await confirmDelete({
            title: t("post.confirmDeleteTitle", "Delete this post?"),
            text: t("post.confirmDelete", "Are you sure you want to delete this post? This cannot be undone."),
            confirmButtonText: t("Yes, delete it!"),
            cancelButtonText: t("Cancel")
        });

        if (confirmed) {
            const res = await API.deletePost(post._id);
            if (res.isSuccess) {
                navigate('/dashboard');
            } else {
                alertError(t("Error"), t("post.deleteFailed", "Failed to delete post"));
            }
        }
    };

    const togglePublishStatus = async () => {
        const res = await API.togglePublish(post._id);
        if (res.isSuccess) setPost({ ...post, published: res.published });
    };

    if (!post._id) return null;

    const isAuthor = account.username === post.username;
    const matchedCategory = categories?.find(c => c._id === post.category_id || c._id === post.category?._id || c.name === post.categories);
    const catLabel = post.category?.name || post.categories || matchedCategory?.name || translate("post.general", "General");
    const resolvedTitle = typeof post.title === 'string' ? post.title : (post.title?.[currentLang] || post.title?.en || '');
    const resolvedDesc = typeof post.description === 'string' ? post.description : (post.description?.[currentLang] || post.description?.en || '');

    return (
        <PageWrapper>
            <HeroImage src={post.picture || post.banner || url} alt="post hero" />
            
            <ContentContainer>
                {isAuthor && (
                    <ActionPanel>
                        <Tooltip title={post.published ? t("post.unpublish", "Unpublish to Draft") : t("post.publish", "Publish to Public")}>
                            <IconButton onClick={togglePublishStatus} color={post.published ? "success" : "warning"}>
                                {post.published ? <VisibilityOutlined /> : <VisibilityOffOutlined />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t("post.editTitle", "Edit Post")}>
                            <IconButton onClick={() => navigate(`/update/${post._id}`)} color="primary">
                                <EditOutlined />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t("post.deleteTitle", "Delete Post")}>
                            <IconButton onClick={deleteBlog} color="error">
                                <DeleteOutline />
                            </IconButton>
                        </Tooltip>
                    </ActionPanel>
                )}

                <MetaHeader>
                    <Chip 
                        label={catLabel} 
                        sx={{ background: 'rgba(233,69,96,0.1)', color: '#e94560', fontWeight: 700 }} 
                    />
                    {isAuthor && !post.published && (
                        <Chip label={t("post.draft", "Draft")} color="warning" size="small" sx={{ fontWeight: 600 }} />
                    )}
                </MetaHeader>

                <Title>{resolvedTitle}</Title>

                <AuthorSection>
                    <Avatar sx={{ width: 56, height: 56, background: '#1a1a2e' }}>
                        {post.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Link to={`/?username=${post.username}`} style={{ textDecoration: 'none', color: '#1a1a2e' }}>
                            <Typography fontWeight={700} fontSize={18}>{post.username}</Typography>
                        </Link>
                        <Typography color="#878787" fontSize={14}>
                            {new Date(post.createdDate || post.createdAt || Date.now()).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                    </Box>
                </AuthorSection>

                {resolvedDesc.includes('<p>') || resolvedDesc.includes('<div>') ? (
                    <Box sx={{ fontSize: '18px', lineHeight: 1.8, color: '#333', mb: '60px' }} dangerouslySetInnerHTML={{ __html: resolvedDesc }} />
                ) : (
                    <BlogContent>{resolvedDesc}</BlogContent>
                )}

                {/* Comments: visible to all visitors; writing is gated inside Comments.jsx */}
                {post.published && <Comments post={post} />}
            </ContentContainer>
        </PageWrapper>
    );
};

export default DetailView;