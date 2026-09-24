import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Grid,
    Alert, CircularProgress, Stack, Divider, Card, Link as MuiLink
} from '@mui/material';
import {
    Save as SaveIcon,
    PhoneOutlined as PhoneIcon,
    EmailOutlined as EmailIcon,
    PlaceOutlined as PlaceIcon,
    AccessTimeOutlined as TimeIcon,
    ContactSupportOutlined as ContactIcon,
    Launch as LaunchIcon,
    WhatsApp as WhatsAppIcon,
    VisibilityOutlined as VisibilityIcon
} from '@mui/icons-material';

import LanguageTabBar from '../../components/common/LanguageTabBar';
import { fetchAboutPageSettingsApi, updateWebsiteSettingsApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';
import AizTextEditor from '../../components/editor/AizTextEditor';

const AboutPageSettings = () => {
    const { t, currentLang } = useLanguage();

    const [selectedLang, setSelectedLang] = useState(currentLang || 'en');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Toast / Feedback alert state
    const [alertState, setAlertState] = useState({ open: false, message: '', severity: 'success' });

    // Form settings state
    const [settings, setSettings] = useState({
        about_page_banner_heading: '',
        about_page_banner_description: '',

        about_page_main_heading: '',
        about_page_main_description: ''
    });

    // Helper to pad all 4 arrays to have the same length
    const normalizeSliderData = (s = {}) => {
        return {
            about_page_banner_heading: s.about_page_banner_heading || '',
            about_page_banner_description: s.about_page_banner_description || '',
            about_page_main_heading: s.about_page_main_heading || '',
            about_page_main_description: s.about_page_main_description || ''
        };
    };

    const loadSettings = useCallback(async (langCode) => {
        setLoading(true);
        try {
            const res = await fetchAboutPageSettingsApi(langCode);
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

    const handleFieldChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveSettings = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...settings,
                lang: selectedLang
            };
            const res = await updateWebsiteSettingsApi(payload);
            const successMsg = res?.message || t('About page settings updated successfully', 'About page settings updated successfully');
            setAlertState({
                open: true,
                message: successMsg,
                severity: 'success'
            });
            toast.success(successMsg);

            // Trigger global sync event so Public contact page updates immediately
            window.dispatchEvent(new Event('website_settings_updated'));
        } catch (err) {
            console.error('Failed to save about page settings:', err);
            const errorMsg = err.response?.data?.message || t('Failed to update about page settings', 'Failed to update about page settings');
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
            {/* Header Title & Public Link */}
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
                        <ContactIcon sx={{ fontSize: 26 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color="#1e293b" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                            {t("About Page Settings", "About Page Settings")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t("Configure about details, shown on the public About Us page.", "Configure about details, and shown on the public About Us page.")}
                        </Typography>
                    </Box>
                </Box>

                <Button
                    variant="outlined"
                    size="small"
                    component={MuiLink}
                    href="/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<LaunchIcon sx={{ fontSize: 16 }} />}
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
                    {t("View Public Page", "View Public Page")}
                </Button>
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

            {/* Feedback Banner */}
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
                    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid #e2e8f0', borderRadius: '12px', mb: 4, bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                    {t("About Us Page Settings", "About Us Page Settings")}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={3}>
                            {/* Banner Heading */}
                            <Grid item size={{ xs: 12, sm: 6 }} xs={12} sm={6}>
                                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                    <Typography variant="body2" fontWeight={600} color="#334155">
                                        {t("Banner Heading", "Banner Heading ")}
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Enter Your heading"
                                    value={settings.about_page_banner_heading || ''}
                                    onChange={(e) => handleFieldChange('about_page_banner_heading', e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                />
                            </Grid>

                            {/* Banner Text */}
                            <Grid item size={{ xs: 12, sm: 6 }} xs={12} sm={6}>
                                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                    <Typography variant="body2" fontWeight={600} color="#334155">
                                        {t("Banner Text", "Banner Text")}
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Enter your contact text"
                                    value={settings.about_page_banner_description || ''}
                                    onChange={(e) => handleFieldChange('about_page_banner_description', e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                />
                            </Grid>

                            {/* Main Heading */}
                            <Grid item size={{ xs: 12, sm: 6 }} xs={12} sm={6}>
                                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                    <Typography variant="body2" fontWeight={600} color="#334155">
                                        {t("Main Heading", "Main Heading")}
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Enter your contact main heading"
                                    value={settings.about_page_main_heading || ''}
                                    onChange={(e) => handleFieldChange('about_page_main_heading', e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                />
                            </Grid>

                            {/* Main Text */}
                            <Grid item size={{ xs: 12 }} xs={12}>
                                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                    <Typography variant="body2" fontWeight={600} color="#334155">
                                        {t("Main Text", "Main Text")}
                                    </Typography>
                                </Box>
                                <AizTextEditor
                                    value={
                                        settings.about_page_main_description
                                    }
                                    onChange={(
                                        html
                                    ) =>
                                        handleFieldChange(
                                            'about_page_main_description',
                                            html
                                        )
                                    }
                                    placeholder={t(
                                        'Write blog content here...',
                                        'Write blog content here...'
                                    )}
                                    name="description"
                                />
                            </Grid>

                        </Grid>
                    </Paper>


                    {/* Bottom Save Button */}
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
                            {saving ? t("Saving...", "Saving...") : t("Update Settings", "Update Settings")}
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default AboutPageSettings;
