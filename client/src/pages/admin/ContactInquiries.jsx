import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    Button, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Checkbox, IconButton, Stack, Tooltip, Breadcrumbs, Link as MuiLink
} from '@mui/material';
import {
    Reply as ReplyIcon,
    DeleteOutline as DeleteIcon,
    MailOutlineOutlined as ContactIcon,
    Send as SendIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

import { fetchContacts, replyContactApi, deleteContactApi, bulkDeleteContactsApi } from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';
import { confirmDelete } from '../../utils/swal';

const ContactInquiries = () => {
    const { t } = useLanguage();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState({ type: 'info', text: '' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [replyOpen, setReplyOpen] = useState(false);
    const [activeInquiry, setActiveInquiry] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    const loadContactsData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchContacts();
            if (data?.success) setContacts(data.contacts || []);
        } catch {
            setAlertMessage({ type: 'error', text: t('Error loading contact inquiries.') });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadContactsData();
    }, [loadContactsData]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(contacts.map((c) => c._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((item) => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!activeInquiry) return;
        try {
            setSendingReply(true);
            await replyContactApi(activeInquiry._id, replyText);
            const msg = t('Reply sent and saved successfully!');
            setAlertMessage({ type: 'success', text: msg });
            toast.success(msg);
            setReplyOpen(false);
            setReplyText('');
            loadContactsData();
        } catch (err) {
            const msg = err.response?.data?.message || t('Error submitting reply.');
            setAlertMessage({
                type: 'error',
                text: msg
            });
            toast.error(msg);
        } finally {
            setSendingReply(false);
        }
    };

    const handleDeleteInquiry = async (inquiry) => {
        if (!inquiry) return;
        const confirmed = await confirmDelete({
            title: t('Delete Inquiry?'),
            text: t(`Are you sure you want to delete inquiry from "${inquiry.name || inquiry.email}"?`),
            confirmButtonText: t('Yes, delete it!'),
            cancelButtonText: t('Cancel')
        });

        if (confirmed) {
            try {
                await deleteContactApi(inquiry._id);
                const msg = t('Inquiry deleted successfully.');
                setAlertMessage({ type: 'success', text: msg });
                toast.success(msg);
                loadContactsData();
            } catch {
                const msg = t('Error deleting inquiry.');
                setAlertMessage({ type: 'error', text: msg });
                toast.error(msg);
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const confirmed = await confirmDelete({
            title: t('Delete Inquiries?'),
            text: t(`Are you sure you want to delete ${selectedIds.length} selected inquiries?`),
            confirmButtonText: t('Yes, delete selection'),
            cancelButtonText: t('Cancel')
        });

        if (confirmed) {
            try {
                await bulkDeleteContactsApi(selectedIds);
                const msg = t('Selected inquiries deleted successfully.');
                setAlertMessage({ type: 'success', text: msg });
                toast.success(msg);
                setSelectedIds([]);
                loadContactsData();
            } catch {
                const msg = t('Error executing bulk delete.');
                setAlertMessage({ type: 'error', text: msg });
                toast.error(msg);
            }
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header & Breadcrumb */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <ContactIcon sx={{ color: '#6366f1', fontSize: 30 }} />
                        <Typography variant="h5" fontWeight={700} color="#1e293b">
                            {t("Contact Enquiries & Support")}
                        </Typography>
                    </Box>
                    <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.85rem', mt: 0.5 }}>
                        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/admin/dashboard">
                            {t("Dashboard")}
                        </MuiLink>
                        <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>
                            {t("Contact Enquiries")}
                        </Typography>
                    </Breadcrumbs>
                </Box>

                {selectedIds.length > 0 && (
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleBulkDelete}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                        {t("Delete Selected")} ({selectedIds.length})
                    </Button>
                )}
            </Box>

            {alertMessage.text && (
                <Alert
                    severity={alertMessage.type}
                    sx={{ mb: 3, borderRadius: 2 }}
                    onClose={() => setAlertMessage({ type: 'info', text: '' })}
                >
                    {alertMessage.text}
                </Alert>
            )}

            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={contacts.length > 0 && selectedIds.length === contacts.length}
                                            onChange={handleSelectAll}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Name")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Email")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Subject")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Message")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{t("Status")}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">{t("Actions")}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {contacts.length > 0 ? (
                                    contacts.map((c) => (
                                        <TableRow key={c._id} selected={selectedIds.includes(c._id)} hover>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedIds.includes(c._id)}
                                                    onChange={() => handleSelectOne(c._id)}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                {c.name}
                                                {c.company && (
                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontWeight: 400 }}>
                                                        {c.company}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ color: '#475569' }}>
                                                <Typography variant="body2" sx={{ color: '#1e293b' }}>{c.email}</Typography>
                                                {c.phone && (
                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                                        {c.phone}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{c.subject}</TableCell>
                                            <TableCell sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>
                                                {c.message}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={c.status === 'replied' ? t("Replied") : t("Pending")}
                                                    color={c.status === 'replied' ? 'success' : 'warning'}
                                                    size="small"
                                                    sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Tooltip title={t("Reply via Email")}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => { setActiveInquiry(c); setReplyText(c.reply || ''); setReplyOpen(true); }}
                                                            sx={{ color: '#6366f1', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' } }}
                                                        >
                                                            <ReplyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={t("Delete")}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteInquiry(c)}
                                                            sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                                            {t("No contact inquiries received yet.")}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Reply Dialog */}
            <Dialog open={replyOpen} onClose={() => setReplyOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {t("Reply to Inquiry")} - {activeInquiry?.name}
                </DialogTitle>
                <form onSubmit={handleReplySubmit}>
                    <DialogContent>
                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 2.5, border: '1px solid #e2e8f0' }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary">{t("Inquiry Message:")}</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: '#334155' }}>{activeInquiry?.message}</Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label={t("Email Reply Response")}
                            placeholder={t("Type your reply to the user...")}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button onClick={() => setReplyOpen(false)} sx={{ textTransform: 'none' }}>
                            {t("Cancel")}
                        </Button>
                        <Button
                            type="submit"
                            variant="outlined"
                            className="btn-outline-primary"
                            disabled={sendingReply}
                            startIcon={sendingReply ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                            sx={{
                                color: "var(--primary-color, #2563eb)",
                                borderColor: "var(--primary-color, #2563eb)",
                                backgroundColor: "transparent",
                                '&:hover': {
                                    color: '#ffffff',
                                    backgroundColor: 'var(--primary-color, #2563eb)',
                                    borderColor: 'var(--primary-color, #2563eb)'
                                },
                                '&:disabled': {
                                    color: 'var(--primary-color, #2563eb)',
                                    borderColor: 'var(--primary-color, #2563eb)',
                                    opacity: 0.6
                                },
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2.5
                            }}
                        >
                            {sendingReply ? t("Sending...") : t("Send Reply")}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default ContactInquiries;
