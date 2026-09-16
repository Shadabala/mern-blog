import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { isAuthenticated, isLoading, role } = useAuth();

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

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // If user is logged in as regular user trying to access admin, redirect to public home or user dashboard
        return <Navigate to={role === 'admin' || role === 'staff' ? '/admin/dashboard' : '/'} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
