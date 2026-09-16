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
                    {/*  Google reCAPTCHA */}
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
