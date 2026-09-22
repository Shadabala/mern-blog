import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Slide } from '@mui/material';
import { Cookie as CookieIcon } from '@mui/icons-material';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';

const CookiesAgreementBanner = () => {
    const { get_setting } = useSettings();
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);

    const showCookies = get_setting('show_cookies_agreement', 'off');
    const isEnabled = showCookies === 'on' || showCookies === true || showCookies === '1' || showCookies === 1;
    const cookiesText = get_setting('cookies_agreement_text', 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.');

    useEffect(() => {
        if (!isEnabled) {
            setOpen(false);
            return;
        }
        const accepted = localStorage.getItem('cookies_agreement_accepted');
        if (!accepted) {
            // Small delay for smooth entry
            const timer = setTimeout(() => setOpen(true), 1200);
            return () => clearTimeout(timer);
        }
    }, [isEnabled]);

    const handleAccept = () => {
        localStorage.setItem('cookies_agreement_accepted', 'true');
        setOpen(false);
    };

    if (!open || !isEnabled) return null;

    return (
        <Slide direction="up" in={open} mountOnEnter unmountOnExit>
            <Box
                sx={{
                    position: 'fixed',
                    bottom: { xs: 12, sm: 20 },
                    left: { xs: 12, sm: 20 },
                    right: { xs: 12, sm: 'auto' },
                    maxWidth: { sm: 460 },
                    zIndex: 9999
                }}
            >
                <Paper
                    elevation={8}
                    sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: '#1e293b',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Box display="flex" alignItems="flex-start" gap={1.5} mb={1.5}>
                        <CookieIcon sx={{ color: '#f59e0b', fontSize: 26, mt: 0.2 }} />
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#ffffff">
                                {t("Cookie Notice", "Cookie Notice")}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    mt: 0.5,
                                    fontSize: '0.825rem',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    lineHeight: 1.5,
                                    '& a': { color: '#60a5fa', textDecoration: 'underline' }
                                }}
                                dangerouslySetInnerHTML={{ __html: cookiesText }}
                            />
                        </Box>
                    </Box>

                    <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={handleAccept}
                            sx={{
                                bgcolor: 'var(--primary-color, #3b82f6)',
                                '&:hover': { bgcolor: 'var(--primary-hover-color, #2563eb)' },
                                color: '#ffffff',
                                fontWeight: 700,
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 2.5,
                                fontSize: '0.8rem'
                            }}
                        >
                            {t("Accept All", "Accept All")}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Slide>
    );
};

export default CookiesAgreementBanner;
