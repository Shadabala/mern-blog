import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Card, CardContent, Typography, Button, TextField, Select,
    MenuItem, FormControl, Checkbox, FormControlLabel, IconButton, Menu,
    Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
    Pagination, Table, TableBody, TableCell, TableRow,
    styled
} from '@mui/material';
import { toast } from '../../utils/toast';
import { confirmDelete } from '../../utils/swal';
import {
    CloudUploadOutlined as UploadIcon,
    MoreVert as MoreVertIcon,
    InfoOutlined as InfoIcon,
    DownloadOutlined as DownloadIcon,
    ContentCopyOutlined as CopyIcon,
    DeleteOutline as DeleteIcon,
    InsertDriveFile as FileIcon,
    VideoLibrary as VideoIcon,
    Audiotrack as AudioIcon,
    FolderZip as ArchiveIcon,
    Close as CloseIcon
} from '@mui/icons-material';

import {
    fetchUploadedFilesApi,
    deleteUploadedFileApi,
    bulkDeleteUploadedFilesApi,
    fetchFileInfoApi
} from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const BACKEND_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileBox = styled(Box)(({ theme }) => ({
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    position: 'relative',
    transition: 'all 0.2s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.06)',
        borderColor: theme.palette.primary.main
    }
}));

const UploadedFiles = () => {
    const { t } = useLanguage();
    const { hasPermission } = useAuth();
    const navigate = useNavigate();

    const canCreate = hasPermission('uploads_create');
    const canDelete = hasPermission('uploads_delete');

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Selection
    const [selectedIds, setSelectedIds] = useState([]);

    // Action Menu & Details Dialog
    const [anchorEl, setAnchorEl] = useState(null);
    const [activeFile, setActiveFile] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [fileDetails, setFileDetails] = useState(null);

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchUploadedFilesApi({
                search: searchQuery || undefined,
                sort,
                page,
                limit: 60
            });
            if (res && res.data) {
                setFiles(res.data);
                setTotalPages(res.last_page || 1);
            }
        } catch (error) {
            console.error('Error fetching uploaded files:', error);
            toast.error(t("uploader.fetchError", "Failed to load uploaded files"));
        } finally {
            setLoading(false);
        }
    }, [searchQuery, sort, page, t]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        setSearchQuery(search.trim());
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(files.map(f => f._id || f.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleMenuOpen = (e, file) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setActiveFile(file);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleShowDetails = async () => {
        if (!activeFile) return;
        handleMenuClose();
        setDetailsModalOpen(true);
        setDetailsLoading(true);
        try {
            const res = await fetchFileInfoApi(activeFile._id || activeFile.id);
            if (res && res.data) {
                setFileDetails(res.data);
            } else {
                setFileDetails(activeFile);
            }
        } catch (err) {
            setFileDetails(activeFile);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleCopyLink = (url) => {
        handleMenuClose();
        navigator.clipboard.writeText(url);
        toast.success(t("uploader.linkCopied", "Link copied to clipboard"));
    };

    const handleDeleteSingle = async () => {
        if (!activeFile) return;
        const id = activeFile._id || activeFile.id;
        handleMenuClose();

        const confirmed = await confirmDelete({
            title: t("uploader.deleteFileTitle", "Delete File?"),
            text: t("uploader.confirmDeleteSingle", "Are you sure you want to delete this file? This cannot be undone."),
            itemName: activeFile.file_original_name || activeFile.file_name,
            confirmButtonText: t("Yes, delete it!"),
            cancelButtonText: t("Cancel")
        });

        if (confirmed) {
            try {
                await deleteUploadedFileApi(id);
                toast.success(t("uploader.deleteSuccess", "File deleted successfully"));
                setSelectedIds(prev => prev.filter(item => item !== id));
                loadFiles();
            } catch (error) {
                toast.error(t("uploader.deleteError", "Failed to delete file"));
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warning(t("uploader.selectAtLeastOne", "Please select at least one file to delete"));
            return;
        }

        const confirmed = await confirmDelete({
            title: t("uploader.bulkDeleteTitle", "Delete Selected Files?"),
            text: t("uploader.confirmBulkDelete", `Are you sure you want to delete ${selectedIds.length} selected file(s)?`),
            confirmButtonText: t("Yes, delete selection"),
            cancelButtonText: t("Cancel")
        });

        if (confirmed) {
            try {
                await bulkDeleteUploadedFilesApi(selectedIds);
                toast.success(t("uploader.bulkDeleteSuccess", "Selected files deleted successfully"));
                setSelectedIds([]);
                loadFiles();
            } catch (error) {
                toast.error(t("uploader.bulkDeleteError", "Failed to delete selected files"));
            }
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Top Title Bar matching base-module */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight={700} color="#1e293b">
                    {t("uploader.allUploadedFiles", "All uploaded files")}
                </Typography>

                {canCreate && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<UploadIcon />}
                        onClick={() => navigate('/admin/uploaded-files/create')}
                        sx={{ textTransform: 'none', fontWeight: 600, px: 2.5, borderRadius: '8px' }}
                    >
                        {t("uploader.uploadNewFile", "Upload New File")}
                    </Button>
                )}
            </Box>

            {/* Main Content Card */}
            <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Filter & Action Header */}
                <Box
                    sx={{
                        p: 2.5,
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2
                    }}
                >
                    {/* Bulk Action */}
                    <Box display="flex" alignItems="center" gap={1.5}>
                        {canDelete && (
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={handleBulkDelete}
                                disabled={selectedIds.length === 0}
                                startIcon={<DeleteIcon />}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                {t("uploader.deleteSelection", "Delete selection")} ({selectedIds.length})
                            </Button>
                        )}
                    </Box>

                    {/* Right Filters */}
                    <Box display="flex" alignItems="center" flexWrap="wrap" gap={1.5}>
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

                        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                            <TextField
                                size="small"
                                placeholder={t("uploader.searchFiles", "Search your files")}
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    if (e.target.value === '' && searchQuery !== '') {
                                        setSearchQuery('');
                                        setPage(1);
                                    }
                                }}
                                sx={{ width: { xs: 150, sm: 200 } }}
                            />
                            <Button
                                type="submit"
                                variant="outlined"
                                className="btn-outline-primary"
                                size="small"
                                sx={{
                                    color: "var(--primary-color, #2563eb)",
                                    borderColor: "var(--primary-color, #2563eb)",
                                    backgroundColor: "transparent",
                                    '&:hover': {
                                        color: '#ffffff',
                                        backgroundColor: 'var(--primary-color, #2563eb)',
                                        borderColor: 'var(--primary-color, #2563eb)'
                                    },
                                    textTransform: 'none',
                                    px: 2
                                }}
                            >
                                {t("uploader.search", "Search")}
                            </Button>
                        </form>
                    </Box>
                </Box>

                {/* Card Body with Files Grid */}
                <CardContent sx={{ p: 3 }}>
                    {/* Select All Checkbox */}
                    {files.length > 0 && canDelete && (
                        <Box mb={2}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={files.length > 0 && selectedIds.length === files.length}
                                        indeterminate={selectedIds.length > 0 && selectedIds.length < files.length}
                                        onChange={handleSelectAll}
                                    />
                                }
                                label={<Typography variant="body2" fontWeight={600}>{t("uploader.selectAll", "Select All")}</Typography>}
                            />
                        </Box>
                    )}

                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                            <CircularProgress />
                        </Box>
                    ) : files.length === 0 ? (
                        <Box textAlign="center" py={10}>
                            <Typography variant="h6" color="textSecondary">
                                {t("uploader.noFilesFound", "No files found")}
                            </Typography>
                            {canCreate && (
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    sx={{ mt: 2 }}
                                    onClick={() => navigate('/admin/uploaded-files/create')}
                                >
                                    {t("uploader.uploadNow", "Upload Now")}
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <Box
                            display="grid"
                            gridTemplateColumns="repeat(auto-fill, minmax(160px, 1fr))"
                            gap={2.5}
                        >
                            {files.map((file) => {
                                const fileId = file._id || file.id;
                                const isChecked = selectedIds.includes(fileId);

                                return (
                                    <FileBox key={fileId}>
                                        {/* Top Action Dropdown */}
                                        <Box position="absolute" top={6} right={6} zIndex={2}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleMenuOpen(e, file)}
                                                sx={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', p: 0.5 }}
                                            >
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        {/* Checkbox */}
                                        {canDelete && (
                                            <Box position="absolute" top={6} left={6} zIndex={2}>
                                                <Checkbox
                                                    size="small"
                                                    checked={isChecked}
                                                    onChange={() => handleSelectOne(fileId)}
                                                    sx={{ p: 0.5, backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: '4px' }}
                                                />
                                            </Box>
                                        )}

                                        {/* Thumbnail Preview */}
                                        <Box
                                            sx={{
                                                height: 130,
                                                backgroundColor: '#f8fafc',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                setActiveFile(file);
                                                handleShowDetails();
                                            }}
                                        >
                                            {file.type === 'image' ? (
                                                <img
                                                    src={file.url}
                                                    alt={file.file_original_name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        const fallback = file.local_url || (file.file_name ? `${BACKEND_BASE}/${file.file_name}` : null);
                                                        if (fallback && e.currentTarget.src !== fallback) {
                                                            e.currentTarget.src = fallback;
                                                        }
                                                    }}
                                                />
                                            ) : file.type === 'video' ? (
                                                <VideoIcon sx={{ fontSize: 52, color: '#64748b' }} />
                                            ) : file.type === 'audio' ? (
                                                <AudioIcon sx={{ fontSize: 52, color: '#64748b' }} />
                                            ) : file.type === 'archive' ? (
                                                <ArchiveIcon sx={{ fontSize: 52, color: '#64748b' }} />
                                            ) : (
                                                <FileIcon sx={{ fontSize: 52, color: '#64748b' }} />
                                            )}
                                        </Box>

                                        {/* File Details Footer */}
                                        <Box p={1.5}>
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                noWrap
                                                title={`${file.file_original_name}.${file.extension}`}
                                                sx={{ color: '#1e293b' }}
                                            >
                                                {file.file_original_name}.{file.extension}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" display="block">
                                                {formatBytes(file.file_size)}
                                            </Typography>
                                        </Box>
                                    </FileBox>
                                );
                            })}
                        </Box>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box display="flex" justifyContent="center" mt={4}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(e, val) => setPage(val)}
                                color="primary"
                            />
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Context Menu for File Actions */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{ sx: { borderRadius: '8px', minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
            >
                <MenuItem onClick={handleShowDetails} sx={{ fontSize: '0.875rem' }}>
                    <InfoIcon fontSize="small" sx={{ mr: 1.5, color: '#3b82f6' }} />
                    {t("uploader.detailsInfo", "Details Info")}
                </MenuItem>
                {activeFile && (
                    <MenuItem
                        component="a"
                        href={activeFile.url}
                        download={`${activeFile.file_original_name}.${activeFile.extension}`}
                        target="_blank"
                        onClick={handleMenuClose}
                        sx={{ fontSize: '0.875rem' }}
                    >
                        <DownloadIcon fontSize="small" sx={{ mr: 1.5, color: '#10b981' }} />
                        {t("uploader.download", "Download")}
                    </MenuItem>
                )}
                {activeFile && (
                    <MenuItem onClick={() => handleCopyLink(activeFile.url)} sx={{ fontSize: '0.875rem' }}>
                        <CopyIcon fontSize="small" sx={{ mr: 1.5, color: '#8b5cf6' }} />
                        {t("uploader.copyLink", "Copy Link")}
                    </MenuItem>
                )}
                {canDelete && (
                    <MenuItem onClick={handleDeleteSingle} sx={{ fontSize: '0.875rem', color: '#ef4444' }}>
                        <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
                        {t("uploader.delete", "Delete")}
                    </MenuItem>
                )}
            </Menu>

            {/* File Info Details Modal */}
            <Dialog
                open={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px' } }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={700}>
                        {t("uploader.fileInfo", "File Info")}
                    </Typography>
                    <IconButton size="small" onClick={() => setDetailsModalOpen(false)}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    {detailsLoading ? (
                        <Box display="flex" justifyContent="center" py={6}>
                            <CircularProgress />
                        </Box>
                    ) : fileDetails ? (
                        <Box>
                            {/* Preview */}
                            <Box
                                sx={{
                                    height: 220,
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 3,
                                    overflow: 'hidden',
                                    border: '1px solid #e2e8f0'
                                }}
                            >
                                {fileDetails.type === 'image' ? (
                                    <img
                                        src={fileDetails.url}
                                        alt={fileDetails.file_original_name}
                                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                        onError={(e) => {
                                            const fallback = fileDetails.local_url || (fileDetails.file_name ? `${BACKEND_BASE}/${fileDetails.file_name}` : null);
                                            if (fallback && e.currentTarget.src !== fallback) {
                                                e.currentTarget.src = fallback;
                                            }
                                        }}
                                    />
                                ) : (
                                    <FileIcon sx={{ fontSize: 72, color: '#94a3b8' }} />
                                )}
                            </Box>

                            {/* Details Table */}
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: 140 }}>{t("uploader.fileName", "File Name")}</TableCell>
                                        <TableCell>{fileDetails.file_original_name}.{fileDetails.extension}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>{t("uploader.fileType", "File Type")}</TableCell>
                                        <TableCell sx={{ textTransform: 'capitalize' }}>{fileDetails.type}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>{t("uploader.fileSize", "File Size")}</TableCell>
                                        <TableCell>{formatBytes(fileDetails.file_size)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>{t("uploader.uploadedBy", "Uploaded By")}</TableCell>
                                        <TableCell>{fileDetails.user?.name || fileDetails.user?.username || 'Admin'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>{t("uploader.uploadedAt", "Uploaded At")}</TableCell>
                                        <TableCell>{new Date(fileDetails.created_at || fileDetails.createdAt).toLocaleString()}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>{t("uploader.fileUrl", "File URL")}</TableCell>
                                        <TableCell sx={{ wordBreak: 'break-all' }}>
                                            <Typography variant="caption" color="primary">
                                                {fileDetails.url}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Box>
                    ) : null}
                </DialogContent>

                <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
                    {fileDetails && (
                        <Button
                            variant="outlined"
                            startIcon={<CopyIcon />}
                            onClick={() => handleCopyLink(fileDetails.url)}
                            sx={{ textTransform: 'none' }}
                        >
                            {t("uploader.copyLink", "Copy Link")}
                        </Button>
                    )}
                    <Button variant="contained" onClick={() => setDetailsModalOpen(false)} sx={{ textTransform: 'none' }}>
                        {t("uploader.close", "Close")}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default UploadedFiles;
