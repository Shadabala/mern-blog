import { useState, useEffect, useMemo, useRef } from "react";
import {

    Box, Paper, Typography, Grid, Button, Switch, Alert, Stack, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog,
    DialogTitle, DialogContent, TextField, MenuItem, CircularProgress,
    Tooltip, InputAdornment, TablePagination
} from "@mui/material";
import {
    Translate as TranslateIcon,
    PhoneAndroid as AppTranslateIcon,
    FileDownload as ExportIcon,
    EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon,
    Add as AddIcon,
    Search as SearchIcon,
    Save as SaveIcon
} from "@mui/icons-material";
import {
    fetchAdminLanguages, toggleLanguageStatusApi,
    toggleLanguageRtlApi, setDefaultLanguageApi, deleteLanguageApi, fetchLanguageTranslationsApi,
    updateLanguageTranslationsApi, importTranslationsApi
} from "../../api/admin.api";
import { useLanguage } from "../../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { toast } from "../../utils/toast";
import { confirmDelete } from "../../utils/swal";

const LanguageSettings = () => {
    const navigate = useNavigate();
    const { currentLang, changeLanguage, refreshTranslations, refreshLanguages } = useLanguage();

    const [languagesList, setLanguagesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertSeverity, setAlertSeverity] = useState("success");

    // Default Language Selector state
    const [selectedDefaultLangId, setSelectedDefaultLangId] = useState("");
    const [savingDefault, setSavingDefault] = useState(false);

    // Import Translations File state
    const [importLangId, setImportLangId] = useState("");
    const [importFile, setImportFile] = useState(null);
    const [importFileName, setImportFileName] = useState("");
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);



    // Translation Key-Value Editor Modal State
    const [openTransModal, setOpenTransModal] = useState(false);
    const [activeTransLang, setActiveTransLang] = useState(null);
    const [transType, setTransType] = useState("web"); // 'web' or 'app'
    const [transLoading, setTransLoading] = useState(false);
    const [transData, setTransData] = useState({});
    const [defaultTransKeys, setDefaultTransKeys] = useState({});
    const [transSearch, setTransSearch] = useState("");
    const [transPage, setTransPage] = useState(0);
    const [transRowsPerPage, setTransRowsPerPage] = useState(10);
    const [savingTrans, setSavingTrans] = useState(false);

    // Flatten nested translation objects for easy editing
    const flattenObject = (obj, prefix = "") => {
        let result = {};
        for (const [key, value] of Object.entries(obj || {})) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                Object.assign(result, flattenObject(value, newKey));
            } else {
                result[newKey] = String(value ?? "");
            }
        }
        return result;
    };

    // Unflatten key-value pairs back to nested object
    const unflattenObject = (data) => {
        let result = {};
        for (const i in data) {
            const keys = i.split(".");
            keys.reduce((r, e, j) => {
                return (
                    r[e] ||
                    (r[e] = isNaN(Number(keys[j + 1]))
                        ? keys.length - 1 === j
                            ? data[i]
                            : {}
                        : [])
                );
            }, result);
        }
        return result;
    };

    const loadLanguages = async () => {
        setLoading(true);
        try {
            const res = await fetchAdminLanguages();
            if (res.success && Array.isArray(res.languages)) {
                setLanguagesList(res.languages);
                const def = res.languages.find((l) => l.isDefault) || res.languages[0];
                if (def) {
                    setSelectedDefaultLangId(def._id);
                    setImportLangId(def._id);
                }
                refreshLanguages?.();
            }
        } catch (err) {
            console.error("Failed to fetch languages:", err);
            setAlertSeverity("error");
            setAlertMessage(err.response?.data?.message || "Failed to load languages");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLanguages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save Default Language
    const handleSaveDefaultLanguage = async () => {
        if (!selectedDefaultLangId) return;
        setSavingDefault(true);
        try {
            const res = await setDefaultLanguageApi(selectedDefaultLangId);
            if (res.success) {
                setAlertSeverity("success");
                setAlertMessage(res.message);
                toast.success(res.message || "Default language updated successfully");
                const target = languagesList.find((l) => l._id === selectedDefaultLangId);
                if (target) {
                    changeLanguage(target.code);
                }
                loadLanguages();
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to set default language";
            setAlertSeverity("error");
            setAlertMessage(msg);
            toast.error(msg);
        } finally {
            setSavingDefault(false);
        }
    };

    // File selection for import
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImportFile(file);
            setImportFileName(file.name);
        }
    };

    // Handle Import translations
    const handleImportTranslations = async () => {
        if (!importFile) {
            const msg = "Please choose a translation file (.arb or .json) first";
            setAlertSeverity("error");
            setAlertMessage(msg);
            toast.warning(msg);
            return;
        }

        setImporting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const rawContent = event.target.result;
                    const parsed = JSON.parse(rawContent);
                    const res = await importTranslationsApi({
                        id: importLangId,
                        rawContent: parsed,
                        type: importFileName.endsWith(".arb") ? "app" : "web"
                    });

                    if (res.success) {
                        setAlertSeverity("success");
                        setAlertMessage(res.message);
                        toast.success(res.message || "Translations imported successfully");
                        setImportFile(null);
                        setImportFileName("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        loadLanguages();
                    }
                } catch (parseErr) {
                    const msg = "Failed to parse JSON/ARB file: " + parseErr.message;
                    setAlertSeverity("error");
                    setAlertMessage(msg);
                    toast.error(msg);
                } finally {
                    setImporting(false);
                }
            };
            reader.readAsText(importFile);
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to import translations";
            setAlertSeverity("error");
            setAlertMessage(msg);
            toast.error(msg);
            setImporting(false);
        }
    };

    // Toggle RTL
    const handleToggleRtl = async (id) => {
        try {
            const res = await toggleLanguageRtlApi(id);
            if (res.success) {
                setAlertSeverity("success");
                setAlertMessage(res.message);
                toast.success(res.message || "RTL setting updated");
                const updatedLang = res.language;
                if (updatedLang && (currentLang === updatedLang.code || currentLang === updatedLang.app_code)) {
                    document.documentElement.dir = updatedLang.isRtl ? "rtl" : "ltr";
                    document.body.dir = updatedLang.isRtl ? "rtl" : "ltr";
                }
                loadLanguages();
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to toggle RTL";
            setAlertSeverity("error");
            setAlertMessage(msg);
            toast.error(msg);
        }
    };

    // Toggle Active Status
    const handleToggleStatus = async (id) => {
        try {
            const res = await toggleLanguageStatusApi(id);
            if (res.success) {
                setAlertSeverity("success");
                setAlertMessage(res.message);
                toast.success(res.message || "Language status updated");
                loadLanguages();
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to toggle status";
            setAlertSeverity("error");
            setAlertMessage(msg);
            toast.error(msg);
        }
    };



    // Delete Language
    const handleDeleteLanguage = async (id, isDefault) => {
        if (isDefault) return;
        const confirmed = await confirmDelete({
            title: "Delete Language?",
            text: "Are you sure you want to delete this language and its translations? This cannot be undone.",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel"
        });
        if (!confirmed) return;

        try {
            const res = await deleteLanguageApi(id);
            if (res.success) {
                setAlertSeverity("success");
                setAlertMessage(res.message);
                toast.success(res.message || "Language deleted successfully");
                loadLanguages();
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to delete language";
            setAlertSeverity("error");
            setAlertMessage(msg);
            toast.error(msg);
        }
    };

    // Open Translation Editor Modal
    const handleOpenTranslationEditor = async (lang, type = "web") => {
        setActiveTransLang(lang);
        setTransType(type);
        setTransLoading(true);
        setTransSearch("");
        setTransPage(0);
        setOpenTransModal(true);

        try {
            const res = await fetchLanguageTranslationsApi(lang._id, type);
            if (res.success) {
                const flatTarget = flattenObject(res.translations || {});
                const flatDefault = flattenObject(res.defaultKeys || {});
                setTransData(flatTarget);
                setDefaultTransKeys(flatDefault);
            }
        } catch (err) {
            console.error("Error loading translations:", err);
            const msg = "Failed to load translation keys";
            setAlertSeverity("error");
            setAlertMessage(msg);
            toast.error(msg);
        } finally {
            setTransLoading(false);
        }
    };

    // Save Translation Key-Values back to DB
    const handleSaveTranslations = async () => {
        if (!activeTransLang) return;
        setSavingTrans(true);
        try {
            const nestedData = unflattenObject(transData);
            const res = await updateLanguageTranslationsApi(activeTransLang._id, nestedData, transType);
            if (res.success) {
                setAlertSeverity("success");
                setAlertMessage(res.message);
                toast.success(res.message || "Translations saved successfully");
                setOpenTransModal(false);
                // Refresh translations from DB if active
                if (currentLang === activeTransLang.code || currentLang === activeTransLang.app_code) {
                    refreshTranslations();
                }
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update translations";
            setAlertSeverity("error");
            setAlertMessage(msg);
            toast.error(msg);
        } finally {
            setSavingTrans(false);
        }
    };

    // Export Translation File
    const handleExportTranslations = (lang, type = "web") => {
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
        const token = localStorage.getItem("token");
        const url = `${apiUrl}/admin/languages/${lang._id}/export?type=${type}&token=${token}`;
        window.open(url, "_blank");
    };

    // All combined translation keys for editor
    const allKeyEntries = useMemo(() => {
        const allKeys = Array.from(
            new Set([...Object.keys(defaultTransKeys), ...Object.keys(transData)])
        );
        return allKeys.map((key) => ({
            key,
            defaultVal: defaultTransKeys[key] || "",
            currentVal: transData[key] !== undefined ? transData[key] : (defaultTransKeys[key] || "")
        }));
    }, [defaultTransKeys, transData]);

    const filteredKeyEntries = useMemo(() => {
        if (!transSearch.trim()) return allKeyEntries;
        const q = transSearch.toLowerCase();
        return allKeyEntries.filter(
            (item) =>
                item.key.toLowerCase().includes(q) ||
                item.defaultVal.toLowerCase().includes(q) ||
                item.currentVal.toLowerCase().includes(q)
        );
    }, [allKeyEntries, transSearch]);

    const paginatedKeyEntries = useMemo(() => {
        const start = transPage * transRowsPerPage;
        return filteredKeyEntries.slice(start, start + transRowsPerPage);
    }, [filteredKeyEntries, transPage, transRowsPerPage]);

    return (
        <Box sx={{ width: "100%", pb: 5 }}>
            {alertMessage && (
                <Alert
                    severity={alertSeverity}
                    sx={{ mb: 3, borderRadius: 2 }}
                    onClose={() => setAlertMessage("")}
                >
                    {alertMessage}
                </Alert>
            )}

            {/* Top Cards Section: Default Language & Import App Translations */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Default Language Card */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 2.5,
                            border: "1px solid #eef2f6",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                            height: "100%",
                            bgcolor: "#ffffff"
                        }}
                    >
                        <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            color="#1e293b"
                            sx={{ mb: 2.5 }}
                        >
                            Default Language
                        </Typography>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            alignItems={{ xs: "stretch", sm: "center" }}
                        >
                            <Typography
                                variant="body2"
                                fontWeight={600}
                                color="#475569"
                                sx={{ minWidth: 120 }}
                            >
                                Default Language
                            </Typography>

                            <TextField
                                select
                                size="small"
                                fullWidth
                                value={selectedDefaultLangId}
                                onChange={(e) => setSelectedDefaultLangId(e.target.value)}
                                sx={{
                                    bgcolor: "#f8fafc",
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        "& fieldset": { borderColor: "#e2e8f0" }
                                    }
                                }}
                            >
                                {languagesList
                                    .filter((l) => l.isActive)
                                    .map((lang) => (
                                        <MenuItem key={lang._id} value={lang._id}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <span>{lang.flag || "🌐"}</span>
                                                <span>{lang.name}</span>
                                                <Typography variant="caption" color="text.secondary">
                                                    ({lang.code})
                                                </Typography>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                            </TextField>

                            <Button
                                variant="contained"
                                disabled={savingDefault}
                                onClick={handleSaveDefaultLanguage}
                                sx={{
                                    bgcolor: "#7c3aed",
                                    color: "#ffffff",
                                    fontWeight: 600,
                                    textTransform: "none",
                                    px: 3.5,
                                    py: 1,
                                    borderRadius: 2,
                                    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
                                    "&:hover": {
                                        bgcolor: "#6d28d9"
                                    }
                                }}
                            >
                                {savingDefault ? <CircularProgress size={20} color="inherit" /> : "Save"}
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>

                {/* Import App Translations Card */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 2.5,
                            border: "1px solid #eef2f6",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                            height: "100%",
                            bgcolor: "#ffffff"
                        }}
                    >
                        <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            color="#1e293b"
                            sx={{ mb: 2.5 }}
                        >
                            Import App Translations
                        </Typography>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            alignItems={{ xs: "stretch", sm: "center" }}
                        >
                            <Typography
                                variant="body2"
                                fontWeight={600}
                                color="#475569"
                                sx={{ minWidth: 150 }}
                            >
                                English Translation File
                            </Typography>

                            {/* Hidden file input */}
                            <input
                                type="file"
                                accept=".arb,.json"
                                ref={fileInputRef}
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                            />

                            {/* Custom File Browser Box */}
                            <Box
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                sx={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    border: "1px solid #e2e8f0",
                                    bgcolor: "#f8fafc",
                                    borderRadius: 2,
                                    px: 2,
                                    py: 0.8,
                                    cursor: "pointer",
                                    "&:hover": { borderColor: "#cbd5e1" }
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    color={importFileName ? "#1e293b" : "#94a3b8"}
                                    noWrap
                                    sx={{ fontSize: "0.85rem" }}
                                >
                                    {importFileName || "Choose app_en.arb file"}
                                </Typography>

                                <Box
                                    sx={{
                                        bgcolor: "#e2e8f0",
                                        color: "#475569",
                                        px: 1.5,
                                        py: 0.3,
                                        borderRadius: 1.5,
                                        fontSize: "0.75rem",
                                        fontWeight: 600
                                    }}
                                >
                                    Browse
                                </Box>
                            </Box>

                            <Button
                                variant="contained"
                                disabled={importing}
                                onClick={handleImportTranslations}
                                sx={{
                                    bgcolor: "#7c3aed",
                                    color: "#ffffff",
                                    fontWeight: 600,
                                    textTransform: "none",
                                    px: 3.5,
                                    py: 1,
                                    borderRadius: 2,
                                    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
                                    "&:hover": {
                                        bgcolor: "#6d28d9"
                                    }
                                }}
                            >
                                {importing ? <CircularProgress size={20} color="inherit" /> : "Import"}
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>

            {/* Add New Language Button Row */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2.5 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/admin/setup/languages/create')}
                    sx={{
                        bgcolor: "#8b5cf6",
                        color: "#ffffff",
                        fontWeight: 600,
                        textTransform: "none",
                        px: 3,
                        py: 1,
                        borderRadius: "24px",
                        boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
                        "&:hover": {
                            bgcolor: "#7c3aed"
                        }
                    }}
                >
                    Add New Language
                </Button>
            </Box>

            {/* Main Language Table Card */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 2.5,
                    border: "1px solid #eef2f6",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                    bgcolor: "#ffffff"
                }}
            >
                <Box sx={{ p: 2.5, borderBottom: "1px solid #f1f5f9" }}>
                    <Typography variant="h6" fontWeight={700} color="#1e293b">
                        Language
                    </Typography>
                </Box>

                <TableContainer>
                    <Table sx={{ minWidth: 700 }}>
                        <TableHead sx={{ bgcolor: "#fafafa" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: "#475569", width: 60 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Flutter App Lang Code</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "center" }}>RTL</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "center" }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "right", pr: 3 }}>Options</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : languagesList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#94a3b8" }}>
                                        No languages found in database.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                languagesList.map((lang, index) => {
                                    const isRtlActive = Boolean(lang.isRtl || lang.dir === "RTL");
                                    return (
                                        <TableRow
                                            key={lang._id || lang.code}
                                            hover
                                            sx={{
                                                "&:last-child td, &:last-child th": { border: 0 },
                                                transition: "background 0.2s ease"
                                            }}
                                        >
                                            {/* Index Column */}
                                            <TableCell sx={{ color: "#64748b", fontWeight: 600 }}>
                                                {index + 1}
                                            </TableCell>

                                            {/* Name Column */}
                                            <TableCell>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Typography sx={{ fontSize: "1.2rem" }}>
                                                        {lang.flag || "🌐"}
                                                    </Typography>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600} color="#1e293b">
                                                            {lang.name}
                                                        </Typography>
                                                        {lang.isDefault && (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: "#7c3aed",
                                                                    fontWeight: 700,
                                                                    bgcolor: "#f3e8ff",
                                                                    px: 1,
                                                                    py: 0.2,
                                                                    borderRadius: 1
                                                                }}
                                                            >
                                                                Default System
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Stack>
                                            </TableCell>

                                            {/* Code Column */}
                                            <TableCell sx={{ color: "#334155", fontWeight: 500 }}>
                                                {lang.code}
                                            </TableCell>

                                            {/* Flutter App Lang Code Column */}
                                            <TableCell sx={{ color: "#334155", fontWeight: 500 }}>
                                                {lang.app_code || lang.code}
                                            </TableCell>

                                            {/* RTL Switch Column */}
                                            <TableCell align="center">
                                                <Switch
                                                    checked={isRtlActive}
                                                    onChange={() => handleToggleRtl(lang._id)}
                                                    color="success"
                                                    sx={{
                                                        "& .MuiSwitch-switchBase.Mui-checked": {
                                                            color: "#22c55e",
                                                            "& + .MuiSwitch-track": {
                                                                backgroundColor: "#22c55e"
                                                            }
                                                        }
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Status Switch Column */}
                                            <TableCell align="center">
                                                <Switch
                                                    checked={Boolean(lang.isActive)}
                                                    disabled={Boolean(lang.isDefault)}
                                                    onChange={() => handleToggleStatus(lang._id)}
                                                    color="success"
                                                    sx={{
                                                        "& .MuiSwitch-switchBase.Mui-checked": {
                                                            color: "#22c55e",
                                                            "& + .MuiSwitch-track": {
                                                                backgroundColor: "#22c55e"
                                                            }
                                                        }
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Options Action Pills Column matching Screenshot 2 */}
                                            <TableCell align="right" sx={{ pr: 3 }}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    justifyContent="flex-end"
                                                    alignItems="center"
                                                >
                                                    {/* 🟣 Purple: Web Translation Key-Value Editor */}
                                                    <Tooltip title="Translate Website Strings" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenTranslationEditor(lang, "web")}
                                                            sx={{
                                                                width: 36,
                                                                height: 36,
                                                                bgcolor: "#f3e8ff",
                                                                color: "#9333ea",
                                                                "&:hover": { bgcolor: "#e9d5ff" },
                                                                transition: "all 0.2s ease"
                                                            }}
                                                        >
                                                            <TranslateIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {/* 🟡 Yellow: App Translation Key-Value Editor */}
                                                    <Tooltip title="Translate App Strings" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenTranslationEditor(lang, "app")}
                                                            sx={{
                                                                width: 36,
                                                                height: 36,
                                                                bgcolor: "#fef3c7",
                                                                color: "#d97706",
                                                                "&:hover": { bgcolor: "#fde68a" },
                                                                transition: "all 0.2s ease"
                                                            }}
                                                        >
                                                            <AppTranslateIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {/* 🟢 Green: Export Translation File */}
                                                    <Tooltip title="Export / Download Translations" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleExportTranslations(lang, "web")}
                                                            sx={{
                                                                width: 36,
                                                                height: 36,
                                                                bgcolor: "#ecfdf5",
                                                                color: "#10b981",
                                                                "&:hover": { bgcolor: "#d1fae5" },
                                                                transition: "all 0.2s ease"
                                                            }}
                                                        >
                                                            <ExportIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {/* 🔵 Blue: Edit Language Page */}
                                                    <Tooltip title="Edit Language Details" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/admin/setup/languages/${lang._id}/edit`)}
                                                            sx={{
                                                                width: 36,
                                                                height: 36,
                                                                bgcolor: "#f0f9ff",
                                                                color: "#0284c7",
                                                                "&:hover": { bgcolor: "#e0f2fe" },
                                                                transition: "all 0.2s ease"
                                                            }}
                                                        >
                                                            <EditIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {/* 🔴 Red: Delete Language (Hidden for default) */}
                                                    {!lang.isDefault && (
                                                        <Tooltip title="Delete Language" arrow>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteLanguage(lang._id, lang.isDefault)}
                                                                sx={{
                                                                    width: 36,
                                                                    height: 36,
                                                                    bgcolor: "#fef2f2",
                                                                    color: "#ef4444",
                                                                    "&:hover": { bgcolor: "#fee2e2" },
                                                                    transition: "all 0.2s ease"
                                                                }}
                                                            >
                                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Modal 2: Dynamic Translation Strings Key-Value Editor */}
            <Dialog
                open={openTransModal}
                onClose={() => setOpenTransModal(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, height: "85vh" } }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h6" fontWeight={700} color="#1e293b">
                                {transType === "app" ? "App Translations" : "Website Translations"} -{" "}
                                {activeTransLang?.name} ({activeTransLang?.code})
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Modify database translation values dynamically across the system.
                            </Typography>
                        </Box>

                        <TextField
                            size="small"
                            placeholder="Search translation key or text..."
                            value={transSearch}
                            onChange={(e) => {
                                setTransSearch(e.target.value);
                                setTransPage(0);
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                                    </InputAdornment>
                                )
                            }}
                            sx={{ width: 280 }}
                        />
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0 }}>
                    {transLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer sx={{ maxHeight: "calc(85vh - 200px)" }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, width: "30%", bgcolor: "#f8fafc" }}>
                                            Translation Key
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: "35%", bgcolor: "#f8fafc" }}>
                                            Default Reference (English)
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: "35%", bgcolor: "#f8fafc" }}>
                                            Translated Text ({activeTransLang?.name})
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {paginatedKeyEntries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 4, color: "#94a3b8" }}>
                                                No translation keys matching search query.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedKeyEntries.map((item) => (
                                            <TableRow key={item.key} hover>
                                                <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#64748b" }}>
                                                    {item.key}
                                                </TableCell>

                                                <TableCell sx={{ fontSize: "0.85rem", color: "#334155" }}>
                                                    {item.defaultVal || "-"}
                                                </TableCell>

                                                <TableCell>
                                                    <TextField
                                                        size="small"
                                                        fullWidth
                                                        variant="outlined"
                                                        value={transData[item.key] ?? item.defaultVal ?? ""}
                                                        dir={activeTransLang?.isRtl ? "rtl" : "ltr"}
                                                        onChange={(e) =>
                                                            setTransData({
                                                                ...transData,
                                                                [item.key]: e.target.value
                                                            })
                                                        }
                                                        sx={{
                                                            "& .MuiInputBase-input": {
                                                                fontSize: "0.85rem",
                                                                py: 0.8
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>

                {/* Pagination and Dialog Actions */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        bgcolor: "#ffffff"
                    }}
                >
                    <TablePagination
                        component="div"
                        count={filteredKeyEntries.length}
                        page={transPage}
                        onPageChange={(e, newPage) => setTransPage(newPage)}
                        rowsPerPage={transRowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setTransRowsPerPage(parseInt(e.target.value, 10));
                            setTransPage(0);
                        }}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        sx={{ border: "none" }}
                    />

                    <Stack direction="row" spacing={1.5}>
                        <Button
                            onClick={() => setOpenTransModal(false)}
                            sx={{ textTransform: "none", color: "#64748b" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={savingTrans ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            disabled={savingTrans}
                            onClick={handleSaveTranslations}
                            sx={{
                                bgcolor: "#7c3aed",
                                textTransform: "none",
                                fontWeight: 600,
                                px: 3,
                                "&:hover": { bgcolor: "#6d28d9" }
                            }}
                        >
                            {savingTrans ? "Saving..." : "Save Translations"}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </Box>
    );
};

export default LanguageSettings;
