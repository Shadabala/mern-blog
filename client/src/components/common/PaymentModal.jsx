import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button, IconButton, CircularProgress,
    Alert, TextField, Stack, Card, CardContent, Divider, Chip
} from '@mui/material';
import {
    Close as CloseIcon,
    CreditCard as CardIcon,
    AccountBalance as BankIcon,
    Security as SecurityIcon,
    CheckCircle as CheckCircleIcon,
    LockOutlined as LockIcon
} from '@mui/icons-material';
import axios from '../../api/axios';
import { toast } from '../../utils/toast';
import { useLanguage } from '../../context/LanguageContext';

const PaymentModal = ({ open, onClose, item, onSuccess }) => {
    const { t } = useLanguage();
    const [loadingMethods, setLoadingMethods] = useState(true);
    const [methods, setMethods] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Manual payment input
    const [transactionId, setTransactionId] = useState('');
    const [manualNotes, setManualNotes] = useState('');

    // Fetch active payment methods when modal opens
    useEffect(() => {
        if (!open) return;

        const loadActiveMethods = async () => {
            try {
                setLoadingMethods(true);
                setErrorMsg('');
                const res = await axios.get('/api/payment/active-methods');
                if (res.data && res.data.success) {
                    const activeList = res.data.methods || [];
                    setMethods(activeList);
                    if (activeList.length > 0) {
                        setSelectedMethod(activeList[0].id);
                    }
                } else {
                    setMethods([]);
                }
            } catch (err) {
                console.error('Failed to load active payment methods:', err);
                setErrorMsg(t('Failed to load payment gateways'));
            } finally {
                setLoadingMethods(false);
            }
        };

        loadActiveMethods();
        setTransactionId('');
        setManualNotes('');
    }, [open, t]);

    if (!item) return null;

    const formattedPrice = Number(item.price || 10).toFixed(2);
    const isCategory = item.type === 'category_purchase';

    // Handle Payment Submission
    const handleProceedPayment = async () => {
        if (!selectedMethod) {
            toast.warning(t('Please select a payment method'));
            return;
        }

        setProcessing(true);
        setErrorMsg('');

        try {
            const payload = {
                paymentMethod: selectedMethod,
                postId: !isCategory ? item.id : undefined,
                categoryId: isCategory ? item.id : undefined,
                transactionId: transactionId.trim(),
                manualDetails: manualNotes.trim()
            };

            // 1. Stripe Payment
            if (selectedMethod === 'stripe') {
                toast.info(t('Redirecting to Stripe checkout...'));
                const res = await axios.post('/api/payment/create-checkout', payload);
                if (res.data?.success && res.data?.url) {
                    window.location.href = res.data.url;
                    return;
                }
                throw new Error(res.data?.msg || 'Failed to create Stripe session');
            }

            // 2. Razorpay Payment
            if (selectedMethod === 'razorpay') {
                const res = await axios.post('/api/payment/create-checkout', payload);
                if (!res.data?.success || !res.data?.orderId) {
                    throw new Error(res.data?.msg || 'Failed to initialize Razorpay');
                }

                // Load Razorpay script if not loaded
                if (!window.Razorpay) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                        script.onload = resolve;
                        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
                        document.body.appendChild(script);
                    });
                }

                const options = {
                    key: res.data.key,
                    amount: res.data.amount,
                    currency: res.data.currency || 'INR',
                    name: 'MERN Blog',
                    description: item.title,
                    order_id: res.data.orderId,
                    handler: async (response) => {
                        try {
                            const verifyRes = await axios.post('/api/payment/verify-razorpay', {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            if (verifyRes.data?.success) {
                                toast.success(verifyRes.data.message || t('Payment successful!'));
                                onSuccess?.(verifyRes.data);
                                onClose();
                            } else {
                                toast.error(verifyRes.data?.msg || t('Payment verification failed'));
                            }
                        } catch (vErr) {
                            console.error('Razorpay verification error:', vErr);
                            toast.error(t('Error confirming Razorpay payment'));
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            setProcessing(false);
                        }
                    }
                };

                const rzpInstance = new window.Razorpay(options);
                rzpInstance.open();
                return;
            }

            // 3. Manual / Offline Payment
            if (selectedMethod === 'manual') {
                if (!transactionId.trim()) {
                    setErrorMsg(t('Please enter your payment Transaction/Reference ID'));
                    setProcessing(false);
                    return;
                }

                const res = await axios.post('/api/payment/create-checkout', payload);
                if (res.data?.success) {
                    toast.success(res.data.message || t('Payment submitted for admin review!'));
                    onSuccess?.(res.data);
                    onClose();
                    return;
                }
                throw new Error(res.data?.msg || 'Failed to submit manual payment');
            }

            // 4. PayPal Payment
            if (selectedMethod === 'paypal') {
                const res = await axios.post('/api/payment/create-checkout', payload);
                if (res.data?.success && res.data?.url) {
                    window.location.href = res.data.url;
                    return;
                }
                toast.info(t('PayPal order recorded. Completing transaction...'));
                onSuccess?.(res.data);
                onClose();
                return;
            }

        } catch (err) {
            console.error('Payment process error:', err);
            const msg = err.response?.data?.msg || err.message || t('Payment processing failed');
            setErrorMsg(msg);
            toast.error(msg);
        } finally {
            if (selectedMethod !== 'stripe' && selectedMethod !== 'razorpay') {
                setProcessing(false);
            }
        }
    };

    const currentMethodObj = methods.find(m => m.id === selectedMethod);

    return (
        <Dialog
            open={open}
            onClose={processing ? undefined : onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 4, overflow: 'hidden' }
            }}
        >
            {/* Header */}
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, pt: 2.5, px: 3 }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <LockIcon sx={{ color: '#10b981', fontSize: 22 }} />
                    <Typography variant="h6" fontWeight={700} color="#1e293b">
                        {t('Secure Checkout')}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} disabled={processing}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, pt: 1, pb: 2 }}>
                {/* Item Summary Card */}
                <Card elevation={0} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 3, mb: 3 }}>
                    <CardContent sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Chip
                                    label={isCategory ? t('Category License') : t('Premium Upgrade')}
                                    size="small"
                                    sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 700, mb: 0.5, fontSize: '0.7rem' }}
                                />
                                <Typography variant="subtitle1" fontWeight={700} color="#0f172a" noWrap sx={{ maxWidth: 320 }}>
                                    {item.title}
                                </Typography>
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="caption" color="textSecondary" display="block">
                                    {t('Total Price')}
                                </Typography>
                                <Typography variant="h5" fontWeight={800} color="#10b981">
                                    ${formattedPrice}
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {errorMsg && (
                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                        {errorMsg}
                    </Alert>
                )}

                {/* Payment Methods Section */}
                {loadingMethods ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={5}>
                        <CircularProgress size={32} />
                    </Box>
                ) : methods.length === 0 ? (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        {t('No payment methods are currently active. Please contact the site administrator.')}
                    </Alert>
                ) : (
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#475569" mb={1.5}>
                            {t('Select Payment Method')} ({methods.length} {t('available')})
                        </Typography>

                        <Stack spacing={1.5} mb={3}>
                            {methods.map((method) => {
                                const isSelected = selectedMethod === method.id;
                                return (
                                    <Box
                                        key={method.id}
                                        onClick={() => !processing && setSelectedMethod(method.id)}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                                            bgcolor: isSelected ? '#eff6ff' : '#ffffff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.15s ease',
                                            '&:hover': {
                                                borderColor: isSelected ? '#3b82f6' : '#cbd5e1'
                                            }
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 2,
                                                    bgcolor: isSelected ? '#dbeafe' : '#f1f5f9',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {method.id === 'manual' ? (
                                                    <BankIcon sx={{ color: '#0284c7' }} />
                                                ) : (
                                                    <CardIcon sx={{ color: isSelected ? '#2563eb' : '#64748b' }} />
                                                )}
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700} color="#1e293b">
                                                    {method.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {method.description}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        {isSelected && (
                                            <CheckCircleIcon sx={{ color: '#3b82f6', fontSize: 22 }} />
                                        )}
                                    </Box>
                                );
                            })}
                        </Stack>

                        {/* Special Instructions for Manual / Bank Transfer */}
                        {selectedMethod === 'manual' && currentMethodObj && (
                            <Box sx={{ p: 2.5, bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 3, mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={700} color="#b45309" mb={1}>
                                    {t('Payment Instructions')}
                                </Typography>
                                <Typography variant="body2" color="#78350f" sx={{ whiteSpace: 'pre-line', mb: 2, fontSize: '0.85rem' }}>
                                    {currentMethodObj.instruction}
                                </Typography>

                                <Stack spacing={1.5}>
                                    <TextField
                                        size="small"
                                        label={t('Transaction / Reference ID')}
                                        placeholder="e.g. TXN12345678 or Bank Ref No."
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        fullWidth
                                        required
                                    />
                                    <TextField
                                        size="small"
                                        label={t('Additional Notes (Optional)')}
                                        placeholder="Sender bank name, date of transfer, etc."
                                        value={manualNotes}
                                        onChange={(e) => setManualNotes(e.target.value)}
                                        fullWidth
                                        multiline
                                        rows={2}
                                    />
                                </Stack>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" gap={0.5} color="#64748b">
                    <SecurityIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption">
                        {t('256-bit Encrypted')}
                    </Typography>
                </Box>
                <Box display="flex" gap={1.5}>
                    <Button
                        onClick={onClose}
                        disabled={processing}
                        sx={{ textTransform: 'none', color: '#64748b' }}
                    >
                        {t('Cancel')}
                    </Button>
                    <Button
                        onClick={handleProceedPayment}
                        variant="contained"
                        disabled={processing || methods.length === 0}
                        startIcon={processing ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{
                            bgcolor: '#10b981',
                            '&:hover': { bgcolor: '#059669' },
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            borderRadius: 2
                        }}
                    >
                        {processing
                            ? t('Processing...')
                            : selectedMethod === 'manual'
                                ? t('Submit Payment')
                                : `${t('Pay')} $${formattedPrice}`}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentModal;
