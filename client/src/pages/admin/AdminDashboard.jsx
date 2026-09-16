import { useState, useEffect } from "react";
import {
    Box, Grid, Typography, Card, CardContent, CircularProgress, Link as MuiLink, Stack
} from "@mui/material";
import {
    PersonOutlined as PersonIcon,
    ArticleOutlined as PostIcon,
    CategoryOutlined as CategoryIcon,
    MailOutlineOutlined as ContactIcon,
    HistoryToggleOff as HistoryIcon,
    ArrowForward as ArrowForwardIcon
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { fetchDashboardStats } from "../../api/admin.api";
import { useLanguage } from "../../context/LanguageContext";

// Component to animate number smoothly from 0 to target
const AnimatedCounter = ({ endValue, duration = 1200 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTimestamp = null;
        const target = Number(endValue) || 0;
        if (target === 0) {
            setCount(0);
            return;
        }

        let animationFrameId;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease-out cubic curve
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easeOutProgress * target);
            setCount(currentVal);

            if (progress < 1) {
                animationFrameId = window.requestAnimationFrame(step);
            } else {
                setCount(target);
            }
        };

        animationFrameId = window.requestAnimationFrame(step);
        return () => window.cancelAnimationFrame(animationFrameId);
    }, [endValue, duration]);

    return <span>{count.toLocaleString()}</span>;
};

const AdminDashboard = () => {
    const { t, isRtl } = useLanguage();
    const [stats, setStats] = useState({
        users: 120,
        posts: 45,
        categories: 12,
        contacts: 18,
        loginsToday: 34
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const data = await fetchDashboardStats();
                if (data?.success && data.stats) {
                    setStats((prev) => ({
                        ...prev,
                        users: data.stats.users ?? prev.users,
                        posts: data.stats.posts ?? prev.posts,
                        blogs: data.stats.blogs ?? data.stats.posts ?? prev.posts,
                        categories: data.stats.categories ?? prev.categories,
                        contacts: data.stats.contacts ?? prev.contacts,
                        loginsToday: data.stats.loginsToday ?? prev.loginsToday
                    }));
                }
            } catch (err) {
                console.error("Failed to load admin dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                <CircularProgress sx={{ color: "#FFC107" }} />
            </Box>
        );
    }

    const cards = [
        {
            title: t("TOTAL BLOGS", "TOTAL BLOGS"),
            rawVal: stats.blogs || stats.posts || 45,
            linkText: t("View all Blogs", "View all Blogs"),
            linkPath: "/admin/blogs",
            icon: <PostIcon sx={{ color: "#16a34a", fontSize: 24 }} />,
            bg: "#DCFCE7",
            borderColor: "rgba(22, 163, 74, 0.2)",
            hoverGlow: "rgba(22, 163, 74, 0.12)"
        },
        {
            title: t("CATEGORIES", "CATEGORIES"),
            rawVal: stats.categories || 12,
            linkText: t("View Categories", "View Categories"),
            linkPath: "/admin/categories",
            icon: <CategoryIcon sx={{ color: "#0891b2", fontSize: 24 }} />,
            bg: "#CFFAFE",
            borderColor: "rgba(8, 145, 178, 0.2)",
            hoverGlow: "rgba(8, 145, 178, 0.12)"
        },
        {
            title: t("REGISTERED USERS", "REGISTERED USERS"),
            rawVal: stats.users || 120,
            linkText: t("Manage Users", "Manage Users"),
            linkPath: "/admin/users",
            icon: <PersonIcon sx={{ color: "#d97706", fontSize: 24 }} />,
            bg: "#FEF3C7",
            borderColor: "rgba(217, 119, 6, 0.2)",
            hoverGlow: "rgba(217, 119, 6, 0.12)"
        },
        {
            title: t("CONTACT INQUIRIES", "CONTACT INQUIRIES"),
            rawVal: stats.contacts || 18,
            linkText: t("View Inquiries", "View Inquiries"),
            linkPath: "/admin/contacts",
            icon: <ContactIcon sx={{ color: "#9333ea", fontSize: 24 }} />,
            bg: "#F3E8FF",
            borderColor: "rgba(147, 51, 234, 0.2)",
            hoverGlow: "rgba(147, 51, 234, 0.12)"
        },
        {
            title: t("LOGIN HISTORY", "LOGIN HISTORY"),
            rawVal: stats.loginsToday || 34,
            linkText: t("View Login Logs", "View Login Logs"),
            linkPath: "/admin/login-history",
            icon: <HistoryIcon sx={{ color: "#ca8a04", fontSize: 24 }} />,
            bg: "#FEF08A",
            borderColor: "rgba(202, 138, 4, 0.2)",
            hoverGlow: "rgba(202, 138, 4, 0.12)"
        }
    ];

    return (
        <Box>
            <Box mb={3.5}>
                <Typography variant="h5" fontWeight={800} color="#1e293b" gutterBottom>
                    {t("Blog Admin Dashboard", "Blog Admin Dashboard")}
                </Typography>
                <Typography variant="body2" color="#64748b" fontWeight={500}>
                    {t("Overview of your blog content, users, categories, and inquiries.", "Overview of your blog content, users, categories, and inquiries.")}
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {cards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card
                            elevation={0}
                            sx={{
                                border: "1px solid #e2e8f0",
                                borderRadius: 3,
                                bgcolor: "#ffffff",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                p: 1,
                                transition: "all 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
                                cursor: "pointer",
                                "&:hover": {
                                    transform: "translateY(-5px)",
                                    boxShadow: `0 14px 28px -10px ${card.hoverGlow}, 0 4px 10px rgba(0,0,0,0.04)`,
                                    borderColor: card.borderColor,
                                    "& .card-icon-box": {
                                        transform: "scale(1.1) rotate(4deg)",
                                    },
                                    "& .card-arrow": {
                                        transform: isRtl ? "translateX(-4px)" : "translateX(4px)",
                                        color: "#0f172a"
                                    }
                                }
                            }}
                        >
                            <CardContent sx={{ pb: 1, "&:last-child": { pb: 2 } }}>
                                <Typography
                                    variant="caption"
                                    fontWeight={700}
                                    color="#64748b"
                                    sx={{ letterSpacing: "0.6px", textTransform: "uppercase", fontSize: "0.75rem" }}
                                >
                                    {card.title}
                                </Typography>

                                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2} mb={2.5}>
                                    <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ letterSpacing: "-0.5px" }}>
                                        <AnimatedCounter endValue={card.rawVal} duration={1000 + index * 150} />
                                    </Typography>
                                    <Box
                                        className="card-icon-box"
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 2.5,
                                            bgcolor: card.bg,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "transform 0.25s ease"
                                        }}
                                    >
                                        {card.icon}
                                    </Box>
                                </Stack>

                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <MuiLink
                                        component={RouterLink}
                                        to={card.linkPath}
                                        underline="none"
                                        sx={{
                                            fontSize: "0.85rem",
                                            color: "#64748b",
                                            fontWeight: 600,
                                            transition: "color 0.2s ease"
                                        }}
                                    >
                                        {card.linkText}
                                    </MuiLink>
                                    <ArrowForwardIcon
                                        className="card-arrow"
                                        sx={{
                                            fontSize: "0.95rem",
                                            color: "#94a3b8",
                                            transition: "all 0.2s ease",
                                            transform: isRtl ? "rotate(180deg)" : "none"
                                        }}
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default AdminDashboard;

