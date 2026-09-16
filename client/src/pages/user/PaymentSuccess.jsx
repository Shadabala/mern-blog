import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Typography, Box, styled, CircularProgress, Container } from "@mui/material";
import { CheckCircleOutline, ErrorOutline } from "@mui/icons-material";
import { API } from "../../service/api";
import { toast } from "../../utils/toast";
import { useTranslation } from "../../i18n/i18n";
import PublicLayout from "../../layouts/PublicLayout";

const PageWrapper = styled(Box)`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 75vh;
    padding: 60px 20px;
    background: #f8fafc;
`;

const ContentCard = styled(Box)`
    max-width: 520px;
    width: 100%;
    padding: 48px 40px;
    border-radius: 24px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.06);
    background: #ffffff;
    text-align: center;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
`;

const IconWrapper = styled(Box)(({ status }) => ({
    width: "88px",
    height: "88px",
    margin: "0 auto 24px",
    background:
        status === "success"
            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
            : status === "error"
            ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
            : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow:
        status === "success"
            ? "0 10px 25px rgba(16, 185, 129, 0.35)"
            : status === "error"
            ? "0 10px 25px rgba(239, 68, 68, 0.35)"
            : "0 10px 25px rgba(59, 130, 246, 0.35)",
}));

const ActionButton = styled(Box)`
    padding: 12px 32px;
    background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
    color: #ffffff;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    display: inline-block;
    transition: all 0.2s ease;
    margin-top: 20px;
    box-shadow: 0 4px 14px rgba(26, 26, 46, 0.25);

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(26, 26, 46, 0.35);
    }
`;

const PaymentSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [message, setMessage] = useState(t("payment.verifying", "Verifying your payment with Stripe, please wait..."));

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sessionId = params.get("session_id");

        if (!sessionId) {
            setStatus("error");
            setMessage(t("payment.missingSession", "Invalid verification URL. Session ID is missing."));
            toast.error("Payment verification failed: session_id is missing");
            return;
        }

        const verifyPayment = async () => {
            try {
                const response = await API.verifyPaymentSuccess({ session_id: sessionId });

                if (response.isSuccess && response.data?.success) {
                    setStatus("success");
                    setMessage(response.data.message || t("payment.successMsg", "Your blog post has been successfully upgraded to Premium!"));
                    toast.success(t("payment.upgradedToast", "Payment confirmed! Blog upgraded to Premium."));
                } else {
                    setStatus("error");
                    setMessage(response.data?.message || t("payment.unverifiedMsg", "We could not verify your payment. Please contact support."));
                    toast.error(response.data?.message || "Payment verification could not be confirmed.");
                }
            } catch (err) {
                console.error("Verification error:", err);
                setStatus("error");
                setMessage(t("payment.errorMsg", "An unexpected error occurred while verifying your payment."));
                toast.error("An unexpected error occurred while verifying payment.");
            }
        };

        verifyPayment();

        // Redirect to dashboard after 5 seconds
        const timer = setTimeout(() => {
            navigate("/dashboard");
        }, 5500);

        return () => clearTimeout(timer);
    }, [location, navigate, t]);

    return (
        <PublicLayout>
            <PageWrapper>
                <Container maxWidth="sm" sx={{ display: "flex", justifyContent: "center" }}>
                    <ContentCard>
                        <IconWrapper status={status}>
                            {status === "verifying" && <CircularProgress size={40} sx={{ color: "#ffffff" }} />}
                            {status === "success" && <CheckCircleOutline sx={{ fontSize: 52, color: "#ffffff" }} />}
                            {status === "error" && <ErrorOutline sx={{ fontSize: 52, color: "#ffffff" }} />}
                        </IconWrapper>

                        <Typography variant="h4" fontWeight={800} color="#1a1a2e" mb={2}>
                            {status === "verifying"
                                ? t("payment.processing", "Processing Payment...")
                                : status === "success"
                                ? t("payment.successTitle", "Payment Successful!")
                                : t("payment.failedTitle", "Verification Failed")}
                        </Typography>

                        <Typography variant="body1" color="#64748b" mb={3} sx={{ minHeight: "44px", px: 1, lineHeight: 1.6 }}>
                            {message}
                        </Typography>

                        {status !== "verifying" && (
                            <ActionButton onClick={() => navigate("/dashboard")}>
                                {t("payment.goToDashboard", "Go to Dashboard")}
                            </ActionButton>
                        )}
                    </ContentCard>
                </Container>
            </PageWrapper>
        </PublicLayout>
    );
};

export default PaymentSuccess;
