import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardHeader, CardContent, Typography, TextField, Button,
    Grid, Alert, CircularProgress, Stack, Switch, FormControlLabel
} from '@mui/material';
import {
    Save as SaveIcon,
    PaymentOutlined as PaymentIcon
} from '@mui/icons-material';

import { fetchPaymentMethodsApi, updatePaymentMethodsApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const PaymentMethodsSettings = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    const [form, setForm] = useState({
        STRIPE_KEY: '',
        STRIPE_SECRET: '',
        stripe_payment: 1,
        RAZORPAY_KEY: '',
        RAZORPAY_SECRET: '',
        razorpay_payment: 0,
        manual_payment_1_name: 'Bank Transfer / Wire',
        manual_payment_1_instruction: 'Please transfer funds to Account #123456 and email the receipt.',
        manual_payment_1_status: 1
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const res = await fetchPaymentMethodsApi();
                if (res?.success && res.settings) {
                    setForm(prev => ({ ...prev, ...res.settings }));
                }
            } catch (err) {
                console.error('Failed to load payment settings:', err);
                const msg = t('Failed to load payment settings');
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

    const handleSaveMethod = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setAlertMessage({ type: 'info', text: '' });
            await updatePaymentMethodsApi(form);
            const msg = t('Payment methods updated successfully');
            setAlertMessage({ type: 'success', text: msg });
            toast.success(msg);
        } catch (err) {
            console.error('Failed to update payment settings:', err);
            const msg = err.response?.data?.message || t('Failed to update payment settings');
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
                <PaymentIcon sx={{ color: '#6366f1', fontSize: 32 }} />
                <Typography variant="h5" fontWeight={700} color="#1e293b">
                    {t("Payment Method Configuration")}
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

            <Grid container spacing={3}>

                {/* Stripe Card */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                        <CardHeader
                            title={t("Stripe Credential")}
                            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                            action={
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={Boolean(Number(form.stripe_payment) === 1 || form.stripe_payment === true)}
                                            onChange={(e) => handleFieldChange('stripe_payment', e.target.checked ? 1 : 0)}
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
                                    label={t("Stripe Key")}
                                    value={form.STRIPE_KEY || ''}
                                    onChange={(e) => handleFieldChange('STRIPE_KEY', e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                                <TextField
                                    label={t("Stripe Secret")}
                                    type="password"
                                    value={form.STRIPE_SECRET || ''}
                                    onChange={(e) => handleFieldChange('STRIPE_SECRET', e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Razorpay Card */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                        <CardHeader
                            title={t("Razorpay Credential")}
                            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                            action={
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={Boolean(Number(form.razorpay_payment) === 1 || form.razorpay_payment === true)}
                                            onChange={(e) => handleFieldChange('razorpay_payment', e.target.checked ? 1 : 0)}
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
                                    label={t("Razorpay Key")}
                                    value={form.RAZORPAY_KEY || ''}
                                    onChange={(e) => handleFieldChange('RAZORPAY_KEY', e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                                <TextField
                                    label={t("Razorpay Secret")}
                                    type="password"
                                    value={form.RAZORPAY_SECRET || ''}
                                    onChange={(e) => handleFieldChange('RAZORPAY_SECRET', e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/*  Manual / Offline Payment */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <CardHeader
                            title={t("Manual / Offline Payment Method")}
                            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                            action={
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={Boolean(Number(form.manual_payment_1_status) === 1 || form.manual_payment_1_status === true)}
                                            onChange={(e) => handleFieldChange('manual_payment_1_status', e.target.checked ? 1 : 0)}
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
                                    label={t("Method Name")}
                                    value={form.manual_payment_1_name || ''}
                                    onChange={(e) => handleFieldChange('manual_payment_1_name', e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                                <TextField
                                    label={t("Payment Instructions for Users")}
                                    multiline
                                    rows={3}
                                    value={form.manual_payment_1_instruction || ''}
                                    onChange={(e) => handleFieldChange('manual_payment_1_instruction', e.target.value)}
                                    fullWidth
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Save Button */}
            <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                    onClick={handleSaveMethod}
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
                    {saving ? t("Saving...") : t("Save Configuration")}
                </Button>
            </Box>
        </Box>
    );
};

export default PaymentMethodsSettings;
