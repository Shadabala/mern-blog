import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardHeader, CardContent, Typography, TextField, Button,
    Grid, Alert, CircularProgress, Stack, InputAdornment, Breadcrumbs,
    Link as MuiLink
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as BackIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';

import LanguageTabBar from '../../components/common/LanguageTabBar';
import TranslatableLabel from '../../components/common/TranslatableLabel';
import AizUploaderInput from '../../components/uploader/AizUploaderInput';
import AizTextEditor from '../../components/editor/AizTextEditor';
import { fetchPageByIdApi, updatePageApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const PageEdit = () => {
    const { id } = useParams();
    const { t, currentLang } = useLanguage();
    const navigate = useNavigate();

    const [selectedLang, setSelectedLang] = useState(currentLang || 'en');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    const [form, setForm] = useState({
        title: '',
        slug: '',
        content: '',
        type: 'custom_page',
        meta_title: '',
        meta_description: '',
        keywords: '',
        meta_image: ''
    });



    useEffect(() => {
        const loadPage = async () => {
            try {
                setLoading(true);
                const res = await fetchPageByIdApi(id, selectedLang);
                if (res?.success && res.page) {
                    setForm({
                        title: res.page.title || '',
                        slug: res.page.slug || '',
                        content: res.page.content || '',
                        type: res.page.type || 'custom_page',
                        meta_title: res.page.meta_title || '',
                        meta_description: res.page.meta_description || '',
                        keywords: res.page.keywords || '',
                        meta_image: res.page.meta_image || ''
                    });
                }
            } catch (err) {
                console.error('Failed to load page:', err);
                setAlertMessage({ type: 'error', text: t('Failed to load page details') });
            } finally {
                setLoading(false);
            }
        };
        loadPage();
    }, [id, selectedLang, t]);

    const handleFieldChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
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
            await updatePageApi(id, {
                ...form,
                lang: selectedLang
            });
            const msg = t('Page has been updated successfully');
            setAlertMessage({ type: 'success', text: msg });
            toast.success(msg);
            setTimeout(() => {
                navigate('/admin/website-setup/pages');
            }, 800);
        } catch (err) {
            console.error('Failed to update page:', err);
            const msg = err.response?.data?.message || t('Failed to update page');
            setAlertMessage({
                type: 'error',
                text: msg
            });
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: '1000px', mx: 'auto', p: { xs: 2, md: 3 }, pb: 6 }}>
            {/* Header & Breadcrumb */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={700} color="#1e293b">
                        {t("Edit Page Information")}
                    </Typography>
                    <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.85rem', mt: 0.5 }}>
                        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/dashboard">
                            {t("Dashboard")}
                        </MuiLink>
                        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/website-setup/pages">
                            {t("Website Pages")}
                        </MuiLink>
                        <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>
                            {t("Edit")}
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

            {/* Language Selector Tab Bar */}
            <LanguageTabBar
                selectedLang={selectedLang}
                onSelectLang={(code) => setSelectedLang(code)}
            />

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
                                        <TranslatableLabel label="Title" required />
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
                                            disabled={form.type === 'home_page'}
                                            onChange={(e) => handleFieldChange('slug', e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                                                        {window.location.origin}/
                                                    </InputAdornment>
                                                )
                                            }}
                                            helperText={form.type === 'home_page' ? t("Default home page slug cannot be changed") : t("Use character, number, hyphen only")}
                                            required
                                        />
                                    </Grid>
                                </Grid>

                                {/* Add Content */}
                                <Grid container spacing={2} alignItems="flex-start">
                                    <Grid item xs={12} sm={3}>
                                        <TranslatableLabel label="Add Content" required />
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
                                bgcolor: '#10b981',
                                '&:hover': { bgcolor: '#059669' },
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 4,
                                py: 1.2
                            }}
                        >
                            {saving ? t("Updating...") : t("Update Page")}
                        </Button>
                    </Box>
                </Stack>
            </form>
        </Box>
    );
};

export default PageEdit;
