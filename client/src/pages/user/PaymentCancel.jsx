import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Typography, Box, styled, Container } from "@mui/material";
import { CancelOutlined } from "@mui/icons-material";
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
`;

const IconWrapper = styled(Box)`
    width: 88px;
    height: 88px;
    margin: 0 auto 24px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 10px 25px rgba(239, 68, 68, 0.35);
`;

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

const PaymentCancel = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sessionId = params.get("session_id");

        if (sessionId) {
            API.verifyPaymentCancel({ session_id: sessionId })
                .then(() => {
                    toast.info(t("payment.cancelledNotice", "Transaction was cancelled. No charges were made."));
                })
                .catch((err) => {
                    console.error("Error reporting cancel status:", err);
                });
        }
    }, [location, t]);

    return (
        <PublicLayout>
            <PageWrapper>
                <Container maxWidth="sm" sx={{ display: "flex", justifyContent: "center" }}>
                    <ContentCard>
                        <IconWrapper>
                            <CancelOutlined sx={{ fontSize: 52, color: "#ffffff" }} />
                        </IconWrapper>

                        <Typography variant="h4" fontWeight={800} color="#1a1a2e" mb={1.5}>
                            {t("payment.cancelledTitle", "Payment Cancelled")}
                        </Typography>

                        <Typography variant="subtitle1" color="#e94560" fontWeight={700} mb={2}>
                            {t("payment.notCharged", "No payment was processed")}
                        </Typography>

                        <Typography color="#64748b" mb={3} sx={{ lineHeight: 1.6 }}>
                            {t("payment.cancelDescription", "You have cancelled the Stripe checkout process or the transaction could not be completed. Your blog post remains in its current status.")}
                        </Typography>

                        <ActionButton onClick={() => navigate("/dashboard")}>
                            {t("payment.backToDashboard", "Return to Dashboard")}
                        </ActionButton>
                    </ContentCard>
                </Container>
            </PageWrapper>
        </PublicLayout>
    );
};

export default PaymentCancel;
