import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardHeader, CardContent, Typography, Grid, Alert,
    CircularProgress, Switch, Stack, Link as MuiLink
} from '@mui/material';
import {
    ToggleOnOutlined as FeatureIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

import { fetchActivationSettingsApi, updateActivationSettingApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const FeatureActivation = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    const [settings, setSettings] = useState({
        FORCE_HTTPS: 0,
        maintenance_mode: 0,
        disable_image_optimization: 0,
        wallet_system: 0,
        email_verification: 0,
        facebook_login: 0,
        google_login: 0,
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const res = await fetchActivationSettingsApi();
                if (res?.success && res.settings) {
                    setSettings(prev => ({ ...prev, ...res.settings }));
                }
            } catch (err) {
                console.error('Failed to load activation settings:', err);
                const msg = t('Failed to load activation settings');
                setAlertMessage({ type: 'error', text: msg });
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [t]);

    const handleToggle = async (type, checked) => {
        const newVal = checked ? 1 : 0;
        setSettings(prev => ({ ...prev, [type]: newVal }));
        try {
            await updateActivationSettingApi(type, newVal);
            const msg = t('Settings updated successfully');
            setAlertMessage({ type: 'success', text: msg });
            toast.success(msg);
        } catch (err) {
            console.error('Failed to update feature:', err);
            // Revert state on error
            setSettings(prev => ({ ...prev, [type]: newVal === 1 ? 0 : 1 }));
            const msg = t('Something went wrong updating setting');
            setAlertMessage({ type: 'error', text: msg });
            toast.error(msg);
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
                <FeatureIcon sx={{ color: '#6366f1', fontSize: 32 }} />
                <Typography variant="h5" fontWeight={700} color="#1e293b">
                    {t("Feature Activation")}
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

            <Stack spacing={4}>
                {/* 1. System Section */}
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} color="#64748b" textAlign="center" mb={2}>
                        {t("System")}
                    </Typography>
                    <Grid container spacing={3}>
                        {/* HTTPS Activation */}
                        <Grid item xs={12} sm={6} md={4}>
                            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                                <CardHeader
                                    title={t("HTTPS Activation")}
                                    titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700, textAlign: 'center' }}
                                    sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}
                                />
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Switch
                                        checked={Boolean(Number(settings.FORCE_HTTPS) === 1 || settings.FORCE_HTTPS === 'On')}
                                        onChange={(e) => handleToggle('FORCE_HTTPS', e.target.checked)}
                                        color="success"
                                        size="medium"
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Maintenance Mode */}
                        <Grid item xs={12} sm={6} md={4}>
                            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                                <CardHeader
                                    title={t("Maintenance Mode Activation")}
                                    titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700, textAlign: 'center' }}
                                    sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}
                                />
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Switch
                                        checked={Boolean(Number(settings.maintenance_mode) === 1)}
                                        onChange={(e) => handleToggle('maintenance_mode', e.target.checked)}
                                        color="success"
                                        size="medium"
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Disable Image Encoding */}
                        <Grid item xs={12} sm={6} md={4}>
                            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                                <CardHeader
                                    title={t("Disable image encoding?")}
                                    titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700, textAlign: 'center' }}
                                    sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}
                                />
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Switch
                                        checked={Boolean(Number(settings.disable_image_optimization) === 1)}
                                        onChange={(e) => handleToggle('disable_image_optimization', e.target.checked)}
                                        color="success"
                                        size="medium"
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>

                {/* 2. Business Related Section */}
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} color="#64748b" textAlign="center" mb={2}>
                        {t("Business Related")}
                    </Typography>
                    <Grid container spacing={3}>
                        {/* Wallet System */}
                        <Grid item xs={12} sm={6} md={4}>
                            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                                <CardHeader
                                    title={t("Wallet System Activation")}
                                    titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700, textAlign: 'center' }}
                                    sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}
                                />
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Switch
                                        checked={Boolean(Number(settings.wallet_system) === 1)}
                                        onChange={(e) => handleToggle('wallet_system', e.target.checked)}
                                        color="success"
                                        size="medium"
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>

                {/* 3. Email & Auth Verification */}
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} color="#64748b" textAlign="center" mb={2}>
                        {t("Email & Authentication")}
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={4}>
                            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                                <CardHeader
                                    title={t("Email Verification")}
                                    titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700, textAlign: 'center' }}
                                    sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}
                                />
                                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                                    <Switch
                                        checked={Boolean(Number(settings.email_verification) === 1)}
                                        onChange={(e) => handleToggle('email_verification', e.target.checked)}
                                        color="success"
                                        size="medium"
                                    />
                                    <Alert severity="info" sx={{ mt: 2, textAlign: 'left', fontSize: '0.75rem', borderRadius: 2 }}>
                                        {t("You need to configure SMTP correctly to enable this feature.")}{' '}
                                        <MuiLink component={RouterLink} to="/admin/setup/smtp" fontWeight={700}>
                                            {t("Configure Now")}
                                        </MuiLink>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>

                {/* 4. Social Media Login */}
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} color="#64748b" textAlign="center" mb={2}>
                        {t("Social Media Login")}
                    </Typography>
                    <Grid container spacing={3}>
                        {/* Facebook login */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                                <CardHeader
                                    title={t("Facebook login")}
                                    titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700, textAlign: 'center' }}
                                    sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}
                                />
                                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                                    <Switch
                                        checked={Boolean(Number(settings.facebook_login) === 1)}
                                        onChange={(e) => handleToggle('facebook_login', e.target.checked)}
                                        color="success"
                                        size="medium"
                                    />
                                    <Alert severity="info" sx={{ mt: 2, textAlign: 'left', fontSize: '0.75rem', borderRadius: 2 }}>
                                        {t("You need to configure Facebook Client.")}{' '}
                                        <MuiLink component={RouterLink} to="/admin/setup/google" fontWeight={700}>
                                            {t("Configure Now")}
                                        </MuiLink>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Google login */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                                <CardHeader
                                    title={t("Google login")}
                                    titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700, textAlign: 'center' }}
                                    sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}
                                />
                                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                                    <Switch
                                        checked={Boolean(Number(settings.google_login) === 1)}
                                        onChange={(e) => handleToggle('google_login', e.target.checked)}
                                        color="success"
                                        size="medium"
                                    />
                                    <Alert severity="info" sx={{ mt: 2, textAlign: 'left', fontSize: '0.75rem', borderRadius: 2 }}>
                                        {t("You need to configure Google Client.")}{' '}
                                        <MuiLink component={RouterLink} to="/admin/setup/google" fontWeight={700}>
                                            {t("Configure Now")}
                                        </MuiLink>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </Stack>
        </Box>
    );
};

export default FeatureActivation;
