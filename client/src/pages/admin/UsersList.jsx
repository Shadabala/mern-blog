import { useState, useEffect } from "react";
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Chip, Button, TextField, Select, MenuItem, FormControl, InputLabel, Dialog,
    DialogTitle, DialogContent, DialogActions, CircularProgress, Alert
} from "@mui/material";
import { Block as BlockIcon, CheckCircle as CheckCircleIcon, Delete as DeleteIcon, Edit as EditIcon, LoginOutlined as LoginAsIcon } from "@mui/icons-material";
import { fetchUsers, updateUserRole, toggleUserStatus, deleteUser, impersonateUserApi } from "../../api/admin.api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "../../utils/toast";
import { confirmDelete, confirmAction } from "../../utils/swal";

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState("user");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const { loginState, user: currentAdmin, hasPermission } = useAuth();
    const navigate = useNavigate();

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchUsers({ search, role: roleFilter });
            setUsers(data.users || []);
        } catch (err) {
            console.error("Failed to load users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, roleFilter]);

    const handleImpersonate = async (targetUser) => {
        const confirmed = await confirmAction({
            title: "Login as User?",
            text: `Are you sure you want to log in as ${targetUser.name || targetUser.username}?`,
            confirmButtonText: "Yes, log in",
            confirmButtonColor: "#4f46e5",
            icon: "question"
        });
        if (!confirmed) return;

        try {
            const res = await impersonateUserApi(targetUser._id || targetUser.id);
            if (res?.user && res?.accessToken) {
                // Save original admin token to return later
                if (currentAdmin) {
                    sessionStorage.setItem("impersonator_admin", JSON.stringify(currentAdmin));
                }
                loginState(res.user, res.accessToken);
                toast.success(`Logged in as ${targetUser.name || targetUser.username}`);
                navigate("/");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to log in as user";
            setAlertMessage(msg);
            toast.error(msg);
        }
    };

    const handleRoleUpdate = async () => {
        if (!selectedUser) return;
        try {
            await updateUserRole(selectedUser._id, newRole);
            const msg = `Role for ${selectedUser.username} updated to ${newRole}`;
            setAlertMessage(msg);
            toast.success(msg);
            setDialogOpen(false);
            loadUsers();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update user role";
            setAlertMessage(msg);
            toast.error(msg);
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await toggleUserStatus(user._id);
            const msg = `User ${user.username} status updated`;
            setAlertMessage(msg);
            toast.success(msg);
            loadUsers();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update user status";
            setAlertMessage(msg);
            toast.error(msg);
        }
    };

    const handleDeleteUser = async (user) => {
        const confirmed = await confirmDelete({
            itemName: user.username,
            title: `Delete user ${user.username}?`,
            text: "This will permanently remove the user and their account permissions."
        });

        if (confirmed) {
            try {
                await deleteUser(user._id);
                const msg = `User ${user.username} deleted successfully`;
                setAlertMessage(msg);
                toast.success(msg);
                loadUsers();
            } catch (err) {
                const msg = err.response?.data?.message || "Failed to delete user";
                setAlertMessage(msg);
                toast.error(msg);
            }
        }
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} mb={3} color="#0f172a">
                User & Staff Management
            </Typography>

            {alertMessage && (
                <Alert severity="info" sx={{ mb: 3 }} onClose={() => setAlertMessage("")}>
                    {alertMessage}
                </Alert>
            )}

            <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3, mb: 3 }}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
                    <TextField
                        size="small"
                        placeholder="Search by name, email or username..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 300 } }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Role Filter</InputLabel>
                        <Select
                            value={roleFilter}
                            label="Role Filter"
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <MenuItem value="">All Roles</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="staff">Staff</MenuItem>
                            <MenuItem value="user">User</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.length > 0 ? (
                                    users.map((u) => (
                                        <TableRow key={u._id}>
                                            <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                                            <TableCell>{u.username}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={(u.role || u.user_type || "user").toUpperCase()}
                                                    color={(u.role || u.user_type) === "admin" ? "error" : (u.role || u.user_type) === "staff" ? "warning" : "default"}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={u.status || "active"}
                                                    color={u.status === "blocked" ? "error" : "success"}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {hasPermission('users_impersonate') && (
                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        title="Log in as this User"
                                                        onClick={() => handleImpersonate(u)}
                                                        sx={{ color: '#0ea5e9', '&:hover': { bgcolor: '#e0f2fe' } }}
                                                    >
                                                        <LoginAsIcon fontSize="small" />
                                                    </IconButton>
                                                )}

                                                {hasPermission('users_edit') && (
                                                    <>
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            title="Change Role"
                                                            onClick={() => { setSelectedUser(u); setNewRole(u.role || u.user_type || "user"); setDialogOpen(true); }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>

                                                        <IconButton
                                                            size="small"
                                                            color={u.status === "blocked" ? "success" : "warning"}
                                                            title={u.status === "blocked" ? "Unblock Account" : "Block Account"}
                                                            onClick={() => handleToggleStatus(u)}
                                                        >
                                                            {u.status === "blocked" ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                                                        </IconButton>
                                                    </>
                                                )}

                                                {hasPermission('users_delete') && (
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        title="Delete User"
                                                        onClick={() => handleDeleteUser(u)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">No user accounts found matching your query.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Role Change Modal */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <DialogTitle>Change User Role</DialogTitle>
                <DialogContent sx={{ minWidth: 320, pt: 2 }}>
                    <Typography variant="body2" mb={2}>
                        Update user <strong>{selectedUser?.username}</strong> role permissions:
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Select Role</InputLabel>
                        <Select value={newRole} label="Select Role" onChange={(e) => setNewRole(e.target.value)}>
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="staff">Staff</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="outlined" className="btn-outline-primary" onClick={handleRoleUpdate}>Save Changes</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UsersList;
