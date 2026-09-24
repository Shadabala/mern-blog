import React from 'react';
import { Box, Container, Typography, Button, Stack, Paper, TextField, InputAdornment } from '@mui/material';
import {
    Home as HomeIcon,
    Article as ArticleIcon,
    Search as SearchIcon,
    ArrowBack as BackIcon,
    SentimentDissatisfied as SadIcon,
    ContactSupport as SupportIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import { useLanguage } from '../../context/LanguageContext';

const NotFound = () => {
    const { t, isRtl } = useLanguage();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <PublicLayout>
            <Box
                sx={{
                    minHeight: '75vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: { xs: 8, md: 12 },
                    px: 2,
                    background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.08) 0%, rgba(248, 250, 252, 0.9) 70%, #f1f5f9 100%)'
                }}
            >
                <Container maxWidth="md">
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 4, sm: 6, md: 8 },
                            textAlign: 'center',
                            borderRadius: 4,
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.07)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Background decorative watermark */}
                        <Typography
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: { xs: '12rem', md: '18rem' },
                                fontWeight: 900,
                                color: 'rgba(99, 102, 241, 0.03)',
                                userSelect: 'none',
                                pointerEvents: 'none',
                                zIndex: 0,
                                lineHeight: 1
                            }}
                        >
                            404
                        </Typography>

                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            {/* Animated icon badge */}
                            <Box
                                sx={{
                                    width: { xs: 72, md: 88 },
                                    height: { xs: 72, md: 88 },
                                    mx: 'auto',
                                    mb: 3,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid rgba(239, 68, 68, 0.2)'
                                }}
                            >
                                <SadIcon sx={{ fontSize: { xs: 40, md: 48 } }} />
                            </Box>

                            {/* 404 Large Gradient Text */}
                            <Typography
                                variant="h1"
                                fontWeight={900}
                                sx={{
                                    fontSize: { xs: '3.5rem', sm: '5rem', md: '6.5rem' },
                                    lineHeight: 1,
                                    letterSpacing: '-0.04em',
                                    background: 'linear-gradient(135deg, #0f172a 0%, #3b82f6 50%, #ec4899 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 1.5
                                }}
                            >
                                404
                            </Typography>

                            <Typography
                                variant="h4"
                                fontWeight={800}
                                color="#1e293b"
                                gutterBottom
                                sx={{ fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.1rem' } }}
                            >
                                {t("Page Not Found", "Page Not Found")}
                            </Typography>

                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{
                                    maxWidth: 540,
                                    mx: 'auto',
                                    mb: 4,
                                    lineHeight: 1.7,
                                    fontSize: { xs: '0.95rem', md: '1.05rem' }
                                }}
                            >
                                {t(
                                    "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
                                    "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
                                )}
                            </Typography>

                            {/* Quick Search bar */}
                            <Box
                                component="form"
                                onSubmit={handleSearchSubmit}
                                sx={{ maxWidth: 460, mx: 'auto', mb: 4 }}
                            >
                                <TextField
                                    fullWidth
                                    size="medium"
                                    placeholder={t("Search our articles or blogs...", "Search our articles or blogs...")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: '#94a3b8' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Button
                                                    type="submit"
                                                    variant="outlined"
                                                    className="btn-outline-primary"
                                                    size="small"
                                                    sx={{
                                                        textTransform: 'none',
                                                        borderRadius: 2,
                                                        px: 2,
                                                    }}
                                                >
                                                    {t("Search", "Search")}
                                                </Button>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 3,
                                            bgcolor: '#f8fafc',
                                            '& fieldset': { borderColor: '#e2e8f0' },
                                            '&:hover fieldset': { borderColor: '#cbd5e1' }
                                        }
                                    }}
                                />
                            </Box>

                            {/* Action Buttons */}
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={2}
                                justifyContent="center"
                                alignItems="center"
                            >
                                <Button
                                    variant="contained"
                                    size="large"
                                    component={RouterLink}
                                    to="/"
                                    startIcon={!isRtl && <HomeIcon />}
                                    endIcon={isRtl && <HomeIcon />}
                                    sx={{
                                        bgcolor: 'var(--primary-color, #3b82f6)',
                                        color: '#ffffff',
                                        px: 3.5,
                                        py: 1.3,
                                        borderRadius: 2.5,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)',
                                        '&:hover': {
                                            bgcolor: 'var(--primary-hover, #2563eb)',
                                            transform: 'translateY(-1px)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {t("Back to Homepage", "Back to Homepage")}
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="large"
                                    component={RouterLink}
                                    to="/#latest-articles"
                                    startIcon={!isRtl && <ArticleIcon />}
                                    endIcon={isRtl && <ArticleIcon />}
                                    sx={{
                                        borderColor: '#cbd5e1',
                                        color: '#334155',
                                        px: 3,
                                        py: 1.3,
                                        borderRadius: 2.5,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: 'var(--primary-color, #3b82f6)',
                                            color: 'var(--primary-color, #3b82f6)',
                                            bgcolor: 'rgba(59, 130, 246, 0.04)'
                                        }
                                    }}
                                >
                                    {t("Browse Articles", "Browse Articles")}
                                </Button>

                                <Button
                                    variant="text"
                                    size="large"
                                    onClick={() => navigate(-1)}
                                    startIcon={!isRtl && <BackIcon />}
                                    endIcon={isRtl && <BackIcon />}
                                    sx={{
                                        color: '#64748b',
                                        px: 2.5,
                                        py: 1.3,
                                        borderRadius: 2.5,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&:hover': { color: '#0f172a', bgcolor: '#f1f5f9' }
                                    }}
                                >
                                    {t("Go Back", "Go Back")}
                                </Button>
                            </Stack>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </PublicLayout>
    );
};

export default NotFound;
