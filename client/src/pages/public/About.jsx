import { Box, Container, Typography, Link, Stack, Card } from "@mui/material";
import { Email as EmailIcon } from "@mui/icons-material";
import PublicLayout from "../../layouts/PublicLayout";
import { useSettings } from "../../context/SettingsContext";

const About = () => {
    const { get_setting } = useSettings();

    // Contact settings from admin panel or defaults
    const about_page_banner_heading = get_setting("about_page_banner_heading");
    const about_page_banner_description = get_setting("about_page_banner_description");
    const about_page_main_heading = get_setting("about_page_main_heading");
    const about_page_main_description = get_setting("about_page_main_description");


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
                    {about_page_banner_heading && about_page_banner_heading.trim() !== "" && (
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
                            {about_page_banner_heading}
                        </Typography>
                    )}
                    {about_page_banner_description && about_page_banner_description.trim() !== "" && (
                        <Typography variant="h6" color="rgba(255, 255, 255, 0.75)" fontWeight={400}>
                            {about_page_banner_description}
                        </Typography>
                    )}
                </Container>
            </Box>

            {/* Content Body */}
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Card elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>

                    <Box sx={{ mt: 4, pt: 4, borderTop: "1px solid #f1f5f9" }}>
                        {
                            about_page_main_heading && about_page_main_heading.trim() !== "" && (
                                <Typography variant="h4" fontWeight={800} color="#1a1a2e" gutterBottom>
                                    {about_page_main_heading}
                                </Typography>
                            )
                        }
                        {
                            about_page_main_description &&
                            about_page_main_description.trim() !== "" && (
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    paragraph
                                    lineHeight={1.8}
                                    component="div"
                                    dangerouslySetInnerHTML={{
                                        __html: about_page_main_description
                                    }}
                                />
                            )
                        }
                    </Box>
                </Card>
            </Container>
        </PublicLayout>
    );
};

export default About;
