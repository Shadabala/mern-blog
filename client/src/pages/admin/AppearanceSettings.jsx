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
    Paper,
    Grid,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import LanguageTabBar from '../../components/common/LanguageTabBar';
import AizUploaderInput from '../../components/uploader/AizUploaderInput';
import AizTextEditor from '../../components/editor/AizTextEditor';
import { fetchAppearanceSettingsApi, updateAppearanceSettingsApi } from '../../api/admin.api';
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

const textareaSx = {
    ...inputSx,
    '& .MuiOutlinedInput-root': {
        minHeight: 'unset',
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
        fontSize: '14px',
        color: '#1e293b',
        padding: '14px 16px',
        lineHeight: 1.6,
    },
};

const FormFieldRow = ({ label, children, helperText, alignItems = 'center' }) => (
    <Box
        sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '220px minmax(0, 1fr)' },
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

const AppearanceSettings = () => {
    const { t, currentLang } = useLanguage();
    const [selectedLang, setSelectedLang] = useState(currentLang || 'en');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    const [form, setForm] = useState({
        site_name: '',
        site_motto: '',
        site_icon: '',
        system_logo_white: '',
        system_logo_black: '',
        header_logo_circle: 'off',
        footer_logo_circle: 'off',
        primary_color: '#3bf73e',
        primary_hover_color: '#94d382',
        secondary_color: '#de3f7f',
        secondary_hover_color: '#b92d64',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        meta_image: '',
        cookies_agreement_text: '',
        show_cookies_agreement: 'off',
        show_website_popup: 'off',
        website_popup_content: '',
        show_subscribe_form: 'off',
        header_script: '',
        footer_script: '',
    });

    const loadSettings = useCallback(async (lang) => {
        try {
            setLoading(true);
            const res = await fetchAppearanceSettingsApi(lang);
            if (res?.success && res.settings) {
                const s = res.settings;
                setForm({
                    site_name: s.site_name || s.website_name || '',
                    site_motto: s.site_motto || '',
                    site_icon: s.site_icon || '',
                    system_logo_white: s.system_logo_white || '',
                    system_logo_black: s.system_logo_black || '',
                    header_logo_circle: (s.header_logo_circle === 'on' || s.header_logo_circle === true || s.header_logo_circle === '1' || s.header_logo_circle === 1) ? 'on' : 'off',
                    footer_logo_circle: (s.footer_logo_circle === 'on' || s.footer_logo_circle === true || s.footer_logo_circle === '1' || s.footer_logo_circle === 1) ? 'on' : 'off',
                    primary_color: s.primary_color || '#3bf73e',
                    primary_hover_color: s.primary_hover_color || '#94d382',
                    secondary_color: s.secondary_color || '#de3f7f',
                    secondary_hover_color: s.secondary_hover_color || '#b92d64',
                    meta_title: s.meta_title || '',
                    meta_description: s.meta_description || '',
                    meta_keywords: s.meta_keywords || '',
                    meta_image: s.meta_image || '',
                    cookies_agreement_text: s.cookies_agreement_text || '',
                    show_cookies_agreement: (s.show_cookies_agreement === 'on' || s.show_cookies_agreement === true || s.show_cookies_agreement === '1' || s.show_cookies_agreement === 1) ? 'on' : 'off',
                    show_website_popup: (s.show_website_popup === 'on' || s.show_website_popup === true || s.show_website_popup === '1' || s.show_website_popup === 1) ? 'on' : 'off',
                    website_popup_content: s.website_popup_content || '',
                    show_subscribe_form: (s.show_subscribe_form === 'on' || s.show_subscribe_form === true || s.show_subscribe_form === '1' || s.show_subscribe_form === 1) ? 'on' : 'off',
                    header_script: s.header_script || '',
                    footer_script: s.footer_script || '',
                });
            }
        } catch (err) {
            console.error('Failed to load appearance settings:', err);
            setAlertMessage({
                type: 'error',
                text: t('Failed to load appearance settings', 'Failed to load appearance settings'),
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

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        setAlertMessage({ type: 'info', text: '' });

        try {
            await updateAppearanceSettingsApi({
                ...form,
                lang: selectedLang,
            });

            const successMsg = t('Appearance settings updated successfully', 'Appearance settings updated successfully');
            setAlertMessage({ type: 'success', text: successMsg });
            toast.success(successMsg);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('website_settings_updated'));
            }
        } catch (err) {
            console.error('Failed to update appearance settings:', err);
            const errorMsg = err?.response?.data?.message || t('Failed to update appearance settings', 'Failed to update appearance settings');
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
                        {/* 1. GENERAL & BRANDING */}
                        <Paper elevation={0} sx={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <SectionHeader>{t('General & Branding', 'General & Branding')}</SectionHeader>
                            <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                                <Stack spacing={2.5}>
                                    <FormFieldRow label={t('Frontend Website Name', 'Frontend Website Name')}>
                                        <TextField
                                            fullWidth
                                            placeholder={t('Website Name', 'Website Name')}
                                            value={form.site_name || ''}
                                            onChange={(e) => handleFieldChange('site_name', e.target.value)}
                                            sx={inputSx}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Site Motto', 'Site Motto')}>
                                        <TextField
                                            fullWidth
                                            placeholder={t('Site Motto', 'Site Motto')}
                                            value={form.site_motto || ''}
                                            onChange={(e) => handleFieldChange('site_motto', e.target.value)}
                                            sx={inputSx}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Site Icon (Favicon)', 'Site Icon (Favicon)')} alignItems="start">
                                        <AizUploaderInput
                                            value={form.site_icon}
                                            onChange={(url) => handleFieldChange('site_icon', url)}
                                            type="image"
                                            placeholder={t('Choose file', 'Choose file')}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('System Logo - White', 'System Logo - White')} alignItems="start">
                                        <AizUploaderInput
                                            value={form.system_logo_white}
                                            onChange={(url) => handleFieldChange('system_logo_white', url)}
                                            type="image"
                                            placeholder={t('Choose file', 'Choose file')}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('System Logo - Black', 'System Logo - Black')} alignItems="start">
                                        <AizUploaderInput
                                            value={form.system_logo_black}
                                            onChange={(url) => handleFieldChange('system_logo_black', url)}
                                            type="image"
                                            placeholder={t('Choose file', 'Choose file')}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow
                                        label={t('Header Logo Circle ?', 'Header Logo Circle ?')}
                                        helperText={t('Show header logo as a circular badge. Turn off to display full-size rectangular logo.', 'Show header logo as a circular badge. Turn off to display full-size rectangular logo.')}
                                    >
                                        <Switch
                                            checked={form.header_logo_circle === 'on'}
                                            onChange={(e) => handleFieldChange('header_logo_circle', e.target.checked ? 'on' : 'off')}
                                            color="primary"
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow
                                        label={t('Footer Logo Circle ?', 'Footer Logo Circle ?')}
                                        helperText={t('Show footer logo as a circular badge. Turn off to display full-size rectangular logo.', 'Show footer logo as a circular badge. Turn off to display full-size rectangular logo.')}
                                    >
                                        <Switch
                                            checked={form.footer_logo_circle === 'on'}
                                            onChange={(e) => handleFieldChange('footer_logo_circle', e.target.checked ? 'on' : 'off')}
                                            color="primary"
                                        />
                                    </FormFieldRow>
                                </Stack>
                            </Box>
                        </Paper>

                        {/* 2. THEME COLORS */}
                        <Paper elevation={0} sx={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <SectionHeader>{t('Theme Colors', 'Theme Colors')}</SectionHeader>
                            <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                                <Stack spacing={2.5}>
                                    <FormFieldRow label={t('Primary Color', 'Primary Color')}>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                            <input
                                                type="color"
                                                value={form.primary_color || '#3b82f6'}
                                                onChange={(e) => handleFieldChange('primary_color', e.target.value)}
                                                style={{ width: '48px', height: '48px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '2px' }}
                                            />
                                            <TextField
                                                value={form.primary_color || ''}
                                                onChange={(e) => handleFieldChange('primary_color', e.target.value)}
                                                sx={{ ...inputSx, width: '180px' }}
                                            />
                                        </Box>
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Primary Hover Color', 'Primary Hover Color')}>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                            <input
                                                type="color"
                                                value={form.primary_hover_color || '#1d4ed8'}
                                                onChange={(e) => handleFieldChange('primary_hover_color', e.target.value)}
                                                style={{ width: '48px', height: '48px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '2px' }}
                                            />
                                            <TextField
                                                value={form.primary_hover_color || ''}
                                                onChange={(e) => handleFieldChange('primary_hover_color', e.target.value)}
                                                sx={{ ...inputSx, width: '180px' }}
                                            />
                                        </Box>
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Secondary Color', 'Secondary Color')}>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                            <input
                                                type="color"
                                                value={form.secondary_color || '#de3f7f'}
                                                onChange={(e) => handleFieldChange('secondary_color', e.target.value)}
                                                style={{ width: '48px', height: '48px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '2px' }}
                                            />
                                            <TextField
                                                value={form.secondary_color || ''}
                                                onChange={(e) => handleFieldChange('secondary_color', e.target.value)}
                                                sx={{ ...inputSx, width: '180px' }}
                                            />
                                        </Box>
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Secondary Hover Color', 'Secondary Hover Color')}>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                            <input
                                                type="color"
                                                value={form.secondary_hover_color || '#b92d64'}
                                                onChange={(e) => handleFieldChange('secondary_hover_color', e.target.value)}
                                                style={{ width: '48px', height: '48px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '2px' }}
                                            />
                                            <TextField
                                                value={form.secondary_hover_color || ''}
                                                onChange={(e) => handleFieldChange('secondary_hover_color', e.target.value)}
                                                sx={{ ...inputSx, width: '180px' }}
                                            />
                                        </Box>
                                    </FormFieldRow>
                                </Stack>
                            </Box>
                        </Paper>

                        {/* 3. SEO & META TAGS */}
                        <Paper elevation={0} sx={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <SectionHeader>{t('SEO & Meta Information', 'SEO & Meta Information')}</SectionHeader>
                            <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                                <Stack spacing={2.5}>
                                    <FormFieldRow label={t('Meta Title', 'Meta Title')}>
                                        <TextField
                                            fullWidth
                                            placeholder={t('Meta Title', 'Meta Title')}
                                            value={form.meta_title || ''}
                                            onChange={(e) => handleFieldChange('meta_title', e.target.value)}
                                            sx={inputSx}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Meta Description', 'Meta Description')} alignItems="start">
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            placeholder={t('Meta Description', 'Meta Description')}
                                            value={form.meta_description || ''}
                                            onChange={(e) => handleFieldChange('meta_description', e.target.value)}
                                            sx={textareaSx}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Meta Keywords', 'Meta Keywords')}>
                                        <TextField
                                            fullWidth
                                            placeholder="keyword1, keyword2, keyword3"
                                            value={form.meta_keywords || ''}
                                            onChange={(e) => handleFieldChange('meta_keywords', e.target.value)}
                                            sx={inputSx}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Meta Image', 'Meta Image')} alignItems="start">
                                        <AizUploaderInput
                                            value={form.meta_image}
                                            onChange={(url) => handleFieldChange('meta_image', url)}
                                            type="image"
                                            placeholder={t('Choose file', 'Choose file')}
                                        />
                                    </FormFieldRow>
                                </Stack>
                            </Box>
                        </Paper>

                        {/* 4. COOKIES & POPUP */}
                        <Paper elevation={0} sx={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <SectionHeader>{t('Cookies & Popup Modal', 'Cookies & Popup Modal')}</SectionHeader>
                            <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                                <Stack spacing={2.5}>
                                    <FormFieldRow label={t('Show Cookies Agreement ?', 'Show Cookies Agreement ?')}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Switch
                                                checked={form.show_cookies_agreement === 'on'}
                                                onChange={(e) => handleFieldChange('show_cookies_agreement', e.target.checked ? 'on' : 'off')}
                                                color="primary"
                                            />
                                        </Box>
                                    </FormFieldRow>

                                    {form.show_cookies_agreement === 'on' && (
                                        <FormFieldRow label={t('Cookies Agreement Text', 'Cookies Agreement Text')} alignItems="start">
                                            <AizTextEditor
                                                value={form.cookies_agreement_text}
                                                onChange={(content) => handleFieldChange('cookies_agreement_text', content)}
                                                placeholder={t('Cookies agreement notice...', 'Cookies agreement notice...')}
                                                minHeight={120}
                                            />
                                        </FormFieldRow>
                                    )}

                                    <FormFieldRow label={t('Show Website Popup ?', 'Show Website Popup ?')}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Switch
                                                checked={form.show_website_popup === 'on'}
                                                onChange={(e) => handleFieldChange('show_website_popup', e.target.checked ? 'on' : 'off')}
                                                color="primary"
                                            />
                                        </Box>
                                    </FormFieldRow>

                                    {form.show_website_popup === 'on' && (
                                        <>
                                            <FormFieldRow label={t('Website Popup Content', 'Website Popup Content')} alignItems="start">
                                                <AizTextEditor
                                                    value={form.website_popup_content}
                                                    onChange={(content) => handleFieldChange('website_popup_content', content)}
                                                    placeholder={t('Popup description/announcement...', 'Popup description/announcement...')}
                                                    minHeight={150}
                                                />
                                            </FormFieldRow>

                                            <FormFieldRow label={t('Show Subscribe Form in Popup ?', 'Show Subscribe Form in Popup ?')}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Switch
                                                        checked={form.show_subscribe_form === 'on'}
                                                        onChange={(e) => handleFieldChange('show_subscribe_form', e.target.checked ? 'on' : 'off')}
                                                        color="primary"
                                                    />
                                                </Box>
                                            </FormFieldRow>
                                        </>
                                    )}
                                </Stack>
                            </Box>
                        </Paper>

                        {/* 5. CUSTOM SCRIPTS */}
                        <Paper elevation={0} sx={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <SectionHeader>{t('Custom Header & Footer Scripts', 'Custom Header & Footer Scripts')}</SectionHeader>
                            <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                                <Stack spacing={2.5}>
                                    <FormFieldRow label={t('Header Script (<head>)', 'Header Script (<head>)')} alignItems="start">
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            placeholder="<script>...</script> or <link ...>"
                                            value={form.header_script || ''}
                                            onChange={(e) => handleFieldChange('header_script', e.target.value)}
                                            sx={textareaSx}
                                        />
                                    </FormFieldRow>

                                    <FormFieldRow label={t('Footer Script (Before </body>)', 'Footer Script (Before </body>)')} alignItems="start">
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            placeholder="<script>...</script>"
                                            value={form.footer_script || ''}
                                            onChange={(e) => handleFieldChange('footer_script', e.target.value)}
                                            sx={textareaSx}
                                        />
                                    </FormFieldRow>
                                </Stack>
                            </Box>
                        </Paper>

                        {/* SAVE BUTTON */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                            <Button
                                type="submit"
                                variant="contained"
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
                                    color: '#ffffff',
                                    backgroundColor: 'var(--primary-color, #2563eb)',
                                    '&:hover': {
                                        backgroundColor: 'var(--primary-hover-color, #1d4ed8)',
                                    },
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

export default AppearanceSettings;