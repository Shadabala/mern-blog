import { useState, useEffect } from "react";
import { Box, Paper, Typography, TextField, Button, Grid, Alert, CircularProgress, Divider } from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import { fetchAdminSettings, updateAdminSettings } from "../../api/admin.api";
import { toast } from "../../utils/toast";

const SiteSettings = () => {
    const [settings, setSettings] = useState({
        site_name: "MERN Portal System",
        site_tagline: "High performance Laravel-style MERN Stack Platform",
        contact_email: "support@mernportal.local",
        contact_phone: "+1 800 555 0199",
        footer_text: "© 2026 MERN Portal. All rights reserved."
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await fetchAdminSettings();
                if (data.settingsMap && Object.keys(data.settingsMap).length > 0) {
                    setSettings(prev => ({ ...prev, ...data.settingsMap }));
                }
            } catch (err) {
                console.error("Failed to load settings:", err);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateAdminSettings(settings);
            const msg = "Global website settings updated successfully.";
            setAlertMessage(msg);
            toast.success(msg);
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to save settings";
            setAlertMessage(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: "md" }}>
            <Typography variant="h5" fontWeight={700} mb={3} color="#0f172a">
                Global Website Settings (CMS)
            </Typography>

            {alertMessage && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setAlertMessage("")}>
                    {alertMessage}
                </Alert>
            )}

            <Paper elevation={0} sx={{ p: 4, border: "1px solid #e2e8f0", borderRadius: 3 }}>
                <Box component="form" onSubmit={handleSave}>
                    <Typography variant="subtitle1" fontWeight={700} color="primary" mb={2}>
                        General Information
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Site Name"
                                value={settings.site_name}
                                onChange={(e) => handleChange("site_name", e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Site Tagline"
                                value={settings.site_tagline}
                                onChange={(e) => handleChange("site_tagline", e.target.value)}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle1" fontWeight={700} color="primary" mb={2}>
                        Contact Details
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Support Email"
                                type="email"
                                value={settings.contact_email}
                                onChange={(e) => handleChange("contact_email", e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Contact Phone"
                                value={settings.contact_phone}
                                onChange={(e) => handleChange("contact_phone", e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Footer Copyright Text"
                                value={settings.footer_text}
                                onChange={(e) => handleChange("footer_text", e.target.value)}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            disabled={saving}
                        >
                            Save Settings
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default SiteSettings;
