import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, IconButton, Typography, Box, TextField, Button,
    Stack
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon, CampaignOutlined as AnnounceIcon } from '@mui/icons-material';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const WebsitePopupModal = () => {
    const { get_setting } = useSettings();
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [subscribing, setSubscribing] = useState(false);

    const showPopup = get_setting('show_website_popup', 'off');
    const isEnabled = showPopup === 'on' || showPopup === true || showPopup === '1' || showPopup === 1;
    const popupContent = get_setting('website_popup_content', '');
    const showSubscribe = get_setting('show_subscribe_form', 'off');
    const isSubscribeEnabled = showSubscribe === 'on' || showSubscribe === true || showSubscribe === '1' || showSubscribe === 1;

    useEffect(() => {
        if (!isEnabled || !popupContent) {
            setOpen(false);
            return;
        }

        const dismissed = sessionStorage.getItem('website_popup_dismissed');
        if (!dismissed) {
            const timer = setTimeout(() => {
                setOpen(true);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [isEnabled, popupContent]);

    const handleClose = () => {
        sessionStorage.setItem('website_popup_dismissed', 'true');
        setOpen(false);
    };

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            toast.warning(t("Please enter a valid email address", "Please enter a valid email address"));
            return;
        }
        setSubscribing(true);
        setTimeout(() => {
            setSubscribing(false);
            toast.success(t("Thank you for subscribing to our updates!", "Thank you for subscribing to our updates!"));
            handleClose();
        }, 600);
    };

    if (!open || !isEnabled || !popupContent) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(0,0,0,0.06)'
                }
            }}
        >
            <Box position="relative">
                {/* Close Button */}
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'rgba(0,0,0,0.06)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.12)' },
                        zIndex: 10
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>

                <DialogContent sx={{ p: { xs: 3, sm: 4.5 } }}>
                    {/* Header Icon */}
                    <Box
                        sx={{
                            width: 54,
                            height: 54,
                            borderRadius: 3,
                            bgcolor: 'rgba(59, 247, 62, 0.12)',
                            color: 'var(--primary-color, #3b82f6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2.5
                        }}
                    >
                        <AnnounceIcon sx={{ fontSize: 32 }} />
                    </Box>

                    {/* Rich HTML Content from Appearance Settings */}
                    <Box
                        sx={{
                            color: '#334155',
                            fontSize: '0.95rem',
                            lineHeight: 1.65,
                            '& h1, & h2, & h3, & h4': { color: '#0f172a', mb: 1.5, fontWeight: 800 },
                            '& p': { mb: 1.5 },
                            '& img': { maxWidth: '100%', height: 'auto', borderRadius: 2 }
                        }}
                        dangerouslySetInnerHTML={{ __html: popupContent }}
                    />

                    {/* Optional Newsletter Subscribe Form */}
                    {isSubscribeEnabled && (
                        <Box component="form" onSubmit={handleSubscribe} sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #f1f5f9' }}>
                            <Typography variant="subtitle2" fontWeight={700} color="#1e293b" mb={1}>
                                {t("Subscribe to our Newsletter", "Subscribe to our Newsletter")}
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="email"
                                    placeholder={t("Enter your email address...", "Enter your email address...")}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}
                                />
                                <Button
                                    type="submit"
                                    variant="outlined"
                                    className="btn-outline-primary"
                                    disabled={subscribing}
                                    endIcon={<SendIcon sx={{ fontSize: 16 }} />}
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
                                        px: 3,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {t("Subscribe", "Subscribe")}
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </DialogContent>
            </Box>
        </Dialog>
    );
};

export default WebsitePopupModal;
