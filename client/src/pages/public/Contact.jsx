import React, { useState } from "react";
import {
    Box,
    Container,
    Typography,
    Link,
    Stack,
    Card,
    Grid,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Paper
} from "@mui/material";
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    Place as PlaceIcon,
    AccessTime as TimeIcon,
    CheckCircleOutline as CheckIcon,
    WhatsApp as WhatsAppIcon
} from "@mui/icons-material";
import PublicLayout from "../../layouts/PublicLayout";
import { useSettings } from "../../context/SettingsContext";
import { useLanguage } from "../../context/LanguageContext";
import { submitContactForm } from "../../api/public.api";
import { toast } from "../../utils/toast";

const Contact = () => {
    const { t } = useLanguage();
    const { get_setting } = useSettings();

    // Contact settings from admin panel or defaults
    const contactPhone = get_setting("contact_page_phone");
    const contactEmail = get_setting("contact_email");
    const contactAddress = get_setting("contact_address");
    const contactHours = get_setting("contact_hours");
    const contactWhatsapp = get_setting("contact_whatsapp");

    const contactPageSliderHeading = get_setting("contact_page_slider_heading");
    const contactPageSliderText = get_setting("contact_page_slider_text");
    const contactPageMainHeading = get_setting("contact_page_main_heading");
    const contactPageMainText = get_setting("contact_page_main_text");

    const contactPageInfoHeading = get_setting("contact_page_info_heading");
    const contactPageInfoText = get_setting("contact_page_info_text");
    const contactPageFormHeading = get_setting("contact_page_form_heading");
    const contactPageFormText = get_setting("contact_page_form_text");

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        subject: "",
        message: ""
    });

    const [submitting, setSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: "", text: "" });

        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            setStatusMessage({
                type: "error",
                text: t("Please fill in all required fields (Name, Email, Query).", "Please fill in all required fields (Name, Email, Query).")
            });
            return;
        }

        setSubmitting(true);
        try {
            const res = await submitContactForm(formData);
            if (res?.success) {
                const successMsg = res.message || t("Thank you! Your message has been sent successfully.", "Thank you! Your message has been sent successfully.");
                setStatusMessage({ type: "success", text: successMsg });
                toast.success(successMsg);

                // Reset form fields
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    company: "",
                    subject: "",
                    message: ""
                });
            } else {
                setStatusMessage({
                    type: "error",
                    text: res?.message || t("Failed to send message. Please try again.", "Failed to send message. Please try again.")
                });
            }
        } catch (err) {
            console.error("Contact submission error:", err);
            const msg = err.response?.data?.message || t("Something went wrong. Please try again later.", "Something went wrong. Please try again later.");
            setStatusMessage({ type: "error", text: msg });
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const ContactTile = ({ icon, title, children, iconColor = "#16a34a", iconBg = "#e8f8ee" }) => (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 1.8, sm: 2.2 },
                borderRadius: "12px",
                border: "1px solid #f1f5f9",
                bgcolor: "#f8fafc",
                display: "flex",
                alignItems: "center",
                gap: 2,
                height: "100%",
                transition: "all 0.2s ease",
                "&:hover": {
                    borderColor: "#cbd5e1",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                    transform: "translateY(-1px)"
                }
            }}
        >
            <Box
                sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    bgcolor: iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: iconColor,
                    flexShrink: 0
                }}
            >
                {icon}
            </Box>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography variant="caption" color="#64748b" display="block" fontWeight={600} sx={{ fontSize: "0.82rem" }}>
                    {title}
                </Typography>
                {children}
            </Box>
        </Paper>
    );

    return (
        <PublicLayout>
            {/* Header Banner */}
            {(contactPageSliderHeading !== null || contactPageSliderText !== null) && (
                <Box
                    sx={{
                        background: "linear-gradient(135deg, #0b192c 0%, #16213e 50%, #0f3460 100%)",
                        py: { xs: 5, md: 7 },
                        px: 3,
                        textAlign: "center",
                        color: "#ffffff"
                    }}>
                    <Container maxWidth="lg">
                        {contactPageSliderHeading && (
                            <Typography
                                variant="h3"
                                fontWeight={900}
                                gutterBottom
                                sx={{
                                    background: "linear-gradient(90deg, #ffffff 0%, #ff8a80 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    fontSize: { xs: "2rem", sm: "2.5rem", md: "2.85rem" }
                                }}>
                                {contactPageSliderHeading}
                            </Typography>
                        )}
                        {contactPageSliderText && (
                            <Typography
                                variant="h6"
                                color="rgba(255, 255, 255, 0.75)"
                                fontWeight={400}
                                sx={{ fontSize: { xs: "0.95rem", md: "1.15rem" } }}>
                                {contactPageSliderText}
                            </Typography>
                        )}
                    </Container>
                </Box>
            )}

            {/* Main Content Area */}
            <Box sx={{ bgcolor: "#f8fafc", py: { xs: 4, sm: 5, md: 8 } }}>
                <Container maxWidth="lg">
                    {/* Top Heading & Subheading */}
                    {(contactPageMainHeading !== null || contactPageMainText !== null) && (
                        <Box sx={{
                            mb: { xs: 3, sm: 4, md: 5 }, ml: { xs: 2, sm: 3, md: 4 },
                            mr: { xs: 2, sm: 3, md: 4 }
                        }}>
                            <Typography
                                variant="h4"
                                fontWeight={800}
                                color="#0f172a"
                                gutterBottom
                                sx={{ fontSize: { xs: "1.65rem", sm: "2rem", md: "2.35rem" }, lineHeight: 1.25 }}
                            >
                                {contactPageMainHeading}
                            </Typography>
                            <Typography
                                variant="body1"
                                color="#475569"
                                sx={{ fontSize: { xs: "0.95rem", sm: "1.05rem" }, lineHeight: 1.7, maxWidth: "850px" }}
                            >
                                {contactPageMainText}
                            </Typography>
                        </Box>
                    )}

                    {/* 2-Column Responsive Layout */}
                    <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
                        {/* LEFT SIDE: Contact Information Card */}
                        <Grid item size={{ xs: 12, md: 5 }} xs={12} md={5} sx={{ display: "flex" }}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: { xs: 2.5, sm: 3.5, md: 4 },
                                    borderRadius: "16px",
                                    border: "1px solid #e2e8f0",
                                    bgcolor: "#ffffff",
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)"
                                }}
                            >
                                {(contactPageInfoHeading !== null || contactPageInfoText !== null) && (
                                    <Box>
                                        <Typography
                                            variant="h6"
                                            fontWeight={700}
                                            color="#1e293b"
                                            sx={{ mb: 0.5, fontSize: { xs: "1.15rem", sm: "1.25rem" } }}
                                        >
                                            {contactPageInfoHeading}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            {contactPageInfoText}
                                        </Typography>

                                        <Grid container spacing={2}>
                                            {/* 1. Phone Call */}
                                            {contactPhone && contactPhone.trim() !== "" && (
                                                <Grid item size={{ xs: 12 }} xs={12}>
                                                    <ContactTile
                                                        title={t("Phone Call", "Phone Call")}
                                                        icon={<PhoneIcon sx={{ fontSize: 22 }} />}
                                                    >
                                                        <Link
                                                            href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                                                            underline="hover"
                                                            sx={{
                                                                color: "#0f172a",
                                                                fontWeight: 700,
                                                                fontSize: { xs: "0.95rem", sm: "1.02rem" },
                                                                display: "inline-block",
                                                                mt: 0.2
                                                            }}
                                                        >
                                                            {contactPhone}
                                                        </Link>
                                                    </ContactTile>
                                                </Grid>
                                            )}

                                            {/* 2. Direct Email */}
                                            {contactEmail && contactEmail.trim() !== "" && (
                                                <Grid item size={{ xs: 12 }} xs={12}>
                                                    <ContactTile
                                                        title={t("Direct Email", "Direct Email")}
                                                        icon={<EmailIcon sx={{ fontSize: 22 }} />}
                                                    >
                                                        <Link
                                                            href={`mailto:${contactEmail}?Subject=Blog Inquiry`}
                                                            target="_blank"
                                                            underline="hover"
                                                            sx={{
                                                                color: "#0f172a",
                                                                fontWeight: 700,
                                                                fontSize: { xs: "0.92rem", sm: "0.98rem" },
                                                                display: "inline-block",
                                                                mt: 0.2,
                                                                wordBreak: "break-all"
                                                            }}
                                                        >
                                                            {contactEmail}
                                                        </Link>
                                                    </ContactTile>
                                                </Grid>
                                            )}

                                            {/* 3. Office Address / Location */}
                                            {contactAddress && contactAddress.trim() !== "" && (
                                                <Grid item size={{ xs: 12 }} xs={12}>
                                                    <ContactTile
                                                        title={t("Office Address / Location", "Office Address / Location")}
                                                        icon={<PlaceIcon sx={{ fontSize: 22 }} />}
                                                    >
                                                        <Typography
                                                            sx={{
                                                                color: "#0f172a",
                                                                fontWeight: 700,
                                                                fontSize: { xs: "0.92rem", sm: "0.98rem" },
                                                                mt: 0.2,
                                                                lineHeight: 1.4
                                                            }}
                                                        >
                                                            {contactAddress}
                                                        </Typography>
                                                    </ContactTile>
                                                </Grid>
                                            )}

                                            {/* 4. Working Hours */}
                                            {contactHours && contactHours.trim() !== "" && (
                                                <Grid item size={{ xs: 12 }} xs={12}>
                                                    <ContactTile
                                                        title={t("Working Hours", "Working Hours")}
                                                        icon={<TimeIcon sx={{ fontSize: 22 }} />}
                                                    >
                                                        <Typography
                                                            sx={{
                                                                color: "#0f172a",
                                                                fontWeight: 700,
                                                                fontSize: { xs: "0.92rem", sm: "0.98rem" },
                                                                mt: 0.2,
                                                                lineHeight: 1.4
                                                            }}
                                                        >
                                                            {contactHours}
                                                        </Typography>
                                                    </ContactTile>
                                                </Grid>
                                            )}

                                            {/* 5. WhatsApp */}
                                            {contactWhatsapp && contactWhatsapp.trim() !== "" && (
                                                <Grid item size={{ xs: 12 }} xs={12}>
                                                    <ContactTile
                                                        title={t("WhatsApp", "WhatsApp")}
                                                        icon={<WhatsAppIcon sx={{ fontSize: 22 }} />}
                                                        iconColor="#16a34a"
                                                        iconBg="#dcfce7"
                                                    >
                                                        <Link
                                                            href={`https://wa.me/${contactWhatsapp.replace(/\D/g, "")}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            underline="hover"
                                                            sx={{
                                                                color: "#0f172a",
                                                                fontWeight: 700,
                                                                fontSize: { xs: "0.92rem", sm: "0.98rem" },
                                                                display: "inline-block",
                                                                mt: 0.2
                                                            }}
                                                        >
                                                            {contactWhatsapp}
                                                        </Link>
                                                    </ContactTile>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Box>
                                )}
                            </Card>
                        </Grid>

                        {/* RIGHT SIDE: Contact Form Card */}
                        <Grid item size={{ xs: 12, md: 7 }} xs={12} md={7} sx={{ display: "flex" }}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: { xs: 2.5, sm: 3.5, md: 4 },
                                    borderRadius: "16px",
                                    border: "1px solid #e2e8f0",
                                    bgcolor: "#ffffff",
                                    width: "100%",
                                    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)"
                                }}
                            >
                                {contactPageFormHeading !== null && (
                                    <Typography
                                        variant="h6"
                                        fontWeight={700}
                                        color="#1e293b"
                                        sx={{ mb: 0.5, fontSize: { xs: "1.15rem", sm: "1.25rem" } }}
                                    >
                                        {contactPageFormHeading}
                                    </Typography>
                                )}

                                {contactPageFormText !== null && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        {contactPageFormText}
                                    </Typography>
                                )}

                                {/* Feedback Message */}
                                {statusMessage.text && (
                                    <Alert
                                        severity={statusMessage.type}
                                        sx={{ mb: 3, borderRadius: "8px" }}
                                        onClose={() => setStatusMessage({ type: "", text: "" })}
                                    >
                                        {statusMessage.text}
                                    </Alert>
                                )}

                                <Box component="form" onSubmit={handleSubmit} noValidate>
                                    <Stack spacing={2.5}>
                                        {/* 1. Name */}
                                        <TextField
                                            fullWidth
                                            label={t("Name", "Name")}
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            variant="outlined"
                                        />

                                        {/* 2. Email */}
                                        <TextField
                                            fullWidth
                                            label={t("Email", "Email")}
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            variant="outlined"
                                        />

                                        {/* 3. Phone No. */}
                                        <TextField
                                            fullWidth
                                            label={t("Phone No.", "Phone No.")}
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            variant="outlined"
                                        />

                                        {/* 4. Company Name */}
                                        <TextField
                                            fullWidth
                                            label={t("Company Name", "Company Name")}
                                            name="company"
                                            value={formData.company}
                                            onChange={handleChange}
                                            variant="outlined"
                                        />

                                        {/* 5. Subject */}
                                        <TextField
                                            fullWidth
                                            label={t("Subject", "Subject")}
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            variant="outlined"
                                        />

                                        {/* 6. Query Message */}
                                        <TextField
                                            fullWidth
                                            label={t("Tell us about your query", "Tell us about your query")}
                                            name="message"
                                            multiline
                                            rows={4}
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            variant="outlined"
                                        />

                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            fullWidth
                                            size="large"
                                            variant="outlined"
                                            className="btn-outline-primary"
                                            disabled={submitting}
                                            sx={{
                                                color: "var(--primary-color, #2563eb)",
                                                borderColor: "var(--primary-color, #2563eb)",
                                                backgroundColor: "transparent",

                                                "&:hover": {
                                                    color: "#ffffff",
                                                    backgroundColor: "var(--primary-color, #2563eb)",
                                                    borderColor: "var(--primary-color, #2563eb)"
                                                },

                                                "&:disabled": {
                                                    color: "var(--primary-color, #2563eb)",
                                                    borderColor: "var(--primary-color, #2563eb)",
                                                    opacity: 0.6
                                                },

                                                py: 1.4,
                                                borderRadius: "8px",
                                                fontSize: "1rem",
                                                fontWeight: 700,
                                                textTransform: "none",
                                                boxShadow: "none"
                                            }}
                                        >
                                            {submitting ? (
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                >
                                                    <CircularProgress
                                                        size={20}
                                                        color="inherit"
                                                    />

                                                    <Typography
                                                        sx={{
                                                            fontSize: "1rem",
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        {t("Submitting...", "Submitting...")}
                                                    </Typography>
                                                </Stack>
                                            ) : (
                                                t("Submit", "Submit")
                                            )}
                                        </Button>
                                    </Stack>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </PublicLayout>
    );
};

export default Contact;
