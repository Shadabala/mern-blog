import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    styled,
    Button,
    Skeleton,
    Container,
    Stack,
    Tabs,
    Tab,
    Card,
    CardContent,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    AddCircleOutline,
    PaymentOutlined,
    ArticleOutlined,
    CategoryOutlined,
    LockOpenRounded,
    LockRounded,
    CheckCircleRounded,
    HourglassEmptyRounded,
    CancelRounded,
    ContentCopy,
    Launch,
    SearchOutlined,
    ShoppingBagOutlined,
    BoltRounded
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { API } from '../service/api';
import { DataContext } from '../context/DataProvider';
import { useAuth } from '../context/AuthContext';
import Post from './home/post/Post';
import { useTranslation } from '../i18n/i18n';
import { toast } from '../utils/toast';
import PublicLayout from '../layouts/PublicLayout';

const HeaderCard = styled(Box)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    background: #ffffff;
    padding: 28px 36px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
        padding: 20px;
    }
`;

const Title = styled(Typography)`
    font-size: 28px;
    font-weight: 800;
    color: #1a1a2e;
    display: flex;
    align-items: center;
    gap: 12px;
`;

const Subtitle = styled(Typography)`
    color: #64748b;
    margin-top: 6px;
    font-size: 15px;
`;

const ActionBtn = styled(Button)`
    background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
    color: #ffffff;
    border-radius: 12px;
    padding: 10px 22px;
    text-transform: none;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(26, 26, 46, 0.2);
    transition: all 0.2s ease;

    &:hover {
        background: linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(26, 26, 46, 0.3);
    }
`;

const StatsGrid = styled(Box)`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
`;

const PostsGrid = styled(Box)`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 28px;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
        gap: 20px;
    }
`;

const CategoriesGrid = styled(Box)`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
        gap: 20px;
    }
`;

const StatCard = styled(Card)`
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    }
`;

const CategoryCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'unlocked'
})(({ unlocked }) => ({
    borderRadius: '16px',
    border: unlocked ? '1.5px solid #10b981' : '1px solid #e2e8f0',
    background: unlocked ? '#f0fdf4' : '#ffffff',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    transition: 'all 0.2s ease',
    '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
    }
}));

const StyledTableContainer = styled(TableContainer)`
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.03);
    border: 1px solid #e2e8f0;
    background: #ffffff;
    overflow-x: auto;
`;

const StyledTableHead = styled(TableHead)`
    background-color: #f8fafc;
    & th {
        font-weight: 700;
        color: #475569;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid #e2e8f0;
        padding: 16px;
    }
`;

const StyledTableRow = styled(TableRow)`
    transition: background-color 0.2s ease;
    &:hover {
        background-color: #f8fafc;
    }
    & td {
        padding: 16px;
        border-bottom: 1px solid #f1f5f9;
        color: #1e293b;
    }
`;

const StatusChip = styled(Chip)(({ status }) => ({
    fontWeight: 700,
    fontSize: '12px',
    borderRadius: '20px',
    padding: '2px 6px',
    backgroundColor:
        status === 'success'
            ? '#dcfce7'
            : status === 'pending'
            ? '#fef9c3'
            : '#fee2e2',
    color:
        status === 'success'
            ? '#15803d'
            : status === 'pending'
            ? '#a16207'
            : '#b91c1c',
    border: `1px solid ${
        status === 'success'
            ? '#bbf7d0'
            : status === 'pending'
            ? '#fef08a'
            : '#fecaca'
    }`,
}));

const EmptyState = styled(Box)`
    text-align: center;
    padding: 80px 24px;
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
`;

const Dashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'en';
    const dataContext = useContext(DataContext);
    const account = dataContext?.account || {};
    const { user, role, isAuthenticated, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            toast.warning("Please log in to access your Studio.");
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, navigate]);

    const username = user?.username || user?.name || account?.username || '';
    const isRegularUser = (role === 'user' || account?.role === 'user');

    // Tab control: 0 = My Blogs, 1 = Category Licenses, 2 = Payment History
    const [currentTab, setCurrentTab] = useState(0);

    // Data States
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [purchasedCategories, setPurchasedCategories] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Action states
    const [purchasingCatId, setPurchasingCatId] = useState(null);
    const [catSearch, setCatSearch] = useState('');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tabParam = queryParams.get('tab');
        if (tabParam === 'categories' || tabParam === 'category') {
            setCurrentTab(1);
        } else if (tabParam === 'payments' || tabParam === 'payment') {
            setCurrentTab(2);
        }
    }, [location.search]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [postRes, allCatRes, purchasedCatRes, paymentsRes] = await Promise.all([
                API.getAllPosts({ username, my_blogs: true }),
                API.getCategories(),
                API.getUserPurchasedCategories(),
                API.getAllPayments()
            ]);

            if (postRes.isSuccess) {
                const list = postRes.data?.blogs || postRes.data?.posts || postRes.data || [];
                setPosts(Array.isArray(list) ? list : []);
            } else {
                setPosts([]);
            }

            if (allCatRes.isSuccess) {
                const list = allCatRes.data?.categories || allCatRes.data || [];
                setCategories(Array.isArray(list) ? list : []);
            }

            if (purchasedCatRes.isSuccess) {
                const list = purchasedCatRes.data?.categories || purchasedCatRes.data || [];
                setPurchasedCategories(Array.isArray(list) ? list : []);
            }

            if (paymentsRes.isSuccess) {
                const list = paymentsRes.data || [];
                setPayments(Array.isArray(list) ? list : []);
            }
        } catch (err) {
            console.error('Error loading dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, [username]);

    const handleDeletePost = async (postId) => {
        const res = await API.deletePost(postId);
        if (res.isSuccess) {
            setPosts(prev => prev.filter(p => (p._id !== postId && p.id !== postId)));
            toast.success(t("dashboard.deleteSuccess", "Post deleted successfully."));
        } else {
            toast.error(res.msg || 'Failed to delete post. Please try again.');
        }
    };

    const handleUnlockCategory = async (catId) => {
        try {
            setPurchasingCatId(catId);
            toast.info(t("dashboard.connectingStripe", "Connecting to Stripe checkout..."));
            const res = await API.createCategoryCheckoutSession({ categoryId: catId });
            if (res.isSuccess && res.data?.url) {
                window.location.href = res.data.url;
            } else {
                toast.error(res.msg || res.data?.message || t("dashboard.purchaseFailed", "Failed to initiate checkout session"));
            }
        } catch (err) {
            console.error('Purchase error:', err);
            toast.error("Failed to connect to checkout. Please try again.");
        } finally {
            setPurchasingCatId(null);
        }
    };

    const handleCopy = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(t("payments.copied", "Transaction ID copied to clipboard"));
    };

    const purchasedIds = new Set(purchasedCategories.map(c => (c._id || c.id || c).toString()));

    const filteredCategories = categories.filter(c => {
        const name = c.name?.en || c.name || '';
        return name.toLowerCase().includes(catSearch.toLowerCase());
    });

    return (
        <PublicLayout>
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <HeaderCard>
                    <Box>
                        <Title>
                            <ArticleOutlined sx={{ fontSize: 34, color: '#e94560' }} />
                            {t("dashboard.title", "My Blog Studio")}
                        </Title>
                        <Subtitle>
                            {t("dashboard.subtitle", "Manage your personal blogs, unlocked category authoring rights, and payment receipts.")}
                        </Subtitle>
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <ActionBtn
                            startIcon={<AddCircleOutline />}
                            onClick={() => navigate('/create')}
                        >
                            {t("dashboard.create", "Write New Blog")}
                        </ActionBtn>
                    </Stack>
                </HeaderCard>

                {/* Dashboard Stats */}
                <StatsGrid>
                    <StatCard>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                            <Box sx={{ width: 52, height: 52, borderRadius: 3, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                                <ArticleOutlined sx={{ fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={800} color="#0f172a">
                                    {posts.length}
                                </Typography>
                                <Typography variant="body2" color="#64748b" fontWeight={600}>
                                    {t("dashboard.stats.myBlogs", "My Written Blogs")}
                                </Typography>
                            </Box>
                        </CardContent>
                    </StatCard>

                    <StatCard>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                            <Box sx={{ width: 52, height: 52, borderRadius: 3, backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                                <CategoryOutlined sx={{ fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={800} color="#0f172a">
                                    {isRegularUser ? purchasedCategories.length : categories.length}
                                </Typography>
                                <Typography variant="body2" color="#64748b" fontWeight={600}>
                                    {isRegularUser ? t("dashboard.stats.unlockedCategories", "Unlocked Categories") : t("dashboard.stats.allCategories", "Total Categories")}
                                </Typography>
                            </Box>
                        </CardContent>
                    </StatCard>

                    <StatCard>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                            <Box sx={{ width: 52, height: 52, borderRadius: 3, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                                <PaymentOutlined sx={{ fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={800} color="#0f172a">
                                    {payments.length}
                                </Typography>
                                <Typography variant="body2" color="#64748b" fontWeight={600}>
                                    {t("dashboard.stats.paymentsCount", "Payment Transactions")}
                                </Typography>
                            </Box>
                        </CardContent>
                    </StatCard>
                </StatsGrid>

                {/* Tabs Navigation */}
                <Box sx={{ borderBottom: 1, borderColor: '#e2e8f0', mb: 4 }}>
                    <Tabs
                        value={currentTab}
                        onChange={(e, val) => setCurrentTab(val)}
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '16px',
                                minHeight: '48px',
                                mr: 2
                            }
                        }}
                    >
                        <Tab
                            icon={<ArticleOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />}
                            iconPosition="start"
                            label={`${t("dashboard.tabs.blogs", "My Blogs")} (${posts.length})`}
                        />
                        <Tab
                            icon={<CategoryOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />}
                            iconPosition="start"
                            label={`${t("dashboard.tabs.categories", "Category Licenses")} (${isRegularUser ? purchasedCategories.length : categories.length})`}
                        />
                        <Tab
                            icon={<PaymentOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />}
                            iconPosition="start"
                            label={`${t("dashboard.tabs.payments", "Payment Receipts")} (${payments.length})`}
                        />
                    </Tabs>
                </Box>

                {/* TAB 0: MY BLOGS */}
                {currentTab === 0 && (
                    <Box>
                        {loading ? (
                            <PostsGrid>
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} variant="rounded" height={340} sx={{ borderRadius: 4 }} />
                                ))}
                            </PostsGrid>
                        ) : posts.length > 0 ? (
                            <PostsGrid>
                                {posts.map(post => (
                                    <Post
                                        key={post._id || post.id}
                                        post={post}
                                        isDashboard={true}
                                        onDelete={handleDeletePost}
                                        categories={categories}
                                    />
                                ))}
                            </PostsGrid>
                        ) : (
                            <EmptyState>
                                <Typography fontSize={54} mb={1}>✍️</Typography>
                                <Typography variant="h5" fontWeight={700} color="#1a1a2e" gutterBottom>
                                    {t("dashboard.empty.title", "You haven't written any blogs yet")}
                                </Typography>
                                <Typography color="#64748b" mb={3} maxWidth={460} mx="auto">
                                    {t("dashboard.empty.subtitle", "Share your thoughts, experiences, and expertise with readers across the world.")}
                                </Typography>
                                <ActionBtn onClick={() => navigate('/create')}>
                                    {t("dashboard.empty.btn", "Start Writing Now")}
                                </ActionBtn>
                            </EmptyState>
                        )}
                    </Box>
                )}

                {/* TAB 1: CATEGORY LICENSES */}
                {currentTab === 1 && (
                    <Box>
                        <Alert
                            severity="info"
                            icon={<BoltRounded sx={{ fontSize: 28 }} />}
                            sx={{
                                mb: 4,
                                borderRadius: 3,
                                p: 2.5,
                                backgroundColor: '#f0f9ff',
                                border: '1px solid #bae6fd'
                            }}
                        >
                            <Typography fontWeight={700} color="#0369a1" fontSize={16} gutterBottom>
                                {t("dashboard.catNotice.title", "Authoring Rights by Category")}
                            </Typography>
                            <Typography variant="body2" color="#0c4a6e" lineHeight={1.6}>
                                {t("dashboard.catNotice.desc", "To maintain high editorial quality, authors purchase a category license ($10) once to unlock lifetime publishing rights in that specific topic. Once purchased, you can write and publish unlimited articles in that category!")}
                            </Typography>
                        </Alert>

                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2} flexWrap="wrap">
                            <TextField
                                size="small"
                                placeholder={t("dashboard.searchCategories", "Search categories...")}
                                value={catSearch}
                                onChange={(e) => setCatSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchOutlined sx={{ color: '#94a3b8' }} />
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ minWidth: 280, backgroundColor: '#ffffff', borderRadius: 2 }}
                            />
                            <Typography variant="body2" color="#64748b" fontWeight={600}>
                                {t("dashboard.showingCategories", `Showing ${filteredCategories.length} categories`)}
                            </Typography>
                        </Box>

                        {loading ? (
                            <CategoriesGrid>
                                {[1, 2, 3, 4].map(i => (
                                    <Skeleton key={i} variant="rounded" height={180} sx={{ borderRadius: 3 }} />
                                ))}
                            </CategoriesGrid>
                        ) : filteredCategories.length > 0 ? (
                            <CategoriesGrid>
                                {filteredCategories.map(cat => {
                                    const isUnlocked = !isRegularUser || purchasedIds.has(cat._id?.toString());
                                    const catName = cat.name?.en || cat.name || 'Category';
                                    const price = cat.price || 10;
                                    const isBuyingThis = purchasingCatId === cat._id;

                                    return (
                                        <CategoryCard key={cat._id} unlocked={isUnlocked}>
                                            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                                    <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: isUnlocked ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {isUnlocked ? (
                                                            <CheckCircleRounded sx={{ color: '#10b981', fontSize: 26 }} />
                                                        ) : (
                                                            <LockRounded sx={{ color: '#64748b', fontSize: 24 }} />
                                                        )}
                                                    </Box>

                                                    <Chip
                                                        size="small"
                                                        label={isUnlocked ? t("dashboard.unlocked", "Unlocked & Active") : `$${price}.00 USD`}
                                                        sx={{
                                                            fontWeight: 800,
                                                            fontSize: '12px',
                                                            backgroundColor: isUnlocked ? '#bbf7d0' : '#fee2e2',
                                                            color: isUnlocked ? '#15803d' : '#991b1b'
                                                        }}
                                                    />
                                                </Box>

                                                <Typography variant="h6" fontWeight={800} color="#0f172a" gutterBottom>
                                                    {catName}
                                                </Typography>

                                                <Typography variant="body2" color="#64748b" mb={3} sx={{ minHeight: 40 }}>
                                                    {cat.meta_description || t("dashboard.categoryNicheDesc", "Publish guides, news, and insightful blogs in this niche.")}
                                                </Typography>

                                                <Box mt="auto">
                                                    {isUnlocked ? (
                                                        <Button
                                                            fullWidth
                                                            variant="outlined"
                                                            color="success"
                                                            startIcon={<AddCircleOutline />}
                                                            onClick={() => navigate(`/create?category_id=${cat._id}&category=${encodeURIComponent(catName)}`)}
                                                            sx={{
                                                                borderRadius: 2,
                                                                textTransform: 'none',
                                                                fontWeight: 700,
                                                                py: 1
                                                            }}
                                                        >
                                                            {t("dashboard.writeInCategory", "Write in this Category")}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            fullWidth
                                                            variant="contained"
                                                            disabled={isBuyingThis}
                                                            startIcon={isBuyingThis ? <CircularProgress size={18} color="inherit" /> : <LockOpenRounded />}
                                                            onClick={() => handleUnlockCategory(cat._id)}
                                                            sx={{
                                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                                color: '#ffffff',
                                                                borderRadius: 2,
                                                                textTransform: 'none',
                                                                fontWeight: 700,
                                                                py: 1,
                                                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                                                '&:hover': {
                                                                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                                                }
                                                            }}
                                                        >
                                                            {isBuyingThis ? t("dashboard.redirecting", "Redirecting...") : t("dashboard.unlockCategory", `Unlock Category ($${price})`)}
                                                        </Button>
                                                    )}
                                                </Box>
                                            </CardContent>
                                        </CategoryCard>
                                    );
                                })}
                            </CategoriesGrid>
                        ) : (
                            <EmptyState>
                                <Typography fontSize={48} mb={1}>🔍</Typography>
                                <Typography variant="h6" fontWeight={700} color="#1a1a2e">
                                    {t("dashboard.noCategoriesFound", "No categories matched your search")}
                                </Typography>
                            </EmptyState>
                        )}
                    </Box>
                )}

                {/* TAB 2: PAYMENT HISTORY */}
                {currentTab === 2 && (
                    <Box>
                        {loading ? (
                            <Box display="flex" justifyContent="center" py={8}>
                                <CircularProgress />
                            </Box>
                        ) : payments.length > 0 ? (
                            <StyledTableContainer component={Paper}>
                                <Table>
                                    <StyledTableHead>
                                        <TableRow>
                                            <TableCell>{t("payments.item", "Item / Purchase")}</TableCell>
                                            <TableCell>{t("payments.type", "Type")}</TableCell>
                                            <TableCell>{t("payments.amount", "Amount")}</TableCell>
                                            <TableCell>{t("payments.date", "Date")}</TableCell>
                                            <TableCell>{t("payments.status", "Status")}</TableCell>
                                            <TableCell>{t("payments.reference", "Reference ID")}</TableCell>
                                        </TableRow>
                                    </StyledTableHead>
                                    <TableBody>
                                        {payments.map((payment) => {
                                            const isCategory = payment.paymentType === 'category_purchase' || (!payment.postId && payment.categoryId);
                                            const categoryName = payment.categoryId?.name?.en || payment.categoryId?.name || (typeof payment.categoryId === 'string' ? payment.categoryId : 'Category License');
                                            const postTitle =
                                                payment.postId?.title?.en ||
                                                payment.postId?.title ||
                                                t("payments.deletedPost", "Deleted Post");
                                            const isPostDeleted = !payment.postId && !isCategory;
                                            const refId = payment.stripePaymentIntentId || payment.stripeSessionId || "N/A";

                                            return (
                                                <StyledTableRow key={payment._id}>
                                                    <TableCell>
                                                        {isCategory ? (
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Typography fontWeight={700} color="#0f172a">
                                                                    📁 {categoryName}
                                                                </Typography>
                                                            </Box>
                                                        ) : isPostDeleted ? (
                                                            <Typography color="textSecondary" variant="body2" sx={{ fontStyle: "italic" }}>
                                                                {postTitle}
                                                            </Typography>
                                                        ) : (
                                                            <Typography
                                                                fontWeight={700}
                                                                color="#1a1a2e"
                                                                sx={{ cursor: 'pointer', '&:hover': { color: '#e94560', textDecoration: 'underline' } }}
                                                                onClick={() => navigate(`/blog/${payment.postId._id || payment.postId}`)}
                                                            >
                                                                {postTitle} <Launch sx={{ fontSize: 13, verticalAlign: 'middle' }} />
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={isCategory ? t("payments.categoryLicense", "Category License") : t("payments.blogUpgrade", "Blog Upgrade")}
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontSize: '11px',
                                                                backgroundColor: isCategory ? '#e0e7ff' : '#fef3c7',
                                                                color: isCategory ? '#4338ca' : '#b45309',
                                                                border: `1px solid ${isCategory ? '#c7d2fe' : '#fde68a'}`
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>
                                                        ${payment.amount?.toFixed(2)} {(payment.currency || "usd").toUpperCase()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {payment.createdAt
                                                            ? new Date(payment.createdAt).toLocaleDateString(undefined, {
                                                                  year: "numeric",
                                                                  month: "short",
                                                                  day: "numeric",
                                                                  hour: "2-digit",
                                                                  minute: "2-digit",
                                                              })
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusChip
                                                            status={payment.status}
                                                            label={payment.status?.toUpperCase()}
                                                            icon={
                                                                payment.status === "success" ? (
                                                                    <CheckCircleRounded sx={{ fontSize: "15px !important", color: "inherit" }} />
                                                                ) : payment.status === "pending" ? (
                                                                    <HourglassEmptyRounded sx={{ fontSize: "15px !important", color: "inherit" }} />
                                                                ) : (
                                                                    <CancelRounded sx={{ fontSize: "15px !important", color: "inherit" }} />
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontFamily: 'monospace',
                                                                    background: '#f1f5f9',
                                                                    px: 1,
                                                                    py: 0.5,
                                                                    borderRadius: 1,
                                                                    fontSize: '12px',
                                                                    maxWidth: 160,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                {refId}
                                                            </Typography>
                                                            {refId !== "N/A" && (
                                                                <Tooltip title={t("payments.copy", "Copy ID")}>
                                                                    <IconButton size="small" onClick={() => handleCopy(refId)}>
                                                                        <ContentCopy sx={{ fontSize: 14 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </StyledTableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </StyledTableContainer>
                        ) : (
                            <EmptyState>
                                <Typography fontSize={54} mb={1}>💳</Typography>
                                <Typography variant="h5" fontWeight={700} color="#1a1a2e" gutterBottom>
                                    {t("payments.empty.title", "No transaction records found")}
                                </Typography>
                                <Typography color="#64748b" mb={3} maxWidth={500} mx="auto">
                                    {t("payments.empty.subtitle", "When you upgrade any of your blog posts or unlock category licenses using Stripe, your transaction receipts and status will appear here.")}
                                </Typography>
                            </EmptyState>
                        )}
                    </Box>
                )}
            </Container>
        </PublicLayout>
    );
};

export default Dashboard;
