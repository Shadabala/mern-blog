import { useState } from "react";
import {
    Box, AppBar, Toolbar, Typography, Button, Container, Stack, Grid, IconButton, Avatar, Menu, MenuItem
} from "@mui/material";
import {
    HomeOutlined as HomeIcon,
    InfoOutlined as InfoIcon,
    ContactMailOutlined as ContactIcon,
    DashboardOutlined as AdminIcon,
    Logout as LogoutIcon,
    ArticleOutlined as BlogIcon,
    CategoryOutlined as CategoryIcon,
    PaymentOutlined as PaymentIcon
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../i18n/i18n";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import CategoryNav from "../components/header/CategoryNav";

const PublicLayout = ({ children }) => {
    const { isAuthenticated, user, role, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleLogout = async () => {
        handleMenuClose();
        await logout();
        navigate("/login");
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "#f8f9fa" }}>
            {/* Header Navbar - Blog Website Style */}
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    zIndex: 1100
                }}
            >
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: "space-between", py: 0.5 }}>
                        {/* Brand Logo */}
                        <Typography
                            variant="h5"
                            component={RouterLink}
                            to="/"
                            sx={{
                                fontWeight: 900,
                                textDecoration: "none",
                                background: "linear-gradient(90deg, #ff8a80, #f5a623)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                letterSpacing: "1px",
                                mr: 4,
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            Home
                        </Typography>

                        {/* Navigation Links */}
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexGrow: 1 }}>
                            <Button
                                component={RouterLink}
                                to="/"
                                startIcon={<HomeIcon sx={{ fontSize: 18 }} />}
                                sx={{
                                    color: location.pathname === "/" ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
                                    fontWeight: location.pathname === "/" ? 700 : 500,
                                    textTransform: "none",
                                    fontSize: "0.9rem",
                                    px: 1.5,
                                    borderRadius: 2,
                                    bgcolor: location.pathname === "/" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                                    "&:hover": { color: "#ffffff", bgcolor: "rgba(255, 255, 255, 0.12)" }
                                }}
                            >
                                {t("navbar.home", "Home")}
                            </Button>

                            <Button
                                component={RouterLink}
                                to="/about"
                                startIcon={<InfoIcon sx={{ fontSize: 18 }} />}
                                sx={{
                                    color: location.pathname === "/about" ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
                                    fontWeight: location.pathname === "/about" ? 700 : 500,
                                    textTransform: "none",
                                    fontSize: "0.9rem",
                                    px: 1.5,
                                    borderRadius: 2,
                                    bgcolor: location.pathname === "/about" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                                    "&:hover": { color: "#ffffff", bgcolor: "rgba(255, 255, 255, 0.12)" }
                                }}
                            >
                                {t("navbar.about", "About")}
                            </Button>

                            <Button
                                component={RouterLink}
                                to="/contact"
                                startIcon={<ContactIcon sx={{ fontSize: 18 }} />}
                                sx={{
                                    color: location.pathname === "/contact" ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
                                    fontWeight: location.pathname === "/contact" ? 700 : 500,
                                    textTransform: "none",
                                    fontSize: "0.9rem",
                                    px: 1.5,
                                    borderRadius: 2,
                                    bgcolor: location.pathname === "/contact" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                                    "&:hover": { color: "#ffffff", bgcolor: "rgba(255, 255, 255, 0.12)" }
                                }}
                            >
                                {t("navbar.contact", "Contact")}
                            </Button>

                            {isAuthenticated && (
                                <Button
                                    component={RouterLink}
                                    to={role === "admin" || role === "staff" ? "/admin/dashboard" : "/dashboard"}
                                    startIcon={role === "admin" || role === "staff" ? <AdminIcon sx={{ fontSize: 18 }} /> : <BlogIcon sx={{ fontSize: 18 }} />}
                                    sx={{
                                        color: role === "admin" || role === "staff" ? "#ff8a80" : "#6ee7b7",
                                        fontWeight: 700,
                                        textTransform: "none",
                                        fontSize: "0.9rem",
                                        px: 1.5,
                                        borderRadius: 2,
                                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.12)" }
                                    }}
                                >
                                    {role === "admin" || role === "staff" ? "Admin Panel" : "My Studio"}
                                </Button>
                            )}
                        </Stack>

                        {/* Right side authentication & language controls */}
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                            {isAuthenticated ? (
                                <>
                                    <IconButton onClick={handleMenuOpen} size="small">
                                        <Avatar
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                background: "linear-gradient(135deg, #ff8a80, #f5a623)",
                                                fontSize: "0.9rem",
                                                fontWeight: 800
                                            }}
                                        >
                                            {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || "U"}
                                        </Avatar>
                                    </IconButton>

                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleMenuClose}
                                        PaperProps={{
                                            sx: {
                                                mt: 1.5,
                                                minWidth: 200,
                                                bgcolor: "#16213e",
                                                color: "#ffffff",
                                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                                borderRadius: 2
                                            }
                                        }}
                                    >
                                        <Box sx={{ px: 2, py: 1, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                                            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
                                                Signed in as ({role || 'user'})
                                            </Typography>
                                            <Typography variant="subtitle2" fontWeight={700} noWrap>
                                                {user?.name || user?.username}
                                            </Typography>
                                        </Box>
                                        
                                        {/* User Studio Links */}
                                        <MenuItem component={RouterLink} to="/dashboard" onClick={handleMenuClose} sx={{ fontSize: "0.875rem", py: 1 }}>
                                            <BlogIcon fontSize="small" sx={{ mr: 1.5, color: "#6ee7b7" }} /> My Blogs
                                        </MenuItem>
                                        <MenuItem component={RouterLink} to="/dashboard?tab=categories" onClick={handleMenuClose} sx={{ fontSize: "0.875rem", py: 1 }}>
                                            <CategoryIcon fontSize="small" sx={{ mr: 1.5, color: "#93c5fd" }} /> Category Licenses
                                        </MenuItem>
                                        <MenuItem component={RouterLink} to="/dashboard?tab=payments" onClick={handleMenuClose} sx={{ fontSize: "0.875rem", py: 1 }}>
                                            <PaymentIcon fontSize="small" sx={{ mr: 1.5, color: "#fde047" }} /> Payment History
                                        </MenuItem>

                                        {(role === "admin" || role === "staff") && (
                                            <MenuItem component={RouterLink} to="/admin/dashboard" onClick={handleMenuClose} sx={{ fontSize: "0.875rem", py: 1, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                                                <AdminIcon fontSize="small" sx={{ mr: 1.5, color: "#ff8a80" }} /> Admin Panel
                                            </MenuItem>
                                        )}
                                        <MenuItem onClick={handleLogout} sx={{ fontSize: "0.875rem", py: 1, color: "#f87171", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                                            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} /> Logout
                                        </MenuItem>
                                    </Menu>
                                </>
                            ) : (
                                <Button
                                    component={RouterLink}
                                    to="/login"
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        color: "#ffffff",
                                        borderColor: "rgba(255, 255, 255, 0.4)",
                                        borderRadius: 20,
                                        px: 2.5,
                                        py: 0.5,
                                        textTransform: "none",
                                        fontWeight: 600,
                                        "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255, 255, 255, 0.1)" }
                                    }}
                                >
                                    {t("navbar.signIn", "Sign In")}
                                </Button>
                            )}

                            {/* Language Selector */}
                            <LanguageSwitcher variant="dark" />
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>
            <CategoryNav />

            <Box component="main" sx={{ flexGrow: 1 }}>
                {children}
            </Box>

            {/* Footer */}
            <Box component="footer" sx={{ py: 6, bgcolor: "#0b192c", color: "rgba(255, 255, 255, 0.7)", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} mb={4}>
                        <Grid item xs={12} md={4}>
                            <Typography
                                variant="h6"
                                fontWeight={900}
                                sx={{
                                    background: "linear-gradient(90deg, #ff8a80, #f5a623)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    mb: 1.5
                                }}
                            >
                                Welcome to My Blog
                            </Typography>
                            <Typography variant="body2" sx={{ maxWidth: 320, lineHeight: 1.6 }}>
                                A modern blog portal to share inspiring ideas, articles, and technical insights.
                            </Typography>
                        </Grid>

                        <Grid item xs={6} sm={4} md={2.5}>
                            <Typography variant="subtitle2" fontWeight={700} color="#ffffff" gutterBottom>
                                Navigation
                            </Typography>
                            <Stack spacing={1}>
                                <Typography variant="body2" component={RouterLink} to="/" sx={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", "&:hover": { color: "#ff8a80" } }}>Home</Typography>
                                <Typography variant="body2" component={RouterLink} to="/about" sx={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", "&:hover": { color: "#ff8a80" } }}>About Us</Typography>
                                <Typography variant="body2" component={RouterLink} to="/contact" sx={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", "&:hover": { color: "#ff8a80" } }}>Contact</Typography>
                            </Stack>
                        </Grid>

                        <Grid item xs={6} sm={4} md={2.5}>
                            <Typography variant="subtitle2" fontWeight={700} color="#ffffff" gutterBottom>
                                Support & Legal
                            </Typography>
                            <Stack spacing={1}>
                                <Typography variant="body2" sx={{ cursor: "pointer", "&:hover": { color: "#ff8a80" } }}>Privacy Policy</Typography>
                                <Typography variant="body2" sx={{ cursor: "pointer", "&:hover": { color: "#ff8a80" } }}>Terms of Service</Typography>
                                <Typography variant="body2" sx={{ cursor: "pointer", "&:hover": { color: "#ff8a80" } }}>FAQ</Typography>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={4} md={3}>
                            <Typography variant="subtitle2" fontWeight={700} color="#ffffff" gutterBottom>
                                Contact Info
                            </Typography>
                            <Typography variant="body2">my.shadabalam@gmail.com</Typography>
                            <Typography variant="body2">+91 9807770015</Typography>
                        </Grid>
                    </Grid>

                    <Typography variant="body2" align="center" pt={4} sx={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", fontSize: "0.85rem" }}>
                        © {new Date().getFullYear()} My Blog. All rights reserved.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default PublicLayout;
