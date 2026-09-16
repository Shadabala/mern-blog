import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { getFlagUrl } from '../../utils/languageFlags';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Common LanguageTabBar for forms (CategoryEdit, BlogEdit, PageEdit, Settings, etc.)
 * Dynamically fetches all active languages from MongoDB using the Language model.
 */
const LanguageTabBar = ({
    activeLang,
    selectedLang,
    onLangChange,
    onSelectLang,
    availableLanguages = [],
    languages: passedLanguages = []
}) => {
    const { languages: contextLanguages, fetchLanguages } = useLanguage();
    const [fallbackDbLanguages, setFallbackDbLanguages] = useState([]);

    // If context hasn't loaded languages yet, fetch directly from public languages API
    useEffect(() => {
        let isMounted = true;
        if ((!contextLanguages || contextLanguages.length === 0) && fallbackDbLanguages.length === 0) {
            axios.get(`${API_URL}/public/languages`)
                .then((res) => {
                    if (isMounted && res.data?.success && Array.isArray(res.data.languages)) {
                        setFallbackDbLanguages(res.data.languages);
                    }
                })
                .catch(() => {});
        }
        return () => {
            isMounted = false;
        };
    }, [contextLanguages, fallbackDbLanguages.length]);

    const currentSelected = String(activeLang || selectedLang || 'en').toLowerCase().trim();
    const handleSelect = onLangChange || onSelectLang || (() => {});

    // Determine the raw language list to display
    const rawLanguages = useMemo(() => {
        if (availableLanguages && availableLanguages.length > 0) {
            return availableLanguages;
        }
        if (passedLanguages && passedLanguages.length > 0) {
            return passedLanguages;
        }
        if (contextLanguages && contextLanguages.length > 0) {
            return contextLanguages;
        }
        if (fallbackDbLanguages && fallbackDbLanguages.length > 0) {
            return fallbackDbLanguages;
        }
        return [];
    }, [availableLanguages, passedLanguages, contextLanguages, fallbackDbLanguages]);

    // Filter active languages and deduplicate by code
    const displayLanguages = useMemo(() => {
        const seen = new Set();
        const result = [];

        for (const item of rawLanguages) {
            if (!item || !item.code) continue;
            if (item.isActive === false) continue;

            const normalizedCode = String(item.code).toLowerCase().trim();
            if (!seen.has(normalizedCode)) {
                seen.add(normalizedCode);
                result.push(item);
            }
        }

        return result;
    }, [rawLanguages]);

    if (displayLanguages.length === 0) {
        return null;
    }

    return (
        <Box sx={{ width: '100%', mb: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    width: '100%',
                    bgcolor: '#d1d5db',
                    borderRadius: '4px',
                    p: '3px',
                    gap: '3px',
                    flexWrap: 'wrap'
                }}
            >
                {displayLanguages.map((lang) => {
                    const langCode = String(lang.code).toLowerCase().trim();
                    const isSelected = currentSelected === langCode;
                    const flagUrl = getFlagUrl(lang.flag || lang.code);

                    return (
                        <Box
                            key={langCode}
                            onClick={() => handleSelect(langCode)}
                            role="tab"
                            aria-selected={isSelected}
                            sx={{
                                flex: 1,
                                minWidth: '120px',
                                py: 1.1,
                                px: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                cursor: 'pointer',
                                borderRadius: '3px',
                                bgcolor: isSelected ? '#ffffff' : 'transparent',
                                color: isSelected ? '#1e293b' : '#4b5563',
                                fontWeight: isSelected ? 600 : 500,
                                fontSize: '0.875rem',
                                boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.15s ease-in-out',
                                userSelect: 'none',
                                '&:hover': {
                                    bgcolor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)',
                                    color: '#111827'
                                }
                            }}
                        >
                            <Box
                                component="img"
                                src={flagUrl}
                                alt={lang.name || langCode}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/img/flags/us.png';
                                }}
                                sx={{
                                    width: 20,
                                    height: 14,
                                    borderRadius: '2px',
                                    objectFit: 'cover',
                                    boxShadow: '0 0.5px 1.5px rgba(0,0,0,0.15)',
                                    flexShrink: 0
                                }}
                            />
                            <Typography
                                component="span"
                                sx={{
                                    fontSize: '0.875rem',
                                    fontWeight: isSelected ? 600 : 500,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {lang.name || langCode.toUpperCase()}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default LanguageTabBar;
