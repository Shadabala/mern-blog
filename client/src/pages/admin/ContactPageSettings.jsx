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
import { fetchContactPageSettingsApi, updateWebsiteSettingsApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const ContactPageSettings = () => {
    const { t, currentLang } = useLanguage();

    const [selectedLang, setSelectedLang] = useState(currentLang || 'en');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Toast / Feedback alert state
    const [alertState, setAlertState] = useState({ open: false, message: '', severity: 'success' });

    // Form settings state
    const [settings, setSettings] = useState({
        contact_page_phone: '',
        contact_whatsapp: '',
        contact_email: '',
        contact_address: '',
        contact_hours: '',
        contact_page_slider_heading: '',
        contact_page_slider_text: '',
        contact_page_main_heading: '',
        contact_page_main_text: '',
        contact_page_info_heading: '',
        contact_page_info_text: '',
        contact_page_form_heading: '',
        contact_page_form_text: ''
    });

    // Helper to normalize and ensure arrays are never undefined
    const normalizeSettingsData = useCallback((s = {}) => {

        return {
            contact_page_phone: s.contact_page_phone || '',
            contact_whatsapp: s.contact_whatsapp || '',
            contact_email: s.contact_email || '',
            contact_address: s.contact_address || '',
            contact_hours: s.contact_hours || '',

            contact_page_slider_heading: s.contact_page_slider_heading || '',
            contact_page_slider_text: s.contact_page_slider_text || '',
            contact_page_main_heading: s.contact_page_main_heading || '',
            contact_page_main_text: s.contact_page_main_text || '',
            contact_page_info_heading: s.contact_page_info_heading || '',
            contact_page_info_text: s.contact_page_info_text || '',
            contact_page_form_heading: s.contact_page_form_heading || '',
            contact_page_form_text: s.contact_page_form_text || ''
        };
    }, []);

    const loadSettings = useCallback(async (langCode) => {
        setLoading(true);
        try {
            const res = await fetchContactPageSettingsApi(langCode);
            if (res?.success) {
                const s = res.settings || {};
                setSettings(normalizeSettingsData(s));
            } else {
                setSettings(normalizeSettingsData({}));
            }
        } catch (err) {
            console.error('Failed to load contact page settings:', err);
            setSettings(normalizeSettingsData({}));
            setAlertState({
                open: true,
                message: err.response?.data?.message || t('Failed to load contact page settings', 'Failed to load contact page settings'),
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, [t, normalizeSettingsData]);

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
            const successMsg = res?.message || t('Contact page settings updated successfully', 'Contact page settings updated successfully');
            setAlertState({
                open: true,
                message: successMsg,
                severity: 'success'
            });
            toast.success(successMsg);

            // Trigger global sync event so Public contact page updates immediately
            window.dispatchEvent(new Event('website_settings_updated'));
        } catch (err) {
            console.error('Failed to save contact page settings:', err);
            const errorMsg = err.response?.data?.message || t('Failed to update contact page settings', 'Failed to update contact page settings');
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
                            {t("Contact Page Settings", "Contact Page Settings")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t("Configure contact details, working hours, and hero banners shown on the public Contact Us page.", "Configure contact details, working hours, and hero banners shown on the public Contact Us page.")}
                        </Typography>
                    </Box>
                </Box>

                <Button
                    variant="outlined"
                    size="small"
                    component={MuiLink}
                    href="/contact"
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
                    {/* SECTION 1: DIRECT CONTACT INFORMATION */}
                    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid #e2e8f0', borderRadius: '12px', mb: 4, bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                    {t("Direct Contact Information", "Direct Contact Information")}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {t("These contact details are displayed live on the public Contact Us page inside the Contact Information card.", "These contact details are displayed live on the public Contact Us page inside the Contact Information card.")}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={3}>
                            {/* Left: Input Form Controls */}
                            <Grid item size={{ xs: 12, lg: 7 }} xs={12} lg={7}>
                                <Grid container spacing={2.5}>
                                    {/* Phone Number */}
                                    <Grid item size={{ xs: 12, sm: 6 }} xs={12} sm={6}>
                                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <PhoneIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                            <Typography variant="body2" fontWeight={600} color="#334155">
                                                {t("Contact Phone", "Contact Phone")}
                                            </Typography>
                                        </Box>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="+91 9807770015"
                                            value={settings.contact_page_phone || ''}
                                            onChange={(e) => handleFieldChange('contact_page_phone', e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                        />
                                    </Grid>

                                    {/* WhatsApp Number */}
                                    <Grid item size={{ xs: 12, sm: 6 }} xs={12} sm={6}>
                                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <WhatsAppIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                            <Typography variant="body2" fontWeight={600} color="#334155">
                                                {t("Contact WhatsApp", "Contact WhatsApp")}
                                            </Typography>
                                        </Box>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="+91 9807770015"
                                            value={settings.contact_whatsapp || ''}
                                            onChange={(e) => handleFieldChange('contact_whatsapp', e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                        />
                                    </Grid>

                                    {/* Email Address */}
                                    <Grid item size={{ xs: 12, sm: 6 }} xs={12} sm={6}>
                                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <EmailIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                            <Typography variant="body2" fontWeight={600} color="#334155">
                                                {t("Contact Email Address", "Contact Email Address")}
                                            </Typography>
                                        </Box>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="email"
                                            placeholder="my.shadabalam@gmail.com"
                                            value={settings.contact_email || ''}
                                            onChange={(e) => handleFieldChange('contact_email', e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                        />
                                    </Grid>

                                    {/* Office Address */}
                                    <Grid item size={{ xs: 12 }} xs={12}>
                                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <PlaceIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                            <Typography variant="body2" fontWeight={600} color="#334155">
                                                {t("Office Address / Location", "Office Address / Location")}
                                            </Typography>
                                        </Box>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Kanpur, Uttar Pradesh, India"
                                            value={settings.contact_address || ''}
                                            onChange={(e) => handleFieldChange('contact_address', e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                        />
                                    </Grid>

                                    {/* Working Hours */}
                                    <Grid item size={{ xs: 12 }} xs={12}>
                                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <TimeIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                            <Typography variant="body2" fontWeight={600} color="#334155">
                                                {t("Working Hours / Availability", "Working Hours / Availability")}
                                            </Typography>
                                        </Box>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Monday - Saturday, 10:00 AM - 6:00 PM"
                                            value={settings.contact_hours || ''}
                                            onChange={(e) => handleFieldChange('contact_hours', e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* Right: Live Preview Box */}
                            <Grid item size={{ xs: 12, lg: 5 }} xs={12} lg={5}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        bgcolor: '#f8fafc',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                            <VisibilityIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                                            <Typography variant="subtitle2" fontWeight={700} color="#1e293b">
                                                {t("Live Card Preview", "Live Card Preview")}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                            {t("Here is how your details will render on the public contact page:", "Here is how your details will render on the public contact page:")}
                                        </Typography>

                                        <Stack spacing={1.5}>
                                            {/* Phone */}
                                            {settings.contact_page_phone != null && settings.contact_page_phone !== '' && (
                                                <Paper elevation={0} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: '#e8f8ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                                                        <PhoneIcon sx={{ fontSize: 18 }} />
                                                    </Box>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="caption" color="#64748b" fontWeight={600} display="block">
                                                            {t("Phone Call", "Phone Call")}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={700} color="#0f172a" noWrap>
                                                            {settings.contact_page_phone}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            )}

                                            {/* Email */}
                                            {settings.contact_email != null && settings.contact_email !== '' && (
                                                <Paper elevation={0} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                                                        <EmailIcon sx={{ fontSize: 18 }} />
                                                    </Box>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="caption" color="#64748b" fontWeight={600} display="block">
                                                            {t("Email Address", "Email Address")}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={700} color="#0f172a" noWrap>
                                                            {settings.contact_email || 'my.shadabalam@gmail.com'}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            )}

                                            {/* Address */}
                                            {settings.contact_address != null && settings.contact_address !== '' && (
                                                <Paper elevation={0} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                                                        <PlaceIcon sx={{ fontSize: 18 }} />
                                                    </Box>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="caption" color="#64748b" fontWeight={600} display="block">
                                                            {t("Office Location", "Office Location")}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={700} color="#0f172a" noWrap>
                                                            {settings.contact_address || 'Kanpur, Uttar Pradesh, India'}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            )}

                                            {/* WhatsApp */}
                                            {settings.contact_whatsapp != null && settings.contact_whatsapp !== '' && (
                                                <Paper elevation={0} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                                                        <WhatsAppIcon sx={{ fontSize: 18 }} />
                                                    </Box>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="caption" color="#64748b" fontWeight={600} display="block">
                                                            {t("WhatsApp Direct", "WhatsApp Direct")}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={700} color="#0f172a" noWrap>
                                                            {settings.contact_page_phone || '+91 9807770015'}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            )}
                                        </Stack>
                                    </Box>
                                </Card>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* SECTION 2: CONTACT FORM SETTINGS */}
                    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid #e2e8f0', borderRadius: '12px', mb: 4, bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                    {t("Contact Form Settings", "Contact Form Settings")}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {t("Enable/disable form fields, set validation, enable captcha, and configure email notifications.", "Enable/disable form fields, set validation, enable captcha, and configure email notifications.")}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={3}>
                            {/* Left: Input Form Controls */}
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
                                    value={settings.contact_page_slider_heading || ''}
                                    onChange={(e) => handleFieldChange('contact_page_slider_heading', e.target.value)}
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
                                    value={settings.contact_page_slider_text || ''}
                                    onChange={(e) => handleFieldChange('contact_page_slider_text', e.target.value)}
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
                                    value={settings.contact_page_main_heading || ''}
                                    onChange={(e) => handleFieldChange('contact_page_main_heading', e.target.value)}
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
                                <TextField
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={4}
                                    placeholder="Enter your text"
                                    value={settings.contact_page_main_text || ''}
                                    onChange={(e) => handleFieldChange('contact_page_main_text', e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                />
                            </Grid>

                            {/* Info Heading */}
                            <Grid size={{ xs: 12 }} xs={12}>
                                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                    <Typography variant="body2" fontWeight={600} color="#334155">
                                        {t("Info Heading", "Info Heading")}
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Enter your heading"
                                    value={settings.contact_page_info_heading || ''}
                                    onChange={(e) => handleFieldChange('contact_page_info_heading', e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                />
                            </Grid>

                            {/* Info Text */}
                            <Grid size={{ xs: 12 }} xs={12}>
                                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                    <Typography variant="body2" fontWeight={600} color="#334155">
                                        {t("Info Text", "Info Text")}
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Enter your text"
                                    value={settings.contact_page_info_text || ''}
                                    onChange={(e) => handleFieldChange('contact_page_info_text', e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                />
                            </Grid>

                            {/* Form Heading */}
                            <Grid size={{ xs: 12 }} xs={12}>
                                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                    <Typography variant="body2" fontWeight={600} color="#334155">
                                        {t("Form Heading", "Form Heading")}
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Enter your heading"
                                    value={settings.contact_page_form_heading || ''}
                                    onChange={(e) => handleFieldChange('contact_page_form_heading', e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
                                />
                            </Grid>

                            {/* Form Text */}
                            <Grid size={{ xs: 12 }} xs={12}>
                                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                    <Typography variant="body2" fontWeight={600} color="#334155">
                                        {t("Form Text", "Form Text")}
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Enter your text"
                                    value={settings.contact_page_form_text || ''}
                                    onChange={(e) => handleFieldChange('contact_page_form_text', e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
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

export default ContactPageSettings;
