import React, { useState, useEffect, useCallback } from "react";
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Chip, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Alert, Stack, Tooltip, Checkbox, FormControlLabel, FormGroup,
    Card, CardContent, Divider, Grid
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    DeleteOutline as DeleteIcon,
    Security as SecurityIcon,
    CheckCircleOutline as CheckAllIcon
} from "@mui/icons-material";
import {
    fetchRolesApi,
    createRoleApi,
    updateRoleApi,
    deleteRoleApi,
    fetchAvailablePermissionsApi
} from "../../api/admin.api";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "../../utils/toast";
import { confirmDelete } from "../../utils/swal";

const DEFAULT_PERMISSION_GROUPS = [
    {
        name: 'Blog System',
        key: 'blog_system',
        permissions: [
            { id: 'blogs_view', name: 'Show All Blogs' },
            { id: 'blogs_create', name: 'Add New Blog' },
            { id: 'blogs_edit', name: 'Edit Blog' },
            { id: 'blogs_delete', name: 'Delete Blog' },
            { id: 'categories_manage', name: 'Manage Categories' }
        ]
    },
    {
        name: 'Uploaded Files',
        key: 'uploaded_files',
        permissions: [
            { id: 'uploads_view', name: 'View Uploaded Files' },
            { id: 'uploads_create', name: 'Upload New File' },
            { id: 'uploads_delete', name: 'Delete Uploaded Files' }
        ]
    },
    {
        name: 'Customer & User Management',
        key: 'users',
        permissions: [
            { id: 'users_view', name: 'View Users' },
            { id: 'users_edit', name: 'Edit User Roles & Status' },
            { id: 'users_impersonate', name: 'Login as User' },
            { id: 'users_delete', name: 'Delete Users' }
        ]
    },
    {
        name: 'Staff & Roles',
        key: 'staff',
        permissions: [
            { id: 'staff_view', name: 'View All Staff' },
            { id: 'staff_create', name: 'Add New Staff' },
            { id: 'staff_edit', name: 'Edit Staff' },
            { id: 'staff_delete', name: 'Delete Staff' },
            { id: 'roles_manage', name: 'Manage Staff Roles & Permissions' }
        ]
    },
    {
        name: 'Website Setup & Settings',
        key: 'settings',
        permissions: [
            { id: 'homepage_settings', name: 'Homepage Settings' },
            { id: 'header_settings', name: 'Header Settings' },
            { id: 'footer_settings', name: 'Footer Settings' },
            { id: 'pages_manage', name: 'Manage Custom Pages' },
            { id: 'appearance_manage', name: 'Appearance & Theme Settings' },
            { id: 'settings_view', name: 'View General Settings' },
            { id: 'settings_edit', name: 'Update General Settings' }
        ]
    },
    {
        name: 'Setup & Configurations',
        key: 'setup',
        permissions: [
            { id: 'feature_activation', name: 'Feature Activation' },
            { id: 'languages_manage', name: 'Language & Translation Management' },
            { id: 'file_system_manage', name: 'File System & S3 Configuration' },
            { id: 'smtp_manage', name: 'SMTP Email Configuration' },
            { id: 'payment_methods_manage', name: 'Payment Methods' },
            { id: 'google_manage', name: 'Google & Third-Party Configuration' },
            { id: 'cache_clear', name: 'Clear Cache' }
        ]
    },
    {
        name: 'Inquiries & Activity Logs',
        key: 'logs_inquiries',
        permissions: [
            { id: 'contacts_manage', name: 'Manage Contact Enquiries' },
            { id: 'login_history_view', name: 'View User Login History' },
            { id: 'logs_view', name: 'View Activity Logs' }
        ]
    }
];

const StaffRoles = () => {
    const { t } = useLanguage();

    const [roles, setRoles] = useState([]);
    const [permissionGroups, setPermissionGroups] = useState(DEFAULT_PERMISSION_GROUPS);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [saving, setSaving] = useState(false);

    // Toast alert
    const [alertMessage, setAlertMessage] = useState({ type: "info", text: "" });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.allSettled([
                fetchRolesApi(),
                fetchAvailablePermissionsApi()
            ]);

            if (rolesRes.status === "fulfilled" && rolesRes.value?.roles) {
                setRoles(rolesRes.value.roles);
            }
            if (permsRes.status === "fulfilled" && permsRes.value?.groups) {
                setPermissionGroups(permsRes.value.groups);
            }
        } catch (err) {
            console.error("Error loading roles data:", err);
            setAlertMessage({ type: "error", text: t("Failed to load roles") });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenCreate = () => {
        setEditingRole(null);
        setName("");
        setDescription("");
        setSelectedPermissions([]);
        setDialogOpen(true);
    };

    const handleOpenEdit = (role) => {
        setEditingRole(role);
        setName(role.name || "");
        setDescription(role.description || "");
        setSelectedPermissions(role.permissions || []);
        setDialogOpen(true);
    };

    const handleTogglePermission = (permId) => {
        setSelectedPermissions(prev =>
            prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
        );
    };

    const handleToggleGroup = (group) => {
        const groupPermIds = group.permissions.map(p => p.id);
        const allSelected = groupPermIds.every(id => selectedPermissions.includes(id));

        if (allSelected) {
            setSelectedPermissions(prev => prev.filter(id => !groupPermIds.includes(id)));
        } else {
            setSelectedPermissions(prev => Array.from(new Set([...prev, ...groupPermIds])));
        }
    };

    const handleSelectAll = () => {
        const allIds = permissionGroups.flatMap(g => g.permissions.map(p => p.id));
        const allSelected = allIds.every(id => selectedPermissions.includes(id));
        if (allSelected) {
            setSelectedPermissions([]);
        } else {
            setSelectedPermissions(allIds);
        }
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            const msg = t("Role Name is required");
            setAlertMessage({ type: "error", text: msg });
            toast.warning(msg);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                description: description.trim(),
                permissions: selectedPermissions
            };

            if (editingRole) {
                await updateRoleApi(editingRole._id || editingRole.id, payload);
                const msg = t("Role has been updated successfully");
                setAlertMessage({ type: "success", text: msg });
                toast.success(msg);
            } else {
                await createRoleApi(payload);
                const msg = t("Role has been created successfully");
                setAlertMessage({ type: "success", text: msg });
                toast.success(msg);
            }

            setDialogOpen(false);
            loadData();
        } catch (err) {
            console.error("Error saving role:", err);
            const msg = err.response?.data?.message || t("Failed to save role");
            setAlertMessage({
                type: "error",
                text: msg
            });
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRole = async (role) => {
        if (!role) return;
        const confirmed = await confirmDelete({
            title: t("Delete Role?"),
            text: t("Are you sure you want to delete this role and its associated permissions? This cannot be undone."),
            itemName: role.name,
            confirmButtonText: t("Yes, delete it!"),
            cancelButtonText: t("Cancel")
        });

        if (!confirmed) return;
        const id = role._id || role.id;
        try {
            await deleteRoleApi(id);
            const msg = t("Role has been deleted successfully");
            setAlertMessage({ type: "success", text: msg });
            toast.success(msg);
            loadData();
        } catch (err) {
            console.error("Error deleting role:", err);
            const msg = err.response?.data?.message || t("Failed to delete role");
            setAlertMessage({
                type: "error",
                text: msg
            });
            toast.error(msg);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header matching Laravel base-module backend/staff/staff_roles/index.blade.php */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight={700} color="#1e293b">
                    {t("Staff Roles & Permissions")}
                </Typography>

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
                    {t("Add New Role")}
                </Button>
            </Box>

            {alertMessage.text && (
                <Alert severity={alertMessage.type} sx={{ mb: 2.5 }} onClose={() => setAlertMessage({ type: "info", text: "" })}>
                    {alertMessage.text}
                </Alert>
            )}

            {/* Table Paper */}
            <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                <Box sx={{ p: 2.5, borderBottom: "1px solid #f1f5f9" }}>
                    <Typography variant="subtitle1" fontWeight={700} color="#334155">
                        {t("All Roles")}
                    </Typography>
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
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Role Name")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Permissions Count")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Staff Members")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Description")}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{t("Options")}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {roles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <Typography color="textSecondary">{t("No roles found")}</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    roles.map((role, idx) => (
                                        <TableRow key={role._id || role.id} hover>
                                            <TableCell sx={{ color: "#64748b" }}>{idx + 1}</TableCell>

                                            {/* Name */}
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <SecurityIcon sx={{ color: '#0ea5e9', fontSize: 20 }} />
                                                    </Box>
                                                    <Typography variant="body2" fontWeight={700} color="#0f172a">
                                                        {role.name}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            {/* Permissions Count */}
                                            <TableCell>
                                                <Chip
                                                    label={`${(role.permissions || []).length} permissions`}
                                                    size="small"
                                                    sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}
                                                />
                                            </TableCell>

                                            {/* Staff Members Count */}
                                            <TableCell>
                                                <Typography variant="body2" color="#475569" fontWeight={600}>
                                                    {role.staff_count !== undefined ? role.staff_count : '--'}
                                                </Typography>
                                            </TableCell>

                                            {/* Description */}
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary">
                                                    {role.description || '--'}
                                                </Typography>
                                            </TableCell>

                                            {/* Options */}
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Tooltip title={t("Edit")}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenEdit(role)}
                                                            sx={{ color: '#6366f1', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' } }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={t("Delete")}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteRole(role)}
                                                            sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
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

            {/* Create / Edit Role Modal with Grouped Permission Checkboxes matching Laravel base-module */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{editingRole ? t("Edit Role Information") : t("Role Information")}</span>
                    <Button
                        size="small"
                        startIcon={<CheckAllIcon />}
                        onClick={handleSelectAll}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {t("Select / Deselect All")}
                    </Button>
                </DialogTitle>
                <Box component="form" onSubmit={handleSaveRole}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1, maxHeight: '70vh', overflowY: 'auto' }}>
                        <TextField
                            fullWidth
                            size="small"
                            label={t("Role Name") + " *"}
                            placeholder={t("e.g. Content Editor, Support Manager")}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label={t("Description")}
                            placeholder={t("Brief description of this role")}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="subtitle2" fontWeight={700} color="#334155">
                            {t("Role Permissions")} ({selectedPermissions.length} selected)
                        </Typography>

                        {/* Permission Groups Grid */}
                        <Grid container spacing={2}>
                            {permissionGroups.map((group) => {
                                const groupPermIds = group.permissions.map(p => p.id);
                                const isGroupAllSelected = groupPermIds.every(id => selectedPermissions.includes(id));
                                const isGroupSomeSelected = groupPermIds.some(id => selectedPermissions.includes(id)) && !isGroupAllSelected;

                                return (
                                    <Grid item xs={12} md={6} key={group.key || group.name}>
                                        <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', borderColor: '#e2e8f0' }}>
                                            <Box sx={{ p: 1.5, px: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={isGroupAllSelected}
                                                            indeterminate={isGroupSomeSelected}
                                                            onChange={() => handleToggleGroup(group)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={<Typography variant="subtitle2" fontWeight={700} color="#1e293b">{group.name}</Typography>}
                                                    sx={{ m: 0 }}
                                                />
                                            </Box>
                                            <CardContent sx={{ p: 2, pt: 1.5 }}>
                                                <FormGroup>
                                                    {group.permissions.map((perm) => (
                                                        <FormControlLabel
                                                            key={perm.id}
                                                            control={
                                                                <Checkbox
                                                                    checked={selectedPermissions.includes(perm.id)}
                                                                    onChange={() => handleTogglePermission(perm.id)}
                                                                    size="small"
                                                                />
                                                            }
                                                            label={<Typography variant="body2" color="#475569">{perm.name}</Typography>}
                                                            sx={{ my: 0.2 }}
                                                        />
                                                    ))}
                                                </FormGroup>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
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

export default StaffRoles;
