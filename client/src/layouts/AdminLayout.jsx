import { useState } from "react";
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Button, Menu, MenuItem, Stack, Collapse,
    CircularProgress
} from "@mui/material";
import { toast } from "react-toastify";
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    PersonOutlined as PersonIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Home as HomeIcon,
    MailOutlineOutlined as ContactIcon,
    HistoryToggleOff as LoginHistoryIcon,
    ArticleOutlined as PostIcon,
    CategoryOutlined as CategoryIcon,
    AssessmentOutlined as LogIcon,
    ExpandLess,
    ExpandMore,
    WebOutlined as WebSetupIcon,
    TuneOutlined as ConfigIcon,
    BadgeOutlined as StaffIcon,
    CloudUploadOutlined as UploadIcon,
    CleaningServicesOutlined as ClearCacheIcon
} from "@mui/icons-material";
import { Link as RouterLink, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import { clearAdminCacheApi } from "../api/admin.api";
import { confirmAction, alertSuccess } from "../utils/swal";

const drawerWidth = 250;

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const { t, isRtl } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [clearingCache, setClearingCache] = useState(false);
    const [openSubmenus, setOpenSubmenus] = useState({
        "Website Setup": false,
        "Setup & Configuration": false,
        "Staff": false
    });

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        handleMenuClose();
        const confirmed = await confirmAction({
            title: t("navbar.logoutConfirmTitle", "Log Out?"),
            text: t("navbar.logoutConfirmText", "Are you sure you want to log out of the admin panel?"),
            confirmButtonText: t("navbar.yesLogout", "Yes, log out"),
            confirmButtonColor: "#ef4444",
            icon: "question"
        });
        if (!confirmed) return;
        await logout();
        navigate("/login");
    };

    const handleToggleSubmenu = (title) => {
        setOpenSubmenus(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const menuItems = [
        { text: t("Dashboard", "Dashboard"), icon: <DashboardIcon />, path: "/admin/dashboard" },
        { text: t("Uploaded Files", "Uploaded Files"), icon: <UploadIcon />, path: "/admin/uploaded-files" },
        { text: t("Blogs", "Blogs"), icon: <PostIcon />, path: "/admin/blogs" },
        { text: t("Categories", "Categories"), icon: <CategoryIcon />, path: "/admin/categories" },
        { text: t("Users", "Users"), icon: <PeopleIcon />, path: "/admin/users" },

        // Website Setup Menu
        {
            text: t("Website Setup", "Website Setup"),
            key: "Website Setup",
            icon: <WebSetupIcon />,
            children: [
                { text: t("Homepage Settings", "Homepage Settings"), path: "/admin/website-setup/homepage" },
                { text: t("Header", "Header"), path: "/admin/website-setup/header" },
                { text: t("Footer", "Footer"), path: "/admin/website-setup/footer" },
                { text: t("Pages", "Pages"), path: "/admin/website-setup/pages" },
                { text: t("Appearance", "Appearance"), path: "/admin/website-setup/appearance" }
            ]
        },

        // Setup & Configuration Menu
        {
            text: t("Setup & Configuration", "Setup & Configuration"),
            key: "Setup & Configuration",
            icon: <ConfigIcon />,
            children: [
                { text: t("Feature Activation", "Feature Activation"), path: "/admin/setup/features" },
                { text: t("Language", "Language"), path: "/admin/setup/language" },
                { text: t("File System Configuration", "File System Configuration"), path: "/admin/file_system" },
                { text: t("SMTP Setting", "SMTP Setting"), path: "/admin/setup/smtp" },
                { text: t("Payment Methods", "Payment Methods"), path: "/admin/setup/payment-methods" },
                { text: t("Google (reCAPTCHA & Analytics)", "Google (reCAPTCHA & Analytics)"), path: "/admin/setup/google" }
            ]
        },

        // Staff Menu
        {
            text: t("Staff", "Staff"),
            key: "Staff",
            icon: <StaffIcon />,
            children: [
                { text: t("All Staff", "All Staff"), path: "/admin/staff/all" },
                { text: t("Staff Permissions", "Staff Permissions"), path: "/admin/staff/permissions" }
            ]
        },

        { text: t("Contact Enquiries", "Contact Enquiries"), icon: <ContactIcon />, path: "/admin/contacts" },
        { text: t("User Login History", "User Login History"), icon: <LoginHistoryIcon />, path: "/admin/login-history" },
        { text: t("Activity Logs", "Activity Logs"), icon: <LogIcon />, path: "/admin/logs" },
    ];

    const drawer = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#1f242d", color: "#e9ecef" }}>
            {/* Kash Header Branding */}
            <Box sx={{ p: 2.5, textAlign: isRtl ? "right" : "left" }}>
                <Typography variant="h5" fontWeight={900} color="#FFC107" letterSpacing="1px" sx={{ fontFamily: "sans-serif", display: "inline-flex", alignItems: "center", gap: 0.5, direction: "ltr" }}>
                    KA<span sx={{ color: "#FFC107" }}>$</span>H
                </Typography>
                <Typography variant="caption" display="block" sx={{ color: "#adb5bd", fontSize: "0.7rem", fontWeight: 600, fontStyle: "italic", letterSpacing: "0.5px" }}>
                    {t("Winning is a habit", "Winning is a habit")}
                </Typography>
            </Box>

            <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

            <List sx={{
                px: 1,
                pt: 1,
                flexGrow: 1,
                overflowY: "auto",
                overflowX: "hidden",
                "&::-webkit-scrollbar": {
                    width: "4px",
                },
                "&::-webkit-scrollbar-track": {
                    background: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                    background: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                    background: "rgba(255, 255, 255, 0.3)",
                },
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255, 255, 255, 0.15) transparent"
            }}>
                {menuItems.map((item) => {
                    if (item.children) {
                        const isChildActive = item.children.some(child => location.pathname === child.path);
                        const menuKey = item.key || item.text;
                        const isOpen = openSubmenus[menuKey] || isChildActive;

                        return (
                            <Box key={menuKey} sx={{ mb: 0.3 }}>
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={() => handleToggleSubmenu(menuKey)}
                                        sx={{
                                            borderRadius: 1.5,
                                            color: isChildActive ? "#ffffff" : "#abb9c7",
                                            bgcolor: isChildActive ? "rgba(255, 255, 255, 0.08)" : "transparent",
                                            "&:hover": {
                                                bgcolor: "rgba(255, 255, 255, 0.05)",
                                                color: "#ffffff"
                                            },
                                            py: 1
                                        }}
                                    >
                                        <ListItemIcon sx={{ color: isChildActive ? "#FFC107" : "#8a99ad", minWidth: 36, fontSize: "1.2rem" }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.text}
                                            primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: isChildActive ? 600 : 500 }}
                                        />
                                        {isOpen ? <ExpandLess sx={{ color: "#8a99ad", fontSize: "1.1rem" }} /> : <ExpandMore sx={{ color: "#8a99ad", fontSize: "1.1rem" }} />}
                                    </ListItemButton>
                                </ListItem>
                                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding sx={{ [isRtl ? 'pr' : 'pl']: 1.5 }}>
                                        {item.children.map((child) => {
                                            const active = location.pathname === child.path;
                                            return (
                                                <ListItem key={child.path} disablePadding sx={{ mb: 0.2 }}>
                                                    <ListItemButton
                                                        component={RouterLink}
                                                        to={child.path}
                                                        selected={active}
                                                        sx={{
                                                            borderRadius: 1.5,
                                                            color: active ? "#ffffff" : "#8a99ad",
                                                            bgcolor: active ? "rgba(255, 255, 255, 0.1) !important" : "transparent",
                                                            "&:hover": {
                                                                bgcolor: "rgba(255, 255, 255, 0.05)",
                                                                color: "#ffffff"
                                                            },
                                                            py: 0.8,
                                                            [isRtl ? 'pr' : 'pl']: 2
                                                        }}
                                                    >
                                                        <ListItemText
                                                            primary={child.text}
                                                            primaryTypographyProps={{ fontSize: "0.8125rem", fontWeight: active ? 600 : 400 }}
                                                        />
                                                    </ListItemButton>
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                </Collapse>
                            </Box>
                        );
                    }

                    const active = location.pathname === item.path;
                    return (
                        <ListItem key={item.path} disablePadding sx={{ mb: 0.3 }}>
                            <ListItemButton
                                component={RouterLink}
                                to={item.path}
                                selected={active}
                                sx={{
                                    borderRadius: 1.5,
                                    color: active ? "#ffffff" : "#abb9c7",
                                    bgcolor: active ? "rgba(255, 255, 255, 0.08) !important" : "transparent",
                                    "&:hover": {
                                        bgcolor: "rgba(255, 255, 255, 0.05)",
                                        color: "#ffffff"
                                    },
                                    py: 1
                                }}
                            >
                                <ListItemIcon sx={{ color: active ? "#FFC107" : "#8a99ad", minWidth: 36, fontSize: "1.2rem" }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: active ? 600 : 400 }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />
            <Box p={2}>
                <Button
                    fullWidth
                    onClick={handleLogout}
                    startIcon={<LogoutIcon />}
                    variant="outlined"
                    sx={{ textTransform: "none", color: "#ff4d4f", borderColor: "rgba(255, 77, 79, 0.4)", "&:hover": { borderColor: "#ff4d4f", bgcolor: "rgba(255, 77, 79, 0.1)" } }}
                >
                    {t("navbar.logout", "Logout")}
                </Button>
            </Box>
        </Box>
    );

    const handleClearCache = async () => {
        const confirmed = await confirmAction({
            title: t("admin.clearCacheConfirmTitle", "Clear System Cache?"),
            text: t("admin.clearCacheConfirmText", "This will rebuild system cache and refresh active configurations."),
            confirmButtonText: t("admin.yesClear", "Yes, clear cache"),
            confirmButtonColor: "#0ea5e9",
            icon: "info"
        });
        if (!confirmed) return;

        try {
            setClearingCache(true);
            const res = await clearAdminCacheApi();
            alertSuccess(
                t("admin.cacheCleared", "Cache Cleared!"),
                res.data?.message || res?.message || t("admin.cacheClearedSuccess", "Cache cleared successfully!")
            );
        } catch (err) {
            toast.error(err.response?.data?.message || t("admin.cacheClearFailed", "Failed to clear cache"));
        } finally {
            setClearingCache(false);
        }
    };

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f6f8" }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: isRtl ? 0 : { sm: `${drawerWidth}px` },
                    mr: isRtl ? { sm: `${drawerWidth}px` } : 0,
                    bgcolor: "#ffffff",
                    color: "#212529",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                    borderBottom: "1px solid #e9ecef"
                }}
            >
                <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ display: { sm: "none" } }}
                        >
                            <MenuIcon />
                        </IconButton>

                        <IconButton color="inherit" sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                            <MenuIcon />
                        </IconButton>

                        <Button
                            component={RouterLink}
                            to="/"
                            startIcon={<HomeIcon fontSize="small" />}
                            variant="outlined"
                            size="small"
                            sx={{
                                textTransform: "none",
                                borderRadius: 1.5,
                                color: "#0d6efd",
                                borderColor: "#9ec5fe",
                                fontWeight: 500,
                                "&:hover": { bgcolor: "#ecf2ff", borderColor: "#0d6efd" }
                            }}
                        >
                            {t("navbar.home", "Home")}
                        </Button>

                        <Button
                            onClick={handleClearCache}
                            disabled={clearingCache}
                            startIcon={clearingCache ? <CircularProgress size={14} color="inherit" /> : <ClearCacheIcon fontSize="small" />}
                            variant="outlined"
                            size="small"
                            sx={{
                                textTransform: "none",
                                borderRadius: 1.5,
                                color: "#fd7e14",
                                borderColor: "#ffe5d0",
                                fontWeight: 500,
                                "&:hover": { bgcolor: "#fff3e6", borderColor: "#fd7e14" }
                            }}
                        >
                            {clearingCache ? t("admin.clearing", "Clearing...") : t("admin.clearCache", "Clear cache")}
                        </Button>

                        <LanguageSwitcher variant="light" />
                    </Stack>

                    {/* Right side controls */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        {/* User Profile display */}
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            onClick={handleMenuOpen}
                            sx={{ cursor: "pointer", px: 1 }}
                        >
                            <Avatar
                                sx={{
                                    width: 38,
                                    height: 38,
                                    bgcolor: "#495057",
                                    fontSize: "0.9rem",
                                    fontWeight: 700
                                }}
                            >
                                {user?.name ? user.name.substring(0, 2).toUpperCase() : "AD"}
                            </Avatar>
                            <Box sx={{ display: { xs: "none", md: "block" }, textAlign: isRtl ? "right" : "left" }}>
                                <Typography variant="subtitle2" fontWeight={700} lineHeight={1.1} color="#212529">
                                    {user?.name || "Admin User"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" lineHeight={1}>
                                    {t("admin.administrator", "Administrator")}
                                </Typography>
                            </Box>
                        </Stack>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            PaperProps={{ sx: { mt: 1.5, minWidth: 180, borderRadius: 2, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" } }}
                        >
                            <Box sx={{ px: 2, py: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {t("admin.menu", "Admin Menu")}
                                </Typography>
                            </Box>
                            <Divider />
                            <MenuItem component={RouterLink} to="/admin/website-setup/appearance" onClick={handleMenuClose} sx={{ py: 1, fontSize: "0.875rem" }}>
                                <PersonIcon fontSize="small" sx={{ [isRtl ? 'ml' : 'mr']: 1.5, color: "#6c757d" }} /> {t("admin.profile", "Profile")}
                            </MenuItem>
                            <MenuItem component={RouterLink} to="/admin/contacts" onClick={handleMenuClose} sx={{ py: 1, fontSize: "0.875rem" }}>
                                <ContactIcon fontSize="small" sx={{ [isRtl ? 'ml' : 'mr']: 1.5, color: "#6c757d" }} /> {t("admin.messages", "Messages")}
                            </MenuItem>
                            <MenuItem component={RouterLink} to="/admin/setup/features" onClick={handleMenuClose} sx={{ py: 1, fontSize: "0.875rem" }}>
                                <SettingsIcon fontSize="small" sx={{ [isRtl ? 'ml' : 'mr']: 1.5, color: "#6c757d" }} /> {t("admin.settings", "Settings")}
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout} sx={{ py: 1, fontSize: "0.875rem", color: "error.main" }}>
                                <LogoutIcon fontSize="small" sx={{ [isRtl ? 'ml' : 'mr']: 1.5 }} /> {t("navbar.logout", "Logout")}
                            </MenuItem>
                        </Menu>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer
                    variant="temporary"
                    anchor={isRtl ? "right" : "left"}
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: "block", sm: "none" },
                        "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    anchor={isRtl ? "right" : "left"}
                    sx={{
                        display: { xs: "none", sm: "block" },
                        "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, borderRight: isRtl ? "none" : "1px solid #e9ecef", borderLeft: isRtl ? "1px solid #e9ecef" : "none" }
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3 },
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: 8
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default AdminLayout;
