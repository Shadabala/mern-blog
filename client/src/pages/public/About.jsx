import { Box, Container, Typography, Link, Stack, Card } from "@mui/material";
import { Email as EmailIcon } from "@mui/icons-material";
import PublicLayout from "../../layouts/PublicLayout";

const About = () => {
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
                        About My Blog
                    </Typography>
                    <Typography variant="h6" color="rgba(255, 255, 255, 0.75)" fontWeight={400}>
                        Sharing thoughts, experiences, and technical insights with the community
                    </Typography>
                </Container>
            </Box>

            {/* Content Body */}
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Card elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
                    <Typography variant="h4" fontWeight={800} color="#1a1a2e" gutterBottom>
                        Welcome to My Personal Space
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph lineHeight={1.8}>
                        This blog portal was created to document learning journeys, software engineering projects, and technical knowledge. Whether you are looking for web development guides, design tutorials, or personal growth stories, this platform aims to inspire and inform.
                    </Typography>

                    <Box sx={{ mt: 4, pt: 4, borderTop: "1px solid #f1f5f9" }}>
                        <Typography variant="h6" fontWeight={700} color="#1a1a2e" gutterBottom>
                            Get In Touch
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            If you have questions, suggestions, or would like to collaborate on projects, feel free to reach out via email:
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center" color="#e94560">
                            <EmailIcon />
                            <Link
                                href="mailto:my.shadabalam@gmail.com?Subject=Blog Inquiry"
                                target="_blank"
                                underline="hover"
                                sx={{ color: "#e94560", fontWeight: 700, fontSize: "1.05rem" }}
                            >
                                my.shadabalam@gmail.com
                            </Link>
                        </Stack>
                    </Box>
                </Card>
            </Container>
        </PublicLayout>
    );
};

export default About;
