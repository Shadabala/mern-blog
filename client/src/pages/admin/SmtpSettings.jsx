import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardHeader, CardContent, Typography, TextField, Button,
    Grid, Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress,
    List, ListItem, ListItemText, Stack, Paper
} from '@mui/material';
import {
    Save as SaveIcon,
    Send as SendIcon,
    EmailOutlined as EmailIcon,
    InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { fetchSmtpSettingsApi, updateSmtpSettingsApi, testSmtpEmailApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const SmtpSettings = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    const [form, setForm] = useState({
        MAIL_DRIVER: 'smtp',
        MAIL_HOST: 'smtp.gmail.com',
        MAIL_PORT: '587',
        MAIL_USERNAME: '',
        MAIL_PASSWORD: '',
        MAIL_ENCRYPTION: 'tls',
        MAIL_FROM_ADDRESS: '',
        MAIL_FROM_NAME: '',
        MAILGUN_DOMAIN: '',
        MAILGUN_SECRET: ''
    });

    const [testEmail, setTestEmail] = useState('');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const res = await fetchSmtpSettingsApi();
                if (res?.success && res.settings) {
                    setForm(prev => ({ ...prev, ...res.settings }));
                }
            } catch (err) {
                console.error('Failed to load SMTP settings:', err);
                setAlertMessage({ type: 'error', text: t('Failed to load SMTP settings') });
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setAlertMessage({ type: 'info', text: '' });
            await updateSmtpSettingsApi(form);
            const msg = t('SMTP configuration saved successfully');
            setAlertMessage({ type: 'success', text: msg });
            toast.success(msg);
        } catch (err) {
            console.error('Failed to save SMTP config:', err);
            const msg = err.response?.data?.message || t('Failed to save configuration');
            setAlertMessage({
                type: 'error',
                text: msg
            });
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async (e) => {
        e.preventDefault();
        if (!testEmail) {
            const msg = t('Please enter a test email address');
            setAlertMessage({ type: 'error', text: msg });
            toast.warning(msg);
            return;
        }

        try {
            setTesting(true);
            setAlertMessage({ type: 'info', text: '' });
            const res = await testSmtpEmailApi(testEmail);
            const msg = res.message || t('Test email sent successfully!');
            setAlertMessage({ type: 'success', text: msg });
            toast.success(msg);
        } catch (err) {
            console.error('Test email failed:', err);
            const msg = err.response?.data?.message || t('Failed to send test email');
            setAlertMessage({
                type: 'error',
                text: msg
            });
            toast.error(msg);
        } finally {
            setTesting(false);
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
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <EmailIcon sx={{ color: '#6366f1', fontSize: 30 }} />
                <Typography variant="h5" fontWeight={700} color="#1e293b">
                    {t("SMTP Settings")}
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
                {/* Left Column: Configuration Form */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <CardHeader
                            title={t("SMTP Configuration")}
                            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                            sx={{ borderBottom: '1px solid #f1f5f9', pb: 2 }}
                        />
                        <CardContent>
                            <form onSubmit={handleSaveConfig}>
                                <Stack spacing={2.5}>
                                    {/* Type Dropdown */}
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="mail-driver-label">{t("Type")}</InputLabel>
                                        <Select
                                            labelId="mail-driver-label"
                                            name="MAIL_DRIVER"
                                            value={form.MAIL_DRIVER || 'smtp'}
                                            label={t("Type")}
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="sendmail">Sendmail</MenuItem>
                                            <MenuItem value="smtp">SMTP</MenuItem>
                                            <MenuItem value="mailgun">Mailgun</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {form.MAIL_DRIVER !== 'mailgun' ? (
                                        <>
                                            {/* Mail Host */}
                                            <TextField
                                                label={t("MAIL HOST")}
                                                name="MAIL_HOST"
                                                value={form.MAIL_HOST || ''}
                                                onChange={handleChange}
                                                fullWidth
                                                size="small"
                                                placeholder="smtp.mailgun.org"
                                            />

                                            {/* Mail Port */}
                                            <TextField
                                                label={t("MAIL PORT")}
                                                name="MAIL_PORT"
                                                value={form.MAIL_PORT || ''}
                                                onChange={handleChange}
                                                fullWidth
                                                size="small"
                                                placeholder="587"
                                            />

                                            {/* Mail Username */}
                                            <TextField
                                                label={t("MAIL USERNAME")}
                                                name="MAIL_USERNAME"
                                                value={form.MAIL_USERNAME || ''}
                                                onChange={handleChange}
                                                fullWidth
                                                size="small"
                                                placeholder={t("MAIL USERNAME")}
                                            />

                                            {/* Mail Password */}
                                            <TextField
                                                label={t("MAIL PASSWORD")}
                                                name="MAIL_PASSWORD"
                                                type="password"
                                                value={form.MAIL_PASSWORD || ''}
                                                onChange={handleChange}
                                                fullWidth
                                                size="small"
                                                placeholder={t("MAIL PASSWORD")}
                                            />

                                            {/* Mail Encryption */}
                                            <FormControl fullWidth size="small">
                                                <InputLabel id="mail-encryption-label">{t("MAIL ENCRYPTION")}</InputLabel>
                                                <Select
                                                    labelId="mail-encryption-label"
                                                    name="MAIL_ENCRYPTION"
                                                    value={form.MAIL_ENCRYPTION || 'tls'}
                                                    label={t("MAIL ENCRYPTION")}
                                                    onChange={handleChange}
                                                >
                                                    <MenuItem value="tls">TLS</MenuItem>
                                                    <MenuItem value="ssl">SSL</MenuItem>
                                                    <MenuItem value="">None</MenuItem>
                                                </Select>
                                            </FormControl>

                                            {/* Mail From Address */}
                                            <TextField
                                                label={t("MAIL FROM ADDRESS")}
                                                name="MAIL_FROM_ADDRESS"
                                                type="email"
                                                value={form.MAIL_FROM_ADDRESS || ''}
                                                onChange={handleChange}
                                                fullWidth
                                                size="small"
                                                placeholder="noreply@domain.com"
                                            />

                                            {/* Mail From Name */}
                                            <TextField
                                                label={t("MAIL FROM NAME")}
                                                name="MAIL_FROM_NAME"
                                                value={form.MAIL_FROM_NAME || ''}
                                                onChange={handleChange}
                                                fullWidth
                                                size="small"
                                                placeholder="Website System"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            {/* Mailgun Domain */}
                                            <TextField
                                                label={t("MAILGUN DOMAIN")}
                                                name="MAILGUN_DOMAIN"
                                                value={form.MAILGUN_DOMAIN || ''}
                                                onChange={handleChange}
                                                fullWidth
                                                size="small"
                                                placeholder={t("MAILGUN DOMAIN")}
                                            />

                                            {/* Mailgun Secret */}
                                            <TextField
                                                label={t("MAILGUN SECRET")}
                                                name="MAILGUN_SECRET"
                                                value={form.MAILGUN_SECRET || ''}
                                                onChange={handleChange}
                                                fullWidth
                                                size="small"
                                                placeholder={t("MAILGUN SECRET")}
                                            />
                                        </>
                                    )}

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
                                                fontWeight: 600,
                                                px: 3
                                            }}
                                        >
                                            {saving ? t("Saving...") : t("Save Configuration")}
                                        </Button>
                                    </Box>
                                </Stack>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column: Test Email & Instructions */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                        {/* Test Card */}
                        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <CardHeader
                                title={t("Test SMTP configuration")}
                                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                                sx={{ borderBottom: '1px solid #f1f5f9', pb: 2 }}
                            />
                            <CardContent>
                                <form onSubmit={handleTestEmail}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                        <TextField
                                            size="small"
                                            type="email"
                                            fullWidth
                                            placeholder={t("Enter your email address")}
                                            value={testEmail}
                                            onChange={(e) => setTestEmail(e.target.value)}
                                            required
                                        />
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={testing}
                                            startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                                            sx={{
                                                bgcolor: '#0ea5e9',
                                                '&:hover': { bgcolor: '#0284c7' },
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap',
                                                borderRadius: 2,
                                                px: 2.5
                                            }}
                                        >
                                            {testing ? t("Sending...") : t("Send test email")}
                                        </Button>
                                    </Stack>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Instruction Card */}
                        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <CardHeader
                                title={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <InfoIcon fontSize="small" sx={{ color: '#6366f1' }} />
                                        <Typography variant="subtitle1" fontWeight={700}>
                                            {t("Instruction")}
                                        </Typography>
                                    </Box>
                                }
                                sx={{ borderBottom: '1px solid #f1f5f9', pb: 2 }}
                            />
                            <CardContent>
                                <Typography variant="body2" color="error" fontWeight={600} gutterBottom>
                                    {t("Please be careful when you are configuring SMTP. For incorrect configuration you will get errors when registering users, sending OTPs, or contact inquiry responses.")}
                                </Typography>

                                <Box mt={2.5}>
                                    <Typography variant="subtitle2" fontWeight={700} color="#475569" gutterBottom>
                                        {t("For Non-SSL (TLS)")}
                                    </Typography>
                                    <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f8fafc', p: 1.5, mb: 2 }}>
                                        <List dense disablePadding>
                                            <ListItem disableGutters>
                                                <ListItemText
                                                    primary={`• ${t("Select sendmail for Mail Driver if you face any issue after configuring smtp")}`}
                                                    primaryTypographyProps={{ fontSize: '0.8125rem' }}
                                                />
                                            </ListItem>
                                            <ListItem disableGutters>
                                                <ListItemText
                                                    primary={`• ${t("Set Mail Host according to your server / Gmail (smtp.gmail.com)")}`}
                                                    primaryTypographyProps={{ fontSize: '0.8125rem' }}
                                                />
                                            </ListItem>
                                            <ListItem disableGutters>
                                                <ListItemText
                                                    primary={`• ${t("Set Mail port as 587")}`}
                                                    primaryTypographyProps={{ fontSize: '0.8125rem' }}
                                                />
                                            </ListItem>
                                            <ListItem disableGutters>
                                                <ListItemText
                                                    primary={`• ${t("Set Mail Encryption as tls")}`}
                                                    primaryTypographyProps={{ fontSize: '0.8125rem' }}
                                                />
                                            </ListItem>
                                        </List>
                                    </Paper>

                                    <Typography variant="subtitle2" fontWeight={700} color="#475569" gutterBottom>
                                        {t("For SSL")}
                                    </Typography>
                                    <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f8fafc', p: 1.5 }}>
                                        <List dense disablePadding>
                                            <ListItem disableGutters>
                                                <ListItemText
                                                    primary={`• ${t("Set Mail Host according to your server Mail Client Manual Settings")}`}
                                                    primaryTypographyProps={{ fontSize: '0.8125rem' }}
                                                />
                                            </ListItem>
                                            <ListItem disableGutters>
                                                <ListItemText
                                                    primary={`• ${t("Set Mail port as 465")}`}
                                                    primaryTypographyProps={{ fontSize: '0.8125rem' }}
                                                />
                                            </ListItem>
                                            <ListItem disableGutters>
                                                <ListItemText
                                                    primary={`• ${t("Set Mail Encryption as ssl")}`}
                                                    primaryTypographyProps={{ fontSize: '0.8125rem' }}
                                                />
                                            </ListItem>
                                        </List>
                                    </Paper>
                                </Box>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SmtpSettings;
