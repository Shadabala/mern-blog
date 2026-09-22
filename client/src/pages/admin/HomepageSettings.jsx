import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Grid, IconButton,
    Alert, CircularProgress, Stack, Tooltip, Divider
} from '@mui/material';
import {
    Add as AddIcon,
    InfoOutlined as InfoIcon,
    Save as SaveIcon,
    DeleteOutline as DeleteIcon,
    ViewCarouselOutlined as SliderIcon,
    ImageOutlined as ImageIcon,
    LinkOutlined as LinkIcon,
    TitleOutlined as TitleIcon,
    SubjectOutlined as TextIcon
} from '@mui/icons-material';

import LanguageTabBar from '../../components/common/LanguageTabBar';
import AizUploaderInput from '../../components/uploader/AizUploaderInput';
import { fetchHomepageSettingsApi, updateHomepageSettingsApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const HomepageSettings = () => {
    const { t, currentLang } = useLanguage();

    const [selectedLang, setSelectedLang] = useState(currentLang || 'en');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Toast / Feedback alert state
    const [alertState, setAlertState] = useState({ open: false, message: '', severity: 'success' });

    // Form settings state (synchronized 4 slider arrays)
    const [settings, setSettings] = useState({
        home_slider_images: [],
        home_slider_links: [],
        home_slider_heading: [],
        home_slider_text: [],
    });

    // Helper to pad all 4 arrays to have the same length
    const normalizeSliderData = (s = {}) => {
        const rawImages = Array.isArray(s.home_slider_images)
            ? s.home_slider_images
            : (s.home_slider_images ? [s.home_slider_images] : []);
        const rawLinks = Array.isArray(s.home_slider_links)
            ? s.home_slider_links
            : (s.home_slider_links ? [s.home_slider_links] : []);
        const rawHeadings = Array.isArray(s.home_slider_heading)
            ? s.home_slider_heading
            : (s.home_slider_heading ? [s.home_slider_heading] : []);
        const rawTexts = Array.isArray(s.home_slider_text)
            ? s.home_slider_text
            : (s.home_slider_text ? [s.home_slider_text] : []);

        const maxLen = Math.max(
            rawImages.length,
            rawLinks.length,
            rawHeadings.length,
            rawTexts.length,
            0
        );

        const pad = (arr, len) => {
            const copy = [...arr];
            while (copy.length < len) copy.push('');
            return copy;
        };

        return {
            home_slider_images: pad(rawImages, maxLen),
            home_slider_links: pad(rawLinks, maxLen),
            home_slider_heading: pad(rawHeadings, maxLen),
            home_slider_text: pad(rawTexts, maxLen),
        };
    };

    const loadSettings = useCallback(async (langCode) => {
        setLoading(true);
        try {
            const res = await fetchHomepageSettingsApi(langCode);
            if (res?.success) {
                const s = res.settings || {};
                setSettings(normalizeSliderData(s));
            }
        } catch (err) {
            console.error('Failed to load homepage settings:', err);
            setAlertState({
                open: true,
                message: err.response?.data?.message || t('Failed to load homepage settings'),
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadSettings(selectedLang);
    }, [selectedLang, loadSettings]);

    const handleLanguageChange = (newLang) => {
        if (newLang && newLang !== selectedLang) {
            setSelectedLang(newLang);
        }
    };

    // --- Slider row actions ---
    const handleAddSliderRow = () => {
        setSettings(prev => ({
            home_slider_images: [...prev.home_slider_images, ''],
            home_slider_links: [...prev.home_slider_links, ''],
            home_slider_heading: [...prev.home_slider_heading, ''],
            home_slider_text: [...prev.home_slider_text, ''],
        }));
    };

    const handleRemoveSliderRow = (idx) => {
        setSettings(prev => {
            const newImages = [...prev.home_slider_images];
            const newLinks = [...prev.home_slider_links];
            const newHeadings = [...prev.home_slider_heading];
            const newTexts = [...prev.home_slider_text];

            newImages.splice(idx, 1);
            newLinks.splice(idx, 1);
            newHeadings.splice(idx, 1);
            newTexts.splice(idx, 1);

            return {
                home_slider_images: newImages,
                home_slider_links: newLinks,
                home_slider_heading: newHeadings,
                home_slider_text: newTexts,
            };
        });
    };

    const handleSliderImageChange = (idx, value) => {
        setSettings(prev => {
            const copy = [...prev.home_slider_images];
            copy[idx] = value;
            return { ...prev, home_slider_images: copy };
        });
    };

    const handleSliderLinkChange = (idx, value) => {
        setSettings(prev => {
            const copy = [...prev.home_slider_links];
            copy[idx] = value;
            return { ...prev, home_slider_links: copy };
        });
    };

    const handleSliderHeadingChange = (idx, value) => {
        setSettings(prev => {
            const copy = [...prev.home_slider_heading];
            copy[idx] = value;
            return { ...prev, home_slider_heading: copy };
        });
    };

    const handleSliderTextChange = (idx, value) => {
        setSettings(prev => {
            const copy = [...prev.home_slider_text];
            copy[idx] = value;
            return { ...prev, home_slider_text: copy };
        });
    };

    const handleSaveSettings = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...settings,
                lang: selectedLang
            };
            const res = await updateHomepageSettingsApi(payload);
            const successMsg = res?.message || t('Homepage settings has been updated successfully');
            setAlertState({
                open: true,
                message: successMsg,
                severity: 'success'
            });
            toast.success(successMsg);

            // Trigger global sync event so Home and layout components reload settings instantly
            window.dispatchEvent(new Event('website_settings_updated'));
        } catch (err) {
            console.error('Failed to save homepage settings:', err);
            const errorMsg = err.response?.data?.message || t('Failed to update homepage settings');
            setAlertState({
                open: true,
                message: errorMsg,
                severity: 'error'
            });
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ maxWidth: '1200px', mx: 'auto', pb: 6, px: { xs: 1.5, sm: 2, md: 3 } }}>
            {/* Header Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <SliderIcon sx={{ fontSize: 28, color: '#3b82f6' }} />
                <Typography variant="h5" fontWeight={800} color="#1e293b">
                    {t("Homepage Settings")}
                </Typography>
            </Box>

            {/* Language Tabs Card */}
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', mb: 3, overflow: 'hidden', bgcolor: '#ffffff' }}>
                <LanguageTabBar
                    activeLang={selectedLang}
                    selectedLang={selectedLang}
                    onLangChange={handleLanguageChange}
                    onSelectLang={handleLanguageChange}
                />
            </Paper>

            {/* In-page Feedback Banner */}
            {alertState.message && (
                <Alert
                    severity={alertState.severity}
                    sx={{ mb: 3, borderRadius: '8px' }}
                    onClose={() => setAlertState(prev => ({ ...prev, message: '' }))}
                >
                    {alertState.message}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
                    <CircularProgress size={36} sx={{ color: '#3b82f6' }} />
                </Box>
            ) : (
                <Box component="form" onSubmit={handleSaveSettings}>
                    {/* SECTION 1: HOME SLIDER */}
                    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid #e2e8f0', borderRadius: '12px', mb: 4, bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                    {t("Home Slider / Hero Banners")}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {t("Configure banners, headings, descriptions, and links displayed in the homepage hero section.")}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Minimum dimensions info banner */}
                        <Alert
                            severity="info"
                            icon={<InfoIcon />}
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                                bgcolor: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                alignItems: 'flex-start',
                                '& .MuiAlert-icon': {
                                    color: '#2563EB',
                                    mt: '2px',
                                },
                                '& .MuiAlert-message': {
                                    width: '100%',
                                },
                            }}
                        >
                            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1E3A8A', mb: 0.5 }}>
                                {t("Recommended dimensions: 1920px × 600px (or 1903px × 553px)")}
                            </Typography>
                            <Typography sx={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, display: 'block' }}>
                                {t("The banner background automatically adapts to all screen sizes. Text and link buttons will overlay neatly on top of your banner.")}
                            </Typography>
                        </Alert>

                        {/* Slider Rows */}
                        <Stack spacing={3}>
                            {settings.home_slider_images.map((imgUrl, idx) => (
                                <Paper
                                    key={idx}
                                    elevation={0}
                                    sx={{
                                        p: { xs: 2, sm: 3 },
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '10px',
                                        bgcolor: '#f8fafc',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: '#cbd5e1',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                        }
                                    }}
                                >
                                    {/* Slide Header */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box
                                                sx={{
                                                    px: 1.5,
                                                    py: 0.4,
                                                    borderRadius: '6px',
                                                    bgcolor: '#3b82f6',
                                                    color: '#ffffff',
                                                    fontSize: '12px',
                                                    fontWeight: 700
                                                }}
                                            >
                                                #{idx + 1}
                                            </Box>
                                            <Typography variant="subtitle2" fontWeight={700} color="#334155">
                                                {t("Slide Item")} #{idx + 1}
                                            </Typography>
                                        </Stack>

                                        <Tooltip title={t("Delete Slide")}>
                                            <IconButton
                                                onClick={() => handleRemoveSliderRow(idx)}
                                                sx={{
                                                    bgcolor: '#fee2e2',
                                                    color: '#ef4444',
                                                    '&:hover': { bgcolor: '#fecaca' }
                                                }}
                                                size="small"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <Divider sx={{ mb: 2.5 }} />

                                    {/* Slide Form Inputs */}
                                    <Grid container spacing={2.5}>
                                        {/* Banner Image */}
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <ImageIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                                <Typography variant="body2" fontWeight={600} color="#334155">
                                                    {t("Banner Image")}
                                                </Typography>
                                            </Box>
                                            <AizUploaderInput
                                                value={imgUrl}
                                                type="image"
                                                onChange={(val) => handleSliderImageChange(idx, val)}
                                                placeholder={t("Choose File")}
                                            />
                                        </Grid>

                                        {/* Target Link (URL) */}
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <LinkIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                                <Typography variant="body2" fontWeight={600} color="#334155">
                                                    {t("Link (URL)")}
                                                </Typography>
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="e.g. /about or https://example.com"
                                                value={settings.home_slider_links[idx] || ''}
                                                onChange={(e) => handleSliderLinkChange(idx, e.target.value)}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '6px',
                                                        bgcolor: '#ffffff'
                                                    }
                                                }}
                                            />
                                        </Grid>

                                        {/* Heading */}
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <TitleIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                                <Typography variant="body2" fontWeight={600} color="#334155">
                                                    {t("Slide Heading")}
                                                </Typography>
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="e.g. Welcome to My Blog"
                                                value={settings.home_slider_heading[idx] || ''}
                                                onChange={(e) => handleSliderHeadingChange(idx, e.target.value)}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '6px',
                                                        bgcolor: '#ffffff'
                                                    }
                                                }}
                                            />
                                        </Grid>

                                        {/* Text / Subheading */}
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <TextIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                                <Typography variant="body2" fontWeight={600} color="#334155">
                                                    {t("Slide Text / Subtitle")}
                                                </Typography>
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="e.g. A place where I share my thoughts and experiences"
                                                value={settings.home_slider_text[idx] || ''}
                                                onChange={(e) => handleSliderTextChange(idx, e.target.value)}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '6px',
                                                        bgcolor: '#ffffff'
                                                    }
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                        </Stack>

                        <Button
                            startIcon={<AddIcon />}
                            onClick={handleAddSliderRow}
                            variant="outlined"
                            sx={{
                                mt: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '6px',
                                color: 'var(--primary-color, #3b82f6)',
                                borderColor: 'var(--primary-color, #bfdbfe)',
                                '&:hover': { bgcolor: 'rgba(59, 247, 62, 0.08)', borderColor: 'var(--primary-hover-color, #3b82f6)', color: 'var(--primary-hover-color, #3b82f6)' }
                            }}
                        >
                            {t("Add New Slide")}
                        </Button>
                    </Paper>

                    {/* Primary Bottom Save Action */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                            sx={{
                                bgcolor: 'var(--primary-color, #3b82f6)',
                                '&:hover': { bgcolor: 'var(--primary-hover-color, #2563eb)' },
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 4,
                                py: 1.3,
                                borderRadius: '8px',
                                color: '#ffffff'
                            }}
                        >
                            {saving ? t("Saving...") : t("Update Settings")}
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default HomepageSettings;
