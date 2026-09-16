import React, { useState } from 'react';
import {
    Box, Card, CardHeader, CardContent, Typography, TextField, Button,
    Grid, Alert, CircularProgress, Stack, InputAdornment, Breadcrumbs,
    Link as MuiLink
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as BackIcon
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
            const msg = t('Title and Slug are required');
            setAlertMessage({ type: 'error', text: msg });
            toast.warning(msg);
            return;
        }

        try {
            setSaving(true);
            setAlertMessage({ type: 'info', text: '' });
            await createPageApi(form);
            const msg = t('Page has been created successfully');
            setAlertMessage({ type: 'success', text: msg });
            toast.success(msg);
            setTimeout(() => {
                navigate('/admin/website-setup/pages');
            }, 800);
        } catch (err) {
            console.error('Failed to create page:', err);
            const msg = err.response?.data?.message || t('Failed to create page');
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
        <Box sx={{ maxWidth: '1000px', mx: 'auto', p: { xs: 2, md: 3 }, pb: 6 }}>
            {/* Header & Breadcrumb */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={700} color="#1e293b">
                        {t("Add New Page")}
                    </Typography>
                    <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.85rem', mt: 0.5 }}>
                        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/dashboard">
                            {t("Dashboard")}
                        </MuiLink>
                        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/website-setup/pages">
                            {t("Website Pages")}
                        </MuiLink>
                        <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>
                            {t("Create")}
                        </Typography>
                    </Breadcrumbs>
                </Box>

                <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={() => navigate('/admin/website-setup/pages')}
                    sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#cbd5e1', color: '#475569' }}
                >
                    {t("Back to Pages")}
                </Button>
            </Box>

            {alertMessage.text && (
                <Alert
                    severity={alertMessage.type}
                    sx={{ mb: 3, borderRadius: 2 }}
                    onClose={() => setAlertMessage({ type: 'info', text: '' })}
                >
                    {alertMessage.text}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    {/* Page Content Card */}
                    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <CardHeader
                            title={t("Page Content")}
                            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                            sx={{ borderBottom: '1px solid #f1f5f9', pb: 2 }}
                        />
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack spacing={2.5}>
                                {/* Title */}
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={3}>
                                        <Typography variant="body2" fontWeight={600} color="#334155">
                                            {t("Title")} <span style={{ color: '#ef4444' }}>*</span>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={9}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder={t("Title")}
                                            value={form.title}
                                            onChange={(e) => handleFieldChange('title', e.target.value)}
                                            required
                                        />
                                    </Grid>
                                </Grid>

                                {/* Link / Slug */}
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={3}>
                                        <Typography variant="body2" fontWeight={600} color="#334155">
                                            {t("Link")} <span style={{ color: '#ef4444' }}>*</span>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={9}>
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
                                            helperText={t("Use character, number, hyphen only")}
                                            required
                                        />
                                    </Grid>
                                </Grid>

                                {/* Add Content */}
                                <Grid container spacing={2} alignItems="flex-start">
                                    <Grid item xs={12} sm={3}>
                                        <Typography variant="body2" fontWeight={600} color="#334155">
                                            {t("Add Content")} <span style={{ color: '#ef4444' }}>*</span>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={9}>
                                        <AizTextEditor
                                            value={form.content}
                                            onChange={(val) => handleFieldChange('content', val)}
                                            placeholder={t("Page Content...")}
                                        />
                                    </Grid>
                                </Grid>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* SEO Fields Card */}
                    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <CardHeader
                            title={t("Seo Fields")}
                            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                            sx={{ borderBottom: '1px solid #f1f5f9', pb: 2 }}
                        />
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack spacing={2.5}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={3}>
                                        <Typography variant="body2" fontWeight={600} color="#334155">
                                            {t("Meta Title")}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={9}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder={t("Title")}
                                            value={form.meta_title}
                                            onChange={(e) => handleFieldChange('meta_title', e.target.value)}
                                        />
                                    </Grid>
                                </Grid>

                                <Grid container spacing={2} alignItems="flex-start">
                                    <Grid item xs={12} sm={3}>
                                        <Typography variant="body2" fontWeight={600} color="#334155">
                                            {t("Meta Description")}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={9}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            placeholder={t("Description")}
                                            value={form.meta_description}
                                            onChange={(e) => handleFieldChange('meta_description', e.target.value)}
                                        />
                                    </Grid>
                                </Grid>

                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={3}>
                                        <Typography variant="body2" fontWeight={600} color="#334155">
                                            {t("Keywords")}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={9}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder={t("Keyword, Keyword")}
                                            value={form.keywords}
                                            onChange={(e) => handleFieldChange('keywords', e.target.value)}
                                            helperText={t("Separate with comma")}
                                        />
                                    </Grid>
                                </Grid>

                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={3}>
                                        <Typography variant="body2" fontWeight={600} color="#334155">
                                            {t("Meta Image")}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={9}>
                                        <AizUploaderInput
                                            value={form.meta_image}
                                            onChange={(url) => handleFieldChange('meta_image', url)}
                                            placeholder={t("Choose File")}
                                        />
                                    </Grid>
                                </Grid>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <Box display="flex" justifyContent="flex-end" pt={1}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                            sx={{
                                bgcolor: '#3b82f6',
                                '&:hover': { bgcolor: '#2563eb' },
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 4,
                                py: 1.2
                            }}
                        >
                            {saving ? t("Saving...") : t("Save Page")}
                        </Button>
                    </Box>
                </Stack>
            </form>
        </Box>
    );
};

export default PageCreate;
