import { useState, useEffect, useCallback } from "react";
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Chip, Button, TextField, Select, MenuItem, FormControl, InputLabel, Dialog,
    DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, Switch, Stack, Tooltip
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    DeleteOutline as DeleteIcon,
    BadgeOutlined as StaffIcon,
    Phone as PhoneIcon,
    Email as EmailIcon
} from "@mui/icons-material";
import {
    fetchStaffsApi,
    createStaffApi,
    updateStaffApi,
    toggleStaffStatusApi,
    deleteStaffApi,
    fetchRolesApi
} from "../../api/admin.api";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../utils/toast";
import { confirmDelete } from "../../utils/swal";

const StaffList = () => {
    const { t } = useLanguage();
    const { hasPermission } = useAuth();

    const [staffList, setStaffList] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal state for Add/Edit Staff
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role_id: "",
        status: "active"
    });
    const [saving, setSaving] = useState(false);

    // Toast alert
    const [alertMessage, setAlertMessage] = useState({ type: "info", text: "" });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [staffRes, rolesRes] = await Promise.allSettled([
                fetchStaffsApi(),
                fetchRolesApi()
            ]);

            if (staffRes.status === "fulfilled" && staffRes.value?.staff) {
                setStaffList(staffRes.value.staff);
            }
            if (rolesRes.status === "fulfilled" && rolesRes.value?.roles) {
                setRoles(rolesRes.value.roles);
            }
        } catch (err) {
            console.error("Error loading staff data:", err);
            setAlertMessage({ type: "error", text: t("Failed to load staff list") });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenCreate = () => {
        setEditingStaff(null);
        setFormData({
            name: "",
            email: "",
            password: "",
            phone: "",
            role_id: roles.length > 0 ? (roles[0]._id || roles[0].id) : "",
            status: "active"
        });
        setDialogOpen(true);
    };

    const handleOpenEdit = (staff) => {
        setEditingStaff(staff);
        setFormData({
            name: staff.name || "",
            email: staff.email || "",
            password: "",
            phone: staff.phone || "",
            role_id: staff.role_id?._id || staff.role_id || "",
            status: staff.status || "active"
        });
        setDialogOpen(true);
    };

    const handleSaveStaff = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim() || !formData.role_id) {
            const msg = t("Please fill in all required fields (Name, Email, Role)");
            setAlertMessage({ type: "error", text: msg });
            toast.warning(msg);
            return;
        }

        if (!editingStaff && (!formData.password || formData.password.length < 6)) {
            const msg = t("Password must be at least 6 characters");
            setAlertMessage({ type: "error", text: msg });
            toast.warning(msg);
            return;
        }

        setSaving(true);
        try {
            if (editingStaff) {
                await updateStaffApi(editingStaff._id || editingStaff.id, formData);
                const msg = t("Staff member updated successfully");
                setAlertMessage({ type: "success", text: msg });
                toast.success(msg);
            } else {
                await createStaffApi(formData);
                const msg = t("Staff member created successfully");
                setAlertMessage({ type: "success", text: msg });
                toast.success(msg);
            }
            setDialogOpen(false);
            loadData();
        } catch (err) {
            console.error("Error saving staff:", err);
            const msg = err.response?.data?.message || t("Failed to save staff member");
            setAlertMessage({
                type: "error",
                text: msg
            });
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (staff) => {
        const id = staff._id || staff.id;
        try {
            await toggleStaffStatusApi(id);
            setStaffList(prev => prev.map(s => (s._id === id || s.id === id) ? {
                ...s,
                status: s.status === "active" ? "blocked" : "active"
            } : s));
            const msg = t("Staff status updated successfully");
            setAlertMessage({ type: "success", text: msg });
            toast.success(msg);
        } catch (err) {
            console.error("Error toggling staff status:", err);
            const msg = t("Failed to update status");
            setAlertMessage({ type: "error", text: msg });
            toast.error(msg);
        }
    };

    const handleDeleteStaff = async (staff) => {
        if (!staff) return;
        const confirmed = await confirmDelete({
            title: t("Delete Staff Member?"),
            text: t("Are you sure you want to remove this staff member? This cannot be undone."),
            itemName: staff.name || staff.email,
            confirmButtonText: t("Yes, delete it!"),
            cancelButtonText: t("Cancel")
        });

        if (!confirmed) return;
        const id = staff._id || staff.id;
        try {
            await deleteStaffApi(id);
            const msg = t("Staff member deleted successfully");
            setAlertMessage({ type: "success", text: msg });
            toast.success(msg);
            loadData();
        } catch (err) {
            console.error("Error deleting staff:", err);
            const msg = t("Failed to delete staff member");
            setAlertMessage({ type: "error", text: msg });
            toast.error(msg);
        }
    };

    const filteredStaff = staffList.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone?.toLowerCase().includes(search.toLowerCase()) ||
        s.role_id?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight={700} color="#1e293b">
                    {t("All Staffs")}
                </Typography>

                {hasPermission('staff_create') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreate}
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
                        {t("Add New Staff")}
                    </Button>
                )}
            </Box>

            {alertMessage.text && (
                <Alert severity={alertMessage.type} sx={{ mb: 2.5 }} onClose={() => setAlertMessage({ type: "info", text: "" })}>
                    {alertMessage.text}
                </Alert>
            )}

            {/* Table Paper */}
            <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                {/* Search Bar */}
                <Box sx={{ p: 2.5, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="#334155">
                        {t("Staff Members")}
                    </Typography>

                    <TextField
                        size="small"
                        placeholder={t("Search by Name or Email...")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 260 } }}
                    />
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: "#f8fafc" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, width: 60 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Name")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Email")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Phone")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Role")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Status")}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{t("Options")}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredStaff.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                            <Typography color="textSecondary">{t("No staff members found")}</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStaff.map((staff, idx) => (
                                        <TableRow key={staff._id || staff.id} hover>
                                            <TableCell sx={{ color: "#64748b" }}>{idx + 1}</TableCell>

                                            {/* Name */}
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <StaffIcon sx={{ color: "#0ea5e9" }} />
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={600} color="#1e293b">
                                                            {staff.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            @{staff.username || "staff"}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            {/* Email */}
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={0.8} color="#475569">
                                                    <EmailIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                    <Typography variant="body2">{staff.email}</Typography>
                                                </Box>
                                            </TableCell>

                                            {/* Phone */}
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={0.8} color="#475569">
                                                    <PhoneIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                    <Typography variant="body2">{staff.phone || '--'}</Typography>
                                                </Box>
                                            </TableCell>

                                            {/* Role */}
                                            <TableCell>
                                                <Chip
                                                    label={staff.role_id?.name || "Staff"}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#f5f3ff',
                                                        color: '#7c3aed',
                                                        fontWeight: 700,
                                                        border: '1px solid #ddd6fe'
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Status Toggle Switch */}
                                            <TableCell>
                                                <Switch
                                                    checked={staff.status === "active"}
                                                    onChange={() => handleToggleStatus(staff)}
                                                    disabled={!hasPermission('staff_edit')}
                                                    color="success"
                                                    size="small"
                                                />
                                            </TableCell>

                                            {/* Options */}
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    {hasPermission('staff_edit') && (
                                                        <Tooltip title={t("Edit")}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenEdit(staff)}
                                                                sx={{ color: '#6366f1', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' } }}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {hasPermission('staff_delete') && (
                                                        <Tooltip title={t("Delete")}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteStaff(staff)}
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
            </Paper>

            {/* Create / Edit Staff Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {editingStaff ? t("Edit Staff Information") : t("Staff Information")}
                </DialogTitle>
                <Box component="form" onSubmit={handleSaveStaff}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label={t("Name") + " *"}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />

                        <TextField
                            fullWidth
                            size="small"
                            type="email"
                            label={t("Email") + " *"}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label={t("Phone")}
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="e.g. +1 234 567 890"
                        />

                        <FormControl fullWidth size="small" required>
                            <InputLabel>{t("Role")} *</InputLabel>
                            <Select
                                value={formData.role_id}
                                label={t("Role") + " *"}
                                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                            >
                                {roles.map((role) => (
                                    <MenuItem key={role._id || role.id} value={role._id || role.id}>
                                        {role.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            size="small"
                            type="password"
                            label={editingStaff ? t("Password (Leave blank to keep unchanged)") : t("Password") + " *"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!editingStaff}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
                        <Button onClick={() => setDialogOpen(false)} color="inherit">
                            {t("Cancel")}
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={saving}
                            sx={{ px: 3, fontWeight: 600 }}
                        >
                            {saving ? <CircularProgress size={20} color="inherit" /> : t("Save")}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </Box>
    );
};

export default StaffList;
