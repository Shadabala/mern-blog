import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Grid, IconButton,
    Alert, CircularProgress, Stack, FormControl, InputLabel, Select, MenuItem,
    OutlinedInput, Chip
} from '@mui/material';
import {
    Add as AddIcon,
    InfoOutlined as InfoIcon,
    Save as SaveIcon,
    DeleteOutline as DeleteIcon
} from '@mui/icons-material';

import LanguageTabBar from '../../components/common/LanguageTabBar';
import AizUploaderInput from '../../components/uploader/AizUploaderInput';
import { fetchHomepageSettingsApi, updateHomepageSettingsApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const HomepageSettings = () => {
    const { t, currentLang } = useLanguage();

    const [selectedLang, setSelectedLang] = useState(currentLang || 'en');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);

    // Toast alert state
    const [alertState, setAlertState] = useState({ open: false, message: '', severity: 'success' });

    // Form settings state
    const [settings, setSettings] = useState({
        home_slider_images: [],
        home_slider_links: [],
        home_banner1_images: '',
        home_banner1_links: '',
        home_banner2_images: ['', ''],
        home_banner2_links: ['', ''],
        top10_categories: [],
        featured_categories: []
    });

    const loadSettings = useCallback(async (langCode) => {
        setLoading(true);
        try {
            const res = await fetchHomepageSettingsApi(langCode);
            if (res?.success) {
                const s = res.settings || {};
                setSettings({
                    home_slider_images: Array.isArray(s.home_slider_images) ? s.home_slider_images : (s.home_slider_images ? [s.home_slider_images] : []),
                    home_slider_links: Array.isArray(s.home_slider_links) ? s.home_slider_links : (s.home_slider_links ? [s.home_slider_links] : []),
                    home_banner1_images: s.home_banner1_images || '',
                    home_banner1_links: s.home_banner1_links || '',
                    home_banner2_images: Array.isArray(s.home_banner2_images) ? s.home_banner2_images : ['', ''],
                    home_banner2_links: Array.isArray(s.home_banner2_links) ? s.home_banner2_links : ['', ''],
                    top10_categories: Array.isArray(s.top10_categories) ? s.top10_categories : [],
                    featured_categories: Array.isArray(s.featured_categories) ? s.featured_categories : []
                });

                if (Array.isArray(res.categories)) {
                    setCategories(res.categories);
                }
            }
        } catch (err) {
            console.error('Failed to load homepage settings:', err);
            setAlertState({
                open: true,
                message: err.response?.data?.message || t('Failed to load homepage settings'),
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadSettings(selectedLang);
    }, [selectedLang, loadSettings]);

    const handleLanguageChange = (newLang) => {
        if (newLang && newLang !== selectedLang) {
            setSelectedLang(newLang);
        }
    };

    // --- Slider controls ---
    const handleAddSliderRow = () => {
        setSettings(prev => ({
            ...prev,
            home_slider_images: [...prev.home_slider_images, ''],
            home_slider_links: [...prev.home_slider_links, '']
        }));
    };

    const handleRemoveSliderRow = (idx) => {
        setSettings(prev => {
            const newImages = [...prev.home_slider_images];
            const newLinks = [...prev.home_slider_links];
            newImages.splice(idx, 1);
            newLinks.splice(idx, 1);
            return {
                ...prev,
                home_slider_images: newImages,
                home_slider_links: newLinks
            };
        });
    };

    const handleSliderLinkChange = (idx, value) => {
        setSettings(prev => {
            const newLinks = [...prev.home_slider_links];
            newLinks[idx] = value;
            return { ...prev, home_slider_links: newLinks };
        });
    };

    const handleSaveSettings = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...settings,
                lang: selectedLang
            };
            const res = await updateHomepageSettingsApi(payload);
            const successMsg = res?.message || t('Homepage settings has been updated successfully');
            setAlertState({
                open: true,
                message: successMsg,
                severity: 'success'
            });
            toast.success(successMsg);
        } catch (err) {
            console.error('Failed to save homepage settings:', err);
            const errorMsg = err.response?.data?.message || t('Failed to update homepage settings');
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
            {/* Header Title */}
            <Typography variant="h5" fontWeight={800} color="#1e293b" mb={3}>
                {t("Homepage Settings")}
            </Typography>

            {/* Language Tabs Card */}
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', mb: 3, overflow: 'hidden', bgcolor: '#ffffff' }}>
                <LanguageTabBar
                    activeLang={selectedLang}
                    selectedLang={selectedLang}
                    onLangChange={handleLanguageChange}
                    onSelectLang={handleLanguageChange}
                />
            </Paper>

            {/* In-page Feedback Banner */}
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
                    {/* SECTION 1: HOME SLIDER */}
                    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid #e2e8f0', borderRadius: '12px', mb: 4, bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                {t("Home Slider")}
                            </Typography>
                            <Button
                                type="submit"
                                variant="contained"
                                size="small"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon fontSize="small" />}
                                sx={{
                                    bgcolor: '#3b82f6',
                                    '&:hover': { bgcolor: '#2563eb' },
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '6px'
                                }}
                            >
                                {t("Update")}
                            </Button>
                        </Box>

                        {/* Minimum dimensions info banner */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1.5,
                                p: 2,
                                mb: 3,
                                bgcolor: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px dashed #cbd5e1'
                            }}
                        >
                            <InfoIcon sx={{ color: '#64748b', fontSize: 22, mt: '2px' }} />
                            <Box>
                                <Typography variant="body2" fontWeight={600} color="#080809ff" gutterBottom>
                                    {t("Minimum dimensions required: 1903px width X 553px height.")}
                                </Typography>
                                <Typography variant="caption" color="#0b0d0eff" display="block" lineHeight={1.5}>
                                    {t("We have limited banner height to maintain UI. We had to crop from both left & right side in view for different devices to make it responsive. Before designing banner keep these points in mind.")}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Slider Rows */}
                        <Stack spacing={3}>
                            {settings.home_slider_images.map((imgUrl, idx) => (
                                <Box
                                    key={idx}
                                    sx={{
                                        p: 2.5,
                                        border: '1px dashed #cbd5e1',
                                        borderRadius: '8px',
                                        bgcolor: '#ffffff'
                                    }}
                                >
                                    <Grid container spacing={2} alignItems="center">
                                        {/* Slider Image Upload */}
                                        <Grid item xs={12} sm={6}>
                                            <AizUploaderInput
                                                value={imgUrl}
                                                type="image"
                                                onChange={(val) => {
                                                    setSettings(prev => {
                                                        const arr = [...prev.home_slider_images];
                                                        arr[idx] = val;
                                                        return { ...prev, home_slider_images: arr };
                                                    });
                                                }}
                                                placeholder={t("Choose File")}
                                            />
                                        </Grid>

                                        {/* URL Link Input */}
                                        <Grid item xs={10} sm={5}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="http://"
                                                value={settings.home_slider_links[idx] || ''}
                                                onChange={(e) => handleSliderLinkChange(idx, e.target.value)}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '6px',
                                                        bgcolor: '#fff'
                                                    }
                                                }}
                                            />
                                        </Grid>

                                        {/* Delete Button */}
                                        <Grid item xs={2} sm={1} textAlign="right">
                                            <IconButton
                                                onClick={() => handleRemoveSliderRow(idx)}
                                                sx={{
                                                    bgcolor: '#fee2e2',
                                                    color: '#ef4444',
                                                    '&:hover': { bgcolor: '#fecaca' }
                                                }}
                                                size="small"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}
                        </Stack>

                        <Button
                            startIcon={<AddIcon />}
                            onClick={handleAddSliderRow}
                            variant="outlined"
                            sx={{
                                mt: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '6px',
                                color: '#3b82f6',
                                borderColor: '#bfdbfe',
                                '&:hover': { bgcolor: '#eff6ff', borderColor: '#3b82f6' }
                            }}
                        >
                            {t("Add New")}
                        </Button>
                    </Paper>

                    {/* SECTION 2: HOME BANNER 1 (FULL WIDTH) */}
                    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid #e2e8f0', borderRadius: '12px', mb: 4, bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                {t("Home Banner 1 (Large Banner)")}
                            </Typography>
                            <Button
                                type="submit"
                                variant="contained"
                                size="small"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon fontSize="small" />}
                                sx={{
                                    bgcolor: '#3b82f6',
                                    '&:hover': { bgcolor: '#2563eb' },
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '6px'
                                }}
                            >
                                {t("Update")}
                            </Button>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 1.5,
                                mb: 2.5,
                                bgcolor: '#f8fafc',
                                borderRadius: '6px',
                                border: '1px dashed #cbd5e1'
                            }}
                        >
                            <InfoIcon sx={{ color: '#64748b', fontSize: 18 }} />
                            <Typography variant="caption" color="#64748b">
                                {t("Minimum dimensions required: 1300px width X 650px height.")}
                            </Typography>
                        </Box>

                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6}>
                                <AizUploaderInput
                                    value={settings.home_banner1_images}
                                    type="image"
                                    onChange={(val) => setSettings(prev => ({ ...prev, home_banner1_images: val }))}
                                    placeholder={t("Choose File")}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="http://"
                                    value={settings.home_banner1_links || ''}
                                    onChange={(e) => setSettings(prev => ({ ...prev, home_banner1_links: e.target.value }))}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* SECTION 3: HOME BANNER 2 (2 HALF BANNERS) */}
                    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid #e2e8f0', borderRadius: '12px', mb: 4, bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                {t("Home Banner 2 (2 Half Banners)")}
                            </Typography>
                            <Button
                                type="submit"
                                variant="contained"
                                size="small"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon fontSize="small" />}
                                sx={{
                                    bgcolor: '#3b82f6',
                                    '&:hover': { bgcolor: '#2563eb' },
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '6px'
                                }}
                            >
                                {t("Update")}
                            </Button>
                        </Box>

                        <Grid container spacing={3}>
                            {/* Banner 2.1 */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" fontWeight={700} color="#475569" display="block" mb={1}>
                                    {t("Banner 1 (Left)")}
                                </Typography>
                                <AizUploaderInput
                                    value={settings.home_banner2_images[0]}
                                    type="image"
                                    onChange={(val) => {
                                        setSettings(prev => {
                                            const arr = [...prev.home_banner2_images];
                                            arr[0] = val;
                                            return { ...prev, home_banner2_images: arr };
                                        });
                                    }}
                                    placeholder={t("Choose File")}
                                />
                                <Box sx={{ mt: 1.5 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="http://"
                                        value={settings.home_banner2_links[0] || ''}
                                        onChange={(e) => {
                                            const arr = [...settings.home_banner2_links];
                                            arr[0] = e.target.value;
                                            setSettings(prev => ({ ...prev, home_banner2_links: arr }));
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                    />
                                </Box>
                            </Grid>

                            {/* Banner 2.2 */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" fontWeight={700} color="#475569" display="block" mb={1}>
                                    {t("Banner 2 (Right)")}
                                </Typography>
                                <AizUploaderInput
                                    value={settings.home_banner2_images[1]}
                                    type="image"
                                    onChange={(val) => {
                                        setSettings(prev => {
                                            const arr = [...prev.home_banner2_images];
                                            arr[1] = val;
                                            return { ...prev, home_banner2_images: arr };
                                        });
                                    }}
                                    placeholder={t("Choose File")}
                                />
                                <Box sx={{ mt: 1.5 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="http://"
                                        value={settings.home_banner2_links[1] || ''}
                                        onChange={(e) => {
                                            const arr = [...settings.home_banner2_links];
                                            arr[1] = e.target.value;
                                            setSettings(prev => ({ ...prev, home_banner2_links: arr }));
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* SECTION 4: TOP CATEGORIES SELECTOR */}
                    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid #e2e8f0', borderRadius: '12px', mb: 4, bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                {t("Top 10 Categories")}
                            </Typography>
                            <Button
                                type="submit"
                                variant="contained"
                                size="small"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon fontSize="small" />}
                                sx={{
                                    bgcolor: '#3b82f6',
                                    '&:hover': { bgcolor: '#2563eb' },
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '6px'
                                }}
                            >
                                {t("Update")}
                            </Button>
                        </Box>

                        <FormControl fullWidth size="small">
                            <InputLabel>{t("Select Categories")}</InputLabel>
                            <Select
                                multiple
                                value={settings.top10_categories || []}
                                onChange={(e) => setSettings(prev => ({ ...prev, top10_categories: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value }))}
                                input={<OutlinedInput label={t("Select Categories")} />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((val) => {
                                            const cat = categories.find(c => (c._id === val || c.id === val));
                                            return (
                                                <Chip
                                                    key={val}
                                                    label={cat ? cat.name : val}
                                                    size="small"
                                                    sx={{ borderRadius: '4px' }}
                                                />
                                            );
                                        })}
                                    </Box>
                                )}
                                sx={{ borderRadius: '6px' }}
                            >
                                {categories.map((cat) => (
                                    <MenuItem key={cat._id || cat.id} value={cat._id || cat.id}>
                                        {cat.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Paper>

                    {/* SECTION 5: FEATURED CATEGORIES SELECTOR */}
                    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid #e2e8f0', borderRadius: '12px', mb: 4, bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                                {t("Featured Categories")}
                            </Typography>
                            <Button
                                type="submit"
                                variant="contained"
                                size="small"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon fontSize="small" />}
                                sx={{
                                    bgcolor: '#3b82f6',
                                    '&:hover': { bgcolor: '#2563eb' },
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '6px'
                                }}
                            >
                                {t("Update")}
                            </Button>
                        </Box>

                        <FormControl fullWidth size="small">
                            <InputLabel>{t("Select Featured Categories")}</InputLabel>
                            <Select
                                multiple
                                value={settings.featured_categories || []}
                                onChange={(e) => setSettings(prev => ({ ...prev, featured_categories: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value }))}
                                input={<OutlinedInput label={t("Select Featured Categories")} />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((val) => {
                                            const cat = categories.find(c => (c._id === val || c.id === val));
                                            return (
                                                <Chip
                                                    key={val}
                                                    label={cat ? cat.name : val}
                                                    size="small"
                                                    sx={{ borderRadius: '4px' }}
                                                />
                                            );
                                        })}
                                    </Box>
                                )}
                                sx={{ borderRadius: '6px' }}
                            >
                                {categories.map((cat) => (
                                    <MenuItem key={cat._id || cat.id} value={cat._id || cat.id}>
                                        {cat.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Paper>

                    {/* Primary Bottom Save Action */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                            sx={{
                                bgcolor: '#3b82f6',
                                '&:hover': { bgcolor: '#2563eb' },
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 4,
                                py: 1.3,
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                            }}
                        >
                            {saving ? t("Saving...") : t("Update Settings")}
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default HomepageSettings;
