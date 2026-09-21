import { useState, useEffect } from "react";
import { Container, Box, Typography, Paper, Chip, Button, CircularProgress, Stack, Divider } from "@mui/material";
import { ArrowBack as ArrowBackIcon, CalendarToday as CalendarIcon, Person as PersonIcon } from "@mui/icons-material";
import { useParams, Link as RouterLink } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import PublicLayout from "../../layouts/PublicLayout";
import { fetchPublicBlogDetail } from "../../api/public.api";
import Comments from "../../components/details/comments/Comments";

const BlogDetail = () => {
    const { id } = useParams();
    const { currentLang, translate } = useLanguage();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBlog = async () => {
            try {
                const data = await fetchPublicBlogDetail(id, { lang: currentLang });
                setBlog(data.blog || data.post || data.data || data);
            } catch (err) {
                console.error("Failed to load blog detail:", err);
            } finally {
                setLoading(false);
            }
        };

        loadBlog();
    }, [id, currentLang]);

    if (loading) {
        return (
            <PublicLayout>
                <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
                    <CircularProgress />
                </Box>
            </PublicLayout>
        );
    }

    if (!blog) {
        return (
            <PublicLayout>
                <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
                    <Typography variant="h5" color="error" gutterBottom>
                        {translate("common.blogNotFound", "Blog Not Found")}
                    </Typography>
                    <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />}>
                        {translate("common.backToHome", "Back to Home")}
                    </Button>
                </Container>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Button
                    component={RouterLink}
                    to="/"
                    startIcon={<ArrowBackIcon />}
                    sx={{ mb: 3 }}
                >
                    {translate("common.backToBlogs", "Back to Blogs")}
                </Button>

                <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, border: "1px solid #e2e8f0", borderRadius: 3 }}>
                    <Chip
                        label={blog.category?.name || blog.category_name || blog.category || translate("home.general", "General")}
                        color="primary"
                        sx={{ mb: 2 }}
                    />

                    <Typography variant="h3" fontWeight={800} gutterBottom color="#0f172a" lineHeight={1.2}>
                        {blog.title}
                    </Typography>

                    <Stack direction="row" spacing={3} color="text.secondary" mb={3}>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                            <PersonIcon fontSize="small" />
                            <Typography variant="body2">{blog.user?.name || blog.username || "Admin"}</Typography>
                        </Stack>

                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                            <CalendarIcon fontSize="small" />
                            <Typography variant="body2">{new Date(blog.createdAt || blog.created_at).toLocaleDateString()}</Typography>
                        </Stack>
                    </Stack>

                    {/* Blog Banner */}
                    {blog.banner && (
                        <Box sx={{ mb: 4, borderRadius: 3, overflow: 'hidden', maxHeight: 450, backgroundColor: '#f8fafc' }}>
                            <img
                                src={blog.banner}
                                alt={blog.title}
                                style={{ width: '100%', height: '100%', maxHeight: 450, objectFit: 'cover' }}
                            />
                        </Box>
                    )}

                    {blog.short_description && (
                        <Typography variant="subtitle1" color="#475569" sx={{ mb: 3, fontStyle: 'italic', fontSize: '1.15rem', lineHeight: 1.6 }}>
                            {blog.short_description}
                        </Typography>
                    )}

                    <Divider sx={{ mb: 4 }} />

                    {/* Rich HTML Description from aiz-text-editor */}
                    <Box
                        className="blog-rich-content"
                        sx={{
                            color: '#1e293b',
                            lineHeight: 1.8,
                            fontSize: '1.05rem',
                            '& p': { mb: 2 },
                            '& h1, & h2, & h3, & h4': { my: 2, fontWeight: 700, color: '#0f172a' },
                            '& img': { maxWidth: '100%', height: 'auto', borderRadius: '8px', my: 2 },
                            '& blockquote': {
                                borderLeft: '4px solid #7c3aed',
                                pl: 2,
                                py: 1,
                                my: 2,
                                bgcolor: '#f5f3ff',
                                borderRadius: '0 8px 8px 0',
                                fontStyle: 'italic'
                            },
                            '& a': { color: '#7c3aed', textDecoration: 'underline' },
                            '& ul, & ol': { pl: 3, mb: 2 }
                        }}
                        dangerouslySetInnerHTML={{ __html: blog.description || '' }}
                    />

                    {/* Comments System (identical to Blog-Website project) */}
                    <Comments post={blog} />
                </Paper>
            </Container>
        </PublicLayout>
    );
};

export default BlogDetail;
