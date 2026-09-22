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
    PaymentOutlined as PaymentIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    WhatsApp as WhatsAppIcon,
    Facebook as FacebookIcon,
    Twitter as TwitterIcon,
    Instagram as InstagramIcon,
    YouTube as YouTubeIcon,
    LinkedIn as LinkedInIcon
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../i18n/i18n";
import { useSettings } from "../context/SettingsContext";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import CookiesAgreementBanner from "../components/common/CookiesAgreementBanner";
import WebsitePopupModal from "../components/common/WebsitePopupModal";

const PublicLayout = ({ children }) => {
    const { isAuthenticated, user, role, logout } = useAuth();
    const { t } = useTranslation();
    const { get_setting, uploaded_asset } = useSettings();
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

    // Header Settings
    const headerLogo = get_setting('header_logo') || get_setting('system_logo_white') || get_setting('system_logo_black');
    const headerLogoCircle = get_setting('header_logo_circle', 'off') === 'on' || get_setting('header_logo_circle') === true || get_setting('header_logo_circle') === '1' || get_setting('header_logo_circle') === 1;
    const siteName = get_setting('site_name', get_setting('website_name', 'Home'));
    const topbarBanner = get_setting('topbar_banner');
    const topbarBannerLink = get_setting('topbar_banner_link');
    const helplineNumber = get_setting('helpline_number');
    const helplineEmail = get_setting('helpine_email');
    const helplineWhatsapp = get_setting('helpine_whatsapp');
    const showLanguageSwitcher = get_setting('show_language_switcher', 'on') !== 'off';
    const enableStickyHeader = get_setting('enable_sticky_header', 'on') !== 'off';
    const headerNavMenuText = get_setting('header_nav_menu_text', 'light');

    const menuTextColor = headerNavMenuText === "dark" ? "#333333" : "#ffffff";

    const menuHoverColor = headerNavMenuText === "dark" ? "#000000" : "#ffffff";

    const menuHoverBg = headerNavMenuText === "dark" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.15)";

    const headerMenuLabels = get_setting('header_menu_labels');
    const headerMenuLinks = get_setting('header_menu_links');

    const hasCustomMenu = Array.isArray(headerMenuLabels) && headerMenuLabels.length > 0;

    // Footer Settings
    const footerLogo = get_setting('footer_logo') || get_setting('system_logo_black') || get_setting('system_logo_white');
    const footerLogoCircle = get_setting('footer_logo_circle', 'off') === 'on' || get_setting('footer_logo_circle') === true || get_setting('footer_logo_circle') === '1' || get_setting('footer_logo_circle') === 1;
    const aboutDescription = get_setting('about_us_description', 'A modern blog portal to share inspiring ideas, articles, and technical insights.');
    const contactAddress = get_setting('contact_address');
    const contactEmail = get_setting('contact_email', helplineEmail || 'my.shadabalam@gmail.com');
    const contactPhone = get_setting('contact_phone', helplineNumber || '+91 9807770015');
    // stripHtml
    // Remove HTML tags from text
    const stripHtml = (html) => {
        if (!html) return "";

        const div = document.createElement("div");
        div.innerHTML = html;

        return div.textContent || div.innerText || "";
    };

    const copyrightText = stripHtml(get_setting('frontend_copyright_text'));

    const showSocialLinks = get_setting('show_social_links', 'on') !== 'off';

    const widgetOneTitle = get_setting('widget_one_title');
    const widgetOneLabels = get_setting('widget_one_labels');
    const widgetOneLinks = get_setting('widget_one_links');

    const widgetTwoTitle = get_setting('widget_two_title');
    const widgetTwoLabels = get_setting('widget_two_labels');
    const widgetTwoLinks = get_setting('widget_two_links');

    const paymentMethodImages = get_setting('payment_method_images');

    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "#f8f9fa" }}>
            {/* Header Wrapper - Sticky or Static based on enable_sticky_header */}
            <Box
                component="header"
                sx={{
                    position: enableStickyHeader ? "sticky" : "static",
                    top: 0,
                    zIndex: 1100,
                    width: "100%",
                    boxShadow: enableStickyHeader ? "0 4px 20px rgba(0, 0, 0, 0.25)" : "none"
                }}
            >
                {/* 1. Topbar Banner (If configured in Header Settings) */}
                {topbarBanner && (
                    <Box
                        sx={{
                            width: '100%',
                            bgcolor: '#0a0d14',
                            textAlign: 'center',
                            lineHeight: 0,
                            borderBottom: '1px solid rgba(255,255,255,0.08)'
                        }}
                    >
                        <Box
                            component={topbarBannerLink ? "a" : "div"}
                            href={topbarBannerLink || undefined}
                            target={topbarBannerLink?.startsWith('http') ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            sx={{ display: 'block', textDecoration: 'none' }}
                        >
                            <Box
                                component="img"
                                src={uploaded_asset(topbarBanner)}
                                alt="Announcement Banner"
                                sx={{
                                    width: '100%',
                                    maxHeight: { xs: 50, sm: 70, md: 85 },
                                    objectFit: 'cover',
                                    display: 'block'
                                }}
                            />
                        </Box>
                    </Box>
                )}

                {/* 2. Topbar Contact & Helpline Strip (If configured in Header Settings) */}
                {(helplineNumber || helplineEmail || helplineWhatsapp) && (
                    <Box
                        sx={{
                            bgcolor: '#0f172a',
                            color: 'rgba(255, 255, 255, 0.75)',
                            fontSize: '0.78rem',
                            py: 0.6,
                            px: 2,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                        }}
                    >
                        <Container maxWidth="lg">
                            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                                <Stack direction="row" spacing={2.5} alignItems="center">
                                    {helplineEmail && (
                                        <Box
                                            component="a"
                                            href={`mailto:${helplineEmail}`}
                                            sx={{
                                                color: 'inherit',
                                                textDecoration: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.6,
                                                '&:hover': { color: '#ffffff' }
                                            }}
                                        >
                                            <EmailIcon sx={{ fontSize: 14, color: '#ff8a80' }} />
                                            <span>{helplineEmail}</span>
                                        </Box>
                                    )}
                                    {helplineNumber && (
                                        <Box
                                            component="a"
                                            href={`tel:${helplineNumber}`}
                                            sx={{
                                                color: 'inherit',
                                                textDecoration: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.6,
                                                '&:hover': { color: '#ffffff' }
                                            }}
                                        >
                                            <PhoneIcon sx={{ fontSize: 14, color: '#6ee7b7' }} />
                                            <span>{helplineNumber}</span>
                                        </Box>
                                    )}
                                </Stack>

                                <Stack direction="row" spacing={2} alignItems="center">
                                    {helplineWhatsapp && (
                                        <Box
                                            component="a"
                                            href={`https://wa.me/${String(helplineWhatsapp).replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                color: '#25D366',
                                                fontWeight: 600,
                                                textDecoration: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.6,
                                                '&:hover': { textDecoration: 'underline' }
                                            }}
                                        >
                                            <WhatsAppIcon sx={{ fontSize: 15 }} />
                                            <span>{helplineWhatsapp}</span>
                                        </Box>
                                    )}
                                </Stack>
                            </Stack>
                        </Container>
                    </Box>
                )}

                {/* 3. Header Navbar */}
                <AppBar
                    position="static"
                    elevation={0}
                    sx={{
                        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
                    }}
                >
                    <Container maxWidth="lg">
                        <Toolbar disableGutters sx={{ justifyContent: "space-between", py: 0.5 }}>
                            {/* Brand Logo - Circle or Full-size based on header_logo_circle */}
                            <Box
                                component={RouterLink}
                                to="/"
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    textDecoration: "none",
                                    mr: 3,
                                    flexShrink: 0
                                }}
                            >
                                {headerLogo ? (
                                    headerLogoCircle ? (
                                        <Box
                                            sx={{
                                                width: { xs: 40, sm: 46 },
                                                height: { xs: 40, sm: 46 },
                                                borderRadius: "50%",
                                                overflow: "hidden",
                                                bgcolor: "#ffffff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                                                border: "2px solid rgba(255, 255, 255, 0.25)",
                                                flexShrink: 0,
                                                p: 0.35,
                                                transition: "transform 0.2s ease",
                                                "&:hover": { transform: "scale(1.05)" }
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={uploaded_asset(headerLogo)}
                                                alt={siteName}
                                                sx={{
                                                    width: "100%",
                                                    height: "100%",
                                                    borderRadius: "50%",
                                                    objectFit: "contain",
                                                    display: "block"
                                                }}
                                            />
                                        </Box>
                                    ) : (
                                        <Box
                                            component="img"
                                            src={uploaded_asset(headerLogo)}
                                            alt={siteName}
                                            sx={{
                                                maxHeight: { xs: 38, sm: 44 },
                                                maxWidth: { xs: 160, sm: 220 },
                                                objectFit: "contain",
                                                display: "block",
                                                transition: "transform 0.2s ease",
                                                "&:hover": { transform: "scale(1.03)" }
                                            }}
                                        />
                                    )
                                ) : (
                                    <Typography
                                        id="public-brand-text"
                                        variant="h6"
                                        sx={{
                                            fontWeight: 900,
                                            fontSize: { xs: "1.1rem", sm: "1.3rem" },
                                            background: "linear-gradient(90deg, #ff8a80, #f5a623)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            letterSpacing: "0.5px",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {siteName}
                                    </Typography>
                                )}
                            </Box>

                            {/* Navigation Links - Dynamic from header_menu_labels / header_menu_links or defaults */}
                            {/* <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexGrow: 1 }}>
                                {hasCustomMenu ? (
                                    headerMenuLabels.map((label, idx) => {
                                        const links = Array.isArray(headerMenuLinks) ? headerMenuLinks : [];
                                        const link = links[idx] || '/';
                                        const isExternal = link.startsWith('http://') || link.startsWith('https://');
                                        const isActive = location.pathname === link;
                                        return (
                                            <Button
                                                key={`header-menu-item-${idx}`}
                                                component={isExternal ? "a" : RouterLink}
                                                {...(isExternal ? { href: link, target: "_blank", rel: "noopener noreferrer" } : { to: link })}
                                                sx={{
                                                    color: isActive ? "#ffffff" : (headerNavMenuText === 'dark' ? "#333333" : "rgba(255, 255, 255, 0.8)"),
                                                    fontWeight: isActive ? 700 : 500,
                                                    textTransform: "none",
                                                    fontSize: "0.9rem",
                                                    px: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: isActive ? "rgba(255, 255, 255, 0.12)" : "transparent",
                                                    "&:hover": { color: "#ffffff", bgcolor: "rgba(255, 255, 255, 0.15)" }
                                                }}
                                            >
                                                {label}
                                            </Button>
                                        );
                                    })
                                ) : (
                                    <>
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
                                    </>
                                )}

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
                            </Stack> */}
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                    alignItems: "center",
                                    flexGrow: 1
                                }}
                            >
                                {hasCustomMenu ? (
                                    headerMenuLabels.map((label, idx) => {
                                        const links = Array.isArray(headerMenuLinks)
                                            ? headerMenuLinks
                                            : [];

                                        const link = links[idx] || "/";

                                        const isExternal =
                                            link.startsWith("http://") ||
                                            link.startsWith("https://");

                                        const isActive = location.pathname === link;

                                        return (
                                            <Button
                                                key={`header-menu-item-${idx}`}
                                                component={isExternal ? "a" : RouterLink}
                                                {...(
                                                    isExternal
                                                        ? {
                                                            href: link,
                                                            target: "_blank",
                                                            rel: "noopener noreferrer"
                                                        }
                                                        : {
                                                            to: link
                                                        }
                                                )}
                                                sx={{
                                                    color: menuTextColor,

                                                    fontWeight: isActive ? 700 : 500,

                                                    textTransform: "none",

                                                    fontSize: "0.9rem",

                                                    px: 1.5,

                                                    borderRadius: 2,

                                                    bgcolor: isActive
                                                        ? (
                                                            headerNavMenuText === "dark"
                                                                ? "rgba(0, 0, 0, 0.08)"
                                                                : "rgba(255, 255, 255, 0.12)"
                                                        )
                                                        : "transparent",

                                                    "&:hover": {
                                                        color: menuHoverColor,
                                                        bgcolor: menuHoverBg
                                                    }
                                                }}
                                            >
                                                {label}
                                            </Button>
                                        );
                                    })
                                ) : (
                                    <>
                                        {/* Home */}
                                        <Button
                                            component={RouterLink}
                                            to="/"
                                            startIcon={<HomeIcon sx={{ fontSize: 18 }} />}
                                            sx={{
                                                color: menuTextColor,
                                                fontWeight:
                                                    location.pathname === "/" ? 700 : 500,
                                                textTransform: "none",
                                                fontSize: "0.9rem",
                                                px: 1.5,
                                                borderRadius: 2,

                                                bgcolor:
                                                    location.pathname === "/"
                                                        ? (
                                                            headerNavMenuText === "dark"
                                                                ? "rgba(0, 0, 0, 0.08)"
                                                                : "rgba(255, 255, 255, 0.1)"
                                                        )
                                                        : "transparent",

                                                "&:hover": {
                                                    color: menuHoverColor,
                                                    bgcolor: menuHoverBg
                                                }
                                            }}
                                        >
                                            {t("navbar.home", "Home")}
                                        </Button>

                                        {/* About */}
                                        <Button
                                            component={RouterLink}
                                            to="/about"
                                            startIcon={<InfoIcon sx={{ fontSize: 18 }} />}
                                            sx={{
                                                color: menuTextColor,
                                                fontWeight:
                                                    location.pathname === "/about" ? 700 : 500,
                                                textTransform: "none",
                                                fontSize: "0.9rem",
                                                px: 1.5,
                                                borderRadius: 2,

                                                bgcolor:
                                                    location.pathname === "/about"
                                                        ? (
                                                            headerNavMenuText === "dark"
                                                                ? "rgba(0, 0, 0, 0.08)"
                                                                : "rgba(255, 255, 255, 0.1)"
                                                        )
                                                        : "transparent",

                                                "&:hover": {
                                                    color: menuHoverColor,
                                                    bgcolor: menuHoverBg
                                                }
                                            }}
                                        >
                                            {t("navbar.about", "About")}
                                        </Button>

                                        {/* Contact */}
                                        <Button
                                            component={RouterLink}
                                            to="/contact"
                                            startIcon={<ContactIcon sx={{ fontSize: 18 }} />}
                                            sx={{
                                                color: menuTextColor,
                                                fontWeight:
                                                    location.pathname === "/contact" ? 700 : 500,
                                                textTransform: "none",
                                                fontSize: "0.9rem",
                                                px: 1.5,
                                                borderRadius: 2,

                                                bgcolor:
                                                    location.pathname === "/contact"
                                                        ? (
                                                            headerNavMenuText === "dark"
                                                                ? "rgba(0, 0, 0, 0.08)"
                                                                : "rgba(255, 255, 255, 0.1)"
                                                        )
                                                        : "transparent",

                                                "&:hover": {
                                                    color: menuHoverColor,
                                                    bgcolor: menuHoverBg
                                                }
                                            }}
                                        >
                                            {t("navbar.contact", "Contact")}
                                        </Button>
                                    </>
                                )}

                                {/* Authenticated Menu */}
                                {isAuthenticated && (
                                    <Button
                                        component={RouterLink}
                                        to={
                                            role === "admin" || role === "staff"
                                                ? "/admin/dashboard"
                                                : "/dashboard"
                                        }
                                        startIcon={
                                            role === "admin" || role === "staff"
                                                ? <AdminIcon sx={{ fontSize: 18 }} />
                                                : <BlogIcon sx={{ fontSize: 18 }} />
                                        }
                                        sx={{
                                            color:
                                                role === "admin" || role === "staff"
                                                    ? "#ff8a80"
                                                    : "#6ee7b7",

                                            fontWeight: 700,
                                            textTransform: "none",
                                            fontSize: "0.9rem",
                                            px: 1.5,
                                            borderRadius: 2,

                                            "&:hover": {
                                                bgcolor: "rgba(255, 255, 255, 0.12)"
                                            }
                                        }}
                                    >
                                        {role === "admin" || role === "staff"
                                            ? "Admin Panel"
                                            : "My Studio"}
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

                                {/* Language Selector - Controlled by show_language_switcher */}
                                {showLanguageSwitcher && <LanguageSwitcher variant="dark" />}
                            </Stack>
                        </Toolbar>
                    </Container>
                </AppBar>
            </Box>

            <Box component="main" sx={{ flexGrow: 1 }}>
                {children}
            </Box>

            {/* Footer - Powered by get_setting */}
            <Box component="footer" sx={{ py: 6, bgcolor: "#0b192c", color: "rgba(255, 255, 255, 0.7)", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} mb={4}>
                        {/* Column 1: Footer Logo & About Description */}
                        <Grid item xs={12} md={4}>
                            {footerLogo ? (
                                <Box
                                    component={RouterLink}
                                    to="/"
                                    sx={{
                                        display: "inline-block",
                                        textDecoration: "none",
                                        mb: 2
                                    }}
                                >
                                    {footerLogoCircle ? (
                                        <Box
                                            sx={{
                                                width: { xs: 50, sm: 58 },
                                                height: { xs: 50, sm: 58 },
                                                borderRadius: "50%",
                                                overflow: "hidden",
                                                bgcolor: "#ffffff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                                                border: "2px solid rgba(255, 255, 255, 0.2)",
                                                p: 0.4,
                                                transition: "transform 0.2s ease",
                                                "&:hover": { transform: "scale(1.05)" }
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={uploaded_asset(footerLogo)}
                                                alt={siteName}
                                                sx={{
                                                    width: "100%",
                                                    height: "100%",
                                                    borderRadius: "50%",
                                                    objectFit: "contain",
                                                    display: "block"
                                                }}
                                            />
                                        </Box>
                                    ) : (
                                        <Box
                                            component="img"
                                            src={uploaded_asset(footerLogo)}
                                            alt={siteName}
                                            sx={{
                                                maxHeight: { xs: 45, sm: 52 },
                                                maxWidth: { xs: 180, sm: 240 },
                                                objectFit: "contain",
                                                display: "block",
                                                transition: "transform 0.2s ease",
                                                "&:hover": { transform: "scale(1.03)" }
                                            }}
                                        />
                                    )}
                                </Box>
                            ) : (
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
                                    {siteName}
                                </Typography>
                            )}
                            <Typography variant="body2" sx={{ maxWidth: 320, lineHeight: 1.6, mb: 2 }}>
                                {aboutDescription}
                            </Typography>

                            {/* Social Icons Strip */}
                            {showSocialLinks && (
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    {get_setting('facebook_link') && (
                                        <IconButton
                                            component="a"
                                            href={get_setting('facebook_link')}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            size="small"
                                            sx={{ color: "rgba(255,255,255,0.7)", '&:hover': { color: "#1877F2" } }}
                                        >
                                            <FacebookIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    {get_setting('twitter_link') && (
                                        <IconButton
                                            component="a"
                                            href={get_setting('twitter_link')}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            size="small"
                                            sx={{ color: "rgba(255,255,255,0.7)", '&:hover': { color: "#1DA1F2" } }}
                                        >
                                            <TwitterIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    {get_setting('instagram_link') && (
                                        <IconButton
                                            component="a"
                                            href={get_setting('instagram_link')}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            size="small"
                                            sx={{ color: "rgba(255,255,255,0.7)", '&:hover': { color: "#E4405F" } }}
                                        >
                                            <InstagramIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    {get_setting('youtube_link') && (
                                        <IconButton
                                            component="a"
                                            href={get_setting('youtube_link')}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            size="small"
                                            sx={{ color: "rgba(255,255,255,0.7)", '&:hover': { color: "#CD201F" } }}
                                        >
                                            <YouTubeIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    {get_setting('linkedin_link') && (
                                        <IconButton
                                            component="a"
                                            href={get_setting('linkedin_link')}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            size="small"
                                            sx={{ color: "rgba(255,255,255,0.7)", '&:hover': { color: "#0A66C2" } }}
                                        >
                                            <LinkedInIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Stack>
                            )}
                        </Grid>

                        {/* Column 2: Widget One / Quick Links */}
                        <Grid item xs={6} sm={4} md={2.5}>
                            <Typography variant="subtitle2" fontWeight={700} color="#ffffff" gutterBottom>
                                {widgetOneTitle || "Navigation"}
                            </Typography>
                            <Stack spacing={1}>
                                {Array.isArray(widgetOneLabels) && widgetOneLabels.length > 0 ? (
                                    widgetOneLabels.map((lbl, idx) => {
                                        const href = (Array.isArray(widgetOneLinks) && widgetOneLinks[idx]) ? widgetOneLinks[idx] : '/';
                                        const isExternal = href.startsWith('http://') || href.startsWith('https://');
                                        return (
                                            <Typography
                                                key={`w1-${idx}`}
                                                variant="body2"
                                                component={isExternal ? "a" : RouterLink}
                                                {...(isExternal ? { href, target: "_blank", rel: "noopener noreferrer" } : { to: href })}
                                                sx={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", "&:hover": { color: "var(--primary-color, #ff8a80)" } }}
                                            >
                                                {lbl}
                                            </Typography>
                                        );
                                    })
                                ) : (
                                    <>
                                        <Typography variant="body2" component={RouterLink} to="/" sx={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", "&:hover": { color: "var(--primary-color, #ff8a80)" } }}>Home</Typography>
                                        <Typography variant="body2" component={RouterLink} to="/about" sx={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", "&:hover": { color: "var(--primary-color, #ff8a80)" } }}>About Us</Typography>
                                        <Typography variant="body2" component={RouterLink} to="/contact" sx={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", "&:hover": { color: "var(--primary-color, #ff8a80)" } }}>Contact</Typography>
                                    </>
                                )}
                            </Stack>
                        </Grid>

                        {/* Column 3: Widget Two / Support & Legal */}
                        <Grid item xs={6} sm={4} md={2.5}>
                            <Typography variant="subtitle2" fontWeight={700} color="#ffffff" gutterBottom>
                                {widgetTwoTitle || "Support & Legal"}
                            </Typography>
                            <Stack spacing={1}>
                                {Array.isArray(widgetTwoLabels) && widgetTwoLabels.length > 0 ? (
                                    widgetTwoLabels.map((lbl, idx) => {
                                        const href = (Array.isArray(widgetTwoLinks) && widgetTwoLinks[idx]) ? widgetTwoLinks[idx] : '#';
                                        const isExternal = href.startsWith('http://') || href.startsWith('https://');
                                        return (
                                            <Typography
                                                key={`w2-${idx}`}
                                                variant="body2"
                                                component={isExternal ? "a" : RouterLink}
                                                {...(isExternal ? { href, target: "_blank", rel: "noopener noreferrer" } : { to: href })}
                                                sx={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", "&:hover": { color: "var(--primary-color, #ff8a80)" } }}
                                            >
                                                {lbl}
                                            </Typography>
                                        );
                                    })
                                ) : (
                                    <>
                                        <Typography variant="body2" sx={{ cursor: "pointer", "&:hover": { color: "var(--primary-color, #ff8a80)" } }}>Privacy Policy</Typography>
                                        <Typography variant="body2" sx={{ cursor: "pointer", "&:hover": { color: "var(--primary-color, #ff8a80)" } }}>Terms of Service</Typography>
                                        <Typography variant="body2" sx={{ cursor: "pointer", "&:hover": { color: "var(--primary-color, #ff8a80)" } }}>FAQ</Typography>
                                    </>
                                )}
                            </Stack>
                        </Grid>

                        {/* Column 4: Contact Info */}
                        <Grid item xs={12} sm={4} md={3}>
                            <Typography variant="subtitle2" fontWeight={700} color="#ffffff" gutterBottom>
                                Contact Info
                            </Typography>
                            <Stack spacing={0.8}>
                                {contactAddress && (
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                        {contactAddress}
                                    </Typography>
                                )}
                                {contactEmail && (
                                    <Typography
                                        variant="body2"
                                        component="a"
                                        href={`mailto:${contactEmail}`}
                                        sx={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", "&:hover": { color: "#ffffff" } }}
                                    >
                                        {contactEmail}
                                    </Typography>
                                )}
                                {contactPhone && (
                                    <Typography
                                        variant="body2"
                                        component="a"
                                        href={`tel:${contactPhone}`}
                                        sx={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", "&:hover": { color: "#ffffff" } }}
                                    >
                                        {contactPhone}
                                    </Typography>
                                )}
                            </Stack>

                            {/* Payment method images if configured */}
                            {Array.isArray(paymentMethodImages) && paymentMethodImages.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {paymentMethodImages.map((img, i) => (
                                            <Box
                                                key={`pm-${i}`}
                                                component="img"
                                                src={uploaded_asset(img)}
                                                alt="Payment method"
                                                sx={{ height: 24, borderRadius: 1, bgcolor: '#ffffff', p: 0.3 }}
                                            />
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Grid>
                    </Grid>

                    <Typography variant="body2" align="center" pt={4} sx={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", fontSize: "0.85rem" }}>
                        {copyrightText}
                    </Typography>
                </Container>
            </Box>

            {/* Appearance Settings: Cookies Banner & Website Popup */}
            <CookiesAgreementBanner />
            <WebsitePopupModal />
        </Box>
    );
};

export default PublicLayout;
