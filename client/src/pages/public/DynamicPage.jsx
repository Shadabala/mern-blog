import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Breadcrumbs,
    Link as MuiLink,
    Paper,
    CircularProgress,
    Stack,
    Chip,
    Divider
} from '@mui/material';
import {
    Home as HomeIcon,
    Article as ArticleIcon,
    CalendarToday as DateIcon,
    Update as UpdateIcon
} from '@mui/icons-material';
import PublicLayout from '../../layouts/PublicLayout';
import NotFound from './NotFound';
import { fetchPublicPageBySlug } from '../../api/public.api';
import { useLanguage } from '../../context/LanguageContext';

const DynamicPage = () => {
    const { slug } = useParams();
    const { t, currentLanguage, isRtl } = useLanguage();
    const navigate = useNavigate();

    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNotFound, setIsNotFound] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadPage = async () => {
            if (!slug) {
                setIsNotFound(true);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setIsNotFound(false);
                const res = await fetchPublicPageBySlug(slug, currentLanguage);
                if (isMounted) {
                    if (res && res.success && res.page) {
                        setPage(res.page);
                        setIsNotFound(false);

                        // Dynamically update document title & meta tags for SEO
                        const pageTitle = res.page.meta_title || res.page.title;
                        if (pageTitle) {
                            document.title = `${pageTitle} | ${window.__SITE_NAME__ || 'Blog'}`;
                        }

                        if (res.page.meta_description) {
                            let metaDesc = document.querySelector('meta[name="description"]');
                            if (!metaDesc) {
                                metaDesc = document.createElement('meta');
                                metaDesc.setAttribute('name', 'description');
                                document.head.appendChild(metaDesc);
                            }
                            metaDesc.setAttribute('content', res.page.meta_description);
                        }
                    } else {
                        setIsNotFound(true);
                    }
                }
            } catch (err) {
                console.warn(`Dynamic page fetch for slug '${slug}' returned error:`, err?.response?.status || err.message);
                if (isMounted) {
                    setIsNotFound(true);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadPage();

        return () => {
            isMounted = false;
        };
    }, [slug, currentLanguage]);

    // If page is not found or error returned from server, display the 404 page!
    if (isNotFound) {
        return <NotFound />;
    }

    if (loading) {
        return (
            <PublicLayout>
                <Box
                    sx={{
                        minHeight: '60vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        py: 12
                    }}
                >
                    <CircularProgress size={48} sx={{ color: 'var(--primary-color, #3b82f6)' }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {t("Loading page content...", "Loading page content...")}
                    </Typography>
                </Box>
            </PublicLayout>
        );
    }

    if (!page) {
        return <NotFound />;
    }

    return (
        <PublicLayout>
            {/* Page Header / Hero Banner */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #0b192c 0%, #16213e 50%, #0f3460 100%)',
                    py: { xs: 5, md: 7 },
                    px: 3,
                    color: '#ffffff',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative glow circles */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -60,
                        right: -60,
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255, 138, 128, 0.12)',
                        filter: 'blur(40px)',
                        pointerEvents: 'none'
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -40,
                        left: -40,
                        width: 180,
                        height: 180,
                        borderRadius: '50%',
                        bgcolor: 'rgba(59, 130, 246, 0.15)',
                        filter: 'blur(40px)',
                        pointerEvents: 'none'
                    }}
                />

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    {/* Breadcrumbs */}
                    <Breadcrumbs
                        aria-label="breadcrumb"
                        sx={{
                            mb: 2.5,
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.85rem',
                            '& .MuiBreadcrumbs-separator': { color: 'rgba(255, 255, 255, 0.4)' }
                        }}
                    >
                        <MuiLink
                            component={RouterLink}
                            to="/"
                            underline="hover"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                '&:hover': { color: '#ffffff' }
                            }}
                        >
                            <HomeIcon sx={{ fontSize: 16 }} />
                            {t("Home", "Home")}
                        </MuiLink>
                        <Typography sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.85rem' }}>
                            {page.title}
                        </Typography>
                    </Breadcrumbs>

                    {/* Page Title */}
                    <Typography
                        variant="h3"
                        component="h1"
                        fontWeight={900}
                        sx={{
                            fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3.2rem' },
                            lineHeight: 1.2,
                            letterSpacing: '-0.02em',
                            mb: 2,
                            background: 'linear-gradient(90deg, #ffffff 0%, #ff8a80 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            maxWidth: 900
                        }}
                    >
                        {page.title}
                    </Typography>

                    {/* Metadata strip (date, type) */}
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                        {page.meta_description && (
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', maxWidth: 700, mt: 0.5 }}>
                                {page.meta_description}
                            </Typography>
                        )}
                    </Stack>
                </Container>
            </Box>

            {/* Main Content Area */}
            <Box sx={{ py: { xs: 5, md: 8 }, bgcolor: '#f8fafc' }}>
                <Container maxWidth="lg">
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, sm: 5, md: 7 },
                            borderRadius: 4,
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Meta Image Banner if uploaded */}
                        {page.meta_image && (
                            <Box sx={{ mb: 5, borderRadius: 3, overflow: 'hidden', maxHeight: 420, display: 'flex', justifyContent: 'center', bgcolor: '#f1f5f9' }}>
                                <Box
                                    component="img"
                                    src={page.meta_image}
                                    alt={page.title}
                                    sx={{
                                        width: '100%',
                                        maxHeight: 420,
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                />
                            </Box>
                        )}

                        {/* Rich HTML Content Body */}
                        <Box
                            className="dynamic-page-content"
                            sx={{
                                color: '#1e293b',
                                fontSize: { xs: '1rem', md: '1.05rem' },
                                lineHeight: 1.85,
                                fontFamily: 'inherit',
                                '& h1, & h2, & h3, & h4, & h5, & h6': {
                                    color: '#0f172a',
                                    fontWeight: 800,
                                    letterSpacing: '-0.02em',
                                    mt: 4,
                                    mb: 2,
                                    lineHeight: 1.3
                                },
                                '& h1': { fontSize: { xs: '1.75rem', md: '2.25rem' } },
                                '& h2': { fontSize: { xs: '1.5rem', md: '1.85rem' }, borderBottom: '2px solid #f1f5f9', pb: 1 },
                                '& h3': { fontSize: { xs: '1.25rem', md: '1.5rem' } },
                                '& h4': { fontSize: { xs: '1.1rem', md: '1.25rem' } },
                                '& p': {
                                    mb: 2.5,
                                    color: '#334155'
                                },
                                '& a': {
                                    color: 'var(--primary-color, #3b82f6)',
                                    textDecoration: 'underline',
                                    fontWeight: 600,
                                    '&:hover': {
                                        color: 'var(--primary-hover, #1d4ed8)'
                                    }
                                },
                                '& img': {
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: 2,
                                    my: 2.5,
                                    display: 'block'
                                },
                                '& ul, & ol': {
                                    pl: isRtl ? 0 : 3.5,
                                    pr: isRtl ? 3.5 : 0,
                                    mb: 2.5,
                                    color: '#334155',
                                    '& li': {
                                        mb: 1
                                    }
                                },
                                '& blockquote': {
                                    borderLeft: isRtl ? 'none' : '4px solid var(--primary-color, #3b82f6)',
                                    borderRight: isRtl ? '4px solid var(--primary-color, #3b82f6)' : 'none',
                                    m: 0,
                                    my: 3,
                                    pl: isRtl ? 0 : 3,
                                    pr: isRtl ? 3 : 0,
                                    py: 1.5,
                                    bgcolor: 'rgba(59, 130, 246, 0.05)',
                                    borderRadius: 1,
                                    fontStyle: 'italic',
                                    color: '#334155'
                                },
                                '& table': {
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    my: 3,
                                    fontSize: '0.92rem',
                                    '& th, & td': {
                                        border: '1px solid #e2e8f0',
                                        p: 1.5,
                                        textAlign: isRtl ? 'right' : 'left'
                                    },
                                    '& th': {
                                        bgcolor: '#f8fafc',
                                        fontWeight: 700,
                                        color: '#0f172a'
                                    },
                                    '& tr:nth-of-type(even)': {
                                        bgcolor: '#fafafa'
                                    }
                                },
                                '& pre, & code': {
                                    bgcolor: '#f1f5f9',
                                    color: '#0f172a',
                                    borderRadius: 1,
                                    p: '2px 6px',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9em'
                                },
                                '& pre': {
                                    p: 2,
                                    overflowX: 'auto',
                                    my: 2
                                },
                                '& hr': {
                                    border: 'none',
                                    borderTop: '1px solid #e2e8f0',
                                    my: 4
                                }
                            }}
                            dangerouslySetInnerHTML={{ __html: page.content || '' }}
                        />

                        {/* Keywords strip if available */}
                        {page.keywords && (
                            <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid #f1f5f9' }}>
                                <Typography variant="caption" color="text.secondary" display="block" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
                                    {t("Related Topics", "Related Topics")}
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                    {page.keywords.split(',').map((kw, i) => (
                                        <Chip
                                            key={i}
                                            label={kw.trim()}
                                            size="small"
                                            sx={{
                                                bgcolor: '#f1f5f9',
                                                color: '#475569',
                                                fontWeight: 500,
                                                fontSize: '0.75rem'
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </Paper>
                </Container>
            </Box>
        </PublicLayout>
    );
};

export default DynamicPage;
