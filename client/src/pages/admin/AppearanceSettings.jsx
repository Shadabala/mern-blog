import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Stack,
    Switch,
    FormControlLabel,
    Paper,
} from '@mui/material';

import { Save as SaveIcon } from '@mui/icons-material';

import AizUploaderInput from '../../components/uploader/AizUploaderInput';
import AizTextEditor from '../../components/editor/AizTextEditor';

import {
    fetchAppearanceSettingsApi,
    updateAppearanceSettingsApi,
} from '../../api/admin.api';

import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';


/* =========================================
   Common Input Style
========================================= */

const inputSx = {
    '& .MuiOutlinedInput-root': {
        minHeight: '64px',
        borderRadius: '6px',
        backgroundColor: '#ffffff',

        '& fieldset': {
            borderColor: '#d9dde5',
            borderWidth: '1px',
        },

        '&:hover fieldset': {
            borderColor: '#c7ccd5',
        },

        '&.Mui-focused fieldset': {
            borderColor: '#aeb5c0',
            borderWidth: '1px',
        },
    },

    '& .MuiInputBase-input': {
        fontSize: '18px',
        color: '#707783',
        padding: '0 24px',
    },

    '& .MuiInputBase-input::placeholder': {
        color: '#858b98',
        opacity: 1,
    },
};


/* =========================================
   Textarea Style
========================================= */

const textareaSx = {
    ...inputSx,

    '& .MuiOutlinedInput-root': {
        minHeight: 'unset',
        borderRadius: '6px',
        backgroundColor: '#ffffff',

        '& fieldset': {
            borderColor: '#d9dde5',
            borderWidth: '1px',
        },

        '&:hover fieldset': {
            borderColor: '#c7ccd5',
        },

        '&.Mui-focused fieldset': {
            borderColor: '#aeb5c0',
            borderWidth: '1px',
        },
    },

    '& .MuiInputBase-input': {
        fontSize: '18px',
        color: '#707783',
        padding: '18px 24px',
        lineHeight: 1.5,
    },
};


/* =========================================
   Form Field Row
========================================= */

const FormFieldRow = ({
    label,
    children,
    helperText,
    alignItems = 'center',
}) => {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: '180px minmax(0, 1fr)',
                },
                columnGap: {
                    xs: 0,
                    sm: 2,
                },
                alignItems,
                width: '100%',
            }}
        >
            <Box
                sx={{
                    minWidth: 0,
                    mb: {
                        xs: 1,
                        sm: 0,
                    },
                }}
            >
                <Typography
                    sx={{
                        fontSize: '16px',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        color: '#202431',
                    }}
                >
                    {label}
                </Typography>
            </Box>

            <Box
                sx={{
                    minWidth: 0,
                    width: '100%',
                }}
            >
                {children}

                {helperText && (
                    <Typography
                        sx={{
                            fontSize: '13px',
                            lineHeight: 1.4,
                            color: '#687385',
                            mt: 0.75,
                        }}
                    >
                        {helperText}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};


/* =========================================
   Section Header
========================================= */

const SectionHeader = ({ children }) => {
    return (
        <Box
            sx={{
                px: {
                    xs: 2,
                    sm: 3,
                },
                py: 2.25,
                borderBottom: '1px solid #e1e5ea',
            }}
        >
            <Typography
                sx={{
                    fontSize: '18px',
                    fontWeight: 500,
                    color: '#202431',
                }}
            >
                {children}
            </Typography>
        </Box>
    );
};


/* =========================================
   Toggle Row
========================================= */

const ToggleRow = ({
    label,
    checked,
    onChange,
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                minHeight: '48px',
            }}
        >
            <Typography
                sx={{
                    fontSize: '16px',
                    color: '#202431',
                }}
            >
                {label}
            </Typography>

            <Switch
                checked={checked}
                onChange={(e) =>
                    onChange(e.target.checked)
                }
            />
        </Box>
    );
};


const AppearanceSettings = () => {
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [alertMessage, setAlertMessage] = useState({
        type: 'info',
        text: '',
    });

    const [form, setForm] = useState({
        site_name: '',
        website_name: '',
        site_motto: '',

        site_icon: '',
        system_logo_white: '',
        system_logo_black: '',

        primary_color: '#3b82f6',
        primary_hover_color: '#2563eb',
        secondary_color: '#64748b',

        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        meta_image: '',

        cookies_agreement_text: '',
        show_cookies_agreement: 'off',

        show_website_popup: 'off',
        website_popup_content: '',

        show_subscribe_form: 'off',

        header_script: '',
        footer_script: '',
    });


    /* =========================================
       Load Settings
    ========================================= */

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);

                const res =
                    await fetchAppearanceSettingsApi();

                if (res?.success && res.settings) {
                    setForm((prev) => ({
                        ...prev,
                        ...res.settings,
                    }));
                }
            } catch (err) {
                console.error(
                    'Failed to load appearance settings:',
                    err
                );

                setAlertMessage({
                    type: 'error',
                    text: t(
                        'Failed to load appearance settings'
                    ),
                });
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [t]);


    /* =========================================
       Field Change
    ========================================= */

    const handleFieldChange = (
        field,
        value
    ) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };


    /* =========================================
       Submit
    ========================================= */

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);

            setAlertMessage({
                type: 'info',
                text: '',
            });

            await updateAppearanceSettingsApi(
                form
            );

            const successMsg = t(
                'Appearance settings updated successfully',
                'Appearance settings updated successfully'
            );
            setAlertMessage({
                type: 'success',
                text: successMsg,
            });
            toast.success(successMsg);
        } catch (err) {
            console.error(
                'Failed to update appearance settings:',
                err
            );

            const errorMsg =
                err.response?.data?.message ||
                t('Failed to update settings', 'Failed to update settings');
            setAlertMessage({
                type: 'error',
                text: errorMsg,
            });
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };


    /* =========================================
       Loading
    ========================================= */

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '400px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }


    return (
        <Box
            sx={{
                maxWidth: '920px',
                mx: 'auto',
                px: {
                    xs: 2,
                    sm: 3,
                },
                py: {
                    xs: 2,
                    md: 4,
                },
                pb: 6,
                backgroundColor: '#f7f8fa',
            }}
        >

            {/* =================================
                Alert
            ================================= */}

            {alertMessage.text && (
                <Alert
                    severity={alertMessage.type}
                    onClose={() =>
                        setAlertMessage({
                            type: 'info',
                            text: '',
                        })
                    }
                    sx={{
                        mb: 2,
                        borderRadius: '8px',
                    }}
                >
                    {alertMessage.text}
                </Alert>
            )}


            <form onSubmit={handleSubmit}>

                <Stack spacing={2}>

                    {/* =================================
                        System Settings
                    ================================= */}

                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid #e1e5ea',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <SectionHeader>
                            {t('System Settings')}
                        </SectionHeader>

                        <Stack
                            spacing={2.5}
                            sx={{
                                p: {
                                    xs: 2,
                                    sm: 3,
                                },
                            }}
                        >

                            <FormFieldRow
                                label={t('System Name')}
                            >
                                <TextField
                                    fullWidth
                                    value={
                                        form.site_name || ''
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'site_name',
                                            e.target.value
                                        )
                                    }
                                    placeholder={t(
                                        'System Name'
                                    )}
                                    sx={inputSx}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t(
                                    'Frontend Website Name'
                                )}
                            >
                                <TextField
                                    fullWidth
                                    value={
                                        form.website_name ||
                                        ''
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'website_name',
                                            e.target.value
                                        )
                                    }
                                    placeholder={t(
                                        'Website Name'
                                    )}
                                    sx={inputSx}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t('Site Motto')}
                            >
                                <TextField
                                    fullWidth
                                    value={
                                        form.site_motto || ''
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'site_motto',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Winning is a habit"
                                    sx={inputSx}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t(
                                    'Site Icon (Favicon)'
                                )}
                                alignItems="flex-start"
                            >
                                <AizUploaderInput
                                    value={
                                        form.site_icon
                                    }
                                    onChange={(url) =>
                                        handleFieldChange(
                                            'site_icon',
                                            url
                                        )
                                    }
                                    placeholder={t(
                                        'Choose Favicon (32x32)'
                                    )}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t(
                                    'System Logo - White'
                                )}
                                alignItems="flex-start"
                            >
                                <AizUploaderInput
                                    value={
                                        form.system_logo_white
                                    }
                                    onChange={(url) =>
                                        handleFieldChange(
                                            'system_logo_white',
                                            url
                                        )
                                    }
                                    placeholder={t(
                                        'Choose White Logo'
                                    )}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t(
                                    'System Logo - Black / Dark'
                                )}
                                alignItems="flex-start"
                            >
                                <AizUploaderInput
                                    value={
                                        form.system_logo_black
                                    }
                                    onChange={(url) =>
                                        handleFieldChange(
                                            'system_logo_black',
                                            url
                                        )
                                    }
                                    placeholder={t(
                                        'Choose Dark Logo'
                                    )}
                                />
                            </FormFieldRow>

                        </Stack>
                    </Paper>


                    {/* =================================
                        Color Settings
                    ================================= */}

                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid #e1e5ea',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <SectionHeader>
                            {t('Color Settings')}
                        </SectionHeader>

                        <Stack
                            spacing={2.5}
                            sx={{
                                p: {
                                    xs: 2,
                                    sm: 3,
                                },
                            }}
                        >

                            <FormFieldRow
                                label={t(
                                    'Primary Color'
                                )}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 1.5,
                                        alignItems:
                                            'center',
                                    }}
                                >
                                    <Box
                                        component="input"
                                        type="color"
                                        value={
                                            form.primary_color ||
                                            '#3b82f6'
                                        }
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'primary_color',
                                                e.target.value
                                            )
                                        }
                                        sx={{
                                            width: '64px',
                                            height: '64px',
                                            p: 0.5,
                                            border:
                                                '1px solid #d9dde5',
                                            borderRadius:
                                                '6px',
                                            background:
                                                '#ffffff',
                                            cursor:
                                                'pointer',
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        value={
                                            form.primary_color ||
                                            ''
                                        }
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'primary_color',
                                                e.target.value
                                            )
                                        }
                                        placeholder="#3b82f6"
                                        sx={inputSx}
                                    />
                                </Box>
                            </FormFieldRow>


                            <FormFieldRow
                                label={t(
                                    'Primary Hover Color'
                                )}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 1.5,
                                        alignItems:
                                            'center',
                                    }}
                                >
                                    <Box
                                        component="input"
                                        type="color"
                                        value={
                                            form.primary_hover_color ||
                                            '#2563eb'
                                        }
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'primary_hover_color',
                                                e.target.value
                                            )
                                        }
                                        sx={{
                                            width: '64px',
                                            height: '64px',
                                            p: 0.5,
                                            border:
                                                '1px solid #d9dde5',
                                            borderRadius:
                                                '6px',
                                            background:
                                                '#ffffff',
                                            cursor:
                                                'pointer',
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        value={
                                            form.primary_hover_color ||
                                            ''
                                        }
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'primary_hover_color',
                                                e.target.value
                                            )
                                        }
                                        placeholder="#2563eb"
                                        sx={inputSx}
                                    />
                                </Box>
                            </FormFieldRow>


                            <FormFieldRow
                                label={t(
                                    'Secondary Color'
                                )}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 1.5,
                                        alignItems:
                                            'center',
                                    }}
                                >
                                    <Box
                                        component="input"
                                        type="color"
                                        value={
                                            form.secondary_color ||
                                            '#64748b'
                                        }
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'secondary_color',
                                                e.target.value
                                            )
                                        }
                                        sx={{
                                            width: '64px',
                                            height: '64px',
                                            p: 0.5,
                                            border:
                                                '1px solid #d9dde5',
                                            borderRadius:
                                                '6px',
                                            background:
                                                '#ffffff',
                                            cursor:
                                                'pointer',
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        value={
                                            form.secondary_color ||
                                            ''
                                        }
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'secondary_color',
                                                e.target.value
                                            )
                                        }
                                        placeholder="#64748b"
                                        sx={inputSx}
                                    />
                                </Box>
                            </FormFieldRow>

                        </Stack>
                    </Paper>


                    {/* =================================
                        Global SEO
                    ================================= */}

                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid #e1e5ea',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <SectionHeader>
                            {t('Global SEO Settings')}
                        </SectionHeader>

                        <Stack
                            spacing={2.5}
                            sx={{
                                p: {
                                    xs: 2,
                                    sm: 3,
                                },
                            }}
                        >

                            <FormFieldRow
                                label={t('Meta Title')}
                            >
                                <TextField
                                    fullWidth
                                    value={
                                        form.meta_title ||
                                        ''
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'meta_title',
                                            e.target.value
                                        )
                                    }
                                    placeholder={t(
                                        'Meta Title'
                                    )}
                                    sx={inputSx}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t(
                                    'Meta Description'
                                )}
                                alignItems="flex-start"
                            >
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={
                                        form.meta_description ||
                                        ''
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'meta_description',
                                            e.target.value
                                        )
                                    }
                                    placeholder={t(
                                        'Meta Description'
                                    )}
                                    sx={textareaSx}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t('Keywords')}
                            >
                                <TextField
                                    fullWidth
                                    value={
                                        form.meta_keywords ||
                                        ''
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'meta_keywords',
                                            e.target.value
                                        )
                                    }
                                    placeholder="blog, tech, articles, lifestyle"
                                    sx={inputSx}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t('Meta Image')}
                                alignItems="flex-start"
                            >
                                <AizUploaderInput
                                    value={
                                        form.meta_image
                                    }
                                    onChange={(url) =>
                                        handleFieldChange(
                                            'meta_image',
                                            url
                                        )
                                    }
                                    placeholder={t(
                                        'Choose Meta Image'
                                    )}
                                />
                            </FormFieldRow>

                        </Stack>
                    </Paper>


                    {/* =================================
                        Cookies Agreement
                    ================================= */}

                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid #e1e5ea',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <SectionHeader>
                            {t('Cookies Agreement')}
                        </SectionHeader>

                        <Stack
                            spacing={2.5}
                            sx={{
                                p: {
                                    xs: 2,
                                    sm: 3,
                                },
                            }}
                        >

                            <ToggleRow
                                label={t(
                                    'Show Cookies Agreement?'
                                )}
                                checked={
                                    form.show_cookies_agreement ===
                                    'on' ||
                                    form.show_cookies_agreement ===
                                    true
                                }
                                onChange={(checked) =>
                                    handleFieldChange(
                                        'show_cookies_agreement',
                                        checked
                                            ? 'on'
                                            : 'off'
                                    )
                                }
                            />


                            <FormFieldRow
                                label={t(
                                    'Cookies Agreement Text'
                                )}
                                alignItems="flex-start"
                            >
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={
                                        form.cookies_agreement_text ||
                                        ''
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'cookies_agreement_text',
                                            e.target.value
                                        )
                                    }
                                    placeholder={t(
                                        'We use cookies to improve your user experience...'
                                    )}
                                    sx={textareaSx}
                                />
                            </FormFieldRow>

                        </Stack>
                    </Paper>


                    {/* =================================
                        Website Popup
                    ================================= */}

                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid #e1e5ea',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <SectionHeader>
                            {t('Website Popup')}
                        </SectionHeader>

                        <Stack
                            spacing={2.5}
                            sx={{
                                p: {
                                    xs: 2,
                                    sm: 3,
                                },
                            }}
                        >

                            <ToggleRow
                                label={t(
                                    'Show website popup?'
                                )}
                                checked={
                                    form.show_website_popup ===
                                    'on' ||
                                    form.show_website_popup ===
                                    true
                                }
                                onChange={(checked) =>
                                    handleFieldChange(
                                        'show_website_popup',
                                        checked
                                            ? 'on'
                                            : 'off'
                                    )
                                }
                            />


                            <FormFieldRow
                                label={t(
                                    'Popup content'
                                )}
                                alignItems="flex-start"
                            >
                                <AizTextEditor
                                    value={
                                        form.website_popup_content ||
                                        ''
                                    }
                                    onChange={(val) =>
                                        handleFieldChange(
                                            'website_popup_content',
                                            val
                                        )
                                    }
                                    placeholder={t(
                                        'Write popup content...'
                                    )}
                                />
                            </FormFieldRow>


                            <Box
                                sx={{
                                    borderTop:
                                        '1px solid #e1e5ea',
                                    pt: 2,
                                }}
                            >
                                <ToggleRow
                                    label={t(
                                        'Show Subscriber form?'
                                    )}
                                    checked={
                                        form.show_subscribe_form ===
                                        'on' ||
                                        form.show_subscribe_form ===
                                        true
                                    }
                                    onChange={(checked) =>
                                        handleFieldChange(
                                            'show_subscribe_form',
                                            checked
                                                ? 'on'
                                                : 'off'
                                        )
                                    }
                                />
                            </Box>

                        </Stack>
                    </Paper>


                    {/* =================================
                        Custom Scripts
                    ================================= */}

                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid #e1e5ea',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <SectionHeader>
                            {t('Custom Script')}
                        </SectionHeader>

                        <Stack
                            spacing={3}
                            sx={{
                                p: {
                                    xs: 2,
                                    sm: 3,
                                },
                            }}
                        >

                            <FormFieldRow
                                label={t(
                                    'Header custom script - before </head>'
                                )}
                                alignItems="flex-start"
                                helperText={t(
                                    'Write script with <script> tag'
                                )}
                            >
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    value={
                                        form.header_script ||
                                        ''
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'header_script',
                                            e.target.value
                                        )
                                    }
                                    placeholder={
                                        '<script>\n...\n</script>'
                                    }
                                    sx={{
                                        ...textareaSx,

                                        '& .MuiInputBase-input': {
                                            fontFamily:
                                                'monospace',
                                            fontSize:
                                                '15px',
                                            color:
                                                '#4b5563',
                                            padding:
                                                '18px 24px',
                                            lineHeight:
                                                1.6,
                                        },
                                    }}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t(
                                    'Footer custom script - before </body>'
                                )}
                                alignItems="flex-start"
                                helperText={t(
                                    'Write script with <script> tag'
                                )}
                            >
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    value={
                                        form.footer_script ||
                                        ''
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'footer_script',
                                            e.target.value
                                        )
                                    }
                                    placeholder={
                                        '<script>\n...\n</script>'
                                    }
                                    sx={{
                                        ...textareaSx,

                                        '& .MuiInputBase-input': {
                                            fontFamily:
                                                'monospace',
                                            fontSize:
                                                '15px',
                                            color:
                                                '#4b5563',
                                            padding:
                                                '18px 24px',
                                            lineHeight:
                                                1.6,
                                        },
                                    }}
                                />
                            </FormFieldRow>

                        </Stack>
                    </Paper>


                    {/* =================================
                        Submit
                    ================================= */}

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            pt: 1,
                        }}
                    >
                        <Button
                            type="submit"
                            variant="outlined"
                            disabled={saving}
                            startIcon={
                                saving ? (
                                    <CircularProgress
                                        size={18}
                                    />
                                ) : (
                                    <SaveIcon />
                                )
                            }
                            sx={{
                                minWidth: '120px',
                                height: '42px',
                                borderColor: '#f59e0b',
                                color: '#d97706',
                                borderRadius: '6px',
                                textTransform: 'none',
                                fontSize: '15px',
                                fontWeight: 500,

                                '&:hover': {
                                    borderColor:
                                        '#d97706',
                                    backgroundColor:
                                        '#fff7ed',
                                },
                            }}
                        >
                            {saving
                                ? t('Updating...')
                                : t('Update')}
                        </Button>
                    </Box>

                </Stack>

            </form>
        </Box>
    );
};


export default AppearanceSettings;