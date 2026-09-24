import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Card, CardHeader, CardContent, Typography, Button, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
    CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
    Stack, Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    DeleteOutline as DeleteIcon,
    DescriptionOutlined as PageIcon,
    Launch as LaunchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { fetchPagesApi, deletePageApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';
import { confirmDelete } from '../../utils/swal';

const PagesList = () => {
    const { t, currentLang } = useLanguage();
    const navigate = useNavigate();

    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    const loadPages = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchPagesApi(currentLang || 'en');
            if (res?.success && res.pages) {
                setPages(res.pages);
            }
        } catch (err) {
            console.error('Failed to load pages:', err);
            const msg = t('Failed to load website pages');
            setAlertMessage({ type: 'error', text: msg });
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [currentLang, t]);

    useEffect(() => {
        loadPages();
    }, [loadPages]);

    const handleDeletePage = async (page) => {
        if (!page) return;
        const pageTitle = typeof page.title === 'string' ? page.title : (page.title?.[currentLang] || page.title?.en || '');
        const confirmed = await confirmDelete({
            title: t('Delete Page?'),
            text: t('Are you sure you want to delete this page? This action cannot be undone.'),
            itemName: pageTitle,
            confirmButtonText: t('Yes, delete it!'),
            cancelButtonText: t('Cancel')
        });

        if (!confirmed) return;
        try {
            await deletePageApi(page._id);
            const msg = t('Page has been deleted successfully');
            setAlertMessage({ type: 'success', text: msg });
            toast.success(msg);
            loadPages();
        } catch (err) {
            console.error('Failed to delete page:', err);
            const msg = t('Failed to delete page');
            setAlertMessage({ type: 'error', text: msg });
            toast.error(msg);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Titlebar */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <PageIcon sx={{ color: 'var(--primary-color, #6366f1)', fontSize: 32 }} />
                    <Typography variant="h5" fontWeight={700} color="#1e293b">
                        {t("Website Pages")}
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/admin/website-setup/pages/create')}
                    sx={{
                        bgcolor: 'var(--primary-color, #0ea5e9)',
                        '&:hover': { bgcolor: 'var(--primary-hover-color, #0284c7)' },
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2.5,
                        color: '#ffffff'
                    }}
                >
                    {t("Add New Page")}
                </Button>
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

            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <CardHeader
                    title={t("All Pages")}
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                    sx={{ borderBottom: '1px solid #f1f5f9', pb: 2 }}
                />
                <CardContent sx={{ p: 0 }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" py={8}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table sx={{ minWidth: 600 }}>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, width: 60 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t("Name")}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t("URL")}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>{t("Actions")}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pages.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                                                {t("No pages available")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pages.map((p, idx) => (
                                            <TableRow key={p._id || idx} hover>
                                                <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} color="#1e293b">
                                                        {p.title}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                                                    <Typography
                                                        component="a"
                                                        href={p.type === 'home_page' ? '/' : `/${p.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{
                                                            color: '#0284c7',
                                                            textDecoration: 'none',
                                                            fontWeight: 500,
                                                            '&:hover': { textDecoration: 'underline' }
                                                        }}
                                                    >
                                                        {p.type === 'home_page' ? `${window.location.origin}` : `${window.location.origin}/${p.slug}`}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        {/* 1. View on Frontend / Website */}
                                                        <Tooltip title={t("View on Frontend / Website", "View on Frontend / Website")}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => window.open(p.type === 'home_page' ? '/' : `/${p.slug}`, '_blank')}
                                                                sx={{ color: '#0284c7', bgcolor: '#e0f2fe', '&:hover': { bgcolor: '#bae6fd' } }}
                                                            >
                                                                <LaunchIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        {/* 2. Edit Page */}
                                                        <Tooltip title={t("Edit Page")}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    if (p.type === 'home_page') {
                                                                        navigate('/admin/website-setup/homepage');
                                                                    }
                                                                    else if (p.slug === 'contact') {
                                                                        navigate('/admin/website-setup/contact');
                                                                    }
                                                                    else if (p.slug === 'about') {
                                                                        navigate('/admin/website-setup/about');
                                                                    }
                                                                    else {
                                                                        navigate(`/admin/website-setup/pages/${p._id}/edit`);
                                                                    }
                                                                }}
                                                                sx={{ color: 'var(--primary-color, #6366f1)', bgcolor: 'rgba(59, 247, 62, 0.12)', '&:hover': { bgcolor: 'rgba(59, 247, 62, 0.2)' } }}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        {/* 3. Delete */}
                                                        {p.type === 'custom_page' && p.slug !== 'about' && p.slug !== 'contact' && (
                                                            <Tooltip title={t("Delete")}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDeletePage(p)}
                                                                    sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default PagesList;
