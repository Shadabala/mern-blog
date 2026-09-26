import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardHeader, CardContent, Typography, TextField, Button,
    Grid, Alert, CircularProgress, Stack, Switch, FormControlLabel
} from '@mui/material';
import {
    Save as SaveIcon,
    Instagram as InstaIcon
} from '@mui/icons-material';

import { fetchInstaTokenSettings, updateInstaTokenSettings } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const InstaToken = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    const [form, setForm] = useState({
        INSTA_FEED: 0,
        INSTAGRAM_USER_ID: '',
        INSTAGRAM_ACCESS_TOKEN: '',
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const res = await fetchInstaTokenSettings();
                if (res?.success && res.settings) {
                    setForm(prev => ({ ...prev, ...res.settings }));
                }
            } catch (err) {
                console.error('Failed to load Instagram settings:', err);
                const msg = t('Failed to load Instagram settings');
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
            await updateInstaTokenSettings(form);
            const msg = t('Instagram settings updated successfully');
            setAlertMessage({ type: 'success', text: msg });
            toast.success(msg);
        } catch (err) {
            console.error('Failed to update Instagram settings:', err);
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
        <Box sx={{ maxWidth: '1100px', mx: 'auto', p: { xs: 6, md: 6 }, pb: 6 }}>
            {/* Titlebar */}
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <InstaIcon sx={{ color: '#ea3565ff', fontSize: 32 }} />
                <Typography variant="h5" fontWeight={700} color="#1e293b">
                    {t("Instagram Token Setting")}
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
                <Grid container spacing={6}>
                    {/*  Insta Setting */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                            <CardHeader
                                title={t("Instagram Setting")}
                                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                                action={
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={Boolean(Number(form.INSTA_FEED) === 1 || form.INSTA_FEED === true)}
                                                onChange={(e) => handleFieldChange('INSTA_FEED', e.target.checked ? 1 : 0)}
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
                                        label={t("INSTAGRAM USER ID")}
                                        value={form.INSTAGRAM_USER_ID || ''}
                                        onChange={(e) => handleFieldChange('INSTAGRAM_USER_ID', e.target.value)}
                                        fullWidth
                                        size="small"
                                        placeholder={t("INSTAGRAM USER ID")}
                                    />
                                    <TextField
                                        label={t("INSTAGRAM ACCESS TOKEN")}
                                        type="password"
                                        value={form.INSTAGRAM_ACCESS_TOKEN || ''}
                                        onChange={(e) => handleFieldChange('INSTAGRAM_ACCESS_TOKEN', e.target.value)}
                                        fullWidth
                                        size="small"
                                        placeholder={t("INSTAGRAM ACCESS TOKEN")}
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
                        variant="outlined"
                        className="btn-outline-primary"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                        sx={{
                            color: "var(--primary-color, #2563eb)",
                            borderColor: "var(--primary-color, #2563eb)",
                            backgroundColor: "transparent",
                            '&:hover': {
                                color: '#ffffff',
                                backgroundColor: 'var(--primary-color, #2563eb)',
                                borderColor: 'var(--primary-color, #2563eb)'
                            },
                            '&:disabled': {
                                color: 'var(--primary-color, #2563eb)',
                                borderColor: 'var(--primary-color, #2563eb)',
                                opacity: 0.6
                            },
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

export default InstaToken;
