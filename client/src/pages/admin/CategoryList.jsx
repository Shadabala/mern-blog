import { useState, useEffect, useCallback } from "react";
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Alert, Switch, Stack,
    InputAdornment, Avatar, Tooltip, Breadcrumbs, Link as MuiLink
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    DeleteOutline as DeleteIcon,
    Search as SearchIcon,
    Folder as FolderIcon
} from "@mui/icons-material";
import {
    fetchAdminCategories,
    deleteCategory,
    toggleCategoryStatus
} from "../../api/admin.api";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "../../utils/toast";
import { confirmDelete } from "../../utils/swal";

const CategoryList = () => {
    const { t, currentLang, isRtl } = useLanguage();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [alertMessage, setAlertMessage] = useState({ type: "info", text: "" });

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

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreateModal}
                        sx={{
                            bgcolor: "#6366f1",
                            "&:hover": { bgcolor: "#4f46e5" },
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)"
                        }}
                    >
                        {t("Add New Category")}
                    </Button>
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
                        <CircularProgress sx={{ color: "#6366f1" }} />
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
                                                            bgcolor: "#f1f5f9",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: "#6366f1"
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
                                            <TableCell>
                                                <Switch
                                                    size="small"
                                                    checked={Boolean(cat.status)}
                                                    onChange={() => handleToggleStatus(cat)}
                                                    color="success"
                                                />
                                            </TableCell>
                                            <TableCell align={isRtl ? "left" : "right"}>
                                                <Stack direction="row" spacing={1} justifyContent={isRtl ? "flex-start" : "flex-end"}>
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
        </Box>
    );
};

export default CategoryList;
