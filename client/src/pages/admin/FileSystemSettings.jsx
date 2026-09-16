import { useState, useEffect, useCallback } from "react";
import {
    Box, Grid, Card, CardHeader, CardContent, Typography, TextField, Button,
    Radio, FormControlLabel, Select, MenuItem, FormControl, InputLabel,
    CircularProgress, Alert, Stack
} from "@mui/material";
import {
    SpeedOutlined as RedisIcon
} from "@mui/icons-material";
import {
    fetchFileSystemSettings,
    updateFileSystemSettingsApi,
    updateFileSystemActivationApi,
    testRedisConnectionApi
} from "../../api/admin.api";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "../../utils/toast";

const FileSystemSettings = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingRedis, setTestingRedis] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: "info", text: "" });

    // File system driver state: 'aws' | 'backblaze' | 'local'
    const [driver, setDriver] = useState("local");

    // AWS Credentials
    const [awsSettings, setAwsSettings] = useState({
        AWS_ACCESS_KEY_ID: "",
        AWS_SECRET_ACCESS_KEY: "",
        AWS_DEFAULT_REGION: "us-east-1",
        AWS_BUCKET: "",
        AWS_URL: ""
    });

    // Backblaze Credentials
    const [bbSettings, setBbSettings] = useState({
        BACKBLAZE_ACCESS_KEY_ID: "",
        BACKBLAZE_SECRET_ACCESS_KEY: "",
        BACKBLAZE_DEFAULT_REGION: "us-east-005",
        BACKBLAZE_BUCKET: "",
        BACKBLAZE_ENDPOINT: "",
        BACKBLAZE_URL: ""
    });

    // Cache & Session Drivers
    const [driverSettings, setDriverSettings] = useState({
        CACHE_DRIVER: "file",
        SESSION_DRIVER: "file"
    });

    // Redis Configuration
    const [redisSettings, setRedisSettings] = useState({
        REDIS_HOST: "127.0.0.1",
        REDIS_PASSWORD: "",
        REDIS_PORT: "6379"
    });

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchFileSystemSettings();
            if (data?.success && data.settings) {
                const s = data.settings;
                setDriver(s.FILESYSTEM_DRIVER || "local");

                setAwsSettings({
                    AWS_ACCESS_KEY_ID: s.AWS_ACCESS_KEY_ID || "",
                    AWS_SECRET_ACCESS_KEY: s.AWS_SECRET_ACCESS_KEY || "",
                    AWS_DEFAULT_REGION: s.AWS_DEFAULT_REGION || "us-east-1",
                    AWS_BUCKET: s.AWS_BUCKET || "",
                    AWS_URL: s.AWS_URL || ""
                });

                setBbSettings({
                    BACKBLAZE_ACCESS_KEY_ID: s.BACKBLAZE_ACCESS_KEY_ID || "",
                    BACKBLAZE_SECRET_ACCESS_KEY: s.BACKBLAZE_SECRET_ACCESS_KEY || "",
                    BACKBLAZE_DEFAULT_REGION: s.BACKBLAZE_DEFAULT_REGION || "us-east-005",
                    BACKBLAZE_BUCKET: s.BACKBLAZE_BUCKET || "",
                    BACKBLAZE_ENDPOINT: s.BACKBLAZE_ENDPOINT || "",
                    BACKBLAZE_URL: s.BACKBLAZE_URL || ""
                });

                setDriverSettings({
                    CACHE_DRIVER: s.CACHE_DRIVER || "file",
                    SESSION_DRIVER: s.SESSION_DRIVER || "file"
                });

                setRedisSettings({
                    REDIS_HOST: s.REDIS_HOST || "127.0.0.1",
                    REDIS_PASSWORD: s.REDIS_PASSWORD || "",
                    REDIS_PORT: s.REDIS_PORT || "6379"
                });
            }
        } catch (err) {
            console.error("Failed to load file system settings:", err);
            setAlertMessage({ type: "error", text: t("Failed to load settings") });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Update File System Driver Activation
    const handleDriverChange = async (selectedDriver) => {
        setDriver(selectedDriver);
        try {
            await updateFileSystemActivationApi({ driver: selectedDriver });
            const msg = `${t("File System activation updated to")} ${selectedDriver.toUpperCase()}`;
            setAlertMessage({
                type: "success",
                text: msg
            });
            toast.success(msg);
        } catch (err) {
            console.error("Failed to update driver activation:", err);
            const msg = t("Something went wrong");
            setAlertMessage({ type: "error", text: msg });
            toast.error(msg);
        }
    };

    // Save Generic Section Settings
    const handleSaveSection = async (data, sectionName) => {
        setSaving(true);
        try {
            await updateFileSystemSettingsApi(data);
            const msg = `${sectionName} ${t("saved successfully")}`;
            setAlertMessage({
                type: "success",
                text: msg
            });
            toast.success(msg);
        } catch (err) {
            console.error(`Failed to save ${sectionName}:`, err);
            const msg = t("Failed to update settings");
            setAlertMessage({ type: "error", text: msg });
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // Test Redis Connection
    const handleTestRedis = async () => {
        setTestingRedis(true);
        try {
            const res = await testRedisConnectionApi();
            if (res?.success) {
                const msg = res.message || t("Redis connected successfully");
                setAlertMessage({ type: "success", text: msg });
                toast.success(msg);
            } else {
                const msg = res?.message || t("Redis connection failed");
                setAlertMessage({ type: "error", text: msg });
                toast.error(msg);
            }
        } catch (err) {
            const msg = err.response?.data?.message || t("Redis connection failed. Ensure Redis server is running.");
            setAlertMessage({
                type: "error",
                text: msg
            });
            toast.error(msg);
        } finally {
            setTestingRedis(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress sx={{ color: "#6366f1" }} />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={800} color="#1e293b">
                    {t("File System Configuration")}
                </Typography>
                <Typography variant="body2" color="#64748b">
                    {t("Configure storage drivers, cloud S3 credentials, cache/session drivers, and Redis.")}
                </Typography>
            </Box>

            {/* Notification alert */}
            {alertMessage.text && (
                <Alert
                    severity={alertMessage.type}
                    sx={{ mb: 3, borderRadius: 2 }}
                    onClose={() => setAlertMessage({ type: "info", text: "" })}
                >
                    {alertMessage.text}
                </Alert>
            )}

            {/* Row 1: Cloud Credentials & Activations */}
            <Grid container spacing={3} mb={3}>
                {/* Left Column: S3 & Backblaze Credentials Form */}
                <Grid item xs={12} lg={6}>
                    <Stack spacing={3}>
                        {/* AWS S3 Credentials Card */}
                        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
                            <CardHeader
                                title={
                                    <Typography variant="subtitle1" fontWeight={700} textAlign="center" color="#1e293b">
                                        {t("S3 File System Credentials")}
                                    </Typography>
                                }
                                sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0", py: 1.5 }}
                            />
                            <CardContent sx={{ p: 3 }}>
                                <Stack spacing={2}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t("AWS_ACCESS_KEY_ID")}
                                        value={awsSettings.AWS_ACCESS_KEY_ID}
                                        onChange={(e) => setAwsSettings({ ...awsSettings, AWS_ACCESS_KEY_ID: e.target.value })}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="password"
                                        label={t("AWS_SECRET_ACCESS_KEY")}
                                        value={awsSettings.AWS_SECRET_ACCESS_KEY}
                                        onChange={(e) => setAwsSettings({ ...awsSettings, AWS_SECRET_ACCESS_KEY: e.target.value })}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t("AWS_DEFAULT_REGION")}
                                        value={awsSettings.AWS_DEFAULT_REGION}
                                        onChange={(e) => setAwsSettings({ ...awsSettings, AWS_DEFAULT_REGION: e.target.value })}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t("AWS_BUCKET")}
                                        value={awsSettings.AWS_BUCKET}
                                        onChange={(e) => setAwsSettings({ ...awsSettings, AWS_BUCKET: e.target.value })}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t("AWS_URL")}
                                        placeholder="https://your-bucket.s3.amazonaws.com"
                                        value={awsSettings.AWS_URL}
                                        onChange={(e) => setAwsSettings({ ...awsSettings, AWS_URL: e.target.value })}
                                    />
                                    <Box textAlign="right" pt={1}>
                                        <Button
                                            variant="contained"
                                            onClick={() => handleSaveSection(awsSettings, t("AWS S3 Credentials"))}
                                            disabled={saving}
                                            sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, textTransform: "none", borderRadius: 2 }}
                                        >
                                            {t("Save")}
                                        </Button>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Backblaze Credentials Card */}
                        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
                            <CardHeader
                                title={
                                    <Typography variant="subtitle1" fontWeight={700} textAlign="center" color="#1e293b">
                                        {t("Backblaze File System Credentials")}
                                    </Typography>
                                }
                                sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0", py: 1.5 }}
                            />
                            <CardContent sx={{ p: 3 }}>
                                <Stack spacing={2}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t("BACKBLAZE_ACCESS_KEY_ID")}
                                        value={bbSettings.BACKBLAZE_ACCESS_KEY_ID}
                                        onChange={(e) => setBbSettings({ ...bbSettings, BACKBLAZE_ACCESS_KEY_ID: e.target.value })}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="password"
                                        label={t("BACKBLAZE_SECRET_ACCESS_KEY")}
                                        value={bbSettings.BACKBLAZE_SECRET_ACCESS_KEY}
                                        onChange={(e) => setBbSettings({ ...bbSettings, BACKBLAZE_SECRET_ACCESS_KEY: e.target.value })}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t("BACKBLAZE_DEFAULT_REGION")}
                                        value={bbSettings.BACKBLAZE_DEFAULT_REGION}
                                        onChange={(e) => setBbSettings({ ...bbSettings, BACKBLAZE_DEFAULT_REGION: e.target.value })}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t("BACKBLAZE_BUCKET")}
                                        value={bbSettings.BACKBLAZE_BUCKET}
                                        onChange={(e) => setBbSettings({ ...bbSettings, BACKBLAZE_BUCKET: e.target.value })}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t("BACKBLAZE_ENDPOINT")}
                                        value={bbSettings.BACKBLAZE_ENDPOINT}
                                        onChange={(e) => setBbSettings({ ...bbSettings, BACKBLAZE_ENDPOINT: e.target.value })}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t("BACKBLAZE_URL")}
                                        value={bbSettings.BACKBLAZE_URL}
                                        onChange={(e) => setBbSettings({ ...bbSettings, BACKBLAZE_URL: e.target.value })}
                                    />
                                    <Box textAlign="right" pt={1}>
                                        <Button
                                            variant="contained"
                                            onClick={() => handleSaveSection(bbSettings, t("Backblaze Credentials"))}
                                            disabled={saving}
                                            sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, textTransform: "none", borderRadius: 2 }}
                                        >
                                            {t("Save")}
                                        </Button>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>

                {/* Right Column: Driver Activations (same as base-module) */}
                <Grid item xs={12} lg={6}>
                    <Stack spacing={3}>
                        {/* AWS S3 Activation */}
                        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
                            <CardHeader
                                title={
                                    <Typography variant="subtitle1" fontWeight={700} textAlign="center" color="#1e293b">
                                        {t("AWS S3 File System Activation")}
                                    </Typography>
                                }
                                sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0", py: 1.5 }}
                            />
                            <CardContent sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                <FormControlLabel
                                    control={
                                        <Radio
                                            checked={driver === "aws"}
                                            onChange={() => handleDriverChange("aws")}
                                            sx={{ color: "#6366f1", "&.Mui-checked": { color: "#6366f1" } }}
                                        />
                                    }
                                    label={<Typography fontWeight={600}>{t("Enable AWS S3 Driver")}</Typography>}
                                />
                            </CardContent>
                        </Card>

                        {/* Backblaze Activation */}
                        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
                            <CardHeader
                                title={
                                    <Typography variant="subtitle1" fontWeight={700} textAlign="center" color="#1e293b">
                                        {t("Backblaze File System Activation")}
                                    </Typography>
                                }
                                sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0", py: 1.5 }}
                            />
                            <CardContent sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                <FormControlLabel
                                    control={
                                        <Radio
                                            checked={driver === "backblaze"}
                                            onChange={() => handleDriverChange("backblaze")}
                                            sx={{ color: "#6366f1", "&.Mui-checked": { color: "#6366f1" } }}
                                        />
                                    }
                                    label={<Typography fontWeight={600}>{t("Enable Backblaze Driver")}</Typography>}
                                />
                            </CardContent>
                        </Card>

                        {/* Local Activation */}
                        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
                            <CardHeader
                                title={
                                    <Typography variant="subtitle1" fontWeight={700} textAlign="center" color="#1e293b">
                                        {t("Local File System Activation")}
                                    </Typography>
                                }
                                sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0", py: 1.5 }}
                            />
                            <CardContent sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                <FormControlLabel
                                    control={
                                        <Radio
                                            checked={driver === "local"}
                                            onChange={() => handleDriverChange("local")}
                                            sx={{ color: "#6366f1", "&.Mui-checked": { color: "#6366f1" } }}
                                        />
                                    }
                                    label={<Typography fontWeight={600}>{t("Enable Local Storage Driver")}</Typography>}
                                />
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>

            {/* Row 2: Cache, Session Driver & Redis Configuration */}
            <Grid container spacing={3}>
                {/* Cache & Session Driver */}
                <Grid item xs={12} lg={6}>
                    <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, height: "100%" }}>
                        <CardHeader
                            title={
                                <Typography variant="subtitle1" fontWeight={700} textAlign="center" color="#1e293b">
                                    {t("Cache & Session Driver")}
                                </Typography>
                            }
                            sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0", py: 1.5 }}
                        />
                        <CardContent sx={{ p: 3 }}>
                            <Stack spacing={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{t("CACHE_DRIVER")}</InputLabel>
                                    <Select
                                        label={t("CACHE_DRIVER")}
                                        value={driverSettings.CACHE_DRIVER}
                                        onChange={(e) => setDriverSettings({ ...driverSettings, CACHE_DRIVER: e.target.value })}
                                    >
                                        <MenuItem value="file">{t("file")}</MenuItem>
                                        <MenuItem value="redis">{t("redis")}</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth size="small">
                                    <InputLabel>{t("SESSION_DRIVER")}</InputLabel>
                                    <Select
                                        label={t("SESSION_DRIVER")}
                                        value={driverSettings.SESSION_DRIVER}
                                        onChange={(e) => setDriverSettings({ ...driverSettings, SESSION_DRIVER: e.target.value })}
                                    >
                                        <MenuItem value="file">{t("file")}</MenuItem>
                                        <MenuItem value="redis">{t("redis")}</MenuItem>
                                    </Select>
                                </FormControl>

                                <Box textAlign="right">
                                    <Button
                                        variant="contained"
                                        onClick={() => handleSaveSection(driverSettings, t("Cache & Session Driver"))}
                                        disabled={saving}
                                        sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, textTransform: "none", borderRadius: 2 }}
                                    >
                                        {t("Save")}
                                    </Button>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Redis Configuration */}
                <Grid item xs={12} lg={6}>
                    <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, height: "100%" }}>
                        <CardHeader
                            title={
                                <Typography variant="subtitle1" fontWeight={700} textAlign="center" color="#1e293b">
                                    {t("Redis Configuration (If you use redis as any of the drivers)")}
                                </Typography>
                            }
                            sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0", py: 1.5 }}
                        />
                        <CardContent sx={{ p: 3 }}>
                            <Stack spacing={2.5}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label={t("REDIS_HOST")}
                                    placeholder="127.0.0.1"
                                    value={redisSettings.REDIS_HOST}
                                    onChange={(e) => setRedisSettings({ ...redisSettings, REDIS_HOST: e.target.value })}
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="password"
                                    label={t("REDIS_PASSWORD")}
                                    placeholder={t("Optional password")}
                                    value={redisSettings.REDIS_PASSWORD}
                                    onChange={(e) => setRedisSettings({ ...redisSettings, REDIS_PASSWORD: e.target.value })}
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label={t("REDIS_PORT")}
                                    placeholder="6379"
                                    value={redisSettings.REDIS_PORT}
                                    onChange={(e) => setRedisSettings({ ...redisSettings, REDIS_PORT: e.target.value })}
                                />

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={testingRedis ? <CircularProgress size={16} /> : <RedisIcon />}
                                        onClick={handleTestRedis}
                                        disabled={testingRedis}
                                        sx={{ textTransform: "none", borderRadius: 2, color: "#e11d48", borderColor: "#fecdd3" }}
                                    >
                                        {t("Test Connection")}
                                    </Button>

                                    <Button
                                        variant="contained"
                                        onClick={() => handleSaveSection(redisSettings, t("Redis Configuration"))}
                                        disabled={saving}
                                        sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, textTransform: "none", borderRadius: 2 }}
                                    >
                                        {t("Save")}
                                    </Button>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FileSystemSettings;
