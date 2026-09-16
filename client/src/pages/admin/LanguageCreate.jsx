import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Grid, Alert,
    CircularProgress, Breadcrumbs, Link as MuiLink, MenuItem,
    FormControl, Select, InputLabel, Autocomplete
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as BackIcon,
    Language as LanguageIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import { createLanguageApi, fetchAdminLanguages } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { AVAILABLE_FLAGS, getFlagUrl } from '../../utils/languageFlags';
import { toast } from '../../utils/toast';

/**
 * Common input styling matching base-module design standards
 */
const inputSx = {
    '& .MuiOutlinedInput-root': {
        minHeight: '48px',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        '& fieldset': {
            borderColor: '#d9dde5',
        },
        '&:hover fieldset': {
            borderColor: '#b5bcc7',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#3b82f6',
        }
    },
    '& .MuiInputBase-input': {
        fontSize: '15px',
        color: '#1e293b'
    }
};

const FormFieldRow = ({ label, children, helper, required }) => (
    <Grid container spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight={600} color="#334155">
                {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
            </Typography>
            {helper && (
                <Typography variant="caption" display="block" color="#64748b" sx={{ mt: 0.5 }}>
                    {helper}
                </Typography>
            )}
        </Grid>
        <Grid item xs={12} sm={9}>
            {children}
        </Grid>
    </Grid>
);

const LanguageCreate = () => {
    const { t, refreshLanguages } = useLanguage();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [appLangCode, setAppLangCode] = useState('');
    const [existingCodes, setExistingCodes] = useState([]);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    useEffect(() => {
        const loadExisting = async () => {
            try {
                const res = await fetchAdminLanguages();
                if (res?.success && Array.isArray(res.languages)) {
                    setExistingCodes(res.languages.map(l => l.code.toLowerCase()));
                }
            } catch (err) {
                console.error('Failed to load existing languages:', err);
            }
        };
        loadExisting();
    }, []);

    // Filter out already added flag codes
    const availableFlagOptions = AVAILABLE_FLAGS.filter(f => !existingCodes.includes(f));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            const msg = t('Language Name is required');
            setAlertMessage({ type: 'error', text: msg });
            toast.warning(msg);
            return;
        }

        if (!code.trim()) {
            const msg = t('Language Code is required');
            setAlertMessage({ type: 'error', text: msg });
            toast.warning(msg);
            return;
        }

        if (!appLangCode.trim()) {
            const msg = t('Flutter App Lang Code is required');
            setAlertMessage({ type: 'error', text: msg });
            toast.warning(msg);
            return;
        }

        try {
            setSaving(true);
            setAlertMessage({ type: 'info', text: '' });

            const payload = {
                name: name.trim(),
                code: code.toLowerCase().trim(),
                app_code: appLangCode.toLowerCase().trim()
            };

            await createLanguageApi(payload);
            refreshLanguages?.();

            const successMsg = t('Language has been inserted successfully');
            setAlertMessage({
                type: 'success',
                text: successMsg
            });
            toast.success(successMsg);

            setTimeout(() => {
                navigate('/admin/setup/language');
            }, 800);
        } catch (err) {
            console.error('Failed to create language:', err);
            const msg = err.response?.data?.message || t('Failed to create language');
            setAlertMessage({
                type: 'error',
                text: msg
            });
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', p: { xs: 2, md: 3 }, pb: 8 }}>
            <Box sx={{ maxWidth: '820px', mx: 'auto' }}>
                {/* Header & Breadcrumb */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                    <Box>
                        <Typography variant="h5" fontWeight={700} color="#1e293b">
                            {t("Language Information")}
                        </Typography>
                        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.85rem', mt: 0.5 }}>
                            <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/dashboard">
                                {t("Dashboard")}
                            </MuiLink>
                            <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/setup/language">
                                {t("Languages")}
                            </MuiLink>
                            <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>
                                {t("Create")}
                            </Typography>
                        </Breadcrumbs>
                    </Box>

                    <Button
                        variant="outlined"
                        startIcon={<BackIcon />}
                        onClick={() => navigate('/admin/setup/language')}
                        sx={{ textTransform: 'none', borderRadius: '8px', borderColor: '#cbd5e1', color: '#475569' }}
                    >
                        {t("Back to Languages")}
                    </Button>
                </Box>

                {alertMessage.text && (
                    <Alert
                        severity={alertMessage.type}
                        sx={{ mb: 3, borderRadius: '8px' }}
                        onClose={() => setAlertMessage({ type: 'info', text: '' })}
                    >
                        {alertMessage.text}
                    </Alert>
                )}

                {/* Main Card */}
                <Paper
                    elevation={0}
                    sx={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                >
                    <Box sx={{ p: 2.5, px: 3, borderBottom: '1px solid #f1f5f9' }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                            {t("Language Information")}
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2.5, sm: 4 } }}>
                        {/* Name */}
                        <FormFieldRow label={t("Name")} required>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder={t("Name")}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                sx={inputSx}
                                required
                            />
                        </FormFieldRow>

                        {/* Code Dropdown with Flag Preview */}
                        <FormFieldRow label={t("Code")} required>
                            <Autocomplete
                                options={availableFlagOptions}
                                value={code || null}
                                onChange={(event, newValue) => {
                                    setCode(newValue || '');
                                    if (newValue && !appLangCode) {
                                        setAppLangCode(newValue.toLowerCase());
                                    }
                                }}
                                getOptionLabel={(option) => option.toUpperCase()}
                                renderOption={(props, option) => (
                                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                                        <img
                                            src={getFlagUrl(option)}
                                            alt={option}
                                            style={{ width: 22, height: 15, borderRadius: 2, objectFit: 'cover' }}
                                        />
                                        <Typography variant="body2" fontWeight={600}>
                                            {option.toUpperCase()}
                                        </Typography>
                                    </Box>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder={t("Select language code")}
                                        size="small"
                                        sx={inputSx}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: code ? (
                                                <Box display="flex" alignItems="center" mr={1}>
                                                    <img
                                                        src={getFlagUrl(code)}
                                                        alt={code}
                                                        style={{ width: 22, height: 15, borderRadius: 2, objectFit: 'cover' }}
                                                    />
                                                </Box>
                                            ) : null
                                        }}
                                        required
                                    />
                                )}
                            />
                        </FormFieldRow>

                        {/* Flutter App Lang Code */}
                        <FormFieldRow
                            label={t("Flutter App Lang Code")}
                            required
                            helper={
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes"
                                    style={{ color: '#3b82f6', textDecoration: 'none' }}
                                >
                                    {t("Links for ISO 639-1 codes")}
                                </a>
                            }
                        >
                            <TextField
                                fullWidth
                                size="small"
                                placeholder={t("Put ISO 639-1 code for your language")}
                                value={appLangCode}
                                onChange={(e) => setAppLangCode(e.target.value)}
                                sx={inputSx}
                                required
                            />
                        </FormFieldRow>

                        {/* Save Button */}
                        <Box display="flex" justifyContent="flex-end" pt={2}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                                sx={{
                                    bgcolor: '#3b82f6',
                                    '&:hover': { bgcolor: '#2563eb' },
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    px: 4,
                                    py: 1.1
                                }}
                            >
                                {saving ? t("Saving...") : t("Save")}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default LanguageCreate;
