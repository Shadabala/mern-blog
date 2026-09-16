import React from 'react';
import { Grid, Typography, Box } from '@mui/material';

/**
 * Reusable FormRow component for admin forms
 * Implements a 12-column grid layout:
 * - 4 columns for Label
 * - 8 columns for Input controls
 */
const FormRow = ({
    label,
    required = false,
    alignItems = 'center',
    children
}) => {
    return (
        <Grid container spacing={2} alignItems={alignItems}>
            <Grid item xs={12} sm={4}>
                <Box sx={{ pt: alignItems === 'flex-start' ? 0.75 : 0 }}>
                    {typeof label === 'string' ? (
                        <Typography
                            component="label"
                            sx={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#374151',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5
                            }}
                        >
                            {label}
                            {required && (
                                <Typography component="span" sx={{ color: '#ef4444', fontWeight: 700 }}>
                                    *
                                </Typography>
                            )}
                        </Typography>
                    ) : (
                        label
                    )}
                </Box>
            </Grid>
            <Grid item xs={12} sm={8}>
                {children}
            </Grid>
        </Grid>
    );
};

export default FormRow;
