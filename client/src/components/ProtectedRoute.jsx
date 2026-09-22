import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress, Alert, Typography, Button, Paper } from "@mui/material";
import { Security as SecurityIcon } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

const ProtectedRoute = ({
    allowedRoles = [],
    requiredPermission = null,
    requiredAnyPermission = []
}) => {
    const { isAuthenticated, isLoading, role, hasPermission, hasAnyPermission } = useAuth();

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Role check
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return <Navigate to={role === 'admin' || role === 'staff' ? '/admin/dashboard' : '/'} replace />;
    }

    // Permission checks for staff members
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 480, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <SecurityIcon sx={{ fontSize: 56, color: '#ef4444', mb: 2 }} />
                    <Typography variant="h6" fontWeight={700} color="#1e293b" gutterBottom>
                        Access Restricted
                    </Typography>
                    <Typography variant="body2" color="#64748b" sx={{ mb: 3 }}>
                        Your staff account does not possess permission (<strong>{requiredPermission}</strong>) to access this page or perform this action.
                    </Typography>
                    <Button variant="contained" component={RouterLink} to="/admin/dashboard" sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Back to Dashboard
                    </Button>
                </Paper>
            </Box>
        );
    }

    if (requiredAnyPermission.length > 0 && !hasAnyPermission(requiredAnyPermission)) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 480, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <SecurityIcon sx={{ fontSize: 56, color: '#ef4444', mb: 2 }} />
                    <Typography variant="h6" fontWeight={700} color="#1e293b" gutterBottom>
                        Access Restricted
                    </Typography>
                    <Typography variant="body2" color="#64748b" sx={{ mb: 3 }}>
                        Your staff account does not have sufficient permissions to view this section.
                    </Typography>
                    <Button variant="contained" component={RouterLink} to="/admin/dashboard" sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Back to Dashboard
                    </Button>
                </Paper>
            </Box>
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;
