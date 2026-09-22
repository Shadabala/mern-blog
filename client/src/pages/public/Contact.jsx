import { Box, Container, Typography, Link, Stack, Card } from "@mui/material";
import { Email as EmailIcon, Phone as PhoneIcon } from "@mui/icons-material";
import PublicLayout from "../../layouts/PublicLayout";

const Contact = () => {
    return (
        <PublicLayout>
            {/* Header Banner */}
            <Box
                sx={{
                    background: "linear-gradient(135deg, #0b192c 0%, #16213e 50%, #0f3460 100%)",
                    py: { xs: 8, md: 10 },
                    px: 3,
                    textAlign: "center",
                    color: "#ffffff"
                }}
            >
                <Container maxWidth="md">
                    <Typography
                        variant="h3"
                        fontWeight={900}
                        gutterBottom
                        sx={{
                            background: "linear-gradient(90deg, #ffffff 0%, #ff8a80 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}
                    >
                        Contact Me
                    </Typography>
                    <Typography variant="h6" color="rgba(255, 255, 255, 0.75)" fontWeight={400}>
                        Getting in touch is easy. Send an email or phone call anytime!
                    </Typography>
                </Container>
            </Box>

            {/* Content Body */}
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Card elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
                    <Typography variant="h4" fontWeight={800} color="#1a1a2e" gutterBottom>
                        Reach Out Directly
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph lineHeight={1.8}>
                        Whether you want to discuss a software project, give feedback on a blog post, or connect professionally, choose your preferred method below:
                    </Typography>

                    <Stack spacing={2.5} mt={4}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ width: 44, height: 44, borderRadius: "50%", bgcolor: "rgba(59, 247, 62, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-color, #e94560)" }}>
                                <PhoneIcon />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                                    Phone Call / WhatsApp
                                </Typography>
                                <Link href="tel:+919807770015" underline="hover" sx={{ color: "#1a1a2e", fontWeight: 700, fontSize: "1.1rem" }}>
                                    +91 9807770015
                                </Link>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ width: 44, height: 44, borderRadius: "50%", bgcolor: "rgba(59, 247, 62, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-color, #e94560)" }}>
                                <EmailIcon />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                                    Direct Email
                                </Typography>
                                <Link href="mailto:my.shadabalam@gmail.com?Subject=Blog Contact" target="_blank" underline="hover" sx={{ color: "#1a1a2e", fontWeight: 700, fontSize: "1.1rem" }}>
                                    my.shadabalam@gmail.com
                                </Link>
                            </Box>
                        </Stack>
                    </Stack>
                </Card>
            </Container>
        </PublicLayout>
    );
};

export default Contact;
