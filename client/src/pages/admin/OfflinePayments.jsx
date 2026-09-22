import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    TextField,
    Chip,
    Avatar,
    Stack,
    CircularProgress,
    Alert,
    Tooltip,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
    Grid,
    InputAdornment
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    ContentCopy as CopyIcon,
    ReceiptLong as ReceiptIcon,
    AccountBalance as BankIcon,
    CreditCard as StripeIcon,
    CurrencyRupee as RazorpayIcon,
    Payment as PaymentIcon,
    HourglassEmpty as PendingIcon,
    CheckCircleOutline as SuccessIcon,
    HighlightOff as FailedIcon,
    Refresh as RefreshIcon,
    Article as BlogIcon,
    Folder as CategoryIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';
import { confirmAction } from '../../utils/swal';
import {
    fetchAdminPaymentsApi,
    approvePaymentApi,
    rejectPaymentApi
} from '../../api/admin.api';

const OfflinePayments = () => {
    const { t } = useLanguage();
    const location = useLocation();

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0); // 0: Pending Offline, 1: All Offline, 2: All Gateways, 3: Stripe, 4: Razorpay, 5: PayPal
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchQ = params.get('search');
        const postQ = params.get('postId');
        const catQ = params.get('categoryId');
        const methodQ = params.get('method');
        const statusQ = params.get('status');

        if (searchQ) setSearchTerm(searchQ);
        if (statusQ) setStatusFilter(statusQ);

        if (postQ || catQ || searchQ) {
            setActiveTab(2); // Switch to All Gateways tab to show matching records
        } else if (methodQ === 'manual') {
            setActiveTab(1);
        } else if (methodQ === 'stripe') {
            setActiveTab(3);
        } else if (methodQ === 'razorpay') {
            setActiveTab(4);
        } else if (methodQ === 'paypal') {
            setActiveTab(5);
        }
    }, [location.search]);

    // Dialog state for viewing receipt / full details
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    // Reject reason dialog
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [paymentToReject, setPaymentToReject] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectSubmitting, setRejectSubmitting] = useState(false);

    // Action processing ID
    const [actionId, setActionId] = useState(null);

    const loadPayments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAdminPaymentsApi();
            setPayments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load admin payments:', err);
            toast.error(t('Failed to load payment transactions', 'Failed to load payment transactions'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadPayments();
    }, [loadPayments]);

    // Copy to clipboard helper
    const handleCopy = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(t('Copied to clipboard!', 'Copied to clipboard!'));
    };

    // Filter payments based on activeTab, search, status
    const filteredPayments = useMemo(() => {
        return payments.filter(payment => {
            // Tab filter
            if (activeTab === 0) {
                // Pending Offline Verifications
                if (payment.paymentMethod !== 'manual' || payment.status !== 'pending') return false;
            } else if (activeTab === 1) {
                // All Offline / Manual
                if (payment.paymentMethod !== 'manual') return false;
            } else if (activeTab === 3) {
                if (payment.paymentMethod !== 'stripe') return false;
            } else if (activeTab === 4) {
                if (payment.paymentMethod !== 'razorpay') return false;
            } else if (activeTab === 5) {
                if (payment.paymentMethod !== 'paypal') return false;
            }

            // Status filter
            if (statusFilter !== 'all' && payment.status !== statusFilter) {
                return false;
            }

            // Search filter
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const uName = (payment.username || '').toLowerCase();
                const cEmail = (payment.customerEmail || payment.userId?.email || '').toLowerCase();
                const txn = (payment.transactionId || payment.stripeSessionId || payment.razorpayPaymentId || '').toLowerCase();
                const notes = (payment.manualDetails || '').toLowerCase();
                const itemTitle = (payment.postId?.title || payment.categoryId?.name || '').toLowerCase();

                if (!uName.includes(term) && !cEmail.includes(term) && !txn.includes(term) && !notes.includes(term) && !itemTitle.includes(term)) {
                    return false;
                }
            }

            return true;
        });
    }, [payments, activeTab, statusFilter, searchTerm]);

    // Metrics for summary cards
    const metrics = useMemo(() => {
        const total = payments.length;
        const pendingManual = payments.filter(p => p.paymentMethod === 'manual' && p.status === 'pending').length;
        const successCount = payments.filter(p => p.status === 'success').length;
        const totalRevenue = payments
            .filter(p => p.status === 'success')
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        return { total, pendingManual, successCount, totalRevenue };
    }, [payments]);

    // Handle Confirm / Approve
    const handleApprove = async (payment) => {
        const itemTitle = payment.categoryId?.name?.en || payment.categoryId?.name || payment.postId?.title?.en || payment.postId?.title || 'Service';
        const userName = payment.userId?.name || payment.username || 'User';

        const confirmed = await confirmAction({
            title: t('Approve Offline Payment?', 'Approve Offline Payment?'),
            text: `${t('Confirm receiving', 'Confirm receiving')} $${payment.amount} ${t('from', 'from')} ${userName}? ${t('This will immediately grant access to', 'This will immediately grant access to')} "${itemTitle}".`,
            confirmButtonText: t('Yes, Approve & Grant Access', 'Yes, Approve & Grant Access'),
            confirmButtonColor: '#10b981',
            icon: 'question'
        });

        if (!confirmed) return;

        setActionId(payment._id);
        try {
            const res = await approvePaymentApi(payment._id);
            toast.success(res.message || t('Payment approved successfully! Access granted.', 'Payment approved successfully! Access granted.'));
            loadPayments();
        } catch (err) {
            console.error('Approval error:', err);
            toast.error(err.response?.data?.message || t('Failed to approve payment', 'Failed to approve payment'));
        } finally {
            setActionId(null);
        }
    };

    // Open Reject Dialog
    const handleOpenReject = (payment) => {
        setPaymentToReject(payment);
        setRejectReason('');
        setRejectDialogOpen(true);
    };

    // Submit Reject
    const handleSubmitReject = async () => {
        if (!paymentToReject) return;
        setRejectSubmitting(true);
        try {
            const res = await rejectPaymentApi(paymentToReject._id, rejectReason);
            toast.info(res.message || t('Payment rejected.', 'Payment rejected.'));
            setRejectDialogOpen(false);
            setPaymentToReject(null);
            loadPayments();
        } catch (err) {
            console.error('Reject error:', err);
            toast.error(err.response?.data?.message || t('Failed to reject payment', 'Failed to reject payment'));
        } finally {
            setRejectSubmitting(false);
        }
    };

    // Method badge renderer
    const renderMethodBadge = (method) => {
        switch (method) {
            case 'manual':
                return (
                    <Chip
                        icon={<BankIcon sx={{ fontSize: '16px !important' }} />}
                        label={t('Offline Bank Transfer', 'Offline Bank Transfer')}
                        size="small"
                        sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, border: '1px solid #fde68a' }}
                    />
                );
            case 'stripe':
                return (
                    <Chip
                        icon={<StripeIcon sx={{ fontSize: '16px !important' }} />}
                        label="Stripe"
                        size="small"
                        sx={{ bgcolor: '#ede9fe', color: '#6d28d9', fontWeight: 700, border: '1px solid #ddd6fe' }}
                    />
                );
            case 'razorpay':
                return (
                    <Chip
                        icon={<RazorpayIcon sx={{ fontSize: '16px !important' }} />}
                        label="Razorpay"
                        size="small"
                        sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700, border: '1px solid #bae6fd' }}
                    />
                );
            case 'paypal':
                return (
                    <Chip
                        icon={<PaymentIcon sx={{ fontSize: '16px !important' }} />}
                        label="PayPal"
                        size="small"
                        sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700, border: '1px solid #bfdbfe' }}
                    />
                );
            default:
                return <Chip label={method || 'Unknown'} size="small" />;
        }
    };

    // Status badge renderer
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <Chip
                        icon={<PendingIcon sx={{ fontSize: '16px !important' }} />}
                        label={t('Pending Verification', 'Pending Verification')}
                        size="small"
                        sx={{ bgcolor: '#fffbeb', color: '#b45309', fontWeight: 700, border: '1px solid #fde68a' }}
                    />
                );
            case 'success':
                return (
                    <Chip
                        icon={<SuccessIcon sx={{ fontSize: '16px !important' }} />}
                        label={t('Approved / Confirmed', 'Approved / Confirmed')}
                        size="small"
                        sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 700, border: '1px solid #a7f3d0' }}
                    />
                );
            case 'failed':
                return (
                    <Chip
                        icon={<FailedIcon sx={{ fontSize: '16px !important' }} />}
                        label={t('Denied / Failed', 'Denied / Failed')}
                        size="small"
                        sx={{ bgcolor: '#fef2f2', color: '#b91c1c', fontWeight: 700, border: '1px solid #fecaca' }}
                    />
                );
            default:
                return <Chip label={status || 'Unknown'} size="small" />;
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight={800} color="#0f172a">
                        {t('Payment & Offline Verifications', 'Payment & Offline Verifications')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {t('Verify, confirm or deny manual offline payments, inspect bank references, and audit transactions.', 'Verify, confirm or deny manual offline payments, inspect bank references, and audit transactions.')}
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadPayments}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                >
                    {t('Refresh', 'Refresh')}
                </Button>
            </Box>

            {/* Stat Summary Cards */}
            <Grid container spacing={2.5} mb={3.5}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#ffffff' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" fontWeight={700} color="textSecondary" textTransform="uppercase">
                                {t('Pending Verifications', 'Pending Verifications')}
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                <Typography variant="h4" fontWeight={800} color="#d97706">
                                    {metrics.pendingManual}
                                </Typography>
                                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                                    <PendingIcon />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#ffffff' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" fontWeight={700} color="textSecondary" textTransform="uppercase">
                                {t('Total Transactions', 'Total Transactions')}
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                <Typography variant="h4" fontWeight={800} color="#1e293b">
                                    {metrics.total}
                                </Typography>
                                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                    <ReceiptIcon />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#ffffff' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" fontWeight={700} color="textSecondary" textTransform="uppercase">
                                {t('Approved Payments', 'Approved Payments')}
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                <Typography variant="h4" fontWeight={800} color="#10b981">
                                    {metrics.successCount}
                                </Typography>
                                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                                    <SuccessIcon />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#ffffff' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" fontWeight={700} color="textSecondary" textTransform="uppercase">
                                {t('Total Revenue Collected', 'Total Revenue Collected')}
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                <Typography variant="h4" fontWeight={800} color="#3b82f6">
                                    ${metrics.totalRevenue.toFixed(2)}
                                </Typography>
                                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                                    <PaymentIcon />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filter Tabs & Search Bar */}
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', bgcolor: '#ffffff', mb: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: '#f1f5f9', px: 2, pt: 1 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, val) => setActiveTab(val)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab
                            label={
                                <Box display="flex" alignItems="center" gap={1}>
                                    <span>{t('Pending Offline', 'Pending Offline')}</span>
                                    {metrics.pendingManual > 0 && (
                                        <Chip
                                            label={metrics.pendingManual}
                                            size="small"
                                            sx={{ bgcolor: '#f59e0b', color: '#ffffff', fontWeight: 800, height: 20, fontSize: '0.7rem' }}
                                        />
                                    )}
                                </Box>
                            }
                        />
                        <Tab label={t('All Offline / Manual', 'All Offline / Manual')} />
                        <Tab label={t('All Gateways', 'All Gateways')} />
                        <Tab label="Stripe" />
                        <Tab label="Razorpay" />
                        <Tab label="PayPal" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc' }}>
                    <TextField
                        size="small"
                        placeholder={t('Search user, transaction ID, bank notes...', 'Search user, transaction ID, bank notes...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                                </InputAdornment>
                            )
                        }}
                        sx={{ minWidth: 300, bgcolor: '#ffffff', borderRadius: 2 }}
                    />

                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" fontWeight={700} color="textSecondary">
                            {t('Status:', 'Status:')}
                        </Typography>
                        {['all', 'pending', 'success', 'failed'].map(st => (
                            <Chip
                                key={st}
                                label={st.toUpperCase()}
                                size="small"
                                onClick={() => setStatusFilter(st)}
                                variant={statusFilter === st ? 'filled' : 'outlined'}
                                color={statusFilter === st ? 'primary' : 'default'}
                                sx={{ fontWeight: 700, cursor: 'pointer' }}
                            />
                        ))}
                    </Stack>
                </Box>

                {/* Table Content */}
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569', width: 50 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>{t('User / Customer', 'User / Customer')}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>{t('Item / Purpose', 'Item / Purpose')}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>{t('Amount', 'Amount')}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>{t('Method', 'Method')}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>{t('Transaction Ref', 'Transaction Ref')}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>{t('Status', 'Status')}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>{t('Date', 'Date')}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>{t('Actions', 'Actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPayments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                                            <Typography color="textSecondary" fontWeight={600}>
                                                {t('No payment records found', 'No payment records found')}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPayments.map((payment, idx) => {
                                        const isCategory = payment.paymentType === 'category_purchase' || (!payment.postId && payment.categoryId);
                                        const itemName = isCategory
                                            ? (payment.categoryId?.name?.en || payment.categoryId?.name || 'Category License')
                                            : (payment.postId?.title?.en || payment.postId?.title || 'Blog Post');

                                        const refId = payment.transactionId || payment.razorpayPaymentId || payment.stripeSessionId || payment.paypalOrderId || '—';
                                        const userObj = payment.userId || {};
                                        const displayName = userObj.name || payment.username || 'User';
                                        const displayEmail = userObj.email || payment.customerEmail || '—';

                                        const isManualPending = payment.paymentMethod === 'manual' && payment.status === 'pending';
                                        const isProcessing = actionId === payment._id;

                                        return (
                                            <TableRow key={payment._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</TableCell>

                                                {/* Customer */}
                                                <TableCell>
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Avatar
                                                            src={userObj.avatar}
                                                            sx={{ width: 36, height: 36, bgcolor: '#e2e8f0', color: '#475569', fontSize: 14, fontWeight: 700 }}
                                                        >
                                                            {displayName.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={700} color="#1e293b">
                                                                {displayName}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary" display="block">
                                                                {displayEmail}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>

                                                {/* Item / Purpose */}
                                                <TableCell>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        {isCategory ? (
                                                            <CategoryIcon sx={{ color: '#10b981', fontSize: 20 }} />
                                                        ) : (
                                                            <BlogIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                                                        )}
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600} color="#1e293b" noWrap sx={{ maxWidth: 220 }} title={itemName}>
                                                                {itemName}
                                                            </Typography>
                                                            <Typography variant="caption" color={isCategory ? 'success.main' : 'primary.main'} fontWeight={700}>
                                                                {isCategory ? t('Category Access', 'Category Access') : t('Premium Upgrade', 'Premium Upgrade')}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>

                                                {/* Amount */}
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={800} color="#0f172a">
                                                        ${(Number(payment.amount) || 0).toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary" textTransform="uppercase">
                                                        {payment.currency || 'USD'}
                                                    </Typography>
                                                </TableCell>

                                                {/* Method */}
                                                <TableCell>
                                                    {renderMethodBadge(payment.paymentMethod)}
                                                </TableCell>

                                                {/* Ref */}
                                                <TableCell>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Typography variant="caption" fontFamily="monospace" sx={{ bgcolor: '#f1f5f9', px: 1, py: 0.3, borderRadius: 1, maxWidth: 160 }} noWrap title={refId}>
                                                            {refId}
                                                        </Typography>
                                                        {refId !== '—' && (
                                                            <Tooltip title={t('Copy Reference ID', 'Copy Reference ID')}>
                                                                <IconButton size="small" onClick={() => handleCopy(refId)}>
                                                                    <CopyIcon sx={{ fontSize: 14, color: '#64748b' }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell>
                                                    {renderStatusBadge(payment.status)}
                                                </TableCell>

                                                {/* Date */}
                                                <TableCell>
                                                    <Typography variant="caption" color="textSecondary" display="block">
                                                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '—'}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary" fontSize="0.7rem">
                                                        {payment.createdAt ? new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </Typography>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        {/* View Details Modal */}
                                                        <Tooltip title={t('View Full Details & Bank Info', 'View Full Details & Bank Info')}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setSelectedPayment(payment);
                                                                    setDetailDialogOpen(true);
                                                                }}
                                                                sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                                                            >
                                                                <ViewIcon fontSize="small" sx={{ color: '#475569' }} />
                                                            </IconButton>
                                                        </Tooltip>

                                                        {/* Confirm / Approve Action */}
                                                        {isManualPending && (
                                                            <Tooltip title={t('Approve Payment & Grant Access', 'Approve Payment & Grant Access')}>
                                                                <span>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="success"
                                                                        disabled={isProcessing}
                                                                        onClick={() => handleApprove(payment)}
                                                                        sx={{ bgcolor: '#ecfdf5', '&:hover': { bgcolor: '#d1fae5' } }}
                                                                    >
                                                                        {isProcessing ? <CircularProgress size={16} /> : <ApproveIcon fontSize="small" />}
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        )}

                                                        {/* Deny / Reject Action */}
                                                        {isManualPending && (
                                                            <Tooltip title={t('Deny / Reject Payment', 'Deny / Reject Payment')}>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    disabled={isProcessing}
                                                                    onClick={() => handleOpenReject(payment)}
                                                                    sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                                                >
                                                                    <RejectIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Details Modal */}
            <Dialog
                open={detailDialogOpen}
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                        {t('Payment Transaction Details', 'Payment Transaction Details')}
                    </Typography>
                    {selectedPayment && renderStatusBadge(selectedPayment.status)}
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {selectedPayment && (
                        <Stack spacing={2.5}>
                            {/* Summary Item */}
                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" color="textSecondary" fontWeight={700} textTransform="uppercase">
                                    {t('Purchased Item', 'Purchased Item')}
                                </Typography>
                                <Typography variant="subtitle1" fontWeight={700} color="#1e293b" mt={0.5}>
                                    {selectedPayment.categoryId?.name?.en || selectedPayment.categoryId?.name || selectedPayment.postId?.title?.en || selectedPayment.postId?.title || 'Service'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {selectedPayment.paymentType === 'category_purchase' ? t('Category Access License', 'Category Access License') : t('Blog Post Premium Upgrade', 'Blog Post Premium Upgrade')}
                                </Typography>
                            </Box>

                            {/* Customer & Payment Meta */}
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">{t('Customer Name', 'Customer Name')}</Typography>
                                    <Typography variant="body2" fontWeight={600}>{selectedPayment.userId?.name || selectedPayment.username}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">{t('Customer Email', 'Customer Email')}</Typography>
                                    <Typography variant="body2" fontWeight={600}>{selectedPayment.userId?.email || selectedPayment.customerEmail || '—'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">{t('Amount Paid', 'Amount Paid')}</Typography>
                                    <Typography variant="body2" fontWeight={800} color="#10b981">
                                        ${Number(selectedPayment.amount).toFixed(2)} {selectedPayment.currency?.toUpperCase()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">{t('Payment Method', 'Payment Method')}</Typography>
                                    <Box mt={0.5}>{renderMethodBadge(selectedPayment.paymentMethod)}</Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="textSecondary">{t('Transaction Reference', 'Transaction Reference')}</Typography>
                                    <Typography variant="body2" fontFamily="monospace" sx={{ bgcolor: '#f1f5f9', p: 1, borderRadius: 1, wordBreak: 'break-all' }}>
                                        {selectedPayment.transactionId || selectedPayment.razorpayPaymentId || selectedPayment.stripeSessionId || selectedPayment.paypalOrderId || '—'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {/* Offline / Bank Details submitted by user */}
                            {selectedPayment.paymentMethod === 'manual' && (
                                <Box sx={{ p: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={700} color="#92400e" mb={1}>
                                        {t('User-Submitted Bank / Transfer Information', 'User-Submitted Bank / Transfer Information')}
                                    </Typography>
                                    <Typography variant="body2" color="#78350f" sx={{ whiteSpace: 'pre-line', fontSize: '0.9rem' }}>
                                        {selectedPayment.manualDetails || t('No additional notes provided by customer.', 'No additional notes provided by customer.')}
                                    </Typography>
                                </Box>
                            )}

                            {/* Failure reason if rejected */}
                            {selectedPayment.failureReason && (
                                <Box sx={{ p: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={700} color="#991b1b" mb={0.5}>
                                        {t('Rejection Reason / Failure Info', 'Rejection Reason / Failure Info')}
                                    </Typography>
                                    <Typography variant="body2" color="#b91c1c">
                                        {selectedPayment.failureReason}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    {selectedPayment?.paymentMethod === 'manual' && selectedPayment?.status === 'pending' && (
                        <>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<ApproveIcon />}
                                onClick={() => {
                                    setDetailDialogOpen(false);
                                    handleApprove(selectedPayment);
                                }}
                                sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                                {t('Confirm & Approve', 'Confirm & Approve')}
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<RejectIcon />}
                                onClick={() => {
                                    setDetailDialogOpen(false);
                                    handleOpenReject(selectedPayment);
                                }}
                                sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                                {t('Deny / Reject', 'Deny / Reject')}
                            </Button>
                        </>
                    )}
                    <Button onClick={() => setDetailDialogOpen(false)} sx={{ textTransform: 'none' }}>
                        {t('Close', 'Close')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reject Reason Dialog */}
            <Dialog
                open={rejectDialogOpen}
                onClose={() => !rejectSubmitting && setRejectDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: '#b91c1c' }}>
                    {t('Reject / Deny Payment', 'Reject / Deny Payment')}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" mb={2}>
                        {t('Please enter an optional reason for denying this payment. The user will be notified of this reason.', 'Please enter an optional reason for denying this payment. The user will be notified of this reason.')}
                    </Typography>
                    <TextField
                        autoFocus
                        label={t('Rejection Reason', 'Rejection Reason')}
                        placeholder={t('e.g. Bank transfer not received, invalid transaction ID', 'e.g. Bank transfer not received, invalid transaction ID')}
                        fullWidth
                        multiline
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setRejectDialogOpen(false)}
                        disabled={rejectSubmitting}
                        sx={{ textTransform: 'none' }}
                    >
                        {t('Cancel', 'Cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleSubmitReject}
                        disabled={rejectSubmitting}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                        {rejectSubmitting ? <CircularProgress size={20} color="inherit" /> : t('Confirm Rejection', 'Confirm Rejection')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OfflinePayments;
