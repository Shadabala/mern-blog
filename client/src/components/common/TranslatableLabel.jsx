import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

const TranslatableLabel = ({
    label,
    required = false,
    currentLang = '',
    isTranslatable = true,
    fontSize = '0.875rem'
}) => {
    return (
        <Box display="inline-flex" alignItems="center" gap={0.8} sx={{ userSelect: 'none' }}>
            <Typography
                component="span"
                sx={{
                    fontSize,
                    fontWeight: 600,
                    color: '#334155'
                }}
            >
                {label}
                {required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
            </Typography>

            {isTranslatable && (
                <Tooltip title={currentLang ? `Translatable (${currentLang.toUpperCase()})` : 'Translatable'}>
                    <Box
                        component="span"
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 18,
                            height: 18,
                            borderRadius: '3px',
                            bgcolor: '#ffe4e6',
                            color: '#e11d48',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            lineHeight: 1,
                            cursor: 'help'
                        }}
                    >
                        🈳
                    </Box>
                </Tooltip>
            )}
        </Box>
    );
};

export default TranslatableLabel;
