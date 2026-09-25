import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    RadioGroup,
    FormControlLabel,
    Radio,
    IconButton,
    Alert,
    CircularProgress,
    Switch,
} from '@mui/material';
import {
    Save as SaveIcon,
    Add as AddIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import LanguageTabBar from '../../components/common/LanguageTabBar';
import AizUploaderInput from '../../components/uploader/AizUploaderInput';
import { fetchHeaderSettingsApi, updateHeaderSettingsApi } from '../../api/admin.api';
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
    <Box sx={{ pt: 1, pb: 1, borderBottom: '1px solid #f1f5f9', mb: 1 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
            {children}
        </Typography>
    </Box>
);

const HeaderSettings = () => {
    const { t, currentLang } = useLanguage();
    const [selectedLang, setSelectedLang] = useState(currentLang || 'en');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    const initialFormState = {
        types: [
            'header_logo',
            'header_logo_circle',
            'topbar_banner',
            'topbar_banner_link',
            'helpline_number',
            'helpine_email',
            'helpine_whatsapp',
            'show_language_switcher',
            'enable_sticky_header',
            'header_nav_menu_text',
            'header_menu_labels',
            'header_menu_links',
            'top_bar_bg_color',
            'header_bg_color'
        ],
        header_logo: '',
        header_logo_circle: 'off',
        topbar_banner: '',
        topbar_banner_link: '',
        helpline_number: '',
        helpine_email: '',
        helpine_whatsapp: '',
        show_language_switcher: 'off',
        enable_sticky_header: 'off',
        header_nav_menu_text: 'light',
        header_menu_labels: [],
        header_menu_links: [],
        top_bar_bg_color: '#111827',
        header_bg_color: '#ffffff'
    };

    const [form, setForm] = useState(initialFormState);

    const loadSettings = useCallback(async (lang) => {
        try {
            setLoading(true);
            const res = await fetchHeaderSettingsApi(lang);
            if (res?.success && res.settings) {
                const s = res.settings;
                setForm({
                    types: initialFormState.types,
                    header_logo: s.header_logo || '',
                    header_logo_circle: (s.header_logo_circle === 'on' || s.header_logo_circle === '1' || s.header_logo_circle === true) ? 'on' : 'off',
                    topbar_banner: s.topbar_banner || '',
                    topbar_banner_link: s.topbar_banner_link || '',
                    helpline_number: s.helpline_number || '',
                    helpine_email: s.helpine_email || s.helpline_email || '',
                    helpine_whatsapp: s.helpine_whatsapp || s.helpline_whatsapp || '',
                    show_language_switcher: (s.show_language_switcher === 'on' || s.show_language_switcher === '1' || s.show_language_switcher === true) ? 'on' : 'off',
                    enable_sticky_header: (s.enable_sticky_header === 'on' || s.enable_sticky_header === '1' || s.enable_sticky_header === true) ? 'on' : 'off',
                    header_nav_menu_text: s.header_nav_menu_text || 'light',
                    header_menu_labels: Array.isArray(s.header_menu_labels) ? s.header_menu_labels : [],
                    header_menu_links: Array.isArray(s.header_menu_links) ? s.header_menu_links : [],
                    top_bar_bg_color: s.top_bar_bg_color || '#111827',
                    header_bg_color: s.header_bg_color || '#ffffff'

                });
            }
        } catch (err) {
            console.error('Failed to load header settings:', err);
            setAlertMessage({
                type: 'error',
                text: t('Failed to load header settings', 'Failed to load header settings'),
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

    const handleAddMenuItem = () => {
        setForm(prev => ({
            ...prev,
            header_menu_labels: [...prev.header_menu_labels, ''],
            header_menu_links: [...prev.header_menu_links, ''],
        }));
    };

    const handleRemoveMenuItem = (index) => {
        setForm(prev => ({
            ...prev,
            header_menu_labels: prev.header_menu_labels.filter((_, idx) => idx !== index),
            header_menu_links: prev.header_menu_links.filter((_, idx) => idx !== index),
        }));
    };

    const handleMenuLabelChange = (index, value) => {
        setForm(prev => {
            const updated = [...prev.header_menu_labels];
            updated[index] = value;
            return { ...prev, header_menu_labels: updated };
        });
    };

    const handleMenuLinkChange = (index, value) => {
        setForm(prev => {
            const updated = [...prev.header_menu_links];
            updated[index] = value;
            return { ...prev, header_menu_links: updated };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setAlertMessage({ type: 'info', text: '' });

        try {
            await updateHeaderSettingsApi({
                ...form,
                lang: selectedLang,
            });

            const successMsg = t('Header settings updated successfully', 'Header settings updated successfully');
            setAlertMessage({ type: 'success', text: successMsg });
            toast.success(successMsg);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('website_settings_updated'));
            }
        } catch (err) {
            console.error('Failed to update header settings:', err);
            const errorMsg = err?.response?.data?.message || t('Failed to update header settings', 'Failed to update header settings');
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

                <Paper elevation={0} sx={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <Box sx={{ minHeight: '64px', display: 'flex', alignItems: 'center', px: { xs: 2.5, sm: 3, md: 4 }, borderBottom: '1px solid #e2e8f0' }}>
                        <Typography sx={{ fontSize: { xs: '18px', sm: '20px' }, fontWeight: 600, color: '#0f172a' }}>
                            {t('Header Setting', 'Header Setting')}
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit} sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, sm: 3, md: 3.5 } }}>
                        <Stack spacing={{ xs: 2.5, sm: 3 }}>
                            {/* HEADER LOGO */}
                            <FormFieldRow label={t('Header Logo', 'Header Logo')} alignItems="start">
                                <AizUploaderInput
                                    value={form.header_logo}
                                    onChange={(url) => handleFieldChange('header_logo', url)}
                                    type="image"
                                    placeholder={t('Choose file', 'Choose file')}
                                />
                            </FormFieldRow>

                            {/* HEADER LOGO CIRCLE TOGGLE */}
                            <FormFieldRow
                                label={t('Header Logo Circle ?', 'Header Logo Circle ?')}
                                helperText={t('If enabled, the header logo will be displayed as a circle badge. If disabled, standard full-size image will be displayed.', 'If enabled, the header logo will be displayed as a circle badge. If disabled, standard full-size image will be displayed.')}
                            >
                                <Switch
                                    checked={form.header_logo_circle === 'on'}
                                    onChange={(e) => handleFieldChange('header_logo_circle', e.target.checked ? 'on' : 'off')}
                                    color="primary"
                                />
                            </FormFieldRow>

                            {/* TOPBAR BANNER */}
                            <FormFieldRow label={t('Topbar Banner', 'Topbar Banner')} alignItems="start">
                                <AizUploaderInput
                                    value={form.topbar_banner}
                                    onChange={(url) => handleFieldChange('topbar_banner', url)}
                                    type="image"
                                    placeholder={t('Choose file', 'Choose file')}
                                />
                            </FormFieldRow>

                            {/* TOPBAR BANNER LINK */}
                            <FormFieldRow label={t('Topbar banner link', 'Topbar banner link')}>
                                <TextField
                                    fullWidth
                                    placeholder="Link with http:// or https://"
                                    value={form.topbar_banner_link || ''}
                                    onChange={(e) => handleFieldChange('topbar_banner_link', e.target.value)}
                                    sx={inputSx}
                                />
                            </FormFieldRow>

                            {/* HELPLINE NUMBER */}
                            <FormFieldRow label={t('Helpline number', 'Helpline number')}>
                                <TextField
                                    fullWidth
                                    placeholder={t('Helpline number', 'Helpline number')}
                                    value={form.helpline_number || ''}
                                    onChange={(e) => handleFieldChange('helpline_number', e.target.value)}
                                    sx={inputSx}
                                />
                            </FormFieldRow>

                            {/* E-MAIL */}
                            <FormFieldRow label={t('E-Mail', 'E-Mail')}>
                                <TextField
                                    fullWidth
                                    placeholder={t('E-Mail', 'E-Mail')}
                                    value={form.helpine_email || ''}
                                    onChange={(e) => handleFieldChange('helpine_email', e.target.value)}
                                    sx={inputSx}
                                />
                            </FormFieldRow>

                            {/* WHATSAPP */}
                            <FormFieldRow label={t('WhatsApp', 'WhatsApp')}>
                                <TextField
                                    fullWidth
                                    placeholder={t('WhatsApp', 'WhatsApp')}
                                    value={form.helpine_whatsapp || ''}
                                    onChange={(e) => handleFieldChange('helpine_whatsapp', e.target.value)}
                                    sx={inputSx}
                                />
                            </FormFieldRow>

                            {/* SHOW LANGUAGE SWITCHER */}
                            <FormFieldRow label={t('Show language switcher ?', 'Show language switcher ?')}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Switch
                                        checked={Boolean(
                                            form.show_language_switcher === 'on' ||
                                            form.show_language_switcher === true ||
                                            form.show_language_switcher === '1' ||
                                            form.show_language_switcher === 1
                                        )}
                                        onChange={(e) => handleFieldChange('show_language_switcher', e.target.checked ? 'on' : 'off')}
                                        color="primary"
                                    />
                                </Box>
                            </FormFieldRow>

                            {/* ENABLE STICKY HEADER */}
                            <FormFieldRow label={t('Enable sticky header ?', 'Enable sticky header ?')}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Switch
                                        checked={Boolean(
                                            form.enable_sticky_header === 'on' ||
                                            form.enable_sticky_header === true ||
                                            form.enable_sticky_header === '1' ||
                                            form.enable_sticky_header === 1
                                        )}
                                        onChange={(e) => handleFieldChange('enable_sticky_header', e.target.checked ? 'on' : 'off')}
                                        color="primary"
                                    />
                                </Box>
                            </FormFieldRow>

                            {/* NAVIGATION SECTION */}
                            <SectionHeader>{t('Navigation', 'Navigation')}</SectionHeader>

                            <FormFieldRow label={t('Top Bar Background Color', 'Top Bar Background Color')}>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={form.top_bar_bg_color && /^#[0-9A-Fa-f]{6}$/.test(form.top_bar_bg_color) ? form.top_bar_bg_color : '#111827'}
                                        onChange={(e) => handleFieldChange('top_bar_bg_color', e.target.value)}
                                        style={{ width: '48px', height: '48px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '2px' }}
                                    />
                                    <TextField
                                        value={form.top_bar_bg_color || ''}
                                        placeholder="#111827"
                                        onChange={(e) => handleFieldChange('top_bar_bg_color', e.target.value)}
                                        sx={{ ...inputSx, width: '180px' }}
                                    />
                                </Box>
                            </FormFieldRow>

                            <FormFieldRow label={t('Header Background Color', 'Header Background Color')}>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={form.header_bg_color && /^#[0-9A-Fa-f]{6}$/.test(form.header_bg_color) ? form.header_bg_color : '#ffffff'}
                                        onChange={(e) => handleFieldChange('header_bg_color', e.target.value)}
                                        style={{ width: '48px', height: '48px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '2px' }}
                                    />
                                    <TextField
                                        value={form.header_bg_color || ''}
                                        placeholder="#ffffff"
                                        onChange={(e) => handleFieldChange('header_bg_color', e.target.value)}
                                        sx={{ ...inputSx, width: '180px' }}
                                    />
                                </Box>
                            </FormFieldRow>

                            {/* MENU TEXT COLOR */}
                            <FormFieldRow label={t('Header Nav Menu Text Color', 'Header Nav Menu Text Color')} alignItems="start">
                                <RadioGroup
                                    row
                                    name="header_nav_menu_text"
                                    value={form.header_nav_menu_text || 'light'}
                                    onChange={(e) => handleFieldChange('header_nav_menu_text', e.target.value)}
                                >
                                    <FormControlLabel value="light" control={<Radio />} label={t('Light', 'Light')} />
                                    <FormControlLabel value="dark" control={<Radio />} label={t('Dark', 'Dark')} />
                                </RadioGroup>
                            </FormFieldRow>

                            {/* HEADER MENU LIST */}
                            <Box sx={{ pt: 1 }}>
                                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#334155', mb: 1.5 }}>
                                    {t('Header Nav Menu', 'Header Nav Menu')}
                                </Typography>

                                <Stack spacing={1.5}>
                                    {form.header_menu_labels.map((label, index) => (
                                        <Paper
                                            key={index}
                                            elevation={0}
                                            sx={{
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                p: { xs: 1.5, sm: 2 },
                                                backgroundColor: '#f8fafc',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 44px' },
                                                    gap: 1.5,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <TextField
                                                    fullWidth
                                                    placeholder={t('Label', 'Label')}
                                                    value={label || ''}
                                                    onChange={(e) => handleMenuLabelChange(index, e.target.value)}
                                                    sx={inputSx}
                                                />
                                                <TextField
                                                    fullWidth
                                                    placeholder={t('Link with http:// or https://', 'Link with http:// or https://')}
                                                    value={form.header_menu_links[index] || ''}
                                                    onChange={(e) => handleMenuLinkChange(index, e.target.value)}
                                                    sx={inputSx}
                                                />
                                                <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-end', sm: 'center' } }}>
                                                    <IconButton
                                                        type="button"
                                                        onClick={() => handleRemoveMenuItem(index)}
                                                        sx={{
                                                            width: '40px',
                                                            height: '40px',
                                                            color: '#ef4444',
                                                            border: '1px solid #fecaca',
                                                            backgroundColor: '#fff5f5',
                                                            borderRadius: '6px',
                                                            '&:hover': {
                                                                backgroundColor: '#fee2e2',
                                                                borderColor: '#fca5a5',
                                                            },
                                                        }}
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    ))}

                                    {form.header_menu_labels.length === 0 && (
                                        <Box
                                            sx={{
                                                border: '1px dashed #cbd5e1',
                                                borderRadius: '8px',
                                                py: 3,
                                                px: 2,
                                                textAlign: 'center',
                                                backgroundColor: '#f8fafc',
                                            }}
                                        >
                                            <Typography sx={{ fontSize: '14px', color: '#64748b' }}>
                                                {t('No menu items added yet.', 'No menu items added yet.')}
                                            </Typography>
                                        </Box>
                                    )}

                                    <Box>
                                        <Button
                                            type="button"
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            onClick={handleAddMenuItem}
                                            sx={{
                                                height: '40px',
                                                px: 2,
                                                borderRadius: '6px',
                                                textTransform: 'none',
                                                fontSize: '14px',
                                                fontWeight: 500,
                                                color: '#334155',
                                                borderColor: '#cbd5e1',
                                                '&:hover': {
                                                    borderColor: '#94a3b8',
                                                    backgroundColor: '#f1f5f9',
                                                },
                                            }}
                                        >
                                            {t('Add New', 'Add New')}
                                        </Button>
                                    </Box>
                                </Stack>
                            </Box>

                            {/* ACTION BUTTONS */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid #e2e8f0' }}>
                                <Button
                                    type="submit"
                                    variant="outlined"
                                    className="btn-outline-primary"
                                    disabled={saving}
                                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon sx={{ fontSize: '18px' }} />}
                                    sx={{
                                        minWidth: '120px',
                                        height: '42px',
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
                </Paper>
            </Box>
        </Box>
    );
};

export default HeaderSettings;