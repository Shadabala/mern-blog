import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardHeader, CardContent, Typography, TextField, Button,
    Grid, Alert, CircularProgress, Stack, Switch, FormControlLabel,
    List, ListItem, ListItemText
} from '@mui/material';
import {
    Save as SaveIcon,
    Google as GoogleIcon,
    InfoOutlined as InfoIcon
} from '@mui/icons-material';

import { fetchGoogleSettingsApi, updateGoogleSettingsApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const GoogleSettings = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    const [form, setForm] = useState({
        google_recaptcha: 0,
        CAPTCHA_KEY: '',
        RECAPTCHA_SECRET_KEY: '',
        google_analytics: 0,
        TRACKING_ID: '',
        facebook_pixel: 0,
        FACEBOOK_PIXEL_ID: '',
        facebook_chat: 0,
        FACEBOOK_PAGE_ID: ''
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const res = await fetchGoogleSettingsApi();
                if (res?.success && res.settings) {
                    setForm(prev => ({ ...prev, ...res.settings }));
                }
            } catch (err) {
                console.error('Failed to load Google settings:', err);
                const msg = t('Failed to load Google settings');
                setAlertMessage({ type: 'error', text: msg });
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [t]);

    const handleFieldChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setAlertMessage({ type: 'info', text: '' });
            await updateGoogleSettingsApi(form);
            const msg = t('Google & Third-Party settings updated successfully');
            setAlertMessage({ type: 'success', text: msg });
            toast.success(msg);
        } catch (err) {
            console.error('Failed to update Google settings:', err);
            const msg = err.response?.data?.message || t('Failed to update settings');
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
        <Box sx={{ maxWidth: '1100px', mx: 'auto', p: { xs: 2, md: 3 }, pb: 6 }}>
            {/* Titlebar */}
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <GoogleIcon sx={{ color: '#ea4335', fontSize: 32 }} />
                <Typography variant="h5" fontWeight={700} color="#1e293b">
                    {t("Google & Third-Party Analytics")}
                </Typography>
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

            <form onSubmit={handleSave}>
                <Grid container spacing={3}>
                    {/* 1. Google reCAPTCHA */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                            <CardHeader
                                title={t("Google reCAPTCHA Setting")}
                                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                                action={
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={Boolean(Number(form.google_recaptcha) === 1 || form.google_recaptcha === true)}
                                                onChange={(e) => handleFieldChange('google_recaptcha', e.target.checked ? 1 : 0)}
                                                color="success"
                                            />
                                        }
                                        label={t("Active")}
                                    />
                                }
                                sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}
                            />
                            <CardContent>
                                <Stack spacing={2.5}>
                                    <TextField
                                        label={t("Site KEY")}
                                        value={form.CAPTCHA_KEY || ''}
                                        onChange={(e) => handleFieldChange('CAPTCHA_KEY', e.target.value)}
                                        fullWidth
                                        size="small"
                                        placeholder={t("Site KEY")}
                                    />
                                    <TextField
                                        label={t("SECRET KEY")}
                                        type="password"
                                        value={form.RECAPTCHA_SECRET_KEY || ''}
                                        onChange={(e) => handleFieldChange('RECAPTCHA_SECRET_KEY', e.target.value)}
                                        fullWidth
                                        size="small"
                                        placeholder={t("SECRET KEY")}
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 2. Google Analytics */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                            <CardHeader
                                title={t("Google Analytics Setting")}
                                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                                action={
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={Boolean(Number(form.google_analytics) === 1 || form.google_analytics === true)}
                                                onChange={(e) => handleFieldChange('google_analytics', e.target.checked ? 1 : 0)}
                                                color="success"
                                            />
                                        }
                                        label={t("Active")}
                                    />
                                }
                                sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}
                            />
                            <CardContent>
                                <Stack spacing={2.5}>
                                    <TextField
                                        label={t("Tracking ID")}
                                        value={form.TRACKING_ID || ''}
                                        onChange={(e) => handleFieldChange('TRACKING_ID', e.target.value)}
                                        fullWidth
                                        size="small"
                                        placeholder="UA-XXXXXXXXX or G-XXXXXXXXXX"
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 3. Facebook Pixel */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                            <CardHeader
                                title={t("Facebook Pixel Setting")}
                                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                                action={
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={Boolean(Number(form.facebook_pixel) === 1 || form.facebook_pixel === true)}
                                                onChange={(e) => handleFieldChange('facebook_pixel', e.target.checked ? 1 : 0)}
                                                color="success"
                                            />
                                        }
                                        label={t("Active")}
                                    />
                                }
                                sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}
                            />
                            <CardContent>
                                <Stack spacing={2.5}>
                                    <TextField
                                        label={t("Facebook Pixel ID")}
                                        value={form.FACEBOOK_PIXEL_ID || ''}
                                        onChange={(e) => handleFieldChange('FACEBOOK_PIXEL_ID', e.target.value)}
                                        fullWidth
                                        size="small"
                                        placeholder={t("Facebook Pixel ID")}
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 4. Facebook Pixel Instructions */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%', bgcolor: '#f8fafc' }}>
                            <CardHeader
                                title={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <InfoIcon fontSize="small" sx={{ color: '#6366f1' }} />
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            {t("Please be careful when you are configuring Facebook pixel.")}
                                        </Typography>
                                    </Box>
                                }
                                sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}
                            />
                            <CardContent>
                                <List dense disablePadding>
                                    <ListItem disableGutters>
                                        <ListItemText
                                            primary={`1. ${t("Log in to Facebook and go to your Ads Manager account.")}`}
                                            primaryTypographyProps={{ fontSize: '0.8125rem' }}
                                        />
                                    </ListItem>
                                    <ListItem disableGutters>
                                        <ListItemText
                                            primary={`2. ${t("Open the Navigation Bar and select Events Manager.")}`}
                                            primaryTypographyProps={{ fontSize: '0.8125rem' }}
                                        />
                                    </ListItem>
                                    <ListItem disableGutters>
                                        <ListItemText
                                            primary={`3. ${t("Copy your Pixel ID from underneath your Site Name and paste the number into Facebook Pixel ID field.")}`}
                                            primaryTypographyProps={{ fontSize: '0.8125rem' }}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Save Button */}
                <Box display="flex" justifyContent="flex-end" mt={3}>
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
                        {saving ? t("Saving...") : t("Save")}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default GoogleSettings;
