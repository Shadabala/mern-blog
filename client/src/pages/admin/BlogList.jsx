import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Card, CardContent, Typography, Button, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Switch,
    CircularProgress, Alert, Pagination, Stack, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, Chip, Avatar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    DeleteOutline as DeleteIcon,
    ArticleOutlined as BlogIcon,
    Star as PremiumIcon,
    Group as PeopleIcon,
    OpenInNew as LaunchIcon,
    ReceiptLong as ReceiptIcon,
    ContentCopy as CopyIcon
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import {
    fetchAdminBlogs,
    deleteBlog,
    toggleBlogStatus,
    fetchAdminPaymentsApi
} from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../utils/toast';
import { confirmDelete } from '../../utils/swal';

const BlogList = () => {
    const { t, currentLang } = useLanguage();
    const { hasPermission } = useAuth();
    const navigate = useNavigate();

    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Alert toast
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

    // Payment History Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedBlogForPayment, setSelectedBlogForPayment] = useState(null);
    const [blogPayments, setBlogPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);

    const handleOpenPaymentHistory = async (blog) => {
        setSelectedBlogForPayment(blog);
        setPaymentModalOpen(true);
        setLoadingPayments(true);
        try {
            const blogId = blog._id || blog.id;
            const res = await fetchAdminPaymentsApi({ postId: blogId });
            setBlogPayments(Array.isArray(res) ? res : []);
        } catch (err) {
            console.error('Failed to load blog payments:', err);
            toast.error(t('Failed to load payment records for this blog'));
        } finally {
            setLoadingPayments(false);
        }
    };

    const handleOpenCreateModal = () => {
        navigate('/admin/blogs/create');
    };

    const handleOpenEditModal = (blog) => {
        const id = blog._id || blog.id;
        navigate(`/admin/blogs/${id}/edit`);
    };

    const loadBlogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchAdminBlogs({
                search: search.trim() || undefined,
                lang: currentLang || 'en',
                page,
                limit: 15
            });
            if (res && (res.blogs || res.data || res.posts)) {
                setBlogs(res.blogs || res.data || res.posts || []);
                setTotalPages(res.last_page || 1);
            }
        } catch (err) {
            console.error('Failed to load blogs:', err);
            setAlertMessage({ type: 'error', text: t('Failed to load blogs') });
        } finally {
            setLoading(false);
        }
    }, [search, currentLang, page, t]);

    useEffect(() => {
        loadBlogs();
    }, [loadBlogs]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        loadBlogs();
    };

    const handleToggleStatus = async (blog) => {
        const id = blog._id || blog.id;
        try {
            const res = await toggleBlogStatus(id);
            const newStatus = res?.status !== undefined ? Boolean(res.status) : !blog.status;
            setBlogs(prev => prev.map(b => (b._id === id || b.id === id ? { ...b, status: newStatus } : b)));
            const msg = t("Blog status updated", "Blog status updated");
            setAlertMessage({ type: "success", text: msg });
            toast.success(msg);
        } catch (err) {
            console.error("Failed to toggle blog status:", err);
            const msg = t("Failed to update status", "Failed to update status");
            setAlertMessage({ type: "error", text: msg });
            toast.error(msg);
        }
    };

    const handleDeleteBlog = async (blog) => {
        if (!blog) return;
        const blogTitle = typeof blog.title === 'string' ? blog.title : (blog.title?.[currentLang] || blog.title?.en || '');
        const confirmed = await confirmDelete({
            title: t('Delete Blog?'),
            text: t('Are you sure you want to delete this blog? This action cannot be undone.'),
            itemName: blogTitle,
            confirmButtonText: t('Yes, delete it!'),
            cancelButtonText: t('Cancel')
        });

        if (!confirmed) return;
        const id = blog._id || blog.id;
        try {
            await deleteBlog(id);
            const msg = t('Blog has been deleted successfully', 'Blog has been deleted successfully');
            setAlertMessage({ type: 'success', text: msg });
            toast.success(msg);
            loadBlogs();
        } catch (err) {
            console.error('Failed to delete blog:', err);
            const msg = t('Failed to delete blog', 'Failed to delete blog');
            setAlertMessage({ type: 'error', text: msg });
            toast.error(msg);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight={700} color="#0f172a">
                        {t("All Blog Posts")}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {t("Manage and publish your blog articles")}
                    </Typography>
                </Box>

                {hasPermission('blogs_create') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreateModal}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: '20px',
                            px: 2.5,
                            backgroundColor: 'var(--primary-color, #0ea5e9)',
                            '&:hover': { backgroundColor: 'var(--primary-hover-color, #0284c7)' },
                            color: '#ffffff'
                        }}
                    >
                        {t("Add New Blog")}
                    </Button>
                )}
            </Box>

            {alertMessage.text && (
                <Alert severity={alertMessage.type} sx={{ mb: 2.5 }} onClose={() => setAlertMessage({ type: 'info', text: '' })}>
                    {alertMessage.text}
                </Alert>
            )}

            {/* Card Table */}
            <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Header Filter */}
                <Box
                    sx={{
                        p: 2.5,
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={700} color="#334155">
                        {t("All Blogs")}
                    </Typography>

                    <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                        <TextField
                            size="small"
                            placeholder={t("Type & Enter")}
                            value={search}
                            onChange={handleSearchChange}
                            sx={{ width: { xs: 180, sm: 240 } }}
                        />
                    </form>
                </Box>

                {/* Table Body */}
                <CardContent sx={{ p: 0 }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t("Title")}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t("Category")}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t("Short Description")}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t("Access / Paid Users")}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t("Status")}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>{t("Options")}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {blogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                                <Typography color="textSecondary">
                                                    {t("No blogs found")}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        blogs.map((blog, idx) => {
                                            const serialNum = (page - 1) * 15 + idx + 1;
                                            const categoryName = blog.category?.name || blog.category?.category_name || (typeof blog.category === 'string' ? blog.category : '--');

                                            return (
                                                <TableRow key={blog._id || blog.id} hover>
                                                    <TableCell sx={{ color: '#64748b' }}>{serialNum}</TableCell>

                                                    {/* Title with Thumbnail */}
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={1.5}>
                                                            {blog.banner ? (
                                                                <img
                                                                    src={blog.banner}
                                                                    alt={blog.title}
                                                                    style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                <Box sx={{ width: 44, height: 44, borderRadius: '6px', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <BlogIcon sx={{ color: '#94a3b8', fontSize: 24 }} />
                                                                </Box>
                                                            )}
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={600} color="#0f172a">
                                                                    {blog.title}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    /{blog.slug}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>

                                                    {/* Category */}
                                                    <TableCell>
                                                        <Typography variant="body2" color="#475569">
                                                            {categoryName}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Short Description */}
                                                    <TableCell sx={{ maxWidth: 280 }}>
                                                        <Typography variant="body2" color="textSecondary" noWrap title={blog.short_description}>
                                                            {blog.short_description || '--'}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Access & Paid Users */}
                                                    <TableCell>
                                                        <Stack spacing={0.5} alignItems="flex-start">
                                                            {blog.premium ? (
                                                                <Chip
                                                                    icon={<PremiumIcon sx={{ fontSize: '14px !important', color: '#f59e0b !important' }} />}
                                                                    label={t("Premium ($10)", "Premium ($10)")}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: '#fef3c7',
                                                                        color: '#b45309',
                                                                        fontWeight: 700,
                                                                        fontSize: '0.75rem',
                                                                        border: '1px solid #fde68a'
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Chip
                                                                    label={t("Standard / Free", "Standard / Free")}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: '#f1f5f9',
                                                                        color: '#64748b',
                                                                        fontWeight: 700,
                                                                        fontSize: '0.75rem',
                                                                        border: '1px solid #e2e8f0'
                                                                    }}
                                                                />
                                                            )}
                                                            <Tooltip title={t("Click to view paid users & transactions", "Click to view paid users & transactions")}>
                                                                <Chip
                                                                    icon={<PeopleIcon sx={{ fontSize: '13px !important' }} />}
                                                                    label={`${blog.paid_users_count || (blog.premium ? 1 : 0)} ${t("Paid", "Paid")}`}
                                                                    size="small"
                                                                    onClick={() => handleOpenPaymentHistory(blog)}
                                                                    sx={{
                                                                        bgcolor: (blog.paid_users_count > 0 || blog.premium) ? '#ecfdf5' : '#f8fafc',
                                                                        color: (blog.paid_users_count > 0 || blog.premium) ? '#059669' : '#94a3b8',
                                                                        fontWeight: 600,
                                                                        fontSize: '0.7rem',
                                                                        cursor: 'pointer',
                                                                        border: '1px solid transparent',
                                                                        '&:hover': {
                                                                            bgcolor: '#d1fae5',
                                                                            borderColor: '#10b981'
                                                                        }
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        </Stack>
                                                    </TableCell>

                                                    {/* Status Toggle Switch */}
                                                    <TableCell>
                                                        <Switch
                                                            checked={Boolean(blog.status === true || blog.status === 1)}
                                                            onChange={() => handleToggleStatus(blog)}
                                                            disabled={!hasPermission('blogs_edit')}
                                                            color="success"
                                                            size="small"
                                                        />
                                                    </TableCell>

                                                    {/* Options */}
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                            {/* 1. View on Website / Frontend */}
                                                            <Tooltip title={t("View on Frontend / Website", "View on Frontend / Website")}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => window.open(`/blog/${blog._id || blog.id}`, '_blank')}
                                                                    sx={{ color: '#0284c7', bgcolor: '#e0f2fe', '&:hover': { bgcolor: '#bae6fd' } }}
                                                                >
                                                                    <LaunchIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            {/* 2. View Payment History & Paid Users */}
                                                            <Tooltip title={t("Paid Users & Payment History", "Paid Users & Payment History")}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenPaymentHistory(blog)}
                                                                    sx={{ color: '#059669', bgcolor: '#ecfdf5', '&:hover': { bgcolor: '#d1fae5' } }}
                                                                >
                                                                    <ReceiptIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            {/* 3. Edit */}
                                                            {hasPermission('blogs_edit') && (
                                                                <Tooltip title={t("Edit")}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleOpenEditModal(blog)}
                                                                        sx={{ color: 'var(--primary-color, #6366f1)', bgcolor: 'rgba(59, 247, 62, 0.12)', '&:hover': { bgcolor: 'rgba(59, 247, 62, 0.2)' } }}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}

                                                            {/* 4. Delete */}
                                                            {hasPermission('blogs_delete') && (
                                                                <Tooltip title={t("Delete")}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleDeleteBlog(blog)}
                                                                        sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box display="flex" justifyContent="center" p={3}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(e, val) => setPage(val)}
                                color="primary"
                            />
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Modal: Blog Payment History & Paid Users */}
            <Dialog
                open={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <ReceiptIcon sx={{ color: '#059669', fontSize: 26 }} />
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="#0f172a">
                                {t('Paid Users & Payment History', 'Paid Users & Payment History')}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {selectedBlogForPayment?.title || ''}
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                            setPaymentModalOpen(false);
                            navigate(`/admin/payments?postId=${selectedBlogForPayment?._id || selectedBlogForPayment?.id}`);
                        }}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                    >
                        {t('View in All Payments', 'View in All Payments')}
                    </Button>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 2.5 }}>
                    {/* Header Summary */}
                    {selectedBlogForPayment && (
                        <Box sx={{ p: 2, mb: 2.5, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                                {selectedBlogForPayment.banner && (
                                    <img
                                        src={selectedBlogForPayment.banner}
                                        alt=""
                                        style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                                    />
                                )}
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b">
                                        {selectedBlogForPayment.title}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {t('Upgrade Fee:', 'Upgrade Fee:')} <strong>${selectedBlogForPayment.price || 10}</strong>
                                    </Typography>
                                </Box>
                            </Box>
                            <Box display="flex" gap={2}>
                                <Box textAlign="center" sx={{ px: 2, py: 1, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" color="textSecondary" display="block">{t('Total Paying Users', 'Total Paying Users')}</Typography>
                                    <Typography variant="h6" fontWeight={800} color="#059669">
                                        {blogPayments.filter(p => p.status === 'success').length}
                                    </Typography>
                                </Box>
                                <Box textAlign="center" sx={{ px: 2, py: 1, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" color="textSecondary" display="block">{t('Total Revenue', 'Total Revenue')}</Typography>
                                    <Typography variant="h6" fontWeight={800} color="#3b82f6">
                                        ${blogPayments.filter(p => p.status === 'success').reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {loadingPayments ? (
                        <Box display="flex" justifyContent="center" py={6}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : blogPayments.length === 0 ? (
                        <Box textAlign="center" py={6}>
                            <Typography color="textSecondary" fontWeight={600}>
                                {t('No payment transactions recorded for this blog yet.', 'No payment transactions recorded for this blog yet.')}
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('User', 'User')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('Amount', 'Amount')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('Gateway', 'Gateway')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('Reference ID', 'Reference ID')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('Date', 'Date')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('Status', 'Status')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {blogPayments.map(p => {
                                        const uName = p.userId?.name || p.username || 'User';
                                        const uEmail = p.userId?.email || p.customerEmail || '—';
                                        const ref = p.transactionId || p.razorpayPaymentId || p.stripeSessionId || p.paypalOrderId || '—';

                                        return (
                                            <TableRow key={p._id} hover>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Avatar src={p.userId?.avatar} sx={{ width: 28, height: 28, fontSize: 12 }}>
                                                            {uName.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={700}>{uName}</Typography>
                                                            <Typography variant="caption" color="textSecondary">{uEmail}</Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>${Number(p.amount).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Chip label={p.paymentMethod?.toUpperCase() || 'PAYMENT'} size="small" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{ref}</TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={p.status?.toUpperCase() || 'UNKNOWN'}
                                                        size="small"
                                                        color={p.status === 'success' ? 'success' : p.status === 'pending' ? 'warning' : 'error'}
                                                        sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22 }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setPaymentModalOpen(false)} sx={{ textTransform: 'none' }}>
                        {t('Close', 'Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BlogList;
