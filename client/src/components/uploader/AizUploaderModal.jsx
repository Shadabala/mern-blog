import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, TextField, Select, MenuItem, FormControl,
    Checkbox, FormControlLabel, Button, IconButton, Tabs, Tab,
    CircularProgress, Card, CardContent, CardMedia, Stack, Pagination,
    styled, useTheme
} from '@mui/material';
import {
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Search as SearchIcon,
    InsertDriveFile as FileIcon,
    VideoLibrary as VideoIcon,
    Audiotrack as AudioIcon,
    FolderZip as ArchiveIcon
} from '@mui/icons-material';

import UppyUploader from './UppyUploader';
import { fetchUploadedFilesApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';

const StyledFileCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'isSelected'
})(({ theme, isSelected }) => ({
    position: 'relative',
    border: isSelected ? `2.5px solid ${theme.palette.primary.main}` : '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: isSelected ? '0 0 0 2px rgba(124, 58, 237, 0.2)' : 'none',
    backgroundColor: isSelected ? '#f5f3ff' : '#ffffff',
    '&:hover': {
        borderColor: theme.palette.primary.main,
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }
}));

const CheckIndicator = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
}));

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AizUploaderModal = ({
    open,
    onClose,
    onSelect,
    selectedValues = [],
    multiple = false,
    type = 'all' // 'image' | 'video' | 'audio' | 'all'
}) => {
    const { t } = useLanguage();
    const theme = useTheme();

    const [activeTab, setActiveTab] = useState(0); // 0: Select File, 1: Upload New
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter & Search states
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Selected files: array of full file objects
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Initialize selected items ONLY when modal transitions from closed to open
    const prevOpenRef = useRef(false);
    useEffect(() => {
        if (open && !prevOpenRef.current) {
            const normalized = Array.isArray(selectedValues)
                ? selectedValues.filter(Boolean)
                : (selectedValues ? [selectedValues] : []);
            setSelectedFiles(normalized);
        }
        prevOpenRef.current = open;
    }, [open, selectedValues]);

    // Fetch files from server
    const loadFiles = useCallback(async (searchTerm = search, pageNum = page) => {
        setLoading(true);
        try {
            const res = await fetchUploadedFilesApi({
                search: (searchTerm || '').trim() || undefined,
                sort,
                type: type && type !== 'all' ? type : undefined,
                page: pageNum,
                limit: 30
            });
            if (res && res.data) {
                setFiles(res.data);
                setTotalPages(res.last_page || 1);
            }
        } catch (error) {
            console.error('Error fetching files for uploader:', error);
        } finally {
            setLoading(false);
        }
    }, [sort, type, search, page]);

    useEffect(() => {
        if (open && activeTab === 0) {
            loadFiles(search, page);
        }
    }, [open, activeTab, sort, page]);

    // Handle search with debounce
    useEffect(() => {
        if (!open || activeTab !== 0) return;
        const timer = setTimeout(() => {
            setPage(1);
            loadFiles(search, 1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search, open, activeTab]);

    const isFileSelected = (file) => {
        if (!file) return false;
        const fileId = file._id || file.id;
        const fileUrl = file.url;
        const fileName = file.file_name;

        return selectedFiles.some(item => {
            if (!item) return false;
            if (typeof item === 'object') {
                const itemId = item._id || item.id;
                if (fileId && itemId && String(fileId) === String(itemId)) return true;
                if (fileUrl && item.url && fileUrl === item.url) return true;
                if (fileName && item.file_name && fileName === item.file_name) return true;
                return false;
            }
            if (fileId && String(item) === String(fileId)) return true;
            if (fileUrl && String(item) === String(fileUrl)) return true;
            if (fileName && String(item) === String(fileName)) return true;
            return false;
        });
    };

    const handleToggleSelect = (file) => {
        const alreadySelected = isFileSelected(file);

        if (multiple) {
            if (alreadySelected) {
                setSelectedFiles(prev => prev.filter(item => {
                    const currentId = (typeof item === 'object' ? (item._id || item.id || item.url || item.file_name) : item);
                    const fileId = file._id || file.id || file.url || file.file_name;
                    return String(currentId) !== String(fileId) && item !== file.url && item !== file.file_name;
                }));
            } else {
                setSelectedFiles(prev => [...prev, file]);
            }
        } else {
            // Single select mode
            if (alreadySelected) {
                setSelectedFiles([]);
            } else {
                setSelectedFiles([file]);
            }
        }
    };

    const handleDoubleClick = (file) => {
        if (onSelect) {
            onSelect(multiple ? [file] : file);
        }
        if (onClose) {
            onClose();
        }
    };

    const handleClearSelection = () => {
        setSelectedFiles([]);
    };

    const handleAddSelected = () => {
        if (onSelect) {
            if (multiple) {
                onSelect(selectedFiles);
            } else {
                onSelect(selectedFiles.length > 0 ? selectedFiles[0] : null);
            }
        }
        if (onClose) {
            onClose();
        }
    };

    // Callback when Uppy completes an upload
    const handleUppyUploadSuccess = (file, responseBody) => {
        if (responseBody && responseBody.data) {
            const newFile = responseBody.data;
            if (multiple) {
                setSelectedFiles(prev => [...prev, newFile]);
            } else {
                setSelectedFiles([newFile]);
            }
        }
    };

    const handleUppyComplete = () => {
        // Automatically switch to Select File tab and reload files
        setActiveTab(0);
        loadFiles();
    };

    const displayedFiles = showSelectedOnly
        ? files.filter(f => isFileSelected(f))
        : files;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    height: '85vh',
                    maxHeight: '750px',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            {/* Modal Header matching AIZ Uploader */}
            <DialogTitle
                sx={{
                    p: 0,
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 3,
                    pt: 2
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(e, val) => setActiveTab(val)}
                    sx={{
                        minHeight: 44,
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            minHeight: 44,
                            color: '#475569',
                            '&.Mui-selected': {
                                color: theme.palette.primary.main
                            }
                        }
                    }}
                >
                    <Tab label={t("uploader.selectFile", "Select File")} />
                    <Tab label={t("uploader.uploadNew", "Upload New")} />
                </Tabs>

                <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            {/* Modal Body */}
            <DialogContent sx={{ p: 3, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 0 ? (
                    <Box display="flex" flexDirection="column" height="100%">
                        {/* Filter & Search Toolbar */}
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            flexWrap="wrap"
                            gap={2}
                            pb={2}
                            mb={2}
                            borderBottom="1px solid #e2e8f0"
                        >
                            <Box display="flex" alignItems="center" gap={2}>
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <Select
                                        value={sort}
                                        onChange={(e) => {
                                            setSort(e.target.value);
                                            setPage(1);
                                        }}
                                        sx={{ fontSize: '0.85rem' }}
                                    >
                                        <MenuItem value="newest">{t("uploader.sortNewest", "Sort by newest")}</MenuItem>
                                        <MenuItem value="oldest">{t("uploader.sortOldest", "Sort by oldest")}</MenuItem>
                                        <MenuItem value="smallest">{t("uploader.sortSmallest", "Sort by smallest")}</MenuItem>
                                        <MenuItem value="largest">{t("uploader.sortLargest", "Sort by largest")}</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={showSelectedOnly}
                                            onChange={(e) => setShowSelectedOnly(e.target.checked)}
                                        />
                                    }
                                    label={<Typography variant="body2">{t("uploader.selectedOnly", "Selected Only")}</Typography>}
                                />
                            </Box>

                            <Box sx={{ width: { xs: '100%', sm: 240 } }}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder={t("uploader.searchFiles", "Search your files")}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    InputProps={{
                                        startAdornment: <SearchIcon fontSize="small" sx={{ color: '#94a3b8', mr: 1 }} />
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Files Grid View */}
                        <Box flex={1} overflow="auto" minHeight={280}>
                            {loading ? (
                                <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={240}>
                                    <CircularProgress size={36} />
                                </Box>
                            ) : displayedFiles.length === 0 ? (
                                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" minHeight={240}>
                                    <Typography variant="h6" color="textSecondary" fontWeight={600}>
                                        {t("uploader.noFilesFound", "No files found")}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        sx={{ mt: 2 }}
                                        onClick={() => setActiveTab(1)}
                                    >
                                        {t("uploader.uploadNow", "Upload Now")}
                                    </Button>
                                </Box>
                            ) : (
                                <Box
                                    display="grid"
                                    gridTemplateColumns="repeat(auto-fill, minmax(130px, 1fr))"
                                    gap={2}
                                    pb={2}
                                >
                                    {displayedFiles.map((file) => {
                                        const selected = isFileSelected(file);
                                        return (
                                            <StyledFileCard
                                                key={file._id || file.id || file.url}
                                                isSelected={selected}
                                                onClick={() => handleToggleSelect(file)}
                                                onDoubleClick={() => handleDoubleClick(file)}
                                                title={`${file.file_original_name}.${file.extension}`}
                                            >
                                                {selected && (
                                                    <CheckIndicator>
                                                        <CheckCircleIcon color="primary" sx={{ fontSize: 20 }} />
                                                    </CheckIndicator>
                                                )}

                                                <Box
                                                    sx={{
                                                        height: 100,
                                                        backgroundColor: '#f1f5f9',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {file.type === 'image' ? (
                                                        <CardMedia
                                                            component="img"
                                                            src={file.url}
                                                            alt={file.file_original_name}
                                                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : file.type === 'video' ? (
                                                        <VideoIcon sx={{ fontSize: 44, color: '#64748b' }} />
                                                    ) : file.type === 'audio' ? (
                                                        <AudioIcon sx={{ fontSize: 44, color: '#64748b' }} />
                                                    ) : file.type === 'archive' ? (
                                                        <ArchiveIcon sx={{ fontSize: 44, color: '#64748b' }} />
                                                    ) : (
                                                        <FileIcon sx={{ fontSize: 44, color: '#64748b' }} />
                                                    )}
                                                </Box>

                                                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                                    <Typography
                                                        variant="caption"
                                                        fontWeight={600}
                                                        noWrap
                                                        display="block"
                                                        title={`${file.file_original_name}.${file.extension}`}
                                                    >
                                                        {file.file_original_name}.{file.extension}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary" display="block">
                                                        {formatBytes(file.file_size)}
                                                    </Typography>
                                                </CardContent>
                                            </StyledFileCard>
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Box display="flex" justifyContent="center" pt={2} borderTop="1px solid #e2e8f0">
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={(e, val) => setPage(val)}
                                    color="primary"
                                    size="small"
                                />
                            </Box>
                        )}
                    </Box>
                ) : (
                    /* Tab 1: Upload New File with Uppy Dashboard */
                    <Box height="100%" display="flex" flexDirection="column">
                        <UppyUploader
                            onUploadSuccess={handleUppyUploadSuccess}
                            onComplete={handleUppyComplete}
                            type={type}
                            height={420}
                        />
                    </Box>
                )}
            </DialogContent>

            {/* Footer Bar matching AIZ Uploader */}
            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    backgroundColor: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body2" fontWeight={600} color="textSecondary">
                        {selectedFiles.length} {t("uploader.fileSelected", "File(s) selected")}
                    </Typography>
                    {selectedFiles.length > 0 && (
                        <Button
                            variant="text"
                            color="error"
                            size="small"
                            onClick={handleClearSelection}
                            sx={{ textTransform: 'none', p: 0, minWidth: 'auto', fontWeight: 600 }}
                        >
                            {t("uploader.clear", "Clear")}
                        </Button>
                    )}
                </Box>

                <Stack direction="row" spacing={1.5}>
                    <Button variant="outlined" color="inherit" onClick={onClose} sx={{ textTransform: 'none' }}>
                        {t("uploader.cancel", "Cancel")}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddSelected}
                        disabled={selectedFiles.length === 0}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {t("uploader.addFiles", "Add Files")}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
};

export default AizUploaderModal;
