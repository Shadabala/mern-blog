import React, { useEffect, useState } from "react";
import {
    Container,
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    styled,
    Button,
} from "@mui/material";
import {
    PaymentOutlined,
    CheckCircleRounded,
    HourglassEmptyRounded,
    CancelRounded,
    ContentCopy,
    Launch,
    ArrowBack,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { API } from "../../service/api";
import { toast } from "../../utils/toast";
import { useTranslation } from "../../i18n/i18n";
import PublicLayout from "../../layouts/PublicLayout";

const HeaderBox = styled(Box)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    background: #ffffff;
    padding: 24px 32px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);

    @media (max-width: 600px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
        padding: 20px;
    }
`;

const Title = styled(Typography)`
    font-size: 24px;
    font-weight: 800;
    color: #1a1a2e;
    display: flex;
    align-items: center;
    gap: 12px;
`;

const Subtitle = styled(Typography)`
    color: #64748b;
    margin-top: 4px;
    font-size: 14px;
`;

const StyledTableContainer = styled(TableContainer)`
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
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

const PostLink = styled("span")`
    font-weight: 700;
    color: #1a1a2e;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: color 0.2s;
    &:hover {
        color: #e94560;
        text-decoration: underline;
    }
`;

const StatusChip = styled(Chip)(({ status }) => ({
    fontWeight: 700,
    fontSize: "12px",
    borderRadius: "20px",
    padding: "2px 6px",
    backgroundColor:
        status === "success"
            ? "#dcfce7"
            : status === "pending"
            ? "#fef9c3"
            : "#fee2e2",
    color:
        status === "success"
            ? "#15803d"
            : status === "pending"
            ? "#a16207"
            : "#b91c1c",
    border: `1px solid ${
        status === "success"
            ? "#bbf7d0"
            : status === "pending"
            ? "#fef08a"
            : "#fecaca"
    }`,
}));

const CopyText = styled(Typography)`
    font-family: monospace;
    background: #f1f5f9;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 12px;
    color: #475569;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const EmptyState = styled(Box)`
    text-align: center;
    padding: 80px 24px;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
`;

const PaymentHistory = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        const fetchPaymentHistory = async () => {
            try {
                setLoading(true);
                const response = await API.getAllPayments();
                if (response.isSuccess) {
                    const list = response.data || [];
                    setPayments(Array.isArray(list) ? list : []);
                } else {
                    toast.error(response.msg || "Failed to load payment history.");
                }
            } catch (err) {
                console.error("Fetch payments error:", err);
                toast.error("An unexpected error occurred while fetching payment data.");
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentHistory();
    }, []);

    const handleCopy = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(t("payments.copied", "Transaction ID copied to clipboard"));
    };

    return (
        <PublicLayout>
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <HeaderBox>
                    <Box>
                        <Title>
                            <PaymentOutlined sx={{ fontSize: 32, color: "#e94560" }} />
                            {t("payments.title", "Payment & Transaction History")}
                        </Title>
                        <Subtitle>
                            {t("payments.subtitle", "Review all payments made to upgrade your blogs to Premium.")}
                        </Subtitle>
                    </Box>

                    <Button
                        component={RouterLink}
                        to="/dashboard"
                        startIcon={<ArrowBack />}
                        variant="outlined"
                        sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 600,
                            color: "#1a1a2e",
                            borderColor: "#cbd5e1",
                            "&:hover": { borderColor: "#1a1a2e", bgcolor: "#f8fafc" },
                        }}
                    >
                        {t("payments.backToDashboard", "My Dashboard")}
                    </Button>
                </HeaderBox>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={12}>
                        <CircularProgress size={48} sx={{ color: "#1a1a2e" }} />
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
                                                    <PostLink onClick={() => navigate(`/blog/${payment.postId._id || payment.postId}`)}>
                                                        {postTitle} <Launch sx={{ fontSize: 13 }} />
                                                    </PostLink>
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
                                                    <CopyText>{refId}</CopyText>
                                                    {refId !== "N/A" && (
                                                        <Tooltip title={t("payments.copy", "Copy ID")}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleCopy(refId)}
                                                                sx={{ color: "#64748b" }}
                                                            >
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
                            {t("payments.empty.subtitle", "When you upgrade any of your blog posts to Premium using Stripe, your transaction receipts and status will appear here.")}
                        </Typography>
                        <Button
                            component={RouterLink}
                            to="/dashboard"
                            variant="contained"
                            sx={{
                                background: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
                                color: "#ffffff",
                                borderRadius: "10px",
                                px: 3,
                                py: 1.2,
                                textTransform: "none",
                                fontWeight: 700,
                            }}
                        >
                            {t("payments.goToDashboard", "Go to Dashboard")}
                        </Button>
                    </EmptyState>
                )}
            </Container>
        </PublicLayout>
    );
};

export default PaymentHistory;
