import { useState, useEffect, useCallback } from "react";
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Alert, Switch, Stack, Chip,
    InputAdornment, Avatar, Tooltip, Breadcrumbs, Link as MuiLink
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    DeleteOutline as DeleteIcon,
    Search as SearchIcon,
    Folder as FolderIcon,
    Group as PeopleIcon,
    OpenInNew as LaunchIcon,
    ReceiptLong as ReceiptIcon,
    ContentCopy as CopyIcon
} from "@mui/icons-material";
import {
    fetchAdminCategories,
    deleteCategory,
    toggleCategoryStatus,
    fetchAdminPaymentsApi
} from "../../api/admin.api";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../utils/toast";
import { confirmDelete } from "../../utils/swal";

const CategoryList = () => {
    const { t, currentLang, isRtl } = useLanguage();
    const { hasPermission } = useAuth();
    const navigate = useNavigate();

    const canManage = hasPermission('categories_manage');

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [alertMessage, setAlertMessage] = useState({ type: "info", text: "" });

    // Payment History Modal State for Category
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedCatForPayment, setSelectedCatForPayment] = useState(null);
    const [categoryPayments, setCategoryPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);

    const handleOpenPaymentHistory = async (cat) => {
        setSelectedCatForPayment(cat);
        setPaymentModalOpen(true);
        setLoadingPayments(true);
        try {
            const catId = cat._id || cat.id;
            const res = await fetchAdminPaymentsApi({ categoryId: catId });
            setCategoryPayments(Array.isArray(res) ? res : []);
        } catch (err) {
            console.error('Failed to load category payments:', err);
            toast.error(t('Failed to load payment records for this category'));
        } finally {
            setLoadingPayments(false);
        }
    };

    // Open Create Page
    const handleOpenCreateModal = () => {
        navigate('/admin/categories/create');
    };

    // Open Edit Page
    const handleOpenEditModal = (cat) => {
        const catId = cat._id || cat.id;
        navigate(`/admin/categories/${catId}/edit`);
    };

    // Load categories with active language translation
    const loadCategories = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAdminCategories({ lang: currentLang, search });
            if (data?.success) {
                setCategories(data.categories || []);
            }
        } catch (err) {
            console.error("Failed to load categories:", err);
            setAlertMessage({ type: "error", text: t("Failed to load categories") });
        } finally {
            setLoading(false);
        }
    }, [currentLang, search, t]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // Toggle Category Status
    const handleToggleStatus = async (cat) => {
        try {
            const catId = cat._id || cat.id;
            await toggleCategoryStatus(catId);
            setCategories(prev => prev.map(c => (c._id === catId || c.id === catId ? { ...c, status: !c.status } : c)));
            const msg = t("Category status updated", "Category status updated");
            setAlertMessage({ type: "success", text: msg });
            toast.success(msg);
        } catch (err) {
            console.error("Failed to toggle status:", err);
            const msg = t("Failed to update status", "Failed to update status");
            setAlertMessage({ type: "error", text: msg });
            toast.error(msg);
        }
    };

    // Delete Category
    const handleDeleteCategory = async (cat) => {
        if (!cat) return;
        const catName = typeof cat.name === 'string' ? cat.name : (cat.name?.[currentLang] || cat.name?.en || '');
        const confirmed = await confirmDelete({
            title: t("Delete Category?"),
            text: t("Are you sure you want to delete this category and all its translations?"),
            itemName: catName,
            confirmButtonText: t("Yes, delete it!"),
            cancelButtonText: t("Cancel")
        });

        if (!confirmed) return;
        try {
            const catId = cat._id || cat.id;
            await deleteCategory(catId);
            const msg = t("Category has been deleted successfully", "Category has been deleted successfully");
            setAlertMessage({ type: "success", text: msg });
            toast.success(msg);
            loadCategories();
        } catch (err) {
            console.error("Failed to delete category:", err);
            const msg = t("Failed to delete category", "Failed to delete category");
            setAlertMessage({ type: "error", text: msg });
            toast.error(msg);
        }
    };

    return (
        <Box>
            {/* Header & Breadcrumb */}
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} color="#1e293b" gutterBottom>
                        {t("Categories")}
                    </Typography>
                    <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: "0.85rem" }}>
                        <MuiLink underline="hover" color="inherit" href="/admin/dashboard">
                            {t("Dashboard")}
                        </MuiLink>
                        <Typography color="text.primary" sx={{ fontSize: "0.85rem" }}>
                            {t("Categories")}
                        </Typography>
                    </Breadcrumbs>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center">
                    <TextField
                        size="small"
                        placeholder={t("Search key or value...")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                                </InputAdornment>
                            )
                        }}
                        sx={{ bgcolor: "#fff", borderRadius: 2, minWidth: 220 }}
                    />

                    {canManage && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenCreateModal}
                            sx={{
                                bgcolor: "var(--primary-color, #6366f1)",
                                "&:hover": { bgcolor: "var(--primary-hover-color, #4f46e5)" },
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                color: "#ffffff"
                            }}
                        >
                            {t("Add New Category")}
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* Notification alert */}
            {alertMessage.text && (
                <Alert
                    severity={alertMessage.type}
                    sx={{ mb: 3, borderRadius: 2 }}
                    onClose={() => setAlertMessage({ type: "info", text: "" })}
                >
                    {alertMessage.text}
                </Alert>
            )}

            {/* Category Table Card */}
            <Paper
                elevation={0}
                sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: "#ffffff"
                }}
            >
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress sx={{ color: "var(--primary-color, #6366f1)" }} />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: "#f8fafc" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#475569", width: 60 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>{t("Name")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>{t("Parent Category")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>{t("Order Level")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>{t("Icon")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>{t("License Price")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>{t("Paid Users / Usage")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>{t("Status")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#475569" }} align={isRtl ? "left" : "right"}>
                                        {t("Options")}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {categories.length > 0 ? (
                                    categories.map((cat, idx) => (
                                        <TableRow
                                            key={cat._id || cat.id}
                                            hover
                                            sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                                        >
                                            <TableCell sx={{ color: "#64748b", fontWeight: 600 }}>
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                    <Box
                                                        sx={{
                                                            width: 38,
                                                            height: 38,
                                                            borderRadius: 1.5,
                                                            bgcolor: "rgba(59, 247, 62, 0.12)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: "var(--primary-color, #6366f1)"
                                                        }}
                                                    >
                                                        <FolderIcon fontSize="small" />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={700} color="#1e293b">
                                                            {cat.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            /{cat.slug}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ color: "#64748b" }}>
                                                {cat.parent_id?.name || cat.parent_id || "—"}
                                            </TableCell>
                                            <TableCell sx={{ color: "#64748b", fontWeight: 600 }}>
                                                {cat.order_level || 0}
                                            </TableCell>
                                            <TableCell>
                                                {cat.icon ? (
                                                    <Avatar src={cat.icon} variant="rounded" sx={{ width: 32, height: 32 }} />
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">—</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>
                                                ${Number(cat.price || 10).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={t("Click to view paid users & transactions", "Click to view paid users & transactions")}>
                                                    <Chip
                                                        icon={<PeopleIcon sx={{ fontSize: '15px !important' }} />}
                                                        label={`${cat.paid_users_count || 0} ${t("Paid", "Paid")}`}
                                                        size="small"
                                                        onClick={() => handleOpenPaymentHistory(cat)}
                                                        sx={{
                                                            fontWeight: 700,
                                                            bgcolor: (cat.paid_users_count > 0) ? '#ecfdf5' : '#f1f5f9',
                                                            color: (cat.paid_users_count > 0) ? '#059669' : '#64748b',
                                                            border: (cat.paid_users_count > 0) ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                                                            cursor: 'pointer',
                                                            '&:hover': {
                                                                bgcolor: '#d1fae5',
                                                                borderColor: '#10b981'
                                                            }
                                                        }}
                                                    />
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    size="small"
                                                    checked={Boolean(cat.status)}
                                                    onChange={() => handleToggleStatus(cat)}
                                                    disabled={!canManage}
                                                    color="success"
                                                />
                                            </TableCell>
                                            <TableCell align={isRtl ? "left" : "right"}>
                                                <Stack direction="row" spacing={1} justifyContent={isRtl ? "flex-start" : "flex-end"}>
                                                    {/* 1. View Category on Frontend / Website */}
                                                    <Tooltip title={t("View on Frontend / Website", "View on Frontend / Website")}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => window.open(`/?category=${cat.slug || cat.name}`, '_blank')}
                                                            sx={{ bgcolor: "#e0f2fe", color: "#0284c7", "&:hover": { bgcolor: "#bae6fd" } }}
                                                        >
                                                            <LaunchIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {/* 2. View Paid Users & Payment History */}
                                                    <Tooltip title={t("Paid Users & Payment History", "Paid Users & Payment History")}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenPaymentHistory(cat)}
                                                            sx={{ bgcolor: "#ecfdf5", color: "#059669", "&:hover": { bgcolor: "#d1fae5" } }}
                                                        >
                                                            <ReceiptIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {canManage ? (
                                                        <>
                                                            <Tooltip title={t("Edit Category & Translations")}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenEditModal(cat)}
                                                                    sx={{
                                                                        bgcolor: "#e0e7ff",
                                                                        color: "#4f46e5",
                                                                        "&:hover": { bgcolor: "#c7d2fe" }
                                                                    }}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            <Tooltip title={t("Delete")}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDeleteCategory(cat)}
                                                                    sx={{
                                                                        bgcolor: "#fee2e2",
                                                                        color: "#ef4444",
                                                                        "&:hover": { bgcolor: "#fecaca" }
                                                                    }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {t("View Only")}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 6, color: "#94a3b8" }}>
                                            <Typography variant="body2">{t("No data available")}</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Modal: Category Payment History & Paid Users */}
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
                                {t('Paid Users & License History', 'Paid Users & License History')}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {selectedCatForPayment?.name || ''}
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                            setPaymentModalOpen(false);
                            navigate(`/admin/payments?categoryId=${selectedCatForPayment?._id || selectedCatForPayment?.id}`);
                        }}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                    >
                        {t('View in All Payments', 'View in All Payments')}
                    </Button>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 2.5 }}>
                    {/* Header Summary */}
                    {selectedCatForPayment && (
                        <Box sx={{ p: 2, mb: 2.5, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                                    <FolderIcon />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} color="#1e293b">
                                        {selectedCatForPayment.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {t('Category License Price:', 'Category License Price:')} <strong>${selectedCatForPayment.price || 10}</strong>
                                    </Typography>
                                </Box>
                            </Box>
                            <Box display="flex" gap={2}>
                                <Box textAlign="center" sx={{ px: 2, py: 1, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" color="textSecondary" display="block">{t('Total Unlocked Users', 'Total Unlocked Users')}</Typography>
                                    <Typography variant="h6" fontWeight={800} color="#059669">
                                        {Math.max(selectedCatForPayment.paid_users_count || 0, categoryPayments.filter(p => p.status === 'success').length)}
                                    </Typography>
                                </Box>
                                <Box textAlign="center" sx={{ px: 2, py: 1, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" color="textSecondary" display="block">{t('Total Revenue', 'Total Revenue')}</Typography>
                                    <Typography variant="h6" fontWeight={800} color="#3b82f6">
                                        ${categoryPayments.filter(p => p.status === 'success').reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {loadingPayments ? (
                        <Box display="flex" justifyContent="center" py={6}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : categoryPayments.length === 0 ? (
                        <Box textAlign="center" py={6}>
                            <Typography color="textSecondary" fontWeight={600}>
                                {t('No transaction records found for this category yet.', 'No transaction records found for this category yet.')}
                            </Typography>
                            {selectedCatForPayment?.paid_users_count > 0 && (
                                <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                                    {t('Note: Users unlocked this category via direct role/account assignment.', 'Note: Users unlocked this category via direct role/account assignment.')}
                                </Typography>
                            )}
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
                                    {categoryPayments.map(p => {
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

export default CategoryList;
