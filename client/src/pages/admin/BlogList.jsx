import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Card, CardContent, Typography, Button, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Switch,
    CircularProgress, Alert, Pagination, Stack, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    DeleteOutline as DeleteIcon,
    ArticleOutlined as BlogIcon
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import {
    fetchAdminBlogs,
    deleteBlog,
    toggleBlogStatus
} from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';
import { confirmDelete } from '../../utils/swal';

const BlogList = () => {
    const { t, currentLang } = useLanguage();
    const navigate = useNavigate();

    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Alert toast
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });

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
            {/* Titlebar matching Laravel base-module backend/blog_system/blog/index.blade.php */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight={700} color="#1e293b">
                    {t("All Blogs")}
                </Typography>

                <Button
                    variant="contained"
                    color="info"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateModal}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '20px',
                        px: 2.5,
                        backgroundColor: '#0ea5e9',
                        '&:hover': { backgroundColor: '#0284c7' }
                    }}
                >
                    {t("Add New Blog")}
                </Button>
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
                                        <TableCell sx={{ fontWeight: 700 }}>{t("Status")}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>{t("Options")}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {blogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
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

                                                    {/* Status Toggle Switch */}
                                                    <TableCell>
                                                        <Switch
                                                            checked={Boolean(blog.status === true || blog.status === 1)}
                                                            onChange={() => handleToggleStatus(blog)}
                                                            color="success"
                                                            size="small"
                                                        />
                                                    </TableCell>

                                                    {/* Options */}
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                            <Tooltip title={t("Edit")}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenEditModal(blog)}
                                                                    sx={{ color: '#6366f1', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' } }}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title={t("Delete")}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDeleteBlog(blog)}
                                                                    sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
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
        </Box>
    );
};

export default BlogList;
