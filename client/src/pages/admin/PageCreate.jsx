import React, { useState } from 'react';
import {
    Box, Paper, Typography, TextField, Button,
    Grid, Alert, CircularProgress, InputAdornment, Breadcrumbs,
    Link as MuiLink, Divider
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as BackIcon,
    ArticleOutlined as PageIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import AizUploaderInput from '../../components/uploader/AizUploaderInput';
import AizTextEditor from '../../components/editor/AizTextEditor';
import { createPageApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const PageCreate = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    const [form, setForm] = useState({
        title: '',
        slug: '',
        content: '',
        meta_title: '',
        meta_description: '',
        keywords: '',
        meta_image: ''
    });

    const handleFieldChange = (field, value) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'title' && !prev.slug) {
                updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.slug.trim()) {
            const msg = t('Title and Slug are required', 'Title and Slug are required');
            setAlertMessage({ type: 'error', text: msg });
            toast.warning(msg);
            return;
        }

        try {
            setSaving(true);
            setAlertMessage({ type: 'info', text: '' });
            await createPageApi(form);
            const msg = t('Page has been created successfully', 'Page has been created successfully');
            setAlertMessage({ type: 'success', text: msg });
            toast.success(msg);
            setTimeout(() => {
                navigate('/admin/website-setup/pages');
            }, 800);
        } catch (err) {
            console.error('Failed to create page:', err);
            const msg = err.response?.data?.message || t('Failed to create page', 'Failed to create page');
            setAlertMessage({
                type: 'error',
                text: msg
            });
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ maxWidth: '1200px', mx: 'auto', pb: 6, px: { xs: 1.5, sm: 2, md: 3 } }}>
            {/* Header Title & Navigation */}
            <Box sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mb: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '10px',
                            bgcolor: '#eff6ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2563eb'
                        }}
                    >
                        <PageIcon sx={{ fontSize: 26 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color="#1e293b" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                            {t("Add New Page", "Add New Page")}
                        </Typography>
                        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.8rem', mt: 0.2 }}>
                            <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/dashboard">
                                {t("Dashboard", "Dashboard")}
                            </MuiLink>
                            <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/website-setup/pages">
                                {t("Website Pages", "Website Pages")}
                            </MuiLink>
                            <Typography color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                {t("Create", "Create")}
                            </Typography>
                        </Breadcrumbs>
                    </Box>
                </Box>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<BackIcon sx={{ fontSize: 16 }} />}
                    onClick={() => navigate('/admin/website-setup/pages')}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '8px',
                        borderColor: '#cbd5e1',
                        color: '#475569',
                        '&:hover': {
                            borderColor: '#94a3b8',
                            bgcolor: '#f8fafc'
                        }
                    }}
                >
                    {t("Back to Pages", "Back to Pages")}
                </Button>
            </Box>

            {/* In-page Feedback Banner */}
            {alertMessage.text && (
                <Alert
                    severity={alertMessage.type}
                    sx={{ mb: 3, borderRadius: '8px' }}
                    onClose={() => setAlertMessage({ type: 'info', text: '' })}
                >
                    {alertMessage.text}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                {/* SECTION 1: Page Content */}
                <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid #e2e8f0', borderRadius: '12px', mb: 4, bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                {t("Page Content", "Page Content")}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        {/* Title */}
                        <Grid item size={{ xs: 12, sm: 6 }} xs={12} sm={6}>
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Typography variant="body2" fontWeight={600} color="#334155">
                                    {t("Title", "Title")} <span style={{ color: '#ef4444' }}>*</span>
                                </Typography>
                            </Box>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder={t("Title", "Title")}
                                value={form.title}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                required
                            />
                        </Grid>

                        {/* Link / Slug */}
                        <Grid item size={{ xs: 12, sm: 6 }} xs={12} sm={6}>
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Typography variant="body2" fontWeight={600} color="#334155">
                                    {t("Link", "Link")} <span style={{ color: '#ef4444' }}>*</span>
                                </Typography>
                            </Box>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="custom-slug"
                                value={form.slug}
                                onChange={(e) => handleFieldChange('slug', e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                                            {window.location.origin}/
                                        </InputAdornment>
                                    )
                                }}
                                helperText={t("Use character, number, hyphen only", "Use character, number, hyphen only")}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                required
                            />
                        </Grid>

                        {/* Add Content */}
                        <Grid item size={{ xs: 12 }} xs={12}>
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Typography variant="body2" fontWeight={600} color="#334155">
                                    {t("Add Content", "Add Content")} <span style={{ color: '#ef4444' }}>*</span>
                                </Typography>
                            </Box>
                            <AizTextEditor
                                value={form.content}
                                onChange={(val) => handleFieldChange('content', val)}
                                placeholder={t("Write page content here...", "Write page content here...")}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* SECTION 2: SEO Fields */}
                <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid #e2e8f0', borderRadius: '12px', mb: 4, bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                {t("SEO Fields", "SEO Fields")}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        {/* Meta Title */}
                        <Grid item size={{ xs: 12, sm: 6 }} xs={12} sm={6}>
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Typography variant="body2" fontWeight={600} color="#334155">
                                    {t("Meta Title", "Meta Title")}
                                </Typography>
                            </Box>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder={t("Meta Title", "Meta Title")}
                                value={form.meta_title}
                                onChange={(e) => handleFieldChange('meta_title', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                            />
                        </Grid>

                        {/* Keywords */}
                        <Grid item size={{ xs: 12, sm: 6 }} xs={12} sm={6}>
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Typography variant="body2" fontWeight={600} color="#334155">
                                    {t("Keywords", "Keywords")}
                                </Typography>
                            </Box>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder={t("Keyword, Keyword", "Keyword, Keyword")}
                                value={form.keywords}
                                onChange={(e) => handleFieldChange('keywords', e.target.value)}
                                helperText={t("Separate with comma", "Separate with comma")}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                            />
                        </Grid>

                        {/* Meta Description */}
                        <Grid item size={{ xs: 12 }} xs={12}>
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Typography variant="body2" fontWeight={600} color="#334155">
                                    {t("Meta Description", "Meta Description")}
                                </Typography>
                            </Box>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder={t("Meta Description", "Meta Description")}
                                value={form.meta_description}
                                onChange={(e) => handleFieldChange('meta_description', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                            />
                        </Grid>

                        {/* Meta Image */}
                        <Grid item size={{ xs: 12 }} xs={12}>
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Typography variant="body2" fontWeight={600} color="#334155">
                                    {t("Meta Image", "Meta Image")}
                                </Typography>
                            </Box>
                            <AizUploaderInput
                                value={form.meta_image}
                                onChange={(url) => handleFieldChange('meta_image', url)}
                                placeholder={t("Choose File", "Choose File")}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Bottom Save Action */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                        type="submit"
                        variant="outlined"
                        className="btn-outline-primary"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                        sx={{
                            color: "var(--primary-color, #2563eb)",
                            borderColor: "var(--primary-color, #2563eb)",
                            backgroundColor: "transparent",
                            "&:hover": {
                                color: "#ffffff",
                                backgroundColor: "var(--primary-color, #2563eb)",
                                borderColor: "var(--primary-color, #2563eb)"
                            },
                            "&:disabled": {
                                color: "var(--primary-color, #2563eb)",
                                borderColor: "var(--primary-color, #2563eb)",
                                opacity: 0.6
                            },
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 4,
                            py: 1.3,
                            borderRadius: '8px'
                        }}
                    >
                        {saving ? t("Saving...", "Saving...") : t("Save Page", "Save Page")}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default PageCreate;
