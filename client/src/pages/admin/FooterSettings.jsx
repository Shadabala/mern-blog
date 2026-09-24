import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Stack,
    Switch,
    IconButton,
    Paper,
} from '@mui/material';
import {
    Save as SaveIcon,
    Add as AddIcon,
    Close as CloseIcon,
    Facebook as FacebookIcon,
    Twitter as TwitterIcon,
    Instagram as InstagramIcon,
    YouTube as YoutubeIcon,
    LinkedIn as LinkedinIcon,
} from '@mui/icons-material';
import LanguageTabBar from '../../components/common/LanguageTabBar';
import AizUploaderInput from '../../components/uploader/AizUploaderInput';
import AizTextEditor from '../../components/editor/AizTextEditor';
import { fetchFooterSettingsApi, updateFooterSettingsApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const inputSx = {
    '& .MuiOutlinedInput-root': {
        minHeight: '52px',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        '& fieldset': {
            borderColor: '#d9dde5',
            borderWidth: '1px',
        },
        '&:hover fieldset': {
            borderColor: '#c7ccd5',
        },
        '&.Mui-focused fieldset': {
            borderColor: 'var(--primary-color, #3b82f6)',
            borderWidth: '1.5px',
        },
    },
    '& .MuiInputBase-input': {
        fontSize: '15px',
        color: '#1e293b',
        padding: '12px 16px',
    },
    '& .MuiInputBase-input::placeholder': {
        color: '#94a3b8',
        opacity: 1,
    },
};

const FormFieldRow = ({ label, children, helperText, alignItems = 'center' }) => (
    <Box
        sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '200px minmax(0, 1fr)' },
            columnGap: { xs: 0, sm: 2 },
            alignItems,
            width: '100%',
        }}
    >
        <Box sx={{ minWidth: 0, mb: { xs: 0.75, sm: 0 } }}>
            <Typography sx={{ fontSize: '15px', fontWeight: 500, lineHeight: 1.4, color: '#334155' }}>
                {label}
            </Typography>
        </Box>
        <Box sx={{ minWidth: 0, width: '100%' }}>
            {children}
            {helperText && (
                <Typography sx={{ fontSize: '12px', lineHeight: 1.4, color: '#64748b', mt: 0.5 }}>
                    {helperText}
                </Typography>
            )}
        </Box>
    </Box>
);

const SectionHeader = ({ children }) => (
    <Box sx={{ px: { xs: 2.5, sm: 3, md: 4 }, py: 2, borderBottom: '1px solid #e2e8f0' }}>
        <Typography sx={{ fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>
            {children}
        </Typography>
    </Box>
);

const FooterSettings = () => {
    const { t, currentLang } = useLanguage();
    const [selectedLang, setSelectedLang] = useState(currentLang || 'en');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    const [form, setForm] = useState({
        footer_logo: '',
        footer_logo_circle: 'off',
        about_us_description: '',
        contact_address: '',
        contact_phone: '',
        contact_email: '',
        widget_one_title: '',
        widget_one_labels: [],
        widget_one_links: [],
        widget_two_title: '',
        widget_two_labels: [],
        widget_two_links: [],
        frontend_copyright_text: '',
        show_social_links: 'on',
        facebook_link: '',
        twitter_link: '',
        instagram_link: '',
        youtube_link: '',
        linkedin_link: '',
        payment_method_images: '',
    });

    const loadSettings = useCallback(async (lang) => {
        try {
            setLoading(true);
            const res = await fetchFooterSettingsApi(lang);
            if (res?.success && res.settings) {
                const s = res.settings;
                setForm({
                    footer_logo: s.footer_logo || '',
                    footer_logo_circle: (s.footer_logo_circle === 'on' || s.footer_logo_circle === '1' || s.footer_logo_circle === true) ? 'on' : 'off',
                    about_us_description: s.about_us_description || '',
                    contact_address: s.contact_address || '',
                    contact_phone: s.contact_phone || '',
                    contact_email: s.contact_email || '',
                    widget_one_title: s.widget_one_title || '',
                    widget_one_labels: Array.isArray(s.widget_one_labels) ? s.widget_one_labels : [],
                    widget_one_links: Array.isArray(s.widget_one_links) ? s.widget_one_links : [],
                    widget_two_title: s.widget_two_title || '',
                    widget_two_labels: Array.isArray(s.widget_two_labels) ? s.widget_two_labels : [],
                    widget_two_links: Array.isArray(s.widget_two_links) ? s.widget_two_links : [],
                    frontend_copyright_text: s.frontend_copyright_text || '',
                    show_social_links: (s.show_social_links === 'on' || s.show_social_links === true || s.show_social_links === '1' || s.show_social_links === 1) ? 'on' : 'off',
                    facebook_link: s.facebook_link || '',
                    twitter_link: s.twitter_link || '',
                    instagram_link: s.instagram_link || '',
                    youtube_link: s.youtube_link || '',
                    linkedin_link: s.linkedin_link || '',
                    payment_method_images: s.payment_method_images || '',
                });
            }
        } catch (err) {
            console.error('Failed to load footer settings:', err);
            setAlertMessage({
                type: 'error',
                text: t('Failed to load footer settings', 'Failed to load footer settings'),
            });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadSettings(selectedLang);
    }, [selectedLang, loadSettings]);

    const handleFieldChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleAddLink = (widgetNum) => {
        const labelKey = widgetNum === 1 ? 'widget_one_labels' : 'widget_two_labels';
        const linkKey = widgetNum === 1 ? 'widget_one_links' : 'widget_two_links';
        setForm(prev => ({
            ...prev,
            [labelKey]: [...prev[labelKey], ''],
            [linkKey]: [...prev[linkKey], ''],
        }));
    };

    const handleRemoveLink = (widgetNum, index) => {
        const labelKey = widgetNum === 1 ? 'widget_one_labels' : 'widget_two_labels';
        const linkKey = widgetNum === 1 ? 'widget_one_links' : 'widget_two_links';
        setForm(prev => ({
            ...prev,
            [labelKey]: prev[labelKey].filter((_, i) => i !== index),
            [linkKey]: prev[linkKey].filter((_, i) => i !== index),
        }));
    };

    const handleLinkItemChange = (widgetNum, type, index, value) => {
        const key = widgetNum === 1
            ? (type === 'label' ? 'widget_one_labels' : 'widget_one_links')
            : (type === 'label' ? 'widget_two_labels' : 'widget_two_links');
        setForm(prev => {
            const updated = [...prev[key]];
            updated[index] = value;
            return { ...prev, [key]: updated };
        });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        setAlertMessage({ type: 'info', text: '' });

        try {
            await updateFooterSettingsApi({
                ...form,
                lang: selectedLang,
            });

            const successMsg = t('Footer settings updated successfully', 'Footer settings updated successfully');
            setAlertMessage({ type: 'success', text: successMsg });
            toast.success(successMsg);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('website_settings_updated'));
            }
        } catch (err) {
            console.error('Failed to update footer settings:', err);
            const errorMsg = err?.response?.data?.message || t('Failed to update footer settings', 'Failed to update footer settings');
            setAlertMessage({ type: 'error', text: errorMsg });
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, sm: 2.5, md: 3 }, pb: 6 }}>
            <Box sx={{ width: '100%', maxWidth: '960px', mx: 'auto' }}>
                <LanguageTabBar
                    selectedLang={selectedLang}
                    onLangChange={(lang) => setSelectedLang(lang)}
                />

                {alertMessage.text && (
                    <Alert
                        severity={alertMessage.type}
                        onClose={() => setAlertMessage({ type: 'info', text: '' })}
                        sx={{ mb: 2, borderRadius: '8px' }}
                    >
                        {alertMessage.text}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        {/* 1. FOOTER INFO CARD */}
                        <Paper elevation={0} sx={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <SectionHeader>{t('Footer Info & Contact', 'Footer Info & Contact')}</SectionHeader>
                            <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                                <Stack spacing={2.5}>
                                    <FormFieldRow label={t('Footer Logo', 'Footer Logo')} alignItems="start">
                                        <AizUploaderInput
                                            value={form.footer_logo}
                                            onChange={(url) => handleFieldChange('footer_logo', url)}
                                            type="image"
                                            placeholder={t('Choose file', 'Choose file')}
                                        />
                                    </FormFieldRow>

                                    {/* FOOTER LOGO CIRCLE TOGGLE */}
                                    <FormFieldRow
                                        label={t('Footer Logo Circle ?', 'Footer Logo Circle ?')}
                                        helperText={t('If enabled, the footer logo will be displayed as a circle badge. If disabled, standard full-size image will be displayed.', 'If enabled, the footer logo will be displayed as a circle badge. If disabled, standard full-size image will be displayed.')}
                                    >
                                        <Switch
                                            checked={form.footer_logo_circle === 'on'}
                                            onChange={(e) => handleFieldChange('footer_logo_circle', e.target.checked ? 'on' : 'off')}
                                            color="primary"
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('About Us Description', 'About Us Description')} alignItems="start">
                                        <AizTextEditor
                                            value={form.about_us_description}
                                            onChange={(content) => handleFieldChange('about_us_description', content)}
                                            placeholder={t('Write description here...', 'Write description here...')}
                                            minHeight={150}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Contact Address', 'Contact Address')}>
                                        <TextField
                                            fullWidth
                                            placeholder={t('Enter address', 'Enter address')}
                                            value={form.contact_address || ''}
                                            onChange={(e) => handleFieldChange('contact_address', e.target.value)}
                                            sx={inputSx}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Contact Phone', 'Contact Phone')}>
                                        <TextField
                                            fullWidth
                                            placeholder={t('Enter phone number', 'Enter phone number')}
                                            value={form.contact_phone || ''}
                                            onChange={(e) => handleFieldChange('contact_phone', e.target.value)}
                                            sx={inputSx}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Contact Email', 'Contact Email')}>
                                        <TextField
                                            fullWidth
                                            placeholder={t('Enter email address', 'Enter email address')}
                                            value={form.contact_email || ''}
                                            onChange={(e) => handleFieldChange('contact_email', e.target.value)}
                                            sx={inputSx}
                                        />
                                    </FormFieldRow>
                                </Stack>
                            </Box>
                        </Paper>

                        {/* 2. FOOTER LINK WIDGETS CARD */}
                        <Paper elevation={0} sx={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <SectionHeader>{t('Footer Link Widgets', 'Footer Link Widgets')}</SectionHeader>
                            <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                                <Stack spacing={3.5}>
                                    {/* Widget One */}
                                    <Box>
                                        <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', mb: 1.5 }}>
                                            {t('Link Widget 1', 'Link Widget 1')}
                                        </Typography>
                                        <FormFieldRow label={t('Widget Title', 'Widget Title')}>
                                            <TextField
                                                fullWidth
                                                placeholder={t('Widget Title', 'Widget Title')}
                                                value={form.widget_one_title || ''}
                                                onChange={(e) => handleFieldChange('widget_one_title', e.target.value)}
                                                sx={inputSx}
                                            />
                                        </FormFieldRow>

                                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                                            {form.widget_one_labels.map((label, index) => (
                                                <Paper key={index} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', p: 1.5, backgroundColor: '#f8fafc' }}>
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 44px' }, gap: 1.5, alignItems: 'center' }}>
                                                        <TextField
                                                            fullWidth
                                                            placeholder={t('Label', 'Label')}
                                                            value={label || ''}
                                                            onChange={(e) => handleLinkItemChange(1, 'label', index, e.target.value)}
                                                            sx={inputSx}
                                                        />
                                                        <TextField
                                                            fullWidth
                                                            placeholder={t('Link with http:// or https://', 'Link with http:// or https://')}
                                                            value={form.widget_one_links[index] || ''}
                                                            onChange={(e) => handleLinkItemChange(1, 'link', index, e.target.value)}
                                                            sx={inputSx}
                                                        />
                                                        <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-end', sm: 'center' } }}>
                                                            <IconButton
                                                                type="button"
                                                                onClick={() => handleRemoveLink(1, index)}
                                                                sx={{ width: '40px', height: '40px', color: '#ef4444', border: '1px solid #fecaca', backgroundColor: '#fff5f5', borderRadius: '6px' }}
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                </Paper>
                                            ))}
                                            <Box>
                                                <Button
                                                    type="button"
                                                    variant="outlined"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleAddLink(1)}
                                                    sx={{ height: '38px', px: 2, borderRadius: '6px', textTransform: 'none', fontSize: '13px', fontWeight: 500, color: '#334155', borderColor: '#cbd5e1' }}
                                                >
                                                    {t('Add Link', 'Add Link')}
                                                </Button>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    {/* Widget Two */}
                                    <Box sx={{ pt: 2, borderTop: '1px solid #f1f5f9' }}>
                                        <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', mb: 1.5 }}>
                                            {t('Link Widget 2', 'Link Widget 2')}
                                        </Typography>
                                        <FormFieldRow label={t('Widget Title', 'Widget Title')}>
                                            <TextField
                                                fullWidth
                                                placeholder={t('Widget Title', 'Widget Title')}
                                                value={form.widget_two_title || ''}
                                                onChange={(e) => handleFieldChange('widget_two_title', e.target.value)}
                                                sx={inputSx}
                                            />
                                        </FormFieldRow>

                                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                                            {form.widget_two_labels.map((label, index) => (
                                                <Paper key={index} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', p: 1.5, backgroundColor: '#f8fafc' }}>
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 44px' }, gap: 1.5, alignItems: 'center' }}>
                                                        <TextField
                                                            fullWidth
                                                            placeholder={t('Label', 'Label')}
                                                            value={label || ''}
                                                            onChange={(e) => handleLinkItemChange(2, 'label', index, e.target.value)}
                                                            sx={inputSx}
                                                        />
                                                        <TextField
                                                            fullWidth
                                                            placeholder={t('Link with http:// or https://', 'Link with http:// or https://')}
                                                            value={form.widget_two_links[index] || ''}
                                                            onChange={(e) => handleLinkItemChange(2, 'link', index, e.target.value)}
                                                            sx={inputSx}
                                                        />
                                                        <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-end', sm: 'center' } }}>
                                                            <IconButton
                                                                type="button"
                                                                onClick={() => handleRemoveLink(2, index)}
                                                                sx={{ width: '40px', height: '40px', color: '#ef4444', border: '1px solid #fecaca', backgroundColor: '#fff5f5', borderRadius: '6px' }}
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                </Paper>
                                            ))}
                                            <Box>
                                                <Button
                                                    type="button"
                                                    variant="outlined"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleAddLink(2)}
                                                    sx={{ height: '38px', px: 2, borderRadius: '6px', textTransform: 'none', fontSize: '13px', fontWeight: 500, color: '#334155', borderColor: '#cbd5e1' }}
                                                >
                                                    {t('Add Link', 'Add Link')}
                                                </Button>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Box>
                        </Paper>

                        {/* 3. FOOTER BOTTOM & SOCIAL */}
                        <Paper elevation={0} sx={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <SectionHeader>{t('Footer Bottom & Social Links', 'Footer Bottom & Social Links')}</SectionHeader>
                            <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                                <Stack spacing={2.5}>
                                    <FormFieldRow label={t('Copyright Text', 'Copyright Text')} alignItems="start">
                                        <AizTextEditor
                                            value={form.frontend_copyright_text}
                                            onChange={(content) => handleFieldChange('frontend_copyright_text', content)}
                                            placeholder={t('Copyright text...', 'Copyright text...')}
                                            minHeight={120}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Show Social Links ?', 'Show Social Links ?')}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Switch
                                                checked={form.show_social_links === 'on'}
                                                onChange={(e) => handleFieldChange('show_social_links', e.target.checked ? 'on' : 'off')}
                                                color="primary"
                                            />
                                        </Box>
                                    </FormFieldRow>

                                    {form.show_social_links === 'on' && (
                                        <>
                                            <FormFieldRow label={t('Facebook Link', 'Facebook Link')}>
                                                <TextField
                                                    fullWidth
                                                    placeholder="https://facebook.com/..."
                                                    value={form.facebook_link || ''}
                                                    onChange={(e) => handleFieldChange('facebook_link', e.target.value)}
                                                    sx={inputSx}
                                                />
                                            </FormFieldRow>

                                            <FormFieldRow label={t('Twitter / X Link', 'Twitter / X Link')}>
                                                <TextField
                                                    fullWidth
                                                    placeholder="https://x.com/..."
                                                    value={form.twitter_link || ''}
                                                    onChange={(e) => handleFieldChange('twitter_link', e.target.value)}
                                                    sx={inputSx}
                                                />
                                            </FormFieldRow>

                                            <FormFieldRow label={t('Instagram Link', 'Instagram Link')}>
                                                <TextField
                                                    fullWidth
                                                    placeholder="https://instagram.com/..."
                                                    value={form.instagram_link || ''}
                                                    onChange={(e) => handleFieldChange('instagram_link', e.target.value)}
                                                    sx={inputSx}
                                                />
                                            </FormFieldRow>

                                            <FormFieldRow label={t('YouTube Link', 'YouTube Link')}>
                                                <TextField
                                                    fullWidth
                                                    placeholder="https://youtube.com/..."
                                                    value={form.youtube_link || ''}
                                                    onChange={(e) => handleFieldChange('youtube_link', e.target.value)}
                                                    sx={inputSx}
                                                />
                                            </FormFieldRow>

                                            <FormFieldRow label={t('LinkedIn Link', 'LinkedIn Link')}>
                                                <TextField
                                                    fullWidth
                                                    placeholder="https://linkedin.com/..."
                                                    value={form.linkedin_link || ''}
                                                    onChange={(e) => handleFieldChange('linkedin_link', e.target.value)}
                                                    sx={inputSx}
                                                />
                                            </FormFieldRow>
                                        </>
                                    )}

                                    <FormFieldRow label={t('Payment Methods Banner', 'Payment Methods Banner')} alignItems="start">
                                        <AizUploaderInput
                                            value={form.payment_method_images}
                                            onChange={(url) => handleFieldChange('payment_method_images', url)}
                                            type="image"
                                            placeholder={t('Choose file', 'Choose file')}
                                        />
                                    </FormFieldRow>
                                </Stack>
                            </Box>
                        </Paper>

                        {/* SAVE BUTTON */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                            <Button
                                type="submit"
                                variant="outlined"
                                className="btn-outline-primary"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon sx={{ fontSize: '18px' }} />}
                                sx={{
                                    minWidth: '130px',
                                    height: '44px',
                                    px: 3,
                                    borderRadius: '6px',
                                    textTransform: 'none',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: 'var(--primary-color, #2563eb)',
                                    borderColor: 'var(--primary-color, #2563eb)',
                                    backgroundColor: 'transparent',
                                    '&:hover': {
                                        color: '#ffffff',
                                        backgroundColor: 'var(--primary-color, #2563eb)',
                                        borderColor: 'var(--primary-color, #2563eb)'
                                    },
                                    '&:disabled': {
                                        color: 'var(--primary-color, #2563eb)',
                                        borderColor: 'var(--primary-color, #2563eb)',
                                        opacity: 0.6
                                    }
                                }}
                            >
                                {saving ? t('Saving...', 'Saving...') : t('Save Settings', 'Save Settings')}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
};

export default FooterSettings;